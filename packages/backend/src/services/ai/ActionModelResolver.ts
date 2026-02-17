import { prisma } from '../../config/database';

export interface ResolvedModel {
  modelName: string;
  fallbackModelName?: string;
}

/**
 * Resolves which AI model to use for a given action code.
 * Queries ai_action_config table for the organization's configuration.
 * Returns null if no config found (caller should use its own default).
 */
export async function resolveModelForAction(
  organizationId: string,
  actionCode: string
): Promise<ResolvedModel | null> {
  try {
    const config = await prisma.ai_action_config.findUnique({
      where: {
        organizationId_actionCode: {
          organizationId,
          actionCode: actionCode as any,
        },
      },
      include: {
        primaryModel: { select: { name: true } },
        fallbackModel: { select: { name: true } },
      },
    });

    if (!config || !config.isActive) return null;

    return {
      modelName: config.primaryModel.name,
      fallbackModelName: config.fallbackModel?.name ?? undefined,
    };
  } catch {
    return null;
  }
}
