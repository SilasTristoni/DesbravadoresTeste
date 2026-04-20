package br.com.desbravadores.api.dto;

import java.time.LocalDateTime;

import br.com.desbravadores.api.model.XpLog;
import br.com.desbravadores.api.model.XpSourceType;

public record XpHistoryItemDTO(
        Long id,
        int amount,
        String reason,
        XpSourceType sourceType,
        String referenceType,
        Long referenceId,
        String referenceLabel,
        String performedBy,
        int balanceAfter,
        int levelAfter,
        int currentLevelXpAfter,
        LocalDateTime createdAt
) {
    public XpHistoryItemDTO(XpLog log) {
        this(
                log.getId(),
                log.getAmount(),
                log.getReason(),
                log.getSourceType(),
                log.getReferenceType(),
                log.getReferenceId(),
                log.getReferenceLabel(),
                log.getPerformedBy(),
                log.getBalanceAfter(),
                log.getLevelAfter(),
                log.getCurrentLevelXpAfter(),
                log.getCreatedAt()
        );
    }
}
