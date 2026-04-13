import { buildApiUrl } from './core/url.js';

const themeToggle = document.getElementById('theme-toggle');

function applyTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
    }
}

themeToggle.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
});

const passwordInput = document.getElementById('password');
const togglePasswordButton = document.querySelector('.toggle-password');

togglePasswordButton.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordButton.textContent = type === 'password' ? '👁️' : '🙈';
});

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const rememberMeCheckbox = document.getElementById('rememberMe');

if (localStorage.getItem('rememberedUsername')) {
    usernameInput.value = localStorage.getItem('rememberedUsername');
    rememberMeCheckbox.checked = true;
}

loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const loginButton = document.querySelector('.login-button');

    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';

    fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, password: password }),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || 'Identificador ou senha inválidos')
            });
        }
        return response.json();
    })
    .then(data => {
        const token = data.token;
        localStorage.setItem('jwtToken', token);

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;

        if (userRole === 'DESBRAVADOR') {
            window.location.href = 'app.html';
        } else if (userRole === 'MONITOR' || userRole === 'DIRETOR') {
            window.location.href = 'admin.html';
        } else {
            alert('Cargo de usuário não reconhecido.');
            window.location.href = 'login.html';
        }

        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberedUsername', username);
        } else {
            localStorage.removeItem('rememberedUsername');
        }
    })
    .catch((error) => {
        console.error('Erro no login:', error);
        alert(`Falha no login: ${error.message}`);
        localStorage.removeItem('jwtToken');
    })
    .finally(() => {
        loginButton.disabled = false;
        loginButton.textContent = 'Entrar';
    });
});

const forgotPasswordLink = document.querySelector('.forgot-password');

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (event) => {
        event.preventDefault();
        alert('Recuperação de senha ainda não implementada.\n\nPor favor, entre em contato com o diretor ou monitor do seu clube para solicitar a redefinição da sua senha.');
    });
}

document.addEventListener('DOMContentLoaded', applyTheme);
