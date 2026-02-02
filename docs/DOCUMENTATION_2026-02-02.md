# Sorto CRM - Dokumentacja Techniczna

**Data:** 2026-02-02
**Wersja:** 0.1.0
**Status:** Development (DEV Server)

---

## 1. Przegląd Systemu

Sorto CRM to kompleksowa platforma SaaS łącząca funkcjonalności CRM z metodologią GTD (Getting Things Done). System zapewnia zarządzanie kontaktami, projektami, zadaniami, dealami oraz integracje AI.

### URL Produkcyjne
- **Frontend:** https://crm.dev.sorto.ai/crm/pl
- **API:** https://crm.dev.sorto.ai/api/v1

---

## 2. Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                        Traefik                               │
│                   (Reverse Proxy + SSL)                      │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
         ┌────────▼────────┐     ┌────────▼────────┐
         │    Frontend     │     │     Backend     │
         │   (Next.js 14)  │     │   (Express.js)  │
         │   Port: 3008    │     │   Port: 3005    │
         └────────┬────────┘     └────────┬────────┘
                  │                       │
                  │              ┌────────▼────────┐
                  │              │   PostgreSQL    │
                  │              │  (+ pgvector)   │
                  │              └────────┬────────┘
                  │                       │
                  │              ┌────────▼────────┐
                  │              │     Redis       │
                  │              │   (Cache/Queue) │
                  └──────────────┴─────────────────┘
