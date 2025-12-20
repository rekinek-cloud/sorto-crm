# Plan implementacji i18n dla CRM-GTD Smart

## 📊 Analiza obecnego stanu

### ✅ Co już mamy:
- [x] Biblioteka `next-intl@4.3.1` zainstalowana
- [x] Podstawowa konfiguracja w `i18n.js` 
- [x] Pliki tłumaczeń `pl.json` i `en.json` (~158 kluczy każdy)
- [x] 2 języki: Polski (pl) + Angielski (en)

### ❌ Co nie działa:
- [ ] next-intl jest **wyłączony** w `next.config.js` (linia 3)
- [ ] Middleware jest **pusty** (tylko bypass)
- [ ] Komponenty używają **hardcoded fallback** (layout.tsx:21-97)
- [ ] LanguageSwitcher jest **wyłączony**
- [ ] ~500-700 tekstów pozostaje **nieprzetłumaczonych**

## 🎯 Plan działania (5 kroków)

### **KROK 1: Reaktywacja next-intl** ⏱️ 15 min
- [ ] **1.1** Aktywuj plugin w `next.config.js`:
  ```js
  const withNextIntl = require('next-intl/plugin')('./src/i18n.js');
  module.exports = withNextIntl(nextConfig);
  ```
- [ ] **1.2** Napraw `middleware.js`:
  ```js
  import createMiddleware from 'next-intl/middleware';
  export default createMiddleware({
    locales: ['pl', 'en'],
    defaultLocale: 'pl'
  });
  ```
- [ ] **1.3** Test podstawowego buildu - sprawdź czy nie ma błędów Docker

### **KROK 2: Podstawowa integracja** ⏱️ 30 min
- [ ] **2.1** Layout.tsx - usuń fallback (linie 21-97), użyj `useTranslations`
- [ ] **2.2** Aktywuj LanguageSwitcher w komponencie UI (linie 492-493, 556-557)
- [ ] **2.3** Test podstawowej funkcjonalności przełączania języków
- [ ] **2.4** Sprawdź routing (/pl/dashboard, /en/dashboard)

### **KROK 3: Rozszerzenie plików tłumaczeń** ⏱️ 45 min

#### **3.1 Dodanie brakujących sekcji do pl.json i en.json:**

