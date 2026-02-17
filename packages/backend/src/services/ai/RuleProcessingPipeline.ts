import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { FlowRAGService } from './FlowRAGService';
import { AIRouter } from './AIRouter';
import { AIRequest } from './providers/BaseProvider';
import logger from '../../config/logger';
import { PipelineConfigLoader } from './PipelineConfigLoader';
import { PipelineConfig } from './PipelineConfigDefaults';
import { resolveModelForAction } from './ActionModelResolver';
import { PromptManager } from './PromptManager';

// =============================================================================
// Interfaces
// =============================================================================

export interface EntityData {
  from?: string;
  fromName?: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  headers?: Record<string, string>;
  senderDomain?: string;
  senderName?: string;
  content?: string;
}

export interface CRMCheckResult {
  matched: boolean;
  type?: 'CONTACT' | 'COMPANY' | 'HISTORY';
  matchedEntityId?: string;
  matchedEntityName?: string;
  confidence: number;
}

export interface ListCheckResult {
  matched: boolean;
  listType?: 'BLACKLIST' | 'WHITELIST' | 'VIP';
  ruleId?: string;
  pattern?: string;
  classification?: string;
}

export interface PatternCheckResult {
  matched: boolean;
  patternId?: string;
  classification?: string;
  confidence: number;
}

export interface AIClassResult {
  classification: string;
  confidence: number;
  extraction?: Record<string, any>;
}

export interface ExtractedTask {
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueIndicator?: string;
}

export interface RuleMatchResult {
  matched: boolean;
  ruleId?: string;
  ruleName?: string;
  classification?: string;
  confidence?: number;
  actions?: {
    forceClassification?: string;
    setPriority?: string;
    reject?: boolean;
    skipAI?: boolean;
    addToRag?: boolean;
    addToFlow?: boolean;
    createDeal?: boolean;
    list?: { action: string; target: string };
    templateId?: string;       // prompt template code from ai_prompt_templates
    aiPrompt?: string;         // inline user prompt from rule
    aiSystemPrompt?: string;   // inline system prompt from rule
  };
}

export interface ProcessingResult {
  entityType: string;
  entityId: string;
  stages: {
    crmCheck: CRMCheckResult;
    listCheck: ListCheckResult;
    patternCheck: PatternCheckResult;
    ruleMatch?: RuleMatchResult;
    aiClassification?: AIClassResult;
  };
  finalClass: string;
  finalConfidence: number;
  actionsExecuted: string[];
  extractedTasks?: ExtractedTask[];
  linkedEntities?: { contactId?: string; companyId?: string; dealId?: string };
  sentiment?: string;      // POSITIVE | NEUTRAL | NEGATIVE
  urgencyScore?: number;   // 0-100
}

// =============================================================================
// RuleProcessingPipeline
// =============================================================================

