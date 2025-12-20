# TODO PRISMA NAPRAWY - Plan Kompleksowy

## 🎯 CEL
Naprawić wszystkie błędy Prisma Schema i wypełnić puste tabele danymi testowymi

## 📋 LISTA ZADAŃ (Priorytet wykonania)

### ⭐ WYSOKIE PRIORYTETY

#### 1. **Utworzenie backupu bazy przed zmianami**
- Backup aktualnego stanu bazy danych
- Export schema dla porównania
- Bezpieczeństwo przed zmianami

#### 2. **Analiza błędów Prisma Schema**
- Dokumentacja wszystkich problemów z logów
- Porównanie schema.prisma vs rzeczywista struktura bazy
- Lista nieistniejących kolumn/tabel

#### 3. **Sprawdzenie struktury bazy vs schema.prisma**
- Wylistowanie różnic między kodem a bazą
- Identyfikacja brakujących elementów
- Plan synchronizacji

#### 4. **Naprawa nieistniejących kolumn**
- `deals.kanbanPosition` - dodanie kolumny
- Inne brakujące kolumny identyfikowane w analizie
- Zachowanie kompatybilności

#### 5. **Utworzenie brakujących tabel**
- `communication_channels` - tabela kanałów komunikacji
- Inne brakujące tabele z błędów
- Relacje i foreign keys

#### 6. **Uruchomienie migracji Prisma**
- Synchronizacja schema z bazą
- Generate nowego Prisma Client
- Weryfikacja zmian

### ⭐ ŚREDNIE PRIORYTETY

#### 7. **Naprawa błędnych nazw pól w kodzie**
- `context` → `contextId` w modelach Task
- `_count` i inne błędne relacje
- Aktualizacja zapytań w service files

#### 8. **Napełnienie pustych tabel danymi**
- GTD Inbox - przykładowe elementy
- GTD Buckets - standardowe buckety GTD
- GTD Horizons - 6 poziomów David Allen
- Communication Channels - przykładowe kanały
- Contexts - standardowe konteksty GTD
- Areas of Responsibility - przykładowe obszary

#### 9. **Testowanie endpointów po naprawach**
- Wszystkie API endpoints
- Frontend functionality
- Error handling

### ⭐ NISKIE PRIORYTETY

#### 10. **Update Prisma do najnowszej wersji**
- Upgrade z 5.22.0 do 6.11.1
- Testy kompatybilności
- Breaking changes analysis

---

## 🔍 ZIDENTYFIKOWANE BŁĘDY

### **Nieistniejące kolumny:**
1. `deals.kanbanPosition` - pozycja w Kanban board
2. Inne kolumny do zidentyfikowania w analizie

### **Nieistniejące tabele:**
1. `communication_channels` - kanały komunikacji (Slack, email, etc.)
2. Inne tabele do zidentyfikowania

### **Błędne nazwy pól w kodzie:**
1. `context` zamiast `contextId` w Task model
2. `projects` relation w AreaOfResponsibility
3. `_count` include statements

### **Foreign key violations:**
1. `tasks_contextId_fkey` - nieistniejące konteksty
2. Inne constraints do naprawy

### **Puste tabele do wypełnienia:**
1. `inbox_items` - 0 rekordów
2. `gtd_buckets` - 0 rekordów  
3. `gtd_horizons` - 0 rekordów
4. Communication channels
5. Contexts (częściowo wypełnione)

---

## 📊 DANE TESTOWE DO DODANIA

### **GTD Inbox Items** (8-10 przykładów):
- Quick capture items
- Meeting notes
- Phone calls
- Ideas
- Documents to review

### **GTD Buckets** (4 standardowe):
1. Natychmiastowe (< 2 min)
2. Zaplanowane (z datą)
3. Delegowane (przypisane)
4. Może kiedyś (Someday/Maybe)

### **GTD Horizons** (6 poziomów David Allen):
0. **Current actions** - Bieżące działania
1. **Current projects** - Bieżące projekty  
2. **Areas of responsibility** - Obszary odpowiedzialności
3. **Goals** - 1-2 letnie cele
4. **Vision** - 3-5 letnia wizja
5. **Purpose** - Życiowa misja

### **Communication Channels** (5-8 kanałów):
- Email (Gmail, Outlook)
- Slack channels
- Teams channels  
- WhatsApp
- Phone calls
- Meetings

### **Contexts GTD** (rozszerzenie istniejących):
- @computer, @calls, @office, @home
- @errands, @waiting, @reading, @online
- @low-energy, @high-energy
- @anywhere, @agenda-boss

---

## 🛠️ KOLEJNOŚĆ WYKONANIA

1. **BACKUP** → Bezpieczeństwo danych
2. **ANALIZA** → Pełne zrozumienie problemów  
3. **SCHEMA SYNC** → Synchronizacja struktury
4. **CODE FIXES** → Naprawa błędów w kodzie
5. **DATA FILL** → Wypełnienie testowymi danymi
6. **TESTING** → Weryfikacja wszystkiego
7. **UPGRADE** → Opcjonalny upgrade Prisma

---

## 📝 UWAGI
- Wszystkie zmiany z zachowaniem istniejących danych
- Testowanie po każdym kroku
- Rollback plan w przypadku problemów
- Dokumentacja każdej zmiany

**Data utworzenia**: 2025-07-04
**Status**: Do realizacji