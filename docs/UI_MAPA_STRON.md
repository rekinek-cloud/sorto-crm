# Sorto CRM — Mapa UI do przeprojektowania

> Plik referencyjny: pelna struktura menu + lista wszystkich stron z opisami.
> Zrodlo danych: `src/config/streamsNavigation.ts` + `src/app/[locale]/dashboard/**/page.tsx`
> Data: 2026-02-18

---

## CZESC 1: STRUKTURA MENU (sidebar)

Ikony: Phosphor React (duotone). Nawigacja w `src/config/streamsNavigation.ts`.

```
PULPIT                          House           /dashboard
ZRODLO                          CircleDashed    /dashboard/source              [badge: count]

STRUMIENIE                      Waves
  ├─ Wszystkie strumienie       Waves           /dashboard/streams
  ├─ Mapa strumieni             TreeStructure   /dashboard/streams-map
  └─ Zamrozone                  Snowflake       /dashboard/streams/frozen

ZADANIA                         CheckSquare     /dashboard/tasks

PROJEKTY                        Folder
  ├─ Wszystkie projekty         Folder          /dashboard/projects
  └─ Zaleznosci                 GitFork         /dashboard/project-dependencies

KALENDARZ                       Calendar        /dashboard/calendar

CELE                            Target
  ├─ Cele                       Target          /dashboard/goals
  ├─ Szablony SMART             ListPlus        /dashboard/smart-templates
  ├─ Ulepszenia SMART           TrendUp         /dashboard/smart-improvements
  └─ Analiza SMART              ChartLine       /dashboard/smart-analysis

CRM                             Buildings
  ├─ Firmy                      Buildings       /dashboard/companies
  ├─ Kontakty                   Users           /dashboard/contacts
  ├─ Leady                      UserPlus        /dashboard/leads
  ├─ Pipeline                   Funnel          /dashboard/pipeline
  ├─ Transakcje                 Handshake       /dashboard/deals
  ├─ Pipeline Analytics         ChartLine       /dashboard/analytics/pipeline
  └─ Eventy                     MapPin          /dashboard/events

CRM ANALIZA                     Brain
  ├─ Wywiad klienta             Brain           /dashboard/client-intelligence
  ├─ Zdrowie relacji            Heart           /dashboard/health-score
  ├─ Mapa decyzji               Compass         /dashboard/decision-map
  ├─ Konkurencja                Sword           /dashboard/competition
  ├─ Kamienie milowe            Flag            /dashboard/milestones
  ├─ Relacje kontaktow          UsersThree      /dashboard/contact-relations
  └─ Produkty klienta           ShoppingBag     /dashboard/client-products

SPRZEDAZ                        ShoppingCart
  ├─ Produkty                   Package         /dashboard/products
  ├─ Uslugi                     Wrench          /dashboard/services
  ├─ Oferty                     FileText        /dashboard/offers
  ├─ Zamowienia                 ShoppingCart     /dashboard/orders
  ├─ Faktury                    Receipt         /dashboard/invoices
  └─ Reklamacje                 WarningCircle   /dashboard/complaints

KOMUNIKACJA                     Envelope
  ├─ Skrzynki                   Tray            /dashboard/smart-mailboxes
  ├─ Kanaly                     ChatCircle      /dashboard/communication/channels
  ├─ Napisz email               PencilSimple    /dashboard/modern-email
  ├─ Filtry email               FunnelSimple    /dashboard/communication/email-filters
  ├─ Reguly komunikacji         ListChecks      /dashboard/communication/rules-manager
  ├─ Auto-odpowiedzi            EnvelopeSimple  /dashboard/auto-replies
  ├─ Pipeline email             Kanban          /dashboard/email-pipeline
  ├─ Analiza email              ChartBar        /dashboard/email-analysis
  └─ Spotkania                  VideoCamera     /dashboard/meetings

PRZEGLADY                       ChartBar
  ├─ Produktywnosc              ChartLine       /dashboard/productivity
  ├─ Tygodniowy                 CalendarBlank   /dashboard/reviews/weekly
  ├─ Miesieczny                 Calendar        /dashboard/reviews/monthly
  └─ Kwartalny                  CalendarCheck   /dashboard/reviews/quarterly

AI                              Robot
  ├─ AI Asystent                Robot           /dashboard/ai-assistant
  ├─ AI Chat                    ChatCircle      /dashboard/ai-chat
  ├─ Gemini                     Sparkle         /dashboard/gemini
  ├─ AI Agenci                  Robot           /dashboard/ai-agents
  ├─ AI Insights                Sparkle         /dashboard/ai-insights
  └─ Rekomendacje               Lightbulb       /dashboard/recommendations

NARZEDZIA AI                    Sparkle
  ├─ Reguly AI                  Sparkle         /dashboard/ai-rules
  ├─ Providerzy AI              Sliders         /dashboard/admin/ai-config
  ├─ Pipeline AI                Sliders         /dashboard/admin/pipeline-config
  ├─ Reguly uniwersalne         FlowArrow       /dashboard/universal-rules
  ├─ Flow Engine                FlowArrow       /dashboard/flow
  ├─ Voice TTS                  Microphone      /dashboard/voice
  └─ Voice Assistant            Microphone      /dashboard/voice-assistant

WYSZUKIWANIE                    MagnifyingGlass
  ├─ Wyszukiwarka               MagnifyingGlass /dashboard/universal-search
  ├─ RAG Search                 MagnifyingGlassMinus /dashboard/rag-search
  └─ Graf relacji               Graph           /dashboard/graph

ORGANIZACJA                     Tag
  ├─ Tagi                       Tag             /dashboard/tags
  ├─ Konteksty                  At              /dashboard/contexts
  ├─ Nawyki                     Lightning       /dashboard/habits
  ├─ Zadania cykliczne          ArrowsClockwise /dashboard/recurring-tasks
  ├─ Delegowane                 UserSwitch      /dashboard/delegated
  ├─ Obszary                    Stack           /dashboard/areas
  └─ Szablony                   Article         /dashboard/templates

WIEDZA                          BookOpen
  ├─ Baza wiedzy                BookOpen        /dashboard/knowledge-base
  ├─ Dokumenty                  Files           /dashboard/knowledge
  ├─ Status wiedzy              Database        /dashboard/knowledge-status
  └─ Pliki                      Folder          /dashboard/files

ANALITYKA                       ChartPie
  ├─ Dashboard                  ChartBar        /dashboard/analytics
  ├─ Analiza                    ChartLine       /dashboard/analysis
  ├─ Raporty                    ClipboardText   /dashboard/reports
  ├─ Timeline                   Timer           /dashboard/timeline
  ├─ Historia zadan             ClockCounterClockwise /dashboard/task-history
  └─ Relacje zadan              GitBranch       /dashboard/task-relationships

ZESPOL                          UsersThree
  ├─ Struktura                  Buildings       /dashboard/holding
  ├─ Czlonkowie                 UsersThree      /dashboard/team
  ├─ Uzytkownicy                Users           /dashboard/users
  └─ Hierarchia                 TreeStructure   /dashboard/team/hierarchy

USTAWIENIA                      Gear
  ├─ Profil                     Users           /dashboard/settings/profile
  ├─ Organizacja                Buildings       /dashboard/settings/organization
  ├─ Branding                   Palette         /dashboard/settings/branding
  ├─ Pola niestandardowe        Sliders         /dashboard/settings/custom-fields
  ├─ Konta email                At              /dashboard/email-accounts
  ├─ Integracje                 Lightning       /dashboard/settings/integrations
  ├─ Platnosci                  CreditCard      /dashboard/billing
  ├─ Moduly                     Cube            /dashboard/modules
  └─ Metadane                   Table           /dashboard/metadata

ADMINISTRACJA                   ShieldCheck
  ├─ Infrastruktura             HardDrives      /dashboard/infrastructure
  ├─ Klucze MCP                 Key             /dashboard/admin/mcp-keys
  ├─ Zgloszenia bledow          Bug             /dashboard/admin/bug-reports
  └─ Informacje                 Info            /dashboard/info

SORTO (wewnetrzne)              Sparkle
  ├─ Coding Center              Terminal        /dashboard/coding-center
  ├─ AI Conversations           ChatCircle      /dashboard/ai-sync
  └─ Dev Hub                    HardDrives      /dashboard/admin/dev-hub
```

