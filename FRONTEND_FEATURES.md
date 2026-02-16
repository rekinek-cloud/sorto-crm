# Frontend Features - Sorto CRM

Kompletna lista zaimplementowanych funkcji w frontendzie sorto-crm.
Wygenerowano: 2026-01-29

---

## Strony Główne (Landing & Auth)

| URL | Nazwa | Opis |
|-----|-------|------|
| `/` | Landing Page | Strona główna z Hero, Features, Pricing, CTA |
| `/[locale]/auth/login` | Login | Strona logowania |
| `/[locale]/auth/register` | Registration | Strona rejestracji |
| `/[locale]/pricing` | Pricing Page | Publiczna strona cennika (3 plany) |
| `/[locale]/privacy` | Privacy Policy | Polityka prywatności |
| `/[locale]/terms` | Terms & Conditions | Warunki użytkowania |
| `/[locale]/contact` | Contact | Formularz kontaktowy |
| `/[locale]/onboarding` | Onboarding | 4-krokowy wizard wdrażania |

---

## Dashboard - Sekcja Główna

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard` | Main Dashboard | Bento Grid z widżetami: Pipeline, Tasks, Goals, AI Assistant, Weekly Trends, Insights |

---

## Streams & GTD - Metodologia Pracy

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/source` | Źródło | Capture punkt dla zadań, notatek, pomysłów |
| `/dashboard/streams` | Strumienie | CRUD strumieniami, hierarchia, Flow Analysis |
| `/dashboard/streams-map` | Mapa Strumieni | Graficzna wizualizacja hierarchii strumieni |
| `/dashboard/streams/[id]` | Szczegóły Strumienia | Edycja, relacje, metryki |
| `/dashboard/streams/frozen` | Zamrożone Strumienie | Archiwialne strumienie |
| `/dashboard/gtd/inbox` | GTD Inbox | Przetwarzanie nowych elementów |
| `/dashboard/gtd/next-actions` | Next Actions | Kanban board następnych akcji |
| `/dashboard/gtd/next-actions/kanban` | Next Actions Kanban | Drag & drop interface |
| `/dashboard/gtd/waiting-for` | Waiting For | Oczekujące na kogoś |
| `/dashboard/gtd/someday-maybe` | Someday Maybe | Backlog pomysłów |
| `/dashboard/gtd/contexts` | Contexts | Filtrowanie po kontekście |
| `/dashboard/gtd/energy` | Energy Levels | Zadania wg poziomu energii |
| `/dashboard/gtd/focus-modes` | Focus Modes | Scrum, Daily, Custom modes |
| `/dashboard/gtd/focus-modes/scrum` | Scrum Board | Sprint planning i tracking |
| `/dashboard/gtd-horizons` | Horizons of Focus | 6 poziomów planowania |
| `/dashboard/gtd-horizons/roadmap` | Roadmap | Wizualizacja celów długoterminowych |
| `/dashboard/gtd-map` | GTD Map | Wizualizacja całego systemu GTD |
| `/dashboard/gtd-buckets` | GTD Buckets | Organizacja elementów |
| `/dashboard/gtd-streams` | GTD Streams | Zarządzanie strumieniami GTD |
| `/dashboard/gtd-streams/scrum` | Scrum Streams | Sprint management |

---

## Zadania & Projekty

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/tasks` | Wszystkie Zadania | Lista z filtrowaniem, sortowaniem, CRUD |
| `/dashboard/tasks/[id]` | Szczegóły Zadania | Edycja, komentarze, załączniki, historia |
| `/dashboard/projects` | Projekty | Lista projektów z grid/list view |
| `/dashboard/projects/[id]` | Szczegóły Projektu | Edycja, zespół, harmonogram |
| `/dashboard/projects/roadmap` | Projekt Roadmap | Wizualizacja czasowa |
| `/dashboard/projects/burndown` | Burndown Chart | Sprint metrics |
| `/dashboard/projects/wbs-dependencies` | WBS Dependencies | Struktura podziału pracy |
| `/dashboard/projects/wbs-templates` | WBS Templates | Biblioteka szablonów |
| `/dashboard/recurring-tasks` | Zadania Cykliczne | CRUD, harmonigramy |
| `/dashboard/recurring-tasks/new` | Nowe Zadanie Cykliczne | Formularz z konfiguracją powtórzeń |
| `/dashboard/recurring-tasks/calendar` | Kalendarz Zadań Cyklicznych | Wizualizacja cyklicznych zadań |
| `/dashboard/task-relationships` | Relacje Zadań | Zależności: zależy od, blokuje |
| `/dashboard/task-history` | Historia Zadań | Audit log zmian |
| `/dashboard/day-planner` | Day Planner | Time blocking, agenda |
| `/dashboard/smart-day-planner` | Smart Day Planner | AI-powered scheduling |

---

## CRM - Zarządzanie Kontaktami & Dealami

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/companies` | Firmy | Lista firm, import, wzbogacanie danych |
| `/dashboard/companies/[id]` | Szczegóły Firmy | Kontakty, historia, grafy relacji |
| `/dashboard/contacts` | Kontakty | Lista kontaktów, filtry, wzbogacanie |
| `/dashboard/contacts/[id]` | Szczegóły Kontaktu | Aktywności, historia, wiadomości |
| `/dashboard/deals` | Transakcje (Deale) | Pipeline Kanban, filtry |
| `/dashboard/deals/[id]` | Szczegóły Dealu | Edycja, timeline, komunikacja |
| `/dashboard/deals/new` | Nowy Deal | Tworzenie nowej transakcji |
| `/dashboard/deals/kanban` | Kanban Dealów | Drag & drop między etapami |
| `/dashboard/pipeline` | Pipeline | Prognoza, statystyki |
| `/dashboard/leads` | Leads | Zarządzanie leadami |

