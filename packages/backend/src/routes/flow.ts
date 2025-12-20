/**
 * Flow Engine API Routes
 * =======================
 * API endpoints dla przetwarzania elementow przez Flow Engine
 *
 * Endpoints:
 * - POST /api/v1/flow/process/:id - Przetworz pojedynczy element
 * - POST /api/v1/flow/process-batch - Przetworz wiele elementow
 * - POST /api/v1/flow/confirm/:id - Potwierdz/nadpisz sugestie
 * - GET /api/v1/flow/pending - Lista elementow do przetworzenia
 * - GET /api/v1/flow/history - Historia przetwarzania
 * - GET /api/v1/flow/patterns - Nauczone wzorce
 * - GET /api/v1/flow/rules - Reguly automatyzacji
 * - POST /api/v1/flow/rules - Utworz regule
 * - PUT /api/v1/flow/rules/:id - Aktualizuj regule
 * - DELETE /api/v1/flow/rules/:id - Usun regule
 */

import { Router, Request, Response } from 'express';
import { PrismaClient, FlowAction } from '@prisma/client';
import { FlowEngineService, createFlowEngine } from '../services/ai/FlowEngineService';
import { authenticateToken as authMiddleware, AuthenticatedRequest } from '../shared/middleware/auth';
import { AIRouter } from '../services/ai/AIRouter';

const router = Router();
const prisma = new PrismaClient();

// Cache for AIRouter instances per organization
const aiRouterCache: Map<string, AIRouter> = new Map();

// Helper to get or create AIRouter instance
async function getAIRouter(organizationId: string): Promise<AIRouter> {
  let router = aiRouterCache.get(organizationId);

  if (!router) {
    router = new AIRouter({ organizationId, prisma });
    await router.initializeProviders();
    aiRouterCache.set(organizationId, router);
  }

  return router;
}

// Full AI analysis response type matching master.md specification
interface AIAnalysisResult {
  suggestedAction: string;
  suggestedStreamId: string | null;
  suggestedStreamName: string | null;
  suggestedProjectId: string | null;
  confidence: number;
  reasoning: string;

  // Extracted entities
  entities: {
    sender?: {
      matchedContactId: string | null;
      matchedCompanyId: string | null;
      name?: string;
      email?: string;
    };
    people?: Array<{ name: string; matchedId: string | null }>;
    companies?: Array<{ name: string; matchedId: string | null }>;
    amounts?: Array<{ value: number; currency: string; context: string }>;
    dates?: Array<{ date: string; context: string }>;
  };

  // Extracted tasks
  extractedTasks: Array<{
    title: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    context?: string;
  }>;

  // Status updates
  statusUpdates?: Array<{
    entity: 'PROJECT' | 'DEAL' | 'CONTACT' | 'COMPANY';
    id: string;
    field: string;
    from?: any;
    to: any;
  }>;

  // Links to create
  links?: Array<{
    type: 'COMPANY' | 'CONTACT' | 'PROJECT' | 'DEAL';
    id: string;
  }>;

  // Multi-thread support (for voice notes)
  threads?: Array<{
    index: number;
    content: string;
    category: 'BUSINESS' | 'PERSONAL' | 'OTHER';
    suggestedAction: string;
    suggestedStreamId: string | null;
    extractedTask?: {
      title: string;
      priority: string;
    };
    confidence: number;
  }>;
}

