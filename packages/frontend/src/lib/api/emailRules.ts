import { apiClient } from './client';

export interface EmailRule {
  id: string;
  name: string;
  description?: string;
  senderEmail?: string;
  senderDomain?: string;
  subjectContains?: string;
  subjectPattern?: string;
  bodyContains?: string;
  assignCategory: EmailCategory;
  skipAIAnalysis: boolean;
  autoArchive: boolean;
  autoDelete: boolean;
  createTask: boolean;
  priority: number;
  isActive: boolean;
  matchCount: number;
  lastMatched?: string;
  createdAt: string;
  updatedAt: string;
}

export type EmailCategory = 'VIP' | 'SPAM' | 'INVOICES' | 'ARCHIVE' | 'UNKNOWN';

export interface EmailFilterResult {
  category: EmailCategory;
  skipAIAnalysis: boolean;
  autoArchive: boolean;
  autoDelete: boolean;
  createTask: boolean;
  matchedRule?: EmailRule;
  shouldProcessWithAI: boolean;
  estimatedCostReduction: number;
}

export interface EmailFilterStats {
  totalEmailsProcessed: number;
  aiAnalysisSkipped: number;
  costReductionPercentage: number;
  categoryBreakdown: Record<EmailCategory, number>;
  topRules: Array<{ rule: EmailRule; matchCount: number }>;
}

export interface CreateEmailRuleData {
  name: string;
  description?: string;
  senderEmail?: string;
  senderDomain?: string;
  subjectContains?: string;
  subjectPattern?: string;
  bodyContains?: string;
  assignCategory: EmailCategory;
  skipAIAnalysis?: boolean;
  autoArchive?: boolean;
  autoDelete?: boolean;
  createTask?: boolean;
  priority?: number;
}

export const emailRulesApi = {
  // Get all email filtering rules
  async getEmailRules(): Promise<EmailRule[]> {
    const response = await apiClient.get<EmailRule[]>('/communication/email-rules');
    return response.data;
  },

  // Create new email filtering rule
  async createEmailRule(data: CreateEmailRuleData): Promise<EmailRule> {
    const response = await apiClient.post<EmailRule>('/communication/email-rules', data);
    return response.data;
  },

  // Update email filtering rule
  async updateEmailRule(id: string, data: Partial<CreateEmailRuleData>): Promise<EmailRule> {
    const response = await apiClient.put<EmailRule>(`/communication/email-rules/${id}`, data);
    return response.data;
  },

  // Delete email filtering rule
  async deleteEmailRule(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/communication/email-rules/${id}`);
    return response.data;
  },

  // Test email filtering
  async testEmailFilter(data: {
    senderEmail: string;
    subject?: string;
    content?: string;
  }): Promise<{ message: string; result: EmailFilterResult }> {
    const response = await apiClient.post<{ message: string; result: EmailFilterResult }>(
      '/communication/email-rules/test',
      data
    );
    return response.data;
  },

  // Get email filtering statistics
  async getEmailFilterStats(): Promise<EmailFilterStats> {
    const response = await apiClient.get<EmailFilterStats>('/communication/email-rules/stats');
    return response.data;
  },

  // Update contact email category
  async updateContactEmailCategory(contactId: string, emailCategory: EmailCategory): Promise<{
    message: string;
    contact: any;
  }> {
    const response = await apiClient.patch<{ message: string; contact: any }>(
      `/communication/contacts/${contactId}/email-category`,
      { emailCategory }
    );
    return response.data;
  }
};