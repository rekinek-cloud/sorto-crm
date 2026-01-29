# Sorto CRM - Developer Guide

> **Wersja:** 0.1.0
> **Metodologia:** SORTO STREAMS
> **Data aktualizacji:** 2026-01-29

---

## Spis treści

1. [Przegląd projektu](#przegląd-projektu)
2. [Architektura](#architektura)
3. [Stack technologiczny](#stack-technologiczny)
4. [Struktura projektu](#struktura-projektu)
5. [Baza danych](#baza-danych)
6. [API Endpoints](#api-endpoints)
7. [Frontend](#frontend)
8. [MCP Server](#mcp-server)
9. [Docker & Deployment](#docker--deployment)
10. [Rozwój lokalny](#rozwój-lokalny)

---

## Przegląd projektu

Sorto CRM to platforma SaaS łącząca funkcjonalności CRM z metodologią GTD (Getting Things Done) oraz SMART goals. Aplikacja używa autorskiej metodologii **SORTO STREAMS** do zarządzania przepływem pracy.

### Główne funkcjonalności

- **CRM:** Firmy, Kontakty, Deale, Pipeline sprzedażowy
- **GTD/STREAMS:** Źródło (Inbox), Strumienie, Zadania, Projekty
- **Cele:** Precyzyjne cele (RZUT), Horyzonty GTD
- **Komunikacja:** Smart Mailboxes, Integracje email
- **AI:** Asystent AI, RAG Search, Flow Engine
- **Infrastructure Dashboard:** Monitoring serwerów i kontenerów

---

## Architektura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Next.js 14 + React 18                        │
│                    (crm.dev.sorto.ai)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TRAEFIK                                  │
│                    (Reverse Proxy + SSL)                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                    Express.js + TypeScript                      │
│                    (API: /api/v1/*)                             │
├─────────────────────────────────────────────────────────────────┤
│  Services:                                                       │
│  • Auth & JWT                 • AI/RAG Processing               │
│  • Tasks & Projects           • Email Integration               │
│  • CRM (Companies/Contacts)   • MCP Server                      │
│  • Streams & GTD              • Infrastructure Monitor          │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────┐    ┌────────────────────────┐
│      PostgreSQL        │    │         Redis          │
│   (pgvector enabled)   │    │     (Cache/Queue)      │
│   crm-postgres:5432    │    │    crm-redis:6379      │
└────────────────────────┘    └────────────────────────┘
```

---

## Stack technologiczny

### Backend
| Technologia | Wersja | Zastosowanie |
|-------------|--------|--------------|
| Node.js | ≥18.17.0 | Runtime |
| TypeScript | ^5.1.6 | Język |
| Express.js | ^4.18 | Framework HTTP |
| Prisma | ^5.x | ORM |
| PostgreSQL | 14 + pgvector | Baza danych |
| Redis | 7 | Cache, Sessions |
| Winston | ^3.x | Logging |
| JWT | - | Autentykacja |

### Frontend
| Technologia | Wersja | Zastosowanie |
|-------------|--------|--------------|
| Next.js | ^14.0.4 | Framework React |
| React | ^18.2.0 | UI Library |
| TypeScript | ^5.x | Język |
| TailwindCSS | ^3.x | Styling |
| Framer Motion | ^10.x | Animacje |
| Chart.js | ^4.5 | Wykresy |
| next-intl | ^4.6 | i18n (PL/EN) |
| Heroicons | ^2.0 | Ikony |
| Phosphor React | ^1.4 | Ikony |

### DevOps
| Technologia | Zastosowanie |
|-------------|--------------|
| Docker | Konteneryzacja |
| Docker Compose | Orkiestracja lokalna |
| Traefik | Reverse proxy + SSL |
| Turbo | Monorepo build |

---

## Struktura projektu

```
sorto-crm/
├── packages/
│   ├── backend/                 # API Server
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Główny schemat DB
│   │   │   ├── migrations/      # Migracje DB
│   │   │   └── seed*.ts         # Seedy danych
│   │   ├── src/
│   │   │   ├── app.ts           # Entry point Express
│   │   │   ├── config/          # Konfiguracja (DB, logger, env)
│   │   │   ├── modules/         # Moduły domenowe
│   │   │   │   ├── auth/        # Autentykacja
│   │   │   │   ├── organizations/
│   │   │   │   └── enrichment/  # AI Enrichment
│   │   │   ├── routes/          # API Routes (~80 plików)
│   │   │   ├── services/        # Business logic
│   │   │   ├── mcp-server/      # MCP Protocol Server
│   │   │   ├── openapi/         # OpenAPI schemas
│   │   │   └── shared/          # Middleware, utils
│   │   └── Dockerfile
│   │
│   ├── frontend/                # Next.js App
│   │   ├── src/
│   │   │   ├── app/             # App Router (Next.js 14)
│   │   │   │   └── [locale]/    # i18n routing
│   │   │   │       └── dashboard/
│   │   │   ├── components/      # React Components
│   │   │   ├── lib/             # Utils, API clients
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── config/          # Navigation, settings
│   │   │   └── types/           # TypeScript types
│   │   └── Dockerfile
│   │
│   └── android-twa/             # Android TWA wrapper
│
├── docker-compose.yml           # Docker orchestration
├── package.json                 # Root package (workspaces)
├── turbo.json                   # Turbo config
└── DEVELOPER_GUIDE.md           # Ten plik
```

---

## Baza danych

### Połączenie
```
PostgreSQL 14 + pgvector
Host: crm-postgres (Docker) / localhost:5432
Database: crm_gtd_prod
User: postgres
```

### Główne modele (Prisma)

#### Core
| Model | Opis |
|-------|------|
| `Organization` | Tenant (multi-tenancy) |
| `User` | Użytkownicy systemu |
| `RefreshToken` | JWT refresh tokens |

#### CRM
| Model | Opis |
|-------|------|
| `Company` | Firmy |
| `Contact` | Kontakty (osoby) |
| `Deal` | Transakcje/Oportunity |
| `Lead` | Leady sprzedażowe |
| `Product` | Produkty |
| `Service` | Usługi |
| `Offer` | Oferty |
| `Invoice` | Faktury |

#### GTD / STREAMS
| Model | Opis |
|-------|------|
| `Stream` | Strumienie pracy |
| `Task` | Zadania |
| `Project` | Projekty |
| `InboxItem` | Elementy w Źródle |
| `Context` | Konteksty GTD |
| `Tag` | Tagi |
| `GTDHorizon` | Horyzonty GTD |
| `GTDBucket` | Buckety GTD |

#### AI & Knowledge
| Model | Opis |
|-------|------|
| `ai_providers` | Konfiguracja AI (OpenAI, Anthropic) |
| `ai_prompt_templates` | Szablony promptów |
| `ai_knowledge_bases` | Bazy wiedzy |
| `vector_documents` | Dokumenty RAG |
| `flow_conversations` | Konwersacje Flow Engine |

#### Communication
| Model | Opis |
|-------|------|
| `email_accounts` | Konta email |
| `Message` | Wiadomości |
| `smart_mailboxes` | Smart Mailboxes |
| `CommunicationChannel` | Kanały komunikacji |

#### MCP
| Model | Opis |
|-------|------|
| `McpApiKey` | Klucze API dla MCP |
| `McpUsageLog` | Logi użycia MCP |

### Migracje
```bash
cd packages/backend

# Generuj migrację
npx prisma migrate dev --name nazwa_migracji

# Aplikuj migracje
npx prisma migrate deploy

# Reset bazy
npx prisma migrate reset
```

---

## API Endpoints

**Base URL:** `https://crm.dev.sorto.ai/api/v1`

### Autentykacja
| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/auth/register` | Rejestracja |
| POST | `/auth/login` | Logowanie |
| POST | `/auth/refresh` | Odśwież token |
| GET | `/auth/me` | Obecny użytkownik |

### CRM
| Method | Endpoint | Opis |
|--------|----------|------|
| GET/POST | `/companies` | Firmy |
| GET/POST | `/contacts` | Kontakty |
| GET/POST | `/deals` | Deale |
| GET | `/pipeline` | Pipeline stats |

### Tasks & Projects
| Method | Endpoint | Opis |
|--------|----------|------|
| GET/POST | `/tasks` | Zadania |
| GET/POST | `/projects` | Projekty |
| GET/POST | `/streams` | Strumienie |
| GET | `/source` | Źródło (Inbox) |

### AI
| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/ai/chat` | Chat z AI |
| POST | `/ai-assistant/*` | AI Human-in-the-Loop |
| GET | `/ai-insights/*` | AI Insights |
| POST | `/flow/process` | Flow Engine |

### MCP Server
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/mcp/` | Info o serwerze |
| POST | `/mcp/tools/list` | Lista narzędzi |
| POST | `/mcp/tools/call` | Wywołaj narzędzie |
| GET | `/mcp/openapi.json` | OpenAPI schema |

### MCP Actions (REST dla ChatGPT)
| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/mcp/actions/search` | Wyszukiwanie |
| POST | `/mcp/actions/details` | Szczegóły obiektu |
| POST | `/mcp/actions/notes` | Dodaj notatkę |
| POST | `/mcp/actions/tasks` | Lista zadań |
| GET | `/mcp/actions/pipeline-stats` | Statystyki pipeline |

### Infrastructure (Admin)
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/infrastructure/overview` | Podsumowanie |
| GET | `/infrastructure/server` | Metryki serwera |
| GET | `/infrastructure/containers` | Lista kontenerów |
| POST | `/infrastructure/containers/:name/restart` | Restart |
| GET | `/infrastructure/containers/:name/logs` | Logi |
| GET | `/infrastructure/health` | Health check apps |
| GET | `/infrastructure/databases` | Status baz danych |

---

## Frontend

### Nawigacja (STREAMS)

```typescript
// config/streamsNavigation.ts
const navigation = [
  { name: 'Pulpit', href: '/dashboard', icon: House },
  { name: 'Źródło', href: '/dashboard/source', icon: CircleDashed },
  { name: 'Strumienie', href: '/dashboard/streams', icon: Waves },
  { name: 'Zadania', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Projekty', href: '/dashboard/projects', icon: Folder },
  { name: 'Kalendarz', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Cele', href: '/dashboard/goals', icon: Target },
  // CRM
  { name: 'Firmy', href: '/dashboard/companies', icon: Buildings },
  { name: 'Kontakty', href: '/dashboard/contacts', icon: Users },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: Funnel },
  { name: 'Transakcje', href: '/dashboard/deals', icon: Handshake },
  // Admin
  { name: 'Infrastruktura', href: '/dashboard/infrastructure', icon: HardDrives },
  { name: 'Klucze API (MCP)', href: '/dashboard/admin/mcp-keys', icon: Robot },
];
```

### Routing (Next.js App Router)
```
src/app/[locale]/dashboard/
├── page.tsx                    # Dashboard główny
├── companies/page.tsx          # Lista firm
├── companies/[id]/page.tsx     # Szczegóły firmy
├── contacts/page.tsx           # Lista kontaktów
├── tasks/page.tsx              # Lista zadań
├── streams/page.tsx            # Strumienie
├── infrastructure/page.tsx     # Infrastructure Dashboard
├── admin/mcp-keys/page.tsx     # Zarządzanie kluczami MCP
└── ...
```

### API Client
```typescript
// lib/api/client.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const apiClient = axios.create({
  baseURL: '/api/v1',
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## MCP Server

MCP (Model Context Protocol) umożliwia integrację z:
- **Claude Desktop**
- **Cursor IDE**
- **ChatGPT** (przez Actions REST API)

### Konfiguracja dla Claude/Cursor
```json
{
  "mcpServers": {
    "sorto-crm": {
      "url": "https://crm.dev.sorto.ai/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer <API_KEY>"
      }
    }
  }
}
```

### Dostępne narzędzia MCP
| Tool | Opis |
|------|------|
| `search` | Wyszukiwanie w CRM (natural language) |
| `get_details` | Szczegóły obiektu |
| `create_note` | Dodaj notatkę |
| `list_tasks` | Lista zadań |
| `get_pipeline_stats` | Statystyki pipeline |

### ChatGPT Actions
OpenAPI Schema: `https://crm.dev.sorto.ai/api/v1/mcp/openapi.json`

---

## Docker & Deployment

### Kontenery
| Kontener | Port | Opis |
|----------|------|------|
| `crm-frontend` | 3008:3000 | Next.js frontend |
| `crm-backend` | 3005:3001 | Express API |
| `crm-postgres` | - | PostgreSQL + pgvector |
| `crm-redis` | - | Redis cache |

### Komendy Docker
```bash
# Start wszystkich serwisów
docker compose up -d

# Rebuild i restart
docker compose up -d --build

# Logi
docker compose logs -f backend
docker compose logs -f frontend

# Status
docker compose ps

# Restart pojedynczego serwisu
docker compose restart backend
```

### Zmienne środowiskowe
```env
# Database
DATABASE_URL=postgresql://postgres:PASSWORD@postgres:5432/crm_gtd_prod
POSTGRES_PASSWORD=StrongPassword123!

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32

# AI
OPENAI_API_KEY=sk-...

# URLs
NEXT_PUBLIC_API_URL=https://crm.dev.sorto.ai/api
NEXT_PUBLIC_APP_URL=https://crm.dev.sorto.ai
```

---

## Rozwój lokalny

### Wymagania
- Node.js ≥18.17.0
- npm ≥9.0.0
- Docker & Docker Compose
- PostgreSQL 14 (lub Docker)

### Setup
```bash
# Klonuj repo
git clone <repo-url>
cd sorto-crm

# Instaluj zależności
npm install

# Uruchom bazy danych
docker compose up -d postgres redis

# Migracje
cd packages/backend
npx prisma migrate deploy
npx prisma db seed

# Start dev
npm run dev
```

### Porty lokalne
| Serwis | Port |
|--------|------|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Kontakt

- **Repo:** /home/dev/apps/sorto-crm
- **Produkcja:** https://crm.dev.sorto.ai
- **API Docs:** https://crm.dev.sorto.ai/api/v1

---

*Ostatnia aktualizacja: 2026-01-29*
