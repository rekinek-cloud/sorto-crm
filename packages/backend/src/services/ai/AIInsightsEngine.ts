import { prisma } from '../../config/database';
import logger from '../../config/logger';
import { AIModel, AIProvider } from '@prisma/client';

export interface AIInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'prediction' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number; // 0-100
  data: any;
  actions: AIAction[];
  context: {
    streamId?: string;
    taskId?: string;
    contactId?: string;
    companyId?: string;
    dealId?: string;
  };
  createdAt: Date;
  expiresAt?: Date;
}

export interface AIAction {
  type: 'call' | 'email' | 'schedule' | 'create_task' | 'update_deal' | 'notify';
  label: string;
  data: any;
  primary?: boolean;
}

export interface CommunicationPattern {
  contactId: string;
  frequency: number; // messages per week
  responseTime: number; // average hours
  preferredTime: string; // preferred contact time
  sentiment: 'positive' | 'neutral' | 'negative';
  engagement: number; // 0-100
}

export interface TaskPattern {
  assigneeId: string;
  avgCompletionTime: number; // hours
  overdueRate: number; // 0-1
  preferredTaskTypes: string[];
  productivityPeaks: string[]; // hours of day
}

export interface DealPattern {
  stageVelocity: { [stage: string]: number }; // days in stage
  winProbability: number; // 0-1
  riskFactors: string[];
  nextBestAction: string;
}

