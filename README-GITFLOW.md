# 🌿 CRM-GTD Smart - Git Flow Strategy

## 📋 Strategia Branchy

### Główne Branche

```
master               # Główny branch (najnowsza stabilna wersja)
├── production-v1    # Wersja produkcyjna V1 (stabilna, gotowa do testów)
├── develop-v1       # Development V1 (bugfixy, małe ulepszenia)
└── develop-v2       # Development V2 (nowe funkcje, duże zmiany)
```

### Pomocnicze Branche

```
feature/v1-*         # Nowe funkcje dla V1
feature/v2-*         # Nowe funkcje dla V2
hotfix/*            # Krytyczne poprawki dla produkcji
release/*           # Przygotowanie nowej wersji do wydania
```

## 🚀 Workflow

### 1. **Praca nad V1 (Stabilna wersja)**

```bash
# Przełącz się na development V1
./scripts/git-workflow.sh switch-v1

# Stwórz nową funkcję dla V1
./scripts/git-workflow.sh new-feature v1 user-profile-improvements

# Pracuj nad funkcją...
git add .
git commit -m "Add user profile improvements"

# Merge do develop-v1
git checkout develop-v1
git merge feature/v1-user-profile-improvements

# Deploy V1 do testów
./scripts/git-workflow.sh deploy-v1
```

### 2. **Praca nad V2 (Nowa wersja)**

```bash
# Przełącz się na development V2
./scripts/git-workflow.sh switch-v2

# Stwórz nową funkcję dla V2
./scripts/git-workflow.sh new-feature v2 new-dashboard-design

# Pracuj nad nową funkcją...
git add .
git commit -m "Implement new dashboard design"

# Merge do develop-v2
git checkout develop-v2
git merge feature/v2-new-dashboard-design

# Deploy V2 do development
./scripts/git-workflow.sh deploy-v2
```

### 3. **Hotfix dla Produkcji**

```bash
# Stwórz hotfix dla krytycznego błędu
./scripts/git-workflow.sh new-hotfix critical-login-bug

# Napraw błąd...
git add .
git commit -m "Fix critical login bug"

# Merge do produkcji i development
git checkout production-v1
git merge hotfix/critical-login-bug

git checkout develop-v1
git merge hotfix/critical-login-bug
```

### 4. **Release V1 do Produkcji**

```bash
# Merge develop-v1 do production-v1
./scripts/git-workflow.sh merge-v1

# Deploy do produkcji
./scripts/git-workflow.sh deploy-v1
```

## 🔧 Dostępne Komendy

### Zarządzanie Workflow

```bash
# Sprawdź status wszystkich branchy
./scripts/git-workflow.sh status

# Przełącz się między wersjami
./scripts/git-workflow.sh switch-v1      # V1 development
./scripts/git-workflow.sh switch-v2      # V2 development  
./scripts/git-workflow.sh switch-prod    # V1 production

# Lista wszystkich branchy
./scripts/git-workflow.sh list-branches
```

### Tworzenie Nowych Branchy

```bash
# Nowa funkcja dla V1
./scripts/git-workflow.sh new-feature v1 nazwa-funkcji

# Nowa funkcja dla V2
./scripts/git-workflow.sh new-feature v2 nazwa-funkcji

# Hotfix
./scripts/git-workflow.sh new-hotfix nazwa-hotfixa
```

### Deployment

```bash
# Deploy V1 (produkcja/testy)
./scripts/git-workflow.sh deploy-v1

# Deploy V2 (development)
./scripts/git-workflow.sh deploy-v2
```

## 🌍 Środowiska

### V1 - Produkcja/Testy
- **Branch**: `production-v1`
- **URL**: `http://91.99.50.80/crm/`
- **Port Frontend**: 9025
- **Port Backend**: 3001
- **Baza**: PostgreSQL port 5432
- **Redis**: port 6379
- **Environment**: `.env.v1`

