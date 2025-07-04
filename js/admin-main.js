// js/admin-main.js
import { renderDashboardView } from "./views/admin/dashboard.js";
import { renderChamadaView } from "./views/admin/chamada.js";
import { renderManageTasksView } from "./views/admin/manage-tasks.js";
import { renderManageUsersView } from "./views/admin/manage-users.js";
import { renderAdminSettingsView } from "./views/admin/settings.js";
import { appState } from './state.js';
import { setupModal } from '../components/modal.js';
import { renderManageAchievementsView } from './views/admin/manage-achievements.js';
import { renderCreateItemView } from './views/admin/create-item.js';
// 1. IMPORTA O COMPONENTE DE PERFIL PADRÃO
import { renderProfileView } from './views/perfil.js';

const views = {
  dashboard: document.getElementById("view-dashboard"),
  chamada: document.getElementById("view-chamada"),
  "manage-tasks": document.getElementById("view-manage-tasks"),
  "manage-users": document.getElementById("view-manage-users"),
  perfil: document.getElementById("view-perfil"),
  settings: document.getElementById("view-admin-settings"),
  "manage-achievements": document.getElementById("view-manage-achievements"),
  "create-item": document.getElementById("view-create-item"),
};

const viewRenderers = {
  dashboard: renderDashboardView,
  chamada: renderChamadaView,
  "manage-tasks": renderManageTasksView,
  "manage-users": renderManageUsersView,
  // 2. USA O RENDERIZADOR DE PERFIL PADRÃO
  perfil: renderProfileView,
  settings: renderAdminSettingsView,
  "manage-achievements": renderManageAchievementsView,
  "create-item": renderCreateItemView,
};

function switchView(viewId, data = null) {
  for (const id in views) {
    if (views[id]) {
        views[id].classList.remove("active");
    }
  }

  const targetView = views[viewId];
  if (targetView) {
    targetView.classList.add("active");

    if (viewRenderers[viewId]) {
        viewRenderers[viewId](targetView, data);
    }
  }

  const activeButton = document.querySelector(".nav-btn.active");
  if (activeButton) {
      activeButton.classList.remove("active");
  }

  const newActiveButton = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
  if (newActiveButton) {
      newActiveButton.classList.add("active");
  }
}

function initializeAdminApp() {
  if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
  }

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const viewId = button.dataset.view;
        // 3. PASSA O ID DO ADMIN AO CHAMAR A VIEW DE PERFIL
        if (viewId === 'perfil') {
            switchView('perfil', 'user-admin');
        } else {
            switchView(viewId);
        }
    });
  });

  document.querySelector('.content-container').addEventListener('click', (e) => {
      if (e.target && e.target.matches('.manage-user-btn')) {
          const userId = e.target.dataset.userId;
          switchView('manage-achievements', userId);
      }
  });

  setupModal();
  switchView("dashboard");
}

initializeAdminApp();