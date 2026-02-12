# FLOW ENGINE - TASK 3: Autopilot dla Wysokiej Pewności

## Cel
Zaimplementować tryb Autopilot, który automatycznie wykonuje akcje dla elementów z wysoką pewnością AI, bez konieczności zatwierdzania przez użytkownika.

---

## Kontekst

Tabela `flow_rules` istnieje z polem `autoExecute` (Boolean).
System powinien:
- Wykonywać automatycznie gdy confidence ≥ próg
- Logować wszystkie auto-akcje
- Pozwalać userowi przeglądać i cofać
- Być konfigurowalny per user/reguła

---

## Architektura Autopilota

```
┌─────────────────────────────────────────────────────────┐
│                 NOWY ELEMENT W ŹRÓDLE                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   FLOW ANALYZE      │
              │   (AI + Patterns)   │
              └─────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │  confidence >= 90%? │
              └─────────────────────┘
                    │         │
                   TAK       NIE
                    │         │
                    ▼         ▼
         ┌──────────────┐  ┌──────────────┐
         │  AUTOPILOT   │  │  SUGESTIA    │
         │  (auto exec) │  │  (czeka)     │
         └──────────────┘  └──────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  LOG + POWIADOMIENIE    │
         │  "Wykonano automatycznie"│
         │  [Cofnij]               │
         └──────────────────────────┘
```

---

## Wymagania funkcjonalne

### 1. Konfiguracja Autopilota

User może skonfigurować Autopilot globalnie lub per reguła:

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ Ustawienia Autopilota                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tryb Autopilota:                                       │
│  ○ Wyłączony - zawsze pytaj                            │
│  ○ Ostrożny  - auto tylko dla 95%+ pewności            │
│  ● Standardowy - auto dla 90%+ pewności                │
│  ○ Agresywny - auto dla 80%+ pewności                  │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Wyjątki (zawsze pytaj):                               │
│  ☑ Elementy z kwotą > 10 000 PLN                       │
│  ☑ Nowi nadawcy (pierwszy kontakt)                     │
│  ☑ Akcja = USUŃ                                        │
│  ☐ Weekendy i święta                                   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Powiadomienia o auto-akcjach:                         │
│  ● Pokaż w aplikacji                                   │
│  ☑ Wyślij email (podsumowanie dzienne)                 │
│                                                         │
│  [Zapisz ustawienia]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Logika wykonania Autopilota

```typescript
interface AutopilotConfig {
  enabled: boolean;
  confidenceThreshold: number;  // 0.80, 0.90, 0.95
  exceptions: {
    highValueAmount: number;     // np. 10000
    newSenders: boolean;
    deleteAction: boolean;
    weekends: boolean;
  };
  notifications: {
    inApp: boolean;
    emailDigest: boolean;
  };
}

async function processWithAutopilot(
  organizationId: string,
  userId: string,
  inboxItem: InboxItem,
  analysis: FlowAnalysisResult
): Promise<FlowProcessingResult> {
  
  // 1. Pobierz konfigurację Autopilota
  const config = await getAutopilotConfig(userId);
  
  if (!config.enabled) {
    return { mode: 'MANUAL', suggestion: analysis.suggestion };
  }
  
  // 2. Sprawdź czy spełnia próg pewności
  if (analysis.suggestion.confidence < config.confidenceThreshold) {
    return { mode: 'MANUAL', suggestion: analysis.suggestion };
  }
  
  // 3. Sprawdź wyjątki
  const exception = checkExceptions(config, inboxItem, analysis);
  if (exception) {
    return { 
      mode: 'MANUAL', 
      suggestion: analysis.suggestion,
      exceptionReason: exception 
    };
  }
  
  // 4. WYKONAJ AUTOMATYCZNIE
  const result = await executeAction(analysis.suggestion);
  
  // 5. Zaloguj i powiadom
  await logAutoExecution(userId, inboxItem, analysis, result);
  await notifyUser(userId, config.notifications, inboxItem, result);
  
  return { 
    mode: 'AUTOPILOT', 
    executed: true,
    result,
    undoToken: generateUndoToken(result)
  };
}
```

### 3. Sprawdzanie wyjątków

```typescript
function checkExceptions(
  config: AutopilotConfig,
  item: InboxItem,
  analysis: FlowAnalysisResult
): string | null {
  
  // Wyjątek: wysoka kwota
  if (config.exceptions.highValueAmount) {
    const amount = analysis.suggestion.extractedData?.amount;
    if (amount && parseAmount(amount) > config.exceptions.highValueAmount) {
      return `Kwota ${amount} przekracza limit ${config.exceptions.highValueAmount} PLN`;
    }
  }
  
  // Wyjątek: nowy nadawca
  if (config.exceptions.newSenders) {
    const sender = extractSender(item.content);
    const isKnown = await isKnownSender(sender);
    if (!isKnown) {
      return `Nowy nadawca: ${sender}`;
    }
  }
  
  // Wyjątek: akcja USUŃ
  if (config.exceptions.deleteAction) {
    if (analysis.suggestion.action === 'USUN') {
      return 'Akcja usunięcia wymaga potwierdzenia';
    }
  }
  
  // Wyjątek: weekend
  if (config.exceptions.weekends) {
    const now = new Date();
    if (now.getDay() === 0 || now.getDay() === 6) {
      return 'Autopilot wyłączony w weekendy';
    }
  }
  
  return null; // Brak wyjątków
}
```

