/**
 * 🧠 Enhanced AI Voice Processor with RAG
 * Voice command processing with full knowledge base access via vector search
 */

import { PrismaClient } from '@prisma/client';
import { VectorStore, SearchResult } from './VectorStore';
import { DataIngestionPipeline } from './DataIngestionPipeline';
import { AIVoiceProcessor, VoiceContext, CommandResult, VoiceCommandIntent } from './AIVoiceProcessor';
import OpenAI from 'openai';
import { getAIConfigService } from './AIConfigService';

interface EnhancedVoiceContext extends VoiceContext {
  searchResults?: SearchResult[];
  relatedEntities?: {
    projects: any[];
    tasks: any[];
    contacts: any[];
    companies: any[];
    communications: any[];
  };
  knowledgeContext?: string[];
}

/**
 * Enhanced AI Voice Processor with RAG capabilities
 */
export class EnhancedAIVoiceProcessor extends AIVoiceProcessor {
  private vectorStore: VectorStore;
  private ingestionPipeline: DataIngestionPipeline;
  private aiConfigService: any;

  constructor(prisma: PrismaClient, vectorStore: VectorStore) {
    super(prisma);
    this.vectorStore = vectorStore;
    this.ingestionPipeline = new DataIngestionPipeline(prisma, vectorStore);
    this.aiConfigService = getAIConfigService(prisma);

    console.log('🧠 EnhancedAIVoiceProcessor initialized with RAG capabilities');
  }

  /**
   * Process voice command with enhanced context from vector search
   */
  async processCommandWithRAG(
    transcript: string,
    context: VoiceContext
  ): Promise<CommandResult> {
    try {
      console.log(`🔍 Processing voice command with RAG: "${transcript}"`);

      // Step 1: Perform semantic search to get relevant context
      const searchResults = await this.vectorStore.search(transcript, {
        limit: 10,
        threshold: 0.6,
        userId: context.userId,
        organizationId: context.organizationId,
        includeExternal: true
      });

      console.log(`📚 Found ${searchResults.length} relevant documents`);

      // Step 2: Build enhanced context with search results
      const enhancedContext: EnhancedVoiceContext = {
        ...context,
        searchResults,
        knowledgeContext: this.buildKnowledgeContext(searchResults)
      };

      // Step 3: Load related entities based on search results
      enhancedContext.relatedEntities = await this.loadRelatedEntities(searchResults, context);

      // Step 4: Process command with enhanced context
      const result = await this.processCommandWithEnhancedContext(transcript, enhancedContext);

      // Step 5: Generate contextually aware response
      const enhancedResponse = await this.generateEnhancedResponse(result, enhancedContext);

      return {
        ...result,
        response: enhancedResponse,
        entities: {
          ...result.entities,
          contextDocuments: searchResults.length,
          relatedEntitiesFound: this.countRelatedEntities(enhancedContext.relatedEntities)
        }
      };

    } catch (error) {
      console.error('Enhanced voice command processing error:', error);
      
      // Fallback to basic processing
      return super.processCommand(transcript, context);
    }
  }

