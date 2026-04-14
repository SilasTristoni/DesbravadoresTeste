import { fetchApi } from '../../core/apiClient.js';
import { showModal } from '../../components/modal.js';
import { resolveAssetUrl } from '../../core/url.js';
import { showToast } from '../../ui/toast.js';

const ITEM_PAGE_SIZE = 5;

const CREATION_SECTIONS = {
    achievement: {
        title: 'Gamificacao',
        subtitle: 'Conquistas, emblemas e selos que liberam identidade e progresso.',
        icon: 'fa-trophy',
        accentClass: 'theme-achievement'
    },
    background: {
        title: 'Fundos',
        subtitle: 'Cenarios visuais para personalizar o perfil e destacar campanhas.',
        icon: 'fa-panorama',
        accentClass: 'theme-background'
    },
    specialty: {
        title: 'Especialidades',
        subtitle: 'Catalogo de aprendizado que o aluno visualiza e percorre no mobile.',
        icon: 'fa-compass',
        accentClass: 'theme-specialty'
    },
    requirement: {
        title: 'Requisitos',
        subtitle: 'Etapas por classe com ordem, categoria e criterio de conclusao.',
        icon: 'fa-list-check',
        accentClass: 'theme-requirement'
    }
};

let editingAchievementId = null;
let editingBackgroundId = null;
let editingSpecialtyId = null;
let editingRequirementId = null;

