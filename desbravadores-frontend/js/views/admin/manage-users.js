// js/views/admin/manage-users.js

// A função fetchApi estará disponível globalmente pois foi carregada no admin.html

export async function renderManageUsersView(viewElement) {
  
  // Exibe uma mensagem de carregamento inicial
  viewElement.innerHTML = `<div class="admin-widget"><p>A carregar formulário...</p></div>`;

  try {
    // Busca a lista de grupos disponíveis na API (agora com parâmetros de paginação para obter todos)
    const groupPage = await fetchApi('/api/groups?page=0&size=999'); 

    // CORREÇÃO CRÍTICA: Extrai o array de grupos da propriedade '.content'
    const groupDetails = groupPage.content;

    // Mapeia para extrair o objeto Group de dentro do GroupDetailsDTO (lógica original preservada)
    const groups = groupDetails
        .map(detail => detail.group)
        .filter(group => group && group.id && group.name);


    // Constrói as opções do seletor de grupos dinamicamente
    const groupOptions = groups.map(group => 
      `<option value="${group.id}">${group.name}</option>`
    ).join('');

    // Renderiza o formulário completo com o seletor de grupos
    viewElement.innerHTML = `
          <div class="admin-widget">
              <h2>Adicionar Novo Utilizador (Admin)</h2>
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
                      <label for="user-password">Senha Provisória</label>
                      <input type="password" id="user-password" required>
                  </div>
                  <div class="form-row">
                      <div class="form-group">
                          <label for="user-group">Grupo (Patente)</label>
                          <select id="user-group" required>
                              <option value="">Selecione um grupo...</option>
                              ${groupOptions}
                          </select>
                      </div>
                      <div class="form-group">
                          <label for="user-role">Cargo</label>
                          <select id="user-role" required>
                              <option value="">Selecione um cargo...</option>
                              <option value="DESBRAVADOR">Desbravador (Aluno)</option>
                              <option value="MONITOR">Monitor</option>
                              </select>
                      </div>
                  </div>
                  <button type="submit" class="action-btn">Adicionar Utilizador</button>
              </form>
          </div>
      `;

    // Adiciona o listener de submissão ao formulário
    const userForm = viewElement.querySelector("#admin-user-form");
    userForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const groupIdValue = viewElement.querySelector("#user-group").value;

      // Trata a string vazia ("") como null e garante que o ID é um número
      const groupId = groupIdValue && !isNaN(parseInt(groupIdValue, 10)) ? parseInt(groupIdValue, 10) : null;
      
      // O objeto group deve ser { id: <id> } se o ID for válido, ou null
      const groupPayload = groupId !== null ? { id: groupId } : null; 

      const newUser = {
        name: viewElement.querySelector("#user-name").value,
        surname: viewElement.querySelector("#user-surname").value,
        email: viewElement.querySelector("#user-email").value,
        password: viewElement.querySelector("#user-password").value,
        role: viewElement.querySelector("#user-role").value,
        group: groupPayload, 
        avatar: 'img/escoteiro1.png',
        level: 1,
        xp: 0
      };

      try {
        const createdUser = await fetchApi('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(newUser),
        });
        alert(`Utilizador ${createdUser.name} ${createdUser.surname} adicionado com sucesso ao grupo!`);
        userForm.reset();
      } catch (error) {
        console.error("Falha ao criar utilizador:", error);
        alert(`Erro ao criar utilizador: ${error.message}`);
      }
    });

  } catch (error) {
    console.error("Falha ao carregar a view de criação de utilizadores:", error);
    viewElement.innerHTML = `<div class="admin-widget"><p style="color: red;">Não foi possível carregar os grupos. ${error.message}</p></div>`;
  }
}