### 4. Logowanie auto-akcji

```typescript
async function logAutoExecution(
  userId: string,
  item: InboxItem,
  analysis: FlowAnalysisResult,
  result: ExecutionResult
): Promise<void> {
  
  await prisma.flow_processing_history.create({
    data: {
      inboxItemId: item.id,
      userId,
      mode: 'AUTOPILOT',
      
      // Co AI zasugerowało
      suggestedAction: analysis.suggestion.action,
      suggestedStreamId: analysis.suggestion.streamId,
      confidence: analysis.suggestion.confidence,
      
      // Co wykonano
      executedAction: result.action,
      executedStreamId: result.streamId,
      
      // Metadane
      source: analysis.source, // 'AI' lub 'PATTERN'
      patternId: analysis.patternId,
      
      // Do cofnięcia
      undoData: JSON.stringify(result.undoData),
      
      executedAt: new Date()
    }
  });
}
```

### 5. Mechanizm cofania (Undo)

```typescript
interface UndoData {
  type: 'MOVE_TO_STREAM' | 'CREATE_TASK' | 'DELETE';
  originalState: {
    inboxItemId: string;
    streamId: string | null;
    status: string;
  };
  createdEntities: {
    taskId?: string;
    noteId?: string;
  };
}

async function undoAutoAction(
  historyId: string,
  userId: string
): Promise<void> {
  
  const history = await prisma.flow_processing_history.findUnique({
    where: { id: historyId }
  });
  
  if (!history || history.userId !== userId) {
    throw new Error('Nie znaleziono akcji do cofnięcia');
  }
  
  if (history.undoneAt) {
    throw new Error('Akcja już została cofnięta');
  }
  
  const undoData: UndoData = JSON.parse(history.undoData);
  
  // Przywróć oryginalny stan
  switch (undoData.type) {
    case 'MOVE_TO_STREAM':
      await prisma.inbox_items.update({
        where: { id: undoData.originalState.inboxItemId },
        data: {
          streamId: undoData.originalState.streamId,
          status: undoData.originalState.status
        }
      });
      break;
      
    case 'CREATE_TASK':
      // Usuń utworzone zadanie
      if (undoData.createdEntities.taskId) {
        await prisma.tasks.delete({
          where: { id: undoData.createdEntities.taskId }
        });
      }
      // Przywróć element do Źródła
      await prisma.inbox_items.update({
        where: { id: undoData.originalState.inboxItemId },
        data: { status: 'PENDING', streamId: null }
      });
      break;
  }
  
  // Oznacz jako cofnięte
  await prisma.flow_processing_history.update({
    where: { id: historyId },
    data: { undoneAt: new Date() }
  });
}
```

### 6. Powiadomienia

```typescript
// Powiadomienie w aplikacji (real-time)
async function notifyInApp(
  userId: string,
  item: InboxItem,
  result: ExecutionResult
): Promise<void> {
  
  await prisma.notifications.create({
    data: {
      userId,
      type: 'FLOW_AUTOPILOT',
      title: '🤖 Autopilot wykonał akcję',
      message: `"${truncate(item.title, 50)}" → ${result.streamName}`,
      data: {
        historyId: result.historyId,
        canUndo: true
      },
      read: false
    }
  });
  
  // WebSocket push (jeśli masz)
  await pushToUser(userId, 'autopilot_action', {
    historyId: result.historyId,
    itemTitle: item.title,
    action: result.action,
    streamName: result.streamName,
    canUndo: true
  });
}

// Email digest (cron job - raz dziennie)
async function sendAutopilotDigest(userId: string): Promise<void> {
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const actions = await prisma.flow_processing_history.findMany({
    where: {
      userId,
      mode: 'AUTOPILOT',
      executedAt: { gte: today },
      undoneAt: null
    },
    include: {
      inboxItem: true,
      stream: true
    }
  });
  
  if (actions.length === 0) return;
  
  await sendEmail({
    to: userId,
    template: 'autopilot-digest',
    data: {
      count: actions.length,
      actions: actions.map(a => ({
        title: a.inboxItem.title,
        action: a.executedAction,
        stream: a.stream.name,
        time: a.executedAt
      }))
    }
  });
}
```

### 7. UI - Lista auto-akcji

