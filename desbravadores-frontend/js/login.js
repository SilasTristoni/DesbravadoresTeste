// js/login.js

// --- LÓGICA DO TEMA ---
const themeToggle = document.getElementById('theme-toggle');

function applyTheme() {
    // Aplica o tema na inicialização
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
    }
}

themeToggle.addEventListener('click', () => {
    // Alterna o tema no clique
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
});

// --- LÓGICA DE VISUALIZAÇÃO DE SENHA ---
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.querySelector('.toggle-password');

togglePasswordButton.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordButton.textContent = type === 'password' ? '👁️' : '🙈';
});

// --- LÓGICA DO FORMULÁRIO (LOGIN E "LEMBRAR-ME") ---
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const rememberMeCheckbox = document.getElementById('rememberMe');

// Preenche o e-mail se estiver salvo no localStorage
if (localStorage.getItem('rememberedEmail')) {
    emailInput.value = localStorage.getItem('rememberedEmail');
    rememberMeCheckbox.checked = true;
}

loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;
    const loginButton = document.querySelector('.login-button');

    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';

    // Lógica de Login Real com API e Redirecionamento por Cargo
    fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password }),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { 
                throw new Error(text || 'Email ou senha inválidos') 
            });
        }
        return response.json();
    })
    .then(data => {
        const token = data.token;
        localStorage.setItem('jwtToken', token);
        
        // Decodifica o payload do JWT para obter o cargo (role)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;

        // Redirecionamento baseado no cargo
        if (userRole === 'DESBRAVADOR') {
            window.location.href = 'app.html';
        } else if (userRole === 'MONITOR' || userRole === 'DIRETOR') {
            window.location.href = 'admin.html';
        } else {
            alert('Cargo de usuário não reconhecido.');
            window.location.href = 'login.html';
        }

        // Lógica de "Lembrar-me"
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
    })
    .catch((error) => {
        console.error('Erro no login:', error);
        alert(error.message);
        localStorage.removeItem('jwtToken');
    })
    .finally(() => {
        loginButton.disabled = false;
        loginButton.textContent = 'Entrar';
    });
});

document.addEventListener('DOMContentLoaded', applyTheme);