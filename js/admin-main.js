// js/admin-main.js
import { renderDashboardView } from "./views/admin/dashboard.js";
import { renderChamadaView } from "./views/admin/chamada.js";
import { renderManageTasksView } from "./views/admin/manage-tasks.js";
import { renderManageUsersView } from "./views/admin/manage-users.js";
// 1. IMPORTAR A NOVA FUNÇÃO DE RENDERIZAÇÃO
import { renderAdminSettingsView } from "./views/admin/settings.js";

const views = {
  dashboard: document.getElementById("view-dashboard"),
  chamada: document.getElementById("view-chamada"),
  "manage-tasks": document.getElementById("view-manage-tasks"),
  "manage-users": document.getElementById("view-manage-users"),
  // 2. ADICIONAR A NOVA VIEW AO OBJETO
  settings: document.getElementById("view-admin-settings"),
};

const viewRenderers = {
  dashboard: renderDashboardView,
  chamada: renderChamadaView,
  "manage-tasks": renderManageTasksView,
  "manage-users": renderManageUsersView,
  // 3. ADICIONAR O NOVO RENDERIZADOR AO OBJETO
  settings: renderAdminSettingsView,
};

function switchView(viewId) {
  for (const id in views) {
    views[id].classList.remove("active");
  }
  const targetView = views[viewId];
  if (targetView) {
    targetView.classList.add("active");
    // Renderiza a view apenas na primeira vez que for aberta
    if (targetView.innerHTML.trim() === "" && viewRenderers[viewId]) {
      viewRenderers[viewId](targetView);
    }
  }
  document.querySelector(".nav-btn.active")?.classList.remove("active");
  document
    .querySelector(`.nav-btn[data-view="${viewId}"]`)
    ?.classList.add("active");
}

function initializeAdminApp() {
  // --- LÓGICA PARA APLICAR TEMA NA INICIALIZAÇÃO ---
  // Verifica o tema salvo no localStorage e aplica à página
  if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
  }

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.view);
    });
  });

  switchView("dashboard");
}

initializeAdminApp();