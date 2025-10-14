<<<<<<< HEAD
// js/views/agenda.js
import { showModal } from '../../components/modal.js';

// Estado local para controlar o calendário, independente do state.js
const agendaState = {
    currentMonth: new Date().getMonth(), // Mês atual (0-11)
    currentYear: new Date().getFullYear(),
    selectedDay: new Date().getDate(),
    activities: {} // Onde vamos armazenar as atividades do mês buscadas da API
};

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Função para buscar as atividades do mês na API
async function fetchActivitiesForMonth(year, month) {
    try {
        // A API espera o mês como 1-12, então adicionamos 1
        const tasks = await fetchApi(`/api/tasks?year=${year}&month=${month + 1}`);
        
        // Organiza as tarefas por dia para fácil acesso
        const activitiesByDay = {};
        tasks.forEach(task => {
            // A data vem como 'YYYY-MM-DD', precisamos do dia
            const day = parseInt(task.date.split('-')[2], 10);
            if (!activitiesByDay[day]) {
                activitiesByDay[day] = [];
            }
            activitiesByDay[day].push(task);
        });
        agendaState.activities = activitiesByDay;

    } catch (error) {
        console.error("Erro ao buscar atividades:", error);
        agendaState.activities = {}; // Limpa as atividades em caso de erro
    } finally {
        // Após buscar os dados, renderiza o calendário e a timeline
        renderCalendar();
        renderTimeline();
    }
}

function renderTimeline() {
    const { currentYear, currentMonth, selectedDay, activities } = agendaState;
=======
import { appState } from '../state.js';
// CAMINHO CORRIGIDO:
import { showModal } from '../../components/modal.js';

function renderTimeline(year, month, day) {
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
    const timelineContainer = document.getElementById('timeline');
    const scheduleTitle = document.getElementById('scheduleTitle');
    if (!timelineContainer || !scheduleTitle) return;

<<<<<<< HEAD
    const date = new Date(currentYear, currentMonth, selectedDay);
    scheduleTitle.textContent = `${dayNames[date.getDay()]}, ${selectedDay} de ${monthNames[currentMonth]}`;

    const dayActivities = activities[selectedDay] || [];
=======
    const { dayNames, months, activities } = appState.agenda;
    const date = new Date(year, month, day);
    
    scheduleTitle.textContent = `${dayNames[date.getDay()]}, ${day} de ${months[month]}`;

    const dayActivities = activities[year]?.[month]?.[day] || [];
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
    
    if (dayActivities.length === 0) {
        timelineContainer.innerHTML = `<p>Nenhuma atividade programada para este dia.</p>`;
        return;
    }

    timelineContainer.innerHTML = dayActivities.map(act => `
        <div class="timeline-item">
<<<<<<< HEAD
            <div class="timeline-time">${act.time.substring(0, 5)}</div>
            <div class="timeline-content" data-title="${act.title}" data-description="${act.description || 'Sem descrição.'}">
=======
            <div class="timeline-time">${act.time}</div>
            <div class="timeline-content" data-title="${act.title}" data-description="${act.description}">
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
                <div class="timeline-title">${act.title}</div>
            </div>
        </div>
    `).join('');
    
    timelineContainer.querySelectorAll('.timeline-content').forEach(item => {
        item.addEventListener('click', () => {
<<<<<<< HEAD
            showModal(item.dataset.title, item.dataset.description);
=======
            const title = item.dataset.title;
            const description = item.dataset.description;
            showModal(title, description);
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
        });
    });
}

function renderCalendar() {
<<<<<<< HEAD
    const { currentYear, currentMonth, selectedDay, activities } = agendaState;
=======
    const { currentYear, currentMonth, selectedDay, activities } = appState.agenda;
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('monthYear');
    if (!calendarGrid || !monthYearDisplay) return;

<<<<<<< HEAD
    monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
=======
    monthYearDisplay.textContent = `${appState.agenda.months[currentMonth]} ${currentYear}`;
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
    calendarGrid.innerHTML = '';

    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(day => {
        calendarGrid.innerHTML += `<div class="calendar-weekday">${day}</div>`;
    });

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarGrid.innerHTML += `<div class="calendar-day other-month"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
<<<<<<< HEAD
        const numActivities = activities[day]?.length || 0;
        if (numActivities > 0) {
            dayEl.innerHTML = `<span class="day-number">${day}</span><div class="activity-count-badge">${numActivities}</div>`;
        } else {
            dayEl.innerHTML = `<span class="day-number">${day}</span>`;
        }

        if (day === selectedDay) {
=======
        const numActivities = activities[currentYear]?.[currentMonth]?.[day]?.length || 0;
        let activityBadge = '';
        if (numActivities > 0) {
            dayEl.classList.add('has-events');
            activityBadge = `<div class="activity-count-badge">${numActivities}</div>`;
        }

        dayEl.innerHTML = `<span class="day-number">${day}</span>${activityBadge}`;

        if (day === selectedDay && currentMonth === appState.agenda.currentMonth && currentYear === appState.agenda.currentYear) {
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
            dayEl.classList.add('selected');
        }

        dayEl.addEventListener('click', () => {
<<<<<<< HEAD
            agendaState.selectedDay = day;
            renderCalendar(); 
            renderTimeline();
=======
            appState.agenda.selectedDay = day;
            renderCalendar(); 
            renderTimeline(currentYear, currentMonth, day);
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
        });

        calendarGrid.appendChild(dayEl);
    }
}

export function renderAgendaView(viewElement) {
    viewElement.innerHTML = `
        <div class="agenda-container">
            <div class="calendar-wrapper">
                <div class="calendar-header">
                    <button class="month-nav-arrow" id="prevMonthBtn">‹</button>
                    <h2 class="month-year" id="monthYear"></h2>
                    <button class="month-nav-arrow" id="nextMonthBtn">›</button>
                </div>
                <div class="calendar-grid" id="calendarGrid"></div>
            </div>
            <div class="schedule-wrapper">
                <div class="schedule-header">
                    <h2 class="schedule-title" id="scheduleTitle"></h2>
                </div>
                <div class="timeline" id="timeline"></div>
            </div>
        </div>
    `;

    document.getElementById('prevMonthBtn').addEventListener('click', () => {
<<<<<<< HEAD
        agendaState.currentMonth--;
        if (agendaState.currentMonth < 0) {
            agendaState.currentMonth = 11;
            agendaState.currentYear--;
        }
        fetchActivitiesForMonth(agendaState.currentYear, agendaState.currentMonth);
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        agendaState.currentMonth++;
        if (agendaState.currentMonth > 11) {
            agendaState.currentMonth = 0;
            agendaState.currentYear++;
        }
        fetchActivitiesForMonth(agendaState.currentYear, agendaState.currentMonth);
    });

    // Busca as atividades do mês atual ao carregar a view
    fetchActivitiesForMonth(agendaState.currentYear, agendaState.currentMonth);
=======
        appState.agenda.currentMonth--;
        if (appState.agenda.currentMonth < 0) {
            appState.agenda.currentMonth = 11;
            appState.agenda.currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        appState.agenda.currentMonth++;
        if (appState.agenda.currentMonth > 11) {
            appState.agenda.currentMonth = 0;
            appState.agenda.currentYear++;
        }
        renderCalendar();
    });

    renderCalendar();
    renderTimeline(appState.agenda.currentYear, appState.agenda.currentMonth, appState.agenda.selectedDay);
>>>>>>> 1c8858d8c53d4cd014687aa8214353541ed10887
}