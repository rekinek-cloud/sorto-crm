/**
 * Pipeline Configuration Defaults
 *
 * All values previously hardcoded across:
 * - RuleProcessingPipeline.ts
 * - emailPipeline.ts
 * - scheduledTasks.ts
 *
 * These serve as fallback when no DB config exists for an organization.
 */

export interface PipelineConfig {
  classifications: ClassificationsConfig;
  aiParams: AIParamsConfig;
  thresholds: ThresholdsConfig;
  keywords: KeywordsConfig;
  domains: DomainsConfig;
  scheduling: SchedulingConfig;
  contentLimits: ContentLimitsConfig;
  postActions: PostActionsConfig;
  systemRules: SystemRulesConfig;
  taskExtraction: TaskExtractionConfig;
}

export interface ClassificationsConfig {
  validClasses: string[];
  descriptions: Record<string, string>;
}

export interface AIParamsConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  classificationPrompt: string;
  language: string;
}

export interface ThresholdsConfig {
  unknownThreshold: number;
  listMatchConfidence: number;
  defaultRuleConfidence: number;
  autoBlacklistThreshold: number;
  highPriorityBusinessThreshold: number;
}

export interface KeywordsConfig {
  spam: string[];
  newsletter: string[];
  invoice: string[];
  urgency: string[];
  sentimentPositive: string[];
  sentimentNegative: string[];
}

export interface DomainsConfig {
  freeEmailDomains: string[];
}

export interface SchedulingConfig {
  emailProcessingInterval: number;
  invoiceSyncInterval: number;
  ragReindexInterval: number;
  emailBatchSize: number;
  invoiceBatchSize: number;
  invoiceBatchDelay: number;
  invoiceOrgDelay: number;
  importOrgDelay: number;
  ragStartupDelay: number;
  emailStartupDelay: number;
}

export interface ContentLimitsConfig {
  aiContentLimit: number;
  ragContentLimit: number;
  flowPreviewLimit: number;
  minContentLength: number;
}

export interface PostActionsConfig {
  [classification: string]: {
    rag?: boolean;
    flow?: boolean;
    suggestBlacklist?: boolean;
    autoBlacklist?: boolean;
    extractTasks?: boolean;
  };
}

export interface SystemRuleConfig {
  id: string;
  name: string;
  stage: string;
  priority: number;
  conditions: Array<{
    field: string;
    operator: string;
    value: string | string[] | boolean;
    caseSensitive?: boolean;
  }>;
  actions: Array<{
    type: string;
    value?: any;
  }>;
  stopProcessing?: boolean;
}

export interface SystemRulesConfig {
  preFilter: SystemRuleConfig[];
  classify: SystemRuleConfig[];
}

