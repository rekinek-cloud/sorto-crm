import express from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';
import { AIInsightsEngine } from '../services/ai/AIInsightsEngine';
import { prisma } from '../config/database';
import logger from '../config/logger';

const router = express.Router();

// Validation schemas
const streamInsightsSchema = z.object({
  params: z.object({
    streamId: z.string().uuid()
  }),
  query: z.object({
    types: z.string().optional(), // comma-separated: alert,opportunity,prediction
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    limit: z.coerce.number().min(1).max(50).default(20)
  })
});

const globalInsightsSchema = z.object({
  query: z.object({
    types: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    timeframe: z.enum(['today', 'week', 'month']).default('week')
  })
});

const actionSchema = z.object({
  body: z.object({
    actionType: z.enum(['call', 'email', 'schedule', 'create_task', 'update_deal', 'notify']),
    actionData: z.record(z.any()),
    insightId: z.string()
  })
});

// Apply authentication middleware
router.use(authenticateUser);

/**
 * GET /api/ai-insights/streams/:streamId
 * Get AI insights for specific stream
 */
router.get('/streams/:streamId', 
  validateRequest(streamInsightsSchema), 
  async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const { types, priority, limit } = req.query;
      const organizationId = req.user.organizationId;

      // Verify stream exists and belongs to organization
      const stream = await prisma.stream.findFirst({
        where: { 
          id: streamId, 
          organizationId 
        }
      });

      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found'
        });
      }

      // Generate insights
      const aiEngine = new AIInsightsEngine(organizationId);
      let insights = await aiEngine.generateStreamInsights(streamId);

      // Apply filters
      if (types) {
        const typeFilter = types.split(',');
        insights = insights.filter(insight => typeFilter.includes(insight.type));
      }

      if (priority) {
        insights = insights.filter(insight => insight.priority === priority);
      }

      // Limit results
      insights = insights.slice(0, limit);

      // Store insights for tracking
      await Promise.all(insights.map(insight => 
        prisma.aIExecution.create({
          data: {
            organizationId,
            type: 'INSIGHT_GENERATION',
            input: { streamId, filters: { types, priority } },
            output: { insight },
            status: 'COMPLETED',
            confidence: insight.confidence
          }
        }).catch(error => {
          logger.error('Failed to store AI insight:', error);
        })
      ));

      res.json({
        success: true,
        data: {
          insights,
          stream: {
            id: stream.id,
            name: stream.name
          },
          meta: {
            total: insights.length,
            highPriority: insights.filter(i => ['high', 'critical'].includes(i.priority)).length,
            avgConfidence: insights.length > 0 
              ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)
              : 0
          }
        }
      });

    } catch (error) {
      logger.error('Error generating stream insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate insights'
      });
    }
  }
);

/**
 * GET /api/ai-insights/global
 * Get organization-wide AI insights
 */
router.get('/global',
  validateRequest(globalInsightsSchema),
  async (req: any, res) => {
    try {
      const { types, priority, limit, timeframe } = req.query;
      const organizationId = req.user.organizationId;

      // Get all active streams
      const streams = await prisma.stream.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true }
      });

      const aiEngine = new AIInsightsEngine(organizationId);
      let allInsights: any[] = [];

      // Generate insights for all streams (in parallel)
      const insightPromises = streams.map(stream => 
        aiEngine.generateStreamInsights(stream.id)
          .then(insights => insights.map(insight => ({
            ...insight,
            streamName: stream.name
          })))
          .catch(error => {
            logger.error(`Failed to generate insights for stream ${stream.id}:`, error);
            return [];
          })
      );

      const streamInsights = await Promise.all(insightPromises);
      allInsights = streamInsights.flat();

      // Add organization-level insights
      const orgInsights = await generateOrganizationInsights(organizationId, timeframe);
      allInsights.push(...orgInsights);

      // Apply filters
      if (types) {
        const typeFilter = types.split(',');
        allInsights = allInsights.filter(insight => typeFilter.includes(insight.type));
      }

      if (priority) {
        allInsights = allInsights.filter(insight => insight.priority === priority);
      }

      // Sort by priority and confidence
      allInsights.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.confidence - a.confidence;
      });

      // Limit results
      allInsights = allInsights.slice(0, limit);

      res.json({
        success: true,
        data: {
          insights: allInsights,
          meta: {
            total: allInsights.length,
            byType: groupInsightsByType(allInsights),
            byPriority: groupInsightsByPriority(allInsights),
            avgConfidence: allInsights.length > 0
              ? Math.round(allInsights.reduce((sum, i) => sum + i.confidence, 0) / allInsights.length)
              : 0,
            streamsAnalyzed: streams.length
          }
        }
      });

    } catch (error) {
      logger.error('Error generating global insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate global insights'
      });
    }
  }
);

