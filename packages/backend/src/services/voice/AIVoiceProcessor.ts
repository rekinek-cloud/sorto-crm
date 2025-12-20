/**
 * 🤖 AI Voice Command Processor
 * Processes voice commands using OpenAI/Claude for natural language understanding
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import OpenAI from 'openai';
import config from '../../config';
import { getAIConfigService } from './AIConfigService';

// Command types that AI can recognize
export enum VoiceCommandIntent {
  CREATE_PROJECT = 'CREATE_PROJECT',
  CREATE_TASK = 'CREATE_TASK',
  GET_TASKS = 'GET_TASKS',
  GET_PROJECTS = 'GET_PROJECTS',
  UPDATE_TASK_STATUS = 'UPDATE_TASK_STATUS',
  SEARCH = 'SEARCH',
  CREATE_NOTE = 'CREATE_NOTE',
  SET_REMINDER = 'SET_REMINDER',
  GET_SUMMARY = 'GET_SUMMARY',
  UNKNOWN = 'UNKNOWN'
}

// Structured output schemas
const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  assignedTo: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
});

const TaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  context: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().optional()
});

const CommandResultSchema = z.object({
  intent: z.nativeEnum(VoiceCommandIntent),
  confidence: z.number().min(0).max(1),
  entities: z.record(z.any()),
  suggestedResponse: z.string(),
  requiresConfirmation: z.boolean().default(false),
  error: z.string().optional()
});

export type CommandResult = z.infer<typeof CommandResultSchema>;

export interface VoiceContext {
  userId: string;
  organizationId: string;
  conversationId?: string;
  previousCommands?: CommandResult[];
  userPreferences?: {
    language: 'pl' | 'en';
    personalityLevel: number;
  };
}

/**
 * AI-powered voice command processor
 */
export class AIVoiceProcessor {
  private prisma: PrismaClient;
  private aiConfigService: any;
  private systemPrompt: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    // Initialize AI config service
    this.aiConfigService = getAIConfigService(prisma);

