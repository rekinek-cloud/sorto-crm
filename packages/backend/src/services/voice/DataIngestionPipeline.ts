/**
 * 📥 Data Ingestion Pipeline
 * Automatically creates embeddings for all CRM data
 */

import { PrismaClient } from '@prisma/client';
import { VectorStore, VectorDocument } from './VectorStore';
import { z } from 'zod';

export interface IngestionJob {
  id: string;
  type: 'full_sync' | 'incremental' | 'entity_sync';
  status: 'pending' | 'running' | 'completed' | 'failed';
  entityTypes?: string[];
  organizationId?: string;
  userId?: string;
  startedAt?: Date;
  completedAt?: Date;
  stats: {
    totalProcessed: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  error?: string;
}

/**
 * Data Ingestion Pipeline for Vector Store
 */
export class DataIngestionPipeline {
  private prisma: PrismaClient;
  private vectorStore: VectorStore;
  private isRunning = false;
  private currentJob: IngestionJob | null = null;

  constructor(prisma: PrismaClient, vectorStore: VectorStore) {
    this.prisma = prisma;
    this.vectorStore = vectorStore;
    
    console.log('📥 DataIngestionPipeline initialized');
  }

  /**
   * Start full data synchronization
   */
  async startFullSync(organizationId?: string): Promise<IngestionJob> {
    if (this.isRunning) {
      throw new Error('Ingestion job already running');
    }

    const job: IngestionJob = {
      id: `job_${Date.now()}`,
      type: 'full_sync',
      status: 'pending',
      organizationId,
      startedAt: new Date(),
      stats: {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      }
    };

    this.currentJob = job;
    this.isRunning = true;

    // Run asynchronously
    this.executeFullSync(job).finally(() => {
      this.isRunning = false;
      this.currentJob = null;
    });

    return job;
  }

