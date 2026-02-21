// js/features/admin/manage-groups.js

import { showToast as toastFunc } from '../../ui/toast.js';
import { showModal } from '../../components/modal.js';

if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

const GROUP_PAGE_SIZE = 5; 
let editingGroupId = null;

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

async function loadGroupList(container, page = 0) {
    try {
        container.innerHTML = `<p>A carregar grupos...</p>`;
        const [groupPage, monitorPage] = await Promise.all([
            fetchApi(`/api/groups?page=${page}&size=${GROUP_PAGE_SIZE}&sort=name,asc`),
            fetchApi('/api/admin/users/monitors?page=0&size=999')
        ]);
        
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
                                    <form class="edit-group-form" data-group-id="${group.id}" novalidate>
                                        <div class="form-row">
                                            <div class="form-group"><input type="text" name="name" value="${group.name}" placeholder="Nome do Grupo *" required></div>
                                            <div class="form-group"><select name="leader"><option value="">Sem líder</option>${monitorOptionsHtml}</select></div>
                                        </div>
                                        <div class="form-actions"><button type="submit" class="btn-action save"><i class="fa-solid fa-check"></i> Salvar</button><button type="button" class="btn-action cancel cancel-edit-btn"><i class="fa-solid fa-times"></i> Cancelar</button></div>
                                    </form>
                                </td>
                            </tr>`;
                    }
                    return `
                      <tr>
                        <td>${group.name}</td><td>${leaderName}</td><td>${members.length}</td>
                        <td class="actions-cell">
                            <button class="btn-action-icon edit edit-group-btn" data-group-id="${group.id}" title="Editar"><i class="fa-solid fa-pencil"></i></button>
                            <button class="btn-action-icon delete delete-group-btn" data-group-id="${group.id}" data-group-name="${group.name}" title="Apagar"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                      </tr>`;
                }).join('')}
              </tbody>
            </table>`;
        }
        container.innerHTML = `<div id="group-list-table-wrapper">${tableHtml}</div><div id="group-list-pagination" class="pagination-controls" style="margin-top:1rem;"></div>`;
        
        const totalPagesSafe = groupPage.totalPages ?? groupPage.page?.totalPages ?? 1;
        if (totalPagesSafe > 1) {
            renderPaginationControls(container.querySelector("#group-list-pagination"), container, groupPage);
        }
        addEventListeners(container, page);

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
    }
}

