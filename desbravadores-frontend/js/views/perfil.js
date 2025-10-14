// js/views/perfil.js

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

export async function renderProfileView(viewElement, userId = null) {
    
    viewElement.innerHTML = `<p>A carregar perfil...</p>`;

    try {
        // Usa o endpoint /me se nenhum userId for passado (perfil próprio)
        const endpoint = userId ? `/api/users/${userId}` : '/api/profile/me';
        const user = await fetchApi(endpoint);
        
        // O perfil próprio é sempre editável. Se for o perfil de outra pessoa, 
        // apenas um DIRETOR pode gerir as conquistas.
        const currentUserPayload = getUserPayload();
        const isDirector = currentUserPayload?.role === 'DIRETOR';
        const isOwnProfile = !userId;

        // O campo 'selectedBackground' e 'unlockedBackgrounds' vêm do objeto User
        const backgroundStyle = user.selectedBackground?.gradient ? `background: ${user.selectedBackground.gradient}; color: ${user.selectedBackground.textColor || 'white'};` : (user.selectedBackground?.imageUrl ? `background: url(http://localhost:8080${user.selectedBackground.imageUrl}) center/cover; color: ${user.selectedBackground.textColor || 'white'};` : `background: linear-gradient(135deg, #2d5016 0%, #6b8e23 100%);`);
        
        viewElement.innerHTML = `
            <div class="profile-container">
                <div class="profile-identity-block" id="identityBlock" style="${backgroundStyle}">
                    <div class="profile-identity-header">
                        <img src="${user.avatar || 'img/escoteiro1.png'}" alt="Avatar" class="avatar-img">
                        <div class="info-and-edit-wrapper">
                            <div class="info-display" id="profileInfoDisplay">
                                <h2>${user.name} ${user.surname}</h2>
                                <p>${user.group ? user.group.name : 'Sem Grupo'} • Nível ${user.level}</p>
                            </div>
                        </div>
                        ${isOwnProfile ? '<button class="edit-btn" id="editProfileBtn">✏️</button>' : ''}
                    </div>
                </div>

                ${isDirector && userId ? `
                    <div class="admin-widget">
                        <button id="manage-achievements-btn" class="action-btn" data-user-id="${userId}">Gerir Conquistas do Utilizador</button>
                    </div>
                ` : ''}

                <div class="profile-achievements-block">
                    <h3 class="section-title">Emblemas Conquistados</h3>
                    <div id="badges-container">
                        ${user.badges && user.badges.length > 0 ? user.badges.map(badge => `
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <img src="http://localhost:8080${badge.icon}" alt="${badge.name}" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 15px;">
                                <strong>${badge.name}</strong>
                            </div>
                        `).join('') : '<p>Nenhum emblema conquistado ainda.</p>'}
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
        viewElement.innerHTML = `<p style="color: red;">Não foi possível carregar os dados do perfil.</p>`;
    }
}