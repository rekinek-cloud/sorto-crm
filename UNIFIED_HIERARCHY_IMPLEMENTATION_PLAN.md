# 🏗️ Plan Implementacji: Hierarchia Strumieni + Hierarchia Użytkowników + Kontrola Dostępu

## 📋 **ROZSZERZONY PLAN IMPLEMENTACJI - 42 zadania**

### 🎯 **FAZA 1: FUNDAMENT BAZY DANYCH (HIGH PRIORITY - 11 zadań)**

#### **Analiza i planowanie:**
1. ✅ **Analiza aktualnej struktury modelu Stream i planowanie rozszerzeń** [IN_PROGRESS]
2. ✅ **Analiza aktualnej struktury modelu User i planowanie hierarchii użytkowników**

#### **Modele hierarchii:**
3. ✅ **Implementacja modelu StreamRelation do obsługi hierarchii strumieni**
4. ✅ **Implementacja modelu UserRelation do obsługi hierarchii użytkowników**
5. ✅ **Definicja enum StreamRelationType (OWNS, MANAGES, BELONGS_TO, etc.)**
6. ✅ **Definicja enum UserRelationType (REPORTS_TO, MANAGES, SUPERVISES, etc.)**

#### **Migracje bazy danych:**
7. ✅ **Migracja bazy danych - dodanie tabel dla hierarchii strumieni**
8. ✅ **Migracja bazy danych - dodanie tabel dla hierarchii użytkowników**

#### **Modele kontroli dostępu:**
9. ✅ **Implementacja modeli kontroli dostępu strumieni (StreamPermission, AccessLevel, DataScope)**
10. ✅ **Implementacja modeli kontroli dostępu użytkowników (UserPermission, UserAccessLevel, UserDataScope)**
11. ✅ **Implementacja modelu UserSubstitution dla zastępstw i delegacji**

### ⚙️ **FAZA 2: BACKEND SERVICES (MEDIUM PRIORITY - 10 zadań)**

#### **Services hierarchii:**
12. **Backend service dla operacji na hierarchii strumieni**
13. **Backend service dla operacji na hierarchii użytkowników**
14. **Backend service do sprawdzania uprawnień i kontroli dostępu strumieni**
15. **Backend service do sprawdzania uprawnień i kontroli dostępu użytkowników**
16. **Backend service do zarządzania zastępstwami i automatycznymi delegacjami**

#### **API endpoints:**
17. **API endpoints dla zarządzania hierarchią strumieni**
18. **API endpoints dla zarządzania hierarchią użytkowników**
19. **API endpoints dla kontroli dostępu i uprawnień strumieni**
20. **API endpoints dla kontroli dostępu i uprawnień użytkowników**
21. **API endpoints dla zarządzania zastępstwami użytkowników**

### 🎨 **FAZA 3: FRONTEND UI (MEDIUM PRIORITY - 8 zadań)**

#### **Wizualizacje hierarchii:**
22. **Frontend - wizualizacja hierarchii strumieni (drzewo, graf)**
23. **Frontend - wizualizacja hierarchii użytkowników/zespołów (orgchart)**

#### **Interfejsy zarządzania:**
24. **Frontend - interfejs zarządzania uprawnieniami strumieni**
25. **Frontend - interfejs zarządzania uprawnieniami użytkowników**
26. **Frontend - dashboard zastępstw i delegacji użytkowników**

#### **Formularze:**
27. **Frontend - formularz tworzenia/edycji relacji między strumieniami**
28. **Frontend - formularz tworzenia/edycji relacji między użytkownikami**

### 🔧 **FAZA 4: ZAAWANSOWANE FUNKCJE (LOW PRIORITY - 13 zadań)**

#### **Logika automatyzacji:**
29. **Implementacja logiki dziedziczenia uprawnień w hierarchii strumieni**
30. **Implementacja logiki dziedziczenia uprawnień w hierarchii użytkowników**
31. **Implementacja automatycznej delegacji zadań podczas zastępstw**
32. **Implementacja automatycznej eskalacji zatwierdzeń w hierarchii**

#### **Systemy audytu:**
33. **System audytu dostępów do strumieni (logi, śledzenie)**
34. **System audytu dostępów do danych użytkowników (logi, śledzenie)**

#### **Testy:**
35. **Testy jednostkowe i integracyjne dla hierarchii strumieni**
36. **Testy jednostkowe i integracyjne dla hierarchii użytkowników**
37. **Testy bezpieczeństwa i kontroli dostępu strumieni**
38. **Testy bezpieczeństwa i kontroli dostępu użytkowników**
39. **Testy systemu zastępstw i automatycznych delegacji**

