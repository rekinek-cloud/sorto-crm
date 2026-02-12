import { prisma } from '../config/database';
import { eventBusService } from '../modules/events/event-bus.service';
import logger from '../config/logger';

export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown' | 'degraded';

interface HealthCheckResult {
  moduleId: string;
  moduleName: string;
  url: string;
  status: HealthStatus;
  responseTime?: number;
  statusCode?: number;
  error?: string;
}

/**
 * Health Check Worker
 *
 * Periodically checks the health of all external platform modules
 * and updates their status in the database.
 */
class HealthCheckWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkIntervalMs = 60 * 1000; // Every minute
  private timeout = 5000; // 5 seconds timeout

  /**
   * Check health of a single module
   */
  async checkModuleHealth(module: {
    id: string;
    name: string;
    healthUrl: string | null;
    url: string | null;
  }): Promise<HealthCheckResult> {
    if (!module.url) {
      return {
        moduleId: module.id,
        moduleName: module.name,
        url: 'N/A',
        status: 'unknown',
        error: 'No URL configured',
      };
    }

    const healthUrl = module.healthUrl || `${module.url}/health`;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Sorto-Platform-HealthCheck/1.0',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let status: HealthStatus;
      if (response.ok) {
        status = responseTime > 3000 ? 'degraded' : 'healthy';
      } else if (response.status >= 500) {
        status = 'unhealthy';
      } else {
        status = 'degraded';
      }

      return {
        moduleId: module.id,
        moduleName: module.name,
        url: healthUrl,
        status,
        responseTime,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        moduleId: module.id,
        moduleName: module.name,
        url: healthUrl,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.name === 'AbortError' ? 'Timeout' : error.message,
      };
    }
  }

  /**
   * Run health checks for all active external modules
   */
  async runHealthChecks(): Promise<HealthCheckResult[]> {
    if (this.isRunning) {
      logger.warn('Health check already running, skipping...');
      return [];
    }

    this.isRunning = true;
    const results: HealthCheckResult[] = [];

    try {
      // Get all active external modules
      const modules = await prisma.platformModule.findMany({
        where: {
          isActive: true,
          type: 'external',
          url: { not: null },
        },
        select: {
          id: true,
          name: true,
          healthUrl: true,
          url: true,
          healthStatus: true,
        },
      });

      if (modules.length === 0) {
        logger.debug('No external modules to check');
        return [];
      }

      logger.info(`Running health checks for ${modules.length} modules...`);

      // Check all modules in parallel (with limit)
      const batchSize = 10;
      for (let i = 0; i < modules.length; i += batchSize) {
        const batch = modules.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((module) => this.checkModuleHealth(module))
        );
        results.push(...batchResults);
      }

      // Update database and publish events
      for (const result of results) {
        const module = modules.find((m) => m.id === result.moduleId);
        const previousStatus = module?.healthStatus;

        // Update module health status
        await prisma.platformModule.update({
          where: { id: result.moduleId },
          data: {
            healthStatus: result.status,
            lastHealthCheck: new Date(),
          },
        });

        // Publish event if status changed
        if (previousStatus && previousStatus !== result.status) {
          await eventBusService.publish({
            type: 'module.health.changed',
            source: 'health-check-worker',
            data: {
              moduleId: result.moduleId,
              moduleName: result.moduleName,
              previousStatus,
              currentStatus: result.status,
              responseTime: result.responseTime,
              statusCode: result.statusCode,
              error: result.error,
            },
            organizationId: '', // System event, no specific org
          });

          // Log status change
          if (result.status === 'unhealthy') {
            logger.error(
              `Module ${result.moduleName} is now UNHEALTHY: ${result.error || 'HTTP ' + result.statusCode}`
            );
          } else if (result.status === 'healthy' && previousStatus === 'unhealthy') {
            logger.info(`Module ${result.moduleName} recovered and is now HEALTHY`);
          }
        }
      }

      // Log summary
      const healthy = results.filter((r) => r.status === 'healthy').length;
      const unhealthy = results.filter((r) => r.status === 'unhealthy').length;
      const degraded = results.filter((r) => r.status === 'degraded').length;

      logger.info(
        `Health check complete: ${healthy} healthy, ${degraded} degraded, ${unhealthy} unhealthy`
      );

      return results;
    } catch (error) {
      logger.error('Error running health checks:', error);
      return results;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the health check worker
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('Health check worker already started');
      return;
    }

    logger.info(`Starting health check worker (interval: ${this.checkIntervalMs / 1000}s)`);

    this.intervalId = setInterval(() => {
      this.runHealthChecks().catch((error) => {
        logger.error('Health check failed:', error);
      });
    }, this.checkIntervalMs);

    // Run initial check after 30 seconds (to let services start up)
    setTimeout(() => {
      this.runHealthChecks().catch((error) => {
        logger.error('Initial health check failed:', error);
      });
    }, 30000);
  }

  /**
   * Stop the health check worker
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Health check worker stopped');
    }
  }

  /**
   * Get current health status of all modules
   */
  async getHealthStatus(): Promise<{
    modules: Array<{
      id: string;
      name: string;
      slug: string;
      url: string | null;
      status: string;
      lastCheck: Date | null;
    }>;
    summary: {
      total: number;
      healthy: number;
      unhealthy: number;
      degraded: number;
      unknown: number;
    };
  }> {
    const modules = await prisma.platformModule.findMany({
      where: { isActive: true, type: 'external' },
      select: {
        id: true,
        name: true,
        slug: true,
        url: true,
        healthStatus: true,
        lastHealthCheck: true,
      },
      orderBy: { name: 'asc' },
    });

    const summary = {
      total: modules.length,
      healthy: modules.filter((m) => m.healthStatus === 'healthy').length,
      unhealthy: modules.filter((m) => m.healthStatus === 'unhealthy').length,
      degraded: modules.filter((m) => m.healthStatus === 'degraded').length,
      unknown: modules.filter(
        (m) => m.healthStatus === 'unknown' || !m.healthStatus
      ).length,
    };

    return {
      modules: modules.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        url: m.url,
        status: m.healthStatus || 'unknown',
        lastCheck: m.lastHealthCheck,
      })),
      summary,
    };
  }

  /**
   * Force check a specific module (manual trigger)
   */
  async checkModule(moduleSlug: string): Promise<HealthCheckResult | null> {
    const module = await prisma.platformModule.findUnique({
      where: { slug: moduleSlug },
      select: {
        id: true,
        name: true,
        healthUrl: true,
        url: true,
      },
    });

    if (!module) {
      return null;
    }

    const result = await this.checkModuleHealth(module);

    // Update in database
    await prisma.platformModule.update({
      where: { id: module.id },
      data: {
        healthStatus: result.status,
        lastHealthCheck: new Date(),
      },
    });

    return result;
  }
}

export const healthCheckWorker = new HealthCheckWorker();
