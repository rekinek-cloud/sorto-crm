# 🚀 Zaawansowane funkcje AI — Fazy 2 i 3
## CRM Streams | Roadmap rozwoju

---

## FAZA 2: Shadow Mode (Przygotowywanie brudnopisów)

### Koncepcja

```
┌─────────────────────────────────────────────────────────────┐
│                 POZIOM AUTONOMII 2.5                         │
│                    "Shadow Mode"                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Standardowy poziom 2:                                       │
│  AI wykonuje → loguje → user przegląda                      │
│                                                              │
│  Shadow Mode (2.5):                                          │
│  AI PRZYGOTOWUJE EFEKT KOŃCOWY → user zatwierdza gotowe    │
│                                                              │
│  Różnica: User nie "zatwierdza akcję" tylko "wysyła draft"  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Wartość biznesowa

| Bez Shadow Mode | Z Shadow Mode |
|-----------------|---------------|
| AI: "Wyślij case study" | AI: [Przygotowany email z załącznikiem] |
| User: Otwiera maila, pisze, szuka pliku, załącza | User: Klika "Wyślij" |
| Czas: 10-15 minut | Czas: 10 sekund |

---

### 2.1 Shadow Mode: Email Reply

**Wyzwalacz:** AI w `SOURCE_EMAIL` wykrywa że email wymaga odpowiedzi

**Obecne zachowanie:**
```json
{
  "requiresReply": true,
  "suggestedReplyTone": "formalny",
  "keyPoints": ["podziękować", "potwierdzić termin", "załączyć ofertę"]
}
```

**Shadow Mode:**
```json
{
  "requiresReply": true,
  "shadowDraft": {
    "status": "READY",
    "draftId": "draft-uuid-123",
    "subject": "Re: Zapytanie o współpracę",
    "body": "Dzień dobry,\n\nDziękuję za...",
    "attachments": ["oferta-2024.pdf"],
    "recipient": "jan.kowalski@firma.pl"
  },
  "actions": [
    { "label": "Wyślij", "action": "SEND_DRAFT", "style": "primary" },
    { "label": "Edytuj", "action": "OPEN_EDITOR", "style": "secondary" },
    { "label": "Odrzuć", "action": "DELETE_DRAFT", "style": "ghost" }
  ]
}
```

**Implementacja:**

```typescript
// services/shadowMode/emailDraft.ts

interface ShadowEmailDraft {
  id: string;
  status: 'GENERATING' | 'READY' | 'SENT' | 'EDITED' | 'DELETED';
  originalEmailId: string;
  subject: string;
  body: string;
  attachments: Attachment[];
  generatedAt: Date;
  sentAt?: Date;
}

async function generateEmailDraft(
  originalEmail: Email,
  aiAnalysis: SourceEmailAnalysis
): Promise<ShadowEmailDraft> {
  
  // 1. Pobierz kontekst
  const senderHistory = await getCommunicationHistory(originalEmail.from);
  const relevantDocs = await findRelevantAttachments(aiAnalysis.keyPoints);
  
  // 2. Wygeneruj treść
  const draftContent = await callAI('EMAIL_REPLY_GENERATOR', {
    originalEmail,
    tone: aiAnalysis.suggestedReplyTone,
    keyPoints: aiAnalysis.keyPoints,
    senderHistory,
    userSignature: await getUserSignature()
  });
  
  // 3. Zapisz jako draft
  const draft = await prisma.shadowEmailDraft.create({
    data: {
      originalEmailId: originalEmail.id,
      subject: `Re: ${originalEmail.subject}`,
      body: draftContent.body,
      attachments: relevantDocs,
      status: 'READY'
    }
  });
  
  // 4. Opcjonalnie: utwórz draft w Gmail/Outlook
  if (userSettings.syncDraftsToProvider) {
    await emailProvider.createDraft(draft);
  }
  
  return draft;
}
```

**Nowy prompt: EMAIL_REPLY_GENERATOR**

```yaml
code: EMAIL_REPLY_GENERATOR
name: Generator odpowiedzi email (Shadow Mode)
category: SHADOW
variables:
  - originalEmail
  - tone
  - keyPoints
  - senderHistory
  - userSignature
  - companyContext
```

```
Jesteś asystentem pisania emaili w systemie Streams.

## ZADANIE
Napisz GOTOWĄ odpowiedź na email. Nie sugestie — pełną treść do wysłania.

## ORYGINALNY EMAIL
Od: {{originalEmail.from}}
Temat: {{originalEmail.subject}}
Treść: {{originalEmail.body}}

