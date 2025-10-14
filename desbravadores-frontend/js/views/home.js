import { appState } from '../state.js';

function renderReminders(viewElement) {
    const remindersContainer = viewElement.querySelector('#reminders-container');
    if (!remindersContainer) return;

    const { currentMonth, currentYear, months, activities } = appState.agenda;
    const activitiesForMonth = (activities[currentYear] && activities[currentYear][currentMonth]) ? activities[currentYear][currentMonth] : {};
    let remindersHTML = '';
    
    const monthEvents = [];
    for (const day in activitiesForMonth) {
        activitiesForMonth[day].forEach(activity => {
            monthEvents.push({ day: parseInt(day), ...activity });
        });
    }

    if (monthEvents.length > 0) {
        monthEvents.sort((a, b) => a.day - b.day);
        
        monthEvents.forEach(event => {
            remindersHTML += `
                <div class="reminder-card">
                    <div class="reminder-date">${event.day} de ${months[currentMonth]}</div>
                    <div class="reminder-title">${event.title}</div>
                </div>
            `;
        });
    } else {
        remindersHTML = '<p>Nenhum evento principal agendado para este mês.</p>';
    }

    remindersContainer.innerHTML = remindersHTML;
}

function renderScoutOfTheMonth(viewElement) {
    const container = viewElement.querySelector('#scout-of-the-month-container');
    if (!container || !appState.scoutOfTheMonth) return;

    const { userId, reason } = appState.scoutOfTheMonth;
    const user = appState.users[userId];

    if (user) {
        container.innerHTML = `
            <div class="scout-of-the-month-widget">
                <h3 class="stats-title"><span class="sotm-star">⭐</span> Desbravador do Mês</h3>
                <img src="${user.avatar}" alt="Avatar de ${user.name}" class="sotm-avatar">
                <div class="sotm-name">${user.name} ${user.surname}</div>
                <div class="sotm-level">Nível ${user.level}</div>
                <p class="sotm-reason">"${reason}"</p>
            </div>
        `;

        container.querySelector('.scout-of-the-month-widget').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', {
                detail: { view: 'perfil', data: userId }
            }));
        });
    }
}

export function renderHomeView(viewElement) {
    viewElement.innerHTML = `
        <div class="hero-section">
            <div class="hero-content">
                <h1 class="hero-title">Explore a Natureza</h1>
                <p class="hero-subtitle">Descubra experiências incríveis, organize suas atividades e conquiste emblemas.</p>
            </div>
        </div>
        <div class="home-grid">
            <div class="main-content">
                <div class="reminders-section">
                    <h2 class="section-title">Lembretes do Mês</h2>
                    <div class="reminders-grid" id="reminders-container"></div>
                </div>
                <div class="categories-section">
                    <h2 class="section-title">Categorias de Aventura</h2>
                    <div class="category-card" style="--category-color: #ff6b35;">
                        <span class="category-icon">⚜️</span>
                        <div>
                            <h3 class="category-title">Aventuras Radicais</h3>
                            <p class="category-description">Atividades de adrenalina para os mais corajosos.</p>
                        </div>
                    </div>
                    <div class="category-card" style="--category-color: #6b8e23;">
                        <span class="category-icon">🌲</span>
                        <div>
                            <h3 class="category-title">Trilhas e Natureza</h3>
                            <p class="category-description">Explore a flora e fauna em trilhas ecológicas.</p>
                        </div>
                    </div>
                    <div class="category-card" style="--category-color: #8b4513;">
                        <span class="category-icon">🏕️</span>
                        <div>
                            <h3 class="category-title">Camping Noturno</h3>
                            <p class="category-description">Acampe sob as estrelas em locais seguros.</p>
                        </div>
                    </div>
                </div>
            </div>
            <aside class="sidebar">
                 <div class="quick-stats">
                    <h3 class="stats-title">Estatísticas do Acampamento</h3>
                    <div class="stat-item"><span>Aventureiros Ativos</span> <strong>12.5K</strong></div>
                    <div class="stat-item"><span>Experiências Concluídas</span> <strong>8.2K</strong></div>
                    <div class="stat-item"><span>Avaliação Média</span> <strong>4.8 ⭐</strong></div>
                </div>
                <div id="scout-of-the-month-container"></div>
            </aside>
        </div>
    `;

    renderReminders(viewElement);
    renderScoutOfTheMonth(viewElement);

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('.category-title').textContent;
            alert(`Carregando categoria: ${title}`);
        });
    });
}