import Imap from 'imap';
import { simpleParser } from 'mailparser';
import * as nodemailer from 'nodemailer';
import { prisma } from '../config/database';
import { processMessageContent } from './messageProcessor';

export interface EmailConfig {
  id: string;
  type: 'IMAP' | 'EXCHANGE';
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  mailbox?: string;
}

export interface EmailMessage {
  messageId: string;
  from: { address: string; name?: string };
  to: { address: string; name?: string }[];
  cc?: { address: string; name?: string }[];
  bcc?: { address: string; name?: string }[];
  subject: string;
  text?: string;
  html?: string;
  date: Date;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
  }>;
}

export class EmailService {
  private imapConnections: Map<string, Imap> = new Map();
  private smtpTransporters: Map<string, nodemailer.Transporter> = new Map();

  async connectToChannel(channelId: string): Promise<void> {
    const channel = await prisma.communicationChannel.findUnique({
      where: { id: channelId },
      include: { organization: true }
    });

    if (!channel || channel.type !== 'EMAIL') {
      throw new Error('Invalid email channel');
    }

    const config = channel.config as any;
    
    // Normalize config structure and provide defaults
    const normalizedConfig = {
      host: config.host,
      port: config.port || (config.useSSL !== false ? 993 : 143), // Default ports
      secure: config.secure !== undefined ? config.secure : (config.useSSL !== false),
      user: config.user || config.username,
      password: config.password
    };
    
    // Setup IMAP connection
    const imap = new Imap({
      user: normalizedConfig.user,
      password: normalizedConfig.password,
      host: normalizedConfig.host,
      port: normalizedConfig.port,
      tls: normalizedConfig.secure,
      tlsOptions: { 
        rejectUnauthorized: false
      },
      authTimeout: 30000,
      connTimeout: 30000,
      keepalive: true
    });

    // Setup SMTP transporter  
    const transporter = nodemailer.createTransport({
      host: normalizedConfig.host,
      port: normalizedConfig.port === 993 ? 587 : normalizedConfig.port, // Use SMTP port for sending
      secure: normalizedConfig.port === 465, // Use secure for port 465
      auth: {
        user: normalizedConfig.user,
        pass: normalizedConfig.password
      }
    });

    this.imapConnections.set(channelId, imap);
    this.smtpTransporters.set(channelId, transporter);

    // Setup IMAP event handlers
    this.setupImapHandlers(channelId, imap);
  }

  private setupImapHandlers(channelId: string, imap: Imap): void {
    imap.once('ready', () => {
      console.log(`IMAP connected for channel ${channelId}`);
      this.openInbox(channelId, imap);
    });

    imap.once('error', (err: Error) => {
      console.error(`IMAP error for channel ${channelId}:`, err);
    });

    imap.once('end', () => {
      console.log(`IMAP disconnected for channel ${channelId}`);
    });

    imap.connect();
  }

  private openInbox(channelId: string, imap: Imap): void {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error(`Error opening inbox for channel ${channelId}:`, err);
        return;
      }

      console.log(`Inbox opened for channel ${channelId}, ${box.messages.total} messages`);
      
      // Listen for new messages
      imap.on('mail', (numNewMsgs: number) => {
        console.log(`${numNewMsgs} new messages for channel ${channelId}`);
        this.fetchNewMessages(channelId, imap);
      });

