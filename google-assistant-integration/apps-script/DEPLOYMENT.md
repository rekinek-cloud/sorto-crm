# Google Apps Script Backend - Przewodnik Wdrożenia

## Przegląd

Ten dokument opisuje proces wdrożenia Google Apps Script backend'u dla integracji CRM-GTD Smart z Google Assistant.

## Wymagania

### 1. Konto Google Cloud Platform
- Aktywny projekt Google Cloud Platform
- Włączone API: Actions API, Sheets API, Gmail API, Calendar API
- Konfiguracja OAuth 2.0

### 2. Google Apps Script
- Dostęp do Google Apps Script Console
- Włączone Advanced Google Services
- Skonfigurowane uprawnienia OAuth

### 3. CRM-GTD Smart
- Działający backend CRM na `http://91.99.50.80/crm/api/v1/`
- Skonfigurowane API klucze i autoryzacja
- Dostęp do bazy danych PostgreSQL

## Pliki Projektu

```
google-assistant-integration/apps-script/
├── Code.gs                 # Podstawowa implementacja (wersja simple)
├── Code-Complete.gs        # Kompletna implementacja (wersja production)
├── appsscript.json        # Konfiguracja projektu
└── DEPLOYMENT.md          # Ten przewodnik
```

## Proces Wdrożenia

### Krok 1: Przygotowanie Google Cloud Project

1. **Utwórz nowy projekt Google Cloud**
   ```bash
   gcloud projects create crm-gtd-assistant --name="CRM-GTD Assistant"
   gcloud config set project crm-gtd-assistant
   ```

2. **Włącz wymagane API**
   ```bash
   gcloud services enable actions.googleapis.com
   gcloud services enable sheets.googleapis.com
   gcloud services enable gmail.googleapis.com
   gcloud services enable calendar-json.googleapis.com
   gcloud services enable script.googleapis.com
   ```

3. **Skonfiguruj OAuth 2.0**
   ```bash
   # W Google Cloud Console → APIs & Services → Credentials
   # Utwórz OAuth 2.0 Client ID typu "Web application"
   # Dodaj authorized redirect URIs
   ```

### Krok 2: Instalacja Google Apps Script CLI

```bash
# Instalacja clasp (Command Line Apps Script Projects)
npm install -g @google/clasp

# Logowanie do Google Account
clasp login

# Włączenie Apps Script API
# Przejdź do https://script.google.com/home/usersettings
# Włącz "Google Apps Script API"
```

### Krok 3: Utworzenie Projektu Apps Script

```bash
# Przejście do katalogu
cd /opt/crm-gtd-smart/google-assistant-integration/apps-script/

# Utworzenie nowego projektu
clasp create --type standalone --title "CRM-GTD Assistant Backend"

# Wypchnięcie kodu do Google Apps Script
clasp push
```

### Krok 4: Konfiguracja Zmiennych Środowiskowych

W Google Apps Script Console → Project Settings → Script Properties:

```javascript
// Wymagane właściwości skryptu:
API_KEY: "your-crm-api-key"
API_SECRET: "your-api-secret-key"
DB_HOST: "91.99.50.80"
DB_PORT: "5434"
DB_NAME: "crm_gtd_v1"
DB_USER: "user"
DB_PASSWORD: "password"
CRM_API_BASE_URL: "http://91.99.50.80/crm/api/v1"
CRM_API_KEY: "your-crm-api-bearer-token"
LOG_SHEET_ID: "your-google-sheet-id-for-logs"
```

### Krok 5: Wdrożenie Web App

```bash
# Wdrożenie jako Web App
clasp deploy --description "CRM-GTD Voice Assistant v1.0"

# Pobranie URL wdrożenia
clasp deployments
```

W Google Apps Script Console:
1. Kliknij **Deploy** → **New deployment**
2. Wybierz typ: **Web app**
3. Ustawienia:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Kliknij **Deploy**
5. Skopiuj **Web app URL**

### Krok 6: Konfiguracja Uprawnień

Przy pierwszym uruchomieniu zostaniesz poproszony o autoryzację następujących uprawnień:

- **Spreadsheets**: Dostęp do Google Sheets (logowanie)
- **Gmail**: Odczyt i wysyłanie emaili
- **Calendar**: Zarządzanie wydarzeniami kalendarza
- **Drive**: Dostęp do plików
- **External requests**: Wywołania API CRM

### Krok 7: Test Wdrożenia

```bash
# Test podstawowej funkcjonalności
curl -X GET "YOUR_WEB_APP_URL?path=/voice/health"

# Test z autoryzacją
curl -X POST "YOUR_WEB_APP_URL?path=/voice/task/create" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test zadanie z Google Apps Script",
    "priority": "HIGH",
    "context": "@computer"
  }'
```