#### **Dane testowe i optymalizacja:**
40. **Seed data - przykładowe hierarchie strumieni do testowania**
41. **Seed data - przykładowe hierarchie użytkowników/zespołów do testowania**
42. **Optymalizacja wydajności zapytań hierarchicznych (indeksy, cache)**

#### **Dokumentacja:**
43. **Dokumentacja systemu hierarchii i kontroli dostępu strumieni**
44. **Dokumentacja systemu hierarchii użytkowników i zastępstw**

## 🏗️ **SZCZEGÓŁOWA ARCHITEKTURA - ROZSZERZONA**

### **Modele bazy danych:**

```prisma
// ===============================================
// HIERARCHIA STRUMIENI
// ===============================================

model Stream {
  id          String      @id @default(uuid())
  name        String
  description String?
  color       String      @default("#3B82F6")
  icon        String?
  settings    Json        @default("{}")
  status      StreamStatus @default(ACTIVE)
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  createdById String
  createdBy   User   @relation("StreamCreator", fields: [createdById], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 🔄 HIERARCHIA - NOWE
  parentRelations StreamRelation[] @relation("ParentStream")
  childRelations  StreamRelation[] @relation("ChildStream")
  
  // Audit logs
  accessLogs      StreamAccessLog[]

  // Relations (existing)
  tasks       Task[]
  projects    Project[]
  timeline    Timeline[]
  streamChannels StreamChannel[]
  messages    Message[]
  recurringTasks RecurringTask[]

  @@map("streams")
}

model StreamRelation {
  id          String @id @default(uuid())
  
  parentId    String
  parent      Stream @relation("ParentStream", fields: [parentId], references: [id], onDelete: Cascade)
  
  childId     String  
  child       Stream @relation("ChildStream", fields: [childId], references: [id], onDelete: Cascade)
  
  relationType StreamRelationType
  description String?
  
  // 🔐 KONTROLA DOSTĘPU
  accessLevel     AccessLevel @default(READ_ONLY)
  isSymmetric     Boolean @default(false)
  inheritanceRule InheritanceRule @default(NO_INHERITANCE)
  
  // Ograniczenia czasowe
  validFrom       DateTime?
  validUntil      DateTime?
  
  // Granularne uprawnienia
  permissions     StreamPermission[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  createdBy   User @relation("StreamRelationCreator", fields: [createdById], references: [id])
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([parentId, childId, relationType])
  @@map("stream_relations")
}

model StreamPermission {
  id          String @id @default(uuid())
  
  relationId  String
  relation    StreamRelation @relation(fields: [relationId], references: [id], onDelete: Cascade)
  
  dataScope   DataScope
  action      PermissionAction
  granted     Boolean @default(true)
  
  // Warunki dostępu
  conditions  Json @default("{}")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([relationId, dataScope, action])
  @@map("stream_permissions")
}

model StreamAccessLog {
  id          String @id @default(uuid())
  
  userId      String
  user        User @relation("StreamAccessUser", fields: [userId], references: [id])
  
  streamId    String
  stream      Stream @relation(fields: [streamId], references: [id])
  
  action      PermissionAction
  dataScope   DataScope
  granted     Boolean
  
  // Access context
  via         String?
  relationId  String?
  
  // Technical details
  ipAddress   String?
  userAgent   String?
  endpoint    String?
  
  createdAt   DateTime @default(now())
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation("StreamAccessOrg", fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@map("stream_access_logs")
}

// ===============================================
// HIERARCHIA UŻYTKOWNIKÓW
// ===============================================

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  passwordHash   String
  firstName      String
  lastName       String
  avatar         String?
  role           UserRole  @default(MEMBER)
  settings       Json      @default("{}")
  isActive       Boolean   @default(true)
  emailVerified  Boolean   @default(false)
  lastLoginAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // 🔄 HIERARCHIA UŻYTKOWNIKÓW - NOWE
  managerRelations     UserRelation[] @relation("ManagerUser")
  subordinateRelations UserRelation[] @relation("SubordinateUser")
  
  // Zastępstwa
  primarySubstitutions   UserSubstitution[] @relation("PrimaryUser")
  substituteAssignments  UserSubstitution[] @relation("SubstituteUser")
  
  // Audit logs
  accessLogs             UserAccessLog[] @relation("AccessingUser")
  targetAccessLogs       UserAccessLog[] @relation("TargetUser")

  // Relations (existing)
  createdTasks     Task[]     @relation("TaskCreator")
  assignedTasks    Task[]     @relation("TaskAssignee")
  createdProjects  Project[]  @relation("ProjectCreator")
  assignedProjects Project[]  @relation("ProjectAssignee")
  createdStreams   Stream[]   @relation("StreamCreator")
  streamAccessLogs StreamAccessLog[] @relation("StreamAccessUser")
  streamRelations  StreamRelation[] @relation("StreamRelationCreator")
  ownedDeals       Deal[]     @relation("DealOwner")
  // ... other existing relations

  @@map("users")
}

model UserRelation {
  id          String @id @default(uuid())
  
  managerId    String
  manager      User @relation("ManagerUser", fields: [managerId], references: [id], onDelete: Cascade)
  
  subordinateId String  
  subordinate   User @relation("SubordinateUser", fields: [subordinateId], references: [id], onDelete: Cascade)
  
  relationType UserRelationType
  description String?
  
  // 🔐 KONTROLA DOSTĘPU
  accessLevel     UserAccessLevel @default(LIMITED)
  isSymmetric     Boolean @default(false)
  inheritanceRule InheritanceRule @default(INHERIT_DOWN)
  
  // Ograniczenia czasowe i kontekstowe
  validFrom       DateTime?
  validUntil      DateTime?
  workingHours    Json?      // { "monday": "09:00-17:00", ... }
  locations       String[]   // geograficzne ograniczenia
  
  // Granularne uprawnienia
  permissions     UserPermission[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  createdBy   User @relation("UserRelationCreator", fields: [createdById], references: [id])
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([managerId, subordinateId, relationType])
  @@map("user_relations")
}

model UserPermission {
  id          String @id @default(uuid())
  
  relationId  String
  relation    UserRelation @relation(fields: [relationId], references: [id], onDelete: Cascade)
  
  dataScope   UserDataScope
  action      PermissionAction
  granted     Boolean @default(true)
  
  // Warunki dostępu
  conditions  Json @default("{}")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([relationId, dataScope, action])
  @@map("user_permissions")
}

model UserSubstitution {
  id          String @id @default(uuid())
  
  primaryUserId String
  primaryUser   User @relation("PrimaryUser", fields: [primaryUserId], references: [id])
  
  substituteUserId String
  substituteUser   User @relation("SubstituteUser", fields: [substituteUserId], references: [id])
  
  reason      SubstitutionReason
  validFrom   DateTime
  validUntil  DateTime
  isActive    Boolean @default(true)
  
  // Zakres zastępstwa
  includeApprovals Boolean @default(false)
  includeTasks     Boolean @default(true)
  includeReports   Boolean @default(false)
  includeTeamAccess Boolean @default(false)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  createdBy   User @relation("SubstitutionCreator", fields: [createdById], references: [id])
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@map("user_substitutions")
}

model UserAccessLog {
  id          String @id @default(uuid())
  
  accessingUserId String
  accessingUser   User @relation("AccessingUser", fields: [accessingUserId], references: [id])
  
  targetUserId    String
  targetUser      User @relation("TargetUser", fields: [targetUserId], references: [id])
  
  action      PermissionAction
  dataScope   UserDataScope
  granted     Boolean
  
  // Access context
  via         String?  // ID użytkownika przez którego uzyskano dostęp
  relationId  String?  // ID relacji przez którą uzyskano dostęp
  substitutionId String? // ID zastępstwa jeśli applicable
  
  // Technical details
  ipAddress   String?
  userAgent   String?
  endpoint    String?
  
  createdAt   DateTime @default(now())
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation("UserAccessOrg", fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@map("user_access_logs")
}

// ===============================================
// ENUMS - ROZSZERZONE
// ===============================================

enum StreamRelationType {
  OWNS          // posiada - pełny dostęp
  MANAGES       // zarządza - dostęp operacyjny
  BELONGS_TO    // należy do - ograniczony dostęp
  RELATED_TO    // powiązany - podstawowy dostęp
  DEPENDS_ON    // zależy od - dostęp tylko do potrzebnych danych
  SUPPORTS      // wspiera - dostęp wsparcia
}

enum UserRelationType {
  REPORTS_TO        // raportuje do (podwładny → przełożony)
  MANAGES           // zarządza (przełożony → podwładny)  
  SUPERVISES        // nadzoruje (senior → junior)
  DELEGATES_TO      // deleguje do (busy manager → assistant)
  ASSISTS           // asystuje (assistant → executive)
  COLLABORATES_WITH // współpracuje z (peer-to-peer)
  MENTORS           // mentoruje (mentor → mentee)
  COORDINATES_WITH  // koordynuje z (project coordination)
}

enum AccessLevel {
  NO_ACCESS     // brak dostępu
  READ_ONLY     // tylko odczyt podstawowych danych
  LIMITED       // odczyt + ograniczone operacje
  OPERATIONAL   // pełny dostęp operacyjny  
  MANAGEMENT    // dostęp zarządczy
  FULL_CONTROL  // pełna kontrola
}

enum UserAccessLevel {
  NO_ACCESS         // brak dostępu
  VIEW_ONLY         // tylko podgląd podstawowych danych
  LIMITED           // ograniczony dostęp (własne zadania + zespół)
  TEAM_ACCESS       // dostęp do całego zespołu
  DEPARTMENTAL      // dostęp do departamentu
  CROSS_DEPARTMENTAL // dostęp między departamentami
  EXECUTIVE         // dostęp zarządczy
  FULL_CONTROL      // pełna kontrola
}

enum DataScope {
  BASIC_INFO    // podstawowe informacje
  TASKS         // zadania
  PROJECTS      // projekty  
  FINANCIAL     // dane finansowe
  CONTACTS      // kontakty
  COMMUNICATIONS // komunikacja
  TIMELINE      // historia
  SETTINGS      // ustawienia
  USERS         // użytkownicy
  ANALYTICS     // analityka
  ALL           // wszystkie dane
}

enum UserDataScope {
  BASIC_PROFILE     // podstawowe dane profilu
  CONTACT_INFO      // informacje kontaktowe
  TASKS             // zadania użytkownika
  PROJECTS          // projekty użytkownika
  CALENDAR          // kalendarz i spotkania
  REPORTS           // raporty i metryki
  TEAM_DATA         // dane zespołu
  FINANCIAL         // dane finansowe (pensje, budżety)
  SETTINGS          // ustawienia i preferencje
  AUDIT_LOGS        // logi aktywności
  ALL               // wszystkie dane
}

enum PermissionAction {
  READ          // odczyt
  CREATE        // tworzenie  
  UPDATE        // edycja
  DELETE        // usuwanie
  MANAGE        // zarządzanie (assign, delegate)
  APPROVE       // zatwierdzanie
  AUDIT         // audyt/logi
}

enum InheritanceRule {
  NO_INHERITANCE        // brak dziedziczenia
  INHERIT_DOWN          // dziedzicz w dół hierarchii  
  INHERIT_UP            // dziedzicz w górę hierarchii
  INHERIT_BIDIRECTIONAL // dziedzicz w obie strony
}

enum SubstitutionReason {
  VACATION          // urlop
  SICK_LEAVE        // choroba
  BUSINESS_TRIP     // delegacja
  TRAINING          // szkolenie
  TEMPORARY_ASSIGNMENT // tymczasowe przypisanie
  EMERGENCY         // sytuacja awaryjna
  OTHER             // inne przyczyny
}

// ===============================================
// ROZSZERZENIE ORGANIZATION
// ===============================================

model Organization {
  // ... existing fields
  
  // NOWE relacje
  streamRelations    StreamRelation[]
  streamAccessLogs   StreamAccessLog[] @relation("StreamAccessOrg")
  userRelations      UserRelation[]
  userSubstitutions  UserSubstitution[]
  userAccessLogs     UserAccessLog[] @relation("UserAccessOrg")
}
```

