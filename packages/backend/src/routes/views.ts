import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../shared/middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// ================================
// VIEW CONFIGURATIONS ENDPOINTS
// ================================

// GET /api/v1/views/:type - Get all views of type for user
router.get('/:type', authenticateUser, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate view type
    const validTypes = ['KANBAN', 'GANTT', 'SCRUM', 'CALENDAR', 'LIST'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid view type' });
    }

    const views = await prisma.viewConfiguration.findMany({
      where: {
        userId,
        viewType: type.toUpperCase() as any
      },
      include: {
        kanbanColumns: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: views
    });

  } catch (error) {
    console.error('Error fetching views:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch views' 
    });
  }
});

// POST /api/v1/views/:type - Create new view
router.post('/:type', authenticateUser, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user?.id;
    const { viewName, configuration, columns, isDefault = false } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate view type
    const validTypes = ['KANBAN', 'GANTT', 'SCRUM', 'CALENDAR', 'LIST'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid view type' });
    }

    if (!viewName || !configuration) {
      return res.status(400).json({ error: 'viewName and configuration are required' });
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await prisma.viewConfiguration.updateMany({
        where: {
          userId,
          viewType: type.toUpperCase() as any,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Create view with columns in transaction
    const view = await prisma.$transaction(async (tx) => {
      const createdView = await tx.viewConfiguration.create({
        data: {
          userId,
          viewType: type.toUpperCase() as any,
          viewName,
          configuration,
          isDefault
        }
      });

      // Create columns for Kanban views
      if (type.toUpperCase() === 'KANBAN' && columns && Array.isArray(columns)) {
        await tx.kanbanColumn.createMany({
          data: columns.map((col: any, index: number) => ({
            viewId: createdView.id,
            title: col.title,
            position: col.position || index,
            color: col.color || '#3B82F6',
            wipLimit: col.wipLimit,
            columnType: col.columnType,
            configuration: col.configuration || {}
          }))
        });
      }

      return tx.viewConfiguration.findUnique({
        where: { id: createdView.id },
        include: {
          kanbanColumns: {
            orderBy: { position: 'asc' }
          }
        }
      });
    });

    res.status(201).json({
      success: true,
      data: view
    });

  } catch (error) {
    console.error('Error creating view:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create view' 
    });
  }
});

// PUT /api/v1/views/:type/:id - Update view
router.put('/:type/:id', authenticateUser, async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user?.id;
    const { viewName, configuration, columns, isDefault } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check ownership
    const existingView = await prisma.viewConfiguration.findFirst({
      where: {
        id,
        userId,
        viewType: type.toUpperCase() as any
      }
    });

    if (!existingView) {
      return res.status(404).json({ error: 'View not found' });
    }

    // If setting as default, unset other defaults first
    if (isDefault && !existingView.isDefault) {
      await prisma.viewConfiguration.updateMany({
        where: {
          userId,
          viewType: type.toUpperCase() as any,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      });
    }

    const updatedView = await prisma.$transaction(async (tx) => {
      // Update view
      const view = await tx.viewConfiguration.update({
        where: { id },
        data: {
          viewName: viewName || existingView.viewName,
          configuration: configuration || existingView.configuration,
          isDefault: isDefault !== undefined ? isDefault : existingView.isDefault,
          updatedAt: new Date()
        }
      });

      // Update columns for Kanban views
      if (type.toUpperCase() === 'KANBAN' && columns && Array.isArray(columns)) {
        // Delete existing columns
        await tx.kanbanColumn.deleteMany({
          where: { viewId: id }
        });

        // Create new columns
        await tx.kanbanColumn.createMany({
          data: columns.map((col: any, index: number) => ({
            viewId: id,
            title: col.title,
            position: col.position || index,
            color: col.color || '#3B82F6',
            wipLimit: col.wipLimit,
            columnType: col.columnType,
            configuration: col.configuration || {}
          }))
        });
      }

      return tx.viewConfiguration.findUnique({
        where: { id },
        include: {
          kanbanColumns: {
            orderBy: { position: 'asc' }
          }
        }
      });
    });

    res.json({
      success: true,
      data: updatedView
    });

  } catch (error) {
    console.error('Error updating view:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update view' 
    });
  }
});

