package br.com.desbravadores.api.dto;

import br.com.desbravadores.api.model.User;

public class ScoutOfTheMonthDTO {
    private Long userId;
    private String name;
    private String surname;
    private String avatar;
    private int level;
    private int badgeCount;

    // Construtor que recebe um User
    public ScoutOfTheMonthDTO(User user, int badgeCount) {
        this.userId = user.getId();
        this.name = user.getName();
        this.surname = user.getSurname();
        this.avatar = user.getAvatar();
        this.level = user.getLevel();
        this.badgeCount = badgeCount;
    }

    // Getters
    public Long getUserId() { return userId; }
    public String getName() { return name; }
    public String getSurname() { return surname; }
    public String getAvatar() { return avatar; }
    public int getLevel() { return level; }
    public int getBadgeCount() { return badgeCount; }
}