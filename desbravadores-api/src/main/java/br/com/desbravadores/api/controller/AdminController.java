package br.com.desbravadores.api.controller;

import java.util.Map; // O import de List é mantido

import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping; 
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping; 
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.GamificationService;
import br.com.desbravadores.api.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class); 

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GamificationService gamificationService; // Injetar o novo serviço

    @PreAuthorize("hasAuthority('DIRETOR')")
    @PostMapping("/users")
    public ResponseEntity<User> createUserByAdmin(@RequestBody User newUser) {
        User savedUser = userService.createUser(newUser);
        return ResponseEntity.status(201).body(savedUser);
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

    // Este endpoint busca DESBRAVADORES (paginado)
    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    @Transactional
    public ResponseEntity<Page<User>> getAllUsers(
        @RequestParam(value = "groupId", required = false) Long groupId, 
        Pageable pageable,
        Authentication authentication) {
        
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        boolean isDirector = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("DIRETOR"));
        
        Page<User> userPage;
        
        if (isDirector) {
            if (groupId != null) {
                userPage = userRepository.findByGroupId(groupId, pageable); // DIRETOR pode ver todos do grupo
            } else {
                userPage = userRepository.findAll(pageable); // DIRETOR pode ver todos os usuários
            }
        } else {
            if (currentUser.getGroup() == null) {
                return ResponseEntity.ok(Page.empty());
            }
            userPage = userRepository.findByGroupId(currentUser.getGroup().getId(), pageable); // MONITOR pode ver todos do seu grupo
        }
        
        userPage.getContent().forEach(user -> {
             Hibernate.initialize(user.getSelectedBackground());
             Hibernate.initialize(user.getGroup());
             Hibernate.initialize(user.getBadges());
             Hibernate.initialize(user.getUnlockedBackgrounds());
        });
        
        return ResponseEntity.ok(userPage);
    }

    // --- MÉTODO MODIFICADO ---
    // Agora busca MONITORES (paginado)
    @GetMapping("/users/monitors")
    @PreAuthorize("hasAuthority('DIRETOR')")
    @Transactional // Adicionado Transactional
    public ResponseEntity<Page<User>> getAllMonitors(Pageable pageable) { // Adicionado Pageable
        // O repositório já suportava este método
        Page<User> monitorsPage = userRepository.findByRole(Role.MONITOR, pageable); 
        
        // Adicionado Hibernate.initialize para consistência
        monitorsPage.getContent().forEach(user -> {
             Hibernate.initialize(user.getSelectedBackground());
             Hibernate.initialize(user.getGroup());
             Hibernate.initialize(user.getBadges());
             Hibernate.initialize(user.getUnlockedBackgrounds());
        });
        
        return ResponseEntity.ok(monitorsPage); // Retorna a Página
    }

    // NOVOS MÉTODOS ADICIONADOS AQUI
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
}