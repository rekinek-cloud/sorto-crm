# TODO: Implementacja Stron Szczegółów dla Wszystkich Modułów

## 🎯 Cel
Stworzenie kompletnego systemu stron szczegółów dla wszystkich modułów CRM/GTD z pełnymi powiązaniami i relacjami, podobnie do strony szczegółów firmy.

## 📋 Lista Zadań

### 1. Analiza Modułów i Powiązań ⏱️ 30min
- [ ] **Analiza modelu danych Prisma** - zidentyfikowanie wszystkich relacji
- [ ] **Mapowanie powiązań między modułami** - kto z kim jest powiązany
- [ ] **Priorytetyzacja modułów** - które są najważniejsze dla użytkowników

### 2. Strony Szczegółów - Priorytet Wysoki ⏱️ 3h

#### 2.1 Kontakty `/crm/dashboard/contacts/[id]` ⏱️ 45min
- [ ] **Sekcja podstawowa**: imię, nazwisko, email, telefon, pozycja
- [ ] **Powiązania**: firma, deale, zadania, projekty
- [ ] **Statystyki**: liczba deali, wartość, aktywność
- [ ] **Actions**: edycja, tworzenie nowych powiązań
- [ ] **GraphModal**: wizualizacja sieci kontaktu

#### 2.2 Deale `/crm/dashboard/deals/[id]` ⏱️ 45min  
- [ ] **Sekcja podstawowa**: tytuł, wartość, stage, prawdopodobieństwo
- [ ] **Powiązania**: firma, kontakt, właściciel, zadania
- [ ] **Timeline**: historia zmian stage'a
- [ ] **Actions**: edycja, tworzenie zadań, dokumentów
- [ ] **GraphModal**: wizualizacja powiązań deala

#### 2.3 Projekty `/crm/dashboard/projects/[id]` ⏱️ 45min
- [ ] **Sekcja podstawowa**: nazwa, opis, status, deadline
- [ ] **Powiązania**: zadania, dependencies, właściciel, firma
- [ ] **Statystyki**: progress, liczba zadań, timeline
- [ ] **Wykres Gantta**: timeline projektów i zależności
- [ ] **Actions**: dodawanie zadań, zarządzanie dependencies

#### 2.4 Zadania `/crm/dashboard/tasks/[id]` ⏱️ 45min
- [ ] **Sekcja podstawowa**: tytuł, opis, priorytet, deadline
- [ ] **Powiązania**: projekt, kontakt, firma, dependencies
- [ ] **GTD Context**: kontekst, energia, focus mode
- [ ] **Actions**: zmiana statusu, dodawanie subtasks
- [ ] **Activity Timeline**: historia zmian

### 3. Strony Szczegółów - Priorytet Średni ⏱️ 1h

#### 3.1 Strumienie `/crm/dashboard/streams/[id]` ⏱️ 30min
- [ ] **Sekcja podstawowa**: nazwa, opis, typ, status
- [ ] **Powiązania**: zadania, projekty, subscriber
- [ ] **Activity Feed**: najnowsze aktywności
- [ ] **Actions**: zarządzanie subskrypcjami

### 4. Infrastruktura i Fixes ⏱️ 1h

#### 4.1 Routing i Linki ⏱️ 20min
- [ ] **Aktualizacja wszystkich komponentów Item** - dodanie linków do stron szczegółów
- [ ] **Sprawdzenie struktury katalogów** - `/crm/dashboard/*/[id]/page.tsx`
- [ ] **Testowanie routingu** - czy wszystkie linki działają

#### 4.2 useEffect Dependencies ⏱️ 20min
- [ ] **Audit wszystkich komponentów List** - sprawdzenie dependencies
- [ ] **Naprawienie potencjalnych pętli** - jak w CompaniesList
- [ ] **Optymalizacja re-renderów** - useMemo, useCallback gdzie potrzebne

#### 4.3 API Routes ⏱️ 20min
- [ ] **Sprawdzenie endpointów** - czy wszystkie `GET /:id` istnieją
- [ ] **Dodanie brakujących include** - dla relacji w odpowiedziach API
- [ ] **Naprawienie błędów Prisma** - jak w poprzednich modułach

### 5. Testing i Finalizacja ⏱️ 30min
- [ ] **Test wszystkich stron szczegółów** - czy ładują się i wyświetlają dane
- [ ] **Test GraphModal** - czy wizualizacje działają dla każdego modułu
- [ ] **Test formularzy** - tworzenie powiązanych obiektów
- [ ] **Test responsywności** - mobile/desktop
- [ ] **Dokumentacja** - aktualizacja CLAUDE.md

## 🗂️ Struktura Plików Do Utworzenia

```
packages/frontend/src/app/crm/dashboard/
├── contacts/[id]/page.tsx        # Strona szczegółów kontaktu
├── deals/[id]/page.tsx           # Strona szczegółów deala  
├── projects/[id]/page.tsx        # Strona szczegółów projektu
├── tasks/[id]/page.tsx           # Strona szczegółów zadania
└── streams/[id]/page.tsx         # Strona szczegółów strumienia
```

## 🎨 Template Struktury Strony Szczegółów

Każda strona szczegółów powinna zawierać:

1. **Header Section**
   - Ikona/avatar obiektu
   - Nazwa/tytuł główny
   - Status badges
   - Action buttons (edit, delete, view relationships)

2. **Stats Cards** (2-4 karty)
   - Kluczowe metryki dla tego obiektu
   - Liczba powiązań
   - Wartości biznesowe

3. **Main Content Grid** (2-3 kolumny)
   - Sekcja powiązanych obiektów (lista + możliwość dodawania)
   - Sekcja szczegółowych informacji
   - Sekcja aktywności/historii

4. **Modals**
   - GraphModal dla wizualizacji powiązań
   - FormModal dla tworzenia/edycji powiązanych obiektów

5. **Future: Activity Timeline**
   - Historia zmian obiektu
   - Powiązane aktywności
   - Komunikacja/notatki

## 📊 Analiza Priorytetów

### Wysokie Priorytety (Business Critical):
1. **Kontakty** - centrum relacji biznesowych
2. **Deale** - bezpośrednio wpływają na revenue
3. **Projekty** - organizacja pracy zespołu
4. **Zadania** - podstawa GTD workflow

### Średnie Priorytety (Nice to Have):
1. **Strumienie** - organization workflow
2. **Companies** - ✅ już zrobione!

### Framework Reusability:
- Stworzenie shared komponentów dla powtarzalnych sekcji
- Unified GraphModal integration pattern
- Consistent styling/layout patterns
- Shared hooks dla data fetching patterns

## ⏰ Szacowany Czas: ~6 godzin
- Analiza: 30 min
- Implementacja core pages: 3h  
- Infrastructure fixes: 1h
- Testing: 30 min
- Buffer/Documentation: 1h

## 🚀 Rezultat
Kompletny system stron szczegółów umożliwiający:
- Głęboką analizę każdego obiektu w systemie
- Łatwe nawigowanie między powiązaniami
- Tworzenie nowych powiązań bezpośrednio z kontekstu
- Wizualizację sieci relacji przez GraphModal
- Spójne UX experience w całym systemie