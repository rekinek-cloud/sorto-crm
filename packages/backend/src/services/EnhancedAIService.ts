import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// ENHANCED AI SERVICE - Machine Learning dla Smart Day Planner
// =============================================================================
// System uczenia się indywidualnych wzorców użytkownika
// Autor: Claude Code 2025-07-07

export interface PatternDetectionResult {
  type: string;
  key: string;
  confidence: number;
  strength: number;
  data: any;
  source: string;
}

export interface AIRecommendation {
  type: 'time_block' | 'focus_mode' | 'context' | 'break' | 'task_sizing';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number;
  expectedImpact: number; // 0-1
  implementation: any;
  patternBased: boolean;
}

export class EnhancedAIService {
  
  // -------------------------------------------------------------------------
  // 1. PATTERN DETECTION - Wykrywanie wzorców użytkownika
  // -------------------------------------------------------------------------
  
  async detectUserPatterns(userId: string, days: number = 30): Promise<PatternDetectionResult[]> {
    const patterns: PatternDetectionResult[] = [];
    
    // Pobierz dane z ostatnich dni
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const energyAnalytics = await prisma.energyAnalytics.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      },
      include: {
        energyTimeBlock: {
          include: { focusMode: true }
        }
      },
      orderBy: { date: 'asc' }
    });
    
    const scheduledTasks = await prisma.scheduledTask.findMany({
      where: {
        userId,
        scheduledDate: { gte: startDate, lte: endDate }
      }
    });
    
    // 1. Detect Time Preferences
    const timePatterns = this.detectTimePreferences(energyAnalytics);
    patterns.push(...timePatterns);
    
    // 2. Detect Context Efficiency Patterns
    const contextPatterns = this.detectContextEfficiency(energyAnalytics);
    patterns.push(...contextPatterns);
    
    // 3. Detect Energy Cycle Patterns
    const energyPatterns = this.detectEnergyCycles(energyAnalytics);
    patterns.push(...energyPatterns);
    
    // 4. Detect Task Sizing Patterns
    const taskPatterns = this.detectTaskSizingPatterns(scheduledTasks, energyAnalytics);
    patterns.push(...taskPatterns);
    
    // 5. Detect Break Timing Patterns
    const breakPatterns = this.detectBreakPatterns(energyAnalytics);
    patterns.push(...breakPatterns);
    
    return patterns;
  }
  
  private detectTimePreferences(analytics: any[]): PatternDetectionResult[] {
    const patterns: PatternDetectionResult[] = [];
    
    // Analiza wydajności w różnych godzinach
    const hourlyPerformance: { [hour: number]: { total: number; count: number; scores: number[] } } = {};
    
    analytics.forEach(item => {
      if (item.energyTimeBlock && item.productivityScore) {
        const hour = parseInt(item.energyTimeBlock.startTime.split(':')[0]);
        if (!hourlyPerformance[hour]) {
          hourlyPerformance[hour] = { total: 0, count: 0, scores: [] };
        }
        hourlyPerformance[hour].total += item.productivityScore;
        hourlyPerformance[hour].count += 1;
        hourlyPerformance[hour].scores.push(item.productivityScore);
      }
    });
    
    // Znajdź najlepsze godziny (min 3 próbki)
    const bestHours = Object.keys(hourlyPerformance)
      .filter(hour => hourlyPerformance[parseInt(hour)].count >= 3)
      .map(hour => ({
        hour: parseInt(hour),
        avg: hourlyPerformance[parseInt(hour)].total / hourlyPerformance[parseInt(hour)].count,
        count: hourlyPerformance[parseInt(hour)].count,
        consistency: this.calculateConsistency(hourlyPerformance[parseInt(hour)].scores)
      }))
      .sort((a, b) => b.avg - a.avg);
    
    if (bestHours.length > 0) {
      const bestHour = bestHours[0];
      if (bestHour.avg > 0.7 && bestHour.consistency > 0.6) {
        patterns.push({
          type: 'time_preference',
          key: `peak_hour_${bestHour.hour}`,
          confidence: Math.min(bestHour.consistency, bestHour.count / 10),
          strength: bestHour.avg,
          data: {
            peakHour: bestHour.hour,
            avgProductivity: bestHour.avg,
            sampleSize: bestHour.count,
            consistency: bestHour.consistency,
            timeRange: `${bestHour.hour}:00-${bestHour.hour + 1}:00`
          },
          source: 'time_blocks'
        });
      }
    }
    
    return patterns;
  }
  
  private detectContextEfficiency(analytics: any[]): PatternDetectionResult[] {
    const patterns: PatternDetectionResult[] = [];
    
    // Analiza efektywności kontekstów
    const contextPerformance: { [context: string]: { scores: number[]; durations: number[] } } = {};
    
    analytics.forEach(item => {
      if (item.contextsActual && item.productivityScore) {
        const contexts = Array.isArray(item.contextsActual) 
          ? item.contextsActual 
          : JSON.parse(item.contextsActual || '[]');
        
        contexts.forEach((context: string) => {
          if (!contextPerformance[context]) {
            contextPerformance[context] = { scores: [], durations: [] };
          }
          contextPerformance[context].scores.push(item.productivityScore);
          contextPerformance[context].durations.push(item.minutesActual || 0);
        });
      }
    });
    
    // Znajdź najlepsze konteksty
    Object.keys(contextPerformance).forEach(context => {
      const perf = contextPerformance[context];
      if (perf.scores.length >= 3) {
        const avgScore = perf.scores.reduce((sum, s) => sum + s, 0) / perf.scores.length;
        const consistency = this.calculateConsistency(perf.scores);
        const avgDuration = perf.durations.reduce((sum, d) => sum + d, 0) / perf.durations.length;
        
        if (avgScore > 0.7 && consistency > 0.6) {
          patterns.push({
            type: 'context_efficiency',
            key: `context_${context}`,
            confidence: Math.min(consistency, perf.scores.length / 10),
            strength: avgScore,
            data: {
              context,
              avgProductivity: avgScore,
              avgDuration: avgDuration,
              sampleSize: perf.scores.length,
              consistency
            },
            source: 'context_switching'
          });
        }
      }
    });
    
    return patterns;
  }
  
  private detectEnergyCycles(analytics: any[]): PatternDetectionResult[] {
    const patterns: PatternDetectionResult[] = [];
    
    // Grupuj dane po dniach tygodnia
    const dailyEnergyPatterns: { [day: string]: number[] } = {};
    
    analytics.forEach(item => {
      if (item.energyScore) {
        const date = new Date(item.date);
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        
        if (!dailyEnergyPatterns[dayName]) {
          dailyEnergyPatterns[dayName] = [];
        }
        dailyEnergyPatterns[dayName].push(item.energyScore);
      }
    });
    
    // Znajdź wzorce energii
    Object.keys(dailyEnergyPatterns).forEach(day => {
      const scores = dailyEnergyPatterns[day];
      if (scores.length >= 3) {
        const avgEnergy = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const consistency = this.calculateConsistency(scores);
        
        if (consistency > 0.7) {
          patterns.push({
            type: 'energy_cycle',
            key: `energy_${day.toLowerCase()}`,
            confidence: Math.min(consistency, scores.length / 8),
            strength: avgEnergy / 10, // Normalize to 0-1
            data: {
              dayOfWeek: day,
              avgEnergy,
              consistency,
              sampleSize: scores.length,
              pattern: avgEnergy > 7 ? 'high_energy' : avgEnergy > 4 ? 'medium_energy' : 'low_energy'
            },
            source: 'energy_feedback'
          });
        }
      }
    });
    
    return patterns;
  }
  
  private detectTaskSizingPatterns(tasks: any[], analytics: any[]): PatternDetectionResult[] {
    const patterns: PatternDetectionResult[] = [];
    
    // Analiza optymalnych rozmiarów zadań
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED' && t.estimatedMinutes);
    
    if (completedTasks.length >= 5) {
      const durationGroups = {
        short: completedTasks.filter(t => t.estimatedMinutes <= 30),
        medium: completedTasks.filter(t => t.estimatedMinutes > 30 && t.estimatedMinutes <= 90),
        long: completedTasks.filter(t => t.estimatedMinutes > 90)
      };
      
      // Znajdź grupę z najwyższym wskaźnikiem completion
      const groupStats = Object.keys(durationGroups).map(group => {
        const groupTasks = durationGroups[group as keyof typeof durationGroups];
        return {
          group,
          count: groupTasks.length,
          completionRate: groupTasks.length / tasks.filter(t => {
            if (group === 'short') return t.estimatedMinutes <= 30;
            if (group === 'medium') return t.estimatedMinutes > 30 && t.estimatedMinutes <= 90;
            return t.estimatedMinutes > 90;
          }).length
        };
      }).filter(stat => stat.count >= 3);
      
      const bestGroup = groupStats.sort((a, b) => b.completionRate - a.completionRate)[0];
      
      if (bestGroup && bestGroup.completionRate > 0.8) {
        patterns.push({
          type: 'task_sizing',
          key: `optimal_size_${bestGroup.group}`,
          confidence: Math.min(bestGroup.count / 10, 0.9),
          strength: bestGroup.completionRate,
          data: {
            optimalSize: bestGroup.group,
            completionRate: bestGroup.completionRate,
            sampleSize: bestGroup.count,
            recommendation: bestGroup.group === 'short' ? 'Break large tasks into smaller chunks' : 
                          bestGroup.group === 'medium' ? 'Medium-sized tasks work best for you' :
                          'You handle long tasks well'
          },
          source: 'task_completion'
        });
      }
    }
    
    return patterns;
  }
  
  private detectBreakPatterns(analytics: any[]): PatternDetectionResult[] {
    const patterns: PatternDetectionResult[] = [];
    
    // Analiza wpływu przerw na produktywność
    const breakAnalysis: { [breakType: string]: { before: number[]; after: number[] } } = {};
    
    for (let i = 0; i < analytics.length - 1; i++) {
      const current = analytics[i];
      const next = analytics[i + 1];
      
      if (current.energyTimeBlock?.isBreak && next.productivityScore) {
        const breakType = current.energyTimeBlock.breakType || 'UNKNOWN';
        
        if (!breakAnalysis[breakType]) {
          breakAnalysis[breakType] = { before: [], after: [] };
        }
        
        if (i > 0 && analytics[i - 1].productivityScore) {
          breakAnalysis[breakType].before.push(analytics[i - 1].productivityScore);
          breakAnalysis[breakType].after.push(next.productivityScore);
        }
      }
    }
    
    // Znajdź najefektywniejsze przerwy
    Object.keys(breakAnalysis).forEach(breakType => {
      const analysis = breakAnalysis[breakType];
      if (analysis.before.length >= 3) {
        const avgBefore = analysis.before.reduce((sum, s) => sum + s, 0) / analysis.before.length;
        const avgAfter = analysis.after.reduce((sum, s) => sum + s, 0) / analysis.after.length;
        const improvement = avgAfter - avgBefore;
        
        if (improvement > 0.1) { // Significant improvement
          patterns.push({
            type: 'break_timing',
            key: `break_${breakType.toLowerCase()}`,
            confidence: Math.min(analysis.before.length / 8, 0.9),
            strength: improvement,
            data: {
              breakType,
              avgBefore,
              avgAfter,
              improvement,
              sampleSize: analysis.before.length,
              effectiveness: improvement / avgBefore
            },
            source: 'time_blocks'
          });
        }
      }
    });
    
    return patterns;
  }
  
  private calculateConsistency(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency score (0-1, where 1 is most consistent)
    return Math.max(0, 1 - (stdDev / mean));
  }
  
  // -------------------------------------------------------------------------
  // 2. PATTERN STORAGE & MANAGEMENT
  // -------------------------------------------------------------------------
  
  async storePattern(userId: string, organizationId: string, pattern: PatternDetectionResult): Promise<void> {
    const existingPattern = await prisma.userPattern.findFirst({
      where: {
        userId,
        patternType: pattern.type,
        patternKey: pattern.key
      }
    });
    
    if (existingPattern) {
      // Update existing pattern with new data
      await prisma.userPattern.update({
        where: { id: existingPattern.id },
        data: {
          confidence: (existingPattern.confidence + pattern.confidence) / 2, // Average with existing
          strength: pattern.strength,
          sampleSize: existingPattern.sampleSize + 1,
          patternData: pattern.data,
          lastConfirmed: new Date(),
          adaptationCount: existingPattern.adaptationCount + 1,
          lastAdaptation: new Date(),
          adaptationReason: 'pattern_reconfirmed',
          updatedAt: new Date()
        }
      });
    } else {
      // Create new pattern
      await prisma.userPattern.create({
        data: {
          patternType: pattern.type,
          patternKey: pattern.key,
          confidence: pattern.confidence,
          strength: pattern.strength,
          sampleSize: 1,
          successRate: 0.8, // Initial assumption
          patternData: pattern.data,
          conditions: [],
          outcomes: [],
          learningSource: pattern.source,
          organizationId,
          userId
        }
      });
    }
  }
  
  async getUserPatterns(userId: string, patternType?: string): Promise<any[]> {
    const where: any = { userId };
    if (patternType) {
      where.patternType = patternType;
    }
    
    return await prisma.userPattern.findMany({
      where,
      orderBy: [
        { confidence: 'desc' },
        { strength: 'desc' }
      ]
    });
  }
  
  async invalidatePattern(patternId: string, reason: string): Promise<void> {
    await prisma.userPattern.update({
      where: { id: patternId },
      data: {
        validUntil: new Date(),
        adaptationReason: reason,
        lastAdaptation: new Date()
      }
    });
  }
  
  // -------------------------------------------------------------------------
  // 3. AI RECOMMENDATIONS BASED ON PATTERNS
  // -------------------------------------------------------------------------
  
  async generatePersonalizedRecommendations(userId: string): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    
    const patterns = await this.getUserPatterns(userId);
    
    for (const pattern of patterns) {
      if (pattern.confidence > 0.6 && pattern.strength > 0.7) {
        const rec = this.patternToRecommendation(pattern);
        if (rec) {
          recommendations.push(rec);
        }
      }
    }
    
    // Sort by confidence and expected impact
    return recommendations.sort((a, b) => 
      (b.confidence * b.expectedImpact) - (a.confidence * a.expectedImpact)
    );
  }
  
  private patternToRecommendation(pattern: any): AIRecommendation | null {
    const data = typeof pattern.patternData === 'string' 
      ? JSON.parse(pattern.patternData) 
      : pattern.patternData;
    
    switch (pattern.patternType) {
      case 'time_preference':
        return {
          type: 'time_block',
          priority: 'high',
          title: `Planuj wymagające zadania o godzinie ${data.peakHour}:00`,
          description: `Analiza pokazuje, że jesteś najbardziej produktywny o ${data.timeRange}. Średnia produktywność: ${(data.avgProductivity * 100).toFixed(1)}%`,
          confidence: pattern.confidence,
          expectedImpact: 0.8,
          implementation: {
            suggestedTimeSlot: `${data.peakHour}:00-${data.peakHour + 2}:00`,
            energyLevel: 'HIGH',
            taskTypes: ['important', 'complex', 'creative']
          },
          patternBased: true
        };
        
      case 'context_efficiency':
        return {
          type: 'context',
          priority: 'medium',
          title: `Kontekst "${data.context}" działa dla Ciebie najlepiej`,
          description: `W kontekście ${data.context} osiągasz ${(data.avgProductivity * 100).toFixed(1)}% produktywność. Używaj go częściej dla ważnych zadań.`,
          confidence: pattern.confidence,
          expectedImpact: 0.6,
          implementation: {
            preferredContext: data.context,
            suggestedDuration: data.avgDuration,
            taskTypes: ['focused_work']
          },
          patternBased: true
        };
        
      case 'task_sizing':
        return {
          type: 'task_sizing',
          priority: 'medium',
          title: `Zadania ${data.optimalSize === 'short' ? 'krótkie (≤30min)' : 
                                data.optimalSize === 'medium' ? 'średnie (30-90min)' : 
                                'długie (>90min)'} są dla Ciebie optymalne`,
          description: `${data.recommendation}. Wskaźnik ukończenia: ${(data.completionRate * 100).toFixed(1)}%`,
          confidence: pattern.confidence,
          expectedImpact: 0.5,
          implementation: {
            optimalTaskSize: data.optimalSize,
            completionRate: data.completionRate,
            strategy: data.recommendation
          },
          patternBased: true
        };
        
      case 'break_timing':
        return {
          type: 'break',
          priority: 'low',
          title: `Przerwy typu "${data.breakType}" zwiększają Twoją produktywność`,
          description: `Po przerwach ${data.breakType} Twoja produktywność wzrasta o ${(data.improvement * 100).toFixed(1)}%`,
          confidence: pattern.confidence,
          expectedImpact: 0.4,
          implementation: {
            breakType: data.breakType,
            improvement: data.improvement,
            timing: 'after_high_intensity_blocks'
          },
          patternBased: true
        };
        
      default:
        return null;
    }
  }
  
  // -------------------------------------------------------------------------
  // 4. LEARNING & ADAPTATION
  // -------------------------------------------------------------------------
  
  async recordUserFeedback(
    userId: string, 
    patternId: string, 
    accepted: boolean, 
    implemented?: boolean
  ): Promise<void> {
    const pattern = await prisma.userPattern.findFirst({
      where: { id: patternId, userId }
    });
    
    if (!pattern) return;
    
    const newAcceptance = pattern.userAcceptance 
      ? (pattern.userAcceptance + (accepted ? 1 : 0)) / 2
      : (accepted ? 0.8 : 0.2);
    
    const newImplementationRate = implemented !== undefined
      ? (pattern.implementationRate || 0.5) * 0.8 + (implemented ? 1 : 0) * 0.2
      : pattern.implementationRate;
    
    await prisma.userPattern.update({
      where: { id: patternId },
      data: {
        userAcceptance: newAcceptance,
        implementationRate: newImplementationRate,
        manualOverrides: accepted ? pattern.manualOverrides : pattern.manualOverrides + 1,
        lastConfirmed: accepted ? new Date() : pattern.lastConfirmed
      }
    });
  }
  
  async adaptPatternsBasedOnPerformance(userId: string): Promise<void> {
    // Pobierz ostatnie metryki wydajności
    const recentMetrics = await prisma.performanceMetrics.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 7 // Last week
    });
    
    if (recentMetrics.length === 0) return;
    
    const avgProductivity = recentMetrics.reduce((sum, m) => 
      sum + (m.focusModeProductivity || 0), 0
    ) / recentMetrics.length;
    
    const avgCompletionRate = recentMetrics.reduce((sum, m) => 
      sum + m.completionRate, 0
    ) / recentMetrics.length;
    
    // Jeśli wydajność spadła, sprawdź wzorce
    if (avgProductivity < 0.6 || avgCompletionRate < 0.7) {
      const patterns = await this.getUserPatterns(userId);
      
      for (const pattern of patterns) {
        if (pattern.confidence > 0.8 && pattern.userAcceptance < 0.5) {
          // Pattern nie jest akceptowany przez użytkownika mimo wysokiej pewności
          await this.invalidatePattern(
            pattern.id, 
            'low_user_acceptance_despite_high_confidence'
          );
        }
      }
    }
  }
  
  async getPatternLearningInsights(userId: string): Promise<any> {
    const patterns = await this.getUserPatterns(userId);
    
    const insights = {
      totalPatterns: patterns.length,
      highConfidencePatterns: patterns.filter(p => p.confidence > 0.8).length,
      acceptedPatterns: patterns.filter(p => (p.userAcceptance || 0) > 0.7).length,
      adaptationCount: patterns.reduce((sum, p) => sum + p.adaptationCount, 0),
      learningEffectiveness: patterns.length > 0 
        ? patterns.reduce((sum, p) => sum + (p.userAcceptance || 0), 0) / patterns.length
        : 0,
      patternsByType: patterns.reduce((acc, p) => {
        acc[p.patternType] = (acc[p.patternType] || 0) + 1;
        return acc;
      }, {} as any),
      recommendations: {
        needMoreData: patterns.filter(p => p.sampleSize < 5).length,
        readyForUse: patterns.filter(p => p.confidence > 0.7 && p.sampleSize >= 5).length,
        conflicting: patterns.filter(p => p.manualOverrides > 3).length
      }
    };
    
    return insights;
  }
}

export const enhancedAIService = new EnhancedAIService();