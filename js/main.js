// js/main.js

// Variável global que armazenará o estado de toda a aplicação
let appState = {};

// Importações dos componentes e views
import { setupModal } from '../components/modal.js';
import { renderHomeView } from './views/home.js';
import { renderAgendaView } from './views/agenda.js';
import { renderProfileView } from './views/perfil.js';
import { renderGruposView } from './views/grupos.js';
import { renderSettingsView } from './views/settings.js';

// Mapeamento dos elementos de view no HTML
const views = {
    home: document.getElementById('view-home'),
    agenda: document.getElementById('view-agenda'),
    perfil: document.getElementById('view-perfil'),
    grupos: document.getElementById('view-grupos'),
    settings: document.getElementById('view-settings'),
};

// Mapeamento das funções que renderizam cada view
const viewRenderers = {
    home: renderHomeView,
    agenda: renderAgendaView,
    perfil: renderProfileView,
    grupos: renderGruposView,
    settings: renderSettingsView,
};

// Função central para trocar de view
async function switchView(viewId, data = null) {
    const targetView = views[viewId];
    if (!targetView) return;

    // Esconde todas as views
    for (const id in views) {
        if (views[id]) {
            views[id].classList.remove('active');
        }
    }

    // Renderiza a view alvo, passando o estado global (appState)
    if (viewRenderers[viewId]) {
        // A função de renderização pode ser async, então usamos await
        await viewRenderers[viewId](targetView, data, appState);
    }

    // Mostra a view alvo
    targetView.classList.add('active');

    // Atualiza o botão ativo na navegação
    document.querySelector('.nav-btn.active')?.classList.remove('active');
    document.querySelector(`.nav-btn[data-view="${viewId}"]`)?.classList.add('active');
}

// Função que inicia toda a aplicação
async function initializeApp() {
    try {
        // 1. Busca o estado completo do servidor APENAS UMA VEZ
        const response = await fetch('http://localhost:3000/api/state');
        if (!response.ok) {
            throw new Error(`Erro de rede! Status: ${response.status}`);
        }
        appState = await response.json();

        // 2. Configura os eventos de clique APÓS os dados serem carregados
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', () => {
                const targetView = button.dataset.view;
                const data = (targetView === 'perfil') ? appState.currentUserId : null;
                switchView(targetView, data);
            });
        });

        // Evento customizado para navegação interna (ex: clicar em um perfil num grupo)
        window.addEventListener('navigate', (e) => {
            const { view, data } = e.detail;
            switchView(view, data);
        });

        // Configura o modal global
        setupModal();
        
        // 3. Exibe a view inicial (home)
        switchView('home');

    } catch (error) {
        console.error("Falha crítica ao carregar a aplicação:", error);
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: sans-serif;"><h1>Erro de Conexão</h1><p>Não foi possível carregar os dados do servidor. Verifique se o backend está rodando e tente novamente.</p></div>`;
    }
}

// Ponto de entrada: Inicia a aplicação
initializeApp();