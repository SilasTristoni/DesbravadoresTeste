package br.com.desbravadores.api.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.dto.RequirementProgressResponseDTO;
import br.com.desbravadores.api.dto.SpecialtyProgressResponseDTO;
import br.com.desbravadores.api.model.SpecialtyProgressStatus;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.LearningProgressService;

@RestController
@RequestMapping("/api")
public class LearningProgressController {

    @Autowired
    private LearningProgressService learningProgressService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/profile/me/requirements-progress")
    public ResponseEntity<RequirementProgressResponseDTO> getMyRequirementProgress(
            Authentication authentication,
            @RequestParam(value = "classLevel", required = false) String classLevel) {
        Long userId = getAuthenticatedUser(authentication).getId();
        return ResponseEntity.ok(learningProgressService.getRequirementProgress(userId, classLevel));
    }

    @GetMapping("/profile/me/specialties-progress")
    public ResponseEntity<SpecialtyProgressResponseDTO> getMySpecialtyProgress(Authentication authentication) {
        Long userId = getAuthenticatedUser(authentication).getId();
        return ResponseEntity.ok(learningProgressService.getSpecialtyProgress(userId));
    }

    @GetMapping("/admin/users/{userId}/requirements-progress")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    public ResponseEntity<RequirementProgressResponseDTO> getUserRequirementProgress(
            @PathVariable Long userId,
            @RequestParam(value = "classLevel", required = false) String classLevel) {
        return ResponseEntity.ok(learningProgressService.getRequirementProgress(userId, classLevel));
    }

    @PutMapping("/admin/users/{userId}/requirements/{requirementId}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> updateRequirementProgress(
            @PathVariable Long userId,
            @PathVariable Long requirementId,
            @RequestBody Map<String, Object> payload) {
        boolean completed = Boolean.TRUE.equals(payload.get("completed"));
        try {
            return ResponseEntity.ok(learningProgressService.updateRequirementProgress(userId, requirementId, completed));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/admin/users/{userId}/specialties-progress")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    public ResponseEntity<SpecialtyProgressResponseDTO> getUserSpecialtyProgress(@PathVariable Long userId) {
        return ResponseEntity.ok(learningProgressService.getSpecialtyProgress(userId));
    }

    @PutMapping("/admin/users/{userId}/specialties/{specialtyId}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> updateSpecialtyProgress(
            @PathVariable Long userId,
            @PathVariable Long specialtyId,
            @RequestBody Map<String, String> payload) {
        try {
            SpecialtyProgressStatus status = SpecialtyProgressStatus.valueOf(payload.getOrDefault("status", "NOT_STARTED"));
            return ResponseEntity.ok(learningProgressService.updateSpecialtyProgress(userId, specialtyId, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status de especialidade invalido."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Utilizador autenticado nao encontrado."));
    }
}
