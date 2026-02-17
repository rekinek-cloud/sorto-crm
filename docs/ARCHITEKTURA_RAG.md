# Architektura RAG i Semantic Search -- Sorto CRM

Dokument opisuje system RAG (Retrieval-Augmented Generation) i wyszukiwania
semantycznego w Sorto CRM. Obejmuje model danych, serwisy, endpointy API,
proces indeksowania, integracje z pipeline emailowym i AI oraz proces
reindeksacji.

---

## 1. Przeglad

System RAG w Sorto CRM odpowiada za:

- **Indeksowanie danych CRM** -- zamiana encji biznesowych na wektory
  (embeddingi) i przechowywanie ich w PostgreSQL z rozszerzeniem pgvector.
- **Wyszukiwanie semantyczne** -- znajdowanie dokumentow
  kontekstowo podobnych do zapytania uzytkownika w jezyku naturalnym.
- **Dostarczanie kontekstu AI** -- wzbogacanie promptow AI o pasujace
  fragmenty z bazy wiedzy (RAG context injection).
- **Integracja z pipeline emailowym** -- automatyczne indeksowanie
  przetworzonych wiadomosci do bazy wektorowej.
- **Wykrywanie duplikatow** -- identyfikacja podobnych dokumentow
  na podstawie odleglosci wektorowej.

### Kluczowe liczby

| Parametr | Wartosc |
|----------|---------|
| Model embeddingowy (produkcja) | `text-embedding-3-large` (OpenAI) |
| Wymiarowosc wektorow (produkcja) | 3072 |
| Model embeddingowy (RAGService) | `text-embedding-3-small` (OpenAI) |
| Wymiarowosc wektorow (RAGService) | 1536 |
| Model embeddingowy (Qwen) | `text-embedding-v3` (DashScope) |
| Domyslny prog podobienstwa | 0.7 (PgVectorService), 0.5-0.7 (RAGService) |
| Domyslny limit wynikow | 10 |
| Rozmiar chunka | 500-1000 znakow |
| Cache TTL | 30 minut |

---

## 2. Diagram architektury

```
                          +---------------------+
                          |   Frontend UI       |
                          | /dashboard/rag-search|
                          +--------+------------+
                                   |
                         POST /api/v1/...
                                   |
         +-------------------------+----------------------------+
         |                         |                            |
         v                         v                            v
  +------+--------+    +-----------+---------+    +-------------+------+
  | /rag          |    | /vector-search      |    | /real-vector-search|
  | RAGService    |    | VectorService       |    | Raw SQL na vectors |
  | (zrodla +     |    | (vector_documents)  |    | (scoring +         |
  |  query AI)    |    |                     |    |  ranking)          |
  +------+--------+    +---------+-----------+    +----------+---------+
         |                       |                           |
         |    +-----------+      |                           |
         +--->| Chunker   |      |                           |
         |    | Service   |      |                           |
         |    +-----------+      |                           |
         v                       v                           v
  +------+-----------------------+---------------------------+------+
  |                        PostgreSQL + pgvector                     |
  |  +-------------------+  +------------------+  +---------------+ |
  |  | vector_documents  |  | vectors          |  | rag_sources   | |
  |  | (Prisma managed)  |  | (raw SQL,        |  | (raw SQL)     | |
  |  | Float[] embedding |  |  vector(3072))   |  |               | |
  |  +-------------------+  +------------------+  +---------------+ |
  |  +-------------------+  +------------------+                    |
  |  | vector_cache      |  | vector_search_   |                    |
  |  | (cache wynikow)   |  |   results        |                    |
  |  +-------------------+  | (analityka)      |                    |
  |                         +------------------+                    |
  +----------------------------------------------------------------+
         ^                       ^
         |                       |
  +------+--------+    +---------+-----------+
  | Email Pipeline|    | FlowRAGService      |
  | (auto-index   |    | (kontekst GTD Flow  |
  |  wiadomosci)  |    |  bez embeddingów)   |
  +---------------+    +---------------------+
```

---

## 3. Serwisy -- warstwy abstrakcji

