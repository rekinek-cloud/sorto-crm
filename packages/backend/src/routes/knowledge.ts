import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all knowledge routes
router.use(authenticateToken);

// GET /api/v1/knowledge/documents - Get all documents
router.get('/documents', async (req, res) => {
  try {
    const { folderId, type, status, search } = req.query;
    const organizationId = req.user!.organizationId;

    const where: any = { organizationId };

    if (folderId) where.folderId = folderId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } }
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        folder: true,
        _count: { select: { comments: true, shares: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      message: 'Documents retrieved successfully',
      data: documents
    });
  } catch (error) {
    logger.error('Failed to fetch documents', { error });
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// GET /api/v1/knowledge/documents/:id - Get single document
router.get('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const document = await prisma.document.findFirst({
      where: { id, organizationId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        folder: true,
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            replies: {
              include: {
                author: { select: { id: true, firstName: true, lastName: true, avatar: true } }
              }
            }
          },
          where: { parentId: null },
          orderBy: { createdAt: 'desc' }
        },
        shares: {
          include: {
            sharedWith: { select: { id: true, firstName: true, lastName: true, avatar: true } }
          }
        },
        linkedDocuments: {
          include: {
            targetDocument: { select: { id: true, title: true, type: true } }
          }
        },
        backlinkedDocuments: {
          include: {
            sourceDocument: { select: { id: true, title: true, type: true } }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Increment view count
    await prisma.document.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      message: 'Document retrieved successfully',
      data: document
    });
  } catch (error) {
    logger.error('Failed to fetch document', { error });
    res.status(500).json({ message: 'Failed to fetch document' });
  }
});

// POST /api/v1/knowledge/documents - Create document
router.post('/documents', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;
    const { title, content, summary, type, folderId, tags } = req.body;

    const document = await prisma.document.create({
      data: {
        title,
        content,
        summary,
        type: type || 'NOTE',
        folderId,
        tags: tags || [],
        authorId: userId,
        organizationId
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        folder: true
      }
    });

    // Update search index
    await prisma.searchIndex.create({
      data: {
        entityType: 'document',
        entityId: document.id,
        title: document.title,
        content: document.content + ' ' + (document.summary || ''),
        organizationId
      }
    });

    res.status(201).json({
      message: 'Document created successfully',
      data: document
    });
  } catch (error) {
    logger.error('Failed to create document', { error });
    res.status(500).json({ message: 'Failed to create document' });
  }
});

// PUT /api/v1/knowledge/documents/:id - Update document
router.put('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { title, content, summary, type, status, folderId, tags } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        title,
        content,
        summary,
        type,
        status,
        folderId,
        tags,
        version: { increment: 1 }
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        folder: true
      }
    });

    // Update search index
    await prisma.searchIndex.update({
      where: { entityType_entityId: { entityType: 'document', entityId: id } },
      data: {
        title: document.title,
        content: document.content + ' ' + (document.summary || '')
      }
    });

    res.json({
      message: 'Document updated successfully',
      data: document
    });
  } catch (error) {
    logger.error('Failed to update document', { error });
    res.status(500).json({ message: 'Failed to update document' });
  }
});

// GET /api/v1/knowledge/folders - Get all folders
router.get('/folders', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

    const folders = await prisma.folder.findMany({
      where: { organizationId, parentId: null },
      include: {
        children: true,
        _count: { select: { documents: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      message: 'Folders retrieved successfully',
      data: folders
    });
  } catch (error) {
    logger.error('Failed to fetch folders', { error });
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
});

// GET /api/v1/knowledge/wiki - Get wiki pages
router.get('/wiki', async (req, res) => {
  try {
    const { categoryId, search } = req.query;
    const organizationId = req.user!.organizationId;

    const where: any = { organizationId, isPublished: true };

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const pages = await prisma.wikiPage.findMany({
      where,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        category: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      message: 'Wiki pages retrieved successfully',
      data: pages
    });
  } catch (error) {
    logger.error('Failed to fetch wiki pages', { error });
    res.status(500).json({ message: 'Failed to fetch wiki pages' });
  }
});

// GET /api/v1/knowledge/wiki/:slug - Get wiki page by slug
router.get('/wiki/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const organizationId = req.user!.organizationId;

    const page = await prisma.wikiPage.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        category: true,
        linkedPages: {
          include: {
            targetPage: { select: { id: true, title: true, slug: true } }
          }
        },
        backlinkedPages: {
          include: {
            sourcePage: { select: { id: true, title: true, slug: true } }
          }
        }
      }
    });

    if (!page) {
      return res.status(404).json({ message: 'Wiki page not found' });
    }

    res.json({
      message: 'Wiki page retrieved successfully',
      data: page
    });
  } catch (error) {
    logger.error('Failed to fetch wiki page', { error });
    res.status(500).json({ message: 'Failed to fetch wiki page' });
  }
});

// GET /api/v1/knowledge/search - Full-text search
router.get('/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    const organizationId = req.user!.organizationId;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const where: any = {
      organizationId,
      OR: [
        { title: { contains: q as string, mode: 'insensitive' } },
        { content: { contains: q as string, mode: 'insensitive' } }
      ]
    };

    if (type) where.entityType = type;

    const results = await prisma.searchIndex.findMany({
      where,
      take: 20,
      orderBy: { updatedAt: 'desc' }
    });

    // Fetch actual entities based on search results
    const documents = results
      .filter(r => r.entityType === 'document')
      .map(r => r.entityId);
    
    const wikiPages = results
      .filter(r => r.entityType === 'wiki_page')
      .map(r => r.entityId);

    const [foundDocuments, foundWikiPages] = await Promise.all([
      documents.length > 0 ? prisma.document.findMany({
        where: { id: { in: documents } },
        include: { author: true, folder: true }
      }) : [],
      wikiPages.length > 0 ? prisma.wikiPage.findMany({
        where: { id: { in: wikiPages } },
        include: { author: true, category: true }
      }) : []
    ]);

    res.json({
      message: 'Search completed successfully',
      data: {
        documents: foundDocuments,
        wikiPages: foundWikiPages,
        total: foundDocuments.length + foundWikiPages.length
      }
    });
  } catch (error) {
    logger.error('Failed to search', { error });
    res.status(500).json({ message: 'Failed to search' });
  }
});

// POST /api/v1/knowledge/documents/:id/comments - Add comment
router.post('/documents/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { content, parentId } = req.body;

    const comment = await prisma.documentComment.create({
      data: {
        content,
        documentId: id,
        authorId: userId,
        parentId
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatar: true } }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Failed to add comment', { error });
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// POST /api/v1/knowledge/documents/:id/share - Share document
router.post('/documents/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { sharedWithId, permission } = req.body;

    const share = await prisma.documentShare.create({
      data: {
        documentId: id,
        sharedWithId,
        sharedById: userId,
        permission: permission || 'READ'
      },
      include: {
        sharedWith: { select: { id: true, firstName: true, lastName: true, avatar: true } }
      }
    });

    res.status(201).json({
      message: 'Document shared successfully',
      data: share
    });
  } catch (error) {
    logger.error('Failed to share document', { error });
    res.status(500).json({ message: 'Failed to share document' });
  }
});

export default router;