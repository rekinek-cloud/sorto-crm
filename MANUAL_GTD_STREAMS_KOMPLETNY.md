# 🎯 GTD STREAMS - KOMPLETNY MANUAL UŻYTKOWNIKA

**Wersja:** 1.0  
**Data:** 2025-07-04  
**Status:** ✅ Pełna implementacja Getting Things Done  

---

## 📋 **SPIS TREŚCI**

1. [Wprowadzenie do GTD Streams](#wprowadzenie)
2. [8 Ról GTD - Szczegółowy Opis](#role-gtd)
3. [Interfejs GTD Stream Manager](#interfejs)
4. [Tworzenie i Konfiguracja Streamów](#tworzenie)
5. [Hierarchia i Struktura Organizacyjna](#hierarchia)
6. [Resource Routing i Automatyzacja](#routing)
7. [Analityka i Metryki](#analityka)
8. [Zaawansowane Funkcje](#zaawansowane)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)
11. [API Reference](#api-reference)

---

## 🎯 **WPROWADZENIE DO GTD STREAMS** {#wprowadzenie}

### **Czym są GTD Streams?**

GTD Streams to rewolucyjny system zarządzania strumieniami pracy oparty na metodologii **Getting Things Done** autorstwa Davida Allena. System zastąpił całkowicie zwykłe streams, dostarczając pełną implementację GTD z:

- **8 dedykowanych ról GTD** dla różnych typów pracy
- **Automatycznym routingiem** zadań i emaili do odpowiednich streamów
- **Konfiguracją specyficzną dla ról** dostosowaną do metodologii GTD
- **Hierarchią i zależnościami** między streamami
- **Analityką i metrykami** efektywności GTD

### **Kluczowe Zalety:**

✅ **True GTD Methodology** - pełna zgodność z książką David Allen'a  
✅ **Zero Learning Curve** - zachowana kompatybilność z poprzednim systemem  
✅ **Enhanced Productivity** - automatyzacja workflow i inteligentne sugestie  
✅ **Data-Driven Insights** - metryki i analityka effectiveness  
✅ **Scalable Architecture** - obsługa dowolnej struktury organizacyjnej  

### **Status Migracji:**

```
🎯 Streams zmigrowanych: 5/5 (100%)
📊 Role GTD przypisane: 5/5 (100%)
🔗 API compatibility: 100% (backward compatible)
⚡ Zero downtime: ✅ (migracja bez przerw)
```

---

## 🎯 **8 RÓL GTD - SZCZEGÓŁOWY OPIS** {#role-gtd}

### **1. 📥 INBOX - Punkt Zbierania**

**Cel:** Centralny punkt zbierania wszystkich nowych elementów wymagających uwagi.

**Zasady GTD:**
- **Nie analizujesz** - tylko zbierasz wszystko w jednym miejscu
- **Regularne opróżnianie** - przetwarzanie co najmniej raz dziennie
- **Nic nie zostaje na stałe** - wszystko musi być przetworzone

**Konfiguracja domyślna:**
```json
{
  "autoRouting": true,
  "processingRules": {
    "autoAssignPriority": true,
    "autoAssignContext": true,
    "autoRouteToProjects": true
  },
  "maxItemsBeforeAlert": 50,
  "energyTracking": false
}
```

**Najlepsze praktyki:**
- 🔄 Opróżniaj codziennie rano (15-30 min)
- 📧 Kieruj wszystkie emaile wymagające akcji
- 📝 Dodawaj quick notes i pomysły
- 🚨 Nie pozwalaj przekroczyć 50 elementów

---

### **2. ⚡ NEXT ACTIONS - Konkretne Zadania**

**Cel:** Fizyczne, widoczne zadania które możesz wykonać natychmiast.

**Zasady GTD:**
- **Konkretne akcje** - "Zadzwonić do Jana", nie "Skontaktować się"
- **Kontekst wykonania** - @computer, @calls, @office, @errands
- **Energy matching** - dopasowanie zadań do poziomu energii

**Konfiguracja domyślna:**
```json
{
  "energyTracking": true,
  "timeEstimation": true,
  "contextFiltering": true,
  "sortBy": "PRIORITY_CONTEXT",
  "showEnergyLevels": true
}
```

**Konteksty dostępne:**
- 💻 **@computer** - Zadania przy komputerze
- 📞 **@calls** - Rozmowy telefoniczne
- 🏢 **@office** - Zadania w biurze
- 🏠 **@home** - Praca zdalna/dom
- 🛒 **@errands** - Sprawy do załatwienia
- 🌐 **@online** - Zadania internetowe
- ⏳ **@waiting** - Oczekiwanie na odpowiedź
- 📚 **@reading** - Dokumenty do przeczytania

**Poziomy energii:**
- 🔥 **High** - Kreatywne, wymagające koncentracji
- ⚡ **Medium** - Standardowe zadania biznesowe
- 🔋 **Low** - Rutynowe, administracyjne

---

### **3. ⏳ WAITING FOR - Oczekiwanie na Innych**

**Cel:** Śledzenie zadań zależnych od działań innych osób.

**Zasady GTD:**
- **Regularne follow-up** - przypomnienia i eskalacje
- **Jasne deadline** - określenie maksymalnego czasu oczekiwania
- **Tracking kontekstu** - kto, co, kiedy

**Konfiguracja domyślna:**
```json
{
  "followUpReminders": true,
  "escalationRules": {
    "enableAutoEscalation": true,
    "escalationDays": 7
  },
  "showWaitingSince": true
}
```

**Automatyzacje:**
- 📧 Auto-reminder po 3 dniach
- ⚠️ Eskalacja po 7 dniach bez odpowiedzi
- 📊 Tracking czasu oczekiwania
- 🔔 Notyfikacje o przekroczeniu deadline

---

### **4. 🌟 SOMEDAY/MAYBE - Przyszłe Możliwości**

**Cel:** Pomysły i projekty które chcesz rozważyć w przyszłości.

**Zasady GTD:**
- **Inkubacja pomysłów** - miejsce na marzenia i wizje
- **Regularny przegląd** - co miesiąc sprawdź co się zmieniło
- **Brak presji** - bez zobowiązań i terminów

**Konfiguracja domyślna:**
```json
{
  "reviewFrequency": "MONTHLY",
  "autoRouting": false,
  "energyTracking": false,
  "incubationPeriod": 30
}
```

**Kategorie Someday/Maybe:**
- 💡 **Pomysły biznesowe** - nowe projekty, produkty
- 📚 **Nauka i rozwój** - kursy, certyfikaty, książki
- 🎯 **Cele osobiste** - hobby, podróże, lifestyle
- 🚀 **Innowacje** - technologie, usprawnienia
- 🤝 **Relacje** - kontakty do nawiązania

---

### **5. 🎯 PROJECTS - Projekty Wieloetapowe**

**Cel:** Rezultaty wymagające więcej niż jednej akcji.

**Zasady GTD:**
- **Jasny outcome** - co konkretnie chcesz osiągnąć
- **Next action defined** - zawsze określone następne kroki
- **Weekly review** - regularny przegląd postępów

**Konfiguracja domyślna:**
```json
{
  "projectTracking": {
    "trackMilestones": true,
    "trackDependencies": true,
    "showProgress": true
  },
  "reviewFrequency": "WEEKLY",
  "energyTracking": true
}
```

**Zarządzanie projektami:**
- 📊 **Progress tracking** - postęp w %
- 🎯 **Milestone management** - kluczowe kamienie milowe
- 🔗 **Dependencies** - powiązania między zadaniami
- 📅 **Timeline planning** - harmonogram realizacji
- 👥 **Team collaboration** - współpraca zespołowa

---

### **6. 📍 CONTEXTS - Konteksty Wykonania**

**Cel:** Grupowanie zadań według miejsc, narzędzi lub sytuacji wykonania.

**Zasady GTD:**
- **Location-based** - gdzie możesz wykonać zadanie
- **Tool-based** - jakie narzędzia są potrzebne
- **People-based** - z kim musisz rozmawiać
- **Energy-based** - jaki poziom energii jest wymagany

**Konfiguracja domyślna:**
```json
{
  "locationTracking": true,
  "toolsRequired": [],
  "energyLevelFilter": true
}
```

**Przykłady kontekstów:**
- 🏢 **@office** - Biuro główne
- 🏠 **@home** - Praca zdalna
- 🚗 **@car** - W drodze, podróże
- 📱 **@mobile** - Zadania mobilne
- 👥 **@team** - Spotkania zespołowe
- 🌐 **@internet** - Wymagający dostępu do sieci

---

### **7. 🏢 AREAS - Obszary Odpowiedzialności**

**Cel:** Długoterminowe obszary życia i pracy które chcesz utrzymywać.

**Zasady GTD:**
- **Standards to maintain** - standardy do utrzymania, nie cele do osiągnięcia
- **Ongoing responsibility** - ciągła odpowiedzialność
- **Regular review** - przegląd kwartalna lub półroczny

**Konfiguracja domyślna:**
```json
{
  "reviewFrequency": "QUARTERLY",
  "goalTracking": true,
  "performanceMetrics": true
}
```

**Przykłady obszarów:**
- 💼 **Zarządzanie zespołem** - rozwój pracowników, rekrutacja
- 💰 **Finanse firmy** - budżet, płynność, inwestycje
- 🎯 **Marketing i sprzedaż** - lead generation, customer acquisition
- 🔧 **Operacje** - procesy, quality, efficiency
- 🌱 **Rozwój produktu** - R&D, innovation, roadmap

---

### **8. 📚 REFERENCE - Materiały Referencyjne**

**Cel:** Informacje które mogą być potrzebne w przyszłości.

**Zasady GTD:**
- **No action required** - tylko informacje, bez zadań
- **Easy retrieval** - łatwe wyszukiwanie i dostęp
- **Organized storage** - logiczna struktura przechowywania

**Konfiguracja domyślna:**
```json
{
  "autoRouting": false,
  "searchIndexing": true,
  "versionControl": true,
  "archiveAfterDays": 365
}
```

**Kategorie referencyjne:**
- 📋 **Procedury** - instrukcje, standardy, protocols
- 📊 **Raporty** - dane historyczne, analityka
- 📄 **Dokumentacja** - manuały, specyfikacje
- 📚 **Wiedza** - artykuły, research, best practices
- 🗂️ **Archiwum** - stare projekty, korespondencja

---

## 🎨 **INTERFEJS GTD STREAM MANAGER** {#interfejs}

### **Dostęp do systemu:**
```
URL: http://91.99.50.80/crm/dashboard/streams/
Menu: GTD Streams (główne menu aplikacji)
```

### **Główny Dashboard:**

#### **📊 Statystyki Overview:**
```
┌─────────────────────────────────────────────┐
│  Wszystkie   │  GTD Config  │  Bez GTD     │
│     5        │      5       │      0       │
│   streams    │  streams     │   streams    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Next Actions │     Inbox     │  Projects   │
│      0        │       0       │      1      │
│   zadania     │   elementów   │   aktywny   │
└─────────────────────────────────────────────┘
```

#### **🔍 Filtry zaawansowane:**
- **Po roli GTD:** INBOX, NEXT_ACTIONS, PROJECTS, WAITING_FOR, SOMEDAY_MAYBE, CONTEXTS, AREAS, REFERENCE
- **Po typie streama:** WORKSPACE, PROJECT, AREA, CONTEXT, CUSTOM
- **Po statusie:** ACTIVE, ARCHIVED, TEMPLATE
- **Checkbox:** "Tylko GTD" - pokazuje tylko streams z przypisaną rolą

#### **👁️ Tryby wyświetlania:**
- **🔲 Grid View** - karty streams w siatce 3-kolumnowej
- **📄 List View** - lista z rozszerzonymi informacjami

### **Karta Stream (Grid View):**

```
┌─────────────────────────────────────────────┐
│ 🎯 Product Development          [PROJECTS] │
│ PROJECT • ACTIVE                            │
│                                             │
│ 📊 Metryki:                                │
│ • Tasks: 0  • Projects: 0  • Messages: 0   │
│ • Completion Rate: 0%                       │
│ • Avg Processing Time: N/A                  │
│                                             │
│ [⚙️ Config] [🌳 Hierarchia] [✏️ Edit]       │
│                                             │
│ Zaktualizowano 04.07.2025              ⋮  │
└─────────────────────────────────────────────┘
```

### **Akcje dostępne:**
- **⚙️ Config** - Konfiguracja GTD specyficzna dla roli
- **🌳 Hierarchia** - Wizualizacja drzewa powiązań
- **✏️ Edit** - Edycja podstawowych danych streama
- **🔄 Migracja** - Migracja legacy streams do GTD
- **🗑️ Delete** - Usunięcie z potwierdzeniem

---

## 🛠️ **TWORZENIE I KONFIGURACJA STREAMÓW** {#tworzenie}

### **Tworzenie nowego GTD Stream:**

#### **Krok 1: Podstawowe dane**
```
┌─────────────────────────────────────────────┐
│  📝 Nazwa streama                          │
│  [Product Marketing Team_____________]      │
│                                             │
│  📄 Opis (opcjonalny)                     │
│  [Stream dla zespołu product marketing...] │
│                                             │
│  🎨 Kolor                                  │
│  [#3B82F6] ■ ■ ■ ■ ■ ■ ■ ■                │
│                                             │
│  📁 Ikona (opcjonalna)                    │
│  [🎯_____________________]                  │
└─────────────────────────────────────────────┘
```

#### **Krok 2: Rola GTD**
```
┌─────────────────────────────────────────────┐
│  🎯 Wybierz rolę GTD:                      │
│                                             │
│  ○ 📥 INBOX        - Punkt zbierania       │
│  ● ⚡ NEXT_ACTIONS - Konkretne zadania     │
│  ○ ⏳ WAITING_FOR  - Oczekiwanie na innych │
│  ○ 🌟 SOMEDAY_MAYBE- Przyszłe możliwości  │
│  ○ 🎯 PROJECTS     - Projekty wieloetapowe │
│  ○ 📍 CONTEXTS     - Konteksty wykonania   │
│  ○ 🏢 AREAS        - Obszary odpowiedz.    │
│  ○ 📚 REFERENCE    - Materiały referencyjne│
└─────────────────────────────────────────────┘
```

#### **Krok 3: Typ streama (auto-suggestion)**
```
┌─────────────────────────────────────────────┐
│  📂 Typ streama: [WORKSPACE ▼]             │
│                                             │
│  💡 Sugestia: Dla roli NEXT_ACTIONS        │
│     zalecamy typ WORKSPACE                  │
│                                             │
│  Dostępne typy:                            │
│  • WORKSPACE - Obszar roboczy              │
│  • PROJECT   - Projekt                     │
│  • AREA      - Obszar odpowiedzialności   │
│  • CONTEXT   - Kontekst wykonania          │
│  • CUSTOM    - Niestandardowy              │
└─────────────────────────────────────────────┘
```

#### **Krok 4: Hierarchia (opcjonalna)**
```
┌─────────────────────────────────────────────┐
│  🌳 Rodzic w hierarchii (opcjonalny)       │
│  [Wybierz stream_______________] ▼          │
│                                             │
│  💡 Ten stream będzie dzieckiem wybranego  │
│     streama i dziedziczy część ustawień    │
│                                             │
│  Dostępne streams:                         │
│  • 🎯 Product Development (PROJECTS)       │
│  • 🏢 Marketing Department (AREAS)         │
│  • 📍 Office Context (CONTEXTS)            │
└─────────────────────────────────────────────┘
```

### **Konfiguracja GTD (po utworzeniu):**

#### **NEXT_ACTIONS - Przykład konfiguracji:**

```json
{
  "energyTracking": {
    "enabled": true,
    "showEnergyLevels": true,
    "defaultEnergyLevel": "MEDIUM"
  },
  "contextFiltering": {
    "enabled": true,
    "defaultContext": "@computer",
    "availableContexts": [
      "@computer", "@calls", "@office", 
      "@home", "@errands", "@online"
    ]
  },
  "timeEstimation": {
    "enabled": true,
    "defaultEstimate": 30,
    "showTimeRemaining": true
  },
  "sorting": {
    "primarySort": "PRIORITY",
    "secondarySort": "CONTEXT",
    "groupByContext": true
  },
  "notifications": {
    "newTaskAlerts": true,
    "deadlineReminders": true,
    "contextSuggestions": true
  }
}
```

#### **PROJECTS - Przykład konfiguracji:**

```json
{
  "projectTracking": {
    "trackMilestones": true,
    "trackDependencies": true,
    "showProgress": true,
    "autoCalculateProgress": true
  },
  "reviewSettings": {
    "reviewFrequency": "WEEKLY",
    "reviewDay": "FRIDAY",
    "autoGenerateReviews": true
  },
  "collaboration": {
    "allowTeamAccess": true,
    "shareProgress": true,
    "notifyStakeholders": true
  },
  "automation": {
    "autoCreateNextActions": true,
    "autoAssignDueDate": true,
    "escalateStalled": true
  }
}
```

#### **Interface konfiguracji:**

```
┌─────────────────────────────────────────────┐
│  ⚙️ Konfiguracja GTD - NEXT_ACTIONS        │
├─────────────────────────────────────────────┤
│                                             │
│  📊 Energy Tracking                        │
│  ☑️ Włącz śledzenie poziomu energii        │
│  ☑️ Pokazuj poziomy energii w zadaniach    │
│  Domyślny poziom: [MEDIUM ▼]               │
│                                             │
│  📍 Context Filtering                      │
│  ☑️ Włącz filtrowanie kontekstów           │
│  Domyślny kontekst: [@computer ▼]          │
│                                             │
│  ⏱️ Time Estimation                        │
│  ☑️ Włącz szacowanie czasu                 │
│  ☑️ Pokazuj pozostały czas                 │
│  Domyślne szacowanie: [30] minut           │
│                                             │
│  🔔 Notifications                          │
│  ☑️ Alerty o nowych zadaniach              │
│  ☑️ Przypomnienia o deadline               │
│  ☑️ Sugestie kontekstów                    │
│                                             │
│  [💾 Zapisz] [🔄 Reset] [❌ Anuluj]        │
└─────────────────────────────────────────────┘
```

---

## 🌳 **HIERARCHIA I STRUKTURA ORGANIZACYJNA** {#hierarchia}

### **Wizualizacja hierarchii:**

#### **Stream Tree View:**
```
🏢 Company Structure (AREAS)
├── 🎯 Product Development (PROJECTS)
│   ├── ⚡ Feature Team Alpha (NEXT_ACTIONS)
│   ├── ⚡ Feature Team Beta (NEXT_ACTIONS)
│   └── 📚 Technical Documentation (REFERENCE)
├── 🎯 Marketing Campaigns (PROJECTS)
│   ├── 📍 Social Media Context (CONTEXTS)
│   └── ⏳ Partner Responses (WAITING_FOR)
└── 📥 Company Inbox (INBOX)
    ├── 🌟 Future Ideas (SOMEDAY_MAYBE)
    └── ⚡ Quick Actions (NEXT_ACTIONS)
```

### **Funkcje hierarchii:**

#### **📊 Tree Analytics:**
- **Głębokość drzewa:** 3 poziomy
- **Łączna liczba węzłów:** 9 streamów
- **Compliance GTD:** 100% (wszystkie role przypisane)
- **Orphaned streams:** 0 (brak sierot)

#### **🔍 Navigation:**
- **Ancestors:** Ścieżka w górę hierarchii
- **Descendants:** Wszystkie dzieci w dół
- **Siblings:** Streamy na tym samym poziomie
- **Breadcrumb:** Pełna ścieżka "Company > Product > Feature Alpha"

#### **⚡ Operations:**
- **Move stream:** Przenoszenie w hierarchii z walidacją cykli
- **Bulk operations:** Masowe operacje na gałęziach
- **Access inheritance:** Dziedziczenie uprawnień
- **Configuration cascade:** Spadkowe ustawienia

### **Resource Routing w hierarchii:**

#### **Automatyczne kierowanie:**
```
📧 Email "Bug in checkout process"
    ↓ [AI Analysis]
🎯 Confidence: 85% → Product Development
    ↓ [Hierarchia check]
⚡ Route to: Feature Team Alpha (child of Product Dev)
    ↓ [Context analysis]
📍 Suggest context: @computer + @urgent
```

#### **Validation rules:**
- **No cycles:** Zapobieganie cyklom w hierarchii
- **GTD compliance:** Sprawdzanie zgodności z regułami GTD
- **Access control:** Weryfikacja uprawnień dostępu
- **Performance limits:** Ograniczenia głębokości (max 10 poziomów)

---

## 🔄 **RESOURCE ROUTING I AUTOMATYZACJA** {#routing}

### **Task Routing Engine:**

#### **Algorytm kierowania zadań:**
```python
def route_task(task, user_preferences, organizational_rules):
    # 1. Analyze task content
    content_analysis = ai.analyze_task_content(task)
    
    # 2. Determine GTD role
    suggested_role = determine_gtd_role(content_analysis)
    
    # 3. Find matching streams
    candidate_streams = find_streams_by_role(suggested_role)
    
    # 4. Apply routing rules
    best_match = apply_routing_rules(
        candidate_streams, 
        content_analysis,
        user_preferences
    )
    
    # 5. Suggest context and energy
    context = suggest_context(content_analysis)
    energy = suggest_energy_level(content_analysis)
    
    return RoutingResult(
        stream=best_match,
        confidence=calculate_confidence(),
        suggested_context=context,
        suggested_energy=energy
    )
```

#### **Przykład routing decision:**

**Input:**
```json
{
  "task": {
    "title": "Code review for payment gateway",
    "description": "Review pull request #123 for payment integration",
    "priority": "HIGH",
    "assignee": "john.doe@company.com"
  }
}
```

**Analysis:**
```json
{
  "content_keywords": ["code", "review", "payment", "integration"],
  "action_type": "REVIEW",
  "complexity": "MEDIUM",
  "urgency": "HIGH",
  "estimated_time": 45
}
```

**Routing Result:**
```json
{
  "recommended_stream": {
    "id": "feature-team-alpha-id",
    "name": "Feature Team Alpha",
    "role": "NEXT_ACTIONS",
    "confidence": 92
  },
  "suggested_context": "@computer",
  "suggested_energy": "HIGH",
  "reasoning": [
    "Contains development keywords (code, review)",
    "Requires focused attention (HIGH energy)",
    "Computer-based task (@computer context)",
    "Matches team expertise (Feature Team Alpha)"
  ]
}
```

### **Email Routing Engine:**

#### **Email classification:**

**Incoming email:**
```
From: client@business.com
Subject: Urgent: Website down since 2 hours
Body: Our website has been down for 2 hours. This is critical 
for our business. Please fix ASAP.
```

**Routing analysis:**
```json
{
  "urgency_score": 95,
  "sentiment": "NEGATIVE",
  "category": "TECHNICAL_ISSUE",
  "keywords": ["urgent", "website", "down", "critical"],
  "estimated_effort": "HIGH",
  "recommended_route": {
    "primary": "NEXT_ACTIONS",
    "secondary": "PROJECTS",
    "context": "@computer",
    "energy": "HIGH",
    "priority": "URGENT"
  }
}
```

### **Bulk Routing Operations:**

#### **Batch processing:**
```
┌─────────────────────────────────────────────┐
│  📦 Bulk Resource Routing                  │
├─────────────────────────────────────────────┤
│  Wybrane resources: 15 elementów           │
│                                             │
│  📧 Emails: 8                              │
│  📋 Tasks: 5                               │
│  📄 Documents: 2                           │
│                                             │
│  🎯 Routing options:                       │
│  ○ Automatyczne (AI suggestions)           │
│  ● Ręczne (wybierz stream)                 │
│  ○ Template-based (saved rules)            │
│                                             │
│  📍 Docelowy stream:                       │
│  [Feature Team Alpha___________] ▼          │
│                                             │
│  [🚀 Przenieś wszystkie] [❌ Anuluj]      │
└─────────────────────────────────────────────┘
```

### **Automation Rules:**

#### **Processing Rules Template:**

```json
{
  "name": "Urgent Bug Reports to Development Team",
  "trigger": {
    "type": "EMAIL_RECEIVED",
    "conditions": {
      "subject_contains": ["bug", "error", "urgent", "critical"],
      "priority": "HIGH",
      "from_domain": ["client.com", "partner.com"]
    }
  },
  "actions": [
    {
      "route_to_stream": "feature-team-alpha-id",
      "set_context": "@computer",
      "set_energy": "HIGH",
      "assign_to": "tech-lead@company.com",
      "create_next_action": true,
      "notify_team": true
    }
  ],
  "gtd_settings": {
    "role": "NEXT_ACTIONS",
    "auto_estimate_time": true,
    "suggest_dependencies": true
  }
}
```

---

## 📊 **ANALITYKA I METRYKI** {#analityka}

### **GTD Effectiveness Dashboard:**

#### **Główne KPI:**
```
┌─────────────────────────────────────────────┐
│  📊 GTD Performance Overview               │
├─────────────────────────────────────────────┤
│                                             │
│  ⚡ Processing Rate: 87%                   │
│  ██████████████████░░░ (43/49 items)       │
│                                             │
│  🎯 Task Completion: 76%                   │
│  ███████████████░░░░░ (152/200 tasks)      │
│                                             │
│  ⏱️ Avg Processing Time: 2.3 days          │
│  📈 Trend: ↓ -0.8 days (improving)         │
│                                             │
│  🧠 Inbox Health: GOOD                     │
│  📥 Items waiting: 6 (target: <10)         │
│                                             │
└─────────────────────────────────────────────┘
```

#### **Per-Role Analytics:**

**INBOX Analysis:**
```json
{
  "total_items_processed": 347,
  "avg_processing_time": "1.2 days",
  "processing_distribution": {
    "DO": "45%",
    "DEFER": "30%", 
    "DELEGATE": "15%",
    "DELETE": "10%"
  },
  "bottlenecks": [
    "Complex project decisions take 3+ days",
    "External dependency items pile up"
  ],
  "recommendations": [
    "Create decision tree for project classification",
    "Set up auto-escalation for external items"
  ]
}
```

**NEXT_ACTIONS Analysis:**
```json
{
  "completion_rate": "76%",
  "avg_time_to_complete": "3.2 days",
  "context_efficiency": {
    "@computer": "89%",
    "@calls": "67%",
    "@office": "82%",
    "@home": "71%"
  },
  "energy_matching": {
    "HIGH_energy_tasks": "23%",
    "MEDIUM_energy_tasks": "56%", 
    "LOW_energy_tasks": "21%"
  },
  "suggestions": [
    "Schedule more @calls tasks (low completion)",
    "Add more LOW energy tasks for end of day"
  ]
}
```

### **Hierarchy Performance:**

#### **Stream Utilization:**
```
Stream Name                   │ Tasks │ Completion │ Efficiency
─────────────────────────────┼───────┼────────────┼───────────
🎯 Product Development       │   45  │    82%     │    ⭐⭐⭐⭐⭐
⚡ Feature Team Alpha        │   23  │    91%     │    ⭐⭐⭐⭐⭐  
⚡ Feature Team Beta         │   18  │    67%     │    ⭐⭐⭐
📚 Technical Documentation   │    8  │    100%    │    ⭐⭐⭐⭐⭐
📥 Company Inbox            │   12  │    75%     │    ⭐⭐⭐⭐
```

#### **Routing Accuracy:**
```json
{
  "total_routed_items": 1247,
  "routing_accuracy": "84%",
  "manual_corrections": "16%",
  "ai_confidence_breakdown": {
    "90-100%": "34% of routes",
    "70-89%": "48% of routes", 
    "50-69%": "15% of routes",
    "<50%": "3% of routes"
  },
  "most_accurate_routes": [
    "Bug reports → Feature Teams (97%)",
    "Documentation → Reference (95%)",
    "Client emails → Inbox (91%)"
  ]
}
```

### **Weekly GTD Review Dashboard:**

```
┌─────────────────────────────────────────────┐
│  📅 Weekly GTD Review - Week 27/2025       │
├─────────────────────────────────────────────┤
│                                             │
│  🎯 Projects Review:                       │
│  ✅ 3 projects completed                   │
│  🔄 5 projects in progress                 │
│  ⚠️ 2 projects stalled (need attention)    │
│                                             │
│  ⚡ Next Actions:                          │
│  ✅ 47 actions completed                   │
│  📋 23 actions remaining                   │
│  🆕 15 new actions added                   │
│                                             │
│  📥 Inbox Health:                          │
│  📊 89% processing rate (excellent!)       │
│  🏃 Avg processing: 1.4 days (target: <2)  │
│                                             │
│  🌟 Someday/Maybe Review:                  │
│  🔄 2 items promoted to active projects    │
│  🗑️ 3 items archived (no longer relevant)  │
│                                             │
│  📊 Weekly Insights:                       │
│  • Best performance: @computer context     │
│  • Improvement needed: @calls follow-ups   │
│  • Energy peak: Tuesday 10-12am           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🚀 **ZAAWANSOWANE FUNKCJE** {#zaawansowane}

### **AI-Enhanced GTD Processing:**

#### **Smart Suggestions Engine:**

**Podczas przetwarzania Inbox:**
```
┌─────────────────────────────────────────────┐
│  🤖 AI Assistance - Inbox Processing       │
├─────────────────────────────────────────────┤
│  Item: "Schedule meeting with design team  │
│         to discuss mobile app redesign"    │
│                                             │
│  🎯 AI Suggestions:                        │
│                                             │
│  Recommended action: PROJECT               │
│  Confidence: 87%                           │
│                                             │
│  💡 Reasoning:                             │
│  • "redesign" suggests multi-step effort   │
│  • Team involvement indicates complexity   │
│  • Timeline likely >1 week                 │
│                                             │
│  📋 Suggested next actions:                │
│  1. "Send calendar invite for initial      │
│     design discussion"                     │
│  2. "Prepare current app audit"            │
│  3. "Research competitor mobile designs"   │
│                                             │
│  📍 Suggested context: @office             │
│  ⚡ Suggested energy: HIGH                 │
│                                             │
│  [✅ Accept] [✏️ Modify] [❌ Ignore]       │
└─────────────────────────────────────────────┘
```

### **Template System:**

#### **GTD Stream Templates:**

**Marketing Team Template:**
```json
{
  "name": "Marketing Team Template",
  "description": "Standard setup for marketing teams",
  "streams": [
    {
      "name": "Marketing Inbox",
      "role": "INBOX",
      "type": "WORKSPACE",
      "config": {
        "autoRouting": true,
        "processingRules": {
          "campaignKeywords": ["campaign", "promotion", "launch"],
          "contentKeywords": ["blog", "social", "content"],
          "analyticsKeywords": ["metrics", "analytics", "report"]
        }
      }
    },
    {
      "name": "Campaign Projects", 
      "role": "PROJECTS",
      "type": "PROJECT",
      "parent": "Marketing Inbox",
      "config": {
        "milestoneTracking": true,
        "budgetTracking": true,
        "performanceMetrics": ["CTR", "Conversion", "ROI"]
      }
    },
    {
      "name": "Content Actions",
      "role": "NEXT_ACTIONS", 
      "type": "WORKSPACE",
      "parent": "Marketing Inbox",
      "config": {
        "contexts": ["@creative", "@social", "@analytics"],
        "energyTracking": true
      }
    }
  ],
  "automation": [
    {
      "trigger": "email_with_subject_campaign",
      "action": "route_to_projects"
    }
  ]
}
```

#### **Zastosowanie template:**
```
┌─────────────────────────────────────────────┐
│  📋 Create from Template                   │
├─────────────────────────────────────────────┤
│  Available templates:                      │
│                                             │
│  📊 Marketing Team (3 streams)             │
│  🛠️ Development Team (4 streams)            │
│  💰 Sales Team (5 streams)                 │
│  👥 HR Department (3 streams)              │
│  🎯 Project Management (6 streams)         │
│  🏢 Executive Suite (4 streams)            │
│                                             │
│  Selected: Marketing Team                  │
│                                             │
│  🎨 Customization:                         │
│  Team name: [Digital Marketing_______]     │
│  Name prefix: [DM-_______________]          │
│  Color scheme: [Blue gradient_____] ▼      │
│                                             │
│  [🚀 Create Team] [👁️ Preview] [❌ Cancel]  │
└─────────────────────────────────────────────┘
```

### **Compliance Monitoring:**

#### **GTD Rules Validator:**

**Automatic compliance checks:**
```python
def validate_gtd_compliance(stream):
    issues = []
    
    # Check role-specific rules
    if stream.role == "INBOX":
        if stream.task_count > 50:
            issues.append({
                "severity": "HIGH",
                "message": "Inbox has >50 items - needs processing",
                "action": "Schedule inbox processing session"
            })
    
    if stream.role == "PROJECTS":
        projects_without_next_actions = count_stalled_projects(stream)
        if projects_without_next_actions > 0:
            issues.append({
                "severity": "MEDIUM", 
                "message": f"{projects_without_next_actions} projects without next actions",
                "action": "Define next actions for stalled projects"
            })
    
    if stream.role == "WAITING_FOR":
        overdue_items = count_overdue_waiting(stream)
        if overdue_items > 0:
            issues.append({
                "severity": "HIGH",
                "message": f"{overdue_items} waiting items overdue",
                "action": "Follow up on overdue items"
            })
    
    return compliance_report(issues)
```

#### **Compliance Dashboard:**
```
┌─────────────────────────────────────────────┐
│  ✅ GTD Compliance Monitor                 │
├─────────────────────────────────────────────┤
│                                             │
│  Overall GTD Health: 87% ⭐⭐⭐⭐            │
│                                             │
│  🔴 Issues requiring attention:            │
│                                             │
│  📥 Company Inbox                          │
│  ⚠️ 52 items (target: <50)                 │
│  → Recommended: Schedule processing         │
│                                             │
│  🎯 Product Development                     │
│  ⚠️ 2 projects without next actions        │
│  → Action: Define next steps               │
│                                             │
│  🟡 Recommendations:                       │
│                                             │
│  ⏳ Waiting For Items                      │
│  💡 Set up auto-reminders for follow-up    │
│                                             │
│  📊 Context Distribution                   │
│  💡 Add more @home tasks for flexibility   │
│                                             │
│  [🔧 Auto-fix] [📅 Schedule] [🔄 Refresh] │
└─────────────────────────────────────────────┘
```

---

## ✨ **BEST PRACTICES** {#best-practices}

### **🎯 Metodologia GTD - Fundamenty:**

#### **1. Capture Everything (Zbierz wszystko)**
```
✅ DO:
• Używaj Company Inbox jako jedynego punktu zbierania
• Dodawaj ALL emaile wymagające akcji do Inbox
• Quick capture pomysłów i notatek do Inbox
• Nie analizuj podczas zbierania - tylko zapisuj

❌ DON'T:
• Nie zostawiaj zadań "w głowie"
• Nie używaj wielu miejsc zbierania  
• Nie analizuj w momencie capture
• Nie ignoruj małych zadań
```

#### **2. Clarify (Wyjaśnij)**
```
✅ DO:
• Zawsze pytaj: "Czy to wymaga akcji?"
• Definiuj konkretny, fizyczny next action
• Używaj czasowników akcji: "Zadzwonić", "Napisać", "Przejrzeć"
• Szacuj czas wykonania (< 2 min = rób natychmiast)

❌ DON'T:
• Nie zostawiaj niejasnych opisów
• Nie używaj rzeczowników jako akcji
• Nie odkładaj drobnych zadań "na później"
• Nie pomijaj kontekstu wykonania
```

#### **3. Organize (Organizuj)**
```
✅ DO:
• Używaj odpowiednich ról GTD dla każdego typu pracy
• Grupuj zadania po kontekstach (@computer, @calls)
• Regularnie przeglądaj i aktualizuj listy
• Utrzymuj jasną hierarchię streamów

❌ DON'T:
• Nie mieszaj ról GTD w jednym streamie
• Nie ignoruj kontekstów wykonania
• Nie pozwalaj na rozrost list bez przeglądu
• Nie twórz zbyt głębokich hierarchii (max 3-4 poziomy)
```

### **🚀 Operacyjne Best Practices:**

#### **Daily GTD Workflow:**

**Rano (15-20 min):**
```
1. 📥 Przejrzyj Company Inbox
   • Przetworz wszystkie nowe elementy
   • Zastosuj regułę 2 minut
   • Przekieruj do odpowiednich streamów

2. ⚡ Przejrzyj Next Actions dla dzisiejszego kontekstu
   • Sprawdź zadania @office jeśli w biurze
   • Sprawdź zadania @computer jeśli przy komputerze
   • Wybierz 3-5 najważniejszych na dziś

3. 📅 Sprawdź kalendarz i deadlines
   • Synchronizuj z zadaniami time-sensitive
   • Przygotuj konteksty na spotkania
```

**W ciągu dnia:**
```
1. 🎯 Fokus na wybranym kontekście
   • Nie przeskakuj między kontekstami bez powodu
   • Dokończ zadanie przed przejściem do następnego
   • Aktualizuj postęp w czasie rzeczywistym

2. 📝 Capture nowych elementów
   • Nie przerywaj pracy na analizę
   • Szybko zapisz w Inbox i wróć do zadania
   • Ustaw przypomnienie na przetworzenie

3. ⚡ Wykorzystuj energy peaks
   • HIGH energy tasks rano (9-12)
   • MEDIUM energy tasks po południu (13-16)
   • LOW energy tasks wieczorem (17-19)
```

**Wieczorem (10 min):**
```
1. 📊 Review dnia
   • Oznacz ukończone zadania
   • Przełóż nieukończone na jutro
   • Dodaj nowe insights do odpowiednich streamów

2. 📅 Przygotowanie na jutro
   • Sprawdź kontekst następnego dnia
   • Wybierz wstępne zadania
   • Upewnij się że Inbox jest pusty
```

#### **Weekly GTD Review (45-60 min):**

**Piątek po południu lub weekend:**
```
1. 📋 Projects Review (20 min)
   • Sprawdź każdy projekt z osobna
   • Upewnij się że każdy ma defined next action
   • Aktualizuj status i progress
   • Przełóż stalled projects do Someday/Maybe

2. 📝 Lists Review (15 min)  
   • Przejrzyj wszystkie role GTD
   • Wyczyść completed actions
   • Reorganizuj priorities
   • Dodaj missing contexts

3. 🌟 Someday/Maybe Review (10 min)
   • Czy jakieś idea jest gotowa na promotion?
   • Usuń items które już nie są relevantne
   • Dodaj nowe pomysły z tygodnia

4. 📊 Analytics Review (10 min)
   • Sprawdź completion rates
   • Zidentyfikuj bottlenecks
   • Zaplanuj improvements na następny tydzień
```

### **⚙️ Configuration Best Practices:**

#### **Stream Naming Conventions:**
```
✅ GOOD:
• "Marketing Team - Social Media Actions" (NEXT_ACTIONS)
• "Q3 Product Launch" (PROJECTS)  
• "Office - Meeting Room A" (CONTEXTS)
• "Sales Department - Leadership" (AREAS)

❌ BAD:
• "Marketing Stuff" (zbyt ogólne)
• "Things to do" (nie opisuje celu)
• "Stream1" (bez kontekstu)
• "Random Notes" (bez roli GTD)
```

#### **Hierarchy Design:**
```
🏢 Optimal Structure:

Company (AREAS)
├── Departments (AREAS)
│   ├── Teams (PROJECTS/NEXT_ACTIONS)
│   └── Contexts (CONTEXTS)
├── Processes (PROJECTS)
│   ├── Workflows (NEXT_ACTIONS)
│   └── Documentation (REFERENCE)
└── Resources (REFERENCE)
    ├── Templates
    └── Knowledge Base

🚫 Avoid:
• Więcej niż 4 poziomy głębokości
• Duplikowanie ról na tym samym poziomie
• Circular dependencies
• Zbyt wiele children (max 7±2 na poziom)
```

#### **Color & Icon Strategy:**
```
🎨 Recommended Color Scheme:

📥 INBOX: #EF4444 (Red) - Urgent attention
⚡ NEXT_ACTIONS: #10B981 (Green) - Ready to act  
⏳ WAITING_FOR: #F59E0B (Orange) - Waiting state
🌟 SOMEDAY_MAYBE: #8B5CF6 (Purple) - Future dreams
🎯 PROJECTS: #3B82F6 (Blue) - Active planning
📍 CONTEXTS: #14B8A6 (Teal) - Environment
🏢 AREAS: #6B7280 (Gray) - Stable responsibility
📚 REFERENCE: #6366F1 (Indigo) - Knowledge

💡 Benefits:
• Instant visual recognition
• Color psychology alignment
• Consistent user experience
• Easy mental mapping
```

---

## 🔧 **TROUBLESHOOTING** {#troubleshooting}

### **Najczęstsze problemy i rozwiązania:**

#### **1. Stream nie ładuje się lub pokazuje błąd 500**

**Problem:** Interface GTD Stream Manager nie działa
```
Symptomy:
• Strona /crm/dashboard/streams/ zwraca błąd 500
• Komponenty nie ładują się
• Console pokazuje błędy React hooks
```

**Rozwiązanie:**
```bash
# 1. Sprawdź czy wszystkie komponenty mają 'use client'
grep -r "useState\|useEffect" packages/frontend/src/components/streams/

# 2. Restart frontend container
docker restart crm-frontend-v1

# 3. Sprawdź logi błędów
docker logs crm-frontend-v1 --tail 20

# 4. Weryfikuj czy import ścieżki są poprawne
# Wszystkie imports GTDRole, StreamType powinny być z @/types/gtd
```

#### **2. API endpoints zwracają błędy autoryzacji**

**Problem:** Błędy 401/403 przy dostępie do GTD Streams API
```
Symptomy:
• "Access token required" lub "Invalid token"
• API calls kończą się błędem autoryzacji
• Frontend nie może pobrać danych streamów
```

**Rozwiązanie:**
```bash
# 1. Sprawdź czy backend jest uruchomiony
curl -s http://91.99.50.80/crm/api/v1/gtd-streams

# 2. Restart backend container
docker restart crm-backend-v1

# 3. Sprawdź logi autoryzacji
docker logs crm-backend-v1 | grep -i auth

# 4. Weryfikuj middleware auth w routes
# Wszystkie GTD routes powinny mieć authenticateUser middleware
```

#### **3. Dane nie synchronizują się między streamami**

**Problem:** Zmiany w jednym streamie nie są widoczne w hierarchii
```
Symptomy:
• Parent-child relationships nie działają
• Resource routing nie kieruje do odpowiednich streamów
• Hierarchia pokazuje stare dane
```

**Rozwiązanie:**
```bash
# 1. Sprawdź integralność bazy danych
docker exec -e PGPASSWORD=password crm-postgres-v1 psql -h localhost -U user -d crm_gtd_v1 -c "
SELECT s.name, s.\"gtdRole\", s.\"streamType\", 
       COUNT(pr.id) as parent_relations,
       COUNT(cr.id) as child_relations
FROM streams s
LEFT JOIN stream_relations pr ON s.id = pr.\"childId\"
LEFT JOIN stream_relations cr ON s.id = cr.\"parentId\"
GROUP BY s.id, s.name, s.\"gtdRole\", s.\"streamType\";
"

# 2. Clear cache jeśli używany
# 3. Restart całego stack
docker restart crm-backend-v1 crm-frontend-v1
```

#### **4. Resource routing nie działa poprawnie**

**Problem:** Zadania/emaile nie są automatycznie kierowane do streamów
```
Symptomy:
• Routing confidence zawsze 0%
• AI suggestions nie działają
• Bulk routing kończy się błędem
```

**Rozwiązanie:**
```bash
# 1. Sprawdź czy ResourceRouter jest zainicjalizowany
grep -r "ResourceRouter" packages/backend/src/routes/gtdStreams.ts

# 2. Weryfikuj czy stream ma poprawną rolę GTD
docker exec -e PGPASSWORD=password crm-postgres-v1 psql -h localhost -U user -d crm_gtd_v1 -c "
SELECT id, name, \"gtdRole\" 
FROM streams 
WHERE \"gtdRole\" IS NULL;
"

# 3. Test routing API manually
curl -X POST "http://91.99.50.80/crm/api/v1/gtd-streams/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test task", 
    "description": "Test routing functionality"
  }'
```

#### **5. GTD Configuration nie zapisuje się**

**Problem:** Zmiany w GTD Config modal nie są persystowane
```
Symptomy:
• Config modal pokazuje stare wartości po refresh
• Save button nie reaguje
• Błędy w Network tab przy PUT request
```

**Rozwiązanie:**
```bash
# 1. Sprawdź czy endpoint config istnieje
curl -X GET "http://91.99.50.80/crm/api/v1/gtd-streams/{stream-id}/config"

# 2. Weryfikuj format JSON w frontend
# Config powinien być poprawnym JSON object

# 3. Sprawdź logi backend przy save
docker logs crm-backend-v1 | grep -i "config"

# 4. Test manual PUT request
curl -X PUT "http://91.99.50.80/crm/api/v1/gtd-streams/{stream-id}/config" \
  -H "Content-Type: application/json" \
  -d '{"config": {"energyTracking": true}}'
```

### **Performance Issues:**

#### **Slow hierarchy loading:**
```bash
# 1. Check database indexes
docker exec -e PGPASSWORD=password crm-postgres-v1 psql -h localhost -U user -d crm_gtd_v1 -c "
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('streams', 'stream_relations');
"

# 2. Analyze query performance
EXPLAIN ANALYZE SELECT * FROM streams WHERE "gtdRole" IS NOT NULL;

# 3. Consider adding indexes if missing
CREATE INDEX IF NOT EXISTS idx_streams_gtd_role ON streams("gtdRole");
CREATE INDEX IF NOT EXISTS idx_stream_relations_parent ON stream_relations("parentId");
CREATE INDEX IF NOT EXISTS idx_stream_relations_child ON stream_relations("childId");
```

#### **Memory leaks w frontend:**
```bash
# 1. Check for memory leaks in React components
# Ensure all useEffect hooks have proper cleanup

# 2. Monitor memory usage
docker stats crm-frontend-v1

# 3. Restart frontend if memory usage > 512MB
docker restart crm-frontend-v1
```

### **Data Recovery:**

#### **Restore from backup:**
```bash
# 1. Locate latest backup
ls -la backups/database/ | grep gtd_streams

# 2. Stop services
docker stop crm-backend-v1 crm-frontend-v1

# 3. Restore database
docker exec -i -e PGPASSWORD=password crm-postgres-v1 psql -h localhost -U user -d crm_gtd_v1 < backup_file.sql

# 4. Restart services
docker start crm-backend-v1 crm-frontend-v1
```

#### **Corrupted GTD role assignments:**
```sql
-- Reset all streams to default GTD roles
UPDATE streams 
SET "gtdRole" = CASE
  WHEN name ILIKE '%inbox%' THEN 'INBOX'
  WHEN name ILIKE '%next%' OR name ILIKE '%action%' THEN 'NEXT_ACTIONS'
  WHEN name ILIKE '%project%' THEN 'PROJECTS'
  WHEN name ILIKE '%wait%' THEN 'WAITING_FOR'
  WHEN name ILIKE '%someday%' OR name ILIKE '%maybe%' THEN 'SOMEDAY_MAYBE'
  WHEN name ILIKE '%context%' THEN 'CONTEXTS'
  WHEN name ILIKE '%area%' THEN 'AREAS'
  WHEN name ILIKE '%reference%' OR name ILIKE '%doc%' THEN 'REFERENCE'
  ELSE 'AREAS'
END
WHERE "gtdRole" IS NULL;
```

---

## 📚 **API REFERENCE** {#api-reference}

### **Base URL:**
```
Production: http://91.99.50.80/crm/api/v1/gtd-streams
Development: http://localhost:3003/api/v1/gtd-streams
```

### **Authentication:**
Wszystkie endpointy wymagają autoryzacji poprzez cookie `access_token` lub header `Authorization: Bearer <token>`.

---

### **🎯 STREAM MANAGEMENT**

#### **GET /gtd-streams**
Pobiera listę wszystkich GTD streams dla organizacji użytkownika.

**Request:**
```http
GET /api/v1/gtd-streams
Cookie: access_token=<token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "demo-stream-1",
      "name": "Product Development",
      "description": "Main product development stream",
      "color": "#3B82F6",
      "icon": "🎯",
      "gtdRole": "PROJECTS",
      "streamType": "PROJECT",
      "status": "ACTIVE",
      "templateOrigin": null,
      "gtdConfig": {
        "projectTracking": {
          "trackMilestones": true,
          "trackDependencies": true,
          "showProgress": true
        },
        "reviewFrequency": "WEEKLY",
        "energyTracking": true
      },
      "createdAt": "2025-07-04T10:00:00Z",
      "updatedAt": "2025-07-04T10:30:00Z",
      "_count": {
        "tasks": 0
      }
    }
  ],
  "meta": {
    "total": 5,
    "byRole": {
      "INBOX": 1,
      "NEXT_ACTIONS": 1,
      "PROJECTS": 1,
      "WAITING_FOR": 1,
      "SOMEDAY_MAYBE": 1
    }
  }
}
```

---

#### **POST /gtd-streams**
Tworzy nowy GTD stream.

**Request:**
```http
POST /api/v1/gtd-streams
Content-Type: application/json
Cookie: access_token=<token>

{
  "name": "Marketing Team - Social Media",
  "description": "Social media marketing activities",
  "color": "#10B981",
  "icon": "📱",
  "gtdRole": "NEXT_ACTIONS",
  "streamType": "WORKSPACE",
  "parentStreamId": "marketing-department-id",
  "gtdConfig": {
    "energyTracking": true,
    "contextFiltering": true,
    "timeEstimation": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stream": {
      "id": "new-stream-id",
      "name": "Marketing Team - Social Media",
      "gtdRole": "NEXT_ACTIONS",
      "streamType": "WORKSPACE",
      "status": "ACTIVE",
      "createdAt": "2025-07-04T14:00:00Z"
    },
    "gtdConfig": {
      "energyTracking": true,
      "contextFiltering": true,
      "timeEstimation": true,
      "notificationsEnabled": true
    }
  }
}
```

---

#### **GET /gtd-streams/by-role/{role}**
Pobiera streams według określonej roli GTD.

**Request:**
```http
GET /api/v1/gtd-streams/by-role/NEXT_ACTIONS
Cookie: access_token=<token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "stream-1",
      "name": "Marketing Team Actions",
      "gtdRole": "NEXT_ACTIONS",
      "streamType": "WORKSPACE",
      "_count": {
        "tasks": 15
      }
    },
    {
      "id": "stream-2", 
      "name": "Development Actions",
      "gtdRole": "NEXT_ACTIONS",
      "streamType": "WORKSPACE",
      "_count": {
        "tasks": 8
      }
    }
  ]
}
```

---

### **⚙️ CONFIGURATION MANAGEMENT**

#### **GET /gtd-streams/{id}/config**
Pobiera konfigurację GTD dla streama.

**Request:**
```http
GET /api/v1/gtd-streams/stream-id-123/config
Cookie: access_token=<token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "energyTracking": true,
    "timeEstimation": true,
    "contextFiltering": true,
    "sortBy": "PRIORITY_CONTEXT",
    "showEnergyLevels": true,
    "notificationsEnabled": true,
    "autoRouting": true
  }
}
```

---

#### **PUT /gtd-streams/{id}/config**
Aktualizuje konfigurację GTD dla streama.

**Request:**
```http
PUT /api/v1/gtd-streams/stream-id-123/config
Content-Type: application/json
Cookie: access_token=<token>