  /**
   * Process command with enhanced context
   */
  private async processCommandWithEnhancedContext(
    transcript: string,
    context: EnhancedVoiceContext
  ): Promise<CommandResult> {
    try {
      // Build enhanced system prompt with context
      const systemPrompt = this.buildEnhancedSystemPrompt(context);
      
      // Prepare context information for AI
      const contextInfo = this.formatContextForAI(context);

      // Get OpenAI client and config from AI config service
      const openaiClient = await this.aiConfigService.getOpenAIClient(context.organizationId);
      const config = await this.aiConfigService.getOpenAIConfig(context.organizationId);
      
      const completion = await openaiClient.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Kontekst z bazy wiedzy:
${contextInfo}

Komenda użytkownika: "${transcript}"

Przeanalizuj komendę w kontekście dostępnych danych i wykonaj odpowiednią akcję.` 
          }
        ],
        functions: [
          {
            name: 'process_enhanced_voice_command',
            description: 'Process voice command with enhanced context awareness',
            parameters: {
              type: 'object',
              properties: {
                intent: {
                  type: 'string',
                  enum: Object.values(VoiceCommandIntent),
                  description: 'The recognized intent'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence score 0-1'
                },
                entities: {
                  type: 'object',
                  description: 'Extracted entities with enhanced context'
                },
                suggestedResponse: {
                  type: 'string',
                  description: 'Natural response based on full context'
                },
                requiresConfirmation: {
                  type: 'boolean',
                  description: 'Whether confirmation is needed'
                },
                relatedInfo: {
                  type: 'object',
                  description: 'Additional related information found'
                }
              },
              required: ['intent', 'confidence', 'entities', 'suggestedResponse']
            }
          }
        ],
        function_call: { name: 'process_enhanced_voice_command' }
      });

      const functionCall = completion.choices[0]?.message?.function_call;
      if (!functionCall) {
        throw new Error('No function call in AI response');
      }

      const result = JSON.parse(functionCall.arguments);
      
      // Execute the command with enhanced context
      const executionResult = await this.executeEnhancedCommand(result, context);
      
      return {
        ...result,
        ...executionResult
      };

    } catch (error) {
      console.error('Enhanced command processing error:', error);
      throw error;
    }
  }

  /**
   * Build enhanced system prompt with context
   */
  private buildEnhancedSystemPrompt(context: EnhancedVoiceContext): string {
    const basePrompt = `Jesteś zaawansowanym asystentem głosowym systemu CRM-GTD z dostępem do pełnej bazy wiedzy.

Twoje możliwości:
- Dostęp do wszystkich danych użytkownika: projekty, zadania, kontakty, firmy, komunikacja
- Wyszukiwanie semantyczne w bazie wiedzy
- Analiza trendów i wzorców
- Inteligentne sugestie na podstawie kontekstu
- Tworzenie powiązań między encjami

Kontekst użytkownika:
- ID: ${context.userId}
- Organizacja: ${context.organizationId}
- Język: ${context.userPreferences?.language || 'pl'}`;

    if (context.searchResults && context.searchResults.length > 0) {
      const contextSummary = this.summarizeSearchResults(context.searchResults);
      return basePrompt + `\n\nRelewantne informacje z bazy wiedzy:\n${contextSummary}`;
    }

    return basePrompt;
  }

  /**
   * Format context for AI processing
   */
  private formatContextForAI(context: EnhancedVoiceContext): string {
    let contextInfo = '';

    // Add search results
    if (context.searchResults && context.searchResults.length > 0) {
      contextInfo += '=== ZNALEZIONE DOKUMENTY ===\n';
      context.searchResults.slice(0, 5).forEach((result, index) => {
        contextInfo += `${index + 1}. [${result.document.metadata.type}] ${result.document.content.substring(0, 200)}...\n`;
        contextInfo += `   Relevance: ${(result.relevanceScore * 100).toFixed(1)}%\n\n`;
      });
    }

    // Add related entities
    if (context.relatedEntities) {
      const { projects, tasks, contacts, companies } = context.relatedEntities;
      
      if (projects.length > 0) {
        contextInfo += '=== POWIĄZANE PROJEKTY ===\n';
        projects.slice(0, 3).forEach(project => {
          contextInfo += `- ${project.name} (${project.status}) - ${project.description?.substring(0, 100) || 'Brak opisu'}\n`;
        });
        contextInfo += '\n';
      }

      if (tasks.length > 0) {
        contextInfo += '=== POWIĄZANE ZADANIA ===\n';
        tasks.slice(0, 5).forEach(task => {
          contextInfo += `- ${task.title} (${task.status}, ${task.priority}) - ${task.description?.substring(0, 100) || ''}\n`;
        });
        contextInfo += '\n';
      }

      if (contacts.length > 0) {
        contextInfo += '=== POWIĄZANE KONTAKTY ===\n';
        contacts.slice(0, 3).forEach(contact => {
          contextInfo += `- ${contact.name} (${contact.email}) - ${contact.company?.name || 'Brak firmy'}\n`;
        });
        contextInfo += '\n';
      }
    }

    return contextInfo || 'Brak dodatkowego kontekstu.';
  }

  /**
   * Load related entities based on search results
   */
  private async loadRelatedEntities(
    searchResults: SearchResult[],
    context: VoiceContext
  ): Promise<EnhancedVoiceContext['relatedEntities']> {
    try {
      // Extract entity IDs from search results
      const projectIds = searchResults
        .filter(r => r.document.metadata.type === 'project')
        .map(r => r.document.metadata.entityId);

      const taskIds = searchResults
        .filter(r => r.document.metadata.type === 'task')
        .map(r => r.document.metadata.entityId);

      const contactIds = searchResults
        .filter(r => r.document.metadata.type === 'contact')
        .map(r => r.document.metadata.entityId);

      const companyIds = searchResults
        .filter(r => r.document.metadata.type === 'company')
        .map(r => r.document.metadata.entityId);

      // Load related entities in parallel
      const [projects, tasks, contacts, companies, communications] = await Promise.all([
        projectIds.length > 0 ? this.prisma.project.findMany({
          where: { id: { in: projectIds } },
          include: { tasks: true, createdBy: true }
        }) : [],
        
        taskIds.length > 0 ? this.prisma.task.findMany({
          where: { id: { in: taskIds } },
          include: { project: true, assignedTo: true }
        }) : [],
        
        contactIds.length > 0 ? this.prisma.contact.findMany({
          where: { id: { in: contactIds } },
          include: { company: true }
        }) : [],
        
        companyIds.length > 0 ? this.prisma.company.findMany({
          where: { id: { in: companyIds } },
          include: { contacts: true }
        }) : [],
        
        // Load recent communications related to found entities
        this.prisma.communication.findMany({
          where: {
            organizationId: context.organizationId,
            OR: [
              { contactId: { in: contactIds } },
              { companyId: { in: companyIds } }
            ]
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        })
      ]);

      return { projects, tasks, contacts, companies, communications };
    } catch (error) {
      console.error('Failed to load related entities:', error);
      return { projects: [], tasks: [], contacts: [], companies: [], communications: [] };
    }
  }

  /**
   * Execute enhanced command with full context
   */
  private async executeEnhancedCommand(
    command: CommandResult,
    context: EnhancedVoiceContext
  ): Promise<Partial<CommandResult>> {
    // Enhanced command execution can use the rich context
    // For now, delegate to base class but with enhanced entities
    
    // Add context information to entities
    if (context.relatedEntities) {
      command.entities = {
        ...command.entities,
        relatedProjects: context.relatedEntities.projects.map(p => ({ id: p.id, name: p.name })),
        relatedTasks: context.relatedEntities.tasks.map(t => ({ id: t.id, title: t.title })),
        relatedContacts: context.relatedEntities.contacts.map(c => ({ id: c.id, name: c.name })),
        relatedCompanies: context.relatedEntities.companies.map(c => ({ id: c.id, name: c.name }))
      };
    }

    // Use the base class execution but with enhanced context
    return super.executeCommand(command, context);
  }

  /**
   * Generate enhanced response with full context awareness
   */
  private async generateEnhancedResponse(
    command: CommandResult,
    context: EnhancedVoiceContext
  ): Promise<string> {
    try {
      const personalityLevel = context.userPreferences?.personalityLevel || 5;
      
      let systemPrompt = `Wygeneruj naturalną odpowiedź w języku polskim, uwzględniając pełny kontekst z bazy wiedzy.`;
      
      // Adjust tone based on personality
      if (personalityLevel <= 3) {
        systemPrompt += ' Bądź profesjonalny i rzeczowy.';
      } else if (personalityLevel >= 7) {
        systemPrompt += ' Bądź entuzjastyczny i pomocny.';
      } else if (personalityLevel >= 9) {
        systemPrompt += ' Możesz dodać subtelny humor.';
      }

      const contextSummary = context.searchResults ? 
        this.summarizeSearchResults(context.searchResults) : '';

      // Get OpenAI client from config service
      const openaiClient = await this.aiConfigService.getOpenAIClient(context.organizationId);
      
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Wykonana akcja: ${command.intent}
Znalezione informacje: ${contextSummary}
Wynik: ${JSON.stringify(command.entities)}
Zasugerowana odpowiedź: ${command.suggestedResponse}

Wygeneruj naturalną, kontekstową odpowiedź uwzględniającą znalezione informacje.` 
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return completion.choices[0]?.message?.content || command.suggestedResponse;
    } catch (error) {
      console.error('Enhanced response generation error:', error);
      return command.suggestedResponse;
    }
  }

