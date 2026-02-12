# FLOW ENGINE - TASK 1: UI Konwersacji Flow

## Cel
Zbudować interfejs użytkownika do przeglądania i zatwierdzania sugestii AI w Flow Engine.

---

## Kontekst

Flow Engine działa (testy przeszły), ale brakuje UI do:
- Wyświetlania sugestii AI
- Zatwierdzania/korygowania/odrzucania
- Dialogu z AI (dopytywanie)

Tabela `flow_conversations` + `flow_conversation_messages` już istnieje.

---

## Wymagania funkcjonalne

### 1. Modal Flow Conversation

Gdy user klika "Flow" na elemencie w Źródle, otwiera się modal:

```
┌─────────────────────────────────────────────────────────┐
│  🌊 Przetwarzanie elementu                         [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📧 Email od: jan.kowalski@abcokna.pl                   │
│  Temat: Budma 2026 - akceptacja projektu                │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  🤖 AI Sugestia:                                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Typ: EMAIL                                      │    │
│  │ Akcja: ZAPLANUJ                                 │    │
│  │ Stream: Klienci → ABC Okna                      │    │
│  │ Pewność: 87%                                    │    │
│  │                                                 │    │
│  │ Wykryte zadania:                                │    │
│  │ ☑ Wystawić fakturę zaliczkową 50%              │    │
│  │   Deadline: koniec tygodnia                     │    │
│  │   Kwota: 22 500 EUR                             │    │
│  │                                                 │    │
│  │ Dlaczego ta sugestia?                           │    │
│  │ • Nadawca: jan.kowalski@abcokna.pl              │    │
│  │ • Rozpoznany kontakt: Jan Kowalski (ABC Okna)   │    │
│  │ • Temat zawiera "Budma 2026" - istniejący proj. │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  💬 Dopytaj AI: [________________________________]  📤  │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  [✓ Zatwierdź]   [✎ Koryguj]   [✗ Odrzuć]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Akcje użytkownika

#### A) Zatwierdź (✓)
- Wykonaj sugerowaną akcję
- Zapisz do `flow_processing_history`
- Wzmocnij wzorzec w `flow_learned_patterns` (confidence +0.05)
- Zamknij modal, odśwież listę Źródła

#### B) Koryguj (✎)
- Otwórz panel edycji:
  ```
  Stream: [Dropdown - wybierz inny] 
  Akcja:  [ZAPLANUJ ▼] 
  Zadanie: [Edytowalne pole]
  Deadline: [Date picker]
  ```
- Po zapisie: wykonaj skorygowaną akcję
- Zapisz korektę do `flow_conversations.userModifications`
- Utwórz/aktualizuj wzorzec w `flow_learned_patterns`

#### C) Odrzuć (✗)
- Oznacz `flow_conversations.status = CANCELLED`
- Element wraca do Źródła bez zmian
- Opcjonalnie: zapytaj o powód (feedback)

#### D) Dopytaj AI (💬)
- User pisze pytanie: "A może to do projektu Marketing?"
- AI odpowiada w kontekście elementu
- Historia w `flow_conversation_messages`
- AI może zmienić sugestię na podstawie dialogu

### 3. Widok listy w Źródle

Na liście elementów w Źródle pokazuj status:

```
┌─────────────────────────────────────────────────────────┐
│ 📧 Email: Budma 2026 - akceptacja                       │
│    jan.kowalski@abcokna.pl • 5 min temu                 │
│    🤖 Sugestia: ZAPLANUJ → Klienci (87%)    [Flow →]    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📄 Faktura VAT FV/2025/01/042                           │
│    Drukarnia XYZ • 1h temu                              │
│    ⏳ Oczekuje na analizę...                 [Flow →]    │
└─────────────────────────────────────────────────────────┘
```

### 4. Batch Processing

Gdy wiele elementów czeka:

```
┌─────────────────────────────────────────────────────────┐
│  📦 Przetwarzanie zbiorcze (7 elementów)               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ☑ Email: Budma 2026        → Klienci (87%)            │
│  ☑ Faktura: FV/2025/01/042  → Finanse (92%)            │
│  ☑ Notatka głosowa          → Operacje (78%)           │
│  ☐ Pomysł: Webinar          → Marketing (65%) ⚠️       │
│  ☑ Email: Zamówienie        → Sprzedaż (91%)           │
│  ...                                                    │
│                                                         │
│  ⚠️ 1 element wymaga uwagi (niska pewność)              │
│                                                         │
│  [Zatwierdź zaznaczone (6)]   [Przejrzyj pojedynczo]   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Wymagania techniczne

