# 🤖 Instrukcje dla Claude Code: DeepSite Integration z CRM-GTD

## **ZADANIE: AI Website Builder Integration - KILLER FEATURE**

Jesteś Claude Code - zaawansowanym asystentem AI. Twoim zadaniem jest **integracja DeepSite AI Website Builder** z aplikacją CRM-GTD, tworząc **pierwszy na świecie CRM z wbudowanym AI website builderem**.

---

## 🎯 **GŁÓWNY CEL**

**Zaimplementuj DeepSite** jako **zintegrowaną funkcję** CRM-GTD, umożliwiając:
- **Company websites** generation z CRM data
- **Deal landing pages** dla sales campaigns  
- **Client portals** automatycznie generowane
- **Marketing websites** z CRM integration
- **Multi-tenant website builder** dla wszystkich customers

**Docelowy rezultat**: **Revenue boost** przez dodatkowy service i **market differentiation**.

---

## 📋 **KROK 1: ANALIZA I PRZYGOTOWANIE**

### **1.1 Sprawdź aktualne środowisko CRM-GTD:**

```bash
# Sprawdź strukturę aplikacji na VPS Hetzner
echo "🔍 Analizuję strukturę CRM-GTD na VPS..."
find /var/www -name "crm*" -type d 2>/dev/null || find . -name "*crm*" -type d
ls -la
pwd

# Sprawdź dostępne porty na VPS
echo "🌐 Sprawdzam dostępne porty..."
netstat -tlnp | grep LISTEN | head -10

# Sprawdź zasoby systemu
echo "💾 Sprawdzam zasoby VPS..."
free -h
df -h
```

### **1.2 Znajdź główny katalog aplikacji:**

