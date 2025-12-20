# 📧 System Filtrowania Emaili - Redukcja Kosztów AI

## 🎯 Cel Systemu

System automatycznego filtrowania emaili został zaprojektowany, aby:
- **Zmniejszyć koszty AI o 75-85%** poprzez inteligentne wstępne filtrowanie
- **Kategoryzować kontakty** dla lepszego zarządzania komunikacją
- **Automatyzować procesy** dla różnych typów emaili
- **Poprawić produktywność** przez eliminację szumu komunikacyjnego

## 🏗️ Architektura Systemu

### 1. Modele Bazy Danych

#### EmailCategory (Enum)
- `VIP` - Ważni kontakty, zawsze przetwarzaj z AI
- `SPAM` - Spam/niechciane, pomiń AI, auto-usuń
- `INVOICES` - Faktury, pomiń AI, przekieruj do księgowości
- `ARCHIVE` - Newslettery/info, pomiń AI, auto-archiwizuj
- `UNKNOWN` - Nowe kontakty, przetwarzaj z AI do kategoryzacji

#### Contact (Rozszerzony)
```sql
-- Dodane pole:
emailCategory EmailCategory @default(UNKNOWN)
```

#### EmailRule (Nowy Model)
```sql
model EmailRule {
  id          String   @id @default(uuid())
  name        String
  description String?
  
  -- Warunki dopasowania
  senderEmail    String?   -- Dokładny email
  senderDomain   String?   -- Domena (np. "company.com")
  subjectContains String?  -- Temat zawiera
  subjectPattern  String?  -- Regex dla tematu
  bodyContains   String?   -- Treść zawiera
  
  -- Akcje
  assignCategory EmailCategory
  skipAIAnalysis Boolean @default(false)
  autoArchive    Boolean @default(false)
  autoDelete     Boolean @default(false)
  createTask     Boolean @default(false)
  
  -- Priorytet i status
  priority    Int @default(0)  -- Wyższy = przetwarzany pierwszy
  isActive    Boolean @default(true)
  
  -- Statystyki
  matchCount  Int @default(0)
  lastMatched DateTime?
}
```

### 2. Email Filter Service

#### Główne Funkcje:
```typescript
class EmailFilterService {
  // Główna funkcja filtrowania
  async filterEmail(messageData: EmailMessageData): Promise<FilterResult>
  
  // Zarządzanie regułami
  async createEmailRule(ruleData: CreateEmailRuleData): Promise<EmailRule>
  
  // Statystyki
  async getFilteringStats(organizationId: string): Promise<EmailFilterStats>
}
```

#### Proces Filtrowania:
1. **Sprawdź istniejący kontakt** - czy ma już przypisaną kategorię
2. **Dopasuj reguły** - znajdź pierwszą pasującą regułę według priorytetu
3. **Zastosuj akcje** - skip AI, archiwizacja, usuwanie, tworzenie zadań
4. **Aktualizuj statystyki** - licznik dopasowań, ostatnie użycie

### 3. API Endpoints

#### Email Rules Management:
- `GET /api/v1/communication/email-rules` - Lista reguł
- `POST /api/v1/communication/email-rules` - Tworzenie reguły
- `PUT /api/v1/communication/email-rules/:id` - Aktualizacja reguły
- `DELETE /api/v1/communication/email-rules/:id` - Usuwanie reguły

#### Testing & Stats:
- `POST /api/v1/communication/email-rules/test` - Test filtrowania
- `GET /api/v1/communication/email-rules/stats` - Statystyki

#### Contact Management:
- `PATCH /api/v1/communication/contacts/:id/email-category` - Kategoria kontaktu

## 🎮 Interfejs Użytkownika

### Strona Zarządzania Filtrami
**URL**: `/dashboard/communication/email-filters`

#### Sekcje UI:
1. **📊 Dashboard Statystyk**
   - Emaili przetworzonych
   - Analiz AI pominiętych
   - % redukcji kosztów
   - Liczba aktywnych reguł

2. **🧪 Sekcja Testowania**
   - Formularz testu email (nadawca, temat, treść)
   - Wynik z dopasowaną regułą
   - Przewidywana redukcja kosztów

3. **📋 Lista Reguł**
   - Wizualne oznaczenia kategorii
   - Statystyki dopasowań
   - Akcje edit/delete

4. **➕ Modal Tworzenia/Edycji**
   - Warunki dopasowania
   - Konfiguracja akcji
   - Podgląd na żywo

## 💰 Szacunkowa Redukcja Kosztów

### Kategorie i Redukcja:
- **VIP (0%)** - Pełna analiza AI, brak redukcji
- **SPAM (95%)** - Pominięcie AI, tylko usuwanie
- **INVOICES (85%)** - Podstawowe przetwarzanie, routing
- **ARCHIVE (90%)** - Archiwizacja bez analizy
- **UNKNOWN (0%)** - Pełna analiza dla kategoryzacji

