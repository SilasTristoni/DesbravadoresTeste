// js/views/admin/manage-groups.js

// Importa showModal e showToast se ainda não estiverem globais
import { showModal } from '../../../components/modal.js';
import { showToast as toastFunc } from '../../ui/toast.js'; // Ajuste o caminho se necessário
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

let allMonitors = [];

// Função auxiliar para criar corpo do modal de confirmação (pode ser movida para um utils.js no futuro)
function createConfirmationModalBody(message, confirmCallback) {
    const container = document.createElement('div');
    container.innerHTML = `<p>${message}</p>`;
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirmar';
    confirmButton.className = 'action-btn'; // Use uma classe de botão apropriada
    confirmButton.style.marginTop = '1rem';
    confirmButton.onclick = () => {
        confirmCallback();
        document.getElementById('closeModalBtn').click(); // Fecha o modal após confirmar
    };
    container.appendChild(confirmButton);
    return container;
}


function renderGroupsTable(groupDetails, viewElement) {
    // ... (código interno da função inalterado) ...
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
    // ... (código interno da função inalterado) ...
     try {
        const [groupPage, monitors] = await Promise.all([
            fetchApi('/api/groups?size=999'), // Busca todos os grupos
            fetchApi('/api/admin/users/monitors')
        ]);

        const groupDetails = groupPage.content;

        allMonitors = monitors;
        renderGroupsTable(groupDetails, viewElement);
    } catch (error) {
        viewElement.querySelector('#groups-list-container').innerHTML = `<p style="color: red;">Erro ao carregar grupos: ${error.message}</p>`;
    }
}

