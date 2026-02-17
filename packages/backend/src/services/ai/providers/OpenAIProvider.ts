import {
  BaseAIProvider,
  AIProviderConfig,
  AIProviderLimits,
  AIRequest,
  AIResponse,
  AIProviderStatus
} from './BaseProvider';

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIChoice {
  index: number;
  message: {
    role: string;
    content: string;
    function_call?: {
      name: string;
      arguments: string;
    };
  };
  finish_reason: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

export class OpenAIProvider extends BaseAIProvider {
  private static readonly PRICING = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 }
  };

  constructor(config: AIProviderConfig, limits: AIProviderLimits = {}) {
    super('OpenAI', config, limits);
  }

  getDefaultBaseUrl(): string {
    return 'https://api.openai.com/v1';
  }

  isConfigValid(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.startsWith('sk-'));
  }

  async checkStatus(): Promise<AIProviderStatus> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
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
        return {
          isAvailable: false,
          lastChecked: new Date(),
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
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
      // Check if model supports JSON mode
      const supportsJsonMode = request.model.includes('turbo') ||
                               request.model.includes('gpt-4o') ||
                               request.model.includes('1106') ||
                               request.model.includes('0125');

      const requestBody: any = {
        model: request.model,
        messages: request.messages,
        temperature: request.config?.temperature ?? 0.7,
        max_tokens: request.config?.maxTokens,
        top_p: request.config?.topP ?? 1,
        frequency_penalty: request.config?.frequencyPenalty ?? 0,
        presence_penalty: request.config?.presencePenalty ?? 0,
        stream: false, // We'll handle streaming separately
        functions: request.functions
      };

      // Add response_format for JSON mode if supported and requested
      if (supportsJsonMode && request.config?.responseFormat === 'json') {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 60000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      const executionTime = Date.now() - startTime;

      const choice = data.choices[0];
      if (!choice) {
        throw new Error('No completion choices returned from OpenAI');
      }

      // Calculate cost
      const cost = this.calculateCost(request.model, data.usage);

      return {
        id: data.id,
        model: data.model,
        content: choice.message.content,
        finishReason: choice.finish_reason as any,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        functionCall: choice.message.function_call ? {
          name: choice.message.function_call.name,
          arguments: choice.message.function_call.arguments
        } : undefined,
        cost,
        executionTime
      };

    } catch (error) {
      throw new Error(`OpenAI completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => model.id)
        .sort();
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']; // Fallback list
    }
  }

  async estimateCost(request: AIRequest): Promise<number> {
    // Rough estimation based on prompt length
    const promptText = request.messages.map(m => m.content).join(' ');
    const estimatedPromptTokens = Math.ceil(promptText.length / 4); // Rough estimate: 4 chars per token
    const estimatedCompletionTokens = request.config?.maxTokens || 500;

    return this.calculateCost(request.model, {
      prompt_tokens: estimatedPromptTokens,
      completion_tokens: estimatedCompletionTokens,
      total_tokens: estimatedPromptTokens + estimatedCompletionTokens
    });
  }

  private calculateCost(model: string, usage: OpenAIUsage): number {
    const pricing = OpenAIProvider.PRICING[model as keyof typeof OpenAIProvider.PRICING];
    
    if (!pricing) {
      // Default to GPT-4 pricing if model not found
      const defaultPricing = OpenAIProvider.PRICING['gpt-4'];
      return (usage.prompt_tokens / 1000 * defaultPricing.input) + 
             (usage.completion_tokens / 1000 * defaultPricing.output);
    }

    return (usage.prompt_tokens / 1000 * pricing.input) + 
           (usage.completion_tokens / 1000 * pricing.output);
  }
}
