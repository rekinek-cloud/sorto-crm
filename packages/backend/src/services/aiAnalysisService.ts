import { prisma } from '../config/database';

export interface EmailMessage {
  messageId: string;
  from: { address: string; name?: string };
  to: { address: string; name?: string }[];
  subject: string;
  text: string;
  html?: string;
  date: Date;
  attachments?: any[];
}

export interface SentimentResult {
  score: number; // -1 to 1 (negative to positive)
  magnitude: number; // 0 to 1 (neutral to emotional)
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  confidence: number;
}

export interface TaskDetectionResult {
  hasTasks: boolean;
  extractedTasks: Array<{
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: Date;
    context?: string;
    confidence: number;
  }>;
  actionWords: string[];
  timeIndicators: string[];
}

export interface CategoryResult {
  category: string;
  subcategory?: string;
  confidence: number;
  tags: string[];
  businessValue: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ComprehensiveAnalysis {
  sentiment: SentimentResult;
  tasks: TaskDetectionResult;
  category: CategoryResult;
  urgencyScore: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedReadTime: number; // in minutes
  keyTopics: string[];
  summary: string;
  recommendedActions: string[];
}

export class AIAnalysisService {
  
  async analyzeMessage(message: EmailMessage): Promise<ComprehensiveAnalysis> {
    const text = this.extractPlainText(message);
    
    // Run all analyses in parallel for better performance
    const [sentiment, tasks, category] = await Promise.all([
      this.analyzeSentiment(text, message),
      this.detectTasks(text, message),
      this.categorizeMessage(text, message)
    ]);

    const urgencyScore = this.calculateUrgencyScore(text, message, sentiment);
    const complexity = this.assessComplexity(text, message);
    const estimatedReadTime = this.estimateReadTime(text);
    const keyTopics = this.extractKeyTopics(text);
    const summary = this.generateSummary(text, message);
    const recommendedActions = this.generateRecommendedActions(text, tasks, sentiment, category);

    return {
      sentiment,
      tasks,
      category,
      urgencyScore,
      complexity,
      estimatedReadTime,
      keyTopics,
      summary,
      recommendedActions
    };
  }

  private extractPlainText(message: EmailMessage): string {
    // Combine subject and body text
    const subject = message.subject || '';
    const body = message.text || '';
    
    // Remove email signatures, quoted text, and formatting
    const cleanBody = this.cleanEmailText(body);
    
    return `${subject}\n\n${cleanBody}`.trim();
  }

  private cleanEmailText(text: string): string {
    // Remove common email signatures and quoted text patterns
    const cleanedText = text
      // Remove quoted text (lines starting with >)
      .replace(/^>.*$/gm, '')
      // Remove email headers (lines with colons like "From:", "Date:")
      .replace(/^[A-Za-z-]+:\s.*$/gm, '')
      // Remove excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove URLs for cleaner analysis
      .replace(/(https?:\/\/[^\s]+)/g, '[URL]')
      // Remove email addresses for privacy
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .trim();

    return cleanedText;
  }

  async analyzeSentiment(text: string, message: EmailMessage): Promise<SentimentResult> {
    // Advanced sentiment analysis using keyword matching and context
    const positiveWords = [
      'excellent', 'great', 'fantastic', 'wonderful', 'amazing', 'perfect', 'outstanding',
      'pleased', 'happy', 'satisfied', 'impressed', 'excited', 'thrilled', 'delighted',
      'appreciate', 'grateful', 'thank', 'thanks', 'awesome', 'brilliant', 'superb'
    ];

    const negativeWords = [
      'terrible', 'awful', 'horrible', 'disappointing', 'frustrated', 'angry', 'upset',
      'concerned', 'worried', 'problem', 'issue', 'error', 'mistake', 'wrong', 'failed',
      'urgent', 'critical', 'emergency', 'asap', 'immediately', 'deadline', 'overdue'
    ];

    const neutralWords = [
      'meeting', 'schedule', 'information', 'update', 'report', 'request', 'question',
      'regarding', 'concerning', 'follow', 'discuss', 'review', 'confirm', 'please'
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
      if (neutralWords.includes(word)) neutralScore++;
    });

