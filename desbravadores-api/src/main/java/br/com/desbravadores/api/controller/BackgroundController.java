package br.com.desbravadores.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile; // IMPORT NECESSÁRIO

import br.com.desbravadores.api.model.Background;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.BackgroundRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.FileStorageService;

// DTO simples para receber dados de gradiente
class BackgroundGradientRequest {
    private String name;
    private String textColor;
    private String gradient;
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTextColor() { return textColor; }
    public void setTextColor(String textColor) { this.textColor = textColor; }
    public String getGradient() { return gradient; }
    public void setGradient(String gradient) { this.gradient = gradient; }
}


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
     * Endpoint para um DIRETOR criar um novo fundo de perfil a partir de uma IMAGEM.
     */
    @PostMapping("/admin/backgrounds")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Background> createBackgroundWithImage(@RequestParam("name") String name,
                                                       @RequestParam("textColor") String textColor,
                                                       @RequestParam("imageFile") MultipartFile imageFile) {
        
        String imageFilename = fileStorageService.store(imageFile);
        String imageUrl = "/uploads/" + imageFilename;

        Background newBackground = new Background();
        newBackground.setName(name);
        newBackground.setImageUrl(imageUrl);
        // FORÇA A COR DO TEXTO PARA BRANCO, conforme solicitação do utilizador
        newBackground.setTextColor("#FFFFFF");

        Background savedBackground = backgroundRepository.save(newBackground);
        return ResponseEntity.status(201).body(savedBackground);
    }
    
    /**
     * Endpoint para um DIRETOR criar um novo fundo de perfil a partir de um GRADIENTE CSS.
     */
    @PostMapping("/admin/backgrounds/gradient")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Background> createBackgroundWithGradient(@RequestBody BackgroundGradientRequest request) {
        
        Background newBackground = new Background();
        newBackground.setName(request.getName());
        newBackground.setGradient(request.getGradient()); // Define o gradiente
        // FORÇA A COR DO TEXTO PARA BRANCO, conforme solicitação do utilizador
        newBackground.setTextColor("#FFFFFF");
        newBackground.setImageUrl(null); // Garante que a URL da imagem é nula
        
        Background savedBackground = backgroundRepository.save(newBackground);
        return ResponseEntity.status(201).body(savedBackground);
    }


    /**
     * Endpoint para listar todos os fundos disponíveis.
     * CRÍTICO: Aplica @Transactional à lista
     */
    @GetMapping("/backgrounds")
    @Transactional
    public ResponseEntity<List<Background>> getAllBackgrounds() {
        return ResponseEntity.ok(backgroundRepository.findAll());
    }

    /**
     * Endpoint para o UTILIZADOR LOGADO selecionar um fundo para o seu perfil.
     * Acessível por qualquer utilizador autenticado.
     */
    @PutMapping("/profile/me/background")
    @Transactional
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