
// js/views/settings.js
import { showModal } from '../../components/modal.js';
import { showToast as toastFunc } from '../ui/toast.js';
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

// Função auxiliar para criar corpo do modal de confirmação
function createConfirmationModalBody(message, confirmCallback) {
    const container = document.createElement('div');
    container.innerHTML = `<p>${message}</p>`;
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirmar';
    confirmButton.className = 'action-btn';
    confirmButton.style.marginTop = '1rem';
    confirmButton.onclick = () => {
        confirmCallback();
        document.getElementById('closeModalBtn').click();
    };
    container.appendChild(confirmButton);
    return container;
}

function handleLogout() {
    const modalBody = createConfirmationModalBody('Tem a certeza que deseja desconectar?', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = 'login.html';
    });
    showModal('Confirmar Desconexão', modalBody);
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

    // Pequeno hack para garantir que o listener não seja duplicado se abrir o modal várias vezes
    // (Poderia ser melhorado com delegação de eventos, mas funciona bem para o MVP)
    setTimeout(() => {
        const form = document.getElementById('change-password-form');
        if(form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const submitButton = form.querySelector('button[type="submit"]');

                submitButton.disabled = true;
                submitButton.textContent = 'Alterando...';

                try {
                    await fetchApi('/api/profile/me/change-password', {
                        method: 'POST',
                        body: JSON.stringify({ currentPassword, newPassword })
                    });
                    showToast('Senha alterada com sucesso!', 'success');
                    document.getElementById('closeModalBtn').click();
                } catch (error) {
                    showToast(`Erro: ${error.message}`, 'error');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Alterar Senha';
                }
            });
        }
    }, 100);
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
                    <div class="settings-item" id="settings-language-btn">
                        <div class="settings-item-icon">🌐</div>
                        <div class="settings-item-label">Idioma</div>
                    </div>
                    <div class="settings-item" id="settings-support-btn">
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

    // --- Tratamento de Funcionalidades Futuras (MVP) ---
    viewElement.querySelector('#settings-language-btn').addEventListener('click', () => {
        if (window.handleFutureFeature) {
            window.handleFutureFeature('Mudar Idioma');
        } else {
            showToast('Funcionalidade em breve!', 'info');
        }
    });
    
    viewElement.querySelector('#settings-support-btn').addEventListener('click', () => {
         if (window.handleFutureFeature) {
            window.handleFutureFeature('Contato e Suporte');
        } else {
            showToast('Funcionalidade em breve!', 'info');
        }
    });
}