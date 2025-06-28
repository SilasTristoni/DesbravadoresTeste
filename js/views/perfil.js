import { appState } from '../state.js';
import { showAchievementModal } from '../../components/modal.js';

const MAX_FEATURED = 3;

// --- FUNÇÕES AUXILIARES COMPLETAS ---

function applyBackgroundAndTextStyle(identityBlock, bg) {
    if (!bg) return;
    
    if (bg.image) {
        identityBlock.style.backgroundImage = `url(${bg.image})`;
        identityBlock.style.backgroundSize = 'cover';
        identityBlock.style.backgroundPosition = 'center';
    } else if (bg.gradient) {
        identityBlock.style.background = bg.gradient;
    }

    const nameElement = identityBlock.querySelector('.info-display h2');
    if (nameElement) {
        nameElement.style.color = bg.textColor || 'white';
    }
}

function createIconContent(item) {
    if (item.icon && item.icon.startsWith('data:image')) {
        return `<img class="emblem-icon" src="${item.icon}" alt="${item.name}">`;
    }
    return item.icon || '';
}

// Renderiza os emblemas em destaque com a função de clique
function renderFeaturedItems(viewElement, user) {
    const container = viewElement.querySelector('#featuredBadgesDisplay');
    if (!container) return;
    container.innerHTML = '';
    const allAchievements = [...appState.badges, ...appState.seals];
    
    user.displayedBadges.forEach(itemId => {
        const item = allAchievements.find(a => a.id === itemId);
        if (item) {
            const badgeItem = document.createElement('div');
            badgeItem.className = 'badge-item';
            
            // ADICIONADO O EVENT LISTENER DE VOLTA
            badgeItem.addEventListener('click', () => toggleFeatured(item, viewElement, user));
            
            const shapeClass = item.shape ? `shape-${item.shape}` : 'shape-circle';
            const iconContent = createIconContent(item);
            
            badgeItem.innerHTML = `<div class="achievement-icon-shape ${shapeClass}">${iconContent}</div><div class="badge-name">${item.name}</div>`;
            container.appendChild(badgeItem);
        }
    });
}

// Renderiza a lista de conquistas com a função de clique
function renderAchievementGrid(items, gridElement, viewElement, user) {
    if (!gridElement) return;
    gridElement.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        const isFeatured = user.displayedBadges.includes(item.id);
        card.className = `achievement-card ${!item.unlocked ? 'locked' : ''} ${isFeatured ? 'is-featured' : ''}`;
        
        // ADICIONADO O EVENT LISTENER DE VOLTA
        card.addEventListener('click', () => {
            if (item.unlocked) {
                toggleFeatured(item, viewElement, user);
            } else {
                showAchievementModal(item);
            }
        });

        const shapeClass = item.shape ? `shape-${item.shape}` : 'shape-circle';
        const iconContent = createIconContent(item);

        card.innerHTML = `<div class="achievement-icon-shape ${shapeClass}">${iconContent}</div><div class="achievement-info"><h4>${item.name}</h4><p>${item.description}</p></div>`;
        gridElement.appendChild(card);
    });
}

// Renderiza a lista de fundos com a função de clique
function renderBackgrounds(viewElement, user) {
    const grid = viewElement.querySelector('#backgroundGrid');
    if (!grid) return;
    const identityBlock = viewElement.querySelector('#identityBlock');
    
    let tempSelectedBgId = user.selectedBackground;

    grid.innerHTML = '';
    appState.backgrounds.forEach(bg => {
        const card = document.createElement('div');
        card.className = `background-card ${!bg.unlocked ? 'locked' : ''} ${tempSelectedBgId === bg.id ? 'selected' : ''}`;
        
        // LÓGICA DE CLIQUE CORRIGIDA
        card.addEventListener('click', () => {
            // A função de preview só funciona se o modo de edição estiver ativo
            if (document.body.classList.contains('profile-edit-mode')) {
                if (bg.unlocked) {
                    tempSelectedBgId = bg.id;
                    const tempSelectedBg = appState.backgrounds.find(b => b.id === tempSelectedBgId);
                    applyBackgroundAndTextStyle(identityBlock, tempSelectedBg);
                    renderBackgrounds(viewElement, user); // Re-renderiza para atualizar a seleção
                } else {
                    alert("Este fundo está bloqueado!");
                }
            } else if (!bg.unlocked) {
                // Se não estiver em modo de edição, só mostra detalhes de fundos bloqueados
                alert("Este fundo está bloqueado! Entre no modo de edição para alterá-lo.");
            }
        });
        
        const preview = document.createElement('div');
        preview.className = 'background-preview';
        applyBackgroundAndTextStyle(preview, bg);

        card.innerHTML = `<div class="background-info"><h4>${bg.name}</h4></div>`;
        card.prepend(preview);
        grid.appendChild(card);
    });

    return {
        saveBackgroundSelection: () => { user.selectedBackground = tempSelectedBgId; },
        revertBackgroundSelection: () => {
            const originalBg = appState.backgrounds.find(b => b.id === user.selectedBackground);
            applyBackgroundAndTextStyle(identityBlock, originalBg);
        }
    };
}

