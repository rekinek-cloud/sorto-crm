/**
 * Email Pipeline Service
 *
 * Wieloetapowy pipeline przetwarzania maili:
 * 1. PRE-FILTER - szybkie reguły bez AI (blacklist, spam keywords)
 * 2. CLASSIFY - kategoryzacja i decyzja czy warto AI
 * 3. AI ANALYSIS - pełna analiza tylko dla wartościowych maili
 *
 * AI Analysis używa scentralizowanego systemu AI Management:
 * - Providery i modele z /dashboard/ai-management
 * - Szablony promptów (ai_prompt_templates)
 * - Logowanie wykonań (ai_executions)
 */

import { prisma } from '../config/database';
import { AIRouter } from './ai/AIRouter';
import { PipelineConfigLoader } from './ai/PipelineConfigLoader';
import { PipelineConfig } from './ai/PipelineConfigDefaults';
import { resolveModelForAction } from './ai/ActionModelResolver';

export interface EmailMessage {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  date: Date;
  channelId: string;
  headers?: Record<string, string>;
}

export interface PipelineResult {
  messageId: string;
  stage: 'PRE_FILTER' | 'CLASSIFY' | 'AI_ANALYSIS' | 'COMPLETED';
  action: 'REJECT' | 'ARCHIVE' | 'SKIP_AI' | 'PROCESS' | 'PRIORITY';

  // Rezultaty
  isSpam: boolean;
  category?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  skipAI: boolean;

  // AI results (jeśli nie skip)
  aiAnalysis?: {
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    urgency: number; // 0-100
    summary?: string;
    suggestedActions?: string[];
    extractedData?: Record<string, any>;
  };

  // Akcje do wykonania
  actions: PipelineAction[];

  // Debug info
  rulesExecuted: string[];
  processingTimeMs: number;
}

export interface PipelineAction {
  type: 'CREATE_TASK' | 'CREATE_DEAL' | 'UPDATE_CONTACT' | 'SEND_REPLY' | 'ADD_TAG' | 'MOVE_TO_FOLDER' | 'NOTIFY';
  data: Record<string, any>;
}

export interface PipelineRule {
  id: string;
  name: string;
  stage: 'PRE_FILTER' | 'CLASSIFY' | 'AI_ANALYSIS';
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  stopProcessing?: boolean; // Czy przerwać pipeline po tej regule
}

export interface RuleCondition {
  field: string; // 'from', 'subject', 'body', 'fromDomain', 'isExistingContact', 'category'
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'in' | 'notIn' | 'exists';
  value: string | string[] | boolean;
  caseSensitive?: boolean;
}

export interface RuleAction {
  type: 'REJECT' | 'ARCHIVE' | 'SKIP_AI' | 'SET_CATEGORY' | 'SET_PRIORITY' | 'ADD_TAG' | 'CREATE_TASK' | 'NOTIFY';
  value?: any;
}

class EmailPipelineService {

