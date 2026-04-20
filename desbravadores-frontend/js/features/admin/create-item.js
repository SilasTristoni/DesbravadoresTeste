import { fetchApi } from '../../core/apiClient.js';
import { showModal } from '../../components/modal.js';
import { resolveAssetUrl } from '../../core/url.js';
import { showToast } from '../../ui/toast.js';

const ITEM_PAGE_SIZE = 5;

const DEFAULT_METADATA = {
    rewardTypes: ['BADGE', 'SEAL'],
    requirementClassLevels: ['Amigo', 'Companheiro', 'Pesquisador', 'Pioneiro', 'Excursionista', 'Guia'],
    specialtyAreas: ['Natureza', 'Servicos', 'Artes Manuais', 'Saude', 'Tecnologia', 'Aventura'],
    suggestedRequirementIcons: ['book', 'flag', 'people', 'leaf', 'shield', 'compass'],
    suggestedSpecialtyIcons: ['fa-compass', 'fa-fire', 'fa-tree', 'fa-heart-pulse', 'fa-water', 'fa-hammer'],
    suggestedColors: ['#27408b', '#386641', '#d97706', '#0f766e', '#b91c1c', '#7c3aed']
};

const BACKGROUND_GRADIENTS = [
    'linear-gradient(135deg, #27408b, #386641)',
    'linear-gradient(135deg, #1d4ed8, #0f766e)',
    'linear-gradient(135deg, #b45309, #b91c1c)',
    'linear-gradient(135deg, #7c3aed, #27408b)'
];

const ICON_SIZE_PRESETS = [24, 32, 40, 48, 56, 64, 72, 96];

const EMPTY_SUMMARY = {
    achievements: 0,
    backgrounds: 0,
    specialties: 0,
    requirements: 0
};