// Helper function to analyze item content with AI - FULL SPEC from master.md
async function analyzeWithAI(
  organizationId: string,
  content: string,
  streams: Array<{ id: string; name: string; description: string | null }>,
  contacts?: Array<{ id: string; firstName: string; lastName: string; email?: string }>,
  companies?: Array<{ id: string; name: string }>,
  projects?: Array<{ id: string; name: string; streamId: string }>
): Promise<AIAnalysisResult> {
  const aiRouter = await getAIRouter(organizationId);

  const streamsInfo = streams.map(s => `- ${s.id}: ${s.name} (${s.description || 'brak opisu'})`).join('\n');
  const contactsInfo = contacts?.map(c => `- ${c.id}: ${c.firstName} ${c.lastName} (${c.email || 'brak email'})`).join('\n') || 'Brak kontaktów';
  const companiesInfo = companies?.map(c => `- ${c.id}: ${c.name}`).join('\n') || 'Brak firm';
  const projectsInfo = projects?.map(p => `- ${p.id}: ${p.name}`).join('\n') || 'Brak projektów';

  // Pobierz prompt V3 z bazy danych
  let systemPrompt: string;
  let userPromptTemplate: string;

  try {
    const promptTemplate = await prisma.ai_prompt_templates.findFirst({
      where: {
        code: 'SOURCE_ANALYZE',
        organizationId: organizationId
      }
    });

    if (!promptTemplate?.systemPrompt) {
      // BRAK PROMPTU = BŁĄD - użytkownik musi skonfigurować Asystenta AI
      console.error('❌ Flow: Brak promptu SOURCE_ANALYZE w bazie danych!');
      throw new Error('MISSING_AI_PROMPT: Brak konfiguracji promptu SOURCE_ANALYZE. Skonfiguruj Asystenta AI w ustawieniach.');
    }

    // Użyj promptu z bazy - podstaw zmienne kontekstowe
    systemPrompt = promptTemplate.systemPrompt
      .replace('{{streams}}', streamsInfo)
      .replace('{{contacts}}', contactsInfo)
      .replace('{{companies}}', companiesInfo)
      .replace('{{projects}}', projectsInfo);

    userPromptTemplate = promptTemplate.userPromptTemplate || 'Przeanalizuj ten element:\n\n{{content}}';
    console.log('✅ Używam promptu SOURCE_ANALYZE z bazy danych');
  } catch (error: any) {
    // Przekaż błąd dalej - nie generuj fałszywych danych
    console.error('❌ Flow analyzeWithAI error:', error.message);
    throw error;
  }

  // Replace multiple possible placeholders
  const userPrompt = userPromptTemplate
    .replace('{{content}}', content)
    .replace('{{itemContent}}', content)
    .replace(/\{\{#if itemMetadata\}\}[\s\S]*?\{\{\/if\}\}/g, '');  // Remove conditional metadata block

  try {
    const response = await aiRouter.processRequest({
      model: 'claude-sonnet-4-20250514',  // Use Claude Sonnet 4 (latest available)
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      config: {
        temperature: 0.3,
        maxTokens: 2000,
        responseFormat: 'json'  // Enable JSON mode for structured response
      }
    });

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Support both V3 format (proposal.action) and legacy format (suggestedAction)
      const isV3Format = parsed.proposal && parsed.proposal.action;

      // Normalize and return full response
      return {
        suggestedAction: isV3Format
          ? parsed.proposal.action
          : (parsed.suggestedAction || 'ZAPLANUJ'),
        suggestedStreamId: isV3Format
          ? parsed.proposal.streamId
          : (parsed.suggestedStreamId || null),
        suggestedStreamName: isV3Format
          ? parsed.proposal.streamName
          : (parsed.suggestedStreamName || null),
        suggestedProjectId: isV3Format
          ? parsed.proposal.projectName
          : (parsed.suggestedProjectId || null),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 70,
        reasoning: isV3Format
          ? (parsed.assistantMessage || 'Analiza AI V3')
          : (parsed.reasoning || 'Analiza AI'),

        // V3 thinking object for detailed analysis
        thinking: isV3Format ? parsed.thinking : undefined,
        assistantMessage: isV3Format ? parsed.assistantMessage : undefined,

        entities: {
          sender: parsed.entities?.sender || null,
          people: parsed.entities?.people || [],
          companies: parsed.entities?.companies || [],
          amounts: parsed.entities?.amounts || [],
          dates: parsed.entities?.dates || []
        },

        extractedTasks: isV3Format
          ? (parsed.proposal?.tasks || [])
          : (parsed.extractedTasks || []),
        statusUpdates: parsed.statusUpdates || [],
        links: parsed.links || [],
        threads: parsed.threads || undefined,

        // V3 specific fields
        firstSteps: isV3Format ? parsed.proposal?.firstSteps : undefined,
        priority: isV3Format ? parsed.proposal?.priority : undefined,
        dueDate: isV3Format ? parsed.proposal?.dueDate : undefined
      };
    }
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
}

// Cache for FlowEngine instances per organization
const flowEngineCache: Map<string, FlowEngineService> = new Map();

// Helper to get or create FlowEngine instance
async function getFlowEngine(organizationId: string): Promise<FlowEngineService> {
  let engine = flowEngineCache.get(organizationId);

  if (!engine) {
    engine = createFlowEngine(prisma, organizationId);
    await engine.initialize();
    flowEngineCache.set(organizationId, engine);
  }

  return engine;
}

// Apply auth middleware to all routes
router.use(authMiddleware);

// =============================================================================
// PROCESSING ENDPOINTS
// =============================================================================

/**
 * POST /api/v1/flow/process/:id
 * Process a single source item
 */
router.post('/process/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { autoExecute = false } = req.body;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    const engine = await getFlowEngine(user.organizationId);

    const result = await engine.processSourceItem({
      organizationId: user.organizationId,
      userId: user.userId,
      inboxItemId: id,
      autoExecute
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        processingTimeMs: result.processingTimeMs
      });
    }

    return res.json({
      success: true,
      data: {
        inboxItemId: result.inboxItemId,
        analysis: result.analysis,
        suggestedStreams: result.suggestedStreams,
        suggestedAction: result.suggestedAction,
        executedAction: result.executedAction,
        splitItems: result.splitItems,
        processingTimeMs: result.processingTimeMs
      }
    });

  } catch (error: any) {
    console.error('Flow process error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Processing failed'
    });
  }
});

