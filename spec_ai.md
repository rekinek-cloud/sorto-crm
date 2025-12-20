# 🤖 Specyfikacja AI Asystenta — CRM Streams
## Wersja 1.0 | Grudzień 2025

---

## 1. FILOZOFIA: Human-in-the-Loop

```
┌─────────────────────────────────────────────────────────┐
│                    ZASADA NADRZĘDNA                      │
│                                                          │
│   AI SUGERUJE  →  CZŁOWIEK DECYDUJE  →  AI SIĘ UCZY    │
│                                                          │
│   Żadna akcja zewnętrzna bez zatwierdzenia użytkownika  │
└─────────────────────────────────────────────────────────┘
```

### Poziomy autonomii

| Poziom | Nazwa | AI robi | Użytkownik robi | Przykład |
|--------|-------|---------|-----------------|----------|
| 0 | Brak | Nic | Wszystko | Wyłączony asystent |
| 1 | Sugestia | Proponuje | Zatwierdza każdą | Kategoryzacja elementu |
| 2 | Auto + Log | Wykonuje, loguje | Przegląda, może cofnąć | Tagowanie emaili |
| 3 | Auto cicha | Wykonuje w tle | Nic (może wyłączyć) | Grupowanie podobnych |

**Domyślnie:** Poziom 1 dla nowych użytkowników, eskalacja po 50 zatwierdzeniach.

---

## 1.1 KLUCZOWE MECHANIZMY AI

### Dynamic Few-Shot Prompting (Uczenie na żywo)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRZED WYWOŁANIEM AI                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Nowy element wpada do Źródła                            │
│                          ↓                                   │
│  2. Wyszukaj w bazie wektorowej 3 podobne elementy          │
│     które użytkownik ZMODYFIKOWAŁ i zaakceptował            │
│                          ↓                                   │
│  3. Wstrzyknij je jako przykłady do promptu                 │
│                          ↓                                   │
│  4. Wywołaj model z kontekstem historycznym                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Implementacja:**

```typescript
// Przed wywołaniem AI
async function buildFewShotContext(itemContent: string, userId: string) {
  // 1. Wektoryzuj nowy element
  const embedding = await getEmbedding(itemContent);
  
  // 2. Znajdź podobne z historii (tylko MODIFIED + ACCEPTED)
  const similarItems = await vectorSearch({
    embedding,
    filter: { userId, status: 'ACCEPTED', wasModified: true },
    limit: 3
  });
  
  // 3. Formatuj jako przykłady
  return similarItems.map(item => ({
    input: item.originalContent,
    aiSuggestion: item.originalSuggestion,
    userCorrection: item.finalDecision,
    reason: item.modificationReason
  }));
}
```

**Efekt:** Model uczy się preferencji użytkownika bez zmiany kodu promptu.

### Function Calling (Native Tool Use)

Zamiast wymuszać JSON w treści odpowiedzi, używamy natywnego API `tools`:

```
┌─────────────────────────────────────────────────────────────┐
│              STARY SPOSÓB (antypattern)                      │
├─────────────────────────────────────────────────────────────┤
│  "Odpowiedz WYŁĄCZNIE poprawnym JSON:"                      │
│  { "action": "X", "reasoning": "..." }                      │
│                                                              │
│  Problem: Model najpierw decyduje, potem uzasadnia          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              NOWY SPOSÓB (best practice)                     │
├─────────────────────────────────────────────────────────────┤
│  1. Model analizuje i "myśli" (Chain of Thought)            │
│  2. Model wywołuje funkcję: create_task(title, date)        │
│                                                              │
│  Efekt: Lepsza jakość decyzji, mniej halucynacji formatu   │
└─────────────────────────────────────────────────────────────┘
```

**Definicja narzędzi:**

```typescript
const AI_TOOLS = {
  source_analyze: [
    {
      type: "function",
      function: {
        name: "categorize_item",
        description: "Kategoryzuj element ze Źródła",
        parameters: {
          type: "object",
          properties: {
            action: { 
              type: "string", 
              enum: ["ZROB_TERAZ", "ZAPLANUJ", "DELEGUJ", "PROJEKT", "REFERENCJA", "KIEDYS_MOZE", "USUN"]
            },
            streamId: { type: "string", nullable: true },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
            dueDate: { type: "string", format: "date", nullable: true },
            tags: { type: "array", items: { type: "string" } }
          },
          required: ["action", "priority"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "extract_tasks",
        description: "Wyekstrahuj zadania z treści",
        parameters: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  dueDate: { type: "string", nullable: true }
                }
              }
            }
          }
        }
      }
    }
  ]
};
```

