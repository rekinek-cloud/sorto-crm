import { apiClient } from './client';
import type {
  Task,
  Project,
  Context,
  TasksResponse,
  ProjectsResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateContextRequest,
  UpdateContextRequest,
  TaskFilters,
  ProjectFilters,
} from '@/types/streams';

// GTD Inbox Types
export interface InboxItem {
  id: string;
  type: 'MESSAGE' | 'TASK' | 'IDEA' | 'REQUEST';
  title: string;
  description?: string;
  source: string;
  sourceId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  urgencyScore?: number;
  actionable: boolean;
  processed: boolean;
  processingDecision?: string;
  estimatedTime?: string;
  contextSuggested?: string;
  organizationId: string;
  createdAt: string;
  receivedAt: string;
}

export interface InboxStats {
  totalUnprocessed: number;
  unprocessedMessages: number;
  unprocessedTasks: number;
  urgentItems: number;
  totalMessages: number;
  processedToday: number;
  processingRate: number;
}

export interface GTDProcessingDecision {
  itemId: string;
  decision: 'DO' | 'DEFER' | 'DELEGATE' | 'DELETE' | 'REFERENCE';
  actionData?: {
    taskTitle?: string;
    taskDescription?: string;
    dueDate?: string;
    assignedTo?: string;
    context?: string;
    streamId?: string;
    estimatedTime?: string;
  };
  notes?: string;
}

// Tasks API
export const tasksApi = {
  // Get all tasks with filters
  async getTasks(filters: TaskFilters = {}): Promise<TasksResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  // Get single task by ID
  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  async createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post('/tasks', data);
    return response.data;
  },

  // Update task
  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Delete task
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  // Update task status (quick action)
  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    return this.updateTask(id, { status });
  },

  // Complete task (quick action)
  async completeTask(id: string): Promise<Task> {
    return this.updateTask(id, { 
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    });
  },
};

