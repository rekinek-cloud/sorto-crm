# CRM-GTD-SMART - Kompletne Informacje o Aplikacji
*Wygenerowano: 2025-10-14*

---

## 1. INFORMACJE BIZNESOWE

### 1.1 Cel aplikacji i grupa docelowa

**Cel główny:**
Kompleksowa platforma SaaS łącząca CRM, metodologię GTD (Getting Things Done) oraz zarządzanie celami SMART z automatyzacją AI i planowaniem energii.

**Grupa docelowa:**
- **Podstawowa:** Małe i średnie firmy (SMB) potrzebujące zintegrowanego systemu zarządzania
- **Konkretni użytkownicy:**
  - Właściciele firm i menedżerowie (planowanie strategiczne)
  - Zespoły sprzedażowe (CRM, deal pipeline)
  - Kierownicy projektów (GTD, Smart Day Planner)
  - Freelancerzy i konsultanci (zarządzanie czasem i klientami)
  - Organizacje wielozespołowe (multi-tenant architecture)

### 1.2 Główne problemy, które rozwiązuje

1. **Fragmentacja narzędzi** - Jeden system zamiast 5-10 różnych aplikacji (CRM + Todo + Email + Calendar + Notes)
2. **Chaos w zadaniach** - Metodologia GTD zapewnia strukturę przetwarzania (Inbox → Next Actions → Projects)
3. **Brak priorytetyzacji** - Smart Day Planner dopasowuje zadania do poziomu energii
4. **Przeciążenie emailowe** - Smart Mailboxes z AI filtrami i automatyzacją
5. **Utrata wiedzy** - Knowledge Base z RAG search (371+ dokumentów)
6. **Manualna praca** - AI automatyzacja (9 typów reguł, 6 triggerów)
7. **Brak insightów** - Analytics dla projektów, dealów, komunikacji
8. **Rozproszenie kontekstu** - Wszystkie dane w jednym miejscu z relacjami

### 1.3 Kluczowe funkcjonalności (priorytet)

#### **MUST-HAVE (MVP - Zaimplementowane):**

✅ **Multi-tenant SaaS Architecture**
- Row Level Security (RLS) z PostgreSQL
- Izolacja danych na poziomie organizacji
- Zarządzanie subskrypcjami (STARTER/PROFESSIONAL/ENTERPRISE)

✅ **Authentication & Authorization**
- JWT z refresh tokens
- Role-based access (OWNER/ADMIN/MANAGER/MEMBER)
- Bezpieczne hasła (bcrypt, 12 rund)

✅ **GTD Streams System** (8 ról GTD)
- INBOX - przechwytywanie wszystkiego
- NEXT_ACTIONS - zadania do wykonania
- PROJECTS - wieloetapowe projekty
- WAITING_FOR - delegowane/oczekujące
- SOMEDAY_MAYBE - pomysły na przyszłość
- CONTEXTS - @computer, @calls, @office, @home
- AREAS - obszary odpowiedzialności
- REFERENCE - materiały referencyjne

✅ **Smart Day Planner**
- AI planowanie dnia z tracking energii
- Focus Modes: Deep Work, Quick Tasks, Creative Flow, Admin
- Energy Levels: HIGH/MEDIUM/LOW/CREATIVE/ADMINISTRATIVE
- Dashboard Widgets (DailyWidget, ActiveLinksPanel)
- Performance Analytics (ML patterns)

✅ **Smart Mailboxes**
- 9 typów filtrów (sender, subject, keywords, priority, etc.)
- Voice TTS (czytanie wiadomości)
- GTD Quick Actions (DO/DEFER/DELETE)
- Reply & Forward
- Drag & Drop organization

✅ **AI System**
- Universal Rules (9 typów reguł)
- Trigger Types (6 typów: manual, schedule, event, etc.)
- AI Providers (OpenAI, Claude)
- Smart Analysis projektów i zadań
- Rules Manager (unified interface)

✅ **Knowledge Base**
- Document Management (10 typów dokumentów)
- Wiki Pages (8 kategorii, auto-slug)
- RAG Search (semantic search, 371+ vectors)
- Full-text indexing

