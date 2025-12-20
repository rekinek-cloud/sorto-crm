import { PrismaClient } from '@prisma/client';

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';
  required: boolean;
  description?: string;
  enumValues?: string[];
  defaultValue?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

interface TemplateDefinition {
  name: string;
  description?: string;
  category: string;
  systemPrompt?: string;
  userPromptTemplate: string;
  variables: Record<string, TemplateVariable>;
  outputSchema?: any;
  examples?: Array<{
    name: string;
    variables: Record<string, any>;
    expectedOutput?: string;
  }>;
}

export class TemplateManager {
  private prisma: PrismaClient;
  private organizationId: string;

  constructor(prisma: PrismaClient, organizationId: string) {
    this.prisma = prisma;
    this.organizationId = organizationId;
  }

  /**
   * Create a new prompt template
   */
  async createTemplate(template: TemplateDefinition): Promise<string> {
    // Validate template
    this.validateTemplate(template);

    const created = await this.prisma.aIPromptTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        category: template.category,
        systemPrompt: template.systemPrompt,
        userPromptTemplate: template.userPromptTemplate,
        variables: template.variables as any,
        outputSchema: template.outputSchema as any,
        organizationId: this.organizationId,
        status: 'ACTIVE'
      }
    });

    return created.id;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, updates: Partial<TemplateDefinition>): Promise<void> {
    const existing = await this.prisma.aIPromptTemplate.findUnique({
      where: { id: templateId, organizationId: this.organizationId }
    });

    if (!existing) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Create new version
    const newVersion = existing.version + 1;

    await this.prisma.aIPromptTemplate.create({
      data: {
        name: existing.name,
        description: updates.description ?? existing.description,
        category: updates.category ?? existing.category,
        version: newVersion,
        systemPrompt: updates.systemPrompt ?? existing.systemPrompt,
        userPromptTemplate: updates.userPromptTemplate ?? existing.userPromptTemplate,
        variables: (updates.variables ?? existing.variables) as any,
        outputSchema: (updates.outputSchema ?? existing.outputSchema) as any,
        organizationId: this.organizationId,
        status: 'ACTIVE'
      }
    });

    // Archive old version
    await this.prisma.aIPromptTemplate.update({
      where: { id: templateId },
      data: { status: 'ARCHIVED' }
    });
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<any> {
    return await this.prisma.aIPromptTemplate.findUnique({
      where: { id: templateId, organizationId: this.organizationId }
    });
  }

  /**
   * List templates with filtering
   */
  async listTemplates(filters: {
    category?: string;
    status?: string;
    search?: string;
  } = {}): Promise<any[]> {
    const where: any = { organizationId: this.organizationId };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return await this.prisma.aIPromptTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
        { version: 'desc' }
      ]
    });
  }

  /**
   * Render template with variables
   */
  renderTemplate(template: any, variables: Record<string, any>): {
    systemPrompt?: string;
    userPrompt: string;
    validationErrors: string[];
  } {
    const validationErrors = this.validateVariables(template.variables, variables);
    
    const systemPrompt = template.systemPrompt 
      ? this.replaceVariables(template.systemPrompt, variables)
      : undefined;
    
    const userPrompt = this.replaceVariables(template.userPromptTemplate, variables);

    return {
      systemPrompt,
      userPrompt,
      validationErrors
    };
  }

  /**
   * Test template with example data
   */
  async testTemplate(templateId: string, testVariables: Record<string, any>): Promise<{
    rendered: { systemPrompt?: string; userPrompt: string };
    validationErrors: string[];
    estimatedTokens: number;
  }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const rendered = this.renderTemplate(template, testVariables);
    const estimatedTokens = this.estimateTokens(rendered.systemPrompt, rendered.userPrompt);

    return {
      rendered: {
        systemPrompt: rendered.systemPrompt,
        userPrompt: rendered.userPrompt
      },
      validationErrors: rendered.validationErrors,
      estimatedTokens
    };
  }

  /**
   * Get template categories
   */
  async getCategories(): Promise<string[]> {
    const result = await this.prisma.aIPromptTemplate.findMany({
      where: { organizationId: this.organizationId },
      select: { category: true },
      distinct: ['category']
    });

    return result.map(r => r.category).filter(Boolean) as string[];
  }

  /**
   * Clone template
   */
  async cloneTemplate(templateId: string, newName: string): Promise<string> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const cloned = await this.prisma.aIPromptTemplate.create({
      data: {
        name: newName,
        description: `Cloned from ${template.name}`,
        category: template.category,
        systemPrompt: template.systemPrompt,
        userPromptTemplate: template.userPromptTemplate,
        variables: template.variables,
        outputSchema: template.outputSchema,
        organizationId: this.organizationId,
        status: 'DRAFT'
      }
    });

    return cloned.id;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    // Check if template is used by any rules
    const usedByRules = await this.prisma.aIRule.count({
      where: { templateId, organizationId: this.organizationId }
    });

    if (usedByRules > 0) {
      throw new Error(`Template is used by ${usedByRules} rules and cannot be deleted`);
    }

    await this.prisma.aIPromptTemplate.delete({
      where: { id: templateId, organizationId: this.organizationId }
    });
  }

  /**
   * Import default templates
   */
  async importDefaultTemplates(): Promise<void> {
    const defaultTemplates = this.getDefaultTemplates();

    for (const template of defaultTemplates) {
      try {
        // Check if template already exists
        const existing = await this.prisma.aIPromptTemplate.findFirst({
          where: {
            name: template.name,
            organizationId: this.organizationId
          }
        });

        if (!existing) {
          await this.createTemplate(template);
          console.log(`Imported template: ${template.name}`);
        }
      } catch (error) {
        console.error(`Failed to import template ${template.name}:`, error);
      }
    }
  }

  // Private methods
  private validateTemplate(template: TemplateDefinition): void {
    if (!template.name?.trim()) {
      throw new Error('Template name is required');
    }

    if (!template.userPromptTemplate?.trim()) {
      throw new Error('User prompt template is required');
    }

    if (!template.category?.trim()) {
      throw new Error('Template category is required');
    }

    // Validate that all variables in template are defined
    const usedVariables = this.extractVariablesFromTemplate(template.userPromptTemplate);
    if (template.systemPrompt) {
      usedVariables.push(...this.extractVariablesFromTemplate(template.systemPrompt));
    }

    const definedVariables = Object.keys(template.variables || {});
    const undefinedVariables = usedVariables.filter(v => !definedVariables.includes(v));

    if (undefinedVariables.length > 0) {
      throw new Error(`Undefined variables in template: ${undefinedVariables.join(', ')}`);
    }
  }

  private validateVariables(variableDefinitions: Record<string, TemplateVariable>, values: Record<string, any>): string[] {
    const errors: string[] = [];

    for (const [name, definition] of Object.entries(variableDefinitions)) {
      const value = values[name];

      // Check required
      if (definition.required && (value === undefined || value === null || value === '')) {
        errors.push(`Variable '${name}' is required`);
        continue;
      }

      if (value === undefined || value === null) {
        continue; // Skip validation for optional undefined values
      }

      // Type validation
      switch (definition.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Variable '${name}' must be a string`);
          } else {
            if (definition.validation?.minLength && value.length < definition.validation.minLength) {
              errors.push(`Variable '${name}' must be at least ${definition.validation.minLength} characters`);
            }
            if (definition.validation?.maxLength && value.length > definition.validation.maxLength) {
              errors.push(`Variable '${name}' must be at most ${definition.validation.maxLength} characters`);
            }
            if (definition.validation?.pattern && !new RegExp(definition.validation.pattern).test(value)) {
              errors.push(`Variable '${name}' does not match required pattern`);
            }
          }
          break;

        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Variable '${name}' must be a number`);
          } else {
            if (definition.validation?.min !== undefined && value < definition.validation.min) {
              errors.push(`Variable '${name}' must be at least ${definition.validation.min}`);
            }
            if (definition.validation?.max !== undefined && value > definition.validation.max) {
              errors.push(`Variable '${name}' must be at most ${definition.validation.max}`);
            }
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Variable '${name}' must be a boolean`);
          }
          break;

        case 'enum':
          if (definition.enumValues && !definition.enumValues.includes(value)) {
            errors.push(`Variable '${name}' must be one of: ${definition.enumValues.join(', ')}`);
          }
          break;
      }
    }

    return errors;
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [name, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{\\s*${name}\\s*}}`, 'g');
      result = result.replace(placeholder, String(value ?? ''));
    }

    return result;
  }

  private extractVariablesFromTemplate(template: string): string[] {
    const regex = /{{\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*}}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  private estimateTokens(systemPrompt?: string, userPrompt?: string): number {
    const text = (systemPrompt || '') + (userPrompt || '');
    // Rough estimation: 4 characters per token
    return Math.ceil(text.length / 4);
  }

  private getDefaultTemplates(): TemplateDefinition[] {
    return [
      {
        name: 'Email Analysis',
        description: 'Analyze email content for sentiment, urgency, and action items',
        category: 'ANALYSIS',
        systemPrompt: 'You are an AI assistant that analyzes emails to extract key information. Respond with structured JSON only.',
        userPromptTemplate: `Analyze this email and extract the following information:

Email: {{emailContent}}
From: {{senderEmail}}
Subject: {{subject}}

Please analyze and return JSON with:
1. sentiment: "positive", "negative", or "neutral"
2. urgencyScore: number from 0-100
3. actionItems: array of action items mentioned
4. priority: "LOW", "MEDIUM", "HIGH", or "URGENT"
5. category: suggested category for this email
6. responseRequired: boolean if response is needed
7. deadline: extracted deadline if any (ISO date format)`,
        variables: {
          emailContent: {
            name: 'emailContent',
            type: 'string',
            required: true,
            description: 'The content of the email to analyze'
          },
          senderEmail: {
            name: 'senderEmail',
            type: 'string',
            required: true,
            description: 'Email address of the sender'
          },
          subject: {
            name: 'subject',
            type: 'string',
            required: true,
            description: 'Subject line of the email'
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
            urgencyScore: { type: 'number', minimum: 0, maximum: 100 },
            actionItems: { type: 'array', items: { type: 'string' } },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            category: { type: 'string' },
            responseRequired: { type: 'boolean' },
            deadline: { type: 'string', format: 'date-time' }
          }
        }
      },
      {
        name: 'Task SMART Analysis',
        description: 'Analyze task descriptions for SMART criteria compliance',
        category: 'ANALYSIS',
        systemPrompt: 'You are an AI assistant that evaluates tasks against SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound). Provide constructive feedback.',
        userPromptTemplate: `Analyze this task against SMART criteria:

Task: {{taskTitle}}
Description: {{taskDescription}}
Context: {{context}}

Evaluate each SMART criterion (0-10 scale) and provide:
1. specific_score: How specific is the task?
2. specific_feedback: What could make it more specific?
3. measurable_score: How measurable are the outcomes?
4. measurable_feedback: How could success be better measured?
5. achievable_score: How realistic is this task?
6. achievable_feedback: What resources or changes are needed?
7. relevant_score: How relevant is this to the goals?
8. relevant_feedback: How does this align with priorities?
9. timebound_score: How well-defined is the timeline?
10. timebound_feedback: What timeline improvements are needed?
11. overall_score: Overall SMART score (0-100)
12. improvement_suggestions: Array of actionable improvements`,
        variables: {
          taskTitle: {
            name: 'taskTitle',
            type: 'string',
            required: true,
            description: 'The title of the task to analyze'
          },
          taskDescription: {
            name: 'taskDescription',
            type: 'string',
            required: false,
            description: 'Detailed description of the task'
          },
          context: {
            name: 'context',
            type: 'string',
            required: false,
            description: 'Additional context about the task'
          }
        }
      },
      {
        name: 'Meeting Summary',
        description: 'Generate meeting summary with action items',
        category: 'GENERATION',
        systemPrompt: 'You are an AI assistant that creates structured meeting summaries with clear action items and follow-ups.',
        userPromptTemplate: `Create a meeting summary from this transcript:

Meeting: {{meetingTitle}}
Date: {{meetingDate}}
Participants: {{participants}}
Transcript: {{transcript}}

Generate a structured summary with:
1. key_decisions: Important decisions made
2. action_items: Specific tasks assigned with owners
3. follow_ups: Items requiring follow-up
4. next_meeting: Suggested next meeting date/agenda
5. summary: Brief overall summary`,
        variables: {
          meetingTitle: {
            name: 'meetingTitle',
            type: 'string',
            required: true,
            description: 'Title of the meeting'
          },
          meetingDate: {
            name: 'meetingDate',
            type: 'string',
            required: true,
            description: 'Date of the meeting'
          },
          participants: {
            name: 'participants',
            type: 'string',
            required: true,
            description: 'List of meeting participants'
          },
          transcript: {
            name: 'transcript',
            type: 'string',
            required: true,
            description: 'Meeting transcript or notes'
          }
        }
      }
    ];
  }
}