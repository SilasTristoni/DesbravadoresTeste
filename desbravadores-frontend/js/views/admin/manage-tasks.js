// js/views/admin/manage-tasks.js

// A função fetchApi está disponível globalmente

// Estado para rastrear qual tarefa está sendo editada
let editingTaskId = null;


// Função auxiliar para obter as tarefas do mês atual e renderizar a tabela
async function renderTaskList(viewElement) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // API espera 1-12
    
    const taskListContainer = viewElement.querySelector('#task-list-data');
    taskListContainer.innerHTML = '<p>A carregar tarefas...</p>';
    
    try {
        const tasks = await fetchApi(`/api/tasks?year=${currentYear}&month=${currentMonth}`);
        
        if (tasks.length === 0) {
            taskListContainer.innerHTML = `<p>Nenhuma tarefa agendada para este mês (${currentMonth}/${currentYear}).</p>`;
            return;
        }

        // Ordena por data
        tasks.sort((a, b) => new Date(a.date) - new Date(b.date));

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
                        const dateFormatted = new Date(task.date).toLocaleDateString('pt-BR');
                        const timeFormatted = task.time.substring(0, 5);
                        
                        // Se esta for a tarefa em edição, renderiza o formulário
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
                                            <div class="form-actions">
                                                <button type="submit" class="action-btn-small" style="background-color: var(--scout-light-green);">Salvar</button>
                                                <button type="button" class="action-btn-small cancel-edit-btn" style="background-color: var(--text-secondary);">Cancelar</button>
                                            </div>
                                        </form>
                                    </td>
                                </tr>
                            `;
                        }
                        
                        // Modo de visualização padrão
                        return `
                            <tr data-task-id="${task.id}">
                                <td>${dateFormatted}</td>
                                <td>${timeFormatted}</td>
                                <td>${task.title}</td>
                                <td title="${task.description || 'Sem descrição.'}">${(task.description || '').substring(0, 30)}...</td>
                                <td>
                                    <button class="action-btn-small edit-task-btn" data-task-id="${task.id}">Editar</button>
                                    <button class="action-btn-small delete-task-btn" data-task-id="${task.id}">Apagar</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        // --- LISTENERS DE AÇÃO ---

        // 1. Apagar tarefa
        taskListContainer.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const taskId = e.currentTarget.dataset.taskId;
                const row = e.currentTarget.closest('tr');
                const taskTitle = row.querySelector('td:nth-child(3)').textContent;
                
                if (confirm(`Tem a certeza que deseja APAGAR a tarefa: "${taskTitle}"?`)) {
                    try {
                        // O endpoint DELETE retorna 204 No Content, que fetchApi trata como sucesso (retorno null)
                        await fetchApi(`/api/tasks/${taskId}`, { method: 'DELETE' });
                        alert(`Tarefa "${taskTitle}" apagada com sucesso!`);
                        // Reinicializa o ID de edição e re-renderiza a lista
                        editingTaskId = null;
                        renderTaskList(viewElement);
                    } catch (error) {
                        alert(`Erro ao apagar tarefa: ${error.message}`);
                    }
                }
            });
        });
        
        // 2. Iniciar Edição
        taskListContainer.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Define o ID da tarefa em edição e re-renderiza a lista
                editingTaskId = parseInt(e.currentTarget.dataset.taskId, 10);
                renderTaskList(viewElement);
            });
        });
        
        // 3. Cancelar Edição
        taskListContainer.querySelectorAll('.cancel-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Limpa o ID de edição e re-renderiza a lista
                editingTaskId = null;
                renderTaskList(viewElement);
            });
        });
        
        // 4. Salvar Edição
        const editForm = taskListContainer.querySelector('.edit-task-form');
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const taskId = editForm.dataset.taskId;
                
                const payload = {
                    title: editForm.elements.title.value,
                    description: editForm.elements.description.value,
                    date: editForm.elements.date.value,
                    time: editForm.elements.time.value,
                };
                
                try {
                    const saveButton = editForm.querySelector('button[type="submit"]');
                    saveButton.textContent = 'Salvando...';
                    saveButton.disabled = true;
                    
                    await fetchApi(`/api/tasks/${taskId}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                    
                    alert('Tarefa atualizada com sucesso!');
                    editingTaskId = null;
                    renderTaskList(viewElement); // Re-renderiza para mostrar os dados atualizados
                    
                } catch (error) {
                    alert(`Erro ao salvar tarefa: ${error.message}`);
                    editForm.querySelector('button[type="submit"]').textContent = 'Salvar';
                    editForm.querySelector('button[type="submit"]').disabled = false;
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
            <form id="task-form" class="task-form">
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

    const newTask = {
      date: viewElement.querySelector("#task-date").value,
      time: viewElement.querySelector("#task-time").value,
      title: viewElement.querySelector("#task-title").value,
      description: viewElement.querySelector("#task-description").value,
    };

    try {
        await fetchApi('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(newTask)
        });

        alert(`Tarefa "${newTask.title}" adicionada com sucesso!`);
        taskForm.reset();
        
        // Re-renderiza a lista de tarefas após o sucesso
        renderTaskList(viewElement);

    } catch (error) {
        console.error("Falha ao criar tarefa:", error);
        alert(`Erro ao criar tarefa: ${error.message}`);
    }
  });
  
  // Renderiza a lista de tarefas ao carregar a vista
  renderTaskList(viewElement);
}