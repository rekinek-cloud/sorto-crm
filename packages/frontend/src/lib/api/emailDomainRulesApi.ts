import { apiClient } from './client';

export interface EmailDomainRule {
  id: string;
  pattern: string;
  patternType: 'EMAIL' | 'DOMAIN' | 'WILDCARD';
  listType: 'BLACKLIST' | 'WHITELIST' | 'VIP';
  classification: string | null;
  source: string;
  reason: string | null;
  confidence: number;
  matchCount: number;
  lastMatchAt: string | null;
  status: string;
  createdBy: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DomainRulesStats {
  blacklist: number;
  whitelist: number;
  vip: number;
  total: number;
}

export interface CreateDomainRuleRequest {
  pattern: string;
  patternType?: 'EMAIL' | 'DOMAIN' | 'WILDCARD';
  listType: 'BLACKLIST' | 'WHITELIST' | 'VIP';
  classification?: string;
  reason?: string;
}

export interface BulkDomainRuleRequest {
  action: 'ADD' | 'REMOVE';
  patterns: string[];
  listType: 'BLACKLIST' | 'WHITELIST' | 'VIP';
  classification?: string;
}

export const emailDomainRulesApi = {
  async getRules(filters: { listType?: string; status?: string; search?: string } = {}): Promise<EmailDomainRule[]> {
    const params = new URLSearchParams();
    if (filters.listType) params.append('listType', filters.listType);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/email-domain-rules?${params}`);
    return response.data.data;
  },

  async getStats(): Promise<DomainRulesStats> {
    const response = await apiClient.get('/email-domain-rules/stats');
    return response.data.data;
  },

  async createRule(data: CreateDomainRuleRequest): Promise<EmailDomainRule> {
    const response = await apiClient.post('/email-domain-rules', data);
    return response.data.data;
  },

  async deleteRule(id: string): Promise<void> {
    await apiClient.delete(`/email-domain-rules/${id}`);
  },

  async bulkOperation(data: BulkDomainRuleRequest): Promise<{ created?: number; deleted?: number }> {
    const response = await apiClient.post('/email-domain-rules/bulk', data);
    return response.data.data;
  },
};