### Voice-to-Action (Rozbijanie notatek głosowych)

```
┌─────────────────────────────────────────────────────────────┐
│  INPUT (transkrypcja głosowa):                              │
│  "Spotkanie z Markiem było super, chce ofertę na 50k,       │
│   muszę przygotować wycenę do piątku, a i przypomnij        │
│   mi żebym kupił mleko"                                     │
├─────────────────────────────────────────────────────────────┤
│  OUTPUT (AI rozbija na osobne byty):                        │
│                                                              │
│  1. DEAL_UPDATE → CRM: Marek, wartość 50k                   │
│  2. TASK → Strumień "Sprzedaż": Wycena do piątku           │
│  3. TASK → Strumień "Dom": Kupić mleko                      │
└─────────────────────────────────────────────────────────────┘
```

**Flaga w metadanych:** `isVoiceTranscription: true`

**Dodatkowe narzędzie dla voice:**

```typescript
{
  type: "function",
  function: {
    name: "split_voice_note",
    description: "Rozbij notatkę głosową na osobne akcje",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["TASK", "DEAL_UPDATE", "NOTE", "REMINDER"] },
              content: { type: "string" },
              streamHint: { type: "string" },
              metadata: { type: "object" }
            }
          }
        }
      }
    }
  }
}
```

### Obsługa błędów (lastError)

Gdy użytkownik odrzuca lub modyfikuje sugestię, system przekazuje kontekst błędu:

```typescript
interface AIRequestContext {
  // ... standardowe pola
  lastError?: {
    previousSuggestion: any;
    userCorrection: string;
    correctionReason?: string;
  };
}
```

**Instrukcja w prompcie:**

```
Jeśli otrzymujesz lastError, oznacza to że poprzednia sugestia była błędna.
Przeanalizuj DLACZEGO użytkownik ją odrzucił i dostosuj swoje rozumowanie.
NIE powtarzaj tego samego błędu.
```

---

## 2. WYZWALACZE AI

### 2.1 Wyzwalacze automatyczne

| Zdarzenie | Akcja AI | Endpoint |
|-----------|----------|----------|
| Nowy element w Źródle | Analiza + sugestia kategoryzacji | `POST /api/v1/ai/analyze-source-item` |
| Nowy email | Ekstrakcja zadań + kategoryzacja | `POST /api/v1/ai/process-email` |
| Zbliżający się termin (24h) | Przypomnienie + sugestia priorytetu | `POST /api/v1/ai/deadline-alert` |
| Nieaktywny strumień (7 dni) | Sugestia zamrożenia | `POST /api/v1/ai/suggest-freeze` |
| Przegląd tygodniowy | Generowanie podsumowania | `POST /api/v1/ai/weekly-review` |
| Nowa transakcja CRM | Sugestia następnych kroków | `POST /api/v1/ai/deal-next-steps` |

### 2.2 Wyzwalacze na żądanie

| Akcja użytkownika | Odpowiedź AI | Endpoint |
|-------------------|--------------|----------|
| Klik "Zasugeruj strumień" | Lista pasujących strumieni | `POST /api/v1/streams/ai/suggest` |
| Klik "Pomóż mi zdecydować" | Analiza + rekomendacja | `POST /api/v1/ai/decision-help` |
| Klik "Optymalizuj dzień" | Plan dnia wg energii | `POST /api/v1/ai/optimize-day` |
| Klik "Podsumuj" | Streszczenie kontekstu | `POST /api/v1/ai/summarize` |

---

## 3. KONTEKSTY I ZACHOWANIA

### 3.1 Źródło (Inbox)

**Kiedy:** Nowy element trafia do Źródła

**AI analizuje:**
- Treść elementu
- Nadawcę (jeśli email)
- Słowa kluczowe
- Podobieństwo do poprzednich elementów

**AI sugeruje:**

