package br.com.desbravadores.api.controller;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.dto.CatalogMetadataDTO;
import br.com.desbravadores.api.repository.AchievementRepository;
import br.com.desbravadores.api.repository.BackgroundRepository;
import br.com.desbravadores.api.repository.RequirementRepository;
import br.com.desbravadores.api.repository.SpecialtyRepository;
import br.com.desbravadores.api.service.ApiDtoMapper;

@RestController
@RequestMapping("/api/admin/catalog")
@PreAuthorize("hasAuthority('DIRETOR')")
public class CatalogAdminController {

    private static final List<String> DEFAULT_CLASS_LEVELS = List.of(
            "Amigo",
            "Companheiro",
            "Pesquisador",
            "Pioneiro",
            "Excursionista",
            "Guia"
    );

    private static final List<String> DEFAULT_SPECIALTY_AREAS = List.of(
            "Natureza",
            "Servicos",
            "Artes Manuais",
            "Saude",
            "Tecnologia",
            "Aventura"
    );

    private static final List<String> DEFAULT_REQUIREMENT_ICONS = List.of(
            "book",
            "flag",
            "people",
            "leaf",
            "shield",
            "compass"
    );

    private static final List<String> DEFAULT_SPECIALTY_ICONS = List.of(
            "fa-compass",
            "fa-fire",
            "fa-tree",
            "fa-heart-pulse",
            "fa-water",
            "fa-hammer"
    );

    private static final List<String> DEFAULT_COLORS = List.of(
            "#27408b",
            "#386641",
            "#d97706",
            "#0f766e",
            "#b91c1c",
            "#7c3aed"
    );

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private BackgroundRepository backgroundRepository;

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private ApiDtoMapper apiDtoMapper;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> getSummary() {
        return ResponseEntity.ok(Map.of(
                "achievements", achievementRepository.count(),
                "backgrounds", backgroundRepository.count(),
                "specialties", specialtyRepository.count(),
                "requirements", requirementRepository.count()
        ));
    }

    @GetMapping("/metadata")
    public ResponseEntity<CatalogMetadataDTO> getMetadata() {
        LinkedHashSet<String> areas = new LinkedHashSet<>(DEFAULT_SPECIALTY_AREAS);
        areas.addAll(specialtyRepository.findDistinctAreas());

        return ResponseEntity.ok(new CatalogMetadataDTO(
                List.of("BADGE", "SEAL"),
                DEFAULT_CLASS_LEVELS,
                List.copyOf(areas),
                DEFAULT_REQUIREMENT_ICONS,
                DEFAULT_SPECIALTY_ICONS,
                DEFAULT_COLORS
        ));
    }

    @GetMapping("/{kind}")
    public ResponseEntity<?> getCatalog(@PathVariable String kind, Pageable pageable) {
        return switch (kind.toLowerCase()) {
            case "achievement", "achievements" -> ResponseEntity.ok(
                    achievementRepository.findAll(pageable).map(apiDtoMapper::toAchievementCatalogItem)
            );
            case "background", "backgrounds" -> ResponseEntity.ok(
                    backgroundRepository.findAll(pageable).map(apiDtoMapper::toBackgroundCatalogItem)
            );
            case "specialty", "specialties" -> ResponseEntity.ok(
                    specialtyRepository.findAll(pageable).map(apiDtoMapper::toSpecialtyCatalogItem)
            );
            case "requirement", "requirements" -> ResponseEntity.ok(
                    requirementRepository.findAll(pageable).map(apiDtoMapper::toRequirementCatalogItem)
            );
            default -> ResponseEntity.badRequest().body(Map.of("message", "Tipo de catalogo invalido."));
        };
    }
}
