// js/views/admin/manage-achievements.js

export async function renderManageAchievementsView(viewElement, userId) {
    if (!userId) {
        viewElement.innerHTML = `<p>Erro: Nenhum utilizador selecionado.</p>`;
        return;
    }

    viewElement.innerHTML = `<p>A carregar dados de conquistas...</p>`;

    try {
        const [user, allBadges] = await Promise.all([
            fetchApi(`/api/users/${userId}`),
            fetchApi('/api/badges')
        ]);

        const userBadgeIds = new Set(user.badges.map(b => b.id));

        viewElement.innerHTML = `
            <div class="admin-widget">
                <h2>Gerir Emblemas para: ${user.name} ${user.surname}</h2>
                <p>Clique num emblema para o atribuir ou remover.</p>
                <div id="badges-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                    ${allBadges.map(badge => `
                        <div class="achievement-card ${userBadgeIds.has(badge.id) ? 'is-featured' : ''}" data-badge-id="${badge.id}" style="cursor: pointer;">
                            <img src="http://localhost:8080${badge.icon}" alt="${badge.name}" style="width: 40px; height: 40px; border-radius: 50%;">
                            <div class="achievement-info">
                                <h4>${badge.name}</h4>
                                <p>${badge.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        viewElement.querySelectorAll('.achievement-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                const clickedCard = e.currentTarget;
                const badgeId = clickedCard.dataset.badgeId;
                const hasBadge = clickedCard.classList.contains('is-featured');
                
                // ---- LÓGICA ATUALIZADA AQUI ----

                if (hasBadge) {
                    // Se o utilizador já tem o emblema, a ação é REMOVER
                    if (confirm(`Tem a certeza de que quer REMOVER o emblema "${clickedCard.querySelector('h4').textContent}" deste utilizador?`)) {
                        try {
                            await fetchApi(`/api/admin/users/${userId}/badges/${badgeId}`, {
                                method: 'DELETE'
                            });
                            alert('Emblema removido com sucesso!');
                            clickedCard.classList.remove('is-featured');
                        } catch (error) {
                            alert(`Erro ao remover emblema: ${error.message}`);
                        }
                    }
                } else {
                    // Se o utilizador não tem o emblema, a ação é ATRIBUIR
                    try {
                        await fetchApi(`/api/admin/users/${userId}/badges`, {
                            method: 'POST',
                            body: JSON.stringify({ badgeId: badgeId })
                        });
                        alert('Emblema atribuído com sucesso!');
                        clickedCard.classList.add('is-featured');
                    } catch (error) {
                        alert(`Erro ao atribuir emblema: ${error.message}`);
                    }
                }
            });
        });

    } catch (error) {
        viewElement.innerHTML = `<p style="color: red;">Erro ao carregar a página de gestão de conquistas: ${error.message}</p>`;
    }
}