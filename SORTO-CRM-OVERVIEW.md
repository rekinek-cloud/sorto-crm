# Sorto-CRM - Przegląd Systemu

**Data aktualizacji:** 2025-10-25
**Wersja:** 2.1

---

## 1. Czym jest Sorto-CRM?

**Sorto-CRM** to kompleksowa platforma SaaS łącząca:
- **CRM** (Customer Relationship Management) - zarządzanie klientami, dealami, kontaktami
- **GTD** (Getting Things Done) - metodologia produktywności Davida Allena
- **SMART Goals** - zarządzanie celami i projektami
- **AI Automation** - inteligentna automatyzacja procesów biznesowych
- **RAG Search** - semantyczne wyszukiwanie w dokumentach firmowych

### Dla kogo?

- 🏢 Małe i średnie firmy (SMB)
- 👥 Zespoły sprzedażowe
- 📊 Kierownicy projektów
- 💼 Freelancerzy i konsultanci
- 🚀 Startupy z wieloma zespołami

---

## 2. Architektura Systemu

### Główne komponenty:

```
┌──────────────────────────────────────────────────────────────┐
│  SORTO-CRM (Główna Aplikacja)                                │
│  Lokalizacja: /opt/crm-gtd-smart/                            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  FRONTEND (Next.js 14 + React + TypeScript)           │  │
│  │  Port: 9025 (dev) / 3003 (prod via Nginx)             │  │
│  │                                                         │  │
│  │  - Dashboard (GTD Streams, Smart Day Planner)         │  │
│  │  - CRM (Companies, Contacts, Deals Pipeline)          │  │
│  │  - Smart Mailboxes (AI-filtered email)                │  │
│  │  - Knowledge Base (Wiki, Documents)                   │  │
│  │  - AI Rules Manager                                   │  │
│  │  - Analytics & Reports                                │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                                │
│                              ↓                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  BACKEND (Express.js + TypeScript)                     │  │
│  │  Port: 9027 (API)                                      │  │
│  │                                                         │  │
│  │  - Authentication (JWT + refresh tokens)              │  │
│  │  - Multi-tenant SaaS (Row Level Security)             │  │
│  │  - REST API (/api/v1/*)                               │  │
│  │  - Business Logic (GTD, CRM, AI Rules)                │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ↓                               ↓
┌───────────────────────────┐   ┌───────────────────────────────┐
│  BAZY DANYCH              │   │  RAG SERVICE (Mikrousługa)    │
│                           │   │  Lokalizacja: /opt/rag-service│
│  - PostgreSQL (CRM data)  │   │  Port: 8000                   │
│  - Redis (cache, queue)   │   │                               │
│  - ClickHouse (analytics) │   │  - FastAPI + Python           │
└───────────────────────────┘   │  - OpenAI Function Calling    │
                                │  - Qdrant (Vector DB)         │
                                │  - Celery (background sync)   │
                                │  - 79,732 wektorów            │
                                └───────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  NGINX (Reverse Proxy)                                       │
│  - /crm/* → Frontend (localhost:9025)                        │
│  - /crm/api/* → Backend (localhost:9027)                     │
│  - /rag/* → RAG Service (localhost:8000)                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Kluczowe Funkcjonalności

### 🎯 GTD System (Getting Things Done)

**8 ról GTD:**
- 📥 **INBOX** - przechwytywanie wszystkiego (11 źródeł: email, web, voice, etc.)
- ⚡ **NEXT_ACTIONS** - zadania do natychmiastowego wykonania
- 📁 **PROJECTS** - wieloetapowe projekty (cel + akcje)
- ⏳ **WAITING_FOR** - delegowane/oczekujące na innych
- 💡 **SOMEDAY_MAYBE** - pomysły na przyszłość
- 🏷️ **CONTEXTS** - konteksty wykonania (@computer, @calls, @office, @home)
- 🎯 **AREAS** - obszary odpowiedzialności (praca, dom, zdrowie)
- 📚 **REFERENCE** - materiały referencyjne

**Streams Hierarchy:**
- Nieograniczona głębokość zagnieżdżenia (parent/child)
- Automatyczne przenoszenie zadań między streams
- GTD Processing Flow: INBOX → DO/DEFER/DELEGATE/DELETE

---

### 📊 Smart Day Planner

**AI planowanie dnia z tracking energii:**

- **Energy Levels:**
  - 🔴 HIGH - głębokie skupienie, trudne zadania
  - 🟡 MEDIUM - standardowa praca
  - 🟢 LOW - rutynowe, administracyjne
  - 🟣 CREATIVE - kreatywna praca
  - ⚫ ADMINISTRATIVE - papierologia

- **Focus Modes:**
  - Deep Work (2h+ bez przerw)
  - Quick Tasks (<30min)
  - Creative Flow (brainstorming)
  - Admin Focus (email, dokumenty)

- **ML Patterns:**
  - System uczy się wzorców wydajności użytkownika
  - Sugeruje optymalne godziny dla różnych typów zadań
  - Performance analytics

---

### 👥 CRM Core

**Zarządzanie relacjami z klientami:**

- **Companies** (13,397 zaindeksowanych)
  - Firma: nazwa, website, branża, wielkość
  - Timeline: historia wszystkich interakcji
  - Relations: kontakty, deale, aktywności

- **Contacts** (15,322 zaindeksowanych)
  - Osoba: imię, nazwisko, pozycja, email, telefon
  - Powiązania: firma, deale, zadania
  - Communication history

- **Deals Pipeline**
  - Kanban board (drag & drop)
  - Stages: PROSPECT → QUALIFICATION → PROPOSAL → NEGOTIATION → CLOSED_WON/LOST
  - Probability scoring (AI)
  - Forecasting & analytics

- **Leads** (109 zaindeksowanych)
  - Potencjalni klienci
  - Lead scoring
  - Auto-routing do sales team

---

### 📧 Smart Mailboxes

**AI-filtered email management:**

- **9 typów filtrów:**
  - Sender (od kogo)
  - Subject (temat)
  - Keywords (słowa kluczowe)
  - Priority (priorytet)
  - Attachments (załączniki)
  - Date range (zakres dat)
  - Size (rozmiar)
  - Label (etykiety)
  - Custom rules (własne reguły)

- **Funkcje:**
  - 🔊 Voice TTS (czytanie wiadomości na głos)
  - ↩️ Quick Reply
  - ➡️ Forward
  - 📥 GTD Quick Actions (DO → Task, DEFER → Someday, DELETE)
  - Drag & Drop organization

---

### 🤖 AI System & Automation

**Universal Rules Manager:**

- **9 typów reguł:**
  1. Task Creation (automatyczne tworzenie zadań)
  2. Email Routing (routing emaili do właściwych osób)
  3. Deal Scoring (scoring dealów AI)
  4. Priority Assignment (przypisywanie priorytetów)
  5. Smart Categorization (kategoryzacja AI)
  6. Auto-tagging (automatyczne tagowanie)
  7. Notification Rules (reguły powiadomień)
  8. Data Enrichment (wzbogacanie danych)
  9. Custom Actions (własne akcje)

- **6 typów triggerów:**
  - Manual (ręcznie)
  - Schedule (harmonogram - cron)
  - Event (zdarzenia - webhook)
  - Condition (warunki - IF/THEN)
  - Webhook (zewnętrzne API)
  - Email Received (nowy email)

- **AI Providers:**
  - OpenAI (GPT-4, GPT-3.5)
  - Claude (Anthropic)
  - Configurable per rule

---

### 🔍 RAG Service (Mikrousługa)

**AI-native Semantic Search:**

Szczegóły: `/opt/rag-service/DEVELOPER.md`

**Kluczowe cechy:**
- ✅ **AI-Native** - OpenAI Function Calling (nie reguły)
- ✅ **79,732 wektorów** zaindeksowanych (2025-10-25)
- ✅ **7 typów dokumentów:**
  - company (13,397 firm)
  - contact (15,322 kontaktów)
  - task (~50,000 zadań)
  - message (~1,000 emaili)
  - lead (109 leadów)
  - activity (0 - kod gotowy)
  - document (0 - kod gotowy)
- ✅ **Vector Search** - Qdrant + OpenAI embeddings (3072 wymiary)
- ✅ **Automatyczna synchronizacja** - Celery Beat (co godzinę)
- ✅ **Multi-tenant RLS** - izolacja danych

**Przykłady użycia:**
```
User: "ile mamy firm?"
RAG:  "Mamy 13,397 firm w systemie."

