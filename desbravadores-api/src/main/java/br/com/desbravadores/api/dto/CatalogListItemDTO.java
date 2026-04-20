package br.com.desbravadores.api.dto;

public record CatalogListItemDTO(
        Long id,
        String kind,
        String title,
        String subtitle,
        String identifier,
        String context,
        String sortLabel,
        CatalogPreviewDTO preview
) {
}
