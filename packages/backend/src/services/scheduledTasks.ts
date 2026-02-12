import logger from '../config/logger';
import { prisma } from '../config/database';
import { invoiceService } from './invoiceService';
import { syncTasks, syncProjects, syncContacts, syncDeals, syncCompanies, syncKnowledge, syncMessages, vectorService } from '../routes/vectorSearch';
import { emailPipeline } from './emailPipeline';
import { RuleProcessingPipeline } from './ai/RuleProcessingPipeline';

export class ScheduledTasksService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start all scheduled tasks
   */
  public startAll(): void {
    this.startInvoiceSyncTask();
    this.startRAGReindexTask();
    this.startEmailProcessingTask();
    logger.info('All scheduled tasks started');
  }

  /**
   * Stop all scheduled tasks
   */
  public stopAll(): void {
    this.intervals.forEach((interval, taskName) => {
      clearInterval(interval);
      logger.info(`Stopped scheduled task: ${taskName}`);
    });
    this.intervals.clear();
    logger.info('All scheduled tasks stopped');
  }

  /**
   * Start automatic invoice sync task
   * Runs every 30 minutes
   */
  private startInvoiceSyncTask(): void {
    const taskName = 'invoice-sync';
    const intervalMs = 30 * 60 * 1000; // 30 minutes

    const task = async () => {
      try {
        logger.info('Starting automatic invoice sync task');

        if (!invoiceService.isFakturowniaAvailable()) {
          logger.debug('Fakturownia not available, skipping invoice sync');
          return;
        }

        // Get all organizations that have invoices with auto-sync enabled
        const organizations = await prisma.organization.findMany({
          where: {
            invoices: {
              some: {
                autoSync: true
              }
            }
          },
          select: {
            id: true,
            name: true
          }
        });

        logger.info(`Found ${organizations.length} organizations with auto-sync invoices`);

        for (const org of organizations) {
          try {
            logger.info(`Syncing invoices for organization: ${org.name} (${org.id})`);
            
            const result = await invoiceService.bulkSyncInvoices(org.id, {
              batchSize: 3, // Smaller batches for scheduled tasks
              delayBetweenBatches: 2000, // 2 second delay
              syncOnlyAutoSync: true
            });

            logger.info(`Invoice sync completed for ${org.name}`, {
              organizationId: org.id,
              totalProcessed: result.totalProcessed,
              successful: result.successful,
              failed: result.failed
            });

            // Add delay between organizations
            if (organizations.indexOf(org) < organizations.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
            }

          } catch (error: any) {
            logger.error(`Failed to sync invoices for organization ${org.name}`, {
              organizationId: org.id,
              error: error.message
            });
          }
        }

        logger.info('Automatic invoice sync task completed');
      } catch (error: any) {
        logger.error('Error in automatic invoice sync task', { error: error.message });
      }
    };

    // Run immediately and then on schedule
    task().catch(error => {
      logger.error('Error in initial invoice sync task run', { error: error.message });
    });

    const interval = setInterval(task, intervalMs);
    this.intervals.set(taskName, interval);

    logger.info(`Started ${taskName} task with ${intervalMs / 1000 / 60} minute interval`);
  }

  /**
   * Start Fakturownia import task
   * Runs daily at 2 AM
   */
  public startFakturowniaImportTask(): void {
    const taskName = 'fakturownia-import';

    const scheduleNext = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(2, 0, 0, 0); // 2 AM

      // If it's already past 2 AM today, schedule for tomorrow
      if (now >= next) {
        next.setDate(next.getDate() + 1);
      }

      const msUntilNext = next.getTime() - now.getTime();

      const timeout = setTimeout(async () => {
        try {
          logger.info('Starting daily Fakturownia import task');

          if (!invoiceService.isFakturowniaAvailable()) {
            logger.debug('Fakturownia not available, skipping import');
            scheduleNext(); // Reschedule for next day
            return;
          }

          // Get all organizations
          const organizations = await prisma.organization.findMany({
            select: {
              id: true,
              name: true
            }
          });

          for (const org of organizations) {
            try {
              logger.info(`Importing invoices from Fakturownia for ${org.name}`);
              
              const result = await invoiceService.importInvoicesFromFakturownia(org.id, {
                period: 'last_30_days', // Import last 30 days
                perPage: 50
              });

              logger.info(`Fakturownia import completed for ${org.name}`, {
                organizationId: org.id,
                totalProcessed: result.totalProcessed,
                created: result.created,
                updated: result.updated
              });

              // Delay between organizations
              if (organizations.indexOf(org) < organizations.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
              }

            } catch (error: any) {
              logger.error(`Failed to import from Fakturownia for ${org.name}`, {
                organizationId: org.id,
                error: error.message
              });
            }
          }

          logger.info('Daily Fakturownia import task completed');
        } catch (error: any) {
          logger.error('Error in daily Fakturownia import task', { error: error.message });
        } finally {
          scheduleNext(); // Schedule next run
        }
      }, msUntilNext);

      this.intervals.set(taskName, timeout);
      logger.info(`Scheduled ${taskName} for ${next.toISOString()}`);
    };

    scheduleNext();
  }

  /**
   * Manual trigger for invoice sync
   */
  public async triggerInvoiceSync(organizationId?: string): Promise<void> {
    logger.info('Manually triggering invoice sync', { organizationId });

    if (!invoiceService.isFakturowniaAvailable()) {
      throw new Error('Fakturownia not available');
    }

    if (organizationId) {
      // Sync specific organization
      const result = await invoiceService.bulkSyncInvoices(organizationId);
      logger.info('Manual invoice sync completed', {
        organizationId,
        ...result
      });
    } else {
      // Sync all organizations
      const organizations = await prisma.organization.findMany({
        where: {
          invoices: {
            some: {
              autoSync: true
            }
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      for (const org of organizations) {
        try {
          const result = await invoiceService.bulkSyncInvoices(org.id);
          logger.info(`Manual sync completed for ${org.name}`, {
            organizationId: org.id,
            ...result
          });
        } catch (error: any) {
          logger.error(`Failed manual sync for ${org.name}`, {
            organizationId: org.id,
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Start RAG reindex task
   * Runs every 6 hours to keep vector database in sync with CRM data
   */
  private startRAGReindexTask(): void {
    const taskName = 'rag-reindex';
    const intervalMs = 6 * 60 * 60 * 1000; // 6 hours

    const task = async () => {
      try {
        logger.info('Starting scheduled RAG reindex task');

        const organizations = await prisma.organization.findMany({
          select: { id: true, name: true }
        });

        for (const org of organizations) {
          try {
            const results = {
              tasks: 0, projects: 0, contacts: 0, deals: 0,
              companies: 0, knowledge: 0, streams: 0, messages: 0
            };

            results.tasks = await syncTasks(org.id);
            results.projects = await syncProjects(org.id);
            results.contacts = await syncContacts(org.id);
            results.deals = await syncDeals(org.id);
            results.companies = await syncCompanies(org.id);
            results.knowledge = await syncKnowledge(org.id);
            results.messages = await syncMessages(org.id);

            try {
              const streamResult = await vectorService.indexStreams(org.id);
              results.streams = streamResult.indexed;
            } catch { /* streams may fail silently */ }

            const total = Object.values(results).reduce((a, b) => a + b, 0);
            if (total > 0) {
              logger.info(`RAG reindex for ${org.name}: ${total} new documents indexed`, { organizationId: org.id, ...results });
            }
          } catch (error: any) {
            logger.error(`RAG reindex failed for ${org.name}:`, { error: error.message });
          }
        }

        // Cleanup expired cache
        try {
          await prisma.vector_cache.deleteMany({
            where: { expiresAt: { lt: new Date() } }
          });
        } catch { /* cache cleanup is optional */ }

        logger.info('Scheduled RAG reindex task completed');
      } catch (error: any) {
        logger.error('Error in RAG reindex task:', { error: error.message });
      }
    };

    // First run after 2 minutes (let server fully start)
    setTimeout(() => {
      task().catch(error => {
        logger.error('Error in initial RAG reindex run:', { error: error.message });
      });
    }, 2 * 60 * 1000);

    const interval = setInterval(task, intervalMs);
    this.intervals.set(taskName, interval);

    logger.info(`Started ${taskName} task with ${intervalMs / 1000 / 60 / 60} hour interval`);
  }

  /**
   * Start email processing task
   * Runs every 5 minutes to process unprocessed emails through both pipelines
   */
  private startEmailProcessingTask(): void {
    const taskName = 'email-processing';
    const intervalMs = 5 * 60 * 1000; // 5 minutes

    const task = async () => {
      try {
        const organizations = await prisma.organization.findMany({
          select: { id: true, name: true }
        });

        for (const org of organizations) {
          try {
            // Find unprocessed messages (limit 50 per org per cycle)
            const unprocessed = await prisma.message.findMany({
              where: {
                organizationId: org.id,
                pipelineProcessed: false
              },
              orderBy: { receivedAt: 'desc' },
              take: 50
            });

            if (unprocessed.length === 0) continue;

            logger.info(`[EmailProcessing] Processing ${unprocessed.length} emails for ${org.name}`);
            let processed = 0;

            for (const message of unprocessed) {
              try {
                // Step 1: Email pipeline (PRE_FILTER → CLASSIFY → AI_ANALYSIS)
                const pipelineMessage = {
                  id: message.id,
                  from: message.fromAddress || '',
                  fromName: message.fromName || undefined,
                  to: message.toAddress || '',
                  subject: message.subject || '',
                  body: message.content || '',
                  html: message.htmlContent || undefined,
                  date: message.receivedAt || new Date(),
                  channelId: message.channelId
                };

                const pipelineResult = await emailPipeline.processEmail(pipelineMessage, org.id);

                await prisma.message.update({
                  where: { id: message.id },
                  data: {
                    priority: pipelineResult.priority,
                    category: pipelineResult.category || 'INBOX',
                    isSpam: pipelineResult.isSpam,
                    pipelineProcessed: true,
                    pipelineResult: pipelineResult as any,
                    aiAnalyzed: !pipelineResult.skipAI && !!pipelineResult.aiAnalysis,
                    sentiment: pipelineResult.aiAnalysis?.sentiment,
                    urgencyScore: pipelineResult.aiAnalysis?.urgency
                  }
                });

                // Step 2: RuleProcessingPipeline (CRM → Lists → AI → Actions)
                try {
                  const rulePipeline = new RuleProcessingPipeline(prisma);
                  await rulePipeline.processEntity(org.id, 'EMAIL', message.id, {
                    subject: message.subject || '',
                    content: message.content || '',
                    senderEmail: message.fromAddress || '',
                    senderName: message.fromName || '',
                    receivedAt: message.receivedAt?.toISOString() || new Date().toISOString(),
                  });
                } catch (classErr: any) {
                  // Classification errors are non-fatal
                  logger.warn(`[EmailProcessing] Classification error for ${message.id}: ${classErr.message}`);
                }

                processed++;
              } catch (err: any) {
                logger.error(`[EmailProcessing] Error processing message ${message.id}: ${err.message}`);
              }
            }

            if (processed > 0) {
              logger.info(`[EmailProcessing] Processed ${processed}/${unprocessed.length} emails for ${org.name}`);
            }
          } catch (orgErr: any) {
            logger.error(`[EmailProcessing] Error for org ${org.name}: ${orgErr.message}`);
          }
        }
      } catch (error: any) {
        logger.error('[EmailProcessing] Task error:', { error: error.message });
      }
    };

    // First run after 3 minutes (let server start)
    setTimeout(() => {
      task().catch(error => {
        logger.error('[EmailProcessing] Initial run error:', { error: error.message });
      });
    }, 3 * 60 * 1000);

    const interval = setInterval(task, intervalMs);
    this.intervals.set(taskName, interval);

    logger.info(`Started ${taskName} task with ${intervalMs / 1000 / 60} minute interval`);
  }

  /**
   * Get status of all scheduled tasks
   */
  public getTaskStatus(): { [taskName: string]: { active: boolean; nextRun?: string } } {
    const status: { [taskName: string]: { active: boolean; nextRun?: string } } = {};

    this.intervals.forEach((interval, taskName) => {
      status[taskName] = {
        active: true
      };
    });

    return status;
  }

  /**
   * Clean up old sync errors
   * Removes sync errors older than 7 days
   */
  public async cleanupOldSyncErrors(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await prisma.invoice.updateMany({
        where: {
          syncError: { not: null },
          lastSyncedAt: {
            lt: sevenDaysAgo
          }
        },
        data: {
          syncError: null
        }
      });

      logger.info(`Cleaned up ${result.count} old sync errors`);
    } catch (error: any) {
      logger.error('Failed to clean up old sync errors', { error: error.message });
    }
  }
}

// Export singleton instance
export const scheduledTasksService = new ScheduledTasksService();