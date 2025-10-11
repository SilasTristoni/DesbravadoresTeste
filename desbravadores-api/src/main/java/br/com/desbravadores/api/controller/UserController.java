package br.com.desbravadores.api.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    // A injeção do UserService foi removida pois não é mais usada.
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        return userOptional.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /*
     * O MÉTODO DE REGISTRO PÚBLICO FOI REMOVIDO DESTE CONTROLLER.
     * Toda a criação de usuários agora é feita pelo AdminController.
     */
}