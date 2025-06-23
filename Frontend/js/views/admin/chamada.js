// js/views/admin/chamada.js
import { appState } from '../../state.js';

export function renderChamadaView(viewElement) {
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
}