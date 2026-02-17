/**
 * PromptManager - Service for loading and compiling AI prompts from database
 *
 * Features:
 * - Load prompts by code from ai_prompt_templates
 * - Support organization-specific overrides
 * - Compile Handlebars-style templates with variables
 * - Cache compiled prompts for performance
 */

import type { ai_prompt_templates } from '@prisma/client';
import Handlebars from 'handlebars';
import { prisma } from '../../config/database';

// Types
export interface PromptTemplate {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  version: number;
  isSystem: boolean;
  systemPrompt: string | null;
  userPromptTemplate: string;
  variables: Record<string, any>;
  defaultModel: string | null;
  defaultTemperature: number;
  maxTokens: number;
  outputSchema: Record<string, any> | null;
}

export interface CompiledPrompt {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface PromptOverride {
  modelOverride?: string | null;
  temperatureOverride?: number | null;
  languageOverride?: string | null;
  customInstructions?: string | null;
}

export interface CompileOptions {
  variables: Record<string, any>;
  organizationId?: string;
  modelOverride?: string;
  temperatureOverride?: number;
}

// Register Handlebars helpers
Handlebars.registerHelper('if', function(this: any, conditional: any, options: any) {
  if (conditional) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper('each', function(this: any, context: any, options: any) {
  if (!context || !Array.isArray(context)) return '';
  return context.map((item, index) => options.fn({ ...item, '@index': index })).join('');
});

Handlebars.registerHelper('json', function(context: any) {
  return JSON.stringify(context, null, 2);
});

// Cache for compiled templates
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

class PromptManagerService {
  /**
   * Get prompt template by code
   */
  async getPromptByCode(code: string, organizationId?: string): Promise<PromptTemplate | null> {
    // Try by code first, then by id (ai_rules.templateId stores UUID)
    const prompt = await prisma.ai_prompt_templates.findFirst({
      where: {
        OR: [
          { code, ...(organizationId ? { organizationId } : {}) },
          { id: code, ...(organizationId ? { organizationId } : {}) },
        ],
        status: 'ACTIVE',
      }
    });

    if (!prompt) {
      return null;
    }

    return this.mapToTemplate(prompt);
  }

  /**
   * Get all prompts for an organization
   */
  async getAllPrompts(organizationId: string, options?: {
    category?: string;
    isSystem?: boolean;
  }): Promise<PromptTemplate[]> {
    const prompts = await prisma.ai_prompt_templates.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        ...(options?.category ? { category: options.category } : {}),
        ...(options?.isSystem !== undefined ? { isSystem: options.isSystem } : {})
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return prompts.map(p => this.mapToTemplate(p));
  }

  /**
   * Get organization-specific overrides for a prompt
   */
  async getOverrides(promptId: string, organizationId: string): Promise<PromptOverride | null> {
    const override = await prisma.ai_prompt_overrides.findUnique({
      where: {
        promptId_organizationId: {
          promptId,
          organizationId
        }
      }
    });

    if (!override || !override.isActive) {
      return null;
    }

    return {
      modelOverride: override.modelOverride,
      temperatureOverride: override.temperatureOverride,
      languageOverride: override.languageOverride,
      customInstructions: override.customInstructions
    };
  }

  /**
   * Compile a prompt template with variables
   */
  async compilePrompt(code: string, options: CompileOptions): Promise<CompiledPrompt | null> {
    const { variables, organizationId, modelOverride, temperatureOverride } = options;

    // Get prompt template
    const prompt = await this.getPromptByCode(code, organizationId);
    if (!prompt) {
      console.error(`[PromptManager] Prompt not found: ${code}`);
      return null;
    }

    // Get organization overrides if available
    let overrides: PromptOverride | null = null;
    if (organizationId) {
      overrides = await this.getOverrides(prompt.id, organizationId);
    }

    // Compile system prompt
    const systemPrompt = this.compileTemplate(
      prompt.systemPrompt || '',
      variables,
      overrides?.customInstructions
    );

    // Compile user prompt
    const userPrompt = this.compileTemplate(
      prompt.userPromptTemplate,
      variables
    );

    // Determine final model and temperature
    const model = modelOverride || overrides?.modelOverride || prompt.defaultModel || 'gpt-4o-mini';
    const temperature = temperatureOverride ?? overrides?.temperatureOverride ?? prompt.defaultTemperature;

    return {
      systemPrompt,
      userPrompt,
      model,
      temperature,
      maxTokens: prompt.maxTokens
    };
  }

  /**
   * Compile a Handlebars template string with variables
   */
  private compileTemplate(
    template: string,
    variables: Record<string, any>,
    customInstructions?: string | null
  ): string {
    if (!template) return '';

    // Get or create compiled template
    let compiledTemplate = templateCache.get(template);
    if (!compiledTemplate) {
      try {
        compiledTemplate = Handlebars.compile(template, { noEscape: true });
        templateCache.set(template, compiledTemplate);
      } catch (error) {
        console.error('[PromptManager] Template compilation error:', error);
        // Fallback to simple variable replacement
        return this.simpleReplace(template, variables);
      }
    }

    // Execute template
    let result = compiledTemplate(variables);

    // Append custom instructions if provided
    if (customInstructions) {
      result += `\n\n## DODATKOWE INSTRUKCJE\n${customInstructions}`;
    }

    return result;
  }

  /**
   * Simple variable replacement fallback
   */
  private simpleReplace(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), stringValue);
    }
    return result;
  }

