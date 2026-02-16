/**
 * STREAMS TypeScript Types and Interfaces
 * Kompletne definicje typów dla systemu STREAMS z walidacją Zod
 */

import { z } from 'zod';
import { StreamRole, StreamType } from '@prisma/client';

// ========================================
// CORE GTD ENUMS
// ========================================

// StreamRole jest zdefiniowane w Prisma schema i automatycznie generowane

// StreamType jest zdefiniowane w Prisma schema i automatycznie generowane

/**
 * Poziomy energii dla zadań i kontekstów
 */
export enum EnergyLevel {
  HIGH = 'HIGH',                     // Wysoka energia - trudne zadania
  MEDIUM = 'MEDIUM',                 // Średnia energia - standardowe zadania
  LOW = 'LOW',                       // Niska energia - proste zadania
  CREATIVE = 'CREATIVE',             // Energia kreatywna - zadania twórcze
  ADMINISTRATIVE = 'ADMINISTRATIVE'   // Energia administracyjna - zadania biurowe
}

/**
 * Częstotliwość przeglądów GTD
 */
export enum ReviewFrequency {
  DAILY = 'DAILY',                   // Codzienny przegląd
  WEEKLY = 'WEEKLY',                 // Tygodniowy przegląd
  MONTHLY = 'MONTHLY',               // Miesięczny przegląd
  QUARTERLY = 'QUARTERLY',           // Kwartalny przegląd
  CUSTOM = 'CUSTOM'                  // Niestandardowa częstotliwość
}

/**
 * Konteksty GTD standardowe
 */
export enum StreamContext {
  COMPUTER = '@computer',            // Zadania przy komputerze
  PHONE = '@phone',                  // Rozmowy telefoniczne
  ERRANDS = '@errands',              // Sprawy poza biurem
  OFFICE = '@office',                // Zadania w biurze
  HOME = '@home',                    // Praca zdalna/domowa
  ANYWHERE = '@anywhere',            // Zadania bez kontekstu miejsca
  ONLINE = '@online',                // Zadania internetowe
  WAITING = '@waiting',              // Oczekiwanie na odpowiedź
  READING = '@reading'               // Materiały do przeczytania
}

// ========================================
// GTD CONFIGURATION INTERFACES
// ========================================

/**
 * Konfiguracja zachowania Inbox
 */
export interface InboxBehavior {
  autoProcessing: boolean;           // Automatyczne przetwarzanie
  autoCreateTasks: boolean;          // Automatyczne tworzenie zadań
  defaultContext: StreamContext;        // Domyślny kontekst
  defaultEnergyLevel: EnergyLevel;   // Domyślny poziom energii
  processAfterDays: number;          // Przetwórz po X dniach
  purgeAfterDays: number;            // Usuń po X dniach
}

/**
 * Reguła przetwarzania GTD
 */
export interface ProcessingRule {
  id: string;                        // Unikalny identyfikator
  name: string;                      // Nazwa reguły
  description?: string;              // Opis reguły
  active: boolean;                   // Czy reguła jest aktywna
  
  // Warunki uruchomienia
  triggers: ProcessingTrigger[];     // Wyzwalacze reguły
  conditions: ProcessingCondition[]; // Warunki logiczne
  
  // Akcje do wykonania
  actions: ProcessingAction[];       // Lista akcji
  
  // Metadane
  priority: number;                  // Priorytet wykonania (0-100)
  executionCount: number;            // Liczba wykonań
  lastExecuted?: Date;               // Ostatnie wykonanie
  
  // Konfiguracja
  stopOnFirstMatch: boolean;         // Zatrzymaj po pierwszym dopasowaniu
  maxExecutionsPerDay: number;       // Maksimum wykonań dziennie
}

/**
 * Wyzwalacz reguły przetwarzania
 */
export interface ProcessingTrigger {
  type: 'EMAIL_RECEIVED' | 'TASK_CREATED' | 'CONTACT_UPDATED' | 'DEAL_CHANGED' | 'MANUAL' | 'SCHEDULED';
  config: Record<string, any>;       // Konfiguracja specyficzna dla typu
}

/**
 * Warunek logiczny reguły
 */
export interface ProcessingCondition {
  field: string;                     // Pole do sprawdzenia
  operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'in' | 'not_in';
  value: any;                        // Wartość porównania
  logicalOperator?: 'AND' | 'OR';    // Operator logiczny
}

