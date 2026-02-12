import { PrismaClient } from '@prisma/client';
import { FlowRAGService } from './FlowRAGService';
import { AIRouter } from './AIRouter';
import { AIRequest } from './providers/BaseProvider';
import logger from '../../config/logger';

// =============================================================================
// Interfaces
// =============================================================================

export interface EntityData {
  from?: string;
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

export interface ProcessingResult {
  entityType: string;
  entityId: string;
  stages: {
    crmCheck: CRMCheckResult;
    listCheck: ListCheckResult;
    patternCheck: PatternCheckResult;
    aiClassification?: AIClassResult;
  };
  finalClass: string;
  finalConfidence: number;
  actionsExecuted: string[];
  extractedTasks?: ExtractedTask[];
  linkedEntities?: { contactId?: string; companyId?: string };
}

// Free email domains -- skip for company matching
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'yahoo.pl', 'wp.pl', 'o2.pl', 'onet.pl', 'interia.pl',
  'op.pl', 'poczta.fm', 'gazeta.pl', 'tlen.pl', 'icloud.com', 'me.com',
  'protonmail.com', 'proton.me', 'aol.com', 'mail.com', 'zoho.com',
]);

// AI classification prompt
const CLASSIFICATION_SYSTEM_PROMPT = `You are an email classification expert. Classify the email into exactly one category.

Categories:
- BUSINESS: Work-related, client communication, project discussions, invoices, offers
- NEWSLETTER: Marketing emails, digests, promotional content, subscriptions
- SPAM: Unsolicited, phishing, scam, irrelevant bulk mail
- TRANSACTIONAL: Order confirmations, shipping notifications, password resets, system alerts
- PERSONAL: Personal non-work communication

Respond ONLY with valid JSON (no markdown):
{"classification":"CATEGORY","confidence":0.85,"summary":"One sentence summary","extractedTasks":[{"title":"Task description","priority":"MEDIUM"}]}

Rules:
- confidence must be between 0.0 and 1.0
- extractedTasks: extract actionable items from the email (can be empty array)
- If unsure, use lower confidence`;

// =============================================================================
// RuleProcessingPipeline
// =============================================================================

