export type RuleScope = 'global' | 'module' | 'component';
export type RuleTarget = 'communication' | 'tasks' | 'projects' | 'deals' | 'contacts' | 'ai-prompts' | 'all';

export interface CommunicationRule {
  id: string;
  name: string;
  description?: string;
  scope: RuleScope;
  target: RuleTarget[];
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  aiPrompts?: AIPromptTemplate[];
  metadata?: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastUsed?: string;
    usageCount?: number;
  };
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'in' | 'notIn' | 'exists' | 'notExists';
  value: any;
  caseSensitive?: boolean;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: 'assign' | 'tag' | 'notify' | 'webhook' | 'aiProcess' | 'customFunction';
  params: Record<string, any>;
  aiModelId?: string; // For AI-powered actions
}

export interface AIPromptTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  variables: PromptVariable[];
  modelPreferences?: {
    preferredModelId?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  examples?: PromptExample[];
  category?: string;
  tags?: string[];
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

export interface PromptExample {
  input: Record<string, any>;
  expectedOutput: string;
  description?: string;
}

export interface RuleExecutionContext {
  module: string;
  component?: string;
  data: Record<string, any>;
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
  timestamp: string;
}

export interface RuleExecutionResult {
  ruleId: string;
  ruleName: string;
  success: boolean;
  executedActions: {
    actionId: string;
    type: string;
    result: any;
    error?: string;
  }[];
  aiResponses?: {
    promptId: string;
    modelId: string;
    response: string;
    tokensUsed: number;
    executionTime: number;
  }[];
  metadata: {
    executionTime: number;
    context: RuleExecutionContext;
  };
}