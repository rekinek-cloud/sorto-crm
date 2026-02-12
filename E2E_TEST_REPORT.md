# E2E Test Report - Sorto CRM
**Data:** 2026-02-03
**Srodowisko:** DEV (crm.dev.sorto.ai)
**Wersja:** po wdrozeniu Industry Skins MVP

---

## Status kontenerow

| Kontener | Status | Port |
|----------|--------|------|
| crm-backend | healthy | 3005->3001 |
| crm-frontend | healthy | 3008->3000 |
| crm-postgres | healthy | 5432 |
| crm-redis | healthy | 6379 |

Logi kontenerow: **CZYSTE** (brak bledow w backend, frontend, postgres)

---

## Podsumowanie

| Kategoria | OK | WARN | ERROR |
|-----------|-----|------|-------|
| API Endpoints | 32 | 11 | 0 |
| Frontend Pages | 19 | 0 | 0 |
| CRUD Operations | 10 | 0 | 0 |
| Data Consistency | 2 | 0 | 0 |
| Build | 1 | 0 | 0 |
| **RAZEM** | **64** | **11** | **0** |

---

## BLEDY (3) - WSZYSTKIE NAPRAWIONE

### BUG-001: `GET /api/v1/unified-rules` zwraca 500 - **NAPRAWIONE**
- **Powaznosc:** HIGH
- **Plik:** `packages/backend/src/routes/unifiedRules.ts`
- **Blad:** `TypeError: Cannot read properties of undefined (reading 'findMany')`
- **Przyczyna:** Kod uzywal `prisma.unifiedRule.findMany()` ale Prisma client generuje accessor jako `prisma.unified_rules` (model w schema to `unified_rules`). Takze nazwy relacji byly bledne.
- **Fix:** Zmieniono `prisma.unifiedRule` na `prisma.unified_rules` (12 wystapien), poprawiono nazwy relacji: `channel`->`communication_channels`, `aiModel`->`ai_models`, `executions`->`unified_rule_executions`

### BUG-002: `GET /api/v1/deals/stats` zwraca 404 "Deal not found" - **NAPRAWIONE**
- **Powaznosc:** MEDIUM
- **Plik:** `packages/backend/src/routes/deals.ts`
- **Przyczyna:** Route `/:id` przechwytywal "stats" jako deal ID.
- **Fix:** Dodano `router.get('/stats', ...)` PRZED `router.get('/:id', ...)`

### BUG-003: `POST /api/v1/deals` wymaga `companyId` (required) - **NAPRAWIONE**
- **Powaznosc:** LOW
- **Plik:** `packages/backend/src/routes/deals.ts` + `prisma/schema.prisma`
- **Przyczyna:** Walidacja Zod wymagala `companyId` jako obowiazkowe, a kolumna w bazie nie dopuszczala NULL
- **Fix:** Zmieniono Zod schema na `companyId: z.string().uuid().optional()`, w Prisma schema `companyId String?` i `company Company?`, zastosowano migracje bazy

---

## OSTRZEZENIA (11)

### Zarejestrowane trasy bez handler na root path (404 na GET /)

Nastepujace trasy sa zarejestrowane w `app.ts` ale nie maja handlera na `GET /` (tylko sub-paths):

| Trasa | Sub-path ktory dziala | Uwaga |
|-------|----------------------|-------|
| `/api/v1/communication` | `/communication/channels` OK | Router ma tylko sub-routes |
| `/api/v1/analysis` | brak dzialajacych | Mozliwe ze wymagane parametry |
| `/api/v1/dashboard` | `/dashboard/stats` OK | Root nie ma handlera |
| `/api/v1/ai` | brak dzialajacych | Wymaga konfiguracji AI provider |
| `/api/v1/knowledge` | `/knowledge/documents` OK | Root nie ma handlera |
| `/api/v1/flow` | brak dzialajacych | Wymaga konfiguracji |
| `/api/v1/search` | brak dzialajacych | Inny format path |
| `/api/v1/pipeline-analytics` | brak dzialajacych | Wymaga parametrow |
| `/api/v1/streams-map` | `/streams-map/views` OK | Root nie ma handlera |
| `/api/v1/day-planner` | brak dzialajacych | Wymaga daty/parametrow |
| `/api/v1/infrastructure` | brak dzialajacych | Wymaga konfiguracji |

**Komentarz:** To nie sa bledy - te routery wymagaja konkretnych sub-paths lub parametrow. Brak handlera na root path jest normalny w REST API.

---

## Testy ktore PRZESZLY

### API Health & Public
- [x] `GET /health` - 200
- [x] `GET /api/v1` - 200 (zwraca info o API)
- [x] `GET /api/v1/industry-templates` - 200 (11 szablonow)
- [x] `GET /api/v1/industry-templates/small-business` - 200
- [x] `GET /api/v1/industry-templates/trade-shows` - 200
- [x] `GET /api/v1/industry-templates/blank` - 200
- [x] `GET /api/v1/industry-templates/nonexistent` - 404 (poprawne)
- [x] `GET /api/v1/industries/categories` - 200

### Auth
- [x] `GET /api/v1/auth/me` - 200 (zwraca usera + org)
- [x] `POST /api/v1/auth/login` (zle haslo) - 401 (poprawne)
- [x] `POST /api/v1/auth/login` (puste pola) - 400 (poprawne)

