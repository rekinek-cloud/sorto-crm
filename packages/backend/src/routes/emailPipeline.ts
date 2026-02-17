/**
 * Email Pipeline API Routes
 *
 * Endpointy do zarządzania pipeline przetwarzania maili
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../shared/middleware/auth';
import { RuleProcessingPipeline } from '../services/ai/RuleProcessingPipeline';

const router = Router();

// GET /api/v1/email-pipeline/stats - Statystyki pipeline
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const days = parseInt(req.query.days as string) || 7;

    // Pobierz statystyki z bazy
    const since = new Date();
    since.setDate(since.getDate() - days);

    const msgWhere = { organizationId, receivedAt: { gte: since } };

    const [
      totalMessages,
      pipelineProcessed,
      spamRejected,
      aiAnalyzed,
      messagesByPriority,
      messagesByCategory
    ] = await Promise.all([
      prisma.message.count({ where: msgWhere }),
      prisma.message.count({ where: { ...msgWhere, pipelineProcessed: true } }),
      prisma.message.count({ where: { ...msgWhere, isSpam: true } }),
      prisma.message.count({ where: { ...msgWhere, aiAnalyzed: true } }),
      prisma.message.groupBy({
        by: ['priority'],
        where: msgWhere,
        _count: true
      }),
      prisma.message.groupBy({
        by: ['category'],
        where: { ...msgWhere, category: { not: null } },
        _count: true
      })
    ]);

    const skippedAI = pipelineProcessed - aiAnalyzed;
    const aiSavingsPercent = totalMessages > 0
      ? Math.round((1 - aiAnalyzed / Math.max(1, totalMessages)) * 100)
      : 0;

    return res.json({
      success: true,
      data: {
        period: `${days} days`,
        summary: {
          totalMessages,
          spamRejected,
          skippedAI: Math.max(0, skippedAI),
          aiAnalyzed,
          pipelineProcessed,
          aiSavingsPercent
        },
        byCategory: messagesByCategory.reduce((acc, item) => {
          if (item.category) acc[item.category] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byPriority: messagesByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error fetching pipeline stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch pipeline stats' });
  }
});

// GET /api/v1/email-pipeline/rules - Lista reguł pipeline
router.get('/rules', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const stage = req.query.stage as string;

    const where: any = {
      organizationId,
      ruleType: 'EMAIL_FILTER'
    };

    if (stage) {
      where.category = stage;
    }

    const rules = await prisma.unified_rules.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { priority: 'desc' }
      ]
    });

    // Grupuj po stage
    const grouped = {
      PRE_FILTER: rules.filter(r => r.category === 'PRE_FILTER'),
      CLASSIFY: rules.filter(r => r.category === 'CLASSIFY'),
      AI_ANALYSIS: rules.filter(r => r.category === 'AI_ANALYSIS')
    };

    return res.json({
      success: true,
      data: {
        rules,
        grouped,
        stages: [
          { id: 'PRE_FILTER', name: 'Pre-Filter', description: 'Szybkie reguły bez AI (blacklist, spam)', count: grouped.PRE_FILTER.length },
          { id: 'CLASSIFY', name: 'Klasyfikacja', description: 'Kategoryzacja i decyzja czy uruchomić AI', count: grouped.CLASSIFY.length },
          { id: 'AI_ANALYSIS', name: 'Analiza AI', description: 'Reguły uruchamiane po analizie AI', count: grouped.AI_ANALYSIS.length }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching pipeline rules:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch pipeline rules' });
  }
});

// POST /api/v1/email-pipeline/rules - Utwórz regułę pipeline
router.post('/rules', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { name, description, stage, priority, conditions, actions, stopProcessing } = req.body;

    if (!name || !stage) {
      return res.status(400).json({ success: false, error: 'Name and stage are required' });
    }

    const validStages = ['PRE_FILTER', 'CLASSIFY', 'AI_ANALYSIS'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ success: false, error: 'Invalid stage' });
    }

    const rule = await prisma.unified_rules.create({
      data: {
        name,
        description: description || '',
        ruleType: 'EMAIL_FILTER',
        category: stage,
        priority: priority || 50,
        triggerType: 'EVENT_BASED',
        conditions: { rules: conditions || [] },
        actions: { actions: actions || [], stopProcessing: stopProcessing || false },
        status: 'ACTIVE',
        organizationId
      } as any
    });

    return res.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error creating pipeline rule:', error);
    return res.status(500).json({ success: false, error: 'Failed to create pipeline rule' });
  }
});

// PUT /api/v1/email-pipeline/rules/:id - Aktualizuj regułę
router.put('/rules/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;
    const { name, description, stage, priority, conditions, actions, stopProcessing, status } = req.body;

    const existing = await prisma.unified_rules.findFirst({
      where: { id, organizationId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    const rule = await prisma.unified_rules.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(stage && { category: stage }),
        ...(priority !== undefined && { priority }),
        ...(conditions && { conditions: { rules: conditions } }),
        ...(actions && { actions: { actions, stopProcessing: stopProcessing || false } }),
        ...(status && { status })
      }
    });

    return res.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error updating pipeline rule:', error);
    return res.status(500).json({ success: false, error: 'Failed to update pipeline rule' });
  }
});

// DELETE /api/v1/email-pipeline/rules/:id - Usuń regułę
router.delete('/rules/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const existing = await prisma.unified_rules.findFirst({
      where: { id, organizationId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    await prisma.unified_rules.delete({ where: { id } });

    return res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting pipeline rule:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete pipeline rule' });
  }
});

// POST /api/v1/email-pipeline/test - Testuj pipeline na przykładowym mailu
router.post('/test', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { from, subject, body } = req.body;

    if (!from || !subject) {
      return res.status(400).json({ success: false, error: 'From and subject are required' });
    }

    const testId = 'test-' + Date.now();
    const rulePipeline = new RuleProcessingPipeline(prisma);
    const result = await rulePipeline.processEntity(
      organizationId,
      'EMAIL',
      testId,
      {
        from,
        subject,
        body: body || '',
        senderName: from,
      }
    );

    return res.json({
      success: true,
      data: {
        result: {
          classification: result.finalClass,
          confidence: result.finalConfidence,
          sentiment: result.sentiment,
          urgencyScore: result.urgencyScore,
          actionsExecuted: result.actionsExecuted,
          linkedEntities: result.linkedEntities,
        },
        explanation: {
          isSpam: result.finalClass === 'SPAM',
          category: result.finalClass,
          confidence: result.finalConfidence,
          crmMatch: result.stages.crmCheck.matched,
          listMatch: result.stages.listCheck.matched,
          patternMatch: result.stages.patternCheck.matched,
          ruleMatch: result.stages.ruleMatch?.matched || false,
          aiUsed: !!result.stages.aiClassification,
          actionsExecuted: result.actionsExecuted,
        }
      }
    });
  } catch (error) {
    console.error('Error testing pipeline:', error);
    return res.status(500).json({ success: false, error: 'Failed to test pipeline' });
  }
});

// POST /api/v1/email-pipeline/seed-defaults - Utwórz domyślne reguły
router.post('/seed-defaults', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;

    // Sprawdź czy już są reguły
    const existingCount = await prisma.unified_rules.count({
      where: { organizationId, ruleType: 'EMAIL_FILTER' }
    });

    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `Already have ${existingCount} pipeline rules`,
        created: 0
      });
    }

    // Domyślne reguły
    const defaultRules = [
      // PRE_FILTER
      {
        name: 'Blacklist - Domeny spamowe',
        description: 'Blokuj emaile z popularnych domen spamowych',
        category: 'PRE_FILTER',
        priority: 100,
        conditions: { rules: [{ field: 'fromDomain', operator: 'in', value: ['spam.com', 'marketing-spam.net', 'promo-deals.biz'] }] },
        actions: { actions: [{ type: 'REJECT' }], stopProcessing: true }
      },
      {
        name: 'Blokuj cold emails',
        description: 'Odrzuć zimne maile od nieznanych nadawców z typowymi frazami',
        category: 'PRE_FILTER',
        priority: 90,
        conditions: { rules: [
          { field: 'isExistingContact', operator: 'equals', value: false },
          { field: 'subject', operator: 'contains', value: ['quick question', 'partnership opportunity', 'business proposal', 'increase your sales'] }
        ]},
        actions: { actions: [{ type: 'REJECT' }], stopProcessing: true }
      },
      // CLASSIFY
      {
        name: 'VIP - Istniejący klienci',
        description: 'Wysokii priorytet dla kontaktów z aktywnymi dealami',
        category: 'CLASSIFY',
        priority: 100,
        conditions: { rules: [{ field: 'isVIP', operator: 'equals', value: true }] },
        actions: { actions: [{ type: 'SET_PRIORITY', value: 'URGENT' }, { type: 'SET_CATEGORY', value: 'VIP' }], stopProcessing: false }
      },
      {
        name: 'Newsletter - Skip AI',
        description: 'Newslettery nie wymagają analizy AI',
        category: 'CLASSIFY',
        priority: 80,
        conditions: { rules: [{ field: 'subject', operator: 'contains', value: ['newsletter', 'weekly digest', 'monthly update', 'unsubscribe'] }] },
        actions: { actions: [{ type: 'SET_CATEGORY', value: 'NEWSLETTER' }, { type: 'SKIP_AI' }], stopProcessing: false }
      },
      {
        name: 'Faktury - Wysoki priorytet',
        description: 'Faktury zawsze ważne',
        category: 'CLASSIFY',
        priority: 85,
        conditions: { rules: [{ field: 'subject', operator: 'contains', value: ['faktura', 'invoice', 'rachunek', 'payment due', 'płatność'] }] },
        actions: { actions: [{ type: 'SET_CATEGORY', value: 'INVOICE' }, { type: 'SET_PRIORITY', value: 'HIGH' }], stopProcessing: false }
      },
      // AI_ANALYSIS
      {
        name: 'Negatywny sentiment - Alert',
        description: 'Powiadom gdy AI wykryje negatywny sentyment',
        category: 'AI_ANALYSIS',
        priority: 90,
        conditions: { rules: [{ field: 'ai.sentiment', operator: 'equals', value: 'NEGATIVE' }] },
        actions: { actions: [{ type: 'NOTIFY', value: { message: 'Negatywny email wymaga uwagi' } }, { type: 'SET_PRIORITY', value: 'HIGH' }], stopProcessing: false }
      },
      {
        name: 'Pilne - Utwórz zadanie',
        description: 'Automatycznie utwórz zadanie dla pilnych maili',
        category: 'AI_ANALYSIS',
        priority: 85,
        conditions: { rules: [{ field: 'ai.urgency', operator: 'gte', value: 70 }] },
        actions: { actions: [{ type: 'CREATE_TASK', value: { title: 'Odpowiedz na pilny email' } }], stopProcessing: false }
      }
    ];

    // Utwórz reguły
    for (const rule of defaultRules) {
      await prisma.unified_rules.create({
        data: {
          name: rule.name,
          description: rule.description,
          ruleType: 'EMAIL_FILTER',
          category: rule.category,
          priority: rule.priority,
          triggerType: 'EVENT_BASED',
          conditions: rule.conditions,
          actions: rule.actions,
          status: 'ACTIVE',
          organizationId
        } as any
      });
    }

    return res.json({
      success: true,
      message: `Created ${defaultRules.length} default pipeline rules`,
      created: defaultRules.length
    });
  } catch (error) {
    console.error('Error seeding default rules:', error);
    return res.status(500).json({ success: false, error: 'Failed to seed default rules' });
  }
});

// GET /api/v1/email-pipeline/messages - Lista maili do przetworzenia
router.get('/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const filter = req.query.filter as string || 'all'; // all, unprocessed, processed
    const classification = req.query.classification as string; // BUSINESS, NEWSLETTER, SPAM, etc.
    const sortBy = req.query.sortBy as string || 'receivedAt';
    const sortDir = (req.query.sortDir as string || 'desc') === 'asc' ? 'asc' : 'desc';
    const search = req.query.search as string;

    const where: any = { organizationId };

    if (filter === 'unprocessed') {
      where.pipelineProcessed = false;
    } else if (filter === 'processed') {
      where.pipelineProcessed = true;
    }

    if (classification) {
      where.category = classification;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { fromAddress: { contains: search, mode: 'insensitive' } },
        { fromName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const validSortFields: Record<string, string> = {
      receivedAt: 'receivedAt',
      fromAddress: 'fromAddress',
      subject: 'subject',
      category: 'category',
      priority: 'priority',
    };
    const orderByField = validSortFields[sortBy] || 'receivedAt';
    const orderBy: any = { [orderByField]: sortDir };

    const [messages, total, statsData] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          subject: true,
          fromAddress: true,
          fromName: true,
          receivedAt: true,
          pipelineProcessed: true,
          isSpam: true,
          category: true,
          priority: true,
          aiAnalyzed: true,
          sentiment: true,
          pipelineResult: true,
        }
      }),
      prisma.message.count({ where }),
      Promise.all([
        prisma.message.count({ where: { organizationId } }),
        prisma.message.count({ where: { organizationId, pipelineProcessed: false } }),
        prisma.message.count({ where: { organizationId, pipelineProcessed: true } }),
        prisma.message.groupBy({
          by: ['category'],
          where: { organizationId, category: { not: null } },
          _count: true,
        }),
      ]),
    ]);

    const [totalAll, unprocessed, processed, byCategory] = statsData;

    return res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total: totalAll,
          unprocessed,
          processed,
        },
        categoryCounts: byCategory.reduce((acc, item) => {
          if (item.category) acc[item.category] = item._count;
          return acc;
        }, {} as Record<string, number>),
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// POST /api/v1/email-pipeline/process-batch - Przetwórz wybrane maile
router.post('/process-batch', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ success: false, error: 'messageIds array is required' });
    }

    if (messageIds.length > 100) {
      return res.status(400).json({ success: false, error: 'Maximum 100 messages per batch' });
    }

    const messages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        organizationId
      }
    });

    const results = [];
    const rulePipeline = new RuleProcessingPipeline(prisma);

    for (const message of messages) {
      try {
        const result = await rulePipeline.processEntity(
          organizationId,
          'EMAIL',
          message.id,
          {
            from: message.fromAddress || '',
            fromName: message.fromName || '',
            subject: message.subject || '',
            body: message.content || '',
            bodyHtml: message.htmlContent || '',
            senderName: message.fromName || '',
          }
        );

        const updateData: any = {
          pipelineProcessed: true,
          aiAnalyzed: true,
          category: result.finalClass,
          isSpam: result.finalClass === 'SPAM',
        };

        const ruleActions = result.stages?.ruleMatch?.actions;
        if (ruleActions?.setPriority) {
          updateData.priority = ruleActions.setPriority;
        } else if (result.finalClass === 'BUSINESS' && result.finalConfidence > 0.8) {
          updateData.priority = 'HIGH';
        }

        if (result.sentiment) updateData.sentiment = result.sentiment;
        if (result.urgencyScore) updateData.urgencyScore = result.urgencyScore;

        updateData.pipelineResult = {
          classification: result.finalClass,
          confidence: result.finalConfidence,
          actionsExecuted: result.actionsExecuted,
          linkedEntities: result.linkedEntities,
          addedToRag: result.actionsExecuted?.includes('ADDED_TO_RAG'),
          addedToFlow: result.actionsExecuted?.includes('ADDED_TO_FLOW'),
        };

        await prisma.message.update({
          where: { id: message.id },
          data: updateData,
        });

        results.push({
          id: message.id,
          subject: message.subject,
          success: true,
          result: {
            isSpam: result.finalClass === 'SPAM',
            category: result.finalClass,
            priority: updateData.priority,
            classification: result.finalClass,
            confidence: result.finalConfidence,
            sentiment: result.sentiment,
            urgencyScore: result.urgencyScore,
            addedToRag: result.actionsExecuted?.includes('ADDED_TO_RAG'),
            addedToFlow: result.actionsExecuted?.includes('ADDED_TO_FLOW'),
          }
        });
      } catch (err: any) {
        results.push({
          id: message.id,
          subject: message.subject,
          success: false,
          error: err.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return res.json({
      success: true,
      data: {
        processed: successful,
        failed,
        results
      }
    });
  } catch (error) {
    console.error('Error processing batch:', error);
    return res.status(500).json({ success: false, error: 'Failed to process batch' });
  }
});

// POST /api/v1/email-pipeline/process-all - Przetwórz wszystkie nieprzetworzne maile
router.post('/process-all', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const limit = Math.min(parseInt(req.body.limit as string) || 500, 1000);
    const unprocessedMessages = await prisma.message.findMany({
      where: {
        organizationId,
        pipelineProcessed: false
      },
      orderBy: { receivedAt: 'desc' },
      take: limit
    });

    if (unprocessedMessages.length === 0) {
      return res.json({
        success: true,
        data: {
          processed: 0,
          message: 'No unprocessed messages found'
        }
      });
    }

    const startTime = Date.now();
    let processed = 0;
    let spam = 0;
    const errors: string[] = [];
    const categoryStats: Record<string, number> = {};
    const rulePipeline = new RuleProcessingPipeline(prisma);

    for (const message of unprocessedMessages) {
      try {
        const result = await rulePipeline.processEntity(
          organizationId,
          'EMAIL',
          message.id,
          {
            from: message.fromAddress || '',
            fromName: message.fromName || '',
            subject: message.subject || '',
            body: message.content || '',
            bodyHtml: message.htmlContent || '',
            senderName: message.fromName || '',
          }
        );

        const updateData: any = {
          pipelineProcessed: true,
          aiAnalyzed: true,
          category: result.finalClass,
          isSpam: result.finalClass === 'SPAM',
        };

        const ruleActions = result.stages?.ruleMatch?.actions;
        if (ruleActions?.setPriority) {
          updateData.priority = ruleActions.setPriority;
        } else if (result.finalClass === 'BUSINESS' && result.finalConfidence > 0.8) {
          updateData.priority = 'HIGH';
        }

        if (result.sentiment) updateData.sentiment = result.sentiment;
        if (result.urgencyScore) updateData.urgencyScore = result.urgencyScore;

        updateData.pipelineResult = {
          classification: result.finalClass,
          confidence: result.finalConfidence,
          actionsExecuted: result.actionsExecuted,
          linkedEntities: result.linkedEntities,
          addedToRag: result.actionsExecuted?.includes('ADDED_TO_RAG'),
          addedToFlow: result.actionsExecuted?.includes('ADDED_TO_FLOW'),
        };

        await prisma.message.update({
          where: { id: message.id },
          data: updateData,
        });

        processed++;
        if (result.finalClass === 'SPAM') spam++;
        categoryStats[result.finalClass] = (categoryStats[result.finalClass] || 0) + 1;
      } catch (err: any) {
        errors.push(`${message.id}: ${err.message}`);
      }
    }

    const processingTime = Date.now() - startTime;

    return res.json({
      success: true,
      data: {
        processed,
        total: unprocessedMessages.length,
        spam,
        categoryStats,
        processingTimeMs: processingTime,
        avgTimePerMessage: processed > 0 ? Math.round(processingTime / processed) : 0,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        remaining: await prisma.message.count({
          where: { organizationId, pipelineProcessed: false }
        })
      }
    });
  } catch (error) {
    console.error('Error processing all messages:', error);
    return res.status(500).json({ success: false, error: 'Failed to process messages' });
  }
});

// POST /api/v1/email-pipeline/reprocess - Przetwórz ponownie (np. po zmianie reguł)
router.post('/reprocess', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { filter, limit: reqLimit } = req.body;
    const limit = Math.min(reqLimit || 200, 500);

    const where: any = { organizationId, pipelineProcessed: true };

    // Filtry do ponownego przetworzenia
    if (filter === 'spam') {
      where.isSpam = true;
    } else if (filter === 'no-category') {
      where.category = null;
    } else if (filter === 'no-ai') {
      where.aiAnalyzed = false;
    }

    // Reset flagi pipelineProcessed
    const updated = await prisma.message.updateMany({
      where,
      data: { pipelineProcessed: false }
    });

    return res.json({
      success: true,
      data: {
        reset: updated.count,
        message: `Reset ${updated.count} messages for reprocessing. Run process-all to reprocess them.`
      }
    });
  } catch (error) {
    console.error('Error resetting messages:', error);
    return res.status(500).json({ success: false, error: 'Failed to reset messages' });
  }
});

// POST /api/v1/email-pipeline/analyze/:messageId - Ręczna analiza pojedynczej wiadomości
router.post('/analyze/:messageId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { messageId } = req.params;

    // Pobierz wiadomość
    const message = await prisma.message.findFirst({
      where: { id: messageId, organizationId },
      include: {
        channel: true,
        contact: true,
        company: true,
      }
    });

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Przygotuj dane do pipeline
    const entityData = {
      subject: message.subject || '',
      body: message.content || '',
      bodyHtml: message.htmlContent || '',
      from: message.fromAddress || '',
    };

    // Uruchom pipeline
    const pipeline = new RuleProcessingPipeline(prisma);
    const result = await pipeline.processEntity(
      organizationId,
      'EMAIL',
      messageId,
      entityData
    );

    // Zaktualizuj wiadomość wynikami
    const updateData: Record<string, any> = {
      pipelineProcessed: true,
      aiAnalyzed: true,
    };

    if (result.finalClass) {
      updateData.category = result.finalClass;
    }

    await prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });

    // Pobierz data_processing z wynikami analizy
    const dpRecord = await prisma.data_processing.findFirst({
      where: { entityId: messageId, organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: {
        classification: result.finalClass,
        confidence: result.finalConfidence,
        actionsExecuted: result.actionsExecuted || [],
        linkedEntities: result.linkedEntities || {},
        entitiesCreated: dpRecord?.aiExtraction
          ? (dpRecord.aiExtraction as any).entitiesCreated || []
          : [],
        analysis: dpRecord?.aiExtraction
          ? (dpRecord.aiExtraction as any).postClassificationAnalysis || null
          : null,
      }
    });
  } catch (error) {
    console.error('Error analyzing message:', error);
    return res.status(500).json({ success: false, error: 'Failed to analyze message' });
  }
});

export default router;
