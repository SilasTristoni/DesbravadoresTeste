import { fetchApi } from "../../core/apiClient.js";
import { resolveAssetUrl } from "../../core/url.js";
import { showToast } from "../../ui/toast.js";

function getAchievementIcon(achievement) {
    return achievement.icon ? resolveAssetUrl(achievement.icon) : "img/escoteiro1.png";
}

function getUserName(user) {
    return `${user.name || ""} ${user.surname || ""}`.trim() || user.username || "Utilizador";
}

function getAchievementTypeLabel(achievement) {
    return achievement.rewardType === "SEAL" ? "Selo" : "Emblema";
}

export async function renderManageAchievementsView(viewElement, userId) {
    if (!userId) {
        viewElement.innerHTML = '<div class="admin-widget"><p>Nenhum utilizador foi selecionado.</p></div>';
        return;
    }

    viewElement.innerHTML = '<div class="admin-widget"><p>A carregar conquistas do utilizador...</p></div>';

    try {
        const [user, allAchievements] = await Promise.all([
            fetchApi(`/api/users/${userId}`),
            fetchApi("/api/gamification/achievements")
        ]);

        const unlockedAchievementIds = new Set((user.achievements || []).map((achievement) => achievement.id));

        viewElement.innerHTML = `
            <div class="admin-widget achievements-admin-shell">
                <div class="admin-section-header">
                    <div>
                        <p class="section-kicker">Gestao de conquistas</p>
                        <h2>Conquistas de ${getUserName(user)}</h2>
                        <p class="section-subtitle">Conceda ou revogue emblemas e selos que o aluno podera visualizar no perfil.</p>
                    </div>
                    <button id="back-to-managed-profile" class="btn-action cancel">
                        <i class="fa-solid fa-arrow-left"></i>
                        Voltar
                    </button>
                </div>
                <div class="achievement-admin-grid">
                    ${allAchievements.length > 0 ? allAchievements.map((achievement) => {
                        const unlocked = unlockedAchievementIds.has(achievement.id);
                        return `
                            <article class="achievement-admin-card ${unlocked ? "is-unlocked" : ""}">
                                <img src="${getAchievementIcon(achievement)}" alt="${achievement.name}" class="achievement-admin-icon">
                                <div class="achievement-admin-copy">
                                    <span class="achievement-admin-type">${getAchievementTypeLabel(achievement)}</span>
                                    <h3>${achievement.name}</h3>
                                    <p>${achievement.description || "Sem descricao."}</p>
                                </div>
                                <div class="achievement-admin-meta">
                                    <span class="achievement-admin-xp">+${achievement.xpReward || 0} XP</span>
                                    <button
                                        class="action-btn-small ${unlocked ? "revoke-btn" : "grant-btn"}"
                                        data-user-id="${userId}"
                                        data-achievement-id="${achievement.id}"
                                        data-action="${unlocked ? "revoke" : "grant"}">
                                        ${unlocked ? "Revogar" : "Conceder"}
                                    </button>
                                </div>
                            </article>
                        `;
                    }).join("") : '<p>Nenhuma conquista foi criada ainda. Cadastre uma em "Criar Item".</p>'}
                </div>
            </div>
        `;

        viewElement.querySelector("#back-to-managed-profile")?.addEventListener("click", async () => {
            try {
                const refreshedUser = await fetchApi(`/api/admin/users/${userId}`);
                window.dispatchEvent(new CustomEvent("navigate", {
                    detail: { view: "manage-profile", data: refreshedUser }
                }));
            } catch (error) {
                showToast("Nao foi possivel reabrir o perfil gerido.", "error");
            }
        });

        viewElement.querySelectorAll("[data-action]").forEach((button) => {
            button.addEventListener("click", async (event) => {
                const currentButton = event.currentTarget;
                const targetUserId = currentButton.dataset.userId;
                const achievementId = currentButton.dataset.achievementId;
                const action = currentButton.dataset.action;

                currentButton.disabled = true;
                currentButton.textContent = "Aguarde...";

                try {
                    const method = action === "grant" ? "POST" : "DELETE";
                    const response = await fetchApi(`/api/admin/users/${targetUserId}/achievements/${achievementId}`, { method });
                    showToast(response.message || "Conquista atualizada.", "success");
                    await renderManageAchievementsView(viewElement, userId);
                } catch (error) {
                    showToast(error.message || "Nao foi possivel atualizar a conquista.", "error");
                    currentButton.disabled = false;
                    currentButton.textContent = action === "grant" ? "Conceder" : "Revogar";
                }
            });
        });
    } catch (error) {
        viewElement.innerHTML = `<div class="admin-widget"><p style="color: #c62828;">Nao foi possivel carregar a gestao de conquistas: ${error.message}</p></div>`;
    }
}
