import express from 'express';
import { authenticateToken } from '../shared/middleware/auth';

const router = express.Router();

// Apply authentication
router.use(authenticateToken);

/**
 * RAG Agent Proxy - Week 2
 * Przekierowanie zapytań do RAG Service z Week 2
 */

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

router.post('/query', async (req, res) => {
  try {
    const { question, context, providerId } = req.body;
    const user = req.user;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    console.log(`[RAG Agent] Query from user ${user.userId}: ${question.substring(0, 50)}...`);

    // Transform request do RAG service format
    const ragRequest = {
      query: question,
      userId: user.userId,
      organizationId: user.organizationId,
      userRole: user.role || 'USER',
      userStreamIds: user.streamIds || [],
      context: {
        contextType: context || 'general',
        providerId: providerId
      }
    };

    // Call RAG Service
    const ragResponse = await fetch(`${RAG_SERVICE_URL}/api/v1/agent/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ragRequest),
      timeout: 30000 // 30s timeout
    });

    if (!ragResponse.ok) {
      const errorText = await ragResponse.text();
      console.error(`[RAG Agent] Error response from RAG service:`, errorText);
      throw new Error(`RAG service returned ${ragResponse.status}: ${errorText}`);
    }

    const ragData = await ragResponse.json();

    console.log(`[RAG Agent] Response received in ${ragData.searchTime}ms, confidence: ${ragData.confidence}`);

    // Transform response to Knowledge Chat format
    const response = {
      success: true,
      data: {
        answer: ragData.answer,
        data: ragData.sources || [],
        insights: extractInsights(ragData),
        actions: extractActions(ragData),
        visualizations: [],
        executionTime: ragData.searchTime,
        confidence: ragData.confidence,
        intent: ragData.intent
      }
    };

    res.json(response);

  } catch (error) {
    console.error('[RAG Agent] Error:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallback: true
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const ragResponse = await fetch(`${RAG_SERVICE_URL}/health`, {
      timeout: 5000
    });

    const isHealthy = ragResponse.ok;

    res.json({
      success: true,
      data: {
        ragServiceUrl: RAG_SERVICE_URL,
        ragServiceStatus: isHealthy ? 'healthy' : 'unhealthy',
        week2Enabled: true
      }
    });
  } catch (error) {
    res.json({
      success: false,
      data: {
        ragServiceUrl: RAG_SERVICE_URL,
        ragServiceStatus: 'unavailable',
        week2Enabled: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * Helper: Extract insights from RAG response
 */
function extractInsights(ragData: any): any[] {
  const insights = [];

  // From intent analysis
  if (ragData.intent) {
    const { intent_type, confidence, sentiment } = ragData.intent;

    if (confidence < 0.7) {
      insights.push({
        type: 'warning',
        title: 'Niska pewność interpretacji',
        description: `Agent ma tylko ${Math.round(confidence * 100)}% pewności co do intencji zapytania.`,
        priority: 'medium'
      });
    }

    if (sentiment !== 'neutral') {
      insights.push({
        type: 'trend',
        title: `Ton zapytania: ${sentiment}`,
        description: `Wykryto emocjonalny kontekst w zapytaniu.`,
        priority: 'low'
      });
    }

    // Suggest based on intent type
    if (intent_type === 'ANALYTICAL') {
      insights.push({
        type: 'recommendation',
        title: 'Zapytanie analityczne',
        description: 'Używam pełnego wyszukiwania RAG + DB + Graph dla najlepszych wyników.',
        priority: 'low'
      });
    }
  }

  return insights;
}

/**
 * Helper: Extract action items from RAG response
 */
function extractActions(ragData: any): any[] {
  const actions = [];

  // From sources - suggest actions based on entity types
  if (ragData.sources) {
    const sourceTypes = new Set(ragData.sources.map((s: any) => s.type));

    if (sourceTypes.has('TASK')) {
      actions.push({
        type: 'task',
        title: 'Przejrzyj zadania',
        description: 'Znaleziono powiązane zadania wymagające uwagi',
        urgency: 'medium'
      });
    }

    if (sourceTypes.has('DEAL')) {
      actions.push({
        type: 'review',
        title: 'Sprawdź deale',
        description: 'Znaleziono istotne informacje o dealach',
        urgency: 'high'
      });
    }

    if (sourceTypes.has('PROJECT')) {
      actions.push({
        type: 'meeting',
        title: 'Planuj projekt',
        description: 'Rozważ spotkanie dotyczące projektu',
        urgency: 'medium'
      });
    }
  }

  return actions;
}

export default router;
