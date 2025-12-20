# 🚨 TODO ERRORS - Lista błędów do naprawy w frontend

> Raport analizy frontend CRM-GTD Smart - znalezione mockupy, martwe linki i niedokończone funkcjonalności
> 
> **Data analizy**: 2025-07-03  
> **Status**: AKTYWNE BŁĘDY  
> **Priorytet**: ŚREDNI/WYSOKI

---

## 🔴 **KRYTYCZNE BŁĘDY - DO NATYCHMIASTOWEJ NAPRAWY**

### **ERROR #1: Przyciski kalendarza bez funkcjonalności**
- **Plik**: `packages/frontend/src/components/views/Calendar/CalendarView.tsx`
- **Linie**: 235, 245
- **Problem**: 
```tsx
// BŁĄD: Puste funkcje onClick
<button onClick={() => {}}>Tydzień</button>
<button onClick={() => {}}>Miesiąc</button>
```
- **Naprawa**:
```tsx
// POPRAWKA: Rzeczywista funkcjonalność
<button onClick={() => setViewType('week')}>Tydzień</button>
<button onClick={() => setViewType('month')}>Miesiąc</button>
```
- **Impact**: Użytkownik nie może przełączać widoków kalendarza
- **Priorytet**: 🔴 WYSOKI

### **ERROR #2: Demo przyciski z console.log**
- **Plik**: `packages/frontend/src/app/dashboard/enhanced-cards-demo/page.tsx`
- **Problem**: ActionCard używa tylko `console.log()` zamiast funkcjonalności
- **Naprawa**: Zaimplementować rzeczywiste akcje lub redirect do odpowiednich stron
- **Impact**: Mylące dla użytkownika - przyciski wyglądają jak działają
- **Priorytet**: 🔴 WYSOKI

### **ERROR #3: Activity Timeline placeholder**
- **Plik**: `packages/frontend/src/app/crm/dashboard/companies/[id]/page.tsx`
- **Linie**: 439-449
- **Problem**: Sekcja pokazuje "Activity timeline coming soon"
- **Naprawa**: Ukryć sekcję lub zaimplementować prawdziwą timeline
- **Impact**: Użytkownik widzi niedokończoną funkcjonalność
- **Priorytet**: 🔴 WYSOKI

---

## 🟡 **ŚREDNIE BŁĘDY - DO NAPRAWY W KRÓTKIM TERMINIE**

### **ERROR #4: Brakujące toast notifications**
- **Pliki**: Wiele plików w całym projekcie
- **Przykłady**:
  - `packages/frontend/src/app/dashboard/products/page.tsx` (linie 65, 76, 79, 91, 94)
  - `packages/frontend/src/app/dashboard/services/page.tsx`
  - `packages/frontend/src/app/dashboard/offers/page.tsx`
- **Problem**: 
```tsx
// BŁĄD: Brak feedback dla użytkownika
// TODO: Show error toast
// TODO: Show success toast
```
- **Naprawa**: Zaimplementować toast.success() i toast.error() dla wszystkich operacji CRUD
- **Impact**: Brak informacji zwrotnej po operacjach
- **Priorytet**: 🟡 ŚREDNI

### **ERROR #5: Wyłączone przyciski bez uzasadnienia**
- **Pliki**: Różne komponenty
- **Problem**: `disabled={true}` bez logicznego powodu
- **Naprawa**: Przegląd logiki disabled state
- **Impact**: Przyciski mogą być niepotrzebnie nieaktywne
- **Priorytet**: 🟡 ŚREDNI

### **ERROR #6: Google Nest mock funkcjonalność**
- **Plik**: `packages/frontend/src/app/dashboard/voice-demo/page.tsx`
- **Linia**: 49
- **Problem**: "Włącz światło w biurze (wkrótce)" - funkcjonalność która nie istnieje
- **Naprawa**: Usunąć lub oznaczyć jako przyszłą funkcjonalność
- **Impact**: Mylące oczekiwania użytkownika
- **Priorytet**: 🟡 ŚREDNI

