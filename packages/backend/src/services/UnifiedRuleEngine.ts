import { PrismaClient, UnifiedRuleType, UnifiedRuleStatus, ExecutionStatus } from '@prisma/client';
import logger from '../config/logger';
import { universalRuleEngine } from './ai/UniversalRuleEngine';

const prisma = new PrismaClient();

/**
 * 🔥 UNIFIED RULE ENGINE - Zunifikowany silnik reguł
 * Łączy wszystkie systemy reguł w jeden spójny moduł:
 * - ProcessingRule -> PROCESSING
 * - EmailRule -> EMAIL_FILTER  
 * - AutoReply -> AUTO_REPLY
 * - AIRule -> AI_RULE
 * - SmartMailboxRule -> SMART_MAILBOX
 */
export class UnifiedRuleEngine {
  
  /**
   * Wykonaj wszystkie aktywne reguły dla danego kontekstu
   */
  async executeRulesForContext(
    entityType: string, 
    entityId: string, 
    entityData: Record<string, any>,
    organizationId: string,
    triggeredBy: string = 'automatic'
  ): Promise<any[]> {
    try {
      const startTime = Date.now();
      
      // Pobierz aktywne reguły dla tego typu encji
      const rules = await this.getActiveRulesForEntity(entityType, organizationId);
      
      const results = [];
      
      for (const rule of rules) {
        const executionResult = await this.executeRule(rule, {
          entityType,
          entityId, 
          entityData,
          triggeredBy,
          organizationId
        });
        
        results.push(executionResult);
      }
      
      logger.info(`Executed ${rules.length} rules for ${entityType}:${entityId}`, {
        executionTime: Date.now() - startTime,
        successCount: results.filter(r => r.success).length
      });
      
      return results;
      
    } catch (error) {
      logger.error('Failed to execute unified rules:', error);
      throw new Error('Unified rule execution failed');
    }
  }
  
