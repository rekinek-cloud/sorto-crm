# 🏢 SORTO CRM - Moduł HOLDING

> **Specyfikacja onboardingu grup kapitałowych**
> **Dla:** Claude Code
> **Wersja:** 1.0

---

## SPIS TREŚCI

1. [Koncepcja](#1-koncepcja)
2. [Model danych](#2-model-danych)
3. [Onboarding flow](#3-onboarding-flow)
4. [Starter streams](#4-starter-streams)
5. [Reguły widoczności](#5-reguły-widoczności)
6. [API Endpoints](#6-api-endpoints)
7. [UI Komponenty](#7-ui-komponenty)
8. [Logika biznesowa](#8-logika-biznesowa)
9. [Migracja](#9-migracja)
10. [Kolejność implementacji](#10-kolejność-implementacji)

---

## 1. KONCEPCJA

### Problem

```
GRUPA EVENTPRO:
├── EventPro Polska (stoiska)
├── EventPro Niemcy (stoiska DACH)
├── EventPro Digital (marketing)
└── EventPro Studio (video/foto)

BMW zleca różne rzeczy różnym spółkom.
Każda spółka powinna widzieć że to TEN SAM klient.
Ale projekty każdej spółki są IZOLOWANE.
```

### Rozwiązanie: Strumienie jako spoiwo

```
🌊 BMW (stream HOLDING - wszyscy widzą)
   │
   ├── 🌊 Stoisko Motor Show (dopływ - należy do PL)
   ├── 🌊 Kampania Q2 (dopływ - należy do DIG)
   └── 🌊 Video produktowe (dopływ - należy do STUDIO)

Każdy widzi "BMW" i że inni też tam pracują.
Ale swój dopływ edytuje tylko właściciel.
```

### Kluczowe zasady

| Zasada | Opis |
|--------|------|
| **Holding = parasolka** | Nie zatrudnia ludzi, tylko zarządza |
| **Spółka = operacje** | Tu są userzy, projekty, zadania |
| **Stream = spoiwo** | Łączy spółki wokół klienta/tematu |
| **Dopływ = izolacja** | Należy do spółki, widoczny dla holdingu |

---

## 2. MODEL DANYCH

### 2.1 Migracja SQL

```sql
-- ============================================
-- ROZSZERZENIE: organizations
-- ============================================

-- Typ organizacji
CREATE TYPE "OrgType" AS ENUM (
  'HOLDING',      -- grupa kapitałowa
  'SUBSIDIARY',   -- spółka w grupie
  'COMPANY'       -- samodzielna firma
);

-- Rola w holdingu
CREATE TYPE "HoldingRole" AS ENUM (
  'OWNER',        -- właściciel - pełen dostęp
  'ADMIN',        -- administrator grupy
  'FINANCE',      -- dostęp do finansów grupy
  'VIEWER'        -- tylko podgląd raportów
);

-- Rozszerzenie organizations
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "type" "OrgType" NOT NULL DEFAULT 'COMPANY',
  ADD COLUMN IF NOT EXISTS "parent_id" TEXT REFERENCES "organizations"("id"),
  ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN DEFAULT false;

-- Dostęp użytkowników do holdingu
CREATE TABLE "holding_access" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "holding_id" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "role" "HoldingRole" NOT NULL DEFAULT 'VIEWER',
  "granted_by_id" TEXT REFERENCES "users"("id"),
  "granted_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("user_id", "holding_id")
);

-- ============================================
-- ROZSZERZENIE: streams (widoczność)
-- ============================================

CREATE TYPE "StreamVisibility" AS ENUM (
  'PRIVATE',       -- tylko twórca
  'ORGANIZATION',  -- cała spółka
  'HOLDING',       -- cały holding
  'SPECIFIC'       -- wybrane organizacje
);

ALTER TABLE "streams"
  ADD COLUMN IF NOT EXISTS "visibility" "StreamVisibility" NOT NULL DEFAULT 'ORGANIZATION',
  ADD COLUMN IF NOT EXISTS "stream_type" TEXT DEFAULT 'GENERIC',
  ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN DEFAULT false;

-- Współdzielenie streamu z konkretnymi org
CREATE TABLE "stream_sharing" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "stream_id" TEXT NOT NULL REFERENCES "streams"("id") ON DELETE CASCADE,
  "organization_id" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "access_level" TEXT NOT NULL DEFAULT 'VIEW',
  "granted_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("stream_id", "organization_id")
);

-- ============================================
-- SZABLONY STRUMIENI (starter streams)
-- ============================================

CREATE TABLE "stream_templates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "industry_pack_id" TEXT REFERENCES "industry_packs"("id"),
  "level" TEXT NOT NULL, -- 'HOLDING' | 'SUBSIDIARY'
  "name" TEXT NOT NULL,
  "name_pattern" TEXT, -- np. "Targi {year}"
  "stream_type" TEXT NOT NULL,
  "visibility" "StreamVisibility" NOT NULL,
  "icon" TEXT,
  "color" TEXT,
  "sort_order" INT DEFAULT 0,
  "config" JSONB DEFAULT '{}',
  "is_system" BOOLEAN DEFAULT false
);

-- ============================================
-- INDEKSY
-- ============================================

CREATE INDEX "idx_organizations_parent" ON "organizations"("parent_id");
CREATE INDEX "idx_organizations_type" ON "organizations"("type");
CREATE INDEX "idx_holding_access_user" ON "holding_access"("user_id");
CREATE INDEX "idx_holding_access_holding" ON "holding_access"("holding_id");
CREATE INDEX "idx_streams_visibility" ON "streams"("visibility");
CREATE INDEX "idx_stream_sharing_stream" ON "stream_sharing"("stream_id");
CREATE INDEX "idx_stream_sharing_org" ON "stream_sharing"("organization_id");
```

### 2.2 Modele Prisma

```prisma
// ============================================
// ORGANIZACJE
// ============================================

model Organization {
  id                  String    @id @default(cuid())
  name                String
  type                OrgType   @default(COMPANY)
  
  // Hierarchia
  parentId            String?   @map("parent_id")
  parent              Organization? @relation("OrgHierarchy", fields: [parentId], references: [id])
  subsidiaries        Organization[] @relation("OrgHierarchy")
  
  // Konfiguracja
  industryPackId      String?   @map("industry_pack_id")
  industryPack        IndustryPack? @relation(fields: [industryPackId], references: [id])
  settings            Json      @default("{}")
  onboardingCompleted Boolean   @default(false) @map("onboarding_completed")
  
  // Relacje
  users               User[]
  streams             Stream[]
  projects            Project[]
  holdingAccess       HoldingAccess[] @relation("HoldingOrg")
  sharedStreams       StreamSharing[]
  
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  
  @@map("organizations")
}

enum OrgType {
  HOLDING
  SUBSIDIARY
  COMPANY
}

model HoldingAccess {
  id          String      @id @default(cuid())
  userId      String      @map("user_id")
  holdingId   String      @map("holding_id")
  role        HoldingRole @default(VIEWER)
  grantedById String?     @map("granted_by_id")
  grantedAt   DateTime    @default(now()) @map("granted_at")
  
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  holding     Organization @relation("HoldingOrg", fields: [holdingId], references: [id], onDelete: Cascade)
  grantedBy   User?       @relation("HoldingAccessGranter", fields: [grantedById], references: [id])
  
  @@unique([userId, holdingId])
  @@map("holding_access")
}

enum HoldingRole {
  OWNER
  ADMIN
  FINANCE
  VIEWER
}

// ============================================
// STRUMIENIE - rozszerzenie
// ============================================

model Stream {
  // ... istniejące pola ...
  
  // NOWE: widoczność
  visibility    StreamVisibility @default(ORGANIZATION)
  streamType    String?          @map("stream_type")
  isSystem      Boolean          @default(false) @map("is_system")
  
  // Współdzielenie
  sharedWith    StreamSharing[]
  
  @@map("streams")
}

enum StreamVisibility {
  PRIVATE       // tylko twórca
  ORGANIZATION  // cała spółka (default)
  HOLDING       // cały holding widzi
  SPECIFIC      // wybrane orgi (via StreamSharing)
}

model StreamSharing {
  id              String    @id @default(cuid())
  streamId        String    @map("stream_id")
  organizationId  String    @map("organization_id")
  accessLevel     String    @default("VIEW") // VIEW | EDIT | ADMIN
  grantedAt       DateTime  @default(now()) @map("granted_at")
  
  stream          Stream    @relation(fields: [streamId], references: [id], onDelete: Cascade)
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([streamId, organizationId])
  @@map("stream_sharing")
}

// ============================================
// SZABLONY STRUMIENI
// ============================================

model StreamTemplate {
  id              String    @id @default(cuid())
  industryPackId  String?   @map("industry_pack_id")
  level           String    // HOLDING | SUBSIDIARY
  name            String
  namePattern     String?   @map("name_pattern")
  streamType      String    @map("stream_type")
  visibility      StreamVisibility
  icon            String?
  color           String?
  sortOrder       Int       @default(0) @map("sort_order")
  config          Json      @default("{}")
  isSystem        Boolean   @default(false) @map("is_system")
  
  industryPack    IndustryPack? @relation(fields: [industryPackId], references: [id])
  
  @@map("stream_templates")
}
```

---

## 3. ONBOARDING FLOW

### 3.1 Kroki onboardingu

```
┌─────────────────────────────────────────────────────────────┐
│ KROK 1/5: PODSTAWOWE DANE                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Jak nazywa się Twoja firma/grupa?                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ EventPro Group                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Struktura:                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ Pojedyncza firma                                      │ │
│ │ ● Grupa firm / Holding                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Branża:                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎪 Targi / Eventy                                  [▼] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                          [Dalej →]         │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ KROK 2/5: SPÓŁKI W GRUPIE                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Jakie firmy wchodzą w skład grupy EventPro Group?          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 EventPro Polska                               [✎][🗑]│ │
│ │    Poznań • Produkcja stoisk targowych                  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🏢 EventPro Niemcy                               [✎][🗑]│ │
│ │    Berlin • Stoiska na rynek DACH                       │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🏢 EventPro Digital                              [✎][🗑]│ │
│ │    Warszawa • Marketing digital                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ Dodaj kolejną spółkę]                                   │
│                                                             │
│                                [← Wstecz]  [Dalej →]       │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ KROK 3/5: ZESPÓŁ                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Kto pracuje w poszczególnych spółkach?                     │
│                                                             │
│ 🏢 EVENTPRO POLSKA                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Ty (właściciel)                      Admin grupy     │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ✉️ jan@eventpro.pl              Rola: [PM          ▼]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ✉️ anna@eventpro.pl             Rola: [Projektant  ▼]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [+ Dodaj osobę]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🏢 EVENTPRO NIEMCY                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✉️ hans@eventpro.de             Rola: [Dyrektor   ▼]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [+ Dodaj osobę]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🏢 EVENTPRO DIGITAL                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✉️ maria@eventpro.digital       Rola: [PM          ▼]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [+ Dodaj osobę]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                [← Wstecz]  [Dalej →]       │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ KROK 4/5: KLIENCI (opcjonalne)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Masz już klientów do zaimportowania?                       │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ Tak, zaimportuj z pliku CSV/Excel                     │ │
│ │ ○ Tak, połącz z innym CRM                               │ │
│ │ ● Nie, dodam ręcznie później                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Dodaj kilku głównych klientów (opcjonalne):                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [BMW                    ] [Motoryzacja        ▼]       │ │
│ │ [Mercedes-Benz          ] [Motoryzacja        ▼]       │ │
│ │ [Bosch                  ] [Przemysł           ▼]       │ │
│ │ [+ Dodaj klienta]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ℹ️ Klienci będą widoczni dla wszystkich spółek w grupie   │
│                                                             │
│                                [← Wstecz]  [Dalej →]       │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ KROK 5/5: PODSUMOWANIE                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ Wszystko gotowe!                                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 TWOJA STRUKTURA:                                     │ │
│ │                                                         │ │
│ │ 🏛️ EventPro Group (holding)                            │ │
│ │    ├── 🏢 EventPro Polska      3 osoby                 │ │
│ │    ├── 🏢 EventPro Niemcy      1 osoba                 │ │
│ │    └── 🏢 EventPro Digital     1 osoba                 │ │
│ │                                                         │ │
│ │ 👥 Razem: 5 użytkowników                                │ │
│ │ 🏭 Klienci: 3 (wspólni dla grupy)                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🌊 UTWORZONE STRUMIENIE:                                │ │
│ │                                                         │ │
│ │ Poziom grupy (wszyscy widzą):                          │ │
│ │    🌊 Klienci                                          │ │
│ │    🌊 Targi 2025                                       │ │
│ │    🌊 Targi 2026                                       │ │
│ │                                                         │ │
│ │ EventPro Polska:     EventPro Niemcy:                  │ │
│ │    🌊 Projekty          🌊 Projekty                    │ │
│ │    🌊 Produkcja         🌊 Sprzedaż                    │ │
│ │                                                         │ │
│ │ EventPro Digital:                                      │ │
│ │    🌊 Kampanie                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🎪 Pakiet branżowy: Targi / Eventy                         │
│    • 3 typy projektów                                      │
│    • 21 zadań w szablonie stoiska                          │
│    • 8 recept na zmiany                                    │
│                                                             │
│                    [← Wstecz]  [🚀 Rozpocznij pracę]       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Typy onboardingu

```typescript
type OnboardingType = 'SINGLE_COMPANY' | 'HOLDING';

// SINGLE_COMPANY: uproszczony flow
// - Krok 1: Dane firmy + branża
// - Krok 2: Zespół
// - Krok 3: Klienci (opcja)
// - Krok 4: Gotowe

// HOLDING: pełny flow
// - Krok 1: Dane holdingu + branża
// - Krok 2: Spółki
// - Krok 3: Zespół per spółka
// - Krok 4: Klienci (opcja)
// - Krok 5: Podsumowanie
```

---

## 4. STARTER STREAMS

### 4.1 Definicja szablonów

```typescript
// types/streamTemplates.ts

export interface StreamTemplateDefinition {
  id: string;
  level: 'HOLDING' | 'SUBSIDIARY';
  name: string;
  namePattern?: string;  // np. "Targi {year}"
  streamType: StreamType;
  visibility: StreamVisibility;
  icon?: string;
  color?: string;
  sortOrder: number;
  children?: StreamTemplateDefinition[];  // zagnieżdżone
  config?: {
    autoPopulate?: string;  // np. 'TRADE_SHOW_CALENDAR'
    allowClientStreams?: boolean;
  };
}

export type StreamType = 
  | 'CLIENT_CONTAINER'      // kontener na klientów
  | 'CLIENT'                // pojedynczy klient
  | 'EVENT_CALENDAR'        // kalendarz (targi, terminy)
  | 'PROJECT_CONTAINER'     // kontener na projekty
  | 'PROJECT'               // pojedynczy projekt
  | 'OPERATIONS'            // operacje wewnętrzne
  | 'GENERIC';              // ogólny
```

### 4.2 Szablony per branża

```typescript
// seeds/streamTemplates/tradeShows.ts

export const TRADE_SHOWS_STREAM_TEMPLATES: StreamTemplateDefinition[] = [
  // ========== POZIOM HOLDING ==========
  {
    id: 'tpl_clients',
    level: 'HOLDING',
    name: 'Klienci',
    streamType: 'CLIENT_CONTAINER',
    visibility: 'HOLDING',
    icon: '👥',
    sortOrder: 1,
    config: {
      allowClientStreams: true
    }
  },
  {
    id: 'tpl_tradeshows_current',
    level: 'HOLDING',
    name: 'Targi {currentYear}',
    namePattern: 'Targi {year}',
    streamType: 'EVENT_CALENDAR',
    visibility: 'HOLDING',
    icon: '📅',
    sortOrder: 2,
    config: {
      autoPopulate: 'TRADE_SHOW_CALENDAR'
    }
  },
  {
    id: 'tpl_tradeshows_next',
    level: 'HOLDING',
    name: 'Targi {nextYear}',
    namePattern: 'Targi {year}',
    streamType: 'EVENT_CALENDAR',
    visibility: 'HOLDING',
    icon: '📅',
    sortOrder: 3
  },
  
  // ========== POZIOM SPÓŁKA ==========
  {
    id: 'tpl_sub_projects',
    level: 'SUBSIDIARY',
    name: 'Projekty',
    streamType: 'PROJECT_CONTAINER',
    visibility: 'ORGANIZATION',
    icon: '📁',
    sortOrder: 1
  },
  {
    id: 'tpl_sub_production',
    level: 'SUBSIDIARY',
    name: 'Produkcja',
    streamType: 'OPERATIONS',
    visibility: 'ORGANIZATION',
    icon: '🏭',
    sortOrder: 2
  },
  {
    id: 'tpl_sub_logistics',
    level: 'SUBSIDIARY',
    name: 'Logistyka',
    streamType: 'OPERATIONS',
    visibility: 'ORGANIZATION',
    icon: '🚛',
    sortOrder: 3
  }
];
```

```typescript
// seeds/streamTemplates/accounting.ts

export const ACCOUNTING_STREAM_TEMPLATES: StreamTemplateDefinition[] = [
  // ========== POZIOM HOLDING ==========
  {
    id: 'tpl_acc_clients',
    level: 'HOLDING',
    name: 'Klienci',
    streamType: 'CLIENT_CONTAINER',
    visibility: 'HOLDING',
    icon: '👥',
    sortOrder: 1
  },
  {
    id: 'tpl_acc_deadlines',
    level: 'HOLDING',
    name: 'Terminy ustawowe',
    streamType: 'EVENT_CALENDAR',
    visibility: 'HOLDING',
    icon: '⚠️',
    sortOrder: 2,
    config: {
      autoPopulate: 'STATUTORY_CALENDAR_PL'
    }
  },
  {
    id: 'tpl_acc_regulations',
    level: 'HOLDING',
    name: 'Przepisy i aktualizacje',
    streamType: 'GENERIC',
    visibility: 'HOLDING',
    icon: '📜',
    sortOrder: 3
  },
  
  // ========== POZIOM SPÓŁKA ==========
  {
    id: 'tpl_acc_sub_settlements',
    level: 'SUBSIDIARY',
    name: 'Rozliczenia',
    streamType: 'PROJECT_CONTAINER',
    visibility: 'ORGANIZATION',
    icon: '📊',
    sortOrder: 1
  },
  {
    id: 'tpl_acc_sub_hr',
    level: 'SUBSIDIARY',
    name: 'Kadry i płace',
    streamType: 'OPERATIONS',
    visibility: 'ORGANIZATION',
    icon: '👥',
    sortOrder: 2
  }
];
```

```typescript
// seeds/streamTemplates/education.ts

export const EDUCATION_STREAM_TEMPLATES: StreamTemplateDefinition[] = [
  // ========== POZIOM HOLDING ==========
  {
    id: 'tpl_edu_students',
    level: 'HOLDING',
    name: 'Uczniowie',
    streamType: 'CLIENT_CONTAINER',
    visibility: 'HOLDING',
    icon: '🎓',
    sortOrder: 1
  },
  {
    id: 'tpl_edu_calendar',
    level: 'HOLDING',
    name: 'Rok szkolny {currentSchoolYear}',
    streamType: 'EVENT_CALENDAR',
    visibility: 'HOLDING',
    icon: '📅',
    sortOrder: 2
  },
  {
    id: 'tpl_edu_processes',
    level: 'HOLDING',
    name: 'Procesy',
    streamType: 'GENERIC',
    visibility: 'HOLDING',
    icon: '⚙️',
    sortOrder: 3,
    children: [
      {
        id: 'tpl_edu_mediation',
        level: 'HOLDING',
        name: 'Mediacje',
        streamType: 'PROJECT_CONTAINER',
        visibility: 'HOLDING',
        icon: '🤝',
        sortOrder: 1
      },
      {
        id: 'tpl_edu_tutoring',
        level: 'HOLDING',
        name: 'Tutoring',
        streamType: 'PROJECT_CONTAINER',
        visibility: 'HOLDING',
        icon: '👨‍🏫',
        sortOrder: 2
      }
    ]
  },
  
  // ========== POZIOM SPÓŁKA (oddział) ==========
  {
    id: 'tpl_edu_sub_classes',
    level: 'SUBSIDIARY',
    name: 'Klasy',
    streamType: 'GENERIC',
    visibility: 'ORGANIZATION',
    icon: '🏫',
    sortOrder: 1
  }
];
```

### 4.3 Generator strumieni

```typescript
// services/streamGenerator.ts

import { prisma } from '../config/database';

interface GenerateStreamsOptions {
  holdingId: string;
  subsidiaryIds: string[];
  industryPackCode: string;
  createdById: string;
}

export class StreamGenerator {
  
  async generateStarterStreams(options: GenerateStreamsOptions) {
    const { holdingId, subsidiaryIds, industryPackCode, createdById } = options;
    
    // 1. Pobierz szablony dla branży
    const templates = await prisma.streamTemplate.findMany({
      where: {
        industryPack: { code: industryPackCode },
        isSystem: true
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    const createdStreams: string[] = [];
    
    // 2. Utwórz strumienie HOLDING level
    const holdingTemplates = templates.filter(t => t.level === 'HOLDING');
    
    for (const template of holdingTemplates) {
      const stream = await this.createStreamFromTemplate({
        template,
        organizationId: holdingId,
        createdById,
        variables: this.getVariables()
      });
      createdStreams.push(stream.id);
    }
    
    // 3. Utwórz strumienie SUBSIDIARY level (dla każdej spółki)
    const subsidiaryTemplates = templates.filter(t => t.level === 'SUBSIDIARY');
    
    for (const subId of subsidiaryIds) {
      for (const template of subsidiaryTemplates) {
        const stream = await this.createStreamFromTemplate({
          template,
          organizationId: subId,
          createdById,
          variables: this.getVariables()
        });
        createdStreams.push(stream.id);
      }
    }
    
    return {
      streamsCreated: createdStreams.length,
      streamIds: createdStreams
    };
  }
  
  private async createStreamFromTemplate(options: {
    template: StreamTemplate;
    organizationId: string;
    createdById: string;
    parentId?: string;
    variables: Record<string, string>;
  }) {
    const { template, organizationId, createdById, parentId, variables } = options;
    
    // Zamień zmienne w nazwie
    const name = this.interpolateName(template.namePattern || template.name, variables);
    
    const stream = await prisma.stream.create({
      data: {
        organizationId,
        createdById,
        parentId,
        name,
        streamType: template.streamType,
        visibility: template.visibility,
        icon: template.icon,
        color: template.color,
        isSystem: true,
        metadata: {
          templateId: template.id,
          config: template.config
        }
      }
    });
    
    // Jeśli ma auto-populate, uruchom
    if (template.config?.autoPopulate) {
      await this.autoPopulateStream(stream.id, template.config.autoPopulate);
    }
    
    return stream;
  }
  
  private interpolateName(pattern: string, variables: Record<string, string>): string {
    return pattern.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`);
  }
  
  private getVariables(): Record<string, string> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Rok szkolny: wrzesień-sierpień
    const schoolYear = currentMonth >= 8 
      ? `${currentYear}/${currentYear + 1}`
      : `${currentYear - 1}/${currentYear}`;
    
    return {
      currentYear: String(currentYear),
      nextYear: String(currentYear + 1),
      currentSchoolYear: schoolYear
    };
  }
  
  private async autoPopulateStream(streamId: string, populateType: string) {
    switch (populateType) {
      case 'TRADE_SHOW_CALENDAR':
        // Pobierz targi z bazy trade_shows i utwórz pod-strumienie
        // lub zostaw puste do ręcznego dodania
        break;
        
      case 'STATUTORY_CALENDAR_PL':
        // Utwórz pod-strumienie dla terminów ustawowych
        await this.createStatutoryDeadlines(streamId, 'PL');
        break;
    }
  }
  
  private async createStatutoryDeadlines(parentId: string, country: string) {
    const stream = await prisma.stream.findUnique({ where: { id: parentId } });
    if (!stream) return;
    
    // Terminy dla Polski
    const deadlines = [
      { name: 'JPK_VAT', day: 25, description: 'Miesięczny JPK_VAT' },
      { name: 'ZUS', day: 15, description: 'Składki ZUS' },
      { name: 'PIT-4R', day: 20, description: 'Zaliczki na PIT pracowników' },
      { name: 'CIT', day: 20, description: 'Zaliczka na CIT' }
    ];
    
    for (const deadline of deadlines) {
      await prisma.stream.create({
        data: {
          organizationId: stream.organizationId,
          createdById: stream.createdById,
          parentId: parentId,
          name: deadline.name,
          description: deadline.description,
          streamType: 'DEADLINE',
          visibility: stream.visibility,
          isSystem: true,
          metadata: {
            deadlineDay: deadline.day,
            recurring: 'monthly'
          }
        }
      });
    }
  }
}

export const streamGenerator = new StreamGenerator();
```

---

## 5. REGUŁY WIDOCZNOŚCI

### 5.1 Macierz dostępu

```
┌────────────────────┬──────────────┬────────────────┬─────────────────┐
│                    │ PRIVATE      │ ORGANIZATION   │ HOLDING         │
├────────────────────┼──────────────┼────────────────┼─────────────────┤
│ Twórca             │ ✅ Pełny     │ ✅ Pełny       │ ✅ Pełny        │
│ Ta sama spółka     │ ❌ Brak      │ ✅ Pełny       │ ✅ Pełny        │
│ Inna spółka grupy  │ ❌ Brak      │ ❌ Brak        │ 👁️ Podgląd      │
│ Holding admin      │ ❌ Brak      │ 👁️ Podgląd    │ ✅ Pełny        │
│ Spoza grupy        │ ❌ Brak      │ ❌ Brak        │ ❌ Brak         │
└────────────────────┴──────────────┴────────────────┴─────────────────┘

Legenda:
✅ Pełny = widzi, edytuje, zarządza
👁️ Podgląd = widzi, nie edytuje
❌ Brak = nie widzi w ogóle
```

### 5.2 Co oznacza "podgląd"

```typescript
// Dla streamu z visibility: HOLDING, inna spółka widzi:

interface StreamPreview {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  streamType: string;
  status: 'active' | 'frozen';
  
  // Statystyki (bez szczegółów)
  stats: {
    tasksTotal: number;
    tasksDone: number;
    progressPercent: number;
  };
  
  // Właściciel
  organization: {
    id: string;
    name: string;
  };
  
  // Kontakt
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  
  // BRAK:
  // - tasks[]
  // - notes[]
  // - files[]
  // - activities[] (poza tymi na poziomie klienta)
}
```

### 5.3 Middleware dostępu

```typescript
// middleware/streamAccess.ts

import { prisma } from '../config/database';

interface AccessResult {
  canView: boolean;
  canEdit: boolean;
  canManage: boolean;
  accessLevel: 'NONE' | 'PREVIEW' | 'VIEW' | 'EDIT' | 'ADMIN';
}

export async function checkStreamAccess(
  userId: string, 
  streamId: string
): Promise<AccessResult> {
  
  // 1. Pobierz stream z organizacją
  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
    include: {
      organization: {
        include: {
          parent: true  // holding jeśli jest
        }
      }
    }
  });
  
  if (!stream) {
    return { canView: false, canEdit: false, canManage: false, accessLevel: 'NONE' };
  }
  
  // 2. Pobierz usera z jego organizacją
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true,
      holdingAccess: true
    }
  });
  
  if (!user) {
    return { canView: false, canEdit: false, canManage: false, accessLevel: 'NONE' };
  }
  
  // 3. Sprawdź czy to twórca
  if (stream.createdById === userId) {
    return { canView: true, canEdit: true, canManage: true, accessLevel: 'ADMIN' };
  }
  
  // 4. Sprawdź widoczność
  switch (stream.visibility) {
    case 'PRIVATE':
      // Tylko twórca (sprawdzone wyżej)
      return { canView: false, canEdit: false, canManage: false, accessLevel: 'NONE' };
      
    case 'ORGANIZATION':
      // Cała spółka
      if (user.organizationId === stream.organizationId) {
        return { canView: true, canEdit: true, canManage: false, accessLevel: 'EDIT' };
      }
      // Holding admin widzi podgląd
      if (await isHoldingAdmin(user, stream.organization)) {
        return { canView: true, canEdit: false, canManage: false, accessLevel: 'PREVIEW' };
      }
      return { canView: false, canEdit: false, canManage: false, accessLevel: 'NONE' };
      
    case 'HOLDING':
      // Cały holding
      if (await isInSameHolding(user, stream.organization)) {
        // Ta sama spółka = pełny dostęp
        if (user.organizationId === stream.organizationId) {
          return { canView: true, canEdit: true, canManage: false, accessLevel: 'EDIT' };
        }
        // Holding admin = pełny dostęp
        if (await isHoldingAdmin(user, stream.organization)) {
          return { canView: true, canEdit: true, canManage: true, accessLevel: 'ADMIN' };
        }
        // Inna spółka = podgląd
        return { canView: true, canEdit: false, canManage: false, accessLevel: 'PREVIEW' };
      }
      return { canView: false, canEdit: false, canManage: false, accessLevel: 'NONE' };
      
    case 'SPECIFIC':
      // Sprawdź StreamSharing
      const sharing = await prisma.streamSharing.findUnique({
        where: {
          streamId_organizationId: {
            streamId: stream.id,
            organizationId: user.organizationId
          }
        }
      });
      
      if (sharing) {
        const canEdit = sharing.accessLevel === 'EDIT' || sharing.accessLevel === 'ADMIN';
        const canManage = sharing.accessLevel === 'ADMIN';
        return { 
          canView: true, 
          canEdit, 
          canManage, 
          accessLevel: sharing.accessLevel as any 
        };
      }
      return { canView: false, canEdit: false, canManage: false, accessLevel: 'NONE' };
  }
}

async function isInSameHolding(user: User, streamOrg: Organization): Promise<boolean> {
  // Znajdź holding dla obu
  const userHoldingId = user.organization.parentId || user.organizationId;
  const streamHoldingId = streamOrg.parentId || streamOrg.id;
  
  return userHoldingId === streamHoldingId;
}

async function isHoldingAdmin(user: User, streamOrg: Organization): Promise<boolean> {
  const holdingId = streamOrg.parentId || streamOrg.id;
  
  const access = await prisma.holdingAccess.findUnique({
    where: {
      userId_holdingId: {
        userId: user.id,
        holdingId
      }
    }
  });
  
  return access?.role === 'OWNER' || access?.role === 'ADMIN';
}
```

### 5.4 Filtrowanie w API

```typescript
// Przykład: GET /api/v1/streams

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true }
  });
  
  // Znajdź holding
  const holdingId = user.organization.parentId || user.organizationId;
  
  const streams = await prisma.stream.findMany({
    where: {
      OR: [
        // Moja organizacja
        { organizationId: user.organizationId },
        
        // HOLDING visibility + jestem w tym holdingu
        {
          visibility: 'HOLDING',
          organization: {
            OR: [
              { id: holdingId },
              { parentId: holdingId }
            ]
          }
        },
        
        // SPECIFIC + mam sharing
        {
          visibility: 'SPECIFIC',
          sharedWith: {
            some: { organizationId: user.organizationId }
          }
        }
      ]
    },
    include: {
      organization: { select: { id: true, name: true } },
      _count: { select: { tasks: true, children: true } }
    }
  });
  
  // Oznacz które są "moje" a które "podgląd"
  const enriched = streams.map(stream => ({
    ...stream,
    isOwned: stream.organizationId === user.organizationId,
    accessLevel: stream.organizationId === user.organizationId ? 'EDIT' : 'PREVIEW'
  }));
  
  res.json({ data: enriched });
});
```

---

## 6. API ENDPOINTS

### 6.1 Onboarding

```typescript
// routes/onboarding.ts

import { Router } from 'express';
import { prisma } from '../config/database';
import { streamGenerator } from '../services/streamGenerator';

const router = Router();

// POST /api/v1/onboarding/start
// Rozpocznij onboarding
router.post('/start', async (req, res) => {
  const { email, name } = req.body;
  
  // Utwórz tymczasowego usera lub użyj istniejącego
  // Zwróć token sesji onboardingu
  
  res.json({ 
    sessionId: '...',
    step: 1
  });
});

// POST /api/v1/onboarding/step1
// Dane podstawowe + typ (single/holding) + branża
router.post('/step1', async (req, res) => {
  const { sessionId, name, type, industryPackCode } = req.body;
  
  // Zapisz w sesji
  await saveOnboardingData(sessionId, { name, type, industryPackCode });
  
  res.json({ 
    success: true,
    nextStep: type === 'HOLDING' ? 2 : 3  // holding → spółki, single → zespół
  });
});

// POST /api/v1/onboarding/step2
// Spółki (tylko dla holding)
router.post('/step2', async (req, res) => {
  const { sessionId, subsidiaries } = req.body;
  
  // subsidiaries: [{ name, location, profile }]
  await saveOnboardingData(sessionId, { subsidiaries });
  
  res.json({ success: true, nextStep: 3 });
});

// POST /api/v1/onboarding/step3
// Zespół
router.post('/step3', async (req, res) => {
  const { sessionId, teams } = req.body;
  
  // teams: { [subsidiaryIndex]: [{ email, role }] }
  await saveOnboardingData(sessionId, { teams });
  
  res.json({ success: true, nextStep: 4 });
});

// POST /api/v1/onboarding/step4
// Klienci (opcjonalne)
router.post('/step4', async (req, res) => {
  const { sessionId, clients, skipClients } = req.body;
  
  if (!skipClients) {
    await saveOnboardingData(sessionId, { clients });
  }
  
  res.json({ success: true, nextStep: 5 });
});

// POST /api/v1/onboarding/complete
// Finalizacja - utwórz wszystko
router.post('/complete', async (req, res) => {
  const { sessionId } = req.body;
  
  const data = await getOnboardingData(sessionId);
  
  // 1. Utwórz holding (lub pojedynczą firmę)
  const holding = await prisma.organization.create({
    data: {
      name: data.name,
      type: data.type === 'HOLDING' ? 'HOLDING' : 'COMPANY',
      industryPackId: data.industryPackCode
    }
  });
  
  // 2. Utwórz spółki (jeśli holding)
  const subsidiaryIds: string[] = [];
  
  if (data.type === 'HOLDING' && data.subsidiaries) {
    for (const sub of data.subsidiaries) {
      const subsidiary = await prisma.organization.create({
        data: {
          name: sub.name,
          type: 'SUBSIDIARY',
          parentId: holding.id,
          settings: {
            location: sub.location,
            profile: sub.profile
          }
        }
      });
      subsidiaryIds.push(subsidiary.id);
    }
  }
  
  // 3. Utwórz użytkowników
  // ... (przypisz do odpowiednich organizacji)
  
  // 4. Wygeneruj starter streams
  await streamGenerator.generateStarterStreams({
    holdingId: holding.id,
    subsidiaryIds,
    industryPackCode: data.industryPackCode,
    createdById: req.user.id
  });
  
  // 5. Utwórz klientów (jeśli podano)
  if (data.clients) {
    const clientsStream = await prisma.stream.findFirst({
      where: {
        organizationId: holding.id,
        streamType: 'CLIENT_CONTAINER'
      }
    });
    
    for (const client of data.clients) {
      await prisma.stream.create({
        data: {
          organizationId: holding.id,
          parentId: clientsStream?.id,
          name: client.name,
          streamType: 'CLIENT',
          visibility: 'HOLDING',
          createdById: req.user.id,
          metadata: {
            industry: client.industry
          }
        }
      });
    }
  }
  
  // 6. Oznacz onboarding jako zakończony
  await prisma.organization.update({
    where: { id: holding.id },
    data: { onboardingCompleted: true }
  });
  
  res.json({
    success: true,
    holdingId: holding.id,
    subsidiaryIds,
    redirectTo: '/dashboard'
  });
});

export default router;
```

### 6.2 Holding management

```typescript
// routes/holding.ts

import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

// GET /api/v1/holding
// Pobierz strukturę holdingu
router.get('/', authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { organization: true }
  });
  
  const holdingId = user.organization.parentId || user.organizationId;
  
  const holding = await prisma.organization.findUnique({
    where: { id: holdingId },
    include: {
      subsidiaries: {
        include: {
          _count: { select: { users: true, streams: true, projects: true } }
        }
      },
      industryPack: true,
      _count: { select: { users: true } }
    }
  });
  
  res.json({ data: holding });
});

// POST /api/v1/holding/subsidiaries
// Dodaj nową spółkę
router.post('/subsidiaries', authenticateToken, requireHoldingAdmin, async (req, res) => {
  const { name, location, profile } = req.body;
  const holdingId = req.holdingId;
  
  const subsidiary = await prisma.organization.create({
    data: {
      name,
      type: 'SUBSIDIARY',
      parentId: holdingId,
      settings: { location, profile }
    }
  });
  
  // Wygeneruj starter streams dla nowej spółki
  await streamGenerator.generateSubsidiaryStreams({
    holdingId,
    subsidiaryId: subsidiary.id,
    createdById: req.user.id
  });
  
  res.json({ data: subsidiary });
});

// GET /api/v1/holding/clients
// Wszyscy klienci grupy
router.get('/clients', authenticateToken, async (req, res) => {
  const holdingId = req.holdingId;
  
  const clients = await prisma.stream.findMany({
    where: {
      streamType: 'CLIENT',
      visibility: 'HOLDING',
      organization: {
        OR: [
          { id: holdingId },
          { parentId: holdingId }
        ]
      }
    },
    include: {
      children: {
        select: {
          id: true,
          name: true,
          organization: { select: { id: true, name: true } },
          _count: { select: { tasks: true } }
        }
      },
      _count: { select: { activities: true } }
    }
  });
  
  res.json({ data: clients });
});

// GET /api/v1/holding/dashboard
// Dashboard grupowy
router.get('/dashboard', authenticateToken, requireHoldingAccess, async (req, res) => {
  const holdingId = req.holdingId;
  
  // Statystyki per spółka
  const subsidiaries = await prisma.organization.findMany({
    where: { parentId: holdingId },
    include: {
      projects: {
        where: { status: { not: 'COMPLETED' } },
        select: { id: true, value: true, status: true }
      },
      _count: {
        select: {
          users: true,
          projects: true
        }
      }
    }
  });
  
  // Agregacje
  const stats = {
    totalSubsidiaries: subsidiaries.length,
    totalUsers: subsidiaries.reduce((sum, s) => sum + s._count.users, 0),
    totalActiveProjects: subsidiaries.reduce((sum, s) => sum + s.projects.length, 0),
    totalValue: subsidiaries.reduce((sum, s) => 
      sum + s.projects.reduce((pSum, p) => pSum + (Number(p.value) || 0), 0)
    , 0),
    perSubsidiary: subsidiaries.map(s => ({
      id: s.id,
      name: s.name,
      users: s._count.users,
      activeProjects: s.projects.length,
      value: s.projects.reduce((sum, p) => sum + (Number(p.value) || 0), 0)
    }))
  };
  
  res.json({ data: stats });
});

export default router;
```

---

## 7. UI KOMPONENTY

### 7.1 Onboarding wizard

```tsx
// components/onboarding/OnboardingWizard.tsx

import { useState } from 'react';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2Subsidiaries } from './steps/Step2Subsidiaries';
import { Step3Team } from './steps/Step3Team';
import { Step4Clients } from './steps/Step4Clients';
import { Step5Summary } from './steps/Step5Summary';

interface OnboardingData {
  name: string;
  type: 'COMPANY' | 'HOLDING';
  industryPackCode: string;
  subsidiaries: Subsidiary[];
  teams: Record<number, TeamMember[]>;
  clients: Client[];
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  
  const totalSteps = data.type === 'HOLDING' ? 5 : 4;
  
  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };
  
  const nextStep = () => {
    if (step === 1 && data.type !== 'HOLDING') {
      setStep(3); // Skip subsidiaries for single company
    } else {
      setStep(s => s + 1);
    }
  };
  
  const prevStep = () => {
    if (step === 3 && data.type !== 'HOLDING') {
      setStep(1);
    } else {
      setStep(s => s - 1);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                i + 1 <= step ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-500 rounded transition-all"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Steps */}
      {step === 1 && (
        <Step1BasicInfo
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
        />
      )}
      
      {step === 2 && data.type === 'HOLDING' && (
        <Step2Subsidiaries
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      
      {step === 3 && (
        <Step3Team
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      
      {step === 4 && (
        <Step4Clients
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      
      {step === 5 && (
        <Step5Summary
          data={data}
          onBack={prevStep}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
```

### 7.2 Stream z oznaczeniem widoczności

```tsx
// components/streams/StreamCard.tsx

interface StreamCardProps {
  stream: Stream;
  isOwned: boolean;
  accessLevel: 'PREVIEW' | 'VIEW' | 'EDIT' | 'ADMIN';
}

export function StreamCard({ stream, isOwned, accessLevel }: StreamCardProps) {
  return (
    <div className={`
      rounded-lg border p-4 
      ${isOwned ? 'border-blue-200 bg-white' : 'border-gray-200 bg-gray-50'}
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {stream.icon && <span className="text-xl">{stream.icon}</span>}
          <h3 className="font-medium">{stream.name}</h3>
        </div>
        
        {/* Badge widoczności */}
        <div className="flex items-center gap-2">
          {stream.visibility === 'HOLDING' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              Grupa
            </span>
          )}
          
          {!isOwned && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {stream.organization.name}
            </span>
          )}
        </div>
      </div>
      
      {/* Statystyki */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{stream._count.tasks} zadań</span>
        <span>{stream._count.children} pod-strumieni</span>
      </div>
      
      {/* Preview mode info */}
      {accessLevel === 'PREVIEW' && (
        <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
          👁️ Podgląd - nie możesz edytować
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => navigate(`/streams/${stream.id}`)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Otwórz
        </button>
        
        {isOwned && accessLevel !== 'PREVIEW' && (
          <>
            <button className="text-sm text-gray-600 hover:text-gray-800">
              Edytuj
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-800">
              Ustawienia
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

### 7.3 Widok klienta grupowego

```tsx
// components/clients/GroupClientView.tsx

interface GroupClientViewProps {
  client: Stream; // stream typu CLIENT
}

export function GroupClientView({ client }: GroupClientViewProps) {
  const { user } = useAuth();
  
  // Podziel dopływy na "moje" i "inne"
  const myProjects = client.children.filter(
    c => c.organizationId === user.organizationId
  );
  const otherProjects = client.children.filter(
    c => c.organizationId !== user.organizationId
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {client.icon} {client.name}
          </h1>
          <p className="text-gray-500">Klient grupy</p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">Wartość lifetime</div>
          <div className="text-xl font-bold">€{formatCurrency(client.totalValue)}</div>
        </div>
      </div>
      
      {/* Kontakty (wspólne) */}
      <section>
        <h2 className="font-semibold mb-3">Kontakty</h2>
        <div className="grid grid-cols-3 gap-4">
          {client.contacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
          <button className="border-2 border-dashed rounded-lg p-4 text-gray-500 hover:text-gray-700">
            + Dodaj kontakt
          </button>
        </div>
      </section>
      
      {/* Moje projekty */}
      <section>
        <h2 className="font-semibold mb-3">Moje projekty</h2>
        {myProjects.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {myProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">
              Nie masz jeszcze projektów z tym klientem
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              + Utwórz projekt
            </button>
          </div>
        )}
      </section>
      
      {/* Projekty innych spółek */}
      {otherProjects.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Inne spółki grupy</h2>
          <div className="space-y-3">
            {otherProjects.map(project => (
              <div 
                key={project.id}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-gray-500">
                    {project.organization.name}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Status:</span>{' '}
                    <span className={getStatusColor(project.status)}>
                      {project.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    PM: {project.owner?.name || 'Nie przypisano'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Historia aktywności (wszystkie spółki) */}
      <section>
        <h2 className="font-semibold mb-3">Ostatnia aktywność</h2>
        <ActivityFeed 
          activities={client.activities}
          showOrganization={true}
        />
      </section>
    </div>
  );
}
```

---

## 8. LOGIKA BIZNESOWA

### 8.1 Tworzenie projektu dla klienta grupowego

```typescript
// services/projectCreation.ts

interface CreateProjectForClientOptions {
  clientStreamId: string;  // stream klienta (visibility: HOLDING)
  organizationId: string;  // spółka tworząca projekt
  name: string;
  projectTypeCode: string;
  templateId?: string;
  createdById: string;
}

export async function createProjectForGroupClient(options: CreateProjectForClientOptions) {
  const { clientStreamId, organizationId, name, projectTypeCode, templateId, createdById } = options;
  
  // 1. Sprawdź czy klient jest widoczny dla tej organizacji
  const clientStream = await prisma.stream.findUnique({
    where: { id: clientStreamId },
    include: { organization: true }
  });
  
  if (!clientStream || clientStream.visibility !== 'HOLDING') {
    throw new Error('Client not accessible');
  }
  
  // 2. Utwórz stream projektu jako DOPŁYW klienta
  const projectStream = await prisma.stream.create({
    data: {
      organizationId,  // należy do spółki!
      parentId: clientStreamId,  // dopływ klienta
      name,
      streamType: 'PROJECT',
      visibility: 'HOLDING',  // inne spółki widzą że istnieje
      createdById,
      metadata: {
        projectTypeCode
      }
    }
  });
  
  // 3. Utwórz projekt powiązany ze streamem
  const project = await prisma.project.create({
    data: {
      organizationId,
      streamId: projectStream.id,
      name,
      projectTypeCode,
      templateId,
      status: 'PLANNING',
      createdById
    }
  });
  
  // 4. Wygeneruj zadania z szablonu (jeśli podano)
  if (templateId) {
    await templateEngine.generateTasksFromTemplate({
      templateId,
      projectId: project.id,
      organizationId,
      startDate: new Date()
    });
  }
  
  // 5. Dodaj aktywność (widoczną dla całej grupy)
  await prisma.activity.create({
    data: {
      organizationId,
      streamId: clientStreamId,  // na poziomie klienta!
      type: 'PROJECT_CREATED',
      userId: createdById,
      data: {
        projectId: project.id,
        projectName: name,
        organizationName: (await prisma.organization.findUnique({ where: { id: organizationId } }))?.name
      }
    }
  });
  
  return { project, projectStream };
}
```

### 8.2 Dashboard klienta cross-company

```typescript
// services/clientDashboard.ts

export async function getGroupClientDashboard(clientStreamId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true }
  });
  
  const client = await prisma.stream.findUnique({
    where: { id: clientStreamId },
    include: {
      // Wszystkie projekty (dopływy)
      children: {
        where: { streamType: 'PROJECT' },
        include: {
          organization: { select: { id: true, name: true } },
          project: {
            select: {
              id: true,
              status: true,
              value: true,
              _count: { select: { tasks: true } }
            }
          }
        }
      },
      // Kontakty
      contacts: true,
      // Aktywności (ostatnie 20)
      activities: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          organization: { select: { id: true, name: true } }
        }
      }
    }
  });
  
  // Podziel projekty
  const myProjects = client.children.filter(c => c.organizationId === user.organizationId);
  const otherProjects = client.children.filter(c => c.organizationId !== user.organizationId);
  
  // Dla cudzych projektów - tylko podstawowe info
  const otherProjectsPreview = otherProjects.map(p => ({
    id: p.id,
    name: p.name,
    organization: p.organization,
    status: p.project?.status,
    // BEZ: tasks, notes, details
  }));
  
  // Statystyki
  const stats = {
    totalProjects: client.children.length,
    myProjects: myProjects.length,
    otherProjects: otherProjects.length,
    totalValue: client.children.reduce((sum, c) => 
      sum + (Number(c.project?.value) || 0), 0
    ),
    myValue: myProjects.reduce((sum, c) => 
      sum + (Number(c.project?.value) || 0), 0
    )
  };
  
  return {
    client,
    myProjects,
    otherProjectsPreview,
    contacts: client.contacts,
    activities: client.activities,
    stats
  };
}
```

---

## 9. MIGRACJA

### 9.1 Pełny plik migracji

```sql
-- Migration: add_holding_support
-- Description: Adds support for holding/group structures

-- ============================================
-- 1. ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE "OrgType" AS ENUM ('HOLDING', 'SUBSIDIARY', 'COMPANY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HoldingRole" AS ENUM ('OWNER', 'ADMIN', 'FINANCE', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "StreamVisibility" AS ENUM ('PRIVATE', 'ORGANIZATION', 'HOLDING', 'SPECIFIC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. ORGANIZATIONS
-- ============================================

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "type" "OrgType" NOT NULL DEFAULT 'COMPANY',
  ADD COLUMN IF NOT EXISTS "parent_id" TEXT,
  ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN DEFAULT false;

ALTER TABLE "organizations"
  ADD CONSTRAINT "fk_org_parent"
  FOREIGN KEY ("parent_id") REFERENCES "organizations"("id")
  ON DELETE SET NULL;

-- ============================================
-- 3. HOLDING ACCESS
-- ============================================

CREATE TABLE IF NOT EXISTS "holding_access" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "holding_id" TEXT NOT NULL,
  "role" "HoldingRole" NOT NULL DEFAULT 'VIEWER',
  "granted_by_id" TEXT,
  "granted_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_holding_access_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_holding_access_holding" FOREIGN KEY ("holding_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_holding_access_granter" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "uq_holding_access" UNIQUE ("user_id", "holding_id")
);

-- ============================================
-- 4. STREAMS VISIBILITY
-- ============================================

ALTER TABLE "streams"
  ADD COLUMN IF NOT EXISTS "visibility" "StreamVisibility" NOT NULL DEFAULT 'ORGANIZATION',
  ADD COLUMN IF NOT EXISTS "stream_type" TEXT DEFAULT 'GENERIC',
  ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN DEFAULT false;

-- ============================================
-- 5. STREAM SHARING
-- ============================================

CREATE TABLE IF NOT EXISTS "stream_sharing" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "stream_id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "access_level" TEXT NOT NULL DEFAULT 'VIEW',
  "granted_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_stream_sharing_stream" FOREIGN KEY ("stream_id") REFERENCES "streams"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_stream_sharing_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_stream_sharing" UNIQUE ("stream_id", "organization_id")
);

-- ============================================
-- 6. STREAM TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS "stream_templates" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "industry_pack_id" TEXT,
  "level" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "name_pattern" TEXT,
  "stream_type" TEXT NOT NULL,
  "visibility" "StreamVisibility" NOT NULL,
  "icon" TEXT,
  "color" TEXT,
  "sort_order" INT DEFAULT 0,
  "config" JSONB DEFAULT '{}',
  "is_system" BOOLEAN DEFAULT false,
  CONSTRAINT "fk_stream_template_pack" FOREIGN KEY ("industry_pack_id") REFERENCES "industry_packs"("id") ON DELETE CASCADE
);

-- ============================================
-- 7. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_organizations_parent" ON "organizations"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_organizations_type" ON "organizations"("type");
CREATE INDEX IF NOT EXISTS "idx_holding_access_user" ON "holding_access"("user_id");
CREATE INDEX IF NOT EXISTS "idx_holding_access_holding" ON "holding_access"("holding_id");
CREATE INDEX IF NOT EXISTS "idx_streams_visibility" ON "streams"("visibility");
CREATE INDEX IF NOT EXISTS "idx_streams_type" ON "streams"("stream_type");
CREATE INDEX IF NOT EXISTS "idx_stream_sharing_stream" ON "stream_sharing"("stream_id");
CREATE INDEX IF NOT EXISTS "idx_stream_sharing_org" ON "stream_sharing"("organization_id");

-- ============================================
-- 8. SEED: Stream templates
-- ============================================

-- Trade Shows
INSERT INTO "stream_templates" ("id", "industry_pack_id", "level", "name", "stream_type", "visibility", "icon", "sort_order", "is_system")
SELECT 
  'tpl_ts_clients',
  id,
  'HOLDING',
  'Klienci',
  'CLIENT_CONTAINER',
  'HOLDING',
  '👥',
  1,
  true
FROM "industry_packs" WHERE "code" = 'trade_shows'
ON CONFLICT DO NOTHING;

INSERT INTO "stream_templates" ("id", "industry_pack_id", "level", "name", "name_pattern", "stream_type", "visibility", "icon", "sort_order", "is_system")
SELECT 
  'tpl_ts_shows_current',
  id,
  'HOLDING',
  'Targi 2025',
  'Targi {year}',
  'EVENT_CALENDAR',
  'HOLDING',
  '📅',
  2,
  true
FROM "industry_packs" WHERE "code" = 'trade_shows'
ON CONFLICT DO NOTHING;

INSERT INTO "stream_templates" ("id", "industry_pack_id", "level", "name", "stream_type", "visibility", "icon", "sort_order", "is_system")
SELECT 
  'tpl_ts_sub_projects',
  id,
  'SUBSIDIARY',
  'Projekty',
  'PROJECT_CONTAINER',
  'ORGANIZATION',
  '📁',
  1,
  true
FROM "industry_packs" WHERE "code" = 'trade_shows'
ON CONFLICT DO NOTHING;

-- Accounting (similar pattern)
-- Education (similar pattern)
```

---

## 10. KOLEJNOŚĆ IMPLEMENTACJI

### Faza 1: Model danych (2 dni)

```
☐ 1.1 Migracja: OrgType, HoldingRole, StreamVisibility
☐ 1.2 Migracja: holding_access, stream_sharing
☐ 1.3 Migracja: stream_templates
☐ 1.4 Modele Prisma
☐ 1.5 Seed: stream templates per branża
```

### Faza 2: Backend core (3 dni)

```
☐ 2.1 Middleware: checkStreamAccess
☐ 2.2 Service: StreamGenerator
☐ 2.3 API: /onboarding/*
☐ 2.4 API: /holding/*
☐ 2.5 Rozszerzenie API: /streams (widoczność)
```

### Faza 3: UI Onboarding (2 dni)

```
☐ 3.1 OnboardingWizard
☐ 3.2 Step1BasicInfo
☐ 3.3 Step2Subsidiaries
☐ 3.4 Step3Team
☐ 3.5 Step4Clients
☐ 3.6 Step5Summary
```

### Faza 4: UI Dashboard (2 dni)

```
☐ 4.1 StreamCard z visibility badge
☐ 4.2 GroupClientView
☐ 4.3 HoldingDashboard
☐ 4.4 SubsidiarySelector
```

### Faza 5: Testy i polish (1 dzień)

```
☐ 5.1 Testy widoczności
☐ 5.2 Testy onboardingu
☐ 5.3 Edge cases
☐ 5.4 Dokumentacja
```

---

## PODSUMOWANIE

### Co dodajemy:

| Element | Opis |
|---------|------|
| `OrgType` | HOLDING / SUBSIDIARY / COMPANY |
| `HoldingAccess` | Dostęp do holdingu per user |
| `StreamVisibility` | PRIVATE / ORGANIZATION / HOLDING / SPECIFIC |
| `StreamSharing` | Współdzielenie ze spółkami |
| `StreamTemplate` | Szablony strumieni per branża |
| Onboarding flow | 5-krokowy wizard |
| Stream generator | Auto-tworzenie struktury |

### Kluczowe zasady:

```
1. HOLDING nie zatrudnia - tylko zarządza
2. SPÓŁKA ma userów i projekty
3. STREAM łączy spółki (visibility: HOLDING)
4. DOPŁYW należy do spółki, ale jest widoczny
5. Onboarding = scaffold strumieni
```

### Nakład pracy:

```
Model + migracja:    2 dni
Backend:             3 dni
UI onboarding:       2 dni
UI dashboard:        2 dni
Testy:               1 dzień
─────────────────────────────
RAZEM:               10 dni
```

---

**© 2025 Sorto**
*Moduł HOLDING v1.0*
