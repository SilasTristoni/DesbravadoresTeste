package br.com.desbravadores.api.dto;

public record BackgroundResponseDTO(
        Long id,
        String name,
        String imageUrl,
        String textColor,
        String gradient
) {
}
