/**
 * Industries API client
 */

import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getAuthHeaders(): Promise<Headers> {
  const token = Cookies.get('access_token');
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export interface StreamConfig {
  name: string;
  role: string;
  color: string;
  description?: string;
}

export interface PipelineStage {
  name: string;
  probability: number;
  color: string;
}

export interface CustomFieldConfig {
  name: string;
  label: string;
  type: string;
  options?: string[];
}

export interface IndustryTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  category: string;
  streams: StreamConfig[];
  pipelineStages: PipelineStage[];
  taskCategories: string[];
  customFields: CustomFieldConfig[];
  isActive: boolean;
  isPremium: boolean;
}

export interface IndustryCategory {
  category: string;
  count: number;
}

export const industriesApi = {
  async getAll(): Promise<{ templates: IndustryTemplate[] }> {
    const response = await fetch(`${API_URL}/industries`);
    if (!response.ok) throw new Error('Failed to fetch industries');
    return response.json();
  },

  async getCategories(): Promise<{ categories: IndustryCategory[] }> {
    const response = await fetch(`${API_URL}/industries/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async getByCategory(category: string): Promise<{ templates: IndustryTemplate[] }> {
    const response = await fetch(`${API_URL}/industries/category/${category}`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  async getBySlug(slug: string): Promise<{ template: IndustryTemplate }> {
    const response = await fetch(`${API_URL}/industries/${slug}`);
    if (!response.ok) throw new Error('Failed to fetch template');
    return response.json();
  },

  async applyTemplate(templateSlug: string): Promise<{
    success: boolean;
    streamsCreated: number;
    pipelineConfigured: boolean;
    message: string;
  }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/industries/apply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ templateSlug }),
    });
    if (!response.ok) throw new Error('Failed to apply template');
    return response.json();
  },
};
