# 🛠️ SORTO CRM - Specyfikacja Techniczna
## Holding Multi-Company + AI Agenci
### Dla: Claude Code | Wersja: 1.0

---

# CZĘŚĆ 1: STRUKTURA HOLDINGOWA

## 1.1 Schemat Prisma

```prisma
// ===========================================
// HOLDING & COMPANIES
// ===========================================

model Holding {
  id          String   @id @default(cuid())
  name        String   // "Grupa Tubex"
  nip         String?  // NIP spółki matki (opcjonalny)
  
  ownerId     String   // User który jest właścicielem
  owner       User     @relation("HoldingOwner", fields: [ownerId], references: [id])
  
  companies   Company[]
  
  settings    Json     @default("{}")  // HoldingSettings
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([ownerId])
}

model Company {
  id          String   @id @default(cuid())
  holdingId   String
  holding     Holding  @relation(fields: [holdingId], references: [id], onDelete: Cascade)
  
  name        String   // "Tubex Production Sp. z o.o."
  shortName   String   // "Tubex Prod"
  nip         String   @unique  // Unikalny NIP
  
  type        CompanyType @default(OTHER)
  color       String   @default("#3b82f6")  // Kolor identyfikacyjny
  icon        String?  // Emoji lub URL ikony
  
  settings    Json     @default("{}")  // CompanySettings
  
  // Relacje - wszystko per company
  employees   Employee[]
  clients     Client[]
  contacts    Contact[]
  deals       Deal[]
  streams     Stream[]
  tasks       Task[]
  activities  Activity[]
  aiAgents    AIAgentAssignment[]
  
  // Strumienie bazowe (auto-tworzone)
  baseStreamsCreated Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([holdingId])
  @@index([nip])
}

enum CompanyType {
  PRODUCTION
  SALES
  SERVICES
  EXPORT
  OTHER
}

// ===========================================
// EMPLOYEES (Users in Company context)
// ===========================================

model Employee {
  id          String   @id @default(cuid())
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  role        EmployeeRole @default(EMPLOYEE)
  position    String?  // "Dyrektor Handlowy"
  department  String?  // "Sprzedaż"
  
  // Dostęp do innych spółek (opcjonalnie)
  additionalCompanyAccess CompanyAccess[]
  
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, companyId])  // User może mieć tylko 1 profil w spółce
  @@index([companyId])
  @@index([userId])
}

enum EmployeeRole {
  ADMIN       // Pełny dostęp do spółki
  MANAGER     // Zarządza zespołem
  EMPLOYEE    // Standardowy pracownik
  VIEWER      // Tylko podgląd
}

model CompanyAccess {
  id          String   @id @default(cuid())
  
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  companyId   String   // Dodatkowa spółka do której ma dostęp
  
  accessLevel AccessLevel @default(READ)
  
  createdAt   DateTime @default(now())
  
  @@unique([employeeId, companyId])
}

enum AccessLevel {
  READ        // Tylko podgląd
  WRITE       // Może edytować
  FULL        // Pełny dostęp
}

// ===========================================
// CLIENTS & CONTACTS (z separacją i linkowaniem)
// ===========================================

model Client {
  id          String   @id @default(cuid())
  
  companyId   String   // Należy do TEJ spółki
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Linkowanie między spółkami (opcjonalne)
  globalId    String?  // Wspólny ID dla tej samej firmy w różnych spółkach
  
  name        String
  nip         String?  // NIP klienta (do matchowania)
  
  industry    String?
  size        ClientSize?
  status      ClientStatus @default(PROSPECT)
  
  website     String?
  address     String?
  city        String?
  country     String   @default("PL")
  
  // Dane specyficzne dla tej spółki
  tags        String[] @default([])
  customFields Json    @default("{}")
  
  contacts    Contact[]
  deals       Deal[]
  activities  Activity[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([companyId])
  @@index([globalId])
  @@index([nip])
}

enum ClientSize {
  STARTUP
  SMALL
  MEDIUM
  LARGE
  ENTERPRISE
}

enum ClientStatus {
  PROSPECT
  ACTIVE
  INACTIVE
  CHURNED
}

model Contact {
  id          String   @id @default(cuid())
  
  companyId   String   // Należy do TEJ spółki
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  clientId    String?
  client      Client?  @relation(fields: [clientId], references: [id], onDelete: SetNull)
  
  // Linkowanie między spółkami
  globalId    String?  // Wspólny ID dla tej samej osoby w różnych spółkach
  
  firstName   String
  lastName    String
  email       String?
  phone       String?
  
  // Dane specyficzne dla tej spółki
  role        String?  // Rola w kontekście TEJ relacji
  department  String?
  
  // Contact Intelligence (per spółka!)
  likes       String[] @default([])
  dislikes    String[] @default([])
  notes       String?
  
  tags        String[] @default([])
  customFields Json    @default("{}")
  
  activities  Activity[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([companyId])
  @@index([clientId])
  @@index([globalId])
  @@index([email])
}

// ===========================================
// DEALS (zawsze per company)
// ===========================================

model Deal {
  id          String   @id @default(cuid())
  
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  
  name        String
  value       Decimal  @db.Decimal(12, 2)
  currency    String   @default("PLN")
  
  stage       DealStage @default(LEAD)
  probability Int      @default(10)  // 0-100
  
  expectedCloseDate DateTime?
  actualCloseDate   DateTime?
  
  ownerId     String   // Employee lub AIAgent
  ownerType   OwnerType @default(HUMAN)
  
  // AI Agent jako asystent (opcjonalnie)
  aiAssistantId String?
  
  lostReason  String?
  wonReason   String?
  
  tags        String[] @default([])
  customFields Json    @default("{}")
  
  tasks       Task[]
  activities  Activity[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([companyId])
  @@index([clientId])
  @@index([stage])
  @@index([ownerId])
}

enum DealStage {
  LEAD
  QUALIFIED
  PROPOSAL
  NEGOTIATION
  WON
  LOST
}

enum OwnerType {
  HUMAN
  AI_AGENT
}

// ===========================================
// STREAMS (per company)
// ===========================================

model Stream {
  id          String   @id @default(cuid())
  
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  parentId    String?  // Dopływ - należy do innego strumienia
  parent      Stream?  @relation("StreamHierarchy", fields: [parentId], references: [id])
  children    Stream[] @relation("StreamHierarchy")
  
  name        String
  description String?
  icon        String?  // Emoji
  color       String   @default("#3b82f6")
  
  status      StreamStatus @default(FLOWING)
  type        StreamType   @default(PROJECT)
  
  // Czy to strumień bazowy (auto-tworzony)
  isBase      Boolean  @default(false)
  
  deadline    DateTime?
  
  ownerId     String?
  ownerType   OwnerType @default(HUMAN)
  
  tags        String[] @default([])
  
  tasks       Task[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([companyId])
  @@index([parentId])
  @@index([status])
}

enum StreamStatus {
  FLOWING     // Aktywny
  FROZEN      // Zamrożony
}

enum StreamType {
  PROJECT     // Z deadline'em
  CONTINUOUS  // Ciągły obszar
  REFERENCE   // Baza wiedzy
}

// ===========================================
// TASKS (per company, assignable to human or AI)
// ===========================================

model Task {
  id          String   @id @default(cuid())
  
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  streamId    String?
  stream      Stream?  @relation(fields: [streamId], references: [id], onDelete: SetNull)
  
  dealId      String?
  deal        Deal?    @relation(fields: [dealId], references: [id], onDelete: SetNull)
  
  title       String
  description String?
  
  status      TaskStatus @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  
  dueDate     DateTime?
  completedAt DateTime?
  
  // Przypisanie - może być człowiek LUB agent
  assigneeId  String?
  assigneeType OwnerType @default(HUMAN)
  
  // Kto zlecił (zawsze człowiek)
  createdById String
  
  // Estymacja i tracking czasu
  estimatedMinutes Int?
  trackedMinutes   Int  @default(0)
  
  tags        String[] @default([])
  
  subtasks    Subtask[]
  activities  Activity[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([companyId])
  @@index([streamId])
  @@index([dealId])
  @@index([assigneeId, assigneeType])
  @@index([status])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  WAITING
  DONE
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Subtask {
  id          String   @id @default(cuid())
  taskId      String
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  title       String
  isDone      Boolean  @default(false)
  
  order       Int      @default(0)
  
  createdAt   DateTime @default(now())
  
  @@index([taskId])
}

// ===========================================
// ACTIVITIES (historia - zawsze per company)
// ===========================================

model Activity {
  id          String   @id @default(cuid())
  
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Powiązania (opcjonalne)
  clientId    String?
  client      Client?  @relation(fields: [clientId], references: [id], onDelete: SetNull)
  
  contactId   String?
  contact     Contact? @relation(fields: [contactId], references: [id], onDelete: SetNull)
  
  dealId      String?
  deal        Deal?    @relation(fields: [dealId], references: [id], onDelete: SetNull)
  
  taskId      String?
  task        Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)
  
  type        ActivityType
  
  // Kto wykonał - człowiek lub agent
  actorId     String
  actorType   OwnerType @default(HUMAN)
  
  title       String
  content     String?  // Treść, notatka
  metadata    Json     @default("{}")  // Dodatkowe dane zależne od typu
  
  createdAt   DateTime @default(now())
  
  @@index([companyId])
  @@index([clientId])
  @@index([contactId])
  @@index([dealId])
  @@index([actorId, actorType])
  @@index([createdAt])
}

enum ActivityType {
  EMAIL_SENT
  EMAIL_RECEIVED
  CALL
  MEETING
  NOTE
  TASK_CREATED
  TASK_COMPLETED
  DEAL_STAGE_CHANGED
  COMMENT
  AI_ACTION        // Akcja wykonana przez AI
  AI_SUGGESTION    // Sugestia AI (pending)
}
```

