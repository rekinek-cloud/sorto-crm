# Plan Generowania Danych Testowych dla CRM-GTD Smart

## 📊 Analiza Obecnego Stanu Bazy Danych

### Statystyki Obecne (2025-07-15):
- **Łączna liczba tabel**: 97
- **Tabele puste**: 4 (EmailAccount, ProjectDependency, VectorCache, PerformanceMetrics)
- **Tabele z małą ilością danych (<10)**: 64
- **Tabele dobrze wypełnione (≥10)**: 15
- **Zakres dat**: 
  - Najstarsze dane: 2025-04-04
  - Najnowsze dane: 2025-07-16
  - Brak danych historycznych sprzed kwietnia 2025

## 🎯 Cel: Wygenerowanie Realistycznych Danych Testowych

### Wymagania:
1. **Dane historyczne**: Minimum 6 miesięcy wstecz (od stycznia 2025)
2. **Dane przyszłe**: Minimum 3 miesiące do przodu (do października 2025)
3. **Różnorodność**: Różne statusy, priorytety, typy, użytkownicy
4. **Realizm**: Prawdopodobne scenariusze biznesowe
5. **Objętość**: Wystarczająca do testowania raportów i zestawień

## 📋 Szczegółowy Plan Generowania Danych

### 1. TABELE PRIORYTETOWE - Kluczowe dla raportów (HIGH PRIORITY)

#### A. **Tasks** (obecnie: 201) → **CEL: 2000+ rekordów**
- **Zakres dat**: styczeń 2025 - październik 2025
- **Rozkład**:
  - 30% zadań zakończonych (COMPLETED)
  - 20% zadań w trakcie (IN_PROGRESS)
  - 30% zadań zaplanowanych (PLANNED)
  - 20% zadań anulowanych/odroczonych (CANCELLED/DEFERRED)
- **Zróżnicowanie**:
  - Różne priorytety (HIGH: 20%, MEDIUM: 50%, LOW: 30%)
  - Różne konteksty (@computer, @calls, @office, @home, @errands)
  - Różne czasy trwania (15min - 8h)
  - Powiązania z projektami, kontaktami, firmami

#### B. **Projects** (obecnie: 2) → **CEL: 50+ projektów**
- **Typy projektów**:
  - Rozwój produktu (15)
  - Wdrożenia klientów (10)
  - Projekty wewnętrzne (10)
  - Marketing i sprzedaż (10)
  - Badania i rozwój (5)
- **Statusy**: PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
- **Terminy**: Od stycznia 2025 do grudnia 2025
- **Budżety**: 5,000 - 500,000 PLN

#### C. **Messages** (obecnie: 225) → **CEL: 5000+ wiadomości**
- **Typy**:
  - Email biznesowe (60%)
  - Slack/Teams (20%)
  - SMS (10%)
  - Inne (10%)
- **Rozkład czasowy**: Równomiernie przez 9 miesięcy
- **Urgency levels**: Różne poziomy pilności
- **Załączniki**: 20% wiadomości z załącznikami

#### D. **Meetings** (obecnie: 5) → **CEL: 500+ spotkań**
- **Typy**:
  - Spotkania zespołu (40%)
  - Spotkania z klientami (30%)
  - Spotkania 1-on-1 (20%)
  - Konferencje/webinary (10%)
- **Czas trwania**: 15min - 4h
- **Lokalizacje**: Biuro, Online, U klienta
- **Powtarzalność**: 30% spotkań cyklicznych

#### E. **Deals** (obecnie: 3) → **CEL: 200+ transakcji**
- **Etapy sprzedaży**:
  - Lead: 30%
  - Qualified: 25%
  - Proposal: 20%
  - Negotiation: 15%
  - Closed Won: 8%
  - Closed Lost: 2%
- **Wartości**: 1,000 - 1,000,000 PLN
- **Cykle sprzedaży**: 7 dni - 6 miesięcy

### 2. TABELE FINANSOWE (MEDIUM PRIORITY)

#### F. **Invoices** (obecnie: 3) → **CEL: 300+ faktur**
- **Rozkład**: Co miesiąc 30-40 faktur
- **Statusy**: DRAFT, SENT, PAID, OVERDUE, CANCELLED
- **Wartości**: 500 - 100,000 PLN
- **Terminy płatności**: 7, 14, 30, 60 dni

#### G. **Orders** (obecnie: 3) → **CEL: 250+ zamówień**
- **Powiązanie z fakturami i ofertami**
- **Statusy realizacji**
- **Różne produkty i usługi**

#### H. **Offers** (obecnie: 2) → **CEL: 150+ ofert**
- **Statusy**: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
- **Ważność**: 14-90 dni
- **Konwersja**: ~30% ofert zaakceptowanych

### 3. TABELE GTD (HIGH PRIORITY)

#### I. **InboxItem** (obecnie: 11) → **CEL: 500+ elementów**
- **Różne źródła**: Email, Phone, Meeting, Quick Capture
- **Processing status**: Processed/Unprocessed
- **Równomierny rozkład w czasie**

#### J. **NextAction** (obecnie: 6) → **CEL: 300+ akcji**
- **Powiązane z zadaniami**
- **Różne konteksty GTD**
- **Energy levels**: HIGH, MEDIUM, LOW