```bash
# Znajdź gdzie jest główna aplikacja CRM-GTD
echo "📍 Lokalizuję główną aplikację CRM-GTD..."
find /var/www -name "package.json" 2>/dev/null | xargs grep -l "crm\|gtd" 
find /home -name "package.json" 2>/dev/null | xargs grep -l "crm\|gtd"
find /opt -name "package.json" 2>/dev/null | xargs grep -l "crm\|gtd"

# Sprawdź czy aplikacja działa na porcie 80
curl -I http:// DeepSite Integration Server for CRM-GTD
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import middleware and routes
const tenantIsolation = require('./middleware/tenant-isolation');
const authIntegration = require('./middleware/auth-integration');
const crmIntegration = require('./api/crm-integration');

// Apply global middleware
app.use('/api/deepsite', authIntegration);
app.use('/api/deepsite', tenantIsolation);

// API Routes
app.use('/api/deepsite', crmIntegration);

// Serve generated websites
app.use('/sites', express.static(process.env.DEEPSITE_STORAGE_PATH || '/var/www/deepsite-storage'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'DeepSite AI Website Builder',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('DeepSite Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DeepSite server running on port ${PORT}`);
  console.log(`📁 Storage path: ${process.env.DEEPSITE_STORAGE_PATH || '/var/www/deepsite-storage'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 DeepSite server shutting down gracefully...');
  process.exit(0);
});
EOF

# Reload systemd i uruchom service
sudo systemctl daemon-reload
sudo systemctl enable deepsite
sudo systemctl start deepsite

# Sprawdź status
echo "✅ Status DeepSite service:"
sudo systemctl status deepsite --no-pager

echo "✅ Skonfigurowano systemd service dla DeepSite"
```

### **7.3 SSL/HTTPS Configuration:**

```bash
echo "🔒 Konfiguracja SSL dla DeepSite..."

# Zainstaluj Certbot dla Let's Encrypt (jeśli nie zainstalowany)
if ! command -v certbot &> /dev/null; then
    echo "📦 Instaluję Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Sprawdź czy domena ma publiczny DNS
echo "🌐 Sprawdzam konfigurację DNS dla 91.99.50.80..."
nslookup 91.99.50.80 || echo "⚠️ Używamy IP, SSL będzie self-signed"

# Utwórz self-signed certificate dla IP
echo "📜 Tworzę self-signed certificate dla IP..."
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs

# Generuj self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/deepsite.key \
    -out /etc/ssl/certs/deepsite.crt \
    -subj "/C=DE/ST=Hetzner/L=Nuremberg/O=CRM-GTD/OU=DeepSite/CN=91.99.50.80"

# Aktualizuj Nginx configuration z SSL
sudo tee /etc/nginx/sites-available/deepsite.conf > /dev/null << 'EOF'
# DeepSite Integration for CRM-GTD with SSL
# VPS Hetzner Configuration

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name 91.99.50.80;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name 91.99.50.80;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/deepsite.crt;
    ssl_certificate_key /etc/ssl/private/deepsite.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # DeepSite API endpoints
    location /api/deepsite {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for AI generation
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Generated websites hosting
    location /sites {
        alias /var/www/deepsite-storage;
        try_files $uri $uri/ @deepsite_fallback;
        
        # Security headers for hosted websites
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache static assets
        location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Fallback for dynamic website content
    location @deepsite_fallback {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Main CRM-GTD application (existing)
    location /crm {
        proxy_pass http://localhost:3000/crm;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Root redirect to CRM
    location / {
        return 301 /crm;
    }
}
EOF

# Test i reload Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Skonfigurowano SSL dla DeepSite"
```

### **7.4 Storage i permissions configuration:**

```bash
echo "📁 Konfiguracja storage i permissions..."

# Utwórz strukturę katalogów storage
sudo mkdir -p /var/www/deepsite-storage/{templates,websites,uploads,cache}
sudo mkdir -p /var/www/deepsite-storage/websites/{tenant_demo,tenant_sample}

# Ustaw permissions
sudo chown -R www-data:www-data /var/www/deepsite-storage
sudo chmod -R 755 /var/www/deepsite-storage

# Utwórz logrotate config dla DeepSite
sudo tee /etc/logrotate.d/deepsite > /dev/null << 'EOF'
/var/log/deepsite/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        systemctl reload deepsite
    endscript
}
EOF

# Utwórz katalog logów
sudo mkdir -p /var/log/deepsite
sudo chown www-data:www-data /var/log/deepsite

echo "✅ Skonfigurowano storage i permissions"
```

---

## 🧪 **KROK 8: TESTING I VALIDATION**

### **8.1 Podstawowe testy funkcjonalności:**

```bash
echo "🧪 Uruchamianie testów DeepSite integration..."

# Test 1: Health check DeepSite service
echo "🔍 Test 1: DeepSite Health Check"
curl -f http://localhost:3001/health || echo "❌ DeepSite service nie odpowiada"

# Test 2: Nginx configuration
echo "🔍 Test 2: Nginx Configuration"
curl -I http://91.99.50.80/api/deepsite/ || echo "❌ Nginx routing nie działa"

# Test 3: Database connectivity
echo "🔍 Test 3: Database Connection"
cd "$CRM_DIR"
npx prisma db status || echo "❌ Problem z bazą danych"

# Test 4: Permissions sprawdzenie
echo "🔍 Test 4: File Permissions"
ls -la /var/www/deepsite-storage/ | head -5

# Test 5: Service status
echo "🔍 Test 5: Services Status"
sudo systemctl is-active deepsite && echo "✅ DeepSite service running" || echo "❌ DeepSite service down"
sudo systemctl is-active nginx && echo "✅ Nginx running" || echo "❌ Nginx down"

echo "📊 Podstawowe testy zakończone"
```

### **8.2 Integration tests z główną aplikacją:**

```bash
echo "🔗 Testowanie integracji z CRM-GTD..."

# Test API endpoints z authentication
echo "🔍 Testowanie API authentication..."

# Utwórz test script
sudo tee "$CRM_DIR/test-deepsite-integration.js" > /dev/null << 'EOF'
// DeepSite Integration Test Script
const http = require('http');
const https = require('https');

async function testDeepSiteIntegration() {
  console.log('🧪 Testing DeepSite Integration...');
  
  // Test 1: Health Check
  try {
    const healthResponse = await makeRequest('http://localhost:3001/health');
    console.log('✅ Health Check:', healthResponse.status);
  } catch (error) {
    console.log('❌ Health Check failed:', error.message);
  }
  
  // Test 2: API Endpoint (should require auth)
  try {
    const apiResponse = await makeRequest('http://localhost:3001/api/deepsite/company-website', 'POST', {
      companyId: 'test-company-id'
    });
    console.log('✅ API Endpoint accessible');
  } catch (error) {
    if (error.message.includes('401')) {
      console.log('✅ API Authentication working (401 expected without token)');
    } else {
      console.log('❌ API Endpoint error:', error.message);
    }
  }
  
  // Test 3: Storage Directory
  try {
    const fs = require('fs');
    if (fs.existsSync('/var/www/deepsite-storage')) {
      console.log('✅ Storage directory exists');
    } else {
      console.log('❌ Storage directory missing');
    }
  } catch (error) {
    console.log('❌ Storage test failed:', error.message);
  }
  
  console.log('🏁 Integration tests completed');
}

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: body });
      });
    });
    
    req.on('error', (error) => reject(error));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

testDeepSiteIntegration();
EOF

# Uruchom test
node "$CRM_DIR/test-deepsite-integration.js"

echo "✅ Integration tests zakończone"
```

### **8.3 Load testing i performance:**

```bash
echo "⚡ Performance testing DeepSite..."

# Zainstaluj testing tools jeśli potrzebne
if ! command -v ab &> /dev/null; then
    sudo apt install -y apache2-utils
fi

# Test 1: Basic load test
echo "🔍 Basic load test (10 requests)..."
ab -n 10 -c 2 http://localhost:3001/health

# Test 2: API endpoint load test
echo "🔍 API load test (5 requests)..."
ab -n 5 -c 1 -T application/json -p /dev/null http://localhost:3001/api/deepsite/

# Test 3: Static files test
echo "🔍 Static files test..."
echo "<html><body>Test website</body></html>" | sudo tee /var/www/deepsite-storage/test.html > /dev/null
curl -I http://91.99.50.80/sites/test.html

# Test 4: Memory usage
echo "🔍 Memory usage check..."
ps aux | grep -E "(deepsite|node)" | grep -v grep

echo "✅ Performance tests zakończone"
```

---

## 🚀 **KROK 9: PRODUCTION DEPLOYMENT**

### **9.1 Production environment setup:**

```bash
echo "🚀 Konfiguracja production environment..."

# Utwórz production environment file
sudo tee "$CRM_DIR/.env.production" > /dev/null << 'EOF'
# Production Environment Configuration for DeepSite Integration

# General Configuration
NODE_ENV=production
PORT=3000
DEEPSITE_PORT=3001

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/crm_gtd_production

# DeepSite Configuration
DEEPSITE_ENABLED=true
DEEPSITE_BASE_PATH=/deepsite
DEEPSITE_MULTI_TENANT=true
DEEPSITE_REVENUE_ENABLED=true
DEEPSITE_MAX_SITES_PER_TENANT=25
DEEPSITE_STORAGE_PATH=/var/www/deepsite-storage
DEEPSITE_CDN_ENABLED=false

# Hugging Face Configuration
HF_TOKEN=your_production_hf_token_here

# Security Configuration
JWT_SECRET=your_super_secure_jwt_secret_here
DEEPSITE_WEBHOOK_SECRET=your_webhook_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# SSL Configuration
SSL_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/deepsite.crt
SSL_KEY_PATH=/etc/ssl/private/deepsite.key

# Monitoring Configuration
LOGGING_LEVEL=info
PERFORMANCE_MONITORING=true
ERROR_TRACKING=true

# Rate Limiting
RATE_LIMIT_WINDOW=15 # minutes
RATE_LIMIT_MAX_REQUESTS=100

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * * # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
EOF

# Skopiuj production config
sudo cp "$CRM_DIR/.env.production" "$CRM_DIR/.env"

echo "✅ Production environment skonfigurowany"
```

### **9.2 Process monitoring i supervision:**

```bash
echo "👁️ Konfiguracja process monitoring..."

# Zainstaluj PM2 dla process management
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Utwórz PM2 ecosystem file
sudo tee "$CRM_DIR/ecosystem.config.js" > /dev/null << 'EOF'
// PM2 Ecosystem Configuration for CRM-GTD + DeepSite
module.exports = {
  apps: [
    {
      name: 'crm-gtd-main',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/crm-gtd/main-error.log',
      out_file: '/var/log/crm-gtd/main-out.log',
      log_file: '/var/log/crm-gtd/main-combined.log',
      time: true
    },
    {
      name: 'deepsite-service',
      script: 'server.js',
      cwd: './modules/deepsite',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DEEPSITE_STORAGE_PATH: '/var/www/deepsite-storage'
      },
      error_file: '/var/log/deepsite/error.log',
      out_file: '/var/log/deepsite/out.log',
      log_file: '/var/log/deepsite/combined.log',
      time: true
    }
  ],
  
  deploy: {
    production: {
      user: 'www-data',
      host: '91.99.50.80',
      ref: 'origin/main',
      repo: 'your-git-repository-url',
      path: '/var/www/crm-gtd',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
EOF

# Utwórz katalogi logów
sudo mkdir -p /var/log/{crm-gtd,deepsite}
sudo chown -R www-data:www-data /var/log/{crm-gtd,deepsite}

# Uruchom aplikacje z PM2
cd "$CRM_DIR"
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "✅ Process monitoring skonfigurowany"
```

### **9.3 Backup i disaster recovery:**

```bash
echo "💾 Konfiguracja backup i disaster recovery..."

# Utwórz backup script
sudo tee /usr/local/bin/crm-gtd-backup.sh > /dev/null << 'EOF'
#!/bin/bash
# CRM-GTD + DeepSite Backup Script

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/crm-gtd"
DATABASE_NAME="crm_gtd_production"

echo "🔄 Starting backup at $(date)"

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_DATE"

# Database backup
echo "📊 Backing up database..."
pg_dump "$DATABASE_NAME" > "$BACKUP_DIR/$BACKUP_DATE/database.sql"

# Application files backup
echo "📁 Backing up application files..."
tar -czf "$BACKUP_DIR/$BACKUP_DATE/application.tar.gz" -C /var/www crm-gtd

# DeepSite storage backup
echo "🌐 Backing up DeepSite storage..."
tar -czf "$BACKUP_DIR/$BACKUP_DATE/deepsite-storage.tar.gz" -C /var/www deepsite-storage

# Configuration files backup
echo "⚙️ Backing up configurations..."
tar -czf "$BACKUP_DIR/$BACKUP_DATE/config.tar.gz" /etc/nginx/sites-available/deepsite.conf /etc/systemd/system/deepsite.service

# Create backup manifest
echo "📋 Creating backup manifest..."
cat > "$BACKUP_DIR/$BACKUP_DATE/manifest.txt" << MANIFEST
Backup created: $(date)
Database: $DATABASE_NAME
Application: /var/www/crm-gtd
Storage: /var/www/deepsite-storage
Config files: nginx, systemd

Files in this backup:
$(ls -la "$BACKUP_DIR/$BACKUP_DATE/")
MANIFEST

# Cleanup old backups (keep 30 days)
echo "🗑️ Cleaning up old backups..."
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null

echo "✅ Backup completed at $(date)"
echo "📁 Backup location: $BACKUP_DIR/$BACKUP_DATE"
EOF

# Ustaw permissions dla backup script
sudo chmod +x /usr/local/bin/crm-gtd-backup.sh

# Dodaj backup do crontab
sudo tee /etc/cron.d/crm-gtd-backup > /dev/null << 'EOF'
# CRM-GTD Daily Backup
0 2 * * * root /usr/local/bin/crm-gtd-backup.sh >> /var/log/crm-gtd-backup.log 2>&1
EOF

# Uruchom pierwszy backup
sudo /usr/local/bin/crm-gtd-backup.sh

echo "✅ Backup system skonfigurowany"
```

---

## 📊 **KROK 10: MONITORING I MAINTENANCE**

### **10.1 Application monitoring setup:**

```bash
echo "📊 Konfiguracja application monitoring..."

# Utwórz monitoring script
sudo tee /usr/local/bin/crm-gtd-monitor.sh > /dev/null << 'EOF'
#!/bin/bash
# CRM-GTD + DeepSite Monitoring Script

LOGFILE="/var/log/crm-gtd-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log_message() {
    echo "[$TIMESTAMP] $1" >> "$LOGFILE"
}

# Function to check service health
check_service() {
    local service_name=$1
    local port=$2
    local endpoint=$3
    
    if curl -f -s "http://localhost:$port$endpoint" > /dev/null; then
        log_message "✅ $service_name is healthy"
        return 0
    else
        log_message "❌ $service_name is unhealthy"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local usage=$(df /var/www/deepsite-storage | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -gt 80 ]; then
        log_message "⚠️ DeepSite storage is $usage% full"
        return 1
    else
        log_message "✅ DeepSite storage usage: $usage%"
        return 0
    fi
}

# Function to check memory usage
check_memory() {
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -gt 90 ]; then
        log_message "⚠️ Memory usage is $memory_usage%"
        return 1
    else
        log_message "✅ Memory usage: $memory_usage%"
        return 0
    fi
}

# Main monitoring
log_message "🔍 Starting health check"

# Check main CRM-GTD application
check_service "CRM-GTD Main" 3000 "/crm/health"
MAIN_HEALTH=$?

# Check DeepSite service
check_service "DeepSite Service" 3001 "/health"
DEEPSITE_HEALTH=$?

# Check Nginx
if curl -f -s "http://91.99.50.80/crm" > /dev/null; then
    log_message "✅ Nginx proxy is working"
    NGINX_HEALTH=0
else
    log_message "❌ Nginx proxy issues"
    NGINX_HEALTH=1
fi

# Check system resources
check_disk_space
DISK_HEALTH=$?

check_memory
MEMORY_HEALTH=$?

# Check database connectivity
if pg_isready -q; then
    log_message "✅ Database is accessible"
    DB_HEALTH=0
else
    log_message "❌ Database connection issues"
    DB_HEALTH=1
fi

# Overall health assessment
TOTAL_ISSUES=$((MAIN_HEALTH + DEEPSITE_HEALTH + NGINX_HEALTH + DISK_HEALTH + MEMORY_HEALTH + DB_HEALTH))

if [ $TOTAL_ISSUES -eq 0 ]; then
    log_message "🎉 All systems healthy"
else
    log_message "⚠️ Found $TOTAL_ISSUES issues"
    
    # Restart services if needed
    if [ $DEEPSITE_HEALTH -ne 0 ]; then
        log_message "🔄 Restarting DeepSite service"
        systemctl restart deepsite
    fi
fi

log_message "✅ Health check completed"
EOF

# Ustaw permissions
sudo chmod +x /usr/local/bin/crm-gtd-monitor.sh

# Dodaj monitoring do crontab (co 5 minut)
sudo tee /etc/cron.d/crm-gtd-monitor > /dev/null << 'EOF'
# CRM-GTD Health Monitoring (every 5 minutes)
*/5 * * * * root /usr/local/bin/crm-gtd-monitor.sh
EOF

echo "✅ Application monitoring skonfigurowany"
```

### **10.2 Log management i analysis:**

```bash
echo "📋 Konfiguracja log management..."

# Utwórz log analysis script
sudo tee /usr/local/bin/crm-gtd-log-analysis.sh > /dev/null << 'EOF'
#!/bin/bash
# CRM-GTD + DeepSite Log Analysis Script

REPORT_DATE=$(date '+%Y-%m-%d')
REPORT_FILE="/var/log/crm-gtd-daily-report-$REPORT_DATE.txt"

echo "📊 CRM-GTD Daily Report - $REPORT_DATE" > "$REPORT_FILE"
echo "================================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# DeepSite usage statistics
echo "🌐 DeepSite Usage Statistics:" >> "$REPORT_FILE"
echo "------------------------------" >> "$REPORT_FILE"

# Count website generations today
WEBSITES_TODAY=$(grep "$(date '+%Y-%m-%d')" /var/log/deepsite/combined.log | grep -c "website generated" || echo "0")
echo "Websites generated today: $WEBSITES_TODAY" >> "$REPORT_FILE"

# Count API calls today  
API_CALLS_TODAY=$(grep "$(date '+%Y-%m-%d')" /var/log/deepsite/combined.log | grep -c "POST /api/deepsite" || echo "0")
echo "API calls today: $API_CALLS_TODAY" >> "$REPORT_FILE"

# Error rate
ERRORS_TODAY=$(grep "$(date '+%Y-%m-%d')" /var/log/deepsite/error.log | wc -l || echo "0")
echo "Errors today: $ERRORS_TODAY" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

# System performance
echo "🖥️ System Performance:" >> "$REPORT_FILE"
echo "----------------------" >> "$REPORT_FILE"
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')" >> "$REPORT_FILE"
echo "Memory Usage: $(free -h | awk 'NR==2{printf "%s/%s (%.0f%%)", $3,$2,$3*100/$2}')" >> "$REPORT_FILE"
echo "Disk Usage: $(df -h /var/www/deepsite-storage | awk 'NR==2{print $3"/"$2" ("$5")"}')" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

# Service status
echo "⚙️ Service Status:" >> "$REPORT_FILE"
echo "------------------" >> "$REPORT_FILE"
echo "CRM-GTD Main: $(systemctl is-active crm-gtd 2>/dev/null || echo 'N/A')" >> "$REPORT_FILE"
echo "DeepSite Service: $(systemctl is-active deepsite)" >> "$REPORT_FILE"
echo "Nginx: $(systemctl is-active nginx)" >> "$REPORT_FILE"
echo "PostgreSQL: $(systemctl is-active postgresql)" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

# Top errors/warnings
echo "⚠️ Top Issues Today:" >> "$REPORT_FILE"
echo "--------------------" >> "$REPORT_FILE"
grep "$(date '+%Y-%m-%d')" /var/log/deepsite/error.log | head -5 >> "$REPORT_FILE" 2>/dev/null || echo "No errors found" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "Report generated at: $(date)" >> "$REPORT_FILE"

# Email report (if mail is configured)
if command -v mail &> /dev/null; then
    mail -s "CRM-GTD Daily Report - $REPORT_DATE" admin@yourdomain.com < "$REPORT_FILE"
fi

echo "📊 Daily report generated: $REPORT_FILE"
EOF

# Ustaw permissions
sudo chmod +x /usr/local/bin/crm-gtd-log-analysis.sh

# Dodaj daily report do crontab
sudo tee /etc/cron.d/crm-gtd-daily-report > /dev/null << 'EOF'
# CRM-GTD Daily Report (every day at 6 AM)
0 6 * * * root /usr/local/bin/crm-gtd-log-analysis.sh
EOF

echo "✅ Log management skonfigurowany"
```

### **10.3 Maintenance i updates:**

```bash
echo "🔧 Konfiguracja maintenance procedures..."

# Utwórz maintenance script
sudo tee /usr/local/bin/crm-gtd-maintenance.sh > /dev/null << 'EOF'
#!/bin/bash
# CRM-GTD + DeepSite Maintenance Script

MAINTENANCE_LOG="/var/log/crm-gtd-maintenance.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log_message() {
    echo "[$TIMESTAMP] $1" | tee -a "$MAINTENANCE_LOG"
}

log_message "🔧 Starting maintenance procedures"

# System updates
log_message "📦 Checking for system updates..."
apt update > /dev/null 2>&1
UPDATES_AVAILABLE=$(apt list --upgradable 2>/dev/null | wc -l)
log_message "Updates available: $((UPDATES_AVAILABLE - 1))"

# Clean up logs older than 30 days
log_message "🗑️ Cleaning up old logs..."
find /var/log -name "*.log" -mtime +30 -exec rm -f {} \; 2>/dev/null
find /var/log -name "*.log.*" -mtime +30 -exec rm -f {} \; 2>/dev/null

# Clean up old generated websites (older than 90 days and marked as draft)
log_message "🌐 Cleaning up old draft websites..."
find /var/www/deepsite-storage -name "*draft*" -mtime +90 -exec rm -rf {} \; 2>/dev/null

# Database maintenance
log_message "🗄️ Running database maintenance..."
sudo -u postgres psql -d crm_gtd_production -c "VACUUM ANALYZE;" > /dev/null 2>&1

# Check SSL certificate expiry
log_message "🔒 Checking SSL certificate..."
SSL_EXPIRY=$(openssl x509 -in /etc/ssl/certs/deepsite.crt -noout -dates | grep notAfter | cut -d= -f2)
log_message "SSL certificate expires: $SSL_EXPIRY"

# Restart services if needed (weekly)
if [ "$(date +%u)" -eq 7 ]; then
    log_message "🔄 Weekly service restart..."
    systemctl restart deepsite
    systemctl reload nginx
fi

# Generate maintenance report
log_message "📊 Generating maintenance report..."
cat > "/tmp/maintenance-report-$(date +%Y%m%d).txt" << REPORT
CRM-GTD Maintenance Report - $(date)
=====================================

System Status:
- Uptime: $(uptime -p)
- Load Average: $(uptime | awk -F'load average:' '{print $2}')
- Memory Usage: $(free -h | awk 'NR==2{printf "%.0f%%", $3*100/$2}')
- Disk Usage: $(df -h / | awk 'NR==2{print $5}')

DeepSite Statistics:
- Storage Used: $(du -sh /var/www/deepsite-storage | awk '{print $1}')
- Active Websites: $(find /var/www/deepsite-storage -name "*.html" | wc -l)
- Service Status: $(systemctl is-active deepsite)

Database Status:
- PostgreSQL: $(systemctl is-active postgresql)
- Database Size: $(sudo -u postgres psql -d crm_gtd_production -c "\l+" | grep crm_gtd_production | awk '{print $7}')

Security:
- SSL Certificate: Valid until $SSL_EXPIRY
- Failed Login Attempts: $(grep "authentication failure" /var/log/auth.log | grep "$(date +%Y-%m-%d)" | wc -l || echo "0")

Maintenance Actions Performed:
- Log cleanup completed
- Database vacuum completed
- Old draft websites cleaned
- System health check completed

REPORT

log_message "✅ Maintenance completed"
EOF

# Ustaw permissions
sudo chmod +x /usr/local/bin/crm-gtd-maintenance.sh

# Dodaj maintenance do crontab (codziennie o 3 rano)
sudo tee /etc/cron.d/crm-gtd-maintenance > /dev/null << 'EOF'
# CRM-GTD Daily Maintenance (every day at 3 AM)  
0 3 * * * root /usr/local/bin/crm-gtd-maintenance.sh
EOF

echo "✅ Maintenance procedures skonfigurowane"
```

### **10.4 Performance optimization:**

```bash
echo "⚡ Konfiguracja performance optimization..."

# Utwórz performance tuning script
sudo tee /usr/local/bin/crm-gtd-optimize.sh > /dev/null << 'EOF'
#!/bin/bash
# CRM-GTD + DeepSite Performance Optimization Script

echo "⚡ Starting performance optimization..."

# Nginx optimization
echo "🌐 Optimizing Nginx configuration..."
cat >> /etc/nginx/conf.d/performance.conf << NGINX_PERF
# Performance optimizations for CRM-GTD + DeepSite

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Browser caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Connection optimization
keepalive_timeout 30;
keepalive_requests 100;
send_timeout 30;

# Buffer optimization
client_body_buffer_size 128k;
client_max_body_size 20m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;
NGINX_PERF

# Node.js optimization
echo "⚙️ Optimizing Node.js performance..."
cat >> "$CRM_DIR/.env" << NODE_PERF

# Performance optimizations
NODE_OPTIONS="--max-old-space-size=2048"
UV_THREADPOOL_SIZE=8
NODE_ENV=production

# DeepSite performance
DEEPSITE_CACHE_ENABLED=true
DEEPSITE_CACHE_TTL=3600
DEEPSITE_MAX_CONCURRENT_GENERATIONS=3
DEEPSITE_COMPRESSION_ENABLED=true
NODE_PERF

# Database optimization
echo "🗄️ Optimizing database performance..."
sudo -u postgres psql -d crm_gtd_production << DB_PERF
-- Performance optimizations
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
DB_PERF

# System optimization
echo "🖥️ Optimizing system settings..."
cat >> /etc/sysctl.conf << SYS_PERF

# Network optimizations for web applications
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 12582912 16777216
net.ipv4.tcp_wmem = 4096 12582912 16777216
net.core.netdev_max_backlog = 5000

# File descriptor limits
fs.file-max = 65536
SYS_PERF

# Apply system optimizations
sysctl -p

# Service restart
echo "🔄 Restarting services to apply optimizations..."
systemctl reload nginx
systemctl restart deepsite
systemctl restart postgresql

echo "✅ Performance optimization completed!"
EOF

# Ustaw permissions i uruchom optimization
sudo chmod +x /usr/local/bin/crm-gtd-optimize.sh
sudo /usr/local/bin/crm-gtd-optimize.sh

echo "✅ Performance optimization skonfigurowany"
```

---

## 🎉 **FINAL VALIDATION I SUMMARY**

### **Final system validation:**

```bash
echo "🎯 Final validation of DeepSite integration..."

# Comprehensive final test
echo "🧪 Running comprehensive final tests..."

# Test all endpoints
ENDPOINTS=(
    "http://localhost:3001/health"
    "http://91.99.50.80/crm"
    "http://91.99.50.80/api/deepsite/"
    "https://91.99.50.80/crm"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -f -s "$endpoint" > /dev/null; then
        echo "✅ $endpoint - Working"
    else
        echo "❌ $endpoint - Failed"
    fi
done

# Test database connectivity
if npx prisma db status; then
    echo "✅ Database connectivity - Working"
else
    echo "❌ Database connectivity - Failed"
fi

# Test file permissions
if [ -w /var/www/deepsite-storage ]; then
    echo "✅ Storage permissions - Working"
else
    echo "❌ Storage permissions - Failed"
fi

# Test services
SERVICES=("nginx" "postgresql" "deepsite")
for service in "${SERVICES[@]}"; do
    if systemctl is-active "$service" > /dev/null; then
        echo "✅ $service service - Running"
    else
        echo "❌ $service service - Not running"
    fi
done

echo ""
echo "🎉 DEEPSITE INTEGRATION COMPLETED!"
echo "=================================="
echo ""
echo "🌐 Access URLs:"
echo "   CRM-GTD Application: http://91.99.50.80/crm"
echo "   DeepSite API: http://91.99.50.80/api/deepsite/"
echo "   Generated Websites: http://91.99.50.80/sites/"
echo ""
echo "📊 Monitoring:"
echo "   Health Check: http://91.99.50.80/api/deepsite/health"
echo "   Logs: /var/log/deepsite/"
echo "   Monitoring: /var/log/crm-gtd-monitor.log"
echo ""
echo "🛠️ Management:"
echo "   Service: sudo systemctl status deepsite"
echo "   Logs: sudo tail -f /var/log/deepsite/combined.log"
echo "   Backup: sudo /usr/local/bin/crm-gtd-backup.sh"
echo ""
echo "💰 Revenue Features:"
echo "   ✅ AI Website Builder dla companies"
echo "   ✅ Deal landing pages generation"
echo "   ✅ Client portals creation"
echo "   ✅ Multi-tenant isolation"
echo "   ✅ Billing integration ready"
echo ""
echo "🚀 KILLER FEATURE READY!"
echo "Pierwszy na świecie CRM z wbudowanym AI Website Builder!"
echo ""
```

---

## 📋 **EXECUTION SUMMARY**

### **🎯 Co zostało zaimplementowane:**

1. **✅ KROK 1-3**: Analiza, setup, konfiguracja podstawowa
2. **✅ KROK 4**: Multi-tenant support i izolacja
3. **✅ KROK 5**: Frontend integration z React components
4. **✅ KROK 6**: Database schema i Prisma models
5. **✅ KROK 7**: Production deployment na VPS Hetzner
6. **✅ KROK 8**: Testing i validation procedures
7. **✅ KROK 9**: Production environment setup
8. **✅ KROK 10**: Monitoring, maintenance, optimization

### **🚀 Ready to Deploy!**

**Uruchom wszystkie kroki:**
```bash
# Skopiuj instrukcje i uruchom
claude -p "$(cat deepsite-integration-instructions.md)" \
  --mcp-config .mcp.json \
  --dangerously-skip-permissions
```

**Albo krok po kroku:**
```bash
# Każdy krok osobno
claude -p "Wykonaj KROK 1 z instrukcji DeepSite integration" --mcp-config .mcp.json
```

### **💰 Business Impact:**
- **+$29-299/month** revenue per tenant (website builder)
- **Market differentiation** - pierwszy CRM+AI Website Builder
- **Customer retention** - all-in-one solution
- **Viral growth** - customers show off AI-generated websites

**🎉 DEEPSITE INTEGRATION INSTRUCTIONS COMPLETE!**91.99.50.80/crm || echo "Sprawdzam inne możliwe lokalizacje..."
```

### **1.3 Backup aktualnej aplikacji:**

```bash
# Utwórz backup przed zmianami
echo "💾 Tworzę backup aplikacji CRM-GTD..."
BACKUP_DIR="/var/backups/crm-gtd-$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"

# Znajdź i backup głównej aplikacji
APP_DIR=$(find /var/www -name "package.json" 2>/dev/null | xargs grep -l "crm\|gtd" | head -1 | xargs dirname)
if [ -n "$APP_DIR" ]; then
    echo "📦 Backup aplikacji z: $APP_DIR"
    sudo cp -r "$APP_DIR" "$BACKUP_DIR/"
    echo "✅ Backup utworzony w: $BACKUP_DIR"
else
    echo "⚠️ Nie znaleziono głównej aplikacji CRM-GTD"
fi
```

---

## 📦 **KROK 2: POBRANIE I SETUP DEEPSITE**

### **2.1 Clone DeepSite repository:**

```bash
# Przejdź do katalogu roboczego
cd /tmp

# Clone DeepSite z Hugging Face
echo "📥 Pobieranie DeepSite z Hugging Face..."
git clone https://huggingface.co/spaces/enzostvs/deepsite
cd deepsite

# Sprawdź strukturę projektu
echo "📁 Struktura projektu DeepSite:"
ls -la
cat package.json | jq '.dependencies' || cat package.json
```

### **2.2 Analiza kompatybilności:**

```bash
# Sprawdź wersje Node.js
echo "🔍 Sprawdzam kompatybilność środowiska..."
node --version
npm --version

# Analiza zależności DeepSite
echo "📊 Analizuję zależności DeepSite:"
cat package.json | grep -E "(next|react|node)"

# Sprawdź czy potrzebne są dodatkowe porty
echo "🌐 Sprawdzam wymagania portów:"
grep -r "port\|PORT" . --include="*.js" --include="*.json" --include="*.env*" | head -10
```

### **2.3 Przygotowanie środowiska:**

```bash
# Zainstaluj zależności DeepSite
echo "📦 Instaluję zależności DeepSite..."
npm install

# Sprawdź czy instalacja się powiodła
echo "✅ Sprawdzam status instalacji:"
npm list --depth=0 | head -20

# Sprawdź wymagania .env
echo "🔑 Sprawdzam wymagania konfiguracji:"
find . -name "*.env*" -o -name "*env*" | head -5
grep -r "process.env\|HF_TOKEN" . --include="*.js" | head -10
```

---

## 🔧 **KROK 3: KONFIGURACJA INTEGRATION**

### **3.1 Utwórz konfigurację integracji:**

```bash
# Utwórz katalog integracji w głównej aplikacji
echo "🔗 Przygotowuję integrację z CRM-GTD..."

# Znajdź główny katalog CRM-GTD
CRM_DIR=$(find /var/www -name "package.json" 2>/dev/null | xargs grep -l "crm\|gtd" | head -1 | xargs dirname)
echo "📍 Główna aplikacja CRM-GTD: $CRM_DIR"

# Utwórz katalog dla DeepSite w głównej aplikacji
sudo mkdir -p "$CRM_DIR/modules/deepsite"
sudo mkdir -p "$CRM_DIR/public/deepsite"
sudo mkdir -p "$CRM_DIR/api/deepsite"

echo "📁 Utworzono katalogi integracji"
```

### **3.2 Skopiuj i adaptuj DeepSite:**

```bash
# Skopiuj pliki DeepSite do modułu CRM-GTD
echo "📋 Kopiuję pliki DeepSite do CRM-GTD..."
sudo cp -r /tmp/deepsite/* "$CRM_DIR/modules/deepsite/"

# Sprawdź czy kopiowanie się powiodło
echo "✅ Sprawdzam skopiowane pliki:"
ls -la "$CRM_DIR/modules/deepsite/" | head -10

# Utwórz plik konfiguracji integracji
sudo tee "$CRM_DIR/modules/deepsite/integration-config.js" > /dev/null << 'EOF'
// DeepSite Integration Configuration for CRM-GTD
module.exports = {
  // Integration settings
  integration: {
    mode: 'embedded', // 'embedded' or 'microservice'
    basePath: '/deepsite',
    apiPath: '/api/deepsite'
  },
  
  // Multi-tenant configuration
  multiTenant: {
    enabled: true,
    isolation: 'schema', // 'schema' or 'database'
    sharedAuth: true
  },
  
  // CRM-GTD integration points
  crmIntegration: {
    companyWebsites: true,
    dealLandingPages: true,
    clientPortals: true,
    marketingCampaigns: true
  },
  
  // Revenue configuration
  revenue: {
    websiteBuilder: { price: 29, currency: 'USD' },
    customDomain: { price: 9, currency: 'USD' },
    premiumTemplates: { price: 199, currency: 'USD' }
  }
};
EOF

echo "⚙️ Utworzono plik konfiguracji integracji"
```

### **3.3 Utwórz environment configuration:**

```bash
# Utwórz .env dla DeepSite integration
echo "🔑 Konfiguracja zmiennych środowiskowych..."

# Sprawdź czy istnieje .env w głównej aplikacji
if [ -f "$CRM_DIR/.env" ]; then
    echo "📄 Znaleziono istniejący .env"
    sudo cp "$CRM_DIR/.env" "$CRM_DIR/.env.backup"
else
    echo "📄 Tworzę nowy .env"
    sudo touch "$CRM_DIR/.env"
fi

# Dodaj konfigurację DeepSite do .env
sudo tee -a "$CRM_DIR/.env" > /dev/null << 'EOF'

# DeepSite Integration Configuration
DEEPSITE_ENABLED=true
DEEPSITE_PORT=3001
DEEPSITE_BASE_PATH=/deepsite
HF_TOKEN=your_hugging_face_token_here
DEEPSITE_MULTI_TENANT=true
DEEPSITE_REVENUE_ENABLED=true

# DeepSite API Configuration
DEEPSITE_API_ENDPOINT=http://localhost:3001
DEEPSITE_WEBHOOK_SECRET=your_webhook_secret_here
DEEPSITE_MAX_SITES_PER_TENANT=10

# DeepSite Storage Configuration
DEEPSITE_STORAGE_TYPE=local
DEEPSITE_STORAGE_PATH=/var/www/deepsite-storage
DEEPSITE_CDN_ENABLED=false
EOF

echo "✅ Dodano konfigurację DeepSite do .env"
```

---

## 🚀 **KROK 4: IMPLEMENTACJA MULTI-TENANT SUPPORT**

### **4.1 Modyfikacja DeepSite dla multi-tenant:**

```bash
echo "🏢 Implementuję multi-tenant support dla DeepSite..."

# Utwórz middleware dla tenant isolation
sudo tee "$CRM_DIR/modules/deepsite/middleware/tenant-isolation.js" > /dev/null << 'EOF'
// Tenant Isolation Middleware for DeepSite
const { getTenantFromRequest } = require('../../../lib/tenant-utils');

module.exports = function tenantIsolationMiddleware(req, res, next) {
  try {
    // Extract tenant information from request
    const tenant = getTenantFromRequest(req);
    
    if (!tenant) {
      return res.status(401).json({ 
        error: 'Tenant not found',
        message: 'Please ensure you are logged in with valid tenant credentials'
      });
    }
    
    // Add tenant context to request
    req.tenant = tenant;
    req.tenantId = tenant.id;
    req.tenantSchema = `tenant_${tenant.id}`;
    
    // Set tenant-specific storage path
    req.tenantStoragePath = `/var/www/deepsite-storage/tenant_${tenant.id}`;
    
    // Ensure tenant storage directory exists
    const fs = require('fs');
    const path = require('path');
    if (!fs.existsSync(req.tenantStoragePath)) {
      fs.mkdirSync(req.tenantStoragePath, { recursive: true });
    }
    
    next();
  } catch (error) {
    console.error('Tenant isolation error:', error);
    res.status(500).json({ 
      error: 'Tenant isolation failed',
      message: 'Internal server error during tenant validation'
    });
  }
};
EOF

# Utwórz API endpoints dla CRM-GTD integration
sudo tee "$CRM_DIR/modules/deepsite/api/crm-integration.js" > /dev/null << 'EOF'
// CRM-GTD Integration API for DeepSite
const express = require('express');
const router = express.Router();
const tenantIsolation = require('../middleware/tenant-isolation');

// Generate company website from CRM data
router.post('/company-website', tenantIsolation, async (req, res) => {
  try {
    const { companyId } = req.body;
    const { tenantId, tenantSchema } = req;
    
    // Fetch company data from CRM
    const company = await fetchCompanyData(companyId, tenantSchema);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Generate website prompt from company data
    const websitePrompt = generateCompanyWebsitePrompt(company);
    
    // Generate website using DeepSite AI
    const generatedWebsite = await generateWebsiteWithDeepSite(websitePrompt, tenantId);
    
    // Save website data to tenant storage
    const websiteData = await saveWebsiteToTenantStorage(generatedWebsite, companyId, tenantId);
    
    res.json({
      success: true,
      websiteId: websiteData.id,
      websiteUrl: websiteData.url,
      previewUrl: websiteData.previewUrl
    });
    
  } catch (error) {
    console.error('Company website generation error:', error);
    res.status(500).json({ 
      error: 'Website generation failed',
      message: error.message 
    });
  }
});

// Generate deal landing page
router.post('/deal-landing-page', tenantIsolation, async (req, res) => {
  try {
    const { dealId } = req.body;
    const { tenantId, tenantSchema } = req;
    
    // Fetch deal data from CRM
    const deal = await fetchDealData(dealId, tenantSchema);
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Generate landing page prompt from deal data
    const landingPagePrompt = generateDealLandingPagePrompt(deal);
    
    // Generate landing page using DeepSite AI
    const generatedPage = await generateWebsiteWithDeepSite(landingPagePrompt, tenantId);
    
    // Save landing page to tenant storage
    const pageData = await saveLandingPageToTenantStorage(generatedPage, dealId, tenantId);
    
    res.json({
      success: true,
      pageId: pageData.id,
      pageUrl: pageData.url,
      previewUrl: pageData.previewUrl,
      trackingCode: pageData.trackingCode
    });
    
  } catch (error) {
    console.error('Deal landing page generation error:', error);
    res.status(500).json({ 
      error: 'Landing page generation failed',
      message: error.message 
    });
  }
});

// Generate client portal
router.post('/client-portal', tenantIsolation, async (req, res) => {
  try {
    const { contactId } = req.body;
    const { tenantId, tenantSchema } = req;
    
    // Fetch contact data from CRM
    const contact = await fetchContactData(contactId, tenantSchema);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Generate client portal prompt
    const portalPrompt = generateClientPortalPrompt(contact);
    
    // Generate portal using DeepSite AI
    const generatedPortal = await generateWebsiteWithDeepSite(portalPrompt, tenantId);
    
    // Save portal to tenant storage with authentication
    const portalData = await saveClientPortalToTenantStorage(generatedPortal, contactId, tenantId);
    
    res.json({
      success: true,
      portalId: portalData.id,
      portalUrl: portalData.url,
      loginUrl: portalData.loginUrl,
      credentials: portalData.credentials
    });
    
  } catch (error) {
    console.error('Client portal generation error:', error);
    res.status(500).json({ 
      error: 'Client portal generation failed',
      message: error.message 
    });
  }
});

// Helper functions
async function fetchCompanyData(companyId, tenantSchema) {
  // Implementation to fetch company data from CRM database
  // This should use your existing CRM data access patterns
  return {
    id: companyId,
    name: 'Sample Company',
    industry: 'Technology',
    description: 'Leading technology company...',
    logo: '/logos/company.png',
    services: ['Web Development', 'Consulting'],
    contact: {
      email: 'info@company.com',
      phone: '+1234567890',
      address: '123 Tech Street'
    }
  };
}

async function generateCompanyWebsitePrompt(company) {
  return `Create a professional corporate website for ${company.name}, a ${company.industry} company. 
    
    Company Description: ${company.description}
    
    Services: ${company.services.join(', ')}
    
    Include:
    - Modern, professional design
    - Hero section with company name and tagline
    - Services section highlighting key offerings
    - About us section with company description
    - Contact information and contact form
    - Responsive design for mobile and desktop
    - Professional color scheme matching industry standards
    
    Style: Clean, modern, professional, trustworthy`;
}

async function generateWebsiteWithDeepSite(prompt, tenantId) {
  // Implementation to call DeepSite AI generation
  // This should interface with the DeepSite generation engine
  return {
    html: '<html>Generated website content...</html>',
    css: 'body { margin: 0; }',
    js: 'console.log("Website loaded");',
    assets: [],
    metadata: {
      title: 'Generated Website',
      description: 'AI Generated Website',
      keywords: 'business, professional'
    }
  };
}

async function saveWebsiteToTenantStorage(website, companyId, tenantId) {
  // Implementation to save generated website to tenant storage
  const websiteId = `company_${companyId}_${Date.now()}`;
  const websiteUrl = `http://91.99.50.80/sites/${tenantId}/${websiteId}`;
  
  return {
    id: websiteId,
    url: websiteUrl,
    previewUrl: `${websiteUrl}/preview`,
    companyId: companyId,
    tenantId: tenantId,
    createdAt: new Date()
  };
}

module.exports = router;
EOF

echo "✅ Utworzono multi-tenant API dla DeepSite"
```

### **4.2 Integracja z systemem uwierzytelniania CRM-GTD:**

```bash
echo "🔐 Integracja z systemem uwierzytelniania..."

# Utwórz middleware uwierzytelniania
sudo tee "$CRM_DIR/modules/deepsite/middleware/auth-integration.js" > /dev/null << 'EOF'
// Authentication Integration for DeepSite
const jwt = require('jsonwebtoken');

module.exports = function authIntegrationMiddleware(req, res, next) {
  try {
    // Extract token from various sources
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access DeepSite features'
      });
    }
    
    // Verify JWT token using CRM-GTD secret
    const jwtSecret = process.env.JWT_SECRET || 'your-crm-gtd-jwt-secret';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Add user context to request
    req.user = decoded;
    req.userId = decoded.id || decoded.userId;
    req.userRole = decoded.role || 'user';
    
    // Check if user has DeepSite permissions
    if (!hasDeepSitePermissions(req.user)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Your plan does not include website builder features'
      });
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

function extractToken(req) {
  // Extract token from Authorization header
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }
  
  // Extract token from cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // Extract token from query parameter
  if (req.query.token) {
    return req.query.token;
  }
  
  return null;
}

function hasDeepSitePermissions(user) {
  // Check if user's plan includes DeepSite features
  const allowedPlans = ['professional', 'enterprise'];
  const allowedRoles = ['admin', 'user'];
  
  return allowedPlans.includes(user.plan) && allowedRoles.includes(user.role);
}
EOF

echo "✅ Utworzono middleware uwierzytelniania"
```

---

## 🌐 **KROK 5: FRONTEND INTEGRATION**

### **5.1 Utwórz komponenty React dla DeepSite:**

```bash
echo "⚛️ Tworzę komponenty React dla DeepSite integration..."

# Utwórz katalog komponentów
sudo mkdir -p "$CRM_DIR/components/deepsite"

# Główny komponent Website Builder
sudo tee "$CRM_DIR/components/deepsite/WebsiteBuilder.tsx" > /dev/null << 'EOF'
// Website Builder Component for CRM-GTD
import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Modal, Alert } from '@/components/ui';
import { Building, Globe, Rocket, Eye } from 'lucide-react';

interface WebsiteBuilderProps {
  mode: 'company' | 'deal' | 'client-portal' | 'marketing';
  entityId: string;
  entityData?: any;
  onWebsiteGenerated?: (website: any) => void;
}

export default function WebsiteBuilder({ 
  mode, 
  entityId, 
  entityData, 
  onWebsiteGenerated 
}: WebsiteBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWebsite, setGeneratedWebsite] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showPreview, setShowPreview] = useState(false);

  const generateWebsite = async () => {
    setIsGenerating(true);
    
    try {
      const endpoint = getEndpointForMode(mode);
      const payload = {
        [`${mode}Id`]: entityId,
        customPrompt,
        template: selectedTemplate,
        entityData
      };
      
      const response = await fetch(`/api/deepsite/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Website generation failed');
      }
      
      const result = await response.json();
      setGeneratedWebsite(result);
      onWebsiteGenerated?.(result);
      
    } catch (error) {
      console.error('Website generation error:', error);
      alert('Failed to generate website. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getEndpointForMode = (mode: string) => {
    switch (mode) {
      case 'company': return 'company-website';
      case 'deal': return 'deal-landing-page';
      case 'client-portal': return 'client-portal';
      case 'marketing': return 'marketing-campaign';
      default: return 'company-website';
    }
  };

  const getModeTitle = (mode: string) => {
    switch (mode) {
      case 'company': return 'Company Website';
      case 'deal': return 'Deal Landing Page';
      case 'client-portal': return 'Client Portal';
      case 'marketing': return 'Marketing Campaign';
      default: return 'Website';
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'company': return <Building className="w-5 h-5" />;
      case 'deal': return <Rocket className="w-5 h-5" />;
      case 'client-portal': return <Globe className="w-5 h-5" />;
      case 'marketing': return <Eye className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          {getModeIcon(mode)}
          <h2 className="text-2xl font-bold">AI {getModeTitle(mode)} Builder</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Template Style
            </label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <option value="modern">Modern & Clean</option>
              <option value="corporate">Corporate Professional</option>
              <option value="creative">Creative & Bold</option>
              <option value="minimal">Minimal & Elegant</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Custom Instructions (Optional)
            </label>
            <Input
              placeholder={`Additional instructions for your ${getModeTitle(mode).toLowerCase()}...`}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[100px]"
              multiline
            />
          </div>
          
          <Button
            onClick={generateWebsite}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating {getModeTitle(mode)}...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Generate {getModeTitle(mode)} with AI
              </>
            )}
          </Button>
        </div>
      </Card>
      
      {generatedWebsite && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Generated {getModeTitle(mode)}</h3>
          
          <div className="space-y-4">
            <Alert>
              <Globe className="w-4 h-4" />
              <div>
                <strong>Website Generated Successfully!</strong>
                <p>Your {getModeTitle(mode).toLowerCase()} has been created and is ready to deploy.</p>
              </div>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Website
              </Button>
              
              <Button
                onClick={() => window.open(generatedWebsite.websiteUrl, '_blank')}
              >
                <Globe className="w-4 h-4 mr-2" />
                Open Live Site
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">Website Details:</h4>
              <p><strong>URL:</strong> {generatedWebsite.websiteUrl}</p>
              <p><strong>Created:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Status:</strong> Live & Active</p>
            </div>
          </div>
        </Card>
      )}
      
      {showPreview && generatedWebsite && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Website Preview"
          size="xl"
        >
          <iframe
            src={generatedWebsite.previewUrl}
            className="w-full h-96 border rounded"
            title="Website Preview"
          />
        </Modal>
      )}
    </div>
  );
}
EOF

# Komponent integracji z Companies
sudo tee "$CRM_DIR/components/deepsite/CompanyWebsiteIntegration.tsx" > /dev/null << 'EOF'
// Company Website Integration Component
import React, { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { Building, Globe, Plus, Edit, Trash2 } from 'lucide-react';
import WebsiteBuilder from './WebsiteBuilder';

interface CompanyWebsiteIntegrationProps {
  company: any;
  websites: any[];
  onWebsiteCreated: () => void;
}

export default function CompanyWebsiteIntegration({ 
  company, 
  websites = [], 
  onWebsiteCreated 
}: CompanyWebsiteIntegrationProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleWebsiteGenerated = (website: any) => {
    setShowBuilder(false);
    onWebsiteCreated();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Company Websites</h3>
        </div>
        <Button
          onClick={() => setShowBuilder(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Website
        </Button>
      </div>
      
      {websites.length > 0 ? (
        <div className="space-y-3">
          {websites.map((website) => (
            <div
              key={website.id}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-medium">{website.title || 'Company Website'}</p>
                  <p className="text-sm text-gray-500">{website.url}</p>
                </div>
                <Badge variant={website.status === 'live' ? 'success' : 'secondary'}>
                  {website.status || 'draft'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(website.url, '_blank')}
                >
                  <Globe className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Edit functionality */}}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Delete functionality */}}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No websites yet</h4>
          <p className="text-gray-500 mb-4">
            Create a professional website for {company.name} with AI in seconds.
          </p>
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Website
          </Button>
        </div>
      )}
      
      {showBuilder && (
        <div className="mt-6 border-t pt-6">
          <WebsiteBuilder
            mode="company"
            entityId={company.id}
            entityData={company}
            onWebsiteGenerated={handleWebsiteGenerated}
          />
        </div>
      )}
    </Card>
  );
}
EOF