function openEditModal(groupId, currentName, currentLeaderId) { // Recebe dados atuais
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    modalTitle.textContent = `Editar Grupo (ID: ${groupId})`;

    // Marca o líder atual como selecionado
    const monitorOptions = allMonitors.map(m =>
        `<option value="${m.id}" ${m.id === currentLeaderId ? 'selected' : ''}>${m.name} ${m.surname}</option>`
    ).join('');

    modalBody.innerHTML = `
        <form id="edit-group-form" class="user-form">
            <div class="form-group">
                <label for="edit-group-name">Nome do Grupo</label>
                <input type="text" id="edit-group-name" value="${currentName}" required> {/* Preenche nome atual */}
            </div>
            <div class="form-group">
                <label for="edit-group-leader">Líder (Monitor)</label>
                <select id="edit-group-leader">
                    <option value="">Nenhum</option>
                    ${monitorOptions}
                </select>
            </div>
            <button type="submit" class="action-btn">Salvar Alterações</button>
        </form>
    `;
    showModal('Editar Grupo', modalBody); // Usa showModal corretamente

    document.getElementById('edit-group-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        const updatedName = document.getElementById('edit-group-name').value;
        const leaderIdValue = document.getElementById('edit-group-leader').value;
        // Garante que o ID seja número ou null
        const leaderId = leaderIdValue && !isNaN(parseInt(leaderIdValue, 10)) ? parseInt(leaderIdValue, 10) : null;
        const payload = { name: updatedName, leader: leaderId ? { id: leaderId } : null };

        try {
            await fetchApi(`/api/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Grupo atualizado com sucesso!', 'success');
            document.getElementById('closeModalBtn').click(); // Fecha modal
            renderManageGroupsView(document.getElementById('view-manage-groups')); // Recarrega a view
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
            .members-cell { background-color: var(--bg-primary); padding: 1rem 2rem; }
            .members-cell ul { list-style: none; padding: 0; }
            .members-cell li { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); }
            .members-cell li:last-child { border-bottom: none; }
            .remove-member-btn { background: none; border: none; color: #c62828; font-size: 1rem; cursor: pointer; padding: 5px; }
            .group-row { cursor: pointer; transition: background-color 0.2s; }
            .group-row:hover { background-color: var(--bg-primary); }
            .members-row td { padding: 0 !important; } /* Ajuste para remover padding extra */
        </style>
    `;

    // Listener para criar grupo
    viewElement.querySelector("#create-group-form").addEventListener('submit', async (e) => {
        // ... (lógica existente inalterada, já usa showToast) ...
         e.preventDefault();
        const groupName = viewElement.querySelector('#group-name').value;
        const submitButton = e.target.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';

        try {
            await fetchApi('/api/groups', { method: 'POST', body: JSON.stringify({ name: groupName }) });
            showToast(`Grupo "${groupName}" criado com sucesso!`, 'success');
            e.target.reset();
            fetchAndRender(viewElement); // Recarrega a lista
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
            // Impede que o clique nos botões propague para a linha
            if (target.tagName === 'BUTTON') return;
            const groupId = row.dataset.groupId;
            const membersRow = viewElement.querySelector(`#members-for-group-${groupId}`);
            if (membersRow) {
                const isHidden = membersRow.style.display === 'none';
                membersRow.style.display = isHidden ? 'table-row' : 'none';
                row.classList.toggle('active', isHidden); // Adiciona classe visual se desejar
            }
        }

        // Botão de Editar Grupo
        if (target.matches('.edit-group-btn')) {
            e.stopPropagation();
            const groupId = target.dataset.groupId;
            // Busca os dados atuais do grupo para preencher o modal
            const groupRow = target.closest('tr');
            const groupName = groupRow.cells[1].textContent;
            // Tenta obter o ID do líder (pode precisar buscar da API se não estiver disponível)
            // Assumindo que a API retorna o objeto leader dentro do group em fetchAndRender
            const groupDetail = (await fetchApi(`/api/groups?size=999`)).content.find(d => d.group.id == groupId);
            const leaderId = groupDetail?.group?.leader?.id || null;
            openEditModal(groupId, groupName, leaderId);
        }

        // Botão de Apagar Grupo
        if (target.matches('.delete-group-btn')) {
            e.stopPropagation();
            const groupId = target.dataset.groupId;
            const groupName = target.closest('tr').cells[1].textContent; // Pega o nome da linha

             // Substitui confirm() por showModal()
            const modalBody = createConfirmationModalBody(`Tem a certeza que deseja apagar o grupo "${groupName}"? Esta ação não pode ser desfeita.`, async () => {
                target.disabled = true;
                target.textContent = 'Apagando...';
                try {
                    await fetchApi(`/api/groups/${groupId}`, { method: 'DELETE' });
                    showToast('Grupo apagado com sucesso!', 'success');
                    fetchAndRender(viewElement); // Recarrega a lista
                } catch (error) {
                    showToast(`Erro: ${error.message}`, 'error');
                    target.disabled = false;
                    target.textContent = 'Apagar';
                }
            });
            showModal('Confirmar Exclusão', modalBody);
        }

        // Lógica para o botão de remover membro
        if (target.matches('.remove-member-btn')) {
            e.stopPropagation();
            const userId = target.dataset.userId;
            const userName = target.parentElement.querySelector('span').textContent.split('(')[0].trim(); // Pega só o nome

            // Substitui confirm() por showModal()
             const modalBody = createConfirmationModalBody(`Tem a certeza de que quer remover ${userName} do grupo?`, async () => {
                target.disabled = true;
                const originalIcon = target.innerHTML;
                target.innerHTML = '...'; // Indica processamento

                try {
                    await fetchApi(`/api/admin/users/${userId}/remove-group`, {
                        method: 'PUT'
                    });
                    showToast(`${userName} foi removido(a) do grupo.`, 'success');
                    fetchAndRender(viewElement); // Recarrega a lista
                } catch (error) {
                     showToast(`Erro ao remover membro: ${error.message}`, 'error');
                     target.disabled = false;
                     target.innerHTML = originalIcon; // Restaura ícone em caso de erro
                }
             });
             showModal('Confirmar Remoção', modalBody);
        }
    });

    fetchAndRender(viewElement);
}