User: "ile mamy transakcji?"
RAG:  "Ten typ danych (transakcja) nie jest jeszcze zaindeksowany w systemie RAG.
       Dostępne typy to: firmy, kontakty, zadania, wiadomości, aktywności,
       dokumenty i leady."

User: "znajdź informacje o firmie TechCorp"
RAG:  [zwraca szczegóły firmy z sources]
```

**UI:** Sparkle icon ✨ w lewym górnym rogu → otwiera chat modal

---

### 📚 Knowledge Base

**Zarządzanie wiedzą firmową:**

- **Documents** (10 typów)
  - PDF, Word, Excel, PowerPoint
  - Markdown, Text
  - Images, Videos
  - Links, Notes

- **Wiki Pages** (8 kategorii)
  - Processes (procedury)
  - Guidelines (wytyczne)
  - FAQs (często zadawane pytania)
  - Tutorials (tutoriale)
  - Best Practices
  - Templates (szablony)
  - Archive (archiwum)
  - General (ogólne)

- **RAG Search Integration**
  - Semantyczne wyszukiwanie w dokumentach
  - Full-text search (fallback)
  - Auto-indexing nowych dokumentów

---

## 4. Stack Technologiczny

### Backend (Główna aplikacja)

```
Runtime:        Node.js v18.17.0+
Framework:      Express.js + TypeScript 5.1.6
ORM:            Prisma (PostgreSQL client)
API:            REST (JSON)
Validation:     Zod schemas
Auth:           JWT (jsonwebtoken + bcrypt)
Logging:        Winston
Security:       Helmet.js, CORS, rate limiting (Redis)
Monitoring:     Sentry
```

### Frontend

```
Framework:      Next.js 14 (App Router)
Language:       TypeScript 5.1.6
Styling:        Tailwind CSS
UI:             Custom components + shadcn/ui
State:          React Context + hooks
Icons:          Phosphor React / Heroicons
Build:          Turbo (monorepo)
```

### RAG Service (Mikrousługa)

```
Framework:      FastAPI (Python 3.11+)
AI:             OpenAI (GPT-4 Turbo, text-embedding-3-large)
Vector DB:      Qdrant (COSINE similarity)
Background:     Celery + Celery Beat
Cache:          Redis
ORM:            asyncpg (PostgreSQL)
```

### Bazy Danych

```
Primary DB:     PostgreSQL 14+ (port 5434)
  - 85+ tabel
  - Row Level Security (RLS)
  - Multi-tenant architecture

