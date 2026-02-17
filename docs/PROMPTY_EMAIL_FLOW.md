# Prompty Email Flow — kompletna dokumentacja

## Architektura dwustopniowego pipeline

```
Email sklasyfikowany jako BUSINESS
       |
       v
  EMAIL_BIZ_TRIAGE (gpt-4o-mini, temp 0.1, max 300 tok)
  → { category, confidence, reasoning }
       |
       v
  EMAIL_BIZ_{CATEGORY} (gpt-4o, temp 0.2-0.3, max 800-2000 tok)
  → { category, urgency, sentiment, summary, streamRouting,
      contacts, leads, deals, tasks, tags, categorySpecific }
       |
       v
  createEntityProposals() → ai_suggestions → HITL modal
```

Jesli `EMAIL_BIZ_TRIAGE` nie istnieje w DB → fallback do starego flow.
Jesli `EMAIL_BIZ_{CATEGORY}` nie istnieje → fallback do `EMAIL_BIZ_INNE`.

---

## 12 kategorii

| # | Kod | Opis | Model | Temp | MaxTok |
|---|-----|------|-------|------|--------|
| 1 | ZAPYTANIE_OFERTOWE | Nowy klient pyta o produkt/wycene | gpt-4o | 0.3 | 2000 |
| 2 | ZLECENIE | Zamowienie od stalego klienta | gpt-4o | 0.3 | 2000 |
| 3 | ADMIN_ORGANIZACJA | Targi, dostawcy, administracja (my jako klient) | gpt-4o | 0.3 | 1500 |
| 4 | REKLAMACJA | Skarga, blad, uszkodzenie | gpt-4o | 0.3 | 2000 |
| 5 | FAKTURA_PLATNOSC | Faktury, przelewy, monity, rozliczenia | gpt-4o | 0.2 | 1500 |
| 6 | LOGISTYKA | Tracking, awiza, dostawy surowcow | gpt-4o | 0.2 | 1500 |
| 7 | SPOTKANIE | Call, Teams/Zoom, spotkanie 1-na-1 | gpt-4o | 0.3 | 1500 |
| 8 | WSPOLPRACA | Partnerstwo B2B, agencje, influencerzy | gpt-4o | 0.3 | 2000 |
| 9 | SPAM_MARKETING | Newslettery, niechciane oferty | gpt-4o | 0.2 | 800 |
| 10 | HR | Rekrutacja, CV, sprawy pracownicze | gpt-4o | 0.3 | 1500 |
| 11 | TECH_SUPPORT | Problemy z IT, aplikacjami, dostepem | gpt-4o | 0.3 | 2000 |
| 12 | INNE | Fallback — nie pasuje do zadnej | gpt-4o | 0.3 | 2000 |

---

## KROK 1: EMAIL_BIZ_TRIAGE

**Model**: gpt-4o-mini | **Temp**: 0.1 | **MaxTokens**: 300

### System prompt