```typescript
interface SourceItemSuggestion {
  suggestedAction: 'DO_NOW' | 'SCHEDULE' | 'DELEGATE' | 'PROJECT' | 'REFERENCE' | 'SOMEDAY' | 'DELETE';
  suggestedStream: string | null;      // ID strumienia
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  suggestedTags: string[];
  suggestedDueDate: Date | null;
  extractedTasks: string[];            // Wyekstrahowane zadania z treści
  confidence: number;                  // 0-100
  reasoning: string;                   // Wyjaśnienie dla użytkownika
}
```

**Prompt systemowy:**

```
Jesteś asystentem produktywności w systemie Streams. Analizujesz nowy element w Źródle.

KONTEKST UŻYTKOWNIKA:
- Aktywne strumienie: {{activeStreams}}
- Ostatnie decyzje: {{recentDecisions}}
- Preferencje: {{userPreferences}}

ELEMENT DO ANALIZY:
{{itemContent}}

ZADANIE:
1. Określ najlepszą akcję (Zrób teraz jeśli <2min, Zaplanuj jeśli wymaga czasu, itd.)
2. Dopasuj do istniejącego strumienia lub zasugeruj nowy
3. Wyekstrahuj konkretne zadania z treści
4. Oszacuj priorytet na podstawie pilności i ważności
5. Wyjaśnij swoje rozumowanie w 1-2 zdaniach

Odpowiedz w formacie JSON.
```

---

### 3.2 Strumienie

**Kiedy:** Tworzenie/edycja strumienia, przegląd

**AI sugeruje:**

```typescript
interface StreamSuggestion {
  suggestedPattern: 'project' | 'continuous' | 'reference' | 'client' | 'pipeline';
  suggestedParent: string | null;      // ID strumienia nadrzędnego
  suggestedColor: string;
  suggestedIcon: string;
  relatedStreams: string[];            // Podobne istniejące
  warningIfDuplicate: boolean;
  reasoning: string;
}
```

**Prompt systemowy:**

```
Jesteś asystentem organizacji w systemie Streams.

ISTNIEJĄCE STRUMIENIE:
{{existingStreams}}

NOWY STRUMIEŃ:
Nazwa: {{streamName}}
Opis: {{streamDescription}}

ZADANIE:
1. Zasugeruj wzorzec (projekt z końcem, ciągły obszar, referencja, klient, pipeline)
2. Sprawdź czy nie duplikuje istniejącego strumienia
3. Zasugeruj strumień nadrzędny jeśli pasuje do hierarchii
4. Dobierz kolor i ikonę pasujące do charakteru

Odpowiedz w formacie JSON.
```

---

### 3.3 Zadania

**Kiedy:** Tworzenie zadania, planowanie dnia

**AI sugeruje:**

```typescript
interface TaskSuggestion {
  suggestedEnergyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedDuration: number;           // minuty
  suggestedTimeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING';
  suggestedStream: string;
  relatedTasks: string[];              // Powiązane zadania
  blockers: string[];                  // Co może blokować
  reasoning: string;
}
```

---

### 3.4 Day Planner

**Kiedy:** Użytkownik otwiera planowanie dnia

**AI generuje:**

```typescript
interface DayPlanSuggestion {
  blocks: {
    startTime: string;
    endTime: string;
    taskId: string | null;
    blockType: 'DEEP_WORK' | 'MEETINGS' | 'ADMIN' | 'BREAK';
    energyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  reasoning: string;
  alternativePlan: { /* ta sama struktura */ };
}
```

**Prompt systemowy:**

```
Jesteś planistą dnia w systemie Streams.

DANE UŻYTKOWNIKA:
- Wzorce energii: {{energyPatterns}}
- Zadania do zaplanowania: {{todaysTasks}}
- Spotkania w kalendarzu: {{meetings}}
- Preferencje: {{preferences}}

ZASADY:
1. Zadania wymagające wysokiej energii planuj gdy użytkownik ma szczyt (zwykle rano)
2. Spotkania grupuj razem aby nie fragmentować dnia
3. Zostaw bufory między blokami (15 min)
4. Rutynowe zadania na koniec dnia
5. Zaplanuj przerwy co 90 minut

Zaproponuj plan dnia w formacie JSON.
```

---

### 3.5 Przegląd tygodniowy

**Kiedy:** Użytkownik rozpoczyna przegląd

