/**
 * Email Accounts Routes - API endpoints for managing IMAP/SMTP email accounts
 * Handles CRUD operations, testing connections, and triggering sync
 */

import { Router } from 'express';
import { PrismaClient, EmailProvider, EmailAccountStatus } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticateToken as auth } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';
import logger from '../config/logger';
import IMAPService from '../services/IMAPService';
import SMTPService from '../services/SMTPService';
import EmailSyncService from '../services/EmailSyncService';
// scheduledTasksService not used - sync handled directly via EmailSyncService

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createEmailAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  provider: z.nativeEnum(EmailProvider),
  
  // IMAP Configuration
  imapHost: z.string().min(1, 'IMAP host is required'),
  imapPort: z.number().min(1).max(65535),
  imapSecure: z.boolean(),
  imapUsername: z.string().min(1, 'IMAP username is required'),
  imapPassword: z.string().min(1, 'IMAP password is required'),
  
  // SMTP Configuration
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.number().min(1).max(65535),
  smtpSecure: z.boolean(),
  smtpUsername: z.string().min(1, 'SMTP username is required'),
  smtpPassword: z.string().min(1, 'SMTP password is required'),
  
  // Sync Settings
  syncIntervalMin: z.number().min(1).max(1440).default(5),
  maxMessages: z.number().min(10).max(10000).default(1000),
  syncFolders: z.array(z.string()).default(['INBOX', 'Sent', 'Drafts'])
});

const updateEmailAccountSchema = createEmailAccountSchema.partial();

const testConnectionSchema = z.object({
  provider: z.nativeEnum(EmailProvider),
  
  // IMAP Configuration
  imapHost: z.string().min(1),
  imapPort: z.number().min(1).max(65535),
  imapSecure: z.boolean(),
  imapUsername: z.string().min(1),
  imapPassword: z.string().min(1),
  
  // SMTP Configuration (optional for test)
  smtpHost: z.string().min(1).optional(),
  smtpPort: z.number().min(1).max(65535).optional(),
  smtpSecure: z.boolean().optional(),
  smtpUsername: z.string().min(1).optional(),
  smtpPassword: z.string().min(1).optional()
});

/**
 * GET /api/v1/email-accounts
 * Get all email accounts for the organization
 */
router.get('/', auth, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    
    const accounts = await prisma.email_accounts.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        isActive: true,
        status: true,
        lastSyncAt: true,
        syncCount: true,
        syncIntervalMin: true,
        maxMessages: true,
        syncFolders: true,
        errorMessage: true,
        lastErrorAt: true,
        createdAt: true,
        updatedAt: true
        // Passwords are excluded for security
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });

  } catch (error) {
    logger.error('Error fetching email accounts:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email accounts'
    });
  }
});

/**
 * GET /api/v1/email-accounts/providers
 * Get available email providers with their default configurations
 */
router.get('/providers', auth, async (req, res) => {
  try {
    const providers = [
      {
        provider: 'GMAIL',
        name: 'Gmail',
        description: 'Google Gmail service',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        imapSecure: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: false,
        helpText: 'Use App Password instead of regular password for Gmail accounts with 2FA enabled'
      },
      {
        provider: 'OUTLOOK',
        name: 'Outlook/Hotmail',
        description: 'Microsoft Outlook/Hotmail service',
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        imapSecure: true,
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        smtpSecure: false,
        helpText: 'Works with Outlook.com, Hotmail.com, and Live.com accounts'
      },
      {
        provider: 'YAHOO',
        name: 'Yahoo Mail',
        description: 'Yahoo Mail service',
        imapHost: 'imap.mail.yahoo.com',
        imapPort: 993,
        imapSecure: true,
        smtpHost: 'smtp.mail.yahoo.com',
        smtpPort: 587,
        smtpSecure: false,
        helpText: 'Enable IMAP access in Yahoo Mail settings'
      },
      {
        provider: 'EXCHANGE',
        name: 'Exchange Server',
        description: 'Microsoft Exchange Server',
        imapHost: 'mail.exchange.microsoft.com',
        imapPort: 993,
        imapSecure: true,
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpSecure: false,
        helpText: 'For corporate Exchange accounts'
      },
      {
        provider: 'CUSTOM',
        name: 'Custom IMAP Server',
        description: 'Custom IMAP/SMTP configuration',
        imapHost: '',
        imapPort: 993,
        imapSecure: true,
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false,
        helpText: 'Enter your custom IMAP and SMTP server details'
      }
    ];

    res.json({
      success: true,
      data: providers
    });

  } catch (error) {
    logger.error('Error fetching providers:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email providers'
    });
  }
});

