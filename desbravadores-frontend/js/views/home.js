// js/views/home.js

function renderReminders(viewElement) {
    // Busca e renderiza os lembretes do mês atual
    // Reutiliza a lógica de busca da agenda para a Home
    const remindersContainer = viewElement.querySelector('#reminders-container');
    if (!remindersContainer) return;
    
    // Pega o mês e ano atuais (API espera 1-12 para o mês)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Mês 1-12

    // Função interna para obter o nome do mês para exibição
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthDisplay = monthNames[currentMonth - 1]; 
    
    remindersContainer.innerHTML = '<p>A carregar lembretes...</p>';

    fetchApi(`/api/tasks?year=${currentYear}&month=${currentMonth}`)
        .then(tasks => {
            if (!tasks || tasks.length === 0) {
                remindersContainer.innerHTML = `<p>Nenhum evento principal agendado para ${monthDisplay}.</p>`;
                return;
            }
            
            // Ordena os eventos por dia
            tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            let remindersHTML = tasks.map(task => {
                // task.date é 'YYYY-MM-DD'
                const day = new Date(task.date).getDate();
                
                return `
                    <div class="reminder-card">
                        <div class="reminder-date">${day} de ${monthDisplay}</div>
                        <div class="reminder-title">${task.title}</div>
                    </div>
                `;
            }).join('');
            
            remindersContainer.innerHTML = remindersHTML;
        })
        .catch(error => {
            console.error("Erro ao carregar lembretes:", error);
            remindersContainer.innerHTML = '<p style="color: red;">Falha ao carregar lembretes.</p>';
        });
}

function renderScoutOfTheMonth(viewElement) {
    // Remove a renderização de dados mocados, pois não há endpoint de API
    const container = viewElement.querySelector('#scout-of-the-month-container');
    if (container) {
         container.innerHTML = `
            <div class="scout-of-the-month-widget" style="cursor: default;">
                <h3 class="stats-title"><span class="sotm-star">⭐</span> Desbravador do Mês</h3>
                <p>Em Breve: Ranking de Aventureiros</p>
            </div>
        `;
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