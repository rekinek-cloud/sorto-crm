import { prisma } from '../../config/database';
import {
  DEFAULT_OVERLAYS,
  getDefaultOverlay,
  getDefaultFallbackOverlay,
  getOverlayForDomain,
  IndustryOverlayConfig,
  NavigationItem,
} from '../../config/overlays';
import logger from '../../config/logger';

export interface OverlayWithModules {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  includedModules: string[];
  availableAddons: string[];
  hiddenModules: string[];
  navigation: NavigationItem[];
  primaryColor: string;
  logo: string | null;
  basePrice: number | null;
  isDefault: boolean;
  isActive: boolean;
}

export class OverlaysService {
  /**
   * Get all available overlays (from DB + defaults)
   */
  async getAllOverlays(): Promise<OverlayWithModules[]> {
    // Get overlays from database
    const dbOverlays = await prisma.industryOverlay.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Merge with defaults (DB takes precedence)
    const overlayMap = new Map<string, OverlayWithModules>();

    // Add defaults first
    for (const def of DEFAULT_OVERLAYS) {
      overlayMap.set(def.slug, {
        id: `default-${def.slug}`,
        slug: def.slug,
        name: def.name,
        description: def.description || null,
        includedModules: def.includedModules,
        availableAddons: def.availableAddons,
        hiddenModules: def.hiddenModules,
        navigation: JSON.parse(JSON.stringify(def.navigation)),
        primaryColor: def.primaryColor,
        logo: def.logo || null,
        basePrice: def.basePrice,
        isDefault: def.isDefault || false,
        isActive: true,
      });
    }

    // Override with DB entries
    for (const db of dbOverlays) {
      overlayMap.set(db.slug, {
        id: db.id,
        slug: db.slug,
        name: db.name,
        description: db.description,
        includedModules: db.includedModules,
        availableAddons: db.availableAddons,
        hiddenModules: db.hiddenModules,
        navigation: db.navigation as unknown as NavigationItem[],
        primaryColor: db.primaryColor,
        logo: db.logo,
        basePrice: db.basePrice ? Number(db.basePrice) : null,
        isDefault: db.isDefault,
        isActive: db.isActive,
      });
    }

    return Array.from(overlayMap.values());
  }

  /**
   * Get overlay by slug (DB first, then defaults)
   */
  async getOverlayBySlug(slug: string): Promise<OverlayWithModules | null> {
    // Try database first
    const dbOverlay = await prisma.industryOverlay.findUnique({
      where: { slug },
    });

    if (dbOverlay) {
      return {
        id: dbOverlay.id,
        slug: dbOverlay.slug,
        name: dbOverlay.name,
        description: dbOverlay.description,
        includedModules: dbOverlay.includedModules,
        availableAddons: dbOverlay.availableAddons,
        hiddenModules: dbOverlay.hiddenModules,
        navigation: dbOverlay.navigation as unknown as NavigationItem[],
        primaryColor: dbOverlay.primaryColor,
        logo: dbOverlay.logo,
        basePrice: dbOverlay.basePrice ? Number(dbOverlay.basePrice) : null,
        isDefault: dbOverlay.isDefault,
        isActive: dbOverlay.isActive,
      };
    }

    // Fall back to defaults
    const defaultOverlay = getDefaultOverlay(slug);
    if (defaultOverlay) {
      return {
        id: `default-${defaultOverlay.slug}`,
        slug: defaultOverlay.slug,
        name: defaultOverlay.name,
        description: defaultOverlay.description || null,
        includedModules: defaultOverlay.includedModules,
        availableAddons: defaultOverlay.availableAddons,
        hiddenModules: defaultOverlay.hiddenModules,
        navigation: JSON.parse(JSON.stringify(defaultOverlay.navigation)),
        primaryColor: defaultOverlay.primaryColor,
        logo: defaultOverlay.logo || null,
        basePrice: defaultOverlay.basePrice,
        isDefault: defaultOverlay.isDefault || false,
        isActive: true,
      };
    }

    return null;
  }

  /**
   * Get overlay for domain (if domain-specific mapping exists)
   */
  async getOverlayByDomain(hostname: string): Promise<OverlayWithModules | null> {
    const overlaySlug = getOverlayForDomain(hostname);
    if (!overlaySlug) {
      return null; // No domain-specific overlay
    }

    return this.getOverlayBySlug(overlaySlug);
  }

