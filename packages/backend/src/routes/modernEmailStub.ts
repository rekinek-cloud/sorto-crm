/**
 * Modern Email Stub Routes
 * Placeholder routes when @sendgrid/mail is not installed
 */

import { Router } from 'express';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/modern-email/templates
router.get('/templates', authenticateToken, async (req, res) => {
  return res.status(501).json({
    status: 'not_implemented',
    message: 'Email marketing jest w trakcie wdrazania'
  });
});

// GET /api/v1/modern-email/stats
router.get('/stats', authenticateToken, async (req, res) => {
  return res.status(501).json({
    status: 'not_implemented',
    message: 'Email marketing jest w trakcie wdrazania'
  });
});

// GET /api/v1/modern-email/health
router.get('/health', async (req, res) => {
  return res.status(501).json({
    status: 'not_implemented',
    message: 'Email marketing jest w trakcie wdrazania'
  });
});

// POST /api/v1/modern-email/send (stub)
router.post('/send', authenticateToken, async (req, res) => {
  return res.status(501).json({
    status: 'not_implemented',
    message: 'Email marketing jest w trakcie wdrazania'
  });
});

export default router;
