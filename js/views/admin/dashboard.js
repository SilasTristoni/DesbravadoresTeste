// js/views/admin/dashboard.js
import { appState } from "../../state.js";

export function renderDashboardView(viewElement) {
  const { users, groups } = appState;
  const scouts = Object.values(users).filter(
    (user) => user.rank !== "Chefe de Seção"
  );

  viewElement.innerHTML = `
    <div class="admin-widget">
      <h2>Visão Geral dos Usuários</h2>
      <table class="user-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Patrulha</th>
            <th>Patente</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="user-list-body"></tbody>
      </table>
    </div>
  `;

  const tableBody = viewElement.querySelector("#user-list-body");
  if (!tableBody) return;
  
  scouts.forEach((user) => {
    const userGroup = user.groupId ? groups[user.groupId] : null;
    const groupName = userGroup ? userGroup.name : "Sem Patrulha";

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>
            <div class="user-info-cell">
                <img src="${user.avatar}" alt="Avatar" class="avatar-img-small" />
                <span>${user.name} ${user.surname}</span>
            </div>
        </td>
        <td>${groupName}</td>
        <td>${user.rank}</td>
        <td>
            <button class="action-btn manage-user-btn" data-user-id="${user.id}">Gerenciar</button>
        </td>
    `;
    tableBody.appendChild(row);
  });
}