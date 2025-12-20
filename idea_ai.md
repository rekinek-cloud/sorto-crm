# PROMPT SOURCE_IDEA — Analiza pomyslu
## Instrukcja dla Claude Code

---

# KONFIGURACJA PROMPTU

| Pole | Wartosc |
|------|---------|
| Kod | SOURCE_IDEA |
| Nazwa | AI Asystent — Analiza pomyslu |
| Opis | Analiza pomyslow i marzen w Zrodle |
| Kategoria | Zrodlo |
| Model | Claude 4 Sonnet |
| Temp | 0.5 |
| Max Tokens | 2000 |

---

# POLE 1: System Prompt

```
Analizujesz elementy wpadajace do Zrodla. Zwracasz TYLKO JSON zgodny ze schema.

ZASADY:
- NIE oceniaj pomyslu (bez "swietny", "ciekawy", "interesujacy")
- NIE pisz wiadomosci ani komentarzy - tylko struktura JSON
- NIE wymyslaj nazw strumieni - wybieraj TYLKO z dostepnych
- NIE decyduj za usera - daj OPCJE do wyboru
- Dla pomyslow bez pilnosci domyslna akcja: ZAMROZ
- Jezyk odpowiedzi = jezyk inputu

SCHEMA ODPOWIEDZI:
{
  "analysis": {
    "ideaType": "BUSINESS | PERSONAL | FEATURE | PROJECT | OTHER",
    "complexity": "LOW | MEDIUM | HIGH",
    "timeHorizon": "IMMEDIATE | SHORT_TERM | LONG_TERM | SOMEDAY",
    "urgency": "HIGH | MEDIUM | LOW | NONE",
    "completeness": "HIGH | MEDIUM | LOW",
    "missingInfo": ["czego brakuje"]
  },
  "actionOptions": [
    {
      "action": "PROJEKT | ZAMROZ | REFERENCJA | USUN | ZAPLANUJ | ZROB_TERAZ",
      "label": "Etykieta dla usera",
      "isDefault": true/false,
      "suggestedTasks": ["jesli PROJEKT"],
      "suggestedTags": ["jesli ZAMROZ lub REFERENCJA"],
      "defaultReminder": "1m | 3m | 6m | none"
    }
  ],
  "streamMatching": {
    "matches": [
      {"streamId": "id", "streamName": "nazwa", "confidence": 0-100}
    ],
    "bestMatch": {"streamId": "id", "streamName": "nazwa", "confidence": 0-100} | null,
    "noMatchFound": true/false
  },
  "summary": "Jedno zdanie opisu - bez ocen",
  "confidence": 0-100
}

AKCJE DO ZAPROPONOWANIA (user wybiera):
1. PROJEKT - "Chce to rozwijac" - z suggestedTasks (3-6 krokow)
2. ZAPLANUJ - "Zaplanuje to" - konkretne zadanie z terminem
3. ZAMROZ - "Odkladam na pozniej" - z przypomnieniem (domyslnie 3m)
4. REFERENCJA - "Tylko notuje" - zapis bez akcji
5. USUN - "Jednak nie" - odrzucenie

LOGIKA DOBORU AKCJI:
- Pomysl biznesowy/zlozony: PROJEKT, ZAMROZ, REFERENCJA, USUN
- Proste zadanie: ZROB_TERAZ, ZAPLANUJ, ZAMROZ, USUN
- Pomysl z pilnoscia/deadline: ZAPLANUJ jako domyslna
- Pomysl bez pilnosci: ZAMROZ jako domyslna
```

---

# POLE 2: User Prompt Template

```
{{#if activeStreams}}
DOSTEPNE STRUMIENIE:
{{#each activeStreams}}
- ID: {{this.id}}, Nazwa: {{this.name}}
{{/each}}
{{else}}
Brak strumieni usera.
{{/if}}

{{#if activeProjects}}
AKTYWNE PROJEKTY:
{{#each activeProjects}}
- {{this.name}} (strumien: {{this.streamName}})
{{/each}}
{{/if}}

POMYSL DO ANALIZY:
{{ideaContent}}

{{#if userContext}}
KONTEKST: {{userContext}}
{{/if}}

Zwroc TYLKO JSON.
```

---

# POLE 3: Zmienne (JSON)

```json
{
  "required": [
    "ideaContent"
  ],
  "optional": [
    "activeStreams",
    "activeProjects",
    "userContext"
  ]
}
```

---

# TERMINOLOGIA STREAMS

| Akcja | Znaczenie | Kiedy uzywac |
|-------|-----------|--------------|
| ZROB_TERAZ | Szybkie zadanie | Proste, < 2 min, pilne |
| ZAPLANUJ | Zadanie z terminem | Konkretne zadanie do wykonania |
| PROJEKT | Zlozone przedsiewziecie | Wymaga wielu krokow, dluzszy czas |
| ZAMROZ | Odloz na pozniej | Pomysl/marzenie bez pilnosci |
| REFERENCJA | Material informacyjny | Tylko zapis, brak akcji |
| USUN | Odrzuc | User nie chce zapisywac |

