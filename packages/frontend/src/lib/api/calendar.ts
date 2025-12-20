import apiClient, { ApiResponse } from './client';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: 'TASK' | 'PROJECT' | 'MEETING' | 'RECURRING_TASK' | 'DEAL' | 'INVOICE' | 'WEEKLY_REVIEW' | 'NEXT_ACTION' | 'HABIT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: string;
  color?: string;
  category?: string;
  location?: string;
  attendees?: string[];
  metadata?: {
    originalEntity: string;
    entityId: string;
    assignedTo?: string;
    project?: string;
    company?: string;
  };
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    total: number;
    byType: Record<string, number>;
  };
}

export interface CalendarSummary {
  thisWeek: {
    tasks: number;
    meetings: number;
    recurringTasks: number;
    deals: number;
    total: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export interface CalendarFilters {
  startDate?: string;
  endDate?: string;
  types?: string; // comma-separated
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string;
}

export const calendarApi = {
  // Get calendar events
  getEvents: async (filters?: CalendarFilters): Promise<CalendarEventsResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      if (filters?.types) params.set('types', filters.types);
      if (filters?.priority) params.set('priority', filters.priority);
      if (filters?.assignedToId) params.set('assignedToId', filters.assignedToId);

      const url = `/calendar/events${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('getEvents: calling URL:', url);
      
      const response = await apiClient.get<ApiResponse<CalendarEventsResponse>>(url);
      console.log('getEvents: response.data:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else {
        console.error('getEvents: Unexpected response structure:', response.data);
        throw new Error('Unexpected API response structure');
      }
    } catch (error: any) {
      console.error('getEvents: API error:', error);
      throw error;
    }
  },

  // Get calendar summary
  getSummary: async (): Promise<CalendarSummary> => {
    try {
      const response = await apiClient.get<ApiResponse<CalendarSummary>>('/calendar/summary');
      
      if (response.data.data) {
        return response.data.data;
      } else {
        console.error('getSummary: Unexpected response structure:', response.data);
        throw new Error('Unexpected API response structure');
      }
    } catch (error: any) {
      console.error('getSummary: API error:', error);
      throw error;
    }
  },

  // Format event for display
  formatEventTitle: (event: CalendarEvent): string => {
    const typeEmojis = {
      TASK: '📋',
      PROJECT: '🎯',
      MEETING: '📞',
      RECURRING_TASK: '🔄',
      DEAL: '💰',
      INVOICE: '📄',
      WEEKLY_REVIEW: '📊',
      NEXT_ACTION: '⚡',
      HABIT: '🎯'
    };

    return `${typeEmojis[event.type] || '📌'} ${event.title}`;
  },

  // Get event color based on priority and type
  getEventColor: (event: CalendarEvent): string => {
    if (event.color) return event.color;

    // Priority-based colors
    const priorityColors = {
      URGENT: '#EF4444', // red
      HIGH: '#F59E0B',   // orange
      MEDIUM: '#3B82F6', // blue
      LOW: '#6B7280'     // gray
    };

    if (event.priority && priorityColors[event.priority]) {
      return priorityColors[event.priority];
    }

    // Type-based colors
    const typeColors = {
      TASK: '#3B82F6',
      PROJECT: '#10B981',
      MEETING: '#8B5CF6',
      RECURRING_TASK: '#F59E0B',
      DEAL: '#EF4444',
      INVOICE: '#6366F1',
      WEEKLY_REVIEW: '#14B8A6',
      NEXT_ACTION: '#06B6D4',
      HABIT: '#14B8A6'
    };

    return typeColors[event.type] || '#6B7280';
  },

  // Group events by date
  groupEventsByDate: (events: CalendarEvent[]): Record<string, CalendarEvent[]> => {
    return events.reduce((groups, event) => {
      const date = new Date(event.startDate).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    }, {} as Record<string, CalendarEvent[]>);
  },

  // Get events for specific date
  getEventsForDate: (events: CalendarEvent[], date: string): CalendarEvent[] => {
    const targetDate = new Date(date).toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === targetDate;
    });
  },

  // Get date range for current week
  getCurrentWeekRange: (): { startDate: string; endDate: string } => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    
    return {
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0]
    };
  },

  // Get date range for current month
  getCurrentMonthRange: (): { startDate: string; endDate: string } => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    };
  }
};