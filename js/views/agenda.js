import { showModal } from '../../components/modal.js';

/**
 * Atualiza a lista de atividades (timeline) para um dia específico.
 */
function renderTimeline(year, month, day, appState) {
    const timelineContainer = document.getElementById('timeline');
    const scheduleTitle = document.getElementById('scheduleTitle');
    if (!timelineContainer || !scheduleTitle) return;

    if (!appState?.agenda?.dayNames) {
        timelineContainer.innerHTML = "<p>Carregando dados da agenda...</p>";
        return;
    }

    const { dayNames, months, activities } = appState.agenda;
    const date = new Date(year, month, day);
    
    scheduleTitle.textContent = `${dayNames[date.getDay()]}, ${day} de ${months[month]}`;

    const dayActivities = activities[year]?.[month]?.[day] || [];
    
    if (dayActivities.length === 0) {
        timelineContainer.innerHTML = `<p>Nenhuma atividade programada para este dia.</p>`;
        return;
    }

    timelineContainer.innerHTML = dayActivities.map(act => `
        <div class="timeline-item">
            <div class="timeline-time">${act.time}</div>
            <div class="timeline-content" data-title="${act.title}" data-description="${act.description || ''}">
                <div class="timeline-title">${act.title}</div>
            </div>
        </div>
    `).join('');
    
    timelineContainer.querySelectorAll('.timeline-content').forEach(item => {
        item.addEventListener('click', () => {
            const title = item.dataset.title;
            const description = item.dataset.description;
            showModal(title, description);
        });
    });
}

/**
 * Desenha o calendário (a grade de dias) para o mês e ano atuais.
 */
function renderCalendar(appState, onDateUpdate) {
    if (!appState?.agenda?.months) {
        console.error("renderCalendar: Dados da agenda ausentes ou incompletos.", appState);
        return;
    }

    const { currentYear, currentMonth, selectedDay, activities, months } = appState.agenda;
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('monthYear');
    if (!calendarGrid || !monthYearDisplay) return;

    monthYearDisplay.textContent = `${months[currentMonth]} ${currentYear}`;
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
        
        const numActivities = activities[currentYear]?.[currentMonth]?.[day]?.length || 0;
        if (numActivities > 0) {
            dayEl.classList.add('has-events');
            dayEl.innerHTML = `<span class="day-number">${day}</span><div class="activity-count-badge">${numActivities}</div>`;
        } else {
            dayEl.innerHTML = `<span class="day-number">${day}</span>`;
        }

        if (day === selectedDay) {
            dayEl.classList.add('selected');
        }

        dayEl.addEventListener('click', () => {
            appState.agenda.selectedDay = day;
            onDateUpdate();
        });

        calendarGrid.appendChild(dayEl);
    }
}

/**
 * Função principal que renderiza toda a view da agenda.
 */
export function renderAgendaView(viewElement, data, appState) {
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

    // --- CORREÇÃO FINAL APLICADA AQUI ---
    const updateAgendaUI = () => {
        // Verifica se a propriedade 'agenda' existe no estado antes de tentar usá-la.
        if (appState && appState.agenda) {
            renderCalendar(appState, updateAgendaUI);
            renderTimeline(appState.agenda.currentYear, appState.agenda.currentMonth, appState.agenda.selectedDay, appState);
        } else {
            // Se não existir, exibe a mensagem de erro que vimos no console.
            console.error("Tentativa de renderizar a agenda, mas appState.agenda não está definido.", appState);
            viewElement.innerHTML = "<p>Ocorreu um erro ao carregar os dados da agenda.</p>";
        }
    };
    
    if (!appState.agenda) {
        viewElement.innerHTML = "<p>Não foi possível carregar os dados da agenda.</p>";
        return;
    }

    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        appState.agenda.currentMonth--;
        if (appState.agenda.currentMonth < 0) {
            appState.agenda.currentMonth = 11;
            appState.agenda.currentYear--;
        }
        updateAgendaUI();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        appState.agenda.currentMonth++;
        if (appState.agenda.currentMonth > 11) {
            appState.agenda.currentMonth = 0;
            appState.agenda.currentYear++;
        }
        updateAgendaUI();
    });

    // Renderização inicial
    updateAgendaUI();
}