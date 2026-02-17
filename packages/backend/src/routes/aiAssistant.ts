/**
 * AI Assistant Routes - Human-in-the-Loop
 * Implementacja zgodna ze spec.md
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Typy zgodne ze spec.md
type AIContext = 'SOURCE' | 'STREAM' | 'TASK' | 'DAY_PLAN' | 'REVIEW' | 'DEAL';
type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'MODIFIED';

interface SourceItemSuggestion {
  suggestedAction: 'DO_NOW' | 'SCHEDULE' | 'DELEGATE' | 'PROJECT' | 'REFERENCE' | 'SOMEDAY' | 'DELETE';
  suggestedStream: string | null;
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  suggestedTags: string[];
  suggestedDueDate: Date | null;
  extractedTasks: string[];
  confidence: number;
  reasoning: string;
}

// Apply authentication
router.use(authenticateToken);

// ==========================================
// POST /api/v1/ai-assistant/analyze
// Główny endpoint analizy (spec.md sekcja 4.1)
// ==========================================
router.post('/analyze', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const userId = (req as any).user!.id;
    const organizationId = (req as any).user!.organizationId;
    const { context, data } = req.body as { context: AIContext; data: any };

    if (!context || !data) {
      return res.status(400).json({
        error: 'Missing required fields: context and data',
        code: 'INVALID_REQUEST'
      });
    }

    logger.info('AI analyze request', { userId, context });

    // Pobierz wzorce użytkownika
    let userPatterns = await prisma.user_ai_patterns.findUnique({
      where: { user_id: userId }
    });

    // Utwórz wzorce jeśli nie istnieją
    if (!userPatterns) {
      userPatterns = await prisma.user_ai_patterns.create({
        data: {
          id: uuidv4(),
          user_id: userId,
          organization_id: organizationId
        }
      });
    }

    // Sprawdź poziom autonomii i włączone konteksty
    const enabledContexts = userPatterns.enabled_contexts as string[];
    if (!enabledContexts.includes(context)) {
      return res.status(403).json({
        error: `AI analysis for context '${context}' is disabled`,
        code: 'CONTEXT_DISABLED'
      });
    }

    // Generuj sugestię na podstawie kontekstu
    let suggestion: any;
    let confidence = 75;
    let reasoning = '';

    switch (context) {
      case 'SOURCE':
        suggestion = await analyzeSourceItem(data, organizationId);
        confidence = suggestion.confidence;
        reasoning = suggestion.reasoning;
        break;
      case 'STREAM':
        suggestion = await analyzeStream(data, organizationId);
        confidence = 80;
        reasoning = suggestion.reasoning;
        break;
      case 'TASK':
        suggestion = await analyzeTask(data, organizationId);
        confidence = 70;
        reasoning = suggestion.reasoning;
        break;
      case 'DAY_PLAN':
        suggestion = await analyzeDayPlan(data, userId, organizationId);
        confidence = 85;
        reasoning = suggestion.reasoning;
        break;
      case 'REVIEW':
        suggestion = await analyzeWeeklyReview(userId, organizationId);
        confidence = 90;
        reasoning = suggestion.reasoning;
        break;
      default:
        suggestion = { message: 'Context not implemented yet' };
        confidence = 0;
        reasoning = 'Unsupported context';
    }

    const processingTime = Date.now() - startTime;

    // Zapisz sugestię do bazy
    const savedSuggestion = await prisma.ai_suggestions.create({
      data: {
        id: uuidv4(),
        user_id: userId,
        organization_id: organizationId,
        context,
        input_data: data,
        suggestion,
        confidence,
        reasoning,
        processing_time_ms: processingTime
      }
    });

    // Aktualizuj statystyki użytkownika
    await prisma.user_ai_patterns.update({
      where: { user_id: userId },
      data: {
        total_suggestions: { increment: 1 }
      }
    });

    return res.json({
      suggestionId: savedSuggestion.id,
      suggestions: suggestion,
      confidence,
      reasoning,
      processingTime
    });

  } catch (error) {
    logger.error('AI analyze error:', error);
    return res.status(500).json({
      error: 'Failed to analyze',
      code: 'ANALYSIS_ERROR'
    });
  }
});

// ==========================================
// POST /api/v1/ai-assistant/feedback
// Endpoint zatwierdzania (spec.md sekcja 4.2)
// ==========================================
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { suggestionId, accepted, modifications } = req.body;

    if (!suggestionId || accepted === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: suggestionId and accepted',
        code: 'INVALID_REQUEST'
      });
    }

    // Znajdź sugestię
    const suggestion = await prisma.ai_suggestions.findUnique({
      where: { id: suggestionId }
    });

    if (!suggestion || suggestion.user_id !== userId) {
      return res.status(404).json({
        error: 'Suggestion not found',
        code: 'NOT_FOUND'
      });
    }

    // Określ status
    let status: SuggestionStatus = accepted ? 'ACCEPTED' : 'REJECTED';
    if (accepted && modifications) {
      status = 'MODIFIED';
    }

    // Aktualizuj sugestię
    await prisma.ai_suggestions.update({
      where: { id: suggestionId },
      data: {
        status,
        user_modifications: modifications || undefined,
        resolved_at: new Date()
      }
    });

    // Aktualizuj wzorce użytkownika
    const updateData: any = {};
    if (accepted) {
      updateData.total_accepted = { increment: 1 };
    }

    // Pobierz aktualne statystyki i oblicz nowy acceptance_rate
    const patterns = await prisma.user_ai_patterns.findUnique({
      where: { user_id: userId }
    });

    if (patterns) {
      const newTotalAccepted = patterns.total_accepted + (accepted ? 1 : 0);
      const newRate = patterns.total_suggestions > 0
        ? (newTotalAccepted / patterns.total_suggestions) * 100
        : 0;

      updateData.acceptance_rate = Math.round(newRate * 100) / 100;

      if (accepted) {
        updateData.total_accepted = { increment: 1 };
      }

      // Eskalacja poziomu autonomii po 50 zatwierdzeniach (spec.md)
      if (newTotalAccepted >= 50 && patterns.autonomy_level === 1 && newRate >= 70) {
        updateData.autonomy_level = 2;
        logger.info('User autonomy level upgraded to 2', { userId });
      }

      await prisma.user_ai_patterns.update({
        where: { user_id: userId },
        data: updateData
      });
    }

    return res.json({
      success: true,
      status,
      message: `Suggestion ${status.toLowerCase()}`
    });

  } catch (error) {
    logger.error('AI feedback error:', error);
    return res.status(500).json({
      error: 'Failed to process feedback',
      code: 'FEEDBACK_ERROR'
    });
  }
});

// ==========================================
// POST /api/v1/ai-assistant/analyze-source-item
// Analiza elementu w Źródle (spec.md sekcja 3.1)
// ==========================================
router.post('/analyze-source-item', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const organizationId = (req as any).user!.organizationId;
    const { itemId, content, source } = req.body;

    if (!content && !itemId) {
      return res.status(400).json({
        error: 'Either itemId or content is required',
        code: 'INVALID_REQUEST'
      });
    }

    let itemContent = content;

    // Jeśli podano itemId, pobierz element
    if (itemId) {
      const item = await prisma.inboxItem.findUnique({
        where: { id: itemId }
      });
      if (!item) {
        return res.status(404).json({
          error: 'Source item not found',
          code: 'NOT_FOUND'
        });
      }
      itemContent = item.content;
    }

    const suggestion = await analyzeSourceItem({ content: itemContent, source }, organizationId);

    return res.json({
      success: true,
      suggestion
    });

  } catch (error) {
    logger.error('Analyze source item error:', error);
    return res.status(500).json({
      error: 'Failed to analyze source item',
      code: 'ANALYSIS_ERROR'
    });
  }
});

// ==========================================
// POST /api/v1/ai-assistant/optimize-day
// Optymalizacja dnia (spec.md sekcja 3.4)
// ==========================================
router.post('/optimize-day', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const organizationId = (req as any).user!.organizationId;
    const { date } = req.body;

    const targetDate = date ? new Date(date) : new Date();

    const suggestion = await analyzeDayPlan({ date: targetDate }, userId, organizationId);

    return res.json({
      success: true,
      suggestion
    });

  } catch (error) {
    logger.error('Optimize day error:', error);
    return res.status(500).json({
      error: 'Failed to optimize day',
      code: 'OPTIMIZATION_ERROR'
    });
  }
});

// ==========================================
// POST /api/v1/ai-assistant/weekly-review
// Przegląd tygodniowy (spec.md sekcja 3.5)
// ==========================================
router.post('/weekly-review', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const organizationId = (req as any).user!.organizationId;

    const suggestion = await analyzeWeeklyReview(userId, organizationId);

    return res.json({
      success: true,
      suggestion
    });

  } catch (error) {
    logger.error('Weekly review error:', error);
    return res.status(500).json({
      error: 'Failed to generate weekly review',
      code: 'REVIEW_ERROR'
    });
  }
});

// ==========================================
// GET /api/v1/ai-assistant/user-patterns
// Wzorce użytkownika (spec.md sekcja 4.3)
// ==========================================
router.get('/user-patterns', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const organizationId = (req as any).user!.organizationId;

    let patterns = await prisma.user_ai_patterns.findUnique({
      where: { user_id: userId }
    });

    if (!patterns) {
      patterns = await prisma.user_ai_patterns.create({
        data: {
          id: uuidv4(),
          user_id: userId,
          organization_id: organizationId
        }
      });
    }

    return res.json({
      success: true,
      data: {
        preferredStreams: patterns.preferred_streams,
        energyPatterns: patterns.energy_patterns,
        acceptanceRate: Number(patterns.acceptance_rate),
        commonModifications: patterns.common_modifications,
        totalSuggestions: patterns.total_suggestions,
        totalAccepted: patterns.total_accepted,
        autonomyLevel: patterns.autonomy_level,
        enabledContexts: patterns.enabled_contexts
      }
    });

  } catch (error) {
    logger.error('Get user patterns error:', error);
    return res.status(500).json({
      error: 'Failed to get user patterns',
      code: 'PATTERNS_ERROR'
    });
  }
});

// ==========================================
// PUT /api/v1/ai-assistant/settings
// Ustawienia AI użytkownika
// ==========================================
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const organizationId = (req as any).user!.organizationId;
    const { autonomyLevel, enabledContexts } = req.body;

    const updateData: any = {};

    if (autonomyLevel !== undefined && autonomyLevel >= 0 && autonomyLevel <= 3) {
      updateData.autonomy_level = autonomyLevel;
    }

    if (enabledContexts !== undefined && Array.isArray(enabledContexts)) {
      updateData.enabled_contexts = enabledContexts;
    }

    const patterns = await prisma.user_ai_patterns.upsert({
      where: { user_id: userId },
      update: updateData,
      create: {
        id: uuidv4(),
        user_id: userId,
        organization_id: organizationId,
        ...updateData
      }
    });

    return res.json({
      success: true,
      data: patterns
    });

  } catch (error) {
    logger.error('Update AI settings error:', error);
    return res.status(500).json({
      error: 'Failed to update AI settings',
      code: 'SETTINGS_ERROR'
    });
  }
});

// ==========================================
// GET /api/v1/ai-assistant/suggestions
// Lista sugestii użytkownika
// ==========================================
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { status, context, limit = 20 } = req.query;

    const where: any = { user_id: userId };
    if (status) where.status = status;
    if (context) where.context = context;

    const suggestions = await prisma.ai_suggestions.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: Number(limit)
    });

    return res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    });

  } catch (error) {
    logger.error('Get suggestions error:', error);
    return res.status(500).json({
      error: 'Failed to get suggestions',
      code: 'SUGGESTIONS_ERROR'
    });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function analyzeSourceItem(data: any, organizationId: string): Promise<SourceItemSuggestion> {
  const content = data.content || '';
  const contentLower = content.toLowerCase();

  // Pobierz aktywne strumienie
  const streams = await prisma.stream.findMany({
    where: { organizationId, status: 'ACTIVE' },
    select: { id: true, name: true, pattern: true }
  });

  // Prosta analiza na podstawie słów kluczowych
  let suggestedAction: SourceItemSuggestion['suggestedAction'] = 'SCHEDULE';
  let suggestedPriority: SourceItemSuggestion['suggestedPriority'] = 'MEDIUM';
  let suggestedStream: string | null = null;
  const extractedTasks: string[] = [];
  const suggestedTags: string[] = [];

  // Analiza pilności
  if (contentLower.includes('pilne') || contentLower.includes('urgent') || contentLower.includes('asap')) {
    suggestedPriority = 'URGENT';
    suggestedAction = 'DO_NOW';
  } else if (contentLower.includes('ważne') || contentLower.includes('important')) {
    suggestedPriority = 'HIGH';
  }

  // Analiza akcji
  if (contentLower.includes('może kiedyś') || contentLower.includes('someday')) {
    suggestedAction = 'SOMEDAY';
  } else if (contentLower.includes('deleguj') || contentLower.includes('delegate')) {
    suggestedAction = 'DELEGATE';
  } else if (contentLower.includes('projekt') || contentLower.includes('project')) {
    suggestedAction = 'PROJECT';
  } else if (contentLower.includes('referencja') || contentLower.includes('reference') || contentLower.includes('info')) {
    suggestedAction = 'REFERENCE';
  }

  // Dopasuj strumień
  for (const stream of streams) {
    if (contentLower.includes(stream.name.toLowerCase())) {
      suggestedStream = stream.id;
      break;
    }
  }

  // Ekstrakcja zadań z treści (proste rozpoznawanie)
  const taskPatterns = [
    /(?:zrób|zrobić|wykonaj|sprawdź|napisz|wyślij|zadzwoń|umów|przygotuj)\s+(.+?)(?:\.|$)/gi,
    /(?:todo|task|action):\s*(.+?)(?:\.|$)/gi
  ];

  for (const pattern of taskPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && match[1].length > 3) {
        extractedTasks.push(match[1].trim());
      }
    }
  }

  // Confidence based on analysis depth
  let confidence = 60;
  if (suggestedStream) confidence += 15;
  if (extractedTasks.length > 0) confidence += 10;
  if (suggestedPriority !== 'MEDIUM') confidence += 5;

  const reasoning = buildReasoning(suggestedAction, suggestedPriority, suggestedStream, streams);

  return {
    suggestedAction,
    suggestedStream,
    suggestedPriority,
    suggestedTags,
    suggestedDueDate: suggestedPriority === 'URGENT' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    extractedTasks,
    confidence,
    reasoning
  };
}

function buildReasoning(action: string, priority: string, streamId: string | null, streams: any[]): string {
  const parts = [];

  const actionMap: Record<string, string> = {
    'DO_NOW': 'Zalecam natychmiastowe działanie',
    'SCHEDULE': 'Sugeruję zaplanowanie tego zadania',
    'DELEGATE': 'To zadanie nadaje się do delegowania',
    'PROJECT': 'Wymaga to rozłożenia na projekt',
    'REFERENCE': 'To materiał referencyjny do zachowania',
    'SOMEDAY': 'Można to odłożyć na później',
    'DELETE': 'Można to usunąć'
  };

  parts.push(actionMap[action] || 'Analizuję element');

  if (priority === 'URGENT') {
    parts.push('ze względu na pilność');
  } else if (priority === 'HIGH') {
    parts.push('ze względu na wysoką ważność');
  }

  if (streamId) {
    const stream = streams.find(s => s.id === streamId);
    if (stream) {
      parts.push(`i przypisanie do strumienia "${stream.name}"`);
    }
  }

  return parts.join(' ') + '.';
}

async function analyzeStream(data: any, organizationId: string): Promise<any> {
  const { name, description } = data;

  // Pobierz istniejące strumienie
  const existingStreams = await prisma.stream.findMany({
    where: { organizationId },
    select: { id: true, name: true, pattern: true }
  });

  // Sprawdź duplikaty
  const nameLower = (name || '').toLowerCase();
  const potentialDuplicate = existingStreams.find(s =>
    s.name.toLowerCase().includes(nameLower) || nameLower.includes(s.name.toLowerCase())
  );

  // Sugeruj wzorzec
  let suggestedPattern = 'custom';
  const descLower = (description || '').toLowerCase();

  if (descLower.includes('projekt') || descLower.includes('project')) {
    suggestedPattern = 'project';
  } else if (descLower.includes('klient') || descLower.includes('client')) {
    suggestedPattern = 'client';
  } else if (descLower.includes('ciągły') || descLower.includes('continuous')) {
    suggestedPattern = 'continuous';
  } else if (descLower.includes('pipeline') || descLower.includes('proces')) {
    suggestedPattern = 'pipeline';
  }

  return {
    suggestedPattern,
    suggestedParent: null,
    suggestedColor: '#3B82F6',
    suggestedIcon: 'stream',
    relatedStreams: existingStreams.slice(0, 3).map(s => s.id),
    warningIfDuplicate: !!potentialDuplicate,
    duplicateWarning: potentialDuplicate ? `Podobny strumień już istnieje: "${potentialDuplicate.name}"` : null,
    reasoning: `Sugeruję wzorzec "${suggestedPattern}" na podstawie opisu.${potentialDuplicate ? ' Uwaga: wykryto potencjalny duplikat.' : ''}`
  };
}

async function analyzeTask(data: any, organizationId: string): Promise<any> {
  const { title, description, priority } = data;

  // Prosta analiza zadania
  const contentLower = `${title || ''} ${description || ''}`.toLowerCase();

  let suggestedEnergyLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let suggestedDuration = 30; // minuty
  let suggestedTimeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' = 'MORNING';

  // Analiza wymaganej energii
  if (contentLower.includes('kreatyw') || contentLower.includes('analiz') || contentLower.includes('strategia')) {
    suggestedEnergyLevel = 'HIGH';
    suggestedTimeSlot = 'MORNING';
    suggestedDuration = 60;
  } else if (contentLower.includes('email') || contentLower.includes('admin') || contentLower.includes('rutyn')) {
    suggestedEnergyLevel = 'LOW';
    suggestedTimeSlot = 'AFTERNOON';
    suggestedDuration = 15;
  }

  return {
    suggestedEnergyLevel,
    suggestedDuration,
    suggestedTimeSlot,
    suggestedStream: null,
    relatedTasks: [],
    blockers: [],
    reasoning: `Zadanie wymaga ${suggestedEnergyLevel === 'HIGH' ? 'wysokiej' : suggestedEnergyLevel === 'LOW' ? 'niskiej' : 'średniej'} energii. Sugeruję ${suggestedDuration} minut ${suggestedTimeSlot === 'MORNING' ? 'rano' : suggestedTimeSlot === 'AFTERNOON' ? 'po południu' : 'wieczorem'}.`
  };
}

async function analyzeDayPlan(data: any, userId: string, organizationId: string): Promise<any> {
  const targetDate = data.date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Pobierz zadania na dziś
  const tasks = await prisma.task.findMany({
    where: {
      createdById: userId,
      status: { in: ['NEW', 'IN_PROGRESS', 'WAITING'] },
      dueDate: { gte: startOfDay, lte: endOfDay }
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' }
    ],
    take: 10
  });

  // Generuj bloki czasowe
  const blocks = [];
  let currentTime = new Date(startOfDay);
  currentTime.setHours(9, 0, 0, 0); // Start o 9:00

  // Blok głębokiej pracy (rano)
  blocks.push({
    startTime: '09:00',
    endTime: '11:00',
    taskId: tasks[0]?.id || null,
    blockType: 'DEEP_WORK',
    energyLevel: 'HIGH'
  });

  // Przerwa
  blocks.push({
    startTime: '11:00',
    endTime: '11:15',
    taskId: null,
    blockType: 'BREAK',
    energyLevel: 'LOW'
  });

  // Spotkania/admin (po przerwie)
  blocks.push({
    startTime: '11:15',
    endTime: '12:30',
    taskId: tasks[1]?.id || null,
    blockType: 'MEETINGS',
    energyLevel: 'MEDIUM'
  });

  // Przerwa obiadowa
  blocks.push({
    startTime: '12:30',
    endTime: '13:30',
    taskId: null,
    blockType: 'BREAK',
    energyLevel: 'LOW'
  });

  // Popołudniowa praca
  blocks.push({
    startTime: '13:30',
    endTime: '15:30',
    taskId: tasks[2]?.id || null,
    blockType: 'DEEP_WORK',
    energyLevel: 'MEDIUM'
  });

  // Admin/rutyna
  blocks.push({
    startTime: '15:30',
    endTime: '17:00',
    taskId: tasks[3]?.id || null,
    blockType: 'ADMIN',
    energyLevel: 'LOW'
  });

  return {
    blocks,
    reasoning: `Plan dnia uwzględnia ${tasks.length} zadań. Głęboka praca zaplanowana rano (9-11), gdy energia jest najwyższa. Zadania administracyjne przesunięte na koniec dnia.`,
    alternativePlan: null,
    tasksSummary: {
      total: tasks.length,
      highPriority: tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length
    }
  };
}

async function analyzeWeeklyReview(userId: string, organizationId: string): Promise<any> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Statystyki z ostatniego tygodnia
  const [completedTasks, newTasks, overdueCount, streams] = await Promise.all([
    prisma.task.count({
      where: {
        createdById: userId,
        status: 'COMPLETED',
        completedAt: { gte: weekAgo }
      }
    }),
    prisma.inboxItem.count({
      where: {
        organizationId: organizationId,
        createdAt: { gte: weekAgo }
      }
    }),
    prisma.task.count({
      where: {
        createdById: userId,
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() }
      }
    }),
    prisma.stream.findMany({
      where: { organizationId, status: 'ACTIVE' },
      include: {
        _count: {
          select: {
            tasks: { where: { updatedAt: { gte: weekAgo } } }
          }
        }
      }
    })
  ]);

  // Analiza aktywności strumieni
  const streamsActivity = streams.map(s => ({
    streamId: s.id,
    streamName: s.name,
    activity: s._count.tasks > 5 ? 'HIGH' : s._count.tasks > 0 ? 'MEDIUM' : 'LOW'
  }));

  // Strumienie do zamrożenia (nieaktywne >7 dni)
  const streamsToFreeze = streamsActivity
    .filter(s => s.activity === 'LOW')
    .map(s => s.streamId);

  // Generuj insights
  const insights = [];
  const suggestionsForNextWeek = [];

  if (completedTasks > 10) {
    insights.push(`Świetny tydzień! Ukończono ${completedTasks} zadań.`);
  } else if (completedTasks < 5) {
    insights.push(`Niski poziom ukończonych zadań (${completedTasks}). Sprawdź czy zadania nie są zbyt duże.`);
    suggestionsForNextWeek.push('Rozważ podział dużych zadań na mniejsze kroki');
  }

  if (overdueCount > 0) {
    insights.push(`Masz ${overdueCount} zaległych zadań wymagających uwagi.`);
    suggestionsForNextWeek.push('Przejrzyj zaległe zadania i zdecyduj: zrób, deleguj lub usuń');
  }

  if (streamsToFreeze.length > 0) {
    insights.push(`${streamsToFreeze.length} strumieni jest nieaktywnych - rozważ zamrożenie.`);
  }

  return {
    summary: {
      completedTasks,
      completedProjects: 0, // TODO: implement
      newItems: newTasks,
      streamsActivity
    },
    insights,
    suggestionsForNextWeek,
    streamsToFreeze,
    streamsToUnfreeze: [],
    stuckProjects: [],
    overdueItems: overdueCount,
    reasoning: `Przegląd tygodniowy: ${completedTasks} ukończonych zadań, ${overdueCount} zaległych, ${newTasks} nowych elementów w Źródle.`
  };
}

export default router;
