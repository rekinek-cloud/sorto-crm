import axios, { AxiosInstance } from 'axios';
import { BaseAIProvider, AIRequest, AIResponse, AIProviderConfig } from './BaseProvider';

interface QwenConfig extends AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface QwenAPIRequest {
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

interface QwenAPIResponse {
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

export class QwenProvider extends BaseAIProvider {
  private client: AxiosInstance;
  private qwenConfig: QwenConfig;
  private defaultModel: string;

  constructor(config: QwenConfig, limits?: any) {
    super('Qwen', config, limits);
    this.qwenConfig = config;
    this.defaultModel = config.model || 'qwen-max-2025-01-25';

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 60000,
    });
  }

  getDefaultBaseUrl(): string {
    return 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const qwenRequest: QwenAPIRequest = {
        model: request.model || this.defaultModel,
        messages: request.messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: request.config?.temperature ?? 0.3,
        max_tokens: request.config?.maxTokens ?? 4000,
        top_p: request.config?.topP ?? 1.0,
        frequency_penalty: request.config?.frequencyPenalty ?? 0,
        presence_penalty: request.config?.presencePenalty ?? 0,
        stream: false
      };

      console.log('🤖 Qwen Request:', {
        model: qwenRequest.model,
        messageCount: qwenRequest.messages.length,
        temperature: qwenRequest.temperature
      });

      const response = await this.client.post<QwenAPIResponse>('/chat/completions', qwenRequest);
      const executionTime = Date.now() - startTime;

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('No choices returned from Qwen API');
      }

      const choice = response.data.choices[0];
      const usage = response.data.usage;

      // Qwen pricing (approximate, per 1K tokens)
      // qwen-max: ~$0.004 input, $0.012 output
      // qwen-plus: ~$0.002 input, $0.006 output
      // qwen-turbo: ~$0.0005 input, $0.002 output
      const model = qwenRequest.model;
      let inputCostPer1k = 0.004 / 1000;
      let outputCostPer1k = 0.012 / 1000;
      if (model.includes('plus')) {
        inputCostPer1k = 0.002 / 1000;
        outputCostPer1k = 0.006 / 1000;
      } else if (model.includes('turbo')) {
        inputCostPer1k = 0.0005 / 1000;
        outputCostPer1k = 0.002 / 1000;
      }
      const cost = (usage.prompt_tokens * inputCostPer1k) + (usage.completion_tokens * outputCostPer1k);

      console.log('✅ Qwen Response:', {
        model: response.data.model,
        tokens: usage.total_tokens,
        cost: `$${cost.toFixed(6)}`,
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
        cost,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;

        console.error('❌ Qwen API Error:', {
          status,
          message,
          time: `${executionTime}ms`
        });

        throw new Error(`Qwen API Error (${status}): ${message}`);
      }

      console.error('❌ Qwen Unexpected Error:', error);
      throw new Error(`Qwen Provider Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const testRequest: QwenAPIRequest = {
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      };

      await this.client.post('/chat/completions', testRequest);
      return true;
    } catch (error) {
      console.error('Qwen connection validation failed:', error);
      return false;
    }
  }

  isConfigValid(): boolean {
    return !!(this.qwenConfig.apiKey && this.qwenConfig.apiKey.length > 0);
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      'qwen-max-2025-01-25',
      'qwen-plus',
      'qwen-turbo',
      'qwen-long',
    ];
  }

  async checkStatus(): Promise<any> {
    try {
      await this.validateConnection();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async estimateCost(request: AIRequest): Promise<number> {
    const totalContent = request.messages.map(m => m.content).join(' ');
    const estimatedTokens = Math.ceil(totalContent.length / 4);

    const inputCostPer1k = 0.004 / 1000;
    const outputCostPer1k = 0.012 / 1000;

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
}
