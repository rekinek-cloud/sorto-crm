# Architektura autentykacji i multi-tenancy -- Sorto CRM

Dokument opisuje system uwierzytelniania, autoryzacji, izolacji danych
miedzy organizacjami (multi-tenancy) oraz kontrole dostepu opartej na
rolach (RBAC) w Sorto CRM.

---

## 1. Przeglad

System autentykacji Sorto CRM zapewnia:

- **Uwierzytelnianie uzytkownikow** -- JWT (access + refresh token)
- **Uwierzytelnianie zewnetrznych narzedzi** -- API Key (MCP / ChatGPT)
- **Single Sign-On** -- SSO miedzy modulami platformy Sorto
- **Izolacje danych** -- kazde zapytanie ograniczone do organizacji (tenant)
- **Kontrole dostepu** -- role (RBAC) + szczegolowe uprawnienia per zasob
- **Limity organizacji** -- kontrola limitow zasobow (uzytkownicy, streamy, taski, projekty)

### Podstawowy lancuch middleware

```
Request
   |
   v
Rate Limiter (IP / user / org / strict)
   |
   v
authenticateToken / apiKeyGuard      <-- wybor metody auth
   |
   v
requireRole(['ADMIN', 'OWNER'])      <-- opcjonalna kontrola roli
   |
   v
checkOrganizationLimits('users')     <-- opcjonalna kontrola limitow
   |
   v
validateRequest({ body: schema })    <-- walidacja Zod
   |
   v
Route Handler (z req.user + req.organization)
```

---

## 2. Diagram architektury

```
+------------------------------------------------------------------+
|                          KLIENTY                                  |
+------------------------------------------------------------------+
|  Frontend (React/Next.js)  |  MCP Server  |  ChatGPT Actions     |
|  Authorization: Bearer JWT |  Bearer API  |  Bearer API Key      |
+------------------------------------------------------------------+
              |                       |                |
              v                       v                v
+------------------------------------------------------------------+
|                     EXPRESS MIDDLEWARE                             |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+   +-------------------+                    |
|  | authenticateToken |   | apiKeyGuard       |                    |
|  |                   |   |                   |                    |
|  | 1. Bearer JWT     |   | 1. Bearer API Key |                   |
|  | 2. jwt.verify()   |   | 2. SHA-256 hash  |                    |
|  | 3. prisma.user    |   | 3. mcp_api_keys  |                    |
|  | 4. req.user =     |   | 4. req.mcpContext |                   |
|  |    { id, email,   |   |    = { org, key } |                   |
|  |      role, orgId }|   |                   |                    |
|  | 5. set_config     |   |                   |                    |
|  |    app.current_   |   |                   |                    |
|  |    org_id (RLS)   |   |                   |                    |
|  +-------------------+   +-------------------+                    |
|           |                        |                              |
|           v                        v                              |
|  +-------------------+   +-------------------+                    |
|  | requireRole       |   | (rola nie jest    |                    |
|  | (['ADMIN','OWNER'])|  |  sprawdzana --    |                    |
|  +-------------------+   |  klucz = org-lvl) |                    |
|           |               +-------------------+                   |
|           v                        |                              |
|  +-------------------+             |                              |
|  | checkOrg.Limits   |             |                              |
|  | (users/streams/   |             |                              |
|  |  tasks/projects)  |             |                              |
|  +-------------------+             |                              |
|           |                        |                              |
+-----------+------------------------+------------------------------+
            |                        |
            v                        v
+------------------------------------------------------------------+
|                     ROUTE HANDLER                                 |
|  const { organizationId } = req.user!;                           |
|  prisma.entity.findMany({ where: { organizationId } })           |
+------------------------------------------------------------------+
            |
            v
+------------------------------------------------------------------+
|                     POSTGRESQL                                    |
|  set_config('app.current_org_id', orgId)   <-- RLS context       |
|  Kazda tabela: organizationId (FK -> organizations.id)           |
+------------------------------------------------------------------+
```

---

## 3. Metody uwierzytelniania

### 3.1 JWT (JSON Web Token) -- glowna metoda

Uzywana przez frontend (React/Next.js) i wszystkie endpointy API
wymagajace sesji uzytkownika.

**Format naglowka:**
```
Authorization: Bearer <access_token>
```

