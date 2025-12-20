/**
 * API client functions for GTD Streams
 * Handles all API calls related to GTD functionality
 */

import { GTDRole, StreamType } from '@/types/gtd';
import apiClient from './client';

const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api/v1'
  : '/api/v1';

// Types
export interface GTDStream {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: string;
  gtdRole?: GTDRole;
  streamType?: StreamType;
  gtdConfig?: any;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    projects: number;
    messages?: number;
  };
  stats?: {
    taskCompletionRate?: number;
    avgProcessingTime?: number;
    pendingItems?: number;
  };
}

export interface CreateGTDStreamData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  gtdRole: GTDRole;
  streamType: StreamType;
  templateOrigin?: string;
  parentStreamId?: string;
  gtdConfig?: any;
}

export interface GTDConfig {
  inboxBehavior: {
    autoProcessing: boolean;
    autoCreateTasks: boolean;
    defaultContext: string;
    defaultEnergyLevel: string;
    processAfterDays: number;
    purgeAfterDays: number;
  };
  availableContexts: string[];
  energyLevels: string[];
  reviewFrequency: string;
  processingRules: any[];
  automations: any[];
  advanced: {
    enableAI: boolean;
    autoAssignContext: boolean;
    autoSetEnergyLevel: boolean;
    enableBulkProcessing: boolean;
    maxInboxItems: number;
  };
  analytics: {
    trackProcessingTime: boolean;
    trackDecisionTypes: boolean;
    generateInsights: boolean;
    enableReporting: boolean;
  };
}

export interface GTDStats {
  totalStreams: number;
  streamsByRole: Record<string, number>;
  streamsByType: Record<string, number>;
  configuredStreams: number;
  unconfiguredStreams: number;
}

export interface RoutingResult {
  streamId: string;
  streamName: string;
  confidence: number;
  reasoning: string[];
  fallbackUsed: boolean;
  suggestedContext?: string;
  suggestedEnergyLevel?: string;
}

export interface GTDAnalysisResult {
  recommendedRole: GTDRole;
  recommendedContext: string;
  recommendedEnergyLevel: string;
  confidence: number;
  reasoning: string[];
  suggestedActions: any[];
}

// Helper function for API calls using apiClient (with auth token)
async function apiCall<T>(
  endpoint: string,
  options: { method?: string; body?: any } = {}
): Promise<{ success: boolean; data: T; error?: string }> {
  try {
    let response;
    const method = options.method?.toUpperCase() || 'GET';

    if (method === 'GET') {
      response = await apiClient.get(endpoint);
    } else if (method === 'POST') {
      response = await apiClient.post(endpoint, options.body);
    } else if (method === 'PUT') {
      response = await apiClient.put(endpoint, options.body);
    } else if (method === 'DELETE') {
      response = await apiClient.delete(endpoint);
    } else {
      response = await apiClient.get(endpoint);
    }

    return { success: true, data: response.data?.data || response.data };
  } catch (error: any) {
    console.error(`API call failed: ${endpoint}`, error);
    return {
      success: false,
      data: null as any,
      error: error?.response?.data?.error || error.message || 'Unknown error'
    };
  }
}

// ========================================
// GTD STREAM MANAGEMENT
// ========================================

export async function createGTDStream(streamData: CreateGTDStreamData) {
  return apiCall<{ stream: GTDStream; gtdConfig: GTDConfig }>('/gtd-streams', {
    method: 'POST',
    body: JSON.stringify(streamData)
  });
}

export async function getGTDStreams() {
  return apiCall<GTDStream[]>('/gtd-streams');
}

export async function getStreamsByRole(role: GTDRole) {
  return apiCall<GTDStream[]>(`/gtd-streams/by-role/${role}`);
}