✅ **CRM Core**
- Companies & Contacts
- Deals Pipeline (stages, forecasting)
- Communication History
- Pipeline Analytics

#### **NICE-TO-HAVE (Roadmap):**

🔄 **Phase 1 (Months 5-8):**
- Advanced task dependencies
- Weekly review automation
- Stream templates marketplace
- Recurring tasks engine

🔄 **Phase 2 (Months 9-12):**
- SMART goal scoring (AI effectiveness)
- Improvement recommendations
- Advanced analytics dashboard
- Mobile app (React Native)

🔄 **Phase 3 (Months 13-18):**
- Real-time collaboration
- Advanced integrations (Slack, Zapier)
- Video conferencing
- Advanced reporting

---

## 2. INFORMACJE TECHNICZNE

### 2.1 Stack technologiczny

#### **Backend:**
- **Runtime:** Node.js v18.17.0+
- **Framework:** Express.js + TypeScript 5.1.6
- **ORM:** Prisma (PostgreSQL client)
- **API:** RESTful (JSON)
- **Validation:** Zod schemas
- **Authentication:** JWT (jsonwebtoken)
- **Password:** bcrypt (12 rounds)
- **Logging:** Winston + Express Winston
- **Security:** Helmet.js, CORS, rate limiting (Redis-based)
- **Monitoring:** Sentry (DSN configured)

#### **Frontend:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.1.6
- **Styling:** Tailwind CSS
- **UI Components:** Custom + shadcn/ui
- **State:** React Context + hooks
- **API Client:** fetch + custom wrapper
- **Build:** Turbo (monorepo)

#### **Database & Storage:**
- **Primary DB:** PostgreSQL 14+ (port 5434)
- **Cache:** Redis 7+ (port 6381)
- **Analytics:** ClickHouse (HTTP 8124, TCP 9002)
- **Vector DB:** Wbudowane w PostgreSQL (pgvector extension)
- **File Storage:** AWS S3 (optional) + local

#### **Infrastructure:**
- **Container:** Docker + Docker Compose
- **Process Manager:** PM2 (cluster mode)
- **Web Server:** Nginx (reverse proxy)
- **Deployment:** VPS (91.99.50.80)

#### **Monorepo:**
```
crm-gtd-smart/
├── packages/
│   ├── backend/     # Express API
│   └── frontend/    # Next.js App
├── turbo.json       # Turborepo config
└── package.json     # Workspaces root
```

### 2.2 API Endpoints (Backend)

**Base URL:**
- Production: `http://91.99.50.80/crm/api/v1/`
- Development: `http://localhost:9027/api/v1/`

**Format danych:** JSON
**Autoryzacja:** Bearer Token (JWT)

#### **Endpointy (główne):**

**Authentication:**
```
POST   /api/v1/auth/register      # Rejestracja organizacji + użytkownika
POST   /api/v1/auth/login         # Login (zwraca access + refresh token)
POST   /api/v1/auth/refresh       # Odświeżenie tokena
GET    /api/v1/auth/me            # Pobranie profilu użytkownika
POST   /api/v1/auth/logout        # Wylogowanie (invalidacja tokena)
```

**Organizations:**
```
GET    /api/v1/organizations           # Szczegóły organizacji
PUT    /api/v1/organizations           # Aktualizacja (ADMIN/OWNER)
GET    /api/v1/organizations/users     # Lista użytkowników (MANAGER+)
GET    /api/v1/organizations/statistics # Statystyki (MANAGER+)
```

**System:**
```
GET    /health                    # Health check (DB, Redis, ClickHouse)
GET    /api/v1                    # API info & documentation
```

**Moduły (TODO - w rozwoju):**
- `/api/v1/streams` - GTD Streams
- `/api/v1/tasks` - Tasks & Next Actions
- `/api/v1/projects` - Projects
- `/api/v1/companies` - Companies (CRM)
- `/api/v1/contacts` - Contacts (CRM)
- `/api/v1/deals` - Deals Pipeline
- `/api/v1/emails` - Email Management
- `/api/v1/smart-mailboxes` - Smart Mailboxes
- `/api/v1/ai-rules` - AI Automation Rules
- `/api/v1/knowledge-base` - Documents & Wiki
- `/api/v1/search` - RAG Search

