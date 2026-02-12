/**
 * Seed Flow Analysis Rules — per-source-type prompts + Qwen provider
 * Idempotent: skips existing rules and provider entries
 */

import { v4 as uuidv4 } from 'uuid';

interface SeedResult {
  rulesCreated: number;
  rulesSkipped: number;
  modelsCreated: number;
  providerCreated: boolean;
}

const QWEN_PROVIDER = {
  name: 'Qwen',
  displayName: 'Alibaba Qwen Models',
  baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
};

const QWEN_MODELS = [
  { name: 'qwen-max-2025-01-25', displayName: 'Qwen Max', maxTokens: 8000, inputCost: 0.004, outputCost: 0.012 },
  { name: 'qwen-plus', displayName: 'Qwen Plus', maxTokens: 8000, inputCost: 0.002, outputCost: 0.006 },
  { name: 'qwen-turbo', displayName: 'Qwen Turbo', maxTokens: 8000, inputCost: 0.0005, outputCost: 0.002 },
  { name: 'qwen-long', displayName: 'Qwen Long (10M ctx)', maxTokens: 10000000, inputCost: 0.0005, outputCost: 0.002 },
];

const SYSTEM_PROMPT_BASE = `Jesteś AI Asystentem w systemie CRM Streams. Analizujesz przychodzące elementy i wyciągasz strukturyzowane informacje.

Odpowiedz TYLKO w formacie JSON z polami:
- elementType: typ elementu (string)
- summary: streszczenie w 1-3 zdaniach (string)
- entities: rozpoznane podmioty [{name, type, role}]
- keywords: kluczowe słowa/frazy [string]
- sentiment: positive | negative | neutral | mixed
- urgency: critical | high | medium | low
- actionability: actionable | informational | requires_response | archive
- suggestedActions: sugerowane akcje [string]
- extractedData: wyciągnięte dane strukturyzowane (object)`;

interface FlowRule {
  name: string;
  description: string;
  dataType: string;
  modelId: string;
  aiSystemPrompt: string;
  aiPrompt: string;
  triggerConditions: Record<string, any>;
}

const FLOW_RULES: FlowRule[] = [
  {
    name: 'Flow: Analiza emaili',
    description: 'Analiza przychodzących emaili — intent, pilność, action items, sentyment',
    dataType: 'EMAIL',
    modelId: 'qwen-max-2025-01-25',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'sourceType', operator: 'equals', value: 'EMAIL' },
        { field: 'status', operator: 'equals', value: 'NEW' },
        { operator: 'OR', conditions: [
          { field: 'classification', operator: 'equals', value: 'BUSINESS' },
          { field: 'classification', operator: 'equals', value: 'PERSONAL' },
          { field: 'classification', operator: 'equals', value: 'UNKNOWN' },
        ]},
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla emaili:
- senderIntent: cel nadawcy (zapytanie | oferta | reklamacja | informacja | prośba | zamówienie)
- category: business | newsletter | transactional | spam | personal | notification
- actionItems: lista zadań do wykonania [{task, deadline?, owner?}]
- replyNeeded: boolean
- replyUrgency: immediate | today | this_week | no_rush | none
- completeness: complete | incomplete | unclear
- missingInfo: lista brakujących informacji potrzebnych do realizacji [string] (jeśli incomplete)
- suggestedReply: proponowana treść odpowiedzi po polsku (string) — jeśli replyNeeded=true, napisz pełną, grzeczną odpowiedź gotową do wysłania. Jeśli incomplete — poproś o brakujące informacje z konkretną listą pytań.
- dealValue: szacowana wartość transakcji jeśli można wywnioskować (number | null)
- dealStage: sugerowany etap: PROSPECT | QUALIFIED | PROPOSAL | NEGOTIATION (string | null)`,
    aiPrompt: `Przeanalizuj ten email:

Typ źródła: {{sourceType}}
Temat: {{subject}}
Nadawca: {{senderName}}
Klasyfikacja: {{classification}}

Treść:
{{content}}

{{metadata}}

WAŻNE: Jeśli to zapytanie ofertowe lub prośba o wycenę — oceń kompletność informacji. Jeśli brakuje danych potrzebnych do przygotowania odpowiedzi (np. ilości, wymiary, specyfikacja, termin) — wymień je w missingInfo i przygotuj suggestedReply z prośbą o uzupełnienie.`,
  },
  {
    name: 'Flow: Analiza notatek ze spotkań',
    description: 'Analiza notatek ze spotkań — decyzje, action items, właściciele, deadliny',
    dataType: 'MEETING_NOTES',
    modelId: 'qwen-max-2025-01-25',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'status', operator: 'equals', value: 'NEW' },
        { operator: 'OR', conditions: [
          { field: 'sourceType', operator: 'equals', value: 'MEETING_NOTES' },
          { field: 'matchedRule', operator: 'equals', value: 'Meeting Detection' },
        ]},
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla notatek ze spotkań:
- decisions: podjęte decyzje [string]
- actionItems: zadania [{task, owner, deadline?, priority?}]
- participants: uczestnicy [string]
- keyDiscussionPoints: kluczowe punkty dyskusji [string]
- followUps: follow-upy [{topic, responsible, dueDate?}]
- nextMeetingDate: data następnego spotkania (string | null)`,
    aiPrompt: `Przeanalizuj notatki ze spotkania:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}

Treść notatek:
{{content}}

{{metadata}}`,
  },
  {
    name: 'Flow: Analiza pomysłów',
    description: 'Analiza pomysłów — koncept, wartość, wykonalność, powiązania',
    dataType: 'IDEA',
    modelId: 'qwen-max-2025-01-25',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'sourceType', operator: 'equals', value: 'IDEA' },
        { field: 'status', operator: 'equals', value: 'NEW' },
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla pomysłów:
- coreConcept: główny koncept w 1 zdaniu (string)
- potentialValue: ocena wartości (high | medium | low) z uzasadnieniem
- feasibility: wykonalność (easy | moderate | complex | research_needed)
- requiredResources: potrzebne zasoby [string]
- relatedProjects: powiązane projekty lub tematy [string]
- suggestedNextSteps: proponowane następne kroki [string]
- category: product | process | marketing | technical | organizational | other`,
    aiPrompt: `Przeanalizuj ten pomysł:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}

