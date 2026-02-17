# Architektura modulu CRM -- Sorto CRM

Dokument opisuje model danych, relacje i endpointy API glownych encji CRM:
kontakty, firmy, transakcje (deals), pipeline sprzedazowy, wydarzenia,
system zdrowia relacji, produkty, uslugi i dokumenty finansowe.

---

## 1. Przeglad

Modul CRM stanowi rdzen Sorto CRM. Odpowiada za:

- **Zarzadzanie kontaktami i firmami** -- baza klientow i partnerow
- **Pipeline sprzedazowy** -- sledzenie transakcji od prospekta do zamkniecia
- **Wydarzenia (targi, konferencje)** -- planowanie, budzet, zespol, koszty
- **Inteligencja kliencka** -- informacje wywiadowcze o firmach i kontaktach
- **Zdrowie relacji** -- automatyczny scoring zdrowia relacji biznesowych
- **Produkty i uslugi** -- katalog oferowanych pozycji
- **Dokumenty finansowe** -- oferty, zamowienia, faktury
- **Uniwersalne powiazania** -- EntityLink laczy dowolne encje miedzy soba

### Relacja z GTD Streams

Encje CRM (Contact, Company, Deal, Event) moga byc powiazane z:
- **Zadaniami** (`Task.contactId`, `Task.dealId`, `Task.eventId`)
- **Projektami** (`Project.contactId`, `Project.dealId`, `Project.eventId`)
- **Notatkami** (`Note.companyId`, `Note.contactId`, `Note.dealId`, `Note.eventId`)
- **Spotkaniami** (`Meeting.contactId`, `Meeting.companyId`, `Meeting.dealId`)
- **Strumieniami GTD** -- poprzez `EntityLink` (typ STREAM <-> CONTACT/COMPANY/DEAL)

Dzieki temu pojedynczy kontakt lub transakcja sa widoczne zarowno w widoku
CRM, jak i w kontekscie GTD (Inbox, Next Actions, Projects).

---

## 2. Model danych -- diagram glownych relacji

```
                        +----------------+
                        | Organization   |
                        | (multi-tenant) |
                        +-------+--------+
                                |
          +---------------------+---------------------+
          |                     |                     |
   +------+------+      +------+------+      +------+------+
   |   Contact   |      |   Company   |      |    Deal     |
   | ----------- |      | ----------- |      | ----------- |
   | firstName   |      | name        |      | title       |
   | lastName    |      | domain      |      | value       |
   | email       |      | nip/regon   |      | stage (enum)|
   | phone       |      | industry    |      | probability |
   | status      |      | size        |      | currency    |
   | companyId --+----->| status      |<-----+ companyId   |
   | emailCategory|     | primaryContact|    | ownerId --->User
   +------+------+      +------+------+     +------+------+
          |                     |                    |
          |  +-----------+     |                    |
          +->| ContactRel|     |  +--------------+  |
          |  | (mapa     |     +->| EventCompany |  |
          |  |  relacji) |     |  +--------------+  |
          |  +-----------+     |                    |
          |                    |  +--------------+  |
          +--------------------+->| ClientProduct|<-+
          |                       | (historia    |
          |                       |  zakupow)    |
          |                       +--------------+
          |
   +------+------+     +----------------+
   | EventContact |     | DealStakeholder|
   | (link event  |     | (mapa decyzji) |
   |  <-> contact)|     | role, influence|
   +-------------+      | sentiment      |
                         | isChampion     |
                         +-------+--------+
                                 |
                          +------+------+
                          | DealCompet. |
                          | (konkurencja|
                          |  w dealu)   |
                          +-------------+

   +-------------+      +---------------+      +-----------+
   |   Product   |      |    Service    |      |   Lead    |
   | ----------- |      | ------------- |      | --------- |
   | name, sku   |      | name          |      | title     |
   | price, cost |      | billingType   |      | status    |
   | category    |      | deliveryMethod|      | priority  |
   +------+------+      +-------+-------+      +-----------+
          |                      |
   +------+------+      +-------+-------+
   | OfferItem   |      | InvoiceItem   |
   | OrderItem   |      | (pozycje dok. |
   | (pozycje)   |      |  finansowych) |
   +------+------+      +-------+-------+
          |                      |
   +------+------+      +-------+-------+      +-----------+
   |    Offer    |      |   Invoice     |      |   Order   |
   | ----------- |      | ------------- |      | --------- |
   | offerNumber |      | invoiceNumber |      | orderNum  |
   | validUntil  |      | dueDate       |      | status    |
   | totalAmount |      | fakturowniaId |      | totalAmt  |
   +-------------+      +---------------+      +-----------+

   +-------------------+     +----------------+
   |    Event          |     | EntityLink     |
   | (targi/konf.)     |     | (universal)    |
   | name, eventType   |     | fromEntityType |
   | venue, city       |     | fromEntityId   |
   | budgetPlanned     |     | toEntityType   |
   | budgetActual      |     | toEntityId     |
   +--------+----------+     | linkType       |
            |                 | strength 1-5   |
   +--------+----------+     +----------------+
   | EventTeamMember   |
   | EventExpense      |
   +-------------------+

   +---------------------+     +------------------+
   | RelationshipHealth  |     | ClientIntelligence|
   | healthScore 0-100   |     | category (LIKES,  |
   | trend (RISING/...)  |     |  DISLIKES, FACT,  |
   | riskLevel           |     |  WARNING, TIP...) |
   | recency/frequency/  |     | entityType        |
   |  response/sentiment |     | entityId          |
   +---------------------+     +------------------+
```

---

## 3. Kontakty (Contact)

### Pola modelu

