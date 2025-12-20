# TODO: KOMPLETNE NAPRAWY SKRYPTÓW SEED - PLAN DZIAŁANIA

## 🎯 **CEL**: Wypełnienie wszystkich 97 tabel bazy danych spójnymi danymi

### ✅ **UKOŃCZONE**
- [x] Naprawiono główny skrypt `seed.ts` - **DZIAŁA 100%**
- [x] Naprawiono podstawowe modele w `seed-consolidated.ts`
- [x] Naprawiono kluczowe relacje (Task, Contact, Dependency, UnifiedRule)
- [x] Poprawiono enums i typy zgodnie ze schematem

---

## 🔧 **FAZA 1: DOKOŃCZENIE SEED-REMAINING-TABLES.TS** (Priorytet: **WYSOKI**)

### 1.1 **Naprawy OrderItem i Invoice**
- [ ] Sprawdzić model OrderItem w schema.prisma
- [ ] Dodać brakujące pole `itemType` do OrderItem
- [ ] Sprawdzić model Invoice i poprawić wymagane pola
- [ ] Sprawdzić model InvoiceItem i jego strukturę

### 1.2 **Naprawy kompleksowych modeli**
- [ ] Sprawdzić i naprawić MessageAttachment (fileName vs filename)
- [ ] Naprawić StreamPermission (usunąć permission, zostawić accessLevel)
- [ ] Sprawdzić model BugReport i jego pola severity/priority
- [ ] Naprawić WeeklyReview (reviewDate vs startDate)

### 1.3 **Naprawy modeli AI**
- [ ] Sprawdzić AIExecution i wymagane pola (inputData vs input)
- [ ] Poprawić AIRule i relacje z AI Provider/Model
- [ ] Sprawdzić SMARTTemplate i jego wymagane pola

---

## 🔧 **FAZA 2: OPTYMALIZACJA I UPROSZCZENIE** (Priorytet: **ŚREDNI**)

### 2.1 **Strategia uproszczenia**
- [ ] Zidentyfikować modele z największą liczbą błędów
- [ ] Utworzyć listę "skip models" dla zbyt kompleksowych schematów
- [ ] Skupić się na 50 najważniejszych tabelach zamiast wszystkich 97

### 2.2 **Modularyzacja skryptów**
- [ ] Podzielić seed-remaining-tables.ts na mniejsze pliki:
  - `seed-core-relations.ts` (User/Stream Relations)
  - `seed-business-data.ts` (Orders, Invoices, Products)
  - `seed-ai-models.ts` (AI Rules, Executions)
  - `seed-advanced-features.ts` (BugReports, WeeklyReviews)

### 2.3 **Error handling**
- [ ] Dodać try-catch bloki dla każdej sekcji
- [ ] Implementować "continue on error" strategię
- [ ] Dodać szczegółowe logi błędów z numerami linii

---

## 🔧 **FAZA 3: WERYFIKACJA I TESTY** (Priorytet: **WYSOKI**)

### 3.1 **Testy individual skryptów**
- [ ] Test `npm run db:seed` (podstawowy)
- [ ] Test `seed-consolidated.ts` 
- [ ] Test każdego modularnego skryptu osobno

### 3.2 **Testy integracyjne**
- [ ] Test pełnej sekwencji seed wszystkich skryptów
- [ ] Weryfikacja relacji między tabelami
- [ ] Sprawdzenie foreign key constraints

### 3.3 **Weryfikacja danych**
- [ ] Sprawdzenie liczby rekordów w każdej tabeli
- [ ] Weryfikacja jakości danych (brak null w required fields)
- [ ] Test funkcjonalności aplikacji z seeded data

---

## 🗂️ **FAZA 4: DOKUMENTACJA I BACKUP** (Priorytet: **ŚREDNI**)

### 4.1 **Dokumentacja**
- [ ] Utworzenie `SEED_DOCUMENTATION.md` z opisem każdego skryptu
- [ ] Lista wszystkich wypełnionych tabel z przykładowymi danymi
- [ ] Instrukcje uruchamiania w odpowiedniej kolejności

### 4.2 **Backup i Recovery**
- [ ] Utworzenie skryptu backup bazy danych
- [ ] Test procedury restore z backup
- [ ] Dokumentacja recovery procedures

---

## 📋 **STRATEGIA IMPLEMENTACJI**

### **Podejście 1: "Fix wszystko" (Idealne)**
- Naprawić wszystkie 97+ modeli
- Czas: ~4-6 godzin
- Ryzyko: Wysokie (kompleksowość schematów)