**AI generuje:**

```typescript
interface WeeklyReviewSuggestion {
  summary: {
    completedTasks: number;
    completedProjects: number;
    newItems: number;
    streamsActivity: { streamId: string; activity: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  };
  insights: string[];                  // Obserwacje AI
  suggestionsForNextWeek: string[];    // Rekomendacje
  streamsToFreeze: string[];           // Nieaktywne strumienie
  streamsToUnfreeze: string[];         // Strumienie do odmrożenia
  stuckProjects: string[];             // Projekty bez postępu
  overdueItems: number;
}
```

---

### 3.6 CRM — Transakcje

**Kiedy:** Nowa transakcja, zmiana etapu

**AI sugeruje:**

```typescript
interface DealSuggestion {
  nextSteps: string[];                 // Proponowane zadania
  suggestedFollowUpDate: Date;
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  similarDeals: string[];              // Podobne wygrane/przegrane
  winProbabilityAdjustment: number;    // Korekta prawdopodobieństwa
  reasoning: string;
}
```

---

## 4. ENDPOINTY AI DO IMPLEMENTACJI

### 4.1 Główny endpoint analizy

```typescript
// POST /api/v1/ai/analyze
interface AIAnalyzeRequest {
  context: 'SOURCE' | 'STREAM' | 'TASK' | 'DAY_PLAN' | 'REVIEW' | 'DEAL';
  data: any;                           // Dane kontekstowe
  userId: string;
}

interface AIAnalyzeResponse {
  suggestions: any;                    // Zależne od kontekstu
  confidence: number;
  reasoning: string;
  processingTime: number;
}
```

### 4.2 Endpoint zatwierdzania

```typescript
// POST /api/v1/ai/feedback
interface AIFeedbackRequest {
  suggestionId: string;
  accepted: boolean;
  modifications: any | null;           // Jeśli użytkownik zmodyfikował
  userId: string;
}
```

### 4.3 Endpoint uczenia

```typescript
// GET /api/v1/ai/user-patterns/:userId
interface UserPatternsResponse {
  preferredStreams: { streamId: string; frequency: number }[];
  averageTaskDuration: number;
  peakEnergyHours: number[];
  acceptanceRate: number;              // % zaakceptowanych sugestii
  commonModifications: string[];       // Częste korekty użytkownika
}
```

---

## 5. STRUKTURA PROMPTÓW

### 5.1 Szablon bazowy

```
[ROLA]
Jesteś {{roleName}} w systemie Streams — aplikacji do zarządzania produktywnością metodą przepływu.

[KONTEKST UŻYTKOWNIKA]
{{userContext}}

[DANE WEJŚCIOWE]
{{inputData}}

[ZASADY]
1. Zawsze wyjaśniaj swoje rozumowanie
2. Podawaj poziom pewności (0-100)
3. Jeśli nie jesteś pewien, powiedz to
4. Sugeruj, nie decyduj
5. Odpowiadaj w formacie JSON

[ZADANIE]
{{specificTask}}
```

### 5.2 Konfiguracja modelu

```typescript
const AI_CONFIG = {
  model: 'gpt-4o-mini',               // Lub 'claude-3-haiku' dla Anthropic
  temperature: 0.3,                    // Niższa = bardziej deterministyczne
  maxTokens: 1000,
  systemPromptVersion: '1.0',
};
```

---

## 6. BAZA DANYCH — NOWE TABELE

### 6.1 Sugestie AI

```sql
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  context VARCHAR(50) NOT NULL,        -- SOURCE, STREAM, TASK, etc.
  input_data JSONB NOT NULL,
  suggestion JSONB NOT NULL,
  confidence INTEGER,
  reasoning TEXT,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, MODIFIED
  user_modifications JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_ai_suggestions_user ON ai_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status);
```

### 6.2 Wzorce użytkownika

