import { Task, Project } from '@prisma/client';

export interface SmartCriteria {
  specific: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
  measurable: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
  achievable: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
  relevant: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
  timeBound: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
}

export interface SmartAnalysisResult {
  overallScore: number;
  criteria: SmartCriteria;
  summary: string;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

/**
 * Analyzes how SMART a task or project is
 */
export class SmartAnalysisService {
  
  /**
   * Analyze a task for SMART criteria
   */
  static analyzeTask(task: Task): SmartAnalysisResult {
    const criteria = this.evaluateTaskCriteria(task);
    const overallScore = this.calculateOverallScore(criteria);
    
    return {
      overallScore,
      criteria,
      summary: this.generateSummary(overallScore, criteria),
      recommendations: this.generateRecommendations(criteria),
      strengths: this.identifyStrengths(criteria),
      weaknesses: this.identifyWeaknesses(criteria)
    };
  }

  /**
   * Analyze a project for SMART criteria
   */
  static analyzeProject(project: Project): SmartAnalysisResult {
    const criteria = this.evaluateProjectCriteria(project);
    const overallScore = this.calculateOverallScore(criteria);
    
    return {
      overallScore,
      criteria,
      summary: this.generateSummary(overallScore, criteria),
      recommendations: this.generateRecommendations(criteria),
      strengths: this.identifyStrengths(criteria),
      weaknesses: this.identifyWeaknesses(criteria)
    };
  }

  /**
   * Evaluate SMART criteria for a task
   */
  private static evaluateTaskCriteria(task: Task): SmartCriteria {
    return {
      specific: this.evaluateTaskSpecific(task),
      measurable: this.evaluateTaskMeasurable(task),
      achievable: this.evaluateTaskAchievable(task),
      relevant: this.evaluateTaskRelevant(task),
      timeBound: this.evaluateTaskTimeBound(task)
    };
  }

  /**
   * Evaluate SMART criteria for a project
   */
  private static evaluateProjectCriteria(project: Project): SmartCriteria {
    return {
      specific: this.evaluateProjectSpecific(project),
      measurable: this.evaluateProjectMeasurable(project),
      achievable: this.evaluateProjectAchievable(project),
      relevant: this.evaluateProjectRelevant(project),
      timeBound: this.evaluateProjectTimeBound(project)
    };
  }

  // Task-specific SMART criteria evaluation
  private static evaluateTaskSpecific(task: Task) {
    let score = 0;
    const suggestions: string[] = [];
    
    // Check title clarity (40 points)
    if (task.title.length >= 10) score += 20;
    if (task.title.includes(' ')) score += 10; // Multiple words
    if (/^(create|update|fix|implement|design|test|review|analyze)/i.test(task.title)) score += 10;
    
    // Check description (40 points)
    if (task.description) {
      score += 20;
      if (task.description.length >= 50) score += 20;
    } else {
      suggestions.push('Add a detailed description explaining what needs to be done');
    }
    
    // Check context (20 points)
    if (task.contextId) score += 20;
    else suggestions.push('Assign a context (@computer, @phone, etc.) to clarify where this task should be done');

    if (score < 60) suggestions.push('Make the task title more specific with action verbs');
    if (score < 40) suggestions.push('Clarify exactly what outcome is expected');

    return {
      score,
      analysis: this.getSpecificAnalysis(score, 'task'),
      suggestions
    };
  }

  private static evaluateTaskMeasurable(task: Task) {
    let score = 0;
    const suggestions: string[] = [];
    
    // Estimated hours (30 points)
    if (task.estimatedHours && task.estimatedHours > 0) score += 30;
    else suggestions.push('Add an estimated time to complete this task');
    
    // Clear completion criteria in description (40 points)
    if (task.description) {
      if (/\b(complete|finish|deliver|achieve|reach)\b/i.test(task.description)) score += 20;
      if (/\b(criteria|requirements|specs|definition of done)\b/i.test(task.description)) score += 20;
    }
    
    // Quantifiable elements (30 points)
    const quantifiablePattern = /\b(\d+|all|every|each|100%|zero|none)\b/i;
    if (task.title && quantifiablePattern.test(task.title)) score += 15;
    if (task.description && quantifiablePattern.test(task.description)) score += 15;
    
    if (score < 50) suggestions.push('Define clear completion criteria or success metrics');
    if (score < 30) suggestions.push('Add quantifiable elements (numbers, percentages, etc.)');

    return {
      score,
      analysis: this.getMeasurableAnalysis(score, 'task'),
      suggestions
    };
  }

