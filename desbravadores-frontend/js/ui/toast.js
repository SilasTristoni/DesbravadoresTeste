// js/ui/toast.js

/**
 * Exibe uma notificação toast na tela.
 * @param {string} message A mensagem a ser exibida.
 * @param {'success' | 'error'} type O tipo de notificação (success ou error).
 * @param {number} duration Duração em milissegundos.
 */
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Adiciona a classe 'show' para iniciar a animação de entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Remove o toast após a duração especificada
    setTimeout(() => {
        toast.classList.remove('show');
        // Remove o elemento do DOM após a animação de saída
        toast.addEventListener('transitionend', () => {
            if (toast.parentElement) {
                container.removeChild(toast);
            }
        });
    }, duration);
}

// Torna a função global para ser acessível em outros scripts
window.showToast = showToast;