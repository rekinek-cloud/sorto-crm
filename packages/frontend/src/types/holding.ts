// Holding types
export interface Holding {
  id: string;
  name: string;
  nip?: string;
  ownerId: string;
  settings: HoldingSettings;
  organizations?: OrganizationSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface HoldingSettings {
  allowCrossCompanyContacts: boolean;
  consolidatedReporting: boolean;
  sharedAIAgents: boolean;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  shortName?: string;
  companyType: CompanyType;
  color: string;
  icon?: string;
  _count?: {
    employees: number;
    companies: number;
    deals: number;
  };
}

export type CompanyType = 'PRODUCTION' | 'SALES' | 'SERVICES' | 'EXPORT' | 'OTHER';

// Employee types
export interface Employee {
  id: string;
  userId: string;
  organizationId: string;
  role: EmployeeRole;
  position?: string;
  department?: string;
  isActive: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type EmployeeRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER';

// AI Agent types
export interface AIAgent {
  id: string;
  holdingId: string;
  name: string;
  role: string;
  avatar: string;
  description?: string;
  status: AIAgentStatus;
  autonomyLevel: number;
  capabilities: string[];
  settings: AIAgentSettings;
  tasksCompleted: number;
  successRate: number;
  lastActivityAt?: string;
  organizationAssignments?: AIAgentAssignment[];
  _count?: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type AIAgentStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';

export interface AIAgentSettings {
  workingHours?: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  notifications: {
    onTaskComplete: boolean;
    onError: boolean;
    onApprovalNeeded: boolean;
  };
  requireApprovalFor: string[];
  maxTasksPerHour?: number;
  maxTasksPerDay?: number;
}

export interface AIAgentAssignment {
  id: string;
  agentId: string;
  organizationId: string;
  settings: Record<string, any>;
}

export interface AIAgentTask {
  id: string;
  agentId: string;
  organizationId: string;
  type: string;
  status: AITaskStatus;
  input: Record<string, any>;
  prompt?: string;
  output?: Record<string, any>;
  result?: string;
  requiresApproval: boolean;
  approvalStatus?: ApprovalStatus;
  approvedById?: string;
  approvedAt?: string;
  requestedById: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
  agent?: AIAgent;
  createdAt: string;
  updatedAt: string;
}

export type AITaskStatus = 'PENDING' | 'IN_PROGRESS' | 'WAITING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ApprovalStatus = 'APPROVAL_PENDING' | 'APPROVAL_APPROVED' | 'APPROVAL_REJECTED' | 'APPROVAL_MODIFIED';

export interface AIAgentMessage {
  id: string;
  fromAgentId?: string;
  fromUserId?: string;
  toAgentId?: string;
  toUserId?: string;
  organizationId?: string;
  taskId?: string;
  content: string;
  type: AIMessageType;
  isRead: boolean;
  metadata: Record<string, any>;
  fromAgent?: { name: string; avatar: string };
  createdAt: string;
}

export type AIMessageType = 'INFO' | 'QUESTION' | 'RESULT' | 'ALERT' | 'APPROVAL_REQUEST';

export interface AIAgentTemplate {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  defaultAutonomyLevel: number;
  capabilities: string[];
  systemPrompt?: string;
  isSystem: boolean;
}

// Team Member (unified human + AI)
export interface TeamMember {
  id: string;
  type: 'human' | 'ai_agent';
  name: string;
  avatar: string;
  email?: string;
  position?: string;
  department?: string;
  role?: string;
  autonomyLevel?: number;
  status?: string;
  capabilities?: string[];
}

// AI Capabilities (predefined)
export const AI_CAPABILITIES = [
  { id: 'web_search', name: 'Wyszukiwanie w internecie', description: 'Może szukać informacji online', requiresApproval: false },
  { id: 'analyze_data', name: 'Analiza danych', description: 'Może analizować dane CRM', requiresApproval: false },
  { id: 'generate_report', name: 'Generowanie raportów', description: 'Może tworzyć raporty', requiresApproval: false },
  { id: 'draft_email', name: 'Drafty emaili', description: 'Może przygotowywać drafty', requiresApproval: false },
  { id: 'send_email', name: 'Wysyłanie emaili', description: 'Może wysyłać emaile', requiresApproval: true },
  { id: 'create_task', name: 'Tworzenie zadań', description: 'Może tworzyć zadania', requiresApproval: false },
  { id: 'update_deal', name: 'Aktualizacja deali', description: 'Może zmieniać dane deali', requiresApproval: true },
  { id: 'schedule_meeting', name: 'Planowanie spotkań', description: 'Może rezerwować terminy', requiresApproval: true },
];

// Base stream templates by company type
export const BASE_STREAMS_BY_TYPE: Record<CompanyType, { name: string; icon: string; type: string }[]> = {
  PRODUCTION: [
    { name: 'Klienci', icon: '👥', type: 'CONTINUOUS' },
    { name: 'Produkcja', icon: '🏭', type: 'CONTINUOUS' },
    { name: 'Logistyka', icon: '🚚', type: 'CONTINUOUS' },
    { name: 'Zakupy', icon: '📦', type: 'CONTINUOUS' },
    { name: 'Administracja', icon: '📋', type: 'CONTINUOUS' },
  ],
  SALES: [
    { name: 'Klienci', icon: '👥', type: 'CONTINUOUS' },
    { name: 'Sprzedaż', icon: '💰', type: 'CONTINUOUS' },
    { name: 'Marketing', icon: '📢', type: 'CONTINUOUS' },
    { name: 'Obsługa klienta', icon: '🎧', type: 'CONTINUOUS' },
    { name: 'Administracja', icon: '📋', type: 'CONTINUOUS' },
  ],
  SERVICES: [
    { name: 'Klienci', icon: '👥', type: 'CONTINUOUS' },
    { name: 'Projekty', icon: '📐', type: 'CONTINUOUS' },
    { name: 'Realizacja', icon: '⚙️', type: 'CONTINUOUS' },
    { name: 'Wsparcie', icon: '🛠️', type: 'CONTINUOUS' },
    { name: 'Administracja', icon: '📋', type: 'CONTINUOUS' },
  ],
  EXPORT: [
    { name: 'Klienci', icon: '🌍', type: 'CONTINUOUS' },
    { name: 'Sprzedaż', icon: '💰', type: 'CONTINUOUS' },
    { name: 'Logistyka', icon: '🚚', type: 'CONTINUOUS' },
    { name: 'Dokumentacja', icon: '📄', type: 'CONTINUOUS' },
  ],
  OTHER: [
    { name: 'Klienci', icon: '👥', type: 'CONTINUOUS' },
    { name: 'Operacje', icon: '⚙️', type: 'CONTINUOUS' },
    { name: 'Administracja', icon: '📋', type: 'CONTINUOUS' },
  ],
};
