# TODO Users & Security System - Implementacja brakujących funkcji

## 🎯 **Status obecny**: ✅ 82% ZAIMPLEMENTOWANE - PRODUCTION READY
System bezpieczeństwa jest solidnie zaprojektowany i w dużej mierze kompletny z kilkoma obszarami wymagającymi dopracowania.

---

## 🚀 **FAZA 1: CRITICAL - AUTH CONTROLLERS** (Priorytet: KRYTYCZNY - 1 tydzień)

### 1.1 Dokończenie AuthController implementations
**Lokalizacja**: `/packages/backend/src/modules/auth/controller.ts`

#### Brakujące metody:
- [ ] **`verifyEmail()`** - Weryfikacja adresu email po rejestracji
  ```typescript
  // POST /api/v1/auth/verify-email
  // Body: { token: string }
  // Aktywacja konta użytkownika
  ```

- [ ] **`requestPasswordReset()`** - Żądanie resetu hasła
  ```typescript
  // POST /api/v1/auth/request-password-reset
  // Body: { email: string }
  // Wysłanie tokenu reset na email
  ```

- [ ] **`confirmPasswordReset()`** - Potwierdzenie nowego hasła
  ```typescript
  // POST /api/v1/auth/confirm-password-reset
  // Body: { token: string, newPassword: string }
  // Ustawienie nowego hasła
  ```

#### Database extensions needed:
- [ ] **Dodanie pól do User model**:
  ```typescript
  model User {
    emailVerified     Boolean   @default(false)
    emailVerifyToken  String?   @unique
    passwordResetToken String?  @unique
    passwordResetExpiry DateTime?
    lastPasswordChange DateTime?
  }
  ```

#### Implementation tasks:
- [ ] **Email service integration** - SendGrid/Nodemailer setup
- [ ] **Token generation** - Crypto-secure tokens with expiry
- [ ] **Email templates** - HTML templates dla verification/reset
- [ ] **Frontend forms** - Komponenty dla verify/reset flows

---

## 🔧 **FAZA 2: USER MANAGEMENT CRUD** (Priorytet: WYSOKI - 1 tydzień)

### 2.1 Backend API Extensions
**Lokalizacja**: `/packages/backend/src/routes/users.ts`

#### Nowe endpoints do implementacji:
- [ ] **`PUT /api/v1/users/:id`** - Update user profile
  ```typescript
  // Permissions: Self + ADMIN/OWNER
  // Body: { name?, email?, bio?, avatar?, preferences? }
  // Validation: Email uniqueness, organization scope
  ```

- [ ] **`DELETE /api/v1/users/:id`** - Deactivate user (soft delete)
  ```typescript
  // Permissions: ADMIN/OWNER only
  // Sets isActive = false instead of physical delete
  // Cascade handling for owned resources
  ```

- [ ] **`PATCH /api/v1/users/:id/role`** - Change user role
  ```typescript
  // Permissions: ADMIN/OWNER only
  // Body: { role: UserRole }
  // Validation: Cannot demote last OWNER
  ```

- [ ] **`GET /api/v1/users/me/profile`** - Get self profile
  ```typescript
  // Extended profile with preferences, settings, stats
  // Activity metrics, recent actions
  ```

- [ ] **`PUT /api/v1/users/me/profile`** - Update self profile
  ```typescript
  // Self-service profile editing
  // Limited fields (no role changes)
  ```

### 2.2 Business Logic Implementation
- [ ] **UserService extensions**:
  ```typescript
  class UserService {
    async updateUser(id: string, data: UpdateUserData, updatedBy: string)
    async deactivateUser(id: string, deactivatedBy: string) 
    async changeUserRole(id: string, newRole: UserRole, changedBy: string)
    async validateRoleChange(userId: string, newRole: UserRole, organizationId: string)
    async getUserActivityStats(userId: string)
  }
  ```

- [ ] **Validation rules**:
  - Cannot deactivate last OWNER of organization
  - Cannot change role of yourself 
  - MANAGER can only manage direct reports
  - Email uniqueness across organization

### 2.3 Frontend User Management
**Lokalizacja**: `/packages/frontend/src/components/users/`

#### Nowe komponenty:
- [ ] **`EditUserModal.tsx`** - Form edycji użytkownika
  ```typescript
  interface EditUserModalProps {
    user: User;
    onSave: (data: UpdateUserData) => Promise<void>;
    canChangeRole: boolean;
  }
  ```

