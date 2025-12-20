# SORTO STREAMS - Metodologia Zarządzania Produktywnością

## 📋 Spis Treści

1. [Wprowadzenie](#wprowadzenie)
2. [Filozofia STREAMS](#filozofia-streams)
3. [Kluczowe Pojęcia](#kluczowe-pojęcia)
4. [Strumienie (Streams)](#strumienie-streams)
5. [Cele Precyzyjne (RZUT)](#cele-precyzyjne-rzut)
6. [Źródło (Source)](#źródło-source)
7. [Tagi (Tags)](#tagi-tags)
8. [Migracja z GTD/SMART](#migracja-z-gtdsmrt)
9. [API Reference](#api-reference)

---

## 🎯 Wprowadzenie

### Czym jest SORTO STREAMS?

SORTO STREAMS to autorska metodologia zarządzania produktywnością, która zastępuje i unifikuje wcześniejsze podejścia oparte na GTD (Getting Things Done) oraz SMART Goals.

Kluczowa metafora: **Strumień** (Stream) - płynący przepływ pracy, który może być:
- **FLOWING** (Płynący) - aktywny strumień z bieżącymi zadaniami
- **FROZEN** (Zamrożony) - wstrzymany strumień (odpowiednik GTD "Kiedyś/Może")
- **TEMPLATE** (Szablon) - wzorzec do tworzenia nowych strumieni

---

## 🌊 Filozofia STREAMS

### Od GTD do STREAMS

| GTD Concept | STREAMS Equivalent |
|-------------|-------------------|
| Inbox (Skrzynka) | Źródło (Source) |
| Contexts (@) | Tagi (Tags) |
| Projects | Strumienie projektowe |
| Someday/Maybe | Strumienie FROZEN |
| Horizons of Focus | Cele Precyzyjne (RZUT) |
| Next Actions | Zadania w strumieniu |
| Waiting For | Zadania ze statusem WAITING |

### Wzorce Strumieni (Stream Patterns)

Każdy strumień może mieć określony wzorzec:

1. **Projektowy (Project)** - Strumień z określonym końcem i rezultatem
2. **Ciągły (Continuous)** - Obszar życia bez określonego końca
3. **Referencyjny (Reference)** - Baza wiedzy i materiały
4. **Klient (Client)** - Strumień dedykowany konkretnemu klientowi
5. **Pipeline** - Strumień sprzedażowy/procesowy
6. **Przestrzeń (Workspace)** - Główna przestrzeń robocza
7. **Własny (Custom)** - Niestandardowy wzorzec

---

## 🔑 Kluczowe Pojęcia

### Strumień (Stream)

```typescript
interface Stream {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: 'FLOWING' | 'FROZEN' | 'TEMPLATE';
  pattern?: 'project' | 'continuous' | 'reference' | 'client' | 'pipeline' | 'workspace' | 'custom';
  parentId?: string;  // dla dopływów (hierarchia)
  organizationId: string;
  createdById: string;
}
```

### Flow Score

Każdy strumień ma dynamiczny **Flow Score** (0-100), który wskazuje:
- Ilość aktywnych zadań
- Postęp realizacji celów
- Tempo przepływu zadań
- Zdrowie strumienia

---

## 🎯 Cele Precyzyjne (RZUT)

### Metodologia RZUT

RZUT to polska alternatywa dla SMART, dostosowana do kontekstu strumieni:

| Litera | Znaczenie | Pytanie |
|--------|-----------|---------|
| **R** | Rezultat | Co konkretnie powstanie? |
| **Z** | Zmierzalność | Po czym poznam sukces? |
| **U** | Ujście | Do kiedy? (deadline) |
| **T** | Tło | Dlaczego ten cel? |

### Struktura Celu

```typescript
interface PreciseGoal {
  id: string;

  // RZUT
  result: string;        // R - Rezultat
  measurement: string;   // Z - Zmierzalność
  deadline: string;      // U - Ujście (termin)
  background?: string;   // T - Tło

  // Metryki postępu
  currentValue: number;
  targetValue: number;
  unit: string;

  // Powiązanie ze strumieniem
  streamId?: string;

  // Status
  status: 'active' | 'achieved' | 'failed' | 'paused';
}
```

### Przykład Celu RZUT

```
R (Rezultat): Ukończyć migrację systemu do STREAMS
Z (Zmierzalność): 100% komponentów przeniesionych, 0 błędów krytycznych
U (Ujście): 2024-12-31
T (Tło): Unifikacja metodologii produktywności w całej organizacji
```

---

## 📥 Źródło (Source)

Źródło zastępuje GTD Inbox - jest miejscem gdzie trafiają wszystkie nowe elementy:

```typescript
interface SourceItem {
  id: string;
  content: string;
  type: 'TEXT' | 'EMAIL' | 'VOICE' | 'FILE' | 'LINK';
  status: 'NEW' | 'PROCESSING' | 'ROUTED' | 'ARCHIVED';
  aiSuggestion?: {
    suggestedStream?: string;
    suggestedTags?: string[];
    confidence: number;
  };
}
```

### Przepływ Source

1. **Capture** - Element trafia do Źródła
2. **Process** - AI sugeruje strumień i tagi
3. **Route** - Użytkownik kieruje do odpowiedniego strumienia
4. **Transform** - Element staje się zadaniem lub notatką

---

## 🏷️ Tagi (Tags)

Tagi zastępują GTD Contexts. Są bardziej elastyczne i wielowymiarowe:

```typescript
interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
}
```

### Przykłady Tagów

- `@komputer` - zadania wymagające komputera
- `@telefon` - rozmowy do wykonania
- `@biuro` - zadania w biurze
- `#pilne` - oznaczenie priorytetu
- `#energia-wysoka` - dla zadań wymagających skupienia

---

## 🔄 Migracja z GTD/SMART

### Automatyczne Przekierowania

System zachowuje kompatybilność wsteczną:

| Stara Trasa | Nowa Trasa |
|-------------|------------|
| `/gtd/inbox` | `/crm/dashboard/source` |
| `/gtd/contexts` | `/crm/dashboard/tags` |
| `/gtd/someday-maybe` | `/crm/dashboard/streams?status=frozen` |
| `/gtd/waiting-for` | `/crm/dashboard/tasks?status=waiting` |
| `/gtd/next-actions` | `/crm/dashboard/tasks` |
| `/gtd-buckets` | `/crm/dashboard/streams` |
| `/gtd-horizons` | `/crm/dashboard/goals` |
| `/gtd-streams` | `/crm/dashboard/streams` |
| `/gtd-map` | `/crm/dashboard/streams-map` |

### Terminologia

| Stare | Nowe |
|-------|------|
| Bucket | Stream |
| Smart Score | Flow Score |
| Smart Analysis | Flow Analysis |
| Context | Tag |
| Inbox | Źródło (Source) |
| Horizons | Cele (Goals) |

---

## 🔌 API Reference

### Streams API

```
GET    /api/streams              - Lista strumieni
POST   /api/streams              - Utwórz strumień
GET    /api/streams/:id          - Szczegóły strumienia
PUT    /api/streams/:id          - Aktualizuj strumień
DELETE /api/streams/:id          - Usuń strumień
PATCH  /api/streams/:id/status   - Zmień status (FLOWING/FROZEN)
```

### Goals API

```
GET    /api/goals                - Lista celów
POST   /api/goals                - Utwórz cel RZUT
GET    /api/goals/:id            - Szczegóły celu
PUT    /api/goals/:id            - Aktualizuj cel
DELETE /api/goals/:id            - Usuń cel
PATCH  /api/goals/:id/progress   - Aktualizuj postęp
PATCH  /api/goals/:id/achieve    - Oznacz jako osiągnięty
```

### Source API

```
GET    /api/source               - Lista elementów źródła
POST   /api/source               - Dodaj element
POST   /api/source/:id/route     - Przekieruj do strumienia
DELETE /api/source/:id           - Usuń element
```

### Tags API

```
GET    /api/tags                 - Lista tagów
POST   /api/tags                 - Utwórz tag
PUT    /api/tags/:id             - Aktualizuj tag
DELETE /api/tags/:id             - Usuń tag
```

---

## 📊 Statusy i Stany

### Status Strumienia

```
FLOWING  - Aktywny strumień, zadania płyną
FROZEN   - Zamrożony, wstrzymany do przyszłości
TEMPLATE - Szablon do tworzenia nowych strumieni
```

### Status Celu

```
active   - Cel aktywny, w realizacji
achieved - Cel osiągnięty
failed   - Cel nieosiągnięty (przekroczony deadline)
paused   - Cel wstrzymany
```

### Status Zadania

```
NEW         - Nowe zadanie
IN_PROGRESS - W trakcie realizacji
WAITING     - Oczekuje na kogoś/coś
COMPLETED   - Ukończone
CANCELED    - Anulowane
```

---

## 🎨 Kolorystyka UI

### Statusy Strumieni

- **FLOWING**: Niebieski (#3B82F6)
- **FROZEN**: Szary (#64748B)
- **TEMPLATE**: Fioletowy (#A855F7)

### Wzorce Strumieni

- **Project**: Fioletowy
- **Continuous**: Zielony
- **Reference**: Bursztynowy
- **Client**: Indygo
- **Pipeline**: Różowy
- **Workspace**: Niebieski
- **Custom**: Szary

### RZUT (Cele)

- **R (Rezultat)**: Niebieski
- **Z (Zmierzalność)**: Cyjan
- **U (Ujście)**: Morski (Teal)
- **T (Tło)**: Szmaragdowy

---

## 🚀 Kolejne Kroki

1. **Faza 17**: Integracja z API backendu
2. **Faza 18**: Dashboard STREAMS z wizualizacjami
3. **Faza 19**: AI-powered routing w Source
4. **Faza 20**: Mobile-first optymalizacje

---

*Dokumentacja SORTO STREAMS v1.0 - Listopad 2025*
