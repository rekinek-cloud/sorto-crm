export interface Task {
  id: string;
  title: string;
  status: 'NEW' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  completedAt?: string;
}

export interface TaskRelationship {
  id: string;
  task: Task;
  type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
  lag?: string;
  notes?: string;
  isCriticalPath: boolean;
}

export interface TaskDependencies {
  taskId: string;
  dependencies: TaskRelationship[]; // Tasks this task depends on
  dependents: TaskRelationship[];   // Tasks that depend on this task
}

export interface CreateTaskRelationshipRequest {
  toTaskId: string;
  type?: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
  lag?: string;
  notes?: string;
}

export interface AllTaskRelationships {
  relationships: {
    id: string;
    fromTask: Task;
    toTask: Task;
    type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
    lag?: string;
    notes?: string;
    isCriticalPath: boolean;
    createdAt: string;
  }[];
  tasks: Task[];
}