export interface TaskExtractionConfig {
  patterns: Array<{ pattern: string; flags: string }>;
  urgencyPatterns: string[];
  maxTasks: number;
  minTitleLength: number;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {

  // --- Classifications ---
  classifications: {
    validClasses: ['BUSINESS', 'NEWSLETTER', 'SPAM', 'TRANSACTIONAL', 'PERSONAL'],
    descriptions: {
      BUSINESS: 'Work-related, client communication, project discussions, invoices, offers',
      NEWSLETTER: 'Marketing emails, digests, promotional content, subscriptions',
      SPAM: 'Unsolicited, phishing, scam, irrelevant bulk mail',
      TRANSACTIONAL: 'Order confirmations, shipping notifications, password resets, system alerts',
      PERSONAL: 'Personal non-work communication',
    },
  },

  // --- AI Parameters ---
  aiParams: {
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 300,
    language: 'en',
    classificationPrompt: `You are an email classification expert. Classify the email into exactly one category.

Categories:
{{categories}}

Respond ONLY with valid JSON (no markdown):
{"classification":"CATEGORY","confidence":0.85,"summary":"One sentence summary","extractedTasks":[{"title":"Task description","priority":"MEDIUM"}]}

Rules:
- confidence must be between 0.0 and 1.0
- extractedTasks: extract actionable items from the email (can be empty array)
- If unsure, use lower confidence`,
  },

  // --- Thresholds ---
  thresholds: {
    unknownThreshold: 0.4,
    listMatchConfidence: 0.95,
    defaultRuleConfidence: 0.85,
    autoBlacklistThreshold: 0.9,
    highPriorityBusinessThreshold: 0.8,
  },

  // --- Keywords ---
  keywords: {
    spam: ['viagra', 'casino', 'lottery', 'winner', 'crypto profit', 'make money fast'],
    newsletter: ['newsletter', 'unsubscribe', 'weekly digest', 'monthly update'],
    invoice: ['faktura', 'invoice', 'rachunek', 'payment', 'płatność'],
    urgency: ['pilne', 'urgent', 'asap', 'natychmiast', 'dzisiaj', 'deadline', 'krytyczne'],
    sentimentPositive: ['dziękuję', 'świetnie', 'super', 'doskonale', 'gratulacje', 'thank you', 'great', 'excellent'],
    sentimentNegative: ['problem', 'błąd', 'reklamacja', 'zły', 'niezadowolony', 'complaint', 'error', 'issue', 'wrong'],
  },

  // --- Free Email Domains ---
  domains: {
    freeEmailDomains: [
      'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
      'yahoo.com', 'yahoo.pl', 'wp.pl', 'o2.pl', 'onet.pl', 'interia.pl',
      'op.pl', 'poczta.fm', 'gazeta.pl', 'tlen.pl', 'icloud.com', 'me.com',
      'protonmail.com', 'proton.me', 'aol.com', 'mail.com', 'zoho.com',
    ],
  },

  // --- Scheduling ---
  scheduling: {
    emailProcessingInterval: 5 * 60 * 1000,   // 5 minutes
    invoiceSyncInterval: 30 * 60 * 1000,       // 30 minutes
    ragReindexInterval: 6 * 60 * 60 * 1000,    // 6 hours
    emailBatchSize: 50,
    invoiceBatchSize: 3,
    invoiceBatchDelay: 2000,                   // 2s
    invoiceOrgDelay: 5000,                     // 5s
    importOrgDelay: 10000,                     // 10s
    ragStartupDelay: 2 * 60 * 1000,            // 2 min
    emailStartupDelay: 3 * 60 * 1000,          // 3 min
  },

  // --- Content Limits ---
  contentLimits: {
    aiContentLimit: 3000,
    ragContentLimit: 10000,
    flowPreviewLimit: 200,
    minContentLength: 20,
  },

  // --- Post-Actions per Classification ---
  postActions: {
    BUSINESS: { rag: true, flow: true, extractTasks: true },
    NEWSLETTER: { rag: true, suggestBlacklist: true },
    SPAM: { autoBlacklist: true },
    TRANSACTIONAL: {},
    PERSONAL: {},
  },

  // --- System Rules (emailPipeline.ts) ---
  systemRules: {
    preFilter: [
      {
        id: 'sys-spam-keywords',
        name: '[System] Spam Keywords',
        stage: 'PRE_FILTER',
        priority: 100,
        conditions: [
          { field: 'subject', operator: 'contains', value: ['viagra', 'casino', 'lottery', 'winner', 'crypto profit', 'make money fast'] },
        ],
        actions: [{ type: 'REJECT' }],
        stopProcessing: true,
      },
      {
        id: 'sys-noreply',
        name: '[System] No-Reply Emails',
        stage: 'PRE_FILTER',
        priority: 90,
        conditions: [
          { field: 'from', operator: 'contains', value: ['noreply@', 'no-reply@', 'donotreply@', 'mailer-daemon'] },
        ],
        actions: [{ type: 'ARCHIVE' }, { type: 'SKIP_AI' }],
        stopProcessing: true,
      },
    ],
    classify: [
      {
        id: 'sys-newsletter',
        name: '[System] Newsletter Detection',
        stage: 'CLASSIFY',
        priority: 80,
        conditions: [
          { field: 'subject', operator: 'contains', value: ['newsletter', 'unsubscribe', 'weekly digest', 'monthly update'] },
        ],
        actions: [
          { type: 'SET_CATEGORY', value: 'NEWSLETTER' },
          { type: 'SKIP_AI' },
        ],
        stopProcessing: false,
      },
      {
        id: 'sys-vip',
        name: '[System] VIP Priority',
        stage: 'CLASSIFY',
        priority: 95,
        conditions: [
          { field: 'isVIP', operator: 'equals', value: true },
        ],
        actions: [
          { type: 'SET_PRIORITY', value: 'HIGH' },
          { type: 'SET_CATEGORY', value: 'VIP' },
        ],
        stopProcessing: false,
      },
      {
        id: 'sys-invoice',
        name: '[System] Invoice Detection',
        stage: 'CLASSIFY',
        priority: 85,
        conditions: [
          { field: 'subject', operator: 'contains', value: ['faktura', 'invoice', 'rachunek', 'payment', 'płatność'] },
        ],
        actions: [
          { type: 'SET_CATEGORY', value: 'INVOICE' },
          { type: 'SET_PRIORITY', value: 'HIGH' },
        ],
        stopProcessing: false,
      },
    ],
  },

  // --- Task Extraction ---
  taskExtraction: {
    patterns: [
      { pattern: '(?:please|proszę|prosze)\\s+(.{10,80})', flags: 'i' },
      { pattern: '(?:can you|could you|możesz|mozesz)\\s+(.{10,80})', flags: 'i' },
      { pattern: '(?:need to|trzeba|musisz|należy|nalezy)\\s+(.{10,80})', flags: 'i' },
      { pattern: '(?:send|wyślij|wyslij|prześlij|przeslij)\\s+(.{10,80})', flags: 'i' },
      { pattern: '(?:review|sprawdź|sprawdz|przejrzyj)\\s+(.{10,80})', flags: 'i' },
      { pattern: '(?:prepare|przygotuj|zaplanuj)\\s+(.{10,80})', flags: 'i' },
      { pattern: '(?:deadline|termin|do dnia|by\\s+\\w+day)\\s*:?\\s*(.{5,80})', flags: 'i' },
    ],
    urgencyPatterns: ['asap', 'urgent', 'pilne', 'natychmiast', 'dzisiaj', 'today'],
    maxTasks: 5,
    minTitleLength: 10,
  },
};
