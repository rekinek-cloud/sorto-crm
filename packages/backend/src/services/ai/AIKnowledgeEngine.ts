import { prisma } from '../../config/database';
import { AIRouter } from './AIRouter';
import { PromptManager } from './PromptManager';

export interface KnowledgeQuery {
  question: string;
  userId: string;
  organizationId: string;
  context?: 'dashboard' | 'projects' | 'deals' | 'tasks' | 'general';
  providerId?: string;
  ragContext?: string; // Context from RAG vector search
}

export interface KnowledgeResponse {
  answer: string;
  confidence: number;
  data?: any;
  insights?: Insight[];
  actions?: ActionItem[];
  visualizations?: ChartData[];
  executionTime: number;
}

export interface Insight {
  type: 'warning' | 'opportunity' | 'trend' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

export interface ActionItem {
  type: 'call' | 'email' | 'meeting' | 'task' | 'review';
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  entityId?: string;
  entityType?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'progress';
  title: string;
  data: any[];
  labels?: string[];
}

export class AIKnowledgeEngine {
  private aiRouters: Map<string, AIRouter> = new Map();

  constructor() {
    // AIRouter instances will be created per organization when needed
  }

  /**
   * Clear cached AI routers (for debug/testing)
   */
  public clearCache(): void {
    console.log('🧹 Clearing AIRouter cache');
    this.aiRouters.clear();
  }

  private async getAIRouter(organizationId: string): Promise<AIRouter> {
    console.log('GET AI ROUTER FOR ORG:', organizationId);
    if (!this.aiRouters.has(organizationId)) {
      console.log('CREATING NEW AI ROUTER');
      const router = new AIRouter({
        organizationId,
        prisma
      });
      console.log('CALLING INITIALIZE PROVIDERS');
      await router.initializeProviders();
      console.log('PROVIDERS INITIALIZED, CACHING ROUTER');
      this.aiRouters.set(organizationId, router);
    } else {
      console.log('USING CACHED AI ROUTER');
    }
    return this.aiRouters.get(organizationId)!;
  }

