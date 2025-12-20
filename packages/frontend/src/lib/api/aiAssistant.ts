/**
 * AI Assistant API Client
 * Implementacja zgodna ze spec.md - Human-in-the-Loop
 */

import apiClient from './client';

// Typy zgodne ze spec.md
export type AIContext = 'SOURCE' | 'STREAM' | 'TASK' | 'DAY_PLAN' | 'REVIEW' | 'DEAL';
export type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'MODIFIED';
export type SuggestedAction = 'DO_NOW' | 'SCHEDULE' | 'DELEGATE' | 'PROJECT' | 'REFERENCE' | 'SOMEDAY' | 'DELETE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AutonomyLevel = 0 | 1 | 2 | 3;

// V3 Thinking structure - 5-step AI analysis
export interface V3Thinking {
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
}

export interface SourceItemSuggestion {
  suggestedAction: SuggestedAction;
  suggestedStream: string | null;
  suggestedPriority: Priority;
  suggestedTags: string[];
  suggestedDueDate: string | null;
  extractedTasks: string[];
  confidence: number;
  reasoning: string;

  // V3 fields - AI as assistant/coach
  thinking?: V3Thinking;
  assistantMessage?: string;
  firstSteps?: string[];
  priority?: string;
  dueDate?: string;
}

export interface DayPlanBlock {
  startTime: string;
  endTime: string;
  taskId: string | null;
  blockType: 'DEEP_WORK' | 'MEETINGS' | 'ADMIN' | 'BREAK';
  energyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DayPlanSuggestion {
  blocks: DayPlanBlock[];
  reasoning: string;
  alternativePlan: DayPlanSuggestion | null;
  tasksSummary: {
    total: number;
    highPriority: number;
  };
}

export interface WeeklyReviewSuggestion {
  summary: {
    completedTasks: number;
    completedProjects: number;
    newItems: number;
    streamsActivity: {
      streamId: string;
      streamName: string;
      activity: 'HIGH' | 'MEDIUM' | 'LOW';
    }[];
  };
  insights: string[];
  suggestionsForNextWeek: string[];
  streamsToFreeze: string[];
  streamsToUnfreeze: string[];
  stuckProjects: string[];
  overdueItems: number;
  reasoning: string;
}

export interface UserAIPatterns {
  preferredStreams: string[];
  energyPatterns: Record<string, any>;
  acceptanceRate: number;
  commonModifications: string[];
  totalSuggestions: number;
  totalAccepted: number;
  autonomyLevel: AutonomyLevel;
  enabledContexts: AIContext[];
}

export interface AISuggestion {
  id: string;
  context: AIContext;
  inputData: any;
  suggestion: any;
  confidence: number;
  reasoning: string;
  status: SuggestionStatus;
  userModifications: any | null;
  processingTimeMs: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AnalyzeResponse {
  suggestionId: string;
  suggestions: any;
  confidence: number;
  reasoning: string;
  processingTime: number;
}

// API Functions

/**
 * Główny endpoint analizy (spec.md sekcja 4.1)
 */
export async function analyze(context: AIContext, data: any): Promise<AnalyzeResponse> {
  const response = await apiClient.post('/ai-assistant/analyze', { context, data });
  return response.data;
}

/**
 * Endpoint zatwierdzania sugestii (spec.md sekcja 4.2)
 */
export async function submitFeedback(
  suggestionId: string,
  accepted: boolean,
  modifications?: any
): Promise<{ success: boolean; status: SuggestionStatus; message: string }> {
  const response = await apiClient.post('/ai-assistant/feedback', {
    suggestionId,
    accepted,
    modifications
  });
  return response.data;
}

/**
 * Analiza elementu w Źródle (spec.md sekcja 3.1)
 */
export async function analyzeSourceItem(
  content: string,
  source?: string
): Promise<{ success: boolean; suggestion: SourceItemSuggestion }> {
  const response = await apiClient.post('/ai-assistant/analyze-source-item', {
    content,
    source
  });
  return response.data;
}

/**
 * Analiza elementu w Źródle po ID
 */
export async function analyzeSourceItemById(
  itemId: string
): Promise<{ success: boolean; suggestion: SourceItemSuggestion }> {
  const response = await apiClient.post('/ai-assistant/analyze-source-item', {
    itemId
  });
  return response.data;
}

/**
 * Optymalizacja dnia (spec.md sekcja 3.4)
 */
export async function optimizeDay(
  date?: string
): Promise<{ success: boolean; suggestion: DayPlanSuggestion }> {
  const response = await apiClient.post('/ai-assistant/optimize-day', {
    date
  });
  return response.data;
}

/**
 * Przegląd tygodniowy (spec.md sekcja 3.5)
 */
export async function getWeeklyReview(): Promise<{ success: boolean; suggestion: WeeklyReviewSuggestion }> {
  const response = await apiClient.post('/ai-assistant/weekly-review');
  return response.data;
}

/**
 * Pobierz wzorce użytkownika (spec.md sekcja 4.3)
 */
export async function getUserPatterns(): Promise<{ success: boolean; data: UserAIPatterns }> {
  const response = await apiClient.get('/ai-assistant/user-patterns');
  return response.data;
}

/**
 * Aktualizuj ustawienia AI
 */
export async function updateSettings(settings: {
  autonomyLevel?: AutonomyLevel;
  enabledContexts?: AIContext[];
}): Promise<{ success: boolean; data: any }> {
  const response = await apiClient.put('/ai-assistant/settings', settings);
  return response.data;
}

/**
 * Pobierz listę sugestii użytkownika
 */
export async function getSuggestions(params?: {
  status?: SuggestionStatus;
  context?: AIContext;
  limit?: number;
}): Promise<{ success: boolean; data: AISuggestion[]; count: number }> {
  const response = await apiClient.get('/ai-assistant/suggestions', { params });
  return response.data;
}

export default {
  analyze,
  submitFeedback,
  analyzeSourceItem,
  analyzeSourceItemById,
  optimizeDay,
  getWeeklyReview,
  getUserPatterns,
  updateSettings,
  getSuggestions
};
