import { apiClient } from './client';

// Server metrics
export interface ServerMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
  loadAverage: number[];
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
  usagePercent: number;
  mountPoint: string;
}

// Container types
export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'created';
  health?: 'healthy' | 'unhealthy' | 'starting' | 'none';
  ports: Array<{ private: number; public: number; protocol: string }>;
  created: string;
  uptime?: string;
}

export interface ContainerStats {
  name: string;
  cpu: {
    usage: number;
    limit?: number;
  };
  memory: {
    usage: number;
    limit: number;
    usagePercent: number;
  };
  network: {
    rxBytes: number;
    txBytes: number;
  };
  blockIO: {
    read: number;
    write: number;
  };
}

// Health types
export interface AppHealth {
  name: string;
  url: string;
  status: 'up' | 'down' | 'error';
  responseTime?: number;
  lastChecked: string;
  error?: string;
}

// Database types
export interface DatabaseStatus {
  name: string;
  type: 'postgres' | 'redis' | 'mysql';
  status: 'connected' | 'disconnected' | 'error';
  size?: number;
  connections?: number;
  version?: string;
}

// GitHub repo types
export interface GitHubRepo {
  name: string;
  fullName: string;
  description?: string;
  url: string;
  defaultBranch: string;
  lastCommit?: string;
  lastCommitDate?: string;
  isInstalled: boolean;
  localPath?: string;
  syncStatus?: 'synced' | 'behind' | 'ahead' | 'unknown';
}

// Overview type
export interface InfrastructureOverview {
  server: ServerMetrics;
  containers: {
    total: number;
    running: number;
    stopped: number;
  };
  health: {
    total: number;
    up: number;
    down: number;
  };
  disk: DiskUsage;
}

export const infrastructureApi = {
  // ========== OVERVIEW ==========

  async getOverview(): Promise<InfrastructureOverview> {
    const response = await apiClient.get('/infrastructure/overview');
    return response.data;
  },

  // ========== SERVER ==========

  async getServerMetrics(): Promise<ServerMetrics> {
    const response = await apiClient.get('/infrastructure/server');
    return response.data;
  },

  async getDiskUsage(): Promise<DiskUsage> {
    const response = await apiClient.get('/infrastructure/disk');
    return response.data;
  },

  // ========== CONTAINERS ==========

  async getContainers(showAll?: boolean): Promise<Container[]> {
    const response = await apiClient.get('/infrastructure/containers', {
      params: { all: showAll }
    });
    return response.data;
  },

  async getContainerStats(name: string): Promise<ContainerStats> {
    const response = await apiClient.get(`/infrastructure/containers/${name}/stats`);
    return response.data;
  },

  async restartContainer(name: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/infrastructure/containers/${name}/restart`);
    return response.data;
  },

  async stopContainer(name: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/infrastructure/containers/${name}/stop`);
    return response.data;
  },

  async startContainer(name: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/infrastructure/containers/${name}/start`);
    return response.data;
  },

  // ========== LOGS ==========

  async getContainerLogs(name: string, lines?: number): Promise<{ logs: string[] }> {
    const response = await apiClient.get(`/infrastructure/containers/${name}/logs`, {
      params: { lines }
    });
    return response.data;
  },

  async searchContainerLogs(name: string, query: string, lines?: number): Promise<{ results: string[]; count: number }> {
    const response = await apiClient.get(`/infrastructure/containers/${name}/logs/search`, {
      params: { q: query, lines }
    });
    return response.data;
  },

  async getErrorLogs(name: string, lines?: number): Promise<{ errors: string[]; count: number }> {
    const response = await apiClient.get(`/infrastructure/containers/${name}/logs/errors`, {
      params: { lines }
    });
    return response.data;
  },

  async getSystemLogs(service?: string, lines?: number): Promise<{ logs: string[] }> {
    const response = await apiClient.get('/infrastructure/system/logs', {
      params: { service, lines }
    });
    return response.data;
  },

  // ========== HEALTH ==========

  async getHealth(): Promise<{ summary: { total: number; up: number; down: number; error: number }; apps: AppHealth[] }> {
    const response = await apiClient.get('/infrastructure/health');
    return response.data;
  },

  // ========== DATABASES ==========

  async getDatabasesStatus(): Promise<DatabaseStatus[]> {
    const response = await apiClient.get('/infrastructure/databases');
    return response.data;
  },

  // ========== GITHUB ==========

  async getGitHubRepos(): Promise<GitHubRepo[]> {
    const response = await apiClient.get('/infrastructure/github/repos');
    return response.data;
  },

  async getNewGitHubRepos(): Promise<GitHubRepo[]> {
    const response = await apiClient.get('/infrastructure/github/repos/new');
    return response.data;
  },

  async cloneGitHubRepo(name: string, branch?: string): Promise<{ success: boolean; message: string; path?: string }> {
    const response = await apiClient.post(`/infrastructure/github/repos/${name}/clone`, { branch });
    return response.data;
  },

  async getReposSyncStatus(): Promise<Array<{ name: string; status: string; lastCommit?: string }>> {
    const response = await apiClient.get('/infrastructure/github/sync-status');
    return response.data;
  },

  async pullGitHubRepo(name: string): Promise<{ success: boolean; message: string; changes?: string[] }> {
    const response = await apiClient.post(`/infrastructure/github/repos/${name}/pull`);
    return response.data;
  }
};
