// js/apiClient.js

import { buildApiUrl } from './url.js';

/**
 * Função global para fazer requisições autenticadas à API.
 * @param {string} endpoint O endpoint da API (ex: '/api/user/profile')
 * @param {object} options Opções de fetch (method, headers, body, etc.)
 * @returns {Promise<any>} A resposta da API em JSON.
 */
// ADICIONADO "export" AQUI PARA FUNCIONAR COM MÓDULOS
export async function fetchApi(endpoint, options = {}) {
    const token = localStorage.getItem('jwtToken');
    
    // Configuração dos cabeçalhos padrão
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers, 
    };
    
    // TRATAMENTO PARA FormData (FileUpload)
    if (options.body instanceof FormData) {
        // Remove 'Content-Type': 'application/json' se o corpo for FormData
        delete headers['Content-Type'];
    }

    // Adiciona o token de autorização se existir
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: headers,
        mode: options.mode || 'cors', 
    };

    const url = buildApiUrl(endpoint);

    try {
        const response = await fetch(url, config);

        if (response.status === 401 || response.status === 403) {
            // Verifica se não estamos já na página de login para evitar loop
            if (!window.location.pathname.endsWith('login.html')) {
                localStorage.removeItem('jwtToken');
                window.location.href = 'login.html';
                throw new Error('Sessão expirada ou acesso negado. Redirecionando para o login.');
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Erro na requisição: Status ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        }
        return null; 

    } catch (error) {
        console.error("Erro na chamada da API:", error);
        throw error;
    }
}

// Mantém a compatibilidade global para scripts que não usam import
window.fetchApi = fetchApi;
