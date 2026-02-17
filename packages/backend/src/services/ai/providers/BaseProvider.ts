/**
 * Base AI Provider Interface
 * All AI providers must implement this interface for consistency
 */

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  [key: string]: any;
}

export interface AIModelConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  [key: string]: any;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export interface AIRequest {
  model: string;
  messages: AIMessage[];
  config?: AIModelConfig;
  stream?: boolean;
  functions?: any[];
}

export interface AIResponse {
  id: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  functionCall?: {
    name: string;
    arguments: string;
  };
  cost?: number;
  executionTime: number;
}

export interface AIProviderLimits {
  requestsPerMinute?: number;
  requestsPerDay?: number;
  tokensPerDay?: number;
  costPerDay?: number;
}

export interface AIProviderStatus {
  isAvailable: boolean;
  lastChecked: Date;
  errorMessage?: string;
  latency?: number;
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig;
  protected limits: AIProviderLimits;
  protected name: string;
  protected baseUrl: string;

  constructor(name: string, config: AIProviderConfig, limits: AIProviderLimits = {}) {
    this.name = name;
    this.config = config;
    this.limits = limits;
    this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
  }

  abstract getDefaultBaseUrl(): string;
  abstract isConfigValid(): boolean;
  abstract checkStatus(): Promise<AIProviderStatus>;
  abstract generateCompletion(request: AIRequest): Promise<AIResponse>;
  abstract getAvailableModels(): Promise<string[]>;
  abstract estimateCost(request: AIRequest): Promise<number>;

  // Rate limiting check
  async checkRateLimit(usage: any): Promise<boolean> {
    // Implement rate limiting logic based on this.limits
    // This should check current usage against limits
    return true; // Placeholder
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const status = await this.checkStatus();
      return status.isAvailable;
    } catch (error) {
      return false;
    }
  }

  // Get provider information
  getProviderInfo() {
    return {
      name: this.name,
      baseUrl: this.baseUrl,
      isConfigured: this.isConfigValid(),
      limits: this.limits
    };
  }
}