  private static evaluateTaskAchievable(task: Task) {
    let score = 50; // Base assumption of achievability
    const suggestions: string[] = [];
    
    // Time estimation reasonableness (30 points)
    if (task.estimatedHours) {
      if (task.estimatedHours <= 8) score += 20; // Reasonable daily work
      else if (task.estimatedHours <= 40) score += 10; // Weekly work
      else suggestions.push('Consider breaking this large task into smaller, more manageable subtasks');
    }
    
    // Priority vs complexity (20 points)
    if (task.priority === 'HIGH' || task.priority === 'URGENT') {
      if (!task.estimatedHours || task.estimatedHours <= 4) score += 20;
      else score -= 10; // High priority but long duration might not be achievable
    }
    
    if (task.estimatedHours && task.estimatedHours > 16) {
      suggestions.push('Large tasks are harder to complete - consider breaking into smaller pieces');
    }
    
    if (score < 60) suggestions.push('Ensure you have the necessary resources and skills');
    if (score < 40) suggestions.push('This task might be too complex - consider simplifying or getting help');

    return {
      score,
      analysis: this.getAchievableAnalysis(score, 'task'),
      suggestions
    };
  }

  private static evaluateTaskRelevant(task: Task) {
    let score = 40; // Base relevance
    const suggestions: string[] = [];
    
    // Project association (30 points)
    if (task.projectId) score += 30;
    else suggestions.push('Link this task to a project to ensure strategic alignment');
    
    // Stream association (20 points)
    if (task.streamId) score += 20;
    else suggestions.push('Assign to a work stream for better organization');
    
    // Priority alignment (10 points)
    if (task.priority === 'HIGH' || task.priority === 'MEDIUM') score += 10;
    
    if (score < 50) suggestions.push('Clarify how this task contributes to larger goals');
    if (score < 30) suggestions.push('Consider if this task is really necessary or could be delegated');

    return {
      score,
      analysis: this.getRelevantAnalysis(score, 'task'),
      suggestions
    };
  }

  private static evaluateTaskTimeBound(task: Task) {
    let score = 0;
    const suggestions: string[] = [];
    
    // Due date (60 points)
    if (task.dueDate) {
      score += 40;
      const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue > 0 && daysUntilDue <= 30) score += 20; // Reasonable timeframe
      else if (daysUntilDue < 0) {
        score -= 20;
        suggestions.push('This task is overdue - update the due date or complete it urgently');
      } else if (daysUntilDue > 90) {
        score += 10;
        suggestions.push('Consider setting intermediate milestones for this long-term task');
      }
    } else {
      suggestions.push('Set a due date to create urgency and enable planning');
    }
    
    // Time estimation (40 points)
    if (task.estimatedHours && task.estimatedHours > 0) score += 40;
    else suggestions.push('Estimate how long this will take to help with scheduling');
    
    if (score < 50) suggestions.push('Create time pressure with deadlines and estimates');

    return {
      score,
      analysis: this.getTimeBoundAnalysis(score, 'task'),
      suggestions
    };
  }

  // Project-specific SMART criteria evaluation
  private static evaluateProjectSpecific(project: Project) {
    let score = 0;
    const suggestions: string[] = [];
    
    // Name clarity (30 points)
    if (project.name.length >= 10) score += 15;
    if (project.name.includes(' ')) score += 10;
    if (/^(develop|create|implement|launch|improve|optimize)/i.test(project.name)) score += 5;
    
    // Description (50 points)
    if (project.description) {
      score += 25;
      if (project.description.length >= 100) score += 25;
    } else {
      suggestions.push('Add a comprehensive project description with scope and objectives');
    }
    
    // Stream association (20 points)
    if (project.streamId) score += 20;
    else suggestions.push('Assign to a work stream for strategic alignment');

    if (score < 60) suggestions.push('Define clear project scope and deliverables');
    if (score < 40) suggestions.push('Specify what success looks like for this project');

    return {
      score,
      analysis: this.getSpecificAnalysis(score, 'project'),
      suggestions
    };
  }

