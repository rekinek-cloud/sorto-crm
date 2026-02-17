import { WebClient } from '@slack/web-api';
import { prisma } from '../config/database';

export interface SlackConfig {
  token: string;
  signingSecret: string;
  appToken?: string;
  botToken?: string;
  workspace: string;
  channels?: string[];
}

export interface SlackMessage {
  channel: string;
  user: string;
  text: string;
  timestamp: string;
  thread_ts?: string;
  type: string;
  subtype?: string;
  attachments?: any[];
  blocks?: any[];
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  is_archived: boolean;
  members?: string[];
}

export class SlackService {
  private clients: Map<string, WebClient> = new Map();

  constructor() {
    // Initialize existing slack channels on startup
    this.initializeExistingChannels();
  }

  private async initializeExistingChannels() {
    try {
      const slackChannels = await prisma.communicationChannel.findMany({
        where: { type: 'SLACK', active: true }
      });

      for (const channel of slackChannels) {
        if (channel.config && (channel.config as any).token) {
          await this.connectToChannel(channel.id);
        }
      }
    } catch (error) {
      console.error('Error initializing Slack channels:', error);
    }
  }

  async connectToChannel(channelId: string): Promise<void> {
    try {
      const channel = await prisma.communicationChannel.findUnique({
        where: { id: channelId }
      });

      if (!channel || channel.type !== 'SLACK') {
        throw new Error('Invalid Slack channel');
      }

      const config = channel.config as any as SlackConfig;
      const client = new WebClient(config.token);

      // Test the connection
      const auth = await client.auth.test();
      if (!auth.ok) {
        throw new Error('Slack authentication failed');
      }

      this.clients.set(channelId, client);

      // Update channel status
      await prisma.communicationChannel.update({
        where: { id: channelId },
        data: { active: true }
      });

      console.log(`Connected to Slack workspace: ${auth.team}`);
    } catch (error) {
      console.error('Error connecting to Slack:', error);
      throw error;
    }
  }

  async disconnectChannel(channelId: string): Promise<void> {
    this.clients.delete(channelId);
    
    await prisma.communicationChannel.update({
      where: { id: channelId },
      data: { active: false }
    });
  }

  async testConnection(config: SlackConfig): Promise<boolean> {
    try {
      const client = new WebClient(config.token);
      const auth = await client.auth.test();
      return !!auth.ok;
    } catch (error) {
      console.error('Slack connection test failed:', error);
      return false;
    }
  }

  async getChannels(channelId: string): Promise<SlackChannel[]> {
    const client = this.clients.get(channelId);
    if (!client) {
      throw new Error('Slack client not connected');
    }

    try {
      const result = await client.conversations.list({
        types: 'public_channel,private_channel,mpim,im',
        exclude_archived: true
      });

      return (result.channels || []).map(channel => ({
        id: channel.id!,
        name: channel.name || '',
        is_channel: !!channel.is_channel,
        is_group: !!channel.is_group,
        is_im: !!channel.is_im,
        is_mpim: !!channel.is_mpim,
        is_private: !!channel.is_private,
        is_archived: !!channel.is_archived,
        members: (channel as any).members || []
      }));
    } catch (error) {
      console.error('Error fetching Slack channels:', error);
      throw error;
    }
  }

  async getMessages(channelId: string, slackChannelId: string, limit: number = 50): Promise<SlackMessage[]> {
    const client = this.clients.get(channelId);
    if (!client) {
      throw new Error('Slack client not connected');
    }

    try {
      const result = await client.conversations.history({
        channel: slackChannelId,
        limit: limit
      });

      return (result.messages || []).map(message => ({
        channel: slackChannelId,
        user: message.user || '',
        text: message.text || '',
        timestamp: message.ts || '',
        thread_ts: message.thread_ts,
        type: message.type || '',
        subtype: message.subtype,
        attachments: message.attachments,
        blocks: message.blocks
      }));
    } catch (error) {
      console.error('Error fetching Slack messages:', error);
      throw error;
    }
  }

  async sendMessage(channelId: string, slackChannelId: string, text: string, options?: {
    thread_ts?: string;
    blocks?: any[];
    attachments?: any[];
  }): Promise<void> {
    const client = this.clients.get(channelId);
    if (!client) {
      throw new Error('Slack client not connected');
    }

    try {
      await client.chat.postMessage({
        channel: slackChannelId,
        text: text,
        thread_ts: options?.thread_ts,
        blocks: options?.blocks,
        attachments: options?.attachments
      });
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw error;
    }
  }

