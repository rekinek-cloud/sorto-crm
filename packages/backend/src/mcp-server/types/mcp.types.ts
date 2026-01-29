/**
 * MCP Server Types
 * Typy dla protokołu MCP (Model Context Protocol)
 */

import { Request } from 'express';
import { Organization, User } from '@prisma/client';

// === MCP Protocol Types ===

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, McpPropertySchema>;
    required?: string[];
  };
}

export interface McpPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  default?: any;
  items?: McpPropertySchema;
}

export interface McpToolCallRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface McpToolCallResponse {
  content: McpContent[];
  isError?: boolean;
}

export interface McpContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface McpToolsListResponse {
  tools: McpTool[];
}

// === Request with Tenant ===

export interface McpRequestContext {
  organization: Organization;
  apiKeyId: string;
}

export interface McpRequest extends Request {
  mcpContext: McpRequestContext;
}

// === Tool Execution ===

export interface ToolExecutionResult {
  success: boolean;
  data?: string;
  error?: string;
}

// === Search Tool Types ===

export type SearchEntityType = 'company' | 'contact' | 'deal' | 'task' | 'stream' | 'mixed';

export interface SearchFilters {
  name?: string;
  industry?: string;
  city?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  value?: {
    min?: number;
    max?: number;
  };
}

export interface SearchInterpretation {
  searchType: SearchEntityType;
  filters: SearchFilters;
  limit: number;
}

// === Details Tool Types ===

export type DetailsEntityType = 'company' | 'contact' | 'deal' | 'task' | 'stream';

// === Tasks Tool Types ===

export type TaskFilterType = 'today' | 'overdue' | 'this_week' | 'all';

// === Notes Tool Types ===

export type NoteTargetType = 'company' | 'contact' | 'deal';

// === Pipeline Stats Types ===

export interface PipelineStats {
  newLeads: number;
  inProgress: number;
  offersSent: number;
  negotiations: number;
  closed: number;
  totalValue: number;
  forecastThisMonth: number;
  conversionRate: number;
}

// === API Key Types ===

export interface ApiKeyCreateResult {
  key: string;
  keyPrefix: string;
  id: string;
}

export interface ApiKeyInfo {
  id: string;
  keyPrefix: string;
  name: string | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}
