# STREAMS AI — KOMPLETNA SPECYFIKACJA IMPLEMENTACJI
## Master dokument dla Claude Code

---

# SPIS TRESCI

1. WPROWADZENIE I ARCHITEKTURA
2. FUNDAMENTY — HIERARCHIA, ENCJE, POWIAZANIA
3. FLOW ENGINE — SILNIK PRZETWARZANIA
4. SMART AI — INTELIGENCJA BEZ KONFIGURACJI
5. KATALOG TYPOW ELEMENTOW
6. PRZYKLADY PRZEPLYWOW
7. BAZA DANYCH — SCHEMATY
8. API — ENDPOINTY
9. IMPLEMENTACJA KROK PO KROKU

---

# 1. WPROWADZENIE I ARCHITEKTURA

## 1.1 Czym jest Streams

Streams to system Personal Knowledge Management / CRM oparty na metaforze wodnej:

```
ZRODLO (Source)     — brama wejsciowa, wszystko tu trafia
STRUMIEN (Stream)   — kategoryzacja, moze miec doplyw (sub-strumienie)
PROJEKT (Project)   — zlozone przedsiewziecie w strumieniu
ZADANIE (Task)      — konkretna akcja do wykonania
ZAMROZONY (Frozen)  — element odlozony na pozniej
REFERENCJA (Reference) — material informacyjny bez akcji
```

## 1.2 Glowna zasada przeplywu

```
INPUT (dowolny)
    |
    v
[ZRODLO] — element czeka (stream_id = NULL)
    |
    v
[AI ANALIZUJE] — proponuje akcje, strumien, powiazania
    |
    v
[USER DECYDUJE] — zatwierdza / modyfikuje / odrzuca
    |
    v
[WYKONANIE] — element ZNIKA ze Zrodla, trafia do strumienia
```

KRYTYCZNE: Element w Zrodle ma stream_id = NULL. Po przetworzeniu MUSI miec stream_id ustawione i status = PROCESSED.

## 1.3 Architektura systemu

```
+------------------------------------------------------------------+
|                         ORGANIZACJA                               |
+------------------------------------------------------------------+
|                                                                    |
|  ENCJE GLOBALNE              STRUMIENIE              UPRAWNIENIA  |
|  (wspoldzielone)             (hierarchia)            (dziedziczone)|
|                                                                    |
|  [Firmy]                     [Firma A]               User1: OWNER |
|    - ABC Okna (NIP)            [Targi]               User2: MEMBER|
|    - XYZ Windows                 [BUDMA 2025]                     |
|                                    [Projekt ABC]                  |
|  [Kontakty]                                                       |
|    - Marek Kowalski          [Firma B]               User3: OWNER |
|    - Anna Nowak                [Projekty]                         |
|                                                                    |
|         |                           |                             |
|         +-------- POWIAZANIA -------+                             |
|                                                                    |
+------------------------------------------------------------------+
```

---

# 2. FUNDAMENTY — HIERARCHIA, ENCJE, POWIAZANIA

## 2.1 Encje globalne vs Strumienie

ENCJE GLOBALNE — istnieja RAZ w calym systemie:

| Encja | Identyfikator | Przyklad |
|-------|---------------|----------|
| Firma | NIP (unikalny) | ABC Okna, NIP: 123-456-78-90 |
| Kontakt | Osoba (email/telefon) | Marek Kowalski |

STRUMIENIE — hierarchiczne, z uprawnieniami:

| Element | Gdzie zyje | Widocznosc |
|---------|------------|------------|
| Strumien | W hierarchii | Czlonkowie + dziedziczenie |
| Projekt | W 1 strumieniu | Jak strumien nadrzedny |
| Zadanie | W strumieniu/projekcie | Jak rodzic |

## 2.2 Hierarchia strumieni — przyklad

```
ORGANIZACJA: Sorto Holdings
|
+-- NASZA FIRMA A (Stoiska Targowe Sp. z o.o.)
|   |   Czlonkowie: Wlasciciel, Janek, Kasia, Tomek
|   |
|   +-- TARGI
|   |   |   Czlonkowie: dziedziczone + Ania
|   |   |
|   |   +-- BUDMA 2025
|   |   |   +-- Projekt: Stoisko ABC Okna
|   |   |   |   Powiazania: Firma ABC, Kontakt Marek, Deal 80k
|   |   |   +-- Projekt: Stoisko XYZ
|   |   |   +-- Projekt: Wlasne stoisko
|   |   |
|   |   +-- WARSAW HOME 2025
|   |   +-- BUDMA 2024 [ZAMROZONY]
|   |
|   +-- KLIENCI
|   |   +-- Link: ABC Okna (widok klienta)
|   |   +-- Link: XYZ Windows
|   |
|   +-- SPRZEDAZ
|   |   +-- Pipeline
|   |   +-- Oferty w toku
|   |
|   +-- FINANSE
|       +-- Faktury kosztowe
|       +-- Faktury sprzedazowe
|
+-- NASZA FIRMA B (Digital Agency)
|   |   Czlonkowie: Wlasciciel, Ewa, Piotr
|   |   UWAGA: Janek, Kasia, Tomek NIE WIDZA tej firmy!
|   |
|   +-- PROJEKTY
|   |   +-- Strona dla 123 Glass
|   |       Powiazanie: Firma 123 Glass, Kontakt Marek (ten sam!)
|   |
|   +-- KLIENCI
|       +-- Link: 123 Glass
|       +-- Link: ABC Okna (WIDZI tylko projekty z Firmy B!)
|
+-- PRYWATNE
    |   Czlonkowie: tylko Wlasciciel
    +-- Dom
    +-- Rodzina
    +-- Rozwoj
```

## 2.3 Powiazania (Links)

Projekt istnieje FIZYCZNIE w jednym strumieniu, ale jest WIDOCZNY z wielu perspektyw:

```
PROJEKT: Stoisko ABC Okna — BUDMA 2025

Lokalizacja fizyczna:
    Firma A -> Targi -> BUDMA 2025 -> [ten projekt]

Powiazania (widoczny takze w):
    - Firma A -> Klienci -> ABC Okna (perspektywa klienta)
    - Firma A -> Sprzedaz -> Pipeline (perspektywa sprzedazowa)
    - Kontakt: Marek Kowalski (perspektywa osoby)
```

## 2.4 Uprawnienia — dziedziczenie

