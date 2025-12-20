import {
  BaseAIProvider,
  AIProviderConfig,
  AIProviderLimits,
  AIRequest,
  AIResponse,
  AIProviderStatus,
  AIMessage
} from './BaseProvider';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
}

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence?: string;
  usage: AnthropicUsage;
}

export class AnthropicProvider extends BaseAIProvider {
  private static readonly PRICING = {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
  };

  constructor(config: AIProviderConfig, limits: AIProviderLimits = {}) {
    super('Anthropic', config, limits);
  }

  getDefaultBaseUrl(): string {
    return 'https://api.anthropic.com/v1';
  }

  isConfigValid(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.startsWith('sk-ant-'));
  }

  async checkStatus(): Promise<AIProviderStatus> {
    const startTime = Date.now();
    
    try {
      // Anthropic doesn't have a dedicated health endpoint, so we'll make a minimal request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }]
        }),
        signal: AbortSignal.timeout(this.config.timeout || 10000)
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          isAvailable: true,
          lastChecked: new Date(),
          latency
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          isAvailable: false,
          lastChecked: new Date(),
          errorMessage: `HTTP ${response.status}: ${errorData.error?.message || response.statusText}`,
          latency
        };
      }
    } catch (error) {
      return {
        isAvailable: false,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime
      };
    }
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Transform messages to Anthropic format
      const { messages, system } = this.transformMessages(request.messages);

      const requestBody: AnthropicRequest = {
        model: request.model,
        max_tokens: request.config?.maxTokens || 4000,
        messages,
        temperature: request.config?.temperature ?? 0.7,
        top_p: request.config?.topP ?? 1
      };

      if (system) {
        requestBody.system = system;
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 60000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: AnthropicResponse = await response.json();
      const executionTime = Date.now() - startTime;

      // Calculate cost
      const cost = this.calculateCost(request.model, data.usage);

      return {
        id: data.id,
        model: data.model,
        content: data.content[0]?.text || '',
        finishReason: this.mapStopReason(data.stop_reason),
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        },
        cost,
        executionTime
      };

    } catch (error) {
      throw new Error(`Anthropic completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // Anthropic doesn't have a models endpoint, return known models
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-sonnet-20240229',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  async estimateCost(request: AIRequest): Promise<number> {
    // Rough estimation based on prompt length
    const promptText = request.messages.map(m => m.content).join(' ');
    const estimatedPromptTokens = Math.ceil(promptText.length / 4); // Rough estimate: 4 chars per token
    const estimatedCompletionTokens = request.config?.maxTokens || 500;

    return this.calculateCost(request.model, {
      input_tokens: estimatedPromptTokens,
      output_tokens: estimatedCompletionTokens
    });
  }

  private transformMessages(messages: AIMessage[]): { messages: AnthropicMessage[], system?: string } {
    let system: string | undefined;
    const anthropicMessages: AnthropicMessage[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        system = message.content;
      } else if (message.role === 'user' || message.role === 'assistant') {
        anthropicMessages.push({
          role: message.role,
          content: message.content
        });
      }
      // Skip function messages as Claude doesn't support them in the same way
    }

    return { messages: anthropicMessages, system };
  }

  private mapStopReason(stopReason: string): 'stop' | 'length' | 'function_call' | 'content_filter' {
    switch (stopReason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }

  private calculateCost(model: string, usage: AnthropicUsage): number {
    const pricing = AnthropicProvider.PRICING[model as keyof typeof AnthropicProvider.PRICING];
    
    if (!pricing) {
      // Default to Claude-3 Sonnet pricing if model not found
      const defaultPricing = AnthropicProvider.PRICING['claude-3-sonnet-20240229'];
      return (usage.input_tokens / 1000 * defaultPricing.input) + 
             (usage.output_tokens / 1000 * defaultPricing.output);
    }

    return (usage.input_tokens / 1000 * pricing.input) + 
           (usage.output_tokens / 1000 * pricing.output);
  }
}