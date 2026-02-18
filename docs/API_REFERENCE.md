# API Reference - Sorto CRM

> Kompletna dokumentacja endpointow REST API systemu Sorto CRM.
> Wersja API: v1 | Prefix bazowy: `/api/v1`
> Ostatnia aktualizacja: 2026-02-17

---

## Spis tresci

1. [Informacje ogolne](#1-informacje-ogolne)
2. [Autentykacja (Auth)](#2-autentykacja-auth)
3. [Kontakty (Contacts)](#3-kontakty-contacts)
4. [Firmy (Companies)](#4-firmy-companies)
5. [Szanse sprzedazowe (Deals)](#5-szanse-sprzedazowe-deals)
6. [Strumienie (Streams)](#6-strumienie-streams)
7. [Zarzadzanie strumieniami (Stream Management)](#7-zarzadzanie-strumieniami-stream-management)
8. [Zadania (Tasks)](#8-zadania-tasks)
9. [Projekty (Projects)](#9-projekty-projects)
10. [Skrzynka odbiorcza / Source (Inbox)](#10-skrzynka-odbiorcza--source-inbox)
11. [Konta email (Email Accounts)](#11-konta-email-email-accounts)
12. [Pipeline emailowy (Email Pipeline)](#12-pipeline-emailowy-email-pipeline)
13. [Komunikacja (Communication)](#13-komunikacja-communication)
14. [Reguly AI (AI Rules)](#14-reguly-ai-ai-rules)
15. [Konfiguracja AI (AI Config)](#15-konfiguracja-ai-ai-config)
16. [Sugestie AI (AI Suggestions)](#16-sugestie-ai-ai-suggestions)
17. [Baza wiedzy (Knowledge)](#17-baza-wiedzy-knowledge)
18. [Synteza mowy (Voice TTS)](#18-synteza-mowy-voice-tts)
19. [Wyszukiwanie RAG](#19-wyszukiwanie-rag)
20. [Smart Day Planner](#20-smart-day-planner)
21. [Cele precyzyjne RZUT (Precise Goals)](#21-cele-precyzyjne-rzut-precise-goals)
22. [Wydarzenia (Events)](#22-wydarzenia-events)
23. [Flow Engine](#23-flow-engine)
24. [Flow Conversation](#24-flow-conversation)
25. [Zunifikowane reguly (Unified Rules)](#25-zunifikowane-reguly-unified-rules)
26. [Leady (Leads)](#26-leady-leads)
27. [Wyszukiwanie uniwersalne (Search)](#27-wyszukiwanie-uniwersalne-search)
28. [Kody bledow](#28-kody-bledow)
29. [Paginacja](#29-paginacja)
30. [Filtrowanie i sortowanie](#30-filtrowanie-i-sortowanie)
31. [Naglowki zapytan](#31-naglowki-zapytan)

---

## 1. Informacje ogolne

### Bazowy URL

```
https://crm.dev.sorto.ai/crm/api/v1
```

### Autentykacja

Wszystkie endpointy (poza publicznymi) wymagaja tokena JWT przeslanego w naglowku:

```
Authorization: Bearer <token>
```

Token uzyskuje sie przez endpoint `POST /api/v1/auth/login`.

### Format odpowiedzi

Wiekszosci endpointow zwraca JSON w formacie:

```json
{
  "success": true,
  "data": { ... },
  "message": "Opcjonalny komunikat"
}
```

Bledy:

```json
{
  "success": false,
  "error": "Opis bledu"
}
```

### Multi-tenancy

Kazde zapytanie jest automatycznie filtrowane po `organizationId` uzytkownika. Nie trzeba przesylac tego parametru recznie.

### Role uzytkownikow

| Rola | Opis |
|------|------|
| `OWNER` | Wlasciciel organizacji, pelne uprawnienia |
| `ADMIN` | Administrator, zarzadzanie uzytkownikami i konfiguracjami |
| `MANAGER` | Manager, zarzadzanie zespolem |
| `MEMBER` | Czlonek organizacji, podstawowe uprawnienia |

---

## 2. Autentykacja (Auth)

**Sciezka bazowa:** `/api/v1/auth`
**Autoryzacja:** Endpointy publiczne + chronione (opisane w tabeli)

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/register` | Rejestracja nowego uzytkownika | Nie |
| POST | `/login` | Logowanie (zwraca JWT) | Nie |
| POST | `/refresh` | Odswiezenie tokena JWT | Nie |
| POST | `/accept-invitation` | Akceptacja zaproszenia do organizacji | Nie |
| POST | `/verify-email` | Weryfikacja adresu email | Nie |
| POST | `/password-reset/request` | Zadanie resetu hasla | Nie |
| POST | `/password-reset/confirm` | Potwierdzenie resetu hasla | Nie |
| GET | `/me` | Dane zalogowanego uzytkownika | Tak |
| POST | `/logout` | Wylogowanie | Tak |
| POST | `/change-password` | Zmiana hasla | Tak |
| POST | `/resend-verification` | Ponowne wyslanie weryfikacji email | Tak |
| POST | `/invite` | Zaproszenie uzytkownika do organizacji | Tak (ADMIN/OWNER) |
| GET | `/sso` | Endpointy SSO | Nie |
| POST | `/sso/callback` | Callback SSO | Nie |

### Kluczowe parametry

**POST /login:**

```json
{
  "email": "user@example.com",
  "password": "haslo123"
}
```

**Odpowiedz:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUz...",
  "refreshToken": "abc123...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "role": "OWNER",
    "organizationId": "uuid"
  }
}
```

**POST /invite** (wymaga roli ADMIN lub OWNER):

```json
{
  "email": "nowy@firma.pl",
  "role": "MEMBER",
  "firstName": "Anna",
  "lastName": "Nowak"
}
```

---

## 3. Kontakty (Contacts)

**Sciezka bazowa:** `/api/v1/contacts`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista kontaktow z paginacja i wyszukiwaniem | Tak |
| GET | `/:id` | Pojedynczy kontakt | Tak |
| POST | `/` | Utworzenie nowego kontaktu | Tak |
| PUT | `/:id` | Aktualizacja kontaktu | Tak |
| DELETE | `/:id` | Usuniecie kontaktu | Tak |

### Parametry zapytania (GET /)

| Parametr | Typ | Opis |
|----------|-----|------|
| `page` | number | Numer strony (domyslnie: 1) |
| `limit` | number | Liczba wynikow na strone (domyslnie: 20) |
| `search` | string | Wyszukiwanie po imieniu, nazwisku, emailu |
| `sortBy` | string | Pole sortowania (domyslnie: createdAt) |
| `sortOrder` | string | `asc` lub `desc` |

### Przykladowe zapytanie tworzenia

```json
POST /api/v1/contacts
{
  "firstName": "Anna",
  "lastName": "Kowalska",
  "email": "anna@firma.pl",
  "phone": "+48 600 123 456",
  "position": "Dyrektor handlowy",
  "department": "Sprzedaz",
  "companyId": "uuid-firmy",
  "notes": "Poznani na targach",
  "tags": ["VIP", "partner"],
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/anna-kowalska"
  }
}
```

> Kontakty sa automatycznie indeksowane w systemie RAG po utworzeniu/aktualizacji.

---

## 4. Firmy (Companies)

**Sciezka bazowa:** `/api/v1/companies`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista firm z filtrami | Tak |
| GET | `/lookup-nip/:nip` | Wyszukanie firmy po NIP (API Min. Finansow) | Tak |
| GET | `/:id` | Firma z kontaktami i szansami sprzedazowymi | Tak |
| POST | `/` | Utworzenie firmy | Tak |
| PUT | `/:id` | Aktualizacja firmy | Tak |
| DELETE | `/:id` | Usuniecie firmy | Tak |
| POST | `/:id/merge` | Scalenie dwoch firm | Tak |

### Parametry zapytania (GET /)

| Parametr | Typ | Opis |
|----------|-----|------|
| `page` | number | Numer strony |
| `limit` | number | Liczba wynikow |
| `search` | string | Wyszukiwanie po nazwie |
| `status` | string | Filtrowanie po statusie |
| `industry` | string | Filtrowanie po branzy |
| `size` | string | Filtrowanie po wielkosci |
| `sortBy` | string | Pole sortowania |
| `sortOrder` | string | `asc` / `desc` |

### Przykladowe zapytanie tworzenia

```json
POST /api/v1/companies
{
  "name": "TechStartup Innovations",
  "description": "Firma zajmujaca sie innowacjami",
  "website": "https://techstartup.pl",
  "industry": "IT",
  "size": "MEDIUM",
  "status": "ACTIVE",
  "address": "ul. Technologiczna 1, Warszawa",
  "phone": "+48 22 123 45 67",
  "email": "kontakt@techstartup.pl",
  "nip": "1234567890",
  "regon": "123456789",
  "krs": "0000123456",
  "vatActive": true,
  "tags": ["IT", "startup"]
}
```

### Scalanie firm

```json
POST /api/v1/companies/:id/merge
{
  "sourceCompanyId": "uuid-firmy-zrodlowej",
  "keepFields": ["phone", "email"]
}
```

---

## 5. Szanse sprzedazowe (Deals)

**Sciezka bazowa:** `/api/v1/deals`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista szans sprzedazowych z filtrami | Tak |
| GET | `/pipeline` | Podsumowanie pipeline (grupowanie po etapie) | Tak |
| GET | `/:id` | Pojedyncza szansa sprzedazowa | Tak |
| POST | `/` | Utworzenie szansy | Tak |
| PUT | `/:id` | Aktualizacja szansy | Tak |
| DELETE | `/:id` | Usuniecie szansy | Tak |

### Etapy pipeline (stage)

| Etap | Opis |
|------|------|
| `PROSPECT` | Prospekt - wstepny kontakt |
| `QUALIFIED` | Kwalifikowany - potwierdzone zainteresowanie |
| `PROPOSAL` | Oferta - wyslana propozycja |
| `NEGOTIATION` | Negocjacja - ustalanie warunkow |
| `CLOSED_WON` | Zamknieta wygrana |
| `CLOSED_LOST` | Zamknieta przegrana |

### Parametry zapytania (GET /)

| Parametr | Typ | Opis |
|----------|-----|------|
| `page` | number | Numer strony |
| `limit` | number | Liczba wynikow |
| `search` | string | Wyszukiwanie po tytule |
| `stage` | string | Filtrowanie po etapie |
| `companyId` | string | Filtrowanie po firmie |
| `ownerId` | string | Filtrowanie po wlascicielu |

### Przykladowe zapytanie tworzenia

```json
POST /api/v1/deals
{
  "title": "Wdrozenie CRM dla ABC Corp",
  "companyId": "uuid-firmy",
  "value": 50000,
  "currency": "PLN",
  "probability": 75,
  "stage": "PROPOSAL",
  "ownerId": "uuid-uzytkownika",
  "expectedCloseDate": "2026-04-15",
  "notes": "Spotkanie zaplanowane na przyszly tydzien",
  "tags": ["enterprise", "Q2-2026"]
}
```

> Przy zmianie etapu na `CLOSED_WON` lub `CLOSED_LOST` automatycznie ustawiany jest `actualCloseDate`.

---

## 6. Strumienie (Streams)

**Sciezka bazowa:** `/api/v1/streams`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista strumieni z filtrami | Tak |
| POST | `/` | Utworzenie strumienia | Tak |
| POST | `/ai/suggest` | Sugestia AI strumienia na podstawie tekstu | Tak |
| GET | `/stats` | Statystyki strumieni | Tak |
| GET | `/frozen` | Zamrozone/zarchiwizowane strumienie | Tak |
| GET | `/:id` | Strumien z zadaniami | Tak |
| PUT | `/:id` | Aktualizacja strumienia | Tak |
| DELETE | `/:id` | Usuniecie strumienia (blokuje gdy ma zadania/projekty) | Tak |
| POST | `/:id/archive` | Archiwizacja/przywrocenie strumienia | Tak |
| POST | `/:id/duplicate` | Duplikacja strumienia | Tak |
| GET | `/inbox` | Elementy inbox | Tak |
| GET | `/inbox/stats` | Statystyki inbox | Tak |
| POST | `/inbox` | Szybkie przechwycenie elementu do inbox | Tak |
| POST | `/inbox/:id/process` | Przetworzenie elementu inbox | Tak |
| POST | `/inbox/:id/quick-action` | Szybka akcja (QUICK_DO, QUICK_DEFER, QUICK_DELETE) | Tak |
| GET | `/contexts` | Dostepne konteksty strumieni | Tak |

### Przykladowe zapytanie tworzenia strumienia

```json
POST /api/v1/streams
{
  "name": "Rozwoj produktu",
  "description": "Wszystko zwiazane z rozwojem naszego produktu",
  "color": "#3B82F6",
  "icon": "code",
  "status": "ACTIVE"
}
```

---

## 7. Zarzadzanie strumieniami (Stream Management)

**Sciezka bazowa:** `/api/v1/stream-management`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy - Zarzadzanie

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista zarzadzanych strumieni | Tak |
| POST | `/` | Utworzenie zarzadzanego strumienia | Tak |
| GET | `/by-role/:role` | Strumienie wedlug roli strumienia | Tak |
| PUT | `/:id/role` | Przypisanie roli strumienia | Tak |
| POST | `/:id/migrate` | Migracja do systemu strumieni | Tak |
| POST | `/:id/freeze` | Zamrozenie strumienia | Tak |
| POST | `/:id/unfreeze` | Odmrozenie strumienia | Tak |

### Endpointy - Konfiguracja strumienia

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/:id/config` | Pobranie konfiguracji strumienia | Tak |
| PUT | `/:id/config` | Aktualizacja konfiguracji strumienia | Tak |
| POST | `/:id/config/reset` | Reset konfiguracji do domyslnych | Tak |

### Endpointy - Hierarchia

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/:id/tree` | Drzewo hierarchii strumienia | Tak |
| GET | `/:id/ancestors` | Przodkowie strumienia | Tak |
| GET | `/:id/path` | Sciezka breadcrumb | Tak |
| POST | `/:id/validate-hierarchy` | Walidacja hierarchii | Tak |

### Endpointy - Routing zasobow

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/route/task` | Automatyczne kierowanie zadania | Tak |
| POST | `/route/email` | Automatyczne kierowanie emaila | Tak |
| POST | `/route/bulk` | Masowe kierowanie zasobow | Tak |
| POST | `/route/content` | Kierowanie na podstawie tresci | Tak |
| POST | `/analyze` | Analiza AI tresci pod katem strumieni | Tak |

### Endpointy - Statystyki

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/stats` | Statystyki strumieni | Tak |
| GET | `/hierarchy-stats` | Statystyki hierarchii | Tak |
| GET | `/routing-stats` | Statystyki routingu | Tak |

### Endpointy - Reguly przetwarzania

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/:id/rules` | Utworzenie reguly przetwarzania | Tak |
| GET | `/:id/rules` | Lista regul strumienia | Tak |
| POST | `/rules/execute` | Wykonanie regul | Tak |

### Endpointy - Indeksowanie wektorowe

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/index-vectors` | Indeksowanie wektorow | Tak |
| GET | `/vector-status` | Status indeksowania | Tak |

### Role strumienia (streamRole)

| Rola | Opis |
|------|------|
| `INBOX` | Punkt zbierania wszystkich elementow |
| `NEXT_ACTIONS` | Konkretne zadania do wykonania |
| `WAITING_FOR` | Oczekiwanie na innych |
| `SOMEDAY_MAYBE` | Przyszle mozliwosci |
| `PROJECTS` | Projekty wieloetapowe |
| `CONTEXTS` | Konteksty wykonania (@computer, @calls itd.) |
| `AREAS` | Obszary odpowiedzialnosci |
| `REFERENCE` | Materialy referencyjne |

### Przyklad tworzenia strumienia

```json
POST /api/v1/stream-management
{
  "name": "Nastepne akcje",
  "streamRole": "NEXT_ACTIONS",
  "streamType": "WORKSPACE",
  "color": "#EF4444",
  "description": "Zadania do wykonania teraz"
}
```

---

## 8. Zadania (Tasks)

**Sciezka bazowa:** `/api/v1/tasks`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista zadan z wieloma filtrami | Tak |
| GET | `/:id` | Zadanie z relacjami | Tak |
| POST | `/` | Utworzenie zadania | Tak |
| PUT | `/:id` | Aktualizacja zadania | Tak |
| DELETE | `/:id` | Usuniecie zadania | Tak |
| GET | `/contexts/list` | Dostepne konteksty | Tak |

### Parametry zapytania (GET /)

| Parametr | Typ | Opis |
|----------|-----|------|
| `status` | string | Filtr statusu (NEW, IN_PROGRESS, COMPLETED, CANCELLED) |
| `priority` | string | Filtr priorytetu (LOW, MEDIUM, HIGH, URGENT) |
| `contextId` | string | Filtr kontekstu strumienia |
| `projectId` | string | Filtr projektu |
| `streamId` | string | Filtr strumienia |
| `assignedToId` | string | Filtr przypisanego uzytkownika |
| `dueDate` | string | Filtr terminu |
| `parentTaskId` | string | Filtr podzadan |
| `contactId` | string | Filtr powiazanego kontaktu |
| `dealId` | string | Filtr powiazanej szansy |
| `eventId` | string | Filtr powiazanego wydarzenia |
| `milestoneId` | string | Filtr kamienia milowego |
| `page` | number | Numer strony |
| `limit` | number | Liczba wynikow |
| `search` | string | Wyszukiwanie tekstowe |

### Przykladowe zapytanie tworzenia

```json
POST /api/v1/tasks
{
  "title": "Przygotowac prezentacje",
  "description": "Prezentacja wynikow Q1",
  "priority": "HIGH",
  "status": "NEW",
  "streamId": "uuid-strumienia",
  "projectId": "uuid-projektu",
  "contextId": "uuid-kontekstu",
  "assignedToId": "uuid-uzytkownika",
  "dueDate": "2026-03-01T09:00:00Z",
  "estimatedHours": 4,
  "parentTaskId": "uuid-zadania-nadrzednego"
}
```

> Przy zmianie statusu na `COMPLETED` automatycznie ustawiany jest `completedAt`.

---

## 9. Projekty (Projects)

**Sciezka bazowa:** `/api/v1/projects`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista projektow z filtrami | Tak |
| GET | `/:id` | Projekt z zadaniami i statystykami postepu | Tak |
| POST | `/` | Utworzenie projektu | Tak |
| PUT | `/:id` | Aktualizacja projektu | Tak |
| DELETE | `/:id` | Usuniecie projektu (blokuje gdy ma zadania) | Tak |

### Parametry zapytania (GET /)

| Parametr | Typ | Opis |
|----------|-----|------|
| `status` | string | PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED |
| `priority` | string | LOW, MEDIUM, HIGH, URGENT |
| `streamId` | string | Filtr strumienia |
| `assignedToId` | string | Filtr przypisanego |
| `contactId` | string | Filtr kontaktu |
| `dealId` | string | Filtr szansy |
| `eventId` | string | Filtr wydarzenia |
| `page` | number | Numer strony |
| `limit` | number | Liczba wynikow |
| `search` | string | Wyszukiwanie tekstowe |

### Odpowiedz GET /:id

Zawiera dodatkowe dane:
- `tasks` - lista zadan w projekcie
- `_count.tasks` - liczba zadan
- Obliczony `progress` (% ukonczone z ogolu zadan)

---

## 10. Skrzynka odbiorcza / Source (Inbox)

**Sciezka bazowa:** `/api/v1/source`
**Autoryzacja:** Wiekszosci endpointow wymaga JWT (2 publiczne)

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/test-public` | Publiczny test endpoint | Nie |
| GET | `/stats-public` | Publiczne statystyki | Nie |
| GET | `/` | Lista elementow inbox z wieloma filtrami | Tak |
| GET | `/stats` | Statystyki inbox | Tak |
| POST | `/` | Utworzenie elementu inbox | Tak |
| POST | `/quick-capture` | Szybkie przechwycenie z kontekstem biznesowym | Tak |
| POST | `/:id/process` | Pelne przetworzenie elementu | Tak |
| POST | `/:id/quick-action` | Szybka akcja | Tak |
| POST | `/bulk-process` | Masowe przetwarzanie | Tak |
| DELETE | `/clear-processed` | Czyszczenie starych przetworzonych elementow | Tak |
| GET | `/context/contacts` | Pomocnik wyboru kontaktow | Tak |
| GET | `/context/companies` | Pomocnik wyboru firm | Tak |
| GET | `/context/projects` | Pomocnik wyboru projektow | Tak |
| GET | `/context/tasks` | Pomocnik wyboru zadan | Tak |
| GET | `/context/streams` | Pomocnik wyboru strumieni | Tak |
| POST | `/:id/analyze-for-planning` | Analiza AI pod katem planowania | Tak |
| POST | `/:id/plan-as-time-block` | Konwersja do bloku czasowego Smart Day Planner | Tak |

### Parametry zapytania (GET /)

| Parametr | Typ | Opis |
|----------|-----|------|
| `processed` | boolean | Filtr przetworzenia |
| `source` | string | Filtr zrodla |
| `context` | string | Filtr kontekstu |
| `contactId` | string | Filtr kontaktu |
| `companyId` | string | Filtr firmy |
| `projectId` | string | Filtr projektu |
| `search` | string | Wyszukiwanie |
| `dateFrom` | string | Data od |
| `dateTo` | string | Data do |
| `urgencyLevel` | string | Poziom pilnosci |
| `sortBy` | string | Pole sortowania |
| `limit` | number | Limit wynikow |
| `offset` | number | Offset |

### Decyzje przetwarzania (POST /:id/process)

| Decyzja | Opis |
|---------|------|
| `DO` | Zrob natychmiast (< 2 min) |
| `DEFER` | Zaplanuj na pozniej |
| `DELEGATE` | Deleguj do kogos |
| `PROJECT` | Utworz projekt wieloetapowy |
| `SOMEDAY` | Moze kiedys |
| `REFERENCE` | Material referencyjny |
| `DELETE` | Usun |

### Szybkie akcje (POST /:id/quick-action)

| Akcja | Opis |
|-------|------|
| `QUICK_DO` | Natychmiastowe zadanie |
| `QUICK_DEFER` | Zaplanuj na jutro |
| `QUICK_DELETE` | Usun |
| `QUICK_DELEGATE` | Deleguj |

### Szybkie przechwycenie

```json
POST /api/v1/source/quick-capture
{
  "content": "Zadzwonic do klienta ABC w sprawie oferty",
  "source": "PHONE_CALL",
  "contactId": "uuid-kontaktu",
  "companyId": "uuid-firmy",
  "metadata": {
    "urgencyLevel": "HIGH"
  }
}
```

---

## 11. Konta email (Email Accounts)

**Sciezka bazowa:** `/api/v1/email-accounts`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista kont email | Tak |
| GET | `/providers` | Dostepni dostawcy (Gmail, Outlook, Yahoo, Exchange, Custom) | Tak |
| GET | `/:id` | Szczegoly konta | Tak |
| POST | `/` | Utworzenie konta email (IMAP/SMTP) | Tak |
| PUT | `/:id` | Aktualizacja konta | Tak |
| DELETE | `/:id` | Usuniecie konta | Tak |
| POST | `/test-connection` | Test polaczenia IMAP/SMTP | Tak |
| POST | `/:id/sync` | Reczna synchronizacja konkretnego konta | Tak |
| POST | `/sync-all` | Synchronizacja wszystkich aktywnych kont | Tak |

### Przykladowe zapytanie tworzenia

```json
POST /api/v1/email-accounts
{
  "email": "biuro@firma.pl",
  "name": "Konto biurowe",
  "provider": "Custom",
  "imapHost": "imap.firma.pl",
  "imapPort": 993,
  "imapSecurity": "SSL",
  "smtpHost": "smtp.firma.pl",
  "smtpPort": 465,
  "smtpSecurity": "SSL",
  "username": "biuro@firma.pl",
  "password": "haslo"
}
```

---

## 12. Pipeline emailowy (Email Pipeline)

**Sciezka bazowa:** `/api/v1/email-pipeline`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/stats` | Statystyki pipeline (parametr `days`) | Tak |
| GET | `/rules` | Lista regul pipeline | Tak |
| POST | `/rules` | Utworzenie reguly pipeline | Tak |
| PUT | `/rules/:id` | Aktualizacja reguly | Tak |
| DELETE | `/rules/:id` | Usuniecie reguly | Tak |
| POST | `/test` | Test pipeline na przykladowym emailu | Tak |
| POST | `/seed-defaults` | Utworzenie domyslnych regul | Tak |
| GET | `/messages` | Lista wiadomosci do przetworzenia | Tak |
| POST | `/process-batch` | Przetworzenie wybranych wiadomosci | Tak |
| POST | `/process-all` | Przetworzenie wszystkich nieprzetworzonych | Tak |
| POST | `/reprocess` | Ponowne przetworzenie (po zmianach regul) | Tak |
| POST | `/analyze/:messageId` | Reczna analiza pojedynczej wiadomosci | Tak |

### Etapy pipeline

| Etap | Opis |
|------|------|
| `PRE_FILTER` | Wstepne filtrowanie (spam, blacklist) |
| `CLASSIFY` | Klasyfikacja (VIP, faktura, newsletter) |
| `AI_ANALYSIS` | Analiza AI (ekstrakcja entytow, sentyment) |

---

## 13. Komunikacja (Communication)

**Sciezka bazowa:** `/api/v1/communication`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy - Kanaly

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/channels` | Lista kanalow komunikacji | Tak |
| POST | `/channels` | Utworzenie kanalu | Tak |
| PUT | `/channels/:id` | Aktualizacja kanalu | Tak |
| DELETE | `/channels/:id` | Usuniecie kanalu | Tak |
| POST | `/channels/test-email` | Test polaczenia email | Tak |
| POST | `/channels/test-slack` | Test polaczenia Slack | Tak |
| POST | `/channels/:id/sync-slack` | Synchronizacja Slack | Tak |
| POST | `/channels/:id/sync-email` | Synchronizacja email | Tak |
| POST | `/channels/:id/sync` | Synchronizacja ogolna | Tak |
| GET | `/channels/:id/slack-channels` | Lista kanalow Slack | Tak |

### Endpointy - Wiadomosci

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/messages` | Lista wiadomosci | Tak |
| GET | `/messages/:id` | Pojedyncza wiadomosc | Tak |
| PUT | `/messages/:id/read` | Oznaczenie jako przeczytana | Tak |
| POST | `/messages/send` | Wyslanie emaila | Tak |
| POST | `/messages/:id/reprocess` | Ponowne przetworzenie wiadomosci | Tak |
| POST | `/messages/:id/analyze` | Analiza AI wiadomosci | Tak |

### Endpointy - Reguly przetwarzania

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/processing-rules` | Lista regul | Tak |
| POST | `/processing-rules` | Utworzenie reguly | Tak |
| PUT | `/processing-rules/:id` | Aktualizacja reguly | Tak |
| DELETE | `/processing-rules/:id` | Usuniecie reguly | Tak |

### Endpointy - Inne

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/stream-channels` | Polaczenie strumienia z kanalem | Tak |
| GET | `/statistics` | Statystyki komunikacji | Tak |

---

## 14. Reguly AI (AI Rules)

**Sciezka bazowa:** `/api/v1/ai-rules`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista regul AI (filtry: category, status, dataType) | Tak |
| GET | `/:id` | Szczegoly reguly | Tak |
| POST | `/` | Utworzenie reguly AI | Tak |
| POST | `/seed-flow-rules` | Zaladowanie domyslnych regul Flow | Tak (OWNER/ADMIN) |
| POST | `/seed-triage` | Zaladowanie regul triazu emaili | Tak (OWNER/ADMIN) |
| PUT | `/:id` | Aktualizacja reguly | Tak |
| DELETE | `/:id` | Usuniecie reguly (nie mozna usunac systemowych) | Tak |
| POST | `/:id/toggle` | Wlaczenie/wylaczenie reguly | Tak |
| PATCH | `/:id/status` | Zmiana statusu (ACTIVE/INACTIVE/TESTING) | Tak |
| POST | `/:id/test` | Testowanie reguly na przykladowych danych | Tak |
| GET | `/fields/:module` | Dostepne pola warunki dla modulu | Tak |
| GET | `/execution-history/:id` | Historia wykonan reguly | Tak |

### Kategorie regul

- `CLASSIFICATION` - klasyfikacja tresci
- `ROUTING` - kierowanie do strumieni
- `EXTRACTION` - ekstrakcja danych
- `NOTIFICATION` - powiadomienia
- `AUTOMATION` - automatyzacja procesow

### Przyklad tworzenia reguly

```json
POST /api/v1/ai-rules
{
  "name": "Auto-priorytet pilnych emaili",
  "category": "CLASSIFICATION",
  "dataType": "EMAIL",
  "conditions": {
    "field": "subject",
    "operator": "contains",
    "value": "PILNE"
  },
  "actions": {
    "setPriority": "HIGH",
    "createTask": true,
    "notify": true
  },
  "aiPrompt": "Przeanalizuj email i okresl priorytet",
  "status": "ACTIVE"
}
```

---

## 15. Konfiguracja AI (AI Config)

**Sciezka bazowa:** `/api/v1/admin/ai-config`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy - Modele AI

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/models` | Lista modeli AI | Tak |
| GET | `/models/:modelId` | Szczegoly modelu | Tak |
| POST | `/models` | Dodanie modelu AI | Tak |
| PUT | `/models/:modelId` | Aktualizacja modelu | Tak |
| DELETE | `/models/:modelId` | Usuniecie modelu | Tak |
| POST | `/test/:modelId` | Test modelu AI | Tak |

### Endpointy - Dostawcy AI

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/providers` | Lista dostawcow AI | Tak |
| GET | `/providers/:providerId` | Szczegoly dostawcy | Tak |
| POST | `/providers` | Dodanie dostawcy AI | Tak |
| PUT | `/providers/:providerId` | Aktualizacja dostawcy | Tak |
| DELETE | `/providers/:providerId` | Usuniecie dostawcy | Tak |
| POST | `/providers/:providerId/test` | Test polaczenia z dostawca | Tak |
| GET | `/providers/:providerId/config` | Konfiguracja dostawcy | Tak |
| PUT | `/providers/:providerId/config` | Aktualizacja konfiguracji dostawcy | Tak |

### Endpointy - Uzycie

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/usage` | Statystyki uzycia AI | Tak |

### Przyklad dodania dostawcy

```json
POST /api/v1/admin/ai-config/providers
{
  "name": "OpenAI",
  "type": "openai",
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "isActive": true
}
```

---

## 16. Sugestie AI (AI Suggestions)

**Sciezka bazowa:** `/api/v1/ai-suggestions`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

System HITL (Human-in-the-Loop) - sugestie AI wymagajace akceptacji uzytkownika.

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista sugestii (filtry: status, type, messageId, limit) | Tak |
| POST | `/:id/accept` | Akceptacja sugestii | Tak |
| POST | `/:id/reject` | Odrzucenie sugestii z feedbackiem korekcyjnym | Tak |
| PUT | `/:id` | Edycja oczekujacej sugestii | Tak |
| POST | `/bulk-action` | Masowa akceptacja/odrzucenie | Tak |

### Typy sugestii (obslugiwane przez accept)

| Typ | Opis |
|-----|------|
| `CREATE_TASK` | Utworzenie zadania |
| `CREATE_DEAL` | Utworzenie szansy sprzedazowej |
| `CREATE_COMPANY` | Utworzenie firmy |
| `CREATE_CONTACT` | Utworzenie kontaktu |
| `CREATE_LEAD` | Utworzenie leada |
| `UPDATE_CONTACT` | Aktualizacja kontaktu |
| `BLACKLIST_DOMAIN` | Zablokowanie domeny |
| `ROUTE_TO_STREAM` | Skierowanie do strumienia |
| `CREATE_GOAL_RZUT` | Utworzenie celu RZUT |
| `SEND_NOTIFICATION` | Wyslanie powiadomienia |

---

## 17. Baza wiedzy (Knowledge)

**Sciezka bazowa:** `/api/v1/knowledge`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/documents` | Lista dokumentow | Tak |
| GET | `/documents/:id` | Pojedynczy dokument | Tak |
| POST | `/documents` | Utworzenie dokumentu | Tak |
| PUT | `/documents/:id` | Aktualizacja dokumentu | Tak |
| POST | `/documents/:id/comments` | Dodanie komentarza | Tak |
| POST | `/documents/:id/share` | Udostepnienie dokumentu | Tak |
| GET | `/folders` | Lista folderow | Tak |
| GET | `/wiki` | Lista stron wiki | Tak |
| GET | `/wiki/:slug` | Strona wiki po slug | Tak |
| GET | `/search` | Wyszukiwanie pelnotekstowe w dokumentach i wiki | Tak |

### Typy dokumentow

`NOTE`, `ARTICLE`, `GUIDE`, `TUTORIAL`, `REFERENCE`, `FAQ`, `POLICY`, `PROCESS`, `TEMPLATE`, `REPORT`

### Przyklad tworzenia dokumentu

```json
POST /api/v1/knowledge/documents
{
  "title": "Procedura onboardingu",
  "summary": "Krok po kroku jak wdrozyc nowego klienta",
  "content": "# Onboarding\n\n1. Spotkanie wstepne...",
  "type": "PROCESS",
  "status": "PUBLISHED",
  "folderId": "uuid-folderu",
  "tags": ["onboarding", "klient"]
}
```

---

## 18. Synteza mowy (Voice TTS)

**Sciezka bazowa:** `/api/v1/voice`
**Autoryzacja:** Wiekszosc endpointow wymaga JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/health` | Health check | Nie |
| POST | `/test-synthesis-public` | Publiczny test TTS | Nie |
| GET | `/models` | Dostepne modele TTS | Tak |
| POST | `/synthesize` | Synteza mowy (zwraca audio/wav) | Tak |
| POST | `/synthesize-clone` | Klonowanie glosu (tymczasowo niedostepne - 503) | Tak |
| POST | `/synthesize-stream` | Strumieniowa synteza TTS | Tak |

### Przyklad syntezy

```json
POST /api/v1/voice/synthesize
{
  "text": "Witaj w systemie CRM Sorto",
  "language": "pl",
  "speed": 0.9,
  "pitch": 1.0
}
```

**Odpowiedz:** Plik audio WAV (22050Hz, 16-bit, Mono)

---

## 19. Wyszukiwanie RAG

**Sciezka bazowa:** `/api/v1/rag`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/sources` | Lista zrodel RAG | Tak |
| POST | `/sources` | Utworzenie zrodla RAG | Tak |
| GET | `/sources/:id` | Szczegoly zrodla | Tak |
| DELETE | `/sources/:id` | Usuniecie zrodla | Tak |
| PATCH | `/sources/:id` | Aktualizacja zrodla | Tak |
| POST | `/sources/upload` | Upload pliku jako zrodlo RAG (multer) | Tak |
| POST | `/query` | Zapytanie RAG w jezyku naturalnym | Tak |
| POST | `/search` | Wyszukiwanie semantyczne | Tak |
| GET | `/status` | Status systemu RAG | Tak |

### Zapytanie RAG

```json
POST /api/v1/rag/query
{
  "question": "Jakie mamy otwarte szanse sprzedazowe z branzy IT?",
  "sourceType": "deals",
  "limit": 10,
  "threshold": 0.7
}
```

### Odpowiedz

```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "content": "Tresc dopasowanego dokumentu...",
      "metadata": { "type": "deal", "entityId": "uuid" },
      "relevanceScore": 0.92
    }
  ],
  "totalResults": 3,
  "searchTime": 45
}
```

---

## 20. Smart Day Planner

**Sciezka bazowa:** `/api/v1/day-planner`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

System inteligentnego planowania dnia z energia, przerwami i kontekstami.

### Endpointy - Bloki czasowe

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/time-blocks` | Lista blokow czasowych | Tak |
| POST | `/time-blocks` | Utworzenie bloku czasowego (501 - w trakcie wdrazania) | Tak |
| PUT | `/time-blocks/:id` | Aktualizacja bloku czasowego (501) | Tak |

### Endpointy - Planowanie zadan

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/schedule-tasks` | Automatyczne przydzielanie zadan do blokow | Tak |
| POST | `/scheduled-tasks` | Utworzenie zaplanowanego zadania (wydarzenia) | Tak |

### Endpointy - Harmonogramy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/daily-schedule/:date` | Harmonogram na dany dzien | Tak |
| GET | `/weekly-schedule/:date` | Harmonogram na tydzien | Tak |
| GET | `/monthly-schedule/:year/:month` | Harmonogram na miesiac | Tak |

### Endpointy - Tryby koncentracji (Focus Modes)

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/focus-modes` | Lista trybow koncentracji | Tak |
| POST | `/focus-modes` | Utworzenie trybu koncentracji | Tak |
| PUT | `/focus-modes/:id` | Aktualizacja trybu | Tak |

### Przyklad planowania zadan

```json
POST /api/v1/day-planner/schedule-tasks
{
  "date": "2026-02-18",
  "forceReschedule": false
}
```

### Odpowiedz

```json
{
  "success": true,
  "data": {
    "scheduledTasks": [...],
    "unscheduledTasks": [],
    "statistics": {
      "totalTasks": 5,
      "scheduledCount": 5,
      "unscheduledCount": 0,
      "schedulingRate": 1,
      "blocksUsed": 0,
      "totalBlocks": 0
    }
  }
}
```

### Przyklad tworzenia trybu koncentracji

```json
POST /api/v1/day-planner/focus-modes
{
  "name": "Deep Work",
  "duration": 90,
  "energyLevel": "HIGH",
  "contextName": "@computer",
  "category": "CREATIVE",
  "priority": "HIGH",
  "tags": ["programowanie", "analiza"]
}
```

---

## 21. Cele precyzyjne RZUT (Precise Goals)

**Sciezka bazowa:** `/api/v1/precise-goals` (takze `/api/v1/goals`)
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

System celow precyzyjnych oparty na metodologii RZUT:
- **R** - Rezultat (wynik do osiagniecia)
- **Z** - Zmierzalnosc (jak mierzyc postep)
- **U** - Ujscie (kanaly realizacji)
- **T** - Tlo (kontekst i przyczyna)

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista celow precyzyjnych (filtry: status, streamId) | Tak |
| GET | `/stats` | Statystyki celow (total, active, achieved, failed, paused) | Tak |
| GET | `/stats/overview` | Szczegolowe statystyki celow z approaching | Tak |
| GET | `/:id` | Pojedynczy cel | Tak |
| POST | `/` | Utworzenie celu RZUT | Tak |
| PUT | `/:id` | Aktualizacja celu | Tak |
| PATCH | `/:id/progress` | Aktualizacja postepu celu | Tak |
| PUT | `/:id/progress` | Aktualizacja postepu (alternatywny) | Tak |
| DELETE | `/:id` | Usuniecie celu | Tak |
| POST | `/:id/achieve` | Oznaczenie celu jako osiagnietego | Tak |

### Statusy celow

`active`, `achieved`, `failed`, `paused`

### Przyklad tworzenia celu RZUT

```json
POST /api/v1/precise-goals
{
  "result": "Pozyskac 50 nowych klientow",
  "measurement": "Liczba podpisanych umow",
  "outlet": "Kampanie email + cold calling",
  "deadline": "2026-06-30",
  "background": "Cel kwartalny Q2 2026",
  "targetValue": 50,
  "unit": "klientow",
  "streamId": "uuid-strumienia-sprzedazy"
}
```

### Aktualizacja postepu

```json
PATCH /api/v1/precise-goals/:id/progress
{
  "currentValue": 23
}
```

> Cel jest automatycznie oznaczany jako `achieved` gdy `currentValue >= targetValue`.

---

## 22. Wydarzenia (Events)

**Sciezka bazowa:** `/api/v1/events`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy - Glowne

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista wydarzen (filtry: status, eventType, upcoming, page, limit) | Tak |
| GET | `/:id` | Wydarzenie ze szczegolami (firmy, kontakty, zespol) | Tak |
| POST | `/` | Utworzenie wydarzenia | Tak |
| PATCH | `/:id` | Aktualizacja wydarzenia | Tak |
| DELETE | `/:id` | Usuniecie wydarzenia | Tak |

### Endpointy - Firmy na wydarzeniu

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/:id/companies` | Lista firm na wydarzeniu | Tak |
| POST | `/:id/companies` | Dodanie firmy do wydarzenia | Tak |
| DELETE | `/:id/companies/:companyId` | Usuniecie firmy z wydarzenia | Tak |

### Endpointy - Zespol

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/:id/team` | Lista czlonkow zespolu | Tak |
| POST | `/:id/team` | Dodanie czlonka zespolu | Tak |
| DELETE | `/:id/team/:userId` | Usuniecie czlonka zespolu | Tak |

### Endpointy - Wydatki

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/:id/expenses` | Lista wydatkow wydarzenia | Tak |
| POST | `/:id/expenses` | Dodanie wydatku | Tak |
| DELETE | `/:id/expenses/:expenseId` | Usuniecie wydatku | Tak |

### Przyklad tworzenia wydarzenia

```json
POST /api/v1/events
{
  "name": "Targi ITM Poznan 2026",
  "description": "Coroczne targi IT w Poznaniu",
  "eventType": "TRADE_SHOW",
  "venue": "Miedzynarodowe Targi Poznanskie",
  "city": "Poznan",
  "country": "Poland",
  "address": "ul. Glogowska 14",
  "startDate": "2026-06-01",
  "endDate": "2026-06-04",
  "setupDate": "2026-05-31",
  "teardownDate": "2026-06-05",
  "status": "PLANNING",
  "budgetPlanned": 50000,
  "currency": "EUR",
  "goals": "Pozyskanie 30 nowych leadow"
}
```

### Dodanie firmy do wydarzenia

```json
POST /api/v1/events/:id/companies
{
  "companyId": "uuid-firmy",
  "role": "CLIENT",
  "boothNumber": "A12",
  "boothSize": "9m2",
  "status": "CONFIRMED",
  "dealValue": 15000,
  "notes": "Zainteresowani wersja Enterprise"
}
```

---

## 23. Flow Engine

**Sciezka bazowa:** `/api/v1/flow`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

Silnik przetwarzania elementow z AI - automatyczne kierowanie, sugestie akcji i uczenie sie z decyzji uzytkownika.

### Endpointy - Przetwarzanie

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/process/:id` | Przetworzenie pojedynczego elementu | Tak |
| POST | `/process-batch` | Przetworzenie wielu elementow (max 50) | Tak |
| POST | `/confirm/:id` | Potwierdzenie/nadpisanie sugestii AI | Tak |
| POST | `/batch` | Masowe przetwarzanie z akcjami | Tak |
| POST | `/feedback` | Zapis feedbacku AI (uczenie maszynowe) | Tak |

### Endpointy - Sugestie AI

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/suggest/:id` | Pelna sugestia AI dla elementu (master.md spec) | Tak |
| POST | `/suggest/batch` | Sugestie AI dla wielu elementow (max 20) | Tak |

### Endpointy - Odczyt

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/pending` | Elementy oczekujace na przetworzenie | Tak |
| GET | `/awaiting` | Elementy oczekujace na decyzje uzytkownika | Tak |
| GET | `/history` | Historia przetwarzania (parametr `days`) | Tak |

### Endpointy - Wzorce i reguly

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/patterns` | Nauczone wzorce | Tak |
| DELETE | `/patterns/:id` | Dezaktywacja wzorca | Tak |
| GET | `/rules` | Reguly automatyzacji | Tak |
| POST | `/rules` | Utworzenie reguly | Tak |
| PUT | `/rules/:id` | Aktualizacja reguly | Tak |
| DELETE | `/rules/:id` | Usuniecie reguly | Tak |

### Endpointy - Kontekst

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/streams` | Dostepne strumienie dla Flow | Tak |
| GET | `/actions` | Dostepne akcje Flow z opisami | Tak |
| GET | `/stats` | Statystyki przetwarzania | Tak |

### Endpointy - Ustawienia i Autopilot

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/settings` | Ustawienia auto-analizy | Tak |
| PUT | `/settings` | Aktualizacja ustawien auto-analizy | Tak |
| GET | `/autopilot/history` | Historia autopilota | Tak |
| POST | `/autopilot/undo/:historyId` | Cofniecie akcji autopilota | Tak |

### Akcje Flow (STREAMS methodology)

| Akcja | Opis |
|-------|------|
| `ZROB_TERAZ` | Proste zadanie < 2 min, szybka reakcja |
| `ZAPLANUJ` | Konkretne zadanie z deadline, wymaga terminu |
| `PROJEKT` | Zlozone przedsiewziecie, wymaga wielu krokow |
| `KIEDYS_MOZE` | Pomysl na przyszlosc, nie pilne |
| `REFERENCJA` | Informacja do zachowania, bez akcji |
| `USUN` | Spam, nieistotne - do usuniecia |

### Przyklad potwierdzenia sugestii

```json
POST /api/v1/flow/confirm/:id
{
  "action": "ZAPLANUJ",
  "streamId": "uuid-strumienia",
  "reason": "Wymaga analizy przed spotkaniem"
}
```

### Przyklad sugestii AI (GET /suggest/:id)

```json
{
  "success": true,
  "data": {
    "suggestedAction": "ZAPLANUJ",
    "suggestedStreamId": "uuid-strumienia",
    "suggestedStreamName": "Rozwoj produktu",
    "suggestedProjectId": null,
    "confidence": 85,
    "reasoning": "Element dotyczy rozwoju funkcjonalnosci...",
    "thinking": { "category": "TASK", "urgency": "MEDIUM" },
    "assistantMessage": "Sugeruje zaplanowac to zadanie...",
    "entities": {
      "sender": { "matchedContactId": "uuid", "name": "Jan" },
      "companies": [],
      "dates": [{ "date": "2026-03-01", "context": "deadline" }]
    },
    "extractedTasks": [
      { "title": "Przygotowac specyfikacje", "priority": "HIGH", "dueDate": "2026-02-25" }
    ],
    "alternatives": [
      { "action": "PROJEKT", "streamId": "uuid", "streamName": "IT", "confidence": 60 }
    ]
  }
}
```

---

## 24. Flow Conversation

**Sciezka bazowa:** `/api/v1/flow/conversation`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

Dialogowy tryb przetwarzania elementow - AI asystent prowadzi konwersacje z uzytkownikiem.

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista konwersacji (filtr: status) | Tak |
| GET | `/:id` | Szczegoly konwersacji z wiadomosciami | Tak |
| POST | `/start/:itemId` | Rozpoczecie nowej konwersacji z AI dla elementu | Tak |
| POST | `/:id/message` | Wyslanie wiadomosci w konwersacji | Tak |
| PUT | `/:id/modify` | Modyfikacja propozycji (akcja, strumien, priorytet) | Tak |
| POST | `/:id/execute` | Wykonanie zatwierdzonych akcji + uczenie maszynowe | Tak |

### Przebieg konwersacji

1. **Start** (`POST /start/:itemId`) - AI analizuje element i proponuje akcje
2. **Dialog** (`POST /:id/message`) - uzytkownik doprecyzowuje, AI dostosowuje propozycje
3. **Modyfikacja** (`PUT /:id/modify`) - uzytkownik zmienia akcje/strumien/priorytet
4. **Wykonanie** (`POST /:id/execute`) - zatwierdzenie i wykonanie akcji

### Dodatkowe opcje modyfikacji (PUT /:id/modify)

| Pole | Typ | Opis |
|------|-----|------|
| `action` | string | Zmiana akcji (ZROB_TERAZ, ZAPLANUJ, PROJEKT...) |
| `streamId` | string | Zmiana strumienia docelowego |
| `taskTitle` | string | Zmiana tytulu zadania |
| `priority` | string | Zmiana priorytetu |
| `createNewStream` | boolean | Utworzenie nowego strumienia |
| `newStreamName` | string | Nazwa nowego strumienia |
| `newStreamColor` | string | Kolor nowego strumienia |
| `linkedProjectId` | string | Powiazanie z projektem |
| `tasks` | array | Lista zadan jako "pierwsze kroki" |
| `tags` | array | Tagi |
| `dueDate` | string | Termin zadania |
| `projectDeadline` | string | Termin projektu |
| `reminder` | string | Przypomnienie (1m, 3m, 6m, 1y) |

### Przyklad rozpoczecia konwersacji

```json
POST /api/v1/flow/conversation/start/uuid-elementu

// Odpowiedz:
{
  "success": true,
  "data": {
    "id": "uuid-konwersacji",
    "status": "ACTIVE",
    "proposedAction": "ZAPLANUJ",
    "proposedStreamId": "uuid",
    "proposedTaskTitle": "Przegladnac raport Q1",
    "proposedPriority": "MEDIUM",
    "messages": [
      {
        "role": "assistant",
        "content": "Element przeanalizowany. Sugeruje zaplanowac to zadanie...",
        "metadata": {
          "actionOptions": [...],
          "streamMatching": { "bestMatch": {...} },
          "analysis": { "urgency": "MEDIUM" }
        }
      }
    ]
  }
}
```

---

## 25. Zunifikowane reguly (Unified Rules)

**Sciezka bazowa:** `/api/v1/unified-rules`
**Autoryzacja:** Wiekszosci endpointow wymaga JWT

System laczy ProcessingRule, EmailRule, AutoReply, AIRule i SmartMailboxRule w jeden zunifikowany interfejs.

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista regul z filtrami (type, status, category, search, page, limit) | Tak* |
| POST | `/` | Utworzenie nowej reguly | Tak |
| GET | `/stats/overview` | Statystyki przegladowe (prawdziwe dane) | Tak* |
| GET | `/templates` | Szablony regul | Tak |
| GET | `/:id` | Szczegoly reguly z ostatnimi wykonaniami | Tak |
| PUT | `/:id` | Aktualizacja reguly | Tak |
| DELETE | `/:id` | Usuniecie reguly | Tak |
| POST | `/:id/toggle` | Wlaczenie/wylaczenie reguly | Tak |
| POST | `/:id/execute` | Reczne wykonanie reguly | Tak |
| GET | `/:id/executions` | Historia wykonan reguly (page, limit) | Tak |
| POST | `/process-message` | Przetworzenie wiadomosci przez reguly | Tak |
| POST | `/process-project` | Przetworzenie projektu przez reguly | Tak |
| POST | `/process-task` | Przetworzenie zadania przez reguly | Tak |

*Niektore endpointy (GET /, stats/overview) dzialaja rowniez bez auth w trybie ograniczonym.

### Typy regul (UnifiedRuleType)

| Typ | Opis |
|-----|------|
| `PROCESSING` | Przetwarzanie wiadomosci |
| `EMAIL_FILTER` | Filtrowanie emaili |
| `AUTO_REPLY` | Automatyczne odpowiedzi |
| `AI_RULE` | Reguly AI |
| `SMART_MAILBOX` | Inteligentne skrzynki |
| `WORKFLOW` | Przeplywy pracy |
| `NOTIFICATION` | Powiadomienia |
| `INTEGRATION` | Integracje |
| `CUSTOM` | Niestandardowe |

### Typy wyzwalaczy (UnifiedTriggerType)

`EVENT_BASED`, `MANUAL`, `SCHEDULED`, `WEBHOOK`, `API_CALL`, `AUTOMATIC`

### Struktura warunkow

```json
{
  "sender": "jan@firma.pl",
  "senderDomain": "firma.pl",
  "subjectContains": ["oferta", "cennik"],
  "bodyContains": ["wycena"],
  "hasAttachment": true,
  "attachmentTypes": ["pdf", "xlsx"],
  "timeRange": { "start": "08:00", "end": "18:00", "timezone": "Europe/Warsaw" },
  "daysOfWeek": [1, 2, 3, 4, 5],
  "minUrgencyScore": 50,
  "priority": "HIGH",
  "keywords": ["pilne", "deadline"]
}
```

### Struktura akcji

```json
{
  "createTask": {
    "title": "Odpowiedziec na email",
    "priority": "HIGH",
    "context": "@computer"
  },
  "categorize": "VIP",
  "sendAutoReply": {
    "template": "Dziekujemy za wiadomosc...",
    "subject": "Potwierdzenie odbioru",
    "delay": 5,
    "onlyBusinessHours": true
  },
  "forwardTo": ["manager@firma.pl"],
  "notify": {
    "users": ["uuid-usera"],
    "channels": ["slack"],
    "message": "Nowy VIP email"
  },
  "updateContact": { "tags": ["VIP"] },
  "createDeal": { "stage": "PROSPECT", "value": 10000 },
  "runAIAnalysis": { "analysisType": "sentiment" }
}
```

---

## 26. Leady (Leads)

**Sciezka bazowa:** `/api/v1/leads`
**Autoryzacja:** Wszystkie endpointy wymagaja JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| GET | `/` | Lista leadow z filtrami i paginacja | Tak |
| GET | `/:id` | Pojedynczy lead | Tak |
| POST | `/` | Utworzenie leada | Tak |
| PUT | `/:id` | Aktualizacja leada | Tak |
| DELETE | `/:id` | Usuniecie leada | Tak |

### Parametry zapytania (GET /)

| Parametr | Typ | Opis |
|----------|-----|------|
| `page` | number | Numer strony |
| `limit` | number | Limit wynikow (domyslnie 50) |
| `search` | string | Wyszukiwanie po tytule, opisie, firmie, osobie kontaktowej |
| `status` | string | NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST |
| `priority` | string | LOW, MEDIUM, HIGH, URGENT |
| `sortBy` | string | Pole sortowania (domyslnie createdAt) |
| `sortOrder` | string | asc/desc |

### Przyklad tworzenia leada

```json
POST /api/v1/leads
{
  "title": "Lead z targow Poznan 2026",
  "description": "Zainteresowani wersja Enterprise",
  "company": "ABC Systems",
  "contactPerson": "Jan Kowalski",
  "status": "NEW",
  "priority": "HIGH",
  "source": "trade_show",
  "value": 75000
}
```

---

## 27. Wyszukiwanie uniwersalne (Search)

**Sciezka bazowa:** `/api/v1/search`
**Autoryzacja:** Endpoint demo publiczny, reszta wymaga JWT

### Endpointy

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| POST | `/demo` | Demo wyszukiwanie (bez auth) | Nie |
| POST | `/` | Wyszukiwanie semantyczne (auth) | Tak |

### Parametry

```json
POST /api/v1/search/demo
{
  "query": "projekty IT w Q1",
  "types": ["task", "project", "contact", "company", "deal", "communication", "knowledge", "activity"],
  "limit": 20
}
```

### Odpowiedz

```json
{
  "query": "projekty IT w Q1",
  "keywords": ["projekty", "Q1"],
  "totalResults": 5,
  "results": [...],
  "groupedResults": {
    "project": [...],
    "task": [...]
  },
  "stats": {
    "byType": [{ "type": "project", "count": 3 }],
    "searchTime": 87
  }
}
```

---

## 28. Kody bledow

### Kody statusow HTTP

| Kod | Opis |
|-----|------|
| `200` | Sukces |
| `201` | Utworzono nowy zasob |
| `204` | Sukces bez tresci (np. DELETE) |
| `400` | Nieprawidlowe zapytanie (brakujace pola, walidacja) |
| `401` | Brak autoryzacji (brakujacy lub nieprawidlowy token) |
| `403` | Brak uprawnien (niewystarczajaca rola) |
| `404` | Zasob nie znaleziony |
| `409` | Konflikt (np. duplikat) |
| `422` | Blad walidacji (Zod validation error) |
| `500` | Wewnetrzny blad serwera |
| `501` | Funkcjonalnosc niezaimplementowana |
| `503` | Usluga tymczasowo niedostepna |

### Format bledu

```json
{
  "success": false,
  "error": "Opis bledu czytelny dla czlowieka",
  "details": [
    { "field": "email", "message": "Nieprawidlowy format email" }
  ]
}
```

### Specjalne kody bledow AI

| Kod | Opis |
|-----|------|
| `MISSING_AI_PROMPT` | Brak konfiguracji promptu w bazie |
| `AI_ANALYSIS_FAILED` | Blad analizy AI |

---

## 29. Paginacja

Wiekszosci endpointow listowania obsluguje paginacje.

### Parametry zapytania

| Parametr | Typ | Domyslnie | Opis |
|----------|-----|-----------|------|
| `page` | number | 1 | Numer strony (1-indexed) |
| `limit` | number | 20 lub 50 | Liczba wynikow na strone |

Niektorych endpointow uzywa alternatywnego schematu:

| Parametr | Typ | Domyslnie | Opis |
|----------|-----|-----------|------|
| `offset` | number | 0 | Przesuniecie od poczatku |
| `limit` | number | 50 | Maksymalna liczba wynikow |

### Format odpowiedzi paginacji

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

Alternatywny format (np. Flow Engine):

```json
{
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 30. Filtrowanie i sortowanie

### Filtrowanie

Wiekszosc endpointow listowania obsluguje filtrowanie przez parametry zapytania (query params):

```
GET /api/v1/tasks?status=IN_PROGRESS&priority=HIGH&streamId=uuid
```

### Sortowanie

| Parametr | Typ | Opis |
|----------|-----|------|
| `sortBy` | string | Pole do sortowania (np. createdAt, name, priority) |
| `sortOrder` | string | `asc` (rosnaco) lub `desc` (malejaco) |

Przyklad:

```
GET /api/v1/contacts?sortBy=lastName&sortOrder=asc&page=1&limit=50
```

### Wyszukiwanie tekstowe

Wiekszosci endpointow obsluguje parametr `search`, ktory przeszukuje wiele pol jednoczesnie z trybem case-insensitive:

```
GET /api/v1/companies?search=tech
```

Przeszukiwane pola zaleza od encji (np. dla firm: name, description; dla kontaktow: firstName, lastName, email).

---

## 31. Naglowki zapytan

### Wymagane naglowki

| Naglowek | Wartosc | Opis |
|----------|---------|------|
| `Content-Type` | `application/json` | Dla zapytan z body (POST, PUT, PATCH) |
| `Authorization` | `Bearer <token>` | Token JWT (endpointy chronione) |

### Opcjonalne naglowki

| Naglowek | Wartosc | Opis |
|----------|---------|------|
| `Accept` | `application/json` | Oczekiwany format odpowiedzi |
| `Accept-Language` | `pl` | Jezyk odpowiedzi (domyslnie: pl) |

### Przyklad pelnego zapytania

```bash
curl -X POST "https://crm.dev.sorto.ai/crm/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -d '{
    "title": "Przygotowac raport",
    "priority": "HIGH",
    "status": "NEW",
    "streamId": "uuid-strumienia"
  }'
```

### Specjalne typy odpowiedzi

Niektore endpointy zwracaja inne formaty niz JSON:

| Endpoint | Content-Type | Opis |
|----------|-------------|------|
| `POST /voice/synthesize` | `audio/wav` | Plik audio WAV |
| `POST /voice/synthesize-stream` | `audio/wav` (streaming) | Strumieniowy plik audio |
| `POST /rag/sources/upload` | `multipart/form-data` | Upload pliku (multer) |

---

## Aliasy kompatybilnosci wstecznej

Nastepujace sciezki sa aliasami dla kompatybilnosci:

| Alias | Docelowy |
|-------|----------|
| `/api/v1/gtd` | `/api/v1/workflow` |
| `/api/v1/gtd-streams` | `/api/v1/stream-management` |
| `/api/v1/gtdinbox` | `/api/v1/source` |

---

> Dokument wygenerowany na podstawie analizy kodu zrodlowego aplikacji Sorto CRM.
> Pliki route: `/packages/backend/src/routes/` oraz `/packages/backend/src/modules/auth/routes.ts`
