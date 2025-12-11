package br.com.desbravadores.api.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

@RestController
@RequestMapping("/api/chamada")
public class ChamadaController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    // DTO interno para receber os dados do front-end
    public static class AttendancePayload {
        private LocalDate date;
        private List<Long> presentUserIds;

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public List<Long> getPresentUserIds() { return presentUserIds; }
        public void setPresentUserIds(List<Long> presentUserIds) { this.presentUserIds = presentUserIds; }
    }

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

        if (date.isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro: Não é possível registrar chamada futura."));
        }

        // Verifica se já existem registros para essa data e grupo (seja presente ou ausente)
        List<AttendanceRecord> existing = attendanceRepository.findByGroupIdAndDate(monitorGroup.getId(), date);
        if (!existing.isEmpty()) {
             return ResponseEntity.badRequest().body(Map.of("message", "Erro: Já existe uma chamada para esta data."));
        }

        // Busca TODOS os membros para registrar quem veio e quem faltou
        List<User> allMembers = userRepository.findByGroupIdAndRole(monitorGroup.getId(), Role.DESBRAVADOR);
        
        List<Long> presentIdsPayload = payload.getPresentUserIds();

        List<AttendanceRecord> records = allMembers.stream().map(member -> {
            AttendanceRecord record = new AttendanceRecord();
            record.setUser(member);
            record.setGroup(monitorGroup);
            record.setDate(date);
            record.setRecordedBy(monitor);
            
            // Define o novo campo 'present' baseado na lista enviada pelo front
            boolean isPresent = presentIdsPayload.contains(member.getId());
            record.setPresent(isPresent);
            
            return record;
        }).collect(Collectors.toList());

        if (records.isEmpty()) {
             return ResponseEntity.badRequest().body(Map.of("message", "Erro: O grupo não possui membros para registrar chamada."));
        }

        attendanceRepository.saveAll(records);

        return ResponseEntity.ok(Map.of("message", "Chamada registada com sucesso!"));
    }

    @GetMapping("/check-existence")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<Map<String, Boolean>> checkAttendanceExistence(
            @RequestParam("date") String dateString,
            Authentication authentication) {
        
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Group group = currentUser.getGroup();
        
        if (group == null) return ResponseEntity.ok(Map.of("exists", false));

        LocalDate date = LocalDate.parse(dateString);
        // Agora verifica se existe QUALQUER registro (presente ou ausente)
        boolean exists = !attendanceRepository.findByGroupIdAndDate(group.getId(), date).isEmpty();
        
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @GetMapping("/dates-with-records")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    public ResponseEntity<List<String>> getDatesWithRecords(
            @RequestParam(value = "groupId", required = false) Long groupId) {
        
        List<AttendanceRecord> records = attendanceRepository.findAll(); 
        
        List<String> dates = records.stream()
                .filter(r -> groupId == null || (r.getGroup() != null && r.getGroup().getId().equals(groupId)))
                .map(r -> r.getDate().toString())
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        return ResponseEntity.ok(dates);
    }

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
        
        List<AttendanceRecord> records = attendanceRepository.findByGroupIdAndDate(targetGroupId, date);
        
        // Filtra os IDs de quem estava com status 'present = true'
        Set<Long> presentIds = records.stream()
                .filter(AttendanceRecord::isPresent)
                .map(r -> r.getUser().getId())
                .collect(Collectors.toSet());

        StringBuilder csv = new StringBuilder();
        csv.append('\uFEFF'); // BOM para Excel
        
        csv.append("ID do Sistema;Nome Completo;Status da Presenca;Data\n");
        
        for (User u : members) {
            String status = presentIds.contains(u.getId()) ? "PRESENTE" : "AUSENTE";
            csv.append(u.getId()).append(";")
                .append(u.getName()).append(" ").append(u.getSurname()).append(";")
                .append(status).append(";")
                .append(date).append("\n");
        }

        byte[] csvBytes = csv.toString().getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chamada_" + date + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }
    
    @GetMapping("/report")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<List<Map<String, Object>>> getAttendanceReport(
            @RequestParam("date") String dateString,
            @RequestParam(value = "groupId", required = false) Long groupId,
            Authentication authentication) {

        try {
            LocalDate date = LocalDate.parse(dateString);
            User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
            
            Long targetGroupId;

            if (currentUser.getRole() == Role.DIRETOR) {
                if (groupId == null) {
                    return ResponseEntity.badRequest().body(List.of()); 
                }
                targetGroupId = groupId;
            } else {
                if (currentUser.getGroup() == null) {
                    return ResponseEntity.badRequest().body(List.of());
                }
                targetGroupId = currentUser.getGroup().getId();
            }

            List<User> members = userRepository.findByGroupIdAndRole(targetGroupId, Role.DESBRAVADOR);
            List<AttendanceRecord> records = attendanceRepository.findByGroupIdAndDate(targetGroupId, date);
            
            // Filtra os IDs de quem estava com status 'present = true'
            Set<Long> presentIds = records.stream()
                    .filter(AttendanceRecord::isPresent)
                    .map(record -> record.getUser().getId())
                    .collect(Collectors.toSet());

            List<Map<String, Object>> report = members.stream().map(user -> {
                boolean isPresent = presentIds.contains(user.getId());
                
                Map<String, Object> item = new HashMap<>();
                item.put("id", user.getId());
                item.put("name", user.getName() + " " + user.getSurname());
                item.put("status", isPresent ? "PRESENTE" : "AUSENTE");
                item.put("avatar", user.getAvatar() != null ? user.getAvatar() : "img/escoteiro1.png");
                
                return item;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(report);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}