function renderPaginationControls(paginationContainer, container, itemPage, loadFunction) {
    paginationContainer.innerHTML = '';

    const { number, totalPages, first, last } = itemPage;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first;
    prevBtn.addEventListener('click', () => loadFunction(container, number - 1));

    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Pagina ${number + 1} de ${totalPages}`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Proxima <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = last;
    nextBtn.addEventListener('click', () => loadFunction(container, number + 1));

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}

function truncate(value, length = 60) {
    if (!value) return '';
    return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}

function formatRewardType(type) {
    return type === 'SEAL' ? 'Selo' : 'Emblema';
}

function renderAchievementPreview(achievement) {
    return `
        <div class="asset-mobile-preview achievement-mobile-preview" aria-hidden="true">
            <span class="asset-mobile-chip">${formatRewardType(achievement.rewardType)}</span>
            <img src="${resolveAssetUrl(achievement.icon)}" alt="" class="preview-icon preview-icon-mobile">
        </div>
    `;
}

function renderBackgroundPreview(background, previewStyle) {
    return `
        <div class="asset-mobile-preview background-mobile-preview" style="${previewStyle}" aria-hidden="true">
            <span class="asset-mobile-chip">Fundo</span>
            <strong>${background.name}</strong>
        </div>
    `;
}

function syncMetric(container, metricKey, value) {
    const root = container.closest('[data-create-item-root="true"]');
    if (!root) return;

    const metricValue = root.querySelector(`[data-metric-value="${metricKey}"]`);
    if (metricValue) {
        metricValue.textContent = value;
    }
}

function setActiveCreationMode(viewElement, mode) {
    const modeConfig = CREATION_SECTIONS[mode];
    const workspace = viewElement.querySelector('.create-item-workspace');
    const title = viewElement.querySelector('[data-create-title]');
    const subtitle = viewElement.querySelector('[data-create-subtitle]');

    workspace.classList.remove(
        CREATION_SECTIONS.achievement.accentClass,
        CREATION_SECTIONS.background.accentClass,
        CREATION_SECTIONS.specialty.accentClass,
        CREATION_SECTIONS.requirement.accentClass
    );
    workspace.classList.add(modeConfig.accentClass);

    title.textContent = modeConfig.title;
    subtitle.textContent = modeConfig.subtitle;

    viewElement.querySelectorAll('[data-create-mode]').forEach((button) => {
        button.classList.toggle('active', button.dataset.createMode === mode);
    });

    Object.keys(CREATION_SECTIONS).forEach((key) => {
        const form = viewElement.querySelector(`[data-form-mode="${key}"]`);
        const listSection = viewElement.querySelector(`[data-list-mode="${key}"]`);
        const active = key === mode;

        if (form) {
            form.style.display = active ? 'flex' : 'none';
        }

        if (listSection) {
            listSection.style.display = active ? 'block' : 'none';
        }
    });
}

function showDeleteModal(title, message, onConfirm) {
    const modalBody = document.createElement('div');
    modalBody.innerHTML = `<p>${message}</p>`;

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirmar';
    confirmBtn.className = 'action-btn';
    confirmBtn.onclick = async () => {
        await onConfirm();
        document.getElementById('closeModalBtn').click();
    };

    modalBody.appendChild(confirmBtn);
    showModal(title, modalBody);
}

async function loadAndRenderAchievements(container, page = 0) {
    try {
        const achievementPage = await fetchApi(`/api/admin/achievements?page=${page}&size=${ITEM_PAGE_SIZE}&sort=name,asc`);
        const achievements = achievementPage.content;

        if (achievementPage.totalElements > 0) {
            container.innerHTML = achievements.map((achievement) => {
                if (editingAchievementId === achievement.id) {
                    return `
                        <div class="list-item-preview editing-row">
                            <form class="edit-achievement-form" data-id="${achievement.id}">
                                <div class="form-group">
                                    <label>Nome</label>
                                    <input type="text" name="name" value="${achievement.name}" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Descricao</label>
                                    <textarea name="description" class="form-control" required>${achievement.description}</textarea>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>XP</label>
                                        <input type="number" name="xpReward" value="${achievement.xpReward}" class="form-control" min="0" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Tipo</label>
                                        <select name="rewardType" class="form-control" required>
                                            <option value="BADGE" ${achievement.rewardType === 'BADGE' ? 'selected' : ''}>Emblema</option>
                                            <option value="SEAL" ${achievement.rewardType === 'SEAL' ? 'selected' : ''}>Selo</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Novo icone</label>
                                    <input type="file" name="iconFile" class="form-control" accept="image/*">
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn-action save">
                                        <i class="fa-solid fa-check"></i> Salvar
                                    </button>
                                    <button type="button" class="btn-action cancel cancel-edit-ach-btn">
                                        <i class="fa-solid fa-times"></i> Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    `;
                }

                return `
                    <div class="list-item-preview list-item-preview-asset">
                        ${renderAchievementPreview(achievement)}
                        <span class="list-item-copy">
                            <strong>${achievement.name}</strong>
                            <small>${formatRewardType(achievement.rewardType)} • ${truncate(achievement.description)}</small>
                        </span>
                        <div class="item-actions">
                            <button class="btn-action-icon edit edit-ach-btn" title="Editar conquista" data-id="${achievement.id}">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button class="btn-action-icon delete delete-ach-btn" title="Apagar conquista" data-id="${achievement.id}" data-name="${achievement.name}">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>Nenhuma conquista criada ainda.</p>';
        }

        syncMetric(container, 'achievement', achievementPage.totalElements);

        const paginationContainer = container.nextElementSibling;
        if (achievementPage.totalPages > 1) {
            renderPaginationControls(paginationContainer, container, achievementPage, loadAndRenderAchievements);
        } else {
            paginationContainer.innerHTML = '';
        }

        addAchievementListeners(container, page);
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar conquistas: ${error.message}</p>`;
    }
}

function addAchievementListeners(container, currentPage) {
    const listContainer = document.getElementById('achievements-list');

    container.querySelectorAll('.delete-ach-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            const { id, name } = event.currentTarget.dataset;

            showDeleteModal(
                'Apagar item de gamificacao',
                `Tem certeza que quer apagar "<strong>${name}</strong>"?`,
                async () => {
                    try {
                        await fetchApi(`/api/admin/achievements/${id}`, { method: 'DELETE' });
                        showToast('Conquista apagada.', 'success');
                        editingAchievementId = null;
                        loadAndRenderAchievements(listContainer, currentPage);
                    } catch (error) {
                        showToast(`Erro ao apagar: ${error.message}`, 'error');
                    }
                }
            );
        });
    });

    container.querySelectorAll('.edit-ach-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            editingAchievementId = Number.parseInt(event.currentTarget.dataset.id, 10);
            loadAndRenderAchievements(listContainer, currentPage);
        });
    });

    container.querySelectorAll('.cancel-edit-ach-btn').forEach((button) => {
        button.addEventListener('click', () => {
            editingAchievementId = null;
            loadAndRenderAchievements(listContainer, currentPage);
        });
    });

    const editForm = container.querySelector('.edit-achievement-form');
    if (!editForm) return;

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = form.querySelector('button[type="submit"]');
        const formData = new FormData();

        formData.append('name', form.elements.name.value);
        formData.append('description', form.elements.description.value);
        formData.append('xpReward', form.elements.xpReward.value);
        formData.append('rewardType', form.elements.rewardType.value);

        const iconFile = form.elements.iconFile.files[0];
        if (iconFile) {
            formData.append('iconFile', iconFile);
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        try {
            await fetchApi(`/api/admin/achievements/${form.dataset.id}`, { method: 'PUT', body: formData });
            showToast('Conquista atualizada.', 'success');
            editingAchievementId = null;
            loadAndRenderAchievements(listContainer, currentPage);
        } catch (error) {
            showToast(`Erro ao salvar: ${error.message}`, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });
}

async function loadAndRenderBackgrounds(container, page = 0) {
    try {
        const backgroundPage = await fetchApi(`/api/backgrounds?page=${page}&size=${ITEM_PAGE_SIZE}&sort=name,asc`);
        const backgrounds = backgroundPage.content;

        if (backgroundPage.totalElements > 0) {
            container.innerHTML = backgrounds.map((background) => {
                const previewStyle = background.imageUrl
                    ? `background: url(${resolveAssetUrl(background.imageUrl)}) center/cover no-repeat; color: ${background.textColor};`
                    : `background: ${background.gradient || 'linear-gradient(135deg, #27408b, #5271b2)'}; color: ${background.textColor};`;

                if (editingBackgroundId === background.id) {
                    return `
                        <div class="list-item-preview editing-row">
                            <form class="edit-background-form" data-id="${background.id}">
                                <div class="form-group">
                                    <label>Nome</label>
                                    <input type="text" name="name" value="${background.name}" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Cor do texto</label>
                                    <input type="text" name="textColor" value="${background.textColor}" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Nova imagem</label>
                                    <input type="file" name="imageFile" class="form-control" accept="image/*">
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn-action save">
                                        <i class="fa-solid fa-check"></i> Salvar
                                    </button>
                                    <button type="button" class="btn-action cancel cancel-edit-bg-btn">
                                        <i class="fa-solid fa-times"></i> Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    `;
                }

                return `
                    <div class="list-item-preview list-item-preview-asset">
                        ${renderBackgroundPreview(background, previewStyle)}
                        <span class="list-item-copy">
                            <strong>${background.name}</strong>
                            <small>${background.imageUrl ? 'Imagem publicada' : 'Gradiente configurado'}</small>
                        </span>
                        <div class="item-actions">
                            <button class="btn-action-icon edit edit-bg-btn" title="Editar fundo" data-id="${background.id}">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button class="btn-action-icon delete delete-bg-btn" title="Apagar fundo" data-id="${background.id}" data-name="${background.name}">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>Nenhum fundo criado ainda.</p>';
        }

        syncMetric(container, 'background', backgroundPage.totalElements);

        const paginationContainer = container.nextElementSibling;
        if (backgroundPage.totalPages > 1) {
            renderPaginationControls(paginationContainer, container, backgroundPage, loadAndRenderBackgrounds);
        } else {
            paginationContainer.innerHTML = '';
        }

        addBackgroundListeners(container, page);
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar fundos: ${error.message}</p>`;
    }
}

function addBackgroundListeners(container, currentPage) {
    const listContainer = document.getElementById('backgrounds-list');

    container.querySelectorAll('.delete-bg-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            const { id, name } = event.currentTarget.dataset;

            showDeleteModal(
                'Apagar fundo',
                `Tem certeza que quer apagar o fundo "<strong>${name}</strong>"?`,
                async () => {
                    try {
                        await fetchApi(`/api/admin/backgrounds/${id}`, { method: 'DELETE' });
                        showToast('Fundo apagado.', 'success');
                        editingBackgroundId = null;
                        loadAndRenderBackgrounds(listContainer, currentPage);
                    } catch (error) {
                        showToast(`Erro ao apagar: ${error.message}`, 'error');
                    }
                }
            );
        });
    });

    container.querySelectorAll('.edit-bg-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            editingBackgroundId = Number.parseInt(event.currentTarget.dataset.id, 10);
            loadAndRenderBackgrounds(listContainer, currentPage);
        });
    });

    container.querySelectorAll('.cancel-edit-bg-btn').forEach((button) => {
        button.addEventListener('click', () => {
            editingBackgroundId = null;
            loadAndRenderBackgrounds(listContainer, currentPage);
        });
    });

    const editForm = container.querySelector('.edit-background-form');
    if (!editForm) return;

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = form.querySelector('button[type="submit"]');
        const formData = new FormData();

        formData.append('name', form.elements.name.value);
        formData.append('textColor', form.elements.textColor.value);

        const imageFile = form.elements.imageFile.files[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        try {
            await fetchApi(`/api/admin/backgrounds/${form.dataset.id}`, { method: 'PUT', body: formData });
            showToast('Fundo atualizado.', 'success');
            editingBackgroundId = null;
            loadAndRenderBackgrounds(listContainer, currentPage);
        } catch (error) {
            showToast(`Erro ao salvar: ${error.message}`, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });
}

async function loadAndRenderSpecialties(container, page = 0) {
    try {
        const specialtyPage = await fetchApi(`/api/specialties?page=${page}&size=${ITEM_PAGE_SIZE}&sort=name,asc`);
        const specialties = specialtyPage.content;

        if (specialtyPage.totalElements > 0) {
            container.innerHTML = specialties.map((specialty) => {
                const accentColor = specialty.accentColor || '#27408b';

                if (editingSpecialtyId === specialty.id) {
                    return `
                        <div class="list-item-preview editing-row specialty-edit-row">
                            <form class="edit-specialty-form" data-id="${specialty.id}">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Nome</label>
                                        <input type="text" name="name" value="${specialty.name}" class="form-control" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Area</label>
                                        <input type="text" name="area" value="${specialty.area}" class="form-control" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Descricao</label>
                                    <textarea name="description" class="form-control" required>${specialty.description}</textarea>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Icone</label>
                                        <input type="text" name="iconName" value="${specialty.iconName}" class="form-control" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Cor</label>
                                        <input type="color" name="accentColor" value="${accentColor}" class="form-control specialty-color-input" required>
                                    </div>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn-action save">
                                        <i class="fa-solid fa-check"></i> Salvar
                                    </button>
                                    <button type="button" class="btn-action cancel cancel-edit-specialty-btn">
                                        <i class="fa-solid fa-times"></i> Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    `;
                }

                return `
                    <div class="list-item-preview specialty-card">
                        <div class="specialty-icon-preview" style="background: ${accentColor};">
                            <span>${specialty.iconName}</span>
                        </div>
                        <span class="list-item-copy">
                            <strong>${specialty.name}</strong>
                            <small>${specialty.area} - ${truncate(specialty.description, 80)}</small>
                        </span>
                        <div class="item-actions">
                            <button class="btn-action-icon edit edit-specialty-btn" title="Editar especialidade" data-id="${specialty.id}">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button class="btn-action-icon delete delete-specialty-btn" title="Apagar especialidade" data-id="${specialty.id}" data-name="${specialty.name}">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>Nenhuma especialidade criada ainda.</p>';
        }

        syncMetric(container, 'specialty', specialtyPage.totalElements);

        const paginationContainer = container.nextElementSibling;
        if (specialtyPage.totalPages > 1) {
            renderPaginationControls(paginationContainer, container, specialtyPage, loadAndRenderSpecialties);
        } else {
            paginationContainer.innerHTML = '';
        }

        addSpecialtyListeners(container, page);
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar especialidades: ${error.message}</p>`;
    }
}

function addSpecialtyListeners(container, currentPage) {
    const listContainer = document.getElementById('specialties-list');

    container.querySelectorAll('.delete-specialty-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            const { id, name } = event.currentTarget.dataset;

            showDeleteModal(
                'Apagar especialidade',
                `Tem certeza que quer apagar a especialidade "<strong>${name}</strong>"?`,
                async () => {
                    try {
                        await fetchApi(`/api/admin/specialties/${id}`, { method: 'DELETE' });
                        showToast('Especialidade apagada.', 'success');
                        editingSpecialtyId = null;
                        loadAndRenderSpecialties(listContainer, currentPage);
                    } catch (error) {
                        showToast(`Erro ao apagar: ${error.message}`, 'error');
                    }
                }
            );
        });
    });

    container.querySelectorAll('.edit-specialty-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            editingSpecialtyId = Number.parseInt(event.currentTarget.dataset.id, 10);
            loadAndRenderSpecialties(listContainer, currentPage);
        });
    });

    container.querySelectorAll('.cancel-edit-specialty-btn').forEach((button) => {
        button.addEventListener('click', () => {
            editingSpecialtyId = null;
            loadAndRenderSpecialties(listContainer, currentPage);
        });
    });

    const editForm = container.querySelector('.edit-specialty-form');
    if (!editForm) return;

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = form.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        try {
            await fetchApi(`/api/admin/specialties/${form.dataset.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.elements.name.value,
                    area: form.elements.area.value,
                    description: form.elements.description.value,
                    iconName: form.elements.iconName.value,
                    accentColor: form.elements.accentColor.value
                })
            });
            showToast('Especialidade atualizada.', 'success');
            editingSpecialtyId = null;
            loadAndRenderSpecialties(listContainer, currentPage);
        } catch (error) {
            showToast(`Erro ao salvar: ${error.message}`, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });
}

