import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { VectorService } from '../services/VectorService';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();
const vectorService = new VectorService(prisma);

// Validation schemas
const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(50).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7),
  filters: z.object({
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    language: z.string().optional(),
    source: z.string().optional()
  }).optional().default({}),
  useCache: z.boolean().optional().default(true)
});

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  source: z.string().optional().default('manual'),
  language: z.string().optional().default('pl'),
  chunkSize: z.number().min(100).max(2000).optional().default(500)
});

const syncEntitySchema = z.object({
  entityType: z.enum(['task', 'project', 'contact', 'deal', 'company', 'knowledge']),
  entityId: z.string().optional(),
  force: z.boolean().optional().default(false)
});

// Apply authentication middleware
router.use(authenticateUser);

/**
 * POST /api/v1/vector-search/search
 * Semantic search in vector database
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit, threshold, filters, useCache } = searchSchema.parse(req.body);
    const organizationId = req.user.organizationId;

    logger.info(`Vector search: "${query}" by ${req.user.email}`);

    const results = await vectorService.searchSimilar(organizationId, query, {
      limit,
      threshold,
      filters,
      useCache
    });

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Vector search error:', error);
    res.status(500).json({
      success: false,
      error: 'Vector search failed'
    });
  }
});

/**
 * POST /api/v1/vector-search/documents
 * Create new vector document
 */
router.post('/documents', async (req, res) => {
  try {
    const { title, content, entityType, entityId, source, language, chunkSize } = createDocumentSchema.parse(req.body);
    const organizationId = req.user.organizationId;

    const documentIds = await vectorService.createVectorDocument(
      organizationId,
      title,
      content,
      entityType,
      entityId,
      { source, language, chunkSize }
    );

    res.status(201).json({
      success: true,
      data: {
        documentIds,
        message: `Created ${documentIds.length} vector document(s)`
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Create vector document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vector document'
    });
  }
});

/**
 * PUT /api/v1/vector-search/documents/:id
 * Update vector document
 */
router.put('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    await vectorService.updateVectorDocument(id, title, content);

    res.json({
      success: true,
      message: 'Vector document updated successfully'
    });

  } catch (error) {
    logger.error('Update vector document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vector document'
    });
  }
});

/**
 * DELETE /api/v1/vector-search/documents/:entityType/:entityId
 * Delete vector documents for an entity
 */
router.delete('/documents/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    await vectorService.deleteVectorDocuments(entityType, entityId);

    res.json({
      success: true,
      message: 'Vector documents deleted successfully'
    });

  } catch (error) {
    logger.error('Delete vector documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vector documents'
    });
  }
});

/**
 * POST /api/v1/vector-search/sync
 * Sync entities to vector database
 */