  async syncMessages(channelId: string): Promise<{ syncedCount: number; errors: string[] }> {
    let syncedCount = 0;
    const errors: string[] = [];

    try {
      const channel = await prisma.communicationChannel.findUnique({
        where: { id: channelId }
      });

      if (!channel || channel.type !== 'SLACK') {
        throw new Error('Invalid Slack channel');
      }

      const config = channel.config as any as SlackConfig;
      const slackChannels = config.channels || [];

      for (const slackChannelId of slackChannels) {
        try {
          const messages = await this.getMessages(channelId, slackChannelId, 20);
          
          for (const message of messages) {
            // Check if message already exists
            const existingMessage = await prisma.message.findFirst({
              where: {
                channelId: channelId,
                messageId: message.timestamp
              }
            });

            if (!existingMessage && message.text && message.text.trim()) {
              // Determine if message needs action
              const actionNeeded = this.determineActionNeeded(message.text);
              const urgencyScore = this.calculateUrgencyScore(message.text);

              await prisma.message.create({
                data: {
                  messageId: message.timestamp,
                  channelId: channelId,
                  fromAddress: message.user,
                  fromName: await this.getUserDisplayName(channelId, message.user),
                  subject: `Slack message in #${slackChannelId}`,
                  content: message.text,
                  htmlContent: message.blocks ? JSON.stringify(message.blocks) : undefined,
                  receivedAt: new Date(parseFloat(message.timestamp) * 1000),
                  sentAt: new Date(parseFloat(message.timestamp) * 1000),
                  isRead: false,
                  actionNeeded: actionNeeded,
                  urgencyScore: urgencyScore,
                  organizationId: channel.organizationId
                } as any
              });

              syncedCount++;
            }
          }
        } catch (error) {
          const errorMsg = `Error syncing channel ${slackChannelId}: ${(error as Error).message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      return { syncedCount, errors };
    } catch (error) {
      console.error('Error syncing Slack messages:', error);
      return { syncedCount, errors: [(error as Error).message] };
    }
  }

  private async getUserDisplayName(channelId: string, userId: string): Promise<string> {
    try {
      const client = this.clients.get(channelId);
      if (!client) return userId;

      const result = await client.users.info({ user: userId });
      if (result.ok && result.user) {
        return result.user.profile?.display_name || 
               result.user.profile?.real_name || 
               result.user.name || 
               userId;
      }
      return userId;
    } catch (error) {
      return userId;
    }
  }

  private determineActionNeeded(text: string): boolean {
    const actionKeywords = [
      'help', 'urgent', 'asap', 'can you', 'could you', 'please',
      'need', 'required', 'must', 'should', 'todo', 'task',
      'deadline', 'by tomorrow', 'today', 'this week'
    ];

    const lowerText = text.toLowerCase();
    return actionKeywords.some(keyword => lowerText.includes(keyword));
  }

  private calculateUrgencyScore(text: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();

    // High urgency indicators
    const highUrgencyWords = ['urgent', 'asap', 'emergency', 'critical', 'immediately'];
    const mediumUrgencyWords = ['soon', 'today', 'this week', 'deadline', 'important'];
    const lowUrgencyWords = ['when you can', 'no rush', 'sometime', 'eventually'];

    highUrgencyWords.forEach(word => {
      if (lowerText.includes(word)) score += 30;
    });

    mediumUrgencyWords.forEach(word => {
      if (lowerText.includes(word)) score += 15;
    });

    lowUrgencyWords.forEach(word => {
      if (lowerText.includes(word)) score -= 20;
    });

    // Question marks and exclamation marks
    const questionMarks = (text.match(/\?/g) || []).length;
    const exclamationMarks = (text.match(/!/g) || []).length;

    score += questionMarks * 5;
    score += exclamationMarks * 10;

    // Message length (shorter messages often more urgent)
    if (text.length < 50) score += 10;
    else if (text.length > 200) score -= 5;

    // All caps
    if (text === text.toUpperCase() && text.length > 10) score += 20;

    // Mentions (@user)
    const mentions = (text.match(/@\w+/g) || []).length;
    score += mentions * 5;

    return Math.max(0, Math.min(100, score));
  }

  async getUserInfo(channelId: string, userId: string): Promise<any> {
    const client = this.clients.get(channelId);
    if (!client) {
      throw new Error('Slack client not connected');
    }

    try {
      const result = await client.users.info({ user: userId });
      return result.user;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  async createSlackTask(channelId: string, slackChannelId: string, taskTitle: string, description?: string): Promise<void> {
    try {
      const message = `📋 *New Task Created*\n\n*Title:* ${taskTitle}\n${description ? `*Description:* ${description}\n` : ''}\n_This task has been added to your GTD system._`;
      
      await this.sendMessage(channelId, slackChannelId, message);
    } catch (error) {
      console.error('Error creating Slack task notification:', error);
    }
  }
}

export const slackService = new SlackService();
