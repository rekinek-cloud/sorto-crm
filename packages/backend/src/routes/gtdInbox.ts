import express from 'express';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';
import { gtdInboxService } from '../services/gtdInboxService';
import { ProcessingDecision } from '@prisma/client';
import { prisma } from '../config/database';
import { getFlowEngine } from './flow';

const router = express.Router();

/**
 * Auto-analysis trigger - fire-and-forget after item creation.
 * Checks org settings to determine if this item type should be auto-analyzed.
 */
async function triggerAutoAnalysis(itemId: string, orgId: string, userId: string) {
  try {
    // 1. Load org settings
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true }
    });
    const flowSettings = (org?.settings as any)?.flowAutoAnalysis;
    if (!flowSettings?.enabled) return;

    // 2. Load item to check sourceType and content
    const item = await prisma.inboxItem.findUnique({
      where: { id: itemId },
      select: { sourceType: true, content: true, flowStatus: true }
    });
    if (!item || item.flowStatus !== 'PENDING') return;

    // 3. Check sourceType toggle (default: enabled if not explicitly disabled)
    if (flowSettings.sourceTypes?.[item.sourceType] === false) return;

    // 4. Check min content length
    if (item.content.length < (flowSettings.minContentLength || 10)) return;

    console.log(`🤖 Auto-analyzing item ${itemId} (type: ${item.sourceType})`);

    // 5. Mark as ANALYZING
    await prisma.inboxItem.update({
      where: { id: itemId },
      data: { flowStatus: 'ANALYZING' }
    });

    // 6. Process with FlowEngine
    const engine = await getFlowEngine(orgId);
    await engine.processSourceItem({
      organizationId: orgId,
      userId,
      inboxItemId: itemId,
      autoExecute: flowSettings.autoExecuteHighConfidence || false
    });

    console.log(`✅ Auto-analysis complete for item ${itemId}`);
  } catch (error) {
    console.error(`❌ Auto-analysis failed for item ${itemId}:`, error);
    // Don't fail the item creation — just mark error status
    await prisma.inboxItem.update({
      where: { id: itemId },
      data: { flowStatus: 'ERROR' }
    }).catch(() => {});
  }
}

/**
 * GET /api/v1/gtd-inbox/test-public
 * Test endpoint without auth for debugging
 */