---

## 1.2 Schemat Prisma - AI Agenci

```prisma
// ===========================================
// AI AGENTS
// ===========================================

model AIAgent {
  id          String   @id @default(cuid())
  
  // Agent należy do holdingu, może być przypisany do wielu spółek
  holdingId   String
  
  name        String   // "AI Research"
  role        String   // "Badacz"
  avatar      String   // Emoji lub URL
  description String?
  
  status      AIAgentStatus @default(ACTIVE)
  
  autonomyLevel Int    @default(2)  // 1-4
  
  capabilities String[] @default([])  // Lista umiejętności
  
  // Konfiguracja
  settings    Json     @default("{}")  // AIAgentSettings
  
  // Przypisania do spółek
  companyAssignments AIAgentAssignment[]
  
  // Zadania i aktywność
  tasks       AIAgentTask[]
  messages    AIAgentMessage[]
  
  // Statystyki
  tasksCompleted  Int  @default(0)
  successRate     Float @default(0)
  lastActivityAt  DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([holdingId])
  @@index([status])
}

enum AIAgentStatus {
  ACTIVE
  PAUSED
  DISABLED
}

model AIAgentAssignment {
  id          String   @id @default(cuid())
  
  agentId     String
  agent       AIAgent  @relation(fields: [agentId], references: [id], onDelete: Cascade)
  
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Może mieć inne ustawienia per spółka
  settings    Json     @default("{}")
  
  createdAt   DateTime @default(now())
  
  @@unique([agentId, companyId])
  @@index([companyId])
}

// ===========================================
// AI AGENT TASKS (zlecenia dla agentów)
// ===========================================

model AIAgentTask {
  id          String   @id @default(cuid())
  
  agentId     String
  agent       AIAgent  @relation(fields: [agentId], references: [id], onDelete: Cascade)
  
  companyId   String   // W kontekście której spółki
  
  type        String   // "research", "follow_up", "analyze"
  
  status      AITaskStatus @default(PENDING)
  
  // Input od człowieka
  input       Json     // { targetCompany: "XYZ", scope: [...] }
  prompt      String?  // Dodatkowe instrukcje
  
  // Output od agenta
  output      Json?    // Wynik pracy
  result      String?  // Podsumowanie tekstowe
  
  // Zatwierdzenie
  requiresApproval Boolean @default(false)
  approvalStatus   ApprovalStatus?
  approvedById     String?
  approvedAt       DateTime?
  
  // Kto zlecił (zawsze człowiek)
  requestedById String
  
  // Timing
  startedAt   DateTime?
  completedAt DateTime?
  
  // Błędy
  errorMessage String?
  retryCount   Int     @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([agentId])
  @@index([companyId])
  @@index([status])
  @@index([requestedById])
}

enum AITaskStatus {
  PENDING         // Czeka w kolejce
  IN_PROGRESS     // Agent pracuje
  WAITING_APPROVAL // Czeka na zatwierdzenie
  APPROVED        // Zatwierdzone
  COMPLETED       // Ukończone
  FAILED          // Błąd
  CANCELLED       // Anulowane
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  MODIFIED        // Zatwierdzono ze zmianami
}

// ===========================================
// AI AGENT MESSAGES (komunikacja)
// ===========================================

model AIAgentMessage {
  id          String   @id @default(cuid())
  
  // Od kogo (agent lub człowiek)
  fromAgentId String?
  fromAgent   AIAgent? @relation(fields: [fromAgentId], references: [id], onDelete: SetNull)
  fromUserId  String?
  
  // Do kogo (agent lub człowiek)
  toAgentId   String?
  toUserId    String?
  
  // Kontekst
  companyId   String?
  taskId      String?  // Powiązane z zadaniem agenta
  
  content     String
  
  // Typ wiadomości
  type        AIMessageType @default(INFO)
  
  // Czy przeczytane (dla wiadomości do ludzi)
  isRead      Boolean  @default(false)
  
  metadata    Json     @default("{}")
  
  createdAt   DateTime @default(now())
  
  @@index([fromAgentId])
  @@index([toUserId])
  @@index([companyId])
  @@index([taskId])
}

enum AIMessageType {
  INFO            // Informacja
  QUESTION        // Agent pyta o coś
  RESULT          // Wynik pracy
  ALERT           // Alert/ostrzeżenie
  APPROVAL_REQUEST // Prośba o zatwierdzenie
}

// ===========================================
// AI AGENT TEMPLATES (szablony agentów)
// ===========================================

model AIAgentTemplate {
  id          String   @id @default(cuid())
  
  name        String   // "AI Research"
  role        String   // "Badacz"
  avatar      String
  description String
  
  defaultAutonomyLevel Int @default(2)
  
  capabilities String[] @default([])
  
  // Prompt systemowy / instrukcje
  systemPrompt String?
  
  // Domyślne ustawienia
  defaultSettings Json @default("{}")
  
  // Czy wbudowany (system) czy user-created
  isSystem    Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 1.3 Typy TypeScript

```typescript
// types/holding.ts