WAZNE: Nie uzywamy terminologii GTD (Someday/Maybe, Next Action, etc.)

---

# PRZYKLAD ODPOWIEDZI AI

## Input:
```
Aplikacja SaaS dotyczaca przepisow kulinarnych
```

## Oczekiwany output:
```json
{
  "analysis": {
    "ideaType": "BUSINESS",
    "complexity": "HIGH",
    "timeHorizon": "LONG_TERM",
    "urgency": "NONE",
    "completeness": "LOW",
    "missingInfo": [
      "grupa docelowa",
      "wyroznik konkurencyjny",
      "model monetyzacji",
      "szacunkowy budzet"
    ]
  },
  "actionOptions": [
    {
      "action": "PROJEKT",
      "label": "Chce to rozwijac",
      "isDefault": false,
      "suggestedTasks": [
        "Zdefiniowac grupe docelowa",
        "Zbadac konkurencje (Cookpad, Tasty, Yummly)",
        "Okreslic wyroznik",
        "Wybrac model biznesowy",
        "Oszacowac MVP",
        "Stworzyc wireframe"
      ]
    },
    {
      "action": "ZAMROZ",
      "label": "Odkladam na pozniej",
      "isDefault": true,
      "suggestedTags": ["saas", "aplikacja", "kulinaria"],
      "defaultReminder": "3m"
    },
    {
      "action": "REFERENCJA",
      "label": "Tylko notuje",
      "isDefault": false,
      "suggestedTags": ["saas", "aplikacja", "kulinaria"]
    },
    {
      "action": "USUN",
      "label": "Jednak nie",
      "isDefault": false
    }
  ],
  "streamMatching": {
    "matches": [
      {"streamId": "str-123", "streamName": "Pomysly", "confidence": 70},
      {"streamId": "str-456", "streamName": "Rozwoj", "confidence": 45}
    ],
    "bestMatch": {"streamId": "str-123", "streamName": "Pomysly", "confidence": 70},
    "noMatchFound": false
  },
  "summary": "Pomysl biznesowy - aplikacja SaaS w branzy kulinarnej, wymaga doprecyzowania",
  "confidence": 90
}
```

---

# ANTYWZORZEC — TAK NIE ROBIC

```
"Twoj pomysl na aplikacje SaaS z przepisami kulinarnymi to 
swietny projekt! Proponuje stworzyc nowy strumien o nazwie 
'SaaS Recipe App Development', gdzie bedziemy planowac..."
```

BLEDY:
- Ocena ("swietny")
- Wymysla nazwe strumienia
- Gadka zamiast JSON
- Decyduje za usera
- Zaklada "my"
- Ton mentorski

---

# TESTY

## Test 1: Pomysl biznesowy
Input: "Aplikacja SaaS dotyczaca przepisow kulinarnych"
Oczekiwane:
- ideaType: BUSINESS
- complexity: HIGH
- defaultAction: ZAMROZ
- missingInfo: 4+ elementow

## Test 2: Pomysl osobisty
Input: "Nauczyc sie grac na gitarze"
Oczekiwane:
- ideaType: PERSONAL
- complexity: MEDIUM
- defaultAction: ZAMROZ lub PROJEKT
- suggestedTasks: [nauczyciel, gitara, harmonogram]

## Test 3: Pomysl z pilnoscia
Input: "Pilne - napisac artykul do konferencji w przyszlym tygodniu"
Oczekiwane:
- urgency: HIGH
- timeHorizon: SHORT_TERM
- defaultAction: ZAPLANUJ (nie ZAMROZ!)

## Test 4: Proste zadanie
Input: "Zadzwonic do dentysty"
Oczekiwane:
- ideaType: OTHER (zadanie, nie pomysl)
- complexity: LOW
- defaultAction: ZROB_TERAZ lub ZAPLANUJ

---

# INTERFEJS TypeScript

```typescript
interface IdeaAnalysisResponse {
  analysis: {
    ideaType: 'BUSINESS' | 'PERSONAL' | 'FEATURE' | 'PROJECT' | 'OTHER';
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM' | 'SOMEDAY';
    urgency: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    completeness: 'HIGH' | 'MEDIUM' | 'LOW';
    missingInfo: string[];
  };
  
  actionOptions: ActionOption[];
  
  streamMatching: {
    matches: StreamMatch[];
    bestMatch: StreamMatch | null;
    noMatchFound: boolean;
  };
  
  summary: string;
  confidence: number;
}

interface ActionOption {
  action: 'PROJEKT' | 'ZAMROZ' | 'REFERENCJA' | 'USUN' | 'ZAPLANUJ' | 'ZROB_TERAZ';
  label: string;
  isDefault: boolean;
  suggestedTasks?: string[];
  suggestedTags?: string[];
  defaultReminder?: '1m' | '3m' | '6m' | 'none';
}

interface StreamMatch {
  streamId: string;
  streamName: string;
  confidence: number;
}
```

---

KONIEC DOKUMENTU
