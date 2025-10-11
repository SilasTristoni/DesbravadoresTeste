package br.com.desbravadores.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    // Este endpoint só será acessível por usuários com a permissão correta (definido no SecurityConfig)
    @PostMapping("/users")
    public ResponseEntity<User> createUserByAdmin(@RequestBody User newUser) {
        // O objeto 'newUser' que vem do frontend do admin já contém o 'role'
        // Chamamos o método genérico 'createUser' do nosso serviço
        User savedUser = userService.createUser(newUser);
        return ResponseEntity.status(201).body(savedUser);
    }
}