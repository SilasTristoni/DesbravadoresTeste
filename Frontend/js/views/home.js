export function renderHomeView(viewElement) {
    viewElement.innerHTML = `
        <div class="hero-section">
            <div class="hero-content">
                <h1 class="hero-title">Explore a Natureza</h1>
                <p class="hero-subtitle">Descubra experiências incríveis, organize suas atividades e conquiste emblemas.</p>
            </div>
        </div>
        <div class="home-grid">
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
            <div class="sidebar">
                 <div class="quick-stats">
                    <h3 class="stats-title">Estatísticas do Acampamento</h3>
                    <div class="stat-item"><span>Aventureiros Ativos</span> <strong>12.5K</strong></div>
                    <div class="stat-item"><span>Experiências Concluídas</span> <strong>8.2K</strong></div>
                    <div class="stat-item"><span>Avaliação Média</span> <strong>4.8 ⭐</strong></div>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('.category-title').textContent;
            alert(`Carregando categoria: ${title}`);
        });
    });
}