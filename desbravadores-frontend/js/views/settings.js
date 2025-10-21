// js/views/settings.js
import { showModal } from '../../components/modal.js';

function handleLogout() {
    if (confirm('Tem a certeza que deseja desconectar?')) {
        localStorage.removeItem('jwtToken');
        window.location.href = 'login.html';
    }
}

function openChangePasswordModal(viewElement) {
    const modalBodyContent = `
        <form id="change-password-form" class="user-form">
            <div class="form-group">
                <label for="current-password">Senha Atual</label>
                <input type="password" id="current-password" required>
            </div>
            <div class="form-group">
                <label for="new-password">Nova Senha</label>
                <input type="password" id="new-password" required>
            </div>
            <button type="submit" class="action-btn">Alterar Senha</button>
        </form>
    `;
    showModal('Alterar Senha', modalBodyContent);

    // Adiciona o listener de submit APÓS o modal ser exibido
    const form = document.getElementById('change-password-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;

        try {
            const response = await fetchApi('/api/profile/me/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            alert('Senha alterada com sucesso!');
            document.getElementById('closeModalBtn').click(); // Fecha o modal
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    });
}

export async function renderSettingsView(viewElement) {
    viewElement.innerHTML = `
        <div class="settings-container">
            <div class="settings-section">
                <h3 class="settings-section-header">Conta</h3>
                <div class="settings-list">
                    <div class="settings-item" id="change-password-btn">
                        <div class="settings-item-icon">🔑</div>
                        <div class="settings-item-label">Alterar Senha</div>
                    </div>
                    <div class="settings-item" id="logout-btn">
                        <div class="settings-item-icon">🚪</div>
                        <div class="settings-item-label">Desconectar</div>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-section-header">Aparência</h3>
                <div class="settings-list">
                    <div class="settings-item">
                        <div class="settings-item-icon">🎨</div>
                        <div class="settings-item-label">Tema Escuro</div>
                        <label class="theme-switch">
                            <input type="checkbox" id="theme-toggle">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-section-header">Sobre</h3>
                <div class="settings-list">
                    <div class="settings-item" onclick="alert('Funcionalidade em desenvolvimento!')">
                        <div class="settings-item-icon">🌐</div>
                        <div class="settings-item-label">Idioma</div>
                    </div>
                    <div class="settings-item" onclick="alert('Funcionalidade em desenvolvimento!')">
                        <div class="settings-item-icon">✉️</div>
                        <div class="settings-item-label">Contato e Suporte</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- Listeners ---
    const themeToggle = viewElement.querySelector("#theme-toggle");
    themeToggle.checked = document.body.classList.contains("dark-mode");
    themeToggle.addEventListener("change", () => {
        const isDarkMode = document.body.classList.toggle("dark-mode");
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    viewElement.querySelector('#change-password-btn').addEventListener('click', () => openChangePasswordModal(viewElement));
    viewElement.querySelector('#logout-btn').addEventListener('click', handleLogout);
}