/**
 * POST /api/ai-insights/actions
 * Execute AI-suggested action
 */
router.post('/actions',
  validateRequest(actionSchema),
  async (req: any, res) => {
    try {
      const { actionType, actionData, insightId } = req.body;
      const organizationId = req.user.organizationId;
      const userId = req.user.id;

      logger.info('Executing AI action:', { actionType, insightId, userId });

      let result: any = {};

      switch (actionType) {
        case 'create_task':
          result = await prisma.task.create({
            data: {
              title: actionData.title,
              description: actionData.description || '',
              priority: actionData.priority || 'MEDIUM',
              status: 'TODO',
              organizationId,
              creatorId: userId,
              assigneeId: actionData.assigneeId || userId,
              streamId: actionData.streamId,
              projectId: actionData.projectId,
              dueDate: actionData.dueDate ? new Date(actionData.dueDate) : undefined
            }
          });
          break;

        case 'schedule':
          result = await prisma.meeting.create({
            data: {
              title: actionData.title || 'AI Suggested Meeting',
              description: actionData.description || '',
              organizationId,
              organizerId: userId,
              startTime: actionData.startTime ? new Date(actionData.startTime) : new Date(Date.now() + 24 * 60 * 60 * 1000),
              endTime: actionData.endTime ? new Date(actionData.endTime) : new Date(Date.now() + 25 * 60 * 60 * 1000),
              type: actionData.type || 'INTERNAL'
            }
          });
          break;

        case 'update_deal':
          if (actionData.dealId) {
            result = await prisma.deal.update({
              where: { id: actionData.dealId, organizationId },
              data: {
                stage: actionData.stage,
                value: actionData.value,
                notes: actionData.notes,
                nextAction: actionData.nextAction,
                nextActionDate: actionData.nextActionDate ? new Date(actionData.nextActionDate) : undefined
              }
            });
          }
          break;

        case 'notify':
          // Create notification/alert
          result = await prisma.errorLog.create({
            data: {
              organizationId,
              level: 'INFO',
              message: actionData.message || 'AI Notification',
              context: { 
                type: 'ai_notification',
                insightId,
                data: actionData 
              }
            }
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            error: `Unsupported action type: ${actionType}`
          });
      }

      // Log action execution
      await prisma.aIExecution.create({
        data: {
          organizationId,
          type: 'ACTION_EXECUTION',
          input: { actionType, actionData, insightId },
          output: { result },
          status: 'COMPLETED',
          confidence: 100
        }
      });

      res.json({
        success: true,
        data: {
          action: actionType,
          result,
          message: `Successfully executed ${actionType} action`
        }
      });

    } catch (error) {
      logger.error('Error executing AI action:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute action'
      });
    }
  }
);

/**
 * GET /api/ai-insights/communication/:channelId
 * Get communication insights for specific channel
 */
router.get('/communication/:channelId',
  async (req: any, res) => {
    try {
      const { channelId } = req.params;
      const organizationId = req.user.organizationId;

      // Get channel with messages
      const channel = await prisma.communicationChannel.findFirst({
        where: { id: channelId, organizationId },
        include: {
          messages: {
            orderBy: { receivedAt: 'desc' },
            take: 100,
            include: {
              contact: true,
              company: true
            }
          }
        }
      });

      if (!channel) {
        return res.status(404).json({
          success: false,
          error: 'Channel not found'
        });
      }

      const insights = await generateCommunicationInsights(channel);

      res.json({
        success: true,
        data: {
          channel: {
            id: channel.id,
            name: channel.name,
            type: channel.type
          },
          insights,
          stats: {
            totalMessages: channel.messages.length,
            uniqueContacts: new Set(channel.messages.map(m => m.contactId).filter(Boolean)).size,
            avgResponseTime: await calculateAvgResponseTime(channel.messages),
            sentimentTrend: await calculateSentimentTrend(channel.messages)
          }
        }
      });

    } catch (error) {
      logger.error('Error generating communication insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate communication insights'
      });
    }
  }
);

