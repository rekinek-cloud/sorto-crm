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
Czy kategoria = BUSINESS i prompt EMAIL_BIZ_TRIAGE istnieje?
       |                    |
      TAK                  NIE
       |                    |
       v                    v
  DWUETAPOWY            Czy istnieje prompt EMAIL_POST_{KATEGORIA}?
  TRIAGE:                   |              |
                           TAK            NIE
  Krok 1: Triage            |              |
  (gpt-4o-mini,             v              v
   ~200ms)              AI odpala       Koniec.
  → kategoria:          (jednym         Brak AI.
    ZAPYTANIE,           promptem)      Zero kosztow.
    FAKTURA_PLATNOSC,
    ADMIN_ORGANIZACJA...
       |
       v
  Krok 2: Specjalistyczny
  prompt EMAIL_BIZ_{KAT}
  (gpt-4o, ~800ms)
  → pelna analiza
    z ekstrakcja encji
       |
       v
  Propozycje AI → HITL
  (czlowiek zatwierdza)
```

### Dwuetapowy pipeline BUSINESS — 12 kategorii

Emaile biznesowe przechodza dwuetapowa analize:

| Kod | Opis | Typowe encje | Stream | Energia |
|-----|------|------|--------|---------|
| ZAPYTANIE_OFERTOWE | Nowy klient pyta o produkt/wycene | lead, deal, task | NEXT_ACTIONS | HIGH |
| ZLECENIE | Zamowienie od stalego klienta | task(exec), deal | NEXT_ACTIONS | HIGH |
| ADMIN_ORGANIZACJA | Targi, dostawcy, administracja (my jako klient) | task, contact | NEXT_ACTIONS | MEDIUM |
| REKLAMACJA | Skarga, blad, uszkodzenie | task(HIGH) | NEXT_ACTIONS | HIGH |
| FAKTURA_PLATNOSC | Faktury, przelewy, monity, rozliczenia | task(zaplata) | NEXT_ACTIONS | LOW |
| LOGISTYKA | Tracking, awiza, dostawy surowcow | task(verify) | WAITING_FOR | LOW |
| SPOTKANIE | Call, Teams/Zoom, spotkanie 1-na-1 | task(prep) | NEXT_ACTIONS | MEDIUM |
| WSPOLPRACA | Partnerstwo B2B, agencje | lead, contact | SOMEDAY_MAYBE | MEDIUM |
| SPAM_MARKETING | Newslettery, niechciane oferty | — | REFERENCE | LOW |
| HR | Rekrutacja, CV, sprawy pracownicze | task, contact | AREAS | MEDIUM |
| TECH_SUPPORT | Problemy z IT, aplikacjami | task(fix, HIGH) | NEXT_ACTIONS | HIGH |
| INNE | Fallback — nie pasuje do zadnej | varies | INBOX | MEDIUM |

**Koszt vs stary system**:
| | Stary (1 prompt) | Nowy (2 kroki) |
|--|--------|------|
| Calls/email | 1 (gpt-4o) | 2 (gpt-4o-mini + gpt-4o) |
| Input tokens | ~6000 | ~1300 + ~4500 |
| Output tokens | ~2000 | ~100 + ~1500 |
| Koszt | ~$0.045 | ~$0.027 |
| **Oszczednosc** | | **~40%** |

### Przyklady

| Email | Regula | Kategoria | Triage | AI |
|-------|--------|-----------|--------|----|
| `noreply@firma.pl` | Noreply/System | TRANSACTIONAL | — | Nie |
| `"Faktura proforma 123"` | Invoice Detection | BUSINESS | FAKTURA_PLATNOSC | Tak — kwota, termin, NIP |
| `"Wycena na tuby 30x21"` | Streams: Business | BUSINESS | ZAPYTANIE_OFERTOWE | Tak — firma, kontakt, deal |
| `"Termin platnosci"` | Streams: Business | BUSINESS | FAKTURA_PLATNOSC | Tak — kwota, data, nr sprawy |
| Kontakt z CRM | CRM Protection | BUSINESS | (wg tresci) | Tak — dwuetapowa analiza |
| Losowy mail | Brak reguly | INBOX | — | Nie |
| Newsletter | Newsletter Patterns | NEWSLETTER | — | Nie |

**Kluczowe**: Pipeline BUSINESS jest dwuetapowy — triage ustala kategorie, potem specjalistyczny prompt wyciaga szczegoly. Usuwajac `EMAIL_BIZ_TRIAGE` z bazy, system wraca do starego flow (fallback). Dodajac `EMAIL_POST_TRANSACTIONAL`, mozesz wlaczyc AI dla faktur.

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
Operatory: `contains`, `not_contains`, `equals`, `not_equals`, `startsWith`, `endsWith`, `regex`, `in`, `notIn`, `exists`, `not_exists`

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

To jedyne miejsce, gdzie LLM jest rzeczywiscie wywolywany.

#### 4a. Dwuetapowy triage BUSINESS (nowy)

Jesli klasyfikacja = **BUSINESS** i prompt `EMAIL_BIZ_TRIAGE` istnieje w bazie:

```
Krok 1: Triage (gpt-4o-mini, ~200ms, ~300 tokenow)
  - Truncated body (500 znakow) + subject + from
  - Zwraca: { category, confidence, reasoning }
  - Np: { "category": "ZAPYTANIE_OFERTOWE", "confidence": 0.98, "reasoning": "..." }
       |
       v