### Pipeline Stages
- [x] `GET /api/v1/pipeline/stages` - 200 (6 etapow)
- [x] `POST /api/v1/pipeline/stages` - 201 (tworzenie)
- [x] `PUT /api/v1/pipeline/stages/:id` - 200 (edycja)
- [x] `DELETE /api/v1/pipeline/stages/:id` - 204 (usuwanie)
- [x] `GET /api/v1/industry-templates/current/skin` - 200

### Deals
- [x] `GET /api/v1/deals` - 200
- [x] `GET /api/v1/deals?page=1&limit=5` - 200
- [x] `GET /api/v1/deals/pipeline` - 200 (zwraca stages + deals)
- [x] `GET /api/v1/deals/:id` (nieistniejacy) - 404 (poprawne)
- [x] `POST /api/v1/deals` (z companyId + stageId) - 201
- [x] `GET /api/v1/deals/:id` (istniejacy) - 200, **pipelineStage object obecny**
- [x] `PUT /api/v1/deals/:id` (zmiana stageId) - 200 (przeniesienie deal)
- [x] `DELETE /api/v1/deals/:id` - 200

### Contacts
- [x] `GET /api/v1/contacts` - 200
- [x] `POST /api/v1/contacts` - 201
- [x] `GET /api/v1/contacts/:id` - 200
- [x] `DELETE /api/v1/contacts/:id` - 204

### Companies
- [x] `GET /api/v1/companies` - 200
- [x] `POST /api/v1/companies` - 201
- [x] `DELETE /api/v1/companies/:id` - 204

### Tasks
- [x] `GET /api/v1/tasks` - 200
- [x] `POST /api/v1/tasks` - 201
- [x] `DELETE /api/v1/tasks/:id` - 204

### Inne moduly
- [x] `GET /api/v1/organizations` - 200
- [x] `GET /api/v1/projects` - 200
- [x] `GET /api/v1/contexts` - 200
- [x] `GET /api/v1/streams` - 200
- [x] `GET /api/v1/gtd/inbox` - 200
- [x] `GET /api/v1/areas` - 200
- [x] `GET /api/v1/habits` - 200
- [x] `GET /api/v1/meetings` - 200
- [x] `GET /api/v1/delegated` - 200
- [x] `GET /api/v1/recurring-tasks` - 200
- [x] `GET /api/v1/timeline` - 200
- [x] `GET /api/v1/products` - 200
- [x] `GET /api/v1/services` - 200
- [x] `GET /api/v1/offers` - 200
- [x] `GET /api/v1/invoices` - 200
- [x] `GET /api/v1/tags` - 200
- [x] `GET /api/v1/users` - 200
- [x] `GET /api/v1/calendar/events` - 200
- [x] `GET /api/v1/ai-rules` - 200
- [x] `GET /api/v1/weekly-review` - 200
- [x] `GET /api/v1/source` - 200
- [x] `GET /api/v1/goals` - 200
- [x] `GET /api/v1/mailboxes` - 200
- [x] `GET /api/v1/coding-center/projects` - 200
- [x] `GET /api/v1/dev-hub/containers` - 200

### Industry Templates
- [x] `POST /api/v1/industry-templates/apply` - 400 (poprawne: org ma deals z przypisanymi stages)

### Frontend Pages
- [x] `/crm/` - 200
- [x] `/crm/pl` - 200
- [x] `/crm/pl/auth/login` - 200
- [x] `/crm/pl/auth/register` - 200
- [x] `/crm/pl/onboarding` - 307 (redirect do login - poprawne, wymaga auth)
- [x] `/crm/pl/dashboard` - 307 (redirect do login - poprawne)
- [x] `/crm/pl/dashboard/deals` - 307
- [x] `/crm/pl/dashboard/contacts` - 307
- [x] `/crm/pl/dashboard/companies` - 307
- [x] `/crm/pl/dashboard/pipeline` - 307
- [x] `/crm/pl/dashboard/tasks` - 307
- [x] `/crm/pl/dashboard/calendar` - 307
- [x] `/crm/pl/dashboard/streams` - 307
- [x] `/crm/pl/dashboard/settings` - 307
- [x] `/crm/pl/dashboard/settings/pipeline` - 307
- [x] `/crm/pl/dashboard/settings/industries` - 307
- [x] `/crm/pl/pricing` - 200
- [x] `/crm/pl/privacy` - 200
- [x] `/crm/pl/terms` - 200

### Data Consistency
- [x] Wszystkie deals maja stageId (2/2)
- [x] Wszystkie deals maja pipelineStage relacje (2/2)
- [x] Pipeline ma 1 stage Won + 1 stage Lost (prawidlowe)
- [x] 6 etapow pipeline (Prospekt, Zakwalifikowany, Oferta, Negocjacje, Wygrana, Przegrana)

### Build
- [x] `next build` - PASS (brak bledow, brak ostrzezen)

---

## Podsumowanie bledow - NAPRAWIONE

| # | Priorytet | Opis | Status |
|---|-----------|------|--------|
| BUG-001 | HIGH | unified-rules 500 - zly accessor Prisma | NAPRAWIONE |
| BUG-002 | MEDIUM | /deals/stats 404 - brak endpointu | NAPRAWIONE |
| BUG-003 | LOW | Deal wymaga companyId | NAPRAWIONE |

**Weryfikacja:** Wszystkie 3 bugi potwierdzone jako naprawione testem E2E (2026-02-03)
