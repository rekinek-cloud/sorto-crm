import { apiClient } from './client';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: string;
  variables: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  type: 'to' | 'cc' | 'bcc';
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  contentType: string;
  size: number;
}

export interface SendEmailData {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateVariables?: Record<string, string>;
  scheduledAt?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  contactId?: string;
  companyId?: string;
  dealId?: string;
}

export interface SentEmail {
  id: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  createdAt: string;
}

export interface BulkSendData {
  recipientIds: string[];
  recipientType: 'contact' | 'company' | 'lead';
  subject: string;
  body: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  scheduledAt?: string;
}

export const modernEmailApi = {
  // Send single email
  async sendEmail(data: SendEmailData): Promise<{ success: boolean; email: SentEmail }> {
    const response = await apiClient.post('/modern-email/send', data);
    return response.data;
  },

  // Send bulk emails
  async sendBulkEmails(data: BulkSendData): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors?: string[];
  }> {
    const response = await apiClient.post('/modern-email/bulk-send', data);
    return response.data;
  },

  // Get sent emails history
  async getSentEmails(params?: {
    contactId?: string;
    companyId?: string;
    dealId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    emails: SentEmail[];
    total: number;
  }> {
    const response = await apiClient.get('/modern-email/sent', { params });
    return response.data;
  },

  // Get email templates
  async getTemplates(category?: string): Promise<{ templates: EmailTemplate[] }> {
    const params = category ? { category } : undefined;
    const response = await apiClient.get('/modern-email/templates', { params });
    return response.data;
  },

  // Get single template
  async getTemplate(id: string): Promise<{ template: EmailTemplate }> {
    const response = await apiClient.get(`/modern-email/templates/${id}`);
    return response.data;
  },

  // Create template
  async createTemplate(data: {
    name: string;
    subject: string;
    body: string;
    category?: string;
    variables?: string[];
  }): Promise<{ template: EmailTemplate }> {
    const response = await apiClient.post('/modern-email/templates', data);
    return response.data;
  },

  // Update template
  async updateTemplate(id: string, data: {
    name?: string;
    subject?: string;
    body?: string;
    category?: string;
    variables?: string[];
  }): Promise<{ template: EmailTemplate }> {
    const response = await apiClient.put(`/modern-email/templates/${id}`, data);
    return response.data;
  },

  // Delete template
  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/modern-email/templates/${id}`);
    return response.data;
  },

  // Preview email with template
  async previewEmail(templateId: string, variables: Record<string, string>): Promise<{
    subject: string;
    body: string;
  }> {
    const response = await apiClient.post(`/modern-email/templates/${templateId}/preview`, { variables });
    return response.data;
  }
};
