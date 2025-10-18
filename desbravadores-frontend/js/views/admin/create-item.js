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
            container.innerHTML = backgrounds.map(bg => {
                // Decide o estilo: URL para imagem, ou gradient se não houver URL
                const style = bg.imageUrl 
                    ? `background: url(http://localhost:8080${bg.imageUrl}) center/cover no-repeat; color: ${bg.textColor};`
                    : `background: ${bg.gradient}; color: ${bg.textColor};`;
                
                return `
                    <div class="list-item-preview" style="${style}">
                        <span style="background-color: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px;"><strong>${bg.name}</strong></span>
                    </div>
                `;
            }).join('');
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
    const previewBlock = document.getElementById('background-preview-block');


    if (!fileInput) return; // Garante que o input existe antes de adicionar o listener

    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        const bgGradientInput = document.getElementById('bg-gradient');
        
        if (file) {
            if (file.size > maxSizeMB * 1024 * 1024) {
                alert(`Erro: O ficheiro é maior que ${maxSizeMB}MB.`);
                this.value = "";
                if (previewContainer) previewContainer.style.display = 'none';
                return;
            }
            
            // Limpa o campo de gradiente para forçar a imagem a ter prioridade
            if (bgGradientInput) {
                 bgGradientInput.value = '';
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                if (previewImage) {
                    previewImage.src = e.target.result;
                    
                    if (previewBlock) {
                        // Define o background com a sintaxe completa para garantir cover e proporção.
                        previewBlock.style.background = `url(${e.target.result}) center / cover no-repeat`; 
                        
                        updateBackgroundPreview(); // Força update para aplicar o texto branco
                    }
                }
                if (previewContainer) previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            // Se o ficheiro for removido, a prévia deve voltar ao estado inicial/gradiente
            if (previewBlock) {
                // Ao remover, voltamos à lógica normal de update
                updateBackgroundPreview();
            }
            if (previewContainer) previewContainer.style.display = 'none';
        }
    });
}


// Lógica de Prévia de Cor/Gradiente
const updateBackgroundPreview = () => {
    const bgGradientInput = document.getElementById('bg-gradient');
    const previewBlock = document.getElementById('background-preview-block');
    const imageFile = document.getElementById('bg-image-file').files[0];
    
    // Cor do texto é sempre #FFFFFF
    previewBlock.style.color = '#FFFFFF';

    const gradient = bgGradientInput ? bgGradientInput.value.trim() : '';

    
    // PRIORIDADE 1: Imagem (se o setupImagePreview foi executado com uma imagem, ela já tem prioridade)
    if (imageFile) {
        // Se houver imagem, o setupImagePreview já define o background completo.
        return; 
    }
    
    // Se a imagem for removida ou não existir, aplicamos o gradiente ou padrão
    
    // PRIORIDADE 2: Gradiente/Cor Sólida
    if (gradient) {
        if (gradient.includes('gradient') || gradient.startsWith('#')) {
             previewBlock.style.background = gradient;
        } else {
            // Valor inválido/vazio
            previewBlock.style.background = 'linear-gradient(135deg, #2d5016 0%, #6b8e23 100%)';
        }
    } else {
        // PRIORIDADE 3: Padrão
        previewBlock.style.background = 'linear-gradient(135deg, #2d5016 0%, #6b8e23 100%)';
    }
};

// CORREÇÃO CRÍTICA AQUI: Define gradientPalette no escopo do módulo
const gradientPalette = [
    'linear-gradient(135deg, #2d5016 0%, #6b8e23 100%)', // Verde Escuro para Claro
    'linear-gradient(to right, #8b4513, #d2b48c)', // Marrom
    'linear-gradient(to bottom right, #FFD700, #ff6b35)', // Ouro para Laranja
    'linear-gradient(to top, #4158D0, #C850C0, #FFCC70)', // Azul, Rosa, Amarelo (Estilo Instagram)
    '#2d5016', // Cor Sólida de exemplo (scout-green)
    '#8B0000', // Vermelho Escuro
    '#191970', // Azul Marinho
];