Opis pomysłu:
{{content}}

{{metadata}}`,
  },
  {
    name: 'Flow: Analiza faktur i płatności',
    description: 'Analiza faktur — dostawca, kwota, termin, warunki płatności',
    dataType: 'BILL_INVOICE',
    modelId: 'qwen-max-2025-01-25',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'status', operator: 'equals', value: 'NEW' },
        { operator: 'OR', conditions: [
          { field: 'sourceType', operator: 'equals', value: 'BILL_INVOICE' },
          { field: 'matchedRule', operator: 'equals', value: 'Invoice Detection' },
        ]},
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla faktur:
- invoiceNumber: numer faktury (string)
- vendor: nazwa dostawcy/wystawcy (string)
- vendorNIP: NIP dostawcy (string | null)
- amount: kwota brutto (number)
- netAmount: kwota netto (number | null)
- vatAmount: kwota VAT (number | null)
- currency: waluta (string, np. "PLN", "EUR")
- issueDate: data wystawienia (string YYYY-MM-DD)
- dueDate: termin płatności (string YYYY-MM-DD)
- paymentTerms: warunki płatności (string)
- bankAccount: numer konta (string | null)
- items: pozycje [{name, quantity, unitPrice, totalPrice}]
- category: supplies | services | subscriptions | utilities | rent | other`,
    aiPrompt: `Przeanalizuj tę fakturę/rachunek:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}

Treść:
{{content}}

{{metadata}}`,
  },
  {
    name: 'Flow: Analiza rozmów telefonicznych',
    description: 'Analiza rozmów telefonicznych — rozmówca, temat, zobowiązania, follow-up',
    dataType: 'PHONE_CALL',
    modelId: 'qwen-max-2025-01-25',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'sourceType', operator: 'equals', value: 'PHONE_CALL' },
        { field: 'status', operator: 'equals', value: 'NEW' },
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla rozmów telefonicznych:
- caller: kto dzwonił (string)
- callerCompany: firma rozmówcy (string | null)
- topic: główny temat rozmowy (string)
- commitments: zobowiązania obu stron [{who, what, when?}]
- followUpActions: akcje follow-up [{action, responsible, deadline?}]
- callOutcome: wynik rozmowy (successful | callback_needed | no_answer | voicemail | transferred)
- nextContactDate: data następnego kontaktu (string | null)`,
    aiPrompt: `Przeanalizuj notatki z rozmowy telefonicznej:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}
Rozmówca: {{senderName}}

Notatki z rozmowy:
{{content}}