Krok 2: Specjalistyczny prompt EMAIL_BIZ_{CATEGORY} (gpt-4o, ~800ms)
  - Pelna tresc emaila + zmienne triage
  - Zwraca: JSON z leads, contacts, deals, tasks, tags, streamRouting
  - Kazdy prompt skupiony na swojej domenie (np. FAKTURA_PLATNOSC wyciaga NIP, kwoty, terminy)
       |
       v
Merge: triage metadata + specjalistyczny wynik → propozycje AI
```

**Fallback**: Jesli `EMAIL_BIZ_TRIAGE` nie istnieje → przechodzi do starego flow ponizej.
**Fallback 2**: Jesli `EMAIL_BIZ_{CATEGORY}` nie istnieje → probuje `EMAIL_BIZ_INNE`.
**Rollback**: Usun `EMAIL_BIZ_TRIAGE` z DB → stary flow dziala bez zmian.

#### 4b. Klasyczny flow (dla nie-BUSINESS lub gdy brak triage)

Hierarchia promptow:

1. **Inline z reguly** — jesli dopasowana regula ma pola `aiPrompt` / `aiSystemPrompt`
2. **Template z reguly** — jesli regula ma `templateId` → szuka w bazie promptow
3. **Domyslny per kategoria** — szuka promptu o kodzie `EMAIL_POST_{KATEGORIA}`

Jesli zaden prompt nie istnieje na zadnym poziomie → **AI sie NIE odpala**.

#### Wyniki analizy AI

Niezaleznie od flow (triage czy klasyczny), AI zwraca:
- **Category**: kategoria biznesowa (np. ZAPYTANIE_OFERTOWE, FAKTURA_PLATNOSC, ADMIN_ORGANIZACJA)
- **Sentiment**: POSITIVE / NEUTRAL / NEGATIVE
- **Urgency**: LOW / MEDIUM / HIGH / CRITICAL (lub score 0-100)
- **Summary**: krotkie podsumowanie
- **Stream Routing**: sugerowany strumien GTD (NEXT_ACTIONS, WAITING_FOR, itp.)
- **Contacts**: wykryte kontakty (imie, email, telefon)
- **Leads**: leady sprzedazowe (firma, priorytet)
- **Deals**: potencjalne transakcje (tytul, wartosc)
- **Tasks**: zadania do wykonania (tytul, priorytet, deadline)
- **Tags**: tematyczne tagi (np. finanse, platnosc, windykacja)
- **Category Specific**: dane specyficzne dla kategorii (np. kwota, NIP, nr faktury)

#### Propozycje AI (Human-in-the-Loop)

Jesli konfiguracja ma `requireReview: true` (domyslnie dla BUSINESS), AI tworzy **propozycje** w tabeli `ai_suggestions` zamiast automatycznego tworzenia encji:

| Typ propozycji | Opis |
|----------------|------|
| ROUTE_TO_STREAM | Sugestia routingu do strumienia GTD |
| CREATE_TASK | Propozycja zadania z tytulem i priorytetem |
| CREATE_CONTACT | Nowy kontakt z danymi z emaila |
| CREATE_COMPANY | Nowa firma z domena i NIP |
| CREATE_DEAL | Nowy deal z wartoscia |
| CREATE_LEAD | Nowy lead sprzedazowy |

Propozycje czekaja na zatwierdzenie w zakladce **"Sugestie AI"** lub w **AnalysisPreviewModal** po analizie emaila.

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

AI w Sorto CRM dziala na dwoch poziomach:
1. **Reczna analiza** — uzytkownik klika przycisk "Analiza AI" na elemencie CRM (projekt, zadanie, deal, kontakt). System uruchamia pasujace reguly AI i zwraca wynik.
2. **Automatyczne propozycje z pipeline emailowego** — pipeline analizujacy emaile tworzy propozycje encji (leady, kontakty, transakcje, zadania), ktore pojawiaja sie w zakladce "Sugestie AI" do zatwierdzenia.

Oba poziomy lacza sie w centralnym miejscu: **zakladce "Sugestie AI"** w Konfiguracji AI (`/dashboard/ai-rules/` → Sugestie AI).

### 8.1 UniversalAnalysisButton

Przycisk **"Analiza AI"** (fioletowy gradient z ikona gwiazdek) to uniwersalny komponent dostepny w:
- **Projektach** — karta projektu, widok listy
- **Zadaniach** — widok szczegolowy
- **Dealach** — karta deala
- **Kontaktach** — widok kontaktu
- **Komunikacji** — wiadomosci w Smart Mailboxes

#### Jak dziala

Przycisk laczy sie z **UniversalRuleEngine** na backendzie. Po kliknieciu:

1. Frontend wysyla POST na `/api/v1/universal-rules/analyze` z parametrami:
   - `module` — typ modulu (`projects`, `tasks`, `deals`, `contacts`, `communication`)
   - `itemId` — identyfikator analizowanego elementu
   - `analysisType` — opcjonalny typ analizy (np. `smart-score`, `risk-assessment`)
2. Backend pobiera dane elementu z bazy
3. Backend wyszukuje WSZYSTKIE aktywne reguly AI pasujace do modulu
4. Kazda pasujaca regula jest wykonywana — AI generuje odpowiedz
5. Wyniki sa zwracane do frontendu i moga tworzyc sugestie w tabeli `ai_suggestions`

#### Uzycie

1. **Szybkie klikniecie** — uruchamia WSZYSTKIE pasujace reguly AI dla elementu
2. **Ikona zebatki** — otwiera modal z lista dostepnych analiz:
   - Nazwa analizy (np. "Analiza SMART", "Ocena ryzyka")
   - Opis co analiza robi
   - Szacowany czas wykonania (np. "30-60 sekund")
   - Model AI uzywany do analizy
3. Przycisk **"Uruchom wszystkie dostepne analizy"** u dolu modala — odpala wszystko naraz
4. Mozesz tez kliknac konkretna analize aby uruchomic tylko ja

Po zakonczeniu: toast "Analiza zakonczona! Wykonano N regul"

#### Warianty wyswietlania

| Wariant | Wyglad | Gdzie uzywany |
|---------|--------|---------------|
| **button** (domyslny) | Pelny przycisk z tekstem "Analiza AI" + ikona zebatki | Karty projektow, widoki szczegolowe |
| **icon** | Mala ikona gwiazdek z tooltipem "Uruchom analize AI" | Tabele, listy kompaktowe |
| **compact** | Tekst "Analizuj" + mala ikona gwiazdek | Panele boczne, toolbar |

#### Auto-trigger (automatyczne wyzwalanie)

Oprocz recznego klikniecia, reguly moga byc wyzwalane automatycznie przy zmianach danych:
- Endpoint: POST `/api/v1/universal-rules/auto-trigger`
- Wyzwalany przy tworzeniu, aktualizacji lub usuwaniu elementow
- Reguly z wyzwalaczem "Automatyczny" wykonuja sie bez ingerencji uzytkownika

### 8.2 AI w Projektach

Projekty maja dwa dedykowane typy analizy AI dostepne z poziomu `UniversalAnalysisButton`:

#### Analiza SMART (`smart-score`)

AI ocenia projekt wedlug kryteriow SMART:
- **S** (Specific) — czy cel jest dostatecznie precyzyjny?
- **M** (Measurable) — czy da sie zmierzyc postep?
- **A** (Achievable) — czy jest realistyczny?
- **R** (Relevant) — czy jest istotny dla organizacji?
- **T** (Time-bound) — czy ma okreslony termin?

**Co widzi uzytkownik**:
1. Kliknij "Analiza AI" na karcie projektu → wybierz "Analiza SMART"
2. Czekaj 30-60 sekund (model GPT-4)
3. Otrzymujesz wynik: ocena kazdego kryterium + sugestie poprawek

**Dane wejsciowe wysylane do AI**:
- Nazwa projektu, opis
- Deadline, budzet
- Wielkosc zespolu, status, priorytet

#### Ocena ryzyka (`risk-assessment`)

AI analizuje ryzyko projektu i prawdopodobienstwo sukcesu:
- Identyfikacja zagrozen (brak zasobow, nierealne terminy, niejasne wymagania)
- Ocena prawdopodobienstwa kazdego ryzyka
- Rekomendacje mitygacji

**Co widzi uzytkownik**:
1. Kliknij "Analiza AI" → wybierz "Ocena ryzyka"
2. Czekaj ~45 sekund
3. Otrzymujesz: liste ryzyk z priorytetami i rekomendacje

#### Automatyczne reguly dla projektow

Mozesz tworzyc reguly AI ktore automatycznie analizuja projekty:

**Przyklad reguly**: "Analizuj SMART nowe projekty"
- **Modul**: Projekty
- **Wyzwalacz**: Automatyczny (przy tworzeniu)
- **Warunek**: status = PLANNING
- **Akcja**: `ai-analysis` z promptem "Ocen projekt wedlug SMART..."
- **Model**: GPT-4

### 8.3 AI w Kontaktach

Kontakty korzystaja z AI na dwa sposoby: reczna analiza z przycisku i automatyczne propozycje z pipeline emailowego.

#### Reczna analiza kontaktow

Dwa typy analizy dostepne z `UniversalAnalysisButton`:

**Strategia zaangazowania** (`engagement-strategy`):
- AI analizuje historye kontaktu (ostatni kontakt, interakcje, status)
- Generuje plan reaktywacji i budowania relacji
- Sugeruje nastepne kroki (np. "Umow spotkanie online, kontakt nie odpowiadal od 31 dni")
- Model: GPT-3.5, czas: 30-45 sekund

**Analiza relacji** (`relationship-analysis`):
- Ocena jakosci i potencjalu relacji biznesowej
- Scoring relacji (lead score, engagement score)
- Sugestie jak poglebic wspolprace
- Model: GPT-3.5, czas: ~40 sekund

**Dane wejsciowe wysylane do AI**:
- Imie, stanowisko, firma kontaktu
- Data ostatniego kontaktu i ile dni temu
- Status kontaktu (ACTIVE, LEAD, itp.)
- Historia interakcji, typ relacji, zainteresowania

#### Automatyczne propozycje kontaktow z emaili

Gdy pipeline emailowy analizuje wiadomosc i wykryje nowego nadawce (ktory nie istnieje w CRM), tworzy propozycje `CREATE_CONTACT`:

**Jak to dziala**:
1. AI analizuje email i wyciaga dane nadawcy
2. System sprawdza czy kontakt o takim emailu juz istnieje w CRM
3. Jesli NIE istnieje — tworzy propozycje z danymi:
   - Imie i nazwisko (z podpisu emaila lub nagłówka "From")
   - Adres email nadawcy
   - Telefon (jesli wykryty w tresci)
   - Stanowisko (jesli wykryte)
   - Firma (z domeny lub z tresci)
   - Status: `LEAD` (dla BUSINESS) lub `ACTIVE` (inne)
   - Tag: `from-email-analysis`
4. Propozycja pojawia sie w zakladce **Sugestie AI** ze statusem PENDING

**Co widzi uzytkownik**:
- W zakladce Sugestie AI: karta z ikona kontaktu (zielona), imie i nazwisko, email, firma
- Pasek pewnosci AI (np. 70%)
- Akcje: Zaakceptuj (kontakt zostanie utworzony) / Zmien i zaakceptuj / Odrzuc

#### Propozycja aktualizacji kontaktu (`UPDATE_CONTACT`)

Jesli kontakt JUZ istnieje w CRM, ale AI wykryje nowe informacje (zmiana stanowiska, nowy telefon), tworzy propozycje `UPDATE_CONTACT`:
- Wskazuje ktore pola sa nowe/zmienione
- Uzytkownik decyduje czy zaktualizowac
- Aktualizowane moga byc: imie, nazwisko, email, telefon, stanowisko, notatki

### 8.4 AI w Transakcjach (Deals)

#### Reczna analiza transakcji

Dwa typy analizy z `UniversalAnalysisButton`:

**Analiza ryzyka deala** (`risk-assessment`):
- Ocena prawdopodobienstwa zamkniecia transakcji
- Identyfikacja ryzyk blokujacych (brak decyzji klienta, konkurencja, budzet)
- Rekomendacje nastepnych krokow
- Model: GPT-4, czas: 60-90 sekund

**Strategia negocjacji** (`negotiation-strategy`):
- Rekomendacje dla procesu negocjacyjnego
- Analiza pozycji negocjacyjnej
- Sugestie dotyczace ceny, warunkow, argumentow
- Model: GPT-4, czas: ~45 sekund

**Dane wejsciowe wysylane do AI**:
- Nazwa klienta, wartosc transakcji
- Etap w pipeline (PROSPECT, QUALIFIED, PROPOSAL, NEGOTIATION)
- Ile dni w pipeline
- Data ostatniego kontaktu
- Historia klienta, informacje o konkurencji

#### Automatyczne propozycje deali z emaili

Pipeline emailowy tworzy propozycje `CREATE_DEAL` gdy AI wykryje w emailu informacje o transakcji:

**Kiedy AI proponuje nowy deal**:
- Email zawiera zapytanie ofertowe z konkretnymi produktami
- Email zawiera kwote/wartosc zamowienia
- Triage klasyfikuje email jako ZAPYTANIE_OFERTOWE lub ZLECENIE

**Dane w propozycji**:
- Tytul (np. "Tuby aluminiowe 30x21 500szt")
- Wartosc (jesli wykryta w tresci, np. "75000 PLN")
- Etap: domyslnie `PROSPECT`
- Zrodlo: `Email`
- Powiazanie z firma (jesli firma juz istnieje lub zostala zaproponowana)
- Opis: temat emaila + nadawca

**Deduplikacja**: System sprawdza czy deal o takim samym tytule nie zostal utworzony w ciagu ostatnich 24 godzin. Jesli tak — pomija.

**Co widzi uzytkownik**:
- W Sugestiach AI: karta z ikona Handshake (zielona/bursztynowa), tytul deala, wartosc, etap
- Pasek pewnosci (np. 50%)
- Moze zmienic wartosc, etap, tytul przed akceptacja

### 8.5 AI w Zadaniach

#### Reczna analiza zadan

Dwa typy analizy z `UniversalAnalysisButton`:

**Podzial zadania** (`task-breakdown`):
- AI analizuje zlozonosc zadania i proponuje podzial na mniejsze czesci
- Kazdy krok dostaje szacowany czas i priorytet
- Przydatne dla zadan z estimatedHours > 4h
- Model: GPT-3.5, czas: 20-40 sekund

**Wskazowki produktywnosci** (`productivity-tips`):
- Sugestie optymalizacji wykonania zadania
- Propozycje narzedzi, kontekstow (@computer, @calls) i blokow czasowych
- Rekomendacje kolejnosci wykonania
- Model: GPT-3.5, czas: ~30 sekund

**Dane wejsciowe wysylane do AI**:
- Tytul i opis zadania
- Szacowane godziny
- Priorytet i kontekst GTD

#### Automatyczne propozycje zadan z emaili

Pipeline emailowy tworzy propozycje `CREATE_TASK` na trzy sposoby:

**1. Jawne zadania** — AI wyciaga z tresci emaila konkretne "action items":
- `"Prosze o przygotowanie wyceny do piatku"` → task: "Przygotuj wycene", deadline: piatek, priority: HIGH
- `"Zadzwon do mnie w sprawie zamowienia"` → task: "Zadzwonic ws. zamowienia", priority: MEDIUM

**2. Wymagane akcje (`requiredActions`)** — pilne dzialania z emaila:
- `"Prosze pilnie potwierdzic platnosc"` → task: "Potwierdzic platnosc", priority: MEDIUM

**3. Elementy do wykonania (`actionItems`)** — mniej pilne:
- `"Zapoznac sie z nowa oferta w zalaczniku"` → task: "Zapoznac sie z oferta", priority: LOW

**Limity**: System tworzy maksymalnie 5 propozycji zadan z jednego emaila. Zadanie musi miec tytul dluzszy niz 5 znakow.

**Deduplikacja**: Sprawdzenie czy zadanie o identycznym tytule nie istnieje z ostatnich 24h.

**Dane w propozycji**:
- Tytul zadania
- Opis (zawiera temat emaila i nadawce)
- Priorytet: LOW / MEDIUM / HIGH / URGENT
- Deadline (jesli wykryty w tresci)

**Co widzi uzytkownik**:
- W Sugestiach AI: karta z ikona CheckSquare (niebieska), tytul, priorytet, deadline
- Pasek pewnosci (np. 60%)
- Moze zmienic tytul, priorytet, dodac projekt/strumien przed akceptacja

### 8.6 Sugestie encji z Pipeline emailowego

Pipeline emailowy to glowne zrodlo automatycznych propozycji AI. Kazdy email przechodzacy przez analize AI (etap 4 pipeline) moze wygenerowac do 7 typow propozycji w jednym przebiegu.

#### Pelny przeplyw generowania propozycji

```
Email → Klasyfikacja → Triage (BUSINESS) → Analiza specjalistyczna
                                                      |
                                                      v
                                              JSON z encjami:
                                              {
                                                leads: [...],
                                                contacts: [...],
                                                deals: [...],
                                                tasks: [...],
                                                streamRouting: {...},
                                                rzut: {...}
                                              }
                                                      |
                                                      v
                                         Walidacja + Deduplikacja
                                                      |
                                                      v
                                    Zapis do tabeli ai_suggestions
                                         (status: PENDING)
                                                      |
                                                      v
                                    Uzytkownik widzi w UI:
                                    - Zakladka "Sugestie AI"
                                    - AnalysisPreviewModal (po analizie emaila)