| Pole | Typ | Opis |
|------|-----|------|
| `id` | UUID | Klucz glowny |
| `firstName` | String | Imie (wymagane) |
| `lastName` | String | Nazwisko (wymagane) |
| `email` | String? | Adres email |
| `phone` | String? | Numer telefonu |
| `company` | String? | Nazwa firmy (tekst swobodny) |
| `position` | String? | Stanowisko |
| `department` | String? | Dzial |
| `notes` | String? | Notatki |
| `tags` | String[] | Tagi (tablica) |
| `status` | ContactStatus | ACTIVE / INACTIVE / LEAD / CUSTOMER / ARCHIVED |
| `source` | String? | Zrodlo pozyskania |
| `emailCategory` | EmailCategory | VIP / SPAM / INVOICES / ARCHIVE / UNKNOWN |
| `companyId` | String? | FK do Company (przypisana firma) |
| `lastInteractionAt` | DateTime? | Data ostatniej interakcji |
| `interactionCount` | Int | Licznik interakcji |

### Relacje

- `assignedCompany` -- firma do ktorej kontakt jest przypisany (FK `companyId`)
- `companies` -- firmy w ktorych kontakt figuruje jako `primaryContact`
- `relationsFrom` / `relationsTo` -- mapa relacji miedzy kontaktami (`ContactRelation`)
- `intelligence` -- wpisy wywiadowcze (`ClientIntelligence`)
- `dealStakeholders` -- rola kontaktu w transakcjach (`DealStakeholder`)
- `eventContacts` -- powiazania z wydarzeniami (`EventContact`)
- `tasks`, `projects`, `meetings`, `offers`, `contactNotes` -- powiazane encje GTD/CRM

### API Endpoints

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/contacts` | Lista kontaktow (paginacja, search, sort) |
| GET | `/api/v1/contacts/:id` | Szczegoly kontaktu |
| POST | `/api/v1/contacts` | Utworzenie kontaktu |
| PUT | `/api/v1/contacts/:id` | Aktualizacja kontaktu |
| DELETE | `/api/v1/contacts/:id` | Usuniecie kontaktu |

**Filtry GET /contacts**: `search` (imie/nazwisko/email/stanowisko), `sortBy`, `sortOrder`, `page`, `limit`.

---

## 4. Firmy (Company)

### Pola modelu

| Pole | Typ | Opis |
|------|-----|------|
| `id` | UUID | Klucz glowny |
| `name` | String | Nazwa firmy (wymagane) |
| `website` | String? | Strona www |
| `domain` | String? | Domena email |
| `industry` | String? | Branza |
| `size` | CompanySize? | STARTUP / SMALL / MEDIUM / LARGE / ENTERPRISE |
| `revenue` | String? | Przychody (tekst) |
| `description` | String? | Opis |
| `address` | String? | Adres |
| `phone` | String? | Telefon |
| `email` | String? | Email firmowy |
| `nip` | String? | NIP (10 cyfr) |
| `regon` | String? | REGON |
| `krs` | String? | KRS |
| `vatActive` | Boolean? | Czy VAT aktywny |
| `tags` | String[] | Tagi |
| `status` | CompanyStatus | PROSPECT / CUSTOMER / PARTNER / INACTIVE / ARCHIVED |
| `primaryContactId` | String? | FK do glownego kontaktu |
| `lastInteractionAt` | DateTime? | Data ostatniej interakcji |
| `interactionCount` | Int | Licznik interakcji |

### Relacje

- `primaryContact` -- glowna osoba kontaktowa
- `assignedContacts` -- kontakty przypisane do firmy
- `deals` -- transakcje powiazane z firma
- `eventCompanies` -- udzial w wydarzeniach (`EventCompany`)
- `clientProducts` -- historia zakupow (`ClientProduct`)
- `clientProductStats` -- statystyki zakupowe (1:1)
- `tasks`, `projects`, `offers`, `companyNotes`, `companyMeetings` -- powiazane encje

### API Endpoints

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/companies` | Lista firm (paginacja, search, filtry) |
| GET | `/api/v1/companies/lookup-nip/:nip` | Wyszukiwanie po NIP |
| GET | `/api/v1/companies/:id` | Szczegoly firmy |
| POST | `/api/v1/companies` | Utworzenie firmy |
| PUT | `/api/v1/companies/:id` | Aktualizacja firmy |
| DELETE | `/api/v1/companies/:id` | Usuniecie firmy |
| POST | `/api/v1/companies/:id/merge` | Scalenie firm |

**Filtry GET /companies**: `search`, `status`, `industry`, `size`, `sortBy`, `sortOrder`, `page`, `limit`.

---

## 5. Transakcje (Deal)

### Pola modelu

| Pole | Typ | Opis |
|------|-----|------|
| `id` | UUID | Klucz glowny |
| `title` | String | Tytul transakcji (wymagane) |
| `description` | String? | Opis |
| `value` | Float? | Wartosc transakcji |
| `currency` | String | Waluta (domyslnie "USD") |
| `stage` | DealStage | Etap pipeline (enum) |
| `probability` | Float | Prawdopodobienstwo zamkniecia 0-100 |
| `expectedCloseDate` | DateTime? | Oczekiwana data zamkniecia |
| `actualCloseDate` | DateTime? | Rzeczywista data zamkniecia |
| `source` | String? | Zrodlo |
| `notes` | String? | Notatki |
| `companyId` | String | FK do Company (wymagane) |
| `ownerId` | String | FK do User -- wlasciciel |
| `kanbanPosition` | Int | Pozycja na tablicy Kanban |

### Etapy pipeline (DealStage enum)

| Etap | Opis |
|------|------|
| `PROSPECT` | Wstepne zainteresowanie |
| `QUALIFIED` | Kwalifikacja -- potrzeba potwierdzona |
| `PROPOSAL` | Oferta wyslana |
| `NEGOTIATION` | Negocjacje |
| `CLOSED_WON` | Wygrana |
| `CLOSED_LOST` | Przegrana |

### Relacje

