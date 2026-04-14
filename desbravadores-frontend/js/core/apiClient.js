import { buildApiUrl } from './url.js';

export async function fetchApi(endpoint, options = {}) {
    const token = localStorage.getItem('jwtToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
        mode: options.mode || 'cors'
    };

    const url = buildApiUrl(endpoint);

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            const authError = new Error('Sessao expirada. Faca login novamente.');
            authError.status = 401;

            if (!window.location.pathname.endsWith('login.html')) {
                localStorage.removeItem('jwtToken');
                window.location.href = 'login.html';
            }

            throw authError;
        }

        if (response.status === 403) {
            const forbiddenText = await response.text();
            const forbiddenError = new Error(forbiddenText || 'Acesso negado.');
            forbiddenError.status = 403;
            throw forbiddenError;
        }

        if (!response.ok) {
            const errorText = await response.text();
            const requestError = new Error(errorText || `Erro na requisicao: Status ${response.status}`);
            requestError.status = response.status;
            throw requestError;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }

        return null;
    } catch (error) {
        console.error('Erro na chamada da API:', error);
        throw error;
    }
}

window.fetchApi = fetchApi;
