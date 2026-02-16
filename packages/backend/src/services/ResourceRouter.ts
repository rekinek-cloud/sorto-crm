/**
 * ResourceRouter - Inteligentny system routingu resources (tasks, contacts, deals) do odpowiednich GTD streams
 * Automatyczne przypisywanie na podstawie kontekstu, poziomu energii i analizy treści
 */

import { PrismaClient, Task, Contact, Deal, Stream, Message, StreamRole, StreamType } from '@prisma/client';
import { StreamContext, EnergyLevel } from '../types/streams';
import { VectorService } from './VectorService';

/**
 * Wynik routingu zasobu
 */
export interface RoutingResult {
  streamId: string;
  streamName: string;
  confidence: number; // 0-1
  reasoning: string[];
  fallbackUsed: boolean;
  suggestedContext?: StreamContext;
  suggestedEnergyLevel?: EnergyLevel;
  additionalActions?: Array<{
    type: 'CREATE_TASK' | 'ASSIGN_CONTEXT' | 'SET_PRIORITY' | 'SEND_NOTIFICATION';
    config: Record<string, any>;
  }>;
}

/**
 * Opcje routingu
 */
export interface RoutingOptions {
  organizationId: string;
  userId: string;
  preferredStreamId?: string;
  forceStream?: boolean;
  enableAI?: boolean;
  confidenceThreshold?: number; // Minimum confidence to route (default 0.5)
  createStreamIfNeeded?: boolean;
}

/**
 * Reguła routingu konfigurowana per organizacja
 */
export interface RoutingRule {
  id: string;
  name: string;
  active: boolean;
  priority: number; // Higher = executed first

  // Conditions
  resourceType: 'TASK' | 'EMAIL' | 'CONTACT' | 'DEAL' | 'ALL';
  conditions: {
    keywords?: string[];
    senderDomain?: string[];
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
    hasAttachments?: boolean;
    contactType?: string;
    dealValue?: { min?: number; max?: number };
    taskPriority?: 'LOW' | 'MEDIUM' | 'HIGH';
  };

  // Target stream
  targetStreamId: string;
  targetContext?: StreamContext;
  targetEnergyLevel?: EnergyLevel;

  // Additional actions
  actions?: Array<{
    type: 'CREATE_TASK' | 'ASSIGN_CONTEXT' | 'SET_PRIORITY' | 'SEND_NOTIFICATION';
    config: Record<string, any>;
  }>;
}

/**
 * Statystyki routingu
 */
export interface RoutingStats {
  totalRouted: number;
  routedByStream: Record<string, number>;
  routedByConfidence: {
    high: number; // >0.8
    medium: number; // 0.5-0.8
    low: number; // <0.5
  };
  fallbackUsed: number;
  averageConfidence: number;
  successfulRoutes: number;
  failedRoutes: number;
}

/**
 * Resource Router - Inteligentne przypisywanie zasobów
 */
export class ResourceRouter {
  private prisma: PrismaClient;
  private logger: any;
  private vectorService: VectorService;
  private routingRules: Map<string, RoutingRule[]> = new Map();
  private defaultStreamCache: Map<string, string> = new Map();

  constructor(prisma: PrismaClient, logger?: any) {
    this.prisma = prisma;
    this.logger = logger || console;
    this.vectorService = new VectorService(prisma);
  }

  // ========================================
  // MAIN ROUTING METHODS
  // ========================================

