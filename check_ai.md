# ✅ CHECKLIST IMPLEMENTACJI AI — CRM Streams
## Dokument dla Claude Code | Grudzień 2025

---

## 📋 JAK UŻYWAĆ TEJ CHECKLISTY

1. Realizuj zadania **po kolei** — każda faza zależy od poprzedniej
2. Oznaczaj `[x]` po ukończeniu każdego zadania
3. Testuj po każdej fazie przed przejściem dalej
4. Jeśli coś nie działa — zatrzymaj się i napraw

---

## FAZA 0: PRZYGOTOWANIE (30 min)
> Cel: Upewnić się że fundamenty są gotowe

### Baza danych
- [ ] Sprawdź czy tabela `ai_suggestions` istnieje w schema.prisma
- [ ] Jeśli NIE → utwórz migrację:

```prisma
model AiSuggestion {
  id                String   @id @default(uuid())
  userId            String   @map("user_id")
  organizationId    String   @map("organization_id")
  
  context           String   // SOURCE, STREAM, TASK, DAY_PLAN, REVIEW, DEAL
  inputData         Json     @map("input_data")
  suggestion        Json
  confidence        Int?
  reasoning         String?
  
  status            String   @default("PENDING") // PENDING, ACCEPTED, REJECTED, MODIFIED
  userModifications Json?    @map("user_modifications")
  
  processingTimeMs  Int?     @map("processing_time_ms")
  modelUsed         String?  @map("model_used")
  promptVersion     String?  @map("prompt_version")
  
  createdAt         DateTime @default(now()) @map("created_at")
  resolvedAt        DateTime? @map("resolved_at")
  
  user              User     @relation(fields: [userId], references: [id])
  
  @@map("ai_suggestions")
}
```

- [ ] Sprawdź czy tabela `user_ai_patterns` istnieje
- [ ] Jeśli NIE → utwórz migrację:

```prisma
model UserAiPattern {
  id                 String   @id @default(uuid())
  userId             String   @unique @map("user_id")
  
  preferredStreams   Json     @default("[]") @map("preferred_streams")
  energyPatterns     Json     @default("{}") @map("energy_patterns")
  acceptanceRate     Decimal  @default(0) @db.Decimal(5, 2) @map("acceptance_rate")
  commonModifications Json    @default("[]") @map("common_modifications")
  totalSuggestions   Int      @default(0) @map("total_suggestions")
  totalAccepted      Int      @default(0) @map("total_accepted")
  
  updatedAt          DateTime @updatedAt @map("updated_at")
  
  user               User     @relation(fields: [userId], references: [id])
  
  @@map("user_ai_patterns")
}
```

- [ ] Uruchom `npx prisma migrate dev --name add_ai_tables`
- [ ] Uruchom `npx prisma generate`

### Zmienne środowiskowe
- [ ] Dodaj do `.env`:

```env
# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...

# Domyślny provider i model
DEFAULT_AI_PROVIDER=openai
DEFAULT_AI_MODEL=gpt-4o-mini
DEFAULT_AI_TEMPERATURE=0.3
```

### Zależności
- [ ] Zainstaluj pakiety:

```bash
npm install openai @anthropic-ai/sdk
```

---

## FAZA 1: SERWIS AI PROVIDER (2-3h)
> Cel: Jeden serwis obsługujący wszystkich providerów

### Plik: `src/services/ai/aiProvider.ts`

- [ ] Utwórz plik `src/services/ai/aiProvider.ts`
- [ ] Zaimplementuj interfejs:

```typescript
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];  // Dla function calling
}

export interface AIResponse {
  content: string;
  toolCalls?: any[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTimeMs: number;
}

export type AIProvider = 'openai' | 'anthropic' | 'deepseek';
```

- [ ] Zaimplementuj klasę `AIProviderService`:

```typescript
export class AIProviderService {
  private provider: AIProvider;
  
  constructor(provider?: AIProvider) {
    this.provider = provider || process.env.DEFAULT_AI_PROVIDER as AIProvider || 'openai';
  }
  
  async complete(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    switch (this.provider) {
      case 'openai':
        return this.completeOpenAI(request, startTime);
      case 'anthropic':
        return this.completeAnthropic(request, startTime);
      case 'deepseek':
        return this.completeDeepSeek(request, startTime);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }
  
  private async completeOpenAI(request: AIRequest, startTime: number): Promise<AIResponse> {
    // Implementacja OpenAI
  }
  
  private async completeAnthropic(request: AIRequest, startTime: number): Promise<AIResponse> {
    // Implementacja Anthropic
  }
  
  private async completeDeepSeek(request: AIRequest, startTime: number): Promise<AIResponse> {
    // DeepSeek używa API kompatybilnego z OpenAI
  }
}
```

- [ ] Zaimplementuj `completeOpenAI()`:

```typescript
private async completeOpenAI(request: AIRequest, startTime: number): Promise<AIResponse> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const response = await openai.chat.completions.create({
    model: request.model || 'gpt-4o-mini',
    temperature: request.temperature ?? 0.3,
    max_tokens: request.maxTokens || 1000,
    messages: request.messages,
    tools: request.tools,
  });
  
  return {
    content: response.choices[0].message.content || '',
    toolCalls: response.choices[0].message.tool_calls,
    model: response.model,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    processingTimeMs: Date.now() - startTime,
  };
}
```

- [ ] Zaimplementuj `completeAnthropic()`:

```typescript
private async completeAnthropic(request: AIRequest, startTime: number): Promise<AIResponse> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  // Anthropic ma inny format - system message osobno
  const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
  const otherMessages = request.messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  
  const response = await anthropic.messages.create({
    model: request.model || 'claude-3-haiku-20240307',
    max_tokens: request.maxTokens || 1000,
    system: systemMessage,
    messages: otherMessages,
  });
  
  const textContent = response.content.find(c => c.type === 'text');
  
  return {
    content: textContent?.text || '',
    model: response.model,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    processingTimeMs: Date.now() - startTime,
  };
}
```

- [ ] Zaimplementuj `completeDeepSeek()` (API kompatybilne z OpenAI):

```typescript
private async completeDeepSeek(request: AIRequest, startTime: number): Promise<AIResponse> {
  const openai = new OpenAI({ 
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1'
  });
  
  const response = await openai.chat.completions.create({
    model: request.model || 'deepseek-chat',
    temperature: request.temperature ?? 0.3,
    max_tokens: request.maxTokens || 1000,
    messages: request.messages,
  });
  
  return {
    content: response.choices[0].message.content || '',
    model: response.model,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    processingTimeMs: Date.now() - startTime,
  };
}
```

- [ ] Eksportuj instancję:

```typescript
export const aiProvider = new AIProviderService();
```

### Test
- [ ] Utwórz plik `src/services/ai/aiProvider.test.ts`
- [ ] Napisz prosty test:

```typescript
import { AIProviderService } from './aiProvider';

async function testProvider() {
  const ai = new AIProviderService('openai');
  
  const response = await ai.complete({
    messages: [
      { role: 'system', content: 'Odpowiadaj krótko.' },
      { role: 'user', content: 'Powiedz "test działa"' }
    ]
  });
  
  console.log('Response:', response.content);
  console.log('Time:', response.processingTimeMs, 'ms');
  console.log('Tokens:', response.usage.totalTokens);
}

testProvider();
```

- [ ] Uruchom test: `npx ts-node src/services/ai/aiProvider.test.ts`
- [ ] Sprawdź czy dostałeś odpowiedź

---

## FAZA 2: SERWIS PROMPTÓW (1-2h)
> Cel: Ładowanie i renderowanie promptów

### Plik: `src/services/ai/promptService.ts`

- [ ] Utwórz plik `src/services/ai/promptService.ts`
- [ ] Zdefiniuj prompty (na razie jako stałe, później z bazy):

