# 🏗️ Plan Implementacji: Hierarchia Strumieni + Kontrola Dostępu

## 📋 **KOMPLETNY PLAN IMPLEMENTACJI - 18 zadań**

### 🎯 **FAZA 1: FUNDAMENT (HIGH PRIORITY - 5 zadań)**
Najpierw musimy rozbudować strukturę bazy danych:

1. ✅ **Analiza aktualnej struktury modelu Stream i planowanie rozszerzeń**
   - Sprawdzenie istniejącego modelu Stream
   - Identyfikacja potrzebnych zmian
   - Planowanie migracji bez breaking changes

2. ✅ **Implementacja modelu StreamRelation do obsługi hierarchii strumieni**
   - Tabela relacji między strumieniami
   - Obsługa relacji many-to-many z dodatkowymi atrybutami
   - Unikalne ograniczenia dla par parent-child

3. ✅ **Definicja enum StreamRelationType (OWNS, MANAGES, BELONGS_TO, etc.)**
   - OWNS - posiada (pełny dostęp)
   - MANAGES - zarządza (dostęp operacyjny)  
   - BELONGS_TO - należy do (ograniczony dostęp)
   - RELATED_TO - powiązany (podstawowy dostęp)
   - DEPENDS_ON - zależy od (dostęp do potrzebnych danych)
   - SUPPORTS - wspiera (dostęp wsparcia)

4. ✅ **Migracja bazy danych - dodanie tabel dla hierarchii strumieni**
   - Utworzenie tabeli stream_relations
   - Dodanie indeksów wydajnościowych
   - Seed data dla testowania

5. ✅ **Implementacja modeli kontroli dostępu (StreamPermission, AccessLevel, DataScope)**
   - Granularne uprawnienia per relacja
   - Poziomy dostępu (NO_ACCESS → FULL_CONTROL)
   - Zakresy danych (BASIC_INFO, TASKS, FINANCIAL, etc.)

### ⚙️ **FAZA 2: BACKEND LOGIC (MEDIUM PRIORITY - 4 zadania)**
Implementacja logiki biznesowej:

6. **Backend service dla operacji na hierarchii strumieni**
   - StreamHierarchyService.ts
   - CRUD operacje na relacjach
   - Walidacja cyklicznych relacji
   - Optymalizacja zapytań hierarchicznych

7. **Backend service do sprawdzania uprawnień i kontroli dostępu**
   - StreamAccessControlService.ts
   - Sprawdzanie bezpośrednich uprawnień
   - Sprawdzanie uprawnień przez relacje
   - Cache'owanie wyników dla wydajności

8. **API endpoints dla zarządzania hierarchią strumieni**
   - POST /api/v1/streams/:id/relations - tworzenie relacji
   - GET /api/v1/streams/:id/hierarchy - pobieranie hierarchii
   - PUT /api/v1/stream-relations/:id - edycja relacji
   - DELETE /api/v1/stream-relations/:id - usuwanie relacji

9. **API endpoints dla kontroli dostępu i uprawnień**
   - GET /api/v1/streams/:id/access-check - sprawdzanie uprawnień
   - GET /api/v1/streams/:id/accessible-streams - dostępne strumienie
   - POST /api/v1/stream-relations/:id/permissions - zarządzanie uprawnieniami
   - GET /api/v1/streams/:id/audit-log - logi dostępu

### 🎨 **FAZA 3: FRONTEND UI (MEDIUM PRIORITY - 4 zadania)**
Interfejs użytkownika:

10. **Frontend - wizualizacja hierarchii strumieni (drzewo, graf)**
    - Komponent StreamHierarchyTree
    - Interaktywna wizualizacja z react-flow lub d3
    - Drag & drop dla reorganizacji
    - Zoom i nawigacja w dużych hierarchiach

11. **Frontend - interfejs zarządzania uprawnieniami strumieni**
    - Komponent StreamAccessManager
    - Tabela uprawnień z inline editing
    - Wizualne wskaźniki poziomów dostępu
    - Bulk operations dla uprawnień

12. **Frontend - formularz tworzenia/edycji relacji między strumieniami**
    - Modal CreateStreamRelation
    - Dropdown z dostępnymi strumieniami
    - Configurator uprawnień
    - Preview skutków relacji

### 🔧 **FAZA 4: ZAAWANSOWANE FUNKCJE (LOW PRIORITY - 6 zadań)**
Dodatkowe funkcjonalności:

