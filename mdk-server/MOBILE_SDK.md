# RestaurantAI Mobile SDK Documentation

## Overview

This document provides comprehensive guidance for integrating mobile applications with the RestaurantAI MDK Server. The SDK includes client libraries, authentication helpers, sync utilities, and real-time communication tools.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [API Client](#api-client)
4. [Real-time Updates](#real-time-updates)
5. [Offline Sync](#offline-sync)
6. [Push Notifications](#push-notifications)
7. [Error Handling](#error-handling)
8. [Platform-Specific Guides](#platform-specific-guides)
9. [Best Practices](#best-practices)

## Quick Start

### Installation

#### React Native
```bash
npm install @restaurantai/mobile-sdk
npm install @react-native-async-storage/async-storage
npm install react-native-device-info
npm install expo-notifications
npm install socket.io-client
```

#### Flutter
```yaml
dependencies:
  restaurantai_mobile_sdk: ^1.0.0
  shared_preferences: ^2.0.0
  device_info_plus: ^9.0.0
  firebase_messaging: ^14.0.0
  socket_io_client: ^2.0.0
```

### Basic Setup

#### React Native
```javascript
import { RestaurantAISDK } from '@restaurantai/mobile-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

const sdk = new RestaurantAISDK({
  baseURL: 'https://your-mdk-server.com/api/v1',
  platform: Platform.OS,
  appVersion: DeviceInfo.getVersion(),
  storage: AsyncStorage,
});

export default sdk;
```

#### Flutter
```dart
import 'package:restaurantai_mobile_sdk/restaurantai_mobile_sdk.dart';

final sdk = RestaurantAISDK(
  baseUrl: 'https://your-mdk-server.com/api/v1',
  platform: Platform.isIOS ? 'ios' : 'android',
  appVersion: await PackageInfo.fromPlatform().then((info) => info.version),
);
```

## Authentication

### Login with Device Registration

#### React Native
```javascript
import { Notifications } from 'expo-notifications';

// Get device info
const deviceId = await DeviceInfo.getUniqueId();
const pushToken = (await Notifications.getExpoPushTokenAsync()).data;

// Login
try {
  const result = await sdk.auth.login({
    email: 'user@example.com',
    password: 'password',
    deviceId: deviceId,
    pushToken: pushToken,
  });

  console.log('Login successful:', result.user);
  console.log('Access token:', result.tokens.accessToken);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

#### Flutter
```dart
import 'package:device_info_plus/device_info_plus.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// Get device info
final deviceInfo = DeviceInfoPlugin();
final deviceId = await deviceInfo.androidInfo.then((info) => info.id);
final pushToken = await FirebaseMessaging.instance.getToken();

// Login
try {
  final result = await sdk.auth.login(
    email: 'user@example.com',
    password: 'password',
    deviceId: deviceId,
    pushToken: pushToken,
  );

  print('Login successful: ${result.user}');
} on RestaurantAIException catch (e) {
  print('Login failed: ${e.message}');
}
```

### Biometric Authentication Setup

#### React Native
```javascript
import * as LocalAuthentication from 'expo-local-authentication';

const setupBiometric = async () => {
  // Check if biometric is available
  const isAvailable = await LocalAuthentication.hasHardwareAsync();
  if (!isAvailable) return false;

  // Generate biometric ID (secure hash)
  const biometricId = await generateSecureBiometricId();

  try {
    await sdk.auth.setupBiometric({
      biometricId: biometricId,
    });
    return true;
  } catch (error) {
    console.error('Biometric setup failed:', error);
    return false;
  }
};

const loginWithBiometric = async () => {
  // Authenticate with biometric
  const biometricResult = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to login',
  });

  if (biometricResult.success) {
    const biometricId = await getStoredBiometricId();
    
    try {
      const result = await sdk.auth.login({
        email: await getStoredEmail(),
        biometricId: biometricId,
        deviceId: await DeviceInfo.getUniqueId(),
      });
      return result;
    } catch (error) {
      console.error('Biometric login failed:', error);
      throw error;
    }
  }
};
```

### Token Management

#### React Native
```javascript
// Automatic token refresh
sdk.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await sdk.auth.refreshToken();
        // Retry original request
        return sdk.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await sdk.auth.logout();
        // Navigate to login screen
      }
    }
    return Promise.reject(error);
  }
);
```

## API Client

### Basic Usage

#### React Native
```javascript
// Get reservations with pagination
const getReservations = async (page = 1, filters = {}) => {
  try {
    const response = await sdk.api.get('/mobile/reservations', {
      params: {
        page: page,
        limit: 20,
        ...filters,
      },
    });

    return {
      reservations: response.data.reservations,
      pagination: response.data.pagination,
    };
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    throw error;
  }
};

// Create reservation
const createReservation = async (reservationData) => {
  try {
    const response = await sdk.api.post('/mobile/reservations', reservationData);
    return response.data;
  } catch (error) {
    if (error.code === 'TABLE_NOT_AVAILABLE') {
      throw new Error('Selected table is not available at this time');
    }
    throw error;
  }
};

// Update reservation with conflict handling
const updateReservation = async (id, updates, currentVersion) => {
  try {
    const response = await sdk.api.put(`/mobile/reservations/${id}`, updates, {
      headers: {
        'X-Entity-Version': currentVersion,
      },
    });
    return response.data;
  } catch (error) {
    if (error.code === 'VERSION_CONFLICT') {
      // Handle conflict - show conflict resolution UI
      return handleVersionConflict(error.serverData, updates);
    }
    throw error;
  }
};
```

### Request Interceptors

#### React Native
```javascript
// Add authentication headers
sdk.interceptors.request.use((config) => {
  const token = sdk.auth.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add device headers
  config.headers['X-Device-ID'] = sdk.getDeviceId();
  config.headers['X-Platform'] = sdk.getPlatform();
  config.headers['X-App-Version'] = sdk.getAppVersion();
  
  return config;
});

// Add retry logic for network errors
sdk.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'NETWORK_ERROR' && error.config.retryCount < 3) {
      error.config.retryCount = (error.config.retryCount || 0) + 1;
      await new Promise(resolve => setTimeout(resolve, 1000 * error.config.retryCount));
      return sdk.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Real-time Updates

### WebSocket Connection

#### React Native
```javascript
import io from 'socket.io-client';

class RealtimeService {
  constructor(sdk) {
    this.sdk = sdk;
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    this.socket = io(this.sdk.baseURL.replace('/api/v1', ''), {
      transports: ['websocket'],
      autoConnect: false,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.authenticate();
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('auth_error', (error) => {
      console.error('WebSocket auth error:', error);
      this.reconnectWithNewToken();
    });

    this.socket.connect();
  }

  authenticate() {
    const token = this.sdk.auth.getAccessToken();
    const deviceId = this.sdk.getDeviceId();

    this.socket.emit('authenticate', {
      token: token,
      deviceId: deviceId,
    });
  }

  // Subscribe to reservation updates
  onReservationUpdate(callback) {
    this.socket.on('reservation_updated', callback);
    return () => this.socket.off('reservation_updated', callback);
  }

  // Subscribe to order updates
  onOrderUpdate(callback) {
    this.socket.on('order_updated', callback);
    return () => this.socket.off('order_updated', callback);
  }

  // Join organization room
  joinOrganization(organizationId) {
    this.socket.emit('join_organization', { organizationId });
  }

  // Send typing indicator
  sendTypingIndicator(roomId, isTyping) {
    this.socket.emit(isTyping ? 'typing_start' : 'typing_stop', {
      roomId: roomId,
      context: 'chat',
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Usage
const realtimeService = new RealtimeService(sdk);
realtimeService.connect();

// Subscribe to updates
const unsubscribeReservations = realtimeService.onReservationUpdate((data) => {
  console.log('Reservation updated:', data.reservation);
  // Update UI with new reservation data
  updateReservationInUI(data.reservation);
});

// Cleanup
useEffect(() => {
  return () => {
    unsubscribeReservations();
    realtimeService.disconnect();
  };
}, []);
```

## Offline Sync

### Sync Manager

#### React Native
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class SyncManager {
  constructor(sdk) {
    this.sdk = sdk;
    this.syncInProgress = false;
    this.pendingChanges = [];
    this.lastSyncTime = null;
    this.syncToken = null;
  }

  async initialize() {
    // Load sync state from storage
    const syncState = await AsyncStorage.getItem('syncState');
    if (syncState) {
      const { lastSyncTime, syncToken } = JSON.parse(syncState);
      this.lastSyncTime = new Date(lastSyncTime);
      this.syncToken = syncToken;
    }

    // Load pending changes
    const pendingChanges = await AsyncStorage.getItem('pendingChanges');
    if (pendingChanges) {
      this.pendingChanges = JSON.parse(pendingChanges);
    }
  }

  // Add change to sync queue
  async addChange(entityType, entityId, operation, data) {
    const change = {
      id: Date.now().toString(),
      entityType,
      entityId,
      operation,
      data,
      timestamp: new Date().toISOString(),
      clientId: `${this.sdk.getDeviceId()}_${Date.now()}`,
    };

    this.pendingChanges.push(change);
    await this.savePendingChanges();

    // Auto-sync if online
    if (await this.isOnline()) {
      this.scheduleSync();
    }
  }

  // Pull changes from server
  async pullChanges(entityTypes = []) {
    try {
      const response = await this.sdk.api.post('/mobile/sync/pull', {
        lastSyncTime: this.lastSyncTime?.toISOString(),
        entityTypes: entityTypes,
      }, {
        headers: {
          'X-Sync-Token': this.syncToken,
        },
      });

      const { data, meta } = response.data;
      
      // Apply changes to local database
      await this.applyServerChanges(data);
      
      // Update sync state
      this.syncToken = meta.syncToken;
      this.lastSyncTime = new Date(meta.serverTime);
      await this.saveSyncState();

      return data;
    } catch (error) {
      if (error.code === 'SYNC_CONFLICT') {
        // Handle sync conflict
        return this.handleSyncConflict(error);
      }
      throw error;
    }
  }

  // Push changes to server
  async pushChanges() {
    if (this.pendingChanges.length === 0) return [];

    try {
      const response = await this.sdk.api.post('/mobile/sync/push', {
        changes: this.pendingChanges,
        syncToken: this.syncToken,
      });

      const { applied, conflicts, errors } = response.data.data;
      
      // Remove applied changes from pending
      const appliedIds = applied.map(change => change.id);
      this.pendingChanges = this.pendingChanges.filter(
        change => !appliedIds.includes(change.id)
      );
      
      await this.savePendingChanges();

      // Handle conflicts
      if (conflicts.length > 0) {
        await this.handleConflicts(conflicts);
      }

      // Handle errors
      if (errors.length > 0) {
        console.error('Sync errors:', errors);
      }

      return { applied, conflicts, errors };
    } catch (error) {
      console.error('Push changes failed:', error);
      throw error;
    }
  }

  // Full synchronization
  async sync(entityTypes = []) {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      // Push local changes first
      const pushResult = await this.pushChanges();
      
      // Then pull server changes
      const pullResult = await this.pullChanges(entityTypes);
      
      return {
        pushed: pushResult,
        pulled: pullResult,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Handle conflicts
  async handleConflicts(conflicts) {
    for (const conflict of conflicts) {
      // Show conflict resolution UI to user
      const resolution = await this.showConflictResolutionUI(conflict);
      
      if (resolution) {
        try {
          await this.sdk.api.post('/mobile/sync/resolve-conflicts', {
            conflicts: [conflict],
            resolutions: [resolution],
          });
        } catch (error) {
          console.error('Conflict resolution failed:', error);
        }
      }
    }
  }

  // Background sync
  async scheduleBackgroundSync() {
    if (Platform.OS === 'ios') {
      // Use iOS background app refresh
      const result = await BackgroundTask.start({
        taskName: 'sync',
        taskKey: 'sync',
      });
      
      if (result) {
        await this.sync();
        BackgroundTask.finish('sync');
      }
    } else {
      // Use Android background service
      await BackgroundService.start({
        taskName: 'sync',
        taskTitle: 'Syncing data...',
        taskDesc: 'Synchronizing with server',
        taskIcon: {
          name: 'ic_launcher',
          type: 'mipmap',
        },
      });
    }
  }

  // Utility methods
  async isOnline() {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected;
  }

  async saveSyncState() {
    await AsyncStorage.setItem('syncState', JSON.stringify({
      lastSyncTime: this.lastSyncTime,
      syncToken: this.syncToken,
    }));
  }

  async savePendingChanges() {
    await AsyncStorage.setItem('pendingChanges', JSON.stringify(this.pendingChanges));
  }

  async applyServerChanges(changes) {
    // Apply changes to local SQLite database
    for (const [entityType, entities] of Object.entries(changes)) {
      for (const entity of entities) {
        await this.localDB.upsert(entityType, entity);
      }
    }
  }
}

// Usage
const syncManager = new SyncManager(sdk);
await syncManager.initialize();

// Sync when app comes to foreground
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    syncManager.sync();
  }
});

