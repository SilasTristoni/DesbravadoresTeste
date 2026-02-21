// js/features/admin/manage-profile.js

// Função para ler o cargo do utilizador logado pelo Token JWT
function getLoggedUserRole() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
    } catch (error) {
        return null;
    }
}

export async function renderManageProfileView(viewElement, user) {
    if (!user || typeof user !== 'object') {
        viewElement.innerHTML = `
            <div class="admin-widget">
                <p style="color: red;">Erro: Dados do utilizador não encontrados.</p>
                <button class="btn-action cancel" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: {view: 'dashboard'}}))">Voltar</button>
            </div>
        `;
        return;
    }

    const myRole = getLoggedUserRole();
    const isDirector = myRole === 'DIRETOR'; // Verifica se quem está logado é Diretor

    viewElement.innerHTML = `<p>A carregar perfil de ${user.name}...</p>`;

    try {
        const groupPage = await fetchApi('/api/groups?page=0&size=999');

        const groupName = (user.group && user.group.name) ? user.group.name : 'Sem grupo';
        const groupId = (user.group && user.group.id) ? user.group.id : '';

        let groupOptionsHTML = '<option value="">Sem grupo</option>';
        const groups = groupPage.content.map(d => d.group).filter(g => g && g.id && g.name);
        groups.forEach(g => {
            const selected = g.id === groupId ? 'selected' : '';
            groupOptionsHTML += `<option value="${g.id}" ${selected}>${g.name}</option>`;
        });

        // Só gera o botão do Lápis se for Diretor
        const editButtonHtml = isDirector 
            ? `<button id="full-edit-user-btn" class="btn-action-icon edit" title="Editar Desbravador" style="margin: 0; flex-shrink: 0; width: 40px; height: 40px; font-size: 1.1rem;"><i class="fa-solid fa-pencil"></i></button>` 
            : '';

        viewElement.innerHTML = `
            <div class="admin-widget" style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; border: none; padding: 0;">
                        <i class="fa-solid fa-user-shield" style="color: var(--scout-green); margin-right: 8px;"></i> Perfil do Desbravador
                    </h2>
                    <button id="back-to-dashboard-btn" class="btn-action cancel" style="background-color: var(--border-color); color: var(--text-primary);">
                        <i class="fa-solid fa-arrow-left"></i> Voltar à Dashboard
                    </button>
                </div>
                
                <div style="display: flex; gap: 20px; align-items: flex-start;">
                    <img src="${user.avatar || 'assets/images/escoteiro1.png'}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--scout-green); object-fit: cover; background-color: var(--bg-secondary); flex-shrink: 0;">
                    
                    <div id="full-user-view-mode" style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h3 style="margin: 0 0 5px 0; font-size: 1.5rem; color: var(--text-primary);">${user.name} ${user.surname}</h3>
                                <p style="margin: 0 0 15px 0; color: var(--text-secondary); font-size: 1rem;">
                                    <i class="fa-solid fa-envelope" style="width: 16px;"></i> ${user.email || 'Não possui email'}
                                </p>
                            </div>
                            ${editButtonHtml}
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <span class="status-badge presente" style="background-color: #e8f5e9; color: #2e7d32; border-color: #c8e6c9; font-size: 1rem; padding: 8px 15px;">
                                <i class="fa-solid fa-star"></i> Nível ${user.level}
                            </span>
                            <span class="status-badge" style="background-color: #e3f2fd; color: #1565c0; border-color: #bbdefb; font-size: 1rem; padding: 8px 15px;">
                                <i class="fa-solid fa-users"></i> ${groupName}
                            </span>
                        </div>
                    </div>

                    <form id="full-user-edit-mode" style="display: none; flex: 1; flex-direction: column; gap: 15px; width: 100%;" novalidate>
                        <div class="form-row">
                            <div class="form-group" style="margin: 0;"><input type="text" id="edit-name" value="${user.name}" placeholder="Nome *" required></div>
                            <div class="form-group" style="margin: 0;"><input type="text" id="edit-surname" value="${user.surname}" placeholder="Sobrenome *" required></div>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <input type="email" id="edit-email" value="${user.email || ''}" placeholder="Email *" required>
                        </div>
                        
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px; display: block;">Nova Senha (deixe em branco para manter a atual)</label>
                            <input type="password" id="edit-password" placeholder="Nova Senha">
                            
                            <div class="password-requirements" id="edit-pass-reqs" style="display: none; margin-top: 8px; padding: 8px;">
                                <div class="req-item invalid" id="req-edit-length"><i class="fa-solid fa-circle-xmark"></i> Mínimo de 8 caracteres</div>
                                <div class="req-item invalid" id="req-edit-upper"><i class="fa-solid fa-circle-xmark"></i> Letra maiúscula</div>
                                <div class="req-item invalid" id="req-edit-number"><i class="fa-solid fa-circle-xmark"></i> Um número</div>
                                <div class="req-item invalid" id="req-edit-special"><i class="fa-solid fa-circle-xmark"></i> Caractere especial</div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group" style="flex: 0 0 100px; margin: 0;">
                                <input type="number" id="edit-level" value="${user.level}" min="1" placeholder="Nível">
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <select id="edit-group">
                                    ${groupOptionsHTML}
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                            <button type="button" id="full-cancel-edit-btn" class="btn-action cancel" style="background-color: var(--border-color); color: var(--text-primary); width: auto; padding: 10px 20px;">Cancelar</button>
                            <button type="button" id="full-save-edit-btn" class="btn-action save" style="width: auto; padding: 10px 20px;">Salvar Alterações</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="admin-widget widget-warning" style="border-left: 5px solid var(--scout-orange);">
                <h4 style="margin-top: 0; margin-bottom: 10px; color: var(--scout-orange); display: flex; align-items: center; gap: 8px; font-size: 1.2rem;">
                    <i class="fa-solid fa-person-digging"></i> Funcionalidade em Desenvolvimento
                </h4>
                <p style="color: var(--text-primary); font-size: 1rem; margin-bottom: 0; line-height: 1.6;">
                    O histórico detalhado, gestão de XP e atribuição manual de conquistas chegará numa atualização futura! 
                    ${isDirector ? 'Por enquanto, utilize o lápis acima para editar as informações básicas do Desbravador.' : 'Apenas a Direção pode editar estas informações.'}
                </p>
            </div>
        `;

        viewElement.querySelector('#back-to-dashboard-btn').addEventListener('click', () => {
            const event = new CustomEvent('navigate', { detail: { view: 'dashboard' } });
            window.dispatchEvent(event);
        });

        const viewMode = viewElement.querySelector('#full-user-view-mode');
        const editMode = viewElement.querySelector('#full-user-edit-mode');
        const editBtn = viewElement.querySelector('#full-edit-user-btn');
        const saveBtn = viewElement.querySelector('#full-save-edit-btn');
        const cancelBtn = viewElement.querySelector('#full-cancel-edit-btn');
        
        const passInput = viewElement.querySelector('#edit-password');
        const passReqsBox = viewElement.querySelector('#edit-pass-reqs');

        // Lógica do validador de senha
        if (passInput) {
            passInput.addEventListener('input', (e) => {
                const val = e.target.value;
                
                // Mostra a caixa de requisitos apenas se começar a digitar
                if (val.length > 0) {
                    passReqsBox.style.display = 'flex';
                } else {
                    passReqsBox.style.display = 'none';
                }
                
                const updateReq = (id, isValid) => {
                    const el = document.getElementById(id);
                    if (isValid) {
                        el.className = 'req-item valid';
                        el.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + el.innerText.trim();
                    } else {
                        el.className = 'req-item invalid';
                        el.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> ' + el.innerText.trim();
                    }
                };

                updateReq('req-edit-length', val.length >= 8);
                updateReq('req-edit-upper', /[A-Z]/.test(val));
                updateReq('req-edit-number', /[0-9]/.test(val));
                updateReq('req-edit-special', /[@#$%^&+=!._-]/.test(val));
            });
        }

        // Adiciona os eventos do form APENAS se o botão de editar existir (se for Diretor)
        if (editBtn) {
            editBtn.addEventListener('click', () => { viewMode.style.display = 'none'; editMode.style.display = 'flex'; });
            cancelBtn.addEventListener('click', () => { 
                editMode.style.display = 'none'; 
                viewMode.style.display = 'block'; 
                passInput.value = ''; // Limpa a senha se cancelar
                passReqsBox.style.display = 'none';
            });

            saveBtn.addEventListener('click', async () => {
                const nameInput = document.getElementById('edit-name').value.trim();
                const surnameInput = document.getElementById('edit-surname').value.trim();
                const emailInput = document.getElementById('edit-email').value.trim();
                const newPassword = document.getElementById('edit-password').value;
                
                if (!nameInput || !surnameInput || !emailInput) {
                    return window.showToast('Nome, Sobrenome e Email são obrigatórios!', 'error');
                }

                // Cria o payload
                const payload = {
                    name: nameInput,
                    surname: surnameInput,
                    email: emailInput,
                    level: parseInt(document.getElementById('edit-level').value, 10),
                    role: user.role,
                    group: document.getElementById('edit-group').value ? { id: parseInt(document.getElementById('edit-group').value, 10) } : null
                };

                // Adiciona a senha ao envio APENAS se foi digitada
                if (newPassword && newPassword.trim() !== '') {
                    payload.password = newPassword;
                }

                try {
                    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A guardar...';
                    saveBtn.disabled = true;

                    await fetchApi(`/api/admin/users/${user.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });

                    window.showToast('Desbravador atualizado com sucesso!', 'success');
                    const event = new CustomEvent('navigate', { detail: { view: 'dashboard' } });
                    window.dispatchEvent(event);

                } catch (error) {
                    let finalErrorMsg = "Não foi possível guardar as alterações.";
                    try {
                        const parsedError = JSON.parse(error.message);
                        if (parsedError && parsedError.message) finalErrorMsg = parsedError.message;
                    } catch (parseEx) {
                        finalErrorMsg = error.message || finalErrorMsg;
                    }

                    window.showToast(finalErrorMsg, 'error'); 
                    saveBtn.innerHTML = 'Salvar Alterações';
                    saveBtn.disabled = false;
                }
            });
        }

    } catch (e) {
        viewElement.innerHTML = `<div class="admin-widget"><p style="color: red;">Erro ao carregar perfil: ${e.message}</p></div>`;
    }
}