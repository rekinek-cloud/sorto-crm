/**
 * CRM-GTD Smart - Nest Hub Dashboard
 * Główny plik JavaScript zarządzający dashboard
 */

class NestDashboard {
    constructor() {
        this.widgets = new Map();
        this.config = {
            apiBaseUrl: 'https://crm.dev.sorto.ai/crm/api/v1',
            refreshInterval: 30000, // 30 sekund
            maxRetries: 3
        };
        this.retryCount = 0;
        this.isOnline = true;
        
        this.init();
    }

    async init() {
        try {
            // Inicjalizacja komponentów
            this.initDateTime();
            this.initConnectionMonitoring();
            this.initVoiceCommands();
            
            // Ładowanie konfiguracji widgetów
            await this.loadWidgetConfiguration();
            
            // Inicjalizacja widgetów
            await this.initializeWidgets();
            
            // Uruchomienie automatycznego odświeżania
            this.startAutoRefresh();
            
            console.log('Nest Hub Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showErrorState('Błąd inicjalizacji dashboard');
        }
    }

    /**
     * Inicjalizacja wyświetlania daty i czasu
     */
    initDateTime() {
        const updateDateTime = () => {
            const now = new Date();
            
            // Aktualizacja czasu
            const timeElement = document.getElementById('current-time');
            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            // Aktualizacja daty
            const dateElement = document.getElementById('current-date');
            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('pl-PL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                });
            }
        };

        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    /**
     * Monitoring połączenia internetowego
     */
    initConnectionMonitoring() {
        const connectionStatus = document.getElementById('connection-status');
        
        const updateConnectionStatus = () => {
            if (navigator.onLine && this.isOnline) {
                connectionStatus.classList.add('connected');
                connectionStatus.classList.remove('error');
            } else {
                connectionStatus.classList.remove('connected');
                connectionStatus.classList.add('error');
            }
        };

        window.addEventListener('online', () => {
            this.isOnline = true;
            updateConnectionStatus();
            this.retryFailedRequests();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            updateConnectionStatus();
        });

        updateConnectionStatus();
    }

    /**
     * Inicjalizacja komend głosowych
     */
    initVoiceCommands() {
        // Nasłuchiwanie na zdarzenia Google Assistant
        if ('speechSynthesis' in window) {
            // Obsługa poleceń głosowych przekazanych przez URL params
            const urlParams = new URLSearchParams(window.location.search);
            const voiceCommand = urlParams.get('voice_command');
            
            if (voiceCommand) {
                this.processVoiceCommand(voiceCommand);
            }
        }
    }

    /**
     * Ładowanie konfiguracji widgetów z API
     */
    async loadWidgetConfiguration() {
        try {
            const response = await this.apiCall('/nest-display/widgets');
            
            if (response.success && response.data) {
                this.widgetConfig = response.data;
            } else {
                // Domyślna konfiguracja jeśli API nie odpowiada
                this.widgetConfig = this.getDefaultWidgetConfig();
            }
            
        } catch (error) {
            console.warn('Using default widget configuration:', error);
            this.widgetConfig = this.getDefaultWidgetConfig();
        }
    }

    /**
     * Domyślna konfiguracja widgetów
     */
    getDefaultWidgetConfig() {
        return [
            {
                id: 'tasks-summary',
                type: 'TASK_SUMMARY',
                title: 'Dzisiejsze zadania',
                position: { x: 0, y: 0, width: 1, height: 1 },
                refreshInterval: 300
            },
            {
                id: 'calendar',
                type: 'CALENDAR',
                title: 'Kalendarz',
                position: { x: 1, y: 0, width: 2, height: 1 },
                refreshInterval: 600
            },
            {
                id: 'projects',
                type: 'PROJECTS',
                title: 'Aktywne projekty',
                position: { x: 0, y: 1, width: 2, height: 1 },
                refreshInterval: 300
            },
            {
                id: 'contacts',
                type: 'CONTACTS',
                title: 'Ostatnie kontakty',
                position: { x: 2, y: 1, width: 1, height: 1 },
                refreshInterval: 600
            },
            {
                id: 'weather',
                type: 'WEATHER',
                title: 'Pogoda',
                position: { x: 3, y: 0, width: 1, height: 1 },
                refreshInterval: 1800
            },
            {
                id: 'news',
                type: 'NEWS',
                title: 'Aktualności',
                position: { x: 3, y: 1, width: 1, height: 2 },
                refreshInterval: 900
            }
        ];
    }

    /**
     * Inicjalizacja wszystkich widgetów
     */
    async initializeWidgets() {
        const container = document.getElementById('widgets-container');
        
        for (const config of this.widgetConfig) {
            try {
                const widget = await this.createWidget(config);
                if (widget) {
                    container.appendChild(widget.element);
                    this.widgets.set(config.id, widget);
                }
            } catch (error) {
                console.error(`Error creating widget ${config.id}:`, error);
            }
        }
    }

    /**
     * Tworzenie widgetu na podstawie konfiguracji
     */
    async createWidget(config) {
        const widgetFactory = {
            'TASK_SUMMARY': () => new TaskSummaryWidget(config, this),
            'CALENDAR': () => new CalendarWidget(config, this),
            'CONTACTS': () => new ContactsWidget(config, this),
            'PROJECTS': () => new ProjectsWidget(config, this),
            'WEATHER': () => new WeatherWidget(config, this),
            'NEWS': () => new NewsWidget(config, this)
        };

        const createWidgetFn = widgetFactory[config.type];
        if (!createWidgetFn) {
            console.warn(`Unknown widget type: ${config.type}`);
            return null;
        }

        const widget = createWidgetFn();
        await widget.init();
        return widget;
    }

    /**
     * Uruchomienie automatycznego odświeżania
     */
    startAutoRefresh() {
        setInterval(() => {
            this.refreshAllWidgets();
        }, this.config.refreshInterval);
    }

    /**
     * Odświeżenie wszystkich widgetów
     */
    async refreshAllWidgets() {
        const syncStatus = document.getElementById('sync-status');
        syncStatus.classList.add('syncing');

        const refreshPromises = Array.from(this.widgets.values()).map(widget => {
            return widget.refresh().catch(error => {
                console.error(`Error refreshing widget ${widget.config.id}:`, error);
            });
        });

        try {
            await Promise.all(refreshPromises);
            this.retryCount = 0;
        } catch (error) {
            console.error('Error refreshing widgets:', error);
            this.handleRefreshError();
        } finally {
            syncStatus.classList.remove('syncing');
        }
    }

    /**
     * Obsługa błędów odświeżania
     */
    handleRefreshError() {
        this.retryCount++;
        
        if (this.retryCount >= this.config.maxRetries) {
            this.isOnline = false;
            const connectionStatus = document.getElementById('connection-status');
            connectionStatus.classList.add('error');
        }
    }

    /**
     * Ponowienie nieudanych żądań
     */
    async retryFailedRequests() {
        if (this.isOnline) {
            this.retryCount = 0;
            await this.refreshAllWidgets();
        }
    }

    /**
     * Przetwarzanie poleceń głosowych
     */
    async processVoiceCommand(command) {
        console.log('Processing voice command:', command);
        
        try {
            // Podświetlenie odpowiedniego widgetu na podstawie polecenia
            if (command.includes('zadania') || command.includes('task')) {
                this.highlightWidget('tasks-summary');
            } else if (command.includes('kalendarz') || command.includes('calendar')) {
                this.highlightWidget('calendar');
            } else if (command.includes('projekt') || command.includes('project')) {
                this.highlightWidget('projects');
            } else if (command.includes('kontakt') || command.includes('contact')) {
                this.highlightWidget('contacts');
            }
            
            // Można dodać więcej logiki przetwarzania poleceń
            
        } catch (error) {
            console.error('Error processing voice command:', error);
        }
    }

    /**
     * Podświetlenie widgetu
     */
    highlightWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (widget && widget.element) {
            widget.element.style.boxShadow = '0 0 20px rgba(66, 133, 244, 0.8)';
            widget.element.style.transform = 'scale(1.02)';
            
            setTimeout(() => {
                widget.element.style.boxShadow = '';
                widget.element.style.transform = '';
            }, 3000);
        }
    }

    /**
     * Wywołanie API
     */
    async apiCall(endpoint, options = {}) {
        const url = `${this.config.apiBaseUrl}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Source': 'NEST_HUB'
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
            
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            this.isOnline = false;
            throw error;
        }
    }

    /**
     * Wyświetlenie stanu błędu
     */
    showErrorState(message) {
        const container = document.getElementById('widgets-container');
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="material-icons">error_outline</i>
                </div>
                <div class="error-message">${message}</div>
                <button onclick="location.reload()" class="retry-button">
                    Spróbuj ponownie
                </button>
            </div>
        `;
    }

    /**
     * Zapisanie konfiguracji widgetów
     */
    async saveWidgetConfiguration() {
        try {
            const config = Array.from(this.widgets.values()).map(widget => ({
                id: widget.config.id,
                type: widget.config.type,
                title: widget.config.title,
                position: widget.config.position,
                refreshInterval: widget.config.refreshInterval,
                configuration: widget.config.configuration || {}
            }));

            await this.apiCall('/nest-display/widgets', {
                method: 'POST',
                body: JSON.stringify({ widgets: config })
            });

        } catch (error) {
            console.error('Error saving widget configuration:', error);
        }
    }
}

// Klasa bazowa dla widgetów
class BaseWidget {
    constructor(config, dashboard) {
        this.config = config;
        this.dashboard = dashboard;
        this.element = null;
        this.refreshTimer = null;
    }

