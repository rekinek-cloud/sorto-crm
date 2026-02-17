import { apiClient } from './client';

export interface EntityLink {
  id: string;
  organizationId: string;
  fromEntityType: string;
  fromEntityId: string;
  toEntityType: string;
  toEntityId: string;
  linkType: string;
  strength: number;
  isBidirectional: boolean;
  notes?: string;
  metadata?: any;
  discoveredAt: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
}

export interface EntityLinkNetwork {
  nodes: Array<{ entityType: string; entityId: string; depth: number }>;
  edges: Array<{ id: string; fromEntityType: string; fromEntityId: string; toEntityType: string; toEntityId: string; linkType: string; strength: number }>;
  rootEntity: { entityType: string; entityId: string };
}

export const entityLinksApi = {
  async getLinks(entityType: string, entityId: string, linkType?: string) {
    const params = new URLSearchParams({ entityType, entityId });
    if (linkType) params.set('linkType', linkType);
    const res = await apiClient.get(`/entity-links?${params}`);
    return res.data;
  },

  async getNetwork(entityType: string, entityId: string, depth = 2) {
    const res = await apiClient.get(`/entity-links/network/${entityType}/${entityId}?depth=${depth}`);
    return res.data;
  },

  async createLink(data: {
    fromEntityType: string;
    fromEntityId: string;
    toEntityType: string;
    toEntityId: string;
    linkType?: string;
    strength?: number;
    isBidirectional?: boolean;
    notes?: string;
    metadata?: any;
  }) {
    const res = await apiClient.post('/entity-links', data);
    return res.data;
  },

  async updateLink(id: string, data: { strength?: number; notes?: string; metadata?: any; linkType?: string }) {
    const res = await apiClient.patch(`/entity-links/${id}`, data);
    return res.data;
  },

  async deleteLink(id: string) {
    const res = await apiClient.delete(`/entity-links/${id}`);
    return res.data;
  }
};