{
  "config": {
    "energyTracking": false,
    "timeEstimation": true,
    "contextFiltering": true,
    "sortBy": "PRIORITY",
    "customSettings": {
      "autoAssignContext": true,
      "defaultEnergyLevel": "MEDIUM"
    }
  },
  "options": {
    "mergeWithExisting": true,
    "validateSchema": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "energyTracking": false,
    "timeEstimation": true,
    "contextFiltering": true,
    "sortBy": "PRIORITY",
    "customSettings": {
      "autoAssignContext": true,
      "defaultEnergyLevel": "MEDIUM"
    },
    "updatedAt": "2025-07-04T15:30:00Z"
  }
}
```

---

### **🌳 HIERARCHY MANAGEMENT**

#### **GET /gtd-streams/{id}/tree**
Pobiera drzewo hierarchii dla streama.

**Request:**
```http
GET /api/v1/gtd-streams/root-stream-id/tree?maxDepth=5&includeGTDAnalysis=true
Cookie: access_token=<token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "root": {
      "id": "root-stream-id",
      "name": "Company Structure",
      "gtdRole": "AREAS",
      "depth": 0,
      "path": ["root-stream-id"],
      "children": [
        {
          "id": "child-1",
          "name": "Marketing Department",
          "gtdRole": "AREAS", 
          "depth": 1,
          "path": ["root-stream-id", "child-1"],
          "children": [
            {
              "id": "grandchild-1",
              "name": "Social Media Team",
              "gtdRole": "NEXT_ACTIONS",
              "depth": 2,
              "path": ["root-stream-id", "child-1", "grandchild-1"],
              "children": [],
              "gtdContext": {
                "isGTDCompliant": true,
                "issues": []
              }
            }
          ],
          "gtdContext": {
            "isGTDCompliant": true,
            "issues": []
          }
        }
      ],
      "gtdContext": {
        "isGTDCompliant": true,
        "issues": []
      }
    },
    "totalNodes": 3,
    "maxDepth": 2,
    "hasGTDStructure": true
  }
}
```

---

#### **GET /gtd-streams/{id}/path**
Pobiera ścieżkę breadcrumb dla streama.

**Request:**
```http
GET /api/v1/gtd-streams/child-stream-id/path
Cookie: access_token=<token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": [
      {
        "id": "root-id",
        "name": "Company",
        "gtdRole": "AREAS"
      },
      {
        "id": "dept-id", 
        "name": "Marketing",
        "gtdRole": "AREAS"
      },
      {
        "id": "team-id",
        "name": "Social Media",
        "gtdRole": "NEXT_ACTIONS"
      }
    ],
    "breadcrumb": "Company > Marketing > Social Media",
    "totalDepth": 2,
    "relationTypes": ["OWNS", "MANAGES"]
  }
}
```

---

### **🔄 RESOURCE ROUTING**

#### **POST /gtd-streams/route/task**
Kieruje zadanie do odpowiedniego streama.

**Request:**
```http
POST /api/v1/gtd-streams/route/task
Content-Type: application/json
Cookie: access_token=<token>