#### K. **WaitingFor** (obecnie: 4) → **CEL: 150+ elementów**
- **Oczekiwanie na**: Odpowiedź, Decyzję, Dostawę, Płatność
- **Follow-up dates**
- **Escalation levels**

#### L. **RecurringTask** (obecnie: 6) → **CEL: 100+ zadań cyklicznych**
- **Częstotliwości**: Daily, Weekly, Monthly, Quarterly, Yearly
- **Różne wzorce powtarzalności**
- **Zadania maintenance, raporty, przeglądy**

### 4. TABELE KOMUNIKACJI (MEDIUM PRIORITY)

#### M. **EmailAccount** (obecnie: 0) → **CEL: 10+ kont**
- **Różne providery**: Gmail, Outlook, własna domena
- **Różne role**: Personal, Work, Support, Marketing

#### N. **CommunicationChannel** (obecnie: 2) → **CEL: 20+ kanałów**
- **Typy**: Email, Slack, Teams, SMS, WhatsApp
- **Integracje z różnymi systemami**

#### O. **SmartMailbox** (obecnie: 7) → **CEL: 30+ skrzynek**
- **Różne filtry i reguły**
- **Automatyczne kategoryzacje**
- **Smart folders**

### 5. TABELE ANALITYCZNE (LOW PRIORITY)

#### P. **Activity** (obecnie: 6) → **CEL: 10,000+ aktywności**
- **Automatyczne logowanie wszystkich akcji**
- **Różne typy: CREATE, UPDATE, DELETE, VIEW, PROCESS**

#### Q. **Timeline** (obecnie: 5) → **CEL: 5,000+ wpisów**
- **Historia interakcji z kontaktami i firmami**
- **Automatyczne wpisy z emaili, spotkań, rozmów**

#### R. **WeeklyReview** (obecnie: 4) → **CEL: 40+ przeglądów**
- **Co tydzień przez 9 miesięcy**
- **Statystyki i podsumowania**
- **Cele i osiągnięcia**

### 6. TABELE SMART DAY PLANNER (MEDIUM PRIORITY)

#### S. **EnergyTimeBlock** (obecnie: 71) → **CEL: 500+ bloków**
- **Bloki dla każdego dnia roboczego**
- **Różne poziomy energii**
- **Focus modes**

#### T. **ScheduledTask** (obecnie: 35) → **CEL: 1000+ zaplanowanych zadań**
- **Powiązanie z blokami czasowymi**
- **Różne strategie przypisywania**

#### U. **EnergyAnalytics** (obecnie: 11) → **CEL: 200+ analiz**
- **Dzienne i tygodniowe analizy**
- **Wzorce produktywności**
- **Rekomendacje AI**

### 7. POZOSTAŁE TABELE (LOW PRIORITY)

- **Contacts** (122) → 500+
- **Companies** (104) → 300+
- **Documents** (6) → 200+
- **WikiPages** (2) → 50+
- **Leads** (6) → 300+
- **BugReports** (5) → 100+
- **Recommendations** (5) → 200+

## 🚀 Plan Implementacji

### Faza 1: Przygotowanie (1-2 dni)
1. Utworzenie skryptu bazowego z strukturą
2. Przygotowanie generatorów danych (faker.js)
3. Definicja relacji między tabelami

### Faza 2: Generowanie Danych Podstawowych (2-3 dni)
1. Użytkownicy i organizacje
2. Projekty i zadania
3. Kontakty i firmy
4. Podstawowe relacje

### Faza 3: Generowanie Danych Biznesowych (2-3 dni)
1. Transakcje (deals)
2. Faktury i zamówienia
3. Spotkania i aktywności
4. Wiadomości i komunikacja

### Faza 4: Generowanie Danych GTD (1-2 dni)
1. Inbox items
2. Next actions i waiting for
3. Recurring tasks
4. Smart Day Planner data

### Faza 5: Weryfikacja i Optymalizacja (1 dzień)
1. Sprawdzenie spójności danych
2. Weryfikacja relacji
3. Testy wydajności
4. Backup finalnej bazy

## 📊 Oczekiwane Rezultaty

Po wygenerowaniu danych:
- **50,000+ rekordów** łącznie w bazie
- **9 miesięcy** historii (styczeń - październik 2025)
- **Realistyczne scenariusze** biznesowe
- **Pełna funkcjonalność** raportów i analiz
- **Możliwość testowania** wszystkich funkcji aplikacji

## 🛠️ Narzędzia do Wykorzystania

1. **Faker.js** - generowanie realistycznych danych
2. **Prisma Client** - interakcja z bazą danych
3. **Node.js scripts** - automatyzacja procesu
4. **PostgreSQL** - bulk inserts dla wydajności

## ⚡ Priorytety Implementacji

1. **KRYTYCZNE**: Tasks, Projects, Messages, Meetings
2. **WAŻNE**: Deals, Invoices, GTD tables, Smart Day Planner
3. **PRZYDATNE**: Contacts, Companies, Documents, Activities
4. **OPCJONALNE**: Pozostałe tabele

---

Ten plan zapewni wystarczającą ilość różnorodnych danych do kompleksowego przetestowania wszystkich funkcjonalności aplikacji CRM-GTD Smart, ze szczególnym uwzględnieniem raportów, zestawień i analiz.