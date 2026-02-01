import { Router } from 'express';
import { authenticateToken } from '../shared/middleware/auth';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

// Types for flash news
interface FlashNewsItem {
  id: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  source: 'ai_rule' | 'automation' | 'manual';
  createdAt: Date;
  expiresAt?: Date;
  organizationId: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

// Helper function to get user's organization
const getUserOrganizationId = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user.organizationId;
};

// Execute AI Rules to generate flash news
const executeAIRulesForFlashNews = async (organizationId: string): Promise<FlashNewsItem[]> => {
  const aiRulesNews: FlashNewsItem[] = [];
  
  try {
    // Get active AI Rules that can generate flash news
    const aiRules = await prisma.ai_rules.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        actions: {
          path: ['create_flash_news', 'enabled'],
          equals: true
        }
      }
    });

    logger.info(`Found ${aiRules.length} AI Rules for organization ${organizationId}`);
    
    // Execute each rule
    for (const rule of aiRules) {
      const actions = rule.actions as any;
      const conditions = rule.triggerConditions as any;
      
      if (actions.create_flash_news?.enabled) {
        logger.info(`Executing rule: ${rule.name} (${rule.triggerType})`);
        // Execute rule-specific logic based on trigger type
        const news = await executeSpecificRule(rule, organizationId);
        if (news) {
          aiRulesNews.push(news);
          logger.info(`Generated flash news from rule: ${rule.name}`);
        } else {
          logger.info(`Rule ${rule.name} did not trigger`);
        }
      }
    }
  } catch (error) {
    logger.error('Failed to execute AI Rules for flash news:', error);
  }
  
  return aiRulesNews;
};

// Execute specific AI Rule logic
const executeSpecificRule = async (rule: any, organizationId: string): Promise<FlashNewsItem | null> => {
  const actions = rule.actions as any;
  const conditions = rule.triggerConditions as any;
  
  try {
    let shouldTrigger = false;
    let templateData: any = {};

    // Rule-specific logic based on trigger type
    switch (rule.triggerType) {
      case 'TASK_UPDATED':
        if (rule.name.includes('Overdue Tasks')) {
          const overdueTasks = await prisma.task.count({
            where: {
              organizationId,
              dueDate: { lt: new Date() },
              status: { notIn: ['COMPLETED', 'CANCELED'] }
            }
          });
          
          if (overdueTasks >= (conditions.conditions?.overdue_days_threshold || 2)) {
            shouldTrigger = true;
            templateData = { task_count: overdueTasks, days: conditions.conditions?.overdue_days_threshold || 2 };
          }
        }
        break;

      case 'SCHEDULED':
        if (rule.name.includes('Weekly Review')) {
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
          const hour = today.getHours();
          
          // Check if it's Friday afternoon (simplified check)
          if (dayOfWeek === 5 && hour >= 16) {
            shouldTrigger = true;
            templateData = { week: `${today.getDate()}/${today.getMonth() + 1}` };
          }
        }
        break;

      case 'PROJECT_CREATED':
        if (rule.name.includes('Project Milestone')) {
          const overdueProjects = await prisma.project.count({
            where: {
              organizationId,
              status: 'IN_PROGRESS',
              dueDate: {
                lt: new Date(Date.now() - (conditions.conditions?.milestone_overdue_days || 3) * 24 * 60 * 60 * 1000)
              }
            }
          });
          
          if (overdueProjects > 0) {
            shouldTrigger = true;
            templateData = { project_count: overdueProjects, days: conditions.conditions?.milestone_overdue_days || 3 };
          }
        }
        break;
    }

    if (shouldTrigger) {
      // Generate flash news from template
      let content = actions.create_flash_news.template;
      
      // Simple template replacement
      Object.keys(templateData).forEach(key => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), templateData[key]);
      });

      return {
        id: `ai-rule-${rule.id}-${Date.now()}`,
        content,
        type: actions.create_flash_news.type || 'info',
        priority: actions.create_flash_news.priority || 'medium',
        source: 'ai_rule',
        createdAt: new Date(),
        organizationId,
        isActive: true,
        metadata: {
          ruleId: rule.id,
          ruleName: rule.name,
          ...actions.create_flash_news.metadata
        }
      };
    }
  } catch (error) {
    logger.error(`Failed to execute rule ${rule.name}:`, error);
  }
  
  return null;
};