- `company` -- firma bedaca strona transakcji
- `owner` -- uzytkownik odpowiedzialny (User)
- `stakeholders` -- mapa decyzyjna (`DealStakeholder[]`)
- `competitors` -- konkurencja w transakcji (`DealCompetitor[]`)
- `lostAnalysis` -- analiza przegranej (1:1, `DealLostAnalysis`)
- `offers` -- oferty powiazane z dealem
- `dealTasks`, `dealProjects`, `dealMeetings`, `dealNotes` -- powiazane encje GTD
- `eventCompanies` -- powiazania z wydarzeniami
- `clientProducts` -- zrealizowane produkty/uslugi

### API Endpoints

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/deals` | Lista transakcji (paginacja, filtry) |
| GET | `/api/v1/deals/pipeline` | Widok pipeline (pogrupowane po etapach) |
| GET | `/api/v1/deals/:id` | Szczegoly transakcji |
| POST | `/api/v1/deals` | Utworzenie transakcji |
| PUT | `/api/v1/deals/:id` | Aktualizacja (w tym zmiana etapu) |
| DELETE | `/api/v1/deals/:id` | Usuniecie transakcji |

**Filtry GET /deals**: `search`, `stage`, `companyId`, `ownerId`, `sortBy`, `sortOrder`, `page`, `limit`.

---

## 6. Pipeline sprzedazowy

### Jak dzialaja etapy

Transakcje (Deal) przechodza przez etapy zdefiniowane w enum `DealStage`.
Zmiana etapu odbywa sie przez `PUT /api/v1/deals/:id` z nowym polem `stage`.

```
  PROSPECT --> QUALIFIED --> PROPOSAL --> NEGOTIATION --> CLOSED_WON
                                                    \--> CLOSED_LOST
```

#### Prawdopodobienstwo

Kazdy etap ma sugerowane prawdopodobienstwo zamkniecia:
- PROSPECT: ~10%
- QUALIFIED: ~25%
- PROPOSAL: ~50%
- NEGOTIATION: ~75%
- CLOSED_WON: 100%
- CLOSED_LOST: 0%

### Konfiguracja pipeline

Model `pipeline_config` przechowuje per-organizacja:

| Pole JSON | Opis |
|-----------|------|
| `classifications` | Mapowanie kategorii emaili na akcje CRM |
| `aiParams` | Parametry modelu AI dla klasyfikacji |
| `thresholds` | Progi pewnosci dla automatycznych akcji |
| `keywords` | Slownik slow kluczowych (pilne, spam, etc.) |
| `domains` | Reguly per domena email |
| `scheduling` | Harmonogram automatycznego przetwarzania |
| `postActions` | Akcje po klasyfikacji (np. auto-odpowiedz) |
| `taskExtraction` | Ekstrakcja zadan z tresci maili |

### Custom Pipeline Stages (pipelineStages)

Oproc enum `DealStage`, system posiada dynamiczne etapy pipeline
zarzadzane przez API:

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/pipeline/stages` | Lista etapow organizacji |
| POST | `/api/v1/pipeline/stages` | Utworzenie nowego etapu |
| PUT | `/api/v1/pipeline/stages/:id` | Aktualizacja etapu |
| DELETE | `/api/v1/pipeline/stages/:id` | Usuniecie etapu |
| PUT | `/api/v1/pipeline/stages/reorder` | Zmiana kolejnosci etapow |

Kazdy custom stage posiada: `name`, `slug`, `probability`, `color`,
`isClosed`, `isWon`, `position`.

### Pipeline Analytics

Endpoint `/api/v1/pipeline-analytics` dostarcza:
- Wartosc pipeline per etap
- Wskazniki konwersji miedzy etapami
- Sredni czas w kazdym etapie
- Prognoza przychodow

---

## 7. Wydarzenia (Event)

### Pola modelu

| Pole | Typ | Opis |
|------|-----|------|
| `id` | UUID | Klucz glowny |
| `name` | String | Nazwa wydarzenia |
| `description` | String? | Opis |
| `eventType` | EventType | TRADE_SHOW / CONFERENCE / WEBINAR / WORKSHOP / NETWORKING / COMPANY_EVENT / OTHER |
| `venue` | String? | Miejsce |
| `city` | String? | Miasto |
| `country` | String? | Kraj |
| `address` | String? | Adres |
| `startDate` | DateTime | Data rozpoczecia |
| `endDate` | DateTime | Data zakonczenia |
| `setupDate` | DateTime? | Data montazu |
| `teardownDate` | DateTime? | Data demontazu |
| `status` | EventStatus | DRAFT / PLANNING / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED |
| `budgetPlanned` | Float? | Planowany budzet |
| `budgetActual` | Float? | Rzeczywisty budzet |
| `currency` | String | Waluta (domyslnie "EUR") |
| `goals` | Json? | Cele wydarzenia |
| `results` | Json? | Wyniki |
| `rating` | Float? | Ocena |
| `retrospective` | String? | Retrospektywa |

### Modele powiazane

#### EventCompany (firmy na wydarzeniu)

| Pole | Opis |
|------|------|
| `eventId` | FK do Event |
| `companyId` | FK do Company |
| `role` | CLIENT / PROSPECT / PARTNER / SPONSOR / EXHIBITOR / VISITOR |
| `boothNumber` | Numer stoiska |
| `boothSize` | Rozmiar stoiska |
| `status` | INVITED / CONFIRMED / TENTATIVE / DECLINED / ATTENDED / NO_SHOW |
| `dealValue` | Wartosc potencjalnej transakcji |
| `dealId` | FK do Deal (opcjonalnie) |
| `notes` | Notatki |

#### EventContact (kontakty na wydarzeniu)

| Pole | Opis |
|------|------|
| `eventId` | FK do Event |
| `contactId` | FK do Contact |
| `plannedMeetingTime` | Planowany czas spotkania |
| `meetingPriority` | Priorytet spotkania |
| `meetingNotes` | Notatki ze spotkania |
| `metDuringEvent` | Czy spotkanie sie odbylo |
| `followUpNeeded` | Czy potrzebny follow-up |

