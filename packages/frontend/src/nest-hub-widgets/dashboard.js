/**
 * Main Dashboard Controller for Google Nest Hub
 * Orchestrates all widgets, data updates, and user interactions
 */

class NestHubDashboard {
    constructor() {
        this.apiClient = new ApiClient();
        this.offlineManager = new OfflineManager(this.apiClient);
        this.voiceCommands = new VoiceCommands(this.apiClient, this);
        
        this.widgets = new Map();
        this.refreshInterval = 5 * 60 * 1000; // 5 minutes
        this.refreshTimer = null;
        this.isInitialized = false;
        
        this.initializeDashboard();
    }

    async initializeDashboard() {
        try {
            console.log('Initializing Nest Hub Dashboard...');
            
            // Initialize time display
            this.initializeTimeDisplay();
            
            // Initialize widgets
            await this.initializeWidgets();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup auto-refresh
            this.setupAutoRefresh();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup touch interactions
            this.setupTouchInteractions();
            
            this.isInitialized = true;
            console.log('Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Błąd inicjalizacji dashboard');
        }
    }

    initializeTimeDisplay() {
        const updateTime = () => {
            const now = new Date();
            const timeElement = document.getElementById('current-time');
            const dateElement = document.getElementById('current-date');
            
            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('pl-PL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                });
            }
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }

    async initializeWidgets() {
        // Priorities Widget
        this.widgets.set('priorities', new PrioritiesWidget(this.apiClient, this.offlineManager));
        
        // CRM Widget
        this.widgets.set('crm', new CRMWidget(this.apiClient, this.offlineManager));
        
        // Calendar Widget
        this.widgets.set('calendar', new CalendarWidget(this.apiClient, this.offlineManager));
        
        // Goals Widget
        this.widgets.set('goals', new GoalsWidget(this.apiClient, this.offlineManager));
        
        // Activities Widget
        this.widgets.set('activities', new ActivitiesWidget(this.apiClient, this.offlineManager));
        
        // Notifications Widget
        this.widgets.set('notifications', new NotificationsWidget(this.apiClient, this.offlineManager));
        
        console.log('Widgets initialized:', Array.from(this.widgets.keys()));
    }

    async loadInitialData() {
        console.log('Loading initial data...');
        
        const loadPromises = Array.from(this.widgets.values()).map(widget => 
            widget.loadData().catch(error => {
                console.warn(`Widget ${widget.constructor.name} failed to load:`, error);
                return null;
            })
        );
        
        await Promise.allSettled(loadPromises);
        console.log('Initial data loaded');
    }

    setupAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            if (navigator.onLine) {
                this.refreshAllData();
            }
        }, this.refreshInterval);
    }

    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // Window focus/blur for performance
        window.addEventListener('focus', () => {
            this.onWindowFocus();
        });
        
        window.addEventListener('blur', () => {
            this.onWindowBlur();
        });
        
        // Refresh button
        const refreshIndicator = document.getElementById('refresh-indicator');
        if (refreshIndicator) {
            refreshIndicator.addEventListener('click', () => {
                this.refreshAllData();
            });
        }
    }

    setupTouchInteractions() {
        // Enable touch scrolling for widget content
        document.querySelectorAll('.widget-content').forEach(content => {
            content.style.overflowY = 'auto';
            content.style.webkitOverflowScrolling = 'touch';
        });
        
        // Add touch feedback
        document.querySelectorAll('.task-item, .meeting-item, .activity-item, .notification-item').forEach(item => {
            item.addEventListener('touchstart', () => {
                item.style.transform = 'scale(0.98)';
            });
            
            item.addEventListener('touchend', () => {
                item.style.transform = '';
            });
        });
    }

    handleKeyboard(e) {
        // Global shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'r':
                    e.preventDefault();
                    this.refreshAllData();
                    break;
                case '1':
                    e.preventDefault();
                    this.focusWidget('priorities');
                    break;
                case '2':
                    e.preventDefault();
                    this.focusWidget('crm');
                    break;
                case '3':
                    e.preventDefault();
                    this.focusWidget('calendar');
                    break;
            }
        }
        
        // ESC to close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    onWindowFocus() {
        // Resume auto-refresh
        if (!this.refreshTimer) {
            this.setupAutoRefresh();
        }
        
        // Refresh data if it's been a while
        const timeSinceLastRefresh = Date.now() - (this.lastRefreshTime || 0);
        if (timeSinceLastRefresh > this.refreshInterval) {
            this.refreshAllData();
        }
    }

    onWindowBlur() {
        // Pause auto-refresh to save resources
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // Widget management methods
    focusWidget(widgetName) {
        const widget = this.widgets.get(widgetName);
        if (widget) {
            widget.focus();
            this.scrollToWidget(widgetName);
        }
    }

    scrollToWidget(widgetName) {
        const element = document.getElementById(`${widgetName}-widget`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight');
            setTimeout(() => {
                element.classList.remove('highlight');
            }, 2000);
        }
    }

    async refreshWidget(widgetName) {
        const widget = this.widgets.get(widgetName);
        if (widget) {
            try {
                await widget.refresh();
            } catch (error) {
                console.error(`Failed to refresh widget ${widgetName}:`, error);
            }
        }
    }

    async refreshAllData() {
        console.log('Refreshing all data...');
        this.lastRefreshTime = Date.now();
        
        // Show refresh indicator
        const refreshIndicator = document.getElementById('refresh-indicator');
        refreshIndicator?.classList.add('spinning');
        
        try {
            // Refresh all widgets in parallel
            const refreshPromises = Array.from(this.widgets.values()).map(widget => 
                widget.refresh().catch(error => {
                    console.warn(`Widget ${widget.constructor.name} refresh failed:`, error);
                    return null;
                })
            );
            
            await Promise.allSettled(refreshPromises);
            
            this.showToast('Dane odświeżone', 'success', 2000);
            
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showToast('Błąd odświeżania danych', 'error');
        } finally {
            refreshIndicator?.classList.remove('spinning');
        }
    }

    // Network status handling
    onNetworkStatusChange(status) {
        console.log('Network status changed:', status);
        
        if (status === 'online') {
            // Refresh data when coming back online
            setTimeout(() => {
                this.refreshAllData();
            }, 1000);
        }
        
        // Update all widgets
        this.widgets.forEach(widget => {
            if (widget.onNetworkStatusChange) {
                widget.onNetworkStatusChange(status);
            }
        });
    }

    // Modal management
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Utility methods
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            background: type === 'error' ? '#ea4335' : type === 'success' ? '#34a853' : '#4285f4',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: '9999',
            fontSize: '14px',
            fontWeight: '500',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-out'
        });
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    showError(message) {
        this.showToast(message, 'error', 5000);
    }

    // Dashboard overview method for voice commands
    showOverview() {
        // Reset all widgets to default view
        this.widgets.forEach(widget => {
            if (widget.showOverview) {
                widget.showOverview();
            }
        });
        
        // Scroll to top
        document.getElementById('dashboard-grid').scrollTop = 0;
    }

    // Status and debugging
    getStatus() {
        return {
            initialized: this.isInitialized,
            widgets: Array.from(this.widgets.keys()),
            lastRefreshTime: this.lastRefreshTime,
            isOnline: navigator.onLine,
            offlineManager: this.offlineManager.getStatus()
        };
    }

    async exportDebugInfo() {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            status: this.getStatus(),
            widgets: {},
            apiCache: this.apiClient.getCacheStatus(),
            localStorage: { ...localStorage },
            userAgent: navigator.userAgent,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height,
                devicePixelRatio: window.devicePixelRatio
            }
        };
        
        // Get widget debug info
        for (const [name, widget] of this.widgets) {
            if (widget.getDebugInfo) {
                debugInfo.widgets[name] = widget.getDebugInfo();
            }
        }
        
        return debugInfo;
    }
}

