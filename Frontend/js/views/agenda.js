// views/agenda.js
import { fetchTasks } from '../api.js'; // Supondo que você tenha uma função para buscar tarefas em api.js
import { showModal } from '../../components/modal.js';

let intervalId = null; // Variável para guardar o ID do nosso intervalo

const renderAgenda = async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="agenda-container">
            <h2>Agenda de Atividades</h2>
            <div id="task-list" class="task-list">
                <!-- As tarefas serão inseridas aqui -->
            </div>
        </div>
    `;

    // Função para carregar e renderizar as tarefas
    const loadAndRenderTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Token não encontrado');
                window.location.href = 'login.html';
                return;
            }

            // Acessa a API para buscar as tarefas
            const response = await fetch('http://localhost:3001/api/tasks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar tarefas');
            }

            const tasks = await response.json();
            const taskList = document.getElementById('task-list');
            if (!taskList) return; // Se o usuário saiu da página, não faz nada
            
            taskList.innerHTML = ''; // Limpa a lista antes de adicionar as tarefas atualizadas

            if (tasks.length === 0) {
                taskList.innerHTML = '<p>Nenhuma atividade agendada.</p>';
            } else {
                tasks.forEach(task => {
                    const taskElement = document.createElement('div');
                    taskElement.className = 'task-item';
                    taskElement.innerHTML = `
                        <div class="task-date">
                            <span>${new Date(task.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                        </div>
                        <div class="task-details">
                            <h3>${task.title}</h3>
                            <p>${task.description || ''}</p>
                            ${task.time ? `<p><strong>Horário:</strong> ${task.time}</p>` : ''}
                        </div>
                    `;
                    taskList.appendChild(taskElement);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            showModal('Erro ao carregar as atividades. Tente novamente mais tarde.');
        }
    };

    // 1. Carrega as tarefas imediatamente ao entrar na página
    await loadAndRenderTasks();

    // 2. Define um intervalo para recarregar as tarefas a cada 10 segundos (10000 milissegundos)
    // Isso manterá a página do usuário sincronizada com o banco de dados.
    if (intervalId) clearInterval(intervalId); // Limpa qualquer intervalo anterior
    intervalId = setInterval(loadAndRenderTasks, 10000);

    // Limpa o intervalo quando o usuário sai da página (muito importante!)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (!document.body.contains(mainContent)) {
                clearInterval(intervalId);
                observer.disconnect();
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
};

export default renderAgenda;
// O código acima define uma função para renderizar a agenda de atividades, buscar as tarefas do servidor e atualizar a interface do usuário.
// Ele também implementa um intervalo para recarregar as tarefas a cada 10 segundos