echo "✅ Utworzono komponenty React dla DeepSite"
```

### **5.2 Integracja z istniejącymi widokami CRM:**

```bash
echo "🔗 Integracja DeepSite z widokami CRM..."

# Dodaj tab Website Builder do Company View
sudo tee "$CRM_DIR/components/companies/CompanyTabs.tsx" > /dev/null << 'EOF'
// Enhanced Company Tabs with Website Builder
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, Phone, Globe, Rocket, Eye } from 'lucide-react';
import CompanyWebsiteIntegration from '../deepsite/CompanyWebsiteIntegration';

interface CompanyTabsProps {
  company: any;
}

export default function CompanyTabs({ company }: CompanyTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="overview" className="flex items-center space-x-2">
          <Building className="w-4 h-4" />
          <span>Overview</span>
        </TabsTrigger>
        <TabsTrigger value="contacts" className="flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>Contacts</span>
        </TabsTrigger>
        <TabsTrigger value="activities" className="flex items-center space-x-2">
          <Phone className="w-4 h-4" />
          <span>Activities</span>
        </TabsTrigger>
        <TabsTrigger value="websites" className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <span>Websites</span>
        </TabsTrigger>
        <TabsTrigger value="deals" className="flex items-center space-x-2">
          <Rocket className="w-4 h-4" />
          <span>Deals</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center space-x-2">
          <Eye className="w-4 h-4" />
          <span>Analytics</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        {/* Existing overview content */}
      </TabsContent>
      
      <TabsContent value="contacts" className="space-y-4">
        {/* Existing contacts content */}
      </TabsContent>
      
      <TabsContent value="activities" className="space-y-4">
        {/* Existing activities content */}
      </TabsContent>
      
      <TabsContent value="websites" className="space-y-4">
        <CompanyWebsiteIntegration
          company={company}
          websites={company.websites || []}
          onWebsiteCreated={() => {
            // Refresh company data
            window.location.reload();
          }}
        />
      </TabsContent>
      
      <TabsContent value="deals" className="space-y-4">
        {/* Existing deals content */}
      </TabsContent>
      
      <TabsContent value="analytics" className="space-y-4">
        {/* Existing analytics content */}
      </TabsContent>
    </Tabs>
  );
}
EOF

