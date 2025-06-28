// js/views/admin/manage-achievements.js
import { appState } from '../../state.js';
import { showModal } from '../../../components/modal.js';

/**
 * Renderiza a grid de conquistas com a capacidade de gerenciamento.
 */
function renderManagementGrid(items, gridElement, user, viewElement) {
    if (!gridElement) return;
    gridElement.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        // A classe 'locked' é baseada no estado global do item.
        card.className = `achievement-card ${!item.unlocked ? 'locked' : ''}`;
        
        card.addEventListener('click', () => {
            openManagementModal(item, user, () => {
                // Callback para re-renderizar a grid após a alteração no modal
                renderManagementGrid(items, gridElement, user, viewElement);
            });
        });
        
        card.innerHTML = `<div class="achievement-icon">${item.icon}</div><div class="achievement-info"><h4>${item.name}</h4><p>${item.description}</p></div>`;
        gridElement.appendChild(card);
    });
}

/**
 * Abre um modal customizado para gerenciamento de conquistas.
 */
function openManagementModal(item, user, rerenderCallback) {
    const modalTitle = `${item.icon} Gerenciar: ${item.name}`;
    let modalContent = `
        <p class="modal-description">Gerenciando esta conquista para <strong>${user.name} ${user.surname}</strong>.</p>
        
        <div class="modal-status ${item.unlocked ? 'unlocked' : 'locked'}">
            <strong>Status Atual:</strong> ${item.unlocked ? 'Desbloqueado' : 'Bloqueado'}
        </div>

        <div class="form-group" style="margin-top: 1rem;">
            <button id="toggleStatusBtn" class="action-btn" style="width: 100%; margin-bottom: 1rem;">
                ${item.unlocked ? 'Bloquear Conquista' : 'Desbloquear Conquista'}
            </button>
        </div>
    `;

    if (item.progress !== undefined) {
        modalContent += `
            <div class="form-group">
                <label for="progressInput">Progresso (%)</label>
                <input type="number" id="progressInput" class="form-control" value="${item.progress}" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
             <div class="form-group" style="margin-top: 1rem;">
                <button id="updateProgressBtn" class="action-btn" style="width: 100%;">Atualizar Progresso</button>
            </div>
        `;
    }

    showModal(modalTitle, modalContent);

    // Adiciona lógica aos botões do modal
    const toggleStatusBtn = document.getElementById('toggleStatusBtn');
    if (toggleStatusBtn) {
        toggleStatusBtn.addEventListener('click', () => {
            item.unlocked = !item.unlocked;
            alert(`O status de '${item.name}' foi alterado.`);
            rerenderCallback(); // Re-renderiza a grid
            document.getElementById('closeModalBtn').click(); // Fecha o modal
        });
    }

    const updateProgressBtn = document.getElementById('updateProgressBtn');
    if (updateProgressBtn) {
        updateProgressBtn.addEventListener('click', () => {
            const progressInput = document.getElementById('progressInput');
            const newProgress = parseInt(progressInput.value, 10);
            if (!isNaN(newProgress) && newProgress >= 0 && newProgress <= 100) {
                item.progress = newProgress;
                alert(`Progresso de '${item.name}' atualizado para ${newProgress}%.`);
                rerenderCallback();
                document.getElementById('closeModalBtn').click();
            } else {
                alert('Por favor, insira um valor de progresso válido (0-100).');
            }
        });
    }
}


/**
 * Renderiza a view principal de gerenciamento de conquistas para um usuário.
 */
export function renderManageAchievementsView(viewElement, userId) {
    const user = appState.users[userId];
    if (!user) {
        viewElement.innerHTML = `<h2>Usuário não encontrado.</h2>`;
        return;
    }

    viewElement.innerHTML = `
        <div class="profile-container">
            <div class="admin-widget">
                <h2><i class="fa-solid fa-user-pen"></i> Gerenciando Conquistas de: ${user.name} ${user.surname}</h2>
                <p>Clique em uma conquista ou selo para gerenciar o status ou o progresso.</p>
            </div>
            
            <div class="profile-achievements-block">
                 <section class="achievements-section">
                    <h3 class="section-title">🏅 Emblemas</h3>
                    <div class="achievements-grid" id="emblemGrid"></div>
                </section>
                
                <section class="achievements-section" style="margin-top: 2rem;">
                    <h3 class="section-title">🎖️ Selos</h3>
                    <div class="achievements-grid" id="sealGrid"></div>
                </section>
            </div>
        </div>
    `;

    renderManagementGrid(appState.badges, viewElement.querySelector('#emblemGrid'), user, viewElement);
    renderManagementGrid(appState.seals, viewElement.querySelector('#sealGrid'), user, viewElement);
}