```json
{
  "toasts": {
    "taskCreated": "Zadanie utworzone pomyślnie", // "Task created successfully"
    "taskDeleted": "Zadanie usunięte pomyślnie", // "Task deleted successfully"
    "taskUpdated": "Zadanie zaktualizowane pomyślnie", // "Task updated successfully"
    "dealDeleted": "Transakcja usunięta pomyślnie", // "Deal deleted successfully"
    "error": "Wystąpił błąd", // "An error occurred"
    "success": "Operacja zakończona pomyślnie" // "Operation completed successfully"
  },
  "confirmations": {
    "deleteTask": "Czy na pewno chcesz usunąć to zadanie?", // "Are you sure you want to delete this task?"
    "deleteDeal": "Czy na pewno chcesz usunąć tę transakcję?", // "Are you sure you want to delete this deal?"
    "deleteContact": "Czy na pewno chcesz usunąć ten kontakt?", // "Are you sure you want to delete this contact?"
    "deleteProject": "Czy na pewno chcesz usunąć ten projekt?" // "Are you sure you want to delete this project?"
  },
  "loading": {
    "general": "Ładowanie...", // "Loading..."
    "processing": "Przetwarzanie...", // "Processing..."
    "creating": "Tworzenie...", // "Creating..."
    "updating": "Aktualizowanie...", // "Updating..."
    "deleting": "Usuwanie...", // "Deleting..."
    "saving": "Zapisywanie..." // "Saving..."
  },
  "auth": {
    "loginTitle": "Zaloguj się do swojego konta", // "Sign in to your account"
    "email": "Adres email", // "Email address"
    "password": "Hasło", // "Password"
    "rememberMe": "Zapamiętaj mnie", // "Remember me"
    "forgotPassword": "Zapomniałeś hasła?", // "Forgot your password?"
    "signIn": "Zaloguj się", // "Sign in"
    "demoCredentials": "Dane demo:", // "Demo credentials:"
    "demoUser": "Użytkownik demo", // "Demo user"
    "demoAdmin": "Administrator demo" // "Demo admin"
  },
  "dashboard": {
    "welcome": "Witamy ponownie, {name}! 👋", // "Welcome back, {name}! 👋"
    "subtitle": "Oto co dzieje się dziś z Twoją produktywnością.", // "Here's what's happening with your productivity today."
    "noDate": "Brak daty", // "No date"
    "today": "Dzisiaj", // "Today"
    "tomorrow": "Jutro", // "Tomorrow"
    "quickActions": {
      "createTask": "Przekierowanie do tworzenia zadania!", // "Redirecting to task creation!"
      "processInbox": "Przekierowanie do przetwarzania Inbox!" // "Redirecting to inbox processing!"
    }
  },
  "gtd": {
    "decisions": {
      "do": "Zrób", // "Do"
      "defer": "Odłóż", // "Defer"  
      "delegate": "Deleguj", // "Delegate"
      "done": "Zrobione", // "Done"
      "deferred": "Odłożone", // "Deferred"
      "delegated": "Delegowane" // "Delegated"
    },
    "processing": {
      "error": "Błąd podczas przetwarzania elementu" // "Error processing item"
    }
  },
  "ai": {
    "commands": {
      "createTask": "Utwórz zadanie z tekstu", // "Create task from text"
      "createTaskDesc": "AI wydobędzie szczegóły zadania z Twojego opisu", // "AI will extract task details from your description"
      "analyzeEmail": "Analizuj email pod kątem zadań" // "Analyze email for tasks"
    }
  },
  "forms": {
    "labels": {
      "title": "Tytuł", // "Title"
      "titleRequired": "Tytuł *", // "Title *"
      "priority": "Priorytet", // "Priority"
      "status": "Status", // "Status"
      "description": "Opis", // "Description"
      "notes": "Notatki", // "Notes"
      "dueDate": "Termin", // "Due date"
      "assignee": "Przypisane do" // "Assigned to"
    },
    "buttons": {
      "save": "Zapisz", // "Save"
      "cancel": "Anuluj", // "Cancel"
      "create": "Utwórz", // "Create"
      "edit": "Edytuj", // "Edit"
      "delete": "Usuń", // "Delete"
      "update": "Zaktualizuj" // "Update"
    },
    "validation": {
      "titleRequired": "Tytuł jest wymagany", // "Title is required"
      "emailRequired": "Email jest wymagany", // "Email is required"
      "validNumber": "Musi być prawidłową liczbą", // "Must be a valid number"
      "waitingNoteRequired": "Notatka oczekiwania jest wymagana gdy zadanie oczekuje" // "Waiting note is required when task is waiting"
    },
    "options": {
      "priorities": {
        "low": "Niski", // "Low"
        "medium": "Średni", // "Medium"  
        "high": "Wysoki", // "High"
        "urgent": "Pilny" // "Urgent"
      },
      "statuses": {
        "new": "Nowy", // "New"
        "inProgress": "W trakcie", // "In Progress"
        "waiting": "Oczekuje", // "Waiting"
        "completed": "Zakończony", // "Completed"
        "onHold": "Wstrzymany" // "On Hold"
      }
    }
  },
  "views": {
    "modes": {
      "list": "Lista", // "List"
      "pipeline": "Pipeline", // "Pipeline"  
      "kanban": "Kanban", // "Kanban"
      "analytics": "Analityka" // "Analytics"
    }
  }
}
```

#### **3.2 Tasks checklist:**
- [ ] Dodaj sekcję `toasts` z komunikatami powodzenia/błędu
- [ ] Dodaj sekcję `confirmations` z potwierdzeniami działań
- [ ] Dodaj sekcję `loading` ze stanami ładowania
- [ ] Dodaj sekcję `auth` z formularzem logowania
- [ ] Dodaj sekcję `dashboard` z tekstami głównej strony
- [ ] Dodaj sekcję `gtd` z decyzjami GTD
- [ ] Dodaj sekcję `ai` z komendami AI
- [ ] Dodaj sekcję `forms` z etykietami formularzy
- [ ] Dodaj sekcję `views` z trybami widoku

### **KROK 4: Internacjonalizacja komponentów** ⏱️ 2-3h

#### **4.1 PRIORYTET WYSOKI (core functionality):**
- [ ] **Dashboard layout + nawigacja** (`/dashboard/layout.tsx`)
  - [ ] Usuń obiekt `translations` (linie 24-91)
  - [ ] Zamień na `useTranslations('navigation')`
  - [ ] Test wszystkich linków menu
- [ ] **Formularze logowania** (`/auth/login/page.tsx`)
  - [ ] Zamień polskie teksty na `t('auth.*')`
  - [ ] Wszystkie etykiety pól (linie 31-96)
- [ ] **Toast notifications** (wszędzie gdzie `toast.success/error`)
  - [ ] Dashboard: `toast.success` → `t('toasts.success')`
  - [ ] TasksList: komunikaty CRUD → `t('toasts.taskCreated')`
  - [ ] DealsList: komunikaty CRUD → `t('toasts.dealDeleted')`
- [ ] **Basic CRUD operations**
  - [ ] Przyciski Create/Edit/Delete we wszystkich listach
  - [ ] Confirm dialogs → `t('confirmations.*')`