**Struktura tokenu (payload):**
```typescript
interface JWTPayload {
  userId: string;         // UUID uzytkownika
  organizationId: string; // UUID organizacji (tenant)
  email: string;          // adres email
  role: string;           // OWNER | ADMIN | MANAGER | MEMBER | GUEST
  iat: number;            // issued at (timestamp)
  exp: number;            // expires at (timestamp)
}
```

**Parametry podpisywania:**
| Parametr | Wartosc |
|----------|---------|
| Algorytm | HS256 (domyslny jsonwebtoken) |
| Secret | `JWT_SECRET` (min. 32 znaki, env) |
| Issuer | `crm-gtd-saas` |
| Audience | `crm-gtd-app` |
| Czas zycia access token | 15 minut (`JWT_EXPIRES_IN`) |
| Czas zycia refresh token | 7 dni (przechowywany w bazie) |

**Schemat odswiezania tokenow:**
```
1. Access token wygasa
2. Frontend wysyla POST /api/v1/auth/refresh { refreshToken }
3. Backend weryfikuje refresh token w tabeli refresh_tokens
4. Generuje nowa pare (access + refresh)
5. Stary refresh token usuwany (rotacja)
6. Zwraca { accessToken, refreshToken, expiresIn }
```

**Pliki zrodlowe:**
- `/packages/backend/src/shared/utils/jwt.ts` -- generowanie, weryfikacja, rotacja tokenow
- `/packages/backend/src/shared/middleware/auth.ts` -- middleware `authenticateToken`
- `/packages/backend/src/modules/auth/service.ts` -- logika login/register

### 3.2 API Key -- uwierzytelnianie zewnetrznych narzedzi

Uzywane przez MCP Server i ChatGPT Actions do dostepu do danych CRM
bez sesji uzytkownika. Klucz API jest powiazany z organizacja (nie z
uzytkownikiem).

**Format naglowka:**
```
Authorization: Bearer sk_live_<32 znaki base64url>
```

**Cykl zycia klucza:**
```
1. Admin/Owner tworzy klucz: POST /admin/mcp/api-keys
2. Serwer generuje: sk_live_<crypto.randomBytes(24).base64url>
3. Klucz hashowany SHA-256 i zapisany w mcp_api_keys.key_hash
4. Klucz zwracany RAZ -- nie da sie go odzyskac
5. Prefix (12 znakow) zapisany dla identyfikacji: mcp_api_keys.key_prefix
6. Przy uzyciu: hash requestowego klucza porownywany z key_hash
7. Dezaktywacja: POST /admin/mcp/api-keys/:id/revoke
```

**Walidacja w apiKeyGuard:**
1. Sprawdzenie obecnosci naglowka `Authorization: Bearer ...`
2. Hashowanie klucza: `SHA-256(apiKey)`
3. Wyszukanie rekordu `mcp_api_keys WHERE keyHash = hash`
4. Sprawdzenie `isActive = true`
5. Sprawdzenie `expiresAt` (jesli ustawione)
6. Przypisanie `req.mcpContext = { organization, apiKeyId }`
7. Asynchroniczna aktualizacja `lastUsedAt`

**Model bazy danych:**
```prisma
model mcp_api_keys {
  id             String    @id @default(uuid())
  keyHash        String    @unique @map("key_hash")
  keyPrefix      String    @map("key_prefix")
  name           String?
  isActive       Boolean   @default(true)
  organizationId String    @map("organization_id")
  createdById    String    @map("created_by_id")
  lastUsedAt     DateTime? @map("last_used_at")
  expiresAt      DateTime? @map("expires_at")
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization Organization @relation(...)
  createdBy    User         @relation(...)
  usageLogs    mcp_usage_logs[]
}
```

