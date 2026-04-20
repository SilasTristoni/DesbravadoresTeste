package br.com.desbravadores.api.dto;

import br.com.desbravadores.api.model.RewardType;

public record AchievementResponseDTO(
        Long id,
        String name,
        String description,
        String icon,
        int xpReward,
        RewardType rewardType
) {
}