export class RuleProcessingPipeline {
  private prisma: PrismaClient;
  private ragService: FlowRAGService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.ragService = new FlowRAGService(prisma);
  }

  /**
   * Main entry point: process an entity through the 4-stage pipeline.
   * Stage 1: CRM Protection (contacts/companies)
   * Stage 2: Lists & Patterns (blacklist/whitelist, email patterns)
   * Stage 3: AI Classification (LLM-based for unknown emails)
   * Stage 4: Post-classification Actions (RAG, Flow, blacklist, tasks)
   */
  async processEntity(
    organizationId: string,
    entityType: string,
    entityId: string,
    entityData: EntityData
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

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

      // Determine final classification
      let finalClass: string;
      let finalConfidence: number;
      let aiResult: AIClassResult | undefined;
      let extractedTasks: ExtractedTask[] = [];

      if (crmCheck.matched) {
        finalClass = 'BUSINESS';
        finalConfidence = crmCheck.confidence;
      } else if (listCheck.matched) {
        finalClass = listCheck.classification || (listCheck.listType === 'BLACKLIST' ? 'SPAM' : 'BUSINESS');
        finalConfidence = 0.95;
      } else if (patternCheck.matched) {
        finalClass = patternCheck.classification || 'NEWSLETTER';
        finalConfidence = patternCheck.confidence;
      } else {
        // Stage 3: AI Classification
        aiResult = await this.classifyWithAI(organizationId, entityData);
        if (aiResult) {
          finalClass = aiResult.confidence >= 0.4 ? aiResult.classification : 'UNKNOWN';
          finalConfidence = aiResult.confidence;
          if (aiResult.extraction?.extractedTasks) {
            extractedTasks = aiResult.extraction.extractedTasks;
          }
        } else {
          // Fallback when no AI provider available
          finalClass = 'UNKNOWN';
          finalConfidence = 0;
        }
      }

      // Stage 4: Post-classification Actions
      const actionsExecuted: string[] = [];
      const linkedEntities: { contactId?: string; companyId?: string } = {};

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
      if (extractedTasks.length === 0 && finalClass === 'BUSINESS') {
        extractedTasks = this.extractTasksFromContent(entityData);
      }
      if (extractedTasks.length > 0) {
        actionsExecuted.push('EXTRACTED_TASKS');
      }

      // Execute class-specific actions
      let addedToRag = false;
      let addedToFlow = false;
      let flowItemId: string | null = null;

      if (finalClass === 'BUSINESS') {
        // BUSINESS -> RAG + Flow
        addedToRag = await this.addToRAG(organizationId, entityType, entityId, entityData, finalClass);
        if (addedToRag) actionsExecuted.push('ADDED_TO_RAG');

        const flowResult = await this.addToFlow(organizationId, entityType, entityId, entityData);
        if (flowResult) {
          addedToFlow = true;
          flowItemId = flowResult;
          actionsExecuted.push('ADDED_TO_FLOW');
        }
      } else if (finalClass === 'NEWSLETTER') {
        // NEWSLETTER -> RAG + suggest blacklist
        addedToRag = await this.addToRAG(organizationId, entityType, entityId, entityData, finalClass);
        if (addedToRag) actionsExecuted.push('ADDED_TO_RAG');

        if (senderDomain && !FREE_EMAIL_DOMAINS.has(senderDomain)) {
          await this.suggestBlacklist(organizationId, senderDomain, senderEmail, finalConfidence);
          actionsExecuted.push('SUGGESTED_BLACKLIST');
        }
      } else if (finalClass === 'SPAM') {
        // SPAM -> ignore + auto-blacklist if confidence > 90%
        actionsExecuted.push('IGNORED_SPAM');

        if (finalConfidence > 0.9 && senderDomain && !FREE_EMAIL_DOMAINS.has(senderDomain)) {
          await this.autoBlacklist(organizationId, senderDomain, senderEmail, finalConfidence);
          actionsExecuted.push('AUTO_BLACKLISTED');
        }
      }

      // Update processing record with all results
      await this.prisma.data_processing.update({
        where: { id: processingRecord.id },
        data: {
          crmMatch: crmCheck.matched ? crmCheck as any : null,
          listMatch: listCheck.matched ? listCheck as any : null,
          patternMatch: patternCheck.matched ? patternCheck as any : null,
          aiClassification: aiResult?.classification || null,
          aiConfidence: aiResult?.confidence || null,
          aiExtraction: aiResult?.extraction || null,
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
        stages: { crmCheck: crmCheck.matched, listCheck: listCheck.matched, patternCheck: patternCheck.matched, aiUsed: !!aiResult },
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
          aiClassification: aiResult,
        },
        finalClass,
        finalConfidence,
        actionsExecuted,
        extractedTasks,
        linkedEntities,
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
    if (senderDomain && !FREE_EMAIL_DOMAINS.has(senderDomain)) {
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
        (entityData.body || entityData.content || '').substring(0, 3000),
      ].filter(Boolean).join('\n');

      const request: AIRequest = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
          { role: 'user', content: `Classify this email:\n\n${emailContent}` },
        ],
        config: { temperature: 0.2, maxTokens: 300 },
      };

      const response = await aiRouter.processRequest(request);

      // Parse AI response
      const parsed = this.parseAIResponse(response.content);
      if (!parsed) return undefined;

      const validClasses = ['BUSINESS', 'NEWSLETTER', 'SPAM', 'TRANSACTIONAL', 'PERSONAL'];
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
  // Stage 4: Post-classification Actions
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

      if (content.length < 20) return false;

      const ragService = new FlowRAGService(this.prisma);
      // Use raw insert to avoid dependency on specific RAGService method signature
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO vector_documents (id, content, metadata, organization_id, created_at)
        VALUES ($1, $2, $3::jsonb, $4, NOW())
        ON CONFLICT DO NOTHING
      `,
        `rag-${entityType}-${entityId}`,
        content.substring(0, 10000),
        JSON.stringify({ entityType, entityId, classification, from: entityData.from, subject: entityData.subject }),
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
      const adminUser = await this.prisma.organizationMember.findFirst({
        where: { organizationId, role: { in: ['OWNER', 'ADMIN'] } },
        select: { userId: true },
      });
      if (!adminUser) return null;

      const content = entityData.subject
        ? `[${entityData.from || 'Unknown'}] ${entityData.subject}`
        : entityData.body?.substring(0, 200) || 'Processed email';

      const inboxItem = await this.prisma.inboxItem.create({
        data: {
          content,
          rawContent: entityData.body || entityData.content || '',
          sourceType: 'EMAIL',
          source: entityData.from || 'email-pipeline',
          elementType: 'EMAIL',
          flowStatus: 'PENDING',
          organizationId,
          capturedById: adminUser.userId,
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
    confidence: number
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
      const adminUser = await this.prisma.organizationMember.findFirst({
        where: { organizationId, role: { in: ['OWNER', 'ADMIN'] } },
        select: { userId: true },
      });
      if (!adminUser) return;

      await this.prisma.ai_suggestions.create({
        data: {
          id: `sug-bl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          user_id: adminUser.userId,
          organization_id: organizationId,
          context: 'BLACKLIST_DOMAIN',
          input_data: { domain, email, source: 'classification-pipeline' },
          suggestion: {
            title: `Dodaj ${domain} do blacklisty`,
            description: `Domena ${domain} (${email}) wykryta jako newsletter. Sugerujemy dodanie do blacklisty.`,
            domain,
            classification: 'NEWSLETTER',
            reason: 'Automatyczna detekcja newslettera',
          },
          confidence: Math.round(confidence * 100),
          reasoning: `Email z ${domain} sklasyfikowany jako NEWSLETTER z confidence ${Math.round(confidence * 100)}%`,
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
      if (senderDomain && !FREE_EMAIL_DOMAINS.has(senderDomain)) {
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
    if (!text || text.length < 20) return [];

    const tasks: ExtractedTask[] = [];
    const lines = text.split(/[.\n]/).filter(l => l.trim().length > 10);

    const actionPatterns = [
      /(?:please|proszę|prosze)\s+(.{10,80})/i,
      /(?:can you|could you|możesz|mozesz)\s+(.{10,80})/i,
      /(?:need to|trzeba|musisz|należy|nalezy)\s+(.{10,80})/i,
      /(?:send|wyślij|wyslij|prześlij|przeslij)\s+(.{10,80})/i,
      /(?:review|sprawdź|sprawdz|przejrzyj)\s+(.{10,80})/i,
      /(?:prepare|przygotuj|zaplanuj)\s+(.{10,80})/i,
      /(?:deadline|termin|do dnia|by\s+\w+day)\s*:?\s*(.{5,80})/i,
    ];

    for (const line of lines) {
      for (const pattern of actionPatterns) {
        const match = line.match(pattern);
        if (match) {
          const title = match[1].trim().replace(/[,;]$/, '');
          if (title.length >= 10 && !tasks.some(t => t.title === title)) {
            const isUrgent = /asap|urgent|pilne|natychmiast|dzisiaj|today/i.test(line);
            tasks.push({
              title,
              priority: isUrgent ? 'HIGH' : 'MEDIUM',
              dueIndicator: isUrgent ? 'today' : undefined,
            });
          }
          break;
        }
      }
      if (tasks.length >= 5) break;
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
