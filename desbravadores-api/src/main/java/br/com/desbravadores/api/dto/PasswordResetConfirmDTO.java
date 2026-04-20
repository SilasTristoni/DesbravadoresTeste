package br.com.desbravadores.api.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetConfirmDTO(
        @NotBlank(message = "O identificador e obrigatorio.")
        String username,
        @NotBlank(message = "O codigo de redefinicao e obrigatorio.")
        String resetCode,
        @NotBlank(message = "A nova senha e obrigatoria.")
        String newPassword
) {
}