```

#### 7 typow propozycji tworzonych przez pipeline

| Nr | Typ | Kontekst w DB | Kiedy tworzony | Warunek |
|----|-----|---------------|----------------|---------|
| 1 | Firma | `CREATE_COMPANY` | Nadawca z nieznanej domeny (nie-darmowej) | Firma nie istnieje w CRM |
| 2 | Kontakt | `CREATE_CONTACT` | Nadawca nie istnieje jako kontakt | Email nadawcy nie znaleziony |
| 3 | Lead | `CREATE_LEAD` | AI wykryje lead sprzedazowy | Brak identycznego leada z 24h |
| 4 | Transakcja | `CREATE_DEAL` | AI wykryje okazje sprzedazowa | Brak identycznego deala z 24h |
| 5 | Zadanie | `CREATE_TASK` | AI wykryje wymagane dzialania | Max 5 na email, min 5 znakow tytulu |
| 6 | Stream routing | `ROUTE_TO_STREAM` | AI ustali strumien GTD | streamRouting.suggestedRole istnieje |
| 7 | Cel RZUT | `CREATE_GOAL_RZUT` | AI wykryje cel mierzalny | rzut.detected = true |

#### Kolejnosc przetwarzania i linkowanie

Propozycje sa tworzone w ustalonej kolejnosci, co umozliwia linkowanie miedzy nimi:

1. **Firma** (CREATE_COMPANY) — tworzona jako pierwsza. Jesli firma istnieje w CRM, jej ID jest zapamietywane.
2. **Kontakt** (CREATE_CONTACT) — korzysta z ID firmy (jesli znaleziona lub zaproponowana).
3. **Leady** (CREATE_LEAD) — niezalezne, sprawdzane z deduplikacja 24h.
4. **Deale** (CREATE_DEAL) — linkowane do firmy (jesli znaleziona). Moga miec wartosc wyciagnieta z emaila.
5. **Zadania** (CREATE_TASK) — z trzech zrodel: `tasks`, `requiredActions`, `actionItems`.
6. **Stream routing** (ROUTE_TO_STREAM) — propozycja routingu do strumienia GTD z kontekstem i poziomem energii.
7. **Cel RZUT** (CREATE_GOAL_RZUT) — jesli AI wykryje cel sprzedazowy (R-rezultat, Z-mierzalnosc, U-termin, T-tlo).

#### Przyklad: co pipeline tworzy z jednego emaila

```
Email: jan.kowalski@abc-firma.pl → "Wycena na tuby aluminiowe 30x21, 500 szt, cena za sztuke?"