  /**
   * Główna metoda przetwarzania maila przez pipeline
   */
  async processEmail(message: EmailMessage, organizationId: string, forceSkipAI: boolean = false): Promise<PipelineResult> {
    const startTime = Date.now();
    const config = await PipelineConfigLoader.loadConfig(prisma, organizationId);
    const rulesExecuted: string[] = [];

    const result: PipelineResult = {
      messageId: message.id,
      stage: 'PRE_FILTER',
      action: 'PROCESS',
      isSpam: false,
      priority: 'NORMAL',
      skipAI: false,
      actions: [],
      rulesExecuted: [],
      processingTimeMs: 0
    };

    try {
      // Pobierz kontekst (czy nadawca jest w CRM)
      const context = await this.buildContext(message, organizationId);

      // ========== STAGE 1: PRE-FILTER ==========
      console.log(`[EmailPipeline] Stage 1: PRE-FILTER for ${message.id}`);
      const preFilterRules = await this.getRulesForStage('PRE_FILTER', organizationId, config);

      for (const rule of preFilterRules) {
        if (this.evaluateConditions(rule.conditions, message, context)) {
          rulesExecuted.push(rule.name);
          const ruleResult = this.executeActions(rule.actions, result);

          if (ruleResult.isSpam || ruleResult.action === 'REJECT') {
            result.stage = 'PRE_FILTER';
            result.isSpam = true;
            result.action = 'REJECT';
            result.skipAI = true;
            result.rulesExecuted = rulesExecuted;
            result.processingTimeMs = Date.now() - startTime;
            console.log(`[EmailPipeline] REJECTED by pre-filter rule: ${rule.name}`);
            return result;
          }

          if (rule.stopProcessing) break;
        }
      }

      // ========== STAGE 2: CLASSIFY ==========
      console.log(`[EmailPipeline] Stage 2: CLASSIFY for ${message.id}`);
      result.stage = 'CLASSIFY';
      const classifyRules = await this.getRulesForStage('CLASSIFY', organizationId, config);

      for (const rule of classifyRules) {
        if (this.evaluateConditions(rule.conditions, message, context)) {
          rulesExecuted.push(rule.name);
          this.executeActions(rule.actions, result);

          if (rule.stopProcessing) break;
        }
      }

      // Decyzja: czy uruchamiać AI?
      if (result.skipAI || forceSkipAI) {
        console.log(`[EmailPipeline] Skipping AI analysis for ${message.id}${forceSkipAI ? ' (forced)' : ''}`);
        result.skipAI = true;
        result.stage = 'COMPLETED';
        result.rulesExecuted = rulesExecuted;
        result.processingTimeMs = Date.now() - startTime;
        return result;
      }

      // ========== STAGE 3: AI ANALYSIS ==========
      console.log(`[EmailPipeline] Stage 3: AI ANALYSIS for ${message.id}`);
      result.stage = 'AI_ANALYSIS';

      // Tutaj wywołujemy AI
      const aiResult = await this.runAIAnalysis(message, context, organizationId, config);
      result.aiAnalysis = aiResult;

      // Uruchom reguły AI
      const aiRules = await this.getRulesForStage('AI_ANALYSIS', organizationId, config);
      for (const rule of aiRules) {
        // Przekaż też wyniki AI do kontekstu
        const enrichedContext = { ...context, ai: aiResult };
        if (this.evaluateConditions(rule.conditions, message, enrichedContext)) {
          rulesExecuted.push(rule.name);
          this.executeActions(rule.actions, result);

          if (rule.stopProcessing) break;
        }
      }

      result.stage = 'COMPLETED';
      result.action = 'PROCESS';
      result.rulesExecuted = rulesExecuted;
      result.processingTimeMs = Date.now() - startTime;

      console.log(`[EmailPipeline] Completed processing ${message.id} in ${result.processingTimeMs}ms`);
      return result;

    } catch (error) {
      console.error(`[EmailPipeline] Error processing ${message.id}:`, error);
      result.processingTimeMs = Date.now() - startTime;
      result.rulesExecuted = rulesExecuted;
      return result;
    }
  }

  /**
   * Ekstrakcja adresu email z nagłówka From
   */
  private extractEmail(from: string): string {
    // Format: "Name <email@example.com>" lub "email@example.com"
    const emailMatch = from.match(/<([^>]+)>/);
    if (emailMatch) {
      return emailMatch[1].toLowerCase();
    }
    return from.toLowerCase().trim();
  }

  /**
   * Budowanie kontekstu dla wiadomości
   */
  private async buildContext(message: EmailMessage, organizationId: string): Promise<Record<string, any>> {
    const fromEmail = this.extractEmail(message.from);
    const fromDomain = fromEmail.split('@')[1] || '';

    // Sprawdź czy nadawca jest w CRM
    const existingContact = await prisma.contact.findFirst({
      where: {
        organizationId,
        email: fromEmail
      },
      include: {
        companies: true
      }
    });

    // Sprawdź czy jest VIP (ma aktywne deale powiązane przez firmę)
    let isVIP = false;
    if (existingContact && existingContact.companies && existingContact.companies.length > 0) {
      const companyIds = existingContact.companies.map((c: any) => c.id);
      const activeDeals = await prisma.deal.count({
        where: {
          organizationId,
          companyId: { in: companyIds }
        }
      });
      isVIP = activeDeals > 0;
    }

    return {
      fromEmail,
      fromDomain,
      isExistingContact: !!existingContact,
      contact: existingContact,
      isVIP,
      hasCompany: (existingContact?.companies?.length ?? 0) > 0,
      emailAge: Date.now() - message.date.getTime()
    };
  }

