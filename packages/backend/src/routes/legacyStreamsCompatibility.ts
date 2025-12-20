/**
 * Legacy Streams Compatibility Layer
 * Handles backward compatibility by mapping old streams API to GTD Streams
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';

const router = Router();

// Apply authentication middleware
router.use(authenticateUser);

/**
 * Legacy compatibility middleware that maps old streams API to GTD Streams
 */
const legacyToGTDAdapter = (req: Request, res: Response, next: NextFunction) => {
  // Add GTD context to request for legacy endpoints
  req.body.isLegacyRequest = true;
  
  // Log legacy API usage for monitoring
  console.log(`📊 Legacy Streams API used: ${req.method} ${req.path}`);
  
  next();
};

router.use(legacyToGTDAdapter);

// GET /api/streams -> GET /api/gtd-streams with compatibility layer
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      status,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for GTD streams
    const where: any = {
      organizationId: req.user.organizationId
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;

    // Get GTD streams with legacy-compatible format
    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          _count: {
            select: {
              tasks: true,
              projects: true
            }
          }
        }
      }),
      prisma.stream.count({ where })
    ]);

    // Format response in legacy format but include GTD data
    const legacyFormattedStreams = streams.map(stream => ({
      id: stream.id,
      name: stream.name,
      description: stream.description,
      color: stream.color,
      icon: stream.icon,
      status: stream.status,
      settings: stream.settings,
      createdAt: stream.createdAt,
      updatedAt: stream.updatedAt,
      createdBy: stream.createdBy,
      _count: stream._count,
      // Add GTD information for enhanced functionality
      gtdRole: stream.gtdRole,
      streamType: stream.streamType,
      gtdConfig: stream.gtdConfig,
      isGTDEnabled: true, // All streams are now GTD-enabled
      templateOrigin: stream.templateOrigin
    }));

    res.json({
      streams: legacyFormattedStreams,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      // Add migration notice
      migration: {
        notice: 'This endpoint now uses GTD Streams. Consider migrating to /api/v1/gtd-streams for full functionality.',
        gtdEnabled: true
      }
    });

  } catch (error) {
    console.error('Error in legacy streams endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch streams',
      migration: {
        notice: 'Legacy endpoint. Please use /api/v1/gtd-streams for full functionality.'
      }
    });
  }
});

// GET /api/streams/:id -> Map to GTD stream with compatibility
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const stream = await prisma.stream.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            startDate: true,
            endDate: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            tasks: true,
            projects: true
          }
        }
      }
    });

    if (!stream) {
      return res.status(404).json({ 
        error: 'Stream not found',
        migration: {
          notice: 'Legacy endpoint. Please use /api/v1/gtd-streams for full functionality.'
        }
      });
    }

    // Return in legacy format with GTD enhancements
    const legacyFormattedStream = {
      ...stream,
      // Legacy compatibility
      isGTDEnabled: true,
      gtdRole: stream.gtdRole,
      streamType: stream.streamType,
      gtdConfig: stream.gtdConfig,
      migration: {
        notice: 'This stream has been migrated to GTD. Use /api/v1/gtd-streams for full GTD functionality.',
        gtdEndpoint: `/api/v1/gtd-streams/${id}`
      }
    };

    res.json(legacyFormattedStream);

  } catch (error) {
    console.error('Error fetching legacy stream:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stream',
      migration: {
        notice: 'Legacy endpoint. Please use /api/v1/gtd-streams for full functionality.'
      }
    });
  }
});

