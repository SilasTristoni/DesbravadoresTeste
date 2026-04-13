// js/views/perfil.js

// Importa showToast se ainda não estiver global
import  { showToast as toastFunc} from '../../ui/toast.js';
import { resolveAssetUrl } from '../../core/url.js';
// Ajuste o caminho se necessário
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

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
        console.error("Erro ao decodificar token:", error);
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
                <label for="edit-avatar">Alterar Avatar (Upload)</label>
                <input type="file" id="edit-avatar" accept="image/*">
                <small style="color: white; opacity: 0.8; margin-top: 5px; display: block;">
                    Deixe em branco para manter o avatar atual.
                </small>
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
        // Mostra o botão Editar apenas no perfil próprio E quando não está editando
        editBtn.style.display = user.isOtherUser || isEditing ? 'none' : 'flex';
    }

    if (isEditing) {
        viewElement.querySelector('#cancelEditBtn').addEventListener('click', () => {
            toggleEditMode(viewElement, user); // Passa o 'user' original
        });

        const editForm = viewElement.querySelector('#edit-profile-form');
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveButton = editForm.querySelector('.btn-save-sidebar');

            const formData = new FormData();
            formData.append('name', viewElement.querySelector('#edit-name').value);
            formData.append('surname', viewElement.querySelector('#edit-surname').value);
            
            const avatarFile = viewElement.querySelector('#edit-avatar').files[0];
            if (avatarFile) {
                formData.append('avatarFile', avatarFile);
            }

            saveButton.textContent = 'Salvando...';
            saveButton.disabled = true;

            try {
                const updatedUser = await fetchApi('/api/profile/me', {
                    method: 'PUT',
                    body: formData 
                });
                
                currentUserData = {...currentUserData, ...updatedUser};
                
                toggleEditMode(viewElement, currentUserData);
                showToast('Perfil atualizado com sucesso!', 'success');
                
                // Recarrega a view se necessário (para Admin visualizar, por exemplo)
                if (updatedUser.id) {
                     renderProfileView(viewElement, updatedUser.id);
                }

            } catch (error) {
                showToast(`Erro ao salvar perfil: ${error.message}`, 'error');
                saveButton.textContent = 'Salvar';
                saveButton.disabled = false;
            }
        });
    }
}

// --- FUNÇÃO DE RENDERIZAÇÃO DO HISTÓRICO DE CHAMADAS ---
async function renderAttendanceHistoryTab(viewElement, user) {
    const tabContent = viewElement.querySelector('#attendance-tab-content');
    if (!tabContent) return;

    tabContent.innerHTML = '<p>A carregar histórico de chamadas...</p>';

    try {
        const history = await fetchApi('/api/chamada/history');

        if (history.length === 0) {
            tabContent.innerHTML = '<p>Nenhum registro de chamada encontrado.</p>';
            return;
        }

        const historyHtml = history.map(record => {
            const statusClass = record.present ? 'present' : 'absent';
            const statusText = record.present ? 'PRESENTE' : 'AUSENTE';
            const dateFormatted = new Date(record.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });

            return `
                <div class="attendance-record ${statusClass}">
                    <span class="date">${dateFormatted}</span>
                    <span class="status">${statusText}</span>
                    <span class="group">${record.groupName}</span>
                </div>
            `;
        }).join('');

        tabContent.innerHTML = `
            <style>
                .attendance-record {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    margin-bottom: 5px;
                    border-radius: 5px;
                    background-color: var(--bg-light);
                    border-left: 5px solid;
                }
                .attendance-record.present { border-left-color: var(--scout-green); }
                .attendance-record.absent { border-left-color: var(--scout-red); }
                .attendance-record .date { font-weight: bold; }
                .attendance-record .status { font-size: 0.9em; padding: 3px 8px; border-radius: 3px; }
                .attendance-record.present .status { background-color: var(--scout-green); color: white; }
                .attendance-record.absent .status { background-color: var(--scout-red); color: white; }
                .attendance-record .group { font-size: 0.8em; color: var(--text-secondary); }
            </style>
            <div class="attendance-history-list">
                ${historyHtml}
            </div>
        `;

    } catch (error) {
        tabContent.innerHTML = `<p style="color: red;">Erro ao carregar histórico: ${error.message}</p>`;
    }
}