**Endpointy administracyjne (wymagaja ADMIN/OWNER):**
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/admin/mcp/api-keys` | Generuj nowy klucz |
| GET | `/admin/mcp/api-keys` | Lista kluczy organizacji |
| GET | `/admin/mcp/api-keys/:id` | Szczegoly klucza + statystyki |
| PATCH | `/admin/mcp/api-keys/:id` | Aktualizuj nazwe |
| DELETE | `/admin/mcp/api-keys/:id` | Usun klucz |
| POST | `/admin/mcp/api-keys/:id/revoke` | Dezaktywuj klucz |
| GET | `/admin/mcp/api-keys/:id/usage` | Historia uzycia |

**Pliki zrodlowe:**
- `/packages/backend/src/mcp-server/auth/api-key.guard.ts` -- middleware
- `/packages/backend/src/mcp-server/admin/api-keys.service.ts` -- serwis CRUD
- `/packages/backend/src/mcp-server/admin/api-keys.controller.ts` -- kontroler
- `/packages/backend/src/mcp-server/admin/routes.ts` -- routing

### 3.3 SSO (Single Sign-On) -- miedzy modulami platformy

SSO umozliwia uzytkownikowi zalogowanemu w jednym module Sorto
(np. CRM) przejscie do innego modulu (np. VerbaMind) bez ponownego
logowania.

**Przeplyw SSO:**
```
1. Uzytkownik (zalogowany w CRM) klika "Otworz VerbaMind"
2. CRM: POST /api/v1/auth/sso/token { moduleSlug: "verbamind" }
3. Backend generuje jednorazowy JWT (5 min):
     - payload: { userId, organizationId, moduleId, type: "sso" }
     - issuer: "sorto-platform", audience: moduleSlug
4. Token zapisany w tabeli sso_tokens (one-time use)
5. CRM redirectuje do: verbamind.url/auth/sso?token=<sso_token>
6. VerbaMind weryfikuje: POST platform/api/v1/auth/sso/verify
     - body: { token, clientId, clientSecret }