### **Podejście 2: "Core First" (Praktyczne)** ⭐ **ZALECANE**
- Skupić się na 50 najważniejszych tabelach
- Pominąć najbardziej kompleksowe modele
- Czas: ~2-3 godziny
- Ryzyko: Niskie

### **Podejście 3: "Modular" (Skalowalne)**
- Podzielić na małe, niezależne skrypty
- Każdy skrypt odpowiada za 10-15 tabel
- Możliwość uruchamiania częściowego
- Czas: ~3-4 godziny

---

## 🎯 **PRIORYTETY TABEL** (Top 50 najważniejszych)

### **Tier 1: CORE BUSINESS** (Musi działać - 15 tabel)
1. Organizations ✅
2. Users ✅ 
3. Tasks ✅
4. Projects ✅
5. Companies ✅
6. Contacts ✅
7. Deals ✅
8. Messages 🔶
9. Activities 🔶
10. Streams ✅
11. Contexts ✅
12. UnifiedRules 🔶
13. CommunicationChannels 🔶
14. ProcessingRules 🔶
15. AIProviders 🔶

### **Tier 2: EXTENDED FEATURES** (Ważne - 20 tabel)
16. UserRelations ❌
17. TaskRelationships ❌
18. StreamRelations ❌
19. Dependencies ✅
20. ProjectDependencies ❌
21. AIRules ❌
22. AIModels 🔶
23. AutoReplies 🔶
24. SmartMailboxes 🔶
25. EmailTemplates 🔶
26. GTDBuckets 🔶
27. GTDHorizons 🔶
28. InboxItems 🔶
29. Products 🔶
30. Services 🔶
31. Subscriptions ✅
32. Leads 🔶
33. Files 🔶
34. Documents 🔶
35. WikiPages 🔶

### **Tier 3: NICE TO HAVE** (15 tabel)
36. Orders ❌
37. OrderItems ❌
38. Invoices ❌
39. InvoiceItems ❌
40. Offers 🔶
41. OfferItems 🔶
42. RecurringTasks 🔶
43. Meetings 🔶
44. FocusModes 🔶
45. Habits 🔶
46. WaitingFor 🔶
47. SomedayMaybe 🔶
48. AreaOfResponsibility 🔶
49. Tags 🔶
50. Attachments ❌

**Legenda:**
- ✅ Działa poprawnie
- 🔶 Częściowo działa / wymaga poprawek
- ❌ Nie działa / wymaga naprawy

---

## 🚀 **PLAN NATYCHMIASTOWYCH DZIAŁAŃ**

### **KROK 1: Quick Wins (30 min)**
1. Naprawić OrderItem (`itemType` field)
2. Naprawić Invoice podstawowe pola
3. Usunąć problematyczne sekcje BugReport/WeeklyReview
4. Test podstawowego flow

### **KROK 2: Core Relations (45 min)**
1. Naprawić UserRelations i UserPermissions
2. Naprawić TaskRelationships
3. Naprawić StreamRelations i StreamPermissions
4. Test relacji

### **KROK 3: Business Data (30 min)**  
1. Naprawić Orders/OrderItems całkowicie
2. Naprawić Invoices/InvoiceItems
3. Test business flow

### **KROK 4: AI & Advanced (45 min)**
1. Naprawić AIRules i AIExecutions
2. Naprawić MessageAttachments
3. Naprawić SMARTTemplates
4. Test zaawansowanych funkcji

### **KROK 5: Final Test & Documentation (30 min)**
1. Test pełnej sekwencji wszystkich skryptów
2. Dokumentacja sukcesu
3. Backup finalnej bazy danych

---

## 📊 **METRYKI SUKCESU**

### **Minimalne wymagania (MVP)**
- [ ] 50+ tabel wypełnionych danymi
- [ ] Wszystkie Tier 1 tabele działają
- [ ] Podstawowe relacje zachowane
- [ ] Aplikacja działa z seeded data

### **Pełny sukces**
- [ ] 80+ tabel wypełnionych danymi
- [ ] Wszystkie Tier 1 i Tier 2 tabele działają
- [ ] Kompleksowe relacje zachowane
- [ ] Wszystkie funkcjonalności aplikacji działają

### **Bonus cele**
- [ ] Wszystkie 97 tabel wypełnione
- [ ] Modularyzacja skryptów
- [ ] Automatyzacja CI/CD dla seeds
- [ ] Performance optimization

---

**CZAS SZACOWANY: 2.5-4 godziny**
**ROZPOCZĘCIE: NATYCHMIAST**
**NASTĘPNY KROK: Naprawić OrderItem i Invoice (Quick Win)**