  /**
   * Pobieranie reguł dla danego etapu
   */
  private async getRulesForStage(stage: string, organizationId: string, config: PipelineConfig): Promise<PipelineRule[]> {
    // Pobierz reguły z bazy
    const dbRules = await prisma.unified_rules.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        ruleType: 'EMAIL_FILTER',
        category: stage
      },
      orderBy: { priority: 'desc' }
    });

    // Konwertuj na format PipelineRule
    const rules: PipelineRule[] = dbRules.map(r => ({
      id: r.id,
      name: r.name,
      stage: stage as any,
      priority: r.priority,
      conditions: (r.conditions as any)?.rules || [],
      actions: (r.actions as any)?.actions || [],
      stopProcessing: (r.actions as any)?.stopProcessing
    }));

    // Dodaj domyślne reguły systemowe
    const systemRules = this.getSystemRules(stage, config);

    return [...systemRules, ...rules].sort((a, b) => b.priority - a.priority);
  }

  /**
   * System rules loaded from config (DB with defaults fallback)
   */
  private getSystemRules(stage: string, config: PipelineConfig): PipelineRule[] {
    if (stage === 'PRE_FILTER') {
      return (config.systemRules.preFilter || []).map(r => ({
        ...r,
        stage: 'PRE_FILTER' as const,
        conditions: r.conditions as RuleCondition[],
        actions: r.actions as RuleAction[],
      }));
    }
    if (stage === 'CLASSIFY') {
      return (config.systemRules.classify || []).map(r => ({
        ...r,
        stage: 'CLASSIFY' as const,
        conditions: r.conditions as RuleCondition[],
        actions: r.actions as RuleAction[],
      }));
    }
    return [];
  }

  /**
   * Ewaluacja warunków reguły
   */
  private evaluateConditions(conditions: RuleCondition[], message: EmailMessage, context: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(condition.field, message, context);
      return this.evaluateCondition(condition, fieldValue);
    });
  }

  private getFieldValue(field: string, message: EmailMessage, context: Record<string, any>): any {
    switch (field) {
      case 'from': return message.from.toLowerCase();
      case 'fromEmail': return context.fromEmail;
      case 'fromDomain': return context.fromDomain;
      case 'to': return message.to.toLowerCase();
      case 'subject': return message.subject.toLowerCase();
      case 'body': return message.body.toLowerCase();
      case 'isExistingContact': return context.isExistingContact;
      case 'isVIP': return context.isVIP;
      case 'hasCompany': return context.hasCompany;
      case 'ai.sentiment': return context.ai?.sentiment;
      case 'ai.urgency': return context.ai?.urgency;
      default: return context[field];
    }
  }

  private evaluateCondition(condition: RuleCondition, fieldValue: any): boolean {
    const { operator, value, caseSensitive } = condition;

    if (fieldValue === undefined || fieldValue === null) {
      return operator === 'exists' ? false : false;
    }

    const compareValue = caseSensitive ? fieldValue : String(fieldValue).toLowerCase();
    const targetValues = Array.isArray(value) ? value : [value];

    switch (operator) {
      case 'contains':
        return targetValues.some(v => compareValue.includes(String(v).toLowerCase()));
      case 'equals':
        return targetValues.some(v => compareValue === String(v).toLowerCase());
      case 'startsWith':
        return targetValues.some(v => compareValue.startsWith(String(v).toLowerCase()));
      case 'endsWith':
        return targetValues.some(v => compareValue.endsWith(String(v).toLowerCase()));
      case 'regex':
        return targetValues.some(v => new RegExp(String(v), caseSensitive ? '' : 'i').test(fieldValue));
      case 'in':
        return targetValues.includes(compareValue);
      case 'notIn':
        return !targetValues.includes(compareValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      default:
        return false;
    }
  }

  /**
   * Wykonanie akcji reguły
   */
  private executeActions(actions: RuleAction[], result: PipelineResult): PipelineResult {
    for (const action of actions) {
      switch (action.type) {
        case 'REJECT':
          result.isSpam = true;
          result.action = 'REJECT';
          result.skipAI = true;
          break;
        case 'ARCHIVE':
          result.action = 'ARCHIVE';
          break;
        case 'SKIP_AI':
          result.skipAI = true;
          break;
        case 'SET_CATEGORY':
          result.category = action.value;
          break;
        case 'SET_PRIORITY':
          result.priority = action.value;
          break;
        case 'ADD_TAG':
          result.actions.push({ type: 'ADD_TAG', data: { tag: action.value } });
          break;
        case 'CREATE_TASK':
          result.actions.push({ type: 'CREATE_TASK', data: action.value || {} });
          break;
        case 'NOTIFY':
          result.actions.push({ type: 'NOTIFY', data: action.value || {} });
          break;
      }
    }
    return result;
  }

  /**
   * Analiza AI (wywoływana tylko dla wartościowych maili)
   * Używa scentralizowanego systemu AI Management (providery, modele, prompty)
   */
  private async runAIAnalysis(message: EmailMessage, context: Record<string, any>, organizationId: string, config: PipelineConfig): Promise<PipelineResult['aiAnalysis']> {
    try {
      console.log('[EmailPipeline] Running AI analysis via AI Management...');

      // 1. Inicjalizuj AIRouter dla organizacji
      const aiRouter = new AIRouter({ organizationId, prisma });
      await aiRouter.initializeProviders();

      // Sprawdź czy są dostępne providery AI
      if (!aiRouter.hasAvailableProviders()) {
        console.log('[EmailPipeline] No AI providers configured, using heuristic fallback');
        return this.runHeuristicAnalysis(message, context, config);
      }

      // 2. Pobierz szablon "Email Analysis" z bazy (lub użyj domyślnego)
      let promptTemplate = await prisma.ai_prompt_templates.findFirst({
        where: {
          organizationId,
          OR: [
            { code: 'EMAIL_ANALYSIS' },
            { name: 'Email Analysis' }
          ],
          status: 'ACTIVE'
        }
      });

      // Jeśli nie ma szablonu, utwórz domyślny
      if (!promptTemplate) {
        console.log('[EmailPipeline] Creating default Email Analysis template...');
        promptTemplate = await this.createDefaultEmailTemplate(organizationId);
      }

      if (!promptTemplate) {
        console.log('[EmailPipeline] Could not create template, using heuristic fallback');
        return this.runHeuristicAnalysis(message, context, config);
      }

      // 3. Przygotuj prompt z podstawionymi zmiennymi
      const emailContent = message.body?.substring(0, config.contentLimits.aiContentLimit) || '';
      const systemPrompt = promptTemplate.systemPrompt || 'You are an AI assistant that analyzes emails. Respond with valid JSON only.';

      let userPrompt = promptTemplate.userPromptTemplate;
      userPrompt = userPrompt.replace(/\{\{emailContent\}\}/g, emailContent);
      userPrompt = userPrompt.replace(/\{\{senderEmail\}\}/g, context.fromEmail || message.from);
      userPrompt = userPrompt.replace(/\{\{subject\}\}/g, message.subject || '');

      // 4. Wykonaj zapytanie AI przez AIRouter
      const resolvedPipeline = await resolveModelForAction(organizationId, 'EMAIL_PIPELINE');
      const aiResponse = await aiRouter.processRequest({
        model: resolvedPipeline?.modelName ?? promptTemplate.defaultModel ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        config: {
          temperature: promptTemplate.defaultTemperature || 0.3,
          maxTokens: promptTemplate.maxTokens || 1000,
          responseFormat: 'json'
        }
      });

      // 5. Parsuj odpowiedź AI
      let parsedResponse: any = {};
      try {
        // Spróbuj sparsować JSON z odpowiedzi
        const content = aiResponse.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn('[EmailPipeline] Could not parse AI response as JSON:', parseError);
        // Użyj heurystyki jako fallback
        return this.runHeuristicAnalysis(message, context, config);
      }

      // 6. Mapuj odpowiedź AI na format PipelineResult
      const sentiment = this.mapSentiment(parsedResponse.sentiment);
      const urgency = typeof parsedResponse.urgencyScore === 'number'
        ? Math.min(100, Math.max(0, parsedResponse.urgencyScore))
        : 50;

      console.log(`[EmailPipeline] AI analysis completed - sentiment: ${sentiment}, urgency: ${urgency}`);

      return {
        sentiment,
        urgency,
        summary: parsedResponse.summary || `Email od ${context.fromEmail}: ${message.subject}`,
        suggestedActions: parsedResponse.actionItems || [],
        extractedData: {
          category: parsedResponse.category,
          priority: parsedResponse.priority,
          responseRequired: parsedResponse.responseRequired,
          deadline: parsedResponse.deadline,
          tokensUsed: aiResponse.usage?.totalTokens,
          model: aiResponse.model
        }
      };

    } catch (error) {
      console.error('[EmailPipeline] AI analysis error:', error);
      // Fallback do heurystyki w przypadku błędu
      console.log('[EmailPipeline] Falling back to heuristic analysis');
      return this.runHeuristicAnalysis(message, context, config);
    }
  }

  /**
   * Heurystyczna analiza (fallback gdy AI niedostępne)
   */
  private runHeuristicAnalysis(message: EmailMessage, context: Record<string, any>, config: PipelineConfig): PipelineResult['aiAnalysis'] {
    const urgencyScore = this.calculateUrgencyScore(message, config);
    const sentiment = this.detectSentiment(message, config);

    return {
      sentiment,
      urgency: urgencyScore,
      summary: `Email od ${context.fromEmail}: ${message.subject}`,
      suggestedActions: urgencyScore > 70 ? ['Odpowiedz szybko', 'Utwórz zadanie'] : [],
      extractedData: {
        analysisType: 'heuristic' // Oznacz że to heurystyka, nie AI
      }
    };
  }

  /**
   * Mapowanie sentiment z odpowiedzi AI
   */
  private mapSentiment(sentiment: string | undefined): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
    if (!sentiment) return 'NEUTRAL';
    const lower = sentiment.toLowerCase();
    if (lower === 'positive') return 'POSITIVE';
    if (lower === 'negative') return 'NEGATIVE';
    return 'NEUTRAL';
  }

  /**
   * Tworzenie domyślnego szablonu Email Analysis
   */
  private async createDefaultEmailTemplate(organizationId: string): Promise<any> {
    try {
      return await prisma.ai_prompt_templates.create({
        data: {
          id: `tpl-email-${Date.now()}`,
          code: 'EMAIL_ANALYSIS',
          name: 'Email Analysis',
          description: 'Analiza emaili - sentiment, pilność, akcje do podjęcia',
          category: 'EMAIL',
          isSystem: true,
          systemPrompt: `Jesteś asystentem AI analizującym emaile biznesowe.
Odpowiadaj TYLKO w formacie JSON bez żadnego dodatkowego tekstu.
Analizuj w języku polskim.`,
          userPromptTemplate: `Przeanalizuj poniższy email i zwróć JSON z następującymi polami:

Email:
Od: {{senderEmail}}
Temat: {{subject}}
Treść: {{emailContent}}

Zwróć JSON z polami:
- sentiment: "positive", "negative" lub "neutral"
- urgencyScore: liczba 0-100 (jak pilny jest ten email)
- actionItems: tablica stringów z akcjami do podjęcia
- priority: "LOW", "MEDIUM", "HIGH" lub "URGENT"
- category: kategoria emaila (np. "zapytanie", "reklamacja", "faktura", "newsletter", "inne")
- responseRequired: true/false czy wymaga odpowiedzi
- summary: krótkie podsumowanie emaila (1-2 zdania)`,
          variables: {
            emailContent: { type: 'string', required: true },
            senderEmail: { type: 'string', required: true },
            subject: { type: 'string', required: true }
          },
          defaultModel: 'gpt-4o-mini',
          defaultTemperature: 0.3,
          maxTokens: 800,
          organizationId,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('[EmailPipeline] Failed to create default template:', error);
      return null;
    }
  }

  private calculateUrgencyScore(message: EmailMessage, config: PipelineConfig): number {
    let score = 50; // bazowy

    const urgentKeywords = config.keywords.urgency;
    const subject = message.subject.toLowerCase();
    const body = message.body.toLowerCase();

    for (const keyword of urgentKeywords) {
      if (subject.includes(keyword)) score += 20;
      if (body.includes(keyword)) score += 10;
    }

    return Math.min(100, score);
  }

  private detectSentiment(message: EmailMessage, config: PipelineConfig): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
    const text = (message.subject + ' ' + message.body).toLowerCase();

    const positiveWords = config.keywords.sentimentPositive;
    const negativeWords = config.keywords.sentimentNegative;

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (text.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
      if (text.includes(word)) negativeCount++;
    }

    if (negativeCount > positiveCount) return 'NEGATIVE';
    if (positiveCount > negativeCount) return 'POSITIVE';
    return 'NEUTRAL';
  }

  /**
   * Wykonanie akcji po przetworzeniu
   */
  async executePostProcessingActions(result: PipelineResult, organizationId: string, userId: string): Promise<void> {
    for (const action of result.actions) {
      try {
        switch (action.type) {
          case 'CREATE_TASK':
            // Mapuj priorytet pipeline na enum Priority
            const taskPriority = result.priority === 'NORMAL' ? 'MEDIUM' : result.priority;
            await prisma.task.create({
              data: {
                title: action.data.title || `Email: ${result.messageId}`,
                description: action.data.description || `[Email Pipeline] Message ID: ${result.messageId}`,
                priority: taskPriority as any, // Priority enum
                status: 'NEW', // TaskStatus enum
                organizationId,
                createdById: userId
              }
            });
            break;
          // Inne akcje...
        }
      } catch (error) {
        console.error(`[EmailPipeline] Failed to execute action ${action.type}:`, error);
      }
    }
  }

  /**
   * Statystyki pipeline
   */
  async getStats(organizationId: string, days: number = 7): Promise<{
    totalProcessed: number;
    rejected: number;
    skippedAI: number;
    aiAnalyzed: number;
    avgProcessingTime: number;
  }> {
    // TODO: Implementacja statystyk z bazy
    return {
      totalProcessed: 0,
      rejected: 0,
      skippedAI: 0,
      aiAnalyzed: 0,
      avgProcessingTime: 0
    };
  }
}

export const emailPipeline = new EmailPipelineService();
export default emailPipeline;
