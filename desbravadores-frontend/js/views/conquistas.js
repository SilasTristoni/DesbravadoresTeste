// js/views/conquistas.js

export async function renderConquistasView(viewElement) {
    viewElement.innerHTML = `<p>A carregar suas conquistas...</p>`;

    try {
        const [allAchievements, user] = await Promise.all([
            fetchApi('/api/gamification/achievements'),
            fetchApi('/api/profile/me')
        ]);
        
        const unlockedAchievementNames = new Set(user.badges.map(b => b.name));

        if (!allAchievements || allAchievements.length === 0) {
            viewElement.innerHTML = '<p>Nenhuma conquista disponível no momento.</p>';
            return;
        }

        viewElement.innerHTML = `
            <div class="achievements-container">
                <h2 class="section-title">Quadro de Conquistas</h2>
                <div class="achievements-grid">
                    ${allAchievements.map(achievement => {
                        const isUnlocked = unlockedAchievementNames.has(achievement.name);
                        return `
                            <div class="achievement-card-full ${isUnlocked ? 'unlocked' : 'locked'}">
                                <div class="achievement-header">
                                    <img src="http://localhost:8080${achievement.icon}" alt="${achievement.name}" class="achievement-icon-full">
                                    <div class="achievement-details">
                                        <h3>${achievement.name}</h3>
                                        <p>${achievement.description}</p>
                                    </div>
                                </div>
                                <div class="progress-section">
                                    <div class="unlocked-status">
                                        ${isUnlocked ? `⭐ Desbloqueado! (+${achievement.xpReward} XP)` : '🔒 Bloqueado'}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

    } catch (error) {
        viewElement.innerHTML = `<p style="color: red;">Não foi possível carregar as conquistas: ${error.message}</p>`;
    }
}