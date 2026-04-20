package br.com.desbravadores.api.dto;

import java.time.LocalDateTime;

import br.com.desbravadores.api.model.PasswordResetRequest;
import br.com.desbravadores.api.model.PasswordResetStatus;

public record PasswordResetRequestDTO(
        Long id,
        Long userId,
        String username,
        String fullName,
        PasswordResetStatus status,
        String resetCode,
        LocalDateTime requestedAt,
        LocalDateTime approvedAt,
        LocalDateTime expiresAt,
        LocalDateTime completedAt,
        String approvedBy
) {
    public PasswordResetRequestDTO(PasswordResetRequest request) {
        this(
                request.getId(),
                request.getUser().getId(),
                request.getUser().getUsername(),
                resolveFullName(request),
                request.getStatus(),
                request.getStatus() == PasswordResetStatus.APPROVED ? request.getResetCode() : null,
                request.getRequestedAt(),
                request.getApprovedAt(),
                request.getExpiresAt(),
                request.getCompletedAt(),
                request.getApprovedBy()
        );
    }

    private static String resolveFullName(PasswordResetRequest request) {
        String name = request.getUser().getName() == null ? "" : request.getUser().getName();
        String surname = request.getUser().getSurname() == null ? "" : request.getUser().getSurname();
        String fullName = (name + " " + surname).trim();
        return fullName.isBlank() ? request.getUser().getUsername() : fullName;
    }
}
