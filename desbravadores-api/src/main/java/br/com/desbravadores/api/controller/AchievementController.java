package br.com.desbravadores.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
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
}