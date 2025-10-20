package br.com.desbravadores.api.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
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

class AttendancePayload {
    private LocalDate date;
    private List<Long> presentUserIds;

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

        List<Long> presentUserIds = payload.getPresentUserIds();
        LocalDate date = payload.getDate();

        List<User> presentUsers = userRepository.findAllById(presentUserIds);
        
        List<AttendanceRecord> records = presentUsers.stream().map(user -> {
            AttendanceRecord record = new AttendanceRecord();
            record.setUser(user);
            record.setGroup(monitorGroup);
            record.setDate(date);
            record.setRecordedBy(monitor);
            return record;
        }).collect(Collectors.toList());

        attendanceRepository.saveAll(records);

        String message = "Chamada para o dia " + date + " registada com sucesso!";
        return ResponseEntity.ok(Map.of("message", message));
    }

    @GetMapping("/report")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<?> getAttendanceReport(
        @RequestParam("date") String dateString,
        @RequestParam(value = "groupId", required = false) Long groupId,
        Authentication authentication) {
        
        LocalDate date = LocalDate.parse(dateString);
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        
        Long targetGroupId = null;
        boolean isDirector = currentUser.getRole() == Role.DIRETOR;

        if (isDirector) {
            if (groupId == null) {
                return ResponseEntity.ok(List.of());
            }
            targetGroupId = groupId;
        } else {
            if (currentUser.getGroup() == null) {
                 return ResponseEntity.ok(List.of());
            }
            targetGroupId = currentUser.getGroup().getId();
        }

        if (targetGroupId == null) {
            return ResponseEntity.ok(List.of());
        }

        List<User> allMembers = userRepository.findByGroupIdAndRole(targetGroupId, Role.DESBRAVADOR);
        List<AttendanceRecord> presentRecords = attendanceRepository.findByGroupIdAndDate(targetGroupId, date);
        Set<Long> presentUserIds = presentRecords.stream()
                                    .map(record -> record.getUser().getId())
                                    .collect(Collectors.toSet());

        List<Map<String, Object>> report = allMembers.stream().map(member -> {
            String status = presentUserIds.contains(member.getId()) ? "PRESENTE" : "AUSENTE";
            Map<String, Object> reportItem = new HashMap<>();
            reportItem.put("id", member.getId());
            reportItem.put("name", member.getName() + " " + member.getSurname());
            reportItem.put("status", status);
            return reportItem;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(report);
    }
}