  private static evaluateProjectMeasurable(project: Project) {
    let score = 0;
    const suggestions: string[] = [];
    
    // Clear deliverables in description (50 points)
    if (project.description) {
      if (/\b(deliverable|outcome|result|milestone|kpi|metric)\b/i.test(project.description)) score += 25;
      if (/\b(\d+|%|increase|decrease|improve|reduce)\b/i.test(project.description)) score += 25;
    }
    
    // Date range planning (30 points)
    if (project.startDate && project.endDate) score += 30;
    else if (project.startDate || project.endDate) score += 15;
    else suggestions.push('Set start and end dates for better project tracking');
    
    // Status tracking (20 points)
    if (project.status === 'IN_PROGRESS' || project.status === 'COMPLETED') score += 20;
    
    if (score < 50) suggestions.push('Define measurable success criteria and key performance indicators');
    if (score < 30) suggestions.push('Break the project into trackable milestones');

    return {
      score,
      analysis: this.getMeasurableAnalysis(score, 'project'),
      suggestions
    };
  }

  private static evaluateProjectAchievable(project: Project) {
    let score = 50; // Base achievability
    const suggestions: string[] = [];
    
    // Timeline reasonableness (30 points)
    if (project.startDate && project.endDate) {
      const duration = Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24));
      
      if (duration > 0 && duration <= 90) score += 20; // 3 months or less
      else if (duration <= 365) score += 10; // Up to a year
      else suggestions.push('Very long projects are harder to manage - consider breaking into phases');
      
