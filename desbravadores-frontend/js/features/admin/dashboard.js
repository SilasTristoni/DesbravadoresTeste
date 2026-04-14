// js/views/admin/dashboard.js

const toastStyle = document.createElement('style');
toastStyle.innerHTML = `
    .toast-notification { position: fixed; top: 20px; right: 20px; background-color: #333; color: white; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; opacity: 0; transform: translateY(-20px); transition: all 0.3s ease; display: flex; align-items: center; gap: 10px; font-family: 'Segoe UI', sans-serif; font-size: 14px; }
    .toast-notification.show { opacity: 1; transform: translateY(0); }
    .toast-success { border-left: 5px solid #2ecc71; }
    .toast-error { border-left: 5px solid #e74c3c; }
    .toast-warning { border-left: 5px solid #f1c40f; }
`;
document.head.appendChild(toastStyle);

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    let icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => document.body.removeChild(toast), 300); }, 4000);
}

function showConfirmModal(message) {
    return new Promise((resolve) => {
        const modalId = 'dashboard-confirm-modal';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();
        const modalOverlay = document.createElement('div');
        modalOverlay.id = modalId;
        modalOverlay.className = 'modal active'; 
        modalOverlay.style.zIndex = '10000'; 
        modalOverlay.innerHTML = `
            <div class="modal-content" style="text-align: center; max-width: 400px; padding: 25px;">
                <div class="modal-header" style="justify-content: center; border-bottom: none; padding-bottom: 0;"><h3 class="modal-title" style="font-size: 1.5rem;">Confirmação</h3></div>
                <p class="modal-description" style="margin: 15px 0 25px; color: var(--text-primary); font-size: 1.1rem;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="dash-modal-cancel" class="btn-action cancel" style="background-color: var(--border-color); color: var(--text-primary);">Cancelar</button>
                    <button id="dash-modal-confirm" class="btn-action save">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        const close = (result) => { modalOverlay.classList.remove('active'); setTimeout(() => modalOverlay.remove(), 300); resolve(result); };
        document.getElementById('dash-modal-confirm').addEventListener('click', () => close(true));
        document.getElementById('dash-modal-cancel').addEventListener('click', () => close(false));
    });
}

let currentPage = 0;
const pageSize = 5; 

function getUserRole() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])).role; } catch (error) { return null; }
}

function renderPaginationControls(viewElement, page) {
    const paginationContainer = viewElement.querySelector('#user-pagination-controls');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = ''; 

    const totalPages = page.totalPages ?? page.page?.totalPages ?? 1;
    const number = page.number ?? page.page?.number ?? 0;
    const prevDisabled = number === 0 ? 'disabled' : '';
    paginationContainer.innerHTML += `<button id="prevPageBtn" class="pagination-btn" ${prevDisabled}><i class="fa-solid fa-arrow-left"></i> Anterior</button>`;

    for (let i = 0; i < totalPages; i++) {
        const activeClass = number === i ? 'active' : '';
        paginationContainer.innerHTML += `<button class="pagination-btn page-number-btn ${activeClass}" data-page="${i}">${i + 1}</button>`;
    }

    const nextDisabled = number === totalPages - 1 ? 'disabled' : '';
    paginationContainer.innerHTML += `<button id="nextPageBtn" class="pagination-btn" ${nextDisabled}>Próximo <i class="fa-solid fa-arrow-right"></i></button>`;
    
    viewElement.querySelector('#prevPageBtn').addEventListener('click', () => {
        if (number > 0) { currentPage = number - 1; renderUserList(viewElement, document.getElementById('report-group')?.value); }
    });
    viewElement.querySelector('#nextPageBtn').addEventListener('click', () => {
        if (number < totalPages - 1) { currentPage = number + 1; renderUserList(viewElement, document.getElementById('report-group')?.value); }
    });
    viewElement.querySelectorAll('.page-number-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { currentPage = parseInt(e.target.dataset.page, 10); renderUserList(viewElement, document.getElementById('report-group')?.value); });
    });
}

async function renderUserList(viewElement, groupId = null) {
    const userListContainer = viewElement.querySelector('#user-list-container');
    try {
        let endpoint = `/api/admin/users?page=${currentPage}&size=${pageSize}`;
        if (groupId && groupId !== "") endpoint += `&groupId=${groupId}`;
        
        const responsePage = await fetchApi(endpoint); 
        const scouts = responsePage.content ? responsePage.content : (Array.isArray(responsePage) ? responsePage : []);
        const totalPagesSafe = responsePage.totalPages ?? responsePage.page?.totalPages ?? 0;

        if (scouts.length === 0 && totalPagesSafe > 0 && currentPage > 0) {
            currentPage = Math.max(0, totalPagesSafe - 1);
            return renderUserList(viewElement, groupId); 
        }

        if (scouts.length === 0) {
            userListContainer.innerHTML = '<p>Nenhum desbravador encontrado.</p>';
            if(viewElement.querySelector('#user-pagination-controls')) viewElement.querySelector('#user-pagination-controls').innerHTML = '';
            return;
        }
        
        userListContainer.innerHTML = `
            <table class="user-table">
                <thead><tr><th>Nome</th><th>Grupo</th><th>Nível</th><th style="text-align: right;">Ações</th></tr></thead>
                <tbody>
                    ${scouts.map(user => `
                        <tr>
                            <td><div class="user-info-cell"><img src="${user.avatar || 'assets/images/escoteiro1.png'}" alt="Avatar" class="avatar-img-small" /><span>${user.name} ${user.surname}</span></div></td>
                            <td>${(user.group && user.group.name) ? user.group.name : 'Sem grupo'}</td>
                            <td>${user.level}</td>
                            <td class="actions-cell">
                                <button class="btn-action manage-user-btn" data-user-id="${user.id}" style="background-color: #0056b3;"><i class="fa-solid fa-user-gear"></i> Gerir</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        renderPaginationControls(viewElement, responsePage);

        // CORRIGIDO: Envia o objeto completo do user na navegação
        userListContainer.querySelectorAll('.manage-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.currentTarget.dataset.userId, 10);
                fetchApi(`/api/admin/users/${userId}`)
                    .then((userToManage) => {
                        const event = new CustomEvent('navigate', { detail: { view: 'manage-profile', data: userToManage } });
                        window.dispatchEvent(event);
                    })
                    .catch(() => {
                        showToast('Nao foi possivel carregar o perfil completo do utilizador.', 'error');
                    });
            });
        });
        
    } catch (error) {
        userListContainer.innerHTML = `<p style="color: red;">Não foi possível carregar a lista de utilizadores.</p>`;
    }
}

async function renderPendingRequestsWidget(viewElement) {
    const container = viewElement.querySelector('#pending-requests-container');
    if (!container || getUserRole() !== 'DIRETOR') { if(container) container.parentNode.style.display = 'none'; return; }
    try {
        container.innerHTML = '<p>A carregar solicitações...</p>';
        const requests = await fetchApi('/api/chamada/pending-requests');
        if (requests.length === 0) { container.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Nenhuma solicitação de correção pendente.</p>'; return; }
        container.innerHTML = `
            <table class="user-table">
                <thead><tr><th>Grupo</th><th>Monitor</th><th>Data da Chamada</th><th style="text-align: right;">Ação</th></tr></thead>
                <tbody>
                    ${requests.map(req => `<tr><td>${req.groupName}</td><td>${req.monitorName}</td><td>${req.date}</td><td class="actions-cell"><button class="btn-action save btn-approve" data-id="${req.id}"><i class="fa-solid fa-check"></i> Aprovar</button></td></tr>`).join('')}
                </tbody>
            </table>
        `;
        container.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const confirmed = await showConfirmModal('Deseja aprovar esta alteração? A chamada atual será substituída.');
                if (!confirmed) return;
                try {
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Aprovando...';
                    btn.disabled = true;
                    await fetchApi(`/api/chamada/approve-request/${id}`, { method: 'POST' });
                    showToast('Solicitação aprovada e chamada atualizada!', 'success');
                    renderPendingRequestsWidget(viewElement); 
                } catch (error) { showToast('Erro ao aprovar.', 'error'); btn.innerHTML = '<i class="fa-solid fa-check"></i> Aprovar'; btn.disabled = false; }
            });
        });
    } catch (error) { container.innerHTML = '<p>Erro ao carregar solicitações.</p>'; }
}

async function renderReportWidget(viewElement) {
    const role = getUserRole();
    const isDirector = role === 'DIRETOR';
    let groupOptionsHTML = '';

    if (isDirector) {
        try {
            const groupPage = await fetchApi('/api/groups?page=0&size=999'); 
            const fetchedGroups = groupPage.content.map(detail => detail.group).filter(group => group && group.id && group.name);
            groupOptionsHTML = fetchedGroups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');
        } catch (error) { groupOptionsHTML = '<option value="">Erro</option>'; }
    }
    
    const groupSelectorHTML = isDirector ? `<div class="form-group"><label for="report-group">Selecione o Grupo:</label><select id="report-group" class="form-control"><option value="">Selecione um grupo...</option>${groupOptionsHTML}</select></div>` : '';

    viewElement.querySelector('#report-widget-container').innerHTML = `
        <div class="admin-widget">
            <h2>Relatório de Presença</h2>
            <div class="form-row" style="align-items: flex-end; gap: 15px;">
                ${groupSelectorHTML}
                <div class="form-group"><label for="report-date">Selecione a data:</label><select id="report-date" class="form-control"><option value="">A carregar...</option></select></div>
                <div class="form-group" style="flex-grow: 0;"><button id="generate-report-btn" class="btn-action" style="background-color: #0056b3; padding: 12px 24px; font-size: 1rem; height: 47px; white-space: nowrap;"><i class="fa-solid fa-magnifying-glass-chart"></i> Gerar Relatório</button></div>
            </div>
            <div id="report-container" class="printable-area" style="margin-top: 2rem;"></div>
        </div>
    `;

    const generateReportBtn = viewElement.querySelector('#generate-report-btn');
    const reportContainer = viewElement.querySelector('#report-container');
    const reportDateSelect = viewElement.querySelector('#report-date');
    const reportGroupInput = viewElement.querySelector('#report-group'); 

    async function loadDates() {
        reportDateSelect.innerHTML = '<option>A carregar...</option>';
        let url = '/api/chamada/dates-with-records';
        if (isDirector && reportGroupInput && reportGroupInput.value) url += `?groupId=${reportGroupInput.value}`;
        try {
            const dates = await fetchApi(url);
            reportDateSelect.innerHTML = dates.length > 0 ? dates.map(d => `<option value="${d}">${d.split('-').reverse().join('/')}</option>`).join('') : '<option value="">Sem registos disponíveis</option>';
        } catch (e) { reportDateSelect.innerHTML = '<option value="">Erro ao carregar</option>'; }
    }

    await loadDates();
    if (isDirector && reportGroupInput) { reportGroupInput.addEventListener('change', async (e) => { currentPage = 0; renderUserList(viewElement, e.target.value); await loadDates(); }); }

    generateReportBtn.addEventListener('click', async () => {
        const selectedDate = document.getElementById('report-date') ? document.getElementById('report-date').value : null;
        let selectedGroupId = isDirector && reportGroupInput ? reportGroupInput.value : null;

        if (!selectedDate) return showToast('Por favor, selecione uma data válida.', 'warning');
        if (isDirector && (!selectedGroupId || selectedGroupId === "")) return showToast('Selecione um Grupo.', 'error');
        
        reportContainer.innerHTML = '<p>A gerar relatório...</p>';

        try {
            const queryParams = new URLSearchParams({ date: selectedDate });
            if (selectedGroupId) queryParams.append('groupId', selectedGroupId);
            const reportData = await fetchApi(`/api/chamada/report?${queryParams.toString()}`);
            
            if (reportData.length === 0) { reportContainer.innerHTML = `<p>Nenhuma chamada encontrada.</p>`; return; }

            reportContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                    <h3 style="margin: 0; color: var(--text-primary);"><i class="fa-solid fa-clipboard-user" style="color: var(--scout-green); margin-right: 8px;"></i> Relatório de Presença - ${selectedDate.split('-').reverse().join('/')}</h3>
                    <button id="print-report-btn" class="btn-action save" style="padding: 10px 20px;"><i class="fa-solid fa-print"></i> Imprimir</button>
                </div>
                <table class="user-table">
                    <thead><tr><th>Nome do Aluno</th><th>Status</th></tr></thead>
                    <tbody>
                        ${reportData.map(item => `<tr><td><div class="user-info-cell"><img src="${item.avatar || 'assets/images/escoteiro1.png'}" class="avatar-img-small" /><span>${item.name}</span></div></td><td><span class="status-badge ${item.status === 'PRESENTE' ? 'presente' : 'ausente'}">${item.status}</span></td></tr>`).join('')}
                    </tbody>
                </table>
            `;
            const printBtn = viewElement.querySelector('#print-report-btn');
            if (printBtn) {
                printBtn.addEventListener('click', () => {
                    const printableContent = reportContainer.cloneNode(true);
                    if(printableContent.querySelector('#print-report-btn')) printableContent.querySelector('#print-report-btn').remove(); 
                    const printWindow = window.open('', '', 'height=600,width=800');
                    printWindow.document.write('<html><head><title>Relatório</title><link rel="stylesheet" href="css/main.css"><style>body{padding:40px; font-family: sans-serif;} h3 {text-align: center; margin-bottom: 30px;} table{width:100%;border-collapse:collapse; margin-top: 20px;} th {background-color: #f8f9fa; font-weight: bold;} th,td{border:1px solid #dee2e6;padding:12px;text-align:left;} img {display: none;} .user-info-cell span { font-weight: 500; font-size: 14px;}</style></head><body onload="setTimeout(() => {window.print(); window.close();}, 500);"><div class="printable-area">'); 
                    printWindow.document.write(printableContent.innerHTML);
                    printWindow.document.write('</div></body></html>');
                    printWindow.document.close();
                });
            }
        } catch (error) { showToast('Erro ao gerar relatório.', 'error'); }
    });
}

export async function renderDashboardView(viewElement) {
    viewElement.innerHTML = `
        <div id="report-widget-container"><p>A carregar widget de relatório...</p></div>
        <div class="admin-widget widget-warning"><h2>Solicitações de Correção Pendentes</h2><div id="pending-requests-container"></div></div>
        <div class="admin-widget"><h2>Visão Geral dos Desbravadores</h2><div id="user-list-container"><p>A carregar lista de utilizadores...</p></div><div id="user-pagination-controls" class="pagination-controls"></div></div>
    `;
    renderReportWidget(viewElement);
    renderPendingRequestsWidget(viewElement); 
    setTimeout(() => { renderUserList(viewElement, document.getElementById('report-group')?.value); }, 100); 
}
