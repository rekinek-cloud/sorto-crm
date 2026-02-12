# FLOW ENGINE - TASK 4: Integracja RAG

## Cel
Wzbogacić analizę AI o kontekst organizacji poprzez RAG, aby AI znało kontakty, firmy, streamy i historię decyzji przed sugerowaniem akcji.

---

## Problem obecny

```
📧 Email od jan.kowalski@abcokna.pl
      │
      ▼
   🤖 AI analizuje BEZ KONTEKSTU
      │
      └── Nie wie że jan.kowalski = Jan Kowalski
      └── Nie wie że ABC Okna to istniejący klient  
      └── Nie wie o projekcie Budma 2026
      └── Nie wie że 10 poprzednich maili → ten stream
      │
      ▼
   Sugestia: "Może Klienci? (67%)" ← niska pewność
```

## Rozwiązanie z RAG

```
📧 Email od jan.kowalski@abcokna.pl
      │
      ▼
   🔍 RAG RETRIEVAL
      │
      ├── contacts: "jan.kowalski@abcokna.pl = Jan Kowalski, PM, ABC Okna"
      ├── companies: "ABC Okna - klient od 2023, branża: okna"
      ├── streams: "ABC Okna → Budma 2026 (aktywny, deadline: 15.02)"
      ├── history: "Ostatnie 5 maili od @abcokna.pl → ten stream"
      └── patterns: "@abcokna.pl → Klienci/ABC Okna (94% confidence)"
      │
      ▼
   🤖 AI analizuje Z KONTEKSTEM
      │
      └── Zna osobę, firmę, projekt
      └── Wie gdzie trafiały podobne elementy
      └── Ma wyuczone wzorce
      │
      ▼
   Sugestia: "ABC Okna → Budma 2026 (94%)" ← wysoka pewność
```

---

## Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                      FLOW ENGINE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📧 Nowy element w Źródle                                    │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. EXTRACT QUERY                                    │    │
│  │    • Email/domena nadawcy                           │    │
│  │    • Słowa kluczowe z tematu                        │    │
│  │    • Top 5 słów z treści                            │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 2. RAG RETRIEVAL (równolegle)                       │    │
│  │                                                     │    │
│  │    ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │
│  │    │ Contacts │ │Companies │ │ Streams  │          │    │
│  │    │ pgvector │ │ pgvector │ │ pgvector │          │    │
│  │    └────┬─────┘ └────┬─────┘ └────┬─────┘          │    │
│  │         │            │            │                 │    │
│  │    ┌──────────┐ ┌──────────┐                       │    │
│  │    │ History  │ │ Patterns │                       │    │
│  │    │   SQL    │ │   SQL    │                       │    │
│  │    └────┬─────┘ └────┬─────┘                       │    │
│  │         │            │                              │    │
│  │         └─────┬──────┘                              │    │
│  │               ▼                                     │    │
│  │         RAG Context                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 3. AI ANALYSIS (z kontekstem RAG)                   │    │
│  │                                                     │    │
│  │    Prompt:                                          │    │
│  │    "Mając KONTEKST ORGANIZACJI:                     │    │
│  │     {rag_context}                                   │    │
│  │                                                     │    │
│  │     Przeanalizuj element:                           │    │
│  │     {element_content}                               │    │
│  │                                                     │    │
│  │     Zasugeruj akcję i stream..."                    │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                      │
│       ▼                                                      │
│  💬 Sugestia z wysoką pewnością                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Wymagania funkcjonalne

### 1. Indeksowanie danych organizacji

#### A) Kontakty (contacts)

```typescript
// Co indeksować
interface ContactEmbedding {
  id: string;
  organizationId: string;
  
  // Tekst do embeddingu
  searchText: string;  // "Jan Kowalski jan.kowalski@abcokna.pl ABC Okna PM kierownik projektu"
  
  // Metadane (nie embeddowane, do filtrowania)
  email: string;
  companyId: string;
  role: string;
}

// Generowanie searchText
function buildContactSearchText(contact: Contact): string {
  return [
    contact.firstName,
    contact.lastName,
    contact.email,
    contact.company?.name,
    contact.position,
    contact.tags?.join(' '),
    contact.notes?.substring(0, 200)
  ].filter(Boolean).join(' ');
}
```

#### B) Firmy (companies)

