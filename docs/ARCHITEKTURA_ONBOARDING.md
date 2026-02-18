# Architektura Systemu Onboardingu Samo-budujacego CRM

> Dokument architektoniczny opisujacy jak system Sorto Streams sam wylaniana swoja strukture
> z danych uzytkownika -- bez konfiguracji uprzedniej.
>
> Wersja: 1.0 | Data: 2026-02-17

---

## Spis tresci

1. [Filozofia: CRM ktory wyrasta sam](#1-filozofia-crm-ktory-wyrasta-sam)
2. [Trzy fazy wylaniania sie](#2-trzy-fazy-wylaniania-sie)
3. [Faza 1: Obserwacja (dzien 1-7)](#3-faza-1-obserwacja)
4. [Faza 2: Wzorce (tydzien 2-4)](#4-faza-2-wzorce)
5. [Faza 3: Autopilot (miesiac 2+)](#5-faza-3-autopilot)
6. [Status implementacji](#6-status-implementacji)
7. [Progresywne pytania](#7-progresywne-pytania)
8. [Multi-source fusion](#8-multi-source-fusion)
9. [Confidence scoring](#9-confidence-scoring)
10. [Baza danych -- tabele zaangazowane w onboarding](#10-baza-danych)
11. [API endpoints](#11-api-endpoints)
12. [Frontend components](#12-frontend-components)

---

## 1. Filozofia: CRM ktory wyrasta sam

### Zasada fundamentalna

> **CRM nie jest czyms co konfigurujesz. CRM jest tym co wylania sie z twojej pracy.**

Tradycyjny CRM wymaga od uzytkownika opisania swojego biznesu ZANIM zacznie pracowac.
Sorto Streams dziala odwrotnie:

```
TRADYCYJNY CRM:
Konfiguruj -> Opisz procesy -> Zdefiniuj pipeline -> Importuj dane -> Pracuj
(2-6 tygodni zanim zobaczysz wartosc)

SORTO STREAMS:
Pracuj normalnie -> System obserwuje -> System proponuje -> Zatwierdzaj
(wartosc od pierwszego dnia)
```

### Progresywne odkrywanie

System nie pyta uzytkownika kim jest. Obserwuje co robi i mowi mu kim jest.
Kazda informacja ktora dociera -- email, notatka glosowa, zdjecie wizytowki,
spotkanie, faktura -- to okruch wiedzy o swiecie biznesowym uzytkownika.
System zbiera te okruchy i sklada z nich obraz:

- Kto jest klientem
- Nad czym uzytkownik pracuje
- Co jest pilne
- Jak wygladaja procesy

### Roznica wobec obecnego onboardingu

Obecny onboarding (`/onboarding/page.tsx`) to **tradycyjny model formularzowy**:
4 kroki -- nazwa firmy, branza (IndustryTemplate), wielkosc zespolu, cele.
Aplikuje szablon branzy i tworzy gotowa strukture.

Docelowy model onboardingu jest radykalnie inny:
**zero konfiguracji uprzedniej**. Uzytkownik podlacza email, a system
sam obserwuje, proponuje i buduje strukture CRM.

---

## 2. Trzy fazy wylaniania sie

```
  FAZA 1                    FAZA 2                     FAZA 3
  OBSERWACJA               WZORCE                     AUTOPILOT
  (dzien 1-7)              (tydzien 2-4)              (miesiac 2+)
  ___________              ____________               ____________
 |           |            |            |             |            |
 | Sluchanie |  -------> | Rozpoznaw. |  --------> | Wykonywanie|
 | Skanowanie|            | Propozycje |             | Monitorow. |
 | Propozycje|            | Struktury  |             | Briefing   |
 |___________|            |____________|             |____________|

  AI PROPONUJE             AI STRUKTURUJE             AI WYKONUJE
  User ZATWIERDZA          User KORYGUJE              User MONITORUJE

  Confidence: 0-60%        Confidence: 60-85%         Confidence: 85%+
```

### Poziomy autonomii

| Faza | Autonomia AI | Rola uzytkownika | Confidence wymagany |
|------|-------------|-----------------|---------------------|
| Obserwacja | Sugestia | Zatwierdza kazda propozycje | > 0% (wszystko jest propozycja) |
| Wzorce | Asystent | Zatwierdza zbiorczo, koryguje | > 60% |
| Autopilot | Autonomia | Monitoruje, interweniuje wyjatkowo | > 85% |

---

## 3. Faza 1: Obserwacja

### 3.1 Email Sync (IMAP/Gmail) [ZAIMPLEMENTOWANE]

System synchronizuje emaile przez IMAP. Kazdy nowy email przechodzi przez
`RuleProcessingPipeline` -- 5-etapowy pipeline klasyfikacji i ekstrakcji.

**Plik:** `packages/backend/src/services/ai/RuleProcessingPipeline.ts`

**5 etapow pipeline:**

```
Email wchodzacy
       |
       v
  Stage 1: CRM Protection
  [Sprawdz kontakty/firmy w bazie -> jesli match: BUSINESS]
       |
       v
  Stage 2: Lists & Patterns
  [Blacklist/whitelist, wzorce email_domain_rules, email_patterns]
       |
       v
  Stage 2.5: AI Rules
  [Reguly z ai_rules: triggerConditions -> actions]
       |
       v
  Stage 3: Decyzja klasyfikacji
  [Priorytet: CRM > Lists > Patterns > Rules > default INBOX]
       |
       v
  Stage 4: Post-classification AI
  [Dwuetapowy triage: EMAIL_BIZ_TRIAGE -> EMAIL_BIZ_{CATEGORY}]
  [Ekstrakcja: firmy, kontakty, deale, zadania, streamy, cele RZUT]
       |
       v
  Stage 5: Post-actions
  [RAG, Flow, entity creation/proposals, blacklist, tasks]
```

**Kluczowy mechanizm HITL (Human-in-the-Loop):**

Jesli `postActions[classification].requireReview === true`, pipeline NIE tworzy
encji automatycznie. Zamiast tego tworzy rekordy w tabeli `ai_suggestions`
ze statusem `PENDING`. Uzytkownik widzi propozycje w `AnalysisPreviewModal`
i decyduje co zatwierdzic.

```
AI analizuje email
       |
       v
ai_suggestions (status: PENDING)
  - CREATE_COMPANY: {name, domain, nip}
  - CREATE_CONTACT: {firstName, lastName, email}
  - CREATE_DEAL: {title, value, stage}
  - CREATE_TASK: {title, priority, deadline}
  - ROUTE_TO_STREAM: {suggestedRole, context, energyLevel}
  - CREATE_GOAL_RZUT: {rezultat, zmierzalnosc, ujscie, tlo}
       |
       v
Frontend: AnalysisPreviewModal
       |
  +---------+----------+
  |         |          |
ACCEPT   MODIFY     REJECT
  |         |          |
  v         v          v
Encja    Encja z    ai_suggestions
tworzona modyfikacja status=REJECTED
         tworzona    + user_modifications
                     (feedback do uczenia)
```

### 3.2 Retroaktywny skan (30 dni wstecz) [DO ZAIMPLEMENTOWANIA]

**Koncepcja:** Przy pierwszym podlaczeniu skrzynki email, system skanuje
historyczne wiadomosci (30 dni wstecz) i buduje pierwszy obraz swiata
biznesowego uzytkownika.

**Proponowana architektura:**

```
POST /api/v1/onboarding/start-scan
  |
  v
RetroactiveScanService
  |
  +-- 1. Pobierz 30 dni emaili z IMAP (batch po 50)
  +-- 2. Dla kazdego emaila: RuleProcessingPipeline.processEntity()
  +-- 3. Agreguj wyniki:
  |     - Najczestsze domeny nadawcow -> propozycje firm
  |     - Powtarzajacy sie nadawcy -> propozycje kontaktow
  |     - Watki z kwotami/terminami -> propozycje deali
  |     - Wykryte wzorce -> flow_learned_patterns
  +-- 4. Buduj "raport pierwszego dnia":
  |     - Top 10 firm (posortowane wg czestosci)
  |     - Top 20 kontaktow
  |     - Wykryte watki sprzedazowe
  |     - Propozycja poczatkowej struktury strumieni
  +-- 5. Zapisz raport do ai_suggestions (bulk)
  |
  v
Frontend: OnboardingScanResultsModal
  - Pokazuje wyniki skanu
  - Uzytkownik zatwierdza/odrzuca firmy, kontakty
  - Bulk accept/reject przez AnalysisPreviewModal
```

**Tabele zaangazowane:**

- `message` -- synchronizowane emaile
- `data_processing` -- wyniki pipeline per email
- `ai_suggestions` -- propozycje encji z HITL
- `ai_executions` -- audit trail analizy AI

**Szacowany czas implementacji:** 2-3 tygodnie

### 3.3 Entity proposals (ai_suggestions) [ZAIMPLEMENTOWANE]

Tabela `ai_suggestions` to centralny mechanizm propozycji AI -> uzytkownik.

**Schema:**

```prisma
model ai_suggestions {
  id                 String    @id
  user_id            String
  organization_id    String
  context            String    @db.VarChar(50)   // Typ propozycji
  input_data         Json                         // Dane wejsciowe (np. messageId)
  suggestion         Json                         // Szczegoly propozycji
  confidence         Int?                         // Pewnosc 0-100
  reasoning          String?                      // Wyjasnienie AI
  status             String    @default("PENDING") // PENDING | ACCEPTED | REJECTED
  user_modifications Json?                         // Feedback/modyfikacje usera
  processing_time_ms Int?
  created_at         DateTime  @default(now())
  resolved_at        DateTime?
}
```

**Obslugiwane typy propozycji (context):**

| Context | Co tworzy | Z czego wynika |
|---------|-----------|----------------|
| `CREATE_COMPANY` | Firma | Domena nadawcy emaila, AI ekstrakcja |
| `CREATE_CONTACT` | Kontakt | Email nadawcy, AI parsowanie imienia |
| `CREATE_LEAD` | Lead | AI ekstrakcja z tresci emaila |
| `CREATE_DEAL` | Transakcja | AI wykryta szansa sprzedazowa |
| `CREATE_TASK` | Zadanie | AI wykryte action items |
| `ROUTE_TO_STREAM` | Routing do strumienia | AI kategoryzacja GTD |
| `CREATE_GOAL_RZUT` | Cel RZUT | AI wykryte cele (R-Z-U-T) |
| `BLACKLIST_DOMAIN` | Reguła blacklist | AI klasyfikacja NEWSLETTER |
| `UPDATE_CONTACT` | Aktualizacja kontaktu | Nowe info w emailu |
| `SEND_NOTIFICATION` | Powiadomienie | Alert AI |

**API:**

- `GET /api/v1/ai-suggestions` -- lista propozycji z filtrami
- `POST /api/v1/ai-suggestions/:id/accept` -- zatwierdzenie (z opcjonalnymi modyfikacjami)
- `POST /api/v1/ai-suggestions/:id/reject` -- odrzucenie (z feedbackiem)
- `PUT /api/v1/ai-suggestions/:id` -- edycja propozycji przed zatwierdzeniem
- `POST /api/v1/ai-suggestions/bulk-action` -- masowe zatwierdzenie/odrzucenie

### 3.4 AnalysisPreviewModal [ZAIMPLEMENTOWANE]

**Plik:** `packages/frontend/src/components/email/AnalysisPreviewModal.tsx`

Komponent HITL do przegladania i zatwierdzania propozycji AI.
Wyswietla wszystkie propozycje wygenerowane z analizy jednego emaila.

**Funkcjonalnosci:**
- Lista propozycji z checkboxami (domyslnie wszystkie zaznaczone)
- Typ propozycji z ikona i kolorem (firma, kontakt, deal, task, stream, cel RZUT)
- Szczegolowe pola propozycji (ProposalFields per typ)
- Confidence score per propozycja
- Reasoning AI per propozycja
- Bulk accept/reject
- Toggle zaznacz/odznacz wszystkie

**Przepływ danych:**

```
SmartMailboxes: "Analizuj" button
  -> POST /api/v1/email-pipeline/analyze/:messageId
     -> RuleProcessingPipeline.processEntity()
        -> createEntityProposals() -> ai_suggestions records
  <- response: { proposals: [...], requiresReview: true }
  -> AnalysisPreviewModal(proposals)
     -> User: accept/reject
        -> POST /api/v1/ai-suggestions/bulk-action
```

### 3.5 Tabele Fazy 1

| Tabela | Rola w onboardingu | Status |
|--------|-------------------|--------|
| `message` | Synchronizowane emaile | [ZAIMPLEMENTOWANE] |
| `data_processing` | Wyniki pipeline per email | [ZAIMPLEMENTOWANE] |
| `ai_suggestions` | Propozycje AI -> HITL | [ZAIMPLEMENTOWANE] |
| `ai_executions` | Audit trail kazdej operacji AI | [ZAIMPLEMENTOWANE] |
| `email_domain_rules` | Blacklist/whitelist domen | [ZAIMPLEMENTOWANE] |
| `email_patterns` | Wzorce klasyfikacji emaili | [ZAIMPLEMENTOWANE] |
| `ai_rules` | Reguly automatyzacji AI | [ZAIMPLEMENTOWANE] |
| `ai_prompt_templates` | Prompty per kategoria emaila | [ZAIMPLEMENTOWANE] |

---

## 4. Faza 2: Wzorce

### 4.1 flow_learned_patterns [SCHEMA ZAIMPLEMENTOWANE, SILNIK DO ZAIMPLEMENTOWANIA]

Tabela do uczenia sie wzorcow z decyzji uzytkownika.

**Schema:**

```prisma
model flow_learned_patterns {
  id             String          @id @default(uuid())
  organizationId String
  userId         String

  // Wzorzec wejsciowy
  elementType    FlowElementType              // EMAIL, VOICE, NOTE, etc.
  contentPattern String?         @db.Text     // Regex lub keywords
  senderPattern  String?                      // Wzorzec nadawcy
  subjectPattern String?                      // Wzorzec tematu

  // Nauczona decyzja
  learnedAction   FlowAction                  // ZROB_TERAZ, ZAPLANUJ, PROJEKT, etc.
  learnedStreamId String?                     // Stream do ktorego trafiło

  // Statystyki
  occurrences Int      @default(1)            // Ile razy zastosowane
  confidence  Float    @default(0.5)          // Pewnosc wzorca 0-1
  lastUsedAt  DateTime @default(now())

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Jak powinno dzialac (propozycja algorytmu):**

```
Uzytkownik przetwarza element X:
  - AI sugeruje: ZAPLANUJ -> stream "Projekty ABC"
  - Uzytkownik wybiera: PROJEKT -> stream "Nowe Leady"
  - wasUserOverride = true (zapisane w flow_processing_history)

System uczy sie:
  1. Znajdz lub utworz wzorzec w flow_learned_patterns:
     - elementType: EMAIL
     - senderPattern: *@abcokna.pl
     - learnedAction: PROJEKT
     - learnedStreamId: "id-strumienia-nowe-leady"
  2. Inkrementuj occurrences
  3. Przelicz confidence:
     confidence = occurrences / (occurrences + userOverrides)
  4. Jesli confidence > 0.8 i occurrences >= 5:
     -> Zaproponuj flow_automation_rule

Nastepnym razem gdy email od *@abcokna.pl:
  1. FlowEngineService sprawdza flow_learned_patterns
  2. Match: confidence 0.85 -> sugestia PROJEKT -> "Nowe Leady"
  3. Jesli autopilot wlaczony i confidence > threshold:
     -> Wykonaj automatycznie
```

**Warstwy inteligencji FlowEngineService (juz zaimplementowane w kodzie):**

```
4 WARSTWY INTELIGENCJI:
  1. Analiza tresci -- AI analizuje zawartosc
  2. Semantic matching -- embeddingi dopasowuja do streamow
  3. Reguly uzytkownika -- jawne reguly automatyzacji
  4. Nauczone wzorce -- few-shot learning z korekt uzytkownika
```

**Brakujacy element:** Algorytm ktory faktycznie zapisuje i odczytuje
wzorce z tabeli `flow_learned_patterns`. Szkielet serwisu istnieje
(`FlowEngineService.ts`), ale metody `learnPattern()` / `matchPatterns()`
nie sa zaimplementowane.

### 4.2 flow_automation_rules [SCHEMA ZAIMPLEMENTOWANE, SILNIK DO ZAIMPLEMENTOWANIA]

Reguly automatyzacji wyrastajace z nauczonych wzorcow.

**Schema:**

```prisma
model flow_automation_rules {
  id             String  @id @default(uuid())
  organizationId String
  userId         String

  name        String
  description String?
  isActive    Boolean @default(true)
  priority    Int     @default(0)

  // Warunki (JSON array)
  conditions Json          // [{field, operator, value}]

  // Akcja do wykonania
  action          FlowAction
  targetStreamId  String?
  targetProjectId String?

  // Opcje
  autoExecute   Boolean @default(false)  // Bez potwierdzenia
  notifyOnMatch Boolean @default(true)   // Powiadom o dopasowaniu

  // Statystyki
  executionCount Int       @default(0)
  lastExecutedAt DateTime?
}
```

**Roznica miedzy flow_automation_rules a ai_rules:**

| Aspekt | `flow_automation_rules` | `ai_rules` |
|--------|------------------------|------------|
| Pochodzenie | Wyrastaja z wzorcow (flow_learned_patterns) | Tworzone recznie przez usera |
| Cel | Routing elementow z Source do Streamow | Przetwarzanie emaili w pipeline |
| Trigger | Element w InboxItem (Flow Engine) | MESSAGE_RECEIVED (email pipeline) |
| Actions | FlowAction (ZROB_TERAZ, ZAPLANUJ, etc.) | forceClassification, setPriority, etc. |
| AI | Nie uzywa AI bezposrednio | Moze triggerowac AI prompty |

**Proponowany mechanizm promowania wzorca do reguly:**

```
flow_learned_patterns (confidence > 0.85, occurrences >= 5)
  |
  v
System proponuje (ai_suggestions, context: 'CREATE_AUTOMATION_RULE'):
  "Zauwazylem ze emaile od @abcokna.pl zawsze trafiaja do
   strumienia 'Projekty ABC'. Czy chcesz to zautomatyzowac?"
  [Tak, utworz regule] [Nie]
  |
  v (jesli tak)
flow_automation_rules:
  name: "Emaile ABC Okna -> Projekty ABC"
  conditions: [{field: "sender", operator: "endsWith", value: "@abcokna.pl"}]
  action: ZAPLANUJ
  targetStreamId: "id-strumienia-projekty-abc"
  autoExecute: false  // Najpierw z potwierdzeniem
```

### 4.3 Pattern discovery -- algorytm [DO ZAIMPLEMENTOWANIA]

**Proponowany serwis:** `PatternDiscoveryService.ts`

```
PatternDiscoveryService
  |
  +-- analyzeUserDecisions(organizationId, userId, days=14)
  |     1. Pobierz flow_processing_history z wasUserOverride=true
  |     2. Grupuj po: elementType + senderPattern + learnedAction
  |     3. Dla kazdej grupy:
  |        - Jesli occurrences >= 3 -> utworz/aktualizuj flow_learned_pattern
  |        - Jesli confidence > 0.85 i occurrences >= 5 -> zaproponuj regule
  |
  +-- discoverPipelineStages(organizationId)
  |     1. Pobierz wszystkie deale z historii
  |     2. Analizuj sekwencje zmian stage:
  |        PROSPECT -> QUALIFIED -> PROPOSAL -> NEGOTIATION -> CLOSED
  |     3. Jesli > 70% deali przechodzi ta sama sekwencje:
  |        -> Zaproponuj pipeline z tymi etapami
  |
  +-- discoverStreamStructure(organizationId)
  |     1. Pobierz wszystkie elementy InboxItem z ostatnich 30 dni
  |     2. Klasteryzuj po: elementType, suggestedAction, suggestedStreams
  |     3. Dla kazdego klastra:
  |        - Jesli > 10 elementow o podobnym wzorcu:
  |          -> Zaproponuj stream z opisowa nazwa
  |
  +-- discoverRecurringProcesses(organizationId)
        1. Analizuj sekwencje zadan per firma/kontakt
        2. Wykryj powtarzajace sie cykle:
           np. "zapytanie -> wizualizacja -> akceptacja -> produkcja -> montaz"
        3. Zaproponuj pipeline matching ten cykl
```

### 4.4 Pipeline suggestion [DO ZAIMPLEMENTOWANIA]

System na podstawie obserwowanych danych proponuje:

**a) Strukture pipeline:**
```
"Widzę powtarzajacy sie cykl w twoich projektach:
 zapytanie -> wizualizacja -> akceptacja -> produkcja -> montaz

 Czy tak wyglada twoj typowy proces?"

 [Tak, dokladnie] [Prawie, chce zmienic] [Nie]
```

**b) Strukture streamow:**
```
"Twoi najczesciej komunikujacy sie kontrahenci to:
 1. ABC Okna (47 emaili, 3 otwarte watki)
 2. XYZ Meble (23 emaile, 1 otwarty watek)
 3. DEF Szklo (18 emaili, 2 otwarte watki)

 Czy chcesz utworzyc strumienie robocze dla kazdego z nich?"

 [Tak, utworz strumienie] [Pokaz watki] [Nie]
```

---

## 5. Faza 3: Autopilot

### 5.1 ai_rules -- automatyzacja [ZAIMPLEMENTOWANE]

Tabela `ai_rules` to glowny silnik automatyzacji przetwarzania emaili.

**Schema (kluczowe pola):**

```prisma
model ai_rules {
  id                   String
  name                 String
  status               AIRuleStatus    @default(ACTIVE)
  priority             Int             @default(0)
  triggerType          AITriggerType   // MESSAGE_RECEIVED, SCHEDULED, etc.
  triggerConditions    Json            // {operator, conditions: [{field, operator, value}]}
  actions              Json            // {forceClassification, setPriority, addToRag, ...}
  dataType             String          @default("EMAIL")

  // Prompty AI
  templateId           String?         // Prompt z ai_prompt_templates
  aiPrompt             String?         // Inline user prompt
  aiSystemPrompt       String?         // Inline system prompt

  // Statystyki
  executionCount       Int  @default(0)
  successCount         Int  @default(0)
  errorCount           Int  @default(0)
  avgExecutionTime     Float?
  lastExecuted         DateTime?
}
```

**Jak dziala w kontekscie onboardingu:**

1. **Poczatkowe reguly** -- tworzone automatycznie przy setup
   (`POST /api/v1/email-pipeline/seed-defaults`)
2. **Reguly uzytkownika** -- tworzone recznie w `/dashboard/ai-rules/`
3. **Reguly z wzorcow** -- (przyszlosc) promowane z `flow_learned_patterns`

**3 poziomy autonomii (mapowanie na ai_rules):**

| Poziom | Konfiguracja w ai_rules | Zachowanie |
|--------|------------------------|-----------|
| Sugestia | `requireReview: true` | AI analizuje, tworzy ai_suggestions, user zatwierdza |
| Asystent | `requireReview: true` + batch | AI analizuje, user zatwierdza zbiorczo |
| Autopilot | `requireReview: false` | AI analizuje i tworzy encje automatycznie |

### 5.2 Auto-routing -- email classification pipeline [ZAIMPLEMENTOWANE]

Pipeline automatycznie klasyfikuje i routuje emaile:

```
Nowy email
  |
  v
CRM Protection: czy nadawca jest w bazie?
  |-- TAK -> BUSINESS (confidence 1.0)
  |-- NIE ->
      |
      v
  Lists & Patterns: blacklist? newsletter patterns?
  |-- BLACKLIST -> SPAM
  |-- NEWSLETTER pattern -> NEWSLETTER
  |-- NIE ->
      |
      v
  AI Rules: czy pasuje do reguly z ai_rules?
  |-- TAK -> forceClassification z reguly
  |-- NIE -> INBOX (default)
  |
  v
Post-classification AI:
  |-- BUSINESS -> dwuetapowy triage:
  |     Step 1: EMAIL_BIZ_TRIAGE (gpt-4o-mini, ~200ms)
  |     Step 2: EMAIL_BIZ_{CATEGORY} (gpt-4o, ~800ms)
  |     Kategorie: WSPOLPRACA, OFERTA, PYTANIE, REKLAMACJA, INNE...
  |
  |-- Inne -> EMAIL_POST_{classification}
  |
  v
Entity extraction:
  -> Firmy, kontakty, deale, zadania
  -> requireReview? ai_suggestions : auto-create
```

### 5.3 Progresywny confidence [DO ZAIMPLEMENTOWANIA]

**Koncepcja:** System stawia sie coraz bardziej autonomiczny w miare jak
uczy sie od uzytkownika.

**Mechanizm:**

```
Poczatek (Faza 1):
  - Wszystkie propozycje -> ai_suggestions (PENDING)
  - requireReview = true dla wszystkich kategorii
  - Confidence threshold: brak

Po 50 zatwierdzonych propozycjach (Faza 2):
  - System oblicza acceptance_rate per context:
    acceptance_rate = accepted / (accepted + rejected)
  - Jesli acceptance_rate > 0.9 dla danego context:
    -> Zaproponuj zmiane na Asystent (batch review)

Po 200 zatwierdzonych propozycjach (Faza 3):
  - Jesli acceptance_rate > 0.95:
    -> Zaproponuj zmiane na Autopilot
    "Twoje reguly routingu dzialaja z 95% trafnoscia.
     Wlaczyc autopilot dla emaili biznesowych?"
    [Tak, wlacz] [Jeszcze nie]

Mechanizm bezpieczenstwa:
  - Nigdy auto-delete (neverDeleteAuto w AutopilotConfig)
  - Dzienny limit autopilot actions
  - Poranny briefing pokazuje co autopilot zrobil
  - Mozliwosc cofniecia autopilot w kazdej chwili
```

**Proponowana tabela:** `onboarding_progress`

```prisma
model onboarding_progress {
  id             String  @id @default(uuid())
  organizationId String  @unique

  // Faza
  currentPhase   Int     @default(1)  // 1, 2, 3

  // Metryki Fazy 1
  emailsScanned        Int  @default(0)
  entitiesProposed     Int  @default(0)
  entitiesAccepted     Int  @default(0)
  entitiesRejected     Int  @default(0)

  // Metryki Fazy 2
  patternsDiscovered   Int  @default(0)
  rulesCreated         Int  @default(0)
  pipelineProposed     Boolean @default(false)

  // Metryki Fazy 3
  autopilotEnabled     Boolean @default(false)
  autopilotAccuracy    Float?
  autopilotActions     Int  @default(0)

  // Timestamps
  scanCompletedAt      DateTime?
  patternsAnalyzedAt   DateTime?
  autopilotEnabledAt   DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 5.4 Morning briefing -- Smart Day Planner [ZAIMPLEMENTOWANE]

System Smart Day Planner (`/dashboard/smart-day-planner/`) integruje sie
z autopiloteml i dostarcza poranny briefing:

**Plik:** `packages/backend/src/routes/dayPlanner.ts`

**Co briefing zawiera w kontekscie onboardingu:**

```
Briefing poranny (Faza 3):

  Autopilot wczoraj:
  - 12 emaili sklasyfikowanych automatycznie
  - 3 nowe firmy dodane do CRM
  - 2 zadania utworzone z emaili
  - 1 deal zaktualizowany

  Wymagaja uwagi:
  - Email od nowego nadawcy (confidence 0.45) -> wymaga recenzji
  - Transakcja ABC Okna zblizy sie do deadline

  Dzisiejsze priorytety:
  - [HIGH] Odpowiedz na zapytanie XYZ Meble
  - [MEDIUM] Przygotuj wizualizacje dla Budma
  - [LOW] Przejrzyj 5 propozycji AI (ai_suggestions)
```

### 5.5 Tabele Fazy 3

| Tabela | Rola w autopilot | Status |
|--------|-----------------|--------|
| `ai_rules` | Reguly automatyzacji z priorytetami | [ZAIMPLEMENTOWANE] |
| `ai_executions` | Audit trail kazdej operacji | [ZAIMPLEMENTOWANE] |
| `ai_prompt_templates` | Prompty per kategoria | [ZAIMPLEMENTOWANE] |
| `data_processing` | Wyniki przetwarzania per email | [ZAIMPLEMENTOWANE] |
| `onboarding_progress` | Postep onboardingu | [DO ZAIMPLEMENTOWANIA] |

---

## 6. Status implementacji

### Zaimplementowane

| Element | Opis | Pliki |
|---------|------|-------|
| **Email pipeline 5-stage** | Klasyfikacja, CRM Protection, Lists, AI Rules, Post-AI | `RuleProcessingPipeline.ts` |
| **Dwuetapowy triage** | EMAIL_BIZ_TRIAGE -> EMAIL_BIZ_{CATEGORY} | `RuleProcessingPipeline.runBusinessTriage()` |
| **ai_suggestions HITL** | Propozycje AI z accept/reject/modify | `routes/aiSuggestions.ts` |
| **AnalysisPreviewModal** | Frontend do przegladania propozycji | `components/email/AnalysisPreviewModal.tsx` |
| **Entity extraction** | Firmy, kontakty, deale, zadania, leady, cele RZUT | `createEntityProposals()` |
| **Stream routing** | Propozycja routingu do strumienia GTD | `ROUTE_TO_STREAM` w ai_suggestions |
| **Correction & learning** | Korekta klasyfikacji z logowaniem | `applyCorrection()` |
| **AI Rules engine** | Reguly automatyzacji emaili | `applyAIRules()` |
| **Email pipeline API** | Stats, rules, test, process-batch, analyze | `routes/emailPipeline.ts` |
| **Flow Engine** | 4 warstwy inteligencji, semantic matching | `FlowEngineService.ts` |
| **Flow conversations** | Dialog z AI o elemencie | `routes/flowConversation.ts` |
| **Smart Day Planner** | Poranny briefing z AI | `routes/dayPlanner.ts` |
| **Obecny onboarding** | Formularzowy: nazwa, branza, zespol | `onboarding/page.tsx` |
| **IndustryTemplate** | Szablony branzowe | `IndustryTemplateService.ts` |
| **Prompt management** | Prompty per kategoria z DB | `PromptManager.ts` |
| **RAG** | Wyszukiwanie semantyczne | `FlowRAGService.ts` |
| **Blacklist/whitelist** | Reguly domenowe | `email_domain_rules` |

### Do zaimplementowania

| Element | Priorytet | Opis |
|---------|-----------|------|
| **Retroaktywny skan** | KRYTYCZNY | Analiza 30 dni emaili przy onboardingu |
| **Pattern learning engine** | KRYTYCZNY | Zapis i odczyt wzorcow z flow_learned_patterns |
| **Pattern-to-rule promotion** | WAZNY | Promowanie wzorcow do flow_automation_rules |
| **Pipeline discovery** | WAZNY | Wykrywanie sekwencji etapow projektow |
| **Stream structure discovery** | WAZNY | Propozycje streamow z klasteryzacji danych |
| **Progressive confidence** | WAZNY | Automatyczne zwiekszanie autonomii |
| **Onboarding progress tracking** | WAZNY | Tabela onboarding_progress |
| **Progresywne pytania** | WAZNY | Kontekstowe pytania zamiast formularzy |
| **Multi-source fusion** | WAZNY | Laczenie informacji z roznych zrodel |
| **Confidence scoring wielozrodlowy** | WAZNY | Skumulowany confidence z wielu zrodel |
| **Nowy onboarding flow UI** | SREDNII | Przebudowa frontendu onboardingu |
| **Morning briefing -- autopilot** | SREDNII | Raport co autopilot zrobil |
| **Promptery per typ zrodla** | SREDNII | Specjalizowane prompty dla voice, zdjec, etc. |

---

## 7. Progresywne pytania [DO ZAIMPLEMENTOWANIA]

### Koncepcja

Zamiast formularza "opisz swoj biznes", system zadaje kontekstowe pytania
rozlozone w czasie, bazujac na obserwacjach.

```
Dzien 1:  Nic nie pyta. Tylko zbiera dane.

Dzien 3:  "Widze duzo emaili o targach. Budujesz stoiska?"
          [Tak] [Nie, to cos innego] [Pomin]

Dzien 5:  "ABC Okna to twoj najaktywniejszy kontakt.
           Masz z nimi 3 otwarte watki.
           Chcesz zebym utworzyl strumien dla nich?"
          [Tak, utworz] [Pokaz watki] [Nie]

Dzien 7:  "Widzę ze uzywasz slow 'wizualizacja' i 'kosztorys'
           w wiekszosci projektow. To branza wystawiennicza?"
          [Tak] [Nie] [Pokaz kontekst]

Dzien 14: "Mam gotowy pipeline pasujacy do twoich procesow.
           zapytanie -> wizualizacja -> akceptacja -> produkcja -> montaz
           Sprawdzisz?"
          [Pokaz] [Nie teraz]

Dzien 30: "Twoje reguly routingu dzialaja z 94% trafnoscia.
           Wlaczyc autopilot?"
          [Tak] [Jeszcze nie] [Co to znaczy?]
```

### Proponowana architektura

**Tabela:** `contextual_questions`

```prisma
model contextual_questions {
  id             String  @id @default(uuid())
  organizationId String
  userId         String

  // Pytanie
  questionType   String            // INDUSTRY, STREAM_PROPOSAL, PIPELINE, AUTOPILOT
  questionText   String  @db.Text
  context        Json              // Dane na podstawie ktorych pytanie powstalo

  // Trigger
  triggerDay     Int               // Po ilu dniach od startu
  triggerCondition Json?           // Warunek: np. {emailCount: ">50", topDomain: "abcokna.pl"}

  // Odpowiedz
  status         String  @default("PENDING") // PENDING, SHOWN, ANSWERED, SKIPPED
  answer         Json?             // Odpowiedz uzytkownika
  answeredAt     DateTime?

  // Wynikowa akcja
  resultAction   Json?             // Co system zrobil po odpowiedzi

  createdAt      DateTime @default(now())
}
```

**Serwis:** `ContextualQuestionService.ts`

```
ContextualQuestionService
  |
  +-- generateQuestions(organizationId, daysSinceStart)
  |     Na podstawie:
  |     - data_processing (statystyki emaili)
  |     - ai_suggestions (acceptance/rejection patterns)
  |     - flow_learned_patterns (wykryte wzorce)
  |     - message (najczestsze domeny, watki)
  |
  +-- showNextQuestion(organizationId, userId)
  |     Zwraca najwazniejsze niepokazane pytanie
  |     Priorytet: PIPELINE > STREAM_PROPOSAL > INDUSTRY > informacyjne
  |
  +-- answerQuestion(questionId, answer)
        Przetwarza odpowiedz i wykonuje akcje:
        - "Tak, to branza wystawiennicza" -> ApplyIndustryTemplate
        - "Tak, utworz strumien" -> Stream.create()
        - "Tak, wlacz autopilot" -> update ai_rules.requireReview = false
```

### Umiejscowienie w UI

Pytania pojawiaja sie:
1. **Dashboard widget** -- maly "AI Assistant" card z pytaniem
2. **Toast notification** -- przy logowaniu
3. **Smart Day Planner** -- sekcja "AI sugestie"
4. **Dedykowany panel** -- `/dashboard/onboarding-assistant/` (opcjonalnie)

---

## 8. Multi-source fusion [DO ZAIMPLEMENTOWANIA]

### Koncepcja

Laczenie informacji z roznych zrodel o tym samym temacie/encji.

**Przyklad:**
```
Zrodlo 1 (Email od jan@abcokna.pl):
  -> Firma: ABC Okna, Kontakt: Jan Kowalski, Temat: stoisko Budma

Zrodlo 2 (Notatka glosowa):
  -> "Rozmawiałem z Kowalskim z ABC Okna, budżet 60 tysięcy"

Zrodlo 3 (Zdjecie wizytowki):
  -> Jan Kowalski, Dyrektor Handlowy, ABC Okna Sp. z o.o.

Fuzja:
  Firma: ABC Okna Sp. z o.o.
    -> domain: abcokna.pl (email)
    -> budzet: 60000 PLN (notatka)
  Kontakt: Jan Kowalski
    -> email: jan@abcokna.pl (email)
    -> stanowisko: Dyrektor Handlowy (wizytowka)
  Deal: Stoisko Budma
    -> wartosc: 60000 PLN (notatka)
    -> etap: QUALIFIED (email + notatka = potwierdzone zainteresowanie)
```

### Proponowana architektura

**Kluczowa tabela:** `EntityLink` (juz istnieje w schemacie!)

```prisma
model EntityLink {
  id             String @id @default(uuid())
  organizationId String

  sourceType     String  // COMPANY, CONTACT, DEAL, TASK, etc.
  sourceId       String
  targetType     String
  targetId       String

  linkType       String  // BELONGS_TO, WORKS_AT, RELATED, MENTIONED_IN, etc.
  confidence     Float?  // 0-1
  source         String? // Skad pochodzi link: EMAIL_AI, VOICE_AI, MANUAL
  metadata       Json?
}
```

**Serwis:** `EntityFusionService.ts`

```
EntityFusionService
  |
  +-- fuseFromMultipleSources(organizationId, entityType, entityId)
  |     1. Pobierz wszystkie EntityLinks do tej encji
  |     2. Zbierz dane z kazdego zrodla
  |     3. Merge: priorytet wyzszy confidence + nowsze zrodlo
  |     4. Jesli konflikt: utworz ai_suggestion z pytaniem
  |
  +-- detectDuplicates(organizationId)
  |     1. Porownaj firmy: nazwa similar + domena matching
  |     2. Porownaj kontakty: email + imie/nazwisko fuzzy match
  |     3. Dla kazdego duplikatu: zaproponuj merge
  |
  +-- enrichEntity(organizationId, entityType, entityId, newSource)
        1. Porownaj istniejace dane z nowymi
        2. Dla kazdego nowego pola: dodaj jesli brak
        3. Dla konfliktu: ai_suggestion z pytaniem
```

---

## 9. Confidence scoring [DO ZAIMPLEMENTOWANIA]

### Koncepcja

Skumulowana pewnosc z wielu zrodel. Im wiecej zrodel potwierdza informacje,
tym wyzszy confidence.

### Mechanizm

```
Confidence per fakt:

  "ABC Okna jest firma klienta"
    -> Email: jan@abcokna.pl pisal o projekcie (confidence: 0.7)
    -> Notatka glosowa: "Kowalski z ABC Okna" (confidence: 0.6)
    -> Wizytowka: ABC Okna Sp. z o.o. (confidence: 0.9)

  Skumulowany confidence:
    C = 1 - PRODUCT(1 - Ci) = 1 - (1-0.7)(1-0.6)(1-0.9) = 1 - 0.012 = 0.988

  Interpretacja:
    0.0 - 0.3: Slaby sygnal (1 zrodlo, niski confidence)
    0.3 - 0.6: Umiarkowany (1-2 zrodla)
    0.6 - 0.8: Solidny (2-3 zrodla lub 1 z wysokim confidence)
    0.8 - 1.0: Pewny (3+ zrodla lub user-confirmed)
```

### Proponowana tabela: `entity_confidence`

```prisma
model entity_confidence {
  id             String @id @default(uuid())
  organizationId String

  entityType     String  // COMPANY, CONTACT, DEAL, etc.
  entityId       String
  factType       String  // IS_CLIENT, HAS_DEAL, INDUSTRY, etc.

  // Zrodla potwierdzajace
  sources        Json    // [{source: "EMAIL", confidence: 0.7, date: "..."}, ...]

  // Skumulowany confidence
  aggregatedConfidence Float

  // Ostatnia aktualizacja
  lastSourceAt   DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([organizationId, entityType, entityId, factType])
}
```

### Zastosowanie w onboardingu

```
Faza 1: Obserwacja
  - Kazdy email dodaje source do entity_confidence
  - Confidence rosnie z kazdym potwierdzeniem
  - Propozycje sortowane po aggregatedConfidence

Faza 2: Wzorce
  - Pattern z confidence > 0.8 -> automatyczna sugestia
  - Pattern z confidence > 0.95 -> kandydat na regule

Faza 3: Autopilot
  - Fakty z confidence > 0.9 -> autopilot akceptuje automatycznie
  - Fakty z confidence < 0.6 -> zawsze wymagaja recenzji
```

---

## 10. Baza danych

### Tabele bezposrednio zaangazowane w onboarding

| Tabela | Warstwa | Rola | Status |
|--------|---------|------|--------|
| **message** | Dane | Synchronizowane emaile IMAP | [ZAIMPLEMENTOWANE] |
| **data_processing** | Pipeline | Wyniki 5-stage pipeline per email | [ZAIMPLEMENTOWANE] |
| **ai_suggestions** | HITL | Propozycje AI -> user acceptance | [ZAIMPLEMENTOWANE] |
| **ai_rules** | Automatyzacja | Reguly przetwarzania emaili | [ZAIMPLEMENTOWANE] |
| **ai_executions** | Audit | Log kazdej operacji AI | [ZAIMPLEMENTOWANE] |
| **ai_prompt_templates** | AI | Prompty per kategoria/etap | [ZAIMPLEMENTOWANE] |
| **email_domain_rules** | Pipeline | Blacklist/whitelist domen | [ZAIMPLEMENTOWANE] |
| **email_patterns** | Pipeline | Wzorce klasyfikacji emaili | [ZAIMPLEMENTOWANE] |
| **flow_learned_patterns** | Uczenie | Nauczone wzorce z decyzji usera | [SCHEMA GOTOWE] |
| **flow_automation_rules** | Automatyzacja | Reguly routing Flow Engine | [SCHEMA GOTOWE] |
| **flow_processing_history** | Audit | Historia przetwarzania Flow | [ZAIMPLEMENTOWANE] |
| **flow_conversations** | Dialog | Konwersacje AI o elemencie | [ZAIMPLEMENTOWANE] |
| **InboxItem** | Dane | Elementy w Source (bramka wejsciowa) | [ZAIMPLEMENTOWANE] |
| **Stream** | Struktura | Strumienie robocze (GTD) | [ZAIMPLEMENTOWANE] |
| **IndustryTemplate** | Onboarding | Szablony branzowe | [ZAIMPLEMENTOWANE] |
| **vector_documents** | RAG | Dokumenty wektorowe do wyszukiwania | [ZAIMPLEMENTOWANE] |
| **EntityLink** | Fuzja | Powiazania miedzy encjami | [ZAIMPLEMENTOWANE] |
| **Company** | CRM | Firmy (cel ekstrakcji) | [ZAIMPLEMENTOWANE] |
| **Contact** | CRM | Kontakty (cel ekstrakcji) | [ZAIMPLEMENTOWANE] |
| **Deal** | CRM | Transakcje (cel ekstrakcji) | [ZAIMPLEMENTOWANE] |
| **Task** | GTD | Zadania (cel ekstrakcji) | [ZAIMPLEMENTOWANE] |
| **Lead** | CRM | Leady (cel ekstrakcji) | [ZAIMPLEMENTOWANE] |
| **onboarding_progress** | Onboarding | Postep i metryki onboardingu | [DO ZAIMPLEMENTOWANIA] |
| **contextual_questions** | Onboarding | Pytania kontekstowe | [DO ZAIMPLEMENTOWANIA] |
| **entity_confidence** | Scoring | Skumulowany confidence per fakt | [DO ZAIMPLEMENTOWANIA] |

### Diagram przepływu danych

```
EMAIL (IMAP)                     VOICE MEMO                    WIZYTOWKA
     |                                |                             |
     v                                v                             v
  message                        InboxItem                     InboxItem
     |                           (elementType:                 (elementType:
     v                            VOICE)                        IMAGE)
  RuleProcessingPipeline              |                             |
     |                                v                             v
     v                          FlowEngineService             FlowEngineService
  data_processing                     |                             |
     |                                v                             v
     +----> ai_suggestions <----------+-----------------------------+
     |         |                                    |
     |         v                                    v
     |    AnalysisPreviewModal              EntityFusionService
     |         |                                    |
     |    ACCEPT / REJECT                           v
     |         |                              entity_confidence
     |         v                                    |
     +----> Company / Contact / Deal / Task / Lead  |
                                                    v
                                          flow_learned_patterns
                                                    |
                                                    v
                                          flow_automation_rules
```

---

## 11. API endpoints

### Zaimplementowane

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/v1/email-pipeline/stats` | GET | Statystyki pipeline |
| `/api/v1/email-pipeline/rules` | GET/POST/PUT/DELETE | CRUD regul pipeline |
| `/api/v1/email-pipeline/test` | POST | Test pipeline na przykladowym emailu |
| `/api/v1/email-pipeline/analyze/:messageId` | POST | Reczna analiza emaila |
| `/api/v1/email-pipeline/process-batch` | POST | Batch przetwarzanie emaili |
| `/api/v1/email-pipeline/process-all` | POST | Przetworzenie wszystkich nieprzetworzonych |
| `/api/v1/email-pipeline/reprocess` | POST | Ponowne przetworzenie (po zmianie regul) |
| `/api/v1/email-pipeline/seed-defaults` | POST | Utworz domyslne reguly |
| `/api/v1/ai-suggestions` | GET | Lista propozycji AI |
| `/api/v1/ai-suggestions/:id/accept` | POST | Zatwierdzenie propozycji |
| `/api/v1/ai-suggestions/:id/reject` | POST | Odrzucenie propozycji |
| `/api/v1/ai-suggestions/:id` | PUT | Edycja propozycji |
| `/api/v1/ai-suggestions/bulk-action` | POST | Masowe accept/reject |
| `/api/v1/ai-rules` | GET/POST/PUT/DELETE | CRUD regul AI |
| `/api/v1/flow/process` | POST | Przetwarzanie elementu Flow Engine |
| `/api/v1/flow/conversations` | GET/POST | Konwersacje AI o elemencie |
| `/api/v1/smart-day-planner/*` | GET/POST | Smart Day Planner (briefing) |
| `/api/v1/industries` | GET | Lista szablonow branzowych |
| `/api/v1/industries/:slug/apply` | POST | Zastosowanie szablonu |

### Proponowane (do zaimplementowania)

| Endpoint | Metoda | Opis | Faza |
|----------|--------|------|------|
| `/api/v1/onboarding/start-scan` | POST | Rozpocznij retroaktywny skan emaili | 1 |
| `/api/v1/onboarding/scan-status` | GET | Status trwajacego skanu | 1 |
| `/api/v1/onboarding/scan-results` | GET | Wyniki skanu (agregacja) | 1 |
| `/api/v1/onboarding/progress` | GET | Aktualny postep onboardingu | 1-3 |
| `/api/v1/onboarding/phase` | GET | Aktualna faza i metryki | 1-3 |
| `/api/v1/onboarding/questions` | GET | Kontekstowe pytania do wyswietlenia | 2 |
| `/api/v1/onboarding/questions/:id/answer` | POST | Odpowiedz na pytanie | 2 |
| `/api/v1/patterns/discover` | POST | Uruchom odkrywanie wzorcow | 2 |
| `/api/v1/patterns/learned` | GET | Lista nauczonych wzorcow | 2 |
| `/api/v1/patterns/:id/promote` | POST | Promuj wzorzec do reguly | 2 |
| `/api/v1/autopilot/status` | GET | Status autopilota | 3 |
| `/api/v1/autopilot/enable` | POST | Wlacz autopilot per kategoria | 3 |
| `/api/v1/autopilot/report` | GET | Raport co autopilot zrobil | 3 |
| `/api/v1/entity-confidence/:type/:id` | GET | Skumulowany confidence encji | 2-3 |
| `/api/v1/entity-fusion/duplicates` | GET | Wykryte duplikaty | 2-3 |

---

## 12. Frontend components

### Zaimplementowane

| Komponent | Plik | Opis |
|-----------|------|------|
| **AnalysisPreviewModal** | `components/email/AnalysisPreviewModal.tsx` | HITL: przegladanie i zatwierdzanie propozycji AI |
| **OnboardingPage** | `app/[locale]/onboarding/page.tsx` | Obecny formularzowy onboarding (4 kroki) |
| **SmartMailboxes** | `app/[locale]/dashboard/smart-mailboxes/page.tsx` | Glowny hub komunikacji z przyciskiem "Analizuj" |
| **StreamManager** | `app/[locale]/dashboard/streams/page.tsx` | Zarzadzanie strumieniami GTD |
| **AIRulesPage** | `app/[locale]/dashboard/ai-rules/page.tsx` | Zarzadzanie regulami AI |
| **SmartDayPlanner** | `app/[locale]/dashboard/smart-day-planner/page.tsx` | Planowanie dnia z briefingiem AI |
| **DailyWidget** | Dashboard widget | Widget na glownym dashboardzie |

### Proponowane (do zaimplementowania)

| Komponent | Opis | Faza |
|-----------|------|------|
| **OnboardingScanModal** | Okno z postepem retroaktywnego skanu emaili | 1 |
| **ScanResultsView** | Wyswietlanie wynikow skanu: top firmy, kontakty, watki | 1 |
| **OnboardingAssistant** | Widget / panel z kontekstowymi pytaniami AI | 2 |
| **PatternViewer** | Przeglad nauczonych wzorcow z opcja edycji | 2 |
| **PipelineProposalModal** | Propozycja pipeline na podstawie obserwacji | 2 |
| **StreamProposalCard** | Propozycja nowego strumienia z kontekstem | 2 |
| **AutopilotDashboard** | Panel kontrolny autopilota z metrykam | 3 |
| **AutopilotReportModal** | Raport co autopilot zrobil (dzienny/tygodniowy) | 3 |
| **ConfidenceIndicator** | Wizualizacja skumulowanego confidence per encja | 2-3 |
| **EntityFusionPanel** | Panel laczenia informacji z wielu zrodel | 2-3 |
| **NewOnboardingFlow** | Nowy flow: podlacz email -> skan -> obserwacja | 1 |

### Proponowany nowy flow onboardingu (UI)

```
KROK 1: Podlacz email
  "Podlacz swoja skrzynke emailowa.
   System przeanalizuje ostatnie 30 dni i sam zbuduje twoj CRM."
  [Podlacz Gmail] [Podlacz IMAP] [Pomin - chce recznie]

KROK 2: Skanowanie (async, w tle)
  Animacja: progres bar ze statystykami w czasie rzeczywistym
  "Analizuje... 127/342 emaili
   Znaleziono: 23 firmy, 45 kontaktow, 12 watkow biznesowych"

KROK 3: Wyniki skanu
  "Oto co znalazlem w twoich emailach:"
  - Top 5 firm (z confidence scores)
  - Top 10 kontaktow
  - 3 aktywne watki biznesowe
  - Propozycja struktury streamow

  [Zatwierdz wszystkie] [Przejrzyj i wybierz] [Zacznij od zera]

KROK 4: Gotowe
  "Twoj CRM jest gotowy! System bedzie uczyc sie dalej."
  Dashboard z pierwszymi danymi.
  Widget "AI Assistant" z pytaniem kontekstowym za 2-3 dni.
```

---

## Podsumowanie

System onboardingu Sorto Streams to **odwrocony paradygmat** CRM:
zamiast wymagac konfiguracji, system sam ja buduje z danych uzytkownika.

**Co juz dziala:**
- Pelny pipeline przetwarzania emaili z klasyfikacja AI
- System HITL (ai_suggestions + AnalysisPreviewModal)
- Ekstrakcja encji CRM z emaili (firmy, kontakty, deale, zadania, cele RZUT)
- Reguly AI z 3 poziomami autonomii
- Schemat bazy danych dla uczenia wzorcow

**Co trzeba zbudowac:**
- Retroaktywny skan emaili
- Silnik uczenia wzorcow (flow_learned_patterns)
- Odkrywanie pipeline i struktury streamow
- Progresywne pytania kontekstowe
- Multi-source fusion i confidence scoring
- Nowy flow onboardingu w UI

**Mantra:**
> Nie pytaj uzytkownika kim jest. Obserwuj co robi i powiedz mu kim jest.

---

*Sorto Streams -- CRM ktory wyrasta z twojej pracy*
*Wersja architektoniczna: 2026-02-17*