7. Platform zwraca: { valid: true, user, organization, modulePermissions }
8. VerbaMind tworzy lokalna sesje
```

**Endpointy SSO:**
| Metoda | Endpoint | Auth | Opis |
|--------|----------|------|------|
| POST | `/api/v1/auth/sso/token` | JWT | Generuj token SSO |
| POST | `/api/v1/auth/sso/verify` | clientId/Secret | Weryfikuj token (modul docelowy) |
| POST | `/api/v1/auth/sso/logout` | JWT | Uniewaznij sesje SSO |
| POST | `/api/v1/auth/sso/callback` | - | Odebierz token z platformy (CRM jako konsument) |

**SSO Callback (CRM jako konsument):**

Gdy CRM jest modulem docelowym, endpoint `/api/v1/auth/sso/callback`
odbiera token z platformy nadrzednej, weryfikuje go, a nastepnie:
- Tworzy organizacje jesli nie istnieje (na podstawie slug)
- Tworzy uzytkownika jesli nie istnieje (email verified = true)
- Generuje lokalna pare JWT tokenow CRM

**Pliki zrodlowe:**
- `/packages/backend/src/modules/auth/sso/sso.service.ts`
- `/packages/backend/src/modules/auth/sso/sso.controller.ts`
- `/packages/backend/src/modules/auth/sso/sso.routes.ts`
- `/packages/backend/src/modules/auth/sso-callback.ts`

---

## 4. Model User

```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String                        // bcrypt, 12 rounds
  firstName         String
  lastName          String
  avatar            String?
  role              UserRole  @default(MEMBER)     // OWNER|ADMIN|MANAGER|MEMBER|GUEST
  settings          Json      @default("{}")
  isActive          Boolean   @default(true)       // dezaktywacja zamiast usuwania
  emailVerified     Boolean   @default(false)
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  organizationId    String                         // FK -> organizations.id

  // Relacja
  organization      Organization @relation(...)

  // Powiazane zasoby
  refreshTokens         RefreshToken[]
  verificationTokens    VerificationToken[]
  mcp_api_keys          mcp_api_keys[]     @relation("McpKeyCreator")
  user_permissions      user_permissions[]
  stream_permissions    stream_permissions[]
  // ... (90+ relacji do pozostalych encji)
}
```

**Kluczowe pola:**
| Pole | Znaczenie |
|------|-----------|
| `email` | Unikalne globalnie -- identyfikator logowania |
| `passwordHash` | bcrypt, 12 rund (`BCRYPT_ROUNDS` z config) |
| `role` | Rola w organizacji (RBAC) |
| `isActive` | Soft-delete: `false` = konto nieaktywne |
| `emailVerified` | Czy email zostal potwierdzony tokenem |
| `organizationId` | Przypisanie do jednej organizacji (tenant) |
| `lastLoginAt` | Aktualizowany przy kazdym logowaniu |

---

## 5. Model Organization (tenant)

```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String                           // "Tech Solutions Sp. z o.o."
  slug      String   @unique                 // "tech-solutions" (URL-friendly)
  domain    String?  @unique                 // opcjonalna domena firmowa
  settings  Json     @default("{}")          // ustawienia organizacji
  limits    Json     @default("{}")          // limity zasobow
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Holding (multi-company)
  holdingId         String?
  holding           Holding?    @relation(...)
  companyType       CompanyType @default(OTHER)
  shortName         String?
  color             String      @default("#3b82f6")

  // Relacje: praktycznie KAZDA encja w systemie
  users             User[]
  streams           Stream[]
  tasks             Task[]
  projects          Project[]
  contacts          Contact[]
  companies         Company[]
  deals             Deal[]
  messages          Message[]
  mcp_api_keys      mcp_api_keys[]
  // ... (100+ relacji)
}
```

**Pole `limits` (JSON) -- przyklad:**
```json
{
  "max_users": 5,
  "max_streams": 3,
  "max_tasks_per_user": 100,
  "max_projects": 10,
  "max_storage_mb": 100
}
```

**Limity per plan subskrypcji:**
| Plan | Users | Streams | Tasks/user | Projects | Storage |
|------|-------|---------|------------|----------|---------|
| STARTER | 5 | 3 | 100 | 10 | 100 MB |
| PROFESSIONAL | 25 | 15 | 1000 | 100 | 1 GB |
| ENTERPRISE | -1 (bez limitu) | -1 | -1 | -1 | 10 GB |

**Model subskrypcji:**
```prisma
model Subscription {
  id                   String             @id @default(uuid())
  organizationId       String
  stripeCustomerId     String?
  stripeSubscriptionId String?
  plan                 SubscriptionPlan   @default(STARTER)
  status               SubscriptionStatus @default(TRIAL)
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
}
```

Przy rejestracji nowej organizacji automatycznie tworzony jest okres
probny (TRIAL) na 14 dni.

---

## 6. Izolacja danych -- multi-tenancy

### 6.1 Warstwa aplikacyjna (Prisma ORM)

**Kazde zapytanie do bazy jest ograniczone do organizacji zalogowanego
uzytkownika.** Wzorzec stosowany konsekwentnie we wszystkich route
handlerach:

```typescript
// Typowy route handler
router.get('/', authenticateToken, async (req, res) => {
  const { organizationId } = req.user!;

  const items = await prisma.entity.findMany({
    where: { organizationId },  // <-- izolacja na poziomie zapytania
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: items });
});
```

Ten wzorzec powtarza sie w 75+ endpointach. Nie istnieje droga aby
uzytkownik z organizacji A zobaczyl dane organizacji B, poniewaz
`organizationId` pochodzi z zweryfikowanego tokenu JWT (nie z
parametrow requestu).

### 6.2 Warstwa bazodanowa (PostgreSQL RLS context)

Oprócz filtrowania na poziomie Prisma, middleware `authenticateToken`
ustawia kontekst PostgreSQL Row-Level Security:

```typescript
// W authenticateToken:
await prisma.$executeRaw`
  SELECT set_config('app.current_org_id', ${user.organizationId}::text, true)
`;
```

Pozwala to na dodatkowa warstwe ochrony na poziomie bazy danych --
nawet gdyby developer zapominal dodac `WHERE organizationId = ...`
w zapytaniu, polityka RLS odrzuci wiersze nalezace do innej organizacji.

### 6.3 Klucz obcy organizationId

Praktycznie kazda tabela biznesowa posiada kolumne `organizationId`
z FK na `organizations.id`:

```
organizations
  |
  +-- users           (organizationId FK, ON DELETE CASCADE)
  +-- tasks           (organizationId FK)
  +-- projects        (organizationId FK)
  +-- streams         (organizationId FK)
  +-- contacts        (organizationId FK)
  +-- companies       (organizationId FK)
  +-- deals           (organizationId FK)
  +-- messages        (organizationId FK)
  +-- documents       (organizationId FK)
  +-- mcp_api_keys    (organization_id FK, ON DELETE CASCADE)
  +-- unified_rules   (organizationId FK)
  +-- ai_providers    (organizationId FK)
  +-- ai_rules        (organizationId FK)
  +-- ... (100+ tabel)
```

### 6.4 Izolacja w MCP / ChatGPT Actions

Dla zapytan autoryzowanych kluczem API (bez sesji uzytkownika),
organizacja pobierana jest z `mcpContext.organization`:

```typescript
// W MCP server controller:
const org = mcpReq.mcpContext.organization;
const organizationId = org.id;