/**
 * GET /api/v1/email-accounts/:id
 * Get specific email account details
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const account = await prisma.email_accounts.findFirst({
      where: { 
        id,
        organizationId 
      },
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        imapHost: true,
        imapPort: true,
        imapSecure: true,
        imapUsername: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUsername: true,
        isActive: true,
        status: true,
        lastSyncAt: true,
        syncCount: true,
        syncIntervalMin: true,
        maxMessages: true,
        syncFolders: true,
        errorMessage: true,
        lastErrorAt: true,
        createdAt: true,
        updatedAt: true
        // Passwords are excluded
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Email account not found'
      });
    }

    res.json({
      success: true,
      data: account
    });

  } catch (error) {
    logger.error('Error fetching email account:', { error, accountId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email account'
    });
  }
});

/**
 * POST /api/v1/email-accounts
 * Create new email account
 */
router.post('/', auth, validateRequest(createEmailAccountSchema), async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const accountData = req.body;

    // Check if email already exists for this organization
    const existingAccount = await prisma.email_accounts.findFirst({
      where: {
        organizationId,
        email: accountData.email
      }
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        error: 'Email account already exists for this organization'
      });
    }

    // Encrypt passwords (simple encryption - in production use proper encryption)
    const saltRounds = 10;
    const encryptedImapPassword = await bcrypt.hash(accountData.imapPassword, saltRounds);
    const encryptedSmtpPassword = await bcrypt.hash(accountData.smtpPassword, saltRounds);

    // Create email account
    const account = await prisma.email_accounts.create({
      data: {
        ...accountData,
        imapPassword: encryptedImapPassword,
        smtpPassword: encryptedSmtpPassword,
        organizationId,
        userId,
        status: EmailAccountStatus.PENDING
      },
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        isActive: true,
        status: true,
        createdAt: true
      }
    });

    logger.info('Email account created', {
      accountId: account.id,
      email: account.email,
      provider: account.provider,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: account,
      message: 'Email account created successfully'
    });

  } catch (error) {
    logger.error('Error creating email account:', { error, email: req.body.email });
    res.status(500).json({
      success: false,
      error: 'Failed to create email account'
    });
  }
});

/**
 * PUT /api/v1/email-accounts/:id
 * Update email account
 */
router.put('/:id', auth, validateRequest(updateEmailAccountSchema), async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;
    const updateData = req.body;

    // Check if account exists
    const existingAccount = await prisma.email_accounts.findFirst({
      where: { id, organizationId }
    });

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        error: 'Email account not found'
      });
    }

    // Encrypt passwords if provided
    if (updateData.imapPassword) {
      const saltRounds = 10;
      updateData.imapPassword = await bcrypt.hash(updateData.imapPassword, saltRounds);
    }
    
    if (updateData.smtpPassword) {
      const saltRounds = 10;
      updateData.smtpPassword = await bcrypt.hash(updateData.smtpPassword, saltRounds);
    }

    // Update account
    const account = await prisma.email_accounts.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        isActive: true,
        status: true,
        syncIntervalMin: true,
        maxMessages: true,
        syncFolders: true,
        updatedAt: true
      }
    });

    logger.info('Email account updated', {
      accountId: account.id,
      email: account.email,
      organizationId
    });

    res.json({
      success: true,
      data: account,
      message: 'Email account updated successfully'
    });

  } catch (error) {
    logger.error('Error updating email account:', { error, accountId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to update email account'
    });
  }
});

/**
 * DELETE /api/v1/email-accounts/:id
 * Delete email account
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    // Check if account exists
    const account = await prisma.email_accounts.findFirst({
      where: { id, organizationId }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Email account not found'
      });
    }

    // Delete account (this will cascade delete related messages due to FK constraints)
    await prisma.email_accounts.delete({
      where: { id }
    });

    logger.info('Email account deleted', {
      accountId: id,
      email: account.email,
      organizationId
    });

    res.json({
      success: true,
      message: 'Email account deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting email account:', { error, accountId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to delete email account'
    });
  }
});

/**
 * POST /api/v1/email-accounts/test-connection
 * Test IMAP and SMTP connection without saving
 */
