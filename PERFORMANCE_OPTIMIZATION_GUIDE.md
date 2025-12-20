# 🚀 CRM-GTD Smart - Performance Optimization Guide

## 📊 **Analiza Bieżącego Stanu (2025-06-27)**

### ⚠️ **Zidentyfikowane Problemy:**

#### **1. Krytyczne obciążenie CPU:**
- **Load average: 5.58-5.83** (dla 4-core CPU - 140-145% wykorzystania!)
- **CPU usage: 83.1% user + 16.9% system** = 100% wykorzystania
- **Wiele procesów Node.js** (mdk-server, npm, ts-node) zużywających CPU

#### **2. Dysk prawie pełny:**
- **Storage: 65GB/75GB (91% wykorzystania)**
- **Dostępne: tylko 7.1GB** - ryzyko braku miejsca
- **Wymaga natychmiastowego czyszczenia**

#### **3. Brak optymalizacji zasobów:**
- **Docker containers** bez memory/CPU limits
- **PostgreSQL** z domyślną konfiguracją
- **Nginx** bez cachowania i optymalizacji
- **Node.js processes** bez memory limits

#### **4. Zbędne procesy:**
- **Prisma Studio** (77MB RAM) - niepotrzebny w produkcji
- **Vite dev server** - tylko do developmentu
- **MDK servers** - multiple instances (71-114MB każdy)

---

## 🎯 **Plan Optymalizacji**

### **Faza 1: Natychmiastowe działania (5 min)**

#### **A. Czyszczenie miejsca na dysku:**
```bash
# Docker cleanup
docker system prune -af --volumes

# System cleanup
apt-get autoremove -y && apt-get autoclean
journalctl --vacuum-time=7d
rm -rf /tmp/* /var/tmp/*

# Log cleanup
find /var/log -name "*.log" -type f -size +100M -delete
```

#### **B. Zatrzymanie zbędnych procesów:**
```bash
# Stop development tools
pkill -f "prisma studio"
pkill -f "npm.*vite"
pkill -f "mdk-server"
```

### **Faza 2: Konfiguracja Docker (10 min)**

#### **A. Zastąpienie docker-compose.yml:**
```bash
cd /opt/crm-gtd-smart
cp docker-compose.v1.yml docker-compose.v1.backup
cp docker-compose.v1-optimized.yml docker-compose.v1.yml
```

#### **B. Restart z optymalizacjami:**
```bash
docker-compose down
docker-compose up -d
```

### **Faza 3: Optymalizacja PostgreSQL (5 min)**

#### **Konfiguracja dostosowana do 7.6GB RAM:**
- **shared_buffers: 256MB** (optimal dla 1GB container limit)
- **effective_cache_size: 512MB** (cache awareness)
- **work_mem: 8MB** (per-query memory)
- **max_connections: 50** (reduced from default 100)
- **checkpoint optimizations** dla lepszej wydajności I/O

### **Faza 4: Nginx Optimization (10 min)**

#### **A. Zainstalowanie zoptymalizowanej konfiguracji:**
```bash
cp /opt/crm-gtd-smart/nginx-optimized.conf /etc/nginx/sites-available/all-apps-optimized
ln -sf /etc/nginx/sites-available/all-apps-optimized /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/all-apps
nginx -t && systemctl reload nginx
```

#### **B. Tworzenie cache directories:**
```bash
mkdir -p /var/cache/nginx/crm
chown -R www-data:www-data /var/cache/nginx/
```

### **Faza 5: System Tuning (15 min)**

#### **Uruchomienie skryptu optymalizacji:**
```bash
cd /opt/crm-gtd-smart
./system-optimization.sh
```

---

## 📈 **Przewidywane Korzyści**

### **1. Redukcja CPU Usage:**
- **Przed**: Load average 5.5+ (140% CPU)
- **Po**: Load average 1.5-2.0 (40-50% CPU)
- **Redukcja**: ~60-70% obciążenia CPU

### **2. Optymalizacja RAM:**
- **Docker limits**: Kontrolowane zużycie pamięci
- **PostgreSQL tuning**: Efektywniejsze wykorzystanie
- **Node.js optimization**: Memory limits dla procesów