System ma trzy glowne serwisy odpowiedzialne za operacje wektorowe.
Kazdy z nich obsluguje inna tabele lub tryb pracy.

### 3.1 VectorService (legacy / Prisma-managed)

**Plik**: `packages/backend/src/services/VectorService.ts`

| Cecha | Wartosc |
|-------|---------|
| Tabela | `vector_documents` (Prisma model) |
| Embedding | OpenAI `text-embedding-3-small` (1536 dim) lub mock (1536 dim) |
| Similarity | Cosinus obliczany w kodzie TypeScript (nie w SQL) |
| Fallback | Wyszukiwanie tekstowe ILIKE z normalizacja polskich slow |
| Cache | `vector_cache` (TTL 30 min, upsert po cacheKey) |
| Analityka | `vector_search_results` (log kazdego wyszukiwania) |

VectorService to pierwszy serwis wektorowy w systemie. Kiedy nie ma
skonfigurowanego klucza OpenAI, generuje mock embeddingi (hash SHA-256
znormalizowany do 1536 wymiarow). Wyszukiwanie cosinus odbywa sie w
TypeScript -- baza zwraca wszystkie dokumenty, a serwis oblicza
podobienstwo.

Jezeli wyszukiwanie wektorowe zwraca 0 wynikow, uruchamia sie **text
search fallback** z:
- normalizacja polskich znakow diakrytycznych (a/c/e/l/n/o/s/z/z),
- usuwaniem polskich stop words,
- prostym stemmerem (usuwanie polskich koncowek: -owskiej, -owski, -owej...),
- scoringiem opartym na trafnosciach w tytule i tresci.

### 3.2 PgVectorService (produkcja / pgvector native)

**Plik**: `packages/backend/src/services/vector/PgVectorService.ts`

| Cecha | Wartosc |
|-------|---------|
| Tabela | `vectors` (raw SQL, poza Prisma) |
| Embedding | OpenAI `text-embedding-3-large` (3072 dim) |
| Similarity | Natywny operator pgvector `<=>` (cosinus distance) w SQL |
| Metadata | JSONB z polami: type, entityId, organizationId, source, title, tags, importance |
| Upsert | Funkcja SQL `upsert_vector()` lub `INSERT ON CONFLICT` |

PgVectorService to docelowy serwis produkcyjny. Uzywa rozszerzenia
pgvector zainstalowanego w PostgreSQL. Wyszukiwanie odbywa sie natywnie
w SQL operatorem `<=>` (cosinus distance):

```sql
SELECT
  id, content, metadata,
  1 - (embedding <=> $1::vector(3072)) as similarity
FROM vectors
WHERE metadata->>'organizationId' = $2
  AND embedding IS NOT NULL
  AND 1 - (embedding <=> $1::vector(3072)) > $3   -- threshold
ORDER BY embedding <=> $1::vector(3072)
LIMIT $4
```

PgVectorService jest singletonem -- jedna instancja na caly proces.

### 3.3 RAGService (RAG z odpowiedzia AI)

**Plik**: `packages/backend/src/services/ai/RAGService.ts`

| Cecha | Wartosc |
|-------|---------|
| Tabele | `vector_documents`, `rag_embeddings`, `vectors`, `rag_sources` |
| Embedding | OpenAI `text-embedding-3-small` (1536 dim) |
| Tryby wyszukiwania | 1. Text ILIKE -> 2. Pattern fallback -> 3. pgvector similarity |
| Odpowiedz AI | Qwen Chat (QwenChatService) generuje odpowiedz na podstawie kontekstu |
| Zrodla | CRUD na `rag_sources` z chunkowaniem i indeksowaniem |

RAGService laczy wyszukiwanie wektorowe z generowaniem odpowiedzi AI.
Metoda `query()` wykonuje:
1. Wyszukiwanie podobnych dokumentow (`search()`).
2. Budowanie kontekstu z top wynikow.
3. Wyslanie kontekstu + pytania do Qwen Chat.
4. Zwrocenie odpowiedzi z lista zrodel i wskaznikiem confidence.

