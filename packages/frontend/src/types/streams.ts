// Streams Types for Frontend

// Stream Role - role dla streamów
export type StreamRole =
  | 'INBOX'
  | 'NEXT_ACTIONS'
  | 'WAITING_FOR'
  | 'SOMEDAY_MAYBE'
  | 'PROJECTS'
  | 'CONTEXTS'
  | 'AREAS'
  | 'REFERENCE'
  | 'ARCHIVE'
  | 'CUSTOM';

// Stream Type - typy streamów
export type StreamType =
  | 'TASK_LIST'
  | 'PROJECT_CONTAINER'
  | 'REFERENCE_MATERIAL'
  | 'TICKLER'
  | 'CALENDAR'
  | 'HYBRID'
  | 'CUSTOM'
  | 'WORKSPACE'
  | 'PROJECT'
  | 'AREA'
  | 'CONTEXT';

export interface Context {
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
  status: 'ACTIVE' | 'ARCHIVED' | 'TEMPLATE';
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  smartScore?: number;
  smartAnalysis?: any;
  organizationId: string;
  createdById: string;
  assignedToId?: string;
  streamId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Universal relations
  contactId?: string;
  dealId?: string;
  eventId?: string;

  // Relations
  stream?: Pick<Stream, 'id' | 'name' | 'color'>;
  createdBy?: User;
  assignedTo?: User;
  tasks?: Task[];
  contact?: { id: string; firstName: string; lastName: string };
  deal?: { id: string; title: string; value?: number };
  event?: { id: string; name: string };
  milestones?: Milestone[];
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
  smartScore?: number;
  smartAnalysis?: any;
  organizationId: string;
  createdById: string;
  assignedToId?: string;
  contextId?: string;
  streamId?: string;
  projectId?: string;
  parentTaskId?: string;
  subtasks?: Pick<Task, 'id' | 'title' | 'status' | 'priority'>[];
  // Universal relations
  contactId?: string;
  dealId?: string;
  eventId?: string;
  milestoneId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  context?: Context;
  project?: Pick<Project, 'id' | 'name'>;
  stream?: Pick<Stream, 'id' | 'name' | 'color'>;
  createdBy?: User;
  assignedTo?: User;
  contact?: { id: string; firstName: string; lastName: string; email?: string };
  deal?: { id: string; title: string; value?: number; stage?: string };
  event?: { id: string; name: string; startDate?: string };
  milestone?: { id: string; name: string; dueDate?: string; status?: string };
  companies?: { id: string; name: string };
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
  parentTaskId?: string;
  contactId?: string;
  dealId?: string;
  eventId?: string;
  milestoneId?: string;
  companyId?: string;
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
  contactId?: string;
  dealId?: string;
  eventId?: string;
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

// =============================================
// Extension Types
// =============================================

// Milestones
export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dueDate: string;
  completedAt?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'BLOCKED';
  isCritical: boolean;
  dependsOnIds: string[];
  responsibleId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  responsible?: User;
  tasks?: Task[];
}

// Events
export interface Event {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  eventType: 'TRADE_SHOW' | 'CONFERENCE' | 'WEBINAR' | 'WORKSHOP' | 'NETWORKING' | 'COMPANY_EVENT' | 'OTHER';
  venue?: string;
  city?: string;
  country?: string;
  address?: string;
  startDate: string;
  endDate: string;
  setupDate?: string;
  teardownDate?: string;
  status: 'DRAFT' | 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  budgetPlanned?: number;
  budgetActual?: number;
  currency: string;
  goals?: any;
  results?: any;
  rating?: number;
  retrospective?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    companies: number;
    contacts: number;
    tasks: number;
    team: number;
    expenses: number;
  };
}

// Notes
export interface Note {
  id: string;
  organizationId: string;
  content: string;
  streamId?: string;
  projectId?: string;
  taskId?: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
  meetingId?: string;
  eventId?: string;
  isPinned: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
}

