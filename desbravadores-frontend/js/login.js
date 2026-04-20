import { buildApiUrl } from './core/url.js';

const themeToggle = document.getElementById('theme-toggle');
const loginPanel = document.getElementById('login-panel');
const resetPanel = document.getElementById('reset-panel');
const authNotice = document.getElementById('auth-notice');

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe');

const forgotPasswordTrigger = document.getElementById('forgot-password-trigger');
const backToLoginButton = document.getElementById('back-to-login');
const resetTabs = Array.from(document.querySelectorAll('.reset-tab'));
const resetRequestForm = document.getElementById('reset-request-form');
const resetConfirmForm = document.getElementById('reset-confirm-form');

function setThemeIcon(isDarkMode) {
    const icon = themeToggle.querySelector('i');
    icon.className = isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function applyTheme() {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark-mode', isDarkMode);
    setThemeIcon(isDarkMode);
}

function showNotice(message, type = 'info') {
    authNotice.hidden = false;
    authNotice.className = `auth-notice ${type}`;
    authNotice.textContent = message;
}

function clearNotice() {
    authNotice.hidden = true;
    authNotice.className = 'auth-notice';
    authNotice.textContent = '';
}

function switchPanel(panel) {
    clearNotice();
    const showReset = panel === 'reset';
    loginPanel.classList.toggle('active', !showReset);
    resetPanel.classList.toggle('active', showReset);
}

function switchResetMode(mode) {
    resetTabs.forEach((button) => {
        button.classList.toggle('active', button.dataset.resetMode === mode);
    });
    resetRequestForm.classList.toggle('active', mode === 'request');
    resetConfirmForm.classList.toggle('active', mode === 'confirm');
}

function bindPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach((button) => {
        button.addEventListener('click', () => {
            const target = document.getElementById(button.dataset.togglePassword);
            if (!target) return;

            const showing = target.getAttribute('type') === 'text';
            target.setAttribute('type', showing ? 'password' : 'text');
            button.querySelector('i').className = showing ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        });
    });
}

async function postJson(endpoint, payload) {
    const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const contentType = response.headers.get('content-type') || '';
    const payloadBody = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => '');

    if (!response.ok) {
        const message = typeof payloadBody === 'string'
            ? payloadBody
            : payloadBody?.message || 'Nao foi possivel concluir a operacao.';
        throw new Error(message);
    }

    return payloadBody;
}

themeToggle.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    setThemeIcon(isDarkMode);
});

if (localStorage.getItem('rememberedUsername')) {
    usernameInput.value = localStorage.getItem('rememberedUsername');
    rememberMeCheckbox.checked = true;
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNotice();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const loginButton = loginForm.querySelector('.login-button');

    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';

    try {
        const data = await postJson('/auth/login', { username, password });
        const token = data.token;
        localStorage.setItem('jwtToken', token);

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;

        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberedUsername', username);
        } else {
            localStorage.removeItem('rememberedUsername');
        }

        if (userRole === 'DESBRAVADOR') {
            window.location.href = 'app.html';
            return;
        }

        if (userRole === 'MONITOR' || userRole === 'DIRETOR') {
            window.location.href = 'admin.html';
            return;
        }

        throw new Error('Cargo de utilizador nao reconhecido.');
    } catch (error) {
        localStorage.removeItem('jwtToken');
        showNotice(`Falha no login: ${error.message}`, 'error');
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Entrar';
    }
});

forgotPasswordTrigger.addEventListener('click', () => {
    switchPanel('reset');
    switchResetMode('request');
    document.getElementById('reset-request-username').value = usernameInput.value.trim();
});

backToLoginButton.addEventListener('click', () => {
    switchPanel('login');
});

resetTabs.forEach((button) => {
    button.addEventListener('click', () => switchResetMode(button.dataset.resetMode));
});

resetRequestForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNotice();

    const username = document.getElementById('reset-request-username').value.trim();
    const submitButton = resetRequestForm.querySelector('.login-button');

    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
        const response = await postJson('/auth/password-resets/request', { username });
        document.getElementById('reset-confirm-username').value = username;
        switchResetMode('confirm');
        showNotice(response.message || 'Solicitacao enviada com sucesso.', 'success');
    } catch (error) {
        showNotice(error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Solicitar aprovacao';
    }
});

resetConfirmForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNotice();

    const username = document.getElementById('reset-confirm-username').value.trim();
    const resetCode = document.getElementById('reset-code').value.trim().toUpperCase();
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;
    const submitButton = resetConfirmForm.querySelector('.login-button');

    if (newPassword !== confirmPassword) {
        showNotice('A confirmacao da nova senha nao confere.', 'error');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    try {
        const response = await postJson('/auth/password-resets/confirm', { username, resetCode, newPassword });
        usernameInput.value = username;
        passwordInput.value = '';
        resetConfirmForm.reset();
        switchPanel('login');
        showNotice(response.message || 'Senha redefinida com sucesso.', 'success');
    } catch (error) {
        showNotice(error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar nova senha';
    }
});

bindPasswordToggles();
applyTheme();
