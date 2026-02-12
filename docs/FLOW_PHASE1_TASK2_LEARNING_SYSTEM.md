# FLOW ENGINE - TASK 2: System Uczenia się z Korekt

## Cel
Zaimplementować mechanizm uczenia się AI z decyzji i korekt użytkownika, aby z czasem system był coraz trafniejszy.

---

## Kontekst

Tabela `flow_learned_patterns` już istnieje (1 rekord: "faktura" → ZAPLANUJ, 85% confidence).
System powinien:
- Wzmacniać wzorce gdy user zatwierdza
- Tworzyć nowe wzorce gdy user koryguje
- Osłabiać wzorce gdy user odrzuca
- Używać wzorców przy następnych analizach

---

## Architektura uczenia

```
┌─────────────────────────────────────────────────────────┐
│                    FLOW DECISION                         │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     [ZATWIERDŹ]     [KORYGUJ]       [ODRZUĆ]
          │               │               │
          ▼               ▼               ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Wzmocnij     │ │ Utwórz nowy  │ │ Osłab        │
   │ istniejący   │ │ wzorzec z    │ │ istniejący   │
   │ wzorzec      │ │ korekty      │ │ wzorzec      │
   │ +0.05 conf   │ │ 0.6 conf     │ │ -0.1 conf    │
   └──────────────┘ └──────────────┘ └──────────────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
              ┌─────────────────────┐
              │ flow_learned_patterns│
              │ (aktualizacja)       │
              └─────────────────────┘
```

---

## Wymagania funkcjonalne

### 1. Wzmacnianie wzorców (Zatwierdź)

Gdy user zatwierdza sugestię AI:

```typescript
async function reinforcePattern(
  organizationId: string,
  userId: string,
  inboxItem: InboxItem,
  suggestion: FlowSuggestion
): Promise<void> {
  
  // 1. Znajdź pasujący wzorzec
  const pattern = await findMatchingPattern(inboxItem, suggestion);
  
  if (pattern) {
    // 2. Wzmocnij istniejący
    await prisma.flow_learned_patterns.update({
      where: { id: pattern.id },
      data: {
        occurrences: { increment: 1 },
        confidence: Math.min(pattern.confidence + 0.05, 0.99),
        lastUsedAt: new Date()
      }
    });
  } else {
    // 3. Utwórz nowy wzorzec
    await createPatternFromDecision(organizationId, userId, inboxItem, suggestion);
  }
}
```

### 2. Tworzenie wzorców z korekt (Koryguj)

Gdy user koryguje sugestię AI:

```typescript
async function learnFromCorrection(
  organizationId: string,
  userId: string,
  inboxItem: InboxItem,
  originalSuggestion: FlowSuggestion,
  correction: FlowCorrection
): Promise<void> {
  
  // 1. Osłab stary wzorzec (jeśli istniał)
  const oldPattern = await findMatchingPattern(inboxItem, originalSuggestion);
  if (oldPattern) {
    await prisma.flow_learned_patterns.update({
      where: { id: oldPattern.id },
      data: {
        confidence: Math.max(oldPattern.confidence - 0.1, 0.1)
      }
    });
  }
  
  // 2. Utwórz nowy wzorzec z korekty
  await prisma.flow_learned_patterns.create({
    data: {
      organizationId,
      userId,
      elementType: inboxItem.elementType,
      
      // Wzorce wejściowe
      senderPattern: extractSenderPattern(inboxItem),
      subjectPattern: extractSubjectPattern(inboxItem),
      contentPattern: extractContentKeywords(inboxItem),
      
      // Nauczona decyzja (z korekty!)
      learnedAction: correction.action,
      learnedStreamId: correction.streamId,
      
      // Początkowa pewność
      occurrences: 1,
      confidence: 0.6,  // Startujemy od 60%
      isActive: true
    }
  });
  
  // 3. Zapisz szczegóły korekty
  await logCorrection(inboxItem.id, originalSuggestion, correction);
}
```

### 3. Osłabianie wzorców (Odrzuć)

Gdy user odrzuca sugestię:

