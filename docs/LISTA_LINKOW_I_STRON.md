# Lista Linków i Stron w Aplikacji CRM-GTD-SMART

Data aktualizacji: 2025-11-29

---

## 1. LINKI W NAWIGACJI GŁÓWNEJ (streamsNavigation.ts)

### Główne linki:
| Link | Nazwa | Status |
|------|-------|--------|
| `/crm/dashboard` | Pulpit | OK |
| `/crm/dashboard/source` | Źródło | OK |
| `/crm/dashboard/streams` | Wszystkie strumienie | OK |
| `/crm/dashboard/streams-map` | Mapa strumieni | OK |
| `/crm/dashboard/streams/frozen` | Zamrożone | OK |
| `/crm/dashboard/tasks` | Zadania | OK |
| `/crm/dashboard/projects` | Projekty | OK |
| `/crm/dashboard/calendar` | Kalendarz | OK |
| `/crm/dashboard/goals` | Cele | OK |
| `/crm/dashboard/companies` | Firmy | OK |
| `/crm/dashboard/contacts` | Kontakty | OK |
| `/crm/dashboard/pipeline` | Pipeline | OK |
| `/crm/dashboard/deals` | Transakcje | OK |
| `/crm/dashboard/mailboxes` | Skrzynki | OK (redirect) |
| `/crm/dashboard/channels` | Kanały | OK (redirect) |
| `/crm/dashboard/reviews/weekly` | Przegląd tygodniowy | OK |
| `/crm/dashboard/reviews/monthly` | Przegląd miesięczny | OK |
| `/crm/dashboard/day-planner` | Day Planner | OK (redirect) |
| `/crm/dashboard/rules` | Reguły automatyzacji | OK (redirect) |
| `/crm/dashboard/ai-assistant` | Asystent AI | OK |
| `/crm/dashboard/tags` | Tagi | OK |
| `/crm/dashboard/habits` | Nawyki | OK |
| `/crm/dashboard/recurring-tasks` | Zadania cykliczne | OK |
| `/crm/dashboard/knowledge-base` | Baza wiedzy | OK |
| `/crm/dashboard/settings/profile` | Profil | OK |
| `/crm/dashboard/settings/organization` | Organizacja | OK |
| `/crm/dashboard/settings/integrations` | Integracje | OK |
| `/crm/dashboard/info` | Informacje | OK |

### Nawigacja mobilna:
| Link | Nazwa | Status |
|------|-------|--------|
| `/crm/dashboard` | Pulpit | OK |
| `/crm/dashboard/source` | Źródło | OK |
| `/crm/dashboard/streams` | Strumienie | OK |
| `/crm/dashboard/tasks` | Zadania | OK |

---

## 2. LINKI Z router.push() W KOMPONENTACH

### Linki w CommandPalette.tsx:
| Link | Status |
|------|--------|
| `/crm/dashboard` | OK |
| `/crm/dashboard/source` | OK |
| `/crm/dashboard/streams` | OK |
| `/crm/dashboard/tasks` | OK |
| `/crm/dashboard/projects` | OK |
| `/crm/dashboard/goals` | OK |
| `/crm/dashboard/companies` | OK |
| `/crm/dashboard/contacts` | OK |
| `/crm/dashboard/reviews/weekly` | OK |
| `/crm/dashboard/day-planner` | OK |
| `/crm/dashboard/source?quick-capture=true` | OK |

### Linki w innych komponentach:
| Link | Plik | Status |
|------|------|--------|
| `/crm/dashboard/gtd/next-actions` | VoiceAssistant.tsx | OK |
| `/crm/dashboard/projects` | VoiceAssistant.tsx | OK |
| `/crm/dashboard/reports` | enhanced-cards-demo | BRAK STRONY |
| `/crm/dashboard/meetings` | enhanced-cards-demo | OK |
| `/crm/dashboard/gtd/focus-modes` | gtd/focus-modes/scrum | BRAK STRONY |
| `/crm/dashboard/gtd-streams` | gtd-streams/scrum | BRAK STRONY |
| `/crm/dashboard/deals/new` | deals/kanban | BRAK STRONY |
| `/crm/dashboard/recurring-tasks/new` | recurring-tasks/calendar | BRAK STRONY |