#### EventTeamMember (zespol na wydarzeniu)

| Pole | Opis |
|------|------|
| `userId` | FK do User |
| `role` | Rola w zespole |
| `responsibilities` | Obowiazki |
| `arrivalDate` / `departureDate` | Daty przyjazdu/wyjazdu |
| `hotelName` / `hotelConfirmation` | Hotel |
| `transportType` / `transportDetails` | Transport |
| `assignedCompanyIds` | Przypisane firmy do obslugi |

#### EventExpense (koszty wydarzenia)

| Pole | Opis |
|------|------|
| `category` | BOOTH / HOTEL / TRANSPORT / CATERING / MATERIALS / GIFTS / MARKETING / OTHER |
| `description` | Opis kosztu |
| `amount` | Kwota |
| `status` | PLANNED / APPROVED / PAID / REJECTED |
| `invoiceNumber` | Numer faktury |
| `receiptUrl` | URL paragonu |

### API Endpoints

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/events` | Lista wydarzen (filtry: status, eventType, upcoming) |
| GET | `/api/v1/events/:id` | Szczegoly wydarzenia |
| POST | `/api/v1/events` | Utworzenie wydarzenia |
| PATCH | `/api/v1/events/:id` | Aktualizacja wydarzenia |
| DELETE | `/api/v1/events/:id` | Usuniecie wydarzenia |
| GET | `/api/v1/events/:id/companies` | Firmy na wydarzeniu |
| POST | `/api/v1/events/:id/companies` | Dodanie firmy do wydarzenia |
| DELETE | `/api/v1/events/:id/companies/:companyId` | Usuniecie firmy z wydarzenia |
| GET | `/api/v1/events/:id/team` | Zespol wydarzenia |
| POST | `/api/v1/events/:id/team` | Dodanie czlonka zespolu |
| DELETE | `/api/v1/events/:id/team/:userId` | Usuniecie czlonka zespolu |
| GET | `/api/v1/events/:id/expenses` | Koszty wydarzenia |
| POST | `/api/v1/events/:id/expenses` | Dodanie kosztu |
| DELETE | `/api/v1/events/:id/expenses/:expenseId` | Usuniecie kosztu |

---

## 8. Relacje i inteligencja

### 8.1 RelationshipHealth (zdrowie relacji)

System automatycznego scoringu zdrowia relacji biznesowych.

| Pole | Typ | Opis |
|------|-----|------|
| `entityType` | HealthEntityType | COMPANY / CONTACT / DEAL |
| `entityId` | String | ID encji (polimorficzny FK) |
| `healthScore` | Int 0-100 | Ogolny wynik zdrowia |
| `trend` | HealthTrend | RISING / STABLE / DECLINING / CRITICAL |
| `recencyScore` | Int | Wynik swiezosci kontaktu |
| `frequencyScore` | Int | Wynik czestotliwosci interakcji |
| `responseScore` | Int | Wynik szybkosci odpowiedzi |
| `sentimentScore` | Int | Wynik sentymentu komunikacji |
| `engagementScore` | Int | Wynik zaangazowania |
| `riskLevel` | RiskLevel | LOW / MEDIUM / HIGH / CRITICAL |
| `riskFactors` | Json | Tablica czynnikow ryzyka |
| `lastContactAt` | DateTime? | Data ostatniego kontaktu |

**Powiazane modele:**
- `HealthHistory` -- historia zmian scoringu (audit trail)
- `HealthAlert` -- alerty (HEALTH_DROP, NO_CONTACT, VIP_NEGLECTED, DEAL_STALLED, NEGATIVE_SENTIMENT, HEALTH_RECOVERED)

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/health-score` | Lista wynikow zdrowia |
| GET | `/api/v1/health-score/:entityType/:entityId` | Wynik dla encji |
| GET | `/api/v1/health-score/alerts` | Lista alertow |
| POST | `/api/v1/health-score/alerts/:id/action` | Reakcja na alert |
| POST | `/api/v1/health-score/calculate/:entityType/:entityId` | Przeliczenie |

### 8.2 ClientIntelligence (inteligencja kliencka)

Przechowuje informacje wywiadowcze o firmach i kontaktach.

| Pole | Typ | Opis |
|------|-----|------|
| `entityType` | IntelEntityType | COMPANY / CONTACT |
| `entityId` | String | ID encji |
| `category` | IntelCategory | Typ informacji |
| `content` | String | Tresc informacji |
| `importance` | Int 1-5 | Waznosc |
| `source` | String? | Skad pochodzi informacja |
| `sourceContactId` | String? | FK do kontaktu-zrodla |
| `isPrivate` | Boolean | Czy prywatna |
| `eventDate` | DateTime? | Data zdarzenia |
| `isRecurring` | Boolean | Czy cykliczna (np. rocznice) |

**Kategorie IntelCategory:**

