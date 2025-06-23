import { appState } from '../state.js';
// CAMINHO CORRIGIDO:
import { showAchievementModal } from '../../components/modal.js';

const MAX_FEATURED = 3; 


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
            badgeItem.addEventListener('click', () => toggleFeatured(item, viewElement, user));
            badgeItem.innerHTML = `<div class="badge-icon">${item.icon}</div><div class="badge-name">${item.name}</div>`;
            container.appendChild(badgeItem);
        }
    });
}

function renderAchievementGrid(items, gridElement, viewElement, user) {
    if (!gridElement) return;
    gridElement.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        const isFeatured = user.displayedBadges.includes(item.id);
        card.className = `achievement-card ${!item.unlocked ? 'locked' : ''} ${isFeatured ? 'is-featured' : ''}`;
        card.addEventListener('click', () => {
            if (item.unlocked) {
                toggleFeatured(item, viewElement, user);
            } else {
                showAchievementModal(item);
            }
        });
        card.innerHTML = `<div class="achievement-icon">${item.icon}</div><div class="achievement-info"><h4>${item.name}</h4><p>${item.description}</p></div>`;
        gridElement.appendChild(card);
    });
}

function renderBackgrounds(viewElement, user) {
    const grid = viewElement.querySelector('#backgroundGrid');
    if (!grid) return;
    const identityBlock = viewElement.querySelector('#identityBlock');
    
    let tempSelectedBg = user.selectedBackground;

    grid.innerHTML = '';
    appState.backgrounds.forEach(bg => {
        const card = document.createElement('div');
        card.className = `background-card ${!bg.unlocked ? 'locked' : ''} ${tempSelectedBg === bg.id ? 'selected' : ''}`;
        
        card.addEventListener('click', () => {
            if (document.body.classList.contains('profile-edit-mode')) {
                if (bg.unlocked) {
                    tempSelectedBg = bg.id;
                    identityBlock.style.background = bg.gradient;
                    renderBackgrounds(viewElement, user); 
                } else {
                    showAchievementModal(bg);
                }
            } else {
                showAchievementModal(bg);
            }
        });
        
        card.innerHTML = `
            <div class="background-preview" style="background: ${bg.gradient};"></div>
            <div class="background-info"><h4>${bg.name}</h4></div>
        `;
        grid.appendChild(card);
    });

    return {
        saveBackgroundSelection: () => { user.selectedBackground = tempSelectedBg; },
        revertBackgroundSelection: () => {
            const originalBg = appState.backgrounds.find(b => b.id === user.selectedBackground);
            if (originalBg) identityBlock.style.background = originalBg.gradient;
        }
    };
}

function toggleFeatured(item, viewElement, user) {
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

export function renderProfileView(viewElement, userId) {
    const user = appState.users[userId || appState.currentUserId];

    if (!user) {
        viewElement.innerHTML = `<div class="container"><h2>Usuário não encontrado.</h2></div>`;
        return;
    }

    const selectedBg = appState.backgrounds.find(bg => bg.id === user.selectedBackground);

    viewElement.innerHTML = `
        <div class="profile-container">
            <div class="profile-identity-block" id="identityBlock" style="background: ${selectedBg ? selectedBg.gradient : 'var(--scout-green)'};">
                <div class="profile-identity-header">
                    <img src="${user.avatar}" alt="Avatar" class="avatar-img">
                    <div class="info-and-edit-wrapper">
                        <div class="info-display" id="profileInfoDisplay">
                            <h2>${user.name} ${user.surname}</h2>
                            <p>${user.rank} Aventureiro • Nível ${user.level}</p>
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
                    <div id="fundos" class="tab-content"><div class="backgrounds-grid" id="backgroundGrid"></div></div>
                </section>
            </div>
        </div>
    `;

    const backgroundManager = renderBackgrounds(viewElement, user);

    viewElement.querySelector('#editProfileBtn').addEventListener('click', () => {
        if (user.id === appState.currentUserId) {
            viewElement.querySelector('#profileInfoDisplay').style.display = 'none';
            viewElement.querySelector('#profileEditForm').style.display = 'block';
            document.body.classList.add('profile-edit-mode');
        } else {
            alert("Você só pode editar o seu próprio perfil.");
        }
    });

    viewElement.querySelector('#cancelBtn').addEventListener('click', () => {
        viewElement.querySelector('#profileInfoDisplay').style.display = 'block';
        viewElement.querySelector('#profileEditForm').style.display = 'none';
        backgroundManager.revertBackgroundSelection();
        document.body.classList.remove('profile-edit-mode');
    });

    viewElement.querySelector('#saveBtn').addEventListener('click', () => {
        user.name = viewElement.querySelector('#inputName').value;
        user.surname = viewElement.querySelector('#inputSurname').value;
        viewElement.querySelector('#profileInfoDisplay h2').textContent = `${user.name} ${user.surname}`;
        
        backgroundManager.saveBackgroundSelection();

        viewElement.querySelector('#profileInfoDisplay').style.display = 'block';
        viewElement.querySelector('#profileEditForm').style.display = 'none';
        document.body.classList.remove('profile-edit-mode');
    });

    renderFeaturedItems(viewElement, user);
    renderAchievementGrid(appState.badges, viewElement.querySelector('#emblemGrid'), viewElement, user);
    renderAchievementGrid(appState.seals, viewElement.querySelector('#sealGrid'), viewElement, user);
    
    viewElement.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            viewElement.querySelector('.tab-btn.active').classList.remove('active');
            viewElement.querySelector('.tab-content.active').classList.remove('active');
            e.currentTarget.classList.add('active');
            viewElement.querySelector(`#${e.currentTarget.dataset.tab}`).classList.add('active');
        });
    });
}