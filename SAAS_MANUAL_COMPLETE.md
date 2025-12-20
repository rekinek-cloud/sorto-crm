# 🚀 CRM-GTD Smart - Kompletny Manual SaaS

## 📋 Spis Treści

1. [Przegląd Architektury SaaS](#przegląd-architektury-saas)
2. [Multi-Tenancy (Wielodostęp)](#multi-tenancy-wielodostęp)
3. [Rejestracja Nowych Organizacji](#rejestracja-nowych-organizacji)
4. [Zarządzanie Subskrypcjami](#zarządzanie-subskrypcjami)
5. [Izolacja Danych](#izolacja-danych)
6. [Zarządzanie Użytkownikami](#zarządzanie-użytkownikami)
7. [Limity i Ograniczenia](#limity-i-ograniczenia)
8. [Bezpieczeństwo](#bezpieczeństwo)
9. [Administracja Systemu](#administracja-systemu)
10. [Rozszerzenia i Customizacja](#rozszerzenia-i-customizacja)
11. [Monitoring i Analytics](#monitoring-i-analytics)
12. [Backup i Disaster Recovery](#backup-i-disaster-recovery)

---

## 1. Przegląd Architektury SaaS

### 🏗️ Struktura Systemu

CRM-GTD Smart został zaprojektowany jako **Software as a Service (SaaS)** z pełną izolacją danych między organizacjami.

#### Kluczowe Komponenty:
- **Frontend**: Next.js (React) - interfejs użytkownika
- **Backend**: Express.js + Prisma ORM - API i logika biznesowa  
- **Database**: PostgreSQL - wielodostępna baza danych
- **Authentication**: JWT + refresh tokens
- **File Storage**: Lokalny system plików + opcjonalnie S3
- **Email**: SMTP integration (konfigurowalny)

#### Model Biznesowy:
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   STARTER       │    │  PROFESSIONAL   │    │   ENTERPRISE    │
│   $9/miesiąc    │    │   $29/miesiąc   │    │   $99/miesiąc   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ 5 użytkowników  │    │ 25 użytkowników │    │ Bez limitów     │
│ 3 strumienie    │    │ 15 strumieni    │    │ Bez limitów     │
│ 100 zadań/user  │    │ 1000 zadań/user │    │ Priorytet       │
│ Email support   │    │ Email + chat    │    │ Dedyk. manager  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 2. Multi-Tenancy (Wielodostęp)

### 🏢 Model Organizacyjny

Każda firma/organizacja ma **kompletnie odizolowane dane**.

#### Struktura Bazy Danych:

```sql
-- Główny model organizacji
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,  -- company-name
    domain VARCHAR UNIQUE,         -- custom-domain.com
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Wszystkie dane należą do organizacji
CREATE TABLE users (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR UNIQUE NOT NULL,
    -- ... inne pola
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    -- ... inne pola
);
```

#### Izolacja na Poziomie Aplikacji:

```typescript
// Middleware automatycznie filtruje po organizacji
async function authenticateToken(req, res, next) {
  const token = extractToken(req);
  const payload = verifyToken(token);
  
  req.user = {
    id: payload.userId,
    organizationId: payload.organizationId, // ← Kluczowa izolacja
    email: payload.email,
    role: payload.role
  };
  
  next();
}

// Każde zapytanie automatycznie filtruje po organizacji
const tasks = await prisma.task.findMany({
  where: {
    organizationId: req.user.organizationId // ← Automatyczna izolacja
  }
});
```

---

## 3. Rejestracja Nowych Organizacji

### 📝 Proces Onboardingu

#### Krok 1: Rejestracja przez Formularz

**URL**: `http://91.99.50.80/crm/auth/register`

**Formularz zawiera:**
- Nazwa organizacji
- Imię i nazwisko założyciela
- Email (unikalny w całym systemie)
- Hasło (wymagania: 8+ znaków, duże/małe litery, cyfry)
- Wybór planu subskrypcji
- Akceptacja regulaminu

#### Krok 2: Automatyczne Utworzenie Infrastruktury

```typescript
// Backend: packages/backend/src/modules/auth/service.ts
async register(data: RegisterRequest) {
  // 1. Walidacja unikalności emaila
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  
  // 2. Generowanie unikalnego slug organizacji
  let slug = data.organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
    
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }
  
  // 3. Transakcja tworzenia organizacji + użytkownika + subskrypcji
  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: data.organizationName,
        slug,
        limits: TIER_LIMITS[data.subscriptionPlan || 'STARTER']
      }
    });
    
    const subscription = await tx.subscription.create({
      data: {
        organizationId: organization.id,
        plan: data.subscriptionPlan || 'STARTER',
        status: 'TRIAL',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 dni trial
      }
    });
    
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 10),
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'OWNER',
        organizationId: organization.id
      }
    });
    
    return { organization, user, subscription };
  });
  
  // 4. Generowanie JWT tokens
  const tokens = await generateTokenPair({
    userId: result.user.id,
    organizationId: result.organization.id,
    email: result.user.email,
    role: result.user.role
  });
  
  return { user, organization, tokens };
}
```

#### Krok 3: Redirect do Dashboard

Po pomyślnej rejestracji użytkownik zostaje automatycznie przekierowany do:
`http://91.99.50.80/crm/dashboard/`

---

## 4. Zarządzanie Subskrypcjami

### 💳 Plany Subskrypcji

#### Starter Plan ($9/miesiąc):
```json
{
  "max_users": 5,
  "max_streams": 3,
  "max_tasks_per_user": 100,
  "max_projects": 10,
  "max_storage_mb": 1000,
  "email_support": true,
  "chat_support": false,
  "api_calls_per_month": 10000
}
```

#### Professional Plan ($29/miesiąc):
```json
{
  "max_users": 25,
  "max_streams": 15,
  "max_tasks_per_user": 1000,
  "max_projects": 100,
  "max_storage_mb": 10000,
  "email_support": true,
  "chat_support": true,
  "api_calls_per_month": 100000,
  "advanced_reporting": true
}
```

#### Enterprise Plan ($99/miesiąc):
```json
{
  "unlimited": true,
  "priority_support": true,
  "dedicated_account_manager": true,
  "custom_integrations": true,
  "advanced_security": true,
  "audit_logs": true,
  "sla_99_9": true
}
```

### 🔄 Upgrade/Downgrade Procesu

```typescript
// Backend endpoint: PUT /api/v1/organizations/subscription
async updateSubscription(organizationId: string, newPlan: SubscriptionPlan) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { 
      subscription: true,
      users: { where: { isActive: true } },
      tasks: true,
      projects: true
    }
  });
  
  // Sprawdzenie czy organizacja mieści się w nowych limitach
  const newLimits = TIER_LIMITS[newPlan];
  
  if (newLimits.max_users && organization.users.length > newLimits.max_users) {
    throw new Error(`Przekroczony limit użytkowników. Obecnych: ${organization.users.length}, limit: ${newLimits.max_users}`);
  }
  
  // Aktualizacja subskrypcji i limitów
  await prisma.$transaction([
    prisma.subscription.update({
      where: { organizationId },
      data: { plan: newPlan }
    }),
    prisma.organization.update({
      where: { id: organizationId },
      data: { limits: newLimits }
    })
  ]);
}
```

---

## 5. Izolacja Danych

### 🔒 Bezpieczeństwo Multi-Tenant

#### Poziom 1: Database Level Isolation

Każdy rekord ma `organizationId`:

```typescript
// Automatyczna izolacja w każdym query
const tasks = await prisma.task.findMany({
  where: {
    organizationId: req.user.organizationId, // ← Zawsze wymagane
    status: 'IN_PROGRESS'
  }
});

// Middleware zapewnia automatyczne dodawanie organizationId
class PrismaService {
  constructor(private organizationId: string) {}
  
  task = {
    findMany: (args) => prisma.task.findMany({
      ...args,
      where: {
        ...args.where,
        organizationId: this.organizationId
      }
    }),
    create: (args) => prisma.task.create({
      ...args,
      data: {
        ...args.data,
        organizationId: this.organizationId
      }
    })
  }
}
```

#### Poziom 2: Application Level Controls

```typescript
// Middleware sprawdzania uprawnień
async function checkOrganizationAccess(req, res, next) {
  const { organizationId } = req.params;
  
  if (req.user.organizationId !== organizationId) {
    return res.status(403).json({ 
      error: 'Access denied to this organization' 
    });
  }
  
  next();
}

// Użycie w routes
router.get('/organizations/:organizationId/tasks', 
  authenticateToken,
  checkOrganizationAccess,
  getTasksHandler
);
```

#### Poziom 3: Frontend Route Guards

```typescript
// Frontend: middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken');
  const user = verifyToken(token);
  
  const requestedOrgSlug = request.nextUrl.pathname.split('/')[2];
  const userOrgSlug = user.organizationSlug;
  
  if (requestedOrgSlug !== userOrgSlug) {
    return NextResponse.redirect('/unauthorized');
  }
}
```

---

## 6. Zarządzanie Użytkownikami

### 👥 Role i Uprawnienia

#### Hierarchia Ról:
1. **OWNER** - założyciel organizacji, pełne uprawnienia
2. **ADMIN** - administrator, może zarządzać użytkownikami i ustawieniami
3. **MANAGER** - menedżer, może zarządzać zespołem i projektami
4. **MEMBER** - zwykły członek zespołu
5. **GUEST** - gość z ograniczonymi uprawnieniami

#### System Zaproszeń:

```typescript
// Zaproszenie nowego użytkownika
async inviteUser(organizationId: string, inviteData: InviteUserRequest) {
  // 1. Sprawdzenie limitów organizacji
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { users: { where: { isActive: true } } }
  });
  
  const limits = organization.limits as any;
  if (limits.max_users && organization.users.length >= limits.max_users) {
    throw new Error('Osiągnięto limit użytkowników dla tego planu');
  }
  
  // 2. Utworzenie nieaktywnego użytkownika z tokenem zaproszenia
  const invitationToken = uuidv4();
  const user = await prisma.user.create({
    data: {
      email: inviteData.email,
      passwordHash: invitationToken, // Tymczasowe przechowywanie tokenu
      firstName: inviteData.firstName,
      lastName: inviteData.lastName,
      role: inviteData.role,
      organizationId,
      isActive: false
    }
  });
  
  // 3. Wysłanie emaila z zaproszeniem
  await sendInvitationEmail(inviteData.email, invitationToken, organization.name);
  
  return { invitationToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };
}

// Akceptacja zaproszenia
async acceptInvitation(acceptData: AcceptInvitationRequest) {
  const user = await prisma.user.findFirst({
    where: {
      passwordHash: acceptData.token,
      isActive: false
    }
  });
  
  if (!user) {
    throw new Error('Nieprawidłowe lub wygasłe zaproszenie');
  }
  
  // Aktywacja użytkownika
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(acceptData.password, 10),
      isActive: true,
      emailVerified: true
    }
  });
}
```

#### Interface Zarządzania Użytkownikami:

**URL**: `http://91.99.50.80/crm/dashboard/users/`

**Funkcjonalności:**
- Lista użytkowników z filtrowaniem i paginacją
- Zapraszanie nowych użytkowników (modal)
- Edycja ról i uprawnień
- Dezaktywacja użytkowników
- Hierarchia organizacyjna
- Statystyki zespołu

---

## 7. Limity i Ograniczenia

### 📊 Monitoring Limitów

#### Middleware Sprawdzania Limitów:

```typescript
// Middleware dla sprawdzania limitów organizacji
async function checkOrganizationLimits(limitType: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const organization = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      include: {
        users: { where: { isActive: true } },
        tasks: true,
        projects: true,
        // ... inne relacje do policzenia
      }
    });
    
    const limits = organization.limits as any;
    
    switch (limitType) {
      case 'users':
        if (limits.max_users && organization.users.length >= limits.max_users) {
          return res.status(403).json({
            error: 'User limit reached',
            current: organization.users.length,
            limit: limits.max_users,
            upgrade_required: true
          });
        }
        break;
        
      case 'tasks':
        if (limits.max_tasks_per_user) {
          const userTaskCount = await prisma.task.count({
            where: {
              organizationId: req.user.organizationId,
              assignedToId: req.user.id
            }
          });
          
          if (userTaskCount >= limits.max_tasks_per_user) {
            return res.status(403).json({
              error: 'Task limit reached for user',
              current: userTaskCount,
              limit: limits.max_tasks_per_user
            });
          }
        }
        break;
    }
    
    next();
  };
}

// Użycie w routes
router.post('/tasks', 
  authenticateToken,
  checkOrganizationLimits('tasks'),
  createTaskHandler
);
```

#### Frontend - Komunikaty o Limitach:

```typescript
// Frontend component dla wyświetlania statusu limitów
export function LimitsStatusCard() {
  const [limits, setLimits] = useState(null);
  
  useEffect(() => {
    fetch('/api/v1/organizations/limits-status')
      .then(res => res.json())
      .then(setLimits);
  }, []);
  
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Status Limitów</h3>
      
      <div className="space-y-3">
        <LimitBar 
          label="Użytkownicy"
          current={limits.users.current}
          max={limits.users.max}
          type="users"
        />
        <LimitBar 
          label="Zadania na użytkownika"
          current={limits.tasks.current}
          max={limits.tasks.max}
          type="tasks"
        />
        <LimitBar 
          label="Projekty"
          current={limits.projects.current}
          max={limits.projects.max}
          type="projects"
        />
      </div>
      
      {limits.upgrade_suggested && (
        <button className="mt-4 w-full btn btn-primary">
          Upgrade Plan
        </button>
      )}
    </div>
  );
}
```

---

## 8. Bezpieczeństwo

### 🛡️ Warstwy Bezpieczeństwa

#### 1. Authentication & Authorization

```typescript
// JWT Token Structure
interface TokenPayload {
  userId: string;
  organizationId: string;  // ← Kluczowe dla izolacji
  email: string;
  role: UserRole;
  permissions?: string[];
  iat: number;
  exp: number;
}

// Rate Limiting per Organization
const organizationRateLimit = rateLimit({
  keyGenerator: (req) => req.user.organizationId,
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 1000, // 1000 requests na 15 min na organizację
  message: 'Too many requests from this organization'
});
```

#### 2. Data Encryption

```typescript
// Encryption at rest dla wrażliwych danych
const crypto = require('crypto');

class EncryptionService {
  private key = process.env.ENCRYPTION_KEY;
  
  encrypt(text: string, organizationId: string): string {
    const organizationKey = crypto.pbkdf2Sync(this.key, organizationId, 10000, 32, 'sha512');
    const cipher = crypto.createCipher('aes-256-cbc', organizationKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  decrypt(encryptedText: string, organizationId: string): string {
    const organizationKey = crypto.pbkdf2Sync(this.key, organizationId, 10000, 32, 'sha512');
    const decipher = crypto.createDecipher('aes-256-cbc', organizationKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

#### 3. Audit Logs

```typescript
// Model audit logów
model AuditLog {
  id            String   @id @default(uuid())
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id])
  
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  action        String   // CREATE, UPDATE, DELETE, VIEW
  resource      String   // tasks, projects, users
  resourceId    String?  // ID konkretnego resouce'a
  details       Json?    // Szczegóły operacji
  ipAddress     String?
  userAgent     String?
  
  createdAt     DateTime @default(now())
  
  @@map("audit_logs")
}

// Middleware audit
async function auditLogger(action: string, resource: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log po wykonaniu akcji
      if (res.statusCode < 400) {
        prisma.auditLog.create({
          data: {
            organizationId: req.user.organizationId,
            userId: req.user.id,
            action,
            resource,
            resourceId: req.params.id,
            details: { body: req.body, params: req.params },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        }).catch(console.error);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}
```

---

## 9. Administracja Systemu

### ⚙️ Admin Dashboard

#### Super Admin Interface

**URL**: `http://91.99.50.80/crm/admin/` (dostępne tylko dla super adminów)

**Funkcjonalności:**
- Zarządzanie wszystkimi organizacjami
- Monitoring usage i billing
- Statystyki systemu
- Zarządzanie planami cenowymi
- Support tickets
- System maintenance

#### Organizations Management:

```typescript
// Admin API endpoints
router.get('/admin/organizations', superAdminAuth, async (req, res) => {
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
          tasks: true,
          projects: true
        }
      },
      subscription: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json({
    organizations: organizations.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.subscription?.plan,
      status: org.subscription?.status,
      userCount: org._count.users,
      taskCount: org._count.tasks,
      projectCount: org._count.projects,
      createdAt: org.createdAt,
      lastActivity: org.updatedAt
    }))
  });
});

// Organization details
router.get('/admin/organizations/:id', superAdminAuth, async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.params.id },
    include: {
      users: { where: { isActive: true } },
      subscription: true,
      _count: {
        select: {
          tasks: true,
          projects: true,
          messages: true,
          files: true
        }
      }
    }
  });
  
  res.json({
    organization: org,
    usage: {
      storage: await calculateStorageUsage(org.id),
      apiCalls: await getApiCallsCount(org.id, 'last_month'),
      activeUsers: await getActiveUsersCount(org.id, 'last_week')
    }
  });
});
```

#### System Monitoring:

```typescript
// Health check endpoint
router.get('/admin/health', async (req, res) => {
  const health = {
    database: await checkDatabaseHealth(),
    redis: await checkRedisHealth(),
    storage: await checkStorageHealth(),
    email: await checkEmailService(),
    version: process.env.APP_VERSION,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  res.json(health);
});

// System stats
router.get('/admin/stats', superAdminAuth, async (req, res) => {
  const stats = await Promise.all([
    prisma.organization.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.task.count(),
    prisma.project.count(),
    prisma.subscription.groupBy({
      by: ['plan'],
      _count: true
    })
  ]);
  
  res.json({
    totalOrganizations: stats[0],
    totalActiveUsers: stats[1],
    totalTasks: stats[2],
    totalProjects: stats[3],
    subscriptionsByPlan: stats[4]
  });
});
```

---

## 10. Rozszerzenia i Customizacja

### 🔧 Per-Tenant Customization

#### 1. Custom Branding

```typescript
// Model dla custom brandingu
model OrganizationBranding {
  id             String @id @default(uuid())
  organizationId String @unique
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  logoUrl        String?
  primaryColor   String?   // #hexcolor
  secondaryColor String?
  fontFamily     String?
  customCss      String?   // Custom CSS dla zaawansowanych kustomizacji
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@map("organization_branding")
}

// Frontend component dla custom themingu
export function useOrganizationTheme() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(null);
  
  useEffect(() => {
    if (user?.organizationId) {
      fetch(`/api/v1/organizations/${user.organizationId}/branding`)
        .then(res => res.json())
        .then(branding => {
          if (branding.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
          }
          if (branding.customCss) {
            const style = document.createElement('style');
            style.textContent = branding.customCss;
            document.head.appendChild(style);
          }
          setTheme(branding);
        });
    }
  }, [user]);
  
  return theme;
}
```

#### 2. Custom Fields

```typescript
// System custom fields per organizacja
model CustomField {
  id             String @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  entityType     String    // 'task', 'project', 'contact', etc.
  fieldName      String    // Nazwa pola
  fieldType      String    // 'text', 'number', 'date', 'select', 'multiselect'
  fieldOptions   Json?     // Opcje dla select/multiselect
  isRequired     Boolean   @default(false)
  defaultValue   String?
  position       Int       @default(0)
  
  createdAt      DateTime @default(now())
  
  @@unique([organizationId, entityType, fieldName])
  @@map("custom_fields")
}

// Custom field values
model CustomFieldValue {
  id            String @id @default(uuid())
  customFieldId String
  customField   CustomField @relation(fields: [customFieldId], references: [id])
  
  entityId      String    // ID rekordu (task, project, etc.)
  value         String?   // Wartość jako string (konwersja w aplikacji)
  
  @@unique([customFieldId, entityId])
  @@map("custom_field_values")
}
```

#### 3. Custom Workflows

```typescript
// Per-organization workflow definitions
model WorkflowTemplate {
  id             String @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  name           String
  description    String?
  entityType     String     // 'task', 'project', 'deal'
  triggerEvent   String     // 'create', 'update', 'status_change'
  conditions     Json       // Warunki wykonania
  actions        Json       // Akcje do wykonania
  isActive       Boolean    @default(true)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@map("workflow_templates")
}
```

---

## 11. Monitoring i Analytics

### 📊 Business Intelligence

#### 1. Usage Analytics per Organization

```typescript
// Model dla tracking usage
model UsageMetric {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  metricType     String   // 'api_calls', 'storage_used', 'active_users', 'tasks_created'
  value          Float
  unit           String   // 'count', 'bytes', 'milliseconds'
  timestamp      DateTime @default(now())
  metadata       Json?    // Dodatkowe dane kontekstowe
  
  @@index([organizationId, metricType, timestamp])
  @@map("usage_metrics")
}

// Service dla collecting metrics
class MetricsCollector {
  async trackApiCall(organizationId: string, endpoint: string, responseTime: number) {
    await prisma.usageMetric.create({
      data: {
        organizationId,
        metricType: 'api_calls',
        value: 1,
        unit: 'count',
        metadata: { endpoint, responseTime }
      }
    });
  }
  
  async trackStorageUsage(organizationId: string) {
    const totalSize = await this.calculateOrganizationStorageSize(organizationId);
    await prisma.usageMetric.create({
      data: {
        organizationId,
        metricType: 'storage_used',
        value: totalSize,
        unit: 'bytes'
      }
    });
  }
  
  async getOrganizationMetrics(organizationId: string, timeRange: string) {
    const startDate = this.getStartDateForRange(timeRange);
    
    return prisma.usageMetric.groupBy({
      by: ['metricType'],
      where: {
        organizationId,
        timestamp: { gte: startDate }
      },
      _sum: { value: true },
      _avg: { value: true },
      _count: true
    });
  }
}
```

#### 2. Dashboard Analytics

```typescript
// Analytics dashboard dla admina organizacji
router.get('/organizations/:id/analytics', authenticateToken, async (req, res) => {
  const { id: organizationId } = req.params;
  const { timeRange = '30d' } = req.query;
  
  if (req.user.organizationId !== organizationId || !['OWNER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const analytics = await Promise.all([
    // User activity
    getUserActivityMetrics(organizationId, timeRange),
    
    // Task completion rates
    getTaskCompletionMetrics(organizationId, timeRange),
    
    // Project progress
    getProjectProgressMetrics(organizationId, timeRange),
    
    // Communication metrics
    getCommunicationMetrics(organizationId, timeRange),
    
    // System usage
    getSystemUsageMetrics(organizationId, timeRange)
  ]);
  
  res.json({
    userActivity: analytics[0],
    taskCompletion: analytics[1],
    projectProgress: analytics[2],
    communication: analytics[3],
    systemUsage: analytics[4],
    generatedAt: new Date().toISOString()
  });
});
```

---

## 12. Backup i Disaster Recovery

### 💾 Strategia Backup

#### 1. Database Backup per Organization

```bash
#!/bin/bash
# Script: backup-organization.sh

ORGANIZATION_ID=$1
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/organizations/${ORGANIZATION_ID}"

mkdir -p ${BACKUP_DIR}

# Dump danych organizacji
docker exec crm-postgres-v1 pg_dump \
  -h localhost -U user -d crm_gtd_v1 \
  --where="organization_id='${ORGANIZATION_ID}'" \
  -t users -t tasks -t projects -t contacts -t companies \
  -t deals -t messages -t files -t audit_logs \
  > ${BACKUP_DIR}/organization_${ORGANIZATION_ID}_${BACKUP_DATE}.sql

# Backup plików organizacji
if [ -d "/uploads/${ORGANIZATION_ID}" ]; then
  tar -czf ${BACKUP_DIR}/files_${ORGANIZATION_ID}_${BACKUP_DATE}.tar.gz \
    /uploads/${ORGANIZATION_ID}/
fi

# Konfiguracja organizacji
docker exec crm-postgres-v1 psql \
  -h localhost -U user -d crm_gtd_v1 \
  -c "COPY (SELECT * FROM organizations WHERE id='${ORGANIZATION_ID}') TO STDOUT WITH CSV HEADER" \
  > ${BACKUP_DIR}/config_${ORGANIZATION_ID}_${BACKUP_DATE}.csv

echo "Backup completed for organization ${ORGANIZATION_ID}"
```

#### 2. Automated Backup System

```typescript
// Cron job dla automatycznych backupów
import cron from 'node-cron';

class BackupService {
  constructor() {
    // Codziennie o 2:00 AM
    cron.schedule('0 2 * * *', this.performDailyBackups.bind(this));
    
    // Co tydzień pełny backup
    cron.schedule('0 1 * * 0', this.performWeeklyBackups.bind(this));
  }
  
  async performDailyBackups() {
    const activeOrganizations = await prisma.organization.findMany({
      where: {
        subscription: {
          status: { in: ['ACTIVE', 'TRIAL'] }
        }
      }
    });
    
    for (const org of activeOrganizations) {
      try {
        await this.backupOrganization(org.id);
        console.log(`Daily backup completed for ${org.name}`);
      } catch (error) {
        console.error(`Backup failed for ${org.name}:`, error);
        await this.notifyBackupFailure(org.id, error);
      }
    }
  }
  
  async backupOrganization(organizationId: string) {
    // 1. Database backup
    await this.createDatabaseBackup(organizationId);
    
    // 2. Files backup
    await this.createFilesBackup(organizationId);
    
    // 3. Configuration backup
    await this.createConfigBackup(organizationId);
    
    // 4. Update backup metadata
    await prisma.backupLog.create({
      data: {
        organizationId,
        backupType: 'daily',
        status: 'completed',
        size: await this.calculateBackupSize(organizationId),
        completedAt: new Date()
      }
    });
  }
}
```

#### 3. Disaster Recovery Procedures

```typescript
// Restore organization from backup
class RestoreService {
  async restoreOrganization(organizationId: string, backupDate: string) {
    console.log(`Starting restore for organization ${organizationId} from ${backupDate}`);
    
    try {
      // 1. Create transaction for atomic restore
      await prisma.$transaction(async (tx) => {
        // 2. Backup current state przed restore
        await this.createEmergencyBackup(organizationId);
        
        // 3. Clear current organization data
        await this.clearOrganizationData(tx, organizationId);
        
        // 4. Restore from backup files
        await this.restoreFromBackupFiles(organizationId, backupDate);
        
        // 5. Verify data integrity
        await this.verifyRestoredData(organizationId);
      });
      
      console.log(`Restore completed successfully for ${organizationId}`);
      
      // Notify organization admins
      await this.notifyRestoreCompletion(organizationId);
      
    } catch (error) {
      console.error(`Restore failed for ${organizationId}:`, error);
      
      // Rollback to emergency backup
      await this.rollbackToEmergencyBackup(organizationId);
      
      throw error;
    }
  }
  
  async verifyRestoredData(organizationId: string) {
    // Sprawdź integralność danych
    const checks = await Promise.all([
      this.verifyUserDataIntegrity(organizationId),
      this.verifyTaskDataIntegrity(organizationId),
      this.verifyProjectDataIntegrity(organizationId),
      this.verifyRelationalIntegrity(organizationId)
    ]);
    
    if (checks.some(check => !check.valid)) {
      throw new Error('Data integrity check failed after restore');
    }
  }
}
```

---

## 🚀 Deployment i Skalowanie

### Deployment Strategies

#### 1. Blue-Green Deployment dla Zero Downtime

```yaml
# docker-compose.production.yml
version: '3.8'
services:
  crm-backend-v1-blue:
    image: crm-backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/crm_blue
    ports:
      - "3003:3000"
      
  crm-backend-v1-green:
    image: crm-backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/crm_green
    ports:
      - "3004:3000"
      
  crm-frontend-v1-blue:
    image: crm-frontend:latest
    environment:
      - NEXT_PUBLIC_API_URL=http://crm-backend-v1-blue:3000
    ports:
      - "9025:3000"
      
  crm-frontend-v1-green:
    image: crm-frontend:latest
    environment:
      - NEXT_PUBLIC_API_URL=http://crm-backend-v1-green:3000
    ports:
      - "9026:3000"
```

#### 2. Load Balancer Configuration

```nginx
# /etc/nginx/sites-available/crm-production
upstream backend_blue {
    server localhost:3003;
}

upstream backend_green {
    server localhost:3004;
}

upstream frontend_blue {
    server localhost:9025;
}

upstream frontend_green {
    server localhost:9026;
}

# Active backend (switch during deployment)
upstream backend_active {
    server localhost:3003;  # Blue is active
}

upstream frontend_active {
    server localhost:9025;  # Blue is active
}

server {
    listen 80;
    server_name crm-app.com *.crm-app.com;
    
    # API routes
    location /api/ {
        proxy_pass http://backend_active;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend routes
    location / {
        proxy_pass http://frontend_active;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📞 Support i Maintenance

### Customer Support System

#### 1. Built-in Help Desk

```typescript
// Model dla support tickets
model SupportTicket {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  
  subject        String
  description    String
  priority       String   // LOW, MEDIUM, HIGH, CRITICAL
  status         String   // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  category       String   // TECHNICAL, BILLING, FEATURE_REQUEST, BUG
  
  assignedToId   String?  // Support agent
  resolution     String?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  resolvedAt     DateTime?
  
  @@map("support_tickets")
}

// API dla tworzenia ticket
router.post('/support/tickets', authenticateToken, async (req, res) => {
  const { subject, description, priority, category } = req.body;
  
  const ticket = await prisma.supportTicket.create({
    data: {
      organizationId: req.user.organizationId,
      userId: req.user.id,
      subject,
      description,
      priority: priority || 'MEDIUM',
      category: category || 'TECHNICAL',
      status: 'OPEN'
    }
  });
  
  // Notify support team
  await notifySupportTeam(ticket);
  
  res.status(201).json({ ticket });
});
```

#### 2. Status Page

```typescript
// Public status page endpoint
router.get('/status', async (req, res) => {
  const status = {
    overall: 'operational', // operational, degraded, down
    services: {
      api: await checkApiHealth(),
      database: await checkDatabaseHealth(),
      storage: await checkStorageHealth(),
      email: await checkEmailHealth()
    },
    incidents: await getActiveIncidents(),
    uptime: {
      last24h: await calculateUptime('24h'),
      last7d: await calculateUptime('7d'),
      last30d: await calculateUptime('30d')
    },
    lastUpdated: new Date().toISOString()
  };
  
  res.json(status);
});
```

---

## 🎯 Podsumowanie

CRM-GTD Smart jest w pełni funkcjonalnym systemem SaaS z:

### ✅ **Gotowe Komponenty:**
- Multi-tenant architecture z izolacją danych
- System rejestracji organizacji z planami subskrypcji
- Zarządzanie użytkownikami i rolami
- Limity i ograniczenia per plan
- Bezpieczeństwo na poziomie enterprise
- Monitoring i analytics
- Backup i disaster recovery

### 🚀 **Aby uruchomić jako SaaS:**

1. **Skonfiguruj domeny**:
   ```bash
   # Główna domena
   crm-app.com → nginx → aplikacja
   
   # Subdomeny organizacji
   *.crm-app.com → nginx → aplikacja (z routing po slug)
   ```

2. **Setup płatności** (opcjonalnie):
   - Integracja Stripe
   - Webhooks dla billing
   - Upgrade/downgrade flows

3. **Marketing setup**:
   - Landing page
   - Pricing page
   - Documentation

**System jest gotowy do użycia jako SaaS już teraz!** Każda organizacja rejestrująca się przez `/auth/register` otrzymuje kompletnie odizolowaną instancję z pełną funkcjonalnością CRM-GTD.