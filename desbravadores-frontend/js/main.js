// js/main.js
import { setupModal } from '../components/modal.js';
import { renderHomeView } from './views/home.js';
import { renderAgendaView } from './views/agenda.js';
import { renderProfileView } from './views/perfil.js';
import { renderGruposView } from './views/grupos.js';
import { renderSettingsView } from './views/settings.js';
import { renderConquistasView } from './views/conquistas.js';
import { renderNotificationsView } from './views/notifications.js'; // NOVO IMPORT

const views = {
    home: document.getElementById('view-home'),
    agenda: document.getElementById('view-agenda'),
    conquistas: document.getElementById('view-conquistas'),
    perfil: document.getElementById('view-perfil'),
    grupos: document.getElementById('view-grupos'),
    notifications: document.getElementById('view-notifications'), // NOVA VIEW
    settings: document.getElementById('view-settings'),
};

const viewRenderers = {
    home: renderHomeView,
    agenda: renderAgendaView,
    conquistas: renderConquistasView,
    perfil: renderProfileView,
    grupos: renderGruposView,
    notifications: renderNotificationsView, // NOVO RENDERER
    settings: renderSettingsView,
};

function switchView(viewId, data = null) {
    const targetView = views[viewId];
    if (!targetView) return;

    for (const id in views) {
        if (views[id] !== targetView) {
            views[id].classList.remove('active');
        }
    }

    if (viewRenderers[viewId]) {
        const finalData = viewId === 'perfil' && data === undefined ? null : data;
        viewRenderers[viewId](targetView, finalData);
    }

    targetView.classList.add('active');
    
    document.querySelector('.nav-btn.active')?.classList.remove('active');
    document.querySelector(`.nav-btn[data-view="${viewId}"]`)?.classList.add('active');
}

function initializeApp() {
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetView = button.dataset.view;
            if (targetView === 'perfil') {
                 switchView(targetView); 
            } else {
                 switchView(targetView);
            }
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