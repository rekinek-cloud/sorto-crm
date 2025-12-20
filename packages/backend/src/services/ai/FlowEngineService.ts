/**
 * Flow Engine Service - STREAMS AI Processing Engine
 * ==================================================
 * Zgodny ze specyfikacją master.md
 *
 * STREAMS Architecture (metafora wodna):
 * ŹRÓDŁO -> STRUMIEŃ -> PROJEKT -> ZADANIE -> ZAMROŻONY -> REFERENCJA
 *
 * Flow Engine przetwarza elementy z Source (bramki wejsciowej) i:
 * 1. Analizuje tresc przez AI
 * 2. Dopasowuje do streamow (SEMANTIC MATCHING z embeddingami)
 * 3. Okresla akcje (ZROB_TERAZ, ZAPLANUJ, PROJEKT, KIEDYS_MOZE, REFERENCJA, USUN)
 * 4. Wykonuje akcje lub czeka na decyzje uzytkownika
 *
 * 4 WARSTWY INTELIGENCJI (zgodnie z master.md):
 * 1. Analiza treści - AI analizuje zawartość
 * 2. Semantic matching - embeddingi dopasowują do streamów
 * 3. Reguły użytkownika - jawne reguły automatyzacji
 * 4. Nauczone wzorce - few-shot learning z korekt użytkownika
 *
 * KRYTYCZNE REGULY:
 * - Elementy w Source maja stream_id = NULL
 * - Po przetworzeniu MUSZA miec stream_id ustawiony i status = PROCESSED
 * - Niektore elementy (VOICE, IMAGE_WHITEBOARD) sa dzielone na czesci
 */

import { PrismaClient, FlowAction, FlowElementType, FlowProcessingStatus, ProcessingDecision } from '@prisma/client';
import { AIRouter } from './AIRouter';
import { AIRequest, AIResponse } from './providers/BaseProvider';
import { VectorService } from '../VectorService';

// =============================================================================
// INTERFACES
// =============================================================================

export interface FlowProcessingContext {
  organizationId: string;
  userId: string;
  inboxItemId: string;
  autoExecute?: boolean;  // Czy wykonac akcje automatycznie bez potwierdzenia
}

export interface ContentAnalysis {
  elementType: FlowElementType;
  summary: string;
  entities: ExtractedEntity[];
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'high' | 'medium' | 'low';
  actionability: 'actionable' | 'reference' | 'trash';
  estimatedTime?: string;  // np. "5min", "2h", "1d"
  splitRequired?: boolean;
  splitSuggestions?: string[];
}

export interface ExtractedEntity {
  type: 'person' | 'company' | 'date' | 'amount' | 'contact' | 'deadline' | 'project' | 'task';
  value: string;
  confidence: number;
}

export interface StreamMatch {
  streamId: string;
  streamName: string;
  confidence: number;
  reason: string;
  semanticScore?: number;
  keywordScore?: number;
  historyScore?: number;
}

export interface ActionSuggestion {
  action: FlowAction;
  confidence: number;
  reasoning: string;
  targetStreamId?: string;
  targetProjectId?: string;
  suggestedTitle?: string;
  suggestedDueDate?: Date;
  metadata?: Record<string, any>;
}

export interface FlowProcessingResult {
  success: boolean;
  inboxItemId: string;
  analysis: ContentAnalysis;
  suggestedStreams: StreamMatch[];
  suggestedAction: ActionSuggestion;
  executedAction?: FlowAction;
  splitItems?: string[];  // IDs of split items
  processingTimeMs: number;
  error?: string;
}

// =============================================================================
// FLOW ENGINE SERVICE
// =============================================================================

export class FlowEngineService {
  private prisma: PrismaClient;
  private aiRouter: AIRouter | null = null;
  private vectorService: VectorService | null = null;
  private organizationId: string;
  private streamsIndexed: boolean = false;

  constructor(prisma: PrismaClient, organizationId: string) {
    this.prisma = prisma;
    this.organizationId = organizationId;
  }

  /**
   * Initialize AI Router and VectorService for this organization
   */
  async initialize(): Promise<void> {
    // Initialize AI Router
    this.aiRouter = new AIRouter({
      organizationId: this.organizationId,
      prisma: this.prisma
    });
    await this.aiRouter.initializeProviders();

    // Initialize VectorService for semantic matching
    this.vectorService = new VectorService(this.prisma);

    // Ensure streams are indexed for semantic search
    await this.ensureStreamsIndexed();
  }

  /**
   * Ensure all streams are indexed in vector database for semantic matching
   */
  private async ensureStreamsIndexed(): Promise<void> {
    if (this.streamsIndexed || !this.vectorService) return;

    try {
      // Check if streams are already indexed
      const indexedCount = await this.prisma.vector_documents.count({
        where: {
          organizationId: this.organizationId,
          entityType: 'STREAM'
        }
      });

      const streamsCount = await this.prisma.stream.count({
        where: {
          organizationId: this.organizationId,
          status: 'ACTIVE'
        }
      });

      // If not all streams are indexed, reindex
      if (indexedCount < streamsCount) {
        console.log(`📊 Indexing streams for semantic matching (${indexedCount}/${streamsCount} indexed)`);
        await this.vectorService.indexStreams(this.organizationId);
        console.log(`✅ Streams indexed for organization ${this.organizationId}`);
      }

      this.streamsIndexed = true;
    } catch (error) {
      console.warn('⚠️ Failed to index streams for semantic matching:', error);
      // Don't fail initialization, fall back to keyword matching
    }
  }

  // ===========================================================================
  // MAIN PROCESSING FUNCTION - zgodna z master.md processSourceItem()
  // ===========================================================================

