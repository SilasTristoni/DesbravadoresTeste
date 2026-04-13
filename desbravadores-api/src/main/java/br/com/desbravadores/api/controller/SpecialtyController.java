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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.Specialty;
import br.com.desbravadores.api.repository.SpecialtyRepository;

@RestController
@RequestMapping("/api")
public class SpecialtyController {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @GetMapping("/specialties")
    public ResponseEntity<Page<Specialty>> getAllSpecialties(Pageable pageable) {
        return ResponseEntity.ok(specialtyRepository.findAll(pageable));
    }

    @PostMapping("/admin/specialties")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> createSpecialty(@RequestBody Specialty specialty) {
        try {
            String normalizedName = normalize(specialty.getName());
            if (normalizedName == null || normalizedName.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "O nome da especialidade é obrigatório."));
            }
            if (specialtyRepository.existsByNameIgnoreCase(normalizedName)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Já existe uma especialidade com esse nome."));
            }

            specialty.setName(normalizedName);
            specialty.setArea(normalizeRequired(specialty.getArea(), "A área da especialidade é obrigatória."));
            specialty.setDescription(normalizeRequired(specialty.getDescription(), "A descrição da especialidade é obrigatória."));
            specialty.setIconName(normalizeRequired(specialty.getIconName(), "O ícone da especialidade é obrigatório."));
            specialty.setAccentColor(normalizeColor(specialty.getAccentColor()));

            return ResponseEntity.status(201).body(specialtyRepository.save(specialty));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/admin/specialties/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> updateSpecialty(@PathVariable Long id, @RequestBody Specialty updateData) {
        try {
            return specialtyRepository.findById(id).map(existing -> {
                String normalizedName = normalize(updateData.getName());
                if (normalizedName == null || normalizedName.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "O nome da especialidade é obrigatório."));
                }

                boolean duplicated = specialtyRepository.findByNameIgnoreCase(normalizedName)
                        .map(found -> !found.getId().equals(existing.getId()))
                        .orElse(false);
                if (duplicated) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Já existe uma especialidade com esse nome."));
                }

                existing.setName(normalizedName);
                existing.setArea(normalizeRequired(updateData.getArea(), "A área da especialidade é obrigatória."));
                existing.setDescription(normalizeRequired(updateData.getDescription(), "A descrição da especialidade é obrigatória."));
                existing.setIconName(normalizeRequired(updateData.getIconName(), "O ícone da especialidade é obrigatório."));
                existing.setAccentColor(normalizeColor(updateData.getAccentColor()));

                return ResponseEntity.ok(specialtyRepository.save(existing));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/specialties/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Void> deleteSpecialty(@PathVariable Long id) {
        if (!specialtyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        specialtyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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
        String normalized = normalizeRequired(value, "A cor da especialidade é obrigatória.");
        return normalized.startsWith("#") ? normalized : "#" + normalized;
    }
}
