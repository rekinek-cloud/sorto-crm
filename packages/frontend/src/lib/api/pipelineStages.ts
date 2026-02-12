import apiClient from './client';

export interface PipelineStage {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  position: number;
  probability: number;
  color: string;
  isClosed: boolean;
  isWon: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    deals: number;
  };
}

export interface CreatePipelineStageRequest {
  name: string;
  slug?: string;
  position?: number;
  probability?: number;
  color?: string;
  isClosed?: boolean;
  isWon?: boolean;
}

export interface UpdatePipelineStageRequest {
  name?: string;
  slug?: string;
  probability?: number;
  color?: string;
  isClosed?: boolean;
  isWon?: boolean;
}

export interface ReorderRequest {
  stages: { id: string; position: number }[];
}

export const pipelineStagesApi = {
  async getStages(): Promise<PipelineStage[]> {
    const response = await apiClient.get<PipelineStage[]>('/pipeline/stages');
    return response.data;
  },

  async createStage(data: CreatePipelineStageRequest): Promise<PipelineStage> {
    const response = await apiClient.post<PipelineStage>('/pipeline/stages', data);
    return response.data;
  },

  async updateStage(id: string, data: UpdatePipelineStageRequest): Promise<PipelineStage> {
    const response = await apiClient.put<PipelineStage>(`/pipeline/stages/${id}`, data);
    return response.data;
  },

  async deleteStage(id: string): Promise<void> {
    await apiClient.delete(`/pipeline/stages/${id}`);
  },

  async reorderStages(data: ReorderRequest): Promise<PipelineStage[]> {
    const response = await apiClient.put<PipelineStage[]>('/pipeline/stages/reorder', data);
    return response.data;
  },
};

export default pipelineStagesApi;
