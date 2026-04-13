// js/views/admin/chamada.js

import { buildApiUrl, resolveAssetUrl } from '../../core/url.js';

// --- MODAL CUSTOMIZADO PADRONIZADO ---
function showConfirmModal(message) {
    return new Promise((resolve) => {
        const modalId = 'custom-confirm-modal';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = modalId;
        modalOverlay.className = 'modal active'; 
        modalOverlay.style.zIndex = '10000';

        modalOverlay.innerHTML = `
            <div class="modal-content" style="text-align: center; max-width: 400px; padding: 25px;">
                <div class="modal-header" style="justify-content: center; border-bottom: none; padding-bottom: 0;">
                    <h3 class="modal-title" style="font-size: 1.5rem;">Confirmação</h3>
                </div>
                <p class="modal-description" style="margin: 15px 0 25px; color: var(--text-primary); font-size: 1.1rem;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="modal-cancel-btn" class="btn-action cancel" style="background-color: var(--border-color); color: var(--text-primary);">Cancelar</button>
                    <button id="modal-confirm-btn" class="btn-action save">Confirmar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const close = (result) => {
            modalOverlay.classList.remove('active');
            setTimeout(() => modalOverlay.remove(), 300);
            resolve(result);
        };

        document.getElementById('modal-confirm-btn').addEventListener('click', () => close(true));
        document.getElementById('modal-cancel-btn').addEventListener('click', () => close(false));
    });
}

export async function renderChamadaView(viewElement) {
    const today = new Date().toISOString().split('T')[0];

    viewElement.innerHTML = `
        <div class="chamada-container">
            <div class="admin-widget">
                <h2>Chamada do Grupo</h2>

                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="chamada-date">Selecione a data:</label>
                    <input type="date" id="chamada-date" class="form-control" value="${today}" max="${today}" style="padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 1rem;">
                </div>

                <p id="chamada-loading-message">A carregar membros do grupo...</p>
                <div class="student-list" id="studentList"></div>
                
                <div class="chamada-actions">
                    <button id="submit-chamada-btn" class="action-btn btn-success btn-action" style="display: none;">
                        <i class="fa-solid fa-check"></i> Submeter Chamada
                    </button>
                    
                    <button id="request-correction-btn" class="action-btn btn-action" style="display: none; background-color: var(--scout-orange);">
                        <i class="fa-solid fa-triangle-exclamation"></i> Solicitar Correção
                    </button>
                    
                    <button id="pending-correction-btn" class="action-btn btn-action" style="display: none; background-color: var(--text-secondary); cursor: not-allowed;" disabled>
                        <i class="fa-solid fa-hourglass-half"></i> Correção em Análise
                    </button>
                    
                    <button id="export-csv-btn" class="action-btn btn-primary btn-action" style="display: none;">
                        <i class="fa-solid fa-file-csv"></i> Exportar CSV
                    </button>
                </div>
            </div>
        </div>
    `;

    const studentListContainer = viewElement.querySelector('#studentList');
    const loadingMessage = viewElement.querySelector('#chamada-loading-message');
    const submitBtn = viewElement.querySelector('#submit-chamada-btn');
    const correctionBtn = viewElement.querySelector('#request-correction-btn');
    const pendingBtn = viewElement.querySelector('#pending-correction-btn');
    const exportBtn = viewElement.querySelector('#export-csv-btn');
    const dateInput = viewElement.querySelector('#chamada-date');
    
    const presentUserIds = new Set();
    const justificationsMap = {}; 

    async function checkStatus() {
        const date = dateInput.value;
        if(!date) return;

        try {
            const response = await fetchApi(`/api/chamada/check-existence?date=${date}`);
            
            submitBtn.style.display = 'none';
            correctionBtn.style.display = 'none';
            pendingBtn.style.display = 'none';
            
            // O botão de exportar fica SEMPRE visível, mas bloqueado por padrão
            exportBtn.style.display = 'inline-flex';
            exportBtn.disabled = true;
            exportBtn.style.opacity = '0.6';
            exportBtn.style.cursor = 'not-allowed';

            if (response.exists) {
                // Chamada existe: liberta o botão de exportar
                exportBtn.disabled = false;
                exportBtn.style.opacity = '1';
                exportBtn.style.cursor = 'pointer';
                
                if (response.pending) {
                    pendingBtn.style.display = 'inline-flex';
                } else {
                    correctionBtn.style.display = 'inline-flex';
                }
            } else {
                // Chamada não existe: mostra botão de submeter
                submitBtn.style.display = 'inline-flex';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Submeter Chamada';
            }
        } catch (e) {
            console.error(e);
        }
    }
    
    dateInput.addEventListener('change', checkStatus);

    try {
        const members = await fetchApi('/api/chamada/my-group-members');

        if (members.length === 0) {
            loadingMessage.textContent = 'O seu grupo ainda não tem desbravadores associados.';
            return;
        }
        loadingMessage.style.display = 'none';

        studentListContainer.innerHTML = members.map(student => `
            <div class="student-wrapper" style="margin-bottom: 12px;">
                <div class="student-card present" data-student-id="${student.id}" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border-radius: 8px; background-color: var(--bg-primary); transition: all 0.2s;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${student.avatar ? resolveAssetUrl(student.avatar) : 'assets/images/escoteiro1.png'}" alt="${student.name}" class="student-photo">
                        <div class="student-name" style="font-weight: 600; color: var(--text-primary); font-size: 1.1rem;">${student.name} ${student.surname}</div>
                    </div>
                    <span class="check-icon" style="font-size: 1.5rem; color: var(--toast-success-bg); transition: color 0.2s;">
                        <i class="fa-solid fa-circle-check"></i>
                    </span>
                </div>
                <div id="justification-container-${student.id}" style="display: none; margin-top: 8px;">
                    <input type="text" id="justification-${student.id}" class="form-control" placeholder="Motivo da falta..." style="width: 100%; padding: 12px 15px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; background-color: var(--bg-secondary);">
                </div>
            </div>
        `).join('');

        members.forEach(m => presentUserIds.add(m.id));

        studentListContainer.querySelectorAll('.student-card').forEach(card => {
            card.addEventListener('click', function() {
                if(pendingBtn.style.display === 'inline-flex') {
                    showToast("Aguarde a aprovação da correção pendente.", "warning");
                    return;
                }

                const studentId = parseInt(this.dataset.studentId, 10);
                const justContainer = document.getElementById(`justification-container-${studentId}`);
                const justInput = document.getElementById(`justification-${studentId}`);
                
                this.classList.toggle('present');
                
                if (this.classList.contains('present')) {
                    presentUserIds.add(studentId);
                    this.querySelector('.check-icon').innerHTML = '<i class="fa-solid fa-circle-check"></i>';
                    this.querySelector('.check-icon').style.color = 'var(--toast-success-bg)';
                    this.style.backgroundColor = 'var(--bg-primary)';
                    justContainer.style.display = 'none';
                    justInput.value = '';
                    delete justificationsMap[studentId];
                } else {
                    presentUserIds.delete(studentId);
                    this.querySelector('.check-icon').innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
                    this.querySelector('.check-icon').style.color = 'var(--toast-error-bg)';
                    this.style.backgroundColor = '#fbe9e7'; 
                    justContainer.style.display = 'block';
                    justInput.focus();
                }
            });
        });

        members.forEach(m => {
            const input = document.getElementById(`justification-${m.id}`);
            input.addEventListener('input', (e) => justificationsMap[m.id] = e.target.value);
        });

        await checkStatus();

        function getPayload() {
            return {
                date: dateInput.value,
                presentUserIds: Array.from(presentUserIds),
                justifications: justificationsMap
            };
        }

        submitBtn.addEventListener('click', async () => {
            if (!dateInput.value) return showToast('Selecione uma data.', 'error');
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A enviar...';
                const response = await fetchApi('/api/chamada/submit', { method: 'POST', body: JSON.stringify(getPayload()) });
                showToast(response.message, 'success');
                await checkStatus();
            } catch (error) {
                showToast(error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Submeter Chamada';
            }
        });

        correctionBtn.addEventListener('click', async () => {
            const confirmed = await showConfirmModal("Isso enviará uma solicitação para o Diretor aprovar. Deseja continuar?");
            if (!confirmed) return;
            
            try {
                correctionBtn.disabled = true;
                correctionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A solicitar...';
                
                const response = await fetchApi('/api/chamada/request-correction', { 
                    method: 'POST', 
                    body: JSON.stringify(getPayload()) 
                });
                
                showToast(response.message, 'success');
                await checkStatus(); 
                
                correctionBtn.disabled = false; 
                correctionBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Solicitar Correção';

            } catch (error) {
                showToast(error.message, 'error');
                correctionBtn.disabled = false;
                correctionBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Solicitar Correção';
            }
        });
        
        exportBtn.addEventListener('click', () => {
             const date = dateInput.value;
             if (!date) return showToast('Selecione uma data.', 'error');
             const token = localStorage.getItem('jwtToken');
             fetch(buildApiUrl(`/api/chamada/export-csv?date=${date}`), {
                 headers: { 'Authorization': `Bearer ${token}` }
             })
             .then(res => { if(!res.ok) throw new Error(); return res.blob(); })
             .then(blob => {
                 const url = window.URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = `chamada_${date}.csv`;
                 document.body.appendChild(a);
                 a.click();
                 a.remove();
                 showToast('CSV exportado!', 'success');
             })
             .catch(() => showToast('Falha ao exportar CSV.', 'error'));
        });

    } catch (error) {
        loadingMessage.textContent = error.message;
    }
}