/**
 * POST /api/v1/flow/process-batch
 * Process multiple items in batch
 */
router.post('/process-batch', async (req: Request, res: Response) => {
  try {
    const { itemIds, autoExecute = false } = req.body;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds array required' });
    }

    if (itemIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 items per batch' });
    }

    const engine = await getFlowEngine(user.organizationId);

    const results = await engine.processBatch(itemIds, user.userId, autoExecute);

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return res.json({
      success: true,
      data: {
        processed: results.length,
        successCount,
        failedCount,
        results: results.map(r => ({
          inboxItemId: r.inboxItemId,
          success: r.success,
          suggestedAction: r.suggestedAction?.action,
          executedAction: r.executedAction,
          error: r.error
        }))
      }
    });

  } catch (error: any) {
    console.error('Flow batch process error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Batch processing failed'
    });
  }
});

/**
 * POST /api/v1/flow/confirm/:id
 * Confirm or override AI suggestion
 */
router.post('/confirm/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, streamId, reason } = req.body;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }

    // Validate action
    const validActions: FlowAction[] = [
      'ZROB_TERAZ', 'ZAPLANUJ', 'PROJEKT',
      'KIEDYS_MOZE', 'REFERENCJA', 'USUN'
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
    }

    const engine = await getFlowEngine(user.organizationId);

    await engine.confirmAction(
      id,
      user.userId,
      action as FlowAction,
      streamId,
      reason
    );

    return res.json({
      success: true,
      message: 'Action confirmed and executed'
    });

  } catch (error: any) {
    console.error('Flow confirm error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Confirmation failed'
    });
  }
});

// =============================================================================
// AI SUGGESTION ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/flow/suggest/:id
 * Get AI suggestion for a single item - FULL SPEC from master.md
 */
