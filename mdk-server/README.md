# RestaurantAI Mobile Development Kit (MDK) Server

## Overview

The RestaurantAI MDK Server is a comprehensive mobile-optimized API server designed specifically for mobile applications. It provides enhanced features for mobile apps including real-time updates, offline synchronization, push notifications, and mobile-specific optimizations.

## Features

### 🔐 Enhanced Authentication
- **Device Registration**: Automatic device tracking and session management
- **Biometric Authentication**: Support for fingerprint/face ID authentication
- **Multi-Device Support**: Users can be logged in on multiple devices simultaneously
- **Session Management**: Robust session handling with refresh tokens

### 🔄 Offline Synchronization
- **Conflict Resolution**: Intelligent conflict resolution strategies
- **Incremental Sync**: Only sync changes since last update
- **Batch Operations**: Efficient batch processing for better performance
- **Version Control**: Entity versioning for optimistic updates

### 📱 Real-Time Updates
- **WebSocket Support**: Real-time communication via Socket.IO
- **Room Management**: Organized real-time updates by organization/table
- **Typing Indicators**: Real-time typing status for collaborative features
- **Location Tracking**: Real-time location updates for delivery

### 🔔 Push Notifications
- **Multi-Platform**: Support for both Expo and FCM (Firebase)
- **Smart Routing**: Automatic platform detection and routing
- **Template System**: Pre-defined notification templates
- **Analytics**: Notification delivery tracking and analytics

### 🎯 Mobile Optimizations
- **Compressed Responses**: Optimized data transfer for mobile networks
- **Image Processing**: Automatic image compression and optimization
- **Pagination**: Mobile-friendly pagination with configurable limits
- **Caching**: Intelligent caching strategies for better performance

## Architecture

```
mdk-server/
├── src/
│   ├── middleware/         # Custom middleware
│   │   ├── mobileAuth.js   # Enhanced mobile authentication
│   │   ├── device.js       # Device tracking and management
│   │   ├── sync.js         # Synchronization middleware
│   │   └── errorHandler.js # Mobile-optimized error handling
│   ├── routes/mobile/      # Mobile-specific API routes
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── config.js       # App configuration and feature flags
│   │   ├── reservations.js # Mobile-optimized reservations
│   │   └── sync.js         # Synchronization endpoints
│   ├── services/           # Core services
│   │   ├── pushNotification.js # Push notification service
│   │   ├── socket.js       # WebSocket service
│   │   └── sync.js         # Synchronization service
│   ├── utils/              # Utilities
│   │   └── logger.js       # Enhanced logging
│   └── server.js           # Main server file
├── package.json
├── .env.example
└── README.md
```

## Installation

1. **Clone the repository and navigate to MDK server:**
   ```bash
   cd /opt/apps/restaurant-ai/mdk-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Configuration

### Environment Variables

#### Core Settings
```env
NODE_ENV=development
PORT=3006
API_VERSION=v1
DATABASE_URL="postgresql://..."
```

#### Authentication
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

#### Mobile Features
```env
FEATURE_OFFLINE_MODE=true
FEATURE_PUSH_NOTIFICATIONS=true
FEATURE_REAL_TIME_UPDATES=true
FEATURE_IMAGE_COMPRESSION=true
FEATURE_BACKGROUND_SYNC=true
```

#### Push Notifications
```env
EXPO_ACCESS_TOKEN=your-expo-token
FCM_SERVER_KEY=your-fcm-key
FCM_SENDER_ID=your-sender-id
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
MOBILE_RATE_LIMIT_MAX_REQUESTS=500
```

## API Endpoints

### Authentication
- `POST /api/v1/mobile/auth/login` - Mobile login with device registration
- `POST /api/v1/mobile/auth/register` - User registration
- `POST /api/v1/mobile/auth/refresh` - Refresh access token
- `POST /api/v1/mobile/auth/logout` - Logout and cleanup sessions
- `POST /api/v1/mobile/auth/biometric/setup` - Setup biometric authentication

### Configuration
- `GET /api/v1/mobile/config` - Get app configuration and feature flags
- `GET /api/v1/mobile/config/features` - Get feature flags only
- `POST /api/v1/mobile/config/preferences` - Update user preferences
- `GET /api/v1/mobile/config/app-info` - Get app update information

### Synchronization
- `POST /api/v1/mobile/sync/pull` - Pull changes from server
- `POST /api/v1/mobile/sync/push` - Push changes to server
- `POST /api/v1/mobile/sync/resolve-conflicts` - Resolve sync conflicts
- `GET /api/v1/mobile/sync/status` - Get sync status
- `POST /api/v1/mobile/sync/reset` - Reset sync session
- `GET /api/v1/mobile/sync/health` - Check sync service health

### Reservations (Mobile Optimized)
- `GET /api/v1/mobile/reservations` - Get paginated reservations
- `GET /api/v1/mobile/reservations/:id` - Get single reservation
- `POST /api/v1/mobile/reservations` - Create reservation
- `PUT /api/v1/mobile/reservations/:id` - Update reservation
- `PATCH /api/v1/mobile/reservations/:id/status` - Update status
- `DELETE /api/v1/mobile/reservations/:id` - Delete reservation

## Mobile Client Integration

### Authentication Flow

```javascript
// 1. Login with device registration
const loginResponse = await fetch('/api/v1/mobile/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Device-ID': deviceId,
    'X-Platform': 'ios', // or 'android'
    'X-App-Version': '1.0.0'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
    pushToken: expoPushToken
  })
});