// Renderiza a lista de fundos e adiciona interatividade
async function renderBackgroundsTab(viewElement, user, allBackgrounds) {
    const isOwnProfile = !user.isOtherUser;
    const backgroundsGrid = allBackgrounds.map(bg => {
        const imageUrl = bg.imageUrl ? resolveAssetUrl(bg.imageUrl) : null;
        const style = imageUrl
            ? `background: url(${imageUrl}) center/cover no-repeat; color: ${bg.textColor || '#FFFFFF'};` 
            : `background: ${bg.gradient || 'var(--scout-green)'}; color: ${bg.textColor || '#FFFFFF'};`; 

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
        tabContent.innerHTML = `<div class="backgrounds-grid">${backgroundsGrid || '<p>Nenhum fundo disponível.</p>'}</div>`; 

        if (isOwnProfile) {
            tabContent.querySelectorAll('.background-card:not(.locked)').forEach(card => { 
                card.addEventListener('click', async function() {
                    const bgId = this.dataset.bgId;
                    const previouslySelected = tabContent.querySelector('.background-card.selected');
                    const thisCard = this; 

                    thisCard.style.pointerEvents = 'none';
                    thisCard.style.opacity = '0.7';

                    try {
                        await fetchApi('/api/profile/me/background', {
                            method: 'PUT',
                            body: JSON.stringify({ backgroundId: parseInt(bgId, 10) })
                        });

                        if (previouslySelected) {
                            previouslySelected.classList.remove('selected');
                             previouslySelected.querySelector('.background-info').textContent = previouslySelected.querySelector('strong').textContent; 
                        }
                        thisCard.classList.add('selected');
                         thisCard.querySelector('.background-info').innerHTML = `<strong>${thisCard.querySelector('strong').textContent}</strong> (Selecionado)`;

                        showToast('Fundo do perfil atualizado!', 'success');

                        const selectedBgData = allBackgrounds.find(bg => bg.id == bgId);
                         if (selectedBgData) {
                            const identityBlock = viewElement.querySelector('#identityBlock');
                            const newImageUrl = selectedBgData.imageUrl ? resolveAssetUrl(selectedBgData.imageUrl) : null;
                            const newStyle = newImageUrl
                                ? `background: url(${newImageUrl}) center/cover no-repeat; color: ${selectedBgData.textColor || '#FFFFFF'};`
                                : `background: ${selectedBgData.gradient || 'var(--scout-green)'}; color: ${selectedBgData.textColor || '#FFFFFF'};`;
                            identityBlock.style.cssText = newStyle;

                            currentUserData.selectedBackground = selectedBgData;
                         }

                    } catch (error) {
                        showToast(`Erro ao selecionar fundo: ${error.message}`, 'error');
                    } finally {
                        thisCard.style.pointerEvents = 'auto';
                        thisCard.style.opacity = '1';
                    }
                });
            });
        }
    }
}


// --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO DA VIEW ---

export async function renderProfileView(viewElement, userId = null) {

    // --- CORREÇÃO: TRATATIVA PARA FUNCIONALIDADE EM DESENVOLVIMENTO ---
    // Se userId for null, significa que é a aba "Perfil" (meu perfil).
    // Evitamos chamar a API aqui para não causar logout/erro e exibimos o toast.
    if (!userId) {
        viewElement.innerHTML = `
            <div class="profile-container">
                <div class="admin-widget" style="text-align: center; padding: 3rem;">
                    <i class="fa-solid fa-person-digging" style="font-size: 3rem; color: var(--scout-green); margin-bottom: 1rem;"></i>
                    <h2>Perfil</h2>
                    <p>Esta funcionalidade será implementada no futuro.</p>
                </div>
            </div>
        `;
        showToast('Funcionalidade será implementada no futuro.', 'info');
        return;
    }
    // ------------------------------------------------------------------

    // Mantemos a lógica abaixo apenas para quando o ADMIN visualiza o perfil de OUTRO utilizador (userId existe)
    viewElement.innerHTML = `<p>A carregar perfil...</p>`;

    try {
        const endpoint = `/api/users/${userId}`;
        const user = await fetchApi(endpoint);
        // Adiciona flag para saber se é o perfil de outra pessoa (neste caso sempre será true pois userId != null)
        user.isOtherUser = true;

        currentUserData = user; 
        isEditing = false; 

        const allBackgrounds = await fetchApi('/api/backgrounds'); 

        const currentUserPayload = getUserPayload();
        const isAdminViewingOther = (currentUserPayload?.role === 'DIRETOR' || currentUserPayload?.role === 'MONITOR') && user.isOtherUser;
        const isOwnProfile = false; // Como userId != null, nunca é o próprio perfil aqui

        const bg = user.selectedBackground;
        
        let avatarUrl;
        if (user.avatar && user.avatar.startsWith('/file/')) {
            avatarUrl = `${resolveAssetUrl(user.avatar)}?${new Date().getTime()}`;
        } else {
            avatarUrl = (user.avatar || 'img/escoteiro1.png');
        }
        
        const bgImageUrl = bg?.imageUrl ? resolveAssetUrl(bg.imageUrl) : null;
        const backgroundStyle = bgImageUrl
            ? `background: url(${bgImageUrl}) center/cover no-repeat; color: ${bg.textColor || '#FFFFFF'};`
            : `background: ${bg?.gradient || 'var(--scout-green)'}; color: ${bg?.textColor || '#FFFFFF'};`;


        const xpNeeded = calculateXpForNextLevel(user.level);
        const xpProgressPercentage = xpNeeded > 0 ? Math.min((user.xp / xpNeeded) * 100, 100) : 0; 

        viewElement.innerHTML = `
            <div class="profile-container">
                <div class="profile-identity-block" id="identityBlock" style="${backgroundStyle}">
                    <div class="profile-identity-header" style="display: flex; align-items: flex-start; width: 100%;">
                        <img src="${avatarUrl}" alt="Avatar" class="avatar-img">
                        <div style="flex-grow: 1; display: flex; justify-content: space-between; align-items: flex-start; margin-left: 1.5rem;">
                            <div class="info-and-edit-wrapper" id="info-and-edit-wrapper">
                                ${renderInfoDisplay(user)}
                            </div>
                        </div>
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

                ${isAdminViewingOther ? `
                    <div class="admin-widget" style="background-color: var(--scout-tan); border-left: 5px solid var(--scout-brown);">
                         <h3 style="color: var(--scout-brown);">Ações de Administrador</h3>
                        <button id="manage-achievements-btn" class="action-btn" data-user-id="${user.id}" style="background-color: var(--scout-brown); width: auto; padding: 10px 15px;">Gerir Conquistas</button>
                    </div>
                ` : ''}

                <div class="profile-achievements-block">
                    <div class="tabs">
                        <nav class="tab-nav">
                            <button class="tab-btn active" data-tab="badges">Emblemas</button>
                        </nav>

                        <div id="badges-tab-content" class="tab-content active">
                            <div class="badges-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 1rem; justify-items: center;">
                                ${user.badges && user.badges.length > 0 ? user.badges.map(badge => `
                                    <div class="badge-item" title="${badge.name}: ${badge.description}">
                                        <img src="${resolveAssetUrl(badge.icon)}" alt="${badge.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid var(--scout-gold);">
                                        <div class="badge-name" style="font-size: 0.8rem; margin-top: 5px; color: var(--text-secondary);">${badge.name}</div>
                                    </div>
                                `).join('') : '<p style="grid-column: 1 / -1;">Nenhum emblema conquistado ainda.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const manageBtn = viewElement.querySelector('#manage-achievements-btn');
        if (manageBtn) {
            manageBtn.addEventListener('click', (e) => {
                const targetUserId = e.currentTarget.dataset.userId;
                window.dispatchEvent(new CustomEvent('navigate', {
                    detail: { view: 'manage-achievements', data: targetUserId }
                }));
            });
        }

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        viewElement.innerHTML = `<p style="color: red;">Não foi possível carregar os dados do perfil. ${error.message}</p>`;
         if(userId) {
             viewElement.innerHTML += `<br><button onclick="window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }))">Voltar ao Dashboard</button>`;
        }
    }
}