RAGService obsluguje rowniez **zrodla wiedzy** (rag_sources) --
recznie dodawane dokumenty, pliki i teksty. Kazde zrodlo jest dzielone
na chunki (~1000 znakow) i indeksowane w `vector_documents`.

### 3.4 FlowRAGService (kontekst organizacyjny)

**Plik**: `packages/backend/src/services/ai/FlowRAGService.ts`

FlowRAGService **nie uzywa embeddingów**. Buduje kontekst organizacyjny
dla elementow GTD Inbox na podstawie:
- dopasowania kontaktow po adresie email i domenie,
- dopasowania firm po domenie,
- listy aktywnych strumieni,
- historii decyzji dla podobnych elementow.

Wszyskie zapytania wykonuje rownolegle (Promise.all) z celem <100ms.
Wynik formatuje jako tekst do wstrzykniecia do promptu AI.

### 3.5 VectorStore (Voice AI)

**Plik**: `packages/backend/src/services/voice/VectorStore.ts`

Dedykowany store dla modulu Voice AI. Uzywa `text-embedding-3-large`
(3072 dim) i tabeli `vectors` z natywnym pgvector. Posiada wlasny
system relevance scoring z boostami za:
- recency (7d: +0.1, 1d: +0.1),
- importance (skala 1-10, boost do +0.2),
- typ encji (task: +0.2, project: +0.15, deal: +0.15).

### 3.6 EmbeddingsService (Qwen)

**Plik**: `packages/backend/src/services/ai/EmbeddingsService.ts`

Alternatywny serwis embeddingowy oparty na API DashScope (Qwen).
Uzywa modelu `text-embedding-v3` (1536 wymiarow). Obsluguje batch
do 25 tekstow. Uzywany przez modul AI Conversations Sync.

### 3.7 ChunkerService

**Plik**: `packages/backend/src/services/ai/ChunkerService.ts`

Dzieli dokumenty na fragmenty (chunki) do indeksowania:

