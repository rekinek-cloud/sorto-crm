# PRZYKLAD ANALIZY AI DLA POMYSLU
## Wzorzec odpowiedzi dla Claude Code

---

# PRZYPADEK TESTOWY

Input od usera:
```
Aplikacja SaaS dotyczaca przepisow kulinarnych
```

Typ elementu: IDEA (pomysl)

---

# ANTYWZORZEC — TAK NIE ROBIC

```
"Twoj pomysl na aplikacje SaaS z przepisami kulinarnymi to 
swietny projekt, ktory wymaga zorganizowanego podejscia. 
Proponuje stworzyc nowy strumien o nazwie 'SaaS Recipe App 
Development', gdzie bedziemy planowac i monitorowac postepy. 
Pierwszymi krokami powinno byc zdefiniowanie celu i grupy 
docelowej dla aplikacji, zebranie zespolu i rozpoczecie 
procesu projektowania. Pamietaj, ze to jest dlugoterminowy 
projekt, ktory wymaga starannego planowania i realizacji."
```

BLEDY:

| Problem | Opis |
|---------|------|
| Decyduje za usera | "Proponuje stworzyc strumien" — nie pyta, stwierdza |
| Wymysla strumienie | "SaaS Recipe App Development" — skad to? |
| Jezyk angielski | User pisze po polsku, AI odpowiada angielska nazwa |
| Gadka motywacyjna | "swietny projekt", "Pamietaj" — puste slowa |
| Forma narracyjna | Akapit tekstu zamiast struktury do zatwierdzenia |
| Brak opcji | Nie daje wyboru PROJEKT / KIEDYS / REFERENCJA |
| Zaklada "my" | "bedziemy planowac" — manipulacyjne |
| Brak pewnosci | Nie pokazuje confidence, nie pyta o kontekst |
| Ton mentorski | "Pamietaj, ze..." — protekcjonalne |

---

# WZORZEC — TAK ROBIC

## Oczekiwana odpowiedz AI (JSON)

```json
{
  "elementType": "IDEA",
  "subType": "BUSINESS_IDEA",
  "confidence": 95,
  
  "analysis": {
    "entities": {
      "technology": ["SaaS"],
      "industry": ["kulinaria", "food-tech"],
      "productType": ["aplikacja"]
    },
    "complexity": "HIGH",
    "timeHorizon": "LONG_TERM",
    "urgency": "NONE",
    "completeness": "LOW",
    "missingInfo": [
      "grupa docelowa",
      "wyroznik konkurencyjny", 
      "model monetyzacji",
      "budzet"
    ]
  },
  
  "actionOptions": [
    {
      "action": "PROJEKT",
      "label": "Chce to rozwijac",
      "isDefault": false,
      "suggestedTasks": [
        "Zdefiniowac grupe docelowa",
        "Zbadac konkurencje (Cookpad, Tasty, Yummly, Przepisy.pl)",
        "Okreslic wyroznik (co robimy lepiej/inaczej?)",
        "Wybrac model biznesowy (freemium/subskrypcja/reklamy)",
        "Oszacowac MVP (czas, koszt, zespol)",
        "Stworzyc prosty wireframe"
      ]
    },
    {
      "action": "KIEDYS_MOZE",
      "label": "Odkladam na pozniej",
      "isDefault": true,
      "suggestedTags": ["saas", "aplikacja", "kulinaria", "pomysl"],
      "reminderOptions": [
        { "value": "1m", "label": "Za miesiac" },
        { "value": "3m", "label": "Za 3 miesiace" },
        { "value": "6m", "label": "Za 6 miesiecy", "isDefault": true },
        { "value": "none", "label": "Bez przypomnienia" }
      ]
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
      { "streamId": "str-123", "name": "Pomysly", "confidence": 70 },
      { "streamId": "str-456", "name": "Rozwoj", "confidence": 45 },
      { "streamId": "str-789", "name": "Side Projects", "confidence": 60 }
    ],
    "bestMatch": {
      "streamId": "str-123",
      "name": "Pomysly",
      "confidence": 70
    },
    "suggestNewStream": false,
    "newStreamNameSuggestion": null
  },
  
  "enrichmentOptions": [
    { 
      "type": "WEB_SEARCH", 
      "label": "Wyszukaj konkurencje",
      "suggestedQuery": "recipe app saas competitors market"
    },
    { 
      "type": "ADD_NOTE", 
      "label": "Dodaj notatke z przemysleniami"
    },
    { 
      "type": "ADD_LINKS", 
      "label": "Dolacz linki do inspiracji"
    }
  ],
  
  "summary": "Pomysl biznesowy - aplikacja SaaS. Wysoka zlozonosc, wymaga doprecyzowania grupy docelowej i wyroznika.",
  
  "reasoning": "Wykryto pomysl na produkt technologiczny (SaaS) w branzy kulinarnej. Brak szczegulow sugeruje wczesny etap - user prawdopodobnie chce zapisac pomysl do pozniejszego rozwiniecia. Domyslna akcja: KIEDYS_MOZE z przypomnieniem."
}
```

