# ANALIZA APLIKACJI SORTO-CRM

**Data analizy**: 2026-02-02
**Wersja aplikacji**: 1.0
**Status**: Dzialajaca (DEV)

---

## 1. INFORMACJE OGOLNE

| Parametr | Wartosc |
|----------|---------|
| Nazwa | sorto-crm |
| Typ | SaaS CRM + GTD + AI |
| URL DEV | https://crm.dev.sorto.ai |
| Lokalizacja | /home/dev/apps/sorto-crm |
| Rozmiar | ~2.7 GB |

---

## 2. ARCHITEKTURA

### 2.1 Struktura Monorepo

```
sorto-crm/
├── packages/
│   ├── backend/          # Node.js + Express API
│   ├── frontend/         # Next.js 14 aplikacja
│   └── android-twa/      # Android TWA (opcjonalne)
├── prisma/               # Schema bazy danych
├── docs/                 # Dokumentacja
├── e2e/                  # Testy E2E
├── nginx/                # Konfiguracja nginx
├── scripts/              # Skrypty pomocnicze
└── docker-compose.yml    # Orchestracja Docker
```

### 2.2 Diagram Architektury

```
                    INTERNET (HTTPS)
                          |
                    [TRAEFIK]
                   /         \
            [Backend]     [Frontend]
            Express        Next.js
            :3001          :3000
                 \         /
              [Docker Network]
                 /         \
          [PostgreSQL]  [Redis]
           + pgvector    Cache
```

---

## 3. TECHNOLOGIE

### 3.1 Backend

| Kategoria | Technologia | Wersja |
|-----------|-------------|--------|
| Runtime | Node.js | 18 LTS |
| Framework | Express.js | 4.18.2 |
| Jezyk | TypeScript | 5.1.6 |
| ORM | Prisma | 6.19.0 |
| Baza danych | PostgreSQL | 14 + pgvector |
| Cache | Redis | 7 |
| Auth | JWT + bcrypt | - |
| Email | nodemailer + IMAP | - |
| AI | OpenAI, Gemini, Anthropic | - |
| Voice | Coqui TTS | - |

### 3.2 Frontend

| Kategoria | Technologia | Wersja |
|-----------|-------------|--------|
| Framework | Next.js | 14.0.4 |
| UI Library | React | 18.2.0 |
| Jezyk | TypeScript | 5.3.3 |
| Styling | Tailwind CSS | 3.3.6 |
| State | Zustand | 4.4.7 |
| Forms | React Hook Form | 7.48.2 |
| i18n | next-intl | 4.6.1 |
| Charts | Recharts | 2.8.0 |
| DnD | dnd-kit | - |

### 3.3 Infrastruktura

| Komponent | Technologia |
|-----------|-------------|
| Konteneryzacja | Docker + Docker Compose |
| Reverse Proxy | Traefik |
| SSL | Let's Encrypt |
| CI/CD | (do konfiguracji) |

---

## 4. BAZA DANYCH

### 4.1 Statystyki

| Metryka | Wartosc |
|---------|---------|
| Modele Prisma | 103 |
| Enums | 109 typow |
| Linii schema | 4,432 |
| Wypelnienie | 25% (26/104 tabel) |

### 4.2 Glowne Modele

**Multi-Tenancy:**
- `Organization` - glowny tenant
- `User` - uzytkownicy organizacji

**CRM Core:**
- `Contact` - kontakty
- `Company` - firmy
- `Deal` - transakcje
- `Lead` - leady sprzedazowe
- `Product`, `Service` - oferta
- `Invoice`, `Order` - dokumenty

**GTD System:**
- `Task` - zadania
- `Project` - projekty
- `Stream` - hierarchia GTD
- `GTDBucket` - buckety GTD
- `GTDHorizon` - horyzonty planowania
- `Context` - konteksty (@phone, @computer)

**AI & Automation:**
- `ai_rules` - reguly AI
- `ai_models` - modele AI
- `ai_executions` - wykonania AI
- `unified_rules` - zunifikowane reguly
- `flow_automation_rules` - automatyzacje

**Knowledge & Search:**
- `KnowledgeBase` - baza wiedzy
- `vector_documents` - dokumenty wektorowe
- `SearchIndex` - indeks wyszukiwania

---

## 5. API BACKEND

### 5.1 Struktura

```
packages/backend/src/
├── modules/           # Moduly funkcjonalne
│   ├── auth/         # Autentykacja
│   ├── organizations/# Multi-tenancy
│   └── developer-hub/# Narzedzia dev
├── routes/           # 94 pliki routes
├── services/         # Logika biznesowa
├── middleware/       # Express middleware
├── config/           # Konfiguracja
└── app.ts            # Entry point
```

### 5.2 Glowne Endpointy

| Kategoria | Prefix | Przykladowe endpointy |
|-----------|--------|----------------------|
| Auth | /auth | /login, /register, /verify |
| CRM | /api/v1 | /contacts, /companies, /deals |
| GTD | /api/v1 | /tasks, /projects, /streams |
| AI | /api/v1 | /ai, /ai-chat, /ai-rules |
| Email | /api/v1 | /communication-channels |
| Knowledge | /api/v1 | /knowledge, /rag, /vector-search |

### 5.3 Serwisy (najwazniejsze)

