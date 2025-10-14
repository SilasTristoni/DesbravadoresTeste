<<<<<<< HEAD
// js/views/admin/manage-tasks.js

// A função fetchApi estará disponível globalmente
=======
import { appState } from "../../state.js";
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887

export function renderManageTasksView(viewElement) {
  viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Adicionar Nova Tarefa na Agenda</h2>
            <form id="task-form" class="task-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="task-date">Data</label>
<<<<<<< HEAD
                        <input type="date" id="task-date" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="task-time">Hora</label>
                        <input type="time" id="task-time" class="form-control" required>
=======
                        <input type="date" id="task-date" required>
                    </div>
                    <div class="form-group">
                        <label for="task-time">Hora</label>
                        <input type="time" id="task-time" required>
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
                    </div>
                </div>
                <div class="form-group">
                    <label for="task-title">Título da Tarefa</label>
<<<<<<< HEAD
                    <input type="text" id="task-title" class="form-control" placeholder="Ex: Trilha Ecológica" required>
                </div>
                <div class="form-group">
                    <label for="task-description">Descrição</label>
                    <textarea id="task-description" class="form-control" placeholder="Detalhes da atividade..."></textarea>
=======
                    <input type="text" id="task-title" placeholder="Ex: Trilha Ecológica" required>
                </div>
                <div class="form-group">
                    <label for="task-description">Descrição</label>
                    <textarea id="task-description" placeholder="Detalhes da atividade..."></textarea>
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
                </div>
                <button type="submit" class="action-btn">Adicionar Tarefa</button>
            </form>
        </div>
    `;

  const taskForm = viewElement.querySelector("#task-form");
<<<<<<< HEAD
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
=======
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const date = new Date(viewElement.querySelector("#task-date").value);
    const time = viewElement.querySelector("#task-time").value;
    const title = viewElement.querySelector("#task-title").value;
    const description = viewElement.querySelector("#task-description").value;

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const newActivity = { time, title, description };

    if (!appState.agenda.activities[year]) {
      appState.agenda.activities[year] = {};
    }
    if (!appState.agenda.activities[year][month]) {
      appState.agenda.activities[year][month] = {};
    }
    if (!appState.agenda.activities[year][month][day]) {
      appState.agenda.activities[year][month][day] = [];
    }

    appState.agenda.activities[year][month][day].push(newActivity);

    alert(
      `Tarefa "${title}" adicionada para o dia ${day + 1}/${month + 1}/${year}!`
    );
    taskForm.reset();
  });
}
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