// ===========================================
// HOLDING
// ===========================================

export interface HoldingSettings {
  allowCrossCompanyContacts: boolean;  // Czy pokazywać powiązane kontakty
  consolidatedReporting: boolean;       // Raporty zagregowane
  sharedAIAgents: boolean;              // Agenci dla całego holdingu
}

export interface CompanySettings {
  baseStreams: BaseStreamConfig[];
  defaultCurrency: string;
  timezone: string;
  workingHours: {
    start: string;  // "09:00"
    end: string;    // "17:00"
  };
}

export interface BaseStreamConfig {
  name: string;
  icon: string;
  type: 'PROJECT' | 'CONTINUOUS' | 'REFERENCE';
}

// Szablony strumieni bazowych per typ spółki
export const BASE_STREAMS_BY_TYPE: Record<CompanyType, BaseStreamConfig[]> = {
  PRODUCTION: [
    { name: 'Klienci', icon: '👥', type: 'CONTINUOUS' },
    { name: 'Produkcja', icon: '🏭', type: 'CONTINUOUS' },
    { name: 'Logistyka', icon: '🚚', type: 'CONTINUOUS' },
    { name: 'Zakupy', icon: '📦', type: 'CONTINUOUS' },
    { name: 'Administracja', icon: '📋', type: 'CONTINUOUS' },
  ],
  SALES: [
    { name: 'Klienci', icon: '👥', type: 'CONTINUOUS' },
    { name: 'Sprzedaż', icon: '💰', type: 'CONTINUOUS' },
    { name: 'Marketing', icon: '📢', type: 'CONTINUOUS' },
    { name: 'Obsługa klienta', icon: '🎧', type: 'CONTINUOUS' },
    { name: 'Administracja', icon: '📋', type: 'CONTINUOUS' },
  ],
  SERVICES: [
    { name: 'Klienci', icon: '👥', type: 'CONTINUOUS' },
    { name: 'Projekty', icon: '📐', type: 'CONTINUOUS' },
    { name: 'Realizacja', icon: '⚙️', type: 'CONTINUOUS' },
    { name: 'Wsparcie', icon: '🛠️', type: 'CONTINUOUS' },
    { name: 'Administracja', icon: '📋', type: 'CONTINUOUS' },
  ],
  EXPORT: [
    { name: 'Klienci', icon: '🌍', type: 'CONTINUOUS' },
    { name: 'Sprzedaż', icon: '💰', type: 'CONTINUOUS' },
    { name: 'Logistyka', icon: '🚚', type: 'CONTINUOUS' },
    { name: 'Dokumentacja', icon: '📄', type: 'CONTINUOUS' },
  ],
  OTHER: [
    { name: 'Klienci', icon: '👥', type: 'CONTINUOUS' },
    { name: 'Operacje', icon: '⚙️', type: 'CONTINUOUS' },
    { name: 'Administracja', icon: '📋', type: 'CONTINUOUS' },
  ],
};

// ===========================================
// AI AGENTS
// ===========================================

export interface AIAgentSettings {
  workingHours?: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  
  notifications: {
    onTaskComplete: boolean;
    onError: boolean;
    onApprovalNeeded: boolean;
  };
  
  // Jakie akcje wymagają zatwierdzenia
  requireApprovalFor: string[];  // ['send_email', 'create_task', 'update_deal']
  
  // Rate limiting
  maxTasksPerHour?: number;
  maxTasksPerDay?: number;
}

export interface AIAgentCapability {
  id: string;
  name: string;
  description: string;
  requiresApproval: boolean;
}

// Predefiniowane capability
export const AI_CAPABILITIES: AIAgentCapability[] = [
  { id: 'web_search', name: 'Wyszukiwanie w internecie', description: 'Może szukać informacji online', requiresApproval: false },
  { id: 'analyze_data', name: 'Analiza danych', description: 'Może analizować dane CRM', requiresApproval: false },
  { id: 'generate_report', name: 'Generowanie raportów', description: 'Może tworzyć raporty', requiresApproval: false },
  { id: 'draft_email', name: 'Drafty emaili', description: 'Może przygotowywać drafty', requiresApproval: false },
  { id: 'send_email', name: 'Wysyłanie emaili', description: 'Może wysyłać emaile', requiresApproval: true },
  { id: 'create_task', name: 'Tworzenie zadań', description: 'Może tworzyć zadania', requiresApproval: false },
  { id: 'update_deal', name: 'Aktualizacja deali', description: 'Może zmieniać dane deali', requiresApproval: true },
  { id: 'schedule_meeting', name: 'Planowanie spotkań', description: 'Może rezerwować terminy', requiresApproval: true },
];

