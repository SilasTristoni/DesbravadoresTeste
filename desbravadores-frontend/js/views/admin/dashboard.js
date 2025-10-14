// js/views/admin/dashboard.js

// A função fetchApi está disponível globalmente

async function renderUserList(viewElement) {
    try {
        const users = await fetchApi('/api/admin/users');
        const scouts = users.filter(user => user.role === 'DESBRAVADOR');
        
        const userListContainer = viewElement.querySelector('#user-list-container');
        if (userListContainer) {
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
                                <td>${user.group ? user.group.name : 'Sem grupo'}</td>
                                <td>${user.level}</td>
                                <td>
                                    <button class="action-btn-small manage-user-btn" data-user-id="${user.id}">Gerir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error("Falha ao carregar utilizadores:", error);
        const userListContainer = viewElement.querySelector('#user-list-container');
        if (userListContainer) {
            userListContainer.innerHTML = `<p style="color: red;">Não foi possível carregar a lista de utilizadores.</p>`;
        }
    }
}


export async function renderDashboardView(viewElement) {
    const today = new Date().toISOString().split('T')[0];
    
    viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Relatório de Presença</h2>
            <div class="form-row" style="align-items: flex-end;">
                <div class="form-group">
                    <label for="report-date">Selecione a data:</label>
                    <input type="date" id="report-date" class="form-control" value="${today}">
                </div>
                <div class="form-group">
                    <button id="generate-report-btn" class="action-btn" style="width: auto; padding: 12px 20px;">Gerar Relatório</button>
                </div>
            </div>
            <div id="report-container" class="printable-area" style="margin-top: 1.5rem;">
                </div>
        </div>

        <div class="admin-widget" style="margin-top: 2rem;">
            <h2>Visão Geral dos Desbravadores</h2>
            <div id="user-list-container">
                <p>A carregar lista de utilizadores...</p>
            </div>
        </div>
    `;

    renderUserList(viewElement);

    const generateReportBtn = viewElement.querySelector('#generate-report-btn');
    const reportContainer = viewElement.querySelector('#report-container');
    const reportDateInput = viewElement.querySelector('#report-date');

    generateReportBtn.addEventListener('click', async () => {
        const selectedDate = reportDateInput.value;
        if (!selectedDate) {
            alert('Por favor, selecione uma data.');
            return;
        }

        reportContainer.innerHTML = '<p>A gerar relatório...</p>';

        try {
            const reportData = await fetchApi(`/api/chamada/report?date=${selectedDate}`);

            if (reportData.length === 0) {
                reportContainer.innerHTML = '<p>Nenhuma chamada encontrada para este dia ou o seu grupo não tem membros.</p>';
                return;
            }

            reportContainer.innerHTML = `
                <h3>Relatório de Presença - ${new Date(selectedDate).toLocaleDateString()}</h3>
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
                                <td>${item.name}</td>
                                <td class="status-${item.status.toLowerCase()}">${item.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <button id="print-report-btn" class="action-btn" style="width: auto; padding: 10px 15px; margin-top: 1rem;">Imprimir</button>
            `;
            
            viewElement.querySelector('#print-report-btn').addEventListener('click', () => {
                const printContents = reportContainer.innerHTML;
                const printWindow = window.open('', '', 'height=600,width=800');
                printWindow.document.write('<html><head><title>Relatório de Presença</title>');
                printWindow.document.write('<link rel="stylesheet" href="css/main.css">');
                printWindow.document.write('<link rel="stylesheet" href="css/admin.css">');
                printWindow.document.write('</head><body onload="window.print(); window.close();">');
                printWindow.document.write(printContents);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
            });

        } catch (error) {
            reportContainer.innerHTML = `<p style="color: red;">Erro ao gerar relatório: ${error.message}</p>`;
        }
    });
}