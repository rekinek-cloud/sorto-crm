/**
 * Offline Manager for Google Nest Hub Integration
 * Handles offline data caching, sync, and background updates
 */

class OfflineManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.dbName = 'CRM_GTD_NestHub';
        this.dbVersion = 1;
        this.db = null;
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.lastSyncTime = localStorage.getItem('lastSyncTime') || 0;
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
        this.maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
        
        this.initializeDatabase();
        this.setupNetworkMonitoring();
        this.setupPeriodicSync();
        this.registerServiceWorker();
    }

    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                this.setupCleanupSchedule();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createObjectStores(db);
            };
        });
    }

    createObjectStores(db) {
        // Dashboard data store
        if (!db.objectStoreNames.contains('dashboard')) {
            const dashboardStore = db.createObjectStore('dashboard', { keyPath: 'endpoint' });
            dashboardStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
            const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
            tasksStore.createIndex('status', 'status', { unique: false });
            tasksStore.createIndex('priority', 'priority', { unique: false });
            tasksStore.createIndex('dueDate', 'dueDate', { unique: false });
        }

        // Meetings store
        if (!db.objectStoreNames.contains('meetings')) {
            const meetingsStore = db.createObjectStore('meetings', { keyPath: 'id' });
            meetingsStore.createIndex('startTime', 'startTime', { unique: false });
            meetingsStore.createIndex('status', 'status', { unique: false });
        }

        // CRM data store
        if (!db.objectStoreNames.contains('crm')) {
            const crmStore = db.createObjectStore('crm', { keyPath: 'id' });
            crmStore.createIndex('type', 'type', { unique: false });
            crmStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
            syncStore.createIndex('action', 'action', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
        }
    }

    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Network: Online');
            this.onNetworkOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Network: Offline');
            this.onNetworkOffline();
        });

        // Check connection quality periodically
        setInterval(() => {
            this.checkConnectionQuality();
        }, 30000); // Every 30 seconds
    }

    setupPeriodicSync() {
        // Sync data every 5 minutes when online
        setInterval(() => {
            if (this.isOnline) {
                this.performBackgroundSync();
            }
        }, this.syncInterval);
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/nest-hub-sw.js');
                console.log('Service Worker registered:', registration);
                
                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event.data);
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    handleServiceWorkerMessage(data) {
        switch (data.type) {
            case 'BACKGROUND_SYNC':
                this.performBackgroundSync();
                break;
            case 'CACHE_UPDATE':
                this.updateCacheFromServiceWorker(data.payload);
                break;
        }
    }

    async onNetworkOnline() {
        // Process sync queue
        await this.processSyncQueue();
        
        // Refresh critical data
        await this.refreshCriticalData();
        
        // Update UI
        this.updateConnectionStatus('online');
        
        // Notify dashboard
        if (window.dashboard) {
            window.dashboard.onNetworkStatusChange('online');
        }
    }

    onNetworkOffline() {
        this.updateConnectionStatus('offline');
        
        // Notify dashboard
        if (window.dashboard) {
            window.dashboard.onNetworkStatusChange('offline');
        }
    }

    updateConnectionStatus(status) {
        const indicator = document.getElementById('connection-status');
        const banner = document.getElementById('offline-banner');
        
        if (indicator) {
            indicator.classList.remove('online', 'offline');
            indicator.classList.add(status);
        }
        
        if (banner) {
            if (status === 'offline') {
                banner.classList.add('show');
            } else {
                banner.classList.remove('show');
            }
        }
    }

    async checkConnectionQuality() {
        if (!this.isOnline) return;

        try {
            const start = performance.now();
            const response = await fetch('/ping', { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            const end = performance.now();
            
            const latency = end - start;
            const quality = this.assessConnectionQuality(latency, response.ok);
            
            this.updateConnectionQuality(quality);
        } catch (error) {
            console.warn('Connection quality check failed:', error);
            this.updateConnectionQuality('poor');
        }
    }

    assessConnectionQuality(latency, responseOk) {
        if (!responseOk) return 'poor';
        
        if (latency < 100) return 'excellent';
        if (latency < 300) return 'good';
        if (latency < 1000) return 'fair';
        return 'poor';
    }

    updateConnectionQuality(quality) {
        const indicator = document.getElementById('connection-status');
        if (indicator) {
            indicator.setAttribute('data-quality', quality);
            indicator.title = `Connection: ${quality}`;
        }
    }

    // Data caching methods
    async cacheData(storeName, data, key = null) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const record = {
                ...data,
                timestamp: Date.now(),
                ...(key && { endpoint: key })
            };
            
            const request = store.put(record);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getCachedData(storeName, key = null, maxAge = this.maxCacheAge) {
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (key) {
                request = store.get(key);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => {
                const result = request.result;
                
                if (!result) {
                    resolve(null);
                    return;
                }
                
                // Check if data is too old
                const age = Date.now() - (result.timestamp || 0);
                if (age > maxAge) {
                    resolve(null);
                    return;
                }
                
                resolve(result);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async deleteCachedData(storeName, key) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Sync queue management
    async addToSyncQueue(action, data) {
        if (!this.db) return;

        const queueItem = {
            action,
            data,
            timestamp: Date.now(),
            retries: 0
        };

        return this.cacheData('syncQueue', queueItem);
    }

    async processSyncQueue() {
        if (!this.db || !this.isOnline) return;

        const queueItems = await this.getCachedData('syncQueue');
        if (!queueItems || queueItems.length === 0) return;

        console.log(`Processing ${queueItems.length} sync queue items`);

        for (const item of queueItems) {
            try {
                await this.processSyncItem(item);
                await this.deleteCachedData('syncQueue', item.id);
            } catch (error) {
                console.error('Sync item failed:', error);
                
                // Increment retry count
                item.retries = (item.retries || 0) + 1;
                
                // Remove item if too many retries
                if (item.retries > 3) {
                    await this.deleteCachedData('syncQueue', item.id);
                    console.warn('Sync item discarded after 3 retries:', item);
                } else {
                    await this.cacheData('syncQueue', item);
                }
            }
        }
    }

    async processSyncItem(item) {
        switch (item.action) {
            case 'COMPLETE_TASK':
                return this.apiClient.completeTask(item.data.taskId);
            
            case 'UPDATE_TASK':
                return this.apiClient.updateTask(item.data.taskId, item.data.updates);
            
            case 'CREATE_TASK':
                return this.apiClient.createTask(item.data.task);
            
            case 'MARK_NOTIFICATION_READ':
                return this.apiClient.markNotificationRead(item.data.notificationId);
            
            default:
                console.warn('Unknown sync action:', item.action);
        }
    }

    // Background sync methods
    async performBackgroundSync() {
        if (!this.isOnline) return;

        console.log('Performing background sync...');

        try {
            // Process sync queue first
            await this.processSyncQueue();
            
            // Update critical data
            await this.refreshCriticalData();
            
            // Update last sync time
            this.lastSyncTime = Date.now();
            localStorage.setItem('lastSyncTime', this.lastSyncTime.toString());
            
            console.log('Background sync completed');
        } catch (error) {
            console.error('Background sync failed:', error);
        }
    }

    async refreshCriticalData() {
        const criticalEndpoints = [
            { endpoint: '/dashboard/stats', store: 'dashboard', key: 'stats' },
            { endpoint: '/tasks?priority=HIGH,URGENT&status=NEW,IN_PROGRESS&limit=10', store: 'tasks', key: 'priority' },
            { endpoint: '/meetings?startDate=' + new Date().toISOString().split('T')[0], store: 'meetings', key: 'today' },
            { endpoint: '/workflow/inbox/stats', store: 'dashboard', key: 'inbox' }
        ];

        const promises = criticalEndpoints.map(async ({ endpoint, store, key }) => {
            try {
                const data = await this.apiClient.makeRequest(endpoint);
                await this.cacheData(store, data, key);
                return { endpoint, success: true };
            } catch (error) {
                console.warn(`Failed to refresh ${endpoint}:`, error);
                return { endpoint, success: false, error };
            }
        });

        const results = await Promise.allSettled(promises);
        console.log('Critical data refresh results:', results);
    }

    // Offline data access methods
    async getOfflineData(type, params = {}) {
        switch (type) {
            case 'dashboard-stats':
                return this.getCachedData('dashboard', 'stats');
            
            case 'priority-tasks':
                return this.getCachedData('tasks', 'priority');
            
            case 'today-meetings':
                return this.getCachedData('meetings', 'today');
            
            case 'inbox-stats':
                return this.getCachedData('dashboard', 'inbox');
            
            default:
                console.warn('Unknown offline data type:', type);
                return null;
        }
    }

    // Cleanup methods
    setupCleanupSchedule() {
        // Clean up old data every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000); // 1 hour
    }

    async cleanupOldData() {
        if (!this.db) return;

        const stores = ['dashboard', 'tasks', 'meetings', 'crm'];
        const cutoffTime = Date.now() - this.maxCacheAge;

        for (const storeName of stores) {
            try {
                await this.deleteOldRecords(storeName, cutoffTime);
            } catch (error) {
                console.error(`Failed to cleanup ${storeName}:`, error);
            }
        }

        console.log('Cleanup completed');
    }

    async deleteOldRecords(storeName, cutoffTime) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const index = store.index('timestamp');
            
            const range = IDBKeyRange.upperBound(cutoffTime);
            const request = index.openCursor(range);
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // Settings management
    async setSetting(key, value) {
        return this.cacheData('settings', { key, value });
    }

    async getSetting(key, defaultValue = null) {
        const setting = await this.getCachedData('settings', key);
        return setting ? setting.value : defaultValue;
    }

    // Public methods for dashboard integration
    async getDataWithFallback(type, params = {}) {
        if (this.isOnline) {
            try {
                // Try to get fresh data
                const freshData = await this.apiClient[this.getApiMethod(type)](params);
                
                // Cache the fresh data
                await this.cacheData(this.getStoreName(type), freshData, this.getCacheKey(type, params));
                
                return freshData;
            } catch (error) {
                console.warn('Failed to get fresh data, falling back to cache:', error);
            }
        }

        // Fallback to cached data
        const cachedData = await this.getOfflineData(type, params);
        if (cachedData) {
            return cachedData;
        }

        throw new Error(`No data available for ${type}`);
    }

    getApiMethod(type) {
        const mapping = {
            'dashboard-stats': 'getDashboardStats',
            'priority-tasks': 'getPriorityTasks',
            'today-meetings': 'getTodayMeetings',
            'inbox-stats': 'getGTDInboxStats'
        };
        
        return mapping[type] || type;
    }

    getStoreName(type) {
        const mapping = {
            'dashboard-stats': 'dashboard',
            'priority-tasks': 'tasks',
            'today-meetings': 'meetings',
            'inbox-stats': 'dashboard'
        };
        
        return mapping[type] || 'dashboard';
    }

    getCacheKey(type, params) {
        const mapping = {
            'dashboard-stats': 'stats',
            'priority-tasks': 'priority',
            'today-meetings': 'today',
            'inbox-stats': 'inbox'
        };
        
        return mapping[type] || type;
    }

    // Status methods
    getStatus() {
        return {
            isOnline: this.isOnline,
            dbConnected: !!this.db,
            lastSyncTime: this.lastSyncTime,
            syncQueueSize: this.syncQueue.length,
            cacheSize: this.getCacheSize()
        };
    }

    async getCacheSize() {
        if (!this.db) return 0;

        let totalSize = 0;
        const stores = ['dashboard', 'tasks', 'meetings', 'crm', 'syncQueue'];

        for (const storeName of stores) {
            try {
                const data = await this.getCachedData(storeName);
                if (data) {
                    totalSize += JSON.stringify(data).length;
                }
            } catch (error) {
                console.warn(`Error calculating size for ${storeName}:`, error);
            }
        }

        return totalSize;
    }

    // Manual sync triggers
    async forceSyncNow() {
        if (!this.isOnline) {
            throw new Error('Cannot sync while offline');
        }

        await this.performBackgroundSync();
    }

    async clearAllCache() {
        if (!this.db) return;

        const stores = ['dashboard', 'tasks', 'meetings', 'crm'];
        
        for (const storeName of stores) {
            try {
                await this.clearStore(storeName);
            } catch (error) {
                console.error(`Failed to clear ${storeName}:`, error);
            }
        }

        console.log('All cache cleared');
    }

    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Export for use in dashboard
window.OfflineManager = OfflineManager;