# Plan: Licznik Tokenów AI dla Organizacji

## Cel
System śledzenia użycia tokenów AI per organizacja z limitami w ramach abonamentu.

---

## Faza 1: Schema bazy danych

### 1.1 Nowe tabele w Prisma

```prisma
// Logi użycia AI - każde wywołanie
model ai_usage_logs {
  id                String   @id @default(uuid())
  organizationId    String   @map("organization_id")
  userId            String   @map("user_id")

  // Provider i model
  providerId        String?  @map("provider_id")
  providerName      String   @map("provider_name")  // "openai", "anthropic", "google"
  modelId           String   @map("model_id")       // "gpt-4", "claude-3"
  modelName         String?  @map("model_name")

  // Typ operacji
  endpoint          String   // "chat", "embeddings", "transcription", "image"

  // Tokeny
  promptTokens      Int      @default(0) @map("prompt_tokens")
  completionTokens  Int      @default(0) @map("completion_tokens")
  totalTokens       Int      @default(0) @map("total_tokens")

  // Koszt (w groszach PLN)
  costGrosze        Int      @default(0) @map("cost_grosze")

  // Metadata
  requestId         String?  @map("request_id")
  latencyMs         Int?     @map("latency_ms")
  success           Boolean  @default(true)
  errorCode         String?  @map("error_code")

  // Kontekst (opcjonalnie)
  feature           String?  // "ai-chat", "email-analysis", "voice-transcription"
  metadata          Json?    // dodatkowe dane

  createdAt         DateTime @default(now()) @map("created_at")

  organization      organizations @relation(fields: [organizationId], references: [id])
  user              users         @relation(fields: [userId], references: [id])

  @@index([organizationId, createdAt])
  @@index([userId, createdAt])
  @@index([providerId])
  @@index([modelId])
  @@map("ai_usage_logs")
}

// Limity AI per organizacja
model ai_usage_limits {
  id                   String   @id @default(uuid())
  organizationId       String   @unique @map("organization_id")

  // Plan
  planType             String   @default("free") @map("plan_type") // "free", "starter", "business", "enterprise"

  // Limity miesięczne
  monthlyTokenLimit    Int      @default(10000) @map("monthly_token_limit")
  monthlyRequestLimit  Int      @default(100) @map("monthly_request_limit")
  dailyTokenLimit      Int?     @map("daily_token_limit")

  // Limity per request
  maxTokensPerRequest  Int      @default(4000) @map("max_tokens_per_request")

  // Aktualne użycie (cache - resetowane co okres)
  currentPeriodTokens   Int      @default(0) @map("current_period_tokens")
  currentPeriodRequests Int      @default(0) @map("current_period_requests")
  currentPeriodCost     Int      @default(0) @map("current_period_cost") // grosze
  periodStartDate       DateTime @default(now()) @map("period_start_date")

  // Overage (przekroczenie limitu)
  allowOverage          Boolean  @default(false) @map("allow_overage")
  overageCostPer1kTokens Int     @default(2) @map("overage_cost_per_1k") // grosze za 1k tokenów
  maxOverageAmount      Int?     @map("max_overage_amount") // max kwota overage w groszach

  // Alerty
  alertAt80Percent     Boolean  @default(true) @map("alert_at_80_percent")
  alertAt90Percent     Boolean  @default(true) @map("alert_at_90_percent")
  alertAt100Percent    Boolean  @default(true) @map("alert_at_100_percent")
  lastAlertSent        DateTime? @map("last_alert_sent")

  // Timestamps
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  organization         organizations @relation(fields: [organizationId], references: [id])

  @@map("ai_usage_limits")
}

// Dzienne agregaty (dla szybkich raportów)
model ai_usage_daily {
  id                String   @id @default(uuid())
  organizationId    String   @map("organization_id")
  date              DateTime @db.Date

  // Agregaty
  totalTokens       Int      @default(0) @map("total_tokens")
  promptTokens      Int      @default(0) @map("prompt_tokens")
  completionTokens  Int      @default(0) @map("completion_tokens")
  totalRequests     Int      @default(0) @map("total_requests")
  totalCostGrosze   Int      @default(0) @map("total_cost_grosze")

  // Per model (JSON)
  byModel           Json?    @map("by_model") // { "gpt-4": { tokens: 1000, requests: 10 }, ... }
  byEndpoint        Json?    @map("by_endpoint") // { "chat": 500, "embeddings": 300 }
  byUser            Json?    @map("by_user") // { "user-id": { tokens: 200 } }

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@unique([organizationId, date])
  @@index([organizationId, date])
  @@map("ai_usage_daily")
}
```

