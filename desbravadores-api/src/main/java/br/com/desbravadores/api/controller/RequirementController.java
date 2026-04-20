package br.com.desbravadores.api.controller;

import java.util.Map;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.desbravadores.api.model.Requirement;
import br.com.desbravadores.api.repository.RequirementRepository;
import br.com.desbravadores.api.service.FileStorageService;

@RestController
@RequestMapping("/api")
public class RequirementController {

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping("/requirements")
    public ResponseEntity<Page<Requirement>> getAllRequirements(Pageable pageable) {
        return ResponseEntity.ok(requirementRepository.findAll(pageable));
    }

    @PostMapping("/admin/requirements")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> createRequirement(
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("classLevel") String classLevel,
            @RequestParam("description") String description,
            @RequestParam(value = "iconName", required = false) String iconName,
            @RequestParam("iconSize") int iconSize,
            @RequestParam("displayOrder") int displayOrder,
            @RequestParam(value = "iconImageFile", required = false) MultipartFile iconImageFile) {
        try {
            Requirement requirement = new Requirement();
            requirement.setTitle(normalizeRequired(title, "O titulo do requisito e obrigatorio."));
            requirement.setCategory(normalizeRequired(category, "A categoria do requisito e obrigatoria."));
            requirement.setClassLevel(normalizeRequired(classLevel, "A classe do requisito e obrigatoria."));
            requirement.setDescription(normalizeRequired(description, "A descricao do requisito e obrigatoria."));
            requirement.setDisplayOrder(normalizeOrder(displayOrder));
            requirement.setIconSize(normalizeIconSize(iconSize));

            applyIconData(requirement, iconName, iconImageFile, false);

            if (isDuplicated(requirement.getTitle(), requirement.getClassLevel(), null)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Ja existe um requisito com esse titulo nessa classe."));
            }

            return ResponseEntity.status(201).body(requirementRepository.save(requirement));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/admin/requirements/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> updateRequirement(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("classLevel") String classLevel,
            @RequestParam("description") String description,
            @RequestParam(value = "iconName", required = false) String iconName,
            @RequestParam("iconSize") int iconSize,
            @RequestParam("displayOrder") int displayOrder,
            @RequestParam(value = "iconImageFile", required = false) MultipartFile iconImageFile) {
        try {
            return requirementRepository.findById(id).map(existing -> {
                try {
                    existing.setTitle(normalizeRequired(title, "O titulo do requisito e obrigatorio."));
                    existing.setCategory(normalizeRequired(category, "A categoria do requisito e obrigatoria."));
                    existing.setClassLevel(normalizeRequired(classLevel, "A classe do requisito e obrigatoria."));
                    existing.setDescription(normalizeRequired(description, "A descricao do requisito e obrigatoria."));
                    existing.setDisplayOrder(normalizeOrder(displayOrder));
                    existing.setIconSize(normalizeIconSize(iconSize));
                    applyIconData(existing, iconName, iconImageFile, true);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
                }

                if (isDuplicated(existing.getTitle(), existing.getClassLevel(), existing.getId())) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Ja existe um requisito com esse titulo nessa classe."));
                }

                return ResponseEntity.ok(requirementRepository.save(existing));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/requirements/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Void> deleteRequirement(@PathVariable Long id) {
        return requirementRepository.findById(id).map(requirement -> {
            deleteIconFileIfNeeded(requirement.getIconImageUrl());
            requirementRepository.delete(requirement);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private void applyIconData(Requirement requirement, String iconName, MultipartFile iconImageFile, boolean allowExistingImage) {
        String normalizedIconName = normalize(iconName);
        boolean hasUploadedImage = iconImageFile != null && !iconImageFile.isEmpty();
        boolean keepExistingImage = allowExistingImage && !hasUploadedImage && requirement.getIconImageUrl() != null
                && (normalizedIconName == null || normalizedIconName.isBlank());

        if (hasUploadedImage) {
            deleteIconFileIfNeeded(requirement.getIconImageUrl());
            requirement.setIconImageUrl("/file/" + fileStorageService.store(iconImageFile));
            requirement.setIconName(null);
            return;
        }

        if (keepExistingImage) {
            requirement.setIconName(null);
            return;
        }

        requirement.setIconName(normalizeRequired(normalizedIconName, "Selecione um icone ou envie uma imagem para o requisito."));
        deleteIconFileIfNeeded(requirement.getIconImageUrl());
        requirement.setIconImageUrl(null);
    }

    private void deleteIconFileIfNeeded(String iconImageUrl) {
        if (iconImageUrl != null && !iconImageUrl.isBlank()) {
            fileStorageService.delete(iconImageUrl.replace("/file/", ""));
        }
    }

    private boolean isDuplicated(String title, String classLevel, Long currentId) {
        return requirementRepository.findByTitleIgnoreCaseAndClassLevelIgnoreCase(title, classLevel)
                .map(found -> currentId == null || !found.getId().equals(currentId))
                .orElse(false);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalize(value);
        if (normalized == null || normalized.isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return normalized;
    }

    private int normalizeOrder(int value) {
        if (value < 0) {
            throw new IllegalArgumentException("A ordem do requisito nao pode ser negativa.");
        }

        return value;
    }

    private Integer normalizeIconSize(int value) {
        if (value < 16 || value > 160) {
            throw new IllegalArgumentException("O tamanho do icone deve ficar entre 16 e 160.");
        }
        return value;
    }
}
