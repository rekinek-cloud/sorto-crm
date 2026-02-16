/**
 * GTDProcessingRuleEngine - Specjalizowany engine do przetwarzania reguł GTD
 * Rozszerza UnifiedRuleEngine o funkcjonalność GTD workflow
 */

import { PrismaClient, StreamRole } from '@prisma/client';
import { UnifiedRuleEngine } from './UnifiedRuleEngine';
import {
  ProcessingRule,
  ProcessingTrigger,
  ProcessingCondition,
  ProcessingAction,
  StreamContext,
  EnergyLevel
} from '../types/streams';

/**
 * Wynik wykonania reguły GTD
 */
export interface GTDRuleExecutionResult {
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
export interface GTDExecutionContext {
  entityType: 'TASK' | 'EMAIL' | 'CONTACT' | 'DEAL' | 'MESSAGE';
  entityId: string;
  entityData: Record<string, any>;
  organizationId: string;
  userId: string;
  triggeredBy: 'MANUAL' | 'AUTOMATIC' | 'SCHEDULED' | 'EMAIL_RECEIVED' | 'TASK_CREATED';
  streamId?: string;
  parentContext?: GTDExecutionContext;
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
export class GTDProcessingRuleEngine extends UnifiedRuleEngine {
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
  async executeGTDRules(context: GTDExecutionContext): Promise<GTDRuleExecutionResult[]> {
    try {
      const startTime = Date.now();
      
      // Pobierz aktywne reguły GTD dla kontekstu
      const rules = await this.getGTDRulesForContext(context);
      
      this.logger.info(`Executing ${rules.length} GTD rules for ${context.entityType}:${context.entityId}`);
      
      const results: GTDRuleExecutionResult[] = [];
      
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
  async executeGTDRule(rule: ProcessingRule, context: GTDExecutionContext): Promise<GTDRuleExecutionResult> {
    const startTime = Date.now();
    const result: GTDRuleExecutionResult = {
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
    context: GTDExecutionContext
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
    context: GTDExecutionContext
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
  private getFieldValue(field: string, context: GTDExecutionContext): any {
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
    context: GTDExecutionContext
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
  private async moveToStream(config: Record<string, any>, context: GTDExecutionContext): Promise<any> {
    const { streamId, reason } = config;
    
    if (!streamId) {
      throw new Error('Stream ID not specified in action config');
    }

    // Sprawdź czy stream istnieje
    const stream = await this.prisma.stream.findUnique({
      where: { id: streamId },
      select: { id: true, name: true, streamRole: true }
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
  private async assignContext(config: Record<string, any>, context: GTDExecutionContext): Promise<any> {
    const { context: gtdContext } = config;
    
    if (!gtdContext || !Object.values(StreamContext).includes(gtdContext)) {
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
  private async setPriority(config: Record<string, any>, context: GTDExecutionContext): Promise<any> {
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
  private async createTask(config: Record<string, any>, context: GTDExecutionContext): Promise<any> {
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
  private async sendNotification(config: Record<string, any>, context: GTDExecutionContext): Promise<any> {
    const { message, type = 'INFO', recipients } = config;
    
    // TODO: Implement actual notification sending
    this.logger.info('GTD Notification sent', {
      message,
      type,
      recipients,
      context: {
        entityType: context.entityType,
        entityId: context.entityId
      }
    });

    return {
      action: 'SEND_NOTIFICATION',
      message,
      type,
      recipients
    };
  }

  /**
   * Utwórz projekt
   */
  private async createProject(config: Record<string, any>, context: GTDExecutionContext): Promise<any> {
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
  private async getGTDRulesForContext(context: GTDExecutionContext): Promise<ProcessingRule[]> {
    try {
      // TODO: Implement actual database query for GTD rules
      // For now, return empty array
      return [];
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
      // TODO: Implement rule statistics update
      this.logger.debug(`Updated rule stats for ${ruleId}: ${success ? 'success' : 'failure'}`);
    } catch (error) {
      this.logger.error('Error updating rule stats:', error);
    }
  }

  /**
   * Pobiera statystyki wykonania reguł GTD
   */
  async getGTDRuleStats(organizationId: string, dateFrom?: Date, dateTo?: Date): Promise<GTDRuleStats> {
    try {
      // TODO: Implement real statistics from database
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        rulePerformance: [],
        actionStats: {}
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
      const testContext: GTDExecutionContext = {
        entityType: 'TASK', // Default for testing
        entityId: 'test',
        entityData: testData,
        organizationId,
        userId,
        triggeredBy: 'MANUAL'
      };

      const conditionsResult = await this.evaluateGTDConditions(rule.conditions, testContext);

      return {
        conditionsMatched: conditionsResult.allMatched,
        conditionResults: rule.conditions.map(condition => ({
          condition: `${condition.field} ${condition.operator} ${condition.value}`,
          matched: true, // TODO: Implement individual condition testing
          actualValue: this.getFieldValue(condition.field, testContext)
        })),
        wouldExecuteActions: rule.actions.map(action => action.type),
        confidence: conditionsResult.confidence
      };

    } catch (error) {
      this.logger.error('Error testing GTD rule:', error);
      throw new Error('Failed to test GTD rule');
    }
  }
}

export default GTDProcessingRuleEngine;