router.get('/suggest/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { refresh } = req.query; // ?refresh=true wymusza ponowną analizę AI
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    // Get the item
    const item = await prisma.inboxItem.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: {
        stream: { select: { id: true, name: true, color: true } }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // If already has AI suggestion cached with full analysis, return it (unless refresh=true)
    if (!refresh && item.suggestedAction && item.aiConfidence && item.aiAnalysis) {
      const analysis = item.aiAnalysis as any;
      const suggestedStreamsArray = item.suggestedStreams as string[] | null;
      return res.json({
        success: true,
        data: {
          suggestedAction: item.suggestedAction,
          suggestedStreamId: suggestedStreamsArray?.[0] || null,
          suggestedStreamName: item.stream?.name || analysis.suggestedStreamName || null,
          suggestedProjectId: analysis.suggestedProjectId || null,
          confidence: item.aiConfidence,
          reasoning: item.aiReasoning || analysis.reasoning || '',
          entities: analysis.entities || {},
          extractedTasks: analysis.extractedTasks || [],
          statusUpdates: analysis.statusUpdates || [],
          links: analysis.links || [],
          threads: analysis.threads || undefined,
          alternatives: []
        }
      });
    }

    // Get available streams for matching
    const streams = await prisma.stream.findMany({
      where: {
        organizationId: user.organizationId,
        status: 'ACTIVE'
      },
      select: { id: true, name: true, description: true }
    });

    // Get contacts for entity matching (limit to 20 most recent)
    const contacts = await prisma.contact.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    // Get companies for entity matching (limit to 20 most recent)
    const companies = await prisma.company.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    // Get projects for matching (limit to 15 active)
    const projects = await prisma.project.findMany({
      where: {
        organizationId: user.organizationId,
        status: { in: ['PLANNING', 'IN_PROGRESS'] }
      },
      select: { id: true, name: true, streamId: true },
      orderBy: { updatedAt: 'desc' },
      take: 15
    });

    const content = `${item.content || ''}\n${item.note || ''}`.trim();
    let aiResult: AIAnalysisResult | null = null;

    try {
      console.log('🤖 Calling AI for FULL suggestion analysis (master.md spec)...');
      aiResult = await analyzeWithAI(
        user.organizationId,
        content,
        streams,
        contacts,
        companies,
        projects
      );
      console.log('✅ AI FULL analysis successful:', JSON.stringify(aiResult, null, 2));
      // NOTE: Nie zapisujemy cache - zapis następuje dopiero przy akceptacji przez użytkownika (confirm)

    } catch (error: any) {
      // BRAK FALLBACKU - zwracamy błąd zamiast fałszywych danych
      console.error('❌ AI analysis failed:', error.message);

      // Sprawdź czy to błąd braku promptu
      const isMissingPrompt = error.message?.includes('MISSING_AI_PROMPT');

      return res.status(isMissingPrompt ? 400 : 500).json({
        success: false,
        error: isMissingPrompt ? 'Analiza AI niedostępna' : 'Błąd analizy AI',
        message: isMissingPrompt
          ? 'Brak konfiguracji promptu SOURCE_ANALYZE. Skonfiguruj Asystenta AI w ustawieniach.'
          : `Nie udało się przeprowadzić analizy AI: ${error.message}`,
        code: isMissingPrompt ? 'MISSING_AI_PROMPT' : 'AI_ANALYSIS_FAILED'
      });
    }

    // Build alternatives from streams
    const alternatives = streams.slice(0, 3).map(s => ({
      action: 'ZAPLANUJ',
      streamId: s.id,
      streamName: s.name,
      confidence: 40
    }));

    return res.json({
      success: true,
      data: {
        // Core fields from master.md
        suggestedAction: aiResult.suggestedAction,
        suggestedStreamId: aiResult.suggestedStreamId,
        suggestedStreamName: aiResult.suggestedStreamName,
        suggestedProjectId: aiResult.suggestedProjectId,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,

        // V3 specific fields - AI as assistant/coach
        thinking: aiResult.thinking,
        assistantMessage: aiResult.assistantMessage,
        firstSteps: aiResult.firstSteps,
        priority: aiResult.priority,
        dueDate: aiResult.dueDate,

        // Entity recognition
        entities: aiResult.entities,

        // Extracted tasks with title and priority
        extractedTasks: aiResult.extractedTasks,

        // Status updates and links
        statusUpdates: aiResult.statusUpdates,
        links: aiResult.links,

        // Multi-thread support
        threads: aiResult.threads,

        // Alternative suggestions
        alternatives
      }
    });

  } catch (error: any) {
    console.error('Flow suggest error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get suggestion'
    });
  }
});

/**
 * POST /api/v1/flow/suggest/batch
 * Get AI suggestions for multiple items
 */