```
┌─────────────────────────────────────────────────────────┐
│  🤖 Autopilot - Ostatnie akcje                     [⚙️] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Dziś wykonano automatycznie: 7 akcji                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 📧 Email: Budma 2026 - potwierdzenie            │    │
│  │    → Klienci/ABC Okna (94%)                     │    │
│  │    ✅ Utworzono zadanie • 10:34        [Cofnij] │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 📄 Faktura: FV/2025/01/043                      │    │
│  │    → Finanse (92%)                              │    │
│  │    ✅ Przeniesiono • 10:12             [Cofnij] │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 📧 Email: Newsletter                            │    │
│  │    → Archiwum (91%)                             │    │
│  │    ↩️ Cofnięto o 09:45                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Pokaż więcej...]                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Wymagania techniczne

### Nowe pola w bazie

```prisma
// Dodać do user_preferences lub osobna tabela
model autopilot_settings {
  id                   String   @id @default(uuid())
  userId               String   @unique
  enabled              Boolean  @default(false)
  confidenceThreshold  Float    @default(0.90)
  
  // Wyjątki
  exceptionHighValue   Int?     @default(10000)
  exceptionNewSenders  Boolean  @default(true)
  exceptionDelete      Boolean  @default(true)
  exceptionWeekends    Boolean  @default(false)
  
  // Powiadomienia
  notifyInApp          Boolean  @default(true)
  notifyEmailDigest    Boolean  @default(false)
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

// Dodać pole do flow_processing_history
model flow_processing_history {
  // ... istniejące pola ...
  mode      String?   // 'MANUAL' | 'AUTOPILOT'
  undoData  String?   @db.Text
  undoneAt  DateTime?
}
```

### Nowe endpointy

```typescript
// GET /api/v1/flow/autopilot/settings
// Pobierz ustawienia Autopilota

// PUT /api/v1/flow/autopilot/settings
// Zapisz ustawienia Autopilota

// GET /api/v1/flow/autopilot/history
// Lista auto-wykonanych akcji (z paginacją)

// POST /api/v1/flow/autopilot/undo/:historyId
// Cofnij auto-akcję

// GET /api/v1/flow/autopilot/stats
// Statystyki: ile wykonano, ile cofnięto, trafność
```

### Komponenty React

```
src/components/flow/autopilot/
├── AutopilotSettings.tsx        // Modal ustawień
├── AutopilotHistoryList.tsx     // Lista ostatnich akcji
├── AutopilotHistoryItem.tsx     // Pojedyncza akcja z [Cofnij]
├── AutopilotNotification.tsx    // Toast/banner po auto-akcji
└── AutopilotStats.tsx           // Statystyki (opcjonalne)
```

### Cron Job (digest email)

```typescript
// Dodać do scheduled jobs
// Uruchamiaj codziennie o 18:00

async function dailyAutopilotDigestJob(): Promise<void> {
  const usersWithDigest = await prisma.autopilot_settings.findMany({
    where: { notifyEmailDigest: true }
  });
  
  for (const settings of usersWithDigest) {
    await sendAutopilotDigest(settings.userId);
  }
}
```

---

## Flow przetwarzania (zintegrowany)

```
ELEMENT WPŁYWA DO ŹRÓDŁA
         │
         ▼
┌─────────────────┐
│  FLOW ANALYZE   │
│  (Task 1 API)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SPRAWDŹ WZORCE  │
│  (Task 2)       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 Pattern    AI
 ≥85%      <85%
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ AUTOPILOT CHECK │
│  (Task 3)       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 conf≥90%  conf<90%
 no except  lub except
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│AUTO    │ │MANUAL  │
│EXECUTE │ │QUEUE   │
└────────┘ └────────┘
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│NOTIFY  │ │SHOW IN │
│+ LOG   │ │UI      │
└────────┘ └────────┘
```

---

## Testy akceptacyjne

1. [ ] Autopilot wyłączony → wszystko trafia do ręcznego zatwierdzenia
2. [ ] Autopilot 90% + element 92% → auto-wykonanie
3. [ ] Autopilot 90% + element 85% → ręczne zatwierdzenie
4. [ ] Wyjątek "wysoka kwota" → ręczne mimo 95%
5. [ ] Wyjątek "nowy nadawca" → ręczne mimo 93%
6. [ ] Auto-wykonanie → pojawia się w historii z [Cofnij]
7. [ ] Kliknięcie [Cofnij] → przywraca stan sprzed akcji
8. [ ] Email digest → zawiera wszystkie auto-akcje z dnia
9. [ ] Statystyki pokazują: wykonane, cofnięte, trafność

---

## Uwagi bezpieczeństwa

- Autopilot NIGDY nie wykonuje akcji USUŃ bez potwierdzenia
- Autopilot NIGDY nie wysyła maili (tylko drafty)
- Każda auto-akcja ma możliwość cofnięcia przez 24h
- Logi przechowuj minimum 30 dni
- User może w każdej chwili wyłączyć Autopilot
- Domyślnie Autopilot jest WYŁĄCZONY (opt-in)