const CATALOG_KINDS = [
    {
        key: 'achievement',
        title: 'Gamificacao',
        subtitle: 'Conquistas, emblemas e selos para recompensas e identidade.',
        iconClass: 'fa-trophy',
        identifierLabel: 'Tipo',
        contextLabel: 'Regra / Uso',
        availabilityLabel: 'Liberado para conceder',
        summaryKey: 'achievements',
        sortQuery: 'sort=name,asc',
        createButtonLabel: 'Criar e liberar conquista',
        updateButtonLabel: 'Salvar ajustes',
        releaseDescription: 'Crie e depois conceda no perfil gerido. Ao salvar, o item entra no catalogo administrativo para distribuicao.',
        templates: [
            {
                label: 'Selo de presenca',
                values: {
                    name: 'Selo de Presenca',
                    description: 'Reconhece o aluno que manteve constancia nas reunioes e atividades recentes.',
                    rewardType: 'SEAL',
                    xpReward: 25
                }
            },
            {
                label: 'Emblema de lideranca',
                values: {
                    name: 'Emblema de Lideranca',
                    description: 'Valoriza quem assumiu responsabilidade, ajudou a unidade e puxou o grupo para frente.',
                    rewardType: 'BADGE',
                    xpReward: 100
                }
            }
        ],
        getDefaultValues(metadata) {
            return {
                name: '',
                description: '',
                rewardType: metadata.rewardTypes?.[0] || 'BADGE',
                xpReward: 50
            };
        },
        getFields(metadata, mode) {
            return [
                [
                    { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Ex: Emblema de Lideranca' }
                ],
                [
                    { name: 'description', label: 'Descricao e criterio', type: 'textarea', required: true, rows: 4, placeholder: 'Explique em que situacao o item deve ser concedido.' }
                ],
                [
                    { name: 'rewardType', label: 'Tipo', type: 'select', required: true, options: (metadata.rewardTypes || ['BADGE', 'SEAL']).map((value) => ({ value, label: formatRewardType(value) })) },
                    { name: 'xpReward', label: 'XP', type: 'number', required: true, min: 0, step: 1 }
                ],
                [
                    {
                        name: 'iconFile',
                        label: 'Icone',
                        type: 'file',
                        accept: 'image/*',
                        required: mode === 'create',
                        hint: mode === 'create' ? 'Envie a imagem que o aluno vai ver ao desbloquear.' : 'Envie somente se quiser trocar o icone atual.'
                    }
                ]
            ];
        },
        getInitialValues(item, metadata) {
            return {
                ...this.getDefaultValues(metadata),
                name: item.title || '',
                description: item.subtitle || '',
                rewardType: item.identifier || metadata.rewardTypes?.[0] || 'BADGE',
                xpReward: parseTagValue(item.preview?.tags, 'xp') || 50
            };
        },
        buildCreateRequest(form) {
            const iconFile = form.elements.iconFile.files[0];
            if (!iconFile) {
                throw new Error('Selecione um icone para a conquista.');
            }

            const formData = new FormData();
            formData.append('name', form.elements.name.value.trim());
            formData.append('description', form.elements.description.value.trim());
            formData.append('rewardType', form.elements.rewardType.value);
            formData.append('xpReward', form.elements.xpReward.value);
            formData.append('iconFile', iconFile);

            return {
                endpoint: '/api/admin/achievements',
                options: { method: 'POST', body: formData }
            };
        },
        buildUpdateRequest(itemId, form) {
            const formData = new FormData();
            formData.append('name', form.elements.name.value.trim());
            formData.append('description', form.elements.description.value.trim());
            formData.append('rewardType', form.elements.rewardType.value);
            formData.append('xpReward', form.elements.xpReward.value);

            const iconFile = form.elements.iconFile.files[0];
            if (iconFile) {
                formData.append('iconFile', iconFile);
            }

            return {
                endpoint: `/api/admin/achievements/${itemId}`,
                options: { method: 'PUT', body: formData }
            };
        },
        getDeleteEndpoint(itemId) {
            return `/api/admin/achievements/${itemId}`;
        }
    },
    {
        key: 'background',
        title: 'Fundos',
        subtitle: 'Cenarios visuais para perfil, campanhas e recompensas especiais.',
        iconClass: 'fa-panorama',
        identifierLabel: 'Cor do texto',
        contextLabel: 'Estilo / Entrega',
        availabilityLabel: 'Liberado no perfil',
        summaryKey: 'backgrounds',
        sortQuery: 'sort=name,asc',
        createButtonLabel: 'Criar e liberar fundo',
        updateButtonLabel: 'Salvar ajustes',
        releaseDescription: 'Ao salvar, o fundo passa a existir no catalogo do sistema e pode ser usado em distribuicoes e selecoes de perfil.',
        templates: [
            {
                label: 'Campanha azul',
                values: {
                    name: 'Campanha Azul',
                    assetMode: 'gradient',
                    gradient: BACKGROUND_GRADIENTS[0],
                    textColor: '#FFFFFF'
                }
            },
            {
                label: 'Destaque bronze',
                values: {
                    name: 'Destaque Bronze',
                    assetMode: 'gradient',
                    gradient: BACKGROUND_GRADIENTS[2],
                    textColor: '#FFF7ED'
                }
            }
        ],
        getDefaultValues() {
            return {
                name: '',
                assetMode: 'gradient',
                textColor: '#FFFFFF',
                gradient: BACKGROUND_GRADIENTS[0]
            };
        },
        getFields(metadata, mode, values, context = {}) {
            const assetModeLocked = mode === 'edit' && context.initialValues?.assetMode === 'image';

            return [
                [
                    { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Ex: Fundo da Campanha de Inverno' }
                ],
                [
                    {
                        name: 'assetMode',
                        label: 'Formato visual',
                        type: 'select',
                        required: true,
                        disabled: assetModeLocked,
                        options: [
                            { value: 'gradient', label: 'Gradiente CSS' },
                            { value: 'image', label: 'Imagem' }
                        ],
                        hint: assetModeLocked ? 'Este fundo ja usa imagem. No backend atual a troca para gradiente nao remove a imagem existente.' : 'Use gradiente para cadastros rapidos e imagem para artes finais.'
                    },
                    {
                        name: 'textColor',
                        label: 'Cor do texto',
                        type: 'color',
                        required: true,
                        palette: metadata.suggestedColors || DEFAULT_METADATA.suggestedColors
                    }
                ],
                [
                    {
                        name: 'gradient',
                        label: 'Gradiente',
                        type: 'text',
                        required: true,
                        when: (currentValues) => currentValues.assetMode === 'gradient',
                        placeholder: 'linear-gradient(135deg, #27408b, #386641)',
                        suggestions: BACKGROUND_GRADIENTS,
                        hint: 'Cole um CSS valido de gradiente para montar um fundo sem precisar subir imagem.'
                    }
                ],
                [
                    {
                        name: 'imageFile',
                        label: 'Imagem',
                        type: 'file',
                        accept: 'image/*',
                        required: mode === 'create',
                        when: (currentValues) => currentValues.assetMode === 'image',
                        hint: mode === 'create' ? 'Use uma arte pronta em proporcao vertical.' : 'Envie uma nova imagem somente se quiser substituir a atual.'
                    }
                ]
            ];
        },
        getInitialValues(item) {
            return {
                name: item.title || '',
                assetMode: item.preview?.previewStyle === 'image' ? 'image' : 'gradient',
                textColor: normalizeColorValue(item.identifier || item.preview?.accentColor || '#FFFFFF'),
                gradient: item.preview?.gradient || BACKGROUND_GRADIENTS[0]
            };
        },
        buildCreateRequest(form) {
            const formData = new FormData();
            const assetMode = form.elements.assetMode.value;

            formData.append('name', form.elements.name.value.trim());
            formData.append('textColor', form.elements.textColor.value);

            if (assetMode === 'gradient') {
                const gradient = form.elements.gradient.value.trim();
                if (!gradient) {
                    throw new Error('Informe um gradiente para este fundo.');
                }
                formData.append('gradient', gradient);
            } else {
                const imageFile = form.elements.imageFile.files[0];
                if (!imageFile) {
                    throw new Error('Envie uma imagem para o fundo.');
                }
                formData.append('imageFile', imageFile);
            }

            return {
                endpoint: '/api/admin/backgrounds',
                options: { method: 'POST', body: formData }
            };
        },
        buildUpdateRequest(itemId, form, context = {}) {
            const formData = new FormData();
            const assetMode = form.elements.assetMode.value;

            formData.append('name', form.elements.name.value.trim());
            formData.append('textColor', form.elements.textColor.value);

            if (assetMode === 'gradient') {
                const gradient = form.elements.gradient.value.trim();
                if (!gradient) {
                    throw new Error('Informe um gradiente para manter este fundo.');
                }
                formData.append('gradient', gradient);
            }

            if (assetMode === 'image') {
                const imageFile = form.elements.imageFile.files[0];
                const hadImageBefore = context.initialValues?.assetMode === 'image';
                if (!imageFile && !hadImageBefore) {
                    throw new Error('Envie uma imagem para concluir esta troca.');
                }
                if (imageFile) {
                    formData.append('imageFile', imageFile);
                }
            }

            return {
                endpoint: `/api/admin/backgrounds/${itemId}`,
                options: { method: 'PUT', body: formData }
            };
        },
        getDeleteEndpoint(itemId) {
            return `/api/admin/backgrounds/${itemId}`;
        }
    },
    {
        key: 'specialty',
        title: 'Especialidades',
        subtitle: 'Trilhas de aprendizado com icone, area e identidade visual claras.',
        iconClass: 'fa-compass',
        identifierLabel: 'Area',
        contextLabel: 'Icone / Visual',
        availabilityLabel: 'Liberado na trilha',
        summaryKey: 'specialties',
        sortQuery: 'sort=name,asc',
        createButtonLabel: 'Criar e liberar especialidade',
        updateButtonLabel: 'Salvar ajustes',
        releaseDescription: 'Assim que salvar, a especialidade entra na trilha do aluno e pode ser acompanhada no app e no admin.',
        templates: [
            {
                label: 'Primeiros socorros',
                values: {
                    name: 'Primeiros Socorros',
                    area: 'Saude',
                    description: 'Ensina procedimentos basicos de prevencao, avaliacao e resposta inicial em emergencias.',
                    iconMode: 'library',
                    iconLibraryChoice: 'fa-heart-pulse',
                    iconCustomName: '',
                    iconSize: 52,
                    accentColor: '#b91c1c'
                }
            },
            {
                label: 'Orientacao',
                values: {
                    name: 'Orientacao',
                    area: 'Aventura',
                    description: 'Trilha para leitura de mapas, uso de bussola e deslocamento em campo.',
                    iconMode: 'library',
                    iconLibraryChoice: 'fa-compass',
                    iconCustomName: '',
                    iconSize: 52,
                    accentColor: '#27408b'
                }
            }
        ],
        getDefaultValues(metadata) {
            return {
                name: '',
                area: metadata.specialtyAreas?.[0] || 'Natureza',
                description: '',
                iconMode: 'library',
                iconLibraryChoice: metadata.suggestedSpecialtyIcons?.[0] || 'fa-compass',
                iconCustomName: '',
                iconSize: 48,
                accentColor: metadata.suggestedColors?.[0] || '#27408b'
            };
        },
        getFields(metadata) {
            return [
                [
                    { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Ex: Orientacao' }
                ],
                [
                    {
                        name: 'area',
                        label: 'Area',
                        type: 'text',
                        required: true,
                        suggestions: metadata.specialtyAreas || DEFAULT_METADATA.specialtyAreas,
                        placeholder: 'Ex: Natureza'
                    },
                    {
                        name: 'iconSize',
                        label: 'Tamanho do item',
                        type: 'number',
                        required: true,
                        min: 16,
                        step: 1
                    }
                ],
                [
                    {
                        name: 'iconMode',
                        label: 'Origem do icone',
                        type: 'select',
                        required: true,
                        options: [
                            { value: 'library', label: 'Biblioteca' },
                            { value: 'custom', label: 'Personalizado' },
                            { value: 'image', label: 'Imagem' }
                        ]
                    }
                ],
                [
                    {
                        name: 'iconLibraryChoice',
                        label: 'Lista de icones',
                        type: 'icon-picker',
                        required: true,
                        when: (currentValues) => currentValues.iconMode === 'library',
                        icons: metadata.suggestedSpecialtyIcons || DEFAULT_METADATA.suggestedSpecialtyIcons,
                        hint: 'Escolha um icone pronto da biblioteca com preview.'
                    }
                ],
                [
                    {
                        name: 'iconCustomName',
                        label: 'Icone personalizado',
                        type: 'text',
                        required: true,
                        when: (currentValues) => currentValues.iconMode === 'custom',
                        placeholder: 'Ex: fa-seedling',
                        hint: 'Informe o nome do icone Font Awesome, com ou sem prefixo fa-.'
                    }
                ],
                [
                    {
                        name: 'iconImageFile',
                        label: 'Imagem do item',
                        type: 'file',
                        accept: 'image/*',
                        required: false,
                        when: (currentValues) => currentValues.iconMode === 'image',
                        hint: 'Use uma imagem personalizada se o item nao existir na biblioteca.'
                    }
                ],
                [
                    { name: 'description', label: 'Descricao', type: 'textarea', required: true, rows: 4, placeholder: 'Descreva o que o aluno vai aprender e enxergar no app.' }
                ],
                [
                    {
                        name: 'accentColor',
                        label: 'Cor de destaque',
                        type: 'color',
                        required: true,
                        palette: metadata.suggestedColors || DEFAULT_METADATA.suggestedColors
                    }
                ]
            ];
        },
        getInitialValues(item, metadata) {
            const suggestions = metadata.suggestedSpecialtyIcons || DEFAULT_METADATA.suggestedSpecialtyIcons;
            const existingIconName = item.preview?.iconName || '';
            const iconMode = item.preview?.imageUrl ? 'image' : (isSuggestedIcon(existingIconName, suggestions) ? 'library' : 'custom');

            return {
                ...this.getDefaultValues(metadata),
                name: item.title || '',
                area: item.identifier || metadata.specialtyAreas?.[0] || '',
                description: item.subtitle || '',
                iconMode,
                iconLibraryChoice: isSuggestedIcon(existingIconName, suggestions) ? existingIconName : suggestions?.[0] || 'fa-compass',
                iconCustomName: iconMode === 'custom' ? existingIconName : '',
                iconSize: item.preview?.iconSize || 48,
                accentColor: normalizeColorValue(item.preview?.accentColor || metadata.suggestedColors?.[0] || '#27408b')
            };
        },
        buildCreateRequest(form) {
            const formData = new FormData();
            formData.append('name', form.elements.name.value.trim());
            formData.append('area', form.elements.area.value.trim());
            formData.append('description', form.elements.description.value.trim());
            formData.append('accentColor', form.elements.accentColor.value);
            appendIconAssetToFormData(formData, form);

            return {
                endpoint: '/api/admin/specialties',
                options: {
                    method: 'POST',
                    body: formData
                }
            };
        },
        buildUpdateRequest(itemId, form, context = {}) {
            const formData = new FormData();
            formData.append('name', form.elements.name.value.trim());
            formData.append('area', form.elements.area.value.trim());
            formData.append('description', form.elements.description.value.trim());
            formData.append('accentColor', form.elements.accentColor.value);
            appendIconAssetToFormData(formData, form, {
                keepExistingImage: context.initialValues?.iconMode === 'image'
            });

            return {
                endpoint: `/api/admin/specialties/${itemId}`,
                options: {
                    method: 'PUT',
                    body: formData
                }
            };
        },
        getDeleteEndpoint(itemId) {
            return `/api/admin/specialties/${itemId}`;
        }
    },
    {
        key: 'requirement',
        title: 'Requisitos',
        subtitle: 'Passos da progressao por classe com ordem, categoria e leitura clara.',
        iconClass: 'fa-list-check',
        identifierLabel: 'Classe',
        contextLabel: 'Categoria / Ordem',
        availabilityLabel: 'Liberado na progressao',
        summaryKey: 'requirements',
        sortQuery: 'sort=classLevel,asc&sort=displayOrder,asc',
        createButtonLabel: 'Criar e liberar requisito',
        updateButtonLabel: 'Salvar ajustes',
        releaseDescription: 'Os requisitos ficam imediatamente disponiveis na progressao do aluno, por isso vale revisar ordem e linguagem antes de salvar.',
        templates: [
            {
                label: 'Devocional da classe',
                values: {
                    title: 'Participar de um momento devocional',
                    classLevel: 'Amigo',
                    category: 'Vida Espiritual',
                    description: 'Concluir um momento devocional guiado e registrar os principais aprendizados.',
                    iconMode: 'library',
                    iconLibraryChoice: 'book',
                    iconCustomName: '',
                    iconSize: 44,
                    displayOrder: 1
                }
            },
            {
                label: 'Servico em equipe',
                values: {
                    title: 'Executar um servico comunitario',
                    classLevel: 'Companheiro',
                    category: 'Servico',
                    description: 'Participar de uma acao em equipe que beneficie a comunidade local.',
                    iconMode: 'library',
                    iconLibraryChoice: 'people',
                    iconCustomName: '',
                    iconSize: 44,
                    displayOrder: 2
                }
            }
        ],
        getDefaultValues(metadata) {
            return {
                title: '',
                classLevel: metadata.requirementClassLevels?.[0] || 'Amigo',
                category: '',
                description: '',
                iconMode: 'library',
                iconLibraryChoice: metadata.suggestedRequirementIcons?.[0] || 'book',
                iconCustomName: '',
                iconSize: 40,
                displayOrder: 1
            };
        },
        getFields(metadata) {
            return [
                [
                    { name: 'title', label: 'Titulo', type: 'text', required: true, placeholder: 'Ex: Concluir uma atividade devocional' }
                ],
                [
                    {
                        name: 'classLevel',
                        label: 'Classe',
                        type: 'text',
                        required: true,
                        suggestions: metadata.requirementClassLevels || DEFAULT_METADATA.requirementClassLevels,
                        placeholder: 'Ex: Amigo'
                    },
                    {
                        name: 'displayOrder',
                        label: 'Ordem',
                        type: 'number',
                        required: true,
                        min: 0,
                        step: 1
                    }
                ],
                [
                    { name: 'category', label: 'Categoria', type: 'text', required: true, placeholder: 'Ex: Vida Espiritual' },
                    {
                        name: 'iconSize',
                        label: 'Tamanho do item',
                        type: 'number',
                        required: true,
                        min: 16,
                        step: 1
                    }
                ],
                [
                    {
                        name: 'iconMode',
                        label: 'Origem do icone',
                        type: 'select',
                        required: true,
                        options: [
                            { value: 'library', label: 'Biblioteca' },
                            { value: 'custom', label: 'Personalizado' },
                            { value: 'image', label: 'Imagem' }
                        ]
                    }
                ],
                [
                    {
                        name: 'iconLibraryChoice',
                        label: 'Lista de icones',
                        type: 'icon-picker',
                        required: true,
                        when: (currentValues) => currentValues.iconMode === 'library',
                        icons: metadata.suggestedRequirementIcons || DEFAULT_METADATA.suggestedRequirementIcons,
                        hint: 'Escolha um icone padrao com preview da lista.'
                    }
                ],
                [
                    {
                        name: 'iconCustomName',
                        label: 'Icone personalizado',
                        type: 'text',
                        required: true,
                        when: (currentValues) => currentValues.iconMode === 'custom',
                        placeholder: 'Ex: fa-book-open ou book-open',
                        hint: 'Informe um icone Font Awesome diferente dos sugeridos.'
                    }
                ],
                [
                    {
                        name: 'iconImageFile',
                        label: 'Imagem do item',
                        type: 'file',
                        accept: 'image/*',
                        required: false,
                        when: (currentValues) => currentValues.iconMode === 'image',
                        hint: 'Envie uma imagem quando quiser sair do padrao de icones.'
                    }
                ],
                [
                    { name: 'description', label: 'Descricao', type: 'textarea', required: true, rows: 4, placeholder: 'Descreva exatamente o que precisa ser feito para cumprir este requisito.' }
                ]
            ];
        },
        getInitialValues(item, metadata) {
            const suggestions = metadata.suggestedRequirementIcons || DEFAULT_METADATA.suggestedRequirementIcons;
            const existingIconName = item.preview?.iconName || '';
            const iconMode = item.preview?.imageUrl ? 'image' : (isSuggestedIcon(existingIconName, suggestions) ? 'library' : 'custom');

            return {
                ...this.getDefaultValues(metadata),
                title: item.title || '',
                classLevel: item.identifier || metadata.requirementClassLevels?.[0] || 'Amigo',
                category: item.context || '',
                description: item.subtitle || '',
                iconMode,
                iconLibraryChoice: isSuggestedIcon(existingIconName, suggestions) ? existingIconName : suggestions?.[0] || 'book',
                iconCustomName: iconMode === 'custom' ? existingIconName : '',
                iconSize: item.preview?.iconSize || 40,
                displayOrder: parseTagValue(item.preview?.tags, 'ordem') || 1
            };
        },
        buildCreateRequest(form) {
            const formData = new FormData();
            formData.append('title', form.elements.title.value.trim());
            formData.append('classLevel', form.elements.classLevel.value.trim());
            formData.append('category', form.elements.category.value.trim());
            formData.append('description', form.elements.description.value.trim());
            formData.append('displayOrder', String(Number.parseInt(form.elements.displayOrder.value, 10)));
            appendIconAssetToFormData(formData, form);

            return {
                endpoint: '/api/admin/requirements',
                options: {
                    method: 'POST',
                    body: formData
                }
            };
        },
        buildUpdateRequest(itemId, form, context = {}) {
            const formData = new FormData();
            formData.append('title', form.elements.title.value.trim());
            formData.append('classLevel', form.elements.classLevel.value.trim());
            formData.append('category', form.elements.category.value.trim());
            formData.append('description', form.elements.description.value.trim());
            formData.append('displayOrder', String(Number.parseInt(form.elements.displayOrder.value, 10)));
            appendIconAssetToFormData(formData, form, {
                keepExistingImage: context.initialValues?.iconMode === 'image'
            });

            return {
                endpoint: `/api/admin/requirements/${itemId}`,
                options: {
                    method: 'PUT',
                    body: formData
                }
            };
        },
        getDeleteEndpoint(itemId) {
            return `/api/admin/requirements/${itemId}`;
        }
    }
];

function getKindConfig(kind) {
    return CATALOG_KINDS.find((entry) => entry.key === kind) || CATALOG_KINDS[0];
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function truncate(value, length = 96) {
    if (!value) return '';
    return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}

function formatRewardType(value) {
    return value === 'SEAL' ? 'Selo' : 'Emblema';
}

function normalizeColorValue(value) {
    if (!value) return '#FFFFFF';
    return value.startsWith('#') ? value : `#${value}`;
}

function normalizeIconValue(iconName) {
    if (!iconName) return '';
    return iconName.trim();
}

function normalizeIconSizeValue(value, fallback = 48) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(160, Math.max(16, parsed));
}

function isSuggestedIcon(iconName, suggestions = []) {
    return suggestions.includes(iconName);
}

function resolveIconDefinition(values, suggestions = [], initialPreview = {}) {
    const iconMode = values.iconMode || (initialPreview.imageUrl ? 'image' : 'library');
    const iconSize = normalizeIconSizeValue(values.iconSize ?? initialPreview.iconSize, 48);

    if (iconMode === 'image') {
        return {
            mode: 'image',
            iconName: '',
            imageUrl: initialPreview.imageUrl || '',
            iconSize
        };
    }

    if (iconMode === 'custom') {
        return {
            mode: 'custom',
            iconName: normalizeIconValue(values.iconCustomName),
            imageUrl: '',
            iconSize
        };
    }

    const iconLibraryChoice = normalizeIconValue(values.iconLibraryChoice);
    return {
        mode: 'library',
        iconName: isSuggestedIcon(iconLibraryChoice, suggestions) ? iconLibraryChoice : (suggestions[0] || ''),
        imageUrl: '',
        iconSize
    };
}

function appendIconAssetToFormData(formData, form, options = {}) {
    const mode = form.elements.iconMode?.value || 'library';
    const iconSize = normalizeIconSizeValue(form.elements.iconSize?.value, 48);
    const libraryValue = normalizeIconValue(form.elements.iconLibraryChoice?.value);
    const customValue = normalizeIconValue(form.elements.iconCustomName?.value);
    const imageFile = form.elements.iconImageFile?.files?.[0];
    const keepExistingImage = Boolean(options.keepExistingImage);

    formData.append('iconSize', String(iconSize));

    if (mode === 'image') {
        if (imageFile) {
            formData.append('iconImageFile', imageFile);
            return;
        }

        if (keepExistingImage) {
            return;
        }

        throw new Error('Envie uma imagem para concluir a configuracao do icone.');
    }

    const iconName = mode === 'custom' ? customValue : libraryValue;
    if (!iconName) {
        throw new Error('Selecione um icone da lista ou informe um icone personalizado.');
    }

    formData.append('iconName', iconName);
}

function extractErrorMessage(error, fallback = 'Nao foi possivel concluir a operacao.') {
    if (!error) return fallback;

    try {
        const parsed = JSON.parse(error.message);
        if (parsed?.message) {
            return parsed.message;
        }
    } catch (parseError) {
    }

    return error.message || fallback;
}

function parseTagValue(tags, prefix) {
    if (!Array.isArray(tags)) return null;

    const match = tags.find((entry) => entry.startsWith(`${prefix}:`));
    if (!match) return null;

    const [, rawValue] = match.split(':');
    const parsed = Number.parseInt(rawValue, 10);
    return Number.isNaN(parsed) ? rawValue : parsed;
}

function normalizeIconClass(iconName) {
    if (!iconName) {
        return 'fa-solid fa-layer-group';
    }

    if (iconName.startsWith('fa-')) {
        return `fa-solid ${iconName}`;
    }

    return `fa-solid fa-${iconName}`;
}

function resolvePreviewUrl(path) {
    if (!path) return '';
    if (/^blob:/i.test(path) || /^data:/i.test(path)) {
        return path;
    }
    return resolveAssetUrl(path);
}

function getPageInfo(pageData) {
    return {
        content: pageData?.content || [],
        number: pageData?.number ?? pageData?.page?.number ?? 0,
        totalPages: pageData?.totalPages ?? pageData?.page?.totalPages ?? 1,
        first: pageData?.first ?? (pageData?.number ?? 0) === 0,
        last: pageData?.last ?? (pageData?.number ?? 0) >= ((pageData?.totalPages ?? 1) - 1)
    };
}

function renderPaginationControls(paginationContainer, pageData, onChange) {
    paginationContainer.innerHTML = '';

    const { number, totalPages, first, last } = getPageInfo(pageData);

    if (totalPages <= 1) {
        return;
    }

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first;
    prevBtn.addEventListener('click', () => onChange(number - 1));

    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Pagina ${number + 1} de ${totalPages}`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Proxima <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = last;
    nextBtn.addEventListener('click', () => onChange(number + 1));

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}

function createInitialState() {
    const pages = {};
    const drafts = {};

    CATALOG_KINDS.forEach((kind) => {
        pages[kind.key] = 0;
        drafts[kind.key] = {};
    });

    return {
        metadata: { ...DEFAULT_METADATA },
        summary: { ...EMPTY_SUMMARY },
        activeKind: 'achievement',
        pages,
        drafts
    };
}

function buildBaseShell() {
    return `
        <div class="catalog-admin-shell" data-catalog-admin-root="true">
            <div class="admin-widget catalog-admin-panel">
                <div class="admin-section-header">
                    <div>
                        <p class="section-kicker">Central de catalogo</p>
                        <h2 class="catalog-admin-heading">Criar, revisar e liberar conteudo para os alunos</h2>
                        <p class="section-subtitle">Padrao unico para cadastro e catalogo. O administrador cria o item, revisa o preview e ja deixa o conteudo pronto para ser desbloqueado.</p>
                    </div>
                    <div class="catalog-summary-grid">
                        <div class="catalog-summary-card">
                            <span>Gamificacao</span>
                            <strong data-summary-value="achievements">0</strong>
                        </div>
                        <div class="catalog-summary-card">
                            <span>Fundos</span>
                            <strong data-summary-value="backgrounds">0</strong>
                        </div>
                        <div class="catalog-summary-card">
                            <span>Especialidades</span>
                            <strong data-summary-value="specialties">0</strong>
                        </div>
                        <div class="catalog-summary-card">
                            <span>Requisitos</span>
                            <strong data-summary-value="requirements">0</strong>
                        </div>
                    </div>
                </div>

                <div class="view-toggle-buttons catalog-kind-switches">
                    ${CATALOG_KINDS.map((kind, index) => `
                        <button type="button" class="view-toggle-btn ${index === 0 ? 'active' : ''}" data-kind-switch="${kind.key}">
                            <i class="fa-solid ${kind.iconClass}"></i>
                            ${escapeHtml(kind.title)}
                        </button>
                    `).join('')}
                </div>

                <div class="catalog-admin-workspace">
                    <div class="catalog-admin-form-column">
                        <div class="catalog-admin-column-header">
                            <div>
                                <p class="section-kicker" data-active-kicker>Modo ativo</p>
                                <h3 data-active-title></h3>
                                <p data-active-subtitle></p>
                            </div>
                        </div>
                        <div class="catalog-template-strip" data-template-strip></div>
                        <div class="catalog-form-host" data-create-form-host></div>
                    </div>

                    <aside class="catalog-admin-side-column">
                        <div class="catalog-release-card" data-release-copy></div>
                        <div class="catalog-live-preview-card">
                            <div class="catalog-live-preview-header">
                                <div>
                                    <p class="section-kicker">Preview</p>
                                    <h3>Como o aluno vai enxergar</h3>
                                </div>
                                <span class="catalog-preview-badge">Ao vivo</span>
                            </div>
                            <div class="catalog-live-preview-host" data-live-preview></div>
                        </div>
                    </aside>
                </div>
            </div>

            <div class="admin-widget catalog-admin-panel">
                <div class="admin-section-header">
                    <div>
                        <p class="section-kicker">Catalogo</p>
                        <h2 class="catalog-admin-heading">Itens publicados</h2>
                        <p class="section-subtitle">Visualizacao alinhada com o padrao de utilizadores, com preview, identificacao do item e acoes administrativas.</p>
                    </div>
                </div>

                <div class="catalog-table-host" data-catalog-table-host>
                    <p>A carregar catalogo...</p>
                </div>
                <div class="pagination-controls" data-catalog-pagination></div>
            </div>
        </div>
    `;
}

function updateSummary(viewElement, summary) {
    Object.entries(summary).forEach(([key, value]) => {
        const target = viewElement.querySelector(`[data-summary-value="${key}"]`);
        if (target) {
            target.textContent = value;
        }
    });
}

function createFieldId(kind, mode, contextKey, fieldName) {
    return `${mode}-${kind}-${contextKey}-${fieldName}`;
}

function isFieldVisible(field, values) {
    return typeof field.when === 'function' ? Boolean(field.when(values)) : true;
}

function isFieldRequired(field, values) {
    if (typeof field.required === 'function') {
        return Boolean(field.required(values));
    }

    return Boolean(field.required);
}

function renderFieldControl(field, fieldId, value, metadata) {
    const safeValue = value ?? '';

    if (field.type === 'textarea') {
        return `<textarea id="${fieldId}" name="${field.name}" class="form-control" rows="${field.rows || 4}" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(safeValue)}</textarea>`;
    }

    if (field.type === 'select') {
        return `
            <select id="${fieldId}" name="${field.name}" class="form-control" ${field.disabled ? 'disabled' : ''}>
                ${(field.options || []).map((option) => `
                    <option value="${escapeHtml(option.value)}" ${String(option.value) === String(safeValue) ? 'selected' : ''}>${escapeHtml(option.label)}</option>
                `).join('')}
            </select>
        `;
    }

    if (field.type === 'file') {
        return `<input id="${fieldId}" name="${field.name}" class="form-control" type="file" accept="${escapeHtml(field.accept || '')}">`;
    }

    if (field.type === 'icon-picker') {
        const icons = field.icons || [];
        return `
            <input type="hidden" id="${fieldId}" name="${field.name}" value="${escapeHtml(safeValue || icons[0] || '')}">
            <div class="catalog-icon-picker-grid" data-icon-picker-grid="${field.name}">
                ${icons.map((iconValue) => {
                    const selected = String(iconValue) === String(safeValue || icons[0] || '');
                    return `
                        <button
                            type="button"
                            class="catalog-icon-option ${selected ? 'active' : ''}"
                            data-icon-picker-option="${field.name}"
                            data-icon-value="${escapeHtml(iconValue)}">
                            <span class="catalog-icon-option-preview">
                                <i class="${escapeHtml(normalizeIconClass(iconValue))}"></i>
                            </span>
                            <span class="catalog-icon-option-label">${escapeHtml(iconValue)}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    }

    if (field.type === 'color') {
        const palette = field.palette || metadata.suggestedColors || DEFAULT_METADATA.suggestedColors;

        return `
            <input id="${fieldId}" name="${field.name}" class="form-control catalog-color-input" type="color" value="${escapeHtml(normalizeColorValue(safeValue || palette[0] || '#27408b'))}">
            <div class="catalog-color-palette">
                ${palette.map((paletteColor) => `
                    <button
                        type="button"
                        class="catalog-color-chip"
                        title="${escapeHtml(paletteColor)}"
                        data-apply-color="${field.name}"
                        data-color-value="${escapeHtml(normalizeColorValue(paletteColor))}"
                        style="background-color: ${escapeHtml(normalizeColorValue(paletteColor))};">
                    </button>
                `).join('')}
            </div>
        `;
    }

    const suggestions = field.suggestions || [];
    const dataListId = suggestions.length ? `${fieldId}-list` : null;

    return `
        <input
            id="${fieldId}"
            name="${field.name}"
            class="form-control"
            type="${field.type || 'text'}"
            value="${escapeHtml(safeValue)}"
            placeholder="${escapeHtml(field.placeholder || '')}"
            ${field.min !== undefined ? `min="${field.min}"` : ''}
            ${field.step !== undefined ? `step="${field.step}"` : ''}
            ${dataListId ? `list="${dataListId}"` : ''}
            ${field.disabled ? 'disabled' : ''}>
        ${dataListId ? `
            <datalist id="${dataListId}">
                ${suggestions.map((entry) => `<option value="${escapeHtml(entry)}"></option>`).join('')}
            </datalist>
        ` : ''}
    `;
}

function renderFieldMarkup(field, kind, mode, contextKey, value, values, metadata) {
    const fieldId = createFieldId(kind, mode, contextKey, field.name);
    const visible = isFieldVisible(field, values);

    return `
        <div class="form-group" data-field-wrapper="${field.name}" ${visible ? '' : 'style="display:none;"'}>
            <label for="${fieldId}">${escapeHtml(field.label)}</label>
            ${renderFieldControl(field, fieldId, value, metadata)}
            ${field.hint ? `<small class="catalog-field-hint">${escapeHtml(field.hint)}</small>` : ''}
        </div>
    `;
}

function renderDynamicForm({ kind, mode, contextKey, values, metadata, buttonLabel, context = {} }) {
    const config = getKindConfig(kind);
    const fields = config.getFields(metadata, mode, values, context);

    return `
        <form class="user-form catalog-dynamic-form" data-kind="${kind}" data-form-mode="${mode}">
            ${fields.map((row) => row.length > 1
                ? `<div class="form-row">${row.map((field) => renderFieldMarkup(field, kind, mode, contextKey, values[field.name], values, metadata)).join('')}</div>`
                : renderFieldMarkup(row[0], kind, mode, contextKey, values[row[0].name], values, metadata)
            ).join('')}
            <div class="catalog-form-actions">
                <button type="submit" class="action-btn">${escapeHtml(buttonLabel)}</button>
            </div>
        </form>
    `;
}

function readFormValues(form, kind, metadata, mode, context = {}) {
    const config = getKindConfig(kind);
    const currentValues = {};
    const rows = config.getFields(metadata, mode, {}, context);

    rows.flat().forEach((field) => {
        const input = form.elements[field.name];
        if (!input) return;
        currentValues[field.name] = input.type === 'color' ? normalizeColorValue(input.value) : input.value;
    });

    return currentValues;
}

function applyFieldVisibility(form, kind, metadata, mode, context = {}) {
    const config = getKindConfig(kind);
    const values = readFormValues(form, kind, metadata, mode, context);
    const fields = config.getFields(metadata, mode, values, context).flat();

    fields.forEach((field) => {
        const wrapper = form.querySelector(`[data-field-wrapper="${field.name}"]`);
        const input = form.elements[field.name];
        if (!wrapper || !input) return;

        const visible = isFieldVisible(field, values);
        const required = visible && isFieldRequired(field, values) && !field.disabled;

        wrapper.style.display = visible ? '' : 'none';
        input.disabled = !visible || Boolean(field.disabled);
        input.required = required;
    });
}

function syncDraftFromForm(state, form, kind, metadata, mode, context = {}) {
    const currentValues = readFormValues(form, kind, metadata, mode, context);
    state.drafts[kind] = {
        ...state.drafts[kind],
        ...currentValues
    };
}

function updateFilePreview(form, input) {
    form.__filePreviews = form.__filePreviews || {};
    const currentUrl = form.__filePreviews[input.name];

    if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
        delete form.__filePreviews[input.name];
    }

    if (input.files && input.files[0]) {
        form.__filePreviews[input.name] = URL.createObjectURL(input.files[0]);
    }
}

function buildPreviewPayload(form, kind, metadata, mode, context = {}) {
    return {
        values: readFormValues(form, kind, metadata, mode, context),
        filePreviews: form.__filePreviews || {},
        initialPreview: form.__initialPreview || {}
    };
}

function buildItemIconPreview(values, filePreviews, initialPreview, suggestions = []) {
    const iconDefinition = resolveIconDefinition(values, suggestions, initialPreview);
    const imageUrl = filePreviews.iconImageFile || iconDefinition.imageUrl || initialPreview.imageUrl || '';

    return {
        ...iconDefinition,
        imageUrl
    };
}

function renderPreviewMarkup(kind, payload) {
    const values = payload.values || {};
    const filePreviews = payload.filePreviews || {};
    const initialPreview = payload.initialPreview || {};

    if (kind === 'achievement') {
        const iconUrl = filePreviews.iconFile || initialPreview.iconUrl;
        return `
            <article class="catalog-preview-card is-achievement">
                <span class="catalog-preview-chip">${escapeHtml(formatRewardType(values.rewardType))}</span>
                <div class="catalog-preview-media">
                    ${iconUrl
                        ? `<img src="${escapeHtml(resolvePreviewUrl(iconUrl))}" alt="" class="catalog-preview-image">`
                        : `<i class="fa-solid fa-award"></i>`}
                </div>
                <div class="catalog-preview-copy">
                    <strong>${escapeHtml(values.name || 'Nova conquista')}</strong>
                    <p>${escapeHtml(values.description || 'Defina um criterio simples, objetivo e facil de conceder.')}</p>
                </div>
                <div class="catalog-preview-footer">
                    <span>+${escapeHtml(values.xpReward || 0)} XP</span>
                    <span>Disponivel para concessao</span>
                </div>
            </article>
        `;
    }

    if (kind === 'background') {
        const backgroundStyle = values.assetMode === 'image' && (filePreviews.imageFile || initialPreview.imageUrl)
            ? `background-image:url('${escapeHtml(resolvePreviewUrl(filePreviews.imageFile || initialPreview.imageUrl))}');`
            : `background:${escapeHtml(values.gradient || initialPreview.gradient || BACKGROUND_GRADIENTS[0])};`;

        return `
            <article class="catalog-preview-card is-background" style="${backgroundStyle} color: ${escapeHtml(values.textColor || '#FFFFFF')}">
                <span class="catalog-preview-chip">Fundo</span>
                <div class="catalog-preview-surface">
                    <strong>${escapeHtml(values.name || 'Novo fundo')}</strong>
                    <p>Pronto para o aluno aplicar no perfil.</p>
                </div>
            </article>
        `;
    }

    if (kind === 'specialty') {
        const iconPreview = buildItemIconPreview(values, filePreviews, initialPreview, DEFAULT_METADATA.suggestedSpecialtyIcons);
        return `
            <article class="catalog-preview-card is-specialty">
                <span class="catalog-preview-chip">${escapeHtml(values.area || 'Area')}</span>
                <div class="catalog-preview-icon-badge" style="background:${escapeHtml(values.accentColor || '#27408b')}; width:${iconPreview.iconSize}px; height:${iconPreview.iconSize}px;">
                    ${iconPreview.imageUrl
                        ? `<img src="${escapeHtml(resolvePreviewUrl(iconPreview.imageUrl))}" alt="" class="catalog-preview-image">`
                        : `<i class="${escapeHtml(normalizeIconClass(iconPreview.iconName))}"></i>`}
                </div>
                <div class="catalog-preview-copy">
                    <strong>${escapeHtml(values.name || 'Nova especialidade')}</strong>
                    <p>${escapeHtml(values.description || 'Descreva a trilha de aprendizado com foco no que o aluno vai dominar.')}</p>
                </div>
                <div class="catalog-preview-footer">
                    <span>${escapeHtml(iconPreview.imageUrl ? 'Imagem personalizada' : (iconPreview.iconName || 'fa-compass'))}</span>
                    <span>${iconPreview.iconSize}px</span>
                    <span>Disponivel na trilha</span>
                </div>
            </article>
        `;
    }

    const requirementIconPreview = buildItemIconPreview(values, filePreviews, initialPreview, DEFAULT_METADATA.suggestedRequirementIcons);
    return `
        <article class="catalog-preview-card is-requirement">
            <span class="catalog-preview-chip">${escapeHtml(values.classLevel || 'Classe')}</span>
            <div class="catalog-preview-icon-badge" style="background:#27408b; width:${requirementIconPreview.iconSize}px; height:${requirementIconPreview.iconSize}px;">
                ${requirementIconPreview.imageUrl
                    ? `<img src="${escapeHtml(resolvePreviewUrl(requirementIconPreview.imageUrl))}" alt="" class="catalog-preview-image">`
                    : `<i class="${escapeHtml(normalizeIconClass(requirementIconPreview.iconName))}"></i>`}
            </div>
            <div class="catalog-preview-copy">
                <strong>${escapeHtml(values.title || 'Novo requisito')}</strong>
                <p>${escapeHtml(values.description || 'Explique o objetivo com a linguagem que o aluno vai ler no app.')}</p>
            </div>
            <div class="catalog-preview-footer">
                <span>${escapeHtml(values.category || 'Categoria')}</span>
                <span>Ordem ${escapeHtml(values.displayOrder || 1)}</span>
                <span>${requirementIconPreview.iconSize}px</span>
            </div>
        </article>
    `;
}

function refreshPreview(previewHost, form, kind, metadata, mode, context = {}) {
    previewHost.innerHTML = renderPreviewMarkup(kind, buildPreviewPayload(form, kind, metadata, mode, context));
}

function renderTemplateButtons(templateHost, kind) {
    const config = getKindConfig(kind);

    templateHost.innerHTML = `
        <div class="catalog-template-copy">
            <strong>Presets rapidos</strong>
            <span>Use um ponto de partida e ajuste antes de liberar.</span>
        </div>
        <div class="catalog-template-actions">
            ${config.templates.map((template) => `
                <button type="button" class="catalog-template-btn" data-template-kind="${kind}" data-template-label="${escapeHtml(template.label)}">
                    ${escapeHtml(template.label)}
                </button>
            `).join('')}
        </div>
    `;
}

function applyTemplateToForm(form, kind, templateLabel, metadata, mode, context = {}) {
    const config = getKindConfig(kind);
    const template = config.templates.find((entry) => entry.label === templateLabel);
    if (!template) return;

    Object.entries(template.values).forEach(([key, value]) => {
        const input = form.elements[key];
        if (!input || input.type === 'file') return;
        input.value = value;
    });

    applyFieldVisibility(form, kind, metadata, mode, context);
}

function syncIconPickerSelections(scopeElement, form) {
    scopeElement.querySelectorAll('[data-icon-picker-option]').forEach((button) => {
        const fieldName = button.dataset.iconPickerOption;
        const hiddenInput = form.elements[fieldName];
        button.classList.toggle('active', Boolean(hiddenInput) && hiddenInput.value === button.dataset.iconValue);
    });
}

function bindInteractiveFieldControls(scopeElement, form, kind, metadata, mode, previewHost, state = null, context = {}) {
    scopeElement.querySelectorAll('[data-apply-color]').forEach((button) => {
        button.addEventListener('click', () => {
            const fieldName = button.dataset.applyColor;
            const input = form.elements[fieldName];
            if (!input) return;

            input.value = button.dataset.colorValue;
            if (state) {
                syncDraftFromForm(state, form, kind, metadata, mode, context);
            }
            refreshPreview(previewHost, form, kind, metadata, mode, context);
        });
    });

    scopeElement.querySelectorAll('[data-icon-picker-option]').forEach((button) => {
        button.addEventListener('click', () => {
            const fieldName = button.dataset.iconPickerOption;
            const hiddenInput = form.elements[fieldName];
            if (!hiddenInput) return;

            hiddenInput.value = button.dataset.iconValue;
            scopeElement.querySelectorAll(`[data-icon-picker-option="${fieldName}"]`).forEach((option) => {
                option.classList.toggle('active', option === button);
            });

            if (state) {
                syncDraftFromForm(state, form, kind, metadata, mode, context);
            }
            syncIconPickerSelections(scopeElement, form);
            refreshPreview(previewHost, form, kind, metadata, mode, context);
        });
    });
}

function renderReleaseCopy(releaseHost, config) {
    releaseHost.innerHTML = `
        <p class="section-kicker">Disponibilidade</p>
        <strong>${escapeHtml(config.title)}</strong>
        <p>${escapeHtml(config.releaseDescription)}</p>
        <ul class="catalog-release-points">
            <li>Revise o preview antes de salvar.</li>
            <li>Use nomes curtos e criterio objetivo.</li>
            <li>Depois de salvo, o item ja aparece no fluxo correspondente do aluno.</li>
        </ul>
    `;
}

function renderKindWorkspace(viewElement, state) {
    const config = getKindConfig(state.activeKind);
    const metadata = state.metadata || DEFAULT_METADATA;
    const headingTitle = viewElement.querySelector('[data-active-title]');
    const headingSubtitle = viewElement.querySelector('[data-active-subtitle]');
    const formHost = viewElement.querySelector('[data-create-form-host]');
    const previewHost = viewElement.querySelector('[data-live-preview]');
    const templateHost = viewElement.querySelector('[data-template-strip]');
    const releaseHost = viewElement.querySelector('[data-release-copy]');

    headingTitle.textContent = config.title;
    headingSubtitle.textContent = config.subtitle;
    renderTemplateButtons(templateHost, config.key);
    renderReleaseCopy(releaseHost, config);

    const defaultValues = config.getDefaultValues(state.metadata);
    const values = {
        ...defaultValues,
        ...state.drafts[config.key]
    };
    state.drafts[config.key] = values;

    formHost.innerHTML = renderDynamicForm({
        kind: config.key,
        mode: 'create',
        contextKey: 'main',
        values,
        metadata,
        buttonLabel: config.createButtonLabel
    });

    const form = formHost.querySelector('form');
    form.__initialPreview = {};
    form.__filePreviews = {};

    applyFieldVisibility(form, config.key, metadata, 'create');
    syncIconPickerSelections(formHost, form);
    refreshPreview(previewHost, form, config.key, metadata, 'create');

    form.addEventListener('input', () => {
        syncDraftFromForm(state, form, config.key, metadata, 'create');
        applyFieldVisibility(form, config.key, metadata, 'create');
        refreshPreview(previewHost, form, config.key, metadata, 'create');
    });

    form.addEventListener('change', (event) => {
        if (event.target instanceof HTMLInputElement && event.target.type === 'file') {
            updateFilePreview(form, event.target);
        }

        syncDraftFromForm(state, form, config.key, metadata, 'create');
        applyFieldVisibility(form, config.key, metadata, 'create');
        refreshPreview(previewHost, form, config.key, metadata, 'create');
    });

    templateHost.querySelectorAll('[data-template-label]').forEach((button) => {
        button.addEventListener('click', () => {
            applyTemplateToForm(form, config.key, button.dataset.templateLabel, metadata, 'create');
            syncDraftFromForm(state, form, config.key, metadata, 'create');
            syncIconPickerSelections(formHost, form);
            refreshPreview(previewHost, form, config.key, metadata, 'create');
        });
    });

    bindInteractiveFieldControls(formHost, form, config.key, metadata, 'create', previewHost, state);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        try {
            const request = config.buildCreateRequest(form, { metadata });
            await fetchApi(request.endpoint, request.options);
            showToast(`${config.title} criado com sucesso.`, 'success');
            state.drafts[config.key] = config.getDefaultValues(metadata);
            await refreshSummaryFromApi(viewElement, state);
            renderKindWorkspace(viewElement, state);
            await loadCatalogPage(viewElement, state, config.key, 0);
        } catch (error) {
            showToast(extractErrorMessage(error, 'Nao foi possivel criar o item.'), 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = config.createButtonLabel;
        }
    });

    viewElement.querySelectorAll('[data-kind-switch]').forEach((button) => {
        button.classList.toggle('active', button.dataset.kindSwitch === config.key);
    });
}

function renderCatalogRowPreview(item) {
    const preview = item.preview || {};
    const styleType = preview.previewStyle || 'icon';
    const iconSize = normalizeIconSizeValue(preview.iconSize, 44);

    if (styleType === 'image' || styleType === 'gradient') {
        const inlineStyle = styleType === 'image' && preview.imageUrl
            ? `background-image:url('${escapeHtml(resolvePreviewUrl(preview.imageUrl))}');`
            : `background:${escapeHtml(preview.gradient || BACKGROUND_GRADIENTS[0])};`;

        return `
            <div class="catalog-row-preview is-surface" style="${inlineStyle} color:${escapeHtml(preview.accentColor || '#FFFFFF')}">
                <span>${escapeHtml(preview.badge || 'Fundo')}</span>
            </div>
        `;
    }

    if ((item.kind === 'achievement' || styleType === 'icon-image') && preview.imageUrl) {
        return `
            <div class="catalog-row-preview is-icon" style="width:${Math.min(iconSize, 58)}px; height:${Math.min(iconSize, 58)}px;">
                <img src="${escapeHtml(resolvePreviewUrl(preview.imageUrl))}" alt="" class="catalog-row-image">
            </div>
        `;
    }

    return `
        <div class="catalog-row-preview is-icon" style="background:${escapeHtml(preview.accentColor || '#27408b')}; width:${Math.min(iconSize, 58)}px; height:${Math.min(iconSize, 58)}px;">
            <i class="${escapeHtml(normalizeIconClass(preview.iconName || (item.kind === 'specialty' ? 'fa-compass' : 'book')))}"></i>
        </div>
    `;
}

function renderCatalogTable(viewElement, state, kind, pageData) {
    const config = getKindConfig(kind);
    const { content } = getPageInfo(pageData);
    const host = viewElement.querySelector('[data-catalog-table-host]');

    if (!content.length) {
        host.innerHTML = `<p>Nenhum item de ${escapeHtml(config.title.toLowerCase())} foi publicado ainda.</p>`;
        return;
    }

    host.innerHTML = `
        <table class="user-table catalog-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>${escapeHtml(config.identifierLabel)}</th>
                    <th>${escapeHtml(config.contextLabel)}</th>
                    <th>Disponibilidade</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${content.map((item) => `
                    <tr>
                        <td>
                            <div class="catalog-table-item">
                                ${renderCatalogRowPreview(item)}
                                <div class="catalog-table-copy">
                                    <strong>${escapeHtml(item.title || 'Sem titulo')}</strong>
                                    <small>${escapeHtml(truncate(item.subtitle || item.preview?.description || 'Sem descricao.'))}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="catalog-inline-chip">${escapeHtml(item.identifier || 'Sem identificador')}</span>
                        </td>
                        <td>
                            <div class="catalog-context-stack">
                                <span>${escapeHtml(item.context || 'Sem contexto')}</span>
                                ${Array.isArray(item.preview?.tags) && item.preview.tags.length
                                    ? `<small>${escapeHtml(item.preview.tags.join(' | '))}</small>`
                                    : ''}
                            </div>
                        </td>
                        <td>
                            <span class="catalog-status-pill">${escapeHtml(config.availabilityLabel)}</span>
                        </td>
                        <td class="actions-cell">
                            <button class="btn-action-icon edit" title="Editar item" data-edit-item="${item.id}" data-edit-kind="${kind}">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button class="btn-action-icon delete" title="Apagar item" data-delete-item="${item.id}" data-delete-kind="${kind}" data-delete-title="${escapeHtml(item.title || '')}">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    host.querySelectorAll('[data-edit-item]').forEach((button) => {
        button.addEventListener('click', () => {
            const item = content.find((entry) => String(entry.id) === button.dataset.editItem);
            if (item) {
                openEditModal(viewElement, state, kind, item);
            }
        });
    });

    host.querySelectorAll('[data-delete-item]').forEach((button) => {
        button.addEventListener('click', () => {
            openDeleteModal(viewElement, state, kind, {
                id: button.dataset.deleteItem,
                title: button.dataset.deleteTitle
            });
        });
    });
}

async function loadCatalogPage(viewElement, state, kind, page = 0) {
    const config = getKindConfig(kind);
    const host = viewElement.querySelector('[data-catalog-table-host]');
    const paginationHost = viewElement.querySelector('[data-catalog-pagination]');

    host.innerHTML = `<p>A carregar ${escapeHtml(config.title.toLowerCase())}...</p>`;
    paginationHost.innerHTML = '';

    try {
        const queryPrefix = config.sortQuery ? `&${config.sortQuery}` : '';
        const pageData = await fetchApi(`/api/admin/catalog/${kind}?page=${page}&size=${ITEM_PAGE_SIZE}${queryPrefix}`);
        state.pages[kind] = getPageInfo(pageData).number;
        renderCatalogTable(viewElement, state, kind, pageData);
        renderPaginationControls(paginationHost, pageData, (nextPage) => loadCatalogPage(viewElement, state, kind, nextPage));
    } catch (error) {
        host.innerHTML = `<p style="color:#c62828;">Nao foi possivel carregar o catalogo. ${escapeHtml(extractErrorMessage(error))}</p>`;
    }
}

function closeOpenModal() {
    document.getElementById('closeModalBtn')?.click();
}

function openDeleteModal(viewElement, state, kind, item) {
    const config = getKindConfig(kind);
    const body = document.createElement('div');
    body.className = 'catalog-confirm-modal';
    body.innerHTML = `
        <p>Tem certeza que quer apagar "<strong>${escapeHtml(item.title || 'item')}</strong>"?</p>
        <p class="catalog-field-hint">Essa acao remove o item do catalogo e pode impactar a experiencia dos alunos.</p>
        <div class="catalog-modal-actions">
            <button type="button" class="btn-action cancel" data-modal-cancel>Cancelar</button>
            <button type="button" class="action-btn" data-modal-confirm>Apagar</button>
        </div>
    `;

    body.querySelector('[data-modal-cancel]')?.addEventListener('click', closeOpenModal);
    body.querySelector('[data-modal-confirm]')?.addEventListener('click', async () => {
        const confirmButton = body.querySelector('[data-modal-confirm]');
        confirmButton.disabled = true;
        confirmButton.textContent = 'A apagar...';

        try {
            await fetchApi(config.getDeleteEndpoint(item.id), { method: 'DELETE' });
            showToast('Item apagado com sucesso.', 'success');
            closeOpenModal();
            await refreshSummaryFromApi(viewElement, state);
            await loadCatalogPage(viewElement, state, kind, state.pages[kind] || 0);
        } catch (error) {
            showToast(extractErrorMessage(error, 'Nao foi possivel apagar o item.'), 'error');
            confirmButton.disabled = false;
            confirmButton.textContent = 'Apagar';
        }
    });

    showModal(`Apagar ${config.title}`, body);
}

function openEditModal(viewElement, state, kind, item) {
    const config = getKindConfig(kind);
    const metadata = state.metadata || DEFAULT_METADATA;
    const initialValues = config.getInitialValues(item, metadata);
    const context = { initialValues };
    const body = document.createElement('div');
    body.className = 'catalog-edit-modal-shell';

    body.innerHTML = `
        <div class="catalog-edit-modal-layout">
            <div class="catalog-edit-form-host">
                ${renderDynamicForm({
                    kind,
                    mode: 'edit',
                    contextKey: `modal-${item.id}`,
                    values: initialValues,
                    metadata,
                    buttonLabel: config.updateButtonLabel,
                    context
                })}
            </div>
            <div class="catalog-edit-preview-host">
                <p class="section-kicker">Preview</p>
                <div data-edit-preview></div>
                <div class="catalog-modal-actions">
                    <button type="button" class="btn-action cancel" data-modal-cancel>Fechar</button>
                </div>
            </div>
        </div>
    `;

    const form = body.querySelector('form');
    const previewHost = body.querySelector('[data-edit-preview]');
    form.__initialPreview = {
        iconUrl: item.preview?.imageUrl || null,
        imageUrl: item.preview?.imageUrl || null,
        gradient: item.preview?.gradient || null,
        iconSize: item.preview?.iconSize || null
    };
    form.__filePreviews = {};

    applyFieldVisibility(form, kind, metadata, 'edit', context);
    syncIconPickerSelections(body, form);
    refreshPreview(previewHost, form, kind, metadata, 'edit', context);

    form.addEventListener('input', () => {
        applyFieldVisibility(form, kind, metadata, 'edit', context);
        refreshPreview(previewHost, form, kind, metadata, 'edit', context);
    });

    form.addEventListener('change', (event) => {
        if (event.target instanceof HTMLInputElement && event.target.type === 'file') {
            updateFilePreview(form, event.target);
        }

        applyFieldVisibility(form, kind, metadata, 'edit', context);
        refreshPreview(previewHost, form, kind, metadata, 'edit', context);
    });

    bindInteractiveFieldControls(body, form, kind, metadata, 'edit', previewHost, null, context);

    body.querySelector('[data-modal-cancel]')?.addEventListener('click', closeOpenModal);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        try {
            const request = config.buildUpdateRequest(item.id, form, context);
            await fetchApi(request.endpoint, request.options);
            showToast('Item atualizado com sucesso.', 'success');
            closeOpenModal();
            await refreshSummaryFromApi(viewElement, state);
            await loadCatalogPage(viewElement, state, kind, state.pages[kind] || 0);
        } catch (error) {
            showToast(extractErrorMessage(error, 'Nao foi possivel atualizar o item.'), 'error');
            submitButton.disabled = false;
            submitButton.textContent = config.updateButtonLabel;
        }
    });

    showModal(`Editar ${config.title}`, body);
}

async function refreshSummaryFromApi(viewElement, state) {
    try {
        const summary = await fetchApi('/api/admin/catalog/summary');
        state.summary = { ...EMPTY_SUMMARY, ...summary };
    } catch (error) {
        state.summary = { ...EMPTY_SUMMARY };
    }

    updateSummary(viewElement, state.summary);
}

async function loadMetadata(state) {
    try {
        state.metadata = await fetchApi('/api/admin/catalog/metadata');
    } catch (error) {
        state.metadata = { ...DEFAULT_METADATA };
    }
}

function bindKindSwitches(viewElement, state) {
    viewElement.querySelectorAll('[data-kind-switch]').forEach((button) => {
        button.addEventListener('click', async () => {
            const nextKind = button.dataset.kindSwitch;
            if (!nextKind || nextKind === state.activeKind) return;

            state.activeKind = nextKind;
            renderKindWorkspace(viewElement, state);
            await loadCatalogPage(viewElement, state, state.activeKind, state.pages[state.activeKind] || 0);
        });
    });
}

async function initializeView(viewElement) {
    const state = createInitialState();
    viewElement.__catalogAdminState = state;
    viewElement.innerHTML = buildBaseShell();

    bindKindSwitches(viewElement, state);
    await Promise.all([
        loadMetadata(state),
        refreshSummaryFromApi(viewElement, state)
    ]);

    CATALOG_KINDS.forEach((kind) => {
        state.drafts[kind.key] = {
            ...kind.getDefaultValues(state.metadata)
        };
    });

    renderKindWorkspace(viewElement, state);
    await loadCatalogPage(viewElement, state, state.activeKind, 0);
}

export function renderCreateItemView(viewElement) {
    viewElement.innerHTML = '<div class="admin-widget"><p>A carregar central de catalogo...</p></div>';

    initializeView(viewElement).catch((error) => {
        viewElement.innerHTML = `<div class="admin-widget"><p style="color:#c62828;">Nao foi possivel carregar a central de catalogo. ${escapeHtml(extractErrorMessage(error))}</p></div>`;
    });
}