| Tryb | Strategia | Domyslny rozmiar |
|------|-----------|-----------------|
| `chunkText` | Podział na zdania z overlap | 500 tokenow, overlap 50 |
| `chunkMarkdown` | Podział po naglowkach (##) | 500 tokenow |
| `chunkCode` | Podział po funkcjach/klasach | 50 linii |
| `autoChunk` | Auto-detekcja po rozszerzeniu pliku | j.w. |

---

## 4. Schemat bazy danych

### 4.1 Tabela `vectors` (pgvector native)

```sql
CREATE TABLE vectors (
  id             VARCHAR(255) PRIMARY KEY,
  content        TEXT NOT NULL,
  metadata       JSONB DEFAULT '{}',
  embedding      vector(3072),        -- pgvector typ
  embedding_data TEXT,                 -- JSON backup embeddingu
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);
```

Metadata JSONB zawiera:
```json
{
  "type": "message|contact|company|deal|task|project|knowledge|stream|...",
  "entityId": "uuid",
  "organizationId": "uuid",
  "title": "Tytul dokumentu",
  "source": "email-pipeline|manual|sync|...",
  "tags": ["tag1", "tag2"],
  "importance": 7,
  "urgencyScore": 85,
  "priority": "HIGH",
  "actionNeeded": "true",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

Funkcja SQL do upsert:
```sql
CREATE OR REPLACE FUNCTION upsert_vector(
  p_id VARCHAR, p_content TEXT, p_metadata JSONB, p_embedding vector(3072)
) RETURNS VOID AS $$
BEGIN
  INSERT INTO vectors (id, content, metadata, embedding, created_at, updated_at)
  VALUES (p_id, p_content, p_metadata, p_embedding, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    metadata = EXCLUDED.metadata,
    embedding = EXCLUDED.embedding,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Tabela `vector_documents` (Prisma managed)

```
model vector_documents {
  id                String    @id
  title             String
  content           String
  contentHash       String    @unique
  embedding         Float[]
  entityType        String
  entityId          String
  source            String
  language          String    @default("pl")
  chunkIndex        Int       @default(0)
  totalChunks       Int       @default(1)
  chunkSize         Int?
  processingModel   String?
  processingDate    DateTime  @default(now())
  lastUpdated       DateTime
  organizationId    String

  @@index([contentHash])
  @@index([organizationId, entityId])
  @@index([organizationId, entityType])
}
```

### 4.3 Tabela `vector_cache`

```
model vector_cache {
  id             String    @id
  cacheKey       String    @unique        -- MD5(query + filters + limit + threshold)
  queryText      String
  results        Json                     -- pelny VectorSearchResponse
  hitCount       Int       @default(0)
  lastHit        DateTime  @default(now())
  expiresAt      DateTime
  filters        Json?
  limit          Int       @default(10)
  threshold      Float     @default(0.7)
  organizationId String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime

  @@index([expiresAt])
  @@index([organizationId, cacheKey])
}
```

### 4.4 Tabela `vector_search_results` (analityka)

```
model vector_search_results {
  id              String    @id
  queryText       String
  queryEmbedding  Float[]
  documentId      String    -- FK -> vector_documents
  similarity      Float
  rank            Int
  userId          String?
  searchContext   String?   -- 'api' | 'voice' | 'email-pipeline'
  executionTime   Int?      -- ms
  createdAt       DateTime  @default(now())
  organizationId  String

  @@index([createdAt])
  @@index([organizationId, userId])
}
```

### 4.5 Tabela `rag_sources` (dynamiczna, raw SQL)

```sql
CREATE TABLE rag_sources (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT DEFAULT 'document',
  description     TEXT,
  chunks_count    INT DEFAULT 0,
  total_tokens    INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  stream_id       TEXT,
  organization_id TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rag_sources_org ON rag_sources(organization_id);
```

---

## 5. Co jest indeksowane

### 5.1 Encje CRM (reindex-rag.ts i RAGService.indexAllData)

| Typ encji | entityType | Pola wlaczone do tresci | Zrodlo |
|-----------|-----------|-------------------------|--------|
| Strumienie | `STREAM` / `stream` | name, description, streamType, streamRole, status | stream-index |
| Zadania | `TASK` / `task` | title, description, status, priority, stream.name, dueDate, assignedTo | task-index / sync |
| Wiadomosci email | `MESSAGE` / `message` | subject, fromName, fromAddress, toAddress, content (do 2000 zn.), extractedContext | email-index / sync |
| Kontakty | `CONTACT` / `contact` | firstName, lastName, email, phone, position, company.name, notes | contact-index / sync |
| Firmy | `COMPANY` / `company` | name, industry, website, phone, address, description, contacts, deals | company-index / sync |
| Transakcje | `DEAL` / `deal` | title, company.name, value, stage, description, probability | deal-index / sync |
| Projekty | `PROJECT` / `project` | name, description, status, priority, startDate, endDate, tasks | project-index / sync |
| Spotkania | `MEETING` | title, description, location, date, status, notes | meeting-index |
| Leady | `LEAD` | title, contactPerson, company, source, status, description | lead-index |
| Oferty | `OFFER` | offerNumber, company, contact, totalAmount, status, validUntil | offer-index |
| Zamowienia | `ORDER` | orderNumber, customer, totalAmount, status, deliveryDate | order-index |
| Faktury | `INVOICE` | invoiceNumber, amount, totalAmount, status, dueDate | invoice-index |
| GTD Inbox | `INBOX_ITEM` | content, sourceType, processed status | gtd-index |
| Cele RZUT | `PRECISE_GOAL` | result, background, measurement, deadline, status | gtd-index |
| Obszary odp. | `AREA_OF_RESPONSIBILITY` | name, description, purpose | gtd-index |
| Moze kiedys | `SOMEDAY_MAYBE` | title, description, category | gtd-index |
| Czekam na | `WAITING_FOR` | description, waitingForWho, expectedResponseDate | gtd-index |
| Nastepne akcje | `NEXT_ACTION` | title, description, context, energy, estimatedTime | gtd-index |
| Baza wiedzy | `knowledge` | title, content, category, tags | sync |
| Zrodla RAG | `rag_source` | name (tytul), chunked content | rag_sources |

### 5.2 Automatyczne indeksowanie z Email Pipeline

Serwis `RuleProcessingPipeline` automatycznie indeksuje przetworzone
emaile do `vector_documents` gdy:
- Reguła processingowa ma akcje `addToRag: true`, lub
- Konfiguracja post-actions dla danej klasy emaila ma `rag: true`.

Indeksowanie odbywa sie przez `INSERT INTO vector_documents` z:
- id: `rag-{entityType}-{entityId}`
- contentHash: SHA-256 tresci
- embedding: pusty (do uzupelnienia przez reindex)
- content: do limitu `ragContentLimit` z konfiguracji pipeline

---

## 6. Endpointy API

### 6.1 Vector Search (VectorService)

Prefix: `/api/v1/vector-search`

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/search` | Wyszukiwanie semantyczne | Tak |
| POST | `/documents` | Tworzenie dokumentu wektorowego | Tak |
| PUT | `/documents/:id` | Aktualizacja dokumentu | Tak |
| DELETE | `/documents/:entityType/:entityId` | Usuwanie dokumentow encji | Tak |
| POST | `/sync` | Synchronizacja encji do bazy wektorowej | Tak |
| POST | `/index-all` | Pelne indeksowanie wszystkich encji | Tak |
| GET | `/analytics` | Statystyki bazy wektorowej | Tak |
| GET | `/status` | Status systemu RAG | Tak |
| POST | `/cache/cleanup` | Czyszczenie wygaslego cache | Tak |

#### Przykladowe zapytanie wyszukiwania:

```json
POST /api/v1/vector-search/search
{
  "query": "faktury od TechStartup Innovations",
  "limit": 10,
  "threshold": 0.3,
  "filters": {
    "entityType": "INVOICE",
    "timeRange": "quarter"
  },
  "useCache": true
}
```

#### Odpowiedz:

```json
{
  "success": true,
  "data": {
    "query": "faktury od TechStartup Innovations",
    "results": [
      {
        "id": "vec-123",
        "title": "Faktura FV/2026/001",
        "content": "Faktura: FV/2026/001. Firma: TechStartup...",
        "entityType": "INVOICE",
        "entityId": "inv-456",
        "similarity": 0.87,
        "metadata": {
          "source": "invoice-index",
          "language": "pl",
          "chunkIndex": 0,
          "totalChunks": 1,
          "processingDate": "2026-01-15T10:00:00Z"
        }
      }
    ],
    "totalResults": 1,
    "searchTime": 52,
    "fromCache": false,
    "threshold": 0.3
  }
}
```

### 6.2 Real Vector Search (vectors table)

Prefix: `/api/v1/real-vector-search`

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/search` | Wyszukiwanie z rankingiem i scoring | Tak |
| GET | `/stats` | Statystyki tabeli vectors | Tak |
| GET | `/suggestions/:query` | Sugestie wyszukiwania | Tak |

Scoring w real-vector-search uwzglednia:
- dopasowanie tytulu (+20) i tresci (+15),
- typ encji (message: +8, company: +7, contact: +6),
- urgency score (boost proporcjonalny),
- priorytet (HIGH: +8, MEDIUM: +5),
- importance (boost proporcjonalny),
- recency (7d: +5, 30d: +3, 90d: +1).

### 6.3 RAG API (RAGService)

Prefix: `/api/v1/rag`

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/sources` | Lista zrodel wiedzy | Tak |
| POST | `/sources` | Dodanie zrodla tekstowego | Tak |
| POST | `/sources/upload` | Upload pliku jako zrodla | Tak (multer) |
| GET | `/sources/:id` | Szczegoly zrodla | Tak |
| DELETE | `/sources/:id` | Usuwanie zrodla | Tak |
| PATCH | `/sources/:id` | Aktualizacja statusu | Tak |
| POST | `/query` | Pytanie z odpowiedzia AI | Tak |
| POST | `/search` | Wyszukiwanie (bez odpowiedzi AI) | Tak |
| GET | `/status` | Status systemu RAG | Tak |

### 6.4 Test RAG Search (bez autoryzacji)

Prefix: `/api/v1/test-rag-search`

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/search` | Wyszukiwanie testowe | Nie |
| GET | `/debug` | Debug info o wektorach | Nie |

Endpoint testowy automatycznie wybiera pierwsza organizacje z danymi.
Przeznaczony wylacznie do rozwoju i debugowania.

### 6.5 RAG Agent (proxy do zewnetrznego serwisu)

Prefix: `/api/v1/rag-agent`

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/query` | Proxy do RAG Service (port 8000) | Tak |

---

## 7. Integracja z Email Pipeline

```
Email przychodzacy
       |
       v
+-------------------+
| RuleProcessing    |
| Pipeline          |
| (Stage 1-4)      |
+--------+----------+
         |
         v  (Stage 5: Post-actions)
+--------+----------+
| Czy akcja         |
| addToRag = true?  |
+--------+----------+
    |Tak        |Nie
    v           v
+---+--------+  (brak indeksowania)
| INSERT INTO |
| vector_     |
| documents   |
| (bez embed- |
|  dingu)     |
+-------------+
```

Emaile sa indeksowane do `vector_documents` z:
- `entityType` = typ klasy emaila (np. 'email'),
- `source` = 'email-pipeline',
- `embedding` = `'{}'` (pusty -- do uzupelnienia przez reindex),
- `content` = subject + from + tresc (do limitu konfiguracji).

Aby emaile mialy prawdziwe embeddingi i dzialaly z wyszukiwaniem
cosinus, trzeba uruchomic reindeksacje (punkt 9).

---

## 8. Integracja z AI (RAG Context Injection)

System RAG wzbogaca prompty AI o kontekst z bazy wiedzy w kilku
miejscach:

### 8.1 PgVectorService.getRAGContext()

```typescript
const context = await pgVectorService.getRAGContext(orgId, query, 4000);
// context.formattedContext:
// === Kontekst z bazy wiedzy ===
//
// [TASK] (trafnosc: 92%)
// Tytul: Przygotowac wycene
// Zadanie: Przygotowac wycene dla TechStartup...
//
// ---
//
// [CONTACT] (trafnosc: 85%)
// ...
```

### 8.2 RAGService.getContext()

```typescript
const context = await ragService.getContext(query, 3000);
// Zwraca sformatowany tekst z [ENTITY_TYPE] i % trafnosci
```

### 8.3 RAGService.query() (odpowiedz AI)

Metoda `query()` buduje pelny RAG pipeline:
1. Wyszukuje top 5 dokumentow.
2. Formatuje kontekst do promptu systemowego.
3. Wysyla do Qwen Chat z instrukcjami odpowiadania po polsku.
4. Zwraca odpowiedz + zrodla + confidence.

### 8.4 FlowRAGService (kontekst bez embeddingów)

FlowRAGService jest uzywany przez `RuleProcessingPipeline` do budowania
kontekstu organizacyjnego:
- Rozpoznane kontakty (email/domena),
- Rozpoznane firmy (domena/email/nazwa),
- Dostepne strumienie GTD (z liczba ostatnich elementow),
- Historia podobnych elementow (poprzednie decyzje GTD).

Ten kontekst jest wstrzykiwany do promptu AI jako sekcja
`--- KONTEKST ORGANIZACYJNY (RAG) ---`.

---

## 9. Reindeksacja

### 9.1 Skrypt reindex-rag.ts

**Plik**: `packages/backend/src/scripts/reindex-rag.ts`
**Uruchomienie**: `npx ts-node src/scripts/reindex-rag.ts`

Skrypt wykonuje:
1. Usuniecie wszystkich istniejacych vector_documents dla organizacji.
2. Indeksowanie wszystkich 13 typow encji (streams, tasks, messages,
   contacts, companies, deals, projects, meetings, leads, offers,
   orders, invoices, GTD items).
3. Generowanie mock embeddingów (SHA-256, 1536 dim) -- nie wymaga
   klucza API.
4. Wyswietlenie podsumowania w tabeli.

**UWAGA**: Skrypt uzywa hardcoded `ORG_ID`. Przed uruchomieniem nalezy
zaktualizowac wartosc na wlasciwe ID organizacji.

### 9.2 Endpoint index-all

```
POST /api/v1/vector-search/index-all
{ "force": true }
```

Indeksuje wszystkie encje (tasks, projects, contacts, deals, companies,
knowledge, streams, messages) przez VectorService. Parametr `force: true`
wymusza nadpisanie istniejacych dokumentow.

### 9.3 RAGService.indexAllData()

Metoda programowa indeksujaca:
- Projekty (z zadaniami),
- Zadania (z projektem i kontaktem),
- Kontakty (z firma),
- Transakcje (z firma),
- Strumienie.

Uzywa prawdziwych embeddingów OpenAI (wymaga skonfigurowanego klucza API).

---

## 10. Konfiguracja embeddingów -- podsumowanie

System obsluguje 3 providerow embeddingów:

```
+-------------------+------------------------+--------+--------------------+
| Provider          | Model                  | Wymiary| Uzywany przez      |
+-------------------+------------------------+--------+--------------------+
| OpenAI            | text-embedding-3-large | 3072   | PgVectorService    |
|                   |                        |        | VectorStore (Voice)|
+-------------------+------------------------+--------+--------------------+
| OpenAI            | text-embedding-3-small | 1536   | VectorService      |
|                   |                        |        | RAGService         |
|                   |                        |        | EmbedderService    |
+-------------------+------------------------+--------+--------------------+
| Qwen (DashScope)  | text-embedding-v3      | 1536   | EmbeddingsService  |
+-------------------+------------------------+--------+--------------------+
| Mock (fallback)   | SHA-256 hash           | 1536   | VectorService      |
|                   |                        |        | reindex-rag.ts     |
+-------------------+------------------------+--------+--------------------+
```

Klucz API jest pobierany w kolejnosci:
1. Z tabeli `ai_providers` (name ILIKE '%openai%', status = ACTIVE,
   config.apiKey).
2. Ze zmiennej srodowiskowej `OPENAI_API_KEY`.
3. Fallback na mock embedding (ograniczona funkcjonalnosc).

---

## 11. Charakterystyka wydajnosci

| Operacja | Sredni czas | Uwagi |
|----------|-------------|-------|
| Wyszukiwanie pgvector (vectors) | ~50ms | Natywny operator SQL |
| Wyszukiwanie VectorService | ~50-200ms | Zalezy od liczby dokumentow (cosinus w TS) |
| Text search fallback | ~30-100ms | ILIKE z indeksami |
| Generowanie embeddingu (OpenAI) | ~200-500ms | Latency API |
| Reindeksacja pelna (mock) | ~5-30s | Zalezy od liczby encji |
| Cache hit | <5ms | Lookup po cacheKey |
| FlowRAGService.buildContext() | <100ms | Rownolegle zapytania SQL |

### Optymalizacje

- **Cache wynikow**: VectorService cachuje wyniki w `vector_cache` na
  30 minut. Klucz cache to MD5 z query + filters + limit + threshold.
- **Batch processing**: EmbedderService procesuje embeddingi w batch
  do 25 tekstow z opoznieniem 500ms miedzy batczhami.
- **Deduplikacja**: `vector_documents.contentHash` zapobiega duplikowaniu
  tych samych tresci (MD5 z lowercase+trim).
- **Lazy initialization**: PgVectorService i VectorStore inicjalizuja
  klienta OpenAI dopiero przy pierwszym uzyciu.

---

## 12. Wielodostepnosc (multi-tenancy)

Wszystkie operacje wektorowe sa izolowane per organizacja:

- `vector_documents.organizationId` -- filtr w zapytaniach Prisma.
- `vectors.metadata->>'organizationId'` -- filtr w zapytaniach SQL.
- `rag_sources.organization_id` -- filtr w zapytaniach SQL.
- `vector_cache.organizationId` -- cache per organizacja.

Uzytkownik nigdy nie widzi dokumentow innej organizacji.

---

## 13. Mapa plikow

```
packages/backend/src/
  services/
    VectorService.ts                   -- Glowny serwis (vector_documents)
    vector/
      PgVectorService.ts               -- Produkcyjny serwis pgvector (vectors)
    voice/
      VectorStore.ts                   -- Serwis Voice AI (vectors)
    ai/
      RAGService.ts                    -- RAG z odpowiedzia AI
      FlowRAGService.ts               -- Kontekst organizacyjny (bez embeddingów)
      EmbeddingsService.ts             -- Qwen embeddingi
      ChunkerService.ts               -- Dzielenie na chunki
      RuleProcessingPipeline.ts        -- Pipeline emailowy (addToRAG)
  routes/
    vectorSearch.ts                    -- /api/v1/vector-search/*
    realVectorSearch.ts                -- /api/v1/real-vector-search/*
    rag.ts                             -- /api/v1/rag/*
    testRagSearch.ts                   -- /api/v1/test-rag-search/*
    ragAgent.ts                        -- /api/v1/rag-agent/*
  scripts/
    reindex-rag.ts                     -- Skrypt pelnej reindeksacji
  modules/
    ai-conversations-sync/
      services/
        EmbedderService.ts             -- Embeddingi dla sync konwersacji AI
        ChunkerService.ts              -- Chunker specyficzny dla sync
        SyncOrchestratorService.ts     -- Orkiestrator synchronizacji
```

---

## 14. Diagram przepływu wyszukiwania

```
Uzytkownik wpisuje zapytanie
         |
         v
  +------------------+
  | Walidacja Zod    |
  | (query, limit,   |
  |  threshold,      |
  |  filters)        |
  +--------+---------+
           |
           v
  +------------------+
  | Sprawdz cache    |  ---> [HIT] ---> Zwroc z cache
  | (MD5 klucz)      |
  +--------+---------+
           | [MISS]
           v
  +------------------+
  | Generuj embedding|  ---> OpenAI API (text-embedding-3-*)
  | zapytania        |
  +--------+---------+
           |
           v
  +------------------+
  | Wyszukaj         |
  | najbardziej      |
  | podobne          |
  | (cosinus > prog) |
  +--------+---------+
           |
     +-----+-----+
     |           |
  [wyniki]   [0 wynikow]
     |           |
     v           v
  Sortuj     +------------------+
  wg simil.  | Text search      |
     |       | fallback (ILIKE) |
     |       | + stemming PL    |
     |       +--------+---------+
     |                |
     v                v
  +------------------+
  | Zapisz do cache  |
  | i analityki      |
  +--------+---------+
           |
           v
  Odpowiedz JSON
```

---

## 15. Znane ograniczenia i plan rozwoju

### Obecne ograniczenia

1. **Mieszane wymiary embeddingów** -- system ma dokumenty z 1536 i 3072
   wymiarami w roznych tabelach. Wyszukiwanie cross-table wymaga
   ujednolicenia wymiaru.
2. **Mock embeddingi** -- znaczna czesc dokumentow w `vector_documents`
   ma mock embeddingi (hash-based). Wyszukiwanie cosinus na mockach
   daje losowe wyniki -- dlatego text search fallback jest krytyczny.
3. **Brak real-time sync** -- zmiana encji CRM (np. edycja kontaktu)
   nie aktualizuje automatycznie wektora. Trzeba uruchomic sync/reindex.
4. **Brak indeksu HNSW/IVFFlat** -- na tabeli `vectors` nie ma indeksu
   pgvector, co moze wplywac na wydajnosc przy >100k wektorow.

### Plan rozwoju

- [ ] Ujednolicenie na jeden model embeddingowy (text-embedding-3-large).
- [ ] Automatyczny re-embed przy aktualizacji encji CRM (event-driven).
- [ ] Dodanie indeksu pgvector `CREATE INDEX ON vectors USING hnsw (embedding vector_cosine_ops)`.
- [ ] Redis cache zamiast tabeli `vector_cache`.
- [ ] Dashboard analityki wyszukiwania.
- [ ] Streaming odpowiedzi RAG.