```typescript
async function weakenPattern(
  inboxItem: InboxItem,
  suggestion: FlowSuggestion,
  reason?: string
): Promise<void> {
  
  const pattern = await findMatchingPattern(inboxItem, suggestion);
  
  if (pattern) {
    const newConfidence = pattern.confidence - 0.1;
    
    if (newConfidence < 0.2) {
      // Dezaktywuj wzorzec jeśli zbyt słaby
      await prisma.flow_learned_patterns.update({
        where: { id: pattern.id },
        data: { isActive: false }
      });
    } else {
      await prisma.flow_learned_patterns.update({
        where: { id: pattern.id },
        data: { confidence: newConfidence }
      });
    }
  }
  
  // Zapisz feedback
  if (reason) {
    await logRejectionFeedback(inboxItem.id, suggestion, reason);
  }
}
```

### 4. Ekstrakcja wzorców

Algorytmy wyciągania wzorców z elementów:

```typescript
// Wzorzec nadawcy (dla EMAIL)
function extractSenderPattern(item: InboxItem): string | null {
  if (item.elementType !== 'EMAIL') return null;
  
  const email = extractEmailFromContent(item.content);
  if (!email) return null;
  
  // Zwróć domenę jako wzorzec
  // jan.kowalski@abcokna.pl → @abcokna.pl
  return '@' + email.split('@')[1];
}

// Wzorzec tematu
function extractSubjectPattern(item: InboxItem): string | null {
  const subject = extractSubject(item.content);
  if (!subject) return null;
  
  // Wyciągnij kluczowe słowa (bez stopwords)
  // "RE: Budma 2026 - akceptacja projektu" → "budma 2026 akceptacja projekt"
  return extractKeywords(subject).join(' ');
}

// Wzorzec treści (keywords)
function extractContentKeywords(item: InboxItem): string | null {
  // Top 5 najważniejszych słów z treści
  const keywords = extractTopKeywords(item.content, 5);
  return keywords.join(' ');
}
```

### 5. Używanie wzorców przy analizie

Przy każdej nowej analizie, sprawdź wzorce PRZED AI:

```typescript
async function analyzeWithPatterns(
  organizationId: string,
  userId: string,
  inboxItem: InboxItem
): Promise<FlowAnalysisResult> {
  
  // 1. Sprawdź wyuczone wzorce
  const matchedPatterns = await findMatchingPatterns(
    organizationId, 
    userId, 
    inboxItem
  );
  
  if (matchedPatterns.length > 0) {
    const bestPattern = matchedPatterns[0]; // Najwyższa confidence
    
    if (bestPattern.confidence >= 0.85) {
      // Wysoka pewność → użyj wzorca, pomiń AI
      return {
        source: 'PATTERN',
        patternId: bestPattern.id,
        suggestion: {
          action: bestPattern.learnedAction,
          streamId: bestPattern.learnedStreamId,
          confidence: bestPattern.confidence
        }
      };
    } else {
      // Średnia pewność → AI + hint z wzorca
      return await analyzeWithAI(inboxItem, {
        patternHint: bestPattern
      });
    }
  }
  
  // 2. Brak wzorców → pełna analiza AI
  return await analyzeWithAI(inboxItem);
}
```

### 6. Algorytm dopasowania wzorców

