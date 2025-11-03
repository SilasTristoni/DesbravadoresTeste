package br.com.desbravadores.api.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping; // NOVO IMPORT
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
        Page<Achievement> achievements = achievementRepository.findAll(pageable);
        return ResponseEntity.ok(achievements);
    }

    @PostMapping
    public ResponseEntity<Achievement> createAchievement(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("xpReward") int xpReward,
            @RequestParam("rewardType") String rewardType,
            @RequestParam("iconFile") MultipartFile iconFile) {

        String iconFilename = fileStorageService.store(iconFile);
        String iconUrl = "/uploads/" + iconFilename;

        Achievement newAchievement = new Achievement();
        newAchievement.setName(name);
        newAchievement.setDescription(description);
        newAchievement.setIcon(iconUrl);
        newAchievement.setXpReward(xpReward);
        newAchievement.setRewardType(RewardType.valueOf(rewardType));

        Achievement savedAchievement = achievementRepository.save(newAchievement);

        return ResponseEntity.status(201).body(savedAchievement);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Achievement> updateAchievement(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("xpReward") int xpReward,
            @RequestParam("rewardType") String rewardType,
            @RequestParam(value = "iconFile", required = false) MultipartFile iconFile) {

        return achievementRepository.findById(id).map(achievement -> {
            achievement.setName(name);
            achievement.setDescription(description);
            achievement.setXpReward(xpReward);
            achievement.setRewardType(RewardType.valueOf(rewardType));

            if (iconFile != null && !iconFile.isEmpty()) {
                // Tenta apagar o ícone antigo
                try {
                    if (achievement.getIcon() != null && !achievement.getIcon().isEmpty()) {
                        String oldFilename = achievement.getIcon().replace("/uploads/", "");
                        fileStorageService.delete(oldFilename); // CORRIGIDO (agora o método existe)
                    }
                } catch (Exception e) {
                    System.err.println("Não foi possível apagar o ícone antigo: " + e.getMessage());
                }

                String iconFilename = fileStorageService.store(iconFile);
                achievement.setIcon("/uploads/" + iconFilename);
            }

            Achievement updatedAchievement = achievementRepository.save(achievement);
            return ResponseEntity.ok(updatedAchievement);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * ENDPOINT ATUALIZADO: Corrigido o 'type mismatch'
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAchievement(@PathVariable Long id) {
        
        Optional<Achievement> optionalAchievement = achievementRepository.findById(id);

        if (!optionalAchievement.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Achievement achievement = optionalAchievement.get();

        // Apaga o ícone associado do armazenamento
        try {
            if (achievement.getIcon() != null && !achievement.getIcon().isEmpty()) {
                String filename = achievement.getIcon().replace("/uploads/", "");
                fileStorageService.delete(filename); // CORRIGIDO (agora o método existe)
            }
        } catch (Exception e) {
             System.err.println("Não foi possível apagar o arquivo de ícone: " + e.getMessage());
        }

        // TODO: Implementar a remoção da conquista de todos os usuários em UserService.
        
        achievementRepository.delete(achievement);
        return ResponseEntity.noContent().build();
    }
}