  /**
   * Build knowledge context from search results
   */
  private buildKnowledgeContext(searchResults: SearchResult[]): string[] {
    return searchResults.map(result => 
      `[${result.document.metadata.type}] ${result.document.content.substring(0, 150)}...`
    );
  }

  /**
   * Summarize search results for AI context
   */
  private summarizeSearchResults(searchResults: SearchResult[]): string {
    if (searchResults.length === 0) return 'Brak wyników wyszukiwania.';

    const summary = searchResults.slice(0, 5).map((result, index) => {
      const type = result.document.metadata.type;
      const content = result.document.content.substring(0, 100);
      const score = (result.relevanceScore * 100).toFixed(0);
      
      return `${index + 1}. [${type.toUpperCase()}] ${content}... (${score}% relevance)`;
    }).join('\n');

    return `Znaleziono ${searchResults.length} dokumentów:\n${summary}`;
  }

  /**
   * Count related entities
   */
  private countRelatedEntities(relatedEntities?: EnhancedVoiceContext['relatedEntities']): number {
    if (!relatedEntities) return 0;
    
    return (relatedEntities.projects?.length || 0) +
           (relatedEntities.tasks?.length || 0) +
           (relatedEntities.contacts?.length || 0) +
           (relatedEntities.companies?.length || 0) +
           (relatedEntities.communications?.length || 0);
  }

  /**
   * Initialize vector store with user's data
   */
  async initializeUserVectorStore(organizationId: string): Promise<void> {
    try {
      console.log(`🚀 Initializing vector store for organization: ${organizationId}`);
      
      const job = await this.ingestionPipeline.startFullSync(organizationId);
      console.log(`📥 Ingestion job started: ${job.id}`);
    } catch (error) {
      console.error('Vector store initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get vector store statistics
   */
  async getVectorStoreStats(organizationId: string) {
    return this.vectorStore.getStats(organizationId);
  }

  /**
   * Manual search in vector store
   */
  async searchKnowledge(query: string, context: VoiceContext) {
    return this.vectorStore.search(query, {
      userId: context.userId,
      organizationId: context.organizationId,
      limit: 10,
      threshold: 0.6
    });
  }
}

// Export singleton
let enhancedAIVoiceProcessor: EnhancedAIVoiceProcessor | null = null;

export function getEnhancedAIVoiceProcessor(
  prisma: PrismaClient,
  vectorStore: VectorStore
): EnhancedAIVoiceProcessor {
  if (!enhancedAIVoiceProcessor) {
    enhancedAIVoiceProcessor = new EnhancedAIVoiceProcessor(prisma, vectorStore);
  }
  return enhancedAIVoiceProcessor;
}