```typescript
export const PROMPTS = {
  SOURCE_ANALYZE: {
    code: 'SOURCE_ANALYZE',
    systemPrompt: `Jesteś asystentem produktywności w systemie Streams...`, // Skopiuj z BIBLIOTEKA_PROMPTOW
    defaultModel: 'gpt-4o-mini',
    defaultTemperature: 0.3,
  },
  // Dodaj pozostałe prompty
};
```

- [ ] Zaimplementuj funkcję renderowania:

```typescript
export function renderPrompt(
  promptCode: string, 
  variables: Record<string, any>
): string {
  const prompt = PROMPTS[promptCode];
  if (!prompt) throw new Error(`Unknown prompt: ${promptCode}`);
  
  let rendered = prompt.systemPrompt;
  
  // Prosty rendering {{zmienna}}
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    rendered = rendered.replace(new RegExp(placeholder, 'g'), stringValue);
  }
  
  return rendered;
}
```

- [ ] Zaimplementuj obsługę warunków `{{#if}}`:

```typescript
export function renderPrompt(promptCode: string, variables: Record<string, any>): string {
  let rendered = PROMPTS[promptCode].systemPrompt;
  
  // Obsługa {{#if zmienna}}...{{/if}}
  rendered = rendered.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, varName, content) => {
      return variables[varName] ? content : '';
    }
  );
  
  // Obsługa {{#each zmienna}}...{{/each}}
  rendered = rendered.replace(
    /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, varName, template) => {
      const items = variables[varName];
      if (!Array.isArray(items)) return '';
      return items.map(item => {
        let itemRendered = template;
        for (const [key, value] of Object.entries(item)) {
          itemRendered = itemRendered.replace(
            new RegExp(`\\{\\{this\\.${key}\\}\\}`, 'g'), 
            String(value)
          );
        }
        return itemRendered;
      }).join('\n');
    }
  );
  
  // Podstawowe zmienne {{zmienna}}
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    rendered = rendered.replace(new RegExp(placeholder, 'g'), stringValue);
  }
  
  return rendered;
}
```

---

## FAZA 3: SERWIS ANALIZY ŹRÓDŁA (2-3h)
> Cel: Główna logika analizy elementów

### Plik: `src/services/ai/sourceAnalyzer.ts`

- [ ] Utwórz plik `src/services/ai/sourceAnalyzer.ts`
- [ ] Zdefiniuj interfejsy:

```typescript
export interface SourceItemAnalysis {
  suggestedAction: 'ZROB_TERAZ' | 'ZAPLANUJ' | 'DELEGUJ' | 'PROJEKT' | 'REFERENCJA' | 'KIEDYS_MOZE' | 'USUN';
  suggestedStream: string | null;
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  suggestedTags: string[];
  suggestedDueDate: string | null;
  extractedTasks: string[];
  confidence: number;
  reasoning: string;
}

export interface AnalyzeSourceItemInput {
  itemId: string;
  itemContent: string;
  itemMetadata?: Record<string, any>;
  userId: string;
  organizationId: string;
}
```

- [ ] Zaimplementuj główną funkcję:

```typescript
import { prisma } from '../../lib/prisma';
import { AIProviderService } from './aiProvider';
import { renderPrompt, PROMPTS } from './promptService';

export async function analyzeSourceItem(
  input: AnalyzeSourceItemInput
): Promise<SourceItemAnalysis> {
  
  // 1. Pobierz kontekst użytkownika
  const activeStreams = await prisma.stream.findMany({
    where: { 
      organizationId: input.organizationId, 
      status: 'ACTIVE' 
    },
    select: { id: true, name: true, pattern: true }
  });
  
  const userPreferences = await prisma.userAiPattern.findUnique({
    where: { userId: input.userId }
  });
  
  // 2. Pobierz few-shot examples (ostatnie modyfikacje użytkownika)
  const recentModified = await prisma.aiSuggestion.findMany({
    where: {
      userId: input.userId,
      context: 'SOURCE',
      status: 'MODIFIED'
    },
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  
  const fewShotExamples = recentModified.map(s => ({
    input: (s.inputData as any).itemContent?.substring(0, 100),
    aiSuggestion: (s.suggestion as any).suggestedAction,
    userCorrection: (s.userModifications as any)?.suggestedAction,
    reason: (s.userModifications as any)?.reason || 'brak'
  }));
  
  // 3. Renderuj prompt
  const systemPrompt = renderPrompt('SOURCE_ANALYZE', {
    activeStreams: JSON.stringify(activeStreams),
    userPreferences: JSON.stringify(userPreferences?.preferredStreams || []),
    fewShotExamples: fewShotExamples.length > 0 ? fewShotExamples : null,
    isVoiceTranscription: input.itemMetadata?.isVoice || false,
    lastError: null // Na razie bez obsługi błędów
  });
  
  // 4. Wywołaj AI
  const ai = new AIProviderService();
  const response = await ai.complete({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Przeanalizuj:\n\n${input.itemContent}` }
    ],
    temperature: PROMPTS.SOURCE_ANALYZE.defaultTemperature
  });
  
  // 5. Parsuj odpowiedź
  let analysis: SourceItemAnalysis;
  try {
    // Wyczyść odpowiedź z markdown
    const cleanContent = response.content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    analysis = JSON.parse(cleanContent);
  } catch (e) {
    console.error('Failed to parse AI response:', response.content);
    // Fallback
    analysis = {
      suggestedAction: 'ZAPLANUJ',
      suggestedStream: null,
      suggestedPriority: 'MEDIUM',
      suggestedTags: [],
      suggestedDueDate: null,
      extractedTasks: [],
      confidence: 30,
      reasoning: 'Nie udało się przeanalizować automatycznie'
    };
  }
  
  // 6. Zapisz sugestię do bazy
  await prisma.aiSuggestion.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      context: 'SOURCE',
      inputData: {
        itemId: input.itemId,
        itemContent: input.itemContent,
        itemMetadata: input.itemMetadata
      },
      suggestion: analysis,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      processingTimeMs: response.processingTimeMs,
      modelUsed: response.model,
      promptVersion: '1.0'
    }
  });
  
  return analysis;
}
```

---

## FAZA 4: API ENDPOINTS (2h)
> Cel: REST API dla frontendu

### Plik: `src/routes/ai.ts`

- [ ] Utwórz plik `src/routes/ai.ts`
- [ ] Zaimplementuj endpoint analizy:

```typescript
import { Router } from 'express';
import { analyzeSourceItem } from '../services/ai/sourceAnalyzer';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/v1/ai/analyze-source-item
router.post('/analyze-source-item', authMiddleware, async (req, res) => {
  try {
    const { itemId, itemContent, itemMetadata } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    
    if (!itemContent) {
      return res.status(400).json({ error: 'itemContent is required' });
    }
    
    const analysis = await analyzeSourceItem({
      itemId,
      itemContent,
      itemMetadata,
      userId,
      organizationId
    });
    
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});
```

- [ ] Dodaj endpoint feedbacku:

```typescript
// POST /api/v1/ai/feedback
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { suggestionId, accepted, modifications } = req.body;
    const userId = req.user.id;
    
    // Znajdź sugestię
    const suggestion = await prisma.aiSuggestion.findUnique({
      where: { id: suggestionId }
    });
    
    if (!suggestion || suggestion.userId !== userId) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    
    // Zaktualizuj status
    const status = accepted 
      ? (modifications ? 'MODIFIED' : 'ACCEPTED') 
      : 'REJECTED';
    
    await prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data: {
        status,
        userModifications: modifications,
        resolvedAt: new Date()
      }
    });
    
    // Zaktualizuj wzorce użytkownika
    await updateUserPatterns(userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Feedback failed' });
  }
});

