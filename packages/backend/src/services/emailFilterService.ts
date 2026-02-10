import { EmailCategory, EmailRule } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';

export interface FilterResult {
  category: EmailCategory;
  skipAIAnalysis: boolean;
  autoArchive: boolean;
  autoDelete: boolean;
  createTask: boolean;
  matchedRule?: EmailRule;
  shouldProcessWithAI: boolean;
  estimatedCostReduction: number; // Percentage of cost saved
}

export interface EmailMessageData {
  senderEmail: string;
  senderDomain: string;
  subject: string;
  content: string;
  organizationId: string;
}

class EmailFilterService {
  /**
   * Main email filtering function
   * Analyzes email and determines processing strategy
   */
  async filterEmail(messageData: EmailMessageData): Promise<FilterResult> {
    try {
      // 1. Check existing contact category
      const existingContact = await this.getContactByEmail(messageData.senderEmail, messageData.organizationId);
      
      if (existingContact && existingContact.emailCategory !== 'UNKNOWN') {
        logger.info(`Email from known contact: ${messageData.senderEmail}, category: ${existingContact.emailCategory}`);
        return this.buildResultFromCategory(existingContact.emailCategory);
      }

      // 2. Apply email rules
      const matchedRule = await this.findMatchingRule(messageData);
      
      if (matchedRule) {
        logger.info(`Email matched rule: ${matchedRule.name} for ${messageData.senderEmail}`);
        
        // Update rule statistics
        await this.updateRuleStats(matchedRule.id);
        
        // Update contact category if exists
        if (existingContact) {
          await this.updateContactCategory(existingContact.id, matchedRule.assignCategory);
        }
        
        return {
          category: matchedRule.assignCategory,
          skipAIAnalysis: matchedRule.skipAIAnalysis,
          autoArchive: matchedRule.autoArchive,
          autoDelete: matchedRule.autoDelete,
          createTask: matchedRule.createTask,
          matchedRule,
          shouldProcessWithAI: !matchedRule.skipAIAnalysis,
          estimatedCostReduction: this.calculateCostReduction(matchedRule.assignCategory)
        };
      }

      // 3. Default behavior for unknown emails
      logger.info(`Unknown email from: ${messageData.senderEmail}, using default UNKNOWN category`);
      
      return {
        category: 'UNKNOWN',
        skipAIAnalysis: false, // Process unknown emails with AI
        autoArchive: false,
        autoDelete: false,
        createTask: false,
        shouldProcessWithAI: true,
        estimatedCostReduction: 0
      };

    } catch (error) {
      logger.error('Email filtering error:', error);
      
      // Safe fallback - process with AI
      return {
        category: 'UNKNOWN',
        skipAIAnalysis: false,
        autoArchive: false,
        autoDelete: false,
        createTask: false,
        shouldProcessWithAI: true,
        estimatedCostReduction: 0
      };
    }
  }

  /**
   * Create email filtering rule
   */
  async createEmailRule(ruleData: {
    name: string;
    description?: string;
    senderEmail?: string;
    senderDomain?: string;
    subjectContains?: string;
    subjectPattern?: string;
    bodyContains?: string;
    assignCategory: EmailCategory;
    skipAIAnalysis?: boolean;
    autoArchive?: boolean;
    autoDelete?: boolean;
    createTask?: boolean;
    priority?: number;
    organizationId: string;
  }): Promise<EmailRule> {
    return await prisma.emailRule.create({
      data: {
        name: ruleData.name,
        description: ruleData.description,
        senderEmail: ruleData.senderEmail,
        senderDomain: ruleData.senderDomain,
        subjectContains: ruleData.subjectContains,
        subjectPattern: ruleData.subjectPattern,
        bodyContains: ruleData.bodyContains,
        assignCategory: ruleData.assignCategory,
        skipAIAnalysis: ruleData.skipAIAnalysis || false,
        autoArchive: ruleData.autoArchive || false,
        autoDelete: ruleData.autoDelete || false,
        createTask: ruleData.createTask || false,
        priority: ruleData.priority || 0,
        organizationId: ruleData.organizationId
      }
    });
  }

