import { apiClient } from './client';

export type EmailProviderType = 'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'EXCHANGE' | 'CUSTOM';
export type EmailAccountStatus = 'PENDING' | 'ACTIVE' | 'ERROR' | 'DISABLED';

/** EmailProvider used as a selectable provider object in the UI */
export interface EmailProvider {
  provider: EmailProviderType;
  name: string;
  description: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  helpText?: string;
}

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: EmailProviderType;
  isActive: boolean;
  status: EmailAccountStatus;
  lastSyncAt?: string;
  syncCount: number;
  syncIntervalMin: number;
  maxMessages: number;
  syncFolders: string[];
  errorMessage?: string;
  lastErrorAt?: string;
  // Connection details (passwords excluded)
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  imapUsername?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailAccountData {
  name: string;
  email: string;
  provider: EmailProviderType;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapUsername: string;
  imapPassword: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  syncIntervalMin?: number;
  maxMessages?: number;
  syncFolders?: string[];
}

export interface EmailProviderConfig {
  provider: EmailProviderType;
  name: string;
  description: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  helpText: string;
}

export interface TestConnectionResult {
  imap: { success: boolean; error: string | null };
  smtp: { success: boolean; error: string | null };
}

export interface SyncResult {
  success: boolean;
  newMessages: number;
  error?: string;
}

export const emailAccountsApi = {
  // Get all email accounts
  async getAccounts(): Promise<{ data: EmailAccount[]; count: number }> {
    const response = await apiClient.get('/email-accounts');
    return response.data;
  },

  // Get single email account
  async getAccount(id: string): Promise<{ data: EmailAccount }> {
    const response = await apiClient.get(`/email-accounts/${id}`);
    return response.data;
  },

  // Create email account
  async createAccount(data: CreateEmailAccountData): Promise<{ success: boolean; data: EmailAccount }> {
    const response = await apiClient.post('/email-accounts', data);
    return response.data;
  },

  // Update email account
  async updateAccount(id: string, data: Partial<CreateEmailAccountData>): Promise<{ data: EmailAccount }> {
    const response = await apiClient.put(`/email-accounts/${id}`, data);
    return response.data;
  },

  // Delete email account
  async deleteAccount(id: string): Promise<void> {
    await apiClient.delete(`/email-accounts/${id}`);
  },

  // Test connection
  async testConnection(data: Partial<CreateEmailAccountData>): Promise<{ success: boolean; data: TestConnectionResult }> {
    const response = await apiClient.post('/email-accounts/test-connection', data);
    return response.data;
  },

  // Sync single account
  async syncAccount(id: string): Promise<{ success: boolean; data: SyncResult }> {
    const response = await apiClient.post(`/email-accounts/${id}/sync`);
    return response.data;
  },

  // Sync all accounts
  async syncAllAccounts(): Promise<{ success: boolean; message?: string; data: SyncResult[] }> {
    const response = await apiClient.post('/email-accounts/sync-all');
    return response.data;
  },

  // Get available providers
  async getProviders(): Promise<{ data: EmailProvider[] }> {
    const response = await apiClient.get('/email-accounts/providers');
    return response.data;
  }
};
