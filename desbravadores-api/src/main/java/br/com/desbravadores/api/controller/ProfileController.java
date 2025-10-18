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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping; // NOVO IMPORT
import org.springframework.web.bind.annotation.RestController; // NOVO IMPORT

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    
    private static final Logger logger = LoggerFactory.getLogger(ProfileController.class);

    @Autowired
    private UserRepository userRepository;

    /**
     * Endpoint para buscar os dados do usuário atualmente autenticado.
     */
    @GetMapping("/me")
    @Transactional
    public ResponseEntity<User> getMyProfile(Authentication authentication) {
        String userEmail = authentication.getName();
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o email: " + userEmail));

        logger.info("PROFILE_ACCESS: Acessando perfil de {}. Iniciando campos lazy...", userEmail);

        // CRÍTICO: FORÇA A INICIALIZAÇÃO DE TODOS OS CAMPOS LAZY
        Hibernate.initialize(user.getSelectedBackground());
        Hibernate.initialize(user.getGroup());
        Hibernate.initialize(user.getBadges());
        Hibernate.initialize(user.getUnlockedBackgrounds());
        
        logger.info("PROFILE_ACCESS: Serialização de {} concluída com sucesso.", userEmail);

        return ResponseEntity.ok(user);
    }
    
    /**
     * NOVO ENDPOINT: Permite ao utilizador logado editar seu próprio perfil (Nome, Sobrenome, Avatar).
     */
    @PutMapping("/me")
    @Transactional
    public ResponseEntity<User> updateMyProfile(@RequestBody User userDetails, Authentication authentication) {
        String userEmail = authentication.getName();
        
        logger.info("PROFILE_UPDATE: Tentativa de atualização de perfil para {}", userEmail);

        return userRepository.findByEmail(userEmail).map(user -> {
            
            // Aplica as atualizações apenas se o novo valor não for nulo/vazio
            if (userDetails.getName() != null && !userDetails.getName().trim().isEmpty()) {
                user.setName(userDetails.getName().trim());
            }
            if (userDetails.getSurname() != null && !userDetails.getSurname().trim().isEmpty()) {
                user.setSurname(userDetails.getSurname().trim());
            }
            if (userDetails.getAvatar() != null && !userDetails.getAvatar().trim().isEmpty()) {
                user.setAvatar(userDetails.getAvatar().trim());
            }
            
            // Segurança: Não permite alteração de email/role/group por este endpoint
            
            User updatedUser = userRepository.save(user);

            // Re-inicializa os campos lazy antes de serializar a resposta
            Hibernate.initialize(updatedUser.getSelectedBackground());
            Hibernate.initialize(updatedUser.getGroup());
            Hibernate.initialize(updatedUser.getBadges());
            Hibernate.initialize(updatedUser.getUnlockedBackgrounds());
            
            logger.info("PROFILE_UPDATE: Perfil de {} atualizado com sucesso.", userEmail);
            
            return ResponseEntity.ok(updatedUser);
        }).orElse(ResponseEntity.notFound().build());
    }
}