```sql
CREATE TABLE user_ai_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) UNIQUE,
  preferred_streams JSONB DEFAULT '[]',
  energy_patterns JSONB DEFAULT '{}',
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  common_modifications JSONB DEFAULT '[]',
  total_suggestions INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. INTERFEJS UŻYTKOWNIKA

### 7.1 Komponent sugestii

```
┌─────────────────────────────────────────────┐
│ 🤖 Sugestia AI                    [×]       │
├─────────────────────────────────────────────┤
│                                             │
│ Proponuję: Zaplanuj na jutro               │
│ Strumień: Marketing                         │
│ Priorytet: Średni                           │
│                                             │
│ 💡 Ten email wygląda na zadanie do          │
│    wykonania w ciągu tygodnia.              │
│                                             │
│ Pewność: ████████░░ 78%                     │
│                                             │
├─────────────────────────────────────────────┤
│ [✓ Akceptuj]  [✎ Modyfikuj]  [✗ Odrzuć]   │
└─────────────────────────────────────────────┘
```

### 7.2 Panel AI w ustawieniach

```
┌─────────────────────────────────────────────┐
│ ⚙️ Ustawienia Asystenta AI                  │
├─────────────────────────────────────────────┤
│                                             │
│ Poziom autonomii:                           │
│ ○ Wyłączony                                 │
│ ● Sugestie (zatwierdzam każdą)             │
│ ○ Auto + Log (mogę cofnąć)                 │
│ ○ Auto cicha                                │
│                                             │
│ ─────────────────────────────────           │
│                                             │
│ Włączone konteksty:                         │
│ [✓] Źródło — analiza nowych elementów      │
│ [✓] Planowanie dnia                         │
│ [✓] Przegląd tygodniowy                    │
│ [ ] CRM — sugestie dla transakcji          │
│                                             │
│ ─────────────────────────────────           │
│                                             │
│ Statystyki:                                 │
│ Sugestii: 234  Zaakceptowanych: 89%        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 8. KOLEJNOŚĆ IMPLEMENTACJI

### Faza 1: Fundament (1-2 dni)
- [ ] Tabele `ai_suggestions` i `user_ai_patterns`
- [ ] Endpoint `POST /api/v1/ai/analyze`
- [ ] Endpoint `POST /api/v1/ai/feedback`
- [ ] Konfiguracja OpenAI w środowisku

### Faza 2: Źródło (2-3 dni)
- [ ] Analiza elementów w Źródle
- [ ] Komponent UI sugestii
- [ ] Uczenie się z feedbacku

### Faza 3: Planowanie (2 dni)
- [ ] Optymalizacja dnia
- [ ] Integracja z Day Planner

### Faza 4: Przeglądy (1-2 dni)
- [ ] Podsumowanie tygodniowe
- [ ] Sugestie zamrażania strumieni

### Faza 5: CRM (opcjonalnie)
- [ ] Sugestie dla transakcji
- [ ] Analiza pipeline

---

## 9. PRZYKŁAD IMPLEMENTACJI

### Serwis AI (backend)

```typescript
// src/services/aiService.ts

import OpenAI from 'openai';
import { prisma } from '../lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeSourceItem(
  itemId: string,
  userId: string
): Promise<SourceItemSuggestion> {
  
  // 1. Pobierz kontekst
  const item = await prisma.inboxItem.findUnique({ where: { id: itemId } });
  const userStreams = await prisma.stream.findMany({
    where: { organizationId: item.organizationId, status: 'ACTIVE' },
  });
  const recentDecisions = await prisma.aiSuggestion.findMany({
    where: { userId, status: 'ACCEPTED' },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  // 2. Zbuduj prompt
  const prompt = buildSourceItemPrompt(item, userStreams, recentDecisions);

  // 3. Wywołaj AI
  const startTime = Date.now();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
  });
  const processingTime = Date.now() - startTime;

  // 4. Parsuj odpowiedź
  const suggestion = JSON.parse(response.choices[0].message.content);

  // 5. Zapisz sugestię
  await prisma.aiSuggestion.create({
    data: {
      userId,
      context: 'SOURCE',
      inputData: { itemId },
      suggestion,
      confidence: suggestion.confidence,
      reasoning: suggestion.reasoning,
      processingTimeMs: processingTime,
    },
  });

  return suggestion;
}
```

---

## 10. METRYKI SUKCESU

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Wskaźnik akceptacji | >70% | `accepted / total` |
| Czas do decyzji | <5s | Średni czas response |
| Redukcja kliknięć | -30% | Porównanie z bez AI |
| Satysfakcja | >4/5 | Ankieta użytkowników |

---

**Koniec specyfikacji**

*Dokument gotowy do przekazania Claude Code*