// Helper methods
async function generateOrganizationInsights(organizationId: string, timeframe: string): Promise<any[]> {
  const insights: any[] = [];
  
  // Calculate timeframe dates
  const now = new Date();
  const timeframeStart = new Date();
  switch (timeframe) {
    case 'today':
      timeframeStart.setHours(0, 0, 0, 0);
      break;
    case 'week':
      timeframeStart.setDate(now.getDate() - 7);
      break;
    case 'month':
      timeframeStart.setDate(now.getDate() - 30);
      break;
  }

  // Overall productivity insights
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    where: {
      organizationId,
      createdAt: { gte: timeframeStart }
    },
    _count: { id: true }
  });

  const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.id, 0);
  const completedTasks = taskStats.find(s => s.status === 'COMPLETED')?._count.id || 0;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  if (completionRate < 0.6) {
    insights.push({
      id: `org-productivity-${organizationId}`,
      type: 'alert',
      priority: 'medium',
      title: 'Organization productivity below target',
      description: `Only ${Math.round(completionRate * 100)}% task completion rate in ${timeframe}`,
      confidence: 82,
      data: { taskStats, completionRate, timeframe },
      actions: [
        {
          type: 'create_task',
          label: 'Schedule Productivity Review',
          data: { title: 'Organization productivity analysis', priority: 'HIGH' }
        }
      ],
      context: { organizationId },
      createdAt: new Date()
    });
  }

  return insights;
}

function groupInsightsByType(insights: any[]): Record<string, number> {
  return insights.reduce((acc, insight) => {
    acc[insight.type] = (acc[insight.type] || 0) + 1;
    return acc;
  }, {});
}

function groupInsightsByPriority(insights: any[]): Record<string, number> {
  return insights.reduce((acc, insight) => {
    acc[insight.priority] = (acc[insight.priority] || 0) + 1;
    return acc;
  }, {});
}

async function generateCommunicationInsights(channel: any): Promise<any[]> {
  const insights: any[] = [];
  const messages = channel.messages;

  if (messages.length === 0) return insights;

  // Response time analysis
  const avgResponseTime = await calculateAvgResponseTime(messages);
  if (avgResponseTime > 24) { // more than 24 hours
    insights.push({
      id: `response-time-${channel.id}`,
      type: 'alert',
      priority: 'medium',
      title: 'Slow response times detected',
      description: `Average response time: ${Math.round(avgResponseTime)} hours`,
      confidence: 75,
      data: { avgResponseTime, channel: channel.name },
      actions: [
        {
          type: 'notify',
          label: 'Set Response Time Goals',
          data: { target: '4 hours', channel: channel.id }
        }
      ],
      context: { channelId: channel.id },
      createdAt: new Date()
    });
  }

  return insights;
}

async function calculateAvgResponseTime(messages: any[]): Promise<number> {
  // Simple calculation - time between consecutive messages
  let totalTime = 0;
  let responseCount = 0;

  for (let i = 1; i < messages.length; i++) {
    const current = messages[i];
    const previous = messages[i - 1];
    
    if (current.direction !== previous.direction) {
      const timeDiff = new Date(current.receivedAt).getTime() - new Date(previous.receivedAt).getTime();
      totalTime += timeDiff;
      responseCount++;
    }
  }

  return responseCount > 0 ? totalTime / responseCount / (1000 * 60 * 60) : 0; // hours
}

async function calculateSentimentTrend(messages: any[]): Promise<string> {
  // Simple sentiment trend calculation
  const recentMessages = messages.slice(0, 10);
  const olderMessages = messages.slice(10, 20);
  
  const recentSentiment = calculateSimpleSentiment(recentMessages);
  const olderSentiment = calculateSimpleSentiment(olderMessages);
  
  if (recentSentiment > olderSentiment + 0.1) return 'improving';
  if (recentSentiment < olderSentiment - 0.1) return 'declining';
  return 'stable';
}

function calculateSimpleSentiment(messages: any[]): number {
  const positiveWords = ['great', 'excellent', 'perfect', 'amazing', 'wonderful'];
  const negativeWords = ['problem', 'issue', 'concern', 'delay', 'frustrated'];
  
  let score = 0;
  let wordCount = 0;
  
  messages.forEach(msg => {
    const content = (msg.content || '').toLowerCase();
    const words = content.split(/\s+/);
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
      wordCount++;
    });
  });
  
  return wordCount > 0 ? Math.max(0, Math.min(1, (score / wordCount + 1) / 2)) : 0.5;
}

export default router;