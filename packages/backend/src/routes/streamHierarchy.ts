import express from 'express';
import { z } from 'zod';
import StreamHierarchyService, { CreateStreamRelationInput, UpdateStreamRelationInput, StreamHierarchyQuery } from '../services/StreamHierarchyService';
import StreamAccessControlService from '../services/StreamAccessControlService';
import { authenticateToken } from '../shared/middleware/auth';
import { DataScope } from '@prisma/client';
import { prisma } from '../config/database';

const router = express.Router();

// Middleware uwierzytelniania dla wszystkich routes
router.use(authenticateToken);

// Validation schemas - Allow both UUID and custom stream IDs
const CreateRelationSchema = z.object({
  parentId: z.string().min(1, 'Parent stream ID is required'),
  childId: z.string().min(1, 'Child stream ID is required'),
  relationType: z.enum(['OWNS', 'MANAGES', 'BELONGS_TO', 'RELATED_TO', 'DEPENDS_ON', 'SUPPORTS']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  inheritanceRule: z.enum(['NO_INHERITANCE', 'INHERIT_DOWN', 'INHERIT_UP', 'BIDIRECTIONAL']).default('INHERIT_DOWN'),
  permissions: z.array(z.object({
    dataScope: z.enum(['BASIC_INFO', 'TASKS', 'PROJECTS', 'FINANCIAL', 'METRICS', 'COMMUNICATION', 'PERMISSIONS', 'CONFIGURATION', 'AUDIT_LOGS']),
    action: z.enum(['read', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'APPROVE', 'AUDIT']),
    granted: z.boolean().default(true)
  })).optional()
});

const UpdateRelationSchema = z.object({
  relationType: z.enum(['OWNS', 'MANAGES', 'BELONGS_TO', 'RELATED_TO', 'DEPENDS_ON', 'SUPPORTS']).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  inheritanceRule: z.enum(['NO_INHERITANCE', 'INHERIT_DOWN', 'INHERIT_UP', 'BIDIRECTIONAL']).optional()
});

const HierarchyQuerySchema = z.object({
  depth: z.coerce.number().int().min(1).max(10).default(3),
  includePermissions: z.coerce.boolean().default(false),
  direction: z.enum(['up', 'down', 'both']).default('both')
});

const RelatedStreamsQuerySchema = z.object({
  relationType: z.enum(['OWNS', 'MANAGES', 'BELONGS_TO', 'RELATED_TO', 'DEPENDS_ON', 'SUPPORTS']).optional(),
  organizationId: z.string().uuid().optional()
});

/**
 * POST /api/v1/stream-hierarchy/:id/relations
 * Tworzy nową relację hierarchiczną dla strumienia
 */
router.post('/:streamId/relations', async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = (req as any).user?.id;
    const organizationId = (req as any).user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Walidacja danych wejściowych
    const validationResult = CreateRelationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
    }

    const data = validationResult.data;

    // Sprawdzenie czy użytkownik ma uprawnienia do tworzenia relacji
    const canManageHierarchy = await StreamAccessControlService.checkDirectAccess(
      userId,
      streamId,
      DataScope.PERMISSIONS,
      'MANAGE'
    );

    if (!canManageHierarchy.hasAccess) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to manage stream hierarchy' 
      });
    }

    // Sprawdzenie czy streamId jest parentId lub childId
    if (data.parentId !== streamId && data.childId !== streamId) {
      return res.status(400).json({ 
        error: 'Stream ID must be either parent or child in the relation' 
      });
    }

    // Utworzenie relacji
    const relationData = {
      ...data,
      organizationId: organizationId as string,
      createdById: userId as string
    } as CreateStreamRelationInput;

    const relation = await StreamHierarchyService.createRelation(relationData);

    // Logowanie dostępu
    await StreamAccessControlService.logAccess(
      userId,
      streamId,
      'CREATE',
      DataScope.PERMISSIONS,
      true,
      undefined,
      relation.id
    );

    return res.status(201).json({
      success: true,
      data: relation
    });

  } catch (error: any) {
    console.error('Error creating stream relation:', error);
    
    // Logowanie nieudanego dostępu
    const userId = (req as any).user?.id;
    const { streamId } = req.params;
    if (userId && streamId) {
      await StreamAccessControlService.logAccess(
        userId,
        streamId,
        'CREATE',
        DataScope.PERMISSIONS,
        false
      );
    }

    return res.status(500).json({ 
      error: 'Failed to create stream relation',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/streams/:id/hierarchy
 * Pobiera hierarchię strumienia
 */
router.get('/:streamId/hierarchy', async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Walidacja query parameters
    const queryResult = HierarchyQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: queryResult.error.issues 
      });
    }

    const query = queryResult.data;

    // Simple access control: check if stream belongs to user's organization
    const { organizationId } = (req as any).user;
    const stream = await prisma.stream.findFirst({
      where: { 
        id: streamId,
        organizationId 
      }
    });

    if (!stream) {
      return res.status(404).json({ 
        error: 'Stream not found or access denied' 
      });
    }

    // Pobranie hierarchii
    const hierarchyQuery: StreamHierarchyQuery = {
      streamId,
      ...query
    };

    const hierarchy = await StreamHierarchyService.getStreamHierarchy(hierarchyQuery);

    // Simple access logging
    try {
      await StreamAccessControlService.logAccess(
        userId,
        streamId,
        'read',
        DataScope.BASIC_INFO,
        true
      );
    } catch (logError) {
      // Log access error but don't fail the request
      console.warn('Failed to log access:', logError);
    }

    return res.json({
      success: true,
      data: hierarchy
    });

  } catch (error: any) {
    console.error('Error fetching stream hierarchy:', error);
    
    // Simple error logging
    const errorUserId = (req as any).user?.id;
    const { streamId } = req.params;
    if (errorUserId && streamId) {
      try {
        await StreamAccessControlService.logAccess(
          errorUserId,
          streamId,
          'read',
          DataScope.BASIC_INFO,
          false
        );
      } catch (logError) {
        console.warn('Failed to log error access:', logError);
      }
    }

    return res.status(500).json({ 
      error: 'Failed to fetch stream hierarchy',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/streams/:id/related
 * Pobiera powiązane strumienie
 */
router.get('/:streamId/related', async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = (req as any).user?.id;
    const organizationId = (req as any).user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Walidacja query parameters
    const queryResult = RelatedStreamsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: queryResult.error.issues 
      });
    }

    const query = queryResult.data;

    // Sprawdzenie uprawnień
    const canReadRelated = await StreamAccessControlService.checkRelationalAccess(
      userId,
      streamId,
      DataScope.BASIC_INFO,
      'read'
    );

    if (!canReadRelated.hasAccess) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to view related streams' 
      });
    }

    // Pobranie powiązanych strumieni
    const relatedStreams = await StreamHierarchyService.getRelatedStreams(
      streamId,
      query.relationType,
      query.organizationId || organizationId
    );

    // Logowanie dostępu
    await StreamAccessControlService.logAccess(
      userId,
      streamId,
      'read',
      DataScope.BASIC_INFO,
      true
    );

    return res.json({
      success: true,
      data: relatedStreams,
      count: relatedStreams.length
    });

  } catch (error: any) {
    console.error('Error fetching related streams:', error);
    
    const userId = (req as any).user?.id;
    const { streamId } = req.params;
    if (userId && streamId) {
      await StreamAccessControlService.logAccess(
        userId,
        streamId,
        'read',
        DataScope.BASIC_INFO,
        false
      );
    }

    return res.status(500).json({ 
      error: 'Failed to fetch related streams',
      message: error.message 
    });
  }
});

