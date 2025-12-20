/**
 * Calendar Widget for Nest Hub Dashboard
 * Wyświetla kalendarz z wydarzeniami i zadaniami
 */

class CalendarWidget extends BaseWidget {
    constructor(config, dashboard) {
        super(config, dashboard);
        this.calendarData = null;
        this.currentDate = new Date();
    }

    async refresh() {
        try {
            // Pobieranie danych kalendarza - zadania z datami + wydarzenia
            const tasksResponse = await this.dashboard.apiCall('/voice/tasks?source=NEST_HUB&date_range=month');
            const eventsResponse = await this.dashboard.apiCall('/calendar/events?source=NEST_HUB').catch(() => ({ success: false }));
            
            this.calendarData = {
                tasks: tasksResponse.success ? tasksResponse.data : [],
                events: eventsResponse.success ? eventsResponse.data : []
            };
            
            this.renderCalendar();
            
        } catch (error) {
            console.error('Error refreshing calendar:', error);
            this.showError('Błąd ładowania kalendarza');
        }
    }

    renderCalendar() {
        const today = new Date();
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        // Nagłówek z miesiącem i rokiem
        const monthName = this.currentDate.toLocaleDateString('pl-PL', { 
            month: 'long', 
            year: 'numeric' 
        });

        // Pierwsze dni miesiąca i ostatnie
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Dodatkowe dni z poprzedniego miesiąca
        const daysFromPrevMonth = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

        this.updateContent(`
            <div class="calendar-widget">
                <div class="calendar-header">
                    <button class="month-nav" onclick="this.changeMonth(-1)">‹</button>
                    <h4 class="month-title">${monthName}</h4>
                    <button class="month-nav" onclick="this.changeMonth(1)">›</button>
                </div>
                
                <div class="weekdays">
                    <div class="weekday">Pn</div>
                    <div class="weekday">Wt</div>
                    <div class="weekday">Śr</div>
                    <div class="weekday">Cz</div>
                    <div class="weekday">Pt</div>
                    <div class="weekday">So</div>
                    <div class="weekday">Nd</div>
                </div>

                <div class="calendar-grid">
                    ${this.renderCalendarDays(currentYear, currentMonth, daysFromPrevMonth, daysInMonth, today)}
                </div>

                <div class="today-summary">
                    ${this.renderTodaySummary(today)}
                </div>
            </div>
        `);
    }

    renderCalendarDays(year, month, daysFromPrevMonth, daysInMonth, today) {
        let daysHTML = '';
        
        // Dni z poprzedniego miesiąca (wyszarzone)
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevMonthYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
        
        for (let i = daysFromPrevMonth; i > 0; i--) {
            const day = daysInPrevMonth - i + 1;
            daysHTML += `<div class="calendar-day prev-month">${day}</div>`;
        }

        // Dni aktualnego miesiąca
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const isToday = this.isSameDate(date, today);
            const dayEvents = this.getEventsForDate(dateString);
            
            let dayClasses = 'calendar-day';
            if (isToday) dayClasses += ' today';
            if (dayEvents.length > 0) dayClasses += ' has-events';
            
            const eventIndicators = this.renderEventIndicators(dayEvents);
            
            daysHTML += `
                <div class="${dayClasses}" data-date="${dateString}">
                    <span class="day-number">${day}</span>
                    ${eventIndicators}
                </div>
            `;
        }