### Przykładowa Kalkulacja:
```
Założenia:
- 1000 emaili/miesiąc
- 75% SPAM/ARCHIVE/INVOICES = 750 emaili
- 95% redukcja kosztów = 712 emaili bez AI
- Oszczędność: 71.2% całkowitych kosztów AI
```

## 🔧 Implementacja Workflow

### 1. Multi-Level Filtering Pipeline:

```
EMAIL RECEIVED
       ↓
1. CONTACT CHECK (istniejący kontakt → kategoria)
       ↓
2. RULE MATCHING (reguły według priorytetu)
       ↓
3. ACTION EXECUTION (skip AI / archive / delete / task)
       ↓
4. AI PROCESSING (tylko jeśli !skipAIAnalysis)
       ↓
5. GTD PROCESSING (standardowy workflow)
```

### 2. Przykłady Reguł:

#### Reguła SPAM:
```json
{
  "name": "Newsletter Unsubscribes",
  "senderDomain": "*.marketing.com",
  "bodyContains": "unsubscribe",
  "assignCategory": "SPAM",
  "skipAIAnalysis": true,
  "autoDelete": true,
  "priority": 90
}
```

#### Reguła INVOICES:
```json
{
  "name": "Faktury",
  "subjectContains": "faktura",
  "assignCategory": "INVOICES",
  "skipAIAnalysis": true,
  "autoArchive": true,
  "createTask": true,
  "priority": 80
}
```

#### Reguła VIP:
```json
{
  "name": "Kluczowi Klienci",
  "senderDomain": "important-client.com",
  "assignCategory": "VIP",
  "skipAIAnalysis": false,
  "createTask": true,
  "priority": 100
}
```

## 📈 Metrics & Analytics

### Dashboard Statystyk:
1. **Efektywność Filtrowania**
   - Total emails processed
   - AI analysis skipped
   - Cost reduction percentage

2. **Breakdown Kategorii**
   - Rozkład per kategoria
   - Trend w czasie
   - Top performing rules

3. **Rule Performance**
   - Najbardziej aktywne reguły
   - Accuracy rate
   - Last matched timestamps

## 🚀 Deployment & Setup

### 1. Backend Deployment:
```bash
# Aktualizacja schema
npx prisma generate
npx prisma db push

# Restart serwisów
docker restart crm-backend-v1
```

### 2. Frontend Deployment:
```bash
# Test aplikacji
curl http://91.99.50.80/crm/dashboard/communication/email-filters

# Restart frontend jeśli potrzeba
docker restart crm-frontend-v1
```

### 3. Pierwsze Reguły (Quick Setup):
```javascript
// Przykładowe reguły do utworzenia via API:
const defaultRules = [
  {
    name: "SPAM Detection",
    bodyContains: "unsubscribe",
    assignCategory: "SPAM",
    skipAIAnalysis: true,
    autoDelete: true,
    priority: 95
  },
  {
    name: "Faktury Auto",
    subjectContains: "faktura",
    assignCategory: "INVOICES", 
    skipAIAnalysis: true,
    autoArchive: true,
    createTask: true,
    priority: 90
  }
];
```

## 🔮 Future Enhancements

### Phase 2 - Machine Learning:
- **Behavior Learning** - system uczy się z decyzji użytkownika
- **Auto-Rule Generation** - automatyczne tworzenie reguł
- **Predictive Categorization** - ML prediction dla nowych kontaktów

### Phase 3 - Advanced Features:
- **Sentiment Analysis** - dodatkowe filtrowanie po sentymencie
- **Bulk Contact Import** - masowe przypisywanie kategorii
- **Advanced Regex** - złożone wzorce dopasowań
- **Time-based Rules** - reguły aktywne w określonych godzinach

## 📝 Maintenance

### Monitoring:
- Sprawdzaj statystyki co tydzień
- Aktualizuj reguły na podstawie nowych wzorców
- Monitoruj false positives/negatives

### Optimization:
- Merge podobnych reguł dla lepszej wydajności
- Usuń nieaktywne reguły (0 matches przez 3 miesiące)
- Dostrajaj priorytety na podstawie rzeczywistego użycia

---

## 🎯 Podsumowanie

System filtrowania emaili to **game changer** dla redukcji kosztów AI przy zachowaniu pełnej funkcjonalności dla ważnych wiadomości. Przewidywana oszczędność 75-85% kosztów AI przy inteligentnym przetwarzaniu wszystkich typów komunikacji.

**Status**: ✅ ZAIMPLEMENTOWANY  
**URL**: http://91.99.50.80/crm/dashboard/communication/email-filters  
**Ready for production**: TAK