---

## 3. WSZYSTKIE ISTNIEJĄCE STRONY (page.tsx)

### Główne strony dashboard:
```
/crm/dashboard                              - Pulpit główny
/crm/dashboard/source                       - Źródło (Inbox)
```

### Strumienie (STREAMS):
```
/crm/dashboard/streams                      - Lista strumieni
/crm/dashboard/streams/[id]                 - Szczegóły strumienia
/crm/dashboard/streams/frozen               - Zamrożone strumienie
/crm/dashboard/streams-map                  - Mapa strumieni
```

### Zadania:
```
/crm/dashboard/tasks                        - Lista zadań
/crm/dashboard/tasks/[id]                   - Szczegóły zadania
```

### Projekty:
```
/crm/dashboard/projects                     - Lista projektów
/crm/dashboard/projects/[id]                - Szczegóły projektu
/crm/dashboard/projects/burndown            - Wykres burndown
/crm/dashboard/projects/roadmap             - Roadmapa projektów
/crm/dashboard/projects/wbs-templates       - Szablony WBS
/crm/dashboard/projects/wbs-dependencies    - Zależności WBS
/crm/dashboard/project-dependencies         - Zależności między projektami
```

### Cele:
```
/crm/dashboard/goals                        - Strona celów (RZUT)
```

### CRM:
```
/crm/dashboard/companies                    - Lista firm
/crm/dashboard/companies/[id]               - Szczegóły firmy
/crm/dashboard/contacts                     - Lista kontaktów
/crm/dashboard/contacts/[id]                - Szczegóły kontaktu
/crm/dashboard/pipeline                     - Pipeline sprzedaży
/crm/dashboard/deals                        - Transakcje
/crm/dashboard/deals/[id]                   - Szczegóły transakcji
/crm/dashboard/deals/kanban                 - Kanban transakcji
/crm/dashboard/leads                        - Leady
/crm/dashboard/offers                       - Oferty
/crm/dashboard/orders                       - Zamówienia
/crm/dashboard/invoices                     - Faktury
/crm/dashboard/products                     - Produkty
/crm/dashboard/products/[id]                - Szczegóły produktu
/crm/dashboard/services                     - Usługi
/crm/dashboard/services/[id]                - Szczegóły usługi
/crm/dashboard/complaints                   - Reklamacje
```

### Komunikacja:
```
/crm/dashboard/communication                - Główna strona komunikacji
/crm/dashboard/communication/channels       - Kanały komunikacji
/crm/dashboard/communication/email-filters  - Filtry email
/crm/dashboard/communication/rules-manager  - Menedżer reguł
/crm/dashboard/mailboxes                    - Redirect do smart-mailboxes
/crm/dashboard/channels                     - Redirect do communication/channels
/crm/dashboard/smart-mailboxes              - Inteligentne skrzynki
/crm/dashboard/modern-email                 - Nowoczesny email
/crm/dashboard/email-accounts               - Konta email
/crm/dashboard/email-analysis               - Analiza email
```

### Przeglądy:
```
/crm/dashboard/reviews/weekly               - Przegląd tygodniowy
/crm/dashboard/reviews/weekly/scrum         - Scrum tygodniowy
/crm/dashboard/reviews/weekly/burndown      - Burndown tygodniowy
/crm/dashboard/reviews/monthly              - Przegląd miesięczny
/crm/dashboard/reviews/quarterly            - Przegląd kwartalny
```

### Planowanie:
```
/crm/dashboard/day-planner                  - Redirect do smart-day-planner
/crm/dashboard/smart-day-planner            - Inteligentny planer dnia
/crm/dashboard/smart-day-planner/task/[id]  - Zadanie w planerze
/crm/dashboard/calendar                     - Kalendarz
/crm/dashboard/meetings                     - Spotkania
/crm/dashboard/meetings/calendar            - Kalendarz spotkań
```

