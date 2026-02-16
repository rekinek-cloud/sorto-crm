/**
 * API client functions for Stream Management
 * Handles all API calls related to stream management functionality
 */

import { StreamRole, StreamType } from '@/types/streams';
import apiClient from './client';

const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api/v1'
  : '/api/v1';

// Types
export interface ManagedStream {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: string;
  gtdRole?: StreamRole;
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

export interface CreateManagedStreamData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  gtdRole: StreamRole;
  streamType: StreamType;
  templateOrigin?: string;
  parentStreamId?: string;
  gtdConfig?: any;
}

export interface StreamConfig {
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

export interface StreamManagementStats {
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

export interface StreamAnalysisResult {
  recommendedRole: StreamRole;
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
// STREAM MANAGEMENT
// ========================================

export async function createManagedStream(streamData: CreateManagedStreamData) {
  return apiCall<{ stream: ManagedStream; gtdConfig: StreamConfig }>('/stream-management', {
    method: 'POST',
    body: JSON.stringify(streamData)
  });
}

export async function getManagedStreams() {
  return apiCall<ManagedStream[]>('/stream-management');
}

export async function getStreamsByRole(role: StreamRole) {
  return apiCall<ManagedStream[]>(`/stream-management/by-role/${role}`);
}

export async function assignStreamRole(streamId: string, gtdRole: StreamRole) {
  return apiCall<ManagedStream>(`/stream-management/${streamId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ gtdRole })
  });
}

export async function migrateStream(
  streamId: string, 
  gtdRole: StreamRole, 
  streamType: StreamType
) {
  return apiCall<{ stream: ManagedStream; gtdConfig: StreamConfig }>(`/stream-management/${streamId}/migrate`, {
    method: 'POST',
    body: JSON.stringify({ gtdRole, streamType })
  });
}

// ========================================
// STREAM CONFIGURATION
// ========================================

export async function getStreamConfig(streamId: string) {
  return apiCall<StreamConfig>(`/stream-management/${streamId}/config`);
}

export async function updateStreamConfig(
  streamId: string, 
  config: Partial<StreamConfig>, 
  options: any = {}
) {
  return apiCall<StreamConfig>(`/stream-management/${streamId}/config`, {
    method: 'PUT',
    body: JSON.stringify({ config, options })
  });
}

export async function resetStreamConfig(streamId: string) {
  return apiCall<StreamConfig>(`/stream-management/${streamId}/config/reset`, {
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
  return apiCall<any>(`/stream-management/${streamId}/tree${query ? `?${query}` : ''}`);
}

export async function getStreamAncestors(streamId: string) {
  return apiCall<ManagedStream[]>(`/stream-management/${streamId}/ancestors`);
}

export async function getStreamPath(streamId: string) {
  return apiCall<any>(`/stream-management/${streamId}/path`);
}

export async function validateHierarchy(streamId: string) {
  return apiCall<{ valid: boolean; errors: string[] }>(`/stream-management/${streamId}/validate-hierarchy`, {
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
  return apiCall<RoutingResult>('/stream-management/route/task', {
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
  return apiCall<RoutingResult>('/stream-management/route/email', {
    method: 'POST',
    body: JSON.stringify({ messageId, ...options })
  });
}

export async function bulkRouteResources(
  resources: Array<{ type: string; id: string }>
) {
  return apiCall<RoutingResult[]>('/stream-management/route/bulk', {
    method: 'POST',
    body: JSON.stringify({ resources })
  });
}

// ========================================
// ANALYSIS & SUGGESTIONS
// ========================================

export async function analyzeContent(content: {
  name: string;
  description?: string;
  existingTasks?: number;
  relatedContacts?: number;
  messageVolume?: number;
}) {
  return apiCall<StreamAnalysisResult>('/stream-management/analyze', {
    method: 'POST',
    body: JSON.stringify(content)
  });
}

// ========================================
// STATISTICS & INSIGHTS
// ========================================

export async function getStreamManagementStats() {
  return apiCall<StreamManagementStats>('/stream-management/stats');
}

export async function getHierarchyStats() {
  return apiCall<any>('/stream-management/hierarchy-stats');
}

export async function getRoutingStats() {
  return apiCall<any>('/stream-management/routing-stats');
}

// ========================================
// PROCESSING RULES
// ========================================

export async function createProcessingRule(streamId: string, ruleData: any) {
  return apiCall<any>(`/stream-management/${streamId}/rules`, {
    method: 'POST',
    body: JSON.stringify(ruleData)
  });
}

export async function getProcessingRules(streamId: string) {
  return apiCall<any[]>(`/stream-management/${streamId}/rules`);
}

export async function executeRules(data: {
  entityType: string;
  entityId: string;
  streamId?: string;
}) {
  return apiCall<any[]>('/stream-management/rules/execute', {
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
  createManagedStream,
  getManagedStreams,
  getStreamsByRole,
  assignStreamRole,
  migrateStream,
  
  // Configuration
  getStreamConfig,
  updateStreamConfig,
  resetStreamConfig,
  
  // Hierarchy
  getStreamTree,
  getStreamAncestors,
  getStreamPath,
  validateHierarchy,
  
  // Routing
  routeTaskToStream,
  routeEmailToStream,
  bulkRouteResources,
  
  // Analysis
  analyzeContent,
  
  // Statistics
  getStreamManagementStats,
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