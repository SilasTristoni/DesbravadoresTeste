import { appState } from './state.js';
import { renderHomeView } from './views/home.js';
import { renderAgendaView } from './views/agenda.js';
import { renderProfileView } from './views/perfil.js';
import { renderGruposView } from './views/grupos.js';
import { setupModal } from '../../components/modal.js';
import { renderSettingsView } from './views/settings.js';

const views = {
    home: document.getElementById('view-home'),
    agenda: document.getElementById('view-agenda'),
    perfil: document.getElementById('view-perfil'),
    grupos: document.getElementById('view-grupos'),
    settings: document.getElementById('view-settings'),
};

const viewRenderers = {
    home: renderHomeView,
    agenda: renderAgendaView,
    perfil: renderProfileView,
    grupos: renderGruposView,
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

    const isFirstRender = targetView.innerHTML.trim() === '';
    const hasNewData = data !== null;

    if (isFirstRender || hasNewData) {
        if (viewRenderers[viewId]) {
            viewRenderers[viewId](targetView, data);
        }
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
                 switchView(targetView, appState.currentUserId);
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
