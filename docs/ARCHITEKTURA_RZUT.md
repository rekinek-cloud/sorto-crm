# Architektura systemu Celow Precyzyjnych (RZUT) — Sorto Streams CRM

## Spis tresci

1. [Przeglad metodologii RZUT](#1-przeglad-metodologii-rzut)
2. [Schemat bazy danych](#2-schemat-bazy-danych)
3. [Endpointy API](#3-endpointy-api)
4. [Komponenty frontendowe](#4-komponenty-frontendowe)
5. [Powiazanie ze Strumieniami (Streams)](#5-powiazanie-ze-strumieniami-streams)
6. [Sledzenie postepu](#6-sledzenie-postepu)
7. [Cykl zycia statusow](#7-cykl-zycia-statusow)
8. [Integracja z AI](#8-integracja-z-ai)
9. [Przyklady celow RZUT w kontekscie biznesowym](#9-przyklady-celow-rzut-w-kontekscie-biznesowym)
10. [Diagram cyklu zycia celu](#10-diagram-cyklu-zycia-celu)

---

## 1. Przeglad metodologii RZUT

**Cel Precyzyjny** to cel zdefiniowany przez 4 elementy skladowe — akronim **RZUT**:

```
+-----------------------------------------------------------+
|                                                           |
|   CEL PRECYZYJNY = R + Z + U + T                         |
|                                                           |
|   R - REZULTAT       Co konkretnie powstanie?             |
|   Z - ZMIERZALNOSC   Po czym poznam, ze osiagnalem?       |
|   U - UJSCIE         Do kiedy strumien tam doplynie?      |
|   T - TLO            Dlaczego ten cel, nie inny?          |
|                                                           |
+-----------------------------------------------------------+
```

### Formulka RZUT

| Element | Pytanie kluczowe | Cel mgliscie | Cel precyzyjnie |
|---------|------------------|--------------|-----------------|
| **R - Rezultat** | Co powstanie? | "Wiecej klientow" | "15 nowych klientow B2B z sektora IT" |
| **Z - Zmierzalnosc** | Skad bede wiedzial? | "Bedzie lepiej" | "Pipeline w CRM: 15 zamknietych dealow" |
| **U - Ujscie** | Do kiedy? | "W tym roku" | "Do 31.03.2025 (koniec Q1)" |
| **T - Tlo** | Po co mi to? | "Bo trzeba" | "Bo to da 200K przychodu na rozwoj" |

### Zdanie celowe

Kazdy Cel Precyzyjny mozna zapisac jednym zdaniem:

```
[REZULTAT] zmierzony przez [ZMIERZALNOSC] do [UJSCIE],
poniewaz [TLO].

Przyklad:
"15 nowych klientow B2B zmierzonych w CRM do 31.03.2025,
poniewaz to da 200K przychodu potrzebnego na rozwoj."
```

### Roznica miedzy RZUT a SMART

RZUT jest autorska polska alternatywa dla SMART goals, zaprojektowana specjalnie pod metodologie Sorto Streams. Kluczowa roznica polega na:

- **SMART** uzywa 5 kryteriow: Specific, Measurable, Achievable, Relevant, Time-bound
- **RZUT** uzywa 4 elementow: Rezultat, Zmierzalnosc, Ujscie, Tlo

RZUT laczy "Specific" i "Achievable" w jeden element **Rezultat** (co konkretnie powstanie — to z definicji jest konkretne i osiagalne), a "Relevant" zastepuje **Tlem** (dlaczego ten cel — szerszy kontekst motywacyjny). Element **Ujscie** nawiazuje do metafory strumienia — cel "wplywa" do okreslnego punktu w czasie.

---

## 2. Schemat bazy danych

### Model `precise_goals` (Prisma)

```prisma
model precise_goals {
  id              String    @id @default(dbgenerated("(gen_random_uuid())::text"))
  result          String                              // R - Rezultat
  measurement     String                              // Z - Zmierzalnosc
  deadline        DateTime  @db.Timestamp(6)          // U - Ujscie (termin)
  background      String?                             // T - Tlo (opcjonalne)
  current_value   Decimal?  @default(0) @db.Decimal(10, 2)  // Aktualny postep
  target_value    Decimal   @db.Decimal(10, 2)        // Wartosc docelowa
  unit            String?   @default("count") @db.VarChar(50) // Jednostka miary
  stream_id       String?                             // FK do Streama
  organization_id String                              // FK do Organizacji
  created_by_id   String                              // FK do Uzytkownika
  status          String?   @default("active") @db.VarChar(20)
  created_at      DateTime? @default(now()) @db.Timestamp(6)
  updated_at      DateTime? @default(now()) @db.Timestamp(6)
  achieved_at     DateTime? @db.Timestamp(6)          // Kiedy osiagniety
  outlet          String?                             // U - Ujscie (beneficjent/miejsce docelowe)

  streams         Stream?   @relation(fields: [stream_id], references: [id], onUpdate: NoAction)
}
```

### Opis pol

| Pole | Typ | Wymagane | Element RZUT | Opis |
|------|-----|----------|--------------|------|
| `id` | String (UUID) | Auto | — | Unikalny identyfikator, generowany przez PostgreSQL |
| `result` | String | Tak | **R** | Opis konkretnego rezultatu do osiagniecia |
| `measurement` | String | Tak | **Z** | Kryteria zmierzalnosci — po czym poznam sukces |
| `deadline` | DateTime | Tak | **U** | Termin realizacji (ujscie czasowe) |
| `background` | String? | Nie | **T** | Tlo motywacyjne — dlaczego ten cel |
| `outlet` | String? | Nie | **U** | Ujscie beneficjenta — kto/co skorzysta z rezultatu |
| `current_value` | Decimal(10,2) | Nie | — | Aktualna wartosc postepu (domyslnie 0) |
| `target_value` | Decimal(10,2) | Tak | — | Wartosc docelowa do osiagniecia |
| `unit` | VarChar(50) | Nie | — | Jednostka miary (domyslnie "count") |
| `stream_id` | String? | Nie | — | Klucz obcy do strumienia (Stream) |
| `organization_id` | String | Tak | — | Klucz obcy do organizacji (multi-tenant) |
| `created_by_id` | String | Tak | — | Klucz obcy do uzytkownika tworzacego |
| `status` | VarChar(20) | Nie | — | Status celu (domyslnie "active") |
| `created_at` | DateTime | Auto | — | Data utworzenia |
| `updated_at` | DateTime | Auto | — | Data ostatniej aktualizacji |
| `achieved_at` | DateTime? | Nie | — | Data osiagniecia celu |

### Relacje w bazie

```
+------------------+       +------------------+
|     Stream       |       |  precise_goals   |
|                  |       |                  |
|  id        (PK)  |<------| stream_id  (FK)  |
|  name            |       | result           |
|  color           |       | measurement      |
|  description     |       | deadline         |
|  ...             |       | background       |
+------------------+       | target_value     |
                           | current_value    |
+------------------+       | status           |
|   Organization   |       | organization_id  |
|                  |<------| created_by_id    |
|  id        (PK)  |       | ...              |
+------------------+       +------------------+
```

Relacja ze Stream jest opcjonalna (stream_id moze byc NULL) — cel moze istniec niezaleznie od strumienia.

---

## 3. Endpointy API

System uzywa dwoch aliasow dla tego samego routera:

```
apiRouter.use('/goals', preciseGoalsRoutes);          // glowny endpoint
apiRouter.use('/precise-goals', preciseGoalsRoutes);  // alias
```

**Plik zrodlowy**: `/packages/backend/src/routes/preciseGoals.ts`

### Lista endpointow

| Metoda | Sciezka | Opis | Auth |
|--------|---------|------|------|
| `GET` | `/api/v1/goals` | Pobierz liste celow (z filtrowaniem) | Tak |
| `GET` | `/api/v1/goals/stats` | Statystyki celow (total, active, achieved, failed, paused) | Tak |
| `GET` | `/api/v1/goals/stats/overview` | Statystyki szczegolowe + approaching deadlines | Tak |
| `GET` | `/api/v1/goals/:id` | Pobierz pojedynczy cel | Tak |
| `POST` | `/api/v1/goals` | Utworz nowy cel (RZUT) | Tak |
| `PUT` | `/api/v1/goals/:id` | Aktualizuj cel | Tak |
| `PATCH` | `/api/v1/goals/:id/progress` | Aktualizuj postep celu | Tak |
| `PUT` | `/api/v1/goals/:id/progress` | Aktualizuj postep (alias PUT) | Tak |
| `POST` | `/api/v1/goals/:id/achieve` | Oznacz cel jako osiagniety | Tak |
| `DELETE` | `/api/v1/goals/:id` | Usun cel | Tak |

### Parametry zapytania GET /goals

| Parametr | Typ | Opis |
|----------|-----|------|
| `status` | string | Filtrowanie po statusie: `active`, `achieved`, `failed`, `paused` |
| `streamId` | string | Filtrowanie po ID strumienia |

### Cialo zadania POST /goals (tworzenie)

```json
{
  "result": "15 nowych klientow B2B",          // R - wymagane
  "measurement": "Zamkniete deale w CRM",       // Z - wymagane
  "deadline": "2025-03-31",                     // U - wymagane
  "background": "200K przychodu na rozwoj",     // T - opcjonalne
  "targetValue": 15,                            // wymagane
  "unit": "szt.",                               // opcjonalne (domyslnie "count")
  "streamId": "uuid-strumienia",                // opcjonalne
  "outlet": "Dzial sprzedazy"                   // opcjonalne
}
```

### Walidacja przy tworzeniu

Pola wymagane (backend zwraca 400 przy braku):
- `result` (R - Rezultat)
- `measurement` (Z - Zmierzalnosc)
- `deadline` (U - Ujscie)
- `targetValue`

### Format odpowiedzi

```json
{
  "success": true,
  "data": {
    "id": "abc-123-def",
    "result": "15 nowych klientow B2B",
    "measurement": "Zamkniete deale w CRM",
    "outlet": null,
    "deadline": "2025-03-31T00:00:00.000Z",
    "background": "200K przychodu na rozwoj",
    "currentValue": 3,
    "targetValue": 15,
    "unit": "szt.",
    "progress": 20,
    "streamId": "uuid-strumienia",
    "stream": {
      "id": "uuid-strumienia",
      "name": "Sprzedaz Q1",
      "color": "#3B82F6"
    },
    "status": "active",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-02-10T14:30:00.000Z",
    "achievedAt": null
  }
}
```

### Statystyki (GET /goals/stats)

```json
{
  "total": 12,
  "active": 7,
  "achieved": 3,
  "failed": 1,
  "paused": 1,
  "averageProgress": 54.2
}
```

### Statystyki szczegolowe (GET /goals/stats/overview)

```json
{
  "success": true,
  "data": {
    "total": 12,
    "active": 7,
    "achieved": 3,
    "failed": 1,
    "approaching": 2,
    "achievementRate": 25
  }
}
```

Pole `approaching` liczy cele aktywne z deadline w ciagu najblizszych 7 dni.

---

## 4. Komponenty frontendowe

### 4.1 GoalCard (`/packages/frontend/src/components/goals/GoalCard.tsx`)

Komponent wyswietlajacy pojedynczy cel w formie karty. Struktura wizualna odzwierciedla akronim RZUT:

```
+----------------------------------------------+
| [Status Badge]           [Edytuj] [Usun]     |
| [Kolor strumienia] Nazwa strumienia          |
+----------------------------------------------+
| R  Rezultat                                  |
|    Tekst rezultatu celu                      |
|                                              |
| Z  Zmierzalnosc                              |
|    Kryteria pomiaru sukcesu                  |
|                                              |
|    3 / 15 szt.                         20%   |
|    [==========--------------------------]    |
|                                              |
|    [    Aktualizuj postep    ]               |
|    [  Oznacz jako osiagniety ]  (jesli 100%) |
+----------------------------------------------+
| U  15.03.2025 (za 28 dni)     T  Kontekst   |
+----------------------------------------------+
```

**Kluczowe funkcje:**
- Wyswietlanie elementow RZUT z kolorowymi etykietami (R-niebieski, Z-cyan)
- Pasek postepu z dynamicznym kolorem (czerwony -> zolty -> niebieski -> zielony)
- Badge statusu: Aktywny (niebieski), Osiagniety (zielony), Nieosiagniety (czerwony), Wstrzymany (zolty)
- Inline edycja postepu (input numeryczny + Zapisz/Anuluj)
- Przycisk "Oznacz jako osiagniety" pojawia sie gdy progress >= 100%
- Sygnalizacja przekroczenia terminu (czerwona ramka i tekst)
- Wyswietlanie informacji o strumieniu (kolor + nazwa)

**Props:**

```typescript
interface GoalCardProps {
  goal: PreciseGoal;
  onEdit: (goal: PreciseGoal) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, currentValue: number) => void;
  onAchieve: (id: string) => void;
  onClick?: (goal: PreciseGoal) => void;
}
```

### 4.2 GoalForm (`/packages/frontend/src/components/goals/GoalForm.tsx`)

Formularz tworzenia/edycji celu w formie modala. Kazdy element RZUT jest wyrozniany wizualnie wlasna sekcja z kolorem tla:

```
+----------------------------------------------+
|  Nowy cel precyzyjny                    [X]  |
|  Zdefiniuj cel metoda RZUT                   |
+----------------------------------------------+
|                                              |
|  +----- niebieskie tlo -----------------+    |
|  | R  Rezultat - Co konkretnie          |    |
|  |    powstanie? *                       |    |
|  | [Pole tekstowe]                      |    |
|  | Opisz konkretny, namacalny efekt     |    |
|  +--------------------------------------+    |
|                                              |
|  +----- cyanowe tlo --------------------+    |
|  | Z  Zmierzalnosc - Po czym poznam     |    |
|  |    sukces? *                          |    |
|  | [Pole tekstowe]                      |    |
|  | Wartosc docelowa: [100]  Jedn: [%]   |    |
|  | Aktualna wartosc: [0] (tylko edycja) |    |
|  +--------------------------------------+    |
|                                              |
|  +----- tealowe tlo --------------------+    |
|  | U  Ujscie - Do kiedy? *              |    |
|  | [Date picker]                        |    |
|  +--------------------------------------+    |
|                                              |
|  +----- emeraldowe tlo -----------------+    |
|  | T  Tlo - Dlaczego ten cel?           |    |
|  | [Textarea]                           |    |
|  +--------------------------------------+    |
|                                              |
|  Przypisz do strumienia: [-- Wybierz --]     |
|  Status: [Aktywny] (tylko edycja)            |
|                                              |
+----------------------------------------------+
|              [Anuluj]  [Utworz cel]           |
+----------------------------------------------+
```

**Dostepne jednostki miary:** `%`, `szt.`, `PLN`, `USD`, `EUR`, `h`, `dni`, `kg`, `km`, `pkt`

**Walidacja po stronie frontendu:**
- `result` — wymagane (alert: "Rezultat jest wymagany")
- `measurement` — wymagane (alert: "Zmierzalnosc jest wymagana")
- `deadline` — wymagane (alert: "Termin (Ujscie) jest wymagany")
- `targetValue` — minimum 1
- Lista strumieni filtrowana po `status === 'ACTIVE'`

### 4.3 GoalsTodayWidget (`/packages/frontend/src/components/dashboard-v2/GoalsTodayWidget.tsx`)

Widget dashboardowy wyswietlajacy podsumowanie celow. Uzywa danych z endpointu `/goals/stats/overview`:

- Liczba osiagnietych / total
- Wskaznik osiagniec (achievementRate %)
- Pasek postepu (fioletowy)
- Trzy kafelki: Osiagniete (zielony), Aktywne (niebieski), Zblizajace (pomaranczowy)

### 4.4 GoalRecommendations (`/packages/frontend/src/components/dashboard/GoalRecommendations.tsx`)

Komponent dashboardowy wyswietlajacy rekomendacje celow generowane przez AI. Pokazuje karty z rozwijana lista szczegolow, kryteriami SMART i kamienami milowymi.

### 4.5 Typy TypeScript

**Plik**: `/packages/frontend/src/types/streams.ts`

```typescript
type GoalStatus = 'active' | 'achieved' | 'failed' | 'paused';

interface PreciseGoal {
  id: string;
  result: string;            // R
  measurement: string;       // Z
  deadline: string;          // U (ISO date)
  background?: string;       // T
  targetValue: number;
  currentValue: number;
  unit: string;
  status: GoalStatus;
  streamId?: string;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  stream?: Pick<Stream, 'id' | 'name' | 'color'>;
}

interface CreateGoalRequest {
  result: string;
  measurement: string;
  deadline: string;
  background?: string;
  targetValue: number;
  unit?: string;
  streamId?: string;
}

interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
  currentValue?: number;
  status?: GoalStatus;
}
```

### 4.6 Klient API

**Plik**: `/packages/frontend/src/lib/api/goals.ts`

Eksportuje obiekt `goalsApi` z metodami:

| Metoda | Wywolanie API | Opis |
|--------|---------------|------|
| `getGoals(params?)` | `GET /goals` | Pobierz liste celow z filtrami |
| `getGoal(id)` | `GET /goals/:id` | Pobierz pojedynczy cel |
| `createGoal(data)` | `POST /goals` | Utworz nowy cel RZUT |
| `updateGoal(id, data)` | `PUT /goals/:id` | Aktualizuj cel |
| `deleteGoal(id)` | `DELETE /goals/:id` | Usun cel |
| `updateProgress(id, currentValue)` | `PATCH /goals/:id/progress` | Aktualizuj wartosc postepu |
| `achieveGoal(id)` | `POST /goals/:id/achieve` | Oznacz jako osiagniety |
| `getGoalsStats()` | `GET /goals/stats` | Pobierz statystyki |

---

## 5. Powiazanie ze Strumieniami (Streams)

Cele Precyzyjne sa opcjonalnie powiazane ze Strumieniami (Streams) poprzez pole `stream_id` (FK).

### Relacja w modelu Prisma

W modelu `Stream`:
```prisma
model Stream {
  ...
  precise_goals  precise_goals[]
  ...
}
```

W modelu `precise_goals`:
```prisma
model precise_goals {
  ...
  stream_id  String?
  streams    Stream?  @relation(fields: [stream_id], references: [id], onUpdate: NoAction)
}
```

### Semantyka powiazania

```
Strumien "Sprzedaz Q1 2025"
  |
  +-- Cel: "15 nowych klientow B2B" (RZUT)
  +-- Cel: "200K przychodu"         (RZUT)
  +-- Cel: "5 rekomendacji klient." (RZUT)
  |
  +-- Zadania strumienia
  +-- Elementy inbox
  +-- Kanaly komunikacji
```

Powiazanie ze strumieniem pozwala:
- **Grupowac cele** wokol kontekstu biznesowego (np. projekt, obszar odpowiedzialnosci)
- **Filtrowac cele** po strumieniu (parametr `streamId` w GET /goals)
- **Wyswietlac kolor strumienia** w karcie celu (GoalCard)
- **Laczyc cele z workflow GTD** — kazdy strumien ma role GTD (PROJECTS, AREAS, etc.)

Cel moze istniec bez strumienia (stream_id = NULL) — jest wtedy "wolnym celem" organizacji.

### Cele jako hierarchia strumieni

Zgodnie z metodologia Sorto Streams, cele moga byc organizowane hierarchicznie:

```
Strumien "Cele 2025"
   |
   +-- Strumien "Q1: Pozyskac 15 klientow"
   |   +-- Strumien "Styczen: 5 klientow"
   |   |   +-- Zadanie: Lista prospektow
   |   |   +-- Zadanie: Kampania cold mail
   |   +-- Strumien "Luty: 5 klientow"
   |   +-- Strumien "Marzec: 5 klientow"
   |
   +-- Strumien "Q2: Zwiekszyc retencje"
```

---

## 6. Sledzenie postepu

### Mechanizm pomiaru

Postep celu jest mierzony przez porownanie dwoch wartosci:

```
progress = (current_value / target_value) * 100
```

| Pole | Typ | Opis |
|------|-----|------|
| `current_value` | Decimal(10,2) | Aktualna wartosc (domyslnie 0) |
| `target_value` | Decimal(10,2) | Wartosc docelowa (wymagane) |
| `unit` | VarChar(50) | Jednostka miary (np. "szt.", "%", "PLN") |

### Aktualizacja postepu

Endpoint `PATCH /goals/:id/progress` przyjmuje:

```json
{
  "currentValue": 12
}
```

### Automatyczne osiagniecie

Gdy `currentValue >= target_value`, backend automatycznie:
1. Ustawia `status = 'achieved'`
2. Ustawia `achieved_at = new Date()`

```typescript
// Fragment preciseGoals.ts
if (currentValue >= Number(existingGoal.target_value)) {
  updateData.status = 'achieved';
  updateData.achieved_at = new Date();
}
```

### Wizualizacja postepu (GoalCard)

Kolor paska postepu zmienia sie dynamicznie:

| Zakres postepu | Kolor | Klasa CSS |
|----------------|-------|-----------|
| 0-24% | Czerwony | `bg-red-500` |
| 25-49% | Zolty | `bg-amber-500` |
| 50-74% | Cyan | `bg-cyan-500` |
| 75-99% | Niebieski | `bg-blue-500` |
| 100% | Zielony | `bg-green-500` |

### Manualne oznaczanie osiagniecia

Endpoint `POST /goals/:id/achieve` natychmiast:
1. Ustawia `status = 'achieved'`
2. Ustawia `achieved_at = now()`
3. Ustawia `current_value = target_value` (wyrownanie postepu do 100%)

---

## 7. Cykl zycia statusow

### Dostepne statusy

| Status | Etykieta (PL) | Kolor badge | Opis |
|--------|--------------|-------------|------|
| `active` | Aktywny | Niebieski | Cel w trakcie realizacji (domyslny) |
| `achieved` | Osiagniety | Zielony | Cel osiagniety (current >= target) |
| `failed` | Nieosiagniety | Czerwony | Cel nie zostal osiagniety w terminie |
| `paused` | Wstrzymany | Zolty (amber) | Cel tymczasowo zawieszony |

### Diagram przejsc statusow

```
                    +-- [Aktualizuj postep] --> (active)
                    |
                    |   current >= target
  [Utworz cel] ---> (active) ------------------> (achieved)
                    |                               ^
                    |   [Oznacz jako osiagniety]     |
                    +-------------------------------+
                    |
                    |   [Zmien status]
                    +---> (paused) ---> (active)
                    |                     |
                    |   [Zmien status]    |
                    +---> (failed)  <-----+
                                    (deadline minol)
```

### Szczegolowy przepyw

1. **Utworzenie** — cel startuje ze statusem `active`, `current_value = 0`
2. **Aktualizacja postepu** — `current_value` rosnie w kierunku `target_value`
3. **Automatyczne osiagniecie** — jesli `current_value >= target_value`, status zmienia sie na `achieved`
4. **Manualne osiagniecie** — uzytkownik klika "Oznacz jako osiagniety" (dostepne przy 100%)
5. **Wstrzymanie** — zmiana statusu na `paused` (edycja celu)
6. **Wznowienie** — zmiana z `paused` z powrotem na `active`
7. **Porazka** — zmiana statusu na `failed` (np. po miniecieu deadline)
8. **Usuwanie** — fizyczne usuniecie z bazy (DELETE)

### Znacznik czasu osiagniecia

Pole `achieved_at` jest ustawiane:
- Automatycznie — przy auto-achieve (current >= target) w endpointach progress
- Recznie — przy POST /goals/:id/achieve
- Przez edycje — przy PUT /goals/:id z `status: 'achieved'`

---

## 8. Integracja z AI

### 8.1 Silnik rekomendacji celow (GoalRecommendationEngine)

**Plik**: `/packages/backend/src/services/ai/GoalRecommendationEngine.ts`

System AI analizuje aktywnosc uzytkownika i generuje spersonalizowane rekomendacje celow.

```
Dane uzytkownika (zadania, projekty, konteksty)
       |
       v
+----------------------------+
| GoalRecommendationEngine   |
|                            |
| 1. gatherUserContext()     |  <-- zbieranie danych z ostatnich 30/90 dni
| 2. analyzeAndRecommend()   |  <-- analiza wzorcow aktywnosci
| 3. rankRecommendations()   |  <-- sortowanie wg priorytetu i pewnosci
+----------------------------+
       |
       v
Rekomendacje celow (max 8)
```

### Endpoint AI

```
GET /api/v1/ai/goal-recommendations
```

Wymaga autentykacji. Zwraca tablice rekomendacji z kategoriami:
- `PRODUCTIVITY` — poprawa wskaznika ukonczenia zadan
- `LEARNING` — rozwoj zawodowy i nauka nowych umiejetnosci
- `HEALTH` — rownowaga praca-zycie
- `CAREER` — rozwoj kariery i siec kontaktow
- `BUSINESS` — optymalizacja procesow zespolowych

### Kontekst analizowany przez AI

| Dane | Okres | Cel analizy |
|------|-------|-------------|
| Zadania uzytkownika | 30 dni | Wskaznik ukonczenia, sredni czas realizacji |
| Projekty | 90 dni | Ilosc i roznorodnosc projektow |
| Konteksty GTD | 30 dni | Preferowane konteksty pracy |
| Completion rate | 30 dni | < 70% = sugestia poprawy produktywnosci |

### Logika wyzwalania rekomendacji

```
Completion rate < 70%        --> Cel produktywnosci
Brak zadan "learning"        --> Cel nauki
Completion rate > 85%        --> Cel work-life balance (ryzyko wypalenia)
   LUB > 30 zadan w 30 dni
> 10 zadan w 30 dni          --> Cel rozwoju kariery
> 3 projekty w 90 dni        --> Cel optymalizacji procesow
```

### 8.2 Komponent GoalRecommendations (frontend)

Wyswietla rekomendacje AI na dashboardzie z mozliwoscia:
- Przegladania szczegolow (rozwijane karty)
- Przegladania kryteriow SMART (z mozliwoscia konwersji na RZUT)
- Przegladania sugerowanych akcji i kamieni milowych
- Odrzucania nieistotnych rekomendacji
- Tworzenia celow na podstawie rekomendacji (przycisk "Create Goal")

### 8.3 Przepyw: od emaila do celu

W kontekscie pelnego systemu Sorto CRM, cele moga byc proponowane na podstawie analizy komunikacji:

```
Email przychodzacy
       |
       v
AI analiza tresci (urgency, intent, entities)
       |
       v
Sugestia akcji GTD (DO/DEFER/PROJECT/...)
       |
       v
Jesli wykryto cel biznesowy:
       |
       v
Propozycja celu RZUT:
  R: Wyekstrahowany rezultat z tresci emaila
  Z: Sugerowane metryki
  U: Termin z emaila lub domyslny
  T: Kontekst konwersacji
       |
       v
Uzytkownik akceptuje/modyfikuje w GoalForm
       |
       v
POST /goals --> Cel Precyzyjny w bazie
```

---

## 9. Przyklady celow RZUT w kontekscie biznesowym

### Przyklad 1: Sprzedaz

```
+--------------------------------------------+
| R: 15 nowych klientow B2B z sektora IT     |
| Z: Zamkniete deale w pipeline CRM           |
|    target: 15 szt.  current: 3 szt. (20%)  |
| U: Do 31.03.2025 (koniec Q1)               |
| T: Osiagniecie 200K przychodu w Q1         |
+--------------------------------------------+
Stream: Sprzedaz Q1 2025
```

### Przyklad 2: Rozwoj produktu

```
+--------------------------------------------+
| R: Ukonczyc migracje systemu STREAMS        |
| Z: Wszystkie moduly dzialaja poprawnie      |
|    target: 100%  current: 75% (75%)         |
| U: Do 15.07.2025                            |
| T: Unifikacja metodologii produktywnosci    |
+--------------------------------------------+
Stream: Rozwoj produktu
```

### Przyklad 3: Marketing

```
+--------------------------------------------+
| R: 500 nowych subskrybentow newslettera     |
| Z: Zweryfikowane adresy email w bazie       |
|    target: 500 szt.  current: 182 szt.     |
| U: Do 30.06.2025                            |
| T: Budowanie bazy pod launch nowego SaaS    |
+--------------------------------------------+
Stream: Marketing cyfrowy
```

### Przyklad 4: Rozwoj osobisty

```
+--------------------------------------------+
| R: Zdac egzamin certyfikacyjny AWS SA Pro   |
| Z: Wynik egzaminu >= 750 pkt               |
|    target: 750 pkt  current: 0 pkt         |
| U: Do 01.09.2025                            |
| T: Awans na stanowisko Lead Architecta     |
+--------------------------------------------+
Stream: Rozwoj kompetencji
```

### Przyklad 5: Finanse

```
+--------------------------------------------+
| R: Zmniejszyc koszty infrastruktury o 30%   |
| Z: Miesieczny rachunek AWS < 5000 PLN       |
|    target: 5000 PLN  current: 7200 PLN     |
| U: Do 28.02.2025                            |
| T: Optymalizacja budzetu IT na nowy rok     |
+--------------------------------------------+
Stream: Operacje IT
```

---

## 10. Diagram cyklu zycia celu

### Pelny cykl zycia celu precyzyjnego

```
   [Uzytkownik]         [AI System]           [Email/Inbox]
       |                    |                      |
       |  tworzy cel        |  rekomenduje cel     |  sugeruje cel
       +--------+           +--------+             +--------+
                |                    |                      |
                v                    v                      v
           +------------------------------------------------+
           |            GoalForm (modal)                     |
           |  R: [rezultat]    Z: [zmierzalnosc]            |
           |  U: [deadline]    T: [tlo]                     |
           |  Target: [wartosc]  Unit: [jednostka]          |
           |  Stream: [opcjonalnie]                         |
           +------------------------+-----------------------+
                                    |
                                    v
                    POST /api/v1/goals
                                    |
                                    v
                       +-------------------+
                       |   status: active  |
                       |   current: 0      |
                       |   target: N       |
                       +--------+----------+
                                |
                   +------------+------------+
                   |            |            |
                   v            v            v
           [Aktualizuj    [Wstrzymaj]   [Oznacz jako
            postep]                      nieosiagniety]
                   |            |            |
                   v            v            v
           current += X    status:       status:
                   |       paused        failed
                   |            |
                   v            |
           current >= target?   |
           /            \       |
          TAK           NIE    [Wznow]
           |             |      |
           v             |      v
     status:             |   status:
     achieved            |   active
     achieved_at:        |      |
     now()               +------+
           |
           v
    +-------------------+
    |  CEL OSIAGNIETY   |
    |  progress: 100%   |
    |  achieved_at: ... |
    +-------------------+
```

### Przepyw danych w systemie

```
+------------------+     +-----------------+     +-------------------+
|   Frontend       |     |    Backend      |     |   PostgreSQL      |
|                  |     |                 |     |                   |
| GoalForm ------->|---->| POST /goals --->|---->| INSERT            |
|                  |     |                 |     | precise_goals     |
| GoalCard <-------|<----| GET /goals <----|<----| SELECT + JOIN     |
|                  |     |                 |     | streams           |
| progressInput -->|---->| PATCH progress->|---->| UPDATE            |
|                  |     | auto-achieve?   |     | current_value     |
| GoalsTodayWidget |<----| GET stats <-----|<----| COUNT + AVG       |
|                  |     |                 |     |                   |
| GoalRecommend. <-|<----| GET /ai/goal-  |     |                   |
|                  |     | recommendations |     |                   |
+------------------+     +-----------------+     +-------------------+
```

---

## Pliki zrodlowe — podsumowanie

| Warstwa | Sciezka | Opis |
|---------|---------|------|
| **Model bazy** | `packages/backend/prisma/schema.prisma` | Model `precise_goals` (linia ~2889) |
| **Route backend** | `packages/backend/src/routes/preciseGoals.ts` | Wszystkie endpointy CRUD + progress + achieve |
| **Route goals (legacy)** | `packages/backend/src/routes/goals.ts` | GTD Horizons (oddzielny model `Goal`, nie mylc!) |
| **Rejestracja route** | `packages/backend/src/app.ts` | `/goals` i `/precise-goals` (linia ~306-307) |
| **AI engine** | `packages/backend/src/services/ai/GoalRecommendationEngine.ts` | Silnik rekomendacji celow |
| **AI route** | `packages/backend/src/routes/ai.ts` | Endpoint `/ai/goal-recommendations` |
| **Typy TS** | `packages/frontend/src/types/streams.ts` | `PreciseGoal`, `GoalStatus`, `CreateGoalRequest` |
| **API client** | `packages/frontend/src/lib/api/goals.ts` | `goalsApi` — klient HTTP |
| **GoalCard** | `packages/frontend/src/components/goals/GoalCard.tsx` | Karta celu (RZUT) |
| **GoalForm** | `packages/frontend/src/components/goals/GoalForm.tsx` | Formularz tworzenia/edycji |
| **GoalCard test** | `packages/frontend/src/components/goals/__tests__/GoalCard.test.tsx` | Testy jednostkowe (15 test-casow) |
| **Dashboard widget** | `packages/frontend/src/components/dashboard-v2/GoalsTodayWidget.tsx` | Widget statystyk |
| **AI recommendations** | `packages/frontend/src/components/dashboard/GoalRecommendations.tsx` | Rekomendacje AI |
| **Metodologia** | `SORTO_STREAMS_METHODOLOGY_v3.md` | Rozdzial 13: System Celow Precyzyjnych |

---

## Uwaga: roznica miedzy `goals` a `precise-goals`

W systemie istnieja DWA osobne modele zwiazane z celami:

1. **`precise_goals`** (ten dokument) — Cele Precyzyjne RZUT, model `precise_goals` w Prisma, obslugiwane przez `preciseGoals.ts`
2. **`Goal`** (GTD Horizons) — 6 poziomow perspektywy GTD (Runway, Projects, Areas, Goals, Vision, Purpose), model `Goal` w Prisma, obslugiwane przez `goals.ts`

Oba sa dostepne pod `/api/v1/goals`, ale obslugiwane przez rozne routery. W aktualnej konfiguracji `app.ts` priorytet ma `preciseGoals.ts`:

```typescript
apiRouter.use('/goals', preciseGoalsRoutes);          // Cele Precyzyjne (RZUT)
apiRouter.use('/precise-goals', preciseGoalsRoutes);  // Alias
```

GTD Horizons sa dostepne pod osobnym endpointem.