13. **Implementacja logiki dziedziczenia uprawnień w hierarchii**
    - Inheritance rules (NO_INHERITANCE, INHERIT_DOWN, INHERIT_UP, BIDIRECTIONAL)
    - Automatyczne propagowanie zmian uprawnień
    - Conflict resolution dla sprzecznych uprawnień
    - Performance optimization dla głębokich hierarchii

14. **System audytu dostępów do strumieni (logi, śledzenie)**
    - Model StreamAccessLog
    - Automatyczne logowanie wszystkich dostępów
    - Dashboard audytu z filtrami i exportem
    - Alerty bezpieczeństwa dla podejrzanych dostępów

15. **Testy jednostkowe i integracyjne dla hierarchii strumieni**
    - Jest dla StreamHierarchyService
    - Testy cyklicznych relacji
    - Testy wydajności dla dużych hierarchii
    - Edge cases i error handling

16. **Testy bezpieczeństwa i kontroli dostępu strumieni**
    - Security tests dla StreamAccessControlService
    - Penetration testing uprawnień
    - Privilege escalation tests
    - Data leak prevention tests

17. **Seed data - przykładowe hierarchie strumieni do testowania**
    - Seed hierarchii nieruchomości (właściciel-zarządca-najemcy)
    - Seed struktury holdingu (holding-spółki-departamenty)
    - Seed projektu z podwykonawcami
    - Seed łańcucha dostaw (producent-dystrybutor-sprzedawca)

18. **Dokumentacja systemu hierarchii i kontroli dostępu strumieni**
    - User manual dla tworzenia hierarchii
    - Admin guide dla konfiguracji uprawnień
    - Developer docs dla API
    - Best practices i security guidelines

## 🏗️ **SZCZEGÓŁOWA ARCHITEKTURA**

### **Modele bazy danych:**

```prisma
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
  isSymmetric     Boolean @default(false)  // czy relacja działa w obie strony
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
  createdBy   User @relation(fields: [createdById], references: [id])
  
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
  
  dataScope   DataScope        // co można zobaczyć
  action      PermissionAction // co można zrobić  
  granted     Boolean          @default(true)
  
  // Warunki dostępu
  conditions  Json @default("{}")  // dodatkowe warunki (czas, geo, itp.)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([relationId, dataScope, action])
  @@map("stream_permissions")
}

model StreamAccessLog {
  id          String @id @default(uuid())
  
  userId      String
  user        User @relation(fields: [userId], references: [id])
  
  streamId    String
  stream      Stream @relation(fields: [streamId], references: [id])
  
  action      PermissionAction
  dataScope   DataScope
  granted     Boolean
  
  // Access context
  via         String?  // ID strumienia przez który uzyskano dostęp
  relationId  String?  // ID relacji przez którą uzyskano dostęp
  
  // Technical details
  ipAddress   String?
  userAgent   String?
  endpoint    String?
  
  createdAt   DateTime @default(now())
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@map("stream_access_logs")
}

enum StreamRelationType {
  OWNS          // posiada - pełny dostęp
  MANAGES       // zarządza - dostęp operacyjny
  BELONGS_TO    // należy do - ograniczony dostęp
  RELATED_TO    // powiązany - podstawowy dostęp
  DEPENDS_ON    // zależy od - dostęp tylko do potrzebnych danych
  SUPPORTS      // wspiera - dostęp wsparcia
}

enum AccessLevel {
  NO_ACCESS     // brak dostępu
  READ_ONLY     // tylko odczyt podstawowych danych
  LIMITED       // odczyt + ograniczone operacje
  OPERATIONAL   // pełny dostęp operacyjny  
  MANAGEMENT    // dostęp zarządczy
  FULL_CONTROL  // pełna kontrola
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
```

### **Kluczowe Services:**

```typescript
// StreamHierarchyService.ts
class StreamHierarchyService {
  async createRelation(data: CreateStreamRelationDto): Promise<StreamRelation>
  async getStreamHierarchy(streamId: string, depth?: number): Promise<StreamHierarchy>
  async updateRelation(id: string, data: UpdateStreamRelationDto): Promise<StreamRelation>
  async deleteRelation(id: string): Promise<void>
  async getRelatedStreams(streamId: string, relationType?: StreamRelationType): Promise<Stream[]>
  async validateNoCycles(parentId: string, childId: string): Promise<boolean>
}

// StreamAccessControlService.ts  
class StreamAccessControlService {
  async checkDirectAccess(userId: string, streamId: string, dataScope: DataScope, action: PermissionAction): Promise<boolean>
  async checkRelationalAccess(userId: string, targetStreamId: string, dataScope: DataScope, action: PermissionAction): Promise<AccessResult>
  async getAccessibleRelatedStreams(userId: string, streamId: string, dataScope?: DataScope): Promise<StreamWithAccessInfo[]>
  async getUserAccessibleStreams(userId: string, filters?: AccessFilters): Promise<Stream[]>
  async logAccess(userId: string, streamId: string, action: PermissionAction, dataScope: DataScope, granted: boolean): Promise<void>
}
```

