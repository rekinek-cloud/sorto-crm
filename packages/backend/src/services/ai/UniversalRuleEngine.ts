import { PrismaClient } from '@prisma/client';
import logger from '../../config/logger';
import type { 
  CommunicationRule, 
  RuleExecutionContext, 
  RuleExecutionResult,
  RuleCondition,
  RuleAction,
  AIPromptTemplate 
} from '../../types/rules';

const prisma = new PrismaClient();

export class UniversalRuleEngine {
  
  /**
   * Execute rules for a specific module and data
   */
  async executeRules(
    module: string,
    component: string | null,
    data: Record<string, any>,
    trigger: 'manual' | 'automatic' = 'automatic',
    user?: { id: string; role: string; permissions: string[] }
  ): Promise<RuleExecutionResult[]> {
    try {
      const context: RuleExecutionContext = {
        module,
        component,
        data,
        user,
        timestamp: new Date().toISOString(),
        trigger
      };

      // Get applicable rules
      const rules = await this.getApplicableRules(module, component, data);
      
      const results: RuleExecutionResult[] = [];

      for (const rule of rules) {
        if (!rule.enabled) continue;

        const result = await this.executeRule(rule, context);
        results.push(result);

        // Log rule execution
        await this.logRuleExecution(rule.id, context, result);
      }

      return results.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    } catch (error) {
      logger.error('Failed to execute rules:', error);
      throw new Error('Rule execution failed');
    }
  }