// Projects API
export const projectsApi = {
  // Get all projects with filters
  async getProjects(filters: ProjectFilters = {}): Promise<ProjectsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/projects?${params.toString()}`);
    return response.data;
  },

  // Get single project by ID
  async getProject(id: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  // Create new project
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  // Update project
  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data;
  },

  // Delete project
  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },
};

// Contexts API
export const contextsApi = {
  // Get all contexts
  async getContexts(isActive?: boolean): Promise<Context[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append('isActive', isActive.toString());
    }

    const response = await apiClient.get(`/contexts?${params.toString()}`);
    return response.data;
  },

  // Get single context by ID
  async getContext(id: string): Promise<Context> {
    const response = await apiClient.get(`/contexts/${id}`);
    return response.data;
  },

  // Create new context
  async createContext(data: CreateContextRequest): Promise<Context> {
    const response = await apiClient.post('/contexts', data);
    return response.data;
  },

  // Update context
  async updateContext(id: string, data: UpdateContextRequest): Promise<Context> {
    const response = await apiClient.put(`/contexts/${id}`, data);
    return response.data;
  },

  // Delete context
  async deleteContext(id: string): Promise<void> {
    await apiClient.delete(`/contexts/${id}`);
  },

  // Create default GTD contexts
  async createDefaultContexts(): Promise<{ message: string; contexts: Context[] }> {
    const response = await apiClient.post('/contexts/default');
    return response.data;
  },
};

// Helper functions for UI
export const gtdHelpers = {
  // Get priority color
  getPriorityColor(priority: Task['priority'] | Project['priority']): string {
    const colors = {
      LOW: '#84cc16',      // green-500
      MEDIUM: '#f59e0b',   // amber-500
      HIGH: '#f97316',     // orange-500
      URGENT: '#ef4444',   // red-500
    };
    return colors[priority];
  },

  // Get status color
  getTaskStatusColor(status: Task['status']): string {
    const colors = {
      NEW: '#6b7280',          // gray-500
      IN_PROGRESS: '#3b82f6',  // blue-500
      WAITING: '#f59e0b',      // amber-500
      COMPLETED: '#10b981',    // emerald-500
      CANCELED: '#6b7280',     // gray-500
    };
    return colors[status];
  },

  // Get project status color
  getProjectStatusColor(status: Project['status']): string {
    const colors = {
      PLANNING: '#6b7280',     // gray-500
      IN_PROGRESS: '#3b82f6',  // blue-500
      ON_HOLD: '#f59e0b',      // amber-500
      COMPLETED: '#10b981',    // emerald-500
      CANCELED: '#6b7280',     // gray-500
    };
    return colors[status];
  },

  // Get energy level color
  getEnergyColor(energy: Task['energy']): string {
    const colors = {
      LOW: '#84cc16',      // green-500
      MEDIUM: '#f59e0b',   // amber-500
      HIGH: '#ef4444',     // red-500
    };
    return colors[energy || 'MEDIUM'];
  },

  // Format date for display
  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Format datetime for display
  formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Check if task is overdue
  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'CANCELED') {
      return false;
    }
    return new Date(task.dueDate) < new Date();
  },

  // Get task progress percentage for project
  getProjectProgress(project: Project): number {
    if (!project.stats) return 0;
    return project.stats.progress;
  },

  // Sort tasks by priority and due date
  sortTasks(tasks: Task[]): Task[] {
    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    
    return [...tasks].sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date (overdue first)
      const aOverdue = this.isTaskOverdue(a);
      const bOverdue = this.isTaskOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then by due date ascending
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // Finally by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },
};

// GTD Inbox API
export const gtdApi = {
  // Inbox operations
  async getInboxItems(filters?: {
    unprocessedOnly?: boolean;
    actionableOnly?: boolean;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<InboxItem[]> {
    const params = new URLSearchParams();
    if (filters?.unprocessedOnly) params.append('unprocessed', 'true');
    if (filters?.actionableOnly) params.append('actionable', 'true');
    if (filters?.source) params.append('source', filters.source);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/gtd/inbox?${params.toString()}`);
    return response.data;
  },

  async createInboxItem(data: {
    title: string;
    description?: string;
    type?: 'TASK' | 'IDEA' | 'REQUEST';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    estimatedTime?: string;
    context?: string;
    dueDate?: string;
  }): Promise<InboxItem> {
    const response = await apiClient.post('/gtd/inbox', data);
    return response.data.item;
  },

  async getInboxStats(): Promise<InboxStats> {
    const response = await apiClient.get('/gtd/inbox/stats');
    return response.data;
  },

  async processInboxItem(itemId: string, decision: GTDProcessingDecision): Promise<any> {
    const response = await apiClient.post(`/gtd/inbox/${itemId}/process`, decision);
    return response.data;
  },

  async quickAction(itemId: string, action: 'QUICK_DO' | 'QUICK_DEFER' | 'QUICK_DELETE'): Promise<any> {
    const response = await apiClient.post(`/gtd/inbox/${itemId}/quick-action`, { action });
    return response.data;
  },

  // Next Actions
  async getNextActions(filters?: {
    context?: string;
    priority?: string;
    energy?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.context) params.append('context', filters.context);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.energy) params.append('energy', filters.energy);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/gtd/next-actions?${params.toString()}`);
    return response.data;
  },

  async getNextActionsStats(): Promise<any> {
    const response = await apiClient.get('/gtd/next-actions/stats');
    return response.data;
  },

  // Waiting For
  async getWaitingFor(filters?: {
    overdue?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.overdue) params.append('overdue', 'true');
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/gtd/waiting-for?${params.toString()}`);
    return response.data;
  },

  async followUp(itemId: string, data: { notes?: string; newExpectedDate?: string }): Promise<any> {
    const response = await apiClient.post(`/gtd/waiting-for/${itemId}/follow-up`, data);
    return response.data;
  },

  // Someday/Maybe
  async getSomedayMaybe(filters?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/gtd/someday-maybe?${params.toString()}`);
    return response.data;
  },

  async createSomedayMaybe(data: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    whenToReview?: string;
    tags?: string[];
  }): Promise<any> {
    const response = await apiClient.post('/gtd/someday-maybe', data);
    return response.data;
  },

  async activateSomedayMaybe(itemId: string, data: {
    dueDate?: string;
    streamId?: string;
    context?: string;
  }): Promise<any> {
    const response = await apiClient.post(`/gtd/someday-maybe/${itemId}/activate`, data);
    return response.data;
  },

  // Contexts and Tasks
  async getGTDContexts(): Promise<string[]> {
    const response = await apiClient.get('/gtd/contexts');
    return response.data;
  },

  async updateTaskContext(taskId: string, context: string): Promise<any> {
    const response = await apiClient.put(`/gtd/tasks/${taskId}/context`, { context });
    return response.data;
  },

  async completeGTDTask(taskId: string, notes?: string): Promise<any> {
    const response = await apiClient.post(`/gtd/tasks/${taskId}/complete`, { notes });
    return response.data;
  }
};