# TODO_RAG - Plan Implementacji RAG System

## 🎯 Status Obecny
- ❌ RAG System nie działa (błąd: relation "vectors" does not exist)
- ⚠️ Tabele wektorowe obecne ale puste (vector_documents, vector_search_results, vector_cache: 0 rekordów)
- 📋 CLAUDE.md nieaktualny (twierdzi 371 wektorów vs 0 rzeczywistych)

## 📋 Plan Wdrożenia RAG System (11 zadań)

### 🔥 FAZA 1: Infrastruktura (HIGH Priority)
**Cel: Naprawienie podstawowej struktury danych**

1. **Analiza bieżącej struktury RAG w kodzie**
   - Sprawdzenie plików: `/routes/testRagSearch.ts`, `/routes/vectorSearch.ts`
   - Weryfikacja service layer dla RAG
   - Identyfikacja używanych bibliotek/dependencies

2. **Sprawdzenie schema Prisma dla modeli wektorowych**
   - Analiza `schema.prisma` - modele vector*
   - Weryfikacja czy jest model `Vector` vs `vector_documents`
   - Sprawdzenie relacji z Contact/Company/Message

3. **Weryfikacja endpointów RAG API**
   - Test `/api/v1/test-rag-search/search`
   - Test `/api/v1/vector-search/*`
   - Sprawdzenie rejestracji routes w `app.ts`

4. **Sprawdzenie konfiguracji pgvector extension**
   - Weryfikacja czy pgvector jest zainstalowany w PostgreSQL
   - Test czy można tworzyć kolumny typu `vector`
   - Sprawdzenie czy extension jest aktywny

5. **Utworzenie/naprawienie tabeli vectors**
   - Synchronizacja schema Prisma z bazą danych
   - Migracja lub `prisma db push`
   - Weryfikacja struktury tabeli

### ⚡ FAZA 2: Core Implementation (MEDIUM Priority)
**Cel: Działający RAG search**

6. **Implementacja basic embedding service (mock/OpenAI)**
   - Service do generowania embeddings
   - Mock service dla developmentu (hash-based)
   - Opcjonalnie: integracja z OpenAI API

7. **Seed danych - wektoryzacja contacts/companies/messages**
   - Script do wektoryzacji istniejących danych
   - Przetworzenie ~300 rekordów (contacts, companies, messages)
   - Zapisanie do tabeli vectors z metadata

8. **Test RAG search API z prawdziwymi danymi**
   - Test semantic search z prawdziwymi wektorami
   - Weryfikacja accuracy i relevance
   - Debug i optymalizacja queries

### 🎨 FAZA 3: Polish & Optimization (LOW Priority)
**Cel: Production-ready system**

9. **Frontend interface - RAG search page**
   - Sprawdzenie `/dashboard/rag-search/`
   - Integracja z działającym API
   - UI improvements i UX polish

10. **Optymalizacja - indeksy, cache, performance**
    - Indeksy na tabeli vectors
    - Redis cache dla częstych queries
    - Performance monitoring i metryki

11. **Dokumentacja RAG system**
    - Aktualizacja CLAUDE.md
    - Utworzenie RAG_SYSTEM_MANUAL.md
    - API documentation

## 🚀 Harmonogram Realizacji

### **Dzień 1 (2-3h): Infrastructure Day**
- Zadania 1-5 (FAZA 1)
- **Cel**: Działająca tabela vectors i podstawowe API

### **Dzień 2 (3-4h): Implementation Day**  
- Zadania 6-8 (FAZA 2)
- **Cel**: Działający RAG search z prawdziwymi danymi

### **Dzień 3 (2-3h): Polish Day**
- Zadania 9-11 (FAZA 3)  
- **Cel**: Production-ready RAG system

**Łączny czas: 7-10 godzin**

## 📊 Metryki Sukcesu

### **Po FAZA 1:**
- ✅ Tabela vectors istnieje i jest dostępna
- ✅ API zwraca prawidłowe response (nie error)
- ✅ pgvector extension działa

### **Po FAZA 2:**
- ✅ 200+ wektorów w bazie danych
- ✅ RAG search zwraca relevantne wyniki
- ✅ Response time < 200ms

### **Po FAZA 3:**
- ✅ Frontend RAG search działa
- ✅ Performance optimized
- ✅ Dokumentacja aktualna

## 🛠️ Kluczowe Pliki do Pracy

### **Backend:**
- `/packages/backend/prisma/schema.prisma`
- `/packages/backend/src/routes/testRagSearch.ts`
- `/packages/backend/src/routes/vectorSearch.ts`
- `/packages/backend/src/services/VectorService.ts`

### **Frontend:**
- `/packages/frontend/src/app/dashboard/rag-search/page.tsx`
- `/packages/frontend/src/lib/api/vectorSearch.ts`

### **Database:**
- PostgreSQL container: `crm-postgres-v1`
- Database: `crm_gtd_v1`
- Extension: `pgvector`

## 🎯 Następne Kroki

1. **START**: Zadanie #1 - Analiza bieżącej struktury RAG
2. **PRIORITY**: FAZA 1 (HIGH) → FAZA 2 (MEDIUM) → FAZA 3 (LOW)
3. **TRACKING**: Aktualizacja tego pliku po każdym ukończonym zadaniu

---

**Utworzono**: 2025-01-05  
**Status**: Plan gotowy do realizacji  
**Szacowany czas ukończenia**: 3 dni robocze