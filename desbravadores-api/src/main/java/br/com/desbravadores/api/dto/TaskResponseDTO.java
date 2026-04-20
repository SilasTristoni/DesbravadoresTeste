package br.com.desbravadores.api.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record TaskResponseDTO(
        Long id,
        String title,
        String description,
        LocalDate date,
        LocalTime time,
        GroupSummaryDTO group,
        Long groupId,
        String groupName,
        boolean global
) {
}