// Background sync (if supported)
setInterval(() => {
  syncManager.scheduleBackgroundSync();
}, 5 * 60 * 1000); // Every 5 minutes
```

## Push Notifications

### Setup and Handling

#### React Native (Expo)
```javascript
import { Notifications } from 'expo-notifications';
import Constants from 'expo-constants';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor(sdk) {
    this.sdk = sdk;
  }

  async initialize() {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Get push token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    // Register token with server
    await this.registerPushToken(token);

    // Set up notification listeners
    this.setupNotificationListeners();

    return true;
  }

  async registerPushToken(token) {
    try {
      await this.sdk.api.post('/mobile/auth/push-token', {
        pushToken: token,
        platform: 'expo',
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  setupNotificationListeners() {
    // Notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Notification tapped (app opened from notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      this.handleNotificationTapped(response);
    });
  }

  handleNotificationReceived(notification) {
    const { data } = notification.request.content;
    
    // Update local data based on notification
    switch (data?.type) {
      case 'reservation_update':
        this.updateLocalReservation(data.reservationId);
        break;
      case 'order_update':
        this.updateLocalOrder(data.orderId);
        break;
      default:
        // Generic notification handling
        break;
    }
  }

  handleNotificationTapped(response) {
    const { data } = response.notification.request.content;
    
    // Navigate to relevant screen
    switch (data?.type) {
      case 'reservation_update':
        // Navigate to reservation details
        this.navigateToReservation(data.reservationId);
        break;
      case 'order_update':
        // Navigate to order details
        this.navigateToOrder(data.orderId);
        break;
      default:
        // Navigate to home screen
        this.navigateToHome();
        break;
    }
  }

  async updateLocalReservation(reservationId) {
    try {
      const response = await this.sdk.api.get(`/mobile/reservations/${reservationId}`);
      await this.localDB.upsert('reservations', response.data);
    } catch (error) {
      console.error('Failed to update local reservation:', error);
    }
  }
}

// Usage
const notificationService = new NotificationService(sdk);
await notificationService.initialize();
```

#### React Native (Firebase)
```javascript
import messaging from '@react-native-firebase/messaging';

class FirebaseNotificationService {
  constructor(sdk) {
    this.sdk = sdk;
  }

  async initialize() {
    // Request permissions
    const authStatus = await messaging().requestPermission();
    if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED) {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Get FCM token
    const token = await messaging().getToken();
    await this.registerPushToken(token);

    // Set up listeners
    this.setupMessageListeners();

    return true;
  }

  setupMessageListeners() {
    // Foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // Background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
      this.handleBackgroundMessage(remoteMessage);
    });

    // App opened from notification
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('App opened from notification:', remoteMessage);
      this.handleNotificationTapped(remoteMessage);
    });

    // App opened from killed state
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from killed state:', remoteMessage);
        this.handleNotificationTapped(remoteMessage);
      }
    });
  }
}
```

## Error Handling

### Comprehensive Error Handling

#### React Native
```javascript
class ErrorHandler {
  constructor(sdk) {
    this.sdk = sdk;
  }

