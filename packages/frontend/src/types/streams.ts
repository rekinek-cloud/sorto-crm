// STREAMS Types for Frontend - metodologia SORTO STREAMS
// Migracja z GTD/SMART na STREAMS

// Wzorce strumieni
export type StreamPattern = 'project' | 'continuous' | 'reference' | 'client' | 'pipeline' | 'workspace' | 'custom';

// Statusy strumieni (FLOWING = płynie, FROZEN = zamrożony)
export type StreamStatus = 'FLOWING' | 'FROZEN' | 'TEMPLATE';

// Tag (ex Context)
export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

export interface Stream {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: StreamStatus;  // FLOWING | FROZEN | TEMPLATE
  pattern?: StreamPattern;  // project | continuous | reference | client | pipeline | workspace | custom
  organizationId: string;
  createdById: string;
  parentId?: string;  // dla dopływów (hierarchia)
  createdAt: string;
  updatedAt: string;
}

// Alias dla kompatybilności wstecznej
export type Context = Tag;

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  streamScore?: number;  // ex smartScore
  streamAnalysis?: any;  // ex smartAnalysis
  organizationId: string;
  createdById: string;
  assignedToId?: string;
  streamId?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  stream?: Pick<Stream, 'id' | 'name' | 'color'>;
  createdBy?: User;
  assignedTo?: User;
  tasks?: Task[];
  stats?: {
    totalTasks: number;
    completedTasks: number;
    progress: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NEW' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'CANCELED';
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  energy?: 'LOW' | 'MEDIUM' | 'HIGH';
  isWaitingFor: boolean;
  waitingForNote?: string;
  streamScore?: number;  // ex smartScore
  streamAnalysis?: any;  // ex smartAnalysis
  organizationId: string;
  createdById: string;
  assignedToId?: string;
  tagId?: string;  // ex contextId
  streamId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  tag?: Tag;  // ex context
  project?: Pick<Project, 'id' | 'name'>;
  stream?: Pick<Stream, 'id' | 'name' | 'color'>;
  createdBy?: User;
  assignedTo?: User;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
  role?: string;
}

// API Request/Response types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  contextId?: string;
  projectId?: string;
  streamId?: string;
  assignedToId?: string;
  energy?: 'LOW' | 'MEDIUM' | 'HIGH';
  isWaitingFor?: boolean;
  waitingForNote?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: 'NEW' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'CANCELED';
  actualHours?: number;
  completedAt?: string;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  streamId?: string;
  assignedToId?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  completedAt?: string;
}

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateContextRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateContextRequest extends Partial<CreateContextRequest> {
  isActive?: boolean;
}

// Filter types
export interface TaskFilters {
  status?: string;
  priority?: string;
  contextId?: string;
  projectId?: string;
  streamId?: string;
  assignedToId?: string;
  dueDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProjectFilters {
  status?: string;
  priority?: string;
  streamId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// UI Component Props
export interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

export interface TaskFormProps {
  task?: Task;
  contexts: Context[];
  projects: Project[];
  streams: Stream[];
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ProjectItemProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onView: (projectId: string) => void;
}

export interface ProjectFormProps {
  project?: Project;
  streams: Stream[];
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Stream API types
export interface CreateStreamRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'TEMPLATE';
}

export interface UpdateStreamRequest extends Partial<CreateStreamRequest> {}

export interface StreamsResponse {
  streams: Stream[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StreamFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Stream Component Props
export interface StreamItemProps {
  stream: Stream;
  onEdit: (stream: Stream) => void;
  onDelete: (streamId: string) => void;
  onArchive: (streamId: string, archive: boolean) => void;
  onDuplicate: (streamId: string) => void;
  onSelect?: (stream: Stream) => void;
}

export interface StreamFormProps {
  stream?: Stream;
  onSubmit: (data: CreateStreamRequest | UpdateStreamRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================
// CEL PRECYZYJNY (RZUT) - Precise Goal
// ============================================

export type GoalStatus = 'active' | 'achieved' | 'failed' | 'paused';

/**
 * Cel Precyzyjny według metodologii RZUT:
 * R - Rezultat: Co konkretnie powstanie?
 * Z - Zmierzalność: Po czym poznam sukces?
 * U - Ujście: Do kiedy? (deadline)
 * T - Tło: Dlaczego ten cel?
 */
export interface PreciseGoal {
  id: string;

  // RZUT
  result: string;        // R - Rezultat
  measurement: string;   // Z - Zmierzalność
  deadline: string;      // U - Ujście (termin)
  background?: string;   // T - Tło

  // Metryki
  currentValue: number;
  targetValue: number;
  unit: string;

  // Relacje
  streamId?: string;
  stream?: Pick<Stream, 'id' | 'name' | 'color'>;
  organizationId: string;
  createdById: string;

  // Status
  status: GoalStatus;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  achievedAt?: string;
}

export interface CreateGoalRequest {
  result: string;
  measurement: string;
  deadline: string;
  background?: string;
  targetValue: number;
  unit?: string;
  streamId?: string;
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
  currentValue?: number;
  status?: GoalStatus;
}

export interface GoalsResponse {
  goals: PreciseGoal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================
// ŹRÓDŁO (Source) - ex GTD Inbox
// ============================================

export interface SourceItem {
  id: string;
  content: string;
  type: 'TEXT' | 'EMAIL' | 'VOICE' | 'FILE' | 'LINK';
  status: 'NEW' | 'PROCESSING' | 'ROUTED' | 'ARCHIVED';
  metadata?: Record<string, any>;
  aiSuggestion?: {
    suggestedStream?: string;
    suggestedTags?: string[];
    confidence: number;
  };
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSourceItemRequest {
  content: string;
  type?: 'TEXT' | 'EMAIL' | 'VOICE' | 'FILE' | 'LINK';
  metadata?: Record<string, any>;
}

export interface RouteSourceItemRequest {
  streamId: string;
  createTask?: boolean;
  taskTitle?: string;
  tags?: string[];
}