// 2. Store tokens
const { accessToken, refreshToken } = loginResponse.data.tokens;
```

### WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3006', {
  transports: ['websocket']
});

// Authenticate socket
socket.emit('authenticate', {
  token: accessToken,
  deviceId: deviceId
});

// Listen for real-time updates
socket.on('reservation_created', (data) => {
  console.log('New reservation:', data.reservation);
});
```

### Offline Sync

```javascript
// Pull changes from server
const pullChanges = async () => {
  const response = await fetch('/api/v1/mobile/sync/pull', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Device-ID': deviceId,
      'X-Sync-Token': currentSyncToken
    },
    body: JSON.stringify({
      lastSyncTime: lastSyncTime,
      entityTypes: ['reservations', 'orders']
    })
  });
  
  const { data, meta } = response.data;
  // Apply changes to local database
  updateLocalDatabase(data);
  currentSyncToken = meta.syncToken;
};

// Push changes to server
const pushChanges = async (localChanges) => {
  const response = await fetch('/api/v1/mobile/sync/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Device-ID': deviceId,
      'X-Sync-Token': currentSyncToken
    },
    body: JSON.stringify({
      changes: localChanges,
      syncToken: currentSyncToken
    })
  });
  
  const { applied, conflicts } = response.data.data;
  // Handle applied changes and conflicts
  handleSyncResults(applied, conflicts);
};
```

### Push Notifications

```javascript
import { Notifications } from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Get push token and send to server
const token = (await Notifications.getExpoPushTokenAsync()).data;

// Include in login request
const loginData = {
  email,
  password,
  pushToken: token
};
```

## Database Schema Extensions

The MDK server requires additional database tables for mobile features:

```sql
-- Device Sessions
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  device_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50),
  app_version VARCHAR(20),
  push_token TEXT,
  refresh_token TEXT,
  biometric_hash TEXT,
  biometric_enabled BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Sync Sessions
CREATE TABLE sync_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  device_id VARCHAR(255) NOT NULL,
  last_sync_at TIMESTAMP DEFAULT NOW(),
  sync_token VARCHAR(255) NOT NULL,
  conflict_resolution_strategy VARCHAR(50) DEFAULT 'SERVER_WINS',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Sync Operations
CREATE TABLE sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_session_id UUID NOT NULL REFERENCES sync_sessions(id),
  operation VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255),
  status VARCHAR(50) DEFAULT 'IN_PROGRESS',
  timestamp TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Push Notification Logs
CREATE TABLE push_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  push_token TEXT NOT NULL,
  title VARCHAR(255),
  body TEXT,
  data JSONB,
  success BOOLEAN,
  error TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- User Preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization Settings
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Features

### Device Authentication
- Each device gets a unique device ID
- Device sessions are tracked and can be revoked
- Biometric authentication with secure hash storage

### API Security
- JWT with device binding
- Rate limiting per device
- CORS configuration for mobile apps
- Request validation and sanitization

### Data Protection
- Encrypted push notification tokens
- Secure sync token generation
- Version-based conflict resolution
- Audit logging for sensitive operations

## Performance Optimizations

### Mobile Network Optimization
- Compressed API responses
- Minimal data transfer
- Efficient pagination
- Image compression and optimization

### Caching Strategy
- Redis integration for session storage
- Client-side caching headers
- Sync token-based cache invalidation

### Database Optimization
- Optimized queries for mobile data patterns
- Efficient indexing for sync operations
- Connection pooling and query optimization

## Monitoring and Analytics

### Logging
- Structured JSON logging
- Mobile-specific log fields
- Performance metrics tracking
- Error tracking and alerting

### Health Checks
- `/health` endpoint for service monitoring
- Database connectivity checks
- External service status monitoring
- Performance metrics collection

## Deployment

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3006
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  mdk-server:
    build: .
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
```

### Production Considerations
- Use PM2 or similar process manager
- Configure reverse proxy (nginx)
- Set up SSL/TLS certificates
- Configure monitoring and alerting
- Regular database backups
- Log rotation and management

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details