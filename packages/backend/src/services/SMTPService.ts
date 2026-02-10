/**
 * SMTPService - Service for sending emails via SMTP
 * Supports Gmail, Outlook, Exchange, and custom SMTP servers
 */

import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { PrismaClient, EmailAccount } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from?: string;
  replyTo?: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
    cid?: string;
  }>;
  inReplyTo?: string;
  references?: string[];
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipients: string[];
}

export class SMTPService {
  private transporter: Transporter | null = null;
  private config: SMTPConfig;
  private prisma: PrismaClient;

  constructor(config: SMTPConfig, prisma: PrismaClient) {
    this.config = config;
    this.prisma = prisma;
  }

  /**
   * Initialize SMTP connection
   */
  async initialize(): Promise<void> {
    try {
      this.transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10, // Max 10 emails per second
      });

      // Verify connection
      await this.transporter.verify();
      
      logger.info(`📤 SMTP service initialized for ${this.config.host}`, {
        service: 'smtp-service',
        host: this.config.host,
        user: this.config.user
      });
    } catch (error) {
      logger.error(`❌ SMTP initialization failed: ${error}`, {
        service: 'smtp-service',
        host: this.config.host,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<SendResult> {
    if (!this.transporter) {
      throw new Error('SMTP service not initialized');
    }

    try {
      const recipients = this.flattenRecipients([
        ...(Array.isArray(options.to) ? options.to : [options.to]),
        ...(options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : []),
        ...(options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [])
      ]);

      const mailOptions: SendMailOptions = {
        from: this.config.from || this.config.user,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          cid: att.cid
        })),
        inReplyTo: options.inReplyTo,
        references: options.references
      };

      if (this.config.replyTo) {
        mailOptions.replyTo = this.config.replyTo;
      }

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`✅ Email sent successfully`, {
        service: 'smtp-service',
        messageId: info.messageId,
        recipients: recipients.length,
        subject: options.subject.substring(0, 100)
      });

      // Log to database
      await this.logEmail(options, info.messageId, true);

      return {
        success: true,
        messageId: info.messageId,
        recipients
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      logger.error(`❌ Failed to send email: ${errorMsg}`, {
        service: 'smtp-service',
        subject: options.subject,
        error: errorMsg
      });

      // Log failed attempt
      await this.logEmail(options, undefined, false, errorMsg);

      return {
        success: false,
        error: errorMsg,
        recipients: this.flattenRecipients([
          ...(Array.isArray(options.to) ? options.to : [options.to])
        ])
      };
    }
  }

  /**
   * Send reply to existing message
   */
  async sendReply(
    originalMessageId: string,
    replyOptions: Omit<EmailOptions, 'inReplyTo' | 'references'>
  ): Promise<SendResult> {
    try {
      // Get original message details
      const originalMessage = await this.prisma.message.findUnique({
        where: { id: originalMessageId }
      });

      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      // Prepare reply
      const replySubject = originalMessage.subject?.startsWith('Re:') 
        ? originalMessage.subject 
        : `Re: ${originalMessage.subject}`;

      return await this.sendEmail({
        ...replyOptions,
        subject: replySubject,
        inReplyTo: originalMessage.messageId || undefined,
        references: originalMessage.messageId ? [originalMessage.messageId] : undefined
      });

    } catch (error) {
      logger.error(`❌ Failed to send reply: ${error}`, {
        service: 'smtp-service',
        originalMessageId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Send forward of existing message
   */
  async sendForward(
    originalMessageId: string,
    forwardOptions: Omit<EmailOptions, 'subject' | 'text' | 'html'>
  ): Promise<SendResult> {
    try {
      // Get original message details
      const originalMessage = await this.prisma.message.findUnique({
        where: { id: originalMessageId }
      });

      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      // Prepare forward
      const forwardSubject = originalMessage.subject?.startsWith('Fwd:') 
        ? originalMessage.subject 
        : `Fwd: ${originalMessage.subject}`;

      const forwardHeader = `\n\n---------- Forwarded message ----------\n` +
        `From: ${originalMessage.fromAddress}\n` +
        `Date: ${originalMessage.sentAt?.toLocaleString()}\n` +
        `Subject: ${originalMessage.subject}\n` +
        `To: ${originalMessage.toAddress}\n\n`;

      const forwardText = forwardHeader + (originalMessage.content || '');
      const forwardHtml = originalMessage.htmlContent 
        ? `<br><br>---------- Forwarded message ----------<br>` +
          `<b>From:</b> ${originalMessage.fromAddress}<br>` +
          `<b>Date:</b> ${originalMessage.sentAt?.toLocaleString()}<br>` +
          `<b>Subject:</b> ${originalMessage.subject}<br>` +
          `<b>To:</b> ${originalMessage.toAddress}<br><br>` +
          originalMessage.htmlContent
        : undefined;

      return await this.sendEmail({
        ...forwardOptions,
        subject: forwardSubject,
        text: forwardText,
        html: forwardHtml
      });

    } catch (error) {
      logger.error(`❌ Failed to send forward: ${error}`, {
        service: 'smtp-service',
        originalMessageId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }
      
      await this.transporter!.verify();
      return true;
    } catch (error) {
      logger.error(`❌ SMTP connection test failed: ${error}`, {
        service: 'smtp-service',
        host: this.config.host,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Close SMTP connection
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      
      logger.info('📤 SMTP connection closed', {
        service: 'smtp-service',
        host: this.config.host
      });
    }
  }

  /**
   * Log email to database
   */
  private async logEmail(
    options: EmailOptions,
    messageId?: string,
    success = true,
    error?: string
  ): Promise<void> {
    try {
      const recipients = this.flattenRecipients([
        ...(Array.isArray(options.to) ? options.to : [options.to]),
        ...(options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : []),
        ...(options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [])
      ]);

      // Note: This would need organizationId context
      // For now, we'll skip database logging or get it from context
      /*
      await this.prisma.emailLog.create({
        data: {
          messageId,
          fromAddress: this.config.from || this.config.user,
          toAddress: recipients.join(','),
          subject: options.subject,
          status: success ? 'SENT' : 'FAILED',
          errorMessage: error,
          sentAt: new Date(),
          organizationId: 'required-context',
          userId: 'required-context'
        }
      });
      */
    } catch (logError) {
      logger.error(`❌ Failed to log email: ${logError}`, {
        service: 'smtp-service',
        messageId
      });
    }
  }

  /**
   * Flatten recipient arrays into single array
   */
  private flattenRecipients(recipients: (string | string[])[]): string[] {
    return recipients
      .flat()
      .filter(email => email && typeof email === 'string')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  /**
   * Create SMTP service from email account
   */
  static async fromEmailAccount(
    accountId: string,
    prisma: PrismaClient
  ): Promise<SMTPService> {
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error(`Email account ${accountId} not found`);
    }

    const config: SMTPConfig = {
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
      user: account.smtpUsername,
      password: account.smtpPassword, // TODO: Decrypt encrypted password
      from: `${account.name} <${account.email}>`,
      replyTo: account.email
    };

    const service = new SMTPService(config, prisma);
    await service.initialize();
    
    return service;
  }

  /**
   * Get predefined configurations for popular email providers
   */
  static getProviderConfig(provider: string, email: string, password: string): SMTPConfig {
    const configs: Record<string, Partial<SMTPConfig>> = {
      gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
      },
      outlook: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false, // Use STARTTLS
      },
      yahoo: {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false, // Use STARTTLS
      },
      exchange: {
        host: 'smtp.office365.com',
        port: 587,
        secure: false, // Use STARTTLS
      }
    };

    const baseConfig = configs[provider.toLowerCase()] || {};
    
    return {
      host: baseConfig.host || '',
      port: baseConfig.port || 587,
      secure: baseConfig.secure || false,
      user: email,
      password: password,
      from: email,
      ...baseConfig
    };
  }

  /**
   * Test SMTP configuration without creating service instance
   */
  static async testConfig(config: SMTPConfig, timeoutMs = 10000): Promise<boolean> {
    const service = new SMTPService(config, prisma);

    try {
      await Promise.race([
        service.initialize(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
        )
      ]);

      const result = await service.testConnection();
      await service.close();

      return result;
    } catch (error) {
      await service.close();

      logger.error(`❌ SMTP config test failed: ${error}`, {
        service: 'smtp-service',
        host: config.host,
        error: error instanceof Error ? error.message : String(error)
      });

      return false;
    }
  }
}

export default SMTPService;