/**
 * Akcja do wykonania
 */
export interface ProcessingAction {
  type: 'MOVE_TO_STREAM' | 'ASSIGN_CONTEXT' | 'SET_PRIORITY' | 'CREATE_TASK' | 'SEND_NOTIFICATION' | 'CREATE_PROJECT';
  config: Record<string, any>;       // Konfiguracja specyficzna dla typu
}

/**
 * Główna konfiguracja GTD dla streama
 */
export interface StreamConfig {
  // Zachowanie inbox
  inboxBehavior: InboxBehavior;
  
  // Konteksty dostępne w tym streamie
  availableContexts: StreamContext[];
  
  // Poziomy energii
  energyLevels: EnergyLevel[];
  
  // Częstotliwość przeglądów
  reviewFrequency: ReviewFrequency;
  
  // Reguły przetwarzania
  processingRules: ProcessingRule[];
  
  // Automatyzacje
  automations: StreamAutomation[];
  
  // Ustawienia zaawansowane
  advanced: {
    enableAI: boolean;               // Włącz analizę AI
    autoAssignContext: boolean;      // Automatyczne przypisywanie kontekstu
    autoSetEnergyLevel: boolean;     // Automatyczne ustawianie poziomu energii
    enableBulkProcessing: boolean;   // Włącz masowe przetwarzanie
    maxInboxItems: number;           // Maksimum elementów w inbox
  };
  
  // Metryki i analityka
  analytics: {
    trackProcessingTime: boolean;    // Śledź czas przetwarzania
    trackDecisionTypes: boolean;     // Śledź typy decyzji GTD
    generateInsights: boolean;       // Generuj insights
    enableReporting: boolean;        // Włącz raportowanie
  };
}

/**
 * Automatyzacja GTD
 */
export interface StreamAutomation {
  id: string;                        // Unikalny identyfikator
  name: string;                      // Nazwa automatyzacji
  type: 'WEEKLY_REVIEW' | 'INBOX_ZERO' | 'WAITING_FOR_FOLLOWUP' | 'PROJECT_REVIEW' | 'CONTEXT_SWITCH' | 'ENERGY_OPTIMIZATION';
  schedule: string;                  // Harmonogram (cron format)
  config: Record<string, any>;       // Konfiguracja automatyzacji
  active: boolean;                   // Czy automatyzacja jest aktywna
  lastRun?: Date;                    // Ostatnie uruchomienie
  nextRun?: Date;                    // Następne uruchomienie
}

// ========================================
// ZOD VALIDATION SCHEMAS
// ========================================

/**
 * Schema walidacji dla StreamRole
 */
export const StreamRoleSchema = z.nativeEnum(StreamRole);

/**
 * Schema walidacji dla StreamType  
 */
export const StreamTypeSchema = z.nativeEnum(StreamType);

/**
 * Schema walidacji dla EnergyLevel
 */
export const EnergyLevelSchema = z.nativeEnum(EnergyLevel);

/**
 * Schema walidacji dla ReviewFrequency
 */
export const ReviewFrequencySchema = z.nativeEnum(ReviewFrequency);

/**
 * Schema walidacji dla StreamContext
 */
export const StreamContextSchema = z.nativeEnum(StreamContext);

/**
 * Schema walidacji dla InboxBehavior
 */
export const InboxBehaviorSchema = z.object({
  autoProcessing: z.boolean(),
  autoCreateTasks: z.boolean(),
  defaultContext: StreamContextSchema,
  defaultEnergyLevel: EnergyLevelSchema,
  processAfterDays: z.number().min(1).max(365),
  purgeAfterDays: z.number().min(1).max(365)
});

/**
 * Schema walidacji dla ProcessingTrigger
 */
export const ProcessingTriggerSchema = z.object({
  type: z.enum(['EMAIL_RECEIVED', 'TASK_CREATED', 'CONTACT_UPDATED', 'DEAL_CHANGED', 'MANUAL', 'SCHEDULED']),
  config: z.record(z.any())
});

/**
 * Schema walidacji dla ProcessingCondition
 */
export const ProcessingConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'contains', 'regex', 'gt', 'lt', 'in', 'not_in']),
  value: z.any(),
  logicalOperator: z.enum(['AND', 'OR']).optional()
});