// Widget Base Class
class BaseWidget {
    constructor(apiClient, offlineManager, widgetId) {
        this.apiClient = apiClient;
        this.offlineManager = offlineManager;
        this.widgetId = widgetId;
        this.container = document.getElementById(`${widgetId}-widget`);
        this.content = this.container?.querySelector('.widget-content');
        this.isLoading = false;
        this.lastUpdateTime = 0;
    }

    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            await this.fetchData();
        } catch (error) {
            console.error(`${this.constructor.name} load failed:`, error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async refresh() {
        await this.loadData();
    }

    async fetchData() {
        // Override in subclasses
    }

    showLoading() {
        if (this.content) {
            this.content.innerHTML = '<div class="loading-skeleton"><div class="skeleton-item"></div><div class="skeleton-item"></div></div>';
        }
    }

    hideLoading() {
        // Loading is hidden when content is updated
    }

    showError(message) {
        if (this.content) {
            this.content.innerHTML = `<div class="error-state"><span class="material-icons">error</span><p>${message}</p></div>`;
        }
    }

    focus() {
        this.container?.classList.add('focused');
        setTimeout(() => {
            this.container?.classList.remove('focused');
        }, 2000);
    }

    onNetworkStatusChange(status) {
        // Override in subclasses if needed
    }

    getDebugInfo() {
        return {
            isLoading: this.isLoading,
            lastUpdateTime: this.lastUpdateTime,
            hasContainer: !!this.container,
            hasContent: !!this.content
        };
    }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboard = new NestHubDashboard();
    });
} else {
    window.dashboard = new NestHubDashboard();
}

// Add CSS for highlights and loading states
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .widget.highlight {
        box-shadow: 0 0 0 3px #4285f4, 0 4px 16px rgba(0,0,0,0.2);
        transform: scale(1.02);
    }
    
    .widget.focused {
        border-color: #4285f4;
        box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2), 0 4px 16px rgba(0,0,0,0.2);
    }
    
    .error-state {
        text-align: center;
        padding: 2rem;
        color: #5f6368;
    }
    
    .error-state .material-icons {
        font-size: 48px;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    .toast {
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
`;
document.head.appendChild(additionalStyles);