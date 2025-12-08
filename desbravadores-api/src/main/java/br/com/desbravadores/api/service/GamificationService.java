package br.com.desbravadores.api.service;

import java.time.LocalDateTime;
import java.util.Comparator; 
import java.util.List;

import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.desbravadores.api.dto.ScoutOfTheMonthDTO;
import br.com.desbravadores.api.model.Achievement;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.model.XpLog;
import br.com.desbravadores.api.repository.AchievementRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.repository.XpLogRepository;

@Service
public class GamificationService {

    private static final Logger logger = LoggerFactory.getLogger(GamificationService.class);

    @Autowired private UserRepository userRepository;
    @Autowired private XpLogRepository xpLogRepository;
    @Autowired private AchievementRepository achievementRepository;

    private int calculateXpForNextLevel(int currentLevel) {
        return 100 + (currentLevel * 50);
    }

    @Transactional
    public void grantXp(User user, int amount, String reason) {
        if (amount <= 0) return;
        user.setXp(user.getXp() + amount);
        
        int xpNeeded = calculateXpForNextLevel(user.getLevel());
        while (user.getXp() >= xpNeeded) {
            user.setLevel(user.getLevel() + 1);
            user.setXp(user.getXp() - xpNeeded);
            xpNeeded = calculateXpForNextLevel(user.getLevel());
        }
        userRepository.save(user);

        XpLog log = new XpLog();
        log.setUser(user);
        log.setAmount(amount);
        log.setReason(reason);
        log.setCreatedAt(LocalDateTime.now());
        xpLogRepository.save(log);
    }

    @Transactional
    public User manuallyUnlockAchievement(Long userId, Long achievementId) {
        User user = userRepository.findById(userId).orElseThrow();
        Achievement achievement = achievementRepository.findById(achievementId).orElseThrow();

        // Verifica se já tem a conquista (na lista de achievements)
        if (user.getAchievements().contains(achievement)) {
            return user;
        }

        grantXp(user, achievement.getXpReward(), "Recebeu conquista: " + achievement.getName());
        
        // ADICIONA DIRETAMENTE A CONQUISTA
        user.getAchievements().add(achievement);

        return userRepository.save(user);
    }

    @Transactional
    public User revokeAchievement(Long userId, Long achievementId) {
        User user = userRepository.findById(userId).orElseThrow();
        Achievement achievement = achievementRepository.findById(achievementId).orElseThrow();

        if (user.getAchievements().remove(achievement)) {
            user.setXp(Math.max(0, user.getXp() - achievement.getXpReward()));
        }
        return userRepository.save(user);
    }

    @Transactional 
    public ScoutOfTheMonthDTO findScoutOfTheMonth() {
        List<User> desbravadores = userRepository.findByRole(Role.DESBRAVADOR);
        if (desbravadores.isEmpty()) return null;

        User topScout = desbravadores.stream()
            .peek(user -> Hibernate.initialize(user.getAchievements())) // Inicializa Achievements
            .max(Comparator.comparingInt(user -> user.getAchievements().size()))
            .orElse(null);

        if (topScout == null) return null;
        return new ScoutOfTheMonthDTO(topScout, topScout.getAchievements().size());
    }
}