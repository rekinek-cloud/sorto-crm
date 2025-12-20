# 🧠 RAG System - Plan Implementacji Prawdziwego Semantic Search

## 📋 **TODO LISTA - PRAWDZIWY RAG 100%**

### 🔴 **PRIORYTET HIGH - Fundament Technologiczny (1-2 dni)**

#### 1. 🗄️ Dodać pgvector extension do PostgreSQL
```sql
-- Dodaj pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2. 🗄️ Zmodyfikować schemat bazy - dodać kolumnę embedding vector(1536)
```sql
-- Dodaj kolumnę embedding
ALTER TABLE vectors ADD COLUMN embedding vector(1536);
```

#### 3. 🔍 Utworzyć indeksy wektorowe (ivfflat) dla wydajnego wyszukiwania
```sql
-- Utwórz indeksy dla wydajnego wyszukiwania
CREATE INDEX vectors_embedding_idx ON vectors 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

#### 4. 🤖 Zastąpić mock embeddings prawdziwymi OpenAI text-embedding-ada-002
```typescript
// W VectorService.ts zastąp hash-based embeddings:
const response = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: text.trim(),
  encoding_format: 'float',
});
return response.data[0].embedding;
```

#### 5. 🔧 Przepisać VectorService.ts - usunąć hash-based embeddings
- Usuń funkcję `generateEmbedding()` z hash-based mock
- Zaimplementuj prawdziwe OpenAI embeddings
- Lokalizacja: `/packages/backend/src/services/VectorService.ts`

#### 6. 🔍 Zaimplementować prawdziwe cosine similarity search w SQL
```sql
-- Zamień SQL LIKE na cosine similarity:
SELECT *, (embedding <=> $1::vector) as similarity 
FROM vectors 
WHERE embedding <=> $1::vector < 0.7
ORDER BY similarity ASC
LIMIT 10;
```

---

### 🟡 **PRIORYTET MEDIUM - Migracja i Metryki (2-3 dni)**

#### 7. 📊 Re-wektoryzować wszystkie 371 dokumentów z prawdziwymi embeddings
- **Koszt**: ~$0.10 (371 × avg 300 tokens × $0.0001/1K)
- **Batch processing**: 10 dokumentów/request
- **Progress tracking**: logs + progress bar

#### 8. ⚡ Dodać rate limiting dla OpenAI API calls
```typescript
const rateLimiter = new RateLimiter({
  tokensPerMinute: 1000000,
  requestsPerMinute: 3000
});
```

#### 9. 📈 Zastąpić hardcoded similarity scores prawdziwymi metrics
```typescript
// Usuń z testRagSearch.ts:
// relevanceScore: 0.8,        // ← Hardcoded
// vectorSimilarity: 0.75,     // ← Hardcoded

// Dodaj prawdziwe:
relevanceScore: calculateRelevanceScore(similarity, urgency),
vectorSimilarity: actualSimilarityFromPgvector,
semanticMatch: similarity > 0.7
```

---

### 🟢 **PRIORYTET LOW - Advanced Features (3-4 dni)**

#### 10. 🔄 Zaimplementować hybrid search (semantic + keyword)
```typescript
// Kombinacja semantic + keyword:
const semanticResults = await vectorSearch(query);
const keywordResults = await textSearch(query);
return mergeAndRankResults(semanticResults, keywordResults);
```

#### 11. 📦 Dodać batch processing dla dużych dataset
- Batch API calls do OpenAI (max 2048 inputs/request)
- Queue system dla długich operacji
- Progress tracking dla UI

#### 12. 🎯 Zoptymalizować cache embeddings dla częstych zapytań
```typescript
// Redis cache dla częstych queries:
const cacheKey = `embedding:${hash(query)}`;
const cachedEmbedding = await redis.get(cacheKey);
```

#### 13. 💰 Dodać monitoring kosztów OpenAI API
```typescript
const costTracker = {
  totalTokens: 0,
  monthlyCost: 0,
  alertThreshold: 100 // $100/month
};
```

#### 14. 🧪 Napisać testy integracyjne dla prawdziwego RAG
- Unit tests dla embedding generation
- Integration tests dla search accuracy
- Performance benchmarks

---

## 📅 **HARMONOGRAM IMPLEMENTACJI**

### **Tydzień 1: Fundament (Dni 1-2)**
- [x] pgvector setup + schema migration
- [x] OpenAI embeddings integration 
- [x] Basic semantic search implementation
- [x] Replace SQL LIKE with vector search

### **Tydzień 2: Migracja (Dni 3-4)**
- [ ] Re-vectorize all 371 documents
- [ ] Update all search endpoints
- [ ] Replace hardcoded metrics
- [ ] Testing and validation

### **Tydzień 3: Optymalizacja (Dni 5-7)**
- [ ] Hybrid search implementation
- [ ] Performance optimizations
- [ ] Cost monitoring
- [ ] Advanced features

---

## 💰 **SZACUNKOWE KOSZTY**

### **One-time Setup:**
- **Re-vectorization**: $0.10 (371 docs × avg 300 tokens)
- **Development time**: 7 dni roboczych

### **Monthly Operations:**
- **New embeddings**: $1-5/miesiąc (nowe dokumenty)
- **Search queries**: $0 (używają istniejących embeddings)

---

## 🎯 **KLUCZOWE PLIKI DO MODYFIKACJI**

1. **Database Schema**: 
   - `/packages/backend/prisma/schema.prisma`
   - Migration SQL scripts

2. **Backend Services**:
   - `/packages/backend/src/services/VectorService.ts` ← **GŁÓWNY PLIK**
   - `/packages/backend/src/routes/testRagSearch.ts`
   - `/packages/backend/src/routes/realVectorSearch.ts`

3. **Migration Scripts**:
   - `/real-data-vectorization.js` ← **RE-VECTORIZATION**

4. **Frontend**:
   - `/packages/frontend/src/app/dashboard/rag-search/page.tsx`

---

## 🔧 **NARZĘDZIA I BIBLIOTEKI**

### **Dodaj do package.json:**
```json
{
  "dependencies": {
    "pgvector": "^0.1.8",
    "openai": "^4.20.1",
    "rate-limiter-flexible": "^2.4.2"
  }
}
```

### **PostgreSQL Extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- dla hybrid search
```

---

## ✨ **OCZEKIWANE REZULTATY**

### **Before (Fake RAG):**
```
Query: "Giovanni paper delivery" 
→ Method: SQL LIKE pattern matching
→ Results: 1 exact keyword match
→ Time: 8ms, Quality: 30%
→ Semantic understanding: ❌
```

### **After (Real RAG):**  
```
Query: "Giovanni paper delivery"
→ Method: OpenAI embeddings + cosine similarity
→ Results: 8-10 semantically related documents
→ Time: 15ms, Quality: 95%
→ Semantic understanding: ✅ (suppliers, materials, logistics)
```

---

## 🚀 **VALIDATION PLAN**

### **Test Queries:**
1. **"delivery problems"** → powinien znaleźć logistykę, opóźnienia, transport
2. **"paper quality issues"** → powinien znaleźć reklamacje, jakość, specyfikacje
3. **"Giovanni contacts"** → powinien znaleźć osoby, firmy, komunikację
4. **"urgent orders"** → powinien znaleźć pilne zlecenia, deadline'y

### **Success Metrics:**
- **Precision**: >80% relevant results in top 10
- **Recall**: Find 90%+ of semantically related docs  
- **Speed**: <50ms average response time
- **Cost**: <$10/month operational costs

**Plan gotowy do implementacji! 🎯**