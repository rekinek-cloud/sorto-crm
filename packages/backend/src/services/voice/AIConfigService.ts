/**
 * 🔧 AI Configuration Service for Voice AI
 * Manages AI provider configurations and credentials from database
 */

import { PrismaClient } from '@prisma/client';
// import { OpenAIProvider } from '../ai/providers/OpenAIProvider';
// import { AnthropicProvider } from '../ai/providers/AnthropicProvider';
import { OpenAI } from 'openai';

export interface VoiceAIConfig {
  openai?: {
    apiKey: string;
    model: string;
    embeddingModel: string;
  };
  anthropic?: {
    apiKey: string;
    model: string;
  };
  defaultProvider: 'openai' | 'anthropic';
}

/**
 * Service to get AI configuration from database for Voice AI
 */
export class AIConfigService {
  private prisma: PrismaClient;
  private configCache: Map<string, VoiceAIConfig> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    console.log('🔧 AIConfigService initialized');
  }

  /**
   * Get AI configuration for organization
   */
  async getAIConfig(organizationId: string): Promise<VoiceAIConfig> {
    const cacheKey = organizationId;
    
    // Check cache first
    if (this.configCache.has(cacheKey)) {
      const cacheTime = this.cacheExpiry.get(cacheKey) || 0;
      if (Date.now() < cacheTime) {
        console.log(`📋 Using cached AI config for org: ${organizationId}`);
        return this.configCache.get(cacheKey)!;
      }
    }

    console.log(`🔍 Loading AI config from database for org: ${organizationId}`);

    try {
      // Get active AI providers for organization
      const providers = await this.prisma.ai_providers.findMany({
        where: {
          organizationId,
          status: 'ACTIVE'
        },
        include: {
          ai_models: {
            where: { status: 'ACTIVE' }
          }
        },
        orderBy: { priority: 'asc' }
      });

      if (providers.length === 0) {
        console.warn(`⚠️ No active AI providers found for org: ${organizationId}`);
        throw new Error('No active AI providers configured');
      }

      const config: VoiceAIConfig = {
        defaultProvider: 'openai' // Default fallback
      };

      // Process each provider
      for (const provider of providers) {
        const configData = provider.config as any;

        if (provider.name.toLowerCase() === 'openai' && configData?.apiKey) {
          const openaiModel = provider.ai_models.find((m: any) =>
            m.name.includes('gpt-4') || m.name.includes('gpt-3.5')
          );

          config.openai = {
            apiKey: configData.apiKey,
            model: openaiModel?.name || 'gpt-4-turbo-preview',
            embeddingModel: 'text-embedding-3-small'
          };

          config.defaultProvider = 'openai';
          console.log(`✅ OpenAI provider configured with model: ${config.openai.model}`);
        }

        if (provider.name.toLowerCase() === 'anthropic' && configData?.apiKey) {
          const anthropicModel = provider.ai_models.find((m: any) =>
            m.name.includes('claude')
          );
          
          config.anthropic = {
            apiKey: configData.apiKey,
            model: anthropicModel?.name || 'claude-3-sonnet-20240229'
          };
          
          // If no OpenAI, use Anthropic as default
          if (!config.openai) {
            config.defaultProvider = 'anthropic';
          }
          
          console.log(`✅ Anthropic provider configured with model: ${config.anthropic.model}`);
        }
      }

      // Validate that we have at least one provider
      if (!config.openai && !config.anthropic) {
        throw new Error('No valid AI providers with credentials found');
      }

      // Cache the configuration
      this.configCache.set(cacheKey, config);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      console.log(`🎯 AI config loaded successfully for org: ${organizationId}`);
      return config;

    } catch (error) {
      console.error('Failed to load AI config:', error);
      
      // Fallback to environment variables if database config fails
      return this.getFallbackConfig();
    }
  }

  /**
   * Get OpenAI client instance
   */
  async getOpenAIClient(organizationId: string): Promise<OpenAI> {
    const config = await this.getAIConfig(organizationId);
    
    if (!config.openai) {
      throw new Error('OpenAI not configured for this organization');
    }

    return new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Get OpenAI configuration
   */
  async getOpenAIConfig(organizationId: string): Promise<{
    apiKey: string;
    model: string;
    embeddingModel: string;
  }> {
    const config = await this.getAIConfig(organizationId);
    
    if (!config.openai) {
      throw new Error('OpenAI not configured for this organization');
    }

    return config.openai;
  }

  /**
   * Validate AI provider configuration
   */
  async validateConfig(organizationId: string): Promise<{
    isValid: boolean;
    providers: string[];
    errors: string[];
  }> {
    const result = {
      isValid: false,
      providers: [] as string[],
      errors: [] as string[]
    };

    try {
      const config = await this.getAIConfig(organizationId);
      
      // Test OpenAI if configured
      if (config.openai) {
        try {
          const client = new OpenAI({ apiKey: config.openai.apiKey });
          
          // Test with a simple request
          await client.models.list();
          result.providers.push('OpenAI');
          console.log('✅ OpenAI configuration validated');
        } catch (error) {
          result.errors.push(`OpenAI validation failed: ${error}`);
          console.error('❌ OpenAI validation failed:', error);
        }
      }

      // Test Anthropic if configured (similar implementation)
      if (config.anthropic) {
        result.providers.push('Anthropic (not tested)');
      }

      result.isValid = result.providers.length > 0 && result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Configuration loading failed: ${error}`);
    }

    return result;
  }

  /**
   * Clear configuration cache
   */
  clearCache(organizationId?: string): void {
    if (organizationId) {
      this.configCache.delete(organizationId);
      this.cacheExpiry.delete(organizationId);
      console.log(`🗑️ Cleared AI config cache for org: ${organizationId}`);
    } else {
      this.configCache.clear();
      this.cacheExpiry.clear();
      console.log('🗑️ Cleared all AI config cache');
    }
  }

  /**
   * Fallback configuration from environment variables
   */
  private getFallbackConfig(): VoiceAIConfig {
    console.log('⚠️ Using fallback AI configuration from environment');
    
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      throw new Error('No AI configuration found in database or environment');
    }

    return {
      openai: {
        apiKey: openaiKey,
        model: 'gpt-4-turbo-preview',
        embeddingModel: 'text-embedding-3-small'
      },
      defaultProvider: 'openai'
    };
  }

  /**
   * Get available models for organization
   */
  async getAvailableModels(organizationId: string): Promise<{
    provider: string;
    models: string[];
  }[]> {
    const providers = await this.prisma.ai_providers.findMany({
      where: {
        organizationId,
        status: 'ACTIVE'
      },
      include: {
        ai_models: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    return providers.map(provider => ({
      provider: provider.name,
      models: provider.ai_models.map((model: any) => model.name)
    }));
  }

  /**
   * Update provider usage statistics
   */
  async updateUsageStats(
    organizationId: string,
    provider: string,
    model: string,
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      cost?: number;
    }
  ): Promise<void> {
    try {
      // Note: Usage statistics tracking is simplified for now
      console.log(`📊 Usage tracking - ${provider}/${model}: ${usage.totalTokens} tokens`);

    } catch (error) {
      console.error('Failed to update usage stats:', error);
      // Don't throw - usage tracking shouldn't break the main flow
    }
  }
}

// Singleton instance
let aiConfigService: AIConfigService | null = null;

export function getAIConfigService(prisma: PrismaClient): AIConfigService {
  if (!aiConfigService) {
    aiConfigService = new AIConfigService(prisma);
  }
  return aiConfigService;
}
