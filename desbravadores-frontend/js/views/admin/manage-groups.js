// js/views/admin/manage-groups.js

// Importa showToast (ajuste o caminho se necessário)
import { showToast as toastFunc } from '../../ui/toast.js';
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}
// Importa showModal (ajuste o caminho se necessário)
import { showModal } from '../../../components/modal.js';

const GROUP_PAGE_SIZE = 5; // Define o tamanho da página

/**
 * Função para renderizar os controlos de paginação
 * @param {HTMLElement} paginationContainer - O <div id="group-list-pagination">
 * @param {HTMLElement} listContainer - O <div id="group-list-container"> (para recarregar)
 * @param {object} groupPage - O objeto Page retornado da API
 */
function renderPaginationControls(paginationContainer, listContainer, groupPage) {
    paginationContainer.innerHTML = ''; // Limpa controlos antigos

    const { number, totalPages, first, last } = groupPage; 

    // Botão "Anterior"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first; 
    prevBtn.addEventListener('click', () => {
        loadGroupList(listContainer, number - 1); // Recarrega a lista
    });

    // Informação da Página
    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Página ${number + 1} de ${totalPages}`;

    // Botão "Próxima"
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Próxima <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = last; 
    nextBtn.addEventListener('click', () => {
        loadGroupList(listContainer, number + 1); // Recarrega a lista
    });

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}

/**
 * Função para carregar e renderizar a lista de grupos
 * @param {HTMLElement} container - O elemento onde a tabela será renderizada
 * @param {number} page - O número da página a carregar (0-indexado)
 */
async function loadGroupList(container, page = 0) {
  try {
    container.innerHTML = `<p>A carregar grupos...</p>`;

    const endpoint = `/api/groups?page=${page}&size=${GROUP_PAGE_SIZE}&sort=name,asc`;
    
    const groupPage = await fetchApi(endpoint);
    // A API retorna Page<GroupDetailsDTO>
    // GroupDetailsDTO tem { group: Group, members: MemberDTO[] }
    const groupDetailsList = groupPage.content;

    let tableHtml = `<p>Nenhum grupo encontrado.</p>`;

    if (groupDetailsList.length > 0) {
      tableHtml = `
        <table class="user-table">
          <thead>
            <tr>
              <th>Nome do Grupo</th>
              <th>Líder (Monitor)</th>
              <th>Nº de Membros</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${groupDetailsList.map(details => {
                const group = details.group;
                const members = details.members;
                const leaderName = group.leader ? `${group.leader.name} ${group.leader.surname}` : 'Sem líder';
                
                return `
                  <tr data-group-id="${group.id}">
                    <td>${group.name}</td>
                    <td>${leaderName}</td>
                    <td>${members.length}</td>
                    <td>
                        <button class="action-btn-small edit-group-btn" data-group-id="${group.id}">Editar</button>
                        <button class="action-btn-small delete-group-btn" data-group-id="${group.id}" data-group-name="${group.name}">Apagar</button>
                    </td>
                  </tr>
                `
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // Renderiza a tabela E o container da paginação
    container.innerHTML = `
        <div id="group-list-table-wrapper">
            ${tableHtml}
        </div>
        <div id="group-list-pagination" class="pagination-controls">
        </div>
    `;

    // Renderiza os controlos de paginação
    const paginationContainer = container.querySelector("#group-list-pagination");
    if (groupPage.totalPages > 1) {
        renderPaginationControls(paginationContainer, container, groupPage);
    } else {
        paginationContainer.remove(); // Remove o container se não for necessário
    }
    
    // Adiciona Listeners para botões de ação
    addEventListeners(container, page);

  } catch (error) {
    console.error(`Falha ao carregar lista de grupos:`, error);
    container.innerHTML = `<p style="color: red;">Não foi possível carregar a lista. ${error.message}</p>`;
  }
}

/**
 * Adiciona listeners de apagar/editar aos botões da lista
 */
function addEventListeners(container, currentPage) {
     const listContainer = document.getElementById('group-list-container');
     
     // 1. Apagar Grupo
     container.querySelectorAll('.delete-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const groupId = e.currentTarget.dataset.groupId;
            const groupName = e.currentTarget.dataset.groupName;

            const modalBody = document.createElement('div');
            modalBody.innerHTML = `<p>Tem a certeza que deseja APAGAR o grupo: "<strong>${groupName}</strong>"?</p><p>Todos os membros ficarão sem grupo.</p>`;
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirmar Exclusão';
            confirmButton.className = 'action-btn';
            confirmButton.style.marginTop = '1rem';
            
            modalBody.appendChild(confirmButton);
            
            confirmButton.onclick = async () => {
                 btn.disabled = true;
                 btn.textContent = 'Apagando...';
                 document.getElementById('closeModalBtn').click(); // Fecha o modal
                 
                try {
                    await fetchApi(`/api/groups/${groupId}`, { method: 'DELETE' });
                    showToast(`Grupo "${groupName}" apagado com sucesso!`, 'success');
                    loadGroupList(listContainer, currentPage); // Recarrega a página atual
                } catch (error) {
                    showToast(`Erro ao apagar grupo: ${error.message}`, 'error');
                    btn.disabled = false;
                    btn.textContent = 'Apagar';
                }
            };
            
            showModal('Confirmar Exclusão', modalBody);
        });
     });
     
     // 2. Editar Grupo (Abre formulário de edição)
     // TODO: Implementar a lógica de edição (similar a manage-tasks.js)
     container.querySelectorAll('.edit-group-btn').forEach(btn => {
         btn.addEventListener('click', (e) => {
             const groupId = e.currentTarget.dataset.groupId;
             showToast(`Funcionalidade "Editar Grupo" (ID: ${groupId}) ainda não implementada.`, 'info');
             // Aqui você pode implementar a lógica de edição em linha
             // ou abrir um modal de edição.
         });
     });
}

