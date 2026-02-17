import logger from '../config/logger';
import { prisma } from '../config/database';
import { invoiceService } from './invoiceService';
import { syncTasks, syncProjects, syncContacts, syncDeals, syncCompanies, syncKnowledge, syncMessages, vectorService } from '../routes/vectorSearch';
import { RuleProcessingPipeline } from './ai/RuleProcessingPipeline';
import { PipelineConfigLoader } from './ai/PipelineConfigLoader';
import { DEFAULT_PIPELINE_CONFIG } from './ai/PipelineConfigDefaults';
import { emailService } from './emailService';
import { getFlowEngine } from '../routes/flow';

export class ScheduledTasksService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start all scheduled tasks
   */
  public startAll(): void {
    this.startInvoiceSyncTask();
    this.startRAGReindexTask();
    this.startEmailProcessingTask();
    this.startEmailSyncTask();
    this.startAutopilotDigestTask();
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
    const intervalMs = DEFAULT_PIPELINE_CONFIG.scheduling.invoiceSyncInterval;

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
              batchSize: DEFAULT_PIPELINE_CONFIG.scheduling.invoiceBatchSize,
              delayBetweenBatches: DEFAULT_PIPELINE_CONFIG.scheduling.invoiceBatchDelay,
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
              await new Promise(resolve => setTimeout(resolve, DEFAULT_PIPELINE_CONFIG.scheduling.invoiceOrgDelay));
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
                await new Promise(resolve => setTimeout(resolve, DEFAULT_PIPELINE_CONFIG.scheduling.importOrgDelay));
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
    const intervalMs = DEFAULT_PIPELINE_CONFIG.scheduling.ragReindexInterval;

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

    // First run after startup delay (let server fully start)
    setTimeout(() => {
      task().catch(error => {
        logger.error('Error in initial RAG reindex run:', { error: error.message });
      });
    }, DEFAULT_PIPELINE_CONFIG.scheduling.ragStartupDelay);

    const interval = setInterval(task, intervalMs);
    this.intervals.set(taskName, interval);

    logger.info(`Started ${taskName} task with ${intervalMs / 1000 / 60 / 60} hour interval`);
  }

  /**
   * Start email processing task
   * Runs every 5 minutes to process unprocessed emails through RuleProcessingPipeline
   */
  private startEmailProcessingTask(): void {
    const taskName = 'email-processing';
    const intervalMs = DEFAULT_PIPELINE_CONFIG.scheduling.emailProcessingInterval;

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
              take: DEFAULT_PIPELINE_CONFIG.scheduling.emailBatchSize
            });

            if (unprocessed.length === 0) continue;

            logger.info(`[EmailProcessing] Processing ${unprocessed.length} emails for ${org.name}`);
            let processed = 0;

            const rulePipeline = new RuleProcessingPipeline(prisma);

            for (const message of unprocessed) {
              try {
                // Unified pipeline: RuleProcessingPipeline (CRM → Lists → AI Rules → AI → Post-actions)
                const result = await rulePipeline.processEntity(org.id, 'EMAIL', message.id, {
                  from: message.fromAddress || '',
                  fromName: message.fromName || '',
                  subject: message.subject || '',
                  body: message.content || '',
                  bodyHtml: message.htmlContent || '',
                  senderName: message.fromName || '',
                });

                const updateData: any = {
                  pipelineProcessed: true,
                  aiAnalyzed: true,
                  category: result.finalClass,
                  isSpam: result.finalClass === 'SPAM',
                };

                const ruleActions = result.stages?.ruleMatch?.actions;
                if (ruleActions?.setPriority) {
                  updateData.priority = ruleActions.setPriority;
                } else if (result.finalClass === 'BUSINESS' && result.finalConfidence > 0.8) {
                  updateData.priority = 'HIGH';
                }

                if (result.sentiment) updateData.sentiment = result.sentiment;
                if (result.urgencyScore) updateData.urgencyScore = result.urgencyScore;

                updateData.pipelineResult = {
                  classification: result.finalClass,
                  confidence: result.finalConfidence,
                  actionsExecuted: result.actionsExecuted,
                  linkedEntities: result.linkedEntities,
                  addedToRag: result.actionsExecuted?.includes('ADDED_TO_RAG'),
                  addedToFlow: result.actionsExecuted?.includes('ADDED_TO_FLOW'),
                };

                await prisma.message.update({
                  where: { id: message.id },
                  data: updateData,
                });

                // FlowEngine integration — create InboxItem for actionable emails
                try {
                  if (result.finalClass !== 'SPAM' && message.content && message.content.length >= 10) {
                    const existingItem = await prisma.inboxItem.findFirst({
                      where: {
                        organizationId: org.id,
                        sourceType: 'EMAIL',
                        source: message.fromAddress || '',
                        content: { startsWith: `[${message.subject || ''}]` }
                      },
                      select: { id: true }
                    });

                    if (!existingItem) {
                      const orgUser = await prisma.user.findFirst({
                        where: { organizationId: org.id },
                        select: { id: true }
                      });

                      if (orgUser) {
                        const inboxItem = await prisma.inboxItem.create({
                          data: {
                            content: `[${message.subject || 'Bez tematu'}] ${message.content.slice(0, 2000)}`,
                            sourceType: 'EMAIL',
                            source: message.fromAddress || 'unknown',
                            elementType: 'EMAIL',
                            rawContent: message.content.slice(0, 5000),
                            urgencyScore: result.urgencyScore || 0,
                            actionable: true,
                            flowStatus: 'PENDING',
                            organizationId: org.id,
                            capturedById: orgUser.id,
                            contactId: message.contactId || undefined,
                            companyId: message.companyId || undefined,
                          }
                        });

                        getFlowEngine(org.id).then(engine => {
                          engine.processSourceItem({
                            organizationId: org.id,
                            userId: orgUser.id,
                            inboxItemId: inboxItem.id,
                            autoExecute: false,
                          }).catch(flowErr => {
                            logger.warn(`[EmailProcessing] FlowEngine error for message ${message.id}: ${flowErr.message}`);
                          });
                        }).catch(flowErr => {
                          logger.warn(`[EmailProcessing] FlowEngine init error: ${flowErr.message}`);
                        });
                      }
                    }
                  }
                } catch (flowErr: any) {
                  logger.warn(`[EmailProcessing] FlowEngine step error for ${message.id}: ${flowErr.message}`);
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

    // First run after startup delay (let server start)
    setTimeout(() => {
      task().catch(error => {
        logger.error('[EmailProcessing] Initial run error:', { error: error.message });
      });
    }, DEFAULT_PIPELINE_CONFIG.scheduling.emailStartupDelay);

    const interval = setInterval(task, intervalMs);
    this.intervals.set(taskName, interval);

    logger.info(`Started ${taskName} task with ${intervalMs / 1000 / 60} minute interval`);
  }

  /**
   * Start automatic IMAP email sync task
   * Fetches new emails from all active email accounts every 5 minutes
   */
  private startEmailSyncTask(): void {
    const taskName = 'email-sync';
    const intervalMs = 5 * 60 * 1000; // 5 minutes
    const startupDelay = 2 * 60 * 1000; // 2 minutes

    const task = async () => {
      try {
        // Query active EMAIL channels from communication_channels (same table as manual sync)
        const emailChannels = await prisma.communicationChannel.findMany({
          where: {
            type: 'EMAIL',
            active: true,
            config: { not: { equals: null } }
          },
          select: { id: true, name: true }
        });

        if (emailChannels.length === 0) return;

        let synced = 0;
        let totalNew = 0;

        for (const channel of emailChannels) {
          try {
            const result = await emailService.syncMessages(channel.id);
            if (result.syncedCount > 0) {
              totalNew += result.syncedCount;
              synced++;
            }
            if (result.errors.length > 0) {
              logger.warn(`[EmailSync] Channel ${channel.name}: ${result.errors.join(', ')}`);
            }
          } catch (err: any) {
            logger.error(`[EmailSync] Failed to sync channel ${channel.name}: ${err.message}`);
          }
        }

        logger.info(`[EmailSync] Synced ${synced}/${emailChannels.length} channels, ${totalNew} new messages`);
      } catch (error: any) {
        logger.error('[EmailSync] Task error:', { error: error.message });
      }
    };

    setTimeout(() => {
      task().catch(error => {
        logger.error('[EmailSync] Initial run error:', { error: error.message });
      });
    }, startupDelay);

    const interval = setInterval(task, intervalMs);
    this.intervals.set(taskName, interval);

    logger.info(`Started ${taskName} task with 5 minute interval (first run in 2 min)`);
  }

  /**
   * Start autopilot daily digest task
   * Sends email summary of autopilot actions at 18:00 daily
   */
  private startAutopilotDigestTask(): void {
    const taskName = 'autopilot-digest';

    const scheduleNext = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(18, 0, 0, 0);

      if (now >= next) {
        next.setDate(next.getDate() + 1);
      }

      const msUntilNext = next.getTime() - now.getTime();

      const timeout = setTimeout(async () => {
        try {
          logger.info('[AutopilotDigest] Starting daily digest');

          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          // Find all autopilot actions today
          const autopilotActions = await prisma.flow_processing_history.findMany({
            where: {
              startedAt: { gte: todayStart },
            },
            include: {
              user: { select: { id: true, email: true, firstName: true } }
            }
          });

          if (autopilotActions.length === 0) {
            logger.info('[AutopilotDigest] No autopilot actions today, skipping digest');
            scheduleNext();
            return;
          }

          // Group by user
          const byUser = new Map<string, typeof autopilotActions>();
          for (const action of autopilotActions) {
            const userId = action.userId;
            if (!byUser.has(userId)) byUser.set(userId, []);
            byUser.get(userId)!.push(action);
          }

          // Send digest email per user
          const { modernEmailService } = await import('./modernEmailService');
          for (const [userId, actions] of byUser) {
            const user = actions[0]?.user;
            if (!user?.email) continue;

            const actionRows = actions.map(a => {
              const analysis = a.aiAnalysis as any;
              return `<tr><td>${a.finalAction || 'N/A'}</td><td>${(a.aiConfidence || 0).toFixed(0)}%</td><td>${analysis?.streamName || analysis?.taskTitle || 'OK'}</td></tr>`;
            }).join('');

            const html = `
              <h2>Autopilot Digest - ${new Date().toLocaleDateString('pl-PL')}</h2>
              <p>Cześć ${user.firstName || ''},</p>
              <p>Autopilot przetworzył dzisiaj <strong>${actions.length}</strong> elementów:</p>
              <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
                <tr><th>Akcja</th><th>Pewność</th><th>Wynik</th></tr>
                ${actionRows}
              </table>
              <p style="margin-top:16px"><em>Możesz cofnąć dowolną akcję w ciągu 24h z poziomu CRM.</em></p>
            `;

            await modernEmailService.sendEmail({
              to: user.email,
              subject: `Autopilot: ${actions.length} akcji przetworzonych`,
              html
            });
          }

          logger.info(`[AutopilotDigest] Sent digests to ${byUser.size} users`);
        } catch (error: any) {
          logger.error('[AutopilotDigest] Task error:', { error: error.message });
        } finally {
          scheduleNext();
        }
      }, msUntilNext);

      this.intervals.set(taskName, timeout);
      logger.info(`Scheduled ${taskName} for ${next.toISOString()}`);
    };

    scheduleNext();
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
