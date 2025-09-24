// Remova: import { appState } from '../../state.js';
// A função agora receberá o estado como parâmetro do admin-main.js

export function renderChamadaView(viewElement, data, appState) {
    // Filtra para pegar apenas os desbravadores, excluindo o chefe de seção
    const studentList = Object.values(appState.users).filter(user => user.rank !== 'Chefe de Seção');

    // Monta o HTML da view
    viewElement.innerHTML = `
        <div class="chamada-container">
            <div class="admin-widget">
                <h2>Chamada da Patrulha</h2>
                <div class="chamada-search-bar">
                    <span class="chamada-search-icon">🔍</span>
                    <input type="text" class="chamada-search-input" placeholder="Pesquisar desbravador..." id="searchInput">
                </div>
                <div class="student-list" id="studentList">
                    ${studentList.map(student => `
                        <div class="student-card" data-student-id="${student.id}">
                            <img src="${student.avatar}" alt="${student.name}" class="student-photo">
                            <div class="student-info">
                                <div class="student-role">${student.rank}</div>
                                <div class="student-name">${student.name} ${student.surname}</div>
                            </div>
                            <span class="check-icon">✔️</span>
                        </div>
                    `).join('')}
                </div>
                <button id="saveAttendanceBtn" class="action-btn" style="margin-top: 1.5rem;">Salvar Chamada</button>
            </div>
        </div>
    `;

    // Adiciona as funcionalidades de clique e pesquisa
    const studentCards = viewElement.querySelectorAll('.student-card');
    const searchInput = viewElement.querySelector('#searchInput');

    studentCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('present');
        });
    });

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        studentCards.forEach(card => {
            const studentName = card.querySelector('.student-name').textContent.toLowerCase();
            if (studentName.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // --- NOVO: LÓGICA PARA SALVAR A CHAMADA ---
    const saveBtn = viewElement.querySelector('#saveAttendanceBtn');
    saveBtn.addEventListener('click', async () => {
        const presentCards = viewElement.querySelectorAll('.student-card.present');
        const presentUserIds = Array.from(presentCards).map(card => card.dataset.studentId);

        if (presentUserIds.length === 0) {
            alert("Nenhum desbravador marcado como presente.");
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/admin/chamada', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ presentUserIds }),
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao salvar presença:', error);
            alert(`Não foi possível salvar a presença: ${error.message}`);
        }
    });
}