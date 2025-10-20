// js/views/admin/manage-groups.js

let allMonitors = [];

function renderGroupsTable(groupDetails, viewElement) {
    const tableBody = viewElement.querySelector('#groups-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = groupDetails.map(detail => {
        const group = detail.group;
        const members = detail.members;
        
        return `
            <tr class="group-row" data-group-id="${group.id}">
                <td>${group.id}</td>
                <td>${group.name}</td>
                <td>${group.leader ? `${group.leader.name} ${group.leader.surname}` : 'Nenhum'}</td>
                <td>${members.length} membro(s)</td>
                <td>
                    <button class="action-btn-small edit-group-btn" data-group-id="${group.id}">Editar</button>
                    <button class="action-btn-small delete-group-btn" data-group-id="${group.id}">Apagar</button>
                </td>
            </tr>
            <tr class="members-row" id="members-for-group-${group.id}" style="display: none;">
                <td colspan="5" class="members-cell">
                    <h4>Membros do Grupo:</h4>
                    ${members.length > 0 ? `
                        <ul>
                            ${members.map(member => `
                                <li>
                                    <span>${member.name} ${member.surname} (${member.role})</span>
                                    <button class="remove-member-btn" data-user-id="${member.id}" title="Remover do grupo">✖</button>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>Este grupo não possui membros.</p>'}
                </td>
            </tr>
        `;
    }).join('');
}

async function fetchAndRender(viewElement) {
    try {
        const [groupPage, monitors] = await Promise.all([
            fetchApi('/api/groups'),
            fetchApi('/api/admin/users/monitors')
        ]);
        
        const groupDetails = groupPage.content;
        
        allMonitors = monitors;
        renderGroupsTable(groupDetails, viewElement);
    } catch (error) {
        viewElement.querySelector('#groups-list-container').innerHTML = `<p style="color: red;">Erro ao carregar grupos: ${error.message}</p>`;
    }
}

function openEditModal(groupId) {
    const modal = document.getElementById('activityModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    modalTitle.textContent = `Editar Grupo (ID: ${groupId})`;
    const monitorOptions = allMonitors.map(m => `<option value="${m.id}">${m.name} ${m.surname}</option>`).join('');
    modalBody.innerHTML = `
        <form id="edit-group-form" class="user-form">
            <div class="form-group"><label for="edit-group-name">Nome do Grupo</label><input type="text" id="edit-group-name" required></div>
            <div class="form-group"><label for="edit-group-leader">Líder (Monitor)</label><select id="edit-group-leader"><option value="">Nenhum</option>${monitorOptions}</select></div>
            <button type="submit" class="action-btn">Salvar Alterações</button>
        </form>
    `;
    modal.classList.add('active');
    document.getElementById('edit-group-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        const updatedName = document.getElementById('edit-group-name').value;
        const leaderId = document.getElementById('edit-group-leader').value;
        const payload = { name: updatedName, leader: leaderId ? { id: leaderId } : null };
        try {
            await fetchApi(`/api/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Grupo atualizado com sucesso!', 'success');
            modal.classList.remove('active');
            renderManageGroupsView(document.getElementById('view-manage-groups'));
        } catch (error) {
            showToast(`Erro ao atualizar grupo: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });
}


export function renderManageGroupsView(viewElement) {
    viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Criar Novo Grupo (Patrulha)</h2>
            <form id="create-group-form" class="user-form">
                <div class="form-group"><label for="group-name">Nome do Grupo</label><input type="text" id="group-name" placeholder="Ex: Patrulha Lince" required></div>
                <button type="submit" class="action-btn">Criar Grupo</button>
            </form>
        </div>
        <div class="admin-widget">
            <h2>Grupos Existentes</h2>
            <p>Clique numa linha para ver/esconder os membros.</p>
            <div id="groups-list-container">
                <table class="user-table">
                    <thead><tr><th>ID</th><th>Nome</th><th>Líder</th><th>Membros</th><th>Ações</th></tr></thead>
                    <tbody id="groups-table-body"><tr><td colspan="5">A carregar...</td></tr></tbody>
                </table>
            </div>
            </div>
        <style>
            .members-cell { background-color: #f8f9fa; padding: 1rem 2rem; } 
            .members-cell ul { list-style: none; padding: 0; }
            .members-cell li { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
            .remove-member-btn { background: none; border: none; color: #c62828; font-size: 1rem; cursor: pointer; }
            .group-row { cursor: pointer; }
        </style>
    `;

    // Listener para criar grupo
    viewElement.querySelector("#create-group-form").addEventListener('submit', async (e) => {
        e.preventDefault();
        const groupName = viewElement.querySelector('#group-name').value;
        const submitButton = e.target.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';
        
        try {
            await fetchApi('/api/groups', { method: 'POST', body: JSON.stringify({ name: groupName }) });
            showToast(`Grupo "${groupName}" criado com sucesso!`, 'success');
            e.target.reset();
            fetchAndRender(viewElement);
        } catch (error) {
            showToast(`Erro ao criar grupo: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Grupo';
        }
    });

    // Listener geral de cliques para a view
    viewElement.addEventListener('click', async (e) => {
        const target = e.target;
        
        // Abrir/fechar lista de membros
        if (target.closest('.group-row')) {
            const row = target.closest('.group-row');
            const groupId = row.dataset.groupId;
            const membersRow = viewElement.querySelector(`#members-for-group-${groupId}`);
            if (membersRow) {
                membersRow.style.display = membersRow.style.display === 'none' ? 'table-row' : 'none';
            }
        }
        
        // Botão de Editar Grupo
        if (target.matches('.edit-group-btn')) {
            e.stopPropagation();
            openEditModal(target.dataset.groupId);
        }

        // Botão de Apagar Grupo
        if (target.matches('.delete-group-btn')) {
            e.stopPropagation();
            const groupId = target.dataset.groupId;
            if (confirm(`Tem a certeza que deseja apagar o grupo? Esta ação removerá o grupo permanentemente.`)) {
                target.disabled = true;
                target.textContent = 'Apagando...';
                try {
                    await fetchApi(`/api/groups/${groupId}`, { method: 'DELETE' });
                    showToast('Grupo apagado com sucesso!', 'success');
                    fetchAndRender(viewElement);
                } catch (error) {
                    showToast(`Erro: ${error.message}`, 'error');
                    target.disabled = false;
                    target.textContent = 'Apagar';
                }
            }
        }

        // Lógica para o botão de remover membro
        if (target.matches('.remove-member-btn')) {
            e.stopPropagation();
            const userId = target.dataset.userId;
            const userName = target.parentElement.querySelector('span').textContent;

            if (confirm(`Tem a certeza de que quer remover ${userName} do grupo?`)) {
                target.disabled = true;
                
                try {
                    await fetchApi(`/api/admin/users/${userId}/remove-group`, {
                        method: 'PUT'
                    });
                    showToast(`${userName} foi removido(a) do grupo.`, 'success');
                    fetchAndRender(viewElement);
                } catch (error) {
                     showToast(`Erro ao remover membro: ${error.message}`, 'error');
                     target.disabled = false;
                }
            }
        }
    });

    fetchAndRender(viewElement);
}