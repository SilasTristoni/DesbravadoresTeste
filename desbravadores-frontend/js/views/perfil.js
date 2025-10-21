// js/views/perfil.js

// --- FUNÇÕES AUXILIARES ---

function getUserPayload() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

function calculateXpForNextLevel(currentLevel) {
    return 100 + (currentLevel * 50);
}

let currentUserData = null;
let isEditing = false;

// Renderiza o bloco de identidade no modo de visualização
function renderInfoDisplay(user) {
    return `
        <div class="info-display" id="profileInfoDisplay">
            <h2>${user.name} ${user.surname}</h2>
            <p>${user.group ? user.group.name : 'Sem Grupo'} • Nível ${user.level}</p>
        </div>
    `;
}

// Renderiza o bloco de identidade no modo de edição
function renderEditForm(user) {
    return `
        <form id="edit-profile-form" class="edit-form" style="display: block;">
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-name">Nome</label>
                    <input type="text" id="edit-name" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-surname">Sobrenome</label>
                    <input type="text" id="edit-surname" value="${user.surname}" required>
                </div>
            </div>
            <div class="form-group">
                <label for="edit-avatar">Link/URL do Avatar</label>
                <input type="text" id="edit-avatar" value="${user.avatar || ''}">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-save-sidebar">Salvar</button>
                <button type="button" id="cancelEditBtn" class="btn-cancel-sidebar">Cancelar</button>
            </div>
        </form>
    `;
}

// Alterna entre o modo de visualização e edição
function toggleEditMode(viewElement, user) {
    isEditing = !isEditing;
    renderIdentityBlock(viewElement, user);
}

// Renderiza o bloco de identidade (cabeçalho do perfil)
function renderIdentityBlock(viewElement, user) {
    const infoContainer = viewElement.querySelector('#info-and-edit-wrapper');
    const editBtn = viewElement.querySelector('#editProfileBtn');
    
    if (!infoContainer) return;
    
    infoContainer.innerHTML = isEditing ? renderEditForm(user) : renderInfoDisplay(user);
    
    if (editBtn) {
        editBtn.style.display = user.isOtherUser ? 'none' : (isEditing ? 'none' : 'flex');
    }
    
    if (isEditing) {
        viewElement.querySelector('#cancelEditBtn').addEventListener('click', () => {
            toggleEditMode(viewElement, user);
        });
        
        const editForm = viewElement.querySelector('#edit-profile-form');
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: viewElement.querySelector('#edit-name').value,
                surname: viewElement.querySelector('#edit-surname').value,
                avatar: viewElement.querySelector('#edit-avatar').value,
            };
            
            try {
                const saveButton = editForm.querySelector('.btn-save-sidebar');
                saveButton.textContent = 'Salvando...';
                saveButton.disabled = true;

                const updatedUser = await fetchApi('/api/profile/me', {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                alert('Perfil atualizado com sucesso!');
                currentUserData = updatedUser;
                toggleEditMode(viewElement, currentUserData);

            } catch (error) {
                alert(`Erro ao salvar perfil: ${error.message}`);
                const saveButton = editForm.querySelector('.btn-save-sidebar');
                if(saveButton) {
                    saveButton.textContent = 'Salvar';
                    saveButton.disabled = false;
                }
            }
        });
    }
}

// Renderiza a lista de fundos e adiciona interatividade
async function renderBackgroundsTab(viewElement, user, allBackgrounds) {
    const isOwnProfile = !user.isOtherUser;
    const backgroundsGrid = allBackgrounds.map(bg => {
        const style = bg.imageUrl 
            ? `background: url(http://localhost:8080${bg.imageUrl}) center/cover no-repeat; color: ${bg.textColor};`
            : `background: ${bg.gradient}; color: ${bg.textColor};`;
        
        const isSelected = user.selectedBackground && user.selectedBackground.id === bg.id;
        
        return `
            <div class="background-card ${isSelected ? 'selected' : ''} ${isOwnProfile ? '' : 'locked'}" 
                 data-bg-id="${bg.id}" 
                 title="${isOwnProfile ? 'Clique para selecionar' : 'Visível apenas para perfil próprio'}">
                <div class="background-preview" style="${style}"></div>
                <div class="background-info">
                    <strong>${bg.name}</strong>
                    ${isSelected ? ' (Selecionado)' : ''}
                </div>
            </div>
        `;
    }).join('');

    const tabContent = viewElement.querySelector('#backgrounds-tab-content');
    if (tabContent) {
        tabContent.innerHTML = `<div class="backgrounds-grid">${backgroundsGrid}</div>`;
        
        if (isOwnProfile) {
            tabContent.querySelectorAll('.background-card').forEach(card => {
                card.addEventListener('click', async function() {
                    const bgId = this.dataset.bgId;
                    try {
                        await fetchApi('/api/profile/me/background', {
                            method: 'PUT',
                            body: JSON.stringify({ backgroundId: parseInt(bgId, 10) })
                        });
                        alert('Fundo do perfil atualizado com sucesso!');
                        renderProfileView(viewElement); // Recarrega a view para atualizar
                    } catch (error) {
                        alert(`Erro ao selecionar fundo: ${error.message}`);
                    }
                });
            });
        }
    }
}

