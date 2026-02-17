import { Router } from 'express';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validation';
import { z } from 'zod';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';
import { universalRuleEngine } from '../services/ai/UniversalRuleEngine';

const router = Router();

// Manual analysis trigger schema
const manualAnalysisSchema = z.object({
  module: z.enum(['projects', 'tasks', 'deals', 'contacts', 'communication']),
  component: z.string().optional(),
  itemId: z.string(),
  analysisType: z.enum(['smart-score', 'task-breakdown', 'risk-assessment', 'engagement-strategy']).optional(),
  customPrompt: z.string().optional(),
});

/**
 * POST /api/v1/universal-rules/analyze
 * Manual trigger for AI analysis on any module item
 */
router.post('/analyze',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER']),
  validateRequest({ body: manualAnalysisSchema }),
  async (req, res) => {
    try {
      const { module, component, itemId, analysisType, customPrompt } = req.body;
      
      // Get item data based on module
      const itemData = await getItemData(module, itemId);
      
      if (!itemData) {
        throw new AppError(`Item not found in ${module}`, 404);
      }

      // Add analysis trigger info
      itemData._analysisType = analysisType;
      itemData._customPrompt = customPrompt;
      itemData._trigger = 'manual';

      // Execute rules
      const results = await universalRuleEngine.executeRules(
        module,
        component || null,
        itemData,
        'manual',
        {
          id: req.user!.id,
          role: req.user!.role,
          permissions: (req.user as any)?.permissions || []
        }
      );

      logger.info(`Manual analysis triggered for ${module}:${itemId} by ${req.user!.email}`);

      return res.json({
        success: true,
        module,
        itemId,
        analysisType,
        results,
        executedRules: results.length,
        successfulRules: results.filter(r => r.success).length
      });

    } catch (error) {
      logger.error('Manual analysis failed:', error);
      throw new AppError('Failed to execute analysis', 500);
    }
  }
);

/**
 * POST /api/v1/universal-rules/auto-trigger
 * Automatic trigger for rules when data changes
 */
router.post('/auto-trigger',
  authenticateToken,
  async (req, res) => {
    try {
      const { module, component, data, action } = req.body;

      if (!module || !data) {
        throw new AppError('Module and data are required', 400);
      }

      // Add trigger context
      data._action = action; // 'created', 'updated', 'deleted'
      data._trigger = 'automatic';

      // Execute rules
      const results = await universalRuleEngine.executeRules(
        module,
        component || null,
        data,
        'automatic',
        {
          id: req.user!.id,
          role: req.user!.role,
          permissions: (req.user as any)?.permissions || []
        }
      );

      return res.json({
        success: true,
        module,
        action,
        results,
        executedRules: results.length
      });

    } catch (error) {
      logger.error('Auto trigger failed:', error);
      throw new AppError('Failed to execute auto rules', 500);
    }
  }
);

/**
 * GET /api/v1/universal-rules/available
 * Get available analysis types for each module
 */
