// AI Conversations Sync - Type Definitions

export enum AiSourceType {
  CHATGPT = 'CHATGPT',
  CLAUDE = 'CLAUDE',
  DEEPSEEK = 'DEEPSEEK',
}

export enum SyncStatusType {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED',
}

// ============================================
// PARSED CONVERSATION TYPES
// ============================================

export interface ParsedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageIndex: number;
  model?: string;
  timestamp?: Date;
}

export interface ParsedConversation {
  source: AiSourceType;
  externalId: string;
  title: string;
  messages: ParsedMessage[];
  createdAt?: Date;
  updatedAt?: Date;
  model?: string;
}

// ============================================
// CHATGPT EXPORT TYPES
// ============================================

export interface ChatGPTExport {
  conversations: ChatGPTConversation[];
}

export interface ChatGPTConversation {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, ChatGPTNode>;
}

export interface ChatGPTNode {
  id: string;
  parent?: string;
  children?: string[];
  message?: ChatGPTMessage;
}

export interface ChatGPTMessage {
  id: string;
  author: {
    role: string;
    metadata?: Record<string, unknown>;
  };
  create_time?: number;
  content: {
    content_type: string;
    parts?: string[];
    text?: string;
  };
  metadata?: {
    model_slug?: string;
  };
}

// ============================================
// CLAUDE EXPORT TYPES
// ============================================

export interface ClaudeExport {
  conversations?: ClaudeConversation[];
  // Alternative format (single conversation)
  uuid?: string;
  name?: string;
  chat_messages?: ClaudeMessage[];
}

export interface ClaudeConversation {
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
  chat_messages: ClaudeMessage[];
}

export interface ClaudeMessage {
  uuid: string;
  text: string;
  sender: 'human' | 'assistant';
  created_at: string;
  updated_at: string;
}

// ============================================
// DEEPSEEK EXPORT TYPES
// ============================================

export interface DeepSeekExport {
  data: DeepSeekConversation[];
}

export interface DeepSeekConversation {
  chat_id: string;
  title: string;
  created_at: string;
  messages: DeepSeekMessage[];
}

export interface DeepSeekMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// ============================================
// CLASSIFICATION & SYNC TYPES
// ============================================

export interface ClassificationResult {
  appName: string;
  score: number;
  keywords: string[];
}

export interface SyncResult {
  source: AiSourceType;
  success: boolean;
  conversationsImported: number;
  conversationsUpdated: number;
  conversationsSkipped: number;
  errors: string[];
}

export interface ChunkData {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  embedding?: number[];
}

// ============================================
// APP MAPPING TYPES
// ============================================

export interface AppMapping {
  appName: string;
  keywords: string[];
  streamId?: string;
  autoCreateStream: boolean;
}

export const DEFAULT_APP_MAPPINGS: AppMapping[] = [
  { appName: 'sorto-crm', keywords: ['sorto', 'crm', 'gtd', 'smart goal'], autoCreateStream: true },
  { appName: 'contentdna', keywords: ['contentdna', 'youtube intelligence'], autoCreateStream: true },
  { appName: 'focusphoto', keywords: ['focusphoto', 'focus-photo', 'photographer'], autoCreateStream: true },
  { appName: 'retronova', keywords: ['retronova', 'restauracja zdjec', 'photo restoration'], autoCreateStream: true },
  { appName: 'jaros', keywords: ['jaros', 'thermomix', 'batch cooking', 'kitchen os'], autoCreateStream: true },
  { appName: 'picar', keywords: ['picar', 'nawigacja', 'vehicle', 'navigation'], autoCreateStream: true },
  { appName: 'manekin', keywords: ['manekin', 'kolorystyka', 'color analysis'], autoCreateStream: true },
  { appName: 'astro', keywords: ['astro', 'numerologia', 'astrologia'], autoCreateStream: true },
  { appName: 'ebyt', keywords: ['ebyt', 'educational', 'content marketplace'], autoCreateStream: true },
  { appName: 'exposcan', keywords: ['exposcan', 'business card', 'scanner'], autoCreateStream: true },
  { appName: 'wordloomer', keywords: ['wordloomer', 'writing', 'authors'], autoCreateStream: true },
  { appName: 'rag-service', keywords: ['rag', 'retrieval', 'augmented generation'], autoCreateStream: true },
  { appName: 'general', keywords: [], autoCreateStream: true }, // Default fallback
];
