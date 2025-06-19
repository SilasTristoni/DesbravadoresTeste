const modal = document.getElementById('activityModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModalBtn');

function hideModal() {
    modal.classList.remove('active');
}

export function showModal(title, description) {
    modalTitle.innerHTML = title;
    modalBody.innerHTML = `<p>${description}</p>`;
    modal.classList.add('active');
}

export function showAchievementModal(item) {
    modalTitle.innerHTML = `${item.icon} ${item.name}`;

    let bodyHTML = `<p class="modal-description">${item.description}</p>`;

    if (item.unlocked) {
        bodyHTML += `
            <div class="modal-status unlocked">
                <strong>Status:</strong> Desbloqueado
            </div>
            <div class="modal-details">
                <strong>Concluído em:</strong> ${item.completed_on}
            </div>
        `;
    } else {
        bodyHTML += `
            <div class="modal-status locked">
                <strong>Status:</strong> Bloqueado
            </div>
            <div class="modal-details">
                <strong>Como desbloquear:</strong> ${item.unlock_criteria}
            </div>
        `;
        if (item.progress !== undefined) {
            bodyHTML += `
                <div class="progress-section">
                    <div class="progress-label">
                        <span>Progresso:</span>
                        <span>${item.progress}%</span>
                    </div>
                    <div class="progress-bar-small">
                        <div class="progress-fill-small" style="width: ${item.progress}%"></div>
                    </div>
                </div>
            `;
        }
    }

    modalBody.innerHTML = bodyHTML;
    modal.classList.add('active');
}


export function setupModal() {
    closeModalBtn.addEventListener('click', hideModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            hideModal();
        }
    });
}