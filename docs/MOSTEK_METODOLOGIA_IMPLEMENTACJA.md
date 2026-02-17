# Mostek: Metodologia v3 ↔ Implementacja techniczna

> Dokument wyjaśniający relację między uproszczonym modelem mentalnym
> (Metodologia v3) a bogatszą implementacją techniczną (kod).
> Wersja: 1.0 | Data: 2026-02-17

---

## Dlaczego ten dokument istnieje?

Metodologia v3 (`SORTO_STREAMS_METHODOLOGY_v3.md`) opisuje **model mentalny dla użytkownika** — dwa koncepty (Źródło + Strumień), metafora wodna, zero żargonu technicznego.

Implementacja techniczna jest bogatsza: 7+ ról strumieni (StreamRole), konfiguracja per rola, reguły routingu, AI pipeline. To nie jest błąd — to celowe rozdzielenie warstw.

```
┌─────────────────────────────────────────────────────────┐
│  METODOLOGIA v3                                          │
│  "Co użytkownik widzi i rozumie"                         │
│                                                          │
│  ⚪ Źródło → 🌊 Strumienie (płyną / zamarzają)           │
│  Wzorce: projektowy, ciągły, referencyjny, zamrożony     │
│  Cele: RZUT (Rezultat, Zmierzalność, Ujście, Tło)       │
├──────────────────────────────────────────────────────────┤
│  MOSTEK (ten dokument)                                   │
│  "Jak jedno mapuje się na drugie"                        │
├──────────────────────────────────────────────────────────┤
│  IMPLEMENTACJA                                           │
│  "Co system robi pod spodem"                             │
│                                                          │
│  StreamRole: INBOX, PROJECTS, AREAS, REFERENCE,          │
│              NEXT_ACTIONS, WAITING_FOR, SOMEDAY_MAYBE,   │
│              CONTEXTS, CUSTOM                            │
│  StreamType: WORKSPACE, PROJECT, AREA, CONTEXT, ...      │
│  StreamStatus: ACTIVE, FLOWING, FROZEN, ARCHIVED, ...    │
│  AI: 6 punktów wejścia, pipeline emailowy, HITL          │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Dwa koncepty → siedem ról

Metodologia mówi: **Źródło + Strumień**. To prawda z perspektywy użytkownika. Ale AI potrzebuje więcej precyzji, żeby wiedzieć *jak* routować elementy. Dlatego implementacja rozróżnia **role strumieni** (StreamRole).

### Mapowanie

| Koncept v3 | StreamRole | Dlaczego AI potrzebuje tej roli |
|------------|------------|--------------------------------|
| **Źródło** | `INBOX` | AI wie: tu trafia wszystko nowe. Cel: opróżnić. |
| **Strumień projektowy** | `PROJECTS` | AI wie: ma deadline, cel końcowy, zamrozi się po zakończeniu. |
| **Strumień ciągły** | `AREAS` | AI wie: bez deadline'u, cykliczne przeglądy, nie zamrażaj. |
| **Strumień referencyjny** | `REFERENCE` | AI wie: nie wymaga akcji, wyszukiwanie semantyczne, RAG. |
| **Zamrożony strumień** | `SOMEDAY_MAYBE` | AI wie: domyślnie FROZEN, przypomnienia podczas przeglądu. |
| *(zadania do zrobienia)* | `NEXT_ACTIONS` | AI wie: konkretne, wykonalne, z kontekstem i energią. |
| *(czekam na odpowiedź)* | `WAITING_FOR` | AI wie: delegowane, follow-up reminders, auto-eskalacja. |
| *(kontekst wykonania)* | `CONTEXTS` | AI wie: filtrowanie po miejscu/narzędziu (@computer, @phone). |
| *(własny)* | `CUSTOM` | User definiuje zachowanie. |

### Dlaczego NEXT_ACTIONS i WAITING_FOR istnieją?

Metodologia v3 mówi: "zadania w strumieniu". Nie potrzebuje osobnych kategorii — użytkownik po prostu dodaje zadania do strumienia projektowego czy ciągłego.

Ale **AI musi wiedzieć** na poziomie systemu:
- Czy to zadanie wymaga **mojej** akcji teraz? → `NEXT_ACTIONS`
- Czy to czeka na **kogoś innego**? → `WAITING_FOR`

To nie jest terminologia GTD — to **informacja routingowa dla AI**. Użytkownik nie musi o tym wiedzieć, ale system musi, żeby:
- poranny briefing pokazał właściwe priorytety
- follow-up reminders działały
- autopilot wiedział co z czym

### Zasada: użytkownik widzi strumienie, system widzi role

```
UŻYTKOWNIK WIDZI:                    SYSTEM WIE:
─────────────────                    ────────────
🌊 ABC Okna                         StreamRole: PROJECTS
🌊 Zdrowie                          StreamRole: AREAS
🌊 Baza wiedzy                      StreamRole: REFERENCE
🌊 Kiedyś/Może                      StreamRole: SOMEDAY_MAYBE (FROZEN)

