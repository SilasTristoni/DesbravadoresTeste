package br.com.desbravadores.api.dto;

import br.com.desbravadores.api.model.Role;

public record UserSummaryDTO(
        Long id,
        String name,
        String surname,
        String username,
        String avatar,
        String unitRole,
        int level,
        int xp,
        int totalXp,
        Role role,
        GroupSummaryDTO group,
        Long groupId,
        String groupName
) {
}
