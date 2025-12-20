/**
 * StreamsRuleEngine - Specjalizowany engine do przetwarzania reguł GTD
 * Rozszerza UnifiedRuleEngine o funkcjonalność STREAMS workflow
 */

import { PrismaClient, GTDRole } from '@prisma/client';
import { UnifiedRuleEngine } from './UnifiedRuleEngine';
import { emailService } from './EmailService';
import {
  ProcessingRule,
  ProcessingTrigger,
  ProcessingCondition,
  ProcessingAction,
  GTDContext,
  EnergyLevel
} from '../types/gtd';

/**
 * Wynik wykonania reguły GTD
 */
export interface StreamsRuleExecutionResult {
  ruleId: string;
  ruleName: string;
  success: boolean;
  executionTime: number;
  actionsExecuted: number;
  actionsSuccessful: number;
  actionsFailed: number;
  errorMessage?: string;
  results: Array<{
    action: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
  metadata: {
    confidence: number;
    triggeredBy: string;
    conditionsMatched: number;
    totalConditions: number;
  };
}

/**
 * Kontekst wykonania reguły
 */
export interface StreamsExecutionContext {
  entityType: 'TASK' | 'EMAIL' | 'CONTACT' | 'DEAL' | 'MESSAGE';
  entityId: string;
  entityData: Record<string, any>;
  organizationId: string;
  userId: string;
  triggeredBy: 'MANUAL' | 'AUTOMATIC' | 'SCHEDULED' | 'EMAIL_RECEIVED' | 'TASK_CREATED';
  streamId?: string;
  parentContext?: StreamsExecutionContext;
}

/**
 * Statystyki wykonania reguł GTD
 */
export interface GTDRuleStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  rulePerformance: Array<{
    ruleId: string;
    ruleName: string;
    executions: number;
    successRate: number;
    averageTime: number;
    lastExecuted?: Date;
  }>;
  actionStats: Record<string, {
    count: number;
    successRate: number;
  }>;
}

/**
 * GTD Processing Rule Engine
 */
export class StreamsRuleEngine extends UnifiedRuleEngine {
  private prisma: PrismaClient;
  private logger: any;

  constructor(prisma: PrismaClient, logger?: any) {
    super();
    this.prisma = prisma;
    this.logger = logger || console;
  }

  // ========================================
  // CORE GTD RULE EXECUTION
  // ========================================

  /**
   * Wykonuje reguły GTD dla danego kontekstu
   */
  async executeGTDRules(context: StreamsExecutionContext): Promise<StreamsRuleExecutionResult[]> {
    try {
      const startTime = Date.now();
      
      // Pobierz aktywne reguły GTD dla kontekstu
      const rules = await this.getGTDRulesForContext(context);
      
      this.logger.info(`Executing ${rules.length} GTD rules for ${context.entityType}:${context.entityId}`);
      
      const results: StreamsRuleExecutionResult[] = [];
      
      for (const rule of rules) {
        const executionResult = await this.executeGTDRule(rule, context);
        results.push(executionResult);
        
        // Jeśli reguła ma stopOnFirstMatch i została wykonana pomyślnie, zatrzymaj
        if (rule.stopOnFirstMatch && executionResult.success) {
          this.logger.info(`Stopping rule execution due to stopOnFirstMatch for rule: ${rule.name}`);
          break;
        }
      }
      
      // Loguj statystyki
      const totalTime = Date.now() - startTime;
      const successfulRules = results.filter(r => r.success).length;
      
      this.logger.info(`GTD rules execution completed`, {
        totalRules: rules.length,
        successfulRules,
        failedRules: rules.length - successfulRules,
        totalTime,
        entityType: context.entityType,
        entityId: context.entityId
      });
      
      return results;
      
    } catch (error) {
      this.logger.error('Error executing GTD rules:', error);
      throw new Error('Failed to execute GTD rules');
    }
  }

  /**
   * Wykonuje pojedynczą regułę GTD
   */
  async executeGTDRule(rule: ProcessingRule, context: StreamsExecutionContext): Promise<StreamsRuleExecutionResult> {
    const startTime = Date.now();
    const result: StreamsRuleExecutionResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      success: false,
      executionTime: 0,
      actionsExecuted: 0,
      actionsSuccessful: 0,
      actionsFailed: 0,
      results: [],
      metadata: {
        confidence: 0,
        triggeredBy: context.triggeredBy,
        conditionsMatched: 0,
        totalConditions: rule.conditions.length
      }
    };