  handleAPIError(error) {
    const { code, message, statusCode } = error;

    switch (code) {
      case 'NETWORK_ERROR':
        return this.handleNetworkError();
      
      case 'AUTH_REQUIRED':
      case 'TOKEN_EXPIRED':
        return this.handleAuthError();
      
      case 'RATE_LIMIT_EXCEEDED':
        return this.handleRateLimitError(error.retryAfter);
      
      case 'VERSION_CONFLICT':
        return this.handleVersionConflict(error.serverData);
      
      case 'SYNC_CONFLICT':
        return this.handleSyncConflict(error.conflicts);
      
      case 'PREMIUM_REQUIRED':
        return this.handlePremiumRequired();
      
      case 'APP_UPDATE_REQUIRED':
        return this.handleAppUpdateRequired(error.minVersion);
      
      default:
        return this.handleGenericError(message);
    }
  }

  async handleNetworkError() {
    // Show offline indicator
    this.showOfflineIndicator();
    
    // Queue operations for later sync
    await this.queueOfflineOperations();
    
    // Retry connection
    this.scheduleRetry();
  }

  async handleAuthError() {
    try {
      // Try to refresh token
      await this.sdk.auth.refreshToken();
    } catch (refreshError) {
      // Refresh failed, logout user
      await this.sdk.auth.logout();
      this.navigateToLogin();
    }
  }

