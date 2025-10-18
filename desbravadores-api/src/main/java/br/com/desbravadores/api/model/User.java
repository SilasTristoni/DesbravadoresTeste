package br.com.desbravadores.api.model;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
@JsonIdentityInfo(
    generator = ObjectIdGenerators.PropertyGenerator.class,
    property = "id")
// Mantemos esta anotação por segurança, caso falhe em algum ponto não coberto
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String surname;
    private String email;
    private String password;
    private String avatar;
    private int level;
    private int xp;
    
    @Enumerated(EnumType.STRING)
    private Role role;

    // CORREÇÃO CRÍTICA: Força carregamento EAGER
    @ManyToOne(fetch = FetchType.EAGER) 
    @JoinColumn(name = "group_id")
    private Group group;

    // CORREÇÃO CRÍTICA: Força carregamento EAGER
    @ManyToMany(fetch = FetchType.EAGER) 
    @JoinTable(
        name = "user_badges",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "badge_id")
    )
    private Set<Badge> badges = new HashSet<>();

    // ---- NOVAS RELAÇÕES ADICIONADAS AQUI ----

    // CORREÇÃO CRÍTICA: Força carregamento EAGER
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_unlocked_backgrounds",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "background_id")
    )
    private Set<Background> unlockedBackgrounds = new HashSet<>();

    // CORREÇÃO CRÍTICA: Força carregamento EAGER
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "selected_background_id")
    private Background selectedBackground;


    // Construtor vazio
    public User() {}

    // Getters e Setters (omitido por brevidade, mas o resto da classe é o mesmo)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public int getXp() { return xp; }
    public void setXp(int xp) { this.xp = xp; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }
    public Set<Badge> getBadges() { return badges; }
    public void setBadges(Set<Badge> badges) { this.badges = badges; }

    // GETTERS E SETTERS PARA OS NOVOS CAMPOS
    public Set<Background> getUnlockedBackgrounds() { return unlockedBackgrounds; }
    public void setUnlockedBackgrounds(Set<Background> unlockedBackgrounds) { this.unlockedBackgrounds = unlockedBackgrounds; }
    public Background getSelectedBackground() { return selectedBackground; }
    public void setSelectedBackground(Background selectedBackground) { this.selectedBackground = selectedBackground; }
}