router.get('/test-public', async (req, res) => {
  try {
    // Get real data from first organization for demo
    const sampleItems = await prisma.inboxItem.findMany({
      take: 10,
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
      },
      orderBy: {
        capturedAt: 'desc'
      }
    });

    const stats = await prisma.inboxItem.groupBy({
      by: ['processed'],
      _count: true
    });

    const unprocessed = stats.find(s => !s.processed)?._count || 0;
    const processed = stats.find(s => s.processed)?._count || 0;
    const total = unprocessed + processed;

    res.json({
      message: 'GTD Inbox API is working',
      timestamp: new Date().toISOString(),
      testData: sampleItems,
      stats: {
        unprocessed,
        processed,
        actionable: unprocessed,
        processingRate: total > 0 ? Math.round((processed / total) * 100) : 100
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

/**
 * GET /api/v1/gtd-inbox/stats-public
 * Test stats endpoint without auth
 */
router.get('/stats-public', async (req, res) => {
  try {
    res.json({
      unprocessed: 0,
      processed: 0,
      actionable: 0,
      processingRate: 100,
      bySource: {},
      recentActivity: []
    });
  } catch (error) {
    console.error('Error in test stats endpoint:', error);
    res.status(500).json({ error: 'Test stats endpoint failed' });
  }
});

/**
 * GET /api/v1/gtd-inbox
 * Get all inbox items
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  console.log('🔍 GTD Inbox main endpoint called by user:', req.user?.email);
  try {
    const { 
      processed,
      unprocessed,
      actionable,
      source,
      context,
      contactId,
      companyId,
      projectId,
      taskId,
      search,
      dateFrom,
      dateTo,
      urgencyLevel,
      sortBy,
      limit = '100',
      offset = '0'
    } = req.query;

    const filters = {
      processed: processed === undefined ? undefined : processed === 'true',
      unprocessed: unprocessed === 'true',
      actionable: actionable === 'true',
      source: source as string,
      context: context as string,
      contactId: contactId as string,
      companyId: companyId as string,
      projectId: projectId as string,
      taskId: taskId as string,
      search: search as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      urgencyLevel: urgencyLevel as string,
      sortBy: sortBy as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const items = await gtdInboxService.getInboxItems(
      req.user!.organizationId, 
      filters
    );
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching inbox items:', error);
    res.status(500).json({ error: 'Failed to fetch inbox items' });
  }
});

/**
 * GET /api/v1/gtd-inbox/stats
 * Get inbox statistics
 */
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  console.log('🔍 GTD Inbox stats endpoint called by user:', req.user?.email);
  try {
    const stats = await gtdInboxService.getInboxStats(req.user!.organizationId);
    console.log('📊 Stats calculated:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching inbox stats:', error);
    res.status(500).json({ error: 'Failed to fetch inbox statistics' });
  }
});

/**
 * POST /api/v1/gtd-inbox
 * Create new inbox item
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { content, note, source, sourceUrl } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const item = await gtdInboxService.createInboxItem(
      req.user!.organizationId,
      req.user!.id,
      { content, note, source, sourceUrl }
    );

    res.status(201).json({
      message: 'Inbox item created successfully',
      item
    });

    // Fire-and-forget auto-analysis
    triggerAutoAnalysis(item.id, req.user!.organizationId, req.user!.id).catch(err =>
      console.error('Auto-analysis trigger failed:', err)
    );
  } catch (error) {
    console.error('Error creating inbox item:', error);
    res.status(500).json({ error: 'Failed to create inbox item' });
  }
});

/**
 * POST /api/v1/gtd-inbox/quick-capture
 * Quick capture to inbox
 */
router.post('/quick-capture', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      content, 
      note, 
      sourceType, 
      urgencyScore, 
      actionable, 
      estimatedTime,
      // Business Context
      contactId,
      companyId,
      projectId,
      taskId,
      streamId
    } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const item = await gtdInboxService.quickCaptureAdvanced(
      req.user!.organizationId,
      req.user!.id,
      {
        content,
        note,
        sourceType,
        urgencyScore: urgencyScore || 50,
        actionable: actionable !== false,
        estimatedTime,
        // Business Context
        contactId,
        companyId,
        projectId,
        taskId,
        streamId
      }
    );

    res.status(201).json({
      message: 'Item captured successfully',
      item
    });

    // Fire-and-forget auto-analysis
    triggerAutoAnalysis(item.id, req.user!.organizationId, req.user!.id).catch(err =>
      console.error('Auto-analysis trigger failed:', err)
    );
  } catch (error) {
    console.error('Error capturing item:', error);
    res.status(500).json({ error: 'Failed to capture item' });
  }
});

/**
 * POST /api/v1/gtd-inbox/:id/process
 * Process inbox item with GTD methodology
 */
router.post('/:id/process', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { decision, taskData, projectData, somedayMaybeData, referenceData } = req.body;
    
    if (!decision || !Object.values(ProcessingDecision).includes(decision)) {
      return res.status(400).json({ error: 'Valid processing decision is required' });
    }

    // Validate required data based on decision
    switch (decision) {
      case ProcessingDecision.DO:
      case ProcessingDecision.DEFER:
      case ProcessingDecision.DELEGATE:
        if (!taskData?.title) {
          return res.status(400).json({ error: 'Task title is required for this decision' });
        }
        break;
      case ProcessingDecision.PROJECT:
        if (!projectData?.name) {
          return res.status(400).json({ error: 'Project name is required for this decision' });
        }
        break;
      case ProcessingDecision.SOMEDAY:
        if (!somedayMaybeData?.title) {
          return res.status(400).json({ error: 'Title is required for someday/maybe items' });
        }
        break;
      case ProcessingDecision.REFERENCE:
        if (!referenceData?.title) {
          return res.status(400).json({ error: 'Title is required for reference items' });
        }
        break;
    }
    
    const result = await gtdInboxService.processInboxItem(
      id, 
      req.user!.id,
      {
        decision,
        taskData,
        projectData,
        somedayMaybeData,
        referenceData
      }
    );
    
    res.json({
      message: 'Item processed successfully',
      item: result
    });
  } catch (error) {
    console.error('Error processing inbox item:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process item' 
    });
  }
});