### V2 - Development
- **Branch**: `develop-v2`
- **URL**: `http://91.99.50.80/crm2/`
- **Port Frontend**: 9026
- **Port Backend**: 3002
- **Baza**: PostgreSQL port 5433
- **Redis**: port 6380
- **Environment**: `.env.v2`

### Różnice w URL:
- **Główny adres**: `http://91.99.50.80/` → automatyczne przekierowanie do `/crm/`
- **V1 Login**: `http://91.99.50.80/crm/auth/login`
- **V2 Login**: `http://91.99.50.80/crm2/auth/login`

## 📁 Konfiguracja Środowisk

### Deployment Script (Zalecane)
```bash
# Uruchom tylko V1
./scripts/deploy-versions.sh v1

# Uruchom tylko V2
./scripts/deploy-versions.sh v2

# Uruchom obie wersje
./scripts/deploy-versions.sh both

# Sprawdź status
./scripts/deploy-versions.sh status

# Zatrzymaj wszystko
./scripts/deploy-versions.sh stop

# Zaktualizuj Nginx
./scripts/deploy-versions.sh nginx
```

### Docker Compose (Ręcznie)
```bash
# Uruchom V1
docker-compose -f docker-compose.v1.yml up -d

# Uruchom V2
docker-compose -f docker-compose.v2.yml up -d

# Zatrzymaj V1
docker-compose -f docker-compose.v1.yml down

# Zatrzymaj V2
docker-compose -f docker-compose.v2.yml down
```

## 🎯 Najlepsze Praktyki

### 1. **Nazewnictwo Branchy**
```bash
feature/v1-user-authentication      # Funkcja dla V1
feature/v2-new-ui-framework        # Funkcja dla V2
hotfix/critical-security-patch     # Krytyczna poprawka
release/v1.2.0                     # Przygotowanie wydania
```

### 2. **Commit Messages**
```bash
# Dla V1
git commit -m "V1: Fix user authentication bug"

# Dla V2  
git commit -m "V2: Add new dashboard components"

# Dla hotfix
git commit -m "HOTFIX: Fix critical security vulnerability"
```

### 3. **Merge Strategy**
```bash
# Używaj --no-ff dla merge'ów
git merge feature/v1-something --no-ff

# Dla hotfixów merge do obu branchy
git checkout production-v1
git merge hotfix/nazwa
git checkout develop-v1
git merge hotfix/nazwa
```

### 4. **Code Review**
```bash
# Przed merge do develop-* stwórz PR/MR
# Przed merge do production-v1 wymagaj review
```

## 🔄 Przykładowy Przepływ Pracy

```bash
# 1. Sprawdź status
./scripts/git-workflow.sh status

# 2. Stwórz funkcję dla V2
./scripts/git-workflow.sh new-feature v2 advanced-analytics

# 3. Pracuj nad funkcją
echo "// Nowy kod" >> packages/frontend/src/components/Analytics.tsx
git add .
git commit -m "V2: Add advanced analytics component"

# 4. Merge do develop-v2
git checkout develop-v2
git merge feature/v2-advanced-analytics

# 5. Deploy V2 do testów
./scripts/git-workflow.sh deploy-v2

# 6. Jednocześnie pracuj nad V1 hotfixem
./scripts/git-workflow.sh new-hotfix login-timeout-issue

# 7. Napraw błąd
echo "// Poprawka" >> packages/backend/src/auth/login.ts
git add .
git commit -m "HOTFIX: Fix login timeout issue"

# 8. Merge hotfix do production-v1
git checkout production-v1
git merge hotfix/login-timeout-issue

# 9. Deploy hotfix
./scripts/git-workflow.sh deploy-v1
```

## 📊 Monitoring

```bash
# Sprawdź różnice między wersjami
git diff production-v1..develop-v2

# Historie commitów
git log --oneline --graph --all

# Status wszystkich branchy
./scripts/git-workflow.sh status
```

---

**💡 Wskazówka**: Zawsze używaj skryptu `./scripts/git-workflow.sh` do zarządzania workflow - ułatwia to pracę i zmniejsza ryzyko błędów!