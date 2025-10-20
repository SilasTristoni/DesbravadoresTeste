package br.com.desbravadores.api.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.desbravadores.api.model.Achievement;
import br.com.desbravadores.api.model.Badge;
import br.com.desbravadores.api.model.RewardType;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.model.XpLog;
import br.com.desbravadores.api.repository.AchievementRepository;
import br.com.desbravadores.api.repository.BadgeRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.repository.XpLogRepository;

@Service
public class GamificationService {

    private static final Logger logger = LoggerFactory.getLogger(GamificationService.class);

    @Autowired private UserRepository userRepository;
    @Autowired private XpLogRepository xpLogRepository;
    @Autowired private AchievementRepository achievementRepository;
    @Autowired private BadgeRepository badgeRepository;

    // Fórmula de XP: XP necessário para o próximo nível = 100 + (nível_atual * 50)
    private int calculateXpForNextLevel(int currentLevel) {
        return 100 + (currentLevel * 50);
    }

    @Transactional
    public void grantXp(User user, int amount, String reason) {
        if (amount <= 0) return;

        user.setXp(user.getXp() + amount);
        logger.info("XP Concedido: {} para {}. Motivo: {}", amount, user.getName(), reason);

        // --- NOVA LÓGICA DE SUBIDA DE NÍVEL ---
        int xpNeeded = calculateXpForNextLevel(user.getLevel());
        while (user.getXp() >= xpNeeded) {
            // Sobe de nível
            user.setLevel(user.getLevel() + 1);
            // Subtrai o XP usado para subir de nível, mas mantém o excesso
            user.setXp(user.getXp() - xpNeeded);
            
            logger.info("LEVEL UP! {} alcançou o nível {}!", user.getName(), user.getLevel());

            // Calcula o XP necessário para o *novo* nível
            xpNeeded = calculateXpForNextLevel(user.getLevel());
        }
        // --- FIM DA NOVA LÓGICA ---

        userRepository.save(user);

        XpLog log = new XpLog();
        log.setUser(user);
        log.setAmount(amount);
        log.setReason(reason);
        log.setCreatedAt(LocalDateTime.now());
        xpLogRepository.save(log);
    }

    // (O restante da classe permanece o mesmo)
    @Transactional
    public User manuallyUnlockAchievement(Long userId, Long achievementId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o ID: " + userId));
        Achievement achievement = achievementRepository.findById(achievementId)
            .orElseThrow(() -> new RuntimeException("Conquista não encontrada com o ID: " + achievementId));

        boolean alreadyUnlocked = user.getBadges().stream()
                                      .anyMatch(badge -> badge.getName().equals(achievement.getName()));

        if (alreadyUnlocked) {
            logger.warn("Usuário {} já possui a conquista '{}'. Nenhuma ação foi tomada.", user.getName(), achievement.getName());
            return user;
        }

        logger.info("Desbloqueando manualmente a conquista '{}' para {}", achievement.getName(), user.getName());
        grantXp(user, achievement.getXpReward(), "Recebeu a conquista: " + achievement.getName());

        if (achievement.getRewardType() == RewardType.BADGE || achievement.getRewardType() == RewardType.SEAL) {
            Badge badge = new Badge();
            badge.setName(achievement.getName());
            badge.setDescription(achievement.getDescription());
            badge.setIcon(achievement.getIcon());
            badgeRepository.save(badge);
            user.getBadges().add(badge);
        }
        
        return userRepository.save(user);
    }

    @Transactional
    public User revokeAchievement(Long userId, Long achievementId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o ID: " + userId));
        Achievement achievement = achievementRepository.findById(achievementId)
            .orElseThrow(() -> new RuntimeException("Conquista não encontrada com o ID: " + achievementId));
        
        user.getBadges().removeIf(badge -> badge.getName().equals(achievement.getName()));
        logger.info("Revogando a conquista '{}' de {}", achievement.getName(), user.getName());
        
        return userRepository.save(user);
    }
}