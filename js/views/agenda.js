import { appState } from '../state.js';
import { showModal } from '../components/modal.js';
function renderTimeline(year, month, day) {
    const timelineContainer = document.getElementById('timeline');
    const scheduleTitle = document.getElementById('scheduleTitle');
    if (!timelineContainer || !scheduleTitle) return;

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
            <div class="timeline-content" data-title="${act.title}" data-description="${act.description}">
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

function renderCalendar() {
    const { currentYear, currentMonth, selectedDay, activities } = appState.agenda;
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('monthYear');
    if (!calendarGrid || !monthYearDisplay) return;

    monthYearDisplay.textContent = `${appState.agenda.months[currentMonth]} ${currentYear}`;
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
        let activityBadge = '';
        if (numActivities > 0) {
            dayEl.classList.add('has-events');
            activityBadge = `<div class="activity-count-badge">${numActivities}</div>`;
        }

        dayEl.innerHTML = `<span class="day-number">${day}</span>${activityBadge}`;

        if (day === selectedDay && currentMonth === appState.agenda.currentMonth && currentYear === appState.agenda.currentYear) {
            dayEl.classList.add('selected');
        }

        dayEl.addEventListener('click', () => {
            appState.agenda.selectedDay = day;
            renderCalendar(); 
            renderTimeline(currentYear, currentMonth, day);
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
}