## TON ODPOWIEDZI
{{tone}}

## KLUCZOWE PUNKTY DO UWZGLĘDNIENIA
{{#each keyPoints}}
- {{this}}
{{/each}}

## HISTORIA Z NADAWCĄ
{{senderHistory}}

## KONTEKST FIRMY
{{companyContext}}

## ZASADY
1. Pisz naturalnie, nie jak AI
2. Zachowaj ton odpowiedni do relacji
3. Bądź konkretny i pomocny
4. Zakończ jasnym call-to-action
5. Użyj podpisu użytkownika

## PODPIS
{{userSignature}}

## FORMAT ODPOWIEDZI
{
  "subject": "Re: ...",
  "body": "Pełna treść emaila...",
  "suggestedAttachments": ["nazwa pliku jeśli warto załączyć"]
}
```

---

### 2.2 Shadow Mode: Deal Package

**Wyzwalacz:** AI w `DEAL_ADVISOR` sugeruje wysłanie materiałów

**Obecne zachowanie:**
```json
{
  "nextSteps": [
    {"action": "Wyślij case study branżowe", "priority": "HIGH"}
  ]
}
```

**Shadow Mode:**
```json
{
  "nextSteps": [...],
  "shadowPackage": {
    "status": "READY",
    "packageId": "pkg-uuid-456",
    "contents": [
      { "type": "CASE_STUDY", "file": "case-study-retail.pdf", "relevance": 92 },
      { "type": "PRICING", "file": "cennik-2024-q4.pdf", "customized": true }
    ],
    "emailDraft": {
      "subject": "Materiały dla ABC Sp. z o.o.",
      "body": "W załączeniu przesyłam..."
    }
  },
  "actions": [
    { "label": "Wyślij pakiet", "action": "SEND_PACKAGE", "style": "primary" },
    { "label": "Dostosuj", "action": "EDIT_PACKAGE", "style": "secondary" }
  ]
}
```

**Implementacja:**

```typescript
// services/shadowMode/dealPackage.ts

interface DealPackage {
  id: string;
  dealId: string;
  contents: PackageItem[];
  emailDraft: EmailDraft;
  status: 'GENERATING' | 'READY' | 'SENT';
}

interface PackageItem {
  type: 'CASE_STUDY' | 'PRICING' | 'PROPOSAL' | 'BROCHURE';
  fileId: string;
  fileName: string;
  relevanceScore: number;
  customizations?: Record<string, any>;
}

async function generateDealPackage(
  deal: Deal,
  aiAnalysis: DealAdvisorAnalysis
): Promise<DealPackage> {
  
  // 1. Znajdź odpowiednie materiały
  const relevantMaterials = await findRelevantMaterials({
    industry: deal.company.industry,
    dealSize: deal.value,
    stage: deal.stage,
    suggestedTypes: aiAnalysis.suggestedMaterials
  });
  
  // 2. Personalizuj jeśli możliwe
  const customizedMaterials = await Promise.all(
    relevantMaterials.map(m => customizeMaterial(m, deal))
  );
  
  // 3. Wygeneruj email przewodni
  const emailDraft = await callAI('DEAL_PACKAGE_EMAIL', {
    deal,
    materials: customizedMaterials,
    contactPerson: deal.primaryContact
  });
  
  // 4. Zapisz pakiet
  return prisma.dealPackage.create({
    data: {
      dealId: deal.id,
      contents: customizedMaterials,
      emailDraft,
      status: 'READY'
    }
  });
}
```

---

### 2.3 Shadow Mode: Podsumowanie spotkania

**Wyzwalacz:** Po spotkaniu w kalendarzu lub nagraniu głosowym

**Output:**
```json
{
  "meetingSummary": {
    "status": "READY",
    "summaryId": "sum-uuid-789",
    "participants": ["Jan Kowalski", "Anna Nowak"],
    "keyDecisions": [
      "Budżet zatwierdzony na 50k",
      "Start projektu: styczeń 2025"
    ],
    "actionItems": [
      { "task": "Przygotować umowę", "assignee": "Ty", "dueDate": "2024-12-15" },
      { "task": "Przesłać harmonogram", "assignee": "Anna", "dueDate": "2024-12-12" }
    ],
    "followUpEmail": {
      "draft": true,
      "body": "Dziękuję za spotkanie..."
    }
  },
  "actions": [
    { "label": "Utwórz zadania", "action": "CREATE_TASKS", "style": "primary" },
    { "label": "Wyślij podsumowanie", "action": "SEND_SUMMARY", "style": "secondary" }
  ]
}
```

---

### 2.4 Baza danych Shadow Mode

```sql
-- Główna tabela shadow artifacts
CREATE TABLE shadow_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,           -- EMAIL_DRAFT, DEAL_PACKAGE, MEETING_SUMMARY
  status VARCHAR(20) DEFAULT 'GENERATING',
  
  -- Powiązania
  source_type VARCHAR(50),             -- EMAIL, DEAL, MEETING, VOICE_NOTE
  source_id UUID,
  user_id UUID REFERENCES users(id),
  organization_id UUID,
  
  -- Zawartość
  content JSONB NOT NULL,
  
  -- Audyt
  generated_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  action_taken VARCHAR(50),            -- SENT, EDITED, DELETED, EXPIRED
  action_at TIMESTAMP,
  
  -- Metryki
  generation_time_ms INTEGER,
  user_edit_distance INTEGER,          -- Jak dużo user zmienił (0 = wysłał as-is)
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shadow_artifacts_user ON shadow_artifacts(user_id, status);
CREATE INDEX idx_shadow_artifacts_source ON shadow_artifacts(source_type, source_id);

-- Tabela do śledzenia jakości Shadow Mode
CREATE TABLE shadow_mode_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artifact_id UUID REFERENCES shadow_artifacts(id),
  
  -- Czy użytkownik użył draftu?
  was_used BOOLEAN,
  
  -- Jeśli edytował, co zmienił?
  edit_type VARCHAR(50),               -- NONE, MINOR, MAJOR, REWRITE
  edit_details JSONB,
  
  -- Feedback
  user_rating INTEGER,                 -- 1-5
  user_feedback TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2.5 UI Shadow Mode

```
┌─────────────────────────────────────────────────────────────┐
│ 📧 Nowy email od: Jan Kowalski                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ "Proszę o przesłanie oferty na system CRM..."               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 🤖 Shadow Mode: Przygotowałem odpowiedź                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Dzień dobry Panie Janie,                                │ │
│ │                                                         │ │
│ │ Dziękuję za zainteresowanie naszym systemem CRM.        │ │
│ │ W załączeniu przesyłam:                                 │ │
│ │ - Ofertę cenową dostosowaną do Państwa potrzeb         │ │
│ │ - Case study z branży retail                            │ │
│ │                                                         │ │
│ │ Czy możemy umówić się na demo w przyszłym tygodniu?     │ │
│ │                                                         │ │
│ │ 📎 oferta-abc-2024.pdf                                  │ │
│ │ 📎 case-study-retail.pdf                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [✓ Wyślij]    [✎ Edytuj]    [✗ Odrzuć]                     │
│                                                              │
│ 💡 Pewność AI: 87%  •  Czas generowania: 2.3s              │
└─────────────────────────────────────────────────────────────┘
```

---

## FAZA 3: Cognitive Load Management

### Koncepcja

```
┌─────────────────────────────────────────────────────────────┐
│              ZARZĄDZANIE OBCIĄŻENIEM POZNAWCZYM              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Problem:                                                    │
│  Użytkownik ma energię "HIGH" i wolny czas, ale...          │
│  - 6 spotkań pod rząd                                        │
│  - 3 trudne decyzje do podjęcia                             │
│  - Deadline projektu                                         │
│  = Spadek jakości decyzji mimo "dostępności"                │
│                                                              │
│  Rozwiązanie:                                               │
│  Budżet poznawczy (Cognitive Budget) per dzień              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Model obciążenia poznawczego

```typescript
interface CognitiveLoadModel {
  // Każda aktywność ma "koszt poznawczy"
  activityCosts: {
    DEEP_WORK: 8,           // Programowanie, pisanie, analiza
    MEETING_DECISION: 6,    // Spotkanie z decyzjami
    MEETING_INFO: 3,        // Spotkanie informacyjne
    CREATIVE: 7,            // Burza mózgów, projektowanie
    ADMIN: 2,               // Rutyna, emaile
    BREAK: -3,              // Regeneracja (ujemny koszt)
    CONTEXT_SWITCH: 2,      // Zmiana tematu
  };
  
  // Dzienny budżet
  dailyBudget: {
    default: 40,
    afterPoorSleep: 30,     // Z integracji z health trackers
    friday: 35,             // Naturalny spadek
  };
  
  // Progi alertów
  thresholds: {
    warning: 32,            // 80% budżetu
    critical: 38,           // 95% budżetu
    overload: 45,           // Przekroczenie — sugeruj przełożenie
  };
}
```

### 3.2 Rozszerzone TASK_OPTIMIZE

```yaml
code: TASK_OPTIMIZE_V2
name: Optymalizacja zadania z Cognitive Load
category: TASK
variables:
  - taskData
  - userEnergyPatterns
  - currentCognitiveLoad      # NOWE
  - dailyCognitiveBudget      # NOWE
  - upcomingHighLoadTasks     # NOWE
```

**Dodatkowa sekcja w prompcie:**

```
## OBCIĄŻENIE POZNAWCZE

Aktualny stan użytkownika:
- Wykorzystany budżet: {{currentCognitiveLoad}}/{{dailyCognitiveBudget}} punktów
- Nadchodzące wymagające zadania: {{upcomingHighLoadTasks}}

Koszt poznawczy tego zadania (oszacuj 1-10):
- Złożoność decyzyjna
- Wymagana kreatywność  
- Ryzyko błędu
- Presja czasowa

## ZASADY COGNITIVE LOAD

1. Jeśli budżet > 80% wykorzystany:
   - Sugeruj przełożenie zadań HIGH COST na jutro
   - Priorytetyzuj zadania LOW COST

2. Jeśli zadanie HIGH COST + budżet > 70%:
   - Zaproponuj rozbicie na mniejsze części
   - Sugeruj przerwę przed zadaniem

3. Grupuj podobne zadania (mniejszy context switch cost)

## FORMAT ODPOWIEDZI (rozszerzony)
{
  // ... standardowe pola ...
  "cognitiveAnalysis": {
    "taskCost": 7,
    "costBreakdown": {
      "complexity": 3,
      "creativity": 2,
      "risk": 1,
      "pressure": 1
    },
    "budgetAfterTask": 35,
    "recommendation": "OK|DELAY|SPLIT|NEEDS_BREAK",
    "reasoning": "Zadanie analityczne przy 70% wykorzystanym budżecie..."
  }
}
```

### 3.3 Integracja z Day Planner

**Nowy widżet: Cognitive Load Meter**

```
┌─────────────────────────────────────────────────────────────┐
│ 🧠 Budżet poznawczy                         Dziś: Wtorek   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Wykorzystano: ████████████░░░░░░░░ 28/40 punktów          │
│                                                              │
│  Rano (zrobione):                                           │
│  ├─ Analiza raportu Q4          ████████ 8 pkt             │
│  ├─ Spotkanie z zespołem        ██████ 6 pkt               │
│  └─ Emaile                      ██ 2 pkt                    │
│                                                              │
│  Popołudnie (plan):                                         │
│  ├─ Spotkanie z klientem        ██████ 6 pkt  ⚠️           │
│  ├─ Przerwa                     ─── -3 pkt                  │
│  └─ Review kodu                 ███████ 7 pkt  ⚠️          │
│                                                              │
│  Prognoza: 44/40 ⚠️ PRZEKROCZENIE                          │
│                                                              │
│  💡 Sugestia AI: Przełóż "Review kodu" na jutro rano,      │
│     gdy Twój budżet się zresetuje.                          │
│                                                              │
│  [Przesuń automatycznie]  [Zostaw tak]                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Prompt: COGNITIVE_ADVISOR

```yaml
code: COGNITIVE_ADVISOR
name: Doradca obciążenia poznawczego
category: DAY_PLANNER
variables:
  - currentLoad
  - dailyBudget
  - plannedTasks
  - completedTasks
  - userPatterns
  - timeOfDay
```

```
Jesteś ekspertem zarządzania energią poznawczą w systemie Streams.

## TWOJA ROLA
Monitorujesz "budżet decyzyjny" użytkownika i chronisz go przed przeciążeniem,
które prowadzi do złych decyzji i wypalenia.

## AKTUALNY STAN
Czas: {{timeOfDay}}
Wykorzystany budżet: {{currentLoad}}/{{dailyBudget}}
Wykonane dziś: {{completedTasks}}
Zaplanowane: {{plannedTasks}}

## WZORCE UŻYTKOWNIKA
{{userPatterns}}

## NAUKA O COGNITIVE LOAD
- Decyzje zużywają ograniczony zasób mentalny
- Jakość decyzji spada po przekroczeniu progu
- Context switching kosztuje ~15 min refocusu
- Przerwy regenerują budżet (ale nie w 100%)
- Rano mamy więcej zasobów niż wieczorem

## TWOJE ZADANIA
1. Oceń czy plan dnia jest realistyczny poznawczo
2. Wykryj potencjalne przeciążenie
3. Zasugeruj korekty (przesunięcia, przerwy, podziały)
4. Chroń użytkownika przed sobą samym

## ZASADY INTERWENCJI
- Load 70-80%: Delikatne ostrzeżenie
- Load 80-95%: Sugestia przełożenia
- Load >95%: Silna rekomendacja zmiany planu
- Load >110%: Alarm + automatyczna propozycja przeplanowania

## FORMAT ODPOWIEDZI
{
  "currentStatus": "GREEN|YELLOW|ORANGE|RED",
  "loadPercentage": 70,
  "projectedEndOfDay": 95,
  "warnings": [
    {"time": "14:00", "issue": "3 spotkania pod rząd", "severity": "MEDIUM"}
  ],
  "recommendations": [
    {
      "action": "MOVE_TASK",
      "taskId": "uuid",
      "from": "16:00 dziś",
      "to": "09:00 jutro",
      "reason": "Przekroczysz budżet o 15%",
      "savings": 7
    },
    {
      "action": "INSERT_BREAK",
      "at": "13:30",
      "duration": 15,
      "reason": "Regeneracja przed spotkaniem z klientem"
    }
  ],
  "confidence": 80,
  "reasoning": "Plan przekracza budżet o 4 punkty..."
}
```

---

### 3.5 Baza danych Cognitive Load

```sql
-- Śledzenie obciążenia poznawczego
CREATE TABLE cognitive_load_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  
  -- Budżet
  daily_budget INTEGER DEFAULT 40,
  budget_modifier VARCHAR(50),         -- NORMAL, POOR_SLEEP, FRIDAY, etc.
  
  -- Stan
  current_load INTEGER DEFAULT 0,
  peak_load INTEGER DEFAULT 0,
  peak_time TIME,
  
  -- Aktywności
  activities JSONB DEFAULT '[]',
  
  -- Alerty
  warnings_triggered INTEGER DEFAULT 0,
  overload_events INTEGER DEFAULT 0,
  
  -- Skuteczność
  tasks_completed INTEGER,
  tasks_quality_score DECIMAL(3,2),    -- Self-reported lub z review
  
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_cognitive_load_user_date ON cognitive_load_log(user_id, date);

-- Koszty poznawcze per typ aktywności (konfigurowalne)
CREATE TABLE cognitive_cost_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID,
  user_id UUID,                        -- null = org default
  
  activity_type VARCHAR(50) NOT NULL,
  base_cost INTEGER NOT NULL,
  
  -- Modyfikatory
  morning_modifier DECIMAL(3,2) DEFAULT 1.0,
  afternoon_modifier DECIMAL(3,2) DEFAULT 1.1,
  evening_modifier DECIMAL(3,2) DEFAULT 1.3,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id, activity_type)
);
```

---

## Harmonogram implementacji

### Faza 2: Shadow Mode (2-3 tygodnie)

| Tydzień | Zadanie |
|---------|---------|
| 1 | Infrastruktura: tabele, serwisy bazowe, UI komponentów |
| 1 | EMAIL_REPLY_GENERATOR prompt + testowanie |
| 2 | Integracja z providerami email (Gmail, Outlook) |
| 2 | DEAL_PACKAGE generator + biblioteka materiałów |
| 3 | Meeting summary + voice-to-summary |
| 3 | Metryki jakości, dashboard Shadow Mode |

### Faza 3: Cognitive Load (2-3 tygodnie)

| Tydzień | Zadanie |
|---------|---------|
| 1 | Model cognitive load, tabele, bazowe obliczenia |
| 1 | Integracja z TASK_OPTIMIZE i DAY_PLAN |
| 2 | COGNITIVE_ADVISOR prompt + testowanie |
| 2 | UI: Cognitive Load Meter widget |
| 3 | Integracja z health trackers (opcjonalnie) |
| 3 | A/B testy, kalibracja kosztów |

---

## Metryki sukcesu

### Shadow Mode

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Adoption rate | >50% | % użytkowników którzy użyli Shadow |
| Edit distance | <20% | Średnia ilość zmian przed wysłaniem |
| Time saved | >5 min/draft | Porównanie z ręcznym pisaniem |
| User satisfaction | >4/5 | Ocena w ankiecie |

### Cognitive Load

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Overload prevention | -30% | Redukcja dni >100% budżetu |
| Decision quality | +15% | Self-reported lub review score |
| End-of-day energy | +20% | Self-reported (1-5) |
| Task completion | +10% | Więcej ukończonych przy tym samym czasie |

---

**Koniec dokumentu**

*Fazy 2 i 3 do implementacji po ustabilizowaniu MVP*
