// js/views/admin/create-item.js

// As funções auxiliares para buscar itens existentes e configurar a prévia da imagem permanecem as mesmas.
async function fetchAndRenderBadges(container) {
    try {
        const badges = await fetchApi('/api/badges');
        if (badges && badges.length > 0) {
            container.innerHTML = badges.map(badge => `
                <div class="list-item-preview">
                    <img src="http://localhost:8080${badge.icon}" alt="${badge.name}" class="preview-icon">
                    <span><strong>${badge.name}</strong>: ${badge.description}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Nenhum emblema criado ainda.</p>';
        }
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar emblemas.</p>`;
    }
}

async function fetchAndRenderBackgrounds(container) {
    try {
        const backgrounds = await fetchApi('/api/backgrounds');
        if (backgrounds && backgrounds.length > 0) {
            container.innerHTML = backgrounds.map(bg => `
                <div class="list-item-preview" style="${bg.imageUrl ? `background-image: url(http://localhost:8080${bg.imageUrl})` : bg.gradient}; background-size: cover; color: ${bg.textColor};">
                    <span style="background-color: rgba(0,0,0,0.5); padding: 5px;"><strong>${bg.name}</strong></span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Nenhum fundo criado ainda.</p>';
        }
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar fundos.</p>`;
    }
}

function setupImagePreview(fileInputId, previewContainerId, previewImageId, maxSizeMB = 1) {
    const fileInput = document.getElementById(fileInputId);
    const previewContainer = document.getElementById(previewContainerId);
    const previewImage = document.getElementById(previewImageId);

    if (!fileInput) return; // Garante que o input existe antes de adicionar o listener

    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            if (file.size > maxSizeMB * 1024 * 1024) {
                alert(`Erro: O ficheiro é maior que ${maxSizeMB}MB.`);
                this.value = "";
                if (previewContainer) previewContainer.style.display = 'none';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                if (previewImage) previewImage.src = e.target.result;
                if (previewContainer) previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            if (previewContainer) previewContainer.style.display = 'none';
        }
    });
}


export function renderCreateItemView(viewElement) {
    // Restauramos o HTML que inclui ambos os formulários
    viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Criar Novo Item de Gamificação</h2>
            
            <div class="form-group">
                <label for="item-type-selector">Selecione o tipo de item a criar:</label>
                <select id="item-type-selector" class="form-control">
                    <option value="badge">Emblema</option>
                    <option value="background">Fundo de Perfil</option>
                </select>
            </div>

            <form id="create-badge-form" class="user-form" style="display: block;">
                <h4>Novo Emblema</h4>
                <div class="form-group">
                    <label for="badge-name">Nome do Emblema</label>
                    <input type="text" id="badge-name" class="form-control">
                </div>
                <div class="form-group">
                    <label for="badge-description">Descrição</label>
                    <textarea id="badge-description" class="form-control"></textarea>
                </div>
                <div class="form-group">
                    <label for="badge-icon-file">Ficheiro do Ícone</label>
                    <small class="form-text">Tamanho máximo: 1MB. Proporção recomendada: 1:1 (quadrada).</small>
                    <input type="file" id="badge-icon-file" class="form-control" accept="image/*">
                </div>
                <div id="badge-preview-container" class="preview-container" style="display:none;"><label>Prévia:</label><img id="badge-preview-image"></div>
                <button type="submit" class="action-btn">Criar Emblema</button>
            </form>

            <form id="create-background-form" class="user-form" style="display: none;">
                <h4>Novo Fundo de Perfil</h4>
                <div class="form-group">
                    <label for="bg-name">Nome do Fundo</label>
                    <input type="text" id="bg-name" class="form-control">
                </div>
                <div class="form-group">
                    <label for="bg-text-color">Cor do Texto</label>
                    <input type="color" id="bg-text-color" class="form-control" value="#FFFFFF">
                </div>
                <div class="form-group">
                    <label for="bg-image-file">Ficheiro da Imagem de Fundo</label>
                    <small class="form-text">Tamanho máximo: 2MB.</small>
                    <input type="file" id="bg-image-file" class="form-control" accept="image/*">
                </div>
                <div id="bg-preview-container" class="preview-container" style="display:none;"><label>Prévia:</label><img id="bg-preview-image"></div>
                <button type="submit" class="action-btn">Criar Fundo</button>
            </form>
        </div>

        <div class="admin-widget">
            <h2>Itens Existentes</h2>
            <div id="badges-list-container">
                <h3>Emblemas</h3>
                <div id="badges-list"></div>
            </div>
            <div id="backgrounds-list-container" style="margin-top: 2rem;">
                <h3>Fundos de Perfil</h3>
                <div id="backgrounds-list"></div>
            </div>
        </div>
        <style>
            .list-item-preview { display: flex; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0; } 
            .preview-icon { width: 40px; height: 40px; margin-right: 15px; border-radius: 8px; object-fit: cover; }
            .preview-container { text-align: center; margin: 1rem 0; }
            .preview-container img { max-width: 150px; max-height: 150px; border: 2px solid #ccc; padding: 5px; }
            .form-text { display: block; margin-bottom: 10px; color: #7f8c8d; font-size: 0.9em; }
        </style>
    `;

    const itemSelector = viewElement.querySelector('#item-type-selector');
    const badgeForm = viewElement.querySelector('#create-badge-form');
    const backgroundForm = viewElement.querySelector('#create-background-form');

    // LÓGICA DE ALTERNÂNCIA CORRIGIDA
    itemSelector.addEventListener('change', () => {
        console.log("A alternar para o formulário:", itemSelector.value); // Log para depuração
        if (itemSelector.value === 'badge') {
            badgeForm.style.display = 'block';
            backgroundForm.style.display = 'none';
        } else {
            badgeForm.style.display = 'none';
            backgroundForm.style.display = 'block';
        }
    });

    // Configura as prévias para ambos os formulários
    setupImagePreview('badge-icon-file', 'badge-preview-container', 'badge-preview-image', 1);
    setupImagePreview('bg-image-file', 'bg-preview-container', 'bg-preview-image', 2);

    // Listener para o formulário de emblema
    badgeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const badgeFileInput = document.getElementById('badge-icon-file');
        if (!badgeFileInput.files || badgeFileInput.files.length === 0) {
            alert('Por favor, selecione um ficheiro de ícone.');
            return;
        }
        const formData = new FormData();
        formData.append('name', document.getElementById('badge-name').value);
        formData.append('description', document.getElementById('badge-description').value);
        formData.append('iconFile', badgeFileInput.files[0]);
        try {
            await fetchApi('/api/admin/badges', { method: 'POST', body: formData });
            alert('Emblema criado com sucesso!');
            badgeForm.reset();
            document.getElementById('badge-preview-container').style.display = 'none';
            fetchAndRenderBadges(viewElement.querySelector("#badges-list"));
        } catch (error) {
            alert(`Erro ao criar emblema: ${error.message}`);
        }
    });

    // Listener para o formulário de fundo (AINDA SEM LÓGICA DE ENVIO FINAL)
    backgroundForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        alert("A lógica de envio para o backend para fundos (com imagem e gradiente) será o nosso próximo passo!");
    });

    // Carrega as listas de itens existentes
    fetchAndRenderBadges(viewElement.querySelector("#badges-list"));
    fetchAndRenderBackgrounds(viewElement.querySelector("#backgrounds-list"));
}