/**
 * Schema walidacji dla ProcessingAction
 */
export const ProcessingActionSchema = z.object({
  type: z.enum(['MOVE_TO_STREAM', 'ASSIGN_CONTEXT', 'SET_PRIORITY', 'CREATE_TASK', 'SEND_NOTIFICATION', 'CREATE_PROJECT']),
  config: z.record(z.any())
});

/**
 * Schema walidacji dla ProcessingRule
 */
export const ProcessingRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  active: z.boolean(),
  triggers: z.array(ProcessingTriggerSchema).min(1),
  conditions: z.array(ProcessingConditionSchema),
  actions: z.array(ProcessingActionSchema).min(1),
  priority: z.number().min(0).max(100),
  executionCount: z.number().min(0),
  lastExecuted: z.date().optional(),
  stopOnFirstMatch: z.boolean(),
  maxExecutionsPerDay: z.number().min(1).max(1000)
});

/**
 * Schema walidacji dla StreamAutomation
 */
export const StreamAutomationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: z.enum(['WEEKLY_REVIEW', 'INBOX_ZERO', 'WAITING_FOR_FOLLOWUP', 'PROJECT_REVIEW', 'CONTEXT_SWITCH', 'ENERGY_OPTIMIZATION']),
  schedule: z.string().min(1), // Cron format validation można dodać później
  config: z.record(z.any()),
  active: z.boolean(),
  lastRun: z.date().optional(),
  nextRun: z.date().optional()
});

/**
 * Schema walidacji dla StreamConfig
 */
export const StreamConfigSchema = z.object({
  inboxBehavior: InboxBehaviorSchema,
  availableContexts: z.array(StreamContextSchema).min(1),
  energyLevels: z.array(EnergyLevelSchema).min(1),
  reviewFrequency: ReviewFrequencySchema,
  processingRules: z.array(ProcessingRuleSchema),
  automations: z.array(StreamAutomationSchema),
  advanced: z.object({
    enableAI: z.boolean(),
    autoAssignContext: z.boolean(),
    autoSetEnergyLevel: z.boolean(),
    enableBulkProcessing: z.boolean(),
    maxInboxItems: z.number().min(10).max(10000)
  }),
  analytics: z.object({
    trackProcessingTime: z.boolean(),
    trackDecisionTypes: z.boolean(),
    generateInsights: z.boolean(),
    enableReporting: z.boolean()
  })
});

// ========================================
// DEFAULT CONFIGURATIONS
// ========================================

/**
 * Domyślna konfiguracja InboxBehavior
 */
export const DEFAULT_INBOX_BEHAVIOR: InboxBehavior = {
  autoProcessing: false,
  autoCreateTasks: true,
  defaultContext: StreamContext.COMPUTER,
  defaultEnergyLevel: EnergyLevel.MEDIUM,
  processAfterDays: 3,
  purgeAfterDays: 30
};

/**
 * Domyślne konteksty GTD
 */
export const DEFAULT_STREAM_CONTEXTS: StreamContext[] = [
  StreamContext.COMPUTER,
  StreamContext.PHONE,
  StreamContext.OFFICE,
  StreamContext.HOME,
  StreamContext.ANYWHERE
];

/**
 * Domyślne poziomy energii
 */
export const DEFAULT_ENERGY_LEVELS: EnergyLevel[] = [
  EnergyLevel.HIGH,
  EnergyLevel.MEDIUM,
  EnergyLevel.LOW,
  EnergyLevel.CREATIVE,
  EnergyLevel.ADMINISTRATIVE
];

/**
 * Domyślna konfiguracja GTD dla różnych ról
 */
