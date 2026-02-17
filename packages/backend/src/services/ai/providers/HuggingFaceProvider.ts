import {
  BaseAIProvider,
  AIProviderConfig,
  AIProviderLimits,
  AIRequest,
  AIResponse,
  AIProviderStatus
} from './BaseProvider';

interface HuggingFaceRequest {
  inputs: string;
  parameters?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    do_sample?: boolean;
    return_full_text?: boolean;
  };
}

interface HuggingFaceResponse {
  generated_text: string;
}

export class HuggingFaceProvider extends BaseAIProvider {
  private static readonly DEFAULT_MODELS = [
    'microsoft/DialoGPT-large',
    'facebook/blenderbot-400M-distill',
    'microsoft/DialoGPT-medium',
    'google/flan-t5-large',
    'meta-llama/Llama-2-7b-chat-hf',
    'mistralai/Mistral-7B-Instruct-v0.1'
  ];

  constructor(config: AIProviderConfig, limits: AIProviderLimits = {}) {
    super('HuggingFace', config, limits);
  }

  getDefaultBaseUrl(): string {
    return 'https://api-inference.huggingface.co';
  }

  isConfigValid(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.startsWith('hf_'));
  }

  async checkStatus(): Promise<AIProviderStatus> {
    const startTime = Date.now();
    
    try {
      // Test with a simple model
      const response = await fetch(`${this.baseUrl}/models/microsoft/DialoGPT-medium`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: 'Hello',
          parameters: { max_new_tokens: 1 }
        }),
        signal: AbortSignal.timeout(this.config.timeout || 10000)
      });

      const latency = Date.now() - startTime;

      if (response.ok || response.status === 503) { // 503 is common when model is loading
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
          errorMessage: `HTTP ${response.status}: ${errorData.error || response.statusText}`,
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
      // Convert messages to a single prompt string
      const prompt = this.messagesToPrompt(request.messages);

      const requestBody: HuggingFaceRequest = {
        inputs: prompt,
        parameters: {
          max_new_tokens: request.config?.maxTokens || 500,
          temperature: request.config?.temperature ?? 0.7,
          top_p: request.config?.topP ?? 1,
          do_sample: true,
          return_full_text: false
        }
      };

      const response = await fetch(`${this.baseUrl}/models/${request.model}`, {
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
        
        // Handle model loading case
        if (response.status === 503 && errorData.estimated_time) {
          throw new Error(`Model is loading, estimated time: ${errorData.estimated_time}s`);
        }
        
        throw new Error(`HuggingFace API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data: HuggingFaceResponse[] = await response.json();
      const executionTime = Date.now() - startTime;

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No completion returned from HuggingFace');
      }

      const content = data[0].generated_text;
      
      // Estimate token usage (rough approximation)
      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(content.length / 4);

      return {
        id: `hf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        model: request.model,
        content,
        finishReason: 'stop', // HuggingFace doesn't provide finish reason
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        },
        cost: 0, // HuggingFace Inference API is free (with rate limits)
        executionTime
      };

    } catch (error) {
      throw new Error(`HuggingFace completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // HuggingFace has thousands of models, return a curated list of popular chat models
      return HuggingFaceProvider.DEFAULT_MODELS;
    } catch (error) {
      console.error('Failed to fetch HuggingFace models:', error);
      return HuggingFaceProvider.DEFAULT_MODELS;
    }
  }

  async estimateCost(request: AIRequest): Promise<number> {
    // HuggingFace Inference API is free (with rate limits)
    return 0;
  }

  private messagesToPrompt(messages: any[]): string {
    // Convert OpenAI-style messages to a single prompt
    const parts: string[] = [];
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          parts.push(`System: ${message.content}`);
          break;
        case 'user':
          parts.push(`Human: ${message.content}`);
          break;
        case 'assistant':
          parts.push(`Assistant: ${message.content}`);
          break;
      }
    }
    
    // Add prompt for assistant response
    parts.push('Assistant:');
    
    return parts.join('\n\n');
  }
}