### Mobile bottom navigation

```
Pulpit      Zrodlo      Strumienie      Zadania      Wiecej
House       CircleDashed  Waves         CheckSquare  Gear
```

### Przekierowania (stare URL → nowe)

```
/dashboard/gtd/inbox           →  /dashboard/source
/dashboard/gtd/next-actions    →  /dashboard/tasks
/dashboard/gtd/waiting-for     →  /dashboard/tasks?status=waiting
/dashboard/gtd/someday-maybe   →  /dashboard/streams/frozen
/dashboard/gtd/contexts        →  /dashboard/tags
/dashboard/gtd-streams         →  /dashboard/streams
/dashboard/gtd-map             →  /dashboard/streams-map
/dashboard/gtd-buckets         →  /dashboard/streams
/dashboard/gtd-horizons        →  /dashboard/goals
/dashboard/smart-day-planner   →  /dashboard/day-planner
```

---

## CZESC 2: WSZYSTKIE STRONY (155 dashboard + 11 publicznych)

### CORE — Pulpit i Strumienie

| Sciezka | Opis |
|---------|------|
| `/dashboard` | Glowny pulpit dnia: poranny briefing AI, focus tasks, aktywne strumienie, deale, follow-upy, aktywnosc zespolu |
| `/dashboard/source` | Zrodlo — punkt zbierania wszystkiego. Quick capture, 11 typow zrodel, quick actions (DO/DEFER/DELETE), statystyki przetwarzania |
| `/dashboard/streams` | Manager strumieni — lista z filtrami po roli/statusie/typie, dashboard statystyk, tworzenie nowych strumieni |
| `/dashboard/streams/[id]` | Szczegoly strumienia — zasoby, zadania, konfiguracja roli, timeline, powiazane cele |
| `/dashboard/streams/frozen` | Zamrozone strumienie (SOMEDAY_MAYBE) — przegladanie z mozliwoscia odmrozenia |
| `/dashboard/streams-map` | Wizualizacja hierarchii strumieni — drzewo z CTE, relacje parent-child, breadcrumbs |