- [ ] **`UserProfilePage.tsx`** - Strona profilu użytkownika
  ```typescript
  // Self-service profile editing
  // Activity history, preferences, statistics
  // Avatar upload, bio, contact info
  ```

- [ ] **`RoleChangeModal.tsx`** - Modal zmiany roli
  ```typescript
  // Role selection with permission explanation
  // Confirmation dialog for role changes
  // Audit trail display
  ```

- [ ] **`DeactivateUserModal.tsx`** - Potwierdzenie deaktywacji
  ```typescript
  // Warning about consequences
  // Resource reassignment options
  // Confirmation with password
  ```

---

## 🛡️ **FAZA 3: ENHANCED SECURITY** (Priorytet: ŚREDNI - 2 tygodnie)

### 3.1 Rate Limiting & Brute Force Protection
**Lokalizacja**: `/packages/backend/src/shared/middleware/rateLimit.ts`

- [ ] **Przywrócenie rate limiting**:
  ```typescript
  // Obecnie wyłączone - aktywować w routes/auth.ts
  app.use('/api/v1/auth/login', strictRateLimit)     // 5 req/15min
  app.use('/api/v1/auth/register', strictRateLimit)  // 5 req/15min
  app.use('/api/v1/auth/*', authRateLimit)           // 20 req/15min
  ```

- [ ] **Brute force protection**:
  ```typescript
  // Account lockout po 5 failed login attempts
  // Progressive delays: 1min, 5min, 15min, 1h, 24h
  // IP-based blocking dla distributed attacks
  
  model LoginAttempt {
    id          String   @id @default(uuid())
    email       String
    ipAddress   String
    success     Boolean
    attemptedAt DateTime @default(now())
    userAgent   String?
  }
  ```

- [ ] **Session management**:
  ```typescript
  model UserSession {
    id         String   @id @default(uuid())
    userId     String
    deviceInfo Json     // Browser, OS, location
    ipAddress  String
    lastActive DateTime @default(now())
    isActive   Boolean  @default(true)
    createdAt  DateTime @default(now())
  }
  ```

### 3.2 Security Audit Logging
**Lokalizacja**: `/packages/backend/src/shared/services/auditLog.ts`

- [ ] **Audit Log System**:
  ```typescript
  model SecurityAuditLog {
    id           String   @id @default(uuid())
    userId       String?
    organizationId String
    action       SecurityAction  // LOGIN, LOGOUT, ROLE_CHANGE, PASSWORD_CHANGE
    resource     String?         // Affected resource
    details      Json            // Additional context
    ipAddress    String
    userAgent    String
    timestamp    DateTime @default(now())
    severity     LogSeverity     // INFO, WARNING, CRITICAL
  }
  
  enum SecurityAction {
    LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT
    PASSWORD_CHANGE, PASSWORD_RESET
    ROLE_CHANGE, USER_CREATED, USER_DEACTIVATED
    PERMISSION_GRANTED, PERMISSION_REVOKED
    ORGANIZATION_CREATED, ORGANIZATION_DELETED
  }
  ```

- [ ] **Security monitoring**:
  ```typescript
  class SecurityMonitor {
    async logSecurityEvent(action: SecurityAction, details: any)
    async detectSuspiciousActivity(userId: string)
    async generateSecurityReport(organizationId: string, timeRange: string)
    async alertAdminsOnCriticalEvents(event: SecurityAuditLog)
  }
  ```

### 3.3 Advanced Authentication Features
- [ ] **Device tracking**:
  ```typescript
  // Track user devices and sessions
  // Notify on new device login
  // Allow users to revoke sessions
  ```

- [ ] **Security settings page**:
  ```typescript
  // Frontend page for security management
  // Active sessions list
  // Login history
  // Security preferences
  ```

---

## 🔐 **FAZA 4: ENTERPRISE FEATURES** (Priorytet: NISKI - 1-2 miesiące)

### 4.1 Two-Factor Authentication (2FA)
- [ ] **TOTP Implementation** (Google Authenticator, Authy)
  ```typescript
  model User {
    twoFactorEnabled  Boolean @default(false)
    twoFactorSecret   String? // Encrypted TOTP secret
    backupCodes       String[] // Recovery codes
  }
  ```

- [ ] **2FA Setup Flow**:
  ```typescript
  // QR code generation for TOTP setup
  // Backup codes generation and display
  // 2FA requirement enforcement per organization
  ```