/**
 * POST /api/v1/gtd-inbox/:id/quick-action
 * Quick action on inbox item (DO/DEFER/DELETE/DELEGATE)
 */
router.post('/:id/quick-action', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action, assignedToId } = req.body;
    
    if (!action || !['QUICK_DO', 'QUICK_DEFER', 'QUICK_DELETE', 'QUICK_DELEGATE'].includes(action)) {
      return res.status(400).json({ error: 'Valid action is required (QUICK_DO, QUICK_DEFER, QUICK_DELETE, QUICK_DELEGATE)' });
    }

    if (action === 'QUICK_DELEGATE' && !assignedToId) {
      return res.status(400).json({ error: 'Assigned to ID is required for delegate action' });
    }

    const result = await gtdInboxService.quickAction(
      id,
      req.user!.id,
      action,
      assignedToId
    );
    
    res.json({
      message: `Item ${action.toLowerCase()}ed successfully`,
      item: result
    });
  } catch (error) {
    console.error('Error processing quick action:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process quick action' 
    });
  }
});

/**
 * POST /api/v1/gtd-inbox/bulk-process
 * Bulk process multiple items
 */
router.post('/bulk-process', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    await gtdInboxService.bulkProcess(
      req.user!.organizationId,
      req.user!.id,
      items
    );
    
    res.json({
      message: `${items.length} items processed successfully`
    });
  } catch (error) {
    console.error('Error bulk processing items:', error);
    res.status(500).json({ error: 'Failed to bulk process items' });
  }
});

/**
 * DELETE /api/v1/gtd-inbox/clear-processed
 * Clear old processed items
 */
router.delete('/clear-processed', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { olderThanDays = '30' } = req.query;
    
    const count = await gtdInboxService.clearProcessedItems(
      req.user!.organizationId,
      parseInt(olderThanDays as string)
    );
    
    res.json({
      message: `${count} processed items cleared`
    });
  } catch (error) {
    console.error('Error clearing processed items:', error);
    res.status(500).json({ error: 'Failed to clear processed items' });
  }
});

/**
 * GET /api/v1/gtd-inbox/context/contacts
 * Get available contacts for context selection
 */