---

## Komunikacja & Email

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/communication` | Komunikacja | Hub: kanały, reguły, statystyki |
| `/dashboard/communication/channels` | Kanały | Email, Slack, Teams |
| `/dashboard/communication/email-filters` | Email Filtry | Auto-tagging, routing |
| `/dashboard/communication/rules-manager` | Rules Manager | AI rules, email rules |
| `/dashboard/smart-mailboxes` | Smart Mailboxes | AI-organized buckets |
| `/dashboard/modern-email` | Modern Email | Thread view, actions |
| `/dashboard/email-accounts` | Email Accounts | CRUD kont email |
| `/dashboard/email-analysis` | Email Analysis | Statystyki, heatmapy |

---

## Spotkania & Kalendarz

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/calendar` | Kalendarz | Month/Week/List view, eventy |
| `/dashboard/meetings` | Spotkania | Lista spotkań, filtry |
| `/dashboard/meetings/calendar` | Kalendarz Spotkań | Scheduling, room booking |

---

## AI & Inteligentne Funkcje

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/ai-assistant` | AI Assistant | Chat interface, Q&A |
| `/dashboard/_ai-management` | AI Management | Model config, provider setup |
| `/dashboard/ai-rules` | AI Rules | Tworzenie reguł automatyzacji |
| `/dashboard/smart` | Smart Features | Smart analysis, scoring |
| `/dashboard/smart-analysis` | Smart Analysis | AI insights na danych |
| `/dashboard/smart-improvements` | Smart Improvements | AI recommendations |
| `/dashboard/smart-templates` | Smart Templates | Wygenerowane szablony |
| `/dashboard/rag-search` | RAG Search | Semantic search w wiedzy |
| `/dashboard/voice-assistant` | Voice Assistant | Speech-to-text, commands |
| `/dashboard/voice-demo` | Voice Demo | Showcase możliwości |
| `/dashboard/voice-rag` | Voice RAG | Pytania głosem o wiedzę |

---

## Wiedza & Dokumentacja

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/knowledge` | Baza Wiedzy | Documents, Wiki, Status |
| `/dashboard/knowledge/wiki/[slug]` | Wiki Strona | Edycja, historia, komentarze |
| `/dashboard/knowledge/documents/[id]` | Dokument | Przeglądanie, sharing |
| `/dashboard/knowledge-base` | Knowledge Base | Import, kategoryzacja |
| `/dashboard/knowledge-status` | Knowledge Status | Coverage, analytics |

---

## Organizacja & Konfiguracja

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/goals` | Cele | CRUD, tracking, progress |
| `/dashboard/habits` | Nawyki | Daily tracking, streaks |
| `/dashboard/tags` | Tagi | CRUD, bulk operations |
| `/dashboard/areas` | Obszary | Obszary odpowiedzialności |
| `/dashboard/areas/roadmap` | Areas Roadmap | Wizualizacja |
| `/dashboard/delegated` | Delegowane | Śledzenie delegacji |
| `/dashboard/recommendations` | Rekomendacje | Personalizowane sugestie AI |
| `/dashboard/timeline` | Timeline | Chronologiczny widok |

---

## Przeglądy i Raporty

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/reviews/weekly` | Weekly Review | Refleksja, metryki |
| `/dashboard/reviews/weekly/burndown` | Weekly Burndown | Sprint metrics |
| `/dashboard/reviews/weekly/scrum` | Weekly Scrum | Board widok |
| `/dashboard/reviews/monthly` | Monthly Review | Refleksja miesięczna |
| `/dashboard/reviews/quarterly` | Quarterly Review | Long-term review |
| `/dashboard/reports` | Raporty | Export, custom reports |
| `/dashboard/analytics` | Analytics | Charts, dashboards |
| `/dashboard/analysis` | Analysis | Data visualization |

---

