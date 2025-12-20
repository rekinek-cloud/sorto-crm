import { apiClient } from './client';

const API_URL = '/flow';

// =============================================================================
// Types for Flow Engine (STREAMS methodology)
// =============================================================================

export type FlowElementType = 'EMAIL' | 'NOTE' | 'TASK' | 'CONTACT' | 'DOCUMENT' | 'MEETING' | 'IDEA' | 'OTHER';

export type FlowAction =
  | 'ZROB_TERAZ'       // Proste zadanie <2min
  | 'ZAPLANUJ'         // Zaplanuj konkretne zadanie
  | 'PROJEKT'          // Utwórz projekt
  | 'KIEDYS_MOZE'      // Someday/Maybe - odłóż na później
  | 'REFERENCJA'       // Materiał referencyjny
  | 'USUN';            // Usuń

export type FlowProcessingStatus = 'PENDING' | 'PROCESSED' | 'DEFERRED' | 'FAILED';

export interface FlowPendingItem {
  id: string;
  type: FlowElementType;
  title: string;
  content?: string;
  sourceId?: string;
  sourceType?: string;
  metadata?: Record<string, any>;
  priority?: number;
  capturedAt: string;
  aiSuggestion?: {
    action: FlowAction;
    streamId?: string;
    streamName?: string;
    confidence: number;
    reasoning: string[];
  };
}

export interface FlowProcessResult {
  success: boolean;
  elementId: string;
  action: FlowAction;
  resultId?: string;
  resultType?: string;
}

export interface FlowStats {
  pending: number;
  processedToday: number;
  processedThisWeek: number;
  averageProcessingTime: number;
  topStreams: Array<{
    streamId: string;
    streamName: string;
    count: number;
  }>;
  actionDistribution: Record<FlowAction, number>;
}

export interface FlowAutomationRule {
  id: string;
  name: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  action: FlowAction;
  targetStreamId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface FlowHistory {
  id: string;
  elementId: string;
  elementType: FlowElementType;
  action: FlowAction;
  targetStreamId?: string;
  processedAt: string;
  processingTime: number;
  wasAutomated: boolean;
  userConfirmed: boolean;
}

// =============================================================================
// Conversational Flow Types (Dialogue Mode)
// =============================================================================

export type FlowConversationStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface FlowAIMetadata {
  summary?: string;
  analysis?: {
    urgency?: string;
    ideaType?: string;
    complexity?: string;
    missingInfo?: string[];
    timeHorizon?: string;
    completeness?: string;
  };
  confidence?: number;
  actionOptions?: Array<{
    label: string;
    action: FlowAction;
    isDefault?: boolean;
    suggestedTags?: string[];
    suggestedTasks?: string[];
    defaultReminder?: string;
  }>;
  streamMatching?: {
    matches?: Array<{
      streamId: string;
      streamName: string;
      confidence: number;
    }>;
    bestMatch?: {
      streamId: string;
      streamName: string;
      confidence: number;
    };
    noMatchFound?: boolean;
  };
}

export interface FlowConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: FlowAIMetadata;
}

export interface FlowUserModification {
  field: string;
  from: string | null;
  to: string;
  timestamp: string;
}

export interface FlowConversation {
  id: string;
  inboxItemId: string;
  status: FlowConversationStatus;
  messages: FlowConversationMessage[];
  proposedAction: FlowAction | null;
  proposedStreamId: string | null;
  proposedStreamName?: string;
  proposedTaskTitle: string | null;
  proposedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  proposedDueDate: string | null;
  userModifications: FlowUserModification[];
  finalAction: FlowAction | null;
  confidence: number;
  reasoning: string[];
  createdAt: string;
  updatedAt: string;
  inboxItem?: {
    id: string;
    title: string;
    content?: string;
    elementType?: string;
    sourceType?: string;
  };
}

// =============================================================================
// Flow Engine API
// =============================================================================

