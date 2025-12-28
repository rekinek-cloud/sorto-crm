/**
 * Dashboard API Client
 * Unified API layer for Bento Dashboard widgets
 */

import apiClient from './client';
import { ragClient } from './ragClient';

// ============= TYPES =============

export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalProjects: number;
  activeProjects: number;
  totalStreams: number;
  inboxCount: number;
  urgentTasks: number;
  overdueCount: number;
}

export interface WeeklySummary {
  completedThisWeek: number;
  createdThisWeek: number;
  productivity: number;
}

export interface PipelineForecast {
  totalWeightedRevenue: number;
  forecastAccuracy: number;
  pipelineHealth: {
    score: number;
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
  };
  forecasts: Array<{
    stage: string;
    value: number;
    probability: number;
    weightedValue: number;
  }>;
}

export interface GoalsOverview {
  total: number;
  active: number;
  achieved: number;
  failed: number;
  approaching: number;
  achievementRate: number;
}

export interface AIInsight {
  id: string;
  type: 'urgent' | 'opportunity' | 'trend' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action?: {
    type: string;
    label: string;
    params: Record<string, any>;
  };
  confidence: number;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: 'deal' | 'contact' | 'task' | 'email' | 'meeting' | 'note' | 'call';
  action: string;
  description: string;
  entityId?: string;
  entityName?: string;
  userId: string;
  userName: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    id: string;
    title: string;
    sourceType: string;
    score: number;
  }>;
}

// ============= API FUNCTIONS =============

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await apiClient.get('/dashboard/stats');
    return response.data.stats || response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      totalTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      totalProjects: 0,
      activeProjects: 0,
      totalStreams: 0,
      inboxCount: 0,
      urgentTasks: 0,
      overdueCount: 0
    };
  }
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(): Promise<WeeklySummary> {
  try {
    const response = await apiClient.get('/dashboard/weekly-summary');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch weekly summary:', error);
    return {
      completedThisWeek: 0,
      createdThisWeek: 0,
      productivity: 0
    };
  }
}

/**
 * Get pipeline forecasting data
 * Uses /deals/pipeline endpoint and transforms data
 */
export async function getPipelineForecast(): Promise<PipelineForecast> {
  try {
    const response = await apiClient.get('/deals/pipeline');
    const data = response.data;

    // Response is an array of stages
    const stages = Array.isArray(data) ? data : (data.stages || data.pipeline || []);

    // Map stage names to probabilities
    const stageProbabilities: Record<string, number> = {
      'PROSPECT': 10,
      'QUALIFIED': 30,
      'PROPOSAL': 50,
      'NEGOTIATION': 75,
      'CLOSED_WON': 100,
      'CLOSED_LOST': 0
    };

    const forecasts = stages.map((stage: any) => {
      const stageName = stage.stage || stage.name;
      const probability = stageProbabilities[stageName] || 50;
      const value = stage.value || stage.totalValue || 0;
      return {
        stage: stageName,
        value,
        probability,
        weightedValue: value * (probability / 100)
      };
    });

    const totalWeightedRevenue = forecasts.reduce((sum: number, f: any) => sum + f.weightedValue, 0);
    const activeStages = stages.filter((s: any) => s.count > 0).length;

    return {
      totalWeightedRevenue,
      forecastAccuracy: 75,
      pipelineHealth: {
        score: activeStages > 3 ? 80 : activeStages > 1 ? 60 : 40,
        status: activeStages > 3 ? 'healthy' : activeStages > 1 ? 'warning' : 'critical',
        issues: []
      },
      forecasts
    };
  } catch (error) {
    console.error('Failed to fetch pipeline forecast:', error);
    return {
      totalWeightedRevenue: 0,
      forecastAccuracy: 0,
      pipelineHealth: { score: 0, status: 'warning', issues: [] },
      forecasts: []
    };
  }
}

/**
 * Get goals overview statistics
 */
export async function getGoalsOverview(): Promise<GoalsOverview> {
  try {
    const response = await apiClient.get('/precise-goals/stats/overview');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Failed to fetch goals overview:', error);
    return {
      total: 0,
      active: 0,
      achieved: 0,
      failed: 0,
      approaching: 0,
      achievementRate: 0
    };
  }
}

/**
 * Get AI insights
 * Falls back to mock insights if API fails
 */
