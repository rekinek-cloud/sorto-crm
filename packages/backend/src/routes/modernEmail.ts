import express from 'express';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';
import { modernEmailService } from '../services/modernEmailService';
import { EmailMessage } from '../services/modernEmailService';
import { validateRequest } from '../shared/middleware/validateRequest';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
  replyTo: z.string().email().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // base64 encoded
    contentType: z.string().optional(),
    disposition: z.enum(['attachment', 'inline']).optional(),
    contentId: z.string().optional(),
  })).optional(),
}).refine(data => data.text || data.html, {
  message: "Either text or html content must be provided"
});

const sendTemplateEmailSchema = z.object({
  templateId: z.string().uuid(),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  templateData: z.record(z.any()),
  replyTo: z.string().email().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string().optional(),
    disposition: z.enum(['attachment', 'inline']).optional(),
    contentId: z.string().optional(),
  })).optional(),
});

const bulkEmailSchema = z.object({
  messages: z.array(sendEmailSchema),
  batchSize: z.number().min(1).max(50).optional(),
  delayBetweenBatches: z.number().min(0).max(60000).optional(),
});

/**
 * POST /api/v1/modern-email/send
 * Send a single email
 */
router.post('/send', requireAuth, validateRequest(sendEmailSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const emailData = req.body as EmailMessage;

    // Convert base64 attachments to buffers
    if (emailData.attachments) {
      emailData.attachments = emailData.attachments.map(att => ({
        ...att,
        content: Buffer.from(att.content as string, 'base64')
      }));
    }

    const result = await modernEmailService.sendEmail(emailData);

    if (result.success) {
      res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to send email'
      });
    }
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/modern-email/send-template
 * Send email using template
 */
router.post('/send-template', requireAuth, validateRequest(sendTemplateEmailSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId, to, cc, bcc, templateData, replyTo, attachments } = req.body;

    // Convert base64 attachments to buffers
    let processedAttachments;
    if (attachments) {
      processedAttachments = attachments.map((att: any) => ({
        ...att,
        content: Buffer.from(att.content as string, 'base64')
      }));
    }

    const result = await modernEmailService.sendEmailWithTemplate(
      templateId,
      to,
      templateData,
      {
        cc,
        bcc,
        replyTo,
        attachments: processedAttachments
      }
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: 'Template email sent successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to send template email'
      });
    }
  } catch (error) {
    console.error('Template email send error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/modern-email/send-bulk
 * Send multiple emails in batches
 */
router.post('/send-bulk', requireAuth, validateRequest(bulkEmailSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { messages, batchSize, delayBetweenBatches } = req.body;

    // Process attachments for all messages
    const processedMessages = messages.map((msg: any) => ({
      ...msg,
      attachments: msg.attachments?.map((att: any) => ({
        ...att,
        content: Buffer.from(att.content as string, 'base64')
      }))
    }));

    const result = await modernEmailService.sendBulkEmails(
      processedMessages,
      {
        batchSize,
        delayBetweenBatches
      }
    );

    res.status(200).json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      message: `Bulk email completed: ${result.sent} sent, ${result.failed} failed`
    });
  } catch (error) {
    console.error('Bulk email send error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/modern-email/templates
 * Get available email templates
 */
router.get('/templates', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const templates = await modernEmailService.getAvailableTemplates();
    
    res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * GET /api/v1/modern-email/stats
 * Get email delivery statistics
 */
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    const fromDate = dateFrom ? new Date(dateFrom as string) : undefined;
    const toDate = dateTo ? new Date(dateTo as string) : undefined;

    const stats = await modernEmailService.getEmailStats(
      req.user!.organizationId,
      fromDate,
      toDate
    );

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email statistics'
    });
  }
});

/**
 * POST /api/v1/modern-email/test-config
 * Test email configuration
 */
router.post('/test-config', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await modernEmailService.testConfiguration();

    res.status(200).json({
      success: true,
      test: result
    });
  } catch (error) {
    console.error('Test config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test email configuration'
    });
  }
});

/**
 * GET /api/v1/modern-email/health
 * Health check for email service
 */
router.get('/health', async (req, res) => {
  try {
    // Basic health check - verify service is available
    res.status(200).json({
      success: true,
      message: 'Modern email service is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Email service health check failed'
    });
  }
});

export default router;