// js/views/perfil.js


import {showToast as toastFunc} from '../ui/toast.js';
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

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

let currentUserData = null;
let isEditing = false;

// MVP: Exibe apenas Nome e Grupo
function renderInfoDisplay(user) {
    return `
        <div class="info-display" id="profileInfoDisplay">
            <h2>${user.name} ${user.surname}</h2>
            <p>${user.group ? user.group.name : 'Sem Grupo'}</p>
        </div>
    `;
}

// MVP: Edição restrita apenas a Nome/Sobrenome (Sem Avatar)
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
            
            <div class="form-actions">
                <button type="submit" class="btn-save-sidebar">Salvar</button>
                <button type="button" id="cancelEditBtn" class="btn-cancel-sidebar">Cancelar</button>
            </div>
        </form>
    `;
}

function toggleEditMode(viewElement, user) {
    isEditing = !isEditing;
    renderIdentityBlock(viewElement, user);
}

function renderIdentityBlock(viewElement, user) {
    const infoContainer = viewElement.querySelector('#info-and-edit-wrapper');
    const editBtn = viewElement.querySelector('#editProfileBtn');

    if (!infoContainer) return;

    infoContainer.innerHTML = isEditing ? renderEditForm(user) : renderInfoDisplay(user);

    if (editBtn) {
        editBtn.style.display = user.isOtherUser || isEditing ? 'none' : 'flex';
    }

    if (isEditing) {
        viewElement.querySelector('#cancelEditBtn').addEventListener('click', () => {
            toggleEditMode(viewElement, user);
        });

        const editForm = viewElement.querySelector('#edit-profile-form');
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveButton = editForm.querySelector('.btn-save-sidebar');

            const formData = new FormData();
            formData.append('name', viewElement.querySelector('#edit-name').value);
            formData.append('surname', viewElement.querySelector('#edit-surname').value);
            
            // MVP: Sem upload de avatar

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
                renderProfileView(viewElement);

            } catch (error) {
                showToast(`Erro ao salvar perfil: ${error.message}`, 'error');
                saveButton.textContent = 'Salvar';
                saveButton.disabled = false;
            }
        });
    }
}

// Renderiza o Histórico de Chamadas (Funcionalidade Principal do MVP)
async function renderAttendanceHistoryTab(container, user) {
    container.innerHTML = '<p>A carregar histórico de chamadas...</p>';

    try {
        // Se for o próprio usuário, busca o histórico pessoal
        // Se for admin vendo outro, poderia ser outra rota, mas para MVP focamos no "Meus Registros"
        const history = await fetchApi('/api/chamada/history');

        if (!history || history.length === 0) {
            container.innerHTML = '<p>Nenhum registro de presença encontrado.</p>';
            return;
        }

        const historyHtml = history.map(record => {
            const statusClass = record.present ? 'present' : 'absent';
            const statusText = record.present ? 'PRESENTE' : 'AUSENTE';
            // Formatação segura da data
            const [year, month, day] = record.date.split('-');
            const dateObj = new Date(year, month - 1, day);
            const dateFormatted = dateObj.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });

            return `
                <div class="attendance-record ${statusClass}">
                    <div class="date-group">
                        <span class="date">${dateFormatted}</span>
                        <span class="group-label">${record.groupName || 'Grupo'}</span>
                    </div>
                    <span class="status-badge">${statusText}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <style>
                .attendance-history-list { display: flex; flex-direction: column; gap: 10px; }
                .attendance-record {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 15px; border-radius: 10px;
                    background-color: var(--bg-primary); border-left: 6px solid #ccc;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .attendance-record.present { border-left-color: var(--scout-green); }
                .attendance-record.absent { border-left-color: #c62828; }
                
                .date-group { display: flex; flex-direction: column; }
                .date-group .date { font-weight: 700; color: var(--text-primary); }
                .date-group .group-label { font-size: 0.85rem; color: var(--text-secondary); }
                
                .status-badge { 
                    font-size: 0.85rem; font-weight: 700; padding: 5px 10px; border-radius: 20px;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .attendance-record.present .status-badge { background-color: #e8f5e9; color: var(--scout-green); }
                .attendance-record.absent .status-badge { background-color: #ffebee; color: #c62828; }
            </style>
            <div class="attendance-history-list">
                ${historyHtml}
            </div>
        `;

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Não foi possível carregar o histórico.</p>`;
    }
}

export async function renderProfileView(viewElement, userId = null) {
    viewElement.innerHTML = `<p>A carregar perfil...</p>`;

    try {
        const endpoint = userId ? `/api/users/${userId}` : '/api/profile/me';
        const user = await fetchApi(endpoint);
        user.isOtherUser = !!userId && getUserPayload()?.userId != userId;
        currentUserData = user; 
        isEditing = false;

        const isOwnProfile = !user.isOtherUser;
        
        // MVP: Avatar sempre padrão (personalização removida)
        const avatarUrl = 'img/escoteiro1.png';
        
        // MVP: Fundo sempre padrão
        const backgroundStyle = `background: var(--scout-green); color: #FFFFFF;`;

        viewElement.innerHTML = `
            <div class="profile-container">
                <div class="profile-identity-block" id="identityBlock" style="${backgroundStyle}">
                    <div class="profile-identity-header" style="display: flex; align-items: center; width: 100%;">
                        <img src="${avatarUrl}" alt="Avatar" class="avatar-img" style="border: 4px solid rgba(255,255,255,0.3);">
                        <div style="flex-grow: 1; display: flex; justify-content: space-between; align-items: flex-start; margin-left: 1.5rem;">
                            <div class="info-and-edit-wrapper" id="info-and-edit-wrapper">
                                </div>
                            ${isOwnProfile ? '<button class="edit-btn" id="editProfileBtn" title="Editar Nome"><i class="fa-solid fa-pencil"></i></button>' : ''}
                        </div>
                    </div>
                </div>

                <div class="profile-achievements-block">
                    <div class="section-header" style="margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
                        <h3 class="section-title" style="margin: 0; border: none;">Histórico de Atividades</h3>
                    </div>
                    
                    <div id="attendance-history-container">
                        </div>
                </div>
            </div>
        `;

        renderIdentityBlock(viewElement, user);

        const editProfileBtn = viewElement.querySelector('#editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                toggleEditMode(viewElement, currentUserData);
            });
        }

        // Carrega o histórico automaticamente (única aba do MVP)
        const historyContainer = viewElement.querySelector('#attendance-history-container');
        if (isOwnProfile) {
            await renderAttendanceHistoryTab(historyContainer, user);
        } else {
            historyContainer.innerHTML = '<p>Visualização de histórico restrita ao próprio usuário.</p>';
        }

    } catch (error) {
        console.error("Erro perfil:", error);
        viewElement.innerHTML = `<p style="color: red;">Erro ao carregar perfil: ${error.message}</p>`;
    }
}