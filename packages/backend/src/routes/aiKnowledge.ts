import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { AIKnowledgeEngine, KnowledgeQuery } from '../services/ai/AIKnowledgeEngine';

const router = Router();
const knowledgeEngine = new AIKnowledgeEngine();

// Validation schemas
const querySchema = z.object({
  question: z.string().min(1, 'Question is required'),
  context: z.enum(['dashboard', 'projects', 'deals', 'tasks', 'general']).optional(),
  providerId: z.string().optional()
});

// Apply authentication middleware
router.use(authenticateUser);

/**
 * GET /api/v1/ai-knowledge/debug-providers
 * Debug endpoint to check available providers
 */
router.get('/debug-providers', async (req, res) => {
  try {
    console.log('🔧 Debug providers endpoint called');
    
    // Get organization ID from authenticated user
    const organizationId = req.user.organizationId;
    console.log('Organization ID:', organizationId);
    
    // Create temp knowledge engine to test
    const tempEngine = new AIKnowledgeEngine();
    
    // Get available providers using private method (we'll make it public for debug)
    const providers = await (tempEngine as any).getAvailableAIProviders(organizationId);
    
    console.log('Available providers:', providers);
    
    res.json({
      success: true,
      organizationId,
      providers
    });
    
  } catch (error) {
    console.error('Debug providers error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/ai-knowledge/clear-cache
 * Clear AI router cache (debug endpoint)
 */
router.post('/clear-cache', async (req, res) => {
  try {
    console.log('🧹 Clear cache endpoint called');
    
    knowledgeEngine.clearCache();
    
    res.json({
      success: true,
      message: 'AI router cache cleared'
    });
    
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/ai-knowledge/query
 * Main endpoint for knowledge queries
 */
router.post('/query', async (req, res) => {
  try {
    console.log('🤖 AI Knowledge Query received:', {
      question: req.body.question,
      user: req.user?.email || 'NO USER',
      orgId: req.user?.organizationId || 'NO ORG'
    });

    const { question, context, providerId } = querySchema.parse(req.body);
    
    const query: KnowledgeQuery = {
      question,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      context,
      providerId
    };

    const response = await knowledgeEngine.queryKnowledge(query);

    // Log query for analytics
    console.log(`Knowledge query from ${req.user.email}: "${question}" (${response.executionTime}ms)`);

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    console.error('Knowledge query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process knowledge query'
    });
  }
});

/**
 * GET /api/v1/ai-knowledge/insights/:type
 * Get specific type of insights
 */
router.get('/insights/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['projects', 'deals', 'tasks', 'productivity', 'communication'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid insight type'
      });
    }

    const query: KnowledgeQuery = {
      question: `Pokaż insights dla ${type}`,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      context: type as any
    };

    const response = await knowledgeEngine.queryKnowledge(query);

    res.json({
      success: true,
      data: {
        insights: response.insights,
        visualizations: response.visualizations,
        executionTime: response.executionTime
      }
    });

  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights'
    });
  }
});

/**
 * GET /api/v1/ai-knowledge/stats
 * Get knowledge base statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Basic stats about data available for analysis
    const organizationId = req.user.organizationId;
    
    // You could use prisma here to get actual counts
    const stats = {
      dataPoints: {
        projects: 0, // Will be filled by actual counts
        tasks: 0,
        deals: 0,
        communications: 0
      },
      lastUpdate: new Date().toISOString(),
      capabilities: [
        'Project risk analysis',
        'Deal probability prediction', 
        'Task prioritization',
        'Productivity insights',
        'Communication sentiment analysis'
      ]
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * POST /api/v1/ai-knowledge/suggestions
 * Get suggested questions based on current data
 */
router.post('/suggestions', async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    // Generate contextual suggestions based on user's data
    const suggestions = [
      "Które projekty są zagrożone opóźnieniem?",
      "Co powinienem zrobić najpierw dziś?",
      "Jakie deals mają największą szansę na zamknięcie?",
      "Jak wygląda moja produktywność w tym tygodniu?",
      "Które zadania są po terminie?",
      "Pokaż trendy komunikacji z klientami",
      "Jakie są moje najefektywniejsze konteksty pracy?",
      "Które firmy wymagają kontaktu?"
    ];

    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 6), // Return 6 random suggestions
        categories: [
          { name: 'Projekty', icon: '📁', color: 'blue' },
          { name: 'Zadania', icon: '✅', color: 'green' },
          { name: 'Deals', icon: '💰', color: 'yellow' },
          { name: 'Produktywność', icon: '⚡', color: 'purple' }
        ]
      }
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions'
    });
  }
});

export default router;