### 1.2 Rozszerzenie tabeli organizations

```prisma
model organizations {
  // ... existing fields

  // AI Usage (quick access)
  aiPlanType           String?  @map("ai_plan_type")
  aiUsageEnabled       Boolean  @default(true) @map("ai_usage_enabled")

  // Relations
  aiUsageLogs          ai_usage_logs[]
  aiUsageLimits        ai_usage_limits?
  aiUsageDaily         ai_usage_daily[]
}
```

### 1.3 Migracja

```bash
npx prisma migrate dev --name add_ai_usage_tracking
```

---

## Faza 2: Backend - TokenCounterService

### 2.1 Lokalizacja
`/packages/backend/src/modules/ai-usage/`

### 2.2 Struktura plików

```
src/modules/ai-usage/
├── ai-usage.service.ts      # Główny serwis
├── ai-usage.routes.ts       # API endpoints
├── ai-usage.middleware.ts   # Middleware sprawdzający limity
├── ai-usage.types.ts        # TypeScript interfaces
├── token-counter.ts         # Liczenie tokenów (tiktoken)
├── cost-calculator.ts       # Kalkulacja kosztów
├── usage-aggregator.ts      # Agregacja dziennych statystyk
└── alerts.service.ts        # Wysyłanie alertów
```

### 2.3 AIUsageService

```typescript
// ai-usage.service.ts
export class AIUsageService {

  // Sprawdź limity przed wywołaniem
  async checkLimits(orgId: string, estimatedTokens: number): Promise<LimitCheckResult> {
    const limits = await this.getOrCreateLimits(orgId);

    // Sprawdź czy okres się skończył (reset miesięczny)
    await this.checkAndResetPeriod(limits);

    const remaining = limits.monthlyTokenLimit - limits.currentPeriodTokens;

    if (estimatedTokens > remaining) {
      if (!limits.allowOverage) {
        return {
          allowed: false,
          reason: 'LIMIT_EXCEEDED',
          remaining,
          limit: limits.monthlyTokenLimit,
          used: limits.currentPeriodTokens
        };
      }
    }

    return {
      allowed: true,
      remaining,
      limit: limits.monthlyTokenLimit,
      used: limits.currentPeriodTokens,
      isOverage: estimatedTokens > remaining
    };
  }

  // Zapisz użycie po wywołaniu
  async logUsage(data: LogUsageData): Promise<AIUsageLog> {
    const log = await prisma.ai_usage_logs.create({
      data: {
        organizationId: data.orgId,
        userId: data.userId,
        providerId: data.providerId,
        providerName: data.providerName,
        modelId: data.modelId,
        endpoint: data.endpoint,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        costGrosze: this.calculateCost(data),
        latencyMs: data.latencyMs,
        success: data.success,
        feature: data.feature,
      }
    });

    // Update limits cache
    await this.incrementUsage(data.orgId, data.totalTokens, log.costGrosze);

    // Update daily aggregate
    await this.updateDailyAggregate(data);

    // Check alerts
    await this.checkAlerts(data.orgId);

    return log;
  }

  // Pobierz statystyki
  async getUsageStats(orgId: string, period: 'day' | 'week' | 'month' | 'year'): Promise<UsageStats>;

  // Pobierz limity
  async getLimits(orgId: string): Promise<AIUsageLimits>;

  // Ustaw limity (admin)
  async setLimits(orgId: string, limits: Partial<AIUsageLimits>): Promise<AIUsageLimits>;

  // Reset użycia (nowy okres)
  async resetPeriod(orgId: string): Promise<void>;
}
```

