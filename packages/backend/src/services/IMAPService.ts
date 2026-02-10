/**
 * IMAPService - Service for connecting to IMAP servers and fetching emails
 * Supports Gmail, Outlook, Exchange, and custom IMAP servers
 */

const Imap = require('imap');
import { simpleParser, ParsedMail } from 'mailparser';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';

export interface IMAPConfig {
  host: string;
  port: number;
  tls: boolean;
  user: string;
  password: string;
  keepalive?: boolean;
  connTimeout?: number;
  authTimeout?: number;
}

export interface EmailMessage {
  uid: string;
  flags: string[];
  date: Date;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  textContent: string;
  htmlContent?: string;
  attachments: any[];
  headers: any;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
}

export class IMAPService {
  private imap: Imap | null = null;
  private config: IMAPConfig;
  private prisma: PrismaClient;
  
  constructor(config: IMAPConfig, prisma: PrismaClient) {
    this.config = config;
    this.prisma = prisma;
  }

  /**
   * Connect to IMAP server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.imap = new Imap({
          host: this.config.host,
          port: this.config.port,
          tls: this.config.tls,
          user: this.config.user,
          password: this.config.password,
          keepalive: this.config.keepalive || true,
          connTimeout: this.config.connTimeout || 30000,
          authTimeout: this.config.authTimeout || 10000,
        });

        this.imap.once('ready', () => {
          logger.info(`📧 IMAP connected to ${this.config.host}`, {
            service: 'imap-service',
            host: this.config.host,
            user: this.config.user
          });
          resolve();
        });

        this.imap.once('error', (err: Error) => {
          logger.error(`❌ IMAP connection error: ${err.message}`, {
            service: 'imap-service',
            error: err.message,
            host: this.config.host
          });
          reject(err);
        });

        this.imap.once('end', () => {
          logger.info('📧 IMAP connection ended', {
            service: 'imap-service',
            host: this.config.host
          });
        });

        this.imap.connect();
      } catch (error) {
        logger.error(`❌ Failed to initialize IMAP connection: ${error}`, {
          service: 'imap-service',
          error: error instanceof Error ? error.message : String(error)
        });
        reject(error);
      }
    });
  }

  /**
   * Disconnect from IMAP server
   */
  async disconnect(): Promise<void> {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
  }

  /**
   * Get list of folders/mailboxes
   */
  async getFolders(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'));
      }

      this.imap.getBoxes((err, boxes) => {
        if (err) {
          return reject(err);
        }

        const folderNames: string[] = [];
        const extractFolders = (boxList: any, prefix = '') => {
          for (const [name, box] of Object.entries(boxList)) {
            const fullName = prefix ? `${prefix}${box.delimiter}${name}` : name;
            folderNames.push(fullName);
            
            if (box.children) {
              extractFolders(box.children, fullName);
            }
          }
        };

        extractFolders(boxes);
        resolve(folderNames);
      });
    });
  }

  /**
   * Open a specific folder
   */
  async openFolder(folderName: string, readOnly = true): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'));
      }

      this.imap.openBox(folderName, readOnly, (err, box) => {
        if (err) {
          return reject(err);
        }

        logger.info(`📂 Opened IMAP folder: ${folderName}`, {
          service: 'imap-service',
          folder: folderName,
          messages: box?.messages?.total || 0
        });

        resolve();
      });
    });
  }

  /**
   * Fetch emails from current folder
   */
  async fetchEmails(
    searchCriteria: string[] = ['ALL'],
    limit?: number
  ): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'));
      }

      this.imap.search(searchCriteria, (err, results) => {
        if (err) {
          return reject(err);
        }

        if (!results || results.length === 0) {
          return resolve([]);
        }

        // Apply limit if specified
        const uids = limit ? results.slice(-limit) : results;
        const emails: EmailMessage[] = [];

        const fetch = this.imap!.fetch(uids, { 
          bodies: '',
          markSeen: false,
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          let buffer = '';
          let attrs: any;

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('attributes', (attributes) => {
            attrs = attributes;
          });

          msg.once('end', async () => {
            try {
              const parsed: ParsedMail = await simpleParser(buffer);
              
              const email: EmailMessage = {
                uid: attrs.uid.toString(),
                flags: attrs.flags,
                date: parsed.date || new Date(),
                from: parsed.from?.text || '',
                to: parsed.to?.text ? [parsed.to.text] : [],
                cc: parsed.cc?.text ? [parsed.cc.text] : undefined,
                bcc: parsed.bcc?.text ? [parsed.bcc.text] : undefined,
                subject: parsed.subject || '',
                textContent: parsed.text || '',
                htmlContent: parsed.html || undefined,
                attachments: parsed.attachments || [],
                headers: parsed.headers,
                messageId: parsed.messageId,
                inReplyTo: parsed.inReplyTo,
                references: parsed.references
              };

              emails.push(email);
            } catch (parseError) {
              logger.error(`❌ Error parsing email UID ${attrs.uid}: ${parseError}`, {
                service: 'imap-service',
                uid: attrs.uid,
                error: parseError instanceof Error ? parseError.message : String(parseError)
              });
            }
          });
        });

        fetch.once('error', (fetchErr) => {
          logger.error(`❌ IMAP fetch error: ${fetchErr.message}`, {
            service: 'imap-service',
            error: fetchErr.message
          });
          reject(fetchErr);
        });

        fetch.once('end', () => {
          logger.info(`📧 Fetched ${emails.length} emails`, {
            service: 'imap-service',
            count: emails.length
          });
          resolve(emails);
        });
      });
    });
  }

  /**
   * Mark email as read
   */
  async markAsRead(uid: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'));
      }

      this.imap.addFlags(uid, ['\\Seen'], (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Move email to folder
   */
  async moveToFolder(uid: string, folderName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'));
      }

      this.imap.move(uid, folderName, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Delete email
   */
  async deleteEmail(uid: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'));
      }

      this.imap.addFlags(uid, ['\\Deleted'], (err) => {
        if (err) {
          return reject(err);
        }

        this.imap!.expunge([uid], (expungeErr) => {
          if (expungeErr) {
            return reject(expungeErr);
          }
          resolve();
        });
      });
    });
  }

  /**
   * Test connection with timeout
   */
  static async testConnection(config: IMAPConfig, timeoutMs = 10000): Promise<boolean> {
    const service = new IMAPService(config, prisma);

    try {
      await Promise.race([
        service.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
        )
      ]);

      await service.disconnect();
      return true;
    } catch (error) {
      await service.disconnect();
      logger.error(`❌ IMAP connection test failed: ${error}`, {
        service: 'imap-service',
        host: config.host,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Get predefined configurations for popular email providers
   */
  static getProviderConfig(provider: string, email: string, password: string): IMAPConfig {
    const configs: Record<string, Partial<IMAPConfig>> = {
      gmail: {
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
      },
      outlook: {
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
      },
      yahoo: {
        host: 'imap.mail.yahoo.com',
        port: 993,
        tls: true,
      },
      exchange: {
        host: 'mail.exchange.microsoft.com',
        port: 993,
        tls: true,
      }
    };

    const baseConfig = configs[provider.toLowerCase()] || {};
    
    return {
      host: baseConfig.host || '',
      port: baseConfig.port || 993,
      tls: baseConfig.tls || true,
      user: email,
      password: password,
      keepalive: true,
      connTimeout: 30000,
      authTimeout: 10000,
      ...baseConfig
    };
  }
}

export default IMAPService;