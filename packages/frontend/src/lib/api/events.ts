import apiClient from './client';
import { Event } from '@/types/gtd';

export interface EventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface EventFilters {
  status?: string;
  eventType?: string;
  upcoming?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  eventType: 'TRADE_SHOW' | 'CONFERENCE' | 'WEBINAR' | 'WORKSHOP' | 'NETWORKING' | 'COMPANY_EVENT' | 'OTHER';
  venue?: string;
  city?: string;
  country?: string;
  address?: string;
  startDate: string;
  endDate: string;
  setupDate?: string;
  teardownDate?: string;
  status?: 'DRAFT' | 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  budgetPlanned?: number;
  currency?: string;
  goals?: any;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export interface EventCompany {
  id: string;
  eventId: string;
  companyId: string;
  role?: string;
  company?: { id: string; name: string };
}

export interface EventTeamMember {
  id: string;
  eventId: string;
  userId: string;
  role?: string;
  user?: { id: string; firstName: string; lastName: string };
}

export interface EventExpense {
  id: string;
  eventId: string;
  category: string;
  description?: string;
  amount: number;
  currency: string;
}

export interface AddEventCompanyRequest {
  companyId: string;
  role?: string;
}

export interface AddEventTeamMemberRequest {
  userId: string;
  role?: string;
}

export interface CreateEventExpenseRequest {
  category: string;
  description?: string;
  amount: number;
  currency?: string;
}

export const eventsApi = {
  async getEvents(filters: EventFilters = {}): Promise<EventsResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.upcoming !== undefined) params.append('upcoming', filters.upcoming.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<EventsResponse>(`/events?${params.toString()}`);
    return response.data;
  },

  async getEvent(id: string): Promise<Event> {
    const response = await apiClient.get<Event>(`/events/${id}`);
    return response.data;
  },

  async createEvent(data: CreateEventRequest): Promise<Event> {
    const response = await apiClient.post<Event>('/events', data);
    return response.data;
  },

  async updateEvent(id: string, data: UpdateEventRequest): Promise<Event> {
    const response = await apiClient.patch<Event>(`/events/${id}`, data);
    return response.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  },

  // Companies sub-routes
  async getEventCompanies(eventId: string): Promise<EventCompany[]> {
    const response = await apiClient.get<EventCompany[]>(`/events/${eventId}/companies`);
    return response.data;
  },

  async addEventCompany(eventId: string, data: AddEventCompanyRequest): Promise<EventCompany> {
    const response = await apiClient.post<EventCompany>(`/events/${eventId}/companies`, data);
    return response.data;
  },

  async removeEventCompany(eventId: string, companyId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/companies/${companyId}`);
  },

  // Team sub-routes
  async getEventTeam(eventId: string): Promise<EventTeamMember[]> {
    const response = await apiClient.get<EventTeamMember[]>(`/events/${eventId}/team`);
    return response.data;
  },

  async addEventTeamMember(eventId: string, data: AddEventTeamMemberRequest): Promise<EventTeamMember> {
    const response = await apiClient.post<EventTeamMember>(`/events/${eventId}/team`, data);
    return response.data;
  },

  async removeEventTeamMember(eventId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/team/${memberId}`);
  },

  // Expenses sub-routes
  async getEventExpenses(eventId: string): Promise<EventExpense[]> {
    const response = await apiClient.get<EventExpense[]>(`/events/${eventId}/expenses`);
    return response.data;
  },

  async addEventExpense(eventId: string, data: CreateEventExpenseRequest): Promise<EventExpense> {
    const response = await apiClient.post<EventExpense>(`/events/${eventId}/expenses`, data);
    return response.data;
  },

  async removeEventExpense(eventId: string, expenseId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/expenses/${expenseId}`);
  },
};

export default eventsApi;