// Szablony agentów
export const AI_AGENT_TEMPLATES = [
  {
    name: 'AI Research',
    role: 'Badacz',
    avatar: '🔍',
    description: 'Zbiera informacje o firmach i kontaktach przed spotkaniami',
    defaultAutonomyLevel: 3,
    capabilities: ['web_search', 'analyze_data', 'generate_report'],
    systemPrompt: `Jesteś asystentem badawczym. Twoim zadaniem jest zbieranie 
      i analizowanie informacji o firmach i osobach. Zawsze podawaj źródła.
      Strukturyzuj wyniki w czytelny sposób.`,
  },
  {
    name: 'AI Follow-up',
    role: 'Opiekun relacji',
    avatar: '📧',
    description: 'Pilnuje terminów, przygotowuje drafty follow-upów',
    defaultAutonomyLevel: 2,
    capabilities: ['draft_email', 'create_task', 'analyze_data'],
    systemPrompt: `Jesteś asystentem do zarządzania relacjami. Pilnujesz terminów,
      przygotowujesz drafty follow-upów, przypominasz o brakujących odpowiedziach.
      Zawsze proś o zatwierdzenie przed wysłaniem emaili.`,
  },
  {
    name: 'AI Analyst',
    role: 'Analityk',
    avatar: '📊',
    description: 'Analizuje dane, tworzy raporty, wykrywa trendy',
    defaultAutonomyLevel: 2,
    capabilities: ['analyze_data', 'generate_report'],
    systemPrompt: `Jesteś analitykiem biznesowym. Analizujesz dane sprzedażowe,
      wykrywasz trendy i anomalie, przygotowujesz raporty z wizualizacjami.
      Alertuj o istotnych zmianach.`,
  },
  {
    name: 'AI Scheduler',
    role: 'Koordynator',
    avatar: '📅',
    description: 'Koordynuje terminy, proponuje optymalne sloty',
    defaultAutonomyLevel: 1,
    capabilities: ['schedule_meeting', 'create_task'],
    systemPrompt: `Jesteś asystentem do planowania. Pomagasz koordynować terminy
      spotkań, proponujesz optymalne sloty, pilnujesz konflikty w kalendarzach.`,
  },
];

// ===========================================
// TEAM MEMBER (unified human + AI)
// ===========================================

export interface TeamMember {
  id: string;
  type: 'human' | 'ai_agent';
  name: string;
  avatar: string;  // URL lub emoji
  
  // Tylko dla ludzi
  email?: string;
  position?: string;
  department?: string;
  
  // Tylko dla AI
  role?: string;  // "Badacz", "Analityk"
  autonomyLevel?: number;
  status?: 'active' | 'paused' | 'disabled';
  capabilities?: string[];
}

// Helper do budowania listy zespołu
export function buildTeamList(
  employees: Employee[],
  aiAgents: AIAgent[]
): TeamMember[] {
  const humans: TeamMember[] = employees.map(emp => ({
    id: emp.id,
    type: 'human',
    name: `${emp.user.firstName} ${emp.user.lastName}`,
    avatar: emp.user.avatarUrl || '',
    email: emp.user.email,
    position: emp.position,
    department: emp.department,
  }));
  
  const agents: TeamMember[] = aiAgents.map(agent => ({
    id: agent.id,
    type: 'ai_agent',
    name: agent.name,
    avatar: agent.avatar,
    role: agent.role,
    autonomyLevel: agent.autonomyLevel,
    status: agent.status.toLowerCase() as any,
    capabilities: agent.capabilities,
  }));
  
  return [...humans, ...agents];
}
```

---

## 1.4 API Endpoints

```typescript
// api/routes/holding.ts

// ===========================================
// HOLDING MANAGEMENT
// ===========================================

// GET /api/holdings
// Lista holdingów dla zalogowanego usera (zwykle 1)
router.get('/holdings', async (req, res) => {
  const userId = req.user.id;
  
  const holdings = await prisma.holding.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { companies: { some: { employees: { some: { userId } } } } }
      ]
    },
    include: {
      companies: {
        select: {
          id: true,
          name: true,
          shortName: true,
          type: true,
          color: true,
          _count: { select: { employees: true, clients: true, deals: true } }
        }
      }
    }
  });
  
  res.json(holdings);
});

// POST /api/holdings
// Tworzenie holdingu (przy onboardingu)
router.post('/holdings', async (req, res) => {
  const { name, nip } = req.body;
  const userId = req.user.id;
  
  const holding = await prisma.holding.create({
    data: {
      name,
      nip,
      ownerId: userId,
      settings: {
        allowCrossCompanyContacts: true,
        consolidatedReporting: true,
        sharedAIAgents: true,
      }
    }
  });
  
  res.json(holding);
});

// ===========================================
// COMPANY MANAGEMENT
// ===========================================

// POST /api/holdings/:holdingId/companies
// Dodawanie spółki do holdingu
router.post('/holdings/:holdingId/companies', async (req, res) => {
  const { holdingId } = req.params;
  const { name, shortName, nip, type } = req.body;
  
  // Sprawdź czy user jest ownerem holdingu
  const holding = await prisma.holding.findFirst({
    where: { id: holdingId, ownerId: req.user.id }
  });
  
  if (!holding) {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }
  
  // Utwórz spółkę
  const company = await prisma.company.create({
    data: {
      holdingId,
      name,
      shortName,
      nip,
      type,
      color: getRandomColor(),
    }
  });
  
  // Utwórz strumienie bazowe
  await createBaseStreams(company.id, type);
  
  // Dodaj ownera holdingu jako admina spółki
  await prisma.employee.create({
    data: {
      userId: req.user.id,
      companyId: company.id,
      role: 'ADMIN',
    }
  });
  
  res.json(company);
});

// Helper: tworzenie strumieni bazowych
async function createBaseStreams(companyId: string, companyType: CompanyType) {
  const templates = BASE_STREAMS_BY_TYPE[companyType];
  
  for (const template of templates) {
    await prisma.stream.create({
      data: {
        companyId,
        name: template.name,
        icon: template.icon,
        type: template.type,
        isBase: true,
        status: 'FLOWING',
      }
    });
  }
  
  await prisma.company.update({
    where: { id: companyId },
    data: { baseStreamsCreated: true }
  });
}