Pipeline tworzy 5 propozycji:

1. CREATE_COMPANY
   → Firma: "ABC Firma", domena: abc-firma.pl, status: PROSPECT
   → Confidence: 70%

2. CREATE_CONTACT
   → Jan Kowalski, jan.kowalski@abc-firma.pl, firma: ABC Firma
   → Status: LEAD, tag: from-email-analysis
   → Confidence: 70%

3. CREATE_LEAD
   → "ABC Firma - zapytanie ofertowe"
   → Firma: ABC Firma, priorytet: MEDIUM, zrodlo: Email
   → Confidence: 60%

4. CREATE_DEAL
   → "Tuby aluminiowe 30x21 500szt"
   → Wartosc: 0 (nie podano), etap: PROSPECT
   → Confidence: 50%

5. CREATE_TASK
   → "Przygotuj wycene na tuby 30x21 500szt"
   → Priorytet: HIGH, deadline: (jesli wykryty)
   → Confidence: 60%
```

#### Gdzie uzytkownik widzi propozycje

**1. Zakladka "Sugestie AI"** (`/dashboard/ai-rules/` → druga zakladka):
- Filtr: Oczekujace / Zaakceptowane / Odrzucone
- Kazda propozycja wyswietla: typ (ikona + kolor + badge), tytul, opis, confidence, date
- Rozwiecie karty pokazuje szczegoly (pola encji, uzasadnienie AI, dane emaila)
- Akcje: Zaakceptuj / Zmien i zaakceptuj / Odrzuc z korekcja

**2. AnalysisPreviewModal** (po analizie emaila w Smart Mailboxes):
- Otwiera sie automatycznie po zakonczeniu analizy emaila
- Naglowek: klasyfikacja emaila (np. BUSINESS) + pewnosc (np. 98%)
- Lista propozycji z checkboxami — mozesz odznaczac te, ktore nie sa potrzebne
- Kazda propozycja ma ikone i kolor wg typu:
  - Firma (Building2, niebieska)
  - Kontakt (User, zielona)
  - Lead (Target, fioletowa)
  - Transakcja (Handshake, bursztynowa)
  - Zadanie (CheckSquare, indigo)
  - Stream routing (Navigation, cyan)
  - Cel RZUT (Crosshair, rozowa)
- Szczegoly encji wyswietlane inline (nazwa, email, wartosc, priorytet, deadline)
- Przyciski: "Zatwierdz wybrane (N)" / "Odrzuc wszystkie" / "Zamknij"

**3. Akcje zbiorcze (bulk)**:
- Endpoint: POST `/api/v1/ai-suggestions/bulk-action`
- Mozna zaakceptowac lub odrzucic wiele propozycji jednoczesnie
- AnalysisPreviewModal domyslnie zaznacza WSZYSTKIE propozycje

#### Co sie dzieje po akceptacji

Po kliknieciu "Zaakceptuj" system natychmiast tworzy encje w CRM:

| Typ propozycji | Tworzona encja | Tabela |
|----------------|---------------|--------|
| CREATE_COMPANY | Firma | `company` |
| CREATE_CONTACT | Kontakt | `contact` |
| CREATE_LEAD | Lead | `lead` |
| CREATE_DEAL | Transakcja | `deal` |
| CREATE_TASK | Zadanie | `task` |
| ROUTE_TO_STREAM | Inbox item w strumieniu | `inboxItem` |
| CREATE_GOAL_RZUT | Zadanie z prefiksem [RZUT] | `task` |
| UPDATE_CONTACT | Aktualizacja istniejacego kontaktu | `contact` |
| BLACKLIST_DOMAIN | Domena w blacklistcie | `email_domain_rules` |

#### Nauka AI z decyzji uzytkownika

Kazda decyzja (akceptacja, modyfikacja, odrzucenie) jest zapisywana w polu `user_modifications` sugestii:

- **Akceptacja bez zmian** → `{ acceptedBy: userId }` — AI wie, ze propozycja byla dobra
- **Akceptacja ze zmianami** → `{ acceptedBy: userId, modifications: { title: "...", priority: "HIGH" } }` — AI dowiaduje sie co poprawic
- **Odrzucenie z korekcja** → `{ rejectedBy: userId, correctClassification: "BUSINESS", note: "To nasz dostawca" }` — AI uczy sie z bledow
- **Odrzucenie BLACKLIST z poprawka na BUSINESS** → domena automatycznie trafia na **whitelist**

Im wiecej decyzji podejmujesz, tym lepiej AI rozumie Twoje preferencje.

---

## 9. Sugestie AI — Human-in-the-Loop

System sugestii pozwala AI proponowac akcje, ktore MUSISZ zatwierdzic.

**AI SUGERUJE — CZLOWIEK DECYDUJE.** Kazda propozycja AI czeka na Twoja akceptacje lub odrzucenie.

### Typy sugestii

| Typ | Opis | Co sie dzieje po akceptacji |
|-----|------|-----------------------------|
| ROUTE_TO_STREAM | Propozycja routingu do strumienia GTD | Email kierowany do wybranego strumienia |
| CREATE_TASK | Propozycja utworzenia zadania | Zadanie tworzone w systemie |
| CREATE_CONTACT | Propozycja nowego kontaktu | Kontakt tworzony z danymi z emaila |
| CREATE_COMPANY | Propozycja nowej firmy | Firma tworzona z domena i NIP |
| CREATE_DEAL | Propozycja utworzenia deala | Deal tworzony z wartoscia |
| CREATE_LEAD | Propozycja nowego leada | Lead tworzony w CRM |
| UPDATE_CONTACT | Propozycja aktualizacji kontaktu | Kontakt aktualizowany (wybrane pola) |
| BLACKLIST_DOMAIN | Propozycja dodania domeny na blacklist | Domena dodana do blacklisty |
| SEND_NOTIFICATION | Propozycja powiadomienia | Tylko logowane, informacyjne |

### AnalysisPreviewModal

Po analizie emaila w Smart Mailboxes otwiera sie modal z podgladem wszystkich propozycji AI:

- **Podsumowanie**: kategoria, pilnosc, sentyment, opis
- **Stream Routing**: sugerowany strumien GTD z kontekstem i poziomem energii
- **Lista propozycji**: karty z typem (ikona + kolor), tytulem, danymi i confidence
- **Akcje per propozycja**: Zaakceptuj / Odrzuc z powodem
- **Akcje zbiorcze**: Zaakceptuj wszystkie / Odrzuc wszystkie

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

### Scenariusz 2: Zapytanie ofertowe (dwuetapowy triage)

```
Email: jan.kowalski@abc-firma.pl → "Wycena na tuby aluminiowe 30x21, 500 szt"