```
Strumien TARGI
    Czlonkowie: Wlasciciel, Janek, Kasia + Ania
    |
    +-- Strumien BUDMA 2025
        Czlonkowie: DZIEDZICZONE (Wlasciciel, Janek, Kasia, Ania)
        |
        +-- Projekt ABC
            Czlonkowie: DZIEDZICZONE
```

Logika sprawdzania dostepu:

```typescript
async function canUserAccessStream(userId: string, streamId: string): Promise<boolean> {
  // 1. Sprawdz bezposrednie czlonkostwo
  const direct = await prisma.streamMembership.findFirst({
    where: { userId, streamId }
  });
  if (direct) return true;
  
  // 2. Sprawdz dziedziczenie (rekurencyjnie w gore)
  const stream = await prisma.stream.findUnique({ where: { id: streamId } });
  if (stream.parentId) {
    return canUserAccessStream(userId, stream.parentId);
  }
  
  return false;
}
```

## 2.5 Widocznosc encji globalnych

Marek Kowalski jest GLOBALNY, ale user widzi tylko to, do czego ma dostep:

```typescript
async function getContactVisibility(contactId: string, userId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { projectLinks: { include: { project: true } } }
  });
  
  const userStreams = await getVisibleStreamsForUser(userId);
  const userStreamIds = userStreams.map(s => s.id);
  
  // Filtruj — pokaz tylko projekty w strumieniach usera
  const visibleProjects = contact.projectLinks.filter(link =>
    userStreamIds.includes(link.project.streamId)
  );
  
  return { contact, visibleProjects };
}
```

---

# 3. FLOW ENGINE — SILNIK PRZETWARZANIA

## 3.1 Koncepcja

Flow Engine SPINA istniejace komponenty:

```
[ZRODLO]  -->  [FLOW ENGINE]  -->  [SUGESTIE]
(input)             |               (output)
                    |
              +-----+-----+
              |           |
          [PROMPTY]  [AUTOMATYZACJE]
          (jak)      (kiedy auto)
```

## 3.2 Przeplyw w Flow Engine

```
KROK 1: Identyfikacja typu
        EMAIL? VOICE? DOCUMENT? IMAGE? LINK? IDEA?

KROK 2: Wybor promptu
        SOURCE_EMAIL / SOURCE_VOICE / SOURCE_ANALYZE...
        (z tabeli ai_prompts)

KROK 3: Budowanie kontekstu
        - Lista strumieni usera
        - Few-shot examples (ostatnie korekty)
        - Preferencje usera

KROK 4: Wywolanie AI
        Provider -> Model -> Temperatura

KROK 5: Sprawdzenie regul automatyzacji
        Czy pasuje do jakiejs reguly?
        - TAK + autonomia >= 2 -> AUTO-WYKONAJ
        - NIE lub autonomia 1 -> UTWORZ SUGESTIE
```

## 3.3 Implementacja Flow Engine

```typescript
// services/flow/flowEngine.ts

export async function processSourceItem(
  itemId: string,
  userId: string,
  organizationId: string
): Promise<FlowResult> {
  
  const item = await prisma.sourceItem.findUnique({ where: { id: itemId } });
  
  if (!item || item.status !== 'NEW') {
    throw new Error('Item not found or already processed');
  }
  
  // Oznacz jako przetwarzany
  await prisma.sourceItem.update({
    where: { id: itemId },
    data: { status: 'PROCESSING' }
  });
  
  try {
    // KROK 1-2: Typ i prompt
    const promptCode = getPromptCodeForType(item.type);
    const prompt = await getPromptByCode(promptCode);
    
    // KROK 3: Kontekst
    const context = await buildContext(userId, organizationId, item);
    
    // KROK 4: AI
    const systemPrompt = renderPrompt(prompt.systemPrompt, context);
    const userPrompt = renderPrompt(prompt.userPromptTemplate, {
      itemContent: item.content,
      itemMetadata: item.metadata
    });
    
    const ai = new AIProviderService(prompt.defaultProvider);
    const aiResponse = await ai.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: prompt.defaultModel,
      temperature: prompt.defaultTemperature
    });
    
    const analysis = parseAIResponse(aiResponse.content, item.type);
    
    // KROK 5: Automatyzacja
    const matchingRule = await checkAutomationRules({
      itemType: item.type,
      analysis,
      userId,
      organizationId
    });
    
    const userSettings = await prisma.userAiSettings.findUnique({
      where: { userId }
    });
    const autonomyLevel = userSettings?.autonomyLevel || 1;
    
    if (matchingRule && autonomyLevel >= 2) {
      // AUTO-WYKONAJ
      await executeAction({
        itemId,
        action: analysis.suggestedAction,
        streamId: analysis.suggestedStreamId,
        analysis
      });
      
      return { autoExecuted: true, executedAction: analysis.suggestedAction, analysis };
      
    } else {
      // UTWORZ SUGESTIE
      const suggestion = await prisma.aiSuggestion.create({
        data: {
          userId,
          organizationId,
          sourceItemId: itemId,
          context: item.type,
          suggestion: analysis,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          status: 'PENDING'
        }
      });
      
      await prisma.sourceItem.update({
        where: { id: itemId },
        data: { status: 'PENDING_REVIEW' }
      });
      
      return { suggestionId: suggestion.id, autoExecuted: false, analysis };
    }
    
  } catch (error) {
    await prisma.sourceItem.update({
      where: { id: itemId },
      data: { status: 'NEW' }
    });
    throw error;
  }
}

function getPromptCodeForType(type: string): string {
  const mapping: Record<string, string> = {
    'EMAIL': 'SOURCE_EMAIL',
    'VOICE': 'SOURCE_VOICE',
    'DOCUMENT_INVOICE': 'SOURCE_INVOICE',
    'DOCUMENT_CONTRACT': 'SOURCE_CONTRACT',
    'IMAGE_BUSINESS_CARD': 'SOURCE_BUSINESS_CARD',
    'IMAGE_RECEIPT': 'SOURCE_RECEIPT',
    'IMAGE_WHITEBOARD': 'SOURCE_WHITEBOARD',
    'LINK': 'SOURCE_LINK',
    'IDEA': 'SOURCE_ANALYZE',
    'EVENT': 'SOURCE_EVENT',
    'SMS': 'SOURCE_SMS'
  };
  return mapping[type] || 'SOURCE_ANALYZE';
}
```

## 3.4 Action Executor

