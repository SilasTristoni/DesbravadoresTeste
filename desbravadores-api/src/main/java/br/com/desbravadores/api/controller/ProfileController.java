package br.com.desbravadores.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Endpoint para buscar os dados do usuário atualmente autenticado.
     * O Spring Security nos fornece o objeto 'Authentication' que contém o email do usuário logado (via token).
     */
    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile(Authentication authentication) {
        String userEmail = authentication.getName();
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o email: " + userEmail));

        return ResponseEntity.ok(user);
    }
}