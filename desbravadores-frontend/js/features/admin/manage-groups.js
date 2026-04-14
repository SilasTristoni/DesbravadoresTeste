import { showToast as toastFunc } from '../../ui/toast.js';
import { showModal } from '../../components/modal.js';

if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

const GROUP_PAGE_SIZE = 5;
let editingGroupId = null;

function truncate(value, length = 90) {
    if (!value) return '';
    return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}

function renderPaginationControls(paginationContainer, listContainer, groupPage) {
    paginationContainer.innerHTML = '';

    const totalPages = groupPage.totalPages ?? groupPage.page?.totalPages ?? 1;
    const number = groupPage.number ?? groupPage.page?.number ?? 0;
    const first = groupPage.first ?? (number === 0);
    const last = groupPage.last ?? (number === totalPages - 1);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first;
    prevBtn.addEventListener('click', () => loadGroupList(listContainer, number - 1));

    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Pagina ${number + 1} de ${totalPages}`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Proxima <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = last;
    nextBtn.addEventListener('click', () => loadGroupList(listContainer, number + 1));

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}

function buildMonitorOptions(monitors, selectedId = null) {
    const baseOption = '<option value="">Sem lider</option>';
    const options = monitors.map((monitor) => {
        const selected = selectedId === monitor.id ? 'selected' : '';
        return `<option value="${monitor.id}" ${selected}>${monitor.name} ${monitor.surname}</option>`;
    }).join('');

    return `${baseOption}${options}`;
}

function renderMembersPreview(members) {
    if (!members.length) {
        return '<p class="unit-members-empty">Nenhum membro vinculado ainda.</p>';
    }

    return `
        <div class="unit-members-grid">
            ${members.map((member) => `
                <div class="unit-member-pill">
                    <strong>${member.name} ${member.surname}</strong>
                    <span>${member.unitRole || member.role}</span>
                </div>
            `).join('')}
        </div>
    `;
}

async function loadGroupList(container, page = 0) {
    try {
        container.innerHTML = '<p>A carregar unidades...</p>';

        const [groupPage, monitorPage] = await Promise.all([
            fetchApi(`/api/groups?page=${page}&size=${GROUP_PAGE_SIZE}&sort=name,asc`),
            fetchApi('/api/admin/users/monitors?page=0&size=999')
        ]);

        const groupDetailsList = groupPage.content;
        const monitors = monitorPage.content;

        if (!groupDetailsList.length) {
            container.innerHTML = '<p>Nenhuma unidade cadastrada ainda.</p>';
            return;
        }

        container.innerHTML = `
            <div class="unit-card-grid">
                ${groupDetailsList.map((details) => {
                    const { group, members, totalXp } = details;
                    const leaderName = group.leader ? `${group.leader.name} ${group.leader.surname}` : 'Sem lider';
                    const accentColor = group.accentColor || '#27408b';
                    const description = group.description || 'Sem descricao publicada.';

                    if (editingGroupId === group.id) {
                        return `
                            <article class="unit-card editing">
                                <form class="edit-group-form" data-group-id="${group.id}" novalidate>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Nome da unidade</label>
                                            <input type="text" name="name" value="${group.name}" class="form-control" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Lider</label>
                                            <select name="leader" class="form-control">${buildMonitorOptions(monitors, group.leader?.id ?? null)}</select>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Descricao</label>
                                        <textarea name="description" class="form-control" rows="3">${group.description || ''}</textarea>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Cor da unidade</label>
                                            <input type="color" name="accentColor" value="${accentColor}" class="form-control unit-color-input">
                                        </div>
                                        <div class="form-group">
                                            <label>Resumo atual</label>
                                            <div class="unit-inline-stats">
                                                <span>${members.length} membros</span>
                                                <span>${totalXp} XP</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-actions">
                                        <button type="submit" class="btn-action save"><i class="fa-solid fa-check"></i> Salvar</button>
                                        <button type="button" class="btn-action cancel cancel-edit-btn"><i class="fa-solid fa-times"></i> Cancelar</button>
                                    </div>
                                </form>
                            </article>
                        `;
                    }

                    return `
                        <article class="unit-card">
                            <div class="unit-card-header" style="border-color: ${accentColor};">
                                <div class="unit-card-title">
                                    <span class="unit-color-dot" style="background-color: ${accentColor};"></span>
                                    <div>
                                        <h3>${group.name}</h3>
                                        <p>${truncate(description)}</p>
                                    </div>
                                </div>
                                <div class="item-actions">
                                    <button class="btn-action-icon edit edit-group-btn" data-group-id="${group.id}" title="Editar unidade">
                                        <i class="fa-solid fa-pencil"></i>
                                    </button>
                                    <button class="btn-action-icon delete delete-group-btn" data-group-id="${group.id}" data-group-name="${group.name}" title="Apagar unidade">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="unit-stats-row">
                                <div class="unit-stat-chip">
                                    <strong>${members.length}</strong>
                                    <span>Membros</span>
                                </div>
                                <div class="unit-stat-chip">
                                    <strong>${totalXp}</strong>
                                    <span>XP da unidade</span>
                                </div>
                                <div class="unit-stat-chip">
                                    <strong>${leaderName}</strong>
                                    <span>Lider</span>
                                </div>
                            </div>

                            <div class="unit-members-section">
                                <div class="unit-members-header">
                                    <strong>Equipe atual</strong>
                                    <span>${members.length ? 'Funcoes e nomes sincronizados com os usuarios' : 'Sem membros ainda'}</span>
                                </div>
                                ${renderMembersPreview(members)}
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
            <div id="group-list-pagination" class="pagination-controls" style="margin-top: 1rem;"></div>
        `;

        const totalPagesSafe = groupPage.totalPages ?? groupPage.page?.totalPages ?? 1;
        if (totalPagesSafe > 1) {
            renderPaginationControls(container.querySelector('#group-list-pagination'), container, groupPage);
        } else {
            container.querySelector('#group-list-pagination').innerHTML = '';
        }

        addEventListeners(container, page);
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
    }
}

function addEventListeners(container, currentPage) {
    const listContainer = document.getElementById('group-list-container');

    container.querySelectorAll('.delete-group-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            const { groupId, groupName } = event.currentTarget.dataset;

            showModal(
                'Confirmar exclusao',
                `<p>Tem certeza que deseja apagar a unidade "${groupName}"?</p><button class="action-btn" id="confirm-del-btn" style="margin-top:1rem;">Confirmar</button>`
            );

            setTimeout(() => {
                const confirmBtn = document.getElementById('confirm-del-btn');
                if (!confirmBtn) return;

                confirmBtn.onclick = async () => {
                    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    confirmBtn.disabled = true;

                    try {
                        await fetchApi(`/api/groups/${groupId}`, { method: 'DELETE' });
                        window.showToast('Unidade apagada com sucesso.', 'success');
                        loadGroupList(listContainer, currentPage);
                        document.getElementById('closeModalBtn').click();
                    } catch (error) {
                        let finalErrorMsg = 'Erro ao apagar unidade.';
                        try {
                            const parsedError = JSON.parse(error.message);
                            if (parsedError && parsedError.message) finalErrorMsg = parsedError.message;
                        } catch (parseEx) {
                            finalErrorMsg = error.message || finalErrorMsg;
                        }
                        window.showToast(finalErrorMsg, 'error');
                        confirmBtn.innerHTML = 'Confirmar';
                        confirmBtn.disabled = false;
                    }
                };
            }, 100);
        });
    });

    container.querySelectorAll('.edit-group-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            editingGroupId = Number.parseInt(event.currentTarget.dataset.groupId, 10);
            loadGroupList(listContainer, currentPage);
        });
    });

    container.querySelectorAll('.cancel-edit-btn').forEach((button) => {
        button.addEventListener('click', () => {
            editingGroupId = null;
            loadGroupList(listContainer, currentPage);
        });
    });

    const editForm = container.querySelector('.edit-group-form');
    if (!editForm) return;

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const groupId = editForm.dataset.groupId;
        const submitBtn = editForm.querySelector('.save');
        const payload = {
            name: editForm.elements.name.value.trim(),
            description: editForm.elements.description.value.trim(),
            accentColor: editForm.elements.accentColor.value,
            leader: editForm.elements.leader.value ? { id: editForm.elements.leader.value } : null
        };

        if (!payload.name) {
            return window.showToast('O nome da unidade e obrigatorio.', 'error');
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        try {
            await fetchApi(`/api/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(payload) });
            window.showToast('Unidade atualizada com sucesso.', 'success');
            editingGroupId = null;
            loadGroupList(listContainer, currentPage);
        } catch (error) {
            let finalErrorMsg = 'Erro ao salvar unidade.';
            try {
                const parsedError = JSON.parse(error.message);
                if (parsedError && parsedError.message) finalErrorMsg = parsedError.message;
            } catch (parseEx) {
                finalErrorMsg = error.message || finalErrorMsg;
            }
            window.showToast(finalErrorMsg, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

export async function renderManageGroupsView(viewElement) {
    viewElement.innerHTML = '<div class="admin-widget"><p>A carregar...</p></div>';

    try {
        const monitorPage = await fetchApi('/api/admin/users/monitors?page=0&size=999');
        const monitors = monitorPage.content;
        const monitorOptions = buildMonitorOptions(monitors);

        viewElement.innerHTML = `
            <div class="admin-widget">
                <div class="create-item-kicker">Unidade</div>
                <h2>Identidade e estrutura da unidade</h2>
                <p style="margin: 0 0 1.2rem 0; color: var(--text-secondary);">Defina nome, cor, lideranca e descricao. Os membros e funcoes aparecem a partir dos usuarios vinculados.</p>
                <form id="admin-group-form" class="user-form" novalidate>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="group-name">Nome da unidade</label>
                            <input type="text" id="group-name" class="form-control" placeholder="Ex: Panteras" required>
                        </div>
                        <div class="form-group">
                            <label for="group-leader">Lider</label>
                            <select id="group-leader" class="form-control">${monitorOptions}</select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="group-description">Descricao</label>
                        <textarea id="group-description" class="form-control" placeholder="Resumo da identidade, foco ou proposta da unidade."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="group-accent-color">Cor da unidade</label>
                            <input type="color" id="group-accent-color" class="form-control unit-color-input" value="#27408b">
                        </div>
                        <div class="form-group">
                            <label>Resumo</label>
                            <div class="unit-inline-stats">
                                <span>Cor e descricao aparecem no admin</span>
                                <span>XP e membros vem dos usuarios</span>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="action-btn">Criar unidade</button>
                </form>
            </div>

            <div class="admin-widget" style="margin-top: 2rem;">
                <div class="create-item-catalog-header">
                    <div>
                        <div class="create-item-kicker">Catalogo</div>
                        <h3 style="margin-bottom: 0.4rem;">Unidades existentes</h3>
                        <p>As funcoes mostradas abaixo ja refletem o cargo interno configurado no cadastro do usuario.</p>
                    </div>
                </div>
                <div id="group-list-container"></div>
            </div>
        `;

        const form = viewElement.querySelector('#admin-group-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const payload = {
                name: viewElement.querySelector('#group-name').value.trim(),
                description: viewElement.querySelector('#group-description').value.trim(),
                accentColor: viewElement.querySelector('#group-accent-color').value,
                leader: viewElement.querySelector('#group-leader').value ? { id: viewElement.querySelector('#group-leader').value } : null
            };

            if (!payload.name) {
                return window.showToast('Por favor, informe o nome da unidade.', 'error');
            }

            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Criando...';
            submitBtn.disabled = true;

            try {
                await fetchApi('/api/groups', { method: 'POST', body: JSON.stringify(payload) });
                window.showToast('Unidade criada com sucesso.', 'success');
                form.reset();
                viewElement.querySelector('#group-accent-color').value = '#27408b';
                loadGroupList(viewElement.querySelector('#group-list-container'), 0);
            } catch (error) {
                let finalErrorMsg = 'Falha ao criar a unidade.';
                try {
                    const parsedError = JSON.parse(error.message);
                    if (parsedError && parsedError.message) finalErrorMsg = parsedError.message;
                } catch (parseEx) {
                    finalErrorMsg = error.message || finalErrorMsg;
                }
                window.showToast(finalErrorMsg, 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        loadGroupList(viewElement.querySelector('#group-list-container'), 0);
    } catch (error) {
        viewElement.innerHTML = `<p>Erro: ${error.message}</p>`;
    }
}
