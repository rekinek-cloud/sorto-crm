# Diagnoza projektu CRM Streams
Data: 2025-12-08

## 1. BAZA DANYCH (Prisma)

### Model Stream (`schema.prisma:225`)
```
- id: String (UUID)
- name: String
- description: String?
- color: String (default "#3B82F6")
- icon: String?
- status: StreamStatus (ACTIVE, ARCHIVED, TEMPLATE, FLOWING, FROZEN)
- streamType: StreamType (default CUSTOM)
- pattern: VARCHAR(50) - project/continuous/reference/client/pipeline/custom
- horizonLevel: Int (0-5 dla poziomów GTD)
- settings: Json
- gtdConfig: Json
- templateOrigin: String?
- organizationId: String
- createdById: String
- createdAt: DateTime
- updatedAt: DateTime
```

### Relacje Stream:
- `tasks` - zadania przypisane do strumienia
- `projects` - projekty w strumieniu
- `inboxItems` - elementy inbox
- `messages` - wiadomości
- `next_actions` - następne działania
- `precise_goals` - cele precyzyjne (RZUT)
- `recurring_tasks` - zadania cykliczne
- `processing_rules` - reguły przetwarzania
- `timeline` - oś czasu
- `stream_relations` (parent/child) - hierarchia dopływów
- `stream_permissions` - uprawnienia
- `stream_access_logs` - logi dostępu
- `streamChannels` - połączenie z kanałami komunikacji

### Model StreamChannel (`schema.prisma:1390`)
```
- id: String (UUID)
- streamId: String
- channelId: String
- autoCreateTasks: Boolean (default false)
- defaultContext: String?
- defaultPriority: Priority (default MEDIUM)
- createdAt: DateTime
```

### Enumy:
```typescript
enum StreamStatus {
  ACTIVE
  ARCHIVED
  TEMPLATE
  FLOWING
  FROZEN
}
```

### Migracja (`streams_migration.sql`):
- Dodanie statusów FLOWING/FROZEN
- Dodanie kolumny `pattern`
- Rename smartScore -> streamScore
- Tabela `precise_goals` (cele RZUT)

---

## 2. ROUTING BACKEND

| Endpoint | Plik | Funkcje |
|----------|------|---------|
| `GET /api/v1/streams` | `streams.ts` | Lista strumieni z paginacją |
| `POST /api/v1/streams` | `streams.ts` | Tworzenie strumienia |
| `GET /api/v1/streams/stats` | `streams.ts` | Statystyki |
| `GET /api/v1/streams/frozen` | `streams.ts` | Zamrożone strumienie |
| `GET /api/v1/streams/:id` | `streams.ts` | Szczegóły strumienia |
| `PUT /api/v1/streams/:id` | `streams.ts` | Aktualizacja |
| `DELETE /api/v1/streams/:id` | `streams.ts` | Usuwanie |
| `POST /api/v1/streams/:id/archive` | `streams.ts` | Archiwizacja/odmrażanie |
| `POST /api/v1/streams/:id/duplicate` | `streams.ts` | Duplikowanie |
| `POST /api/v1/streams/ai/suggest` | `streams.ts` | AI sugestie strumienia |
| `POST /api/v1/streams/:id/access-check` | `streamAccess.ts` | Sprawdzanie uprawnień |
| `GET /api/v1/streams/:id/accessible-streams` | `streamAccess.ts` | Dostępne strumienie |
| `GET /api/v1/streams/user-accessible` | `streamAccess.ts` | Strumienie użytkownika |
| `GET /api/v1/streams/:id/audit-log` | `streamAccess.ts` | Logi audytu |
| `POST /api/v1/streams/:id/relations` | `streamHierarchy.ts` | Tworzenie relacji |
| `GET /api/v1/streams/:id/hierarchy` | `streamHierarchy.ts` | Pobieranie hierarchii |
| `GET /api/v1/streams/:id/related` | `streamHierarchy.ts` | Powiązane strumienie |
| `PUT /api/v1/stream-relations/:id` | `streamHierarchy.ts` | Aktualizacja relacji |
| `DELETE /api/v1/stream-relations/:id` | `streamHierarchy.ts` | Usuwanie relacji |
| `GET /api/v1/streams/hierarchy-stats` | `streamHierarchy.ts` | Statystyki hierarchii |
| `POST /api/v1/streams/:id/validate-cycle` | `streamHierarchy.ts` | Walidacja cykli |
| `GET /api/v1/gtd-map/views` | `streamsMap.ts` | Typy widoków bucket |
| `GET /api/v1/gtd-map/views/:viewType` | `streamsMap.ts` | Dane widoku bucket |
| `GET /api/v1/gtd-map/views/:viewType/3d` | `streamsMap.ts` | Widok 3D |

