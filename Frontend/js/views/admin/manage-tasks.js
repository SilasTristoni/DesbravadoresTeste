import { appState } from "../../state.js";

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
