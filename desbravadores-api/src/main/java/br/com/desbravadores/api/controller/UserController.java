package br.com.desbravadores.api.controller;

import java.util.Optional;

import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping; // NOVO IMPORT
import org.springframework.web.bind.annotation.RestController; // NOVO IMPORT

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    @Transactional // CRÍTICO: Mantém a sessão aberta
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        
        return userOptional.map(user -> {
            // CRÍTICO: FORÇA A INICIALIZAÇÃO DE TODOS OS CAMPOS LAZY
            Hibernate.initialize(user.getSelectedBackground());
            Hibernate.initialize(user.getGroup());
            Hibernate.initialize(user.getBadges());
            Hibernate.initialize(user.getUnlockedBackgrounds());

            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    /*
     * O MÉTODO DE REGISTO PÚBLICO FOI REMOVIDO DESTE CONTROLLER.
     * Toda a criação de usuários agora é feita exclusivamente pelo AdminController.
     */
}