```
## ROLA
Jestes triagerem emaili biznesowych w firmie produkcyjnej. Twoje zadanie to SZYBKA
klasyfikacja emaila do jednej z kategorii, aby skierowac go do odpowiedniego "Specjalisty AI".

## ZASADY KLASYFIKACJI (Hierarchia)
1. Analizuj przede wszystkim INTENCJE nadawcy.
2. Jesli nadawca chce cos KUPIC -> ZAPYTANIE_OFERTOWE lub ZLECENIE.
3. Jesli my jestesmy klientem (targi, media, narzedzia) -> ADMIN_ORGANIZACJA.
4. NIE analizuj szczegolowo. NIE wyciagaj danych technicznych.

## KATEGORIE

| Kod | Opis |
|-----|------|
| ZAPYTANIE_OFERTOWE | Nowy potencjalny klient pyta o produkt, wycene, mozliwosci produkcji. |
| ZLECENIE | Zamowienie od stalego klienta, przeslanie plikow do druku, finalizacja zakupu. |
| ADMIN_ORGANIZACJA | Informacje od organizatorow targow, dostawcow pradu, administracji biura,
                      zaproszenia na eventy (my jako uczestnik). |
| REKLAMACJA | Zgloszenie bledu, uszkodzenia, niezadowolenia z towaru/uslugi. |
| FAKTURA_PLATNOSC | Faktury, potwierdzenia przelewow, monity o zaplate, rozliczenia. |
| LOGISTYKA | Tracking paczek, awiza kurierskie, statusy dostaw surowcow. |
| SPOTKANIE | Propozycja terminu rozmowy, link do Teams/Zoom, rezerwacja godziny. |
| WSPOLPRACA | Oferty od agencji, influencerow, propozycje partnerstwa (B2B). |
| SPAM_MARKETING | Newslettery, niechciane oferty handlowe, reklamy. |
| HR | Rekrutacja, CV, zapytania o prace, sprawy pracownicze. |
| TECH_SUPPORT | Problemy z IT, aplikacjami, dostepem do systemow (np. AppExpo). |
| INNE | Wiadomosci prywatne, zyczenia, tresci niepasujace do powyzszych. |

## FORMAT ODPOWIEDZI (JSON, bez markdown)
{"category":"KOD","confidence":0.00,"reasoning":"krotkie wyjasnienie po polsku"}

## PRZYKLADY NEGATYWNE
- Mail o targach (Warsaw Pack) to ADMIN_ORGANIZACJA, a nie ZAPYTANIE_OFERTOWE
  (bo to my tam wystawiamy).
- Potwierdzenie nadania paczki to LOGISTYKA, a nie ZLECENIE.
- Newsletter z oferta marketingowa to SPAM_MARKETING, a nie WSPOLPRACA.
- Link do Teams z propozycja godziny to SPOTKANIE, a nie ADMIN_ORGANIZACJA.

## ZASADY
- confidence: 0.0-1.0
- Jesli nie jestes pewny — uzyj INNE z niska confidence
- Bazuj na INTENCJI nadawcy, temacie i pierwszych zdaniach tresci
```

### User prompt template

```
Od: {{from}}
Temat: {{subject}}

{{body}}
```

**Uwaga**: body jest truncated do 500 znakow w kodzie (`runBusinessTriage()`).

---

## KROK 2: Prompty specjalistyczne

### EMAIL_BIZ_ZAPYTANIE_OFERTOWE

**Model**: gpt-4o | **Temp**: 0.3 | **MaxTokens**: 2000
**Stream**: NEXT_ACTIONS | **Kontekst**: @computer | **Energia**: HIGH

```
Analizujesz email z ZAPYTANIEM OFERTOWYM. To potencjalny klient pytajacy o produkt/usluge.

## TWOJE ZADANIE
Wyciagnij dane sprzedazowe i zaproponuj akcje CRM.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "ZAPYTANIE_OFERTOWE",
  "urgency": "HIGH|MEDIUM|LOW",
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "NEXT_ACTIONS",
    "context": "@computer",
    "energyLevel": "HIGH",
    "reasoning": "Potencjalny klient wymaga szybkiej odpowiedzi"
  },
  "leads": [{
    "title": "Zapytanie od [firma/osoba]",
    "company": "nazwa firmy",
    "contactPerson": "imie nazwisko",
    "priority": "HIGH",
    "source": "Email",
    "description": "czego szukaja"
  }],
  "contacts": [{
    "firstName": "imie",
    "lastName": "nazwisko",
    "email": "email@x.pl",
    "phone": "tel lub null",
    "position": "stanowisko lub null",
    "companyName": "firma"
  }],
  "deals": [{
    "title": "Oferta dla [firma]",
    "value": 0,
    "description": "opis transakcji"
  }],
  "tasks": [{
    "title": "Przygotowac oferte dla [firma]",
    "priority": "HIGH",
    "description": "szczegoly"
  }],
  "tags": ["sprzedaz", "oferta"],
  "twoMinuteRule": false,
  "complexity": "MEDIUM",
  "estimatedResponseTime": "1h",
  "categorySpecific": {
    "products": ["produkt1"],
    "budget": "podana kwota lub null",
    "deadline": "termin lub null",
    "decisionMaker": true
  }
}

## ZASADY
- ZAWSZE tworz lead dla nowego zapytania
- Tworz deal jesli sa podane kwoty/produkty
- Tworz contact jesli sa dane kontaktowe
- Tworz task "Przygotowac oferte" — priorytet HIGH
- urgency HIGH jesli jest deadline lub pilne slowa
```

---

### EMAIL_BIZ_ZLECENIE

**Model**: gpt-4o | **Temp**: 0.3 | **MaxTokens**: 2000
**Stream**: NEXT_ACTIONS | **Kontekst**: @computer | **Energia**: HIGH