### **3. Poprawa Response Time:**
- **Nginx caching**: 50-80% szybsze statyczne pliki
- **Database optimization**: 30-50% szybsze zapytania
- **Connection pooling**: Lepsza wydajność API

### **4. Stabilność:**
- **Resource limits**: Brak OOM errors
- **Process management**: Automatyczne restarts
- **Monitoring**: Real-time status tracking

---

## 🔧 **Szczegółowe Optymalizacje**

### **Docker Resource Limits:**
```yaml
deploy:
  resources:
    limits:
      memory: 512M      # Frontend/Backend
      cpus: '1.0'
    reservations:
      memory: 256M
      cpus: '0.5'
```

### **PostgreSQL Performance:**
```conf
shared_buffers = 256MB
effective_cache_size = 512MB
work_mem = 8MB
max_connections = 50
checkpoint_completion_target = 0.9
```

### **Nginx Caching:**
```nginx
proxy_cache crm_cache;
proxy_cache_valid 200 302 5m;
proxy_cache_valid 404 1m;
gzip_comp_level 6;
keepalive_timeout 65s;
```

### **Node.js Optimization:**
```bash
NODE_OPTIONS=--max-old-space-size=512
NODE_ENV=production
WATCHPACK_POLLING=false
```

---

## 📊 **Monitoring i Weryfikacja**

### **A. Skrypt monitorowania:**
```bash
/usr/local/bin/crm-monitor.sh
```

### **B. Kluczowe metryki do śledzenia:**
- **Load average**: < 2.0 (target)
- **Memory usage**: < 5GB total
- **Disk usage**: < 80%
- **Response time**: < 500ms average

### **C. Automatyczne logi:**
```bash
tail -f /var/log/crm-monitor.log
```

---

## ⚡ **Quick Start - Pełna Optymalizacja**

```bash
# 1. Przejdź do katalogu projektu
cd /opt/crm-gtd-smart

# 2. Uruchom automatyczną optymalizację
./system-optimization.sh

# 3. Zastąp docker-compose
docker-compose down
cp docker-compose.v1-optimized.yml docker-compose.v1.yml
docker-compose up -d

# 4. Zastąp nginx config
cp nginx-optimized.conf /etc/nginx/sites-available/all-apps-optimized
ln -sf /etc/nginx/sites-available/all-apps-optimized /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 5. Sprawdź status
/usr/local/bin/crm-monitor.sh
```

---

## 🎯 **Oczekiwane Rezultaty**

### **Po optymalizacji:**
- ✅ **CPU load**: 1.5-2.0 (vs 5.5+ obecnie)
- ✅ **Memory usage**: ~4GB (vs 6GB+ obecnie)
- ✅ **Response time**: 200-500ms (vs 1s+ obecnie)
- ✅ **Disk space**: +15GB freed
- ✅ **Stability**: No OOM kills, stable performance

### **Monitoring dashboard:**
- 📊 Real-time metrics co 5 minut
- 🚨 Alerty przy przekroczeniu limitów
- 📈 Historical performance data

---

## 🚨 **Rollback Plan**

W przypadku problemów:
```bash
# Przywróć oryginalną konfigurację
cp docker-compose.v1.backup docker-compose.v1.yml
docker-compose down && docker-compose up -d

# Przywróć nginx
ln -sf /etc/nginx/sites-available/all-apps /etc/nginx/sites-enabled/
systemctl reload nginx
```

---

## 📞 **Support i Dalsze Kroki**

### **Po wdrożeniu optymalizacji:**
1. **Monitoruj** system przez 24h
2. **Sprawdź** czy aplikacja działa poprawnie
3. **Dostosuj** limity jeśli potrzeba
4. **Planuj** dalsze optymalizacje (SSL, CDN, load balancing)

### **Przyszłe ulepszenia:**
- **Redis caching** dla sesji i cache
- **CDN** dla statycznych plików
- **Load balancing** przy skalowaniu
- **SSL termination** w nginx
- **Database replication** dla wysokiej dostępności