```typescript
// services/flow/actionExecutor.ts

export async function executeAction(params: {
  itemId: string;
  action: string;
  streamId: string;
  analysis: any;
}) {
  const { itemId, action, streamId, analysis } = params;
  
  const item = await prisma.sourceItem.findUnique({ where: { id: itemId } });
  
  switch (action) {
    case 'ZROB_TERAZ':
      await prisma.task.create({
        data: {
          title: analysis.extractedTasks?.[0]?.title || item.content,
          streamId,
          sourceItemId: itemId,
          priority: 'HIGH',
          dueDate: new Date(),
          status: 'TODO'
        }
      });
      break;
      
    case 'ZAPLANUJ':
      await prisma.task.create({
        data: {
          title: analysis.extractedTasks?.[0]?.title || item.content,
          streamId,
          sourceItemId: itemId,
          priority: analysis.suggestedPriority || 'MEDIUM',
          dueDate: analysis.suggestedDueDate ? new Date(analysis.suggestedDueDate) : null,
          status: 'TODO'
        }
      });
      break;
      
    case 'PROJEKT':
      const project = await prisma.project.create({
        data: {
          name: item.content,
          streamId,
          sourceItemId: itemId,
          status: 'ACTIVE'
        }
      });
      
      // Dodaj sugerowane zadania
      if (analysis.extractedTasks?.length > 0) {
        for (const task of analysis.extractedTasks) {
          await prisma.task.create({
            data: {
              title: task.title,
              streamId,
              projectId: project.id,
              status: 'TODO',
              priority: 'MEDIUM'
            }
          });
        }
      }
      break;
      
    case 'KIEDYS_MOZE':
      await prisma.frozenItem.create({
        data: {
          title: item.content,
          streamId,
          sourceItemId: itemId,
          status: 'FROZEN',
          frozenAt: new Date()
        }
      });
      break;
      
    case 'REFERENCJA':
      await prisma.reference.create({
        data: {
          title: item.content,
          streamId,
          sourceItemId: itemId,
          tags: analysis.suggestedTags || []
        }
      });
      break;
      
    case 'USUN':
      // Soft delete
      break;
  }
  
  // KRYTYCZNE: Oznacz zrodlo jako przetworzone
  await prisma.sourceItem.update({
    where: { id: itemId },
    data: {
      status: 'PROCESSED',
      processedAction: action,
      streamId: streamId,
      processedAt: new Date()
    }
  });
}
```

---

# 4. SMART AI — INTELIGENCJA BEZ KONFIGURACJI

## 4.1 Problem i rozwiazanie

ZLE (Basic AI):
```
User dodaje element -> AI patrzy na reguly -> Brak regul?
                                                  |
                                                  v
                                          "Nie wiem" (30%)
```

DOBRZE (Smart AI):
```
User dodaje element -> AI SAMO analizuje gleboko -> Sugeruje madrze
                       |
                       +-- Rozumie kontekst semantyczny
                       +-- Wykrywa intencje
                       +-- Dopasowuje do strumieni
                       +-- Proponuje nowe strumienie gdy trzeba
                       +-- Uczy sie z kazdej interakcji
```

## 4.2 Cztery warstwy inteligencji

```
WARSTWA 4: Uczenie sie        (personalizacja)
    "User zawsze emaile od @abc.pl daje do ABC Okna"

WARSTWA 3: Reguly usera       (jesli sa)
    Sprawdz automation_rules

WARSTWA 2: Dopasowanie semantyczne   (ZAWSZE dziala!)
    Porownaj tresc z nazwami strumieni
    "oferta dla klienta" -> strumien "Sprzedaz" (similarity 87%)

WARSTWA 1: Analiza tresci     (fundament)
    Typ, ekstrakcja zadan, wykrywanie terminow
```

## 4.3 Warstwa 1: Gleboka analiza tresci

```typescript
interface DeepContentAnalysis {
  detectedType: 'TASK' | 'PROJECT' | 'REFERENCE' | 'IDEA' | 'COMMUNICATION';
  language: string;
  
  entities: {
    people: Array<{ name: string; role?: string; confidence: number }>;
    companies: Array<{ name: string; confidence: number }>;
    dates: Array<{ text: string; parsed: Date; type: 'DEADLINE' | 'EVENT' | 'MENTION' }>;
    amounts: Array<{ value: number; currency: string; context: string }>;
  };
  
  intents: Array<{
    type: 'REQUEST' | 'INFORM' | 'QUESTION' | 'REMINDER' | 'DECISION';
    confidence: number;
  }>;
  
  urgency: {
    level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    signals: string[];
  };
  
  complexity: {
    level: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
    estimatedTime?: string;
    requiresMultipleSteps: boolean;
  };
  
  topics: Array<{ name: string; confidence: number }>;
  
  actionItems: Array<{
    text: string;
    deadline?: Date;
    assignee?: string;
    priority: string;
  }>;
}
```

## 4.4 Warstwa 2: Dopasowanie semantyczne do strumieni

```typescript
async function matchToStreams(
  analysis: DeepContentAnalysis,
  userStreams: Stream[]
): Promise<StreamMatchingResult> {
  
  const matches: StreamMatch[] = [];
  
  for (const stream of userStreams) {
    let similarity = 0;
    const reasons: string[] = [];
    
    // 1. Dopasowanie nazwy do tematow
    for (const topic of analysis.topics) {
      if (semanticSimilarity(stream.name, topic.name) > 0.7) {
        similarity += 30 * topic.confidence / 100;
        reasons.push(`Temat "${topic.name}" pasuje do strumienia`);
      }
    }
    
    // 2. Dopasowanie firm (jesli strumien = klient)
    if (stream.pattern === 'client') {
      for (const company of analysis.entities.companies) {
        if (fuzzyMatch(stream.name, company.name)) {
          similarity += 50;
          reasons.push(`Firma "${company.name}" to ten klient`);
        }
      }
    }
    
    // 3. Dopasowanie do historii strumienia
    const streamHistory = await getRecentStreamItems(stream.id, 10);
    const historySim = compareWithHistory(analysis, streamHistory);
    if (historySim > 0.5) {
      similarity += 15 * historySim;
      reasons.push('Podobne elementy juz sa w tym strumieniu');
    }
    
    // 4. Dopasowanie osob
    for (const person of analysis.entities.people) {
      const contactInStream = await findContactInStream(person.name, stream.id);
      if (contactInStream) {
        similarity += 25;
        reasons.push(`${person.name} jest kontaktem w tym strumieniu`);
      }
    }
    
    if (similarity > 20) {
      matches.push({ streamId: stream.id, streamName: stream.name, similarity, matchReasons: reasons });
    }
  }
  
  matches.sort((a, b) => b.similarity - a.similarity);
  
  const bestMatch = matches[0];
  const suggestNew = !bestMatch || bestMatch.similarity < 50;
  
  return {
    matches: matches.slice(0, 5),
    bestMatch: bestMatch?.similarity >= 50 ? bestMatch : null,
    suggestNewStream: suggestNew,
    suggestedNewStreamName: suggestNew ? generateStreamName(analysis) : undefined
  };
}
```

