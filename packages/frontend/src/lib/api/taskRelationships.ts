import { apiClient } from './client';
import { 
  TaskDependencies, 
  CreateTaskRelationshipRequest, 
  TaskRelationship,
  AllTaskRelationships,
  Task
} from '@/types/taskRelationships';

// Get all task relationships overview
export const getAllTaskRelationships = async (): Promise<AllTaskRelationships> => {
  try {
    const response = await apiClient.get('/tasks/relationships/all');
    return {
      relationships: response.data.relationships || [],
      tasks: response.data.tasks || []
    };
  } catch (error: any) {
    console.error('Error fetching all task relationships:', error);
    // Return empty data structure if API calls fail
    return {
      relationships: [],
      tasks: []
    };
  }
};

// Get dependencies for a specific task
export const getTaskDependencies = async (taskId: string): Promise<TaskDependencies> => {
  const response = await apiClient.get(`/tasks/${taskId}/dependencies`);
  return response.data;
};

// Add a new task dependency
export const addTaskDependency = async (
  fromTaskId: string, 
  data: CreateTaskRelationshipRequest
): Promise<TaskRelationship> => {
  const response = await apiClient.post(`/tasks/${fromTaskId}/dependencies`, data);
  return response.data;
};

// Remove a task dependency
export const removeTaskDependency = async (taskId: string, relationshipId: string): Promise<void> => {
  await apiClient.delete(`/tasks/${taskId}/dependencies/${relationshipId}`);
};

// Get list of all tasks (for dropdowns)
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const response = await apiClient.get('/tasks?limit=1000');
    return response.data.tasks?.map((task: any) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt
    })) || [];
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};