export const flowApi = {
  // Get pending items
  getPending: async (params?: {
    limit?: number;
    type?: FlowElementType;
    withAiSuggestions?: boolean;
  }): Promise<{ items: FlowPendingItem[]; total: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.type) searchParams.set('type', params.type);
    if (params?.withAiSuggestions !== undefined) searchParams.set('withAiSuggestions', params.withAiSuggestions.toString());

    const url = searchParams.toString() ? `${API_URL}/pending?${searchParams}` : `${API_URL}/pending`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // Process single item
  processItem: async (elementId: string, data: {
    action: FlowAction;
    targetStreamId?: string;
    taskData?: {
      title: string;
      description?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      dueDate?: string;
    };
    projectData?: {
      name: string;
      description?: string;
      streamId?: string;
    };
  }): Promise<FlowProcessResult> => {
    const response = await apiClient.post(`${API_URL}/process/${elementId}`, data);
    return response.data;
  },

  // Batch process items
  batchProcess: async (items: Array<{
    elementId: string;
    action: FlowAction;
    targetStreamId?: string;
  }>): Promise<{
    results: FlowProcessResult[];
    successCount: number;
    failureCount: number;
  }> => {
    const response = await apiClient.post(`${API_URL}/batch`, { items });
    return response.data;
  },

  // Get AI suggestion for item
  getSuggestion: async (elementId: string, refresh?: boolean): Promise<{
    action: FlowAction;
    streamId?: string;
    streamName?: string;
    confidence: number;
    reasoning: string[];
    alternatives: Array<{
      action: FlowAction;
      streamId?: string;
      confidence: number;
    }>;
    // V3 AI Assistant/Coach fields
    thinking?: {
      step1_understanding?: {
        whatIsIt: string;
        userGoal: string;
        context: string;
        timeframe: string;
        complexity: string;
      };
      step2_support?: {
        keyQuestions: string[];
        typicalSteps: string[];
        risks: string[];
        tips: string[];
      };
      step3_methodology?: {
        bestFit: string;
        reasoning: string;
      };
      step4_context?: {
        matchingStream: string | null;
        matchingProject: string | null;
        needsNewStream: boolean;
        suggestedStreamName: string | null;
      };
    };
    assistantMessage?: string;
    firstSteps?: string[];
    priority?: string;
    dueDate?: string;
  }> => {
    const url = refresh
      ? `${API_URL}/suggest/${elementId}?refresh=true`
      : `${API_URL}/suggest/${elementId}`;
    const response = await apiClient.get(url);
    const data = response.data.data || response.data;
    // Map API response fields to expected format including V3 fields
    return {
      action: data.suggestedAction || data.action,
      streamId: data.suggestedStreamId || data.streamId,
      streamName: data.suggestedStreamName || data.streamName,
      confidence: data.confidence || 0,
      reasoning: Array.isArray(data.reasoning) ? data.reasoning : (data.reasoning ? [data.reasoning] : []),
      alternatives: data.alternatives || [],
      // V3 fields - AI as assistant/coach
      thinking: data.thinking,
      assistantMessage: data.assistantMessage,
      firstSteps: data.firstSteps,
      priority: data.priority,
      dueDate: data.dueDate,
    };
  },

  // Get AI suggestions for multiple items
  getBatchSuggestions: async (elementIds: string[]): Promise<Record<string, {
    action: FlowAction;
    streamId?: string;
    streamName?: string;
    confidence: number;
    reasoning: string[];
  }>> => {
    const response = await apiClient.post(`${API_URL}/suggest/batch`, { elementIds });
    return response.data.suggestions;
  },

  // Get stats
  getStats: async (): Promise<FlowStats> => {
    const response = await apiClient.get(`${API_URL}/stats`);
    return response.data;
  },

  // Get processing history
  getHistory: async (params?: {
    limit?: number;
    offset?: number;
    action?: FlowAction;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ history: FlowHistory[]; total: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.action) searchParams.set('action', params.action);
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo);

    const url = searchParams.toString() ? `${API_URL}/history?${searchParams}` : `${API_URL}/history`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // =============================================================================
  // Automation Rules
  // =============================================================================

  // Get automation rules
  getRules: async (): Promise<FlowAutomationRule[]> => {
    const response = await apiClient.get(`${API_URL}/rules`);
    return response.data.rules;
  },

  // Create automation rule
  createRule: async (data: Omit<FlowAutomationRule, 'id' | 'createdAt'>): Promise<FlowAutomationRule> => {
    const response = await apiClient.post(`${API_URL}/rules`, data);
    return response.data;
  },

  // Update automation rule
  updateRule: async (ruleId: string, data: Partial<FlowAutomationRule>): Promise<FlowAutomationRule> => {
    const response = await apiClient.put(`${API_URL}/rules/${ruleId}`, data);
    return response.data;
  },

  // Delete automation rule
  deleteRule: async (ruleId: string): Promise<void> => {
    await apiClient.delete(`${API_URL}/rules/${ruleId}`);
  },

  // =============================================================================
  // Learn from user decisions
  // =============================================================================

  // Record user feedback on AI suggestion
  recordFeedback: async (elementId: string, data: {
    suggestedAction: FlowAction;
    actualAction: FlowAction;
    wasHelpful: boolean;
  }): Promise<void> => {
    await apiClient.post(`${API_URL}/feedback`, {
      elementId,
      ...data,
    });
  },

  // =============================================================================
  // Conversational Flow API (Dialogue Mode)
  // =============================================================================

  conversation: {
    // Start a new conversation for an inbox item
    start: async (inboxItemId: string): Promise<FlowConversation> => {
      const response = await apiClient.post(`${API_URL}/conversation/start/${inboxItemId}`);
      return response.data.data;
    },

    // Get conversation details
    get: async (conversationId: string): Promise<FlowConversation> => {
      const response = await apiClient.get(`${API_URL}/conversation/${conversationId}`);
      return response.data.data;
    },

    // Send a message in conversation
    sendMessage: async (conversationId: string, message: string): Promise<FlowConversationMessage> => {
      const response = await apiClient.post(`${API_URL}/conversation/${conversationId}/message`, { message });
      return response.data.data;
    },

    // Modify proposal (action, stream, title, priority, and all other fields)
    modify: async (conversationId: string, modifications: {
      action?: FlowAction;
      streamId?: string;
      taskTitle?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      // New stream creation
      createNewStream?: boolean;
      newStreamName?: string;
      newStreamColor?: string;
      // New goal creation
      createNewGoal?: boolean;
      newGoalName?: string;
      linkedGoalId?: string;
      // Project linkage (for tasks)
      linkedProjectId?: string;
      // Tasks as first steps (for PROJEKT)
      tasks?: Array<{ title: string; dueDate?: string }>;
      // Tags
      tags?: string[];
      // Dates
      dueDate?: string;
      projectDeadline?: string;
      // Reminder (for KIEDYS_MOZE)
      reminder?: string;
    }): Promise<{
      modificationsApplied: boolean;
      data: FlowConversation;
      createdStream?: { id: string; name: string };
      createdGoal?: { id: string; name: string };
    }> => {
      const response = await apiClient.put(`${API_URL}/conversation/${conversationId}/modify`, modifications);
      return response.data;
    },

    // Execute the decision (process and learn)
    execute: async (conversationId: string): Promise<{
      success: boolean;
      data: {
        status: string;
        finalAction: FlowAction;
        result?: any;
      };
    }> => {
      const response = await apiClient.post(`${API_URL}/conversation/${conversationId}/execute`);
      return response.data;
    },

    // Get list of conversations
    list: async (params?: { status?: string; limit?: number }): Promise<FlowConversation[]> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      const url = searchParams.toString() ? `${API_URL}/conversation?${searchParams}` : `${API_URL}/conversation`;
      const response = await apiClient.get(url);
      return response.data.data || [];
    },
  },
};

