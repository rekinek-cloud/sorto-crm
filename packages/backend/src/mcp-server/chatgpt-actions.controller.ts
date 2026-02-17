/**
 * ChatGPT Actions Controller
 * REST API endpoints dla integracji z ChatGPT Custom Actions
 *
 * Te endpointy mapują funkcjonalność MCP na standardowe REST API,
 * które jest obsługiwane przez ChatGPT Actions.
 */

import { Router, Request, Response } from 'express';
import { mcpServerService } from './mcp-server.service';
import { apiKeyGuard } from './auth/api-key.guard';
import { McpRequest } from './types/mcp.types';
import logger from '../config/logger';

const router = Router();

// Wszystkie endpointy wymagają klucza API
router.use(apiKeyGuard);

/**
 * POST /search
 * Wyszukiwanie w CRM
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Parametr "query" jest wymagany'
      });
    }

    const result = await mcpServerService.executeTool(
      'search',
      { query },
      (req as McpRequest).mcpContext
    );

    // Parse response from MCP format
    const text = result.content?.[0]?.text || '';

    return res.json({
      success: !result.isError,
      results: text,
      raw: result
    });
  } catch (error) {
    logger.error('[ChatGPT Actions] Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd wyszukiwania'
    });
  }
});

/**
 * POST /details
 * Szczegóły obiektu
 */
router.post('/details', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({
        success: false,
        error: 'Parametry "type" i "id" są wymagane'
      });
    }

    const validTypes = ['company', 'contact', 'deal', 'task', 'stream'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Nieprawidłowy typ. Dozwolone: ${validTypes.join(', ')}`
      });
    }

    const result = await mcpServerService.executeTool(
      'get_details',
      { type, id },
      (req as McpRequest).mcpContext
    );

    const text = result.content?.[0]?.text || '';

    return res.json({
      success: !result.isError,
      data: text,
      raw: result
    });
  } catch (error) {
    logger.error('[ChatGPT Actions] Details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd pobierania szczegółów'
    });
  }
});

/**
 * POST /notes
 * Tworzenie notatki
 */
router.post('/notes', async (req: Request, res: Response) => {
  try {
    const { target_type, target_id, content } = req.body;

    if (!target_type || !target_id || !content) {
      return res.status(400).json({
        success: false,
        error: 'Parametry "target_type", "target_id" i "content" są wymagane'
      });
    }

    const validTypes = ['company', 'contact', 'deal'];
    if (!validTypes.includes(target_type)) {
      return res.status(400).json({
        success: false,
        error: `Nieprawidłowy typ. Dozwolone: ${validTypes.join(', ')}`
      });
    }

    const result = await mcpServerService.executeTool(
      'create_note',
      { target_type, target_id, content },
      (req as McpRequest).mcpContext
    );

    const text = result.content?.[0]?.text || '';

    return res.status(result.isError ? 400 : 201).json({
      success: !result.isError,
      message: text,
      raw: result
    });
  } catch (error) {
    logger.error('[ChatGPT Actions] Create note error:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd tworzenia notatki'
    });
  }
});

/**
 * POST /tasks
 * Lista zadań
 */
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { filter = 'today' } = req.body;

    const validFilters = ['today', 'overdue', 'this_week', 'all'];
    if (!validFilters.includes(filter)) {
      return res.status(400).json({
        success: false,
        error: `Nieprawidłowy filtr. Dozwolone: ${validFilters.join(', ')}`
      });
    }

    const result = await mcpServerService.executeTool(
      'list_tasks',
      { filter },
      (req as McpRequest).mcpContext
    );

    const text = result.content?.[0]?.text || '';

    return res.json({
      success: !result.isError,
      tasks: text,
      raw: result
    });
  } catch (error) {
    logger.error('[ChatGPT Actions] List tasks error:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd pobierania zadań'
    });
  }
});

/**
 * GET /pipeline-stats
 * Statystyki pipeline
 */
router.get('/pipeline-stats', async (req: Request, res: Response) => {
  try {
    const result = await mcpServerService.executeTool(
      'get_pipeline_stats',
      {},
      (req as McpRequest).mcpContext
    );

    const text = result.content?.[0]?.text || '';

    return res.json({
      success: !result.isError,
      stats: text,
      raw: result
    });
  } catch (error) {
    logger.error('[ChatGPT Actions] Pipeline stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd pobierania statystyk'
    });
  }
});

/**
 * GET /openapi.yaml
 * Zwraca OpenAPI schema dla ChatGPT
 */
router.get('/openapi.yaml', (req: Request, res: Response) => {
  return res.redirect('/api/v1/mcp/openapi.yaml');
});

export default router;
