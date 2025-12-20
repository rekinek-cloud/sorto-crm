import { apiClient } from './client';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
  agenda?: string;
  notes?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  organizationId: string;
  organizedById: string;
  contactId?: string;
  createdAt: string;
  updatedAt: string;
  organizedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: {
      id: string;
      name: string;
    };
  };
}

export interface MeetingsResponse {
  meetings: Meeting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MeetingFilters {
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'all';
  startDate?: string;
  endDate?: string;
  search?: string;
  contactId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
  agenda?: string;
  contactId?: string;
}

export interface UpdateMeetingRequest extends Partial<CreateMeetingRequest> {
  notes?: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
}

export interface MeetingStats {
  totalMeetings: number;
  todayMeetings: number;
  weekMeetings: number;
  monthMeetings: number;
  upcomingMeetings: number;
  completedMeetings: number;
  canceledMeetings: number;
  scheduledMeetings: number;
}

export interface CalendarMeetings {
  year: number;
  month: number;
  meetings: Record<string, Meeting[]>;
  totalMeetings: number;
}

export interface MeetingConflict {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

export const meetingsApi = {
  // Get all meetings with filters and pagination
  async getMeetings(filters: MeetingFilters = {}): Promise<MeetingsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/meetings?${params.toString()}`);
    return response.data;
  },

  // Get single meeting by ID
  async getMeeting(id: string): Promise<Meeting> {
    const response = await apiClient.get(`/meetings/${id}`);
    return response.data;
  },

  // Create new meeting
  async createMeeting(data: CreateMeetingRequest): Promise<Meeting> {
    const response = await apiClient.post('/meetings', data);
    return response.data;
  },

  // Update meeting
  async updateMeeting(id: string, data: UpdateMeetingRequest): Promise<Meeting> {
    const response = await apiClient.put(`/meetings/${id}`, data);
    return response.data;
  },

  // Delete meeting
  async deleteMeeting(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/meetings/${id}`);
    return response.data;
  },

  // Get meetings statistics
  async getMeetingsStats(): Promise<MeetingStats> {
    const response = await apiClient.get('/meetings/stats/overview');
    return response.data;
  },

  // Get calendar view
  async getCalendarMeetings(year: number, month: number): Promise<CalendarMeetings> {
    const response = await apiClient.get(`/meetings/calendar/${year}/${month}`);
    return response.data;
  },

  // Helper: Format meeting duration
  formatDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  },

  // Helper: Format meeting time range
  formatTimeRange(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    };

    const startDate = formatDate(start);
    const endDate = formatDate(end);
    const startTimeStr = formatTime(start);
    const endTimeStr = formatTime(end);

    if (startDate === endDate) {
      return `${startDate}, ${startTimeStr} - ${endTimeStr}`;
    } else {
      return `${startDate} ${startTimeStr} - ${endDate} ${endTimeStr}`;
    }
  },

  // Helper: Check if meeting is today
  isToday(startTime: string): boolean {
    const meetingDate = new Date(startTime);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  },

  // Helper: Check if meeting is upcoming
  isUpcoming(startTime: string): boolean {
    const meetingDate = new Date(startTime);
    const now = new Date();
    return meetingDate > now;
  },

  // Helper: Check if meeting is ongoing
  isOngoing(startTime: string, endTime: string): boolean {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  },

  // Helper: Get meeting status color
  getStatusColor(status: string): { bg: string; text: string; border: string } {
    switch (status) {
      case 'SCHEDULED':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      case 'IN_PROGRESS':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'COMPLETED':
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
      case 'CANCELED':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  },

  // Helper: Get meeting type icons
  getMeetingTypeIcon(location?: string, meetingUrl?: string): string {
    if (meetingUrl) {
      if (meetingUrl.includes('zoom')) return '📹 Zoom';
      if (meetingUrl.includes('teams')) return '📹 Teams';
      if (meetingUrl.includes('meet')) return '📹 Meet';
      return '💻 Online';
    }
    if (location) {
      return '📍 In-person';
    }
    return '📅 Meeting';
  },

  // Helper: Generate meeting URL suggestions
  getUrlSuggestions(): Array<{ label: string; placeholder: string }> {
    return [
      { label: 'Zoom', placeholder: 'https://zoom.us/j/123456789' },
      { label: 'Microsoft Teams', placeholder: 'https://teams.microsoft.com/l/meetup-join/...' },
      { label: 'Google Meet', placeholder: 'https://meet.google.com/abc-def-ghi' },
      { label: 'Skype', placeholder: 'https://join.skype.com/abc123def456' },
      { label: 'Custom', placeholder: 'https://your-meeting-platform.com/meeting-id' }
    ];
  },

  // Helper: Validate meeting time
  validateMeetingTime(startTime: string, endTime: string): string | null {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start >= end) {
      return 'End time must be after start time';
    }

    if (start < now) {
      return 'Meeting cannot be scheduled in the past';
    }

    const duration = end.getTime() - start.getTime();
    const maxDuration = 8 * 60 * 60 * 1000; // 8 hours

    if (duration > maxDuration) {
      return 'Meeting duration cannot exceed 8 hours';
    }

    return null;
  }
};

export default meetingsApi;