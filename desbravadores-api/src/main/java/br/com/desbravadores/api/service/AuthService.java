package br.com.desbravadores.api.service;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<User> validateCredentials(String username, String plainPassword) {
        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isEmpty()) {
            log.warn("Login attempt with unknown username={}", username);
            return Optional.empty();
        }

        User user = userOptional.get();
        boolean passwordsMatch = passwordEncoder.matches(plainPassword, user.getPassword());

        if (passwordsMatch) {
            log.info("Login credentials validated for username={}", username);
            return Optional.of(user);
        }

        log.warn("Login attempt with invalid password username={}", username);
        return Optional.empty();
    }
}