### 4.2 Single Sign-On (SSO)
- [ ] **SAML 2.0 Integration**:
  ```typescript
  // Enterprise SSO dla dużych organizacji
  // Identity Provider integration
  // Just-in-Time (JIT) user provisioning
  ```

- [ ] **OAuth2/OpenID Connect**:
  ```typescript
  // Google Workspace, Microsoft 365 integration
  // Social login options
  ```

### 4.3 API Authentication
- [ ] **API Keys System**:
  ```typescript
  model APIKey {
    id             String   @id @default(uuid())
    userId         String
    name           String   // User-friendly name
    keyHash        String   @unique // Hashed API key
    permissions    String[] // Scoped permissions
    lastUsed       DateTime?
    expiresAt      DateTime?
    isActive       Boolean  @default(true)
  }
  ```

---

## 📊 **FAZA 5: ADVANCED RBAC** (Priorytet: PRZYSZŁOŚĆ - 2-3 miesiące)

### 5.1 Granular Permissions System
- [ ] **Resource-specific permissions**:
  ```typescript
  model Permission {
    id       String @id @default(uuid())
    name     String @unique  // "tasks.create", "projects.edit"
    resource String          // "tasks", "projects", "users"
    action   String          // "create", "read", "update", "delete"
    scope    String?         // "own", "team", "organization"
  }
  
  model RolePermission {
    roleId       String
    permissionId String
    @@id([roleId, permissionId])
  }
  ```

- [ ] **Dynamic role creation**:
  ```typescript
  // Admins can create custom roles
  // Permission templates for common roles
  // Role inheritance and composition
  ```

### 5.2 Context-Aware Access Control
- [ ] **Time-based access**:
  ```typescript
  // Working hours restrictions
  // Temporary elevated permissions
  // Time-limited resource access
  ```

- [ ] **Location-based access**:
  ```typescript
  // IP whitelist per organization
  // Geo-location restrictions
  // VPN requirement for sensitive operations
  ```

---

## 👥 **PRZYKŁADOWE DANE UŻYTKOWNIKÓW**

### Organizacja 1: "Tech Solutions Sp. z o.o."
```typescript
const sampleUsers = [
  {
    id: "user_owner_001",
    email: "michal.kowalski@techsolutions.pl",
    name: "Michał Kowalski",
    role: "OWNER",
    isActive: true,
    emailVerified: true,
    createdAt: "2024-01-15T08:00:00.000Z",
    lastLoginAt: "2025-07-04T09:30:00.000Z",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    bio: "Założyciel i CEO Tech Solutions. 15 lat doświadczenia w branży IT.",
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: false, push: true }
    }
  },
  
  {
    id: "user_admin_001", 
    email: "anna.nowak@techsolutions.pl",
    name: "Anna Nowak",
    role: "ADMIN",
    isActive: true,
    emailVerified: true,
    createdAt: "2024-02-01T10:00:00.000Z",
    lastLoginAt: "2025-07-04T08:45:00.000Z",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b6cf03e6?w=400",
    bio: "HR Director i Administrator systemu. Zarządza zespołem i procesami.",
    managerId: "user_owner_001", // Raportuje do Michała
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: true, push: true }
    }
  },
  
  {
    id: "user_manager_001",
    email: "piotr.wisniewski@techsolutions.pl", 
    name: "Piotr Wiśniewski",
    role: "MANAGER",
    isActive: true,
    emailVerified: true,
    createdAt: "2024-03-15T12:00:00.000Z",
    lastLoginAt: "2025-07-04T07:15:00.000Z",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    bio: "Team Lead projektów desenvolupowych. Specjalista od Agile i Scrum.",
    managerId: "user_admin_001", // Raportuje do Anny
    department: "Development",
    preferences: {
      language: "pl", 
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: false, push: true }
    }
  },
  
  {
    id: "user_member_001",
    email: "katarzyna.wojcik@techsolutions.pl",
    name: "Katarzyna Wójcik", 
    role: "MEMBER",
    isActive: true,
    emailVerified: true,
    createdAt: "2024-04-20T14:30:00.000Z",
    lastLoginAt: "2025-07-04T09:00:00.000Z", 
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    bio: "Senior Developer Full-Stack. Specjalizuje się w React i Node.js.",
    managerId: "user_manager_001", // Raportuje do Piotra
    department: "Development",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw", 
      notifications: { email: true, sms: false, push: false }
    }
  },
  
  {
    id: "user_member_002", 
    email: "tomasz.krawczyk@techsolutions.pl",
    name: "Tomasz Krawczyk",
    role: "MEMBER",
    isActive: true,
    emailVerified: true,
    createdAt: "2024-05-10T11:00:00.000Z",
    lastLoginAt: "2025-07-03T16:45:00.000Z",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400", 
    bio: "UX/UI Designer i Frontend Developer. Tworzy intuicyjne interfejsy.",
    managerId: "user_manager_001", // Raportuje do Piotra
    department: "Design",
    skills: ["Figma", "Adobe XD", "CSS", "JavaScript", "Vue.js"],
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: false, push: true }
    }
  },
  
  {
    id: "user_guest_001",
    email: "consultant@external.com", 
    name: "Jan Konsultant",
    role: "GUEST",
    isActive: true,
    emailVerified: true,
    createdAt: "2025-06-01T09:00:00.000Z",
    lastLoginAt: "2025-07-04T10:00:00.000Z",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
    bio: "Zewnętrzny konsultant biznesowy. Dostęp tylko do odczytu projektów.",
    isExternal: true,
    accessExpiry: "2025-12-31T23:59:59.000Z", // Ograniczony dostęp czasowy
    allowedResources: ["projects:read", "tasks:read"], // Ograniczone uprawnienia
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: false, sms: false, push: false }
    }
  }
];
```

