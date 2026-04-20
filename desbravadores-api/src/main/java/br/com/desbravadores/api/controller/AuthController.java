package br.com.desbravadores.api.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import br.com.desbravadores.api.dto.PasswordResetConfirmDTO;
import br.com.desbravadores.api.dto.PasswordResetRequestInputDTO;
import br.com.desbravadores.api.dto.PasswordResetStatusDTO;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.PasswordResetService;
import br.com.desbravadores.api.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

class LoginRequest {
    @NotBlank(message = "O identificador nao pode ser vazio.")
    private String username;

    @NotBlank(message = "A senha nao pode ser vazia.")
    private String password;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
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

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        if (authentication.isAuthenticated()) {
            User user = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow();
            String token = tokenService.generateToken(user);
            return ResponseEntity.ok(Map.of("token", token));
        }

        throw new UsernameNotFoundException("Requisicao de usuario invalida.");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            try {
                String newToken = tokenService.refreshToken(headerAuth);
                return ResponseEntity.ok(Map.of(
                        "token", newToken,
                        "type", "Bearer"
                ));
            } catch (Exception error) {
                return ResponseEntity.status(403).body("Erro ao renovar token: " + error.getMessage());
            }
        }

        return ResponseEntity.badRequest().body("Token nao fornecido.");
    }

    @PostMapping("/password-resets/request")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequestInputDTO payload) {
        passwordResetService.requestReset(payload.username());
        return ResponseEntity.ok(Map.of(
                "message",
                "Se o identificador existir, a solicitacao foi encaminhada para aprovacao do administrador."
        ));
    }

    @PostMapping("/password-resets/confirm")
    public ResponseEntity<?> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmDTO payload) {
        try {
            passwordResetService.confirmReset(payload.username(), payload.resetCode(), payload.newPassword());
            return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso."));
        } catch (RuntimeException error) {
            return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
        }
    }

    @GetMapping("/password-resets/status")
    public ResponseEntity<PasswordResetStatusDTO> getPasswordResetStatus(@RequestParam("username") String username) {
        return ResponseEntity.ok(passwordResetService.getPublicResetStatus(username));
    }
}