## Ustawienia & Zarządzanie

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/settings` | Ustawienia | Hub ustawień |
| `/dashboard/settings/profile` | Profil | Avatar, dane, języki |
| `/dashboard/settings/organization` | Organizacja | Nazwa, logo, timezone |
| `/dashboard/settings/branding` | Branding | White Label: kolory, domeny |
| `/dashboard/settings/custom-fields` | Custom Fields | Builder pól niestandardowych |
| `/dashboard/settings/integrations` | Integracje | API keys, webhooks |
| `/dashboard/users` | Użytkownicy | CRUD, role, permissions |
| `/dashboard/team` | Zespół | Members, invites |
| `/dashboard/billing` | Rozliczenia | Plany, invoices, payment |
| `/dashboard/billing/success` | Sukces Płatności | Checkout success |
| `/dashboard/admin/bug-reports` | Bug Reports | Zgłaszanie błędów |
| `/dashboard/admin/mcp-keys` | MCP Keys | API configuration |

---

## Produkty & Usługi

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/products` | Produkty | Katalog produktów, ceny |
| `/dashboard/products/[id]` | Szczegóły Produktu | Edycja, SKU |
| `/dashboard/services` | Usługi | Katalog usług, cennik |
| `/dashboard/services/[id]` | Szczegóły Usługi | Edycja |
| `/dashboard/offers` | Oferty | CRUD, generowanie |
| `/dashboard/orders` | Zamówienia | Historia zamówień |
| `/dashboard/invoices` | Faktury | Generation, archive |

---

## Infrastruktura & Admin

| URL | Nazwa | Opis |
|-----|-------|------|
| `/dashboard/infrastructure` | Infrastructure | Server status, logs, containers |
| `/dashboard/files` | Pliki | Upload, organize |
| `/dashboard/info` | Info | Stats, system info |

---

## Komponenty Główne

### UI Components (`/components/ui`)
| Komponent | Opis |
|-----------|------|
| Badge | Label component |
| Button | Button z wariantami |
| Card | Struktura karty |
| Input | Input field |
| EnhancedCard | Zaawansowana karta |
| CommandPalette | Fuzzy search interface |
| CustomerSelect | Select dla klientów |
| FlashNews | Powiadomienia |
| LoadingSpinner | Loading indicator |
| MobileBottomNavigation | Mobile nav |
| MobileMenu | Hamburger menu |
| QuickActions | Szybkie akcje |
| ResponsiveDashboard | Responsive layout |
| SwipeableCard | Touch gestures |
| TodayStats | Stats widget |
| HeaderDateTime | Date/time display |
| LanguageSwitcher | Language selector (PL/EN/DE) |

### CRM Components (`/components/crm`)
| Komponent | Opis |
|-----------|------|
| CompaniesList | Tabela firm |
| CompanyForm | Formularz firmy |
| CompanyItem | Karta firmy |
| CompanyGraphModal | Wizualizacja relacji |
| ContactsList | Tabela kontaktów |
| ContactForm | Formularz kontaktu |
| DealsList | Tabela dealów |
| DealForm | Formularz dealu |
| PipelineBoard | Kanban pipeline |
| PipelineAnalytics | Statystyki pipeline |
| CommunicationPanel | Panel komunikacji |
| EnrichButton | Wzbogacanie danych |

### Dashboard V2 Components (`/components/dashboard-v2`)
| Komponent | Opis |
|-----------|------|
| BentoGrid | Layout grid |
| BentoItem | Grid item |
| BentoCard | Card w Bento |
| PipelineWidget | Pipeline mini-widget |
| TasksWidget | Tasks mini-widget |
| GoalsTodayWidget | Goals mini-widget |
| AIAssistantWidget | Chat AI |
| WeeklyTrendWidget | Trend chart |
| AIInsightsWidget | Insights panel |
| QuickActionsWidget | Quick actions |
| ActivityFeedWidget | Activity feed |

### Streams Components (`/components/streams`)
| Komponent | Opis |
|-----------|------|
| StreamManager | Manager strumieni |
| StreamForm | Formularz strumienia |
| StreamCard | Karta strumienia |
| StreamHierarchyTree | Drzewo hierarchii |
| StreamStatusBadge | Badge statusu |
| FlowScoreBadge | Badge flow score |
| FlowAnalysisModal | Analiza flow |

### Voice Components (`/components/voice`)
| Komponent | Opis |
|-----------|------|
| VoiceAssistant | Main voice interface |
| VoiceInput | Voice input widget |
| VoiceRecorder | Audio recording |
| VoiceProjectCreator | Tworzenie projekt głosem |
| AudioVisualizer | Waveform display |

### View Components (`/components/views`)
| Komponent | Opis |
|-----------|------|
| CalendarView | Widok kalendarzowy |
| ListView | Widok listowy |
| KanbanBoard | Kanban widok |
| ScrumBoard | Scrum widok |
| GanttChart | Gantt diagram |