## 🚀 **Rozszerzony Timeline:**
- **Faza 1**: ~8-12 godzin (fundament obu systemów hierarchii)
- **Faza 2**: ~12-16 godzin (backend logic dla obu systemów)  
- **Faza 3**: ~10-14 godzin (frontend UI dla obu systemów)
- **Faza 4**: ~8-12 godzin (zaawansowane funkcje i optymalizacja)

**Łącznie**: ~38-54 godzin pracy

## 🎯 **Przykłady końcowych możliwości:**

### **Scenariusz 1: Nieruchomość + Zespół zarządzający**
```javascript
// 1. Hierarchia strumieni
await createStreamRelation({
  parentId: "firma-abc-id",
  childId: "nieruchomosc-id", 
  relationType: "OWNS"
});

// 2. Hierarchia użytkowników
await createUserRelation({
  managerId: "alice-property-manager-id",
  subordinateId: "bob-facility-manager-id",
  relationType: "MANAGES",
  accessLevel: "TEAM_ACCESS"
});

// 3. Zastępstwo podczas urlopu
await createSubstitution({
  primaryUserId: "alice-property-manager-id",
  substituteUserId: "bob-facility-manager-id",
  reason: "VACATION",
  includeApprovals: true
});

// 4. Sprawdzenie dostępu
const canViewProperty = await checkCombinedAccess(
  "bob-facility-manager-id", 
  "nieruchomosc-id", 
  "FINANCIAL", 
  "READ"
); // true przez zastępstwo
```

### **Scenariusz 2: Holding korporacyjny**
```javascript
// Hierarchia strumieni: Holding → Spółki → Departamenty
// Hierarchia użytkowników: CEO → VP → Managers → Employees
// Automatyczne dziedziczenie uprawnień w obu hierarchiach
```

---

**Status**: 📋 Rozszerzony plan gotowy do implementacji  
**Next Step**: Rozpocząć Fazę 1 - analiza aktualnych struktur i projektowanie modeli