### 2.4 Token Counter (tiktoken)

```typescript
// token-counter.ts
import { encoding_for_model } from 'tiktoken';

export function countTokens(text: string, model: string): number {
  try {
    const enc = encoding_for_model(model as any);
    const tokens = enc.encode(text);
    enc.free();
    return tokens.length;
  } catch {
    // Fallback: ~4 chars per token
    return Math.ceil(text.length / 4);
  }
}

export function estimateTokens(messages: ChatMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    total += countTokens(msg.content, 'gpt-4');
    total += 4; // overhead per message
  }
  return total + 3; // reply priming
}
```

### 2.5 Cost Calculator

```typescript
// cost-calculator.ts

// Ceny w groszach za 1000 tokenów
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4': { input: 12, output: 24 },           // $0.03/$0.06 per 1k
  'gpt-4-turbo': { input: 4, output: 12 },      // $0.01/$0.03
  'gpt-4o': { input: 2, output: 8 },            // $0.005/$0.02
  'gpt-4o-mini': { input: 0.6, output: 2.4 },   // $0.00015/$0.0006
  'gpt-3.5-turbo': { input: 0.2, output: 0.6 }, // $0.0005/$0.0015

  // Anthropic
  'claude-3-opus': { input: 60, output: 120 },
  'claude-3-sonnet': { input: 12, output: 24 },
  'claude-3-haiku': { input: 1, output: 2 },

  // Google
  'gemini-pro': { input: 0.5, output: 1.5 },
  'gemini-1.5-pro': { input: 1.4, output: 4.2 },

  // Default
  'default': { input: 1, output: 2 },
};

export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[modelId] || MODEL_PRICING['default'];

  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;

  return Math.ceil(inputCost + outputCost); // grosze
}
```

### 2.6 Middleware

```typescript
// ai-usage.middleware.ts
export const checkAILimits = async (req: Request, res: Response, next: NextFunction) => {
  const orgId = req.user!.organizationId;
  const estimatedTokens = estimateTokensFromRequest(req.body);

  const result = await aiUsageService.checkLimits(orgId, estimatedTokens);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'AI usage limit exceeded',
      code: 'AI_LIMIT_EXCEEDED',
      details: {
        limit: result.limit,
        used: result.used,
        remaining: 0,
        resetDate: result.resetDate,
      }
    });
  }

  // Attach to request for later logging
  req.aiUsageCheck = result;
  next();
};
```

---

## Faza 3: API Endpoints

### 3.1 Routes

```typescript
// GET  /api/v1/ai-usage/stats          - statystyki użycia
// GET  /api/v1/ai-usage/limits         - aktualne limity
// GET  /api/v1/ai-usage/history        - historia wywołań
// GET  /api/v1/ai-usage/daily          - dzienne agregaty
// GET  /api/v1/ai-usage/by-model       - użycie per model
// GET  /api/v1/ai-usage/by-user        - użycie per user

// Admin
// PUT  /api/v1/admin/ai-usage/limits/:orgId  - ustaw limity
// POST /api/v1/admin/ai-usage/reset/:orgId   - reset użycia
// GET  /api/v1/admin/ai-usage/all            - wszystkie organizacje
```

### 3.2 Response formats

```typescript
// GET /ai-usage/stats
{
  "period": "month",
  "periodStart": "2026-02-01T00:00:00Z",
  "periodEnd": "2026-02-28T23:59:59Z",
  "usage": {
    "totalTokens": 45230,
    "promptTokens": 32100,
    "completionTokens": 13130,
    "totalRequests": 156,
    "totalCostGrosze": 892
  },
  "limits": {
    "monthlyTokenLimit": 100000,
    "monthlyRequestLimit": 1000,
    "used": 45230,
    "remaining": 54770,
    "percentUsed": 45.23
  },
  "trend": {
    "vsLastPeriod": "+12%",
    "avgDailyTokens": 3250,
    "projectedMonthEnd": 97500
  }
}

// GET /ai-usage/limits
{
  "planType": "starter",
  "limits": {
    "monthlyTokens": 100000,
    "monthlyRequests": 1000,
    "maxPerRequest": 4000,
    "dailyTokens": null
  },
  "current": {
    "tokens": 45230,
    "requests": 156,
    "cost": 892
  },
  "periodStart": "2026-02-01T00:00:00Z",
  "periodEnd": "2026-02-28T23:59:59Z",
  "daysRemaining": 22,
  "overage": {
    "allowed": false,
    "costPer1k": 2
  }
}
```

