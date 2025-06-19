import { renderDashboardView } from "./views/admin/dashboard.js";
import { renderManageTasksView } from "./views/admin/manage-tasks.js";
import { renderManageUsersView } from "./views/admin/manage-users.js";

const views = {
  dashboard: document.getElementById("view-dashboard"),
  "manage-tasks": document.getElementById("view-manage-tasks"),
  "manage-users": document.getElementById("view-manage-users"),
};

const viewRenderers = {
  dashboard: renderDashboardView,
  "manage-tasks": renderManageTasksView,
  "manage-users": renderManageUsersView,
};

function switchView(viewId) {
  for (const id in views) {
    views[id].classList.remove("active");
  }
  const targetView = views[viewId];
  if (targetView) {
    targetView.classList.add("active");
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
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.view);
    });
  });

  switchView("dashboard");
}

initializeAdminApp();