---

## Custom Hooks

| Hook | Opis |
|------|------|
| `useDashboardData` | Agreguje dane dashboardu z caching |
| `useAIAssistant` | AI chat i interakcje |
| `useAIHub` | Hub zarządzania AI |
| `useAudioRecording` | Nagrywanie audio |
| `useDebounce` | Debounce dla input fields |
| `useEnrichment` | Wzbogacanie danych kontaktów |
| `useMessageFilters` | Filtrowanie wiadomości |
| `useRelationshipData` | Relacje między elementami |

---

## API Services (`/lib/api`)

| Serwis | Funkcje |
|--------|---------|
| dashboardApi | Stats, pipeline, goals, insights |
| tasksApi | CRUD zadania, filtry |
| projectsApi | CRUD projekty, WBS |
| contactsApi | CRUD kontakty, wzbogacanie |
| companiesApi | CRUD firmy, relacje |
| dealsApi | CRUD dealów, pipeline |
| streamsApi | CRUD strumieni, hierarchia |
| workflowApi | Workflow operations |
| sourceInboxApi | Inbox processing |
| calendarApi | Events, scheduling |
| meetingsApi | CRUD spotkań |
| communicationApi | Kanały, historia |
| mailboxesApi | Mailbox operations |
| knowledgeApi | Docs, wiki, search |
| aiAssistantApi | AI Q&A |
| aiRulesApi | AI rule creation |
| flowApi | Flow processing |
| voiceApi | Speech-to-text |
| billingApi | Subscription, payments |
| usersApi | Team management |
| goalsApi | Goals CRUD |
| habitsApi | Habits tracking |
| tagsApi | Tags management |
| productsApi | Products catalog |
| servicesApi | Services catalog |
| offersApi | Offers creation |
| recurringTasksApi | Recurring tasks |
| enrichmentApi | Data enrichment |
| ragClientApi | RAG search |
| mcpApi | MCP servers |
| sourceApi | Source management |

---

## Konfiguracja Nawigacji

### Główne Menu (`/config/streamsNavigation.ts`)

**Sekcje:**
1. **Pulpit** - Dashboard główny
2. **Źródło** - Capture point
3. **Strumienie** - Wszystkie, Mapa, Zamrożone
4. **Zadania** - Lista zadań
5. **Projekty** - Lista projektów
6. **Kalendarz** - Widok kalendarza
7. **Cele** - Zarządzanie celami
8. **CRM** - Firmy, Kontakty, Pipeline, Transakcje
9. **Komunikacja** - Skrzynki, Kanały
10. **Przeglądy** - Tygodniowy, Miesięczny
11. **AI Assistant** - Chat AI
12. **Organizacja** - Tagi, Nawyki, Zadania cykliczne, Baza wiedzy
13. **Ustawienia** - Profil, Organizacja, Branding, Custom Fields, Integracje, Użytkownicy
14. **Płatności** - Billing
15. **Administracja** - MCP Keys, Infrastruktura, Bug Reports

---

## Internationalization (i18n)

| Język | Kod | Status |
|-------|-----|--------|
| Polski | `pl` | ✅ Pełne tłumaczenie |
| English | `en` | ✅ Pełne tłumaczenie |
| Deutsch | `de` | ✅ Pełne tłumaczenie |

**Pliki tłumaczeń:** `/messages/pl.json`, `/messages/en.json`, `/messages/de.json`

---

## Framework & Biblioteki

| Technologia | Zastosowanie |
|-------------|--------------|
| Next.js 14 | React framework z App Router |
| React 18 | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| React Hot Toast | Notifications |
| Phosphor Icons | Primary icons |
| Lucide React | Secondary icons |
| next-intl | Internationalization |

---

## Podsumowanie

| Kategoria | Ilość |
|-----------|-------|
| Strony (page.tsx) | ~100+ |
| Komponenty React | ~200+ |
| Custom Hooks | 8 |
| API Services | 40+ |
| Języki | 3 (PL, EN, DE) |

**Główne funkcje:**
- ✅ AI Assistant z chat interface
- ✅ Voice assistant (speech-to-text)
- ✅ CRM (kontakty, firmy, deale)
- ✅ GTD/Streams system organizacji
- ✅ Task management z zależnościami
- ✅ Project management z roadmapą
- ✅ Knowledge base z wiki
- ✅ Email management z smart filters
- ✅ Meeting management z kalendarzem
- ✅ Billing & subscription (Stripe)
- ✅ Custom fields & white label
- ✅ RAG search
- ✅ Kanban/Scrum boards
- ✅ Responsive design (mobile)
- ✅ Dark mode

---

*Dokument wygenerowany automatycznie na podstawie analizy kodu źródłowego.*
