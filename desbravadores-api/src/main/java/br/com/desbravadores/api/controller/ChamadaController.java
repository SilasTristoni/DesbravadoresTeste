package br.com.desbravadores.api.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.desbravadores.api.dto.AttendanceHistoryDTO;
import br.com.desbravadores.api.dto.AttendanceReportDTO;
import br.com.desbravadores.api.dto.MemberDTO;
import br.com.desbravadores.api.model.AttendanceRecord;
import br.com.desbravadores.api.model.CorrectionRequest;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Notification;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.AttendanceRecordRepository;
import br.com.desbravadores.api.repository.CorrectionRequestRepository;
import br.com.desbravadores.api.repository.NotificationRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.AttendanceService;

@RestController
@RequestMapping("/api/chamada")
public class ChamadaController {

    private static final Logger logger = LoggerFactory.getLogger(ChamadaController.class);

    @Autowired private UserRepository userRepository;
    @Autowired private AttendanceRecordRepository attendanceRepository;
    @Autowired private CorrectionRequestRepository correctionRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AttendanceService attendanceService;

    public static class AttendancePayload {
        private LocalDate date;
        private List<Long> presentUserIds;
        private Map<Long, String> justifications;

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public List<Long> getPresentUserIds() { return presentUserIds; }
        public void setPresentUserIds(List<Long> presentUserIds) { this.presentUserIds = presentUserIds; }
        public Map<Long, String> getJustifications() { return justifications; }
        public void setJustifications(Map<Long, String> justifications) { this.justifications = justifications; }
    }

