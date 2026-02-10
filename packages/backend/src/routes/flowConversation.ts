/**
 * Flow Conversation API Routes
 * =============================
 * API dla dialogowego przetwarzania elementow przez Flow Engine
 */

import { Router, Request, Response } from 'express';
import { FlowConversationStatus, FlowAction } from '@prisma/client';
import { prisma } from '../config/database';
import { authenticateToken as authMiddleware } from '../shared/middleware/auth';
import { AIRouter } from '../services/ai/AIRouter';

const router = Router();

// Cache for AIRouter instances
const aiRouterCache: Map<string, AIRouter> = new Map();

async function getAIRouter(organizationId: string): Promise<AIRouter> {
  let aiRouter = aiRouterCache.get(organizationId);
  if (!aiRouter) {
    aiRouter = new AIRouter({ organizationId, prisma });
    await aiRouter.initializeProviders();
    aiRouterCache.set(organizationId, aiRouter);
  }
  return aiRouter;
}

// Apply auth middleware
router.use(authMiddleware);

// =============================================================================
// GET / - Lista konwersacji
// =============================================================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status = 'ACTIVE' } = req.query;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversations = await prisma.flow_conversations.findMany({
      where: {
        organizationId: user.organizationId,
        status: status as FlowConversationStatus
      },
      include: {
        inboxItem: {
          select: { content: true, sourceType: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json({
      success: true,
      data: conversations.map(c => ({
        ...c,
        item_content: c.inboxItem?.content,
        source_type: c.inboxItem?.sourceType
      }))
    });

  } catch (error: any) {
    console.error('Flow conversations list error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// GET /:id - Pobierz konwersacje
// =============================================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversation = await getConversationWithMessages(id, user.organizationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Konwersacja nie znaleziona' });
    }

    return res.json({
      success: true,
      data: conversation
    });

  } catch (error: any) {
    console.error('Flow conversation get error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// POST /start/:itemId - Rozpocznij konwersacje
// =============================================================================
router.post('/start/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized - no organization' });
    }

    // Sprawdz czy element istnieje
    const inboxItem = await prisma.inboxItem.findFirst({
      where: {
        id: itemId,
        organizationId: user.organizationId
      },
      include: {
        stream: { select: { id: true, name: true } }
      }
    });

    if (!inboxItem) {
      return res.status(404).json({ error: 'Element nie znaleziony' });
    }

    // Jeśli istnieje aktywna konwersacja, anuluj ją i stwórz nową
    // (żeby użytkownik zawsze dostawał świeżą analizę AI)
    const existingConv = await prisma.flow_conversations.findFirst({
      where: {
        inboxItemId: itemId,
        status: 'ACTIVE'
      }
    });

    if (existingConv) {
      await prisma.flow_conversations.update({
        where: { id: existingConv.id },
        data: { status: 'CANCELLED' }
      });
      console.log(`🔄 Anulowano starą konwersację ${existingConv.id} - tworzę nową ze świeżą analizą AI`);
    }

    // Pobierz kontekst dla AI
    const streams = await prisma.stream.findMany({
      where: { organizationId: user.organizationId, status: 'ACTIVE' },
      select: { id: true, name: true, description: true }
    });

    const projects = await prisma.project.findMany({
      where: {
        organizationId: user.organizationId,
        status: { in: ['PLANNING', 'IN_PROGRESS'] }
      },
      select: { id: true, name: true, streamId: true },
      take: 20
    });

    // Pobierz nauczone wzorce
    const learnedPatterns = await prisma.flow_learned_patterns.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        confidence: { gte: 0.6 }
      },
      orderBy: { confidence: 'desc' },
      take: 10
    });

    // Generuj poczatkowa propozycje AI
    const aiRouter = await getAIRouter(user.organizationId);
    const content = `${inboxItem.content || ''}\n${inboxItem.note || ''}`.trim();

    // Buduj kontekst
    const streamsInfo = streams.map(s => `- ${s.id}: ${s.name} (${s.description || 'brak opisu'})`).join('\n');
    const projectsInfo = projects.map(p => `- ${p.id}: ${p.name}`).join('\n');
    const patternsInfo = learnedPatterns.length > 0
      ? learnedPatterns.map(p =>
          `- Jesli tresc zawiera "${p.contentPattern}" → ${p.learnedAction}`
        ).join('\n')
      : '';

    // Pobierz prompt SOURCE_ANALYZE z bazy danych
    const promptTemplate = await prisma.ai_prompt_templates.findFirst({
      where: {
        code: 'SOURCE_ANALYZE',
        organizationId: user.organizationId
      }
    });

    if (!promptTemplate?.systemPrompt) {
      // BRAK PROMPTU = BŁĄD - użytkownik musi skonfigurować Asystenta AI
      console.error('❌ FlowConversation: Brak promptu SOURCE_ANALYZE w bazie danych!');
      return res.status(400).json({
        success: false,
        error: 'Analiza AI niedostępna',
        message: 'Brak konfiguracji promptu SOURCE_ANALYZE. Skonfiguruj Asystenta AI w ustawieniach.',
        code: 'MISSING_AI_PROMPT'
      });
    }

    // Użyj promptu z bazy - podstaw zmienne kontekstowe
    const systemPrompt = promptTemplate.systemPrompt
      .replace(/\{\{STREAMS\}\}/g, streamsInfo)
      .replace(/\{\{PROJECTS\}\}/g, projectsInfo || 'Brak projektów')
      .replace(/\{\{CONTACTS\}\}/g, 'Brak kontaktów')
      .replace(/\{\{COMPANIES\}\}/g, 'Brak firm')
      .replace(/\{\{LEARNED_PATTERNS\}\}/g, patternsInfo || 'Brak wzorców');

    const userPromptText = promptTemplate.userPromptTemplate || 'Przeanalizuj element:\n\n{{CONTENT}}';
    console.log('📝 FlowConversation: Użyto promptu SOURCE_ANALYZE z bazy danych');

    const userPrompt = userPromptText
      .replace(/\{\{CONTENT\}\}/gi, content)
      .replace(/\{\{content\}\}/gi, content);

    // DEBUG: Loguj co wysyłamy do AI
    console.log('🔍 === FLOW CONVERSATION DEBUG ===');
    console.log('🔍 systemPrompt (first 800 chars):', systemPrompt.substring(0, 800));
    console.log('🔍 userPrompt:', userPrompt.substring(0, 300));
    console.log('🔍 ================================');

    const aiResponse = await aiRouter.processRequest({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      config: { temperature: 0.4, maxTokens: 1500, responseFormat: 'json' }
    });

    // DEBUG: Loguj odpowiedź AI
    console.log('🔍 AI Response (raw):', aiResponse.content.substring(0, 500));

    // Parse AI response
    let aiResult: any = {};
    try {
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }

    // Parsuj nowy format z actionOptions (sample_ai.md)
    const actionOptions = aiResult.actionOptions || [];
    const streamMatching = aiResult.streamMatching || {};

    // Znajdz domyslna akcje (isDefault: true) lub pierwsza
    const defaultOption = actionOptions.find((opt: any) => opt.isDefault) || actionOptions[0] || {};

    // Znajdz stream ID z streamMatching.bestMatch
    // WALIDACJA: zawsze sprawdzaj czy stream istnieje w bazie!
    let proposedStreamId: string | null = null;
    if (streamMatching.bestMatch?.streamId) {
      // Sprawdź czy stream o tym ID faktycznie istnieje
      const streamExists = streams.find(s => s.id === streamMatching.bestMatch?.streamId);
      if (streamExists) {
        proposedStreamId = streamMatching.bestMatch.streamId;
      } else {
        console.log(`⚠️ AI zwróciło nieistniejący streamId: ${streamMatching.bestMatch.streamId}`);
      }
    }
    // Fallback: spróbuj dopasować po nazwie
    if (!proposedStreamId && streamMatching.bestMatch?.name) {
      const matchedStream = streams.find(s =>
        s.name.toLowerCase() === streamMatching.bestMatch?.name?.toLowerCase()
      );
      proposedStreamId = matchedStream?.id || null;
    }

    // Mapuj akcje na FlowAction enum
    const actionMap: Record<string, FlowAction> = {
      'ZROB_TERAZ': 'ZROB_TERAZ',
      'ZAPLANUJ': 'ZAPLANUJ',
      'PROJEKT': 'PROJEKT',
      'KIEDYS_MOZE': 'KIEDYS_MOZE',
      'REFERENCJA': 'REFERENCJA',
      'USUN': 'USUN'
    };

    const mappedAction = actionMap[defaultOption.action] || 'ZAPLANUJ';

    // Utworz konwersacje
    const newConversation = await prisma.flow_conversations.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        inboxItemId: itemId,
        status: 'ACTIVE',
        proposedAction: mappedAction,
        proposedStreamId: proposedStreamId,
        proposedTaskTitle: content.substring(0, 100),
        proposedPriority: aiResult.analysis?.urgency === 'CRITICAL' ? 'HIGH' :
                          aiResult.analysis?.urgency === 'HIGH' ? 'HIGH' : 'MEDIUM',
        aiConfidence: 0.7
      }
    });

    // Dodaj pierwsza wiadomosc AI - uzyj summary z nowego formatu
    const assistantMessage = aiResult.summary ||
      `Element przeanalizowany. Domyslna akcja: ${defaultOption.action || 'ZAPLANUJ'}.`;

    await prisma.flow_conversation_messages.create({
      data: {
        conversationId: newConversation.id,
        role: 'assistant',
        content: assistantMessage,
        metadata: {
          actionOptions,
          streamMatching,
          analysis: aiResult.analysis,
          elementType: aiResult.elementType,
          subType: aiResult.subType,
          confidence: aiResult.confidence,
          summary: aiResult.summary
        }
      }
    });

    // Pobierz pelna konwersacje
    const conversation = await getConversationWithMessages(newConversation.id);

    return res.json({
      success: true,
      data: conversation
    });

  } catch (error: any) {
    console.error('Flow conversation start error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// POST /:id/message - Wyslij wiadomosc
// =============================================================================
router.post('/:id/message', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Wiadomosc jest wymagana' });
    }

    // Sprawdz konwersacje
    const conversation = await prisma.flow_conversations.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
        status: 'ACTIVE'
      },
      include: {
        inboxItem: true
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Konwersacja nie znaleziona' });
    }

    // Dodaj wiadomosc usera
    await prisma.flow_conversation_messages.create({
      data: {
        conversationId: id,
        role: 'user',
        content: message
      }
    });

    // Pobierz historie wiadomosci
    const messages = await prisma.flow_conversation_messages.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' }
    });

    // Pobierz strumienie
    const streams = await prisma.stream.findMany({
      where: { organizationId: user.organizationId, status: 'ACTIVE' },
      select: { id: true, name: true }
    });

    // Generuj odpowiedz AI
    const aiRouter = await getAIRouter(user.organizationId);

    const systemPrompt = `Jestes asystentem Flow Engine. Kontynuujesz dialog o przetworzeniu elementu.

ELEMENT: ${conversation.inboxItem?.content || ''} ${conversation.inboxItem?.note || ''}

OBECNA PROPOZYCJA:
- Akcja: ${conversation.proposedAction}
- Tytul: ${conversation.proposedTaskTitle}
- Priorytet: ${conversation.proposedPriority}

DOSTEPNE STRUMIENIE: ${streams.map(s => s.name).join(', ')}

Odpowiedz w JSON:
{
  "assistantMessage": "Twoja odpowiedz",
  "updatedProposal": null lub { action, streamName, taskTitle, priority }
}`;

    const conversationHistory = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    const aiResponse = await aiRouter.processRequest({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ],
      config: { temperature: 0.4, maxTokens: 1000, responseFormat: 'json' }
    });

    let aiResult: any = {};
    try {
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      aiResult = { assistantMessage: aiResponse.content };
    }

    // Aktualizuj propozycje jesli zmieniona
    if (aiResult.updatedProposal) {
      const up = aiResult.updatedProposal;
      let newStreamId = conversation.proposedStreamId;
      if (up.streamName) {
        const matchedStream = streams.find(s =>
          s.name.toLowerCase() === up.streamName?.toLowerCase()
        );
        newStreamId = matchedStream?.id || newStreamId;
      }

      const actionMap: Record<string, FlowAction> = {
        'ZROB_TERAZ': 'ZROB_TERAZ',
        'ZAPLANUJ': 'ZAPLANUJ',
        'PROJEKT': 'PROJEKT',
        'KIEDYS_MOZE': 'KIEDYS_MOZE',
        'REFERENCJA': 'REFERENCJA',
        'USUN': 'USUN'
      };

      await prisma.flow_conversations.update({
        where: { id },
        data: {
          proposedAction: up.action ? actionMap[up.action] : undefined,
          proposedStreamId: newStreamId,
          proposedTaskTitle: up.taskTitle || undefined,
          proposedPriority: up.priority || undefined
        }
      });
    }

    // Dodaj odpowiedz AI
    await prisma.flow_conversation_messages.create({
      data: {
        conversationId: id,
        role: 'assistant',
        content: aiResult.assistantMessage || 'Rozumiem.',
        metadata: { updatedProposal: aiResult.updatedProposal }
      }
    });

    const updatedConversation = await getConversationWithMessages(id);

    return res.json({
      success: true,
      data: updatedConversation
    });

  } catch (error: any) {
    console.error('Flow conversation message error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// PUT /:id/modify - Modyfikuj propozycje
// =============================================================================
router.put('/:id/modify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      action, streamId, taskTitle, priority,
      // Stream creation
      createNewStream, newStreamName, newStreamColor,
      // Goal creation/linkage
      createNewGoal, newGoalName, linkedGoalId,
      // Project linkage
      linkedProjectId,
      // Tasks as first steps
      tasks,
      // Tags
      tags,
      // Dates
      dueDate, projectDeadline,
      // Reminder
      reminder
    } = req.body;
    const user = (req as any).user;

    // Will store created entities info
    let createdStream: { id: string; name: string } | null = null;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Pobierz konwersacje
    const current = await prisma.flow_conversations.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
        status: 'ACTIVE'
      }
    });

    if (!current) {
      return res.status(404).json({ error: 'Konwersacja nie znaleziona' });
    }

    const modifications: any[] = [];

    // Sledz zmiany
    if (action && action !== current.proposedAction) {
      modifications.push({ field: 'action', from: current.proposedAction, to: action, timestamp: new Date().toISOString() });
    }
    if (streamId && streamId !== current.proposedStreamId) {
      modifications.push({ field: 'streamId', from: current.proposedStreamId, to: streamId, timestamp: new Date().toISOString() });
    }
    if (taskTitle && taskTitle !== current.proposedTaskTitle) {
      modifications.push({ field: 'taskTitle', from: current.proposedTaskTitle, to: taskTitle, timestamp: new Date().toISOString() });
    }
    if (priority && priority !== current.proposedPriority) {
      modifications.push({ field: 'priority', from: current.proposedPriority, to: priority, timestamp: new Date().toISOString() });
    }

    const existingMods = (current.userModifications as any[]) || [];
    const allModifications = [...existingMods, ...modifications];

    const actionMap: Record<string, FlowAction> = {
      'ZROB_TERAZ': 'ZROB_TERAZ',
      'ZAPLANUJ': 'ZAPLANUJ',
      'PROJEKT': 'PROJEKT',
      'KIEDYS_MOZE': 'KIEDYS_MOZE',
      'REFERENCJA': 'REFERENCJA',
      'USUN': 'USUN'
    };

    // ==========================================================================
    // TWORZENIE NOWEGO STRUMIENIA (jeśli użytkownik wybrał tę opcję)
    // ==========================================================================
    let validatedStreamId: string | undefined = undefined;

    if (createNewStream && newStreamName && newStreamName.trim() !== '') {
      // Utwórz nowy strumień
      const newStream = await prisma.stream.create({
        data: {
          name: newStreamName.trim(),
          description: `Strumień utworzony podczas przetwarzania Flow`,
          color: newStreamColor || '#3B82F6',
          status: 'ACTIVE',
          streamType: 'PROJECT',
          horizonLevel: 1,
          pattern: 'project',
          organizationId: user.organizationId,
          createdById: user.id,
        }
      });

      validatedStreamId = newStream.id;
      createdStream = { id: newStream.id, name: newStream.name };
      console.log(`[FlowModify] Created new stream: ${newStream.id} - ${newStream.name}`);

      // Dodaj modyfikację dla nowego strumienia
      modifications.push({
        field: 'streamId',
        from: current.proposedStreamId,
        to: newStream.id,
        newStreamCreated: true,
        newStreamName: newStream.name,
        timestamp: new Date().toISOString()
      });
    }
    // Waliduj istniejący streamId przed zapisem - sprawdź czy istnieje
    else if (streamId && streamId.trim() !== '') {
      const streamExists = await prisma.stream.findFirst({
        where: {
          id: streamId,
          organizationId: user.organizationId
        }
      });
      if (streamExists) {
        validatedStreamId = streamId;
      } else {
        console.log(`Stream ${streamId} not found for org ${user.organizationId}, ignoring`);
      }
    }

    // Waliduj linkedProjectId (cel/goal nie istnieje w schemacie - pomijamy)
    let validatedProjectId: string | undefined = undefined;
    if (linkedProjectId && linkedProjectId.trim() !== '') {
      const projectExists = await prisma.project.findFirst({
        where: {
          id: linkedProjectId,
          organizationId: user.organizationId
        }
      });
      if (projectExists) {
        validatedProjectId = linkedProjectId;
      } else {
        console.log(`Project ${linkedProjectId} not found, ignoring`);
      }
    }

    // Aktualizuj konwersacje - zapisz wszystkie dane do pola userModifications
    const additionalData = {
      tasks: tasks || [],
      tags: tags || [],
      dueDate: dueDate || null,
      projectDeadline: projectDeadline || null,
      reminder: reminder || null,
      linkedProjectId: validatedProjectId || null
    };

    await prisma.flow_conversations.update({
      where: { id },
      data: {
        proposedAction: action ? actionMap[action] : undefined,
        proposedStreamId: validatedStreamId,
        proposedTaskTitle: taskTitle || undefined,
        proposedPriority: priority || undefined,
        userModifications: {
          modifications: allModifications,
          additionalData
        }
      }
    });

    // Dodaj wiadomosc o modyfikacji
    if (modifications.length > 0) {
      const modSummary = modifications.map(m => `${m.field}: "${m.from}" → "${m.to}"`).join(', ');
      await prisma.flow_conversation_messages.create({
        data: {
          conversationId: id,
          role: 'user',
          content: '[Modyfikacja] ' + modSummary,
          metadata: { type: 'modification', modifications }
        }
      });
    }

    const updatedConversation = await getConversationWithMessages(id);

    return res.json({
      success: true,
      data: updatedConversation,
      modificationsApplied: modifications.length,
      createdStream: createdStream || undefined
    });

  } catch (error: any) {
    console.error('Flow conversation modify error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// POST /:id/execute - Wykonaj akcje i ucz sie
// =============================================================================
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Pobierz konwersacje
    const conversation = await prisma.flow_conversations.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
        status: 'ACTIVE'
      },
      include: {
        inboxItem: true
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Konwersacja nie znaleziona' });
    }

    // Pobierz modyfikacje i dodatkowe dane
    const userMods = conversation.userModifications as any;
    const modifications = userMods?.modifications || userMods || [];
    const additionalData = userMods?.additionalData || {};

    // Wyciągnij wszystkie dane z additionalData
    const {
      tasks: firstStepTasks = [],
      tags = [],
      dueDate: additionalDueDate,
      projectDeadline,
      reminder,
      linkedProjectId
    } = additionalData;

    console.log('[FlowExecute] Additional data:', {
      tasksCount: firstStepTasks.length,
      tagsCount: tags.length,
      linkedProjectId,
      reminder
    });

    // Zakoncz konwersacje
    await prisma.flow_conversations.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        finalAction: conversation.proposedAction,
        finalStreamId: conversation.proposedStreamId,
        finalTaskTitle: conversation.proposedTaskTitle,
        finalPriority: conversation.proposedPriority,
        completedAt: new Date()
      }
    });

    // Zaktualizuj inbox item
    await prisma.inboxItem.update({
      where: { id: conversation.inboxItemId },
      data: {
        processed: true,
        flowStatus: 'PROCESSED',
        userDecision: conversation.proposedAction,
        processedAt: new Date(),
        streamId: conversation.proposedStreamId || undefined
      }
    });

    // ==========================================================================
    // TWORZENIE ENCJI NA PODSTAWIE AKCJI
    // ==========================================================================
    let createdEntity: any = null;
    const action = conversation.proposedAction;
    const taskTitle = conversation.proposedTaskTitle || conversation.inboxItem?.content?.slice(0, 100) || 'Nowe zadanie';
    const taskDescription = conversation.inboxItem?.content || '';

    // Map priority from string to enum
    const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
      'LOW': 'LOW',
      'MEDIUM': 'MEDIUM',
      'HIGH': 'HIGH',
      'URGENT': 'URGENT'
    };
    const priority = priorityMap[conversation.proposedPriority || 'MEDIUM'] || 'MEDIUM';

    if (action === 'ZROB_TERAZ' || action === 'ZAPLANUJ') {
      // Określ termin - użyj additionalDueDate
      const taskDueDate = additionalDueDate ? new Date(additionalDueDate) : undefined;

      // Utworz zadanie
      const newTask = await prisma.task.create({
        data: {
          title: taskTitle,
          description: taskDescription,
          priority: priority,
          status: action === 'ZROB_TERAZ' ? 'IN_PROGRESS' : 'NEW',
          streamId: conversation.proposedStreamId || undefined,
          projectId: linkedProjectId || undefined, // Powiązanie z projektem
          organizationId: user.organizationId,
          createdById: user.id,
          assignedToId: user.id,
          dueDate: taskDueDate
        }
      });

      // Loguj tagi (schemat nie wspiera bezpośredniego powiązania tagów z zadaniami)
      if (tags.length > 0) {
        console.log(`[FlowExecute] Suggested tags for task: ${tags.join(', ')} (tagi zapisane w logach)`);
      }

      createdEntity = { type: 'task', id: newTask.id, title: newTask.title, tags };
      console.log(`[FlowExecute] Created task: ${newTask.id} - ${newTask.title}`);
    }
    else if (action === 'PROJEKT') {
      // Określ deadline projektu
      const projectEndDate = projectDeadline ? new Date(projectDeadline) : undefined;

      // Utworz projekt
      const newProject = await prisma.project.create({
        data: {
          name: taskTitle,
          description: taskDescription,
          priority: priority,
          status: 'PLANNING',
          streamId: conversation.proposedStreamId || undefined,
          organizationId: user.organizationId,
          createdById: user.id,
          assignedToId: user.id,
          endDate: projectEndDate
        }
      });
      console.log(`[FlowExecute] Created project: ${newProject.id} - ${newProject.name}`);

      // Twórz zadania jako "pierwsze kroki"
      const createdTasks: any[] = [];
      if (firstStepTasks.length > 0) {
        for (let i = 0; i < firstStepTasks.length; i++) {
          const stepTask = firstStepTasks[i];
          if (!stepTask.title || stepTask.title.trim() === '') continue;

          const taskDueDate = stepTask.dueDate ? new Date(stepTask.dueDate) : undefined;

          const newStepTask = await prisma.task.create({
            data: {
              title: stepTask.title.trim(),
              description: `Pierwszy krok projektu: ${taskTitle}`,
              priority: 'MEDIUM',
              status: 'NEW',
              streamId: conversation.proposedStreamId || undefined,
              projectId: newProject.id, // Powiązanie z projektem
              organizationId: user.organizationId,
              createdById: user.id,
              assignedToId: user.id,
              dueDate: taskDueDate
            }
          });
          createdTasks.push({ id: newStepTask.id, title: newStepTask.title });
        }
        console.log(`[FlowExecute] Created ${createdTasks.length} first step tasks for project`);
      }

      // Loguj tagi (schemat nie wspiera bezpośredniego powiązania tagów z projektami)
      if (tags.length > 0) {
        console.log(`[FlowExecute] Suggested tags for project: ${tags.join(', ')} (tagi zapisane w logach)`);
      }

      createdEntity = {
        type: 'project',
        id: newProject.id,
        name: newProject.name,
        tasks: createdTasks,
        tags
      };
    }
    else if (action === 'KIEDYS_MOZE') {
      // Oblicz datę przypomnienia na podstawie wartości reminder
      let reminderInfo = '';
      if (reminder && reminder !== 'none') {
        const now = new Date();
        let reminderDate: Date;
        switch (reminder) {
          case '1m':
            reminderDate = new Date(now.setMonth(now.getMonth() + 1));
            reminderInfo = `za 1 miesiąc (${reminderDate.toISOString().split('T')[0]})`;
            break;
          case '3m':
            reminderDate = new Date(now.setMonth(now.getMonth() + 3));
            reminderInfo = `za 3 miesiące (${reminderDate.toISOString().split('T')[0]})`;
            break;
          case '6m':
            reminderDate = new Date(now.setMonth(now.getMonth() + 6));
            reminderInfo = `za 6 miesięcy (${reminderDate.toISOString().split('T')[0]})`;
            break;
          case '1y':
            reminderDate = new Date(now.setFullYear(now.getFullYear() + 1));
            reminderInfo = `za rok (${reminderDate.toISOString().split('T')[0]})`;
            break;
        }
      }

      // Zamroz element - aktualizuj inbox item ze statusem FROZEN
      // Zapisz info o przypomnieniu i tagach w aiReasoning (pole tekstowe)
      const frozenNote = [
        reminder && reminder !== 'none' ? `Przypomnienie: ${reminderInfo}` : null,
        tags.length > 0 ? `Tagi: ${tags.join(', ')}` : null
      ].filter(Boolean).join('. ');

      await prisma.inboxItem.update({
        where: { id: conversation.inboxItemId },
        data: {
          flowStatus: 'FROZEN',
          aiReasoning: frozenNote || undefined
        }
      });

      createdEntity = {
        type: 'frozen',
        inboxItemId: conversation.inboxItemId,
        reminder: reminderInfo,
        tags
      };
      console.log(`[FlowExecute] Frozen inbox item: ${conversation.inboxItemId}, reminder: ${reminder}`);
    }
    else if (action === 'REFERENCJA') {
      // Zapisz info o tagach w aiReasoning (pole tekstowe)
      const referenceNote = tags.length > 0 ? `Tagi: ${tags.join(', ')}` : undefined;

      // Zapisz jako material referencyjny - aktualizuj inbox item
      await prisma.inboxItem.update({
        where: { id: conversation.inboxItemId },
        data: {
          flowStatus: 'REFERENCE',
          aiReasoning: referenceNote
        }
      });

      createdEntity = { type: 'reference', inboxItemId: conversation.inboxItemId, tags };
      console.log(`[FlowExecute] Marked as reference: ${conversation.inboxItemId}`);
    }
    else if (action === 'USUN') {
      // Usun element - soft delete przez status DELETED
      await prisma.inboxItem.update({
        where: { id: conversation.inboxItemId },
        data: {
          flowStatus: 'DELETED'
        }
      });
      createdEntity = { type: 'deleted', inboxItemId: conversation.inboxItemId };
      console.log(`[FlowExecute] Soft deleted: ${conversation.inboxItemId}`);
    }

    // UCZENIE SIE Z MODYFIKACJI
    if (modifications.length > 0) {
      console.log(`[FlowLearning] Learning from ${modifications.length} modifications`);

      for (const mod of modifications) {
        if (mod.field === 'action') {
          const contentPattern = extractContentPattern(conversation.inboxItem?.content || '');

          // Sprawdz istniejacy wzorzec
          const existingPattern = await prisma.flow_learned_patterns.findFirst({
            where: {
              organizationId: user.organizationId,
              contentPattern: { contains: contentPattern },
              isActive: true
            }
          });

          const actionMap: Record<string, FlowAction> = {
            'ZROB_TERAZ': 'ZROB_TERAZ',
            'ZAPLANUJ': 'ZAPLANUJ',
            'PROJEKT': 'PROJEKT',
            'KIEDYS_MOZE': 'KIEDYS_MOZE',
            'REFERENCJA': 'REFERENCJA',
            'USUN': 'USUN'
          };

          // Pobierz elementType z inboxItem lub użyj 'OTHER' jako fallback
          const elementType = (conversation.inboxItem?.elementType as any) || 'OTHER';

          if (existingPattern) {
            await prisma.flow_learned_patterns.update({
              where: { id: existingPattern.id },
              data: {
                learnedAction: actionMap[mod.to] || 'ZAPLANUJ',
                occurrences: { increment: 1 },
                confidence: Math.min(0.95, existingPattern.confidence + 0.05),
                lastUsedAt: new Date()
              }
            });
          } else {
            await prisma.flow_learned_patterns.create({
              data: {
                organizationId: user.organizationId,
                userId: user.id,
                elementType: elementType,
                contentPattern: contentPattern,
                learnedAction: actionMap[mod.to] || 'ZAPLANUJ',
                confidence: 0.6,
                occurrences: 1,
                isActive: true,
                lastUsedAt: new Date()
              }
            });
          }
        }

        // Ucz sie tez ze zmian strumienia
        if (mod.field === 'streamId' && mod.to) {
          // Waliduj czy stream istnieje przed zapisem wzorca
          const streamExists = await prisma.stream.findFirst({
            where: { id: mod.to, organizationId: user.organizationId }
          });

          if (!streamExists) {
            console.log(`Stream ${mod.to} not found, skipping pattern learning`);
            continue;
          }

          const contentPattern = extractContentPattern(conversation.inboxItem?.content || '');
          const elementType = (conversation.inboxItem?.elementType as any) || 'OTHER';

          const existingStreamPattern = await prisma.flow_learned_patterns.findFirst({
            where: {
              organizationId: user.organizationId,
              contentPattern: { contains: contentPattern },
              learnedStreamId: mod.to,
              isActive: true
            }
          });

          if (existingStreamPattern) {
            await prisma.flow_learned_patterns.update({
              where: { id: existingStreamPattern.id },
              data: {
                occurrences: { increment: 1 },
                confidence: Math.min(0.95, existingStreamPattern.confidence + 0.05),
                lastUsedAt: new Date()
              }
            });
          } else {
            await prisma.flow_learned_patterns.create({
              data: {
                organizationId: user.organizationId,
                userId: user.id,
                elementType: elementType,
                contentPattern: contentPattern,
                learnedAction: 'ZAPLANUJ',
                learnedStreamId: mod.to,
                confidence: 0.6,
                occurrences: 1,
                isActive: true,
                lastUsedAt: new Date()
              }
            });
          }
        }
      }
    }

    return res.json({
      success: true,
      message: 'Akcja wykonana pomyslnie',
      data: {
        status: 'COMPLETED',
        finalAction: conversation.proposedAction,
        action: conversation.proposedAction,
        streamId: conversation.proposedStreamId,
        taskTitle: conversation.proposedTaskTitle,
        learnedFromModifications: modifications.length,
        createdEntity
      }
    });

  } catch (error: any) {
    console.error('Flow conversation execute error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getConversationWithMessages(conversationId: string, organizationId?: string) {
  const whereClause: any = { id: conversationId };
  if (organizationId) {
    whereClause.organizationId = organizationId;
  }

  const conv = await prisma.flow_conversations.findFirst({
    where: whereClause,
    include: {
      inboxItem: {
        select: { content: true, note: true, sourceType: true }
      },
      proposedStream: {
        select: { name: true }
      },
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!conv) {
    return null;
  }

  return {
    ...conv,
    item_content: conv.inboxItem?.content,
    item_note: conv.inboxItem?.note,
    source_type: conv.inboxItem?.sourceType,
    stream_name: conv.proposedStream?.name,
    proposed_action: conv.proposedAction,
    proposed_stream_id: conv.proposedStreamId,
    proposed_task_title: conv.proposedTaskTitle,
    proposed_priority: conv.proposedPriority,
    user_modifications: conv.userModifications
  };
}

function extractContentPattern(content: string): string {
  if (!content) return '';
  const stopWords = ['i', 'a', 'w', 'z', 'do', 'na', 'to', 'ze', 'o', 'sie', 'jest'];
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.includes(w))
    .slice(0, 5);
  return words.join(' ');
}

export default router;
