// js/views/admin/chamada.js

export async function renderChamadaView(viewElement) {
    const today = new Date().toISOString().split('T')[0];

    viewElement.innerHTML = `
        <div class="chamada-container">
            <div class="admin-widget">
                <h2>Chamada do Grupo</h2>

                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="chamada-date">Selecione a data:</label>
                    <input type="date" id="chamada-date" class="form-control" value="${today}">
                </div>

                <p id="chamada-loading-message">A carregar membros do grupo...</p>
                <div class="student-list" id="studentList"></div>
                
                <div class="form-actions chamada-actions">
                    <button id="submit-chamada-btn" class="action-btn btn-success" style="display: none;">Submeter Chamada</button>
                    <button id="export-csv-btn" class="action-btn btn-primary" style="display: none;">Exportar CSV</button>
                </div>
            </div>
        </div>
    `;

    const studentListContainer = viewElement.querySelector('#studentList');
    const loadingMessage = viewElement.querySelector('#chamada-loading-message');
    const submitBtn = viewElement.querySelector('#submit-chamada-btn');
    const exportBtn = viewElement.querySelector('#export-csv-btn');
    const dateInput = viewElement.querySelector('#chamada-date');

    // --- NOVA FUNÇÃO DE VALIDAÇÃO ---
    async function checkStatus() {
        const date = dateInput.value;
        if(!date) return;

        try {
            const response = await fetchApi(`/api/chamada/check-existence?date=${date}`);
            
            if (response.exists) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Chamada já realizada";
                submitBtn.style.opacity = "0.6";
                submitBtn.style.cursor = "not-allowed";
                
                // Opcional: mostrar aviso apenas se o usuário tentar interagir ou mudar a data
                // showToast("Já existe uma chamada para esta data.", "info"); 
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submeter Chamada";
                submitBtn.style.opacity = "1";
                submitBtn.style.cursor = "pointer";
            }
        } catch (e) {
            console.error("Erro ao verificar status da chamada", e);
        }
    }

    // Monitorar mudança de data para revalidar
    dateInput.addEventListener('change', checkStatus);

    try {
        const members = await fetchApi('/api/chamada/my-group-members');

        if (members.length === 0) {
            loadingMessage.textContent = 'O seu grupo ainda não tem desbravadores associados.';
            return;
        }

        loadingMessage.style.display = 'none';
        submitBtn.style.display = 'block';
        exportBtn.style.display = 'block';

        studentListContainer.innerHTML = members.map(student => `
            <div class="student-card" data-student-id="${student.id}">
                <img src="${student.avatar || 'img/escoteiro1.png'}" alt="${student.name}" class="student-photo">
                <div class="student-info">
                    <div class="student-name">${student.name} ${student.surname}</div>
                </div>
                <span class="check-icon">✔️</span>
            </div>
        `).join('');

        const presentUserIds = new Set();

        // Lógica de Seleção de Presença
        studentListContainer.querySelectorAll('.student-card').forEach(card => {
            card.addEventListener('click', function() {
                // Se o botão estiver desativado (chamada já feita), não permite alterar seleção visualmente?
                // Opcional: if(submitBtn.disabled) return; 

                this.classList.toggle('present');
                const studentId = this.dataset.studentId;

                if (this.classList.contains('present')) {
                    presentUserIds.add(parseInt(studentId, 10));
                } else {
                    presentUserIds.delete(parseInt(studentId, 10));
                }
            });
        });

        // Executa validação inicial ao carregar a página
        await checkStatus();

        // Lógica de Submeter Chamada
        submitBtn.addEventListener('click', async () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) {
                showToast('Por favor, selecione uma data para a chamada.', 'error');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'A submeter...';

                const payload = {
                    date: selectedDate,
                    presentUserIds: Array.from(presentUserIds)
                };

                const response = await fetchApi('/api/chamada/submit', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                showToast(response.message || 'Chamada submetida com sucesso!', 'success');
                
                // Limpa a seleção visual e o set de IDs
                studentListContainer.querySelectorAll('.student-card.present').forEach(card => {
                    card.classList.remove('present');
                });
                presentUserIds.clear();
                
                // Revalida o botão (agora vai aparecer como "Chamada já realizada")
                await checkStatus();

            } catch (error) {
                showToast(`Erro ao submeter chamada: ${error.message}`, 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submeter Chamada';
            }
        });

        // Lógica de Exportar CSV
        exportBtn.addEventListener('click', () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) {
                showToast('Selecione uma data para exportar.', 'error');
                return;
            }
            
            const token = localStorage.getItem('jwtToken');
            
            // Faz o download direto usando fetch com blob
            fetch(`http://localhost:8080/api/chamada/export-csv?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(async res => {
                if (!res.ok) throw new Error('Falha na exportação');
                return res.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `chamada_${selectedDate}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                showToast('Exportação concluída!', 'success');
            })
            .catch(e => {
                console.error(e);
                showToast('Erro ao exportar relatório. Verifique se a data possui registros.', 'error');
            });
        });

    } catch (error) {
        loadingMessage.style.color = 'red';
        loadingMessage.textContent = `Erro ao carregar dados: ${error.message}`;
    }
}