/**
 * Email Pipeline API Routes
 *
 * Endpointy do zarządzania pipeline przetwarzania maili
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../shared/middleware/auth';
import { emailPipeline } from '../services/emailPipeline';

const router = Router();

// GET /api/v1/email-pipeline/stats - Statystyki pipeline
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const days = parseInt(req.query.days as string) || 7;

    // Pobierz statystyki z bazy
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      totalMessages,
      messagesByPriority
    ] = await Promise.all([
      prisma.message.count({
        where: { organizationId, receivedAt: { gte: since } }
      }),
      prisma.message.groupBy({
        by: ['priority'],
        where: { organizationId, receivedAt: { gte: since } },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        summary: {
          totalMessages,
          spamRejected: 0,
          skippedAI: 0,
          aiAnalyzed: 0,
          pipelineProcessed: 0,
          aiSavingsPercent: 0
        },
        byCategory: {},
        byPriority: messagesByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error fetching pipeline stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pipeline stats' });
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

    res.json({
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
    res.status(500).json({ success: false, error: 'Failed to fetch pipeline rules' });
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
      }
    });

    res.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error creating pipeline rule:', error);
    res.status(500).json({ success: false, error: 'Failed to create pipeline rule' });
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

    res.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error updating pipeline rule:', error);
    res.status(500).json({ success: false, error: 'Failed to update pipeline rule' });
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

    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting pipeline rule:', error);
    res.status(500).json({ success: false, error: 'Failed to delete pipeline rule' });
  }
});

// POST /api/v1/email-pipeline/test - Testuj regułę na przykładowym mailu
router.post('/test', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { from, subject, body } = req.body;

    if (!from || !subject) {
      return res.status(400).json({ success: false, error: 'From and subject are required' });
    }

    const testMessage = {
      id: 'test-' + Date.now(),
      from,
      to: 'test@example.com',
      subject,
      body: body || '',
      date: new Date(),
      channelId: 'test'
    };

    const result = await emailPipeline.processEmail(testMessage, organizationId);

    res.json({
      success: true,
      data: {
        result,
        explanation: {
          stage: result.stage,
          action: result.action,
          isSpam: result.isSpam,
          skipAI: result.skipAI,
          category: result.category,
          priority: result.priority,
          rulesExecuted: result.rulesExecuted,
          wouldRunAI: !result.skipAI && !result.isSpam,
          processingTimeMs: result.processingTimeMs
        }
      }
    });
  } catch (error) {
    console.error('Error testing pipeline:', error);
    res.status(500).json({ success: false, error: 'Failed to test pipeline' });
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
        }
      });
    }

    res.json({
      success: true,
      message: `Created ${defaultRules.length} default pipeline rules`,
      created: defaultRules.length
    });
  } catch (error) {
    console.error('Error seeding default rules:', error);
    res.status(500).json({ success: false, error: 'Failed to seed default rules' });
  }
});

// GET /api/v1/email-pipeline/messages - Lista maili do przetworzenia
router.get('/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const filter = req.query.filter as string || 'all'; // all, unprocessed, processed

    const where: any = { organizationId };

    if (filter === 'unprocessed') {
      where.pipelineProcessed = false;
    } else if (filter === 'processed') {
      where.pipelineProcessed = true;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
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
        }
      }),
      prisma.message.count({ where })
    ]);

    res.json({
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
          total: await prisma.message.count({ where: { organizationId } }),
          unprocessed: await prisma.message.count({ where: { organizationId, pipelineProcessed: false } }),
          processed: await prisma.message.count({ where: { organizationId, pipelineProcessed: true } }),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
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
    for (const message of messages) {
      try {
        const pipelineMessage = {
          id: message.id,
          from: message.fromAddress || '',
          fromName: message.fromName || undefined,
          to: message.toAddress || '',
          subject: message.subject || '',
          body: message.content || '',
          html: message.htmlContent || undefined,
          date: message.receivedAt || new Date(),
          channelId: message.channelId
        };

        const pipelineResult = await emailPipeline.processEmail(pipelineMessage, organizationId);

        await prisma.message.update({
          where: { id: message.id },
          data: {
            priority: pipelineResult.priority,
            category: pipelineResult.category || 'INBOX',
            isSpam: pipelineResult.isSpam,
            pipelineProcessed: true,
            pipelineResult: pipelineResult as any,
            aiAnalyzed: !pipelineResult.skipAI && !!pipelineResult.aiAnalysis,
            sentiment: pipelineResult.aiAnalysis?.sentiment,
            urgencyScore: pipelineResult.aiAnalysis?.urgency
          }
        });

        results.push({
          id: message.id,
          subject: message.subject,
          success: true,
          result: {
            isSpam: pipelineResult.isSpam,
            category: pipelineResult.category,
            priority: pipelineResult.priority,
            skipAI: pipelineResult.skipAI,
            stage: pipelineResult.stage
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

    res.json({
      success: true,
      data: {
        processed: successful,
        failed,
        results
      }
    });
  } catch (error) {
    console.error('Error processing batch:', error);
    res.status(500).json({ success: false, error: 'Failed to process batch' });
  }
});

// POST /api/v1/email-pipeline/process-all - Przetwórz wszystkie nieprzetworzne maile
router.post('/process-all', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const limit = Math.min(parseInt(req.body.limit as string) || 500, 1000);
    const skipAI = req.body.skipAI === true; // Opcja: pomiń analizę AI dla szybszego przetwarzania

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
    let skippedAI = 0;
    let aiAnalyzed = 0;
    const errors: string[] = [];
    const categoryStats: Record<string, number> = {};

    for (const message of unprocessedMessages) {
      try {
        const pipelineMessage = {
          id: message.id,
          from: message.fromAddress || '',
          fromName: message.fromName || undefined,
          to: message.toAddress || '',
          subject: message.subject || '',
          body: message.content || '',
          html: message.htmlContent || undefined,
          date: message.receivedAt || new Date(),
          channelId: message.channelId
        };

        const pipelineResult = await emailPipeline.processEmail(pipelineMessage, organizationId, skipAI);

        await prisma.message.update({
          where: { id: message.id },
          data: {
            priority: pipelineResult.priority,
            category: pipelineResult.category || 'INBOX',
            isSpam: pipelineResult.isSpam,
            pipelineProcessed: true,
            pipelineResult: pipelineResult as any,
            aiAnalyzed: !pipelineResult.skipAI && !!pipelineResult.aiAnalysis,
            sentiment: pipelineResult.aiAnalysis?.sentiment,
            urgencyScore: pipelineResult.aiAnalysis?.urgency
          }
        });

        processed++;
        if (pipelineResult.isSpam) spam++;
        if (pipelineResult.skipAI) skippedAI++;
        if (pipelineResult.aiAnalysis) aiAnalyzed++;

        const cat = pipelineResult.category || 'INBOX';
        categoryStats[cat] = (categoryStats[cat] || 0) + 1;
      } catch (err: any) {
        errors.push(`${message.id}: ${err.message}`);
      }
    }

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        processed,
        total: unprocessedMessages.length,
        spam,
        skippedAI,
        aiAnalyzed,
        categoryStats,
        processingTimeMs: processingTime,
        avgTimePerMessage: Math.round(processingTime / processed),
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        remaining: await prisma.message.count({
          where: { organizationId, pipelineProcessed: false }
        })
      }
    });
  } catch (error) {
    console.error('Error processing all messages:', error);
    res.status(500).json({ success: false, error: 'Failed to process messages' });
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

    res.json({
      success: true,
      data: {
        reset: updated.count,
        message: `Reset ${updated.count} messages for reprocessing. Run process-all to reprocess them.`
      }
    });
  } catch (error) {
    console.error('Error resetting messages:', error);
    res.status(500).json({ success: false, error: 'Failed to reset messages' });
  }
});

export default router;
