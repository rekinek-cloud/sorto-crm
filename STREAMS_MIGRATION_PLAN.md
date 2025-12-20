# STREAMS MIGRATION PLAN
## Plan wdrożenia metodologii SORTO STREAMS w streams.work (B2B CRM)

---

## 1. PODSUMOWANIE ANALIZY

### 1.1 Obecny stan
- **Nazwa projektu**: crm-gtd-smart (do zmiany na streams-work)
- **Architektura**: Next.js frontend + Node.js backend + PostgreSQL + Redis
- **Kontenery Docker**: 5 (backend, frontend, postgres, redis, voice-tts)

### 1.2 Elementy wymagające migracji

| Kategoria | Obecne (GTD/SMART) | Docelowe (STREAMS) |
|-----------|-------------------|-------------------|
| Inbox | GTD Inbox | Źródło (Source) |
| Next Actions | Kolejne działania | Zadania w strumieniu |
| Waiting For | Oczekuje na | Status: Oczekuje |
| Someday/Maybe | Kiedyś/Może | Strumień zamrożony |
| Contexts | Konteksty GTD | Tagi/Filtry |
| Areas | Obszary | Strumienie ciągłe |
| Projects | Projekty | Strumienie projektowe |
| SMART Goals | Cele SMART | Cele Precyzyjne (RZUT) |
| Smart Score | smartScore | streamScore |

---

## 2. MAPOWANIE TERMINOLOGII

### 2.1 Terminologia UI (do zmiany w całym projekcie)

| Stare (EN) | Stare (PL) | Nowe (PL) | Nowe (EN) |
|------------|------------|-----------|-----------|
| Inbox | Skrzynka odbiorcza | Źródło | Source |
| Next Actions | Kolejne działania | Zadania aktywne | Active Tasks |
| Waiting For | Oczekuje na | Status: Oczekuje | Status: Waiting |
| Someday/Maybe | Kiedyś/Może | Zamrożone | Frozen |
| Context | Kontekst | Tag | Tag |
| Area | Obszar | Strumień ciągły | Continuous Stream |
| Project | Projekt | Strumień projektowy | Project Stream |
| Archive | Archiwum | Zamrożone | Frozen |
| Active | Aktywny | Płynie | Flowing |
| GTD Map | Mapa GTD | Mapa Strumieni | Streams Map |
| Weekly Review | Przegląd tygodniowy | Przegląd tygodniowy | Weekly Review |
| SMART Goal | Cel SMART | Cel Precyzyjny | Precise Goal |

### 2.2 Statusy strumieni

| Obecny status | Nowy status | Ikona SVG |
|---------------|-------------|-----------|
| ACTIVE | FLOWING | wave-flowing |
| ARCHIVED | FROZEN | snowflake |
| TEMPLATE | TEMPLATE | template |
| ON_HOLD | FROZEN | snowflake |

### 2.3 Role GTD → Wzorce strumieni

| GTDRole (usunąć) | Wzorzec strumienia |
|------------------|-------------------|
| INBOX | (usunąć - to Źródło) |
| NEXT_ACTIONS | (usunąć - to zadania) |
| WAITING_FOR | (usunąć - to status) |
| SOMEDAY_MAYBE | pattern: 'frozen' |
| PROJECTS | pattern: 'project' |
| CONTEXTS | (usunąć - to tagi) |
| AREAS | pattern: 'continuous' |
| REFERENCE | pattern: 'reference' |

---

## 3. ZMIANY W KODZIE

### 3.1 Frontend - Pliki do modyfikacji

#### Typy (Types)
```
packages/frontend/src/types/gtd.ts
  - Usunąć enum GTDRole
  - Zmienić StreamType na StreamPattern
  - Zmienić status 'ACTIVE' → 'FLOWING', 'ARCHIVED' → 'FROZEN'
  - Usunąć smartScore → streamScore
```

