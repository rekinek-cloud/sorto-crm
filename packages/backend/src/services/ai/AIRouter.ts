import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { BaseAIProvider, AIRequest, AIResponse } from './providers/BaseProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { HuggingFaceProvider } from './providers/HuggingFaceProvider';
import { DeepSeekProvider } from './providers/DeepSeekProvider';
import { QwenProvider } from './providers/QwenProvider';

interface AIRouterConfig {
  organizationId: string;
  prisma: PrismaClient;
}

interface ProcessingContext {
  triggerType: string;
  triggerData: any;
  organizationId: string;
  userId?: string;
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  required: boolean;
  enumValues?: string[];
  defaultValue?: any;
}

export class AIRouter {
  private prisma: PrismaClient;
  private organizationId: string;
  private providers: Map<string, BaseAIProvider> = new Map();

  constructor(config: AIRouterConfig) {
    this.prisma = config.prisma;
    this.organizationId = config.organizationId;
  }

  /**
   * Initialize providers from database configuration
   */
  async initializeProviders(): Promise<void> {
    console.log('INITIALIZING AI PROVIDERS FOR ORG:', this.organizationId);
    
    const providers = await this.prisma.ai_providers.findMany({
      where: {
        organizationId: this.organizationId,
        status: 'ACTIVE'
      },
      include: {
        ai_models: {
          where: { status: 'ACTIVE' }
        }
      },
      orderBy: { priority: 'asc' }
    });

    console.log('FOUND PROVIDERS:', providers.length, providers.map(p => p.name));

    for (const providerConfig of providers) {
      try {
        console.log(`🔌 Initializing ${providerConfig.name} provider...`);
        const provider = this.createProviderInstance(providerConfig);
        if (provider && provider.isConfigValid()) {
          this.providers.set(providerConfig.name, provider);
          console.log(`✅ ${providerConfig.name} provider initialized successfully`);
        } else {
          console.log(`ℹ️ ${providerConfig.name} provider skipped (no API key configured)`);
        }
      } catch (error) {
        console.error(`Failed to initialize provider ${providerConfig.name}:`, error);
      }
    }
    
    console.log(`🎯 Total initialized providers: ${this.providers.size}`);
    console.log(`📝 Available providers:`, Array.from(this.providers.keys()));
  }

