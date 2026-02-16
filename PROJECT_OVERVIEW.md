# SORTO CRM - Technical Overview

> Use this file as context when starting a new Claude session for this project.
> Last updated: 2026-02-16

## What is it

Enterprise CRM + GTD (Getting Things Done) SaaS platform. Combines classic CRM (contacts, companies, deals, pipeline) with full David Allen GTD methodology (inbox, next actions, waiting for, someday/maybe, contexts, areas) plus AI-powered automation (flow engine, rules engine, smart day planner, email analysis).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo |
| **Backend** | Node.js, Express 4.18, TypeScript 5.1 |
| **Frontend** | Next.js 14, React 18, TypeScript 5.3, Tailwind CSS 3.3 |
| **Database** | PostgreSQL 14 + pgvector (181 Prisma models, 5,700 lines schema) |
| **ORM** | Prisma 6.19 |
| **Cache** | Redis 7 |
| **State** | Zustand + React Query + React Context |
| **Forms** | React Hook Form + Zod |
| **AI** | OpenAI, Google Gemini, Qwen (multi-provider) |
| **Deploy** | Docker Compose, Traefik (SSL) |
| **i18n** | next-intl (Polish primary) |

## Project Structure

```
/home/dev/apps/sorto-crm/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.ts              # Express app, all route mounts
│   │   │   ├── routes/             # 60+ route files
│   │   │   ├── services/           # 42 core + 12 AI services
│   │   │   ├── config/             # database.ts, logger.ts
│   │   │   ├── shared/middleware/   # auth.ts, error handling
│   │   │   ├── modules/            # auth, billing, organizations
│   │   │   └── types/              # streams.ts, rules.ts
│   │   ├── prisma/schema.prisma    # 181 models
│   │   └── package.json
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/[locale]/dashboard/  # 189 page.tsx files
│   │   │   ├── components/              # 50+ directories, 300+ files
│   │   │   ├── lib/api/                 # 96 API client files (axios)
│   │   │   ├── lib/auth/context.tsx     # Auth context
│   │   │   ├── hooks/                   # Custom React hooks
│   │   │   └── types/                   # TypeScript types
│   │   ├── next.config.js          # basePath: '/crm'
│   │   └── package.json
│   └── android-twa/                # Android wrapper
├── docker-compose.yml              # Production (Traefik)
├── docker-compose.v1.yml           # Development (V1)
└── prisma/schema.prisma
```

## Backend API Routes (app.ts)

All routes at `/api/v1/`. Key groups:

### Core CRM
- `/auth` - JWT auth (login, register, refresh)
- `/users`, `/team`, `/organizations` - user/org management
- `/contacts`, `/companies`, `/deals`, `/leads` - CRM entities
- `/tasks`, `/projects` - work management
- `/products`, `/services`, `/orders`, `/invoices`, `/offers` - business

### GTD / Streams System
- `/workflow` - Core GTD workflow (inbox, next-actions, waiting-for, someday-maybe, contexts)
- `/stream-management` - GTD stream roles, config, hierarchy, routing, rules
- `/streams` - Basic stream CRUD
- `/source` - Source inbox (capture point)
- `/streams-map` - Map/visual views of streams
- `/stream-hierarchy`, `/stream-access` - hierarchy & permissions
- `/horizons` - Goal horizons/levels
- `/goals`, `/precise-goals` - Goals system
- `/contexts`, `/areas` - GTD contexts & areas of responsibility

### Planning & Productivity
- `/day-planner` - Smart day planner (AI, energy tracking, focus modes, time blocks)
- `/recurring-tasks`, `/delegated`, `/habits` - task patterns
- `/weekly-review` - Weekly review system

### Communication
- `/communication`, `/mailboxes`, `/smart-mailboxes` - messaging hub
- `/email-accounts`, `/email-analysis`, `/email-pipeline` - email system
- `/auto-replies`, `/email-domain-rules` - email automation

### AI & Automation
- `/ai`, `/ai-config`, `/ai-rules`, `/ai-prompts` - AI system
- `/ai-agents`, `/ai-agent-tasks`, `/ai-messages` - autonomous agents
- `/ai-assistant`, `/ai-chat`, `/ai-insights`, `/ai-sync` - AI interfaces
- `/flow`, `/flow/conversation` - Flow Engine (AI processing pipeline)
- `/unified-rules` - Universal rule engine (9 types, 6 triggers)
- `/gemini` - Google Gemini integration

### Knowledge & Search
- `/knowledge` - Knowledge base (docs, wiki)
- `/rag`, `/vector-search`, `/real-vector-search` - RAG semantic search
- `/search` - Universal search

### Voice
- `/voice` - TTS synthesis (Coqui/Mock)
- `/voice-response` - Voice assistant

### Analytics
- `/dashboard`, `/analysis`, `/pipeline-analytics` - reporting
- `/graph` - Entity relationship graph

### Backward-compat aliases (deprecated)
- `/gtd` -> `/workflow`
- `/gtd-streams` -> `/stream-management`
- `/gtdinbox` -> `/source`
- `/gtdmapviews` -> `/streams-map`
- `/gtdhorizons` -> `/horizons`

## Key Backend Services

