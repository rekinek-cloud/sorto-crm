import { PrismaClient, Priority, TaskStatus, MessagePriority, ContactStatus, DealStage } from '@prisma/client';
import { EmailMessage } from './emailService';
import { crmLinkageService } from './crmLinkageService';
import { SmartAnalysisService } from './smartAnalysis';

const prisma = new PrismaClient();
const smartAnalysisService = new SmartAnalysisService();

export interface ProcessingResult {
  taskCreated?: string;
  contextAssigned?: string;
  prioritySet?: Priority;
  actionTaken: string;
  success: boolean;
  errorMessage?: string;
  // CRM results
  contactId?: string;
  companyId?: string;
  dealId?: string;
  crmUpdated?: boolean;
}

export class MessageProcessor {
  
  async processMessage(messageId: string, emailMessage: EmailMessage, userId?: string): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { 
          channel: { 
            include: { 
              processingRules: { 
                where: { active: true },
                orderBy: { priority: 'desc' }
              } 
            } 
          } 
        }
      });

      if (!message) {
        throw new Error('Message not found');
      }

      // First, link message to CRM entities (contacts, companies, deals)
      const crmResult = await crmLinkageService.linkMessageToCRM(
        messageId, 
        emailMessage, 
        message.organizationId,
        userId
      );
      
      if (crmResult.contactId || crmResult.companyId) {
        results.push({
          actionTaken: 'CRM_LINKED',
          success: true,
          contactId: crmResult.contactId,
          companyId: crmResult.companyId,
          dealId: crmResult.dealId,
          crmUpdated: true
        });
      }

      // Process through each active rule
      for (const rule of message.channel.processingRules) {
        const ruleResult = await this.applyRule(messageId, emailMessage, rule, userId);
        if (ruleResult) {
          results.push(ruleResult);
          
          // Update rule statistics
          await prisma.processingRule.update({
            where: { id: rule.id },
            data: {
              executionCount: { increment: 1 },
              lastExecuted: new Date()
            }
          });
        }
      }

      // Default processing if no rules matched
      if (results.length === 0) {
        const defaultResult = await this.defaultProcessing(messageId, emailMessage, userId);
        if (defaultResult) {
          results.push(defaultResult);
        }
      }

      // Update message with processing results
      await this.updateMessageAnalysis(messageId, emailMessage, results);

    } catch (error) {
      console.error('Error processing message:', error);
      results.push({
        actionTaken: 'ERROR',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async applyRule(messageId: string, emailMessage: EmailMessage, rule: any, userId?: string): Promise<ProcessingResult | null> {
    const conditions = rule.conditions as any;
    const actions = rule.actions as any;

    // Check if conditions match
    if (!this.matchesConditions(emailMessage, conditions)) {
      return null;
    }

    const result: ProcessingResult = {
      actionTaken: 'RULE_APPLIED',
      success: true
    };

    try {
      // Execute actions
      if (actions.create_task) {
        const taskId = await this.createTaskFromMessage(messageId, emailMessage, actions, userId);
        result.taskCreated = taskId;
        result.actionTaken = 'TASK_CREATED';
      }

      if (actions.context) {
        result.contextAssigned = actions.context;
        await this.assignContext(messageId, actions.context);
      }

      if (actions.priority) {
        result.prioritySet = actions.priority;
        await this.setPriority(messageId, actions.priority);
      }

      if (actions.archive) {
        await this.archiveMessage(messageId);
        result.actionTaken = 'ARCHIVED';
      }

      if (actions.forward_to) {
        await this.forwardMessage(messageId, emailMessage, actions.forward_to);
        result.actionTaken = 'FORWARDED';
      }

      // CRM Actions
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { contact: true, company: true }
      });

      if (message?.contactId) {
        // Update contact status
        if (actions.update_contact_status) {
          await crmLinkageService.updateContactStatus(
            message.contactId, 
            actions.update_contact_status as ContactStatus
          );
          result.crmUpdated = true;
        }

        // Add contact tags
        if (actions.add_contact_tags && Array.isArray(actions.add_contact_tags)) {
          await crmLinkageService.addContactTags(
            message.contactId,
            actions.add_contact_tags
          );
          result.crmUpdated = true;
        }

        // Create deal
        if (actions.create_deal && message.companyId) {
          const deal = await crmLinkageService.createDealFromEmail(
            message.contactId,
            message.companyId,
            emailMessage,
            {
              stage: actions.create_deal.stage || DealStage.PROSPECT,
              value: actions.create_deal.value || 0,
              ownerId: userId || 'system',
              organizationId: message.organizationId
            }
          );
          result.dealId = deal.id;
          result.actionTaken = 'DEAL_CREATED';
          
          // Update message with deal
          await prisma.message.update({
            where: { id: messageId },
            data: { dealId: deal.id }
          });
        }
      }

      // Update company status
      if (actions.update_company && message?.companyId) {
        await prisma.company.update({
          where: { id: message.companyId },
          data: actions.update_company
        });
        result.crmUpdated = true;
      }

      // Save processing result
      await prisma.messageProcessingResult.create({
        data: {
          messageId,
          ruleId: rule.id,
          actionTaken: result.actionTaken,
          success: true,
          taskCreated: result.taskCreated,
          contextAssigned: result.contextAssigned,
          prioritySet: result.prioritySet
        }
      });

      return result;

    } catch (error) {
      console.error('Error applying rule:', error);
      
      // Save error result
      await prisma.messageProcessingResult.create({
        data: {
          messageId,
          ruleId: rule.id,
          actionTaken: 'ERROR',
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        actionTaken: 'ERROR',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private matchesConditions(emailMessage: EmailMessage, conditions: any): boolean {
    // Check sender conditions
    if (conditions.sender) {
      const senderMatch = Array.isArray(conditions.sender) 
        ? conditions.sender.some((s: string) => emailMessage.from.address.includes(s))
        : emailMessage.from.address.includes(conditions.sender);
      
      if (!senderMatch) return false;
    }

    // Check sender domain conditions
    if (conditions.sender_domain) {
      const domain = emailMessage.from.address.split('@')[1];
      const domainMatch = Array.isArray(conditions.sender_domain)
        ? conditions.sender_domain.includes(domain)
        : domain === conditions.sender_domain;
      
      if (!domainMatch) return false;
    }

    // Check subject conditions
    if (conditions.subject_contains) {
      const subject = emailMessage.subject.toLowerCase();
      const keywordMatch = Array.isArray(conditions.subject_contains)
        ? conditions.subject_contains.some((keyword: string) => subject.includes(keyword.toLowerCase()))
        : subject.includes(conditions.subject_contains.toLowerCase());
      
      if (!keywordMatch) return false;
    }

    // Check content keywords
    if (conditions.keywords) {
      const content = (emailMessage.text || '').toLowerCase();
      const keywordMatch = Array.isArray(conditions.keywords)
        ? conditions.keywords.some((keyword: string) => content.includes(keyword.toLowerCase()))
        : content.includes(conditions.keywords.toLowerCase());
      
      if (!keywordMatch) return false;
    }

    // Check urgency keywords
    if (conditions.urgent_keywords) {
      const fullText = `${emailMessage.subject} ${emailMessage.text}`.toLowerCase();
      const urgentWords = ['urgent', 'asap', 'emergency', 'critical', 'important', 'deadline'];
      const hasUrgent = urgentWords.some(word => fullText.includes(word));
      
      if (conditions.urgent_keywords && !hasUrgent) return false;
    }

    return true;
  }

  private async createTaskFromMessage(messageId: string, emailMessage: EmailMessage, actions: any, userId?: string): Promise<string> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: { include: { streamChannels: true } } }
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Determine task title and description
    const title = actions.task_title || `Follow up: ${emailMessage.subject}`;
    const description = this.generateTaskDescription(emailMessage);
    
    // Determine priority
    const priority = this.determinePriority(emailMessage, actions);
    
    // Determine stream
    const streamId = this.determineStream(message, actions);

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status: TaskStatus.NEW,
        organizationId: message.organizationId,
        createdById: userId || 'system',
        streamId,
        dueDate: actions.due_date ? new Date(actions.due_date) : this.calculateDueDate(emailMessage, actions)
      }
    });

    // Link message to task
    await prisma.message.update({
      where: { id: messageId },
      data: { 
        taskId: task.id,
        actionNeeded: true
      }
    });

    // Run SMART analysis on the created task
    try {
      const smartAnalysis = await SmartAnalysisService.analyzeTask(task);
      
      // If task needs improvement, add suggestions
      if (smartAnalysis.overallScore < 60) {
        // Update task description with SMART suggestions
        const smartNote = `\n\n📊 SMART Analysis Score: ${smartAnalysis.overallScore}/100\n` +
          smartAnalysis.recommendations.map(r => `• ${r}`).join('\n');
        
        await prisma.task.update({
          where: { id: task.id },
          data: {
            description: task.description + smartNote
          }
        });
      }
    } catch (error) {
      console.error('Error running SMART analysis:', error);
    }

    return task.id;
  }

  private generateTaskDescription(emailMessage: EmailMessage): string {
    const lines = [
      `📧 Email from: ${emailMessage.from.name || emailMessage.from.address}`,
      `📅 Received: ${emailMessage.date.toLocaleString()}`,
      `📝 Subject: ${emailMessage.subject}`,
      '',
      '💬 Content:',
      emailMessage.text?.substring(0, 500) + (emailMessage.text && emailMessage.text.length > 500 ? '...' : ''),
    ];

    if (emailMessage.attachments && emailMessage.attachments.length > 0) {
      lines.push('');
      lines.push('📎 Attachments:');
      emailMessage.attachments.forEach(att => {
        lines.push(`- ${att.filename} (${att.contentType})`);
      });
    }

    return lines.join('\n');
  }

  private determinePriority(emailMessage: EmailMessage, actions: any): Priority {
    if (actions.priority && typeof actions.priority === 'string') {
      const priorityMap: { [key: string]: Priority } = {
        'LOW': Priority.LOW,
        'MEDIUM': Priority.MEDIUM,
        'HIGH': Priority.HIGH
      };
      return priorityMap[actions.priority.toUpperCase()] || Priority.MEDIUM;
    }

    // Auto-detect priority based on content
    const fullText = `${emailMessage.subject} ${emailMessage.text}`.toLowerCase();
    
    if (fullText.includes('urgent') || fullText.includes('asap') || fullText.includes('emergency')) {
      return Priority.HIGH;
    }
    
    if (fullText.includes('important') || fullText.includes('deadline')) {
      return Priority.MEDIUM;
    }

    return Priority.LOW;
  }

  private determineStream(message: any, actions: any): string | null {
    if (actions.stream_id) {
      return actions.stream_id;
    }

    // Use default stream from channel configuration
    if (message.channel.streamChannels.length > 0) {
      return message.channel.streamChannels[0].streamId;
    }

    return null;
  }

  private calculateDueDate(emailMessage: EmailMessage, actions: any): Date | null {
    if (actions.due_days) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + actions.due_days);
      return dueDate;
    }

    // Default: 2 days for responses
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    return dueDate;
  }

  private async assignContext(messageId: string, context: string): Promise<void> {
    await prisma.message.update({
      where: { id: messageId },
      data: { extractedContext: context }
    });
  }

  private async setPriority(messageId: string, priority: string): Promise<void> {
    const priorityValue = priority.toUpperCase() as keyof typeof MessagePriority;
    
    await prisma.message.update({
      where: { id: messageId },
      data: { priority: MessagePriority[priorityValue] }
    });
  }

  private async archiveMessage(messageId: string): Promise<void> {
    await prisma.message.update({
      where: { id: messageId },
      data: { isArchived: true }
    });
  }

  private async forwardMessage(messageId: string, emailMessage: EmailMessage, forwardTo: string): Promise<void> {
    // Implementation would depend on email service integration
    console.log(`Forwarding message ${messageId} to ${forwardTo}`);
  }

  private async defaultProcessing(messageId: string, emailMessage: EmailMessage, userId?: string): Promise<ProcessingResult | null> {
    // Basic sentiment and urgency analysis
    const analysis = this.analyzeMessage(emailMessage);
    
    await prisma.message.update({
      where: { id: messageId },
      data: {
        sentiment: analysis.sentiment,
        urgencyScore: analysis.urgencyScore,
        extractedTasks: analysis.extractedTasks,
        autoProcessed: true
      }
    });

    // Auto-create task for high urgency messages
    if (analysis.urgencyScore > 70) {
      const taskId = await this.createTaskFromMessage(messageId, emailMessage, {
        task_title: `URGENT: ${emailMessage.subject}`,
        priority: Priority.HIGH,
        due_days: 1
      }, userId);

      return {
        actionTaken: 'URGENT_TASK_CREATED',
        success: true,
        taskCreated: taskId,
        prioritySet: 'HIGH'
      };
    }

    return {
      actionTaken: 'ANALYZED',
      success: true
    };
  }

  private analyzeMessage(emailMessage: EmailMessage): {
    sentiment: string;
    urgencyScore: number;
    extractedTasks: string[];
  } {
    const fullText = `${emailMessage.subject} ${emailMessage.text}`.toLowerCase();
    
    // Simple sentiment analysis
    const positiveWords = ['thank', 'great', 'excellent', 'good', 'please'];
    const negativeWords = ['problem', 'issue', 'error', 'urgent', 'help'];
    
    const positiveCount = positiveWords.filter(word => fullText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => fullText.includes(word)).length;
    
    let sentiment = 'NEUTRAL';
    if (positiveCount > negativeCount) sentiment = 'POSITIVE';
    if (negativeCount > positiveCount) sentiment = 'NEGATIVE';

    // Simple urgency scoring (English and Polish)
    const urgentWords = [
      // English
      'urgent', 'asap', 'emergency', 'critical', 'deadline', 'important',
      // Polish
      'pilne', 'natychmiast', 'ważne', 'deadline', 'termin', 'szybko',
      'niezwłocznie', 'potrzebuje', 'proszę', 'możesz', 'trzeba'
    ];
    const urgentMatches = urgentWords.filter(word => fullText.includes(word)).length;
    const urgencyScore = Math.min(urgentMatches * 25, 100);

    // Extract potential tasks (simple implementation)
    const taskKeywords = [
      // English
      'need to', 'have to', 'should', 'must', 'please', 'can you',
      // Polish
      'trzeba', 'potrzebuje', 'proszę', 'możesz', 'powinieneś', 'musisz',
      'etykieta', 'poprawić', 'wysłać', 'zrobić', 'przygotować'
    ];
    const extractedTasks = taskKeywords
      .filter(keyword => fullText.includes(keyword))
      .map(keyword => `Action needed: ${keyword}`)
      .slice(0, 3); // Limit to 3 tasks

    return {
      sentiment,
      urgencyScore,
      extractedTasks
    };
  }

  private async updateMessageAnalysis(messageId: string, emailMessage: EmailMessage, results: ProcessingResult[]): Promise<void> {
    const analysis = this.analyzeMessage(emailMessage);
    
    await prisma.message.update({
      where: { id: messageId },
      data: {
        autoProcessed: true,
        sentiment: analysis.sentiment,
        urgencyScore: analysis.urgencyScore,
        extractedTasks: analysis.extractedTasks,
        actionNeeded: results.some(r => r.taskCreated) || analysis.urgencyScore > 25 || analysis.extractedTasks.length > 0,
        needsResponse: analysis.urgencyScore > 50
      }
    });
  }
}

export async function processMessageContent(messageId: string, emailMessage: EmailMessage, userId?: string): Promise<ProcessingResult[]> {
  const processor = new MessageProcessor();
  return processor.processMessage(messageId, emailMessage, userId);
}