### ZADANIA

| Sciezka | Opis |
|---------|------|
| `/dashboard/tasks` | Lista wszystkich zadan z filtrami (status, priorytet, kontekst, strumien, energia). Sortowanie, bulk actions |
| `/dashboard/tasks/[id]` | Szczegoly zadania — edycja, komentarze, powiazania, historia, delegowanie |

### PROJEKTY

| Sciezka | Opis |
|---------|------|
| `/dashboard/projects` | Lista projektow z kartami, filtrowanie po statusie, przyciski AI Analysis |
| `/dashboard/projects/[id]` | Szczegoly projektu — zadania, milestone, zespol, budzet, analiza AI (SMART, ryzyko) |
| `/dashboard/projects/roadmap` | Widok roadmapy — gantt-like timeline projektow |
| `/dashboard/projects/burndown` | Wykresy burndown — postep vs plan |
| `/dashboard/projects/wbs-dependencies` | Work Breakdown Structure — drzewo zaleznosci zadan |
| `/dashboard/projects/wbs-templates` | Szablony WBS — gotowe struktury projektow |
| `/dashboard/project-dependencies` | Zaleznosci miedzy projektami — graf finish-to-start, start-to-start |

### KALENDARZ

| Sciezka | Opis |
|---------|------|
| `/dashboard/calendar` | Kalendarz — widok miesieczny/tygodniowy, wydarzenia, zadania z deadline, spotkania |
| `/dashboard/day-planner` | Planowanie dnia — bloki czasowe, energy tracking, przypisywanie zadan |

### CELE

