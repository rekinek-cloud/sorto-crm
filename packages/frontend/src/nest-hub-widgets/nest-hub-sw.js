/**
 * Service Worker for Google Nest Hub Integration
 * Handles background sync, caching, and offline functionality
 */

const CACHE_NAME = 'crm-gtd-nest-hub-v1';
const DATA_CACHE_NAME = 'crm-gtd-data-v1';

// URLs to cache for offline functionality
const urlsToCache = [
    '/nest-hub-widgets/',
    '/nest-hub-widgets/index.html',
    '/nest-hub-widgets/styles.css',
    '/nest-hub-widgets/dashboard.js',
    '/nest-hub-widgets/api-client.js',
    '/nest-hub-widgets/voice-commands.js',
    '/nest-hub-widgets/offline-manager.js',
    '/nest-hub-widgets/widgets.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// API endpoints to cache
const apiEndpointsToCache = [
    '/api/v1/dashboard/stats',
    '/api/v1/tasks?priority=HIGH,URGENT&status=NEW,IN_PROGRESS&limit=10',
    '/api/v1/meetings',
    '/api/v1/gtd/inbox/stats',
    '/api/v1/deals/pipeline',
    '/api/v1/activities?limit=10'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Install failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated successfully');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle API requests
    if (url.pathname.startsWith('/api/v1/') || url.pathname.startsWith('/crm/api/v1/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle app shell requests
    if (url.pathname.startsWith('/nest-hub-widgets/') || 
        url.hostname === 'fonts.googleapis.com' ||
        url.hostname === 'fonts.gstatic.com') {
        event.respondWith(handleAppShellRequest(request));
        return;
    }
    
    // Default handling for other requests
    event.respondWith(
        fetch(request).catch(() => {
            // Fallback to cache if network fails
            return caches.match(request);
        })
    );
});

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
    const url = new URL(request.url);
    const cacheKey = `${url.pathname}${url.search}`;
    
    try {
        // Try network first for fresh data
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache successful API responses
            const cache = await caches.open(DATA_CACHE_NAME);
            cache.put(cacheKey, response.clone());
            return response;
        }
        
        // If network response is not ok, try cache
        const cachedResponse = await caches.match(cacheKey);
        if (cachedResponse) {
            console.log('Service Worker: Serving from cache (API error)', cacheKey);
            return cachedResponse;
        }
        
        return response; // Return error response if no cache
        
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache', cacheKey);
        
        // Network failed, try cache
        const cachedResponse = await caches.match(cacheKey);
        if (cachedResponse) {
            console.log('Service Worker: Serving from cache (offline)', cacheKey);
            return cachedResponse;
        }
        
        // No cache available, return error
        return new Response(
            JSON.stringify({ 
                error: 'Offline - no cached data available',
                timestamp: Date.now()
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle app shell requests with cache-first strategy
async function handleAppShellRequest(request) {
    try {
        // Try cache first for app shell
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('Service Worker: Serving from cache', request.url);
            return cachedResponse;
        }
        
        // If not in cache, try network
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache the response
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        console.error('Service Worker: Failed to serve', request.url, error);
        
        // For HTML requests, serve a fallback page
        if (request.headers.get('accept')?.includes('text/html')) {
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Sorto CRM Nest Hub - Offline</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .offline-message { color: #666; }
                        .retry-button { 
                            background: #4285f4; 
                            color: white; 
                            border: none; 
                            padding: 10px 20px; 
                            border-radius: 5px; 
                            cursor: pointer; 
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <h1>Sorto CRM</h1>
                    <div class="offline-message">
                        <p>Brak połączenia z internetem</p>
                        <p>Sprawdź połączenie i spróbuj ponownie</p>
                        <button class="retry-button" onclick="window.location.reload()">
                            Spróbuj ponownie
                        </button>
                    </div>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        return new Response('Network error', { status: 408 });
    }
}

// Background sync event
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(performBackgroundSync());
    }
    
    if (event.tag === 'sync-queue') {
        event.waitUntil(processSyncQueue());
    }
});

// Perform background sync
async function performBackgroundSync() {
    console.log('Service Worker: Performing background sync...');
    
    try {
        // Notify clients about background sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'BACKGROUND_SYNC',
                timestamp: Date.now()
            });
        });
        
        // Pre-fetch critical API endpoints
        const cache = await caches.open(DATA_CACHE_NAME);
        
        for (const endpoint of apiEndpointsToCache) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    await cache.put(endpoint, response.clone());
                    console.log('Service Worker: Cached', endpoint);
                }
            } catch (error) {
                console.warn('Service Worker: Failed to cache', endpoint, error);
            }
        }
        
        console.log('Service Worker: Background sync completed');
        
    } catch (error) {
        console.error('Service Worker: Background sync failed', error);
    }
}

