import { prisma } from '../../config/database';
import { overlaysService } from '../overlays/overlays.service';
import logger from '../../config/logger';

export interface PlatformModuleInfo {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  url: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  // Purchase status for organization
  isPurchased?: boolean;
  purchasedAt?: Date | null;
  expiresAt?: Date | null;
}

export interface ModulePurchaseResult {
  success: boolean;
  message: string;
  module?: PlatformModuleInfo;
  stripeCheckoutUrl?: string;
}

export class PlatformModulesService {
  /**
   * Get all platform modules (admin only)
   */
  async getAllModules(): Promise<PlatformModuleInfo[]> {
    const modules = await prisma.platformModule.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return modules.map(m => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      description: m.description,
      icon: m.icon,
      type: m.type,
      url: m.url,
      monthlyPrice: Number(m.monthlyPrice),
      yearlyPrice: Number(m.yearlyPrice),
      isActive: m.isActive,
    }));
  }

  /**
   * Get modules available for organization's overlay (add-ons that can be purchased)
   */
  async getAvailableModules(organizationId: string, hostname?: string): Promise<PlatformModuleInfo[]> {
    // Get organization's overlay
    const overlay = await overlaysService.getOrganizationOverlay(organizationId, hostname);

    // Get available addon slugs for this overlay
    const addonSlugs = overlay.availableAddons;

    if (addonSlugs.length === 0) {
      return [];
    }

    // Get modules from database
    const modules = await prisma.platformModule.findMany({
      where: {
        slug: { in: addonSlugs },
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get purchased modules for this organization
    const purchasedModules = await prisma.organizationModule.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        moduleId: true,
        activatedAt: true,
        expiresAt: true,
      },
    });

    const purchasedMap = new Map(
      purchasedModules.map(pm => [pm.moduleId, pm])
    );

    return modules.map(m => {
      const purchased = purchasedMap.get(m.id);
      return {
        id: m.id,
        slug: m.slug,
        name: m.name,
        description: m.description,
        icon: m.icon,
        type: m.type,
        url: m.url,
        monthlyPrice: Number(m.monthlyPrice),
        yearlyPrice: Number(m.yearlyPrice),
        isActive: m.isActive,
        isPurchased: !!purchased,
        purchasedAt: purchased?.activatedAt || null,
        expiresAt: purchased?.expiresAt || null,
      };
    });
  }

  /**
   * Get purchased modules for organization
   */
  async getPurchasedModules(organizationId: string): Promise<PlatformModuleInfo[]> {
    const purchasedModules = await prisma.organizationModule.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        module: true,
      },
      orderBy: {
        activatedAt: 'desc',
      },
    });

    return purchasedModules.map(pm => ({
      id: pm.module.id,
      slug: pm.module.slug,
      name: pm.module.name,
      description: pm.module.description,
      icon: pm.module.icon,
      type: pm.module.type,
      url: pm.module.url,
      monthlyPrice: Number(pm.module.monthlyPrice),
      yearlyPrice: Number(pm.module.yearlyPrice),
      isActive: pm.module.isActive,
      isPurchased: true,
      purchasedAt: pm.activatedAt,
      expiresAt: pm.expiresAt,
    }));
  }

  /**
   * Get module by slug
   */
  async getModuleBySlug(slug: string): Promise<PlatformModuleInfo | null> {
    const module = await prisma.platformModule.findUnique({
      where: { slug },
    });

    if (!module) {
      return null;
    }

    return {
      id: module.id,
      slug: module.slug,
      name: module.name,
      description: module.description,
      icon: module.icon,
      type: module.type,
      url: module.url,
      monthlyPrice: Number(module.monthlyPrice),
      yearlyPrice: Number(module.yearlyPrice),
      isActive: module.isActive,
    };
  }

  /**
   * Get module status for organization
   */
  async getModuleStatus(organizationId: string, moduleSlug: string, hostname?: string): Promise<{
    module: PlatformModuleInfo | null;
    isAvailable: boolean;
    isPurchased: boolean;
    isIncluded: boolean;
    purchasedAt: Date | null;
    expiresAt: Date | null;
  }> {
    const module = await this.getModuleBySlug(moduleSlug);
    if (!module) {
      return {
        module: null,
        isAvailable: false,
        isPurchased: false,
        isIncluded: false,
        purchasedAt: null,
        expiresAt: null,
      };
    }

    // Get overlay
    const overlay = await overlaysService.getOrganizationOverlay(organizationId, hostname);

    // Check if included in overlay (free)
    const isIncluded = overlay.includedModules.includes(moduleSlug);

    // Check if available as addon
    const isAvailable = overlay.availableAddons.includes(moduleSlug);

    // Check if purchased
    const purchased = await prisma.organizationModule.findFirst({
      where: {
        organizationId,
        module: { slug: moduleSlug },
        isActive: true,
      },
    });

    return {
      module,
      isAvailable,
      isPurchased: !!purchased,
      isIncluded,
      purchasedAt: purchased?.activatedAt || null,
      expiresAt: purchased?.expiresAt || null,
    };
  }

  /**
   * Purchase a module for organization
   * For now, directly activates the module (Stripe integration TODO)
   */
  async purchaseModule(organizationId: string, moduleSlug: string, hostname?: string): Promise<ModulePurchaseResult> {
    // Get module
    const module = await prisma.platformModule.findUnique({
      where: { slug: moduleSlug },
    });

    if (!module) {
      return {
        success: false,
        message: `Module '${moduleSlug}' not found`,
      };
    }

    // Get overlay and check if module is available
    const overlay = await overlaysService.getOrganizationOverlay(organizationId, hostname);

    if (!overlay.availableAddons.includes(moduleSlug)) {
      return {
        success: false,
        message: `Module '${moduleSlug}' is not available for your plan`,
      };
    }

    // Check if already purchased (active)
    const existing = await prisma.organizationModule.findFirst({
      where: {
        organizationId,
        moduleId: module.id,
      },
    });

    if (existing?.isActive) {
      return {
        success: false,
        message: `Module '${moduleSlug}' is already active`,
      };
    }

    // TODO: Stripe integration
    // For now, directly activate the module (free trial mode)
    // In production, this would create a Stripe checkout session

    // Create or reactivate organization module
    await prisma.organizationModule.upsert({
      where: {
        organizationId_moduleId: {
          organizationId,
          moduleId: module.id,
        },
      },
      update: {
        isActive: true,
        activatedAt: new Date(),
        // Set expiry to 30 days for trial
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        organizationId,
        moduleId: module.id,
        isActive: true,
        activatedAt: new Date(),
        // Set expiry to 30 days for trial
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`Module '${moduleSlug}' activated for organization ${organizationId} (trial)`);

    return {
      success: true,
      message: `Module '${moduleSlug}' activated successfully (30-day trial)`,
      module: {
        id: module.id,
        slug: module.slug,
        name: module.name,
        description: module.description,
        icon: module.icon,
        type: module.type,
        url: module.url,
        monthlyPrice: Number(module.monthlyPrice),
        yearlyPrice: Number(module.yearlyPrice),
        isActive: module.isActive,
        isPurchased: true,
        purchasedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    };
  }

  /**
   * Cancel/deactivate a module for organization
   */
  async cancelModule(organizationId: string, moduleSlug: string): Promise<{ success: boolean; message: string }> {
    // Get module
    const module = await prisma.platformModule.findUnique({
      where: { slug: moduleSlug },
    });

    if (!module) {
      return {
        success: false,
        message: `Module '${moduleSlug}' not found`,
      };
    }

    // Find active subscription
    const orgModule = await prisma.organizationModule.findFirst({
      where: {
        organizationId,
        moduleId: module.id,
        isActive: true,
      },
    });

    if (!orgModule) {
      return {
        success: false,
        message: `Module '${moduleSlug}' is not active`,
      };
    }

    // TODO: Cancel Stripe subscription if exists

    // Deactivate module
    await prisma.organizationModule.update({
      where: { id: orgModule.id },
      data: { isActive: false },
    });

    logger.info(`Module '${moduleSlug}' deactivated for organization ${organizationId}`);

    return {
      success: true,
      message: `Module '${moduleSlug}' deactivated successfully`,
    };
  }
}

export const platformModulesService = new PlatformModulesService();
