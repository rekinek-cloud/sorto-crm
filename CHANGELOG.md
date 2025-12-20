# 📋 CHANGELOG - CRM-GTD Smart

Wszystkie znaczące zmiany w projekcie są dokumentowane w tym pliku.

Format bazuje na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
a projekt stosuje [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Development (V2)

### 🚀 Planowane
- Dashboard STREAMS z wizualizacjami przepływów
- AI-powered routing w Source
- Mobile-first optymalizacje

## [2.0.0] - 2025-11-29 - STREAMS Migration

### ✨ Dodane - Metodologia STREAMS

#### Nowe Komponenty UI
- **StreamStatusBadge** - Wizualna reprezentacja statusu strumienia (FLOWING/FROZEN/TEMPLATE)
- **StreamPatternBadge** - Badge wzorca strumienia (project/continuous/reference/client/pipeline/workspace)
- **FlowScoreBadge** - Dynamiczny wskaźnik zdrowia strumienia
- **FlowAnalysisModal** - Szczegółowa analiza przepływu
- **GoalCard** - Karta celu według metodologii RZUT
- **GoalForm** - Formularz tworzenia celów RZUT

#### Nowa Strona Goals (Cele RZUT)
- Pełna implementacja metodologii RZUT:
  - R - Rezultat (co powstanie?)
  - Z - Zmierzalność (po czym poznam sukces?)
  - U - Ujście (do kiedy?)
  - T - Tło (dlaczego ten cel?)
- Filtrowanie celów według statusu i strumienia
- Wizualizacja postępu z kolorowymi paskami
- Oznaczanie celów jako osiągnięte

#### Typy TypeScript
- `StreamStatus`: 'FLOWING' | 'FROZEN' | 'TEMPLATE'
- `StreamPattern`: 'project' | 'continuous' | 'reference' | 'client' | 'pipeline' | 'workspace' | 'custom'
- `GoalStatus`: 'active' | 'achieved' | 'failed' | 'paused'
- `PreciseGoal`: Pełny interfejs celu RZUT
- `SourceItem`: Elementy źródła (ex GTD Inbox)

#### Dokumentacja
- `docs/STREAMS_METODOLOGIA.md` - Kompletna dokumentacja metodologii STREAMS
- Mapowanie pojęć GTD → STREAMS
- API Reference dla nowych endpointów

### 🔄 Zmienione - Migracja z GTD

#### Terminologia
| Stare | Nowe |
|-------|------|
| GTD Bucket | Stream (Strumień) |
| Smart Score | Flow Score |
| Smart Analysis | Flow Analysis |
| Context | Tag |
| Inbox | Source (Źródło) |
| Horizons | Goals (Cele) |

#### Przekierowania (zachowana kompatybilność wsteczna)
- `/gtd/inbox` → `/crm/dashboard/source`
- `/gtd/contexts` → `/crm/dashboard/tags`
- `/gtd/someday-maybe` → `/crm/dashboard/streams?status=frozen`
- `/gtd/waiting-for` → `/crm/dashboard/tasks?status=waiting`
- `/gtd/next-actions` → `/crm/dashboard/tasks`
- `/gtd-buckets` → `/crm/dashboard/streams`
- `/gtd-horizons` → `/crm/dashboard/goals`
- `/gtd-streams` → `/crm/dashboard/streams`
- `/gtd-map` → `/crm/dashboard/streams-map`

### 🗑️ Usunięte
- Stare strony GTD (zastąpione przekierowaniami)
- Usunięto ~10,685 linii starego kodu GTD

### 🧪 Testy
- Testy jednostkowe dla GoalCard
- Testy dla StreamStatusBadge
- Testy dla StreamPatternBadge
- Konfiguracja skryptów testowych (npm test, npm run test:watch)

## [1.1.0] - 2025-06-18

### ✨ Dodane
- **Git Flow Strategy** - Pełna implementacja strategii branchy dla rozwoju wielowersyjnego
- **Multi-Version Deployment** - Możliwość równoległego uruchamiania V1 i V2
- **Skrypty Automatyzacji**:
  - `git-workflow.sh` - zarządzanie branchami i workflow
  - `deploy-versions.sh` - automatyczny deployment wersji
- **Dokumentacja wielowersyjna** - zaktualizowana dokumentacja techniczna i manual użytkownika
- **Nginx Multi-Routing** - obsługa `/crm/` dla V1 i `/crm2/` dla V2

### 🔧 Zmienione
- Struktura URL - V1 pozostaje na znanym `/crm/`, V2 na nowym `/crm2/`
- Konfiguracja środowisk - osobne `.env.v1` i `.env.v2`
- Docker Compose - osobne pliki dla każdej wersji
- Dokumentacja - dodane sekcje o Git Flow i multi-version

### 🐛 Naprawione
- Błąd podwójnej ścieżki API (`/api/api/v1/`)
- Problem z przekierowaniami po zalogowaniu
- Błędy CORS w konfiguracji Nginx
- Problemy z WebSocket dla Next.js HMR

## [1.0.1] - 2025-06-18

### 🐛 Naprawione
- **Błąd logowania** - naprawiono problem z błędem 500 przy logowaniu
- **Routing Frontend** - poprawiono wszystkie linki w menu nawigacyjnym
- **Backend TSX Loader** - zmiana z `--loader tsx` na `--import tsx` dla Node.js 22
- **Konfiguracja Nginx** - poprawione proxy_pass dla właściwych portów

### 🔧 Zmienione
- Zmienne środowiskowe - utworzono kompletny plik `.env`
- Bazy danych - skonfigurowano PostgreSQL i Redis w Docker

### ✨ Dodane
- **Polska dokumentacja** - kompletna dokumentacja techniczna (DOKUMENTACJA_PL.md)
- **Polski manual użytkownika** - szczegółowy przewodnik (MANUAL_UZYTKOWNIKA.md)

## [1.0.0] - 2025-06-17

### ✨ Pierwsze wydanie
- **Moduł GTD** - pełna implementacja metodologii Getting Things Done
- **Moduł CRM** - zarządzanie firmami, kontaktami i pipeline sprzedażowy
- **Projekty SMART** - automatyczna analiza celów według kryteriów SMART
- **Multi-tenant SaaS** - architektura z Row Level Security
- **Autoryzacja JWT** - bezpieczne tokeny dostępu i odświeżania
- **Real-time współpraca** - aktualizacje na żywo między użytkownikami
- **Dashboard analityczny** - metryki i KPI w czasie rzeczywistym

### 🏗️ Infrastruktura
- Frontend: Next.js 14.2.30 z App Router
- Backend: Express.js z TypeScript
- Bazy danych: PostgreSQL 14 + Redis 7
- ORM: Prisma 5.22.0
- Deployment: Docker + Nginx

---

## Konwencje wersjonowania

### Numery wersji
- **MAJOR.MINOR.PATCH** (np. 1.2.3)
- **MAJOR**: niekompatybilne zmiany API
- **MINOR**: nowe funkcjonalności kompatybilne wstecz
- **PATCH**: poprawki błędów kompatybilne wstecz

### Tagi
- **v1.x.x** - wersje produkcyjne (branch production-v1)
- **v2.x.x-beta** - wersje rozwojowe (branch develop-v2)
- **hotfix-x.x.x** - krytyczne poprawki

### Kategorie zmian
- ✨ **Dodane** - nowe funkcjonalności
- 🔧 **Zmienione** - zmiany w istniejących funkcjonalnościach
- 🗑️ **Usunięte** - usunięte funkcjonalności
- 🐛 **Naprawione** - poprawki błędów
- 🔒 **Bezpieczeństwo** - poprawki bezpieczeństwa
- ⚡ **Wydajność** - optymalizacje wydajności

---

*Changelog jest aktualizowany przy każdym znaczącym wydaniu.*