  /**
   * Map database record to PromptTemplate interface
   */
  private mapToTemplate(prompt: ai_prompt_templates): PromptTemplate {
    return {
      id: prompt.id,
      code: prompt.code || '',
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      version: prompt.version,
      isSystem: prompt.isSystem,
      systemPrompt: prompt.systemPrompt,
      userPromptTemplate: prompt.userPromptTemplate,
      variables: prompt.variables as Record<string, any>,
      defaultModel: prompt.defaultModel,
      defaultTemperature: prompt.defaultTemperature,
      maxTokens: prompt.maxTokens,
      outputSchema: prompt.outputSchema as Record<string, any> | null
    };
  }

  /**
   * Save a new version of a prompt (for versioning)
   */
  async savePromptVersion(
    promptId: string,
    changedById: string,
    changeReason?: string
  ): Promise<void> {
    const prompt = await prisma.ai_prompt_templates.findUnique({
      where: { id: promptId }
    });

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Get current max version
    const lastVersion = await prisma.ai_prompt_versions.findFirst({
      where: { promptId },
      orderBy: { version: 'desc' }
    });

    const newVersion = (lastVersion?.version || 0) + 1;

    // Create version record
    await prisma.ai_prompt_versions.create({
      data: {
        promptId,
        version: newVersion,
        systemPrompt: prompt.systemPrompt,
        userPromptTemplate: prompt.userPromptTemplate,
        variables: prompt.variables,
        changedById,
        changeReason
      }
    });

    // Update prompt version number
    await prisma.ai_prompt_templates.update({
      where: { id: promptId },
      data: { version: newVersion }
    });
  }

  /**
   * Restore a specific version of a prompt
   */
  async restoreVersion(
    promptId: string,
    version: number,
    restoredById: string
  ): Promise<void> {
    const versionRecord = await prisma.ai_prompt_versions.findUnique({
      where: {
        promptId_version: {
          promptId,
          version
        }
      }
    });

    if (!versionRecord) {
      throw new Error(`Version ${version} not found`);
    }

    // Save current as new version before restoring
    await this.savePromptVersion(promptId, restoredById, `Przed przywróceniem wersji ${version}`);

    // Update prompt with old version content
    await prisma.ai_prompt_templates.update({
      where: { id: promptId },
      data: {
        systemPrompt: versionRecord.systemPrompt,
        userPromptTemplate: versionRecord.userPromptTemplate,
        variables: versionRecord.variables
      }
    });
  }

  /**
   * Get version history for a prompt
   */
  async getVersionHistory(promptId: string): Promise<any[]> {
    return prisma.ai_prompt_versions.findMany({
      where: { promptId },
      orderBy: { version: 'desc' },
      include: {
        changedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Test a prompt with sample data
   */
  async testPrompt(
    code: string,
    testData: Record<string, any>,
    organizationId: string
  ): Promise<CompiledPrompt | null> {
    return this.compilePrompt(code, {
      variables: testData,
      organizationId
    });
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    templateCache.clear();
  }
}

// Export singleton instance
export const PromptManager = new PromptManagerService();
export default PromptManager;
