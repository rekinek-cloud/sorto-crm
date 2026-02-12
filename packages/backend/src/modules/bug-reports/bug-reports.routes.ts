import { Router } from 'express';
import { BugReportsController } from './bug-reports.controller';
import { authenticateToken } from '../../shared/middleware/auth';

const router = Router();
const controller = new BugReportsController();

// All routes require authentication
router.use(authenticateToken);

// Create bug report
router.post('/', controller.create);

// List all bug reports
router.get('/', controller.list);

// Get stats (must be before /:id to avoid matching 'stats' as id)
router.get('/stats/overview', controller.getStats);

// Get specific bug report
router.get('/:id', controller.getById);

// Update bug report status
router.patch('/:id/status', controller.updateStatus);

// Delete bug report
router.delete('/:id', controller.delete);

export default router;
