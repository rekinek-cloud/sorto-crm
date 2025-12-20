# CRM-GTD Smart - Dokumentacja Techniczna i Manual Użytkownika

## 📋 Spis Treści

1. [Przegląd Systemu](#przegląd-systemu)
2. [Architektura Techniczna](#architektura-techniczna)
3. [Instalacja i Konfiguracja](#instalacja-i-konfiguracja)
4. [Git Flow i Strategia Wielowersyjna](#git-flow-i-strategia-wielowersyjna)
5. [Manual Użytkownika](#manual-użytkownika)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Kontakt i Wsparcie](#kontakt-i-wsparcie)

---

## 🎯 Przegląd Systemu

### Czym jest CRM-GTD Smart?

CRM-GTD Smart to zaawansowana aplikacja webowa łącząca system zarządzania relacjami z klientami (CRM) z metodologią Getting Things Done (GTD) Davida Allena. Aplikacja została zaprojektowana dla zespołów i organizacji, które chcą efektywnie zarządzać zadaniami, projektami i relacjami biznesowymi w jednym miejscu.

### Wersjonowanie i Git Flow

System wykorzystuje strategię Git Flow umożliwiającą równoległe rozwijanie i testowanie różnych wersji:
- **V1 (Produkcja)**: Stabilna wersja dostępna pod `/crm/`
- **V2 (Development)**: Wersja rozwojowa dostępna pod `/crm2/`

### Główne Funkcjonalności

#### 🎯 Moduł GTD (Getting Things Done)
- **Skrzynka odbiorcza** - Szybkie przechwytywanie pomysłów i zadań
- **Następne działania** - Lista konkretnych kroków do wykonania
- **Oczekuje na** - Śledzenie zadań delegowanych innym
- **Kiedyś/Może** - Przechowywanie przyszłych pomysłów
- **Konteksty** - Organizacja zadań według miejsca/narzędzi (@komputer, @telefon, @biuro)
- **Poziomy energii** - Dopasowanie zadań do aktualnej energii
- **Tryby skupienia** - Zarządzanie różnymi stanami mentalnymi

#### 🏢 Moduł CRM
- **Zarządzanie firmami** - Pełne profile klientów i kontrahentów
- **Baza kontaktów** - Szczegółowe informacje o osobach
- **Śledzenie okazji** - Pipeline sprzedażowy z etapami
- **Historia komunikacji** - Centralna rejestracja wszystkich interakcji
- **Segmentacja klientów** - Automatyczne kategoryzowanie kontaktów

#### 📊 Zarządzanie Projektami
- **Projekty SMART** - Automatyczna analiza celów według metodologii SMART
- **Śledzenie postępów** - Wizualne dashboardy z metrykami
- **Harmonogramy** - Planowanie i monitorowanie terminów
- **Współpraca zespołowa** - Wspólne zarządzanie zadaniami

#### 📈 Analytics i Reporting
- **Dashboardy w czasie rzeczywistym** - KPI i metryki biznesowe
- **Raporty sprzedażowe** - Analiza pipeline i konwersji
- **Produktywność osobista** - Statystyki wykonania zadań GTD
- **Analiza trendów** - Długoterminowe wzorce w danych

---

## 🏗️ Architektura Techniczna

### Stack Technologiczny

#### Frontend
- **Framework**: Next.js 14.2.30 (React 18)
- **Język**: TypeScript
- **Stylowanie**: Tailwind CSS
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **Routing**: Next.js App Router
- **UI Components**: Headless UI + Custom Components

#### Backend
- **Runtime**: Node.js 22.16.0
- **Framework**: Express.js
- **Język**: TypeScript
- **ORM**: Prisma 5.22.0
- **Walidacja**: Zod
- **Autoryzacja**: JWT (JSON Web Tokens)
- **Szyfrowanie**: bcrypt
- **Loader**: tsx (TypeScript execution)

#### Bazy Danych
- **Główna**: PostgreSQL 14
- **Cache/Sessions**: Redis 7
- **Schema Management**: Prisma Migrate
- **Seed Data**: Automatyczne skrypty inicjalizacyjne

#### Infrastruktura
- **Reverse Proxy**: Nginx 1.18.0
- **Konteneryzacja**: Docker
- **Proces Management**: nodemon (dev)
- **Security**: Helmet.js, CORS, Rate Limiting

### Architektura Aplikacji

#### Architektura Multi-Version

```
┌──────────────────────┐         ┌──────────────────────┐
│      V1 (Prod)       │         │    V2 (Dev)         │
├──────────────────────┤         ├──────────────────────┤
│ Frontend: 9025       │         │ Frontend: 9026       │
│ Backend:  3001       │         │ Backend:  3002       │
│ DB:       5432       │         │ DB:       5433       │
│ Redis:    6379       │         │ Redis:    6380       │
└──────────────────────┘         └──────────────────────┘
           ▼                               ▼
    ┌──────────────────────────────────────────┐
    │              Nginx (Port 80)              │
    │  /crm/  → V1        /crm2/ → V2          │
    └──────────────────────────────────────────┘

```

#### Struktura pojedynczej wersji

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Databases     │
│   Next.js       │◄──►│   Express.js    │◄──►│   PostgreSQL    │
│   Port: 9025    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    │                 │
         ▲                        ▲            │     Redis       │
         │                        │            │   Port: 6379    │
         ▼                        ▼            └─────────────────┘
┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   External      │
│   Port: 80      │    │   Services      │
│   /crm/ → FE    │    │   - Stripe      │
│   /crm/api/ → BE│    │   - Email       │
└─────────────────┘    │   - Storage     │
                       └─────────────────┘
```

---

## ⚙️ Instalacja i Konfiguracja

### Wymagania Systemowe

- **System operacyjny**: Linux (Ubuntu 20.04+ zalecane)
- **Node.js**: v22.16.0 lub nowszy
- **Docker**: v20.10+ (dla baz danych)
- **Nginx**: v1.18+ (reverse proxy)
- **RAM**: Minimum 4GB, zalecane 8GB
- **Dysk**: Minimum 10GB wolnego miejsca

### Krok 1: Instalacja Zależności

```bash
# Instalacja Node.js (z NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalacja Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Instalacja Nginx
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Krok 2: Konfiguracja Baz Danych

```bash
# PostgreSQL w Docker
docker run --name postgres-crm \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=crm_gtd_dev \
  -p 5432:5432 \
  -d postgres:14

# Redis w Docker
docker run --name redis-crm \
  -p 6379:6379 \
  -d redis:7-alpine
```

### Krok 3: Konfiguracja Aplikacji

```bash
# Klonowanie repozytorium
cd /opt
git clone <repository-url> crm-gtd-smart
cd crm-gtd-smart

# Instalacja pakietów
npm install

# Konfiguracja środowiska Backend
cd packages/backend
cp .env.example .env

# Edytuj plik .env z właściwymi wartościami:
nano .env
```

#### Przykład pliku .env dla Backend:

```env
# Node Environment
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/crm_gtd_dev
REDIS_URL=redis://localhost:6379

# JWT Configuration (ZMIEŃ w produkcji!)
JWT_SECRET=super-bezpieczny-klucz-jwt-min-32-znakow
JWT_REFRESH_SECRET=super-bezpieczny-refresh-klucz-min-32-znakow
BCRYPT_ROUNDS=12

# Frontend URL
NEXT_PUBLIC_APP_URL=http://yourdomain.com/crm
```

```bash
# Generowanie Prisma Client i seed bazy
npx prisma generate
npx prisma db push
npx prisma db seed

# Konfiguracja Frontend
cd ../frontend
echo "NEXT_PUBLIC_API_URL=/crm" > .env.local
```

### Krok 4: Konfiguracja Nginx

```bash
sudo nano /etc/nginx/sites-available/crm-gtd
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Main location for static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Next.js static assets
    location /_next/ {
        proxy_pass http://127.0.0.1:9025/_next/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /crm/api/v1 {
        proxy_pass http://127.0.0.1:3001/;
        rewrite ^/crm/api/v1(.*)$ /api/v1$1 break;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for Next.js HMR
    location /_next/webpack-hmr {
        proxy_pass http://127.0.0.1:9025/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # CRM application frontend
    location /crm/ {
        proxy_pass http://127.0.0.1:9025/;
        rewrite ^/crm(/.*)$ $1 break;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Aktywacja konfiguracji
sudo ln -s /etc/nginx/sites-available/crm-gtd /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Krok 5: Uruchomienie Aplikacji

#### Opcja A: Deployment Multi-Version (Zalecane)

```bash
# Używaj skryptu deployment
cd /opt/crm-gtd-smart

# Uruchom V1 (produkcja)
./scripts/deploy-versions.sh v1

# Uruchom V2 (development)
./scripts/deploy-versions.sh v2

# Uruchom obie wersje
./scripts/deploy-versions.sh both

# Sprawdź status
./scripts/deploy-versions.sh status
```

#### Opcja B: Ręczne uruchomienie

```bash
# Uruchomienie w trybie produkcyjnym
cd /opt/crm-gtd-smart

# Build frontend
cd packages/frontend
npm run build
npm run start &

# Start backend
cd ../backend
npm run start &
```

### Krok 6: Konfiguracja PM2 (opcjonalne, ale zalecane)

```bash
# Instalacja PM2
npm install -g pm2

# Konfiguracja ecosystem
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'crm-frontend',
      cwd: './packages/frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 9025
      }
    },
    {
      name: 'crm-backend',
      cwd: './packages/backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
EOF

# Uruchomienie przez PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔀 Git Flow i Strategia Wielowersyjna

### Struktura Gałęzi (Branch Structure)

System CRM-GTD Smart wykorzystuje zaawansowaną strategię Git Flow pozwalającą na równoległe rozwijanie i testowanie wielu wersji aplikacji:

#### Gałęzie Główne

1. **master** - Gałąź główna repozytorium, punkt odniesienia dla wszystkich wersji
2. **production-v1** - Stabilna wersja produkcyjna V1 (dostępna pod `/crm/`)
3. **develop-v1** - Gałąź rozwojowa dla V1, tu trafiają nowe funkcje przed wdrożeniem
4. **develop-v2** - Gałąź rozwojowa dla V2 (dostępna pod `/crm2/`), przyszła wersja aplikacji

#### Gałęzie Pomocnicze

- **feature/v1-nazwa** - Gałęzie dla nowych funkcji V1
- **feature/v2-nazwa** - Gałęzie dla nowych funkcji V2
- **hotfix/nazwa** - Gałęzie dla krytycznych poprawek (bazują na production-v1)
- **release/v1.x.x** - Gałęzie przygotowawcze przed wdrożeniem

### Korzystanie ze Skryptu git-workflow.sh

Skrypt `git-workflow.sh` automatyzuje najczęstsze operacje w ramach Git Flow:

#### Podstawowe Komendy

```bash
# Sprawdzenie statusu wszystkich gałęzi
./scripts/git-workflow.sh status

# Przełączanie między wersjami
./scripts/git-workflow.sh switch-v1      # Przełącz na develop-v1
./scripts/git-workflow.sh switch-v2      # Przełącz na develop-v2
./scripts/git-workflow.sh switch-prod    # Przełącz na production-v1

# Listowanie wszystkich gałęzi
./scripts/git-workflow.sh list-branches
```

#### Tworzenie Nowych Funkcji

```bash
# Nowa funkcja dla V1
./scripts/git-workflow.sh new-feature v1 user-management

# Nowa funkcja dla V2
./scripts/git-workflow.sh new-feature v2 new-dashboard

# Krytyczna poprawka (hotfix)
./scripts/git-workflow.sh new-hotfix critical-login-bug
```

#### Deployment i Merge

```bash
# Merge develop-v1 do production-v1
./scripts/git-workflow.sh merge-v1

# Deploy V1 na produkcję
./scripts/git-workflow.sh deploy-v1

# Deploy V2 na środowisko deweloperskie
./scripts/git-workflow.sh deploy-v2
```

### Workflow Wielowersyjnego Wdrożenia

#### 1. Standardowy Przepływ Pracy dla Nowej Funkcji

```bash
# 1. Utwórz nową gałąź feature
./scripts/git-workflow.sh new-feature v1 nowa-funkcja

# 2. Pracuj nad funkcją
# ... zmiany w kodzie ...

# 3. Commit zmian
git add .
git commit -m "Dodaj nową funkcję X

- Implementacja komponentu Y
- Aktualizacja API
- Testy jednostkowe"

# 4. Push do repozytorium
git push origin feature/v1-nowa-funkcja

# 5. Utwórz Pull Request do develop-v1
# (przez interfejs GitHub/GitLab)

# 6. Po code review i merge, przełącz się na develop-v1
./scripts/git-workflow.sh switch-v1
git pull origin develop-v1

# 7. Test na środowisku deweloperskim
./scripts/deploy-versions.sh v1

# 8. Gdy wszystko działa, merge do produkcji
./scripts/git-workflow.sh merge-v1

# 9. Deploy na produkcję
./scripts/git-workflow.sh deploy-v1
```

#### 2. Przepływ dla Hotfixa

```bash
# 1. Utwórz gałąź hotfix
./scripts/git-workflow.sh new-hotfix login-bug

# 2. Napraw błąd
# ... poprawki w kodzie ...

# 3. Commit i push
git add .
git commit -m "Hotfix: Napraw błąd logowania

- Problem z walidacją tokena JWT
- Aktualizacja middleware autoryzacji"

git push origin hotfix/login-bug

# 4. Merge do production-v1
git checkout production-v1
git merge hotfix/login-bug --no-ff

# 5. Merge również do develop-v1 (aby zachować spójność)
git checkout develop-v1
git merge hotfix/login-bug --no-ff

# 6. Deploy na produkcję
./scripts/git-workflow.sh deploy-v1

# 7. Usuń gałąź hotfix
git branch -d hotfix/login-bug
```

#### 3. Migracja z V1 do V2

```bash
# 1. Upewnij się, że V1 jest stabilne
./scripts/git-workflow.sh status

# 2. Przełącz na V2
./scripts/git-workflow.sh switch-v2

# 3. Cherry-pick wybranych commitów z V1 (opcjonalnie)
git cherry-pick <commit-hash>

# 4. Lub merge całego develop-v1 do develop-v2
git merge develop-v1 --no-ff -m "Sync V1 features to V2"

# 5. Rozwiąż konflikty jeśli występują
# ... rozwiązywanie konfliktów ...

# 6. Test V2
./scripts/deploy-versions.sh v2

# 7. Stopniowa migracja użytkowników
# - Początkowo tylko testerzy na /crm2/
# - Następnie wybrani użytkownicy
# - Finalnie wszyscy
```

### Najlepsze Praktyki dla Pracy z V1 i V2

#### 1. Organizacja Pracy

- **V1 (Produkcja)**: Tylko stabilne, przetestowane funkcje
- **V2 (Development)**: Eksperymentalne funkcje, refactoring, nowe technologie
- **Hotfixy**: Zawsze bazuj na production-v1 i merguj do obu wersji
- **Feature branches**: Zawsze wskazuj wersję w nazwie (v1/v2)

#### 2. Konwencje Nazewnictwa

```bash
# Gałęzie feature
feature/v1-user-management    # Funkcja dla V1
feature/v2-new-ui             # Funkcja dla V2

# Gałęzie release
release/v1.2.0                # Release V1
release/v2.0.0-beta.1         # Beta release V2

# Tagi
v1.2.0                        # Tag produkcyjny V1
v2.0.0-beta.1                 # Tag beta V2
```

#### 3. Commit Messages

Używaj jasnych, opisowych komunikatów commitów:

```bash
# Dobry przykład
git commit -m "V1: Dodaj filtrowanie w module CRM

- Implementacja filtrów po statusie i kategorii
- Optymalizacja zapytań do bazy danych
- Unit testy dla nowych endpointów"

# Zły przykład
git commit -m "fix bug"
```

#### 4. Synchronizacja Między Wersjami

```bash
# Regularnie synchronizuj zmiany z V1 do V2
git checkout develop-v2
git merge develop-v1 --no-ff -m "Sync: Import V1 updates to V2"

# Selective merge - tylko wybrane pliki
git checkout develop-v2
git checkout develop-v1 -- packages/backend/src/services/auth.service.ts
git commit -m "Sync: Import auth service from V1"
```

#### 5. Testing Strategy

1. **V1 Testing**:
   - Wszystkie zmiany najpierw na develop-v1
   - Testy automatyczne przed merge do production
   - Smoke testy po deployment

2. **V2 Testing**:
   - Bardziej liberalne podejście do eksperymentów
   - A/B testing z wybranymi użytkownikami
   - Performance testing nowych rozwiązań

#### 6. Rollback Procedures

```bash
# Rollback V1 do poprzedniej wersji
git checkout production-v1
git log --oneline -10  # Znajdź poprzedni stabilny commit
git reset --hard <commit-hash>
git push --force-with-lease origin production-v1

# Alternatywnie, użyj tagów
git checkout v1.1.0  # Poprzednia stabilna wersja
git branch -f production-v1
git checkout production-v1
```

#### 7. Dokumentacja Zmian

Prowadź CHANGELOG dla każdej wersji:

```markdown
# CHANGELOG-V1.md
## [1.2.0] - 2025-06-18
### Added
- Nowy moduł raportowania
- Eksport do PDF

### Fixed
- Błąd logowania przy wygasłej sesji

# CHANGELOG-V2.md
## [2.0.0-beta.1] - 2025-06-18
### Breaking Changes
- Nowa struktura API
- Zmieniony format odpowiedzi JSON
```

#### 8. Monitoring i Alerty

- Monitoruj osobno metryki dla V1 i V2
- Ustaw alerty dla krytycznych błędów
- Śledź wydajność obu wersji
- Analizuj feedback użytkowników V2

### Przykładowy Harmonogram Wdrożenia

```mermaid
gantt
    title Harmonogram Migracji V1 → V2
    dateFormat  YYYY-MM-DD
    section V1 Maintenance
    Hotfixy i poprawki     :2025-06-01, 180d
    Wsparcie użytkowników  :2025-06-01, 365d
    
    section V2 Development
    Core features         :2025-06-01, 90d
    Beta testing         :2025-09-01, 60d
    Performance tuning   :2025-10-01, 30d
    
    section Migration
    Pilot users (5%)     :2025-11-01, 30d
    Gradual rollout      :2025-12-01, 60d
    Full migration       :2026-02-01, 30d
```

---

## 👤 Manual Użytkownika

### Pierwsze Kroki

#### 1. Logowanie do Systemu

1. Otwórz przeglądarkę internetową
2. Przejdź na adres: `http://yourdomain.com/crm/auth/login`
3. Wprowadź dane demo:
   - **Email**: `demo@example.com`
   - **Hasło**: `demo123`
4. Kliknij "Zaloguj się"

#### 2. Nawigacja po Interfejsie

Po zalogowaniu zobaczysz główny dashboard z następującymi sekcjami:

##### 🏠 **Pulpit Główny**
- Przegląd najważniejszych metryk
- Ostatnie aktywności
- Szybkie akcje
- Kalendarz i nadchodzące zadania

##### 📋 **Moduł GTD**
- **Skrzynka**: Szybkie przechwytywanie pomysłów
- **Następne działania**: Lista zadań do wykonania
- **Oczekuje na**: Delegowane zadania
- **Kiedyś/Może**: Przyszłe pomysły
- **Konteksty**: Organizacja według miejsca/narzędzi

##### 🏢 **CRM**
- **Firmy**: Zarządzanie klientami korporacyjnymi
- **Kontakty**: Baza osób
- **Okazje**: Pipeline sprzedażowy
- **Komunikacja**: Historia interakcji

##### 📊 **Projekty i Analityka**
- **Projekty**: Zarządzanie większymi inicjatywami
- **Zadania**: Szczegółowe planowanie
- **Analityka**: Raporty i dashboardy

### Szczegółowy Przewodnik po Funkcjach

#### 📥 Praca z GTD - Skrzynka Odbiorcza

1. **Dodawanie nowego elementu**:
   - Kliknij przycisk "+" w skrzynce
   - Opisz w kilku słowach co przychodzi Ci do głowy
   - Kliknij "Dodaj" - nie zastanawiaj się nad kategoryzacją!

2. **Przetwarzanie skrzynki** (zalecane: codziennie):
   - Otwórz pierwszy element
   - Zadaj sobie pytanie: "Co to właściwie jest?"
   - Wybierz opcję:
     - **Usuń** - jeśli to już nieaktualny pomysł
     - **Informacja** - przenieś do materiałów referencyjnych
     - **Zadanie** - jeśli wymaga działania

3. **Dwuminutowa reguła**:
   - Jeśli zadanie zajmie mniej niż 2 minuty - zrób je od razu
   - Jeśli więcej - zaplanuj na później

#### ✅ Zarządzanie Następnymi Działaniami

1. **Przeglądanie listy**:
   - Filtruj według kontekstu (@komputer, @telefon, @biuro)
   - Sortuj według priorytetu lub czasu potrzebnego
   - Wybierz zgodnie z aktualną energią i dostępnym czasem

2. **Wykonywanie zadań**:
   - Kliknij zadanie aby zobaczyć szczegóły
   - Użyj timera Pomodoro (wbudowanego)
   - Oznacz jako zakończone po wykonaniu

3. **Konteksty** - wykorzystuj je efektywnie:
   - **@komputer** - zadania wymagające komputera
   - **@telefon** - połączenia do wykonania
   - **@biuro** - sprawy do załatwienia w pracy
   - **@dom** - zadania domowe
   - **@zakupy** - lista zakupów

#### 🏢 Zarządzanie CRM

##### Dodawanie Nowej Firmy

1. Przejdź do sekcji "Firmy"
2. Kliknij "Dodaj firmę"
3. Wypełnij formularz:
   - **Nazwa firmy** (wymagane)
   - **NIP** - automatyczna walidacja
   - **Adres** - pełny adres siedziby
   - **Dane kontaktowe** - telefon, email, strona www
   - **Kategoria** - typ działalności
   - **Status** - aktywny/nieaktywny klient

##### Zarządzanie Kontaktami

1. **Dodawanie kontaktu**:
   - Powiąż z firmą lub dodaj jako osobę prywatną
   - Uzupełnij pełne dane: imię, nazwisko, stanowisko
   - Dodaj zdjęcie profilowe
   - Zapisz preferencje komunikacyjne

2. **Historia interakcji**:
   - Automatyczne logowanie emaili (po konfiguracji)
   - Ręczne dodawanie notatek ze spotkań
   - Śledzenie wszystkich rozmów telefonicznych

##### Pipeline Sprzedażowy

1. **Etapy domyślne**:
   - **Lead** - Pierwszy kontakt
   - **Kwalifikacja** - Sprawdzenie potrzeb
   - **Propozycja** - Wysłanie oferty
   - **Negocjacje** - Finalizowanie warunków
   - **Zamknięte** - Wygrane/przegrane

2. **Praca z okazjami**:
   - Przeciągaj karty między etapami
   - Aktualizuj prawdopodobieństwo zamknięcia
   - Ustalaj terminy planowanych działań
   - Dodawaj notatki z każdej interakcji

#### 📊 Projekty SMART

System automatycznie analizuje Twoje projekty według metodologii SMART:

- **S** (Specific) - Czy cel jest konkretny?
- **M** (Measurable) - Czy można go zmierzyć?
- **A** (Achievable) - Czy jest osiągalny?
- **R** (Relevant) - Czy jest istotny?
- **T** (Time-bound) - Czy ma określony termin?

### Wskazówki i Najlepsze Praktyki

#### 🎯 Efektywna Praca z GTD

1. **Codzienny przegląd** (5-10 minut):
   - Sprawdź skrzynkę odbiorczą
   - Przejrzyj listę następnych działań
   - Zaktualizuj kalendarz

2. **Tygodniowy przegląd** (30-60 minut):
   - Przejrzyj wszystkie projekty
   - Zaktualizuj listę "Kiedyś/Może"
   - Zaplanuj priorytefy na nadchodzący tydzień

3. **Zachowaj spójność kontekstów**:
   - Używaj tych samych oznaczeń (@)
   - Dostosuj konteksty do swojego środowiska pracy
   - Regularnie przeglądaj i aktualizuj

#### 💼 Skuteczny CRM

1. **Konsekwencja w danych**:
   - Zawsze wypełniaj wszystkie dostępne pola
   - Używaj jednolitych formatów (np. nazw firm)
   - Regularnie aktualizuj informacje

2. **Automatyzacja**:
   - Wykorzystuj szablony emaili
   - Ustawiaj automatyczne przypomnienia
   - Konfiguruj reguły kategoryzacji

3. **Analiza i optymalizacja**:
   - Monitoruj metryki pipeline'u
   - Analizuj przyczyny przegranych okazji
   - Optymalizuj proces sprzedażowy

---

## 📚 API Reference

### Autoryzacja

Wszystkie żądania API (oprócz logowania i rejestracji) wymagają tokenu autoryzacyjnego w nagłówku:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Endpointy Auth

#### POST `/api/v1/auth/login`
Logowanie użytkownika

**Request Body:**
```json
{
  "email": "demo@example.com",
  "password": "demo123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "demo@example.com", 
      "firstName": "John",
      "lastName": "Demo",
      "role": "OWNER"
    },
    "organization": {
      "id": "uuid",
      "name": "Demo Organization",
      "slug": "demo-org"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": "15m"
    }
  }
}
```

#### POST `/api/v1/auth/logout`
Wylogowanie użytkownika

#### GET `/api/v1/auth/me`
Pobieranie danych aktualnego użytkownika

### Endpointy GTD

#### GET `/api/v1/gtd/inbox`
Lista elementów w skrzynce odbiorczej

#### POST `/api/v1/gtd/inbox`
Dodanie nowego elementu do skrzynki

#### GET `/api/v1/gtd/next-actions`
Lista następnych działań

#### PUT `/api/v1/gtd/next-actions/{id}`
Aktualizacja zadania

### Endpointy CRM

#### GET `/api/v1/companies`
Lista firm z paginacją

**Query Parameters:**
- `page` - numer strony (domyślnie: 1)
- `limit` - liczba elementów (domyślnie: 20)
- `search` - wyszukiwanie po nazwie
- `category` - filtrowanie po kategorii

#### POST `/api/v1/companies`
Dodanie nowej firmy

#### GET `/api/v1/contacts`
Lista kontaktów

#### POST `/api/v1/deals`
Tworzenie nowej okazji sprzedażowej

### Kody Błędów

- `400` - Bad Request (błędne dane)
- `401` - Unauthorized (brak autoryzacji)
- `403` - Forbidden (brak uprawnień)
- `404` - Not Found (nie znaleziono)
- `422` - Validation Error (błąd walidacji)
- `500` - Internal Server Error (błąd serwera)

---

## 🔧 Troubleshooting

### Najczęstsze Problemy

#### 1. Błąd 500 przy logowaniu

**Przyczyny:**
- Brak połączenia z bazą danych
- Nieprawidłowe zmienne środowiskowe
- Problem z tokenami JWT

**Rozwiązanie:**
```bash
# Sprawdź status baz danych
docker ps | grep -E "postgres|redis"

# Sprawdź logi backendu
cd /opt/crm-gtd-smart/packages/backend
npm run dev

# Sprawdź konfigurację .env
cat .env | grep -E "DATABASE_URL|JWT_SECRET"
```

#### 2. Błąd CORS

**Objawy:** Błędy typu "Access-Control-Allow-Origin" w konsoli przeglądarki

**Rozwiązanie:**
```bash
# Sprawdź konfigurację CORS w backend/src/config/index.ts
# Upewnij się, że frontend URL jest w CORS_ORIGINS
```

#### 3. Problemy z routingiem (404 na podstronach)

**Przyczyna:** Nieprawidłowa konfiguracja Nginx

**Rozwiązanie:**
```bash
# Sprawdź konfigurację Nginx
sudo nginx -t

# Sprawdź logi błędów
sudo tail -f /var/log/nginx/error.log
```

#### 4. Aplikacja nie ładuje się po deploy

**Lista kontrolna:**
- [ ] Czy bazy danych są uruchomione?
- [ ] Czy zmienne środowiskowe są poprawne?
- [ ] Czy Nginx jest skonfigurowany?
- [ ] Czy frontend i backend są uruchomione?
- [ ] Czy porty nie są blokowane przez firewall?

### Logi i Diagnostyka

#### Logi Backend
```bash
cd /opt/crm-gtd-smart/packages/backend
npm run dev  # Tryb development z logami
```

#### Logi Nginx
```bash
# Logi błędów
sudo tail -f /var/log/nginx/error.log

# Logi dostępu
sudo tail -f /var/log/nginx/access.log
```

#### Logi Bazy Danych
```bash
# PostgreSQL
docker logs postgres-crm

# Redis
docker logs redis-crm
```

### Komendy Utrzymaniowe

#### Backup Bazy Danych
```bash
# Backup PostgreSQL
docker exec postgres-crm pg_dump -U user crm_gtd_dev > backup_$(date +%Y%m%d).sql

# Przywracanie
docker exec -i postgres-crm psql -U user crm_gtd_dev < backup_20241201.sql
```

#### Czyszczenie Cache
```bash
# Restart aplikacji
pm2 restart all

# Czyszczenie Redis
docker exec redis-crm redis-cli FLUSHALL

# Czyszczenie build cache Next.js
cd packages/frontend
rm -rf .next
npm run build
```

#### Aktualizacja Aplikacji
```bash
# Pobierz najnowsze zmiany
git pull origin main

# Zainstaluj nowe zależności
npm install

# Zaktualizuj bazę danych
cd packages/backend
npx prisma migrate deploy

# Rebuild i restart
cd ../frontend
npm run build
pm2 restart all
```

---

## 📞 Kontakt i Wsparcie

### Dokumentacja Techniczna
- **Repozytorium**: [Link do repozytorium]
- **Wiki**: [Link do wiki]
- **API Docs**: [Link do API dokumentacji]

### Zgłaszanie Błędów
Jeśli napotkasz błąd, przygotuj następujące informacje:
1. **Kroki do reprodukcji** błędu
2. **Oczekiwane zachowanie**
3. **Rzeczywiste zachowanie**
4. **Zrzuty ekranu** (jeśli aplikowalne)
5. **Logi błędów** z konsoli przeglądarki/serwera
6. **Wersja aplikacji** i przeglądarki

### Informacje o Wersji
- **Wersja aplikacji**: 1.0.0
- **Data wydania**: 2025-06-18
- **Kompatybilność**: 
  - Node.js 22+
  - PostgreSQL 14+
  - Przeglądarki: Chrome 90+, Firefox 88+, Safari 14+

---

## 📄 Licencja

Ten projekt jest chroniony prawami autorskimi. Wszelkie prawa zastrzeżone.

---

*Ostatnia aktualizacja dokumentacji: 18 czerwca 2025*  
*Wersja dokumentacji: 2.0*  
*Obejmuje: Strategię Git Flow i Multi-Version Deployment*