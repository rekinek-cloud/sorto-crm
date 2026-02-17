// @ts-ignore - optional dependency
const sgMail: any = (() => { try { return require('@sendgrid/mail'); } catch { return null; } })();
// @ts-ignore - optional dependency
const awsSes: any = (() => { try { return require('@aws-sdk/client-ses'); } catch { return null; } })();
type SESClient = any;
type SendEmailCommand = any;
type SendRawEmailCommand = any;
import * as nodemailer from 'nodemailer';
import { prisma } from '../config/database';
import config from '../config';

export interface EmailProvider {
  type: 'SENDGRID' | 'AWS_SES' | 'SMTP';
  config: {
    sendgrid?: {
      apiKey: string;
      fromEmail: string;
      fromName?: string;
    };
    awsSes?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      fromEmail: string;
      fromName?: string;
    };
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
      fromEmail: string;
      fromName?: string;
    };
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables: string[];
}

export interface EmailMessage {
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
    disposition?: 'attachment' | 'inline';
    contentId?: string;
  }>;
  templateId?: string;
  templateData?: Record<string, any>;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailStats {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  bounced: number;
  spam: number;
}

export class ModernEmailService {
  private sesClient?: SESClient;
  private smtpTransporter?: nodemailer.Transporter;
  private currentProvider: EmailProvider['type'] = 'SMTP';

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize SendGrid if available
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey) {
      sgMail.setApiKey(sendgridKey);
      this.currentProvider = 'SENDGRID';
    }

    // Initialize AWS SES if available
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
    if (awsKey && awsSecret) {
      this.sesClient = new (awsSes?.SESClient || class {})({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: awsKey,
          secretAccessKey: awsSecret,
        },
      });
      if (!sendgridKey) {
        this.currentProvider = 'AWS_SES';
      }
    }

    // Initialize SMTP as fallback
    if (config.EMAIL.HOST) {
      this.smtpTransporter = nodemailer.createTransport({
        host: config.EMAIL.HOST,
        port: config.EMAIL.PORT || 587,
        secure: config.EMAIL.PORT === 465,
        auth: {
          user: config.EMAIL.USER,
          pass: config.EMAIL.PASS,
        },
      });
      if (!sendgridKey && !this.sesClient) {
        this.currentProvider = 'SMTP';
      }
    }
  }

  /**
   * Send email using the best available provider
   */
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let result: { success: boolean; messageId?: string; error?: string };

      switch (this.currentProvider) {
        case 'SENDGRID':
          result = await this.sendWithSendGrid(message);
          break;
        case 'AWS_SES':
          result = await this.sendWithAwsSes(message);
          break;
        case 'SMTP':
          result = await this.sendWithSmtp(message);
          break;
        default:
          throw new Error('No email provider configured');
      }

      // Log email to database
      await this.logEmailToDatabase(message, result);

      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email using SendGrid
   */
  private async sendWithSendGrid(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const sgMessage: any = {
        to: Array.isArray(message.to) ? message.to : [message.to],
        from: process.env.FROM_EMAIL || 'noreply@crm-gtd.com',
        subject: message.subject,
        text: message.text,
        html: message.html,
      };

      if (message.cc) {
        sgMessage.cc = Array.isArray(message.cc) ? message.cc : [message.cc];
      }

      if (message.bcc) {
        sgMessage.bcc = Array.isArray(message.bcc) ? message.bcc : [message.bcc];
      }

      if (message.replyTo) {
        sgMessage.replyTo = message.replyTo;
      }

      if (message.attachments && message.attachments.length > 0) {
        sgMessage.attachments = message.attachments.map(att => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
          type: att.contentType || 'application/octet-stream',
          disposition: att.disposition || 'attachment',
          contentId: att.contentId,
        }));
      }

      const response = await sgMail.send(sgMessage);
      
      return {
        success: true,
        messageId: response[0].headers['x-message-id'] as string,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'SendGrid send failed',
      };
    }
  }

  /**
   * Send email using AWS SES
   */
  private async sendWithAwsSes(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.sesClient) {
      return { success: false, error: 'AWS SES not configured' };
    }

    try {
      const destinations = Array.isArray(message.to) ? message.to : [message.to];

      const command = new (awsSes?.SendEmailCommand || class {})({
        Source: process.env.FROM_EMAIL || 'noreply@crm-gtd.com',
        Destination: {
          ToAddresses: destinations,
          CcAddresses: message.cc ? (Array.isArray(message.cc) ? message.cc : [message.cc]) : undefined,
          BccAddresses: message.bcc ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]) : undefined,
        },
        Message: {
          Subject: {
            Data: message.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: message.text ? {
              Data: message.text,
              Charset: 'UTF-8',
            } : undefined,
            Html: message.html ? {
              Data: message.html,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
        ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
      });

      const response = await this.sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'AWS SES send failed',
      };
    }
  }

  /**
   * Send email using SMTP
   */
  private async sendWithSmtp(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.smtpTransporter) {
      return { success: false, error: 'SMTP not configured' };
    }

    try {
      const mailOptions = {
        from: `"CRM-GTD System" <${process.env.FROM_EMAIL || config.EMAIL.USER}>`,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : undefined,
        bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : undefined,
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo,
        attachments: message.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          disposition: att.disposition,
          cid: att.contentId,
        })),
      };

      const result = await this.smtpTransporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'SMTP send failed',
      };
    }
  }

  /**
   * Send email using template
   */
  async sendEmailWithTemplate(
    templateId: string,
    to: string | string[],
    templateData: Record<string, any>,
    options?: {
      cc?: string | string[];
      bcc?: string | string[];
      replyTo?: string;
      attachments?: EmailMessage['attachments'];
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      const subject = this.interpolateTemplate(template.subject, templateData);
      const html = this.interpolateTemplate(template.htmlTemplate, templateData);
      const text = template.textTemplate ? this.interpolateTemplate(template.textTemplate, templateData) : undefined;

      return this.sendEmail({
        to,
        cc: options?.cc,
        bcc: options?.bcc,
        subject,
        text,
        html,
        replyTo: options?.replyTo,
        attachments: options?.attachments,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template send failed',
      };
    }
  }

  /**
   * Send bulk emails with rate limiting
   */
  async sendBulkEmails(
    messages: EmailMessage[],
    options?: {
      batchSize?: number;
      delayBetweenBatches?: number;
    }
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const batchSize = options?.batchSize || 10;
    const delay = options?.delayBetweenBatches || 1000;
    
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const promises = batch.map(async (message) => {
        const result = await this.sendEmail(message);
        if (result.success) {
          sent++;
        } else {
          failed++;
          if (result.error) {
            errors.push(result.error);
          }
        }
      });

      await Promise.all(promises);

      // Add delay between batches
      if (i + batchSize < messages.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Get email template
   */
  private async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      const template = await prisma.email_templates.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return null;
      }

      return {
        id: template.id,
        name: template.name,
        subject: template.subject,
        htmlTemplate: template.htmlTemplate,
        textTemplate: template.textTemplate || undefined,
        variables: template.variables as string[],
      };
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  /**
   * Interpolate template with data
   */
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Log email to database
   */
  private async logEmailToDatabase(
    message: EmailMessage,
    result: { success: boolean; messageId?: string; error?: string }
  ): Promise<void> {
    try {
      await prisma.email_logs.create({
        data: {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          provider: this.currentProvider as any,
          messageId: result.messageId || '',
          toAddresses: Array.isArray(message.to) ? message.to : [message.to],
          subject: message.subject,
          success: result.success,
          error: result.error,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  /**
   * Get email delivery statistics
   */
  async getEmailStats(
    organizationId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<EmailStats> {
    try {
      const where: any = {};
      
      if (organizationId) {
        where.organizationId = organizationId;
      }

      if (dateFrom && dateTo) {
        where.sentAt = {
          gte: dateFrom,
          lte: dateTo,
        };
      }

      const [sent, delivered, failed] = await Promise.all([
        prisma.email_logs.count({
          where: { ...where, success: true },
        }),
        prisma.email_logs.count({
          where: { ...where, success: true, delivered: true },
        }),
        prisma.email_logs.count({
          where: { ...where, success: false },
        }),
      ]);

      return {
        sent,
        delivered,
        failed,
        opened: 0, // Would need webhook integration
        clicked: 0, // Would need webhook integration
        bounced: 0, // Would need webhook integration
        spam: 0, // Would need webhook integration
      };
    } catch (error) {
      console.error('Error fetching email stats:', error);
      return {
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        spam: 0,
      };
    }
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<{ success: boolean; provider: string; error?: string }> {
    try {
      const testMessage: EmailMessage = {
        to: process.env.FROM_EMAIL || 'test@example.com',
        subject: 'CRM-GTD Email Configuration Test',
        text: 'This is a test email to verify email configuration.',
        html: '<p>This is a test email to verify email configuration.</p>',
      };

      const result = await this.sendEmail(testMessage);

      return {
        success: result.success,
        provider: this.currentProvider,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.currentProvider,
        error: error instanceof Error ? error.message : 'Configuration test failed',
      };
    }
  }

  /**
   * Get available email templates
   */
  async getAvailableTemplates(): Promise<EmailTemplate[]> {
    try {
      const templates = await prisma.email_templates.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        htmlTemplate: template.htmlTemplate,
        textTemplate: template.textTemplate || undefined,
        variables: template.variables as string[],
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }
}

export const modernEmailService = new ModernEmailService();
