<<<<<<< HEAD
// js/login.js

=======
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
// --- LÓGICA DO TEMA ---
const themeToggle = document.getElementById('theme-toggle');

function applyTheme() {
<<<<<<< HEAD
=======
    // Aplica o tema na inicialização
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
    }
}

themeToggle.addEventListener('click', () => {
<<<<<<< HEAD
=======
    // Alterna o tema no clique
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
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

<<<<<<< HEAD
=======
// Preenche o e-mail se estiver salvo no localStorage
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
if (localStorage.getItem('rememberedEmail')) {
    emailInput.value = localStorage.getItem('rememberedEmail');
    rememberMeCheckbox.checked = true;
}

<<<<<<< HEAD
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;
    const loginButton = document.querySelector('.login-button');

    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';

    fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password }),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error('Email ou senha inválidos') });
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

=======
// Listener de envio do formulário
loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); 
    
    // Salva ou remove o e-mail do "Lembrar-me"
    if (rememberMeCheckbox.checked) {
        localStorage.setItem('rememberedEmail', emailInput.value);
    } else {
        localStorage.removeItem('rememberedEmail');
    }

    console.log('Simulando login bem-sucedido...');
    // Redireciona para a página principal da aplicação
    window.location.href = 'app.html'; 
});

// Garante que o tema seja aplicado assim que o HTML for carregado
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
document.addEventListener('DOMContentLoaded', applyTheme);