## 4.5 Warstwa 3: Inteligentny wybor akcji

```typescript
function determineAction(analysis: DeepContentAnalysis): ActionRecommendation {
  
  // ZROB TERAZ: proste, pilne, < 2 min
  if (
    analysis.complexity.level === 'SIMPLE' &&
    analysis.urgency.level !== 'NONE' &&
    analysis.complexity.estimatedTime?.includes('minut')
  ) {
    return {
      action: 'ZROB_TERAZ',
      confidence: 90,
      reasoning: 'Proste zadanie, wymaga szybkiej reakcji.'
    };
  }
  
  // ZAPLANUJ: konkretne zadanie z deadline
  if (
    analysis.detectedType === 'TASK' &&
    analysis.actionItems.length > 0 &&
    analysis.actionItems[0].deadline
  ) {
    return {
      action: 'ZAPLANUJ',
      confidence: 85,
      reasoning: `Wykryto zadanie z terminem: ${analysis.actionItems[0].deadline}`,
      suggestedDueDate: analysis.actionItems[0].deadline
    };
  }
  
  // PROJEKT: zlozone, wiele krokow
  if (
    analysis.complexity.level === 'COMPLEX' ||
    analysis.complexity.requiresMultipleSteps ||
    analysis.actionItems.length > 2
  ) {
    return {
      action: 'PROJEKT',
      confidence: 80,
      reasoning: 'Zlozone zadanie wymagajace wielu krokow.',
      suggestedTasks: analysis.actionItems.map(a => a.text)
    };
  }
  
  // REFERENCJA: brak akcji, informacja
  if (
    analysis.detectedType === 'REFERENCE' ||
    analysis.intents.every(i => i.type === 'INFORM')
  ) {
    return {
      action: 'REFERENCJA',
      confidence: 70,
      reasoning: 'Element informacyjny, brak konkretnej akcji.'
    };
  }
  
  // KIEDYS/MOZE: pomysl bez pilnosci
  if (analysis.detectedType === 'IDEA' && analysis.urgency.level === 'NONE') {
    return {
      action: 'KIEDYS_MOZE',
      confidence: 65,
      reasoning: 'Pomysl bez okreslonego terminu realizacji.'
    };
  }
  
  // Domyslnie
  return {
    action: 'ZAPLANUJ',
    confidence: 50,
    reasoning: 'Domyslna akcja.'
  };
}
```

## 4.6 Warstwa 4: Uczenie sie z zachowan

```typescript
async function learnFromUserDecision(
  item: SourceItem,
  analysis: DeepContentAnalysis,
  userDecision: { action: string; streamId: string }
) {
  // Czy user zmienil sugestie AI?
  if (userDecision.action !== analysis.suggestedAction ||
      userDecision.streamId !== analysis.suggestedStreamId) {
    
    // Wykryj wzorce
    const possiblePatterns = detectPatterns(item, analysis);
    
    for (const pattern of possiblePatterns) {
      const existing = await findSimilarPattern(pattern, userDecision);
      
      if (existing) {
        // Wzmocnij istniejacy wzorzec
        await prisma.learnedPattern.update({
          where: { id: existing.id },
          data: {
            occurrences: { increment: 1 },
            confidence: calculateNewConfidence(existing.occurrences + 1),
            lastUsed: new Date()
          }
        });
      } else {
        // Utworz nowy wzorzec (poczatkowo slaby)
        await prisma.learnedPattern.create({
          data: {
            userId: item.userId,
            conditions: pattern,
            learnedAction: userDecision.action,
            learnedStreamId: userDecision.streamId,
            occurrences: 1,
            confidence: 30
          }
        });
      }
    }
  }
}

function calculateNewConfidence(occurrences: number): number {
  // 1x = 30%, 3x = 60%, 5x = 75%, 10x = 90%
  return Math.min(90, 30 + 20 * Math.log2(occurrences + 1));
}
```

---

# 5. KATALOG TYPOW ELEMENTOW

## 5.1 Matryca typow

| Typ | Rozbija na watki | Tworzy encje | Aktualizuje status | Typowa akcja |
|-----|------------------|--------------|-------------------|--------------|
| EMAIL | NIE | Kontakt, Firma | Projekt, Deal | ZAPLANUJ |
| VOICE | TAK | NIE | NIE | ROZNE per watek |
| DOCUMENT_INVOICE | NIE | Dostawca | NIE | ZAPLANUJ |
| DOCUMENT_CONTRACT | NIE | NIE | Deal -> WON | REFERENCJA |
| IMAGE_BUSINESS_CARD | NIE | Kontakt, Firma | NIE | PROJEKT |
| IMAGE_RECEIPT | NIE | NIE | NIE | REFERENCJA |
| IMAGE_WHITEBOARD | TAK (sekcje) | NIE | Wiele projektow | ROZNE |
| LINK | NIE | NIE | NIE | REFERENCJA |
| IDEA | NIE | NIE | NIE | PROJEKT/ZAMROZ |
| EVENT | NIE | NIE | Projekt | ZAPLANUJ |
| SMS | NIE | NIE | NIE | ZROB_TERAZ |

## 5.2 EMAIL — Flow