## 🚀 **Estimated Timeline:**
- **Faza 1**: ~4-6 godzin (fundament bazy danych)
- **Faza 2**: ~6-8 godzin (backend logic)  
- **Faza 3**: ~6-8 godzin (frontend UI)
- **Faza 4**: ~4-6 godzin (polish & optimization)

**Łącznie**: ~20-28 godzin pracy

## 🎯 **Przykłady użycia po implementacji:**

### **Scenariusz 1: Nieruchomość**
```javascript
// Utworzenie hierarchii nieruchomości
await streamHierarchy.createRelation({
  parentId: "firma-abc-id",
  childId: "nieruchomosc-id", 
  relationType: "OWNS",
  accessLevel: "MANAGEMENT",
  permissions: [
    { dataScope: "ALL", action: "MANAGE", granted: true }
  ]
});

await streamHierarchy.createRelation({
  parentId: "firma-def-id",
  childId: "nieruchomosc-id",
  relationType: "MANAGES", 
  accessLevel: "OPERATIONAL",
  permissions: [
    { dataScope: "TASKS", action: "MANAGE", granted: true },
    { dataScope: "CONTACTS", action: "MANAGE", granted: true },
    { dataScope: "FINANCIAL", action: "READ", granted: false } // Zarządca nie widzi finansów właściciela
  ]
});

// Sprawdzenie dostępu
const canViewFinancials = await accessControl.checkRelationalAccess(
  userId, "nieruchomosc-id", "FINANCIAL", "READ"
);

// Pobranie hierarchii
const hierarchy = await streamHierarchy.getStreamHierarchy("nieruchomosc-id");
```

### **Scenariusz 2: Holding korporacyjny**
```javascript
// Hierarchia: Holding → Spółka → Departament
await streamHierarchy.createRelation({
  parentId: "holding-id",
  childId: "spolka-a-id",
  relationType: "OWNS",
  accessLevel: "FULL_CONTROL",
  inheritanceRule: "INHERIT_DOWN" // Uprawnienia holding cascadują w dół
});

await streamHierarchy.createRelation({
  parentId: "spolka-a-id", 
  childId: "departament-it-id",
  relationType: "OWNS",
  accessLevel: "MANAGEMENT"
});

// Automatyczne dziedziczenie: użytkownik holding'u ma dostęp do departamentu IT
```

### **Scenariusz 3: Projekt z podwykonawcami**
```javascript
// Czasowa relacja na czas trwania projektu
await streamHierarchy.createRelation({
  parentId: "glowny-wykonawca-id",
  childId: "podwykonawca-id", 
  relationType: "MANAGES",
  accessLevel: "LIMITED",
  validFrom: new Date("2024-01-01"),
  validUntil: new Date("2024-12-31"), // Dostęp tylko na 2024
  permissions: [
    { dataScope: "TASKS", action: "READ", granted: true },
    { dataScope: "TIMELINE", action: "UPDATE", granted: true }
  ]
});
```

## 🛡️ **Bezpieczeństwo i audyt:**

- **Automatyczne logowanie** wszystkich dostępów do strumieni
- **Walidacja uprawnień** przy każdym API call
- **Śledzenie zmian** w relacjach i uprawnieniach  
- **Alerty bezpieczeństwa** dla podejrzanych dostępów
- **Backup i restore** konfiguracji uprawnień
- **Compliance reporting** dla auditów zewnętrznych

## 📈 **Metryki i monitoring:**

- **Dashboard hierarchii** - wizualizacja wszystkich relacji
- **Raporty dostępu** - kto, kiedy, do czego miał dostęp
- **Statystyki uprawnień** - rozkład poziomów dostępu
- **Performance metrics** - czasy sprawdzania uprawnień
- **Alerts** - nietypowe wzorce dostępu

---

**Status**: 📋 Plan gotowy do implementacji
**Next Step**: Rozpocząć od Fazy 1 - analiza i rozszerzenie modelu bazy danych