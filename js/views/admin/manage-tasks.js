// Remova: import { appState } from "../../state.js";

export function renderManageTasksView(viewElement) {
  viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Adicionar Nova Tarefa na Agenda</h2>
            <form id="task-form" class="task-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="task-date">Data</label>
                        <input type="date" id="task-date" required>
                    </div>
                    <div class="form-group">
                        <label for="task-time">Hora</label>
                        <input type="time" id="task-time" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="task-title">Título da Tarefa</label>
                    <input type="text" id="task-title" placeholder="Ex: Trilha Ecológica" required>
                </div>
                <div class="form-group">
                    <label for="task-description">Descrição</label>
                    <textarea id="task-description" placeholder="Detalhes da atividade..."></textarea>
                </div>
                <button type="submit" class="action-btn">Adicionar Tarefa</button>
            </form>
        </div>
    `;

  const taskForm = viewElement.querySelector("#task-form");
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const taskData = {
        date: viewElement.querySelector("#task-date").value,
        time: viewElement.querySelector("#task-time").value,
        title: viewElement.querySelector("#task-title").value,
        description: viewElement.querySelector("#task-description").value,
    };

    try {
        const response = await fetch('http://localhost:3000/api/admin/tarefas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            taskForm.reset();
        } else {
            throw new Error(result.message || 'Erro desconhecido do servidor');
        }
    } catch (error) {
        console.error("Erro ao adicionar tarefa:", error);
        alert(`Não foi possível adicionar a tarefa: ${error.message}`);
    }
  });
}