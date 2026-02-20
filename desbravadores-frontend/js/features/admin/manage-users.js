// js/views/admin/manage-users.js

// A função fetchApi e showToast estão disponíveis globalmente
import { showToast as toastFunc } from '../../ui/toast.js';
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

// Define o tamanho da página
const USER_LIST_PAGE_SIZE = 5; 

/**
 * Função para renderizar os controlos de paginação
 */
function renderPaginationControls(paginationContainer, listContainer, userPage, role) {
    paginationContainer.innerHTML = ''; // Limpa controlos antigos

    // --- CORREÇÃO: Lê os dados do Spring Boot antigo E do novo ---
    const totalPages = userPage.totalPages ?? userPage.page?.totalPages ?? 1;
    const number = userPage.number ?? userPage.page?.number ?? 0;
    const first = userPage.first ?? (number === 0);
    const last = userPage.last ?? (number === totalPages - 1);

    // Botão "Anterior"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first; 
    prevBtn.addEventListener('click', () => {
        loadList(listContainer, role, number - 1); 
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
        loadList(listContainer, role, number + 1); 
    });

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}


/**
 * Função ÚNICA para carregar listas (Desbravador, Monitor ou Diretor)
 */
async function loadList(container, role, page = 0) {
  try {
    if (!container) {
        console.error("Container da lista de utilizadores não foi encontrado.");
        return;
    }

    let roleLabel = '';
    if (role === 'DESBRAVADOR') roleLabel = 'desbravadores';
    else if (role === 'MONITOR') roleLabel = 'monitores';
    else roleLabel = 'diretores';

    container.innerHTML = `<p>A carregar ${roleLabel}...</p>`;

    // Define o endpoint e os cabeçalhos da tabela com base no cargo
    let endpoint = '';
    let groupColumnHeader = '';

    if (role === 'DESBRAVADOR') {
        endpoint = `/api/admin/users?page=${page}&size=${USER_LIST_PAGE_SIZE}&sort=name,asc`;
        groupColumnHeader = 'Grupo';
    } else if (role === 'MONITOR') {
        endpoint = `/api/admin/users/monitors?page=${page}&size=${USER_LIST_PAGE_SIZE}&sort=name,asc`;
        groupColumnHeader = 'Grupo (Liderado)';
    } else { // 'DIRETOR'
        endpoint = `/api/admin/users/directors?page=${page}&size=${USER_LIST_PAGE_SIZE}&sort=name,asc`;
        groupColumnHeader = 'Cargo Administrativo';
    }

    const userPage = await fetchApi(endpoint);
    const users = userPage.content;

    let tableHtml = `<p>Nenhum utilizador (${role}) encontrado.</p>`;

    if (users.length > 0) {
      tableHtml = `
        <table class="user-table">
          <thead>
            <tr>
              <th>Utilizador</th>
              <th>Email</th>
              <th>${groupColumnHeader}</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => {
                let groupDisplay = 'Sem grupo'; 
                
                if (user.role === 'DIRETOR') {
                    groupDisplay = '<span class="badge-admin" style="background-color: #e74c3c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">Admin Geral</span>';
                } 
                else if (user.groupName) {
                    groupDisplay = user.groupName;
                } 
                else if (user.group && user.group.name) {
                    groupDisplay = user.group.name;
                }

                return `
                  <tr>
                    <td>
                      <div class="user-info-cell">
                        <img src="${user.avatar || 'assets/images/escoteiro1.png'}" alt="Avatar" class="avatar-img-small">
                        <span>${user.name} ${user.surname}</span>
                      </div>
                    </td>
                    <td>${user.email}</td>
                    <td>${groupDisplay}</td>
                  </tr>
                `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    container.innerHTML = `
        <div id="user-list-table-wrapper">
            ${tableHtml}
        </div>
        <div id="user-list-pagination" class="pagination-controls">
            </div>
    `;

    // --- CORREÇÃO: Verifica totalPages com suporte para Spring Boot 3+ ---
    const paginationContainer = container.querySelector("#user-list-pagination");
    const totalPagesSafe = userPage.totalPages ?? userPage.page?.totalPages ?? 1;
    
    if (totalPagesSafe > 1) {
        renderPaginationControls(paginationContainer, container, userPage, role);
    } else {
        paginationContainer.remove(); 
    }

  } catch (error) {
    console.error(`Falha ao carregar lista de ${role}:`, error);
    container.innerHTML = `<p style="color: red;">Não foi possível carregar a lista. ${error.message}</p>`;
  }
}


export async function renderManageUsersView(viewElement) {

  viewElement.innerHTML = `<div class="admin-widget"><p>A carregar formulário...</p></div>`;

  try {
    const groupPage = await fetchApi('/api/groups?page=0&size=999');
    const groupDetails = groupPage.content;
    const groups = groupDetails
        .map(detail => detail.group)
        .filter(group => group && group.id && group.name);
    const groupOptions = groups.map(group =>
      `<option value="${group.id}">${group.name}</option>`
    ).join('');

    viewElement.innerHTML = `
          <div class="admin-widget">
              <h2>Adicionar Novo Utilizador</h2>
              <form id="admin-user-form" class="user-form">
                   <div class="form-row">
                      <div class="form-group">
                          <label for="user-name">Nome</label>
                          <input type="text" id="user-name" required>
                      </div>
                      <div class="form-group">
                          <label for="user-surname">Sobrenome</label>
                          <input type="text" id="user-surname" required>
                      </div>
                  </div>
                  <div class="form-group">
                      <label for="user-email">Email</label>
                      <input type="email" id="user-email" required>
                  </div>
                  <div class="form-group">
                      <label for="user-password">Senha</label>
                      <input type="password" id="user-password" required>
                  </div>
                  <div class="form-row">
                      <div class="form-group">
                          <label for="user-group">Grupo</label>
                          <select id="user-group">
                              <option value="">Sem grupo</option>
                              ${groupOptions}
                          </select>
                      </div>
                      <div class="form-group">
                          <label for="user-role">Cargo</label>
                          <select id="user-role" required>
                              <option value="">Selecione um cargo...</option>
                              <option value="DESBRAVADOR">Desbravador (Aluno)</option>
                              <option value="MONITOR">Monitor</option>
                              <option value="DIRETOR">Diretor (Admin)</option>
                          </select>
                      </div>
                  </div>
                  <button type="submit" class="action-btn">Adicionar Utilizador</button>
              </form>
          </div>

          <div class="admin-widget">
              <div class="view-toggle-buttons">
                  <button id="view-desbravadores-btn" class="view-toggle-btn active" data-role="DESBRAVADOR">Desbravadores</button>
                  <button id="view-monitores-btn" class="view-toggle-btn" data-role="MONITOR">Monitores</button>
                  <button id="view-diretores-btn" class="view-toggle-btn" data-role="DIRETOR">Diretores</button>
              </div>
              
              <div id="user-list-container">
                  </div>
          </div>
      `;

    const userForm = viewElement.querySelector("#admin-user-form");
    const userListContainer = viewElement.querySelector("#user-list-container");
    const roleSelect = viewElement.querySelector("#user-role");
    const groupSelect = viewElement.querySelector("#user-group");
    
    roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'DIRETOR') {
            groupSelect.value = ""; 
            groupSelect.disabled = true; 
        } else {
            groupSelect.disabled = false; 
        }
    });

    const desbravadoresBtn = viewElement.querySelector("#view-desbravadores-btn");
    const monitoresBtn = viewElement.querySelector("#view-monitores-btn");
    const diretoresBtn = viewElement.querySelector("#view-diretores-btn");

    function setActiveTab(btn, role) {
        [desbravadoresBtn, monitoresBtn, diretoresBtn].forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadList(userListContainer, role, 0);
    }

    desbravadoresBtn.addEventListener('click', () => setActiveTab(desbravadoresBtn, 'DESBRAVADOR'));
    monitoresBtn.addEventListener('click', () => setActiveTab(monitoresBtn, 'MONITOR'));
    diretoresBtn.addEventListener('click', () => setActiveTab(diretoresBtn, 'DIRETOR'));

    userForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitButton = userForm.querySelector('button[type="submit"]');
      
      const role = roleSelect.value;
      const groupIdValue = groupSelect.value;
      
      const groupId = (role !== 'DIRETOR' && groupIdValue && !isNaN(parseInt(groupIdValue, 10))) 
          ? parseInt(groupIdValue, 10) 
          : null;
      
      const groupPayload = groupId !== null ? { id: groupId } : null;

      const newUser = {
        name: viewElement.querySelector("#user-name").value,
        surname: viewElement.querySelector("#user-surname").value,
        email: viewElement.querySelector("#user-email").value,
        password: viewElement.querySelector("#user-password").value,
        role: role,
        group: groupPayload,
        avatar: 'assets/images/escoteiro1.png',
        level: 1,
        xp: 0    
      };

      submitButton.disabled = true;
      submitButton.textContent = 'Adicionando...';

      try {
        const createdUser = await fetchApi('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(newUser),
        });
        showToast(`Utilizador ${createdUser.name} adicionado com sucesso!`, 'success'); 
        userForm.reset();
        
        groupSelect.disabled = false;

        if (createdUser.role === 'DESBRAVADOR') {
            setActiveTab(desbravadoresBtn, 'DESBRAVADOR');
        } else if (createdUser.role === 'MONITOR') {
            setActiveTab(monitoresBtn, 'MONITOR');
        } else if (createdUser.role === 'DIRETOR') {
            setActiveTab(diretoresBtn, 'DIRETOR');
        }

      } catch (error) {
        console.error("Falha ao criar utilizador:", error);
        showToast(`Erro ao criar utilizador: ${error.message}`, 'error'); 
      } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Adicionar Utilizador';
      }
    });

    await loadList(userListContainer, 'DESBRAVADOR', 0);

  } catch (error) {
    console.error("Falha ao carregar a view de criação de utilizadores:", error);
    viewElement.innerHTML = `<div class="admin-widget"><p style="color: red;">Não foi possível carregar os grupos. ${error.message}</p></div>`;
  }
}