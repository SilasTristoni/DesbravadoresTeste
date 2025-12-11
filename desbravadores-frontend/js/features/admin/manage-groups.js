// js/views/admin/manage-groups.js

// Imports Corrigidos
import { showToast as toastFunc } from '../../ui/toast.js';
import { showModal } from '../../components/modal.js';

if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

const GROUP_PAGE_SIZE = 5; 
let editingGroupId = null;

// ... (Resto do código de renderPaginationControls permanece igual) ...
function renderPaginationControls(paginationContainer, listContainer, groupPage) {
    paginationContainer.innerHTML = ''; 
    const { number, totalPages, first, last } = groupPage; 

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first; 
    prevBtn.addEventListener('click', () => loadGroupList(listContainer, number - 1));

    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Página ${number + 1} de ${totalPages}`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Próxima <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = last; 
    nextBtn.addEventListener('click', () => loadGroupList(listContainer, number + 1));

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}

// ... (Resto do código loadGroupList e renderManageGroupsView permanece inalterado) ...
// (Para economizar espaço, copie a lógica de loadGroupList e renderManageGroupsView 
//  do seu arquivo original, apenas garantindo que os imports acima estejam corretos)

async function loadGroupList(container, page = 0) {
    // ... (Copiar conteúdo da resposta anterior)
    try {
        container.innerHTML = `<p>A carregar grupos...</p>`;
        const [groupPage, monitorPage] = await Promise.all([
            fetchApi(`/api/groups?page=${page}&size=${GROUP_PAGE_SIZE}&sort=name,asc`),
            fetchApi('/api/admin/users/monitors?page=0&size=999')
        ]);
        // ... (resto da lógica de renderização) ...
        const groupDetailsList = groupPage.content;
        const monitors = monitorPage.content;
        const monitorOptionsHtml = monitors.map(monitor =>
            `<option value="${monitor.id}">${monitor.name} ${monitor.surname}</option>`
        ).join('');

        let tableHtml = `<p>Nenhum grupo encontrado.</p>`;
        if (groupDetailsList.length > 0) {
             tableHtml = `
            <table class="user-table">
              <thead>
                <tr>
                  <th>Nome do Grupo</th>
                  <th>Líder</th>
                  <th>Membros</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${groupDetailsList.map(details => {
                    const group = details.group;
                    const members = details.members;
                    const leaderName = group.leader ? `${group.leader.name} ${group.leader.surname}` : 'Sem líder';
                    
                    if (editingGroupId === group.id) {
                        return `
                            <tr class="editing-row">
                                <td colspan="4">
                                    <form class="edit-group-form" data-group-id="${group.id}">
                                        <div class="form-row">
                                            <div class="form-group"><input type="text" name="name" value="${group.name}" required></div>
                                            <div class="form-group"><select name="leader"><option value="">Sem líder</option>${monitorOptionsHtml}</select></div>
                                        </div>
                                        <div class="form-actions"><button type="submit" class="btn-action save">Salvar</button><button type="button" class="btn-action cancel cancel-edit-btn">Cancelar</button></div>
                                    </form>
                                </td>
                            </tr>`;
                    }
                    return `
                      <tr>
                        <td>${group.name}</td><td>${leaderName}</td><td>${members.length}</td>
                        <td class="actions-cell">
                            <button class="btn-action-icon edit edit-group-btn" data-group-id="${group.id}"><i class="fa-solid fa-pencil"></i></button>
                            <button class="btn-action-icon delete delete-group-btn" data-group-id="${group.id}" data-group-name="${group.name}"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                      </tr>`;
                }).join('')}
              </tbody>
            </table>`;
        }
        container.innerHTML = `<div id="group-list-table-wrapper">${tableHtml}</div><div id="group-list-pagination" class="pagination-controls"></div>`;
        
        // Listeners e Paginação (mesma lógica)
        if (groupPage.totalPages > 1) renderPaginationControls(container.querySelector("#group-list-pagination"), container, groupPage);
        addEventListeners(container, page);

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
    }
}

function addEventListeners(container, currentPage) {
    const listContainer = document.getElementById('group-list-container');
    container.querySelectorAll('.delete-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { groupId, groupName } = e.currentTarget.dataset;
            showModal('Confirmar', `<p>Apagar "${groupName}"?</p><button class="action-btn" id="confirm-del-btn">Confirmar</button>`);
            setTimeout(() => {
                document.getElementById('confirm-del-btn').onclick = async () => {
                    try {
                        await fetchApi(`/api/groups/${groupId}`, { method: 'DELETE' });
                        showToast('Grupo apagado!', 'success');
                        loadGroupList(listContainer, currentPage);
                        document.getElementById('closeModalBtn').click();
                    } catch (e) { showToast(e.message, 'error'); }
                };
            }, 100);
        });
    });
    // ... Edit listeners ...
    container.querySelectorAll('.edit-group-btn').forEach(btn => {
         btn.addEventListener('click', (e) => {
             editingGroupId = parseInt(e.currentTarget.dataset.groupId, 10);
             loadGroupList(listContainer, currentPage);
         });
     });
     container.querySelectorAll('.cancel-edit-btn').forEach(btn => {
         btn.addEventListener('click', () => {
             editingGroupId = null;
             loadGroupList(listContainer, currentPage);
         });
     });
     const editForm = container.querySelector('.edit-group-form');
     if(editForm) {
         editForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             // ... lógica de salvar (ver resposta anterior) ...
             const groupId = editForm.dataset.groupId;
             const payload = { name: editForm.elements.name.value, leader: editForm.elements.leader.value ? {id: editForm.elements.leader.value} : null };
             try {
                 await fetchApi(`/api/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(payload) });
                 showToast('Grupo salvo!', 'success');
                 editingGroupId = null;
                 loadGroupList(listContainer, currentPage);
             } catch(err) { showToast(err.message, 'error'); }
         });
     }
}

export async function renderManageGroupsView(viewElement) {
    // ... Copiar lógica de renderização inicial da resposta anterior ...
    // Apenas certifique-se de usar os imports corrigidos acima.
    viewElement.innerHTML = `<div class="admin-widget"><p>A carregar...</p></div>`;
    try {
        const monitorPage = await fetchApi('/api/admin/users/monitors?page=0&size=999');
        const monitors = monitorPage.content;
        const monitorOptions = monitors.map(m => `<option value="${m.id}">${m.name} ${m.surname}</option>`).join('');
        
        viewElement.innerHTML = `
          <div class="admin-widget"><h2>Adicionar Grupo</h2><form id="admin-group-form" class="user-form"><div class="form-group"><label>Nome</label><input type="text" id="group-name" required></div><div class="form-group"><label>Líder</label><select id="group-leader"><option value="">Sem líder</option>${monitorOptions}</select></div><button type="submit" class="action-btn">Adicionar</button></form></div>
          <div class="admin-widget" style="margin-top: 2rem;"><h2>Grupos</h2><div id="group-list-container"></div></div>`;
          
        const form = viewElement.querySelector('#admin-group-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = { name: viewElement.querySelector('#group-name').value, leader: viewElement.querySelector('#group-leader').value ? {id: viewElement.querySelector('#group-leader').value} : null };
            try {
                await fetchApi('/api/groups', { method: 'POST', body: JSON.stringify(payload) });
                showToast('Grupo criado!', 'success');
                form.reset();
                loadGroupList(viewElement.querySelector('#group-list-container'), 0);
            } catch(err) { showToast(err.message, 'error'); }
        });
        loadGroupList(viewElement.querySelector('#group-list-container'), 0);
    } catch(e) { viewElement.innerHTML = `<p>Erro: ${e.message}</p>`; }
}