### AI i Reguły:
```
/crm/dashboard/rules                        - Redirect do rules-manager
/crm/dashboard/rules-manager                - Menedżer reguł
/crm/dashboard/ai-assistant                 - Asystent AI
/crm/dashboard/ai-rules                     - Reguły AI
/crm/dashboard/ai-management                - Zarządzanie AI
/crm/dashboard/recommendations              - Rekomendacje AI
```

### Organizacja:
```
/crm/dashboard/tags                         - Tagi
/crm/dashboard/habits                       - Nawyki
/crm/dashboard/recurring-tasks              - Zadania cykliczne
/crm/dashboard/recurring-tasks/calendar     - Kalendarz zadań cyklicznych
/crm/dashboard/knowledge-base               - Baza wiedzy
/crm/dashboard/knowledge                    - Wiedza
/crm/dashboard/knowledge/documents/[id]     - Dokument
/crm/dashboard/knowledge/wiki/[slug]        - Wiki
/crm/dashboard/knowledge-status             - Status wiedzy
```

### Ustawienia:
```
/crm/dashboard/settings                     - Redirect do settings/profile
/crm/dashboard/settings/profile             - Profil użytkownika
/crm/dashboard/settings/organization        - Ustawienia organizacji
/crm/dashboard/settings/integrations        - Integracje
/crm/dashboard/info                         - Informacje o aplikacji
```

### GTD (stare - z redirectami):
```
/crm/dashboard/gtd/inbox                    - Inbox GTD
/crm/dashboard/gtd/next-actions             - Następne akcje
/crm/dashboard/gtd/next-actions/kanban      - Kanban następnych akcji
/crm/dashboard/gtd/waiting-for              - Oczekujące
/crm/dashboard/gtd/someday-maybe            - Kiedyś/może
/crm/dashboard/gtd/contexts                 - Konteksty
/crm/dashboard/gtd/focus-modes/scrum        - Tryb Scrum
```

### GTD Streams (stare):
```
/crm/dashboard/gtd-streams/scrum            - Scrum strumieni
/crm/dashboard/gtd-horizons/roadmap         - Roadmapa horyzontów
```

### Areas:
```
/crm/dashboard/areas                        - Obszary
/crm/dashboard/areas/roadmap                - Roadmapa obszarów
```

### Inne funkcje:
```
/crm/dashboard/delegated                    - Delegowane zadania
/crm/dashboard/unimportant                  - Nieważne elementy
/crm/dashboard/task-history                 - Historia zadań
/crm/dashboard/task-relationships           - Relacje zadań
/crm/dashboard/timeline                     - Oś czasu
/crm/dashboard/analytics                    - Analityka
/crm/dashboard/metadata                     - Metadane
/crm/dashboard/files                        - Pliki
/crm/dashboard/users                        - Użytkownicy
/crm/dashboard/views                        - Widoki
```

### Demo i testy:
```
/crm/dashboard/enhanced-cards-demo          - Demo kart
/crm/dashboard/modern-ui-demo               - Demo UI
/crm/dashboard/views-demo                   - Demo widoków
/crm/dashboard/graph-demo                   - Demo grafów
/crm/dashboard/phase2-demo                  - Demo Phase 2
/crm/dashboard/universal-search             - Uniwersalne wyszukiwanie
/crm/dashboard/universal-search-demo        - Demo wyszukiwania
/crm/dashboard/voice-assistant              - Asystent głosowy
/crm/dashboard/voice-demo                   - Demo głosowe
/crm/dashboard/voice-rag                    - Voice RAG
/crm/dashboard/rag-search                   - RAG Search
/crm/dashboard/smart                        - Smart dashboard
/crm/dashboard/smart-analysis               - Smart analiza
/crm/dashboard/smart-templates              - Smart szablony
/crm/dashboard/smart-improvements           - Smart ulepszenia
```