router.post('/suggest/batch', async (req: Request, res: Response) => {
  try {
    const { elementIds } = req.body;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    if (!Array.isArray(elementIds) || elementIds.length === 0) {
      return res.status(400).json({ error: 'elementIds array required' });
    }

    if (elementIds.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 items per batch' });
    }

    // Get all items
    const items = await prisma.inboxItem.findMany({
      where: {
        id: { in: elementIds },
        organizationId: user.organizationId
      },
      include: {
        stream: { select: { id: true, name: true } }
      }
    });

    // Map STREAMS action to internal action
    const actionMapping: Record<string, string> = {
      'ZROB_TERAZ': 'CREATE_TASK',
      'ZAPLANUJ': 'ASSIGN_STREAM',
      'PROJEKT': 'CREATE_PROJECT',
      'KIEDYS_MOZE': 'SOMEDAY_MAYBE',
      'REFERENCJA': 'REFERENCE',
      'USUN': 'DELETE'
    };

    const suggestions: Record<string, any> = {};

    for (const item of items) {
      if (item.suggestedAction && item.aiConfidence) {
        // Use cached suggestion
        const mappedAction = actionMapping[item.suggestedAction] || 'ASSIGN_STREAM';
        const suggestedStreamsArr = item.suggestedStreams as string[] | null;
        suggestions[item.id] = {
          action: mappedAction,
          streamId: suggestedStreamsArr?.[0] || null,
          streamName: item.stream?.name || null,
          confidence: item.aiConfidence,
          reasoning: item.aiReasoning ? [item.aiReasoning] : []
        };
      } else {
        // Simple heuristic-based suggestion for batch (to avoid slow AI calls)
        let action = 'ASSIGN_STREAM';
        let confidence = 0.4;
        let reasoning = ['Sugestia oparta na analizie treści'];

        const content = (item.content || '').toLowerCase();
        const sourceType = item.sourceType || '';

        if (content.includes('spotkanie') || content.includes('call') || content.includes('meeting')) {
          action = 'CREATE_TASK';
          confidence = 0.6;
          reasoning = ['Wykryto słowa kluczowe związane ze spotkaniem'];
        } else if (content.includes('pomysł') || content.includes('idea') || content.includes('może')) {
          action = 'SOMEDAY_MAYBE';
          confidence = 0.55;
          reasoning = ['Wykryto słowa kluczowe sugerujące pomysł na przyszłość'];
        } else if (content.includes('projekt') || content.includes('inicjatywa')) {
          action = 'CREATE_PROJECT';
          confidence = 0.6;
          reasoning = ['Wykryto słowa kluczowe związane z projektem'];
        } else if (sourceType === 'DOCUMENT' || content.includes('dokument') || content.includes('dokumentacja')) {
          action = 'REFERENCE';
          confidence = 0.6;
          reasoning = ['Element wygląda na materiał referencyjny'];
        }

        suggestions[item.id] = {
          action,
          streamId: null,
          streamName: null,
          confidence,
          reasoning
        };
      }
    }

    return res.json({
      success: true,
      suggestions
    });

  } catch (error: any) {
    console.error('Flow batch suggest error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get batch suggestions'
    });
  }
});

// =============================================================================
// READ ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/flow/pending
 * Get pending items for processing
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { limit = 50, offset = 0 } = req.query;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    const items = await prisma.inboxItem.findMany({
      where: {
        organizationId: user.organizationId,
        processed: false,
        flowStatus: 'PENDING'
      },
      orderBy: { capturedAt: 'asc' },
      skip: Number(offset),
      take: Math.min(Number(limit), 100),
      include: {
        stream: { select: { id: true, name: true, color: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } }
      }
    });

    const total = await prisma.inboxItem.count({
      where: {
        organizationId: user.organizationId,
        processed: false,
        flowStatus: 'PENDING'
      }
    });

    return res.json({
      success: true,
      data: items,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + items.length < total
      }
    });

  } catch (error: any) {
    console.error('Flow pending error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending items'
    });
  }
});

/**
 * GET /api/v1/flow/awaiting
 * Get items awaiting user decision
 */
router.get('/awaiting', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { limit = 50, offset = 0 } = req.query;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    const items = await prisma.inboxItem.findMany({
      where: {
        organizationId: user.organizationId,
        flowStatus: 'AWAITING_DECISION'
      },
      orderBy: { capturedAt: 'asc' },
      skip: Number(offset),
      take: Math.min(Number(limit), 100),
      include: {
        stream: { select: { id: true, name: true, color: true } }
      }
    });

    return res.json({
      success: true,
      data: items.map(item => ({
        id: item.id,
        content: item.content,
        elementType: item.elementType,
        sourceType: item.sourceType,
        capturedAt: item.capturedAt,
        aiAnalysis: item.aiAnalysis,
        suggestedAction: item.suggestedAction,
        suggestedStreams: item.suggestedStreams,
        aiConfidence: item.aiConfidence,
        aiReasoning: item.aiReasoning,
        stream: item.stream
      }))
    });

  } catch (error: any) {
    console.error('Flow awaiting error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get awaiting items'
    });
  }
});

