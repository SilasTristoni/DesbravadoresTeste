import { fetchApi } from './apiClient.js';
import { showToast } from './ui/toast.js';

// Configurações
const WARNING_TIME_SECONDS = 120; // Avisar 2 minutos antes de expirar
const REFRESH_THRESHOLD_SECONDS = 300; // Tentar renovar se faltar menos de 5 minutos
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll'];

let warningTimeout;
let logoutTimeout;
let lastActivityTime = Date.now();
let isRefreshing = false;

// Decodifica o JWT para ler a data de expiração (claim 'exp')
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Função principal chamada ao carregar a aplicação
export function initSessionMonitor() {
    const token = localStorage.getItem('jwtToken'); // Ajustado para chave correta usada no admin-main
    if (!token) return;

    setupTimers(token);
    setupActivityListeners();
    
    // Verifica periodicamente se precisa renovar (a cada 1 minuto)
    setInterval(() => checkAndRefreshToken(), 60000);
}

function setupTimers(token) {
    // Limpa timers antigos
    clearTimeout(warningTimeout);
    clearTimeout(logoutTimeout);

    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return;

    const expMs = decoded.exp * 1000;
    const now = Date.now();
    const timeUntilExp = expMs - now;
    const timeUntilWarning = timeUntilExp - (WARNING_TIME_SECONDS * 1000);

    if (timeUntilExp <= 0) {
        handleLogout();
        return;
    }

    // 1. Configura o Aviso (Toast)
    if (timeUntilWarning > 0) {
        warningTimeout = setTimeout(() => {
            showToast(`Sua sessão expira em breve. Mova o rato para continuar conectado.`, 'warning');
        }, timeUntilWarning);
    }

    // 2. Configura o Logout forçado
    logoutTimeout = setTimeout(() => {
        handleLogout();
    }, timeUntilExp);
}

async function checkAndRefreshToken() {
    // Se o utilizador esteve ativo nos últimos 5 minutos
    const now = Date.now();
    const idleTime = now - lastActivityTime;
    
    // Se inativo por mais de 5 min, não renova automaticamente (deixa o aviso aparecer/expirar)
    if (idleTime > 300000) return; 

    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const decoded = parseJwt(token);
    if (!decoded) return;

    const expMs = decoded.exp * 1000;
    const timeLeftSeconds = (expMs - now) / 1000;

    // Só renova se faltar menos que o tempo limite e não estiver já renovando
    if (timeLeftSeconds < REFRESH_THRESHOLD_SECONDS && !isRefreshing) {
        await refreshToken();
    }
}

async function refreshToken() {
    isRefreshing = true;
    try {
        // Usa o endpoint que criamos
        const response = await fetchApi('/auth/refresh', {
            method: 'POST'
        });

        if (response && response.token) {
            localStorage.setItem('jwtToken', response.token);
            setupTimers(response.token); // Reinicia a contagem dos timers com o novo token
            console.log("Sessão renovada silenciosamente.");
        }
    } catch (error) {
        console.error("Falha ao renovar token:", error);
    } finally {
        isRefreshing = false;
    }
}

function setupActivityListeners() {
    ACTIVITY_EVENTS.forEach(event => {
        window.addEventListener(event, () => {
            lastActivityTime = Date.now();
            // Se o usuário interagir e o toast de aviso estiver visível (sessão quase expirando),
            // tentamos renovar imediatamente
            const token = localStorage.getItem('jwtToken');
            if(token) {
                const decoded = parseJwt(token);
                if(decoded) {
                    const timeUntilExp = (decoded.exp * 1000) - Date.now();
                    // Se estiver na "zona de perigo" (menos de 2 min), renova agora
                    if(timeUntilExp < WARNING_TIME_SECONDS * 1000 && !isRefreshing) {
                         refreshToken();
                    }
                }
            }
        });
    });
}

function handleLogout() {
    showToast('Sessão expirada. Redirecionando...', 'error');
    localStorage.removeItem('jwtToken');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}