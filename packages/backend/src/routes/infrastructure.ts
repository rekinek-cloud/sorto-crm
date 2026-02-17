/**
 * Infrastructure API Routes
 * FAZA-4: Unified Infrastructure Dashboard
 *
 * Endpoints for monitoring servers, containers, logs, and health status
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { infrastructureService } from '../services/InfrastructureService';
import logger from '../config/logger';

const router = Router();

// Wszystkie endpointy wymagają autentykacji i roli ADMIN/OWNER
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'OWNER']));

// ============================================
// OVERVIEW
// ============================================

/**
 * GET /overview
 * Podsumowanie całej infrastruktury
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const overview = await infrastructureService.getOverview();
    return res.json(overview);
  } catch (error) {
    logger.error('Error getting infrastructure overview:', error);
    return res.status(500).json({ error: 'Failed to get infrastructure overview' });
  }
});

// ============================================
// SERVER METRICS
// ============================================

/**
 * GET /server
 * Metryki serwera (CPU, RAM, Disk, Uptime)
 */
router.get('/server', async (req: Request, res: Response) => {
  try {
    const metrics = await infrastructureService.getServerMetrics();
    return res.json(metrics);
  } catch (error) {
    logger.error('Error getting server metrics:', error);
    return res.status(500).json({ error: 'Failed to get server metrics' });
  }
});

/**
 * GET /disk
 * Użycie dysku
 */
router.get('/disk', async (req: Request, res: Response) => {
  try {
    const diskUsage = await infrastructureService.getDiskUsage();
    return res.json(diskUsage);
  } catch (error) {
    logger.error('Error getting disk usage:', error);
    return res.status(500).json({ error: 'Failed to get disk usage' });
  }
});

// ============================================
// CONTAINERS
// ============================================

/**
 * GET /containers
 * Lista kontenerów Docker
 */
router.get('/containers', async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === 'true';
    const containers = await infrastructureService.getContainers(showAll);
    return res.json(containers);
  } catch (error) {
    logger.error('Error listing containers:', error);
    return res.status(500).json({ error: 'Failed to list containers' });
  }
});

/**
 * GET /containers/:name/stats
 * Statystyki kontenera (CPU, RAM, Network I/O)
 */
router.get('/containers/:name/stats', async (req: Request, res: Response) => {
  try {
    const stats = await infrastructureService.getContainerStats(req.params.name);
    if (!stats) {
      return res.status(404).json({ error: 'Container not found' });
    }
    return res.json(stats);
  } catch (error) {
    logger.error('Error getting container stats:', error);
    return res.status(500).json({ error: 'Failed to get container stats' });
  }
});

/**
 * POST /containers/:name/restart
 * Restart kontenera
 */
router.post('/containers/:name/restart', async (req: Request, res: Response) => {
  try {
    const result = await infrastructureService.restartContainer(req.params.name);
    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }
    return res.json(result);
  } catch (error) {
    logger.error('Error restarting container:', error);
    return res.status(500).json({ error: 'Failed to restart container' });
  }
});

/**
 * POST /containers/:name/stop
 * Zatrzymanie kontenera
 */
router.post('/containers/:name/stop', async (req: Request, res: Response) => {
  try {
    const result = await infrastructureService.stopContainer(req.params.name);
    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }
    return res.json(result);
  } catch (error) {
    logger.error('Error stopping container:', error);
    return res.status(500).json({ error: 'Failed to stop container' });
  }
});

/**
 * POST /containers/:name/start
 * Uruchomienie kontenera
 */
router.post('/containers/:name/start', async (req: Request, res: Response) => {
  try {
    const result = await infrastructureService.startContainer(req.params.name);
    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }
    return res.json(result);
  } catch (error) {
    logger.error('Error starting container:', error);
    return res.status(500).json({ error: 'Failed to start container' });
  }
});

// ============================================
// LOGS
// ============================================

/**
 * GET /containers/:name/logs
 * Logi kontenera
 */
router.get('/containers/:name/logs', async (req: Request, res: Response) => {
  try {
    const lines = parseInt(req.query.lines as string) || 100;
    const logs = await infrastructureService.getContainerLogs(req.params.name, lines);
    return res.json({ logs });
  } catch (error) {
    logger.error('Error getting container logs:', error);
    return res.status(500).json({ error: 'Failed to get container logs' });
  }
});

/**
 * GET /containers/:name/logs/search
 * Szukaj w logach kontenera
 */