// =============================================================================
// Helper functions
// =============================================================================

export const FLOW_ACTION_LABELS: Record<FlowAction, { label: string; emoji: string; description: string; color: string }> = {
  ZROB_TERAZ: {
    label: 'Zrób Teraz',
    emoji: '⚡',
    description: 'Proste zadanie <2min - szybka reakcja',
    color: 'bg-red-50 border-red-200 text-red-800',
  },
  ZAPLANUJ: {
    label: 'Zaplanuj',
    emoji: '📅',
    description: 'Konkretne zadanie z deadline - wymaga terminu',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  PROJEKT: {
    label: 'Projekt',
    emoji: '📋',
    description: 'Złożone przedsięwzięcie - wymaga wielu kroków',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  KIEDYS_MOZE: {
    label: 'Kiedyś/Może',
    emoji: '❄️',
    description: 'Odłóż na później - nie pilne teraz',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800',
  },
  REFERENCJA: {
    label: 'Referencja',
    emoji: '📁',
    description: 'Informacja do zachowania - bez akcji',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
  USUN: {
    label: 'Usuń',
    emoji: '🗑️',
    description: 'Spam, nieistotne - do usunięcia',
    color: 'bg-gray-50 border-gray-200 text-gray-800',
  },
};

export const FLOW_ELEMENT_TYPE_LABELS: Record<FlowElementType, { label: string; icon: string }> = {
  EMAIL: { label: 'E-mail', icon: '📧' },
  NOTE: { label: 'Notatka', icon: '📝' },
  TASK: { label: 'Zadanie', icon: '✅' },
  CONTACT: { label: 'Kontakt', icon: '👤' },
  DOCUMENT: { label: 'Dokument', icon: '📄' },
  MEETING: { label: 'Spotkanie', icon: '📅' },
  IDEA: { label: 'Pomysł', icon: '💡' },
  OTHER: { label: 'Inne', icon: '📦' },
};
