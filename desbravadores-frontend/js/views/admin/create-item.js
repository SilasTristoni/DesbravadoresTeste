// js/views/admin/create-item.js

async function fetchAndRenderAchievements(container) {
    try {
        const achievements = await fetchApi('/api/gamification/achievements');
        if (achievements && achievements.length > 0) {
            container.innerHTML = achievements.map(ach => `
                <div class="list-item-preview">
                    <img src="http://localhost:8080${ach.icon}" alt="${ach.name}" class="preview-icon">
                    <span><strong>${ach.name}</strong></span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Nenhuma conquista criada ainda.</p>';
        }
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar conquistas.</p>`;
    }
}

async function fetchAndRenderBackgrounds(container) {
    try {
        const backgrounds = await fetchApi('/api/backgrounds');
        if (backgrounds && backgrounds.length > 0) {
            container.innerHTML = backgrounds.map(bg => {
                const style = bg.imageUrl 
                    ? `background: url(http://localhost:8080${bg.imageUrl}) center/cover no-repeat; color: ${bg.textColor};`
                    : `background: ${bg.gradient}; color: ${bg.textColor};`;
                
                return `
                    <div class="list-item-preview" style="${style}">
                        <span style="background-color: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px;"><strong>${bg.name}</strong></span>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>Nenhum fundo criado ainda.</p>';
        }
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar fundos.</p>`;
    }
}

export function renderCreateItemView(viewElement) {
    viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Criar Novo Item de Gamificação</h2>
            
            <div class="form-group">
                <label for="item-type-selector">Selecione o tipo de item a criar:</label>
                <select id="item-type-selector" class="form-control">
                    <option value="achievement">🏆 Conquista</option>
                    <option value="background">Fundo de Perfil</option>
                </select>
            </div>

            <form id="create-achievement-form" class="user-form" style="display: block;">
                <h4>Nova Conquista</h4>
                <div class="form-group">
                    <label for="ach-name">Nome da Conquista</label>
                    <input type="text" id="ach-name" class="form-control" placeholder="Ex: Mestre do Acampamento" required>
                </div>
                <div class="form-group">
                    <label for="ach-description">Descrição (Requisitos para Desbloqueio)</label>
                    <textarea id="ach-description" class="form-control" placeholder="Ex: O monitor deve conceder esta conquista ao aluno que demonstrar habilidade exemplar em montar uma barraca." required></textarea>
                </div>
                <div class="form-row">
                     <div class="form-group">
                        <label for="ach-xp-reward">Recompensa de XP</label>
                        <input type="number" id="ach-xp-reward" class="form-control" min="0" value="50" required>
                    </div>
                    <div class="form-group">
                        <label for="ach-reward-type">Tipo de Prêmio</label>
                        <select id="ach-reward-type" class="form-control" required>
                            <option value="BADGE">Emblema</option>
                            <option value="SEAL">Selo</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="ach-icon-file">Ícone da Conquista</label>
                    <input type="file" id="ach-icon-file" class="form-control" accept="image/*" required>
                </div>
                <button type="submit" class="action-btn">Criar Conquista</button>
            </form>

            <form id="create-background-form" class="user-form" style="display: none;">
                <h4>Novo Fundo de Perfil</h4>
                 <div class="form-group">
                    <label for="bg-name">Nome do Fundo</label>
                    <input type="text" id="bg-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="bg-image-file">Ficheiro da Imagem de Fundo</label>
                    <input type="file" id="bg-image-file" class="form-control" accept="image/*" required>
                </div>
                <button type="submit" class="action-btn">Criar Fundo</button>
            </form>
        </div>

        <div class="admin-widget">
            <h2>Itens Existentes</h2>
            <div id="achievements-list-container" style="margin-bottom: 2rem;">
                <h3>🏆 Conquistas</h3>
                <div id="achievements-list"></div>
            </div>
            <div id="backgrounds-list-container">
                <h3>Fundos de Perfil</h3>
                <div id="backgrounds-list"></div>
            </div>
        </div>
        <style>
            .list-item-preview { display: flex; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0; gap: 15px; }
            .preview-icon { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
        </style>
    `;

    const itemSelector = viewElement.querySelector('#item-type-selector');
    const achievementForm = viewElement.querySelector('#create-achievement-form');
    const backgroundForm = viewElement.querySelector('#create-background-form');

    itemSelector.addEventListener('change', () => {
        achievementForm.style.display = itemSelector.value === 'achievement' ? 'block' : 'none';
        backgroundForm.style.display = itemSelector.value === 'background' ? 'block' : 'none';
    });

    achievementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        const iconFile = document.getElementById('ach-icon-file').files[0];
        if (!iconFile) { showToast('Por favor, selecione um ícone.', 'error'); return; }

        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';

        const formData = new FormData();
        formData.append('name', document.getElementById('ach-name').value);
        formData.append('description', document.getElementById('ach-description').value);
        formData.append('xpReward', document.getElementById('ach-xp-reward').value);
        formData.append('rewardType', document.getElementById('ach-reward-type').value);
        formData.append('iconFile', iconFile);

        try {
            await fetchApi('/api/admin/achievements', { method: 'POST', body: formData });
            showToast('Conquista criada com sucesso!', 'success');
            achievementForm.reset();
            fetchAndRenderAchievements(viewElement.querySelector("#achievements-list"));
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Conquista';
        }
    });
    
    backgroundForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        const imageFile = document.getElementById('bg-image-file').files[0];
        if (!imageFile) { showToast('Por favor, selecione uma imagem.', 'error'); return; }

        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';

        const formData = new FormData();
        formData.append('name', document.getElementById('bg-name').value);
        formData.append('imageFile', imageFile);
        formData.append('textColor', '#FFFFFF');

        try {
            await fetchApi('/api/admin/backgrounds', { method: 'POST', body: formData });
            showToast('Fundo criado com sucesso!', 'success');
            backgroundForm.reset();
            fetchAndRenderBackgrounds(viewElement.querySelector("#backgrounds-list"));
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Fundo';
        }
    });
    
    fetchAndRenderAchievements(viewElement.querySelector("#achievements-list"));
    fetchAndRenderBackgrounds(viewElement.querySelector("#backgrounds-list"));
}