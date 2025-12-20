import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAIProviders() {
  console.log('🤖 Seeding AI Providers and Models...');

  // Get organization ID (assuming first organization exists)
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('❌ No organization found. Please run basic seed first.');
    return;
  }

  const orgId = org.id;

  // 1. OpenAI Provider
  const openaiProvider = await prisma.aIProvider.upsert({
    where: {
      organizationId_name: {
        organizationId: orgId,
        name: 'OpenAI'
      }
    },
    update: {},
    create: {
      name: 'OpenAI',
      displayName: 'OpenAI GPT Models',
      baseUrl: 'https://api.openai.com/v1',
      status: 'ACTIVE',
      priority: 1,
      config: {
        apiKey: '', // User will fill this
        timeout: 30000,
        maxRetries: 3,
        organization: '',
        headers: {
          'User-Agent': 'CRM-GTD-Smart/1.0'
        }
      },
      limits: {
        requestsPerMinute: 60,
        tokensPerDay: 100000,
        maxConcurrent: 5
      },
      organizationId: orgId
    }
  });

  // 2. Claude Provider (Anthropic)
  const claudeProvider = await prisma.aIProvider.upsert({
    where: {
      organizationId_name: {
        organizationId: orgId,
        name: 'Claude'
      }
    },
    update: {},
    create: {
      name: 'Claude',
      displayName: 'Anthropic Claude Models',
      baseUrl: 'https://api.anthropic.com/v1',
      status: 'ACTIVE',
      priority: 2,
      config: {
        apiKey: '', // User will fill this
        timeout: 45000,
        maxRetries: 3,
        anthropicVersion: '2023-06-01',
        headers: {
          'User-Agent': 'CRM-GTD-Smart/1.0'
        }
      },
      limits: {
        requestsPerMinute: 50,
        tokensPerDay: 80000,
        maxConcurrent: 3
      },
      organizationId: orgId
    }
  });

  // 3. DeepSeek Provider
  const deepseekProvider = await prisma.aIProvider.upsert({
    where: {
      organizationId_name: {
        organizationId: orgId,
        name: 'DeepSeek'
      }
    },
    update: {},
    create: {
      name: 'DeepSeek',
      displayName: 'DeepSeek AI Models',
      baseUrl: 'https://api.deepseek.com/v1',
      status: 'ACTIVE',
      priority: 3,
      config: {
        apiKey: '', // User will fill this
        timeout: 30000,
        maxRetries: 3,
        headers: {
          'User-Agent': 'CRM-GTD-Smart/1.0'
        }
      },
      limits: {
        requestsPerMinute: 40,
        tokensPerDay: 60000,
        maxConcurrent: 2
      },
      organizationId: orgId
    }
  });

  // 4. Google (Gemini) Provider
  const googleProvider = await prisma.aIProvider.upsert({
    where: {
      organizationId_name: {
        organizationId: orgId,
        name: 'Google'
      }
    },
    update: {},
    create: {
      name: 'Google',
      displayName: 'Google Gemini Models',
      baseUrl: 'https://generativelanguage.googleapis.com/v1',
      status: 'ACTIVE',
      priority: 4,
      config: {
        apiKey: '', // User will fill this
        timeout: 45000,
        maxRetries: 3,
        headers: {
          'User-Agent': 'CRM-GTD-Smart/1.0'
        }
      },
      limits: {
        requestsPerMinute: 60,
        tokensPerDay: 100000,
        maxConcurrent: 5
      },
      organizationId: orgId
    }
  });

  console.log('✅ AI Providers created successfully');

  // OpenAI Models (aktualizacja grudzien 2025)
  const openaiModels = [
    {
      name: 'gpt-4o',
      displayName: 'GPT-4o (flagship)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 128000,
      inputCost: 0.0025,
      outputCost: 0.01,
      capabilities: ['text', 'vision', 'function_calling', 'json_mode', 'audio'],
      providerId: openaiProvider.id
    },
    {
      name: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini (szybki, tani)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 128000,
      inputCost: 0.00015,
      outputCost: 0.0006,
      capabilities: ['text', 'vision', 'function_calling', 'json_mode'],
      providerId: openaiProvider.id
    },
    {
      name: 'o1',
      displayName: 'o1 (reasoning)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 200000,
      inputCost: 0.015,
      outputCost: 0.06,
      capabilities: ['text', 'reasoning', 'function_calling'],
      providerId: openaiProvider.id
    },
    {
      name: 'o1-mini',
      displayName: 'o1-mini (reasoning, tani)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 128000,
      inputCost: 0.003,
      outputCost: 0.012,
      capabilities: ['text', 'reasoning'],
      providerId: openaiProvider.id
    },
    {
      name: 'gpt-4-turbo',
      displayName: 'GPT-4 Turbo',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 128000,
      inputCost: 0.01,
      outputCost: 0.03,
      capabilities: ['text', 'vision', 'function_calling', 'json_mode'],
      providerId: openaiProvider.id
    }
  ];

  // Claude Models (aktualizacja grudzien 2025)
  const claudeModels = [
    {
      name: 'claude-sonnet-4-20250514',
      displayName: 'Claude 4 Sonnet (najnowszy)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 200000,
      inputCost: 0.003,
      outputCost: 0.015,
      capabilities: ['text', 'vision', 'function_calling', 'artifacts', 'computer_use'],
      providerId: claudeProvider.id
    },
    {
      name: 'claude-opus-4-20250514',
      displayName: 'Claude 4 Opus (premium)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 200000,
      inputCost: 0.015,
      outputCost: 0.075,
      capabilities: ['text', 'vision', 'function_calling', 'artifacts', 'computer_use'],
      providerId: claudeProvider.id
    },
    {
      name: 'claude-3-5-sonnet-20241022',
      displayName: 'Claude 3.5 Sonnet',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 200000,
      inputCost: 0.003,
      outputCost: 0.015,
      capabilities: ['text', 'vision', 'function_calling', 'artifacts'],
      providerId: claudeProvider.id
    },
    {
      name: 'claude-3-5-haiku-20241022',
      displayName: 'Claude 3.5 Haiku (szybki)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 200000,
      inputCost: 0.0008,
      outputCost: 0.004,
      capabilities: ['text', 'vision', 'function_calling'],
      providerId: claudeProvider.id
    }
  ];

  // DeepSeek Models (aktualizacja grudzien 2025)
  const deepseekModels = [
    {
      name: 'deepseek-chat',
      displayName: 'DeepSeek V3 (chat)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 64000,
      inputCost: 0.00014,
      outputCost: 0.00028,
      capabilities: ['text', 'function_calling', 'json_mode'],
      providerId: deepseekProvider.id
    },
    {
      name: 'deepseek-reasoner',
      displayName: 'DeepSeek R1 (reasoning)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 64000,
      inputCost: 0.00055,
      outputCost: 0.00219,
      capabilities: ['text', 'reasoning', 'function_calling'],
      providerId: deepseekProvider.id
    }
  ];

  // Google Gemini Models (aktualizacja grudzien 2025)
  const geminiModels = [
    {
      name: 'gemini-2.0-flash-exp',
      displayName: 'Gemini 2.0 Flash (najnowszy)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 1000000,
      inputCost: 0.0,
      outputCost: 0.0,
      capabilities: ['text', 'vision', 'function_calling', 'audio', 'video'],
      providerId: googleProvider.id
    },
    {
      name: 'gemini-1.5-pro',
      displayName: 'Gemini 1.5 Pro',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 2000000,
      inputCost: 0.00125,
      outputCost: 0.005,
      capabilities: ['text', 'vision', 'function_calling', 'audio', 'video'],
      providerId: googleProvider.id
    },
    {
      name: 'gemini-1.5-flash',
      displayName: 'Gemini 1.5 Flash (szybki)',
      type: 'TEXT_GENERATION' as const,
      maxTokens: 1000000,
      inputCost: 0.000075,
      outputCost: 0.0003,
      capabilities: ['text', 'vision', 'function_calling'],
      providerId: googleProvider.id
    }
  ];

  // Create all models
  const allModels = [...openaiModels, ...claudeModels, ...deepseekModels, ...geminiModels];
  
  for (const modelData of allModels) {
    await prisma.aIModel.upsert({
      where: {
        providerId_name: {
          providerId: modelData.providerId,
          name: modelData.name
        }
      },
      update: {},
      create: {
        name: modelData.name,
        displayName: modelData.displayName,
        type: modelData.type,
        maxTokens: modelData.maxTokens,
        inputCost: modelData.inputCost,
        outputCost: modelData.outputCost,
        capabilities: modelData.capabilities,
        providerId: modelData.providerId
      }
    });
  }

  console.log(`✅ ${allModels.length} AI Models created successfully`);
  console.log(`📊 Summary:`);
  console.log(`   🔸 OpenAI: ${openaiModels.length} models`);
  console.log(`   🔸 Claude: ${claudeModels.length} models`);
  console.log(`   🔸 DeepSeek: ${deepseekModels.length} models`);
  console.log(`   🔸 Google Gemini: ${geminiModels.length} models`);
}

// Run the seed
seedAIProviders()
  .catch((e) => {
    console.error('❌ Error seeding AI providers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });