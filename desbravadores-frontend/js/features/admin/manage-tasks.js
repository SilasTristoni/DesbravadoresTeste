// js/views/admin/manage-tasks.js

// Importa showModal e showToast com os caminhos corretos
import { showModal } from '../../components/modal.js';
import { showToast as toastFunc} from '../../ui/toast.js';

// Garante que showToast esteja disponível globalmente
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

// --- NOVO ESTADO E CONSTANTES ---
let editingTaskId = null;
let currentTaskPage = 0; 
const TASK_PAGE_SIZE = 10; 

// Função auxiliar para criar corpo do modal de confirmação
function createConfirmationModalBody(message, confirmCallback) {
    const container = document.createElement('div');
    container.innerHTML = `<p>${message}</p>`;
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirmar';
    confirmButton.className = 'action-btn save'; 
    confirmButton.style.marginTop = '1rem';
    confirmButton.onclick = () => {
        confirmCallback();
        document.getElementById('closeModalBtn').click(); 
    };
    container.appendChild(confirmButton);
    return container;
}

/**
 * Função para renderizar os controlos de paginação
 */
function renderPaginationControls(paginationContainer, viewElement, taskPage, loadFunction) {
    paginationContainer.innerHTML = ''; 

    const { number, totalPages, first, last } = taskPage;
    currentTaskPage = number; 

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first;
    prevBtn.addEventListener('click', () => {
        loadFunction(viewElement, number - 1);
    });

    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Página ${number + 1} de ${totalPages}`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Próxima <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = last;
    nextBtn.addEventListener('click', () => {
        loadFunction(viewElement, number + 1);
    });

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}


/**
 * Função para carregar a tabela
 */
async function loadAndRenderTasks(viewElement, page = 0) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; 

    const taskListContainer = viewElement.querySelector('#task-list-data');
    taskListContainer.innerHTML = '<p>A carregar tarefas...</p>';

    try {
        const endpoint = `/api/tasks?year=${currentYear}&month=${currentMonth}&page=${page}&size=${TASK_PAGE_SIZE}&sort=date,asc&sort=time,asc`;
        const taskPage = await fetchApi(endpoint);
        const tasks = taskPage.content; 

        if (taskPage.totalElements === 0) {
            taskListContainer.innerHTML = `<p>Nenhuma tarefa agendada para este mês (${currentMonth}/${currentYear}).</p>`;
            return;
        }

        taskListContainer.innerHTML = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Título</th>
                        <th>Descrição</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks.map(task => {
                        const dateObj = new Date(task.date + 'T00:00:00'); 
                        const dateFormatted = dateObj.toLocaleDateString('pt-BR');
                        const timeFormatted = task.time.substring(0, 5);

                        if (editingTaskId === task.id) {
                            return `
                                <tr data-task-id="${task.id}" class="editing-row">
                                    <td colspan="5">
                                        <form class="edit-task-form" data-task-id="${task.id}">
                                            <div class="form-row">
                                                <div class="form-group"><label>Data</label><input type="date" name="date" value="${task.date}" required></div>
                                                <div class="form-group"><label>Hora</label><input type="time" name="time" value="${task.time}" required></div>
                                                <div class="form-group"><label>Título</label><input type="text" name="title" value="${task.title}" required></div>
                                            </div>
                                            <div class="form-group">
                                                <label>Descrição</label>
                                                <textarea name="description">${task.description || ''}</textarea>
                                            </div>
                                            <div class="form-actions" style="display: flex; gap: 10px;">
                                                <button type="button" class="btn-action cancel cancel-edit-btn" style="background-color: var(--border-color); color: var(--text-primary);">
                                                    <i class="fa-solid fa-times"></i> Cancelar
                                                </button>
                                                <button type="submit" class="btn-action save">
                                                    <i class="fa-solid fa-check"></i> Salvar
                                                </button>
                                            </div>
                                        </form>
                                    </td>
                                </tr>
                            `;
                        }

                        return `
                            <tr data-task-id="${task.id}">
                                <td>${dateFormatted}</td>
                                <td>${timeFormatted}</td>
                                <td>${task.title}</td>
                                <td title="${task.description || 'Sem descrição.'}">${(task.description || '').substring(0, 30)}${(task.description || '').length > 30 ? '...' : ''}</td>
                                <td class="actions-cell">
                                    <button class="btn-action-icon edit edit-task-btn" title="Editar Tarefa" data-task-id="${task.id}">
                                        <i class="fa-solid fa-pencil"></i>
                                    </button>
                                    <button class="btn-action-icon delete delete-task-btn" title="Apagar Tarefa" data-task-id="${task.id}">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div id="task-list-pagination" class="pagination-controls" style="margin-top: 1rem;"></div>
        `;

        const paginationContainer = viewElement.querySelector("#task-list-pagination");
        if (taskPage.totalPages > 1) {
            renderPaginationControls(paginationContainer, viewElement, taskPage, loadAndRenderTasks);
        } else {
            if(paginationContainer) paginationContainer.remove();
        }

        // 1. Apagar tarefa
        taskListContainer.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.taskId;
                const row = e.currentTarget.closest('tr');
                const taskTitle = row.querySelector('td:nth-child(3)').textContent;

                const modalBody = createConfirmationModalBody(`Tem a certeza que deseja APAGAR a tarefa: "${taskTitle}"?`, async () => {
                     btn.disabled = true;
                     btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    try {
                        await fetchApi(`/api/tasks/${taskId}`, { method: 'DELETE' });
                        window.showToast(`Tarefa "${taskTitle}" apagada com sucesso!`, 'success');
                        editingTaskId = null;
                        loadAndRenderTasks(viewElement, currentTaskPage); 
                    } catch (error) {
                        let finalErrorMsg = `Erro ao apagar tarefa: ${error.message}`;
                        try {
                            const parsedError = JSON.parse(error.message);
                            if (parsedError && parsedError.message) finalErrorMsg = parsedError.message;
                        } catch (e) {}
                        window.showToast(finalErrorMsg, 'error');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
                    }
                });
                showModal('Confirmar Exclusão', modalBody);
            });
        });

        // 2. Iniciar Edição
        taskListContainer.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                editingTaskId = parseInt(e.currentTarget.dataset.taskId, 10);
                loadAndRenderTasks(viewElement, currentTaskPage); 
            });
        });

        // 3. Cancelar Edição
        taskListContainer.querySelectorAll('.cancel-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                editingTaskId = null;
                loadAndRenderTasks(viewElement, currentTaskPage); 
            });
        });

        // 4. Salvar Edição
        const editForm = taskListContainer.querySelector('.edit-task-form');
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const taskId = editForm.dataset.taskId;
                const saveButton = editForm.querySelector('button[type="submit"]');
                
                // Validação de edição
                const title = editForm.elements.title.value.trim();
                const date = editForm.elements.date.value;
                const time = editForm.elements.time.value;
                
                if (!title || !date || !time) {
                    return window.showToast('Data, Hora e Título são obrigatórios!', 'error');
                }

                const payload = {
                    title: title,
                    description: editForm.elements.description.value,
                    date: date,
                    time: time,
                };

                saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
                saveButton.disabled = true;

                try {
                    await fetchApi(`/api/tasks/${taskId}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });

                    window.showToast('Tarefa atualizada com sucesso!', 'success');
                    editingTaskId = null;
                    loadAndRenderTasks(viewElement, currentTaskPage); 

                } catch (error) {
                    let finalErrorMsg = "Erro ao salvar tarefa.";
                    try {
                        const parsedError = JSON.parse(error.message);
                        if (parsedError && parsedError.message) finalErrorMsg = parsedError.message;
                    } catch (ex) {
                        finalErrorMsg = error.message || finalErrorMsg;
                    }
                    window.showToast(finalErrorMsg, 'error');
                    saveButton.innerHTML = '<i class="fa-solid fa-check"></i> Salvar';
                    saveButton.disabled = false;
                }
            });
        }

    } catch (error) {
        taskListContainer.innerHTML = `<p style="color: red;">Erro ao carregar lista de tarefas: ${error.message}</p>`;
    }
}