/**
 * GET /api/v1/flow/history
 * Get processing history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { limit = 50, offset = 0, days = 30 } = req.query;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - Number(days));

    const history = await prisma.flow_processing_history.findMany({
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: sinceDate }
      },
      orderBy: { createdAt: 'desc' },
      skip: Number(offset),
      take: Math.min(Number(limit), 100)
    });

    // Get statistics
    const stats = await prisma.flow_processing_history.groupBy({
      by: ['finalAction'],
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: sinceDate }
      },
      _count: true
    });

    const overrideCount = await prisma.flow_processing_history.count({
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: sinceDate },
        wasUserOverride: true
      }
    });

    return res.json({
      success: true,
      data: history,
      statistics: {
        byAction: stats.reduce((acc, s) => {
          acc[s.finalAction || 'null'] = s._count;
          return acc;
        }, {} as Record<string, number>),
        overrideRate: history.length > 0 ? (overrideCount / history.length) * 100 : 0,
        totalProcessed: history.length
      }
    });

  } catch (error: any) {
    console.error('Flow history error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get history'
    });
  }
});

// =============================================================================
// LEARNED PATTERNS
// =============================================================================

/**
 * GET /api/v1/flow/patterns
 * Get learned patterns
 */
router.get('/patterns', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { limit = 50, offset = 0 } = req.query;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    const patterns = await prisma.flow_learned_patterns.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true
      },
      orderBy: { confidence: 'desc' },
      skip: Number(offset),
      take: Math.min(Number(limit), 100),
      include: {
        learnedStream: { select: { id: true, name: true, color: true } }
      }
    });

    return res.json({
      success: true,
      data: patterns
    });

  } catch (error: any) {
    console.error('Flow patterns error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get patterns'
    });
  }
});

/**
 * DELETE /api/v1/flow/patterns/:id
 * Deactivate a learned pattern
 */
router.delete('/patterns/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    await prisma.flow_learned_patterns.updateMany({
      where: {
        id,
        organizationId: user.organizationId
      },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: 'Pattern deactivated'
    });

  } catch (error: any) {
    console.error('Flow pattern delete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete pattern'
    });
  }
});

// =============================================================================
// AUTOMATION RULES
// =============================================================================

/**
 * GET /api/v1/flow/rules
 * Get automation rules
 */
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    const rules = await prisma.flow_automation_rules.findMany({
      where: {
        organizationId: user.organizationId
      },
      orderBy: [
        { isActive: 'desc' },
        { priority: 'desc' }
      ],
      include: {
        targetStream: { select: { id: true, name: true, color: true } },
        targetProject: { select: { id: true, name: true } }
      }
    });

    return res.json({
      success: true,
      data: rules
    });

  } catch (error: any) {
    console.error('Flow rules error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get rules'
    });
  }
});

/**
 * POST /api/v1/flow/rules
 * Create automation rule
 */
router.post('/rules', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      name,
      description,
      conditions,
      action,
      targetStreamId,
      targetProjectId,
      autoExecute = false,
      notifyOnMatch = true,
      priority = 0
    } = req.body;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    if (!name || !conditions || !action) {
      return res.status(400).json({
        error: 'name, conditions, and action are required'
      });
    }

    const rule = await prisma.flow_automation_rules.create({
      data: {
        organizationId: user.organizationId,
        userId: user.userId,
        name,
        description,
        conditions,
        action,
        targetStreamId,
        targetProjectId,
        autoExecute,
        notifyOnMatch,
        priority
      },
      include: {
        targetStream: { select: { id: true, name: true, color: true } },
        targetProject: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({
      success: true,
      data: rule
    });

  } catch (error: any) {
    console.error('Flow rule create error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create rule'
    });
  }
});

/**
 * PUT /api/v1/flow/rules/:id
 * Update automation rule
 */
router.put('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const updateData = req.body;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.organizationId;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.executionCount;
    delete updateData.lastExecutedAt;

    const rule = await prisma.flow_automation_rules.updateMany({
      where: {
        id,
        organizationId: user.organizationId
      },
      data: updateData
    });

    if (rule.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    const updatedRule = await prisma.flow_automation_rules.findUnique({
      where: { id },
      include: {
        targetStream: { select: { id: true, name: true, color: true } },
        targetProject: { select: { id: true, name: true } }
      }
    });

    return res.json({
      success: true,
      data: updatedRule
    });

  } catch (error: any) {
    console.error('Flow rule update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update rule'
    });
  }
});

/**
 * DELETE /api/v1/flow/rules/:id
 * Delete automation rule
 */
