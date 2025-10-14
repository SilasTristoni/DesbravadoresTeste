// js/authGuard.js

function protectPage(allowedRoles) {
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        const isExpired = Date.now() >= payload.exp * 1000;
        if (isExpired) {
            localStorage.removeItem('jwtToken');
            window.location.href = 'login.html';
            return;
        }

        const userRole = payload.role;
        if (!allowedRoles.includes(userRole)) {
            alert('Você não tem permissão para acessar esta página.');
            window.location.href = 'login.html'; 
            return;
        }

        console.log(`Acesso permitido para o cargo: ${userRole}`);

    } catch (error) {
        localStorage.removeItem('jwtToken');
        window.location.href = 'login.html';
    }
}