export const DEFAULT_STREAM_CONFIGS: Record<StreamRole, Partial<StreamConfig>> = {
  [StreamRole.INBOX]: {
    inboxBehavior: DEFAULT_INBOX_BEHAVIOR,
    availableContexts: DEFAULT_STREAM_CONTEXTS,
    energyLevels: DEFAULT_ENERGY_LEVELS,
    reviewFrequency: ReviewFrequency.DAILY,
    processingRules: [],
    automations: []
  },
  
  [StreamRole.NEXT_ACTIONS]: {
    availableContexts: DEFAULT_STREAM_CONTEXTS,
    energyLevels: DEFAULT_ENERGY_LEVELS,
    reviewFrequency: ReviewFrequency.DAILY,
    processingRules: [],
    automations: []
  },
  
  [StreamRole.WAITING_FOR]: {
    availableContexts: [StreamContext.WAITING],
    energyLevels: [EnergyLevel.LOW],
    reviewFrequency: ReviewFrequency.WEEKLY,
    processingRules: [],
    automations: []
  },
  
  [StreamRole.SOMEDAY_MAYBE]: {
    availableContexts: [StreamContext.ANYWHERE],
    energyLevels: [EnergyLevel.CREATIVE],
    reviewFrequency: ReviewFrequency.MONTHLY,
    processingRules: [],
    automations: []
  },
  
  [StreamRole.PROJECTS]: {
    availableContexts: DEFAULT_STREAM_CONTEXTS,
    energyLevels: DEFAULT_ENERGY_LEVELS,
    reviewFrequency: ReviewFrequency.WEEKLY,
    processingRules: [],
    automations: []
  },
  
  [StreamRole.CONTEXTS]: {
    availableContexts: DEFAULT_STREAM_CONTEXTS,
    energyLevels: DEFAULT_ENERGY_LEVELS,
    reviewFrequency: ReviewFrequency.WEEKLY,
    processingRules: [],
    automations: []
  },
  
  [StreamRole.AREAS]: {
    availableContexts: DEFAULT_STREAM_CONTEXTS,
    energyLevels: DEFAULT_ENERGY_LEVELS,
    reviewFrequency: ReviewFrequency.MONTHLY,
    processingRules: [],
    automations: []
  },
  
  [StreamRole.REFERENCE]: {
    availableContexts: [StreamContext.READING, StreamContext.COMPUTER],
    energyLevels: [EnergyLevel.LOW, EnergyLevel.MEDIUM],
    reviewFrequency: ReviewFrequency.QUARTERLY,
    processingRules: [],
    automations: []
  },
  
  [StreamRole.CUSTOM]: {
    availableContexts: DEFAULT_STREAM_CONTEXTS,
    energyLevels: DEFAULT_ENERGY_LEVELS,
    reviewFrequency: ReviewFrequency.WEEKLY,
    processingRules: [],
    automations: []
  }
};

// ========================================
// UTILITY TYPES
// ========================================

/**
 * Type dla walidowanej GTD konfiguracji
 */
export type ValidatedStreamConfig = z.infer<typeof StreamConfigSchema>;

/**
 * Type dla walidowanej reguły przetwarzania
 */
export type ValidatedProcessingRule = z.infer<typeof ProcessingRuleSchema>;

/**
 * Type dla walidowanej automatyzacji GTD
 */
export type ValidatedStreamAutomation = z.infer<typeof StreamAutomationSchema>;

/**
 * Opcje dla tworzenia nowego streama GTD
 */
export interface CreateStreamOptions {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  streamRole: StreamRole;
  streamType: StreamType;
  templateOrigin?: string;
  parentStreamId?: string;
  streamConfig?: Partial<StreamConfig>;
}

/**
 * Opcje dla aktualizacji konfiguracji GTD
 */
export interface UpdateStreamConfigOptions {
  merge?: boolean;                   // Czy scalić z istniejącą konfiguracją
  inheritFromParent?: boolean;       // Czy dziedziczyć od rodzica
  validateOnly?: boolean;            // Tylko walidacja bez zapisu
}

/**
 * Wynik analizy GTD
 */
export interface StreamAnalysisResult {
  recommendedRole: StreamRole;          // Rekomendowana rola GTD
  recommendedContext: StreamContext;    // Rekomendowany kontekst
  recommendedEnergyLevel: EnergyLevel; // Rekomendowany poziom energii
  confidence: number;                // Pewność rekomendacji (0-1)
  reasoning: string[];               // Uzasadnienie decyzji
  suggestedActions: ProcessingAction[]; // Sugerowane akcje
}

export default {
  EnergyLevel,
  ReviewFrequency,
  StreamContext,
  StreamRoleSchema,
  StreamTypeSchema,
  EnergyLevelSchema,
  ReviewFrequencySchema,
  StreamContextSchema,
  StreamConfigSchema,
  DEFAULT_STREAM_CONFIGS
};