| Sciezka | Opis |
|---------|------|
| `/dashboard/goals` | Cele RZUT — lista celow precyzyjnych, progress bary, statystyki (aktywne/osiagniete/failed) |
| `/dashboard/smart-templates` | Szablony SMART — gotowe szablony celow z kryteriami |
| `/dashboard/smart-improvements` | Ulepszenia SMART — sledzenie postepow w doskonaleniu celow |
| `/dashboard/smart-analysis` | Analiza SMART — metryki i wykresy realizacji celow |

### CRM

| Sciezka | Opis |
|---------|------|
| `/dashboard/companies` | Lista firm — wyszukiwanie, filtrowanie, NIP lookup, tagi, sortowanie |
| `/dashboard/companies/[id]` | Szczegoly firmy — kontakty, deale, historia, inteligencja kliencka, produkty, timeline |
| `/dashboard/contacts` | Lista kontaktow — wyszukiwanie, filtrowanie po firmie/tagu, import |
| `/dashboard/contacts/[id]` | Szczegoly kontaktu — relacje, firmy, deale, historia komunikacji, analiza AI |
| `/dashboard/leads` | Leady sprzedazowe — pipeline (NEW→CONTACTED→QUALIFIED→WON/LOST), filtrowanie |
| `/dashboard/pipeline` | Pipeline widok — etapy transakcji, kanban/lista, metryki konwersji |
| `/dashboard/deals` | Lista transakcji — filtrowanie po etapie/wartosci/firmie |
| `/dashboard/deals/[id]` | Szczegoly transakcji — stakeholderzy, konkurencja, oferty, historia, health score |
| `/dashboard/deals/new` | Nowa transakcja — formularz tworzenia z powiazaniem do firmy/kontaktu/pipeline |
| `/dashboard/deals/kanban` | Kanban transakcji — drag & drop miedzy etapami pipeline |
| `/dashboard/analytics/pipeline` | Analityka pipeline — win rate, sredni czas, wartosci per etap |
| `/dashboard/events` | Lista eventow — targi, konferencje, spotkania. CRUD z firmami/zespolem/wydatkami |
| `/dashboard/events/[id]` | Szczegoly eventu — firmy uczestniczace, zespol, budzet, wydatki, kontakty |

### CRM ANALIZA

| Sciezka | Opis |
|---------|------|
| `/dashboard/client-intelligence` | Wywiad kliencki — 10 kategorii (LIKES, DISLIKES, BUDGET, DECISION_PROCESS...) per firma |
| `/dashboard/health-score` | Zdrowie relacji — wielowymiarowy scoring (engagement, response, satisfaction, growth, risk) |
| `/dashboard/decision-map` | Mapa decydentow — stakeholderzy w transakcjach, wplyw, sentyment, rola |
| `/dashboard/competition` | Analiza konkurencji — konkurenci per deal, threat level, win strategy |
| `/dashboard/milestones` | Kamienie milowe — kluczowe punkty w projektach i dealach |
| `/dashboard/contact-relations` | Relacje miedzy kontaktami — COLLEAGUE, MANAGER, FRIEND, COMPETITOR, sila relacji |
| `/dashboard/client-products` | Produkty klienta — historia zakupow per firma, statystyki, trendy |

### SPRZEDAZ

| Sciezka | Opis |
|---------|------|
| `/dashboard/products` | Katalog produktow — CRUD, SKU, ceny, kategorie, stany magazynowe |
| `/dashboard/products/[id]` | Szczegoly produktu — warianty, historia zamowien, statystyki |
| `/dashboard/services` | Lista uslug — CRUD, typy rozliczen (per_hour, fixed, subscription...) |
| `/dashboard/services/[id]` | Szczegoly uslugi — konfiguracja, historia, klienci |
| `/dashboard/offers` | Oferty — tworzenie z produktow/uslug, statusy (DRAFT→SENT→ACCEPTED/REJECTED) |
| `/dashboard/orders` | Zamowienia — lista, statusy (NEW→CONFIRMED→SHIPPED→DELIVERED) |
| `/dashboard/invoices` | Faktury — integracja Fakturownia, statusy (DRAFT→SENT→PAID/OVERDUE) |
| `/dashboard/complaints` | Reklamacje — zgloszenia, statusy, powiazania z zamowieniami |

### KOMUNIKACJA