// GET /api/companies/:companyId
// Szczegóły spółki (z weryfikacją dostępu)
router.get('/companies/:companyId', async (req, res) => {
  const { companyId } = req.params;
  
  // Sprawdź dostęp
  const access = await checkCompanyAccess(req.user.id, companyId);
  if (!access) {
    return res.status(403).json({ error: 'Brak dostępu do tej spółki' });
  }
  
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      employees: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } }
      },
      aiAgents: {
        include: { agent: true }
      },
      streams: {
        where: { isBase: true }
      },
      _count: {
        select: { clients: true, contacts: true, deals: true, tasks: true }
      }
    }
  });
  
  res.json(company);
});

// ===========================================
// CONTEXT SWITCHING
// ===========================================

// POST /api/context/switch
// Przełączenie aktywnej spółki (zapisuje w sesji/cookie)
router.post('/context/switch', async (req, res) => {
  const { companyId } = req.body;
  
  // Sprawdź dostęp
  const access = await checkCompanyAccess(req.user.id, companyId);
  if (!access) {
    return res.status(403).json({ error: 'Brak dostępu do tej spółki' });
  }
  
  // Zapisz w sesji
  req.session.activeCompanyId = companyId;
  
  res.json({ success: true, activeCompanyId: companyId });
});

// GET /api/context/current
// Pobierz aktualny kontekst
router.get('/context/current', async (req, res) => {
  const companyId = req.session.activeCompanyId;
  
  if (!companyId) {
    // Zwróć pierwszą dostępną spółkę
    const employee = await prisma.employee.findFirst({
      where: { userId: req.user.id, isActive: true },
      include: { company: true }
    });
    
    if (employee) {
      req.session.activeCompanyId = employee.companyId;
      return res.json({ activeCompanyId: employee.companyId, company: employee.company });
    }
    
    return res.status(404).json({ error: 'Brak przypisanej spółki' });
  }
  
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });
  
  res.json({ activeCompanyId: companyId, company });
});

// ===========================================
// CROSS-COMPANY CONTACTS
// ===========================================

// GET /api/contacts/:contactId/linked
// Pokaż powiązane kontakty w innych spółkach (dla właściciela holdingu)
router.get('/contacts/:contactId/linked', async (req, res) => {
  const { contactId } = req.params;
  
  // Pobierz kontakt
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { company: { include: { holding: true } } }
  });
  
  if (!contact?.globalId) {
    return res.json({ linkedContacts: [] });
  }
  
  // Sprawdź czy user jest ownerem holdingu
  const isOwner = contact.company.holding.ownerId === req.user.id;
  if (!isOwner) {
    return res.json({ linkedContacts: [] });  // Zwykły user nie widzi
  }
  
  // Znajdź powiązane kontakty
  const linkedContacts = await prisma.contact.findMany({
    where: {
      globalId: contact.globalId,
      id: { not: contactId }
    },
    include: {
      company: { select: { id: true, shortName: true, color: true } },
      _count: { select: { activities: true } }
    }
  });
  
  res.json({ linkedContacts });
});
```

---

## 1.5 API Endpoints - AI Agents

```typescript
// api/routes/ai-agents.ts

// ===========================================
// AI AGENT MANAGEMENT
// ===========================================

// GET /api/ai-agents
// Lista agentów dla holdingu (lub przypisanych do spółki)
router.get('/ai-agents', async (req, res) => {
  const companyId = req.session.activeCompanyId;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { holdingId: true }
  });
  
  const agents = await prisma.aIAgent.findMany({
    where: {
      holdingId: company.holdingId,
      companyAssignments: {
        some: { companyId }
      }
    },
    include: {
      companyAssignments: true,
      _count: {
        select: {
          tasks: { where: { status: 'IN_PROGRESS' } }
        }
      }
    }
  });
  
  res.json(agents);
});

// POST /api/ai-agents
// Tworzenie agenta (z szablonu lub custom)
router.post('/ai-agents', async (req, res) => {
  const { templateId, name, role, avatar, autonomyLevel, capabilities, companyIds } = req.body;
  
  const companyId = req.session.activeCompanyId;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { holdingId: true }
  });
  
  let agentData: any = {
    holdingId: company.holdingId,
    name,
    role,
    avatar,
    autonomyLevel: autonomyLevel || 2,
    capabilities: capabilities || [],
    settings: {
      notifications: { onTaskComplete: true, onError: true, onApprovalNeeded: true },
      requireApprovalFor: ['send_email', 'update_deal'],
    }
  };
  
  // Jeśli z szablonu, weź domyślne wartości
  if (templateId) {
    const template = await prisma.aIAgentTemplate.findUnique({
      where: { id: templateId }
    });
    
    if (template) {
      agentData = {
        ...agentData,
        name: name || template.name,
        role: template.role,
        avatar: template.avatar,
        description: template.description,
        capabilities: template.capabilities,
        autonomyLevel: template.defaultAutonomyLevel,
      };
    }
  }
  
  const agent = await prisma.aIAgent.create({
    data: agentData
  });
  
  // Przypisz do spółek
  const targetCompanies = companyIds || [companyId];
  for (const cId of targetCompanies) {
    await prisma.aIAgentAssignment.create({
      data: {
        agentId: agent.id,
        companyId: cId,
      }
    });
  }
  
  res.json(agent);
});

// PATCH /api/ai-agents/:agentId
// Aktualizacja agenta
router.patch('/ai-agents/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const { status, autonomyLevel, settings } = req.body;
  
  const agent = await prisma.aIAgent.update({
    where: { id: agentId },
    data: {
      ...(status && { status }),
      ...(autonomyLevel && { autonomyLevel }),
      ...(settings && { settings }),
    }
  });
  
  res.json(agent);
});

// ===========================================
// AI AGENT TASKS
// ===========================================

// POST /api/ai-agents/:agentId/tasks
// Zlecenie zadania agentowi
router.post('/ai-agents/:agentId/tasks', async (req, res) => {
  const { agentId } = req.params;
  const { type, input, prompt } = req.body;
  
  const companyId = req.session.activeCompanyId;
  
  // Sprawdź czy agent jest przypisany do tej spółki
  const assignment = await prisma.aIAgentAssignment.findFirst({
    where: { agentId, companyId }
  });
  
  if (!assignment) {
    return res.status(403).json({ error: 'Agent nie jest przypisany do tej spółki' });
  }
  
  const task = await prisma.aIAgentTask.create({
    data: {
      agentId,
      companyId,
      type,
      input,
      prompt,
      requestedById: req.user.id,
      status: 'PENDING',
    }
  });
  
  // Tutaj: trigger do systemu AI (Make.com webhook / queue)
  await triggerAIAgentTask(task);
  
  res.json(task);
});