// DELETE /api/v1/views/:type/:id - Delete view
router.delete('/:type/:id', authenticateUser, async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check ownership
    const existingView = await prisma.viewConfiguration.findFirst({
      where: {
        id,
        userId,
        viewType: type.toUpperCase() as any
      }
    });

    if (!existingView) {
      return res.status(404).json({ error: 'View not found' });
    }

    await prisma.viewConfiguration.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'View deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting view:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete view' 
    });
  }
});

// POST /api/v1/views/:type/:id/duplicate - Duplicate view
router.post('/:type/:id/duplicate', authenticateUser, async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user?.id;
    const { newName } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get original view
    const originalView = await prisma.viewConfiguration.findFirst({
      where: {
        id,
        userId,
        viewType: type.toUpperCase() as any
      },
      include: {
        kanbanColumns: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!originalView) {
      return res.status(404).json({ error: 'View not found' });
    }

    // Create duplicate
    const duplicatedView = await prisma.$transaction(async (tx) => {
      const newView = await tx.viewConfiguration.create({
        data: {
          userId,
          viewType: originalView.viewType,
          viewName: newName || `${originalView.viewName} (Copy)`,
          configuration: originalView.configuration,
          isDefault: false, // Copies are never default
          isPublic: false
        }
      });

      // Duplicate columns for Kanban views
      if (type.toUpperCase() === 'KANBAN' && originalView.kanbanColumns.length > 0) {
        await tx.kanbanColumn.createMany({
          data: originalView.kanbanColumns.map(col => ({
            viewId: newView.id,
            title: col.title,
            position: col.position,
            color: col.color,
            wipLimit: col.wipLimit,
            columnType: col.columnType,
            configuration: col.configuration
          }))
        });
      }

      return tx.viewConfiguration.findUnique({
        where: { id: newView.id },
        include: {
          kanbanColumns: {
            orderBy: { position: 'asc' }
          }
        }
      });
    });

    res.status(201).json({
      success: true,
      data: duplicatedView
    });

  } catch (error) {
    console.error('Error duplicating view:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to duplicate view' 
    });
  }
});

// ================================
// VIEW DATA ENDPOINTS
// ================================

