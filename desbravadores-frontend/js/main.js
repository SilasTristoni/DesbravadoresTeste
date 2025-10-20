// js/main.js
import { setupModal } from '../components/modal.js';
import { renderHomeView } from './views/home.js';
import { renderAgendaView } from './views/agenda.js';
import { renderProfileView } from './views/perfil.js';
import { renderGruposView } from './views/grupos.js';
import { renderSettingsView } from './views/settings.js';
import { renderConquistasView } from './views/conquistas.js'; // NOVO IMPORT

const views = {
    home: document.getElementById('view-home'),
    agenda: document.getElementById('view-agenda'),
    conquistas: document.getElementById('view-conquistas'), // NOVA VIEW
    perfil: document.getElementById('view-perfil'),
    grupos: document.getElementById('view-grupos'),
    settings: document.getElementById('view-settings'),
};

const viewRenderers = {
    home: renderHomeView,
    agenda: renderAgendaView,
    conquistas: renderConquistasView, // NOVO RENDERER
    perfil: renderProfileView,
    grupos: renderGruposView,
    settings: renderSettingsView,
};

// Helper function to decode JWT payload (mantida por segurança, mas não mais usada para user ID)
function decodeToken() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')));
    } catch (e) {
        return null;
    }
}


function switchView(viewId, data = null) {
    const targetView = views[viewId];
    if (!targetView) return;

    for (const id in views) {
        if (views[id] !== targetView) {
            views[id].classList.remove('active');
        }
    }

    // Sempre renderiza a view, já que não usamos estado mockado.
    if (viewRenderers[viewId]) {
        // Para 'perfil' sem data, passamos 'null' para carregar o perfil próprio (/me)
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
                 // Passando undefined fará o switchView usar 'null' para buscar o perfil próprio
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