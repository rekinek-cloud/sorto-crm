import express from 'express';
import { TaskStatus, Priority } from '@prisma/client';
import { prisma } from '../config/database';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';
import { streamWorkflowService, StreamProcessingDecision } from '../services/streamWorkflowService';
import { vectorService } from './vectorSearch';

const router = express.Router();

// Get all streams
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { search, status, page = '1', limit = '50', sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    const where: any = {
      organizationId: req.user!.organizationId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        include: {
          _count: {
            select: {
              tasks: true,
              projects: true
            }
          }
        },
        orderBy: { [sortBy as string]: sortOrder },
        take: parseInt(limit as string),
        skip: (parseInt(page as string) - 1) * parseInt(limit as string)
      }),
      prisma.stream.count({ where })
    ]);

    return res.json({
      streams,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
    return res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Create new stream
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, color, icon, status } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Stream name must be at least 2 characters' });
    }

    const stream = await prisma.stream.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        icon: icon || null,
        status: status || 'ACTIVE',
        organizationId: req.user!.organizationId,
        createdById: req.user!.id
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

    return res.status(201).json(stream);

    // Auto-index to RAG
    vectorService.indexStream(
      req.user!.organizationId, stream.id, stream.name, stream.description, stream.streamType
    ).catch(err => console.error('RAG index failed for stream:', err.message));
  } catch (error) {
    console.error('Error creating stream:', error);
    return res.status(500).json({ error: 'Failed to create stream' });
  }
});