// POST /api/streams -> Create GTD stream with defaults
router.post('/', async (req, res) => {
  try {
    const streamData = req.body;
    
    // Default GTD role if not specified
    if (!streamData.gtdRole) {
      streamData.gtdRole = 'AREAS'; // Safe default
    }
    
    if (!streamData.streamType) {
      streamData.streamType = 'CUSTOM';
    }

    // Add default GTD config
    if (!streamData.gtdConfig) {
      streamData.gtdConfig = {
        autoRouting: true,
        notificationsEnabled: true,
        energyTracking: false,
        timeEstimation: true,
        contextFiltering: true
      };
    }

    // Check if stream name is unique within organization
    const existingStream = await prisma.stream.findFirst({
      where: {
        name: streamData.name,
        organizationId: req.user.organizationId
      }
    });

    if (existingStream) {
      return res.status(400).json({ 
        error: 'Stream name already exists',
        migration: {
          notice: 'Legacy endpoint. Consider using /api/v1/gtd-streams for enhanced functionality.'
        }
      });
    }

    const stream = await prisma.stream.create({
      data: {
        name: streamData.name,
        description: streamData.description,
        color: streamData.color || '#3B82F6',
        icon: streamData.icon,
        settings: streamData.settings || {},
        status: streamData.status || 'ACTIVE',
        gtdRole: streamData.gtdRole,
        streamType: streamData.streamType,
        gtdConfig: streamData.gtdConfig,
        templateOrigin: streamData.templateOrigin,
        organizationId: req.user.organizationId,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        _count: {
          select: {
            tasks: true,
            projects: true
          }
        }
      }
    });

    res.status(201).json({
      ...stream,
      migration: {
        notice: 'Stream created with GTD functionality. Use /api/v1/gtd-streams for full GTD features.',
        gtdEndpoint: `/api/v1/gtd-streams/${stream.id}`
      }
    });

  } catch (error) {
    console.error('Error creating legacy stream:', error);
    res.status(500).json({ 
      error: 'Failed to create stream',
      migration: {
        notice: 'Legacy endpoint. Please use /api/v1/gtd-streams for full functionality.'
      }
    });
  }
});

// PUT /api/streams/:id -> Update GTD stream
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if stream exists and belongs to user's organization
    const existingStream = await prisma.stream.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingStream) {
      return res.status(404).json({ 
        error: 'Stream not found',
        migration: {
          notice: 'Legacy endpoint. Please use /api/v1/gtd-streams for full functionality.'
        }
      });
    }

    // Preserve GTD data while updating
    const stream = await prisma.stream.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        _count: {
          select: {
            tasks: true,
            projects: true
          }
        }
      }
    });

    res.json({
      ...stream,
      migration: {
        notice: 'Stream updated with GTD functionality preserved. Use /api/v1/gtd-streams for full GTD features.',
        gtdEndpoint: `/api/v1/gtd-streams/${id}`
      }
    });

  } catch (error) {
    console.error('Error updating legacy stream:', error);
    res.status(500).json({ 
      error: 'Failed to update stream',
      migration: {
        notice: 'Legacy endpoint. Please use /api/v1/gtd-streams for full functionality.'
      }
    });
  }
});

// DELETE /api/streams/:id -> Delete GTD stream with safety checks
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if stream exists and belongs to user's organization
    const existingStream = await prisma.stream.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        _count: {
          select: {
            tasks: true,
            projects: true
          }
        }
      }
    });

    if (!existingStream) {
      return res.status(404).json({ 
        error: 'Stream not found',
        migration: {
          notice: 'Legacy endpoint. Please use /api/v1/gtd-streams for full functionality.'
        }
      });
    }

    // Check if stream has associated tasks or projects
    if (existingStream._count.tasks > 0 || existingStream._count.projects > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete stream with associated tasks or projects. Please move them to another stream first.',
        details: {
          tasks: existingStream._count.tasks,
          projects: existingStream._count.projects
        },
        migration: {
          notice: 'Legacy endpoint. Please use /api/v1/gtd-streams for full functionality.'
        }
      });
    }

    await prisma.stream.delete({
      where: { id }
    });

    res.status(204).send();

  } catch (error) {
    console.error('Error deleting legacy stream:', error);
    res.status(500).json({ 
      error: 'Failed to delete stream',
      migration: {
        notice: 'Legacy endpoint. Please use /api/v1/gtd-streams for full functionality.'
      }
    });
  }
});

// Add helpful endpoint that explains the migration
router.get('/migration-info', (req, res) => {
  res.json({
    message: 'Streams Migration Information',
    status: 'All streams have been migrated to GTD Streams',
    legacySupport: 'This endpoint provides backward compatibility',
    recommendedEndpoint: '/api/v1/gtd-streams',
    newFeatures: [
      'GTD Role assignment (INBOX, NEXT_ACTIONS, PROJECTS, etc.)',
      'Stream Type classification (WORKSPACE, PROJECT, AREA, CONTEXT)',
      'GTD Configuration with role-specific settings',
      'Enhanced hierarchy management',
      'Automatic resource routing',
      'GTD-compliant workflow processing'
    ],
    migrationDate: new Date().toISOString(),
    backwardCompatibility: 'Full compatibility maintained for existing API calls'
  });
});

export default router;