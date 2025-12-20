# Analiza formatu odpowiedzi AI w Flow Engine

## Data: 2025-12-16

## Problem zgłoszony przez użytkownika
Odpowiedź AI nie była zgodna z oczekiwanym formatem opisanym w `/opt/crm-gtd-smart/sample_ai.md`.

---

## 1. Oczekiwany format (sample_ai.md)

Według pliku `sample_ai.md`, AI powinno zwracać format z:
- `actionOptions` - lista OPCJI do wyboru przez użytkownika (nie jedna decyzja)
- `streamMatching` - lista strumieni z confidence scores
- `analysis` - z entities, complexity, urgency, missingInfo
- `summary` - neutralny opis BEZ ocen i mentorskiego tonu

### Kluczowe zasady z sample_ai.md:
1. NIE oceniaj pomysłu (bez "świetny", "ciekawy", "interesujący")
2. NIE decyduj za usera — daj OPCJE do wyboru
3. NIE wymyślaj nazw strumieni — wybieraj z listy dostępnych
4. Dla pomysłów bez pilności: domyślna akcja = KIEDYS_MOZE
5. NIE używaj tonu mentorskiego ("Pamiętaj", "Powinieneś")

---

## 2. Poprzedni format (przed zmianami)

Prompt SOURCE_ANALYZE używał formatu z pojedynczą decyzją:

```json
{
  "proposal": {
    "action": "ZAPLANUJ",  // AI DECYDUJE za użytkownika
    "streamId": "...",
    "firstSteps": [...]
  },
  "assistantMessage": "Świetny pomysł! Pamiętaj że..."  // mentorski ton
}
```

### Problemy starego formatu:
- AI podejmowało jedną decyzję zamiast dawać opcje
- `assistantMessage` zawierał oceny i mentorski ton
- Brak `actionOptions` - tylko jedna `proposal`

---

## 3. Co zostało zmienione

### 3.1 Prompt SOURCE_ANALYZE w bazie danych

**Lokalizacja**: Tabela `ai_prompt_templates`, kolumna `systemPrompt`, gdzie `code = 'SOURCE_ANALYZE'`

**Nowy prompt** (zapisany do bazy przez `/tmp/update_prompt.sh`):

```
Analizujesz element od uzytkownika. Zwroc TYLKO JSON zgodny ze schema ponizej.

## ZASADY

1. NIE oceniaj pomyslu (bez "swietny", "ciekawy", "interesujacy")
2. NIE decyduj za usera — daj OPCJE do wyboru
3. NIE wymyslaj nazw strumieni — wybieraj z listy dostepnych
4. Analizuj CO BRAKUJE w elemencie
5. Dla pomyslow biznesowych sugeruj konkretne pierwsze kroki
6. Domyslna akcja dla pomyslu bez pilnosci: KIEDYS_MOZE
7. Jezyk odpowiedzi = jezyk inputu (polski)
8. NIE uzywaj tonu mentorskiego ("Pamietaj", "Powinienes")
9. NIE zakladaj "my" ("bedziemy planowac")

## DOSTEPNE STRUMIENIE USERA

{{STREAMS}}

## DOSTEPNE PROJEKTY

{{PROJECTS}}

## FORMAT ODPOWIEDZI (JSON)

{
  "elementType": "IDEA | TASK | REFERENCE | REQUEST | OTHER",
  "subType": "BUSINESS_IDEA | PRODUCT_IDEA | FEATURE_IDEA | PERSONAL_IDEA | SIMPLE_TASK | COMPLEX_TASK | INFO | OTHER",
  "confidence": 85,

  "analysis": {
    "entities": {
      "technology": [],
      "industry": [],
      "people": [],
      "companies": [],
      "amounts": [],
      "dates": []
    },
    "complexity": "LOW | MEDIUM | HIGH",
    "timeHorizon": "IMMEDIATE | SHORT_TERM | LONG_TERM | SOMEDAY",
    "urgency": "CRITICAL | HIGH | MEDIUM | LOW | NONE",
    "completeness": "HIGH | MEDIUM | LOW",
    "missingInfo": ["lista brakujacych informacji"]
  },

  "actionOptions": [
    {
      "action": "ZAPLANUJ",
      "label": "Zaplanuj jako zadanie",
      "isDefault": false,
      "suggestedTasks": ["Krok 1", "Krok 2"],
      "suggestedTags": ["tag1", "tag2"]
    },
    {
      "action": "PROJEKT",
      "label": "Utworz projekt",
      "isDefault": false,
      "suggestedTasks": ["Krok 1", "Krok 2", "Krok 3"]
    },
    {
      "action": "KIEDYS_MOZE",
      "label": "Odloz na pozniej",
      "isDefault": true,
      "suggestedTags": ["tag1"],
      "reminderOptions": [...]
    },
    {
      "action": "REFERENCJA",
      "label": "Zapisz jako referencje",
      "isDefault": false,
      "suggestedTags": ["tag1"]
    }
  ],

  "streamMatching": {
    "matches": [
      { "streamId": "id-strumienia", "name": "Nazwa", "confidence": 70 }
    ],
    "bestMatch": { "streamId": "id", "name": "Nazwa", "confidence": 70 },
    "suggestNewStream": false,
    "newStreamNameSuggestion": null
  },

  "summary": "Krotki opis 1-2 zdania BEZ ocen i mentorskiego tonu",
  "reasoning": "Wewnetrzne wyjasnienie dlaczego taka analiza"
}

## WAZNE

- Dla kazdej akcji w actionOptions podaj odpowiednie suggestedTasks (2-4 konkretne kroki)
- isDefault: true tylko dla JEDNEJ akcji (najbardziej prawdopodobnej)
- streamMatching.matches: lista strumieni z dostepnych powyzej, posortowana wg confidence
- Dla pomyslow bez pilnosci: isDefault dla KIEDYS_MOZE
- Dla zadan z deadline: isDefault dla ZAPLANUJ
- summary: neutralny opis, bez "swietny pomysl", bez "Pamietaj ze..."

Zwroc TYLKO JSON, bez komentarzy, bez markdown.
```