  /**
   * Get rules applicable to the current context
   */
  private async getApplicableRules(
    module: string,
    component: string | null,
    data: Record<string, any>
  ): Promise<CommunicationRule[]> {
    // In real implementation, this would query database
    // For now, return example rules for different modules
    
    const allRules: CommunicationRule[] = [
      // Project analysis rules
      {
        id: 'project-smart-analysis',
        name: 'Automatyczna analiza SMART nowych projektów',
        scope: 'global',
        target: ['projects'],
        enabled: true,
        priority: 10,
        conditions: [
          { id: '1', field: 'status', operator: 'equals', value: 'PLANNING', logicalOperator: 'AND' },
          { id: '2', field: 'smartScore', operator: 'notExists', value: null }
        ],
        actions: [
          { id: '1', type: 'aiProcess', params: { analysis: 'smart-score' } },
          { id: '2', type: 'tag', params: { tags: ['needs-review'] } }
        ],
        aiPrompts: [{
          id: 'smart-project-analysis',
          name: 'Analiza SMART projektu',
          template: `Przeanalizuj projekt pod kątem kryteriów SMART:

Nazwa: {projectName}
Opis: {description}
Deadline: {deadline}
Budżet: {budget}
Zespół: {teamSize} osób

Oceń każde kryterium (1-100) i podaj szczegółowe uzasadnienie:
- Specific (Konkretny)
- Measurable (Mierzalny) 
- Achievable (Osiągalny)
- Relevant (Istotny)
- Time-bound (Określony w czasie)

Zasugeruj konkretne ulepszenia dla słabych obszarów.`,
          variables: [
            { name: 'projectName', type: 'string', required: true, description: 'Nazwa projektu' },
            { name: 'description', type: 'string', required: true, description: 'Opis projektu' },
            { name: 'deadline', type: 'string', required: false, description: 'Termin zakończenia' },
            { name: 'budget', type: 'number', required: false, description: 'Budżet projektu' },
            { name: 'teamSize', type: 'number', required: false, description: 'Wielkość zespołu' }
          ],
          modelPreferences: {
            preferredModelId: 'gpt-4',
            temperature: 0.3,
            maxTokens: 1500
          },
          category: 'project-analysis',
          tags: ['smart', 'analysis', 'project-planning']
        }]
      },

      // Task analysis rules
      {
        id: 'task-complexity-analysis',
        name: 'Analiza złożoności dużych zadań',
        scope: 'global',
        target: ['tasks'],
        enabled: true,
        priority: 8,
        conditions: [
          { id: '1', field: 'estimatedHours', operator: 'gte', value: 8, logicalOperator: 'OR' },
          { id: '2', field: 'description.length', operator: 'gte', value: 200 }
        ],
        actions: [
          { id: '1', type: 'aiProcess', params: { analysis: 'task-breakdown' } }
        ],
        aiPrompts: [{
          id: 'task-breakdown-analysis',
          name: 'Analiza podziału zadania',
          template: `Przeanalizuj to zadanie i zasugeruj podział na mniejsze podzadania:

Tytuł: {title}
Opis: {description}
Szacowany czas: {estimatedHours}h
Priorytet: {priority}
Kontekst: {context}

Zasugeruj:
1. Podział na 3-5 mniejszych zadań
2. Kolejność wykonania
3. Zależności między zadaniami
4. Szacowany czas dla każdego podzadania
5. Czy zadanie można wykonać równolegle`,
          variables: [
            { name: 'title', type: 'string', required: true, description: 'Tytuł zadania' },
            { name: 'description', type: 'string', required: true, description: 'Opis zadania' },
            { name: 'estimatedHours', type: 'number', required: false, description: 'Szacowany czas' },
            { name: 'priority', type: 'string', required: false, description: 'Priorytet zadania' },
            { name: 'context', type: 'string', required: false, description: 'Kontekst' }
          ],
          modelPreferences: {
            temperature: 0.4,
            maxTokens: 1200
          },
          category: 'task-analysis',
          tags: ['gtd', 'productivity', 'task-breakdown']
        }]
      },

      // Deal analysis rules
      {
        id: 'deal-risk-analysis',
        name: 'Analiza ryzyka dużych dealów',
        scope: 'module',
        target: ['deals'],
        enabled: true,
        priority: 9,
        conditions: [
          { id: '1', field: 'value', operator: 'gte', value: 50000, logicalOperator: 'AND' },
          { id: '2', field: 'stage', operator: 'in', value: ['QUALIFIED', 'PROPOSAL'] }
        ],
        actions: [
          { id: '1', type: 'aiProcess', params: { analysis: 'risk-assessment' } },
          { id: '2', type: 'notify', params: { recipients: ['sales-manager'], urgency: 'medium' } }
        ],
        aiPrompts: [{
          id: 'deal-risk-assessment',
          name: 'Ocena ryzyka deala',
          template: `Oceń ryzyko tego deala i prawdopodobieństwo zamknięcia:

Klient: {clientName}
Wartość: {value} PLN
Etap: {stage}
Czas w pipeline: {daysInPipeline} dni
Ostatni kontakt: {lastContact}
Historia klienta: {clientHistory}
Konkurencja: {competition}

Przeanalizuj:
1. Prawdopodobieństwo zamknięcia (0-100%)
2. Główne ryzyka i bariery
3. Rekomendowane działania
4. Optymalna strategia negocjacyjna
5. Alternatywne scenariusze`,
          variables: [
            { name: 'clientName', type: 'string', required: true, description: 'Nazwa klienta' },
            { name: 'value', type: 'number', required: true, description: 'Wartość deala' },
            { name: 'stage', type: 'string', required: true, description: 'Etap sprzedaży' },
            { name: 'daysInPipeline', type: 'number', required: false, description: 'Dni w pipeline' },
            { name: 'lastContact', type: 'string', required: false, description: 'Data ostatniego kontaktu' },
            { name: 'clientHistory', type: 'string', required: false, description: 'Historia współpracy' },
            { name: 'competition', type: 'string', required: false, description: 'Informacje o konkurencji' }
          ],
          modelPreferences: {
            temperature: 0.2,
            maxTokens: 1800
          },
          category: 'sales-analysis',
          tags: ['crm', 'sales', 'risk-assessment']
        }]
      },

      // Contact analysis rules
      {
        id: 'contact-engagement-analysis',
        name: 'Analiza zaangażowania kontaktów',
        scope: 'global',
        target: ['contacts'],
        enabled: true,
        priority: 6,
        conditions: [
          { id: '1', field: 'lastContactDays', operator: 'gte', value: 30, logicalOperator: 'AND' },
          { id: '2', field: 'status', operator: 'equals', value: 'ACTIVE' }
        ],
        actions: [
          { id: '1', type: 'aiProcess', params: { analysis: 'engagement-strategy' } }
        ],
        aiPrompts: [{
          id: 'contact-engagement-strategy',
          name: 'Strategia reaktywacji kontaktu',
          template: `Zaproponuj strategię reaktywacji tego kontaktu:

Kontakt: {contactName}
Pozycja: {position}
Firma: {company}
Ostatni kontakt: {lastContactDate}
Historia: {interactionHistory}
Typ relacji: {relationshipType}
Zainteresowania: {interests}

Zasugeruj:
1. Najlepszy sposób nawiązania kontaktu
2. Temat/pretekst do kontaktu
3. Kanał komunikacji (email, telefon, LinkedIn)
4. Timing - kiedy skontaktować się
5. Kolejne kroki budowania relacji`,
          variables: [
            { name: 'contactName', type: 'string', required: true, description: 'Imię i nazwisko' },
            { name: 'position', type: 'string', required: false, description: 'Stanowisko' },
            { name: 'company', type: 'string', required: false, description: 'Firma' },
            { name: 'lastContactDate', type: 'string', required: true, description: 'Data ostatniego kontaktu' },
            { name: 'interactionHistory', type: 'string', required: false, description: 'Historia interakcji' },
            { name: 'relationshipType', type: 'string', required: false, description: 'Typ relacji' },
            { name: 'interests', type: 'string', required: false, description: 'Zainteresowania' }
          ],
          modelPreferences: {
            temperature: 0.6,
            maxTokens: 1000
          },
          category: 'relationship-management',
          tags: ['crm', 'networking', 'engagement']
        }]
      }
    ];

    // Filter rules by module and scope
    return allRules.filter(rule => {
      // Check target module
      const matchesTarget = rule.target.includes(module as any) || rule.target.includes('all');
      
      // Check scope
      const matchesScope = 
        rule.scope === 'global' ||
        (rule.scope === 'module' && this.moduleMatches(module, rule)) ||
        (rule.scope === 'component' && component && this.componentMatches(component, rule));

      return matchesTarget && matchesScope;
    });
  }

