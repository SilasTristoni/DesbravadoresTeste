// js/views/admin/manage-users.js

// A função fetchApi e showToast estão disponíveis globalmente
import { showToast as toastFunc } from '../../ui/toast.js'; // Ajuste o caminho se necessário
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

export async function renderManageUsersView(viewElement) {

  // Exibe uma mensagem de carregamento inicial
  viewElement.innerHTML = `<div class="admin-widget"><p>A carregar formulário...</p></div>`;

  try {
    // Busca a lista de grupos disponíveis na API (agora com parâmetros de paginação para obter todos)
    const groupPage = await fetchApi('/api/groups?page=0&size=999');

    const groupDetails = groupPage.content;

    const groups = groupDetails
        .map(detail => detail.group)
        .filter(group => group && group.id && group.name);

    const groupOptions = groups.map(group =>
      `<option value="${group.id}">${group.name}</option>`
    ).join('');

    // Removidos os comentários {/* ... */} daqui
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
                          <label for="user-group">Grupo (Opcional)</label>
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
                          </select>
                      </div>
                  </div>
                  <button type="submit" class="action-btn">Adicionar Utilizador</button>
              </form>
          </div>
      `;

    const userForm = viewElement.querySelector("#admin-user-form");
    userForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitButton = userForm.querySelector('button[type="submit"]');

      const groupIdValue = viewElement.querySelector("#user-group").value;
      const groupId = groupIdValue && !isNaN(parseInt(groupIdValue, 10)) ? parseInt(groupIdValue, 10) : null;
      const groupPayload = groupId !== null ? { id: groupId } : null;

      const newUser = {
        name: viewElement.querySelector("#user-name").value,
        surname: viewElement.querySelector("#user-surname").value,
        email: viewElement.querySelector("#user-email").value,
        password: viewElement.querySelector("#user-password").value,
        role: viewElement.querySelector("#user-role").value,
        group: groupPayload,
        avatar: 'img/escoteiro1.png', // Avatar padrão
        level: 1, // Nível inicial padrão
        xp: 0    // XP inicial padrão
      };

      submitButton.disabled = true;
      submitButton.textContent = 'Adicionando...';

      try {
        const createdUser = await fetchApi('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(newUser),
        });
        showToast(`Utilizador ${createdUser.name} ${createdUser.surname} adicionado com sucesso!`, 'success'); // Usa showToast
        userForm.reset();
      } catch (error) {
        console.error("Falha ao criar utilizador:", error);
        showToast(`Erro ao criar utilizador: ${error.message}`, 'error'); // Usa showToast
      } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Adicionar Utilizador';
      }
    });

  } catch (error) {
    console.error("Falha ao carregar a view de criação de utilizadores:", error);
    viewElement.innerHTML = `<div class="admin-widget"><p style="color: red;">Não foi possível carregar os grupos. ${error.message}</p></div>`;
  }
}