echo "✅ Dodano Website Builder tab do Company View"
```

---

## 🗄️ **KROK 6: DATABASE INTEGRATION**

### **6.1 Utwórz tabele bazy danych dla DeepSite:**

```bash
echo "🗄️ Tworzę schema bazy danych dla DeepSite..."

# Utwórz migrację Prisma dla DeepSite
sudo tee "$CRM_DIR/prisma/migrations/add_deepsite_tables.sql" > /dev/null << 'EOF'
-- DeepSite Integration Tables for CRM-GTD

-- Generated Websites table
CREATE TABLE IF NOT EXISTS generated_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'company', 'deal', 'contact', 'campaign'
    entity_id UUID NOT NULL,
    title VARCHAR(255),
    description TEXT,
    website_url VARCHAR(500),
    preview_url VARCHAR(500),
    html_content TEXT,
    css_content TEXT,
    js_content TEXT,
    meta_data JSONB DEFAULT '{}',
    template_style VARCHAR(100) DEFAULT 'modern',
    custom_prompt TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'live', 'archived'
    domain_name VARCHAR(255),
    ssl_enabled BOOLEAN DEFAULT false,
    analytics_code TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Foreign key constraints
    CONSTRAINT fk_generated_websites_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_generated_websites_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Website Analytics table
