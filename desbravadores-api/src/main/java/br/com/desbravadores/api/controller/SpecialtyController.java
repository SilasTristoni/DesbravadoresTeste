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

import br.com.desbravadores.api.model.Specialty;
import br.com.desbravadores.api.repository.SpecialtyRepository;
import br.com.desbravadores.api.service.FileStorageService;

@RestController
@RequestMapping("/api")
public class SpecialtyController {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping("/specialties")
    public ResponseEntity<Page<Specialty>> getAllSpecialties(Pageable pageable) {
        return ResponseEntity.ok(specialtyRepository.findAll(pageable));
    }

    @PostMapping("/admin/specialties")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> createSpecialty(
            @RequestParam("name") String name,
            @RequestParam("area") String area,
            @RequestParam("description") String description,
            @RequestParam(value = "iconName", required = false) String iconName,
            @RequestParam("accentColor") String accentColor,
            @RequestParam("iconSize") int iconSize,
            @RequestParam(value = "iconImageFile", required = false) MultipartFile iconImageFile) {
        try {
            String normalizedName = normalize(name);
            if (normalizedName == null || normalizedName.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "O nome da especialidade e obrigatorio."));
            }
            if (specialtyRepository.existsByNameIgnoreCase(normalizedName)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Ja existe uma especialidade com esse nome."));
            }

            Specialty specialty = new Specialty();
            specialty.setName(normalizedName);
            specialty.setArea(normalizeRequired(area, "A area da especialidade e obrigatoria."));
            specialty.setDescription(normalizeRequired(description, "A descricao da especialidade e obrigatoria."));
            specialty.setAccentColor(normalizeColor(accentColor));
            specialty.setIconSize(normalizeIconSize(iconSize));

            applyIconData(specialty, iconName, iconImageFile, false);

            return ResponseEntity.status(201).body(specialtyRepository.save(specialty));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/admin/specialties/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> updateSpecialty(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("area") String area,
            @RequestParam("description") String description,
            @RequestParam(value = "iconName", required = false) String iconName,
            @RequestParam("accentColor") String accentColor,
            @RequestParam("iconSize") int iconSize,
            @RequestParam(value = "iconImageFile", required = false) MultipartFile iconImageFile) {
        try {
            return specialtyRepository.findById(id).map(existing -> {
                String normalizedName = normalize(name);
                if (normalizedName == null || normalizedName.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "O nome da especialidade e obrigatorio."));
                }

                boolean duplicated = specialtyRepository.findByNameIgnoreCase(normalizedName)
                        .map(found -> !found.getId().equals(existing.getId()))
                        .orElse(false);
                if (duplicated) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Ja existe uma especialidade com esse nome."));
                }

                try {
                    existing.setName(normalizedName);
                    existing.setArea(normalizeRequired(area, "A area da especialidade e obrigatoria."));
                    existing.setDescription(normalizeRequired(description, "A descricao da especialidade e obrigatoria."));
                    existing.setAccentColor(normalizeColor(accentColor));
                    existing.setIconSize(normalizeIconSize(iconSize));
                    applyIconData(existing, iconName, iconImageFile, true);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
                }

                return ResponseEntity.ok(specialtyRepository.save(existing));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/specialties/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Void> deleteSpecialty(@PathVariable Long id) {
        return specialtyRepository.findById(id).map(specialty -> {
            deleteIconFileIfNeeded(specialty.getIconImageUrl());
            specialtyRepository.delete(specialty);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private void applyIconData(Specialty specialty, String iconName, MultipartFile iconImageFile, boolean allowExistingImage) {
        String normalizedIconName = normalize(iconName);
        boolean hasUploadedImage = iconImageFile != null && !iconImageFile.isEmpty();
        boolean keepExistingImage = allowExistingImage && !hasUploadedImage && specialty.getIconImageUrl() != null
                && (normalizedIconName == null || normalizedIconName.isBlank());

        if (hasUploadedImage) {
            deleteIconFileIfNeeded(specialty.getIconImageUrl());
            specialty.setIconImageUrl("/file/" + fileStorageService.store(iconImageFile));
            specialty.setIconName(null);
            return;
        }

        if (keepExistingImage) {
            specialty.setIconName(null);
            return;
        }

        specialty.setIconName(normalizeRequired(normalizedIconName, "Selecione um icone ou envie uma imagem para a especialidade."));
        deleteIconFileIfNeeded(specialty.getIconImageUrl());
        specialty.setIconImageUrl(null);
    }

    private void deleteIconFileIfNeeded(String iconImageUrl) {
        if (iconImageUrl != null && !iconImageUrl.isBlank()) {
            fileStorageService.delete(iconImageUrl.replace("/file/", ""));
        }
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

    private String normalizeColor(String value) {
        String normalized = normalizeRequired(value, "A cor da especialidade e obrigatoria.");
        return normalized.startsWith("#") ? normalized : "#" + normalized;
    }

    private Integer normalizeIconSize(int value) {
        if (value < 16 || value > 160) {
            throw new IllegalArgumentException("O tamanho do icone deve ficar entre 16 e 160.");
        }
        return value;
    }
}
