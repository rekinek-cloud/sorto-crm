# 🏗️ SORTO CRM - System Szablonów i Recept

> **Architektura:** SILNIK (raz) + PAKIETY (per branża)
> **Dla:** Claude Code
> **Wersja:** 2.0

---

## SPIS TREŚCI

### CZĘŚĆ A: SILNIK (budujemy raz)
1. [Architektura](#1-architektura)
2. [Migracja bazy danych](#2-migracja-bazy-danych)
3. [Modele Prisma](#3-modele-prisma)
4. [Logika biznesowa](#4-logika-biznesowa)
5. [API Endpoints](#5-api-endpoints)
6. [Komponenty UI](#6-komponenty-ui)

### CZĘŚĆ B: PAKIETY (per branża)
7. [Struktura pakietu](#7-struktura-pakietu)
8. [Pakiet: TARGI](#8-pakiet-targi)
9. [Pakiet: KSIĘGOWOŚĆ](#9-pakiet-księgowość)
10. [Pakiet: SZKOŁA](#10-pakiet-szkoła)

### CZĘŚĆ C: WDROŻENIE
11. [Kolejność implementacji](#11-kolejność-implementacji)
12. [Onboarding klienta](#12-onboarding-klienta)

---

# CZĘŚĆ A: SILNIK (budujemy raz)

## 1. ARCHITEKTURA

### Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     SORTO CRM (rdzeń)                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    SILNIK                            │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ Template │  │  Recipe  │  │ Industry │          │   │
│  │  │ Engine   │  │  Engine  │  │   Pack   │          │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │   │
│  │       │             │             │                 │   │
│  │       └─────────────┼─────────────┘                 │   │
│  │                     │                               │   │
│  │              ┌──────┴──────┐                        │   │
│  │              │   PAKIETY   │                        │   │
│  │              │    (JSON)   │                        │   │
│  │              └──────┬──────┘                        │   │
│  │                     │                               │   │
│  └─────────────────────┼───────────────────────────────┘   │
│                        │                                    │
│         ┌──────────────┼──────────────┐                    │
│         ▼              ▼              ▼                    │
│    ┌─────────┐   ┌──────────┐   ┌─────────┐               │
│    │ 🎪 TARGI│   │📊 KSIĘG. │   │🎓 SZKOŁA│               │
│    └─────────┘   └──────────┘   └─────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Zasada

| Warstwa | Budujemy | Zawiera |
|---------|----------|---------|
| **SILNIK** | Raz | Modele, logika, API, UI |
| **PAKIETY** | Wiele razy | JSON z szablonami i receptami |

---

## 2. MIGRACJA BAZY DANYCH

### Plik: `migrations/001_template_recipe_engine.sql`

```sql
-- ============================================
-- ENUMS
-- ============================================

-- Typy projektów (rozszerzalne przez pakiety)
CREATE TYPE "ProjectType" AS ENUM (
  'GENERIC'
);

-- Priorytety zadań z recept
CREATE TYPE "RecipeTaskPriority" AS ENUM (
  'URGENT_IMPORTANT',
  'URGENT',
  'IMPORTANT',
  'NORMAL',
  'LOW'
);

-- ============================================
-- SILNIK: Tabele podstawowe
-- ============================================

-- Pakiety branżowe
CREATE TABLE "industry_packs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "name_en" TEXT,
  "description" TEXT,
  "icon" TEXT,
  "color" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "config" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Typy projektów per pakiet
CREATE TABLE "project_type_definitions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "industry_pack_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "name_en" TEXT,
  "description" TEXT,
  "icon" TEXT,
  "color" TEXT,
  "sort_order" INT NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("industry_pack_id", "code"),
  FOREIGN KEY ("industry_pack_id") REFERENCES "industry_packs"("id")
);

-- Szablony projektów
CREATE TABLE "project_templates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT,
  "industry_pack_id" TEXT,
  "project_type_code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "name_en" TEXT,
  "description" TEXT,
  "version" INT NOT NULL DEFAULT 1,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id"),
  FOREIGN KEY ("industry_pack_id") REFERENCES "industry_packs"("id")
);

-- Zadania w szablonie
CREATE TABLE "template_tasks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "template_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "name_en" TEXT,
  "description" TEXT,
  "owner_role" TEXT,
  "estimated_days" DECIMAL(5,2) DEFAULT 1,
  "phase" TEXT,
  "sort_order" INT NOT NULL DEFAULT 0,
  "is_milestone" BOOLEAN NOT NULL DEFAULT false,
  "is_client_visible" BOOLEAN NOT NULL DEFAULT false,
  "config" JSONB DEFAULT '{}',
  UNIQUE("template_id", "code"),
  FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE
);

-- Zależności między zadaniami w szablonie
CREATE TABLE "template_task_dependencies" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "template_id" TEXT NOT NULL,
  "task_code" TEXT NOT NULL,
  "depends_on_code" TEXT NOT NULL,
  "dependency_type" TEXT NOT NULL DEFAULT 'finish_to_start',
  UNIQUE("template_id", "task_code", "depends_on_code"),
  FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE
);

-- Recepty (reakcje na zmiany)
CREATE TABLE "change_recipes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT,
  "industry_pack_id" TEXT,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "name_en" TEXT,
  "description" TEXT,
  "project_type_codes" TEXT[] NOT NULL DEFAULT '{}',
  "trigger_type" TEXT NOT NULL DEFAULT 'manual',
  "trigger_conditions" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id"),
  FOREIGN KEY ("industry_pack_id") REFERENCES "industry_packs"("id")
);

-- Akcje w recepcie (jakie taski utworzyć)
CREATE TABLE "recipe_actions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "recipe_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL DEFAULT 'create_task',
  "task_name" TEXT NOT NULL,
  "task_name_en" TEXT,
  "owner_role" TEXT,
  "deadline_hours" DECIMAL(6,2),
  "priority" "RecipeTaskPriority" NOT NULL DEFAULT 'NORMAL',
  "is_acknowledgment" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INT NOT NULL DEFAULT 0,
  "config" JSONB DEFAULT '{}',
  FOREIGN KEY ("recipe_id") REFERENCES "change_recipes"("id") ON DELETE CASCADE
);

-- ============================================
-- SILNIK: Rozszerzenie istniejących tabel
-- ============================================

-- Rozszerzenie projects
ALTER TABLE "projects" 
  ADD COLUMN IF NOT EXISTS "project_type_code" TEXT DEFAULT 'GENERIC',
  ADD COLUMN IF NOT EXISTS "template_id" TEXT REFERENCES "project_templates"("id"),
  ADD COLUMN IF NOT EXISTS "industry_pack_id" TEXT REFERENCES "industry_packs"("id"),
  ADD COLUMN IF NOT EXISTS "deal_id" TEXT REFERENCES "deals"("id"),
  ADD COLUMN IF NOT EXISTS "payer_company_id" TEXT REFERENCES "companies"("id"),
  ADD COLUMN IF NOT EXISTS "end_client_id" TEXT REFERENCES "companies"("id"),
  ADD COLUMN IF NOT EXISTS "value" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';

-- Rozszerzenie organizations (wybrany pakiet branżowy)
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "industry_pack_id" TEXT REFERENCES "industry_packs"("id"),
  ADD COLUMN IF NOT EXISTS "industry_config" JSONB DEFAULT '{}';

-- Zgłoszone zmiany w projekcie
CREATE TABLE "project_changes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "recipe_id" TEXT NOT NULL,
  "reported_by_id" TEXT NOT NULL,
  "description" TEXT,
  "attachments" JSONB DEFAULT '[]',
  "data" JSONB DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "tasks_created" TEXT[] DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "processed_at" TIMESTAMP,
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id"),
  FOREIGN KEY ("project_id") REFERENCES "projects"("id"),
  FOREIGN KEY ("recipe_id") REFERENCES "change_recipes"("id"),
  FOREIGN KEY ("reported_by_id") REFERENCES "users"("id")
);

-- ============================================
-- INDEKSY
-- ============================================

CREATE INDEX "idx_project_templates_type" ON "project_templates"("project_type_code");
CREATE INDEX "idx_project_templates_pack" ON "project_templates"("industry_pack_id");
CREATE INDEX "idx_change_recipes_pack" ON "change_recipes"("industry_pack_id");
CREATE INDEX "idx_projects_type_code" ON "projects"("project_type_code");
CREATE INDEX "idx_projects_deal" ON "projects"("deal_id");
CREATE INDEX "idx_project_changes_project" ON "project_changes"("project_id");
CREATE INDEX "idx_organizations_pack" ON "organizations"("industry_pack_id");
```

---

## 3. MODELE PRISMA

### Plik: `schema.prisma` - nowe modele

```prisma
// ============================================
// SILNIK: Pakiety branżowe
// ============================================

model IndustryPack {
  id            String    @id @default(cuid())
  code          String    @unique
  name          String
  nameEn        String?   @map("name_en")
  description   String?
  icon          String?
  color         String?
  isActive      Boolean   @default(true) @map("is_active")
  isSystem      Boolean   @default(false) @map("is_system")
  config        Json      @default("{}")
  
  // Relacje
  projectTypes  ProjectTypeDefinition[]
  templates     ProjectTemplate[]
  recipes       ChangeRecipe[]
  organizations Organization[]
  projects      Project[]
  
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  @@map("industry_packs")
}

model ProjectTypeDefinition {
  id              String    @id @default(cuid())
  industryPackId  String    @map("industry_pack_id")
  code            String
  name            String
  nameEn          String?   @map("name_en")
  description     String?
  icon            String?
  color           String?
  sortOrder       Int       @default(0) @map("sort_order")
  isActive        Boolean   @default(true) @map("is_active")
  config          Json      @default("{}")
  
  industryPack    IndustryPack @relation(fields: [industryPackId], references: [id])
  
  createdAt       DateTime  @default(now()) @map("created_at")
  
  @@unique([industryPackId, code])
  @@map("project_type_definitions")
}

// ============================================
// SILNIK: Szablony
// ============================================

model ProjectTemplate {
  id              String    @id @default(cuid())
  organizationId  String?   @map("organization_id")
  industryPackId  String?   @map("industry_pack_id")
  projectTypeCode String    @map("project_type_code")
  name            String
  nameEn          String?   @map("name_en")
  description     String?
  version         Int       @default(1)
  isDefault       Boolean   @default(false) @map("is_default")
  isSystem        Boolean   @default(false) @map("is_system")
  isActive        Boolean   @default(true) @map("is_active")
  
  // Relacje
  organization    Organization? @relation(fields: [organizationId], references: [id])
  industryPack    IndustryPack? @relation(fields: [industryPackId], references: [id])
  tasks           TemplateTask[]
  dependencies    TemplateTaskDependency[]
  projects        Project[]
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@map("project_templates")
}

model TemplateTask {
  id              String    @id @default(cuid())
  templateId      String    @map("template_id")
  code            String
  name            String
  nameEn          String?   @map("name_en")
  description     String?
  ownerRole       String?   @map("owner_role")
  estimatedDays   Decimal   @default(1) @map("estimated_days") @db.Decimal(5, 2)
  phase           String?
  sortOrder       Int       @default(0) @map("sort_order")
  isMilestone     Boolean   @default(false) @map("is_milestone")
  isClientVisible Boolean   @default(false) @map("is_client_visible")
  config          Json      @default("{}")
  
  template        ProjectTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  @@unique([templateId, code])
  @@map("template_tasks")
}

model TemplateTaskDependency {
  id              String    @id @default(cuid())
  templateId      String    @map("template_id")
  taskCode        String    @map("task_code")
  dependsOnCode   String    @map("depends_on_code")
  dependencyType  String    @default("finish_to_start") @map("dependency_type")
  
  template        ProjectTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  @@unique([templateId, taskCode, dependsOnCode])
  @@map("template_task_dependencies")
}

// ============================================
// SILNIK: Recepty
// ============================================

model ChangeRecipe {
  id                String    @id @default(cuid())
  organizationId    String?   @map("organization_id")
  industryPackId    String?   @map("industry_pack_id")
  code              String    @unique
  name              String
  nameEn            String?   @map("name_en")
  description       String?
  projectTypeCodes  String[]  @default([]) @map("project_type_codes")
  triggerType       String    @default("manual") @map("trigger_type")
  triggerConditions Json?     @map("trigger_conditions")
  isActive          Boolean   @default(true) @map("is_active")
  isSystem          Boolean   @default(false) @map("is_system")
  sortOrder         Int       @default(0) @map("sort_order")
  
  // Relacje
  organization      Organization? @relation(fields: [organizationId], references: [id])
  industryPack      IndustryPack? @relation(fields: [industryPackId], references: [id])
  actions           RecipeAction[]
  changes           ProjectChange[]
  
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  @@map("change_recipes")
}

model RecipeAction {
  id              String              @id @default(cuid())
  recipeId        String              @map("recipe_id")
  actionType      String              @default("create_task") @map("action_type")
  taskName        String              @map("task_name")
  taskNameEn      String?             @map("task_name_en")
  ownerRole       String?             @map("owner_role")
  deadlineHours   Decimal?            @map("deadline_hours") @db.Decimal(6, 2)
  priority        RecipeTaskPriority  @default(NORMAL)
  isAcknowledgment Boolean            @default(false) @map("is_acknowledgment")
  sortOrder       Int                 @default(0) @map("sort_order")
  config          Json                @default("{}")
  
  recipe          ChangeRecipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  @@map("recipe_actions")
}

enum RecipeTaskPriority {
  URGENT_IMPORTANT
  URGENT
  IMPORTANT
  NORMAL
  LOW
}

// ============================================
// SILNIK: Zmiany w projekcie
// ============================================

model ProjectChange {
  id              String    @id @default(cuid())
  organizationId  String    @map("organization_id")
  projectId       String    @map("project_id")
  recipeId        String    @map("recipe_id")
  reportedById    String    @map("reported_by_id")
  description     String?
  attachments     Json      @default("[]")
  data            Json      @default("{}")
  status          String    @default("pending")
  tasksCreated    String[]  @default([]) @map("tasks_created")
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  project         Project      @relation(fields: [projectId], references: [id])
  recipe          ChangeRecipe @relation(fields: [recipeId], references: [id])
  reportedBy      User         @relation(fields: [reportedById], references: [id])
  
  createdAt       DateTime  @default(now()) @map("created_at")
  processedAt     DateTime? @map("processed_at")
  
  @@map("project_changes")
}

// ============================================
// ROZSZERZENIE: Project
// ============================================

model Project {
  // ... istniejące pola ...
  
  // NOWE POLA
  projectTypeCode   String?       @map("project_type_code")
  templateId        String?       @map("template_id")
  industryPackId    String?       @map("industry_pack_id")
  dealId            String?       @map("deal_id")
  payerCompanyId    String?       @map("payer_company_id")
  endClientId       String?       @map("end_client_id")
  value             Decimal?      @db.Decimal(15, 2)
  metadata          Json          @default("{}")
  
  // NOWE RELACJE
  template          ProjectTemplate? @relation(fields: [templateId], references: [id])
  industryPack      IndustryPack?    @relation(fields: [industryPackId], references: [id])
  deal              Deal?            @relation(fields: [dealId], references: [id])
  payer             Company?         @relation("ProjectPayer", fields: [payerCompanyId], references: [id])
  endClient         Company?         @relation("ProjectEndClient", fields: [endClientId], references: [id])
  changes           ProjectChange[]
  
  @@map("projects")
}

// ============================================
// ROZSZERZENIE: Organization
// ============================================

model Organization {
  // ... istniejące pola ...
  
  // NOWE POLA
  industryPackId    String?   @map("industry_pack_id")
  industryConfig    Json      @default("{}") @map("industry_config")
  
  // NOWE RELACJE
  industryPack      IndustryPack? @relation(fields: [industryPackId], references: [id])
  templates         ProjectTemplate[]
  recipes           ChangeRecipe[]
  changes           ProjectChange[]
  
  @@map("organizations")
}
```

---

## 4. LOGIKA BIZNESOWA

### 4.1 Template Engine

**Plik:** `packages/backend/src/services/templateEngine.ts`

```typescript
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

interface GenerateProjectOptions {
  templateId: string;
  projectId: string;
  organizationId: string;
  startDate?: Date;
  assignees?: Record<string, string>; // role -> userId
}

export class TemplateEngine {
  
  /**
   * Generuje zadania dla projektu na podstawie szablonu
   */
  async generateTasksFromTemplate(options: GenerateProjectOptions) {
    const { templateId, projectId, organizationId, startDate, assignees = {} } = options;
    
    // 1. Pobierz szablon z zadaniami i zależnościami
    const template = await prisma.projectTemplate.findUnique({
      where: { id: templateId },
      include: {
        tasks: { orderBy: { sortOrder: 'asc' } },
        dependencies: true
      }
    });
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // 2. Mapa: kod zadania -> utworzone ID
    const taskCodeToId: Record<string, string> = {};
    const createdTasks: string[] = [];
    
    // 3. Utwórz zadania
    for (const templateTask of template.tasks) {
      const task = await prisma.task.create({
        data: {
          organizationId,
          projectId,
          title: templateTask.name,
          description: templateTask.description,
          status: 'INBOX',
          priority: 'NORMAL',
          estimatedMinutes: Number(templateTask.estimatedDays) * 8 * 60,
          assignedToId: assignees[templateTask.ownerRole || ''] || null,
          metadata: {
            templateTaskCode: templateTask.code,
            phase: templateTask.phase,
            isMilestone: templateTask.isMilestone
          }
        }
      });
      
      taskCodeToId[templateTask.code] = task.id;
      createdTasks.push(task.id);
    }
    
    // 4. Utwórz zależności
    for (const dep of template.dependencies) {
      const successorId = taskCodeToId[dep.taskCode];
      const predecessorId = taskCodeToId[dep.dependsOnCode];
      
      if (successorId && predecessorId) {
        await prisma.taskDependency.create({
          data: {
            predecessorId,
            successorId,
            dependencyType: dep.dependencyType
          }
        });
      }
    }
    
    // 5. Oblicz ścieżkę krytyczną
    await this.calculateCriticalPath(projectId);
    
    return {
      tasksCreated: createdTasks.length,
      taskIds: createdTasks
    };
  }
  
  /**
   * Oblicza ścieżkę krytyczną projektu
   */
  async calculateCriticalPath(projectId: string) {
    // Pobierz zadania z zależnościami
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        predecessors: true,
        successors: true
      }
    });
    
    // Algorytm CPM (Critical Path Method)
    // ... implementacja ...
    
    // Zapisz wynik
    await prisma.criticalPath.upsert({
      where: { projectId },
      create: {
        projectId,
        taskIds: [], // wynik algorytmu
        totalDays: 0,
        calculatedAt: new Date()
      },
      update: {
        taskIds: [],
        totalDays: 0,
        calculatedAt: new Date()
      }
    });
  }
  
  /**
   * Zwraca odblokowane zadania (wszystkie zależności spełnione)
   */
  async getUnblockedTasks(projectId: string) {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        status: { not: 'DONE' }
      },
      include: {
        predecessors: {
          include: {
            predecessor: true
          }
        }
      }
    });
    
    return tasks.filter(task => {
      // Zadanie jest odblokowane jeśli wszystkie predecessors są DONE
      return task.predecessors.every(dep => dep.predecessor.status === 'DONE');
    });
  }
}

export const templateEngine = new TemplateEngine();
```

### 4.2 Recipe Engine

**Plik:** `packages/backend/src/services/recipeEngine.ts`

```typescript
import { prisma } from '../config/database';
import { addHours } from 'date-fns';

interface ExecuteRecipeOptions {
  recipeId: string;
  projectId: string;
  organizationId: string;
  reportedById: string;
  description?: string;
  data?: Record<string, any>;
}

export class RecipeEngine {
  
  /**
   * Wykonuje receptę - tworzy zadania wg definicji
   */
  async executeRecipe(options: ExecuteRecipeOptions) {
    const { recipeId, projectId, organizationId, reportedById, description, data } = options;
    
    // 1. Pobierz receptę z akcjami
    const recipe = await prisma.changeRecipe.findUnique({
      where: { id: recipeId },
      include: {
        actions: { orderBy: { sortOrder: 'asc' } }
      }
    });
    
    if (!recipe) {
      throw new Error(`Recipe ${recipeId} not found`);
    }
    
    // 2. Sprawdź czy recepta pasuje do typu projektu
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    
    if (recipe.projectTypeCodes.length > 0 && 
        !recipe.projectTypeCodes.includes(project.projectTypeCode || 'GENERIC')) {
      throw new Error(`Recipe ${recipe.code} not applicable to project type ${project.projectTypeCode}`);
    }
    
    // 3. Utwórz rekord zmiany
    const change = await prisma.projectChange.create({
      data: {
        organizationId,
        projectId,
        recipeId,
        reportedById,
        description,
        data: data || {},
        status: 'processing'
      }
    });
    
    // 4. Wykonaj akcje (utwórz zadania)
    const createdTasks: string[] = [];
    const now = new Date();
    
    for (const action of recipe.actions) {
      if (action.actionType === 'create_task') {
        const deadline = action.deadlineHours 
          ? addHours(now, Number(action.deadlineHours))
          : null;
        
        const task = await prisma.task.create({
          data: {
            organizationId,
            projectId,
            title: action.taskName,
            status: 'NEXT_ACTION',
            priority: this.mapPriority(action.priority),
            dueDate: deadline,
            metadata: {
              recipeCode: recipe.code,
              changeId: change.id,
              isAcknowledgment: action.isAcknowledgment
            }
          }
        });
        
        createdTasks.push(task.id);
      }
    }
    
    // 5. Zaktualizuj rekord zmiany
    await prisma.projectChange.update({
      where: { id: change.id },
      data: {
        status: 'processed',
        tasksCreated: createdTasks,
        processedAt: new Date()
      }
    });
    
    // 6. Wyślij powiadomienia
    await this.notifyTaskOwners(createdTasks);
    
    return {
      changeId: change.id,
      tasksCreated: createdTasks.length,
      taskIds: createdTasks
    };
  }
  
  /**
   * Pobiera dostępne recepty dla projektu
   */
  async getAvailableRecipes(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { organization: true }
    });
    
    if (!project) return [];
    
    return prisma.changeRecipe.findMany({
      where: {
        isActive: true,
        OR: [
          { projectTypeCodes: { has: project.projectTypeCode || 'GENERIC' } },
          { projectTypeCodes: { isEmpty: true } }
        ],
        OR: [
          { organizationId: project.organizationId },
          { isSystem: true }
        ]
      },
      include: {
        actions: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: { sortOrder: 'asc' }
    });
  }
  
  private mapPriority(recipePriority: string): string {
    const map: Record<string, string> = {
      'URGENT_IMPORTANT': 'URGENT_IMPORTANT',
      'URGENT': 'URGENT',
      'IMPORTANT': 'IMPORTANT',
      'NORMAL': 'NORMAL',
      'LOW': 'LOW'
    };
    return map[recipePriority] || 'NORMAL';
  }
  
  private async notifyTaskOwners(taskIds: string[]) {
    // Implementacja powiadomień
  }
}

export const recipeEngine = new RecipeEngine();
```

### 4.3 Industry Pack Manager

**Plik:** `packages/backend/src/services/industryPackManager.ts`

```typescript
import { prisma } from '../config/database';

export class IndustryPackManager {
  
  /**
   * Aktywuje pakiet branżowy dla organizacji
   */
  async activatePackForOrganization(organizationId: string, packCode: string) {
    const pack = await prisma.industryPack.findUnique({
      where: { code: packCode },
      include: {
        projectTypes: true
      }
    });
    
    if (!pack) {
      throw new Error(`Industry pack ${packCode} not found`);
    }
    
    // Przypisz pakiet do organizacji
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        industryPackId: pack.id
      }
    });
    
    return pack;
  }
  
  /**
   * Pobiera dostępne typy projektów dla organizacji
   */
  async getProjectTypesForOrganization(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        industryPack: {
          include: {
            projectTypes: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });
    
    // Zawsze dodaj GENERIC
    const types = [
      { code: 'GENERIC', name: 'Zwykły projekt', icon: 'folder' }
    ];
    
    if (org?.industryPack?.projectTypes) {
      types.push(...org.industryPack.projectTypes);
    }
    
    return types;
  }
  
  /**
   * Pobiera domyślny szablon dla typu projektu
   */
  async getDefaultTemplate(organizationId: string, projectTypeCode: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    // Szukaj: najpierw własny, potem systemowy
    return prisma.projectTemplate.findFirst({
      where: {
        projectTypeCode,
        isActive: true,
        isDefault: true,
        OR: [
          { organizationId },
          { isSystem: true, industryPackId: org?.industryPackId }
        ]
      },
      include: {
        tasks: { orderBy: { sortOrder: 'asc' } },
        dependencies: true
      },
      orderBy: { organizationId: 'desc' } // własne mają priorytet
    });
  }
}

export const industryPackManager = new IndustryPackManager();
```

---

## 5. API ENDPOINTS

### Plik: `packages/backend/src/routes/industryPacks.ts`

```typescript
import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { industryPackManager } from '../services/industryPackManager';

const router = Router();

// GET /api/v1/industry-packs - lista dostępnych pakietów
router.get('/', authenticateToken, async (req, res) => {
  const packs = await prisma.industryPack.findMany({
    where: { isActive: true },
    include: {
      projectTypes: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });
  
  res.json({ data: packs });
});

// POST /api/v1/industry-packs/activate - aktywuj pakiet dla organizacji
router.post('/activate', authenticateToken, async (req, res) => {
  const { packCode } = req.body;
  const organizationId = req.user.organizationId;
  
  const pack = await industryPackManager.activatePackForOrganization(
    organizationId, 
    packCode
  );
  
  res.json({ data: pack });
});

// GET /api/v1/industry-packs/project-types - typy projektów dla mojej organizacji
router.get('/project-types', authenticateToken, async (req, res) => {
  const organizationId = req.user.organizationId;
  
  const types = await industryPackManager.getProjectTypesForOrganization(
    organizationId
  );
  
  res.json({ data: types });
});

export default router;
```

### Plik: `packages/backend/src/routes/projectTemplates.ts`

```typescript
import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { templateEngine } from '../services/templateEngine';
import { industryPackManager } from '../services/industryPackManager';

const router = Router();

// GET /api/v1/project-templates - szablony dla mojej organizacji
router.get('/', authenticateToken, async (req, res) => {
  const { projectTypeCode } = req.query;
  const organizationId = req.user.organizationId;
  
  const org = await prisma.organization.findUnique({
    where: { id: organizationId }
  });
  
  const templates = await prisma.projectTemplate.findMany({
    where: {
      isActive: true,
      projectTypeCode: projectTypeCode as string || undefined,
      OR: [
        { organizationId },
        { isSystem: true, industryPackId: org?.industryPackId }
      ]
    },
    include: {
      tasks: { orderBy: { sortOrder: 'asc' } }
    }
  });
  
  res.json({ data: templates });
});

// GET /api/v1/project-templates/:id - szczegóły szablonu
router.get('/:id', authenticateToken, async (req, res) => {
  const template = await prisma.projectTemplate.findUnique({
    where: { id: req.params.id },
    include: {
      tasks: { orderBy: { sortOrder: 'asc' } },
      dependencies: true
    }
  });
  
  res.json({ data: template });
});

// POST /api/v1/project-templates/:id/generate - wygeneruj zadania dla projektu
router.post('/:id/generate', authenticateToken, async (req, res) => {
  const { projectId, startDate, assignees } = req.body;
  const organizationId = req.user.organizationId;
  
  const result = await templateEngine.generateTasksFromTemplate({
    templateId: req.params.id,
    projectId,
    organizationId,
    startDate: startDate ? new Date(startDate) : undefined,
    assignees
  });
  
  res.json({ data: result });
});

export default router;
```

### Plik: `packages/backend/src/routes/changeRecipes.ts`

```typescript
import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { recipeEngine } from '../services/recipeEngine';

const router = Router();

// GET /api/v1/change-recipes - recepty dla mojej organizacji
router.get('/', authenticateToken, async (req, res) => {
  const { projectId } = req.query;
  const organizationId = req.user.organizationId;
  
  if (projectId) {
    const recipes = await recipeEngine.getAvailableRecipes(projectId as string);
    return res.json({ data: recipes });
  }
  
  const org = await prisma.organization.findUnique({
    where: { id: organizationId }
  });
  
  const recipes = await prisma.changeRecipe.findMany({
    where: {
      isActive: true,
      OR: [
        { organizationId },
        { isSystem: true, industryPackId: org?.industryPackId }
      ]
    },
    include: {
      actions: { orderBy: { sortOrder: 'asc' } }
    },
    orderBy: { sortOrder: 'asc' }
  });
  
  res.json({ data: recipes });
});

// POST /api/v1/change-recipes/:id/execute - wykonaj receptę (zgłoś zmianę)
router.post('/:id/execute', authenticateToken, async (req, res) => {
  const { projectId, description, data } = req.body;
  const organizationId = req.user.organizationId;
  const userId = req.user.id;
  
  const result = await recipeEngine.executeRecipe({
    recipeId: req.params.id,
    projectId,
    organizationId,
    reportedById: userId,
    description,
    data
  });
  
  res.json({ data: result });
});

// GET /api/v1/projects/:projectId/changes - historia zmian projektu
router.get('/projects/:projectId/changes', authenticateToken, async (req, res) => {
  const changes = await prisma.projectChange.findMany({
    where: { projectId: req.params.projectId },
    include: {
      recipe: true,
      reportedBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json({ data: changes });
});

export default router;
```

---

## 6. KOMPONENTY UI

### 6.1 Wybór typu projektu

**Plik:** `packages/frontend/components/projects/ProjectTypeSelector.tsx`

```tsx
import { useState, useEffect } from 'react';
import { RadioGroup } from '@headlessui/react';
import { useApi } from '@/hooks/useApi';

interface ProjectType {
  code: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

interface Props {
  value: string;
  onChange: (code: string) => void;
}

export function ProjectTypeSelector({ value, onChange }: Props) {
  const { data: types } = useApi<ProjectType[]>('/industry-packs/project-types');
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Typ projektu</label>
      
      <RadioGroup value={value} onChange={onChange}>
        <div className="space-y-2">
          {types?.map((type) => (
            <RadioGroup.Option
              key={type.code}
              value={type.code}
              className={({ checked }) =>
                `relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`
              }
            >
              {({ checked }) => (
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    {type.icon && <span className="text-xl">{type.icon}</span>}
                    <div>
                      <RadioGroup.Label className="font-medium">
                        {type.name}
                      </RadioGroup.Label>
                      {type.description && (
                        <RadioGroup.Description className="text-sm text-gray-500">
                          {type.description}
                        </RadioGroup.Description>
                      )}
                    </div>
                  </div>
                  {checked && (
                    <div className="shrink-0 text-blue-500">✓</div>
                  )}
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
```

### 6.2 Modal zgłaszania zmiany

**Plik:** `packages/frontend/components/projects/ReportChangeModal.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useApi, useApiMutation } from '@/hooks/useApi';

interface Recipe {
  id: string;
  code: string;
  name: string;
  description?: string;
  actions: {
    taskName: string;
    ownerRole?: string;
    deadlineHours?: number;
    priority: string;
  }[];
}

interface Props {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReportChangeModal({ projectId, isOpen, onClose, onSuccess }: Props) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [description, setDescription] = useState('');
  
  const { data: recipes } = useApi<Recipe[]>(
    `/change-recipes?projectId=${projectId}`
  );
  
  const { mutate, isLoading } = useApiMutation(
    `/change-recipes/${selectedRecipe?.id}/execute`,
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      }
    }
  );
  
  const handleSubmit = () => {
    if (!selectedRecipe) return;
    
    mutate({
      projectId,
      description
    });
  };
  
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold mb-4">
            Zgłoś zmianę
          </Dialog.Title>
          
          {/* Lista recept */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium">Co się wydarzyło?</label>
            {recipes?.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className={`w-full text-left p-3 rounded border ${
                  selectedRecipe?.id === recipe.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{recipe.name}</div>
                {recipe.description && (
                  <div className="text-sm text-gray-500">{recipe.description}</div>
                )}
              </button>
            ))}
          </div>
          
          {/* Opis */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Opis (opcjonalnie)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>
          
          {/* Podgląd akcji */}
          {selectedRecipe && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium mb-2">
                Zostaną utworzone zadania:
              </div>
              <ul className="space-y-1">
                {selectedRecipe.actions.map((action, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <span>☐</span>
                    <span>{action.taskName}</span>
                    {action.ownerRole && (
                      <span className="text-gray-500">→ {action.ownerRole}</span>
                    )}
                    {action.deadlineHours && (
                      <span className="text-gray-500">({action.deadlineHours}h)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Przyciski */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Anuluj
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedRecipe || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Zgłaszam...' : 'Zgłoś zmianę'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
```

### 6.3 Onboarding - wybór branży

**Plik:** `packages/frontend/components/onboarding/IndustryPackSelector.tsx`

```tsx
import { useState } from 'react';
import { useApi, useApiMutation } from '@/hooks/useApi';

interface IndustryPack {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  projectTypes: {
    code: string;
    name: string;
  }[];
}

interface Props {
  onComplete: () => void;
}

export function IndustryPackSelector({ onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  
  const { data: packs } = useApi<IndustryPack[]>('/industry-packs');
  
  const { mutate, isLoading } = useApiMutation('/industry-packs/activate', {
    onSuccess: onComplete
  });
  
  const handleActivate = () => {
    if (!selected) return;
    mutate({ packCode: selected });
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Wybierz swoją branżę</h1>
      <p className="text-gray-600 mb-6">
        System dostosuje się do Twoich potrzeb - szablony, procesy, raporty.
      </p>
      
      <div className="grid gap-4 mb-6">
        {packs?.map((pack) => (
          <button
            key={pack.code}
            onClick={() => setSelected(pack.code)}
            className={`text-left p-4 rounded-lg border-2 transition ${
              selected === pack.code
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {pack.icon && <span className="text-2xl">{pack.icon}</span>}
              <span className="font-bold text-lg">{pack.name}</span>
            </div>
            {pack.description && (
              <p className="text-gray-600 mb-2">{pack.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {pack.projectTypes.map((pt) => (
                <span
                  key={pt.code}
                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {pt.name}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      
      <button
        onClick={handleActivate}
        disabled={!selected || isLoading}
        className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Aktywuję...' : 'Rozpocznij'}
      </button>
    </div>
  );
}
```

---

# CZĘŚĆ B: PAKIETY (per branża)

## 7. STRUKTURA PAKIETU

### Format JSON pakietu

```typescript
interface IndustryPackDefinition {
  // Metadata
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // Typy projektów
  projectTypes: {
    code: string;
    name: string;
    nameEn?: string;
    description?: string;
    icon?: string;
  }[];
  
  // Szablony
  templates: {
    projectTypeCode: string;
    name: string;
    isDefault?: boolean;
    tasks: {
      code: string;
      name: string;
      ownerRole?: string;
      estimatedDays?: number;
      phase?: string;
      requires?: string[]; // kody zadań od których zależy
    }[];
  }[];
  
  // Recepty
  recipes: {
    code: string;
    name: string;
    description?: string;
    projectTypeCodes: string[];
    actions: {
      taskName: string;
      ownerRole?: string;
      deadlineHours?: number;
      priority?: 'URGENT_IMPORTANT' | 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'LOW';
    }[];
  }[];
  
  // Konfiguracja (opcjonalna)
  config?: {
    terminology?: Record<string, string>;
    defaultRoles?: string[];
    features?: string[];
  };
}
```

---

## 8. PAKIET: TARGI

### Plik: `packages/backend/prisma/seeds/industry-packs/trade-shows.json`

```json
{
  "code": "trade_shows",
  "name": "Firma targowa / eventowa",
  "nameEn": "Trade Shows & Events",
  "description": "Stoiska targowe, eventy firmowe, konferencje",
  "icon": "🎪",
  "color": "#E91E63",
  
  "projectTypes": [
    {
      "code": "TRADE_SHOW_BOOTH",
      "name": "Stoisko targowe",
      "nameEn": "Trade Show Booth",
      "description": "Projekt i realizacja stoiska",
      "icon": "🏗️"
    },
    {
      "code": "CORPORATE_EVENT",
      "name": "Wydarzenie firmowe",
      "nameEn": "Corporate Event",
      "description": "Konferencja, gala, spotkanie",
      "icon": "🎉"
    },
    {
      "code": "EXHIBITION",
      "name": "Wystawa",
      "nameEn": "Exhibition",
      "description": "Wystawa stała lub czasowa",
      "icon": "🖼️"
    }
  ],
  
  "templates": [
    {
      "projectTypeCode": "TRADE_SHOW_BOOTH",
      "name": "Stoisko targowe (QM)",
      "isDefault": true,
      "tasks": [
        {
          "code": "0.1.2.1",
          "name": "Plan hali",
          "ownerRole": "SALES",
          "estimatedDays": 2,
          "phase": "ACQUISITION",
          "requires": []
        },
        {
          "code": "0.1.2.2",
          "name": "Zlecenie",
          "ownerRole": "SALES",
          "estimatedDays": 1,
          "phase": "ACQUISITION",
          "requires": []
        },
        {
          "code": "0.1.2.3",
          "name": "Umowa",
          "ownerRole": "SALES",
          "estimatedDays": 3,
          "phase": "ACQUISITION",
          "requires": ["0.1.2.2"]
        },
        {
          "code": "0.1.2.4",
          "name": "Pozwolenie na zabudowę",
          "ownerRole": "PM",
          "estimatedDays": 5,
          "phase": "ACQUISITION",
          "requires": ["0.1.2.1"]
        },
        {
          "code": "0.1.4.1",
          "name": "Wymiary stoiska",
          "ownerRole": "DESIGNER",
          "estimatedDays": 2,
          "phase": "DESIGN",
          "requires": ["0.1.2.1"]
        },
        {
          "code": "0.1.3.1",
          "name": "Grafika",
          "ownerRole": "GRAPHIC",
          "estimatedDays": 5,
          "phase": "DESIGN",
          "requires": ["0.1.2.3"]
        },
        {
          "code": "0.2.3.1",
          "name": "Specyfikacja techniczna",
          "ownerRole": "DESIGNER",
          "estimatedDays": 3,
          "phase": "DESIGN",
          "requires": ["0.1.2.3"]
        },
        {
          "code": "0.1.3.2",
          "name": "Wyposażenie stoiska",
          "ownerRole": "PM",
          "estimatedDays": 2,
          "phase": "ORDER",
          "requires": ["0.1.3.1"]
        },
        {
          "code": "0.2.4.2",
          "name": "Projekt wykonawczy",
          "ownerRole": "DESIGNER",
          "estimatedDays": 5,
          "phase": "PRODUCTION",
          "requires": ["0.1.4.1", "0.1.3.1"]
        },
        {
          "code": "0.2.4.3",
          "name": "Plan trawersu",
          "ownerRole": "DESIGNER",
          "estimatedDays": 3,
          "phase": "PRODUCTION",
          "requires": ["0.1.4.1", "0.2.3.1"]
        },
        {
          "code": "0.4.6.2",
          "name": "Schemat elektryczny",
          "ownerRole": "TECHNICIAN",
          "estimatedDays": 2,
          "phase": "PRODUCTION",
          "requires": ["0.2.3.1"]
        },
        {
          "code": "0.2.4.1",
          "name": "Lista załadunkowa",
          "ownerRole": "PRODUCTION",
          "estimatedDays": 1,
          "phase": "LOGISTICS",
          "requires": ["0.2.4.2"]
        },
        {
          "code": "0.2.5.1",
          "name": "Etykiety palet",
          "ownerRole": "PRODUCTION",
          "estimatedDays": 1,
          "phase": "LOGISTICS",
          "requires": ["0.1.3.1"]
        },
        {
          "code": "0.4.5.1",
          "name": "Podłoga",
          "ownerRole": "LOGISTICS",
          "estimatedDays": 2,
          "phase": "LOGISTICS",
          "requires": ["0.1.4.1"]
        },
        {
          "code": "0.3.5.1",
          "name": "Zlecenie spedycji",
          "ownerRole": "LOGISTICS",
          "estimatedDays": 1,
          "phase": "LOGISTICS",
          "requires": ["0.2.4.1"]
        },
        {
          "code": "0.3.5.2",
          "name": "Rezerwacja hotelu",
          "ownerRole": "LOGISTICS",
          "estimatedDays": 1,
          "phase": "LOGISTICS",
          "requires": []
        },
        {
          "code": "0.3.5.3",
          "name": "Zamówienie wózka widłowego",
          "ownerRole": "LOGISTICS",
          "estimatedDays": 1,
          "phase": "LOGISTICS",
          "requires": []
        },
        {
          "code": "0.4.6.1",
          "name": "Plan montażu",
          "ownerRole": "PM",
          "estimatedDays": 2,
          "phase": "ASSEMBLY",
          "requires": ["0.2.4.2", "0.4.6.2"]
        },
        {
          "code": "0.6.4.1",
          "name": "Lista usterek",
          "ownerRole": "FOREMAN",
          "estimatedDays": 0,
          "phase": "ASSEMBLY",
          "requires": ["0.4.6.1"]
        },
        {
          "code": "0.4.3.1",
          "name": "Zamówienia uzupełniające",
          "ownerRole": "PRODUCTION",
          "estimatedDays": 1,
          "phase": "ASSEMBLY",
          "requires": ["0.6.4.1"]
        },
        {
          "code": "0.7.1.1",
          "name": "Protokół przekazania",
          "ownerRole": "PM",
          "estimatedDays": 0,
          "phase": "HANDOVER",
          "requires": ["0.4.6.1"]
        },
        {
          "code": "0.1.7.1",
          "name": "Pokwitowanie",
          "ownerRole": "SALES",
          "estimatedDays": 1,
          "phase": "HANDOVER",
          "requires": ["0.7.1.1"]
        }
      ]
    }
  ],
  
  "recipes": [
    {
      "code": "delivery.date_changed",
      "name": "Zmiana terminu dostawy",
      "description": "Element zostanie dostarczony w innym terminie",
      "projectTypeCodes": ["TRADE_SHOW_BOOTH"],
      "actions": [
        { "taskName": "Potwierdź z dostawcą nowy termin", "ownerRole": "LOGISTICS", "deadlineHours": 2, "priority": "URGENT" },
        { "taskName": "Sprawdź wpływ na harmonogram montażu", "ownerRole": "PM", "deadlineHours": 4, "priority": "URGENT" },
        { "taskName": "Zaktualizuj plan transportu", "ownerRole": "LOGISTICS", "deadlineHours": 24, "priority": "IMPORTANT" }
      ]
    },
    {
      "code": "artwork.updated",
      "name": "Zmiana grafiki",
      "description": "Klient dostarczył nowe pliki graficzne",
      "projectTypeCodes": ["TRADE_SHOW_BOOTH"],
      "actions": [
        { "taskName": "Weryfikacja plików (format, spady, fonty)", "ownerRole": "GRAPHIC", "deadlineHours": 4, "priority": "URGENT" },
        { "taskName": "Wyślij do druku / potwierdź proof", "ownerRole": "GRAPHIC", "deadlineHours": 8, "priority": "IMPORTANT" },
        { "taskName": "Oceń wpływ na koszt i termin", "ownerRole": "PM", "deadlineHours": 24, "priority": "IMPORTANT" }
      ]
    },
    {
      "code": "missing_or_damaged",
      "name": "Brak lub uszkodzenie elementu",
      "description": "Element brakuje lub jest uszkodzony",
      "projectTypeCodes": ["TRADE_SHOW_BOOTH", "CORPORATE_EVENT"],
      "actions": [
        { "taskName": "Dokumentacja zdjęciowa + opis", "ownerRole": "FOREMAN", "deadlineHours": 0.5, "priority": "URGENT_IMPORTANT" },
        { "taskName": "Zamów zamiennik / ekspresowa dostawa", "ownerRole": "LOGISTICS", "deadlineHours": 2, "priority": "URGENT_IMPORTANT" },
        { "taskName": "Powiadom klienta", "ownerRole": "PM", "deadlineHours": 2, "priority": "URGENT" },
        { "taskName": "Aktualizacja kosztów / ryzyk", "ownerRole": "PM", "deadlineHours": 24, "priority": "IMPORTANT" }
      ]
    },
    {
      "code": "booth.layout_changed",
      "name": "Zmiana layoutu stoiska",
      "description": "Zmiana wymiarów lub układu",
      "projectTypeCodes": ["TRADE_SHOW_BOOTH"],
      "actions": [
        { "taskName": "Zaktualizuj rysunki / plan montażu", "ownerRole": "DESIGNER", "deadlineHours": 24, "priority": "URGENT" },
        { "taskName": "Zweryfikuj zgodność z regulaminem", "ownerRole": "PM", "deadlineHours": 24, "priority": "IMPORTANT" },
        { "taskName": "Aktualizuj listę elementów (BOM)", "ownerRole": "PRODUCTION", "deadlineHours": 24, "priority": "IMPORTANT" },
        { "taskName": "Sprawdź wymagania elektryki/AV", "ownerRole": "TECHNICIAN", "deadlineHours": 24, "priority": "NORMAL" }
      ]
    },
    {
      "code": "onsite.urgent_update",
      "name": "Pilna informacja onsite",
      "description": "Zmiana godzin, wjazd, przepustki",
      "projectTypeCodes": ["TRADE_SHOW_BOOTH", "CORPORATE_EVENT"],
      "actions": [
        { "taskName": "Potwierdź odbiór informacji (ACK)", "ownerRole": "FOREMAN", "deadlineHours": 0.25, "priority": "URGENT_IMPORTANT" },
        { "taskName": "Zaktualizuj harmonogram ekipy", "ownerRole": "FOREMAN", "deadlineHours": 0.5, "priority": "URGENT" }
      ]
    },
    {
      "code": "scope.change_request",
      "name": "Zmiana zakresu",
      "description": "Klient chce zmienić zakres projektu",
      "projectTypeCodes": ["TRADE_SHOW_BOOTH", "CORPORATE_EVENT", "EXHIBITION"],
      "actions": [
        { "taskName": "Analiza wpływu na harmonogram", "ownerRole": "PM", "deadlineHours": 24, "priority": "URGENT" },
        { "taskName": "Wycena dodatkowych prac", "ownerRole": "SALES", "deadlineHours": 48, "priority": "IMPORTANT" },
        { "taskName": "Przygotuj aneks do umowy", "ownerRole": "SALES", "deadlineHours": 72, "priority": "NORMAL" }
      ]
    },
    {
      "code": "cost.increase_alert",
      "name": "Wzrost kosztów",
      "description": "Ryzyko przekroczenia budżetu",
      "projectTypeCodes": ["TRADE_SHOW_BOOTH", "CORPORATE_EVENT", "EXHIBITION"],
      "actions": [
        { "taskName": "Analiza przyczyn wzrostu", "ownerRole": "PM", "deadlineHours": 24, "priority": "IMPORTANT" },
        { "taskName": "Przygotuj opcje ograniczenia kosztów", "ownerRole": "PM", "deadlineHours": 48, "priority": "IMPORTANT" },
        { "taskName": "Spotkanie z klientem", "ownerRole": "SALES", "deadlineHours": 72, "priority": "NORMAL" }
      ]
    },
    {
      "code": "client.approval_required",
      "name": "Wymagana akceptacja klienta",
      "description": "Coś wymaga zatwierdzenia przez klienta",
      "projectTypeCodes": ["TRADE_SHOW_BOOTH", "CORPORATE_EVENT", "EXHIBITION"],
      "actions": [
        { "taskName": "Wyślij materiały do akceptacji", "ownerRole": "PM", "deadlineHours": 4, "priority": "URGENT" },
        { "taskName": "Follow-up jeśli brak odpowiedzi", "ownerRole": "PM", "deadlineHours": 24, "priority": "NORMAL" }
      ]
    }
  ],
  
  "config": {
    "terminology": {
      "project": "Realizacja",
      "task": "Dokument",
      "deal": "Zlecenie"
    },
    "defaultRoles": ["SALES", "PM", "DESIGNER", "GRAPHIC", "PRODUCTION", "LOGISTICS", "FOREMAN", "TECHNICIAN"],
    "features": ["trade_show_calendar", "gantt_view", "critical_path"]
  }
}
```

---

## 9. PAKIET: KSIĘGOWOŚĆ

### Plik: `packages/backend/prisma/seeds/industry-packs/accounting.json`

```json
{
  "code": "accounting",
  "name": "Biuro rachunkowe",
  "nameEn": "Accounting Office",
  "description": "Obsługa księgowa, kadry, rozliczenia",
  "icon": "📊",
  "color": "#4CAF50",
  
  "projectTypes": [
    {
      "code": "MONTHLY_SETTLEMENT",
      "name": "Rozliczenie miesięczne",
      "description": "Comiesięczne rozliczenie klienta",
      "icon": "📅"
    },
    {
      "code": "ANNUAL_SETTLEMENT",
      "name": "Rozliczenie roczne",
      "description": "Zamknięcie roku, CIT/PIT",
      "icon": "📆"
    },
    {
      "code": "AUDIT",
      "name": "Audyt",
      "description": "Audyt wewnętrzny lub zewnętrzny",
      "icon": "🔍"
    },
    {
      "code": "CLIENT_ONBOARDING",
      "name": "Wdrożenie klienta",
      "description": "Nowy klient - setup",
      "icon": "🤝"
    }
  ],
  
  "templates": [
    {
      "projectTypeCode": "MONTHLY_SETTLEMENT",
      "name": "Rozliczenie miesięczne (standard)",
      "isDefault": true,
      "tasks": [
        { "code": "M.01", "name": "Pobranie wyciągów bankowych", "ownerRole": "ACCOUNTANT", "estimatedDays": 1, "phase": "COLLECT", "requires": [] },
        { "code": "M.02", "name": "Zebranie faktur od klienta", "ownerRole": "CLIENT", "estimatedDays": 5, "phase": "COLLECT", "requires": [] },
        { "code": "M.03", "name": "Weryfikacja kompletności dokumentów", "ownerRole": "ACCOUNTANT", "estimatedDays": 1, "phase": "COLLECT", "requires": ["M.02"] },
        { "code": "M.04", "name": "Księgowanie dokumentów", "ownerRole": "ACCOUNTANT", "estimatedDays": 3, "phase": "PROCESS", "requires": ["M.01", "M.03"] },
        { "code": "M.05", "name": "Uzgodnienie VAT", "ownerRole": "ACCOUNTANT", "estimatedDays": 1, "phase": "PROCESS", "requires": ["M.04"] },
        { "code": "M.06", "name": "Wyliczenie zaliczek PIT/CIT", "ownerRole": "ACCOUNTANT", "estimatedDays": 1, "phase": "CALCULATE", "requires": ["M.04"] },
        { "code": "M.07", "name": "Wysłanie JPK_VAT", "ownerRole": "ACCOUNTANT", "estimatedDays": 1, "phase": "SUBMIT", "requires": ["M.05"] },
        { "code": "M.08", "name": "Informacja do klienta o płatnościach", "ownerRole": "ACCOUNTANT", "estimatedDays": 1, "phase": "COMMUNICATE", "requires": ["M.06"] }
      ]
    },
    {
      "projectTypeCode": "ANNUAL_SETTLEMENT",
      "name": "Rozliczenie roczne (standard)",
      "isDefault": true,
      "tasks": [
        { "code": "R.01", "name": "Inwentaryzacja", "ownerRole": "ACCOUNTANT", "estimatedDays": 5, "phase": "PREPARE", "requires": [] },
        { "code": "R.02", "name": "Uzgodnienie sald", "ownerRole": "ACCOUNTANT", "estimatedDays": 3, "phase": "PREPARE", "requires": ["R.01"] },
        { "code": "R.03", "name": "Zamknięcie ksiąg", "ownerRole": "SENIOR_ACCOUNTANT", "estimatedDays": 2, "phase": "CLOSE", "requires": ["R.02"] },
        { "code": "R.04", "name": "Sporządzenie sprawozdania", "ownerRole": "SENIOR_ACCOUNTANT", "estimatedDays": 5, "phase": "REPORT", "requires": ["R.03"] },
        { "code": "R.05", "name": "Deklaracja CIT/PIT", "ownerRole": "SENIOR_ACCOUNTANT", "estimatedDays": 2, "phase": "SUBMIT", "requires": ["R.04"] },
        { "code": "R.06", "name": "Złożenie do KRS", "ownerRole": "ACCOUNTANT", "estimatedDays": 1, "phase": "SUBMIT", "requires": ["R.04"] }
      ]
    },
    {
      "projectTypeCode": "CLIENT_ONBOARDING",
      "name": "Wdrożenie nowego klienta",
      "isDefault": true,
      "tasks": [
        { "code": "O.01", "name": "Podpisanie umowy", "ownerRole": "MANAGER", "estimatedDays": 2, "phase": "CONTRACT", "requires": [] },
        { "code": "O.02", "name": "Zebranie dokumentów założycielskich", "ownerRole": "ACCOUNTANT", "estimatedDays": 3, "phase": "COLLECT", "requires": ["O.01"] },
        { "code": "O.03", "name": "Rejestracja w systemie", "ownerRole": "ACCOUNTANT", "estimatedDays": 1, "phase": "SETUP", "requires": ["O.02"] },
        { "code": "O.04", "name": "Upoważnienia (ZUS, US)", "ownerRole": "ACCOUNTANT", "estimatedDays": 2, "phase": "SETUP", "requires": ["O.02"] },
        { "code": "O.05", "name": "Przejęcie dokumentacji", "ownerRole": "ACCOUNTANT", "estimatedDays": 5, "phase": "TRANSFER", "requires": ["O.03", "O.04"] },
        { "code": "O.06", "name": "Szkolenie klienta", "ownerRole": "ACCOUNTANT", "estimatedDays": 1, "phase": "TRAIN", "requires": ["O.05"] }
      ]
    }
  ],
  
  "recipes": [
    {
      "code": "docs.missing",
      "name": "Brak dokumentów od klienta",
      "description": "Klient nie dostarczył wymaganych dokumentów",
      "projectTypeCodes": ["MONTHLY_SETTLEMENT", "ANNUAL_SETTLEMENT"],
      "actions": [
        { "taskName": "Wysłanie przypomnienia do klienta", "ownerRole": "ACCOUNTANT", "deadlineHours": 4, "priority": "URGENT" },
        { "taskName": "Telefon do klienta", "ownerRole": "ACCOUNTANT", "deadlineHours": 24, "priority": "IMPORTANT" },
        { "taskName": "Eskalacja do opiekuna klienta", "ownerRole": "MANAGER", "deadlineHours": 48, "priority": "NORMAL" }
      ]
    },
    {
      "code": "deadline.risk",
      "name": "Ryzyko przekroczenia terminu",
      "description": "Termin ustawowy może być zagrożony",
      "projectTypeCodes": ["MONTHLY_SETTLEMENT", "ANNUAL_SETTLEMENT"],
      "actions": [
        { "taskName": "Ocena ryzyka i plan naprawczy", "ownerRole": "SENIOR_ACCOUNTANT", "deadlineHours": 4, "priority": "URGENT_IMPORTANT" },
        { "taskName": "Informacja do klienta", "ownerRole": "MANAGER", "deadlineHours": 8, "priority": "URGENT" },
        { "taskName": "Przydzielenie dodatkowych zasobów", "ownerRole": "MANAGER", "deadlineHours": 24, "priority": "IMPORTANT" }
      ]
    },
    {
      "code": "regulation.change",
      "name": "Zmiana przepisów",
      "description": "Nowe przepisy wpływające na rozliczenia",
      "projectTypeCodes": ["MONTHLY_SETTLEMENT", "ANNUAL_SETTLEMENT"],
      "actions": [
        { "taskName": "Analiza wpływu na klientów", "ownerRole": "SENIOR_ACCOUNTANT", "deadlineHours": 48, "priority": "IMPORTANT" },
        { "taskName": "Aktualizacja procedur", "ownerRole": "MANAGER", "deadlineHours": 72, "priority": "IMPORTANT" },
        { "taskName": "Informacja do klientów", "ownerRole": "MANAGER", "deadlineHours": 168, "priority": "NORMAL" }
      ]
    },
    {
      "code": "client.employee_change",
      "name": "Zmiana u klienta (pracownik)",
      "description": "Zatrudnienie/zwolnienie/zmiana u klienta",
      "projectTypeCodes": ["MONTHLY_SETTLEMENT"],
      "actions": [
        { "taskName": "Zebranie dokumentów kadrowych", "ownerRole": "ACCOUNTANT", "deadlineHours": 24, "priority": "URGENT" },
        { "taskName": "Aktualizacja w ZUS", "ownerRole": "ACCOUNTANT", "deadlineHours": 48, "priority": "IMPORTANT" },
        { "taskName": "Aktualizacja listy płac", "ownerRole": "ACCOUNTANT", "deadlineHours": 48, "priority": "IMPORTANT" }
      ]
    },
    {
      "code": "error.correction",
      "name": "Korekta błędu",
      "description": "Wykryto błąd wymagający korekty",
      "projectTypeCodes": ["MONTHLY_SETTLEMENT", "ANNUAL_SETTLEMENT"],
      "actions": [
        { "taskName": "Analiza błędu i wpływu", "ownerRole": "SENIOR_ACCOUNTANT", "deadlineHours": 4, "priority": "URGENT_IMPORTANT" },
        { "taskName": "Przygotowanie korekty", "ownerRole": "ACCOUNTANT", "deadlineHours": 24, "priority": "URGENT" },
        { "taskName": "Weryfikacja korekty", "ownerRole": "SENIOR_ACCOUNTANT", "deadlineHours": 48, "priority": "IMPORTANT" },
        { "taskName": "Informacja do klienta", "ownerRole": "MANAGER", "deadlineHours": 48, "priority": "IMPORTANT" }
      ]
    }
  ],
  
  "config": {
    "terminology": {
      "project": "Rozliczenie",
      "task": "Czynność",
      "deal": "Umowa"
    },
    "defaultRoles": ["MANAGER", "SENIOR_ACCOUNTANT", "ACCOUNTANT", "CLIENT"],
    "features": ["statutory_calendar", "deadline_alerts", "client_portal"]
  }
}
```

---

## 10. PAKIET: SZKOŁA

### Plik: `packages/backend/prisma/seeds/industry-packs/education.json`

```json
{
  "code": "education",
  "name": "Szkoła / placówka edukacyjna",
  "nameEn": "School / Educational Institution",
  "description": "Szkoły, przedszkola, ośrodki szkoleniowe",
  "icon": "🎓",
  "color": "#2196F3",
  
  "projectTypes": [
    {
      "code": "SCHOOL_YEAR",
      "name": "Rok szkolny ucznia",
      "description": "Cały rok szkolny dla ucznia",
      "icon": "📚"
    },
    {
      "code": "TUTORING",
      "name": "Tutoring",
      "description": "Indywidualne wsparcie ucznia",
      "icon": "👨‍🏫"
    },
    {
      "code": "RESTORATIVE_PROCESS",
      "name": "Proces restoratywny",
      "description": "Rozwiązywanie konfliktów",
      "icon": "🤝"
    },
    {
      "code": "SCHOOL_TRIP",
      "name": "Wycieczka szkolna",
      "description": "Organizacja wycieczki",
      "icon": "🚌"
    }
  ],
  
  "templates": [
    {
      "projectTypeCode": "TUTORING",
      "name": "Tutoring semestralny",
      "isDefault": true,
      "tasks": [
        { "code": "T.01", "name": "Spotkanie diagnostyczne", "ownerRole": "TUTOR", "estimatedDays": 1, "phase": "DIAGNOSE", "requires": [] },
        { "code": "T.02", "name": "Ustalenie celów z uczniem", "ownerRole": "TUTOR", "estimatedDays": 1, "phase": "PLAN", "requires": ["T.01"] },
        { "code": "T.03", "name": "Spotkanie z rodzicami", "ownerRole": "TUTOR", "estimatedDays": 1, "phase": "PLAN", "requires": ["T.01"] },
        { "code": "T.04", "name": "Plan pracy tutorskiej", "ownerRole": "TUTOR", "estimatedDays": 2, "phase": "PLAN", "requires": ["T.02", "T.03"] },
        { "code": "T.05", "name": "Sesje tutorskie (cykliczne)", "ownerRole": "TUTOR", "estimatedDays": 60, "phase": "EXECUTE", "requires": ["T.04"] },
        { "code": "T.06", "name": "Przegląd śródsemestralny", "ownerRole": "TUTOR", "estimatedDays": 1, "phase": "REVIEW", "requires": ["T.05"] },
        { "code": "T.07", "name": "Podsumowanie semestru", "ownerRole": "TUTOR", "estimatedDays": 2, "phase": "CLOSE", "requires": ["T.05"] }
      ]
    },
    {
      "projectTypeCode": "RESTORATIVE_PROCESS",
      "name": "Proces restoratywny (standard)",
      "isDefault": true,
      "tasks": [
        { "code": "RP.01", "name": "Zgłoszenie incydentu", "ownerRole": "TEACHER", "estimatedDays": 1, "phase": "REPORT", "requires": [] },
        { "code": "RP.02", "name": "Rozmowy wstępne (osobno)", "ownerRole": "MEDIATOR", "estimatedDays": 2, "phase": "PREPARE", "requires": ["RP.01"] },
        { "code": "RP.03", "name": "Ocena gotowości stron", "ownerRole": "MEDIATOR", "estimatedDays": 1, "phase": "PREPARE", "requires": ["RP.02"] },
        { "code": "RP.04", "name": "Spotkanie restoratywne", "ownerRole": "MEDIATOR", "estimatedDays": 1, "phase": "MEDIATE", "requires": ["RP.03"] },
        { "code": "RP.05", "name": "Ustalenie porozumienia", "ownerRole": "MEDIATOR", "estimatedDays": 1, "phase": "AGREE", "requires": ["RP.04"] },
        { "code": "RP.06", "name": "Monitoring realizacji", "ownerRole": "MEDIATOR", "estimatedDays": 14, "phase": "MONITOR", "requires": ["RP.05"] },
        { "code": "RP.07", "name": "Spotkanie podsumowujące", "ownerRole": "MEDIATOR", "estimatedDays": 1, "phase": "CLOSE", "requires": ["RP.06"] }
      ]
    },
    {
      "projectTypeCode": "SCHOOL_TRIP",
      "name": "Wycieczka szkolna (standard)",
      "isDefault": true,
      "tasks": [
        { "code": "WT.01", "name": "Ustalenie celu i programu", "ownerRole": "TEACHER", "estimatedDays": 3, "phase": "PLAN", "requires": [] },
        { "code": "WT.02", "name": "Rezerwacja transportu", "ownerRole": "ADMIN", "estimatedDays": 5, "phase": "BOOK", "requires": ["WT.01"] },
        { "code": "WT.03", "name": "Rezerwacja noclegów", "ownerRole": "ADMIN", "estimatedDays": 5, "phase": "BOOK", "requires": ["WT.01"] },
        { "code": "WT.04", "name": "Zebranie zgód rodziców", "ownerRole": "TEACHER", "estimatedDays": 14, "phase": "COLLECT", "requires": ["WT.01"] },
        { "code": "WT.05", "name": "Lista uczestników", "ownerRole": "TEACHER", "estimatedDays": 1, "phase": "PREPARE", "requires": ["WT.04"] },
        { "code": "WT.06", "name": "Instrukcja dla uczestników", "ownerRole": "TEACHER", "estimatedDays": 2, "phase": "PREPARE", "requires": ["WT.05"] },
        { "code": "WT.07", "name": "Realizacja wycieczki", "ownerRole": "TEACHER", "estimatedDays": 3, "phase": "EXECUTE", "requires": ["WT.02", "WT.03", "WT.06"] },
        { "code": "WT.08", "name": "Rozliczenie finansowe", "ownerRole": "ADMIN", "estimatedDays": 5, "phase": "CLOSE", "requires": ["WT.07"] }
      ]
    }
  ],
  
  "recipes": [
    {
      "code": "absence.alert",
      "name": "Nieobecność ucznia",
      "description": "Uczeń nieobecny więcej niż 3 dni",
      "projectTypeCodes": ["SCHOOL_YEAR", "TUTORING"],
      "actions": [
        { "taskName": "Kontakt z rodzicami", "ownerRole": "TUTOR", "deadlineHours": 24, "priority": "URGENT" },
        { "taskName": "Sprawdzenie powodu nieobecności", "ownerRole": "TUTOR", "deadlineHours": 48, "priority": "IMPORTANT" },
        { "taskName": "Plan nadrobienia zaległości", "ownerRole": "TUTOR", "deadlineHours": 72, "priority": "NORMAL" }
      ]
    },
    {
      "code": "conflict.new",
      "name": "Nowy konflikt rówieśniczy",
      "description": "Zgłoszono konflikt między uczniami",
      "projectTypeCodes": ["SCHOOL_YEAR"],
      "actions": [
        { "taskName": "Rozmowa z uczniami (osobno)", "ownerRole": "TEACHER", "deadlineHours": 4, "priority": "URGENT_IMPORTANT" },
        { "taskName": "Ocena powagi sytuacji", "ownerRole": "TEACHER", "deadlineHours": 8, "priority": "URGENT" },
        { "taskName": "Decyzja: mediacja czy eskalacja", "ownerRole": "PEDAGOGUE", "deadlineHours": 24, "priority": "IMPORTANT" }
      ]
    },
    {
      "code": "grade.drop",
      "name": "Spadek wyników",
      "description": "Znaczący spadek ocen ucznia",
      "projectTypeCodes": ["SCHOOL_YEAR", "TUTORING"],
      "actions": [
        { "taskName": "Rozmowa z uczniem", "ownerRole": "TUTOR", "deadlineHours": 48, "priority": "IMPORTANT" },
        { "taskName": "Analiza przyczyn", "ownerRole": "TUTOR", "deadlineHours": 72, "priority": "IMPORTANT" },
        { "taskName": "Kontakt z rodzicami", "ownerRole": "TUTOR", "deadlineHours": 72, "priority": "IMPORTANT" },
        { "taskName": "Plan wsparcia", "ownerRole": "TUTOR", "deadlineHours": 120, "priority": "NORMAL" }
      ]
    },
    {
      "code": "consent.missing",
      "name": "Brak zgody rodzica",
      "description": "Rodzic nie dostarczył wymaganej zgody",
      "projectTypeCodes": ["SCHOOL_TRIP"],
      "actions": [
        { "taskName": "Przypomnienie do rodzica", "ownerRole": "TEACHER", "deadlineHours": 24, "priority": "URGENT" },
        { "taskName": "Telefon do rodzica", "ownerRole": "TEACHER", "deadlineHours": 48, "priority": "IMPORTANT" },
        { "taskName": "Decyzja o uczestnictwie dziecka", "ownerRole": "TEACHER", "deadlineHours": 72, "priority": "IMPORTANT" }
      ]
    },
    {
      "code": "parent.complaint",
      "name": "Skarga rodzica",
      "description": "Rodzic złożył skargę lub uwagę",
      "projectTypeCodes": ["SCHOOL_YEAR", "TUTORING"],
      "actions": [
        { "taskName": "Potwierdzenie otrzymania skargi", "ownerRole": "ADMIN", "deadlineHours": 4, "priority": "URGENT" },
        { "taskName": "Zebranie informacji", "ownerRole": "TEACHER", "deadlineHours": 24, "priority": "URGENT" },
        { "taskName": "Spotkanie z rodzicem", "ownerRole": "MANAGER", "deadlineHours": 72, "priority": "IMPORTANT" },
        { "taskName": "Odpowiedź na skargę", "ownerRole": "MANAGER", "deadlineHours": 120, "priority": "IMPORTANT" }
      ]
    }
  ],
  
  "config": {
    "terminology": {
      "project": "Sprawa",
      "task": "Działanie",
      "deal": "Współpraca",
      "company": "Rodzina",
      "contact": "Rodzic/Opiekun"
    },
    "defaultRoles": ["MANAGER", "TEACHER", "TUTOR", "PEDAGOGUE", "MEDIATOR", "ADMIN"],
    "features": ["student_profile", "parent_portal", "calendar_sync"]
  }
}
```

---

# CZĘŚĆ C: WDROŻENIE

## 11. KOLEJNOŚĆ IMPLEMENTACJI

### Faza 1: Silnik (3-4 dni)

```
☐ 1. Migracja bazy danych
☐ 2. Modele Prisma
☐ 3. Template Engine (generowanie tasków)
☐ 4. Recipe Engine (reakcje na zmiany)
☐ 5. Industry Pack Manager
☐ 6. API Endpoints
```

### Faza 2: UI podstawowe (2-3 dni)

```
☐ 7. Komponent wyboru typu projektu
☐ 8. Rozszerzenie formularza "Nowy projekt"
☐ 9. Modal zgłaszania zmiany
☐ 10. Historia zmian w projekcie
```

### Faza 3: Pakiety (1 dzień per pakiet)

```
☐ 11. Seed: pakiet TARGI
☐ 12. Seed: pakiet KSIĘGOWOŚĆ
☐ 13. Seed: pakiet SZKOŁA
```

### Faza 4: Onboarding (2 dni)

```
☐ 14. Ekran wyboru branży
☐ 15. Aktywacja pakietu
☐ 16. Widok "Moje typy projektów"
```

### Faza 5: Rozszerzenia (opcjonalne)

```
☐ 17. Widok Gantta
☐ 18. Graf zależności
☐ 19. Ścieżka krytyczna (wizualizacja)
☐ 20. Kalendarz branżowy (targi, terminy ustawowe)
```

---

## 12. ONBOARDING KLIENTA

### Flow

```
NOWY KLIENT:

1. Rejestracja
   ↓
2. "Wybierz swoją branżę"
   ○ 🎪 Firma targowa / eventowa
   ○ 📊 Biuro rachunkowe  
   ○ 🎓 Szkoła / placówka edukacyjna
   ○ 📢 Agencja marketingowa
   ○ ⚙️ Inna / uniwersalna
   ↓
3. System aktywuje pakiet
   ↓
4. "Masz dostępne typy projektów:"
   • Stoisko targowe
   • Wydarzenie firmowe
   • ...
   ↓
5. "Utwórz pierwszy projekt"
   ↓
6. System generuje strukturę z szablonu
   ↓
7. GOTOWE!
```

---

## PODSUMOWANIE

### Co budujemy raz (SILNIK):

| Element | Nakład |
|---------|--------|
| Migracja + modele | 4h |
| Template Engine | 4h |
| Recipe Engine | 4h |
| API Endpoints | 4h |
| UI komponenty | 8h |
| **RAZEM** | **~3 dni** |

### Co dodajemy per branża (PAKIET):

| Element | Nakład |
|---------|--------|
| JSON z definicją | 2-4h |
| Seed do bazy | 1h |
| Testy | 1h |
| **RAZEM** | **~1 dzień** |

---

### Kluczowa wartość:

> **Silnik uniwersalny + Pakiety konfigurowalne = Skalowalne wdrożenia**

```
Klient 1 (targi):      Pakiet TARGI      → działa
Klient 2 (księgowość): Pakiet KSIĘGOWOŚĆ → działa
Klient 3 (szkoła):     Pakiet SZKOŁA     → działa
Klient 4 (nowa branża): Nowy JSON        → działa
```

---

**© 2025 Sorto**
*System Szablonów i Recept v2.0*
