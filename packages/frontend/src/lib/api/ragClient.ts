/**
 * RAG Service API Client - Week 5 Integration
 * Client for communicating with RAG service endpoints
 */

import axios from 'axios';
import Cookies from 'js-cookie';

// RAG Service base URL (proxied through nginx)
const ragBaseURL = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://91.99.50.80/rag-api';
console.log('🔧 RAG API Client Config:', { ragBaseURL });

// Create axios instance for RAG service
export const ragClient = axios.create({
  baseURL: `${ragBaseURL}/api/v1`,
  timeout: 60000, // 60 seconds for complex reasoning
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
ragClient.interceptors.request.use(
  (config) => {
    console.log('🌐 RAG API Request:', config.method?.toUpperCase(), config.url);

    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
ragClient.interceptors.response.use(
  (response) => {
    console.log('✅ RAG API Response:', response.status, response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  (error) => {
    console.log('❌ RAG API Error:', error.response?.status, error.config?.method?.toUpperCase(), error.config?.url);
    return Promise.reject(error);
  }
);

// Week 5 API Methods

/**
 * Multi-step Reasoning
 */
export const reasoning = {
  /**
   * Analyze query complexity and create reasoning plan
   */
  analyzeComplexity: async (query: string, context?: any) => {
    const response = await ragClient.post('/reasoning/analyze-complexity', {
      query,
      context
    });
    return response.data;
  },

  /**
   * Execute full multi-step reasoning pipeline
   */
  execute: async (query: string, userId: string, organizationId: string, context?: any) => {
    const response = await ragClient.post('/reasoning/execute', {
      query,
      userId,
      organizationId,
      context
    });
    return response.data;
  }
};

/**
 * Comparative Analysis
 */
export const comparison = {
  /**
   * Compare multiple entities across dimensions
   */
  compareEntities: async (
    entityType: string,
    entityIds: string[],
    userId: string,
    organizationId: string,
    dimensions?: string[]
  ) => {
    const response = await ragClient.post('/comparison/entities', {
      entity_type: entityType,
      entity_ids: entityIds,
      dimensions,
      userId,
      organizationId
    });
    return response.data;
  },

  /**
   * Compare data across two time periods
   */
  compareTimePeriods: async (
    entityType: string,
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string,
    userId: string,
    organizationId: string,
    period1Label?: string,
    period2Label?: string
  ) => {
    const response = await ragClient.post('/comparison/time-periods', {
      entity_type: entityType,
      period1_start: period1Start,
      period1_end: period1End,
      period2_start: period2Start,
      period2_end: period2End,
      period1_label: period1Label || 'Period 1',
      period2_label: period2Label || 'Period 2',
      userId,
      organizationId
    });
    return response.data;
  },

  /**
   * Compare performance (leaderboard style)
   */
  comparePerformance: async (
    entityType: string,
    metric: string,
    userId: string,
    organizationId: string,
    topN: number = 5
  ) => {
    const response = await ragClient.post('/comparison/performance', {
      entity_type: entityType,
      metric,
      top_n: topN,
      userId,
      organizationId
    });
    return response.data;
  }
};

/**
 * Smart Day Planner Integration
 */
export const planning = {
  /**
   * Suggest optimal time block for task
   */
  suggestSchedule: async (
    taskId: string,
    taskName: string,
    userId: string,
    organizationId: string,
    options?: {
      taskDescription?: string;
      estimatedDuration?: number;
      priority?: string;
      deadline?: string;
      energyLevelRequired?: string;
    }
  ) => {
    const response = await ragClient.post('/planning/suggest-schedule', {
      task_id: taskId,
      task_name: taskName,
      task_description: options?.taskDescription,
      estimated_duration: options?.estimatedDuration,
      priority: options?.priority,
      deadline: options?.deadline,
      energy_level_required: options?.energyLevelRequired,
      userId,
      organizationId
    });
    return response.data;
  },

  /**
   * Detect scheduling conflicts
   */
  detectConflicts: async (
    userId: string,
    organizationId: string,
    date?: string
  ) => {
    const response = await ragClient.post('/planning/detect-conflicts', {
      date,
      userId,
      organizationId
    });
    return response.data;
  },

  /**
   * Optimize entire day plan
   */
  optimizeDay: async (
    userId: string,
    organizationId: string,
    date?: string,
    preferences?: any
  ) => {
    const response = await ragClient.post('/planning/optimize-day', {
      date,
      userId,
      organizationId,
      preferences
    });
    return response.data;
  },

  /**
   * Reschedule task based on energy
   */
  rescheduleTask: async (
    taskId: string,
    userId: string,
    organizationId: string,
    reason?: string
  ) => {
    const response = await ragClient.post('/planning/reschedule-task', {
      task_id: taskId,
      userId,
      organizationId,
      reason
    });
    return response.data;
  }
};

/**
 * Agent Reports
 */
export const reports = {
  /**
   * Generate weekly performance report
   */
  generateWeekly: async (
    userId: string,
    organizationId: string,
    weekOffset: number = 0
  ) => {
    const response = await ragClient.post('/reports/weekly', {
      userId,
      organizationId,
      week_offset: weekOffset
    });
    return response.data;
  },

  /**
   * Generate pipeline report
   */
  generatePipeline: async (
    userId: string,
    organizationId: string,
    includeForecast: boolean = true
  ) => {
    const response = await ragClient.post('/reports/pipeline', {
      userId,
      organizationId,
      include_forecast: includeForecast
    });
    return response.data;
  },

  /**
   * Generate productivity report
   */
  generateProductivity: async (
    userId: string,
    organizationId: string,
    days: number = 7
  ) => {
    const response = await ragClient.post('/reports/productivity', {
      userId,
      organizationId,
      days
    });
    return response.data;
  },

  /**
   * Generate time management report
   */
  generateTimeManagement: async (
    userId: string,
    organizationId: string,
    days: number = 7
  ) => {
    const response = await ragClient.post('/reports/time-management', {
      userId,
      organizationId,
      days
    });
    return response.data;
  }
};

export default ragClient;