// Process sync queue
async function processSyncQueue() {
    console.log('Service Worker: Processing sync queue...');
    
    try {
        // Get pending sync items from IndexedDB
        const syncItems = await getSyncQueueItems();
        
        for (const item of syncItems) {
            try {
                await processSyncItem(item);
                await removeSyncQueueItem(item.id);
                console.log('Service Worker: Sync item processed', item.id);
            } catch (error) {
                console.error('Service Worker: Sync item failed', item.id, error);
                // Increment retry count or remove if max retries reached
                await updateSyncItemRetries(item.id);
            }
        }
        
    } catch (error) {
        console.error('Service Worker: Sync queue processing failed', error);
    }
}

// Process individual sync item
async function processSyncItem(item) {
    const { action, data } = item;
    
    switch (action) {
        case 'COMPLETE_TASK':
            return fetch(`/api/v1/tasks/${data.taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'COMPLETED' })
            });
            
        case 'UPDATE_TASK':
            return fetch(`/api/v1/tasks/${data.taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.updates)
            });
            
        case 'MARK_NOTIFICATION_READ':
            return fetch(`/api/v1/notifications/${data.notificationId}/read`, {
                method: 'POST'
            });
            
        default:
            console.warn('Service Worker: Unknown sync action', action);
    }
}

// IndexedDB helpers for sync queue
async function getSyncQueueItems() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CRM_GTD_NestHub', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result || []);
            };
            
            getAllRequest.onerror = () => {
                reject(getAllRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

async function removeSyncQueueItem(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CRM_GTD_NestHub', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
        
        request.onerror = () => reject(request.error);
    });
}

async function updateSyncItemRetries(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CRM_GTD_NestHub', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    item.retries = (item.retries || 0) + 1;
                    
                    if (item.retries > 3) {
                        // Remove item after 3 retries
                        store.delete(id);
                    } else {
                        // Update retry count
                        store.put(item);
                    }
                }
                resolve();
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        };
        
        request.onerror = () => reject(request.error);
    });
}

// Message handling from clients
self.addEventListener('message', (event) => {
    console.log('Service Worker: Received message', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            cacheUrls(data.urls);
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
            
        case 'FORCE_SYNC':
            performBackgroundSync();
            break;
            
        case 'MAKE_CALL':
            handleMakeCall(data.phoneNumber);
            break;
    }
});

// Cache specific URLs
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urls);
        console.log('Service Worker: URLs cached', urls);
    } catch (error) {
        console.error('Service Worker: Failed to cache URLs', error);
    }
}

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service Worker: All caches cleared');
    } catch (error) {
        console.error('Service Worker: Failed to clear caches', error);
    }
}

// Handle phone call requests
async function handleMakeCall(phoneNumber) {
    try {
        // For Google Nest Hub, this would integrate with Google Assistant
        // For now, we'll just notify the client
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'PHONE_CALL_INITIATED',
                phoneNumber: phoneNumber,
                timestamp: Date.now()
            });
        });
        
        console.log('Service Worker: Phone call initiated', phoneNumber);
    } catch (error) {
        console.error('Service Worker: Phone call failed', error);
    }
}

// Periodic background sync (if supported)
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    // Register periodic background sync
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'periodic-data-sync') {
            event.waitUntil(performBackgroundSync());
        }
    });
}

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received', event);
    
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/nest-hub-widgets/icon-192.png',
            badge: '/nest-hub-widgets/badge-72.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/nest-hub-widgets/',
                timestamp: Date.now()
            },
            actions: [
                {
                    action: 'open',
                    title: 'Otwórz',
                    icon: '/nest-hub-widgets/icon-open.png'
                },
                {
                    action: 'dismiss',
                    title: 'Odrzuć',
                    icon: '/nest-hub-widgets/icon-close.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/nest-hub-widgets/')
        );
    }
});

console.log('Service Worker: Script loaded');

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleApiRequest,
        handleAppShellRequest,
        performBackgroundSync,
        processSyncQueue
    };
}