        // Dopełnienie ostatniego tygodnia dniami z następnego miesiąca
        const totalCells = Math.ceil((daysFromPrevMonth + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (daysFromPrevMonth + daysInMonth);
        
        for (let day = 1; day <= remainingCells; day++) {
            daysHTML += `<div class="calendar-day next-month">${day}</div>`;
        }

        return daysHTML;
    }

    renderEventIndicators(events) {
        if (events.length === 0) return '';
        
        const maxIndicators = 3;
        const visibleEvents = events.slice(0, maxIndicators);
        const hasMore = events.length > maxIndicators;
        
        let indicators = visibleEvents.map(event => {
            const type = event.type || 'task';
            const color = this.getEventColor(type, event.priority);
            return `<div class="event-indicator" style="background-color: ${color}"></div>`;
        }).join('');
        
        if (hasMore) {
            indicators += `<div class="more-indicator">+${events.length - maxIndicators}</div>`;
        }
        
        return `<div class="event-indicators">${indicators}</div>`;
    }

    renderTodaySummary(today) {
        const todayString = today.toISOString().split('T')[0];
        const todayEvents = this.getEventsForDate(todayString);
        
        if (todayEvents.length === 0) {
            return `
                <div class="today-empty">
                    <p>Brak wydarzeń na dziś</p>
                    <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                        Powiedz: "Hey Google, dodaj zadanie"
                    </p>
                </div>
            `;
        }

        const tasks = todayEvents.filter(event => event.type === 'task').slice(0, 3);
        const meetings = todayEvents.filter(event => event.type === 'event').slice(0, 2);

        return `
            <div class="today-events">
                <div class="today-label">Dziś:</div>
                
                ${tasks.length > 0 ? `
                    <div class="today-section">
                        <div class="section-title">Zadania (${tasks.length})</div>
                        ${tasks.map(task => this.renderTodayItem(task)).join('')}
                    </div>
                ` : ''}
                
                ${meetings.length > 0 ? `
                    <div class="today-section">
                        <div class="section-title">Spotkania (${meetings.length})</div>
                        ${meetings.map(meeting => this.renderTodayItem(meeting)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderTodayItem(item) {
        const time = item.time || '';
        const title = item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title;
        const icon = item.type === 'task' ? '✓' : '📅';
        
        return `
            <div class="today-item">
                <span class="item-icon">${icon}</span>
                <span class="item-time">${time}</span>
                <span class="item-title">${title}</span>
            </div>
        `;
    }

    getEventsForDate(dateString) {
        const events = [];
        
        // Dodaj zadania z określoną datą
        if (this.calendarData.tasks) {
            const tasksForDate = this.calendarData.tasks.filter(task => {
                return task.dueDate && task.dueDate.startsWith(dateString);
            });
            
            events.push(...tasksForDate.map(task => ({
                ...task,
                type: 'task',
                time: this.extractTimeFromDate(task.dueDate)
            })));
        }
        
        // Dodaj wydarzenia kalendarza
        if (this.calendarData.events) {
            const eventsForDate = this.calendarData.events.filter(event => {
                return event.date && event.date.startsWith(dateString);
            });
            
            events.push(...eventsForDate.map(event => ({
                ...event,
                type: 'event',
                time: this.extractTimeFromDate(event.date)
            })));
        }
        
        // Sortuj według czasu
        return events.sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeA.localeCompare(timeB);
        });
    }

    getEventColor(type, priority) {
        if (type === 'task') {
            switch (priority) {
                case 'HIGH': return '#ea4335';
                case 'MEDIUM': return '#fbbc04';
                case 'LOW': return '#34a853';
                default: return '#4285f4';
            }
        } else {
            return '#9aa0a6'; // Kolor dla wydarzeń kalendarza
        }
    }

    extractTimeFromDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    // Obsługa kliknięć w dni kalendarza
    createElement() {
        super.createElement();
        
        // Dodaj obsługę kliknięć w dni
        this.element.addEventListener('click', (e) => {
            const dayElement = e.target.closest('.calendar-day');
            if (dayElement && dayElement.dataset.date) {
                this.showDayDetails(dayElement.dataset.date);
            }
        });
    }

    showDayDetails(date) {
        const events = this.getEventsForDate(date);
        
        if (events.length === 0) {
            return;
        }

        // Podświetl wybrany dzień
        this.element.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        const selectedDay = this.element.querySelector(`[data-date="${date}"]`);
        if (selectedDay) {
            selectedDay.classList.add('selected');
        }

        // Aktualizuj podsumowanie dnia
        const todaySummary = this.element.querySelector('.today-summary');
        if (todaySummary) {
            const formattedDate = new Date(date).toLocaleDateString('pl-PL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
            
            todaySummary.innerHTML = `
                <div class="selected-day-events">
                    <div class="selected-day-label">${formattedDate}:</div>
                    ${events.map(event => this.renderTodayItem(event)).join('')}
                </div>
            `;
        }
    }
}

// Export dla użycia w innych plikach
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarWidget;
}