**Struktura odpowiedzi:**
```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}

// Error
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Headers wymagane:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 2.3 Baza danych (struktura i relacje)

**Database:** PostgreSQL 14+
**ORM:** Prisma

#### **Główne tabele (85+ tabel):**

**Core (Multi-tenancy):**
- `Organization` - Organizacje (root entity)
- `User` - Użytkownicy (relacja do Organization)
- `Subscription` - Subskrypcje (STARTER/PROFESSIONAL/ENTERPRISE)
- `UserPermission` - Uprawnienia użytkowników
- `UserRelation` - Relacje między użytkownikami

**GTD System:**
- `Stream` - Strumienie GTD (8 ról)
- `Task` - Zadania
- `Project` - Projekty
- `NextAction` - Następne akcje
- `InboxItem` - Elementy Inbox (11 źródeł)
- `SomedayMaybe` - Pomysły na przyszłość
- `WaitingFor` - Delegowane/oczekujące
- `Context` - Konteksty (@computer, @calls, etc.)
- `AreaOfResponsibility` - Obszary odpowiedzialności
- `GTDBucket` - Koszyki GTD
- `GTDHorizon` - Horyzonty GTD (6 poziomów)

**Smart Day Planner:**
- `EnergyTimeBlock` - Bloki czasowe z energią
- `ScheduledTask` - Zaplanowane zadania
- `EnergyPattern` - Wzorce energii
- `EnergyAnalytics` - Analityki energii
- `PerformanceMetrics` - Metryki wydajności
- `UserPattern` - Wzorce użytkownika (ML)
- `FocusMode` - Tryby focus (Deep Work, etc.)

**Communication:**
- `EmailAccount` - Konta email
- `Message` - Wiadomości
- `EmailLog` - Logi emaili
- `EmailRule` - Reguły emaili
- `SmartMailbox` - Inteligentne skrzynki
- `EmailTemplate` - Szablony emaili
- `EmailAnalysis` - Analiza emaili (AI)
- `AutoReply` - Automatyczne odpowiedzi
- `CommunicationChannel` - Kanały komunikacji

**CRM:**
- `Company` - Firmy
- `Contact` - Kontakty
- `Deal` - Deale (pipeline)
- `Lead` - Leady
- `Activity` - Aktywności
- `Meeting` - Spotkania
- `Timeline` - Historia interakcji

**AI & Automation:**
- `AIProvider` - Dostawcy AI (OpenAI, Claude)
- `AIRule` - Reguły AI
- `UnifiedRule` - Ujednolicone reguły (9 typów)
- `AIExecution` - Wykonania AI
- `AIUsageStats` - Statystyki użycia AI
- `AIPromptTemplate` - Szablony promptów
- `ProcessingRule` - Reguły przetwarzania

**Knowledge Base:**
- `Document` - Dokumenty (10 typów)
- `WikiPage` - Strony wiki (8 kategorii)
- `WikiCategory` - Kategorie wiki
- `KnowledgeBase` - Baza wiedzy
- `VectorDocument` - Dokumenty zwektoryzowane
- `VectorCache` - Cache wektorów
- `VectorSearchResult` - Wyniki wyszukiwania RAG
- `AIKnowledgeBase` - AI Knowledge Base
- `SearchIndex` - Indeks wyszukiwania

**Files & Storage:**
- `File` - Pliki
- `Folder` - Foldery
- `Tag` - Tagi

**Business:**
- `Product` - Produkty
- `Service` - Usługi
- `Invoice` - Faktury
- `Order` - Zamówienia
- `Offer` - Oferty
- `Complaint` - Reklamacje
- `BugReport` - Raporty błędów

**Analytics:**
- `StreamAccessLog` - Logi dostępu do strumieni
- `UserAccessLog` - Logi dostępu użytkowników
- `ErrorLog` - Logi błędów

**Other:**
- `RecurringTask` - Zadania cykliczne
- `DelegatedTask` - Zadania delegowane
- `Habit` - Nawyki
- `WeeklyReview` - Przeglądy tygodniowe
- `Sprint` - Sprinty
- `SMARTTemplate` - Szablony SMART
- `Recommendation` - Rekomendacje
- `Info` - Informacje
- `Unimportant` - Nieważne

#### **Kluczowe relacje:**

```prisma
Organization (1) → (N) User
Organization (1) → (N) Stream
Organization (1) → (N) Task
Organization (1) → (N) Company
Organization (1) → (N) Contact