| Sciezka | Opis |
|---------|------|
| `/dashboard/smart-mailboxes` | GLOWNY HUB — zakladki per skrzynka, 9 filtrow, rozwijany podglad, reply/forward, integracja ze Strumieniami, Voice TTS, AI analysis |
| `/dashboard/email` | Podstawowy widok emaili — prostsza wersja smart mailboxes |
| `/dashboard/modern-email` | Kompozytor emaili — pisanie z szablonami, podpowiedziami AI |
| `/dashboard/email-accounts` | Konfiguracja kont email — IMAP/Gmail, synchronizacja, interwaly |
| `/dashboard/email-pipeline` | Pipeline emailowy — wizualizacja 5-etapowego przetwarzania, logi, statystyki |
| `/dashboard/email-analysis` | Analiza emaili — statystyki klasyfikacji, kategorie triage, efektywnosc |
| `/dashboard/communication/channels` | Kanaly komunikacji — email, chat, phone, konfiguracja per kanal |
| `/dashboard/communication/email-filters` | Filtry emaili — reguly filtrowania, blacklist/whitelist domen |
| `/dashboard/communication/rules-manager` | Reguly komunikacji — zunifikowane zarzadzanie regulami przetwarzania |
| `/dashboard/auto-replies` | Auto-odpowiedzi — konfiguracja automatycznych odpowiedzi per regula |
| `/dashboard/meetings` | Spotkania — lista, planowanie, notatki |
| `/dashboard/meetings/calendar` | Kalendarz spotkan — widok kalendarza dedykowany spotkaniom |

### PRZEGLADY

| Sciezka | Opis |
|---------|------|
| `/dashboard/productivity` | Metryki produktywnosci — completion rate, energy patterns, streaks |
| `/dashboard/reviews/weekly` | Przeglad tygodniowy — przeglad tygodniowy, co zrobiono, co czeka, problemy |
| `/dashboard/reviews/weekly/burndown` | Burndown tygodniowy — wykres postepow w tygodniu |
| `/dashboard/reviews/weekly/scrum` | Scrum view — sprint-like widok tygodnia |
| `/dashboard/reviews/monthly` | Przeglad miesieczny — cele, postepy, trendy, rekomendacje |
| `/dashboard/reviews/quarterly` | Przeglad kwartalny — OKR, strategia, dlugookresowe trendy |

### AI

| Sciezka | Opis |
|---------|------|
| `/dashboard/ai-assistant` | Asystent AI — interfejs konwersacyjny, kontekst CRM, sugestie akcji |
| `/dashboard/ai-chat` | AI Chat — wieloturowa rozmowa z AI o danych w CRM |
| `/dashboard/gemini` | Integracja Gemini — Google AI interfejs |
| `/dashboard/ai-agents` | Lista agentow AI — konfiguracja specjalizowanych agentow |
| `/dashboard/ai-agents/[id]` | Szczegoly agenta — parametry, historia, metryki |
| `/dashboard/ai-insights` | Insighty AI — automatycznie generowane spostrzezenia z danych |
| `/dashboard/recommendations` | Rekomendacje AI — sugestie celow, zadan, optymalizacji |

### NARZEDZIA AI

| Sciezka | Opis |
|---------|------|
| `/dashboard/ai-rules` | Reguly AI — CRUD regul automatyzacji (warunki, akcje, model, fallback) |
| `/dashboard/ai-rules/[id]` | Szczegoly reguly AI — edycja, historia wykonan, statystyki |
| `/dashboard/ai-rules/domain-lists` | Listy domen — blacklist/whitelist dla pipeline emailowego |
| `/dashboard/admin/ai-config` | Konfiguracja AI — providerzy (OpenAI, Anthropic, Qwen), modele, akcje AI |
| `/dashboard/admin/pipeline-config` | Konfiguracja pipeline — ustawienia per etap przetwarzania emaili |
| `/dashboard/universal-rules` | Reguly uniwersalne — cross-module automation rules |
| `/dashboard/flow` | Flow Engine — wizualne przetwarzanie elementow ze Zrodla z AI |
| `/dashboard/flow/autopilot` | Autopilot — historia automatycznych akcji, cofanie, monitoring |
| `/dashboard/flow/conversation` | Flow Conversation — dialog z AI o przetwarzanym elemencie |
| `/dashboard/voice` | Voice TTS — konfiguracja syntezy mowy, modele, testowanie |
| `/dashboard/voice-assistant` | Asystent glosowy — komendy glosowe, rozpoznawanie mowy |
| `/dashboard/voice-rag` | Voice + RAG — glosowe wyszukiwanie semantyczne |