function addEventListeners(container, currentPage) {
    const listContainer = document.getElementById('group-list-container');
    
    // Deletar Grupo
    container.querySelectorAll('.delete-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { groupId, groupName } = e.currentTarget.dataset;
            showModal('Confirmar Exclusão', `<p>Tem a certeza que deseja apagar o grupo "${groupName}"?</p><button class="action-btn" id="confirm-del-btn" style="margin-top:1rem;">Confirmar</button>`);
            
            setTimeout(() => {
                document.getElementById('confirm-del-btn').onclick = async () => {
                    const confirmBtn = document.getElementById('confirm-del-btn');
                    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    confirmBtn.disabled = true;

                    try {
                        await fetchApi(`/api/groups/${groupId}`, { method: 'DELETE' });
                        window.showToast('Grupo apagado com sucesso!', 'success');
                        loadGroupList(listContainer, currentPage);
                        document.getElementById('closeModalBtn').click();
                    } catch (e) { 
                        // REGRA 3: Extrator de erros
                        let finalErrorMsg = "Erro ao apagar grupo.";
                        try {
                            const parsedError = JSON.parse(e.message);
                            if (parsedError && parsedError.message) finalErrorMsg = parsedError.message;
                        } catch (parseEx) {
                            finalErrorMsg = e.message || finalErrorMsg;
                        }
                        window.showToast(finalErrorMsg, 'error'); 
                        confirmBtn.innerHTML = 'Confirmar';
                        confirmBtn.disabled = false;
                    }
                };
            }, 100);
        });
    });
    
    // Iniciar Edição
    container.querySelectorAll('.edit-group-btn').forEach(btn => {
         btn.addEventListener('click', (e) => {
             editingGroupId = parseInt(e.currentTarget.dataset.groupId, 10);
             loadGroupList(listContainer, currentPage);
         });
     });
     
     // Cancelar Edição
     container.querySelectorAll('.cancel-edit-btn').forEach(btn => {
         btn.addEventListener('click', () => {
             editingGroupId = null;
             loadGroupList(listContainer, currentPage);
         });
     });
     
     // Salvar Edição In-Place
     const editForm = container.querySelector('.edit-group-form');
     if(editForm) {
         editForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             const groupId = editForm.dataset.groupId;
             const submitBtn = editForm.querySelector('.save');
             const nameInput = editForm.elements.name.value.trim();

             // REGRA 2: Validação Manual
             if (!nameInput) {
                 return window.showToast('O Nome do Grupo é obrigatório!', 'error');
             }

             const payload = { 
                 name: nameInput, 
                 leader: editForm.elements.leader.value ? {id: editForm.elements.leader.value} : null 
             };

             const originalText = submitBtn.innerHTML;
             submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
             submitBtn.disabled = true;

             try {
                 await fetchApi(`/api/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(payload) });
                 window.showToast('Grupo atualizado com sucesso!', 'success');
                 editingGroupId = null;
                 loadGroupList(listContainer, currentPage);
             } catch(err) { 
                 // REGRA 3: Extrator de Erros
                 let finalErrorMsg = "Erro ao salvar grupo.";
                 try {
                     const parsedError = JSON.parse(err.message);
                     if (parsedError && parsedError.message) finalErrorMsg = parsedError.message;
                 } catch (parseEx) {
                     finalErrorMsg = err.message || finalErrorMsg;
                 }
                 window.showToast(finalErrorMsg, 'error'); 
                 submitBtn.innerHTML = originalText;
                 submitBtn.disabled = false;
             }
         });
     }
}

export async function renderManageGroupsView(viewElement) {
    viewElement.innerHTML = `<div class="admin-widget"><p>A carregar...</p></div>`;
    try {
        const monitorPage = await fetchApi('/api/admin/users/monitors?page=0&size=999');
        const monitors = monitorPage.content;
        const monitorOptions = monitors.map(m => `<option value="${m.id}">${m.name} ${m.surname}</option>`).join('');
        
        viewElement.innerHTML = `
          <div class="admin-widget">
            <h2>Adicionar Grupo</h2>
            <form id="admin-group-form" class="user-form" novalidate>
                <div class="form-group"><label>Nome</label><input type="text" id="group-name" placeholder="Ex: Panteras" required></div>
                <div class="form-group"><label>Líder</label><select id="group-leader"><option value="">Sem líder</option>${monitorOptions}</select></div>
                <button type="submit" class="action-btn">Adicionar Grupo</button>
            </form>
          </div>
          <div class="admin-widget" style="margin-top: 2rem;">
            <h2>Grupos Existentes</h2>
            <div id="group-list-container"></div>
          </div>`;
          
        const form = viewElement.querySelector('#admin-group-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nameInput = viewElement.querySelector('#group-name').value.trim();
            const submitBtn = form.querySelector('button[type="submit"]');

            // REGRA 2: Validação Manual
            if (!nameInput) {
                return window.showToast('Por favor, insira o Nome do Grupo!', 'error');
            }

            const payload = { 
                name: nameInput, 
                leader: viewElement.querySelector('#group-leader').value ? {id: viewElement.querySelector('#group-leader').value} : null 
            };

            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adicionando...';
            submitBtn.disabled = true;

            try {
                await fetchApi('/api/groups', { method: 'POST', body: JSON.stringify(payload) });
                window.showToast('Grupo criado com sucesso!', 'success');
                form.reset();
                loadGroupList(viewElement.querySelector('#group-list-container'), 0);
            } catch(err) { 
                // REGRA 3: Extrator de Erros
                let finalErrorMsg = "Falha ao criar o grupo.";
                try {
                    const parsedError = JSON.parse(err.message);
                    if (parsedError && parsedError.message) finalErrorMsg = parsedError.message;
                } catch (parseEx) {
                    finalErrorMsg = err.message || finalErrorMsg;
                }
                window.showToast(finalErrorMsg, 'error'); 
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        loadGroupList(viewElement.querySelector('#group-list-container'), 0);
    } catch(e) { 
        viewElement.innerHTML = `<p>Erro: ${e.message}</p>`; 
    }
}