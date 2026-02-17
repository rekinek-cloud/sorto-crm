import axios, { AxiosInstance } from 'axios';
import { BaseAIProvider, AIRequest, AIResponse, AIProviderConfig, AIProviderStatus } from './BaseProvider';

interface DeepSeekConfig extends AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface DeepSeekAPIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

interface DeepSeekAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekProvider extends BaseAIProvider {
  private client: AxiosInstance;
  protected override config: DeepSeekConfig;
  private defaultModel: string;

  constructor(config: DeepSeekConfig, limits?: any) {
    super('DeepSeek', config, limits);
    this.config = config;
    this.defaultModel = config.model || 'deepseek-chat';

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.deepseek.com/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 30000,
    });
  }

  getDefaultBaseUrl(): string {
    return 'https://api.deepseek.com/v1';
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Prepare DeepSeek API request
      const deepseekRequest: DeepSeekAPIRequest = {
        model: request.model || this.defaultModel,
        messages: request.messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: request.config?.temperature ?? 0.7,
        max_tokens: request.config?.maxTokens ?? 4000,
        top_p: request.config?.topP ?? 1.0,
        frequency_penalty: request.config?.frequencyPenalty ?? 0,
        presence_penalty: request.config?.presencePenalty ?? 0,
        stream: false
      };

      console.log('🤖 DeepSeek Request:', {
        model: deepseekRequest.model,
        messageCount: deepseekRequest.messages.length,
        temperature: deepseekRequest.temperature
      });

      const response = await this.client.post<DeepSeekAPIResponse>('/chat/completions', deepseekRequest);
      const executionTime = Date.now() - startTime;

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('No choices returned from DeepSeek API');
      }

      const choice = response.data.choices[0];
      const usage = response.data.usage;

      // Calculate approximate cost (DeepSeek pricing)
      const inputCostPer1k = 0.14 / 1000; // $0.14 per 1K input tokens
      const outputCostPer1k = 0.28 / 1000; // $0.28 per 1K output tokens
      const cost = (usage.prompt_tokens * inputCostPer1k) + (usage.completion_tokens * outputCostPer1k);

      console.log('✅ DeepSeek Response:', {
        model: response.data.model,
        tokens: usage.total_tokens,
        cost: `$${cost.toFixed(4)}`,
        time: `${executionTime}ms`
      });

      return {
        id: response.data.id,
        model: response.data.model,
        content: choice.message.content,
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        executionTime,
        cost
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        
        console.error('❌ DeepSeek API Error:', {
          status,
          message,
          time: `${executionTime}ms`
        });

        throw new Error(`DeepSeek API Error (${status}): ${message}`);
      }

      console.error('❌ DeepSeek Unexpected Error:', error);
      throw new Error(`DeepSeek Provider Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      // Simple test request to validate API key and connection
      const testRequest: DeepSeekAPIRequest = {
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      };

      await this.client.post('/chat/completions', testRequest);
      return true;
    } catch (error) {
      console.error('DeepSeek connection validation failed:', error);
      return false;
    }
  }

  isConfigValid(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.length > 0);
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-reasoner'
    ];
  }

  async checkStatus(): Promise<AIProviderStatus> {
    const startTime = Date.now();
    try {
      await this.validateConnection();
      return { isAvailable: true, lastChecked: new Date(), latency: Date.now() - startTime };
    } catch (error) {
      return { isAvailable: false, lastChecked: new Date(), errorMessage: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async estimateCost(request: AIRequest): Promise<number> {
    // Rough estimation based on content length
    const totalContent = request.messages.map(m => m.content).join(' ');
    const estimatedTokens = Math.ceil(totalContent.length / 4); // Rough tokens estimation
    
    const inputCostPer1k = 0.14 / 1000; // $0.14 per 1K input tokens
    const outputCostPer1k = 0.28 / 1000; // $0.28 per 1K output tokens
    
    const estimatedInputCost = estimatedTokens * inputCostPer1k;
    const estimatedOutputCost = (request.config?.maxTokens || 1000) * outputCostPer1k;
    
    return estimatedInputCost + estimatedOutputCost;
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'function_call' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'function_call':
        return 'function_call';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  // Provider-specific methods
  async getModels(): Promise<Array<{ id: string; name: string; description: string }>> {
    return [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: 'General purpose conversational AI model'
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder', 
        description: 'Specialized model for code generation and analysis'
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        description: 'Advanced reasoning and problem-solving model'
      }
    ];
  }

  override getProviderInfo() {
    return {
      name: 'DeepSeek' as const,
      baseUrl: this.baseUrl,
      isConfigured: this.isConfigValid(),
      limits: this.limits
    };
  }
}