  /**
   * Process a source item through the Flow Engine
   * This is the main entry point for GTD processing
   */
  async processSourceItem(context: FlowProcessingContext): Promise<FlowProcessingResult> {
    const startTime = Date.now();

    try {
      // 1. Pobierz element z bazy
      const inboxItem = await this.prisma.inboxItem.findUnique({
        where: { id: context.inboxItemId },
        include: {
          stream: true,
          project: true,
          contact: true,
          company: true
        }
      });

      if (!inboxItem) {
        throw new Error(`InboxItem not found: ${context.inboxItemId}`);
      }

      // Walidacja: element powinien byc nieprzetworzoony
      if (inboxItem.processed) {
        throw new Error(`InboxItem already processed: ${context.inboxItemId}`);
      }

      // 2. Zaktualizuj status na ANALYZING
      await this.prisma.inboxItem.update({
        where: { id: context.inboxItemId },
        data: { flowStatus: 'ANALYZING' }
      });

      // 3. WARSTWA 1: Analiza tresci przez AI
      const contentAnalysis = await this.analyzeContent(inboxItem);

      // 4. Sprawdz czy wymaga podzialu (VOICE, IMAGE_WHITEBOARD)
      if (contentAnalysis.splitRequired && contentAnalysis.splitSuggestions) {
        const splitResult = await this.splitItem(inboxItem, contentAnalysis.splitSuggestions, context);

        // Oznacz oryginal jako SPLIT
        await this.prisma.inboxItem.update({
          where: { id: context.inboxItemId },
          data: {
            flowStatus: 'SPLIT',
            aiAnalysis: contentAnalysis as any
          }
        });

        return {
          success: true,
          inboxItemId: context.inboxItemId,
          analysis: contentAnalysis,
          suggestedStreams: [],
          suggestedAction: {
            action: 'PROJEKT', // Split items become project-like
            confidence: 1.0,
            reasoning: 'Element podzielony na czesci'
          },
          splitItems: splitResult.splitItemIds,
          processingTimeMs: Date.now() - startTime
        };
      }

      // 5. WARSTWA 2: Dopasowanie do streamow (Semantic Matching)
      const streamMatches = await this.matchToStreams(inboxItem, contentAnalysis);

      // 6. WARSTWA 3: Sprawdz reguly uzytkownika
      const ruleMatch = await this.checkUserRules(inboxItem, contentAnalysis);

      // 7. WARSTWA 4: Sprawdz nauczone wzorce
      const learnedPattern = await this.checkLearnedPatterns(inboxItem, contentAnalysis);

      // 8. Okresl sugerowana akcje
      const suggestedAction = await this.determineAction(
        inboxItem,
        contentAnalysis,
        streamMatches,
        ruleMatch,
        learnedPattern
      );

      // 9. Zapisz wyniki analizy
      await this.prisma.inboxItem.update({
        where: { id: context.inboxItemId },
        data: {
          elementType: contentAnalysis.elementType,
          flowStatus: 'AWAITING_DECISION',
          aiAnalysis: contentAnalysis as any,
          suggestedAction: suggestedAction.action,
          suggestedStreams: streamMatches as any,
          aiConfidence: suggestedAction.confidence,
          aiReasoning: suggestedAction.reasoning,
          processingTimeMs: Date.now() - startTime
        }
      });

      // 10. Zapisz historie przetwarzania
      await this.saveProcessingHistory(context, contentAnalysis, suggestedAction);

      // 11. Jesli autoExecute i wysoka pewnosc - wykonaj akcje
      let executedAction: FlowAction | undefined;
      if (context.autoExecute && suggestedAction.confidence >= 0.85) {
        executedAction = await this.executeAction(
          context.inboxItemId,
          suggestedAction,
          context.userId
        );
      }

      return {
        success: true,
        inboxItemId: context.inboxItemId,
        analysis: contentAnalysis,
        suggestedStreams: streamMatches,
        suggestedAction,
        executedAction,
        processingTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('Flow Engine processing error:', error);

      // Oznacz element jako ERROR
      await this.prisma.inboxItem.update({
        where: { id: context.inboxItemId },
        data: { flowStatus: 'ERROR' }
      });

      return {
        success: false,
        inboxItemId: context.inboxItemId,
        analysis: {} as ContentAnalysis,
        suggestedStreams: [],
        suggestedAction: {} as ActionSuggestion,
        processingTimeMs: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // ===========================================================================
  // WARSTWA 1: ANALIZA TRESCI (Content Analysis)
  // ===========================================================================

  private async analyzeContent(inboxItem: any): Promise<ContentAnalysis> {
    const content = inboxItem.rawContent || inboxItem.content;

    // Okresl typ elementu na podstawie sourceType lub analizy
    const elementType = this.detectElementType(inboxItem);

    // Jesli mamy AI Router - uzyj AI do analizy
    if (this.aiRouter) {
      try {
        const aiAnalysis = await this.performAIAnalysis(content, elementType);
        return aiAnalysis;
      } catch (error) {
        console.warn('AI analysis failed, using fallback:', error);
      }
    }

    // Fallback: prosta analiza bez AI
    return this.performSimpleAnalysis(content, elementType, inboxItem);
  }

  private detectElementType(inboxItem: any): FlowElementType {
    const sourceTypeMap: Record<string, FlowElementType> = {
      'EMAIL': 'EMAIL',
      'VOICE_MEMO': 'VOICE',
      'DOCUMENT': 'DOCUMENT_CONTRACT',
      'BILL_INVOICE': 'DOCUMENT_INVOICE',
      'PHOTO': 'IMAGE_RECEIPT',
      'IDEA': 'IDEA',
      'MEETING_NOTES': 'EVENT',
      'PHONE_CALL': 'VOICE'
    };

    return sourceTypeMap[inboxItem.sourceType] || 'OTHER';
  }

  private async performAIAnalysis(content: string, elementType: FlowElementType): Promise<ContentAnalysis> {
    const prompt = this.buildAnalysisPrompt(content, elementType);

    // Pobierz prompt V3 z bazy danych
    let systemPromptContent: string;

    try {
      const promptTemplate = await this.prisma.ai_prompt_templates.findFirst({
        where: {
          code: 'SOURCE_ANALYZE',
          organizationId: this.organizationId
        }
      });

      if (promptTemplate?.systemPrompt) {
        systemPromptContent = promptTemplate.systemPrompt;
        console.log('✅ FlowEngine: Używam promptu V3 z bazy danych');
      } else {
        throw new Error('Prompt SOURCE_ANALYZE nie znaleziony');
      }
    } catch (error) {
      console.warn('⚠️ FlowEngine: Fallback do domyślnego promptu:', error);
      // Fallback - podstawowy prompt
      systemPromptContent = `Jesteś AI Asystentem w systemie Streams — pomagasz ludziom realizować ich cele.

Twoje zadanie:
1. Określić typ elementu
2. Wyodrębnić kluczowe informacje
3. Ocenić pilność i wykonalność
4. Zaproponować akcję

Odpowiedz w formacie JSON.`;
    }

    const request: AIRequest = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPromptContent
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      config: {
        temperature: 0.3,
        maxTokens: 1000
      }
    };

    const response = await this.aiRouter!.processRequest(request);

    try {
      const parsed = JSON.parse(response.content);
      return {
        elementType: parsed.elementType || elementType,
        summary: parsed.summary || content.substring(0, 200),
        entities: parsed.entities || [],
        keywords: parsed.keywords || [],
        sentiment: parsed.sentiment || 'neutral',
        urgency: parsed.urgency || 'medium',
        actionability: parsed.actionability || 'actionable',
        estimatedTime: parsed.estimatedTime,
        splitRequired: parsed.splitRequired || false,
        splitSuggestions: parsed.splitSuggestions
      };
    } catch (e) {
      console.error('Failed to parse AI analysis response:', e);
      return this.performSimpleAnalysis(content, elementType, null);
    }
  }

  private buildAnalysisPrompt(content: string, elementType: FlowElementType): string {
    return `Przeanalizuj nastepujacy element (typ: ${elementType}):

---
${content}
---

Odpowiedz w formacie JSON:
{
  "elementType": "EMAIL|VOICE|DOCUMENT_INVOICE|DOCUMENT_CONTRACT|IMAGE_BUSINESS_CARD|IMAGE_RECEIPT|IMAGE_WHITEBOARD|LINK|IDEA|EVENT|SMS|OTHER",
  "summary": "krotkie podsumowanie max 200 znakow",
  "entities": [
    {"type": "person|company|date|amount|contact|deadline|project|task", "value": "...", "confidence": 0.0-1.0}
  ],
  "keywords": ["slowo1", "slowo2"],
  "sentiment": "positive|neutral|negative",
  "urgency": "high|medium|low",
  "actionability": "actionable|reference|trash",
  "estimatedTime": "5min|30min|2h|1d|...",
  "splitRequired": false,
  "splitSuggestions": ["opis czesci 1", "opis czesci 2"] // jesli splitRequired=true
}`;
  }

  private performSimpleAnalysis(content: string, elementType: FlowElementType, inboxItem: any): ContentAnalysis {
    // Prosta analiza bez AI
    const urgencyKeywords = ['pilne', 'urgent', 'asap', 'natychmiast', 'deadline', 'termin'];
    const hasUrgency = urgencyKeywords.some(k => content.toLowerCase().includes(k));

    const actionKeywords = ['zrob', 'wykonaj', 'sprawdz', 'wyslij', 'zadzwon', 'napisz', 'kup'];
    const isActionable = actionKeywords.some(k => content.toLowerCase().includes(k));

    return {
      elementType,
      summary: content.substring(0, 200),
      entities: this.extractSimpleEntities(content),
      keywords: this.extractKeywords(content),
      sentiment: 'neutral',
      urgency: hasUrgency ? 'high' : 'medium',
      actionability: isActionable ? 'actionable' : 'reference',
      splitRequired: false
    };
  }

  private extractSimpleEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Email regex
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = content.match(emailRegex) || [];
    emails.forEach(email => {
      entities.push({ type: 'contact', value: email, confidence: 0.9 });
    });

    // Phone regex (PL)
    const phoneRegex = /(?:\+48\s?)?(?:\d{3}[\s-]?){3}/g;
    const phones = content.match(phoneRegex) || [];
    phones.forEach(phone => {
      entities.push({ type: 'contact', value: phone.trim(), confidence: 0.8 });
    });

    // Amount regex
    const amountRegex = /\d+(?:[.,]\d{2})?\s*(?:zl|PLN|EUR|USD|\$|euro)/gi;
    const amounts = content.match(amountRegex) || [];
    amounts.forEach(amount => {
      entities.push({ type: 'amount', value: amount, confidence: 0.85 });
    });

    // Date regex (basic)
    const dateRegex = /\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{2,4}/g;
    const dates = content.match(dateRegex) || [];
    dates.forEach(date => {
      entities.push({ type: 'date', value: date, confidence: 0.7 });
    });

    return entities;
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    // Count word frequency
    const freq: Record<string, number> = {};
    words.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    // Return top keywords
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  // ===========================================================================
  // WARSTWA 2: DOPASOWANIE DO STREAMOW (Semantic Matching)
  // Zgodnie z master.md - 4 warstwy inteligencji, warstwa 2 = semantic embeddings
  // ===========================================================================

  private async matchToStreams(inboxItem: any, analysis: ContentAnalysis): Promise<StreamMatch[]> {
    const matches: StreamMatch[] = [];
    const content = inboxItem.rawContent || inboxItem.content || '';

    // =======================================================================
    // SEMANTIC MATCHING - główna metoda dopasowania (embeddingi)
    // =======================================================================
    if (this.vectorService) {
      try {
        // Buduj zapytanie semantyczne z treści i analizy
        const semanticQuery = this.buildSemanticQuery(content, analysis);

        // Wyszukaj semantycznie podobne streamy
        const vectorResults = await this.vectorService.searchSimilar(
          this.organizationId,
          semanticQuery,
          {
            limit: 10,
            threshold: 0.5, // Niższy próg dla większej liczby kandydatów
            filters: { entityType: 'STREAM' },
            useCache: true
          }
        );

        console.log(`🔍 Semantic search found ${vectorResults.results.length} matching streams`);

        // Pobierz pełne dane streamów
        const streamIds = vectorResults.results.map(r => r.entityId);
        const streams = await this.prisma.stream.findMany({
          where: { id: { in: streamIds } },
          include: { projects: { take: 3 } }
        });

        const streamsMap = new Map(streams.map(s => [s.id, s]));

        // Konwertuj wyniki na StreamMatch
        for (const result of vectorResults.results) {
          const stream = streamsMap.get(result.entityId);
          if (stream) {
            // Oblicz dodatkowe score (historia, keywords)
            const additionalScore = await this.calculateAdditionalMatchScore(stream, analysis, inboxItem);

            // Łączny score = 60% semantic + 20% history + 20% keyword
            const totalScore = (result.similarity * 0.6) +
                              (additionalScore.history * 0.2) +
                              (additionalScore.keyword * 0.2);

            matches.push({
              streamId: stream.id,
              streamName: stream.name,
              confidence: Math.min(totalScore, 1.0),
              reason: `Dopasowanie semantyczne (${(result.similarity * 100).toFixed(0)}%) ${additionalScore.reason}`,
              semanticScore: result.similarity,
              keywordScore: additionalScore.keyword,
              historyScore: additionalScore.history
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Semantic matching failed, falling back to keyword matching:', error);
      }
    }

    // =======================================================================
    // FALLBACK: Keyword matching jeśli semantic nie zwrócił wyników
    // =======================================================================
    if (matches.length === 0) {
      console.log('📝 Using keyword fallback for stream matching');
      const keywordMatches = await this.matchStreamsWithKeywords(analysis, inboxItem);
      matches.push(...keywordMatches);
    }

    // Sort by confidence and return top 5
    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * Build semantic query from content and analysis for embedding search
   */
  private buildSemanticQuery(content: string, analysis: ContentAnalysis): string {
    const parts: string[] = [];

    // Summary jest najważniejsze
    if (analysis.summary) {
      parts.push(analysis.summary);
    }

    // Dodaj keywords
    if (analysis.keywords.length > 0) {
      parts.push(analysis.keywords.slice(0, 5).join(' '));
    }

    // Dodaj entities (osoby, firmy)
    const relevantEntities = analysis.entities
      .filter(e => ['company', 'person', 'project'].includes(e.type))
      .map(e => e.value);
    if (relevantEntities.length > 0) {
      parts.push(relevantEntities.join(' '));
    }

    // Dodaj fragment treści jeśli query jest zbyt krótkie
    if (parts.join(' ').length < 50 && content) {
      parts.push(content.substring(0, 200));
    }

    return parts.join('. ').substring(0, 500); // Max 500 znaków dla embeddingu
  }

  /**
   * Calculate additional matching scores (history, keywords)
   */
  private async calculateAdditionalMatchScore(
    stream: any,
    analysis: ContentAnalysis,
    inboxItem: any
  ): Promise<{ history: number; keyword: number; reason: string }> {
    const reasons: string[] = [];
    let history = 0;
    let keyword = 0;

    // 1. Keyword matching
    const streamKeywords = [
      stream.name.toLowerCase(),
      ...(stream.description?.toLowerCase().split(/\s+/) || [])
    ];

    const contentKeywords = analysis.keywords;
    const keywordMatches = contentKeywords.filter(k =>
      streamKeywords.some(sk => sk.includes(k) || k.includes(sk))
    );

    if (keywordMatches.length > 0) {
      keyword = Math.min(keywordMatches.length * 0.2, 0.8);
      reasons.push(`słowa: ${keywordMatches.slice(0, 3).join(', ')}`);
    }

    // 2. Historical matching - sprawdz czy podobne elementy trafialy do tego streamu
    const historicalCount = await this.prisma.inboxItem.count({
      where: {
        organizationId: this.organizationId,
        streamId: stream.id,
        processed: true,
        elementType: analysis.elementType
      }
    });

    if (historicalCount > 0) {
      history = Math.min(historicalCount * 0.1, 0.8);
      reasons.push(`historia: ${historicalCount}x`);
    }

    // 3. Stream config matching
    if (stream.gtdConfig) {
      const gtdConfig = typeof stream.gtdConfig === 'string'
        ? JSON.parse(stream.gtdConfig)
        : stream.gtdConfig;

      if (gtdConfig.allowedTypes?.includes(analysis.elementType)) {
        keyword += 0.15;
        reasons.push('zgodny typ');
      }
    }

    return {
      history,
      keyword: Math.min(keyword, 1.0),
      reason: reasons.length > 0 ? `(${reasons.join(', ')})` : ''
    };
  }

  /**
   * Fallback keyword-based stream matching
   */
  private async matchStreamsWithKeywords(
    analysis: ContentAnalysis,
    inboxItem: any
  ): Promise<StreamMatch[]> {
    const streams = await this.prisma.stream.findMany({
      where: {
        organizationId: this.organizationId,
        status: 'ACTIVE'
      }
    });

    const matches: StreamMatch[] = [];

    for (const stream of streams) {
      const score = await this.calculateAdditionalMatchScore(stream, analysis, inboxItem);
      const total = (score.keyword * 0.6) + (score.history * 0.4);

      if (total > 0.2) {
        matches.push({
          streamId: stream.id,
          streamName: stream.name,
          confidence: total,
          reason: `Dopasowanie słów kluczowych ${score.reason}`,
          semanticScore: 0,
          keywordScore: score.keyword,
          historyScore: score.history
        });
      }
    }

    return matches;
  }

  // ===========================================================================
  // WARSTWA 3: REGULY UZYTKOWNIKA
  // ===========================================================================

  private async checkUserRules(inboxItem: any, analysis: ContentAnalysis): Promise<any | null> {
    const rules = await this.prisma.flow_automation_rules.findMany({
      where: {
        organizationId: this.organizationId,
        isActive: true
      },
      orderBy: { priority: 'desc' }
    });

    for (const rule of rules) {
      const conditions = rule.conditions as any[];
      if (this.evaluateConditions(conditions, inboxItem, analysis)) {
        return rule;
      }
    }

    return null;
  }

  private evaluateConditions(conditions: any[], inboxItem: any, analysis: ContentAnalysis): boolean {
    if (!conditions || conditions.length === 0) return false;

    return conditions.every(condition => {
      const { field, operator, value } = condition;
      let actualValue: any;

      // Pobierz wartosc pola
      switch (field) {
        case 'elementType':
          actualValue = analysis.elementType;
          break;
        case 'urgency':
          actualValue = analysis.urgency;
          break;
        case 'content':
          actualValue = inboxItem.content;
          break;
        case 'source':
          actualValue = inboxItem.source;
          break;
        case 'sourceType':
          actualValue = inboxItem.sourceType;
          break;
        default:
          actualValue = inboxItem[field];
      }

      // Ewaluuj operator
      switch (operator) {
        case 'equals':
          return actualValue === value;
        case 'contains':
          return String(actualValue).toLowerCase().includes(String(value).toLowerCase());
        case 'startsWith':
          return String(actualValue).toLowerCase().startsWith(String(value).toLowerCase());
        case 'regex':
          return new RegExp(value, 'i').test(String(actualValue));
        default:
          return false;
      }
    });
  }

  // ===========================================================================
  // WARSTWA 4: NAUCZONE WZORCE
  // ===========================================================================

  private async checkLearnedPatterns(inboxItem: any, analysis: ContentAnalysis): Promise<any | null> {
    const patterns = await this.prisma.flow_learned_patterns.findMany({
      where: {
        organizationId: this.organizationId,
        isActive: true,
        elementType: analysis.elementType
      },
      orderBy: { confidence: 'desc' }
    });

    for (const pattern of patterns) {
      if (this.matchesPattern(pattern, inboxItem, analysis)) {
        // Update pattern usage
        await this.prisma.flow_learned_patterns.update({
          where: { id: pattern.id },
          data: {
            occurrences: { increment: 1 },
            lastUsedAt: new Date(),
            confidence: Math.min(pattern.confidence + 0.01, 1.0)
          }
        });
        return pattern;
      }
    }

    return null;
  }

  private matchesPattern(pattern: any, inboxItem: any, analysis: ContentAnalysis): boolean {
    // Check content pattern
    if (pattern.contentPattern) {
      const regex = new RegExp(pattern.contentPattern, 'i');
      if (!regex.test(inboxItem.content)) return false;
    }

    // Check sender pattern
    if (pattern.senderPattern) {
      const regex = new RegExp(pattern.senderPattern, 'i');
      if (!regex.test(inboxItem.source || '')) return false;
    }

    return true;
  }

  // ===========================================================================
  // OKRESLENIE AKCJI
  // ===========================================================================

  private async determineAction(
    inboxItem: any,
    analysis: ContentAnalysis,
    streamMatches: StreamMatch[],
    ruleMatch: any | null,
    learnedPattern: any | null
  ): Promise<ActionSuggestion> {
    // 1. Jesli jest regula uzytkownika - uzyj jej
    if (ruleMatch) {
      return {
        action: ruleMatch.action as FlowAction,
        confidence: 0.95,
        reasoning: `Dopasowano regule: ${ruleMatch.name}`,
        targetStreamId: ruleMatch.targetStreamId,
        targetProjectId: ruleMatch.targetProjectId
      };
    }

    // 2. Jesli jest nauczony wzorzec z wysoka pewnoscia
    if (learnedPattern && learnedPattern.confidence >= 0.8) {
      return {
        action: learnedPattern.learnedAction as FlowAction,
        confidence: learnedPattern.confidence,
        reasoning: `Nauczony wzorzec (${learnedPattern.occurrences} wystapien)`,
        targetStreamId: learnedPattern.learnedStreamId
      };
    }

    // 3. Okresl na podstawie analizy
    const topStream = streamMatches[0];

    // Logika STREAMS (metafora wodna: element płynie do właściwego strumienia)
    if (analysis.actionability === 'trash') {
      return {
        action: 'USUN',
        confidence: 0.85,
        reasoning: 'Element nieistotny lub spam'
      };
    }

    if (analysis.actionability === 'reference') {
      return {
        action: 'REFERENCJA',
        confidence: 0.8,
        reasoning: 'Material referencyjny do przechowania',
        targetStreamId: topStream?.streamId
      };
    }

    // Actionable items
    if (analysis.urgency === 'high' && analysis.estimatedTime) {
      const minutes = this.parseTimeToMinutes(analysis.estimatedTime);

      // < 2 minuty = ZROB TERAZ
      if (minutes <= 2) {
        return {
          action: 'ZROB_TERAZ',
          confidence: 0.9,
          reasoning: `Szybkie zadanie (${analysis.estimatedTime}), pilne - zrob od razu`,
          targetStreamId: topStream?.streamId,
          suggestedTitle: analysis.summary
        };
      }
    }

    // Jesli ma deadline - ZAPLANUJ
    const deadlineEntity = analysis.entities.find(e => e.type === 'deadline' || e.type === 'date');
    if (deadlineEntity) {
      return {
        action: 'ZAPLANUJ',
        confidence: 0.8,
        reasoning: `Znaleziono termin: ${deadlineEntity.value}`,
        targetStreamId: topStream?.streamId,
        suggestedTitle: analysis.summary,
        suggestedDueDate: this.parseDate(deadlineEntity.value)
      };
    }

    // Jesli to czesc wiekszego zadania - PROJEKT
    if (analysis.entities.some(e => e.type === 'project')) {
      return {
        action: 'PROJEKT',
        confidence: 0.75,
        reasoning: 'Wymaga wiecej niz jednej akcji',
        targetStreamId: topStream?.streamId,
        suggestedTitle: analysis.summary
      };
    }

    // Domyslnie - KIEDYS/MOZE lub ZAPLANUJ
    if (analysis.urgency === 'low') {
      return {
        action: 'KIEDYS_MOZE',
        confidence: 0.6,
        reasoning: 'Niska pilnosc, do rozwa zenia pozniej',
        targetStreamId: topStream?.streamId
      };
    }

    return {
      action: 'ZAPLANUJ',
      confidence: 0.7,
      reasoning: 'Zadanie do zaplanowania',
      targetStreamId: topStream?.streamId,
      suggestedTitle: analysis.summary
    };
  }

  private parseTimeToMinutes(timeStr: string): number {
    const match = timeStr.match(/(\d+)\s*(min|h|d|godzin|minut|dni)/i);
    if (!match) return 30; // default

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'min':
      case 'minut':
        return value;
      case 'h':
      case 'godzin':
        return value * 60;
      case 'd':
      case 'dni':
        return value * 60 * 24;
      default:
        return value;
    }
  }

  private parseDate(dateStr: string): Date | undefined {
    try {
      // Basic date parsing (dd.mm.yyyy or dd/mm/yyyy)
      const match = dateStr.match(/(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2,4})/);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;
        return new Date(year, month, day);
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  // ===========================================================================
  // WYKONANIE AKCJI (Action Executor)
  // ===========================================================================

  async executeAction(
    inboxItemId: string,
    suggestion: ActionSuggestion,
    userId: string
  ): Promise<FlowAction> {
    const inboxItem = await this.prisma.inboxItem.findUnique({
      where: { id: inboxItemId }
    });

    if (!inboxItem) {
      throw new Error(`InboxItem not found: ${inboxItemId}`);
    }

    switch (suggestion.action) {
      case 'ZROB_TERAZ':
        await this.executeZrobTeraz(inboxItem, suggestion, userId);
        break;

      case 'ZAPLANUJ':
        await this.executeZaplanuj(inboxItem, suggestion, userId);
        break;

      case 'PROJEKT':
        await this.executeProjekt(inboxItem, suggestion, userId);
        break;

      case 'KIEDYS_MOZE':
        await this.executeKiedysMoze(inboxItem, suggestion, userId);
        break;

      case 'REFERENCJA':
        await this.executeReferencja(inboxItem, suggestion, userId);
        break;

      case 'USUN':
        await this.executeUsun(inboxItem);
        break;
    }

    // Oznacz jako przetworzony
    await this.prisma.inboxItem.update({
      where: { id: inboxItemId },
      data: {
        processed: true,
        processedAt: new Date(),
        flowStatus: 'PROCESSED',
        processingDecision: this.mapFlowActionToProcessingDecision(suggestion.action),
        streamId: suggestion.targetStreamId,
        userDecision: suggestion.action
      }
    });

    // Ucz sie z decyzji
    await this.learnFromDecision(inboxItem, suggestion, userId);

    return suggestion.action;
  }

  private async executeZrobTeraz(inboxItem: any, suggestion: ActionSuggestion, userId: string): Promise<void> {
    // Utworz zadanie z najwyzszym priorytetem
    await this.prisma.task.create({
      data: {
        title: suggestion.suggestedTitle || inboxItem.content.substring(0, 200),
        description: inboxItem.content,
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        organizationId: this.organizationId,
        createdById: userId,
        assignedToId: userId,
        streamId: suggestion.targetStreamId
      }
    });
  }

  private async executeZaplanuj(inboxItem: any, suggestion: ActionSuggestion, userId: string): Promise<void> {
    await this.prisma.task.create({
      data: {
        title: suggestion.suggestedTitle || inboxItem.content.substring(0, 200),
        description: inboxItem.content,
        status: 'NEW',
        priority: 'HIGH',
        dueDate: suggestion.suggestedDueDate,
        organizationId: this.organizationId,
        createdById: userId,
        assignedToId: userId,
        streamId: suggestion.targetStreamId
      }
    });
  }

  private async executeProjekt(inboxItem: any, suggestion: ActionSuggestion, userId: string): Promise<void> {
    if (suggestion.targetProjectId) {
      // Dodaj do istniejacego projektu jako zadanie
      await this.prisma.task.create({
        data: {
          title: suggestion.suggestedTitle || inboxItem.content.substring(0, 200),
          description: inboxItem.content,
          status: 'NEW',
          priority: 'MEDIUM',
          organizationId: this.organizationId,
          createdById: userId,
          projectId: suggestion.targetProjectId,
          streamId: suggestion.targetStreamId
        }
      });
    } else {
      // Utworz nowy projekt
      await this.prisma.project.create({
        data: {
          name: suggestion.suggestedTitle || inboxItem.content.substring(0, 100),
          description: inboxItem.content,
          status: 'PLANNING',
          priority: 'MEDIUM',
          organizationId: this.organizationId,
          createdById: userId,
          streamId: suggestion.targetStreamId
        }
      });
    }
  }

  private async executeKiedysMoze(inboxItem: any, suggestion: ActionSuggestion, userId: string): Promise<void> {
    await this.prisma.somedayMaybe.create({
      data: {
        title: suggestion.suggestedTitle || inboxItem.content.substring(0, 200),
        description: inboxItem.content,
        category: 'IDEAS',
        status: 'ACTIVE',
        organizationId: this.organizationId,
        createdById: userId
      }
    });
  }

  private async executeReferencja(inboxItem: any, suggestion: ActionSuggestion, userId: string): Promise<void> {
    // Zapisz jako dokument referencyjny w knowledge base
    await this.prisma.knowledgeBase.create({
      data: {
        title: suggestion.suggestedTitle || inboxItem.content.substring(0, 200),
        content: inboxItem.content,
        category: 'REFERENCE',
        organizationId: this.organizationId
      }
    });
  }

  private async executeUsun(inboxItem: any): Promise<void> {
    // Soft delete - oznacz jako usuniety
    await this.prisma.inboxItem.update({
      where: { id: inboxItem.id },
      data: {
        processed: true,
        processedAt: new Date(),
        processingDecision: 'DELETE'
      }
    });
  }

  private mapFlowActionToProcessingDecision(action: FlowAction): ProcessingDecision {
    const map: Record<FlowAction, ProcessingDecision> = {
      'ZROB_TERAZ': 'DO',
      'ZAPLANUJ': 'DEFER',
      'PROJEKT': 'PROJECT',
      'KIEDYS_MOZE': 'SOMEDAY',
      'REFERENCJA': 'REFERENCE',
      'USUN': 'DELETE'
    };
    return map[action] || 'DO';
  }

  // ===========================================================================
  // DZIELENIE ELEMENTOW (Split Items)
  // ===========================================================================

  private async splitItem(
    inboxItem: any,
    splitSuggestions: string[],
    context: FlowProcessingContext
  ): Promise<{ splitItemIds: string[] }> {
    const splitItemIds: string[] = [];

    for (const suggestion of splitSuggestions) {
      const newItem = await this.prisma.inboxItem.create({
        data: {
          content: suggestion,
          sourceType: inboxItem.sourceType,
          source: inboxItem.source,
          organizationId: this.organizationId,
          capturedById: context.userId,
          splitFromId: inboxItem.id,
          flowStatus: 'PENDING'
        }
      });
      splitItemIds.push(newItem.id);
    }

    return { splitItemIds };
  }

  // ===========================================================================
  // UCZENIE SIE Z DECYZJI
  // ===========================================================================

  private async learnFromDecision(
    inboxItem: any,
    suggestion: ActionSuggestion,
    userId: string
  ): Promise<void> {
    // Sprawdz czy istnieje podobny wzorzec
    const existingPattern = await this.prisma.flow_learned_patterns.findFirst({
      where: {
        organizationId: this.organizationId,
        userId,
        elementType: inboxItem.elementType,
        learnedAction: suggestion.action
      }
    });

    if (existingPattern) {
      // Aktualizuj istniejacy wzorzec
      await this.prisma.flow_learned_patterns.update({
        where: { id: existingPattern.id },
        data: {
          occurrences: { increment: 1 },
          confidence: Math.min(existingPattern.confidence + 0.02, 1.0),
          lastUsedAt: new Date()
        }
      });
    } else {
      // Utworz nowy wzorzec jesli mamy wystarczajaco duzowystapien podobnych elementow
      const similarCount = await this.prisma.inboxItem.count({
        where: {
          organizationId: this.organizationId,
          capturedById: userId,
          elementType: inboxItem.elementType,
          userDecision: suggestion.action,
          processed: true
        }
      });

      if (similarCount >= 3) {
        await this.prisma.flow_learned_patterns.create({
          data: {
            organizationId: this.organizationId,
            userId,
            elementType: inboxItem.elementType,
            learnedAction: suggestion.action,
            learnedStreamId: suggestion.targetStreamId,
            confidence: 0.5,
            occurrences: similarCount
          }
        });
      }
    }
  }

  // ===========================================================================
  // ZAPISYWANIE HISTORII
  // ===========================================================================

  private async saveProcessingHistory(
    context: FlowProcessingContext,
    analysis: ContentAnalysis,
    suggestion: ActionSuggestion
  ): Promise<void> {
    // Skip if no userId provided
    if (!context.userId) {
      console.log('[FlowEngine] Skipping history save - no userId');
      return;
    }

    try {
      await this.prisma.flow_processing_history.create({
        data: {
          organization: {
            connect: { id: this.organizationId }
          },
          user: {
            connect: { id: context.userId }
          },
          inboxItemId: context.inboxItemId,
          aiAnalysis: analysis as any,
          aiSuggestedAction: suggestion.action,
          aiConfidence: suggestion.confidence
        }
      });
    } catch (error) {
      console.error('[FlowEngine] Failed to save processing history:', error);
      // Don't throw - history saving is not critical
    }
  }

  // ===========================================================================
  // BULK PROCESSING
  // ===========================================================================

  /**
   * Process multiple items in batch
   */
  async processBatch(
    itemIds: string[],
    userId: string,
    autoExecute: boolean = false
  ): Promise<FlowProcessingResult[]> {
    const results: FlowProcessingResult[] = [];

    for (const itemId of itemIds) {
      const result = await this.processSourceItem({
        organizationId: this.organizationId,
        userId,
        inboxItemId: itemId,
        autoExecute
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Get pending items for processing
   */
  async getPendingItems(limit: number = 50): Promise<any[]> {
    return this.prisma.inboxItem.findMany({
      where: {
        organizationId: this.organizationId,
        processed: false,
        flowStatus: 'PENDING'
      },
      orderBy: { capturedAt: 'asc' },
      take: limit
    });
  }

  /**
   * User confirms or overrides suggested action
   * Zgodnie z master.md - WARSTWA 4: Nauczone wzorce (few-shot learning)
   */
  async confirmAction(
    inboxItemId: string,
    userId: string,
    action: FlowAction,
    streamId?: string,
    reason?: string
  ): Promise<void> {
    const inboxItem = await this.prisma.inboxItem.findUnique({
      where: { id: inboxItemId }
    });

    if (!inboxItem) {
      throw new Error(`InboxItem not found: ${inboxItemId}`);
    }

    // Sprawdz czy to override (użytkownik koryguje AI)
    const wasOverride = inboxItem.suggestedAction !== action ||
                        (streamId && inboxItem.suggestedStreams &&
                         Array.isArray(inboxItem.suggestedStreams) &&
                         (inboxItem.suggestedStreams as any[])[0]?.streamId !== streamId);

    // Wykonaj akcje
    const suggestion: ActionSuggestion = {
      action,
      confidence: 1.0,
      reasoning: reason || 'Decyzja uzytkownika',
      targetStreamId: streamId
    };

    await this.executeAction(inboxItemId, suggestion, userId);

    // KLUCZOWE: Ucz się z korekty użytkownika (few-shot learning)
    if (wasOverride) {
      console.log(`📚 Learning from user override: ${inboxItem.suggestedAction} -> ${action}`);
      await this.learnFromUserOverride(inboxItem, action, streamId, userId, reason);
    }

    // Zapisz feedback do historii
    await this.prisma.flow_processing_history.updateMany({
      where: { inboxItemId },
      data: {
        finalAction: action,
        finalStreamId: streamId,
        wasUserOverride: wasOverride,
        userFeedback: reason,
        completedAt: new Date()
      }
    });
  }

  /**
   * Few-shot learning: ucz się z korekt użytkownika
   * Zgodnie z master.md - system uczy się z każdej korekty
   */
  private async learnFromUserOverride(
    inboxItem: any,
    correctAction: FlowAction,
    correctStreamId: string | undefined,
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      const content = inboxItem.content || inboxItem.rawContent || '';
      const source = inboxItem.source || '';

      // 1. Wyodrębnij wzorce z treści dla przyszłego dopasowania
      const contentPattern = this.extractContentPattern(content);
      const senderPattern = this.extractSenderPattern(source);

      // 2. Sprawdź czy taki wzorzec już istnieje
      const existingPattern = await this.prisma.flow_learned_patterns.findFirst({
        where: {
          organizationId: this.organizationId,
          userId,
          OR: [
            // Dopasowanie po nadawcy (dla emaili)
            senderPattern ? { senderPattern } : {},
            // Dopasowanie po wzorcu treści
            contentPattern ? { contentPattern } : {},
            // Dopasowanie po typie elementu + akcji + streamie
            {
              elementType: inboxItem.elementType,
              learnedAction: correctAction,
              learnedStreamId: correctStreamId
            }
          ].filter(o => Object.keys(o).length > 0)
        }
      });

      if (existingPattern) {
        // Aktualizuj istniejący wzorzec - zwiększ confidence
        await this.prisma.flow_learned_patterns.update({
          where: { id: existingPattern.id },
          data: {
            occurrences: { increment: 1 },
            confidence: Math.min(existingPattern.confidence + 0.05, 0.95), // Szybsze uczenie z override
            learnedAction: correctAction,
            learnedStreamId: correctStreamId,
            lastUsedAt: new Date()
          }
        });
        console.log(`  ✏️ Updated pattern ${existingPattern.id}, confidence: ${existingPattern.confidence + 0.05}`);
      } else {
        // Utwórz nowy wzorzec z korektą użytkownika
        // Override ma wyższą początkową pewność (0.6) niż normalne uczenie (0.5)
        await this.prisma.flow_learned_patterns.create({
          data: {
            organizationId: this.organizationId,
            userId,
            elementType: inboxItem.elementType || 'OTHER',
            learnedAction: correctAction,
            learnedStreamId: correctStreamId,
            contentPattern: contentPattern,
            senderPattern: senderPattern,
            confidence: 0.6, // Wyższa początkowa pewność dla explicit override
            occurrences: 1,
            isActive: true
          }
        });
        console.log(`  ➕ Created new pattern from override: ${correctAction} -> stream ${correctStreamId || 'none'}`);
      }

      // 3. Jeśli override dotyczy streamu, zapamiętaj powiązanie entity-stream
      if (correctStreamId && inboxItem.companyId) {
        await this.recordEntityStreamAssociation(
          inboxItem.companyId,
          'COMPANY',
          correctStreamId,
          userId
        );
      }

      if (correctStreamId && inboxItem.contactId) {
        await this.recordEntityStreamAssociation(
          inboxItem.contactId,
          'CONTACT',
          correctStreamId,
          userId
        );
      }

    } catch (error) {
      console.error('Failed to learn from user override:', error);
      // Nie rzucaj błędu - learning jest opcjonalne
    }
  }

  /**
   * Wyodrębnij wzorzec treści do przyszłego dopasowania
   */
  private extractContentPattern(content: string): string | null {
    if (!content || content.length < 20) return null;

    // Znajdź charakterystyczne frazy (np. "Faktura", "Zamówienie #", "RE:")
    const patterns = [
      /faktura\s*(nr|numer|#)?/i,
      /zamówienie\s*(nr|numer|#)?/i,
      /umowa\s*(nr|numer|#)?/i,
      /oferta\s*(nr|numer|#)?/i,
      /^(RE:|FWD?:|AW:)/i,
      /pilne|urgent|asap/i,
      /spotkanie|meeting|call/i,
      /deadline|termin/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return pattern.source;
      }
    }

    // Fallback: pierwsze 3 znaczące słowa
    const words = content
      .replace(/[^\w\sąćęłńóśżź]/gi, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 3);

    return words.length >= 2 ? words.join('.*') : null;
  }

  /**
   * Wyodrębnij wzorzec nadawcy (dla emaili)
   */
  private extractSenderPattern(source: string): string | null {
    if (!source) return null;

    // Email - zachowaj domenę
    const emailMatch = source.match(/@([\w.-]+)/);
    if (emailMatch) {
      return `@${emailMatch[1]}$`; // np. @firma.pl$
    }

    // Numer telefonu - zachowaj prefix
    const phoneMatch = source.match(/^\+?(\d{2,3})/);
    if (phoneMatch) {
      return `^\\+?${phoneMatch[1]}`; // np. ^\\+?48
    }

    return null;
  }

  /**
   * Zapamiętaj powiązanie entity z streamem
   * Pomaga w przyszłym routingu - jeśli email od firmy X zwykle trafia do streamu Y
   * NOTE: Używamy senderPattern do zapamiętania powiązań z firmami/kontaktami
   */
  private async recordEntityStreamAssociation(
    entityId: string,
    entityType: 'COMPANY' | 'CONTACT',
    streamId: string,
    userId: string
  ): Promise<void> {
    try {
      // Pobierz domenę/email z entity
      let senderPattern: string | null = null;

      if (entityType === 'COMPANY') {
        const company = await this.prisma.company.findUnique({
          where: { id: entityId },
          select: { website: true, email: true }
        });
        if (company?.email) {
          const match = company.email.match(/@([\w.-]+)/);
          if (match) senderPattern = `@${match[1]}$`;
        } else if (company?.website) {
          const domain = company.website.replace(/^https?:\/\//, '').split('/')[0];
          senderPattern = `@${domain}$`;
        }
      } else if (entityType === 'CONTACT') {
        const contact = await this.prisma.contact.findUnique({
          where: { id: entityId },
          select: { email: true }
        });
        if (contact?.email) {
          senderPattern = contact.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$';
        }
      }

      if (!senderPattern) return;

      // Sprawdź czy powiązanie już istnieje
      const existing = await this.prisma.flow_learned_patterns.findFirst({
        where: {
          organizationId: this.organizationId,
          userId,
          senderPattern,
          learnedStreamId: streamId
        }
      });

      if (existing) {
        await this.prisma.flow_learned_patterns.update({
          where: { id: existing.id },
          data: {
            occurrences: { increment: 1 },
            confidence: Math.min(existing.confidence + 0.03, 0.95),
            lastUsedAt: new Date()
          }
        });
      } else {
        await this.prisma.flow_learned_patterns.create({
          data: {
            organizationId: this.organizationId,
            userId,
            senderPattern,
            learnedStreamId: streamId,
            learnedAction: 'ZAPLANUJ', // Default
            elementType: 'EMAIL',
            confidence: 0.5,
            occurrences: 1,
            isActive: true
          }
        });
      }
      console.log(`  🔗 Recorded ${entityType} sender pattern -> stream ${streamId}`);
    } catch (error) {
      // Ignoruj błędy - nie krytyczne
      console.warn('Could not record entity-stream association:', error);
    }
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createFlowEngine(prisma: PrismaClient, organizationId: string): FlowEngineService {
  return new FlowEngineService(prisma, organizationId);
}
