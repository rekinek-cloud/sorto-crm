/**
 * IndustryService - Manages industry templates and organization setup
 */

import { Stream, StreamType } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';

export interface IndustryTemplateData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  category: string;
  streams: StreamConfig[];
  pipelineStages: PipelineStage[];
  taskCategories: string[];
  customFields: CustomFieldConfig[];
  workflows: WorkflowConfig[];
  isActive: boolean;
}

interface StreamConfig {
  name: string;
  role: string;
  color: string;
  description?: string;
}

interface PipelineStage {
  name: string;
  probability: number;
  color: string;
}

interface CustomFieldConfig {
  name: string;
  label: string;
  type: string;
  options?: string[];
}

interface WorkflowConfig {
  name: string;
  trigger: string;
  conditions?: Record<string, any>;
  action: string;
  target?: string;
  template?: string;
  schedule?: string;
  delay?: string;
}

export class IndustryService {
  /**
   * Get all available industry templates
   */
  async getAllTemplates(): Promise<IndustryTemplateData[]> {
    const templates = await prisma.industryTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return templates.map(this.mapTemplate);
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<IndustryTemplateData[]> {
    const templates = await prisma.industryTemplate.findMany({
      where: { isActive: true, category },
      orderBy: { name: 'asc' },
    });

    return templates.map(this.mapTemplate);
  }

  /**
   * Get template by slug
   */
  async getTemplateBySlug(slug: string): Promise<IndustryTemplateData | null> {
    const template = await prisma.industryTemplate.findUnique({
      where: { slug },
    });

    return template ? this.mapTemplate(template) : null;
  }

  /**
   * Apply industry template to organization
   * Creates streams, configures pipeline, sets up custom fields
   */
  async applyTemplate(organizationId: string, templateSlug: string, userId: string): Promise<{
    success: boolean;
    streamsCreated: number;
    pipelineConfigured: boolean;
    message: string;
  }> {
    const template = await this.getTemplateBySlug(templateSlug);

    if (!template) {
      return {
        success: false,
        streamsCreated: 0,
        pipelineConfigured: false,
        message: 'Template not found',
      };
    }

    try {
      // Create streams from template
      const createdStreams = await this.createStreamsFromTemplate(
        organizationId,
        userId,
        template.streams
      );

      // Configure pipeline stages
      await this.configurePipelineStages(organizationId, template.pipelineStages);

      // Store template reference in organization settings
      await this.updateOrganizationSettings(organizationId, {
        industryTemplate: templateSlug,
        taskCategories: template.taskCategories,
        customFields: template.customFields,
        appliedAt: new Date().toISOString(),
      });

      logger.info(`Applied template "${templateSlug}" to organization ${organizationId}`, {
        streamsCreated: createdStreams.length,
        pipelineStages: template.pipelineStages.length,
      });

      return {
        success: true,
        streamsCreated: createdStreams.length,
        pipelineConfigured: true,
        message: `Successfully applied "${template.name}" template`,
      };
    } catch (error) {
      logger.error('Error applying industry template:', error);
      return {
        success: false,
        streamsCreated: 0,
        pipelineConfigured: false,
        message: 'Failed to apply template',
      };
    }
  }

  /**
   * Create streams from template configuration
   */
  private async createStreamsFromTemplate(
    organizationId: string,
    userId: string,
    streamConfigs: StreamConfig[]
  ): Promise<Stream[]> {
    const createdStreams: Stream[] = [];

    for (const config of streamConfigs) {
      const stream = await prisma.stream.create({
        data: {
          name: config.name,
          description: config.description || '',
          color: config.color,
          gtdRole: config.role as any,
          streamType: 'WORKSPACE' as StreamType,
          organizationId,
          createdById: userId,
          gtdConfig: {
            autoProcessing: config.role === 'INBOX',
            reviewFrequency: config.role === 'INBOX' ? 'daily' : 'weekly',
          },
        },
      });
      createdStreams.push(stream);
    }

    return createdStreams;
  }

  /**
   * Configure pipeline stages for deals
   */
  private async configurePipelineStages(
    organizationId: string,
    stages: PipelineStage[]
  ): Promise<void> {
    // Store pipeline configuration in organization settings
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          update: {
            pipelineStages: stages,
          },
        },
      },
    });
  }

  /**
   * Update organization settings with template data
   */
  private async updateOrganizationSettings(
    organizationId: string,
    settings: Record<string, any>
  ): Promise<void> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const currentSettings = (org?.settings as Record<string, any>) || {};
    const newSettings = { ...currentSettings, ...settings };

    await prisma.organization.update({
      where: { id: organizationId },
      data: { settings: newSettings },
    });
  }

  /**
   * Get categories with template counts
   */
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const result = await prisma.industryTemplate.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
    });

    return result.map((r) => ({
      category: r.category,
      count: r._count.category,
    }));
  }

  /**
   * Map database template to DTO
   */
  private mapTemplate(template: any): IndustryTemplateData {
    return {
      id: template.id,
      slug: template.slug,
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      category: template.category,
      streams: template.streams as StreamConfig[],
      pipelineStages: template.pipelineStages as PipelineStage[],
      taskCategories: template.taskCategories as string[],
      customFields: template.customFields as CustomFieldConfig[],
      workflows: template.workflows as WorkflowConfig[],
      isActive: template.isActive,
    };
  }
}

export const industryService = new IndustryService();