Cache:          Redis 7+ (port 6381)
  - Session storage
  - Queue (Celery broker)
  - Rate limiting

Analytics:      ClickHouse (HTTP 8124, TCP 9002)
  - Time-series analytics
  - Performance metrics
  - User patterns (ML)

Vector DB:      Qdrant (port 6333)
  - 79,732 vectors (3072 dimensions)
  - RAG search
```

### Infrastructure

```
Web Server:     Nginx (reverse proxy)
Process Mgr:    PM2 (cluster mode)
Containers:     Docker + Docker Compose
Deployment:     VPS (91.99.50.80)
```

---

## 5. Multi-Tenant Architecture

### Row Level Security (RLS)

**Wszystkie tabele mają `organizationId`:**

```sql
-- Przykład: Companies
SELECT * FROM companies WHERE "organizationId" = $current_user_org_id;

-- Automatyczna izolacja danych
Organization A: widzi tylko swoje dane
Organization B: widzi tylko swoje dane
```

### Subscription Plans

| Plan | Cena/mies | Limity |
|------|-----------|--------|
| **STARTER** | $29 | 5 users, 1000 contacts, 100 deals |
| **PROFESSIONAL** | $79 | 20 users, 10000 contacts, unlimited deals |
| **ENTERPRISE** | $199 | Unlimited users, unlimited data, SLA |

### Roles & Permissions

| Role | Uprawnienia |
|------|-------------|
| **OWNER** | Full access (wszystko) |
| **ADMIN** | Admin + manage users + settings |
| **MANAGER** | View stats, manage team, create projects |
| **MEMBER** | Basic access (own tasks, assigned projects) |

---

## 6. Porty i URL

### Development (Localhost)

```
Frontend:           http://localhost:9025
Backend API:        http://localhost:9027/api/v1/
RAG Service:        http://localhost:8000
Health Check:       http://localhost:9027/health

