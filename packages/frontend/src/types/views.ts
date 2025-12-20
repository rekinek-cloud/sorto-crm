// Sorto.AI Views Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number;
  assignee: User;
  nextAction: GTDAction;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  aiInsights: AIInsight[];
}

export interface GTDAction {
  id: string;
  title: string;
  context: GTDContext;
  estimatedTime: number; // minutes
}

export interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'risk';
  content: string;
  confidence: number;
  createdAt: Date;
}

export enum GTDContext {
  CALLS = '@calls',
  EMAIL = '@email',
  MEETINGS = '@meetings',
  COMPUTER = '@computer',
  ERRANDS = '@errands',
  WAITING = '@waiting',
  READING = '@reading',
  PLANNING = '@planning'
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Kanban Board Types
export interface KanbanColumn {
  id: string;
  title: string;
  deals: Deal[];
  totalValue: number;
  color: string;
  order: number;
}

export interface GTDKanbanColumn {
  id: string;
  title: string;
  gtdContext: '@calls' | '@email' | '@meetings' | '@proposals';
  deals: Deal[];
  estimatedTime: number;
  energyLevel: 'high' | 'medium' | 'low' | 'minimal';
}

export interface PriorityColumn {
  id: string;
  urgency: 'urgent' | 'high' | 'medium' | 'low';
  color: '#FF4444' | '#FFAA00' | '#00AA00' | '#0066AA';
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
  priority: 'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
  assignee: User;
  estimatedHours: number;
  actualHours?: number;
  blockers: string[];
  labels: string[];
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
  priority: 'urgent' | 'high' | 'normal' | 'low';
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
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  startDate: Date;
  endDate?: Date;
}

export interface GTDContextList {
  context: GTDContext;
  icon: string;
  description: string;
  tasks: Task[];
  estimatedTime: number;
  optimalTiming: string;
}

// AI Enhanced Types
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

export interface SentimentColumn {
  sentiment: 'positive' | 'neutral' | 'concerned' | 'negative';
  emoji: '😊' | '😐' | '😟' | '😡';
  deals: Deal[];
  averageSentiment: number;
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface SentimentAnalysis {
  dealId: string;
  overallSentiment: number;
  recentInteractions: InteractionSentiment[];
  sentimentTrend: 'improving' | 'stable' | 'declining';
  keyPhrases: string[];
  concerns: string[];
  positiveSignals: string[];
}

export interface InteractionSentiment {
  id: string;
  date: Date;
  sentiment: number;
  content: string;
}

// State Management Types
export interface AppState {
  views: {
    kanban: KanbanState;
    gantt: GanttState;
    scrum: ScrumState;
    calendar: CalendarState;
    list: ListState;
  };
  deals: DealsState;
  tasks: TasksState;
  users: UsersState;
  ai: AIState;
  filters: FiltersState;
}

export interface KanbanState {
  columns: KanbanColumn[];
  viewType: 'pipeline' | 'gtd' | 'priority' | 'size' | 'sentiment';
  loading: boolean;
  error?: string;
}

export interface GanttState {
  projects: GanttProject[];
  selectedProject?: string;
  timeframe: 'month' | 'quarter' | 'year';
  loading: boolean;
  error?: string;
}

export interface ScrumState {
  sprints: SprintBoard[];
  activeSprint?: string;
  loading: boolean;
  error?: string;
}

export interface CalendarState {
  view: 'week' | 'month';
  currentDate: Date;
  events: CalendarEvent[];
  tasks: DailyTask[];
  loading: boolean;
  error?: string;
}

export interface ListState {
  tasks: Task[];
  filters: TaskFilters;
  groupBy: 'context' | 'priority' | 'project' | 'assignee';
  loading: boolean;
  error?: string;
}

export interface DealsState {
  deals: Deal[];
  loading: boolean;
  error?: string;
}

export interface TasksState {
  tasks: Task[];
  loading: boolean;
  error?: string;
}

export interface UsersState {
  users: User[];
  currentUser?: User;
  loading: boolean;
  error?: string;
}

export interface AIState {
  predictions: AIPrediction[];
  sentimentAnalysis: SentimentAnalysis[];
  loading: boolean;
  error?: string;
}

export interface FiltersState {
  kanban: KanbanFilters;
  gantt: GanttFilters;
  scrum: ScrumFilters;
  calendar: CalendarFilters;
  list: TaskFilters;
}

export interface KanbanFilters {
  assignee?: string[];
  priority?: Priority[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  value?: {
    min: number;
    max: number;
  };
}

export interface GanttFilters {
  assignee?: string[];
  priority?: Priority[];
  status?: string[];
  milestone?: boolean;
}

export interface ScrumFilters {
  assignee?: string[];
  sprint?: string[];
  storyPoints?: {
    min: number;
    max: number;
  };
}

export interface CalendarFilters {
  eventType?: string[];
  attendees?: string[];
  priority?: Priority[];
}

export interface TaskFilters {
  assignee?: string[];
  priority?: Priority[];
  context?: GTDContext[];
  status?: 'completed' | 'pending' | 'all';
  dueDate?: {
    start: Date;
    end: Date;
  };
}

// Drag & Drop Types
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

// WebSocket Types
export interface WebSocketMessage {
  type: 'deal_updated' | 'task_completed' | 'ai_prediction' | 'user_action';
  payload: any;
  timestamp: Date;
  userId: string;
}