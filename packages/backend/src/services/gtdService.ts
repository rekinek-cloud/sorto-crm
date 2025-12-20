import { PrismaClient, TaskStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

export interface InboxItem {
  id: string;
  type: 'MESSAGE' | 'TASK' | 'IDEA' | 'REQUEST';
  title: string;
  description?: string;
  source: string; // email, manual, slack, etc.
  sourceId?: string; // reference to original message/item
  priority: Priority;
  urgencyScore?: number;
  actionable: boolean;
  processed: boolean;
  processingDecision?: 'DO' | 'DEFER' | 'DELEGATE' | 'DELETE' | 'REFERENCE';
  estimatedTime?: string; // "2m", "30m", "2h"
  contextSuggested?: string;
  organizationId: string;
  createdAt: Date;
  receivedAt: Date;
}

export interface GTDProcessingDecision {
  itemId: string;
  decision: 'DO' | 'DEFER' | 'DELEGATE' | 'DELETE' | 'REFERENCE';
  actionData?: {
    taskTitle?: string;
    taskDescription?: string;
    dueDate?: Date;
    assignedTo?: string;
    context?: string;
    streamId?: string;
    estimatedTime?: string;
  };
  notes?: string;
}

export class GTDService {
  
  /**
   * Get all inbox items for organization
   */
  async getInboxItems(organizationId: string, filters?: {
    unprocessedOnly?: boolean;
    source?: string;
    actionableOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<InboxItem[]> {
    const where: any = { organizationId };

    if (filters?.unprocessedOnly) {
      where.processed = false;
    }

    if (filters?.source) {
      where.source = filters.source;
    }

    if (filters?.actionableOnly) {
      where.actionable = true;
    }

    // Get messages that need processing
    const messages = await prisma.message.findMany({
      where: {
        organizationId,
        isArchived: false,
        ...(filters?.unprocessedOnly && { actionNeeded: true }),
        ...(filters?.source === 'email' && { taskId: null })
      },
      include: {
        channel: true,
        task: true
      },
      orderBy: { receivedAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    });

    // Get manual inbox items (tasks without parent projects)
    const manualTasks = await prisma.task.findMany({
      where: {
        organizationId,
        status: TaskStatus.NEW,
        projectId: null,
        ...(filters?.unprocessedOnly && { 
          OR: [
            { description: null },
            { dueDate: null }
          ]
        })
      },
      include: {
        stream: true,
        createdBy: true
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 25,
      skip: filters?.offset || 0
    });

    // Convert to unified inbox format
    const inboxItems: InboxItem[] = [
      // Messages
      ...messages.map(msg => ({
        id: msg.id,
        type: 'MESSAGE' as const,
        title: msg.subject || 'No Subject',
        description: msg.content?.substring(0, 200) + (msg.content && msg.content.length > 200 ? '...' : ''),
        source: msg.channel.type.toLowerCase(),
        sourceId: msg.id,
        priority: this.urgencyToPriority(msg.urgencyScore || 0),
        urgencyScore: msg.urgencyScore || 0,
        actionable: msg.actionNeeded || false,
        processed: !!msg.taskId,
        estimatedTime: this.estimateTimeFromContent(msg.content || ''),
        contextSuggested: msg.extractedContext || this.suggestContextFromMessage(msg),
        organizationId: msg.organizationId,
        createdAt: msg.receivedAt,
        receivedAt: msg.receivedAt
      })),
      // Manual tasks
      ...manualTasks.map(task => ({
        id: task.id,
        type: 'TASK' as const,
        title: task.title,
        description: task.description,
        source: 'manual',
        sourceId: task.id,
        priority: task.priority,
        urgencyScore: 50, // Default for manual tasks
        actionable: true,
        processed: task.status !== TaskStatus.NEW,
        estimatedTime: task.estimatedTime,
        contextSuggested: task.context,
        organizationId: task.organizationId,
        createdAt: task.createdAt,
        receivedAt: task.createdAt
      }))
    ];

    // Sort by urgency and date
    return inboxItems.sort((a, b) => {
      // Unprocessed first
      if (a.processed !== b.processed) {
        return a.processed ? 1 : -1;
      }
      // Then by urgency
      if ((a.urgencyScore || 0) !== (b.urgencyScore || 0)) {
        return (b.urgencyScore || 0) - (a.urgencyScore || 0);
      }
      // Finally by date
      return b.receivedAt.getTime() - a.receivedAt.getTime();
    });
  }

  /**
   * Process inbox item with GTD methodology
   */
  async processInboxItem(itemId: string, decision: GTDProcessingDecision, userId: string): Promise<any> {
    const { decision: action, actionData, notes } = decision;

    // Get the item (could be message or task)
    const [message, task] = await Promise.all([
      prisma.message.findUnique({ where: { id: itemId } }),
      prisma.task.findUnique({ where: { id: itemId } })
    ]);

    const item = message || task;
    if (!item) {
      throw new Error('Inbox item not found');
    }

    switch (action) {
      case 'DO':
        return await this.processDoAction(item, actionData, userId);
      
      case 'DEFER':
        return await this.processDeferAction(item, actionData, userId);
      
      case 'DELEGATE':
        return await this.processDelegateAction(item, actionData, userId);
      
      case 'DELETE':
        return await this.processDeleteAction(item, userId);
      
      case 'REFERENCE':
        return await this.processReferenceAction(item, actionData, userId);
      
      default:
        throw new Error('Invalid processing decision');
    }
  }

  /**
   * DO: Create immediate action task
   */
  private async processDoAction(item: any, actionData: any, userId: string): Promise<any> {
    const isMessage = 'messageId' in item || 'fromAddress' in item;
    
    if (isMessage) {
      // Create task from message
      const task = await prisma.task.create({
        data: {
          title: actionData?.taskTitle || item.subject || 'Follow up on message',
          description: actionData?.taskDescription || this.generateTaskDescription(item),
          priority: item.priority || Priority.MEDIUM,
          status: TaskStatus.IN_PROGRESS,
          dueDate: actionData?.dueDate || this.calculateDueDate('immediate'),
          context: actionData?.context || item.extractedContext,
          estimatedTime: actionData?.estimatedTime || this.estimateTimeFromContent(item.content),
          organizationId: item.organizationId,
          createdById: userId,
          streamId: actionData?.streamId
        }
      });

      // Link message to task
      await prisma.message.update({
        where: { id: item.id },
        data: { 
          taskId: task.id,
          actionNeeded: false,
          isRead: true
        }
      });

      return { action: 'TASK_CREATED', taskId: task.id, task };
    } else {
      // Update existing task to in-progress
      const updatedTask = await prisma.task.update({
        where: { id: item.id },
        data: {
          status: TaskStatus.IN_PROGRESS,
          dueDate: actionData?.dueDate || this.calculateDueDate('immediate'),
          context: actionData?.context || item.context,
          estimatedTime: actionData?.estimatedTime || item.estimatedTime
        }
      });

      return { action: 'TASK_ACTIVATED', task: updatedTask };
    }
  }

  /**
   * DEFER: Schedule for later
   */
  private async processDeferAction(item: any, actionData: any, userId: string): Promise<any> {
    const isMessage = 'messageId' in item || 'fromAddress' in item;
    
    if (isMessage) {
      // Create scheduled task
      const task = await prisma.task.create({
        data: {
          title: actionData?.taskTitle || item.subject || 'Follow up on message',
          description: actionData?.taskDescription || this.generateTaskDescription(item),
          priority: Priority.MEDIUM,
          status: TaskStatus.WAITING,
          dueDate: actionData?.dueDate || this.calculateDueDate('deferred'),
          context: actionData?.context || item.extractedContext,
          estimatedTime: actionData?.estimatedTime,
          organizationId: item.organizationId,
          createdById: userId,
          streamId: actionData?.streamId
        }
      });

      await prisma.message.update({
        where: { id: item.id },
        data: { 
          taskId: task.id,
          actionNeeded: false
        }
      });

      return { action: 'TASK_DEFERRED', taskId: task.id, task };
    } else {
      // Update task with new due date
      const updatedTask = await prisma.task.update({
        where: { id: item.id },
        data: {
          status: TaskStatus.WAITING,
          dueDate: actionData?.dueDate || this.calculateDueDate('deferred'),
          context: actionData?.context || item.context
        }
      });

      return { action: 'TASK_RESCHEDULED', task: updatedTask };
    }
  }

  /**
   * DELEGATE: Assign to someone else
   */
  private async processDelegateAction(item: any, actionData: any, userId: string): Promise<any> {
    if (!actionData?.assignedTo) {
      throw new Error('Delegation requires assignedTo field');
    }

    const isMessage = 'messageId' in item || 'fromAddress' in item;
    
    if (isMessage) {
      // Create delegated task
      const task = await prisma.task.create({
        data: {
          title: actionData?.taskTitle || item.subject || 'Follow up on message',
          description: actionData?.taskDescription || this.generateTaskDescription(item),
          priority: Priority.MEDIUM,
          status: TaskStatus.IN_PROGRESS,
          dueDate: actionData?.dueDate || this.calculateDueDate('delegated'),
          organizationId: item.organizationId,
          createdById: userId,
          assignedToId: actionData.assignedTo,
          streamId: actionData?.streamId
        }
      });

      // Create waiting for entry
      await prisma.waitingFor.create({
        data: {
          description: `Waiting for response on: ${item.subject}`,
          waitingForWho: actionData.assignedTo,
          sinceDate: new Date(),
          expectedResponseDate: actionData?.dueDate,
          status: 'PENDING',
          organizationId: item.organizationId,
          createdById: userId,
          taskId: task.id
        }
      });

      await prisma.message.update({
        where: { id: item.id },
        data: { 
          taskId: task.id,
          actionNeeded: false
        }
      });

      return { action: 'TASK_DELEGATED', taskId: task.id, task };
    } else {
      // Delegate existing task
      const updatedTask = await prisma.task.update({
        where: { id: item.id },
        data: {
          assignedToId: actionData.assignedTo,
          status: TaskStatus.IN_PROGRESS,
          dueDate: actionData?.dueDate || item.dueDate
        }
      });

      // Create waiting for entry
      await prisma.waitingFor.create({
        data: {
          description: `Waiting for completion: ${item.title}`,
          waitingForWho: actionData.assignedTo,
          sinceDate: new Date(),
          expectedResponseDate: actionData?.dueDate || item.dueDate,
          status: 'PENDING',
          organizationId: item.organizationId,
          createdById: userId,
          taskId: item.id
        }
      });

      return { action: 'TASK_DELEGATED', task: updatedTask };
    }
  }

  /**
   * DELETE: Remove from system
   */
  private async processDeleteAction(item: any, userId: string): Promise<any> {
    const isMessage = 'messageId' in item || 'fromAddress' in item;
    
    if (isMessage) {
      await prisma.message.update({
        where: { id: item.id },
        data: { 
          isArchived: true,
          actionNeeded: false
        }
      });
      return { action: 'MESSAGE_ARCHIVED' };
    } else {
      await prisma.task.update({
        where: { id: item.id },
        data: { status: TaskStatus.CANCELED }
      });
      return { action: 'TASK_CANCELED' };
    }
  }

  /**
   * REFERENCE: Store for future reference
   */
  private async processReferenceAction(item: any, actionData: any, userId: string): Promise<any> {
    const isMessage = 'messageId' in item || 'fromAddress' in item;
    
    if (isMessage) {
      // Create reference info entry
      await prisma.info.create({
        data: {
          title: item.subject || 'Reference Information',
          description: item.content || '',
          category: actionData?.category || 'Email Reference',
          tags: actionData?.tags || [],
          source: 'email',
          sourceId: item.id,
          organizationId: item.organizationId,
          createdById: userId
        }
      });

      await prisma.message.update({
        where: { id: item.id },
        data: { 
          actionNeeded: false,
          isRead: true
        }
      });

      return { action: 'REFERENCE_CREATED' };
    } else {
      // Convert task to reference
      await prisma.info.create({
        data: {
          title: item.title,
          description: item.description || '',
          category: actionData?.category || 'Task Reference',
          tags: actionData?.tags || [],
          source: 'task',
          sourceId: item.id,
          organizationId: item.organizationId,
          createdById: userId
        }
      });

      await prisma.task.update({
        where: { id: item.id },
        data: { status: TaskStatus.COMPLETED }
      });

      return { action: 'TASK_CONVERTED_TO_REFERENCE' };
    }
  }

  /**
   * Helper methods
   */
  private urgencyToPriority(urgencyScore: number): Priority {
    if (urgencyScore >= 75) return Priority.HIGH;
    if (urgencyScore >= 50) return Priority.MEDIUM;
    return Priority.LOW;
  }

  private estimateTimeFromContent(content: string): string {
    const length = content.length;
    if (length < 100) return '5m';
    if (length < 500) return '15m';
    if (length < 1000) return '30m';
    return '1h';
  }

  private suggestContextFromMessage(message: any): string {
    const content = `${message.subject} ${message.content}`.toLowerCase();
    
    if (content.includes('call') || content.includes('phone')) return '@calls';
    if (content.includes('meeting') || content.includes('schedule')) return '@calendar';
    if (content.includes('review') || content.includes('document')) return '@computer';
    if (content.includes('buy') || content.includes('purchase')) return '@errands';
    
    return '@computer'; // default
  }

  private generateTaskDescription(item: any): string {
    const isMessage = 'messageId' in item || 'fromAddress' in item;
    
    if (isMessage) {
      return `📧 Follow up on email from ${item.fromName || item.fromAddress}\n\n` +
             `Subject: ${item.subject}\n\n` +
             `Content: ${item.content?.substring(0, 300)}${item.content && item.content.length > 300 ? '...' : ''}`;
    }
    
    return item.description || item.title;
  }

  private calculateDueDate(type: 'immediate' | 'deferred' | 'delegated'): Date {
    const now = new Date();
    
    switch (type) {
      case 'immediate':
        now.setHours(now.getHours() + 2); // 2 hours from now
        return now;
      
      case 'deferred':
        now.setDate(now.getDate() + 1); // tomorrow
        return now;
      
      case 'delegated':
        now.setDate(now.getDate() + 3); // 3 days for follow-up
        return now;
      
      default:
        return now;
    }
  }

  /**
   * Get inbox statistics
   */
  async getInboxStats(organizationId: string): Promise<any> {
    const [unprocessedMessages, unprocessedTasks, totalMessages, urgentItems] = await Promise.all([
      prisma.message.count({
        where: {
          organizationId,
          actionNeeded: true,
          isArchived: false,
          taskId: null
        }
      }),
      prisma.task.count({
        where: {
          organizationId,
          status: TaskStatus.NEW,
          projectId: null
        }
      }),
      prisma.message.count({
        where: {
          organizationId,
          isArchived: false,
          receivedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.message.count({
        where: {
          organizationId,
          urgencyScore: { gte: 70 },
          actionNeeded: true,
          isArchived: false
        }
      })
    ]);

    const totalUnprocessed = unprocessedMessages + unprocessedTasks;
    const processedToday = await prisma.message.count({
      where: {
        organizationId,
        taskId: { not: null },
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    return {
      totalUnprocessed,
      unprocessedMessages,
      unprocessedTasks,
      urgentItems,
      totalMessages,
      processedToday,
      processingRate: totalMessages > 0 ? Math.round((processedToday / totalMessages) * 100) : 0
    };
  }

  /**
   * Quick actions for common GTD patterns
   */
  async quickAction(itemId: string, action: 'QUICK_DO' | 'QUICK_DEFER' | 'QUICK_DELETE', userId: string): Promise<any> {
    switch (action) {
      case 'QUICK_DO':
        return this.processInboxItem(itemId, {
          itemId,
          decision: 'DO',
          actionData: {
            dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
          }
        }, userId);
      
      case 'QUICK_DEFER':
        return this.processInboxItem(itemId, {
          itemId,
          decision: 'DEFER',
          actionData: {
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
          }
        }, userId);
      
      case 'QUICK_DELETE':
        return this.processInboxItem(itemId, {
          itemId,
          decision: 'DELETE'
        }, userId);
    }
  }
}

export const gtdService = new GTDService();