```
INPUT:
    Od: marek.kowalski@abcokna.pl
    Temat: Re: Budma 2025 - akceptacja
    Tresc: "Wizualizacje OK. Faktura zaliczkowa 50% do 20.12."
    Zalacznik: Umowa_ABC.pdf
         |
         v
AI ANALIZUJE:
    ENCJE:
        Kontakt: Marek Kowalski (istniejacy, ID: contact-123)
        Firma: ABC Okna (z domeny, ID: company-abc)
        Wydarzenie: BUDMA 2025 (strumien: stream-budma)
    
    PROJEKT ZNALEZIONY:
        Stoisko ABC Okna (w: Firma A -> Targi -> BUDMA 2025)
    
    DEAL POWIAZANY:
        Deal #D-042 (wartosc: 80k, etap: PROPOSAL)
    
    WYEKSTRAHOWANE:
        Zadanie: Faktura zaliczkowa 50%
        Termin: 20.12.2025
        Kwota: 40 000 PLN (50% z 80k)
        Zalacznik: Umowa (wymaga osobnej analizy)
    
    AKTUALIZACJE:
        Projekt: faza Wizualizacje -> Realizacja
        Deal: etap PROPOSAL -> WON (umowa!)
         |
         v
SUGESTIA:
    Akcja: ZAPLANUJ
    Strumien: Firma A -> Targi -> BUDMA 2025
    Projekt: Stoisko ABC Okna
    Pewnosc: 96%
    
    Zadania: [Wystawic fakture 40k, termin 20.12]
    Aktualizacje: [Deal -> WON, Projekt -> Realizacja]
    Powiazania: [ABC Okna, Marek, Deal #D-042]
```

## 5.3 VOICE — Flow (KLUCZOWE: rozbijanie na watki)

```
INPUT (transkrypcja):
    "Spotkanie z Markiem z ABC bylo dobre, akceptuja wizualizacje,
     trzeba wyslac fakture do konca tygodnia. Jeszcze jedno -
     kupic kwiaty dla zony bo rocznica w sobote. A i Tomek
     prosil zeby zamowic wiecej plyty MDF na magazyn."
         |
         v
AI ANALIZUJE — WYKRYTE 3 WATKI:
    
    WATEK 1: BIZNES / ABC Okna
        Tresc: "Spotkanie z Markiem, faktura do konca tygodnia"
        Encje: Marek, ABC Okna
        Projekt: Stoisko ABC (BUDMA 2025)
        Sugestia: ZAPLANUJ -> BUDMA 2025 / ABC
    
    WATEK 2: PRYWATNE / Rodzina
        Tresc: "Kupic kwiaty, rocznica w sobote"
        Kategoria: Prywatne / Rodzina
        Pilnosc: WYSOKA
        Sugestia: ZROB_TERAZ -> Prywatne / Rodzina
    
    WATEK 3: BIZNES / Operacje
        Tresc: "Tomek prosil zamowic plyte MDF"
        Kategoria: Operacje / Magazyn
        Sugestia: ZAPLANUJ -> Firma A / Operacje
         |
         v
SUGESTIA — 3 OSOBNE ELEMENTY:
    
    [x] Watek 1 -> ZAPLANUJ
        Strumien: BUDMA 2025
        Zadanie: Faktura zaliczkowa
    
    [x] Watek 2 -> ZROB_TERAZ
        Strumien: Prywatne / Rodzina
        Zadanie: Kupic kwiaty (PILNE!)
    
    [x] Watek 3 -> ZAPLANUJ
        Strumien: Operacje / Magazyn
        Zadanie: Zamowic plyte MDF
```

## 5.4 IMAGE_BUSINESS_CARD — Flow

```
INPUT: Zdjecie wizytowki
    
    +----------------------------------+
    |  ANNA WISNIEWSKA                 |
    |  Marketing Director              |
    |                                  |
    |  NEWBRAND Sp. z o.o.             |
    |  a.wisniewska@newbrand.pl        |
    |  +48 600 123 456                 |
    +----------------------------------+
         |
         v
AI ANALIZUJE (OCR):
    Imie: Anna
    Nazwisko: Wisniewska
    Stanowisko: Marketing Director
    Firma: NEWBRAND Sp. z o.o.
    Email: a.wisniewska@newbrand.pl
    Telefon: +48 600 123 456
    
    ENCJE: NOWE (do utworzenia)
    KONTEKST: Metadata zdjecia -> data, lokalizacja
         |
         v
SUGESTIA:
    Akcja: PROJEKT (nowy kontakt = potencjalny lead)
    Strumien: Firma A -> Klienci
    Pewnosc: 88%
    
    ENCJE DO UTWORZENIA:
        Firma: NEWBRAND Sp. z o.o.
        Kontakt: Anna Wisniewska -> NEWBRAND
    
    ZADANIE:
        Follow-up z Anna (NEWBRAND), termin: +3 dni
```

## 5.5 IMAGE_WHITEBOARD — Flow (rozbijanie na sekcje)

```
INPUT: Zdjecie tablicy ze spotkania
    
    BUDMA 2025 - PLAN
    =================
    
    ABC Okna:
      -> wizualizacja do 15.12 [check]
      -> produkcja: styczen
      -> montaz: 10-12.02
    
    XYZ Windows:
      -> czekamy na brief
      -> deadline oferty: 20.12
    
    WLASNE STOISKO:
      -> projekt: Tomek
      -> budzet: max 30k
         |
         v
AI ANALIZUJE — WYKRYTE 3 SEKCJE:
    
    SEKCJA: ABC Okna
        Projekt: Stoisko ABC -> ISTNIEJACY
        Aktualizacje:
            - Wizualizacja: DONE
            - Dodaj: Produkcja (styczen)
            - Dodaj: Montaz (10-12.02)
    
    SEKCJA: XYZ Windows
        Projekt: Stoisko XYZ -> ISTNIEJACY
        Aktualizacje:
            - Dodaj: Otrzymac brief (BLOCKER)
            - Dodaj: Oferta (deadline 20.12)
    
    SEKCJA: Wlasne stoisko
        Projekt: Wlasne stoisko
        Aktualizacje:
            - Deleguj do: Tomek
            - Budzet: 30k max
         |
         v
SUGESTIA — 3 AKTUALIZACJE PROJEKTOW:
    
    [x] Projekt ABC: oznacz wizualizacje DONE, dodaj 2 zadania
    [x] Projekt XYZ: dodaj blocker + deadline
    [x] Projekt Wlasne: deleguj do Tomka, ustaw budzet
```

## 5.6 Type Router — Implementacja

