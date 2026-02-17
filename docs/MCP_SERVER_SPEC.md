# MCP Server -- Specyfikacja Techniczna

Kompletna dokumentacja serwera MCP (Model Context Protocol) wbudowanego
w Sorto CRM.  Serwer udostepnia dane CRM zewnetrznym klientom AI --
ChatGPT, Claude, Cursor i innym narzediom wspierajacym protokol MCP.

**Data:** 17 lutego 2026
**Wersja:** 1.1
**Modul:** `packages/backend/src/mcp-server/`

---

## Spis Tresci

1. [Przeglad](#1-przeglad)
2. [Architektura](#2-architektura)
3. [Dostepne narzedzia (Tools)](#3-dostepne-narzedzia-tools)
4. [Endpointy API](#4-endpointy-api)
5. [Autoryzacja -- klucze API](#5-autoryzacja--klucze-api)
6. [Integracja z ChatGPT Actions](#6-integracja-z-chatgpt-actions)
7. [Panel administracyjny kluczy](#7-panel-administracyjny-kluczy)
8. [Konfiguracja i uruchomienie](#8-konfiguracja-i-uruchomienie)
9. [Przyklady uzycia](#9-przyklady-uzycia)
10. [Model danych](#10-model-danych)
11. [Struktura plikow](#11-struktura-plikow)
12. [Logowanie i monitoring](#12-logowanie-i-monitoring)
13. [Bezpieczenstwo](#13-bezpieczenstwo)
14. [Rozwiazywanie problemow](#14-rozwiazywanie-problemow)

---

## 1. Przeglad

Serwer MCP pozwala rozmawiac z CRM-em w jezyku naturalnym.
Uzytkownik zadaje pytanie w ChatGPT, Claude lub Cursor, a narzedzie
AI wywoluje odpowiedni tool MCP, ktory przeszukuje baze danych CRM
i zwraca sformatowana odpowiedz.

### Co mozna robic przez MCP

| Akcja | Przykladowe zapytanie |
|-------|----------------------|
| Szukanie firm, kontaktow, deali, zadan | "Pokaz firmy z branzy IT" |
| Pobieranie szczegolow obiektu | "Daj mi dane firmy TechStartup" |
| Dodawanie notatek | "Dodaj notatke do kontaktu Anna Kowalska" |
| Przegladanie zadan | "Jakie mam zadania na dzis?" |
| Statystyki pipeline | "Jaki jest stan pipeline sprzedazy?" |

### Dwa tryby dostepu

1. **Protokol MCP** -- `POST /mcp/tools/list` i `POST /mcp/tools/call`
   Natywny format MCP uzywan przez Claude Desktop, Cursor i inne
   klienty MCP.

2. **ChatGPT Actions (REST)** -- `POST /mcp/actions/search`, itd.
   Standardowe REST API ze schema OpenAPI, kompatybilne z ChatGPT
   Custom GPTs / Actions.

Oba tryby uzywaja tego samego silnika narzedzi i tej samej autoryzacji
kluczem API (Bearer token).

---

## 2. Architektura

```
+------------------------------------------------------------------+
|                        KLIENTY AI                                |
|   ChatGPT  |  Claude Desktop  |  Cursor  |  Dowolny klient MCP  |
+------+----------+------------------+---------+-------------------+
       |          |                  |         |
       |   Bearer mcp_xxxxxxxx...   |         |
       v          v                  v         v
+------------------------------------------------------------------+
|                     NGINX  (reverse proxy)                       |
|                 https://crm.dev.sorto.ai/crm/api/v1/mcp/        |
+------------------------------------------------------------------+
       |
       v
+------------------------------------------------------------------+
|                     EXPRESS  BACKEND                              |
|                                                                  |
|  /api/v1/mcp/                                                    |
|    +-- GET  /              -> McpServerController.getInfo()      |
|    +-- GET  /openapi.yaml  -> OpenAPI schema (YAML)              |
|    +-- GET  /openapi.json  -> OpenAPI schema (JSON)              |
|    +-- POST /tools/list    -> [apiKeyGuard] listTools()          |
|    +-- POST /tools/call    -> [apiKeyGuard] callTool()           |
|    +-- /actions/           -> ChatGPT Actions REST               |
|         +-- POST /search          [apiKeyGuard]                  |
|         +-- POST /details         [apiKeyGuard]                  |
|         +-- POST /notes           [apiKeyGuard]                  |
|         +-- POST /tasks           [apiKeyGuard]                  |
|         +-- GET  /pipeline-stats  [apiKeyGuard]                  |
|                                                                  |
|  /api/v1/admin/mcp-keys/  (panel zarzadzania kluczami)          |
|    +-- GET  /             [JWT auth] lista kluczy                |
|    +-- POST /             [JWT auth] tworzenie klucza            |
|    +-- GET  /:keyId       [JWT auth] szczegoly + statystyki     |
|    +-- PATCH /:keyId      [JWT auth] zmiana nazwy               |
|    +-- POST /:keyId/revoke[JWT auth] dezaktywacja               |
|    +-- DELETE /:keyId     [JWT auth] usuniecie                   |
|    +-- GET  /:keyId/usage [JWT auth] historia uzycia            |
|                                                                  |
+------------------------------------------------------------------+
       |
       v
+------------------------------------------------------------------+
|                       MCP SERVER SERVICE                         |
|                                                                  |
|   McpServerService.executeTool(name, args, context)              |
|     |                                                            |
|     +-- search        -> SearchTool.execute(query, orgId)        |
|     +-- get_details   -> DetailsTool.execute(type, id, orgId)    |
|     +-- create_note   -> NotesTool.execute(type, id, text, org)  |
|     +-- list_tasks    -> TasksTool.execute(filter, orgId)        |
|     +-- get_pipeline_stats -> StatsTool.execute(orgId)           |
|     |                                                            |
|     +-- logUsage() -> mcp_usage_logs (Prisma)                   |
|                                                                  |
+------------------------------------------------------------------+
       |
       v
+------------------------------------------------------------------+
|                  POSTGRESQL  (Prisma ORM)                        |
|                                                                  |
|  mcp_api_keys    -- klucze API (hash SHA-256)                   |
|  mcp_usage_logs  -- logi wywolan                                |
|  company, contact, deal, task, stream, activities -- dane CRM   |
|                                                                  |
+------------------------------------------------------------------+
```

### Przeplyw wywolania (request flow)

```
Klient AI              Backend                         Baza danych
   |                     |                                 |
   |-- POST /mcp/tools/call -->                            |
   |   Authorization: Bearer mcp_xxx                       |
   |   {"name":"search", "arguments":{"query":"IT"}}       |
   |                     |                                 |
   |               apiKeyGuard()                           |
   |               -- hash(mcp_xxx) -> SHA-256             |
   |               -- SELECT mcp_api_keys WHERE keyHash    |
   |               -- sprawdz isActive, expiresAt          |
   |               -- ustaw req.mcpContext                  |
   |                     |                                 |
   |              McpServerService.executeTool()            |
   |               -- rozpoznaj tool "search"              |
   |               -- SearchTool.execute("IT", orgId)      |
   |                     |--- SELECT company WHERE ... --->|
   |                     |<-- wyniki ----------------------|
   |               -- formatResults()                      |
   |               -- logUsage() -> INSERT mcp_usage_logs  |
   |                     |                                 |
   |<-- 200 OK ----------|                                 |
   |   {"content":[{"type":"text","text":"..."}]}          |
```

---

## 3. Dostepne narzedzia (Tools)

### 3.1 `search` -- Wyszukiwanie w CRM

Przeszukuje firmy, kontakty, leady, deale, zadania i streamy.
Rozumie naturalny jezyk -- parsuje zapytanie i dopasowuje typ encji
oraz filtry (branza, status, wartosc).

**Parametry wejsciowe (inputSchema):**

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `query` | string | tak | Zapytanie w jezyku naturalnym |

**Przyklady zapytan:**
- `"firmy z branzy IT"`
- `"leady powyzej 50K"`
- `"kontakty CEO"`
- `"zadania zaległe"`
- `"deale aktywne"`

**Logika parsowania:**

- Wykrywanie typu encji: slowa `firma/firmy/company` -> company,
  `kontakt/contact/osob` -> contact, `deal/lead/szansa` -> deal,
  `zadani/task/todo` -> task, `stream/watek` -> stream.
  Brak dopasowania -> szuka we wszystkich typach (`mixed`).
- Filtry branzy: `"branzy IT"`, `"z IT"` -> `industry: IT`
- Filtry statusu: `aktywn/active` -> ACTIVE, `zamkniet/closed` -> CLOSED
- Filtry wartosci: `"powyzej 50K"` -> `value.min: 50000`
- Limit domyslny: 10 wynikow (3 na typ w trybie mixed)

**Format odpowiedzi:**

```
Znalazlem 3 wynikow:

**TechStartup Innovations** (Firma)
  Branza: IT | Adres: ul. Innowacyjna 1, Warszawa
  Status: ACTIVE | Aktywne deale: Tak

**Anna Kowalska** (Kontakt)
  CTO @ TechStartup Innovations
  Email: anna@techstartup.pl | Tel: +48 600 100 200
```

Plik zrodlowy: `mcp-server/tools/search.tool.ts`

---

### 3.2 `get_details` -- Szczegoly obiektu

Pobiera pelne informacje o konkretnym obiekcie CRM wlacznie z
powiazaniami (kontakty firmy, deale, aktywnosci, projekt zadania, itp.).

**Parametry wejsciowe:**

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `type` | string (enum) | tak | `company`, `contact`, `deal`, `task`, `stream` |
| `id` | string (UUID) | tak | ID obiektu |

**Zwracane dane w zaleznosci od typu:**

- **company** -- dane podstawowe, opis, lista kontaktow (5),
  lista deali (5) z wlascicielami, ostatnie aktywnosci (5)
- **contact** -- dane osobowe, stanowisko, firma, notatki,
  ostatnie aktywnosci (5)
- **deal** -- wartość, etap, prawdopodobieństwo, właściciel, firma,
  daty zamkniecia, opis, notatki, aktywnosci (5)
- **task** -- tytul, status, priorytet, termin, energia, przypisany,
  projekt, stream, kontekst, opis, szacowany/faktyczny czas
- **stream** -- nazwa, typ, status, tworca, opis, zadania (5)

**Format odpowiedzi (przyklad company):**

```
**TechStartup Innovations**

Dane podstawowe:
  Branza: IT
  Adres: ul. Innowacyjna 1, Warszawa
  Telefon: +48 22 100 2000
  Email: biuro@techstartup.pl
  Strona: https://techstartup.pl
  Status: ACTIVE

Kontakty (2):
  - Anna Kowalska (CTO)
    anna@techstartup.pl | +48 600 100 200

Deale (1):
  - Wdrozenie CRM: 120 000 PLN (PROPOSAL)
    Wlasciciel: Michal Kowalski
```

Plik zrodlowy: `mcp-server/tools/details.tool.ts`

---

### 3.3 `create_note` -- Dodawanie notatek

Tworzy notatke powiazana z firma, kontaktem lub dealem.
Notatka jest zapisywana jako aktywnosc (`NOTE_ADDED`) oraz
dopisywana do pola `notes` kontaktu/deala (z timestamp-em).

**Parametry wejsciowe:**

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `target_type` | string (enum) | tak | `company`, `contact`, `deal` |
| `target_id` | string (UUID) | tak | ID obiektu docelowego |
| `content` | string | tak | Tresc notatki |

**Operacje w bazie:**
1. Sprawdzenie czy obiekt istnieje w organizacji (tenant isolation)
2. Utworzenie rekordu `activities` z typem `NOTE_ADDED`
3. Dopisanie notatki do pola `notes` (contact/deal) z data
   w formacie `[YYYY-MM-DD] tresc`

**Format odpowiedzi:**

```
Dodano notatke do kontaktu "Anna Kowalska":
"Rozmowa telefoniczna - klient zainteresowany wdrozeniem"
```

Plik zrodlowy: `mcp-server/tools/notes.tool.ts`

---

### 3.4 `list_tasks` -- Lista zadan

Zwraca zadania pogrupowane wedlug priorytetu z mozliwoscia
filtrowania po okresie czasu.

**Parametry wejsciowe:**

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `filter` | string (enum) | nie | `today` (domyslnie), `overdue`, `this_week`, `all` |

**Filtry:**
- `today` -- zadania z terminem dzisiaj
- `overdue` -- zadania po terminie (dueDate < dzis)
- `this_week` -- zadania do konca tygodnia
- `all` -- wszystkie aktywne (bez COMPLETED i CANCELED)

Wyniki sa sortowane: priorytet (malejaco), termin (rosnaco).
Limit: 20 zadan. Grupowanie: Pilne / Normalne / Niska priorytet.

**Format odpowiedzi:**

```
Zadania na dzis (3):

**Pilne:**
  - Wyslac oferte dla RetailChain [CRM Integration Project]
    Termin: 2026-02-17 | Michal Kowalski | IN_PROGRESS

**Normalne:**
  - Przygotowac raport Q1
    Termin: 2026-02-17 | Anna Nowak | TODO
```

Plik zrodlowy: `mcp-server/tools/tasks.tool.ts`

---

### 3.5 `get_pipeline_stats` -- Statystyki pipeline

Zwraca podsumowanie pipeline sprzedazy -- liczba deali na kazdym
etapie, laczna wartosc, prognoza miesieczna i wskaznik konwersji.

**Parametry wejsciowe:** brak (pusty obiekt `{}`)

**Obliczane metryki:**
- Nowe leady (etap PROSPECT)
- W trakcie kwalifikacji (QUALIFIED + PROPOSAL)
- Wyslane oferty (PROPOSAL)
- Negocjacje (NEGOTIATION)
- Zamkniete wygrane (CLOSED_WON)
- Laczna wartosc aktywnych deali
- Prognoza na biezacy miesiac (wartosc * prawdopodobienstwo,
  tylko deale z expectedCloseDate w biezacym miesiacu)
- Wskaznik konwersji (zamkniete wygrane / wszystkie deale)

**Format odpowiedzi:**

```
**Pipeline sprzedazy**

Etapy:
  - Nowe leady (Prospect): 5
  - W trakcie kwalifikacji: 3
  - Wyslane oferty: 2
  - Negocjacje: 1
  - Zamkniete (wygrane): 4

Wartosci:
  - Laczna wartosc aktywnych deali: 450 000 PLN
  - Prognoza (ten miesiac): 120 000 PLN

Konwersja:
  - Wskaznik wygranych: 26.7%
```

Plik zrodlowy: `mcp-server/tools/stats.tool.ts`

---

## 4. Endpointy API

### 4.1 Endpointy MCP (protokol natywny)

Prefiks: `/api/v1/mcp/`

| Metoda | Sciezka | Auth | Opis |
|--------|---------|------|------|
| GET | `/` | brak | Informacje o serwerze (nazwa, wersja, endpointy) |
| GET | `/openapi.yaml` | brak | Schema OpenAPI w formacie YAML |
| GET | `/openapi.json` | brak | Schema OpenAPI w formacie JSON |
| POST | `/tools/list` | API Key | Lista dostepnych narzedzi |
| POST | `/tools/call` | API Key | Wywolanie narzedzia |

**POST /tools/list -- odpowiedz:**

```json
{
  "tools": [
    {
      "name": "search",
      "description": "Szukaj w CRM...",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "..." }
        },
        "required": ["query"]
      }
    }
  ]
}
```

**POST /tools/call -- request:**

```json
{
  "name": "search",
  "arguments": {
    "query": "firmy z branzy IT"
  }
}
```

**POST /tools/call -- odpowiedz sukcesu:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Znalazlem 3 wynikow:\n\n**TechStartup Innovations** (Firma)..."
    }
  ]
}
```

**POST /tools/call -- odpowiedz bledu:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Blad: Nieznane narzedzie: invalid_tool"
    }
  ],
  "isError": true
}
```

### 4.2 Endpointy ChatGPT Actions (REST)

Prefiks: `/api/v1/mcp/actions/`
Wszystkie endpointy wymagaja klucza API (Bearer token).

| Metoda | Sciezka | Opis |
|--------|---------|------|
| POST | `/search` | Wyszukiwanie w CRM |
| POST | `/details` | Szczegoly obiektu |
| POST | `/notes` | Dodawanie notatki |
| POST | `/tasks` | Lista zadan |
| GET | `/pipeline-stats` | Statystyki pipeline |

**Roznice w stosunku do formatu MCP:**
- Odpowiedzi w formacie REST: `{ success, results/data/tasks/stats, raw }`
- Pole `raw` zawiera oryginalna odpowiedz MCP
- Kody HTTP: 201 dla notatek, 400 dla bledow walidacji

### 4.3 Endpointy administracyjne (klucze API)

Prefiks: `/api/v1/admin/mcp-keys/`
Autoryzacja: JWT token (standardowe logowanie do CRM).

| Metoda | Sciezka | Opis |
|--------|---------|------|
| GET | `/` | Lista kluczy organizacji |
| POST | `/` | Utworzenie nowego klucza |
| GET | `/:keyId` | Szczegoly klucza + statystyki |
| PATCH | `/:keyId` | Aktualizacja nazwy |
| POST | `/:keyId/revoke` | Dezaktywacja klucza |
| DELETE | `/:keyId` | Usuniecie klucza |
| GET | `/:keyId/usage` | Historia uzycia (limit=50) |

---

## 5. Autoryzacja -- klucze API

### Jak to dziala

Kazde wywolanie endpointu MCP (oprocz GET `/mcp/`) wymaga
naglowka `Authorization: Bearer <KLUCZ_API>`.

Middleware `apiKeyGuard` (plik `auth/api-key.guard.ts`):

1. Wyciaga klucz z naglowka `Authorization: Bearer ...`
2. Hashuje klucz algorytmem SHA-256
3. Szuka rekordu w tabeli `mcp_api_keys` po polu `keyHash`
4. Sprawdza:
   - czy klucz istnieje
   - czy `isActive` jest `true`
   - czy `expiresAt` nie minal (jesli ustawiony)
5. Dodaje do request-u kontekst MCP (`mcpContext`):
   - `organization` -- pelny obiekt organizacji
   - `apiKeyId` -- ID klucza (do logowania)
6. Asynchronicznie aktualizuje `lastUsedAt`

### Format klucza

Klucz jest generowany przy tworzeniu:

```
mcp_<64 znaki hex z crypto.randomBytes(32)>
```

Przyklad: `mcp_a1b2c3d4e5f6...` (laczna dlugosc: ~68 znakow)

W bazie przechowywany jest tylko hash SHA-256 -- oryginalny klucz
jest zwracany **tylko raz** przy tworzeniu i nie mozna go odzyskac.

Pole `keyPrefix` (pierwsze 12 znakow) sluzy do identyfikacji
wizualnej klucza w panelu admina.

### Kody bledow autoryzacji

| Kod HTTP | Kod bledu | Opis |
|----------|-----------|------|
| 401 | `MISSING_API_KEY` | Brak naglowka Authorization |
| 401 | `INVALID_AUTH_FORMAT` | Zly format (nie `Bearer ...`) |
| 401 | `INVALID_API_KEY` | Klucz nieznaleziony w bazie |
| 401 | `INACTIVE_API_KEY` | Klucz zdezaktywowany (revoked) |
| 401 | `EXPIRED_API_KEY` | Klucz po terminie waznosci |
| 500 | `AUTH_ERROR` | Blad wewnetrzny autoryzacji |

### Multi-tenancy

Klucz API jest powiazany z organizacja (polem `organizationId`).
Kazde wywolanie narzedzia operuje wylacznie na danych tej
organizacji -- izolacja danych jest gwarantowana na poziomie zapytan
Prisma (filtr `WHERE organizationId = ...`).

---

## 6. Integracja z ChatGPT Actions

### Schema OpenAPI

Schema jest dostepna pod adresami:
- `https://crm.dev.sorto.ai/api/v1/mcp/openapi.yaml`
- `https://crm.dev.sorto.ai/api/v1/mcp/openapi.json`

Plik zrodlowy: `packages/backend/src/openapi/chatgpt-actions.yaml`

### Konfiguracja w ChatGPT

1. Otwórz https://chatgpt.com -> Moje GPTs -> Konfiguruj
2. W sekcji "Actions" kliknij "Utwórz nowa akcje"
3. W polu "Schema URL" wklej:
   `https://crm.dev.sorto.ai/api/v1/mcp/openapi.yaml`
4. W sekcji "Autentykacja":
   - Typ: **API Key**
   - Prefix: **Bearer**
   - Nagłówek: **Authorization**
   - Wartość: twój klucz `mcp_xxx...`
5. Zapisz -- ChatGPT automatycznie rozpozna 5 dostepnych operacji:
   - `searchCRM`
   - `getDetails`
   - `createNote`
   - `listTasks`
   - `getPipelineStats`

### Zdefiniowane operacje (operationId)

| operationId | Metoda | Sciezka | Opis |
|-------------|--------|---------|------|
| `searchCRM` | POST | `/mcp/actions/search` | Wyszukiwanie |
| `getDetails` | POST | `/mcp/actions/details` | Szczegoly obiektu |
| `createNote` | POST | `/mcp/actions/notes` | Dodawanie notatki |
| `listTasks` | POST | `/mcp/actions/tasks` | Lista zadan |
| `getPipelineStats` | GET | `/mcp/actions/pipeline-stats` | Statystyki |

---

## 7. Panel administracyjny kluczy

### Frontend

URL: `https://crm.dev.sorto.ai/crm/dashboard/admin/mcp-keys/`

Strona pozwala:
- Przegladac liste kluczy organizacji (prefix, nazwa, status, ostatnie uzycie)
- Tworzyc nowe klucze (klucz wyswietlany jest jednorazowo)
- Edytowac nazwe klucza
- Dezaktywowac klucz (revoke)
- Usuwac klucz
- Przegladac szczegolowe statystyki i historie uzycia

### Frontend API Client

Plik: `packages/frontend/src/lib/api/mcp.ts`

Eksportuje funkcje:
- `getMcpApiKeys(organizationId?)` -- lista kluczy
- `getMcpApiKey(keyId)` -- szczegoly + statystyki
- `createMcpApiKey({ name? })` -- tworzenie (zwraca klucz raz)
- `updateMcpApiKey(keyId, name)` -- zmiana nazwy
- `revokeMcpApiKey(keyId)` -- dezaktywacja
- `deleteMcpApiKey(keyId)` -- usuniecie
- `getMcpKeyUsage(keyId, limit?)` -- historia uzycia

### Statystyki klucza

Dla kazdego klucza dostepne sa metryki:
- `totalCalls` -- laczna liczba wywolan
- `successfulCalls` -- udane wywolania
- `lastWeekCalls` -- wywolania w ostatnim tygodniu
- `avgResponseTime` -- sredni czas odpowiedzi (ms)

---

## 8. Konfiguracja i uruchomienie

### Wymagania

- Backend Sorto CRM uruchomiony (Express.js, port 3003)
- PostgreSQL z tabelami `mcp_api_keys` i `mcp_usage_logs`
- Prisma Client wygenerowany (tabele zdefiniowane w `schema.prisma`)

### Montowanie routow

Serwer MCP jest zarejestrowany w `app.ts` jako:

```typescript
// MCP Server routes -- protokol MCP + ChatGPT Actions
// (montowane pod /api/v1/mcp/ przez mcpServerRoutes)

// Admin -- zarzadzanie kluczami (JWT auth)
apiRouter.use('/admin/mcp-keys', mcpKeysRoutes);
```

Plik routingu MCP: `mcp-server/routes.ts`

### Zalenosci

Serwer MCP nie wymaga dodatkowych paczek -- korzysta z:
- `express` (routing, middleware)
- `@prisma/client` (dostep do bazy)
- `crypto` (hashowanie kluczy, generowanie UUID)
- `js-yaml` (konwersja OpenAPI YAML -> JSON, opcjonalnie)

### Tworzenie pierwszego klucza

```bash
# Przez API (wymaga JWT -- zaloguj sie w CRM)
curl -X POST https://crm.dev.sorto.ai/crm/api/v1/admin/mcp-keys \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Moj klucz ChatGPT"}'

# Odpowiedz:
# {
#   "success": true,
#   "id": "uuid...",
#   "key": "mcp_a1b2c3d4...",  <-- ZAPISZ!
#   "keyPrefix": "mcp_a1b2c3d4",
#   "name": "Moj klucz ChatGPT"
# }
```

Lub przez panel frontend: Administracja -> Klucze MCP API.

### Test polaczenia

```bash
# Sprawdz info o serwerze (bez autoryzacji)
curl https://crm.dev.sorto.ai/crm/api/v1/mcp/

# Lista narzedzi (z kluczem API)
curl -X POST https://crm.dev.sorto.ai/crm/api/v1/mcp/tools/list \
  -H "Authorization: Bearer mcp_twoj_klucz" \
  -H "Content-Type: application/json"

# Wywolaj wyszukiwanie
curl -X POST https://crm.dev.sorto.ai/crm/api/v1/mcp/tools/call \
  -H "Authorization: Bearer mcp_twoj_klucz" \
  -H "Content-Type: application/json" \
  -d '{"name": "search", "arguments": {"query": "firmy IT"}}'
```

---

## 9. Przyklady uzycia

### Przyklad 1 -- Wyszukiwanie firm

**Request (MCP):**
```bash
curl -X POST https://crm.dev.sorto.ai/crm/api/v1/mcp/tools/call \
  -H "Authorization: Bearer mcp_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search",
    "arguments": { "query": "firmy z branzy IT" }
  }'
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "Znalazlem 2 wynikow:\n\n**TechStartup Innovations** (Firma)\n  Branza: IT | Adres: ul. Innowacyjna 1\n  Status: ACTIVE | Aktywne deale: Tak\n\n**FinanceGroup Solutions** (Firma)\n  Branza: IT/Finance | Adres: ul. Bankowa 5\n  Status: ACTIVE | Aktywne deale: Nie"
  }]
}
```

### Przyklad 2 -- Szczegoly kontaktu

**Request (ChatGPT Actions):**
```bash
curl -X POST https://crm.dev.sorto.ai/crm/api/v1/mcp/actions/details \
  -H "Authorization: Bearer mcp_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "contact",
    "id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": "**Anna Kowalska**\n\nDane podstawowe:\n  Stanowisko: CTO\n  Firma: TechStartup\n  Email: anna@techstartup.pl\n  Status: ACTIVE",
  "raw": {
    "content": [{"type":"text","text":"..."}]
  }
}
```

### Przyklad 3 -- Dodanie notatki

```bash
curl -X POST https://crm.dev.sorto.ai/crm/api/v1/mcp/tools/call \
  -H "Authorization: Bearer mcp_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "create_note",
    "arguments": {
      "target_type": "deal",
      "target_id": "550e8400-e29b-41d4-a716-446655440099",
      "content": "Klient potwierdził budżet na Q2. Wysłać zaktualizowaną ofertę."
    }
  }'
```

### Przyklad 4 -- Zadania na dzis

```bash
curl -X POST https://crm.dev.sorto.ai/crm/api/v1/mcp/tools/call \
  -H "Authorization: Bearer mcp_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "list_tasks",
    "arguments": { "filter": "today" }
  }'
```

### Przyklad 5 -- Statystyki pipeline (ChatGPT Actions)

```bash
curl https://crm.dev.sorto.ai/crm/api/v1/mcp/actions/pipeline-stats \
  -H "Authorization: Bearer mcp_xxx"
```

---

## 10. Model danych

### Tabela `mcp_api_keys`

```sql
CREATE TABLE mcp_api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash        TEXT UNIQUE NOT NULL,     -- SHA-256 hash klucza
  key_prefix      TEXT NOT NULL,             -- pierwsze 12 znakow (do wyswietlania)
  name            TEXT,                      -- opcjonalna nazwa klucza
  is_active       BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_id   UUID NOT NULL REFERENCES users(id),
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ
);
```

### Tabela `mcp_usage_logs`

```sql
CREATE TABLE mcp_usage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id      UUID NOT NULL REFERENCES mcp_api_keys(id) ON DELETE CASCADE,
  tool_name       TEXT NOT NULL,             -- np. "search", "get_details"
  query           TEXT,                      -- opcjonalne zapytanie
  success         BOOLEAN DEFAULT true,
  response_time_ms INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### Relacje

```
Organization ---< mcp_api_keys ---< mcp_usage_logs
User ----------< mcp_api_keys (created_by)
```

---

## 11. Struktura plikow

```
packages/backend/src/
├── mcp-server/
│   ├── index.ts                       # Eksporty modulu
│   ├── routes.ts                      # Routing MCP + ChatGPT Actions
│   ├── mcp-server.controller.ts       # Kontroler (getInfo, listTools, callTool)
│   ├── mcp-server.service.ts          # Serwis (executeTool, logUsage)
│   ├── chatgpt-actions.controller.ts  # REST API dla ChatGPT Actions
│   ├── auth/
│   │   └── api-key.guard.ts           # Middleware autoryzacji API Key
│   ├── admin/
│   │   ├── routes.ts                  # Routing admin (CRUD kluczy)
│   │   ├── api-keys.controller.ts     # Kontroler admin
│   │   └── api-keys.service.ts        # Serwis admin (create, revoke, delete, stats)
│   ├── tools/
│   │   ├── tools.registry.ts          # Rejestr narzedzi (MCP_TOOLS, getToolByName)
│   │   ├── search.tool.ts             # Narzedzie: wyszukiwanie
│   │   ├── details.tool.ts            # Narzedzie: szczegoly obiektu
│   │   ├── notes.tool.ts              # Narzedzie: dodawanie notatek
│   │   ├── tasks.tool.ts              # Narzedzie: lista zadan
│   │   └── stats.tool.ts              # Narzedzie: statystyki pipeline
│   └── types/
│       └── mcp.types.ts               # Definicje typow TypeScript
│
├── openapi/
│   └── chatgpt-actions.yaml           # Schema OpenAPI dla ChatGPT
│
├── routes/
│   └── mcpKeys.ts                     # Alternatywny routing admin kluczy
│
└── app.ts                             # Glowna aplikacja Express
```

---

## 12. Logowanie i monitoring

### Logi serwera

Kazde wywolanie narzedzia jest logowane przez Winston:

```
[McpServer] Executing tool: search { args: { query: "IT" }, org: "uuid" }
[ApiKeyGuard] Authorized: mcp_a1b2c3d4 for org: Tech Solutions
[McpController] Tool call: search { org: "Tech Solutions", args: { query: "IT" } }
```

### Tabela usage logs

Kazde wywolanie (udane i nieudane) jest zapisywane w `mcp_usage_logs`:
- `toolName` -- nazwa narzedzia
- `query` -- zapytanie (jesli dostepne)
- `success` -- true/false
- `responseTimeMs` -- czas odpowiedzi w milisekundach

### Przegladanie logow

```bash
# Ostatnie logi MCP z kontenera
docker logs crm-backend-v1 2>&1 | grep "\[Mcp"

# Historia uzycia klucza przez API
curl https://crm.dev.sorto.ai/crm/api/v1/admin/mcp-keys/<keyId>/usage \
  -H "Authorization: Bearer <JWT>"
```

---

## 13. Bezpieczenstwo

### Izolacja multi-tenant

Kazdy klucz API jest powiazany z organizacja. Srodowisko MCP
automatycznie filtruje wszystkie zapytania do bazy po `organizationId`,
zapobiegajac dostepowi do danych innych organizacji.

### Przechowywanie kluczy

Klucze sa hashowane SHA-256 przed zapisem do bazy -- oryginalny
klucz nigdy nie jest przechowywany. Pole `keyPrefix` (12 znakow)
sluzy wylacznie do identyfikacji wizualnej.

### Wygasanie kluczy

Pole `expiresAt` pozwala ustawic date wygasniecia klucza.
Po upływie daty klucz jest automatycznie odrzucany.

### Dezaktywacja

Klucz mozna dezaktywowac (revoke) bez usuwania -- pole `isActive`
jest ustawiane na `false`. Zdezaktywowany klucz jest odrzucany
z kodem `INACTIVE_API_KEY`.

### Rate limiting

Endpointy MCP sa objete ogolnym rate limiterem Express
(`generalRateLimit` zdefiniowanym w `app.ts`).

### Walidacja wejscia

- Nazwa narzedzia jest sprawdzana w rejestrze `MCP_TOOLS`
- Typy encji sa walidowane przez enum-y (`company`, `contact`, itp.)
- ID obiektow sa walidowane jako UUID w zapytaniach Prisma
- Parametry ChatGPT Actions sa walidowane przed przekazaniem
  do serwisu MCP

---

## 14. Rozwiazywanie problemow

### Blad 401 -- Brak autoryzacji

```
{"error":"Brak klucza API","code":"MISSING_API_KEY"}
```

**Rozwiazanie:** Dodaj naglowek `Authorization: Bearer mcp_xxx`.

### Blad 401 -- Nieprawidlowy klucz

```
{"error":"Nieprawidlowy klucz API","code":"INVALID_API_KEY"}
```

**Rozwiazanie:** Sprawdz czy klucz jest poprawny i nie zostal
obciety. Klucz ma format `mcp_<64 znaki hex>`.

### Blad 401 -- Klucz nieaktywny

```
{"error":"Klucz API jest nieaktywny","code":"INACTIVE_API_KEY"}
```

**Rozwiazanie:** Klucz zostal zdezaktywowany. Utworz nowy klucz
w panelu admin.

### Blad 400 -- Brak nazwy narzedzia

```
{"error":"Brak nazwy narzedzia","code":"MISSING_TOOL_NAME"}
```

**Rozwiazanie:** Dodaj pole `name` w body requesta:
`{"name": "search", "arguments": {...}}`

### Blad 500 -- Blad wewnetrzny

**Rozwiazanie:** Sprawdz logi backendu:
```bash
docker logs crm-backend-v1 2>&1 | grep -i error | tail -20
```

### OpenAPI schema nie znaleziona (404)

```
{"error":"OpenAPI schema not found"}
```

**Rozwiazanie:** Upewnij sie, ze plik
`packages/backend/src/openapi/chatgpt-actions.yaml` istnieje
i jest dostepny w kontenerze.

### Puste wyniki wyszukiwania

Jesli search zwraca "Nie znalazlem wynikow" -- sprobuj:
1. Uzyc innych slow kluczowych
2. Sprawdzic czy dane istnieja w bazie dla tej organizacji
3. Prosciej sformulowac zapytanie (np. "firmy" zamiast
   "firmy technologiczne z Poznania")

---

*Wygenerowano na podstawie kodu zrodlowego MCP Server z katalogu
`packages/backend/src/mcp-server/`. Wersja backendu: @crm-gtd/backend 0.1.0*
