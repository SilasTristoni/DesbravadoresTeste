// js/login.js
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); 
    console.log('Simulando login bem-sucedido...');
    // Redireciona para a página principal da aplicação
    window.location.href = 'app.html'; 
});