Etap 1: CRM Check — brak kontaktu
Etap 2: Listy/Patterny — brak
Etap 2.5: Regula "Streams: Zaawansowana analiza biznesowa" (priorytet 90)
           → fromDomain not_contains ["noreply","mailer-daemon","no-reply"] → pasuje
Etap 3: forceClassification = BUSINESS
Etap 4: Dwuetapowy triage:
  Krok 1 (triage, gpt-4o-mini): → ZAPYTANIE_OFERTOWE (confidence: 0.98)
  Krok 2 (EMAIL_BIZ_ZAPYTANIE_OFERTOWE, gpt-4o):
    → sentiment=POSITIVE, urgency=HIGH
    → firma "ABC Firma", kontakt "Jan Kowalski", tel: 123456789
    → deal "Tuby aluminiowe 30x21 500szt", task "Przygotuj wycene"
    → streamRouting: NEXT_ACTIONS, context: @computer, energy: HIGH
Etap 5: RAG + Flow + propozycje AI (HITL)

Wynik: BUSINESS/ZAPYTANIE_OFERTOWE, 4 propozycje do zatwierdzenia
```

### Scenariusz 3: Platnosc od Vindicat (triage FAKTURA_PLATNOSC)

```
Email: system@vindicat.pl → "Powiadomienie o nadchodzacym terminie platnosci"