    try {
      // Sprawdź warunki reguły
      const conditionsResult = await this.evaluateGTDConditions(rule.conditions, context);
      result.metadata.conditionsMatched = conditionsResult.matchedCount;
      result.metadata.confidence = conditionsResult.confidence;

      if (!conditionsResult.allMatched) {
        result.success = false;
        result.errorMessage = `Conditions not met: ${conditionsResult.failedConditions.join(', ')}`;
        result.executionTime = Date.now() - startTime;
        return result;
      }

      // Wykonaj akcje
      for (const action of rule.actions) {
        result.actionsExecuted++;
        
        try {
          const actionResult = await this.executeGTDAction(action, context);
          
          result.results.push({
            action: action.type,
            success: true,
            result: actionResult
          });
          
          result.actionsSuccessful++;
          
        } catch (actionError) {
          this.logger.error(`Action execution failed: ${action.type}`, actionError);
          
          result.results.push({
            action: action.type,
            success: false,
            error: actionError instanceof Error ? actionError.message : 'Unknown error'
          });
          
          result.actionsFailed++;
        }
      }

      // Aktualizuj statystyki reguły
      await this.updateRuleStats(rule.id, true);

      // Zapisz wynik przetwarzania do bazy danych (jeśli encja to MESSAGE)
      if (context.entityType === 'MESSAGE') {
        await this.saveProcessingResult(context.entityId, rule.id, result);
      }

      result.success = result.actionsFailed === 0;
      result.executionTime = Date.now() - startTime;

      return result;
      
    } catch (error) {
      this.logger.error(`Rule execution failed: ${rule.name}`, error);
      
      await this.updateRuleStats(rule.id, false);
      
      result.success = false;
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.executionTime = Date.now() - startTime;
      
      return result;
    }
  }

  // ========================================
  // CONDITION EVALUATION
  // ========================================

  /**
   * Ewaluuje warunki reguły GTD
   */
  private async evaluateGTDConditions(
    conditions: ProcessingCondition[],
    context: StreamsExecutionContext
  ): Promise<{
    allMatched: boolean;
    matchedCount: number;
    confidence: number;
    failedConditions: string[];
  }> {
    if (conditions.length === 0) {
      return {
        allMatched: true,
        matchedCount: 0,
        confidence: 1.0,
        failedConditions: []
      };
    }

    let matchedCount = 0;
    const failedConditions: string[] = [];
    
    for (const condition of conditions) {
      const matched = await this.evaluateCondition(condition, context);
      
      if (matched) {
        matchedCount++;
      } else {
        failedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`);
      }
    }

    const confidence = matchedCount / conditions.length;
    const allMatched = matchedCount === conditions.length;

    return {
      allMatched,
      matchedCount,
      confidence,
      failedConditions
    };
  }

  /**
   * Ewaluuje pojedynczy warunek
   */
  private async evaluateCondition(
    condition: ProcessingCondition,
    context: StreamsExecutionContext
  ): Promise<boolean> {
    try {
      const fieldValue = this.getFieldValue(condition.field, context);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
          
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
          
        case 'regex':
          const regex = new RegExp(condition.value, 'i');
          return regex.test(String(fieldValue));
          
        case 'gt':
          return Number(fieldValue) > Number(condition.value);
          
        case 'lt':
          return Number(fieldValue) < Number(condition.value);
          
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
          
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
          
        default:
          this.logger.warn(`Unknown condition operator: ${condition.operator}`);
          return false;
      }
      
    } catch (error) {
      this.logger.error(`Error evaluating condition: ${condition.field}`, error);
      return false;
    }
  }

  /**
   * Pobiera wartość pola z kontekstu
   */
  private getFieldValue(field: string, context: StreamsExecutionContext): any {
    // Obsługa nested properties z kropką
    const parts = field.split('.');
    let value: any = context.entityData;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // ========================================
  // ACTION EXECUTION
  // ========================================

  /**
   * Wykonuje akcję GTD
   */
  private async executeGTDAction(
    action: ProcessingAction,
    context: StreamsExecutionContext
  ): Promise<any> {
    this.logger.info(`Executing GTD action: ${action.type}`, action.config);
    
    switch (action.type) {
      case 'MOVE_TO_STREAM':
        return await this.moveToStream(action.config, context);
        
      case 'ASSIGN_CONTEXT':
        return await this.assignContext(action.config, context);
        
      case 'SET_PRIORITY':
        return await this.setPriority(action.config, context);
        
      case 'CREATE_TASK':
        return await this.createTask(action.config, context);
        
      case 'SEND_NOTIFICATION':
        return await this.sendNotification(action.config, context);
        
      case 'CREATE_PROJECT':
        return await this.createProject(action.config, context);
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Przenieś do streama
   */
  private async moveToStream(config: Record<string, any>, context: StreamsExecutionContext): Promise<any> {
    const { streamId, reason } = config;
    
    if (!streamId) {
      throw new Error('Stream ID not specified in action config');
    }

    // Sprawdź czy stream istnieje
    const stream = await this.prisma.stream.findUnique({
      where: { id: streamId },
      select: { id: true, name: true, gtdRole: true }
    });

    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    // Przenieś zasób w zależności od typu
    switch (context.entityType) {
      case 'TASK':
        await this.prisma.task.update({
          where: { id: context.entityId },
          data: { streamId }
        });
        break;
        
      case 'MESSAGE':
        await this.prisma.message.update({
          where: { id: context.entityId },
          data: { streamId }
        });
        break;
        
      default:
        throw new Error(`Cannot move ${context.entityType} to stream`);
    }

    return {
      action: 'MOVE_TO_STREAM',
      streamId,
      streamName: stream.name,
      reason: reason || 'Moved by GTD rule'
    };
  }

  /**
   * Przypisz kontekst GTD
   */
  private async assignContext(config: Record<string, any>, context: StreamsExecutionContext): Promise<any> {
    const { context: gtdContext } = config;
    
    if (!gtdContext || !Object.values(GTDContext).includes(gtdContext)) {
      throw new Error('Invalid GTD context specified');
    }

    // Znajdź lub utwórz kontekst
    let contextRecord = await this.prisma.context.findFirst({
      where: {
        name: gtdContext,
        organizationId: context.organizationId
      }
    });

    if (!contextRecord) {
      contextRecord = await this.prisma.context.create({
        data: {
          name: gtdContext,
          description: `Auto-generated context: ${gtdContext}`,
          organizationId: context.organizationId
        }
      });
    }

    // Przypisz kontekst w zależności od typu encji
    switch (context.entityType) {
      case 'TASK':
        await this.prisma.task.update({
          where: { id: context.entityId },
          data: { contextId: contextRecord.id }
        });
        break;
        
      default:
        throw new Error(`Cannot assign context to ${context.entityType}`);
    }

    return {
      action: 'ASSIGN_CONTEXT',
      context: gtdContext,
      contextId: contextRecord.id
    };
  }

  /**
   * Ustaw priorytet
   */
  private async setPriority(config: Record<string, any>, context: StreamsExecutionContext): Promise<any> {
    const { priority } = config;
    
    if (!priority || !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      throw new Error('Invalid priority specified');
    }

    switch (context.entityType) {
      case 'TASK':
        await this.prisma.task.update({
          where: { id: context.entityId },
          data: { priority }
        });
        break;
        
      default:
        throw new Error(`Cannot set priority for ${context.entityType}`);
    }

    return {
      action: 'SET_PRIORITY',
      priority
    };
  }

  /**
   * Utwórz zadanie
   */
  private async createTask(config: Record<string, any>, context: StreamsExecutionContext): Promise<any> {
    const {
      title,
      description,
      priority = 'MEDIUM',
      dueDate,
      contextName,
      streamId
    } = config;

    if (!title) {
      throw new Error('Task title is required');
    }

    // Znajdź kontekst jeśli podano
    let contextId: string | undefined;
    if (contextName) {
      const contextRecord = await this.prisma.context.findFirst({
        where: {
          name: contextName,
          organizationId: context.organizationId
        }
      });
      contextId = contextRecord?.id;
    }

    const task = await this.prisma.task.create({
      data: {
        title,
        description: description || `Auto-generated from ${context.entityType}`,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        contextId,
        streamId: streamId || context.streamId,
        organizationId: context.organizationId,
        createdById: context.userId
      }
    });

    return {
      action: 'CREATE_TASK',
      taskId: task.id,
      title: task.title
    };
  }

  /**
   * Wyślij notyfikację
   */
  private async sendNotification(config: Record<string, any>, context: StreamsExecutionContext): Promise<any> {
    const { message, type = 'INFO', recipients, title } = config;

    this.logger.info('Sending GTD Notification', {
      message,
      type,
      recipients,
      context: {
        entityType: context.entityType,
        entityId: context.entityId
      }
    });

    // Jeśli recipients to lista emaili lub userIds, wyślij do każdego
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    const sentTo: string[] = [];

    for (const recipient of recipientList) {
      try {
        // Sprawdź czy recipient to email czy userId
        let email = recipient;
        let userName: string | undefined;

        if (recipient && !recipient.includes('@')) {
          // To userId - pobierz email
          const user = await this.prisma.user.findUnique({
            where: { id: recipient },
            select: { email: true, firstName: true, lastName: true }
          });
          if (user) {
            email = user.email;
            userName = `${user.firstName} ${user.lastName}`.trim() || undefined;
          }
        }

        if (email) {
          await emailService.sendRuleNotification(email, {
            userName,
            ruleType: type as 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR',
            title: title || 'Powiadomienie z reguły GTD',
            message,
            entityType: context.entityType,
            entityId: context.entityId
          });
          sentTo.push(email);
        }
      } catch (error) {
        this.logger.error(`Failed to send notification to ${recipient}:`, error);
      }
    }

    return {
      action: 'SEND_NOTIFICATION',
      message,
      type,
      recipients: sentTo,
      sentCount: sentTo.length
    };
  }

  /**
   * Utwórz projekt
   */
  private async createProject(config: Record<string, any>, context: StreamsExecutionContext): Promise<any> {
    const {
      name,
      description,
      streamId
    } = config;

    if (!name) {
      throw new Error('Project name is required');
    }

    const project = await this.prisma.project.create({
      data: {
        name,
        description: description || `Auto-generated from ${context.entityType}`,
        organizationId: context.organizationId,
        createdById: context.userId
      }
    });

    return {
      action: 'CREATE_PROJECT',
      projectId: project.id,
      name: project.name
    };
  }

  // ========================================
  // RULE MANAGEMENT
  // ========================================

  /**
   * Pobiera reguły GTD dla kontekstu
   */
  private async getGTDRulesForContext(context: StreamsExecutionContext): Promise<ProcessingRule[]> {
    try {
      // Pobierz aktywne reguły dla organizacji, posortowane wg priorytetu
      const dbRules = await this.prisma.processingRule.findMany({
        where: {
          organizationId: context.organizationId,
          active: true,
          // Opcjonalnie filtruj po streamId jeśli podany
          ...(context.streamId && { streamId: context.streamId })
        },
        orderBy: { priority: 'desc' }
      });

      // Konwertuj reguły z bazy danych na format ProcessingRule
      return dbRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description || '',
        conditions: (rule.conditions as any[]) || [],
        actions: (rule.actions as any[]) || [],
        priority: rule.priority,
        stopOnFirstMatch: false, // Default
        enabled: rule.active
      }));
    } catch (error) {
      this.logger.error('Error getting GTD rules for context:', error);
      return [];
    }
  }

  /**
   * Aktualizuje statystyki reguły
   */
  private async updateRuleStats(ruleId: string, success: boolean): Promise<void> {
    try {
      await this.prisma.processingRule.update({
        where: { id: ruleId },
        data: {
          executionCount: { increment: 1 },
          lastExecuted: new Date()
        }
      });

      this.logger.debug(`Updated rule stats for ${ruleId}: ${success ? 'success' : 'failure'}`);
    } catch (error) {
      this.logger.error('Error updating rule stats:', error);
    }
  }

  /**
   * Zapisuje wynik przetwarzania reguły do bazy danych
   */
  private async saveProcessingResult(
    messageId: string,
    ruleId: string,
    result: StreamsRuleExecutionResult
  ): Promise<void> {
    try {
      // Zapisz każdą akcję jako osobny rekord
      for (const actionResult of result.results) {
        await this.prisma.messageProcessingResult.create({
          data: {
            messageId,
            ruleId,
            actionTaken: actionResult.action,
            success: actionResult.success,
            errorMessage: actionResult.error,
            taskCreated: actionResult.result?.taskId,
            contextAssigned: actionResult.result?.contextId,
            prioritySet: actionResult.result?.priority
          }
        });
      }

      this.logger.debug(`Saved ${result.results.length} processing results for message ${messageId}`);
    } catch (error) {
      this.logger.error('Error saving processing result:', error);
    }
  }

  /**
   * Pobiera statystyki wykonania reguł GTD
   */
  async getGTDRuleStats(organizationId: string, dateFrom?: Date, dateTo?: Date): Promise<GTDRuleStats> {
    try {
      // Pobierz wszystkie reguły dla organizacji
      const rules = await this.prisma.processingRule.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          executionCount: true,
          lastExecuted: true
        }
      });

      // Pobierz wyniki przetwarzania z zakresu dat
      const whereClause: any = {};
      if (dateFrom || dateTo) {
        whereClause.processedAt = {};
        if (dateFrom) whereClause.processedAt.gte = dateFrom;
        if (dateTo) whereClause.processedAt.lte = dateTo;
      }

      const processingResults = await this.prisma.messageProcessingResult.findMany({
        where: {
          ...whereClause,
          rule: {
            organizationId
          }
        },
        select: {
          success: true,
          actionTaken: true,
          ruleId: true
        }
      });

      // Oblicz statystyki
      const totalExecutions = processingResults.length;
      const successfulExecutions = processingResults.filter(r => r.success).length;
      const failedExecutions = totalExecutions - successfulExecutions;

      // Statystyki per reguła
      const ruleStats = new Map<string, { executions: number; successes: number; name: string; lastExecuted?: Date }>();

      for (const rule of rules) {
        ruleStats.set(rule.id, {
          executions: rule.executionCount,
          successes: 0,
          name: rule.name,
          lastExecuted: rule.lastExecuted || undefined
        });
      }

      for (const result of processingResults) {
        if (result.ruleId && ruleStats.has(result.ruleId)) {
          const stats = ruleStats.get(result.ruleId)!;
          if (result.success) {
            stats.successes++;
          }
        }
      }

      // Statystyki akcji
      const actionStats: Record<string, { count: number; successes: number }> = {};
      for (const result of processingResults) {
        if (!actionStats[result.actionTaken]) {
          actionStats[result.actionTaken] = { count: 0, successes: 0 };
        }
        actionStats[result.actionTaken].count++;
        if (result.success) {
          actionStats[result.actionTaken].successes++;
        }
      }

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageExecutionTime: 0, // Nie przechowujemy czasu wykonania w bazie - można dodać w przyszłości
        rulePerformance: Array.from(ruleStats.entries()).map(([ruleId, stats]) => ({
          ruleId,
          ruleName: stats.name,
          executions: stats.executions,
          successRate: stats.executions > 0 ? (stats.successes / stats.executions) * 100 : 0,
          averageTime: 0,
          lastExecuted: stats.lastExecuted
        })),
        actionStats: Object.fromEntries(
          Object.entries(actionStats).map(([action, stats]) => [
            action,
            {
              count: stats.count,
              successRate: stats.count > 0 ? (stats.successes / stats.count) * 100 : 0
            }
          ])
        )
      };
    } catch (error) {
      this.logger.error('Error getting GTD rule stats:', error);
      throw new Error('Failed to get GTD rule stats');
    }
  }

  /**
   * Testuje regułę GTD na próbnych danych
   */
  async testGTDRule(
    rule: ProcessingRule,
    testData: Record<string, any>,
    organizationId: string,
    userId: string
  ): Promise<{
    conditionsMatched: boolean;
    conditionResults: Array<{
      condition: string;
      matched: boolean;
      actualValue: any;
    }>;
    wouldExecuteActions: string[];
    confidence: number;
  }> {
    try {
      const testContext: StreamsExecutionContext = {
        entityType: 'TASK', // Default for testing
        entityId: 'test',
        entityData: testData,
        organizationId,
        userId,
        triggeredBy: 'MANUAL'
      };

      // Testuj każdy warunek indywidualnie
      const conditionResults: Array<{ condition: string; matched: boolean; actualValue: any }> = [];

      for (const condition of rule.conditions) {
        const actualValue = this.getFieldValue(condition.field, testContext);
        const matched = await this.evaluateCondition(condition, testContext);

        conditionResults.push({
          condition: `${condition.field} ${condition.operator} ${condition.value}`,
          matched,
          actualValue
        });
      }

      const matchedCount = conditionResults.filter(r => r.matched).length;
      const confidence = rule.conditions.length > 0 ? matchedCount / rule.conditions.length : 1.0;

      return {
        conditionsMatched: matchedCount === rule.conditions.length,
        conditionResults,
        wouldExecuteActions: rule.actions.map(action => action.type),
        confidence
      };

    } catch (error) {
      this.logger.error('Error testing GTD rule:', error);
      throw new Error('Failed to test GTD rule');
    }
  }

  /**
   * Wykrywa konflikty między regułami
   * Reguły konfliktują gdy mają podobne warunki ale różne akcje
   */
  async detectRuleConflicts(organizationId: string): Promise<Array<{
    rule1: { id: string; name: string };
    rule2: { id: string; name: string };
    conflictType: 'OVERLAPPING_CONDITIONS' | 'CONTRADICTING_ACTIONS' | 'PRIORITY_COLLISION';
    description: string;
  }>> {
    try {
      const rules = await this.prisma.processingRule.findMany({
        where: { organizationId, active: true },
        select: { id: true, name: true, conditions: true, actions: true, priority: true }
      });

      const conflicts: Array<{
        rule1: { id: string; name: string };
        rule2: { id: string; name: string };
        conflictType: 'OVERLAPPING_CONDITIONS' | 'CONTRADICTING_ACTIONS' | 'PRIORITY_COLLISION';
        description: string;
      }> = [];

      // Porównaj każdą parę reguł
      for (let i = 0; i < rules.length; i++) {
        for (let j = i + 1; j < rules.length; j++) {
          const rule1 = rules[i];
          const rule2 = rules[j];

          const conditions1 = (rule1.conditions as any[]) || [];
          const conditions2 = (rule2.conditions as any[]) || [];
          const actions1 = (rule1.actions as any[]) || [];
          const actions2 = (rule2.actions as any[]) || [];

          // Sprawdź overlapping conditions
          const overlappingFields = conditions1.filter(c1 =>
            conditions2.some(c2 => c1.field === c2.field && c1.operator === c2.operator)
          );

          if (overlappingFields.length > 0) {
            // Sprawdź czy akcje są sprzeczne
            const contradictingActions = actions1.filter(a1 =>
              actions2.some(a2 => {
                // Te same typy akcji z różnymi wartościami = sprzeczność
                if (a1.type === a2.type && a1.type === 'SET_PRIORITY' &&
                    a1.config?.priority !== a2.config?.priority) {
                  return true;
                }
                if (a1.type === a2.type && a1.type === 'MOVE_TO_STREAM' &&
                    a1.config?.streamId !== a2.config?.streamId) {
                  return true;
                }
                return false;
              })
            );

            if (contradictingActions.length > 0) {
              conflicts.push({
                rule1: { id: rule1.id, name: rule1.name },
                rule2: { id: rule2.id, name: rule2.name },
                conflictType: 'CONTRADICTING_ACTIONS',
                description: `Reguły mają podobne warunki ale wykonują sprzeczne akcje: ${contradictingActions.map(a => a.type).join(', ')}`
              });
            } else if (rule1.priority === rule2.priority) {
              conflicts.push({
                rule1: { id: rule1.id, name: rule1.name },
                rule2: { id: rule2.id, name: rule2.name },
                conflictType: 'PRIORITY_COLLISION',
                description: `Reguły mają ten sam priorytet (${rule1.priority}) i pokrywające się warunki`
              });
            } else {
              conflicts.push({
                rule1: { id: rule1.id, name: rule1.name },
                rule2: { id: rule2.id, name: rule2.name },
                conflictType: 'OVERLAPPING_CONDITIONS',
                description: `Reguły mają pokrywające się warunki na polach: ${overlappingFields.map(f => f.field).join(', ')}`
              });
            }
          }
        }
      }

      return conflicts;
    } catch (error) {
      this.logger.error('Error detecting rule conflicts:', error);
      return [];
    }
  }

  /**
   * Pobiera historię wersji reguły (jeśli dostępna)
   */
  async getRuleVersionHistory(ruleId: string): Promise<Array<{
    version: number;
    modifiedAt: Date;
    modifiedBy?: string;
    changes: string;
  }>> {
    // Notatka: Pełne wersjonowanie wymaga dodatkowej tabeli RuleVersion
    // Na razie zwracamy podstawowe informacje
    try {
      const rule = await this.prisma.processingRule.findUnique({
        where: { id: ruleId },
        select: { createdAt: true, updatedAt: true, name: true }
      });

      if (!rule) {
        return [];
      }

      return [
        {
          version: 1,
          modifiedAt: rule.createdAt,
          changes: `Utworzono regułę: ${rule.name}`
        },
        ...(rule.updatedAt > rule.createdAt ? [{
          version: 2,
          modifiedAt: rule.updatedAt,
          changes: `Ostatnia aktualizacja reguły: ${rule.name}`
        }] : [])
      ];
    } catch (error) {
      this.logger.error('Error getting rule version history:', error);
      return [];
    }
  }
}

export default StreamsRuleEngine;