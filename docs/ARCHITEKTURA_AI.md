# Architektura systemu AI — Sorto CRM

## Przeplyw ogolny

```
Zdarzenie (email / akcja uzytkownika / scheduler)
       |
       v
  +------------------+
  | Wybor modelu AI  |  <-- skad bierzemy model?
  +------------------+
       |
       v
  +------------------+
  | AIRouter         |  <-- centralny hub wysylajacy request do providera
  +------------------+
       |
       v
  +------------------+
  | Provider API     |  <-- OpenAI / Anthropic / Qwen / Google
  +------------------+
       |
       v
  +------------------+
  | ai_executions    |  <-- kazde wywolanie AI logowane do bazy
  +------------------+
```

---

## Tabele w bazie danych

| Tabela | Cel | Przyklad |
|--------|-----|----------|
| `ai_providers` | Klucze API i endpointy providerow | OpenAI, Anthropic, Qwen |
| `ai_models` | Definicje modeli (nazwa, typ, koszt, limity) | gpt-4o-mini, qwen-max, claude-sonnet |
| `ai_prompt_templates` | Szablony promptow z zmiennymi `{{content}}` | SOURCE_ANALYZE, FLOW_ANALYSIS |
| `ai_rules` | Reguly automatyzacji AI (warunki + akcje + model) | "Pilny email → utworz zadanie" |
| `ai_action_config` | **NOWE**: Globalne mapowanie: typ operacji → model | FLOW_ANALYSIS → qwen-max |
| `ai_executions` | Log kazdego wywolania AI (tokeny, koszt, czas) | audit trail |

---

## 6 punktow wejscia AI

### 1. Analiza elementow Flow

```
Uzytkownik klika "Przetworz" na elemencie skrzynki odbiorczej
       |
       v
  POST /flow/process/:id
       |
       v
  Ladowanie szablonu promptu SOURCE_ANALYZE z ai_prompt_templates
       |
       v
  Wybor modelu:
    1. Sprawdz ai_action_config WHERE actionCode = 'FLOW_ANALYSIS'
    2. Jesli brak → uzyj hardcoded 'qwen-max-2025-01-25'
       |
       v
  AIRouter.processRequest({ model: wybrany_model, messages: [...] })
       |
       v
  Wynik: sugerowana akcja GTD, wyodrebnione encje, zadania
```

**Plik**: `routes/flow.ts` linia ~288
**Cel**: Analiza tresci elementu, sugestia akcji GTD (ZROB/ZAPLANUJ/DELEGUJ/PROJEKT)

---

### 2. Konwersacja AI (Flow)

```
Uzytkownik klika "Porozmawiaj z AI" o elemencie
       |
       v
  POST /flow-conversation/start/:itemId   — rozpoczecie rozmowy
  POST /flow-conversation/:id/message     — kolejne wiadomosci
       |
       v
  Wybor modelu:
    1. Sprawdz ai_action_config WHERE actionCode = 'FLOW_CONVERSATION'
    2. Jesli brak → uzyj hardcoded 'qwen-plus'
       |
       v
  AIRouter.processRequest({ model: wybrany_model, messages: historia_rozmowy })
       |
       v
  Wynik: odpowiedz AI w kontekscie analizowanego elementu
```

**Plik**: `routes/flowConversation.ts` linie ~231 i ~491
**Cel**: Dialog z AI o przetwarzanym elemencie (wieloturowy)

---

### 3. Pipeline emailowy (klasyfikacja + analiza)

```
Email przychodzi z IMAP/Gmail (co 5 min scheduler)
       |
       v
  ETAP 1: CRM PROTECTION (bez AI)
    - Nadawca w CRM (kontakt/firma)? → BUSINESS (100%)
       |
       v
  ETAP 2: LISTY & PATTERNY (bez AI, rownolegle)
    - Listy domen (blacklist/whitelist) → SPAM/BUSINESS
    - Wzorce regex (email_patterns)
       |
       v
  ETAP 2.5: REGULY AI (bez AI, ZAWSZE sprawdzane)
    - Reguly z ai_rules: warunki + forceClassification
    - Operatory: contains, not_contains, equals, not_equals, regex, in, notIn, exists, not_exists
    - Priorytet malejaco, pierwsza pasujaca wygrywa
       |
       v
  ETAP 3: DECYZJA KLASYFIKACYJNA
    Priorytet: CRM > Listy > Patterny > Reguly AI > INBOX
       |
       v
  ETAP 4: POST-ANALIZA AI
    Jesli BUSINESS i prompt EMAIL_BIZ_TRIAGE istnieje:
      → DWUETAPOWY TRIAGE:
        Krok 1: EMAIL_BIZ_TRIAGE (gpt-4o-mini) → kategoria (np. FAKTURA)
        Krok 2: EMAIL_BIZ_{KATEGORIA} (gpt-4o) → pelna analiza
    Jesli nie-BUSINESS lub brak triage:
      → Klasyczny flow: EMAIL_POST_{KATEGORIA}
       |
       v
  ETAP 5: POST-AKCJE
    - Polaczenie z kontaktem/firma w CRM
    - Dodanie do RAG (indeks semantyczny)
    - Dodanie do Flow/GTD (jesli actionable)
    - Propozycje AI → ai_suggestions (HITL) lub auto-tworzenie encji
    - Sugestia blacklist (jesli spam)
```

