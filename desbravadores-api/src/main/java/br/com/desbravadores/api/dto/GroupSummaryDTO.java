package br.com.desbravadores.api.dto;

public record GroupSummaryDTO(
        Long id,
        String name,
        String description,
        String accentColor
) {
}
