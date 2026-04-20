package br.com.desbravadores.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record XpAdjustmentRequestDTO(
        @NotNull(message = "O valor de XP e obrigatorio.")
        @Min(value = -10000, message = "O ajuste minimo permitido e -10000 XP.")
        @Max(value = 10000, message = "O ajuste maximo permitido e 10000 XP.")
        Integer amount,
        @NotBlank(message = "Informe o motivo do ajuste de XP.")
        String reason
) {
}