**Pliki**:
- `services/ai/RuleProcessingPipeline.ts` — caly 5-etapowy pipeline
  - `runBusinessTriage()` — dwuetapowy triage BUSINESS (linia ~909)
  - `runPostClassificationPrompt()` — klasyczny flow post-analizy
  - `createEntityProposals()` — tworzenie propozycji HITL
  - `evaluateRuleOperator()` — operatory warunkow regul (w tym not_contains)
- `routes/emailPipeline.ts` — endpoint POST /analyze/:messageId
- `routes/aiSuggestions.ts` — accept/reject propozycji AI
- `services/scheduledTasks.ts` — scheduler co 5 min

**Cel**: Automatyczna klasyfikacja i dwuetapowa analiza emaili biznesowych z HITL

---

### 4. Reguly AI (ai_rules)

```
Zdarzenie (email przyszedl / projekt utworzony / uzytkownik kliknal "Uruchom")
       |
       v
  AIRouter.processTrigger(context)
       |
       v
  Znajdz pasujace reguly:
    SELECT * FROM ai_rules
    WHERE triggerType = typ_zdarzenia
    AND status = 'ACTIVE'
    AND warunki pasuja do kontekstu
       |
       v
  Dla kazdej pasującej reguly:
       |
       v
    Wybor modelu:
      → rule.modelId   ← MODEL WYBRANY W FORMULARZU REGULY
      → jesli padnie: rule.fallbackModelIds[0], [1], ...
       |
       v
    Zaladuj szablon prompta: rule.templateId → ai_prompt_templates
    Podstaw zmienne: {{content}}, {{subject}}, itp.
       |
       v
    AIRouter.executeAIRequest(modelId, request)
       |
       v
    Wykonaj akcje reguly:
      - createTask: utworz zadanie
      - updateContact: zaktualizuj kontakt
      - sendNotification: wyslij powiadomienie
      - setPriority: ustaw priorytet
      - forceClassification: wymus klasyfikacje
       |
       v
    Zapisz do ai_executions (log)
```

**Pliki**:
- `services/ai/AIRouter.ts` linia ~228 (`executeRule`)
- `routes/aiRules.ts` — CRUD regul

**Cel**: Automatyzacja oparta na regulach zdefiniowanych przez uzytkownika

---

### 5. Analiza projektow/zadan (UniversalRuleEngine)

```
Projekt zmienia status na PLANNING / Zadanie ma >= 8h
       |
       v
  UniversalRuleEngine.executeRules(module, data)
       |
       v
  Wybor modelu:
    → Hardcoded w definicji szablonu: 'gpt-4'
       |
       v
  AIRouter.executeAIRequest(modelId, request)
       |
       v
  Wynik: Analiza SMART / rozbicie na podzadania / rekomendacje
```

**Plik**: `services/ai/UniversalRuleEngine.ts` linia ~468
**Cel**: Analiza projektow (SMART) i dekompozycja zlozonych zadan

---

### 6. Dwuetapowy triage emaili BUSINESS

```
Email sklasyfikowany jako BUSINESS
       |
       v
  Czy prompt EMAIL_BIZ_TRIAGE istnieje w bazie?
       |              |
      TAK            NIE → fallback do klasycznego flow (EMAIL_POST_BUSINESS)
       |
       v
  KROK 1: TRIAGE (gpt-4o-mini, temp 0.1, maxTokens 300)
    Input: from, subject, body (truncated do 500 zn.)
    Output: { "category": "ZAPYTANIE_OFERTOWE", "confidence": 0.98, "reasoning": "..." }
       |
       v
  KROK 2: SPECJALISTYCZNY PROMPT (gpt-4o, temp 0.2-0.3, maxTokens 1500-2000)
    Szablon: EMAIL_BIZ_{CATEGORY} (np. EMAIL_BIZ_FAKTURA_PLATNOSC)
    Input: pelna tresc + zmienne triage (category, confidence, reasoning)
    Output: JSON z leads, contacts, deals, tasks, tags, streamRouting, categorySpecific
       |
       v
  Jesli EMAIL_BIZ_{CATEGORY} nie istnieje → probuj EMAIL_BIZ_INNE (fallback)
       |
       v
  Merge triage metadata + specjalistyczny wynik
       |
       v
  createEntityProposals() → ai_suggestions (HITL)
```