/**
 * PUT /api/v1/stream-relations/:id
 * Aktualizuje relację między strumieniami
 */
router.put('/relations/:relationId', async (req, res) => {
  try {
    const { relationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Walidacja danych wejściowych
    const validationResult = UpdateRelationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
    }

    const data = validationResult.data;

    // TODO: Sprawdzenie uprawnień do aktualizacji relacji
    // Potrzebuję najpierw pobrać relację żeby sprawdzić uprawnienia do obu strumieni

    // Aktualizacja relacji
    const relationData: UpdateStreamRelationInput = data;
    const updatedRelation = await StreamHierarchyService.updateRelation(relationId, relationData);

    return res.json({
      success: true,
      data: updatedRelation
    });

  } catch (error: any) {
    console.error('Error updating stream relation:', error);
    return res.status(500).json({ 
      error: 'Failed to update stream relation',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/v1/stream-relations/:id
 * Usuwa relację między strumieniami
 */
router.delete('/relations/:relationId', async (req, res) => {
  try {
    const { relationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // TODO: Sprawdzenie uprawnień do usuwania relacji

    // Usunięcie relacji
    await StreamHierarchyService.deleteRelation(relationId);

    return res.json({
      success: true,
      message: 'Stream relation deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting stream relation:', error);
    return res.status(500).json({ 
      error: 'Failed to delete stream relation',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/streams/hierarchy-stats
 * Pobiera statystyki hierarchii dla organizacji
 */
router.get('/hierarchy-stats', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const organizationId = (req as any).user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // TODO: Sprawdzenie uprawnień administratora

    const stats = await StreamHierarchyService.getHierarchyStats(organizationId);

    return res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Error fetching hierarchy stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch hierarchy stats',
      message: error.message 
    });
  }
});

/**
 * POST /api/v1/streams/:id/validate-cycle
 * Sprawdza czy dodanie relacji utworzyłoby cykl
 */
router.post('/:streamId/validate-cycle', async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { targetStreamId } = req.body;

    if (!targetStreamId) {
      return res.status(400).json({ error: 'targetStreamId is required' });
    }

    // Sprawdzenie uprawnień
    const canValidate = await StreamAccessControlService.checkRelationalAccess(
      userId,
      streamId,
      DataScope.BASIC_INFO,
      'read'
    );

    if (!canValidate.hasAccess) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to validate stream relations' 
      });
    }

    // Walidacja cyklu
    const wouldCreateCycle = await StreamHierarchyService.validateNoCycles(streamId, targetStreamId);

    return res.json({
      success: true,
      data: {
        wouldCreateCycle,
        isValid: !wouldCreateCycle
      }
    });

  } catch (error: any) {
    console.error('Error validating stream cycle:', error);
    return res.status(500).json({ 
      error: 'Failed to validate stream cycle',
      message: error.message 
    });
  }
});

export default router;