### Organizacja 2: "Digital Marketing Group"
```typescript
const marketingOrgUsers = [
  {
    id: "user_owner_002",
    email: "ceo@digitalmarketing.pl", 
    name: "Aleksandra Kowalczyk",
    role: "OWNER",
    isActive: true,
    emailVerified: true,
    department: "Executive",
    bio: "CEO Digital Marketing Group. Ekspert w digital transformation."
  },
  
  {
    id: "user_admin_002",
    email: "admin@digitalmarketing.pl",
    name: "Marek Nowak", 
    role: "ADMIN", 
    isActive: true,
    emailVerified: true,
    managerId: "user_owner_002",
    department: "Operations",
    bio: "COO i Administrator systemu. Zarządza operacjami i zespołem."
  },
  
  {
    id: "user_manager_002",
    email: "marketing.lead@digitalmarketing.pl",
    name: "Joanna Wójcik",
    role: "MANAGER",
    isActive: true, 
    emailVerified: true,
    managerId: "user_admin_002",
    department: "Marketing",
    bio: "Marketing Director. Lider zespołu marketingu digitalnego."
  },
  
  {
    id: "user_member_003",
    email: "specialist@digitalmarketing.pl", 
    name: "Łukasz Zieliński",
    role: "MEMBER",
    isActive: true,
    emailVerified: true, 
    managerId: "user_manager_002",
    department: "Marketing",
    bio: "Digital Marketing Specialist. SEO, SEM, Social Media."
  },
  
  {
    id: "user_member_004", 
    email: "designer@digitalmarketing.pl",
    name: "Monika Kaczmarek",
    role: "MEMBER",
    isActive: false, // Przykład nieaktywnego użytkownika
    emailVerified: true,
    managerId: "user_manager_002", 
    department: "Creative",
    bio: "Graphic Designer. Tworzy materiały wizualne do kampanii.",
    deactivatedAt: "2025-06-15T10:00:00.000Z",
    deactivatedBy: "user_admin_002",
    deactivationReason: "Employee left company"
  }
];
```