```typescript
interface TypeConfig {
  promptCode: string;
  canSplitThreads: boolean;
  canCreateEntities: boolean;
  canUpdateStatus: boolean;
  defaultAction: string;
  requiresOCR: boolean;
  requiresFetch: boolean;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  EMAIL: {
    promptCode: 'SOURCE_EMAIL',
    canSplitThreads: false,
    canCreateEntities: true,
    canUpdateStatus: true,
    defaultAction: 'ZAPLANUJ',
    requiresOCR: false,
    requiresFetch: false
  },
  
  VOICE: {
    promptCode: 'SOURCE_VOICE',
    canSplitThreads: true,  // KLUCZOWE!
    canCreateEntities: false,
    canUpdateStatus: false,
    defaultAction: 'MIXED',
    requiresOCR: false,
    requiresFetch: false
  },
  
  DOCUMENT_INVOICE: {
    promptCode: 'SOURCE_INVOICE',
    canSplitThreads: false,
    canCreateEntities: true,
    canUpdateStatus: false,
    defaultAction: 'ZAPLANUJ',
    requiresOCR: true,
    requiresFetch: false
  },
  
  DOCUMENT_CONTRACT: {
    promptCode: 'SOURCE_CONTRACT',
    canSplitThreads: false,
    canCreateEntities: false,
    canUpdateStatus: true,
    defaultAction: 'REFERENCJA',
    requiresOCR: true,
    requiresFetch: false
  },
  
  IMAGE_BUSINESS_CARD: {
    promptCode: 'SOURCE_BUSINESS_CARD',
    canSplitThreads: false,
    canCreateEntities: true,
    canCreateEntities: true,
    canUpdateStatus: false,
    defaultAction: 'PROJEKT',
    requiresOCR: true,
    requiresFetch: false
  },
  
  IMAGE_WHITEBOARD: {
    promptCode: 'SOURCE_WHITEBOARD',
    canSplitThreads: true,  // Na sekcje!
    canCreateEntities: false,
    canUpdateStatus: true,
    defaultAction: 'MIXED',
    requiresOCR: true,
    requiresFetch: false
  },
  
  LINK: {
    promptCode: 'SOURCE_LINK',
    canSplitThreads: false,
    canCreateEntities: false,
    canUpdateStatus: false,
    defaultAction: 'REFERENCJA',
    requiresOCR: false,
    requiresFetch: true
  },
  
  IDEA: {
    promptCode: 'SOURCE_ANALYZE',
    canSplitThreads: false,
    canCreateEntities: false,
    canUpdateStatus: false,
    defaultAction: 'PROJEKT',
    requiresOCR: false,
    requiresFetch: false
  }
};

export function getTypeConfig(type: string): TypeConfig {
  return TYPE_CONFIG[type] || TYPE_CONFIG['IDEA'];
}
```

---

# 6. PRZYKLADY PRZEPLYWOW

## 6.1 Przyklad: Email od znanego klienta

INPUT:
```
Od: marek@abcokna.pl
Temat: Budma - wizualizacje OK
Tresc: "Akceptuje wizualizacje, prosze o oferte koncowa"
```

AI RESPONSE:
```json
{
  "suggestedAction": "ZAPLANUJ",
  "suggestedStreamId": "str-budma-2025",
  "suggestedProjectId": "proj-abc-stoisko",
  "confidence": 95,
  
  "entities": {
    "sender": {
      "matchedContactId": "contact-marek",
      "matchedCompanyId": "company-abc"
    }
  },
  
  "extractedTasks": [
    { "title": "Przygotowac oferte koncowa dla ABC", "priority": "HIGH" }
  ],
  
  "statusUpdates": [
    { "entity": "PROJECT", "id": "proj-abc", "field": "phase", "to": "Ofertowanie" }
  ],
  
  "links": [
    { "type": "COMPANY", "id": "company-abc" },
    { "type": "CONTACT", "id": "contact-marek" }
  ],
  
  "reasoning": "Email od Marka (ABC Okna) dot. projektu Budma 2025. Akceptacja wizualizacji = faza ofertowania."
}
```

BACKEND EXECUTION:
```typescript
// 1. Utworz zadanie
await prisma.task.create({
  data: {
    title: "Przygotowac oferte koncowa dla ABC",
    streamId: "str-budma-2025",
    projectId: "proj-abc-stoisko",
    priority: "HIGH",
    status: "TODO"
  }
});

// 2. Aktualizuj projekt
await prisma.project.update({
  where: { id: "proj-abc-stoisko" },
  data: { phase: "Ofertowanie" }
});

// 3. Dodaj powiazania
await prisma.taskLink.createMany({
  data: [
    { taskId: task.id, linkedType: "COMPANY", linkedId: "company-abc" },
    { taskId: task.id, linkedType: "CONTACT", linkedId: "contact-marek" }
  ]
});

// 4. Oznacz zrodlo jako przetworzone
await prisma.sourceItem.update({
  where: { id: itemId },
  data: { status: "PROCESSED", streamId: "str-budma-2025" }
});
```

## 6.2 Przyklad: Notatka glosowa (rozbicie na watki)

INPUT (transkrypcja):
```
"Marek z ABC dzwonil, budzet rosnie do 100k. A i kupic mleko w drodze do domu."
```

AI RESPONSE:
```json
{
  "threads": [
    {
      "index": 0,
      "content": "Marek z ABC dzwonil, budzet rosnie do 100k",
      "category": "BUSINESS",
      "suggestedAction": "ZAPLANUJ",
      "suggestedStreamId": "str-budma-2025",
      "entities": {
        "people": [{ "name": "Marek", "matchedId": "contact-marek" }],
        "companies": [{ "name": "ABC", "matchedId": "company-abc" }],
        "amounts": [{ "value": 100000, "currency": "PLN", "context": "nowy budzet" }]
      },
      "extractedTask": {
        "title": "Zaktualizowac oferte ABC do nowego budzetu 100k",
        "priority": "HIGH"
      },
      "statusUpdates": [
        { "entity": "DEAL", "id": "deal-abc", "field": "value", "to": 100000 }
      ],
      "confidence": 90
    },
    {
      "index": 1,
      "content": "Kupic mleko w drodze do domu",
      "category": "PERSONAL",
      "suggestedAction": "ZROB_TERAZ",
      "suggestedStreamId": "str-prywatne-dom",
      "extractedTask": {
        "title": "Kupic mleko",
        "priority": "MEDIUM"
      },
      "confidence": 95
    }
  ]
}
```

BACKEND: Przetworz kazdy watek osobno, utworz 2 zadania w roznych strumieniach.

## 6.3 Przyklad: User MODYFIKUJE sugestie