export class AIInsightsEngine {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Generate comprehensive AI insights for streams
   */
  async generateStreamInsights(streamId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      // Get stream data with relationships
      const stream = await prisma.stream.findUnique({
        where: { id: streamId, organizationId: this.organizationId },
        include: {
          tasks: {
            include: {
              assignee: true,
              messages: true
            }
          },
          projects: {
            include: {
              deals: true,
              assignee: true
            }
          },
          channels: {
            include: {
              channel: {
                include: {
                  messages: {
                    orderBy: { receivedAt: 'desc' },
                    take: 50
                  }
                }
              }
            }
          }
        }
      });

      if (!stream) return insights;

      // 1. Task Performance Analysis
      const taskInsights = await this.analyzeTaskPerformance(stream);
      insights.push(...taskInsights);

      // 2. Communication Pattern Analysis
      const commInsights = await this.analyzeCommunicationPatterns(stream);
      insights.push(...commInsights);

      // 3. Risk Detection
      const riskInsights = await this.detectRisks(stream);
      insights.push(...riskInsights);

      // 4. Opportunity Detection
      const opportunityInsights = await this.detectOpportunities(stream);
      insights.push(...opportunityInsights);

      // 5. Predictive Analytics
      const predictions = await this.generatePredictions(stream);
      insights.push(...predictions);

      return insights.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      logger.error('Error generating stream insights:', error);
      return [];
    }
  }

  /**
   * Analyze task completion patterns and team performance
   */
  private async analyzeTaskPerformance(stream: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const tasks = stream.tasks;

    // Calculate metrics
    const overdueTasks = tasks.filter((t: any) => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
    );
    
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
    const avgCompletionTime = this.calculateAvgCompletionTime(completedTasks);

    // Generate insights
    if (overdueTasks.length > 0) {
      const totalValue = this.calculateStreamValue(stream);
      
      insights.push({
        id: `task-overdue-${stream.id}`,
        type: 'alert',
        priority: overdueTasks.length > 3 ? 'critical' : 'high',
        title: `${overdueTasks.length} tasks overdue in ${stream.name}`,
        description: totalValue > 10000 
          ? `Critical: Overdue tasks affecting high-value stream ($${totalValue.toLocaleString()})`
          : `${overdueTasks.length} tasks need immediate attention`,
        confidence: 95,
        data: { overdueTasks, totalValue },
        actions: [
          {
            type: 'schedule',
            label: 'Schedule Team Meeting',
            data: { type: 'urgent_review', participants: this.getStreamMembers(stream) },
            primary: true
          },
          {
            type: 'notify',
            label: 'Notify Manager',
            data: { urgency: 'high', context: 'overdue_tasks' }
          }
        ],
        context: { streamId: stream.id },
        createdAt: new Date()
      });
    }

    // Productivity insights
    if (avgCompletionTime > 0) {
      const benchmark = await this.getBenchmarkCompletionTime();
      const performance = avgCompletionTime / benchmark;

      if (performance > 1.5) {
        insights.push({
          id: `task-slow-${stream.id}`,
          type: 'recommendation',
          priority: 'medium',
          title: 'Tasks taking longer than expected',
          description: `Tasks in this stream take ${Math.round(performance * 100)}% longer than organization average`,
          confidence: 78,
          data: { avgTime: avgCompletionTime, benchmark, performance },
          actions: [
            {
              type: 'create_task',
              label: 'Schedule Process Review',
              data: { title: 'Review task estimation process', priority: 'MEDIUM' }
            }
          ],
          context: { streamId: stream.id },
          createdAt: new Date()
        });
      }
    }

    return insights;
  }

  /**
   * Analyze communication patterns for optimization
   */
  private async analyzeCommunicationPatterns(stream: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Get all messages related to stream
    const messages = stream.channels
      .flatMap((sc: any) => sc.channel.messages)
      .sort((a: any, b: any) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    if (messages.length === 0) return insights;

    // Analyze communication gaps
    const lastMessage = messages[0];
    const daysSinceLastContact = (Date.now() - new Date(lastMessage.receivedAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastContact > 5) {
      const relatedDeals = await this.getRelatedDeals(stream);
      const highValueDeals = relatedDeals.filter(d => (d.value || 0) > 25000);

      if (highValueDeals.length > 0) {
        insights.push({
          id: `comm-gap-${stream.id}`,
          type: 'opportunity',
          priority: 'high',
          title: 'Communication gap detected',
          description: `No contact in ${Math.round(daysSinceLastContact)} days with high-value prospects`,
          confidence: 85,
          data: { daysSinceLastContact, deals: highValueDeals, lastMessage },
          actions: [
            {
              type: 'call',
              label: 'Schedule Follow-up Call',
              data: { contacts: this.extractContacts(highValueDeals) },
              primary: true
            },
            {
              type: 'email',
              label: 'Send Progress Update',
              data: { template: 'progress_update', personalized: true }
            }
          ],
          context: { streamId: stream.id },
          createdAt: new Date()
        });
      }
    }

    // Sentiment analysis
    const sentiment = await this.analyzeSentiment(messages);
    if (sentiment.overall < 0.4) {
      insights.push({
        id: `sentiment-${stream.id}`,
        type: 'alert',
        priority: 'medium',
        title: 'Communication sentiment declining',
        description: `Recent messages show ${sentiment.trend} sentiment trend`,
        confidence: 72,
        data: { sentiment, recentMessages: messages.slice(0, 5) },
        actions: [
          {
            type: 'schedule',
            label: 'Schedule Check-in Call',
            data: { purpose: 'relationship_maintenance' }
          }
        ],
        context: { streamId: stream.id },
        createdAt: new Date()
      });
    }

    return insights;
  }

  /**
   * Detect risks in stream execution
   */
  private async detectRisks(stream: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Resource allocation risk
    const teamMembers = this.getStreamMembers(stream);
    const workload = await this.calculateTeamWorkload(teamMembers);
    
    const overloadedMembers = workload.filter(w => w.capacity > 1.2);
    if (overloadedMembers.length > 0) {
      insights.push({
        id: `resource-risk-${stream.id}`,
        type: 'alert',
        priority: 'high',
        title: 'Team overload detected',
        description: `${overloadedMembers.length} team members at >120% capacity`,
        confidence: 88,
        data: { overloadedMembers, workload },
        actions: [
          {
            type: 'create_task',
            label: 'Rebalance Workload',
            data: { title: 'Review and redistribute tasks', priority: 'HIGH' }
          }
        ],
        context: { streamId: stream.id },
        createdAt: new Date()
      });
    }

    // Deal velocity risk
    const deals = await this.getRelatedDeals(stream);
    for (const deal of deals) {
      const velocity = await this.calculateDealVelocity(deal);
      if (velocity.risk > 0.7) {
        insights.push({
          id: `deal-risk-${deal.id}`,
          type: 'alert',
          priority: 'critical',
          title: `Deal "${deal.title}" at risk`,
          description: `${Math.round(velocity.risk * 100)}% probability of deal loss`,
          confidence: velocity.confidence,
          data: { deal, velocity },
          actions: [
            {
              type: 'call',
              label: 'Emergency Call with Client',
              data: { urgency: 'critical', context: deal },
              primary: true
            },
            {
              type: 'notify',
              label: 'Escalate to Manager',
              data: { level: 'critical', deal }
            }
          ],
          context: { streamId: stream.id, dealId: deal.id },
          createdAt: new Date()
        });
      }
    }

    return insights;
  }

  /**
   * Detect opportunities for growth
   */
  private async detectOpportunities(stream: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Cross-sell opportunities
    const companies = await this.getRelatedCompanies(stream);
    for (const company of companies) {
      const opportunities = await this.findCrossSellOpportunities(company);
      
      if (opportunities.length > 0) {
        insights.push({
          id: `crosssell-${company.id}`,
          type: 'opportunity',
          priority: 'medium',
          title: `Cross-sell opportunity at ${company.name}`,
          description: `${opportunities.length} additional services could be relevant`,
          confidence: opportunities[0].confidence,
          data: { company, opportunities },
          actions: [
            {
              type: 'create_task',
              label: 'Prepare Proposal',
              data: { title: `Cross-sell proposal for ${company.name}`, priority: 'MEDIUM' }
            },
            {
              type: 'schedule',
              label: 'Schedule Sales Call',
              data: { company, purpose: 'cross_sell' }
            }
          ],
          context: { streamId: stream.id, companyId: company.id },
          createdAt: new Date()
        });
      }
    }

    return insights;
  }

  /**
   * Generate predictions using ML-like analysis
   */
  private async generatePredictions(stream: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Project completion prediction
    const projects = stream.projects;
    for (const project of projects) {
      const prediction = await this.predictProjectCompletion(project);
      
      if (Math.abs(prediction.daysOff) > 3) {
        insights.push({
          id: `prediction-${project.id}`,
          type: 'prediction',
          priority: prediction.daysOff > 0 ? 'medium' : 'low',
          title: `Project "${project.name}" completion forecast`,
          description: prediction.daysOff > 0 
            ? `Likely to finish ${Math.round(prediction.daysOff)} days late`
            : `Expected to finish ${Math.abs(Math.round(prediction.daysOff))} days early`,
          confidence: prediction.confidence,
          data: { project, prediction },
          actions: prediction.daysOff > 0 ? [
            {
              type: 'schedule',
              label: 'Schedule Sprint Review',
              data: { project, urgency: 'medium' }
            }
          ] : [],
          context: { streamId: stream.id, projectId: project.id },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      }
    }

    return insights;
  }

  // Helper methods
  private calculateAvgCompletionTime(tasks: any[]): number {
    const completedTasks = tasks.filter(t => t.completedAt && t.createdAt);
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      const time = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
      return sum + time;
    }, 0);
    
    return totalTime / completedTasks.length / (1000 * 60 * 60); // hours
  }

  private calculateStreamValue(stream: any): number {
    return stream.projects.reduce((sum: number, project: any) => {
      return sum + (project.deals || []).reduce((dealSum: number, deal: any) => {
        return dealSum + (deal.value || 0);
      }, 0);
    }, 0);
  }

  private getStreamMembers(stream: any): string[] {
    const members = new Set<string>();
    stream.tasks.forEach((task: any) => {
      if (task.assignee?.id) members.add(task.assignee.id);
    });
    stream.projects.forEach((project: any) => {
      if (project.assignee?.id) members.add(project.assignee.id);
    });
    return Array.from(members);
  }

  private async getBenchmarkCompletionTime(): Promise<number> {
    // Calculate organization average
    const result = await prisma.task.aggregate({
      where: {
        organizationId: this.organizationId,
        status: 'COMPLETED',
        completedAt: { not: null },
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // last 90 days
      },
      _avg: {
        estimatedHours: true
      }
    });
    
    return result._avg.estimatedHours || 8; // default 8 hours
  }

  private async getRelatedDeals(stream: any): Promise<any[]> {
    return stream.projects.flatMap((p: any) => p.deals || []);
  }

  private async getRelatedCompanies(stream: any): Promise<any[]> {
    const deals = await this.getRelatedDeals(stream);
    const companyIds = [...new Set(deals.map(d => d.companyId).filter(Boolean))];
    
    return prisma.company.findMany({
      where: { id: { in: companyIds }, organizationId: this.organizationId },
      include: { deals: true, assignedContacts: true }
    });
  }

  private extractContacts(deals: any[]): any[] {
    return deals.map(deal => deal.contact).filter(Boolean);
  }

  private async analyzeSentiment(messages: any[]): Promise<{ overall: number; trend: string; confidence: number }> {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['great', 'excellent', 'perfect', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['problem', 'issue', 'concern', 'delay', 'frustrated', 'disappointed'];
    
    let sentimentScore = 0;
    let wordCount = 0;
    
    messages.slice(0, 10).forEach(msg => {
      const content = (msg.content || '').toLowerCase();
      const words = content.split(/\s+/);
      
      words.forEach(word => {
        if (positiveWords.includes(word)) sentimentScore += 1;
        if (negativeWords.includes(word)) sentimentScore -= 1;
        wordCount++;
      });
    });
    
    const overall = wordCount > 0 ? Math.max(0, Math.min(1, (sentimentScore / wordCount + 1) / 2)) : 0.5;
    const trend = sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral';
    
    return { overall, trend, confidence: Math.min(90, wordCount * 2) };
  }

  private async calculateTeamWorkload(memberIds: string[]): Promise<{ userId: string; capacity: number; tasks: number }[]> {
    const workloads = [];
    
    for (const userId of memberIds) {
      const activeTasks = await prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          organizationId: this.organizationId
        }
      });
      
      // Assume 8 tasks = 100% capacity
      const capacity = activeTasks / 8;
      workloads.push({ userId, capacity, tasks: activeTasks });
    }
    
    return workloads;
  }

  private async calculateDealVelocity(deal: any): Promise<{ risk: number; confidence: number; factors: string[] }> {
    const factors = [];
    let risk = 0;
    
    // Time in current stage
    const stageTime = Date.now() - new Date(deal.updatedAt).getTime();
    const daysinStage = stageTime / (1000 * 60 * 60 * 24);
    
    if (daysinStage > 30) {
      risk += 0.3;
      factors.push('Long time in current stage');
    }
    
    // Communication frequency
    const recentMessages = await prisma.message.count({
      where: {
        dealId: deal.id,
        receivedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
      }
    });
    
    if (recentMessages === 0) {
      risk += 0.4;
      factors.push('No recent communication');
    }
    
    // Deal value vs average
    const avgDealValue = await this.getAvgDealValue();
    if (deal.value && deal.value > avgDealValue * 2) {
      risk += 0.1; // High value deals are riskier
      factors.push('High value deal');
    }
    
    return { risk: Math.min(1, risk), confidence: 75, factors };
  }

  private async findCrossSellOpportunities(company: any): Promise<{ service: string; confidence: number; reason: string }[]> {
    const opportunities = [];
    
    // Simple rule-based cross-sell detection
    const existingServices = await prisma.deal.findMany({
      where: { companyId: company.id, status: 'WON' },
      select: { title: true, value: true }
    });
    
    const hasWebsiteService = existingServices.some(s => s.title?.toLowerCase().includes('website'));
    const hasSEOService = existingServices.some(s => s.title?.toLowerCase().includes('seo'));
    
    if (hasWebsiteService && !hasSEOService) {
      opportunities.push({
        service: 'SEO Optimization',
        confidence: 78,
        reason: 'Has website service but no SEO optimization'
      });
    }
    
    return opportunities;
  }

  private async predictProjectCompletion(project: any): Promise<{ daysOff: number; confidence: number; factors: string[] }> {
    const factors = [];
    
    // Get project tasks
    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
      select: { status: true, dueDate: true, estimatedHours: true, completedAt: true }
    });
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    // Simple linear projection
    const remainingTasks = totalTasks - completedTasks;
    const avgCompletionTime = this.calculateAvgCompletionTime(tasks.filter(t => t.completedAt));
    
    let daysOff = 0;
    let confidence = 60;
    
    if (project.dueDate) {
      const dueDate = new Date(project.dueDate);
      const estimatedDays = remainingTasks * (avgCompletionTime / 8); // 8 hours per day
      const actualDueInDays = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      
      daysOff = estimatedDays - actualDueInDays;
      confidence = Math.min(90, completionRate * 100);
      
      if (completionRate < 0.3) factors.push('Low completion rate');
      if (avgCompletionTime > 16) factors.push('Tasks taking longer than expected');
    }
    
    return { daysOff, confidence, factors };
  }

  private async getAvgDealValue(): Promise<number> {
    const result = await prisma.deal.aggregate({
      where: { organizationId: this.organizationId },
      _avg: { value: true }
    });
    
    return result._avg.value || 10000;
  }
}