  /**
   * Wykonaj konkretną regułę
   */
  async executeRule(rule: any, context: any): Promise<any> {
    const startTime = Date.now();
    let status: ExecutionStatus = 'SUCCESS';
    let result: any = null;
    let error: string | null = null;
    
    try {
      // Sprawdź warunki reguły
      const conditionsMet = await this.evaluateConditions(rule.conditions, context.entityData);
      
      if (!conditionsMet) {
        return {
          ruleId: rule.id,
          success: false,
          reason: 'Conditions not met',
          executionTime: Date.now() - startTime
        };
      }
      
      // Wykonaj akcje na podstawie typu reguły
      switch (rule.ruleType) {
        case 'PROCESSING':
          result = await this.executeProcessingActions(rule.actions, context);
          break;
          
        case 'EMAIL_FILTER':
          result = await this.executeEmailFilterActions(rule.actions, context);
          break;
          
        case 'AUTO_REPLY':
          result = await this.executeAutoReplyActions(rule.actions, context);
          break;
          
        case 'AI_RULE':
          result = await this.executeAIRuleActions(rule.actions, context);
          break;
          
        case 'SMART_MAILBOX':
          result = await this.executeSmartMailboxActions(rule.actions, context);
          break;
          
        default:
          throw new Error(`Unknown rule type: ${rule.ruleType}`);
      }
      
    } catch (executionError) {
      status = 'FAILED';
      error = executionError instanceof Error ? executionError.message : 'Unknown error';
      logger.error(`Rule execution failed for rule ${rule.id}:`, executionError);
    }
    
    const executionTime = Date.now() - startTime;
    
    // Loguj wykonanie reguły
    await this.logRuleExecution({
      ruleId: rule.id,
      triggeredBy: context.triggeredBy,
      executionTime,
      status,
      result,
      error,
      entityType: context.entityType,
      entityId: context.entityId,
      triggerData: context.entityData,
      organizationId: context.organizationId
    });
    
    // Aktualizuj statystyki reguły
    await this.updateRuleStatistics(rule.id, status, executionTime);
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      success: status === 'SUCCESS',
      result,
      error,
      executionTime
    };
  }
  
  /**
   * Pobierz aktywne reguły dla danego typu encji
   */
  private async getActiveRulesForEntity(entityType: string, organizationId: string) {
    const triggerEvents = this.getTriggersForEntityType(entityType);
    
    return await prisma.unifiedRule.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        OR: [
          { triggerEvents: { hasSome: triggerEvents } },
          { triggerType: 'MANUAL' }
        ],
        // Sprawdź harmonogram jeśli reguła jest czasowa
        AND: [
          {
            OR: [
              { activeFrom: null },
              { activeFrom: { lte: new Date() } }
            ]
          },
          {
            OR: [
              { activeTo: null },
              { activeTo: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });
  }
  
  /**
   * Mapuj typ encji na wyzwalacze
   */
  private getTriggersForEntityType(entityType: string): string[] {
    const triggerMap: Record<string, string[]> = {
      'message': ['message_received', 'communication_received'],
      'task': ['task_created', 'task_updated'],
      'project': ['project_created', 'project_updated'],
      'deal': ['deal_created', 'deal_updated'],
      'contact': ['contact_created', 'contact_updated'],
      'company': ['company_created', 'company_updated']
    };
    
    return triggerMap[entityType] || [];
  }
  
  /**
   * Sprawdź warunki reguły
   */
  private async evaluateConditions(conditions: any, entityData: Record<string, any>): Promise<boolean> {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }
    
    // Email conditions
    if (conditions.sender && entityData.fromEmail) {
      if (!entityData.fromEmail.includes(conditions.sender)) return false;
    }
    
    if (conditions.senderDomain && entityData.fromEmail) {
      const domain = entityData.fromEmail.split('@')[1];
      if (domain !== conditions.senderDomain) return false;
    }
    
    if (conditions.subjectContains && entityData.subject) {
      const keywords = Array.isArray(conditions.subjectContains) 
        ? conditions.subjectContains 
        : [conditions.subjectContains];
      
      const hasKeyword = keywords.some(keyword => 
        entityData.subject.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }
    
    if (conditions.bodyContains && entityData.content) {
      const keywords = Array.isArray(conditions.bodyContains) 
        ? conditions.bodyContains 
        : [conditions.bodyContains];
      
      const hasKeyword = keywords.some(keyword => 
        entityData.content.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }
    
    // Urgency conditions
    if (conditions.minUrgencyScore !== undefined && entityData.urgencyScore !== undefined) {
      if (entityData.urgencyScore < conditions.minUrgencyScore) return false;
    }
    
    if (conditions.maxUrgencyScore !== undefined && entityData.urgencyScore !== undefined) {
      if (entityData.urgencyScore > conditions.maxUrgencyScore) return false;
    }
    
    // Priority conditions
    if (conditions.priority && entityData.priority) {
      if (entityData.priority !== conditions.priority) return false;
    }
    
    // Time conditions
    if (conditions.timeRange) {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      
      if (conditions.timeRange.start) {
        const [startHour, startMin] = conditions.timeRange.start.split(':').map(Number);
        const startTime = startHour * 100 + startMin;
        if (currentTime < startTime) return false;
      }
      
      if (conditions.timeRange.end) {
        const [endHour, endMin] = conditions.timeRange.end.split(':').map(Number);
        const endTime = endHour * 100 + endMin;
        if (currentTime > endTime) return false;
      }
    }
    
    if (conditions.daysOfWeek && Array.isArray(conditions.daysOfWeek)) {
      const dayOfWeek = new Date().getDay();
      if (!conditions.daysOfWeek.includes(dayOfWeek)) return false;
    }
    
    // Smart Mailbox filters
    if (conditions.smartMailboxFilters && Array.isArray(conditions.smartMailboxFilters)) {
      for (const filter of conditions.smartMailboxFilters) {
        const fieldValue = this.getNestedValue(entityData, filter.field);
        const matches = this.evaluateSmartMailboxCondition(filter.operator, fieldValue, filter.value);
        
        if (filter.logicOperator === 'OR') {
          if (matches) return true;
        } else { // AND
          if (!matches) return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Wykonaj akcje Processing Rule
   */
  private async executeProcessingActions(actions: any, context: any): Promise<any> {
    const results: any[] = [];
    
    if (actions.createTask) {
      const taskData = {
        ...actions.createTask,
        organizationId: context.organizationId,
        relatedEntityType: context.entityType,
        relatedEntityId: context.entityId
      };
      
      // Tu dodaj rzeczywiste tworzenie zadania
      results.push({ action: 'createTask', result: taskData });
    }
    
    if (actions.updateContact) {
      // Tu dodaj rzeczywistą aktualizację kontaktu
      results.push({ action: 'updateContact', result: actions.updateContact });
    }
    
    if (actions.createDeal) {
      // Tu dodaj rzeczywiste tworzenie deala
      results.push({ action: 'createDeal', result: actions.createDeal });
    }
    
    if (actions.notify) {
      // Tu dodaj rzeczywiste powiadomienia
      results.push({ action: 'notify', result: actions.notify });
    }
    
    return results;
  }
  
  /**
   * Wykonaj akcje Email Filter Rule
   */
  private async executeEmailFilterActions(actions: any, context: any): Promise<any> {
    const results: any[] = [];
    
    if (actions.categorize) {
      // Tu dodaj rzeczywistą kategoryzację emaila
      results.push({ action: 'categorize', category: actions.categorize });
    }
    
    if (actions.skipAIAnalysis) {
      results.push({ action: 'skipAIAnalysis', value: true });
    }
    
    if (actions.autoArchive) {
      results.push({ action: 'autoArchive', value: true });
    }
    
    if (actions.autoDelete) {
      results.push({ action: 'autoDelete', value: true });
    }
    
    return results;
  }
  
  /**
   * Wykonaj akcje Auto Reply Rule
   */
  private async executeAutoReplyActions(actions: any, context: any): Promise<any> {
    const results: any[] = [];
    
    if (actions.sendAutoReply) {
      const replyData = {
        template: actions.sendAutoReply.template,
        subject: actions.sendAutoReply.subject,
        delay: actions.sendAutoReply.delay || 0,
        recipient: context.entityData.fromEmail,
        originalMessageId: context.entityId
      };
      
      // Tu dodaj rzeczywiste wysyłanie auto-reply
      results.push({ action: 'sendAutoReply', result: replyData });
    }
    
    return results;
  }
  
  /**
   * Wykonaj akcje AI Rule
   */
  private async executeAIRuleActions(actions: any, context: any): Promise<any> {
    const results: any[] = [];
    
    if (actions.runAIAnalysis) {
      try {
        const analysisResult = await universalRuleEngine.executeRules(
          context.entityType,
          null,
          context.entityData,
          'automatic'
        );
        
        results.push({ action: 'runAIAnalysis', result: analysisResult });
      } catch (error) {
        logger.error('AI analysis failed:', error);
        results.push({ action: 'runAIAnalysis', error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Wykonaj akcje Smart Mailbox Rule
   */
  private async executeSmartMailboxActions(actions: any, context: any): Promise<any> {
    const results: any[] = [];
    
    // Smart Mailbox rules głównie filtrują/kategoryzują wiadomości
    if (actions.addToMailbox) {
      results.push({ 
        action: 'addToMailbox', 
        mailboxId: actions.addToMailbox.mailboxId,
        entityId: context.entityId 
      });
    }
    
    return results;
  }
  
  /**
   * Sprawdź warunek Smart Mailbox
   */
  private evaluateSmartMailboxCondition(operator: string, fieldValue: any, conditionValue: any): boolean {
    switch (operator) {
      case 'EQUALS':
        return fieldValue === conditionValue;
      case 'NOT_EQUALS':
        return fieldValue !== conditionValue;
      case 'CONTAINS':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'NOT_CONTAINS':
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'STARTS_WITH':
        return String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
      case 'ENDS_WITH':
        return String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
      case 'GREATER_THAN':
        return Number(fieldValue) > Number(conditionValue);
      case 'LESS_THAN':
        return Number(fieldValue) < Number(conditionValue);
      case 'GREATER_EQUAL':
        return Number(fieldValue) >= Number(conditionValue);
      case 'LESS_EQUAL':
        return Number(fieldValue) <= Number(conditionValue);
      case 'BETWEEN':
        const [min, max] = String(conditionValue).split(',').map(Number);
        return Number(fieldValue) >= min && Number(fieldValue) <= max;
      case 'IN':
        const values = String(conditionValue).split(',').map(s => s.trim());
        return values.includes(String(fieldValue));
      case 'NOT_IN':
        const notValues = String(conditionValue).split(',').map(s => s.trim());
        return !notValues.includes(String(fieldValue));
      case 'REGEX':
        return new RegExp(conditionValue).test(String(fieldValue));
      case 'IS_EMPTY':
        return !fieldValue || fieldValue === '' || fieldValue === null;
      case 'IS_NOT_EMPTY':
        return fieldValue && fieldValue !== '' && fieldValue !== null;
      default:
        return false;
    }
  }
  
  /**
   * Pobierz zagnieżdżoną wartość z obiektu
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Loguj wykonanie reguły
   */
  private async logRuleExecution(data: {
    ruleId: string;
    triggeredBy: string;
    executionTime: number;
    status: ExecutionStatus;
    result: any;
    error: string | null;
    entityType: string;
    entityId: string;
    triggerData: any;
    organizationId: string;
  }): Promise<void> {
    try {
      await prisma.unifiedRuleExecution.create({
        data: {
          ruleId: data.ruleId,
          triggeredBy: data.triggeredBy,
          executionTime: data.executionTime,
          status: data.status,
          result: data.result,
          error: data.error,
          entityType: data.entityType,
          entityId: data.entityId,
          triggerData: data.triggerData,
          organizationId: data.organizationId
        }
      });
    } catch (error) {
      logger.error('Failed to log rule execution:', error);
    }
  }
  
  /**
   * Aktualizuj statystyki reguły
   */
  private async updateRuleStatistics(ruleId: string, status: ExecutionStatus, executionTime: number): Promise<void> {
    try {
      const updateData: any = {
        executionCount: { increment: 1 },
        lastExecuted: new Date()
      };
      
      if (status === 'SUCCESS') {
        updateData.successCount = { increment: 1 };
      } else {
        updateData.errorCount = { increment: 1 };
      }
      
      // Aktualizuj średni czas wykonania
      const rule = await prisma.unifiedRule.findUnique({
        where: { id: ruleId },
        select: { avgExecutionTime: true, executionCount: true }
      });
      
      if (rule) {
        const newAvgTime = rule.avgExecutionTime 
          ? (rule.avgExecutionTime * rule.executionCount + executionTime) / (rule.executionCount + 1)
          : executionTime;
        
        updateData.avgExecutionTime = newAvgTime;
      }
      
      await prisma.unifiedRule.update({
        where: { id: ruleId },
        data: updateData
      });
    } catch (error) {
      logger.error('Failed to update rule statistics:', error);
    }
  }
  
  /**
   * Wykonaj reguły dla konkretnej wiadomości (głównie email)
   */
  async processMessage(messageData: any, organizationId: string): Promise<any[]> {
    return this.executeRulesForContext(
      'message',
      messageData.id,
      messageData,
      organizationId,
      'automatic'
    );
  }
  
  /**
   * Wykonaj reguły dla projektu
   */
  async processProject(projectData: any, organizationId: string): Promise<any[]> {
    return this.executeRulesForContext(
      'project',
      projectData.id,
      projectData,
      organizationId,
      'automatic'
    );
  }
  
  /**
   * Wykonaj reguły dla zadania
   */
  async processTask(taskData: any, organizationId: string): Promise<any[]> {
    return this.executeRulesForContext(
      'task',
      taskData.id,
      taskData,
      organizationId,
      'automatic'
    );
  }
  
  /**
   * Wykonaj reguły dla deala
   */
  async processDeal(dealData: any, organizationId: string): Promise<any[]> {
    return this.executeRulesForContext(
      'deal',
      dealData.id,
      dealData,
      organizationId,
      'automatic'
    );
  }
  
  /**
   * Wykonaj reguły dla kontaktu
   */
  async processContact(contactData: any, organizationId: string): Promise<any[]> {
    return this.executeRulesForContext(
      'contact',
      contactData.id,
      contactData,
      organizationId,
      'automatic'
    );
  }
}

export const unifiedRuleEngine = new UnifiedRuleEngine();