### WYSZUKIWANIE

| Sciezka | Opis |
|---------|------|
| `/dashboard/universal-search` | Wyszukiwarka uniwersalna — full-text po wszystkich encjach (tasks, projects, contacts, deals...) |
| `/dashboard/rag-search` | RAG Search — wyszukiwanie semantyczne z AI odpowiedziami, filtry po typie/dacie |
| `/dashboard/rag` | System RAG — zarzadzanie zrodlami, status indeksowania, statystyki |
| `/dashboard/graph` | Graf relacji — wizualizacja powiazn miedzy encjami (firmy, kontakty, deale, strumienie) |

### ORGANIZACJA

| Sciezka | Opis |
|---------|------|
| `/dashboard/tags` | Tagi — CRUD tagow, przypisywanie do encji, kolorowanie |
| `/dashboard/contexts` | Konteksty — @computer, @calls, @office, @home itd. Filtrowanie zadan |
| `/dashboard/habits` | Nawyki — sledzenie regularnych aktywnosci, streaki, statystyki |
| `/dashboard/recurring-tasks` | Zadania cykliczne — DAILY/WEEKLY/MONTHLY/YEARLY, konfiguracja, historia |
| `/dashboard/recurring-tasks/new` | Nowe zadanie cykliczne — formularz z czestotliwoscia, czasem, strumieniem |
| `/dashboard/recurring-tasks/calendar` | Kalendarz zadan cyklicznych — widok kalendarza z powtarzalnymi zadaniami |
| `/dashboard/delegated` | Delegowane — zadania przypisane do innych, follow-up, statusy |
| `/dashboard/areas` | Obszary odpowiedzialnosci — cigle strumienie (Zdrowie, Finanse, Kariera...) |
| `/dashboard/areas/roadmap` | Roadmap obszarow — dlugoterminowy widok celow per obszar |
| `/dashboard/templates` | Szablony — gotowe struktury zadan i projektow do wielokrotnego uzycia |

### WIEDZA

| Sciezka | Opis |
|---------|------|
| `/dashboard/knowledge-base` | Hub bazy wiedzy — przeglad dokumentow, wiki, wyszukiwanie |
| `/dashboard/knowledge` | Dokumenty — lista z 10 typami (NOTE, ARTICLE, GUIDE...), CRUD, foldery |
| `/dashboard/knowledge/documents/[id]` | Szczegoly dokumentu — tresc, komentarze, wersjonowanie |
| `/dashboard/knowledge/wiki/[slug]` | Strona wiki — pelna tresc, kategoria, public toggle |
| `/dashboard/knowledge-status` | Status wiedzy — pokrycie indeksowania, brakujace dokumenty, metryki |
| `/dashboard/files` | Pliki — upload, przechowywanie, przeglad, powiazania z encjami |

### ANALITYKA

| Sciezka | Opis |
|---------|------|
| `/dashboard/analytics` | Dashboard analityczny — wykresy, KPI, trendy |
| `/dashboard/analysis` | Szczegolowa analiza — drill-down po metrykach |
| `/dashboard/reports` | Raporty — generowanie raportow, eksport |
| `/dashboard/timeline` | Timeline — chronologiczna historia aktywnosci w systemie |
| `/dashboard/task-history` | Historia zadan — archiwum ukonczonych/anulowanych zadan |
| `/dashboard/task-relationships` | Relacje zadan — graf zaleznosci FINISH_TO_START, BLOCKS itp. |

### ZESPOL