### Endpointy do wykorzystania

```typescript
// Już istnieją:
POST /api/v1/flow/analyze           // Analiza elementu
POST /api/v1/flow/conversation      // Start/kontynuacja konwersacji
POST /api/v1/flow/execute           // Wykonanie akcji
GET  /api/v1/flow/suggestions       // Lista sugestii

// Do sprawdzenia czy istnieją:
POST /api/v1/flow/batch             // Batch processing
POST /api/v1/flow/feedback          // Feedback po odrzuceniu
```

### Komponenty React do stworzenia

```
src/components/flow/
├── FlowConversationModal.tsx    // Główny modal
├── FlowSuggestionCard.tsx       // Karta z sugestią AI
├── FlowEditPanel.tsx            // Panel korekty
├── FlowChatInput.tsx            // Input do dopytywania
├── FlowMessageHistory.tsx       // Historia konwersacji
├── FlowBatchProcessor.tsx       // Przetwarzanie zbiorcze
└── FlowStatusBadge.tsx          // Badge statusu na liście
```

### Stan (Zustand/Context)

```typescript
interface FlowConversationState {
  activeConversation: FlowConversation | null;
  messages: FlowMessage[];
  suggestion: FlowSuggestion | null;
  isLoading: boolean;
  isEditing: boolean;
  
  // Actions
  startConversation: (inboxItemId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  approve: () => Promise<void>;
  correct: (corrections: FlowCorrection) => Promise<void>;
  reject: (reason?: string) => Promise<void>;
}
```

---

## Przykładowe dane z API

### Response z /flow/analyze

```json
{
  "conversationId": "uuid",
  "inboxItem": {
    "id": "uuid",
    "content": "Email content...",
    "elementType": "EMAIL"
  },
  "suggestion": {
    "action": "ZAPLANUJ",
    "streamId": "uuid",
    "streamName": "Klienci → ABC Okna",
    "confidence": 0.87,
    "taskTitle": "Wystawić fakturę zaliczkową 50%",
    "taskDeadline": "2025-02-14",
    "extractedData": {
      "person": "Jan Kowalski",
      "company": "ABC Okna",
      "amount": "22 500 EUR",
      "deadline": "koniec tygodnia"
    },
    "reasoning": [
      "Nadawca: jan.kowalski@abcokna.pl",
      "Rozpoznany kontakt: Jan Kowalski (ABC Okna)",
      "Temat zawiera 'Budma 2026' - istniejący projekt"
    ]
  }
}
```

---

## Testy akceptacyjne

1. [ ] User klika "Flow" → modal się otwiera z sugestią
2. [ ] Sugestia pokazuje: akcję, stream, pewność, reasoning
3. [ ] "Zatwierdź" → element znika ze Źródła, zadanie utworzone
4. [ ] "Koryguj" → można zmienić stream/akcję, AI się uczy
5. [ ] "Odrzuć" → element wraca do Źródła
6. [ ] Dopytanie AI → odpowiedź w kontekście
7. [ ] Batch processing → zaznacz wiele, zatwierdź naraz
8. [ ] Niska pewność (<70%) → wizualne ostrzeżenie

---

## Uwagi

- Zachowaj istniejący styl UI (Tailwind, shadcn/ui)
- Wszystkie teksty po polsku
- Responsywność: modal pełnoekranowy na mobile
- Accessibility: focus trap w modalu, keyboard navigation
