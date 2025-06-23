// js/register.js
document.getElementById('register-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Coleta dos valores dos campos
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validação 1: Verificar se as senhas coincidem
    if (password !== confirmPassword) {
        alert('As senhas não coincidem. Por favor, tente novamente.');
        return; // Interrompe a execução
    }

    // Validação 2: Verificar se a senha tem um comprimento mínimo
    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return; // Interrompe a execução
    }

    // Se todas as validações passarem
    console.log('Simulando registro bem-sucedido para:', { firstName, lastName, email });
    
    // Feedback para o usuário e redirecionamento
    alert(`Bem-vindo, ${firstName}! Seu registro foi concluído com sucesso. Você será redirecionado para a página de login.`);
    
    // Redireciona para a página de login após o registro
    window.location.href = 'login.html'; 
});