    // System prompt for voice assistant
    this.systemPrompt = `Jesteś asystentem głosowym systemu CRM-GTD. 
Twoim zadaniem jest interpretowanie poleceń głosowych użytkownika i przekształcanie ich w strukturyzowane komendy.

Możliwe intencje (INTENT):
- CREATE_PROJECT: tworzenie nowego projektu
- CREATE_TASK: tworzenie nowego zadania
- GET_TASKS: pobieranie listy zadań
- GET_PROJECTS: pobieranie listy projektów
- UPDATE_TASK_STATUS: aktualizacja statusu zadania
- SEARCH: wyszukiwanie w systemie
- CREATE_NOTE: tworzenie notatki
- SET_REMINDER: ustawianie przypomnienia
- GET_SUMMARY: podsumowanie danych
- UNKNOWN: nierozpoznana komenda

Wyciągaj kluczowe informacje (entities) takie jak:
- nazwy projektów/zadań
- daty i terminy (przekształć na format ISO)
- osoby przypisane
- priorytety
- konteksty GTD (@computer, @phone, etc.)

Zawsze zwracaj strukturyzowaną odpowiedź w formacie JSON.
Jeśli komenda jest niejasna, ustaw requiresConfirmation=true.`;
  }

  /**
   * Process voice command using AI
   */
  async processCommand(
    transcript: string, 
    context: VoiceContext
  ): Promise<CommandResult> {
    try {
      console.log(`🎤 Processing voice command: "${transcript}"`);

      // Get OpenAI client and config from AI config service
      const openaiClient = await this.aiConfigService.getOpenAIClient(context.organizationId);
      const config = await this.aiConfigService.getOpenAIConfig(context.organizationId);
      
      // Use OpenAI function calling for structured output
      const completion = await openaiClient.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { 
            role: 'user', 
            content: `Użytkownik powiedział: "${transcript}"
            
Kontekst użytkownika:
- ID: ${context.userId}
- Organizacja: ${context.organizationId}
- Język: ${context.userPreferences?.language || 'pl'}` 
          }
        ],
        functions: [
          {
            name: 'process_voice_command',
            description: 'Process voice command and extract intent and entities',
            parameters: {
              type: 'object',
              properties: {
                intent: {
                  type: 'string',
                  enum: Object.values(VoiceCommandIntent),
                  description: 'The recognized intent of the command'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence score between 0 and 1'
                },
                entities: {
                  type: 'object',
                  description: 'Extracted entities from the command'
                },
                suggestedResponse: {
                  type: 'string',
                  description: 'Natural language response to the user in Polish'
                },
                requiresConfirmation: {
                  type: 'boolean',
                  description: 'Whether the command needs user confirmation'
                }
              },
              required: ['intent', 'confidence', 'entities', 'suggestedResponse']
            }
          }
        ],
        function_call: { name: 'process_voice_command' }
      });

      // Parse AI response
      const functionCall = completion.choices[0]?.message?.function_call;
      if (!functionCall) {
        throw new Error('No function call in AI response');
      }

      const result = JSON.parse(functionCall.arguments);
      
      // Validate with Zod
      const validatedResult = CommandResultSchema.parse(result);

      // Execute command based on intent
      const executionResult = await this.executeCommand(validatedResult, context);
      
      return {
        ...validatedResult,
        ...executionResult
      };

    } catch (error) {
      console.error('Voice command processing error:', error);
      
      return {
        intent: VoiceCommandIntent.UNKNOWN,
        confidence: 0,
        entities: {},
        suggestedResponse: 'Przepraszam, nie zrozumiałem polecenia. Czy możesz powtórzyć?',
        requiresConfirmation: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute the recognized command
   */
  private async executeCommand(
    command: CommandResult,
    context: VoiceContext
  ): Promise<Partial<CommandResult>> {
    try {
      switch (command.intent) {
        case VoiceCommandIntent.CREATE_PROJECT:
          return await this.createProject(command.entities, context);
        
        case VoiceCommandIntent.CREATE_TASK:
          return await this.createTask(command.entities, context);
        
        case VoiceCommandIntent.GET_TASKS:
          return await this.getTasks(command.entities, context);
        
        case VoiceCommandIntent.GET_PROJECTS:
          return await this.getProjects(command.entities, context);
        
        case VoiceCommandIntent.UPDATE_TASK_STATUS:
          return await this.updateTaskStatus(command.entities, context);
        
        case VoiceCommandIntent.SEARCH:
          return await this.search(command.entities, context);
        
        case VoiceCommandIntent.GET_SUMMARY:
          return await this.getSummary(command.entities, context);
        
        default:
          return {
            suggestedResponse: 'Rozpoznałem polecenie, ale nie mogę go jeszcze wykonać.'
          };
      }
    } catch (error) {
      console.error('Command execution error:', error);
      return {
        error: error instanceof Error ? error.message : 'Execution failed',
        suggestedResponse: 'Wystąpił błąd podczas wykonywania polecenia.'
      };
    }
  }

  /**
   * Create a new project
   */
  private async createProject(
    entities: any,
    context: VoiceContext
  ): Promise<Partial<CommandResult>> {
    try {
      const projectData = ProjectSchema.parse(entities);
      
      const project = await this.prisma.project.create({
        data: {
          name: projectData.name,
          description: projectData.description,
          status: 'PLANNING',
          priority: projectData.priority || 'MEDIUM',
          organizationId: context.organizationId,
          createdById: context.userId,
          dueDate: projectData.dueDate ? new Date(projectData.dueDate) : undefined,
        }
      });

      return {
        entities: { ...entities, projectId: project.id },
        suggestedResponse: `Utworzyłem projekt "${project.name}". Dodałem go do twojego dashboardu z statusem "Planowanie".`
      };
    } catch (error) {
      throw new Error('Failed to create project');
    }
  }

  /**
   * Create a new task
   */
  private async createTask(
    entities: any,
    context: VoiceContext
  ): Promise<Partial<CommandResult>> {
    try {
      const taskData = TaskSchema.parse(entities);
      
      const task = await this.prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          status: 'TODO',
          priority: taskData.priority || 'MEDIUM',
          context: taskData.context || '@computer',
          organizationId: context.organizationId,
          assignedToId: context.userId,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          projectId: taskData.projectId
        }
      });

      return {
        entities: { ...entities, taskId: task.id },
        suggestedResponse: `Utworzyłem zadanie "${task.title}" w kontekście ${task.context}.`
      };
    } catch (error) {
      throw new Error('Failed to create task');
    }
  }

  /**
   * Get user's tasks
   */
  private async getTasks(
    entities: any,
    context: VoiceContext
  ): Promise<Partial<CommandResult>> {
    try {
      const filter: any = {
        organizationId: context.organizationId,
        assignedToId: context.userId,
        status: { not: 'DONE' }
      };

      // Apply date filter if specified
      if (entities.timeframe === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filter.dueDate = {
          gte: today,
          lt: tomorrow
        };
      }

      const tasks = await this.prisma.task.findMany({
        where: filter,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' }
        ],
        take: 5
      });

      if (tasks.length === 0) {
        return {
          entities: { tasks: [] },
          suggestedResponse: 'Nie masz żadnych zadań na dziś. Dobra robota!'
        };
      }

      const taskList = tasks.map(t => `- ${t.title} (${t.priority})`).join('\n');
      return {
        entities: { tasks: tasks.map(t => ({ id: t.id, title: t.title })) },
        suggestedResponse: `Oto twoje zadania:\n${taskList}`
      };
    } catch (error) {
      throw new Error('Failed to get tasks');
    }
  }

  /**
   * Get user's projects
   */
  private async getProjects(
    entities: any,
    context: VoiceContext
  ): Promise<Partial<CommandResult>> {
    try {
      const projects = await this.prisma.project.findMany({
        where: {
          organizationId: context.organizationId,
          OR: [
            { createdById: context.userId },
            { collaborators: { some: { userId: context.userId } } }
          ],
          status: { in: ['PLANNING', 'ACTIVE'] }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      if (projects.length === 0) {
        return {
          entities: { projects: [] },
          suggestedResponse: 'Nie masz żadnych aktywnych projektów.'
        };
      }

      const projectList = projects.map(p => `- ${p.name} (${p.status})`).join('\n');
      return {
        entities: { projects: projects.map(p => ({ id: p.id, name: p.name })) },
        suggestedResponse: `Twoje aktywne projekty:\n${projectList}`
      };
    } catch (error) {
      throw new Error('Failed to get projects');
    }
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(
    entities: any,
    context: VoiceContext
  ): Promise<Partial<CommandResult>> {
    try {
      const { taskId, taskTitle, newStatus } = entities;
      
      let task;
      if (taskId) {
        task = await this.prisma.task.update({
          where: { id: taskId },
          data: { status: newStatus || 'DONE' }
        });
      } else if (taskTitle) {
        // Find task by title
        task = await this.prisma.task.findFirst({
          where: {
            title: { contains: taskTitle, mode: 'insensitive' },
            organizationId: context.organizationId,
            assignedToId: context.userId
          }
        });

        if (task) {
          task = await this.prisma.task.update({
            where: { id: task.id },
            data: { status: newStatus || 'DONE' }
          });
        }
      }

      if (!task) {
        return {
          suggestedResponse: 'Nie mogłem znaleźć tego zadania.',
          requiresConfirmation: true
        };
      }

      return {
        entities: { taskId: task.id, newStatus: task.status },
        suggestedResponse: `Zaktualizowałem status zadania "${task.title}" na ${task.status}.`
      };
    } catch (error) {
      throw new Error('Failed to update task status');
    }
  }

  /**
   * Search in the system
   */
  private async search(
    entities: any,
    context: VoiceContext
  ): Promise<Partial<CommandResult>> {
    try {
      const { query, type } = entities;
      
      // Simple search implementation
      const results = await this.prisma.$transaction([
        this.prisma.task.findMany({
          where: {
            organizationId: context.organizationId,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 3
        }),
        this.prisma.project.findMany({
          where: {
            organizationId: context.organizationId,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 3
        })
      ]);

      const [tasks, projects] = results;
      const totalResults = tasks.length + projects.length;

      if (totalResults === 0) {
        return {
          entities: { results: [] },
          suggestedResponse: `Nie znalazłem nic dla zapytania "${query}".`
        };
      }

      return {
        entities: { 
          results: {
            tasks: tasks.map(t => ({ id: t.id, title: t.title })),
            projects: projects.map(p => ({ id: p.id, name: p.name }))
          }
        },
        suggestedResponse: `Znalazłem ${totalResults} wyników: ${tasks.length} zadań i ${projects.length} projektów.`
      };
    } catch (error) {
      throw new Error('Search failed');
    }
  }

  /**
   * Get summary of user's data
   */
  private async getSummary(
    entities: any,
    context: VoiceContext
  ): Promise<Partial<CommandResult>> {
    try {
      const [taskCount, projectCount, todayTasks] = await this.prisma.$transaction([
        this.prisma.task.count({
          where: {
            organizationId: context.organizationId,
            assignedToId: context.userId,
            status: { not: 'DONE' }
          }
        }),
        this.prisma.project.count({
          where: {
            organizationId: context.organizationId,
            createdById: context.userId,
            status: { in: ['PLANNING', 'ACTIVE'] }
          }
        }),
        this.prisma.task.count({
          where: {
            organizationId: context.organizationId,
            assignedToId: context.userId,
            status: { not: 'DONE' },
            dueDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(24, 0, 0, 0))
            }
          }
        })
      ]);

      return {
        entities: { taskCount, projectCount, todayTasks },
        suggestedResponse: `Podsumowanie: Masz ${taskCount} aktywnych zadań, w tym ${todayTasks} na dziś. Pracujesz nad ${projectCount} projektami.`
      };
    } catch (error) {
      throw new Error('Failed to get summary');
    }
  }

  /**
   * Generate contextual AI response
   */
  async generateResponse(
    command: CommandResult,
    context: VoiceContext
  ): Promise<string> {
    try {
      const personalityLevel = context.userPreferences?.personalityLevel || 5;
      
      // Adjust response based on personality level
      let systemPrompt = `Odpowiedz na wykonane polecenie w języku polskim.`;
      
      if (personalityLevel <= 3) {
        systemPrompt += ' Bądź bardzo profesjonalny i rzeczowy.';
      } else if (personalityLevel >= 7) {
        systemPrompt += ' Bądź entuzjastyczny i przyjacielski.';
      } else if (personalityLevel >= 9) {
        systemPrompt += ' Możesz dodać odrobinę humoru lub sarkazmu.';
      }

      // Get OpenAI client from config service
      const openaiClient = await this.aiConfigService.getOpenAIClient(context.organizationId);
      
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Polecenie: ${command.intent}\nWynik: ${JSON.stringify(command.entities)}\nZasugerowana odpowiedź: ${command.suggestedResponse}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return completion.choices[0]?.message?.content || command.suggestedResponse;
    } catch (error) {
      console.error('Response generation error:', error);
      return command.suggestedResponse;
    }
  }
}

// Export singleton instance
let aiVoiceProcessor: AIVoiceProcessor | null = null;

export function getAIVoiceProcessor(prisma: PrismaClient): AIVoiceProcessor {
  if (!aiVoiceProcessor) {
    aiVoiceProcessor = new AIVoiceProcessor(prisma);
  }
  return aiVoiceProcessor;
}