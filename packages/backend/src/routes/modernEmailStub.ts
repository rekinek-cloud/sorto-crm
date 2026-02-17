/**
 * Modern Email Stub Routes
 * Placeholder routes when @sendgrid/mail is not installed
 */

import { Router } from 'express';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/modern-email/templates
router.get('/templates', authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    data: [],
    message: 'Email service not configured. Install @sendgrid/mail to enable.'
  });
});

// GET /api/v1/modern-email/stats
router.get('/stats', authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    data: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0
    },
    message: 'Email service not configured. Install @sendgrid/mail to enable.'
  });
});

// GET /api/v1/modern-email/health
router.get('/health', async (req, res) => {
  return res.json({
    success: false,
    status: 'not_configured',
    message: 'Email service requires @sendgrid/mail package'
  });
});

// POST /api/v1/modern-email/send (stub)
router.post('/send', authenticateToken, async (req, res) => {
  return res.status(503).json({
    success: false,
    error: 'Email service not configured. Install @sendgrid/mail to enable.'
  });
});

export default router;