PostgreSQL:         localhost:5434
Redis:              localhost:6381
ClickHouse HTTP:    localhost:8124
ClickHouse TCP:     localhost:9002
Qdrant:             localhost:6333
```

### Production (VPS: 91.99.50.80)

```
Frontend:           http://91.99.50.80/crm/
Backend API:        http://91.99.50.80/crm/api/v1/
RAG Service:        http://91.99.50.80/rag/api/v1/

Nginx Proxy:
  /crm/*        → localhost:9025 (frontend)
  /crm/api/*    → localhost:9027/api/ (backend)
  /rag/*        → localhost:8000/ (RAG service)
```

---

## 7. Kluczowe Liczby (Stan: 2025-10-25)

### Dane

- **85+ tabel** w PostgreSQL
- **79,732 wektorów** w RAG (Qdrant)
- **13,397 firm** zaindeksowanych
- **15,322 kontaktów** zaindeksowanych
- **~50,000 zadań**
- **109 leadów**

### GTD

- **8 ról GTD** (Inbox → Reference)
- **11 źródeł Inbox** (email, web, voice, manual, API, etc.)
- **6 poziomów GTD Horizons** (Ground → Purpose)

### AI & Automation

- **9 typów reguł AI**
- **6 typów triggerów**
- **2 AI providers** (OpenAI, Claude)

### Knowledge Base

- **10 typów dokumentów**
- **8 kategorii Wiki**

---

## 8. Roadmap

### ✅ Phase 0 (MVP) - COMPLETED (Months 0-4)
- Multi-tenant SaaS architecture
- Authentication & Authorization
- GTD Streams System
- CRM Core (Companies, Contacts, Deals)
- Smart Mailboxes
- AI Rules Manager
- Knowledge Base + Wiki
- Smart Day Planner

### 🔄 Phase 1 (Current) - IN PROGRESS (Months 5-8)
- RAG Service (AI-native search) ✅ DONE
- Advanced task dependencies
- Weekly review automation
- Stream templates marketplace
- Recurring tasks engine

### 📅 Phase 2 - PLANNED (Months 9-12)
- SMART goal scoring (AI effectiveness)
- Mobile app (React Native)
- Advanced analytics dashboard
- Offline support (PWA)
- Real-time collaboration

### 📅 Phase 3 - PLANNED (Months 13-18)
- Advanced integrations (Slack, Zapier, Salesforce)
- Video conferencing
- Advanced reporting
- Custom workflows builder

---

## 9. Integracje Zewnętrzne

### ✅ Zaimplementowane

- **Email:** SMTP (Gmail, inne)
- **AI:** OpenAI (GPT-4, embeddings), Claude
- **Payment:** Stripe (subscriptions)
- **Storage:** AWS S3 (optional), Local
- **Monitoring:** Sentry (error tracking)

### 📅 Planowane

- **Calendar:** Google Calendar, Outlook, Apple Calendar
- **Communication:** Slack, Teams, Discord
- **Automation:** Zapier, Make, n8n
- **CRM Sync:** HubSpot, Salesforce, Pipedrive
- **Voice:** Google Assistant, Alexa

---

## 10. Demo Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| OWNER | owner@demo.com | Password123! | Full access |
| ADMIN | admin@demo.com | Password123! | Admin + manage users |
| MANAGER | manager@demo.com | Password123! | View stats, manage team |
| MEMBER | member@demo.com | Password123! | Basic access |

---

## 11. Start Development

### Uruchomienie lokalne:

```bash
# 1. Start databases (Docker)
cd /opt/crm-gtd-smart
docker-compose up -d

# 2. Start aplikacji
npm run dev

# Frontend:  http://localhost:9025
# Backend:   http://localhost:9027
# RAG:       http://localhost:8000
```

### Uruchomienie RAG Service:

```bash
cd /opt/rag-service
docker-compose up -d

# API:       http://localhost:8000
# Qdrant UI: http://localhost:6333/dashboard
```

### Seeding (demo data):

```bash
cd /opt/crm-gtd-smart/packages/backend
npm run db:seed
```

---

## 12. Dokumentacja

### Główne pliki dokumentacji:

**Sorto-CRM (główna aplikacja):**
- `SORTO-CRM-OVERVIEW.md` - ten plik (przegląd całości)
- `README.md` - Quick Start
- `CLAUDE.md` - Developer Guide (1250+ linii)
- `APPLICATION_DOCUMENTATION.md` - Pełna dokumentacja
- `MANUAL_GTD_STREAMS_KOMPLETNY.md` - Manual GTD
- `SMART_DAY_PLANNER_MANUAL.md` - Manual Smart Day Planner
- `RULES_MANAGER_MANUAL.md` - Manual Rules Manager
- `DATABASE_MANUAL.md` - Database setup

**RAG Service (mikrousługa):**
- `/opt/rag-service/DEVELOPER.md` - Dokumentacja techniczna RAG
- `/opt/rag-service/README.md` - Quick Start RAG

---

## 13. Struktura Katalogów

```
/opt/
├── crm-gtd-smart/              # Główna aplikacja Sorto-CRM
│   ├── packages/
│   │   ├── backend/            # Express.js API
│   │   └── frontend/           # Next.js App
│   ├── docker-compose.yml      # PostgreSQL, Redis, ClickHouse
│   ├── nginx-production.conf   # Nginx config
│   ├── turbo.json              # Monorepo config
│   └── [dokumentacja.md]
│
└── rag-service/                # RAG Mikrousługa
    ├── app/
    │   ├── api/v1/
    │   │   ├── search.py       # AI-native RAG
    │   │   └── sync.py         # CRM sync
    │   ├── services/
    │   │   ├── vectorization/
    │   │   │   ├── embeddings.py
    │   │   │   └── qdrant.py
    │   │   ├── crm_connector.py
    │   │   └── document_formatter.py
    │   └── workers/
    │       └── celery_app.py   # Background tasks
    ├── docker-compose.yml      # Qdrant, Celery, Redis
    ├── .env                    # Config
    └── DEVELOPER.md            # Dokumentacja RAG
```

---

## 14. Kontakt

**Lokalizacja:**
- Główny katalog: `/opt/crm-gtd-smart`
- RAG Service: `/opt/rag-service`

**Wersja:**
- Sorto-CRM: v2.1
- Last update: 2025-10-25

---

**✅ DOKUMENT AKTUALNY**

*Ostatnia aktualizacja: 2025-10-25*
*Źródła: Cała struktura kodu, bazy danych, Docker Compose, dokumentacja techniczna*
