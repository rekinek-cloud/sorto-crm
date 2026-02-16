import apiClient, { ApiResponse } from './client';

// Types for GTD Map Views
export interface BucketGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  items: any[];
  count: number;
  metadata?: Record<string, any>;
}

export interface BucketViewType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'perspective' | 'time' | 'organization' | 'execution' | 'workflow';
}

export interface BucketViewData {
  viewType: string;
  buckets: BucketGroup[];
  totalTasks: number;
  metadata: {
    generatedAt: string;
    organizationId: string;
    activeTasksOnly: boolean;
  };
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
  elevation?: number;
}

export interface Visualization3D {
  shape: 'mountain' | 'traffic-light' | 'building' | 'default';
  height: number;
  opacity: number;
  animation: 'pulse' | 'none';
}

export interface BucketGroup3D extends BucketGroup {
  position3D: Position3D;
  visualization: Visualization3D;
}

export interface View3DConfig {
  camera: {
    position: Position3D;
    target: Position3D;
  };
  lighting: {
    ambient: number;
    directional: {
      intensity: number;
      position: Position3D;
    };
  };
  controls: {
    zoom: boolean;
    rotate: boolean;
    pan: boolean;
  };
}

export interface BucketViewData3D extends Omit<BucketViewData, 'buckets'> {
  buckets: BucketGroup3D[];
  view3D: View3DConfig;
}