Etap 1: CRM Check — brak kontaktu
Etap 2: Listy/Patterny — brak
Etap 2.5: Regula "Streams: Business" → fromDomain not_contains noreply → pasuje
Etap 3: forceClassification = BUSINESS
Etap 4: Dwuetapowy triage:
  Krok 1 (triage): → FAKTURA_PLATNOSC (confidence: 0.98)
  Krok 2 (EMAIL_BIZ_FAKTURA_PLATNOSC):
    → kwota: 444,99 PLN, termin: 19.02.2026
    → nr sprawy: 277131022026, rachunek: 751050016...
    → task "Zweryfikowac status zobowiazania 444,99 PLN"
    → streamRouting: NEXT_ACTIONS, tags: finanse, monit
Etap 5: RAG + Flow + propozycje AI

Wynik: BUSINESS/FAKTURA_PLATNOSC, task + firma + kontakt zaproponowane
```

### Scenariusz 4: Istniejacy kontakt CRM

```
Email: anna@staly-klient.pl → "Dzien dobry, potrzebujemy dodatkowej partii..."

Etap 1: CRM Check → kontakt "Anna" znaleziony → BUSINESS (100%)
Etap 2: Pomijany
Etap 2.5: Reguly sprawdzone (ale CRM juz dopasowal)
Etap 3: BUSINESS z pewnoscia 1.0
Etap 4: Dwuetapowy triage (jesli EMAIL_BIZ_TRIAGE istnieje):
  Krok 1: → ZLECENIE (confidence: 0.90)
  Krok 2 (EMAIL_BIZ_ZLECENIE): specyfikacja, deadline, encje
