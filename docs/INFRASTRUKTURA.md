# Infrastruktura i Deployment - CRM-GTD Smart

> Ostatnia aktualizacja: 2026-02-17
> Wersja dokumentu: 1.0
> Domena produkcyjna: `crm.dev.sorto.ai`

---

## Spis tresci

1. [Architektura infrastruktury](#1-architektura-infrastruktury)
2. [Kontenery Docker](#2-kontenery-docker)
3. [Struktura monorepo](#3-struktura-monorepo)
4. [Nginx reverse proxy](#4-nginx-reverse-proxy)
5. [Zmienne srodowiskowe](#5-zmienne-srodowiskowe)
6. [Development workflow](#6-development-workflow)
7. [Production deployment](#7-production-deployment)
8. [Baza danych](#8-baza-danych)
9. [Monitoring i logowanie](#9-monitoring-i-logowanie)
10. [Bezpieczenstwo](#10-bezpieczenstwo)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Architektura infrastruktury

### Diagram ogolny

```
                        Internet
                           |
                       [Firewall]
                      UFW (80/443/22)
                           |
                    [SSL Termination]
                   Let's Encrypt / Certbot
                           |
                   +-------+-------+
                   |  Nginx (host) |
                   |  crm.dev.sorto.ai
                   +-------+-------+
                           |
              +------------+------------+
              |                         |
     /crm/ (frontend)         /crm/api/ (backend)
              |                         |
    +---------+---------+    +----------+---------+
    | crm-frontend-v1   |    | crm-backend-v1     |
    | Next.js 14        |    | Express.js + Prisma |
    | port 9025:3000    |    | port 3003:3001      |
    +-------------------+    +----------+----------+
                                        |
                          +-------------+-------------+
                          |                           |
                +---------+---------+    +------------+---------+
                | crm-postgres-v1   |    | crm-redis-v1         |
                | PostgreSQL 14     |    | Redis 7 Alpine       |
                | port 5434:5432    |    | port 6381:6379       |
                +-------------------+    +----------------------+

                +-----------------------+
                | crm-voice-tts-v1      |
                | Mock TTS (Python)     |
                | port 5002:5002        |
                +-----------------------+

                Siec: crm-v1-network (bridge)
```

### Przeplywy komunikacji

```
Uzytkownik -> Nginx (HTTPS :443)
    |
    +-> /crm/           -> crm-frontend-v1 (localhost:9025)
    +-> /crm/api/v1/... -> crm-backend-v1  (localhost:3003)
    +-> /health          -> Nginx (200 OK)

crm-backend-v1 -> crm-postgres-v1 (postgres-v1:5432, wewnetrzna siec Docker)
crm-backend-v1 -> crm-redis-v1    (redis-v1:6379, wewnetrzna siec Docker)
crm-backend-v1 -> crm-voice-tts-v1 (voice-tts-v1:5002, wewnetrzna siec Docker)
```

### Technologie

| Warstwa          | Technologia                        | Wersja    |
|------------------|------------------------------------|-----------|
| Frontend         | Next.js + React + TypeScript       | 14.x / 18.x |
| Backend          | Express.js + TypeScript            | 4.18.x    |
| ORM              | Prisma Client                      | 6.19.x    |
| Baza danych      | PostgreSQL                         | 14        |
| Cache            | Redis                              | 7 Alpine  |
| Voice TTS        | Python FastAPI (mock)              | 3.9       |
| Konteneryzacja   | Docker + Docker Compose            | v3.8      |
| Reverse Proxy    | Nginx                              | system    |
| Monorepo         | npm workspaces + Turborepo         | 1.10.x    |
| Runtime          | Node.js                            | >= 18.17  |

---

## 2. Kontenery Docker

Glowny plik: `/home/dev/apps/sorto-crm/docker-compose.v1.yml`

### 2.1 crm-frontend-v1 (Next.js)

| Parametr          | Wartosc                                           |
|-------------------|---------------------------------------------------|
| **Build context** | `./packages/frontend`                             |
| **Dockerfile**    | `packages/frontend/Dockerfile`                    |
| **Kontener**      | `crm-frontend-v1`                                 |
| **Porty**         | `9025:3000` (host:kontener)                       |
| **Restart**       | `unless-stopped`                                  |
| **Siec**          | `crm-v1-network`                                  |

**Zmienne srodowiskowe:**
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=/crm
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=production
```

**Wolumeny:**
```yaml
volumes:
  - ./packages/frontend:/app
  - /app/node_modules      # anonimowy wolumin (izolacja node_modules)
  - /app/.next             # anonimowy wolumin (izolacja buildu)
```

**Health check (Dockerfile):**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

**Obraz bazowy:** `node:18-alpine` (multi-stage build: deps -> builder -> runner)

**Dockerfile produkcyjny:** `packages/frontend/Dockerfile.production` -- zoptymalizowany build z output traces, uzytkownik `nextjs` (UID 1001), telemetria wylaczona.

---

### 2.2 crm-backend-v1 (Express.js)

| Parametr          | Wartosc                                           |
|-------------------|---------------------------------------------------|
| **Build context** | `./packages/backend`                              |
| **Dockerfile**    | `packages/backend/Dockerfile`                     |
| **Kontener**      | `crm-backend-v1`                                  |
| **Porty**         | `3001:3001` (host:kontener), prod: `3003:3001`    |
| **Restart**       | `unless-stopped`                                  |
| **Siec**          | `crm-v1-network`                                  |

**Zmienne srodowiskowe:**
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@postgres-v1:5432/crm_gtd_v1
REDIS_URL=redis://redis-v1:6379
JWT_SECRET=<tajny-klucz>
JWT_REFRESH_SECRET=<tajny-klucz>
BCRYPT_ROUNDS=12
NEXT_PUBLIC_APP_URL=https://crm.dev.sorto.ai/crm
```

**Wolumeny:**
```yaml
volumes:
  - ./packages/backend:/app
  - /app/node_modules
```

**Zaleznosci:**
- `postgres-v1`
- `redis-v1`

**Health check (Dockerfile):**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1
```

Skrypt healthcheck.js jest generowany w trakcie budowania obrazu -- wykonuje zapytanie HTTP GET na `http://localhost:3001/health`.

**Obraz bazowy:** `node:18-alpine` z dodatkowymi pakietami: python3, make, g++, docker-cli, github-cli, git.

**Uruchamianie:** `npx ts-node --transpile-only src/app.ts`

---

### 2.3 crm-postgres-v1 (PostgreSQL)

| Parametr          | Wartosc                                           |
|-------------------|---------------------------------------------------|
| **Obraz**         | `postgres:14`                                     |
| **Kontener**      | `crm-postgres-v1`                                 |
| **Porty**         | `5434:5432` (host:kontener)                       |
| **Restart**       | `unless-stopped`                                  |
| **Siec**          | `crm-v1-network`                                  |

**Zmienne srodowiskowe:**
```
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=crm_gtd_v1
```

**Wolumeny:**
```yaml
volumes:
  - postgres_v1_data:/var/lib/postgresql/data   # named volume (persistentny)
```

---

### 2.4 crm-redis-v1 (Redis)

| Parametr          | Wartosc                                           |
|-------------------|---------------------------------------------------|
| **Obraz**         | `redis:7-alpine`                                  |
| **Kontener**      | `crm-redis-v1`                                    |
| **Porty**         | `6381:6379` (host:kontener)                       |
| **Restart**       | `unless-stopped`                                  |
| **Siec**          | `crm-v1-network`                                  |

**Wolumeny:**
```yaml
volumes:
  - redis_v1_data:/data   # named volume (persistentny)
```

---

### 2.5 crm-voice-tts-v1 (Mock TTS Service)

| Parametr          | Wartosc                                           |
|-------------------|---------------------------------------------------|
| **Dockerfile**    | `Dockerfile.mock-tts` (root projektu)             |
| **Kontener**      | `crm-voice-tts-v1`                                |
| **Porty**         | `5002:5002` (host:kontener)                       |
| **Obraz bazowy**  | `python:3.9-slim`                                 |
| **Framework**     | FastAPI + Uvicorn                                 |
| **Siec**          | `crm-v1-network`                                  |

**Health check (Dockerfile):**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD curl -f http://localhost:5002/health || exit 1
```

**Endpointy Mock TTS:**
- `GET /health` -- status uslugi
- `GET /api/tts/models` -- lista modeli (mock-tts-pl, mock-tts-en)
- `POST /api/tts` -- synteza tekstu na mowe (generuje sygnaly WAV)
- `POST /api/tts/clone_voice` -- klonowanie glosu (mock)
- `POST /api/tts/stream` -- streaming (mock)

Istnieje rowniez `Dockerfile.coqui-tts` z prawdziwym modelem Coqui TTS (na przyszlosc, wymaga wiecej zasobow).

---

### 2.6 Siec i wolumeny

**Siec Docker:**
```yaml
networks:
  crm-v1-network:
    driver: bridge
```

Wszystkie kontenery komunikuja sie przez wewnetrzna siec `crm-v1-network`. Nazwy DNS odpowiadaja nazwom serwisow: `postgres-v1`, `redis-v1`, `frontend-v1`, `backend-v1`.

**Named Volumes:**
```yaml
volumes:
  postgres_v1_data:   # dane PostgreSQL
    driver: local
  redis_v1_data:      # dane Redis
    driver: local
```

---

### 2.7 Mapowanie portow -- podsumowanie

| Usluga        | Port host | Port kontener | Dostep zewnetrzny |
|---------------|-----------|---------------|--------------------|
| Frontend V1   | 9025      | 3000          | Przez Nginx        |
| Backend V1    | 3003      | 3001          | Przez Nginx        |
| PostgreSQL V1 | 5434      | 5432          | Tylko lokal/dev    |
| Redis V1      | 6381      | 6379          | Tylko lokal/dev    |
| Voice TTS V1  | 5002      | 5002          | Wewnetrzna siec    |

---

## 3. Struktura monorepo

### Organizacja katalogow

```
sorto-crm/
|-- package.json              # root workspace
|-- turbo.json                # konfiguracja Turborepo
|-- docker-compose.v1.yml     # Docker Compose (V1 - produkcja)
|-- Dockerfile.mock-tts       # Mock TTS service
|-- Dockerfile.coqui-tts      # Coqui TTS (przyszlosc)
|-- deploy.sh                 # skrypt deploymentu
|-- update.sh                 # skrypt aktualizacji
|-- quick-start.sh            # setup VPS od zera
|-- switch-to-production.sh   # przelaczenie na tryb produkcyjny
|-- switch-to-development.sh  # przelaczenie na tryb development
|-- monitor-performance.sh    # monitoring wydajnosci
|-- system-optimization.sh    # optymalizacja systemu
|-- nginx-crm-config.conf     # konfiguracja Nginx (CRM)
|-- nginx-production.conf     # konfiguracja Nginx (produkcja)
|-- nginx-optimized.conf      # konfiguracja Nginx (zoptymalizowana)
|-- nginx-main-vps.conf       # konfiguracja Nginx (glowna VPS)
|-- .env.example              # przykladowe zmienne srodowiskowe
|
|-- packages/
|   |-- frontend/             # @crm-gtd/frontend
|   |   |-- package.json
|   |   |-- Dockerfile        # Dockerfile developerski
|   |   |-- Dockerfile.production  # Dockerfile produkcyjny
|   |   |-- Dockerfile.dev    # Dockerfile z hot reload
|   |   |-- next.config.js
|   |   |-- postcss.config.js
|   |   |-- tailwind.config.js
|   |   |-- tsconfig.json
|   |   |-- src/
|   |   |   |-- app/          # Next.js App Router
|   |   |   |-- components/   # komponenty React
|   |   |   |-- lib/          # biblioteki, API client
|   |   |   +-- styles/       # style globalne
|   |   +-- public/           # pliki statyczne
|   |
|   +-- backend/              # @crm-gtd/backend
|       |-- package.json
|       |-- Dockerfile        # Dockerfile glowny
|       |-- Dockerfile.simple # uproszczony Dockerfile
|       |-- Dockerfile.js     # Dockerfile z kompilacja JS
|       |-- tsconfig.json
|       |-- src/
|       |   |-- app.ts        # glowny plik serwera
|       |   |-- config/       # konfiguracja (index.ts, database.ts, logger.ts)
|       |   |-- modules/      # moduly (auth, organizations)
|       |   |-- routes/       # 90+ plokow routerow API
|       |   |-- services/     # warstwa logiki biznesowej
|       |   +-- shared/       # middleware, typy wspolne
|       +-- prisma/
|           |-- schema.prisma # schemat bazy danych (97 tabel)
|           |-- seed.ts       # podstawowy seed
|           +-- seed-comprehensive.ts  # rozbudowany seed
|
|-- docs/                     # dokumentacja
|-- scripts/                  # skrypty pomocnicze
|-- backups/                  # kopie zapasowe
+-- e2e-tests/                # testy end-to-end
```

### Konfiguracja Turborepo

Plik: `/home/dev/apps/sorto-crm/turbo.json`

```json
{
  "pipeline": {
    "dev":        { "cache": false, "persistent": true },
    "build":      { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "test":       { "dependsOn": ["build"], "outputs": ["coverage/**"] },
    "lint":       { "outputs": [] },
    "type-check": { "dependsOn": ["^build"], "outputs": [] },
    "clean":      { "cache": false, "outputs": [] }
  }
}
```

### Skrypty root `package.json`

| Komenda          | Opis                                        |
|------------------|---------------------------------------------|
| `npm run dev`    | Uruchom dev mode (frontend + backend)       |
| `npm run build`  | Zbuduj wszystkie pakiety                    |
| `npm run test`   | Uruchom testy                               |
| `npm run lint`   | Sprawdz lint we wszystkich pakietach        |
| `npm run type-check` | Sprawdz typy TypeScript                |
| `npm run clean`  | Wyczysc build artefakty                     |
| `npm run docker:dev` | `docker-compose up -d`                  |
| `npm run docker:down` | `docker-compose down`                  |
| `npm run db:setup` | Generuj Prisma + push schema + seed       |

---

## 4. Nginx reverse proxy

### Domena i sciezki

| Sciezka            | Cel                                      | Port docelowy |
|--------------------|------------------------------------------|---------------|
| `/crm/`            | Frontend V1 (Next.js)                    | 9025          |
| `/crm/api/v1/...`  | Backend V1 (Express.js)                  | 3003          |
| `/crm2/`           | Frontend V2 (development, opcjonalny)    | 9026          |
| `/crm2/api/v1/...` | Backend V2 (development, opcjonalny)     | 3002          |
| `/health`          | Health check Nginx                       | -             |
| `/`                | Redirect -> `/crm/`                      | -             |

### Konfiguracja proxy frontend

Plik: `/home/dev/apps/sorto-crm/nginx-crm-config.conf`

```nginx
location /crm {
    location = /crm {
        return 301 /crm/;
    }
    proxy_pass http://localhost:9025/crm;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /crm;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
}
```

### Konfiguracja proxy API

```nginx
location /crm/api/ {
    rewrite ^/crm/api(.*)$ /api$1 break;
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /crm;

    # CORS preflight
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        return 204;
    }
}
```

### Konfiguracja SSL

SSL jest obslugiwany przez Let's Encrypt (Certbot):
```bash
# Instalacja certyfikatu
certbot --nginx -d crm.dev.sorto.ai

# Automatyczne odnawianie -- crontab
0 2 * * * certbot renew --quiet && systemctl reload nginx
```

### Optymalizacje produkcyjne

Plik: `/home/dev/apps/sorto-crm/nginx-optimized.conf`

- **Rate limiting:** `30r/m` dla API, `100r/m` dla statycznych plikow
- **Proxy cache:** `/var/cache/nginx/crm` (max 100MB, 24h nieaktywnosci)
- **Gzip compression:** poziom 6, obsluguje CSS/JS/JSON/XML/SVG
- **Upstream z keepalive:** `keepalive 32` polaczen
- **Statyczne pliki:** cache 30 dni z `immutable`
- **Upstream definitions:**
  ```nginx
  upstream crm_backend_v1 {
      least_conn;
      server 127.0.0.1:3003 max_fails=3 fail_timeout=30s;
      keepalive 32;
  }
  upstream crm_frontend_v1 {
      least_conn;
      server 127.0.0.1:9025 max_fails=3 fail_timeout=30s;
      keepalive 32;
  }
  ```

### Security headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
```

### Blokowanie dostepu do wrazliwych plikow

```nginx
location ~ /\. { deny all; }
location ~ /(package\.json|package-lock\.json|\.env|\.git) { deny all; }
```

---

## 5. Zmienne srodowiskowe

### Pliki konfiguracyjne

| Plik                            | Cel                                   |
|---------------------------------|---------------------------------------|
| `.env.example` (root)           | Przykladowe zmienne calego projektu   |
| `packages/backend/.env.example` | Przykladowe zmienne backendu          |
| `packages/backend/.env`         | Aktywna konfiguracja backendu         |
| `packages/frontend/.env.local`  | Zmienne frontendu (Next.js)           |

### Zmienne -- kategorie

#### Srodowisko i serwer

| Zmienna      | Opis                                  | Przykladowa wartosc    |
|--------------|---------------------------------------|------------------------|
| `NODE_ENV`   | Tryb srodowiska                       | development/production |
| `PORT`       | Port backendu                         | 3001                   |

#### Baza danych

| Zmienna        | Opis                                  |
|----------------|---------------------------------------|
| `DATABASE_URL` | Connection string PostgreSQL          |
| `REDIS_URL`    | Connection string Redis               |
| `CLICKHOUSE_URL` | Connection string ClickHouse (opcjonalny) |

#### Autentykacja JWT

| Zmienna              | Opis                                  |
|----------------------|---------------------------------------|
| `JWT_SECRET`         | Klucz do podpisu JWT (min 32 znaki)   |
| `JWT_REFRESH_SECRET` | Klucz do refresh tokenow (min 32 znaki) |
| `BCRYPT_ROUNDS`      | Liczba rund bcrypt (domyslnie 12)     |

#### Multi-tenancy

| Zmienna              | Opis                                  |
|----------------------|---------------------------------------|
| `DEFAULT_ORG_LIMITS` | JSON z limitami organizacji           |

#### AI / Zewnetrzne API

| Zmienna          | Opis                                  |
|------------------|---------------------------------------|
| `OPENAI_API_KEY` | Klucz API OpenAI                      |
| `AI_SERVICE_URL` | URL serwisu AI                        |
| `PYTHON_API_KEY` | Klucz API Python (RAG/AI)             |

#### Platnosci (Stripe)

| Zmienna                | Opis                                  |
|------------------------|---------------------------------------|
| `STRIPE_SECRET_KEY`    | Klucz API Stripe                      |
| `STRIPE_WEBHOOK_SECRET`| Klucz webhook Stripe                  |

#### Fakturownia

| Zmienna                  | Opis                                  |
|--------------------------|---------------------------------------|
| `FAKTUROWNIA_DOMAIN`     | Domena Fakturownia                    |
| `FAKTUROWNIA_API_TOKEN`  | Token API Fakturownia                 |
| `FAKTUROWNIA_ENVIRONMENT`| Srodowisko (production/sandbox)       |

#### Email (SMTP)

| Zmienna     | Opis                                  |
|-------------|---------------------------------------|
| `SMTP_HOST` | Serwer SMTP                           |
| `SMTP_PORT` | Port SMTP                             |
| `SMTP_USER` | Uzytkownik SMTP                       |
| `SMTP_PASS` | Haslo SMTP (app password)             |

#### Storage (AWS S3)

| Zmienna                 | Opis                                  |
|-------------------------|---------------------------------------|
| `AWS_ACCESS_KEY_ID`     | Klucz dostepu AWS                     |
| `AWS_SECRET_ACCESS_KEY` | Tajny klucz AWS                       |
| `AWS_BUCKET_NAME`       | Nazwa bucketu S3                      |
| `AWS_REGION`            | Region AWS                            |

#### Monitoring

| Zmienna      | Opis                                  |
|--------------|---------------------------------------|
| `SENTRY_DSN` | DSN Sentry do monitorowania bledow    |
| `LOG_LEVEL`  | Poziom logowania (error/warn/info/debug) |

#### Frontend (publiczne)

| Zmienna                               | Opis                                  |
|---------------------------------------|---------------------------------------|
| `NEXT_PUBLIC_API_URL`                 | URL API dla frontendu                 |
| `NEXT_PUBLIC_APP_URL`                 | URL aplikacji                         |
| `NEXT_PUBLIC_APP_VERSION`             | Wersja aplikacji                      |
| `NEXT_PUBLIC_ENVIRONMENT`             | Srodowisko (production/development)   |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | Klucz publiczny Stripe                |

#### SSO (Single Sign-On)

| Zmienna            | Opis                                  |
|--------------------|---------------------------------------|
| `SSO_PLATFORM_URL` | URL platformy SSO                     |
| `SSO_CLIENT_ID`    | Client ID SSO                         |
| `SSO_CLIENT_SECRET`| Client Secret SSO                     |

> **WAZNE:** Nigdy nie commituj plikow `.env` do repozytorium. Uzywaj `.env.example` jako szablonu.

---

## 6. Development workflow

### 6.1 Pierwsze uruchomienie (lokalne)

```bash
# 1. Klonowanie repozytorium
git clone <repo-url> /opt/crm-gtd-smart
cd /opt/crm-gtd-smart

# 2. Instalacja zaleznosci (npm workspaces)
npm install

# 3. Konfiguracja zmiennych srodowiskowych
cp .env.example packages/backend/.env
# Edytuj packages/backend/.env wedlug potrzeb

# 4. Uruchomienie kontenerow Docker (baza danych + Redis)
docker compose -f docker-compose.v1.yml up -d postgres-v1 redis-v1

# 5. Generowanie klienta Prisma
cd packages/backend
npx prisma generate

# 6. Migracja bazy danych
npx prisma migrate dev

# 7. Seed danych (opcjonalny)
npm run db:seed                    # podstawowy seed
# lub
npm run db:seed-comprehensive      # rozbudowany seed (289 rekordow)

# 8. Uruchomienie dev mode (z hot reload)
cd /opt/crm-gtd-smart
npm run dev
```

### 6.2 Uruchomienie z Docker Compose

```bash
# Uruchomienie wszystkich uslug
docker compose -f docker-compose.v1.yml up -d

# Sprawdzenie statusu
docker compose -f docker-compose.v1.yml ps

# Logi pojedynczej uslugi
docker compose -f docker-compose.v1.yml logs -f backend-v1

# Zatrzymanie
docker compose -f docker-compose.v1.yml down
```

### 6.3 Migracje bazy danych (Prisma)

```bash
# ZAWSZE ZROB BACKUP PRZED MIGRACJA!
docker exec -e PGPASSWORD=password crm-postgres-v1 \
  pg_dump -h localhost -U user -d crm_gtd_v1 > backup_before_migration.sql

# Tworzenie nowej migracji
cd packages/backend
npx prisma migrate dev --name nazwa_migracji

# Generowanie klienta po zmianach schema
npx prisma generate

# Sprawdzenie statusu migracji
npx prisma migrate status

# Push schema bez migracji (TYLKO development)
npx prisma db push
```

> **NIGDY nie uzywaj `prisma db push --force-reset` ani `prisma migrate reset` na produkcji!**

### 6.4 Hot reload

- **Frontend (Next.js):** Automatyczny hot reload dzieki `next dev` (port 9025)
- **Backend (Express.js):** Nodemon nasuchuje na zmiany w `src/` (`npm run dev` -> `nodemon src/app.ts`)
- **Docker development:** Wolumeny mapuja lokalne pliki do kontenerow, zapewniajac real-time sync

### 6.5 Komendy deweloperskie

```bash
# Lint
npm run lint

# Type checking
npm run type-check

# Build
npm run build

# Testy
npm run test

# Prisma Studio (przegladarka bazy)
cd packages/backend && npx prisma studio
```

---

## 7. Production deployment

### 7.1 Wdrozenie od zera (nowy VPS)

Skrypt: `/home/dev/apps/sorto-crm/quick-start.sh`

```bash
# Uruchom jako root na swiezym Ubuntu VPS
chmod +x quick-start.sh
./quick-start.sh
```

Skrypt automatycznie:
1. Aktualizuje system i instaluje zaleznosci
2. Instaluje Docker i Docker Compose
3. Konfiguruje firewall UFW (22/80/443)
4. Instaluje Certbot dla SSL
5. Tworzy katalog `/opt/crm-gtd-smart`

### 7.2 Deployment produkcyjny

Skrypt: `/home/dev/apps/sorto-crm/deploy.sh`

```bash
./deploy.sh production
```

Proces:
1. Weryfikacja prereqow (Docker, Docker Compose, plik .env)
2. Zaladowanie zmiennych srodowiskowych
3. Build obrazow Docker (`--no-cache`)
4. Zatrzymanie istniejacych kontenerow
5. Uruchomienie bazy danych i Redis (z oczekiwaniem 30s)
6. Migracja schematu bazy (`prisma generate` + `prisma db push`)
7. Opcjonalny seed danych
8. Uruchomienie wszystkich uslug
9. Weryfikacja health checkow

### 7.3 Aktualizacja istniejacego wdrozenia

Skrypt: `/home/dev/apps/sorto-crm/update.sh`

```bash
./update.sh all        # aktualizuj wszystko
./update.sh backend    # tylko backend
./update.sh frontend   # tylko frontend
```

Proces:
1. `git pull origin main`
2. Build wybranej uslugi (`--no-cache`)
3. Restart uslugi
4. Health check

### 7.4 Multi-version deployment

Skrypt: `/home/dev/apps/sorto-crm/scripts/deploy-versions.sh`

```bash
./scripts/deploy-versions.sh v1       # deploy V1 (produkcja)
./scripts/deploy-versions.sh v2       # deploy V2 (development)
./scripts/deploy-versions.sh both     # deploy obu wersji
./scripts/deploy-versions.sh stop     # zatrzymaj wszystko
./scripts/deploy-versions.sh status   # pokaz status
./scripts/deploy-versions.sh nginx    # aktualizuj Nginx
./scripts/deploy-versions.sh logs-v1  # logi V1
```

### 7.5 Przelaczanie trybow

```bash
# Development -> Production
./switch-to-production.sh
# Efekty: ~80% mniej CPU, ~60% mniej RAM

# Production -> Development
./switch-to-development.sh
```

### 7.6 Restart kontenerow

```bash
# Restart frontendu
docker restart crm-frontend-v1

# Restart backendu
docker restart crm-backend-v1

# Restart bazy danych (OSTROZNIE!)
docker restart crm-postgres-v1

# Reload Nginx (bez downtime)
nginx -t && systemctl reload nginx

# Test po restarcie
curl -s -o /dev/null -w "%{http_code}" https://crm.dev.sorto.ai/crm/
```

### 7.7 Procedura rollback

```bash
# 1. Przywroc konfiguracje z backupu
ls docs/configs/backups/
./docs/configs/backups/YYYYMMDD_HHMMSS/restore.sh

# 2. Przywroc baze danych z backupu
docker exec -i -e PGPASSWORD=password crm-postgres-v1 \
  psql -h localhost -U user -d crm_gtd_v1 < backups/database/backup_YYYYMMDD.sql

# 3. Restart uslug
docker restart crm-frontend-v1 crm-backend-v1
systemctl reload nginx

# 4. Weryfikacja
curl https://crm.dev.sorto.ai/crm/
curl https://crm.dev.sorto.ai/crm/api/v1/
```

### 7.8 Backup konfiguracji

Skrypt: `/home/dev/apps/sorto-crm/docs/configs/backup-current-configs.sh`

```bash
./docs/configs/backup-current-configs.sh
```

Tworzy backup w `docs/configs/backups/<timestamp>/` zawierajacy:
- `next.config.js` -- konfiguracja Next.js
- `postcss.config.js` -- konfiguracja PostCSS
- `tailwind.config.js` -- konfiguracja Tailwind
- `docker-compose.v1.yml` -- Docker Compose
- `nginx-all-apps.conf` -- konfiguracja Nginx
- `app.ts` -- plik serwera
- `frontend-package.json` / `backend-package.json`
- `restore.sh` -- skrypt przywracania

---

## 8. Baza danych

### 8.1 Konfiguracja PostgreSQL

| Parametr      | Wartosc                                  |
|---------------|------------------------------------------|
| **Wersja**    | PostgreSQL 14                            |
| **Kontener**  | `crm-postgres-v1`                        |
| **Baza**      | `crm_gtd_v1`                            |
| **Uzytkownik**| `user`                                   |
| **Port host** | 5434                                     |
| **Port wew.** | 5432                                     |
| **Schemat**   | 97 tabel (Prisma schema)                |
| **Dane**      | 289 rekordow (85.6% tabel wypelnionych) |

### 8.2 Rozszerzenia

Projekt wykorzystuje tabele do przechowywania wektorow (RAG/Semantic Search):
- `vectors` -- glowna tabela wektorow
- `vector_cache` -- cache wyszukiwan wektorowych
- `vector_documents` -- dokumenty zwektoryzowane
- `vector_search_results` -- wyniki wyszukiwan

Wektory sa przechowywane jako JSONB (mock embeddings w development). Docelowo planowane jest uzycie prawdziwego pgvector z embeddings od OpenAI/Cohere.

### 8.3 Polaczenie z baza

```bash
# Z hosta (przez zmapowany port)
psql -h localhost -p 5434 -U user -d crm_gtd_v1

# Z kontenera Docker
docker exec -it crm-postgres-v1 psql -U user -d crm_gtd_v1

# Z innego kontenera w sieci Docker
psql -h postgres-v1 -p 5432 -U user -d crm_gtd_v1
```

### 8.4 Backup bazy danych

```bash
# Pelny backup (zalecany przed kazdymi zmianami)
docker exec -e PGPASSWORD=password crm-postgres-v1 \
  pg_dump -h localhost -U user -d crm_gtd_v1 \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup z kompresja
docker exec -e PGPASSWORD=password crm-postgres-v1 \
  pg_dump -h localhost -U user -d crm_gtd_v1 \
  | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup tylko schematu (bez danych)
docker exec -e PGPASSWORD=password crm-postgres-v1 \
  pg_dump -h localhost -U user -d crm_gtd_v1 --schema-only \
  > schema_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup konkretnej tabeli
docker exec -e PGPASSWORD=password crm-postgres-v1 \
  pg_dump -h localhost -U user -d crm_gtd_v1 -t nazwa_tabeli \
  > tabela_backup.sql
```

### 8.5 Przywracanie bazy danych

```bash
# Przywrocenie pelnego backupu
docker exec -i -e PGPASSWORD=password crm-postgres-v1 \
  psql -h localhost -U user -d crm_gtd_v1 < backup.sql

# Przywrocenie z kompresji
gunzip -c backup.sql.gz | docker exec -i -e PGPASSWORD=password crm-postgres-v1 \
  psql -h localhost -U user -d crm_gtd_v1

# Sprawdzenie stanu bazy po przywroceniu
docker exec crm-postgres-v1 psql -U user -d crm_gtd_v1 \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

### 8.6 Strategia migracji (Prisma)

```
1. BACKUP bazy                     -> pg_dump
2. Edycja schema.prisma            -> dodanie/zmiana modeli
3. npx prisma migrate dev          -> tworzenie migracji
4. npx prisma generate             -> regeneracja klienta
5. Weryfikacja                     -> testy + sprawdzenie danych
6. Ewentualny rollback             -> przywrocenie backupu
```

Pliki migracji: `packages/backend/prisma/migrations/`

### 8.7 Przydatne zapytania diagnostyczne

```sql
-- Liczba aktywnych polaczen
SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';

-- Rozmiar bazy danych
SELECT pg_size_pretty(pg_database_size('crm_gtd_v1'));

-- Rozmiary tabel (top 10)
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables WHERE schemaname='public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;

-- Liczba rekordow w tabelach
SELECT schemaname, relname, n_live_tup
FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;
```

---

## 9. Monitoring i logowanie

### 9.1 Logi kontenerow Docker

```bash
# Logi frontendu
docker logs crm-frontend-v1 --tail 100
docker logs crm-frontend-v1 -f             # streaming

# Logi backendu
docker logs crm-backend-v1 --tail 100
docker logs crm-backend-v1 -f

# Logi bazy danych
docker logs crm-postgres-v1 --tail 50

# Logi Redis
docker logs crm-redis-v1 --tail 50

# Logi TTS
docker logs crm-voice-tts-v1 --tail 50

# Wszystkie logi naraz
docker compose -f docker-compose.v1.yml logs -f
```

### 9.2 Logowanie aplikacyjne (backend)

Backend uzywa **Winston** do logowania:

```typescript
// Konfiguracja: packages/backend/src/config/logger.ts
// Middleware: express-winston w app.ts

// Poziomy logowania: error, warn, info, debug
// Zmiana poziomu: LOG_LEVEL=debug (w .env)
```

- Zapytania HTTP sa logowane automatycznie (metoda, URL, status, czas)
- Endpoint `/health` jest wylaczony z logow
- Pliki statyczne sa wylaczone z logow

### 9.3 Logowanie wykonan AI

Tabela `ai_executions` w PostgreSQL przechowuje:
- ID wykonania
- ID reguly AI
- Status (success/failure)
- Czas wykonania
- Dane wejsciowe i wyjsciowe
- Bledy

### 9.4 Health check endpoints

| Endpoint                    | Usluga          | Odpowiedz                                |
|-----------------------------|------------------|-------------------------------------------|
| `GET /health` (backend)     | crm-backend-v1   | `{ status, timestamp, environment, version }` |
| `GET /health` (Nginx)       | Nginx            | `200 "healthy\n"`                         |
| `GET /health` (TTS)         | crm-voice-tts-v1 | `{ status, model_loaded, service }`       |
| `localhost:3000/health`     | crm-frontend-v1  | Dockerfile HEALTHCHECK                    |

### 9.5 Skrypt monitoringu

Skrypt: `/home/dev/apps/sorto-crm/monitor-performance.sh`

```bash
./monitor-performance.sh
```

Sprawdza:
- Status kontenerow Docker
- Zuzycie zasobow (CPU, RAM, I/O sieciowy, I/O dyskowy)
- Zasoby systemowe (CPU cores, RAM, dysk)
- Health checki wszystkich uslug
- Aktywne polaczenia bazy danych
- URL-e aplikacji

```bash
# Ciagly monitoring (co 5 sekund)
watch -n 5 ./monitor-performance.sh

# Docker stats (real-time)
docker stats

# Docker stats -- jednorazowe
docker stats --no-stream --format \
  "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"
```

### 9.6 Monitoring Nginx

```nginx
# Wewnetrzny endpoint statusu (tylko localhost)
server {
    listen 127.0.0.1:8080;
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

```bash
curl http://127.0.0.1:8080/nginx_status
```

### 9.7 Cron monitoring

Skrypt `system-optimization.sh` konfiguruje automatyczny monitoring:

```bash
# Co 5 minut -- log do /var/log/crm-monitor.log
*/5 * * * * /usr/local/bin/crm-monitor.sh >> /var/log/crm-monitor.log 2>&1
```

### 9.8 Docker daemon -- limity logow

Konfiguracja (`/etc/docker/daemon.json`):
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Kazdy kontener ma maksymalnie 3 pliki logow po 10MB (30MB max per kontener).

---

## 10. Bezpieczenstwo

### 10.1 Izolacja sieci Docker

- Wszystkie kontenery sa w prywatnej sieci `crm-v1-network` (driver: bridge)
- Komunikacja miedzy kontenerami odbywa sie przez wewnetrzne nazwy DNS
- PostgreSQL i Redis nie sa bezposrednio dostepne z Internetu
- Port 5434 (PostgreSQL) i 6381 (Redis) sa zmapowane tylko na localhost

### 10.2 Firewall (UFW)

```bash
# Dozwolone porty
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS

# Wszystko inne -- zablokowane
ufw default deny incoming
ufw default allow outgoing
```

### 10.3 SSL termination

- SSL jest terminowany na poziomie Nginx
- Certyfikat Let's Encrypt (automatyczne odnawianie przez Certbot)
- Komunikacja wewnetrzna (Nginx -> kontenery) odbywa sie po HTTP
- Redirect HTTP -> HTTPS na poziomie Nginx

### 10.4 Naglowki bezpieczenstwa

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

### 10.5 Middleware bezpieczenstwa (backend)

```typescript
// Helmet.js -- zestaw naglowkow bezpieczenstwa
app.use(helmet({
  contentSecurityPolicy: { ... },
  crossOriginEmbedderPolicy: false,
}));

// CORS -- kontrola dostepu
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

// Rate limiting -- ochrona przed DDoS
// 500 requestow / 15 minut per IP
// 2000 requestow / 15 minut per uzytkownik
app.use(generalRateLimit);

// Limity payloadu -- max 10MB
app.use(express.json({ limit: '10mb' }));
```

### 10.6 Autentykacja

- JWT tokeny z krotkim czasem zycia (15 minut)
- Refresh tokeny z dluzszym czasem zycia (7 dni)
- Hasla hashowane bcrypt (12 rund)
- Row Level Security (RLS) w PostgreSQL (wlaczony w produkcji)

### 10.7 Zarzadzanie zmiennymi srodowiskowymi

- Sekrety NIE sa przechowywane w repozytorium
- Pliki `.env` sa w `.gitignore`
- Uzywa sie `.env.example` jako szablonu
- Walidacja zmiennych srodowiskowych z Zod na starcie aplikacji

### 10.8 Blokowanie dostepu Nginx

```nginx
# Blokada plikow konfiguracyjnych
location ~ /\. { deny all; }
location ~ /(package\.json|package-lock\.json|\.env|\.git) { deny all; }
```

---

## 11. Troubleshooting

### Problem: Kontener nie startuje

```bash
# Sprawdz logi kontenera
docker logs crm-backend-v1 --tail 50

# Sprawdz status
docker inspect crm-backend-v1 | grep -A 10 "State"

# Sprawdz health check
docker inspect crm-backend-v1 | grep -A 20 "Health"

# Restart kontenera
docker restart crm-backend-v1
```

### Problem: Frontend zwraca 502 Bad Gateway

```bash
# 1. Sprawdz czy kontener dziala
docker ps | grep crm-frontend-v1

# 2. Sprawdz logi Nginx
tail -20 /var/log/nginx/error.log

# 3. Sprawdz konfiguracje Nginx
nginx -t

# 4. Sprawdz dostepnosc frontendu
curl -I http://localhost:9025

# 5. Restart
docker restart crm-frontend-v1
systemctl reload nginx
```

### Problem: Backend nie odpowiada na /health

```bash
# 1. Sprawdz logi
docker logs crm-backend-v1 --tail 100

# 2. Sprawdz czy port jest otwarty
curl http://localhost:3003/health

# 3. Sprawdz polaczenie z baza
docker exec crm-postgres-v1 pg_isready -U user -d crm_gtd_v1

# 4. Sprawdz polaczenie z Redis
docker exec crm-redis-v1 redis-cli ping

# 5. Restart backendu
docker restart crm-backend-v1
```

### Problem: Baza danych nie odpowiada

```bash
# 1. Sprawdz status
docker exec crm-postgres-v1 pg_isready -U user

# 2. Sprawdz logi
docker logs crm-postgres-v1 --tail 50

# 3. Sprawdz wolumen
docker volume inspect sorto-crm_postgres_v1_data

# 4. Sprawdz miejsce na dysku
df -h

# 5. Restart bazy (OSTROZNIE -- poczekaj az zapytania sie skoncza)
docker restart crm-postgres-v1
```

### Problem: Brak pamieci / wysoki CPU

```bash
# 1. Sprawdz zuzycie zasobow
docker stats --no-stream

# 2. Sprawdz procesy systemowe
htop

# 3. Sprawdz pamiec
free -h

# 4. Wyczysci Docker (obrazy, cache)
docker system prune -af --volumes  # UWAGA: usunie niezuzywane wolumeny!
# Bezpieczniejsza wersja:
docker system prune -af            # bez usuwania wolumenow

# 5. Uruchom optymalizacje
./system-optimization.sh
```

### Problem: Migracja Prisma nie dziala

```bash
# 1. BACKUP!
docker exec -e PGPASSWORD=password crm-postgres-v1 \
  pg_dump -h localhost -U user -d crm_gtd_v1 > emergency_backup.sql

# 2. Sprawdz status migracji
cd packages/backend
npx prisma migrate status

# 3. Zresetuj schema klienta
npx prisma generate

# 4. Sprobuj ponownie
npx prisma migrate dev

# 5. W razie problemow -- przywroc backup
docker exec -i -e PGPASSWORD=password crm-postgres-v1 \
  psql -h localhost -U user -d crm_gtd_v1 < emergency_backup.sql
```

### Problem: Nginx nie laduje konfiguracji

```bash
# 1. Testuj konfiguracje
nginx -t

# 2. Sprawdz syntax
nginx -T | grep -A 5 "crm"

# 3. Przywroc z backupu
ls docs/configs/backups/
cp docs/configs/backups/<najnowszy>/nginx-all-apps.conf /etc/nginx/sites-available/all-apps

# 4. Reload
nginx -t && systemctl reload nginx
```

### Problem: WebSocket (terminal) nie dziala

```bash
# 1. Sprawdz konfiguracje Nginx (musi miec upgrade headers)
#    proxy_set_header Upgrade $http_upgrade;
#    proxy_set_header Connection "upgrade";

# 2. Sprawdz czy backend obsluguje WebSocket
curl -v -H "Upgrade: websocket" http://localhost:3003/ws/terminal

# 3. Sprawdz timeout (musi byc dlugi dla WS)
#    proxy_read_timeout 86400;
```

### Problem: Voice TTS nie dziala

```bash
# 1. Sprawdz status
curl http://localhost:5002/health

# 2. Test syntezy
curl -X POST "http://localhost:5002/api/tts" \
  -F "text=Test" -F "language=pl" -o /tmp/test.wav

# 3. Sprawdz logi
docker logs crm-voice-tts-v1

# 4. Restart
docker restart crm-voice-tts-v1
```

### Szybka diagnostyka -- kompletna

```bash
# Jednolinijkowe sprawdzenie calego systemu
echo "Frontend:" && curl -s -o /dev/null -w "%{http_code}" http://localhost:9025 && echo "" && \
echo "Backend:" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/health && echo "" && \
echo "PostgreSQL:" && docker exec crm-postgres-v1 pg_isready -U user && \
echo "Redis:" && docker exec crm-redis-v1 redis-cli ping && \
echo "TTS:" && curl -s -o /dev/null -w "%{http_code}" http://localhost:5002/health && echo "" && \
echo "Nginx:" && nginx -t 2>&1 | tail -1
```

---

## Dodatek A: Porownanie trybow Development vs Production

| Aspekt              | Development                          | Production                              |
|---------------------|--------------------------------------|-----------------------------------------|
| `NODE_ENV`          | development                          | production                              |
| Frontend build      | Dev server (hot reload)              | `next build` + `next start`            |
| Backend             | `ts-node` z nodemon                  | `ts-node --transpile-only`             |
| CPU (frontend)      | ~100-300%                            | ~5-20%                                 |
| RAM (frontend)      | ~500MB-1GB                           | ~100-200MB                             |
| Docker Compose      | `docker-compose.v1.yml`             | `docker-compose.v1-production.yml`     |
| Dockerfile frontend | `Dockerfile` / `Dockerfile.dev`     | `Dockerfile.production`                |
| RLS (PostgreSQL)    | Wylaczony                           | Wlaczony                               |
| Logowanie           | debug                                | info/warn                               |
| Rate limiting       | Luźniejszy                           | Scisly (30r/m API)                     |

## Dodatek B: Porty uslug -- pelna mapa

| Port  | Usluga                     | Siec               |
|-------|----------------------------|---------------------|
| 80    | Nginx (HTTP)               | Publiczny           |
| 443   | Nginx (HTTPS)              | Publiczny           |
| 9025  | Frontend V1                | Host only           |
| 9026  | Frontend V2 (opcjonalny)   | Host only           |
| 3003  | Backend V1                 | Host only           |
| 3002  | Backend V2 (opcjonalny)    | Host only           |
| 5434  | PostgreSQL V1              | Host only           |
| 5433  | PostgreSQL V2 (opcjonalny) | Host only           |
| 6381  | Redis V1                   | Host only           |
| 6380  | Redis V2 (opcjonalny)      | Host only           |
| 5002  | Voice TTS V1               | Host only           |
| 8080  | Nginx status               | Tylko localhost     |

## Dodatek C: Wazne sciezki plikow

| Plik / Katalog                                          | Opis                                  |
|---------------------------------------------------------|---------------------------------------|
| `/home/dev/apps/sorto-crm/docker-compose.v1.yml`       | Docker Compose (V1)                   |
| `/home/dev/apps/sorto-crm/packages/frontend/Dockerfile`| Dockerfile frontendu                  |
| `/home/dev/apps/sorto-crm/packages/backend/Dockerfile` | Dockerfile backendu                   |
| `/home/dev/apps/sorto-crm/Dockerfile.mock-tts`         | Dockerfile Mock TTS                   |
| `/home/dev/apps/sorto-crm/packages/backend/src/app.ts` | Glowny plik serwera Express           |
| `/home/dev/apps/sorto-crm/packages/backend/prisma/schema.prisma` | Schemat bazy danych    |
| `/home/dev/apps/sorto-crm/packages/backend/.env`       | Zmienne srodowiskowe backendu         |
| `/home/dev/apps/sorto-crm/nginx-crm-config.conf`       | Konfiguracja Nginx CRM                |
| `/home/dev/apps/sorto-crm/nginx-production.conf`       | Konfiguracja Nginx produkcja          |
| `/home/dev/apps/sorto-crm/nginx-optimized.conf`        | Konfiguracja Nginx zoptymalizowana    |
| `/etc/nginx/sites-available/all-apps`                   | Aktywna konfiguracja Nginx na VPS     |
| `/home/dev/apps/sorto-crm/docs/configs/`               | Backup konfiguracji                   |
| `/home/dev/apps/sorto-crm/backups/`                     | Katalog backupow                      |
| `/home/dev/apps/sorto-crm/deploy.sh`                   | Skrypt deploymentu                    |
| `/home/dev/apps/sorto-crm/update.sh`                   | Skrypt aktualizacji                   |
| `/home/dev/apps/sorto-crm/monitor-performance.sh`      | Skrypt monitoringu                    |

---

> **Autor:** Wygenerowano automatycznie na podstawie analizy kodu zrodlowego projektu CRM-GTD Smart.