### Admin:
```
/crm/dashboard/admin/bug-reports            - Raporty błędów
```

---

## 4. PORÓWNANIE - LINKI BEZ STRON (POTENCJALNE 404)

| Link | Używany w | Problem |
|------|-----------|---------|
| `/crm/dashboard/reports` | enhanced-cards-demo | Brak strony |
| `/crm/dashboard/gtd/focus-modes` | gtd/focus-modes/scrum | Brak strony (istnieje tylko /scrum) |
| `/crm/dashboard/deals/new` | deals/kanban | Brak strony (brak formularza) |
| `/crm/dashboard/recurring-tasks/new` | recurring-tasks/calendar | Brak strony |
| `/crm/dashboard/analysis` | urlRedirects | Brak strony |
| `/crm/dashboard/templates` | urlRedirects | Brak strony |
| `/crm/dashboard/gtd-map` | urlRedirects | Brak strony |
| `/crm/dashboard/gtd-buckets` | urlRedirects | Redirect do /streams (OK) |

---

## 5. STRONY ORPHAN (BEZ LINKÓW W NAWIGACJI)

Te strony istnieją, ale nie są dostępne z głównej nawigacji:

### Widoczne tylko przez URL:
- `/crm/dashboard/admin/bug-reports`
- `/crm/dashboard/analytics`
- `/crm/dashboard/areas`
- `/crm/dashboard/areas/roadmap`
- `/crm/dashboard/complaints`
- `/crm/dashboard/delegated`
- `/crm/dashboard/email-accounts`
- `/crm/dashboard/email-analysis`
- `/crm/dashboard/enhanced-cards-demo`
- `/crm/dashboard/files`
- `/crm/dashboard/graph-demo`
- `/crm/dashboard/gtd/*` (wszystkie stare GTD)
- `/crm/dashboard/gtd-horizons/roadmap`
- `/crm/dashboard/gtd-streams/scrum`
- `/crm/dashboard/invoices`
- `/crm/dashboard/knowledge`
- `/crm/dashboard/knowledge-status`
- `/crm/dashboard/leads`
- `/crm/dashboard/metadata`
- `/crm/dashboard/modern-email`
- `/crm/dashboard/modern-ui-demo`
- `/crm/dashboard/offers`
- `/crm/dashboard/orders`
- `/crm/dashboard/phase2-demo`
- `/crm/dashboard/products`
- `/crm/dashboard/project-dependencies`
- `/crm/dashboard/rag-search`
- `/crm/dashboard/recommendations`
- `/crm/dashboard/reviews/quarterly`
- `/crm/dashboard/services`
- `/crm/dashboard/smart`
- `/crm/dashboard/smart-analysis`
- `/crm/dashboard/smart-improvements`
- `/crm/dashboard/smart-mailboxes`
- `/crm/dashboard/smart-templates`
- `/crm/dashboard/task-history`
- `/crm/dashboard/task-relationships`
- `/crm/dashboard/timeline`
- `/crm/dashboard/unimportant`
- `/crm/dashboard/universal-search`
- `/crm/dashboard/universal-search-demo`
- `/crm/dashboard/users`
- `/crm/dashboard/views`
- `/crm/dashboard/views-demo`
- `/crm/dashboard/voice-assistant`
- `/crm/dashboard/voice-demo`
- `/crm/dashboard/voice-rag`

---

## 6. PODSUMOWANIE

### Statystyki:
- **Linki w nawigacji:** 28
- **Wszystkie strony (page.tsx):** 100+
- **Strony z redirectami:** 6
- **Linki 404 (do naprawy):** 6
- **Strony orphan:** 40+

### Rekomendacje:
1. Utworzyć brakujące strony dla linków 404
2. Dodać linki w nawigacji do ważnych stron orphan
3. Rozważyć usunięcie nieużywanych stron demo
4. Skonsolidować stare strony GTD z nowymi STREAMS