// Zapytania do bazy filtrowane identycznie
const contacts = await prisma.contact.findMany({
  where: { organizationId },
});
```

### 6.5 Holding (multi-company)

Na wyzszym poziomie organizacje moga byc grupowane w holding:

```
Holding (np. "Grupa Sorto")
  |
  +-- Organization A (type: PRODUCTION)
  +-- Organization B (type: SALES)
  +-- Organization C (type: SERVICES)
```

Model `Holding` (`holdings`) posiada relacje do wielu organizacji
przez `Organization.holdingId`. Umozliwia to scenariusze
korporacyjne z wieloma spolkami.

---

## 7. Role i kontrola dostepu (RBAC)

### 7.1 Role uzytkownikow

```prisma
enum UserRole {
  OWNER     // Wlasciciel organizacji (pelne uprawnienia)
  ADMIN     // Administrator (zarzadzanie uzytkownikami, ustawieniami)
  MANAGER   // Menedzer (zarzadzanie zespolem, projektami)
  MEMBER    // Czlonek (standardowy dostep)
  GUEST     // Gosc (ograniczony dostep)
}
```

**Hierarchia uprawnien:**
```
OWNER > ADMIN > MANAGER > MEMBER > GUEST
```

### 7.2 Middleware requireRole

```typescript
export const requireRole = (roles: string | string[]) => {
  return (req, res, next) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role,
      });
    }
    next();
  };
};
```

**Przykladowe uzycie w routach:**
```typescript
// Zapraszanie uzytkownikow -- tylko ADMIN i OWNER
router.post('/invite',
  authenticateToken,
  requireRole(['ADMIN', 'OWNER']),
  checkOrganizationLimits('users'),
  authController.inviteUser
);

// Zarzadzanie kluczami API -- tylko ADMIN i OWNER
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'OWNER']));
router.post('/', apiKeysController.createKey);
```

### 7.3 Uprawnienia per-stream

Model `stream_permissions` zapewnia szczegolowa kontrole dostepu
do poszczegolnych streamow GTD:

```prisma
model stream_permissions {
  id          String
  streamId    String?
  userId      String
  accessLevel AccessLevel    // NO_ACCESS..FULL_CONTROL
  dataScope   DataScope[]    // BASIC_INFO, TASKS, PROJECTS, etc.
  conditions  Json?
  expiresAt   DateTime?
  isActive    Boolean        @default(true)
  grantedById String
  organizationId String
}
```

**Poziomy dostepu (AccessLevel):**
```
NO_ACCESS < READ_ONLY < LIMITED < CONTRIBUTOR < COLLABORATOR < MANAGER < ADMIN < FULL_CONTROL
```

**Zakresy danych (DataScope):**
```
BASIC_INFO | TASKS | PROJECTS | FINANCIAL | METRICS
COMMUNICATION | PERMISSIONS | CONFIGURATION | AUDIT_LOGS
```

### 7.4 Uprawnienia per-uzytkownik (relacje miedzyludzkie)

Model `user_permissions` kontroluje co menedzer moze robic z danymi
podleglego pracownika:

```prisma
model user_permissions {
  id          String
  relationId  String         // FK -> user_relations
  dataScope   UserDataScope  // PROFILE, TASKS, PROJECTS, etc.
  action      UserAction     // VIEW, EDIT, CREATE, DELETE, etc.
  granted     Boolean
  expiresAt   DateTime?
  organizationId String
}
```

**Dostepne akcje (UserAction):**
```
VIEW | EDIT | CREATE | DELETE | ASSIGN | APPROVE | DELEGATE | MANAGE | AUDIT
```

**Zakresy (UserDataScope):**
```
PROFILE | TASKS | PROJECTS | SCHEDULE | PERFORMANCE
DOCUMENTS | COMMUNICATION | SETTINGS | TEAM_DATA | REPORTS | ALL
```

### 7.5 SSO Module Permissions

Przy weryfikacji tokenu SSO zwracane sa rowniez uprawnienia
specyficzne dla modulu docelowego:

```typescript
modulePermissions: {
  canRead: true,                                          // wszyscy
  canWrite: user.role === 'ADMIN' || user.role === 'OWNER', // admin+
  canAdmin: user.role === 'OWNER',                        // tylko owner
}
```

---

## 8. Lancuch auth middleware -- szczegolowy przeplyw

### 8.1 authenticateToken (JWT)

```
1. Pobranie tokenu z naglowka: Authorization: Bearer <token>
2. jwt.verify(token, JWT_SECRET) -> JWTPayload
3. prisma.user.findUnique({ id: payload.userId, isActive: true })
   + include: { organization: true }
