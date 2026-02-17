import { apiClient } from './client';

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'EMAIL' | 'SLACK' | 'TEAMS' | 'WHATSAPP' | 'SMS';
  active: boolean;
  config: any;
  emailAddress?: string;
  displayName?: string;
  autoProcess?: boolean;
  createTasks?: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSyncAt?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: Record<string, number>;
}

export interface Message {
  id: string;
  channelId: string;
  channel: {
    name: string;
    type: string;
  };
  fromAddress: string;
  fromName?: string;
  subject?: string;
  content: string;
  receivedAt: string;
  isRead: boolean;
  actionNeeded: boolean;
  urgencyScore?: number;
  taskId?: string;
  task?: {
    id: string;
    title: string;
  };
}

export interface ProcessingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    fromEmail?: string;
    subject?: string;
    keywords?: string[];
    urgencyThreshold?: number;
  };
  actions: {
    createTask: boolean;
    assignTo?: string;
    setContext?: string;
    setPriority?: string;
    addTags?: string[];
  };
}

export const communicationApi = {
  // Channels
  async getChannels(): Promise<CommunicationChannel[]> {
    const response = await apiClient.get<CommunicationChannel[]>('/communication/channels');
    return response.data;
  },

  async createChannel(channelData: Omit<CommunicationChannel, 'id' | 'unreadCount' | 'lastMessage' | 'lastMessageAt'>): Promise<CommunicationChannel> {
    const response = await apiClient.post<CommunicationChannel>('/communication/channels', channelData);
    return response.data;
  },

  async updateChannel(channelId: string, channelData: Partial<CommunicationChannel>): Promise<CommunicationChannel> {
    const response = await apiClient.put<CommunicationChannel>(`/communication/channels/${channelId}`, channelData);
    return response.data;
  },

  async deleteChannel(channelId: string): Promise<void> {
    await apiClient.delete(`/communication/channels/${channelId}`);
  },

  async testChannelConnection(channelId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/communication/channels/${channelId}/test`);
    return response.data;
  },

  // Messages
  async getMessages(filters?: {
    channelId?: string;
    isRead?: boolean;
    actionNeeded?: boolean;
    processed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Message[]> {
    const params = new URLSearchParams();
    if (filters?.channelId) params.append('channelId', filters.channelId);
    if (filters?.isRead !== undefined) params.append('unreadOnly', (!filters.isRead).toString());
    if (filters?.actionNeeded !== undefined) params.append('actionNeeded', filters.actionNeeded.toString());
    if (filters?.processed !== undefined) params.append('processed', filters.processed.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const response = await apiClient.get<Message[]>(`/communication/messages${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  async getMessage(messageId: string): Promise<Message> {
    const response = await apiClient.get<Message>(`/communication/messages/${messageId}`);
    return response.data;
  },

  async markAsRead(messageId: string): Promise<void> {
    await apiClient.put(`/communication/messages/${messageId}/read`);
  },

  async processMessage(messageId: string, action: 'PROCESS' | 'IGNORE' | 'ARCHIVE'): Promise<{ success: boolean; taskId?: string }> {
    const response = await apiClient.post<{ success: boolean; taskId?: string }>(`/communication/messages/${messageId}/process`, { action });
    return response.data;
  },

  async syncChannel(channelId: string): Promise<{ syncedCount: number; errors: string[]; message: string }> {
    const response = await apiClient.post<{ syncedCount: number; errors: string[]; message: string }>(`/communication/channels/${channelId}/sync`);
    return response.data;
  },

  // Processing Rules
  async getProcessingRules(): Promise<ProcessingRule[]> {
    const response = await apiClient.get<ProcessingRule[]>('/communication/processing-rules');
    return response.data;
  },

  async createProcessingRule(ruleData: Omit<ProcessingRule, 'id'>): Promise<ProcessingRule> {
    const response = await apiClient.post<ProcessingRule>('/communication/processing-rules', ruleData);
    return response.data;
  },

  async updateProcessingRule(ruleId: string, ruleData: Partial<ProcessingRule>): Promise<ProcessingRule> {
    const response = await apiClient.put<ProcessingRule>(`/communication/processing-rules/${ruleId}`, ruleData);
    return response.data;
  },

  async deleteProcessingRule(ruleId: string): Promise<void> {
    await apiClient.delete(`/communication/processing-rules/${ruleId}`);
  },

  // AI Analysis
  async analyzeMessage(messageId: string): Promise<{
    success: boolean;
    message: string;
    urgencyScore?: number;
    actionNeeded?: boolean;
    sentiment?: string;
    extractedTasks?: string[];
    contactId?: string;
    contact?: any;
    companyId?: string;
    company?: any;
    dealId?: string;
    deal?: any;
    taskId?: string;
    task?: any;
    results?: any[];
    taskCreated?: boolean;
    taskTitle?: string;
    contactCreated?: boolean;
    contactName?: string;
    dealCreated?: boolean;
    dealTitle?: string;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      urgencyScore?: number;
      actionNeeded?: boolean;
      sentiment?: string;
      extractedTasks?: string[];
      contactId?: string;
      contact?: any;
      companyId?: string;
      company?: any;
      dealId?: string;
      deal?: any;
      taskId?: string;
      task?: any;
      results?: any[];
      taskCreated?: boolean;
      taskTitle?: string;
      contactCreated?: boolean;
      contactName?: string;
      dealCreated?: boolean;
      dealTitle?: string;
    }>(`/communication/messages/${messageId}/analyze`);
    return response.data;
  },

  // Communication logging (via /communications route)
  async logCommunicationActivity(data: {
    type: 'email' | 'phone' | 'meeting' | 'sms' | 'chat';
    direction: 'inbound' | 'outbound';
    subject?: string;
    body?: string;
    duration?: number;
    status?: string;
    companyId?: string;
    contactId?: string;
    dealId?: string;
  }): Promise<any> {
    const response = await apiClient.post('/communications/log', data);
    return response.data;
  },

  // Analytics
  async getCommunicationStats(): Promise<{
    totalChannels: number;
    activeChannels: number;
    totalMessages: number;
    unreadMessages: number;
    processedMessages: number;
    autoProcessingRate: number;
    topSenders: Array<{ email: string; count: number }>;
    messagesByChannel: Array<{ channelName: string; count: number }>;
  }> {
    const response = await apiClient.get<{
      totalChannels: number;
      activeChannels: number;
      totalMessages: number;
      unreadMessages: number;
      processedMessages: number;
      autoProcessingRate: number;
      topSenders: Array<{ email: string; count: number }>;
      messagesByChannel: Array<{ channelName: string; count: number }>;
    }>('/communication/statistics');
    return response.data;
  }
};