router.get('/containers/:name/logs/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const lines = parseInt(req.query.lines as string) || 500;
    const results = await infrastructureService.searchContainerLogs(req.params.name, query, lines);
    return res.json({ results, count: results.length });
  } catch (error) {
    logger.error('Error searching logs:', error);
    return res.status(500).json({ error: 'Failed to search logs' });
  }
});

/**
 * GET /containers/:name/logs/errors
 * Błędy z logów kontenera
 */
router.get('/containers/:name/logs/errors', async (req: Request, res: Response) => {
  try {
    const lines = parseInt(req.query.lines as string) || 500;
    const errors = await infrastructureService.getErrorLogs(req.params.name, lines);
    return res.json({ errors, count: errors.length });
  } catch (error) {
    logger.error('Error getting error logs:', error);
    return res.status(500).json({ error: 'Failed to get error logs' });
  }
});

/**
 * GET /system/logs
 * Logi systemowe (journalctl)
 */
router.get('/system/logs', async (req: Request, res: Response) => {
  try {
    const service = req.query.service as string;
    const lines = parseInt(req.query.lines as string) || 50;
    const logs = await infrastructureService.getSystemLogs(service, lines);
    return res.json({ logs });
  } catch (error) {
    logger.error('Error getting system logs:', error);
    return res.status(500).json({ error: 'Failed to get system logs' });
  }
});

// ============================================
// HEALTH & UPTIME
// ============================================

/**
 * GET /health
 * Status wszystkich monitorowanych aplikacji
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await infrastructureService.getAllAppsHealth();

    const summary = {
      total: health.length,
      up: health.filter(h => h.status === 'up').length,
      down: health.filter(h => h.status === 'down').length,
      error: health.filter(h => h.status === 'error').length
    };

    return res.json({ summary, apps: health });
  } catch (error) {
    logger.error('Error getting health status:', error);
    return res.status(500).json({ error: 'Failed to get health status' });
  }
});

// ============================================
// DATABASES
// ============================================

/**
 * GET /databases
 * Status baz danych
 */
router.get('/databases', async (req: Request, res: Response) => {
  try {
    const databases = await infrastructureService.getDatabasesStatus();
    return res.json(databases);
  } catch (error) {
    logger.error('Error getting database status:', error);
    return res.status(500).json({ error: 'Failed to get database status' });
  }
});

// ============================================
// GITHUB REPOSITORIES
// ============================================

/**
 * GET /github/repos
 * Lista repozytoriów z GitHub
 */
router.get('/github/repos', async (req: Request, res: Response) => {
  try {
    const repos = await infrastructureService.getGitHubRepos();
    return res.json(repos);
  } catch (error) {
    logger.error('Error getting GitHub repos:', error);
    return res.status(500).json({ error: 'Failed to get GitHub repositories' });
  }
});

/**
 * GET /github/repos/new
 * Nowe repozytoria (niezainstalowane)
 */
router.get('/github/repos/new', async (req: Request, res: Response) => {
  try {
    const repos = await infrastructureService.getNewGitHubRepos();
    return res.json(repos);
  } catch (error) {
    logger.error('Error getting new repos:', error);
    return res.status(500).json({ error: 'Failed to get new repositories' });
  }
});

/**
 * POST /github/repos/:name/clone
 * Sklonuj repozytorium
 */
router.post('/github/repos/:name/clone', async (req: Request, res: Response) => {
  try {
    const { branch } = req.body;
    const result = await infrastructureService.cloneGitHubRepo(req.params.name, branch);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    return res.json(result);
  } catch (error) {
    logger.error('Error cloning repo:', error);
    return res.status(500).json({ error: 'Failed to clone repository' });
  }
});

/**
 * GET /github/sync-status
 * Status synchronizacji repozytoriów
 */
router.get('/github/sync-status', async (req: Request, res: Response) => {
  try {
    const status = await infrastructureService.getReposSyncStatus();
    return res.json(status);
  } catch (error) {
    logger.error('Error getting sync status:', error);
    return res.status(500).json({ error: 'Failed to get sync status' });
  }
});

/**
 * POST /github/repos/:name/pull
 * Pull najnowszych zmian
 */
router.post('/github/repos/:name/pull', async (req: Request, res: Response) => {
  try {
    const result = await infrastructureService.pullGitHubRepo(req.params.name);
    return res.json(result);
  } catch (error) {
    logger.error('Error pulling repo:', error);
    return res.status(500).json({ error: 'Failed to pull repository' });
  }
});

export default router;
