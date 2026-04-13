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

import br.com.desbravadores.api.model.Requirement;
import br.com.desbravadores.api.repository.RequirementRepository;

@RestController
@RequestMapping("/api")
public class RequirementController {

    @Autowired
    private RequirementRepository requirementRepository;

    @GetMapping("/requirements")
    public ResponseEntity<Page<Requirement>> getAllRequirements(Pageable pageable) {
        return ResponseEntity.ok(requirementRepository.findAll(pageable));
    }

    @PostMapping("/admin/requirements")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> createRequirement(@RequestBody Requirement requirement) {
        try {
            requirement.setTitle(normalizeRequired(requirement.getTitle(), "O titulo do requisito e obrigatorio."));
            requirement.setCategory(normalizeRequired(requirement.getCategory(), "A categoria do requisito e obrigatoria."));
            requirement.setClassLevel(normalizeRequired(requirement.getClassLevel(), "A classe do requisito e obrigatoria."));
            requirement.setDescription(normalizeRequired(requirement.getDescription(), "A descricao do requisito e obrigatoria."));
            requirement.setIconName(normalizeRequired(requirement.getIconName(), "O icone do requisito e obrigatorio."));
            requirement.setDisplayOrder(normalizeOrder(requirement.getDisplayOrder()));

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
    public ResponseEntity<?> updateRequirement(@PathVariable Long id, @RequestBody Requirement updateData) {
        try {
            return requirementRepository.findById(id).map(existing -> {
                existing.setTitle(normalizeRequired(updateData.getTitle(), "O titulo do requisito e obrigatorio."));
                existing.setCategory(normalizeRequired(updateData.getCategory(), "A categoria do requisito e obrigatoria."));
                existing.setClassLevel(normalizeRequired(updateData.getClassLevel(), "A classe do requisito e obrigatoria."));
                existing.setDescription(normalizeRequired(updateData.getDescription(), "A descricao do requisito e obrigatoria."));
                existing.setIconName(normalizeRequired(updateData.getIconName(), "O icone do requisito e obrigatorio."));
                existing.setDisplayOrder(normalizeOrder(updateData.getDisplayOrder()));

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
        if (!requirementRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        requirementRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isDuplicated(String title, String classLevel, Long currentId) {
        return requirementRepository.findByTitleIgnoreCaseAndClassLevelIgnoreCase(title, classLevel)
                .map(found -> currentId == null || !found.getId().equals(currentId))
                .orElse(false);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }

        String normalized = value.trim();
        if (normalized.isBlank()) {
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
}
