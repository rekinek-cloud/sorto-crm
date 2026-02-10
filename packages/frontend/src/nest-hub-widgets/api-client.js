/**
 * API Client for Sorto CRM Nest Hub Integration
 * Handles data fetching with caching and offline support
 */

class ApiClient {
    constructor() {
        this.baseURL = this.detectBaseURL();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        this.isOnline = navigator.onLine;
        
        // Monitor network status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onNetworkStatusChange('online');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onNetworkStatusChange('offline');
        });
    }

    detectBaseURL() {
        // Auto-detect base URL based on current environment
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:3003/api/v1`;
        } else {
            return `${protocol}//${hostname}/crm/api/v1`;
        }
    }

    onNetworkStatusChange(status) {
        const banner = document.getElementById('offline-banner');
        const indicator = document.getElementById('connection-status');
        
        if (status === 'offline') {
            banner?.classList.add('show');
            indicator?.classList.remove('online');
            indicator?.classList.add('offline');
        } else {
            banner?.classList.remove('show');
            indicator?.classList.remove('offline');
            indicator?.classList.add('online');
            
            // Refresh data when coming back online
            setTimeout(() => {
                this.refreshAllData();
            }, 1000);
        }
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        // If offline, return cached data or throw error
        if (!this.isOnline) {
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey).data;
            }
            throw new Error('Offline - no cached data available');
        }

        // Make request with retry logic
        return this.requestWithRetry(url, options, cacheKey);
    }

    async requestWithRetry(url, options, cacheKey, attempt = 1) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful response
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error(`API request failed (attempt ${attempt}):`, error);
            
            if (attempt < this.retryAttempts) {
                await this.delay(this.retryDelay * attempt);
                return this.requestWithRetry(url, options, cacheKey, attempt + 1);
            }
            
            // Return cached data as fallback
            if (this.cache.has(cacheKey)) {
                console.warn('Using cached data due to API failure');
                return this.cache.get(cacheKey).data;
            }
            
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Dashboard API Methods
    async getDashboardStats() {
        return this.makeRequest('/dashboard/stats');
    }

    async getWeeklySummary() {
        return this.makeRequest('/dashboard/weekly-summary');
    }

    async getUpcomingDeadlines() {
        return this.makeRequest('/dashboard/upcoming-deadlines');
    }

    // Tasks API Methods
    async getTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        return this.makeRequest(`/tasks?dueDate=${today}&status=NEW,IN_PROGRESS&limit=10`);
    }

    async getPriorityTasks() {
        return this.makeRequest('/tasks?priority=HIGH,URGENT&status=NEW,IN_PROGRESS&limit=5');
    }

    async getGTDInboxStats() {
        return this.makeRequest('/gtd/inbox/stats');
    }

    async getGTDInboxItems() {
        return this.makeRequest('/gtd/inbox?limit=10&processed=false');
    }

    async completeTask(taskId) {
        if (!this.isOnline) {
            throw new Error('Cannot complete task while offline');
        }

        return fetch(`${this.baseURL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'COMPLETED' })
        });
    }

    // CRM API Methods
    async getPipelineStats() {
        return this.makeRequest('/deals/pipeline');
    }

    async getPipelineVelocity() {
        return this.makeRequest('/pipeline-analytics/velocity');
    }

    async getConversionRates() {
        return this.makeRequest('/pipeline-analytics/conversion-rates');
    }

    async getActiveDeals() {
        return this.makeRequest('/deals?stage=PROPOSAL,NEGOTIATION&sortBy=value&sortOrder=desc&limit=5');
    }

    // Calendar API Methods
    async getTodayMeetings() {
        const today = new Date().toISOString().split('T')[0];
        return this.makeRequest(`/meetings?startDate=${today}&endDate=${today}&status=SCHEDULED`);
    }

    async getMeetingStats() {
        return this.makeRequest('/meetings/stats/overview');
    }

    async callClient(phoneNumber) {
        if (!this.isOnline) {
            throw new Error('Cannot make calls while offline');
        }

        // Integration with Google Assistant for phone calls
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.postMessage({
                type: 'MAKE_CALL',
                phoneNumber
            });
        }
    }

    // Goals and Areas API Methods
    async getAreas() {
        return this.makeRequest('/areas');
    }

    async getProjects() {
        return this.makeRequest('/projects');
    }

    async getProjectStats(projectId) {
        return this.makeRequest(`/projects/${projectId}/stats`);
    }

    // Activities API Methods
    async getRecentActivities() {
        return this.makeRequest('/activities?limit=10&type=DEAL_STAGE_CHANGED,TASK_COMPLETED,MEETING_COMPLETED');
    }

    async getCompanyActivities(companyId) {
        return this.makeRequest(`/activities/company/${companyId}`);
    }

    // Search API Methods
    async searchPublic(query) {
        return this.makeRequest(`/search-public?q=${encodeURIComponent(query)}&limit=5`);
    }

    async searchRAG(query) {
        return this.makeRequest(`/test-rag-search/search?query=${encodeURIComponent(query)}&limit=5`);
    }

    // Notification Simulation (since not in API)
    async getNotifications() {
        // Simulate notifications based on dashboard data
        try {
            const [inboxStats, upcomingDeadlines, todayMeetings] = await Promise.all([
                this.getGTDInboxStats(),
                this.getUpcomingDeadlines(),
                this.getTodayMeetings()
            ]);

            const notifications = [];

            // Unprocessed inbox items
            if (inboxStats.totalUnprocessed > 0) {
                notifications.push({
                    id: 'inbox-unprocessed',
                    title: `${inboxStats.totalUnprocessed} elementów do przetworzenia`,
                    type: 'inbox',
                    time: '5 min temu',
                    unread: true
                });
            }

            // Urgent inbox items
            if (inboxStats.urgentItems > 0) {
                notifications.push({
                    id: 'inbox-urgent',
                    title: `${inboxStats.urgentItems} pilnych zadań`,
                    type: 'urgent',
                    time: '10 min temu',
                    unread: true
                });
            }

            // Upcoming deadlines
            if (upcomingDeadlines.upcomingTasks?.length > 0) {
                const urgent = upcomingDeadlines.upcomingTasks.filter(task => {
                    const deadline = new Date(task.dueDate);
                    const now = new Date();
                    const timeDiff = deadline - now;
                    return timeDiff < 2 * 60 * 60 * 1000; // Less than 2 hours
                });

                if (urgent.length > 0) {
                    notifications.push({
                        id: 'deadline-urgent',
                        title: `${urgent.length} zadań z terminem < 2h`,
                        type: 'deadline',
                        time: '15 min temu',
                        unread: true
                    });
                }
            }

            // Upcoming meetings (next 30 minutes)
            if (todayMeetings.meetings?.length > 0) {
                const upcoming = todayMeetings.meetings.filter(meeting => {
                    const meetingTime = new Date(meeting.startTime);
                    const now = new Date();
                    const timeDiff = meetingTime - now;
                    return timeDiff > 0 && timeDiff < 30 * 60 * 1000; // Next 30 minutes
                });

                if (upcoming.length > 0) {
                    notifications.push({
                        id: 'meeting-upcoming',
                        title: `Spotkanie za ${Math.round((new Date(upcoming[0].startTime) - new Date()) / (60 * 1000))} min`,
                        type: 'meeting',
                        time: 'Teraz',
                        unread: true
                    });
                }
            }

            return { notifications };
        } catch (error) {
            console.error('Error generating notifications:', error);
            return { notifications: [] };
        }
    }

    // Utility method to refresh all data
    async refreshAllData() {
        // Clear cache
        this.cache.clear();
        
        // Trigger refresh indicator
        const refreshIndicator = document.getElementById('refresh-indicator');
        refreshIndicator?.classList.add('spinning');
        
        try {
            // Pre-fetch critical data
            await Promise.allSettled([
                this.getDashboardStats(),
                this.getPriorityTasks(),
                this.getTodayMeetings(),
                this.getGTDInboxStats(),
                this.getPipelineStats(),
                this.getRecentActivities()
            ]);
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            refreshIndicator?.classList.remove('spinning');
        }
    }

    // Clear cache manually
    clearCache() {
        this.cache.clear();
    }

    // Get cache status for debugging
    getCacheStatus() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            isOnline: this.isOnline
        };
    }
}

// Add spinning animation for refresh indicator
const style = document.createElement('style');
style.textContent = `
    .spinning {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Export for use in other modules
window.ApiClient = ApiClient;