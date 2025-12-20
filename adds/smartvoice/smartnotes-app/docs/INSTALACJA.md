# 🚀 SmartNotes AI - Instrukcja Instalacji

## 📋 Wymagania Systemowe

### Minimalne wymagania:
- **Node.js** 18.0+ (zalecane: 20.0+)
- **npm** 9.0+ lub **yarn** 3.0+
- **Python** 3.8+ (dla serwera lokalnego)
- **Nowoczesna przeglądarka** z Web Audio API

### Obsługiwane systemy:
- ✅ **Windows** 10/11
- ✅ **macOS** 10.15+
- ✅ **Linux** (Ubuntu 20.04+, Debian 11+)

### Obsługiwane przeglądarki:
- ✅ **Chrome** 66+ (zalecane)
- ✅ **Firefox** 60+
- ✅ **Safari** 14.1+
- ✅ **Edge** 79+

## 📦 Instalacja z Archiwum

### 1. Rozpakuj archiwum
```bash
# Windows
Expand-Archive smartnotes-ai-v1.0.zip -DestinationPath ./smartnotes-ai

# macOS/Linux
unzip smartnotes-ai-v1.0.zip
cd smartnotes-ai
```

### 2. Zainstaluj zależności
```bash
npm install
```

### 3. Zbuduj aplikację
```bash
npm run build
```

### 4. Uruchom serwer
```bash
# HTTP (port 9999)
npm run serve

# HTTPS (port 8443) - dla Firefox
python3 start-https.py
```

## 🔧 Instalacja Developerska

### 1. Klonuj repozytorium (jeśli dostępne)
```bash
git clone [REPOSITORY_URL]
cd smartnotes-app
```

### 2. Zainstaluj zależności
```bash
npm install
```

### 3. Uruchom w trybie deweloperskim
```bash
# Lokalnie
npm run dev

# Z dostępem sieciowym
npm run dev:network
```

### 4. Zbuduj dla produkcji
```bash
npm run build
npm run preview
```

## 🌐 Konfiguracja Sieciowa

### Dostęp lokalny:
- **HTTP Development**: http://localhost:3000
- **HTTP Production**: http://localhost:9999
- **HTTPS Production**: https://localhost:8443

### Dostęp sieciowy:
1. **Znajdź IP komputera**:
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   hostname -I
   ifconfig
   ```

2. **Otwórz porty w firewall**:
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 9999
   sudo ufw allow 8443
   
   # CentOS/RHEL
   sudo firewall-cmd --add-port=9999/tcp --permanent
   sudo firewall-cmd --add-port=8443/tcp --permanent
   ```

3. **Dostęp z innych urządzeń**:
   - HTTP: http://[TWOJ_IP]:9999
   - HTTPS: https://[TWOJ_IP]:8443

## 🔒 Konfiguracja HTTPS

### Automatyczna (zalecane):
```bash
python3 start-https.py
```
Skrypt automatycznie utworzy certyfikat self-signed.

### Manualna:
```bash
# Generuj certyfikat
openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes

# Uruchom serwer HTTPS
python3 start-https.py
```

### Dla produkcji:
1. Kup certyfikat SSL lub użyj Let's Encrypt
2. Skonfiguruj nginx/Apache jako reverse proxy
3. Ustaw właściwe nagłówki CORS

## ⚙️ Zmienne Środowiskowe

Utwórz plik `.env` (opcjonalnie):
```bash
# .env
VITE_APP_TITLE="SmartNotes AI"
VITE_APP_VERSION="1.0.0"
VITE_ENABLE_ANALYTICS=false
VITE_API_BASE_URL="http://localhost:8000"
```

## 🐳 Docker (Opcjonalnie)

### Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Uruchomienie:
```bash
docker build -t smartnotes-ai .
docker run -p 8080:80 smartnotes-ai
```

## 🔧 Rozwiązywanie Problemów

### Błąd: "Command not found: npm"
```bash
# Zainstaluj Node.js
# Windows: Pobierz z nodejs.org
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm
```

### Błąd: "Permission denied"
```bash
# Linux/macOS - dodaj sudo
sudo npm install -g npm

# Lub skonfiguruj npm prefix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Błąd: "Port already in use"
```bash
# Znajdź proces używający portu
lsof -i :9999
netstat -ano | findstr :9999

# Zabij proces lub użyj innego portu
kill -9 [PID]
npm run serve -- --port 8080
```

### Błąd: "Mikrofon nie działa"
1. Sprawdź uprawnienia przeglądarki
2. Użyj HTTPS dla Firefox
3. Sprawdź ustawienia systemu
4. Sprawdź czy mikrofon nie jest używany przez inne aplikacje

### Błąd: "Cannot load module"
```bash
# Wyczyść cache i reinstaluj
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Deployment na Serwer

### Nginx Configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/smartnotes-ai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Apache Configuration:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/smartnotes-ai/dist
    
    <Directory "/var/www/smartnotes-ai/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    FallbackResource /index.html
</VirtualHost>
```

### PM2 (Process Manager):
```bash
# Zainstaluj PM2
npm install -g pm2

# Utwórz ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'smartnotes-ai',
    script: 'serve',
    args: '-s dist -l 3000',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
}
EOF

# Uruchom
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📊 Monitoring i Logi

### Logi developmentowe:
```bash
# Logi serwera HTTP
tail -f http-server.log

# Logi serwera HTTPS
tail -f https-server.log

# Logi przeglądarki
# Otwórz Developer Tools > Console
```

### Monitoring produkcyjny:
- **Uptime monitoring** - np. Uptime Robot
- **Error tracking** - np. Sentry (jeśli zintegrowane)
- **Performance monitoring** - Web Vitals

## 🔄 Aktualizacje

### Aktualizacja zależności:
```bash
# Sprawdź outdated packages
npm outdated

# Aktualizuj wszystkie
npm update

# Aktualizuj konkretny package
npm install package@latest
```

### Aktualizacja aplikacji:
1. Pobierz nową wersję
2. Backup starych danych
3. Zastąp pliki
4. Uruchom `npm install`
5. Przebuduj aplikację

## 📞 Wsparcie Techniczne

### Logi do dołączenia przy zgłoszeniu:
```bash
# Informacje o systemie
node --version
npm --version
cat package.json

# Logi błędów
npm run build 2>&1 | tee build.log
```

### Diagnostyka:
```bash
# Test mikrofonu
# Otwórz: http://localhost:9999/test-mic.html

# Test serwera
curl -I http://localhost:9999

# Test HTTPS
curl -k -I https://localhost:8443
```

---

**Pomyślnej instalacji SmartNotes AI!** 🎉

W razie problemów sprawdź dokumentację lub skontaktuj się z wsparciem technicznym.