#### **4.2 PRIORYTET ŚREDNI (enhanced UX):**
- [ ] **GTD components**
  - [ ] `TaskForm.tsx` - etykiety pól i walidacja (linie 103-270)
  - [ ] `TasksList.tsx` - statusy i komunikaty (linie 144-240)
  - [ ] `ProcessInboxModal.tsx` - decyzje GTD (linie 94-100)
  - [ ] `InboxItemCard.tsx` - badge decisions (linie 22-29)
- [ ] **CRM components**
  - [ ] `DealsList.tsx` - tytuły i opisy (linie 140-175)
  - [ ] `ContactForm.tsx` - etykiety formularzy
  - [ ] `CompanyForm.tsx` - pola firmy
- [ ] **Command Palette** (`/ui/CommandPalette.tsx`)
  - [ ] Opisy komend AI (linie 24-47)

#### **4.3 PRIORYTET NISKI (polish):**
- [ ] **Confirmation dialogs**
  - [ ] Wszystkie `confirm()` → custom modal z i18n
- [ ] **Loading states**
  - [ ] "Loading..." → `t('loading.general')`
  - [ ] "Processing..." → `t('loading.processing')`
- [ ] **Error messages**
  - [ ] Try-catch bloki z komunikatami błędów
- [ ] **Advanced features**
  - [ ] AI analysis results
  - [ ] Complex forms z walidacją

### **KROK 5: Testowanie i polish** ⏱️ 30 min
- [ ] **5.1** Test przełączania języków na wszystkich stronach
- [ ] **5.2** Weryfikacja brakujących tłumaczeń (console warnings)
- [ ] **5.3** URL routing dla języków (/pl/, /en/)
- [ ] **5.4** Zapisywanie preferencji użytkownika w localStorage
- [ ] **5.5** SEO meta tagi per język
- [ ] **5.6** Test Docker build z aktywnym next-intl

## ⚙️ Konfiguracja techniczna

### **URL Structure:**
```
/pl/dashboard/   - Polska wersja
/en/dashboard/   - Angielska wersja  
/dashboard/      - Przekierowanie na domyślny język (pl)
```

### **Lokalne storage:**
```js
// Zapisywanie preferencji języka
localStorage.setItem('preferred-locale', 'en');
```

### **SEO & Meta:**
```js
// Różne meta tagi per język
<html lang={locale}>
<meta name="description" content={t('meta.description')} />
```

## 📋 Szacowany czas implementacji

| Faza | Czas | Opis |
|------|------|------|
| **Minimum Viable i18n** | 1.5h | Kroki 1-2 (podstawowa funkcjonalność) |
| **Podstawowa funkcjonalność** | 3h | Kroki 1-3 (z rozszerzonymi tłumaczeniami) |
| **Pełna implementacja** | 6-8h | Wszystkie kroki (production ready) |

## ⚠️ Potencjalne problemy

1. **Docker build issues** - dlaczego next-intl było wyłączone
   - [ ] Test buildu po każdej zmianie konfiguracji
   - [ ] Backup working version przed zmianami

2. **Routing conflicts** - integracja z nginx proxy
   - [ ] Test URL routing z basePath='/crm'
   - [ ] Sprawdź czy /crm/pl/ działa poprawnie

3. **Asynchronous translations** - loading states
   - [ ] Fallback dla brakujących kluczy
   - [ ] Loading spinners podczas ładowania tłumaczeń

4. **Missing keys fallback** - graceful degradation
   - [ ] Default do angielskiego jeśli klucz nie istnieje
   - [ ] Console warnings dla missing keys

## 🎯 Strategia implementacji

### **Podejście 1: Big Bang** (szybkie, ryzykowne)
Zaimplementuj wszystko na raz - dla małych projektów

### **Podejście 2: Incremental** (zalecane)
1. Start z krokami 1-2 (infrastructure)
2. Test podstawowej funkcjonalności
3. Stopniowo dodawaj komponenty (priorytet WYSOKI → NISKI)
4. Test po każdym komponencie

### **Podejście 3: Feature-based**
Implementuj per feature area:
- Day 1: Dashboard + Navigation
- Day 2: GTD Components  
- Day 3: CRM Components
- Day 4: Auth + Polish

## 📝 Notatki implementacyjne

### **Najczęstsze wzorce do zamiany:**

#### **Przed:**
```tsx
<button>Zapisz</button>
toast.success('Task created successfully');
confirm('Are you sure?');
```

#### **Po:**
```tsx
<button>{t('forms.buttons.save')}</button>
toast.success(t('toasts.taskCreated'));
confirm(t('confirmations.deleteTask'));
```

### **Hook useTranslations:**
```tsx
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('tasks'); // namespace
  return <h1>{t('title')}</h1>; // tasks.title
}
```

### **Parametryzowane tłumaczenia:**
```tsx
// pl.json: "welcome": "Witamy, {name}!"
t('welcome', { name: user.firstName })
```

---

**Status**: 📝 TODO - Ready for implementation  
**Ostatnia aktualizacja**: 2025-06-25  
**Szacowany effort**: 6-8h full implementation