/**
 * Renderiza a view completa de Gerenciar Grupos
 */
export async function renderManageGroupsView(viewElement) {

  // Exibe uma mensagem de carregamento inicial
  viewElement.innerHTML = `<div class="admin-widget"><p>A carregar formulário...</p></div>`;

  try {
    // 1. Busca a lista de MONITORES disponíveis para serem líderes
    const monitorPage = await fetchApi('/api/admin/users/monitors?page=0&size=999');
    const monitors = monitorPage.content;
    const monitorOptions = monitors.map(monitor =>
      `<option value="${monitor.id}">${monitor.name} ${monitor.surname}</option>`
    ).join('');

    // 2. Renderiza o HTML da view
    viewElement.innerHTML = `
          <div class="admin-widget">
              <h2>Adicionar Novo Grupo</h2>
              <form id="admin-group-form" class="user-form">
                   <div class="form-group">
                       <label for="group-name">Nome do Grupo</label>
                       <input type="text" id="group-name" class="form-control" required>
                   </div>
                   <div class="form-group">
                       <label for="group-leader">Líder do Grupo (Monitor)</label>
                       <select id="group-leader" class="form-control">
                           <option value="">Sem líder</option>
                           ${monitorOptions}
                       </select>
                   </div>
                  <button type="submit" class="action-btn">Adicionar Grupo</button>
              </form>
          </div>

          <div class="admin-widget" style="margin-top: 2rem;">
              <h2>Grupos Existentes</h2>
              <div id="group-list-container">
                  </div>
          </div>
      `;

    // 3. Adiciona o listener ao formulário
    const groupForm = viewElement.querySelector("#admin-group-form");
    const groupListContainer = viewElement.querySelector("#group-list-container");
    
    groupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitButton = groupForm.querySelector('button[type="submit"]');

      const leaderIdValue = viewElement.querySelector("#group-leader").value;
      const leaderId = leaderIdValue ? parseInt(leaderIdValue, 10) : null;
      const leaderPayload = leaderId ? { id: leaderId } : null;

      const newGroup = {
        name: viewElement.querySelector("#group-name").value,
        leader: leaderPayload,
      };

      submitButton.disabled = true;
      submitButton.textContent = 'Adicionando...';

      try {
        const createdGroup = await fetchApi('/api/groups', {
          method: 'POST',
          body: JSON.stringify(newGroup),
        });
        showToast(`Grupo ${createdGroup.name} adicionado com sucesso!`, 'success'); 
        groupForm.reset();
        
        // Recarrega a lista na página 0 para mostrar o novo grupo
        await loadGroupList(groupListContainer, 0);

      } catch (error) {
        console.error("Falha ao criar grupo:", error);
        showToast(`Erro ao criar grupo: ${error.message}`, 'error'); 
      } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Adicionar Grupo';
      }
    });

    // 4. Carrega a lista inicial de Grupos (página 0)
    await loadGroupList(groupListContainer, 0);

  } catch (error) {
    console.error("Falha ao carregar a view de gestão de grupos:", error);
    viewElement.innerHTML = `<div class="admin-widget"><p style="color: red;">Não foi possível carregar os monitores. ${error.message}</p></div>`;
  }
}