---

## Faza 4: Integracja z istniejącymi endpointami AI

### 4.1 Endpointy do zintegrowania

```
/api/v1/ai/*              - AI chat, completions
/api/v1/ai-assistant/*    - AI Assistant
/api/v1/ai-chat/*         - Qwen chat
/api/v1/flow/*            - Flow engine (AI processing)
/api/v1/ai-knowledge/*    - Knowledge chat
```

### 4.2 Wrapper dla wywołań AI

```typescript
// ai-wrapper.ts
export async function callAIWithTracking<T>(
  orgId: string,
  userId: string,
  config: AICallConfig,
  aiFunction: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  // 1. Check limits
  const limitCheck = await aiUsageService.checkLimits(orgId, config.estimatedTokens);
  if (!limitCheck.allowed) {
    throw new AILimitExceededError(limitCheck);
  }

  try {
    // 2. Execute AI call
    const result = await aiFunction();

    // 3. Log usage
    await aiUsageService.logUsage({
      orgId,
      userId,
      providerId: config.providerId,
      providerName: config.providerName,
      modelId: config.modelId,
      endpoint: config.endpoint,
      promptTokens: result.usage?.prompt_tokens || config.estimatedTokens,
      completionTokens: result.usage?.completion_tokens || 0,
      totalTokens: result.usage?.total_tokens || config.estimatedTokens,
      latencyMs: Date.now() - startTime,
      success: true,
      feature: config.feature,
    });

    return result;
  } catch (error) {
    // Log failed attempt too
    await aiUsageService.logUsage({
      orgId,
      userId,
      ...config,
      success: false,
      errorCode: error.code,
    });
    throw error;
  }
}
```

---

## Faza 5: Frontend - Dashboard użycia

### 5.1 Nowa strona
`/dashboard/ai-usage` lub `/dashboard/settings/ai-usage`

### 5.2 Komponenty

```
src/app/[locale]/dashboard/ai-usage/
├── page.tsx                 # Główna strona
├── components/
│   ├── UsageOverview.tsx    # Karty z podsumowaniem
│   ├── UsageChart.tsx       # Wykres użycia (Recharts)
│   ├── LimitsProgress.tsx   # Progress bar limitu
│   ├── UsageByModel.tsx     # Tabela per model
│   ├── UsageByUser.tsx      # Tabela per user
│   ├── UsageHistory.tsx     # Lista ostatnich wywołań
│   └── AlertSettings.tsx    # Ustawienia alertów
```

### 5.3 Widoki