### 3.2 Kod flowConversation.ts

**Plik**: `/opt/crm-gtd-smart/packages/backend/src/routes/flowConversation.ts`

**Zmieniono parsowanie odpowiedzi AI** (około linii 279-343):

```typescript
// NOWY KOD - parsuje actionOptions zamiast proposal
const actionOptions = aiResult.actionOptions || [];
const streamMatching = aiResult.streamMatching || {};

// Znajdź domyślną akcję (isDefault: true) lub pierwszą
const defaultOption = actionOptions.find((opt: any) => opt.isDefault) || actionOptions[0] || {};

// Znajdź stream ID z streamMatching.bestMatch
let proposedStreamId: string | null = null;
if (streamMatching.bestMatch?.streamId) {
  proposedStreamId = streamMatching.bestMatch.streamId;
} else if (streamMatching.bestMatch?.name) {
  const matchedStream = streams.find(s =>
    s.name.toLowerCase() === streamMatching.bestMatch?.name?.toLowerCase()
  );
  proposedStreamId = matchedStream?.id || null;
}

const mappedAction = actionMap[defaultOption.action] || 'ZAPLANUJ';

// Zapisuje summary jako content wiadomości
const assistantMessage = aiResult.summary ||
  `Element przeanalizowany. Domyślna akcja: ${defaultOption.action || 'ZAPLANUJ'}.`;

// Zapisuje pełne dane w metadata
await prisma.flow_conversation_messages.create({
  data: {
    conversationId: newConversation.id,
    role: 'assistant',
    content: assistantMessage,
    metadata: {
      actionOptions,           // NOWE - lista opcji
      streamMatching,          // NOWE - matching strumieni
      analysis: aiResult.analysis,
      elementType: aiResult.elementType,
      subType: aiResult.subType,
      confidence: aiResult.confidence
    }
  }
});
```

---

## 4. Wynik testu po zmianach

### Test endpoint: POST /api/v1/flow/conversation/start/{itemId}

### Odpowiedź:

