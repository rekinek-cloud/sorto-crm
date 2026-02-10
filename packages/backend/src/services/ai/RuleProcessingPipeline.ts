import { PrismaClient } from '@prisma/client';
import { FlowRAGService } from './FlowRAGService';
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
}

// Free email domains — skip for company matching
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'yahoo.pl', 'wp.pl', 'o2.pl', 'onet.pl', 'interia.pl',
  'op.pl', 'poczta.fm', 'gazeta.pl', 'tlen.pl', 'icloud.com', 'me.com',
  'protonmail.com', 'proton.me', 'aol.com', 'mail.com', 'zoho.com',
]);

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
        // Stage 3: AI Classification (only for UNKNOWN)
        finalClass = 'UNKNOWN';
        finalConfidence = 0;
        // AI classification will be triggered separately via the test/process endpoint
        // This keeps the pipeline fast and avoids blocking on AI calls
      }

      const actionsExecuted: string[] = [];

      // Update processing record
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
          status: 'COMPLETED',
          completedAt: new Date(),
        },
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
      // Increment match count
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
    // Get active patterns (system + org-specific)
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
        // Increment match count
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