    @GetMapping("/my-group-members")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<List<MemberDTO>> getMyGroupMembers(Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName()).orElseThrow();
        if (currentUser.getGroup() == null) return ResponseEntity.ok(List.of());
        List<MemberDTO> members = userRepository.findByGroupIdAndRole(currentUser.getGroup().getId(), Role.DESBRAVADOR)
                .stream()
                .map(MemberDTO::new)
                .toList();
        return ResponseEntity.ok(members);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('DESBRAVADOR')")
    public ResponseEntity<List<AttendanceHistoryDTO>> getAttendanceHistory(Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(attendanceService.getUserAttendanceHistory(currentUser));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasAuthority('MONITOR')")
    @Transactional
    public ResponseEntity<?> submitAttendance(@RequestBody AttendancePayload payload, Authentication authentication) {
        User monitor = userRepository.findByUsername(authentication.getName()).orElseThrow();
        Group monitorGroup = monitor.getGroup();
        
        if (monitorGroup == null) return ResponseEntity.status(403).body(Map.of("message", "Erro: Monitor sem grupo."));

        LocalDate date = payload.getDate();
        if (date.isAfter(LocalDate.now())) return ResponseEntity.badRequest().body(Map.of("message", "Erro: Data futura."));
        
        long daysDiff = ChronoUnit.DAYS.between(date, LocalDate.now());
        if (daysDiff > 7) return ResponseEntity.badRequest().body(Map.of("message", "Erro: Prazo de 7 dias expirado."));

        List<AttendanceRecord> existing = attendanceRepository.findByGroupIdAndDate(monitorGroup.getId(), date);
        if (!existing.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Erro: Já existe chamada. Use a correção."));

        List<User> allMembers = userRepository.findByGroupIdAndRole(monitorGroup.getId(), Role.DESBRAVADOR);
        List<Long> presentIds = payload.getPresentUserIds() != null ? payload.getPresentUserIds() : List.of();
        Map<Long, String> justifications = payload.getJustifications() != null ? payload.getJustifications() : Map.of();

        List<AttendanceRecord> records = allMembers.stream().map(member -> {
            AttendanceRecord record = new AttendanceRecord();
            record.setUser(member);
            record.setGroup(monitorGroup);
            record.setDate(date);
            record.setRecordedBy(monitor);
            
            boolean isPresent = presentIds.contains(member.getId());
            record.setPresent(isPresent);

            if (!isPresent && justifications.containsKey(member.getId())) {
                record.setJustification(justifications.get(member.getId()));
            }
            return record;
        }).collect(Collectors.toList());

        if (records.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Erro: Grupo vazio."));

        attendanceRepository.saveAll(records);
        return ResponseEntity.ok(Map.of("message", "Chamada registrada com sucesso!"));
    }

    @PostMapping("/request-correction")
    @PreAuthorize("hasAuthority('MONITOR')")
    @Transactional
    public ResponseEntity<?> requestCorrection(@RequestBody AttendancePayload payload, Authentication authentication) {
        User monitor = userRepository.findByUsername(authentication.getName()).orElseThrow();
        Group group = monitor.getGroup();

        if (group == null) return ResponseEntity.status(403).build();

        // 1. BLOQUEIO DE DUPLICIDADE: Verifica se já existe pendente
        boolean hasPending = correctionRepository.existsByGroupIdAndDateReferenceAndApprovedFalse(group.getId(), payload.getDate());
        if (hasPending) {
            return ResponseEntity.badRequest().body(Map.of("message", "Já existe uma solicitação em análise para esta data. Aguarde a aprovação do Diretor."));
        }

        try {
            CorrectionRequest request = new CorrectionRequest();
            request.setGroup(group);
            request.setMonitor(monitor);
            request.setDateReference(payload.getDate());
            request.setRequestedAt(LocalDateTime.now());
            request.setApproved(false);

            String idsJson = objectMapper.writeValueAsString(payload.getPresentUserIds());
            String justJson = objectMapper.writeValueAsString(payload.getJustifications());
            
            request.setPresentIdsJson(idsJson);
            request.setJustificationsJson(justJson);

            correctionRepository.save(request);
            
            // Notificar Diretores (Opcional, mas recomendado)
            List<User> directors = userRepository.findByGroupIdAndRole(group.getId(), Role.DIRETOR);
            for (User dir : directors) {
                Notification n = new Notification();
                n.setUser(dir);
                n.setMessage("Nova solicitação de correção de chamada para: " + payload.getDate());
                n.setCreatedAt(LocalDateTime.now());
                notificationRepository.save(n);
            }

            return ResponseEntity.ok(Map.of("message", "Solicitação enviada para validação do Diretor."));

        } catch (Exception e) {
            logger.error("Erro ao serializar solicitação", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro ao processar dados."));
        }
    }

    @GetMapping("/pending-requests")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<List<Map<String, Object>>> getPendingRequests() {
        List<CorrectionRequest> requests = correctionRepository.findByApprovedFalseOrderByRequestedAtDesc();
        
        List<Map<String, Object>> response = requests.stream().map(req -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", req.getId());
            map.put("groupName", req.getGroup().getName());
            map.put("monitorName", req.getMonitor().getName());
            map.put("date", req.getDateReference());
            map.put("requestedAt", req.getRequestedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/approve-request/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    @Transactional
    public ResponseEntity<?> approveRequest(@PathVariable Long id, Authentication authentication) {
        CorrectionRequest request = correctionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada"));

        if (request.isApproved()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Solicitação já aprovada."));
        }

        try {
            List<AttendanceRecord> oldRecords = attendanceRepository.findByGroupIdAndDate(request.getGroup().getId(), request.getDateReference());
            attendanceRepository.deleteAll(oldRecords);

            List<User> members = userRepository.findByGroupIdAndRole(request.getGroup().getId(), Role.DESBRAVADOR);
            
            List<Integer> presentIdsInt = objectMapper.readValue(request.getPresentIdsJson(), List.class);
            List<Long> presentIds = presentIdsInt.stream().map(Integer::longValue).collect(Collectors.toList());
            Map<String, String> justMapRaw = objectMapper.readValue(request.getJustificationsJson(), Map.class);
            
            Map<Long, String> justifications = new HashMap<>();
            for (Map.Entry<String, String> entry : justMapRaw.entrySet()) {
                justifications.put(Long.valueOf(entry.getKey()), entry.getValue());
            }

            User recordedBy = request.getMonitor(); 

            List<AttendanceRecord> newRecords = members.stream().map(member -> {
                AttendanceRecord record = new AttendanceRecord();
                record.setUser(member);
                record.setGroup(request.getGroup());
                record.setDate(request.getDateReference());
                record.setRecordedBy(recordedBy);
                
                boolean isPresent = presentIds.contains(member.getId());
                record.setPresent(isPresent);

                if (!isPresent && justifications.containsKey(member.getId())) {
                    record.setJustification(justifications.get(member.getId()));
                }
                return record;
            }).collect(Collectors.toList());

            attendanceRepository.saveAll(newRecords);

            request.setApproved(true);
            correctionRepository.save(request);

            return ResponseEntity.ok(Map.of("message", "Correção aplicada com sucesso!"));

        } catch (Exception e) {
            logger.error("Erro ao aprovar correção", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro crítico ao aplicar correção."));
        }
    }

    @GetMapping("/my-stats")
    @PreAuthorize("hasAuthority('DESBRAVADOR')")
    public ResponseEntity<?> getMyStats(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        if (user.getGroup() == null) return ResponseEntity.ok(Map.of("percentage", 0));

        long totalClasses = attendanceRepository.countDistinctDateByGroupId(user.getGroup().getId());
        long myPresence = attendanceRepository.countByUserIdAndPresentTrue(user.getId());

        double percentage = (totalClasses > 0) ? ((double) myPresence / totalClasses) * 100 : 0.0;
        return ResponseEntity.ok(Map.of("totalClasses", totalClasses, "myPresence", myPresence, "percentage", String.format("%.1f", percentage)));
    }

    // --- ATUALIZADO: Retorna status de PENDÊNCIA ---
    @GetMapping("/check-existence")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<Map<String, Object>> checkAttendanceExistence(@RequestParam("date") String dateString, Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        Group group = user.getGroup();
        if (group == null) return ResponseEntity.ok(Map.of("exists", false, "pending", false));
        
        LocalDate date = LocalDate.parse(dateString);
        boolean exists = !attendanceRepository.findByGroupIdAndDate(group.getId(), date).isEmpty();
        // Verifica se há solicitação pendente
        boolean pending = correctionRepository.existsByGroupIdAndDateReferenceAndApprovedFalse(group.getId(), date);
        
        return ResponseEntity.ok(Map.of("exists", exists, "pending", pending));
    }

    @GetMapping("/dates-with-records")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    public ResponseEntity<List<String>> getDatesWithRecords(@RequestParam(value = "groupId", required = false) Long groupId) {
        List<AttendanceRecord> records = attendanceRepository.findAll(); 
        List<String> dates = records.stream()
                .filter(r -> groupId == null || (r.getGroup() != null && r.getGroup().getId().equals(groupId)))
                .map(r -> r.getDate().toString())
                .distinct()
                .sorted(java.util.Comparator.reverseOrder())
                .collect(Collectors.toList());
        return ResponseEntity.ok(dates);
    }

    @GetMapping("/export-csv")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<byte[]> exportAttendanceCsv(@RequestParam("date") String dateString, @RequestParam(value = "groupId", required = false) Long groupId, Authentication auth) {
        try {
            LocalDate date = LocalDate.parse(dateString);
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
            Long targetGroupId = (currentUser.getRole() == Role.DIRETOR && groupId != null) ? groupId : (currentUser.getGroup() != null ? currentUser.getGroup().getId() : null);

            if (targetGroupId == null) return ResponseEntity.badRequest().build();

            List<User> members = userRepository.findByGroupId(targetGroupId);
            members.removeIf(u -> u.getRole() == Role.DIRETOR || u.getRole() == Role.MONITOR); // Remove monitores da lista de alunos
            
            List<AttendanceRecord> records = attendanceRepository.findByGroupIdAndDate(targetGroupId, date);
            Map<Long, AttendanceRecord> recordMap = records.stream().collect(Collectors.toMap(r -> r.getUser().getId(), r -> r));

            String responsavel = records.isEmpty() ? "N/A" : records.get(0).getRecordedBy().getName();

            StringBuilder csv = new StringBuilder();
            csv.append('\uFEFF'); 
            csv.append("ID;Nome;Status;Justificativa;Data;Monitor Responsavel\n");
            
            for (User u : members) {
                AttendanceRecord rec = recordMap.get(u.getId());
                boolean present = rec != null && rec.isPresent();
                String status = present ? "PRESENTE" : "AUSENTE";
                String just = (rec != null && rec.getJustification() != null) ? rec.getJustification() : "";
                String name = (u.getName() + " " + u.getSurname()).replace(";", "");
                
                csv.append(u.getId()).append(";")
                    .append(name).append(";")
                    .append(status).append(";")
                    .append(just).append(";")
                    .append(date).append(";")
                    .append(responsavel).append("\n");
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chamada_" + date + ".csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csv.toString().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/report")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<List<AttendanceReportDTO>> getAttendanceReport(@RequestParam("date") String dateString, @RequestParam(value = "groupId", required = false) Long groupId, Authentication auth) {
        try {
            LocalDate date = LocalDate.parse(dateString);
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
            Long targetGroupId = (currentUser.getRole() == Role.DIRETOR && groupId != null) ? groupId : (currentUser.getGroup() != null ? currentUser.getGroup().getId() : null);

            if (targetGroupId == null) return ResponseEntity.badRequest().body(List.of());

            List<User> members = userRepository.findByGroupIdAndRole(targetGroupId, Role.DESBRAVADOR);
            List<AttendanceRecord> records = attendanceRepository.findByGroupIdAndDate(targetGroupId, date);
            Map<Long, AttendanceRecord> recordMap = records.stream().collect(Collectors.toMap(r -> r.getUser().getId(), r -> r));

            return ResponseEntity.ok(members.stream().map(user -> {
                AttendanceRecord rec = recordMap.get(user.getId());
                boolean isPresent = rec != null && rec.isPresent();
                String status = isPresent ? "PRESENTE" : "AUSENTE";
                if (!isPresent && rec != null && rec.getJustification() != null && !rec.getJustification().isEmpty()) {
                    status = "JUSTIFICADO: " + rec.getJustification();
                }
                return new AttendanceReportDTO(user.getId(), user.getName() + " " + user.getSurname(), status, user.getAvatar() != null ? user.getAvatar() : "img/escoteiro1.png");
            }).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
