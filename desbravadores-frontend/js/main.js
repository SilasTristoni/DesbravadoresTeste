// CORREÇÃO: Sobe um nível (..) para achar components
import { setupModal } from '../js/components/modal.js'; 
import { renderHomeView } from '../js/features/app/home.js';
import { renderAgendaView } from '../js/features/app/agenda.js';
import { renderProfileView } from '../js/features/app/perfil.js';
import { renderGruposView } from '../js/features/app/grupos.js';
import { renderSettingsView } from '../js/features/app/settings.js';
import { renderNotificationsView } from '../js/features/app/notifications.js'; 
// CORREÇÃO: Mesmo nível (.) para achar ui dentro de js
import { showToast } from './ui/toast.js';
import { initSessionMonitor } from '../js/core/sessionManager.js'; // IMPORT NOVO

window.showToast = showToast;

window.handleFutureFeature = (featureName) => {
    showToast(`🚧 A funcionalidade "${featureName}" estará disponível na próxima versão!`, 'info');
};

const views = {
    home: document.getElementById('view-home'),
    agenda: document.getElementById('view-agenda'),
    perfil: document.getElementById('view-perfil'),
    grupos: document.getElementById('view-grupos'),
    notifications: document.getElementById('view-notifications'),
    settings: document.getElementById('view-settings'),
};

const viewRenderers = {
    home: renderHomeView,
    agenda: renderAgendaView,
    perfil: renderProfileView,
    grupos: renderGruposView,
    notifications: renderNotificationsView,
    settings: renderSettingsView,
};

function switchView(viewId, data = null) {
    const targetView = views[viewId];
    if (!targetView) return;

    for (const id in views) {
        views[id].classList.remove('active');
    }

    if (viewRenderers[viewId]) {
        const finalData = viewId === 'perfil' && data === undefined ? null : data;
        viewRenderers[viewId](targetView, finalData);
    }

    targetView.classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[data-view="${viewId}"]`)?.classList.add('active');
}

function initializeApp() {
    // Inicia monitoramento de sessão
    initSessionMonitor(); // CHAMADA NOVA

    // MVP: Oculta Conquistas
    const conquistasBtn = document.querySelector('.nav-btn[data-view="conquistas"]');
    if (conquistasBtn) conquistasBtn.style.display = 'none';

    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetView = button.dataset.view;
            switchView(targetView);
        });
    });

    window.addEventListener('navigate', (e) => {
        const { view, data } = e.detail;
        switchView(view, data);
    });

    setupModal();
    switchView('home');
}

initializeApp();