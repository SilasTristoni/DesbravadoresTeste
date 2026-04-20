package br.com.desbravadores.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.desbravadores.api.dto.UserResponseDTO;
import br.com.desbravadores.api.model.Achievement;
import br.com.desbravadores.api.model.Background;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.RewardType;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;

class ApiDtoMapperTest {

    private final ApiDtoMapper apiDtoMapper = new ApiDtoMapper();
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void toUserResponseDoesNotExposePasswordAndKeepsNestedData() throws Exception {
        Group group = new Group();
        group.setId(3L);
        group.setName("Panteras");
        group.setDescription("Unidade principal");
        group.setAccentColor("#27408b");

        Achievement achievement = new Achievement();
        achievement.setId(9L);
        achievement.setName("Primeiro Acampamento");
        achievement.setDescription("Participou do primeiro acampamento.");
        achievement.setIcon("/file/camp.png");
        achievement.setXpReward(50);
        achievement.setRewardType(RewardType.BADGE);

        Background background = new Background();
        background.setId(5L);
        background.setName("Selva");
        background.setImageUrl("/file/selva.png");
        background.setTextColor("#FFFFFF");

        User user = new User();
        user.setId(12L);
        user.setName("Ana");
        user.setSurname("Silva");
        user.setUsername("ana.silva");
        user.setPassword("hash-secreto");
        user.setRole(Role.DESBRAVADOR);
        user.setLevel(4);
        user.setXp(120);
        user.setGroup(group);
        user.setSelectedBackground(background);
        user.setAchievements(new HashSet<>(java.util.List.of(achievement)));
        user.setUnlockedBackgrounds(new HashSet<>(java.util.List.of(background)));

        UserResponseDTO response = apiDtoMapper.toUserResponse(user);
        String json = objectMapper.writeValueAsString(response);

        assertThat(response.groupName()).isEqualTo("Panteras");
        assertThat(response.achievements()).hasSize(1);
        assertThat(response.selectedBackground().name()).isEqualTo("Selva");
        assertThat(json).doesNotContain("password");
    }
}