```typescript
interface CompanyEmbedding {
  id: string;
  organizationId: string;
  
  searchText: string;  // "ABC Okna Sp. z o.o. okna producent Poznań klient od 2023"
  
  domain: string;      // "abcokna.pl"
  status: string;      // "CLIENT" | "PROSPECT" | "PARTNER"
}

function buildCompanySearchText(company: Company): string {
  return [
    company.name,
    company.industry,
    company.description,
    company.city,
    company.tags?.join(' '),
    `status: ${company.status}`
  ].filter(Boolean).join(' ');
}
```

#### C) Streamy (streams)

```typescript
interface StreamEmbedding {
  id: string;
  organizationId: string;
  
  searchText: string;  // "ABC Okna Budma 2026 targi stoisko klient projekt aktywny"
  
  path: string;        // "Klienci/ABC Okna/Budma 2026"
  status: string;      // "ACTIVE" | "FROZEN"
  parentId: string;
}

function buildStreamSearchText(stream: Stream): string {
  return [
    stream.name,
    stream.description,
    stream.parent?.name,
    stream.tags?.join(' '),
    stream.status === 'ACTIVE' ? 'aktywny' : 'zamrożony'
  ].filter(Boolean).join(' ');
}
```

### 2. RAG Query przy analizie

```typescript
interface FlowRAGContext {
  contacts: RAGResult[];      // Pasujące kontakty
  companies: RAGResult[];     // Pasujące firmy
  streams: RAGResult[];       // Możliwe streamy docelowe
  history: HistoryMatch[];    // Podobne elementy z przeszłości
  patterns: PatternMatch[];   // Wyuczone wzorce
}

async function buildRAGContext(
  organizationId: string,
  element: InboxItem
): Promise<FlowRAGContext> {
  
  // 1. Wyciągnij query z elementu
  const query = extractQueryFromElement(element);
  // np. "jan.kowalski@abcokna.pl Budma 2026 akceptacja projekt"
  
  // 2. Pobierz embedding query
  const queryEmbedding = await embedText(query);
  
  // 3. Równoległe wyszukiwanie
  const [contacts, companies, streams, history, patterns] = await Promise.all([
    
    // Kontakty - semantic search
    searchContacts(organizationId, queryEmbedding, { limit: 3 }),
    
    // Firmy - semantic + domain match
    searchCompanies(organizationId, queryEmbedding, {
      limit: 3,
      domainHint: extractDomain(element.content)  // "abcokna.pl"
    }),
    
    // Streamy - semantic search (tylko aktywne)
    searchStreams(organizationId, queryEmbedding, {
      limit: 5,
      status: 'ACTIVE'
    }),
    
    // Historia - exact match po nadawcy/domenie
    findSimilarHistory(organizationId, element, { limit: 5 }),
    
    // Wzorce - exact match (już zaimplementowane w TASK 2)
    checkLearnedPatterns(organizationId, element)
  ]);
  
  return { contacts, companies, streams, history, patterns };
}
```

### 3. Wyszukiwanie wektorowe

