package br.com.desbravadores.api.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired; // NOVO
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType; // NOVO
import org.springframework.http.ResponseEntity;   // NOVO
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.AttendanceRecord;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.AttendanceRecordRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.AttendanceService;

class AttendancePayload {
    private LocalDate date;
    private List<Long> presentUserIds;
    // getters setters
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public List<Long> getPresentUserIds() { return presentUserIds; }
    public void setPresentUserIds(List<Long> presentUserIds) { this.presentUserIds = presentUserIds; }
}

@RestController
@RequestMapping("/api/chamada")
public class ChamadaController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping("/my-group-members")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<List<User>> getMyGroupMembers(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if (currentUser.getGroup() == null) {
            return ResponseEntity.ok(List.of());
        }
        List<User> members = userRepository.findByGroupIdAndRole(currentUser.getGroup().getId(), Role.DESBRAVADOR);
        return ResponseEntity.ok(members);
    }

    @PostMapping("/submit")
    @PreAuthorize("hasAuthority('MONITOR')")
    @Transactional
    public ResponseEntity<?> submitAttendance(@RequestBody AttendancePayload payload, Authentication authentication) {
        User monitor = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Group monitorGroup = monitor.getGroup();
        
        if (monitorGroup == null) {
            return ResponseEntity.status(403).body(Map.of("message", "Erro: O monitor não está associado a nenhum grupo."));
        }

        LocalDate date = payload.getDate();

        // 1. VALIDAÇÃO DE DATA
        if (date.isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro: Não é possível registrar chamada futura."));
        }

        // 2. VALIDAÇÃO DE DUPLICIDADE
        List<AttendanceRecord> existing = attendanceRepository.findByGroupIdAndDate(monitorGroup.getId(), date);
        if (!existing.isEmpty()) {
             return ResponseEntity.badRequest().body(Map.of("message", "Erro: Já existe uma chamada para esta data."));
        }

        List<User> presentUsers = userRepository.findAllById(payload.getPresentUserIds());
        
        List<AttendanceRecord> records = presentUsers.stream().map(user -> {
            AttendanceRecord record = new AttendanceRecord();
            record.setUser(user);
            record.setGroup(monitorGroup);
            record.setDate(date);
            record.setRecordedBy(monitor);
            return record;
        }).collect(Collectors.toList());

        attendanceRepository.saveAll(records);

        return ResponseEntity.ok(Map.of("message", "Chamada registada com sucesso!"));
    }

    // 3. NOVO ENDPOINT DE EXPORTAÇÃO CSV
    @GetMapping("/export-csv")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<byte[]> exportAttendanceCsv(
            @RequestParam("date") String dateString,
            @RequestParam(value = "groupId", required = false) Long groupId,
            Authentication authentication) {

        LocalDate date = LocalDate.parse(dateString);
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Long targetGroupId = (currentUser.getRole() == Role.DIRETOR && groupId != null) ? groupId : 
                             (currentUser.getGroup() != null ? currentUser.getGroup().getId() : null);

        if (targetGroupId == null) return ResponseEntity.badRequest().build();

        List<User> members = userRepository.findByGroupId(targetGroupId);
        members.removeIf(u -> u.getRole() == Role.DIRETOR);
        
        List<AttendanceRecord> presents = attendanceRepository.findByGroupIdAndDate(targetGroupId, date);
        Set<Long> presentIds = presents.stream().map(r -> r.getUser().getId()).collect(Collectors.toSet());

        StringBuilder csv = new StringBuilder("ID,Nome,Sobrenome,Status,Data\n");
        for (User u : members) {
            String status = presentIds.contains(u.getId()) ? "PRESENTE" : "AUSENTE";
            csv.append(u.getId()).append(",")
               .append(u.getName()).append(",")
               .append(u.getSurname()).append(",")
               .append(status).append(",")
               .append(date).append("\n");
        }

        byte[] csvBytes = csv.toString().getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chamada_" + date + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    // ... (manter getMyAttendanceHistory e getAttendanceReport se necessário) ...
}