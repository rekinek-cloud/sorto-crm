import { apiClient } from './client';

// Types for stream hierarchy
export interface StreamRelation {
  id: string;
  parentId: string;
  childId: string;
  relationType: 'OWNS' | 'MANAGES' | 'BELONGS_TO' | 'RELATED_TO' | 'DEPENDS_ON' | 'SUPPORTS';
  description?: string;
  isActive: boolean;
  inheritanceRule: 'NO_INHERITANCE' | 'INHERIT_DOWN' | 'INHERIT_UP' | 'INHERIT_BIDIRECTIONAL';
  createdById: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface StreamPermission {
  id: string;
  relationId: string;
  dataScope: 'BASIC_INFO' | 'TASKS' | 'PROJECTS' | 'FINANCIAL' | 'METRICS' | 'COMMUNICATION' | 'PERMISSIONS' | 'CONFIGURATION' | 'AUDIT_LOGS';
  action: 'read' | 'CREATE' | 'UPDATE' | 'DELETE' | 'MANAGE' | 'APPROVE' | 'AUDIT';
  granted: boolean;
}

export interface StreamWithRelations {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'TEMPLATE';
  parentRelations: (StreamRelation & { parent: StreamWithRelations })[];
  childRelations: (StreamRelation & { child: StreamWithRelations })[];
}

export interface StreamHierarchy {
  stream: StreamWithRelations;
  parents: StreamWithRelations[];
  children: StreamWithRelations[];
  depth: number;
  totalRelations: number;
  hasCycles: boolean;
}

export interface CreateStreamRelationRequest {
  parentId: string;
  childId: string;
  relationType: StreamRelation['relationType'];
  description?: string;
  isActive?: boolean;
  inheritanceRule?: StreamRelation['inheritanceRule'];
  permissions?: Omit<StreamPermission, 'id' | 'relationId'>[];
}

export interface UpdateStreamRelationRequest {
  relationType?: StreamRelation['relationType'];
  description?: string;
  isActive?: boolean;
  inheritanceRule?: StreamRelation['inheritanceRule'];
}

export interface HierarchyQueryParams {
  depth?: number;
  includePermissions?: boolean;
  direction?: 'up' | 'down' | 'both';
}

export interface RelatedStreamsQueryParams {
  relationType?: StreamRelation['relationType'];
  organizationId?: string;
}

export interface AccessResult {
  hasAccess: boolean;
  accessLevel: 'NO_ACCESS' | 'READ_ONLY' | 'LIMITED' | 'CONTRIBUTOR' | 'COLLABORATOR' | 'MANAGER' | 'ADMIN' | 'FULL_CONTROL';
  grantedScopes: StreamPermission['dataScope'][];
  deniedScopes: StreamPermission['dataScope'][];
  via: string | null;
  inheritanceChain: string[];
  directAccess: boolean;
  reason: string;
  expiresAt?: string;
}

export interface AccessCheckRequest {
  dataScope: StreamPermission['dataScope'];
  action: StreamPermission['action'];
}

export interface HierarchyStats {
  totalRelations: number;
  activeRelations: number;
  inactiveRelations: number;
  relationsByType: Record<string, number>;
  streamsWithHierarchy: number;
  hierarchyPenetration: number;
}

export const streamHierarchyApi = {
  // === HIERARCHY MANAGEMENT ===
  
  /**
   * Tworzy nową relację hierarchiczną dla strumienia
   */
  async createRelation(streamId: string, data: CreateStreamRelationRequest): Promise<StreamRelation> {
    const response = await apiClient.post(`/stream-hierarchy/${streamId}/relations`, data);
    return response.data.data;
  },

  /**
   * Pobiera hierarchię strumienia
   */
  async getStreamHierarchy(streamId: string, params?: HierarchyQueryParams): Promise<StreamHierarchy> {
    const queryParams = new URLSearchParams();
    if (params?.depth) queryParams.append('depth', params.depth.toString());
    if (params?.includePermissions) queryParams.append('includePermissions', params.includePermissions.toString());
    if (params?.direction) queryParams.append('direction', params.direction);

    const url = `/stream-hierarchy/${streamId}/hierarchy${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    
    // Convert basic Stream to StreamWithRelations
    const data = response.data.data;
    const streamWithRelations: StreamWithRelations = {
      ...data.stream,
      parentRelations: [],
      childRelations: []
    };
    
    // Convert parents and children to StreamWithRelations
    const convertToStreamWithRelations = (stream: any): StreamWithRelations => ({
      ...stream,
      parentRelations: stream.parentRelations || [],
      childRelations: stream.childRelations || []
    });
    
    return {
      ...data,
      stream: streamWithRelations,
      parents: data.parents.map(convertToStreamWithRelations),
      children: data.children.map(convertToStreamWithRelations)
    };
  },

  /**
   * Pobiera powiązane strumienie
   */
  async getRelatedStreams(streamId: string, params?: RelatedStreamsQueryParams): Promise<StreamWithRelations[]> {
    const queryParams = new URLSearchParams();
    if (params?.relationType) queryParams.append('relationType', params.relationType);
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);

    const url = `/stream-hierarchy/${streamId}/related${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    return response.data.data;
  },

  /**
   * Aktualizuje relację między strumieniami
   */
  async updateRelation(relationId: string, data: UpdateStreamRelationRequest): Promise<StreamRelation> {
    const response = await apiClient.put(`/stream-hierarchy/relations/${relationId}`, data);
    return response.data.data;
  },

  /**
   * Usuwa relację między strumieniami
   */
  async deleteRelation(relationId: string): Promise<void> {
    await apiClient.delete(`/stream-hierarchy/relations/${relationId}`);
  },

  /**
   * Pobiera statystyki hierarchii dla organizacji
   */
  async getHierarchyStats(): Promise<HierarchyStats> {
    const response = await apiClient.get('/stream-hierarchy/hierarchy-stats');
    return response.data.data;
  },

  /**
   * Sprawdza czy dodanie relacji utworzyłoby cykl
   */
  async validateCycle(streamId: string, targetStreamId: string): Promise<{ wouldCreateCycle: boolean; isValid: boolean }> {
    const response = await apiClient.post(`/stream-hierarchy/${streamId}/validate-cycle`, {
      targetStreamId
    });
    return response.data.data;
  },

  // === ACCESS CONTROL ===

  /**
   * Sprawdza uprawnienia użytkownika do strumienia
   */
  async checkAccess(streamId: string, request: AccessCheckRequest): Promise<AccessResult> {
    const response = await apiClient.post(`/stream-access/${streamId}/access-check`, request);
    return response.data.data;
  },

  /**
   * Pobiera strumienie dostępne przez relacje
   */
  async getAccessibleStreams(streamId: string, params?: {
    dataScope?: StreamPermission['dataScope'];
    relationType?: StreamRelation['relationType'];
    includeInherited?: boolean;
    maxDepth?: number;
  }): Promise<(StreamWithRelations & {
    accessLevel: AccessResult['accessLevel'];
    grantedScopes: StreamPermission['dataScope'][];
    accessVia: string | null;
    isDirectAccess: boolean;
  })[]> {
    const queryParams = new URLSearchParams();
    if (params?.dataScope) queryParams.append('dataScope', params.dataScope);
    if (params?.relationType) queryParams.append('relationType', params.relationType);
    if (params?.includeInherited !== undefined) queryParams.append('includeInherited', params.includeInherited.toString());
    if (params?.maxDepth) queryParams.append('maxDepth', params.maxDepth.toString());

    const url = `/stream-access/${streamId}/accessible-streams${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    return response.data.data;
  },

  /**
   * Pobiera wszystkie strumienie dostępne dla użytkownika
   */
  async getUserAccessibleStreams(params?: {
    dataScope?: StreamPermission['dataScope'];
    relationType?: StreamRelation['relationType'];
    includeInherited?: boolean;
    maxDepth?: number;
  }): Promise<StreamWithRelations[]> {
    const queryParams = new URLSearchParams();
    if (params?.dataScope) queryParams.append('dataScope', params.dataScope);
    if (params?.relationType) queryParams.append('relationType', params.relationType);
    if (params?.includeInherited !== undefined) queryParams.append('includeInherited', params.includeInherited.toString());
    if (params?.maxDepth) queryParams.append('maxDepth', params.maxDepth.toString());

    const url = `/stream-access/user-accessible${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    return response.data.data;
  },

  /**
   * Pobiera logi dostępu do strumienia
   */
  async getAuditLogs(streamId: string, params?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: StreamPermission['action'];
    dataScope?: StreamPermission['dataScope'];
    granted?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.dataScope) queryParams.append('dataScope', params.dataScope);
    if (params?.granted !== undefined) queryParams.append('granted', params.granted.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const url = `/stream-access/${streamId}/audit-log${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    return response.data.data;
  },

  /**
   * Czyści cache uprawnień
   */
  async clearCache(options?: { targetUserId?: string; clearAll?: boolean }): Promise<void> {
    await apiClient.post('/stream-access/access/clear-cache', options || {});
  },

  /**
   * Czyści przestarzały cache uprawnień
   */
  async clearExpiredCache(): Promise<void> {
    await apiClient.post('/stream-access/access/clear-expired-cache');
  },

  /**
   * Pobiera statystyki cache uprawnień
   */
  async getCacheStats() {
    const response = await apiClient.get('/stream-access/access/cache-stats');
    return response.data.data;
  }
};

export default streamHierarchyApi;