// GET /api/ai-agents/:agentId/tasks
// Lista zadań agenta
router.get('/ai-agents/:agentId/tasks', async (req, res) => {
  const { agentId } = req.params;
  const { status, limit = 20 } = req.query;
  
  const companyId = req.session.activeCompanyId;
  
  const tasks = await prisma.aIAgentTask.findMany({
    where: {
      agentId,
      companyId,
      ...(status && { status: status as any })
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
  });
  
  res.json(tasks);
});

// POST /api/ai-agent-tasks/:taskId/approve
// Zatwierdzenie wyniku agenta
router.post('/ai-agent-tasks/:taskId/approve', async (req, res) => {
  const { taskId } = req.params;
  const { approved, modifications } = req.body;
  
  const task = await prisma.aIAgentTask.update({
    where: { id: taskId },
    data: {
      approvalStatus: approved ? 'APPROVED' : 'REJECTED',
      approvedById: req.user.id,
      approvedAt: new Date(),
      status: approved ? 'COMPLETED' : 'CANCELLED',
      ...(modifications && { output: modifications })
    }
  });
  
  // Jeśli zatwierdzono, wykonaj akcję końcową
  if (approved) {
    await executeApprovedAITask(task);
  }
  
  res.json(task);
});

// ===========================================
// AI AGENT MESSAGES
// ===========================================

// GET /api/ai-messages
// Lista wiadomości od/do agentów dla usera
router.get('/ai-messages', async (req, res) => {
  const { unreadOnly, limit = 50 } = req.query;
  
  const companyId = req.session.activeCompanyId;
  
  const messages = await prisma.aIAgentMessage.findMany({
    where: {
      companyId,
      toUserId: req.user.id,
      ...(unreadOnly === 'true' && { isRead: false })
    },
    include: {
      fromAgent: { select: { name: true, avatar: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
  });
  
  res.json(messages);
});

// PATCH /api/ai-messages/:messageId/read
// Oznacz wiadomość jako przeczytaną
router.patch('/ai-messages/:messageId/read', async (req, res) => {
  const { messageId } = req.params;
  
  await prisma.aIAgentMessage.update({
    where: { id: messageId },
    data: { isRead: true }
  });
  
  res.json({ success: true });
});

// POST /api/ai-messages
// Wysłanie wiadomości do agenta (np. odpowiedź na pytanie)
router.post('/ai-messages', async (req, res) => {
  const { toAgentId, content, taskId } = req.body;
  
  const companyId = req.session.activeCompanyId;
  
  const message = await prisma.aIAgentMessage.create({
    data: {
      fromUserId: req.user.id,
      toAgentId,
      companyId,
      taskId,
      content,
      type: 'INFO',
    }
  });
  
  // Trigger: kontynuacja pracy agenta
  if (taskId) {
    await resumeAIAgentTask(taskId, message);
  }
  
  res.json(message);
});

// ===========================================
// TEAM LIST (unified)
// ===========================================

// GET /api/team
// Lista zespołu (ludzie + agenci)
router.get('/team', async (req, res) => {
  const { includeAI = 'true' } = req.query;
  
  const companyId = req.session.activeCompanyId;
  
  // Pobierz pracowników
  const employees = await prisma.employee.findMany({
    where: { companyId, isActive: true },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
      }
    }
  });
  
  const team: TeamMember[] = employees.map(emp => ({
    id: emp.id,
    type: 'human',
    name: `${emp.user.firstName} ${emp.user.lastName}`,
    avatar: emp.user.avatarUrl || '',
    email: emp.user.email,
    position: emp.position,
    department: emp.department,
  }));
  
  // Dodaj agentów jeśli potrzeba
  if (includeAI === 'true') {
    const agents = await prisma.aIAgent.findMany({
      where: {
        companyAssignments: { some: { companyId } },
        status: 'ACTIVE'
      }
    });
    
    for (const agent of agents) {
      team.push({
        id: agent.id,
        type: 'ai_agent',
        name: agent.name,
        avatar: agent.avatar,
        role: agent.role,
        autonomyLevel: agent.autonomyLevel,
        status: agent.status.toLowerCase() as any,
        capabilities: agent.capabilities,
      });
    }
  }
  
  res.json(team);
});
```

---

## 1.6 Middleware i Helpers

```typescript
// middleware/companyContext.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

// Middleware do weryfikacji dostępu do spółki
export async function withCompanyContext(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const companyId = req.session?.activeCompanyId || req.headers['x-company-id'];
  
  if (!companyId) {
    return res.status(400).json({ error: 'Brak kontekstu spółki' });
  }
  
  const hasAccess = await checkCompanyAccess(req.user.id, companyId as string);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Brak dostępu do tej spółki' });
  }
  
  req.companyId = companyId as string;
  next();
}

// Helper: sprawdzanie dostępu do spółki
export async function checkCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  // Sprawdź czy jest właścicielem holdingu
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { holding: true }
  });
  
  if (company?.holding.ownerId === userId) {
    return true;  // Właściciel ma dostęp do wszystkiego
  }
  
  // Sprawdź czy jest pracownikiem
  const employee = await prisma.employee.findFirst({
    where: { userId, companyId, isActive: true }
  });
  
  if (employee) {
    return true;
  }
  
  // Sprawdź dodatkowy dostęp
  const additionalAccess = await prisma.companyAccess.findFirst({
    where: { 
      employee: { userId },
      companyId 
    }
  });
  
  return !!additionalAccess;
}

// Helper: pobieranie dostępnych spółek dla usera
export async function getUserCompanies(userId: string) {
  // Jako właściciel holdingu
  const ownedHoldings = await prisma.holding.findMany({
    where: { ownerId: userId },
    include: {
      companies: {
        select: { id: true, name: true, shortName: true, color: true, type: true }
      }
    }
  });
  
  // Jako pracownik
  const employments = await prisma.employee.findMany({
    where: { userId, isActive: true },
    include: {
      company: {
        select: { id: true, name: true, shortName: true, color: true, type: true }
      }
    }
  });
  
  // Dodatkowy dostęp
  const additionalAccess = await prisma.companyAccess.findMany({
    where: { employee: { userId } },
    include: {
      // Potrzebujemy dodać relację do Company w modelu
    }
  });
  
  // Merge i deduplikacja
  const allCompanies = new Map();
  
  for (const holding of ownedHoldings) {
    for (const company of holding.companies) {
      allCompanies.set(company.id, { ...company, accessLevel: 'owner' });
    }
  }
  
  for (const emp of employments) {
    if (!allCompanies.has(emp.companyId)) {
      allCompanies.set(emp.companyId, { ...emp.company, accessLevel: emp.role });
    }
  }
  
  return Array.from(allCompanies.values());
}
```

---

## 1.7 Komponenty React

```typescript
// components/CompanySwitcher.tsx