      if (duration > 0) score += 10;
    }
    
    // Priority vs scope (20 points)
    if (project.priority === 'HIGH' || project.priority === 'URGENT') {
      if (project.endDate) {
        const daysUntilEnd = Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilEnd > 30) score += 20;
        else score += 10;
      }
    }
    
    if (score < 60) suggestions.push('Ensure the project scope matches available resources and timeline');
    if (score < 40) suggestions.push('Consider reducing scope or extending timeline for better achievability');

    return {
      score,
      analysis: this.getAchievableAnalysis(score, 'project'),
      suggestions
    };
  }

  private static evaluateProjectRelevant(project: Project) {
    let score = 30; // Base relevance
    const suggestions: string[] = [];
    
    // Stream alignment (40 points)
    if (project.streamId) score += 40;
    else suggestions.push('Assign to a strategic work stream');
    
    // Priority setting (20 points)
    if (project.priority === 'HIGH') score += 20;
    else if (project.priority === 'MEDIUM') score += 10;
    
    // Assignment (10 points)
    if (project.assignedToId) score += 10;
    else suggestions.push('Assign a project owner for accountability');
    
    if (score < 50) suggestions.push('Clarify how this project aligns with organizational goals');
    if (score < 30) suggestions.push('Validate that this project is worth the investment');

    return {
      score,
      analysis: this.getRelevantAnalysis(score, 'project'),
      suggestions
    };
  }

  private static evaluateProjectTimeBound(project: Project) {
    let score = 0;
    const suggestions: string[] = [];
    
    // End date (50 points)
    if (project.endDate) {
      score += 30;
      const daysUntilEnd = Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEnd > 0) score += 20;
      else {
        score -= 10;
        suggestions.push('Project deadline has passed - update timeline or accelerate completion');
      }
    } else {
      suggestions.push('Set a target completion date for the project');
    }
    
    // Start date (30 points)
    if (project.startDate) score += 30;
    else suggestions.push('Define when the project should begin');
    
    // Milestone planning (20 points)
    if (project.startDate && project.endDate) {
      const duration = Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24));
      if (duration > 30) score += 20; // Long projects should have milestones
      else score += 10;
    }
    
    if (score < 50) suggestions.push('Establish clear timeline with milestones and deadlines');

    return {
      score,
      analysis: this.getTimeBoundAnalysis(score, 'project'),
      suggestions
    };
  }

  // Analysis text generators
  private static getSpecificAnalysis(score: number, type: string): string {
    if (score >= 80) return `This ${type} is very specific with clear objectives and well-defined scope.`;
    if (score >= 60) return `This ${type} is fairly specific but could benefit from more clarity.`;
    if (score >= 40) return `This ${type} needs more specificity to be actionable.`;
    return `This ${type} is too vague and needs significant clarification.`;
  }

  private static getMeasurableAnalysis(score: number, type: string): string {
    if (score >= 80) return `This ${type} has clear success criteria and measurable outcomes.`;
    if (score >= 60) return `This ${type} is somewhat measurable but could use more concrete metrics.`;
    if (score >= 40) return `This ${type} lacks clear measurement criteria.`;
    return `This ${type} has no measurable outcomes defined.`;
  }

  private static getAchievableAnalysis(score: number, type: string): string {
    if (score >= 80) return `This ${type} appears highly achievable with current resources.`;
    if (score >= 60) return `This ${type} is likely achievable but may face some challenges.`;
    if (score >= 40) return `This ${type} might be difficult to achieve as currently defined.`;
    return `This ${type} appears unrealistic and needs scope adjustment.`;
  }

  private static getRelevantAnalysis(score: number, type: string): string {
    if (score >= 80) return `This ${type} is highly relevant and well-aligned with strategic goals.`;
    if (score >= 60) return `This ${type} is relevant but could be better aligned.`;
    if (score >= 40) return `The relevance of this ${type} is questionable.`;
    return `This ${type} appears disconnected from key objectives.`;
  }

  private static getTimeBoundAnalysis(score: number, type: string): string {
    if (score >= 80) return `This ${type} has excellent time management with clear deadlines.`;
    if (score >= 60) return `This ${type} has some time constraints but could be more structured.`;
    if (score >= 40) return `This ${type} lacks proper time boundaries.`;
    return `This ${type} has no time constraints, reducing urgency and focus.`;
  }

  // Helper methods
  private static calculateOverallScore(criteria: SmartCriteria): number {
    const total = criteria.specific.score + criteria.measurable.score + 
                  criteria.achievable.score + criteria.relevant.score + 
                  criteria.timeBound.score;
    return Math.round(total / 5);
  }

  private static generateSummary(overallScore: number, criteria: SmartCriteria): string {
    if (overallScore >= 80) {
      return 'Excellent SMART goal! This is well-defined and likely to be successful.';
    } else if (overallScore >= 60) {
      return 'Good SMART goal with room for improvement in some areas.';
    } else if (overallScore >= 40) {
      return 'This goal needs significant improvement to meet SMART criteria.';
    } else {
      return 'This goal is poorly defined and unlikely to succeed without major changes.';
    }
  }

  private static generateRecommendations(criteria: SmartCriteria): string[] {
    const recommendations: string[] = [];
    const scores = [
      { name: 'Specific', score: criteria.specific.score, suggestions: criteria.specific.suggestions },
      { name: 'Measurable', score: criteria.measurable.score, suggestions: criteria.measurable.suggestions },
      { name: 'Achievable', score: criteria.achievable.score, suggestions: criteria.achievable.suggestions },
      { name: 'Relevant', score: criteria.relevant.score, suggestions: criteria.relevant.suggestions },
      { name: 'Time-bound', score: criteria.timeBound.score, suggestions: criteria.timeBound.suggestions }
    ];

    // Get worst performing criteria first
    scores.sort((a, b) => a.score - b.score);
    
    for (const criterion of scores) {
      if (criterion.score < 60 && criterion.suggestions.length > 0) {
        recommendations.push(...criterion.suggestions.slice(0, 2)); // Top 2 suggestions per criterion
      }
      if (recommendations.length >= 6) break; // Limit total recommendations
    }

    return recommendations;
  }

  private static identifyStrengths(criteria: SmartCriteria): string[] {
    const strengths: string[] = [];
    
    if (criteria.specific.score >= 70) strengths.push('Well-defined and specific');
    if (criteria.measurable.score >= 70) strengths.push('Clear success criteria');
    if (criteria.achievable.score >= 70) strengths.push('Realistic scope');
    if (criteria.relevant.score >= 70) strengths.push('Strategic alignment');
    if (criteria.timeBound.score >= 70) strengths.push('Good time management');
    
    return strengths;
  }

  private static identifyWeaknesses(criteria: SmartCriteria): string[] {
    const weaknesses: string[] = [];
    
    if (criteria.specific.score < 50) weaknesses.push('Lacks specificity');
    if (criteria.measurable.score < 50) weaknesses.push('No clear metrics');
    if (criteria.achievable.score < 50) weaknesses.push('May be unrealistic');
    if (criteria.relevant.score < 50) weaknesses.push('Poor strategic fit');
    if (criteria.timeBound.score < 50) weaknesses.push('Missing deadlines');
    
    return weaknesses;
  }
}
