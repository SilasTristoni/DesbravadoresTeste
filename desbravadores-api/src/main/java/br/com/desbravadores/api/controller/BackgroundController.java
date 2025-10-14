package br.com.desbravadores.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.desbravadores.api.model.Background;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.BackgroundRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.FileStorageService;

@RestController
@RequestMapping("/api")
public class BackgroundController {

    @Autowired
    private BackgroundRepository backgroundRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Endpoint para um DIRETOR criar um novo fundo de perfil.
     * Recebe o nome, a cor do texto e a imagem.
     */
    @PostMapping("/admin/backgrounds")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Background> createBackground(@RequestParam("name") String name,
                                                       @RequestParam("textColor") String textColor,
                                                       @RequestParam("imageFile") MultipartFile imageFile) {
        
        String imageFilename = fileStorageService.store(imageFile);
        String imageUrl = "/uploads/" + imageFilename;

        Background newBackground = new Background();
        newBackground.setName(name);
        newBackground.setImageUrl(imageUrl);
        newBackground.setTextColor(textColor);

        Background savedBackground = backgroundRepository.save(newBackground);
        return ResponseEntity.status(201).body(savedBackground);
    }

    /**
     * Endpoint para listar todos os fundos disponíveis.
     * Acessível por qualquer utilizador autenticado.
     */
    @GetMapping("/backgrounds")
    public ResponseEntity<List<Background>> getAllBackgrounds() {
        return ResponseEntity.ok(backgroundRepository.findAll());
    }

    /**
     * Endpoint para o UTILIZADOR LOGADO selecionar um fundo para o seu perfil.
     * Acessível por qualquer utilizador autenticado.
     */
    @PutMapping("/profile/me/background")
    public ResponseEntity<?> selectMyBackground(@RequestBody Map<String, Long> payload, Authentication authentication) {
        Long backgroundId = payload.get("backgroundId");

        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Background selectedBackground = backgroundRepository.findById(backgroundId).orElseThrow();

        // TODO: Adicionar lógica no futuro para verificar se o utilizador desbloqueou este fundo.
        // Por agora, qualquer utilizador pode selecionar qualquer fundo.

        currentUser.setSelectedBackground(selectedBackground);
        userRepository.save(currentUser);

        return ResponseEntity.ok(Map.of("message", "Fundo do perfil atualizado com sucesso."));
    }
}

    