```typescript
async function findMatchingPatterns(
  organizationId: string,
  userId: string,
  inboxItem: InboxItem
): Promise<FlowLearnedPattern[]> {
  
  // Pobierz aktywne wzorce dla tego typu elementu
  const patterns = await prisma.flow_learned_patterns.findMany({
    where: {
      organizationId,
      userId,
      elementType: inboxItem.elementType,
      isActive: true
    },
    orderBy: { confidence: 'desc' }
  });
  
  // Scoruj każdy wzorzec
  const scored = patterns.map(pattern => ({
    pattern,
    score: calculateMatchScore(pattern, inboxItem)
  }));
  
  // Zwróć pasujące (score > 0.5)
  return scored
    .filter(s => s.score > 0.5)
    .sort((a, b) => b.score * b.pattern.confidence - a.score * a.pattern.confidence)
    .map(s => s.pattern);
}

function calculateMatchScore(pattern: FlowLearnedPattern, item: InboxItem): number {
  let score = 0;
  let weights = 0;
  
  // Dopasowanie nadawcy (waga: 0.4)
  if (pattern.senderPattern) {
    weights += 0.4;
    if (item.content.toLowerCase().includes(pattern.senderPattern.toLowerCase())) {
      score += 0.4;
    }
  }
  
  // Dopasowanie tematu (waga: 0.3)
  if (pattern.subjectPattern) {
    weights += 0.3;
    const patternWords = pattern.subjectPattern.split(' ');
    const matchedWords = patternWords.filter(w => 
      item.content.toLowerCase().includes(w.toLowerCase())
    );
    score += 0.3 * (matchedWords.length / patternWords.length);
  }
  
  // Dopasowanie treści (waga: 0.3)
  if (pattern.contentPattern) {
    weights += 0.3;
    const patternWords = pattern.contentPattern.split(' ');
    const matchedWords = patternWords.filter(w => 
      item.content.toLowerCase().includes(w.toLowerCase())
    );
    score += 0.3 * (matchedWords.length / patternWords.length);
  }
  
  return weights > 0 ? score / weights : 0;
}
```

---

## Wymagania techniczne

### Nowe funkcje w flow.service.ts

```typescript
// Dodać do FlowService:

class FlowService {
  // ... istniejące metody ...
  
  async reinforcePattern(conversationId: string): Promise<void>;
  async learnFromCorrection(conversationId: string, correction: FlowCorrection): Promise<void>;
  async weakenPattern(conversationId: string, reason?: string): Promise<void>;
  
  private async findMatchingPatterns(item: InboxItem): Promise<FlowLearnedPattern[]>;
  private async createPatternFromDecision(item: InboxItem, decision: FlowDecision): Promise<void>;
  private calculateMatchScore(pattern: FlowLearnedPattern, item: InboxItem): number;
}
```

### Nowe endpointy

```typescript
// POST /api/v1/flow/learn
// Body: { conversationId, action: 'approve' | 'correct' | 'reject', correction?: {...}, reason?: string }

// GET /api/v1/flow/patterns
// Lista wyuczonych wzorców dla organizacji

// DELETE /api/v1/flow/patterns/:id
// Usuń wzorzec (admin)

// POST /api/v1/flow/patterns/:id/reset
// Reset confidence do 0.5
```

### Migracja bazy (jeśli potrzebna)

Sprawdź czy `flow_learned_patterns` ma wszystkie pola:
- `senderPattern` (String?)
- `subjectPattern` (String?)
- `contentPattern` (String? @db.Text)
- `occurrences` (Int @default(1))
- `confidence` (Float @default(0.5))

---

## Metryki uczenia

### Dashboard wzorców (opcjonalnie)

```
┌─────────────────────────────────────────────────────────┐
│  📊 Wyuczone wzorce                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Aktywne wzorce: 12                                     │
│  Średnia pewność: 78%                                   │
│  Trafność (ostatni tydzień): 84%                        │
│                                                         │
│  Top wzorce:                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ @abcokna.pl → Klienci/ABC Okna     94% (23x)   │    │
│  │ "faktura" → ZAPLANUJ/Finanse        89% (15x)   │    │
│  │ @drukarnia.pl → Operacje            82% (8x)    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Testy akceptacyjne

1. [ ] Zatwierdzenie → confidence wzorca +0.05
2. [ ] Korekta → nowy wzorzec z 60% confidence
3. [ ] Korekta → stary wzorzec osłabiony (-0.1)
4. [ ] Odrzucenie → wzorzec osłabiony (-0.1)
5. [ ] Wzorzec <20% → automatyczna dezaktywacja
6. [ ] Nowy element pasujący do wzorca 85%+ → użyty bez AI
7. [ ] Nowy element pasujący do wzorca 60-85% → AI + hint
8. [ ] Po 10 zatwierdzeniach → confidence ~95%

---

## Uwagi

- Wzorce są per user + per organization
- Confidence nigdy nie przekracza 0.99
- Confidence nigdy nie spada poniżej 0.1 (potem dezaktywacja)
- Wzorce można ręcznie usunąć z UI ustawień
- Logi korekt przechowuj w `flow_processing_history`
