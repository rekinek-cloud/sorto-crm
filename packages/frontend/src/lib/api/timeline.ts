import { apiClient } from './client';

export type TimelineEventType =
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'project_created'
  | 'project_completed'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'contact_created'
  | 'contact_updated'
  | 'email_sent'
  | 'email_received'
  | 'meeting_scheduled'
  | 'note_added'
  | 'custom';

export interface TimelineEvent {
  id: string;
  eventId: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  metadata?: Record<string, any>;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimelineEventData {
  eventId: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  metadata?: Record<string, any>;
}

export const timelineApi = {
  // Get timeline events
  async getEvents(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ events: TimelineEvent[] }> {
    const response = await apiClient.get('/timeline', { params });
    return response.data;
  },

  // Create timeline event
  async createEvent(data: CreateTimelineEventData): Promise<TimelineEvent> {
    const response = await apiClient.post('/timeline', data);
    return response.data;
  }
};