    async init() {
        this.createElement();
        this.setupRefreshTimer();
        await this.refresh();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = `widget ${this.getWidgetSize()}`;
        this.element.style.gridColumn = `${this.config.position.x + 1} / span ${this.config.position.width}`;
        this.element.style.gridRow = `${this.config.position.y + 1} / span ${this.config.position.height}`;
        
        this.element.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${this.config.title}</h3>
                <div class="widget-actions">
                    <button class="widget-action" onclick="this.refresh()">
                        <i class="material-icons">refresh</i>
                    </button>
                </div>
            </div>
            <div class="widget-content" id="content-${this.config.id}">
                <div class="loading">Ładowanie...</div>
            </div>
        `;
    }

    getWidgetSize() {
        const width = this.config.position.width;
        const height = this.config.position.height;
        
        if (width === 1 && height === 1) return 'small';
        if (width === 2 && height === 1) return 'medium';
        if (width === 2 && height === 2) return 'large';
        if (width === 4) return 'full-width';
        
        return 'small';
    }

    setupRefreshTimer() {
        if (this.config.refreshInterval > 0) {
            this.refreshTimer = setInterval(() => {
                this.refresh();
            }, this.config.refreshInterval * 1000);
        }
    }

    async refresh() {
        // Implementowane w klasach pochodnych
        throw new Error('refresh() method must be implemented');
    }

    updateContent(html) {
        const contentElement = document.getElementById(`content-${this.config.id}`);
        if (contentElement) {
            contentElement.innerHTML = html;
        }
    }

    showError(message) {
        this.updateContent(`
            <div class="widget-error">
                <i class="material-icons">error_outline</i>
                <span>${message}</span>
            </div>
        `);
    }

    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Inicjalizacja dashboard po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    window.nestDashboard = new NestDashboard();
});

// Obsługa modalnego okna konfiguracji
function openConfigModal() {
    const modal = document.getElementById('widget-config-modal');
    modal.classList.remove('hidden');
}

function closeConfigModal() {
    const modal = document.getElementById('widget-config-modal');
    modal.classList.add('hidden');
}

// Export dla innych modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NestDashboard, BaseWidget };
}