#### API
```
packages/frontend/src/lib/api/gtd.ts → streams.ts
packages/frontend/src/lib/api/gtdInbox.ts → source.ts
packages/frontend/src/lib/api/gtdStreams.ts → streams.ts (merge)
packages/frontend/src/lib/api/gtdMapViews.ts → streamsMapViews.ts
packages/frontend/src/lib/api/smartDayPlanner.ts → dayPlanner.ts
packages/frontend/src/lib/api/smart.ts → analysis.ts
```

#### Komponenty
```
packages/frontend/src/components/gtd/ → packages/frontend/src/components/streams/
packages/frontend/src/components/shared/GTDContextBadge.tsx → TagBadge.tsx
packages/frontend/src/components/smart-day-planner/ → day-planner/
```

#### Strony (App Router)
```
/dashboard/gtd/ → /dashboard/streams/
/dashboard/gtd/next-actions → (usunąć, użyć filtra w /tasks)
/dashboard/gtd/waiting-for → (usunąć, użyć filtra w /tasks)
/dashboard/gtd/someday-maybe → /dashboard/streams/frozen
/dashboard/gtd/contexts → /dashboard/tags
/dashboard/gtd-streams → /dashboard/streams
/dashboard/gtd-map → /dashboard/streams-map
/dashboard/gtd-buckets → (usunąć)
/dashboard/gtd-horizons → /dashboard/goals
/dashboard/smart-* → /dashboard/* (bez prefiksu smart)
```

### 3.2 Backend - Pliki do modyfikacji

```
packages/backend/src/routes/gtd.ts → streams.ts
packages/backend/src/routes/gtdInbox.ts → source.ts
packages/backend/src/routes/gtdStreams.ts → streams.ts (merge)
packages/backend/src/routes/gtdMapViews.ts → streamsMap.ts
packages/backend/src/routes/gtdHorizons.ts → goals.ts
packages/backend/src/routes/smartDayPlanner.ts → dayPlanner.ts
packages/backend/src/routes/smart.ts → analysis.ts
packages/backend/src/routes/smartMailboxes.ts → mailboxes.ts
packages/backend/src/services/GTDProcessingRuleEngine.ts → StreamsRuleEngine.ts
```

### 3.3 Baza danych - Migracje

```sql
-- Zmiana nazw tabel (opcjonalne, można zostawić wewnętrzne)
-- Zmiana enumów
ALTER TYPE "StreamStatus" RENAME VALUE 'ACTIVE' TO 'FLOWING';
ALTER TYPE "StreamStatus" RENAME VALUE 'ARCHIVED' TO 'FROZEN';

-- Dodanie pola pattern do streams
ALTER TABLE "streams" ADD COLUMN "pattern" VARCHAR(50);
-- Wartości: 'project', 'continuous', 'reference', 'client', 'pipeline'

-- Usunięcie kolumn GTD-specific
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "gtdRole";
ALTER TABLE "streams" DROP COLUMN IF EXISTS "gtdRole";

-- Zmiana smartScore na streamScore
ALTER TABLE "tasks" RENAME COLUMN "smartScore" TO "streamScore";
ALTER TABLE "projects" RENAME COLUMN "smartScore" TO "streamScore";
```

---

## 4. ZMIANY W INTERFEJSIE

### 4.1 Ikony - Zamiana Emoji na SVG (Phosphor Icons)