AI sugerowalo:
```json
{
  "suggestedAction": "KIEDYS_MOZE",
  "suggestedStreamId": "str-pomysly",
  "confidence": 65
}
```

User wybral:
```json
{
  "chosenAction": "ZAPLANUJ",
  "chosenStreamId": "str-marketing",
  "addedDueDate": "2025-01-15"
}
```

BACKEND — Zapisz feedback i naucz sie:
```typescript
// 1. Zapisz modyfikacje
await prisma.aiSuggestion.update({
  where: { id: suggestionId },
  data: {
    status: "MODIFIED",
    userModifications: {
      originalAction: "KIEDYS_MOZE",
      chosenAction: "ZAPLANUJ",
      originalStreamId: "str-pomysly",
      chosenStreamId: "str-marketing"
    }
  }
});

// 2. Naucz sie na przyszlosc
await learnFromUserDecision(item, analysis, {
  action: "ZAPLANUJ",
  streamId: "str-marketing"
});
```

---

# 7. BAZA DANYCH — SCHEMATY

## 7.1 Encje globalne

```sql
-- Firmy (globalne, wspoldzielone)
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nip VARCHAR(20) UNIQUE,           -- UNIKALNY w calym systemie!
    address TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Kontakty (globalne, wspoldzielone)
CREATE TABLE contacts (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Kontakt moze byc w wielu firmach
CREATE TABLE contact_company_roles (
    id UUID PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id),
    company_id UUID REFERENCES companies(id),
    role VARCHAR(100),                 -- "Dyrektor", "Konsultant"
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(contact_id, company_id)
);
```

## 7.2 Strumienie i uprawnienia

```sql
-- Strumienie (hierarchiczne)
CREATE TABLE streams (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pattern VARCHAR(50),               -- 'client', 'project', 'area', 'event'
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'FROZEN'
    
    parent_id UUID REFERENCES streams(id),
    organization_id UUID NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Czlonkostwo w strumieniach
CREATE TABLE stream_memberships (
    id UUID PRIMARY KEY,
    stream_id UUID REFERENCES streams(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(20) NOT NULL,         -- 'OWNER', 'ADMIN', 'MEMBER', 'VIEWER'
    inherited BOOLEAN DEFAULT false,
    UNIQUE(stream_id, user_id)
);

-- Powiazanie firma <-> strumien
CREATE TABLE company_stream_links (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    stream_id UUID REFERENCES streams(id),
    relationship_type VARCHAR(50),     -- 'CLIENT', 'VENDOR', 'PARTNER'
    UNIQUE(company_id, stream_id)
);
```

## 7.3 Projekty, zadania, elementy

```sql
-- Projekty
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    stream_id UUID REFERENCES streams(id) NOT NULL,
    
    status VARCHAR(20) DEFAULT 'ACTIVE',
    phase VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Powiazania projektow
CREATE TABLE project_links (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    linked_type VARCHAR(50) NOT NULL,  -- 'COMPANY', 'CONTACT', 'DEAL'
    linked_id UUID NOT NULL,
    link_role VARCHAR(50)
);

-- Zadania
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    stream_id UUID REFERENCES streams(id) NOT NULL,
    project_id UUID REFERENCES projects(id),
    source_item_id UUID REFERENCES source_items(id),
    
    status VARCHAR(20) DEFAULT 'TODO',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    due_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Zrodlo (brama wejsciowa)
CREATE TABLE source_items (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,         -- 'EMAIL', 'VOICE', 'DOCUMENT', etc.
    metadata JSONB,
    
    status VARCHAR(20) DEFAULT 'NEW',  -- 'NEW', 'PROCESSING', 'PENDING_REVIEW', 'PROCESSED'
    
    stream_id UUID REFERENCES streams(id), -- NULL dopoki nie przetworzone!
    processed_action VARCHAR(50),
    processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 7.4 AI i sugestie

```sql
-- Sugestie AI
CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    source_item_id UUID REFERENCES source_items(id),
    
    context VARCHAR(50) NOT NULL,      -- typ elementu
    input_data JSONB,
    suggestion JSONB NOT NULL,
    confidence INTEGER,
    reasoning TEXT,
    
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'MODIFIED', 'REJECTED'
    user_modifications JSONB,
    resolved_at TIMESTAMP,
    
    processing_time_ms INTEGER,
    model_used VARCHAR(100),
    prompt_code VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Nauczone wzorce