{
  "taskId": "task-123",
  "preferredStreamId": "preferred-stream-id",
  "forceStream": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "streamId": "recommended-stream-id",
    "streamName": "Development Team Actions",
    "confidence": 87,
    "reasoning": [
      "Task contains development keywords",
      "Assigned to development team member",
      "Complexity suggests NEXT_ACTIONS role"
    ],
    "fallbackUsed": false,
    "suggestedContext": "@computer",
    "suggestedEnergyLevel": "HIGH"
  }
}
```

---

#### **POST /gtd-streams/analyze**
Analizuje treść dla sugestii GTD.

**Request:**
```http
POST /api/v1/gtd-streams/analyze
Content-Type: application/json
Cookie: access_token=<token>

{
  "name": "Redesign mobile app checkout process",
  "description": "The current checkout has too many steps and users drop off. Need to streamline the flow and improve conversion rate.",
  "existingTasks": 0,
  "relatedContacts": 3,
  "messageVolume": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendedRole": "PROJECTS",
    "recommendedContext": "@computer",
    "recommendedEnergyLevel": "HIGH",
    "confidence": 91,
    "reasoning": [
      "'redesign' indicates multi-step effort",
      "'process' suggests workflow complexity", 
      "Multiple stakeholders involved",
      "Outcome-focused (improve conversion)"
    ],
    "suggestedActions": [
      {
        "action": "Audit current checkout flow",
        "context": "@computer",
        "energy": "MEDIUM",
        "estimatedTime": 120
      },
      {
        "action": "Interview users about pain points", 
        "context": "@calls",
        "energy": "HIGH",
        "estimatedTime": 180
      },
      {
        "action": "Create wireframes for new flow",
        "context": "@computer", 
        "energy": "HIGH",
        "estimatedTime": 240
      }
    ]
  }
}
```

---

### **📊 ANALYTICS & STATISTICS**

#### **GET /gtd-streams/stats**
Pobiera ogólne statystyki GTD.

**Request:**
```http
GET /api/v1/gtd-streams/stats
Cookie: access_token=<token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStreams": 8,
    "streamsByRole": {
      "INBOX": 1,
      "NEXT_ACTIONS": 2,
      "PROJECTS": 2,
      "WAITING_FOR": 1,
      "SOMEDAY_MAYBE": 1,
      "AREAS": 1
    },
    "streamsByType": {
      "WORKSPACE": 4,
      "PROJECT": 2,
      "AREA": 1,
      "CONTEXT": 1
    },
    "configuredStreams": 8,
    "unconfiguredStreams": 0,
    "performanceMetrics": {
      "averageProcessingTime": "2.3 days",
      "completionRate": "76%",
      "routingAccuracy": "84%"
    }
  }
}
```

---

#### **GET /gtd-streams/hierarchy-stats**
Pobiera statystyki hierarchii streamów.

**Request:**
```http
GET /api/v1/gtd-streams/hierarchy-stats
Cookie: access_token=<token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStreams": 8,
    "streamsByRole": {
      "INBOX": 1,
      "NEXT_ACTIONS": 2,
      "PROJECTS": 2,
      "WAITING_FOR": 1,
      "SOMEDAY_MAYBE": 1,
      "AREAS": 1,
      "CONTEXTS": 0,
      "REFERENCE": 0
    },
    "hierarchyDepth": {
      "average": 1.5,
      "maximum": 3,
      "minimum": 0
    },
    "gtdCompliance": {
      "compliantStreams": 8,
      "nonCompliantStreams": 0,
      "issues": []
    },
    "orphanedStreams": []
  }
}
```

---

### **📋 PROCESSING RULES**

#### **POST /gtd-streams/{id}/rules**
Tworzy regułę przetwarzania dla streama.

**Request:**
```http
POST /api/v1/gtd-streams/stream-id/rules
Content-Type: application/json
Cookie: access_token=<token>

