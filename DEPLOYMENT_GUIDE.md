# 🚀 CRM-GTD SaaS Deployment Guide - Hetzner VPS

## 📋 Wymagania

### VPS Specyfikacja (Hetzner)
- **CPU**: 2 vCPU lub więcej
- **RAM**: 4GB lub więcej 
- **Storage**: 40GB SSD lub więcej
- **OS**: Ubuntu 22.04 LTS (rekomendowane)

### Software Requirements
- Docker 24.0+
- Docker Compose 2.20+
- Git
- Nginx (opcjonalnie, jeśli nie używasz Docker nginx)

## 🔧 Przygotowanie VPS

### 1. Połącz się z VPS
```bash
ssh root@your-vps-ip
```

### 2. Aktualizuj system
```bash
apt update && apt upgrade -y
```

### 3. Zainstaluj Docker
```bash
# Usuń stare wersje
apt remove docker docker-engine docker.io containerd runc

# Zainstaluj wymagane pakiety
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Dodaj klucz GPG Dockera
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Dodaj repozytorium
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Zainstaluj Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Uruchom Docker
systemctl start docker
systemctl enable docker
```

### 4. Zainstaluj Docker Compose (jeśli nie ma)
```bash
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 5. Zainstaluj Git
```bash
apt install -y git
```

## 📦 Deployment Aplikacji

### 1. Sklonuj repozytorium
```bash
cd /opt
git clone https://github.com/your-username/crm-gtd-smart.git
cd crm-gtd-smart
```

### 2. Skonfiguruj zmienne środowiskowe
```bash
# Skopiuj przykładowy plik
cp .env.production.example .env.production

# Edytuj konfigurację
nano .env.production
```

**Ważne zmienne do skonfigurowania:**
```env
# Database - wygeneruj bezpieczne hasło
POSTGRES_PASSWORD=super_secure_password_here

# JWT Secrets - wygeneruj z: openssl rand -base64 32
JWT_SECRET=your_generated_32_char_secret
JWT_REFRESH_SECRET=your_generated_32_char_refresh_secret

# Your domain
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# OpenAI (opcjonalne)
OPENAI_API_KEY=sk-your-openai-key-here

# SMTP (opcjonalne)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Uruchom deployment
```bash
# Nadaj uprawnienia
chmod +x deploy.sh update.sh

# Uruchom deployment
./deploy.sh production
```

Skrypt automatycznie:
- Zbuduje obrazy Docker
- Uruchomi bazy danych
- Wykona migracje
- Uruchomi wszystkie usługi
- Sprawdzi status

### 4. Sprawdź status
```bash
# Sprawdź działające kontenery
docker-compose -f docker-compose.production.yml ps

# Sprawdź logi
docker-compose -f docker-compose.production.yml logs -f

# Test aplikacji
curl http://localhost/health
```

## 🌐 Konfiguracja Domeny

### 1. DNS Configuration
W panelu Hetzner lub u dostawcy domeny ustaw:
```
A    @    your-vps-ip
A    www  your-vps-ip
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Zainstaluj Certbot
apt install -y certbot python3-certbot-nginx

# Zatrzymaj nginx z Docker tymczasowo
docker-compose -f docker-compose.production.yml stop nginx

# Wygeneruj certyfikat
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Skopiuj certyfikaty do nginx
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Uruchom nginx ponownie
docker-compose -f docker-compose.production.yml up -d nginx
```

### 3. Aktywuj HTTPS w nginx
Odkomentuj sekcję HTTPS w `nginx/conf.d/default.conf` i zrestartuj:
```bash
docker-compose -f docker-compose.production.yml restart nginx
```

## 🔄 Zarządzanie

### Podstawowe komendy
```bash
# Sprawdź status
docker-compose -f docker-compose.production.yml ps

# Zobacz logi
docker-compose -f docker-compose.production.yml logs -f [service_name]

# Restart usługi
docker-compose -f docker-compose.production.yml restart [service_name]

# Zatrzymaj wszystko
docker-compose -f docker-compose.production.yml down

# Uruchom wszystko
docker-compose -f docker-compose.production.yml up -d
```

### Aktualizacje
```bash
# Aktualizuj wszystko
./update.sh

# Aktualizuj tylko backend
./update.sh backend

# Aktualizuj tylko frontend
./update.sh frontend
```

### Backup bazy danych
```bash
# Utwórz backup
docker exec crm-gtd-postgres pg_dump -U postgres crm_gtd_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Przywróć backup
cat backup_file.sql | docker exec -i crm-gtd-postgres psql -U postgres crm_gtd_prod
```

## 🔧 Troubleshooting

### Sprawdź porty
```bash
netstat -tlnp | grep -E ':(80|443|5432|6379)'
```

### Sprawdź logi Docker
```bash
docker logs crm-gtd-backend
docker logs crm-gtd-frontend
docker logs crm-gtd-nginx
```

### Restart wszystkich usług
```bash
docker-compose -f docker-compose.production.yml restart
```

### Czyść starę obrazy (oszczędność miejsca)
```bash
docker system prune -a
```

## 📊 Monitoring

### Sprawdź zasoby
```bash
# CPU i RAM
htop

# Przestrzeń dyskowa
df -h

# Docker stats
docker stats
```

### Logi systemowe
```bash
# Logi nginx
docker-compose -f docker-compose.production.yml logs nginx

# Logi aplikacji
docker-compose -f docker-compose.production.yml logs backend frontend
```

## 🚨 Bezpieczeństwo

### Firewall (UFW)
```bash
# Aktywuj firewall
ufw enable

# Podstawowe reguły
ufw allow ssh
ufw allow 80
ufw allow 443

# Sprawdź status
ufw status
```

### Automatyczne aktualizacje
```bash
# Zainstaluj unattended-upgrades
apt install -y unattended-upgrades

# Skonfiguruj automatyczne aktualizacje bezpieczeństwa
dpkg-reconfigure -plow unattended-upgrades
```

### Regularne backupy
Dodaj do crontab:
```bash
crontab -e

# Backup codziennie o 2:00
0 2 * * * cd /opt/crm-gtd-smart && docker exec crm-gtd-postgres pg_dump -U postgres crm_gtd_prod > /backups/crm_$(date +\%Y\%m\%d).sql
```

## 📞 Support

Jeśli masz problemy:
1. Sprawdź logi: `docker-compose logs`
2. Sprawdź status: `docker-compose ps`
3. Zrestartuj usługi: `docker-compose restart`
4. Sprawdź konfigurację: `.env.production`

**Przydatne linki:**
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)