Stream (1) → (N) Task
Stream (1) → (N) Project
Stream (parent/child hierarchy - CTE queries)

Task (N) → (1) User (assignee)
Task (N) → (1) Context
Task (N) → (1) Project

Project (1) → (N) Task
Project (N) → (1) Stream

EmailAccount (1) → (N) Message
SmartMailbox (1) → (N) Message (via filters)

Company (1) → (N) Contact
Company (1) → (N) Deal

Deal (N) → (1) Contact
Deal (1) → (N) Activity
```

**Row Level Security:**
Wszystkie tabele mają pole `organizationId` → automatyczna izolacja danych multi-tenant.

### 2.4 Integracje zewnętrzne

#### **Zaimplementowane:**

✅ **Email:**
- SMTP (Gmail, inne)
- IMAP (optional - w planach)
- Konfiguracja: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

✅ **AI Providers:**
- **OpenAI** (GPT-4, GPT-3.5)
  - API Key: `OPENAI_API_KEY`
  - Use cases: Task analysis, email summarization, SMART goal scoring
- **Claude** (Anthropic)
  - Integration via API
  - Use cases: Document analysis, automation rules

✅ **Payment:**
- **Stripe**
  - Secret Key: `STRIPE_SECRET_KEY`
  - Webhook: `STRIPE_WEBHOOK_SECRET`
  - Publishable Key: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Plans: STARTER ($29/mo), PROFESSIONAL ($79/mo), ENTERPRISE ($199/mo)

✅ **File Storage:**
- **AWS S3** (optional)
  - Access Key: `AWS_ACCESS_KEY_ID`
  - Secret: `AWS_SECRET_ACCESS_KEY`
  - Bucket: `AWS_BUCKET_NAME`
  - Region: `AWS_REGION`
- **Local Storage** (default)

✅ **Monitoring:**
- **Sentry**
  - DSN: `SENTRY_DSN`
  - Error tracking i performance monitoring

#### **W planach (Roadmap):**

🔄 **Cloud Storage:**
- Dropbox integration
- Google Drive integration
- OneDrive integration

🔄 **Calendar:**
- Google Calendar sync
- Microsoft Outlook Calendar
- Apple Calendar (CalDAV)

🔄 **Communication:**
- Slack notifications
- Microsoft Teams
- Discord webhooks

🔄 **Automation:**
- Zapier integration
- Make (Integromat)
- n8n workflows

🔄 **CRM Sync:**
- HubSpot import/export
- Salesforce data sync
- Pipedrive integration

🔄 **Voice:**
- Google Assistant integration (katalog już istnieje: `/opt/crm-gtd-smart/google-assistant-integration`)
- Google Nest integration (katalog: `/opt/crm-gtd-smart/google-nest-integration`)
- Alexa Skills (w planach)

### 2.5 Wymagania dot. offline/sync

#### **Obecny stan:**
❌ **Brak offline support** - aplikacja wymaga stałego połączenia internetowego

#### **Planowane:**

🔄 **Phase 2 - Offline Capabilities:**
- **Service Worker** (PWA)
  - Cache static assets
  - Offline fallback pages

- **IndexedDB** (local storage)
  - Cache last viewed data
  - Queue dla offline actions

- **Sync Strategy:**
  - Background sync API
  - Conflict resolution (last-write-wins / operational transforms)
  - Delta sync (tylko zmiany)
  - Optimistic UI updates

- **Offline Features (priorytet):**
  1. **Read-only access** do ostatnio otwartych:
     - Tasks
     - Projects
     - Contacts
     - Documents
  2. **Create/Edit (queue):**
     - Nowe zadania
     - Notatki
     - Time tracking
  3. **Sync indicators:**
     - Status połączenia
     - Pending changes counter
     - Last sync timestamp

---

## 3. UX/UI

### 3.1 Flow użytkownika (User Journey)

#### **Onboarding Flow:**

1. **Landing Page** (`/`)
   - Hero section z value proposition
   - Features overview
   - Pricing
   - CTA: "Start Free Trial"

2. **Registration** (`/auth/register`)
   - Formularz:
     - Organization Name
     - First Name / Last Name
     - Email
     - Password / Confirm Password
     - Accept Terms
     - Subscription Plan (STARTER/PROFESSIONAL/ENTERPRISE)
   - Backend: Tworzy Organization + User (OWNER) + Subscription
   - Auto-login po rejestracji

3. **First Login** (`/auth/login`)
   - Email + Password
   - JWT token → localStorage
   - Redirect → `/dashboard`

4. **Dashboard (First Time)** (`/dashboard`)
   - Welcome wizard (opcjonalnie)
   - Quick setup:
     - Import contacts (CSV)
     - Connect email account
     - Create first project
   - Default widgets:
     - Today's Tasks
     - Inbox (0 items)
     - Recent Activity

#### **Główny Flow (Daily Use):**

**Rano (Morning Routine):**
1. **Login** → Dashboard
2. **Smart Day Planner** (`/dashboard/smart-day-planner`)
   - Widzi sugerowany plan dnia (AI)
   - Energy levels: HIGH → MEDIUM → LOW
   - Focus blocks:
     - 9:00-11:00: Deep Work (HIGH energy tasks)
     - 11:00-12:00: Quick Tasks
     - 14:00-16:00: Creative Flow
     - 16:00-17:00: Admin Focus
3. **Review Inbox** (`/dashboard/gtd/inbox`)
   - Process items (DO/DEFER/DELETE)
   - Quick capture z email, notes, ideas

**W ciągu dnia (Execution):**
1. **Work on Tasks** (`/dashboard/streams/next-actions`)
   - Widzi tylko @context relevant (np. @computer)
   - Mark as done → auto-move to completed
   - Track time (opcjonalnie)
2. **Check Smart Mailboxes** (`/dashboard/smart-mailboxes`)
   - AI-filtered messages (Priority, Urgent, Customers)
   - Quick reply / Forward
   - GTD actions (DO → Task, DEFER → Someday)
3. **Update Deals** (`/dashboard/deals`)
   - Move cards w pipeline (Kanban)
   - Add notes / activities
   - Schedule follow-ups

**Wieczorem (Review):**
1. **Weekly Review** (`/dashboard/gtd/weekly-review`) - piątki
   - Review completed tasks
   - Update projects
   - Process Someday/Maybe
   - Plan next week

#### **Admin Flow (Setup & Maintenance):**

1. **Invite Team** (`/dashboard/admin/users`)
   - Send email invitations
   - Assign roles (ADMIN/MANAGER/MEMBER)
2. **Configure AI Rules** (`/dashboard/ai-rules`)
   - Create automation (email filters, task routing)
   - Set triggers (schedule, events)
3. **Manage Streams** (`/dashboard/streams`)
   - Create custom streams
   - Configure GTD hierarchy
4. **Analytics** (`/dashboard/analytics`)
   - Performance metrics
   - Team productivity
   - Deal forecasting

### 3.2 Główne ekrany i nawigacja

#### **Layout (główny):**

```
┌─────────────────────────────────────────────────────┐
│ Header: Logo | Search | Notifications | User Menu   │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │  Main Content Area                       │
│          │                                          │
│ - Home   │  [Dynamic based on route]                │
│ - Inbox  │                                          │
│ - Tasks  │                                          │
│ - ...    │                                          │
│          │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