  /**
   * Main query processing method
   */
  async queryKnowledge(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    const startTime = Date.now();

    try {
      // 1. Parse and classify the question
      const intent = await this.parseIntent(query.question);

      // 2. Check if RAG context is available - if so, prioritize RAG-based response
      const hasRagContext = query.ragContext && query.ragContext.trim().length > 100;

      // 3. Gather relevant data based on intent (skip if RAG context is primary)
      let data = {};
      if (!hasRagContext || intent.type !== 'general') {
        data = await this.gatherData(intent, query);
      }

      // 4. Analyze data and generate insights (minimal if RAG-based)
      const insights = hasRagContext ? [] : await this.generateInsights(data, intent, query);

      // 5. Create action items (minimal if RAG-based)
      const actions = hasRagContext ? [] : await this.generateActions(insights, query);

      // 6. Prepare visualizations if needed (skip if RAG-based)
      const visualizations = hasRagContext ? [] : await this.prepareVisualizations(data, intent);

      // 7. Generate natural language response
      // Use RAG-focused response if RAG context is available
      const answer = hasRagContext
        ? await this.generateRAGResponse(query)
        : await this.generateResponse(data, insights, intent, query);

      const executionTime = Date.now() - startTime;

      return {
        answer,
        confidence: hasRagContext ? 0.85 : this.calculateConfidence(data, insights),
        data,
        insights,
        actions,
        visualizations,
        executionTime
      };

    } catch (error: any) {
      console.error('Knowledge query error:', error?.message || error);
      console.error('Full error:', JSON.stringify(error, null, 2));

      return {
        answer: 'Przepraszam, wystąpił błąd podczas analizy danych. Spróbuj ponownie lub sformułuj pytanie inaczej.',
        confidence: 0,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Parse user question and determine intent
   */
  private async parseIntent(question: string): Promise<any> {
    const lowercaseQuestion = question.toLowerCase();
    
    // Keywords mapping for intent classification
    const intentPatterns = {
      streams: ['strumień', 'strumieni', 'stream', 'streams', 'gtd', 'flow', 'najważniejsz'],
      projects: ['projekt', 'projekty', 'zagrożon', 'opóźnien', 'deadline', 'termin'],
      deals: ['deal', 'transakcj', 'sprzedaż', 'zamknięci', 'prawdopodobieństwo', 'pipeline'],
      tasks: ['zadani', 'todo', 'priorytet', 'jutro', 'dziś', 'overdue', 'zrobić'],
      productivity: ['produktywność', 'efektywność', 'analiza', 'czas', 'performance'],
      communication: ['komunikacj', 'email', 'wiadomości', 'kontakt', 'odpowiedzi'],
      general: ['status', 'statystyk', 'raport', 'podsumowani', 'trend']
    };
    
    let detectedIntent = 'general';
    let maxMatches = 0;
    
    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      const matches = keywords.filter(keyword => lowercaseQuestion.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedIntent = intent;
      }
    }
    
    return {
      type: detectedIntent,
      keywords: intentPatterns[detectedIntent as keyof typeof intentPatterns],
      originalQuestion: question,
      confidence: maxMatches > 0 ? Math.min(maxMatches * 0.3, 0.9) : 0.3
    };
  }

  /**
   * Gather relevant data based on intent
   */
  private async gatherData(intent: any, query: KnowledgeQuery): Promise<any> {
    const { organizationId } = query;

    switch (intent.type) {
      case 'streams':
        return await this.gatherStreamsData(organizationId);

      case 'projects':
        return await this.gatherProjectsData(organizationId);

      case 'deals':
        return await this.gatherDealsData(organizationId);

      case 'tasks':
        return await this.gatherTasksData(organizationId, query.userId);

      case 'productivity':
        return await this.gatherProductivityData(organizationId, query.userId);

      case 'communication':
        return await this.gatherCommunicationData(organizationId);

      default:
        return await this.gatherGeneralData(organizationId);
    }
  }

  /**
   * Gather GTD streams data with analysis
   */
  private async gatherStreamsData(organizationId: string): Promise<any> {
    const [streams, tasks, projects] = await Promise.all([
      // Get all streams
      prisma.stream.findMany({
        where: { organizationId },
        include: {
          tasks: {
            where: { status: { not: 'COMPLETED' } },
            select: {
              id: true,
              title: true,
              priority: true,
              dueDate: true,
              status: true
            }
          },
          projects: {
            where: { status: { in: ['IN_PROGRESS', 'PLANNING'] } },
            select: { id: true, name: true, status: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),

      // Get overdue tasks by stream
      prisma.task.findMany({
        where: {
          organizationId,
          dueDate: { lt: new Date() },
          status: { not: 'COMPLETED' }
        },
        select: {
          id: true,
          title: true,
          priority: true,
          streamId: true
        }
      }),

      // Get all projects for reference
      prisma.project.findMany({
        where: { organizationId },
        select: { id: true, name: true, status: true, streamId: true }
      })
    ]);

    // Analyze each stream
    const streamAnalysis = streams.map(stream => {
      const streamOverdueTasks = tasks.filter(t => t.streamId === stream.id);
      const highPriorityTasks = stream.tasks.filter((t: any) => t.priority === 'HIGH');
      const activeProjects = stream.projects.length;
      const totalTasks = stream.tasks.length;

      // Calculate importance score
      let importanceScore = 0;
      importanceScore += streamOverdueTasks.length * 10; // Overdue tasks are very important
      importanceScore += highPriorityTasks.length * 5;   // High priority matters
      importanceScore += totalTasks * 1;                  // More tasks = needs attention
      importanceScore += activeProjects * 3;              // Active projects add importance

      // Determine urgency level
      let urgencyLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (streamOverdueTasks.length > 2 || highPriorityTasks.length > 3) {
        urgencyLevel = 'critical';
      } else if (streamOverdueTasks.length > 0 || highPriorityTasks.length > 1) {
        urgencyLevel = 'high';
      } else if (totalTasks > 5 || activeProjects > 1) {
        urgencyLevel = 'medium';
      }

      return {
        id: stream.id,
        name: stream.name,
        color: stream.color,
        streamRole: stream.streamRole,
        description: stream.description,
        totalTasks,
        overdueTasks: streamOverdueTasks.length,
        highPriorityTasks: highPriorityTasks.length,
        activeProjects,
        importanceScore,
        urgencyLevel,
        overdue: streamOverdueTasks,
        highPriority: highPriorityTasks.slice(0, 3)
      };
    });

    // Sort by importance
    const sortedStreams = [...streamAnalysis].sort((a, b) => b.importanceScore - a.importanceScore);
    const mostImportant = sortedStreams[0];

    return {
      streams: streamAnalysis,
      sortedByImportance: sortedStreams,
      mostImportant,
      summary: {
        totalStreams: streams.length,
        totalOverdue: tasks.length,
        criticalStreams: streamAnalysis.filter(s => s.urgencyLevel === 'critical').length,
        highUrgencyStreams: streamAnalysis.filter(s => s.urgencyLevel === 'high').length
      }
    };
  }

  /**
   * Gather projects data
   */
  private async gatherProjectsData(organizationId: string): Promise<any> {
    const [projects, overdueTasks, projectStats] = await Promise.all([
      // Active projects with detailed info
      prisma.project.findMany({
        where: { 
          organizationId,
          status: { in: ['IN_PROGRESS', 'PLANNING', 'ON_HOLD'] }
        },
        include: {
          tasks: {
            include: {
              assignedTo: { select: { firstName: true, lastName: true } }
            }
          },
          assignedTo: { select: { firstName: true, lastName: true } },
          company: { select: { id: true, name: true } }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      
      // Overdue tasks by project
      prisma.task.findMany({
        where: {
          organizationId,
          dueDate: { lt: new Date() },
          status: { not: 'COMPLETED' }
        },
        include: {
          project: { select: { id: true, name: true } }
        }
      }),
      
      // Project statistics
      prisma.project.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { id: true }
      })
    ]);

    return {
      projects,
      overdueTasks,
      projectStats,
      riskAnalysis: this.analyzeProjectRisks(projects, overdueTasks)
    };
  }

  /**
   * Gather deals data
   */
  private async gatherDealsData(organizationId: string): Promise<any> {
    const [deals, dealStats, recentActivities] = await Promise.all([
      // Active deals with company info
      prisma.deal.findMany({
        where: { 
          organizationId,
          stage: { not: 'CLOSED_LOST' }
        },
        include: {
          company: { select: { id: true, name: true, status: true } },
          owner: { select: { firstName: true, lastName: true } }
        },
        orderBy: { value: 'desc' }
      }),
      
      // Deal statistics
      prisma.deal.groupBy({
        by: ['stage'],
        where: { organizationId },
        _sum: { value: true },
        _count: { id: true }
      }),
      
      // Recent activities
      prisma.deal.findMany({
        where: { 
          organizationId,
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        },
        select: { id: true, title: true, stage: true, value: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ]);

    return {
      deals,
      dealStats,
      recentActivities,
      predictions: this.predictDealSuccess(deals)
    };
  }

  /**
   * Gather tasks data
   */
  private async gatherTasksData(organizationId: string, userId: string): Promise<any> {
    const [userTasks, overdueCount, todayTasks, contexts] = await Promise.all([
      // User's tasks
      prisma.task.findMany({
        where: { 
          organizationId,
          assignedToId: userId
        },
        include: {
          project: { select: { id: true, name: true } },
          context: { select: { id: true, name: true } }
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' }
        ]
      }),
      
      // Overdue count
      prisma.task.count({
        where: {
          organizationId,
          assignedToId: userId,
          dueDate: { lt: new Date() },
          status: { not: 'COMPLETED' }
        }
      }),
      
      // Today's tasks
      prisma.task.findMany({
        where: {
          organizationId,
          assignedToId: userId,
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // User's contexts
      prisma.context.findMany({
        where: { organizationId },
        include: {
          _count: {
            select: {
              tasks: {
                where: {
                  assignedToId: userId,
                  status: { not: 'COMPLETED' }
                }
              }
            }
          }
        }
      })
    ]);

    return {
      userTasks,
      overdueCount,
      todayTasks,
      contexts,
      prioritization: this.prioritizeTasks(userTasks)
    };
  }

  /**
   * Gather productivity data
   */
  private async gatherProductivityData(organizationId: string, userId: string): Promise<any> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [weeklyStats, completionRates, timePatterns] = await Promise.all([
      // Weekly task completion
      prisma.task.groupBy({
        by: ['status'],
        where: {
          organizationId,
          assignedToId: userId,
          updatedAt: { gte: weekStart }
        },
        _count: { id: true }
      }),
      
      // Completion rates by context
      prisma.task.groupBy({
        by: ['contextId', 'status'],
        where: {
          organizationId,
          assignedToId: userId,
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        },
        _count: { id: true }
      }),
      
      // Time patterns (created vs completed)
      prisma.task.findMany({
        where: {
          organizationId,
          assignedToId: userId,
          status: 'COMPLETED',
          completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        select: { createdAt: true, completedAt: true, estimatedHours: true, priority: true }
      })
    ]);

    return {
      weeklyStats,
      completionRates,
      timePatterns,
      recommendations: this.generateProductivityRecommendations(weeklyStats, completionRates, timePatterns)
    };
  }

  /**
   * Gather communication data
   */
  private async gatherCommunicationData(organizationId: string): Promise<any> {
    const [recentMessages, channels, responseTimes] = await Promise.all([
      // Recent messages
      prisma.message.findMany({
        where: { organizationId },
        include: {
          contact: { select: { firstName: true, lastName: true, email: true } },
          company: { select: { name: true } }
        },
        orderBy: { receivedAt: 'desc' },
        take: 50
      }),
      
      // Communication channels
      prisma.communicationChannel.findMany({
        where: { organizationId }
      }),
      
      // Response time analysis
      prisma.message.findMany({
        where: {
          organizationId,
          direction: 'OUTBOUND',
          receivedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: { receivedAt: true }
      })
    ]);

    return {
      recentMessages,
      channels,
      responseTimes,
      sentimentAnalysis: await this.analyzeSentiment(recentMessages)
    };
  }

  /**
   * Gather general organization data
   */
  private async gatherGeneralData(organizationId: string): Promise<any> {
    const [summary, trends] = await Promise.all([
      // Organization summary
      Promise.all([
        prisma.project.count({ where: { organizationId, status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { organizationId, status: { not: 'COMPLETED' } } }),
        prisma.deal.count({ where: { organizationId, stage: { not: 'CLOSED_LOST' } } }),
        prisma.user.count({ where: { organizationId } })
      ]),
      
      // Recent trends
      Promise.all([
        prisma.task.count({
          where: {
            organizationId,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        }),
        prisma.deal.count({
          where: {
            organizationId,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        })
      ])
    ]);

    const [activeProjects, activeTasks, activeDeals, totalUsers] = summary;
    const [newTasksWeek, newDealsWeek] = trends;

    return {
      summary: {
        activeProjects,
        activeTasks,
        activeDeals,
        totalUsers
      },
      trends: {
        newTasksWeek,
        newDealsWeek
      }
    };
  }

  /**
   * Generate insights from gathered data
   */
  private async generateInsights(data: any, intent: any, query: KnowledgeQuery): Promise<Insight[]> {
    const insights: Insight[] = [];

    switch (intent.type) {
      case 'streams':
        insights.push(...this.generateStreamInsights(data));
        break;

      case 'projects':
        insights.push(...this.generateProjectInsights(data));
        break;

      case 'deals':
        insights.push(...this.generateDealInsights(data));
        break;

      case 'tasks':
        insights.push(...this.generateTaskInsights(data));
        break;

      case 'productivity':
        insights.push(...this.generateProductivityInsights(data));
        break;
    }

    return insights;
  }

  /**
   * Generate stream-specific insights
   */
  private generateStreamInsights(data: any): Insight[] {
    const insights: Insight[] = [];
    const { mostImportant, summary, sortedByImportance } = data;

    if (mostImportant) {
      insights.push({
        type: 'recommendation',
        title: `Najważniejszy strumień: ${mostImportant.name}`,
        description: `${mostImportant.overdueTasks} zaległych zadań, ${mostImportant.highPriorityTasks} pilnych, ${mostImportant.activeProjects} aktywnych projektów`,
        priority: mostImportant.urgencyLevel === 'critical' ? 'critical' : mostImportant.urgencyLevel === 'high' ? 'high' : 'medium',
        data: mostImportant
      });
    }

    if (summary.criticalStreams > 0) {
      insights.push({
        type: 'warning',
        title: `${summary.criticalStreams} strumieni wymaga pilnej uwagi`,
        description: 'Strumienie z wieloma zaległymi lub pilnymi zadaniami',
        priority: 'critical',
        data: sortedByImportance.filter((s: any) => s.urgencyLevel === 'critical')
      });
    }

    if (summary.totalOverdue > 0) {
      insights.push({
        type: 'warning',
        title: `${summary.totalOverdue} zaległych zadań łącznie`,
        description: 'Zadania po terminie wymagające natychmiastowej uwagi',
        priority: 'high',
        data: { count: summary.totalOverdue }
      });
    }

    return insights;
  }

  /**
   * Generate project-specific insights
   */
  private generateProjectInsights(data: any): Insight[] {
    const insights: Insight[] = [];
    const { riskAnalysis } = data;

    if (riskAnalysis.highRisk.length > 0) {
      insights.push({
        type: 'warning',
        title: `${riskAnalysis.highRisk.length} projektów wysokiego ryzyka`,
        description: `Projekty wymagające natychmiastowej uwagi: ${riskAnalysis.highRisk.map((p: any) => p.name).join(', ')}`,
        priority: 'critical',
        data: riskAnalysis.highRisk
      });
    }

    if (riskAnalysis.opportunities.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Możliwości optymalizacji',
        description: `${riskAnalysis.opportunities.length} projektów można zoptymalizować`,
        priority: 'medium',
        data: riskAnalysis.opportunities
      });
    }

    return insights;
  }

  /**
   * Generate deal-specific insights
   */
  private generateDealInsights(data: any): Insight[] {
    const insights: Insight[] = [];
    const { predictions } = data;

    const highProbDeals = predictions.filter((d: any) => d.probability > 0.8);
    if (highProbDeals.length > 0) {
      const totalValue = highProbDeals.reduce((sum: number, deal: any) => sum + deal.value, 0);
      
      insights.push({
        type: 'opportunity',
        title: `${highProbDeals.length} deals bliskie zamknięcia`,
        description: `Łączna wartość: $${totalValue.toLocaleString()}`,
        priority: 'high',
        data: highProbDeals
      });
    }

    return insights;
  }

  /**
   * Generate task-specific insights
   */
  private generateTaskInsights(data: any): Insight[] {
    const insights: Insight[] = [];
    const { overdueCount, prioritization } = data;

    if (overdueCount > 0) {
      insights.push({
        type: 'warning',
        title: `${overdueCount} zadań po terminie`,
        description: 'Wymagają natychmiastowej uwagi',
        priority: 'critical',
        data: { count: overdueCount }
      });
    }

    if (prioritization.urgent.length > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Rekomendowana kolejność zadań',
        description: `Zacznij od: ${prioritization.urgent[0]?.title}`,
        priority: 'high',
        data: prioritization
      });
    }

    return insights;
  }

  /**
   * Generate productivity insights
   */
  private generateProductivityInsights(data: any): Insight[] {
    const insights: Insight[] = [];
    const { recommendations } = data;

    if (recommendations.bestContext) {
      insights.push({
        type: 'trend',
        title: `Najefektywniejszy kontekst: ${recommendations.bestContext.name}`,
        description: `${recommendations.bestContext.completionRate}% zadań ukończonych`,
        priority: 'medium',
        data: recommendations
      });
    }

    return insights;
  }

  /**
   * Generate action items
   */
  private async generateActions(insights: Insight[], query: KnowledgeQuery): Promise<ActionItem[]> {
    const actions: ActionItem[] = [];

    for (const insight of insights) {
      if (insight.type === 'warning' && insight.priority === 'critical') {
        actions.push({
          type: 'review',
          title: 'Przegląd pilnych zadań',
          description: insight.description,
          urgency: 'high'
        });
      }
      
      if (insight.type === 'opportunity') {
        actions.push({
          type: 'call',
          title: 'Kontakt z klientem',
          description: 'Skontaktuj się w sprawie zamykania deal',
          urgency: 'medium'
        });
      }
    }

    return actions;
  }

  /**
   * Prepare data visualizations
   */
  private async prepareVisualizations(data: any, intent: any): Promise<ChartData[]> {
    const visualizations: ChartData[] = [];

    // Always include basic charts based on intent
    switch (intent.type) {
      case 'projects':
        if (data.projectStats) {
          visualizations.push({
            type: 'pie',
            title: 'Status projektów',
            data: data.projectStats.map((stat: any) => ({
              label: stat.status,
              value: stat._count.id
            }))
          });
        }
        break;
        
      case 'deals':
        if (data.dealStats) {
          visualizations.push({
            type: 'bar',
            title: 'Wartość deals według etapu',
            data: data.dealStats.map((stat: any) => ({
              label: stat.stage,
              value: stat._sum.value || 0
            }))
          });
        }
        break;
    }

    return visualizations;
  }

  /**
   * Generate response based primarily on RAG context
   * Used when RAG context is available and should be the primary source of information
   */
  private async generateRAGResponse(query: KnowledgeQuery): Promise<string> {
    try {
      console.log('🔍 Generating RAG-based response for:', query.question);

      // Get AI router for the organization
      const aiRouter = await this.getAIRouter(query.organizationId);

      // Get available AI providers
      const availableProviders = await this.getAvailableAIProviders(query.organizationId);

      if (availableProviders.length === 0) {
        console.log('NO AI PROVIDERS FOUND - USING RAG FALLBACK');
        return this.generateRAGFallbackResponse(query.ragContext || '', query.question);
      }

      const selectedModel = availableProviders[0];

      // RAG-focused prompt
      const systemPrompt = `Jesteś asystentem AI analizującym dane z bazy wiedzy CRM.
Twoim zadaniem jest odpowiedzieć na pytanie użytkownika WYŁĄCZNIE na podstawie dostarczonych dokumentów.

ZASADY:
- Odpowiadaj po polsku
- Bazuj TYLKO na dostarczonych dokumentach - NIE wymyślaj informacji
- Jeśli w dokumentach nie ma odpowiedzi, powiedz wprost że nie znalazłeś tej informacji
- Podaj konkretne dane z dokumentów (tytuły, treści, liczby)
- Formatuj odpowiedź czytelnie z użyciem emoji i list
- Jeśli dokumenty zawierają wiele wyników, podsumuj je liczbowo`;

      const userPrompt = `PYTANIE UŻYTKOWNIKA: "${query.question}"

DOKUMENTY Z BAZY WIEDZY:
${query.ragContext}

Na podstawie powyższych dokumentów, odpowiedz na pytanie użytkownika. Podaj konkretne informacje z dokumentów.`;

      const aiRequest = {
        model: selectedModel.name,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt }
        ],
        config: {
          temperature: 0.3, // Lower temperature for more factual responses
          maxTokens: 1500
        }
      };

      console.log('Sending RAG request to AI...');
      const aiResponse = await aiRouter.executeAIRequest(selectedModel.id, aiRequest);
      return aiResponse.content;

    } catch (error) {
      console.error('RAG response generation failed:', error);
      return this.generateRAGFallbackResponse(query.ragContext || '', query.question);
    }
  }

  /**
   * Fallback response when AI is not available but RAG context exists
   */
  private generateRAGFallbackResponse(ragContext: string, question: string): string {
    // Parse RAG context to extract useful info
    const lines = ragContext.split('\n').filter(l => l.trim());
    const documentCount = lines.filter(l => l.includes('[') || l.includes('Typ:')).length;

    if (documentCount === 0) {
      return `❌ Nie znaleziono dokumentów pasujących do zapytania: "${question}"

Spróbuj:
• Użyć innych słów kluczowych
• Zadać bardziej ogólne pytanie
• Sprawdzić sekcję RAG Search bezpośrednio`;
    }

    // Extract some content from RAG
    const preview = lines.slice(0, 10).join('\n');

    return `📚 Znaleziono dokumenty pasujące do zapytania: "${question}"

**Liczba dokumentów:** ~${documentCount}

**Fragment wyników:**
${preview}

_Uwaga: Asystent AI jest chwilowo niedostępny. Powyżej znajduje się surowy kontekst z bazy wiedzy. Użyj sekcji RAG Search aby zobaczyć pełne wyniki._`;
  }

  /**
   * Generate natural language response using AI
   */
  private async generateResponse(data: any, insights: Insight[], intent: any, query: KnowledgeQuery): Promise<string> {
    try {
      // Get AI router for the organization
      const aiRouter = await this.getAIRouter(query.organizationId);

      // Prepare context for AI
      const contextSummary = this.prepareDataSummary(data, intent);
      const insightsSummary = insights.map(i => `- ${i.title}: ${i.description}`).join('\n');

      // Try to load prompt from database using PromptManager
      const compiledPrompt = await PromptManager.compilePrompt('UNIVERSAL_ANALYZE', {
        variables: {
          context: contextSummary,
          inputData: JSON.stringify(data, null, 2),
          userRequest: query.question,
          availableActions: JSON.stringify(['analyze', 'summarize', 'recommend', 'visualize']),
          conversationHistory: insightsSummary
        },
        organizationId: query.organizationId
      });

      let systemPrompt: string;
      let userPrompt: string;

      // Prepare RAG context section if available
      const ragSection = query.ragContext ? `\n\nKONTEKST Z BAZY WIEDZY (RAG):\n${query.ragContext}` : '';

      if (compiledPrompt) {
        // Use prompt from database
        console.log('USING PROMPT FROM DATABASE: UNIVERSAL_ANALYZE');
        systemPrompt = compiledPrompt.systemPrompt;
        userPrompt = compiledPrompt.userPrompt + ragSection;
      } else {
        // Fallback to hardcoded prompt
        console.log('PROMPT NOT FOUND - USING HARDCODED FALLBACK');
        systemPrompt = `Jesteś inteligentnym asystentem analizującym dane systemu STREAMS.
        Odpowiadaj po polsku, konkretnie i pomocnie.
        Bazuj TYLKO na dostarczonych danych, nie wymyślaj informacji.
        Jeśli dostarczono kontekst z bazy wiedzy (RAG), wykorzystaj go w odpowiedzi.
        Formatuj odpowiedź z użyciem emoji i list gdzie to stosowne.`;

        userPrompt = `PYTANIE: "${query.question}"

DANE Z ANALIZY:
${contextSummary}

ZIDENTYFIKOWANE INSIGHTS:
${insightsSummary}
${ragSection}

Przeanalizuj te dane i odpowiedz na pytanie użytkownika. Podaj konkretne zalecenia i następne kroki.`;
      }

      // Try to get available AI models
      console.log('GETTING AVAILABLE AI PROVIDERS');
      const availableProviders = await this.getAvailableAIProviders(query.organizationId);
      console.log('AVAILABLE PROVIDERS:', availableProviders);

      if (availableProviders.length === 0) {
        console.log('NO AI PROVIDERS FOUND - USING STATIC RESPONSE');
        // Fallback to static responses if no AI configured
        return this.generateStaticResponse(data, insights, intent);
      }

      // Use requested provider or the first available model
      let selectedModel = availableProviders[0];

      if (query.providerId) {
        const requestedProvider = availableProviders.find(p => p.providerId === query.providerId);
        if (requestedProvider) {
          selectedModel = requestedProvider;
          console.log('USING REQUESTED PROVIDER:', requestedProvider.providerName);
        } else {
          console.log('REQUESTED PROVIDER NOT FOUND, USING DEFAULT:', selectedModel.providerName);
        }
      }

      // Use model and temperature from prompt if available
      const temperature = compiledPrompt?.temperature ?? 0.7;
      const maxTokens = compiledPrompt?.maxTokens ?? 1000;

      const aiRequest = {
        model: selectedModel.name,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt }
        ],
        config: {
          temperature,
          maxTokens
        }
      };

      const aiResponse = await aiRouter.executeAIRequest(selectedModel.id, aiRequest);
      return aiResponse.content;

    } catch (error) {
      console.error('AI response generation failed:', error);
      // Fallback to static response
      return this.generateStaticResponse(data, insights, intent);
    }
  }

  /**
   * Prepare data summary for AI context
   */
  private prepareDataSummary(data: any, intent: any): string {
    switch (intent.type) {
      case 'streams':
        const { mostImportant, summary, sortedByImportance } = data;
        let streamSummary = `Analiza strumieni: ${summary?.totalStreams || 0} strumieni\n`;
        streamSummary += `- Strumienie krytyczne: ${summary?.criticalStreams || 0}\n`;
        streamSummary += `- Strumienie pilne: ${summary?.highUrgencyStreams || 0}\n`;
        streamSummary += `- Łącznie zaległych zadań: ${summary?.totalOverdue || 0}\n\n`;

        if (sortedByImportance && sortedByImportance.length > 0) {
          streamSummary += `Ranking strumieni wg ważności:\n`;
          sortedByImportance.slice(0, 5).forEach((stream: any, index: number) => {
            streamSummary += `${index + 1}. ${stream.name} (score: ${stream.importanceScore}, zadań: ${stream.totalTasks}, zaległych: ${stream.overdueTasks})\n`;
          });
        }

        if (mostImportant) {
          streamSummary += `\nNajważniejszy: ${mostImportant.name} - ${mostImportant.urgencyLevel} urgency`;
        }
        return streamSummary;

      case 'projects':
        const { projects, riskAnalysis } = data;
        return `Analizowane projekty: ${projects?.length || 0}
        - Wysokie ryzyko: ${riskAnalysis?.highRisk?.length || 0}
        - Średnie ryzyko: ${riskAnalysis?.mediumRisk?.length || 0}
        - Możliwości: ${riskAnalysis?.opportunities?.length || 0}`;
        
      case 'deals':
        const { deals, predictions } = data;
        const totalValue = deals?.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) || 0;
        const highProbDeals = predictions?.filter((d: any) => d.probability > 0.8)?.length || 0;
        return `Aktywne deals: ${deals?.length || 0} (wartość: $${totalValue.toLocaleString()})
        - Wysokie prawdopodobieństwo zamknięcia: ${highProbDeals}`;
        
      case 'tasks':
        const { userTasks, overdueCount, todayTasks } = data;
        return `Zadania użytkownika: ${userTasks?.length || 0}
        - Po terminie: ${overdueCount || 0}
        - Na dziś: ${todayTasks?.length || 0}`;
        
      case 'productivity':
        const { weeklyStats } = data;
        const completed = weeklyStats?.find((s: any) => s.status === 'COMPLETED')?._count?.id || 0;
        const total = weeklyStats?.reduce((sum: any, stat: any) => sum + stat._count.id, 0) || 0;
        return `Produktywność (ten tydzień): ${completed}/${total} zadań ukończonych`;
        
      default: {
        const generalSummary = data.summary;
        return `Stan organizacji:
        - Aktywne projekty: ${generalSummary?.activeProjects || 0}
        - Aktywne zadania: ${generalSummary?.activeTasks || 0}
        - Aktywne deals: ${generalSummary?.activeDeals || 0}`;
      }
    }
  }

  /**
   * Get available AI providers for organization
   */
  public async getAvailableAIProviders(organizationId: string): Promise<Array<{id: string, name: string, provider: string, providerId: string, providerName: string}>> {
    try {
      const providers = await prisma.ai_providers.findMany({
        where: {
          organizationId,
          status: 'ACTIVE'
        },
        include: {
          ai_models: {
            where: { status: 'ACTIVE' }
          }
        },
        orderBy: { priority: 'asc' } // Use provider with lowest priority number first
      });

      const availableModels: Array<{id: string, name: string, provider: string, providerId: string, providerName: string}> = [];

      for (const provider of providers) {
        for (const model of provider.ai_models) {
          availableModels.push({
            id: model.id,
            name: model.name,
            provider: provider.name,
            providerId: provider.id,
            providerName: provider.displayName
          });
        }
      }

      return availableModels;
    } catch (error) {
      console.error('Failed to get available AI providers:', error);
      return [];
    }
  }

  /**
   * Fallback to static responses when AI is not available
   */
  private generateStaticResponse(data: any, insights: Insight[], intent: any): string {
    // Return honest message when AI is not available instead of fake responses
    const typeMessages: Record<string, string> = {
      streams: 'strumieni',
      projects: 'projektów',
      deals: 'transakcji',
      tasks: 'zadań',
      productivity: 'produktywności',
      communication: 'komunikacji'
    };

    const typeMsg = typeMessages[intent.type] || 'danych';

    return `⚠️ **Asystent AI jest chwilowo niedostępny**

Nie mogę teraz przeanalizować Twojego pytania dotyczącego ${typeMsg}.

**Co możesz zrobić:**
• Spróbuj ponownie za chwilę
• Sprawdź dane bezpośrednio w odpowiedniej sekcji aplikacji
• Użyj wyszukiwania RAG do znalezienia konkretnych informacji

**Dostępne sekcje:**
• Strumienie → menu "Wszystkie strumienie"
• Projekty → menu "Projekty"
• Zadania → menu "Zadania"
• RAG Search → semantyczne wyszukiwanie w bazie wiedzy

_Przepraszamy za niedogodności._`;
  }

  /**
   * Helper methods for specific response generation
   */
  private generateStreamResponse(data: any, insights: Insight[]): string {
    const { mostImportant, sortedByImportance, summary } = data;

    if (!mostImportant || sortedByImportance.length === 0) {
      return 'Nie znaleziono żadnych strumieni w Twojej organizacji. Utwórz strumienie, aby móc zarządzać przepływem pracy.';
    }

    let response = `Na podstawie analizy ${summary.totalStreams} strumieni:\n\n`;

    // Most important stream
    response += `🎯 NAJWAŻNIEJSZY STRUMIEŃ:\n`;
    const urgencyEmoji = mostImportant.urgencyLevel === 'critical' ? '🔴' :
                         mostImportant.urgencyLevel === 'high' ? '🟠' :
                         mostImportant.urgencyLevel === 'medium' ? '🟡' : '🟢';
    response += `${urgencyEmoji} **${mostImportant.name}**\n`;
    response += `   • Zadania aktywne: ${mostImportant.totalTasks}\n`;
    response += `   • Zaległe: ${mostImportant.overdueTasks}\n`;
    response += `   • Pilne (HIGH): ${mostImportant.highPriorityTasks}\n`;
    response += `   • Aktywne projekty: ${mostImportant.activeProjects}\n`;
    response += `   • Wynik ważności: ${mostImportant.importanceScore}\n\n`;

    // Show top 3 high priority tasks if available
    if (mostImportant.highPriority && mostImportant.highPriority.length > 0) {
      response += `⚡ Pilne zadania w tym strumieniu:\n`;
      mostImportant.highPriority.forEach((task: any, i: number) => {
        response += `   ${i + 1}. ${task.title}\n`;
      });
      response += '\n';
    }

    // Show other streams ranking
    if (sortedByImportance.length > 1) {
      response += `📊 RANKING POZOSTAŁYCH STRUMIENI:\n`;
      sortedByImportance.slice(1, 4).forEach((stream: any, index: number) => {
        const emoji = stream.urgencyLevel === 'critical' ? '🔴' :
                      stream.urgencyLevel === 'high' ? '🟠' :
                      stream.urgencyLevel === 'medium' ? '🟡' : '🟢';
        response += `${index + 2}. ${emoji} ${stream.name} - ${stream.totalTasks} zadań`;
        if (stream.overdueTasks > 0) {
          response += ` (${stream.overdueTasks} zaległych)`;
        }
        response += '\n';
      });
      response += '\n';
    }

    // Recommendations
    response += `💡 REKOMENDACJA:\n`;
    if (mostImportant.overdueTasks > 0) {
      response += `Skup się na strumienie "${mostImportant.name}" - masz ${mostImportant.overdueTasks} zaległych zadań!\n`;
    } else if (mostImportant.highPriorityTasks > 0) {
      response += `Zacznij od pilnych zadań w strumienie "${mostImportant.name}"\n`;
    } else {
      response += `Strumień "${mostImportant.name}" ma najwięcej aktywności - warto go przejrzeć.\n`;
    }

    return response;
  }

  private generateProjectResponse(data: any, insights: Insight[]): string {
    const { projects, riskAnalysis } = data;
    
    let response = `Na podstawie analizy ${projects.length} projektów:\n\n`;
    
    if (riskAnalysis.highRisk.length > 0) {
      response += `🔴 WYSOKIE RYZYKO (${riskAnalysis.highRisk.length} projektów):\n`;
      riskAnalysis.highRisk.slice(0, 3).forEach((project: any) => {
        response += `• "${project.name}" - ${project.reason}\n`;
      });
      response += '\n';
    }
    
    if (riskAnalysis.mediumRisk.length > 0) {
      response += `⚠️ ŚREDNIE RYZYKO (${riskAnalysis.mediumRisk.length} projektów)\n\n`;
    }
    
    response += '🎯 REKOMENDACJE:\n';
    response += '1. Priorytetyzuj projekty wysokiego ryzyka\n';
    response += '2. Sprawdź dostępność zasobów\n';
    response += '3. Zaplanuj spotkania z zespołami\n';
    
    return response;
  }

  private generateDealResponse(data: any, insights: Insight[]): string {
    const { deals, predictions } = data;
    const totalValue = deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
    
    let response = `Analiza ${deals.length} aktywnych deals (łączna wartość: $${totalValue.toLocaleString()}):\n\n`;
    
    const highProb = predictions.filter((d: any) => d.probability > 0.8);
    if (highProb.length > 0) {
      response += `🎯 WYSOKIE PRAWDOPODOBIEŃSTWO (85-95%):\n`;
      highProb.slice(0, 3).forEach((deal: any) => {
        response += `• ${deal.title} ($${deal.value.toLocaleString()}) - ${Math.round(deal.probability * 100)}%\n`;
      });
      response += '\n';
    }
    
    const mediumProb = predictions.filter((d: any) => d.probability >= 0.6 && d.probability <= 0.8);
    if (mediumProb.length > 0) {
      response += `💰 ŚREDNIE PRAWDOPODOBIEŃSTWO (60-80%):\n`;
      mediumProb.slice(0, 2).forEach((deal: any) => {
        response += `• ${deal.title} ($${deal.value.toLocaleString()})\n`;
      });
      response += '\n';
    }
    
    response += '🎯 AKCJE PRIORYTETOWE:\n';
    response += '1. Follow-up z najważniejszymi klientami\n';
    response += '2. Przygotuj oferty finalne\n';
    response += '3. Zaplanuj demo/prezentacje\n';
    
    return response;
  }

  private generateTaskResponse(data: any, insights: Insight[]): string {
    const { userTasks, overdueCount, prioritization } = data;
    
    let response = 'Na podstawie analizy Twoich zadań:\n\n';
    
    if (overdueCount > 0) {
      response += `⏰ OVERDUE (NATYCHMIAST):\n• ${overdueCount} zadań po terminie\n\n`;
    }
    
    if (prioritization.urgent.length > 0) {
      response += `⚡ TOP PRIORYTETY:\n`;
      prioritization.urgent.slice(0, 3).forEach((task: any, index: number) => {
        response += `${index + 1}. 🔥 "${task.title}" - ${task.priority} priority\n`;
      });
      response += '\n';
    }
    
    response += '🎯 REKOMENDACJA:\n';
    if (overdueCount > 0) {
      response += 'Zacznij od overdue tasks, potem przejdź do priorytetów\n';
    } else {
      response += 'Skup się na zadaniach wysokiego priorytetu w swojej najefektywniejszej porze dnia\n';
    }
    
    return response;
  }

  private generateProductivityResponse(data: any, insights: Insight[]): string {
    const { weeklyStats, recommendations } = data;
    
    const completed = weeklyStats.find((s: any) => s.status === 'COMPLETED')?._count.id || 0;
    const total = weeklyStats.reduce((sum: any, stat: any) => sum + stat._count.id, 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let response = `Analiza produktywności (ten tydzień):\n\n`;
    response += `📊 STATYSTYKI:\n`;
    response += `• ${completed}/${total} zadań ukończonych (${completionRate}%)\n`;
    
    if (recommendations.bestContext) {
      response += `• Najefektywniejszy kontekst: ${recommendations.bestContext.name} (${Math.round(recommendations.bestContext.completionRate)}%)\n`;
    }
    
    response += '\n🚀 REKOMENDACJE:\n';
    response += '• Scheduluj trudne zadania w najefektywniejszym kontekście\n';
    response += '• Grupuj podobne zadania razem\n';
    response += '• Regularnie przeglądaj i aktualizuj priorytety\n';
    
    return response;
  }

  private generateGeneralResponse(data: any, insights: Insight[]): string {
    const { summary } = data;
    
    let response = 'Podsumowanie organizacji:\n\n';
    response += `📊 AKTYWNE:\n`;
    response += `• ${summary.activeProjects} projektów\n`;
    response += `• ${summary.activeTasks} zadań\n`;
    response += `• ${summary.activeDeals} deals\n`;
    response += `• ${summary.totalUsers} użytkowników\n\n`;
    
    if (insights.length > 0) {
      response += '💡 KLUCZOWE INSIGHTS:\n';
      insights.slice(0, 3).forEach((insight, index) => {
        response += `${index + 1}. ${insight.title}\n`;
      });
    }
    
    return response;
  }

  /**
   * Helper analysis methods
   */
  private analyzeProjectRisks(projects: any[], overdueTasks: any[]): any {
    const highRisk: any[] = [];
    const mediumRisk: any[] = [];
    const opportunities: any[] = [];

    projects.forEach(project => {
      const projectOverdue = overdueTasks.filter(task => task.project?.id === project.id).length;
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((task: any) => task.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // High risk criteria
      if (projectOverdue > 2 || (progress < 30 && project.dueDate && new Date(project.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))) {
        highRisk.push({
          ...project,
          reason: projectOverdue > 2 ? `${projectOverdue} overdue tasks` : 'Low progress, deadline approaching'
        });
      }
      // Medium risk criteria
      else if (projectOverdue > 0 || progress < 50) {
        mediumRisk.push({
          ...project,
          reason: projectOverdue > 0 ? `${projectOverdue} overdue tasks` : 'Below 50% progress'
        });
      }
      // Opportunities
      else if (progress > 80) {
        opportunities.push({
          ...project,
          reason: 'High progress, consider early completion'
        });
      }
    });

    return { highRisk, mediumRisk, opportunities };
  }

  private predictDealSuccess(deals: any[]): any[] {
    return deals.map(deal => {
      let probability = 0.5; // Base probability

      // Stage-based probability
      const stageProbabilities: { [key: string]: number } = {
        'QUALIFICATION': 0.3,
        'NEEDS_ANALYSIS': 0.4,
        'PROPOSAL': 0.6,
        'NEGOTIATION': 0.8,
        'CLOSED_WON': 1.0,
        'CLOSED_LOST': 0.0
      };

      probability = stageProbabilities[deal.stage] || 0.5;

      // Adjust based on value (higher value = more attention = higher probability)
      if (deal.value > 50000) probability += 0.1;
      if (deal.value > 100000) probability += 0.1;

      // Adjust based on recent activity
      const daysSinceUpdate = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > 14) probability -= 0.2;
      if (daysSinceUpdate > 30) probability -= 0.3;

      return {
        ...deal,
        probability: Math.max(0, Math.min(1, probability))
      };
    });
  }

  private prioritizeTasks(tasks: any[]): any {
    const urgent = tasks.filter(task => 
      task.priority === 'HIGH' || 
      (task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000))
    );

    const important = tasks.filter(task => 
      task.priority === 'MEDIUM' && 
      !urgent.includes(task)
    );

    const routine = tasks.filter(task => 
      !urgent.includes(task) && 
      !important.includes(task)
    );

    return { urgent, important, routine };
  }

  private generateProductivityRecommendations(weeklyStats: any[], completionRates: any[], timePatterns: any[]): any {
    // Find best context by completion rate
    const contextStats: { [key: string]: { completed: number; total: number } } = {};
    
    completionRates.forEach(rate => {
      const contextId = rate.contextId || 'no-context';
      if (!contextStats[contextId]) {
        contextStats[contextId] = { completed: 0, total: 0 };
      }
      
      contextStats[contextId].total += rate._count.id;
      if (rate.status === 'COMPLETED') {
        contextStats[contextId].completed += rate._count.id;
      }
    });

    let bestContext = null;
    let highestRate = 0;

    Object.entries(contextStats).forEach(([contextId, stats]) => {
      const rate = stats.total > 0 ? stats.completed / stats.total : 0;
      if (rate > highestRate) {
        highestRate = rate;
        bestContext = {
          id: contextId,
          name: contextId === 'no-context' ? 'Bez kontekstu' : `Context ${contextId}`,
          completionRate: rate * 100
        };
      }
    });

    return { bestContext };
  }

  private async analyzeSentiment(messages: any[]): Promise<any> {
    // Simple sentiment analysis based on keywords
    const positiveKeywords = ['dzięki', 'świetnie', 'doskonale', 'tak', 'zgoda', 'super'];
    const negativeKeywords = ['problem', 'błąd', 'nie', 'nieprawda', 'źle', 'trudność'];

    let positive = 0;
    let negative = 0;
    let neutral = 0;

    messages.forEach(message => {
      const content = message.content.toLowerCase();
      const positiveMatches = positiveKeywords.filter(keyword => content.includes(keyword)).length;
      const negativeMatches = negativeKeywords.filter(keyword => content.includes(keyword)).length;

      if (positiveMatches > negativeMatches) {
        positive++;
      } else if (negativeMatches > positiveMatches) {
        negative++;
      } else {
        neutral++;
      }
    });

    const total = messages.length;
    return {
      positive: total > 0 ? (positive / total) * 100 : 0,
      negative: total > 0 ? (negative / total) * 100 : 0,
      neutral: total > 0 ? (neutral / total) * 100 : 0,
      trend: positive > negative ? 'improving' : negative > positive ? 'declining' : 'stable'
    };
  }

  private calculateConfidence(data: any, insights: Insight[]): number {
    // Base confidence on data availability and insights quality
    let confidence = 0.7;

    // Increase confidence based on data richness
    if (data && Object.keys(data).length > 3) confidence += 0.1;
    if (insights && insights.length > 0) confidence += 0.1;
    if (insights && insights.some(i => i.priority === 'high' || i.priority === 'critical')) confidence += 0.1;

    return Math.min(0.95, confidence);
  }
}