router.post('/sync', async (req, res) => {
  try {
    const { entityType, entityId, force } = syncEntitySchema.parse(req.body);
    const organizationId = req.user.organizationId;

    logger.info(`Syncing ${entityType} entities to vector database for org ${organizationId}`);

    let syncCount = 0;

    switch (entityType) {
      case 'task':
        syncCount = await syncTasks(organizationId, entityId, force);
        break;
      case 'project':
        syncCount = await syncProjects(organizationId, entityId, force);
        break;
      case 'contact':
        syncCount = await syncContacts(organizationId, entityId, force);
        break;
      case 'deal':
        syncCount = await syncDeals(organizationId, entityId, force);
        break;
      case 'company':
        syncCount = await syncCompanies(organizationId, entityId, force);
        break;
      case 'knowledge':
        syncCount = await syncKnowledge(organizationId, entityId, force);
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    res.json({
      success: true,
      data: {
        entityType,
        syncCount,
        message: `Synced ${syncCount} ${entityType} entities to vector database`
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Vector sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Vector sync failed'
    });
  }
});

/**
 * GET /api/v1/vector-search/analytics
 * Get vector database analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const analytics = await vectorService.getVectorAnalytics(organizationId);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Vector analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

/**
 * POST /api/v1/vector-search/cache/cleanup
 * Cleanup expired cache entries
 */
router.post('/cache/cleanup', async (req, res) => {
  try {
    await vectorService.cleanupExpiredCache();

    res.json({
      success: true,
      message: 'Cache cleanup completed'
    });

  } catch (error) {
    logger.error('Cache cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Cache cleanup failed'
    });
  }
});

/**
 * Helper functions for syncing different entity types
 */

async function syncTasks(organizationId: string, entityId?: string, force: boolean = false): Promise<number> {
  const where: any = { organizationId };
  if (entityId) where.id = entityId;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { name: true } },
      assignedTo: { select: { firstName: true, lastName: true } }
    }
  });

  let syncCount = 0;
  for (const task of tasks) {
    try {
      // Check if already exists
      if (!force) {
        const existing = await prisma.vectorDocument.findFirst({
          where: { entityType: 'task', entityId: task.id }
        });
        if (existing) continue;
      }

      const content = [
        task.title,
        task.description || '',
        task.project?.name ? `Projekt: ${task.project.name}` : '',
        task.assignedTo ? `Przypisane: ${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '',
        `Status: ${task.status}`,
        `Priorytet: ${task.priority}`
      ].filter(Boolean).join('\n');

      await vectorService.createVectorDocument(
        organizationId,
        task.title,
        content,
        'task',
        task.id,
        { source: 'sync', language: 'pl' }
      );

      syncCount++;
    } catch (error) {
      logger.error(`Failed to sync task ${task.id}:`, error);
    }
  }

  return syncCount;
}

async function syncProjects(organizationId: string, entityId?: string, force: boolean = false): Promise<number> {
  const where: any = { organizationId };
  if (entityId) where.id = entityId;

  const projects = await prisma.project.findMany({
    where,
    include: {
      assignedTo: { select: { firstName: true, lastName: true } },
      company: { select: { name: true } },
      tasks: { select: { title: true, status: true } }
    }
  });

  let syncCount = 0;
  for (const project of projects) {
    try {
      if (!force) {
        const existing = await prisma.vectorDocument.findFirst({
          where: { entityType: 'project', entityId: project.id }
        });
        if (existing) continue;
      }

      const content = [
        project.name,
        project.description || '',
        project.company?.name ? `Klient: ${project.company.name}` : '',
        project.assignedTo ? `Właściciel: ${project.assignedTo.firstName} ${project.assignedTo.lastName}` : '',
        `Status: ${project.status}`,
        project.tasks.length > 0 ? `Zadania (${project.tasks.length}): ${project.tasks.map(t => t.title).join(', ')}` : ''
      ].filter(Boolean).join('\n');

      await vectorService.createVectorDocument(
        organizationId,
        project.name,
        content,
        'project',
        project.id,
        { source: 'sync', language: 'pl' }
      );

      syncCount++;
    } catch (error) {
      logger.error(`Failed to sync project ${project.id}:`, error);
    }
  }

  return syncCount;
}

async function syncContacts(organizationId: string, entityId?: string, force: boolean = false): Promise<number> {
  const where: any = { organizationId };
  if (entityId) where.id = entityId;

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      company: { select: { name: true } }
    }
  });

  let syncCount = 0;
  for (const contact of contacts) {
    try {
      if (!force) {
        const existing = await prisma.vectorDocument.findFirst({
          where: { entityType: 'contact', entityId: contact.id }
        });
        if (existing) continue;
      }

      const content = [
        `${contact.firstName} ${contact.lastName}`,
        contact.email,
        contact.phone || '',
        contact.position || '',
        contact.company?.name ? `Firma: ${contact.company.name}` : '',
        contact.notes || ''
      ].filter(Boolean).join('\n');

      await vectorService.createVectorDocument(
        organizationId,
        `${contact.firstName} ${contact.lastName}`,
        content,
        'contact',
        contact.id,
        { source: 'sync', language: 'pl' }
      );

      syncCount++;
    } catch (error) {
      logger.error(`Failed to sync contact ${contact.id}:`, error);
    }
  }

  return syncCount;
}

async function syncDeals(organizationId: string, entityId?: string, force: boolean = false): Promise<number> {
  const where: any = { organizationId };
  if (entityId) where.id = entityId;

  const deals = await prisma.deal.findMany({
    where,
    include: {
      company: { select: { name: true } },
      owner: { select: { firstName: true, lastName: true } }
    }
  });

  let syncCount = 0;
  for (const deal of deals) {
    try {
      if (!force) {
        const existing = await prisma.vectorDocument.findFirst({
          where: { entityType: 'deal', entityId: deal.id }
        });
        if (existing) continue;
      }

      const content = [
        deal.title,
        deal.description || '',
        deal.company?.name ? `Klient: ${deal.company.name}` : '',
        deal.owner ? `Właściciel: ${deal.owner.firstName} ${deal.owner.lastName}` : '',
        `Wartość: ${deal.value} ${deal.currency}`,
        `Etap: ${deal.stage}`,
        `Status: ${deal.status}`
      ].filter(Boolean).join('\n');

      await vectorService.createVectorDocument(
        organizationId,
        deal.title,
        content,
        'deal',
        deal.id,
        { source: 'sync', language: 'pl' }
      );

      syncCount++;
    } catch (error) {
      logger.error(`Failed to sync deal ${deal.id}:`, error);
    }
  }

  return syncCount;
}

async function syncCompanies(organizationId: string, entityId?: string, force: boolean = false): Promise<number> {
  const where: any = { organizationId };
  if (entityId) where.id = entityId;

  const companies = await prisma.company.findMany({
    where,
    include: {
      contacts: { select: { firstName: true, lastName: true } },
      deals: { select: { title: true, value: true } }
    }
  });

  let syncCount = 0;
  for (const company of companies) {
    try {
      if (!force) {
        const existing = await prisma.vectorDocument.findFirst({
          where: { entityType: 'company', entityId: company.id }
        });
        if (existing) continue;
      }

      const content = [
        company.name,
        company.description || '',
        company.industry || '',
        company.website || '',
        `Status: ${company.status}`,
        company.contacts.length > 0 ? `Kontakty: ${company.contacts.map(c => `${c.firstName} ${c.lastName}`).join(', ')}` : '',
        company.deals.length > 0 ? `Transakcje: ${company.deals.map(d => d.title).join(', ')}` : ''
      ].filter(Boolean).join('\n');

      await vectorService.createVectorDocument(
        organizationId,
        company.name,
        content,
        'company',
        company.id,
        { source: 'sync', language: 'pl' }
      );

      syncCount++;
    } catch (error) {
      logger.error(`Failed to sync company ${company.id}:`, error);
    }
  }

  return syncCount;
}

async function syncKnowledge(organizationId: string, entityId?: string, force: boolean = false): Promise<number> {
  const where: any = { organizationId };
  if (entityId) where.id = entityId;

  const knowledgeItems = await prisma.knowledgeBase.findMany({
    where
  });

  let syncCount = 0;
  for (const item of knowledgeItems) {
    try {
      if (!force) {
        const existing = await prisma.vectorDocument.findFirst({
          where: { entityType: 'knowledge', entityId: item.id }
        });
        if (existing) continue;
      }

      const content = [
        item.title,
        item.content,
        `Kategoria: ${item.category}`,
        item.tags.length > 0 ? `Tagi: ${item.tags.join(', ')}` : ''
      ].filter(Boolean).join('\n');

      await vectorService.createVectorDocument(
        organizationId,
        item.title,
        content,
        'knowledge',
        item.id,
        { source: 'sync', language: 'pl' }
      );

      syncCount++;
    } catch (error) {
      logger.error(`Failed to sync knowledge ${item.id}:`, error);
    }
  }

  return syncCount;
}

export default router;