// Generate AI-driven flash news based on system state
const generateAIFlashNews = async (organizationId: string): Promise<FlashNewsItem[]> => {
  const aiNews: FlashNewsItem[] = [];
  
  try {
    // Check for overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        organizationId,
        dueDate: {
          lt: new Date()
        },
        status: {
          notIn: ['COMPLETED', 'CANCELED']
        }
      }
    });

    if (overdueTasks > 0) {
      aiNews.push({
        id: `overdue-${Date.now()}`,
        content: `⚠️ Masz ${overdueTasks} przeterminowanych zadań wymagających uwagi.`,
        type: 'warning',
        priority: overdueTasks > 5 ? 'high' : 'medium',
        source: 'ai_rule',
        createdAt: new Date(),
        organizationId,
        isActive: true,
        metadata: { overdueTasks }
      });
    }

    // Check for tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksToday = await prisma.task.count({
      where: {
        organizationId,
        dueDate: {
          gte: today,
          lt: tomorrow
        },
        status: {
          notIn: ['COMPLETED', 'CANCELED']
        }
      }
    });

    if (tasksToday > 0) {
      aiNews.push({
        id: `today-${Date.now()}`,
        content: `📅 Masz ${tasksToday} zadań zaplanowanych na dziś.`,
        type: 'info',
        priority: 'medium',
        source: 'ai_rule',
        createdAt: new Date(),
        organizationId,
        isActive: true,
        metadata: { tasksToday }
      });
    }

    // Check for completed tasks today
    const completedToday = await prisma.task.count({
      where: {
        organizationId,
        status: 'COMPLETED',
        updatedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (completedToday >= 5) {
      aiNews.push({
        id: `completed-${Date.now()}`,
        content: `🎉 Świetna robota! Ukończyłeś już ${completedToday} zadań dzisiaj!`,
        type: 'success',
        priority: 'low',
        source: 'ai_rule',
        createdAt: new Date(),
        organizationId,
        isActive: true,
        metadata: { completedToday }
      });
    }

    // Check for GTD inbox items
    const inboxItems = await prisma.inboxItem.count({
      where: {
        organizationId,
        processed: false
      }
    });

    if (inboxItems > 10) {
      aiNews.push({
        id: `inbox-${Date.now()}`,
        content: `📥 Twój GTD Inbox ma ${inboxItems} nieprzetworonych elementów.`,
        type: 'warning',
        priority: inboxItems > 20 ? 'high' : 'medium',
        source: 'automation',
        createdAt: new Date(),
        organizationId,
        isActive: true,
        metadata: { inboxItems }
      });
    }

  } catch (error) {
    logger.error('Failed to generate AI flash news:', error);
  }
  
  return aiNews;
};

// Get flash news for organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);
    
    // Execute AI Rules to generate flash news
    const aiRulesNews = await executeAIRulesForFlashNews(organizationId);
    
    // Generate additional AI-driven news (legacy/hardcoded rules)
    const aiNews = await generateAIFlashNews(organizationId);
    
    // Add some static/system news
    const systemNews: FlashNewsItem[] = [
      {
        id: 'system-welcome',
        content: '🚀 Witaj w STREAMS! System jest gotowy do pracy.',
        type: 'info',
        priority: 'low',
        source: 'manual',
        createdAt: new Date(),
        organizationId,
        isActive: true
      }
    ];

    // Combine and sort by priority and time
    const allNews = [...aiRulesNews, ...aiNews, ...systemNews].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Limit to 5 most important news items
    const limitedNews = allNews.slice(0, 5);

    res.json({
      success: true,
      data: {
        items: limitedNews,
        count: limitedNews.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get flash news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get flash news',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create manual flash news item
router.post('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);
    const { content, type = 'info', priority = 'medium', expiresAt } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const newsItem: FlashNewsItem = {
      id: `manual-${Date.now()}`,
      content,
      type,
      priority,
      source: 'manual',
      createdAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      organizationId,
      isActive: true
    };

    // TODO: Store in database table when flash_news table is created
    // For now, return the created item
    
    res.json({
      success: true,
      data: newsItem
    });

  } catch (error) {
    logger.error('Failed to create flash news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create flash news',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete/hide flash news item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement actual delete from database
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Flash news item hidden'
    });

  } catch (error) {
    logger.error('Failed to delete flash news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete flash news',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint without auth for development
router.get('/test', async (req, res) => {
  try {
    // Use first organization for testing
    const org = await prisma.organization.findFirst();
    if (!org) {
      return res.status(404).json({ success: false, error: 'No organization found' });
    }

    // Execute AI Rules to generate flash news
    const aiRulesNews = await executeAIRulesForFlashNews(org.id);
    
    // Generate additional AI-driven news (legacy/hardcoded rules)
    const aiNews = await generateAIFlashNews(org.id);
    
    // Combine results
    const allNews = [...aiRulesNews, ...aiNews].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      success: true,
      data: {
        items: allNews.slice(0, 5),
        count: allNews.length,
        generatedAt: new Date().toISOString(),
        debug: {
          aiRulesNews: aiRulesNews.length,
          legacyNews: aiNews.length,
          organizationId: org.id
        }
      }
    });

  } catch (error) {
    logger.error('Failed to test flash news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test flash news',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;