  /**
   * Process a trigger event through AI rules
   */
  async processTrigger(context: ProcessingContext): Promise<any[]> {
    const results: any[] = [];

    // Find matching rules
    const rules = await this.findMatchingRules(context);

    for (const rule of rules) {
      try {
        // Check rate limits
        if (!(await this.checkRateLimit(rule))) {
          console.warn(`Rate limit exceeded for rule ${rule.name}`);
          continue;
        }

        const result = await this.executeRule(rule, context);
        results.push(result);

        // Update rule statistics
        await this.updateRuleStats(rule.id, true);

      } catch (error) {
        console.error(`Failed to execute rule ${rule.name}:`, error);
        await this.updateRuleStats(rule.id, false, error);
        results.push({
          ruleId: rule.id,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Execute a single AI request
   */
  async executeAIRequest(
    modelId: string,
    request: AIRequest,
    context?: ProcessingContext
  ): Promise<AIResponse> {
    // Get model configuration
    const model = await this.prisma.ai_models.findUnique({
      where: { id: modelId },
      include: { ai_providers: true }
    });

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const provider = this.providers.get(model.ai_providers.name);
    if (!provider) {
      throw new Error(`Provider ${model.ai_providers.name} not available`);
    }

    // Execute request
    const startTime = Date.now();
    let response: AIResponse;

    try {
      response = await provider.generateCompletion({
        ...request,
        model: model.name,
        config: {
          ...(model.config as any),
          ...request.config
        }
      });

      // Log execution
      await this.logExecution({
        ruleId: null,
        providerId: model.ai_providers.id,
        modelId: model.id,
        templateId: null,
        inputData: context?.triggerData || {},
        promptSent: JSON.stringify(request.messages),
        responseReceived: response.content,
        parsedOutput: response,
        status: 'SUCCESS',
        executionTime: response.executionTime,
        tokensUsed: response.usage.totalTokens,
        cost: response.cost,
        organizations: { connect: { id: this.organizationId } }
      });

      return response;

    } catch (error) {
      // Log failed execution
      await this.logExecution({
        ruleId: null,
        providerId: model.ai_providers.id,
        modelId: model.id,
        templateId: null,
        inputData: context?.triggerData || {},
        promptSent: JSON.stringify(request.messages),
        responseReceived: null,
        parsedOutput: null,
        status: 'FAILED',
        executionTime: Date.now() - startTime,
        tokensUsed: null,
        cost: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        organizations: { connect: { id: this.organizationId } }
      });

      throw error;
    }
  }

  /**
   * Find rules that match the trigger context
   */
  private async findMatchingRules(context: ProcessingContext): Promise<any[]> {
    const rules = await this.prisma.ai_rules.findMany({
      where: {
        organizationId: this.organizationId,
        status: 'ACTIVE',
        triggerType: context.triggerType as any
      },
      include: {
        ai_prompt_templates: true,
        ai_models: {
          include: { ai_providers: true }
        }
      },
      orderBy: { priority: 'asc' }
    });

    // Filter rules based on trigger conditions
    const matchingRules = [];
    for (const rule of rules) {
      if (this.evaluateConditions(rule.triggerConditions, context)) {
        matchingRules.push(rule);
      }
    }

    return matchingRules;
  }

  /**
   * Execute a specific rule
   */
  private async executeRule(rule: any, context: ProcessingContext): Promise<any> {
    const startTime = Date.now();

    try {
      // Prepare AI request from template
      const aiRequest = await this.buildAIRequest(rule, context);

      // Get provider
      const provider = this.providers.get(rule.ai_models.ai_providers.name);
      if (!provider) {
        throw new Error(`Provider ${rule.ai_models.ai_providers.name} not available`);
      }

      // Execute with fallback chain
      let response: AIResponse;
      const modelsToTry = [rule.ai_models.id, ...rule.fallbackModelIds];

      for (const modelId of modelsToTry) {
        try {
          response = await this.executeAIRequest(modelId, aiRequest, context);
          break;
        } catch (error) {
          console.warn(`Model ${modelId} failed, trying next:`, error);
          if (modelId === modelsToTry[modelsToTry.length - 1]) {
            throw error; // Last model failed
          }
        }
      }

      // Execute actions based on AI response
      const actionResults = await this.executeActions(rule.actions, response!, context);

      // Log successful execution
      await this.logExecution({
        ruleId: rule.id,
        providerId: rule.ai_models.ai_providers.id,
        modelId: rule.ai_models.id,
        templateId: rule.ai_prompt_templates?.id || null,
        inputData: context.triggerData,
        promptSent: JSON.stringify(aiRequest.messages),
        responseReceived: response!.content,
        parsedOutput: response,
        status: 'SUCCESS',
        executionTime: Date.now() - startTime,
        tokensUsed: response!.usage.totalTokens,
        cost: response!.cost,
        actionsExecuted: actionResults,
        organizationId: this.organizationId
      });

      return {
        ruleId: rule.id,
        status: 'SUCCESS',
        response: response!,
        actions: actionResults
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Build AI request from rule and template
   */
  private async buildAIRequest(rule: any, context: ProcessingContext): Promise<AIRequest> {
    if (!rule.ai_prompt_templates) {
      throw new Error(`Rule ${rule.name} has no associated template`);
    }

    // Extract variables from context
    const variables = this.extractVariables(rule.ai_prompt_templates.variables, context);

    // Replace template variables
    const userPrompt = this.replaceTemplateVariables(rule.ai_prompt_templates.userPromptTemplate, variables);

    const messages = [];
    
    if (rule.ai_prompt_templates.systemPrompt) {
      messages.push({
        role: 'system' as const,
        content: this.replaceTemplateVariables(rule.ai_prompt_templates.systemPrompt, variables)
      });
    }

    messages.push({
      role: 'user' as const,
      content: userPrompt
    });

    return {
      model: rule.ai_models.name,
      messages,
      config: rule.ai_models.config
    };
  }

  /**
   * Execute actions based on AI response
   */
  private async executeActions(actions: any, response: AIResponse, context: ProcessingContext): Promise<any> {
    const results: any = {};

    for (const [actionType, actionConfig] of Object.entries(actions)) {
      try {
        switch (actionType) {
          case 'createTask':
            if (actionConfig) {
              results.taskCreated = await this.createTaskFromResponse(response, context);
            }
            break;

          case 'updateContact':
            if (actionConfig && typeof actionConfig === 'object') {
              results.contactUpdated = await this.updateContactFromResponse(response, actionConfig, context);
            }
            break;

          case 'sendNotification':
            if (actionConfig) {
              results.notificationSent = await this.sendNotification(response, context);
            }
            break;

          case 'createDeal':
            if (actionConfig && typeof actionConfig === 'object') {
              results.dealCreated = await this.createDealFromResponse(response, actionConfig, context);
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to execute action ${actionType}:`, error);
        results[`${actionType}_error`] = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return results;
  }

  // Helper methods for actions - create ai_suggestions entries for human review
  private async createTaskFromResponse(response: AIResponse, context: ProcessingContext): Promise<string> {
    const startTime = Date.now();
    const suggestionId = crypto.randomUUID();

    let parsedContent: any = {};
    try {
      parsedContent = JSON.parse(response.content);
    } catch {
      parsedContent = { rawContent: response.content };
    }

    const suggestion = {
      type: 'CREATE_TASK',
      title: parsedContent.title || parsedContent.taskName || `Task from AI analysis`,
      description: parsedContent.description || parsedContent.summary || response.content,
      priority: parsedContent.priority || 'MEDIUM',
      dueDate: parsedContent.dueDate || null,
      assigneeId: parsedContent.assigneeId || context.userId || null,
      tags: parsedContent.tags || [],
      estimatedTime: parsedContent.estimatedTime || null,
    };

    await this.prisma.ai_suggestions.create({
      data: {
        id: suggestionId,
        user_id: context.userId || 'system',
        organization_id: context.organizationId,
        context: 'CREATE_TASK',
        input_data: {
          aiResponseId: response.id,
          model: response.model,
          content: response.content,
          triggerType: context.triggerType,
          triggerData: context.triggerData,
        },
        suggestion: suggestion,
        confidence: parsedContent.confidence ?? 75,
        reasoning: parsedContent.reasoning || `AI model ${response.model} suggested creating a task based on ${context.triggerType} trigger.`,
        status: 'PENDING',
        processing_time_ms: Date.now() - startTime,
      },
    });

    return suggestionId;
  }

  private async updateContactFromResponse(response: AIResponse, config: any, context: ProcessingContext): Promise<boolean> {
    const startTime = Date.now();
    const suggestionId = crypto.randomUUID();

    let parsedContent: any = {};
    try {
      parsedContent = JSON.parse(response.content);
    } catch {
      parsedContent = { rawContent: response.content };
    }

    const suggestion = {
      type: 'UPDATE_CONTACT',
      contactId: config.contactId || parsedContent.contactId || null,
      fieldsToUpdate: parsedContent.fieldsToUpdate || parsedContent.updates || {},
      newTags: parsedContent.newTags || [],
      newNotes: parsedContent.notes || parsedContent.summary || null,
      sentiment: parsedContent.sentiment || null,
      leadScore: parsedContent.leadScore || null,
    };

    await this.prisma.ai_suggestions.create({
      data: {
        id: suggestionId,
        user_id: context.userId || 'system',
        organization_id: context.organizationId,
        context: 'UPDATE_CONTACT',
        input_data: {
          aiResponseId: response.id,
          model: response.model,
          content: response.content,
          actionConfig: config,
          triggerType: context.triggerType,
          triggerData: context.triggerData,
        },
        suggestion: suggestion,
        confidence: parsedContent.confidence ?? 70,
        reasoning: parsedContent.reasoning || `AI model ${response.model} suggested updating contact data based on ${context.triggerType} analysis.`,
        status: 'PENDING',
        processing_time_ms: Date.now() - startTime,
      },
    });

    return true;
  }

  private async sendNotification(response: AIResponse, context: ProcessingContext): Promise<boolean> {
    const startTime = Date.now();
    const suggestionId = crypto.randomUUID();

    let parsedContent: any = {};
    try {
      parsedContent = JSON.parse(response.content);
    } catch {
      parsedContent = { rawContent: response.content };
    }

    const suggestion = {
      type: 'SEND_NOTIFICATION',
      recipientId: parsedContent.recipientId || context.userId || null,
      channel: parsedContent.channel || 'in_app',
      subject: parsedContent.subject || parsedContent.title || 'AI Notification',
      message: parsedContent.message || parsedContent.summary || response.content,
      priority: parsedContent.priority || 'NORMAL',
      actionUrl: parsedContent.actionUrl || null,
    };

    await this.prisma.ai_suggestions.create({
      data: {
        id: suggestionId,
        user_id: context.userId || 'system',
        organization_id: context.organizationId,
        context: 'SEND_NOTIFICATION',
        input_data: {
          aiResponseId: response.id,
          model: response.model,
          content: response.content,
          triggerType: context.triggerType,
          triggerData: context.triggerData,
        },
        suggestion: suggestion,
        confidence: parsedContent.confidence ?? 80,
        reasoning: parsedContent.reasoning || `AI model ${response.model} suggested sending a notification based on ${context.triggerType} trigger.`,
        status: 'PENDING',
        processing_time_ms: Date.now() - startTime,
      },
    });

    return true;
  }

  private async createDealFromResponse(response: AIResponse, config: any, context: ProcessingContext): Promise<string> {
    const startTime = Date.now();
    const suggestionId = crypto.randomUUID();

    let parsedContent: any = {};
    try {
      parsedContent = JSON.parse(response.content);
    } catch {
      parsedContent = { rawContent: response.content };
    }

    const suggestion = {
      type: 'CREATE_DEAL',
      title: parsedContent.title || parsedContent.dealName || 'New Deal from AI',
      value: parsedContent.value || parsedContent.amount || config.defaultValue || null,
      currency: parsedContent.currency || config.currency || 'PLN',
      stage: parsedContent.stage || config.defaultStage || 'LEAD',
      contactId: parsedContent.contactId || config.contactId || null,
      companyId: parsedContent.companyId || config.companyId || null,
      probability: parsedContent.probability || null,
      expectedCloseDate: parsedContent.expectedCloseDate || null,
      notes: parsedContent.notes || parsedContent.summary || null,
    };

    await this.prisma.ai_suggestions.create({
      data: {
        id: suggestionId,
        user_id: context.userId || 'system',
        organization_id: context.organizationId,
        context: 'CREATE_DEAL',
        input_data: {
          aiResponseId: response.id,
          model: response.model,
          content: response.content,
          actionConfig: config,
          triggerType: context.triggerType,
          triggerData: context.triggerData,
        },
        suggestion: suggestion,
        confidence: parsedContent.confidence ?? 65,
        reasoning: parsedContent.reasoning || `AI model ${response.model} suggested creating a deal based on ${context.triggerType} analysis.`,
        status: 'PENDING',
        processing_time_ms: Date.now() - startTime,
      },
    });

    return suggestionId;
  }

  // Utility methods
  private createProviderInstance(config: any): BaseAIProvider | null {
    try {
      switch (config.name) {
        case 'OpenAI':
          return new OpenAIProvider(config.config, config.limits);
        case 'Anthropic':
        case 'Claude':  // Support both names
          return new AnthropicProvider(config.config, config.limits);
        case 'HuggingFace':
          return new HuggingFaceProvider(config.config, config.limits);
        case 'DeepSeek':
          return new DeepSeekProvider(config.config, config.limits);
        case 'Qwen':
          return new QwenProvider(config.config, config.limits);
        default:
          console.warn(`Unknown provider type: ${config.name}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to create provider ${config.name}:`, error);
      return null;
    }
  }

  private evaluateConditions(conditions: any, context: ProcessingContext): boolean {
    // Implement condition evaluation logic
    // This should evaluate the JSON conditions against the context
    return true; // Placeholder
  }

  private extractVariables(variableDefinitions: any, context: ProcessingContext): Record<string, any> {
    const variables: Record<string, any> = {};
    
    for (const [name, definition] of Object.entries(variableDefinitions)) {
      // Extract variable values from context based on definition
      // This is a simplified implementation
      variables[name] = context.triggerData[name] || (definition as any).defaultValue;
    }

    return variables;
  }

  private replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [name, value] of Object.entries(variables)) {
      const placeholder = `{{${name}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return result;
  }

  private async checkRateLimit(rule: any): Promise<boolean> {
    // Implement rate limiting check
    // Check maxExecutionsPerHour and maxExecutionsPerDay
    return true; // Placeholder
  }

  private async updateRuleStats(ruleId: string, success: boolean, error?: any): Promise<void> {
    const updateData: any = {
      executionCount: { increment: 1 },
      lastExecuted: new Date()
    };

    if (success) {
      updateData.successCount = { increment: 1 };
    } else {
      updateData.errorCount = { increment: 1 };
    }

    await this.prisma.ai_rules.update({
      where: { id: ruleId },
      data: updateData
    });
  }

  private async logExecution(executionData: any): Promise<void> {
    try {
      const now = new Date();

      // Build create data with proper Prisma relations
      const createData: any = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        inputData: executionData.inputData || {},
        promptSent: executionData.promptSent || '',
        responseReceived: executionData.responseReceived,
        parsedOutput: executionData.parsedOutput,
        status: executionData.status,
        executionTime: executionData.executionTime,
        tokensUsed: executionData.tokensUsed,
        cost: executionData.cost,
        errorMessage: executionData.errorMessage,
        errorCode: executionData.errorCode,
        createdAt: now,
        updatedAt: now,
        organizations: executionData.organizations
      };

      // Add optional relations only if IDs are provided
      if (executionData.providerId) {
        createData.ai_providers = { connect: { id: executionData.providerId } };
      }
      if (executionData.modelId) {
        createData.ai_models = { connect: { id: executionData.modelId } };
      }
      if (executionData.ruleId) {
        createData.ai_rules = { connect: { id: executionData.ruleId } };
      }
      if (executionData.templateId) {
        createData.ai_prompt_templates = { connect: { id: executionData.templateId } };
      }

      await this.prisma.ai_executions.create({
        data: createData
      });
    } catch (error) {
      // Log error but don't fail the main request
      console.error('Failed to log AI execution:', error);
    }
  }

  /**
   * Simple request processor - uses requested model or first available model
   * This is a convenience method for FlowEngine and other services
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    // Get available provider names from initialized providers
    const availableProviderNames = Array.from(this.providers.keys());

    console.log('🔍 processRequest - available providers:', availableProviderNames);
    console.log('🔍 processRequest - requested model:', request.model);

    // If specific model requested, try to find it
    if (request.model) {
      const requestedModel = await this.prisma.ai_models.findFirst({
        where: {
          name: request.model,
          ai_providers: {
            organizationId: this.organizationId,
            status: 'ACTIVE',
            name: { in: availableProviderNames }
          },
          status: 'ACTIVE'
        },
        include: { ai_providers: true }
      });

      if (requestedModel) {
        console.log(`✅ Using requested model: ${request.model} (provider: ${requestedModel.ai_providers.name})`);
        return this.executeAIRequest(requestedModel.id, request);
      }
      console.log(`⚠️ Requested model ${request.model} not available, falling back to first available`);
    }

    // Find first available model from initialized providers
    const model = await this.prisma.ai_models.findFirst({
      where: {
        ai_providers: {
          organizationId: this.organizationId,
          status: 'ACTIVE',
          name: { in: availableProviderNames }
        },
        status: 'ACTIVE'
      },
      include: { ai_providers: true },
      orderBy: { ai_providers: { priority: 'asc' } }
    });

    if (!model) {
      throw new Error(`No AI model available. Initialized providers: ${availableProviderNames.join(', ') || 'none'}`);
    }

    console.log(`✅ Using fallback model: ${model.name} (provider: ${model.ai_providers.name})`);
    return this.executeAIRequest(model.id, request);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if any provider is available
   */
  hasAvailableProviders(): boolean {
    return this.providers.size > 0;
  }
}
