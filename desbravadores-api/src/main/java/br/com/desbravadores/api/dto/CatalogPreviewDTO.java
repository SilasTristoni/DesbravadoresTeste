package br.com.desbravadores.api.dto;

import java.util.List;

public record CatalogPreviewDTO(
        String badge,
        String title,
        String subtitle,
        String description,
        String accentColor,
        String iconName,
        String imageUrl,
        Integer iconSize,
        String gradient,
        String previewStyle,
        List<String> tags
) {
}
