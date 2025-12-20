# 🚀 Multi-App VPS Setup Guide

## Struktura portów dla 3 aplikacji:

- **Główny Nginx (VPS)**: Port 80/443
- **CRM-GTD**: Port 8081 → dostępny jako `/crm`
- **App 2**: Port 8082 → dostępny jako `/app2`  
- **App 3**: Port 8083 → dostępny jako `/app3`

## 📦 Krok 1: Setup głównego Nginx na VPS

```bash
# Zainstaluj nginx jeśli nie ma
sudo apt install -y nginx

# Backup domyślnej konfiguracji
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Skopiuj nową konfigurację
sudo cp nginx-main-vps.conf /etc/nginx/sites-available/default

# Test konfiguracji
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## 📦 Krok 2: Deploy CRM-GTD

### Transfer plików:
```bash
# Na lokalnej maszynie
./transfer-to-vps.sh YOUR_VPS_IP
```

### Na VPS:
```bash
cd /opt/crm-gtd-smart

# Uruchom quick setup (Docker, etc)
./quick-start.sh

# Konfiguracja dla subpath
cp .env.production.example .env.production
nano .env.production
```

### Ważne ustawienia w `.env.production`:
```env
# Zmień your-ip na faktyczny IP VPS
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP/crm
NEXT_PUBLIC_APP_URL=http://YOUR_VPS_IP/crm
NEXT_PUBLIC_BASE_PATH=/crm

# Ustaw hasła bazy danych
POSTGRES_PASSWORD=silne_haslo_postgres
JWT_SECRET=wygeneruj_32_znaki
JWT_REFRESH_SECRET=wygeneruj_32_znaki
```

### Deploy z multi-app config:
```bash
# Użyj specjalnego docker-compose dla multi-app
docker-compose -f docker-compose.multi-app.yml up -d
```

## 📦 Krok 3: Weryfikacja

```bash
# Sprawdź czy kontenery działają
docker ps

# Sprawdź logi
docker-compose -f docker-compose.multi-app.yml logs -f

# Test z VPS
curl http://localhost:8081/health

# Test z zewnątrz
curl http://YOUR_VPS_IP/crm
```

## 🔧 Zarządzanie aplikacjami

### CRM-GTD (port 8081, path /crm):
```bash
cd /opt/crm-gtd-smart
docker-compose -f docker-compose.multi-app.yml ps
docker-compose -f docker-compose.multi-app.yml logs crm-backend
docker-compose -f docker-compose.multi-app.yml restart crm-frontend
```

### Dodanie App2 (port 8082, path /app2):
```bash
cd /opt/app2
# Deploy podobnie jak CRM ale na porcie 8082
```

### Dodanie App3 (port 8083, path /app3):
```bash
cd /opt/app3
# Deploy podobnie jak CRM ale na porcie 8083
```

## 📊 Porty używane przez CRM-GTD:

**Wewnętrznie w Docker network:**
- PostgreSQL: 5432 (tylko wewnętrznie)
- Redis: 6379 (tylko wewnętrznie)
- Backend API: 9029 (tylko wewnętrznie)
- Frontend: 3000 (tylko wewnętrznie)

**Expose na host:**
- Nginx proxy: 8081 → mapowany na /crm przez główny nginx

## 🔍 Troubleshooting

### Problem: Aplikacja nie odpowiada na /crm
```bash
# Sprawdź główny nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Sprawdź aplikację
docker logs crm-gtd-nginx
docker logs crm-gtd-frontend
```

### Problem: Konflikty portów
```bash
# Sprawdź zajęte porty
sudo netstat -tlnp | grep -E ':(80|8081|8082|8083)'

# Zabij proces blokujący port
sudo kill -9 $(sudo lsof -t -i:8081)
```

### Problem: Assets (CSS/JS) nie ładują się
Sprawdź w `.env.production`:
```env
NEXT_PUBLIC_BASE_PATH=/crm
```

## 🎯 Dostęp do aplikacji:

- **CRM-GTD**: http://YOUR_VPS_IP/crm
- **App 2**: http://YOUR_VPS_IP/app2  
- **App 3**: http://YOUR_VPS_IP/app3

## 🔒 Bezpieczeństwo

```bash
# Firewall - otwórz tylko potrzebne porty
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable

# Ukryj porty Docker (8081-8083) z zewnątrz
# Dodaj do docker-compose:
# ports:
#   - "127.0.0.1:8081:80"  # Tylko localhost
```