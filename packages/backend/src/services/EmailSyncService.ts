/**
 * EmailSyncService - Service for synchronizing emails from IMAP accounts to database
 * Handles background sync, deduplication, and message processing
 */

import { PrismaClient, EmailAccount, EmailAccountStatus } from '@prisma/client';
import IMAPService, { IMAPConfig, EmailMessage } from './IMAPService';
import logger from '../config/logger';
import crypto from 'crypto';

export interface SyncResult {
  accountId: string;
  success: boolean;
  messagesProcessed: number;
  newMessages: number;
  errors: string[];
  duration: number;
}

export interface SyncOptions {
  limit?: number;
  folders?: string[];
  forceSync?: boolean;
  markAsRead?: boolean;
}

export class EmailSyncService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Sync all active email accounts
   */
  async syncAllAccounts(options: SyncOptions = {}): Promise<SyncResult[]> {
    const startTime = Date.now();
    
    logger.info('🔄 Starting email sync for all accounts', {
      service: 'email-sync',
      options
    });

    const accounts = await this.prisma.emailAccount.findMany({
      where: {
        isActive: true,
        status: EmailAccountStatus.ACTIVE
      }
    });

    const results: SyncResult[] = [];

    for (const account of accounts) {
      try {
        const result = await this.syncAccount(account.id, options);
        results.push(result);
      } catch (error) {
        logger.error(`❌ Failed to sync account ${account.email}: ${error}`, {
          service: 'email-sync',
          accountId: account.id,
          email: account.email,
          error: error instanceof Error ? error.message : String(error)
        });

        results.push({
          accountId: account.id,
          success: false,
          messagesProcessed: 0,
          newMessages: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          duration: Date.now() - startTime
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    const totalMessages = results.reduce((sum, r) => sum + r.newMessages, 0);

    logger.info(`✅ Email sync completed for ${accounts.length} accounts`, {
      service: 'email-sync',
      duration: totalDuration,
      totalNewMessages: totalMessages,
      successfulAccounts: results.filter(r => r.success).length
    });

    return results;
  }

  /**
   * Sync single email account
   */
  async syncAccount(accountId: string, options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    logger.info(`📧 Starting sync for account ${accountId}`, {
      service: 'email-sync',
      accountId,
      options
    });

    try {
      // Get account details
      const account = await this.prisma.emailAccount.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error(`Email account ${accountId} not found`);
      }

      if (!account.isActive || account.status !== EmailAccountStatus.ACTIVE) {
        throw new Error(`Email account ${account.email} is not active`);
      }

      // Prepare IMAP configuration
      const imapConfig: IMAPConfig = {
        host: account.imapHost,
        port: account.imapPort,
        tls: account.imapSecure,
        user: account.imapUsername,
        password: account.imapPassword // TODO: Decrypt encrypted password
      };

      // Connect to IMAP
      const imapService = new IMAPService(imapConfig, this.prisma);
      await imapService.connect();

      let totalProcessed = 0;
      let totalNew = 0;

      // Sync configured folders
      const foldersToSync = options.folders || account.syncFolders;
      
      for (const folder of foldersToSync) {
        try {
          await imapService.openFolder(folder, true);
          
          // Build search criteria based on last sync
          const searchCriteria: string[] = [];
          
          if (!options.forceSync && account.lastSyncAt) {
            const sinceDate = account.lastSyncAt.toISOString().split('T')[0];
            searchCriteria.push('SINCE', sinceDate);
          } else {
            searchCriteria.push('ALL');
          }

          // Fetch emails
          const emails = await imapService.fetchEmails(
            searchCriteria,
            options.limit || account.maxMessages
          );

          logger.info(`📬 Found ${emails.length} emails in folder ${folder}`, {
            service: 'email-sync',
            accountId,
            folder,
            emailCount: emails.length
          });

          // Process each email
          for (const email of emails) {
            try {
              const processed = await this.processEmail(account, email, folder);
              if (processed) {
                totalNew++;
              }
              totalProcessed++;

              // Mark as read if option is enabled
              if (options.markAsRead) {
                await imapService.markAsRead(email.uid);
              }
            } catch (emailError) {
              const errorMsg = `Error processing email UID ${email.uid}: ${emailError}`;
              errors.push(errorMsg);
              logger.error(errorMsg, {
                service: 'email-sync',
                accountId,
                uid: email.uid,
                folder
              });
            }
          }
        } catch (folderError) {
          const errorMsg = `Error syncing folder ${folder}: ${folderError}`;
          errors.push(errorMsg);
          logger.error(errorMsg, {
            service: 'email-sync',
            accountId,
            folder
          });
        }
      }

      // Disconnect from IMAP
      await imapService.disconnect();

      // Update account sync status
      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: {
          lastSyncAt: new Date(),
          syncCount: {
            increment: totalNew
          },
          errorMessage: errors.length > 0 ? errors.join('; ') : null,
          lastErrorAt: errors.length > 0 ? new Date() : null
        }
      });

      const duration = Date.now() - startTime;

      logger.info(`✅ Account sync completed: ${account.email}`, {
        service: 'email-sync',
        accountId,
        messagesProcessed: totalProcessed,
        newMessages: totalNew,
        errors: errors.length,
        duration
      });

      return {
        accountId,
        success: true,
        messagesProcessed: totalProcessed,
        newMessages: totalNew,
        errors,
        duration
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Update account with error status
      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: {
          status: EmailAccountStatus.ERROR,
          errorMessage: errorMsg,
          lastErrorAt: new Date()
        }
      }).catch(updateError => {
        logger.error(`Failed to update account error status: ${updateError}`, {
          service: 'email-sync',
          accountId
        });
      });

      const duration = Date.now() - startTime;

      return {
        accountId,
        success: false,
        messagesProcessed: 0,
        newMessages: 0,
        errors: [errorMsg],
        duration
      };
    }
  }

  /**
   * Process individual email and save to database
   */
  private async processEmail(
    account: EmailAccount,
    email: EmailMessage,
    folder: string
  ): Promise<boolean> {
    try {
      // Generate unique hash for deduplication
      const emailHash = this.generateEmailHash(email);

      // Check if email already exists
      const existingMessage = await this.prisma.message.findFirst({
        where: {
          emailAccountId: account.id,
          imapUid: email.uid,
          imapFolder: folder
        }
      });

      if (existingMessage) {
        logger.debug(`Email already exists: UID ${email.uid}`, {
          service: 'email-sync',
          accountId: account.id,
          uid: email.uid
        });
        return false;
      }

      // Get or create communication channel for this email account
      const channel = await this.getOrCreateChannel(account);

      // Parse addresses
      const fromAddress = this.extractEmailAddress(email.from);
      const toAddresses = email.to.map(addr => this.extractEmailAddress(addr));
      const ccAddresses = email.cc?.map(addr => this.extractEmailAddress(addr)) || [];
      const bccAddresses = email.bcc?.map(addr => this.extractEmailAddress(addr)) || [];

      // Determine message type
      const messageType = this.determineMessageType(folder, fromAddress, account.email);

      // Calculate urgency score (simple heuristic)
      const urgencyScore = this.calculateUrgencyScore(email);

      // Create message record
      const message = await this.prisma.message.create({
        data: {
          channelId: channel.id,
          messageId: email.messageId,
          subject: email.subject.substring(0, 500), // Limit subject length
          content: email.textContent,
          htmlContent: email.htmlContent,
          fromAddress,
          fromName: this.extractDisplayName(email.from),
          toAddress: toAddresses[0] || '',
          ccAddress: ccAddresses,
          bccAddress: bccAddresses,
          messageType,
          isRead: email.flags.includes('\\Seen'),
          isStarred: email.flags.includes('\\Flagged'),
          sentAt: email.date,
          receivedAt: new Date(),
          urgencyScore,
          actionNeeded: urgencyScore > 0.7,
          needsResponse: this.needsResponse(email),
          organizationId: account.organizationId,
          
          // IMAP specific fields
          emailAccountId: account.id,
          imapUid: email.uid,
          imapFolder: folder,
          emailHeaders: email.headers as any,
          rawEmail: JSON.stringify(email) // Store complete email for backup
        }
      });

      // Process attachments if any
      if (email.attachments && email.attachments.length > 0) {
        await this.processAttachments(message.id, email.attachments);
      }

      logger.debug(`✅ Email processed and saved: ${email.subject}`, {
        service: 'email-sync',
        messageId: message.id,
        uid: email.uid,
        subject: email.subject.substring(0, 100)
      });

      return true;

    } catch (error) {
      logger.error(`❌ Error processing email UID ${email.uid}: ${error}`, {
        service: 'email-sync',
        accountId: account.id,
        uid: email.uid,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get or create communication channel for email account
   */
  private async getOrCreateChannel(account: EmailAccount) {
    const channelName = `Email: ${account.name}`;
    
    let channel = await this.prisma.communicationChannel.findFirst({
      where: {
        name: channelName,
        organizationId: account.organizationId
      }
    });

    if (!channel) {
      channel = await this.prisma.communicationChannel.create({
        data: {
          name: channelName,
          type: 'EMAIL',
          isActive: true,
          organizationId: account.organizationId,
          userId: account.userId
        }
      });
    }

    return channel;
  }

  /**
   * Generate hash for email deduplication
   */
  private generateEmailHash(email: EmailMessage): string {
    const content = `${email.messageId}|${email.subject}|${email.from}|${email.date?.toISOString()}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Extract email address from string like "Name <email@domain.com>"
   */
  private extractEmailAddress(input: string): string {
    const match = input.match(/<([^>]+)>/);
    return match ? match[1] : input.trim();
  }

  /**
   * Extract display name from string like "Name <email@domain.com>"
   */
  private extractDisplayName(input: string): string {
    const match = input.match(/^([^<]+)</);
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
  }

  /**
   * Determine message type based on folder and addresses
   */
  private determineMessageType(folder: string, fromAddress: string, accountEmail: string): string {
    if (folder.toLowerCase().includes('sent')) {
      return 'SENT';
    }
    
    if (folder.toLowerCase().includes('draft')) {
      return 'DRAFT';
    }
    
    if (fromAddress.toLowerCase() === accountEmail.toLowerCase()) {
      return 'SENT';
    }
    
    return 'INBOX';
  }

  /**
   * Calculate urgency score based on email content and metadata
   */
  private calculateUrgencyScore(email: EmailMessage): number {
    let score = 0.3; // Base score

    // Check subject for urgency keywords
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'immediate', 'critical', 'pilne', 'nagły'];
    const subject = (email.subject || '').toLowerCase();
    
    for (const keyword of urgentKeywords) {
      if (subject.includes(keyword)) {
        score += 0.3;
        break;
      }
    }

    // Check for priority flags
    if (email.flags.includes('\\Flagged')) {
      score += 0.2;
    }

    // Recent emails get slight boost
    const hoursSinceReceived = (Date.now() - email.date.getTime()) / (1000 * 60 * 60);
    if (hoursSinceReceived < 24) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Determine if email needs response
   */
  private needsResponse(email: EmailMessage): boolean {
    const content = (email.textContent || '').toLowerCase();
    const responseKeywords = ['?', 'please respond', 'let me know', 'get back to me', 'odpowiedz'];
    
    return responseKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Process email attachments
   */
  private async processAttachments(messageId: string, attachments: any[]): Promise<void> {
    for (const attachment of attachments) {
      try {
        await this.prisma.messageAttachment.create({
          data: {
            messageId,
            filename: attachment.filename || 'attachment',
            contentType: attachment.contentType || 'application/octet-stream',
            size: attachment.size || 0,
            contentId: attachment.cid,
            content: attachment.content ? Buffer.from(attachment.content) : Buffer.alloc(0)
          }
        });
      } catch (error) {
        logger.error(`❌ Error saving attachment: ${error}`, {
          service: 'email-sync',
          messageId,
          filename: attachment.filename
        });
      }
    }
  }

  /**
   * Clean up old sync data
   */
  async cleanupOldData(daysToKeep = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.message.deleteMany({
      where: {
        receivedAt: {
          lt: cutoffDate
        },
        emailAccountId: {
          not: null
        }
      }
    });

    logger.info(`🧹 Cleaned up ${result.count} old email messages`, {
      service: 'email-sync',
      deletedCount: result.count,
      cutoffDate
    });
  }
}

export default EmailSyncService;