export async function assignGTDRole(streamId: string, gtdRole: GTDRole) {
  return apiCall<GTDStream>(`/gtd-streams/${streamId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ gtdRole })
  });
}

export async function migrateStreamToGTD(
  streamId: string, 
  gtdRole: GTDRole, 
  streamType: StreamType
) {
  return apiCall<{ stream: GTDStream; gtdConfig: GTDConfig }>(`/gtd-streams/${streamId}/migrate`, {
    method: 'POST',
    body: JSON.stringify({ gtdRole, streamType })
  });
}

// ========================================
// GTD CONFIGURATION
// ========================================

export async function getGTDConfig(streamId: string) {
  return apiCall<GTDConfig>(`/gtd-streams/${streamId}/config`);
}

export async function updateGTDConfig(
  streamId: string, 
  config: Partial<GTDConfig>, 
  options: any = {}
) {
  return apiCall<GTDConfig>(`/gtd-streams/${streamId}/config`, {
    method: 'PUT',
    body: JSON.stringify({ config, options })
  });
}

export async function resetGTDConfig(streamId: string) {
  return apiCall<GTDConfig>(`/gtd-streams/${streamId}/config/reset`, {
    method: 'POST'
  });
}

// ========================================
// HIERARCHY MANAGEMENT
// ========================================

export async function getStreamTree(streamId: string, options: any = {}) {
  const queryParams = new URLSearchParams();
  if (options.maxDepth) queryParams.append('maxDepth', options.maxDepth.toString());
  if (options.includeGTDAnalysis !== undefined) {
    queryParams.append('includeGTDAnalysis', options.includeGTDAnalysis.toString());
  }
  
  const query = queryParams.toString();
  return apiCall<any>(`/gtd-streams/${streamId}/tree${query ? `?${query}` : ''}`);
}

export async function getStreamAncestors(streamId: string) {
  return apiCall<GTDStream[]>(`/gtd-streams/${streamId}/ancestors`);
}

export async function getStreamPath(streamId: string) {
  return apiCall<any>(`/gtd-streams/${streamId}/path`);
}

export async function validateGTDHierarchy(streamId: string) {
  return apiCall<{ valid: boolean; errors: string[] }>(`/gtd-streams/${streamId}/validate-hierarchy`, {
    method: 'POST'
  });
}

// ========================================
// RESOURCE ROUTING
// ========================================

export async function routeTaskToStream(
  taskId: string, 
  options: {
    preferredStreamId?: string;
    forceStream?: boolean;
  } = {}
) {
  return apiCall<RoutingResult>('/gtd-streams/route/task', {
    method: 'POST',
    body: JSON.stringify({ taskId, ...options })
  });
}

export async function routeEmailToStream(
  messageId: string,
  options: {
    preferredStreamId?: string;
  } = {}
) {
  return apiCall<RoutingResult>('/gtd-streams/route/email', {
    method: 'POST',
    body: JSON.stringify({ messageId, ...options })
  });
}

export async function bulkRouteResources(
  resources: Array<{ type: string; id: string }>
) {
  return apiCall<RoutingResult[]>('/gtd-streams/route/bulk', {
    method: 'POST',
    body: JSON.stringify({ resources })
  });
}

// ========================================
// ANALYSIS & SUGGESTIONS
// ========================================

export async function analyzeContentForGTD(content: {
  name: string;
  description?: string;
  existingTasks?: number;
  relatedContacts?: number;
  messageVolume?: number;
}) {
  return apiCall<GTDAnalysisResult>('/gtd-streams/analyze', {
    method: 'POST',
    body: JSON.stringify(content)
  });
}

// ========================================
// STATISTICS & INSIGHTS
// ========================================

export async function getGTDStats() {
  return apiCall<GTDStats>('/gtd-streams/stats');
}

export async function getHierarchyStats() {
  return apiCall<any>('/gtd-streams/hierarchy-stats');
}

export async function getRoutingStats() {
  return apiCall<any>('/gtd-streams/routing-stats');
}

// ========================================
// PROCESSING RULES
// ========================================

export async function createProcessingRule(streamId: string, ruleData: any) {
  return apiCall<any>(`/gtd-streams/${streamId}/rules`, {
    method: 'POST',
    body: JSON.stringify(ruleData)
  });
}

export async function getProcessingRules(streamId: string) {
  return apiCall<any[]>(`/gtd-streams/${streamId}/rules`);
}

export async function executeRules(data: {
  entityType: string;
  entityId: string;
  streamId?: string;
}) {
  return apiCall<any[]>('/gtd-streams/rules/execute', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ========================================
// REGULAR STREAMS (for migration)
// ========================================

export async function getRegularStreams() {
  return apiCall<any[]>('/streams');
}

export async function deleteStream(streamId: string) {
  return apiCall<void>(`/streams/${streamId}`, {
    method: 'DELETE'
  });
}

export default {
  // Stream management
  createGTDStream,
  getGTDStreams,
  getStreamsByRole,
  assignGTDRole,
  migrateStreamToGTD,
  
  // Configuration
  getGTDConfig,
  updateGTDConfig,
  resetGTDConfig,
  
  // Hierarchy
  getStreamTree,
  getStreamAncestors,
  getStreamPath,
  validateGTDHierarchy,
  
  // Routing
  routeTaskToStream,
  routeEmailToStream,
  bulkRouteResources,
  
  // Analysis
  analyzeContentForGTD,
  
  // Statistics
  getGTDStats,
  getHierarchyStats,
  getRoutingStats,
  
  // Rules
  createProcessingRule,
  getProcessingRules,
  executeRules,
  
  // Utils
  getRegularStreams,
  deleteStream
};