```json
{
  "success": true,
  "data": {
    "messages": [{
      "content": "Faktura od dostawcy wymagająca przetworzenia i obsługi finansowej. Brakuje szczegółowych informacji o dokumencie.",
      "metadata": {
        "actionOptions": [
          {
            "action": "ZAPLANUJ",
            "label": "Zaplanuj przetworzenie faktury",
            "isDefault": true,
            "suggestedTasks": ["Zweryfikuj dane faktury", "Wprowadź do systemu księgowego", "Zaplanuj płatność", "Zarchiwizuj dokument"],
            "suggestedTags": ["faktura", "księgowość", "płatności"]
          },
          {
            "action": "REFERENCJA",
            "label": "Zapisz jako dokument",
            "isDefault": false,
            "suggestedTags": ["faktury", "dokumenty", "księgowość"]
          }
        ],
        "streamMatching": {
          "matches": [
            {"name": "Finanse", "streamId": "18284944-...", "confidence": 85},
            {"name": "Inbox", "streamId": "0d7f3ea5-...", "confidence": 60}
          ],
          "bestMatch": {"name": "Finanse", "streamId": "18284944-...", "confidence": 85}
        },
        "analysis": {
          "urgency": "MEDIUM",
          "complexity": "LOW",
          "missingInfo": ["nazwa dostawcy", "kwota faktury", "termin płatności"],
          ...
        }
      }
    }]
  }
}
```

---

## 5. Możliwe problemy do zbadania

### 5.1 Czy frontend obsługuje nowy format?
- Frontend może oczekiwać starego formatu z `proposal` zamiast `actionOptions`
- Sprawdzić komponenty w `/opt/crm-gtd-smart/packages/frontend/src/components/` obsługujące Flow

### 5.2 Czy inne endpointy używają tego samego formatu?
- `flow.ts` - endpoint `/flow/suggest/` - może używać innego parsowania
- Sprawdzić czy oba endpointy są spójne

### 5.3 Czy prompt jest poprawnie wstrzykiwany?
- Sprawdzić czy `{{STREAMS}}` i `{{PROJECTS}}` są poprawnie zastępowane
- Debug logi pokazują: `systemPrompt (first 800 chars): Analizujesz element od uzytkownika...`

### 5.4 Typowanie TypeScript
- Brak interfejsów TypeScript dla nowego formatu
- Może powodować problemy w runtime

### 5.5 Stary kod może nadal istnieć
- Sprawdzić czy nie ma innych miejsc parsujących odpowiedź AI w starym formacie

---

## 6. Pliki do sprawdzenia

1. **Backend**:
   - `/opt/crm-gtd-smart/packages/backend/src/routes/flowConversation.ts` - główna logika
   - `/opt/crm-gtd-smart/packages/backend/src/routes/flow.ts` - drugi endpoint
   - `/opt/crm-gtd-smart/packages/backend/src/modules/ai/service.ts` - serwis AI

2. **Frontend**:
   - Komponenty obsługujące Flow modal
   - Typy TypeScript dla odpowiedzi API

3. **Baza danych**:
   - Tabela `ai_prompt_templates` - prompt SOURCE_ANALYZE
   - Tabela `flow_conversations` - zapisane konwersacje

---

## 7. Komendy diagnostyczne

```bash
# Sprawdź aktualny prompt w bazie
PGPASSWORD=password psql -h localhost -p 5434 -U user -d crm_gtd_v1 -c \
  "SELECT substring(\"systemPrompt\" from 1 for 500) FROM ai_prompt_templates WHERE code = 'SOURCE_ANALYZE';"

# Sprawdź logi backendu
pm2 logs crm-backend --lines 50 | grep -E "(Flow|AI Response|actionOptions)"

# Test endpoint
curl -s -X POST "http://localhost:3003/api/v1/flow/conversation/start/{ITEM_ID}" \
  -H "Authorization: Bearer {TOKEN}" | jq '.data.messages[0].metadata'
```

---

## 8. Wniosek

Kod został zmieniony aby zwracać format zgodny z `sample_ai.md`. Test API pokazuje poprawny format z `actionOptions` i `streamMatching`.

**Jeśli frontend nadal pokazuje błędny wynik, problem może być w:**
- Komponencie frontendowym nie obsługującym nowego formatu
- Cache przeglądarki
- Innym endpoincie używanym przez frontend

---

## Autor zmian
Claude Code (automatycznie wygenerowane)