| Sciezka | Opis |
|---------|------|
| `/dashboard/holding` | Struktura holdingu — organizacje, spolki, multi-tenant |
| `/dashboard/team` | Czlonkowie zespolu — lista, role, statystyki aktywnosci |
| `/dashboard/team/hierarchy` | Hierarchia zespolu — drzewo MANAGES/LEADS/MENTORS/SUPERVISES |
| `/dashboard/users` | Zarzadzanie uzytkownikami — CRUD, role RBAC, zaproszenia |

### USTAWIENIA

| Sciezka | Opis |
|---------|------|
| `/dashboard/settings` | Hub ustawien — przeglad wszystkich konfiguracji |
| `/dashboard/settings/profile` | Profil uzytkownika — dane osobowe, avatar, haslo, preferencje |
| `/dashboard/settings/organization` | Organizacja — nazwa, domena, logo, limity, subskrypcja |
| `/dashboard/settings/branding` | Branding — kolory, logo, favicon, customowe style |
| `/dashboard/settings/custom-fields` | Pola niestandardowe — dodatkowe pola per encja (kontakt, firma, deal...) |
| `/dashboard/settings/flow` | Ustawienia Flow — auto-analiza, interwaly, modele AI |
| `/dashboard/settings/pipeline` | Ustawienia pipeline — etapy, prawdopodobienstwa, konfiguracja per stage |
| `/dashboard/settings/industries` | Branże — szablony branzowe, domyslne pipeline i konfiguracje |
| `/dashboard/settings/integrations` | Integracje — zewnetrzne serwisy, webhooks, API keys |
| `/dashboard/email-accounts` | Konta email — IMAP/Gmail setup, synchronizacja, interwaly |
| `/dashboard/billing` | Platnosci — plan, faktury, metody platnosci, Stripe |
| `/dashboard/billing/success` | Potwierdzenie platnosci — callback po udanej transakcji |
| `/dashboard/modules` | Moduly — wlaczanie/wylaczanie funkcjonalnosci systemu |
| `/dashboard/metadata` | Metadane — konfiguracja pol, enumow, domyslnych wartosci |

### ADMINISTRACJA

| Sciezka | Opis |
|---------|------|
| `/dashboard/infrastructure` | Infrastruktura — status kontenerow, health checks, metryki |
| `/dashboard/admin/mcp-keys` | Klucze MCP — tworzenie/odwoywanie API keys dla ChatGPT/MCP |
| `/dashboard/admin/bug-reports` | Zgloszenia bledow — lista bugow, statusy, priorytetyzacja |
| `/dashboard/info` | Informacje systemowe — wersja, licencja, dokumentacja |

### SORTO (wewnetrzne/dev)

| Sciezka | Opis |
|---------|------|
| `/dashboard/coding-center` | Coding Center — narzedzia deweloperskie, konsola |
| `/dashboard/ai-sync` | AI Conversations — logi i synchronizacja rozmow AI |
| `/dashboard/admin/dev-hub` | Dev Hub — panel deweloperski, diagnostyka |

### LEGACY/REDIRECT (strony ze starym routingiem — przekierowuja do nowych)

| Sciezka | Przekierowanie do | Opis |
|---------|-------------------|------|
| `/dashboard/gtd/inbox` | `/dashboard/source` | Stare Zrodlo (Inbox) |
| `/dashboard/gtd/next-actions` | `/dashboard/tasks` | Stare Next Actions |
| `/dashboard/gtd/next-actions/kanban` | `/dashboard/tasks` | Kanban next actions |
| `/dashboard/gtd/waiting-for` | `/dashboard/tasks?status=waiting` | Stare Waiting For |
| `/dashboard/gtd/someday-maybe` | `/dashboard/streams/frozen` | Stare Someday/Maybe |
| `/dashboard/gtd/contexts` | `/dashboard/tags` | Stare konteksty strumieni |
| `/dashboard/gtd` | `/dashboard/streams` | Stary hub strumieni |
| `/dashboard/gtd/energy` | — | Sledzenie energii |
| `/dashboard/gtd/focus-modes` | — | Tryby skupienia |
| `/dashboard/gtd/focus-modes/scrum` | — | Scrum focus mode |
| `/dashboard/gtd-streams` | `/dashboard/streams` | Stare Strumienie |
| `/dashboard/gtd-streams/scrum` | — | Scrum streams |
| `/dashboard/gtd-map` | `/dashboard/streams-map` | Stara mapa strumieni |
| `/dashboard/gtd-buckets` | `/dashboard/streams` | Stare buckety strumieni |
| `/dashboard/gtd-horizons` | `/dashboard/goals` | Stare horyzonty strumieni |
| `/dashboard/gtd-horizons/roadmap` | — | Roadmap horyzontow |
| `/dashboard/smart-day-planner` | `/dashboard/day-planner` | Stary Smart Day Planner |
| `/dashboard/smart-day-planner/task/[id]` | — | Szczegoly zadania plannera |