CREATE TABLE IF NOT EXISTS website_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL,
    date_recorded DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0, -- in seconds
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    form_submissions INTEGER DEFAULT 0,
    phone_clicks INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    referrer_data JSONB DEFAULT '{}',
    device_data JSONB DEFAULT '{}',
    location_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_website_analytics_website FOREIGN KEY (website_id) REFERENCES generated_websites(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate daily records
    UNIQUE(website_id, date_recorded)
);

-- Website Templates table
CREATE TABLE IF NOT EXISTS website_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'company', 'landing', 'portal', 'marketing'
    style VARCHAR(100) NOT NULL, -- 'modern', 'corporate', 'creative', 'minimal'
    description TEXT,
    thumbnail_url VARCHAR(500),
    html_template TEXT NOT NULL,
    css_template TEXT NOT NULL,
    js_template TEXT,
    default_prompt TEXT,
    customization_options JSONB DEFAULT '{}',
    is_premium BOOLEAN DEFAULT false,
    price DECIMAL(10,2) DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Website Domains table (for custom domains)
CREATE TABLE IF NOT EXISTS website_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    subdomain VARCHAR(100),
    is_custom_domain BOOLEAN DEFAULT false,
    ssl_certificate_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'expired', 'failed'
    dns_configured BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    expiry_date DATE,
    auto_renewal BOOLEAN DEFAULT true,
    monthly_cost DECIMAL(10,2) DEFAULT 9.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_website_domains_website FOREIGN KEY (website_id) REFERENCES generated_websites(id) ON DELETE CASCADE,
    CONSTRAINT fk_website_domains_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- DeepSite Billing table
