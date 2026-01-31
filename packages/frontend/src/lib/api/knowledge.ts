import { apiClient } from './client';

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  summary?: string;
  type: string;
  status: string;
  tags: string[];
  viewCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  folder?: {
    id: string;
    name: string;
    color?: string;
  };
  comments?: any[];
  shares?: any[];
  linkedDocuments?: any[];
  backlinkedDocuments?: any[];
}

export interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  isPublished: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  linkedPages?: any[];
  backlinkedPages?: any[];
}

export interface KnowledgeFolder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  children?: KnowledgeFolder[];
  _count: {
    documents: number;
  };
}

export const knowledgeApi = {
  // Get all reference materials
  async getKnowledgeBase(params?: {
    category?: string;
    search?: string;
  }): Promise<KnowledgeBaseItem[]> {
    const response = await apiClient.get<KnowledgeBaseItem[]>('/knowledge/knowledge-base', {
      params
    });
    return response.data;
  },

  // Get single reference material
  async getKnowledgeBaseItem(id: string): Promise<KnowledgeBaseItem> {
    const response = await apiClient.get<KnowledgeBaseItem>(`/knowledge/knowledge-base/${id}`);
    return response.data;
  },

  // Delete reference material
  async deleteKnowledgeBaseItem(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/knowledge/knowledge-base/${id}`);
    return response.data;
  },

  // =====================
  // Documents
  // =====================

  /**
   * Get documents list
   */
  async getDocuments(params?: {
    folderId?: string;
    search?: string;
  }): Promise<{ data: KnowledgeDocument[] }> {
    const searchParams = new URLSearchParams();
    if (params?.folderId) searchParams.append('folderId', params.folderId);
    if (params?.search) searchParams.append('search', params.search);

    const response = await apiClient.get(`/knowledge/documents?${searchParams}`);
    return response.data;
  },

  /**
   * Get single document by ID
   */
  async getDocument(id: string): Promise<{ data: KnowledgeDocument }> {
    const response = await apiClient.get(`/knowledge/documents/${id}`);
    return response.data;
  },

  /**
   * Add comment to document
   */
  async addDocumentComment(documentId: string, content: string): Promise<void> {
    await apiClient.post(`/knowledge/documents/${documentId}/comments`, { content });
  },

  // =====================
  // Wiki Pages
  // =====================

  /**
   * Get wiki pages list
   */
  async getWikiPages(params?: {
    search?: string;
  }): Promise<{ data: WikiPage[] }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);

    const response = await apiClient.get(`/knowledge/wiki?${searchParams}`);
    return response.data;
  },

  /**
   * Get single wiki page by slug
   */
  async getWikiPage(slug: string): Promise<{ data: WikiPage }> {
    const response = await apiClient.get(`/knowledge/wiki/${slug}`);
    return response.data;
  },

  // =====================
  // Folders
  // =====================

  /**
   * Get folders list
   */
  async getFolders(): Promise<{ data: KnowledgeFolder[] }> {
    const response = await apiClient.get('/knowledge/folders');
    return response.data;
  },
};