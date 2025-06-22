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
document.addEventListener('DOMContentLoaded', applyTheme);