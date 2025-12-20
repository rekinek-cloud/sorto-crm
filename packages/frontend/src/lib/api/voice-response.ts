import { apiClient, ApiResponse } from './client';

// Voice Response Types
export interface VoiceResponseRequest {
  query: string;
  responseType: 'TASK' | 'CLIENT' | 'CALENDAR' | 'GOAL' | 'ERROR';
  context?: {
    userId?: string;
    timeOfDay?: string;
    productivity?: number;
    emotionalState?: string;
    userPreferences?: {
      voiceSpeed?: 'slow' | 'normal' | 'fast';
      formality?: 'casual' | 'professional';
      motivation?: boolean;
    };
  };
  maxResponseDuration?: number;
}

export interface VoiceResponseData {
  id: string;
  text: string;
  ssml: string;
  responseType: string;
  emotionalContext: {
    primaryEmotion: string;
    confidence: number;
  };
  variant?: {
    id: string;
    testId?: string;
  };
  generationTime: number;
  estimatedDuration: number;
  followUpSuggestions: string[];
}

export interface VoiceFeedback {
  responseId: string;
  rating: number; // 1-5
  feedbackType: 'thumbs_up' | 'thumbs_down' | 'rating' | 'detailed';
  comments?: string;
  responseTime?: number;
  contextRelevant?: boolean;
}

export interface VoiceAnalytics {
  timeRange: string;
  totalEvents: number;
  uniqueUsers: number;
  responseTypes: Record<string, any>;
  satisfactionMetrics: {
    averageRating: number;
    totalFeedback: number;
    satisfactionRate: number;
    nps: number;
  };
  usagePatterns: Record<string, any>;
  performanceMetrics: Record<string, any>;
}

export interface ABTestConfig {
  name: string;
  description?: string;
  responseType: string;
  variants: Array<{
    name: string;
    weight?: number;
    config?: Record<string, any>;
    templateOverride?: string;
    ssmlSettings?: Record<string, any>;
  }>;
  metrics: string[];
  targetAudience?: Record<string, any>;
  minSampleSize?: number;
  confidenceLevel?: number;
}

export interface ABTestResult {
  testId: string;
  testName: string;
  status: string;
  variants: any[];
  significance: {
    significant: boolean;
    confidence: number;
    lift: number;
  };
  winner: {
    variantId: string | null;
    improvement: number;
  };
  recommendation: {
    action: string;
    reason: string;
    confidence: string;
  };
}

// Voice Response API Client
export class VoiceResponseAPI {
  // Generate voice response
  static async generateResponse(request: VoiceResponseRequest): Promise<VoiceResponseData> {
    const response = await apiClient.post<ApiResponse<VoiceResponseData>>(
      '/voice-response/generate',
      request
    );
    return response.data.data;
  }

  // Submit user feedback
  static async submitFeedback(feedback: VoiceFeedback): Promise<void> {
    await apiClient.post('/voice-response/feedback', feedback);
  }

  // Get voice analytics
  static async getAnalytics(timeRange: string = '7d'): Promise<VoiceAnalytics> {
    const response = await apiClient.get<ApiResponse<VoiceAnalytics>>(
      `/voice-response/analytics?timeRange=${timeRange}`
    );
    return response.data.data;
  }

  // A/B Testing endpoints
  static async createABTest(config: ABTestConfig): Promise<{ testId: string }> {
    const response = await apiClient.post<ApiResponse<{ testId: string }>>(
      '/voice-response/ab-tests',
      config
    );
    return response.data.data;
  }

  static async getABTestResults(testId?: string): Promise<ABTestResult[]> {
    const url = testId ? `/voice-response/ab-tests/${testId}/results` : '/voice-response/ab-tests/results';
    const response = await apiClient.get<ApiResponse<ABTestResult[]>>(url);
    return response.data.data;
  }

  static async promoteWinningVariant(testId: string, variantId: string): Promise<void> {
    await apiClient.post(`/voice-response/ab-tests/${testId}/promote`, { variantId });
  }

  static async stopABTest(testId: string, reason?: string): Promise<void> {
    await apiClient.post(`/voice-response/ab-tests/${testId}/stop`, { reason });
  }

  // User preferences
  static async getUserPreferences(): Promise<any> {
    const response = await apiClient.get('/voice-response/preferences');
    return response.data.data;
  }

  static async updateUserPreferences(preferences: any): Promise<void> {
    await apiClient.put('/voice-response/preferences', preferences);
  }
}

export default VoiceResponseAPI;