  handleRateLimitError(retryAfter) {
    const retryTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
    
    this.showMessage('Too many requests. Please try again later.');
    
    // Schedule retry
    setTimeout(() => {
      this.retryLastRequest();
    }, retryTime);
  }

  async handleVersionConflict(serverData) {
    // Show conflict resolution UI
    const resolution = await this.showConflictDialog({
      title: 'Data Conflict',
      message: 'This item was modified by another user. How would you like to resolve this?',
      options: [
        { text: 'Keep My Changes', value: 'CLIENT_WINS' },
        { text: 'Use Server Version', value: 'SERVER_WINS' },
        { text: 'Merge Changes', value: 'MERGE' },
      ],
      serverData: serverData,
    });

    return resolution;
  }

  handleAppUpdateRequired(minVersion) {
    this.showUpdateDialog({
      title: 'App Update Required',
      message: `This app version is no longer supported. Please update to version ${minVersion} or later.`,
      buttons: [
        { text: 'Update Now', action: () => this.openAppStore() },
        { text: 'Later', style: 'cancel' },
      ],
    });
  }

  showMessage(message, type = 'info') {
    // Show toast/alert based on platform
    if (Platform.OS === 'ios') {
      Alert.alert('RestaurantAI', message);
    } else {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  }
}

// Global error handler setup
const errorHandler = new ErrorHandler(sdk);

sdk.interceptors.response.use(
  (response) => response,
  (error) => {
    errorHandler.handleAPIError(error);
    return Promise.reject(error);
  }
);
```

## Platform-Specific Guides

### iOS Integration

#### App Transport Security
```xml
<!-- Add to Info.plist for development -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>your-mdk-server.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

#### Background App Refresh
```swift
// AppDelegate.swift
import BackgroundTasks

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // Register background task
    BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.restaurantai.sync", using: nil) { task in
        self.handleAppRefresh(task: task as! BGAppRefreshTask)
    }
    
    return true
}

func handleAppRefresh(task: BGAppRefreshTask) {
    task.expirationHandler = {
        task.setTaskCompleted(success: false)
    }
    
    // Perform sync
    syncManager.sync().then { _ in
        task.setTaskCompleted(success: true)
    }.catch { _ in
        task.setTaskCompleted(success: false)
    }
}
```

### Android Integration

#### Network Security Config
```xml
<!-- Add to android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">your-mdk-server.com</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

#### Background Services
```java
// SyncService.java
public class SyncService extends JobIntentService {
    private static final int JOB_ID = 1000;

