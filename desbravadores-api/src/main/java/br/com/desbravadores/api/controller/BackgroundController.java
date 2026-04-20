package br.com.desbravadores.api.controller;

import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.desbravadores.api.model.Background;
import br.com.desbravadores.api.repository.BackgroundRepository;
import br.com.desbravadores.api.service.FileStorageService;

@RestController
public class BackgroundController {

    private static final Logger log = LoggerFactory.getLogger(BackgroundController.class);

    @Autowired
    private BackgroundRepository backgroundRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping("/api/backgrounds")
    public ResponseEntity<Page<Background>> getAllBackgrounds(Pageable pageable) {
        return ResponseEntity.ok(backgroundRepository.findAll(pageable));
    }

    @PostMapping("/api/admin/backgrounds")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> createBackground(
            @RequestParam("name") String name,
            @RequestParam("textColor") String textColor,
            @RequestParam(value = "gradient", required = false) String gradient,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {

        try {
            String normalizedName = normalizeRequired(name, "O nome do fundo e obrigatorio.");
            if (backgroundRepository.existsByNameIgnoreCase(normalizedName)) {
                throw new IllegalArgumentException("Ja existe um fundo com esse nome.");
            }

            Background newBackground = new Background();
            newBackground.setName(normalizedName);
            newBackground.setTextColor(normalizeColor(textColor, "#FFFFFF"));
            newBackground.setGradient(normalizeOptional(gradient));

            if (imageFile != null && !imageFile.isEmpty()) {
                newBackground.setImageUrl("/file/" + fileStorageService.store(imageFile));
            }

            if (newBackground.getImageUrl() == null && newBackground.getGradient() == null) {
                throw new IllegalArgumentException("Informe uma imagem ou um gradiente para o fundo.");
            }

            return ResponseEntity.status(201).body(backgroundRepository.save(newBackground));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/api/admin/backgrounds/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> updateBackground(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("textColor") String textColor,
            @RequestParam(value = "gradient", required = false) String gradient,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {

        try {
            return backgroundRepository.findById(id).map(background -> {
                String normalizedName = normalizeRequired(name, "O nome do fundo e obrigatorio.");
                boolean duplicated = backgroundRepository.findByNameIgnoreCase(normalizedName)
                        .map(found -> !found.getId().equals(background.getId()))
                        .orElse(false);
                if (duplicated) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Ja existe um fundo com esse nome."));
                }

                background.setName(normalizedName);
                background.setTextColor(normalizeColor(textColor, "#FFFFFF"));
                if (gradient != null) {
                    background.setGradient(normalizeOptional(gradient));
                }

                if (imageFile != null && !imageFile.isEmpty()) {
                    try {
                        if (background.getImageUrl() != null && !background.getImageUrl().isEmpty()) {
                            fileStorageService.delete(background.getImageUrl().replace("/file/", ""));
                        }
                    } catch (Exception e) {
                        log.warn("Failed to delete previous background image id={} reason={}", id, e.getMessage());
                    }

                    background.setImageUrl("/file/" + fileStorageService.store(imageFile));
                }

                if (background.getImageUrl() == null && background.getGradient() == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "O fundo precisa ter imagem ou gradiente."));
                }

                return ResponseEntity.ok(backgroundRepository.save(background));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/api/admin/backgrounds/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Void> deleteBackground(@PathVariable Long id) {
        Optional<Background> optionalBackground = backgroundRepository.findById(id);

        if (optionalBackground.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Background background = optionalBackground.get();

        try {
            if (background.getImageUrl() != null && !background.getImageUrl().isEmpty()) {
                fileStorageService.delete(background.getImageUrl().replace("/file/", ""));
            }
        } catch (Exception e) {
            log.warn("Failed to delete background image id={} reason={}", id, e.getMessage());
        }

        backgroundRepository.delete(background);
        return ResponseEntity.noContent().build();
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeColor(String value, String fallback) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            normalized = fallback;
        }
        return normalized.startsWith("#") ? normalized : "#" + normalized;
    }
}