Użytkownik NIE widzi "NEXT_ACTIONS"   System WEWNĘTRZNIE taguje zadania
jako osobnego strumienia.             w strumieniach jako next_action
                                      lub waiting_for dla routingu AI.
```

---

## 2. Wzorce użycia → konfiguracja per rola

Metodologia v3 mówi o "wzorcach":
- Strumień projektowy (ma deadline)
- Strumień ciągły (bez deadline'u)
- Strumień referencyjny (wiedza)
- Zamrożony (nieaktywny)

Implementacja realizuje to przez **konfigurację per StreamRole** (`streamConfig` / `gtdConfig`):

| Wzorzec v3 | StreamRole | Domyślna konfiguracja |
|------------|------------|----------------------|
| Projektowy | PROJECTS | `reviewFrequency: WEEKLY`, `enableAI: true` |
| Ciągły | AREAS | `reviewFrequency: MONTHLY` |
| Referencyjny | REFERENCE | `enableAI: true` (semantic search) |
| Zamrożony | SOMEDAY_MAYBE | `reviewFrequency: MONTHLY`, domyślnie FROZEN |
| Źródło | INBOX | `autoProcessing: false`, `processAfterDays: 3` |

Każda rola ma inne **zachowanie domyślne**, ale użytkownik tego nie konfiguruje ręcznie — system dobiera konfigurację na podstawie tego jak strumień jest używany.

---

## 3. Terminologia — co mówimy gdzie

| Kontekst | Używamy | NIE używamy |
|----------|---------|-------------|
| **UI / onboarding** | Źródło, Strumień, dopływ, płynie, zamrożony | StreamRole, NEXT_ACTIONS, WAITING_FOR |
| **Dokumentacja użytkownika** | Strumień projektowy, ciągły, referencyjny | enum, config, pipeline |
| **Dokumentacja techniczna** | StreamRole, StreamType, StreamStatus | GTD, Getting Things Done |
| **Kod** | `streamRole`, `streamConfig` (alias `gtdConfig` - historyczne) | Nowe nazwy GTD |
| **AI prompty** | Rola strumienia, kontekst, energia | GTD |
| **API** | `/stream-management`, `/streams` | `/gtd-streams` (deprecated) |

### Historyczne nazwy w kodzie

Kolumny `gtdConfig` i `gtdRole` w bazie danych mają nazwy historyczne. W kodzie TypeScript używamy aliasów:
- `gtdConfig` → traktuj jako `streamConfig`
- `gtdRole` → traktuj jako `streamRole`

Zmiana nazw kolumn w bazie wymagałaby migracji — to zadanie na przyszłość.

---

## 4. Cele Precyzyjne (RZUT) — metodologia → implementacja

| Element RZUT | Pole w Prisma (`precise_goals`) | Opis |
|-------------|-------------------------------|------|
| **R** — Rezultat | `result` | Co konkretnie powstanie |
| **Z** — Zmierzalność | `measurement` + `current_value` + `target_value` | Jak i ile |
| **U** — Ujście | `deadline` | Do kiedy |
| **T** — Tło | `background` | Dlaczego ten cel |

Cele są przypisane do strumieni (`stream_id`). Strumień projektowy + cel RZUT = mierzalny projekt.

**API**: `GET/POST/PUT/DELETE /api/v1/precise-goals`
**Frontend**: `components/goals/GoalCard.tsx`, `GoalForm.tsx`

---

## 5. Trzy fazy wyłaniania się — co jest zaimplementowane

| Faza | Metodologia | Implementacja | Status |
|------|-------------|---------------|--------|
| **1. Obserwacja** | System skanuje 30 dni emaili, proponuje firmy i kontakty | Email pipeline: IMAP sync → AI classification → entity proposals (HITL) | Częściowo (brak retroaktywnego skanu) |
| **2. Wzorce** | System proponuje pipeline i struktury | `flow_learned_patterns`, `flow_automation_rules` — tabele istnieją | Schemat gotowy, silnik wyłaniania brakuje |
| **3. Autopilot** | Znane wzorce obsługiwane automatycznie | `ai_rules` z 3 poziomami autonomii, pipeline emailowy z auto-routing | Zaimplementowane dla emaili |

### Co działa teraz (luty 2026):

- Email pipeline: automatyczna klasyfikacja → dwuetapowy triage → propozycje encji (HITL)
- AI routing: sugestia strumienia dla zadań i emaili
- Reguły AI: `ai_rules` z warunkami, akcjami, fallback modelami
- Flow conversations: dialog z AI o elemencie
- Poranny briefing: Smart Day Planner z AI rekomendacjami

### Czego brakuje do pełnej realizacji wizji:

- Retroaktywny skan emaili przy onboardingu
- Silnik wyłaniania struktur (propozycje pipeline na podstawie danych)
- Progresywny onboarding (kontekstowe pytania zamiast formularzy)
- Multi-source fusion (łączenie info z różnych źródeł)
- Promptery per typ źródła (specjalizowane dla voice, zdjęć, dokumentów)

---

## 6. AI — od filozofii do kodu

### Metodologia v3: 3 poziomy autonomii

| Poziom | v3 mówi | Implementacja |
|--------|---------|---------------|
| **1. Sugestia** | AI proponuje, user zatwierdza każdą | `ai_suggestions` tabela + AnalysisPreviewModal (HITL) |
| **2. Asystent** | AI wykonuje, user zatwierdza zbiorczo | `ai_rules` z `requireReview: true` |
| **3. Autopilot** | AI wykonuje wg reguł, user monitoruje | `ai_rules` z `requireReview: false` |

### 6 punktów wejścia AI w implementacji

1. **Analiza Flow** → routes/flow.ts — przetwarzanie elementu ze Źródła
2. **Konwersacja AI** → routes/flowConversation.ts — dialog o elemencie
3. **Pipeline emailowy** → services/ai/RuleProcessingPipeline.ts — 5-etapowa klasyfikacja
4. **Reguły AI** → services/ai/AIRouter.ts — automatyzacja użytkownika
5. **Analiza projektów** → services/ai/UniversalRuleEngine.ts — SMART/dekompozycja
6. **Dwuetapowy triage** → RuleProcessingPipeline.runBusinessTriage() — kategoryzacja + specjalistyczna analiza

### Human-in-the-Loop flow

```
AI analizuje email
       │
       ▼
