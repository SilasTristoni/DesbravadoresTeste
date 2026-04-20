package br.com.desbravadores.api.dto;

import java.util.List;

public record XpSummaryDTO(
        int level,
        int currentXp,
        int totalXp,
        int xpForNextLevel,
        int xpToNextLevel,
        int achievementXp,
        int manualXp,
        List<XpHistoryItemDTO> history
) {
}
