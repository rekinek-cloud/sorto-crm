/**
 * ChannelEmailSyncService - Integrates CommunicationChannels with IMAP/SMTP
 * Syncs emails from EMAIL type channels
 */

import { PrismaClient, CommunicationChannel, ChannelType } from '@prisma/client';
import IMAPService, { IMAPConfig, EmailMessage } from './IMAPService';
import logger from '../config/logger';
import crypto from 'crypto';

export interface ChannelSyncResult {
  channelId: string;
  channelName: string;
  success: boolean;
  newMessages: number;
  errors: string[];
  duration: number;
}

export class ChannelEmailSyncService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Sync all EMAIL channels for an organization
   */
  async syncAllEmailChannels(organizationId: string): Promise<ChannelSyncResult[]> {
    const results: ChannelSyncResult[] = [];

    try {
      // Get all active EMAIL channels
      const channels = await this.prisma.communicationChannel.findMany({
        where: {
          organizationId,
          type: ChannelType.EMAIL,
          active: true
        }
      });

      logger.info(`Found ${channels.length} EMAIL channels to sync`, {
        service: 'channel-email-sync',
        organizationId
      });

      // Sync each channel
      for (const channel of channels) {
        const result = await this.syncChannel(channel);
        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Error syncing all email channels', {
        service: 'channel-email-sync',
        organizationId,
        error
      });
      throw error;
    }
  }

  /**
   * Sync a single EMAIL channel
   */
  async syncChannel(channel: CommunicationChannel): Promise<ChannelSyncResult> {
    const startTime = Date.now();
    const result: ChannelSyncResult = {
      channelId: channel.id,
      channelName: channel.name,
      success: false,
      newMessages: 0,
      errors: [],
      duration: 0
    };

    try {
      // Extract config
      const config = channel.config as any;
      
      if (!config.host && !config.imapHost) {
        throw new Error('Missing IMAP host configuration');
      }

      // Build IMAP config
      const imapConfig: IMAPConfig = {
        host: config.imapHost || config.host,
        port: config.imapPort || config.port || 993,
        tls: config.imapSecure !== false && config.useSSL !== false,
        user: config.username || channel.emailAddress || '',
        password: config.password || '',
        keepalive: true,
        connTimeout: 30000,
        authTimeout: 30000
      };

      // Create IMAP service
      const imapService = new IMAPService(imapConfig);

      // Connect to IMAP
      await imapService.connect();
      logger.info(`Connected to IMAP for channel: ${channel.name}`, {
        service: 'channel-email-sync',
        channelId: channel.id
      });

      // Fetch new emails
      const syncFolders = config.syncFolders ? 
        (typeof config.syncFolders === 'string' ? 
          config.syncFolders.split(',').map((f: string) => f.trim()) : 
          config.syncFolders) : 
        ['INBOX'];

      let allEmails: EmailMessage[] = [];
      
      for (const folder of syncFolders) {
        try {
          const folderEmails = await imapService.fetchEmails(
            ['UNSEEN'], // Only unread emails
            config.maxMessages || 100,
            folder
          );
          allEmails = allEmails.concat(folderEmails);
        } catch (error) {
          logger.warn(`Failed to fetch from folder ${folder}`, {
            service: 'channel-email-sync',
            channelId: channel.id,
            error
          });
        }
      }

      // Disconnect from IMAP
      await imapService.disconnect();

      // Process and save emails
      for (const email of allEmails) {
        try {
          // Check if message already exists
          const existingMessage = await this.prisma.message.findFirst({
            where: {
              channelId: channel.id,
              OR: [
                { messageId: email.messageId },
                { 
                  AND: [
                    { subject: email.subject },
                    { from: email.from },
                    { sentAt: email.date }
                  ]
                }
              ]
            }
          });

          if (!existingMessage) {
            // Calculate urgency score
            const urgencyScore = this.calculateUrgencyScore(email);

            // Create new message
            await this.prisma.message.create({
              data: {
                channelId: channel.id,
                organizationId: channel.organizationId,
                type: 'INCOMING',
                status: 'PENDING',
                from: email.from,
                to: email.to.join(', '),
                cc: email.cc?.join(', ') || null,
                bcc: email.bcc?.join(', ') || null,
                subject: email.subject,
                body: email.text || '',
                htmlBody: email.html || null,
                messageId: email.messageId || `imap-${channel.id}-${email.uid}`,
                threadId: email.threadId || null,
                sentAt: email.date,
                receivedAt: new Date(),
                isRead: false,
                isStarred: email.flags.includes('\\Flagged'),
                metadata: {
                  imapUid: email.uid,
                  imapFolder: email.folder || 'INBOX',
                  flags: email.flags,
                  headers: email.headers || {},
                  attachments: email.attachments?.map(a => ({
                    filename: a.filename,
                    contentType: a.contentType,
                    size: a.size
                  }))
                },
                channel: channel.type,
                urgencyScore
              }
            });

            result.newMessages++;
            logger.debug(`Saved new message from ${email.from}`, {
              service: 'channel-email-sync',
              channelId: channel.id,
              subject: email.subject
            });
          }
        } catch (error) {
          logger.error('Error saving email message', {
            service: 'channel-email-sync',
            channelId: channel.id,
            from: email.from,
            subject: email.subject,
            error
          });
          result.errors.push(`Failed to save email: ${email.subject}`);
        }
      }

      result.success = true;
      logger.info(`Channel sync completed: ${channel.name}`, {
        service: 'channel-email-sync',
        channelId: channel.id,
        newMessages: result.newMessages,
        totalFetched: allEmails.length
      });

    } catch (error: any) {
      result.errors.push(error.message);
      logger.error('Channel sync failed', {
        service: 'channel-email-sync',
        channelId: channel.id,
        channelName: channel.name,
        error: error.message
      });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Calculate urgency score for an email
   */
  private calculateUrgencyScore(email: EmailMessage): number {
    let score = 50; // Base score

    // Keywords that increase urgency
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'important', 'deadline'];
    const content = `${email.subject} ${email.text}`.toLowerCase();
    
    for (const keyword of urgentKeywords) {
      if (content.includes(keyword)) {
        score += 10;
      }
    }

    // High priority flag
    if (email.flags.includes('\\Flagged') || email.headers?.['x-priority'] === '1') {
      score += 20;
    }

    // Recent emails are more urgent
    const hoursOld = (Date.now() - email.date.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 1) score += 15;
    else if (hoursOld < 24) score += 10;
    else if (hoursOld < 72) score += 5;

    return Math.min(100, score);
  }

  /**
   * Test IMAP connection for a channel
   */
  async testChannelConnection(channel: CommunicationChannel): Promise<boolean> {
    try {
      const config = channel.config as any;
      
      const imapConfig: IMAPConfig = {
        host: config.imapHost || config.host,
        port: config.imapPort || config.port || 993,
        tls: config.imapSecure !== false && config.useSSL !== false,
        user: config.username || channel.emailAddress || '',
        password: config.password || ''
      };

      return await IMAPService.testConnection(imapConfig, 15000);
    } catch (error) {
      logger.error('Channel connection test failed', {
        service: 'channel-email-sync',
        channelId: channel.id,
        error
      });
      return false;
    }
  }
}

export default ChannelEmailSyncService;