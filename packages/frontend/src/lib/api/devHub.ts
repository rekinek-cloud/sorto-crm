/**
 * Dev Hub API Client
 * Development tools and container management
 */

import { apiClient } from './client';

export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
}

export interface AppStatus {
  app: string;
  path: string;
  url: string;
  health: string;
  containers: any[];
}

export interface SystemResources {
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
}

export const devHubApi = {
  /**
   * Get all containers grouped by app
   */
  async getContainers(): Promise<{ containers: Record<string, Container[]> }> {
    const response = await apiClient.get('/dev-hub/containers');
    return response.data;
  },

  /**
   * Get system resources (CPU, memory, disk)
   */
  async getSystemResources(): Promise<SystemResources> {
    const response = await apiClient.get('/dev-hub/system-resources');
    return response.data;
  },

  /**
   * Get application status
   */
  async getAppStatus(app: string): Promise<AppStatus> {
    const response = await apiClient.get(`/dev-hub/applications/${app}/status`);
    return response.data;
  },

  /**
   * Perform container action (start, stop, restart)
   */
  async containerAction(containerName: string, action: 'start' | 'stop' | 'restart'): Promise<void> {
    await apiClient.post(`/dev-hub/containers/${containerName}/${action}`);
  },

  /**
   * Deploy application
   */
  async deployApp(app: string): Promise<void> {
    await apiClient.post(`/dev-hub/applications/${app}/deploy`);
  },
};