// AI Suggest stream based on input
router.post('/ai/suggest', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { input, context } = req.body;

    if (!input || input.trim().length < 3) {
      return res.status(400).json({ error: 'Input must be at least 3 characters' });
    }

    // Get existing streams for context
    const existingStreams = await prisma.stream.findMany({
      where: {
        organizationId: req.user!.organizationId,
        status: 'ACTIVE'
      },
      select: {
        name: true,
        description: true,
        color: true
      },
      take: 10
    });

    // Check if OpenAI is configured
    const { config } = await import('../config/index.js');

    if (!config.OPENAI?.API_KEY) {
      // Fallback to simple suggestion without AI
      const suggestion = generateSimpleSuggestion(input, existingStreams);
      return res.json(suggestion);
    }

    // Use OpenAI for smart suggestion
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: config.OPENAI.API_KEY });

    const prompt = `Na podstawie opisu uzytkownika zaproponuj strumien pracy dla systemu STREAMS (metodologia produktywnosci).

Opis uzytkownika: "${input}"
${context ? `Dodatkowy kontekst: ${context}` : ''}

Istniejace strumienie uzytkownika:
${existingStreams.map(s => `- ${s.name}: ${s.description || 'brak opisu'}`).join('\n')}

Zaproponuj nowy strumien w formacie JSON:
{
  "name": "krotka nazwa strumienia (2-4 slowa)",
  "description": "krotki opis celu strumienia (1-2 zdania)",
  "color": "kolor hex (np. #3B82F6 dla niebieskiego)",
  "icon": "emoji pasujace do strumienia",
  "suggestedTasks": [
    {"title": "nazwa zadania", "priority": "HIGH/MEDIUM/LOW"},
    {"title": "nazwa zadania", "priority": "HIGH/MEDIUM/LOW"}
  ],
  "reasoning": "dlaczego ta propozycja jest odpowiednia"
}

Kolory do wyboru: #3B82F6 (niebieski), #10B981 (zielony), #F59E0B (zolty), #EF4444 (czerwony), #8B5CF6 (fioletowy), #EC4899 (rozowy), #06B6D4 (cyjan), #F97316 (pomaranczowy).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('Empty response from AI');
    }

    const suggestion = JSON.parse(result);

    return res.json({
      success: true,
      suggestion: {
        name: suggestion.name || 'Nowy strumien',
        description: suggestion.description || '',
        color: suggestion.color || '#3B82F6',
        icon: suggestion.icon || '',
        suggestedTasks: suggestion.suggestedTasks || [],
        reasoning: suggestion.reasoning || ''
      }
    });
  } catch (error) {
    console.error('Error generating AI suggestion:', error);

    // Fallback to simple suggestion
    const suggestion = generateSimpleSuggestion(req.body.input || '', []);
    return res.json({
      success: true,
      suggestion,
      fallback: true
    });
  }
});

// Helper function for simple suggestion without AI
function generateSimpleSuggestion(input: string, existingStreams: any[]) {
  const lowercaseInput = input.toLowerCase();

  let color = '#3B82F6';
  let icon = '';
  let description = '';

  if (lowercaseInput.includes('projekt') || lowercaseInput.includes('project')) {
    color = '#8B5CF6';
    icon = '';
    description = 'Strumien do zarzadzania projektem';
  } else if (lowercaseInput.includes('klient') || lowercaseInput.includes('client')) {
    color = '#10B981';
    icon = '';
    description = 'Strumien do obslugi klienta';
  } else if (lowercaseInput.includes('marketing') || lowercaseInput.includes('kampania')) {
    color = '#F59E0B';
    icon = '';
    description = 'Strumien dla dzialan marketingowych';
  } else if (lowercaseInput.includes('sprzedaz') || lowercaseInput.includes('sales')) {
    color = '#EF4444';
    icon = '';
    description = 'Strumien dla procesu sprzedazy';
  } else if (lowercaseInput.includes('admin') || lowercaseInput.includes('biuro')) {
    color = '#6B7280';
    icon = '';
    description = 'Strumien dla zadan administracyjnych';
  } else if (lowercaseInput.includes('dev') || lowercaseInput.includes('kod') || lowercaseInput.includes('programowanie')) {
    color = '#06B6D4';
    icon = '';
    description = 'Strumien dla prac deweloperskich';
  }

  const words = input.trim().split(' ').slice(0, 4);
  const name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  return {
    name: name || 'Nowy strumien',
    description: description || `Strumien utworzony na podstawie: ${input}`,
    color,
    icon,
    suggestedTasks: [] as any[],
    reasoning: 'Sugestia oparta na analizie slow kluczowych'
  };
}

// Get streams statistics
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [totalStreams, activeStreams, archivedStreams, totalTasks, totalProjects, streamUsage] = await Promise.all([
      prisma.stream.count({
        where: { organizationId: req.user!.organizationId }
      }),
      prisma.stream.count({
        where: { organizationId: req.user!.organizationId, status: 'ACTIVE' }
      }),
      prisma.stream.count({
        where: { organizationId: req.user!.organizationId, status: 'ARCHIVED' }
      }),
      prisma.task.count({
        where: { organizationId: req.user!.organizationId }
      }),
      prisma.project.count({
        where: { organizationId: req.user!.organizationId }
      }),
      prisma.stream.findMany({
        where: { organizationId: req.user!.organizationId },
        select: {
          id: true,
          name: true,
          color: true,
          _count: {
            select: {
              tasks: true,
              projects: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })
    ]);

    return res.json({
      totalStreams,
      activeStreams,
      archivedStreams,
      totalTasks,
      totalProjects,
      streamUsage
    });
  } catch (error) {
    console.error('Error fetching streams stats:', error);
    return res.status(500).json({ error: 'Failed to fetch streams statistics' });
  }
});

// Get frozen/archived streams
router.get('/frozen', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const streams = await prisma.stream.findMany({
      where: {
        organizationId: req.user!.organizationId,
        status: 'FROZEN'
      },
      include: {
        _count: {
          select: {
            tasks: true,
            projects: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json(streams);
  } catch (error) {
    console.error('Error fetching frozen streams:', error);
    return res.status(500).json({ error: 'Failed to fetch frozen streams' });
  }
});

// Get single stream by ID
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const stream = await prisma.stream.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      },
      include: {
        _count: {
          select: {
            tasks: true,
            projects: true
          }
        },
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        }
      }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    return res.json(stream);
  } catch (error) {
    console.error('Error fetching stream:', error);
    return res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

// Update stream
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, status } = req.body;

    const existingStream = await prisma.stream.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!existingStream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon || null;
    if (status !== undefined) updateData.status = status;

    const stream = await prisma.stream.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            tasks: true,
            projects: true
          }
        }
      }
    });

    return res.json(stream);

    // Auto-index to RAG
    vectorService.indexStream(
      req.user!.organizationId, stream.id, stream.name, stream.description, stream.streamType
    ).catch(err => console.error('RAG reindex failed for stream:', err.message));
  } catch (error) {
    console.error('Error updating stream:', error);
    return res.status(500).json({ error: 'Failed to update stream' });
  }
});

// Delete stream
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const stream = await prisma.stream.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
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

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (stream._count.tasks > 0 || stream._count.projects > 0) {
      return res.status(400).json({
        error: 'Cannot delete stream with tasks or projects. Please move or delete them first.'
      });
    }

    await prisma.stream.delete({
      where: { id }
    });

    return res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    console.error('Error deleting stream:', error);
    return res.status(500).json({ error: 'Failed to delete stream' });
  }
});

// Archive/Unarchive stream
router.post('/:id/archive', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { archive = true } = req.body;

    const existingStream = await prisma.stream.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!existingStream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const stream = await prisma.stream.update({
      where: { id },
      data: {
        status: archive ? 'ARCHIVED' : 'ACTIVE'
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

    return res.json(stream);
  } catch (error) {
    console.error('Error archiving stream:', error);
    return res.status(500).json({ error: 'Failed to archive stream' });
  }
});

// Duplicate stream
router.post('/:id/duplicate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required for duplicate' });
    }

    const originalStream = await prisma.stream.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!originalStream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const duplicatedStream = await prisma.stream.create({
      data: {
        name: name.trim(),
        description: originalStream.description,
        color: originalStream.color,
        icon: originalStream.icon,
        status: 'ACTIVE',
        organizationId: req.user!.organizationId,
        createdById: req.user!.id
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

    return res.status(201).json(duplicatedStream);
  } catch (error) {
    console.error('Error duplicating stream:', error);
    return res.status(500).json({ error: 'Failed to duplicate stream' });
  }
});


// Get inbox items
router.get('/inbox', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      unprocessed = 'false',
      source,
      actionable = 'false',
      limit = '50',
      offset = '0'
    } = req.query;

    const filters = {
      unprocessedOnly: unprocessed === 'true',
      source: source as string,
      actionableOnly: actionable === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const items = await streamWorkflowService.getInboxItems(req.user!.organizationId, filters);

    return res.json(items);
  } catch (error) {
    console.error('Error fetching inbox items:', error);
    return res.status(500).json({ error: 'Failed to fetch inbox items' });
  }
});

// Get inbox statistics
router.get('/inbox/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await streamWorkflowService.getInboxStats(req.user!.organizationId);
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching inbox stats:', error);
    return res.status(500).json({ error: 'Failed to fetch inbox statistics' });
  }
});

// Create new inbox item (quick capture)
router.post('/inbox', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      title,
      description,
      type = 'TASK',
      priority = 'MEDIUM',
      estimatedTime,
      context,
      dueDate
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority as Priority,
        status: TaskStatus.NEW,
        contextId: context,
        estimatedHours: estimatedTime,
        dueDate: dueDate ? new Date(dueDate) : null,
        organizationId: req.user!.organizationId,
        createdById: req.user!.id
      },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return res.status(201).json({
      message: 'Inbox item created successfully',
      item: {
        id: task.id,
        type: 'TASK',
        title: task.title,
        description: task.description,
        source: 'manual',
        sourceId: task.id,
        priority: task.priority,
        urgencyScore: 50,
        actionable: true,
        processed: false,
        estimatedTime: task.estimatedHours,
        contextSuggested: task.contextId,
        organizationId: task.organizationId,
        createdAt: task.createdAt,
        receivedAt: task.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating inbox item:', error);
    return res.status(500).json({ error: 'Failed to create inbox item' });
  }
});

// Process inbox item with workflow methodology
router.post('/inbox/:id/process', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const decision: StreamProcessingDecision = req.body;

    decision.itemId = id;

    const result = await streamWorkflowService.processInboxItem(id, decision, req.user!.id);

    return res.json({
      message: 'Item processed successfully',
      result
    });
  } catch (error) {
    console.error('Error processing inbox item:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process item'
    });
  }
});

// Quick actions for inbox items
router.post('/inbox/:id/quick-action', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['QUICK_DO', 'QUICK_DEFER', 'QUICK_DELETE'].includes(action)) {
      return res.status(400).json({ error: 'Invalid quick action' });
    }

    const result = await streamWorkflowService.quickAction(id, action, req.user!.id);

    return res.json({
      message: 'Quick action completed',
      result
    });
  } catch (error) {
    console.error('Error performing quick action:', error);
    return res.status(500).json({ error: 'Failed to perform quick action' });
  }
});

// Get available contexts
router.get('/contexts', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const contexts = await prisma.context.findMany({
      where: {
        organizationId: req.user!.organizationId,
        isActive: true
      },
      select: { id: true, name: true, color: true, icon: true },
      orderBy: { name: 'asc' }
    });

    return res.json(contexts);
  } catch (error) {
    console.error('Error fetching contexts:', error);
    return res.status(500).json({ error: 'Failed to fetch contexts' });
  }
});

export default router;