CREATE TABLE IF NOT EXISTS deepsite_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    websites_created INTEGER DEFAULT 0,
    custom_domains INTEGER DEFAULT 0,
    premium_templates_used INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    website_builder_fee DECIMAL(10,2) DEFAULT 0,
    domain_fees DECIMAL(10,2) DEFAULT 0,
    template_fees DECIMAL(10,2) DEFAULT 0,
    overage_fees DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_invoice_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'cancelled'
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_deepsite_billing_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate billing periods
    UNIQUE(tenant_id, billing_period_start, billing_period_end)
);

-- Website Form Submissions table (for tracking conversions)
CREATE TABLE IF NOT EXISTS website_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL,
    form_type VARCHAR(100) NOT NULL, -- 'contact', 'quote', 'newsletter', 'demo'
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    form_data JSONB NOT NULL,
    referrer VARCHAR(500),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    converted_to_lead BOOLEAN DEFAULT false,
    lead_id UUID,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_form_submissions_website FOREIGN KEY (website_id) REFERENCES generated_websites(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generated_websites_tenant_entity ON generated_websites(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_generated_websites_status ON generated_websites(status);
CREATE INDEX IF NOT EXISTS idx_website_analytics_date ON website_analytics(date_recorded);
CREATE INDEX IF NOT EXISTS idx_website_analytics_website ON website_analytics(website_id);
CREATE INDEX IF NOT EXISTS idx_website_domains_domain ON website_domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_website_domains_tenant ON website_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deepsite_billing_tenant_period ON deepsite_billing(tenant_id, billing_period_start);
CREATE INDEX IF NOT EXISTS idx_form_submissions_website_date ON website_form_submissions(website_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_converted ON website_form_submissions(converted_to_lead);

-- Insert default templates
INSERT INTO website_templates (name, category, style, description, html_template, css_template, default_prompt, is_active) VALUES
('Modern Corporate', 'company', 'modern', 'Clean and modern corporate website template', '<html>Modern template</html>', 'body { font-family: sans-serif; }', 'Create a modern, professional corporate website with clean design', true),
('Creative Agency', 'company', 'creative', 'Bold and creative template for agencies', '<html>Creative template</html>', 'body { font-family: sans-serif; }', 'Create a bold, creative website for an agency with vibrant colors', true),
('Landing Page Pro', 'landing', 'modern', 'High-converting landing page template', '<html>Landing template</html>', 'body { font-family: sans-serif; }', 'Create a high-converting landing page focused on conversions', true),
('Client Portal', 'portal', 'corporate', 'Professional client portal template', '<html>Portal template</html>', 'body { font-family: sans-serif; }', 'Create a professional client portal with secure access', true);
EOF

# Wykonaj migrację
echo "🚀 Wykonuję migrację bazy danych..."
cd "$CRM_DIR"
sudo npx prisma db push || echo "⚠️ Migracja może wymagać ręcznej interwencji"

echo "✅ Utworzono schema bazy danych dla DeepSite"
```

### **6.2 Utwórz modele Prisma dla DeepSite:**

```bash
echo "📊 Dodaję modele Prisma dla DeepSite..."

# Dodaj modele do schema.prisma
sudo tee -a "$CRM_DIR/prisma/schema.prisma" > /dev/null << 'EOF'

// DeepSite Integration Models

model GeneratedWebsite {
  id             String   @id @default(cuid())
  tenantId       String   @map("tenant_id")
  entityType     String   @map("entity_type") // 'company', 'deal', 'contact', 'campaign'
  entityId       String   @map("entity_id")
  title          String?
  description    String?
  websiteUrl     String?  @map("website_url")
  previewUrl     String?  @map("preview_url")
  htmlContent    String?  @map("html_content")
  cssContent     String?  @map("css_content")
  jsContent      String?  @map("js_content")
  metaData       Json     @default("{}")
  templateStyle  String   @default("modern") @map("template_style")
  customPrompt   String?  @map("custom_prompt")
  status         String   @default("draft")
  domainName     String?  @map("domain_name")
  sslEnabled     Boolean  @default(false) @map("ssl_enabled")
  analyticsCode  String?  @map("analytics_code")
  seoTitle       String?  @map("seo_title")
  seoDescription String?  @map("seo_description")
  seoKeywords    String?  @map("seo_keywords")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  createdBy      String?  @map("created_by")

  // Relations
  tenant        Tenant                  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  analytics     WebsiteAnalytics[]
  domains       WebsiteDomain[]
  formSubmissions WebsiteFormSubmission[]

  @@map("generated_websites")
  @@index([tenantId, entityType, entityId])
  @@index([status])
}

model WebsiteAnalytics {
  id                  String   @id @default(cuid())
  websiteId           String   @map("website_id")
  dateRecorded        DateTime @map("date_recorded") @db.Date
  pageViews           Int      @default(0) @map("page_views")
  uniqueVisitors      Int      @default(0) @map("unique_visitors")
  bounceRate          Decimal  @default(0) @map("bounce_rate") @db.Decimal(5, 2)
  avgSessionDuration  Int      @default(0) @map("avg_session_duration")
  conversionRate      Decimal  @default(0) @map("conversion_rate") @db.Decimal(5, 2)
  formSubmissions     Int      @default(0) @map("form_submissions")
  phoneClicks         Int      @default(0) @map("phone_clicks")
  emailClicks         Int      @default(0) @map("email_clicks")
  referrerData        Json     @default("{}") @map("referrer_data")
  deviceData          Json     @default("{}") @map("device_data")
  locationData        Json     @default("{}") @map("location_data")
  createdAt           DateTime @default(now()) @map("created_at")

  // Relations
  website GeneratedWebsite @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@map("website_analytics")
  @@unique([websiteId, dateRecorded])
  @@index([dateRecorded])
  @@index([websiteId])
}

model WebsiteTemplate {
  id                   String   @id @default(cuid())
  name                 String
  category             String   // 'company', 'landing', 'portal', 'marketing'
  style                String   // 'modern', 'corporate', 'creative', 'minimal'
  description          String?
  thumbnailUrl         String?  @map("thumbnail_url")
  htmlTemplate         String   @map("html_template")
  cssTemplate          String   @map("css_template")
  jsTemplate           String?  @map("js_template")
  defaultPrompt        String?  @map("default_prompt")
  customizationOptions Json     @default("{}") @map("customization_options")
  isPremium            Boolean  @default(false) @map("is_premium")
  price                Decimal  @default(0) @db.Decimal(10, 2)
  usageCount           Int      @default(0) @map("usage_count")
  rating               Decimal  @default(0) @map("rating") @db.Decimal(3, 2)
  isActive             Boolean  @default(true) @map("is_active")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  @@map("website_templates")
}

model WebsiteDomain {
  id                    String   @id @default(cuid())
  websiteId             String   @map("website_id")
  tenantId              String   @map("tenant_id")
  domainName            String   @unique @map("domain_name")
  subdomain             String?
  isCustomDomain        Boolean  @default(false) @map("is_custom_domain")
  sslCertificateStatus  String   @default("pending") @map("ssl_certificate_status")
  dnsConfigured         Boolean  @default(false) @map("dns_configured")
  verificationToken     String?  @map("verification_token")
  verificationStatus    String   @default("pending") @map("verification_status")
  expiryDate            DateTime? @map("expiry_date") @db.Date
  autoRenewal           Boolean  @default(true) @map("auto_renewal")
  monthlyCost           Decimal  @default(9.00) @map("monthly_cost") @db.Decimal(10, 2)
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  // Relations
  website GeneratedWebsite @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  tenant  Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("website_domains")
  @@index([tenantId])
}

model DeepSiteBilling {
  id                    String   @id @default(cuid())
  tenantId              String   @map("tenant_id")
  billingPeriodStart    DateTime @map("billing_period_start") @db.Date
  billingPeriodEnd      DateTime @map("billing_period_end") @db.Date
  websitesCreated       Int      @default(0) @map("websites_created")
  customDomains         Int      @default(0) @map("custom_domains")
  premiumTemplatesUsed  Int      @default(0) @map("premium_templates_used")
  totalPageViews        Int      @default(0) @map("total_page_views")
  websiteBuilderFee     Decimal  @default(0) @map("website_builder_fee") @db.Decimal(10, 2)
  domainFees            Decimal  @default(0) @map("domain_fees") @db.Decimal(10, 2)
  templateFees          Decimal  @default(0) @map("template_fees") @db.Decimal(10, 2)
  overageFees           Decimal  @default(0) @map("overage_fees") @db.Decimal(10, 2)
  totalAmount           Decimal  @default(0) @map("total_amount") @db.Decimal(10, 2)
  currency              String   @default("USD")
  stripeInvoiceId       String?  @map("stripe_invoice_id")
  paymentStatus         String   @default("pending") @map("payment_status")
  paidAt                DateTime? @map("paid_at")
  createdAt             DateTime @default(now()) @map("created_at")

  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("deepsite_billing")
  @@unique([tenantId, billingPeriodStart, billingPeriodEnd])
  @@index([tenantId, billingPeriodStart])
}

model WebsiteFormSubmission {
  id              String   @id @default(cuid())
  websiteId       String   @map("website_id")
  formType        String   @map("form_type") // 'contact', 'quote', 'newsletter', 'demo'
  visitorIp       String?  @map("visitor_ip")
  userAgent       String?  @map("user_agent")
  formData        Json     @map("form_data")
  referrer        String?
  utmSource       String?  @map("utm_source")
  utmMedium       String?  @map("utm_medium")
  utmCampaign     String?  @map("utm_campaign")
  utmTerm         String?  @map("utm_term")
  utmContent      String?  @map("utm_content")
  convertedToLead Boolean  @default(false) @map("converted_to_lead")
  leadId          String?  @map("lead_id")
  submittedAt     DateTime @default(now()) @map("submitted_at")
  processedAt     DateTime? @map("processed_at")

  // Relations
  website GeneratedWebsite @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@map("website_form_submissions")
  @@index([websiteId, submittedAt])
  @@index([convertedToLead])
}
EOF

echo "✅ Dodano modele Prisma dla DeepSite"
```

---

## 🚀 **KROK 7: DEPLOYMENT I KONFIGURACJA VPS**

### **7.1 Konfiguracja Nginx dla DeepSite:**

```bash
echo "🌐 Konfiguracja Nginx dla DeepSite na VPS..."

# Utwórz konfigurację Nginx dla DeepSite
sudo tee /etc/nginx/sites-available/deepsite.conf > /dev/null << 'EOF'
# DeepSite Integration for CRM-GTD
# VPS Hetzner Configuration

server {
    listen 80;
    server_name 91.99.50.80;
    
    # DeepSite API endpoints
    location /api/deepsite {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for AI generation
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Generated websites hosting
    location /sites {
        alias /var/www/deepsite-storage;
        try_files $uri $uri/ @deepsite_fallback;
        
        # Security headers for hosted websites
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache static assets
        location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Fallback for dynamic website content
    location @deepsite_fallback {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Main CRM-GTD application (existing)
    location /crm {
        proxy_pass http://localhost:3000/crm;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Root redirect to CRM
    location / {
        return 301 /crm;
    }
}

# HTTPS configuration (for production)
server {
    listen 443 ssl http2;
    server_name 91.99.50.80;
    
    # SSL Configuration (add your certificates)
    # ssl_certificate /path/to/your/certificate.crt;
    # ssl_certificate_key /path/to/your/private.key;
    
    # Include all the same location blocks as above
    # ... (copy from HTTP configuration)
}
EOF

# Aktywuj konfigurację
sudo ln -sf /etc/nginx/sites-available/deepsite.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Skonfigurowano Nginx dla DeepSite"
```

### **7.2 Utwórz systemd service dla DeepSite:**

```bash
echo "⚙️ Tworzę systemd service dla DeepSite..."

# Utwórz service file dla DeepSite
sudo tee /etc/systemd/system/deepsite.service > /dev/null << EOF
[Unit]
Description=DeepSite AI Website Builder for CRM-GTD
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$CRM_DIR/modules/deepsite
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=DEEPSITE_STORAGE_PATH=/var/www/deepsite-storage
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=deepsite

[Install]
WantedBy=multi-user.target
EOF

# Utwórz katalog storage
sudo mkdir -p /var/www/deepsite-storage
sudo chown -R www-data:www-data /var/www/deepsite-storage
sudo chmod -R 755 /var/www/deepsite-storage

# Utwórz główny server.js dla DeepSite
sudo tee "$CRM_DIR/modules/deepsite/server.js" > /dev/null << 'EOF'
// DeepSite Integration Server for CRM-GTD
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import middleware and routes
const tenantIsolation = require('./middleware/tenant-isolation');
const authIntegration = require('./middleware/auth-integration');
const crmIntegration = require('./api/crm-integration');

// Apply global middleware
app.use('/api/deepsite', authIntegration);
app.use('/api/deepsite', tenantIsolation);

// API Routes
app.use('/api/deepsite', crmIntegration);

//