export function renderManageTasksView(viewElement) {
  viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Adicionar Nova Tarefa na Agenda</h2>
            <form id="task-form" class="task-form" novalidate>
                <div class="form-row">
                    <div class="form-group">
                        <label for="task-date">Data</label>
                        <input type="date" id="task-date" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="task-time">Hora</label>
                        <input type="time" id="task-time" class="form-control" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="task-title">Título da Tarefa</label>
                    <input type="text" id="task-title" class="form-control" placeholder="Ex: Trilha Ecológica" required>
                </div>
                <div class="form-group">
                    <label for="task-description">Descrição</label>
                    <textarea id="task-description" class="form-control" placeholder="Detalhes da atividade..."></textarea>
                </div>
                <button type="submit" class="action-btn">Adicionar Tarefa</button>
            </form>
        </div>

        <div class="admin-widget" style="margin-top: 2rem;">
            <h2>Tarefas Agendadas (Mês Atual)</h2>
            <div id="task-list-data">
                </div>
        </div>
    `;

  const taskForm = viewElement.querySelector("#task-form");
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // CORREÇÃO: Validação manual para ativar o Toast
    const date = viewElement.querySelector("#task-date").value;
    const time = viewElement.querySelector("#task-time").value;
    const title = viewElement.querySelector("#task-title").value.trim();
    
    if (!date || !time || !title) {
        return window.showToast('Por favor, preencha todos os campos obrigatórios (marcados com *).', 'error');
    }

    const submitButton = taskForm.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;

    const newTask = {
      date: date,
      time: time,
      title: title,
      description: viewElement.querySelector("#task-description").value.trim(),
    };

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adicionando...';

    try {
        await fetchApi('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(newTask)
        });

        window.showToast(`Tarefa "${newTask.title}" adicionada com sucesso!`, 'success');
        taskForm.reset();
        loadAndRenderTasks(viewElement, 0); 

    } catch (error) {
        // CORREÇÃO: Extrator de erros do Java
        let finalErrorMsg = "Falha ao criar a tarefa.";
        try {
            const parsedError = JSON.parse(error.message);
            if (parsedError && parsedError.message) {
                finalErrorMsg = parsedError.message;
            }
        } catch (parseEx) {
            finalErrorMsg = error.message || finalErrorMsg;
        }

        window.showToast(finalErrorMsg, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
  });

  loadAndRenderTasks(viewElement, 0);
}