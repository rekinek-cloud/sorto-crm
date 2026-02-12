import apiClient from './client';
import { AIAgent, AIAgentTask, AIAgentMessage, AIAgentTemplate } from '@/types/holding';

export const aiAgentsApi = {
  async getAgents(): Promise<AIAgent[]> {
    const response = await apiClient.get<AIAgent[]>('/ai-agents');
    return response.data;
  },

  async getAgent(id: string): Promise<AIAgent> {
    const response = await apiClient.get<AIAgent>(`/ai-agents/${id}`);
    return response.data;
  },

  async createAgent(data: Partial<AIAgent>): Promise<AIAgent> {
    const response = await apiClient.post<AIAgent>('/ai-agents', data);
    return response.data;
  },

  async updateAgent(id: string, data: Partial<AIAgent>): Promise<AIAgent> {
    const response = await apiClient.patch<AIAgent>(`/ai-agents/${id}`, data);
    return response.data;
  },

  async deleteAgent(id: string): Promise<void> {
    await apiClient.delete(`/ai-agents/${id}`);
  },

  async getTemplates(): Promise<AIAgentTemplate[]> {
    const response = await apiClient.get<AIAgentTemplate[]>('/ai-agents/templates');
    return response.data;
  },

  async getAgentTasks(agentId: string, params?: Record<string, any>): Promise<AIAgentTask[]> {
    const response = await apiClient.get<AIAgentTask[]>(`/ai-agents/${agentId}/tasks`, { params });
    return response.data;
  },

  async createAgentTask(agentId: string, data: Partial<AIAgentTask>): Promise<AIAgentTask> {
    const response = await apiClient.post<AIAgentTask>(`/ai-agents/${agentId}/tasks`, data);
    return response.data;
  },

  async approveTask(taskId: string, data: { status: string; modifiedOutput?: Record<string, any> }): Promise<AIAgentTask> {
    const response = await apiClient.post<AIAgentTask>(`/ai-agent-tasks/${taskId}/approve`, data);
    return response.data;
  },

  async updateTask(taskId: string, data: Partial<AIAgentTask>): Promise<AIAgentTask> {
    const response = await apiClient.patch<AIAgentTask>(`/ai-agent-tasks/${taskId}`, data);
    return response.data;
  },

  async getMessages(params?: { unreadOnly?: boolean }): Promise<AIAgentMessage[]> {
    const response = await apiClient.get<AIAgentMessage[]>('/ai-messages', { params });
    return response.data;
  },

  async sendMessage(data: Partial<AIAgentMessage>): Promise<AIAgentMessage> {
    const response = await apiClient.post<AIAgentMessage>('/ai-messages', data);
    return response.data;
  },

  async markMessageRead(id: string): Promise<void> {
    await apiClient.patch(`/ai-messages/${id}/read`);
  },
};

export default aiAgentsApi;