  /**
   * Get filtering statistics
   */
  async getFilteringStats(organizationId: string): Promise<{
    totalEmailsProcessed: number;
    aiAnalysisSkipped: number;
    costReductionPercentage: number;
    categoryBreakdown: Record<EmailCategory, number>;
    topRules: Array<{ rule: EmailRule; matchCount: number }>;
  }> {
    const rules = await prisma.emailRule.findMany({
      where: { organizationId },
      orderBy: { matchCount: 'desc' },
      take: 10
    });

    const contacts = await prisma.contact.findMany({
      where: { organizationId },
      select: { emailCategory: true }
    });

    const categoryBreakdown = contacts.reduce((acc, contact) => {
      acc[contact.emailCategory] = (acc[contact.emailCategory] || 0) + 1;
      return acc;
    }, {} as Record<EmailCategory, number>);

    const totalSkipped = rules.reduce((sum, rule) => 
      sum + (rule.skipAIAnalysis ? rule.matchCount : 0), 0
    );

    const totalProcessed = rules.reduce((sum, rule) => sum + rule.matchCount, 0);

    return {
      totalEmailsProcessed: totalProcessed,
      aiAnalysisSkipped: totalSkipped,
      costReductionPercentage: totalProcessed > 0 ? (totalSkipped / totalProcessed) * 100 : 0,
      categoryBreakdown,
      topRules: rules.map(rule => ({ rule, matchCount: rule.matchCount }))
    };
  }

  // Private helper methods

  private async getContactByEmail(email: string, organizationId: string) {
    return await prisma.contact.findFirst({
      where: {
        email,
        organizationId
      }
    });
  }

  private async findMatchingRule(messageData: EmailMessageData): Promise<EmailRule | null> {
    const rules = await prisma.emailRule.findMany({
      where: {
        organizationId: messageData.organizationId,
        isActive: true
      },
      orderBy: { priority: 'desc' }
    });

    for (const rule of rules) {
      if (this.ruleMatches(rule, messageData)) {
        return rule;
      }
    }

    return null;
  }

  private ruleMatches(rule: EmailRule, messageData: EmailMessageData): boolean {
    // Check sender email
    if (rule.senderEmail && rule.senderEmail !== messageData.senderEmail) {
      return false;
    }

    // Check sender domain
    if (rule.senderDomain && messageData.senderDomain !== rule.senderDomain) {
      return false;
    }

    // Check subject contains
    if (rule.subjectContains && !messageData.subject.toLowerCase().includes(rule.subjectContains.toLowerCase())) {
      return false;
    }

    // Check subject pattern (regex)
    if (rule.subjectPattern) {
      try {
        const regex = new RegExp(rule.subjectPattern, 'i');
        if (!regex.test(messageData.subject)) {
          return false;
        }
      } catch (error) {
        logger.warn(`Invalid regex pattern in rule ${rule.id}: ${rule.subjectPattern}`);
        return false;
      }
    }

    // Check body contains
    if (rule.bodyContains && !messageData.content.toLowerCase().includes(rule.bodyContains.toLowerCase())) {
      return false;
    }

    return true;
  }

  private async updateRuleStats(ruleId: string): Promise<void> {
    await prisma.emailRule.update({
      where: { id: ruleId },
      data: {
        matchCount: { increment: 1 },
        lastMatched: new Date()
      }
    });
  }

  private async updateContactCategory(contactId: string, category: EmailCategory): Promise<void> {
    await prisma.contact.update({
      where: { id: contactId },
      data: { emailCategory: category }
    });
  }

  private buildResultFromCategory(category: EmailCategory): FilterResult {
    const config = this.getCategoryConfig(category);
    
    return {
      category,
      skipAIAnalysis: config.skipAI,
      autoArchive: config.autoArchive,
      autoDelete: config.autoDelete,
      createTask: config.createTask,
      shouldProcessWithAI: !config.skipAI,
      estimatedCostReduction: this.calculateCostReduction(category)
    };
  }

  private getCategoryConfig(category: EmailCategory) {
    const configs = {
      VIP: { skipAI: false, autoArchive: false, autoDelete: false, createTask: true },
      SPAM: { skipAI: true, autoArchive: false, autoDelete: true, createTask: false },
      INVOICES: { skipAI: true, autoArchive: true, autoDelete: false, createTask: true },
      ARCHIVE: { skipAI: true, autoArchive: true, autoDelete: false, createTask: false },
      UNKNOWN: { skipAI: false, autoArchive: false, autoDelete: false, createTask: false }
    };

    return configs[category] || configs.UNKNOWN;
  }

  private calculateCostReduction(category: EmailCategory): number {
    // Estimated cost reduction percentages
    const reductions = {
      VIP: 0,      // Process with AI - no reduction
      SPAM: 95,    // Skip AI completely - high reduction
      INVOICES: 85,// Skip AI, basic processing - high reduction
      ARCHIVE: 90, // Skip AI, auto-archive - very high reduction
      UNKNOWN: 0   // Process with AI - no reduction
    };

    return reductions[category] || 0;
  }
}

export const emailFilterService = new EmailFilterService();