| Service | File | Purpose |
|---------|------|---------|
| StreamService | `services/StreamService.ts` | Stream CRUD & management |
| EnhancedStreamHierarchyManager | `services/EnhancedStreamHierarchyManager.ts` | Stream tree hierarchy (CTE queries) |
| StreamsConfigManager | `services/StreamsConfigManager.ts` | Per-role GTD configuration |
| StreamsProcessingRuleEngine | `services/StreamsProcessingRuleEngine.ts` | Processing rules for streams |
| ResourceRouter | `services/ResourceRouter.ts` | Auto-route tasks/emails to streams |
| streamWorkflowService | `services/streamWorkflowService.ts` | Inbox processing workflow |
| FlowEngineService | `services/ai/FlowEngineService.ts` | AI dialogue processing |
| RAGService | `services/ai/RAGService.ts` | Retrieval-augmented generation |
| UniversalRuleEngine | `services/ai/UniversalRuleEngine.ts` | 9-type rule engine |
| EmailSyncService | `services/EmailSyncService.ts` | IMAP email sync |
| CacheService | `services/CacheService.ts` | Redis caching layer |

## Frontend Architecture

### API Client (`lib/api/client.ts`)
- Axios-based, baseURL = `/api/v1` (or `/crm/api/v1`)
- Auto-attaches JWT from `access_token` cookie
- Auto-refreshes token on 401 via `refresh_token` cookie
- 96 specialized API files (one per feature domain)

### State Management
- **Auth**: React Context (`lib/auth/context.tsx`)
- **Server data**: React Query (caching, invalidation)
- **Client state**: Zustand stores
- **Forms**: React Hook Form + Zod validation

### Key Frontend Sections (189 pages)
- `/dashboard` - Main dashboard with widgets
- `/dashboard/gtd/*` - Full GTD system (inbox, next-actions, waiting-for, etc.)
- `/dashboard/gtd-streams/*` - Stream management
- `/dashboard/smart-day-planner` - AI day planner
- `/dashboard/smart-mailboxes` - Email hub with GTD integration
- `/dashboard/flow/*` - Flow engine (conversation, autopilot)
- `/dashboard/ai-*` - AI features (chat, agents, rules, insights)
- `/dashboard/contacts|companies|deals/*` - CRM core
- `/dashboard/projects/*` - Project management (roadmap, burndown, WBS)
- `/dashboard/knowledge/*` - Knowledge base & wiki
- `/dashboard/settings/*` - Configuration
- `/dashboard/reviews/*` - Weekly/monthly/quarterly reviews

### Component Organization (50+ directories)
Major: `ui/` (41), `views/` (28), `gtd/` (23), `crm/` (18), `streams/` (15), `ai/` (13), `communication/` (9), `voice/` (8)

## Database (Prisma Schema)

181 models. Key ones:

**Core**: Organization, User, Contact, Company, Deal, Lead, Task, Project
**GTD**: Stream (with streamRole, gtdConfig), InboxItem, SomedayMaybe, WaitingFor, DelegatedTask, Context, AreaOfResponsibility, Habit
**Communication**: Message, CommunicationChannel, EmailAnalysis, EmailRule, Meeting
**AI**: ai_providers, ai_models, ai_rules, ai_executions, ai_knowledge_bases, ai_prompt_templates
**Planning**: scheduled_tasks, day_templates, energy_patterns, performance_metrics, focus_modes, time_blocks
**Knowledge**: Document, Folder, SearchIndex, vectors
**Business**: Product, Service, Order, Invoice, Offer

Stream roles: INBOX, NEXT_ACTIONS, WAITING_FOR, SOMEDAY_MAYBE, PROJECTS, CONTEXTS, AREAS, REFERENCE

## Docker Setup

**Production** (`docker-compose.yml`):
- `crm-backend` (port 3005:3001) - Express API
- `crm-frontend` (port 3008:3000) - Next.js
- `crm-postgres` - PostgreSQL 14 + pgvector
- `crm-redis` - Redis 7
- Traefik reverse proxy with SSL (crm.dev.sorto.ai)

**Development V1** (`docker-compose.v1.yml`):
- Ports: frontend 9025, backend 3001, postgres 5434, redis 6381
- DB: `crm_gtd_v1`, user: `user`, password: `password`
- URL: `http://91.99.50.80/crm/`

## Auth Flow
1. Login -> POST `/auth/login` -> returns `access_token` + `refresh_token` (JWT)
2. Tokens stored in cookies
3. Every API call: axios interceptor adds `Authorization: Bearer <token>`
4. On 401: auto-refresh via `/auth/refresh` endpoint
5. User object on request: `{ id, email, role, organizationId, firstName, lastName }`

## Key Patterns & Conventions

- **Multi-tenant**: Every query filtered by `organizationId`
- **Auth middleware**: `authenticateToken` (imported as `requireAuth`) on all protected routes
- **Request typing**: `AuthenticatedRequest` extends Express Request with `user` property
- **Error handling**: try/catch in every route handler, `console.error` + 500 response
- **Prisma queries**: Direct prisma client usage in routes (no repository pattern)
- **Response format**: Most routes return raw data; some use `{ success: true, data: {...} }` wrapper
- **File naming**: Routes = kebab-case (`day-planner.ts`), Services = PascalCase (`StreamService.ts`)

## Migration Status (GTD -> STREAMS)

Branch: `migration/gtd-to-streams`

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Schema & Types | Done | Prisma enum GTDRole->StreamRole, types/gtd.ts->types/streams.ts |
| 2. Services | Done | Consolidated GTD services into Streams* naming |
| 3. API Routes | Done | Renamed gtd.ts->workflow.ts, gtdStreams.ts->streamManagement.ts, deleted 5 dead files (~8,400 lines) |
| 4. Frontend | Done | Fixed broken API paths, updated all deprecated paths, renamed 4 API files + 5 components, updated 19+ imports |
| 5. Tests/Scripts | Done | Renamed gtdStreams.test.ts->streamManagement.test.ts, updated e2e tests, fixed seed API paths |
| 6. Documentation | Done | Updated API paths and migration status in all developer docs |

All old API paths preserved as backward-compat aliases.