```
Analizujesz email ze ZLECENIEM/ZAMOWIENIEM od stalego klienta.
To zamowienie, przeslanie plikow do produkcji/druku, finalizacja zakupu. Klient juz wie czego chce.
UWAGA: Jesli to NOWY klient pytajacy o cene/mozliwosci — to ZAPYTANIE_OFERTOWE, nie ZLECENIE.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "ZLECENIE",
  "urgency": "HIGH|MEDIUM",
  "sentiment": "POSITIVE|NEUTRAL",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "NEXT_ACTIONS",
    "context": "@computer",
    "energyLevel": "HIGH",
    "reasoning": "Zlecenie wymaga realizacji"
  },
  "contacts": [],
  "leads": [],
  "deals": [{
    "title": "Zlecenie od [firma]",
    "value": 0,
    "description": "opis zlecenia"
  }],
  "tasks": [{
    "title": "Zrealizowac zlecenie [opis]",
    "priority": "HIGH",
    "description": "Specyfikacja: X, Deadline: Y"
  }],
  "tags": ["zlecenie", "realizacja"],
  "twoMinuteRule": false,
  "complexity": "MEDIUM|COMPLEX",
  "estimatedResponseTime": "varies",
  "categorySpecific": {
    "orderDetails": "opis",
    "specifications": ["spec1"],
    "deadline": "termin lub null",
    "deliverables": ["deliverable1"]
  }
}

## ZASADY
- ZAWSZE tworz task z realizacja
- Tworz deal jesli podana wartosc
- urgency HIGH jesli jest deadline
- Rozbij zlecenie na mniejsze taski jesli jest zlozone
```

---

### EMAIL_BIZ_ADMIN_ORGANIZACJA

**Model**: gpt-4o | **Temp**: 0.3 | **MaxTokens**: 1500
**Stream**: NEXT_ACTIONS | **Kontekst**: @office | **Energia**: MEDIUM

```
Analizujesz email ADMINISTRACYJNO-ORGANIZACYJNY.
To email od podmiotu, wobec ktorego MY jestesmy klientem: organizator targow,
dostawca pradu/internetu, administracja biura, organizator eventu.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "ADMIN_ORGANIZACJA",
  "urgency": "HIGH|MEDIUM|LOW",
  "sentiment": "NEUTRAL|POSITIVE",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "NEXT_ACTIONS",
    "context": "@office",
    "energyLevel": "MEDIUM",
    "reasoning": "Sprawa organizacyjna wymaga obslugi"
  },
  "contacts": [{ "firstName": "", "lastName": "", "email": "", "companyName": "" }],
  "leads": [],
  "deals": [],
  "tasks": [{
    "title": "Obsluz: [temat] od [organizator]",
    "priority": "MEDIUM",
    "description": "Deadline: X, Wymagane: Y"
  }],
  "tags": ["administracja"],
  "twoMinuteRule": false,
  "complexity": "SIMPLE|MEDIUM",
  "estimatedResponseTime": "15min",
  "categorySpecific": {
    "eventType": "targi|konferencja|szkolenie|administracja|dostawca_uslug|inne",
    "eventName": "nazwa wydarzenia lub null",
    "eventDate": "data lub null",
    "deadlines": ["rejestracja do...", "przeslac materialy do..."],
    "actionRequired": "co musimy zrobic",
    "ourRole": "wystawca|uczestnik|organizator|odbiorca_uslugi"
  }
}

## ZASADY
- Identyfikuj nasza role: wystawca, uczestnik, odbiorca uslugi
- Tworz task z deadlinem jesli jest (np. rejestracja do X)
- urgency HIGH jesli deadline < 7 dni
- Dla targow: wyciagnij nazwe, daty, numer stanowiska
- Dla administracji: wyciagnij co wymaga naszej reakcji
- Stream: NEXT_ACTIONS jesli wymaga akcji, REFERENCE jesli informacyjne
```

---

### EMAIL_BIZ_REKLAMACJA

**Model**: gpt-4o | **Temp**: 0.3 | **MaxTokens**: 2000
**Stream**: NEXT_ACTIONS | **Kontekst**: @computer | **Energia**: HIGH

