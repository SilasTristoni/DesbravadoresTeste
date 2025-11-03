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
import org.springframework.web.bind.annotation.RequestParam; // NOVO IMPORT
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile; // NOVO IMPORT

import br.com.desbravadores.api.dto.PasswordChangeDTO; // NOVO IMPORT
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.FileStorageService; // NOVO IMPORT
import br.com.desbravadores.api.service.UserService; // NOVO IMPORT (será usado para o serviço de perfil)

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    
    private static final Logger logger = LoggerFactory.getLogger(ProfileController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService; // INJETANDO O USER SERVICE

    @Autowired
    private FileStorageService fileStorageService; // NOVO IMPORT

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
    
    /**
     * MÉTODO ATUALIZADO
     * Agora aceita multipart/form-data (upload de arquivo) em vez de JSON.
     */
    @PutMapping("/me")
    @Transactional
    public ResponseEntity<User> updateMyProfile(
            @RequestParam("name") String name,
            @RequestParam("surname") String surname,
            @RequestParam(value = "avatarFile", required = false) MultipartFile avatarFile,
            Authentication authentication) {
        
        String userEmail = authentication.getName();
        
        return userRepository.findByEmail(userEmail).map(user -> {
            
            // 1. Atualiza dados textuais
            if (name != null && !name.trim().isEmpty()) {
                user.setName(name.trim());
            }
            if (surname != null && !surname.trim().isEmpty()) {
                user.setSurname(surname.trim());
            }

            // 2. Processa o upload do novo avatar
            if (avatarFile != null && !avatarFile.isEmpty()) {
                
                // 3. Tenta apagar o avatar antigo, se existir
                try {
                    if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
                        // CORREÇÃO: Busca o nome do arquivo corretamente
                        String oldFilename = user.getAvatar().substring(user.getAvatar().lastIndexOf("/") + 1);
                        fileStorageService.delete(oldFilename);
                    }
                } catch (Exception e) {
                    logger.warn("Não foi possível apagar o avatar antigo: " + e.getMessage());
                }

                // 4. Salva o novo avatar
                String filename = fileStorageService.store(avatarFile);
                user.setAvatar("/file/" + filename); // CORREÇÃO: Caminho atualizado
            }

            // 5. Salva o usuário
            User updatedUser = userRepository.save(user);
            
            // 6. Inicializa os campos lazy (como no método original)
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