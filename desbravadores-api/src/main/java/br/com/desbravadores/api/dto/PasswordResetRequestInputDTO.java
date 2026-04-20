package br.com.desbravadores.api.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequestInputDTO(
        @NotBlank(message = "O identificador e obrigatorio.")
        String username
) {
}
