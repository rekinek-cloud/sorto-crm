/**
 * AI Hub API Client
 * Unified API layer for Conversational AI Hub Dashboard
 * Communicates with RAG Service (8100) and CRM Backend (3003)
 */

import { ragClient } from './ragClient';
import apiClient from './client';

// ============= TYPES =============

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  visualizations?: Visualization[];
  actions?: QuickAction[];
  intent?: Intent;
  isStreaming?: boolean;
  processingTime?: number;
  confidence?: number;
}

export interface Source {
  id: string;
  title: string;
  sourceType: string;
  content?: string;
  score: number;
}

export interface Visualization {
  type: 'chart' | 'table' | 'cards' | 'list' | 'progress';
  title: string;
  chartType?: 'bar' | 'line' | 'pie' | 'donut';
  data: any[];
  labels?: string[];
  config?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  type: 'navigate' | 'create' | 'update' | 'call' | 'email' | 'schedule';
  label: string;
  icon?: string;
  data?: Record<string, any>;
  confirmRequired?: boolean;
}

export interface Intent {
  type: string;
  confidence: number;
  keywords?: string[];
  sourceTypes?: string[];
}

export interface AIInsight {
  id: string;
  category: 'urgent' | 'opportunity' | 'trend' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data?: any;
  actions?: InsightAction[];
  timestamp: Date;
  expiresAt?: Date;
  context?: {
    entityType: string;
    entityId: string;
    entityName: string;
  };
}

export interface InsightAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'dismiss';
  href?: string;
  action?: string;
}

export interface SmartSuggestion {
  id: string;
  type: 'contact' | 'task' | 'follow_up' | 'schedule' | 'deal_action';
  priority: 'low' | 'medium' | 'high';
  title: string;
  reason: string;
  suggestedAction: {
    type: 'call' | 'email' | 'create_task' | 'update_deal' | 'schedule_meeting';
    params: Record<string, any>;
  };
  entity?: {
    type: string;
    id: string;
    name: string;
  };
  dueBy?: Date;
  confidence: number;
}

export interface QuickStats {
  inbox: { count: number; new: number };
  tasks: { today: number; overdue: number; completed: number };
  deals: { pipelineValue: number; activeCount: number; closingSoon: number };
  messages: { unread: number };
}

export interface SearchResult {
  id: string;
  type: 'task' | 'deal' | 'contact' | 'company' | 'document' | 'stream' | 'message';
  title: string;
  subtitle?: string;
  preview?: string;
  score: number;
  href?: string;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
  routing: {
    decision: string;
    intent: string;
    confidence: number;
    reasoning?: string;
    keywords?: string[];
    sourceTypes?: string[];
  };
  processingTime: number;
  mode: string;
  conversationId: string;
  messageCount: number;
  visualizations?: Visualization[];
  suggestedActions?: QuickAction[];
}

// ============= API FUNCTIONS =============

/**
 * Send query to AI (RAG Service)
 */
export async function sendQuery(params: {
  query: string;
  userId: string;
  organizationId: string;
  userRole?: string;
  conversationId?: string | null;
  forceMode?: 'rag' | 'ai' | 'hybrid';
}): Promise<QueryResponse> {
  const response = await ragClient.post('/query/', {
    query: params.query,
    userId: params.userId,
    organizationId: params.organizationId,
    userRole: params.userRole || 'MEMBER',
    conversationId: params.conversationId || undefined,
    forceMode: params.forceMode,
    limit: 10
  });
  return response.data;
}

/**
 * Get AI Insights from RAG analytics
 */