#### **Sidebar Navigation (główna):**

📂 **Dashboard Sections** (z `/opt/crm-gtd-smart/packages/frontend/src/app/dashboard/`):

**🏠 Core:**
- `/ (home)` - Dashboard główny (widgets, today's summary)
- `/inbox` - GTD Inbox (przechwytywanie)
- `/smart-day-planner` - Plan dnia z energią

**📋 GTD:**
- `/streams` - Wszystkie strumienie GTD
- `/streams/next-actions` - Zadania do wykonania
- `/streams/projects` - Projekty
- `/streams/waiting-for` - Oczekujące
- `/streams/someday-maybe` - Pomysły
- `/gtd-buckets` - Koszyki GTD
- `/areas` - Obszary odpowiedzialności
- `/contexts` - Konteksty (@computer, @calls)

**📧 Communication:**
- `/smart-mailboxes` - Inteligentne skrzynki
- `/email-accounts` - Konta email
- `/email-analysis` - Analiza emaili
- `/communication` - Historia komunikacji

**👥 CRM:**
- `/companies` - Firmy
- `/contacts` - Kontakty
- `/deals` - Pipeline dealów

**🤖 AI & Automation:**
- `/ai-assistant` - Asystent AI
- `/ai-rules` - Reguły automatyzacji
- `/ai-management` - Zarządzanie AI

**📊 Analytics:**
- `/analytics` - Dashboard analityczny
- `/calendar` - Kalendarz
- `/graph-demo` - Wykresy (demo)

**📚 Knowledge:**
- `/knowledge-base` - Baza wiedzy
- `/wiki` - Wiki strony
- `/files` - Pliki

**⚙️ Admin:**
- `/admin` - Panel admina
- `/settings` - Ustawienia organizacji
- `/complaints` - Reklamacje

#### **Kluczowe ekrany (szczegóły):**

**1. Dashboard (`/dashboard`)**
- Layout: Grid 3 kolumny
- Widgets:
  - Today's Tasks (energy-sorted)
  - Inbox Counter
  - Recent Activity Feed
  - Deals Pipeline Summary
  - AI Suggestions
  - Quick Capture form

**2. Smart Day Planner (`/dashboard/smart-day-planner`)**
- Timeline view (vertical)
- Energy graph (top)
- Focus blocks (color-coded):
  - 🔴 Deep Work (red)
  - 🟡 Quick Tasks (yellow)
  - 🔵 Creative Flow (blue)
  - 🟢 Admin Focus (green)
- Drag & drop tasks to time blocks
- AI suggestions panel (right sidebar)

**3. GTD Streams (`/dashboard/streams`)**
- Tree view (hierarchy)
- 8 GTD roles (icons):
  - 📥 INBOX
  - ⚡ NEXT_ACTIONS
  - 📁 PROJECTS
  - ⏳ WAITING_FOR
  - 💡 SOMEDAY_MAYBE
  - 🏷️ CONTEXTS
  - 🎯 AREAS
  - 📚 REFERENCE
- Quick actions: Create stream, Filter, Search

**4. Smart Mailboxes (`/dashboard/smart-mailboxes`)**
- Layout: Tabs (drag & drop)
- Mailbox types:
  - Priority (⭐)
  - Urgent (🚨)
  - Customers (👤)
  - Projects (📁)
  - Waiting (⏳)
- Message list (left) + Preview (right)
- Actions bar:
  - 🔊 TTS (read aloud)
  - ↩️ Reply
  - ➡️ Forward
  - 📥 GTD (DO/DEFER/DELETE)

**5. Deals Pipeline (`/dashboard/deals`)**
- Kanban board (columns = stages)
- Cards: Company name, value, probability
- Drag & drop between stages
- Filters: Owner, Date range, Amount
- Analytics: Conversion rates, forecasting

**6. AI Rules (`/dashboard/ai-rules`)**
- List view + Create button
- Rule card:
  - Name
  - Trigger type (schedule, event, manual)
  - Conditions (IF...)
  - Actions (THEN...)
  - Status (active/paused)
- Edit modal: Visual rule builder

### 3.3 Wytyczne wizualne

#### **Design System:**

**Kolory:**
- Primary: `#3B82F6` (blue-500) - główne CTA
- Success: `#10B981` (green-500) - completed, success
- Warning: `#F59E0B` (amber-500) - pending, important
- Danger: `#EF4444` (red-500) - urgent, delete
- Gray: `#6B7280` (gray-500) - text secondary

**Energy Colors (Smart Day Planner):**
- HIGH: `#EF4444` (red-500)
- MEDIUM: `#F59E0B` (amber-500)
- LOW: `#10B981` (green-500)
- CREATIVE: `#8B5CF6` (purple-500)
- ADMINISTRATIVE: `#6B7280` (gray-500)

**Typography:**
- Font: Inter (system default)
- Headings: Bold, tight tracking
- Body: Regular, readable line-height (1.6)

**Spacing:**
- Base unit: 4px (Tailwind default)
- Grid: 8px (2 units)
- Sections: 24px-32px

**Components:**
- Buttons: Rounded (6px), shadow-sm
- Cards: Border (gray-200), shadow, rounded (8px)
- Inputs: Border (gray-300), focus ring (blue-500)
- Modals: Overlay (backdrop-blur), centered, shadow-xl

**Icons:**
- Library: Heroicons / Lucide
- Size: 20px (default), 24px (large)
- Style: Outline (default), Solid (selected)

**Responsive:**
- Mobile: < 640px (single column, bottom nav)
- Tablet: 640px-1024px (2 columns, sidebar collapsible)
- Desktop: > 1024px (3 columns, sidebar fixed)

**Dark Mode:**
- Status: ❌ Not implemented yet
- Planned: Phase 2

---

## 4. DEPLOYMENT

### 4.1 Środowiska

#### **Development (Localhost):**

**URL:**
- Frontend: `http://localhost:9025`
- Backend API: `http://localhost:9027`
- Health: `http://localhost:9027/health`

**Database:**
- PostgreSQL: `localhost:5434`
- Redis: `localhost:6381`
- ClickHouse: `localhost:8124` (HTTP), `localhost:9002` (TCP)

**Start:**
```bash
cd /opt/crm-gtd-smart
docker-compose up -d  # Start DB services
npm run dev           # Start frontend + backend
```

**Hot Reload:** ✅ Enabled (nodemon backend, Next.js frontend)

**Seeding:**
```bash
cd packages/backend
npm run db:seed  # Demo data (owner@demo.com, etc.)
```

#### **Production (VPS):**

**URL:**
- Frontend: `http://91.99.50.80/crm/`
- Backend API: `http://91.99.50.80/crm/api/v1/`
- Subpath: `/crm` (nginx proxy)

**Server:**
- IP: `91.99.50.80`
- OS: Linux (Ubuntu/Debian)
- Process Manager: **PM2** (cluster mode)
  - `flyball-backend` (id: 0) - 9 days uptime, 185+ restarts
  - `flyball-frontend` (id: 1) - 13 days uptime, 0 restarts

**Database (Production):**
- PostgreSQL: `localhost:5434` (Docker container)
- Redis: `localhost:6381` (Docker container)
- ClickHouse: `localhost:8124` / `9002` (Docker container)

**Environment:**
- Config: `.env.production` (symlinked to `.env`)
- Secrets: JWT_SECRET, POSTGRES_PASSWORD, OPENAI_API_KEY, etc.

**Deployment Process:**
```bash
# Manual deploy (via deploy.sh)
cd /opt/crm-gtd-smart
./deploy.sh  # Build + restart PM2

# Or via PM2
pm2 restart flyball-backend
pm2 restart flyball-frontend
```

**Nginx:**
- Config: `/opt/crm-gtd-smart/nginx-production.conf`
- Reverse proxy: `/crm` → `localhost:9025` (frontend)
- API proxy: `/crm/api` → `localhost:9027/api` (backend)

**SSL/HTTPS:**
- Status: ❌ Not configured (currently HTTP only)
- Planned: Let's Encrypt + Certbot

#### **Staging:**

**Status:** ❌ Not configured yet

**Planned setup:**
- URL: `http://staging.crm-gtd.com`
- Same stack as production
- Auto-deploy from `develop` branch (Git)
- Separate database (staging data)

### 4.2 CI/CD Pipeline

**Status:** ❌ Not implemented

**Planned (Phase 2):**
- **Git Workflow:** Gitflow (main, develop, feature/*, hotfix/*)
- **CI:** GitHub Actions / GitLab CI
  - Run tests (Jest)
  - Type checking (tsc)
  - Linting (ESLint)
  - Build verification
- **CD:**
  - Auto-deploy to staging (on develop push)
  - Manual deploy to production (on main merge)
- **Monitoring:** Sentry alerts on deployment errors

### 4.3 Backups

**Current backups:**
```
/opt/crm-gtd-smart/backups/
├── complete_backup_20250704_194258/
│   ├── database/ (SQL dumps)
│   └── application/ (code + docs)
├── database_backup_20250705_093407_current.sql (24.7MB)
└── ...
```

**Backup strategy:**
- **Database:** Daily SQL dump (automated via cron?)
- **Files:** Weekly full backup
- **Retention:** 30 days (rotate)

### 4.4 Monitoring & Logs

**PM2:**
```bash
pm2 list          # Status aplikacji
pm2 logs          # Real-time logs
pm2 monit         # CPU/Memory monitoring
```

**Logs location:**
- Backend: `~/.pm2/logs/flyball-backend-*.log`
- Frontend: `~/.pm2/logs/flyball-frontend-*.log`
- Nginx: `/var/log/nginx/`

**Sentry:**
- DSN configured: `SENTRY_DSN`
- Error tracking: ✅ Enabled
- Performance: ✅ Enabled

**Health Checks:**
- Endpoint: `http://91.99.50.80/crm/api/v1/health`
- Checks: DB connection, Redis, ClickHouse

---

## 5. DODATKOWE INFORMACJE

### 5.1 Dokumentacja

**Główne pliki dokumentacji** (w `/opt/crm-gtd-smart/`):

- `README.md` - Quick Start (545 linii)
- `APPLICATION_DOCUMENTATION.md` - Pełna dokumentacja (200+ stron)
- `CLAUDE.md` - Developer Guide (1250+ linii)
- `SMART_DAY_PLANNER_MANUAL.md` - Manual Smart Day Planner
- `MANUAL_GTD_STREAMS_KOMPLETNY.md` - Manual GTD Streams
- `RULES_MANAGER_MANUAL.md` - Manual Rules Manager
- `VOICE_TTS_MANUAL.md` - Manual Voice TTS
- `MANUAL_SYSTEMU_AI.md` - Manual AI System
- `DATABASE_MANUAL.md` - Database setup guide
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `crm_gtd_funkcjonalnosci_pl.md` - Lista funkcjonalności (PL)
- `crm_gtd_dev_docs.md` - Developer docs

### 5.2 Demo Credentials

| Role    | Email              | Password      | Permissions           |
|---------|-------------------|---------------|----------------------|
| OWNER   | owner@demo.com    | Password123!  | Full access          |
| ADMIN   | admin@demo.com    | Password123!  | Admin + manage users |
| MANAGER | manager@demo.com  | Password123!  | View stats, manage team |
| MEMBER  | member@demo.com   | Password123!  | Basic access         |

### 5.3 Kluczowe liczby

- **85+ tabel** w bazie danych
- **371+ dokumentów** w RAG search (wektoryzacja)
- **8 ról GTD** (Inbox → Reference)
- **9 typów reguł AI** (automation)
- **11 źródeł Inbox** (email, web, voice, etc.)
- **6 typów triggerów** (manual, schedule, event, etc.)
- **10 typów dokumentów** (Knowledge Base)
- **8 kategorii Wiki**

### 5.4 Roadmap Timeline

- **Phase 0 (MVP):** ✅ COMPLETED (Months 0-4)
- **Phase 1 (Core GTD):** 🔄 IN PROGRESS (Months 5-8)
- **Phase 2 (SMART + Mobile):** 📅 PLANNED (Months 9-12)
- **Phase 3 (Advanced):** 📅 PLANNED (Months 13-18)

### 5.5 License

**Status:** Private & Proprietary
**Rights:** All rights reserved

---

## 6. KONTAKT I WSPARCIE

**Lokalizacja kodu:**
- Główny katalog: `/opt/crm-gtd-smart`
- Backend: `/opt/crm-gtd-smart/packages/backend`
- Frontend: `/opt/crm-gtd-smart/packages/frontend`

**Git:**
- Status: Repository istnieje (`.git` folder)
- Branch: Prawdopodobnie `main` lub `develop`

**Wersja:**
- Current: `v2.1` (z README.md)
- Last update: 2025-07-08

---

**✅ DOKUMENT KOMPLETNY**

*Wszystkie wymagane informacje z "opis needed.txt" zostały zebrane i udokumentowane.*
*Źródła: README.md, package.json, schema.prisma, dokumentacja aplikacji, struktura katalogów.*