router.get('/available',
  authenticateToken,
  async (req, res) => {
    try {
      const availableAnalyses = {
        projects: [
          {
            type: 'smart-score',
            name: 'Analiza SMART',
            description: 'Ocena projektu według kryteriów SMART',
            estimatedTime: '30-60 sekund',
            aiModel: 'GPT-4'
          },
          {
            type: 'risk-assessment',
            name: 'Ocena ryzyka',
            description: 'Analiza ryzyka projektu i prawdopodobieństwa sukcesu',
            estimatedTime: '45 sekund',
            aiModel: 'GPT-4'
          }
        ],
        tasks: [
          {
            type: 'task-breakdown',
            name: 'Podział zadania',
            description: 'Podział złożonego zadania na mniejsze części',
            estimatedTime: '20-40 sekund',
            aiModel: 'GPT-3.5'
          },
          {
            type: 'productivity-tips',
            name: 'Wskazówki produktywności',
            description: 'Sugestie optymalizacji wykonania zadania',
            estimatedTime: '30 sekund',
            aiModel: 'GPT-3.5'
          }
        ],
        deals: [
          {
            type: 'risk-assessment',
            name: 'Analiza ryzyka deala',
            description: 'Ocena prawdopodobieństwa zamknięcia i ryzyk',
            estimatedTime: '60-90 sekund',
            aiModel: 'GPT-4'
          },
          {
            type: 'negotiation-strategy',
            name: 'Strategia negocjacji',
            description: 'Rekomendacje dla procesu negocjacyjnego',
            estimatedTime: '45 sekund',
            aiModel: 'GPT-4'
          }
        ],
        contacts: [
          {
            type: 'engagement-strategy',
            name: 'Strategia zaangażowania',
            description: 'Plan reaktywacji i budowania relacji',
            estimatedTime: '30-45 sekund',
            aiModel: 'GPT-3.5'
          },
          {
            type: 'relationship-analysis',
            name: 'Analiza relacji',
            description: 'Ocena jakości i potencjału relacji biznesowej',
            estimatedTime: '40 sekund',
            aiModel: 'GPT-3.5'
          }
        ],
        communication: [
          {
            type: 'sentiment-analysis',
            name: 'Analiza sentymentu',
            description: 'Ocena tonu i emocji w komunikacji',
            estimatedTime: '10-20 sekund',
            aiModel: 'Custom'
          },
          {
            type: 'response-suggestions',
            name: 'Sugestie odpowiedzi',
            description: 'Propozycje profesjonalnych odpowiedzi',
            estimatedTime: '30 sekund',
            aiModel: 'GPT-3.5'
          }
        ]
      };

      return res.json({
        success: true,
        data: availableAnalyses
      });

    } catch (error) {
      logger.error('Failed to get available analyses:', error);
      throw new AppError('Failed to retrieve available analyses', 500);
    }
  }
);

/**
 * GET /api/v1/universal-rules/execution-history
 * Get rule execution history
 */
router.get('/execution-history',
  authenticateToken,
  async (req, res) => {
    try {
      const { module, limit = 50, offset = 0 } = req.query;

      // Mock history data - in real app, query from database
      const history = Array.from({ length: Number(limit) }, (_, i) => ({
        id: `exec_${Date.now()}_${i}`,
        ruleId: 'project-smart-analysis',
        ruleName: 'Automatyczna analiza SMART nowych projektów',
        module: module || 'projects',
        itemId: `item_${i + 1}`,
        trigger: i % 3 === 0 ? 'manual' : 'automatic',
        success: Math.random() > 0.1,
        executionTime: Math.floor(Math.random() * 5000),
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        user: req.user!.email,
        aiResponsesCount: Math.floor(Math.random() * 3),
        actionsExecuted: Math.floor(Math.random() * 5)
      }));

      return res.json({
        success: true,
        data: history,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: 500 // Mock total
        }
      });

    } catch (error) {
      logger.error('Failed to get execution history:', error);
      throw new AppError('Failed to retrieve execution history', 500);
    }
  }
);

/**
 * Helper function to get item data based on module
 */
async function getItemData(module: string, itemId: string): Promise<any> {
  switch (module) {
    case 'projects':
      // Mock project data
      return {
        id: itemId,
        projectName: 'Przykładowy projekt',
        description: 'Opis projektu do analizy SMART',
        deadline: '2024-12-31',
        budget: 100000,
        teamSize: 5,
        status: 'PLANNING',
        priority: 'HIGH'
      };
      
    case 'tasks':
      return {
        id: itemId,
        title: 'Duże zadanie do analizy',
        description: 'To jest bardzo długi opis zadania które wymaga szczegółowej analizy i prawdopodobnie podziału na mniejsze części, ponieważ jest bardzo złożone i czasochłonne.',
        estimatedHours: 12,
        priority: 'HIGH',
        context: '@computer'
      };
      
    case 'deals':
      return {
        id: itemId,
        clientName: 'ABC Corp',
        value: 75000,
        stage: 'QUALIFIED',
        daysInPipeline: 15,
        lastContact: '2024-06-15',
        clientHistory: 'Pierwszy kontakt, duża firma technologiczna',
        competition: 'Konkurencja z lokalnym dostawcą'
      };
      
    case 'contacts':
      return {
        id: itemId,
        contactName: 'Jan Kowalski',
        position: 'CEO',
        company: 'Tech Solutions',
        lastContactDate: '2024-05-20',
        lastContactDays: 31,
        status: 'ACTIVE',
        interactionHistory: 'Spotkania na konferencjach, wymiana wizytówek',
        relationshipType: 'business-prospect',
        interests: 'technologia, startup, innowacje'
      };
      
    default:
      return null;
  }
}

export default router;