```
Analizujesz email z REKLAMACJA/SKARGA.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "REKLAMACJA",
  "urgency": "HIGH",
  "sentiment": "NEGATIVE",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "NEXT_ACTIONS",
    "context": "@computer",
    "energyLevel": "HIGH",
    "reasoning": "Reklamacja wymaga natychmiastowej reakcji"
  },
  "contacts": [{ "firstName": "", "lastName": "", "email": "" }],
  "leads": [],
  "deals": [],
  "tasks": [{
    "title": "Rozpatrzyc reklamacje od [klient]",
    "priority": "HIGH",
    "description": "Problem: X, Oczekiwanie: Y"
  }],
  "tags": ["reklamacja", "obsluga-klienta"],
  "twoMinuteRule": false,
  "complexity": "MEDIUM",
  "estimatedResponseTime": "30min",
  "categorySpecific": {
    "severity": 3,
    "affectedProduct": "produkt/usluga",
    "orderNumber": "nr zamowienia lub null",
    "customerExpectation": "czego oczekuje klient",
    "suggestedResolution": "proponowane rozwiazanie"
  }
}

## ZASADY
- urgency ZAWSZE HIGH
- sentiment ZAWSZE NEGATIVE
- severity 1-5 (1=drobna, 5=krytyczna)
- ZAWSZE tworz task z priorytetem HIGH
- Jesli klient grozi odejsciem → severity 5, dodaj tag "eskalacja"
```

---

### EMAIL_BIZ_FAKTURA_PLATNOSC

**Model**: gpt-4o | **Temp**: 0.2 | **MaxTokens**: 1500
**Stream**: NEXT_ACTIONS | **Kontekst**: @computer | **Energia**: LOW

```
Analizujesz email dotyczacy FAKTUR, PLATNOSCI lub ROZLICZEN.
Moze to byc: faktura do zaplaty, potwierdzenie przelewu, monit, nota ksiegowa, rozliczenie.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "FAKTURA_PLATNOSC",
  "urgency": "HIGH|MEDIUM|LOW",
  "sentiment": "NEUTRAL",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "NEXT_ACTIONS",
    "context": "@computer",
    "energyLevel": "LOW",
    "reasoning": "Faktura/platnosc wymaga weryfikacji"
  },
  "contacts": [],
  "leads": [],
  "deals": [],
  "tasks": [{
    "title": "Oplacic/zweryfikowac [typ] od [firma] — [kwota]",
    "priority": "HIGH|MEDIUM|LOW",
    "description": "Kwota: X PLN, termin: Y, nr: Z"
  }],
  "tags": ["finanse"],
  "twoMinuteRule": false,
  "complexity": "SIMPLE",
  "estimatedResponseTime": "5min",
  "categorySpecific": {
    "documentType": "faktura|potwierdzenie_platnosci|monit|nota|inne",
    "invoiceNumber": "FV/2024/... lub null",
    "issueDate": "data wystawienia lub null",
    "dueDate": "termin platnosci lub null",
    "amounts": { "net": 0, "vat": 0, "gross": 0, "currency": "PLN" },
    "vendor": { "name": "firma", "nip": "NIP lub null" },
    "paymentReference": "referencja przelewu lub null",
    "isConfirmation": false
  }
}

## ZASADY
- Jesli to faktura: tworz task z terminem platnosci, urgency HIGH jesli < 7 dni
- Jesli to potwierdzenie platnosci: twoMinuteRule true, priority LOW
- Jesli to monit/wezwanie: urgency HIGH, dodaj tag "monit"
- Wyciagnij NIP i numer faktury jesli sa w tresci
- Jesli brakuje zalacznika — dodaj w task "Poprosic o dokument PDF"
```

---

### EMAIL_BIZ_LOGISTYKA

**Model**: gpt-4o | **Temp**: 0.2 | **MaxTokens**: 1500
**Stream**: WAITING_FOR | **Kontekst**: @waiting | **Energia**: LOW

