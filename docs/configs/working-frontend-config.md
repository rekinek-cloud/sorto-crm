# Działająca Konfiguracja Frontend - Wzorzec

## 1. Next.js Configuration (packages/frontend/next.config.js)

```javascript
/** @type {import('next').NextConfig} */

// Determine basePath based on version  
const isV2 = process.env.NEXT_PUBLIC_APP_VERSION === '2.0.0-dev';
const isV1 = process.env.NEXT_PUBLIC_APP_VERSION === '1.0.0';

console.log('Next.js Config Loading:', {
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  isV1,
  isV2,
  message: isV1 ? 'Using basePath: /crm' : (isV2 ? 'Using basePath: /crm2' : 'No basePath')
});

const nextConfig = {
  // Set basePath based on version - disabled for nginx routing
  // ...(isV1 && { basePath: '/crm' }),
  // ...(isV2 && { basePath: '/crm2' }),
  
  // Set assetPrefix for static assets
  ...(isV1 && { assetPrefix: '/crm' }),
  ...(isV2 && { assetPrefix: '/crm2' }),
  
  // Handle trailing slashes consistently
  trailingSlash: true,
  
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip type checking during build to speed up
  typescript: {
    ignoreBuildErrors: false,
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

## 2. PostCSS Configuration (packages/frontend/postcss.config.js)

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## 3. Docker Compose V1 (docker-compose.v1.yml)

```yaml
  frontend-v1:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile.dev
    container_name: crm-frontend-v1
    ports:
      - "9025:9025"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://91.99.50.80/crm/api
      - NEXT_PUBLIC_APP_VERSION=1.0.0
      - NEXT_PUBLIC_ENVIRONMENT=production
      - WATCHPACK_POLLING=true
    volumes:
      - ./packages/frontend:/app
      - /app/node_modules
    restart: unless-stopped
    networks:
      - crm-v1-network
    command: npm run dev
```

## 4. Nginx Configuration (/etc/nginx/sites-available/all-apps)

```nginx
    # CRM V1 Frontend
    location /crm/ {
        proxy_pass http://127.0.0.1:9025/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /crm;
    }

    # CRM V1 Next.js static assets
    location /crm/_next/ {
        proxy_pass http://127.0.0.1:9025/_next/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
```

## 5. Backend Configuration (packages/backend/src/app.ts)

```typescript
// WAŻNE: AI routes tymczasowo wyłączone ze względu na problem z openaiService
// import aiRoutes from './routes/ai';
// apiRouter.use('/ai', aiRoutes);
```

## Kluczowe Zasady

1. **Next.js bez basePath** - nginx obsługuje routing
2. **assetPrefix zachowany** - dla static assets (_next/)
3. **PostCSS w formacie object** - nie array
4. **NODE_ENV=development** - dla dev mode
5. **trailingSlash: true** - obsługa URL z slash
6. **nginx proxy_pass bez duplikacji** - przekazuje na root kontenera
7. **X-Forwarded-Prefix header** - informuje Next.js o prefix

## Aplikacja działa pod:
- Frontend: `http://91.99.50.80/crm/`
- API: `http://91.99.50.80/crm/api/v1/`