export async function getInsights(params: {
  organizationId: string;
  days?: number;
}): Promise<AIInsight[]> {
  try {
    const response = await ragClient.get('/analytics/dashboard', {
      params: {
        organizationId: params.organizationId,
        days: params.days || 7
      }
    });

    // Transform RAG analytics to insights
    const data = response.data;
    const insights: AIInsight[] = [];

    // Add overdue tasks as urgent
    if (data.overdue_tasks && data.overdue_tasks > 0) {
      insights.push({
        id: 'urgent-overdue',
        category: 'urgent',
        priority: data.overdue_tasks > 5 ? 'critical' : 'high',
        title: `${data.overdue_tasks} zaległych zadań`,
        description: 'Zadania wymagają natychmiastowej uwagi',
        timestamp: new Date(),
        actions: [
          { id: 'view', label: 'Zobacz zaległe', type: 'primary', href: '/dashboard/tasks?filter=overdue' }
        ]
      });
    }

    // Add stagnant deals as opportunity
    if (data.stagnant_deals && data.stagnant_deals > 0) {
      insights.push({
        id: 'opportunity-deals',
        category: 'opportunity',
        priority: 'medium',
        title: `${data.stagnant_deals} dealów do działania`,
        description: 'Deale bez aktywności przez 7+ dni',
        timestamp: new Date(),
        actions: [
          { id: 'view', label: 'Zobacz deale', type: 'primary', href: '/dashboard/deals?filter=stagnant' }
        ]
      });
    }

    // Add query volume trend
    if (data.query_volume?.trend) {
      insights.push({
        id: 'trend-activity',
        category: 'trend',
        priority: 'low',
        title: `${data.query_volume.trend > 0 ? '+' : ''}${data.query_volume.trend}% aktywności`,
        description: 'Zmiana w stosunku do poprzedniego okresu',
        timestamp: new Date()
      });
    }

    return insights;
  } catch (error) {
    console.error('Failed to fetch insights:', error);
    return [];
  }
}

/**
 * Get Smart Suggestions from CRM
 */