router.post('/test-connection', auth, validateRequest(testConnectionSchema), async (req, res) => {
  try {
    const testData = req.body;
    
    const results = {
      imap: { success: false, error: null as string | null },
      smtp: { success: false, error: null as string | null }
    };

    // Test IMAP connection
    try {
      const imapConfig = {
        host: testData.imapHost,
        port: testData.imapPort,
        tls: testData.imapSecure,
        user: testData.imapUsername,
        password: testData.imapPassword
      };

      results.imap.success = await IMAPService.testConnection(imapConfig, 15000);
    } catch (error) {
      results.imap.error = error instanceof Error ? error.message : String(error);
    }

    // Test SMTP connection if provided
    if (testData.smtpHost && testData.smtpUsername && testData.smtpPassword) {
      try {
        const smtpConfig = {
          host: testData.smtpHost,
          port: testData.smtpPort || 587,
          secure: testData.smtpSecure || false,
          user: testData.smtpUsername,
          password: testData.smtpPassword
        };

        results.smtp.success = await SMTPService.testConfig(smtpConfig, 15000);
      } catch (error) {
        results.smtp.error = error instanceof Error ? error.message : String(error);
      }
    }

    const overallSuccess = results.imap.success && (!testData.smtpHost || results.smtp.success);

    logger.info('Connection test completed', {
      email: testData.imapUsername,
      provider: testData.provider,
      imapSuccess: results.imap.success,
      smtpSuccess: results.smtp.success,
      overallSuccess
    });

    res.json({
      success: overallSuccess,
      data: results,
      message: overallSuccess ? 'Connection test successful' : 'Connection test failed'
    });

  } catch (error) {
    logger.error('Error testing connection:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to test connection'
    });
  }
});

/**
 * POST /api/v1/email-accounts/:id/sync
 * Manually trigger sync for specific account
 */
router.post('/:id/sync', auth, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    // Check if account exists and is active
    const account = await prisma.email_accounts.findFirst({
      where: { 
        id, 
        organizationId,
        isActive: true 
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Email account not found or not active'
      });
    }

    // Trigger sync
    const emailSyncService = new EmailSyncService(prisma);
    const result = await emailSyncService.syncAccount(id, {
      forceSync: true,
      limit: 50
    });

    logger.info('Manual sync triggered', {
      accountId: id,
      email: account.email,
      result
    });

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Sync completed successfully' : 'Sync failed'
    });

  } catch (error) {
    logger.error('Error triggering sync:', { error, accountId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync'
    });
  }
});

/**
 * POST /api/v1/email-accounts/sync-all
 * Manually trigger sync for all active accounts
 */
router.post('/sync-all', auth, async (req, res) => {
  try {
    const { organizationId } = req.user!;

    // Get active accounts count
    const accountCount = await prisma.email_accounts.count({
      where: { 
        organizationId,
        isActive: true,
        status: EmailAccountStatus.ACTIVE
      }
    });

    if (accountCount === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No active email accounts to sync'
      });
    }

    // Get all active accounts for this organization
    const accounts = await prisma.email_accounts.findMany({
      where: {
        organizationId,
        isActive: true,
        status: EmailAccountStatus.ACTIVE
      }
    });

    // Sync each account
    const emailSyncService = new EmailSyncService(prisma);
    const results = [];
    for (const account of accounts) {
      try {
        const result = await emailSyncService.syncAccount(account.id, { forceSync: true, limit: 50 });
        results.push({ accountId: account.id, ...result });
      } catch (err) {
        results.push({ accountId: account.id, success: false, newMessages: 0, error: String(err) });
      }
    }

    const totalNew = results.reduce((sum: number, r: any) => sum + (r.newMessages || 0), 0);
    const successfulAccounts = results.filter((r: any) => r.success).length;

    logger.info('Manual sync all triggered', {
      organizationId,
      totalAccounts: results.length,
      successfulAccounts,
      totalNewMessages: totalNew
    });

    res.json({
      success: true,
      data: results,
      message: `Sync completed for ${successfulAccounts}/${results.length} accounts. ${totalNew} new messages.`
    });

  } catch (error) {
    logger.error('Error triggering sync all:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync for all accounts'
    });
  }
});

export default router;