// js/admin-main.js
import { renderDashboardView } from "./views/admin/dashboard.js";
import { renderChamadaView } from "./views/admin/chamada.js";
import { renderManageTasksView } from "./views/admin/manage-tasks.js";
import { renderManageUsersView } from "./views/admin/manage-users.js";
import { renderAdminSettingsView } from "./views/admin/settings.js";
import { setupModal } from '../components/modal.js';
import { renderManageAchievementsView } from './views/admin/manage-achievements.js';
import { renderCreateItemView } from './views/admin/create-item.js';
import { renderManageGroupsView } from "./views/admin/manage-groups.js";
import { renderProfileView } from './views/perfil.js'; // Função reutilizada


function getUserPayload() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error("Erro ao decodificar o token:", error);
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
  "manage-achievements": document.getElementById("view-manage-achievements"),
  "create-item": document.getElementById("view-create-item"),
  "my-profile": document.getElementById("view-perfil"), // Adiciona o alias para o perfil próprio
};

const viewRenderers = {
  dashboard: renderDashboardView,
  chamada: renderChamadaView,
  "manage-groups": renderManageGroupsView,
  "manage-tasks": renderManageTasksView,
  "manage-users": renderManageUsersView,
  perfil: renderProfileView, // Usado para perfis de outros utilizadores (com ID)
  "my-profile": renderProfileView, // Usado para o perfil próprio (sem ID)
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

  // Se a view for "my-profile", forçamos o data a ser null
  const finalData = viewId === 'my-profile' ? null : data;
    
  const targetView = views[viewId];
  if (targetView) {
    targetView.classList.add("active");
    if (viewRenderers[viewId]) {
        viewRenderers[viewId](targetView, finalData); // Usa finalData
    }
  }

  document.querySelector(".nav-btn.active")?.classList.remove("active");
  const newActiveButton = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
  if (newActiveButton) {
    newActiveButton.classList.add("active");
  }
}

function adjustUiForRole() {
    const payload = getUserPayload();
    if (!payload) return;
    const userRole = payload.role;

    // Elementos a serem controlados
    const chamadaBtn = document.querySelector('.nav-btn[data-view="chamada"]');
    const manageGroupsBtn = document.querySelector('.nav-btn[data-view="manage-groups"]');
    const manageUsersBtn = document.querySelector('.nav-btn[data-view="manage-users"]');
    const createItemBtn = document.querySelector('.nav-btn[data-view="create-item"]');


    if (userRole === 'DIRETOR') {
        // CORREÇÃO: Diretor não pode fazer a chamada. Ele só pode gerar o Relatório (que está no Dashboard).
        if (chamadaBtn) chamadaBtn.style.display = 'none';

    } else if (userRole === 'MONITOR') {
        // Monitor faz a chamada, mas não pode gerir Grupos, Utilizadores ou Criar Items.
        if (createItemBtn) createItemBtn.style.display = 'none';
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

  // ---- "OUVINTE" DE NAVEGAÇÃO ADICIONADO AQUI ----
  // Este código fica à escuta de qualquer sinal 'navigate' e chama a função switchView.
  window.addEventListener('navigate', (e) => {
    const { view, data } = e.detail;
    switchView(view, data);
  });
  // ---- FIM DO NOVO CÓDIGO ----

  setupModal();
  switchView("dashboard");
}

initializeAdminApp();