  /**
   * Routuje zadanie do odpowiedniego streama na podstawie kontekstu i poziomu energii
   */
  async routeTaskToStream(
    task: {
      title: string;
      description?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH';
      dueDate?: Date;
      estimatedHours?: number;
      context?: string;
    },
    options: RoutingOptions
  ): Promise<RoutingResult> {
    try {
      const { organizationId, userId, confidenceThreshold = 0.5 } = options;

      // Sprawdź niestandardowe reguły
      const customResult = await this.applyCustomRoutingRules(task, 'TASK', options);
      if (customResult && customResult.confidence >= confidenceThreshold) {
        return customResult;
      }

      // Analiza kontekstu z tytułu i opisu
      const content = `${task.title} ${task.description || ''}`.toLowerCase();
      let targetContext = this.detectContext(content);
      let targetEnergyLevel = this.detectEnergyLevel(content, task.estimatedHours);

      // Uwzględnij priorytet w poziomie energii
      if (task.priority === 'HIGH') {
        targetEnergyLevel = EnergyLevel.HIGH;
      } else if (task.priority === 'LOW') {
        targetEnergyLevel = EnergyLevel.LOW;
      }

      // Analiza czy to zadanie natychmiastowe (<2 min GTD rule)
      const isQuickTask = this.isQuickTask(content, task.estimatedHours);
      const isUrgent = task.priority === 'HIGH' || this.detectUrgency(content) > 0.7;

      let confidence = 0.6;
      const reasoning: string[] = [];

      // Znajdź najbardziej odpowiedni stream
      let targetStreamId: string;

      if (isQuickTask) {
        // Zadania <2min idą do NEXT_ACTIONS
        const nextActionsStream = await this.findStreamByRole(organizationId, StreamRole.NEXT_ACTIONS);
        if (nextActionsStream) {
          targetStreamId = nextActionsStream.id;
          confidence = 0.9;
          reasoning.push('Quick task (<2min) routed to Next Actions');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'TASK');
          confidence = 0.5;
          reasoning.push('No Next Actions stream found, using default');
        }
      } else if (isUrgent) {
        // Pilne zadania do NEXT_ACTIONS z wysokim priorytetem
        const nextActionsStream = await this.findStreamByRole(organizationId, StreamRole.NEXT_ACTIONS);
        if (nextActionsStream) {
          targetStreamId = nextActionsStream.id;
          confidence = 0.85;
          reasoning.push('Urgent task routed to Next Actions');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'TASK');
          confidence = 0.5;
          reasoning.push('No Next Actions stream found, using default');
        }
      } else if (this.detectProjectKeywords(content)) {
        // Zadania projektowe
        const projectsStream = await this.findStreamByRole(organizationId, StreamRole.PROJECTS);
        if (projectsStream) {
          targetStreamId = projectsStream.id;
          confidence = 0.8;
          reasoning.push('Project-related task routed to Projects');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'TASK');
          confidence = 0.5;
          reasoning.push('No Projects stream found, using default');
        }
      } else {
        // Standardowe zadania do NEXT_ACTIONS lub INBOX
        const nextActionsStream = await this.findStreamByRole(organizationId, StreamRole.NEXT_ACTIONS);
        if (nextActionsStream) {
          targetStreamId = nextActionsStream.id;
          confidence = 0.7;
          reasoning.push('Standard task routed to Next Actions');
        } else {
          const inboxStream = await this.findStreamByRole(organizationId, StreamRole.INBOX);
          if (inboxStream) {
            targetStreamId = inboxStream.id;
            confidence = 0.6;
            reasoning.push('No Next Actions found, routed to Inbox for processing');
          } else {
            targetStreamId = await this.getDefaultStream(organizationId, 'TASK');
            confidence = 0.4;
            reasoning.push('No GTD streams found, using default');
          }
        }
      }

      const stream = await this.prisma.stream.findUnique({
        where: { id: targetStreamId },
        select: { id: true, name: true }
      });

      return {
        streamId: targetStreamId,
        streamName: stream?.name || 'Unknown Stream',
        confidence,
        reasoning,
        fallbackUsed: confidence < 0.6,
        suggestedContext: targetContext,
        suggestedEnergyLevel: targetEnergyLevel,
        additionalActions: this.generateTaskActions(task, targetContext, targetEnergyLevel) as any
      };

    } catch (error) {
      this.logger.error('Error routing task to stream:', error);
      throw new Error('Failed to route task to stream');
    }
  }

  /**
   * Routuje email do streama z content analysis
   */
  async routeEmailToStream(
    email: {
      subject: string;
      content: string;
      fromAddress: string;
      fromName?: string;
      hasAttachments?: boolean;
      urgencyScore?: number;
    },
    options: RoutingOptions
  ): Promise<RoutingResult> {
    try {
      const { organizationId, confidenceThreshold = 0.5 } = options;

      // Sprawdź niestandardowe reguły
      const customResult = await this.applyCustomRoutingRules(email, 'EMAIL', options);
      if (customResult && customResult.confidence >= confidenceThreshold) {
        return customResult;
      }

      const content = `${email.subject} ${email.content}`.toLowerCase();
      const urgency = email.urgencyScore || this.detectUrgency(content);
      const reasoning: string[] = [];
      let confidence = 0.6;

      // Analiza treści emaila
      const isActionRequired = this.detectActionRequired(content);
      const isInformational = this.detectInformational(content);
      const isWaitingFor = this.detectWaitingFor(content);
      const isDelegation = this.detectDelegation(content);

      let targetStreamId: string;

      if (isWaitingFor) {
        const waitingStream = await this.findStreamByRole(organizationId, StreamRole.WAITING_FOR);
        if (waitingStream) {
          targetStreamId = waitingStream.id;
          confidence = 0.85;
          reasoning.push('Email indicates waiting for response');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'EMAIL');
          confidence = 0.5;
        }
      } else if (isDelegation) {
        const projectsStream = await this.findStreamByRole(organizationId, StreamRole.PROJECTS);
        if (projectsStream) {
          targetStreamId = projectsStream.id;
          confidence = 0.8;
          reasoning.push('Email contains delegation - routed to Projects');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'EMAIL');
          confidence = 0.5;
        }
      } else if (isActionRequired && urgency > 0.7) {
        const nextActionsStream = await this.findStreamByRole(organizationId, StreamRole.NEXT_ACTIONS);
        if (nextActionsStream) {
          targetStreamId = nextActionsStream.id;
          confidence = 0.9;
          reasoning.push('Urgent action required - routed to Next Actions');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'EMAIL');
          confidence = 0.5;
        }
      } else if (isActionRequired) {
        const inboxStream = await this.findStreamByRole(organizationId, StreamRole.INBOX);
        if (inboxStream) {
          targetStreamId = inboxStream.id;
          confidence = 0.8;
          reasoning.push('Action required - routed to Inbox for processing');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'EMAIL');
          confidence = 0.5;
        }
      } else if (isInformational) {
        const referenceStream = await this.findStreamByRole(organizationId, StreamRole.REFERENCE);
        if (referenceStream) {
          targetStreamId = referenceStream.id;
          confidence = 0.75;
          reasoning.push('Informational email - routed to Reference');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'EMAIL');
          confidence = 0.5;
        }
      } else {
        // Default do inbox dla przetworzenia
        const inboxStream = await this.findStreamByRole(organizationId, StreamRole.INBOX);
        if (inboxStream) {
          targetStreamId = inboxStream.id;
          confidence = 0.6;
          reasoning.push('Default routing to Inbox for processing');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'EMAIL');
          confidence = 0.4;
        }
      }

      const stream = await this.prisma.stream.findUnique({
        where: { id: targetStreamId },
        select: { id: true, name: true }
      });

      return {
        streamId: targetStreamId,
        streamName: stream?.name || 'Unknown Stream',
        confidence,
        reasoning,
        fallbackUsed: confidence < 0.6,
        suggestedContext: this.detectContext(content),
        suggestedEnergyLevel: urgency > 0.7 ? EnergyLevel.HIGH : EnergyLevel.MEDIUM,
        additionalActions: this.generateEmailActions(email, isActionRequired) as any
      };

    } catch (error) {
      this.logger.error('Error routing email to stream:', error);
      throw new Error('Failed to route email to stream');
    }
  }

  /**
   * Routuje kontakt do streama z relationship mapping
   */
  async routeContactToStream(
    contact: {
      firstName: string;
      lastName: string;
      email?: string;
      company?: string;
      position?: string;
      status?: string;
      source?: string;
    },
    options: RoutingOptions
  ): Promise<RoutingResult> {
    try {
      const { organizationId } = options;

      const reasoning: string[] = [];
      let confidence = 0.7;
      let targetStreamId: string;

      // Analiza statusu kontaktu
      const isHotLead = contact.status?.toLowerCase().includes('hot') ||
        contact.status?.toLowerCase().includes('interested');
      const isCustomer = contact.status?.toLowerCase().includes('customer') ||
        contact.status?.toLowerCase().includes('client');
      const isVIP = contact.position?.toLowerCase().includes('ceo') ||
        contact.position?.toLowerCase().includes('director') ||
        contact.position?.toLowerCase().includes('vp');

      if (isHotLead || isVIP) {
        // Hot leads i VIP do aktywnych projektów
        const projectsStream = await this.findStreamByRole(organizationId, StreamRole.PROJECTS);
        if (projectsStream) {
          targetStreamId = projectsStream.id;
          confidence = 0.85;
          reasoning.push(isVIP ? 'VIP contact routed to Projects' : 'Hot lead routed to Projects');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'CONTACT');
          confidence = 0.5;
        }
      } else if (isCustomer) {
        // Istniejący klienci do obszarów odpowiedzialności
        const areasStream = await this.findStreamByRole(organizationId, StreamRole.AREAS);
        if (areasStream) {
          targetStreamId = areasStream.id;
          confidence = 0.8;
          reasoning.push('Existing customer routed to Areas');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'CONTACT');
          confidence = 0.5;
        }
      } else {
        // Nowi kontakty do inbox dla przetworzenia
        const inboxStream = await this.findStreamByRole(organizationId, StreamRole.INBOX);
        if (inboxStream) {
          targetStreamId = inboxStream.id;
          confidence = 0.7;
          reasoning.push('New contact routed to Inbox for processing');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'CONTACT');
          confidence = 0.5;
        }
      }

      const stream = await this.prisma.stream.findUnique({
        where: { id: targetStreamId },
        select: { id: true, name: true }
      });

      return {
        streamId: targetStreamId,
        streamName: stream?.name || 'Unknown Stream',
        confidence,
        reasoning,
        fallbackUsed: confidence < 0.6,
        suggestedContext: StreamContext.COMPUTER,
        suggestedEnergyLevel: isVIP ? EnergyLevel.HIGH : EnergyLevel.MEDIUM,
        additionalActions: this.generateContactActions(contact, isHotLead, isVIP) as any
      };

    } catch (error) {
      this.logger.error('Error routing contact to stream:', error);
      throw new Error('Failed to route contact to stream');
    }
  }

  /**
   * Routuje deal do streama z sales stage mapping
   */
  async routeDealToStream(
    deal: {
      title: string;
      value?: number;
      stage?: string;
      probability?: number;
      source?: string;
      contactId?: string;
      companyId?: string;
    },
    options: RoutingOptions
  ): Promise<RoutingResult> {
    try {
      const { organizationId } = options;

      const reasoning: string[] = [];
      let confidence = 0.7;
      let targetStreamId: string;

      const isHighValue = (deal.value || 0) > 50000;
      const isHighProbability = (deal.probability || 0) > 70;
      const isClosingStage = deal.stage?.toLowerCase().includes('closing') ||
        deal.stage?.toLowerCase().includes('negotiation') ||
        deal.stage?.toLowerCase().includes('proposal');

      if (isHighValue || (isHighProbability && isClosingStage)) {
        // Wysokowartościowe lub blisko zamknięcia do projektów
        const projectsStream = await this.findStreamByRole(organizationId, StreamRole.PROJECTS);
        if (projectsStream) {
          targetStreamId = projectsStream.id;
          confidence = 0.9;
          reasoning.push(isHighValue ? 'High-value deal routed to Projects' : 'High-probability closing deal routed to Projects');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'DEAL');
          confidence = 0.5;
        }
      } else if (isClosingStage) {
        // Zamykające się deale do następnych akcji
        const nextActionsStream = await this.findStreamByRole(organizationId, StreamRole.NEXT_ACTIONS);
        if (nextActionsStream) {
          targetStreamId = nextActionsStream.id;
          confidence = 0.85;
          reasoning.push('Closing stage deal routed to Next Actions');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'DEAL');
          confidence = 0.5;
        }
      } else {
        // Standardowe deale do obszarów odpowiedzialności
        const areasStream = await this.findStreamByRole(organizationId, StreamRole.AREAS);
        if (areasStream) {
          targetStreamId = areasStream.id;
          confidence = 0.75;
          reasoning.push('Standard deal routed to Areas');
        } else {
          targetStreamId = await this.getDefaultStream(organizationId, 'DEAL');
          confidence = 0.5;
        }
      }

      const stream = await this.prisma.stream.findUnique({
        where: { id: targetStreamId },
        select: { id: true, name: true }
      });

      return {
        streamId: targetStreamId,
        streamName: stream?.name || 'Unknown Stream',
        confidence,
        reasoning,
        fallbackUsed: confidence < 0.6,
        suggestedContext: StreamContext.COMPUTER,
        suggestedEnergyLevel: isHighValue ? EnergyLevel.HIGH : EnergyLevel.MEDIUM,
        additionalActions: this.generateDealActions(deal, isHighValue, isClosingStage) as any
      };

    } catch (error) {
      this.logger.error('Error routing deal to stream:', error);
      throw new Error('Failed to route deal to stream');
    }
  }

  /**
   * Routuje dowolną treść (np. Source item) do streama
   */
  async routeContentToStream(
    content: string,
    options: RoutingOptions
  ): Promise<RoutingResult> {
    try {
      const { organizationId, enableAI = true, confidenceThreshold = 0.5 } = options;
      const reasoning: string[] = [];
      let confidence = 0.0;
      let targetStreamId: string | null = null;
      let targetStreamName = 'Unknown Stream';

      // 1. Vector Search (AI)
      if (enableAI) {
        const searchResult = await this.vectorService.searchSimilar(organizationId, content, {
          limit: 3,
          threshold: 0.7,
          filters: { entityType: 'STREAM' }
        });

        if (searchResult.results.length > 0) {
          const bestMatch = searchResult.results[0];
          targetStreamId = bestMatch.entityId;
          targetStreamName = bestMatch.title;
          confidence = bestMatch.similarity;
          reasoning.push(`Matched similar stream "${bestMatch.title}" with ${(bestMatch.similarity * 100).toFixed(1)}% similarity`);
        }
      }

      // 2. Heuristics (Fallback or if AI low confidence)
      if (!targetStreamId || confidence < confidenceThreshold) {
        // Simple keyword matching against roles
        const lowerContent = content.toLowerCase();
        let roleMatch: StreamRole | null = null;

        if (lowerContent.includes('project')) roleMatch = StreamRole.PROJECTS;
        else if (lowerContent.includes('waiting')) roleMatch = StreamRole.WAITING_FOR;
        else if (lowerContent.includes('someday')) roleMatch = StreamRole.SOMEDAY_MAYBE;
        else if (lowerContent.includes('read')) roleMatch = StreamRole.REFERENCE;

        if (roleMatch) {
          const stream = await this.findStreamByRole(organizationId, roleMatch);
          if (stream) {
            // If heuristics are better than AI (or AI failed), use heuristics
            if (!targetStreamId || 0.6 > confidence) {
              targetStreamId = stream.id;
              targetStreamName = stream.name;
              confidence = 0.6;
              reasoning.push(`Heuristic match for role ${roleMatch}`);
            }
          }
        }
      }

      // 3. Default (Inbox)
      if (!targetStreamId) {
        const inboxStream = await this.findStreamByRole(organizationId, StreamRole.INBOX);
        if (inboxStream) {
          targetStreamId = inboxStream.id;
          targetStreamName = inboxStream.name;
          confidence = 0.9; // High confidence that it belongs in Inbox if we don't know where else
          reasoning.push('No specific match found, routing to Inbox');
        } else {
          // Absolute fallback
          throw new Error('No Inbox stream found');
        }
      }

      return {
        streamId: targetStreamId,
        streamName: targetStreamName,
        confidence,
        reasoning,
        fallbackUsed: confidence < confidenceThreshold,
        suggestedContext: this.detectContext(content),
        suggestedEnergyLevel: this.detectEnergyLevel(content)
      };

    } catch (error) {
      this.logger.error('Error routing content to stream:', error);
      throw new Error('Failed to route content to stream');
    }
  }

  // ========================================
  // CONFIGURATION AND RULES MANAGEMENT
  // ========================================

  /**
   * Ładuje reguły routingu dla organizacji
   */
  async loadRoutingRules(organizationId: string): Promise<RoutingRule[]> {
    try {
      // TODO: Implement loading from database
      // For now, return empty array
      const rules: RoutingRule[] = [];
      this.routingRules.set(organizationId, rules);
      return rules;
    } catch (error) {
      this.logger.error('Error loading routing rules:', error);
      return [];
    }
  }

  /**
   * Zapisuje reguły routingu dla organizacji
   */
  async saveRoutingRules(organizationId: string, rules: RoutingRule[]): Promise<void> {
    try {
      // TODO: Implement saving to database
      this.routingRules.set(organizationId, rules);
      this.logger.info(`Saved ${rules.length} routing rules for organization ${organizationId}`);
    } catch (error) {
      this.logger.error('Error saving routing rules:', error);
      throw new Error('Failed to save routing rules');
    }
  }

  /**
   * Pobiera statystyki routingu
   */
  async getRoutingStats(organizationId: string, dateFrom?: Date, dateTo?: Date): Promise<RoutingStats> {
    try {
      // TODO: Implement real statistics from database
      return {
        totalRouted: 0,
        routedByStream: {},
        routedByConfidence: { high: 0, medium: 0, low: 0 },
        fallbackUsed: 0,
        averageConfidence: 0,
        successfulRoutes: 0,
        failedRoutes: 0
      };
    } catch (error) {
      this.logger.error('Error getting routing stats:', error);
      throw new Error('Failed to get routing stats');
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Stosuje niestandardowe reguły routingu
   */
  private async applyCustomRoutingRules(
    resource: any,
    resourceType: 'TASK' | 'EMAIL' | 'CONTACT' | 'DEAL',
    options: RoutingOptions
  ): Promise<RoutingResult | null> {
    const rules = this.routingRules.get(options.organizationId) || [];

    // Sortuj według priorytetu
    const sortedRules = rules
      .filter(r => r.active && (r.resourceType === resourceType || r.resourceType === 'ALL'))
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.matchesRuleConditions(resource, resourceType, rule)) {
        const stream = await this.prisma.stream.findUnique({
          where: { id: rule.targetStreamId },
          select: { id: true, name: true }
        });

        if (stream) {
          return {
            streamId: rule.targetStreamId,
            streamName: stream.name,
            confidence: 0.95, // High confidence for custom rules
            reasoning: [`Matched custom rule: ${rule.name}`],
            fallbackUsed: false,
            suggestedContext: rule.targetContext,
            suggestedEnergyLevel: rule.targetEnergyLevel,
            additionalActions: rule.actions
          };
        }
      }
    }

    return null;
  }

  /**
   * Sprawdza czy zasób pasuje do warunków reguły
   */
  private matchesRuleConditions(
    resource: any,
    resourceType: string,
    rule: RoutingRule
  ): boolean {
    const conditions = rule.conditions;

    // Check keywords
    if (conditions.keywords && conditions.keywords.length > 0) {
      const content = this.getResourceContent(resource, resourceType).toLowerCase();
      const hasKeyword = conditions.keywords.some(keyword =>
        content.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    // Check sender domain for emails
    if (conditions.senderDomain && resourceType === 'EMAIL') {
      const domain = this.extractDomain(resource.fromAddress);
      if (!conditions.senderDomain.includes(domain)) return false;
    }

    // Check urgency
    if (conditions.urgency) {
      const urgency = this.detectUrgency(this.getResourceContent(resource, resourceType));
      const urgencyLevel = urgency > 0.7 ? 'HIGH' : urgency > 0.4 ? 'MEDIUM' : 'LOW';
      if (urgencyLevel !== conditions.urgency) return false;
    }

    // Add more condition checks as needed...

    return true;
  }

  /**
   * Pobiera treść zasobu do analizy
   */
  private getResourceContent(resource: any, resourceType: string): string {
    switch (resourceType) {
      case 'TASK':
        return `${resource.title} ${resource.description || ''}`;
      case 'EMAIL':
        return `${resource.subject} ${resource.content}`;
      case 'CONTACT':
        return `${resource.firstName} ${resource.lastName} ${resource.company || ''}`;
      case 'DEAL':
        return `${resource.title} ${resource.stage || ''}`;
      default:
        return '';
    }
  }

  /**
   * Wykrywa kontekst GTD na podstawie treści
   */
  private detectContext(content: string): StreamContext {
    if (content.includes('computer') || content.includes('online') || content.includes('software')) {
      return StreamContext.COMPUTER;
    }
    if (content.includes('call') || content.includes('phone') || content.includes('meeting')) {
      return StreamContext.PHONE;
    }
    if (content.includes('office') || content.includes('desk')) {
      return StreamContext.OFFICE;
    }
    if (content.includes('home') || content.includes('remote')) {
      return StreamContext.HOME;
    }
    if (content.includes('shop') || content.includes('buy') || content.includes('errand')) {
      return StreamContext.ERRANDS;
    }
    if (content.includes('read') || content.includes('review') || content.includes('document')) {
      return StreamContext.READING;
    }
    if (content.includes('wait') || content.includes('response')) {
      return StreamContext.WAITING;
    }
    return StreamContext.COMPUTER; // Default
  }

  /**
   * Wykrywa poziom energii na podstawie treści i czasu
   */
  private detectEnergyLevel(content: string, estimatedHours?: number): EnergyLevel {
    if (content.includes('creative') || content.includes('design') || content.includes('brainstorm')) {
      return EnergyLevel.CREATIVE;
    }
    if (content.includes('admin') || content.includes('filing') || content.includes('routine')) {
      return EnergyLevel.ADMINISTRATIVE;
    }
    if (content.includes('complex') || content.includes('difficult') || content.includes('challenging')) {
      return EnergyLevel.HIGH;
    }
    if (content.includes('simple') || content.includes('quick') || content.includes('easy')) {
      return EnergyLevel.LOW;
    }

    // Na podstawie czasu
    if (estimatedHours) {
      if (estimatedHours > 4) return EnergyLevel.HIGH;
      if (estimatedHours < 0.5) return EnergyLevel.LOW;
    }

    return EnergyLevel.MEDIUM; // Default
  }

  /**
   * Wykrywa czy zadanie jest szybkie (<2 min)
   */
  private isQuickTask(content: string, estimatedHours?: number): boolean {
    if (estimatedHours && estimatedHours <= 0.033) return true; // 2 minutes

    const quickKeywords = ['quick', 'fast', 'brief', 'short', 'call', 'email', 'message'];
    return quickKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Wykrywa pilność na podstawie treści
   */
  private detectUrgency(content: string): number {
    const urgentKeywords = ['urgent', 'asap', 'immediate', 'critical', 'emergency', 'now'];
    const highKeywords = ['important', 'priority', 'deadline', 'soon'];

    let score = 0;
    urgentKeywords.forEach(keyword => {
      if (content.includes(keyword)) score += 0.3;
    });
    highKeywords.forEach(keyword => {
      if (content.includes(keyword)) score += 0.2;
    });

    return Math.min(score, 1);
  }

  /**
   * Wykrywa słowa kluczowe projektów
   */
  private detectProjectKeywords(content: string): boolean {
    const projectKeywords = ['project', 'milestone', 'phase', 'implementation', 'development', 'initiative'];
    return projectKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Wykrywa czy email wymaga akcji
   */
  private detectActionRequired(content: string): boolean {
    const actionKeywords = ['please', 'need', 'required', 'action', 'request', 'can you', 'could you'];
    return actionKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Wykrywa czy email jest informacyjny
   */
  private detectInformational(content: string): boolean {
    const infoKeywords = ['fyi', 'information', 'update', 'newsletter', 'notification', 'announcement'];
    return infoKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Wykrywa czy email dotyczy oczekiwania
   */
  private detectWaitingFor(content: string): boolean {
    const waitingKeywords = ['waiting for', 'pending', 'follow up', 'response', 'feedback'];
    return waitingKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Wykrywa delegację
   */
  private detectDelegation(content: string): boolean {
    const delegationKeywords = ['assign', 'delegate', 'team', 'responsibility', 'handle'];
    return delegationKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Znajduje stream według roli GTD
   */
  private async findStreamByRole(organizationId: string, streamRole: StreamRole): Promise<Stream | null> {
    return await this.prisma.stream.findFirst({
      where: {
        organizationId,
        streamRole,
        status: 'ACTIVE'
      }
    });
  }

  /**
   * Pobiera domyślny stream dla typu zasobu
   */
  private async getDefaultStream(organizationId: string, resourceType: string): Promise<string> {
    const cacheKey = `${organizationId}_${resourceType}`;

    if (this.defaultStreamCache.has(cacheKey)) {
      return this.defaultStreamCache.get(cacheKey)!;
    }

    // Znajdź pierwszy aktywny stream
    const stream = await this.prisma.stream.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    const streamId = stream?.id || 'default';
    this.defaultStreamCache.set(cacheKey, streamId);

    return streamId;
  }

  /**
   * Generuje dodatkowe akcje dla zadania
   */
  private generateTaskActions(
    task: any,
    context?: StreamContext,
    energyLevel?: EnergyLevel
  ): Array<{ type: string; config: Record<string, any> }> {
    const actions: Array<{ type: string; config: Record<string, any> }> = [];

    if (context) {
      actions.push({
        type: 'ASSIGN_CONTEXT',
        config: { context: context }
      });
    }

    if (task.priority === 'HIGH') {
      actions.push({
        type: 'SET_PRIORITY',
        config: { priority: 'HIGH' }
      });
    }

    return actions;
  }

  /**
   * Generuje dodatkowe akcje dla emaila
   */
  private generateEmailActions(
    email: any,
    actionRequired: boolean
  ): Array<{ type: string; config: Record<string, any> }> {
    const actions: Array<{ type: string; config: Record<string, any> }> = [];

    if (actionRequired) {
      actions.push({
        type: 'CREATE_TASK',
        config: {
          title: `Reply to: ${email.subject}`,
          description: `Respond to email from ${email.fromName || email.fromAddress}`,
          priority: 'MEDIUM'
        }
      });
    }

    return actions;
  }

  /**
   * Generuje dodatkowe akcje dla kontaktu
   */
  private generateContactActions(
    contact: any,
    isHotLead: boolean,
    isVIP: boolean
  ): Array<{ type: string; config: Record<string, any> }> {
    const actions: Array<{ type: string; config: Record<string, any> }> = [];

    if (isHotLead || isVIP) {
      actions.push({
        type: 'CREATE_TASK',
        config: {
          title: `Follow up with ${contact.firstName} ${contact.lastName}`,
          priority: isVIP ? 'HIGH' : 'MEDIUM'
        }
      });
    }

    return actions;
  }

  /**
   * Generuje dodatkowe akcje dla deala
   */
  private generateDealActions(
    deal: any,
    isHighValue: boolean,
    isClosingStage: boolean
  ): Array<{ type: string; config: Record<string, any> }> {
    const actions: Array<{ type: string; config: Record<string, any> }> = [];

    if (isClosingStage) {
      actions.push({
        type: 'CREATE_TASK',
        config: {
          title: `Close deal: ${deal.title}`,
          priority: isHighValue ? 'HIGH' : 'MEDIUM'
        }
      });
    }

    return actions;
  }

  /**
   * Wyciąga domenę z adresu email
   */
  private extractDomain(email: string): string {
    return email.split('@')[1] || '';
  }
}

export default ResourceRouter;