```typescript
// Kontakty
async function searchContacts(
  organizationId: string,
  queryEmbedding: number[],
  options: { limit: number }
): Promise<RAGResult[]> {
  
  const results = await prisma.$queryRaw`
    SELECT 
      c.id,
      c.first_name,
      c.last_name,
      c.email,
      c.position,
      comp.name as company_name,
      1 - (ce.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM contacts c
    JOIN contact_embeddings ce ON c.id = ce.contact_id
    LEFT JOIN companies comp ON c.company_id = comp.id
    WHERE c.organization_id = ${organizationId}
      AND 1 - (ce.embedding <=> ${queryEmbedding}::vector) > 0.7
    ORDER BY similarity DESC
    LIMIT ${options.limit}
  `;
  
  return results.map(r => ({
    id: r.id,
    type: 'CONTACT',
    name: `${r.first_name} ${r.last_name}`,
    description: `${r.email} - ${r.position} @ ${r.company_name}`,
    similarity: r.similarity
  }));
}

// Firmy (z domain hint)
async function searchCompanies(
  organizationId: string,
  queryEmbedding: number[],
  options: { limit: number; domainHint?: string }
): Promise<RAGResult[]> {
  
  // Najpierw sprawdź exact match po domenie
  if (options.domainHint) {
    const exactMatch = await prisma.companies.findFirst({
      where: {
        organizationId,
        OR: [
          { website: { contains: options.domainHint } },
          { email: { contains: options.domainHint } }
        ]
      }
    });
    
    if (exactMatch) {
      return [{
        id: exactMatch.id,
        type: 'COMPANY',
        name: exactMatch.name,
        description: `${exactMatch.industry} - ${exactMatch.status}`,
        similarity: 1.0,  // Exact match
        matchType: 'DOMAIN'
      }];
    }
  }
  
  // Fallback do semantic search
  const results = await prisma.$queryRaw`
    SELECT 
      c.id,
      c.name,
      c.industry,
      c.status,
      1 - (ce.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM companies c
    JOIN company_embeddings ce ON c.id = ce.company_id
    WHERE c.organization_id = ${organizationId}
      AND 1 - (ce.embedding <=> ${queryEmbedding}::vector) > 0.7
    ORDER BY similarity DESC
    LIMIT ${options.limit}
  `;
  
  return results.map(r => ({
    id: r.id,
    type: 'COMPANY',
    name: r.name,
    description: `${r.industry} - ${r.status}`,
    similarity: r.similarity
  }));
}

// Streamy
async function searchStreams(
  organizationId: string,
  queryEmbedding: number[],
  options: { limit: number; status?: string }
): Promise<RAGResult[]> {
  
  const statusFilter = options.status 
    ? `AND s.status = '${options.status}'`
    : '';
  
  const results = await prisma.$queryRaw`
    SELECT 
      s.id,
      s.name,
      s.description,
      p.name as parent_name,
      s.status,
      1 - (se.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM streams s
    JOIN stream_embeddings se ON s.id = se.stream_id
    LEFT JOIN streams p ON s.parent_id = p.id
    WHERE s.organization_id = ${organizationId}
      ${Prisma.raw(statusFilter)}
      AND 1 - (se.embedding <=> ${queryEmbedding}::vector) > 0.5
    ORDER BY similarity DESC
    LIMIT ${options.limit}
  `;
  
  return results.map(r => ({
    id: r.id,
    type: 'STREAM',
    name: r.name,
    path: r.parent_name ? `${r.parent_name} → ${r.name}` : r.name,
    description: r.description,
    similarity: r.similarity,
    status: r.status
  }));
}
```

### 4. Historia podobnych elementów

```typescript
async function findSimilarHistory(
  organizationId: string,
  element: InboxItem,
  options: { limit: number }
): Promise<HistoryMatch[]> {
  
  const sender = extractSender(element.content);
  const domain = extractDomain(element.content);
  
  // Szukaj po nadawcy lub domenie
  const history = await prisma.flow_processing_history.findMany({
    where: {
      organizationId,
      OR: [
        { senderEmail: sender },
        { senderDomain: domain }
      ],
      wasSuccessful: true  // Tylko udane przetworzenia
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit,
    include: {
      targetStream: true
    }
  });
  
  return history.map(h => ({
    elementType: h.elementType,
    action: h.executedAction,
    streamId: h.targetStreamId,
    streamName: h.targetStream?.name,
    date: h.createdAt,
    sender: h.senderEmail
  }));
}
```

### 5. Formatowanie kontekstu dla AI

```typescript
function formatRAGContextForPrompt(context: FlowRAGContext): string {
  const sections: string[] = [];
  
  // Kontakty
  if (context.contacts.length > 0) {
    sections.push(`ROZPOZNANE KONTAKTY:
${context.contacts.map(c => `• ${c.name} (${c.description})`).join('\n')}`);
  }
  
  // Firmy
  if (context.companies.length > 0) {
    sections.push(`ROZPOZNANE FIRMY:
${context.companies.map(c => `• ${c.name} - ${c.description}`).join('\n')}`);
  }
  
  // Dostępne streamy
  if (context.streams.length > 0) {
    sections.push(`DOSTĘPNE STRUMIENIE (od najbardziej pasującego):
${context.streams.map((s, i) => `${i+1}. ${s.path} ${s.status === 'FROZEN' ? '❄️' : ''}`).join('\n')}`);
  }
  
  // Historia
  if (context.history.length > 0) {
    sections.push(`HISTORIA PODOBNYCH ELEMENTÓW:
${context.history.map(h => `• ${h.sender} → ${h.streamName} (${h.action})`).join('\n')}`);
  }
  
  // Wzorce
  if (context.patterns.length > 0) {
    const best = context.patterns[0];
    sections.push(`WYUCZONY WZORZEC:
• ${best.pattern} → ${best.streamName} (${Math.round(best.confidence * 100)}% pewności)`);
  }
  
  return sections.join('\n\n');
}
```

### 6. Zmodyfikowany prompt analizy

```typescript
const SOURCE_ANALYZE_WITH_RAG = `
Jesteś asystentem Flow Engine w systemie SORTO CRM.
Analizujesz nowe elementy wpływające do Źródła i sugerujesz gdzie je skierować.

## KONTEKST ORGANIZACJI

{rag_context}

## ELEMENT DO ANALIZY

Typ: {element_type}
Treść:
---
{content}
---

## ZADANIE

Na podstawie KONTEKSTU ORGANIZACJI i treści elementu:

1. ROZPOZNAJ osoby i firmy (użyj rozpoznanych kontaktów jeśli pasują)
2. OKREŚL typ elementu (EMAIL, DOCUMENT_INVOICE, VOICE_NOTE, IDEA, OTHER)
3. ZASUGERUJ akcję (ZROB_TERAZ, ZAPLANUJ, DELEGUJ, REFERENCJA, USUN)
4. WYBIERZ stream docelowy (z listy DOSTĘPNE STRUMIENIE lub zaproponuj nowy)
5. WYCIĄGNIJ zadania, terminy, kwoty jeśli występują

WAŻNE:
- Jeśli jest WYUCZONY WZORZEC z wysoką pewnością (>85%), użyj go
- Jeśli jest HISTORIA podobnych elementów, uwzględnij gdzie trafiały
- Confidence powinien być wyższy gdy masz dopasowanie z kontekstu

## FORMAT ODPOWIEDZI

Odpowiedz TYLKO w JSON:
{
  "elementType": "EMAIL",
  "suggestedAction": "ZAPLANUJ",
  "suggestedStreams": [
    { "streamId": "uuid-lub-null", "streamName": "Nazwa", "confidence": 0.94, "reason": "Dlaczego" }
  ],
  "extractedEntities": {
    "people": [{ "name": "Jan Kowalski", "role": "PM", "company": "ABC Okna", "contactId": "uuid-lub-null" }],
    "companies": [{ "name": "ABC Okna", "companyId": "uuid-lub-null" }],
    "amounts": ["22 500 EUR"],
    "deadlines": ["koniec tygodnia"],
    "tasks": ["Wystawić fakturę zaliczkową 50%"]
  },
  "summary": "Krótkie podsumowanie",
  "confidence": 0.94,
  "confidenceReason": "Rozpoznany kontakt + dopasowany stream + wzorzec historyczny"
}
`;
```

---

## Wymagania techniczne

### Nowe tabele (migracja)

```prisma
// Embeddingi kontaktów
model contact_embeddings {
  id          String   @id @default(uuid())
  contactId   String   @unique
  contact     contacts @relation(fields: [contactId], references: [id], onDelete: Cascade)
  
  searchText  String   @db.Text
  embedding   Unsupported("vector(1536)")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([contactId])
}

// Embeddingi firm
model company_embeddings {
  id          String    @id @default(uuid())
  companyId   String    @unique
  company     companies @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  searchText  String    @db.Text
  embedding   Unsupported("vector(1536)")
  domain      String?   // Wyciągnięta domena do quick match
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([companyId])
  @@index([domain])
}

// Embeddingi streamów
model stream_embeddings {
  id          String   @id @default(uuid())
  streamId    String   @unique
  stream      streams  @relation(fields: [streamId], references: [id], onDelete: Cascade)
  
  searchText  String   @db.Text
  embedding   Unsupported("vector(1536)")
  path        String   // Pełna ścieżka: "Parent → Child → Grandchild"
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([streamId])
}

// Dodać pola do flow_processing_history
model flow_processing_history {
  // ... istniejące pola ...
  
  senderEmail   String?   // Do historii
  senderDomain  String?   // Do quick match
  wasSuccessful Boolean   @default(true)
}
```

### Serwis RAG dla Flow

```typescript
// packages/backend/src/services/ai/FlowRAGService.ts

export class FlowRAGService {
  
  // Główna metoda - buduje kontekst
  async buildContext(
    organizationId: string,
    element: InboxItem
  ): Promise<FlowRAGContext>;
  
  // Indeksowanie (wywoływane przy CRUD)
  async indexContact(contact: Contact): Promise<void>;
  async indexCompany(company: Company): Promise<void>;
  async indexStream(stream: Stream): Promise<void>;
  
  // Usuwanie z indeksu
  async removeContactIndex(contactId: string): Promise<void>;
  async removeCompanyIndex(companyId: string): Promise<void>;
  async removeStreamIndex(streamId: string): Promise<void>;
  
  // Batch reindeksacja
  async reindexOrganization(organizationId: string): Promise<void>;
}
```

### Integracja z FlowEngineService

```typescript
// W FlowEngineService.analyzeSourceItem()

async analyzeSourceItem(itemId: string): Promise<FlowAnalysisResult> {
  const item = await this.getItem(itemId);
  
  // 1. NOWE: Pobierz kontekst RAG
  const ragContext = await this.ragService.buildContext(
    item.organizationId,
    item
  );
  
  // 2. Formatuj kontekst dla promptu
  const contextString = formatRAGContextForPrompt(ragContext);
  
  // 3. Wywołaj AI z kontekstem
  const prompt = SOURCE_ANALYZE_WITH_RAG
    .replace('{rag_context}', contextString)
    .replace('{element_type}', item.elementType)
    .replace('{content}', item.content);
  
  const analysis = await this.aiService.analyze(prompt);
  
  // 4. Wzbogać wynik o ID z RAG (jeśli rozpoznano)
  analysis.suggestedStreams = this.enrichWithRAGIds(
    analysis.suggestedStreams,
    ragContext.streams
  );
  
  analysis.extractedEntities.people = this.enrichPeopleWithContactIds(
    analysis.extractedEntities.people,
    ragContext.contacts
  );
  
  return analysis;
}
```

### Hooki do indeksowania

```typescript
// W routach contacts, companies, streams

// Po utworzeniu/aktualizacji kontaktu
router.post('/contacts', async (req, res) => {
  const contact = await createContact(req.body);
  
  // Indeksuj dla RAG
  await flowRAGService.indexContact(contact);
  
  res.json(contact);
});

// Po usunięciu
router.delete('/contacts/:id', async (req, res) => {
  await deleteContact(req.params.id);
  
  // Usuń z indeksu
  await flowRAGService.removeContactIndex(req.params.id);
  
  res.json({ success: true });
});

// Analogicznie dla companies i streams
```

---

## Kolejność implementacji

```
1. Migracja bazy (nowe tabele embeddings)
         │
         ▼
2. FlowRAGService - metody indeksowania
         │
         ▼
3. Batch reindeksacja istniejących danych
         │
         ▼
4. FlowRAGService - metody wyszukiwania
         │
         ▼
5. Integracja z FlowEngineService.analyzeSourceItem()
         │
         ▼
6. Hooki w CRUD (contacts, companies, streams)
         │
         ▼
7. Testy
```

---

## Testy akceptacyjne

1. [ ] Nowy kontakt → automatycznie zaindeksowany
2. [ ] Usunięty kontakt → usunięty z indeksu
3. [ ] Email od znanego nadawcy → RAG zwraca kontakt i firmę
4. [ ] Email od nieznanego → RAG zwraca [] (puste)
5. [ ] Analiza z RAG → wyższa confidence niż bez
6. [ ] Rozpoznany kontakt → contactId w extractedEntities
7. [ ] Rozpoznana firma → companyId w extractedEntities
8. [ ] Pasujący stream → streamId w suggestedStreams
9. [ ] Historia podobnych → uwzględniona w sugestii
10. [ ] Batch reindeksacja → wszystkie dane zaindeksowane

---

## Metryki sukcesu

| Metryka | Przed RAG | Po RAG (cel) |
|---------|-----------|--------------|
| Średnia confidence | ~65% | >85% |
| Rozpoznane kontakty | 0% | >90% |
| Trafność streamu | ~60% | >80% |
| Czas analizy | ~2s | <3s |

---

## Uwagi

- Embeddingi: użyj tego samego modelu co w istniejącym RAG (text-embedding-v3)
- Próg similarity: 0.7 dla kontaktów/firm, 0.5 dla streamów
- Cache: rozważ cache embeddings query (LRU, 5 min TTL)
- Batch: przy dużych organizacjach indeksuj w tle (queue)
- Domain match ma priorytet nad semantic search dla firm
