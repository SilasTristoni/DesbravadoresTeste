// js/views/admin/dashboard.js

// --- 1. FUNÇÃO DE TOAST (NOTIFICAÇÃO ELEGANTE) ---
const toastStyle = document.createElement('style');
toastStyle.innerHTML = `
    .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
    }
    .toast-notification.show {
        opacity: 1;
        transform: translateY(0);
    }
    .toast-success { border-left: 5px solid #2ecc71; }
    .toast-error { border-left: 5px solid #e74c3c; }
    .toast-warning { border-left: 5px solid #f1c40f; }
`;
document.head.appendChild(toastStyle);

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    let icon = '';
    if(type === 'success') icon = '✅';
    if(type === 'error') icon = '❌';
    if(type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 4000);
}

// --- 2. MODAL CUSTOMIZADO (SUBSTITUTO DO CONFIRM) ---
function showConfirmModal(message) {
    return new Promise((resolve) => {
        const modalId = 'dashboard-confirm-modal';
        // Remove se já existir
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = modalId;
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 10000; backdrop-filter: blur(2px);
        `;

        modalOverlay.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; animation: fadeIn 0.3s ease;">
                <h3 style="margin-top: 0; color: #333; font-size: 1.2rem;">Confirmação</h3>
                <p style="color: #666; margin: 15px 0 25px;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="dash-modal-cancel" style="padding: 10px 20px; border: none; background: #e0e0e0; color: #333; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancelar</button>
                    <button id="dash-modal-confirm" style="padding: 10px 20px; border: none; background: #2ecc71; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Confirmar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const close = (result) => {
            modalOverlay.style.opacity = '0';
            setTimeout(() => modalOverlay.remove(), 200);
            resolve(result);
        };

        document.getElementById('dash-modal-confirm').addEventListener('click', () => close(true));
        document.getElementById('dash-modal-cancel').addEventListener('click', () => close(false));
    });
}

// --- ESTADO LOCAL PARA PAGINAÇÃO ---
let currentPage = 0;
const pageSize = 5; 

function getUserRole() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
    } catch (error) {
        return null;
    }
}

function renderPaginationControls(viewElement, page) {
    const paginationContainer = viewElement.querySelector('#user-pagination-controls');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = ''; 

    const prevDisabled = page.number === 0 ? 'disabled' : '';
    paginationContainer.innerHTML += `<button id="prevPageBtn" class="pagination-btn" ${prevDisabled}>Anterior</button>`;

    for (let i = 0; i < page.totalPages; i++) {
        const activeClass = page.number === i ? 'active' : '';
        paginationContainer.innerHTML += `<button class="pagination-btn page-number-btn ${activeClass}" data-page="${i}">${i + 1}</button>`;
    }

    const nextDisabled = page.number === page.totalPages - 1 ? 'disabled' : '';
    paginationContainer.innerHTML += `<button id="nextPageBtn" class="pagination-btn" ${nextDisabled}>Próximo</button>`;
    
    viewElement.querySelector('#prevPageBtn').addEventListener('click', () => {
        if (page.number > 0) {
            currentPage = page.number - 1;
            const groupSelect = document.getElementById('report-group');
            const groupId = groupSelect ? groupSelect.value : null;
            renderUserList(viewElement, groupId);
        }
    });

    viewElement.querySelector('#nextPageBtn').addEventListener('click', () => {
        if (page.number < page.totalPages - 1) {
            currentPage = page.number + 1;
            const groupSelect = document.getElementById('report-group');
            const groupId = groupSelect ? groupSelect.value : null;
            renderUserList(viewElement, groupId);
        }
    });
    
    viewElement.querySelectorAll('.page-number-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentPage = parseInt(e.target.dataset.page, 10);
            const groupSelect = document.getElementById('report-group');
            const groupId = groupSelect ? groupSelect.value : null;
            renderUserList(viewElement, groupId);
        });
    });
}

async function renderUserList(viewElement, groupId = null) {
    const userListContainer = viewElement.querySelector('#user-list-container');

    try {
        let endpoint = `/api/admin/users?page=${currentPage}&size=${pageSize}`;
        if (groupId && groupId !== "") {
            endpoint += `&groupId=${groupId}`;
        }
        
        const responsePage = await fetchApi(endpoint); 
        const scouts = responsePage.content;
        
        if (scouts.length === 0 && responsePage.totalPages > 0 && currentPage > 0) {
            currentPage = Math.max(0, responsePage.totalPages - 1);
            return renderUserList(viewElement, groupId); 
        }

        if (scouts.length === 0) {
            userListContainer.innerHTML = '<p>Nenhum desbravador encontrado.</p>';
            const paginationControls = viewElement.querySelector('#user-pagination-controls');
            if(paginationControls) paginationControls.innerHTML = '';
            return;
        }
        
        userListContainer.innerHTML = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Grupo</th>
                        <th>Nível</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${scouts.map(user => `
                        <tr>
                            <td>
                                <div class="user-info-cell">
                                    <img src="${user.avatar || 'img/escoteiro1.png'}" alt="Avatar" class="avatar-img-small" />
                                    <span>${user.name} ${user.surname}</span>
                                </div>
                            </td>
                            <td>${(user.group && user.group.name) ? user.group.name : 'Sem grupo'}</td>
                            <td>${user.level}</td>
                            <td>
                                <button class="action-btn-small manage-user-btn" data-user-id="${user.id}">Gerir</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        renderPaginationControls(viewElement, responsePage);
        
    } catch (error) {
        console.error("Falha ao carregar utilizadores:", error);
        userListContainer.innerHTML = `<p style="color: red;">Não foi possível carregar a lista de utilizadores.</p>`;
    }
}

// --- NOVO: WIDGET DE SOLICITAÇÕES PENDENTES ---
async function renderPendingRequestsWidget(viewElement) {
    const container = viewElement.querySelector('#pending-requests-container');
    // Se o elemento não existe no HTML ou o usuário não é DIRETOR, sai da função
    if (!container || getUserRole() !== 'DIRETOR') {
        if(container) container.parentNode.style.display = 'none'; // Esconde o widget pai
        return;
    }

    try {
        container.innerHTML = '<p>A carregar solicitações...</p>';
        const requests = await fetchApi('/api/chamada/pending-requests');

        if (requests.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">Nenhuma solicitação de correção pendente.</p>';
            return;
        }

        container.innerHTML = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Grupo</th>
                        <th>Monitor</th>
                        <th>Data da Chamada</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(req => `
                        <tr>
                            <td>${req.groupName}</td>
                            <td>${req.monitorName}</td>
                            <td>${req.date}</td>
                            <td>
                                <button class="action-btn-small btn-approve" data-id="${req.id}" style="background-color: #2ecc71; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                                    ✔ Aprovar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Adiciona eventos aos botões
        container.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                
                // USA O NOVO MODAL
                const confirmed = await showConfirmModal('Deseja aprovar esta alteração? A chamada atual será substituída.');
                if (!confirmed) return;

                try {
                    btn.textContent = '...';
                    btn.disabled = true;
                    await fetchApi(`/api/chamada/approve-request/${id}`, { method: 'POST' });
                    showToast('Solicitação aprovada e chamada atualizada!', 'success');
                    renderPendingRequestsWidget(viewElement); // Recarrega a lista
                } catch (error) {
                    showToast('Erro ao aprovar: ' + error.message, 'error');
                    btn.textContent = '✔ Aprovar';
                    btn.disabled = false;
                }
            });
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p>Erro ao carregar solicitações.</p>';
    }
}

// --- WIDGET DE RELATÓRIO (MANTIDO COMPLETO) ---
async function renderReportWidget(viewElement) {
    const role = getUserRole();
    const isDirector = role === 'DIRETOR';
    let groupOptionsHTML = '';

    if (isDirector) {
        try {
            const groupPage = await fetchApi('/api/groups?page=0&size=999'); 
            const fetchedGroups = groupPage.content
                .map(detail => detail.group) 
                .filter(group => group && group.id && group.name);
            
            groupOptionsHTML = fetchedGroups.map(group => 
                `<option value="${group.id}">${group.name}</option>`
            ).join('');
            
        } catch (error) {
            console.error("Erro ao carregar grupos:", error);
            groupOptionsHTML = '<option value="">Erro ao carregar</option>';
        }
    }
    
    const groupSelectorHTML = isDirector ? `
        <div class="form-group" style="flex: 1;">
            <label for="report-group">Selecione o Grupo:</label>
            <select id="report-group" class="form-control">
                <option value="">Selecione um grupo...</option>
                ${groupOptionsHTML}
            </select>
        </div>
    ` : '';

    viewElement.querySelector('#report-widget-container').innerHTML = `
        <div class="admin-widget">
            <h2>Relatório de Presença</h2>
            <div class="form-row" style="align-items: flex-end; gap: 1rem;">
                ${groupSelectorHTML}
                <div class="form-group" style="flex: 1;">
                    <label for="report-date">Selecione a data:</label>
                    <select id="report-date" class="form-control">
                        <option value="">A carregar datas...</option>
                    </select>
                </div>
                <div class="form-group" style="flex-grow: 0;">
                    <button id="generate-report-btn" class="action-btn" style="width: auto; padding: 12px 20px;">Gerar Relatório</button>
                </div>
            </div>
            <div id="report-container" class="printable-area" style="margin-top: 1.5rem;">
            </div>
        </div>
    `;

    const generateReportBtn = viewElement.querySelector('#generate-report-btn');
    const reportContainer = viewElement.querySelector('#report-container');
    const reportDateSelect = viewElement.querySelector('#report-date');
    const reportGroupInput = viewElement.querySelector('#report-group'); 

    async function loadDates() {
        reportDateSelect.innerHTML = '<option>A carregar...</option>';
        let url = '/api/chamada/dates-with-records';
        
        if (isDirector && reportGroupInput && reportGroupInput.value) {
            url += `?groupId=${reportGroupInput.value}`;
        }

        try {
            const dates = await fetchApi(url);
            if (dates.length > 0) {
                reportDateSelect.innerHTML = dates.map(d => {
                    const formattedDate = d.split('-').reverse().join('/');
                    return `<option value="${d}">${formattedDate}</option>`;
                }).join('');
            } else {
                reportDateSelect.innerHTML = '<option value="">Sem registos disponíveis</option>';
            }
        } catch (e) {
            console.error(e);
            reportDateSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    await loadDates();

    if (isDirector && reportGroupInput) {
        reportGroupInput.addEventListener('change', async (e) => {
            currentPage = 0; 
            const newGroupId = e.target.value;
            renderUserList(viewElement, newGroupId); 
            await loadDates(); 
        });
    }

    generateReportBtn.addEventListener('click', async () => {
        const currentGroupSelect = document.getElementById('report-group');
        const currentDateSelect = document.getElementById('report-date');
        
        const selectedDate = currentDateSelect ? currentDateSelect.value : null;
        let selectedGroupId = null;

        if (!selectedDate) {
            showToast('Por favor, selecione uma data válida.', 'warning');
            return;
        }

        if (isDirector) {
            selectedGroupId = currentGroupSelect ? currentGroupSelect.value : null;

            if (!selectedGroupId || selectedGroupId === "") { 
                showToast('É necessário selecionar um Grupo específico para o relatório.', 'error');
                if(currentGroupSelect) {
                    currentGroupSelect.style.border = "2px solid red";
                    setTimeout(() => currentGroupSelect.style.border = "", 2000);
                }
                return; 
            }
        }
        
        reportContainer.innerHTML = '<p>A gerar relatório...</p>';

        try {
            const queryParams = new URLSearchParams({ date: selectedDate });
            if (selectedGroupId) {
                queryParams.append('groupId', selectedGroupId);
            }
            
            const reportData = await fetchApi(`/api/chamada/report?${queryParams.toString()}`);
            
            if (reportData.length === 0) {
                reportContainer.innerHTML = `<p>Nenhuma chamada encontrada para este dia.</p>`;
                showToast('Nenhum registro encontrado.', 'warning');
                return;
            }

            // REINSERIDO AQUI O SEU HTML COMPLETO DE RELATÓRIO
            reportContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Relatório de Presença - ${selectedDate.split('-').reverse().join('/')}</h3>
                </div>
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Nome do Aluno</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.map(item => `
                            <tr>
                                <td>
                                    <div class="user-info-cell">
                                        <img src="${item.avatar || 'img/escoteiro1.png'}" alt="Avatar" class="avatar-img-small" />
                                        <span>${item.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style="
                                        padding: 6px 12px; 
                                        border-radius: 20px; 
                                        font-size: 0.85rem;
                                        font-weight: 600; 
                                        background-color: ${item.status === 'PRESENTE' ? '#d1e7dd' : '#f8d7da'};
                                        color: ${item.status === 'PRESENTE' ? '#0f5132' : '#842029'};
                                        border: 1px solid ${item.status === 'PRESENTE' ? '#badbcc' : '#f5c2c7'};
                                    ">
                                        ${item.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <button id="print-report-btn" class="action-btn" style="width: auto; padding: 10px 15px; margin-top: 1rem;">Imprimir Relatório</button>
            `;
            
            showToast('Relatório gerado com sucesso!', 'success');

            const printBtn = viewElement.querySelector('#print-report-btn');
            if (printBtn) {
                printBtn.addEventListener('click', () => {
                    const printableContent = reportContainer.cloneNode(true);
                    const btnToRemove = printableContent.querySelector('#print-report-btn');
                    if(btnToRemove) btnToRemove.remove(); 
                    
                    const printContents = printableContent.innerHTML;

                    const printWindow = window.open('', '', 'height=600,width=800');
                    printWindow.document.write('<html><head><title>Relatório de Presença</title>');
                    printWindow.document.write('<link rel="stylesheet" href="css/main.css">'); 
                    // REINSERIDO OS ESTILOS DETALHADOS DE IMPRESSÃO
                    printWindow.document.write(`
                        <style>
                            body{padding:40px; font-family: sans-serif;} 
                            h3 {text-align: center; margin-bottom: 30px;}
                            table{width:100%;border-collapse:collapse; margin-top: 20px;} 
                            th {background-color: #f8f9fa; font-weight: bold;}
                            th,td{border:1px solid #dee2e6;padding:12px;text-align:left;} 
                            img {display: none;}
                            .user-info-cell span { font-weight: 500; font-size: 14px;}
                        </style>
                    `);
                    printWindow.document.write('</head><body onload="setTimeout(() => {window.print(); window.close();}, 500);">');
                    printWindow.document.write('<div class="printable-area">'); 
                    printWindow.document.write(printContents);
                    printWindow.document.write('</div>');
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                });
            }

        } catch (error) {
            console.error("Erro no relatório:", error);
            showToast('Erro ao gerar relatório. Tente novamente.', 'error');
        }
    });
}

function renderDashboardData(viewElement) {
    renderReportWidget(viewElement);
    renderPendingRequestsWidget(viewElement); // NOVO
    
    setTimeout(() => {
        const currentGroupInput = document.getElementById('report-group'); 
        let currentGroupId = null;
        if (currentGroupInput && currentGroupInput.value) {
            currentGroupId = currentGroupInput.value;
        }
        renderUserList(viewElement, currentGroupId);
    }, 100); 
}

export async function renderDashboardView(viewElement) {
    viewElement.innerHTML = `
        <div id="report-widget-container">
             <p>A carregar widget de relatório...</p>
        </div>

        <div class="admin-widget" style="margin-top: 2rem; border-left: 5px solid #f39c12;">
            <h2>Solicitações de Correção Pendentes</h2>
            <div id="pending-requests-container"></div>
        </div>

        <div class="admin-widget" style="margin-top: 2rem;">
            <h2>Visão Geral dos Desbravadores</h2>
            <div id="user-list-container">
                <p>A carregar lista de utilizadores...</p>
            </div>
            <div id="user-pagination-controls" class="pagination-controls">
                </div>
        </div>
    `;
    
    renderDashboardData(viewElement);
}