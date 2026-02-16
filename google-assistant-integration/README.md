# CRM-GTD Smart - Google Assistant Integration

Kompletna integracja Google Assistant/Nest Hub z systemem CRM-GTD Smart umożliwiająca zarządzanie zadaniami, projektami i kontaktami za pomocą poleceń głosowych.

## 🎯 Funkcjonalności

### 🗣️ Polecenia Głosowe
- **Zarządzanie zadaniami**: "Hey Google, dodaj zadanie", "Pokaż zadania"
- **Projekty**: "Utwórz projekt", "Sprawdź status projektów"
- **Kontakty**: "Pokaż kontakty", "Znajdź kontakt"
- **GTD Inbox**: "Przetwórz skrzynkę", "Co mam do zrobienia"

### 📱 Nest Hub Dashboard
- **Widget zadań** - podsumowanie dzisiejszych zadań z priorytetami
- **Kalendarz** - zadania i wydarzenia z integracją GTD
- **Kontakty** - ostatnie kontakty i szybki dostęp
- **Projekty** - status aktywnych projektów
- **Pogoda** - aktualne warunki pogodowe
- **Aktualności** - najnowsze wiadomości

### 🔐 Bezpieczeństwo
- OAuth 2.0 z Google
- JWT tokeny
- Weryfikacja webhook signatures
- Rate limiting
- HTTPS enforcing

## 🏗️ Architektura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Google Assistant│    │ Google Apps      │    │ CRM-GTD Smart   │
│ / Nest Hub      │◄──►│ Script Backend   │◄──►│ API             │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Voice Commands  │    │ Webhook Handler  │    │ Task Management │
│ Processing      │    │ & Auth           │    │ & Data Access   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Struktura Projektu

```
google-assistant-integration/
├── google-actions/          # Google Actions SDK konfiguracja
│   ├── settings.yaml       # Ustawienia Actions projektu
│   ├── actions.yaml        # Definicje akcji i intentów
│   └── webhooks/           # Konfiguracja webhook
├── apps-script/            # Google Apps Script middleware
│   ├── Code.gs             # Główny kod Apps Script
│   ├── appsscript.json     # Konfiguracja projektu
│   └── .clasp.json         # CLASP deployment config
├── api/                    # REST API endpoints
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth & validation
│   ├── services/           # Business logic
│   └── types/              # TypeScript definitions
├── database/               # Schema extensions
│   ├── migrations/         # Database migrations
│   └── schema-extensions.sql
├── nest-display/           # Nest Hub dashboard
│   ├── widgets/            # Widget components
│   ├── styles/             # CSS stylesheets
│   └── utils/              # Helper functions
└── config/                 # Configuration files
    ├── .env.example        # Environment template
    ├── development.json    # Dev configuration
    └── production.json     # Prod configuration
```

## 🚀 Quick Start

### 1. Konfiguracja Google Services

```bash
# Zaloguj się do Google Cloud
gcloud auth login

# Utwórz projekt Google Actions
gactions init

# Wdróż Actions
gactions deploy
```

### 2. Google Apps Script

```bash
# Zaloguj się do CLASP
clasp login

# Utwórz projekt Apps Script
clasp create --type standalone --title "CRM-GTD Assistant Backend"

# Wdróż kod
clasp push
clasp deploy
```

### 3. Instalacja API

```bash
# Sklonuj i skonfiguruj
cd google-assistant-integration
cp config/.env.example .env

# Edytuj .env z właściwymi wartościami
nano .env

# Instaluj zależności
npm install

# Uruchom migracje bazy danych
npm run migrate

# Start serwera
npm run dev
```

### 4. Docker Deployment

```bash
# Zbuduj i uruchom wszystkie serwisy
docker-compose up -d

# Sprawdź logi
docker-compose logs -f google-assistant-api

# Sprawdź status
docker-compose ps
```

## 🔧 Konfiguracja

### Zmienne Środowiskowe

```bash
# Google Services
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_PROJECT_ID=crm-gtd-smart-assistant

# CRM API
CRM_API_BASE_URL=https://crm.dev.sorto.ai/crm/api/v1
CRM_API_KEY=your-api-key

# Security
JWT_SECRET=your-jwt-secret
WEBHOOK_SECRET=your-webhook-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5434/crm_gtd_v1
```

### Google Actions Setup

