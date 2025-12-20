import { apiClient } from './client';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  currentStreak: number;
  bestStreak: number;
  startDate: string;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    entries: number;
  };
  entries?: HabitEntry[];
}

export interface HabitEntry {
  id: string;
  date: string;
  completed: boolean;
  notes?: string;
  habitId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitsResponse {
  habits: Habit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface HabitFilters {
  isActive?: 'true' | 'false' | 'all';
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'all';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

export interface UpdateHabitRequest extends Partial<CreateHabitRequest> {
  isActive?: boolean;
}

export interface HabitStats {
  totalHabits: number;
  activeHabits: number;
  inactiveHabits: number;
  habitsWithEntries: number;
  todayCompleted: number;
  weeklyCompletionRate: number;
  longestStreak: number;
}

export interface HabitCalendarData {
  habit: Habit;
  entries: HabitEntry[];
  year: number;
  month: number;
}

export interface CreateHabitEntryRequest {
  date: string;
  completed?: boolean;
  notes?: string;
}

export const habitsApi = {
  // Get all habits with filters and pagination
  async getHabits(filters: HabitFilters = {}): Promise<HabitsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/habits?${params.toString()}`);
    return response.data;
  },

  // Get single habit by ID
  async getHabit(id: string): Promise<Habit> {
    const response = await apiClient.get(`/habits/${id}`);
    return response.data;
  },

  // Create new habit
  async createHabit(data: CreateHabitRequest): Promise<Habit> {
    const response = await apiClient.post('/habits', data);
    return response.data;
  },

  // Update habit
  async updateHabit(id: string, data: UpdateHabitRequest): Promise<Habit> {
    const response = await apiClient.put(`/habits/${id}`, data);
    return response.data;
  },

  // Delete habit
  async deleteHabit(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/habits/${id}`);
    return response.data;
  },

  // Get habits statistics
  async getHabitsStats(): Promise<HabitStats> {
    const response = await apiClient.get('/habits/stats/overview');
    return response.data;
  },

  // Create or update habit entry
  async createHabitEntry(habitId: string, data: CreateHabitEntryRequest): Promise<HabitEntry> {
    const response = await apiClient.post(`/habits/${habitId}/entries`, data);
    return response.data;
  },

  // Get habit calendar data
  async getHabitCalendar(habitId: string, year?: number, month?: number): Promise<HabitCalendarData> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await apiClient.get(`/habits/${habitId}/calendar?${params.toString()}`);
    return response.data;
  },

  // Helper: Get frequency options
  getFrequencyOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'DAILY', label: 'Daily' },
      { value: 'WEEKLY', label: 'Weekly' },
      { value: 'MONTHLY', label: 'Monthly' },
      { value: 'QUARTERLY', label: 'Quarterly' },
      { value: 'YEARLY', label: 'Yearly' },
    ];
  },

  // Helper: Get default habit icons
  getDefaultIcons(): Array<{ icon: string; label: string }> {
    return [
      { icon: '💧', label: 'Drink Water' },
      { icon: '🏃', label: 'Exercise' },
      { icon: '📚', label: 'Reading' },
      { icon: '🧘', label: 'Meditation' },
      { icon: '💤', label: 'Sleep' },
      { icon: '🍎', label: 'Healthy Eating' },
      { icon: '✍️', label: 'Writing' },
      { icon: '🎯', label: 'Goals' },
      { icon: '🧠', label: 'Learning' },
      { icon: '🚭', label: 'No Smoking' },
      { icon: '💪', label: 'Strength' },
      { icon: '🚶', label: 'Walking' },
      { icon: '🌅', label: 'Early Rise' },
      { icon: '📱', label: 'Digital Detox' },
      { icon: '🎨', label: 'Creativity' },
    ];
  },

  // Helper: Format streak text
  formatStreak(streak: number): string {
    if (streak === 0) return 'No streak yet';
    if (streak === 1) return '1 day streak';
    return `${streak} days streak`;
  },

  // Helper: Get completion status for a date
  getCompletionForDate(entries: HabitEntry[], date: Date): HabitEntry | null {
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(entry => entry.date.startsWith(dateStr)) || null;
  },

  // Helper: Calculate completion rate for a period
  calculateCompletionRate(entries: HabitEntry[], totalDays: number): number {
    const completedDays = entries.filter(entry => entry.completed).length;
    return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  },

  // Helper: Get streak style for UI
  getStreakStyle(streak: number): { color: string; emoji: string } {
    if (streak === 0) return { color: 'text-gray-500', emoji: '⭕' };
    if (streak < 3) return { color: 'text-yellow-600', emoji: '🔥' };
    if (streak < 7) return { color: 'text-orange-600', emoji: '🔥🔥' };
    if (streak < 30) return { color: 'text-red-600', emoji: '🔥🔥🔥' };
    return { color: 'text-purple-600', emoji: '🏆' };
  }
};

export default habitsApi;