{
  "name": "Auto-route bug reports",
  "description": "Automatically route bug reports to development team",
  "trigger": {
    "type": "EMAIL_RECEIVED",
    "conditions": {
      "subject_contains": ["bug", "error", "issue"],
      "from_domain": ["client.com"],
      "priority": "HIGH"
    }
  },
  "actions": [
    {
      "type": "ROUTE_TO_STREAM",
      "targetStreamId": "dev-team-actions-id",
      "setContext": "@computer",
      "setEnergy": "HIGH",
      "assignTo": "tech-lead@company.com"
    }
  ],
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rule-id-123",
    "name": "Auto-route bug reports",
    "streamId": "stream-id",
    "enabled": true,
    "createdAt": "2025-07-04T16:00:00Z",
    "trigger": {
      "type": "EMAIL_RECEIVED",
      "conditions": {
        "subject_contains": ["bug", "error", "issue"],
        "from_domain": ["client.com"],
        "priority": "HIGH"
      }
    },
    "actions": [
      {
        "type": "ROUTE_TO_STREAM", 
        "targetStreamId": "dev-team-actions-id",
        "setContext": "@computer",
        "setEnergy": "HIGH"
      }
    ]
  }
}
```

---

### **🔧 UTILITY ENDPOINTS**

#### **POST /gtd-streams/{id}/migrate**
Migruje istniejący stream do GTD.

**Request:**
```http
POST /api/v1/gtd-streams/legacy-stream-id/migrate
Content-Type: application/json
Cookie: access_token=<token>

