package br.com.desbravadores.api.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.desbravadores.api.dto.ScoutOfTheMonthDTO;
import br.com.desbravadores.api.model.Achievement;
import br.com.desbravadores.api.repository.AchievementRepository;
import br.com.desbravadores.api.service.GamificationService;

@RestController
@RequestMapping("/api/gamification")
public class GamificationController {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private GamificationService gamificationService;

    @GetMapping("/achievements")
    public ResponseEntity<List<Achievement>> getAllAchievements() {
        return ResponseEntity.ok(achievementRepository.findAll());
    }

    @GetMapping("/scout-of-the-month")
    public ResponseEntity<ScoutOfTheMonthDTO> getScoutOfTheMonth() {
        ScoutOfTheMonthDTO scout = gamificationService.findScoutOfTheMonth();
        if (scout == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(scout);
    }
}