// --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO DA VIEW ---

export async function renderProfileView(viewElement, userId = null) {
    
    viewElement.innerHTML = `<p>A carregar perfil...</p>`;

    try {
        const endpoint = userId ? `/api/users/${userId}` : '/api/profile/me';
        const user = await fetchApi(endpoint);
        user.isOtherUser = !!userId;
        
        currentUserData = user;
        isEditing = false;

        const allBackgrounds = await fetchApi('/api/backgrounds');
        
        const currentUserPayload = getUserPayload();
        const isDirector = currentUserPayload?.role === 'DIRETOR';
        const isOwnProfile = !userId;

        const bg = user.selectedBackground;
        const backgroundStyle = bg?.imageUrl 
            ? `background: url(http://localhost:8080${bg.imageUrl}) center/cover no-repeat; color: ${bg.textColor};` 
            : (bg?.gradient 
                ? `background: ${bg.gradient}; color: ${bg.textColor};` 
                : `background: linear-gradient(135deg, #2d5016 0%, #6b8e23 100%); color: white;`);

        const xpNeeded = calculateXpForNextLevel(user.level);
        const xpProgressPercentage = xpNeeded > 0 ? (user.xp / xpNeeded) * 100 : 0;
        
        viewElement.innerHTML = `
            <div class="profile-container">
                <div class="profile-identity-block" id="identityBlock" style="${backgroundStyle}">
                    <div class="profile-identity-header">
                        <img src="${user.avatar || 'img/escoteiro1.png'}" alt="Avatar" class="avatar-img">
                        <div class="info-and-edit-wrapper" id="info-and-edit-wrapper"></div>
                        ${isOwnProfile ? '<button class="edit-btn" id="editProfileBtn">✏️</button>' : ''}
                    </div>
                </div>

                <div class="profile-progress-block">
                    <div class="level-display">
                        <div class="level-badge">Nível ${user.level}</div>
                        <div class="xp-text">${user.xp} / ${xpNeeded} XP</div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${xpProgressPercentage}%">
                            ${xpProgressPercentage > 15 ? `${Math.round(xpProgressPercentage)}%` : ''}
                        </div>
                    </div>
                </div>

                ${isDirector && userId ? `
                    <div class="admin-widget">
                        <button id="manage-achievements-btn" class="action-btn" data-user-id="${userId}">Gerir Conquistas do Utilizador</button>
                    </div>
                ` : ''}

                <div class="profile-achievements-block">
                    <div class="tabs">
                        <nav class="tab-nav">
                            <button class="tab-btn active" data-tab="badges">Emblemas</button>
                            ${isOwnProfile ? '<button class="tab-btn" data-tab="backgrounds">Fundos de Perfil</button>' : ''}
                        </nav>
                        
                        <div id="badges-tab-content" class="tab-content active">
                            ${user.badges && user.badges.length > 0 ? user.badges.map(badge => `
                                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <img src="http://localhost:8080${badge.icon}" alt="${badge.name}" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 15px;">
                                    <strong>${badge.name}</strong>
                                </div>
                            `).join('') : '<p>Nenhum emblema conquistado ainda.</p>'}
                        </div>
                        
                        ${isOwnProfile ? '<div id="backgrounds-tab-content" class="tab-content">A carregar fundos...</div>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        // --- ADICIONA OS LISTENERS E RENDERIZA OS COMPONENTES ---

        renderIdentityBlock(viewElement, user);
        
        const editProfileBtn = viewElement.querySelector('#editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                toggleEditMode(viewElement, currentUserData);
            });
        }
        
        const manageBtn = viewElement.querySelector('#manage-achievements-btn');
        if (manageBtn) {
            manageBtn.addEventListener('click', (e) => {
                const targetUserId = e.currentTarget.dataset.userId;
                window.dispatchEvent(new CustomEvent('navigate', { 
                    detail: { view: 'manage-achievements', data: targetUserId }
                }));
            });
        }
        
        viewElement.querySelectorAll('.tab-nav button').forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.dataset.tab;
                
                viewElement.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                viewElement.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                viewElement.querySelector(`#${targetTab}-tab-content`).classList.add('active');
            });
        });

        if (isOwnProfile) {
            renderBackgroundsTab(viewElement, user, allBackgrounds);
        }

    } catch (error) {
        viewElement.innerHTML = `<p style="color: red;">Não foi possível carregar os dados do perfil. ${error.message}</p>`;
    }
}