export function renderCreateItemView(viewElement) {
    // Removido: const gradientPalette = [...] para resolver o erro de redeclaração.

    // O HTML do formulário de Background
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
                    <input type="text" id="badge-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="badge-description">Descrição</label>
                    <textarea id="badge-description" class="form-control" required></textarea>
                </div>
                <div class="form-group">
                    <label for="badge-icon-file">Ficheiro do Ícone</label>
                    <small class="form-text">Tamanho máximo: 1MB. Proporção recomendada: 1:1 (quadrada).</small>
                    <input type="file" id="badge-icon-file" class="form-control" accept="image/*" required>
                </div>
                <div id="badge-preview-container" class="preview-container" style="display:none;"><label>Prévia:</label><img id="badge-preview-image"></div>
                <button type="submit" class="action-btn">Criar Emblema</button>
            </form>

            <form id="create-background-form" class="user-form" style="display: none;">
                <h4>Novo Fundo de Perfil</h4>
                <div class="form-group">
                    <label for="bg-name">Nome do Fundo</label>
                    <input type="text" id="bg-name" class="form-control" required>
                </div>
                <div class="form-group" style="padding-bottom: 0.5rem;">
                    <small class="form-text" style="color: var(--scout-green); font-weight: bold;">A cor do texto do perfil é sempre fixada em Branco.</small>
                </div>
                
                <div class="form-group">
                    <label>Paleta de Gradientes e Cores Sólidas (Seleção Rápida)</label>
                    <div id="color-palette-container" class="color-palette">
                        </div>
                </div>

                <div class="form-group">
                    <label for="bg-gradient">Gradiente CSS / Cor Sólida (Personalizar)</label>
                    <input type="text" id="bg-gradient" class="form-control" placeholder="Ex: linear-gradient(#2d5016, #6b8e23) ou #0000FF">
                </div>
                <div class="form-group">
                    <label for="bg-image-file">Ficheiro da Imagem de Fundo (Opcional)</label>
                    <small class="form-text">Tamanho máximo: 2MB. Use imagem OU gradiente/cor sólida.</small>
                    <input type="file" id="bg-image-file" class="form-control" accept="image/*">
                </div>
                
                <div id="background-preview-wrapper" class="preview-container">
                    <label>Prévia:</label>
                    <div id="background-preview-block" class="background-preview-block" style="background: linear-gradient(135deg, #2d5016 0%, #6b8e23 100%); color: #FFFFFF;">
                        <div class="background-preview-header">
                            <img src="img/escoteiro1.png" alt="Avatar" class="background-preview-avatar">
                            <div class="background-preview-info">
                                <div id="preview-name" class="preview-name-text">Preview Name</div>
                                <div class="preview-role-text">Role • Level 99</div>
                            </div>
                        </div>
                    </div>
                </div>
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
            .list-item-preview[style*="background"] { padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 10px; }
            .preview-icon { width: 40px; height: 40px; margin-right: 15px; border-radius: 8px; object-fit: cover; }
            .preview-container { text-align: center; margin: 1rem 0; }
            .preview-container img { max-width: 150px; max-height: 150px; border: 2px solid #ccc; padding: 5px; }
            .form-text { display: block; margin-bottom: 10px; color: #7f8c8d; font-size: 0.9em; }
            
            /* Ajuste de estilo para garantir que o texto de prévia é branco e legível */
            .background-preview-info .preview-name-text {
                font-size: 1.5rem;
                font-weight: 700;
                margin: 0 0 0.25rem 0;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
                color: inherit; /* Garante que a cor venha do parent (FFFFFF) */
            }
            .background-preview-info .preview-role-text {
                font-size: 0.9rem;
                opacity: 0.9;
                margin: 0;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
                color: inherit;
            }
        </style>
    `;

    const itemSelector = viewElement.querySelector('#item-type-selector');
    const badgeForm = viewElement.querySelector('#create-badge-form');
    const backgroundForm = viewElement.querySelector('#create-background-form');
    const paletteContainer = viewElement.querySelector('#color-palette-container'); // OBTÉM O CONTENTOR DA PALETA

    // Elementos de Prévia
    const bgNameInput = viewElement.querySelector('#bg-name');
    const bgGradientInput = document.getElementById('bg-gradient');
    const previewBlock = document.getElementById('background-preview-block');
    const previewName = document.getElementById('preview-name');

    // LÓGICA DE ALTERNÂNCIA CORRIGIDA
    itemSelector.addEventListener('change', () => {
        if (itemSelector.value === 'badge') {
            badgeForm.style.display = 'block';
            backgroundForm.style.display = 'none';
        } else {
            badgeForm.style.display = 'none';
            backgroundForm.style.display = 'block';
        }
    });
    
    // Lógica de Prévia de Nome
    if (bgNameInput) {
        bgNameInput.addEventListener('input', () => {
            previewName.textContent = bgNameInput.value || 'Preview Name';
        });
    }
    
    // Renderiza a paleta de GRADIENTES e adiciona listeners
    if (paletteContainer) {
        paletteContainer.innerHTML = gradientPalette.map((gradient, index) => {
            const colorForPreview = gradient.includes('gradient') || gradient.startsWith('#') ? gradient : `linear-gradient(to right, ${gradient}, ${gradient})`;
            return `<div class="palette-color-item" data-gradient-value="${gradient}" style="background: ${colorForPreview}; border: 3px solid #ccc;"></div>`;
        }).join('');

        paletteContainer.querySelectorAll('.palette-color-item').forEach(item => {
            item.addEventListener('click', () => {
                const selectedGradient = item.dataset.gradientValue;
                
                // Limpa o campo de imagem e input file para forçar o gradiente
                document.getElementById('bg-image-file').value = '';
                
                // Define o valor do gradiente no input
                bgGradientInput.value = selectedGradient; 
                
                // Força a atualização da prévia
                updateBackgroundPreview();
            });
        });
    }


    // Lógica de Prévia de Cor/Gradiente
    const updateBackgroundPreview = () => {
        // Cor do texto é sempre #FFFFFF
        previewBlock.style.color = '#FFFFFF';

        const gradient = bgGradientInput.value.trim();
        const imageFile = document.getElementById('bg-image-file').files[0];

        
        // PRIORIDADE 1: Imagem (o setupImagePreview já trata, mas deve ter prioridade visual)
        if (imageFile) {
            // Se houver imagem, o setupImagePreview já define o background completo.
            return; 
        }
        
        // Se a imagem for removida ou não existir, aplicamos o gradiente ou padrão
        
        // PRIORIDADE 2: Gradiente/Cor Sólida
        if (gradient) {
            if (gradient.includes('gradient') || gradient.startsWith('#')) {
                 previewBlock.style.background = gradient;
            } else {
                // Valor inválido/vazio
                previewBlock.style.background = 'linear-gradient(135deg, #2d5016 0%, #6b8e23 100%)';
            }
        } else {
            // PRIORIDADE 3: Padrão
            previewBlock.style.background = 'linear-gradient(135deg, #2d5016 0%, #6b8e23 100%)';
        }
    };
    
    // Adiciona listener para entrada manual no campo Gradiente
    const bgGradientInputEl = document.getElementById('bg-gradient');
    if (bgGradientInputEl) bgGradientInputEl.addEventListener('input', updateBackgroundPreview);


    // Configura as prévias para ambos os formulários
    setupImagePreview('badge-icon-file', 'badge-preview-container', 'badge-preview-image', 1);
    // Adiciona o listener de alteração da imagem para re-executar a prévia de fundo
    const bgImageFileInput = document.getElementById('bg-image-file');
    if (bgImageFileInput) {
        // O setupImagePreview já foi corrigido para lidar com a seleção de imagem corretamente
        setupImagePreview('bg-image-file', 'bg-image-file' /* not used */, 'bg-image-file' /* not used */, 2); 
    }


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

    // Listener para o formulário de fundo (LÓGICA DE ENVIO FINAL)
    backgroundForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const imageFile = document.getElementById('bg-image-file').files[0];
        const gradient = bgGradientInput.value.trim();
        
        if (!imageFile && !gradient) {
            alert('Por favor, selecione um ficheiro de imagem OU insira um código de gradiente.');
            return;
        }
        
        const name = bgNameInput.value;
        // Cor do texto é sempre fixada no frontend e backend
        const textColor = '#FFFFFF'; 
        
        let success = false;

        if (imageFile) {
             // 1. Envio como Imagem (MultipartForm)
             if(gradient) {
                 console.warn('O campo Gradiente foi ignorado pois uma imagem foi selecionada.');
             }
             const formData = new FormData();
             formData.append('name', name);
             formData.append('textColor', textColor);
             formData.append('imageFile', imageFile);

             try {
                await fetchApi('/api/admin/backgrounds', { method: 'POST', body: formData });
                success = true;
            } catch (error) {
                alert(`Erro ao criar fundo (Imagem): ${error.message}`);
            }
            
        } else if (gradient) {
            // 2. Envio como Gradiente/Cor Sólida (JSON)
            const payload = {
                name: name,
                textColor: textColor,
                gradient: gradient 
            };
            
            try {
                await fetchApi('/api/admin/backgrounds/gradient', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                success = true;
            } catch (error) {
                 alert(`Erro ao criar fundo (Gradiente): ${error.message}`);
            }
        }
        
        // Reset e reload se o envio for bem-sucedido
        if (success) {
            backgroundForm.reset();
            // Reset da prévia para o estado padrão
            previewBlock.style.backgroundImage = 'none';
            previewBlock.style.background = 'linear-gradient(135deg, #2d5016 0%, #6b8e23 100%)';
            fetchAndRenderBackgrounds(viewElement.querySelector("#backgrounds-list"));
            updateBackgroundPreview(); // Inicializa a prévia
        }
    });


    // Carrega as listas de itens existentes
    fetchAndRenderBadges(viewElement.querySelector("#badges-list"));
    fetchAndRenderBackgrounds(viewElement.querySelector("#backgrounds-list"));
    updateBackgroundPreview(); // Inicializa a prévia
}