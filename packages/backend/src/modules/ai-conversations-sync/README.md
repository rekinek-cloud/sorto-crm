# AI Conversations Sync Module

Import konwersacji z ChatGPT, Claude i DeepSeek do bazy RAG jako strumienie REFERENCE.

## Struktura

```
ai-conversations-sync/
├── types/
│   └── index.ts           # Definicje typów dla wszystkich źródeł
├── parsers/
│   ├── ChatGPTParser.ts   # Parser dla eksportów ChatGPT
│   ├── ClaudeParser.ts    # Parser dla eksportów Claude
│   └── DeepSeekParser.ts  # Parser dla eksportów DeepSeek
├── services/
│   ├── AiConversationsService.ts  # CRUD i wyszukiwanie
│   ├── ChunkerService.ts          # Dzielenie na chunki (tiktoken)
│   ├── ClassifierService.ts       # Klasyfikacja po słowach kluczowych
│   ├── DeduplicatorService.ts     # Deduplikacja przez hash
│   ├── EmbedderService.ts         # Embeddingi OpenAI
│   └── SyncOrchestratorService.ts # Główny orkiestrator sync
└── index.ts               # Eksporty modułu
```

## API Endpoints

### Import

```http
POST /api/v1/ai-sync/import
Content-Type: application/json

{
  "source": "CHATGPT" | "CLAUDE" | "DEEPSEEK",
  "jsonContent": "...",
  "indexAfterImport": true,
  "createStreams": true
}
```

### Wyszukiwanie (Vector Search)

```http
POST /api/v1/ai-sync/search
Content-Type: application/json

{
  "query": "Jak zaimplementować...",
  "limit": 10,
  "appName": "sorto-crm",
  "source": "CHATGPT"
}
```

### Lista konwersacji

```http
GET /api/v1/ai-sync/conversations?source=CHATGPT&appName=sorto-crm&skip=0&take=50
```

### Szczegóły konwersacji

```http
GET /api/v1/ai-sync/conversations/:id
```

### Indeksowanie

```http
POST /api/v1/ai-sync/conversations/:id/index
POST /api/v1/ai-sync/index-all
```

### Status i statystyki

```http
GET /api/v1/ai-sync/status
GET /api/v1/ai-sync/summary
GET /api/v1/ai-sync/app-mappings
```

### Zarządzanie

```http
DELETE /api/v1/ai-sync/conversations/:id
DELETE /api/v1/ai-sync/source/:source
POST /api/v1/ai-sync/reclassify
```

## Modele Prisma

### AiConversation
- Główna tabela konwersacji
- Powiązanie ze Stream (typ REFERENCE)
- Klasyfikacja per appName

### AiConversationMessage
- Wiadomości w konwersacji
- Role: user, assistant, system

### AiConversationChunk
- Chunki dla RAG (500 tokenów, 50 overlap)
- Embeddingi pgvector (1536 wymiarów)

### AiSyncStatus
- Status synchronizacji per źródło
- Dropbox path/cursor dla auto-sync

### AiAppMapping
- Mapowanie słów kluczowych → aplikacja
- Auto-tworzenie strumieni REFERENCE

## Integracja ze STREAMS

Konwersacje są automatycznie:
1. Klasyfikowane według słów kluczowych
2. Przypisywane do strumieni REFERENCE
3. Indeksowane do wyszukiwania semantycznego

## Migracja

```bash
# Uruchom migrację z pgvector
psql -f prisma/migrations/20260131_add_ai_conversations_sync/migration.sql
```

## Opcjonalne zależności

- `tiktoken` - dokładne liczenie tokenów (fallback: estymacja słów)
- `openai` - wymagane dla embeddingów

## Przykład użycia

```typescript
import { SyncOrchestratorService } from './modules/ai-conversations-sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const syncService = new SyncOrchestratorService(prisma);

// Import z ChatGPT
const result = await syncService.syncFromJson(
  organizationId,
  userId,
  'CHATGPT',
  chatgptExportJson,
  { indexAfterImport: true }
);

console.log(`Imported: ${result.conversationsImported}`);
```
