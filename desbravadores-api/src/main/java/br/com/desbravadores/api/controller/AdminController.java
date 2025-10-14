package br.com.desbravadores.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping; // Import geral
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

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
     * NOVO ENDPOINT ADICIONADO AQUI
     * Desassocia um utilizador de qualquer grupo (define group_id como null).
     * Acessível apenas por DIRETORES.
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


    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<List<User>> getAllUsers(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        boolean isDirector = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("DIRETOR"));
        List<User> users;
        if (isDirector) {
            users = userRepository.findByRole(Role.DESBRAVADOR);
        } else {
            if (currentUser.getGroup() == null) {
                return ResponseEntity.ok(List.of());
            }
            users = userRepository.findByGroupIdAndRole(currentUser.getGroup().getId(), Role.DESBRAVADOR);
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/monitors")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<List<User>> getAllMonitors() {
        List<User> monitors = userRepository.findByRole(Role.MONITOR);
        return ResponseEntity.ok(monitors);
    }
}