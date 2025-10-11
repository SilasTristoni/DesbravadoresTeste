package br.com.desbravadores.api.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String surname;
    private String email;
    private String password;
    private String avatar;
    private String rank;
    private int level;
    private int xp;
    
    // NOVO CAMPO ADICIONADO AQUI
    // @Enumerated(EnumType.STRING) garante que o nome do enum ("DESBRAVADOR", "MONITOR", etc.)
    // seja salvo como texto no banco de dados, o que é mais legível.
    @Enumerated(EnumType.STRING)
    private Role role;

    // Construtor vazio
    public User() {
    }

    // Getters e Setters (incluindo para o novo campo 'role')

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getRank() {
        return rank;
    }

    public void setRank(String rank) {
        this.rank = rank;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public int getXp() {
        return xp;
    }

    public void setXp(int xp) {
        this.xp = xp;
    }
    
    // Getter e Setter para o novo campo
    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}