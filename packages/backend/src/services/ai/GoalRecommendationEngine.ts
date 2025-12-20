import { PrismaClient } from '@prisma/client';
import logger from '../../config/logger';

interface UserContext {
  userId: string;
  organizationId: string;
  recentTasks: any[];
  recentProjects: any[];
  completionRate: number;
  averageTaskDuration: number;
  preferredContexts: string[];
  workingHours: { start: string; end: string };
  timezone: string;
}

interface GoalRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'PRODUCTIVITY' | 'LEARNING' | 'HEALTH' | 'CAREER' | 'BUSINESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedDuration: string; // "2 weeks", "1 month", etc.
  confidence: number; // 0-100
  reasoning: string;
  suggestedActions: string[];
  smartCriteria: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  };
  potentialImpact: number; // 0-100
  requiredResources: string[];
  milestones: Array<{
    title: string;
    description: string;
    targetDate: string;
    successCriteria: string;
  }>;
}

export class GoalRecommendationEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async generateRecommendations(userId: string): Promise<GoalRecommendation[]> {
    try {
      logger.info('Generating AI goal recommendations', { userId });

      // Gather user context
      const context = await this.gatherUserContext(userId);
      
      // Analyze patterns and generate recommendations
      const recommendations = await this.analyzeAndRecommend(context);
      
      // Score and rank recommendations
      const rankedRecommendations = this.rankRecommendations(recommendations, context);
      
      logger.info('Successfully generated goal recommendations', { 
        userId, 
        count: rankedRecommendations.length 
      });

      return rankedRecommendations.slice(0, 8); // Return top 8 recommendations
    } catch (error) {
      logger.error('Failed to generate goal recommendations', { userId, error });
      return this.getFallbackRecommendations();
    }
  }

  private async gatherUserContext(userId: string): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get recent tasks (last 30 days)
    const recentTasks = await this.prisma.task.findMany({
      where: {
        createdById: userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        context: true,
        project: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Get recent projects
    const recentProjects = await this.prisma.project.findMany({
      where: {
        createdById: userId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Calculate completion rate
    const completedTasks = recentTasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = recentTasks.length > 0 ? (completedTasks / recentTasks.length) * 100 : 0;

    // Calculate average task duration
    const completedTasksWithDates = recentTasks.filter(t => 
      t.status === 'COMPLETED' && t.completedAt && t.createdAt
    );
    const avgDuration = completedTasksWithDates.length > 0 
      ? completedTasksWithDates.reduce((sum, task) => {
          const duration = new Date(task.completedAt!).getTime() - new Date(task.createdAt).getTime();
          return sum + duration;
        }, 0) / completedTasksWithDates.length
      : 0;

    // Get preferred contexts
    const contextCounts = recentTasks.reduce((acc, task) => {
      if (task.context?.name) {
        acc[task.context.name] = (acc[task.context.name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const preferredContexts = Object.entries(contextCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([context]) => context);

    return {
      userId,
      organizationId: user.organizationId,
      recentTasks,
      recentProjects,
      completionRate,
      averageTaskDuration: avgDuration,
      preferredContexts,
      workingHours: { start: '09:00', end: '17:00' }, // Default, should come from user settings
      timezone: 'UTC'
    };
  }

  private async analyzeAndRecommend(context: UserContext): Promise<GoalRecommendation[]> {
    const recommendations: GoalRecommendation[] = [];

    // Productivity recommendations based on completion rate
    if (context.completionRate < 70) {
      recommendations.push(this.createProductivityGoal(context));
    }

    // Learning recommendations based on recent activity
    if (this.shouldRecommendLearning(context)) {
      recommendations.push(this.createLearningGoal(context));
    }

    // Health recommendations for work-life balance
    if (this.shouldRecommendHealth(context)) {
      recommendations.push(this.createHealthGoal(context));
    }

    // Career advancement recommendations
    if (this.shouldRecommendCareer(context)) {
      recommendations.push(this.createCareerGoal(context));
    }

    // Business growth recommendations
    if (this.shouldRecommendBusiness(context)) {
      recommendations.push(this.createBusinessGoal(context));
    }

    return recommendations;
  }

  private createProductivityGoal(context: UserContext): GoalRecommendation {
    const currentRate = Math.round(context.completionRate);
    const targetRate = Math.min(90, currentRate + 20);
    
    return {
      id: `productivity-${Date.now()}`,
      title: 'Improve Task Completion Rate',
      description: `Increase your task completion rate from ${currentRate}% to ${targetRate}% through better planning and time management.`,
      category: 'PRODUCTIVITY',
      priority: 'HIGH',
      estimatedDuration: '4 weeks',
      confidence: 85,
      reasoning: `Your current completion rate is ${currentRate}%, which indicates room for improvement in task management and prioritization.`,
      suggestedActions: [
        'Implement time-blocking for focused work sessions',
        'Break large tasks into smaller, manageable subtasks',
        'Use the Pomodoro Technique for better focus',
        'Review and prioritize tasks daily during planning sessions',
        'Eliminate or delegate low-priority tasks'
      ],
      smartCriteria: {
        specific: 'Increase task completion rate through improved planning and execution',
        measurable: `Achieve ${targetRate}% completion rate (currently ${currentRate}%)`,
        achievable: 'Using proven productivity techniques and daily tracking',
        relevant: 'Higher completion rates lead to reduced stress and better outcomes',
        timeBound: 'Achieve target within 4 weeks with weekly progress reviews'
      },
      potentialImpact: 80,
      requiredResources: [
        'Daily 15-minute planning sessions',
        'Time-tracking application or method',
        'Weekly review and adjustment process'
      ],
      milestones: [
        {
          title: 'Week 1: Baseline & Setup',
          description: 'Establish current metrics and implement tracking',
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: 'Daily tracking system implemented and baseline recorded'
        },
        {
          title: 'Week 2: Process Implementation',
          description: 'Begin using new productivity techniques',
          targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: 'Pomodoro and time-blocking techniques used daily'
        },
        {
          title: 'Week 4: Target Achievement',
          description: 'Reach target completion rate',
          targetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: `Sustained ${targetRate}% completion rate for one week`
        }
      ]
    };
  }

  private createLearningGoal(context: UserContext): GoalRecommendation {
    return {
      id: `learning-${Date.now()}`,
      title: 'Develop Professional Skills',
      description: 'Dedicate time to learning new skills that align with your career goals and current projects.',
      category: 'LEARNING',
      priority: 'MEDIUM',
      estimatedDuration: '8 weeks',
      confidence: 75,
      reasoning: 'Continuous learning is essential for career growth and staying current with industry trends.',
      suggestedActions: [
        'Identify 2-3 key skills to develop based on career goals',
        'Allocate 30 minutes daily for focused learning',
        'Join online courses or training programs',
        'Apply new skills to current projects immediately',
        'Share learnings with team members'
      ],
      smartCriteria: {
        specific: 'Complete structured learning program in chosen skill area',
        measurable: 'Complete course/certification and apply skills to 2 real projects',
        achievable: 'With dedicated daily learning time and practical application',
        relevant: 'Skills directly applicable to current role and career path',
        timeBound: 'Complete learning program within 8 weeks'
      },
      potentialImpact: 70,
      requiredResources: [
        'Daily 30-minute learning time block',
        'Access to learning resources (courses, books, tutorials)',
        'Practice projects for skill application'
      ],
      milestones: [
        {
          title: 'Week 2: Skill Selection & Planning',
          description: 'Choose specific skills and create learning plan',
          targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: 'Learning plan created with selected courses and timeline'
        },
        {
          title: 'Week 6: Mid-point Assessment',
          description: 'Evaluate progress and adjust learning approach',
          targetDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: '50% of learning material completed with practical application'
        },
        {
          title: 'Week 8: Completion & Application',
          description: 'Complete learning program and demonstrate skills',
          targetDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: 'Course completed and skills applied to 2 real projects'
        }
      ]
    };
  }

  private createHealthGoal(context: UserContext): GoalRecommendation {
    return {
      id: `health-${Date.now()}`,
      title: 'Improve Work-Life Balance',
      description: 'Establish better boundaries between work and personal time to reduce stress and improve overall well-being.',
      category: 'HEALTH',
      priority: 'MEDIUM',
      estimatedDuration: '6 weeks',
      confidence: 80,
      reasoning: 'Sustainable productivity requires maintaining good work-life balance and personal well-being.',
      suggestedActions: [
        'Set clear work hour boundaries and stick to them',
        'Take regular breaks throughout the workday',
        'Implement a wind-down routine after work',
        'Schedule non-work activities and protect that time',
        'Practice stress management techniques'
      ],
      smartCriteria: {
        specific: 'Establish and maintain clear work-life boundaries',
        measurable: 'Work max 8 hours/day, take 5-minute breaks every hour, 1 hour daily for personal activities',
        achievable: 'Through disciplined schedule management and boundary setting',
        relevant: 'Better balance leads to sustained productivity and reduced burnout',
        timeBound: 'Establish routine within 6 weeks with daily tracking'
      },
      potentialImpact: 75,
      requiredResources: [
        'Time-tracking for work hours monitoring',
        'Calendar blocking for personal time',
        'Support from team/manager for boundary respect'
      ],
      milestones: [
        {
          title: 'Week 2: Boundary Definition',
          description: 'Define clear work hours and personal time blocks',
          targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: 'Written schedule with clear work/personal time boundaries'
        },
        {
          title: 'Week 4: Routine Implementation',
          description: 'Consistently follow new work-life balance routine',
          targetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: 'Maintained boundaries for 14 consecutive days'
        },
        {
          title: 'Week 6: Habit Formation',
          description: 'Work-life balance becomes natural habit',
          targetDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: 'Boundaries maintained without conscious effort'
        }
      ]
    };
  }

  private createCareerGoal(context: UserContext): GoalRecommendation {
    return {
      id: `career-${Date.now()}`,
      title: 'Advance Professional Network',
      description: 'Expand your professional network to create new opportunities and gain industry insights.',
      category: 'CAREER',
      priority: 'MEDIUM',
      estimatedDuration: '12 weeks',
      confidence: 70,
      reasoning: 'Strong professional networks are crucial for career advancement and opportunity discovery.',
      suggestedActions: [
        'Attend 2 industry events or meetups monthly',
        'Connect with 5 new professionals weekly on LinkedIn',
        'Schedule 1 informational interview per week',
        'Share valuable content and insights on professional platforms',
        'Join relevant professional associations or groups'
      ],
      smartCriteria: {
        specific: 'Build meaningful professional relationships in your industry',
        measurable: 'Connect with 60 new professionals, attend 6 events, conduct 12 informational interviews',
        achievable: 'Through consistent networking activities and value-first approach',
        relevant: 'Networking directly impacts career opportunities and professional growth',
        timeBound: 'Achieve networking goals within 12 weeks'
      },
      potentialImpact: 85,
      requiredResources: [
        'Time for networking activities (3-4 hours/week)',
        'Professional event attendance budget',
        'LinkedIn Premium for advanced networking features'
      ],
      milestones: [
        {
          title: 'Week 4: Foundation Building',
          description: 'Establish networking routine and attend first events',
          targetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: '20 new connections, 2 events attended, 4 informational interviews'
        },
        {
          title: 'Week 8: Momentum Building',
          description: 'Maintain consistent networking and deepen relationships',
          targetDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: '40 new connections, 4 events attended, 8 informational interviews'
        },
        {
          title: 'Week 12: Goal Achievement',
          description: 'Reach networking targets and assess opportunities',
          targetDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: '60 new connections, 6 events attended, 12 informational interviews'
        }
      ]
    };
  }

  private createBusinessGoal(context: UserContext): GoalRecommendation {
    return {
      id: `business-${Date.now()}`,
      title: 'Optimize Team Processes',
      description: 'Identify and implement process improvements to increase team efficiency and reduce waste.',
      category: 'BUSINESS',
      priority: 'HIGH',
      estimatedDuration: '10 weeks',
      confidence: 75,
      reasoning: 'Process optimization can significantly impact team productivity and business outcomes.',
      suggestedActions: [
        'Conduct process audit to identify inefficiencies',
        'Map current workflows and identify bottlenecks',
        'Research and evaluate improvement solutions',
        'Implement pilot improvements with small team',
        'Measure results and scale successful changes'
      ],
      smartCriteria: {
        specific: 'Implement process improvements that increase team efficiency',
        measurable: 'Reduce average task completion time by 20% and increase team satisfaction by 15%',
        achievable: 'Through systematic analysis and proven improvement methodologies',
        relevant: 'Improved processes directly impact team productivity and business results',
        timeBound: 'Complete process optimization within 10 weeks'
      },
      potentialImpact: 90,
      requiredResources: [
        'Time for process analysis and mapping',
        'Team collaboration for data gathering',
        'Budget for potential tool or system improvements'
      ],
      milestones: [
        {
          title: 'Week 3: Process Analysis Complete',
          description: 'Complete audit and identify top improvement opportunities',
          targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: 'Process map created with 3-5 prioritized improvement areas'
        },
        {
          title: 'Week 6: Pilot Implementation',
          description: 'Implement pilot improvements with select team members',
          targetDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: 'Pilot improvements running with baseline metrics established'
        },
        {
          title: 'Week 10: Full Implementation',
          description: 'Scale successful improvements across full team',
          targetDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
          successCriteria: '20% efficiency improvement achieved and sustained'
        }
      ]
    };
  }

  private shouldRecommendLearning(context: UserContext): boolean {
    // Recommend learning if user has been active but no recent learning-related tasks
    const learningKeywords = ['learn', 'study', 'course', 'training', 'skill', 'education'];
    const hasRecentLearning = context.recentTasks.some(task => 
      learningKeywords.some(keyword => 
        task.title.toLowerCase().includes(keyword) || 
        task.description?.toLowerCase().includes(keyword)
      )
    );
    return !hasRecentLearning && context.recentTasks.length > 5;
  }

  private shouldRecommendHealth(context: UserContext): boolean {
    // Recommend health/balance if completion rate is very high (might indicate overwork)
    // or if there are many tasks without clear boundaries
    return context.completionRate > 85 || context.recentTasks.length > 30;
  }

  private shouldRecommendCareer(context: UserContext): boolean {
    // Always recommend career development for active users
    return context.recentTasks.length > 10;
  }

  private shouldRecommendBusiness(context: UserContext): boolean {
    // Recommend business improvements if user has multiple projects or manages tasks for others
    return context.recentProjects.length > 3;
  }

  private rankRecommendations(recommendations: GoalRecommendation[], context: UserContext): GoalRecommendation[] {
    return recommendations.sort((a, b) => {
      // Primary sort by priority
      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by confidence and potential impact
      const aScore = a.confidence * 0.6 + a.potentialImpact * 0.4;
      const bScore = b.confidence * 0.6 + b.potentialImpact * 0.4;
      
      return bScore - aScore;
    });
  }

  private getFallbackRecommendations(): GoalRecommendation[] {
    // Return basic recommendations if AI analysis fails
    return [
      {
        id: 'fallback-productivity',
        title: 'Improve Daily Planning',
        description: 'Establish a consistent daily planning routine to increase productivity.',
        category: 'PRODUCTIVITY',
        priority: 'MEDIUM',
        estimatedDuration: '2 weeks',
        confidence: 60,
        reasoning: 'Good planning is fundamental to productivity.',
        suggestedActions: ['Start each day with 10-minute planning session'],
        smartCriteria: {
          specific: 'Plan each day with clear priorities',
          measurable: 'Complete daily planning for 14 consecutive days',
          achievable: 'Using simple planning template',
          relevant: 'Better planning improves focus and outcomes',
          timeBound: 'Establish habit within 2 weeks'
        },
        potentialImpact: 70,
        requiredResources: ['10 minutes daily planning time'],
        milestones: []
      }
    ];
  }
}