```
┌─────────────────────────────────────────────────────────────────┐
│  Użycie AI - Luty 2026                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│  │ 45,230       │ │ 156          │ │ 8.92 zł      │ │ 45%      ││
│  │ tokenów      │ │ requestów    │ │ koszt        │ │ limitu   ││
│  │ ↑12% vs prev │ │ ↑8%          │ │ ↑15%         │ │ ████░░░  ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│                                                                  │
│  [═══════════════════░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 45,230/100k  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Użycie tokenów (ostatnie 30 dni)                            ││
│  │     ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂                           ││
│  │     1  5  10  15  20  25  30                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────┐ ┌─────────────────────────────────┐│
│  │ Top modele              │ │ Top użytkownicy                 ││
│  │ gpt-4o-mini    65%      │ │ jan@example.com     12,300 tok  ││
│  │ gpt-4          25%      │ │ anna@example.com     8,200 tok  ││
│  │ claude-3-haiku 10%      │ │ piotr@example.com    5,100 tok  ││
│  └─────────────────────────┘ └─────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Faza 6: Plany abonamentowe

### 6.1 Definicja planów

```typescript
// config/ai-plans.ts
export const AI_PLANS = {
  free: {
    name: 'Free',
    monthlyTokenLimit: 10_000,
    monthlyRequestLimit: 100,
    maxTokensPerRequest: 2000,
    allowOverage: false,
    features: ['gpt-4o-mini'],
  },
  starter: {
    name: 'Starter',
    monthlyTokenLimit: 100_000,
    monthlyRequestLimit: 1_000,
    maxTokensPerRequest: 4000,
    allowOverage: true,
    overageCostPer1k: 2, // grosze
    features: ['gpt-4o-mini', 'gpt-4o'],
  },
  business: {
    name: 'Business',
    monthlyTokenLimit: 1_000_000,
    monthlyRequestLimit: 10_000,
    maxTokensPerRequest: 8000,
    allowOverage: true,
    overageCostPer1k: 1,
    features: ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'claude-3'],
  },
  enterprise: {
    name: 'Enterprise',
    monthlyTokenLimit: -1, // unlimited
    monthlyRequestLimit: -1,
    maxTokensPerRequest: 32000,
    allowOverage: false,
    features: ['all'],
  },
};
```

### 6.2 Integracja z Billing

```typescript
// Przy zmianie planu w Stripe webhook
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.organizationId;
  const planType = subscription.items.data[0].price.metadata.aiPlan;

  await aiUsageService.setLimits(orgId, AI_PLANS[planType]);
}
```

---

## Faza 7: Alerty i powiadomienia

### 7.1 Typy alertów

- 80% limitu wykorzystanego
- 90% limitu wykorzystanego
- 100% limitu (blokada lub overage)
- Anomalia użycia (nagły skok)

### 7.2 Kanały powiadomień

- Email do admina/ownera
- In-app notification
- Webhook (opcjonalnie)

---

## Kolejność implementacji

### Sprint 1 (Baza + Core) - ~4h
- [ ] Schema Prisma + migracja
- [ ] AIUsageService (podstawowy)
- [ ] Token counter (tiktoken)
- [ ] Cost calculator

### Sprint 2 (API + Middleware) - ~3h
- [ ] API endpoints (stats, limits, history)
- [ ] Middleware checkAILimits
- [ ] Integracja z 1-2 endpointami AI

### Sprint 3 (Frontend) - ~4h
- [ ] Strona /ai-usage
- [ ] Komponenty (overview, chart, progress)
- [ ] API client

### Sprint 4 (Pełna integracja) - ~3h
- [ ] Wrapper dla wszystkich endpointów AI
- [ ] Agregacja dzienna (cron)
- [ ] Alerty

### Sprint 5 (Plany + Billing) - ~2h
- [ ] Definicja planów
- [ ] Integracja ze Stripe webhooks
- [ ] Panel admin do zarządzania limitami

---

## Pliki do utworzenia

```
packages/backend/src/
├── modules/ai-usage/
│   ├── ai-usage.service.ts
│   ├── ai-usage.routes.ts
│   ├── ai-usage.middleware.ts
│   ├── ai-usage.types.ts
│   ├── token-counter.ts
│   ├── cost-calculator.ts
│   ├── usage-aggregator.ts
│   └── alerts.service.ts
├── config/
│   └── ai-plans.ts

packages/frontend/src/
├── app/[locale]/dashboard/ai-usage/
│   ├── page.tsx
│   └── components/
│       ├── UsageOverview.tsx
│       ├── UsageChart.tsx
│       ├── LimitsProgress.tsx
│       └── ...
├── lib/api/
│   └── aiUsage.ts
```

---

## Uwagi

1. **Tiktoken** - wymaga instalacji: `npm install tiktoken`
2. **Agregacja** - uruchamiać cron co godzinę lub na koniec dnia
3. **Cache** - rozważyć Redis dla szybkiego dostępu do limitów
4. **Retencja logów** - usuwać logi starsze niż 90 dni (GDPR)