import { useState } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useCompanyContext } from '@/hooks/useCompanyContext';

export function CompanySwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { companies, activeCompany, switchCompany, isLoading } = useCompanyContext();
  
  if (isLoading || !activeCompany) return null;
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-colors"
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
          style={{ backgroundColor: activeCompany.color }}
        >
          {activeCompany.shortName.slice(0, 2)}
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">{activeCompany.shortName}</div>
          <div className="text-xs text-gray-500">{activeCompany.type}</div>
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {companies.map(company => (
            <button
              key={company.id}
              onClick={() => {
                switchCompany(company.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: company.color }}
              >
                {company.shortName.slice(0, 2)}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">{company.name}</div>
                <div className="text-xs text-gray-500">NIP: {company.nip}</div>
              </div>
              {company.id === activeCompany.id && (
                <Check size={16} className="text-green-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

```typescript
// components/TeamMemberPicker.tsx

import { useState, useMemo } from 'react';
import { User, Bot, Search } from 'lucide-react';
import { TeamMember } from '@/types/holding';

interface Props {
  members: TeamMember[];
  selected: string[];
  onChange: (ids: string[]) => void;
  allowMultiple?: boolean;
  showAIAgents?: boolean;
}

export function TeamMemberPicker({ 
  members, 
  selected, 
  onChange, 
  allowMultiple = false,
  showAIAgents = true 
}: Props) {
  const [search, setSearch] = useState('');
  
  const filteredMembers = useMemo(() => {
    let filtered = members;
    
    if (!showAIAgents) {
      filtered = filtered.filter(m => m.type === 'human');
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(s) ||
        m.email?.toLowerCase().includes(s) ||
        m.role?.toLowerCase().includes(s)
      );
    }
    
    return filtered;
  }, [members, search, showAIAgents]);
  
  const humans = filteredMembers.filter(m => m.type === 'human');
  const aiAgents = filteredMembers.filter(m => m.type === 'ai_agent');
  
  const handleSelect = (id: string) => {
    if (allowMultiple) {
      if (selected.includes(id)) {
        onChange(selected.filter(s => s !== id));
      } else {
        onChange([...selected, id]);
      }
    } else {
      onChange([id]);
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {/* Humans */}
        {humans.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <User size={12} />
              Ludzie ({humans.length})
            </div>
            {humans.map(member => (
              <MemberRow 
                key={member.id}
                member={member}
                isSelected={selected.includes(member.id)}
                onSelect={() => handleSelect(member.id)}
              />
            ))}
          </div>
        )}
        
        {/* AI Agents */}
        {showAIAgents && aiAgents.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Bot size={12} />
              AI Agenci ({aiAgents.length})
            </div>
            {aiAgents.map(member => (
              <MemberRow 
                key={member.id}
                member={member}
                isSelected={selected.includes(member.id)}
                onSelect={() => handleSelect(member.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberRow({ member, isSelected, onSelect }: { 
  member: TeamMember; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isAI = member.type === 'ai_agent';
  
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      {/* Avatar */}
      {isAI ? (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl">
          {member.avatar}
        </div>
      ) : (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
          {member.name.split(' ').map(n => n[0]).join('')}
        </div>
      )}
      
      {/* Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{member.name}</span>
          {isAI && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              AI
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {isAI ? member.role : member.position || member.email}
        </div>
      </div>
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}
```

---

## 1.8 Hooki React

```typescript
// hooks/useCompanyContext.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Company {
  id: string;
  name: string;
  shortName: string;
  nip: string;
  type: string;
  color: string;
}

interface CompanyContextStore {
  companies: Company[];
  activeCompanyId: string | null;
  isLoading: boolean;
  
  setCompanies: (companies: Company[]) => void;
  setActiveCompanyId: (id: string) => void;
  switchCompany: (id: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyContextStore>()(
  persist(
    (set, get) => ({
      companies: [],
      activeCompanyId: null,
      isLoading: true,
      
      setCompanies: (companies) => set({ companies }),
      setActiveCompanyId: (id) => set({ activeCompanyId: id }),
      
      switchCompany: async (id: string) => {
        await fetch('/api/context/switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: id })
        });
        
        set({ activeCompanyId: id });
        
        // Reload data for new context
        window.location.reload();  // Lub: router.refresh() + invalidate queries
      }
    }),
    {
      name: 'company-context',
      partialize: (state) => ({ activeCompanyId: state.activeCompanyId })
    }
  )
);

// Hook with derived data
export function useCompanyContext() {
  const store = useCompanyStore();
  
  const activeCompany = store.companies.find(c => c.id === store.activeCompanyId);
  
  return {
    ...store,
    activeCompany
  };
}
```

```typescript
// hooks/useAIAgents.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAIAgents() {
  return useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => api.get('/ai-agents').then(r => r.data)
  });
}

export function useAIAgentTasks(agentId: string) {
  return useQuery({
    queryKey: ['ai-agent-tasks', agentId],
    queryFn: () => api.get(`/ai-agents/${agentId}/tasks`).then(r => r.data),
    enabled: !!agentId
  });
}

export function useAssignTaskToAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ agentId, task }: { agentId: string; task: any }) => 
      api.post(`/ai-agents/${agentId}/tasks`, task),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tasks', agentId] });
    }
  });
}

export function useApproveAITask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, approved, modifications }: { 
      taskId: string; 
      approved: boolean; 
      modifications?: any 
    }) => 
      api.post(`/ai-agent-tasks/${taskId}/approve`, { approved, modifications }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ai-messages'] });
    }
  });
}

export function useAIMessages(unreadOnly = false) {
  return useQuery({
    queryKey: ['ai-messages', { unreadOnly }],
    queryFn: () => api.get('/ai-messages', { params: { unreadOnly } }).then(r => r.data),
    refetchInterval: 30000  // Odświeżaj co 30s
  });
}
```

---

## 1.9 Migracja danych

```typescript
// scripts/migrate-to-holding.ts

import { prisma } from '@/lib/prisma';

/**
 * Migracja istniejących danych do struktury holdingowej
 * 
 * Scenariusz: Masz już dane (klienci, kontakty, deale) bez podziału na spółki
 */
async function migrateToHolding() {
  console.log('🚀 Starting migration to holding structure...');
  
  // 1. Znajdź wszystkich userów którzy mają dane
  const users = await prisma.user.findMany({
    where: {
      // Mają jakieś dane
      OR: [
        { clients: { some: {} } },
        { deals: { some: {} } },
      ]
    }
  });
  
  for (const user of users) {
    console.log(`\n📦 Migrating user: ${user.email}`);
    
    // 2. Utwórz holding dla usera
    const holding = await prisma.holding.create({
      data: {
        name: `${user.firstName}'s Organization`,
        ownerId: user.id,
        settings: {
          allowCrossCompanyContacts: true,
          consolidatedReporting: true,
          sharedAIAgents: true,
        }
      }
    });
    
    console.log(`   ✅ Created holding: ${holding.id}`);
    
    // 3. Utwórz domyślną spółkę
    const company = await prisma.company.create({
      data: {
        holdingId: holding.id,
        name: 'Moja firma',
        shortName: 'MF',
        nip: 'PL0000000000',  // Placeholder
        type: 'OTHER',
        color: '#3b82f6',
      }
    });
    
    console.log(`   ✅ Created default company: ${company.id}`);
    
    // 4. Utwórz strumienie bazowe
    await createBaseStreams(company.id, 'OTHER');
    console.log(`   ✅ Created base streams`);
    
    // 5. Dodaj usera jako admina spółki
    await prisma.employee.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: 'ADMIN',
      }
    });
    
    // 6. Przenieś klientów
    const clientCount = await prisma.client.updateMany({
      where: { ownerId: user.id, companyId: null },
      data: { companyId: company.id }
    });
    console.log(`   ✅ Migrated ${clientCount.count} clients`);
    
    // 7. Przenieś kontakty
    const contactCount = await prisma.contact.updateMany({
      where: { 
        OR: [
          { ownerId: user.id },
          { client: { ownerId: user.id } }
        ],
        companyId: null 
      },
      data: { companyId: company.id }
    });
    console.log(`   ✅ Migrated ${contactCount.count} contacts`);
    
    // 8. Przenieś deale
    const dealCount = await prisma.deal.updateMany({
      where: { ownerId: user.id, companyId: null },
      data: { companyId: company.id }
    });
    console.log(`   ✅ Migrated ${dealCount.count} deals`);
    
    // 9. Przenieś strumienie
    const streamCount = await prisma.stream.updateMany({
      where: { ownerId: user.id, companyId: null },
      data: { companyId: company.id }
    });
    console.log(`   ✅ Migrated ${streamCount.count} streams`);
    
    // 10. Przenieś zadania
    const taskCount = await prisma.task.updateMany({
      where: { createdById: user.id, companyId: null },
      data: { companyId: company.id }
    });
    console.log(`   ✅ Migrated ${taskCount.count} tasks`);
    
    // 11. Utwórz domyślnych AI agentów
    await createDefaultAIAgents(holding.id, company.id);
    console.log(`   ✅ Created default AI agents`);
  }
  
  console.log('\n✨ Migration completed!');
}

