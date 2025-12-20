/**
 * GTD Streams API Routes
 * Endpointy dla zaawansowanej funkcjonalności GTD w systemie Streams
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';
import { z } from 'zod';
import { StreamService } from '../services/StreamService';
import { GTDConfigManager } from '../services/GTDConfigManager';
import { EnhancedStreamHierarchyManager } from '../services/EnhancedStreamHierarchyManager';
import { ResourceRouter } from '../services/ResourceRouter';
import { GTDProcessingRuleEngine } from '../services/GTDProcessingRuleEngine';
import { VectorService } from '../services/VectorService';
import {
  GTDRoleSchema,
  StreamTypeSchema,
  GTDConfigSchema,
  EnergyLevelSchema,
  ReviewFrequencySchema,
  GTDContextSchema
} from '../types/gtd';
import { GTDRole, StreamType } from '@prisma/client';

const router = Router();

// Initialize services
const streamService = new StreamService(prisma);
const gtdConfigManager = new GTDConfigManager(prisma);
const hierarchyManager = new EnhancedStreamHierarchyManager(prisma);
const resourceRouter = new ResourceRouter(prisma);
const ruleEngine = new GTDProcessingRuleEngine(prisma);
const vectorService = new VectorService(prisma);

// Apply authentication middleware to all routes
router.use(authenticateUser);

// ========================================
// GTD STREAMS LIST & MANAGEMENT
// ========================================

/**
 * GET /api/v1/gtd-streams
 * Get all GTD streams for user's organization
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.user;

    // Get all streams for the organization
    const streams = await prisma.stream.findMany({
      where: {
        organizationId: organizationId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        gtdRole: true,
        streamType: true,
        status: true,
        templateOrigin: true,
        settings: true,
        gtdConfig: true,
        createdAt: true,
        updatedAt: true,
        // Include counts
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: [
        { gtdRole: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: streams,
      meta: {
        total: streams.length,
        byRole: streams.reduce((acc, stream) => {
          const role = stream.gtdRole || 'NONE';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error fetching GTD streams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GTD streams'
    });
  }
});

// ========================================
// GTD STREAM CREATION & MANAGEMENT
// ========================================

// Schema for creating GTD Stream
const createGTDStreamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  icon: z.string().optional(),
  gtdRole: GTDRoleSchema,
  streamType: StreamTypeSchema,
  templateOrigin: z.string().optional(),
  parentStreamId: z.string().uuid().optional(),
  gtdConfig: GTDConfigSchema.partial().optional()
});

// POST /api/gtd-streams - Create new GTD-enabled stream
router.post('/', async (req, res) => {
  try {
    const validatedData = createGTDStreamSchema.parse(req.body);

    const { stream, config } = await streamService.createGTDStream(
      req.user.organizationId,
      req.user.id,
      validatedData
    );

    res.status(201).json({
      success: true,
      data: {
        stream,
        gtdConfig: config
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Error creating GTD stream:', error);
    res.status(500).json({ error: 'Failed to create GTD stream' });
  }
});

// GET /api/gtd-streams/by-role/:role - Get streams by GTD role
router.get('/by-role/:role', async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role
    const validatedRole = GTDRoleSchema.parse(role);

    const streams = await streamService.getStreamsByGTDRole(
      req.user.organizationId,
      validatedRole as GTDRole
    );

    res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid GTD role'
      });
    }
    console.error('Error fetching streams by role:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// PUT /api/gtd-streams/:id/role - Assign GTD role to stream
router.put('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { gtdRole } = req.body;

    const validatedRole = GTDRoleSchema.parse(gtdRole);

    const stream = await streamService.assignGTDRole(id, validatedRole as GTDRole);

    res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid GTD role'
      });
    }
    console.error('Error assigning GTD role:', error);
    res.status(500).json({ error: 'Failed to assign GTD role' });
  }
});

// POST /api/gtd-streams/:id/migrate - Migrate existing stream to GTD
router.post('/:id/migrate', async (req, res) => {
  try {
    const { id } = req.params;
    const { gtdRole, streamType } = req.body;

    const validatedRole = GTDRoleSchema.parse(gtdRole);
    const validatedType = streamType ? StreamTypeSchema.parse(streamType) : StreamType.CUSTOM;

    const { stream, config } = await streamService.migrateToGTDStream(
      id,
      validatedRole as GTDRole,
      validatedType as StreamType
    );

    res.json({
      success: true,
      data: {
        stream,
        gtdConfig: config
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Error migrating stream to GTD:', error);
    res.status(500).json({ error: 'Failed to migrate stream' });
  }
});

// ========================================
// FLOW / FROZEN OPERATIONS
// ========================================

// POST /api/gtd-streams/:id/freeze - Freeze stream and its children
router.post('/:id/freeze', async (req, res) => {
  try {
    const { id } = req.params;

    await streamService.freezeStream(id);

    res.json({
      success: true,
      message: 'Stream frozen successfully'
    });
  } catch (error) {
    console.error('Error freezing stream:', error);
    res.status(500).json({ error: 'Failed to freeze stream' });
  }
});

// POST /api/gtd-streams/:id/unfreeze - Unfreeze stream and its parents
router.post('/:id/unfreeze', async (req, res) => {
  try {
    const { id } = req.params;

    await streamService.unfreezeStream(id);

    res.json({
      success: true,
      message: 'Stream unfrozen successfully'
    });
  } catch (error) {
    console.error('Error unfreezing stream:', error);
    res.status(500).json({ error: 'Failed to unfreeze stream' });
  }
});

// ========================================
// GTD CONFIGURATION MANAGEMENT
// ========================================

// GET /api/gtd-streams/:id/config - Get GTD configuration
router.get('/:id/config', async (req, res) => {
  try {
    const { id } = req.params;

    const config = await streamService.getGTDConfig(id);

    if (!config) {
      return res.status(404).json({ error: 'GTD configuration not found' });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching GTD config:', error);
    res.status(500).json({ error: 'Failed to fetch GTD configuration' });
  }
});

// PUT /api/gtd-streams/:id/config - Update GTD configuration
router.put('/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const { config, options = {} } = req.body;

    const updatedConfig = await streamService.updateGTDConfig(id, config, options);

    res.json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating GTD config:', error);
    res.status(500).json({ error: 'Failed to update GTD configuration' });
  }
});

// POST /api/gtd-streams/:id/config/reset - Reset to default configuration
router.post('/:id/config/reset', async (req, res) => {
  try {
    const { id } = req.params;

    // Get stream to find its GTD role
    const stream = await prisma.stream.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!stream || !stream.gtdRole) {
      return res.status(404).json({ error: 'GTD stream not found' });
    }

    const config = await gtdConfigManager.resetToDefaultConfig(id, stream.gtdRole);

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error resetting GTD config:', error);
    res.status(500).json({ error: 'Failed to reset GTD configuration' });
  }
});

// ========================================
// HIERARCHY MANAGEMENT
// ========================================

// GET /api/gtd-streams/:id/tree - Get stream hierarchy tree
router.get('/:id/tree', async (req, res) => {
  try {
    const { id } = req.params;
    const { maxDepth = 10, includeGTDAnalysis = true } = req.query;

    const tree = await hierarchyManager.getStreamTree(id, {
      maxDepth: parseInt(maxDepth as string),
      includeGTDAnalysis: includeGTDAnalysis === 'true'
    });

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Error fetching stream tree:', error);
    res.status(500).json({ error: 'Failed to fetch stream hierarchy' });
  }
});

// GET /api/gtd-streams/:id/ancestors - Get stream ancestors
router.get('/:id/ancestors', async (req, res) => {
  try {
    const { id } = req.params;

    const ancestors = await hierarchyManager.getStreamAncestors(id);

    res.json({
      success: true,
      data: ancestors
    });
  } catch (error) {
    console.error('Error fetching stream ancestors:', error);
    res.status(500).json({ error: 'Failed to fetch ancestors' });
  }
});

// GET /api/gtd-streams/:id/path - Get stream path (breadcrumb)
router.get('/:id/path', async (req, res) => {
  try {
    const { id } = req.params;

    const path = await hierarchyManager.getStreamPath(id);

    res.json({
      success: true,
      data: path
    });
  } catch (error) {
    console.error('Error fetching stream path:', error);
    res.status(500).json({ error: 'Failed to fetch stream path' });
  }
});

// POST /api/gtd-streams/:id/validate-hierarchy - Validate GTD hierarchy
router.post('/:id/validate-hierarchy', async (req, res) => {
  try {
    const { id } = req.params;

    const validation = await streamService.validateGTDHierarchy(id);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating hierarchy:', error);
    res.status(500).json({ error: 'Failed to validate hierarchy' });
  }
});

// ========================================
// RESOURCE ROUTING
// ========================================

// POST /api/gtd-streams/route/task - Route task to appropriate stream
router.post('/route/task', async (req, res) => {
  try {
    const { taskId, preferredStreamId, forceStream = false } = req.body;

    const result = await resourceRouter.routeTaskToStream(taskId, {
      organizationId: req.user.organizationId,
      userId: req.user.id,
      preferredStreamId,
      forceStream
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error routing task:', error);
    res.status(500).json({ error: 'Failed to route task' });
  }
});

// POST /api/gtd-streams/route/email - Route email to appropriate stream
router.post('/route/email', async (req, res) => {
  try {
    const { messageId, preferredStreamId } = req.body;

    const result = await resourceRouter.routeEmailToStream(messageId, {
      organizationId: req.user.organizationId,
      userId: req.user.id,
      preferredStreamId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error routing email:', error);
    res.status(500).json({ error: 'Failed to route email' });
  }
});

// POST /api/gtd-streams/route/bulk - Bulk route resources
router.post('/route/bulk', async (req, res) => {
  try {
    const { resources } = req.body; // Array of { type, id }

    const results = await resourceRouter.bulkRoute(resources, {
      organizationId: req.user.organizationId,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error bulk routing:', error);
    res.status(500).json({ error: 'Failed to bulk route resources' });
  }
});

// POST /api/gtd-streams/route/content - Route generic content (e.g. Source item)
router.post('/route/content', async (req, res) => {
  try {
    const { content, enableAI = true } = req.body;

    const result = await resourceRouter.routeContentToStream(content, {
      organizationId: req.user.organizationId,
      userId: req.user.id,
      enableAI
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error routing content:', error);
    // Return fallback suggestion instead of error
    res.json({
      success: true,
      data: {
        streamId: null,
        streamName: 'Inbox',
        confidence: 0.3,
        reasoning: ['Automatyczne sugestie są tymczasowo niedostępne. Wybierz strumień ręcznie.'],
        suggestedActions: ['DO', 'PROJECT', 'REFERENCE']
      }
    });
  }
});

// ========================================
// GTD ANALYSIS & SUGGESTIONS
// ========================================

// POST /api/gtd-streams/analyze - Analyze content for GTD suggestions
router.post('/analyze', async (req, res) => {
  try {
    const { name, description, existingTasks, relatedContacts, messageVolume } = req.body;

    const analysis = await streamService.analyzeForGTD({
      name,
      description,
      existingTasks,
      relatedContacts,
      messageVolume
    });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing for GTD:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
  }
});

// ========================================
// STATISTICS & INSIGHTS
// ========================================

// GET /api/gtd-streams/stats - Get GTD statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await gtdConfigManager.getGTDStats(req.user.organizationId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching GTD stats:', error);
    res.status(500).json({ error: 'Failed to fetch GTD statistics' });
  }
});

// GET /api/gtd-streams/hierarchy-stats - Get hierarchy statistics
router.get('/hierarchy-stats', async (req, res) => {
  try {
    const stats = await hierarchyManager.getGTDHierarchyStats(req.user.organizationId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching hierarchy stats:', error);
    res.status(500).json({ error: 'Failed to fetch hierarchy statistics' });
  }
});

// GET /api/gtd-streams/routing-stats - Get routing statistics
router.get('/routing-stats', async (req, res) => {
  try {
    const stats = await resourceRouter.getRoutingStats(req.user.organizationId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching routing stats:', error);
    res.status(500).json({ error: 'Failed to fetch routing statistics' });
  }
});

// ========================================
// PROCESSING RULES
// ========================================

// POST /api/gtd-streams/:id/rules - Create processing rule for stream
router.post('/:id/rules', async (req, res) => {
  try {
    const { id } = req.params;
    const ruleData = req.body;

    const rule = await ruleEngine.createGTDRule({
      ...ruleData,
      streamId: id,
      organizationId: req.user.organizationId
    });

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error creating GTD rule:', error);
    res.status(500).json({ error: 'Failed to create processing rule' });
  }
});

// GET /api/gtd-streams/:id/rules - Get processing rules for stream
router.get('/:id/rules', async (req, res) => {
  try {
    const { id } = req.params;

    const rules = await ruleEngine.getStreamRules(id);

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching GTD rules:', error);
    res.status(500).json({ error: 'Failed to fetch processing rules' });
  }
});

// POST /api/gtd-streams/rules/execute - Manually execute rules
router.post('/rules/execute', async (req, res) => {
  try {
    const { entityType, entityId, streamId } = req.body;

    const results = await ruleEngine.executeGTDRules({
      entityType,
      entityId,
      entityData: {},
      organizationId: req.user.organizationId,
      userId: req.user.id,
      triggeredBy: 'MANUAL',
      streamId
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error executing GTD rules:', error);
    res.status(500).json({ error: 'Failed to execute rules' });
  }
});

// ========================================
// VECTOR INDEXING
// ========================================

/**
 * POST /api/v1/gtd-streams/index-vectors
 * Index all streams for vector-based semantic search
 */