| Element | Stare (Emoji) | Nowe (Phosphor Icon) |
|---------|---------------|---------------------|
| Źródło | ⚪ | `<CircleDashed weight="duotone" />` |
| Strumień płynący | 🌊 | `<Waves weight="duotone" />` |
| Strumień zamrożony | ❄️ | `<Snowflake weight="duotone" />` |
| Zadanie | ✅/📋 | `<CheckSquare weight="duotone" />` |
| Projekt | 📁 | `<FolderSimple weight="duotone" />` |
| Klient | 🏢 | `<Buildings weight="duotone" />` |
| Kontakt | 👤 | `<User weight="duotone" />` |
| Email | 📧 | `<Envelope weight="duotone" />` |
| Telefon | 📞 | `<Phone weight="duotone" />` |
| Spotkanie | 🤝 | `<Handshake weight="duotone" />` |
| Cel | 🎯 | `<Target weight="duotone" />` |
| AI sugestia | 🤖 | `<Robot weight="duotone" />` |
| Ostrzeżenie | ⚠️ | `<Warning weight="duotone" />` |
| Sukces | ✓ | `<Check weight="bold" />` |
| Priorytet wysoki | 🔴 | `<Circle weight="fill" className="text-red-500" />` |
| Priorytet średni | 🟡 | `<Circle weight="fill" className="text-yellow-500" />` |
| Priorytet niski | 🔵 | `<Circle weight="fill" className="text-blue-500" />` |

### 4.2 Nowa nawigacja główna

```typescript
const navigation = [
  {
    name: 'Pulpit',
    href: '/crm/dashboard',
    icon: House,
  },
  {
    name: 'Źródło',
    href: '/crm/dashboard/source',
    icon: CircleDashed,
    badge: 'count', // liczba elementów w źródle
  },
  {
    name: 'Strumienie',
    icon: Waves,
    children: [
      { name: 'Wszystkie strumienie', href: '/crm/dashboard/streams', icon: Waves },
      { name: 'Mapa strumieni', href: '/crm/dashboard/streams-map', icon: TreeStructure },
      { name: 'Zamrożone', href: '/crm/dashboard/streams/frozen', icon: Snowflake },
    ],
  },
  {
    name: 'Zadania',
    href: '/crm/dashboard/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Kalendarz',
    href: '/crm/dashboard/calendar',
    icon: Calendar,
  },
  {
    name: 'CRM',
    icon: Buildings,
    children: [
      { name: 'Firmy', href: '/crm/dashboard/companies', icon: Buildings },
      { name: 'Kontakty', href: '/crm/dashboard/contacts', icon: Users },
      { name: 'Pipeline', href: '/crm/dashboard/pipeline', icon: Funnel },
      { name: 'Transakcje', href: '/crm/dashboard/deals', icon: Handshake },
    ],
  },
  {
    name: 'Komunikacja',
    icon: Envelope,
    children: [
      { name: 'Skrzynki', href: '/crm/dashboard/mailboxes', icon: Tray },
      { name: 'Kanały', href: '/crm/dashboard/channels', icon: ChatCircle },
    ],
  },
  {
    name: 'Cele',
    href: '/crm/dashboard/goals',
    icon: Target,
  },
  {
    name: 'Przeglądy',
    icon: ChartBar,
    children: [
      { name: 'Tygodniowy', href: '/crm/dashboard/reviews/weekly', icon: CalendarBlank },
      { name: 'Miesięczny', href: '/crm/dashboard/reviews/monthly', icon: Calendar },
    ],
  },
  {
    name: 'AI & Reguły',
    icon: Robot,
    children: [
      { name: 'Reguły automatyzacji', href: '/crm/dashboard/rules', icon: Gear },
      { name: 'Asystent AI', href: '/crm/dashboard/ai-assistant', icon: Robot },
    ],
  },
  {
    name: 'Ustawienia',
    href: '/crm/dashboard/settings',
    icon: Gear,
  },
];
```

### 4.3 Kolorystyka strumieni

```typescript
const streamColors = {
  // Stany
  flowing: 'bg-blue-500',    // płynący
  frozen: 'bg-slate-400',    // zamrożony

  // Wzorce
  project: 'bg-purple-500',   // projektowy
  continuous: 'bg-green-500', // ciągły
  reference: 'bg-amber-500',  // referencyjny
  client: 'bg-indigo-500',    // klient
  pipeline: 'bg-rose-500',    // pipeline
};
```