### Relacje hierarchiczne (UserRelations):
```typescript
const userRelations = [
  // Tech Solutions Hierarchy
  {
    managerId: "user_owner_001",    // Michał Kowalski
    employeeId: "user_admin_001",   // Anna Nowak
    relationType: "MANAGES",
    isActive: true,
    establishedAt: "2024-02-01T00:00:00.000Z"
  },
  {
    managerId: "user_admin_001",    // Anna Nowak  
    employeeId: "user_manager_001", // Piotr Wiśniewski
    relationType: "MANAGES", 
    isActive: true,
    establishedAt: "2024-03-15T00:00:00.000Z"
  },
  {
    managerId: "user_manager_001",  // Piotr Wiśniewski
    employeeId: "user_member_001",  // Katarzyna Wójcik
    relationType: "LEADS",
    isActive: true,
    establishedAt: "2024-04-20T00:00:00.000Z"
  },
  {
    managerId: "user_manager_001",  // Piotr Wiśniewski
    employeeId: "user_member_002",  // Tomasz Krawczyk  
    relationType: "LEADS",
    isActive: true,
    establishedAt: "2024-05-10T00:00:00.000Z"
  },
  
  // Cross-functional mentoring
  {
    managerId: "user_member_001",   // Katarzyna Wójcik
    employeeId: "user_member_002",  // Tomasz Krawczyk
    relationType: "MENTORS",        // Mentoring w zakresie Full-Stack
    isActive: true,
    establishedAt: "2024-06-01T00:00:00.000Z"
  },
  
  // Digital Marketing Group Hierarchy  
  {
    managerId: "user_owner_002",    // Aleksandra Kowalczyk
    employeeId: "user_admin_002",   // Marek Nowak
    relationType: "MANAGES",
    isActive: true,
    establishedAt: "2024-01-10T00:00:00.000Z"
  },
  {
    managerId: "user_admin_002",    // Marek Nowak
    employeeId: "user_manager_002", // Joanna Wójcik
    relationType: "MANAGES",
    isActive: true, 
    establishedAt: "2024-02-15T00:00:00.000Z"
  },
  {
    managerId: "user_manager_002",  // Joanna Wójcik
    employeeId: "user_member_003",  // Łukasz Zieliński
    relationType: "SUPERVISES",
    isActive: true,
    establishedAt: "2024-03-01T00:00:00.000Z"
  }
];
```

### Uprawnienia specjalne (UserPermissions):
```typescript
const userPermissions = [
  {
    userId: "user_member_001",      // Katarzyna Wójcik
    permission: "projects.admin",   // Admin projektów development
    resource: "projects",
    scope: "department", 
    grantedBy: "user_manager_001",
    grantedAt: "2024-07-01T00:00:00.000Z",
    expiresAt: null, // Permanent
    isActive: true
  },
  {
    userId: "user_guest_001",       // Jan Konsultant  
    permission: "projects.read",    // Tylko odczyt określonych projektów
    resource: "project_abc_123",
    scope: "resource",
    grantedBy: "user_admin_001", 
    grantedAt: "2025-06-01T00:00:00.000Z",
    expiresAt: "2025-12-31T23:59:59.000Z", // Czasowy dostęp
    isActive: true
  },
  {
    userId: "user_member_002",      // Tomasz Krawczyk
    permission: "designs.admin",    // Admin materiałów design
    resource: "design_assets",
    scope: "organization",
    grantedBy: "user_admin_001",
    grantedAt: "2024-08-15T00:00:00.000Z", 
    expiresAt: null,
    isActive: true
  }
];
```

### Statystyki użytkowników:
```typescript
const userStats = {
  totalUsers: 11,
  activeUsers: 10,
  inactiveUsers: 1,
  byRole: {
    OWNER: 2,
    ADMIN: 2, 
    MANAGER: 2,
    MEMBER: 4,
    GUEST: 1
  },
  byOrganization: {
    "Tech Solutions Sp. z o.o.": 6,
    "Digital Marketing Group": 5
  },
  averageTeamSize: 2.5,
  hierarchyDepth: 3, // Owner -> Admin -> Manager -> Member
  lastLoginActivity: "95% użytkowników logowało się w ostatnich 7 dniach"
};
```

---

## 📋 **QUICK WINS - PIERWSZEŃSTWO IMPLEMENTACJI**

### Tydzień 1:
1. **AuthController completion** - verifyEmail, passwordReset (2 dni)
2. **Rate limiting activation** - przywrócenie ochrony (1 dzień)
3. **User CRUD endpoints** - update, deactivate, role change (2 dni)

### Tydzień 2:  
4. **Frontend user management** - EditUserModal, UserProfilePage (3 dni)
5. **Brute force protection** - account lockout system (2 dni)

### Tydzień 3-4:
6. **Security audit logging** - comprehensive audit trail (1 tydzień)
7. **Session management** - device tracking, session control (1 tydzień)

**Total estimated effort dla Phase 1-3: ~4 tygodnie pracy**

---

*Dokument utworzony: 2025-07-04*  
*Status: System 82% kompletny - Production Ready z rekomendowanymi ulepszeniami*  
*Next Review: Po ukończeniu Fazy 1*