---

## Jak to wyswietlic w UI

```
+----------------------------------------------------------+
|  NOWY ELEMENT W ZRODLE                                    |
+----------------------------------------------------------+
|                                                           |
|  "Aplikacja SaaS dotyczaca przepisow kulinarnych"        |
|                                                           |
+----------------------------------------------------------+
|  ANALIZA AI                                    95%        |
+----------------------------------------------------------+
|                                                           |
|  Typ:        Pomysl biznesowy                            |
|  Zlozonosc:  Wysoka (wymaga zespolu, infrastruktury)     |
|  Horyzont:   Dlugoterminowy (6-18 mies. do MVP)          |
|                                                           |
|  Brakujace informacje:                                   |
|  - Grupa docelowa (kto ma uzywac?)                       |
|  - Wyroznik (czym sie rozni od konkurencji?)             |
|  - Model monetyzacji                                      |
|  - Szacunkowy budzet                                      |
|                                                           |
+----------------------------------------------------------+
|  CO CHCESZ ZROBIC?                                        |
+----------------------------------------------------------+
|                                                           |
|  ( ) PROJEKT — Chce to rozwijac                          |
|      Pierwsze kroki:                                      |
|      [ ] Zdefiniowac grupe docelowa                      |
|      [ ] Zbadac konkurencje                              |
|      [ ] Okreslic wyroznik                               |
|      [ ] Wybrac model biznesowy                          |
|      [ ] Oszacowac MVP                                   |
|                                                           |
|  (o) KIEDYS_MOZE — Odkladam na pozniej                   |
|      Przypomnienie: [Za 6 miesiecy v]                    |
|                                                           |
|  ( ) REFERENCJA — Tylko notuje                           |
|                                                           |
|  ( ) USUN — Jednak nie                                   |
|                                                           |
+----------------------------------------------------------+
|  STRUMIEN                                                 |
+----------------------------------------------------------+
|                                                           |
|  [Pomysly v]  70% dopasowania                            |
|                                                           |
|  Inne: [Rozwoj 45%] [Side Projects 60%] [+ Nowy]         |
|                                                           |
+----------------------------------------------------------+
|  WZBOGACENIE (opcjonalne)                                |
+----------------------------------------------------------+
|                                                           |
|  [ ] Wyszukaj konkurencje w internecie                   |
|  [ ] Dodaj notatke                                       |
|  [ ] Dolacz linki                                        |
|                                                           |
+----------------------------------------------------------+
|                                                           |
|              [Anuluj]           [Zatwierdz]              |
|                                                           |
+----------------------------------------------------------+
```

---

# ZASADY DLA AI

## AI MUSI:

1. Zwracac STRUKTURE (JSON), nie tekst narracyjny
2. Dawac OPCJE do wyboru, nie decydowac
3. Pokazywac CONFIDENCE dla dopasowania strumieni
4. Sugerowac KONKRETNE pierwsze kroki dla PROJEKT
5. Analizowac BRAKI w informacjach
6. Uzywac JEZYKA usera (polski -> polski)

## AI NIE MOZE:

1. Wymyslac nazw strumieni (wybiera z istniejacych lub user tworzy)
2. Oceniac pomyslu ("swietny", "ciekawy")
3. Uzywac tonu mentorskiego ("Pamietaj", "Powinienes")
4. Zakladac "my" ("bedziemy planowac")
5. Pisac akapitow tekstu zamiast struktury
6. Decydowac za usera ktora akcje wybrac

## DOMYSLNA AKCJA DLA POMYSLU:

Dla pomyslu BEZ pilnosci i BEZ deadline:
- Domyslnie: KIEDYS_MOZE (zamroz z przypomnieniem)
- NIE: od razu PROJEKT (user moze nie byc gotowy)

Dla pomyslu Z pilnoscia lub Z deadline:
- Domyslnie: ZAPLANUJ lub PROJEKT