```

### Kontenery Docker

| Kontener | Obraz | Port | Status |
|----------|-------|------|--------|
| crm-backend | sorto-crm-backend | 3005:3001 | healthy |
| crm-frontend | sorto-crm-frontend | 3008:3000 | healthy |
| crm-postgres | pgvector/pgvector:pg14 | 5432 (internal) | healthy |
| crm-redis | redis:7-alpine | 6379 (internal) | healthy |

---

## 3. Stack Technologiczny

### Backend
| Technologia | Wersja/Opis |
|-------------|-------------|
| Node.js | Runtime |
| Express.js | Framework HTTP |
| Prisma | ORM |
| PostgreSQL | Baza danych |
| pgvector | Rozszerzenie dla wektorów AI |
| Redis | Cache i kolejki |
| JWT | Autentykacja |
| Zod | Walidacja |
| Winston | Logging |

**Główne zależności:**
- `@prisma/client` - ORM
- `openai`, `@google/generative-ai` - AI integrations
- `jsonwebtoken` - Auth
- `stripe` - Płatności
- `nodemailer`, `imap` - Email
- `ws` - WebSocket
- `redis` - Cache

### Frontend
| Technologia | Wersja/Opis |
|-------------|-------------|
| Next.js | 14.2.35 |
| React | UI Framework |
| Tailwind CSS | Styling |
| Headless UI | Komponenty |
| React Hook Form | Formularze |
| i18n | Wielojęzyczność (PL/EN) |

---

## 4. Baza Danych

### Statystyki
- **Tabele:** 149
- **Rekordy:** 549
- **Wypełnienie:** 100% (wszystkie tabele mają dane)

### Główne Tabele (według ilości rekordów)

| Tabela | Rekordy | Opis |
|--------|---------|------|
| refresh_tokens | 147 | Tokeny odświeżania sesji |
| vector_documents | 33 | Dokumenty wektorowe AI |
| habit_entries | 16 | Wpisy nawyków |
| search_index | 10 | Indeks wyszukiwania |
| tags | 10 | Tagi |
| ai_models | 8 | Modele AI |
| contexts | 8 | Konteksty GTD |
| streams | 7 | Strumienie GTD |
| contacts | 7 | Kontakty |
| activities | 7 | Aktywności |
| tasks | 6 | Zadania |

### Indeksy (zoptymalizowane)
Dodano 13 indeksów na głównych tabelach:
- `tasks`: status, priority, dueDate, assignedToId, projectId
- `contacts`: email, companyId, status
- `projects`: status, streamId
- `deals`: status, stageId, contactId
- `activities`: type, contactId

---

## 5. API Endpoints

### Liczba Endpointów
**94 pliki routes** obsługujących ~300+ endpointów

### Główne Grupy API

#### CRM
| Endpoint | Opis |
|----------|------|
| `/api/v1/contacts` | Zarządzanie kontaktami |
| `/api/v1/companies` | Zarządzanie firmami |
| `/api/v1/deals` | Zarządzanie dealami |
| `/api/v1/activities` | Aktywności i historia |
| `/api/v1/invoices` | Faktury |
| `/api/v1/offers` | Oferty |

#### GTD (Getting Things Done)
| Endpoint | Opis |
|----------|------|
| `/api/v1/tasks` | Zadania |
| `/api/v1/projects` | Projekty |
| `/api/v1/contexts` | Konteksty (@home, @work, etc.) |
| `/api/v1/streams` | Strumienie GTD |
| `/api/v1/gtd-inbox` | Skrzynka odbiorcza GTD |
| `/api/v1/next-actions` | Następne działania |
| `/api/v1/weekly-review` | Przegląd tygodniowy |

#### AI & Inteligencja
| Endpoint | Opis |
|----------|------|
| `/api/v1/admin/ai-config` | Konfiguracja AI |
| `/api/v1/ai/prompts` | Szablony promptów |
| `/api/v1/ai-rules` | Reguły automatyzacji AI |
| `/api/v1/ai-chat` | Chat AI (Qwen) |
| `/api/v1/ai-assistant` | Asystent AI |
| `/api/v1/ai-insights` | Wglądy AI dla Dashboard |
| `/api/v1/rag` | RAG (Retrieval Augmented Generation) |
| `/api/v1/vector-search` | Wyszukiwanie wektorowe |

#### Planowanie
| Endpoint | Opis |
|----------|------|
| `/api/v1/day-planner` | Planer dzienny |
| `/api/v1/smart-day-planner` | Inteligentny planer |
| `/api/v1/calendar` | Kalendarz |
| `/api/v1/goals` | Cele |
| `/api/v1/habits` | Nawyki |

#### Email & Komunikacja
| Endpoint | Opis |
|----------|------|
| `/api/v1/email-accounts` | Konta email |
| `/api/v1/modern-email` | Nowoczesna obsługa email |
| `/api/v1/smart-mailboxes` | Inteligentne skrzynki |
| `/api/v1/communications` | Komunikacja |

#### System
| Endpoint | Opis |
|----------|------|
| `/api/v1/users` | Użytkownicy |
| `/api/v1/billing` | Płatności (Stripe) |
| `/api/v1/dashboard` | Dashboard |
| `/api/v1/analytics` | Analityka |
| `/api/v1/search` | Wyszukiwanie globalne |

---

## 6. Integracje AI

### Providery AI
| Provider | Status | Modele |
|----------|--------|--------|
| OpenAI | ACTIVE | gpt-4o, gpt-4o-mini, o1 |
| Anthropic | ACTIVE | claude-sonnet-4, claude-opus-4, claude-3.5-haiku |
| Google | ACTIVE | gemini-2.0-flash-exp, gemini-1.5-pro |

### Modele AI (8 skonfigurowanych)
1. **gpt-4o** - OpenAI, główny model
2. **gpt-4o-mini** - OpenAI, szybki/tani
3. **o1** - OpenAI, reasoning
4. **claude-sonnet-4-20250514** - Anthropic
5. **claude-opus-4-20250514** - Anthropic
6. **claude-3-5-haiku-20241022** - Anthropic, szybki
7. **gemini-2.0-flash-exp** - Google
8. **gemini-1.5-pro** - Google

### Szablony Promptów (4)
1. Analiza deal
2. Sugestia odpowiedzi
3. Klasyfikacja GTD
4. Podsumowanie zadania

### Funkcje AI
- Wyszukiwanie wektorowe (pgvector)
- RAG (Retrieval Augmented Generation)
- Automatyczna klasyfikacja zadań
- Analiza sentymentu
- Generowanie podsumowań
- Asystent głosowy

---

## 7. Autentykacja

### JWT Configuration
- **Algorithm:** HS256
- **Access Token:** 15 min
- **Refresh Token:** 7 dni
- **Audience:** crm-gtd-app
- **Issuer:** crm-gtd-saas

### Role użytkowników
- `OWNER` - Właściciel organizacji
- `ADMIN` - Administrator
- `MANAGER` - Manager
- `USER` - Użytkownik
- `VIEWER` - Tylko odczyt

---

## 8. Konfiguracja

### Zmienne środowiskowe (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/crm_gtd_prod

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars_here

# Redis
REDIS_URL=redis://redis:6379

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Email
SMTP_HOST=...
IMAP_HOST=...

# Stripe
STRIPE_SECRET_KEY=sk_...
```