async function loadAndRenderRequirements(container, page = 0) {
    try {
        const requirementPage = await fetchApi(`/api/requirements?page=${page}&size=${ITEM_PAGE_SIZE}&sort=displayOrder,asc`);
        const requirements = requirementPage.content;

        if (requirementPage.totalElements > 0) {
            container.innerHTML = requirements.map((requirement) => {
                if (editingRequirementId === requirement.id) {
                    return `
                        <div class="list-item-preview editing-row">
                            <form class="edit-requirement-form" data-id="${requirement.id}">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Titulo</label>
                                        <input type="text" name="title" value="${requirement.title}" class="form-control" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Categoria</label>
                                        <input type="text" name="category" value="${requirement.category}" class="form-control" required>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Classe</label>
                                        <input type="text" name="classLevel" value="${requirement.classLevel}" class="form-control" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Ordem</label>
                                        <input type="number" name="displayOrder" value="${requirement.displayOrder}" class="form-control" min="0" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Descricao</label>
                                    <textarea name="description" class="form-control" required>${requirement.description}</textarea>
                                </div>
                                <div class="form-group">
                                    <label>Icone</label>
                                    <input type="text" name="iconName" value="${requirement.iconName}" class="form-control" required>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn-action save">
                                        <i class="fa-solid fa-check"></i> Salvar
                                    </button>
                                    <button type="button" class="btn-action cancel cancel-edit-requirement-btn">
                                        <i class="fa-solid fa-times"></i> Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    `;
                }

                return `
                    <div class="list-item-preview">
                        <div class="specialty-icon-preview requirement-icon-preview">
                            <span>${requirement.iconName}</span>
                        </div>
                        <span class="list-item-copy">
                            <strong>${requirement.displayOrder}. ${requirement.title}</strong>
                            <small>${requirement.classLevel} - ${requirement.category}</small>
                            <small>${truncate(requirement.description, 80)}</small>
                        </span>
                        <div class="item-actions">
                            <button class="btn-action-icon edit edit-requirement-btn" title="Editar requisito" data-id="${requirement.id}">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button class="btn-action-icon delete delete-requirement-btn" title="Apagar requisito" data-id="${requirement.id}" data-name="${requirement.title}">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>Nenhum requisito criado ainda.</p>';
        }

        syncMetric(container, 'requirement', requirementPage.totalElements);

        const paginationContainer = container.nextElementSibling;
        if (requirementPage.totalPages > 1) {
            renderPaginationControls(paginationContainer, container, requirementPage, loadAndRenderRequirements);
        } else {
            paginationContainer.innerHTML = '';
        }

        addRequirementListeners(container, page);
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar requisitos: ${error.message}</p>`;
    }
}

function addRequirementListeners(container, currentPage) {
    const listContainer = document.getElementById('requirements-list');

    container.querySelectorAll('.delete-requirement-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            const { id, name } = event.currentTarget.dataset;

            showDeleteModal(
                'Apagar requisito',
                `Tem certeza que quer apagar o requisito "<strong>${name}</strong>"?`,
                async () => {
                    try {
                        await fetchApi(`/api/admin/requirements/${id}`, { method: 'DELETE' });
                        showToast('Requisito apagado.', 'success');
                        editingRequirementId = null;
                        loadAndRenderRequirements(listContainer, currentPage);
                    } catch (error) {
                        showToast(`Erro ao apagar: ${error.message}`, 'error');
                    }
                }
            );
        });
    });

    container.querySelectorAll('.edit-requirement-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            editingRequirementId = Number.parseInt(event.currentTarget.dataset.id, 10);
            loadAndRenderRequirements(listContainer, currentPage);
        });
    });

    container.querySelectorAll('.cancel-edit-requirement-btn').forEach((button) => {
        button.addEventListener('click', () => {
            editingRequirementId = null;
            loadAndRenderRequirements(listContainer, currentPage);
        });
    });

    const editForm = container.querySelector('.edit-requirement-form');
    if (!editForm) return;

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = form.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        try {
            await fetchApi(`/api/admin/requirements/${form.dataset.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.elements.title.value,
                    category: form.elements.category.value,
                    classLevel: form.elements.classLevel.value,
                    description: form.elements.description.value,
                    iconName: form.elements.iconName.value,
                    displayOrder: Number.parseInt(form.elements.displayOrder.value, 10)
                })
            });
            showToast('Requisito atualizado.', 'success');
            editingRequirementId = null;
            loadAndRenderRequirements(listContainer, currentPage);
        } catch (error) {
            showToast(`Erro ao salvar: ${error.message}`, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });
}

export function renderCreateItemView(viewElement) {
    viewElement.innerHTML = `
        <div class="create-item-shell" data-create-item-root="true">
            <div class="admin-widget create-item-hero">
                <div class="create-item-heading">
                    <span class="create-item-kicker">Central de conteudo</span>
                    <h2>Cadastros que alimentam o web admin e o app do aluno</h2>
                    <p>Escolha uma frente de cadastro, publique o conteudo mestre e mantenha o catalogo consistente entre os dois produtos.</p>
                </div>
                <div class="create-item-metrics">
                    <div class="create-item-metric-card">
                        <span class="metric-label">Gamificacao</span>
                        <strong data-metric-value="achievement">0</strong>
                    </div>
                    <div class="create-item-metric-card">
                        <span class="metric-label">Fundos</span>
                        <strong data-metric-value="background">0</strong>
                    </div>
                    <div class="create-item-metric-card">
                        <span class="metric-label">Especialidades</span>
                        <strong data-metric-value="specialty">0</strong>
                    </div>
                    <div class="create-item-metric-card">
                        <span class="metric-label">Requisitos</span>
                        <strong data-metric-value="requirement">0</strong>
                    </div>
                </div>
            </div>

            <div class="create-item-mode-grid">
                <button type="button" class="create-mode-card active" data-create-mode="achievement">
                    <i class="fa-solid fa-trophy"></i>
                    <strong>Gamificacao</strong>
                    <span>Conquistas, emblemas e selos</span>
                </button>
                <button type="button" class="create-mode-card" data-create-mode="background">
                    <i class="fa-solid fa-panorama"></i>
                    <strong>Fundos</strong>
                    <span>Perfis e campanhas visuais</span>
                </button>
                <button type="button" class="create-mode-card" data-create-mode="specialty">
                    <i class="fa-solid fa-compass"></i>
                    <strong>Especialidades</strong>
                    <span>Catalogo do aprendizado</span>
                </button>
                <button type="button" class="create-mode-card" data-create-mode="requirement">
                    <i class="fa-solid fa-list-check"></i>
                    <strong>Requisitos</strong>
                    <span>Trilha de progresso por classe</span>
                </button>
            </div>

            <div class="admin-widget create-item-workspace theme-achievement">
                <div class="create-item-workspace-header">
                    <div>
                        <span class="create-item-kicker">Modo ativo</span>
                        <h3 data-create-title>Gamificacao</h3>
                        <p data-create-subtitle>Conquistas, emblemas e selos que liberam identidade e progresso.</p>
                    </div>
                    <div class="create-item-tip-card">
                        <i class="fa-solid fa-bolt"></i>
                        <span>Cadastre primeiro no web e depois conecte o mobile a estes mesmos contratos.</span>
                    </div>
                </div>

                <form id="create-achievement-form" class="user-form create-entity-form" data-form-mode="achievement">
                    <h4>Novo item de gamificacao</h4>
                    <div class="create-form-intro"><span>Emblemas e selos devem ter criterio claro e leitura curta no mobile.</span></div>
                    <div class="form-group">
                        <label for="ach-name">Nome</label>
                        <input type="text" id="ach-name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="ach-description">Descricao e criterio</label>
                        <textarea id="ach-description" class="form-control" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="ach-xp-reward">XP</label>
                            <input type="number" id="ach-xp-reward" class="form-control" min="0" value="50" required>
                        </div>
                        <div class="form-group">
                            <label for="ach-reward-type">Tipo</label>
                            <select id="ach-reward-type" class="form-control" required>
                                <option value="BADGE">Emblema</option>
                                <option value="SEAL">Selo</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="ach-icon-file">Icone</label>
                        <input type="file" id="ach-icon-file" class="form-control" accept="image/*" required>
                    </div>
                    <button type="submit" class="action-btn">Criar item de gamificacao</button>
                </form>

                <form id="create-background-form" class="user-form create-entity-form" data-form-mode="background" style="display: none;">
                    <h4>Novo fundo de perfil</h4>
                    <div class="create-form-intro"><span>Use fundos para colecoes, campanhas e recompensas de longa duracao.</span></div>
                    <div class="form-group">
                        <label for="bg-name">Nome</label>
                        <input type="text" id="bg-name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="bg-text-color">Cor do texto</label>
                        <input type="text" id="bg-text-color" class="form-control" value="#FFFFFF" required>
                    </div>
                    <div class="form-group">
                        <label for="bg-image-file">Imagem</label>
                        <input type="file" id="bg-image-file" class="form-control" accept="image/*" required>
                    </div>
                    <button type="submit" class="action-btn">Criar fundo</button>
                </form>

                <form id="create-specialty-form" class="user-form create-entity-form" data-form-mode="specialty" style="display: none;">
                    <h4>Nova especialidade</h4>
                    <div class="create-form-intro"><span>Pense em nome curto, area forte e um icone reconhecivel para o aluno bater o olho.</span></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="spec-name">Nome</label>
                            <input type="text" id="spec-name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="spec-area">Area</label>
                            <input type="text" id="spec-area" class="form-control" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="spec-description">Descricao</label>
                        <textarea id="spec-description" class="form-control" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="spec-icon-name">Icone</label>
                            <input type="text" id="spec-icon-name" class="form-control" placeholder="fa-compass" required>
                        </div>
                        <div class="form-group">
                            <label for="spec-color">Cor</label>
                            <input type="color" id="spec-color" class="form-control specialty-color-input" value="#27408b" required>
                        </div>
                    </div>
                    <button type="submit" class="action-btn">Criar especialidade</button>
                </form>

                <form id="create-requirement-form" class="user-form create-entity-form" data-form-mode="requirement" style="display: none;">
                    <h4>Novo requisito</h4>
                    <div class="create-form-intro"><span>Organize a trilha por classe e ordem para o aluno enxergar progresso real no app.</span></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="req-title">Titulo</label>
                            <input type="text" id="req-title" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="req-category">Categoria</label>
                            <input type="text" id="req-category" class="form-control" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="req-class-level">Classe</label>
                            <input type="text" id="req-class-level" class="form-control" placeholder="Amigo" required>
                        </div>
                        <div class="form-group">
                            <label for="req-display-order">Ordem</label>
                            <input type="number" id="req-display-order" class="form-control" min="0" value="1" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="req-description">Descricao</label>
                        <textarea id="req-description" class="form-control" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="req-icon-name">Icone</label>
                        <input type="text" id="req-icon-name" class="form-control" placeholder="book" required>
                    </div>
                    <button type="submit" class="action-btn">Criar requisito</button>
                </form>
            </div>

            <div class="admin-widget create-item-catalog">
                <div class="create-item-catalog-header">
                    <div>
                        <span class="create-item-kicker">Catalogo</span>
                        <h3>Itens publicados</h3>
                        <p>Mantenha a lista limpa, revisando o mesmo contexto que esta ativo na criacao.</p>
                    </div>
                </div>
                <div id="achievements-list-container" data-list-mode="achievement">
                    <h3>Conquistas, emblemas e selos</h3>
                    <div id="achievements-list"></div>
                    <div id="achievements-list-pagination" class="pagination-controls"></div>
                </div>
                <div id="backgrounds-list-container" data-list-mode="background" style="display: none;">
                    <h3>Fundos de perfil</h3>
                    <div id="backgrounds-list"></div>
                    <div id="backgrounds-list-pagination" class="pagination-controls"></div>
                </div>
                <div id="specialties-list-container" data-list-mode="specialty" style="display: none;">
                    <h3>Especialidades</h3>
                    <div id="specialties-list"></div>
                    <div id="specialties-list-pagination" class="pagination-controls"></div>
                </div>
                <div id="requirements-list-container" data-list-mode="requirement" style="display: none;">
                    <h3>Requisitos</h3>
                    <div id="requirements-list"></div>
                    <div id="requirements-list-pagination" class="pagination-controls"></div>
                </div>
            </div>
        </div>
    `;

    const achievementForm = viewElement.querySelector('#create-achievement-form');
    const backgroundForm = viewElement.querySelector('#create-background-form');
    const specialtyForm = viewElement.querySelector('#create-specialty-form');
    const requirementForm = viewElement.querySelector('#create-requirement-form');

    viewElement.querySelectorAll('[data-create-mode]').forEach((button) => {
        button.addEventListener('click', () => {
            setActiveCreationMode(viewElement, button.dataset.createMode);
        });
    });

    achievementForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = achievementForm.querySelector('button[type="submit"]');
        const iconFile = document.getElementById('ach-icon-file').files[0];

        if (!iconFile) {
            showToast('Selecione um icone.', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';

        const formData = new FormData();
        formData.append('name', document.getElementById('ach-name').value);
        formData.append('description', document.getElementById('ach-description').value);
        formData.append('xpReward', document.getElementById('ach-xp-reward').value);
        formData.append('rewardType', document.getElementById('ach-reward-type').value);
        formData.append('iconFile', iconFile);

        try {
            await fetchApi('/api/admin/achievements', { method: 'POST', body: formData });
            showToast('Conquista criada com sucesso.', 'success');
            achievementForm.reset();
            document.getElementById('ach-xp-reward').value = '50';
            loadAndRenderAchievements(viewElement.querySelector('#achievements-list'), 0);
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar item de gamificacao';
        }
    });

    backgroundForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = backgroundForm.querySelector('button[type="submit"]');
        const imageFile = document.getElementById('bg-image-file').files[0];

        if (!imageFile) {
            showToast('Selecione uma imagem.', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';

        const formData = new FormData();
        formData.append('name', document.getElementById('bg-name').value);
        formData.append('textColor', document.getElementById('bg-text-color').value);
        formData.append('imageFile', imageFile);

        try {
            await fetchApi('/api/admin/backgrounds', { method: 'POST', body: formData });
            showToast('Fundo criado com sucesso.', 'success');
            backgroundForm.reset();
            document.getElementById('bg-text-color').value = '#FFFFFF';
            loadAndRenderBackgrounds(viewElement.querySelector('#backgrounds-list'), 0);
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar fundo';
        }
    });

    specialtyForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = specialtyForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';

        try {
            await fetchApi('/api/admin/specialties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('spec-name').value,
                    area: document.getElementById('spec-area').value,
                    description: document.getElementById('spec-description').value,
                    iconName: document.getElementById('spec-icon-name').value,
                    accentColor: document.getElementById('spec-color').value
                })
            });
            showToast('Especialidade criada com sucesso.', 'success');
            specialtyForm.reset();
            document.getElementById('spec-color').value = '#27408b';
            loadAndRenderSpecialties(viewElement.querySelector('#specialties-list'), 0);
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar especialidade';
        }
    });

    requirementForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = requirementForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';

        try {
            await fetchApi('/api/admin/requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: document.getElementById('req-title').value,
                    category: document.getElementById('req-category').value,
                    classLevel: document.getElementById('req-class-level').value,
                    description: document.getElementById('req-description').value,
                    iconName: document.getElementById('req-icon-name').value,
                    displayOrder: Number.parseInt(document.getElementById('req-display-order').value, 10)
                })
            });
            showToast('Requisito criado com sucesso.', 'success');
            requirementForm.reset();
            document.getElementById('req-display-order').value = '1';
            loadAndRenderRequirements(viewElement.querySelector('#requirements-list'), 0);
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar requisito';
        }
    });

    loadAndRenderAchievements(viewElement.querySelector('#achievements-list'), 0);
    loadAndRenderBackgrounds(viewElement.querySelector('#backgrounds-list'), 0);
    loadAndRenderSpecialties(viewElement.querySelector('#specialties-list'), 0);
    loadAndRenderRequirements(viewElement.querySelector('#requirements-list'), 0);
    setActiveCreationMode(viewElement, 'achievement');
}