    // Calculate sentiment based on word counts and context
    const totalEmotionalWords = positiveScore + negativeScore;
    const magnitude = Math.min(totalEmotionalWords / words.length * 10, 1);
    
    let score = 0;
    let label: SentimentResult['label'] = 'NEUTRAL';
    
    if (totalEmotionalWords > 0) {
      score = (positiveScore - negativeScore) / totalEmotionalWords;
      
      if (score > 0.3) label = 'POSITIVE';
      else if (score < -0.3) label = 'NEGATIVE';
      else if (positiveScore > 0 && negativeScore > 0) label = 'MIXED';
    }

    // Check for urgency indicators that affect sentiment
    const urgencyPattern = /\b(urgent|asap|immediately|emergency|critical|deadline)\b/i;
    if (urgencyPattern.test(text)) {
      score = Math.min(score - 0.2, -0.1); // Urgency tends toward negative sentiment
    }

    const confidence = Math.min(magnitude + (totalEmotionalWords / words.length), 1);

    return {
      score: Math.max(-1, Math.min(1, score)),
      magnitude,
      label,
      confidence
    };
  }

  async detectTasks(text: string, message: EmailMessage): Promise<TaskDetectionResult> {
    const actionWords = [
      'please', 'can you', 'could you', 'would you', 'need to', 'must', 'should',
      'required', 'request', 'ask', 'help', 'complete', 'finish', 'deliver',
      'send', 'provide', 'prepare', 'review', 'check', 'verify', 'confirm',
      'schedule', 'arrange', 'organize', 'contact', 'call', 'email', 'respond'
    ];

    const timeIndicators = [
      'today', 'tomorrow', 'this week', 'next week', 'by friday', 'by end of',
      'deadline', 'due date', 'asap', 'urgent', 'immediately', 'soon',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];

    const foundActionWords: string[] = [];
    const foundTimeIndicators: string[] = [];
    const extractedTasks: TaskDetectionResult['extractedTasks'] = [];

    const lowerText = text.toLowerCase();

    // Find action words and time indicators
    actionWords.forEach(word => {
      if (lowerText.includes(word)) {
        foundActionWords.push(word);
      }
    });

    timeIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        foundTimeIndicators.push(indicator);
      }
    });

    // Extract potential tasks using patterns
    const taskPatterns = [
      // "Please [action]..." or "Can you [action]..."
      /(?:please|can you|could you|would you)\s+([^.!?]+[.!?])/gi,
      // "Need to [action]..." or "Must [action]..."
      /(?:need to|must|should|required to)\s+([^.!?]+[.!?])/gi,
      // Sentences with deadlines
      /([^.!?]*(?:by|deadline|due).*?[.!?])/gi
    ];

    taskPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const taskText = match.trim();
          if (taskText.length > 10 && taskText.length < 200) {
            // Determine priority based on urgency words
            let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
            const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
            const highWords = ['important', 'priority', 'deadline', 'today'];
            
            if (urgentWords.some(word => taskText.toLowerCase().includes(word))) {
              priority = 'URGENT';
            } else if (highWords.some(word => taskText.toLowerCase().includes(word))) {
              priority = 'HIGH';
            } else if (foundTimeIndicators.length === 0) {
              priority = 'LOW';
            }

            // Extract due date if mentioned
            let dueDate: Date | undefined;
            const dateMatch = taskText.match(/(?:by|deadline|due)\s+(.*?)(?:[.!?]|$)/i);
            if (dateMatch) {
              dueDate = this.parseRelativeDate(dateMatch[1]);
            }

            // Determine context based on content
            let context: string | undefined;
            if (/\b(?:call|phone|telephone)\b/i.test(taskText)) context = '@calls';
            else if (/\b(?:email|send|write|respond)\b/i.test(taskText)) context = '@computer';
            else if (/\b(?:meeting|discuss|talk)\b/i.test(taskText)) context = '@meetings';
            else if (/\b(?:buy|purchase|pick up|get)\b/i.test(taskText)) context = '@errands';

            const confidence = Math.min(
              (foundActionWords.length * 0.3 + foundTimeIndicators.length * 0.2 + 0.5),
              1
            );

            extractedTasks.push({
              title: this.extractTaskTitle(taskText),
              description: taskText,
              priority,
              dueDate,
              context,
              confidence
            });
          }
        });
      }
    });

    const hasTasks = foundActionWords.length > 0 || foundTimeIndicators.length > 0 || extractedTasks.length > 0;

    return {
      hasTasks,
      extractedTasks: extractedTasks.slice(0, 5), // Limit to 5 tasks max
      actionWords: foundActionWords,
      timeIndicators: foundTimeIndicators
    };
  }

  async categorizeMessage(text: string, message: EmailMessage): Promise<CategoryResult> {
    const categories = {
      'PROJECT_MANAGEMENT': {
        keywords: ['project', 'milestone', 'deliverable', 'timeline', 'scope', 'requirement'],
        subcategories: ['Planning', 'Execution', 'Review', 'Closure']
      },
      'CLIENT_COMMUNICATION': {
        keywords: ['client', 'customer', 'proposal', 'quote', 'contract', 'meeting'],
        subcategories: ['Sales', 'Support', 'Feedback', 'Onboarding']
      },
      'INTERNAL_OPERATIONS': {
        keywords: ['team', 'internal', 'process', 'policy', 'procedure', 'workflow'],
        subcategories: ['HR', 'IT', 'Finance', 'Operations']
      },
      'TECHNICAL': {
        keywords: ['bug', 'feature', 'development', 'code', 'system', 'technical'],
        subcategories: ['Development', 'Testing', 'Deployment', 'Support']
      },
      'ADMINISTRATIVE': {
        keywords: ['invoice', 'payment', 'document', 'report', 'compliance', 'legal'],
        subcategories: ['Finance', 'Legal', 'Documentation', 'Compliance']
      }
    };

    let bestMatch = { category: 'GENERAL', confidence: 0, subcategory: undefined };
    const foundTags: string[] = [];

    Object.entries(categories).forEach(([category, config]) => {
      const matchCount = config.keywords.reduce((count, keyword) => {
        return count + (text.toLowerCase().includes(keyword) ? 1 : 0);
      }, 0);

      const confidence = matchCount / config.keywords.length;
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          category,
          confidence,
          subcategory: config.subcategories[0] // Default to first subcategory
        };
      }

      // Add matched keywords as tags
      config.keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          foundTags.push(keyword);
        }
      });
    });

    // Determine business value based on category and urgency
    let businessValue: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    const highValueCategories = ['CLIENT_COMMUNICATION', 'PROJECT_MANAGEMENT'];
    const urgentWords = ['urgent', 'critical', 'important', 'priority'];
    
    if (highValueCategories.includes(bestMatch.category)) {
      businessValue = 'HIGH';
    } else if (urgentWords.some(word => text.toLowerCase().includes(word))) {
      businessValue = 'HIGH';
    } else if (bestMatch.category === 'ADMINISTRATIVE') {
      businessValue = 'LOW';
    }

    return {
      category: bestMatch.category,
      subcategory: bestMatch.subcategory,
      confidence: bestMatch.confidence,
      tags: [...new Set(foundTags)], // Remove duplicates
      businessValue
    };
  }

  private calculateUrgencyScore(
    text: string, 
    message: EmailMessage, 
    sentiment: SentimentResult
  ): number {
    let score = 0;

    // High urgency indicators
    const highUrgencyWords = ['urgent', 'asap', 'emergency', 'critical', 'immediately'];
    const mediumUrgencyWords = ['soon', 'today', 'this week', 'deadline', 'important'];
    const lowUrgencyWords = ['when you can', 'no rush', 'sometime', 'eventually', 'fyi'];

    const lowerText = text.toLowerCase();

    highUrgencyWords.forEach(word => {
      if (lowerText.includes(word)) score += 30;
    });

    mediumUrgencyWords.forEach(word => {
      if (lowerText.includes(word)) score += 15;
    });

    lowUrgencyWords.forEach(word => {
      if (lowerText.includes(word)) score -= 20;
    });

    // Punctuation analysis
    const questionMarks = (text.match(/\?/g) || []).length;
    const exclamationMarks = (text.match(/!/g) || []).length;
    score += questionMarks * 5;
    score += exclamationMarks * 10;

    // Length analysis (shorter messages often more urgent)
    if (text.length < 100) score += 10;
    else if (text.length > 500) score -= 5;

    // ALL CAPS analysis
    const capsWords = text.match(/\b[A-Z]{3,}\b/g) || [];
    score += capsWords.length * 5;

    // Time sensitivity
    const timePattern = /\b(?:today|tomorrow|this morning|this afternoon|by \d|deadline)\b/i;
    if (timePattern.test(text)) score += 20;

    // Sentiment impact
    if (sentiment.label === 'NEGATIVE') score += 10;
    else if (sentiment.label === 'POSITIVE') score -= 5;

    // Subject line analysis
    if (message.subject && message.subject.toUpperCase() === message.subject) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  private assessComplexity(text: string, message: EmailMessage): 'LOW' | 'MEDIUM' | 'HIGH' {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    // Complex indicators
    const complexWords = text.match(/\b\w{10,}\b/g) || [];
    const technicalTerms = [
      'implementation', 'configuration', 'optimization', 'architecture',
      'integration', 'specification', 'documentation', 'methodology'
    ];
    
    const technicalCount = technicalTerms.reduce((count, term) => {
      return count + (text.toLowerCase().includes(term) ? 1 : 0);
    }, 0);

    let complexityScore = 0;
    
    // Length-based complexity
    if (wordCount > 300) complexityScore += 2;
    else if (wordCount > 150) complexityScore += 1;
    
    // Sentence structure complexity
    if (avgWordsPerSentence > 20) complexityScore += 2;
    else if (avgWordsPerSentence > 15) complexityScore += 1;
    
    // Technical content
    complexityScore += Math.min(technicalCount, 3);
    complexityScore += Math.min(complexWords.length / 10, 2);

    if (complexityScore >= 5) return 'HIGH';
    if (complexityScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private estimateReadTime(text: string): number {
    const wordCount = text.split(/\s+/).length;
    const averageReadingSpeed = 200; // words per minute
    return Math.max(1, Math.ceil(wordCount / averageReadingSpeed));
  }

  private extractKeyTopics(text: string): string[] {
    // Simple keyword extraction based on frequency and importance
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private generateSummary(text: string, message: EmailMessage): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length <= 2) {
      return text.substring(0, 150) + (text.length > 150 ? '...' : '');
    }

    // Score sentences based on position, length, and key terms
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position scoring (first and last sentences often important)
      if (index === 0) score += 3;
      if (index === sentences.length - 1) score += 2;
      
      // Length scoring (avoid too short or too long sentences)
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount >= 10 && wordCount <= 25) score += 2;
      
      // Key term scoring
      const keyTerms = ['important', 'please', 'need', 'deadline', 'project', 'meeting'];
      keyTerms.forEach(term => {
        if (sentence.toLowerCase().includes(term)) score += 1;
      });
      
      return { sentence: sentence.trim(), score };
    });

    // Select top sentences for summary
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(item => item.sentence);

    return topSentences.join(' ').substring(0, 200) + '...';
  }

  private generateRecommendedActions(
    text: string,
    tasks: TaskDetectionResult,
    sentiment: SentimentResult,
    category: CategoryResult
  ): string[] {
    const actions: string[] = [];

    // Task-based recommendations
    if (tasks.hasTasks) {
      if (tasks.extractedTasks.length > 0) {
        actions.push(`Create ${tasks.extractedTasks.length} task(s) from this message`);
      }
      if (tasks.timeIndicators.length > 0) {
        actions.push('Set calendar reminders for time-sensitive items');
      }
    }

    // Sentiment-based recommendations
    if (sentiment.label === 'NEGATIVE' && sentiment.confidence > 0.6) {
      actions.push('Prioritize response - negative sentiment detected');
    } else if (sentiment.label === 'POSITIVE') {
      actions.push('Consider this for testimonial or case study');
    }

    // Category-based recommendations
    if (category.category === 'CLIENT_COMMUNICATION') {
      actions.push('Update CRM with client interaction');
      if (category.businessValue === 'HIGH') {
        actions.push('Escalate to account manager if needed');
      }
    } else if (category.category === 'PROJECT_MANAGEMENT') {
      actions.push('Update project status and timeline');
    } else if (category.category === 'TECHNICAL') {
      actions.push('Assign to appropriate technical team member');
    }

    // Urgency-based recommendations
    const urgentKeywords = ['urgent', 'asap', 'critical', 'emergency'];
    if (urgentKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      actions.push('Respond within 1 hour - urgent matter');
    }

    // Default recommendations if none specific
    if (actions.length === 0) {
      actions.push('Review and respond as appropriate');
      actions.push('File in appropriate project or context');
    }

    return actions.slice(0, 4); // Limit to 4 recommendations
  }

  private parseRelativeDate(dateString: string): Date | undefined {
    const today = new Date();
    const lower = dateString.toLowerCase().trim();

    if (lower.includes('today')) {
      return today;
    } else if (lower.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow;
    } else if (lower.includes('this week') || lower.includes('end of week')) {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (5 - today.getDay())); // Friday
      return endOfWeek;
    } else if (lower.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return nextWeek;
    }

    // Try to parse specific day names
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lower.includes(days[i])) {
        const targetDay = new Date(today);
        const daysUntilTarget = (i - today.getDay() + 7) % 7;
        targetDay.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        return targetDay;
      }
    }

    return undefined;
  }

  private extractTaskTitle(taskText: string): string {
    // Remove common prefixes and get a clean task title
    let title = taskText
      .replace(/^(please|can you|could you|would you|need to|must|should|required to)\s+/i, '')
      .replace(/[.!?]+$/, '')
      .trim();

    // Capitalize first letter
    if (title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    // Limit length
    if (title.length > 80) {
      title = title.substring(0, 77) + '...';
    }

    return title || 'Review message for action items';
  }

  async saveAnalysisResults(messageId: string, analysis: ComprehensiveAnalysis): Promise<void> {
    try {
      // Update the message with analysis results
      await prisma.message.update({
        where: { id: messageId },
        data: {
          sentiment: analysis.sentiment.label,
          urgencyScore: analysis.urgencyScore,
          actionNeeded: analysis.tasks.hasTasks,
          extractedTasks: analysis.tasks.extractedTasks.map(t => t.title),
          extractedContext: analysis.category.category,
          // Store additional analysis data in a separate table or JSON field
          // This would depend on your schema design
        }
      });

      // Create tasks if they were detected
      if (analysis.tasks.hasTasks && analysis.tasks.extractedTasks.length > 0) {
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          include: { channel: true }
        });

        if (message) {
          for (const task of analysis.tasks.extractedTasks) {
            if (task.confidence > 0.6) { // Only create high-confidence tasks
              await prisma.task.create({
                data: {
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  status: 'NEW',
                  context: task.context,
                  dueDate: task.dueDate,
                  organizationId: message.organizationId,
                  createdById: message.channel.userId,
                  messageId: messageId,
                  smartScore: Math.round(task.confidence * 100)
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error saving analysis results:', error);
      throw error;
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();