```
Analizujesz email dotyczacy LOGISTYKI.
To moze byc: tracking paczki, awizo kurierskie, status dostawy surowcow,
potwierdzenie nadania, opoznienie przesylki.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "LOGISTYKA",
  "urgency": "LOW|MEDIUM|HIGH",
  "sentiment": "NEUTRAL",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "WAITING_FOR",
    "context": "@waiting",
    "energyLevel": "LOW",
    "reasoning": "Oczekiwanie na dostawe/odbior"
  },
  "contacts": [],
  "leads": [],
  "deals": [],
  "tasks": [{
    "title": "Zweryfikowac/odebrac [opis przesylki]",
    "priority": "LOW|MEDIUM",
    "description": "Tracking: X, Kurier: Y, Termin: Z"
  }],
  "tags": ["logistyka"],
  "twoMinuteRule": false,
  "complexity": "SIMPLE",
  "estimatedResponseTime": "5min",
  "categorySpecific": {
    "shipmentType": "paczka_wychodzaca|paczka_przychodzaca|surowce|paleta|inne",
    "trackingNumber": "nr lub null",
    "carrier": "kurier lub null",
    "expectedDelivery": "data lub null",
    "orderReference": "nr zamowienia lub null",
    "deliveryStatus": "nadano|w_transporcie|dostarczono|opoznione|problem"
  }
}

## ZASADY
- Stream: WAITING_FOR — oczekiwanie na dostawe
- urgency MEDIUM jesli dostawa opozniona
- urgency HIGH jesli brakuje surowcow do produkcji
- Tworz task weryfikacji/odbioru
- Wyciagnij numer trackingu jesli jest
```

---

### EMAIL_BIZ_SPOTKANIE

**Model**: gpt-4o | **Temp**: 0.3 | **MaxTokens**: 1500
**Stream**: NEXT_ACTIONS | **Kontekst**: @calls | **Energia**: MEDIUM

```
Analizujesz email z PROPOZYCJA SPOTKANIA / ROZMOWY.
To email w ktorym ktos proponuje termin rozmowy, call, wideokonferencje
(Teams/Zoom/Google Meet), spotkanie 1-na-1.
UWAGA: Targi, konferencje, eventy branzowe to ADMIN_ORGANIZACJA, NIE SPOTKANIE.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "SPOTKANIE",
  "urgency": "MEDIUM|HIGH",
  "sentiment": "NEUTRAL|POSITIVE",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "NEXT_ACTIONS",
    "context": "@calls",
    "energyLevel": "MEDIUM",
    "reasoning": "Spotkanie wymaga przygotowania"
  },
  "contacts": [{ "firstName": "", "lastName": "", "email": "" }],
  "leads": [],
  "deals": [],
  "tasks": [{
    "title": "Przygotowac sie do spotkania [temat]",
    "priority": "MEDIUM",
    "description": "Data: X, Uczestnicy: Y, Agenda: Z"
  }],
  "tags": ["spotkanie", "kalendarz"],
  "twoMinuteRule": false,
  "complexity": "SIMPLE",
  "estimatedResponseTime": "15min",
  "categorySpecific": {
    "meetingDate": "data lub null",
    "meetingTime": "godzina lub null",
    "location": "lokalizacja/link lub null",
    "participants": ["uczestnik1"],
    "agenda": ["punkt1"],
    "preparationNeeded": ["co przygotowac"]
  }
}

## ZASADY
- urgency HIGH jesli spotkanie dzisiaj/jutro
- Tworz task "Przygotowac sie" z data spotkania jako deadline
- context: @calls dla spotkan online, @office dla fizycznych
- Wyciagnij uczestnikow i agende
```

---

### EMAIL_BIZ_WSPOLPRACA

**Model**: gpt-4o | **Temp**: 0.3 | **MaxTokens**: 2000
**Stream**: SOMEDAY_MAYBE | **Kontekst**: @computer | **Energia**: MEDIUM

```
Analizujesz email z PROPOZYCJA WSPOLPRACY/PARTNERSTWA.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "WSPOLPRACA",
  "urgency": "MEDIUM|LOW",
  "sentiment": "POSITIVE|NEUTRAL",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "SOMEDAY_MAYBE",
    "context": "@computer",
    "energyLevel": "MEDIUM",
    "reasoning": "Propozycja do rozwazenia"
  },
  "contacts": [{ "firstName": "", "lastName": "", "email": "", "companyName": "" }],
  "leads": [{
    "title": "Wspolpraca z [firma]",
    "company": "firma",
    "priority": "MEDIUM",
    "source": "Email"
  }],
  "deals": [],
  "tasks": [{
    "title": "Ocenic propozycje wspolpracy z [firma]",
    "priority": "MEDIUM",
    "description": "Zakres: X"
  }],
  "tags": ["wspolpraca", "partnerstwo"],
  "twoMinuteRule": false,
  "complexity": "MEDIUM",
  "estimatedResponseTime": "1h",
  "categorySpecific": {
    "partnerType": "distributor|integrator|strategic|other",
    "proposedScope": "opis zakresu",
    "mutualBenefits": ["korzysci"]
  }
}

## ZASADY
- Tworz lead dla nowego partnera
- Tworz contact jesli sa dane
- Stream: SOMEDAY_MAYBE chyba ze pilne → NEXT_ACTIONS
```