export async function getSuggestions(params?: {
  limit?: number;
}): Promise<SmartSuggestion[]> {
  try {
    const response = await apiClient.get('/ai-suggestions', {
      params: { limit: params?.limit || 5 }
    });

    if (response.data.success && response.data.data) {
      return response.data.data.map((s: any) => ({
        id: s.id,
        type: s.suggestionType || 'task',
        priority: s.priority || 'medium',
        title: s.title,
        reason: s.reason || s.description,
        suggestedAction: s.action || { type: 'create_task', params: {} },
        entity: s.entity,
        dueBy: s.dueBy ? new Date(s.dueBy) : undefined,
        confidence: s.confidence || 0.8
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return [];
  }
}

/**
 * Get Quick Stats from CRM Dashboard
 */
export async function getQuickStats(): Promise<QuickStats> {
  try {
    const [dashboardRes, inboxRes] = await Promise.all([
      apiClient.get('/dashboard/stats'),
      apiClient.get('/source', { params: { limit: 1 } })
    ]);

    const stats = dashboardRes.data.success ? dashboardRes.data.data : dashboardRes.data;
    const inboxData = inboxRes.data;

    return {
      inbox: {
        count: inboxData.total || stats.inboxCount || 0,
        new: inboxData.newToday || 0
      },
      tasks: {
        today: stats.tasksToday || stats.activeTasks || 0,
        overdue: stats.overdueCount || 0,
        completed: stats.completedTasks || 0
      },
      deals: {
        pipelineValue: stats.pipelineValue || 0,
        activeCount: stats.activeDeals || 0,
        closingSoon: stats.dealsClosingSoon || 0
      },
      messages: {
        unread: stats.unreadMessages || 0
      }
    };
  } catch (error) {
    console.error('Failed to fetch quick stats:', error);
    return {
      inbox: { count: 0, new: 0 },
      tasks: { today: 0, overdue: 0, completed: 0 },
      deals: { pipelineValue: 0, activeCount: 0, closingSoon: 0 },
      messages: { unread: 0 }
    };
  }
}

/**
 * Search using Natural Language (RAG)
 */
export async function searchNaturalLanguage(params: {
  query: string;
  userId: string;
  organizationId: string;
  types?: string[];
  limit?: number;
}): Promise<SearchResult[]> {
  try {
    const response = await ragClient.post('/query/', {
      query: params.query,
      userId: params.userId,
      organizationId: params.organizationId,
      forceMode: 'rag',
      limit: params.limit || 10
    });

    if (response.data.sources) {
      return response.data.sources.map((s: any) => ({
        id: s.id,
        type: s.sourceType || 'document',
        title: s.title,
        subtitle: s.sourceType,
        preview: s.content?.substring(0, 150),
        score: s.score,
        href: getEntityHref(s.sourceType, s.id)
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to search:', error);
    return [];
  }
}

/**
 * Execute Quick Action
 */
export async function executeAction(action: QuickAction): Promise<{ success: boolean; message?: string }> {
  try {
    switch (action.type) {
      case 'create':
        await apiClient.post(`/${action.data?.entityType}`, action.data?.payload);
        return { success: true, message: 'Utworzono pomyślnie' };

      case 'update':
        await apiClient.put(`/${action.data?.entityType}/${action.data?.entityId}`, action.data?.payload);
        return { success: true, message: 'Zaktualizowano pomyślnie' };

      case 'navigate':
        // Navigation handled by caller
        return { success: true };

      case 'email':
        // Open email compose
        if (action.data?.email) {
          window.open(`mailto:${action.data.email}?subject=${action.data.subject || ''}`);
        }
        return { success: true };

      case 'call':
        if (action.data?.phone) {
          window.open(`tel:${action.data.phone}`);
        }
        return { success: true };

      case 'schedule':
        await apiClient.post('/activities', {
          type: 'meeting',
          ...action.data
        });
        return { success: true, message: 'Zaplanowano spotkanie' };

      default:
        return { success: false, message: 'Nieznany typ akcji' };
    }
  } catch (error: any) {
    console.error('Failed to execute action:', error);
    return { success: false, message: error.message || 'Wystąpił błąd' };
  }
}

/**
 * Accept Suggestion
 */
export async function acceptSuggestion(suggestion: SmartSuggestion): Promise<{ success: boolean }> {
  try {
    await apiClient.post(`/ai-suggestions/${suggestion.id}/accept`);
    return { success: true };
  } catch (error) {
    console.error('Failed to accept suggestion:', error);
    return { success: false };
  }
}

/**
 * Dismiss Suggestion
 */
export async function dismissSuggestion(suggestion: SmartSuggestion): Promise<{ success: boolean }> {
  try {
    await apiClient.post(`/ai-suggestions/${suggestion.id}/reject`);
    return { success: true };
  } catch (error) {
    console.error('Failed to dismiss suggestion:', error);
    return { success: false };
  }
}

/**
 * Submit Feedback for AI response
 */
export async function submitFeedback(params: {
  conversationId: string;
  messageId: string;
  userId: string;
  organizationId: string;
  feedbackType: 'helpful' | 'not_helpful' | 'incorrect';
  rating?: number;
  comment?: string;
}): Promise<{ success: boolean }> {
  try {
    await ragClient.post('/feedback', params);
    return { success: true };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return { success: false };
  }
}

/**
 * Get conversation history
 */
export async function getConversation(conversationId: string): Promise<ChatMessage[]> {
  try {
    const response = await ragClient.get(`/query/conversations/${conversationId}`);
    if (response.data.messages) {
      return response.data.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        sources: m.sources,
        visualizations: m.visualizations,
        actions: m.actions
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return [];
  }
}

/**
 * Clear conversation
 */
export async function clearConversation(conversationId: string): Promise<{ success: boolean }> {
  try {
    await ragClient.delete(`/query/conversations/${conversationId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to clear conversation:', error);
    return { success: false };
  }
}

// ============= HELPERS =============

function getEntityHref(entityType: string, entityId: string): string {
  const routes: Record<string, string> = {
    task: '/dashboard/tasks',
    deal: '/dashboard/deals',
    contact: '/dashboard/contacts',
    company: '/dashboard/companies',
    stream: '/dashboard/streams',
    message: '/dashboard/communication',
    document: '/dashboard/knowledge-base'
  };
  const base = routes[entityType] || '/dashboard';
  return `${base}/${entityId}`;
}

// Export all functions as aiHubApi object for convenient import
export const aiHubApi = {
  sendQuery,
  getInsights,
  getSuggestions,
  getQuickStats,
  searchNaturalLanguage,
  executeAction,
  acceptSuggestion,
  dismissSuggestion,
  submitFeedback,
  getConversation,
  clearConversation
};

export default aiHubApi;
