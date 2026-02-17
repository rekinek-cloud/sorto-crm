import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import { eventBusService } from './event-bus.service';
import { PublishEventInput } from './event.types';
import logger from '../../config/logger';

export class EventBusController {
  /**
   * POST /api/v1/events
   * Publish a new event to the platform
   */
  publish = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type, source, data, metadata } = req.body;

      // Validate required fields
      if (!type || typeof type !== 'string') {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Event type is required and must be a string',
        });
      }

      if (!source || typeof source !== 'string') {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Event source is required and must be a string',
        });
      }

      // Build the event input
      const eventInput: PublishEventInput = {
        type,
        source,
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        data: data || {},
        metadata: metadata || {},
      };

      // Publish the event
      const eventId = await eventBusService.publish(eventInput);

      logger.info(`Event published: ${type} from ${source} by user ${req.user!.id}`);

      return res.status(201).json({
        message: 'Event published successfully',
        data: {
          id: eventId,
          type,
          source,
          organizationId: req.user!.organizationId,
          userId: req.user!.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('Failed to publish event:', error);
      return res.status(500).json({
        error: 'Failed to publish event',
        message: error.message,
      });
    }
  };

  /**
   * GET /api/v1/events
   * List events for the organization with optional filters
   */
  list = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type, eventType, source, organizationId, userId, from, to, page, limit } = req.query;

      // Support both 'type' and 'eventType' query params for backward compatibility
      const eventTypeFilter = (type as string) || (eventType as string);

      const result = await eventBusService.getEvents({
        type: eventTypeFilter,
        source: source as string,
        organizationId: (organizationId as string) || req.user!.organizationId,
        userId: userId as string,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });

      return res.json({
        message: 'Events retrieved',
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to list events:', error);
      return res.status(500).json({
        error: 'Failed to retrieve events',
        message: error.message,
      });
    }
  };

  /**
   * GET /api/v1/events/:id
   * Get a single event by ID
   */
  getById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const event = await eventBusService.getEventById(req.params.id);

      if (!event) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Event not found',
        });
      }

      // Check if user has access to this event (same organization)
      if (event.organizationId && event.organizationId !== req.user!.organizationId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this event',
        });
      }

      return res.json({
        message: 'Event retrieved',
        data: event,
      });
    } catch (error: any) {
      logger.error('Failed to get event:', error);
      return res.status(500).json({
        error: 'Failed to retrieve event',
        message: error.message,
      });
    }
  };

  /**
   * GET /api/v1/events/status
   * Get the status of the event bus (Redis connection)
   */
  status = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const isConnected = eventBusService.isRedisConnected();

      return res.json({
        message: 'Event bus status',
        data: {
          redis: {
            connected: isConnected,
            status: isConnected ? 'healthy' : 'disconnected',
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('Failed to get event bus status:', error);
      return res.status(500).json({
        error: 'Failed to get status',
        message: error.message,
      });
    }
  };
}
