// js/views/admin/manage-tasks.js

// A função fetchApi estará disponível globalmente

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

    } catch (error) {
        console.error("Falha ao criar tarefa:", error);
        alert(`Erro ao criar tarefa: ${error.message}`);
    }
  });
}