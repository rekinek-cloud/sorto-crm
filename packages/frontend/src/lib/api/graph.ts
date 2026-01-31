import { apiClient } from './client';

export type EntityType = 'project' | 'task' | 'contact' | 'company' | 'deal' | 'stream';

export interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  originalId: string;
  metadata: {
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    role?: string;
    [key: string]: any;
  };
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'related' | 'assigned_to' | 'belongs_to' | 'child_of';
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface RelationshipQuery {
  entityId: string;
  entityType: EntityType;
  depth?: number;
}

export const graphApi = {
  // Get relationship graph for an entity
  async getRelationships(query: RelationshipQuery): Promise<{ success: boolean; data: GraphData }> {
    const response = await apiClient.get('/graph/relationships', {
      params: {
        entityId: query.entityId,
        entityType: query.entityType,
        depth: query.depth || 2
      }
    });
    return response.data;
  },

  // Debug endpoint
  async debug(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const response = await apiClient.get('/graph/debug');
    return response.data;
  }
};