{{metadata}}`,
  },
  {
    name: 'Flow: Analiza dokumentów',
    description: 'Analiza dokumentów — typ, kluczowe podmioty, streszczenie, action items',
    dataType: 'DOCUMENT',
    modelId: 'qwen-max-2025-01-25',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'sourceType', operator: 'equals', value: 'DOCUMENT' },
        { field: 'status', operator: 'equals', value: 'NEW' },
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla dokumentów:
- documentType: typ dokumentu (contract | offer | report | specification | letter | regulation | other)
- parties: strony dokumentu [{name, role}]
- keyTerms: kluczowe warunki/postanowienia [string]
- dates: ważne daty [{label, date}]
- amounts: kwoty [{label, amount, currency}]
- actionItems: wymagane działania [string]
- expirationDate: data ważności (string | null)
- confidentiality: public | internal | confidential | secret`,
    aiPrompt: `Przeanalizuj ten dokument:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}

Treść dokumentu:
{{content}}

{{metadata}}`,
  },
  {
    name: 'Flow: Analiza artykułów',
    description: 'Analiza artykułów — temat, kluczowe wnioski, relevancja, tagi',
    dataType: 'ARTICLE',
    modelId: 'qwen-plus',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'status', operator: 'equals', value: 'NEW' },
        { operator: 'OR', conditions: [
          { field: 'sourceType', operator: 'equals', value: 'ARTICLE' },
          { field: 'classification', operator: 'equals', value: 'NEWSLETTER' },
        ]},
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla artykułów:
- topic: główny temat (string)
- keyInsights: kluczowe wnioski [string]
- businessRelevance: ocena relevancji biznesowej (high | medium | low) z uzasadnieniem
- suggestedTags: proponowane tagi [string]
- source: źródło artykułu (string | null)
- author: autor (string | null)
- publishDate: data publikacji (string | null)`,
    aiPrompt: `Przeanalizuj ten artykuł:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}

Treść artykułu:
{{content}}

{{metadata}}`,
  },
  {
    name: 'Flow: Analiza notatek głosowych',
    description: 'Analiza notatek głosowych — kluczowe punkty, action items, kontekst',
    dataType: 'VOICE_MEMO',
    modelId: 'qwen-max-2025-01-25',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'sourceType', operator: 'equals', value: 'VOICE_MEMO' },
        { field: 'status', operator: 'equals', value: 'NEW' },
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla notatek głosowych:
- keyPoints: kluczowe punkty [string]
- actionItems: zadania do wykonania [{task, priority?, deadline?}]
- context: kontekst nagrania (meeting | brainstorm | reminder | note_to_self | dictation)
- mentionedPeople: wspomniane osoby [string]
- mentionedProjects: wspomniane projekty [string]`,
    aiPrompt: `Przeanalizuj transkrypcję notatki głosowej:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}

Transkrypcja:
{{content}}

{{metadata}}`,
  },
  {
    name: 'Flow: Analiza szybkich notatek',
    description: 'Analiza szybkich notatek — intent, kategoria, action items, priorytet',
    dataType: 'QUICK_CAPTURE',
    modelId: 'qwen-turbo',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'sourceType', operator: 'equals', value: 'QUICK_CAPTURE' },
        { field: 'status', operator: 'equals', value: 'NEW' },
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla szybkich notatek:
- intent: zamiar (task | reminder | idea | note | question | contact_info)
- suggestedCategory: sugerowana kategoria (string)
- actionItems: ewentualne zadania [{task, priority?}]
- suggestedDeadline: sugerowany termin (string | null)`,
    aiPrompt: `Przeanalizuj tę szybką notatkę:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}

Treść:
{{content}}