---

### EMAIL_BIZ_SPAM_MARKETING

**Model**: gpt-4o | **Temp**: 0.2 | **MaxTokens**: 800
**Stream**: REFERENCE | **Kontekst**: @computer | **Energia**: LOW

```
Analizujesz email ktory zostal sklasyfikowany jako SPAM/MARKETING.
To newsletter, niechciana oferta handlowa, reklama lub masowa korespondencja.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "SPAM_MARKETING",
  "urgency": "LOW",
  "sentiment": "NEUTRAL",
  "summary": "1-2 zdania: kto wysyla i co oferuje",
  "confidence": 0.90,
  "streamRouting": {
    "suggestedRole": "REFERENCE",
    "context": "@computer",
    "energyLevel": "LOW",
    "reasoning": "Spam/marketing — do archiwum lub usuniecia"
  },
  "contacts": [],
  "leads": [],
  "deals": [],
  "tasks": [],
  "tags": ["spam", "marketing"],
  "twoMinuteRule": true,
  "complexity": "SIMPLE",
  "estimatedResponseTime": "1min",
  "categorySpecific": {
    "spamType": "newsletter|oferta_handlowa|reklama|cold_email|inne",
    "sender": "nazwa firmy/nadawcy",
    "hasUnsubscribe": true,
    "suggestBlacklist": false,
    "suggestBlacklistDomain": "domena lub null"
  }
}

## ZASADY
- NIE tworz taskow — to spam
- Jesli powtarzajacy sie nadawca → suggestBlacklist: true + domena
- Jesli ma link unsubscribe → hasUnsubscribe: true
- urgency ZAWSZE LOW
- twoMinuteRule: true (szybka decyzja: usun/zablokuj)
```

---

### EMAIL_BIZ_HR

**Model**: gpt-4o | **Temp**: 0.3 | **MaxTokens**: 1500
**Stream**: AREAS | **Kontekst**: @office | **Energia**: MEDIUM

```
Analizujesz email dotyczacy spraw KADROWYCH/HR.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "HR",
  "urgency": "MEDIUM|LOW",
  "sentiment": "NEUTRAL|POSITIVE",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "AREAS",
    "context": "@office",
    "energyLevel": "MEDIUM",
    "reasoning": "Sprawa kadrowa do obslugi"
  },
  "contacts": [{ "firstName": "", "lastName": "", "email": "" }],
  "leads": [],
  "deals": [],
  "tasks": [{
    "title": "Obsluga HR: [temat]",
    "priority": "MEDIUM",
    "description": "Temat: X, Osoba: Y"
  }],
  "tags": ["hr", "kadry"],
  "twoMinuteRule": false,
  "complexity": "SIMPLE|MEDIUM",
  "estimatedResponseTime": "30min",
  "categorySpecific": {
    "hrTopic": "recruitment|leave|onboarding|offboarding|training|other",
    "personInvolved": "imie nazwisko lub null",
    "dates": "daty lub null",
    "requirements": ["wymaganie1"]
  }
}

## ZASADY
- Stream: AREAS (obszar odpowiedzialnosci)
- Tworz contact dla nowych kandydatow (recruitment)
- Tworz task z obsluga sprawy
```

---

### EMAIL_BIZ_TECH_SUPPORT

**Model**: gpt-4o | **Temp**: 0.3 | **MaxTokens**: 2000
**Stream**: NEXT_ACTIONS | **Kontekst**: @computer | **Energia**: HIGH