| Kategoria | Opis |
|-----------|------|
| `LIKES` | Co lubi klient |
| `DISLIKES` | Czego nie lubi |
| `PREFERENCE` | Preferencje (komunikacja, warunki) |
| `FACT` | Fakty (wielkosci zamowien, budzety) |
| `WARNING` | Ostrzezenia (problemy, reklamacje) |
| `TIP` | Wskazowki (jak prowadzic relacje) |
| `IMPORTANT_DATE` | Wazne daty (urodziny, rocznice) |
| `DECISION_PROCESS` | Jak podejmuja decyzje |
| `COMMUNICATION` | Preferencje komunikacyjne |
| `SUCCESS` | Sukcesy we wspolpracy |

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/client-intelligence` | Lista wpisow |
| GET | `/api/v1/client-intelligence/briefing/:entityType/:entityId` | Briefing dla encji |
| GET | `/api/v1/client-intelligence/:id` | Szczegoly wpisu |
| POST | `/api/v1/client-intelligence` | Utworzenie wpisu |
| PATCH | `/api/v1/client-intelligence/:id` | Aktualizacja |
| DELETE | `/api/v1/client-intelligence/:id` | Usuniecie |

### 8.3 DealStakeholder (mapa decyzyjna)

Mapuje osoby zaangazowane w transakcje i ich role/nastawienie.

| Pole | Typ | Opis |
|------|-----|------|
| `dealId` | String | FK do Deal |
| `contactId` | String | FK do Contact |
| `role` | StakeholderRole | Rola decyzyjna |
| `isChampion` | Boolean | Czy jest championem (naszym sprzymierzencem) |
| `influence` | Int 0-100 | Wplyw na decyzje |
| `sentiment` | Sentiment | POSITIVE / NEUTRAL / SKEPTICAL / NEGATIVE / UNKNOWN |
| `objections` | String? | Obiekcje |
| `motivations` | String? | Motywacje |
| `winStrategy` | String? | Strategia pozyskania |
| `hasApproved` | Boolean | Czy zatwierdzil |

**Role StakeholderRole:**
DECISION_MAKER, INFLUENCER, CHAMPION, BLOCKER, USER_ROLE, TECHNICAL,
FINANCIAL, LEGAL, PROCUREMENT.

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/deal-stakeholders/deal/:dealId` | Stakeholderzy dealu |
| GET | `/api/v1/deal-stakeholders/:id` | Szczegoly |
| POST | `/api/v1/deal-stakeholders` | Dodanie stakeholdera |
| PATCH | `/api/v1/deal-stakeholders/:id` | Aktualizacja |
| DELETE | `/api/v1/deal-stakeholders/:id` | Usuniecie |

### 8.4 DealCompetitor (konkurencja w transakcji)

| Pole | Typ | Opis |
|------|-----|------|
| `dealId` | String | FK do Deal |
| `competitorName` | String | Nazwa konkurenta |
| `estimatedPrice` | Float? | Szacowana cena konkurenta |
| `threatLevel` | ThreatLevel | LOW / MEDIUM / HIGH / CRITICAL |
| `theirStrengths` | String? | Mocne strony konkurenta |
| `theirWeaknesses` | String? | Slabe strony konkurenta |
| `ourAdvantages` | String? | Nasze przewagi |
| `status` | CompetitorStatus | ACTIVE / ELIMINATED / WON / UNKNOWN |

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/deal-competitors/deal/:dealId` | Konkurenci dealu |
| GET | `/api/v1/deal-competitors/lost-analysis/:dealId` | Analiza przegranej |
| GET | `/api/v1/deal-competitors/:id` | Szczegoly |
| POST | `/api/v1/deal-competitors` | Dodanie konkurenta |
| PATCH | `/api/v1/deal-competitors/:id` | Aktualizacja |
| DELETE | `/api/v1/deal-competitors/:id` | Usuniecie |
| POST | `/api/v1/deal-competitors/lost-analysis` | Utworzenie analizy przegranej |

### 8.5 ContactRelation (mapa relacji miedzy kontaktami)

| Pole | Typ | Opis |
|------|-----|------|
| `fromContactId` | String | FK do Contact (zrodlo) |
| `toContactId` | String | FK do Contact (cel) |
| `relationType` | ContactRelationType | Typ relacji |
| `strength` | Int 1-5 | Sila relacji |
| `isBidirectional` | Boolean | Czy dwukierunkowa |
| `discoveredVia` | String? | Skad wiemy o relacji |
| `eventId` | String? | FK do Event (odkryta na wydarzeniu) |
| `meetingId` | String? | FK do Meeting (odkryta na spotkaniu) |

**Typy relacji:** REPORTS_TO, WORKS_WITH, KNOWS, REFERRED_BY, FAMILY,
TECHNICAL, FORMER_COLLEAGUE, MENTOR, PARTNER.

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/contact-relations` | Lista relacji |
| GET | `/api/v1/contact-relations/network/:contactId` | Siec relacji kontaktu |
| GET | `/api/v1/contact-relations/:id` | Szczegoly relacji |
| POST | `/api/v1/contact-relations` | Utworzenie relacji |
| PATCH | `/api/v1/contact-relations/:id` | Aktualizacja |
| DELETE | `/api/v1/contact-relations/:id` | Usuniecie |

---

## 9. Powiazania uniwersalne (EntityLink)

Model `EntityLink` umozliwia tworzenie polaczen miedzy dowolnymi encjami
systemu bez koniecznosci modyfikacji schematu bazy.

### Pola modelu

| Pole | Typ | Opis |
|------|-----|------|
| `fromEntityType` | EntityType | Typ encji zrodlowej |
| `fromEntityId` | String | ID encji zrodlowej |
| `toEntityType` | EntityType | Typ encji docelowej |
| `toEntityId` | String | ID encji docelowej |
| `linkType` | String | Typ powiazania (default "RELATED") |
| `strength` | Int 1-5 | Sila powiazania |
| `isBidirectional` | Boolean | Czy dwukierunkowe |
| `notes` | Text? | Notatki |
| `metadata` | Json? | Dodatkowe dane |

### Dostepne EntityType

```
CONTACT | COMPANY | DEAL | PROJECT | TASK | STREAM | MESSAGE | EVENT
```

### Typy powiazan (linkType)

- `RELATED` -- ogolne powiazanie (domyslny)
- `DEPENDS_ON` -- zaleznosc
- `BLOCKS` -- blokuje
- `PARENT` / `CHILD` -- hierarchia
- `REFERENCES` -- odwolanie

### Przyklady uzycia

```
EntityLink: CONTACT(id=abc) --RELATED--> STREAM(id=xyz)
EntityLink: DEAL(id=def) --DEPENDS_ON--> PROJECT(id=ghi)
EntityLink: EVENT(id=jkl) --REFERENCES--> COMPANY(id=mno)
```