// Contact Relations
export interface ContactRelation {
  id: string;
  organizationId: string;
  fromContactId: string;
  toContactId: string;
  relationType: 'REPORTS_TO' | 'WORKS_WITH' | 'KNOWS' | 'REFERRED_BY' | 'FAMILY' | 'TECHNICAL' | 'FORMER_COLLEAGUE' | 'MENTOR' | 'PARTNER';
  strength: number;
  isBidirectional: boolean;
  notes?: string;
  discoveredAt: string;
  discoveredVia?: string;
  fromContact?: { id: string; firstName: string; lastName: string };
  toContact?: { id: string; firstName: string; lastName: string };
}

// Health Score
export interface RelationshipHealth {
  id: string;
  entityType: 'COMPANY' | 'CONTACT' | 'DEAL';
  entityId: string;
  healthScore: number;
  trend: 'RISING' | 'STABLE' | 'DECLINING' | 'CRITICAL';
  trendChange: number;
  recencyScore: number;
  frequencyScore: number;
  responseScore: number;
  sentimentScore: number;
  engagementScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  lastContactAt?: string;
  lastContactType?: string;
}

export interface HealthAlert {
  id: string;
  entityType: 'COMPANY' | 'CONTACT' | 'DEAL';
  entityId: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  suggestion?: string;
  isRead: boolean;
  isDismissed: boolean;
  isActioned: boolean;
  createdAt: string;
}

// Client Intelligence
export interface ClientIntelligence {
  id: string;
  entityType: 'COMPANY' | 'CONTACT';
  entityId: string;
  category: 'LIKES' | 'DISLIKES' | 'PREFERENCE' | 'FACT' | 'WARNING' | 'TIP' | 'IMPORTANT_DATE' | 'DECISION_PROCESS' | 'COMMUNICATION' | 'SUCCESS';
  content: string;
  importance: number;
  source?: string;
  sourceDate?: string;
  isPrivate: boolean;
  eventDate?: string;
  isRecurring: boolean;
  createdAt: string;
  createdBy?: User;
}

// Deal Stakeholders (Decision Map)
export interface DealStakeholder {
  id: string;
  dealId: string;
  contactId: string;
  role: 'DECISION_MAKER' | 'INFLUENCER' | 'CHAMPION' | 'BLOCKER' | 'USER_ROLE' | 'TECHNICAL' | 'FINANCIAL' | 'LEGAL' | 'PROCUREMENT';
  isChampion: boolean;
  influence: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'SKEPTICAL' | 'NEGATIVE' | 'UNKNOWN';
  objections?: string;
  motivations?: string;
  winStrategy?: string;
  hasApproved: boolean;
  contact?: { id: string; firstName: string; lastName: string; position?: string };
}

// Deal Competitors
export interface DealCompetitor {
  id: string;
  dealId: string;
  competitorName: string;
  competitorWebsite?: string;
  estimatedPrice?: number;
  priceSource?: string;
  currency: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  theirStrengths?: string;
  theirWeaknesses?: string;
  ourAdvantages?: string;
  status: 'ACTIVE' | 'ELIMINATED' | 'WON' | 'UNKNOWN';
  eliminatedReason?: string;
  intelNotes?: string;
}

// Client Products (Order History)
export interface ClientProduct {
  id: string;
  companyId: string;
  productId?: string;
  serviceId?: string;
  customName?: string;
  customDescription?: string;
  deliveredAt: string;
  value: number;
  currency: string;
  rating?: number;
  feedback?: string;
  dealId?: string;
  projectId?: string;
  createdAt: string;
}

export interface ClientProductStats {
  id: string;
  companyId: string;
  totalValue: number;
  orderCount: number;
  averageValue: number;
  averageRating?: number;
  yearOverYearGrowth?: number;
  lastOrderAt?: string;
  firstOrderAt?: string;
  topProducts?: any;
  seasonality?: any;
}