router.get('/context/contacts', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: req.user!.organizationId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        position: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      take: 100
    });

    const formatted = contacts.map(contact => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName}`,
      description: contact.position && contact.company 
        ? `${contact.position} at ${contact.company}`
        : contact.company || contact.email || '',
      email: contact.email
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * GET /api/v1/gtd-inbox/context/companies
 * Get available companies for context selection
 */
router.get('/context/companies', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: {
        organizationId: req.user!.organizationId,
        status: { not: 'INACTIVE' }
      },
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        status: true
      },
      orderBy: { name: 'asc' },
      take: 100
    });

    const formatted = companies.map(company => ({
      value: company.id,
      label: company.name,
      description: company.industry || company.website || '',
      status: company.status
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * GET /api/v1/gtd-inbox/context/projects
 * Get available projects for context selection
 */
router.get('/context/projects', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        organizationId: req.user!.organizationId,
        status: { not: 'COMPLETED' }
      },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        description: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' }
      ],
      take: 100
    });

    const formatted = projects.map(project => ({
      value: project.id,
      label: project.name,
      description: project.company?.name 
        ? `${project.company.name} - ${project.status}`
        : project.status,
      status: project.status,
      priority: project.priority
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/v1/gtd-inbox/context/tasks
 * Get available tasks for context selection
 */
router.get('/context/tasks', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        organizationId: req.user!.organizationId,
        status: { in: ['NEW', 'IN_PROGRESS', 'WAITING'] }
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { title: 'asc' }
      ],
      take: 100
    });

    const formatted = tasks.map(task => ({
      value: task.id,
      label: task.title,
      description: task.project?.name 
        ? `${task.project.name} - ${task.status}`
        : task.status,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/v1/gtd-inbox/context/streams
 * Get available streams for context selection
 */
router.get('/context/streams', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const streams = await prisma.stream.findMany({
      where: {
        organizationId: req.user!.organizationId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true
      },
      orderBy: { name: 'asc' },
      take: 100
    });

    const formatted = streams.map(stream => ({
      value: stream.id,
      label: stream.name,
      description: stream.description || '',
      color: stream.color,
      icon: stream.icon
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

/**
 * POST /api/v1/gtd-inbox/:id/analyze-for-planning
 * Get AI analysis for planning without creating time block
 */
router.post('/:id/analyze-for-planning', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🔍 ANALYZE-FOR-PLANNING ENDPOINT CALLED!');
    const { id } = req.params;
    console.log(`📋 Analyzing item ${id} for user ${req.user!.id}`);
    
    // Get inbox item
    const inboxItem = await prisma.inboxItem.findFirst({
      where: { 
        id, 
        capturedById: req.user!.id 
      }
    });

    if (!inboxItem) {
      console.log(`❌ Inbox item not found: ${id} for user ${req.user!.id}`);
      // Check if item exists but belongs to different user
      const anyItem = await prisma.inboxItem.findFirst({ where: { id } });
      if (anyItem) {
        console.log(`🔍 Item exists but belongs to user: ${anyItem.capturedById}`);
      }
      return res.status(404).json({ error: 'Inbox item not found' });
    }

    console.log(`✅ Found inbox item for analysis: ${inboxItem.content}`);

    // Get AI analysis only
    const aiAnalysis = analyzeInboxItemForScheduling(inboxItem);
    
    res.json({
      success: true,
      aiAnalysis,
      item: {
        id: inboxItem.id,
        content: inboxItem.content,
        note: inboxItem.note,
        urgencyScore: inboxItem.urgencyScore
      }
    });
  } catch (error) {
    console.error('Error analyzing item for planning:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to analyze item for planning' 
    });
  }
});

/**
 * POST /api/v1/gtd-inbox/:id/plan-as-time-block
 * Convert GTD Inbox item to Smart Day Planner time block
 */
router.post('/:id/plan-as-time-block', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🚀 PLAN-AS-TIME-BLOCK ENDPOINT CALLED!');
    const { id } = req.params;
    const { 
      scheduledDate, 
      energyLevel, 
      context, 
      estimatedMinutes,
      startTime,
      endTime 
    } = req.body;
    console.log('📋 Request params:', { id, scheduledDate, energyLevel, context, estimatedMinutes });

    // 1. Get inbox item
    console.log(`🔍 Plan-as-time-block: Searching for inbox item ${id} for user ${req.user!.id}`);
    
    const inboxItem = await prisma.inboxItem.findFirst({
      where: { 
        id, 
        capturedById: req.user!.id 
      }
    });

    if (!inboxItem) {
      console.log(`❌ Inbox item not found: ${id} for user ${req.user!.id}`);
      // Check if item exists but belongs to different user
      const anyItem = await prisma.inboxItem.findFirst({ where: { id } });
      if (anyItem) {
        console.log(`🔍 Item exists but belongs to user: ${anyItem.capturedById}`);
      }
      return res.status(404).json({ error: 'Inbox item not found' });
    }

    console.log(`✅ Found inbox item: ${inboxItem.content}`);

    // 2. AI Analysis of inbox item for optimal scheduling
    const aiAnalysis = analyzeInboxItemForScheduling(inboxItem);
    
    // 3. Use provided values or AI suggestions
    const finalEnergyLevel = energyLevel || aiAnalysis.suggestedEnergyLevel;
    const finalContext = context || aiAnalysis.suggestedContext;
    const finalEstimatedMinutes = estimatedMinutes || aiAnalysis.estimatedMinutes;
    
    // 4. Calculate optimal time if not provided
    const dateForScheduling = scheduledDate ? new Date(scheduledDate) : new Date();
    let finalStartTime = startTime;
    let finalEndTime = endTime;
    
    if (!startTime || !endTime) {
      const optimalTime = await suggestOptimalTimeSlot(
        req.user!.id,
        dateForScheduling,
        finalEnergyLevel,
        finalEstimatedMinutes
      );
      finalStartTime = optimalTime.startTime;
      finalEndTime = optimalTime.endTime;
    }

    // 5. Create time block
    const timeBlock = await prisma.energy_time_blocks.create({
      data: {
        name: inboxItem.content.substring(0, 100), // Truncate to fit
        startTime: finalStartTime,
        endTime: finalEndTime,
        energyLevel: finalEnergyLevel,
        primaryContext: finalContext,
        alternativeContexts: aiAnalysis.alternativeContexts,
        isBreak: false,
        dayOfWeek: getDayOfWeek(dateForScheduling),
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        order: await getNextOrder(req.user!.id, getDayOfWeek(dateForScheduling))
      }
    });

    // 6. Create scheduled task linking to time block
    const scheduledTask = await prisma.scheduled_tasks.create({
      data: {
        title: inboxItem.content,
        description: inboxItem.note || '',
        estimatedMinutes: parseInt(finalEstimatedMinutes.toString()) || 60,
        energyTimeBlockId: timeBlock.id,
        context: finalContext,
        energyRequired: finalEnergyLevel,
        priority: mapUrgencyToPriority(inboxItem.urgencyScore || 50),
        scheduledDate: dateForScheduling,
        status: 'PLANNED',
        userId: req.user!.id,
        organizationId: req.user!.organizationId
      }
    });

    // 7. Mark inbox item as processed (DO decision)
    await prisma.inboxItem.update({
      where: { id },
      data: {
        processed: true,
        processingDecision: 'DO',
        processedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Inbox item converted to time block successfully',
      data: {
        timeBlock,
        scheduledTask,
        aiAnalysis
      }
    });
  } catch (error) {
    console.error('❌ ERROR converting inbox item to time block:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ 
      success: false,
      error: 'Failed to convert inbox item to time block',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// =============================================================================
// HELPER FUNCTIONS FOR GTD → TIME BLOCKS INTEGRATION
// =============================================================================

/**
 * AI Analysis of inbox item for optimal scheduling
 */
function analyzeInboxItemForScheduling(inboxItem: any) {
  const content = (inboxItem.content || '').toLowerCase();
  const note = (inboxItem.note || '').toLowerCase();
  const urgency = inboxItem.urgencyScore || 50;
  const estimatedTime = inboxItem.estimatedTime || null;

  // Energy level analysis based on content
  let suggestedEnergyLevel = 'MEDIUM';
  if (content.includes('important') || content.includes('urgent') || content.includes('critical') || urgency > 80) {
    suggestedEnergyLevel = 'HIGH';
  } else if (content.includes('creative') || content.includes('design') || content.includes('brainstorm')) {
    suggestedEnergyLevel = 'CREATIVE';
  } else if (content.includes('admin') || content.includes('report') || content.includes('data')) {
    suggestedEnergyLevel = 'ADMINISTRATIVE';
  } else if (content.includes('read') || content.includes('review') || urgency < 30) {
    suggestedEnergyLevel = 'LOW';
  }

  // Context analysis
  let suggestedContext = '@computer';
  if (content.includes('call') || content.includes('phone') || content.includes('meeting')) {
    suggestedContext = '@calls';
  } else if (content.includes('email') || content.includes('respond')) {
    suggestedContext = '@computer';
  } else if (content.includes('read') || content.includes('document')) {
    suggestedContext = '@reading';
  } else if (content.includes('plan') || content.includes('strategy')) {
    suggestedContext = '@planning';
  } else if (content.includes('admin') || content.includes('paperwork')) {
    suggestedContext = '@admin';
  } else if (content.includes('creative') || content.includes('design')) {
    suggestedContext = '@creative';
  }

  // Alternative contexts based on energy level
  const alternativeContexts = [];
  if (suggestedEnergyLevel === 'HIGH') {
    alternativeContexts.push('@focus', '@planning');
  } else if (suggestedEnergyLevel === 'CREATIVE') {
    alternativeContexts.push('@planning', '@online');
  } else if (suggestedEnergyLevel === 'LOW') {
    alternativeContexts.push('@reading', '@admin');
  }

  // Estimated time analysis
  let estimatedMinutes = parseInt(estimatedTime?.toString() || '60') || 60; // Default 1 hour
  if (content.includes('quick') || content.includes('short')) {
    estimatedMinutes = 30;
  } else if (content.includes('detailed') || content.includes('complex') || urgency > 70) {
    estimatedMinutes = 90;
  } else if (content.includes('meeting')) {
    estimatedMinutes = 60;
  } else if (content.includes('call')) {
    estimatedMinutes = 30;
  }

  return {
    suggestedEnergyLevel,
    suggestedContext,
    alternativeContexts,
    estimatedMinutes,
    confidence: 0.7 // AI confidence score
  };
}

/**
 * Suggest optimal time slot for task based on energy patterns
 */
async function suggestOptimalTimeSlot(userId: string, date: Date, energyLevel: string, estimatedMinutes: number) {
  // Get user's energy patterns for the day
  const dayOfWeek = getDayOfWeek(date);
  
  // Default time slots based on energy level
  const defaultTimeSlots = {
    'HIGH': ['07:00', '08:00', '09:00'],
    'CREATIVE': ['10:00', '15:00', '16:00'],
    'MEDIUM': ['11:00', '14:00', '15:00'],
    'ADMINISTRATIVE': ['08:00', '14:00', '16:00'],
    'LOW': ['13:00', '16:00', '17:00']
  };

  const possibleStartTimes = defaultTimeSlots[energyLevel] || defaultTimeSlots['MEDIUM'];
  
  // Find first available slot
  for (const startTime of possibleStartTimes) {
    const endTime = calculateEndTime(startTime, estimatedMinutes);
    
    // Check if slot is available
    const conflict = await prisma.energy_time_blocks.findFirst({
      where: {
        userId,
        dayOfWeek: dayOfWeek as any,
        isActive: true,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ]
      }
    });

    if (!conflict) {
      return { startTime, endTime };
    }
  }

  // If no optimal slot found, return first suggested time anyway
  const startTime = possibleStartTimes[0];
  return {
    startTime,
    endTime: calculateEndTime(startTime, estimatedMinutes)
  };
}

/**
 * Calculate end time based on start time and duration in minutes
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMins = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}

/**
 * Map urgency score to priority
 */
function mapUrgencyToPriority(urgencyScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (urgencyScore >= 80) return 'HIGH';
  if (urgencyScore >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Get day of week from date
 */
function getDayOfWeek(date: Date): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
}

/**
 * Get next order for time block
 */
async function getNextOrder(userId: string, dayOfWeek: string): Promise<number> {
  const lastBlock = await prisma.energy_time_blocks.findFirst({
    where: { userId, dayOfWeek: dayOfWeek as any },
    orderBy: { order: 'desc' }
  });
  return (lastBlock?.order || 0) + 1;
}

export default router;