// Views Types for Sorto.AI Implementation

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type GTDContext = '@calls' | '@email' | '@meetings' | '@computer' | '@errands' | '@waiting' | '@reading' | '@planning';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Kanban Board Types
export interface KanbanColumn {
  id: string;
  title: string;
  deals: Deal[];
  totalValue: number;
  color: string;
  order: number;
  wipLimit?: number;
  columnType?: 'stage' | 'priority' | 'context' | 'sentiment';
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number;
  assignee: User;
  nextAction?: GTDAction;
  dueDate?: Date;
  priority: Priority;
  aiInsights?: AIInsight[];
  kanbanPosition?: number;
}

export interface GTDAction {
  id: string;
  type: string;
  description: string;
  context: GTDContext;
  estimatedTime: number;
}

export interface AIInsight {
  type: string;
  value: any;
  confidence: number;
  description: string;
}

// GTD Enhanced Kanban
export interface GTDKanbanColumn extends KanbanColumn {
  gtdContext: GTDContext;
  estimatedTime: number;
  energyLevel: 'high' | 'medium' | 'low' | 'minimal';
}

// Priority-based Pipeline
export interface PriorityColumn {
  id: string;
  urgency: Priority;
  color: string;
  deadline: 'today' | 'this_week' | 'this_month' | 'next_month';
  deals: Deal[];
}

// Gantt Chart Types
export interface GanttProject {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  tasks: GanttTask[];
  milestones: Milestone[];
  dependencies: Dependency[];
  criticalPath: string[];
}

export interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  progress: number;
  assignee: User;
  dependsOn: string[];
  priority: Priority;
  gtdContext: GTDContext;
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  completed: boolean;
  icon: string;
}

export interface Dependency {
  fromTask: string;
  toTask: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish';
  lag: number;
}

// Calendar Types
export interface CalendarWeek {
  startDate: Date;
  endDate: Date;
  days: CalendarDay[];
  totalEvents: number;
  totalHours: number;
}

export interface CalendarDay {
  date: Date;
  events: CalendarEvent[];
  tasks: DailyTask[];
  availability: TimeSlot[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'call' | 'demo' | 'internal' | 'block';
  attendees: User[];
  deal?: Deal;
  location?: string;
  priority: Priority;
  gtdContext: GTDContext;
}

export interface DailyTask {
  id: string;
  title: string;
  estimatedTime: number;
  priority: Priority;
  gtdContext: GTDContext;
  deadline?: Date;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

// List View Types
export interface TaskList {
  date: Date;
  sections: TaskSection[];
  totalTasks: number;
  completedTasks: number;
  estimatedTime: number;
}

export interface TaskSection {
  priority: Priority;
  color: string;
  tasks: Task[];
  totalTime: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  gtdContext: GTDContext;
  estimatedTime: number;
  assignee: User;
  dueDate?: Date;
  deal?: Deal;
  project?: Project;
  completed: boolean;
  completedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

// GTD Context List
export interface GTDContextList {
  context: GTDContext;
  icon: string;
  description: string;
  tasks: Task[];
  estimatedTime: number;
  optimalTiming: string;
}

// AI Predictions
export interface AIPrediction {
  dealId: string;
  winProbability: number;
  predictedCloseDate: Date;
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
  confidence: number;
  lastUpdated: Date;
}

export interface RiskFactor {
  type: 'competitor' | 'budget' | 'timing' | 'authority' | 'need';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
}

export interface Recommendation {
  type: 'action' | 'timing' | 'resource' | 'strategy';
  priority: Priority;
  description: string;
  estimatedImpact: number;
}

// View Configuration
export interface ViewConfiguration {
  id: string;
  userId: string;
  viewType: 'kanban' | 'gantt' | 'scrum' | 'calendar' | 'list';
  viewName: string;
  configuration: Record<string, any>;
  isDefault: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Scrum Board Types
export interface SprintBoard {
  sprintId: string;
  sprintNumber: number;
  goal: string;
  startDate: Date;
  endDate: Date;
  columns: ScrumColumn[];
  velocity: number;
  burndownData: BurndownPoint[];
}

export interface ScrumColumn {
  id: string;
  name: 'product_backlog' | 'sprint_backlog' | 'in_progress' | 'review' | 'done';
  wipLimit?: number;
  tasks: ScrumTask[];
}

export interface ScrumTask {
  id: string;
  title: string;
  description: string;
  storyPoints: number;
  priority: Priority;
  acceptanceCriteria: string[];
  assignee: User;
  estimatedHours: number;
  actualHours?: number;
  blockers: string[];
  labels: string[];
  sprintId?: string;
}

export interface BurndownPoint {
  date: Date;
  remainingPoints: number;
  idealRemaining: number;
}

export interface SprintMetrics {
  velocity: number;
  burndownRate: number;
  completionRate: number;
  scopeChange: number;
  blockerCount: number;
  teamSatisfaction: number;
}

// Drag & Drop
export interface DragEndResult {
  draggableId: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}