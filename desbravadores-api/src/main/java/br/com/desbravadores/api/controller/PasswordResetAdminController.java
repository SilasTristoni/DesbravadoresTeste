package br.com.desbravadores.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.dto.PasswordResetRequestDTO;
import br.com.desbravadores.api.service.PasswordResetService;

@RestController
@RequestMapping("/api/admin/password-resets")
@PreAuthorize("hasAuthority('DIRETOR')")
public class PasswordResetAdminController {

    @Autowired
    private PasswordResetService passwordResetService;

    @GetMapping
    public ResponseEntity<List<PasswordResetRequestDTO>> listRecentRequests() {
        return ResponseEntity.ok(passwordResetService.listRecentRequests());
    }

    @PostMapping("/{requestId}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable Long requestId, Authentication authentication) {
        try {
            return ResponseEntity.ok(passwordResetService.approveRequest(requestId, authentication.getName()));
        } catch (RuntimeException error) {
            return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
        }
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long requestId, Authentication authentication) {
        try {
            return ResponseEntity.ok(passwordResetService.rejectRequest(requestId, authentication.getName()));
        } catch (RuntimeException error) {
            return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
        }
    }
}
