package br.com.desbravadores.api.service;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import br.com.desbravadores.api.dto.AchievementResponseDTO;
import br.com.desbravadores.api.dto.BackgroundResponseDTO;
import br.com.desbravadores.api.dto.CatalogListItemDTO;
import br.com.desbravadores.api.dto.CatalogPreviewDTO;
import br.com.desbravadores.api.dto.GroupSummaryDTO;
import br.com.desbravadores.api.dto.TaskResponseDTO;
import br.com.desbravadores.api.dto.UserResponseDTO;
import br.com.desbravadores.api.dto.UserSummaryDTO;
import br.com.desbravadores.api.model.Achievement;
import br.com.desbravadores.api.model.Background;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Requirement;
import br.com.desbravadores.api.model.Specialty;
import br.com.desbravadores.api.model.Task;
import br.com.desbravadores.api.model.User;

@Service
public class ApiDtoMapper {

    public GroupSummaryDTO toGroupSummary(Group group) {
        if (group == null) {
            return null;
        }

        return new GroupSummaryDTO(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getAccentColor()
        );
    }

    public AchievementResponseDTO toAchievementResponse(Achievement achievement) {
        if (achievement == null) {
            return null;
        }

        return new AchievementResponseDTO(
                achievement.getId(),
                achievement.getName(),
                achievement.getDescription(),
                achievement.getIcon(),
                achievement.getXpReward(),
                achievement.getRewardType()
        );
    }

    public BackgroundResponseDTO toBackgroundResponse(Background background) {
        if (background == null) {
            return null;
        }

        return new BackgroundResponseDTO(
                background.getId(),
                background.getName(),
                background.getImageUrl(),
                background.getTextColor(),
                background.getGradient()
        );
    }

    public UserSummaryDTO toUserSummary(User user) {
        GroupSummaryDTO group = toGroupSummary(user.getGroup());

        return new UserSummaryDTO(
                user.getId(),
                user.getName(),
                user.getSurname(),
                user.getUsername(),
                user.getAvatar(),
                user.getUnitRole(),
                user.getLevel(),
                user.getXp(),
                user.getTotalXp(),
                user.getRole(),
                group,
                group != null ? group.id() : null,
                group != null ? group.name() : "Sem grupo"
        );
    }

    public UserResponseDTO toUserResponse(User user) {
        GroupSummaryDTO group = toGroupSummary(user.getGroup());

        List<AchievementResponseDTO> achievements = user.getAchievements().stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(Achievement::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toAchievementResponse)
                .toList();

        List<BackgroundResponseDTO> unlockedBackgrounds = user.getUnlockedBackgrounds().stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(Background::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toBackgroundResponse)
                .toList();

        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getSurname(),
                user.getUsername(),
                user.getAvatar(),
                user.getUnitRole(),
                user.getLevel(),
                user.getXp(),
                user.getTotalXp(),
                user.getRole(),
                group,
                group != null ? group.id() : null,
                group != null ? group.name() : "Sem grupo",
                toBackgroundResponse(user.getSelectedBackground()),
                achievements,
                unlockedBackgrounds
        );
    }

    public TaskResponseDTO toTaskResponse(Task task) {
        GroupSummaryDTO group = toGroupSummary(task.getGroup());

        return new TaskResponseDTO(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDate(),
                task.getTime(),
                group,
                group != null ? group.id() : null,
                group != null ? group.name() : "Global",
                group == null
        );
    }

    public CatalogListItemDTO toAchievementCatalogItem(Achievement achievement) {
        return new CatalogListItemDTO(
                achievement.getId(),
                "achievement",
                achievement.getName(),
                achievement.getDescription(),
                achievement.getRewardType().name(),
                "+" + achievement.getXpReward() + " XP",
                achievement.getName(),
                new CatalogPreviewDTO(
                        achievement.getRewardType() == null ? "Conquista" : achievement.getRewardType().name(),
                        achievement.getName(),
                        achievement.getRewardType() == null ? "Gamificacao" : achievement.getRewardType().name(),
                        achievement.getDescription(),
                        "#D97706",
                        null,
                        achievement.getIcon(),
                        48,
                        null,
                        "icon",
                        List.of("xp:" + achievement.getXpReward())
                )
        );
    }

    public CatalogListItemDTO toBackgroundCatalogItem(Background background) {
        return new CatalogListItemDTO(
                background.getId(),
                "background",
                background.getName(),
                background.getImageUrl() != null ? "Imagem publicada" : "Gradiente configurado",
                background.getTextColor(),
                background.getImageUrl() != null ? "Imagem" : "Gradiente",
                background.getName(),
                new CatalogPreviewDTO(
                        "Fundo",
                        background.getName(),
                        background.getTextColor(),
                        background.getGradient(),
                        background.getTextColor(),
                        null,
                        background.getImageUrl(),
                        null,
                        background.getGradient(),
                        background.getImageUrl() != null ? "image" : "gradient",
                        List.of(background.getImageUrl() != null ? "imagem" : "gradiente")
                )
        );
    }

    public CatalogListItemDTO toSpecialtyCatalogItem(Specialty specialty) {
        return new CatalogListItemDTO(
                specialty.getId(),
                "specialty",
                specialty.getName(),
                specialty.getDescription(),
                specialty.getArea(),
                specialty.getIconImageUrl() != null
                        ? "Imagem • " + normalizeIconSize(specialty.getIconSize()) + "px"
                        : (specialty.getIconName() + " • " + normalizeIconSize(specialty.getIconSize()) + "px"),
                specialty.getName(),
                new CatalogPreviewDTO(
                        specialty.getArea(),
                        specialty.getName(),
                        specialty.getArea(),
                        specialty.getDescription(),
                        specialty.getAccentColor(),
                        specialty.getIconName(),
                        specialty.getIconImageUrl(),
                        specialty.getIconSize(),
                        null,
                        specialty.getIconImageUrl() != null ? "icon-image" : "icon",
                        List.of("area:" + specialty.getArea(), "size:" + normalizeIconSize(specialty.getIconSize()))
                )
        );
    }

    public CatalogListItemDTO toRequirementCatalogItem(Requirement requirement) {
        return new CatalogListItemDTO(
                requirement.getId(),
                "requirement",
                requirement.getTitle(),
                requirement.getDescription(),
                requirement.getClassLevel(),
                requirement.getCategory() + " • " + normalizeIconSize(requirement.getIconSize()) + "px",
                requirement.getClassLevel() + ":" + requirement.getDisplayOrder(),
                new CatalogPreviewDTO(
                        requirement.getClassLevel(),
                        requirement.getTitle(),
                        requirement.getCategory(),
                        requirement.getDescription(),
                        "#27408b",
                        requirement.getIconName(),
                        requirement.getIconImageUrl(),
                        requirement.getIconSize(),
                        null,
                        requirement.getIconImageUrl() != null ? "icon-image" : "icon",
                        List.of("ordem:" + requirement.getDisplayOrder(), "size:" + normalizeIconSize(requirement.getIconSize()))
                )
        );
    }

    private int normalizeIconSize(Integer value) {
        return value == null ? 48 : value;
    }
}
