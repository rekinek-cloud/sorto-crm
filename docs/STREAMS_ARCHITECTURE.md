# SORTO Streams - Dokumentacja Architektury

> Kompletny przewodnik po systemie Strumieni w SORTO CRM.
> Wersja: 3.1 | Data: 2026-02-17

---

## Spis treści

1. [Czym są Strumienie?](#1-czym-sa-strumienie)
2. [Kluczowe koncepcje](#2-kluczowe-koncepcje)
3. [Typy strumieni (StreamRole)](#3-typy-strumieni-streamrole)
4. [Kategorie strumieni (StreamType)](#4-kategorie-strumieni-streamtype)
5. [Cykl życia strumienia](#5-cykl-zycia-strumienia)
6. [Hierarchia strumieni](#6-hierarchia-strumieni)
7. [Konfiguracja strumieni](#7-konfiguracja-strumieni)
8. [Routing - automatyczne przypisywanie](#8-routing---automatyczne-przypisywanie)
9. [Reguły przetwarzania](#9-reguly-przetwarzania)
10. [Scenariusze użycia](#10-scenariusze-uzycia)
11. [Model danych (Prisma)](#11-model-danych-prisma)
12. [API Reference](#12-api-reference)
13. [Struktura plików](#13-struktura-plikow)

---

## 1. Czym sa Strumienie?

**Strumień (Stream)** to podstawowa jednostka organizacyjna w SORTO CRM. Wyobraź sobie strumienie jako **inteligentne foldery z supermocami** - mogą:

- Zawierać zadania, projekty, wiadomości, kontakty
- Mieć hierarchię (strumień nadrzędny / podstrumienie)
- Być zamrożone (wstrzymane) lub aktywne (płynące)
- Automatycznie przyjmować nowe elementy dzięki AI routingowi
- Dziedziczyć konfigurację z rodzica
- Mieć własne reguły przetwarzania

### Analogia: Strumień = rzeka

```
         [Źródło/Inbox]              <- Wszystko wpływa tutaj
              │
         ┌────┴────┐
         │         │
   [Strumień A]  [Strumień B]        <- Rozgałęzienie na tematy
     │     │         │
  [Pod-A1] [Pod-A2] [Pod-B1]         <- Podstrumienie (szczegóły)
```

- **Źródło (Inbox)** = miejsce gdzie wpływają nowe rzeczy
- **Strumienie projektowe** = rzeki z określonym ujściem (deadline)
- **Strumienie ciągłe** = rzeki, które zawsze płyną (np. "Zdrowie", "Finanse")
- **Zamrożone strumienie** = zamrożona rzeka, czeka na rozmrożenie

### Czym strumień NIE jest

- To nie jest zwykły folder/katalog - strumień ma status, konfigurację i inteligencję
- To nie jest kanban board - choć zadania w strumieniu mogą mieć statusy
- To nie jest pipeline sprzedażowy - choć deal-e mogą być powiązane ze strumieniem

---

## 2. Kluczowe koncepcje

### 2.1 Filozofia SORTO Streams

SORTO Streams to natywny system organizacji pracy. Każdy strumień pełni określoną **rolę** (StreamRole):

| StreamRole | Strumień SORTO | Opis |
|---|---|---|
| INBOX | **Źródło** | Punkt wejścia z AI pre-processingiem |
| PROJECTS | **Strumień projektowy** | Projekty z hierarchią i deadlinami |
| AREAS | **Strumień ciągły** | Obszary odpowiedzialności z metrykami |
| REFERENCE | **Strumień referencyjny** | Baza wiedzy z wyszukiwaniem wektorowym |
| SOMEDAY_MAYBE | **Zamrożony strumień** | Pomysły na przyszłość z przypomnieniami |
| NEXT_ACTIONS | **Strumień zadań** | Zadania z kontekstami i energią |
| WAITING_FOR | **Strumień oczekujący** | Delegowane elementy z follow-up |

### 2.2 Stany strumienia (Flow/Freeze)

Każdy strumień ma **status** opisujący czy "płynie":

```
  ACTIVE / FLOWING          FROZEN                ARCHIVED
  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │  Płynie      │ ──►  │  Zamrożony   │      │  Archiwum   │
  │  Wymaga      │ ◄──  │  Nie wymaga  │      │  Tylko do   │
  │  uwagi       │      │  uwagi       │      │  odczytu    │
  └─────────────┘      └─────────────┘      └─────────────┘
    freeze()             unfreeze()
```

- **FLOWING/ACTIVE** - strumień jest aktywny, zadania w nim wymagają uwagi
- **FROZEN** - strumień jest wstrzymany (np. "Someday/Maybe"), nie pojawia się w codziennym widoku
- **ARCHIVED** - strumień zakończony, tylko do odczytu
- **TEMPLATE** - szablon do tworzenia nowych strumieni

### 2.3 Konteksty i energia

Każdy element w strumieniu może mieć:

- **Kontekst** - gdzie/kiedy mogę to zrobić:
  - `@computer` - przy komputerze
  - `@phone` - mając telefon
  - `@office` - w biurze
  - `@home` - w domu
  - `@errands` - przy okazji spraw
  - `@anywhere` - gdziekolwiek
  - `@online` - online
  - `@waiting` - czekam na odpowiedź
  - `@reading` - do przeczytania

- **Poziom energii** - ile energii wymaga:
  - `HIGH` - wymaga skupienia i energii
  - `MEDIUM` - standardowy wysiłek
  - `LOW` - mogę zrobić będąc zmęczony
  - `CREATIVE` - wymaga kreatywności
  - `ADMINISTRATIVE` - rutynowa administracja

---

## 3. Typy strumieni (StreamRole)

StreamRole definiuje **przeznaczenie** strumienia:

### INBOX - Źródło

```
Kolor: #8B5CF6 (fioletowy)
Ikona: InboxIcon
```

**Cel:** Pojedynczy punkt wejścia dla WSZYSTKICH nowych elementów.

- Każda organizacja powinna mieć dokładnie jedno Źródło
- Nowe e-maile, zadania, notatki głosowe -> trafiają tutaj
- Codziennie przetwarzasz Źródło: decydujesz co z każdym elementem
- AI może automatycznie pre-kategoryzować elementy

**Konfiguracja specjalna:**
- `autoProcessing` - czy AI automatycznie przetwarza
- `processAfterDays` - po ilu dniach przypomnieć o nieprzetworzonym
- `purgeAfterDays` - po ilu dniach automatycznie usunąć

### PROJECTS - Strumień projektowy

```
Kolor: #3B82F6 (niebieski)
Ikona: FolderIcon
```

**Cel:** Projekt z określonym końcem i wynikiem.

- Ma deadline i mierzalny cel
- Zawiera zadania i podprojekty
- Może mieć podstrumienie (np. "Projekt: Nowa strona" -> "Frontend", "Backend", "Design")
- Kończy się gdy cel zostanie osiągnięty

### AREAS - Strumień ciągły

```
Kolor: #14B8A6 (teal)
Ikona: ChartBarIcon
```

**Cel:** Obszar odpowiedzialności bez określonego końca.

- Np. "Zdrowie", "Finanse osobiste", "Rozwój zespołu"
- Nie ma deadline'u - to ciągła odpowiedzialność
- Zawiera cykliczne zadania i nawyki
- Przegląd tygodniowy lub miesięczny

### REFERENCE - Strumień referencyjny

```
Kolor: #6B7280 (szary)
Ikona: ArchiveBoxIcon
```

**Cel:** Materiały informacyjne, dokumentacja, zasoby.

- Baza wiedzy, dokumenty, linki
- Nie wymaga akcji - tylko przechowywanie
- Wyszukiwanie wektorowe (semantyczne) po zawartości
- Może przechowywać konwersacje AI (ChatGPT, Claude, DeepSeek)

### SOMEDAY_MAYBE - Zamrożony strumień

```
Kolor: #60A5FA (jasnoniebieski)
Ikona: Snowflake (custom SVG)
```

**Cel:** Pomysły i projekty na przyszłość.

- Domyślnie w stanie FROZEN
- Nie wymaga codziennej uwagi
- Przeglądany podczas przeglądu tygodniowego
- Może być "rozmrożony" gdy zdecydujesz się realizować

### NEXT_ACTIONS - Strumień zadań

```
Kolor: #10B981 (zielony)
Ikona: CheckCircleIcon
```

**Cel:** Konkretne, wykonalne zadania.

- Każde zadanie ma kontekst (@computer, @phone itp.)
- Każde ma poziom energii
- Filtrowanie: "Co mogę teraz zrobić przy komputerze mając mało energii?"
- To jest Twoja codzienna lista "do zrobienia"

### WAITING_FOR - Strumień oczekujący

```
Kolor: #F59E0B (pomarańczowy)
Ikona: ClockIcon
```

**Cel:** Elementy delegowane lub oczekujące na zewnętrzne działanie.

- "Czekam na odpowiedź od klienta"
- "Delegowałem do Ani - sprawdzić w piątek"
- Automatyczne follow-up reminders
- Przeniesienie do NEXT_ACTIONS gdy odpowiedź przyjdzie

### CUSTOM - Niestandardowy

```
Kolor: #6366F1 (indigo)
Ikona: Squares2X2Icon
```

**Cel:** Własny typ strumienia dopasowany do potrzeb.

---

## 4. Kategorie strumieni (StreamType)

StreamType definiuje **strukturę** strumienia (niezależnie od StreamRole):

| StreamType | Opis | Typowa StreamRole |
|---|---|---|
| `WORKSPACE` | Główny strumień najwyższego poziomu | INBOX |
| `PROJECT` | Strumień projektowy z końcem | PROJECTS |
| `AREA` | Strumień ciągły bez końca | AREAS |
| `CONTEXT` | Strumień kontekstowy (@komputer) | CONTEXTS |
| `REFERENCE` | Materiały referencyjne | REFERENCE |
| `CUSTOM` | Niestandardowy | CUSTOM |

**Relacja StreamRole vs StreamType:**

```
StreamRole = CO ten strumień robi (jego rola w systemie)
StreamType = JAK ten strumień jest zorganizowany (jego struktura)

Przykład:
  StreamRole: PROJECTS  +  StreamType: PROJECT
  = "To jest strumień projektowy (rola), zorganizowany jako projekt (struktura)"

  StreamRole: AREAS  +  StreamType: AREA
  = "To jest strumień ciągły (rola), bez określonego końca (struktura)"
```

---

## 5. Cykl zycia strumienia

### 5.1 Tworzenie

```
Użytkownik klika "Nowy strumień"
        │
        ▼
┌──────────────────┐
│  Formularz:      │
│  - Nazwa         │
│  - Opis          │
│  - Rola (StreamRole) │
│  - Kategoria     │
│  - Rodzic        │
│  - Kolor         │
└──────────────────┘
        │
        ▼
  POST /api/v1/stream-management
        │
        ▼
  Backend tworzy:
  1. Rekord Stream w bazie
  2. Domyślną konfigurację strumienia (streamConfig)
  3. Relację parent-child (jeśli wybrano rodzica)
        │
        ▼
  Status: ACTIVE / FLOWING
```

### 5.2 Codzienna praca

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Nowy email  │────►│  INBOX (Źródło) │────►│  Przetwarzanie│
│  Nowe zadanie│     │                 │     │              │
│  Notatka     │     └─────────────────┘     └──────┬───────┘
└─────────────┘                                      │
                                              ┌──────┴───────┐
                                              │              │
                                         Jest akcja?    Nie ma akcji?
                                              │              │
                                     ┌────────┴──┐     ┌────┴────────┐
                                     │           │     │             │
                                  < 2 min?   > 2 min?  │     Referencja?
                                     │           │     │             │
                                  Zrób teraz  Deleguj  │     Tak → REFERENCE
                                     │        lub      │     Nie → Usuń
                                     │     zaplanuj    │
                                     │           │     │
                              ┌──────┴──┐  ┌────┴──┐  │
                              │NEXT_    │  │WAITING│  │
                              │ACTIONS  │  │_FOR   │  │
                              └─────────┘  └───────┘  │
                                                      │
                                              ┌───────┴──────┐
                                              │  Kiedyś?     │
                                              │  SOMEDAY_    │
                                              │  MAYBE       │
                                              └──────────────┘
```

### 5.3 Zamrażanie / rozmrażanie

```
freeze(streamId):
  1. Zmienia status strumienia na FROZEN
  2. REKURENCYJNIE zamraża wszystkie podstrumienie
  3. Zadania w strumieni przestają się pokazywać w codziennym widoku

unfreeze(streamId):
  1. Zmienia status strumienia na ACTIVE
  2. REKURENCYJNIE odmraża strumienie NADRZĘDNE
     (bo dziecko nie może być aktywne gdy rodzic jest zamrożony)
```

### 5.4 Archiwizacja / usunięcie

```
archive(streamId):
  - Status -> ARCHIVED
  - Elementy pozostają (tylko do odczytu)

delete(streamId):
  - BLOKOWANE jeśli strumień zawiera zadania lub projekty
  - Najpierw trzeba przenieść lub usunąć zawartość
```

---

## 6. Hierarchia strumieni

### 6.1 Relacje

Strumienie mogą tworzyć drzewa za pomocą tabeli `stream_relations`:

```
[Firma ABC - Workspace]
├── [Sprzedaż - Area]
│   ├── [Kampania Q1 - Project]
│   │   ├── [Landing page - Project]
│   │   └── [Email marketing - Project]
│   └── [Pipeline - Area]
├── [Produkt - Area]
│   ├── [Release v2.0 - Project]
│   └── [Backlog - Someday/Maybe]
└── [Administracja - Area]
    ├── [Faktury - Area]
    └── [HR - Area]
```

### 6.2 Typy relacji (StreamRelationType)

| Typ | Opis | Przykład |
|---|---|---|
| `OWNS` | Własność - rodzic jest właścicielem | Firma -> Dział |
| `MANAGES` | Zarządzanie - rodzic zarządza | Menedżer -> Projekt |
| `BELONGS_TO` | Przynależność | Zadanie -> Projekt |
| `RELATED_TO` | Luźne powiązanie | Projekt A <-> Projekt B |
| `DEPENDS_ON` | Zależność | Frontend -> API (musi być gotowe) |
| `SUPPORTS` | Wsparcie | DevOps -> Projekt (wspiera) |

### 6.3 Reguły dziedziczenia (InheritanceRule)

Konfiguracja strumienia może przepływać w hierarchii:

| Reguła | Kierunek | Użycie |
|---|---|---|
| `NO_INHERITANCE` | Brak | Strumień ma własną niezależną konfigurację |
| `INHERIT_DOWN` | Rodzic -> Dziecko (domyślna) | Podstrumienie dziedziczą konfigurację rodzica |
| `INHERIT_UP` | Dziecko -> Rodzic | Zmiany w dziecku propagują się w górę |
| `BIDIRECTIONAL` | Obu kierunkach | Synchronizacja konfiguracji |

**Przykład INHERIT_DOWN:**
```
[Sprzedaż] (reviewFrequency: WEEKLY, enableAI: true)
├── [Kampania Q1] -> dziedziczy: reviewFrequency: WEEKLY, enableAI: true
└── [Pipeline]    -> dziedziczy: reviewFrequency: WEEKLY, enableAI: true
```

---

## 7. Konfiguracja strumieni

Każdy strumień ma pole `gtdConfig` (JSON) z konfiguracją (nazwa kolumny historyczna — w kodzie używamy aliasu `StreamConfig`):

```typescript
interface StreamConfig {
  inboxBehavior: {
    autoProcessing: boolean;        // AI automatycznie przetwarza
    autoCreateTasks: boolean;       // Automatycznie tworzy zadania
    defaultContext: string;         // Domyślny kontekst (@computer)
    defaultEnergyLevel: string;     // Domyślny poziom energii
    processAfterDays: number;       // Przypomnienie po X dniach
    purgeAfterDays: number;         // Auto-usunięcie po X dniach
  };

  availableContexts: string[];      // Dostępne konteksty
  energyLevels: string[];           // Dostępne poziomy energii
  reviewFrequency: string;          // DAILY | WEEKLY | MONTHLY | QUARTERLY

  processingRules: ProcessingRule[]; // Reguły automatyzacji
  automations: StreamAutomation[];    // Zaplanowane automatyzacje

  advanced: {
    enableAI: boolean;              // Włącz sugestie AI
    autoAssignContext: boolean;     // AI automatycznie przypisuje kontekst
    autoSetEnergyLevel: boolean;    // AI automatycznie ustawia energię
    enableBulkProcessing: boolean;  // Masowe przetwarzanie
    maxInboxItems: number;          // Limit elementów w inbox
  };

  analytics: {
    trackProcessingTime: boolean;   // Śledź czas przetwarzania
    trackDecisionTypes: boolean;    // Śledź typy decyzji
    generateInsights: boolean;      // Generuj insighty
    enableReporting: boolean;       // Włącz raporty
  };
}
```

### Domyślne konfiguracje per rola

Każda StreamRole ma domyślną konfigurację (tworzoną automatycznie):

- **INBOX**: autoProcessing=false, processAfterDays=3, purgeAfterDays=30
- **PROJECTS**: reviewFrequency=WEEKLY, enableAI=true
- **AREAS**: reviewFrequency=MONTHLY
- **REFERENCE**: enableAI=true (do wyszukiwania)
- **SOMEDAY_MAYBE**: reviewFrequency=MONTHLY
- **NEXT_ACTIONS**: autoAssignContext=true, autoSetEnergyLevel=true

---

## 8. Routing - automatyczne przypisywanie

Routing to mechanizm **automatycznego** przypisywania elementów (zadań, e-maili, treści) do odpowiednich strumieni.

### 8.1 Routing zadania

```
POST /api/v1/stream-management/route/task
Body: { taskId: "abc-123", preferredStreamId?: "def-456" }

Proces:
1. Pobierz treść zadania (tytuł, opis, tagi)
2. AI analizuje treść
3. Porównuje z istniejącymi strumieniami (wyszukiwanie wektorowe)
4. Zwraca najlepsze dopasowanie z confidence score

Odpowiedź:
{
  streamId: "best-match-id",
  streamName: "Kampania Q1",
  confidence: 0.87,           // 87% pewności
  reasoning: ["Matches keywords: marketing, Q1", "Similar to existing tasks"],
  fallbackUsed: false,
  suggestedContext: "@computer",
  suggestedEnergyLevel: "MEDIUM"
}
```

### 8.2 Routing e-maila

```
POST /api/v1/stream-management/route/email
Body: { messageId: "msg-123" }

Proces:
1. Pobierz treść e-maila (temat, nadawca, body)
2. AI analizuje treść i kontekst
3. Dopasowuje do strumienia
4. Opcjonalnie tworzy zadanie
```

### 8.3 Bulk routing

```
POST /api/v1/stream-management/route/bulk
Body: {
  resources: [
    { type: "task", id: "task-1" },
    { type: "email", id: "msg-1" },
    { type: "task", id: "task-2" }
  ]
}
```

---

## 9. Reguly przetwarzania

Reguły automatyzacji wykonują akcje gdy spełnione są warunki:

### 9.1 Struktura reguły

```typescript
interface ProcessingRule {
  id: string;
  name: string;                    // "Auto-assign marketing emails"
  active: boolean;
  priority: number;                // 0-100 (wyższy = ważniejszy)
  stopOnFirstMatch: boolean;       // Zatrzymaj po pierwszym dopasowaniu
  maxExecutionsPerDay: number;     // Limit dzienny

  triggers: [{
    type: 'EMAIL_RECEIVED' | 'TASK_CREATED' | 'CONTACT_UPDATED' |
          'DEAL_CHANGED' | 'MANUAL' | 'SCHEDULED';
    config: { /* trigger-specific config */ }
  }];

  conditions: [{
    field: string;                 // np. "subject", "from", "priority"
    operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'in';
    value: any;
    logicalOperator?: 'AND' | 'OR';
  }];

  actions: [{
    type: 'MOVE_TO_STREAM' | 'ASSIGN_CONTEXT' | 'SET_PRIORITY' |
          'CREATE_TASK' | 'SEND_NOTIFICATION' | 'CREATE_PROJECT';
    config: { /* action-specific config */ }
  }];
}
```

### 9.2 Przykład reguły

```json
{
  "name": "Pilne e-maile od klientów VIP",
  "active": true,
  "priority": 90,
  "triggers": [
    { "type": "EMAIL_RECEIVED", "config": {} }
  ],
  "conditions": [
    { "field": "from", "operator": "contains", "value": "@vip-client.com" },
    { "field": "subject", "operator": "contains", "value": "URGENT", "logicalOperator": "AND" }
  ],
  "actions": [
    { "type": "MOVE_TO_STREAM", "config": { "streamId": "next-actions-id" } },
    { "type": "SET_PRIORITY", "config": { "priority": "URGENT" } },
    { "type": "ASSIGN_CONTEXT", "config": { "context": "@phone" } },
    { "type": "SEND_NOTIFICATION", "config": { "message": "Pilny email od VIP!" } }
  ]
}
```

---

## 10. Scenariusze uzycia

### Scenariusz 1: Freelancer - Web Developer

```
Struktura strumieni:
├── [Źródło]                          <-INBOX
├── [Aktywne zadania]                  <-NEXT_ACTIONS
│   ├── @computer
│   ├── @phone
│   └── @meeting
├── [Klient: Firma ABC]               <-PROJECTS, StreamType: PROJECT
│   ├── [Redesign strony]             <- Pod-projekt
│   └── [Utrzymanie - miesięczne]     <-AREAS
├── [Klient: Startup XYZ]             <-PROJECTS
│   └── [MVP aplikacji]
├── [Czekam na]                        <-WAITING_FOR
├── [Kiedyś/Może]                      <-SOMEDAY_MAYBE (FROZEN)
│   ├── Nauczyć się Rust
│   ├── Napisać kurs online
│   └── Zbudować SaaS
├── [Baza wiedzy]                      <-REFERENCE
│   ├── Snippety kodu
│   ├── Dokumentacja API
│   └── Konwersacje z Claude
└── [Administracja]                    <-AREAS
    ├── Faktury
    └── Podatki
```

**Codzienne użycie:**
1. Rano: sprawdź Źródło - nowe maile, zadania
2. Przetwórz każdy element: zrób/deleguj/zaplanuj/archiwizuj
3. Pracuj z widoku "Aktywne zadania" filtrując po kontekście
4. Wieczorem: szybki przegląd "Czekam na"

**Przegląd tygodniowy:**
1. Sprawdź czy Źródło jest puste
2. Przejrzyj "Czekam na" - follow-up
3. Przejrzyj aktywne projekty - czy postępują
4. Rzuć okiem na "Kiedyś/Może" - czy coś odblokować?
5. Przejrzyj "Administracja" - zaległe faktury?

---

### Scenariusz 2: Zespół sprzedażowy (5 osób)

```
Struktura strumieni:
├── [Inbox sprzedaży]                  <- INBOX (wspólny dla zespołu)
├── [Pipeline]                         <- AREAS
│   ├── [Leady - nowe]                <- NEXT_ACTIONS
│   ├── [Kwalifikacja]               <- NEXT_ACTIONS
│   ├── [Oferta wysłana]             <- WAITING_FOR
│   └── [Negocjacje]                 <- NEXT_ACTIONS
├── [Kampanie]                         <- PROJECTS
│   ├── [Black Friday 2026]          <- PROJECT (zamrożony do października)
│   ├── [Webinar Q1]                 <- PROJECT (aktywny)
│   └── [Newsletter]                 <- AREAS (ciągły)
├── [Klienci VIP]                      <- AREAS
│   ├── [Firma ABC - obsługa]        <- AREAS
│   └── [Firma DEF - obsługa]        <- AREAS
├── [Materiały sprzedażowe]            <- REFERENCE
│   ├── Cenniki
│   ├── Prezentacje
│   └── Case studies
└── [Pomysły na przyszłość]            <- SOMEDAY_MAYBE (FROZEN)
```

**Reguły automatyzacji:**
```
Reguła 1: "Nowy lead z formularza"
  Trigger: EMAIL_RECEIVED (from: forms@oursite.com)
  Action: CREATE_TASK w "Leady - nowe" z PRIORITY: HIGH

Reguła 2: "Follow-up po 3 dniach"
  Trigger: SCHEDULED (co dzień o 9:00)
  Condition: tasks in "Oferta wysłana" older than 3 days
  Action: SEND_NOTIFICATION + MOVE_TO_STREAM "Negocjacje"

Reguła 3: "VIP email"
  Trigger: EMAIL_RECEIVED
  Condition: from contains "@vip-client.com"
  Action: SET_PRIORITY URGENT + ASSIGN_CONTEXT @phone
```

---

### Scenariusz 3: Manager projektu IT

```
Struktura strumieni:
├── [Inbox]                            <- INBOX
├── [Projekt: Nowa Platforma]          <- PROJECTS (główny)
│   ├── [Sprint 12 - aktywny]         <- PROJECT
│   │   ├── [Backend API]             <- PROJECT
│   │   ├── [Frontend UI]             <- PROJECT
│   │   └── [Testy]                   <- PROJECT
│   ├── [Sprint 13 - planowanie]      <- PROJECT (FROZEN)
│   ├── [Backlog]                     <- SOMEDAY_MAYBE
│   └── [Bugs]                        <- NEXT_ACTIONS
├── [Utrzymanie prod]                  <- AREAS
│   ├── [Monitoring]                  <- AREAS
│   └── [Incydenty]                   <- NEXT_ACTIONS
├── [Zespół]                           <- AREAS
│   ├── [1-on-1]                      <- AREAS
│   └── [Delegowane]                  <- WAITING_FOR
├── [Dokumentacja]                     <- REFERENCE
└── [Innowacje]                        <- SOMEDAY_MAYBE (FROZEN)
```

**AI Routing w akcji:**
```
Nowy email: "Bug report: Login page crashes on Safari"
  → AI analizuje treść
  → Confidence: 92% -> "Projekt: Nowa Platforma" > "Bugs"
  → Auto-tworzy zadanie: priority=HIGH, context=@computer
  → Powiadomienie do managera
```

---

### Scenariusz 4: Życie osobiste

```
├── [Źródło]                           <- INBOX
├── [Do zrobienia]                     <- NEXT_ACTIONS
├── [Zdrowie]                          <- AREAS
│   ├── [Bieganie - plan]             <- PROJECT
│   └── [Dieta]                       <- AREAS
├── [Finanse]                          <- AREAS
│   ├── [Budżet miesięczny]          <- AREAS
│   └── [Inwestycje]                  <- REFERENCE
├── [Dom]                              <- AREAS
│   ├── [Remont kuchni]              <- PROJECT
│   └── [Ogród]                      <- AREAS
├── [Rozwój]                           <- AREAS
│   ├── [Kurs TypeScript]            <- PROJECT
│   └── [Książki do przeczytania]    <- REFERENCE
├── [Czekam na]                        <- WAITING_FOR
└── [Kiedyś/może]                      <- SOMEDAY_MAYBE (FROZEN)
    ├── Nauczyć się gry na gitarze
    ├── Maraton
    └── Podróż do Japonii
```

---

## 11. Model danych (Prisma)

### 11.1 Model Stream

```prisma
model Stream {
  id              String       @id @default(uuid())
  name            String
  description     String?
  color           String       @default("#3B82F6")
  icon            String?
  settings        Json         @default("{}")
  status          StreamStatus @default(ACTIVE)
  templateOrigin  String?
  gtdConfig       Json         @default("{}")
  streamType      StreamType   @default(CUSTOM)
  organizationId  String
  createdById     String
  horizonLevel    Int          @default(0)
  pattern         String?      @default("custom") @db.VarChar(50)
  gtdRole         String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // AI Knowledge Base
  aiSource              AiSource?
  aiConversationsCount  Int?       @default(0)
  aiMessagesCount       Int?       @default(0)
  aiLastSyncAt          DateTime?
  aiKeywords            String[]   @default([])

  // Relacje
  tasks           Task[]
  projects        Project[]
  messages        Message[]
  inboxItems      InboxItem[]
  next_actions    next_actions[]
  precise_goals   precise_goals[]
  recurring_tasks RecurringTask[]
  processing_rules ProcessingRule[]
  timeline        Timeline[]
  // ... + hierarchia, flow patterns, AI conversations
}
```

### 11.2 Model stream_relations

```prisma
model stream_relations {
  id              String             @id @default(uuid())
  parentId        String             // FK -> Stream
  childId         String             // FK -> Stream
  relationType    StreamRelationType // OWNS, MANAGES, BELONGS_TO, ...
  description     String?
  isActive        Boolean            @default(true)
  inheritanceRule InheritanceRule    @default(INHERIT_DOWN)
  organizationId  String
  createdById     String
  createdAt       DateTime           @default(now())
  updatedAt       DateTime

  @@unique([parentId, childId])      // Nie można zduplikować relacji
}
```

### 11.3 Kluczowe enumy

```prisma
enum StreamStatus {
  ACTIVE | ARCHIVED | TEMPLATE | FLOWING | FROZEN
}

enum StreamType {
  WORKSPACE | PROJECT | AREA | CONTEXT | CUSTOM | REFERENCE
}

enum StreamRole {
  INBOX | NEXT_ACTIONS | WAITING_FOR | SOMEDAY_MAYBE |
  PROJECTS | CONTEXTS | AREAS | REFERENCE | CUSTOM
}

enum StreamRelationType {
  OWNS | MANAGES | BELONGS_TO | RELATED_TO | DEPENDS_ON | SUPPORTS
}

enum InheritanceRule {
  NO_INHERITANCE | INHERIT_DOWN | INHERIT_UP | BIDIRECTIONAL
}

enum EnergyLevel {
  HIGH | MEDIUM | LOW | CREATIVE | ADMINISTRATIVE
}

enum Priority {
  LOW | MEDIUM | HIGH | URGENT
}

enum TaskStatus {
  NEW | IN_PROGRESS | WAITING | COMPLETED | CANCELED
}
```

---

## 12. API Reference

### Bazowy URL: `/api/v1`

### 12.1 Zarządzanie strumieniami

| Metoda | Endpoint | Opis |
|---|---|---|
| GET | `/stream-management` | Lista strumieni (status: ACTIVE/FLOWING/FROZEN) |
| POST | `/stream-management` | Utwórz nowy strumień |
| GET | `/stream-management/by-role/:role` | Strumienie po roli |
| PUT | `/stream-management/:id/role` | Przypisz rolę |
| POST | `/stream-management/:id/migrate` | Migruj istniejący strumień |
| POST | `/stream-management/:id/freeze` | Zamroź strumień (+ dzieci rekurencyjnie) |
| POST | `/stream-management/:id/unfreeze` | Odmroź strumień (+ rodziców rekurencyjnie) |

### 12.2 Konfiguracja strumieni

| Metoda | Endpoint | Opis |
|---|---|---|
| GET | `/stream-management/:id/config` | Pobierz konfigurację strumienia |
| PUT | `/stream-management/:id/config` | Aktualizuj konfigurację |
| POST | `/stream-management/:id/config/reset` | Reset do domyślnej konfiguracji |

### 12.3 Hierarchia

| Metoda | Endpoint | Opis |
|---|---|---|
| GET | `/stream-management/:id/tree` | Drzewo hierarchii (query: maxDepth, includeAnalysis) |
| GET | `/stream-management/:id/ancestors` | Przodkowie strumienia (breadcrumb w górę) |
| GET | `/stream-management/:id/path` | Ścieżka do strumienia |
| POST | `/stream-management/:id/validate-hierarchy` | Waliduj hierarchię strumieni |

### 12.4 Routing (AI)

| Metoda | Endpoint | Opis |
|---|---|---|
| POST | `/stream-management/route/task` | Routing zadania do strumienia |
| POST | `/stream-management/route/email` | Routing e-maila |
| POST | `/stream-management/route/bulk` | Routing masowy |
| POST | `/stream-management/route/content` | Routing dowolnej treści |

### 12.5 Analiza i statystyki

| Metoda | Endpoint | Opis |
|---|---|---|
| POST | `/stream-management/analyze` | Analiza treści - sugestia strumienia |
| GET | `/stream-management/stats` | Statystyki strumieni |
| GET | `/stream-management/hierarchy-stats` | Statystyki hierarchii |
| GET | `/stream-management/routing-stats` | Statystyki routingu |

### 12.6 Reguły przetwarzania

| Metoda | Endpoint | Opis |
|---|---|---|
| POST | `/stream-management/:id/rules` | Utwórz regułę przetwarzania |
| GET | `/stream-management/:id/rules` | Lista reguł strumienia |
| POST | `/stream-management/rules/execute` | Wykonaj reguły ręcznie |

### 12.7 Wyszukiwanie wektorowe

| Metoda | Endpoint | Opis |
|---|---|---|
| POST | `/stream-management/index-vectors` | Indeksuj strumienie dla wyszukiwania |
| GET | `/stream-management/vector-status` | Status indeksowania |

### 12.8 Standardowe strumienie (CRUD)

| Metoda | Endpoint | Opis |
|---|---|---|
| GET | `/streams` | Lista wszystkich strumieni |
| POST | `/streams` | Utwórz strumień |
| GET | `/streams/:id` | Pobierz strumień |
| PUT | `/streams/:id` | Aktualizuj strumień |
| DELETE | `/streams/:id` | Usuń strumień |
| POST | `/streams/:id/archive` | Archiwizuj/przywróć |
| POST | `/streams/:id/duplicate` | Duplikuj strumień |
| GET | `/streams/stats` | Statystyki |
| GET | `/streams/frozen` | Lista zamrożonych |
| POST | `/streams/ai/suggest` | AI sugestia strumienia |

---

## 13. Struktura plikow

```
packages/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma              # Model Stream, stream_relations, enumy
│   ├── src/
│   │   ├── routes/
│   │   │   ├── streamManagement.ts     # 27 endpointów Stream Management
│   │   │   ├── streams.ts             # 10 endpointów standardowych
│   │   │   └── streamsMap.ts           # Mapa strumieni (wizualizacja)
│   │   ├── services/
│   │   │   ├── StreamService.ts        # Logika biznesowa strumieni
│   │   │   └── StreamConfigManager.ts  # Zarządzanie konfiguracją strumieni
│   │   └── types/
│   │       └── streams.ts              # Typy TypeScript, Zod schemas, defaults
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/streams/
│   │   │   ├── StreamManager.tsx       # Główny widok zarządzania
│   │   │   ├── StreamForm.tsx          # Formularz tworzenia/edycji
│   │   │   ├── StreamCard.tsx          # Karta strumienia (metryki, akcje)
│   │   │   ├── StreamConfigModal.tsx   # Modal konfiguracji strumienia
│   │   │   ├── StreamHierarchyModal.tsx # Modal hierarchii
│   │   │   ├── StreamMigrationModal.tsx # Modal migracji
│   │   │   └── CreateStreamRelationModal.tsx # Modal tworzenia relacji
│   │   ├── lib/api/
│   │   │   ├── streamManagement.ts     # API client dla Stream Management
│   │   │   ├── streams.ts             # API client standardowy
│   │   │   └── streamHierarchy.ts     # API client hierarchii
│   │   └── types/
│   │       ├── streams.ts              # Typy frontend (StreamRole, StreamType)
│   │       └── preciseGoals.ts        # Typy PreciseGoal (RZUT)
│   └── ...
```

---

## FAQ

**Q: Jaka jest różnica między StreamRole a StreamType?**
A: StreamRole = rola/przeznaczenie (CO robi), StreamType = struktura (JAK jest zorganizowany). Np. StreamRole=PROJECTS + StreamType=PROJECT.

**Q: Czy mogę mieć wiele strumieni Inbox?**
A: Technicznie tak, ale metodologia zaleca jeden centralny Inbox na organizację.

**Q: Co się dzieje gdy zamrożę strumień z podstrumieniami?**
A: Wszystkie podstrumienie też są zamrażane rekurencyjnie.

**Q: Jak AI routing decyduje gdzie przypisać element?**
A: Wyszukiwanie wektorowe (semantyczne) po treści + porównanie z istniejącymi elementami w strumieniach + confidence score.

**Q: Czy strumienie mogą mieć cykliczne zależności?**
A: Tabela `stream_relations` ma constraint `@@unique([parentId, childId])`, ale walidacja hierarchii (`validate-hierarchy`) sprawdza czy nie ma cykli.

**Q: Czy mogę przenieść zadanie między strumieniami?**
A: Tak - zmień `streamId` na zadaniu (Task) lub użyj routingu AI.