// Alterna um item entre destacado e não destacado
function toggleFeatured(item, viewElement, user) {
    // Só permite destacar se estiver no modo de edição do próprio perfil
    if (user.id !== appState.currentUserId || !document.body.classList.contains('profile-edit-mode')) {
        showAchievementModal(item);
        return;
    }

    const featuredIds = user.displayedBadges;
    const index = featuredIds.indexOf(item.id);

    if (index > -1) {
        featuredIds.splice(index, 1);
    } else {
        if (featuredIds.length < MAX_FEATURED) {
            featuredIds.push(item.id);
        } else {
            alert(`Você pode destacar no máximo ${MAX_FEATURED} itens.`);
        }
    }
    renderFeaturedItems(viewElement, user);
    renderAchievementGrid(appState.badges, viewElement.querySelector('#emblemGrid'), viewElement, user);
    renderAchievementGrid(appState.seals, viewElement.querySelector('#sealGrid'), viewElement, user);
}

// --- FUNÇÃO PRINCIPAL COMPLETA ---

export function renderProfileView(viewElement, userId) {
    const user = appState.users[userId || appState.currentUserId];

    if (!user) {
        viewElement.innerHTML = `<div class="container"><h2>Usuário não encontrado.</h2></div>`;
        return;
    }

    const selectedBg = appState.backgrounds.find(bg => bg.id === user.selectedBackground);

    viewElement.innerHTML = `
        <div class="profile-container">
            <div class="profile-identity-block" id="identityBlock">
                <div class="profile-identity-header">
                    <img src="${user.avatar}" alt="Avatar" class="avatar-img">
                    <div class="info-and-edit-wrapper">
                        <div class="info-display" id="profileInfoDisplay">
                            <h2>${user.name} ${user.surname}</h2>
                            <p>${user.rank} • Nível ${user.level}</p>
                        </div>
                        <form id="profileEditForm" style="display: none;">
                            <div class="form-group"><label for="inputName">Nome</label><input type="text" id="inputName" value="${user.name}"></div>
                            <div class="form-group"><label for="inputSurname">Sobrenome</label><input type="text" id="inputSurname" value="${user.surname}"></div>
                            <div class="form-actions">
                                <button type="button" class="btn-save-sidebar" id="saveBtn">Salvar</button>
                                <button type="button" class="btn-cancel-sidebar" id="cancelBtn">Cancelar</button>
                            </div>
                        </form>
                    </div>
                    <button class="edit-btn" id="editProfileBtn">✏️</button>
                </div>
            </div>
            <div class="profile-achievements-block">
                <section class="featured-badges">
                    <h3 class="section-title">Emblemas em Destaque</h3>
                    <div class="badges-display" id="featuredBadgesDisplay"></div>
                </section>
                <section class="achievements-section">
                    <div class="tabs">
                        <nav class="tab-nav">
                            <button class="tab-btn active" data-tab="emblemas">🏅 Emblemas</button>
                            <button class="tab-btn" data-tab="selos">🎖️ Selos</button>
                            <button class="tab-btn" data-tab="fundos">🖼️ Fundos</button>
                        </nav>
                    </div>
                    <div id="emblemas" class="tab-content active"><div class="achievements-grid" id="emblemGrid"></div></div>
                    <div id="selos" class="tab-content"><div class="achievements-grid" id="sealGrid"></div></div>
                    <div id="fundos" class="tab-content"><div class="achievements-grid" id="backgroundGrid"></div></div>
                </section>
            </div>
        </div>
    `;

    // --- LÓGICA E EVENTOS RESTAURADOS ---

    const identityBlock = viewElement.querySelector('#identityBlock');
    applyBackgroundAndTextStyle(identityBlock, selectedBg);

    const backgroundManager = renderBackgrounds(viewElement, user);

    viewElement.querySelector('#editProfileBtn').addEventListener('click', () => {
        if (user.id === appState.currentUserId) {
            document.body.classList.add('profile-edit-mode');
            viewElement.querySelector('#profileInfoDisplay').style.display = 'none';
            viewElement.querySelector('#profileEditForm').style.display = 'block';
            alert('Modo de edição ativado! Agora você pode selecionar emblemas para destacar e pré-visualizar fundos.');
        } else {
            alert("Você só pode editar o seu próprio perfil.");
        }
    });

    viewElement.querySelector('#cancelBtn').addEventListener('click', () => {
        document.body.classList.remove('profile-edit-mode');
        viewElement.querySelector('#profileInfoDisplay').style.display = 'block';
        viewElement.querySelector('#profileEditForm').style.display = 'none';
        backgroundManager.revertBackgroundSelection();
    });

    viewElement.querySelector('#saveBtn').addEventListener('click', () => {
        user.name = viewElement.querySelector('#inputName').value;
        user.surname = viewElement.querySelector('#inputSurname').value;
        viewElement.querySelector('#profileInfoDisplay h2').textContent = `${user.name} ${user.surname}`;
        
        backgroundManager.saveBackgroundSelection();

        document.body.classList.remove('profile-edit-mode');
        viewElement.querySelector('#profileInfoDisplay').style.display = 'block';
        viewElement.querySelector('#profileEditForm').style.display = 'none';
    });

    // Renderiza as seções dinâmicas
    renderFeaturedItems(viewElement, user);
    renderAchievementGrid(appState.badges, viewElement.querySelector('#emblemGrid'), viewElement, user);
    renderAchievementGrid(appState.seals, viewElement.querySelector('#sealGrid'), viewElement, user);
    
    // Lógica das abas
    viewElement.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            viewElement.querySelector('.tab-btn.active').classList.remove('active');
            viewElement.querySelector('.tab-content.active').classList.remove('active');
            e.currentTarget.classList.add('active');
            viewElement.querySelector(`#${e.currentTarget.dataset.tab}`).classList.add('active');
        });
    });
}