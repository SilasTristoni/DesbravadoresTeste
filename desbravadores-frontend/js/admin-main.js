import { renderDashboardView } from "../js/views/admin/dashboard.js";
import { renderChamadaView } from "../js/views/admin/chamada.js";
import { renderManageTasksView } from "../js/views/admin/manage-tasks.js";
import { renderManageUsersView } from "../js/views/admin/manage-users.js";
import { renderAdminSettingsView } from "../js/views/admin/settings.js";
import { renderManageGroupsView } from "../js/views/admin/manage-groups.js";
import { renderProfileView } from '../js/views/perfil.js';
import { renderNotificationsView } from '../js/views/notifications.js';
import { setupModal } from '../components/modal.js'; // Caminho Absoluto
import { showToast } from '../js/ui/toast.js';       // Caminho Absoluto

window.showToast = showToast;

if (!window.handleFutureFeature) {
    window.handleFutureFeature = (featureName) => {
        showToast(`🚧 A funcionalidade "${featureName}" estará disponível na próxima versão!`, 'info');
    };
}

function getUserPayload() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        return null;
    }
}

const views = {
  dashboard: document.getElementById("view-dashboard"),
  chamada: document.getElementById("view-chamada"),
  "manage-groups": document.getElementById("view-manage-groups"),
  "manage-tasks": document.getElementById("view-manage-tasks"),
  "manage-users": document.getElementById("view-manage-users"),
  perfil: document.getElementById("view-perfil"),
  settings: document.getElementById("view-admin-settings"),
  notifications: document.getElementById("view-notifications"),
  "my-profile": document.getElementById("view-perfil"),
};

const viewRenderers = {
  dashboard: renderDashboardView,
  chamada: renderChamadaView,
  "manage-groups": renderManageGroupsView,
  "manage-tasks": renderManageTasksView,
  "manage-users": renderManageUsersView,
  perfil: renderProfileView,
  "my-profile": renderProfileView,
  settings: renderAdminSettingsView,
  notifications: renderNotificationsView,
};

function switchView(viewId, data = null) {
  for (const id in views) {
    if (views[id]) views[id].classList.remove("active");
  }

  const finalData = viewId === 'my-profile' ? null : data;
  const targetView = views[viewId];
  
  if (targetView) {
    targetView.classList.add("active");
    if (viewRenderers[viewId]) {
        viewRenderers[viewId](targetView, finalData);
    }
  }

  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  const newActiveButton = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
  if (newActiveButton) newActiveButton.classList.add("active");
}

function adjustUiForRole() {
    const payload = getUserPayload();
    if (!payload) return;
    const userRole = payload.role;

    const chamadaBtn = document.querySelector('.nav-btn[data-view="chamada"]');
    const manageGroupsBtn = document.querySelector('.nav-btn[data-view="manage-groups"]');
    const manageUsersBtn = document.querySelector('.nav-btn[data-view="manage-users"]');
    const createItemBtn = document.querySelector('.nav-btn[data-view="create-item"]');

    // MVP: OCULTAR SEMPRE O BOTÃO "CRIAR ITEM"
    if (createItemBtn) createItemBtn.style.display = 'none';

    if (userRole === 'DIRETOR') {
        if (chamadaBtn) chamadaBtn.style.display = 'none';
    } else if (userRole === 'MONITOR') {
        if (manageUsersBtn) manageUsersBtn.style.display = 'none';
        if (manageGroupsBtn) manageGroupsBtn.style.display = 'none';
    }
}

function initializeAdminApp() {
  document.body.classList.toggle('dark-mode', localStorage.getItem('theme') === 'dark');
  adjustUiForRole();

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const viewId = button.dataset.view;
        switchView(viewId);
    });
  });

  document.querySelector('.content-container').addEventListener('click', (e) => {
      if (e.target?.matches('.manage-user-btn')) {
          const userId = e.target.dataset.userId;
          switchView('perfil', userId);
      }
  });

  window.addEventListener('navigate', (e) => {
    const { view, data } = e.detail;
    switchView(view, data);
  });

  setupModal();
  switchView("dashboard");
}

initializeAdminApp();