// GET /api/v1/kanban/:boardType/data - Get kanban data with real data
router.get('/kanban/:boardType/data', authenticateUser, async (req, res) => {
  try {
    const { boardType } = req.params;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get deals from database
    const deals = await prisma.deal.findMany({
      where: {
        organizationId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { kanbanPosition: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Define columns based on board type
    let columns: any[] = [];
    
    switch (boardType) {
      case 'sales_pipeline':
        columns = [
          { id: 'PROSPECT', title: 'Potencjalni', color: '#6B7280' },
          { id: 'QUALIFIED', title: 'Kwalifikowani', color: '#3B82F6' },
          { id: 'PROPOSAL', title: 'Oferta', color: '#F59E0B' },
          { id: 'NEGOTIATION', title: 'Negocjacje', color: '#EF4444' },
          { id: 'CLOSED_WON', title: 'Wygrany', color: '#10B981' },
          { id: 'CLOSED_LOST', title: 'Przegrany', color: '#6B7280' }
        ];
        break;
      case 'priority':
        columns = [
          { id: 'urgent', title: 'Pilne', color: '#EF4444' },
          { id: 'high', title: 'Wysokie', color: '#F59E0B' },
          { id: 'medium', title: 'Średnie', color: '#10B981' },
          { id: 'low', title: 'Niskie', color: '#6B7280' }
        ];
        break;
      case 'deal_size':
        columns = [
          { id: 'small', title: 'Małe (<10k)', color: '#6B7280' },
          { id: 'medium', title: 'Średnie (10-50k)', color: '#3B82F6' },
          { id: 'large', title: 'Duże (50-100k)', color: '#F59E0B' },
          { id: 'enterprise', title: 'Enterprise (>100k)', color: '#10B981' }
        ];
        break;
      case 'gtd_context':
        columns = [
          { id: 'calls', title: '@Telefony', color: '#EF4444' },
          { id: 'email', title: '@Email', color: '#3B82F6' },
          { id: 'meetings', title: '@Spotkania', color: '#10B981' },
          { id: 'proposals', title: '@Oferty', color: '#F59E0B' }
        ];
        break;
      default:
        columns = [
          { id: 'PROSPECT', title: 'Potencjalni', color: '#6B7280' },
          { id: 'QUALIFIED', title: 'Kwalifikowani', color: '#3B82F6' },
          { id: 'PROPOSAL', title: 'Oferta', color: '#F59E0B' },
          { id: 'NEGOTIATION', title: 'Negocjacje', color: '#EF4444' },
          { id: 'CLOSED_WON', title: 'Wygrany', color: '#10B981' }
        ];
    }

    // Organize deals by columns
    const columnsWithData = columns.map(column => {
      let columnDeals: any[] = [];
      
      switch (boardType) {
        case 'sales_pipeline':
          columnDeals = deals.filter(deal => deal.stage === column.id);
          break;
        case 'priority':
          // Map deal urgency to priority levels
          columnDeals = deals.filter(deal => {
            if (!deal.value) return column.id === 'low';
            const priority = deal.value > 50000 ? 'high' : 
                           deal.value > 20000 ? 'medium' : 'low';
            return priority === column.id;
          });
          break;
        case 'deal_size':
          columnDeals = deals.filter(deal => {
            const value = deal.value || 0;
            switch (column.id) {
              case 'small': return value < 10000;
              case 'medium': return value >= 10000 && value < 50000;
              case 'large': return value >= 50000 && value < 100000;
              case 'enterprise': return value >= 100000;
              default: return false;
            }
          });
          break;
        case 'gtd_context':
          // Assign deals to GTD contexts based on stage
          columnDeals = deals.filter(deal => {
            switch (deal.stage) {
              case 'PROSPECT': return column.id === 'calls';
              case 'QUALIFIED': return column.id === 'email';
              case 'PROPOSAL': return column.id === 'proposals';
              case 'NEGOTIATION': return column.id === 'meetings';
              default: return column.id === 'calls';
            }
          });
          break;
        default:
          columnDeals = deals.filter(deal => deal.stage === column.id);
      }

      // Transform deals to match frontend interface
      const transformedDeals = columnDeals.map(deal => ({
        id: deal.id,
        title: deal.title,
        company: deal.company?.name || 'Brak firmy',
        value: deal.value || 0,
        probability: deal.probability || 0,
        assignee: {
          id: deal.owner?.id || '',
          name: deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'Nieprzypisany',
          avatar: deal.owner?.avatar || ''
        },
        nextAction: {
          gtdContext: boardType === 'gtd_context' ? `@${column.title.replace('@', '')}` : '@calls',
          description: deal.description || 'Brak opisu'
        },
        dueDate: deal.expectedCloseDate || new Date(),
        priority: deal.value && deal.value > 50000 ? 'high' : 
                 deal.value && deal.value > 20000 ? 'medium' : 'low',
        aiInsights: [
          {
            type: 'win_probability',
            confidence: deal.probability || 50,
            description: `Prawdopodobieństwo wygranej: ${deal.probability || 50}%`
          }
        ]
      }));

      const totalValue = transformedDeals.reduce((sum, deal) => sum + deal.value, 0);

      return {
        id: column.id,
        title: column.title,
        deals: transformedDeals,
        totalValue,
        color: column.color,
        order: columns.indexOf(column),
        count: transformedDeals.length
      };
    });

    res.json({
      success: true,
      data: {
        boardType,
        columns: columnsWithData,
        totalDeals: deals.length
      }
    });

  } catch (error) {
    console.error('Error fetching kanban data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch kanban data' 
    });
  }
});

// POST /api/v1/kanban/:boardType/move - Move card between columns
router.post('/kanban/:boardType/move', authenticateUser, async (req, res) => {
  try {
    const { boardType } = req.params;
    const { dealId, fromColumn, toColumn, position } = req.body;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!dealId || !toColumn) {
      return res.status(400).json({ error: 'dealId and toColumn are required' });
    }

    // Get the deal to verify ownership
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        organizationId
      }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Prepare update data based on board type
    let updateData: any = {
      kanbanPosition: position || 0,
      updatedAt: new Date()
    };

    switch (boardType) {
      case 'sales_pipeline':
        // Update deal stage for sales pipeline
        const validStages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
        if (validStages.includes(toColumn)) {
          updateData.stage = toColumn;
          // Auto-set close date for closed deals
          if (['CLOSED_WON', 'CLOSED_LOST'].includes(toColumn) && !deal.actualCloseDate) {
            updateData.actualCloseDate = new Date();
          }
        }
        break;
      case 'priority':
        // For priority board, we could add a priority field to Deal model in the future
        // For now, just update position
        break;
      case 'deal_size':
        // Deal size is based on value, so moving doesn't change the deal
        // Just update position for ordering within the column
        break;
      case 'gtd_context':
        // For GTD context, we could map back to stages
        switch (toColumn) {
          case 'calls':
            updateData.stage = 'PROSPECT';
            break;
          case 'email':
            updateData.stage = 'QUALIFIED';
            break;
          case 'proposals':
            updateData.stage = 'PROPOSAL';
            break;
          case 'meetings':
            updateData.stage = 'NEGOTIATION';
            break;
        }
        break;
    }

    // Update deal
    await prisma.deal.update({
      where: {
        id: dealId,
        organizationId
      },
      data: updateData
    });

    // Create activity log for the move
    try {
      await prisma.activity.create({
        data: {
          type: 'DEAL_MOVED',
          title: `Deal "${deal.title}" moved`,
          description: `Deal moved from ${fromColumn} to ${toColumn} in ${boardType} board`,
          metadata: {
            dealId,
            fromColumn,
            toColumn,
            boardType,
            position
          },
          organizationId,
          userId,
          dealId: dealId
        }
      });
    } catch (activityError) {
      console.error('Error creating move activity:', activityError);
    }

    res.json({
      success: true,
      message: 'Deal moved successfully'
    });

  } catch (error) {
    console.error('Error moving deal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to move deal' 
    });
  }
});

// ================================
// USER PREFERENCES ENDPOINTS
// ================================

// GET /api/v1/views/preferences/:type - Get user preferences for view type
router.get('/preferences/:type', authenticateUser, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await prisma.userViewPreference.findUnique({
      where: {
        userId_viewType: {
          userId,
          viewType: type.toUpperCase() as any
        }
      }
    });

    res.json({
      success: true,
      data: preferences || { preferences: {} }
    });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch preferences' 
    });
  }
});

// PUT /api/v1/views/preferences/:type - Update user preferences
router.put('/preferences/:type', authenticateUser, async (req, res) => {
  try {
    const { type } = req.params;
    const { preferences } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!preferences) {
      return res.status(400).json({ error: 'preferences object is required' });
    }

    const updatedPreferences = await prisma.userViewPreference.upsert({
      where: {
        userId_viewType: {
          userId,
          viewType: type.toUpperCase() as any
        }
      },
      update: {
        preferences,
        updatedAt: new Date()
      },
      create: {
        userId,
        viewType: type.toUpperCase() as any,
        preferences
      }
    });

    res.json({
      success: true,
      data: updatedPreferences
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update preferences' 
    });
  }
});

export default router;