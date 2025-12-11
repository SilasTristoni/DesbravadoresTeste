// js/authGuard.js

// Tenta importar showToast (pode falhar se chamado antes do apiClient.js)
// Uma abordagem mais robusta seria garantir que apiClient.js seja carregado primeiro sempre.
// Ou criar uma função de log de erro específica aqui.
// Por simplicidade, assumiremos que showToast estará disponível no momento do erro.
// Adicione isto no topo, se showToast não estiver global:
// import { showToast } from './ui/toast.js'; // Ajuste o caminho

const requiredRole = document.body?.dataset.requiredRole;

function decodeToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function checkAuth() {
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const payload = decodeToken(token);

    if (!payload || !payload.role) {
        localStorage.removeItem('jwtToken');
        window.location.href = 'login.html';
        return;
    }

    const userRole = payload.role;
    const tokenExpiration = payload.exp * 1000;

    // 1. Verificar Expiração
    if (Date.now() >= tokenExpiration) {
        localStorage.removeItem('jwtToken');
        // Substituído alert por showToast (ou console.warn se showToast não carregar a tempo)
        if (window.showToast) {
            showToast('Sessão expirada. Por favor, faça login novamente.', 'error');
        } else {
            console.warn('Sessão expirada. Por favor, faça login novamente.');
        }
        window.location.href = 'login.html';
        return;
    }

    // 2. Verificar Permissão de Cargo (Role)
    if (requiredRole === 'ADMIN_PAGES') {
        if (userRole !== 'MONITOR' && userRole !== 'DIRETOR') {
            console.warn(`Acesso negado. Cargo: ${userRole}. Requerido: MONITOR ou DIRETOR.`);
            window.location.href = 'app.html';
            return;
        }
    } else if (requiredRole === 'USER_PAGE') {
        // Se for Admin, mas está na página de User, redireciona para Admin
        if (userRole === 'MONITOR' || userRole === 'DIRETOR') {
            window.location.href = 'admin.html';
            return;
        }
        // Originalmente faltava verificar DESBRAVADOR, mas a lógica acima já cobre
        // Se não for MONITOR nem DIRETOR, assume-se que é DESBRAVADOR ou inválido
        // Token inválido já foi tratado antes. Então, se chegou aqui e não é Admin, permite.
    }

    console.log(`Acesso permitido para o cargo: ${userRole}`);
}

document.addEventListener('DOMContentLoaded', checkAuth);