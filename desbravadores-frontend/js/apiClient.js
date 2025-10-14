// js/apiClient.js

const API_BASE_URL = 'http://localhost:8080';

/**
 * Função genérica para fazer requisições autenticadas à API.
 * Ela agora lida tanto com JSON quanto com FormData (uploads).
 * @param {string} endpoint - O endpoint da API a ser chamado.
 * @param {object} options - As opções da requisição fetch (method, headers, body).
 * @returns {Promise<any>} - A promessa com os dados da resposta.
 */
async function fetchApi(endpoint, options = {}) {
    const token = localStorage.getItem('jwtToken');

    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // ---- LÓGICA ATUALIZADA AQUI ----
    // Se o corpo da requisição NÃO for FormData, definimos o Content-Type como JSON.
    // Se for FormData, deixamos o Content-Type de fora para o navegador o definir
    // automaticamente como 'multipart/form-data' com o boundary correto.
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('jwtToken');
        window.location.href = 'login.html';
        throw new Error('Não autorizado');
    }

    if (!response.ok) {
        // Tenta ler a resposta como JSON, se falhar, lê como texto.
        try {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ocorreu um erro na requisição.');
        } catch (e) {
            const textError = await response.text();
            throw new Error(textError || 'Ocorreu um erro na requisição.');
        }
    }

    // Se a resposta tiver conteúdo, converte para JSON, senão, retorna nulo.
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return null; 
}