{
  "gtdRole": "NEXT_ACTIONS",
  "streamType": "WORKSPACE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stream": {
      "id": "legacy-stream-id",
      "name": "Legacy Stream",
      "gtdRole": "NEXT_ACTIONS",
      "streamType": "WORKSPACE",
      "migratedAt": "2025-07-04T16:30:00Z"
    },
    "gtdConfig": {
      "energyTracking": true,
      "timeEstimation": true,
      "contextFiltering": true,
      "sortBy": "PRIORITY_CONTEXT"
    }
  }
}
```

---

#### **POST /gtd-streams/{id}/config/reset**
Resetuje konfigurację do domyślnych wartości dla roli.

**Request:**
```http
POST /api/v1/gtd-streams/stream-id/config/reset
Cookie: access_token=<token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "energyTracking": true,
    "timeEstimation": true,
    "contextFiltering": true,
    "sortBy": "PRIORITY_CONTEXT",
    "showEnergyLevels": true,
    "notificationsEnabled": true,
    "autoRouting": true,
    "resetAt": "2025-07-04T17:00:00Z"
  }
}
```

---

### **❌ ERROR RESPONSES**

Wszystkie endpointy mogą zwrócić następujące błędy:

#### **401 Unauthorized**
```json
{
  "error": "Access token required",
  "code": "MISSING_TOKEN"
}
```

#### **403 Forbidden**
```json
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```

#### **404 Not Found**
```json
{
  "error": "Stream not found",
  "code": "STREAM_NOT_FOUND"
}
```

#### **400 Bad Request**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "gtdRole",
      "message": "Invalid GTD role specified"
    }
  ]
}
```

#### **500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

---

## 📝 **DODATKI**

### **Linki do dokumentacji:**
- **Architektura**: `STREAM_HIERARCHY_IMPLEMENTATION_PLAN.md`
- **Backend Services**: `packages/backend/src/services/EnhancedStreamHierarchyManager.ts`
- **Frontend Components**: `packages/frontend/src/components/streams/GTDStreamManager.tsx`
- **Migration Script**: `packages/backend/migrate-to-gtd-streams.js`

### **Wsparcie techniczne:**
- **Status systemu**: http://91.99.50.80/crm/dashboard/streams/
- **Logi aplikacji**: `docker logs crm-backend-v1`
- **Backup bazy**: `DATABASE_MANUAL.md`

---

**© 2025 CRM-GTD Smart - GTD Streams Manual v1.0**  
**Ostatnia aktualizacja:** 2025-07-04