## Konfiguracja Google Actions

### 1. Utwórz Actions Project

```bash
# Instalacja gactions CLI
curl -O https://dl.google.com/gactions/updates/bin/linux/amd64/gactions/gactions
chmod +x gactions
sudo mv gactions /usr/local/bin/

# Utworzenie projektu Actions
gactions init
```

### 2. Konfiguracja Webhook

W `actions.yaml`:

```yaml
actions:
  custom:
    crm_gtd.add_task:
      engagement:
        invocationNames:
          - dodaj zadanie
          - nowe zadanie
      fulfillment:
        webhookHandler: YOUR_WEB_APP_URL

conversationFlows:
  crm_gtd_main:
    name: crm_gtd_main
    entryPoint:
      webhookHandler: YOUR_WEB_APP_URL
```

### 3. Wdrożenie Actions

```bash
# Push do Google Actions
gactions push

# Test w Actions Console
gactions test
```

## Monitoring i Logowanie

### 1. Logi Google Apps Script
- Console: https://script.google.com → View → Logs
- Stackdriver: https://console.cloud.google.com/logs

### 2. Logi w Google Sheets
Utwórz Google Sheet do logowania:
1. Nagłówki: Timestamp | Intent | Parameters | Response | Status
2. Skopiuj Sheet ID do `LOG_SHEET_ID`

### 3. Monitoring Wydajności
```javascript
// W Google Apps Script Console → Project → View → Execution transcript
// Sprawdzaj czasy wykonania i błędy
```

## Bezpieczeństwo

### 1. Autoryzacja API
- Używaj silnych API keys
- Regularnie rotuj klucze
- Implementuj rate limiting

### 2. OAuth Scopes
- Minimalizuj wymagane uprawnienia
- Regularnie przeglądaj scope'y
- Używaj principle of least privilege

### 3. Walidacja Danych
- Zawsze waliduj input parameters
- Sanityzuj dane przed zapisem do bazy
- Używaj prepared statements dla SQL

## Troubleshooting

### Częste Problemy

**1. "Script function not found"**
```javascript
// Sprawdź czy funkcja doGet/doPost istnieje
// Upewnij się że kod został poprawnie wdrożony
clasp push
```

**2. "Authorization required"**
```javascript
// Sprawdź czy API_KEY jest ustawiony w Script Properties
// Zweryfikuj format Authorization header
```

**3. "Database connection failed"**
```javascript
// Sprawdź połączenie z bazą danych
// Zweryfikuj credentials w Script Properties
// Sprawdź czy whitelist URL jest skonfigurowany
```

**4. "External request failed"**
```javascript
// Sprawdź czy URL CRM API jest dostępny
// Zweryfikuj uprawnienia OAuth
// Sprawdź urlFetchWhitelist w appsscript.json
```

### Debug Mode

```javascript
// Włączenie trybu debug w Code.gs
const DEBUG_MODE = true;

function debugRequest(request) {
  if (DEBUG_MODE) {
    console.log('Debug Request:', JSON.stringify(request, null, 2));
  }
}
```

## Backup i Restore

### 1. Backup Kodu
```bash
# Pobierz kod ze Google Apps Script
clasp pull

# Utwórz kopię zapasową
cp -r /opt/crm-gtd-smart/google-assistant-integration/apps-script/ \
      /opt/crm-gtd-smart/backups/apps-script-$(date +%Y%m%d)/
```

### 2. Export Konfiguracji
```bash
# Export Script Properties (ręcznie z konsoli)
# Project Settings → Script Properties → Export
```

## Aktualizacje

### 1. Aktualizacja Kodu
```bash
# Edytuj pliki lokalnie
# Push zmian
clasp push

# Nowe wdrożenie
clasp deploy --description "Update v1.1"
```

### 2. Aktualizacja Konfiguracji
```bash
# Zaktualizuj appsscript.json
# Push zmian
clasp push
```

## Performance Optimization

### 1. Caching
- Używaj `CacheService` dla częstych zapytań
- Cache TTL: 300 sekund dla danych user
- Cache TTL: 3600 sekund dla danych staticnych

### 2. Database Optimization
- Używaj connection pooling
- Optymalizuj SQL queries
- Implementuj circuit breaker pattern

### 3. Rate Limiting
- Max 100 requests/minute per user
- Exponential backoff dla retry logic
- Graceful degradation przy limit exceeded

## Kontakt i Wsparcie

- **Dokumentacja Google**: https://developers.google.com/apps-script
- **Actions on Google**: https://developers.google.com/assistant
- **CRM-GTD Smart**: Dokumentacja w CLAUDE.md

---

**Status**: ✅ Gotowe do wdrożenia
**Wersja**: 2.1.0
**Data**: 2025-07-04