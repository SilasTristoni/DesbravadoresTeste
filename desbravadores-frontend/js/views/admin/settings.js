// js/views/admin/settings.js

// Importa showToast (CORRIGIDO: ../../ui/toast.js)
import { showToast as toastFunc } from '../../ui/toast.js';
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

export function renderAdminSettingsView(viewElement) {
    viewElement.innerHTML = `
        <div class="settings-container">
            <div class="admin-widget">
                <h2>Configurações do Painel</h2>
                <div class="settings-list">
                    <div class="settings-item">
                        <div class="settings-item-icon">🎨</div>
                        <div class="settings-item-label">Tema Escuro</div>
                        <label class="theme-switch">
                            <input type="checkbox" id="adminThemeToggle">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="settings-item" id="admin-notifs-btn">
                        <div class="settings-item-icon">🔔</div>
                        <div class="settings-item-label">Notificações</div>
                    </div>
                    <div class="settings-item" id="admin-perms-btn">
                        <div class="settings-item-icon">🛡️</div>
                        <div class="settings-item-label">Permissões de Usuário</div>
                    </div>
                </div>
            </div>
            <div class="settings-banner">
                <h3>Avisos do Sistema</h3>
                <p>As configurações de tema são salvas localmente e aplicadas em toda a aplicação.</p>
            </div>
        </div>
    `;

    const themeToggle = viewElement.querySelector("#adminThemeToggle");
    themeToggle.checked = document.body.classList.contains("dark-mode");
    themeToggle.addEventListener("change", () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    // MVP: Avisos de futuro
    viewElement.querySelector('#admin-notifs-btn').addEventListener('click', () => {
        if(window.handleFutureFeature) window.handleFutureFeature('Configuração de Notificações');
    });
    viewElement.querySelector('#admin-perms-btn').addEventListener('click', () => {
        if(window.handleFutureFeature) window.handleFutureFeature('Gestão Avançada de Permissões');
    });
}
