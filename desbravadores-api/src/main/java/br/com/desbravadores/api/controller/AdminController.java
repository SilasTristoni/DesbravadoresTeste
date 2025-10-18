package br.com.desbravadores.api.controller;

import java.util.List;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping; 
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam; // NOVO IMPORT
import org.springframework.web.bind.annotation.RestController; // NOVO IMPORT

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class); 

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @PreAuthorize("hasAuthority('DIRETOR')")
    @PostMapping("/users")
    public ResponseEntity<User> createUserByAdmin(@RequestBody User newUser) {
        User savedUser = userService.createUser(newUser);
        return ResponseEntity.status(201).body(savedUser);
    }
    
    /**
     * Desassocia um utilizador de qualquer grupo (define group_id como null).
     */
    @PutMapping("/users/{userId}/remove-group")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<User> removeUserFromGroup(@PathVariable Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setGroup(null); // Define o grupo como nulo
            userRepository.save(user);
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }


    /**
     * MÉTODO ATUALIZADO PARA SUPORTE À PAGINAÇÃO (Pageable)
     */
    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    @Transactional
    public ResponseEntity<Page<User>> getAllUsers( // Retorna Page<User> em vez de List<User>
        @RequestParam(value = "groupId", required = false) Long groupId, 
        Pageable pageable, // NOVO PARÂMETRO
        Authentication authentication) {
        
        logger.info("ADMIN_ACCESS: Acessando lista de usuários. Diretor/Monitor: {}", authentication.getName());
        
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        boolean isDirector = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("DIRETOR"));
        
        Page<User> userPage;
        
        if (isDirector) {
            if (groupId != null) {
                userPage = userRepository.findByGroupIdAndRole(groupId, Role.DESBRAVADOR, pageable);
                logger.info("ADMIN_ACCESS: Filtrando Desbravadores pelo Grupo ID: {}. Página: {}", groupId, pageable.getPageNumber());
            } else {
                userPage = userRepository.findByRole(Role.DESBRAVADOR, pageable); 
                logger.info("ADMIN_ACCESS: Retornando todos os Desbravadores. Página: {}", pageable.getPageNumber());
            }
        } else {
            if (currentUser.getGroup() == null) {
                logger.warn("ADMIN_ACCESS: Monitor sem grupo. Retornando lista vazia.");
                return ResponseEntity.ok(Page.empty()); // Retorna Page vazia
            }
            userPage = userRepository.findByGroupIdAndRole(currentUser.getGroup().getId(), Role.DESBRAVADOR, pageable);
            logger.info("ADMIN_ACCESS: Monitor filtrando pelo seu próprio Grupo ID: {}. Página: {}", currentUser.getGroup().getId(), pageable.getPageNumber());
        }
        
        // CRÍTICO: FORÇA A INICIALIZAÇÃO DE TODOS OS CAMPOS LAZY PARA CADA USUÁRIO NA PÁGINA
        userPage.getContent().forEach(user -> {
             Hibernate.initialize(user.getSelectedBackground());
             Hibernate.initialize(user.getGroup());
             Hibernate.initialize(user.getBadges());
             Hibernate.initialize(user.getUnlockedBackgrounds());
        });
        
        logger.info("ADMIN_ACCESS: Sucesso ao serializar {} usuários na página {}.", userPage.getNumberOfElements(), userPage.getNumber());

        return ResponseEntity.ok(userPage);
    }

    @GetMapping("/users/monitors")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<List<User>> getAllMonitors() {
        List<User> monitors = userRepository.findByRole(Role.MONITOR);
        return ResponseEntity.ok(monitors);
    }
}