// js/ui/toast.js

/**
 * Exibe uma notificação toast na tela.
 * @param {string} message A mensagem a ser exibida.
 * @param {'success' | 'error' | 'info'} type O tipo de notificação (success, error ou info). // Adicionado 'info'
 * @param {number} duration Duração em milissegundos.
 */
export function showToast(message, type = 'success', duration = 3000) { // Adicionado 'export'
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('Toast container not found!'); // Adiciona log de erro
        return;
    }

    const toast = document.createElement('div');
    // Adiciona classe 'info' se necessário
    toast.className = `toast ${type === 'info' ? 'info' : type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Adiciona a classe 'show' para iniciar a animação de entrada
    // Usar requestAnimationFrame pode ajudar a garantir que a transição ocorra
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
             toast.classList.add('show');
        });
    });


    // Remove o toast após a duração especificada
    const timeoutId = setTimeout(() => {
        toast.classList.remove('show');
        // Remove o elemento do DOM após a animação de saída
        toast.addEventListener('transitionend', () => {
            // Verifica se o toast ainda está no container antes de remover
            if (toast.parentElement === container) {
                container.removeChild(toast);
            }
        }, { once: true }); // Garante que o listener rode apenas uma vez
    }, duration);

    // Opcional: Permite fechar o toast clicando nele
    toast.addEventListener('click', () => {
        clearTimeout(timeoutId); // Cancela o timeout de remoção automática
        toast.classList.remove('show');
         toast.addEventListener('transitionend', () => {
            if (toast.parentElement === container) {
                container.removeChild(toast);
            }
        }, { once: true });
    }, { once: true });
}

// REMOVIDO: A linha abaixo não é mais necessária com 'export'
// window.showToast = showToast;

// Adiciona estilos básicos se não existirem no CSS principal (opcional, melhor ter no main.css)
const styles = `
#toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none; /* Permite clicar através do container */
}

.toast {
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    opacity: 0;
    transform: translateX(110%); /* Começa mais fora da tela */
    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    pointer-events: auto; /* Permite clicar no toast */
    cursor: pointer; /* Indica que é clicável */
}

.toast.show {
    opacity: 1;
    transform: translateX(0);
}

.toast.success {
    background-color: var(--toast-success-bg, #2e7d32); /* Adiciona fallback */
}

.toast.error {
    background-color: var(--toast-error-bg, #c62828); /* Adiciona fallback */
}

.toast.info {
    background-color: var(--toast-info-bg, #0277bd); /* Cor para info, ajuste se necessário */
}
`;

// Injeta os estilos no head (apenas se não estiverem definidos globalmente)
if (!document.getElementById('toast-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'toast-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}