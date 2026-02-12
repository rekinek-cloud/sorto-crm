import { prisma } from '../config/database';

interface TemplateStream {
  name: string;
  role: string;
  color: string;
  description?: string;
  children?: TemplateStream[];
}

interface TemplatePipelineStage {
  name: string;
  slug: string;
  probability: number;
  color: string;
  isClosed?: boolean;
  isWon?: boolean;
}

export class IndustryTemplateService {
  /**
   * List all active industry templates
   */
  async listTemplates() {
    return prisma.industryTemplate.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        category: true,
        sortOrder: true,
        modules: true,
      },
    });
  }

  /**
   * Get full template details by slug
   */
  async getTemplate(slug: string) {
    const template = await prisma.industryTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw new Error(`Template "${slug}" not found`);
    }

    return template;
  }

  /**
   * Get the applied template slug for an organization
   */
  async getAppliedTemplate(organizationId: string): Promise<string | null> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    if (!org) return null;

    const settings = org.settings as any;
    return settings?.industrySkin || null;
  }

  /**
   * Apply an industry template to an organization.
   * Creates pipeline stages, streams, and stores skin info in org settings.
   */
  async applyTemplate(organizationId: string, templateSlug: string, userId: string) {
    const template = await this.getTemplate(templateSlug);

    // Check if organization already has pipeline stages
    const existingStages = await prisma.pipelineStage.count({
      where: { organizationId },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Create pipeline stages (replace existing if any)
      if (existingStages > 0) {
        // Check if any deals reference current stages
        const dealsWithStages = await tx.deal.count({
          where: {
            organizationId,
            stageId: { not: null },
          },
        });

        if (dealsWithStages > 0) {
          throw new Error('Cannot replace pipeline stages: organization has deals with assigned stages');
        }

        // Delete existing stages
        await tx.pipelineStage.deleteMany({
          where: { organizationId },
        });
      }

      const pipelineStages = template.pipelineStages as unknown as TemplatePipelineStage[];
      for (let i = 0; i < pipelineStages.length; i++) {
        const stage = pipelineStages[i];
        await tx.pipelineStage.create({
          data: {
            organizationId,
            name: stage.name,
            slug: stage.slug || stage.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            position: i,
            probability: stage.probability,
            color: stage.color,
            isClosed: stage.isClosed ?? false,
            isWon: stage.isWon ?? false,
          },
        });
      }

      // 2. Create streams
      const streams = template.streams as unknown as TemplateStream[];
      for (const stream of streams) {
        await tx.stream.create({
          data: {
            name: stream.name,
            description: stream.description || '',
            color: stream.color,
            streamType: (stream.role as any) || 'CUSTOM',
            templateOrigin: templateSlug,
            organizationId,
            createdById: userId,
          },
        });
      }

      // 3. Update organization settings with skin info
      const currentOrg = await tx.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true },
      });

      const currentSettings = (currentOrg?.settings as any) || {};
      const modules = (template.modules as unknown as string[]) || [];

      await tx.organization.update({
        where: { id: organizationId },
        data: {
          settings: {
            ...currentSettings,
            industrySkin: templateSlug,
            enabledModules: modules,
            onboardingCompleted: true,
          },
        },
      });
    });

    return { success: true, templateSlug };
  }
}

export const industryTemplateService = new IndustryTemplateService();
