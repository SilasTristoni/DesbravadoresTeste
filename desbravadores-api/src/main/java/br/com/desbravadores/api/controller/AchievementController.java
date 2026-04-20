package br.com.desbravadores.api.controller;

import java.util.Map;
import java.util.Optional;

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

import br.com.desbravadores.api.model.Achievement;
import br.com.desbravadores.api.model.RewardType;
import br.com.desbravadores.api.repository.AchievementRepository;
import br.com.desbravadores.api.service.FileStorageService;

@RestController
@RequestMapping("/api/admin/achievements")
@PreAuthorize("hasAuthority('DIRETOR')")
public class AchievementController {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<Page<Achievement>> getAllAchievements(Pageable pageable) {
        return ResponseEntity.ok(achievementRepository.findAll(pageable));
    }

    @PostMapping
    public ResponseEntity<?> createAchievement(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("xpReward") int xpReward,
            @RequestParam("rewardType") String rewardType,
            @RequestParam("iconFile") MultipartFile iconFile) {

        try {
            if (iconFile == null || iconFile.isEmpty()) {
                throw new IllegalArgumentException("O icone da conquista e obrigatorio.");
            }

            String normalizedName = normalizeRequired(name, "O nome da conquista e obrigatorio.");
            if (achievementRepository.existsByNameIgnoreCase(normalizedName)) {
                throw new IllegalArgumentException("Ja existe uma conquista com esse nome.");
            }

            Achievement newAchievement = new Achievement();
            newAchievement.setName(normalizedName);
            newAchievement.setDescription(normalizeRequired(description, "A descricao da conquista e obrigatoria."));
            newAchievement.setXpReward(normalizeXp(xpReward));
            newAchievement.setRewardType(parseRewardType(rewardType));
            newAchievement.setIcon("/file/" + fileStorageService.store(iconFile));

            return ResponseEntity.status(201).body(achievementRepository.save(newAchievement));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAchievement(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("xpReward") int xpReward,
            @RequestParam("rewardType") String rewardType,
            @RequestParam(value = "iconFile", required = false) MultipartFile iconFile) {

        try {
            return achievementRepository.findById(id).map(achievement -> {
                String normalizedName = normalizeRequired(name, "O nome da conquista e obrigatorio.");
                boolean duplicated = achievementRepository.findByNameIgnoreCase(normalizedName)
                        .map(found -> !found.getId().equals(achievement.getId()))
                        .orElse(false);
                if (duplicated) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Ja existe uma conquista com esse nome."));
                }

                achievement.setName(normalizedName);
                achievement.setDescription(normalizeRequired(description, "A descricao da conquista e obrigatoria."));
                achievement.setXpReward(normalizeXp(xpReward));
                achievement.setRewardType(parseRewardType(rewardType));

                if (iconFile != null && !iconFile.isEmpty()) {
                    try {
                        if (achievement.getIcon() != null && !achievement.getIcon().isEmpty()) {
                            fileStorageService.delete(achievement.getIcon().replace("/file/", ""));
                        }
                    } catch (Exception ignored) {
                    }
                    achievement.setIcon("/file/" + fileStorageService.store(iconFile));
                }

                return ResponseEntity.ok(achievementRepository.save(achievement));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAchievement(@PathVariable Long id) {
        Optional<Achievement> optionalAchievement = achievementRepository.findById(id);

        if (optionalAchievement.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Achievement achievement = optionalAchievement.get();

        try {
            if (achievement.getIcon() != null && !achievement.getIcon().isEmpty()) {
                fileStorageService.delete(achievement.getIcon().replace("/file/", ""));
            }
        } catch (Exception ignored) {
        }

        achievementRepository.delete(achievement);
        return ResponseEntity.noContent().build();
    }

    private RewardType parseRewardType(String rewardType) {
        try {
            return RewardType.valueOf(normalizeRequired(rewardType, "O tipo de recompensa e obrigatorio."));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Tipo de recompensa invalido.");
        }
    }

    private int normalizeXp(int xpReward) {
        if (xpReward < 0) {
            throw new IllegalArgumentException("O XP da conquista nao pode ser negativo.");
        }
        return xpReward;
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
}
