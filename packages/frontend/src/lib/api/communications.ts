import { apiClient } from './client';

export interface CommunicationData {
  type: 'email' | 'phone' | 'meeting' | 'sms' | 'chat';
  direction: 'inbound' | 'outbound';
  subject?: string;
  body?: string;
  duration?: number;
  status?: 'sent' | 'delivered' | 'opened' | 'replied' | 'failed' | 'scheduled' | 'completed';
  
  // Related entities
  companyId?: string;
  contactId?: string;
  dealId?: string;
  taskId?: string;
  projectId?: string;
  meetingId?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
}

export interface CallData {
  contactId: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  notes?: string;
  outcome?: string;
  followUpRequired?: boolean;
}

export const communicationsApi = {
  // Log a communication activity
  logCommunication: async (data: CommunicationData) => {
    const response = await apiClient.post('/communications/log', data);
    return response.data;
  },

  // Send email and log activity
  sendEmail: async (data: EmailData) => {
    const response = await apiClient.post('/communications/email', data);
    return response.data;
  },

  // Log a phone call
  logCall: async (data: CallData) => {
    const response = await apiClient.post('/communications/call', data);
    return response.data;
  },

  // Get communications for a company
  getCompanyCommunications: async (companyId: string) => {
    const response = await apiClient.get(`/communications/company/${companyId}`);
    return response.data;
  }
};

export default communicationsApi;