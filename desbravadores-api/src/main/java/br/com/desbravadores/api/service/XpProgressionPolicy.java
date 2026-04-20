package br.com.desbravadores.api.service;

public final class XpProgressionPolicy {

    private XpProgressionPolicy() {
    }

    public static int xpForNextLevel(int currentLevel) {
        int normalizedLevel = Math.max(currentLevel, 1);
        return 100 + (normalizedLevel * 50);
    }

    public static int totalXpForSnapshot(int level, int currentLevelXp) {
        int normalizedLevel = Math.max(level, 1);
        int totalXp = Math.max(currentLevelXp, 0);

        for (int current = 1; current < normalizedLevel; current++) {
            totalXp += xpForNextLevel(current);
        }

        return totalXp;
    }

    public static ProgressSnapshot snapshotFromTotalXp(int totalXp) {
        int remaining = Math.max(totalXp, 0);
        int level = 1;
        int xpForNextLevel = xpForNextLevel(level);

        while (remaining >= xpForNextLevel) {
            remaining -= xpForNextLevel;
            level++;
            xpForNextLevel = xpForNextLevel(level);
        }

        return new ProgressSnapshot(level, remaining, xpForNextLevel);
    }

    public record ProgressSnapshot(int level, int currentLevelXp, int xpForNextLevel) {
    }
}