4. Sprawdzenie: user istnieje i jest aktywny
5. Sprawdzenie: organization istnieje
6. Przypisanie req.user = { id, email, role, organizationId, firstName, lastName }
7. Przypisanie req.organization = { id, name, slug, limits }
8. Ustawienie RLS: set_config('app.current_org_id', orgId)
9. next()

BLEDY:
- Brak tokenu          -> 401 MISSING_TOKEN
- Nieprawidlowy token  -> 401 INVALID_TOKEN
- Token wygasl         -> 401 TOKEN_EXPIRED
- User nie znaleziony  -> 401 USER_NOT_FOUND
- Brak organizacji     -> 401 ORG_NOT_FOUND
- Blad serwera         -> 500 AUTH_ERROR
```

### 8.2 optionalAuth

Dziala identycznie jak `authenticateToken`, ale:
- Jesli token jest nieprawidlowy lub brak tokenu -- nie zwraca bledu
- Ustawia `req.user` i `req.organization` jesli token jest poprawny
- Wywoluje `next()` niezaleznie od wyniku
- Uzycie: endpointy dostepne publicznie, ale z dodatkowymi danymi dla
  zalogowanych uzytkownikow

### 8.3 checkOrganizationLimits

Sprawdza limity zasobow organizacji przed operacja tworzenia:

```typescript
checkOrganizationLimits('users')   // max_users
checkOrganizationLimits('streams') // max_streams
checkOrganizationLimits('tasks')   // max_tasks_per_user (per user!)
checkOrganizationLimits('projects') // max_projects
```

Jesli limit osiagniety -> 403 z kodem `RESOURCE_LIMIT_REACHED`.

---

## 9. Endpointy autentykacji

### 9.1 Publiczne (bez uwierzytelniania)

| Metoda | Endpoint | Rate limit | Opis |
|--------|----------|------------|------|
| POST | `/api/v1/auth/register` | strict (5/15min) | Rejestracja org + owner |
| POST | `/api/v1/auth/login` | strict (5/15min) | Logowanie |
| POST | `/api/v1/auth/refresh` | user | Odswiezanie tokenow |
| POST | `/api/v1/auth/accept-invitation` | strict | Akceptacja zaproszenia |
| POST | `/api/v1/auth/verify-email` | user | Weryfikacja email |
| POST | `/api/v1/auth/password-reset/request` | strict | Zadanie resetu hasla |
| POST | `/api/v1/auth/password-reset/confirm` | strict | Potwierdzenie resetu |

### 9.2 Wymagajace uwierzytelniania (JWT)

| Metoda | Endpoint | Rola | Opis |
|--------|----------|------|------|
| GET | `/api/v1/auth/me` | dowolna | Profil zalogowanego usera |
| POST | `/api/v1/auth/logout` | dowolna | Wylogowanie (invalidacja refresh) |
| POST | `/api/v1/auth/change-password` | dowolna | Zmiana hasla |
| POST | `/api/v1/auth/resend-verification` | dowolna | Ponowne wyslanie maila |
| POST | `/api/v1/auth/invite` | ADMIN/OWNER | Zaproszenie uzytkownika |

### 9.3 Przeplyw rejestracji

```
POST /api/v1/auth/register
{
  organizationName: "Moja Firma",
  firstName: "Jan",
  lastName: "Kowalski",
  email: "jan@mojafirma.pl",
  password: "Haslo123!",
  confirmPassword: "Haslo123!",
  acceptTerms: true,
  subscriptionPlan: "STARTER"  // opcjonalne
}

Serwer:
1. Sprawdza unikalnosc email
2. Generuje slug organizacji: "moja-firma" (unikalny)
3. Hashuje haslo: bcrypt(password, 12 rounds)
4. Transakcja:
   a) Tworzy Organization (limits = TIER_LIMITS[STARTER])
   b) Tworzy Subscription (status = TRIAL, 14 dni)
   c) Tworzy User (role = OWNER, emailVerified = false)
5. Generuje pare JWT tokenow
6. Tworzy VerificationToken (24h)
7. Wysyla email powitalny z linkiem weryfikacyjnym
8. Zwraca: { user, organization, tokens }
```

### 9.4 Przeplyw zaproszenia uzytkownika

```
POST /api/v1/auth/invite (ADMIN/OWNER)
{
  email: "anna@firma.pl",
  firstName: "Anna",
  lastName: "Nowak",
  role: "MEMBER"
}

