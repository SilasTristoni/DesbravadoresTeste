package br.com.desbravadores.api.controller;

import java.util.Optional; // NOVO IMPORT

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam; // Import estava faltando
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.desbravadores.api.model.Background;
import br.com.desbravadores.api.repository.BackgroundRepository;
import br.com.desbravadores.api.service.FileStorageService;

@RestController
public class BackgroundController {

    @Autowired
    private BackgroundRepository backgroundRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // Endpoint PÚBLICO para listar fundos
    @GetMapping("/api/backgrounds")
    public ResponseEntity<Page<Background>> getAllBackgrounds(Pageable pageable) {
        return ResponseEntity.ok(backgroundRepository.findAll(pageable));
    }

    // Endpoint de ADMIN para criar fundos
    @PostMapping("/api/admin/backgrounds")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Background> createBackground(
            @RequestParam("name") String name,
            @RequestParam("textColor") String textColor,
            @RequestParam("imageFile") MultipartFile imageFile) {

        String filename = fileStorageService.store(imageFile);
        String imageUrl = "/uploads/" + filename;

        Background newBackground = new Background();
        newBackground.setName(name);
        newBackground.setImageUrl(imageUrl);
        newBackground.setTextColor(textColor);

        Background savedBackground = backgroundRepository.save(newBackground);
        return ResponseEntity.status(201).body(savedBackground);
    }
    
    @PutMapping("/api/admin/backgrounds/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Background> updateBackground(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("textColor") String textColor,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {

        return backgroundRepository.findById(id).map(background -> {
            background.setName(name);
            background.setTextColor(textColor);

            if (imageFile != null && !imageFile.isEmpty()) {
                // Tenta apagar a imagem antiga
                try {
                    if (background.getImageUrl() != null && !background.getImageUrl().isEmpty()) {
                        String oldFilename = background.getImageUrl().replace("/uploads/", "");
                        fileStorageService.delete(oldFilename); // CORRIGIDO
                    }
                } catch (Exception e) {
                    System.err.println("Não foi possível apagar a imagem antiga: " + e.getMessage());
                }

                String filename = fileStorageService.store(imageFile);
                background.setImageUrl("/uploads/" + filename);
            }

            Background updatedBackground = backgroundRepository.save(background);
            return ResponseEntity.ok(updatedBackground);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * ENDPOINT ATUALIZADO: Corrigido o 'type mismatch'
     */
    @DeleteMapping("/api/admin/backgrounds/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Void> deleteBackground(@PathVariable Long id) {
        
        Optional<Background> optionalBackground = backgroundRepository.findById(id);

        if (!optionalBackground.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Background background = optionalBackground.get();

        // Apaga o arquivo de imagem associado
        try {
            if (background.getImageUrl() != null && !background.getImageUrl().isEmpty()) {
                String filename = background.getImageUrl().replace("/uploads/", "");
                fileStorageService.delete(filename); // CORRIGIDO
            }
        } catch (Exception e) {
            System.err.println("Não foi possível apagar o arquivo de imagem: " + e.getMessage());
        }

        // TODO: Desassociar o fundo de usuários que o utilizam.
        
        backgroundRepository.delete(background);
        return ResponseEntity.noContent().build();
    }
}