    public static void enqueueWork(Context context, Intent work) {
        enqueueWork(context, SyncService.class, JOB_ID, work);
    }

    @Override
    protected void onHandleWork(@NonNull Intent intent) {
        // Perform sync operation
        try {
            SyncManager.getInstance().sync();
        } catch (Exception e) {
            Log.e("SyncService", "Sync failed", e);
        }
    }
}
```

## Best Practices

### Performance Optimization

1. **Lazy Loading**: Load data on demand
2. **Pagination**: Use small page sizes (10-20 items)
3. **Caching**: Cache frequently accessed data
4. **Image Optimization**: Compress images before upload
5. **Network Efficiency**: Batch API calls when possible

### Security Best Practices

1. **Token Storage**: Use secure storage (Keychain/Keystore)
2. **Certificate Pinning**: Pin SSL certificates
3. **Data Encryption**: Encrypt sensitive local data
4. **Biometric Security**: Implement biometric authentication
5. **Session Management**: Implement proper session timeout

### User Experience

1. **Offline Support**: Graceful offline functionality
2. **Loading States**: Show loading indicators
3. **Error Messages**: User-friendly error messages
4. **Sync Indicators**: Show sync status
5. **Conflict Resolution**: Intuitive conflict resolution UI

### Development Workflow

1. **Environment Management**: Separate dev/staging/prod
2. **Logging**: Comprehensive logging for debugging
3. **Testing**: Unit and integration tests
4. **Monitoring**: Track app performance and errors
5. **Analytics**: Monitor user behavior and app usage

### Code Organization

```
src/
├── services/
│   ├── sdk/                 # SDK integration
│   ├── sync/               # Sync management
│   ├── notifications/      # Push notifications
│   └── realtime/          # WebSocket handling
├── utils/
│   ├── storage.js         # Secure storage
│   ├── network.js         # Network utilities
│   └── errors.js          # Error handling
├── stores/                # State management
├── screens/               # UI screens
└── components/            # Reusable components
```

This comprehensive SDK documentation provides everything needed to integrate mobile applications with the RestaurantAI MDK Server, ensuring robust, secure, and efficient mobile app development.