  /**
   * Get current overlay for organization
   * Priority: 1) Organization's explicit overlay, 2) Domain mapping, 3) Default
   */
  async getOrganizationOverlay(organizationId: string, hostname?: string): Promise<OverlayWithModules> {
    // First, check if organization has an explicitly set overlay
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { overlay: true },
    });

    // If organization has an explicit overlay, use it (highest priority)
    if (organization?.overlay) {
      return {
        id: organization.overlay.id,
        slug: organization.overlay.slug,
        name: organization.overlay.name,
        description: organization.overlay.description,
        includedModules: organization.overlay.includedModules,
        availableAddons: organization.overlay.availableAddons,
        hiddenModules: organization.overlay.hiddenModules,
        navigation: organization.overlay.navigation as unknown as NavigationItem[],
        primaryColor: organization.overlay.primaryColor,
        logo: organization.overlay.logo,
        basePrice: organization.overlay.basePrice ? Number(organization.overlay.basePrice) : null,
        isDefault: organization.overlay.isDefault,
        isActive: organization.overlay.isActive,
      };
    }

    // Second, check if domain has a specific overlay
    if (hostname) {
      const domainOverlay = await this.getOverlayByDomain(hostname);
      if (domainOverlay) {
        return domainOverlay;
      }
    }

    // Return default overlay
    const defaultOverlay = getDefaultFallbackOverlay();
    return {
      id: `default-${defaultOverlay.slug}`,
      slug: defaultOverlay.slug,
      name: defaultOverlay.name,
      description: defaultOverlay.description || null,
      includedModules: defaultOverlay.includedModules,
      availableAddons: defaultOverlay.availableAddons,
      hiddenModules: defaultOverlay.hiddenModules,
      navigation: JSON.parse(JSON.stringify(defaultOverlay.navigation)),
      primaryColor: defaultOverlay.primaryColor,
      logo: defaultOverlay.logo || null,
      basePrice: defaultOverlay.basePrice,
      isDefault: defaultOverlay.isDefault || false,
      isActive: true,
    };
  }

  /**
   * Set overlay for organization
   */
  async setOrganizationOverlay(organizationId: string, overlaySlug: string): Promise<void> {
    // Get or create overlay in DB
    let overlay = await prisma.industryOverlay.findUnique({
      where: { slug: overlaySlug },
    });

    if (!overlay) {
      // Create from defaults if not exists
      const defaultOverlay = getDefaultOverlay(overlaySlug);
      if (!defaultOverlay) {
        throw new Error(`Overlay '${overlaySlug}' not found`);
      }

      overlay = await prisma.industryOverlay.create({
        data: {
          slug: defaultOverlay.slug,
          name: defaultOverlay.name,
          description: defaultOverlay.description,
          includedModules: defaultOverlay.includedModules,
          availableAddons: defaultOverlay.availableAddons,
          hiddenModules: defaultOverlay.hiddenModules,
          navigation: JSON.parse(JSON.stringify(defaultOverlay.navigation)),
          primaryColor: defaultOverlay.primaryColor,
          logo: defaultOverlay.logo,
          basePrice: defaultOverlay.basePrice,
          isDefault: defaultOverlay.isDefault || false,
        },
      });

      logger.info(`Created overlay '${overlaySlug}' from defaults`);
    }

    // Update organization
    await prisma.organization.update({
      where: { id: organizationId },
      data: { overlayId: overlay.id },
    });

    logger.info(`Set overlay '${overlaySlug}' for organization ${organizationId}`);
  }

  /**
   * Check if module is visible for organization's overlay
   */
  async isModuleVisible(organizationId: string, moduleSlug: string): Promise<boolean> {
    const overlay = await this.getOrganizationOverlay(organizationId);

    // Hidden modules are never visible
    if (overlay.hiddenModules.includes(moduleSlug)) {
      return false;
    }

    // Included modules are always visible
    if (overlay.includedModules.includes(moduleSlug)) {
      return true;
    }

    // Add-on modules are visible only if purchased
    if (overlay.availableAddons.includes(moduleSlug)) {
      const purchased = await prisma.organizationModule.findFirst({
        where: {
          organizationId,
          isActive: true,
          module: { slug: moduleSlug },
        },
      });
      return !!purchased;
    }

    return false;
  }

  /**
   * Get navigation for organization (filtered by visible modules)
   */
  async getOrganizationNavigation(organizationId: string): Promise<NavigationItem[]> {
    const overlay = await this.getOrganizationOverlay(organizationId);

    // Get purchased add-on modules
    const purchasedModules = await prisma.organizationModule.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        module: { select: { slug: true } },
      },
    });

    const purchasedSlugs = new Set(purchasedModules.map(pm => pm.module.slug));

    // Filter navigation based on visible modules
    const visibleModules = new Set([
      ...overlay.includedModules,
      ...overlay.availableAddons.filter(slug => purchasedSlugs.has(slug)),
    ]);

    // For now, return full navigation
    // In future, can filter based on visibleModules
    return overlay.navigation;
  }

  /**
   * Seed default overlays to database
   */
  async seedDefaultOverlays(): Promise<void> {
    for (const def of DEFAULT_OVERLAYS) {
      const existing = await prisma.industryOverlay.findUnique({
        where: { slug: def.slug },
      });

      if (!existing) {
        await prisma.industryOverlay.create({
          data: {
            slug: def.slug,
            name: def.name,
            description: def.description,
            includedModules: def.includedModules,
            availableAddons: def.availableAddons,
            hiddenModules: def.hiddenModules,
            navigation: JSON.parse(JSON.stringify(def.navigation)),
            primaryColor: def.primaryColor,
            logo: def.logo,
            basePrice: def.basePrice,
            isDefault: def.isDefault || false,
          },
        });
        logger.info(`Seeded overlay: ${def.slug}`);
      }
    }
  }
}

export const overlaysService = new OverlaysService();
