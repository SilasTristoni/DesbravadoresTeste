// js/admin-main.js

import { renderDashboardView } from "../js/features/admin/dashboard.js";
import { renderChamadaView } from "../js/features/admin/chamada.js";
import { renderManageTasksView } from "../js/features/admin/manage-tasks.js";
import { renderManageUsersView } from "../js/features/admin/manage-users.js";
import { renderAdminSettingsView } from "../js/features/admin/settings.js";
import { renderManageGroupsView } from "../js/features/admin/manage-groups.js";
import { renderCreateItemView } from "../js/features/admin/create-item.js";
import { renderManageAchievementsView } from "../js/features/admin/manage-achievements.js";
import { renderProfileView } from '../js/features/app/perfil.js';
import { renderNotificationsView } from '../js/features/app/notifications.js';
import { renderManageProfileView } from '../js/features/admin/manage-profile.js'; 
import { setupModal } from '../js/components/modal.js'; 
import { showToast } from '../js/ui/toast.js';       
import { initSessionMonitor } from '../js/core/sessionManager.js'; 

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

let manageProfileDiv = document.getElementById("view-manage-profile");
if (!manageProfileDiv) {
    manageProfileDiv = document.createElement("div");
    manageProfileDiv.id = "view-manage-profile";
    manageProfileDiv.className = "view"; 
    const container = document.querySelector('.content-container');
    if(container) container.appendChild(manageProfileDiv);
}

const views = {
  dashboard: document.getElementById("view-dashboard"),
  chamada: document.getElementById("view-chamada"),
  "manage-groups": document.getElementById("view-manage-groups"),
  "manage-tasks": document.getElementById("view-manage-tasks"),
  "manage-users": document.getElementById("view-manage-users"),
  "create-item": document.getElementById("view-create-item"),
  "manage-achievements": document.getElementById("view-manage-achievements"),
  perfil: document.getElementById("view-perfil"),
  settings: document.getElementById("view-admin-settings"),
  notifications: document.getElementById("view-notifications"),
  "my-profile": document.getElementById("view-perfil"),
  "manage-profile": manageProfileDiv
};

const viewRenderers = {
  dashboard: renderDashboardView,
  chamada: renderChamadaView,
  "manage-groups": renderManageGroupsView,
  "manage-tasks": renderManageTasksView,
  "manage-users": renderManageUsersView,
  "create-item": renderCreateItemView,
  "manage-achievements": renderManageAchievementsView,
  perfil: renderProfileView,
  "my-profile": renderProfileView,
  settings: renderAdminSettingsView,
  notifications: renderNotificationsView,
  "manage-profile": renderManageProfileView 
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

    if (userRole === 'DIRETOR') {
        if (chamadaBtn) chamadaBtn.style.display = 'none';
    } else if (userRole === 'MONITOR') {
        if (manageUsersBtn) manageUsersBtn.style.display = 'none';
        if (manageGroupsBtn) manageGroupsBtn.style.display = 'none';
        if (createItemBtn) createItemBtn.style.display = 'none';
    }
}

function initializeAdminApp() {
  document.body.classList.toggle('dark-mode', localStorage.getItem('theme') === 'dark');
  adjustUiForRole();
  initSessionMonitor(); 

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const viewId = button.dataset.view;
        switchView(viewId);
    });
  });

  // Alterado: Recebe o objeto completo via 'data'
  window.addEventListener('navigate', (e) => {
    const { view, data } = e.detail;
    switchView(view, data);
  });

  setupModal();
  switchView("dashboard");
}

initializeAdminApp();