---

## 5. CELE PRECYZYJNE (RZUT)

### 5.1 Nowy model celów

```typescript
interface PreciseGoal {
  id: string;

  // RZUT
  result: string;        // R - Rezultat: Co konkretnie powstanie?
  measurement: string;   // Z - Zmierzalność: Po czym poznam sukces?
  deadline: Date;        // U - Ujście: Do kiedy?
  background: string;    // T - Tło: Dlaczego ten cel?

  // Relacje
  streamId?: string;     // Powiązany strumień

  // Metryki
  currentValue: number;
  targetValue: number;
  unit: string;

  // Status
  status: 'active' | 'achieved' | 'failed' | 'paused';
}
```

### 5.2 UI dla celów

```
Dashboard celów:
┌─────────────────────────────────────────────────────────────┐
│ CELE Q1 2025                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nowi klienci B2B                                           │
│ R: 15 nowych klientów z sektora IT                         │
│ Z: Zamknięte deale w pipeline                              │
│ U: 31.03.2025                                              │
│ T: Osiągnięcie 200K przychodu                              │
│                                                             │
│ [████████████░░░░░░░░] 12/15 (80%)    45 dni do deadline   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. FAZY WDROŻENIA (zadania atomowe)

### FAZA 0: Backup i procedura rollback (KRYTYCZNE)

#### 0.1 Pełny backup przed migracją
```bash
# Utworzenie katalogu backup
mkdir -p /opt/crm-gtd-smart/backups/pre-streams-migration-$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/crm-gtd-smart/backups/pre-streams-migration-$(date +%Y%m%d_%H%M%S)"

# 1. Backup bazy danych
docker exec crm-postgres-v1 pg_dump -U user -d crm_gtd_v1 > $BACKUP_DIR/database.sql

# 2. Backup kodu (git stash + tag)
cd /opt/crm-gtd-smart
git stash
git tag pre-streams-migration-backup

# 3. Backup plików konfiguracyjnych
cp docker-compose.v1.yml $BACKUP_DIR/
cp .env.production $BACKUP_DIR/
cp -r packages/backend/prisma $BACKUP_DIR/prisma-backup

# 4. Backup volumes Docker (opcjonalnie)
docker run --rm -v crm-gtd-smart_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres_volume.tar.gz /data
```

#### 0.2 Procedura ROLLBACK (w razie porażki)
```bash
BACKUP_DIR="/opt/crm-gtd-smart/backups/pre-streams-migration-XXXXXXXX"

# 1. Zatrzymaj kontenery
cd /opt/crm-gtd-smart
docker-compose -f docker-compose.v1.yml down

# 2. Przywróć kod z git
git checkout pre-streams-migration-backup
git stash pop  # jeśli były zmiany

# 3. Przywróć bazę danych
docker-compose -f docker-compose.v1.yml up -d crm-postgres-v1
sleep 10
docker exec -i crm-postgres-v1 psql -U user -d crm_gtd_v1 < $BACKUP_DIR/database.sql

# 4. Przywróć konfigurację
cp $BACKUP_DIR/docker-compose.v1.yml ./
cp $BACKUP_DIR/.env.production ./

# 5. Rebuild i restart
docker-compose -f docker-compose.v1.yml up -d --build

