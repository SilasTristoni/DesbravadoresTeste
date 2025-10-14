package br.com.desbravadores.api.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<User> validateCredentials(String email, String plainPassword) {
        // --- LOG DE DEBUG 1 ---
        System.out.println("--- INICIANDO VALIDAÇÃO DE CREDENCIAIS ---");
        System.out.println("Buscando usuário com email: " + email);

        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            // --- LOG DE DEBUG 2 ---
            System.out.println("RESULTADO: Usuário não encontrado no banco de dados.");
            System.out.println("-------------------------------------------");
            return Optional.empty();
        }

        User user = userOptional.get();
        // --- LOG DE DEBUG 3 ---
        System.out.println("Usuário encontrado: " + user.getName());
        System.out.println("Senha recebida (pura): " + plainPassword);
        System.out.println("Senha no banco (hash): " + user.getPassword());

        // AQUI ESTÁ A VERIFICAÇÃO MAIS IMPORTANTE
        boolean passwordsMatch = passwordEncoder.matches(plainPassword, user.getPassword());

        // --- LOG DE DEBUG 4 ---
        System.out.println("Resultado da comparação de senhas (passwordEncoder.matches): " + passwordsMatch);

        if (passwordsMatch) {
            System.out.println("RESULTADO: Senhas coincidem. Login VÁLIDO.");
            System.out.println("-------------------------------------------");
            return Optional.of(user);
        }

        System.out.println("RESULTADO: Senhas NÃO coincidem. Login INVÁLIDO.");
        System.out.println("-------------------------------------------");
        return Optional.empty();
    }
}