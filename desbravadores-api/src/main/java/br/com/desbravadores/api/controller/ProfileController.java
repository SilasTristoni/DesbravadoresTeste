package br.com.desbravadores.api.controller;

import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping; // NOVO IMPORT
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.dto.PasswordChangeDTO; // NOVO IMPORT
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.UserService; // NOVO IMPORT (será usado para o serviço de perfil)

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    
    private static final Logger logger = LoggerFactory.getLogger(ProfileController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService; // INJETANDO O USER SERVICE

    @GetMapping("/me")
    @Transactional
    public ResponseEntity<User> getMyProfile(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o email: " + userEmail));
        
        Hibernate.initialize(user.getSelectedBackground());
        Hibernate.initialize(user.getGroup());
        Hibernate.initialize(user.getBadges());
        Hibernate.initialize(user.getUnlockedBackgrounds());
        
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/me")
    @Transactional
    public ResponseEntity<User> updateMyProfile(@RequestBody User userDetails, Authentication authentication) {
        String userEmail = authentication.getName();
        return userRepository.findByEmail(userEmail).map(user -> {
            if (userDetails.getName() != null && !userDetails.getName().trim().isEmpty()) {
                user.setName(userDetails.getName().trim());
            }
            if (userDetails.getSurname() != null && !userDetails.getSurname().trim().isEmpty()) {
                user.setSurname(userDetails.getSurname().trim());
            }
            if (userDetails.getAvatar() != null && !userDetails.getAvatar().trim().isEmpty()) {
                user.setAvatar(userDetails.getAvatar().trim());
            }
            User updatedUser = userRepository.save(user);
            Hibernate.initialize(updatedUser.getSelectedBackground());
            Hibernate.initialize(updatedUser.getGroup());
            Hibernate.initialize(updatedUser.getBadges());
            Hibernate.initialize(updatedUser.getUnlockedBackgrounds());
            return ResponseEntity.ok(updatedUser);
        }).orElse(ResponseEntity.notFound().build());
    }

    // NOVO ENDPOINT PARA ALTERAR A SENHA
    @PostMapping("/me/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordChangeDTO passwordChangeDTO, Authentication authentication) {
        try {
            userService.changeUserPassword(authentication.getName(), passwordChangeDTO);
            return ResponseEntity.ok().body("Senha alterada com sucesso.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}