# 6. Weryfikacja
curl -s http://localhost:3004/api/health
curl -s http://localhost:9025/
```

#### 0.3 Punkty kontrolne (checkpoints)
Po każdej fazie wykonaj commit z tagiem:
```bash
git add -A
git commit -m "STREAMS Migration: Faza X completed"
git tag streams-migration-phase-X
```

W razie problemu w fazie N:
```bash
git checkout streams-migration-phase-(N-1)
# przywróć bazę jeśli były zmiany DB
```

- [x] 0.1 Wykonanie pełnego backupu (2025-11-28 18:58)
- [x] 0.2 Weryfikacja backupu - SQL valid
- [x] 0.3 Dokumentacja ścieżki do backupu

**BACKUP LOCATION**: `/opt/crm-gtd-smart/backups/pre-streams-migration-20251128_185841/`
- `database.sql` (48MB) - pełny dump PostgreSQL
- `docker-compose.v1.yml` - konfiguracja Docker
- `.env.production` - zmienne środowiskowe
- `prisma-backup/` - schema Prisma
- **Git tag**: `pre-streams-migration-backup`

---

### FAZA 1: Przygotowanie
- [ ] 1.1 Backup bazy danych PostgreSQL (checkpoint)
- [ ] 1.2 Utworzenie brancha `feature/streams-migration`
- [ ] 1.3 Utworzenie pliku migracji SQL

### FAZA 2: Backend - Routes
- [ ] 2.1 Rename: `gtd.ts` → `streams.ts`
- [ ] 2.2 Rename: `gtdInbox.ts` → `source.ts`
- [ ] 2.3 Rename: `gtdStreams.ts` → merge do `streams.ts`
- [ ] 2.4 Rename: `gtdMapViews.ts` → `streamsMap.ts`
- [ ] 2.5 Rename: `gtdHorizons.ts` → `goals.ts`
- [ ] 2.6 Rename: `smartDayPlanner.ts` → `dayPlanner.ts`
- [ ] 2.7 Rename: `smartMailboxes.ts` → `mailboxes.ts`
- [ ] 2.8 Rename: `smart.ts` → `analysis.ts`
- [ ] 2.9 Aktualizacja `index.ts` (rejestracja routerów)

### FAZA 3: Backend - Serwisy
- [ ] 3.1 Rename: `GTDProcessingRuleEngine.ts` → `StreamsRuleEngine.ts`
- [ ] 3.2 Aktualizacja importów w serwisach
- [ ] 3.3 Zmiana nazw metod z GTD* na Streams*

### FAZA 4: Backend - Baza danych
- [ ] 4.1 Migracja: enum status ACTIVE → FLOWING
- [ ] 4.2 Migracja: enum status ARCHIVED → FROZEN
- [ ] 4.3 Dodanie kolumny `pattern` do tabeli streams
- [ ] 4.4 Rename kolumny `smartScore` → `streamScore` w tasks
- [ ] 4.5 Rename kolumny `smartScore` → `streamScore` w projects
- [ ] 4.6 Usunięcie kolumny `gtdRole` (jeśli istnieje)

### FAZA 5: Frontend - Typy
- [ ] 5.1 Aktualizacja `types/gtd.ts` → `types/streams.ts`
- [ ] 5.2 Usunięcie enum `GTDRole`
- [ ] 5.3 Zmiana `StreamType` → `StreamPattern`
- [ ] 5.4 Aktualizacja statusów: ACTIVE→FLOWING, ARCHIVED→FROZEN
- [ ] 5.5 Rename `smartScore` → `streamScore` w interfejsach

### FAZA 6: Frontend - API Clients
- [ ] 6.1 Rename: `lib/api/gtd.ts` → `streams.ts`
- [ ] 6.2 Rename: `lib/api/gtdInbox.ts` → `source.ts`
- [ ] 6.3 Rename: `lib/api/gtdStreams.ts` → merge do `streams.ts`
- [ ] 6.4 Rename: `lib/api/gtdMapViews.ts` → `streamsMap.ts`
- [ ] 6.5 Rename: `lib/api/smartDayPlanner.ts` → `dayPlanner.ts`
- [ ] 6.6 Rename: `lib/api/smart.ts` → `analysis.ts`
- [ ] 6.7 Aktualizacja endpointów w klientach API

### FAZA 7: Frontend - Komponenty (ikony)
- [ ] 7.1 `GTDContextBadge.tsx` - zamiana emoji na Phosphor Icons
- [ ] 7.2 `ProcessingModal.tsx` - zamiana emoji na ikony
- [ ] 7.3 `InboxItemCard.tsx` - zamiana emoji na ikony
- [ ] 7.4 `QuickCaptureModal.tsx` - zamiana emoji na ikony
- [ ] 7.5 `StreamItem.tsx` - zamiana emoji na ikony
- [ ] 7.6 `BucketViewCard.tsx` - zamiana emoji na ikony
- [ ] 7.7 `TaskItem.tsx` - zamiana emoji na ikony
- [ ] 7.8 `DailyWidget.tsx` - zamiana emoji na ikony

### FAZA 8: Frontend - Komponenty (nazewnictwo)
- [ ] 8.1 Rename folder: `components/gtd/` → `components/streams/`
- [ ] 8.2 Rename: `GTDContextBadge.tsx` → `TagBadge.tsx`
- [ ] 8.3 Rename folder: `smart-day-planner/` → `day-planner/`
- [ ] 8.4 Aktualizacja importów w komponentach
- [ ] 8.5 Zmiana tekstów "GTD" → "Streams" w UI
- [ ] 8.6 Zmiana tekstów "SMART" → "Precyzyjny" w UI
- [ ] 8.7 Zmiana "Inbox" → "Źródło" w UI
- [ ] 8.8 Zmiana "Someday/Maybe" → "Zamrożone" w UI

### FAZA 9: Frontend - Nawigacja
- [ ] 9.1 Aktualizacja `layout.tsx` - nowa struktura menu
- [ ] 9.2 Aktualizacja `MobileMenu.tsx`
- [ ] 9.3 Aktualizacja `MobileBottomNavigation.tsx`
- [ ] 9.4 Aktualizacja `CommandPalette.tsx`

### FAZA 10: Frontend - Strony (routing)
- [ ] 10.1 Rename: `app/dashboard/gtd/` → `app/dashboard/streams/`
- [ ] 10.2 Rename: `gtd-streams/` → merge do `streams/`
- [ ] 10.3 Rename: `gtd-map/` → `streams-map/`
- [ ] 10.4 Rename: `gtd-buckets/` → usunąć
- [ ] 10.5 Rename: `gtd-horizons/` → `goals/`
- [ ] 10.6 Rename: `smart-day-planner/` → `day-planner/`
- [ ] 10.7 Rename: `smart-mailboxes/` → `mailboxes/`
- [ ] 10.8 Rename: `smart-analysis/` → `analysis/`
- [ ] 10.9 Rename: `smart-templates/` → `templates/`
- [ ] 10.10 Usunięcie starych folderów

### FAZA 11: Frontend - Przekierowania
- [ ] 11.1 Dodanie redirects w `next.config.js`
- [ ] 11.2 Testowanie przekierowań

### FAZA 12: Cele Precyzyjne - Model
- [ ] 12.1 Utworzenie typu `PreciseGoal` (RZUT)
- [ ] 12.2 Utworzenie API client dla celów
- [ ] 12.3 Backend: endpoint GET /goals
- [ ] 12.4 Backend: endpoint POST /goals
- [ ] 12.5 Backend: endpoint PUT /goals/:id
- [ ] 12.6 Backend: endpoint DELETE /goals/:id

### FAZA 13: Cele Precyzyjne - UI
- [ ] 13.1 Komponent `GoalCard.tsx`
- [ ] 13.2 Komponent `GoalForm.tsx` (formularz RZUT)
- [ ] 13.3 Komponent `GoalProgressBar.tsx`
- [ ] 13.4 Strona `app/dashboard/goals/page.tsx`
- [ ] 13.5 Widget celów na dashboard

### FAZA 14: Testy jednostkowe
- [ ] 14.1 Testy typów streams
- [ ] 14.2 Testy API client streams
- [ ] 14.3 Testy API client source
- [ ] 14.4 Testy komponentu StreamItem
- [ ] 14.5 Testy komponentu GoalCard

### FAZA 15: Testy integracyjne API
- [ ] 15.1 Test endpoint /streams
- [ ] 15.2 Test endpoint /source
- [ ] 15.3 Test endpoint /goals
- [ ] 15.4 Test endpoint /tasks z nowymi statusami

### FAZA 16: Testy E2E
- [ ] 16.1 E2E: Flow Źródło → Routing do strumienia
- [ ] 16.2 E2E: Tworzenie strumienia z dopływami
- [ ] 16.3 E2E: Zamrażanie/odmrażanie strumienia
- [ ] 16.4 E2E: Tworzenie Celu Precyzyjnego (RZUT)
- [ ] 16.5 E2E: Pipeline sprzedaży
- [ ] 16.6 E2E: Przegląd tygodniowy
- [ ] 16.7 E2E: Nawigacja i routing
- [ ] 16.8 E2E: Responsywność mobile

### FAZA 17: QA i poprawki
- [ ] 17.1 Testy manualne UI
- [ ] 17.2 Testy wydajności
- [ ] 17.3 Poprawki błędów krytycznych
- [ ] 17.4 Poprawki błędów mniejszych

### FAZA 18: Dokumentacja
- [ ] 18.1 Aktualizacja README.md
- [ ] 18.2 Aktualizacja CLAUDE.md
- [ ] 18.3 Utworzenie CHANGELOG dla migracji
- [ ] 18.4 Manual użytkownika STREAMS

---

## 7. PLIKI DO USUNIĘCIA

```
# Pliki z nazewnictwem GTD do usunięcia/przemianowania:
packages/frontend/src/types/gtd.ts
packages/frontend/src/lib/api/gtd*.ts
packages/frontend/src/components/gtd/
packages/frontend/src/components/shared/GTDContextBadge.tsx
packages/frontend/src/app/dashboard/gtd/
packages/frontend/src/app/dashboard/gtd-*/

