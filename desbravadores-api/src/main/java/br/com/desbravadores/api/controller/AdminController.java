package br.com.desbravadores.api.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.GamificationService;
import br.com.desbravadores.api.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GamificationService gamificationService;

    @PreAuthorize("hasAuthority('DIRETOR')")
    @PostMapping("/users")
    public ResponseEntity<?> createUserByAdmin(@RequestBody User newUser) {
        try {
            User savedUser = userService.createUser(newUser);
            return ResponseEntity.status(201).body(savedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    
    @PutMapping("/users/{userId}/remove-group")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<User> removeUserFromGroup(@PathVariable Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setGroup(null);
            userRepository.save(user); 
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    @Transactional
    public ResponseEntity<Page<Map<String, Object>>> getAllUsers(
        @RequestParam(value = "groupId", required = false) Long groupId, 
        Pageable pageable,
        Authentication authentication) {
        
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        boolean isDirector = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("DIRETOR"));
        
        Page<User> userPage;
        
        if (isDirector) {
            if (groupId != null) {
                userPage = userRepository.findByGroupIdAndRole(groupId, Role.DESBRAVADOR, pageable); 
            } else {
                userPage = userRepository.findByRole(Role.DESBRAVADOR, pageable); 
            }
        } else {
            if (currentUser.getGroup() == null) {
                return ResponseEntity.ok(Page.empty());
            }
            userPage = userRepository.findByGroupIdAndRole(currentUser.getGroup().getId(), Role.DESBRAVADOR, pageable); 
        }
        
        Page<Map<String, Object>> dtoPage = userPage.map(user -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", user.getId());
            dto.put("name", user.getName());
            dto.put("surname", user.getSurname());
            dto.put("email", user.getEmail());
            dto.put("role", user.getRole());
            dto.put("level", user.getLevel());
            dto.put("xp", user.getXp());
            dto.put("avatar", user.getAvatar());
            
            Hibernate.initialize(user.getGroup());
            
            if (user.getGroup() != null) {
                dto.put("groupName", user.getGroup().getName());
                dto.put("groupId", user.getGroup().getId());
                Map<String, Object> simpleGroup = new HashMap<>();
                simpleGroup.put("id", user.getGroup().getId());
                simpleGroup.put("name", user.getGroup().getName());
                dto.put("group", simpleGroup); 
            } else {
                dto.put("groupName", "Sem Grupo");
                dto.put("groupId", null);
                dto.put("group", null);
            }
            return dto;
        });
        
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/users/monitors")
    @PreAuthorize("hasAuthority('DIRETOR')")
    @Transactional
    public ResponseEntity<Page<User>> getAllMonitors(Pageable pageable) {
        Page<User> monitorsPage = userRepository.findByRole(Role.MONITOR, pageable); 
        monitorsPage.getContent().forEach(user -> {
             Hibernate.initialize(user.getSelectedBackground());
             Hibernate.initialize(user.getGroup());
             Hibernate.initialize(user.getAchievements());
             Hibernate.initialize(user.getUnlockedBackgrounds());
        });
        return ResponseEntity.ok(monitorsPage); 
    }

    @GetMapping("/users/directors")
    @PreAuthorize("hasAuthority('DIRETOR')")
    @Transactional
    public ResponseEntity<Page<User>> getAllDirectors(Pageable pageable) {
        Page<User> directorsPage = userRepository.findByRole(Role.DIRETOR, pageable); 
        directorsPage.getContent().forEach(user -> {
             Hibernate.initialize(user.getSelectedBackground());
             Hibernate.initialize(user.getGroup());
             Hibernate.initialize(user.getAchievements());
             Hibernate.initialize(user.getUnlockedBackgrounds());
        });
        return ResponseEntity.ok(directorsPage); 
    }

    @PostMapping("/users/{userId}/achievements/{achievementId}")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    public ResponseEntity<?> grantAchievement(@PathVariable Long userId, @PathVariable Long achievementId) {
        gamificationService.manuallyUnlockAchievement(userId, achievementId);
        return ResponseEntity.ok().body(Map.of("message", "Conquista concedida com sucesso."));
    }

    @DeleteMapping("/users/{userId}/achievements/{achievementId}")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    public ResponseEntity<?> revokeAchievement(@PathVariable Long userId, @PathVariable Long achievementId) {
        gamificationService.revokeAchievement(userId, achievementId);
        return ResponseEntity.ok().body(Map.of("message", "Conquista revogada com sucesso."));
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    @Transactional
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        user.ifPresent(u -> {
            Hibernate.initialize(u.getGroup());
            Hibernate.initialize(u.getAchievements());
        });
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // CORREÇÃO: Agora devolve um JSON com a mensagem de erro para o Frontend ler!
    @PutMapping("/users/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updateData) {
        try {
            User updatedUser = userService.updateUser(id, updateData);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}