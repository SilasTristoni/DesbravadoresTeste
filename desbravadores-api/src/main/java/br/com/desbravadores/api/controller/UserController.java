package br.com.desbravadores.api.controller;

import java.util.Optional;

import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        
        return userOptional.map(user -> {
            Hibernate.initialize(user.getSelectedBackground());
            Hibernate.initialize(user.getGroup());
            // CORREÇÃO MVP: getBadges() -> getAchievements()
            Hibernate.initialize(user.getAchievements()); 
            Hibernate.initialize(user.getUnlockedBackgrounds());

            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }
}