export const streamsMapViewsApi = {
  // Get all available bucket view types
  getViewTypes: async (): Promise<BucketViewType[]> => {
    try {
      console.log('🔄 API: Requesting bucket view types...');
      const response = await apiClient.get<ApiResponse<BucketViewType[]>>('/streams-map/views');
      console.log('✅ API: Bucket view types received:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ API: Failed to get bucket view types:', error);

      // Fallback do demo data gdy autoryzacja nie działa
      if (error.response?.status === 401) {
        console.log('🔄 API: Returning demo view types due to auth error');
        return [
          {
            id: 'horizon',
            name: 'Mapa wysokości',
            description: 'Grupowanie według poziomów perspektywy GTD (0-5)',
            icon: '🛩️',
            color: '#3B82F6',
            category: 'perspective'
          },
          {
            id: 'urgency',
            name: 'Mapa ruchu',
            description: 'Pilność i deadlines - jak ruch uliczny',
            icon: '🚦',
            color: '#DC2626',
            category: 'time'
          },
          {
            id: 'business',
            name: 'Mapa biznesowa',
            description: 'Według firm i projektów biznesowych',
            icon: '🏢',
            color: '#10B981',
            category: 'organization'
          },
          {
            id: 'energy',
            name: 'Mapa energii',
            description: 'Według poziomu wymaganej energii',
            icon: '⚡',
            color: '#F59E0B',
            category: 'execution'
          },
          {
            id: 'stream',
            name: 'Mapa infrastruktury',
            description: 'Według streamów GTD (workflow)',
            icon: '🌊',
            color: '#8B5CF6',
            category: 'workflow'
          }
        ];
      }
      
      throw error;
    }
  },

  // Get bucket view data for specific view type
  getBucketView: async (viewType: string): Promise<BucketViewData> => {
    try {
      console.log(`🔄 API: Requesting bucket view for ${viewType}...`);
      const response = await apiClient.get<ApiResponse<BucketViewData>>(`/streams-map/views/${viewType}`);
      console.log(`✅ API: Bucket view data received for ${viewType}:`, response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error(`❌ API: Failed to get bucket view ${viewType}:`, error);

      // Fallback do demo data gdy autoryzacja nie działa
      if (error.response?.status === 401) {
        console.log(`🔄 API: Returning demo bucket view for ${viewType} due to auth error`);
        return createDemoBucketView(viewType);
      }
      
      throw error;
    }
  },

  // Get 3D visualization data for specific view type
  get3DBucketView: async (viewType: string): Promise<BucketViewData3D> => {
    try {
      const response = await apiClient.get<ApiResponse<BucketViewData3D>>(`/streams-map/views/${viewType}/3d`);
      return response.data.data;
    } catch (error: any) {
      console.error(`Failed to get 3D bucket view ${viewType}:`, error);
      throw error;
    }
  },

  // Refresh specific bucket view (force reload)
  refreshBucketView: async (viewType: string): Promise<BucketViewData> => {
    try {
      const response = await apiClient.get<ApiResponse<BucketViewData>>(`/streams-map/views/${viewType}?refresh=true`);
      return response.data.data;
    } catch (error: any) {
      console.error(`Failed to refresh bucket view ${viewType}:`, error);
      throw error;
    }
  }
};

// Helper functions for working with bucket views
export const bucketViewHelpers = {
  // Get total task count across all buckets
  getTotalTaskCount: (buckets: BucketGroup[]): number => {
    return buckets.reduce((total, bucket) => total + bucket.count, 0);
  },

  // Find bucket by ID
  findBucketById: (buckets: BucketGroup[], bucketId: string): BucketGroup | undefined => {
    return buckets.find(bucket => bucket.id === bucketId);
  },

  // Get buckets sorted by count (descending)
  getBucketsSortedByCount: (buckets: BucketGroup[]): BucketGroup[] => {
    return [...buckets].sort((a, b) => b.count - a.count);
  },

  // Get non-empty buckets only
  getNonEmptyBuckets: (buckets: BucketGroup[]): BucketGroup[] => {
    return buckets.filter(bucket => bucket.count > 0);
  },

  // Get bucket view category icon
  getCategoryIcon: (category: BucketViewType['category']): string => {
    const categoryIcons = {
      perspective: '🛩️',
      time: '⏰',
      organization: '🏢',
      execution: '⚡',
      workflow: '🌊'
    };
    return categoryIcons[category] || '📋';
  },

  // Calculate urgency score for bucket
  calculateUrgencyScore: (bucket: BucketGroup): number => {
    const urgencyMap = {
      'overdue': 100,
      'urgent': 80,
      'important': 60,
      'normal': 40
    };
    return urgencyMap[bucket.id as keyof typeof urgencyMap] || 50;
  },

  // Get recommended action for bucket
  getRecommendedAction: (bucket: BucketGroup, viewType: string): string => {
    if (viewType === 'urgency') {
      if (bucket.id === 'overdue') return 'Natychmiastowa akcja wymagana!';
      if (bucket.id === 'urgent') return 'Zaplanuj na dziś';
      if (bucket.id === 'important') return 'Zaplanuj na ten tydzień';
      return 'Monitoruj i planuj';
    }
    
    if (viewType === 'energy') {
      if (bucket.id === 'high-energy') return 'Najlepsze dla poranków';
      if (bucket.id === 'medium-energy') return 'Idealne na popołudnie';
      return 'Doskonałe na wieczór';
    }
    
    if (viewType === 'horizon') {
      const level = bucket.metadata?.horizonLevel || 0;
      if (level === 0) return 'Codzienne przetwarzanie';
      if (level === 1) return 'Tygodniowy przegląd';
      if (level === 2) return 'Miesięczna ocena';
      return 'Kwartalna strategia';
    }
    
    return 'Sprawdź szczegóły';
  },

  // Format bucket metadata for display
  formatMetadata: (metadata: Record<string, any>): string[] => {
    const formatted: string[] = [];
    
    if (metadata.urgencyLevel) {
      formatted.push(`Pilność: ${metadata.urgencyLevel}`);
    }
    
    if (metadata.energyLevel) {
      formatted.push(`Energia: ${metadata.energyLevel}`);
    }
    
    if (metadata.horizonLevel !== undefined) {
      formatted.push(`Poziom: ${metadata.horizonLevel}`);
    }
    
    if (metadata.reviewFrequency) {
      formatted.push(`Przegląd: ${metadata.reviewFrequency}`);
    }
    
    if (metadata.efficiency !== undefined) {
      formatted.push(`Skuteczność: ${metadata.efficiency}%`);
    }
    
    return formatted;
  },

  // Get bucket color with opacity
  getBucketColorWithOpacity: (bucket: BucketGroup, opacity: number = 1): string => {
    const hex = bucket.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  // Generate gradient for bucket background
  getBucketGradient: (bucket: BucketGroup): string => {
    const baseColor = bucket.color;
    const lightColor = bucketViewHelpers.getBucketColorWithOpacity(bucket, 0.3);
    return `linear-gradient(135deg, ${baseColor} 0%, ${lightColor} 100%)`;
  }
};

// View type presets for quick access
export const VIEW_TYPES = {
  HORIZON: 'horizon',
  URGENCY: 'urgency', 
  BUSINESS: 'business',
  ENERGY: 'energy',
  STREAM: 'stream'
} as const;

export type ViewTypeId = typeof VIEW_TYPES[keyof typeof VIEW_TYPES];

// Demo data generator for testing when API fails
const createDemoBucketView = (viewType: string): BucketViewData => {
  const demoBuckets: BucketGroup[] = [];
  
  if (viewType === 'horizon') {
    demoBuckets.push(
      {
        id: 'horizon-0',
        name: 'Runway (Działania)',
        description: 'Bieżące zadania i działania',
        color: '#10B981',
        icon: '🛫',
        items: [],
        count: 25,
        metadata: { horizonLevel: 0, reviewFrequency: 'daily' }
      },
      {
        id: 'horizon-1',
        name: '10,000ft (Projekty)',
        description: 'Projekty wieloetapowe',
        color: '#3B82F6',
        icon: '🏢',
        items: [],
        count: 12,
        metadata: { horizonLevel: 1, reviewFrequency: 'weekly' }
      },
      {
        id: 'horizon-2',
        name: '20,000ft (Obszary)',
        description: 'Obszary odpowiedzialności',
        color: '#8B5CF6',
        icon: '🌍',
        items: [],
        count: 8,
        metadata: { horizonLevel: 2, reviewFrequency: 'monthly' }
      }
    );
  } else if (viewType === 'urgency') {
    demoBuckets.push(
      {
        id: 'overdue',
        name: 'Po terminie',
        description: 'Zadania przeterminowane - wymagają natychmiastowej uwagi',
        color: '#DC2626',
        icon: '🔴',
        items: [],
        count: 3,
        metadata: { urgencyLevel: 'critical', priority: 1 }
      },
      {
        id: 'urgent',
        name: 'Dziś',
        description: 'Zadania na dziś - wysoka pilność',
        color: '#F59E0B',
        icon: '🟡',
        items: [],
        count: 8,
        metadata: { urgencyLevel: 'high', priority: 2 }
      },
      {
        id: 'important',
        name: 'Ten tydzień',
        description: 'Zadania na najbliższy tydzień',
        color: '#3B82F6',
        icon: '🔵',
        items: [],
        count: 15,
        metadata: { urgencyLevel: 'medium', priority: 3 }
      }
    );
  } else {
    // Fallback dla innych widoków
    demoBuckets.push(
      {
        id: `${viewType}-demo`,
        name: `Demo ${viewType}`,
        description: `Demonstracyjne dane dla widoku ${viewType}`,
        color: '#6B7280',
        icon: '📋',
        items: [],
        count: 10,
        metadata: {}
      }
    );
  }

  return {
    viewType,
    buckets: demoBuckets,
    totalTasks: demoBuckets.reduce((sum, bucket) => sum + bucket.count, 0),
    metadata: {
      generatedAt: new Date().toISOString(),
      organizationId: 'demo-org',
      activeTasksOnly: true
    }
  };
};