import { apiClient } from './client';

export interface AreaOfResponsibility {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  purpose?: string;
  outcomes?: string[];
  currentFocus?: string;
  reviewFrequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  isActive: boolean;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projects: number;
  };
  projects?: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    endDate?: string;
  }>;
}

export interface AreasResponse {
  areas: AreaOfResponsibility[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AreaFilters {
  isActive?: 'true' | 'false' | 'all';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAreaRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  purpose?: string;
  outcomes?: string[];
  currentFocus?: string;
  reviewFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  isActive?: boolean;
}

export interface UpdateAreaRequest extends Partial<CreateAreaRequest> {}

export interface AreaStats {
  totalAreas: number;
  activeAreas: number;
  inactiveAreas: number;
  areasWithProjects: number;
  areasWithoutProjects: number;
  recentlyUpdated: number;
}

export const areasApi = {
  // Get all areas with filters and pagination
  async getAreas(filters: AreaFilters = {}): Promise<AreasResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/areas?${params.toString()}`);
    return response.data;
  },

  // Get single area by ID
  async getArea(id: string): Promise<AreaOfResponsibility> {
    const response = await apiClient.get(`/areas/${id}`);
    return response.data;
  },

  // Create new area
  async createArea(data: CreateAreaRequest): Promise<AreaOfResponsibility> {
    const response = await apiClient.post('/areas', data);
    return response.data;
  },

  // Update area
  async updateArea(id: string, data: UpdateAreaRequest): Promise<AreaOfResponsibility> {
    const response = await apiClient.put(`/areas/${id}`, data);
    return response.data;
  },

  // Delete area
  async deleteArea(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/areas/${id}`);
    return response.data;
  },

  // Get areas statistics
  async getAreasStats(): Promise<AreaStats> {
    const response = await apiClient.get('/areas/stats/overview');
    return response.data;
  },

  // Helper: Get default area colors
  getDefaultColors(): string[] {
    return [
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6366F1', // Indigo
    ];
  },

  // Helper: Get default icons
  getDefaultIcons(): Array<{ icon: string; label: string }> {
    return [
      { icon: '🏠', label: 'Home' },
      { icon: '💼', label: 'Work' },
      { icon: '💰', label: 'Finance' },
      { icon: '🏥', label: 'Health' },
      { icon: '👨‍👩‍👧‍👦', label: 'Family' },
      { icon: '🎓', label: 'Learning' },
      { icon: '🚗', label: 'Travel' },
      { icon: '🏋️', label: 'Fitness' },
      { icon: '🎨', label: 'Creative' },
      { icon: '🌱', label: 'Growth' },
      { icon: '🔧', label: 'Maintenance' },
      { icon: '📚', label: 'Reading' },
      { icon: '🎵', label: 'Music' },
      { icon: '🍳', label: 'Cooking' },
      { icon: '🌍', label: 'Community' },
    ];
  },

  // Helper: Get review frequency options
  getReviewFrequencyOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'WEEKLY', label: 'Weekly' },
      { value: 'MONTHLY', label: 'Monthly' },
      { value: 'QUARTERLY', label: 'Quarterly' },
    ];
  }
};

export default areasApi;