Serwer:
1. Sprawdza czy user nie istnieje w tej organizacji
2. Sprawdza limit uzytkownikow
3. Tworzy User (isActive = false, passwordHash = invitationToken)
4. Wysyla email z linkiem zaproszenia (7 dni)

POST /api/v1/auth/accept-invitation
{
  token: "<invitation_token>",
  password: "Haslo123!",
  confirmPassword: "Haslo123!"
}

Serwer:
1. Znajduje usera po tokenie
2. Hashuje haslo, aktywuje konto (isActive = true)
3. Generuje pare JWT tokenow
```

---

## 10. Walidacja danych wejsciowych

Wszystkie endpointy auth uzywaja walidacji Zod (`validateRequest`):

**Haslo -- wymagania:**
- Minimum 8 znakow
- Maksimum 128 znakow
- Przynajmniej 1 mala litera, 1 wielka, 1 cyfra
- Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)`

**Email:**
- Format email (Zod `.email()`)
- Automatyczna konwersja na lowercase i trim

**Nazwa organizacji:**
- 2-100 znakow
- Dozwolone: litery, cyfry, spacje, `-_.`

**Pliki zrodlowe:**
- `/packages/backend/src/modules/auth/schemas.ts`

---

## 11. Rate limiting

System posiada 5 rodzajow rate limitingu:

| Typ | Okno | Max req | Klucz | Uzycie |
|-----|------|---------|-------|--------|
| `generalRateLimit` | 15 min | 500 | IP | Globalny |
| `userRateLimit` | 15 min | 2000 | userId / IP | Endpointy user |
| `apiRateLimit` | 15 min | 500-2000 | userId / IP | API dynamiczny |
| `strictRateLimit` | 15 min | 5 | IP | Login, register, reset |
| `organizationRateLimit` | 15 min | custom | orgId | Per-organizacja |

Rate limiting uzywa in-memory store (Map) z automatycznym
czyszczeniem co minute. Nie wymaga Redis.

**Pliki zrodlowe:**
- `/packages/backend/src/shared/middleware/rateLimit.ts`

---

## 12. Zarzadzanie sesjami