      // Fetch recent messages on connect
      this.fetchRecentMessages(channelId, imap);
    });
  }

  private async fetchRecentMessages(channelId: string, imap: Imap): Promise<void> {
    // Fetch messages from last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const searchCriteria = ['UNSEEN']; // Only unread messages
    
    imap.search(searchCriteria, (err, results) => {
      if (err) {
        console.error('Search error:', err);
        return;
      }

      if (results.length === 0) {
        console.log(`No new messages for channel ${channelId}`);
        return;
      }

      console.log(`Fetching ${results.length} messages for channel ${channelId}`);
      this.fetchMessages(channelId, imap, results);
    });
  }

  private async fetchNewMessages(channelId: string, imap: Imap): Promise<void> {
    // Fetch only new unread messages
    imap.search(['UNSEEN'], (err, results) => {
      if (err) {
        console.error('Search error:', err);
        return;
      }

      if (results.length > 0) {
        this.fetchMessages(channelId, imap, results);
      }
    });
  }

  private fetchMessages(channelId: string, imap: Imap, messageIds: number[]): void {
    const fetch = imap.fetch(messageIds, { 
      bodies: '',
      markSeen: false // Don't mark as read automatically
    });

    fetch.on('message', (msg, seqno) => {
      let messageData = '';

      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          messageData += chunk.toString('utf8');
        });
      });

      msg.once('end', async () => {
        try {
          const parsed = await simpleParser(messageData);
          const emailMessage = this.convertToEmailMessage(parsed);
          await this.saveMessage(channelId, emailMessage);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
    });

    fetch.once('error', (err) => {
      console.error('Fetch error:', err);
    });

    fetch.once('end', () => {
      console.log(`Finished fetching messages for channel ${channelId}`);
    });
  }

  private convertToEmailMessage(parsed: any): EmailMessage {
    return {
      messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
      from: {
        address: parsed.from?.value?.[0]?.address || parsed.from?.text || '',
        name: parsed.from?.value?.[0]?.name || parsed.from?.name
      },
      to: parsed.to?.value?.map((addr: any) => ({
        address: addr.address,
        name: addr.name
      })) || [],
      cc: parsed.cc?.value?.map((addr: any) => ({
        address: addr.address,
        name: addr.name
      })) || [],
      subject: parsed.subject || '',
      text: parsed.text || '',
      html: parsed.html || '',
      date: parsed.date || new Date(),
      attachments: parsed.attachments?.map((att: any) => ({
        filename: att.filename || 'unnamed',
        contentType: att.contentType || 'application/octet-stream',
        size: att.size || 0,
        content: att.content
      })) || []
    };
  }

  async saveMessage(channelId: string, emailMessage: EmailMessage): Promise<boolean> {
    try {
      const channel = await prisma.communicationChannel.findUnique({
        where: { id: channelId }
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      // Check if message already exists
      const existing = await prisma.message.findFirst({
        where: {
          channelId,
          messageId: emailMessage.messageId
        }
      });

      if (existing) {
        return false;
      }

      // Create message record
      const message = await prisma.message.create({
        data: {
          channelId,
          organizationId: channel.organizationId,
          messageId: emailMessage.messageId,
          subject: emailMessage.subject,
          content: emailMessage.text || '',
          htmlContent: emailMessage.html || '',
          fromAddress: emailMessage.from.address,
          fromName: emailMessage.from.name || '',
          toAddress: emailMessage.to[0]?.address || '',
          ccAddress: emailMessage.cc?.map(addr => addr.address) || [],
          sentAt: emailMessage.date,
          receivedAt: emailMessage.date,
          messageType: 'INBOX',
          priority: 'NORMAL'
        }
      });

      // Save attachments
      for (const attachment of emailMessage.attachments || []) {
        await prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            fileName: attachment.filename,
            fileType: attachment.contentType,
            fileSize: attachment.size,
            contentType: attachment.contentType,
            // Note: In production, save to file system or cloud storage
            storagePath: `/attachments/${message.id}/${attachment.filename}`
          }
        });
      }

      console.log(`Saved message: ${emailMessage.subject}`);

      // Auto-processing disabled - CRM linkage (contacts/companies)
      // must be triggered manually by the user via message analysis

      return true;
    } catch (error) {
      console.error('Error saving message:', error);
      return false;
    }
  }

  async sendEmail(channelId: string, to: string, subject: string, content: string, html?: string): Promise<void> {
    const transporter = this.smtpTransporters.get(channelId);
    
    if (!transporter) {
      throw new Error('SMTP not configured for channel');
    }

    const channel = await prisma.communicationChannel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    const mailOptions = {
      from: channel.emailAddress,
      to,
      subject,
      text: content,
      html: html || content
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent:', result.messageId);

      // Save sent message to database
      await prisma.message.create({
        data: {
          channelId,
          organizationId: channel.organizationId,
          messageId: result.messageId,
          subject,
          content,
          htmlContent: html || '',
          fromAddress: channel.emailAddress || '',
          toAddress: to,
          sentAt: new Date(),
          receivedAt: new Date(),
          messageType: 'SENT',
          priority: 'NORMAL'
        }
      });

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async disconnectChannel(channelId: string): Promise<void> {
    const imap = this.imapConnections.get(channelId);
    const smtp = this.smtpTransporters.get(channelId);

    if (imap) {
      imap.end();
      this.imapConnections.delete(channelId);
    }

    if (smtp) {
      smtp.close();
      this.smtpTransporters.delete(channelId);
    }
  }

  async testConnection(config: EmailConfig): Promise<boolean> {
    return new Promise((resolve) => {
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.secure,
        tlsOptions: { rejectUnauthorized: false }
      });

      imap.once('ready', () => {
        imap.end();
        resolve(true);
      });

      imap.once('error', () => {
        resolve(false);
      });

      imap.connect();
    });
  }

  async syncMessages(channelId: string): Promise<{ syncedCount: number; errors: string[] }> {
    try {
      const channel = await prisma.communicationChannel.findUnique({
        where: { id: channelId },
        include: { organization: true }
      });

      if (!channel || channel.type !== 'EMAIL') {
        return { syncedCount: 0, errors: ['Invalid email channel'] };
      }

      const config = channel.config as any;
      
      // Normalize config structure and provide defaults
      const normalizedConfig = {
        host: config.host,
        port: config.port || (config.useSSL !== false ? 993 : 143), // Default ports
        secure: config.secure !== undefined ? config.secure : (config.useSSL !== false),
        user: config.user || config.username,
        password: config.password
      };
      
      let syncedCount = 0;
      const errors: string[] = [];

      return new Promise((resolve) => {
        const imap = new Imap({
          user: normalizedConfig.user,
          password: normalizedConfig.password,
          host: normalizedConfig.host,
          port: normalizedConfig.port,
          tls: normalizedConfig.secure,
          tlsOptions: { 
            rejectUnauthorized: false
          },
          authTimeout: 30000,
          connTimeout: 30000,
          keepalive: true
        });

        imap.once('ready', () => {
          imap.openBox('INBOX', false, (err, box) => {
            if (err) {
              errors.push(`Failed to open inbox: ${err.message}`);
              imap.end();
              return resolve({ syncedCount, errors });
            }

            console.log(`[Sync] Inbox has ${box.messages.total} messages total`);

            if (box.messages.total === 0) {
              imap.end();
              return resolve({ syncedCount: 0, errors });
            }

            // Fetch last 100 messages
            const startSeq = Math.max(1, box.messages.total - 99);
            console.log(`[Sync] Fetching sequences ${startSeq}:*`);

            const f = imap.seq.fetch(`${startSeq}:*`, {
              bodies: ''
            });

            const messagePromises: Promise<void>[] = [];

            f.on('message', (msg, seqno) => {
              const promise = new Promise<void>((resolveMsg) => {
                let messageData = '';

                msg.on('body', (stream) => {
                  stream.on('data', (chunk: Buffer) => {
                    messageData += chunk.toString('utf8');
                  });
                });

                msg.once('end', async () => {
                  try {
                    const parsed = await simpleParser(messageData);
                    const emailMessage: EmailMessage = {
                      messageId: parsed.messageId || `${channelId}-${seqno}-${Date.now()}`,
                      from: {
                        address: parsed.from?.value?.[0]?.address || 'unknown@unknown.com',
                        name: parsed.from?.value?.[0]?.name
                      },
                      to: parsed.to?.value?.map(addr => ({
                        address: addr.address!,
                        name: addr.name
                      })) || [],
                      subject: parsed.subject || 'No Subject',
                      text: parsed.text,
                      html: parsed.html,
                      date: parsed.date || new Date(),
                      attachments: parsed.attachments?.map(att => ({
                        filename: att.filename || 'unknown',
                        contentType: att.contentType,
                        size: att.size,
                        content: att.content
                      }))
                    };

                    const saved = await this.saveMessage(channelId, emailMessage);
                    if (saved) syncedCount++;
                  } catch (saveError: any) {
                    if (!saveError.message?.includes('already exists')) {
                      errors.push(`Message ${seqno}: ${saveError.message}`);
                    }
                  }
                  resolveMsg();
                });
              });
              messagePromises.push(promise);
            });

            f.once('error', (err) => {
              errors.push(`Fetch error: ${err.message}`);
            });

            f.once('end', async () => {
              // Wait for all messages to be parsed and saved
              await Promise.all(messagePromises);
              console.log(`[Sync] Done: ${syncedCount} new, ${errors.length} errors`);

              // Update lastSyncAt
              await prisma.communicationChannel.update({
                where: { id: channelId },
                data: { lastSyncAt: new Date() }
              });

              imap.end();
              resolve({ syncedCount, errors });
            });
          });
        });

        imap.once('error', (err) => {
          errors.push(`IMAP connection error: ${err.message}`);
          resolve({ syncedCount, errors });
        });

        imap.connect();
      });
    } catch (error) {
      return { 
        syncedCount: 0, 
        errors: [`Sync failed: ${error.message}`] 
      };
    }
  }
}

export const emailService = new EmailService();