packages/backend/src/routes/gtd*.ts
packages/backend/src/types/gtd.ts
packages/backend/src/services/GTD*.ts

# Pliki dokumentacji z GTD:
GTD_*.md
MANUAL_GTD_*.md
```

---

## 8. KOMPATYBILNOŚĆ WSTECZNA

### 8.1 Przekierowania URL
```typescript
// middleware.ts lub redirects w next.config.js
const redirects = [
  { source: '/dashboard/gtd/:path*', destination: '/dashboard/streams/:path*' },
  { source: '/dashboard/gtd-streams', destination: '/dashboard/streams' },
  { source: '/dashboard/gtd-map', destination: '/dashboard/streams-map' },
  { source: '/dashboard/smart-day-planner', destination: '/dashboard/day-planner' },
];
```

### 8.2 API aliases (tymczasowe)
```typescript
// Backend - aliasy dla starych endpointów
router.use('/gtd', streamsRouter);       // deprecated
router.use('/gtdinbox', sourceRouter);   // deprecated
```

---

## 9. METRYKI SUKCESU

- [ ] Brak referencji do "GTD" w UI użytkownika
- [ ] Brak referencji do "SMART" w UI użytkownika
- [ ] Wszystkie emoji zastąpione ikonami SVG
- [ ] Nowa nawigacja zgodna ze STREAMS
- [ ] Cele Precyzyjne (RZUT) działające
- [ ] Testy przechodzą
- [ ] Dokumentacja zaktualizowana

---

## 10. RYZYKO I MITYGACJA

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Utrata danych przy migracji | Niskie | Wysoki | Pełny backup przed migracją |
| Broken links | Średnie | Średni | Przekierowania 301 |
| Regresje funkcjonalne | Średnie | Wysoki | Testy automatyczne |
| Dezorientacja użytkowników | Niskie | Niski | Changelog + dokumentacja |

---

**Data utworzenia**: 2025-11-28
**Autor**: Claude (AI Assistant)
**Wersja**: 1.0