Unique constraint: `[organizationId, fromEntityType, fromEntityId, toEntityType, toEntityId, linkType]`
-- kazda para encji moze miec co najwyzej jeden link danego typu.

---

## 10. Produkty i uslugi

### 10.1 Product (produkty)

| Pole | Typ | Opis |
|------|-----|------|
| `name` | String | Nazwa (wymagane) |
| `sku` | String? | SKU (unikalny) |
| `category` | String? | Kategoria |
| `subcategory` | String? | Podkategoria |
| `price` | Float | Cena sprzedazy |
| `cost` | Float? | Koszt wlasny |
| `currency` | String | Waluta |
| `stockQuantity` | Int? | Ilosc na stanie |
| `minStockLevel` | Int? | Minimalny stan magazynowy |
| `trackInventory` | Boolean | Czy sledzic stan magazynowy |
| `unit` | String? | Jednostka miary |
| `weight` | Float? | Waga |
| `dimensions` | String? | Wymiary |
| `status` | ProductStatus | ACTIVE / INACTIVE / DISCONTINUED / OUT_OF_STOCK |
| `isActive` | Boolean | Czy aktywny |
| `isFeatured` | Boolean | Czy wyrozniany |
| `tags` | String[] | Tagi |
| `images` | String[] | URL obrazkow |

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/products` | Lista produktow (filtry, paginacja) |
| GET | `/api/v1/products/:id` | Szczegoly produktu |
| POST | `/api/v1/products` | Utworzenie produktu |
| PUT | `/api/v1/products/:id` | Aktualizacja |
| DELETE | `/api/v1/products/:id` | Usuniecie |
| POST | `/api/v1/products/:id/duplicate` | Duplikacja produktu |
| GET | `/api/v1/products/meta/categories` | Lista kategorii |

### 10.2 Service (uslugi)

| Pole | Typ | Opis |
|------|-----|------|
| `name` | String | Nazwa (wymagane) |
| `category` | String? | Kategoria |
| `price` | Float | Cena |
| `cost` | Float? | Koszt |
| `billingType` | ServiceBillingType | Typ rozliczen |
| `duration` | Int? | Czas trwania (minuty) |
| `deliveryMethod` | ServiceDeliveryMethod | Metoda dostarczenia |
| `estimatedDeliveryDays` | Int? | Szacowane dni dostarczenia |
| `status` | ServiceStatus | AVAILABLE / UNAVAILABLE / TEMPORARILY_UNAVAILABLE / DISCONTINUED |
| `requirements` | String? | Wymagania |
| `resources` | String? | Zasoby |

**ServiceBillingType:** ONE_TIME, HOURLY, DAILY, WEEKLY, MONTHLY, YEARLY, PROJECT_BASED.

**ServiceDeliveryMethod:** REMOTE, ON_SITE, HYBRID, DIGITAL_DELIVERY, PHYSICAL_DELIVERY.

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/services` | Lista uslug (filtry, paginacja) |
| GET | `/api/v1/services/:id` | Szczegoly uslugi |
| POST | `/api/v1/services` | Utworzenie uslugi |
| PUT | `/api/v1/services/:id` | Aktualizacja |
| DELETE | `/api/v1/services/:id` | Usuniecie |
| GET | `/api/v1/services/meta/categories` | Lista kategorii |
| GET | `/api/v1/services/meta/billing-types` | Typy rozliczen |
| GET | `/api/v1/services/meta/delivery-methods` | Metody dostarczenia |

### 10.3 ClientProduct (historia zakupow klienta)

Lacznik miedzy Company a Product/Service -- reprezentuje zrealizowana
dostawe lub usluge.

| Pole | Typ | Opis |
|------|-----|------|
| `companyId` | String | FK do Company |
| `productId` | String? | FK do Product |
| `serviceId` | String? | FK do Service |
| `customName` | String? | Nazwa (jesli brak produktu/uslugi) |
| `deliveredAt` | DateTime | Data dostarczenia |
| `value` | Float | Wartosc |
| `rating` | Int? | Ocena 1-5 |
| `feedback` | String? | Opinia klienta |
| `dealId` | String? | FK do Deal (z ktorej transakcji) |
| `projectId` | String? | FK do Project |
| `invoiceId` | String? | Nr faktury |

### 10.4 ClientProductStats (statystyki zakupowe)

Jedna per firma. Agregacja danych z `ClientProduct`.

| Pole | Typ | Opis |
|------|-----|------|
| `companyId` | String | FK do Company (unique) |
| `totalValue` | Float | Laczna wartosc zakupow |
| `orderCount` | Int | Liczba zamowien |
| `averageValue` | Float | Srednia wartosc zamowienia |
| `averageRating` | Float? | Srednia ocena |
| `yearOverYearGrowth` | Float? | Wzrost rok do roku |
| `topProducts` | Json? | Najpopularniejsze produkty |
| `seasonality` | Json? | Sezonowosc zakupow |

---

## 11. Dokumenty finansowe

### 11.1 Offer (oferty)

| Pole | Typ | Opis |
|------|-----|------|
| `offerNumber` | String | Numer oferty (unique) |
| `title` | String | Tytul |
| `status` | OfferStatus | DRAFT / SENT / ACCEPTED / REJECTED / EXPIRED / CANCELED |
| `subtotal` | Float? | Suma netto |
| `totalDiscount` | Float? | Laczny rabat |
| `totalTax` | Float? | Laczny podatek |
| `totalAmount` | Float? | Suma brutto |
| `validUntil` | DateTime? | Waznosc oferty |
| `customerName` | String | Nazwa klienta |
| `companyId` | String? | FK do Company |
| `contactId` | String? | FK do Contact |
| `dealId` | String? | FK do Deal |
| `paymentTerms` | String? | Warunki platnosci |
| `deliveryTerms` | String? | Warunki dostawy |
| `createdById` | String | FK do User |

