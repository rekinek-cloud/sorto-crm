/**
 * Individual Widget Implementations for Google Nest Hub
 * Each widget handles its own data fetching, rendering, and interactions
 */

// Priorities Widget - Today's top tasks with progress
class PrioritiesWidget extends BaseWidget {
    constructor(apiClient, offlineManager) {
        super(apiClient, offlineManager, 'priorities');
        this.tasks = [];
    }

    async fetchData() {
        try {
            const data = await this.offlineManager.getDataWithFallback('priority-tasks');
            this.tasks = data.tasks || [];
            this.render();
            this.lastUpdateTime = Date.now();
        } catch (error) {
            console.error('Priorities widget fetch failed:', error);
            throw error;
        }
    }

    render() {
        if (!this.content) return;

        const tasksList = document.getElementById('priority-tasks');
        if (!tasksList) return;

        if (this.tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">check_circle</span>
                    <p>Wszystkie zadania ukończone!</p>
                </div>
            `;
            return;
        }

        const tasksHTML = this.tasks.slice(0, 5).map(task => {
            const progress = this.calculateTaskProgress(task);
            const priorityClass = (task.priority || 'MEDIUM').toLowerCase();
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const isOverdue = dueDate && dueDate < new Date();
            
            return `
                <div class="task-item ${task.status === 'COMPLETED' ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-checkbox ${task.status === 'COMPLETED' ? 'completed' : ''}"
                         onclick="dashboard.widgets.get('priorities').toggleTask('${task.id}')">
                        ${task.status === 'COMPLETED' ? '<span class="material-icons">check</span>' : ''}
                    </div>
                    <div class="task-content">
                        <div class="task-title">${this.escapeHtml(task.title || 'Bez tytułu')}</div>
                        <div class="task-meta">
                            <span class="priority-badge ${priorityClass}">${this.getPriorityLabel(task.priority)}</span>
                            ${task.contextName ? `<span class="context-badge">@${task.contextName}</span>` : ''}
                            ${dueDate ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">${this.formatDueDate(dueDate)}</span>` : ''}
                        </div>
                        ${progress > 0 ? `
                            <div class="task-progress">
                                <div class="task-progress-bar" style="width: ${progress}%"></div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn" onclick="dashboard.widgets.get('priorities').showTaskDetails('${task.id}')"
                                title="Szczegóły">
                            <span class="material-icons">info</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        tasksList.innerHTML = tasksHTML;
    }

    calculateTaskProgress(task) {
        // Simple progress calculation based on task properties
        if (task.status === 'COMPLETED') return 100;
        if (task.status === 'IN_PROGRESS') return task.progress || 50;
        return 0;
    }

    getPriorityLabel(priority) {
        const labels = {
            'HIGH': 'Wysoki',
            'URGENT': 'Pilny',
            'MEDIUM': 'Średni',
            'LOW': 'Niski'
        };
        return labels[priority] || 'Średni';
    }

    formatDueDate(date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const diffTime = taskDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Dziś';
        if (diffDays === 1) return 'Jutro';
        if (diffDays === -1) return 'Wczoraj';
        if (diffDays < 0) return `${Math.abs(diffDays)} dni temu`;
        if (diffDays <= 7) return `Za ${diffDays} dni`;
        
        return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    }

    async toggleTask(taskId) {
        try {
            await this.apiClient.completeTask(taskId);
            
            // Update local state
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = task.status === 'COMPLETED' ? 'NEW' : 'COMPLETED';
                this.render();
            }
            
            this.showToast('Zadanie zaktualizowane', 'success');
        } catch (error) {
            console.error('Toggle task failed:', error);
            
            // Add to sync queue for offline mode
            await this.offlineManager.addToSyncQueue('COMPLETE_TASK', { taskId });
            this.showToast('Zapisano do synchronizacji', 'info');
        }
    }

    showTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Create modal with task details
        const modal = this.createTaskModal(task);
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    createTaskModal(task) {
        const modal = document.createElement('div');
        modal.className = 'modal task-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${this.escapeHtml(task.title)}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="task-detail-grid">
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge ${(task.status || '').toLowerCase()}">${task.status || 'NEW'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Priorytet:</label>
                            <span class="priority-badge ${(task.priority || 'MEDIUM').toLowerCase()}">${this.getPriorityLabel(task.priority)}</span>
                        </div>
                        ${task.dueDate ? `
                            <div class="detail-item">
                                <label>Termin:</label>
                                <span>${new Date(task.dueDate).toLocaleString('pl-PL')}</span>
                            </div>
                        ` : ''}
                        ${task.contextName ? `
                            <div class="detail-item">
                                <label>Kontekst:</label>
                                <span>@${task.contextName}</span>
                            </div>
                        ` : ''}
                        ${task.projectName ? `
                            <div class="detail-item">
                                <label>Projekt:</label>
                                <span>${this.escapeHtml(task.projectName)}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${task.description ? `
                        <div class="task-description">
                            <label>Opis:</label>
                            <p>${this.escapeHtml(task.description)}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="dashboard.widgets.get('priorities').toggleTask('${task.id}'); this.closest('.modal').remove();">
                        ${task.status === 'COMPLETED' ? 'Oznacz jako nieukończone' : 'Ukończ zadanie'}
                    </button>
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Zamknij</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type) {
        // Use dashboard's toast method
        if (window.dashboard) {
            window.dashboard.showToast(message, type);
        }
    }
}

// CRM Widget - Sales metrics and pipeline
class CRMWidget extends BaseWidget {
    constructor(apiClient, offlineManager) {
        super(apiClient, offlineManager, 'crm');
        this.pipelineData = [];
        this.metrics = {};
        this.chart = null;
    }

    async fetchData() {
        try {
            const [pipeline, velocity, conversion] = await Promise.allSettled([
                this.apiClient.getPipelineStats(),
                this.apiClient.getPipelineVelocity(),
                this.apiClient.getConversionRates()
            ]);

            this.pipelineData = pipeline.status === 'fulfilled' ? pipeline.value : [];
            this.metrics = {
                velocity: velocity.status === 'fulfilled' ? velocity.value : {},
                conversion: conversion.status === 'fulfilled' ? conversion.value : {}
            };

            this.render();
            this.lastUpdateTime = Date.now();
        } catch (error) {
            console.error('CRM widget fetch failed:', error);
            throw error;
        }
    }

    render() {
        this.renderMetrics();
        this.renderChart();
    }

    renderMetrics() {
        const pipelineValue = this.pipelineData.reduce((sum, stage) => sum + (stage.value || 0), 0);
        const pipelineCount = this.pipelineData.reduce((sum, stage) => sum + (stage.count || 0), 0);
        
        document.getElementById('pipeline-value').textContent = 
            pipelineValue > 0 ? `${(pipelineValue / 1000).toFixed(0)}k PLN` : '--';
        
        document.getElementById('conversion-rate').textContent = 
            this.metrics.velocity?.winRate ? `${this.metrics.velocity.winRate}%` : '--';
        
        document.getElementById('velocity').textContent = 
            this.metrics.velocity?.averageCycleTime ? `${this.metrics.velocity.averageCycleTime}d` : '--';
    }

    renderChart() {
        const canvas = document.getElementById('pipelineCanvas');
        if (!canvas || this.pipelineData.length === 0) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Simple bar chart
        const padding = 20;
        const chartWidth = rect.width - padding * 2;
        const chartHeight = rect.height - padding * 2;
        const barWidth = chartWidth / this.pipelineData.length - 10;
        const maxValue = Math.max(...this.pipelineData.map(stage => stage.value || 0));

        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Draw bars
        this.pipelineData.forEach((stage, index) => {
            const barHeight = (stage.value || 0) / maxValue * chartHeight;
            const x = padding + index * (barWidth + 10);
            const y = rect.height - padding - barHeight;
            
            // Bar
            ctx.fillStyle = `hsl(${220 + index * 30}, 70%, 50%)`;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Label
            ctx.fillStyle = '#5f6368';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(
                stage.stage?.substring(0, 3) || '?', 
                x + barWidth / 2, 
                rect.height - 5
            );
            
            // Value
            if (stage.value > 0) {
                ctx.fillStyle = '#202124';
                ctx.font = 'bold 10px Inter';
                ctx.fillText(
                    `${(stage.value / 1000).toFixed(0)}k`, 
                    x + barWidth / 2, 
                    y - 5
                );
            }
        });
    }
}

// Calendar Widget - Today's meetings
class CalendarWidget extends BaseWidget {
    constructor(apiClient, offlineManager) {
        super(apiClient, offlineManager, 'calendar');
        this.meetings = [];
    }

    async fetchData() {
        try {
            const data = await this.offlineManager.getDataWithFallback('today-meetings');
            this.meetings = data.meetings || [];
            this.render();
            this.lastUpdateTime = Date.now();
        } catch (error) {
            console.error('Calendar widget fetch failed:', error);
            throw error;
        }
    }

    render() {
        const meetingsList = document.getElementById('today-meetings');
        if (!meetingsList) return;

        if (this.meetings.length === 0) {
            meetingsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">event_available</span>
                    <p>Brak spotkań dzisiaj</p>
                </div>
            `;
            return;
        }

        const meetingsHTML = this.meetings.map(meeting => {
            const startTime = new Date(meeting.startTime);
            const isUpcoming = startTime > new Date();
            const timeString = startTime.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="meeting-item ${isUpcoming ? 'upcoming' : 'past'}" data-meeting-id="${meeting.id}">
                    <div class="meeting-time">${timeString}</div>
                    <div class="meeting-content">
                        <div class="meeting-title">${this.escapeHtml(meeting.title || 'Spotkanie')}</div>
                        <div class="meeting-client">${this.escapeHtml(meeting.clientName || meeting.participantNames || '')}</div>
                    </div>
                    <div class="meeting-actions">
                        ${meeting.clientPhone ? `
                            <button class="meeting-action call" onclick="dashboard.widgets.get('calendar').callClient('${meeting.clientPhone}')"
                                    title="Zadzwoń">
                                <span class="material-icons">phone</span>
                            </button>
                        ` : ''}
                        <button class="meeting-action expand" onclick="dashboard.widgets.get('calendar').expandMeeting('${meeting.id}')"
                                title="Szczegóły">
                            <span class="material-icons">expand_more</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        meetingsList.innerHTML = meetingsHTML;
    }

    async callClient(phoneNumber) {
        try {
            await this.apiClient.callClient(phoneNumber);
            this.showToast(`Dzwonię na ${phoneNumber}`, 'info');
        } catch (error) {
            console.error('Call failed:', error);
            this.showToast('Błąd podczas dzwonienia', 'error');
        }
    }

    expandMeeting(meetingId) {
        const meeting = this.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        const modal = this.createMeetingModal(meeting);
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    createMeetingModal(meeting) {
        const modal = document.createElement('div');
        modal.className = 'modal meeting-modal';
        
        const startTime = new Date(meeting.startTime);
        const endTime = meeting.endTime ? new Date(meeting.endTime) : null;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${this.escapeHtml(meeting.title)}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="meeting-detail-grid">
                        <div class="detail-item">
                            <label>Czas:</label>
                            <span>${startTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                                  ${endTime ? `- ${endTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                        </div>
                        ${meeting.clientName ? `
                            <div class="detail-item">
                                <label>Klient:</label>
                                <span>${this.escapeHtml(meeting.clientName)}</span>
                            </div>
                        ` : ''}
                        ${meeting.location ? `
                            <div class="detail-item">
                                <label>Miejsce:</label>
                                <span>${this.escapeHtml(meeting.location)}</span>
                            </div>
                        ` : ''}
                        ${meeting.meetingType ? `
                            <div class="detail-item">
                                <label>Typ:</label>
                                <span>${this.escapeHtml(meeting.meetingType)}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${meeting.description ? `
                        <div class="meeting-description">
                            <label>Opis:</label>
                            <p>${this.escapeHtml(meeting.description)}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    ${meeting.clientPhone ? `
                        <button class="btn-primary" onclick="dashboard.widgets.get('calendar').callClient('${meeting.clientPhone}'); this.closest('.modal').remove();">
                            <span class="material-icons">phone</span> Zadzwoń
                        </button>
                    ` : ''}
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Zamknij</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type) {
        if (window.dashboard) {
            window.dashboard.showToast(message, type);
        }
    }
}

// Goals Widget - Project and area progress
class GoalsWidget extends BaseWidget {
    constructor(apiClient, offlineManager) {
        super(apiClient, offlineManager, 'goals');
        this.projects = [];
        this.areas = [];
    }

    async fetchData() {
        try {
            const [projects, areas] = await Promise.allSettled([
                this.apiClient.getProjects(),
                this.apiClient.getAreas()
            ]);

            this.projects = projects.status === 'fulfilled' ? (projects.value?.projects || []) : [];
            this.areas = areas.status === 'fulfilled' ? (areas.value?.areas || []) : [];
            
            this.render();
            this.lastUpdateTime = Date.now();
        } catch (error) {
            console.error('Goals widget fetch failed:', error);
            throw error;
        }
    }

    render() {
        const goalsList = document.getElementById('goal-progress');
        if (!goalsList) return;

        const goals = [...this.projects, ...this.areas].slice(0, 4);

        if (goals.length === 0) {
            goalsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">flag</span>
                    <p>Brak aktywnych celów</p>
                </div>
            `;
            return;
        }

        const goalsHTML = goals.map(goal => {
            const progress = this.calculateProgress(goal);
            const isProject = goal.hasOwnProperty('status');
            
            return `
                <div class="goal-item">
                    <div class="goal-header">
                        <div class="goal-title">${this.escapeHtml(goal.name || goal.title)}</div>
                        <div class="goal-percentage">${progress}%</div>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="goal-meta">
                        ${isProject ? `Projekt • ${goal.status}` : `Obszar • ${goal.reviewFrequency || 'Miesięczny'} przegląd`}
                    </div>
                </div>
            `;
        }).join('');

        goalsList.innerHTML = goalsHTML;
    }

    calculateProgress(goal) {
        if (goal.stats && goal.stats.progress !== undefined) {
            return Math.round(goal.stats.progress);
        }
        
        if (goal.stats && goal.stats.completedTasks && goal.stats.totalTasks) {
            return Math.round((goal.stats.completedTasks / goal.stats.totalTasks) * 100);
        }
        
        // Default progress based on status for projects
        if (goal.status) {
            const statusProgress = {
                'PLANNING': 10,
                'IN_PROGRESS': 50,
                'REVIEW': 80,
                'COMPLETED': 100,
                'ON_HOLD': 25
            };
            return statusProgress[goal.status] || 0;
        }
        
        return 0;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Activities Widget - Recent activity timeline
class ActivitiesWidget extends BaseWidget {
    constructor(apiClient, offlineManager) {
        super(apiClient, offlineManager, 'activities');
        this.activities = [];
    }

    async fetchData() {
        try {
            const data = await this.apiClient.getRecentActivities();
            this.activities = data.activities || [];
            this.render();
            this.lastUpdateTime = Date.now();
        } catch (error) {
            console.error('Activities widget fetch failed:', error);
            throw error;
        }
    }

    render() {
        const activitiesList = document.getElementById('recent-activities');
        if (!activitiesList) return;

        if (this.activities.length === 0) {
            activitiesList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">history</span>
                    <p>Brak ostatnich aktywności</p>
                </div>
            `;
            return;
        }

        const activitiesHTML = this.activities.slice(0, 6).map(activity => {
            const icon = this.getActivityIcon(activity.type);
            const timeAgo = this.getTimeAgo(activity.createdAt);
            
            return `
                <div class="activity-item" data-activity-id="${activity.id}">
                    <div class="activity-icon">
                        <span class="material-icons">${icon}</span>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${this.escapeHtml(activity.description || activity.title)}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

        activitiesList.innerHTML = activitiesHTML;
    }

    getActivityIcon(type) {
        const icons = {
            'TASK_COMPLETED': 'check_circle',
            'TASK_CREATED': 'add_task',
            'DEAL_STAGE_CHANGED': 'trending_up',
            'MEETING_COMPLETED': 'event_available',
            'CONTACT_CREATED': 'person_add',
            'EMAIL_SENT': 'email',
            'CALL_MADE': 'phone',
            'NOTE_ADDED': 'note_add'
        };
        return icons[type] || 'info';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Teraz';
        if (diffMins < 60) return `${diffMins} min temu`;
        if (diffHours < 24) return `${diffHours}h temu`;
        if (diffDays < 7) return `${diffDays} dni temu`;
        
        return time.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Notifications Widget - Alerts and reminders
class NotificationsWidget extends BaseWidget {
    constructor(apiClient, offlineManager) {
        super(apiClient, offlineManager, 'notifications');
        this.notifications = [];
    }

    async fetchData() {
        try {
            const data = await this.apiClient.getNotifications();
            this.notifications = data.notifications || [];
            this.render();
            this.updateBadge();
            this.lastUpdateTime = Date.now();
        } catch (error) {
            console.error('Notifications widget fetch failed:', error);
            throw error;
        }
    }

    render() {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) return;

        if (this.notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">notifications_off</span>
                    <p>Brak nowych powiadomień</p>
                </div>
            `;
            return;
        }

        const notificationsHTML = this.notifications.slice(0, 5).map(notification => {
            const icon = this.getNotificationIcon(notification.type);
            
            return `
                <div class="notification-item ${notification.unread ? 'unread' : ''}" 
                     data-notification-id="${notification.id}"
                     onclick="dashboard.widgets.get('notifications').markAsRead('${notification.id}')">
                    <div class="notification-icon">
                        <span class="material-icons">${icon}</span>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${this.escapeHtml(notification.title)}</div>
                        <div class="notification-time">${notification.time}</div>
                    </div>
                </div>
            `;
        }).join('');

        notificationsList.innerHTML = notificationsHTML;
    }

    updateBadge() {
        const badge = document.getElementById('notification-count');
        if (badge) {
            const unreadCount = this.notifications.filter(n => n.unread).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    getNotificationIcon(type) {
        const icons = {
            'inbox': 'inbox',
            'urgent': 'priority_high',
            'deadline': 'schedule',
            'meeting': 'event',
            'task': 'assignment',
            'email': 'email'
        };
        return icons[type] || 'notifications';
    }

    async markAsRead(notificationId) {
        try {
            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.unread = false;
                this.render();
                this.updateBadge();
            }

            // Sync with server
            await this.offlineManager.addToSyncQueue('MARK_NOTIFICATION_READ', { notificationId });
        } catch (error) {
            console.error('Mark notification read failed:', error);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export widgets for use in dashboard
window.PrioritiesWidget = PrioritiesWidget;
window.CRMWidget = CRMWidget;
window.CalendarWidget = CalendarWidget;
window.GoalsWidget = GoalsWidget;
window.ActivitiesWidget = ActivitiesWidget;
window.NotificationsWidget = NotificationsWidget;