router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    const result = await prisma.flow_automation_rules.deleteMany({
      where: {
        id,
        organizationId: user.organizationId
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    return res.json({
      success: true,
      message: 'Rule deleted'
    });

  } catch (error: any) {
    console.error('Flow rule delete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete rule'
    });
  }
});

// =============================================================================
// STREAMS & ACTIONS ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/flow/streams
 * Get available streams for flow processing
 */
router.get('/streams', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    const streams = await prisma.stream.findMany({
      where: {
        organizationId: user.organizationId,
        status: 'ACTIVE'
      },
      orderBy: [
        { streamType: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        streamType: true,
        gtdRole: true,
        _count: {
          select: {
            inboxItems: {
              where: { processed: false }
            },
            projects: {
              where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } }
            }
          }
        }
      }
    });

    return res.json({
      success: true,
      data: streams.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        color: s.color,
        icon: s.icon,
        streamType: s.streamType,
        gtdRole: s.gtdRole,
        pendingItems: s._count.inboxItems,
        activeProjects: s._count.projects
      }))
    });

  } catch (error: any) {
    console.error('Flow streams error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get streams'
    });
  }
});

/**
 * GET /api/v1/flow/actions
 * Get available flow actions with descriptions
 */
router.get('/actions', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    // STREAMS actions based on master.md specification
    const actions = [
      {
        id: 'ZROB_TERAZ',
        name: 'Zrób teraz',
        description: 'Proste zadanie <2min, szybka reakcja',
        icon: 'zap',
        color: '#EF4444',
        requiresStream: false,
        requiresProject: false,
        createsTask: true
      },
      {
        id: 'ZAPLANUJ',
        name: 'Zaplanuj',
        description: 'Konkretne zadanie z deadline, wymaga terminu',
        icon: 'calendar',
        color: '#3B82F6',
        requiresStream: true,
        requiresProject: false,
        createsTask: true
      },
      {
        id: 'PROJEKT',
        name: 'Projekt',
        description: 'Złożone przedsięwzięcie, wymaga wielu kroków',
        icon: 'folder',
        color: '#8B5CF6',
        requiresStream: true,
        requiresProject: true,
        createsTask: false
      },
      {
        id: 'KIEDYS_MOZE',
        name: 'Kiedyś/Może',
        description: 'Pomysł na przyszłość, nie pilne',
        icon: 'clock',
        color: '#F59E0B',
        requiresStream: false,
        requiresProject: false,
        createsTask: false
      },
      {
        id: 'REFERENCJA',
        name: 'Referencja',
        description: 'Informacja do zachowania, bez akcji',
        icon: 'bookmark',
        color: '#10B981',
        requiresStream: true,
        requiresProject: false,
        createsTask: false
      },
      {
        id: 'USUN',
        name: 'Usuń',
        description: 'Spam, nieistotne - do usunięcia',
        icon: 'trash',
        color: '#6B7280',
        requiresStream: false,
        requiresProject: false,
        createsTask: false
      }
    ];

    return res.json({
      success: true,
      data: actions
    });

  } catch (error: any) {
    console.error('Flow actions error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get actions'
    });
  }
});

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * GET /api/v1/flow/stats
 * Get flow processing statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { days = 30 } = req.query;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - Number(days));

    // Count items by status
    const statusCounts = await prisma.inboxItem.groupBy({
      by: ['flowStatus'],
      where: {
        organizationId: user.organizationId
      },
      _count: true
    });

    // Count by action type
    const actionCounts = await prisma.inboxItem.groupBy({
      by: ['userDecision'],
      where: {
        organizationId: user.organizationId,
        processed: true,
        processedAt: { gte: sinceDate }
      },
      _count: true
    });

    // Average processing time
    const avgProcessingTime = await prisma.inboxItem.aggregate({
      where: {
        organizationId: user.organizationId,
        processed: true,
        processingTimeMs: { not: null }
      },
      _avg: { processingTimeMs: true }
    });

    // Patterns count
    const patternsCount = await prisma.flow_learned_patterns.count({
      where: {
        organizationId: user.organizationId,
        isActive: true
      }
    });

    // Rules count
    const rulesCount = await prisma.flow_automation_rules.count({
      where: {
        organizationId: user.organizationId,
        isActive: true
      }
    });

    return res.json({
      success: true,
      data: {
        byStatus: statusCounts.reduce((acc, s) => {
          acc[s.flowStatus] = s._count;
          return acc;
        }, {} as Record<string, number>),
        byAction: actionCounts.reduce((acc, a) => {
          acc[a.userDecision || 'null'] = a._count;
          return acc;
        }, {} as Record<string, number>),
        avgProcessingTimeMs: avgProcessingTime._avg.processingTimeMs || 0,
        activePatterns: patternsCount,
        activeRules: rulesCount,
        period: { days: Number(days), since: sinceDate }
      }
    });

  } catch (error: any) {
    console.error('Flow stats error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats'
    });
  }
});