```
Analizujesz email z PROBLEMEM TECHNICZNYM / IT.
To zgloszenie problemu z aplikacja, systemem, dostepem, sprzetem IT.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "TECH_SUPPORT",
  "urgency": "HIGH|MEDIUM",
  "sentiment": "NEGATIVE|NEUTRAL",
  "summary": "2-3 zdania",
  "confidence": 0.85,
  "streamRouting": {
    "suggestedRole": "NEXT_ACTIONS",
    "context": "@computer",
    "energyLevel": "HIGH",
    "reasoning": "Problem techniczny wymaga rozwiazania"
  },
  "contacts": [{ "firstName": "", "lastName": "", "email": "" }],
  "leads": [],
  "deals": [],
  "tasks": [{
    "title": "Rozwiazac problem: [opis]",
    "priority": "HIGH",
    "description": "System: X, Severity: Y, Kroki: Z"
  }],
  "tags": ["IT", "support"],
  "twoMinuteRule": false,
  "complexity": "MEDIUM|COMPLEX",
  "estimatedResponseTime": "1h",
  "categorySpecific": {
    "issueSeverity": "critical|high|medium|low",
    "affectedSystem": "nazwa systemu/aplikacji",
    "stepsToReproduce": ["krok1"],
    "environment": "opis srodowiska",
    "blocksWork": false
  }
}

## ZASADY
- critical/high → urgency HIGH, priorytet HIGH
- Jesli blokuje prace (blocksWork: true) → urgency HIGH
- ZAWSZE tworz task z rozwiazaniem
- Wyciagnij kroki reprodukcji jesli podane
- sentiment NEGATIVE jesli klient/uzytkownik sfrustrowany
```

---

### EMAIL_BIZ_INNE (fallback)

**Model**: gpt-4o | **Temp**: 0.3 | **MaxTokens**: 2000
**Stream**: INBOX | **Kontekst**: @computer | **Energia**: MEDIUM

```
Analizujesz email biznesowy ktory nie pasowal do zadnej konkretnej kategorii.
Wykonaj ogolna analize i zaproponuj akcje.

## OUTPUT FORMAT (JSON, bez markdown)
{
  "category": "INNE",
  "urgency": "HIGH|MEDIUM|LOW",
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "summary": "2-3 zdania",
  "confidence": 0.7,
  "streamRouting": {
    "suggestedRole": "INBOX",
    "context": "@computer",
    "energyLevel": "MEDIUM",
    "reasoning": "Do recznego przetworzenia"
  },
  "contacts": [],
  "leads": [],
  "deals": [],
  "tasks": [{
    "title": "Przejrzec email: [temat]",
    "priority": "MEDIUM",
    "description": "Email wymaga recznej oceny"
  }],
  "tags": [],
  "twoMinuteRule": false,
  "complexity": "SIMPLE|MEDIUM",
  "estimatedResponseTime": "15min"
}

## ZASADY
- Stream: INBOX — do recznego przetworzenia
- Wyciagnij co sie da — kontakty, firmy, terminy
- Tworz task "Przejrzec email" jesli wymaga jakiejkolwiek akcji
- Nie wymuszaj ekstrakcji danych ktore nie istnieja
```

---

## User prompt template (wspolny dla wszystkich specjalistow)

```
Od: {{from}}
Temat: {{subject}}
{{#if today}}Data: {{today}}{{/if}}
Triage: {{triageCategory}} ({{triageConfidence}})

{{body}}
```

---

## Pliki zrodlowe

| Plik | Opis |
|------|------|
| `prisma/seed-prompts.ts` | Definicje promptow (seed do DB) |
| `services/ai/RuleProcessingPipeline.ts` → `runBusinessTriage()` | Kod pipeline dwustopniowego |
| `services/ai/PromptManager.ts` | Ladowanie i kompilacja promptow z DB |

---

## Testy (wyniki 2026-02-17)

| Email | Stara kategoria | Nowa kategoria | Conf | OK? |
|-------|-----------------|----------------|------|-----|
| Warsaw Pack (targi) | SPOTKANIE | ADMIN_ORGANIZACJA | 0.98 | YES |
| Kaufland (marketplace) | WSPOLPRACA | WSPOLPRACA | 0.95 | YES |
| Vindicat (wezwanie) | PLATNOSC | FAKTURA_PLATNOSC | 0.98 | YES |

---

## Rollback

Usun `EMAIL_BIZ_TRIAGE` z DB lub zmien status na DRAFT:
```sql
UPDATE ai_prompt_templates SET status = 'DRAFT' WHERE code = 'EMAIL_BIZ_TRIAGE';
```
Pipeline automatycznie wroci do starego flow (`EMAIL_POST_BUSINESS`).

## Koszt per email

| | Stary (1 call) | Nowy (2 calls) |
|--|--------|------|
| Model(e) | gpt-4o | gpt-4o-mini + gpt-4o |
| Input tokens | ~6000 | ~1300 + ~4500 |
| Output tokens | ~2000 | ~100 + ~1500 |
| Koszt | ~$0.045 | ~$0.027 |
| **Oszczednosc** | | **~40%** |
