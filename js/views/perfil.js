import { appState } from '../state.js';
import { showAchievementModal } from '../components/modal.js';

const MAX_FEATURED = 3; 


function renderFeaturedItems(viewElement) {
    const container = viewElement.querySelector('#featuredBadgesDisplay');
    if (!container) return;
    container.innerHTML = '';
    const allAchievements = [...appState.badges, ...appState.seals];
    appState.currentUser.displayedBadges.forEach(itemId => {
        const item = allAchievements.find(a => a.id === itemId);
        if (item) {
            const badgeItem = document.createElement('div');
            badgeItem.className = 'badge-item';
            badgeItem.addEventListener('click', () => toggleFeatured(item, viewElement));
            badgeItem.innerHTML = `<div class="badge-icon">${item.icon}</div><div class="badge-name">${item.name}</div>`;
            container.appendChild(badgeItem);
        }
    });
}

function renderAchievementGrid(items, gridElement, viewElement) {
    if (!gridElement) return;
    gridElement.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        const isFeatured = appState.currentUser.displayedBadges.includes(item.id);
        card.className = `achievement-card ${!item.unlocked ? 'locked' : ''} ${isFeatured ? 'is-featured' : ''}`;
        card.addEventListener('click', () => {
            if (item.unlocked) {
                toggleFeatured(item, viewElement);
            } else {
                showAchievementModal(item);
            }
        });
        card.innerHTML = `<div class="achievement-icon">${item.icon}</div><div class="achievement-info"><h4>${item.name}</h4><p>${item.description}</p></div>`;
        gridElement.appendChild(card);
    });
}

function renderBackgrounds(viewElement) {
    const grid = viewElement.querySelector('#backgroundGrid');
    if (!grid) return;
    const identityBlock = viewElement.querySelector('#identityBlock');
    
    let tempSelectedBg = appState.currentUser.selectedBackground;

    grid.innerHTML = '';
    appState.backgrounds.forEach(bg => {
        const card = document.createElement('div');
        card.className = `background-card ${!bg.unlocked ? 'locked' : ''} ${tempSelectedBg === bg.id ? 'selected' : ''}`;
        
        card.addEventListener('click', () => {
            if (document.body.classList.contains('profile-edit-mode')) {
                if (bg.unlocked) {
                    tempSelectedBg = bg.id;
                    identityBlock.style.background = bg.gradient;
                    renderBackgrounds(viewElement);
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
        saveBackgroundSelection: () => { appState.currentUser.selectedBackground = tempSelectedBg; },
        revertBackgroundSelection: () => {
            const originalBg = appState.backgrounds.find(b => b.id === appState.currentUser.selectedBackground);
            if (originalBg) identityBlock.style.background = originalBg.gradient;
        }
    };
}


function toggleFeatured(item, viewElement) {
    const featuredIds = appState.currentUser.displayedBadges;
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
    renderFeaturedItems(viewElement);
    renderAchievementGrid(appState.badges, viewElement.querySelector('#emblemGrid'), viewElement);
    renderAchievementGrid(appState.seals, viewElement.querySelector('#sealGrid'), viewElement);
}


export function renderProfileView(viewElement) {
    const user = appState.currentUser;
    const selectedBg = appState.backgrounds.find(bg => bg.id === user.selectedBackground);

    viewElement.innerHTML = `
        <div class="profile-container">
            <div class="profile-identity-block" id="identityBlock" style="background: ${selectedBg ? selectedBg.gradient : 'var(--scout-green)'};">
                <div class="profile-identity-header">
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face" alt="Avatar" class="avatar-img">
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

    const backgroundManager = renderBackgrounds(viewElement);

    viewElement.querySelector('#editProfileBtn').addEventListener('click', () => {
        viewElement.querySelector('#profileInfoDisplay').style.display = 'none';
        viewElement.querySelector('#profileEditForm').style.display = 'block';
        document.body.classList.add('profile-edit-mode');
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

    renderFeaturedItems(viewElement);
    renderAchievementGrid(appState.badges, viewElement.querySelector('#emblemGrid'), viewElement);
    renderAchievementGrid(appState.seals, viewElement.querySelector('#sealGrid'), viewElement);
    
    viewElement.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            viewElement.querySelector('.tab-btn.active').classList.remove('active');
            viewElement.querySelector('.tab-content.active').classList.remove('active');
            e.currentTarget.classList.add('active');
            viewElement.querySelector(`#${e.currentTarget.dataset.tab}`).classList.add('active');
        });
    });
}