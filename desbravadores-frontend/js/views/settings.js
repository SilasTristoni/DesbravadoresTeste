// js/views/settings.js

export async function renderSettingsView(viewElement) {
  
  viewElement.innerHTML = `<p>A carregar configurações do perfil...</p>`;

  try {
      // Busca os dados reais do utilizador logado
      const user = await fetchApi('/api/profile/me'); // Usa o endpoint do perfil
      
      viewElement.innerHTML = `
        <div class="settings-container">
            <div class="settings-user-card">
                <img src="${user.avatar || 'img/escoteiro1.png'}" alt="Avatar" class="avatar-img">
                <div class="settings-user-info">
                    <div class="user-name">${user.name} ${user.surname}</div>
                    <div class="user-rank">${user.role}</div>
                </div>
            </div>

            <div class="settings-list">
                <div class="settings-item" id="theme-item">
                    <div class="settings-item-icon">🎨</div>
                    <div class="settings-item-label">Tema Escuro</div>
                    <label class="theme-switch">
                        <input type="checkbox" id="theme-toggle">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="settings-item" onclick="alert('Funcionalidade de Idioma em desenvolvimento!')">
                    <div class="settings-item-icon">🌐</div>
                    <div class="settings-item-label">Idioma</div>
                </div>
                 <div class="settings-item" onclick="alert('Funcionalidade de Contato em desenvolvimento!')">
                    <div class="settings-item-icon">✉️</div>
                    <div class="settings-item-label">Contato e Suporte</div>
                </div>
                <div class="settings-item" onclick="alert('Você foi desconectado (simulação)!')">
                    <div class="settings-item-icon">🚪</div>
                    <div class="settings-item-label">Desconectar</div>
                </div>
            </div>

            <div class="settings-banner">
                <h3>Aviso Importante</h3>
                <p>A troca de tema é salva automaticamente. Outras configurações podem precisar de confirmação.</p>
            </div>
        </div>
      `;
    
      const themeToggle = viewElement.querySelector("#theme-toggle");

      // Inicializa o toggle com base no estado do tema local
      themeToggle.checked = document.body.classList.contains("dark-mode");

      themeToggle.addEventListener("change", () => {
        const isDarkMode = document.body.classList.toggle("dark-mode");
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      });

  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    viewElement.innerHTML = `<p style="color: red;">Não foi possível carregar as configurações do perfil.</p>`;
  }
}