export class RuleProcessingPipeline {
  private prisma: PrismaClient;
  private ragService: FlowRAGService;
  private config!: PipelineConfig;
  private freeEmailDomains!: Set<string>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.ragService = new FlowRAGService(prisma);
  }

  /**
   * Main entry point: process an entity through the pipeline.
   * Stage 1: CRM Protection (contacts/companies → BUSINESS)
   * Stage 2: Lists & Patterns (blacklist/whitelist, email patterns)
   * Stage 2.5: AI Rules (always checked — from /dashboard/ai-rules)
   * Stage 3: Classification decision (CRM > Lists > Patterns > Rules > default INBOX)
   * Stage 4: Post-classification AI (ONLY if prompt EMAIL_POST_{category} exists or rule has inline prompt)
   * Stage 5: Post-actions (RAG, Flow, entities, blacklist, tasks)
   *
   * AI is NOT auto-triggered. The gate is: does a prompt exist for the category?
   */
  async processEntity(
    organizationId: string,
    entityType: string,
    entityId: string,
    entityData: EntityData
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    // Load dynamic config from DB (with cache + fallback to defaults)
    const config = await PipelineConfigLoader.loadConfig(this.prisma, organizationId);
    this.config = config;
    this.freeEmailDomains = new Set(config.domains.freeEmailDomains);

    // Create or update processing record
    const processingRecord = await this.prisma.data_processing.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      create: {
        organizationId,
        entityType,
        entityId,
        status: 'PROCESSING',
        startedAt: new Date(),
      },
      update: {
        status: 'PROCESSING',
        startedAt: new Date(),
        error: null,
      },
    });

    try {
      // Extract sender info
      const senderEmail = entityData.from || '';
      const senderDomain = entityData.senderDomain || this.extractDomain(senderEmail);

      // Stage 1: CRM Protection
      const crmCheck = await this.checkCRM(organizationId, senderEmail, senderDomain);

      // Stage 2: Lists & Patterns (skip if CRM matched)
      let listCheck: ListCheckResult = { matched: false };
      let patternCheck: PatternCheckResult = { matched: false, confidence: 0 };

      if (!crmCheck.matched) {
        [listCheck, patternCheck] = await Promise.all([
          this.checkLists(organizationId, senderEmail, senderDomain),
          this.checkPatterns(organizationId, entityData),
        ]);
      }

      // Stage 2.5: AI Rules (from /dashboard/ai-rules) — ALWAYS checked
      let ruleMatch: RuleMatchResult = { matched: false };
      ruleMatch = await this.applyAIRules(organizationId, entityData, senderEmail, senderDomain);

      // Determine final classification
      // Priority: CRM > Lists > Patterns > AI Rules > AI Classification
      let finalClass: string;
      let finalConfidence: number;
      let extractedTasks: ExtractedTask[] = [];

      if (crmCheck.matched) {
        finalClass = 'BUSINESS';
        finalConfidence = crmCheck.confidence;
      } else if (listCheck.matched) {
        finalClass = listCheck.classification || (listCheck.listType === 'BLACKLIST' ? 'SPAM' : 'BUSINESS');
        finalConfidence = this.config.thresholds.listMatchConfidence;
      } else if (patternCheck.matched) {
        finalClass = patternCheck.classification || 'NEWSLETTER';
        finalConfidence = patternCheck.confidence;
      } else if (ruleMatch.matched && ruleMatch.actions?.forceClassification) {
        finalClass = ruleMatch.actions.forceClassification;
        finalConfidence = ruleMatch.confidence || this.config.thresholds.defaultRuleConfidence;
      } else {
        // No match anywhere → default to INBOX without AI
        // AI fires ONLY in post-classification if prompt EMAIL_POST_{category} exists
        finalClass = 'INBOX';
        finalConfidence = 0;
      }

      // Stage 4: Post-classification Actions
      const actionsExecuted: string[] = [];
      const linkedEntities: { contactId?: string; companyId?: string; dealId?: string } = {};

      // Link to contact/company
      if (crmCheck.matched && crmCheck.matchedEntityId) {
        if (crmCheck.type === 'CONTACT') {
          linkedEntities.contactId = crmCheck.matchedEntityId;
        } else if (crmCheck.type === 'COMPANY') {
          linkedEntities.companyId = crmCheck.matchedEntityId;
        }
      } else if (senderEmail) {
        const linked = await this.linkToEntities(organizationId, senderEmail, senderDomain);
        if (linked.contactId) linkedEntities.contactId = linked.contactId;
        if (linked.companyId) linkedEntities.companyId = linked.companyId;
      }
      if (linkedEntities.contactId || linkedEntities.companyId) {
        actionsExecuted.push('LINKED_ENTITIES');
      }

      // Extract tasks from content (if AI didn't already extract)
      if (extractedTasks.length === 0 && this.config.postActions[finalClass]?.extractTasks) {
        extractedTasks = this.extractTasksFromContent(entityData);
      }
      if (extractedTasks.length > 0) {
        actionsExecuted.push('EXTRACTED_TASKS');
      }

      // Execute class-specific actions
      let addedToRag = false;
      let addedToFlow = false;
      let flowItemId: string | null = null;

      // Apply rule-based priority override
      if (ruleMatch.matched && ruleMatch.actions?.setPriority) {
        actionsExecuted.push(`SET_PRIORITY:${ruleMatch.actions.setPriority}`);
      }

      const classActions = this.config.postActions[finalClass] || {};

      if (classActions.rag || ruleMatch.actions?.addToRag) {
        addedToRag = await this.addToRAG(organizationId, entityType, entityId, entityData, finalClass);
        if (addedToRag) actionsExecuted.push('ADDED_TO_RAG');
      }

      if (classActions.flow || ruleMatch.actions?.addToFlow) {
        const flowResult = await this.addToFlow(organizationId, entityType, entityId, entityData);
        if (flowResult) {
          addedToFlow = true;
          flowItemId = flowResult;
          actionsExecuted.push('ADDED_TO_FLOW');
        }
      }

      // Create deal if rule says so (e.g. Cooperation Request)
      if (ruleMatch.actions?.createDeal) {
        try {
          const senderDomainForDeal = senderEmail?.split('@')[1];
          // Find or skip — look for company by domain
          const company = await this.prisma.company.findFirst({
            where: { organizationId, website: { contains: senderDomainForDeal || '' } },
          });
          const contact = senderEmail ? await this.prisma.contact.findFirst({
            where: { organizationId, email: senderEmail },
          }) : null;

          const dealTitle = entityData.subject
            ? `${entityData.subject}`
            : `Zapytanie od ${entityData.fromName || senderEmail || 'nieznany'}`;

          const adminUser = await this.prisma.user.findFirst({
            where: { organizationId },
            orderBy: { createdAt: 'asc' },
          });

          const deal = await this.prisma.deal.create({
            data: {
              title: dealTitle,
              description: `Automatycznie utworzony z emaila.\nOd: ${senderEmail}\nTemat: ${entityData.subject || ''}`,
              stage: 'PROSPECT',
              value: 0,
              source: 'Email',
              companyId: company?.id || null,
              ownerId: adminUser?.id || '',
              organizationId,
            },
          });

          // Link contact to deal if found
          if (contact) {
            linkedEntities.dealId = deal.id;
          }

          actionsExecuted.push(`CREATED_DEAL:${deal.id}`);
          console.log(`💼 Created deal: ${deal.title} (${deal.id})`);
        } catch (err) {
          console.warn('⚠️ Failed to create deal:', err);
        }
      }

      if (classActions.suggestBlacklist || ruleMatch.actions?.list?.action === 'SUGGEST_BLACKLIST') {
        if (!addedToRag && (classActions.rag !== false)) {
          addedToRag = await this.addToRAG(organizationId, entityType, entityId, entityData, finalClass);
          if (addedToRag) actionsExecuted.push('ADDED_TO_RAG');
        }
        if (senderDomain && !this.freeEmailDomains.has(senderDomain)) {
          await this.suggestBlacklist(organizationId, senderDomain, senderEmail, finalConfidence, entityData);
          actionsExecuted.push('SUGGESTED_BLACKLIST');
        }
      }

      if (classActions.autoBlacklist || ruleMatch.actions?.reject) {
        actionsExecuted.push('IGNORED_SPAM');
        if (finalConfidence > this.config.thresholds.autoBlacklistThreshold && senderDomain && !this.freeEmailDomains.has(senderDomain)) {
          await this.autoBlacklist(organizationId, senderDomain, senderEmail, finalConfidence);
          actionsExecuted.push('AUTO_BLACKLISTED');
        }
      }

      if (classActions.extractTasks && extractedTasks.length === 0) {
        extractedTasks = this.extractTasksFromContent(entityData);
      }

      // Post-classification AI analysis — fires ONLY if prompt exists for this category
      // Gate: existence of prompt EMAIL_POST_{category} OR inline prompt from matched rule
      let postClassificationAnalysis: string | null = null;
      if (finalClass !== 'SPAM' && finalClass !== 'UNKNOWN') {
        postClassificationAnalysis = await this.runPostClassificationPrompt(
          organizationId, entityData, finalClass, ruleMatch.actions
        );
        if (postClassificationAnalysis) {
          actionsExecuted.push('POST_CLASSIFICATION_ANALYSIS');
        }
      }

      // Extract sentiment and urgency from post-classification analysis
      let sentiment: string | undefined;
      let urgencyScore: number | undefined;
      if (postClassificationAnalysis) {
        try {
          const jsonMatch = postClassificationAnalysis.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.sentiment) {
              sentiment = String(parsed.sentiment).toUpperCase();
            }
            if (parsed.urgency !== undefined) {
              if (typeof parsed.urgency === 'number') {
                urgencyScore = parsed.urgency;
              } else {
                const urgencyMap: Record<string, number> = { LOW: 20, MEDIUM: 50, HIGH: 80, CRITICAL: 95 };
                urgencyScore = urgencyMap[String(parsed.urgency).toUpperCase()] || 50;
              }
            }
          }
        } catch {
          // Failed to parse sentiment/urgency — non-critical
        }
      }

      // Auto-create CRM entities from post-classification analysis
      if (postClassificationAnalysis && finalClass !== 'SPAM' && finalClass !== 'UNKNOWN') {
        await this.createEntitiesFromAnalysis(
          organizationId, entityId, finalClass,
          postClassificationAnalysis, entityData, linkedEntities, actionsExecuted
        );
      }

      // Update processing record with all results
      const aiExtractionData = (() => {
        const base: Record<string, any> = {};
        if (postClassificationAnalysis) base.postClassificationAnalysis = postClassificationAnalysis;
        const entityActions = actionsExecuted.filter((a: string) => a.startsWith('CREATED_'));
        if (entityActions.length > 0) base.entitiesCreated = entityActions;
        return Object.keys(base).length > 0 ? base : null;
      })();

      await this.prisma.data_processing.update({
        where: { id: processingRecord.id },
        data: {
          crmMatch: crmCheck.matched ? crmCheck as any : null,
          listMatch: listCheck.matched ? listCheck as any : null,
          patternMatch: patternCheck.matched ? patternCheck as any : null,
          aiClassification: postClassificationAnalysis ? finalClass : null,
          aiConfidence: postClassificationAnalysis ? finalConfidence : null,
          aiExtraction: aiExtractionData,
          finalClass,
          finalConfidence,
          addedToRag,
          addedToFlow,
          flowItemId,
          linkedEntities: (linkedEntities.contactId || linkedEntities.companyId) ? linkedEntities as any : null,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Log execution to ai_executions for audit trail
      await this.logExecution(organizationId, entityType, entityId, {
        finalClass,
        finalConfidence,
        stages: { crmCheck: crmCheck.matched, listCheck: listCheck.matched, patternCheck: patternCheck.matched, ruleMatch: ruleMatch.matched, aiUsed: !!postClassificationAnalysis },
        actionsExecuted,
        executionTime: Date.now() - startTime,
      });

      return {
        entityType,
        entityId,
        stages: {
          crmCheck,
          listCheck,
          patternCheck,
          ruleMatch: ruleMatch.matched ? ruleMatch : undefined,
          aiClassification: undefined,
        },
        finalClass,
        finalConfidence,
        actionsExecuted,
        extractedTasks,
        linkedEntities,
        sentiment,
        urgencyScore,
      };
    } catch (error) {
      logger.error(`Processing pipeline failed for ${entityType}:${entityId}:`, error);

      await this.prisma.data_processing.update({
        where: { id: processingRecord.id },
        data: {
          status: 'FAILED',
          error: (error as Error).message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  // ===========================================================================
  // Stage 1: CRM Protection
  // ===========================================================================

  private async checkCRM(
    organizationId: string,
    senderEmail: string,
    senderDomain: string
  ): Promise<CRMCheckResult> {
    if (!senderEmail && !senderDomain) {
      return { matched: false, confidence: 0 };
    }

    // Check contacts by email
    if (senderEmail) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          organizationId,
          email: { equals: senderEmail, mode: 'insensitive' },
        },
        select: { id: true, firstName: true, lastName: true },
      });

      if (contact) {
        return {
          matched: true,
          type: 'CONTACT',
          matchedEntityId: contact.id,
          matchedEntityName: `${contact.firstName} ${contact.lastName}`,
          confidence: 1.0,
        };
      }
    }

    // Check companies by domain
    if (senderDomain && !this.freeEmailDomains.has(senderDomain)) {
      const company = await this.prisma.company.findFirst({
        where: {
          organizationId,
          domain: { equals: senderDomain, mode: 'insensitive' },
        },
        select: { id: true, name: true },
      });

      if (company) {
        return {
          matched: true,
          type: 'COMPANY',
          matchedEntityId: company.id,
          matchedEntityName: company.name,
          confidence: 0.95,
        };
      }
    }

    return { matched: false, confidence: 0 };
  }

  // ===========================================================================
  // Stage 2: Lists & Patterns
  // ===========================================================================

  private async checkLists(
    organizationId: string,
    senderEmail: string,
    senderDomain: string
  ): Promise<ListCheckResult> {
    if (!senderEmail && !senderDomain) {
      return { matched: false };
    }

    // Check exact email match
    const emailRule = senderEmail ? await this.prisma.email_domain_rules.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE',
        patternType: 'EMAIL',
        pattern: senderEmail.toLowerCase(),
      },
    }) : null;

    if (emailRule) {
      await this.prisma.email_domain_rules.update({
        where: { id: emailRule.id },
        data: { matchCount: { increment: 1 }, lastMatchAt: new Date() },
      }).catch(() => {});

      return {
        matched: true,
        listType: emailRule.listType as any,
        ruleId: emailRule.id,
        pattern: emailRule.pattern,
        classification: emailRule.classification || undefined,
      };
    }

    // Check domain match
    if (senderDomain) {
      const domainRule = await this.prisma.email_domain_rules.findFirst({
        where: {
          organizationId,
          status: 'ACTIVE',
          patternType: 'DOMAIN',
          pattern: senderDomain.toLowerCase(),
        },
      });

      if (domainRule) {
        await this.prisma.email_domain_rules.update({
          where: { id: domainRule.id },
          data: { matchCount: { increment: 1 }, lastMatchAt: new Date() },
        }).catch(() => {});

        return {
          matched: true,
          listType: domainRule.listType as any,
          ruleId: domainRule.id,
          pattern: domainRule.pattern,
          classification: domainRule.classification || undefined,
        };
      }
    }

    // Check wildcard patterns
    const wildcardRules = await this.prisma.email_domain_rules.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        patternType: 'WILDCARD',
      },
    });

    for (const rule of wildcardRules) {
      const regex = this.wildcardToRegex(rule.pattern);
      const testValue = senderEmail || senderDomain;
      if (testValue && regex.test(testValue)) {
        await this.prisma.email_domain_rules.update({
          where: { id: rule.id },
          data: { matchCount: { increment: 1 }, lastMatchAt: new Date() },
        }).catch(() => {});

        return {
          matched: true,
          listType: rule.listType as any,
          ruleId: rule.id,
          pattern: rule.pattern,
          classification: rule.classification || undefined,
        };
      }
    }

    return { matched: false };
  }

  private async checkPatterns(
    organizationId: string,
    entityData: EntityData
  ): Promise<PatternCheckResult> {
    const patterns = await this.prisma.email_patterns.findMany({
      where: {
        OR: [
          { organizationId },
          { organizationId: null, isSystem: true },
        ],
      },
    });

    for (const pattern of patterns) {
      const textToCheck = this.getFieldForPattern(entityData, pattern.patternType);
      if (!textToCheck) continue;

      let matched = false;
      if (pattern.isRegex) {
        try {
          matched = new RegExp(pattern.pattern, 'i').test(textToCheck);
        } catch {
          continue;
        }
      } else {
        matched = textToCheck.toLowerCase().includes(pattern.pattern.toLowerCase());
      }

      if (matched) {
        await this.prisma.email_patterns.update({
          where: { id: pattern.id },
          data: { matchCount: { increment: 1 } },
        }).catch(() => {});

        return {
          matched: true,
          patternId: pattern.id,
          classification: pattern.classification,
          confidence: pattern.confidence,
        };
      }
    }

    return { matched: false, confidence: 0 };
  }

  // ===========================================================================
  // Stage 2.5: AI Rules (from /dashboard/ai-rules)
  // ===========================================================================

  private async applyAIRules(
    organizationId: string,
    entityData: EntityData,
    senderEmail: string,
    senderDomain: string
  ): Promise<RuleMatchResult> {
    try {
      const rules = await this.prisma.ai_rules.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
          triggerType: 'MESSAGE_RECEIVED',
          dataType: { in: ['EMAIL', 'ALL'] },
        },
        orderBy: { priority: 'desc' },
      });

      if (rules.length === 0) return { matched: false };

      for (const rule of rules) {
        const conditions = rule.triggerConditions as any;
        const matched = this.evaluateRuleConditions(conditions, entityData, senderEmail, senderDomain);

        if (matched) {
          const actions = rule.actions as any || {};
          logger.info(`[AIRules] Rule "${rule.name}" matched for ${senderEmail}`, {
            ruleId: rule.id, classification: actions.forceClassification,
          });

          // Update execution stats (fire-and-forget)
          this.prisma.ai_rules.update({
            where: { id: rule.id },
            data: {
              executionCount: { increment: 1 },
              successCount: { increment: 1 },
              lastExecuted: new Date(),
            },
          }).catch(() => {});

          // Log to ai_executions (fire-and-forget)
          this.prisma.ai_executions.create({
            data: {
              id: `exec-rule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              inputData: { senderEmail, subject: entityData.subject },
              promptSent: `Rule: ${rule.name}`,
              responseReceived: actions.forceClassification || 'matched',
              parsedOutput: actions,
              status: 'SUCCESS',
              executionTime: 0,
              actionsExecuted: Object.keys(actions),
              createdAt: new Date(),
              updatedAt: new Date(),
              ai_rules: { connect: { id: rule.id } },
              organizations: { connect: { id: organizationId } },
            },
          }).catch(() => {});

          return {
            matched: true,
            ruleId: rule.id,
            ruleName: rule.name,
            classification: actions.forceClassification,
            confidence: 0.85,
            actions: {
              forceClassification: actions.forceClassification,
              setPriority: actions.setPriority,
              reject: actions.reject,
              skipAI: actions.skipAI,
              addToRag: actions.addToRag,
              addToFlow: actions.addToFlow,
              createDeal: actions.createDeal,
              list: actions.list,
              templateId: (rule as any).templateId || undefined,
              aiPrompt: (rule as any).aiPrompt || undefined,
              aiSystemPrompt: (rule as any).aiSystemPrompt || undefined,
            },
          };
        }
      }

      return { matched: false };
    } catch (error) {
      logger.warn('[AIRules] Error applying rules:', error);
      return { matched: false };
    }
  }

  private evaluateRuleConditions(
    triggerConditions: any,
    entityData: EntityData,
    senderEmail: string,
    senderDomain: string
  ): boolean {
    if (!triggerConditions) return true;

    const conditions = triggerConditions.conditions;
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
      return true; // Empty conditions = always match (e.g., CRM Protection rule)
    }

    const op = (triggerConditions.operator || 'AND').toUpperCase();

    const results = conditions.map((cond: any) => {
      const fieldValue = this.getRuleFieldValue(cond.field, entityData, senderEmail, senderDomain);
      if (fieldValue === undefined || fieldValue === null) return false;
      return this.evaluateRuleOperator(cond.operator, String(fieldValue).toLowerCase(), cond.value);
    });

    return op === 'OR' ? results.some(Boolean) : results.every(Boolean);
  }

  private getRuleFieldValue(
    field: string, entityData: EntityData, senderEmail: string, senderDomain: string
  ): any {
    switch (field) {
      case 'from': case 'senderEmail': return senderEmail;
      case 'fromDomain': case 'domain': return senderDomain;
      case 'subject': return entityData.subject || '';
      case 'body': case 'content': return entityData.body || entityData.content || '';
      case 'senderName': return entityData.senderName || '';
      default: return (entityData as any)[field];
    }
  }

  private evaluateRuleOperator(operator: string, fieldValue: string, target: any): boolean {
    const targets = Array.isArray(target) ? target : [target];
    const lowerTargets = targets.map((t: any) => String(t).toLowerCase());

    switch (operator) {
      case 'contains':
        return lowerTargets.some(t => fieldValue.includes(t));
      case 'equals':
        return lowerTargets.some(t => fieldValue === t);
      case 'startsWith':
        return lowerTargets.some(t => fieldValue.startsWith(t));
      case 'endsWith':
        return lowerTargets.some(t => fieldValue.endsWith(t));
      case 'regex':
        return lowerTargets.some(t => { try { return new RegExp(t, 'i').test(fieldValue); } catch { return false; } });
      case 'in':
        return lowerTargets.includes(fieldValue);
      case 'notIn':
        return !lowerTargets.includes(fieldValue);
      case 'exists':
        return fieldValue !== '';
      default:
        return false;
    }
  }

  // ===========================================================================
  // Stage 3: AI Classification
  // ===========================================================================

  private async classifyWithAI(
    organizationId: string,
    entityData: EntityData
  ): Promise<AIClassResult | undefined> {
    try {
      const aiRouter = new AIRouter({ organizationId, prisma: this.prisma });
      await aiRouter.initializeProviders();

      if (!aiRouter.hasAvailableProviders()) {
        logger.info('No AI providers available for classification, falling back to UNKNOWN');
        return undefined;
      }

      const emailContent = [
        entityData.from ? `From: ${entityData.from}` : '',
        entityData.subject ? `Subject: ${entityData.subject}` : '',
        entityData.headers?.['list-unsubscribe'] ? `Header List-Unsubscribe: present` : '',
        '',
        (entityData.body || entityData.content || '').substring(0, this.config.contentLimits.aiContentLimit),
      ].filter(Boolean).join('\n');

      const resolvedClass = await resolveModelForAction(organizationId, 'EMAIL_CLASSIFICATION');

      // Try loading prompt from ai_prompt_templates (unified prompt management)
      const categoriesText = PipelineConfigLoader.buildCategoriesText(this.config);
      const compiled = await PromptManager.compilePrompt('EMAIL_CLASSIFY', {
        variables: { categories: categoriesText, emailContent },
        organizationId,
      });

      // Fallback to pipeline config if template not found in DB
      const systemContent = compiled?.systemPrompt || PipelineConfigLoader.buildClassificationPrompt(this.config);
      const userContent = compiled?.userPrompt || `Classify this email:\n\n${emailContent}`;

      const request: AIRequest = {
        model: resolvedClass?.modelName ?? compiled?.model ?? this.config.aiParams.model,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent },
        ],
        config: { temperature: compiled?.temperature ?? this.config.aiParams.temperature, maxTokens: compiled?.maxTokens ?? this.config.aiParams.maxTokens },
      };

      const response = await aiRouter.processRequest(request);

      // Parse AI response
      const parsed = this.parseAIResponse(response.content);
      if (!parsed) return undefined;

      const validClasses = this.config.classifications.validClasses;
      const classification = validClasses.includes(parsed.classification)
        ? parsed.classification
        : 'UNKNOWN';

      return {
        classification,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        extraction: {
          summary: parsed.summary,
          extractedTasks: parsed.extractedTasks || [],
        },
      };
    } catch (error) {
      logger.warn('AI classification failed, falling back to UNKNOWN:', error);
      return undefined;
    }
  }

  private parseAIResponse(content: string): any {
    try {
      // Try direct JSON parse
      return JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[1].trim()); } catch { /* fall through */ }
      }
      // Try finding JSON object in text
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try { return JSON.parse(objMatch[0]); } catch { /* fall through */ }
      }
      return null;
    }
  }

  // ===========================================================================
  // Stage 4a: Post-classification AI Analysis (per-classification prompt)
  // ===========================================================================

  private async runPostClassificationPrompt(
    organizationId: string,
    entityData: EntityData,
    classification: string,
    ruleActions?: RuleMatchResult['actions']
  ): Promise<string | null> {
    try {
      const emailBody = (entityData.body || entityData.content || '').substring(0, this.config.contentLimits.aiContentLimit);
      const variables = {
        from: entityData.from || entityData.senderName || '',
        subject: entityData.subject || '',
        body: emailBody,
        classification,
      };

      // Prompt hierarchy:
      // 1) Inline prompt from rule (aiPrompt/aiSystemPrompt fields)
      // 2) Template specified by rule (templateId field)
      // 3) Default: EMAIL_POST_{classification}
      let compiled: { systemPrompt: string; userPrompt: string; model: string; temperature: number; maxTokens: number } | null = null;

      if (ruleActions?.aiSystemPrompt || ruleActions?.aiPrompt) {
        // Level 1: Inline prompt from rule fields
        compiled = {
          systemPrompt: ruleActions.aiSystemPrompt || 'You are an AI assistant analyzing emails.',
          userPrompt: (ruleActions.aiPrompt || 'Analyze this email:\n\n{{body}}')
            .replace(/\{\{body\}\}/g, emailBody)
            .replace(/\{\{from\}\}/g, variables.from)
            .replace(/\{\{subject\}\}/g, variables.subject)
            .replace(/\{\{classification\}\}/g, classification),
          model: this.config.aiParams.model,
          temperature: this.config.aiParams.temperature,
          maxTokens: this.config.aiParams.maxTokens,
        };
      } else if (ruleActions?.templateId) {
        // Level 2: Template specified in rule
        compiled = await PromptManager.compilePrompt(ruleActions.templateId, {
          variables,
          organizationId,
        });
      }

      if (!compiled) {
        // Level 3: Default EMAIL_POST_{classification}
        const code = `EMAIL_POST_${classification}`;
        compiled = await PromptManager.compilePrompt(code, {
          variables,
          organizationId,
        });
      }

      if (!compiled) {
        // No prompt at any level — no AI for this category
        return null;
      }

      const aiRouter = new AIRouter({ organizationId, prisma: this.prisma });
      await aiRouter.initializeProviders();
      if (!aiRouter.hasAvailableProviders()) return null;

      const resolvedModel = await resolveModelForAction(organizationId, 'EMAIL_CLASSIFICATION');
      const response = await aiRouter.processRequest({
        model: resolvedModel?.modelName ?? compiled.model,
        messages: [
          { role: 'system', content: compiled.systemPrompt },
          { role: 'user', content: compiled.userPrompt },
        ],
        config: { temperature: compiled.temperature, maxTokens: compiled.maxTokens },
      });

      return response.content || null;
    } catch (error) {
      logger.warn(`[PostClassification] Prompt for ${classification} failed:`, error);
      return null;
    }
  }

  // ===========================================================================
  // Stage 4b: Post-classification Actions
  // ===========================================================================

  private async addToRAG(
    organizationId: string,
    entityType: string,
    entityId: string,
    entityData: EntityData,
    classification: string
  ): Promise<boolean> {
    try {
      const content = [
        entityData.subject ? `Subject: ${entityData.subject}` : '',
        entityData.from ? `From: ${entityData.from}` : '',
        `Classification: ${classification}`,
        '',
        entityData.body || entityData.content || '',
      ].filter(Boolean).join('\n');

      if (content.length < this.config.contentLimits.minContentLength) return false;

      const contentHash = crypto.createHash('sha256').update(content).digest('hex');
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO vector_documents (id, title, content, "contentHash", embedding, "entityType", "entityId", source, language, "lastUpdated", "organizationId")
        VALUES ($1, $2, $3, $4, '{}', $5, $6, $7, 'pl', NOW(), $8)
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          "contentHash" = EXCLUDED."contentHash",
          "lastUpdated" = NOW()
      `,
        `rag-${entityType}-${entityId}`,
        entityData.subject || `${entityType} ${entityId}`,
        content.substring(0, this.config.contentLimits.ragContentLimit),
        contentHash,
        entityType,
        entityId,
        entityData.from || 'email-pipeline',
        organizationId
      );
      return true;
    } catch (error) {
      logger.warn(`Failed to add ${entityType}:${entityId} to RAG:`, error);
      return false;
    }
  }

  private async addToFlow(
    organizationId: string,
    entityType: string,
    entityId: string,
    entityData: EntityData
  ): Promise<string | null> {
    try {
      // Find default user (first admin) for inbox item
      const adminUser = await this.prisma.user.findFirst({
        where: { organizationId, role: { in: ['OWNER', 'ADMIN'] } },
        select: { id: true },
      });
      if (!adminUser) return null;

      const content = entityData.subject
        ? `[${entityData.from || 'Unknown'}] ${entityData.subject}`
        : entityData.body?.substring(0, this.config.contentLimits.flowPreviewLimit) || 'Processed email';

      const inboxItem = await this.prisma.inboxItem.create({
        data: {
          content,
          rawContent: entityData.body || entityData.content || '',
          sourceType: 'EMAIL',
          source: entityData.from || 'email-pipeline',
          elementType: 'EMAIL',
          flowStatus: 'PENDING',
          organizationId,
          capturedById: adminUser.id,
        },
      });

      return inboxItem.id;
    } catch (error) {
      logger.warn(`Failed to add ${entityType}:${entityId} to Flow:`, error);
      return null;
    }
  }

  private async suggestBlacklist(
    organizationId: string,
    domain: string,
    email: string,
    confidence: number,
    entityData?: EntityData
  ): Promise<void> {
    try {
      // Check if suggestion already exists
      const existing = await this.prisma.ai_suggestions.findFirst({
        where: {
          organization_id: organizationId,
          context: 'BLACKLIST_DOMAIN',
          status: 'PENDING',
          suggestion: { path: ['domain'], equals: domain },
        },
      });
      if (existing) return;

      // Find admin user for suggestion
      const adminUser = await this.prisma.user.findFirst({
        where: { organizationId, role: { in: ['OWNER', 'ADMIN'] } },
        select: { id: true },
      });
      if (!adminUser) return;

      // Build reasoning from actual email content
      const subject = entityData?.subject || '';
      const fromName = entityData?.fromName || entityData?.from || email;
      const bodySnippet = (entityData?.body || entityData?.content || '').substring(0, 500);
      const confidencePct = Math.round(confidence * 100);

      const reasoningParts: string[] = [];
      reasoningParts.push(`Od: ${fromName}`);
      if (subject) reasoningParts.push(`Temat: ${subject}`);
      reasoningParts.push(`Klasyfikacja AI: NEWSLETTER (${confidencePct}%)`);

      // Detect newsletter signals for reasoning
      const signals: string[] = [];
      const lowerSubject = subject.toLowerCase();
      const lowerBody = bodySnippet.toLowerCase();
      if (lowerSubject.includes('newsletter') || lowerBody.includes('newsletter')) signals.push('slowo "newsletter" w tresci');
      if (lowerSubject.includes('unsubscribe') || lowerBody.includes('unsubscribe') || lowerBody.includes('wypisz')) signals.push('link do wypisania');
      if (entityData?.headers?.['list-unsubscribe']) signals.push('naglowek List-Unsubscribe');
      if (lowerBody.includes('weekly') || lowerBody.includes('monthly') || lowerBody.includes('digest')) signals.push('periodyczna wysylka');
      if (email.startsWith('newsletter@') || email.startsWith('noreply@') || email.startsWith('no-reply@') || email.startsWith('info@') || email.startsWith('marketing@') || email.startsWith('notifications@')) signals.push(`adres nadawcy: ${email}`);
      if (signals.length > 0) reasoningParts.push(`Sygnaly: ${signals.join(', ')}`);

      await this.prisma.ai_suggestions.create({
        data: {
          id: `sug-bl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          user_id: adminUser.id,
          organization_id: organizationId,
          context: 'BLACKLIST_DOMAIN',
          input_data: {
            domain,
            email,
            source: 'classification-pipeline',
            subject,
            fromName,
            bodySnippet,
          },
          suggestion: {
            title: subject ? `${domain}: "${subject}"` : `Dodaj ${domain} do blacklisty`,
            description: subject
              ? `Od: ${fromName}\nTemat: ${subject}\n\nAI klasyfikuje jako newsletter (${confidencePct}%).`
              : `Domena ${domain} (${email}) wykryta jako newsletter.`,
            domain,
            classification: 'NEWSLETTER',
            reason: signals.length > 0 ? `Sygnaly: ${signals.join(', ')}` : 'Automatyczna detekcja newslettera',
          },
          confidence: confidencePct,
          reasoning: reasoningParts.join('\n'),
          status: 'PENDING',
        },
      });

      logger.info(`Blacklist suggestion created for domain: ${domain}`);
    } catch (error) {
      logger.warn(`Failed to create blacklist suggestion for ${domain}:`, error);
    }
  }

  private async autoBlacklist(
    organizationId: string,
    domain: string,
    email: string,
    confidence: number
  ): Promise<void> {
    try {
      // Check if already blacklisted
      const exists = await this.prisma.email_domain_rules.findFirst({
        where: {
          organizationId,
          pattern: domain.toLowerCase(),
          listType: 'BLACKLIST',
        },
      });
      if (exists) return;

      await this.prisma.email_domain_rules.create({
        data: {
          pattern: domain.toLowerCase(),
          patternType: 'DOMAIN',
          listType: 'BLACKLIST',
          classification: 'SPAM',
          source: 'AUTO_PIPELINE',
          reason: `Auto-blacklisted: SPAM classification with ${Math.round(confidence * 100)}% confidence`,
          confidence,
          organizationId,
          status: 'ACTIVE',
        },
      });

      logger.info(`Auto-blacklisted domain: ${domain} (confidence: ${Math.round(confidence * 100)}%)`);
    } catch (error) {
      logger.warn(`Failed to auto-blacklist ${domain}:`, error);
    }
  }

  private async linkToEntities(
    organizationId: string,
    senderEmail: string,
    senderDomain: string
  ): Promise<{ contactId?: string; companyId?: string }> {
    const result: { contactId?: string; companyId?: string } = {};

    try {
      // Try to find contact
      if (senderEmail) {
        const contact = await this.prisma.contact.findFirst({
          where: { organizationId, email: { equals: senderEmail, mode: 'insensitive' } },
          select: { id: true },
        });
        if (contact) result.contactId = contact.id;
      }

      // Try to find company by domain
      if (senderDomain && !this.freeEmailDomains.has(senderDomain)) {
        const company = await this.prisma.company.findFirst({
          where: { organizationId, domain: { equals: senderDomain, mode: 'insensitive' } },
          select: { id: true },
        });
        if (company) result.companyId = company.id;
      }
    } catch (error) {
      logger.warn('Failed to link entities:', error);
    }

    return result;
  }

  private extractTasksFromContent(entityData: EntityData): ExtractedTask[] {
    const text = entityData.body || entityData.content || '';
    if (!text || text.length < this.config.contentLimits.minContentLength) return [];

    const tasks: ExtractedTask[] = [];
    const lines = text.split(/[.\n]/).filter(l => l.trim().length > 10);

    const actionPatterns = this.config.taskExtraction.patterns.map(
      p => new RegExp(p.pattern, p.flags)
    );

    const urgencyRegex = new RegExp(
      this.config.taskExtraction.urgencyPatterns.join('|'), 'i'
    );

    for (const line of lines) {
      for (const pattern of actionPatterns) {
        const match = line.match(pattern);
        if (match) {
          const title = match[1].trim().replace(/[,;]$/, '');
          if (title.length >= this.config.taskExtraction.minTitleLength && !tasks.some(t => t.title === title)) {
            const isUrgent = urgencyRegex.test(line);
            tasks.push({
              title,
              priority: isUrgent ? 'HIGH' : 'MEDIUM',
              dueIndicator: isUrgent ? 'today' : undefined,
            });
          }
          break;
        }
      }
      if (tasks.length >= this.config.taskExtraction.maxTasks) break;
    }

    return tasks;
  }

  // ===========================================================================
  // Audit Trail
  // ===========================================================================

  private async logExecution(
    organizationId: string,
    entityType: string,
    entityId: string,
    result: {
      finalClass: string;
      finalConfidence: number;
      stages: any;
      actionsExecuted: string[];
      executionTime: number;
    }
  ): Promise<void> {
    try {
      await this.prisma.ai_executions.create({
        data: {
          id: `exec-pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          inputData: { entityType, entityId },
          promptSent: `Pipeline: ${entityType}/${entityId}`,
          responseReceived: `${result.finalClass} (${result.finalConfidence})`,
          parsedOutput: result as any,
          status: 'SUCCESS',
          executionTime: result.executionTime,
          actionsExecuted: result.actionsExecuted as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          organizations: { connect: { id: organizationId } },
        },
      });
    } catch (error) {
      // Don't fail pipeline for audit log errors
      logger.warn('Failed to log pipeline execution:', error);
    }
  }

  // ===========================================================================
  // Correction & Learning
  // ===========================================================================

  /**
   * Apply user correction to a classification and learn from it.
   * Creates/updates patterns and adjusts confidence.
   */
  async applyCorrection(
    organizationId: string,
    entityType: string,
    entityId: string,
    correctClass: string,
    userId: string
  ): Promise<{ updated: boolean; patternCreated: boolean }> {
    let patternCreated = false;

    // Get the original processing record
    const record = await this.prisma.data_processing.findFirst({
      where: { organizationId, entityType, entityId },
    });

    if (!record) {
      return { updated: false, patternCreated: false };
    }

    const oldClass = record.finalClass;

    // Update the processing record
    await this.prisma.data_processing.update({
      where: { id: record.id },
      data: {
        finalClass: correctClass,
        finalConfidence: 1.0,
        aiExtraction: {
          ...(record.aiExtraction as any || {}),
          correctedFrom: oldClass,
          correctedBy: userId,
          correctedAt: new Date().toISOString(),
        },
      },
    });

    // Learn: if sender domain is known, create/update a pattern or domain rule
    const entityData = record.crmMatch as any;
    // Try to extract domain from the stored inputData
    const inputData = record.listMatch as any;

    // Create email pattern for learning if there's enough info
    if (correctClass === 'SPAM' || correctClass === 'NEWSLETTER') {
      // Check if we can learn a domain pattern
      try {
        const recentSimilar = await this.prisma.data_processing.count({
          where: {
            organizationId,
            finalClass: oldClass,
            aiClassification: oldClass,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        });

        // If user corrects and there are multiple similar misclassifications, create pattern
        if (recentSimilar >= 2) {
          logger.info(`Learning: multiple corrections from ${oldClass} to ${correctClass}, consider domain rule`);
        }
      } catch {
        // Non-critical, ignore
      }
    }

    // Log the correction
    await this.prisma.ai_executions.create({
      data: {
        id: `exec-correction-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        inputData: { entityType, entityId, oldClass, newClass: correctClass },
        promptSent: `Correction: ${oldClass} -> ${correctClass}`,
        responseReceived: correctClass,
        parsedOutput: { type: 'USER_CORRECTION', oldClass, newClass: correctClass, userId },
        status: 'SUCCESS',
        executionTime: 0,
        actionsExecuted: ['USER_CORRECTION'],
        createdAt: new Date(),
        updatedAt: new Date(),
        organizations: { connect: { id: organizationId } },
      },
    }).catch(() => {});

    return { updated: true, patternCreated };
  }

  // ===========================================================================
  // Stage 4b: Auto-create CRM entities from post-classification analysis
  // ===========================================================================

  private async createEntitiesFromAnalysis(
    organizationId: string,
    entityId: string,
    classification: string,
    analysisJson: string,
    entityData: EntityData,
    linkedEntities: { contactId?: string; companyId?: string; dealId?: string },
    actionsExecuted: string[]
  ): Promise<void> {
    const parsed = this.parseAIResponse(analysisJson);
    if (!parsed) {
      logger.warn(`[EntityCreation] Failed to parse analysis JSON for ${entityId}`);
      return;
    }

    // Get admin user for createdById
    const adminUser = await this.prisma.user.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    if (!adminUser) return;

    const senderEmail = entityData.from || '';
    const senderDomain = entityData.senderDomain || this.extractDomain(senderEmail);
    const dedup24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // === 1. COMPANY ===
      const isFreeEmail = !senderDomain || this.freeEmailDomains.has(senderDomain);
      const aiCompanyName = parsed.leads?.[0]?.company || parsed.contacts?.[0]?.company || null;

      if (!linkedEntities.companyId) {
        // Try matching by domain first (non-free domains)
        if (!isFreeEmail) {
          const existingCompany = await this.prisma.company.findFirst({
            where: {
              organizationId,
              OR: [
                { domain: { equals: senderDomain, mode: 'insensitive' as const } },
                { website: { contains: senderDomain, mode: 'insensitive' as const } },
              ],
            },
          });
          if (existingCompany) linkedEntities.companyId = existingCompany.id;
        }

        // Try matching by AI-extracted company name (also for free domains)
        if (!linkedEntities.companyId && aiCompanyName) {
          const existingByName = await this.prisma.company.findFirst({
            where: {
              organizationId,
              name: { equals: aiCompanyName, mode: 'insensitive' as const },
            },
          });
          if (existingByName) linkedEntities.companyId = existingByName.id;
        }

        // Create new company if still no match
        if (!linkedEntities.companyId && (!isFreeEmail || aiCompanyName)) {
          const companyName = aiCompanyName
            || senderDomain.split('.')[0].charAt(0).toUpperCase() + senderDomain.split('.')[0].slice(1);

          // Try to extract NIP from analysis
          let nip: string | null = null;
          const allText = JSON.stringify(parsed);
          const nipMatch = allText.match(/\b(\d{10})\b/);
          if (nipMatch) nip = nipMatch[1];

          const newCompany = await this.prisma.company.create({
            data: {
              name: companyName,
              domain: isFreeEmail ? undefined : senderDomain,
              website: isFreeEmail ? undefined : `https://${senderDomain}`,
              email: senderEmail || undefined,
              nip,
              status: 'PROSPECT',
              tags: ['auto-created', 'from-email-analysis'],
              organizationId,
            },
          });
          linkedEntities.companyId = newCompany.id;
          actionsExecuted.push(`CREATED_COMPANY:${newCompany.id}`);
        }
      }

      // === 2. CONTACT ===
      if (!linkedEntities.contactId && senderEmail) {
        const existingContact = await this.prisma.contact.findFirst({
          where: { organizationId, email: { equals: senderEmail, mode: 'insensitive' as const } },
        });

        if (existingContact) {
          linkedEntities.contactId = existingContact.id;
          // Update existing contact with companyId if missing
          if (linkedEntities.companyId && !existingContact.companyId) {
            await this.prisma.contact.update({
              where: { id: existingContact.id },
              data: { companyId: linkedEntities.companyId },
            });
          }
        } else {
          const leadData = parsed.leads?.[0];
          const contactData = parsed.contacts?.[0];
          const senderName = entityData.senderName || entityData.fromName || leadData?.name || '';
          const nameParts = senderName.split(' ');

          const newContact = await this.prisma.contact.create({
            data: {
              firstName: contactData?.firstName || nameParts[0] || senderEmail.split('@')[0],
              lastName: contactData?.lastName || nameParts.slice(1).join(' ') || '',
              email: senderEmail,
              phone: contactData?.phone || undefined,
              company: leadData?.company || contactData?.company || undefined,
              position: contactData?.position || undefined,
              source: 'Email',
              status: classification === 'BUSINESS' ? 'LEAD' : 'ACTIVE',
              companyId: linkedEntities.companyId || undefined,
              tags: ['auto-created', 'from-email-analysis'],
              organizationId,
            },
          });
          linkedEntities.contactId = newContact.id;
          actionsExecuted.push(`CREATED_CONTACT:${newContact.id}`);
        }
      }

      // === 3. LEADS ===
      if (parsed.leads && Array.isArray(parsed.leads)) {
        for (const lead of parsed.leads) {
          if (!lead.name && !lead.email) continue;
          const leadTitle = lead.name || `Lead from ${senderEmail}`;

          const existing = await this.prisma.lead.findFirst({
            where: { organizationId, title: leadTitle, createdAt: { gte: dedup24h } },
          });
          if (existing) continue;

          const newLead = await this.prisma.lead.create({
            data: {
              title: leadTitle,
              description: lead.notes || `From email: ${entityData.subject || ''}`,
              company: lead.company || undefined,
              contactPerson: lead.email || senderEmail || undefined,
              status: 'NEW',
              priority: 'MEDIUM',
              source: lead.source || 'Email',
              organizationId,
            },
          });
          actionsExecuted.push(`CREATED_LEAD:${newLead.id}`);
        }
      }

      // === 4. DEALS ===
      if (parsed.deals && Array.isArray(parsed.deals) && linkedEntities.companyId) {
        for (const deal of parsed.deals) {
          if (!deal.title) continue;

          const existing = await this.prisma.deal.findFirst({
            where: { organizationId, title: deal.title, createdAt: { gte: dedup24h } },
          });
          if (existing) {
            linkedEntities.dealId = existing.id;
            continue;
          }

          const stageMap: Record<string, string> = {
            prospect: 'PROSPECT', qualified: 'QUALIFIED', proposal: 'PROPOSAL',
            negotiation: 'NEGOTIATION', closed_won: 'CLOSED_WON', closed_lost: 'CLOSED_LOST',
          };
          const stage = stageMap[(deal.stage || '').toLowerCase()] || 'PROSPECT';

          const newDeal = await this.prisma.deal.create({
            data: {
              title: deal.title,
              description: `Auto-created from email: ${entityData.subject || ''}\nFrom: ${senderEmail}`,
              value: deal.value || 0,
              stage: stage as any,
              source: 'Email',
              companyId: linkedEntities.companyId,
              ownerId: adminUser.id,
              organizationId,
            },
          });
          linkedEntities.dealId = newDeal.id;
          actionsExecuted.push(`CREATED_DEAL:${newDeal.id}`);
        }
      }

      // === 5. TASKS ===
      const allTasks = [
        ...(parsed.tasks || []),
        ...(parsed.requiredActions?.map((a: string) => ({ title: a, priority: 'MEDIUM' })) || []),
        ...(parsed.actionItems?.map((a: string) => ({ title: a, priority: 'LOW' })) || []),
      ];

      for (const task of allTasks.slice(0, 5)) {
        if (!task.title || task.title.length < 5) continue;

        const existing = await this.prisma.task.findFirst({
          where: { organizationId, title: task.title, createdAt: { gte: dedup24h } },
        });
        if (existing) continue;

        const priorityMap: Record<string, string> = {
          low: 'LOW', medium: 'MEDIUM', high: 'HIGH', urgent: 'URGENT',
        };
        const priority = priorityMap[(task.priority || '').toLowerCase()] || 'MEDIUM';

        let dueDate: Date | undefined;
        if (task.deadline) {
          const d = new Date(task.deadline);
          if (!isNaN(d.getTime())) dueDate = d;
        }

        const newTask = await this.prisma.task.create({
          data: {
            title: task.title,
            description: `Auto-created from email: ${entityData.subject || ''}\nFrom: ${senderEmail}`,
            priority: priority as any,
            status: 'NEW',
            dueDate,
            organizationId,
            createdById: adminUser.id,
            contactId: linkedEntities.contactId || undefined,
            companyId: linkedEntities.companyId || undefined,
            dealId: linkedEntities.dealId || undefined,
          },
        });
        actionsExecuted.push(`CREATED_TASK:${newTask.id}`);
      }

      const createdCount = actionsExecuted.filter((a: string) => a.startsWith('CREATED_')).length;
      if (createdCount > 0) {
        logger.info(`[EntityCreation] Created ${createdCount} entities for email ${entityId}`);
      }
    } catch (error) {
      logger.warn(`[EntityCreation] Error creating entities for ${entityId}:`, error);
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1].toLowerCase() : '';
  }

  private wildcardToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regexStr = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regexStr}$`, 'i');
  }

  private getFieldForPattern(entityData: EntityData, patternType: string): string | null {
    switch (patternType) {
      case 'SUBJECT': return entityData.subject || null;
      case 'BODY': return entityData.body || entityData.content || null;
      case 'SENDER': return entityData.from || null;
      case 'HEADER': {
        if (!entityData.headers) return null;
        return Object.entries(entityData.headers).map(([k, v]) => `${k}: ${v}`).join('\n');
      }
      default: return null;
    }
  }
}
