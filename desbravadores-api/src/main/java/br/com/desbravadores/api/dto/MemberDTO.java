package br.com.desbravadores.api.dto;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;

// Este é um molde simples para os dados do membro que o frontend precisa.
public class MemberDTO {
    private Long id;
    private String name;
    private String surname;
    private Role role;
    private String unitRole;

    public MemberDTO(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.surname = user.getSurname();
        this.role = user.getRole();
        this.unitRole = user.getUnitRole();
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getUnitRole() { return unitRole; }
    public void setUnitRole(String unitRole) { this.unitRole = unitRole; }
}
