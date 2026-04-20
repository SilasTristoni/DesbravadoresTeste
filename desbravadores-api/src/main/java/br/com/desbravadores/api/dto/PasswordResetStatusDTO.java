package br.com.desbravadores.api.dto;

import java.time.LocalDateTime;

import br.com.desbravadores.api.model.PasswordResetStatus;

public record PasswordResetStatusDTO(
        PasswordResetStatus status,
        LocalDateTime requestedAt,
        LocalDateTime approvedAt,
        LocalDateTime expiresAt,
        LocalDateTime completedAt
) {
}