| Serwis | Rozmiar | Funkcja |
|--------|---------|---------|
| FlowEngineService.ts | 52KB | Silnik automatyzacji |
| AIKnowledgeEngine.ts | 51KB | Silnik wiedzy AI |
| UserHierarchyService.ts | 33KB | Hierarchia uzytkownikow |
| VectorService.ts | 28.5KB | Wyszukiwanie wektorowe |
| InfrastructureService.ts | 21KB | Monitoring infrastruktury |

---

## 6. FRONTEND

### 6.1 Struktura App Router

```
src/app/
├── [locale]/              # Warstwa i18n
│   ├── auth/             # Strony auth
│   ├── dashboard/        # Dashboard
│   ├── onboarding/       # Onboarding
│   └── pricing/          # Cennik
├── layout.tsx
└── page.tsx
```

### 6.2 Komponenty (42 katalogi)

| Kategoria | Komponenty |
|-----------|------------|
| CRM | Contacts, Companies, Deals, Pipeline |
| GTD | Tasks, Projects, Streams, Inbox |
| AI | AIHub, AIChat, AIAssistant |
| Communication | Email, Slack, Channels |
| Knowledge | KnowledgeBase, RAGSearch |
| Planning | SmartDayPlanner, Calendar |
| Analytics | Dashboard, Charts, Reports |

### 6.3 Funkcjonalnosci UI

- Multi-language (14 jezykow)
- Dark/Light mode
- Drag & Drop (dnd-kit)
- Real-time updates
- Terminal emulator (xterm)
- Voice input/output
- Charts & analytics

---

## 7. INTEGRACJE

### 7.1 AI Providers

| Provider | Modele | Status |
|----------|--------|--------|
| OpenAI | GPT-4, GPT-3.5 | Aktywny |
| Google | Gemini | Aktywny |
| Anthropic | Claude | Aktywny |
| DeepSeek | DeepSeek | Aktywny |
| HuggingFace | Open models | Aktywny |

### 7.2 Zewnetrzne Serwisy

| Serwis | Funkcja | Status |
|--------|---------|--------|
| IMAP/SMTP | Email sync | Aktywny |
| Slack API | Integracja Slack | Aktywny |
| Stripe | Platnosci | Skonfigurowany |
| AWS S3 | Storage plikow | Skonfigurowany |
| Coqui TTS | Synteza mowy | Mock (DEV) |

---

## 8. DOCKER SETUP

### 8.1 Kontenery

| Kontener | Image | Port | Status |
|----------|-------|------|--------|
| crm-backend | sorto-crm-backend | 3005:3001 | Running |
| crm-frontend | sorto-crm-frontend | 3008:3000 | Running |
| crm-postgres | pgvector/pgvector:pg14 | 5432 | Running |
| crm-redis | redis:7-alpine | 6379 | Running |

### 8.2 Volumes

```
/data/databases/sorto-crm/
├── postgres/    # Dane PostgreSQL
└── redis/       # Dane Redis
```

---

## 9. BEZPIECZENSTWO

### 9.1 Zaimplementowane

- [x] JWT Authentication
- [x] bcrypt password hashing
- [x] Helmet CSP headers
- [x] CORS configuration
- [x] Rate limiting
- [x] Environment variables
- [x] Docker healthchecks
- [x] Traefik reverse proxy

### 9.2 Do naprawy

- [ ] Test endpoints bez autoryzacji (`/api/v1/test-rag-search`)
- [ ] Demo accounts cleanup
- [ ] Security audit

---

## 10. ZNANE PROBLEMY

### 10.1 Backend

| Problem | Priorytet | Status |
|---------|-----------|--------|
| RAG - tabela vectors nie istnieje | WYSOKI | Do naprawy |
| Prisma - brakujace kolumny | WYSOKI | Do naprawy |
| Seed scripts - bledy | SREDNI | Do naprawy |
| 78 pustych tabel | SREDNI | Do wypelnienia |

### 10.2 Frontend

| Problem | Priorytet | Status |
|---------|-----------|--------|
| Przyciski kalendarza | WYSOKI | Do naprawy |
| Demo przyciski console.log | WYSOKI | Do naprawy |
| Activity Timeline placeholder | WYSOKI | Do naprawy |
| Brakujace toast notifications | SREDNI | Do naprawy |

---

## 11. STATYSTYKI KODU

| Metryka | Backend | Frontend |
|---------|---------|----------|
| Pliki TS/TSX | ~200 | ~300 |
| Routes | 94 | - |
| Services | 50+ | - |
| Komponenty | - | 42 katalogi |
| Dependencies | 55 | 58 |

---

## 12. DOKUMENTACJA

### 12.1 Istniejace pliki

| Plik | Rozmiar | Zawartosc |
|------|---------|-----------|
| APPLICATION_DOCUMENTATION.md | 35KB | Ogolna dokumentacja |
| BACKEND_FEATURES.md | 19KB | Funkcje backend |
| FRONTEND_FEATURES.md | 16KB | Funkcje frontend |
| SAAS_MANUAL_COMPLETE.md | 46KB | Manual SaaS |
| QA-TEST-PLAN.md | 17KB | Plan testow |

### 12.2 Nowe pliki (ten projekt)

| Plik | Zawartosc |
|------|-----------|
| PLAN_PRAC.md | Plan realizacji |
| ANALIZA_APLIKACJI.md | Ten plik |
| INSTRUKCJA_DEVELOPEROW.md | Dla programistow |
| INSTRUKCJA_UZYTKOWNIKOW.md | Dla uzytkownikow |

---

*Ostatnia aktualizacja: 2026-02-02*