CREATE TABLE learned_patterns (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    
    conditions JSONB NOT NULL,         -- warunki dopasowania
    learned_action VARCHAR(50) NOT NULL,
    learned_stream_id UUID,
    
    occurrences INTEGER DEFAULT 1,
    confidence INTEGER DEFAULT 30,
    last_used TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reguly automatyzacji
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID,                      -- NULL = regula globalna
    
    name VARCHAR(255) NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 8. API — ENDPOINTY

## 8.1 Flow endpoints

```typescript
// POST /api/v1/flow/process
// Przetwarza element przez Flow Engine
router.post('/process', authMiddleware, async (req, res) => {
  const { itemId } = req.body;
  const { userId, organizationId } = req.user;
  
  const result = await processSourceItem(itemId, userId, organizationId);
  
  res.json({
    success: true,
    data: {
      autoExecuted: result.autoExecuted,
      executedAction: result.executedAction,
      suggestionId: result.suggestionId,
      analysis: result.analysis
    }
  });
});

// POST /api/v1/flow/execute
// Wykonuje zatwierdzona akcje
router.post('/execute', authMiddleware, async (req, res) => {
  const { itemId, action, streamId, projectId, modifications } = req.body;
  
  await executeAction({ itemId, action, streamId, projectId, modifications });
  
  res.json({ success: true });
});

// POST /api/v1/flow/process-batch
// Przetwarza wiele elementow
router.post('/process-batch', authMiddleware, async (req, res) => {
  const { itemIds } = req.body;
  const results = await Promise.all(
    itemIds.map(id => processSourceItem(id, req.user.userId, req.user.organizationId))
  );
  res.json({ success: true, data: results });
});
```

## 8.2 AI feedback endpoints

```typescript
// POST /api/v1/ai/feedback
// Zapisuje feedback usera na sugestie
router.post('/feedback', authMiddleware, async (req, res) => {
  const { suggestionId, accepted, modifications, reason } = req.body;
  
  const suggestion = await prisma.aiSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: accepted ? (modifications ? 'MODIFIED' : 'ACCEPTED') : 'REJECTED',
      userModifications: modifications,
      resolvedAt: new Date()
    }
  });
  
  // Naucz sie z decyzji
  if (modifications) {
    await learnFromUserDecision(
      suggestion.sourceItemId,
      suggestion.suggestion,
      modifications
    );
  }
  
  res.json({ success: true });
});

// GET /api/v1/ai/suggestions/pending
// Pobiera oczekujace sugestie
router.get('/suggestions/pending', authMiddleware, async (req, res) => {
  const suggestions = await prisma.aiSuggestion.findMany({
    where: {
      userId: req.user.userId,
      status: 'PENDING'
    },
    include: {
      sourceItem: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json({ data: suggestions });
});
```

## 8.3 Source endpoints

```typescript
// POST /api/v1/source/items
// Dodaje nowy element do Zrodla
router.post('/items', authMiddleware, async (req, res) => {
  const { content, type, metadata } = req.body;
  
  const item = await prisma.sourceItem.create({
    data: {
      organizationId: req.user.organizationId,
      userId: req.user.userId,
      content,
      type,
      metadata,
      status: 'NEW',
      streamId: null  // KRYTYCZNE: NULL!
    }
  });
  
  res.json({ data: item });
});

// GET /api/v1/source/items
// Pobiera elementy ze Zrodla (nieprzetworzone)
router.get('/items', authMiddleware, async (req, res) => {
  const items = await prisma.sourceItem.findMany({
    where: {
      organizationId: req.user.organizationId,
      status: { in: ['NEW', 'PENDING_REVIEW'] }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json({ data: items });
});
```

---

# 9. IMPLEMENTACJA KROK PO KROKU

## Faza 0: Przygotowanie (30 min)

1. Utworz tabele w bazie:
   - source_items
   - ai_suggestions
   - learned_patterns
   - automation_rules

2. Skonfiguruj zmienne srodowiskowe:
   - OPENAI_API_KEY
   - ANTHROPIC_API_KEY
   - DEEPSEEK_API_KEY

## Faza 1: AI Provider Service (2-3h)

Plik: src/services/ai/aiProvider.ts

Implementuj klase AIProviderService z metodami dla:
- OpenAI
- Anthropic
- DeepSeek

## Faza 2: Prompt Service (1-2h)

Plik: src/services/ai/promptService.ts

Implementuj:
- renderPrompt() — podstawianie zmiennych
- getPromptByCode() — pobieranie z bazy/configu

## Faza 3: Flow Engine (2-3h)

Plik: src/services/flow/flowEngine.ts

Implementuj processSourceItem() zgodnie z sekcja 3.3.

## Faza 4: Action Executor (2h)

Plik: src/services/flow/actionExecutor.ts

Implementuj executeAction() zgodnie z sekcja 3.4.

## Faza 5: API Endpoints (2h)

Pliki: src/routes/flow.ts, src/routes/ai.ts

Implementuj endpointy z sekcji 8.

## Faza 6: UI Integration (2-3h)

1. Przycisk "Przetworz" w widoku Zrodla
2. Modal Flow z sugestia AI
3. Integracja z komponentem Sugestii

## Faza 7: Smart AI (opcjonalnie, 3-5h)

1. Implementuj buildContext() z few-shot examples
2. Implementuj matchToStreams() — dopasowanie semantyczne
3. Implementuj learnFromUserDecision() — uczenie sie

---

# KRYTYCZNE BLEDY DO UNIKANIA

## Blad 1: Szukanie strumienia "Inbox"

```typescript
// ZLE!
const inbox = await prisma.stream.findFirst({ where: { name: 'Inbox' } });
```

Zrodlo to NIE jest strumien. Elementy maja stream_id = NULL.

## Blad 2: Element zostaje w Zrodle

```typescript
// ZLE — brak aktualizacji statusu
await prisma.task.create({ ... });
// Element dalej widoczny w Zrodle!
```

```typescript
// DOBRZE
await prisma.task.create({ ... });
await prisma.sourceItem.update({
  where: { id: itemId },
  data: { status: 'PROCESSED', streamId: streamId }
});
```

## Blad 3: Zadanie bez strumienia

```typescript
// ZLE!
await prisma.task.create({
  data: { title: "...", streamId: null }
});
```

Kazde zadanie MUSI miec stream_id.

## Blad 4: AI wymysla nowe strumienie

```typescript
// ZLE — AI wymysla
suggestedStreamName: "Nowy strumien dla tego"
```

AI wybiera TYLKO z istniejacych strumieni usera. Moze SUGEROWAC utworzenie nowego, ale user musi zatwierdzic.

## Blad 5: Brak powiazania z encjami globalnymi

```typescript
// ZLE — tworzenie duplikatu
await prisma.company.create({
  data: { name: "ABC Okna", nip: "123..." }
});
// Moze juz istniec!
```

```typescript
// DOBRZE — najpierw szukaj
let company = await prisma.company.findFirst({
  where: { OR: [{ nip: "123..." }, { name: { contains: "ABC" } }] }
});
if (!company) {
  company = await prisma.company.create({ ... });
}
```

---

# PODSUMOWANIE

Ten dokument zawiera kompletna specyfikacje do implementacji AI w Streams:

1. ARCHITEKTURA — hierarchia, encje, powiazania, uprawnienia
2. FLOW ENGINE — silnik przetwarzania spinajacy komponenty
3. SMART AI — 4 warstwy inteligencji bez konfiguracji
4. KATALOG TYPOW — 11 typow elementow z pelnym flow
5. SCHEMATY BAZY — SQL dla wszystkich tabel
6. API — endpointy do integracji
7. CHECKLIST — krok po kroku co implementowac

Dokumenty zrodlowe (do szczegolowej referencji):
- PRZEPLYWY_STREAMS_PRZYKLADY_DLA_CODE.md
- TYPY_ELEMENTOW_ZRODLA_ANALIZA_AI.md
- FLOW_ENGINE_SPECYFIKACJA.md
- SMART_AI_INTELIGENCJA_BEZ_KONFIGURACJI.md
- HIERARCHIA_POWIAZANIA_PERSPEKTYWY.md
- KATALOG_ELEMENTOW_ZRODLA_FLOW.md
- CHECKLIST_IMPLEMENTACJI_AI_DLA_CODE.md
- BIBLIOTEKA_PROMPTOW_AI_STREAMS.md

---

KONIEC DOKUMENTU