async function updateUserPatterns(userId: string) {
  const stats = await prisma.aiSuggestion.groupBy({
    by: ['status'],
    where: { userId },
    _count: true
  });
  
  const total = stats.reduce((sum, s) => sum + s._count, 0);
  const accepted = stats.find(s => s.status === 'ACCEPTED')?._count || 0;
  const modified = stats.find(s => s.status === 'MODIFIED')?._count || 0;
  
  const acceptanceRate = total > 0 ? ((accepted + modified) / total) * 100 : 0;
  
  await prisma.userAiPattern.upsert({
    where: { userId },
    create: {
      userId,
      totalSuggestions: total,
      totalAccepted: accepted + modified,
      acceptanceRate
    },
    update: {
      totalSuggestions: total,
      totalAccepted: accepted + modified,
      acceptanceRate
    }
  });
}
```

- [ ] Dodaj endpoint pobierania oczekujących sugestii:

```typescript
// GET /api/v1/ai/suggestions/pending
router.get('/suggestions/pending', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const suggestions = await prisma.aiSuggestion.findMany({
      where: {
        userId,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});
```

- [ ] Zarejestruj router w głównej aplikacji:

```typescript
// W src/app.ts lub src/routes/index.ts
import aiRoutes from './routes/ai';
app.use('/api/v1/ai', aiRoutes);
```

---

## FAZA 5: INTEGRACJA Z UI (2-3h)
> Cel: Podpięcie frontendu do backendu

### Frontend API lib

- [ ] Utwórz/zaktualizuj `src/lib/api/ai.ts`:

```typescript
import { apiClient } from './client';

export interface SourceItemAnalysis {
  suggestedAction: string;
  suggestedStream: string | null;
  suggestedPriority: string;
  suggestedTags: string[];
  suggestedDueDate: string | null;
  extractedTasks: string[];
  confidence: number;
  reasoning: string;
}

export async function analyzeSourceItem(
  itemId: string,
  itemContent: string,
  itemMetadata?: Record<string, any>
): Promise<SourceItemAnalysis> {
  const response = await apiClient.post('/ai/analyze-source-item', {
    itemId,
    itemContent,
    itemMetadata
  });
  return response.data.data;
}

export async function submitFeedback(
  suggestionId: string,
  accepted: boolean,
  modifications?: Record<string, any>
): Promise<void> {
  await apiClient.post('/ai/feedback', {
    suggestionId,
    accepted,
    modifications
  });
}

export async function getPendingSuggestions() {
  const response = await apiClient.get('/ai/suggestions/pending');
  return response.data.data;
}
```

### Komponent Źródła

- [ ] Znajdź komponent obsługujący Źródło (prawdopodobnie `InboxItem` lub podobny)
- [ ] Dodaj wywołanie analizy przy nowym elemencie:

```typescript
// W komponencie elementu Źródła
import { analyzeSourceItem } from '@/lib/api/ai';
import { useState } from 'react';

function SourceItemCard({ item }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeSourceItem(item.id, item.content);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
    setLoading(false);
  };
  
  // Automatyczna analiza przy renderowaniu
  useEffect(() => {
    if (!item.analyzed) {
      handleAnalyze();
    }
  }, [item.id]);
  
  return (
    <div>
      {/* Istniejący UI */}
      
      {analysis && (
        <AISuggestionCard 
          analysis={analysis}
          onAccept={() => handleAccept(analysis)}
          onModify={() => handleModify(analysis)}
          onReject={() => handleReject()}
        />
      )}
    </div>
  );
}
```

### Komponent karty sugestii

- [ ] Sprawdź czy komponent karty sugestii (widoczny na screenshocie) jest podpięty
- [ ] Jeśli nie, podepnij handlery:

```typescript
function AISuggestionCard({ suggestion, onAccept, onModify, onReject }) {
  const handleAccept = async () => {
    await submitFeedback(suggestion.id, true);
    onAccept();
  };
  
  const handleModify = async (modifications) => {
    await submitFeedback(suggestion.id, true, modifications);
    onModify(modifications);
  };
  
  const handleReject = async () => {
    await submitFeedback(suggestion.id, false);
    onReject();
  };
  
  return (
    <div className="ai-suggestion-card">
      {/* Istniejący UI karty */}
      <div className="actions">
        <button onClick={handleAccept}>Akceptuj</button>
        <button onClick={() => setShowModifyModal(true)}>Modyfikuj</button>
        <button onClick={handleReject}>Odrzuć</button>
      </div>
    </div>
  );
}
```

---

## FAZA 6: TESTY END-TO-END (1-2h)
> Cel: Sprawdzenie czy wszystko działa razem

### Testy manualne

- [ ] **Test 1: Analiza tekstowa**
  1. Dodaj nowy element do Źródła: "Przygotować ofertę dla klienta ABC do piątku"
  2. Sprawdź czy pojawia się karta sugestii
  3. Sprawdź czy sugestia ma sens (ZAPLANUJ, priorytet, data)
  
- [ ] **Test 2: Akceptacja**
  1. Kliknij "Akceptuj" na sugestii
  2. Sprawdź czy element został przeniesiony do odpowiedniego strumienia
  3. Sprawdź w bazie czy `ai_suggestions.status = 'ACCEPTED'`

- [ ] **Test 3: Modyfikacja**
  1. Dodaj nowy element do Źródła
  2. Kliknij "Modyfikuj"
  3. Zmień priorytet
  4. Sprawdź w bazie czy `ai_suggestions.status = 'MODIFIED'`

- [ ] **Test 4: Statystyki**
  1. Wykonaj kilka akceptacji/odrzuceń
  2. Sprawdź czy statystyki w UI się aktualizują
  3. Sprawdź `user_ai_patterns` w bazie

### Testy automatyczne (opcjonalnie)

- [ ] Napisz test integracyjny dla `/api/v1/ai/analyze-source-item`
- [ ] Napisz test jednostkowy dla `analyzeSourceItem()`

---

## FAZA 7: POZOSTAŁE KONTEKSTY (opcjonalnie, po MVP)
> Cel: Rozszerzenie na inne obszary

### Day Planner
- [ ] Zaimplementuj `src/services/ai/dayPlanOptimizer.ts`
- [ ] Dodaj endpoint `POST /api/v1/ai/optimize-day`
- [ ] Podepnij do UI Day Plannera

### Przegląd tygodniowy
- [ ] Zaimplementuj `src/services/ai/weeklyReviewGenerator.ts`
- [ ] Dodaj endpoint `POST /api/v1/ai/weekly-review`
- [ ] Podepnij do UI przeglądu

### Strumienie
- [ ] Zaimplementuj `src/services/ai/streamAnalyzer.ts`
- [ ] Dodaj endpoint `POST /api/v1/ai/analyze-stream`
- [ ] Zaimplementuj sugestie zamrażania nieaktywnych strumieni

---

## 📊 PODSUMOWANIE FAZ

| Faza | Czas | Priorytet | Zależności |
|------|------|-----------|------------|
| 0. Przygotowanie | 30 min | 🔴 Krytyczne | - |
| 1. AI Provider | 2-3h | 🔴 Krytyczne | Faza 0 |
| 2. Prompt Service | 1-2h | 🔴 Krytyczne | Faza 1 |
| 3. Source Analyzer | 2-3h | 🔴 Krytyczne | Faza 2 |
| 4. API Endpoints | 2h | 🔴 Krytyczne | Faza 3 |
| 5. UI Integration | 2-3h | 🔴 Krytyczne | Faza 4 |
| 6. Testy | 1-2h | 🟡 Ważne | Faza 5 |
| 7. Pozostałe | 4-6h | 🟢 Opcjonalne | Faza 6 |

**Szacowany czas MVP (Fazy 0-6): 10-15 godzin roboczych**

---

## ❓ PYTANIA DO WALDEMARA

Przed rozpoczęciem implementacji, potrzebuję odpowiedzi:

1. Jaki klucz API mam użyć jako domyślny? (OpenAI / Anthropic / DeepSeek)
2. Czy tabele `ai_suggestions` i `user_ai_patterns` już istnieją w bazie?
3. Czy middleware `authMiddleware` jest już zaimplementowany?
4. Jaka jest struktura obecnego modelu `InboxItem` / elementu Źródła?

---

**Powodzenia! 🚀**

*Po każdej fazie odpal testy i upewnij się, że działa przed przejściem dalej.*
