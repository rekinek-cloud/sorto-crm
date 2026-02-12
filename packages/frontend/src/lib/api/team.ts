import apiClient from './client';
import { TeamMember } from '@/types/holding';

export const teamApi = {
  async getTeam(includeAI = false): Promise<TeamMember[]> {
    const response = await apiClient.get<TeamMember[]>('/team', {
      params: { includeAI },
    });
    return response.data;
  },
};

export default teamApi;
