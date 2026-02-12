import { Router } from 'express';
import { EventBusController } from './event-bus.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';
import { userRateLimit } from '../../shared/middleware/rateLimit';

const router = Router();
const eventBusController = new EventBusController();

// All event routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/events/status
 * Get event bus status (Redis connection)
 * Requires: ADMIN or OWNER role
 */
router.get('/status', requireRole(['ADMIN', 'OWNER']), eventBusController.status);

/**
 * POST /api/v1/events
 * Publish a new event
 * Requires: authenticated user (any role)
 * Body: { type: string, source: string, data?: object, metadata?: object }
 */
router.post('/', userRateLimit, eventBusController.publish);

/**
 * GET /api/v1/events
 * List events for the organization
 * Requires: ADMIN or OWNER role
 * Query params: type, source, organizationId, userId, from, to, page, limit
 */
router.get('/', userRateLimit, requireRole(['ADMIN', 'OWNER']), eventBusController.list);

/**
 * GET /api/v1/events/:id
 * Get a single event by ID
 * Requires: ADMIN or OWNER role
 */
router.get('/:id', userRateLimit, requireRole(['ADMIN', 'OWNER']), eventBusController.getById);

export default router;