**12 kategorii triage**: ZAPYTANIE_OFERTOWE, ZLECENIE, ADMIN_ORGANIZACJA, REKLAMACJA,
FAKTURA_PLATNOSC, LOGISTYKA, SPOTKANIE, WSPOLPRACA, SPAM_MARKETING, HR, TECH_SUPPORT, INNE

**13 promptow w bazie**: EMAIL_BIZ_TRIAGE + 12 specjalistycznych EMAIL_BIZ_{KAT}

**Plik**: `services/ai/RuleProcessingPipeline.ts` → `runBusinessTriage()` (linia ~909)
**Cel**: Redukcja kosztow (~40%) i poprawa jakosci ekstrakcji przez specjalizacje promptow

---

## Skad bierzemy model — podsumowanie

| Punkt wejscia | Skad model? | Priorytet |
|---------------|-------------|-----------|
| **Analiza Flow** | `ai_action_config` → hardcoded fallback | FLOW_ANALYSIS → 'qwen-max' |
| **Konwersacja AI** | `ai_action_config` → hardcoded fallback | FLOW_CONVERSATION → 'qwen-plus' |
| **Klasyfikacja emaili** | `ai_action_config` → config fallback | EMAIL_CLASSIFICATION → config |
| **Triage BUSINESS (krok 1)** | prompt `EMAIL_BIZ_TRIAGE` → defaultModel | gpt-4o-mini |
| **Triage BUSINESS (krok 2)** | `ai_action_config` EMAIL_CLASSIFICATION → prompt fallback | gpt-4o |
| **Pipeline emailowy (klasyczny)** | `ai_action_config` → template fallback | EMAIL_PIPELINE → 'gpt-4o-mini' |
| **Regula AI** | `rule.modelId` → `rule.fallbackModelIds` | **Model wybrany w formularzu reguly** |
| **Analiza projektow** | Hardcoded w szablonie | 'gpt-4' |

---

## Roznica: Reguly AI vs Akcje AI

```
REGULY AI (ai_rules)                    AKCJE AI (ai_action_config)
========================                ============================
Co: KIEDY uruchomic AI                  Co: JAKIM MODELEM uruchomic
Definiuje: warunki, akcje, prompt       Definiuje: model per typ operacji
Model: per regula (w formularzu)        Model: globalny per akcja systemowa
Przykl: "email z 'PILNE' → zadanie"    Przykl: "analiza Flow → qwen-max"
Tworzy: uzytkownik                      Tworzy: admin
Tabela: ai_rules                        Tabela: ai_action_config
UI: /dashboard/ai-rules/                UI: /dashboard/ai-rules/ tab "Akcje AI"
                                             /dashboard/admin/ai-config/ tab "Akcje AI"
```

**Reguly AI** maja swoj wlasny `modelId` — wybrany w formularzu reguly.
`ai_action_config` **nie wplywa** na reguly. Reguly uzywaja swojego modelu.

`ai_action_config` wplywa na:
- Analize Flow (FLOW_ANALYSIS)
- Konwersacje AI (FLOW_CONVERSATION)
- Klasyfikacje emaili w pipeline (EMAIL_CLASSIFICATION)
- Analize emaili w pipeline (EMAIL_PIPELINE)

---

## Konfiguracja krok po kroku

```
1. PROVIDERZY → /dashboard/admin/ai-config/ lub /dashboard/ai-rules/ tab "Konfiguracja"
   Dodaj klucze API: OpenAI, Anthropic, Qwen...

2. MODELE → /dashboard/admin/ai-config/ tab "Models"
   Zarejestruj modele: gpt-4o-mini, qwen-max, claude-sonnet...

3. AKCJE AI → /dashboard/ai-rules/ tab "Akcje AI"
   Przypisz model do kazdej operacji systemowej

4. REGULY AI → /dashboard/ai-rules/ tab "Reguly"
   Utworz reguly automatyzacji (kazda z wlasnym modelem)

5. PROMPTY → /dashboard/ai-rules/ tab "Prompty"
   Edytuj szablony promptow (opcjonalnie)
```

---

## Schemat bazy — relacje AI

```
ai_providers (klucze API)
    |
    +--< ai_models (modele)
            |
            +--< ai_rules.modelId (model per regula)
            |
            +--< ai_action_config.primaryModelId (model per akcja)
            |
            +--< ai_action_config.fallbackModelId (model zapasowy)
            |
            +--< ai_prompt_templates.defaultModel (domyslny model szablonu)
            |
            +--< ai_executions.modelId (log wywolan)
```