export async function getAIInsights(): Promise<AIInsight[]> {
  try {
    const response = await apiClient.get('/ai-insights/global', {
      params: { timeframe: 'week', limit: 5 }
    });
    return response.data.data?.insights || response.data.insights || [];
  } catch (error) {
    console.error('Failed to fetch AI insights:', error);
    // Return sample insights based on dashboard stats
    try {
      const statsResponse = await apiClient.get('/dashboard/stats');
      const stats = statsResponse.data.stats || statsResponse.data;
      const insights: AIInsight[] = [];

      if (stats.overdueCount > 0) {
        insights.push({
          id: 'insight-overdue',
          type: 'warning',
          priority: 'high',
          title: `${stats.overdueCount} zaległych zadań`,
          description: 'Masz zaległe zadania wymagające uwagi',
          confidence: 95,
          createdAt: new Date().toISOString()
        });
      }

      if (stats.urgentTasks > 0) {
        insights.push({
          id: 'insight-urgent',
          type: 'urgent',
          priority: 'critical',
          title: `${stats.urgentTasks} pilnych zadań`,
          description: 'Zadania o wysokim priorytecie czekają',
          confidence: 90,
          createdAt: new Date().toISOString()
        });
      }

      if (stats.inboxCount > 5) {
        insights.push({
          id: 'insight-inbox',
          type: 'trend',
          priority: 'medium',
          title: `${stats.inboxCount} elementów w skrzynce`,
          description: 'Rozważ przetworzenie elementów ze źródła',
          confidence: 85,
          createdAt: new Date().toISOString()
        });
      }

      return insights;
    } catch {
      return [];
    }
  }
}

/**
 * Get recent activities
 * Combines data from recent tasks, deals, and other entities
 */
export async function getRecentActivities(limit: number = 5): Promise<Activity[]> {
  try {
    // Try to get recent task history as activity feed
    const response = await apiClient.get('/tasks', {
      params: { limit: limit * 2, orderBy: 'updatedAt', order: 'desc' }
    });

    const tasks = response.data.tasks || response.data.data || response.data || [];

    // Transform tasks to activities format
    const activities: Activity[] = tasks.slice(0, limit).map((task: any) => ({
      id: task.id,
      type: 'task' as const,
      action: task.status === 'COMPLETED' ? 'Ukończono zadanie' :
              task.status === 'IN_PROGRESS' ? 'Rozpoczęto zadanie' : 'Utworzono zadanie',
      description: task.title,
      entityId: task.id,
      entityName: task.title,
      userId: task.userId || task.assignedToId || '',
      userName: task.assignedTo?.firstName || 'System',
      createdAt: task.updatedAt || task.createdAt,
      metadata: { status: task.status, priority: task.priority }
    }));

    return activities;
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return [];
  }
}

/**
 * Send query to AI (RAG)
 */
export async function sendAIQuery(params: {
  query: string;
  userId: string;
  organizationId: string;
  conversationId?: string | null;
}): Promise<{
  answer: string;
  sources: Array<{ id: string; title: string; sourceType: string; score: number }>;
  conversationId: string;
  processingTime: number;
}> {
  try {
    const response = await ragClient.post('/query/', {
      query: params.query,
      userId: params.userId,
      organizationId: params.organizationId,
      conversationId: params.conversationId || undefined,
      limit: 5
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send AI query:', error);
    throw error;
  }
}

/**
 * Get weekly review stats for burndown/trend chart
 */
export async function getWeeklyReviewStats(): Promise<{
  burndownData: Array<{ week: string; completed: number; created: number }>;
  summary: {
    totalWeeks: number;
    averageTasksCompleted: number;
    reviewCompletionRate: number;
  };
}> {
  try {
    const response = await apiClient.get('/weekly-reviews/stats/burndown');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch weekly review stats:', error);
    return {
      burndownData: [],
      summary: { totalWeeks: 0, averageTasksCompleted: 0, reviewCompletionRate: 0 }
    };
  }
}

// Export all functions as dashboardApi object
export const dashboardApi = {
  getDashboardStats,
  getWeeklySummary,
  getPipelineForecast,
  getGoalsOverview,
  getAIInsights,
  getRecentActivities,
  sendAIQuery,
  getWeeklyReviewStats
};

export default dashboardApi;
