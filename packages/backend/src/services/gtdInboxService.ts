import { InboxItem, ProcessingDecision, TaskStatus, Priority } from '@prisma/client';
import { prisma } from '../config/database';

export interface CreateInboxItemInput {
  content: string;
  note?: string;
  source?: string;
  sourceUrl?: string;
  // Business Context Relations
  contactId?: string;
  companyId?: string;
  projectId?: string;
  taskId?: string;
  streamId?: string;
}

export interface ProcessInboxItemInput {
  decision: ProcessingDecision;
  taskData?: {
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: Date;
    context?: string;
    streamId?: string;
    assignedToId?: string;
    estimatedHours?: number;
  };
  projectData?: {
    name: string;
    description?: string;
    priority?: Priority;
    startDate?: Date;
    endDate?: Date;
  };
  somedayMaybeData?: {
    title: string;
    description?: string;
    category?: string;
    priority?: Priority;
  };
  referenceData?: {
    title: string;
    content?: string;
    topic?: string;
    importance?: string;
  };
}

export class StreamInboxService {

  /**
   * Get all inbox items for organization
   */
  async getInboxItems(organizationId: string, filters?: {
    processed?: boolean;
    unprocessed?: boolean;
    actionable?: boolean;
    source?: string;
    context?: string;
    contactId?: string;
    companyId?: string;
    projectId?: string;
    taskId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    urgencyLevel?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<InboxItem[]> {
    const where: any = { organizationId };

    // Basic filters
    if (filters?.processed !== undefined) {
      where.processed = filters.processed;
    }

    if (filters?.unprocessed) {
      where.processed = false;
    }

    if (filters?.actionable) {
      where.actionable = true;
    }

    if (filters?.source) {
      where.sourceType = filters.source;
    }

    if (filters?.context) {
      where.context = filters.context;
    }

    // Search in content and note
    if (filters?.search) {
      where.OR = [
        { content: { contains: filters.search, mode: 'insensitive' } },
        { note: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Date range filtering
    if (filters?.dateFrom || filters?.dateTo) {
      where.capturedAt = {};
      if (filters?.dateFrom) {
        where.capturedAt.gte = new Date(filters.dateFrom);
      }
      if (filters?.dateTo) {
        where.capturedAt.lte = new Date(filters.dateTo + 'T23:59:59');
      }
    }

    // Urgency level filtering
    if (filters?.urgencyLevel && filters.urgencyLevel !== 'all') {
      switch (filters.urgencyLevel) {
        case 'high':
          where.urgencyScore = { gte: 70 };
          break;
        case 'medium':
          where.urgencyScore = { gte: 30, lt: 70 };
          break;
        case 'low':
          where.urgencyScore = { lt: 30 };
          break;
      }
    }

    // CRM Context Filters
    if (filters?.contactId) {
      where.contactId = filters.contactId;
    }

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters?.taskId) {
      where.taskId = filters.taskId;
    }

    // Determine order by
    let orderBy: any = { capturedAt: 'desc' }; // default
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'date_asc':
          orderBy = { capturedAt: 'asc' };
          break;
        case 'date_desc':
          orderBy = { capturedAt: 'desc' };
          break;
        case 'urgency_asc':
          orderBy = { urgencyScore: 'asc' };
          break;
        case 'urgency_desc':
          orderBy = { urgencyScore: 'desc' };
          break;
        default:
          orderBy = { capturedAt: 'desc' };
      }
    }

    return prisma.inboxItem.findMany({
      where,
      include: {
        capturedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        resultingTask: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy,
      take: filters?.limit || 100,
      skip: filters?.offset || 0
    });
  }

  /**
   * Get inbox statistics
   */
  async getInboxStats(organizationId: string) {
    const [total, unprocessed, processed, bySource, byDecision] = await Promise.all([
      // Total items
      prisma.inboxItem.count({
        where: { organizationId }
      }),

      // Unprocessed items
      prisma.inboxItem.count({
        where: { organizationId, processed: false }
      }),

      // Processed items
      prisma.inboxItem.count({
        where: { organizationId, processed: true }
      }),

      // By source
      prisma.inboxItem.groupBy({
        by: ['source'],
        where: { organizationId },
        _count: true
      }),

      // By processing decision
      prisma.inboxItem.groupBy({
        by: ['processingDecision'],
        where: { organizationId, processed: true },
        _count: true
      })
    ]);

    // Get processing rate for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentProcessed = await prisma.inboxItem.count({
      where: {
        organizationId,
        processed: true,
        processedAt: { gte: sevenDaysAgo }
      }
    });

    const recentCaptured = await prisma.inboxItem.count({
      where: {
        organizationId,
        capturedAt: { gte: sevenDaysAgo }
      }
    });

    return {
      total,
      unprocessed,
      processed,
      processingRate: recentCaptured > 0 ? (recentProcessed / recentCaptured) * 100 : 0,
      bySource: bySource.map(item => ({
        source: item.source,
        count: item._count
      })),
      byDecision: byDecision.map(item => ({
        decision: item.processingDecision,
        count: item._count
      })),
      lastProcessed: await this.getLastProcessedTime(organizationId)
    };
  }

  /**
   * Create new inbox item
   */
  async createInboxItem(
    organizationId: string,
    userId: string,
    input: CreateInboxItemInput
  ): Promise<InboxItem> {
    return prisma.inboxItem.create({
      data: {
        content: input.content,
        note: input.note,
        source: input.source || 'manual',
        sourceUrl: input.sourceUrl,
        // Business Context Relations
        contactId: input.contactId,
        companyId: input.companyId,
        projectId: input.projectId,
        taskId: input.taskId,
        streamId: input.streamId,
        organizationId,
        capturedById: userId
      },
      include: {
        capturedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        stream: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
  }

  /**
   * Process inbox item according to GTD methodology
   */
  async processInboxItem(
    itemId: string,
    userId: string,
    input: ProcessInboxItemInput
  ): Promise<InboxItem> {
    const item = await prisma.inboxItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new Error('Inbox item not found');
    }

    if (item.processed) {
      throw new Error('Item already processed');
    }

    let resultingTaskId: string | null = null;

    // Handle different processing decisions
    switch (input.decision) {
      case ProcessingDecision.DO:
      case ProcessingDecision.DEFER:
      case ProcessingDecision.DELEGATE:
        // Create a task
        if (input.taskData) {
          // Find context ID if context name is provided
          let contextId = null;
          if (input.taskData.context) {
            const context = await prisma.context.findFirst({
              where: {
                name: input.taskData.context,
                organizationId: item.organizationId
              }
            });
            contextId = context?.id || null;
          }

          const taskData = {
            title: input.taskData.title,
            description: input.taskData.description || item.note,
            priority: input.taskData.priority || Priority.MEDIUM,
            status: input.decision === ProcessingDecision.DO
              ? TaskStatus.IN_PROGRESS
              : TaskStatus.PENDING,
            dueDate: input.taskData.dueDate,
            contextId: contextId,
            streamId: input.taskData.streamId || null,
            assignedToId: input.decision === ProcessingDecision.DELEGATE
              ? input.taskData.assignedToId
              : userId,
            estimatedHours: input.taskData.estimatedHours || null,
            organizationId: item.organizationId,
            createdById: userId
          };
          console.log('Creating task with data:', JSON.stringify(taskData, null, 2));
          const task = await prisma.task.create({
            data: taskData
          });
          resultingTaskId = task.id;

          // If delegated, create a waiting for entry
          if (input.decision === ProcessingDecision.DELEGATE && input.taskData.assignedToId) {
            await prisma.waitingFor.create({
              data: {
                description: `Delegated: ${input.taskData.title}`,
                waitingForWho: input.taskData.assignedToId,
                sinceDate: new Date(),
                expectedResponseDate: input.taskData.dueDate,
                status: 'ACTIVE',
                taskId: task.id,
                organizationId: item.organizationId,
                createdById: userId
              }
            });
          }
        }
        break;

      case ProcessingDecision.PROJECT:
        // Create a project
        if (input.projectData) {
          const project = await prisma.project.create({
            data: {
              name: input.projectData.name,
              description: input.projectData.description || item.content,
              priority: input.projectData.priority || Priority.MEDIUM,
              status: 'PLANNING',
              startDate: input.projectData.startDate,
              endDate: input.projectData.endDate,
              organizationId: item.organizationId,
              createdById: userId
            }
          });

          // Create initial task for the project
          const task = await prisma.task.create({
            data: {
              title: `Plan ${input.projectData.name}`,
              description: 'Define project scope and initial tasks',
              priority: input.projectData.priority || Priority.MEDIUM,
              status: TaskStatus.PENDING,
              projectId: project.id,
              organizationId: item.organizationId,
              createdById: userId
            }
          });
          resultingTaskId = task.id;
        }
        break;

      case ProcessingDecision.SOMEDAY:
        // Add to someday/maybe list
        if (input.somedayMaybeData) {
          await prisma.somedayMaybe.create({
            data: {
              title: input.somedayMaybeData.title,
              description: input.somedayMaybeData.description || item.content,
              category: input.somedayMaybeData.category || 'IDEAS',
              priority: input.somedayMaybeData.priority || Priority.LOW,
              status: 'ACTIVE',
              organizationId: item.organizationId,
              createdById: userId
            }
          });
        }
        break;

      case ProcessingDecision.REFERENCE:
        // Store as reference material
        if (input.referenceData) {
          await prisma.info.create({
            data: {
              title: input.referenceData.title,
              content: input.referenceData.content || item.content,
              topic: input.referenceData.topic,
              importance: input.referenceData.importance || 'MEDIUM',
              organizationId: item.organizationId
            }
          });
        }
        break;

      case ProcessingDecision.DELETE:
        // Just mark as processed, no further action needed
        break;
    }

    // Update inbox item as processed
    return prisma.inboxItem.update({
      where: { id: itemId },
      data: {
        processed: true,
        processedAt: new Date(),
        processingDecision: input.decision,
        resultingTaskId
      },
      include: {
        capturedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        resultingTask: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });
  }

  /**
   * Quick capture - add item to inbox
   */
  async quickCapture(
    organizationId: string,
    userId: string,
    content: string,
    source: string = 'quick-capture'
  ): Promise<InboxItem> {
    return this.createInboxItem(organizationId, userId, {
      content,
      source
    });
  }

  /**
   * Advanced quick capture with full GTD properties
   */
  async quickCaptureAdvanced(
    organizationId: string,
    userId: string,
    data: {
      content: string;
      note?: string;
      sourceType?: string;
      source?: string;
      urgencyScore?: number;
      actionable?: boolean;
      estimatedTime?: string;
      // Business Context
      contactId?: string;
      companyId?: string;
      projectId?: string;
      taskId?: string;
      streamId?: string;
      // Voice recording / metadata
      metadata?: {
        audioData?: string;
        audioDuration?: number;
        audioType?: string;
        transcription?: string;
        [key: string]: any;
      };
    }
  ): Promise<InboxItem> {
    // Prepare raw content for voice recordings
    let rawContent: string | undefined = undefined;
    let aiAnalysis: any = undefined;

    if (data.metadata) {
      // Store audio data in rawContent (for voice recordings)
      if (data.metadata.audioData) {
        rawContent = data.metadata.audioData;
      }
      // Store other metadata in aiAnalysis
      aiAnalysis = {
        audioDuration: data.metadata.audioDuration,
        audioType: data.metadata.audioType,
        transcription: data.metadata.transcription,
        hasAudioAttachment: !!data.metadata.audioData,
      };
    }

    const item = await prisma.inboxItem.create({
      data: {
        content: data.content,
        note: data.note,
        sourceType: data.sourceType || 'QUICK_CAPTURE',
        source: data.source || 'manual',
        context: null, // GTD context will be set during processing
        urgencyScore: data.urgencyScore || 50,
        actionable: data.actionable !== false,
        estimatedTime: data.estimatedTime,
        rawContent: rawContent,
        aiAnalysis: aiAnalysis,
        elementType: data.sourceType === 'VOICE' ? 'VOICE' : undefined,
        // Business Context Relations
        contactId: data.contactId,
        companyId: data.companyId,
        projectId: data.projectId,
        taskId: data.taskId,
        streamId: data.streamId,
        organizationId,
        capturedById: userId,
        processed: false
      }
    });

    return item;
  }

  /**
   * Quick action on inbox item
   */
  async quickAction(
    itemId: string,
    userId: string,
    action: 'QUICK_DO' | 'QUICK_DEFER' | 'QUICK_DELETE' | 'QUICK_DELEGATE',
    assignedToId?: string
  ): Promise<InboxItem> {
    const item = await prisma.inboxItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new Error('Inbox item not found');
    }

    if (item.processed) {
      throw new Error('Item already processed');
    }

    let processingInput: ProcessInboxItemInput;

    switch (action) {
      case 'QUICK_DO':
        // Create an immediate task
        processingInput = {
          decision: ProcessingDecision.DO,
          taskData: {
            title: item.content.substring(0, 100), // Truncate to reasonable length
            description: item.note || undefined,
            priority: Priority.HIGH,
            context: '@computer'
          }
        };
        break;

      case 'QUICK_DEFER':
        // Create a task for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // Set to 9 AM tomorrow

        processingInput = {
          decision: ProcessingDecision.DEFER,
          taskData: {
            title: item.content.substring(0, 100),
            description: item.note || undefined,
            priority: Priority.MEDIUM,
            dueDate: tomorrow,
            context: '@computer'
          }
        };
        break;

      case 'QUICK_DELETE':
        processingInput = {
          decision: ProcessingDecision.DELETE
        };
        break;

      case 'QUICK_DELEGATE':
        if (!assignedToId) {
          throw new Error('Assigned to ID is required for delegate action');
        }
        processingInput = {
          decision: ProcessingDecision.DELEGATE,
          taskData: {
            title: item.content.substring(0, 100),
            description: item.note || undefined,
            priority: Priority.MEDIUM,
            context: '@waiting',
            assignedToId: assignedToId
          }
        };
        break;

      default:
        throw new Error('Invalid quick action');
    }

    return this.processInboxItem(itemId, userId, processingInput);
  }

  /**
   * Bulk process items
   */
  async bulkProcess(
    organizationId: string,
    userId: string,
    items: Array<{
      itemId: string;
      decision: ProcessingDecision;
    }>
  ): Promise<void> {
    for (const item of items) {
      if (item.decision === ProcessingDecision.DELETE) {
        await this.processInboxItem(item.itemId, userId, {
          decision: ProcessingDecision.DELETE
        });
      }
    }
  }

  /**
   * Get last processed time
   */
  private async getLastProcessedTime(organizationId: string): Promise<Date | null> {
    const lastProcessed = await prisma.inboxItem.findFirst({
      where: {
        organizationId,
        processed: true
      },
      orderBy: {
        processedAt: 'desc'
      },
      select: {
        processedAt: true
      }
    });

    return lastProcessed?.processedAt || null;
  }

  /**
   * Clear processed items older than specified days
   */
  async clearProcessedItems(organizationId: string, olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.inboxItem.deleteMany({
      where: {
        organizationId,
        processed: true,
        processedAt: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }

  /**
   * Create inbox item from communication message (for processing rules)
   */
  async createFromMessage(
    messageId: string,
    organizationId: string,
    userId: string,
    options?: {
      extractKeywords?: boolean;
      autoProcess?: {
        decision: ProcessingDecision;
        taskData?: any;
        projectData?: any;
      };
    }
  ): Promise<InboxItem> {
    // Get message details
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: true,
        contact: true,
        company: true,
        deal: true
      }
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Prepare content for inbox
    let content = message.content;
    let note = '';

    // Add context information
    if (message.subject) {
      content = `${message.subject}\n\n${content}`;
    }

    // Add sender information
    if (message.fromName || message.fromAddress) {
      note += `Od: ${message.fromName || ''} (${message.fromAddress})\n`;
    }

    // Add related entities info
    if (message.contact) {
      note += `Kontakt: ${message.contact.firstName} ${message.contact.lastName}\n`;
    }
    if (message.company) {
      note += `Firma: ${message.company.name}\n`;
    }
    if (message.deal) {
      note += `Transakcja: ${message.deal.title}\n`;
    }

    // Create inbox item
    const inboxItem = await this.createInboxItem(organizationId, userId, {
      content: content.substring(0, 1000), // Limit content length
      note: note.trim() || undefined,
      source: `${message.channel.type.toLowerCase()}`,
      sourceUrl: message.id // Reference to original message
    });

    // Update message to reference inbox item
    await prisma.message.update({
      where: { id: messageId },
      data: {
        actionNeeded: true
      }
    });

    // Auto-process if requested
    if (options?.autoProcess) {
      await this.processInboxItem(inboxItem.id, userId, {
        decision: options.autoProcess.decision,
        taskData: options.autoProcess.taskData,
        projectData: options.autoProcess.projectData
      });
    }

    return inboxItem;
  }
}

export const gtdInboxService = new StreamInboxService();
