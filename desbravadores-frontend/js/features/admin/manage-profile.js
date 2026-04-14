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

function parseErrorMessage(error, fallback) {
    try {
        const parsed = JSON.parse(error.message);
        if (parsed && parsed.message) {
            return parsed.message;
        }
    } catch (parseEx) {
        return error.message || fallback;
    }
    return fallback;
}

function renderRequirementProgressWidget(progress, isDirector) {
    return `
        <div class="admin-widget progress-admin-widget">
            <div class="progress-widget-header">
                <div>
                    <div class="create-item-kicker">Requisitos</div>
                    <h3>Trilha do aluno</h3>
                    <p>${progress.classLevel} · ${progress.completedRequirements}/${progress.totalRequirements} concluidos</p>
                </div>
                <div class="progress-summary-card">
                    <strong>${progress.completionPercentage}%</strong>
                    <span>${progress.remainingRequirements} restantes</span>
                </div>
            </div>
            <div class="progress-bar-shell">
                <div class="progress-bar-track">
                    <div class="progress-bar-track-fill" style="width: ${progress.completionPercentage}%"></div>
                </div>
            </div>
            <div class="progress-item-list">
                ${progress.items.map((item) => `
                    <div class="progress-item-row ${item.completed ? 'completed' : ''}">
                        <div class="progress-item-main">
                            <div class="progress-item-status ${item.completed ? 'done' : 'pending'}">
                                <i class="fa-solid ${item.completed ? 'fa-check' : 'fa-hourglass-half'}"></i>
                            </div>
                            <div>
                                <strong>${item.displayOrder}. ${item.title}</strong>
                                <small>${item.category} · ${item.classLevel}</small>
                                <small>${item.description}</small>
                            </div>
                        </div>
                        ${isDirector ? `
                            <button class="progress-toggle-btn ${item.completed ? 'is-complete' : ''}" data-progress-type="requirement" data-requirement-id="${item.id}" data-completed="${item.completed}">
                                ${item.completed ? 'Marcar pendente' : 'Marcar concluido'}
                            </button>
                        ` : `
                            <span class="progress-readonly">${item.completed ? 'Concluido' : 'Pendente'}</span>
                        `}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSpecialtyProgressWidget(progress, isDirector) {
    const statusLabel = {
        NOT_STARTED: 'Nao iniciada',
        IN_PROGRESS: 'Em andamento',
        COMPLETED: 'Concluida'
    };

    return `
        <div class="admin-widget progress-admin-widget">
            <div class="progress-widget-header">
                <div>
                    <div class="create-item-kicker">Especialidades</div>
                    <h3>Andamento do catalogo</h3>
                    <p>${progress.completedSpecialties} concluidas · ${progress.inProgressSpecialties} em andamento</p>
                </div>
                <div class="progress-summary-card specialty">
                    <strong>${progress.totalSpecialties}</strong>
                    <span>Total no catalogo</span>
                </div>
            </div>
            <div class="progress-item-list">
                ${progress.items.map((item) => `
                    <div class="progress-item-row">
                        <div class="progress-item-main">
                            <div class="specialty-mini-icon" style="background-color: ${item.accentColor || '#27408b'};">
                                <span>${item.iconName}</span>
                            </div>
                            <div>
                                <strong>${item.name}</strong>
                                <small>${item.area}</small>
                                <small>${item.description}</small>
                            </div>
                        </div>
                        ${isDirector ? `
                            <div class="specialty-status-actions">
                                <button class="specialty-status-btn ${item.status === 'NOT_STARTED' ? 'active' : ''}" data-progress-type="specialty" data-specialty-id="${item.id}" data-status="NOT_STARTED">Nao iniciada</button>
                                <button class="specialty-status-btn ${item.status === 'IN_PROGRESS' ? 'active' : ''}" data-progress-type="specialty" data-specialty-id="${item.id}" data-status="IN_PROGRESS">Em andamento</button>
                                <button class="specialty-status-btn ${item.status === 'COMPLETED' ? 'active' : ''}" data-progress-type="specialty" data-specialty-id="${item.id}" data-status="COMPLETED">Concluida</button>
                            </div>
                        ` : `
                            <span class="progress-readonly">${statusLabel[item.status]}</span>
                        `}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function loadLearningProgress(viewElement, userId, isDirector) {
    const requirementsContainer = viewElement.querySelector('#requirements-progress-container');
    const specialtiesContainer = viewElement.querySelector('#specialties-progress-container');

    if (!requirementsContainer || !specialtiesContainer) return;

    requirementsContainer.innerHTML = '<p>A carregar requisitos...</p>';
    specialtiesContainer.innerHTML = '<p>A carregar especialidades...</p>';

    try {
        const [requirementProgress, specialtyProgress] = await Promise.all([
            fetchApi(`/api/admin/users/${userId}/requirements-progress`),
            fetchApi(`/api/admin/users/${userId}/specialties-progress`)
        ]);

        requirementsContainer.innerHTML = renderRequirementProgressWidget(requirementProgress, isDirector);
        specialtiesContainer.innerHTML = renderSpecialtyProgressWidget(specialtyProgress, isDirector);

        if (isDirector) {
            requirementsContainer.querySelectorAll('[data-progress-type="requirement"]').forEach((button) => {
                button.addEventListener('click', async (event) => {
                    const requirementId = event.currentTarget.dataset.requirementId;
                    const completed = event.currentTarget.dataset.completed !== 'true';
                    event.currentTarget.disabled = true;

                    try {
                        await fetchApi(`/api/admin/users/${userId}/requirements/${requirementId}`, {
                            method: 'PUT',
                            body: JSON.stringify({ completed })
                        });
                        window.showToast('Progresso de requisito atualizado.', 'success');
                        loadLearningProgress(viewElement, userId, isDirector);
                    } catch (error) {
                        window.showToast(parseErrorMessage(error, 'Falha ao atualizar requisito.'), 'error');
                        event.currentTarget.disabled = false;
                    }
                });
            });

            specialtiesContainer.querySelectorAll('[data-progress-type="specialty"]').forEach((button) => {
                button.addEventListener('click', async (event) => {
                    const specialtyId = event.currentTarget.dataset.specialtyId;
                    const status = event.currentTarget.dataset.status;
                    event.currentTarget.disabled = true;

                    try {
                        await fetchApi(`/api/admin/users/${userId}/specialties/${specialtyId}`, {
                            method: 'PUT',
                            body: JSON.stringify({ status })
                        });
                        window.showToast('Status da especialidade atualizado.', 'success');
                        loadLearningProgress(viewElement, userId, isDirector);
                    } catch (error) {
                        window.showToast(parseErrorMessage(error, 'Falha ao atualizar especialidade.'), 'error');
                        event.currentTarget.disabled = false;
                    }
                });
            });
        }
    } catch (error) {
        const message = parseErrorMessage(error, 'Nao foi possivel carregar o progresso.');
        requirementsContainer.innerHTML = `<p style="color: red;">${message}</p>`;
        specialtiesContainer.innerHTML = `<p style="color: red;">${message}</p>`;
    }
}

export async function renderManageProfileView(viewElement, user) {
    if (!user || typeof user !== 'object') {
        viewElement.innerHTML = `
            <div class="admin-widget">
                <p style="color: red;">Erro: Dados do utilizador nao encontrados.</p>
                <button class="btn-action cancel" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: {view: 'dashboard'}}))">Voltar</button>
            </div>
        `;
        return;
    }

    const myRole = getLoggedUserRole();
    const isDirector = myRole === 'DIRETOR';

    viewElement.innerHTML = `<p>A carregar perfil de ${user.name}...</p>`;

    try {
        const groupPage = await fetchApi('/api/groups?page=0&size=999');

        const groupName = (user.group && user.group.name) ? user.group.name : 'Sem grupo';
        const groupId = (user.group && user.group.id) ? user.group.id : '';
        const unitRole = user.unitRole || 'Sem funcao definida';

        let groupOptionsHTML = '<option value="">Sem grupo</option>';
        const groups = groupPage.content.map((detail) => detail.group).filter((group) => group && group.id && group.name);
        groups.forEach((group) => {
            const selected = group.id === groupId ? 'selected' : '';
            groupOptionsHTML += `<option value="${group.id}" ${selected}>${group.name}</option>`;
        });

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
                        <i class="fa-solid fa-arrow-left"></i> Voltar a Dashboard
                    </button>
                </div>

                <div style="display: flex; gap: 20px; align-items: flex-start;">
                    <img src="${user.avatar || 'assets/images/escoteiro1.png'}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--scout-green); object-fit: cover; background-color: var(--bg-secondary); flex-shrink: 0;">

                    <div id="full-user-view-mode" style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h3 style="margin: 0 0 5px 0; font-size: 1.5rem; color: var(--text-primary);">${user.name} ${user.surname}</h3>
                                <p style="margin: 0 0 15px 0; color: var(--text-secondary); font-size: 1rem;">
                                    <i class="fa-solid fa-user-tag" style="width: 16px;"></i> ${user.username || 'Nao possui identificador'}
                                </p>
                            </div>
                            ${editButtonHtml}
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <span class="status-badge presente" style="background-color: #e8f5e9; color: #2e7d32; border-color: #c8e6c9; font-size: 1rem; padding: 8px 15px;">
                                <i class="fa-solid fa-star"></i> Nivel ${user.level}
                            </span>
                            <span class="status-badge" style="background-color: #e3f2fd; color: #1565c0; border-color: #bbdefb; font-size: 1rem; padding: 8px 15px;">
                                <i class="fa-solid fa-users"></i> ${groupName}
                            </span>
                            <span class="status-badge" style="background-color: #fff4db; color: #8d5c00; border-color: #f2d38a; font-size: 1rem; padding: 8px 15px;">
                                <i class="fa-solid fa-flag"></i> ${unitRole}
                            </span>
                        </div>
                    </div>

                    <form id="full-user-edit-mode" style="display: none; flex: 1; flex-direction: column; gap: 15px; width: 100%;" novalidate>
                        <div class="form-row">
                            <div class="form-group" style="margin: 0;"><input type="text" id="edit-name" value="${user.name}" placeholder="Nome *" required></div>
                            <div class="form-group" style="margin: 0;"><input type="text" id="edit-surname" value="${user.surname}" placeholder="Sobrenome *" required></div>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <input type="text" id="edit-username" value="${user.username || ''}" placeholder="Identificador *" required>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <input type="text" id="edit-unit-role" value="${user.unitRole || ''}" placeholder="Funcao na unidade">
                        </div>

                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px; display: block;">Nova senha</label>
                            <input type="password" id="edit-password" placeholder="Nova Senha">
                            <div class="password-requirements" id="edit-pass-reqs" style="display: none; margin-top: 8px; padding: 8px;">
                                <div class="req-item invalid" id="req-edit-length"><i class="fa-solid fa-circle-xmark"></i> Minimo de 8 caracteres</div>
                                <div class="req-item invalid" id="req-edit-upper"><i class="fa-solid fa-circle-xmark"></i> Letra maiuscula</div>
                                <div class="req-item invalid" id="req-edit-number"><i class="fa-solid fa-circle-xmark"></i> Um numero</div>
                                <div class="req-item invalid" id="req-edit-special"><i class="fa-solid fa-circle-xmark"></i> Caractere especial</div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group" style="flex: 0 0 100px; margin: 0;">
                                <input type="number" id="edit-level" value="${user.level}" min="1" placeholder="Nivel">
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <select id="edit-group">${groupOptionsHTML}</select>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                            <button type="button" id="full-cancel-edit-btn" class="btn-action cancel" style="background-color: var(--border-color); color: var(--text-primary); width: auto; padding: 10px 20px;">Cancelar</button>
                            <button type="button" id="full-save-edit-btn" class="btn-action save" style="width: auto; padding: 10px 20px;">Salvar Alteracoes</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="requirements-progress-container"></div>
            <div id="specialties-progress-container"></div>
        `;

        viewElement.querySelector('#back-to-dashboard-btn').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
        });

        const viewMode = viewElement.querySelector('#full-user-view-mode');
        const editMode = viewElement.querySelector('#full-user-edit-mode');
        const editBtn = viewElement.querySelector('#full-edit-user-btn');
        const saveBtn = viewElement.querySelector('#full-save-edit-btn');
        const cancelBtn = viewElement.querySelector('#full-cancel-edit-btn');
        const passInput = viewElement.querySelector('#edit-password');
        const passReqsBox = viewElement.querySelector('#edit-pass-reqs');

        if (passInput) {
            passInput.addEventListener('input', (event) => {
                const value = event.target.value;
                passReqsBox.style.display = value.length > 0 ? 'flex' : 'none';

                const updateReq = (id, isValid) => {
                    const element = document.getElementById(id);
                    if (isValid) {
                        element.className = 'req-item valid';
                        element.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + element.innerText.trim();
                    } else {
                        element.className = 'req-item invalid';
                        element.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> ' + element.innerText.trim();
                    }
                };

                updateReq('req-edit-length', value.length >= 8);
                updateReq('req-edit-upper', /[A-Z]/.test(value));
                updateReq('req-edit-number', /[0-9]/.test(value));
                updateReq('req-edit-special', /[@#$%^&+=!._-]/.test(value));
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                viewMode.style.display = 'none';
                editMode.style.display = 'flex';
            });

            cancelBtn.addEventListener('click', () => {
                editMode.style.display = 'none';
                viewMode.style.display = 'block';
                passInput.value = '';
                passReqsBox.style.display = 'none';
            });

            saveBtn.addEventListener('click', async () => {
                const payload = {
                    name: document.getElementById('edit-name').value.trim(),
                    surname: document.getElementById('edit-surname').value.trim(),
                    username: document.getElementById('edit-username').value.trim(),
                    unitRole: document.getElementById('edit-unit-role').value.trim(),
                    level: parseInt(document.getElementById('edit-level').value, 10),
                    role: user.role,
                    group: document.getElementById('edit-group').value ? { id: parseInt(document.getElementById('edit-group').value, 10) } : null
                };

                if (!payload.name || !payload.surname || !payload.username) {
                    return window.showToast('Nome, sobrenome e identificador sao obrigatorios.', 'error');
                }

                const newPassword = document.getElementById('edit-password').value;
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

                    window.showToast('Desbravador atualizado com sucesso.', 'success');
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
                } catch (error) {
                    window.showToast(parseErrorMessage(error, 'Nao foi possivel guardar as alteracoes.'), 'error');
                    saveBtn.innerHTML = 'Salvar Alteracoes';
                    saveBtn.disabled = false;
                }
            });
        }

        loadLearningProgress(viewElement, user.id, isDirector);
    } catch (error) {
        viewElement.innerHTML = `<div class="admin-widget"><p style="color: red;">Erro ao carregar perfil: ${error.message}</p></div>`;
    }
}
