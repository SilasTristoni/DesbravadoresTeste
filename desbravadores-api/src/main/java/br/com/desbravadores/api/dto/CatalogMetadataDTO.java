package br.com.desbravadores.api.dto;

import java.util.List;

public record CatalogMetadataDTO(
        List<String> rewardTypes,
        List<String> requirementClassLevels,
        List<String> specialtyAreas,
        List<String> suggestedRequirementIcons,
        List<String> suggestedSpecialtyIcons,
        List<String> suggestedColors
) {
}
