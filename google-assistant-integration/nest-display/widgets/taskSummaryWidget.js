/**
 * Task Summary Widget for Nest Hub Dashboard
 * Wyświetla podsumowanie zadań GTD
 */

class TaskSummaryWidget extends BaseWidget {
    constructor(config, dashboard) {
        super(config, dashboard);
        this.tasksData = null;
    }

    async refresh() {
        try {
            // Pobieranie danych o zadaniach z API
            const response = await this.dashboard.apiCall('/voice/tasks?source=NEST_HUB&limit=20');
            
            if (response.success && response.data) {
                this.tasksData = response.data;
                this.renderTaskSummary();
            } else {
                this.showError('Nie udało się pobrać zadań');
            }
            
        } catch (error) {
            console.error('Error refreshing task summary:', error);
            this.showError('Błąd połączenia');
        }
    }

    renderTaskSummary() {
        if (!this.tasksData || this.tasksData.length === 0) {
            this.updateContent(`
                <div class="task-summary">
                    <div class="task-count">0</div>
                    <div class="task-label">zadań</div>
                    <div class="empty-state">
                        <p>Brak zadań na dziś</p>
                        <p style="font-size: 12px; margin-top: 8px;">
                            Powiedz: "Hey Google, dodaj zadanie"
                        </p>
                    </div>
                </div>
            `);
            return;
        }

        // Analiza zadań
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasksData.filter(task => {
            return task.dueDate && task.dueDate.startsWith(today);
        });

        const priorityBreakdown = this.analyzeTasksByPriority(todayTasks);
        const contextBreakdown = this.analyzeTasksByContext(todayTasks);
        const statusBreakdown = this.analyzeTasksByStatus(todayTasks);

        this.updateContent(`
            <div class="task-summary">
                <div class="task-count">${todayTasks.length}</div>
                <div class="task-label">zadań na dziś</div>
                
                <div class="task-breakdown">
                    <div class="task-category">
                        <span class="category-count priority-high">${priorityBreakdown.HIGH || 0}</span>
                        <span class="category-label">Pilne</span>
                    </div>
                    <div class="task-category">
                        <span class="category-count priority-medium">${priorityBreakdown.MEDIUM || 0}</span>
                        <span class="category-label">Średnie</span>
                    </div>
                    <div class="task-category">
                        <span class="category-count priority-low">${priorityBreakdown.LOW || 0}</span>
                        <span class="category-label">Niskie</span>
                    </div>
                </div>

                <div class="task-contexts" style="margin-top: 16px;">
                    ${this.renderTopContexts(contextBreakdown)}
                </div>

                <div class="task-progress" style="margin-top: 16px;">
                    <div class="progress-label">Ukończone: ${statusBreakdown.COMPLETED || 0}/${todayTasks.length}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.calculateCompletionPercentage(statusBreakdown, todayTasks.length)}%"></div>
                    </div>
                </div>

                ${this.renderNextTasks(todayTasks)}
            </div>
        `);
    }

    analyzeTasksByPriority(tasks) {
        return tasks.reduce((acc, task) => {
            const priority = task.priority || 'MEDIUM';
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
        }, {});
    }

    analyzeTasksByContext(tasks) {
        return tasks.reduce((acc, task) => {
            const context = task.context || '@computer';
            acc[context] = (acc[context] || 0) + 1;
            return acc;
        }, {});
    }

    analyzeTasksByStatus(tasks) {
        return tasks.reduce((acc, task) => {
            const status = task.status || 'PENDING';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
    }

    renderTopContexts(contextBreakdown) {
        const contexts = Object.entries(contextBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (contexts.length === 0) {
            return '<div class="no-contexts">Brak kontekstów</div>';
        }

        return contexts.map(([context, count]) => {
            const contextName = this.getContextDisplayName(context);
            return `
                <div class="context-item" style="display: inline-flex; align-items: center; margin-right: 12px; font-size: 12px;">
                    <span class="context-icon">${this.getContextIcon(context)}</span>
                    <span class="context-name">${contextName}</span>
                    <span class="context-count">(${count})</span>
                </div>
            `;
        }).join('');
    }

    renderNextTasks(tasks) {
        const pendingTasks = tasks
            .filter(task => task.status !== 'COMPLETED')
            .slice(0, 3);

        if (pendingTasks.length === 0) {
            return `
                <div class="next-tasks" style="margin-top: 16px; text-align: center;">
                    <div style="color: var(--secondary-color); font-size: 14px;">
                        ✅ Wszystkie zadania ukończone!
                    </div>
                </div>
            `;
        }

        return `
            <div class="next-tasks" style="margin-top: 16px;">
                <div class="section-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                    Następne zadania:
                </div>
                ${pendingTasks.map(task => this.renderTaskItem(task)).join('')}
            </div>
        `;
    }

    renderTaskItem(task) {
        const priorityClass = `priority-${(task.priority || 'medium').toLowerCase()}`;
        const truncatedTitle = task.title.length > 25 ? 
            task.title.substring(0, 25) + '...' : task.title;

        return `
            <div class="task-item" style="display: flex; align-items: center; margin-bottom: 4px; font-size: 11px;">
                <div class="task-priority-dot ${priorityClass}" style="width: 6px; height: 6px; border-radius: 50%; margin-right: 8px;"></div>
                <div class="task-title" style="flex: 1;">${truncatedTitle}</div>
                <div class="task-context" style="color: var(--text-secondary);">${this.getContextIcon(task.context || '@computer')}</div>
            </div>
        `;
    }

    getContextDisplayName(context) {
        const contextNames = {
            '@computer': 'Komputer',
            '@calls': 'Telefony',
            '@office': 'Biuro',
            '@home': 'Dom',
            '@errands': 'Sprawy',
            '@online': 'Online',
            '@waiting': 'Oczekiwanie',
            '@reading': 'Czytanie'
        };
        return contextNames[context] || context;
    }

    getContextIcon(context) {
        const contextIcons = {
            '@computer': '💻',
            '@calls': '📞',
            '@office': '🏢',
            '@home': '🏠',
            '@errands': '🛒',
            '@online': '🌐',
            '@waiting': '⏳',
            '@reading': '📚'
        };
        return contextIcons[context] || '📋';
    }

    calculateCompletionPercentage(statusBreakdown, totalTasks) {
        if (totalTasks === 0) return 0;
        const completed = statusBreakdown.COMPLETED || 0;
        return Math.round((completed / totalTasks) * 100);
    }
}

// Export dla użycia w innych plikach
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskSummaryWidget;
}