### Bucket Views (streamsMap.ts):
1. **horizon** - Mapa wysokości (poziomy GTD 0-5)
2. **urgency** - Mapa ruchu (pilność/deadlines)
3. **business** - Mapa biznesowa (firmy/projekty)
4. **energy** - Mapa energii (poziom wysiłku)
5. **stream** - Mapa infrastruktury (workflow GTD)

---

## 3. FRONTEND

### Strony (Next.js App Router):
- `/dashboard/streams/` - lista strumieni
- `/dashboard/streams/[id]` - szczegóły strumienia
- `/dashboard/gtd-streams/` - zarządzanie GTD streams
- `/dashboard/gtd-streams/scrum/` - widok scrum
- `/dashboard/streams-map/` - mapa wizualna

### Komponenty (`src/components/streams/`):
- `GTDStreamManager.tsx` - główny manager strumieni
- `GTDStreamCard.tsx` - karta strumienia
- `GTDStreamForm.tsx` - formularz strumienia
- `StreamHierarchyModal.tsx` - modal hierarchii
- `StreamHierarchyTree.tsx` - drzewo hierarchii
- `CreateStreamRelationModal.tsx` - tworzenie relacji
- `StreamPatternBadge.tsx` - badge wzorca
- `StreamStatusBadge.tsx` - badge statusu

### Komponenty GTD (`src/components/gtd/`):
- `StreamItem.tsx`
- `StreamsList.tsx`
- `StreamForm.tsx`

### API lib (`src/lib/api/`):
- `streams.ts` - podstawowe operacje CRUD
- `streamHierarchy.ts` - hierarchia i relacje
- `streamsMap.ts` - widoki bucket/map
- `gtdStreams.ts` - funkcje GTD

### Typy (`src/types/streams.ts`):
- `Stream`, `StreamStatus`, `StreamPattern`
- `Task`, `Project`, `Tag` (ex Context)
- `PreciseGoal` (cel RZUT)
- `SourceItem` (ex GTD Inbox)
- Request/Response types
- Filter types
- Component Props

---

## 4. STAN FUNKCJI

| Funkcja | Status | Uwagi |
|---------|--------|-------|
| Lista strumieni | ✅ Działa | GET /api/v1/streams |
| Tworzenie strumienia | ✅ Działa | POST /api/v1/streams |
| Edycja strumienia | ✅ Działa | PUT /api/v1/streams/:id |
| Usuwanie strumienia | ✅ Działa | DELETE (tylko puste) |
| Statystyki | ✅ Działa | GET /api/v1/streams/stats |
| Archiwizacja/Zamrażanie | ✅ Działa | POST /archive |
| Duplikowanie | ✅ Działa | POST /duplicate |
| AI Sugestie | ⚠️ Częściowo | Wymaga OpenAI API key |
| Hierarchia (dopływy) | ✅ Zaimplementowane | streamHierarchy.ts |
| Relacje między strumieniami | ✅ Zaimplementowane | CRUD relacji |
| Kontrola uprawnień | ✅ Zaimplementowane | streamAccess.ts |
| Logi audytu | ✅ Zaimplementowane | audit-log endpoint |
| Bucket Views (5 typów) | ✅ Zaimplementowane | streamsMap.ts |
| Widok 3D | ✅ Zaimplementowane | /views/:type/3d |
| Inbox/Źródło | ✅ Zaimplementowane | W streams.ts |
| Cele precyzyjne (RZUT) | ⚠️ Model gotowy | Brak dedykowanego API |

---

## 5. PROBLEMY NAPRAWIONE

### Problem: Backend nie startował
**Błąd:** `tsx must be loaded with --import instead of --loader`

**Przyczyna:** Niezgodność tsx z Node.js v18

**Rozwiązanie:**
1. Dodano `ts-node` i `tsconfig-paths` do devDependencies
2. Zmieniono CMD w Dockerfile na `npx ts-node --transpile-only src/app.ts`

### Pozostałe warningi (nie krytyczne):
- RLS (Row Level Security) - błąd typów UUID vs text w raw SQL
- Fakturownia configuration missing - brak konfiguracji integracji

---

## 6. KONFIGURACJA

### Docker Compose (v1):
- `crm-frontend-v1` - port 9025
- `crm-backend-v1` - port 3001
- `crm-postgres-v1` - port 5434
- `crm-redis-v1` - port 6381

### Zmienne środowiskowe:
- `DATABASE_URL=postgresql://user:password@postgres-v1:5432/crm_gtd_v1`
- `REDIS_URL=redis://redis-v1:6379`
- `JWT_SECRET` - klucz JWT
- `PORT=3001`

---

## 7. DO ZROBIENIA

1. [ ] Naprawić RLS (Row Level Security) - cast UUID
2. [ ] Dodać dedykowane API dla celów precyzyjnych (RZUT)
3. [ ] Skonfigurować OpenAI API dla AI sugestii
4. [ ] Uruchomić frontend (crm-frontend-v1)
5. [ ] Przetestować wszystkie endpointy Streams
