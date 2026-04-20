package br.com.desbravadores.api.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.desbravadores.api.dto.ScoutOfTheMonthDTO;
import br.com.desbravadores.api.dto.XpHistoryItemDTO;
import br.com.desbravadores.api.dto.XpSummaryDTO;
import br.com.desbravadores.api.model.Achievement;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.model.XpLog;
import br.com.desbravadores.api.model.XpSourceType;
import br.com.desbravadores.api.repository.AchievementRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.repository.XpLogRepository;

@Service
public class GamificationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private XpLogRepository xpLogRepository;

    @Autowired
    private AchievementRepository achievementRepository;

    @Transactional(readOnly = true)
    public XpSummaryDTO getXpSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilizador nao encontrado."));

        XpProgressionPolicy.ProgressSnapshot snapshot = XpProgressionPolicy.snapshotFromTotalXp(user.getTotalXp());
        int achievementXp = xpLogRepository.sumAmountByUserIdAndSourceTypes(
                userId,
                List.of(XpSourceType.ACHIEVEMENT_GRANTED, XpSourceType.ACHIEVEMENT_REVOKED)
        );
        int manualXp = xpLogRepository.sumAmountByUserIdAndSourceTypes(
                userId,
                List.of(XpSourceType.ADMIN_ADJUSTMENT)
        );

        List<XpHistoryItemDTO> history = xpLogRepository.findTop12ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(XpHistoryItemDTO::new)
                .toList();

        return new XpSummaryDTO(
                snapshot.level(),
                snapshot.currentLevelXp(),
                user.getTotalXp(),
                snapshot.xpForNextLevel(),
                Math.max(snapshot.xpForNextLevel() - snapshot.currentLevelXp(), 0),
                achievementXp,
                manualXp,
                history
        );
    }

    @Transactional
    public XpSummaryDTO adjustXp(Long userId, int amount, String reason, String actorUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilizador nao encontrado."));

        if (amount == 0) {
            throw new RuntimeException("O ajuste de XP nao pode ser zero.");
        }

        applyXpChange(
                user,
                amount,
                normalizeReason(reason, "Ajuste manual de XP"),
                XpSourceType.ADMIN_ADJUSTMENT,
                "user",
                user.getId(),
                user.getUsername(),
                actorUsername
        );

        return getXpSummary(userId);
    }

    @Transactional
    public void grantXp(User user, int amount, String reason) {
        applyXpChange(
                user,
                amount,
                normalizeReason(reason, "Ajuste manual de XP"),
                XpSourceType.ADMIN_ADJUSTMENT,
                "user",
                user.getId(),
                user.getUsername(),
                "sistema"
        );
    }

    @Transactional
    public User manuallyUnlockAchievement(Long userId, Long achievementId, String actorUsername) {
        User user = userRepository.findById(userId).orElseThrow();
        Achievement achievement = achievementRepository.findById(achievementId).orElseThrow();

        if (user.getAchievements().contains(achievement)) {
            return user;
        }

        user.getAchievements().add(achievement);
        userRepository.save(user);

        if (achievement.getXpReward() > 0) {
            applyXpChange(
                    user,
                    achievement.getXpReward(),
                    "Conquista desbloqueada: " + achievement.getName(),
                    XpSourceType.ACHIEVEMENT_GRANTED,
                    "achievement",
                    achievement.getId(),
                    achievement.getName(),
                    actorUsername
            );
        }

        return userRepository.save(user);
    }

    @Transactional
    public User revokeAchievement(Long userId, Long achievementId, String actorUsername) {
        User user = userRepository.findById(userId).orElseThrow();
        Achievement achievement = achievementRepository.findById(achievementId).orElseThrow();

        if (!user.getAchievements().remove(achievement)) {
            return user;
        }

        userRepository.save(user);

        if (achievement.getXpReward() > 0) {
            applyXpChange(
                    user,
                    achievement.getXpReward() * -1,
                    "Conquista revogada: " + achievement.getName(),
                    XpSourceType.ACHIEVEMENT_REVOKED,
                    "achievement",
                    achievement.getId(),
                    achievement.getName(),
                    actorUsername
            );
        }

        return userRepository.save(user);
    }

    @Transactional
    public ScoutOfTheMonthDTO findScoutOfTheMonth() {
        List<User> desbravadores = userRepository.findByRole(Role.DESBRAVADOR);
        if (desbravadores.isEmpty()) {
            return null;
        }

        User topScout = desbravadores.stream()
                .peek(user -> Hibernate.initialize(user.getAchievements()))
                .max(Comparator.comparingInt(user -> user.getAchievements().size()))
                .orElse(null);

        if (topScout == null) {
            return null;
        }

        return new ScoutOfTheMonthDTO(topScout, topScout.getAchievements().size());
    }

    private void applyXpChange(
            User user,
            int requestedAmount,
            String reason,
            XpSourceType sourceType,
            String referenceType,
            Long referenceId,
            String referenceLabel,
            String actorUsername
    ) {
        if (requestedAmount == 0) {
            return;
        }

        int nextTotalXp = Math.max(user.getTotalXp() + requestedAmount, 0);
        int effectiveAmount = nextTotalXp - user.getTotalXp();

        if (effectiveAmount == 0) {
            return;
        }

        user.setTotalXp(nextTotalXp);

        XpProgressionPolicy.ProgressSnapshot snapshot = XpProgressionPolicy.snapshotFromTotalXp(nextTotalXp);
        user.setLevel(snapshot.level());
        user.setXp(snapshot.currentLevelXp());
        userRepository.save(user);

        XpLog log = new XpLog();
        log.setUser(user);
        log.setAmount(effectiveAmount);
        log.setReason(reason);
        log.setSourceType(sourceType);
        log.setReferenceType(referenceType);
        log.setReferenceId(referenceId);
        log.setReferenceLabel(referenceLabel);
        log.setPerformedBy(normalizeActor(actorUsername));
        log.setBalanceAfter(nextTotalXp);
        log.setLevelAfter(snapshot.level());
        log.setCurrentLevelXpAfter(snapshot.currentLevelXp());
        log.setCreatedAt(LocalDateTime.now());
        xpLogRepository.save(log);
    }

    private String normalizeReason(String value, String fallback) {
        if (value == null || value.trim().isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private String normalizeActor(String actorUsername) {
        if (actorUsername == null || actorUsername.trim().isBlank()) {
            return "sistema";
        }
        return actorUsername.trim();
    }
}