### Docker Compose
```yaml
services:
  backend:
    build: ./packages/backend
    ports:
      - "3005:3001"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./packages/frontend
    ports:
      - "3008:3000"

  postgres:
    image: pgvector/pgvector:pg14
    volumes:
      - /data/databases/sorto-crm/postgres:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - /data/databases/sorto-crm/redis:/data
```

---

## 9. Deployment

### Struktura katalogów
```
/home/dev/apps/sorto-crm/
├── packages/
│   ├── backend/         # Express.js API
│   │   ├── src/
│   │   │   ├── routes/  # 94 pliki route
│   │   │   ├── services/
│   │   │   ├── modules/
│   │   │   └── shared/
│   │   └── prisma/
│   │       └── schema.prisma
│   └── frontend/        # Next.js 14
│       ├── app/
│       ├── components/
│       └── i18n/
├── docker-compose.yml
├── .env -> .env.production
└── docs/
```

### Komendy Deploy
```bash
# Pull i rebuild
cd /home/dev/apps/sorto-crm
git pull
docker compose build
docker compose up -d

# Migracja bazy (z backupem!)
docker compose exec postgres pg_dump -U postgres crm_gtd_prod > backup.sql
npx prisma migrate deploy
```

---

## 10. Monitoring

### Health Endpoints
- Backend: `http://localhost:3005/health`
- Response: `{"status":"healthy","timestamp":"...","environment":"production","version":"0.1.0"}`

### Logi
```bash
# Backend logs
docker logs crm-backend --tail 100

# Error logs
docker logs crm-backend 2>&1 | grep -i error

# Wszystkie kontenery
docker compose logs -f
```

### Metryki bazy
```sql
-- Rozmiar bazy
SELECT pg_size_pretty(pg_database_size('crm_gtd_prod'));

-- Statystyki tabel
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
```

---

## 11. Znane problemy i naprawy

### Naprawione (2026-02-02)
1. **Błędna nazwa modelu Prisma**
   - Problem: `prisma.focus_modes` zamiast `prisma.focusMode`
   - Pliki: `dayPlanner.ts`, `smartDayPlanner.ts`
   - Fix: Zmiana na `prisma.focusMode`

2. **Błędna nazwa relacji**
   - Problem: `include: { timeBlocks }`
   - Fix: `include: { energy_time_blocks }`

3. **Enum ProjectStatus**
   - Problem: `'ACTIVE'` nie istnieje
   - Fix: Użycie `'PLANNING'`

---

## 12. Kontakt i wsparcie

- **Repozytorium:** GitHub (rekinek-cloud/sorto-crm)
- **Dev Server:** crm.dev.sorto.ai
- **Dokumentacja:** /home/dev/apps/sorto-crm/docs/

---

*Dokument wygenerowany automatycznie: 2026-02-02 14:20 UTC*