router.post('/index-vectors', async (req, res) => {
  try {
    const { organizationId } = req.user;

    console.log(`Starting stream vector indexing for organization ${organizationId}`);

    const result = await vectorService.indexStreams(organizationId);

    res.json({
      success: true,
      data: {
        indexed: result.indexed,
        errors: result.errors,
        message: `Successfully indexed ${result.indexed} streams`
      }
    });
  } catch (error) {
    console.error('Error indexing streams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to index streams for vector search'
    });
  }
});

/**
 * GET /api/v1/gtd-streams/vector-status
 * Check vector indexing status for streams
 */
router.get('/vector-status', async (req, res) => {
  try {
    const { organizationId } = req.user;

    // Count streams
    const totalStreams = await prisma.stream.count({
      where: { organizationId, status: 'ACTIVE' }
    });

    // Count indexed streams in vector_documents
    const indexedStreams = await prisma.vector_documents.count({
      where: {
        organizationId,
        entityType: 'STREAM'
      }
    });

    res.json({
      success: true,
      data: {
        totalStreams,
        indexedStreams,
        coverage: totalStreams > 0 ? Math.round((indexedStreams / totalStreams) * 100) : 0,
        needsIndexing: totalStreams - indexedStreams
      }
    });
  } catch (error) {
    console.error('Error checking vector status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check vector status'
    });
  }
});

export default router;