// =============================================================================
// POST /flow/batch - Batch processing multiple items
// =============================================================================
router.post('/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.organizationId) {
      return res.status(401).json({ success: false, error: 'Unauthorized - no organization' });
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'items array is required and must not be empty'
      });
    }

    const results: Array<{
      elementId: string;
      success: boolean;
      action?: string;
      error?: string;
    }> = [];

    let successCount = 0;
    let failureCount = 0;

    for (const item of items) {
      const { elementId, action, targetStreamId } = item;

      if (!elementId || !action) {
        results.push({ elementId: elementId || 'unknown', success: false, error: 'Missing elementId or action' });
        failureCount++;
        continue;
      }

      try {
        // Mark inbox item as processed
        await prisma.inboxItem.update({
          where: { id: elementId },
          data: {
            processed: true,
            flowStatus: 'PROCESSED',
            userDecision: action as FlowAction,
            userDecisionAt: new Date(),
            processedAt: new Date()
          }
        });

        // If action requires stream assignment
        if (targetStreamId && (action === 'ZAPLANUJ' || action === 'REFERENCJA')) {
          await prisma.inboxItem.update({
            where: { id: elementId },
            data: { streamId: targetStreamId }
          });
        }

        results.push({ elementId, success: true, action });
        successCount++;
      } catch (error: any) {
        results.push({ elementId, success: false, error: error.message });
        failureCount++;
      }
    }

    return res.json({
      success: true,
      data: {
        results,
        successCount,
        failureCount,
        totalProcessed: items.length
      }
    });

  } catch (error: any) {
    console.error('Flow batch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process batch'
    });
  }
});

// =============================================================================
// POST /flow/feedback - Record AI feedback (for learning)
// =============================================================================
router.post('/feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.organizationId) {
      return res.status(401).json({ success: false, error: 'Unauthorized - no organization' });
    }

    const { elementId, suggestedAction, actualAction, wasHelpful } = req.body;

    if (!elementId || !suggestedAction || !actualAction) {
      return res.status(400).json({
        success: false,
        error: 'elementId, suggestedAction, and actualAction are required'
      });
    }

    // Find existing flow processing history for this element
    const existingHistory = await prisma.flow_processing_history.findFirst({
      where: {
        inboxItemId: elementId,
        organizationId: user.organizationId
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingHistory) {
      // Update existing record with user feedback
      await prisma.flow_processing_history.update({
        where: { id: existingHistory.id },
        data: {
          finalAction: actualAction as FlowAction,
          wasUserOverride: suggestedAction !== actualAction,
          userFeedback: wasHelpful
            ? 'User confirmed AI suggestion'
            : 'User changed AI suggestion'
        }
      });
    } else {
      // Only create new feedback record if we have userId
      const userId = user.userId || user.id;
      if (userId) {
        await prisma.flow_processing_history.create({
          data: {
            organization: { connect: { id: user.organizationId } },
            user: { connect: { id: userId } },
            inboxItemId: elementId,
            aiSuggestedAction: suggestedAction as FlowAction,
            aiConfidence: 0,
            finalAction: actualAction as FlowAction,
            wasUserOverride: suggestedAction !== actualAction,
            userFeedback: wasHelpful
              ? 'User confirmed AI suggestion'
              : 'User changed AI suggestion'
          }
        });
      } else {
        console.log('[FlowFeedback] Skipping history creation - no userId');
      }
    }

    // If user overrode AI suggestion, this is valuable training data
    // Could be used to create a new learned pattern
    if (suggestedAction !== actualAction) {
      console.log(`[FlowFeedback] User override: ${suggestedAction} -> ${actualAction} for element ${elementId}`);

      // TODO: In future, this could trigger pattern learning
      // await flowEngine.learnFromUserDecision(elementId, actualAction);
    }

    return res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error: any) {
    console.error('Flow feedback error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to record feedback'
    });
  }
});

export default router;