Etap 5: RAG + Flow + propozycje AI

Wynik: BUSINESS/ZLECENIE, istniejacy kontakt powiazany, propozycje HITL
```

### Scenariusz 5: Dodanie nowej kategorii (klasyczny flow)

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

**Uwaga**: Kategoria REKLAMACJA jest juz obslugiwana przez dwuetapowy triage (EMAIL_BIZ_REKLAMACJA). Tworzenie osobnej kategorii ma sens tylko jesli chcesz inny flow niz BUSINESS.

### Scenariusz 6: Zmiana modelu AI per operacja

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

1. **Dwuetapowy triage** juz oszczedza ~40% kosztow (triage na gpt-4o-mini)
2. **Zmniejsz AI content limit** w Pipeline Config → Limity (domyslnie 10000 znakow)
3. **Uzyj tanszego modelu** — np. `gpt-4o-mini` zamiast `gpt-4o`
4. **Zmniejsz Max Tokens** w prompcie (np. z 4000 na 1000)
5. **Wylacz AI dla kategorii** — usun prompt `EMAIL_POST_{KATEGORIA}`
6. **Ogranicz post-akcje** — wylacz niepotrzebne akcje w Pipeline Config → Post-akcje

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

1. Usun WSZYSTKIE prompty `EMAIL_POST_*` i `EMAIL_BIZ_*` — AI sie nie odpali na zadnym emailu
2. Lub wylacz providerow w zakladce Konfiguracja
3. Reguly beda dzialac normalnie (klasyfikacja bez AI)

### "Jak wylaczyc dwuetapowy triage?"

1. Usun prompt `EMAIL_BIZ_TRIAGE` z bazy (lub zmien status na DRAFT)
2. `runBusinessTriage()` zwroci null → automatyczny fallback do starego flow
3. Stary flow: `EMAIL_POST_BUSINESS` (jesli istnieje) → pojedyncza analiza

### "Triage klasyfikuje bledna kategorie"

1. Edytuj prompt `EMAIL_BIZ_TRIAGE` w zakladce Prompty
2. Dodaj przykłady lub doprecyzuj definicje kategorii w systemPrompt
3. Zmniejsz temperature (domyslnie 0.1 — juz niska)
4. Jesli specjalistyczny prompt nie istnieje, system probuje `EMAIL_BIZ_INNE` (fallback)

### "Regula AI z not_contains nie dziala"

Operator `not_contains` jest obslugiwany od wersji z dwuetapowym triage. Dostepne operatory negacji:
- `not_contains` — domena/tresc NIE zawiera danego ciagu
- `not_equals` — pole NIE jest rowne wartosci
- `not_exists` — pole jest puste

Jesli regula nadal nie dziala, sprawdz logi: `[AIRules] Unknown operator: ...` — nieznany operator bedzie zalogowany.

### "Propozycje AI sie nie pojawiaja"

1. Sprawdz czy `requireReview: true` w Pipeline Config → Post-akcje (domyslnie dla BUSINESS)
2. Jesli `requireReview: false`, encje sa tworzone automatycznie (bez propozycji)
3. Przejdz do zakladki "Sugestie AI" i sprawdz filtr statusu (Oczekujace)
4. Po analizie emaila w Smart Mailboxes powinien sie otworzyc AnalysisPreviewModal

---

## Podsumowanie

| Co chcesz zrobic | Gdzie |
|-------------------|-------|
| Dodac providera AI | Konfiguracja AI → Konfiguracja |
| Dodac model AI | Admin AI Config → Models |
| Przypisac model do operacji | Konfiguracja AI → Akcje AI |
| Utworzyc regule klasyfikacji | Konfiguracja AI → Reguly |
| Wlaczyc AI per kategoria | Konfiguracja AI → Prompty (dodaj `EMAIL_POST_*`) |
| Edytowac prompt triage | Konfiguracja AI → Prompty → `EMAIL_BIZ_TRIAGE` |
| Edytowac prompt specjalistyczny | Konfiguracja AI → Prompty → `EMAIL_BIZ_{KATEGORIA}` |
| Wylaczyc dwuetapowy triage | Usun/zarchiwizuj `EMAIL_BIZ_TRIAGE` |
| Dodac kategorie | Konfiguracja AI → Kategorie |
| Przegladac sugestie AI | Konfiguracja AI → Sugestie AI |
| Zatwierdzic propozycje po analizie | Smart Mailboxes → AnalysisPreviewModal |
| Skonfigurowac pipeline | Admin → Pipeline Config |
| Analizowac email reczne | Smart Mailboxes → przycisk Analiza AI |
| Analizowac element CRM | Projekt/Zadanie/Deal/Kontakt → przycisk Analiza AI |
| Zarzadzac domenami | Konfiguracja AI → Listy domen |
| Zaladowac reguly triage | Konfiguracja AI → przycisk "Seed Triage" |
