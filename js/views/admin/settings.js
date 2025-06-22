// js/views/admin/settings.js

// Função para renderizar a view de configurações do admin
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
                    <div class="settings-item" onclick="alert('Funcionalidade em desenvolvimento!')">
                        <div class="settings-item-icon">🔔</div>
                        <div class="settings-item-label">Notificações</div>
                    </div>
                    <div class="settings-item" onclick="alert('Funcionalidade em desenvolvimento!')">
                        <div class="settings-item-icon">🛡️</div>
                        <div class="settings-item-label">Permissões de Usuário</div>
                    </div>
                </div>
            </div>
            <div class="settings-banner">
                <h3>Avisos do Sistema</h3>
                <p>As configurações de tema são salvas localmente e aplicadas em toda a aplicação (Login, App e Admin).</p>
            </div>
        </div>
    `;

    // --- LÓGICA DO TEMA ---
    const themeToggle = viewElement.querySelector("#adminThemeToggle");

    // Sincroniza o toggle com o estado atual do tema
    themeToggle.checked = document.body.classList.contains("dark-mode");

    // Adiciona o listener para a troca de tema
    themeToggle.addEventListener("change", () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });
}