async function createDefaultAIAgents(holdingId: string, companyId: string) {
  const templates = [
    {
      name: 'AI Research',
      role: 'Badacz',
      avatar: '🔍',
      description: 'Zbiera informacje o firmach i kontaktach',
      autonomyLevel: 3,
      capabilities: ['web_search', 'analyze_data', 'generate_report'],
    },
    {
      name: 'AI Follow-up',
      role: 'Opiekun relacji',
      avatar: '📧',
      description: 'Pilnuje terminów, przygotowuje drafty follow-upów',
      autonomyLevel: 2,
      capabilities: ['draft_email', 'create_task', 'analyze_data'],
    },
  ];
  
  for (const template of templates) {
    const agent = await prisma.aIAgent.create({
      data: {
        holdingId,
        ...template,
        status: 'ACTIVE',
        settings: {
          notifications: { onTaskComplete: true, onError: true, onApprovalNeeded: true },
          requireApprovalFor: ['send_email'],
        }
      }
    });
    
    await prisma.aIAgentAssignment.create({
      data: {
        agentId: agent.id,
        companyId,
      }
    });
  }
}

// Run migration
migrateToHolding()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

# CZĘŚĆ 2: CHECKLIST IMPLEMENTACJI

## 2.1 Faza 1: Struktura holdingowa (Tydzień 1-2)

```
[ ] Schemat Prisma - modele Holding, Company, Employee
[ ] Migracja bazy danych
[ ] API: CRUD holdings/companies
[ ] API: Context switching
[ ] UI: CompanySwitcher komponent
[ ] UI: Onboarding z tworzeniem holdingu/spółki
[ ] Middleware: weryfikacja dostępu per company
[ ] Testy: separacja danych między spółkami
```

## 2.2 Faza 2: AI Agenci (Tydzień 3-4)

```
[ ] Schemat Prisma - modele AIAgent, AIAgentTask, AIAgentMessage
[ ] Migracja + seedy szablonów agentów
[ ] API: CRUD AI agents
[ ] API: Task assignment i approval flow
[ ] API: Messages (komunikacja human <-> AI)
[ ] UI: TeamMemberPicker (unified human + AI)
[ ] UI: AI Agent panel w bocznej nawigacji
[ ] UI: Approval modal dla zadań wymagających zatwierdzenia
[ ] Integracja: Make.com webhook dla triggerów AI
[ ] Testy: flow zlecenia -> wykonania -> zatwierdzenia
```

## 2.3 Faza 3: Integracja (Tydzień 5)

```
[ ] Połączenie AI agentów z holdingiem (multi-company support)
[ ] Dashboard właściciela holdingu (aggregated view)
[ ] Cross-company contact linking (globalId)
[ ] Raportowanie per spółka i skonsolidowane
[ ] Optymalizacja wydajności (indexy, cache)
[ ] Dokumentacja API
[ ] E2E testy całego flow
```

---

*Specyfikacja wersja: 1.0*
*Data: Styczeń 2025*
*Dla: Claude Code*