{{metadata}}`,
  },
  {
    name: 'Flow: Analiza zdjęć',
    description: 'Analiza zdjęć — opis treści, typ dokumentu, wyciąg tekstu',
    dataType: 'PHOTO',
    modelId: 'qwen-max-2025-01-25',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'sourceType', operator: 'equals', value: 'PHOTO' },
        { field: 'status', operator: 'equals', value: 'NEW' },
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

Dodatkowe pola w extractedData dla zdjęć:
- imageDescription: opis zawartości zdjęcia (string)
- documentType: jeśli to skan dokumentu — typ (business_card | receipt | whiteboard | document | photo | screenshot | other)
- extractedText: tekst wyciągnięty ze zdjęcia (string | null)
- contactInfo: informacje kontaktowe jeśli widoczne (object | null)
- ocrConfidence: pewność rozpoznania tekstu (high | medium | low | none)`,
    aiPrompt: `Przeanalizuj opis/transkrypcję tego zdjęcia:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}

Opis/OCR:
{{content}}

{{metadata}}`,
  },
  {
    name: 'Flow: Analiza ogólna',
    description: 'Ogólna analiza elementów — detekcja typu, streszczenie, kluczowe podmioty',
    dataType: 'OTHER',
    modelId: 'qwen-plus',
    triggerConditions: {
      operator: 'AND',
      conditions: [
        { field: 'status', operator: 'equals', value: 'NEW' },
        { operator: 'OR', conditions: [
          { field: 'sourceType', operator: 'equals', value: 'OTHER' },
          { field: 'classification', operator: 'equals', value: 'UNKNOWN' },
        ]},
      ],
    },
    aiSystemPrompt: SYSTEM_PROMPT_BASE + `

To jest element ogólny — najpierw spróbuj rozpoznać jego właściwy typ, potem przeprowadź odpowiednią analizę.

Dodatkowe pola w extractedData:
- detectedType: rozpoznany typ elementu (string)
- suggestedSourceType: sugerowany typ źródła do reklasyfikacji (string | null)`,
    aiPrompt: `Przeanalizuj ten element:

Typ źródła: {{sourceType}}
Tytuł: {{subject}}

Treść:
{{content}}

{{metadata}}`,
  },
];

export async function seedFlowAnalysisRules(prisma: any, organizationId: string): Promise<SeedResult> {
  const result: SeedResult = {
    rulesCreated: 0,
    rulesSkipped: 0,
    modelsCreated: 0,
    providerCreated: false,
  };

  // 1. Ensure Qwen provider exists
  const existingProvider = await prisma.ai_providers.findFirst({
    where: { organizationId, name: QWEN_PROVIDER.name },
  });

  let providerId: string;

  if (!existingProvider) {
    const provider = await prisma.ai_providers.create({
      data: {
        id: uuidv4(),
        name: QWEN_PROVIDER.name,
        displayName: QWEN_PROVIDER.displayName,
        baseUrl: QWEN_PROVIDER.baseUrl,
        status: 'ACTIVE',
        priority: 1,
        config: { apiKey: process.env.QWEN_API_KEY || '' },
        limits: {},
        organizationId,
        updatedAt: new Date(),
      },
    });
    providerId = provider.id;
    result.providerCreated = true;
  } else {
    providerId = existingProvider.id;
  }

  // 2. Ensure Qwen models exist
  for (const model of QWEN_MODELS) {
    const existing = await prisma.ai_models.findFirst({
      where: { providerId, name: model.name },
    });

    if (!existing) {
      await prisma.ai_models.create({
        data: {
          id: uuidv4(),
          name: model.name,
          displayName: model.displayName,
          type: 'TEXT_GENERATION',
          status: 'ACTIVE',
          maxTokens: model.maxTokens,
          inputCost: model.inputCost,
          outputCost: model.outputCost,
          capabilities: ['chat', 'analysis', 'json_output'],
          config: {},
          providerId,
          updatedAt: new Date(),
        },
      });
      result.modelsCreated++;
    }
  }

  // 3. Seed flow analysis rules
  for (const rule of FLOW_RULES) {
    const existing = await prisma.ai_rules.findFirst({
      where: { organizationId, name: rule.name, isSystem: true },
    });

    if (existing) {
      result.rulesSkipped++;
      continue;
    }

    // Find modelId reference in ai_models
    const modelRecord = await prisma.ai_models.findFirst({
      where: { providerId, name: rule.modelId },
    });

    try {
      await prisma.ai_rules.create({
        data: {
          id: `flow-${rule.dataType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: rule.name,
          description: rule.description,
          category: 'FLOW_ANALYSIS',
          dataType: rule.dataType,
          status: 'ACTIVE',
          priority: 100,
          triggerType: 'WEBHOOK',
          triggerConditions: rule.triggerConditions,
          actions: { analyze: true, extractTasks: true, suggestCategory: true },
          aiPrompt: rule.aiPrompt,
          aiSystemPrompt: rule.aiSystemPrompt,
          modelId: modelRecord?.id || null,
          isSystem: true,
          organizationId,
          executionCount: 0,
          successCount: 0,
          errorCount: 0,
          updatedAt: new Date(),
        },
      });
      result.rulesCreated++;
    } catch (err: any) {
      if (err.code === 'P2002') {
        result.rulesSkipped++;
      } else {
        throw err;
      }
    }
  }

  return result;
}