ai_suggestions (status: PENDING)
       │
       ▼
Frontend: AnalysisPreviewModal
       │
  ┌────┴────┐
  │         │
ACCEPT    REJECT
  │
  ▼
Encje tworzone: kontakt, firma, deal, zadanie
```

---

## 7. Dwa produkty — jedna baza kodu

Metodologia opisuje 2 produkty: `streams.day` (B2C) i `streams.work` (B2B). Obecna implementacja to **streams.work** (Sorto CRM).

| Aspekt | streams.day (przyszłość) | streams.work (obecne) |
|--------|------------------------|----------------------|
| Target | Osoby, freelancerzy | Firmy, zespoły |
| Core | PKM, Knowledge Graph | CRM, Pipeline, Deals |
| AI focus | Routing, capture, search | Klasyfikacja, ekstrakcja, HITL |
| Mobile | Magic Email, Voice Capture | (planned) |
| Status | Koncepcja | Produkcja |

---

## 8. Dla deweloperów — szybka orientacja

### "Widzę `gtdRole` w kodzie — co to?"
To historyczna nazwa dla `StreamRole`. Traktuj jak `streamRole`. Nie zmieniaj nazwy kolumny w bazie bez migracji.

### "Widzę `NEXT_ACTIONS` — ale metodologia mówi żadnego GTD?"
To wewnętrzna rola routingowa dla AI. Użytkownik nie widzi tej nazwy w UI. AI potrzebuje wiedzieć czy zadanie wymaga akcji usera czy czeka na kogoś innego.

### "Metodologia mówi 2 koncepty, a tu jest 7 ról?"
Tak. 2 koncepty = model mentalny użytkownika. 7 ról = informacja routingowa dla AI. Każda rola mapuje się na jeden z dwóch konceptów (Źródło lub Strumień).

### "Gdzie jest RZUT w kodzie?"
- Tabela: `precise_goals`
- Route: `routes/preciseGoals.ts`
- Frontend: `components/goals/GoalCard.tsx`, `GoalForm.tsx`
- Pola: `result`, `measurement`, `current_value`, `target_value`, `deadline`, `background`

### "Gdzie jest pipeline emailowy?"
- Wejście: `routes/emailPipeline.ts` → POST /analyze/:messageId
- Pipeline: `services/ai/RuleProcessingPipeline.ts` (5 etapów)
- Prompty: `prisma/seed-prompts.ts` → EMAIL_BIZ_TRIAGE + 12 specjalistycznych
- HITL: `routes/aiSuggestions.ts` → accept/reject propozycji
- Docs: `docs/ARCHITEKTURA_AI.md`, `docs/PROMPTY_EMAIL_FLOW.md`

---

## Podsumowanie

> Metodologia v3 opisuje model mentalny dla użytkownika.
> Pod spodem system operuje na 7+ rolach strumieni,
> które mapują się na uproszczony model tak:
>
> **Źródło** = StreamRole INBOX
> **Strumień** = StreamRole PROJECTS | AREAS | REFERENCE | SOMEDAY_MAYBE | CUSTOM
> **Wewnętrzne** = StreamRole NEXT_ACTIONS | WAITING_FOR | CONTEXTS
>
> Użytkownik widzi Źródło i Strumienie.
> System wewnętrznie rozróżnia role, żeby AI wiedziało jak routować.

---

*Ostatnia aktualizacja: 2026-02-17*
