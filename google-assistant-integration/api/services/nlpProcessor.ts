import { createLogger } from './logger';
import { DatabaseService } from './databaseService';

export class NLPProcessor {
  private logger: ReturnType<typeof createLogger>;
  private db: DatabaseService;

  // Common words to filter out when matching
  private stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'i', 'you', 'we', 'they', 'my', 'your',
    'our', 'this', 'these', 'those', 'zadanie', 'task', 'create', 'add',
    'show', 'dodaj', 'utwórz', 'pokaż', 'nowy', 'nowe', 'new'
  ]);

  // Priority keywords mapping
  private priorityKeywords = {
    HIGH: ['pilne', 'ważne', 'urgent', 'important', 'krytyczne', 'critical', 'asap', 'natychmiast'],
    MEDIUM: ['średni', 'normalny', 'medium', 'normal', 'standardowy', 'zwykły'],
    LOW: ['niski', 'mało ważne', 'low', 'later', 'może', 'when possible']
  };

  // Context keywords mapping
  private contextKeywords = {
    '@computer': ['komputer', 'komputerze', 'biurko', 'laptop', 'pc', 'computer', 'online'],
    '@calls': ['telefon', 'rozmowy', 'dzwonienie', 'calls', 'phone', 'call'],
    '@office': ['biuro', 'biurze', 'praca', 'office', 'work', 'workplace'],
    '@home': ['dom', 'domu', 'mieszkanie', 'home', 'house'],
    '@errands': ['sprawy', 'zakupy', 'miasto', 'errands', 'shopping', 'outside'],
    '@online': ['internet', 'sieć', 'www', 'website', 'web'],
    '@waiting': ['oczekiwanie', 'czekanie', 'waiting', 'wait'],
    '@reading': ['czytanie', 'lektura', 'reading', 'książki', 'book', 'article']
  };

  // Time-related keywords
  private timeKeywords = {
    TODAY: ['dziś', 'dzisiaj', 'today'],
    TOMORROW: ['jutro', 'tomorrow'],
    THIS_WEEK: ['w tym tygodniu', 'this week', 'ten tydzień'],
    NEXT_WEEK: ['następny tydzień', 'next week', 'przyszły tydzień'],
    URGENT: ['natychmiast', 'asap', 'immediately', 'right now', 'teraz']
  };

  constructor() {
    this.logger = createLogger();
    this.db = new DatabaseService();
  }

  /**
   * Extract and clean task description from voice input
   */
  extractTaskDescription(parameters: any): string {
    let description = parameters.task_description?.resolved || 
                     parameters.task_description?.original ||
                     parameters.description?.resolved ||
                     parameters.description?.original ||
                     '';

    // Clean up common prefixes
    description = description
      .replace(/^(dodaj zadanie|add task|utwórz zadanie|create task)\s*/i, '')
      .replace(/^(nowe zadanie|new task)\s*/i, '')
      .trim();

    return description;
  }

  /**
   * Analyze task intent and extract metadata
   */
  async analyzeTaskIntent(description: string, parameters: any): Promise<any> {
    const analysis = {
      priority: this.extractPriority(description, parameters),
      context: this.extractContext(description, parameters),
      dueDate: this.extractDueDate(description, parameters),
      estimatedTime: this.extractEstimatedTime(description),
      tags: this.extractTags(description),
      confidence: this.calculateConfidence(description, parameters),
      entities: await this.extractEntities(description),
      description: this.cleanDescription(description)
    };

    return analysis;
  }

  /**
   * Extract priority from text and parameters
   */
  private extractPriority(text: string, parameters: any): string {
    // First check explicit parameters
    if (parameters.task_priority?.resolved) {
      return parameters.task_priority.resolved.toUpperCase();
    }

    // Then check for priority keywords in text
    const lowerText = text.toLowerCase();
    
    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return priority;
      }
    }

    // Default priority based on urgency indicators
    if (this.containsUrgencyIndicators(lowerText)) {
      return 'HIGH';
    }

    return 'MEDIUM';
  }

  /**
   * Extract context from text and parameters
   */
  private extractContext(text: string, parameters: any): string {
    // First check explicit parameters
    if (parameters.task_context?.resolved) {
      return parameters.task_context.resolved;
    }

    // Then check for context keywords in text
    const lowerText = text.toLowerCase();
    
    for (const [context, keywords] of Object.entries(this.contextKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return context;
      }
    }

    // Smart context inference based on task content
    return this.inferContextFromContent(lowerText);
  }

  /**
   * Extract due date from text and parameters
   */
  private extractDueDate(text: string, parameters: any): Date | null {
    // First check explicit parameters
    if (parameters.task_date?.resolved) {
      return new Date(parameters.task_date.resolved);
    }

    // Then parse time keywords from text
    const lowerText = text.toLowerCase();
    const now = new Date();

    for (const [timeType, keywords] of Object.entries(this.timeKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        switch (timeType) {
          case 'TODAY':
            return now;
          case 'TOMORROW':
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            return tomorrow;
          case 'THIS_WEEK':
            const endOfWeek = new Date(now);
            endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
            return endOfWeek;
          case 'NEXT_WEEK':
            const nextWeek = new Date(now);
            nextWeek.setDate(now.getDate() + 7);
            return nextWeek;
          case 'URGENT':
            return now;
        }
      }
    }

    return null;
  }

  /**
   * Extract estimated time from task description
   */
  private extractEstimatedTime(text: string): number | null {
    const timeRegex = /(\d+)\s*(min|minut|hour|godzin|h|m)/i;
    const match = text.match(timeRegex);
    
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.startsWith('h') || unit.includes('godzin')) {
        return value * 60; // Convert to minutes
      } else {
        return value; // Already in minutes
      }
    }

    // Estimate based on task complexity
    return this.estimateTaskComplexity(text);
  }

  /**
   * Extract tags from task description
   */
  private extractTags(text: string): string[] {
    const tags: string[] = [];
    
    // Look for hashtags
    const hashtagRegex = /#(\w+)/g;
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
      tags.push(match[1]);
    }
    
    // Look for project names
    const projectRegex = /projekt\s+(\w+)/gi;
    while ((match = projectRegex.exec(text)) !== null) {
      tags.push(`project:${match[1]}`);
    }
    
    // Look for client names
    const clientRegex = /dla\s+klienta\s+(\w+)/gi;
    while ((match = clientRegex.exec(text)) !== null) {
      tags.push(`client:${match[1]}`);
    }

    return tags;
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateConfidence(description: string, parameters: any): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for explicit parameters
    if (parameters.task_priority?.resolved) confidence += 0.2;
    if (parameters.task_context?.resolved) confidence += 0.2;
    if (parameters.task_date?.resolved) confidence += 0.2;
    
    // Higher confidence for clear task descriptions
    if (description.length > 10) confidence += 0.1;
    if (description.includes(' ')) confidence += 0.1;
    
    // Lower confidence for very short or unclear descriptions
    if (description.length < 5) confidence -= 0.3;
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Extract named entities from text
   */
  async extractEntities(text: string): Promise<any[]> {
    const entities: any[] = [];
    
    // Extract person names (simple approach)
    const personRegex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    let match;
    while ((match = personRegex.exec(text)) !== null) {
      entities.push({
        type: 'PERSON',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    // Extract dates
    const dateRegex = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g;
    while ((match = dateRegex.exec(text)) !== null) {
      entities.push({
        type: 'DATE',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    while ((match = emailRegex.exec(text)) !== null) {
      entities.push({
        type: 'EMAIL',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return entities;
  }

  /**
   * Clean description by removing extracted metadata
   */
  private cleanDescription(description: string): string {
    return description
      .replace(/#\w+/g, '') // Remove hashtags
      .replace(/\b(pilne|urgent|ważne|important)\b/gi, '') // Remove priority words
      .replace(/\b(dziś|jutro|today|tomorrow)\b/gi, '') // Remove time words
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Check if text contains urgency indicators
   */
  private containsUrgencyIndicators(text: string): boolean {
    const urgencyWords = ['pilne', 'urgent', 'asap', 'natychmiast', 'critical', 'krytyczne'];
    return urgencyWords.some(word => text.includes(word));
  }

  /**
   * Infer context from task content
   */
  private inferContextFromContent(text: string): string {
    if (text.includes('email') || text.includes('mail') || text.includes('@')) {
      return '@computer';
    }
    if (text.includes('telefon') || text.includes('zadzwon') || text.includes('call')) {
      return '@calls';
    }
    if (text.includes('spotkanie') || text.includes('meeting') || text.includes('prezentacja')) {
      return '@office';
    }
    if (text.includes('zakupy') || text.includes('sklep') || text.includes('shopping')) {
      return '@errands';
    }
    if (text.includes('czytaj') || text.includes('przeczytaj') || text.includes('read')) {
      return '@reading';
    }
    
    return '@computer'; // Default context
  }

  /**
   * Estimate task complexity based on description
   */
  private estimateTaskComplexity(text: string): number {
    const wordCount = text.split(' ').length;
    
    if (wordCount <= 3) return 15; // Simple task - 15 minutes
    if (wordCount <= 6) return 30; // Medium task - 30 minutes
    if (wordCount <= 10) return 60; // Complex task - 1 hour
    
    return 120; // Very complex task - 2 hours
  }

  /**
   * Extract task filters from voice parameters
   */
  async extractTaskFilters(parameters: any): Promise<any> {
    const filters: any = {};
    
    if (parameters.task_filter?.resolved) {
      const filterText = parameters.task_filter.resolved.toLowerCase();
      
      if (filterText.includes('pilne') || filterText.includes('urgent')) {
        filters.priority = 'HIGH';
      }
      if (filterText.includes('ukończone') || filterText.includes('completed')) {
        filters.status = 'COMPLETED';
      }
      if (filterText.includes('projekt') || filterText.includes('project')) {
        filters.hasProject = true;
      }
    }
    
    return filters;
  }

  /**
   * Find task by name using fuzzy matching
   */
  async findTaskByName(taskName: string): Promise<any | null> {
    try {
      // Get all active tasks
      const result = await this.db.query(`
        SELECT id, title, description, priority, status, context
        FROM tasks 
        WHERE status != 'COMPLETED' 
        ORDER BY created_at DESC 
        LIMIT 50
      `);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Find best match using fuzzy string matching
      const bestMatch = this.findBestMatch(taskName, result.rows, 'title');
      
      return bestMatch;
      
    } catch (error) {
      this.logger.error('Error finding task by name:', error);
      return null;
    }
  }

  /**
   * Extract person name from parameters with normalization
   */
  async extractPersonName(nameParameter: any): Promise<string | null> {
    if (!nameParameter) return null;
    
    let name = nameParameter.resolved || nameParameter.original || '';
    
    // Normalize name
    name = name
      .replace(/^(klient|client|mr|mrs|pan|pani)\s+/i, '')
      .trim();
    
    // Capitalize properly
    name = name.replace(/\b\w/g, l => l.toUpperCase());
    
    return name || null;
  }

  /**
   * Find client by name using fuzzy matching
   */
  async findClientByName(clientName: string): Promise<any | null> {
    try {
      const result = await this.db.query(`
        SELECT id, name, email, company, phone
        FROM contacts 
        WHERE name ILIKE $1 OR company ILIKE $1
        ORDER BY created_at DESC 
        LIMIT 20
      `, [`%${clientName}%`]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.findBestMatch(clientName, result.rows, 'name');
      
    } catch (error) {
      this.logger.error('Error finding client by name:', error);
      return null;
    }
  }

  /**
   * Find lead by name using fuzzy matching
   */
  async findLeadByName(leadName: string): Promise<any | null> {
    try {
      const result = await this.db.query(`
        SELECT id, company_name, contact_person, status, estimated_value
        FROM leads 
        WHERE company_name ILIKE $1 OR contact_person ILIKE $1
        ORDER BY created_at DESC 
        LIMIT 20
      `, [`%${leadName}%`]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.findBestMatch(leadName, result.rows, 'company_name');
      
    } catch (error) {
      this.logger.error('Error finding lead by name:', error);
      return null;
    }
  }

  /**
   * Find lead by company name
   */
  async findLeadByCompany(companyName: string): Promise<any | null> {
    try {
      const result = await this.db.query(`
        SELECT id, company_name, contact_person, status
        FROM leads 
        WHERE company_name ILIKE $1
        LIMIT 1
      `, [`%${companyName}%`]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
      
    } catch (error) {
      this.logger.error('Error finding lead by company:', error);
      return null;
    }
  }

  /**
   * Classify note type based on content
   */
  async classifyNoteType(content: string): Promise<string> {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('spotkanie') || lowerContent.includes('meeting')) {
      return 'MEETING';
    }
    if (lowerContent.includes('telefon') || lowerContent.includes('call') || lowerContent.includes('rozmowa')) {
      return 'CALL';
    }
    if (lowerContent.includes('email') || lowerContent.includes('mail') || lowerContent.includes('wiadomość')) {
      return 'EMAIL';
    }
    if (lowerContent.includes('follow-up') || lowerContent.includes('następny krok')) {
      return 'FOLLOW_UP';
    }
    
    return 'GENERAL';
  }

  /**
   * Parse date and time from various formats
   */
  async parseDateTime(dateTimeParameter: any): Promise<Date | null> {
    if (!dateTimeParameter) return null;
    
    let dateString = dateTimeParameter.resolved || dateTimeParameter.original || '';
    
    // Handle common Polish date expressions
    const now = new Date();
    
    if (dateString.includes('jutro') || dateString.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
      return tomorrow;
    }
    
    if (dateString.includes('pojutrze')) {
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(now.getDate() + 2);
      dayAfterTomorrow.setHours(9, 0, 0, 0);
      return dayAfterTomorrow;
    }
    
    if (dateString.includes('przyszły tydzień') || dateString.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek;
    }
    
    // Try to parse standard date formats
    try {
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (error) {
      this.logger.warn('Could not parse date:', dateString);
    }
    
    return null;
  }

  /**
   * Find best match using simple string similarity
   */
  private findBestMatch(query: string, candidates: any[], fieldName: string): any | null {
    if (candidates.length === 0) return null;
    
    let bestMatch = null;
    let bestScore = 0;
    
    const queryLower = query.toLowerCase();
    
    for (const candidate of candidates) {
      const candidateText = (candidate[fieldName] || '').toLowerCase();
      const score = this.calculateStringSimilarity(queryLower, candidateText);
      
      if (score > bestScore && score > 0.3) { // Minimum similarity threshold
        bestScore = score;
        bestMatch = candidate;
      }
    }
    
    return bestMatch;
  }

  /**
   * Calculate string similarity using simple algorithm
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Exact match
    if (str1 === str2) return 1.0;
    
    // Contains match
    if (str2.includes(str1) || str1.includes(str2)) return 0.8;
    
    // Word overlap
    const words1 = str1.split(' ').filter(word => !this.stopWords.has(word));
    const words2 = str2.split(' ').filter(word => !this.stopWords.has(word));
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const overlap = commonWords.length / Math.max(words1.length, words2.length);
    
    return overlap;
  }
}

export default NLPProcessor;