import { appState } from "../../state.js";

export function renderCreateItemView(viewElement) {
    const adminAvatar = appState.users['user-admin'] ? appState.users['user-admin'].avatar : 'img/default-avatar.png';

    viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Criar Novo Item de Jogo</h2>
            <form id="create-item-form" class="user-form">
                <div class="form-group">
                    <label for="item-type">1. Escolha o tipo de item:</label>
                    <select id="item-type" class="form-control" required>
                        <option value="badge">Emblema (Conquista)</option>
                        <option value="seal">Selo</option>
                        <option value="background">Fundo Personalizado</option>
                    </select>
                </div>

                <div id="item-fields-container">
                    <div id="badge-seal-fields">
                         <div class="form-group">
                            <label for="item-name">Nome</label>
                            <input type="text" id="item-name" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="item-description">Descrição (Requisitos)</label>
                            <textarea id="item-description" class="form-control"></textarea>
                        </div>
                        <div class="form-row">
                             <div class="form-group">
                                <label for="item-shape">Formato</label>
                                <select id="item-shape" class="form-control">
                                    <option value="circle">Círculo</option>
                                    <option value="hexagon">Hexágono</option>
                                    <option value="shield">Escudo</option>
                                </select>
                                <div class="form-group" style="margin-top: 1rem;">
                                    <label for="item-image">Ícone (Arquivo de Imagem)</label>
                                    <input type="file" id="item-image" accept="image/*" class="form-control">
                                </div>
                            </div>
                            <div class="form-group preview-container">
                                <label>Pré-visualização</label>
                                <div id="shape-preview" class="achievement-icon-shape shape-circle">
                                     <img class="emblem-icon" src="" alt="Ícone" style="display: none;">
                                </div>
                                <div id="item-name-preview"></div>
                            </div>
                        </div>
                    </div>

                    <div id="background-fields" style="display: none;">
                        <div class="form-group">
                            <label for="item-name-bg">Nome do Fundo</label>
                            <input type="text" id="item-name-bg" class="form-control">
                        </div>
                        <div class="form-row">
                             <div class="form-group">
                                <label for="item-image-bg">Imagem de Fundo</label>
                                <input type="file" id="item-image-bg" accept="image/*" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="item-text-color">Cor do Texto do Nome</label>
                                <input type="color" id="item-text-color" class="form-control" value="#FFFFFF">
                            </div>
                        </div>
                        <p>Ou use um gradiente (a imagem de fundo tem prioridade):</p>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="item-gradient-start">Cor de Início</label>
                                <input type="color" id="item-gradient-start" class="form-control" value="#2d5016">
                            </div>
                            <div class="form-group">
                                <label for="item-gradient-end">Cor de Fim</label>
                                <input type="color" id="item-gradient-end" class="form-control" value="#6b8e23">
                            </div>
                        </div>
                        <div id="background-preview-wrapper">
                            <label>Pré-visualização do Banner</label>
                            <div id="background-preview-block" class="background-preview-block">
                                <div class="background-preview-header">
                                    <img src="${adminAvatar}" alt="Avatar" class="background-preview-avatar">
                                    <div class="background-preview-info">
                                        <h2 id="preview-text-name">Nome do Herói</h2>
                                        <p>Aventureiro • Nível 10</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" class="action-btn" style="margin-top: 1rem;">Criar Item</button>
            </form>
        </div>
    `;

    // --- SELETORES DE ELEMENTOS ---
    const itemTypeSelect = viewElement.querySelector('#item-type');
    const badgeSealFields = viewElement.querySelector('#badge-seal-fields');
    const backgroundFields = viewElement.querySelector('#background-fields');
    const form = viewElement.querySelector('#create-item-form');
    
    // Seletores para Emblemas/Selos
    const itemNameInput = viewElement.querySelector('#item-name');
    const itemNamePreview = viewElement.querySelector('#item-name-preview');
    const shapeSelect = viewElement.querySelector('#item-shape');
    const shapePreview = viewElement.querySelector('#shape-preview');
    const imageInput = viewElement.querySelector('#item-image');
    const emblemIcon = viewElement.querySelector('.emblem-icon');
    let uploadedEmblemImage = null;

    // Seletores para Fundos
    const textColorInput = viewElement.querySelector('#item-text-color');
    const previewTextName = viewElement.querySelector('#preview-text-name');
    const backgroundImageInput = viewElement.querySelector('#item-image-bg');
    const gradientStartInput = viewElement.querySelector('#item-gradient-start');
    const gradientEndInput = viewElement.querySelector('#item-gradient-end');
    const backgroundPreviewBlock = viewElement.querySelector('#background-preview-block');
    let uploadedBgImage = null;


    // --- LÓGICA DE PRÉ-VISUALIZAÇÃO OTIMIZADA ---

    function updateShapePreview(shape) {
        shapePreview.className = `achievement-icon-shape shape-${shape}`;
        if (uploadedEmblemImage) {
            emblemIcon.src = uploadedEmblemImage;
            emblemIcon.style.display = 'block';
        } else {
            emblemIcon.style.display = 'none';
        }
    }
    
    // Função APENAS para atualizar o fundo (imagem ou gradiente)
    function updateBackgroundSource() {
        if (uploadedBgImage) {
            backgroundPreviewBlock.style.backgroundImage = `url(${uploadedBgImage})`;
        } else {
            const start = gradientStartInput.value;
            const end = gradientEndInput.value;
            backgroundPreviewBlock.style.backgroundImage = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
        }
    }

    // Listeners para Emblema/Selo
    itemNameInput.addEventListener('input', (e) => { itemNamePreview.textContent = e.target.value; });
    shapeSelect.addEventListener('change', (e) => updateShapePreview(e.target.value));
    imageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedEmblemImage = event.target.result;
                updateShapePreview(shapeSelect.value);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Listeners para Fundo (AGORA OTIMIZADOS)
    // Este listener agora só afeta a cor do texto, sendo muito mais rápido.
    textColorInput.addEventListener('input', () => {
        previewTextName.style.color = textColorInput.value;
    });

    // Este listener agora só afeta o fundo.
    backgroundImageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedBgImage = event.target.result;
                updateBackgroundSource(); // Chama a função que SÓ mexe no fundo
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    // Estes listeners também só afetam o fundo.
    gradientStartInput.addEventListener('input', () => { uploadedBgImage = null; updateBackgroundSource(); });
    gradientEndInput.addEventListener('input', () => { uploadedBgImage = null; updateBackgroundSource(); });
    
    // --- LÓGICA DO FORMULÁRIO ---

    itemTypeSelect.addEventListener('change', () => {
        const selectedType = itemTypeSelect.value;
        badgeSealFields.style.display = (selectedType === 'badge' || selectedType === 'seal') ? 'block' : 'none';
        backgroundFields.style.display = (selectedType === 'background') ? 'block' : 'none';
        form.reset();
        itemTypeSelect.value = selectedType;
        uploadedEmblemImage = null;
        uploadedBgImage = null;

        // Atualiza as pré-visualizações para o estado inicial
        if (badgeSealFields.style.display === 'block') {
            updateShapePreview('circle');
        }
        if (backgroundFields.style.display === 'block') {
            previewTextName.style.color = textColorInput.value;
            updateBackgroundSource();
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemType = itemTypeSelect.value;
        let newItem;

        if (itemType === 'background') {
            const name = viewElement.querySelector('#item-name-bg').value;
            if(!name) return alert('O nome do fundo é obrigatório!');
            
            newItem = {
                id: `background-${Date.now()}`,
                name: name,
                textColor: textColorInput.value,
                unlocked: true
            };
            
            if (uploadedBgImage) {
                newItem.image = uploadedBgImage;
            } else {
                const startColor = gradientStartInput.value;
                const endColor = gradientEndInput.value;
                newItem.gradient = `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`;
            }
            appState.backgrounds.push(newItem);
            alert(`Fundo "${name}" criado com sucesso!`);

        } else {
            const name = viewElement.querySelector('#item-name').value;
            if(!name) return alert('O nome do item é obrigatório!');

            newItem = {
                id: `${itemType}-${Date.now()}`,
                name: name,
                description: viewElement.querySelector('#item-description').value,
                shape: shapeSelect.value,
                icon: uploadedEmblemImage || '❓',
                unlocked: false
            };
            appState[itemType === 'badge' ? 'badges' : 'seals'].push(newItem);
            alert(`Item "${name}" criado com sucesso!`);
        }
        
        form.reset();
        itemTypeSelect.dispatchEvent(new Event('change'));
    });
    
    // Inicializa a view
    itemTypeSelect.dispatchEvent(new Event('change'));
}