---

# INTERFEJS TypeScript

```typescript
interface IdeaAnalysisResponse {
  elementType: 'IDEA';
  subType: 'BUSINESS_IDEA' | 'PRODUCT_IDEA' | 'FEATURE_IDEA' | 'PERSONAL_IDEA' | 'OTHER';
  confidence: number;  // 0-100
  
  analysis: {
    entities: {
      technology?: string[];
      industry?: string[];
      productType?: string[];
      people?: string[];
      companies?: string[];
    };
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM' | 'SOMEDAY';
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    completeness: 'HIGH' | 'MEDIUM' | 'LOW';
    missingInfo: string[];
  };
  
  actionOptions: ActionOption[];
  
  streamMatching: {
    matches: StreamMatch[];
    bestMatch: StreamMatch | null;
    suggestNewStream: boolean;
    newStreamNameSuggestion: string | null;  // tylko jesli user nie ma pasujacych
  };
  
  enrichmentOptions: EnrichmentOption[];
  
  summary: string;      // 1-2 zdania, bez ocen
  reasoning: string;    // wewnetrzne wyjasnienie dla logow
}

interface ActionOption {
  action: 'PROJEKT' | 'KIEDYS_MOZE' | 'REFERENCJA' | 'USUN' | 'ZAPLANUJ' | 'ZROB_TERAZ';
  label: string;
  isDefault: boolean;
  suggestedTasks?: string[];
  suggestedTags?: string[];
  reminderOptions?: ReminderOption[];
}

interface ReminderOption {
  value: string;        // "1m", "3m", "6m", "1y", "none"
  label: string;
  isDefault?: boolean;
}

interface StreamMatch {
  streamId: string;
  name: string;
  confidence: number;   // 0-100
}

interface EnrichmentOption {
  type: 'WEB_SEARCH' | 'ADD_NOTE' | 'ADD_LINKS' | 'ADD_FILES';
  label: string;
  suggestedQuery?: string;
}
```

---

# PROMPT DLA AI (SOURCE_IDEA)

```
Analizujesz pomysl/mysl uzytkownika. Zwroc TYLKO JSON zgodny ze schema.

ZASADY:
1. NIE oceniaj pomyslu (bez "swietny", "ciekawy", "interesujacy")
2. NIE decyduj za usera — daj OPCJE
3. NIE wymyslaj nazw strumieni — wybieraj z listy dostepnych
4. Analizuj CO BRAKUJE w pomysle
5. Dla pomyslow biznesowych sugeruj konkretne pierwsze kroki
6. Domyslna akcja dla pomyslu bez pilnosci: KIEDYS_MOZE
7. Jezyk odpowiedzi = jezyk inputu

DOSTEPNE STRUMIENIE USERA:
{{userStreams}}

INPUT:
{{itemContent}}

Zwroc TYLKO JSON, bez komentarzy.
```

---

# TESTY

## Test 1: Pomysl biznesowy (jak powyzej)
Input: "Aplikacja SaaS dotyczaca przepisow kulinarnych"
Oczekiwane:
- subType: BUSINESS_IDEA
- complexity: HIGH
- timeHorizon: LONG_TERM
- defaultAction: KIEDYS_MOZE
- missingInfo: [grupa docelowa, wyroznik, monetyzacja, budzet]

## Test 2: Pomysl osobisty prosty
Input: "Nauczyc sie grac na gitarze"
Oczekiwane:
- subType: PERSONAL_IDEA
- complexity: MEDIUM
- timeHorizon: LONG_TERM
- defaultAction: KIEDYS_MOZE lub PROJEKT
- suggestedTasks: [Znalezc nauczyciela/kurs, Kupic gitare, Ustalic harmonogram cwiczen]

## Test 3: Pomysl z pilnoscia
Input: "Pilne - napisac artykul o AI do konferencji w przyszlym tygodniu"
Oczekiwane:
- urgency: HIGH
- timeHorizon: SHORT_TERM
- defaultAction: ZAPLANUJ (nie KIEDYS_MOZE!)
- extractedDeadline: przyszly tydzien

## Test 4: Pomysl-feature
Input: "Dodac dark mode do naszej aplikacji"
Oczekiwane:
- subType: FEATURE_IDEA
- complexity: LOW/MEDIUM
- defaultAction: ZAPLANUJ lub PROJEKT
- missingInfo: [priorytet, ktora aplikacja]

---

KONIEC DOKUMENTU