---

## 🟢 **NISKIE BŁĘDY - DO NAPRAWY DŁUGOTERMINOWO**

### **ERROR #7: Potencjalne problemy z dynamic routing**
- **Pliki**: `/companies/[id]/`, `/wiki/[slug]/`
- **Problem**: Brak sprawdzania czy ID/slug istnieje
- **Naprawa**: Dodać sprawdzanie istnienia zasobów + 404 handling
- **Impact**: Potencjalne 404 błędy
- **Priorytet**: 🟢 NISKI

---

## 📋 **PLAN NAPRAW**

### **🎯 Sprint 1 (Tydzień 1-2)**
- [ ] **ERROR #1**: Naprawić przyciski kalendarza (30 min)
- [ ] **ERROR #2**: Zastąpić console.log rzeczywistymi funkcjami (1h)
- [ ] **ERROR #3**: Ukryć Activity Timeline placeholder (15 min)

### **📋 Sprint 2 (Tydzień 3-4)**  
- [ ] **ERROR #4**: Dodać toast notifications do wszystkich operacji CRUD (4h)
- [ ] **ERROR #5**: Przegląd disabled buttons logic (2h)
- [ ] **ERROR #6**: Uporządkować voice demo mockupy (30 min)

### **🔄 Sprint 3 (Miesiąc 2)**
- [ ] **ERROR #7**: Implementować proper 404 handling (2h)
- [ ] Comprehensive testing wszystkich naprawionych funkcjonalności

---

## 🔧 **NARZĘDZIA DO WYSZUKIWANIA BŁĘDÓW**

### **Komendy grep dla dalszej analizy**:
```bash
# Puste funkcje onClick
find packages/frontend/src -name "*.tsx" -exec grep -l "onClick={() => {}}" {} \;

# Placeholder text
find packages/frontend/src -name "*.tsx" -exec grep -l "Coming Soon\|Wkrótce\|Work in Progress" {} \;

# TODO komentarze
find packages/frontend/src -name "*.tsx" -exec grep -n "TODO\|FIXME\|XXX\|HACK" {} \;

# Console.log handlers
find packages/frontend/src -name "*.tsx" -exec grep -n "onClick.*console\.log" {} \;

# Disabled buttons
find packages/frontend/src -name "*.tsx" -exec grep -n "disabled.*true" {} \;
```

---

## ✅ **OBSZARY DZIAŁAJĄCE POPRAWNIE** 

- ✅ **Smart Mailboxes** - pełna funkcjonalność z AI integration
- ✅ **GTD System** - kompletna implementacja Inbox/Processing
- ✅ **Rules Manager** - wszystkie operacje CRUD działają
- ✅ **AI Email Writer** - integracja z 3 providers + fallback
- ✅ **Voice TTS** - działające przyciski w Smart Mailboxes
- ✅ **Knowledge Base** - tworzenie dokumentów i wiki pages
- ✅ **RAG Search** - semantyczne wyszukiwanie

---

## 📊 **STATYSTYKI BŁĘDÓW**

- **🔍 Przeanalizowane pliki**: ~200 plików .tsx
- **❌ Znalezione błędy**: 7 kategorii
- **🔴 Krytyczne**: 3 błędy (natychmiastowa naprawa)
- **🟡 Średnie**: 3 błędy (2-4 tygodnie)
- **🟢 Niskie**: 1 błąd (długoterminowo)

**Szacowany czas napraw**: 10-12 godzin roboczych

---

## 🎯 **WNIOSKI**

CRM-GTD Smart ma **solidną bazę funkcjonalną** z kilkoma obszarami wymagającymi dopracowania. Większość błędów to **kosmetyczne problemy UX** niż fundamentalne błędy funkcjonalności.

**Prioritet**: Skupić się na **ERROR #1-3** jako pierwsze, ponieważ bezpośrednio wpływają na doświadczenie użytkownika.