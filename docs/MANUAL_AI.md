# Manual AI w Sorto CRM

## Spis tresci

1. [Jak dziala AI w Sorto CRM](#1-jak-dziala-ai-w-sorto-crm)
2. [Pierwszy setup — krok po kroku](#2-pierwszy-setup--krok-po-kroku)
3. [Strona Konfiguracja AI — 7 zakladek](#3-strona-konfiguracja-ai--7-zakladek)
4. [Pipeline emailowy — jak dziala klasyfikacja](#4-pipeline-emailowy--jak-dziala-klasyfikacja)
5. [Konfiguracja Pipeline](#5-konfiguracja-pipeline)
6. [Admin AI Config](#6-admin-ai-config)
7. [AI w Smart Mailboxes](#7-ai-w-smart-mailboxes)
8. [AI w modulach CRM](#8-ai-w-modulach-crm)
9. [Sugestie AI — Human-in-the-Loop](#9-sugestie-ai--human-in-the-loop)
10. [Przyklady uzycia](#10-przyklady-uzycia)
11. [FAQ / Rozwiazywanie problemow](#11-faq--rozwiazywanie-problemow)

---

## 1. Jak dziala AI w Sorto CRM

### Zasada glowna

**Reguly klasyfikuja KAZDY email bez AI. AI odpala sie TYLKO jesli istnieje prompt dla danej kategorii.**

Oznacza to, ze:
- Brak promptu = brak AI = **zero kosztow**
- Ty decydujesz, ktore kategorie emaili analizuje AI
- Dodajesz prompt — AI zaczyna dzialac. Usuwasz prompt — AI sie zatrzymuje.

### Schemat dzialania

```
Email przychodzacy
       |
       v
[Reguly klasyfikacji] — warunki: nadawca, temat, tresc, domena
       |
       v
Kategoria ustalona (np. BUSINESS, NEWSLETTER, TRANSACTIONAL)
       |
       v
Czy istnieje prompt EMAIL_POST_{KATEGORIA}?
       |                    |
      TAK                  NIE
       |                    |
       v                    v
  AI odpala             Koniec.
  (sentiment,           Brak AI.
   urgency,             Zero kosztow.
   ekstrakcja
   firm, kontaktow,
   leadow, deali,
   zadan)
```

### Przyklady

| Email | Regula | Kategoria | Prompt istnieje? | AI |
|-------|--------|-----------|------------------|----|
| `noreply@firma.pl` | Noreply/System | TRANSACTIONAL | Nie | Nie |
| `"Faktura proforma 123"` | Faktury | TRANSACTIONAL | Nie | Nie |
| `"Wycena na tuby 30x21"` | Intencja zakupowa | BUSINESS | Tak (`EMAIL_POST_BUSINESS`) | Tak — wyciaga firme, kontakt, deal |
| Kontakt z CRM | CRM Protection | BUSINESS | Tak | Tak — post-analiza |
| Losowy mail | Brak reguly | INBOX | Nie | Nie |
| Newsletter | Newsletter prefix | NEWSLETTER | Nie (domyslnie) | Nie |

**Kluczowe**: Dodajac prompt `EMAIL_POST_TRANSACTIONAL`, mozesz wlaczyc AI dla faktur. Usuwajac `EMAIL_POST_BUSINESS`, wylaczysz AI dla zapytan biznesowych.

---

## 2. Pierwszy setup — krok po kroku

### Krok 1: Dodaj providera AI

1. Przejdz do **Narzedzia → Reguly AI** (`/dashboard/ai-rules/`)
2. Kliknij zakladke **"Konfiguracja"**
3. W sekcji "Klucze API" kliknij **"Dodaj"**
4. Wybierz providera:
   - **OpenAI** (GPT-4, GPT-4o, GPT-3.5)
   - **Anthropic** (Claude 3, Claude 3.5)
   - **Google** (Gemini)
   - **Mistral AI**
   - **Custom** (np. Qwen, DeepSeek — wpisz wlasny endpoint)
5. Wklej klucz API
6. Zapisz — klucz zostanie zaszyfrowany

### Krok 2: Dodaj modele

1. Przejdz do **Admin → AI Config** (`/dashboard/admin/ai-config/`)
2. Zakladka **"Models"**
3. Kliknij **"Add Model"**
4. Wypelnij:
   - **Provider** — wybierz z listy skonfigurowanych
   - **Model ID** — np. `gpt-4o-mini`, `claude-3-haiku-20240307`
   - **Display Name** — czytelna nazwa, np. "GPT-4o Mini"
   - **Max Tokens** — domyslnie 4096
5. Zapisz

### Krok 3: Mapuj akcje na modele

1. Przejdz do zakladki **"Akcje AI"** (w Regulach AI lub Admin AI Config)
2. Dla kazdej operacji systemowej wybierz model:

| Operacja | Opis | Sugerowany model |
|----------|------|-----------------|
| EMAIL_CLASSIFICATION | Klasyfikacja emaili | gpt-4o-mini (tani, szybki) |
| EMAIL_PIPELINE | Pelna analiza emaili | gpt-4o lub claude-3-sonnet |
| FLOW_ANALYSIS | Analiza elementow GTD | gpt-4o-mini |
| FLOW_CONVERSATION | Konwersacja AI | gpt-4o |
| AI_RULES_DEFAULT | Domyslny model regul | gpt-4o-mini |
| TASK_SUMMARY | Podsumowania zadan | gpt-4o-mini |
| DEAL_ANALYSIS | Analiza transakcji | gpt-4o |

3. Opcjonalnie ustaw **model zapasowy** (fallback) — uzyty gdy glowny nie odpowiada

### Krok 4: Zaladuj reguly triage

1. Na stronie **Reguly AI** (`/dashboard/ai-rules/`) kliknij przycisk **"Seed Triage"** (zolty/pomaranczowy, gorny panel)
2. System utworzy 6 predefiniowanych regul klasyfikacji:
   - Noreply/System Senders → TRANSACTIONAL (priorytet 900)
   - Newsletter Prefix → NEWSLETTER (priorytet 850)
   - Faktury/Logistyka → TRANSACTIONAL (priorytet 800)
   - Auto-odpowiedzi → TRANSACTIONAL (priorytet 750)
   - Intencja zakupowa → BUSINESS (priorytet 500)
   - Reklamacja → BUSINESS + HIGH priority (priorytet 450)

### Krok 5: Utworz prompt dla kategorii

1. Przejdz do zakladki **"Prompty"**
2. Kliknij **"Nowy prompt"**
3. Wypelnij:
   - **Kod**: `EMAIL_POST_BUSINESS` (wielkie litery, format: `EMAIL_POST_{KATEGORIA}`)
   - **Nazwa**: "Post-analiza emaili biznesowych"
   - **Kategoria**: Email
   - **Model**: wybierz z listy
   - **System Prompt**: instrukcje dla AI (np. "Jestes asystentem CRM. Analizujesz emaile biznesowe i wyciagasz informacje...")
   - **User Prompt**: szablon z zmiennymi, np.:
     ```
     Przeanalizuj ponizszy email:
     Od: {{from}}
     Temat: {{subject}}
     Tresc: {{body}}

     Zwroc JSON z polami: sentiment, urgency (0-100), leads, contacts, deals, tasks.
     ```
4. Kliknij **"Testuj"** aby sprawdzic kompilacje
5. Zapisz

**Od tego momentu kazdy email sklasyfikowany jako BUSINESS bedzie analizowany przez AI.**

---

## 3. Strona Konfiguracja AI — 7 zakladek

URL: `/dashboard/ai-rules/`

Gorna czesc strony zawiera 4 karty statystyk:
- **Laczna liczba regul**
- **Aktywne reguly**
- **Wykonania dzisiaj**
- **Sredni % sukcesu**

### 3.1 Zakladka "Reguly"

Zarzadzanie regulami AI dla roznych modulow CRM.

**Podnawiacja wg modulow** (z licznikami):
- Wszystkie | Projekty | Zadania | Deale | Kontakty | Komunikacja

**Pasek narzedzi**:
- Wyszukiwanie po nazwie/opisie
- Filtr statusu: Aktywne / Nieaktywne / Wszystkie
- Filtr DataType: EMAIL / ALL / inne
- Filtr kategorii: CLASSIFICATION / ROUTING / EXTRACTION / INDEXING / FLOW_ANALYSIS
- Sortowanie: Priorytet | Nazwa | Wykonania | % sukcesu (z strzalkami)
- Przycisk "Wyczysc" resetuje filtry

**Karta reguly** wyswietla:
- Nazwe (kliknieta otwiera strone szczegolowa)
- Opis
- Badge'e: kategoria, DataType, model AI, "Systemowa"
- Liczbe wykonan i % sukcesu
- Przelacznik wlacz/wylacz
- Przyciski: Edytuj / Usun

**Rozwiniety widok** (kliknij strzalke) pokazuje:
- **Warunki**: pole / operator / wartosc, logika AND/OR
- **Akcje**: typ + konfiguracja (np. ai-analysis z promptem)
- **Model AI** i prompt (jesli przypisany)

**Tworzenie nowej reguly**:
1. Kliknij "Nowa regula"
2. Wypelnij formularz:
   - Nazwa (3-100 znakow)
   - Modul: Projekty / Zadania / Deale / Kontakty / Komunikacja
   - Opis (10-500 znakow)
   - Wyzwalacz: Reczny / Automatyczny / Oba
   - Priorytet: 1 (najwyzszy) do 7 (najnizszy)
   - Aktywna: tak/nie
3. Dodaj **warunki** (pole → operator → wartosc):
   - 8 operatorow: equals, not_equals, contains, not_contains, greater_than, less_than, is_empty, is_not_empty
   - Pola ladowane dynamicznie z wybranego modulu
4. Dodaj **akcje**:
   - `ai-analysis` — wybierz model + wpisz prompt (zmienne: `{{name}}`, `{{status}}`, `{{description}}`)
   - `add-tag` — tag z opcjonalna zmienna `{status}`
   - `send-notification` — tytul + tresc
   - `create-task`, `update-status`, `custom-webhook`

### 3.2 Zakladka "Sugestie AI"

Przegladanie i przetwarzanie propozycji AI.

**Filtry statusu**: Oczekujace | Zaakceptowane | Odrzucone

**Karta sugestii** wyswietla:
- Typ z ikona i badge:
  - CREATE_TASK (niebieski)
  - CREATE_DEAL (zielony)
  - UPDATE_CONTACT (fioletowy)
  - SEND_NOTIFICATION (zolty)
  - BLACKLIST_DOMAIN (czerwony)
- Tytul, opis, data
- **Pasek pewnosci AI** (confidence): zielony >=80%, zolty >=60%, pomaranczowy >=40%, czerwony <40%

**Akcje dla oczekujacych sugestii**:
- **Zaakceptuj** — natychmiastowe wykonanie akcji (np. utworzenie zadania)
- **Zmien i zaakceptuj** — edytuj tytul, opis, priorytet, potem zaakceptuj
- **Odrzuc** — z opcjonalna korekcja (AI uczy sie z Twoich decyzji)

Szczegoly w [sekcji 9](#9-sugestie-ai--human-in-the-loop).

### 3.3 Zakladka "Listy domen"

Zarzadzanie listami domen emailowych (whitelist / blacklist).

- **Whitelist** — domeny zawsze klasyfikowane jako BUSINESS
- **Blacklist** — domeny blokowane (SPAM/NEWSLETTER)

Domeny moga byc dodawane recznie lub sugerowane przez AI (po odrzuceniu sugestii blacklist z korekcja "BUSINESS", domena automatycznie trafia na whitelist).

### 3.4 Zakladka "Prompty"

Zarzadzanie szablonami promptow AI. Dostepna dla OWNER i ADMIN.

**Wyszukiwanie i filtry**:
- Szukaj po nazwie, kodzie, opisie
- Filtr kategorii: Zrodlo / Strumienie / Zadania / Przeglady / CRM / Day Planner / Cele / System / Uniwersalne / Email

**Karta promptu** wyswietla:
- Nazwe i kod (monospace, np. `EMAIL_POST_BUSINESS`)
- Badge "System" dla systemowych
- Status: Aktywny / Nieaktywny / Zarchiwizowany
- Kategorie, wersje, domyslny model
- Przyciski: Test | Historia wersji | Edytuj | Archiwizuj

**Edycja promptu**:
- **Kod**: identyfikator (WIELKIE LITERY, niezmienny po utworzeniu)
- **Nazwa** i **Opis**
- **Kategoria**: SOURCE / STREAM / TASK / REVIEW / GOALS / CRM / UNIVERSAL
- **Model**: wybor z listy aktywnych modeli (pogrupowane wg providera)
- **Temperature**: suwak 0-2 (nizszy = bardziej przewidywalny)
- **Max Tokens**: limit odpowiedzi
- **System Prompt**: instrukcje dla AI (monospace textarea)
- **User Prompt**: szablon z Handlebars — zmienne `{{variable}}`, warunki `{{#if}}...{{/if}}`, petla `{{#each}}...{{/each}}`
- **Variables**: JSON z definicjami zmiennych

**Testowanie promptu**:
1. Kliknij ikone kolby (test)
2. Wpisz dane testowe (JSON)
3. Kliknij "Testuj"
4. Zobaczysz skompilowany system prompt, user prompt, model i temperature

**Historia wersji**:
- Rozwin strzalke przy prompcie
- Lista do 5 ostatnich wersji z data i autorem
- Przycisk "Przywroc" — cofnij do wybranej wersji

### 3.5 Zakladka "Konfiguracja"

Zarzadzanie kluczami API providerow AI.

**Link do Pipeline Config** — niebieski baner z przekierowaniem do `/admin/pipeline-config/`

**Klucze API**:
- Lista skonfigurowanych providerow z statusem (aktywny/nieaktywny)
- **Dodaj** — formularz:
  - Wybor providera (OpenAI, Anthropic, Google, Mistral, Custom)
  - Endpoint (dla Custom)
  - Klucz API (szyfrowany)
- **Edytuj** — nazwa, opis, endpoint, klucz (zostaw puste = zachowaj obecny)
- **Wlacz/Wylacz** — przelacznik
- **Usun** — z potwierdzeniem

### 3.6 Zakladka "Akcje AI"

Mapowanie operacji systemowych na konkretne modele AI.

Kazda operacja ma:
- **Przelacznik aktywnosci** — wlacz/wylacz
- **Model glowny** — wybor z aktywnych modeli (pogrupowane wg providera)
- **Model zapasowy** (opcjonalny) — uzyty gdy glowny nie odpowiada

| Kod akcji | Nazwa | Opis |
|-----------|-------|------|
| FLOW_ANALYSIS | Analiza elementow (Flow) | FlowEngine — analiza elementow inbox |
| FLOW_CONVERSATION | Konwersacja AI | Dialog AI o przetworzonych elementach |
| EMAIL_CLASSIFICATION | Klasyfikacja emaili | Automatyczna klasyfikacja (BUSINESS/SPAM/NEWSLETTER) |
| EMAIL_PIPELINE | Analiza emaili w pipeline | Pelna analiza AI w przetwarzaniu emaili |
| AI_RULES_DEFAULT | Domyslny model regul AI | Model uzywany gdy regula nie ma przypisanego |
| TASK_SUMMARY | Podsumowanie zadan | Podsumowania zadan generowane przez AI |
| DEAL_ANALYSIS | Analiza transakcji | Analiza szans sprzedazowych |

**Przycisk "Przywroc domyslne"** — resetuje wszystkie mapowania do wartosci fabrycznych.

### 3.7 Zakladka "Kategorie"

Definiowanie kategorii klasyfikacji emaili.

**Kluczowa zasada**: AI odpala sie TYLKO jesli istnieje prompt `EMAIL_POST_{KATEGORIA}`.

**Domyslne kategorie**: BUSINESS, NEWSLETTER, SPAM, TRANSACTIONAL, PERSONAL

**Karta kategorii** wyswietla:
- Nazwe kategorii
- Badge "domyslna" (dla wbudowanych)
- Badge **"AI aktywne"** (zielony) — jesli prompt `EMAIL_POST_{nazwa}` istnieje
- Badge **"bez AI"** (szary) — brak promptu, zero kosztow
- Przyciski: Edytuj opis / Usun (tylko niestandardowe)

**Dodawanie kategorii**:
1. Kliknij "Nowa kategoria"
2. Wpisz nazwe (automatycznie WIELKIE LITERY)
3. Dodaj opis
4. Zapisz
5. (Opcjonalnie) Utworz regule z `forceClassification: NOWA_KATEGORIA`
6. (Opcjonalnie) Utworz prompt `EMAIL_POST_NOWA_KATEGORIA` w zakladce Prompty

**Workflow**:
```
Dodaj kategorie → Utworz regule z ta klasyfikacja → Dodaj prompt → AI dziala
```

Informacyjny box wyjasnia caly flow i linkuje do zakladki Prompty.

---

## 4. Pipeline emailowy — jak dziala klasyfikacja

### 5 etapow przetwarzania

```
Etap 1: CRM Protection
  |
  v
Etap 2: Listy i Patterny (rownolegle)
  |
  v
Etap 2.5: Reguly AI (ZAWSZE sprawdzane)
  |
  v
Etap 3: Decyzja klasyfikacyjna
  |
  v
Etap 4: Post-analiza AI (bramka: prompt)
  |
  v
Etap 5: Post-akcje (RAG, GTD, blacklist, zadania)
```

### Etap 1: CRM Protection (najwyzszy priorytet)

System sprawdza czy nadawca jest znanym kontaktem CRM:

1. **Szukanie kontaktu po emailu** — jesli znaleziony → BUSINESS (pewnosc 100%)
2. **Szukanie firmy po domenie** — jesli znaleziona → BUSINESS (pewnosc 95%)
3. Darmowe domeny (gmail.com, wp.pl, itp.) sa pomijane w szukaniu firm

Jesli dopasowano — emaile od znanych kontaktow ZAWSZE sa BUSINESS. Etap 2 pomijany.

### Etap 2: Listy i Patterny

Dwa sprawdzenia rownoczesnie:

**Listy domen** (`email_domain_rules`):
- Dokladne dopasowanie emaila
- Dokladne dopasowanie domeny
- Wzorce wildcard (np. `*@newsletter.*.com`)
- Kazde dopasowanie zwieksza licznik trafien

**Patterny** (`email_patterns`):
- Dopasowanie regex lub substring w: temacie, tresci, nadawcy, naglowkach
- Zwraca klasyfikacje i pewnosc

### Etap 2.5: Reguly AI (ZAWSZE dzialaja)

Reguly z tabeli `ai_rules` sa sprawdzane ZAWSZE, niezaleznie od wynikow etapow 1-2.
Posortowane wg priorytetu (malejaco). Pierwsza pasujaca regula wygrywa.

Warunki reguly obsluguia pola: `from`, `subject`, `body`, `domain`, `senderName`
Operatory: `contains`, `equals`, `startsWith`, `endsWith`, `regex`, `in`, `notIn`, `exists`

Regula moze zwrocic:
- `forceClassification` — wymuszenie kategorii
- `setPriority` — ustawienie priorytetu
- `reject` — traktuj jako SPAM
- `skipAI` — pomin post-analize AI
- `addToRag` / `addToFlow` — flagi post-akcji
- `createDeal` — automatyczne utworzenie deala
- `templateId` / `aiPrompt` / `aiSystemPrompt` — nadpisanie promptu

### Etap 3: Decyzja klasyfikacyjna

Kaskada priorytetow:
```
CRM Protection > Listy > Patterny > Regula.forceClassification > INBOX
```

Pierwsza wartosc wygrywa. Jesli zaden etap nie dopasowal — **INBOX** z pewnoscia 0.

**Wazne**: AI nie jest wywolywane na tym etapie. Decyzja jest czysto regulowa.

### Etap 4: Post-analiza AI (bramka promptow)

To jedyne miejsce, gdzie LLM jest rzeczywiscie wywolywany. Hierarchia promptow:

1. **Inline z reguly** — jesli dopasowana regula ma pola `aiPrompt` / `aiSystemPrompt`
2. **Template z reguly** — jesli regula ma `templateId` → szuka w bazie promptow
3. **Domyslny per kategoria** — szuka promptu o kodzie `EMAIL_POST_{KATEGORIA}`

Jesli zaden prompt nie istnieje na zadnym poziomie → **AI sie NIE odpala**.

Jesli prompt istnieje, AI analizuje email i zwraca:
- **Sentiment**: POSITIVE / NEUTRAL / NEGATIVE
- **Urgency score**: 0-100
- **Leads**: wykryte leady sprzedazowe
- **Contacts**: nowe lub zidentyfikowane kontakty
- **Deals**: potencjalne transakcje
- **Tasks**: zadania do wykonania

Na podstawie odpowiedzi AI system automatycznie tworzy encje CRM (firmy, kontakty, leady, deale, zadania) z 24-godzinnym zabezpieczeniem przed duplikatami.

### Etap 5: Post-akcje

Wykonywane niezaleznie od tego czy AI dzialalo:
- **Linkowanie encji** — powiazanie emaila z kontaktem/firma
- **Ekstrakcja zadan** — proste regexowe wyciaganie zadan z tresci
- **RAG** — dodanie do bazy wiedzy (jesli wlaczone dla kategorii)
- **Flow (GTD inbox)** — dodanie do skrzynki GTD (jesli wlaczone)
- **Sugestia blacklist** — jesli NEWSLETTER i nie-darmowa domena → sugestia do zatwierdzenia
- **Auto-blacklist** — jesli SPAM i pewnosc > prog → automatyczne dodanie do blacklisty

---

## 5. Konfiguracja Pipeline

URL: `/dashboard/admin/pipeline-config/`

10 sekcji konfiguracyjnych dostepnych z bocznego paska nawigacji.
Kazda sekcja ma przycisk "Resetuj do domyslnych" i "Zapisz" (aktywny tylko przy zmianach).

### 5.1 Klasyfikacje

Dozwolone kategorie emaili z opisami. Opisy sa uzywane w promcie AI do klasyfikacji.

- Kazda klasa ma nazwe (monospace) i edytowalny opis
- Mozna dodac nowa klase lub usunac istniejaca
- Zmiana tutaj wpływa na caly pipeline

### 5.2 Parametry AI

- **Model AI** — identyfikator modelu (np. `gpt-4o-mini`)
- **Jezyk** — English / Polski
- **Temperature** — suwak 0-2 (nizszy = bardziej deterministyczny)
- **Max Tokens** — limit odpowiedzi (100-4000)
- **Prompt klasyfikacji** — glowny szablon (uzyj `{{categories}}` aby wstawic liste kategorii)

### 5.3 Progi (Thresholds)

5 suwaków decydujacych o zachowaniu pipeline:

| Prog | Opis | Domyslnie |
|------|------|-----------|
| Prog UNKNOWN | Ponizej → klasyfikacja = UNKNOWN | 0.3 |
| List match confidence | Pewnosc dopasowania listy | 0.9 |
| Default rule confidence | Domyslna pewnosc regul AI | 0.85 |
| Auto-blacklist threshold | Powyzej → domena auto-zablokowana | 0.95 |
| High priority business | BUSINESS powyzej → priorytet HIGH | 0.8 |

### 5.4 Slowa kluczowe

6 list slow kluczowych uzywanych w heurystycznej analizie:
- Spam keywords
- Newsletter keywords
- Invoice keywords
- Urgency keywords
- Sentiment positive
- Sentiment negative

Dodawaj/usuwaj slowa jako tagi.

### 5.5 Domeny

Lista darmowych domen email (gmail.com, wp.pl, itp.) — pomijane przy dopasowywaniu firm.
Jesli nadawca ma domene z tej listy, system nie probuje szukac/tworzyc firmy po domenie.

### 5.6 Harmonogram

Interwaly, batch sizes i opoznienia zaplanowanych zadan. **Wymagaja restartu backendu.**

- **Interwaly**: przetwarzanie emaili (min), sync faktur (min), reindex RAG (min)
- **Batch sizes**: emaile (1-200), faktury (1-50)
- **Opoznienia**: miedzy batchami, miedzy organizacjami, startup delay

### 5.7 Limity

Limity dlugosci tresci:
- **AI content limit** — max znakow wysylanych do AI (500-50000)
- **RAG content limit** — max znakow do indeksowania (1000-100000)
- **Flow preview limit** — max znakow podgladu (50-1000)
- **Min content length** — minimum zeby przetworzyc email (1-100)

### 5.8 Post-akcje

Macierz: ktore akcje wykonac po klasyfikacji dla kazdej kategorii.

Tabela z wierszami = kategorie, kolumnami = akcje:

| Akcja | Opis |
|-------|------|
| RAG | Dodaj do bazy wiedzy |
| Flow | Dodaj do skrzynki GTD |
| Zadania | Wyodrebnij zadania |
| Blacklist | Sugeruj blacklist |
| Auto-block | Automatycznie zablokuj |
| Prompt | Post-analiza AI (link do zakladki Prompty) |

Klikniecie "Prompt" przekierowuje do Prompty z wyszukiwaniem `EMAIL_POST_{KATEGORIA}`.

### 5.9 Reguly systemowe

Pre-definiowane reguly filtracji i klasyfikacji:

- **PRE_FILTER** — reguly odrzucajace spam/noreply
- **CLASSIFY** — reguly klasyfikujace newsletter, VIP, faktury

Kazda regula ma: nazwe, priorytet, warunki (JSON), akcje (JSON), checkbox "Stop processing".

### 5.10 Ekstrakcja zadan

Konfiguracja automatycznego wyciagania zadan z emaili:

- **Max tasks per email** — limit zadan na email (1-20)
- **Min title length** — minimalna dlugosc tytulu zadania (3-50)
- **Urgency patterns** — slowa wyzwalajace pilnosc
- **Regex patterns** — wzorce do wykrywania zadan

---

## 6. Admin AI Config

URL: `/dashboard/admin/ai-config/`

### 6.1 Providers

Zarzadzanie dostawcami AI (nizszopoziomowe niz "Konfiguracja" w Regulach AI).

- **Dodaj Provider**: nazwa, typ (openai/anthropic/google/ollama/custom), klucz API, base URL
- **Test**: sprawdz polaczenie — pokazuje latency (np. "Sukces! Latency: 230ms")
- **Wlacz/Wylacz**: przelacznik statusu
- **Usun**: z potwierdzeniem

### 6.2 Models

Zarzadzanie modelami AI.

- **Dodaj Model**: provider, model ID, display name, max tokens
- **Usun**: z potwierdzeniem
- Badge "Default" dla modelu domyslnego

### 6.3 Usage

Statystyki uzycia AI:
- **Total Requests** — laczna liczba zapytan
- **Total Tokens** — laczna liczba tokenow
- **Total Cost** — szacowany koszt w USD

### 6.4 Akcje AI

Ten sam panel co w zakladce "Akcje AI" na stronie Regul AI — mapowanie operacji na modele.

---

## 7. AI w Smart Mailboxes

URL: `/dashboard/smart-mailboxes/`

### Przycisk "Analiza AI"

Kazda wiadomosc w rozwinijetym podgladzie ma przycisk uruchamiajacy pelna analize AI:
1. Kliknij przycisk analizy
2. Pojawi sie komunikat "Analizowanie wiadomosci..."
3. Po zakonczeniu: "Analiza: {klasyfikacja}. Utworzono: N encji CRM"

Analiza uruchamia caly pipeline emailowy na zadanie — klasyfikacja, post-analiza AI (jesli prompt istnieje), tworzenie encji CRM.

### Filtr urgency score

W panelu filtrow dostepny suwak **"Pilnosc"** (0-100):
- Ustaw zakres min-max
- Filtruje wiadomosci wg wyniku pilnosci przypisanego przez AI
- Wiadomosci z urgencyScore > 70 sa liczone jako "pilne" w pasku statystyk

### Sortowanie po pilnosci

Opcja sortowania **"Pilnosc"** — sortuje wiadomosci wg `urgencyScore` (malejaco).

### Run Rules

Przycisk "Run Rules" w rozwinijetym podgladzie — reczne uruchomienie regul na wybranej wiadomosci.

### Ikona AI dla skrzynek

Skrzynki z "spark", "ai" lub "auto" w nazwie automatycznie wyswietlaja ikone AI (Sparkles).

---

## 8. AI w modulach CRM

### UniversalAnalysisButton

Przycisk **"Analiza AI"** (fioletowy gradient z ikona gwiazdek) dostepny w:
- **Projektach** — karta projektu, widok listy
- **Zadaniach** — widok szczegolowy
- **Dealach** — karta deala
- **Kontaktach** — widok kontaktu

**Uzycie**:
1. **Szybkie klikniecie** — uruchamia WSZYSTKIE pasujace reguly AI dla elementu
2. **Ikona zebatki** — otwiera modal z lista dostepnych analiz:
   - Nazwa analizy
   - Opis
   - Szacowany czas
   - Model AI
3. Przycisk "Uruchom wszystkie dostepne analizy" u dolu modala

Po zakonczeniu: "Analiza zakonczona! Wykonano N regul"

### Warianty wyswietlania

- **button** (domyslny) — pelny przycisk z tekstem "Analiza AI" + ikona zebatki
- **icon** — mala ikona gwiazdek z tooltipem
- **compact** — kompaktowy tekst "Analizuj" z ikona

---

## 9. Sugestie AI — Human-in-the-Loop

System sugestii pozwala AI proponowac akcje, ktore MUSISZ zatwierdzic.

### Typy sugestii

| Typ | Opis | Co sie dzieje po akceptacji |
|-----|------|-----------------------------|
| CREATE_TASK | Propozycja utworzenia zadania | Zadanie tworzone w systemie |
| CREATE_DEAL | Propozycja utworzenia deala | Deal tworzony (wymaga companyId) |
| UPDATE_CONTACT | Propozycja aktualizacji kontaktu | Kontakt aktualizowany (wybrane pola) |
| BLACKLIST_DOMAIN | Propozycja dodania domeny na blacklist | Domena dodana do blacklisty |
| SEND_NOTIFICATION | Propozycja powiadomienia | Tylko logowane, informacyjne |

### Akceptacja

1. Kliknij **"Zaakceptuj"** — system wykona akcje automatycznie
2. Lub **"Zmien i zaakceptuj"** — edytuj szczegoly:
   - Zmien tytul, opis, priorytet
   - Dodaj komentarz
   - Kliknij "Zaakceptuj ze zmianami"

### Odrzucenie z korekcja

Odrzucenie to nie tylko "nie" — to **nauka AI**.

**Dla BLACKLIST_DOMAIN**:
- Wybierz poprawna klasyfikacje: BUSINESS / NEWSLETTER / SPAM / TRANSACTIONAL
- Jesli BUSINESS → domena automatycznie trafia na **whitelist**
- AI uczy sie, ze ta domena nie powinna byc blokowana

**Dla CREATE_TASK / CREATE_DEAL**:
- Wybierz powod: UNNECESSARY / ALREADY_DONE / WRONG_TYPE / WRONG_DATA / TOO_EARLY / OTHER
- Wpisz wyjasnienie
- AI uczy sie z Twoich decyzji

### Edycja przed decyzja

Mozesz tez edytowac sugestie BEZ akceptacji/odrzucenia:
1. Kliknij PUT na sugestie
2. Zmien dane, reasoning, confidence
3. Zapisz — sugestia pozostaje w statusie PENDING

---

## 10. Przyklady uzycia

### Scenariusz 1: Email noreply (zero AI)

```
Email: noreply@firma-xyz.pl → "Potwierdzenie zamowienia #12345"

Etap 1: CRM Check — brak kontaktu → przechodzi dalej
Etap 2: Listy — brak dopasowania
Etap 2.5: Regula "Noreply/System" (priorytet 900) → pasuje
Etap 3: forceClassification = TRANSACTIONAL
Etap 4: Prompt EMAIL_POST_TRANSACTIONAL nie istnieje → BRAK AI
Etap 5: Post-akcje wg konfiguracji (np. Flow)

Wynik: TRANSACTIONAL, 0 tokenow AI, 0 kosztow
```

### Scenariusz 2: Zapytanie ofertowe (AI dziala)

```
Email: jan.kowalski@abc-firma.pl → "Wycena na tuby aluminiowe 30x21, 500 szt"

Etap 1: CRM Check — brak kontaktu
Etap 2: Listy/Patterny — brak
Etap 2.5: Regula "Intencja zakupowa" (priorytet 500) → body pasuje (regex: wycena|szt)
Etap 3: forceClassification = BUSINESS
Etap 4: Prompt EMAIL_POST_BUSINESS istnieje → AI odpala!
  → AI zwraca: sentiment=POSITIVE, urgency=65
  → AI wyciaga: firma "ABC Firma", kontakt "Jan Kowalski"
  → AI sugeruje: deal "Tuby aluminiowe 30x21", task "Przygotuj wycene"
Etap 5: RAG + Flow + tworzenie encji

Wynik: BUSINESS, firma+kontakt+deal+task utworzone automatycznie
```

### Scenariusz 3: Istniejacy kontakt CRM

```
Email: anna@staly-klient.pl → "Dzien dobry, potrzebujemy dodatkowej partii..."

Etap 1: CRM Check → kontakt "Anna" znaleziony → BUSINESS (100%)
Etap 2: Pomijany
Etap 2.5: Reguly sprawdzone (ale CRM juz dopasowal)
Etap 3: BUSINESS z pewnoscia 1.0
Etap 4: EMAIL_POST_BUSINESS istnieje → AI analizuje
  → ekstrakcja potrzeb, aktualizacja kontaktu, utworzenie zadan
Etap 5: RAG + Flow + task extraction

Wynik: BUSINESS, istniejacy kontakt powiazany, AI post-analiza
```

### Scenariusz 4: Dodanie nowej kategorii

1. **Zakladka Kategorie** → "Nowa kategoria" → `REKLAMACJA` → opis: "Zgloszenia reklamacyjne"
2. **Zakladka Reguly** → "Nowa regula":
   - Nazwa: "Wykrywanie reklamacji"
   - Priorytet: 5
   - Warunek: body contains "reklamacja" OR "complaint" OR "zwrot"
   - Akcja: forceClassification = REKLAMACJA, setPriority = HIGH
3. **Zakladka Prompty** → "Nowy prompt":
   - Kod: `EMAIL_POST_REKLAMACJA`
   - System Prompt: "Analizujesz zgloszenia reklamacyjne. Wyciagnij: produkt, numer zamowienia, opis problemu, priorytet."
   - User Prompt: szablon z `{{from}}`, `{{subject}}`, `{{body}}`

Od teraz: kazda reklamacja → regula → REKLAMACJA → AI wyciaga szczegoly → zadanie z HIGH priority

### Scenariusz 5: Zmiana modelu AI per operacja

1. **Zakladka Akcje AI** → EMAIL_PIPELINE
2. Zmien model glowny z `gpt-4o-mini` na `claude-3-sonnet`
3. Ustaw fallback: `gpt-4o-mini`
4. Od teraz pelna analiza emaili uzywa Claude, a w razie bledu — GPT

---

## 11. FAQ / Rozwiazywanie problemow

### "AI sie nie odpala na emailach"

**Sprawdz kolejno:**
1. Czy istnieje prompt `EMAIL_POST_{KATEGORIA}` w zakladce Prompty?
   - Przejdz do Prompty → szukaj `EMAIL_POST_`
   - Jesli nie ma — utworz go ([Krok 5 w setupie](#krok-5-utworz-prompt-dla-kategorii))
2. Czy prompt ma status "Aktywny"?
3. Czy istnieje regula przypisujaca ta kategorie?
   - Przejdz do Reguly → sprawdz czy jest regula z `forceClassification`
4. Czy provider AI jest aktywny i ma klucz?
   - Przejdz do Konfiguracja → sprawdz status providera
5. Czy model jest przypisany w Akcjach AI?
   - Przejdz do Akcje AI → sprawdz EMAIL_CLASSIFICATION i EMAIL_PIPELINE

### "Za duzo tokenow / za wysokie koszty"

1. **Zmniejsz AI content limit** w Pipeline Config → Limity (domyslnie 10000 znakow)
2. **Uzyj tanszego modelu** — np. `gpt-4o-mini` zamiast `gpt-4o`
3. **Zmniejsz Max Tokens** w prompcie (np. z 4000 na 1000)
4. **Wylacz AI dla kategorii** — usun prompt `EMAIL_POST_{KATEGORIA}`
5. **Ogranicz post-akcje** — wylacz niepotrzebne akcje w Pipeline Config → Post-akcje

### "Brak modeli w liscie wyboru"

1. Sprawdz czy provider jest **aktywny** (Konfiguracja → zielona kropka)
2. Sprawdz czy model ma status **ACTIVE** (Admin AI Config → Models)
3. Sprawdz czy route `/ai-v2` jest aktywny (Admin powinien to zweryfikowac)

### "Sugestia AI jest bledna"

1. **Odrzuc z korekcja** — to uczy AI
2. Dla BLACKLIST_DOMAIN: wybierz poprawna klasyfikacje (np. BUSINESS)
3. Dla zadan/deali: wybierz powod odrzucenia + opis
4. Im wiecej korekcji — tym lepsza jakosc sugestii

### "Email zaklasyfikowany blednie"

1. W Smart Mailboxes kliknij "Run Rules" na emailu
2. Sprawdz reguly — moze brakuje warunku lub priorytet jest za niski
3. Dodaj nowa regule z wyzszym priorytetem
4. Lub dodaj domene na whitelist/blacklist

### "Chce wlaczyc AI dla faktur"

1. Utworz prompt `EMAIL_POST_TRANSACTIONAL` w zakladce Prompty
2. Instrukcje systemowe: "Analizujesz faktury. Wyciagnij: numer faktury, kwota, termin platnosci, wystawca."
3. Od teraz wszystkie faktury (TRANSACTIONAL) beda analizowane

### "Chce wylaczyc AI calkowicie"

1. Usun WSZYSTKIE prompty `EMAIL_POST_*` — AI sie nie odpali na zadnym emailu
2. Lub wylacz providerow w zakladce Konfiguracja
3. Reguly beda dzialac normalnie (klasyfikacja bez AI)

---

## Podsumowanie

| Co chcesz zrobic | Gdzie |
|-------------------|-------|
| Dodac providera AI | Konfiguracja AI → Konfiguracja |
| Dodac model AI | Admin AI Config → Models |
| Przypisac model do operacji | Konfiguracja AI → Akcje AI |
| Utworzyc regule klasyfikacji | Konfiguracja AI → Reguly |
| Wlaczyc AI per kategoria | Konfiguracja AI → Prompty (dodaj `EMAIL_POST_*`) |
| Dodac kategorie | Konfiguracja AI → Kategorie |
| Przegladac sugestie AI | Konfiguracja AI → Sugestie AI |
| Skonfigurowac pipeline | Admin → Pipeline Config |
| Analizowac email reczne | Smart Mailboxes → przycisk Analiza AI |
| Analizowac element CRM | Projekt/Zadanie/Deal/Kontakt → przycisk Analiza AI |
| Zarzadzac domenami | Konfiguracja AI → Listy domen |
| Zaladowac reguly triage | Konfiguracja AI → przycisk "Seed Triage" |