**OfferItem** -- pozycje oferty:
`itemType` (PRODUCT/SERVICE/CUSTOM), `quantity`, `unitPrice`, `discount`,
`tax`, `totalPrice`, `productId?`, `serviceId?`, `customName?`.

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/offers` | Lista ofert (filtry, paginacja) |
| GET | `/api/v1/offers/:id` | Szczegoly oferty |
| POST | `/api/v1/offers` | Utworzenie oferty |
| PUT | `/api/v1/offers/:id` | Aktualizacja |
| PATCH | `/api/v1/offers/:id/status` | Zmiana statusu |
| DELETE | `/api/v1/offers/:id` | Usuniecie |
| GET | `/api/v1/offers/meta/stats` | Statystyki ofert |

### 11.2 Invoice (faktury)

| Pole | Typ | Opis |
|------|-----|------|
| `invoiceNumber` | String | Numer faktury (unique) |
| `title` | String | Tytul |
| `amount` | Float | Kwota glowna |
| `status` | InvoiceStatus | PENDING / SENT / PAID / OVERDUE / CANCELED |
| `dueDate` | DateTime? | Termin platnosci |
| `subtotal` | Float? | Suma netto |
| `totalDiscount` | Float? | Rabat |
| `totalTax` | Float? | Podatek |
| `totalAmount` | Float? | Suma brutto |
| `paymentDate` | DateTime? | Data platnosci |
| `paymentMethod` | String? | Metoda platnosci |
| `fakturowniaId` | Int? | ID w systemie Fakturownia |
| `fakturowniaNumber` | String? | Numer w Fakturownia |
| `autoSync` | Boolean | Czy automatycznie synchronizowac z Fakturownia |

**InvoiceItem** -- pozycje faktury:
`itemType` (PRODUCT/SERVICE/CUSTOM), `quantity`, `unitPrice`, `discount`,
`tax`, `totalPrice`, `productId?`, `serviceId?`.

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/invoices` | Lista faktur (filtry, paginacja) |
| GET | `/api/v1/invoices/:id` | Szczegoly faktury |
| POST | `/api/v1/invoices` | Utworzenie faktury |
| PUT | `/api/v1/invoices/:id` | Aktualizacja |
| DELETE | `/api/v1/invoices/:id` | Usuniecie |
| POST | `/api/v1/invoices/:id/send` | Wyslanie faktury |
| POST | `/api/v1/invoices/:id/sync` | Synchronizacja z Fakturownia |
| POST | `/api/v1/invoices/sync-all` | Synchronizacja wszystkich |
| GET | `/api/v1/invoices/sync-status` | Status synchronizacji |
| POST | `/api/v1/invoices/import-from-fakturownia` | Import z Fakturownia |

### 11.3 Order (zamowienia)

| Pole | Typ | Opis |
|------|-----|------|
| `orderNumber` | String | Numer zamowienia (unique) |
| `title` | String | Tytul |
| `customer` | String | Nazwa klienta |
| `status` | OrderStatus | PENDING / CONFIRMED / IN_PROGRESS / SHIPPED / DELIVERED / CANCELED |
| `value` | Float? | Wartosc |
| `subtotal` | Float? | Netto |
| `totalDiscount` | Float? | Rabat |
| `totalTax` | Float? | Podatek |
| `totalAmount` | Float? | Brutto |
| `deliveryDate` | DateTime? | Data dostawy |
| `deliveryAddress` | String? | Adres dostawy |
| `deliveryNotes` | String? | Uwagi do dostawy |

**OrderItem** -- pozycje zamowienia:
`itemType` (PRODUCT/SERVICE/CUSTOM), `quantity`, `unitPrice`, `discount`,
`tax`, `totalPrice`, `productId?`, `serviceId?`.

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/orders` | Lista zamowien |
| GET | `/api/v1/orders/stats` | Statystyki zamowien |
| GET | `/api/v1/orders/:id` | Szczegoly |
| POST | `/api/v1/orders` | Utworzenie |
| PUT | `/api/v1/orders/:id` | Aktualizacja |
| PATCH | `/api/v1/orders/:id/status` | Zmiana statusu |
| DELETE | `/api/v1/orders/:id` | Usuniecie |

### 11.4 Lead (leady)

Wstepne kontakty biznesowe przed konwersja do Deal/Contact.

| Pole | Typ | Opis |
|------|-----|------|
| `title` | String | Tytul leada |
| `description` | String? | Opis |
| `company` | String? | Nazwa firmy (tekst) |
| `contactPerson` | String? | Osoba kontaktowa |
| `status` | LeadStatus | NEW / CONTACTED / QUALIFIED / PROPOSAL / NEGOTIATION / WON / LOST |
| `priority` | Priority | LOW / MEDIUM / HIGH / CRITICAL |
| `source` | String? | Zrodlo leada |
| `value` | Float? | Szacunkowa wartosc |

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/api/v1/leads` | Lista leadow |
| GET | `/api/v1/leads/:id` | Szczegoly |
| POST | `/api/v1/leads` | Utworzenie |
| PUT | `/api/v1/leads/:id` | Aktualizacja |
| DELETE | `/api/v1/leads/:id` | Usuniecie |

---

## 12. Integracja z AI

### 12.1 Email Pipeline -- automatyczne tworzenie encji CRM

System Email Pipeline (konfiguracja w `pipeline_config`) przetwarza
przychodzace emaile i automatycznie:

1. **Klasyfikuje** email (AI) -- kategoria, pilnosc, sentyment
2. **Identyfikuje** nadawce -- dopasowanie do istniejacego Contact/Company
3. **Tworzy encje** jesli brak -- nowy Contact/Company (z weryfikacja HITL)
4. **Proponuje akcje** -- utworzenie Task, Deal, odpowiedz
5. **Aktualizuje scoring** -- RelationshipHealth na podstawie interakcji

