import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { AIKnowledgeEngine, KnowledgeQuery } from '../services/ai/AIKnowledgeEngine';
import { RAGService } from '../services/ai/RAGService';
import { VectorService } from '../services/VectorService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const knowledgeEngine = new AIKnowledgeEngine();
const vectorService = new VectorService(prisma);

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
 * Main endpoint for knowledge queries - now with RAG integration
 */
router.post('/query', async (req, res) => {
  try {
    console.log('🤖 AI Knowledge Query received:', {
      question: req.body.question,
      user: req.user?.email || 'NO USER',
      orgId: req.user?.organizationId || 'NO ORG'
    });

    const { question, context, providerId } = querySchema.parse(req.body);

    // Use VectorService for better text search with Polish stemming
    let ragContext = '';
    let ragSources: any[] = [];

    try {
      // Get relevant documents using VectorService (better text search)
      // Note: searchSimilar(organizationId, query, options) returns VectorSearchResponse
      console.log('🔍 Calling VectorService.searchSimilar with:', {
        orgId: req.user.organizationId,
        question: question.substring(0, 50)
      });

      const searchResponse = await vectorService.searchSimilar(req.user.organizationId, question, {
        limit: 15,
        threshold: 0.2,
        filters: {},
        useCache: false // Avoid cache errors
      });

      console.log('✅ VectorService returned:', {
        totalResults: searchResponse.totalResults,
        fromCache: searchResponse.fromCache,
        firstResult: searchResponse.results[0]?.title
      });

      const searchResults = searchResponse.results;

      if (searchResults && searchResults.length > 0) {
        // Build RAG context from results
        ragContext = '=== Dokumenty z bazy wiedzy ===\n\n';
        let tokenCount = 0;
        const maxTokens = 4000;

        for (const result of searchResults) {
          const docText = `[${result.entityType}] ${result.title}\n${result.content}\n\n---\n\n`;
          const docTokens = Math.ceil(docText.length / 4);

          if (tokenCount + docTokens > maxTokens) break;

          ragContext += docText;
          tokenCount += docTokens;
        }

        // Build sources for response
        ragSources = searchResults.slice(0, 5).map(r => ({
          type: r.entityType,
          title: r.title.substring(0, 100),
          content: r.content.substring(0, 200) + '...',
          similarity: Math.round((r.similarity || 0) * 100)
        }));

        console.log(`📚 VectorService found ${searchResults.length} relevant documents`);
      }
    } catch (ragError: any) {
      console.warn('Vector search failed, trying RAGService fallback:', ragError?.message || ragError);

      // Fallback to RAGService
      try {
        const ragService = new RAGService(prisma, req.user.organizationId);
        await ragService.initialize();
        ragContext = await ragService.getContext(question, 3000);
        const fallbackResults = await ragService.search(question, 5);
        ragSources = fallbackResults.map(r => ({
          type: r.sourceType,
          title: r.content.substring(0, 100),
          content: r.content.substring(0, 200) + '...',
          similarity: Math.round(r.similarity * 100)
        }));
      } catch (fallbackError) {
        console.warn('RAGService fallback also failed:', fallbackError);
      }
    }

    const query: KnowledgeQuery = {
      question,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      context,
      providerId,
      ragContext // Pass RAG context to the knowledge engine
    };

    const response = await knowledgeEngine.queryKnowledge(query);

    // Log query for analytics
    console.log(`Knowledge query from ${req.user.email}: "${question}" (${response.executionTime}ms)`);

    res.json({
      success: true,
      data: {
        ...response,
        ragSources: ragSources.length > 0 ? ragSources : undefined,
        ragEnabled: ragContext.length > 0
      }
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

// ===== RAG ENDPOINTS =====

/**
 * POST /api/v1/ai-knowledge/rag/index
 * Index all CRM data into vector store
 */
router.post('/rag/index', async (req, res) => {
  try {
    console.log('🔄 Starting RAG indexing for org:', req.user.organizationId);

    const ragService = new RAGService(prisma, req.user.organizationId);
    await ragService.initialize();

    const result = await ragService.indexAllData();

    console.log(`✅ RAG indexing complete: ${result.success} success, ${result.failed} failed`);

    res.json({
      success: true,
      data: {
        message: 'Indexing complete',
        indexed: result.success,
        failed: result.failed
      }
    });
  } catch (error) {
    console.error('RAG indexing error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to index data'
    });
  }
});

/**
 * POST /api/v1/ai-knowledge/rag/search
 * Semantic search in vector store
 */
router.post('/rag/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const ragService = new RAGService(prisma, req.user.organizationId);
    await ragService.initialize();

    const results = await ragService.search(query, limit);

    res.json({
      success: true,
      data: {
        query,
        results,
        count: results.length
      }
    });
  } catch (error) {
    console.error('RAG search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

/**
 * GET /api/v1/ai-knowledge/rag/stats
 * Get RAG indexing statistics
 */
router.get('/rag/stats', async (req, res) => {
  try {
    const ragService = new RAGService(prisma, req.user.organizationId);
    await ragService.initialize();

    const stats = await ragService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('RAG stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    });
  }
});

/**
 * POST /api/v1/ai-knowledge/rag/query
 * RAG-enhanced AI query - combines vector search with AI generation
 */
router.post('/rag/query', async (req, res) => {
  try {
    const startTime = Date.now();
    const { question, providerId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    console.log(`🤖 RAG Query from ${req.user.email}: "${question}"`);

    // Initialize RAG service
    const ragService = new RAGService(prisma, req.user.organizationId);
    await ragService.initialize();

    // Get relevant context from vector store
    const ragContext = await ragService.getContext(question, 3000);

    // Search for relevant documents
    const searchResults = await ragService.search(question, 5);

    // Build enhanced query with RAG context
    const query: KnowledgeQuery = {
      question,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      context: 'general',
      providerId,
      ragContext // Pass RAG context to the engine
    };

    // Get AI response with RAG context
    const response = await knowledgeEngine.queryKnowledge(query);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        ...response,
        ragSources: searchResults.map(r => ({
          type: r.sourceType,
          content: r.content.substring(0, 200) + '...',
          similarity: Math.round(r.similarity * 100)
        })),
        ragEnabled: true,
        executionTime
      }
    });

  } catch (error) {
    console.error('RAG query error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'RAG query failed'
    });
  }
});

export default router;