1. Otwórz [Google Actions Console](https://console.actions.google.com)
2. Utwórz nowy projekt
3. Zaimportuj konfigurację z `google-actions/`
4. Skonfiguruj webhook URL
5. Przetestuj w symulatorze

### Apps Script Deployment

1. Otwórz [Google Apps Script](https://script.google.com)
2. Utwórz nowy projekt
3. Skopiuj kod z `apps-script/Code.gs`
4. Ustaw zmienne w Properties Service
5. Wdróż jako Web App

## 🎮 Użytkowanie

### Polecenia Głosowe

```
"Hey Google, porozmawiaj z CRM-GTD Smart"

# Zadania
"Dodaj zadanie przygotowanie prezentacji"
"Pokaż dzisiejsze zadania"
"Dodaj pilne zadanie spotkanie z klientem"

# Projekty  
"Utwórz projekt modernizacja strony"
"Sprawdź status projektów"

# Kontakty
"Pokaż kontakty"
"Znajdź kontakt Kowalski"

# GTD
"Przetwórz skrzynkę"
"Co mam do przetworzenia"
```

### Nest Hub Dashboard

1. Otwórz `http://your-domain.com/nest-display` na Nest Hub
2. Dashboard automatycznie się załaduje z widgetami
3. Widgety odświeżają się automatycznie
4. Kliknij widgety aby zobaczyć szczegóły

## 🧪 Testowanie

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Google Assistant Testing

```bash
# Test webhook lokalnie
curl -X POST http://localhost:3001/api/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test poleceń głosowych
node test-voice-commands.js
```

## 📊 Monitoring

### Health Checks

```bash
# API Health
curl http://localhost:3001/api/health

# Database Health  
curl http://localhost:3001/api/health/database

# Google Services Health
curl http://localhost:3001/api/health/google-services
```

### Metryki

- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000`
- **Logi**: `/app/logs/` w kontenerze

## 🔒 Bezpieczeństwo

### Najlepsze Praktyki

1. **Secrets Management**
   - Użyj zmiennych środowiskowych
   - Nie commituj secrets do repo
   - Rotuj klucze regularnie

2. **Network Security**
   - HTTPS enforcing
   - Rate limiting
   - IP whitelisting dla webhook

3. **Authentication**
   - OAuth 2.0 flow
   - JWT token validation
   - Session management

### Webhook Security

```typescript
// Weryfikacja podpisu Google
const signature = req.headers['google-assistant-signature'];
const isValid = verifyGoogleSignature(payload, signature, secret);
```

## 🚧 Troubleshooting

### Częste Problemy

**1. Webhook authorization failed**
```bash
# Sprawdź webhook secret
echo $WEBHOOK_SECRET

# Weryfikuj nagłówki w logach
docker logs crm-google-assistant-api
```

**2. Google OAuth errors**
```bash
# Sprawdź redirect URI
# Musi być identyczny w Google Cloud Console i .env
```

**3. Database connection issues**
```bash
# Test połączenia
psql $DATABASE_URL -c "SELECT 1"
```

### Debug Mode

```bash
# Włącz debug logging
export LOG_LEVEL=debug
export DEBUG_WEBHOOK_LOGGING=true

# Restart serwisu
docker-compose restart google-assistant-api
```

## 📈 Performance

### Optymalizacje

1. **Caching**
   - Redis dla często używanych danych
   - Memory cache dla statycznych danych
   - HTTP cache headers

2. **Database**
   - Connection pooling
   - Query optimization
   - Indeksy na często używanych kolumnach

3. **API**
   - Response compression
   - Request timeout handling
   - Graceful error handling

## 🔄 CI/CD

### GitHub Actions

```yaml
name: Deploy Google Assistant Integration
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up -d
```

## 📚 API Documentation

### Voice Commands API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/voice/command` | POST | Process voice command |
| `/api/voice/add-task` | POST | Add task via voice |
| `/api/voice/tasks` | GET | Get tasks for voice |
| `/api/voice/contacts` | GET | Get contacts for voice |

### Webhook Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhook/google-assistant` | POST | Main Google Assistant webhook |
| `/api/webhook/add-task` | POST | Task creation webhook |
| `/api/webhook/show-tasks` | POST | Task display webhook |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Email**: support@your-domain.com

---

**Uwaga**: To jest integracja z istniejącym systemem CRM-GTD Smart. Upewnij się, że główna aplikacja jest uruchomiona i dostępna przed rozpoczęciem konfiguracji Google Assistant.