import { createClient, RedisClientType } from 'redis';
import { prisma } from '../../config/database';
import logger from '../../config/logger';
import {
  PlatformEvent,
  PublishEventInput,
  EventQueryFilters,
  EventQueryResult,
  EventHandler,
} from './event.types';

/**
 * Legacy interface for backward compatibility
 * @deprecated Use PlatformEvent from event.types.ts instead
 */
export interface LegacyPlatformEvent {
  eventType: string;
  source: string;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
  userId?: string;
  organizationId?: string;
  moduleId?: string;
}

// Re-export types for convenience
export type { PlatformEvent, PublishEventInput, EventQueryFilters, EventQueryResult, EventHandler };

class EventBusService {
  private publisher: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private patternHandlers: Map<string, EventHandler[]> = new Map();
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.publisher = createClient({ url: redisUrl }) as unknown as RedisClientType;
      this.subscriber = createClient({ url: redisUrl }) as unknown as RedisClientType;

      this.publisher.on('error', (err: any) => {
        logger.error('EventBus publisher Redis error:', err.message);
      });
      this.subscriber.on('error', (err: any) => {
        logger.error('EventBus subscriber Redis error:', err.message);
      });

      await this.publisher.connect();
      await this.subscriber.connect();

      this.isConnected = true;
      logger.info('EventBus: Redis pub/sub connected');
    } catch (error: any) {
      logger.error('EventBus: Failed to connect Redis pub/sub:', error.message);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.publisher) await this.publisher.disconnect();
      if (this.subscriber) await this.subscriber.disconnect();
      this.isConnected = false;
      logger.info('EventBus: Redis pub/sub disconnected');
    } catch (error: any) {
      logger.error('EventBus: Error disconnecting:', error.message);
    }
  }

  /**
   * Publish an event: store in DB + broadcast via Redis
   * Supports both new spec format (type) and legacy format (eventType)
   */
  async publish(event: PublishEventInput | LegacyPlatformEvent): Promise<string> {
    // Normalize event format (support both 'type' and 'eventType')
    const eventType = 'type' in event ? event.type : event.eventType;
    const data = 'data' in event ? event.data : event.payload || {};

    // 1. Store in DB
    const dbEvent = await prisma.platformEvent.create({
      data: {
        eventType: eventType,
        source: event.source,
        payload: data,
        metadata: event.metadata || {},
        userId: event.userId,
        organizationId: event.organizationId,
        moduleId: 'moduleId' in event ? event.moduleId : undefined,
      },
    });

    // 2. Build full event object matching spec
    const fullEvent: PlatformEvent = {
      id: dbEvent.id,
      type: eventType,
      source: event.source,
      timestamp: dbEvent.createdAt.toISOString(),
      organizationId: event.organizationId || '',
      userId: event.userId,
      data: data,
      metadata: event.metadata,
    };

    // 3. Publish via Redis (if connected)
    if (this.isConnected && this.publisher) {
      try {
        // Publish to specific channel for exact matches
        const channel = `platform:events:${eventType}`;
        await this.publisher.publish(channel, JSON.stringify(fullEvent));

        // Also publish to org-specific channel for filtering
        if (event.organizationId) {
          const orgChannel = `platform:events:org:${event.organizationId}:${eventType}`;
          await this.publisher.publish(orgChannel, JSON.stringify(fullEvent));
        }
      } catch (error: any) {
        logger.error(`EventBus: Redis publish failed for ${eventType}:`, error.message);
      }
    }

    logger.debug(`EventBus: Published ${eventType} from ${event.source}`);
    return dbEvent.id;
  }

  /**
   * Subscribe to events of a specific type
   * @param eventType - Exact event type (e.g., "deal.won")
   * @param handler - Function to call when event is received
   */
  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    if (this.isConnected && this.subscriber) {
      const channel = `platform:events:${eventType}`;
      try {
        await this.subscriber.subscribe(channel, (message: string) => {
          try {
            const event = JSON.parse(message) as PlatformEvent;
            const handlers = this.handlers.get(eventType) || [];
            handlers.forEach((h) => {
              Promise.resolve(h(event)).catch((err) => {
                logger.error(`EventBus: Handler error for ${eventType}:`, err);
              });
            });
          } catch (err: any) {
            logger.error(`EventBus: Error parsing message for ${eventType}:`, err.message);
          }
        });
        logger.debug(`EventBus: Subscribed to ${channel}`);
      } catch (error: any) {
        logger.error(`EventBus: Subscribe failed for ${eventType}:`, error.message);
      }
    }
  }

  /**
   * Subscribe to events matching a pattern (e.g., "deal.*")
   * Uses Redis PSUBSCRIBE for wildcard matching
   * @param pattern - Event type pattern with wildcards (e.g., "deal.*", "*.created")
   * @param handler - Function to call when matching event is received
   */
  async subscribePattern(pattern: string, handler: EventHandler): Promise<void> {
    if (!this.patternHandlers.has(pattern)) {
      this.patternHandlers.set(pattern, []);
    }
    this.patternHandlers.get(pattern)!.push(handler);

    if (this.isConnected && this.subscriber) {
      const channel = `platform:events:${pattern}`;
      try {
        await this.subscriber.pSubscribe(channel, (message: string, channelName: string) => {
          try {
            const event = JSON.parse(message) as PlatformEvent;
            const handlers = this.patternHandlers.get(pattern) || [];
            handlers.forEach((h) => {
              Promise.resolve(h(event)).catch((err) => {
                logger.error(`EventBus: Handler error for pattern ${pattern}:`, err);
              });
            });
          } catch (err: any) {
            logger.error(`EventBus: Error parsing message for pattern ${pattern}:`, err.message);
          }
        });
        logger.debug(`EventBus: Subscribed to pattern ${channel}`);
      } catch (error: any) {
        logger.error(`EventBus: Pattern subscribe failed for ${pattern}:`, error.message);
      }
    }
  }

  /**
   * Query event history from DB
   * Supports both new format (type) and legacy format (eventType) for filtering
   */
  async getEvents(filters: EventQueryFilters): Promise<EventQueryResult> {
    const where: any = {};

    // Support both 'type' and 'eventType' filter names
    if (filters.type) where.eventType = filters.type;
    if (filters.source) where.source = filters.source;
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.userId) where.userId = filters.userId;

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);

    const [dbEvents, total] = await Promise.all([
      prisma.platformEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.platformEvent.count({ where }),
    ]);

    // Transform DB events to spec-compliant format
    const events: PlatformEvent[] = dbEvents.map((e) => ({
      id: e.id,
      type: e.eventType,
      source: e.source,
      timestamp: e.createdAt.toISOString(),
      organizationId: e.organizationId || '',
      userId: e.userId || undefined,
      data: e.payload as Record<string, any>,
      metadata: e.metadata as Record<string, any> | undefined,
    }));

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single event by ID
   */
  async getEventById(id: string): Promise<PlatformEvent | null> {
    const dbEvent = await prisma.platformEvent.findUnique({ where: { id } });

    if (!dbEvent) return null;

    return {
      id: dbEvent.id,
      type: dbEvent.eventType,
      source: dbEvent.source,
      timestamp: dbEvent.createdAt.toISOString(),
      organizationId: dbEvent.organizationId || '',
      userId: dbEvent.userId || undefined,
      data: dbEvent.payload as Record<string, any>,
      metadata: dbEvent.metadata as Record<string, any> | undefined,
    };
  }

  /**
   * Check if the event bus is connected to Redis
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }
}

export const eventBusService = new EventBusService();