```
Email --> AI Classification --> Contact/Company Matching
                                       |
                       +---------------+---------------+
                       |               |               |
                  Istniejacy      Nowy kontakt      Spam/Archive
                  kontakt         (HITL approval)
                       |               |
                       v               v
                  Update           Create Contact
                  interactionCount  + Company
                       |               |
                       +-------+-------+
                               |
                               v
                    Task/Deal Proposal (AI suggestion)
                               |
                               v
                    User Decision (HITL)
                               |
                    +----------+----------+
                    |          |          |
                  Accept    Modify     Reject
```

### 12.2 HITL (Human-In-The-Loop)

AI nigdy nie tworzy encji CRM autonomicznie. Kazda propozycja:

- **ai_suggestions** -- propozycje AI z polem `status` (PENDING/ACCEPTED/REJECTED)
- **ai_executions** -- log kazdego wywolania AI (tokeny, koszt, wynik)
- **ai_rules** -- reguly automatyzacji definiowane przez uzytkownika

Uzytkownik decyduje o zatwierdzeniu/odrzuceniu kazdej propozycji.

### 12.3 AI Enrichment kontaktow i transakcji

AI wzbogaca dane CRM:

- **ClientIntelligence** -- ekstrakcja informacji z korespondencji
  (preferencje, fakty, ostrzezenia)
- **RelationshipHealth** -- scoring na podstawie czestotliwosci,
  sentymentu i szybkosci odpowiedzi
- **DealStakeholder** -- sugestie rol stakeholderow na podstawie
  analizy korespondencji
- **Email classification** -- automatyczne tagowanie kontaktow
  (VIP, SPAM, INVOICES) na podstawie regul AI

### 12.4 Konfiguracja AI per akcja

Model `ai_action_config` mapuje typ operacji na model AI:

| actionCode | Opis |
|-----------|------|
| `FLOW_ANALYSIS` | Analiza elementow Flow/Inbox |
| `FLOW_CONVERSATION` | Konwersacja z AI o elementach |
| `EMAIL_CLASSIFICATION` | Klasyfikacja emaili |
| `EMAIL_PIPELINE` | Pelne przetwarzanie emaili |
| `AI_RULES_DEFAULT` | Domyslny model dla regul AI |
| `TASK_SUMMARY` | Podsumowanie zadan |
| `DEAL_ANALYSIS` | Analiza transakcji |

---

## 13. Integracja ze Strumieniami (GTD Streams)

### 13.1 Bezposrednie FK w modelach

Wiele modeli CRM posiada bezposrednie FK do Streams:

| Model | Pole | Opis |
|-------|------|------|
| `Task` | `streamId` | Zadanie przypisane do strumienia |
| `Project` | `streamId` | Projekt w strumieniu |
| `Meeting` | `streamId` | Spotkanie powiazane ze strumieniem |
| `Note` | `streamId` | Notatka w kontekscie strumienia |

### 13.2 EntityLink -- uniwersalne powiazania ze Streams

Poprzez `EntityLink` mozna laczyc encje CRM ze strumieniami GTD:

```
EntityLink(fromEntityType=CONTACT, fromEntityId=...,
           toEntityType=STREAM, toEntityId=...,
           linkType="RELATED")
```

### 13.3 Typowy workflow CRM <-> GTD

```
1. Email przychodzi --> AI klasyfikuje
2. Uzytkownik tworzy Deal z emaila
3. Deal trafia do strumienia PROJECTS (GTD)
4. Zadania z Deal (follow-up, oferta) --> strumien NEXT_ACTIONS
5. Oczekiwanie na odpowiedz klienta --> strumien WAITING_FOR
6. Meeting z klientem --> powiazany z Deal + Stream
7. Notatki ze spotkania --> Note(dealId=..., streamId=...)
8. Zamkniecie dealu --> automatyczny update RelationshipHealth
```

### 13.4 Konteksty CRM w GTD

Encje CRM sa widoczne w nastepujacych kontekstach GTD:

| Strumien GTD | Powiazanie CRM |
|-------------|----------------|
| INBOX | Nowe emaile od kontaktow CRM |
| NEXT_ACTIONS | Follow-upy, przygotowanie ofert |
| PROJECTS | Dlugoterminowe transakcje, onboarding |
| WAITING_FOR | Oczekiwanie na decyzje klienta |
| SOMEDAY_MAYBE | Potencjalne leady |
| REFERENCE | Dokumentacja klienta, umowy |

---

## Zalacznik: Rejestracja tras w app.ts

```
apiRouter.use('/contacts',           contactsRoutes)
apiRouter.use('/companies',          companiesRoutes)
apiRouter.use('/deals',              dealsRoutes)
apiRouter.use('/leads',              leadsRoutes)
apiRouter.use('/products',           productsRoutes)
apiRouter.use('/services',           servicesRoutes)
apiRouter.use('/offers',             offersRoutes)
apiRouter.use('/invoices',           invoicesRoutes)
apiRouter.use('/orders',             ordersRoutes)
apiRouter.use('/events',             eventsRoutes)
apiRouter.use('/pipeline',           pipelineStagesRoutes)
apiRouter.use('/pipeline-analytics', pipelineAnalyticsRoutes)
apiRouter.use('/contact-relations',  contactRelationsRoutes)
apiRouter.use('/health-score',       healthScoreRoutes)
apiRouter.use('/client-intelligence', clientIntelligenceRoutes)
apiRouter.use('/deal-stakeholders',  dealStakeholdersRoutes)
apiRouter.use('/deal-competitors',   dealCompetitorsRoutes)
apiRouter.use('/client-products',    clientProductsRoutes)
apiRouter.use('/admin/pipeline-config', pipelineConfigRoutes)
apiRouter.use('/email-pipeline',     emailPipelineRoutes)
```

Wszystkie trasy sa dostepne pod prefixem `/api/v1/` i wymagaja autoryzacji
(middleware `authenticateUser` lub `authenticateToken`).