  /**
   * Execute a single rule
   */
  private async executeRule(
    rule: CommunicationRule,
    context: RuleExecutionContext
  ): Promise<RuleExecutionResult> {
    const result: RuleExecutionResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      success: false,
      executedActions: [],
      aiResponses: [],
      priority: rule.priority,
      metadata: {
        executionTime: 0,
        context
      }
    };

    const startTime = Date.now();

    try {
      // Check conditions
      const conditionsMet = await this.evaluateConditions(rule.conditions, context.data);
      
      if (!conditionsMet) {
        result.success = false;
        result.metadata.executionTime = Date.now() - startTime;
        return result;
      }

      // Execute actions
      for (const action of rule.actions) {
        try {
          const actionResult = await this.executeAction(action, context);
          result.executedActions.push({
            actionId: action.id,
            type: action.type,
            result: actionResult,
          });
        } catch (error) {
          result.executedActions.push({
            actionId: action.id,
            type: action.type,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Execute AI prompts
      if (rule.aiPrompts) {
        for (const prompt of rule.aiPrompts) {
          try {
            const aiResponse = await this.executeAIPrompt(prompt, context);
            result.aiResponses?.push(aiResponse);
          } catch (error) {
            logger.error('AI prompt execution failed:', error);
          }
        }
      }

      result.success = true;
      result.metadata.executionTime = Date.now() - startTime;

    } catch (error) {
      logger.error('Rule execution failed:', error);
      result.success = false;
      result.metadata.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Evaluate rule conditions against data
   */
  private async evaluateConditions(
    conditions: RuleCondition[],
    data: Record<string, any>
  ): Promise<boolean> {
    if (conditions.length === 0) return true;

    const results: boolean[] = [];
    
    for (const condition of conditions) {
      const value = this.getNestedValue(data, condition.field);
      const conditionResult = this.evaluateCondition(condition, value);
      results.push(conditionResult);
    }

    // Simple AND logic for now (can be extended for complex boolean logic)
    return results.every(r => r);
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: RuleCondition, value: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value);
      case 'gte':
        return Number(value) >= Number(condition.value);
      case 'lt':
        return Number(value) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'notIn':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'exists':
        return value !== undefined && value !== null;
      case 'notExists':
        return value === undefined || value === null;
      case 'regex':
        return new RegExp(condition.value).test(String(value));
      default:
        return false;
    }
  }

  /**
   * Execute rule action
   */
  private async executeAction(
    action: RuleAction,
    context: RuleExecutionContext
  ): Promise<any> {
    switch (action.type) {
      case 'aiProcess':
        return await this.processAIAnalysis(action.params, context);
      
      case 'assign':
        return await this.assignProperties(action.params, context);
      
      case 'tag':
        return await this.addTags(action.params, context);
      
      case 'notify':
        return await this.sendNotification(action.params, context);
      
      case 'createTask':
        return await this.createTask(action.params, context);
      
      case 'webhook':
        return await this.callWebhook(action.params, context);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute AI prompt with variable substitution
   */
  private async executeAIPrompt(
    prompt: AIPromptTemplate,
    context: RuleExecutionContext
  ): Promise<any> {
    // Substitute variables in prompt template
    let processedPrompt = prompt.template;
    
    for (const variable of prompt.variables) {
      const value = this.getNestedValue(context.data, variable.name);
      const placeholder = `{${variable.name}}`;
      processedPrompt = processedPrompt.replace(
        new RegExp(placeholder, 'g'), 
        String(value || variable.defaultValue || '')
      );
    }

    // Here you would call your AI service
    // For now, return mock response
    return {
      promptId: prompt.id,
      modelId: prompt.modelPreferences?.preferredModelId || 'default',
      response: `AI analysis response for: ${processedPrompt.substring(0, 100)}...`,
      tokensUsed: Math.floor(Math.random() * 1000),
      executionTime: Math.floor(Math.random() * 5000)
    };
  }

  /**
   * Helper methods for different action types
   */
  private async processAIAnalysis(params: any, context: RuleExecutionContext): Promise<any> {
    // Implement AI analysis logic
    return { analysis: params.analysis, result: 'completed' };
  }

  private async assignProperties(params: any, context: RuleExecutionContext): Promise<any> {
    // Implement property assignment logic
    return { assigned: params };
  }

  private async addTags(params: any, context: RuleExecutionContext): Promise<any> {
    // Implement tagging logic
    return { tags: params.tags };
  }

  private async sendNotification(params: any, context: RuleExecutionContext): Promise<any> {
    // Implement notification logic
    return { notified: params.recipients };
  }

  private async createTask(params: any, context: RuleExecutionContext): Promise<any> {
    // Implement task creation logic
    return { taskId: `task_${Date.now()}` };
  }

  private async callWebhook(params: any, context: RuleExecutionContext): Promise<any> {
    // Implement webhook call logic
    return { webhookCalled: params.url };
  }

  /**
   * Utility methods
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private moduleMatches(module: string, rule: CommunicationRule): boolean {
    // Add module matching logic
    return true;
  }

  private componentMatches(component: string, rule: CommunicationRule): boolean {
    // Add component matching logic  
    return true;
  }

  private async logRuleExecution(
    ruleId: string,
    context: RuleExecutionContext,
    result: RuleExecutionResult
  ): Promise<void> {
    logger.info('Rule executed', {
      ruleId,
      module: context.module,
      success: result.success,
      executionTime: result.metadata.executionTime
    });
  }
}

export const universalRuleEngine = new UniversalRuleEngine();