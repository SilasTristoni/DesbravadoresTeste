package br.com.desbravadores.api.dto;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;

// Este é um molde simples para os dados do membro que o frontend precisa.
public class MemberDTO {
    private Long id;
    private String name;
    private String surname;
    private String username;
    private String avatar;
    private Role role;
    private String unitRole;
    private int level;
    private int xp;

    public MemberDTO(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.surname = user.getSurname();
        this.username = user.getUsername();
        this.avatar = user.getAvatar();
        this.role = user.getRole();
        this.unitRole = user.getUnitRole();
        this.level = user.getLevel();
        this.xp = user.getXp();
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getUnitRole() { return unitRole; }
    public void setUnitRole(String unitRole) { this.unitRole = unitRole; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public int getXp() { return xp; }
    public void setXp(int xp) { this.xp = xp; }
}