### STRONY BEZ MENU (istniejace ale nie widoczne w nawigacji)

| Sciezka | Opis |
|---------|------|
| `/dashboard/inbox` | Alternatywny inbox (starszy) |
| `/dashboard/unimportant` | Wiadomosci oznaczone jako nieistotne |
| `/dashboard/mailboxes` | Starszy widok skrzynek (zastapiony smart-mailboxes) |
| `/dashboard/channels` | Starszy widok kanalow (zastapiony communication/channels) |
| `/dashboard/search` | Starszy widok wyszukiwania |
| `/dashboard/rules-manager` | Starszy rules manager (zastapiony communication/rules-manager) |
| `/dashboard/rules` | Starszy widok regul |
| `/dashboard/smart` | Starsza strona SMART |
| `/dashboard/communication` | Hub komunikacji (zastapiony smart-mailboxes) |
| `/dashboard/ai-management` | Starsze zarzadzanie AI |
| `/dashboard/ai-prompts` | Edycja promptow AI (niewidoczna w menu, dostepna z ai-rules) |
| `/dashboard/app/[slug]` | Dynamiczne strony aplikacji |

### STRONY PUBLICZNE (poza dashboardem)

| Sciezka | Opis |
|---------|------|
| `/` | Strona glowna — landing page |
| `/auth/login` | Logowanie — email + haslo |
| `/auth/register` | Rejestracja — nowe konto |
| `/auth/sso` | SSO — logowanie jednorazowym tokenem |
| `/auth/forgot-password` | Reset hasla — formularz odzyskiwania |
| `/onboarding` | Onboarding — kreator pierwszej konfiguracji |
| `/pricing` | Cennik — plany subskrypcji |
| `/contact` | Kontakt — formularz kontaktowy |
| `/support` | Wsparcie — FAQ, pomoc |
| `/privacy` | Polityka prywatnosci |
| `/terms` | Regulamin |

---

## CZESC 3: STATYSTYKI

```
Pozycji w menu (top-level):        22
Pozycji w menu (razem z children): 88
Stron dashboard (unikalne):        ~155
Stron legacy/redirect:             ~18
Stron bez menu:                    ~12
Stron publicznych:                 11
────────────────────────────────────
RAZEM stron:                       ~196
```

### Grupy tematyczne (ilosc stron)

```
CRM (firmy, kontakty, deale, pipeline, eventy)     13
CRM Analiza (intelligence, health, competition)      7
Sprzedaz (produkty, uslugi, oferty, faktury)         8
Komunikacja (email, skrzynki, reguly, spotkania)    12
Strumienie + Zrodlo                                  6
Zadania                                              2
Projekty                                             7
Cele + SMART                                         4
Przeglady                                            6
AI (asystent, chat, agenci, insights)                7
Narzedzia AI (reguly, flow, voice, config)          12
Wyszukiwanie + RAG                                   4
Organizacja (tagi, konteksty, nawyki, cykliczne)    10
Wiedza (dokumenty, wiki, pliki)                      6
Analityka + Raporty                                  6
Zespol + Struktura                                   4
Ustawienia                                          14
Administracja + Dev                                  7
```

---

*Plik zrodlowy nawigacji: `packages/frontend/src/config/streamsNavigation.ts`*
*Strony: `packages/frontend/src/app/[locale]/dashboard/**/page.tsx`*