### 12.1 Refresh Tokens

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique       // UUID v4
  userId    String
  expiresAt DateTime               // +7 dni od utworzenia
  createdAt DateTime @default(now())
  user      User     @relation(...)
}
```

**Operacje na refresh tokenach:**
- `generateTokenPair()` -- tworzy nowy refresh token w bazie
- `verifyRefreshToken()` -- weryfikuje i pobiera dane usera
- `invalidateRefreshToken()` -- usuwa token (logout, rotacja)
- `invalidateAllUserTokens()` -- usuwa wszystkie tokeny usera
  (zmiana hasla, reset, bezpieczenstwo)
- `cleanupExpiredTokens()` -- periodyczne czyszczenie wygaslych

### 12.2 Verification Tokens

```prisma
model VerificationToken {
  id        String                @id @default(uuid())
  token     String                @unique    // crypto.randomBytes(32).hex
  type      VerificationTokenType             // EMAIL_VERIFICATION | PASSWORD_RESET | INVITATION
  userId    String
  expiresAt DateTime
  usedAt    DateTime?                         // null = nieuzyte
  createdAt DateTime              @default(now())
}
```

**Czasy wygasania:**
| Typ | Czas |
|-----|------|
| EMAIL_VERIFICATION | 24 godziny |
| PASSWORD_RESET | 1 godzina |
| INVITATION | 7 dni |

Tokeny sa jednorazowe -- pole `usedAt` ustawiane po uzyciu.
Stare tokeny tego samego typu sa uniewazniane przed wygenerowaniem
nowych.

### 12.3 SSO Tokens

```
- Czas zycia: 5 minut
- Jednorazowe (isUsed = true po weryfikacji)
- Przechowywane w tabeli sso_tokens
- Czyszczenie wygaslych (> 1h) uruchamiane periodycznie
```

---

## 13. Bezpieczenstwo -- uwagi implementacyjne

### 13.1 Ochrona hasel
- **bcrypt** z 12 rundami (konfigurowalny przez `BCRYPT_ROUNDS`)
- Hasla nigdy nie sa przechowywane w plaintext
- Przy zaproszeniu: tymczasowy token zamiast hasla (isActive = false)

### 13.2 Ochrona przed enumeracja
- Endpoint `password-reset/request` **zawsze** zwraca 200 OK
  z komunikatem "If the email exists..." -- zapobiega odkryciu
  czy dany email istnieje w systemie

### 13.3 Rotacja tokenow
- Przy odswiezaniu sesji stary refresh token jest usuwany
- Przy zmianie hasla **wszystkie** refresh tokeny uzytkownika sa
  uniewazniane

### 13.4 JWT Security
- `JWT_SECRET` wymaga minimum 32 znakow (walidacja Zod przy starcie)
- Oddzielny `JWT_REFRESH_SECRET` (nie uzywany w obecnej implementacji --
  refresh tokeny to UUID w bazie, nie JWT)
- Issuer i audience weryfikowane w `jwt.verify()`

### 13.5 API Key Security
- Klucze generowane z `crypto.randomBytes(24)` (192 bity entropii)
- Przechowywane wylacznie jako hash SHA-256
- Klucz zwracany uzytkownikowi **tylko raz** przy tworzeniu
- Prefix (12 znakow) do identyfikacji bez ujawniania klucza
- Mozliwosc natychmiastowej dezaktywacji (revoke)
- Opcjonalna data wygasniecia

### 13.6 Rate limiting na endpointach auth
- Login: 5 prob / 15 minut / IP (strict)
- Register: 5 prob / 15 minut / IP (strict)
- Password reset: 5 prob / 15 minut / IP (strict)
- Zapobiega brute-force i credential stuffing

### 13.7 CORS
- Produkcja: ograniczone do domeny aplikacji
- Development: dodatkowe dozwolone originy (localhost, siec LAN)
- Konfiguracja w `/packages/backend/src/config/index.ts`

### 13.8 Walidacja wejsc
- Wszystkie dane wejsciowe walidowane przez Zod przed przetworzeniem
- Regex na polach tekstowych (imie, nazwa org) zapobiega injection
- Email automatycznie normalizowany (lowercase, trim)

---

## 14. Pliki zrodlowe -- indeks

| Sciezka | Opis |
|---------|------|
| `packages/backend/src/shared/middleware/auth.ts` | Middleware: authenticateToken, requireRole, checkOrganizationLimits, optionalAuth |
| `packages/backend/src/shared/utils/jwt.ts` | Generowanie i weryfikacja JWT, refresh token CRUD |
| `packages/backend/src/shared/middleware/rateLimit.ts` | Rate limiting (5 typow) |
| `packages/backend/src/modules/auth/routes.ts` | Routing endpointow auth |
| `packages/backend/src/modules/auth/controller.ts` | Kontroler auth |
| `packages/backend/src/modules/auth/service.ts` | Serwis auth (register, login, invite, verify, reset) |
| `packages/backend/src/modules/auth/schemas.ts` | Schematy walidacji Zod |
| `packages/backend/src/modules/auth/sso/sso.service.ts` | Serwis SSO (generate, verify, invalidate) |
| `packages/backend/src/modules/auth/sso/sso.controller.ts` | Kontroler SSO |
| `packages/backend/src/modules/auth/sso/sso.routes.ts` | Routing SSO |
| `packages/backend/src/modules/auth/sso-callback.ts` | SSO callback (CRM jako konsument) |
| `packages/backend/src/mcp-server/auth/api-key.guard.ts` | Middleware API Key |
| `packages/backend/src/mcp-server/admin/api-keys.service.ts` | Serwis zarzadzania kluczami API |
| `packages/backend/src/mcp-server/admin/api-keys.controller.ts` | Kontroler kluczy API |
| `packages/backend/src/mcp-server/admin/routes.ts` | Routing admin kluczy API |
| `packages/backend/src/mcp-server/routes.ts` | Routing MCP (tools/list, tools/call) |
| `packages/backend/src/mcp-server/types/mcp.types.ts` | Typy MCP (McpRequest, McpRequestContext) |
| `packages/backend/src/config/index.ts` | Konfiguracja (JWT_SECRET, limity, CORS) |
| `packages/backend/src/shared/middleware/__tests__/auth.test.ts` | Testy middleware auth |
| `packages/backend/prisma/schema.prisma` | Modele: User, Organization, RefreshToken, VerificationToken, mcp_api_keys, user_permissions, stream_permissions, Subscription, Holding |
