package br.com.desbravadores.api.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired; // IMPORT NOVO
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

class LoginRequest {
    @NotBlank(message = "O email não pode ser vazio.")
    @Email(message = "Formato de email inválido.")
    private String email;

    @NotBlank(message = "A senha não pode ser vazia.")
    private String password;
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;
    
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        if (authentication.isAuthenticated()) {
            User user = userRepository.findByEmail(loginRequest.getEmail()).get();
            String token = tokenService.generateToken(user);
            return ResponseEntity.ok(Map.of("token", token));
        } else {
            throw new UsernameNotFoundException("Requisição de usuário inválida!");
        }
    }

    // NOVO ENDPOINT DE REFRESH
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        
        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            try {
                // Chama o serviço para criar um novo token baseado no antigo
                String newToken = tokenService.refreshToken(headerAuth);
                return ResponseEntity.ok(Map.of(
                    "token", newToken,
                    "type", "Bearer"
                ));
            } catch (Exception e) {
                return ResponseEntity.status(403).body("Erro ao renovar token: " + e.getMessage());
            }
        }
        return ResponseEntity.badRequest().body("Token não fornecido.");
    }
}