  /**
   * Execute full synchronization
   */
  private async executeFullSync(job: IngestionJob): Promise<void> {
    try {
      console.log(`🚀 Starting full sync job: ${job.id}`);
      job.status = 'running';

      const entityTypes = [
        'tasks',
        'projects', 
        'contacts',
        'companies',
        'deals',
        'communications',
        'knowledge'
      ];

      for (const entityType of entityTypes) {
        try {
          console.log(`📊 Syncing ${entityType}...`);
          const result = await this.syncEntity(entityType, job.organizationId);
          
          job.stats.totalProcessed += result.total;
          job.stats.successful += result.successful;
          job.stats.failed += result.failed;
          job.stats.skipped += result.skipped;
          
          console.log(`✅ ${entityType} sync completed: ${result.successful}/${result.total}`);
        } catch (error) {
          console.error(`❌ ${entityType} sync failed:`, error);
          job.stats.failed += 1;
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();
      
      console.log(`🎉 Full sync completed: ${job.stats.successful}/${job.stats.totalProcessed} documents`);
    } catch (error) {
      console.error('Full sync failed:', error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
    }
  }

  /**
   * Sync specific entity type
   */
  private async syncEntity(
    entityType: string, 
    organizationId?: string
  ): Promise<{ total: number; successful: number; failed: number; skipped: number }> {
    const stats = { total: 0, successful: 0, failed: 0, skipped: 0 };

    switch (entityType) {
      case 'tasks':
        return await this.syncTasks(organizationId);
      case 'projects':
        return await this.syncProjects(organizationId);
      case 'contacts':
        return await this.syncContacts(organizationId);
      case 'companies':
        return await this.syncCompanies(organizationId);
      case 'deals':
        return await this.syncDeals(organizationId);
      case 'communications':
        return await this.syncCommunications(organizationId);
      case 'knowledge':
        return await this.syncKnowledge(organizationId);
      default:
        console.warn(`Unknown entity type: ${entityType}`);
        return stats;
    }
  }

  /**
   * Sync tasks to vector store
   */
  private async syncTasks(organizationId?: string): Promise<{
    total: number; successful: number; failed: number; skipped: number;
  }> {
    const stats = { total: 0, successful: 0, failed: 0, skipped: 0 };

    try {
      const filter: any = {};
      if (organizationId) filter.organizationId = organizationId;

      const tasks = await this.prisma.task.findMany({
        where: filter,
        include: {
          project: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true, email: true } },
          subtasks: true
        }
      });

      stats.total = tasks.length;

      for (const task of tasks) {
        try {
          const content = this.formatTaskForEmbedding(task);
          
          const document: Omit<VectorDocument, 'embedding'> = {
            id: `task_${task.id}`,
            content,
            metadata: {
              type: 'task',
              entityId: task.id,
              userId: task.assignedToId || '',
              organizationId: task.organizationId,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              source: 'internal',
              tags: [task.status, task.priority, task.context || ''].filter(Boolean),
              importance: this.calculateTaskImportance(task)
            }
          };

          await this.vectorStore.storeDocument(document);
          stats.successful++;
        } catch (error) {
          console.error(`Failed to sync task ${task.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error('Tasks sync failed:', error);
      throw error;
    }

    return stats;
  }

  /**
   * Sync projects to vector store
   */
  private async syncProjects(organizationId?: string): Promise<{
    total: number; successful: number; failed: number; skipped: number;
  }> {
    const stats = { total: 0, successful: 0, failed: 0, skipped: 0 };

    try {
      const filter: any = {};
      if (organizationId) filter.organizationId = organizationId;

      const projects = await this.prisma.project.findMany({
        where: filter,
        include: {
          tasks: { select: { title: true, status: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          collaborators: { 
            include: { user: { select: { firstName: true, lastName: true } } }
          }
        }
      });

      stats.total = projects.length;

      for (const project of projects) {
        try {
          const content = this.formatProjectForEmbedding(project);
          
          const document: Omit<VectorDocument, 'embedding'> = {
            id: `project_${project.id}`,
            content,
            metadata: {
              type: 'project',
              entityId: project.id,
              userId: project.createdById,
              organizationId: project.organizationId,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              source: 'internal',
              tags: [project.status, project.priority, project.methodology].filter(Boolean),
              importance: this.calculateProjectImportance(project)
            }
          };

          await this.vectorStore.storeDocument(document);
          stats.successful++;
        } catch (error) {
          console.error(`Failed to sync project ${project.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error('Projects sync failed:', error);
      throw error;
    }

    return stats;
  }

  /**
   * Sync communications to vector store
   */
  private async syncCommunications(organizationId?: string): Promise<{
    total: number; successful: number; failed: number; skipped: number;
  }> {
    const stats = { total: 0, successful: 0, failed: 0, skipped: 0 };

    try {
      const filter: any = {};
      if (organizationId) filter.organizationId = organizationId;

      const communications = await this.prisma.message.findMany({
        where: filter,
        include: {
          channel: { select: { name: true, type: true } },
          attachments: { select: { fileName: true } },
          contact: { select: { firstName: true, lastName: true, email: true } },
          company: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Limit to recent communications
      });

      stats.total = communications.length;

      for (const comm of communications) {
        try {
          const content = this.formatCommunicationForEmbedding(comm);
          
          const document: Omit<VectorDocument, 'embedding'> = {
            id: `comm_${comm.id}`,
            content,
            metadata: {
              type: 'communication',
              entityId: comm.id,
              userId: '', // Communications may not have specific user
              organizationId: comm.organizationId,
              createdAt: comm.receivedAt || comm.sentAt || new Date(),
              updatedAt: comm.receivedAt || comm.sentAt || new Date(),
              source: comm.channel?.type || 'unknown',
              tags: [comm.channel?.name, comm.messageType, comm.priority, comm.actionNeeded ? 'action' : ''].filter(Boolean),
              importance: comm.priority === 'HIGH' ? 8 : comm.priority === 'URGENT' ? 10 : 5
            }
          };

          await this.vectorStore.storeDocument(document);
          stats.successful++;
        } catch (error) {
          console.error(`Failed to sync communication ${comm.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error('Communications sync failed:', error);
      throw error;
    }

    return stats;
  }

  /**
   * Format task for embedding
   */
  private formatTaskForEmbedding(task: any): string {
    let content = `Zadanie: ${task.title}\n`;
    
    if (task.description) {
      content += `Opis: ${task.description}\n`;
    }
    
    content += `Status: ${task.status}\n`;
    content += `Priorytet: ${task.priority}\n`;
    
    if (task.context) {
      content += `Kontekst: ${task.context}\n`;
    }
    
    if (task.project?.name) {
      content += `Projekt: ${task.project.name}\n`;
    }
    
    if (task.assignedTo?.firstName || task.assignedTo?.lastName) {
      const fullName = `${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''}`.trim();
      content += `Przypisane do: ${fullName}\n`;
    }
    
    if (task.dueDate) {
      content += `Termin: ${task.dueDate.toLocaleDateString('pl-PL')}\n`;
    }
    
    if (task.subtasks?.length > 0) {
      content += `Podzadania: ${task.subtasks.map((st: any) => st.title).join(', ')}\n`;
    }
    
    return content.trim();
  }

  /**
   * Format project for embedding
   */
  private formatProjectForEmbedding(project: any): string {
    let content = `Projekt: ${project.name}\n`;
    
    if (project.description) {
      content += `Opis: ${project.description}\n`;
    }
    
    content += `Status: ${project.status}\n`;
    content += `Priorytet: ${project.priority}\n`;
    content += `Metodologia: ${project.methodology}\n`;
    
    if (project.createdBy?.firstName || project.createdBy?.lastName) {
      const fullName = `${project.createdBy.firstName || ''} ${project.createdBy.lastName || ''}`.trim();
      content += `Utworzony przez: ${fullName}\n`;
    }
    
    if (project.dueDate) {
      content += `Termin: ${project.dueDate.toLocaleDateString('pl-PL')}\n`;
    }
    
    if (project.tasks?.length > 0) {
      const activeTasks = project.tasks.filter((t: any) => t.status !== 'DONE');
      content += `Aktywne zadania: ${activeTasks.map((t: any) => t.title).join(', ')}\n`;
    }
    
    if (project.collaborators?.length > 0) {
      content += `Współpracownicy: ${project.collaborators.map((c: any) => 
        `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim()
      ).join(', ')}\n`;
    }
    
    return content.trim();
  }

  /**
   * Format communication for embedding
   */
  private formatCommunicationForEmbedding(comm: any): string {
    let content = `Wiadomość: ${comm.subject || 'Bez tematu'}\n`;
    
    if (comm.channel?.name) {
      content += `Kanał: ${comm.channel.name} (${comm.channel.type})\n`;
    }
    
    if (comm.fromName || comm.fromAddress) {
      content += `Od: ${comm.fromName || comm.fromAddress}`;
      if (comm.fromName && comm.fromAddress) content += ` <${comm.fromAddress}>`;
      content += '\n';
    }
    
    if (comm.toAddress) {
      content += `Do: ${comm.toAddress}\n`;
    }
    
    if (comm.contact?.firstName || comm.contact?.lastName) {
      const fullName = `${comm.contact.firstName || ''} ${comm.contact.lastName || ''}`.trim();
      content += `Kontakt: ${fullName}`;
      if (comm.contact.email) content += ` <${comm.contact.email}>`;
      content += '\n';
    }
    
    if (comm.company?.name) {
      content += `Firma: ${comm.company.name}\n`;
    }
    
    if (comm.content) {
      content += `Treść: ${comm.content.substring(0, 500)}\n`; // Limit content length
    }
    
    if (comm.urgencyScore) {
      content += `Pilność: ${comm.urgencyScore}/10\n`;
    }
    
    if (comm.actionNeeded) {
      content += `Wymaga działania: Tak\n`;
    }
    
    return content.trim();
  }

  /**
   * Calculate task importance (1-10)
   */
  private calculateTaskImportance(task: any): number {
    let importance = 5; // Base importance
    
    // Priority boost
    if (task.priority === 'HIGH') importance += 3;
    else if (task.priority === 'MEDIUM') importance += 1;
    else if (task.priority === 'LOW') importance -= 1;
    
    // Due date boost
    if (task.dueDate) {
      const daysUntilDue = (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue < 1) importance += 2; // Due today/overdue
      else if (daysUntilDue < 7) importance += 1; // Due this week
    }
    
    // Status consideration
    if (task.status === 'IN_PROGRESS') importance += 1;
    else if (task.status === 'DONE') importance -= 2;
    
    return Math.max(1, Math.min(10, importance));
  }

  /**
   * Calculate project importance (1-10)
   */
  private calculateProjectImportance(project: any): number {
    let importance = 5; // Base importance
    
    // Priority boost
    if (project.priority === 'HIGH') importance += 3;
    else if (project.priority === 'MEDIUM') importance += 1;
    else if (project.priority === 'LOW') importance -= 1;
    
    // Status boost
    if (project.status === 'ACTIVE') importance += 2;
    else if (project.status === 'PLANNING') importance += 1;
    else if (project.status === 'COMPLETED') importance -= 2;
    
    // Task count boost (more tasks = more important)
    if (project.tasks?.length > 10) importance += 1;
    else if (project.tasks?.length > 20) importance += 2;
    
    return Math.max(1, Math.min(10, importance));
  }

  /**
   * Sync other entity types (stubs for now)
   */
  private async syncContacts(organizationId?: string) {
    return { total: 0, successful: 0, failed: 0, skipped: 0 };
  }

  private async syncCompanies(organizationId?: string) {
    return { total: 0, successful: 0, failed: 0, skipped: 0 };
  }

  private async syncDeals(organizationId?: string) {
    return { total: 0, successful: 0, failed: 0, skipped: 0 };
  }

  private async syncKnowledge(organizationId?: string) {
    return { total: 0, successful: 0, failed: 0, skipped: 0 };
  }

  /**
   * Get current ingestion job status
   */
  getCurrentJob(): IngestionJob | null {
    return this.currentJob;
  }

  /**
   * Check if ingestion is running
   */
  isIngestionRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton
let dataIngestionPipeline: DataIngestionPipeline | null = null;

export function getDataIngestionPipeline(
  prisma: PrismaClient, 
  vectorStore: VectorStore
): DataIngestionPipeline {
  if (!dataIngestionPipeline) {
    dataIngestionPipeline = new DataIngestionPipeline(prisma, vectorStore);
  }
  return dataIngestionPipeline;
}