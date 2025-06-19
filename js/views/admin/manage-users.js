import { appState } from "../../state.js";

export function renderManageUsersView(viewElement) {
  const { groups } = appState;

  viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Adicionar Novo Usuário</h2>
            <form id="user-form" class="user-form">
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
                <div class="form-row">
                    <div class="form-group">
                        <label for="user-rank">Patente</label>
                        <input type="text" id="user-rank" value="Lobinho" required>
                    </div>
                    <div class="form-group">
                        <label for="user-group">Patrulha</label>
                        <select id="user-group" required>
                            <option value="">Selecione uma patrulha</option>
                            ${Object.values(groups)
                              .map(
                                (group) =>
                                  `<option value="${group.id}">${group.name}</option>`
                              )
                              .join("")}
                        </select>
                    </div>
                </div>
                <button type="submit" class="action-btn">Adicionar Usuário</button>
            </form>
        </div>
    `;

  const userForm = viewElement.querySelector("#user-form");
  userForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = viewElement.querySelector("#user-name").value;
    const surname = viewElement.querySelector("#user-surname").value;
    const rank = viewElement.querySelector("#user-rank").value;
    const groupId = viewElement.querySelector("#user-group").value;

    const newUserId = `user-${Date.now()}`;

    const newUser = {
      id: newUserId,
      name,
      surname,
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face",
      birthDate: "2010-01-01",
      level: 1,
      rank,
      xp: 0,
      nextLevelXp: 100,
      groupId,
      selectedBackground: "forest",
      displayedBadges: [],
    };

    appState.users[newUserId] = newUser;

    alert(`Usuário ${name} ${surname} adicionado com sucesso!`);
    userForm.reset();
  });
}
