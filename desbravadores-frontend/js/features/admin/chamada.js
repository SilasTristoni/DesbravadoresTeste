// js/views/admin/chamada.js

// --- MODAL CUSTOMIZADO (Para substituir confirm nativo) ---
function showConfirmModal(message) {
    return new Promise((resolve) => {
        const modalId = 'custom-confirm-modal';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = modalId;
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 10000; backdrop-filter: blur(2px);
        `;

        modalOverlay.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; animation: fadeIn 0.3s ease;">
                <h3 style="margin-top: 0; color: #333; font-size: 1.2rem;">Confirmação</h3>
                <p style="color: #666; margin: 15px 0 25px;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="modal-cancel-btn" style="padding: 10px 20px; border: none; background: #e0e0e0; color: #333; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancelar</button>
                    <button id="modal-confirm-btn" style="padding: 10px 20px; border: none; background: #2ecc71; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Confirmar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const close = (result) => {
            modalOverlay.style.opacity = '0';
            setTimeout(() => modalOverlay.remove(), 200);
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
                    <input type="date" id="chamada-date" class="form-control" value="${today}" max="${today}">
                </div>

                <p id="chamada-loading-message">A carregar membros do grupo...</p>
                <div class="student-list" id="studentList"></div>
                
                <div class="form-actions chamada-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="submit-chamada-btn" class="action-btn" style="display: none; background-color: #28a745; color: white;">Submeter Chamada</button>
                    
                    <button id="request-correction-btn" class="action-btn" style="display: none; background-color: #e67e22; color: white;">Solicitar Correção</button>
                    
                    <button id="pending-correction-btn" class="action-btn" style="display: none; background-color: #95a5a6; color: white; cursor: not-allowed;" disabled>⏳ Correção em Análise</button>
                    
                    <button id="export-csv-btn" class="action-btn" style="display: none; background-color: #3498db; color: white;">Exportar CSV</button>
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

    // --- FUNÇÃO DE STATUS ATUALIZADA ---
    async function checkStatus() {
        const date = dateInput.value;
        if(!date) return;

        try {
            const response = await fetchApi(`/api/chamada/check-existence?date=${date}`);
            
            // Reseta todos os botões
            submitBtn.style.display = 'none';
            correctionBtn.style.display = 'none';
            pendingBtn.style.display = 'none';
            exportBtn.disabled = true;

            if (response.exists) {
                exportBtn.disabled = false;
                
                if (response.pending) {
                    // Caso 1: Já existe solicitação pendente -> Mostra botão cinza
                    pendingBtn.style.display = 'block';
                } else {
                    // Caso 2: Chamada existe, mas sem pendências -> Pode solicitar correção
                    correctionBtn.style.display = 'block';
                }
            } else {
                // Caso 3: Não existe chamada -> Pode submeter
                submitBtn.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = "Submeter Chamada";
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
        exportBtn.style.display = 'block';

        studentListContainer.innerHTML = members.map(student => `
            <div class="student-wrapper" style="margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                <div class="student-card present" data-student-id="${student.id}" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 10px; border-radius: 8px; background-color: #f8f9fa;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${student.avatar || 'img/escoteiro1.png'}" alt="${student.name}" class="student-photo" style="width: 40px; height: 40px; border-radius: 50%;">
                        <div class="student-name" style="font-weight: 500;">${student.name} ${student.surname}</div>
                    </div>
                    <span class="check-icon" style="font-size: 1.2rem;">✔️</span>
                </div>
                <div id="justification-container-${student.id}" style="display: none; margin-top: 5px; padding-left: 10px;">
                    <input type="text" id="justification-${student.id}" class="form-control" placeholder="Motivo da falta..." style="font-size: 0.9rem; padding: 6px;">
                </div>
            </div>
        `).join('');

        members.forEach(m => presentUserIds.add(m.id));

        studentListContainer.querySelectorAll('.student-card').forEach(card => {
            card.addEventListener('click', function() {
                // Bloqueia edição se estiver pendente
                if(pendingBtn.style.display === 'block') {
                    showToast("Aguarde a aprovação da correção pendente.", "warning");
                    return;
                }

                const studentId = parseInt(this.dataset.studentId, 10);
                const justContainer = document.getElementById(`justification-container-${studentId}`);
                const justInput = document.getElementById(`justification-${studentId}`);
                
                this.classList.toggle('present');
                
                if (this.classList.contains('present')) {
                    presentUserIds.add(studentId);
                    this.querySelector('.check-icon').textContent = '✔️';
                    this.style.backgroundColor = '#f8f9fa';
                    justContainer.style.display = 'none';
                    justInput.value = '';
                    delete justificationsMap[studentId];
                } else {
                    presentUserIds.delete(studentId);
                    this.querySelector('.check-icon').textContent = '❌';
                    this.style.backgroundColor = '#fff5f5';
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
                submitBtn.textContent = 'A enviar...';
                const response = await fetchApi('/api/chamada/submit', { method: 'POST', body: JSON.stringify(getPayload()) });
                showToast(response.message, 'success');
                await checkStatus();
            } catch (error) {
                showToast(error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submeter Chamada';
            }
        });

        // --- CORREÇÃO: Usando Modal Customizado ---
        correctionBtn.addEventListener('click', async () => {
            const confirmed = await showConfirmModal("Isso enviará uma solicitação para o Diretor aprovar. Deseja continuar?");
            if (!confirmed) return;
            
            try {
                correctionBtn.disabled = true;
                correctionBtn.textContent = 'A solicitar...';
                
                const response = await fetchApi('/api/chamada/request-correction', { 
                    method: 'POST', 
                    body: JSON.stringify(getPayload()) 
                });
                
                showToast(response.message, 'success');
                await checkStatus(); // Atualiza estado (deve virar pendente)
                
                correctionBtn.disabled = false; 
                correctionBtn.textContent = 'Solicitar Correção';

            } catch (error) {
                showToast(error.message, 'error');
                correctionBtn.disabled = false;
                correctionBtn.textContent = 'Solicitar Correção';
            }
        });
        
        exportBtn.addEventListener('click', () => {
             const date = dateInput.value;
             if (!date) return showToast('Selecione uma data.', 'error');
             const token = localStorage.getItem('jwtToken');
             fetch(`http://localhost:8080/api/chamada/export-csv?date=${date}`, {
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