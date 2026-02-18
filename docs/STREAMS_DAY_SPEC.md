# streams.day -- Specyfikacja produktu B2C

> **Personal Productivity OS oparty na metodologii Sorto Streams**
> Wersja: 1.0 | Data: 2026-02-17

---

## Spis tresci

1. [Wizja produktu](#1-wizja-produktu)
2. [Model mentalny](#2-model-mentalny)
3. [Roznice vs streams.work](#3-roznice-vs-streamswork)
4. [Core features](#4-core-features)
5. [Strategia wspolnego codebase](#5-strategia-wspolnego-codebase)
6. [Mobile-first design](#6-mobile-first-design)
7. [Roznice w podejsciu do AI](#7-roznice-w-podejsciu-do-ai)
8. [Monetyzacja](#8-monetyzacja)
9. [Roadmap](#9-roadmap)
10. [Architektura techniczna](#10-architektura-techniczna)

---

## 1. Wizja produktu

### Haslo

> **"Twoj Drugi Mozg na Autopilocie"**

### Czym jest streams.day?

**streams.day** to personalny system operacyjny produktywnosci -- narzedzie, ktore przechwytuje, organizuje i laczy cala wiedze, zadania, pomysly i relacje w zyciu jednostki. Nie jest to kolejna aplikacja do notatek ani lista zadan. To zyjacy system, ktory uczy sie twojego stylu pracy, sugeruje organizacje i buduje siec polaczen miedzy twoimi mysli.

### Filozofia fundamentalna

Streams.day dziedziczy kluczowa zasade z koncepcji "CRM ktory wyrasta sam" (dokument KONCEPT_SAMOBUDUJACY_CRM):

> **Nie pytaj uzytkownika kim jest. Obserwuj co robi i powiedz mu kim jest.**

W kontekscie B2C to oznacza:

- System nie wymaga konfiguracji na start -- wystarczy zaczac wrzucac informacje
- AI obserwuje wzorce i proponuje strukture (strumienie, tagi, polaczenia)
- Uzytkownik nie musi znac metodologii -- system sam go do niej prowadzi
- Wartosc widoczna od pierwszego dnia, pelna moc po 30 dniach

### Grupa docelowa

```
PRIMARNY TARGET:
  - Freelancerzy i solopreneurzy
  - Knowledge workers (programisci, designerzy, marketingowcy)
  - Tworcy tresci (YouTuberzy, blogerzy, podcasterzy)

SEKUNDARNY TARGET:
  - Studenci i badacze
  - Osoby chcace ogarnac chaos informacyjny
  - Ludzie przechodzacy z GTD/Notion/Obsidian szukajacy "czegoś co dziala samo"
```

### Unikalnosc

| Istniejace narzedzia | Problem | streams.day rozwiazanie |
|----------------------|---------|------------------------|
| Notion, Obsidian | Wymaga manualnej organizacji | AI organizuje za Ciebie |
| Todoist, Things | Tylko zadania, brak kontekstu | Pelny obraz: zadania + wiedza + relacje |
| Roam, Logseq | Stroma krzywa nauki | Zero konfiguracji, progresywne odkrywanie |
| Apple Notes | Brak inteligencji | AI routing, semantyczne wyszukiwanie |
| Readwise | Tylko artykuly/cytaty | Kazde zrodlo: email, glos, zdjecie, link |

---

## 2. Model mentalny

### Dwa koncepty -- identyczne jak w streams.work

Cala metodologia Sorto Streams v3 opiera sie na **dwoch koncetpach**, ktore sa **identyczne** dla obu produktow:

```
+----------------------------------------------+
|                                              |
|   ZRODLO            STRUMIEN                 |
|   ----------        ---------------          |
|   Jedno.            Wiele.                   |
|   Punkt wejscia.    Kontener pracy/zycia.    |
|   Matka strumieni.  Moze miec doplywy.       |
|                     Plynie lub zamarza.       |
|                                              |
+----------------------------------------------+
```

### Zrodlo w streams.day

**Zrodlo** to centralny punkt wejscia -- jedno miejsce, do ktorego wrzucasz WSZYSTKO:

```
ZRODLO (streams.day)
  |
  +-- Notatka glosowa nagrana w samochodzie
  +-- Artykul przeslany przez Magic Email
  +-- Zdjecie paragonu
  +-- Link do ciekawego wideo
  +-- Pomysl zapisany o 3 w nocy
  +-- Wizytowka zeskanowana na konferencji
  +-- Email przekierowany na twoj adres @streams.day
  +-- Cytat z ksiazki
  +-- Zdjecie tablicy po burzy mozgow
  +-- Notatka ze spotkania z klientem
```

Zasada Zrodla pozostaje ta sama:

> *"Zlap wszystko, organizuj pozniej."*
> *"Zrodlo powinno byc puste na koniec dnia."*

### Strumienie w streams.day -- obszary zycia

W streams.work strumienie to klienci, projekty, pipeline sprzedazy. W streams.day strumienie to **obszary zycia i osobiste projekty**:

```
STRUMIEN CIAGLE (Areas):
  Zdrowie
  Finanse
  Relacje
  Rozwoj osobisty
  Kariera/Praca

STRUMIEN PROJEKTOWY (Projects):
  Remont kuchni
  Kurs React Advanced
  Napisac e-book
  Przygotowac prezentacje na konferencje

STRUMIEN REFERENCYJNY (Reference):
  Baza wiedzy: programowanie
  Baza wiedzy: zdrowie i dieta
  Notatki z ksiazek
  Konwersacje z AI

ZAMROZONY (Someday/Maybe):
  Nauczyc sie gry na gitarze
  Podróż do Japonii
  Maraton
  Startup SaaS
```

### Metafora wodna w kontekscie osobistym

```
        ZRODLO
           |
     "Zlap wszystko"
           |
           v
      AI ANALIZUJE
      AI SUGERUJE
           |
     +-----+-----+
     |     |     |
     v     v     v
   Praca  Zycie  Projekty
    |       |       |
  +--+    +--+   +--+
  |  |    |  |   |  |
 ...  ... ... ... ...  ...

  (kazdemu strumien moze
   miec doplywy i doplywy
   doplywow)
```

### Wzorce uzycia strumieni

Identycznie jak w metodologii v3, ale z innymi przykladami:

| Wzorzec | Charakterystyka | Przyklad w streams.day |
|---------|-----------------|----------------------|
| **Projektowy** | Ma deadline, cel koncowy, zamrozi sie po zakonczeniu | "Remont kuchni", "Kurs React" |
| **Ciagly** | Bez deadline'u, stala odpowiedzialnosc, rzadko zamarza | "Zdrowie", "Finanse", "Relacje" |
| **Referencyjny** | Wiedza, dokumenty, materialy -- dostep gdy potrzeba | "Notatki z ksiazek", "Baza wiedzy: JS" |
| **Zamrozony** | Dowolny strumien w stanie zamarznietym | "Napisac ksiazke", "Podróż do Japonii" |

### Cele Precyzyjne (RZUT) w streams.day

System RZUT (Rezultat, Zmierzalnosc, Ujscie, Tlo) dziala identycznie, ale cele sa osobiste:

```
PRZYKLAD CELU RZUT (streams.day):

R -- Rezultat:      Schudnac 8 kg
Z -- Zmierzalnosc:  Waga poranna, co tydzien
U -- Ujscie:        Do 1 czerwca 2026
T -- Tlo:           Lepsze samopoczucie + badania w normie

current_value: 92 kg
target_value: 84 kg
unit: kg
stream_id: -> Zdrowie
```

---

## 3. Roznice vs streams.work

### Porownanie architektoniczne

| Aspekt | streams.work (B2B) | streams.day (B2C) |
|--------|-------------------|-------------------|
| **Target** | Firmy, zespoly | Osoby, freelancerzy |
| **Organizacja** | Multi-user, role, uprawnienia | Single-user (opcjonalnie shared) |
| **Core entities** | Company, Contact, Deal, Pipeline | PersonalStream, KnowledgeNode, LifeArea |
| **CRM** | Pelny: firmy, kontakty, deale, stakeholderzy | Lekki: osobiste kontakty, relacje |
| **Pipeline** | Lejek sprzedaży z DealStage | Brak -- zamiast tego Life Pipeline (custom) |
| **Email** | Email triage, pipeline emailowy, HITL klasyfikacja | Magic Email -- universal input |
| **AI focus** | Klasyfikacja, ekstrakcja encji, HITL, scoring leadow | Routing, capture enhancement, semantyczne polaczenia |
| **Mobile** | Desktop-first, mobile planned | Mobile-first, desktop companion |
| **Onboarding** | Retroaktywny skan emaili -> propozycje firm/kontaktow | Progresywne pytania -> propozycje obszarow zycia |
| **Knowledge** | Dokumenty firmowe, wiki, baza wiedzy zespolowa | PKM: notatki, artykuly, cytaty, semantic search |
| **Raporty** | Pipeline value, conversion rates, team KPI | Personal analytics: produktywnosc, nawyki, wzorce |

### Encje CRM vs encje PKM

**streams.work -- encje CRM (juz zaimplementowane):**

```prisma
// Istniejace modele w schemacie Prisma:
Company    { name, domain, industry, nip, vatActive, deals... }
Contact    { firstName, lastName, email, phone, position, company... }
Deal       { title, value, stage, probability, expectedCloseDate... }
DealStakeholder { role, influence, sentiment... }
Event      { name, location, startDate, endDate, eventCompanies... }
EntityLink { sourceType, targetType, linkType, metadata... }
```

**streams.day -- encje PKM (do zaimplementowania):**

```
KnowledgeNode  { title, content, type, tags, embeddings, connections }
PersonalContact { name, relationship, context, lastInteraction }
LifeArea       { name, healthScore, goals, habits, metrics }
CaptureItem    { content, source, mediaType, transcription, aiAnalysis }
Bookmark       { url, title, summary, tags, highlights }
JournalEntry   { date, mood, energy, content, tags }
Habit          { name, frequency, streak, linkedGoal }
```

### Routing -- ta sama zasada, inne dane

**streams.work:**
```
Email od jan@abcokna.pl
  -> AI rozpoznaje kontakt: Jan Kowalski (ABC Okna)
  -> AI sugeruje strumien: ABC Okna -> Budma 2026
  -> AI wyciaga: zadanie "faktura 50%", deadline 15.01
  -> HITL: [Zatwierdz] [Koryguj] [Odrzuc]
```

**streams.day:**
```
Notatka glosowa: "Trzeba umowic sie do dentysty
  w przyszlym tygodniu, i chyba powinienem
  wrocic do biegania, maraton w czerwcu..."
  -> AI transkrybuje (Speech-to-Text)
  -> AI wyciaga:
     - Zadanie: "Umowic wizyte u dentysty" -> Zdrowie
     - Pomysl: "Wrocic do biegania" -> Zdrowie -> Bieganie
     - Cel: "Maraton w czerwcu" -> Kiedys/Moze (lub nowy cel RZUT)
  -> HITL: [Zatwierdz] [Koryguj] [Odrzuc]
```

---

## 4. Core features

### 4.1 Magic Email -- email jako uniwersalny input

**Koncept:** Kazdy uzytkownik streams.day otrzymuje unikalny adres email:

```
jan.x7k2@inbox.streams.day
```

Na ten adres mozna przeslac **cokolwiek** -- AI to przetworzy i skieruje:

```
FORWARDED ARTICLE:
  Email: "FW: 10 Best TypeScript Patterns"
  -> AI: Artykul o TypeScript
  -> Sugestia: Baza wiedzy: Programowanie
  -> [Zatwierdz]

RECEIPT PHOTO:
  Email z zalacznikiem: receipt.jpg
  -> AI: OCR -> paragon, 234 PLN, Biedronka
  -> Sugestia: Finanse -> Wydatki
  -> Auto-kategoryzacja: zakupy spozywcze

FORWARDED NEWSLETTER:
  Email: "FW: Morning Brew Daily"
  -> AI: Newsletter biznesowy
  -> Wyciaga kluczowe punkty
  -> Sugestia: Referencja -> News -> Biznes

PERSONAL EMAIL:
  Email: "Hej, spotkajmy sie w czwartek na kawe"
  -> AI: Spotkanie towarzyskie
  -> Sugestia: Relacje -> [osoba] -> zadanie "kawa czwartek"
```

**Techniczne:** Wykorzystuje istniejacy email pipeline (`RuleProcessingPipeline`), ale z innym zestawem promptow ekstrakcyjnych -- bez encji CRM, z encjami PKM.

### 4.2 Voice Capture -- notatki glosowe z AI

**Koncept:** Nagrywaj notatki glosowe w dowolnym momencie -- AI transkrybuje, analizuje i kieruje do wlasciwego strumienia.

```
PRZEPLYW VOICE CAPTURE:

  Przycisk "Nagraj"
       |
       v
  Nagranie audio (telefon, komputer)
       |
       v
  Speech-to-Text (Whisper/DeepGram)
       |
       v
  AI analizuje transkrypcje:
    - Wyciaga zadania i action items
    - Identyfikuje osoby i tematy
    - Okresla sentyment i energie
    - Sugeruje strumien docelowy
       |
       v
  Uzytkownik zatwierdza/koryguje
       |
       v
  Element w strumieniu + transkrypcja + audio oryginalne
```

**Przyklad:**
```
Nagranie: "Wlasnie skonczylem spotkanie z Markiem,
  swietny pomysl na wspólny projekt - aplikacja do
  rezerwacji kort tenisowych. Muszę przygotowac
  wstepny wireframe do piatku. Aha, i kupic mleko
  w drodze do domu."

AI wyciaga:
  - Kontakt: Marek (istniejacy lub nowy)
  - Projekt: "Aplikacja rezerwacji kort" -> NOWY STRUMIEN?
  - Zadanie: "Wireframe do piatku" -> Praca -> Projekty
  - Zadanie: "Kupic mleko" -> zrob teraz (< 2 min)
  - Sentyment: pozytywny, wysoka energia
```

**Techniczne:** Istniejacy backend ma juz infrastrukture Voice TTS (`CoquiTTSService`). Voice Capture wymaga dodania Speech-to-Text (odwrotny kierunek) -- Whisper API lub DeepGram. Transkrypcja przechodzi przez Flow Engine (ten sam `InboxItem` z `FlowElementType.VOICE`).

### 4.3 Photo Capture -- skan dokumentow i wizytowek

**Koncept:** Zrob zdjecie czegokolwiek -- AI rozpozna co to jest i przetworzy.

```
TYPY ROZPOZNAWANYCH ZDJEC:

  IMAGE_BUSINESS_CARD  -> Nowy kontakt personalny
  IMAGE_RECEIPT        -> Wydatek w Finanse
  IMAGE_WHITEBOARD     -> Notatka -> odpowiedni strumien
  IMAGE_DOCUMENT       -> OCR -> przetworzenie tresci
  IMAGE_BOOK_PAGE      -> Cytat -> Baza wiedzy
  IMAGE_SCREENSHOT     -> Link/informacja -> routing AI
```

**Techniczne:** Schemat Prisma juz zawiera `FlowElementType` z typami `IMAGE_BUSINESS_CARD`, `IMAGE_RECEIPT`, `IMAGE_WHITEBOARD`. Potrzebny jest: OCR service (Google Vision / Tesseract), specjalizowane prompty per typ obrazu, frontend mobilny z kamera.

### 4.4 Knowledge Graph -- polaczenia miedzy ideami

**Koncept:** AI automatycznie buduje siec polaczen miedzy wszystkimi elementami w systemie.

```
KNOWLEDGE GRAPH (wizualnie):

     Artykul: "React Patterns"
              |
              +------------ Tag: #react
              |                  |
     Notatka: "Pomysl na       Kurs: "React Advanced"
      komponent..."                  |
              |                      |
              +------+------+--------+
                     |
              Projekt: "Redesign strony"
                     |
              +------+------+
              |             |
     Kontakt: Marek    Termin: 15 marca
     "wspólny projekt"
```

**Typy polaczen:**

| Typ polaczenia | Jak AI je tworzy | Przyklad |
|----------------|-----------------|---------|
| **Semantyczne** | Podobna tresc (embeddingi) | Artykul o React <-> Notatka o React |
| **Chronologiczne** | Ten sam dzien/tydzien | Notatka z poniedzialkowego spotkania <-> email z poniedzialku |
| **Przez osoby** | Ta sama osoba wspomniana | Notatka glosowa o Marku <-> Email od Marka |
| **Przez tagi** | Wspolne tagi | Wszystko z tagiem #finanse |
| **Przez strumien** | Ten sam strumien | Elementy w "Zdrowie -> Dieta" |
| **Przez cel** | Powizane z celem RZUT | Zadania powiazane z celem "Schudnac 8 kg" |

**Techniczne:** Istniejacy model `EntityLink` (`sourceType`, `targetType`, `linkType`, `metadata`) jest juz generyczny i moze sluzyc jako baza. System RAG z wektorami (371 wektorow juz zindeksowanych) zapewnia semantic search. Potrzeba: rozszerzenia EntityLink o AI-generowane polaczenia, frontend z wizualizacja grafu (D3.js / vis.js), algorytm odkrywania polaczen.

### 4.5 Personal PKM -- notatki z semantycznym wyszukiwaniem

**Koncept:** Pelny system Personal Knowledge Management -- notatki, artykuly, cytaty, zakladki, wszystko z wyszukiwaniem semantycznym.

```
PKM STRUKTURA:

  Notatki
    |-- Fleeting (szybkie myśli, pomysly)
    |-- Literature (notatki z ksiazek, artykulow)
    |-- Permanent (przetworzona wiedza)
    |-- Project (notatki powiazane z projektami)

  Artykuly i linki
    |-- Read Later
    |-- Highlights & Annotations
    |-- Summaries (AI-generated)

  Cytaty i fragmenty
    |-- Z ksiazek
    |-- Z artykulow
    |-- Z podcastow/wideo

  Konwersacje AI
    |-- ChatGPT
    |-- Claude
    |-- DeepSeek
```

**Wyszukiwanie semantyczne:**
```
Zapytanie: "Co wiem o zarzadzaniu energią w ciagu dnia?"

Wyniki (semantic search, nie keyword match):
  1. Notatka z ksiazki "Deep Work" - Cal Newport (confidence: 0.92)
  2. Artykul "Chronotypes and Productivity" (confidence: 0.87)
  3. Notatka glosowa z 15.01: "po obiedzie mam spadek..." (confidence: 0.81)
  4. Cel RZUT: "Poprawa produktywnosci" (confidence: 0.76)
```

**Techniczne:** Istniejacy system RAG z `vector_documents`, `vector_cache`, `vector_search_results` jest gotowy. Schemat `AiSource` (CHATGPT, CLAUDE, DEEPSEEK) juz obsluguje import konwersacji AI. Potrzeba: rozszerzenia typow dokumentow PKM, Readwise-like clipping, mobile quick-capture.

### 4.6 Daily Review -- poranny briefing AI

**Koncept:** Kazdy poranek AI generuje spersonalizowany briefing -- co sie stalo, co wymaga uwagi, jakie sa priorytety.

```
+-------------------------------------------------+
| AI PORANNY BRIEFING -- Poniedzialek, 17.02.2026 |
|-------------------------------------------------|
|                                                 |
| ZRODLO: 4 nowe elementy                        |
|   - 2 gotowe sugestie do zatwierdzenia          |
|   - 2 wymagaja Twojej decyzji                   |
|                                                 |
| WYMAGA UWAGI:                                   |
|   - Wizyta u dentysty -- DZIS o 14:00           |
|   - Wireframe dla Marka -- deadline piatek      |
|   - Rata kredytu -- za 3 dni                    |
|                                                 |
| TWOJE NAWYKI DZIS:                               |
|   - Bieganie (streak: 12 dni) -- zaplanowane 7:00|
|   - Medytacja (streak: 5 dni)                   |
|   - Czytanie 30 min                             |
|                                                 |
| CELE W TOKU:                                    |
|   - "Schudnac 8 kg" -- 89/84 kg (62% do celu)  |
|   - "Kurs React" -- 7/12 modulow (58%)          |
|                                                 |
| AI SPOSTRZEZENIA:                               |
|   - "W poniedzialki masz najwyzsza energie      |
|     rano -- idealne na wireframe dla Marka"      |
|   - "Artykul o React Patterns z zeszlego         |
|     tygodnia moze sie przydac do kursu"          |
|                                                 |
| [Rozpocznij dzien ->]                           |
+-------------------------------------------------+
```

**Techniczne:** Istniejacy Smart Day Planner (`day_templates`, `energy_time_blocks`, `energy_patterns`) zapewnia baze. AI briefing to rozszerzenie obecnego systemu rekomendacji -- inne prompty, osobisty kontekst zamiast biznesowego.

---

## 5. Strategia wspolnego codebase

### Zasada: jeden codebase, dwa produkty

```
                   WSPOLNY CODEBASE
                        |
          +-------------+-------------+
          |                           |
     streams.work               streams.day
     (B2B / CRM)               (B2C / PKM)
     PRODUCT_MODE=work         PRODUCT_MODE=day
```

### Co jest wspolne (shared)

Ponizsze elementy sa juz zaimplementowane w codebase i moga byc wspolne dla obu produktow bez zmian lub z minimalnymi modyfikacjami:

| Komponent | Lokalizacja | Wspolny? | Uwagi |
|-----------|-------------|----------|-------|
| **StreamRole / StreamStatus** | `schema.prisma` enum | Wspolny | INBOX, PROJECTS, AREAS, REFERENCE, SOMEDAY_MAYBE -- identyczne |
| **StreamConfig / gtdConfig** | `schema.prisma` JSON field | Wspolny | Konfiguracja per rola -- ta sama mechanika |
| **Stream hierarchia** | `stream_relations` + CTE queries | Wspolny | Doplywy, drzewo, breadcrumb -- identyczne |
| **AI Router** | `services/ai/AIRouter.ts` | Wspolny | Hub wysylajacy requesty do providerow |
| **Flow Engine** | `flow_learned_patterns`, `flow_automation_rules` | Wspolny | Uczenie z decyzji usera, reguly |
| **InboxItem + FlowElementType** | `schema.prisma` | Wspolny | 10 typow elementow -- identyczne |
| **Flow Processing** | `flow_processing_history` | Wspolny | Historia przetwarzania |
| **RAG / Vector Search** | `vector_documents`, RAG pipeline | Wspolny | Semantyczne wyszukiwanie |
| **Precise Goals (RZUT)** | `precise_goals` | Wspolny | Cele -- identyczna mechanika |
| **Timeline** | `timeline` | Wspolny | Historia aktywnosci |
| **Tags** | `tags` | Wspolny | System tagow |
| **Auth / Users** | `users`, `organizations` | Wspolny | Autentykacja |
| **AI Providers / Models** | `ai_providers`, `ai_models` | Wspolny | Konfiguracja AI |
| **AI Rules Engine** | `ai_rules`, `UniversalRuleEngine` | Wspolny | Reguly automatyzacji |
| **Processing Rules** | `processing_rules` | Wspolny | Reguly przetwarzania |
| **Recurring Tasks** | `recurring_tasks` | Wspolny | Zadania cykliczne |

### Co jest inne (product-specific)

| Komponent | streams.work | streams.day |
|-----------|-------------|-------------|
| **CRM Entities** | Company, Contact, Deal, DealStakeholder, DealCompetitor | PersonalContact, Bookmark, JournalEntry, Habit |
| **Pipeline** | DealStage (PROSPECT -> QUALIFICATION -> ... -> WON/LOST) | Brak klasycznego pipeline -- Life Pipeline opcjonalnie |
| **Email Pipeline** | RuleProcessingPipeline: 5-etapowa klasyfikacja biznesowa | Magic Email: ekstrakcja osobista, routing do life areas |
| **AI Prompts** | EMAIL_BIZ_TRIAGE, entity extraction (firma, kontakt, deal) | PERSONAL_CAPTURE_TRIAGE, personal routing (area, project, habit) |
| **Dashboard** | Pipeline value, conversion rates, team KPI | Personal analytics, nawyki, cele, energie |
| **Onboarding** | Retroaktywny skan emaili -> propozycje firm | Progresywne pytania -> propozycje obszarow zycia |
| **Multi-user** | Tak: role, permissions, team collaboration | Nie: single user (opcjonalnie shared streams) |
| **Events** | Targi (Event, EventCompany, EventContact) | Personal events / calendar integration |
| **Knowledge** | Firmowa wiki, dokumenty zespolowe | PKM: notatki, artykuly, cytaty, graf wiedzy |

### Feature flags / product mode

Przelaczanie miedzy produktami na poziomie:

```typescript
// env variable
PRODUCT_MODE = 'work' | 'day'

// Konfiguracja per organizacja (w Organization.settings JSON)
{
  "productMode": "day",
  "features": {
    "crm": false,          // Company, Contact, Deal
    "pipeline": false,     // DealStage pipeline
    "magicEmail": true,    // Magic Email input
    "voiceCapture": true,  // Voice memos
    "knowledgeGraph": true,// Wizualny graf wiedzy
    "habits": true,        // Tracking nawykow
    "journal": true,       // Dziennik
    "teamCollaboration": false
  }
}

// Middleware sprawdzajacy dostep do features
function requireFeature(feature: string) {
  return (req, res, next) => {
    const org = req.organization;
    if (!org.settings.features[feature]) {
      return res.status(403).json({ error: `Feature ${feature} not available` });
    }
    next();
  };
}

// Routing -- te same endpointy, inne zachowanie
app.use('/api/v1/stream-management', streamManagementRoutes); // Wspolne
app.use('/api/v1/source', sourceRoutes);                       // Wspolne (Zrodlo)
app.use('/api/v1/precise-goals', preciseGoalsRoutes);          // Wspolne (RZUT)
app.use('/api/v1/companies', requireFeature('crm'), companyRoutes);     // Tylko work
app.use('/api/v1/contacts', requireFeature('crm'), contactRoutes);      // Tylko work
app.use('/api/v1/deals', requireFeature('pipeline'), dealRoutes);       // Tylko work
app.use('/api/v1/knowledge-graph', requireFeature('knowledgeGraph'), graphRoutes); // Tylko day
app.use('/api/v1/habits', requireFeature('habits'), habitRoutes);       // Tylko day
app.use('/api/v1/journal', requireFeature('journal'), journalRoutes);   // Tylko day
```

### AI Prompts -- ten sam engine, inne prompty

```
streams.work prompt (EMAIL_BIZ_TRIAGE):
  "Analizujesz email biznesowy. Wyodrebnij:
   - Firme nadawcy
   - Kontakt (imie, nazwisko, stanowisko)
   - Wartosc deala
   - Pilnosc
   - Sugerowany strumien klienta"

streams.day prompt (PERSONAL_CAPTURE_TRIAGE):
  "Analizujesz osobisty element. Wyodrebnij:
   - Zadania do zrobienia
   - Powiazane osoby
   - Powiazany obszar zycia
   - Emocje/sentyment
   - Powiazania z istniejacymi strumieniami"
```

Tabela `ai_prompt_templates` juz obsługuje to -- wystarczy dodac nowe szablony z `product_mode` tagiem.

---

## 6. Mobile-first design

### Zasada: Capture Anywhere, Process Later

```
MOBILE (90% czasu):          DESKTOP (10% czasu):
  - Quick Capture              - Deep Work
  - Voice Memo                 - Knowledge Graph
  - Photo Scan                 - Przeglaad tygodniowy
  - Zatwierdzanie sugestii     - Planowanie celow
  - Poranny briefing           - Analityka
  - Nawyki check-in            - Organizacja strumieni
```

### Tri-Channel Architecture

```
  MOBILE APP               MAGIC EMAIL            WEB DASHBOARD
  -----------              -----------            ---------------
  Quick Capture            Power Users            Deep Work
  "3 taps max"            "Forward anything"     "Knowledge Graph"
       |                        |                       |
       +------------------------+-----------------------+
                                |
                         BACKEND API
                         (wspolny)
```

### Mobile UX -- zasady

1. **Capture w 3 tapnieciach**: Otworz app -> Nagrywaj/Pisz/Fotografuj -> Gotowe
2. **Zatwierdzanie gestem**: Swipe right = zatwierdz sugestie AI, swipe left = odrzuc
3. **Offline-first**: Capture dziala offline, sync gdy jest internet
4. **Notyfikacje kontekstowe**: "Jestes blisko dentysty -- wizyta jutro o 14:00"
5. **Widget na home screen**: Dzisiejsze priorytety + quick capture button

### Technologia mobilna

```
React Native / Expo
  |
  +-- Shared business logic (TypeScript)
  |     |-- Identyczne typy jak web
  |     |-- API client wspolny
  |     |-- Offline storage (SQLite / WatermelonDB)
  |
  +-- Native modules
  |     |-- Speech-to-Text (Whisper on-device)
  |     |-- Camera + OCR
  |     |-- Push notifications
  |     |-- Background sync
  |
  +-- UI
        |-- Tailwind-like (NativeWind)
        |-- Gesture-based navigation
        |-- Haptic feedback
```

---

## 7. Roznice w podejsciu do AI

### streams.work -- AI jako asystent biznesowy

Obecna implementacja AI w streams.work jest skoncentrowana na:

| Zadanie AI | Implementacja | Cel |
|-----------|---------------|-----|
| **Klasyfikacja emaili** | `RuleProcessingPipeline` -- 5-etapowy pipeline | Kategoryzacja emaili biznesowych |
| **Ekstrakcja encji** | Prompty EMAIL_BIZ_TRIAGE | Wyciaganie firm, kontaktow, kwot, terminow |
| **HITL entity creation** | `ai_suggestions` + AnalysisPreviewModal | Propozycje tworzenia encji CRM |
| **Email triage** | `runBusinessTriage()` -- dwuetapowy | Kategoryzacja + specjalistyczna analiza |
| **Lead scoring** | Na podstawie interakcji i pipeline | Ocena jakosci leada |
| **Follow-up reminders** | Reguly automatyzacji | Przypomnienia o braku odpowiedzi |

### streams.day -- AI jako osobisty asystent

W streams.day AI pelni inna role -- jest bardziej "osobistym asystentem" niz "asystentem biznesowym":

| Zadanie AI | Rola | Przyklad |
|-----------|------|---------|
| **Routing personalny** | Kierowanie elementow do obszarow zycia | Notatka o diecie -> Zdrowie -> Dieta |
| **Capture enhancement** | Wzbogacanie surowego inputu | Notatka glosowa -> strukturyzowane zadania + kontakst |
| **Semantyczne polaczenia** | Odkrywanie polaczen miedzy elementami | "Ten artykul o mindfulness laczy sie z Twoim celem o medytacji" |
| **Personal patterns** | Rozpoznawanie osobistych wzorcow | "W poniedzialki rano masz najwyzsza energie" |
| **Habit coaching** | Wspieranie nawykow | "Streak biegania: 12 dni! Jutro bedzie 13" |
| **Daily synthesis** | Generowanie podsumowania dnia | "Dzis: 5 zadan, 2 nowe pomysly, 1 nowy kontakt" |
| **Knowledge synthesis** | Laczenie wiedzy z roznych zrodel | "Z 3 artykulow o React wynika, ze..." |
| **Journal prompts** | Sugestie do dziennika | "Wspomniałes o spotkaniu z Markiem -- jak poszlo?" |

### Roznice w AI pipeline

```
streams.work AI pipeline:
  Email -> EMAIL_BIZ_TRIAGE -> Entity Extraction -> HITL -> CRM Entities

streams.day AI pipeline:
  Capture -> PERSONAL_CAPTURE_TRIAGE -> Task Extraction -> Semantic Linking
       |
       +-> Knowledge Graph Update
       +-> Habit/Goal Progress Update
       +-> Pattern Learning
```

### Wspolne fundamenty AI

Oba produkty korzystaja z tych samych fundamentow:

- **AIRouter** (`services/ai/AIRouter.ts`) -- centralny hub
- **ai_action_config** -- mapowanie typ operacji -> model AI
- **ai_executions** -- logowanie kazdego wywolania
- **flow_learned_patterns** -- uczenie z decyzji uzytkownika
- **3 poziomy autonomii** -- Sugestia / Asystent / Autopilot
- **Human-in-the-Loop** -- AI sugeruje, czlowiek decyduje

---

## 8. Monetyzacja

### Model: Freemium z Pro i Team

| Plan | Cena | Zawiera |
|------|------|---------|
| **Free** | $0/mc | 50 elementow/mc, podstawowy routing, 1 strumien Zrodlo, 5 strumieni |
| **Pro** | $9.99/mc | Unlimited elementy, Knowledge Graph, Priority AI, Voice Capture, nieograniczone strumienie, Daily Review AI |
| **Team** | $19.99/user/mc | Shared streams, collaboration, team analytics |

### Free -- wystarczajaco, zeby sie zakochac

Plan Free musi byc **uzyteczny** -- nie demo, ale prawdziwe narzedzie z ograniczeniami:

- 50 elementow miesiecznie do Zrodla (email, glos, zdjecie)
- Podstawowy AI routing (1 sugestia, bez semantycznego wyszukiwania)
- 5 strumieni + Zrodlo
- 3 cele RZUT
- Poranny briefing (podstawowy, bez AI spostrzezen)
- Web + Mobile

### Pro -- pelna moc

- Nieograniczone elementy i strumienie
- Knowledge Graph z wizualizacja
- Semantyczne wyszukiwanie (RAG)
- Voice Capture z AI transkrypcja
- Photo Capture z OCR
- Daily Review z AI spostrzezeniami
- Habit tracking
- Personal analytics
- Priority AI (szybszy model, wiecej kontekstu)
- Custom AI rules / autopilot

### Team -- freelancerzy + klienci

- Wszystko z Pro
- Shared streams z klientami
- Uprawnienia per stream (read-only, edit)
- Team dashboard
- Export raportow

### Metryki monetyzacji

| Metryka | Cel | Jak mierzyc |
|---------|-----|-------------|
| Free -> Pro conversion | 5-8% | Monthly cohort analysis |
| Pro retention (30 day) | 85%+ | Churn rate |
| Monthly Active Users | Growth 15%/mc | DAU/MAU ratio |
| Elements captured/user/day | 5+ | Engagement metric |
| Time to first "aha moment" | < 3 dni | Source empty first time |
| NPS | 50+ | Quarterly survey |

---

## 9. Roadmap

### Faza 0: Przygotowanie codebase (4 tygodnie)

**Cel:** Rozdzielenie product modes bez naruszania streams.work.

```
Tydzien 1-2: Product Mode Infrastructure
  - Feature flags system w Organization.settings
  - Middleware requireFeature()
  - Warunkowe ladowanie routow
  - Testy -- streams.work dziala identycznie po zmianach

Tydzien 3-4: AI Prompt Templates dla streams.day
  - Nowe szablony: PERSONAL_CAPTURE_TRIAGE, VOICE_ANALYSIS, IMAGE_PERSONAL
  - Konfiguracja ai_action_config dla product_mode=day
  - Testy promptow z przykladowymi danymi
```

### Faza 1: Core Capture (6 tygodni)

**Cel:** Dzialajacy Zrodlo z Magic Email i Quick Capture na web.

```
Tydzien 1-2: Magic Email
  - Generowanie unikalnych adresow email per user
  - Inbound email processing (Mailgun/SendGrid webhook)
  - Routing przez AI z promptami PKM
  - Frontend: podglad elementow ze Zrodla

Tydzien 3-4: Web Quick Capture
  - Rozszerzenie InboxItem o typy PKM
  - Frontend: modal quick capture (tekst, link, pomysl)
  - Browser extension: "Save to streams.day"
  - AI routing do strumieni osobistych

Tydzien 5-6: Personal Streams Setup
  - Onboarding: progresywne pytania o obszarach zycia
  - Default strumienie osobiste (Praca, Zycie, Projekty, Wiedza)
  - Poranny briefing (wersja podstawowa)
  - MVP Daily Review
```

### Faza 2: Voice & Photo (4 tygodnie)

**Cel:** Capture multimedialny dzialajacy na mobile web.

```
Tydzien 1-2: Voice Capture
  - Integracja Speech-to-Text (Whisper API)
  - Processing pipeline: audio -> tekst -> AI analysis -> routing
  - Frontend: przycisk nagrywania + podglad transkrypcji

Tydzien 3-4: Photo Capture
  - OCR service (Google Vision / Tesseract)
  - Specjalizowane prompty per typ obrazu
  - Frontend: kamera + podglad OCR + routing
```

### Faza 3: Knowledge Graph & PKM (6 tygodni)

**Cel:** Semantyczne polaczenia i pelny PKM.

```
Tydzien 1-2: Knowledge Nodes
  - Model danych KnowledgeNode (notatki, cytaty, artykuly)
  - Wektorowe indeksowanie (rozszerzenie RAG)
  - CRUD API + frontend

Tydzien 3-4: Knowledge Graph
  - AI-generowane polaczenia miedzy elementami
  - Frontend: wizualizacja grafu (D3.js)
  - Semantic search interface

Tydzien 5-6: Daily Review AI
  - Zaawansowany poranny briefing z AI spostrzezeniami
  - Pattern recognition (osobiste wzorce)
  - Goal progress tracking z sugestiami
```

### Faza 4: Mobile App (8 tygodni)

**Cel:** Natywna aplikacja mobilna -- core experience.

```
Tydzien 1-3: React Native setup
  - Shared business logic
  - API client + offline storage
  - Push notifications

Tydzien 4-5: Capture Flows
  - Voice recording + STT
  - Camera + OCR
  - Quick text capture
  - Offline queue + sync

Tydzien 6-7: Daily Experience
  - Poranny briefing
  - Strumienie przeglad
  - Gesture-based approval (swipe)
  - Widget home screen

Tydzien 8: Polish & Beta
  - TestFlight / Google Play Beta
  - Performance optimization
  - Crash reporting
```

### Faza 5: Habits, Journal & Analytics (4 tygodnie)

**Cel:** Lifestyle features -- nawyki, dziennik, analityka osobista.

```
Tydzien 1-2: Habits
  - Habit model + streak tracking
  - Powiazanie z celami RZUT
  - Push notifications reminders

Tydzien 3-4: Journal & Analytics
  - JournalEntry model + AI prompts
  - Personal analytics dashboard
  - Energy patterns visualization
  - Weekly/monthly summaries
```

### Faza 6: Public Launch (4 tygodnie)

```
  - Landing page streams.day
  - Stripe payment integration
  - Onboarding flow finalizacja
  - App Store / Play Store submission
  - Marketing: ProductHunt, HackerNews
  - Content marketing: blog, YouTube
```

### Timeline sumaryczny

```
   Faza 0    Faza 1    Faza 2    Faza 3    Faza 4    Faza 5   Faza 6
  |---------|---------|---------|---------|---------|---------|---------|
  4 tyg      6 tyg     4 tyg     6 tyg     8 tyg     4 tyg    4 tyg

  Product    Core      Voice &   Knowledge  Mobile   Habits   Public
  Mode       Capture   Photo     Graph &    App      Journal  Launch
  Setup                          PKM                 Analytics

  Laczny czas: ~36 tygodni (~9 miesiecy)
  MVP (web): po Fazie 1 (~10 tyg)
  MVP (mobile): po Fazie 4 (~28 tyg)
  Public Launch: ~36 tyg
```

---

## 10. Architektura techniczna

### Schemat ogolny

```
                        +------------------+
                        |   CDN / Edge     |
                        |   (Cloudflare)   |
                        +--------+---------+
                                 |
                    +------------+------------+
                    |                         |
           +--------+--------+      +--------+--------+
           | Web Frontend    |      | Mobile App      |
           | (Next.js)       |      | (React Native)  |
           | streams.day UI  |      | iOS + Android   |
           +--------+--------+      +--------+--------+
                    |                         |
                    +------------+------------+
                                 |
                        +--------+---------+
                        | API Gateway      |
                        | (Nginx / Kong)   |
                        +--------+---------+
                                 |
              +-----------+------+------+-----------+
              |           |             |           |
     +--------+--+  +----+------+ +----+------+ +--+--------+
     | Backend   |  | AI Service| | Voice STT | | Email     |
     | (Express) |  | (AI Router| | (Whisper) | | Inbound   |
     | Prisma    |  |  + RAG)   | |           | | (webhook) |
     +--------+--+  +----+------+ +-----------+ +-----------+
              |           |
     +--------+--+  +----+------+
     | PostgreSQL|  | Vector DB |
     | (main DB) |  | (pgvector)|
     +--------+--+  +-----------+
              |
     +--------+--+
     | Redis     |
     | (cache +  |
     |  queues)  |
     +-----------+
```

### Jak to wpasowuje sie w istniejacy codebase

Istniejacy codebase Sorto CRM (`packages/backend`, `packages/frontend`) jest juz zorganizowany tak, ze dodanie streams.day wymaga glownie:

**Backend -- nowe pliki:**
```
packages/backend/src/
  routes/
    personalCapture.ts       // Magic Email + Quick Capture dla day
    knowledgeGraph.ts        // Knowledge Graph API
    habits.ts                // Nawyki tracking
    journal.ts               // Dziennik
    personalAnalytics.ts     // Analityka osobista
  services/
    PersonalCaptureService.ts // Processing dla day mode
    KnowledgeGraphService.ts  // Graf wiedzy
    DailyReviewService.ts     // Poranny briefing
    VoiceSTTService.ts        // Speech-to-Text (odwrotnosc CoquiTTS)
  middleware/
    productMode.ts           // Feature flags middleware
```

**Backend -- modyfikacje istniejacych plikow:**
```
app.ts                       // Warunkowe ladowanie routow
routes/flow.ts               // Alternatywne prompty dla day mode
routes/source.ts             // Rozszerzenie typow capture
services/ai/AIRouter.ts      // Product-aware prompt selection
prisma/schema.prisma         // Nowe modele PKM
prisma/seed-prompts.ts       // Nowe szablony promptow
```

**Frontend -- nowe pliki:**
```
packages/frontend/src/
  app/dashboard/
    knowledge-graph/page.tsx
    habits/page.tsx
    journal/page.tsx
    daily-review/page.tsx
    personal-analytics/page.tsx
  components/
    pkm/
      KnowledgeGraphView.tsx
      NoteCard.tsx
      BookmarkCard.tsx
    habits/
      HabitTracker.tsx
      StreakBadge.tsx
    journal/
      JournalEntry.tsx
      JournalPrompt.tsx
    capture/
      VoiceRecorder.tsx
      PhotoCapture.tsx
      QuickCaptureModal.tsx
```

### Nowe modele Prisma (do dodania)

```prisma
// --- streams.day specific models ---

model KnowledgeNode {
  id              String   @id @default(uuid())
  title           String
  content         String   @db.Text
  type            KnowledgeNodeType  // FLEETING, LITERATURE, PERMANENT, PROJECT
  tags            String[] @default([])
  embedding       Json?    // Vector embedding for semantic search
  sourceUrl       String?
  sourceType      String?  // book, article, podcast, video, conversation
  highlights      Json?    // Array of highlighted passages
  summary         String?  // AI-generated summary
  organizationId  String
  createdById     String
  streamId        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  connections     KnowledgeConnection[] @relation("KnowledgeSource")
  connectedFrom   KnowledgeConnection[] @relation("KnowledgeTarget")
  stream          Stream?  @relation(fields: [streamId], references: [id])

  @@map("knowledge_nodes")
}

model KnowledgeConnection {
  id              String   @id @default(uuid())
  sourceId        String
  targetId        String
  connectionType  String   // semantic, chronological, person, tag, stream, goal
  strength        Float    @default(0.5)  // 0-1, AI confidence
  aiGenerated     Boolean  @default(true)
  confirmedByUser Boolean  @default(false)
  metadata        Json?
  createdAt       DateTime @default(now())

  source          KnowledgeNode @relation("KnowledgeSource", fields: [sourceId], references: [id])
  target          KnowledgeNode @relation("KnowledgeTarget", fields: [targetId], references: [id])

  @@unique([sourceId, targetId])
  @@map("knowledge_connections")
}

model Habit {
  id              String   @id @default(uuid())
  name            String
  description     String?
  frequency       Frequency  // DAILY, WEEKLY, etc. (istniejacy enum)
  targetStreak    Int?
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  completions     Json     @default("[]")  // Array of completion dates
  isActive        Boolean  @default(true)
  color           String   @default("#10B981")
  icon            String?
  goalId          String?  // FK -> precise_goals
  streamId        String?  // FK -> Stream
  organizationId  String
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  goal            precise_goals? @relation(fields: [goalId], references: [id])
  stream          Stream?  @relation(fields: [streamId], references: [id])

  @@map("habits_v2")  // habits juz istnieje w schemacie
}

model JournalEntry {
  id              String   @id @default(uuid())
  date            DateTime @db.Date
  content         String   @db.Text
  mood            Int?     // 1-5 scale
  energy          Int?     // 1-5 scale
  tags            String[] @default([])
  aiPrompt        String?  // AI-generated prompt that inspired this entry
  aiSummary       String?  // AI summary
  organizationId  String
  createdById     String
  streamId        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  stream          Stream?  @relation(fields: [streamId], references: [id])

  @@unique([organizationId, createdById, date])
  @@map("journal_entries")
}

model PersonalContact {
  id              String   @id @default(uuid())
  name            String
  relationship    String?  // friend, family, colleague, mentor, client
  context         String?  // how you know them
  email           String?
  phone           String?
  birthday        DateTime? @db.Date
  lastInteraction DateTime?
  notes           String?
  tags            String[] @default([])
  organizationId  String
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("personal_contacts")
}

enum KnowledgeNodeType {
  FLEETING
  LITERATURE
  PERMANENT
  PROJECT
}
```

### Migracja bazy danych

Nowe modele dodajemy przez `prisma migrate dev` -- nie modyfikujemy istniejacych modeli streams.work. Podejscie **additive-only** -- dodajemy, nie zmieniamy.

Istniejace modele wspolne (`Stream`, `InboxItem`, `precise_goals`, `flow_learned_patterns`, itd.) dzialaja bez zmian dla obu produktow.

---

## Podsumowanie

**streams.day** to naturalny produkt B2C wynikajacy z tej samej metodologii Sorto Streams co streams.work. Kluczowe decyzje architektoniczne:

1. **Jeden codebase, dwa produkty** -- przelaczanie przez feature flags, nie fork
2. **Wspolny rdzen** -- StreamRole, AI Router, Flow Engine, RAG, RZUT -- identyczne
3. **Inne encje** -- CRM entities (Company, Contact, Deal) vs PKM entities (KnowledgeNode, Habit, Journal)
4. **Inne prompty AI** -- ten sam engine, inne szablony dopasowane do kontekstu osobistego
5. **Mobile-first** -- streams.day jest przede wszystkim mobilny, streams.work przede wszystkim desktopowy
6. **Progresywne wylanianie sie** -- system uczy sie uzytkownika i proponuje strukture zamiast wymagac konfiguracji

Wiecej szczegolow o wspolnej metodologii: `SORTO_STREAMS_METHODOLOGY_v3.md`
Mostek miedzy metodologia a implementacja: `docs/MOSTEK_METODOLOGIA_IMPLEMENTACJA.md`
Koncept samo-budujacego sie systemu: `docs/KONCEPT_SAMOBUDUJACY_CRM.md`
Architektura strumieni: `docs/STREAMS_ARCHITECTURE.md`

---

*Sorto Streams -- Caper Diem!*
*streams.day -- Twoj Drugi Mozg na Autopilocie*

---

*Dokument przygotowany: 2026-02-17*
*Autor: specyfikacja wygenerowana na podstawie analizy codebase i dokumentacji metodologicznej*
