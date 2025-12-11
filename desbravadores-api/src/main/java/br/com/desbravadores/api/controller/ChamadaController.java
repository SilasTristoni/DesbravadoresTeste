package br.com.desbravadores.api.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import br.com.desbravadores.api.dto.AttendanceReportDTO;
import br.com.desbravadores.api.model.AttendanceRecord;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.AttendanceRecordRepository;
import br.com.desbravadores.api.repository.UserRepository;

@RestController
@RequestMapping("/api/chamada")
public class ChamadaController {

    private static final Logger logger = LoggerFactory.getLogger(ChamadaController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    /**
     * DTO interno para recebimento de dados de presença (Input).
     */
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
            logger.warn("Tentativa de chamada por monitor sem grupo: {}", monitor.getEmail());
            return ResponseEntity.status(403).body(Map.of("message", "Erro: O monitor não está associado a nenhum grupo."));
        }

        LocalDate date = payload.getDate();

        if (date.isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro: Não é possível registrar chamada futura."));
        }

        List<AttendanceRecord> existing = attendanceRepository.findByGroupIdAndDate(monitorGroup.getId(), date);
        if (!existing.isEmpty()) {
             return ResponseEntity.badRequest().body(Map.of("message", "Erro: Já existe uma chamada para esta data."));
        }

        List<User> allMembers = userRepository.findByGroupIdAndRole(monitorGroup.getId(), Role.DESBRAVADOR);
        List<Long> presentIdsPayload = payload.getPresentUserIds() != null ? payload.getPresentUserIds() : List.of();

        List<AttendanceRecord> records = allMembers.stream().map(member -> {
            AttendanceRecord record = new AttendanceRecord();
            record.setUser(member);
            record.setGroup(monitorGroup);
            record.setDate(date);
            record.setRecordedBy(monitor);
            record.setPresent(presentIdsPayload.contains(member.getId()));
            return record;
        }).collect(Collectors.toList());

        if (records.isEmpty()) {
             return ResponseEntity.badRequest().body(Map.of("message", "Erro: O grupo não possui membros para registrar chamada."));
        }

        attendanceRepository.saveAll(records);
        logger.info("Chamada registrada com sucesso pelo monitor {} para a data {}", monitor.getEmail(), date);

        return ResponseEntity.ok(Map.of("message", "Chamada registrada com sucesso!"));
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

        try {
            LocalDate date = LocalDate.parse(dateString);
            User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
            
            Long targetGroupId = (currentUser.getRole() == Role.DIRETOR && groupId != null) ? groupId : 
                                 (currentUser.getGroup() != null ? currentUser.getGroup().getId() : null);

            if (targetGroupId == null) return ResponseEntity.badRequest().build();

            List<User> members = userRepository.findByGroupId(targetGroupId);
            members.removeIf(u -> u.getRole() == Role.DIRETOR);
            
            List<AttendanceRecord> records = attendanceRepository.findByGroupIdAndDate(targetGroupId, date);
            
            Set<Long> presentIds = records.stream()
                    .filter(AttendanceRecord::isPresent)
                    .map(r -> r.getUser().getId())
                    .collect(Collectors.toSet());

            StringBuilder csv = new StringBuilder();
            csv.append('\uFEFF'); // BOM para Excel
            
            csv.append("ID do Sistema;Nome Completo;Status da Presenca;Data\n");
            
            for (User u : members) {
                String status = presentIds.contains(u.getId()) ? "PRESENTE" : "AUSENTE";
                String fullName = (u.getName() + " " + u.getSurname()).replace(";", "");
                
                csv.append(u.getId()).append(";")
                    .append(fullName).append(";")
                    .append(status).append(";")
                    .append(date).append("\n");
            }

            byte[] csvBytes = csv.toString().getBytes(StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chamada_" + date + ".csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvBytes);
                    
        } catch (Exception e) {
            logger.error("Erro ao exportar CSV. Data: {}", dateString, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/report")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<List<AttendanceReportDTO>> getAttendanceReport(
            @RequestParam("date") String dateString,
            @RequestParam(value = "groupId", required = false) Long groupId,
            Authentication authentication) {

        try {
            LocalDate date = LocalDate.parse(dateString);
            User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
            
            Long targetGroupId;

            if (currentUser.getRole() == Role.DIRETOR) {
                if (groupId == null) {
                    logger.warn("Requisição de relatório sem GroupID por Diretor: {}", currentUser.getEmail());
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
            
            Set<Long> presentIds = records.stream()
                    .filter(AttendanceRecord::isPresent)
                    .map(record -> record.getUser().getId())
                    .collect(Collectors.toSet());

            // Uso do DTO para resposta
            List<AttendanceReportDTO> report = members.stream().map(user -> {
                boolean isPresent = presentIds.contains(user.getId());
               // COMO DEVE FICAR (CORRETO):
                String avatar = user.getAvatar() != null ? user.getAvatar() : "assets/images/escoteiro1.png";
                
                return new AttendanceReportDTO(
                    user.getId(),
                    user.getName() + " " + user.getSurname(),
                    isPresent ? "PRESENTE" : "AUSENTE",
                    avatar
                );
            }).collect(Collectors.toList());

            return ResponseEntity.ok(report);

        } catch (Exception e) {
            logger.error("Erro crítico ao gerar relatório de chamada. Data: {}, Usuário: {}", dateString, authentication.getName(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}