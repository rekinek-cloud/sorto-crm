/**
 * StreamService - Enhanced service dla obsługi Streams z funkcjonalnością GTD
 * Zachowuje backward compatibility z istniejącymi operacjami CRUD
 */

import { PrismaClient, Stream, StreamStatus, StreamRole, StreamType } from '@prisma/client';
import { GTDConfigManager } from './GTDConfigManager';
import {
  CreateStreamOptions as CreateGTDStreamOptions,
  UpdateStreamConfigOptions as UpdateGTDConfigOptions,
  ValidatedStreamConfig as ValidatedGTDConfig,
  StreamAnalysisResult as GTDAnalysisResult,
  StreamContext as GTDContext,
  EnergyLevel
} from '../types/streams';

/**
 * Niestandardowe błędy StreamService
 */
export class StreamServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'StreamServiceError';
  }
}

/**
 * Opcje filtrowania streamów
 */
export interface StreamFilterOptions {
  search?: string;
  status?: StreamStatus;
  gtdRole?: StreamRole;
  streamType?: StreamType;
  hasGTDConfig?: boolean;
  parentStreamId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'streamRole';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Opcje tworzenia standardowego streama
 */
export interface CreateStreamOptions {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: StreamStatus;
  settings?: Record<string, any>;
  parentStreamId?: string;
}

/**
 * Wynik wyszukiwania streamów
 */
export interface StreamSearchResult {
  streams: Stream[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Enhanced Stream Service z funkcjonalnością GTD
 */
export class StreamService {
  private prisma: PrismaClient;
  private gtdConfigManager: GTDConfigManager;
  private logger: any;

  constructor(prisma: PrismaClient, logger?: any) {
    this.prisma = prisma;
    this.logger = logger || console;
    this.streamConfigManager = new GTDConfigManager(prisma, logger);
  }

  // ========================================
  // STANDARD CRUD OPERATIONS (Backward Compatible)
  // ========================================

  /**
   * Tworzy nowy stream (standardowy, bez GTD)
   */
  async createStream(
    organizationId: string,
    createdById: string,
    options: CreateStreamOptions
  ): Promise<Stream> {
    try {
      const {
        name,
        description,
        color = '#3B82F6',
        icon,
        status = StreamStatus.ACTIVE,
        settings = {},
        parentStreamId
      } = options;

      const stream = await this.prisma.stream.create({
        data: {
          name,
          description,
          color,
          icon,
          status,
          settings,
          organizationId,
          createdById
        }
      });

      // Jeśli ma rodzica, utwórz relację
      if (parentStreamId) {
        await this.createParentChildRelation(parentStreamId, stream.id, organizationId, createdById);
      }

      this.logger.info(`Standard stream created: ${stream.id}`);
      return stream;

    } catch (error) {
      this.logger.error('Error creating stream:', error);
      throw new StreamServiceError('Failed to create stream', 'CREATE_STREAM_ERROR');
    }
  }

  /**
   * Pobiera stream po ID
   */
  async getStreamById(streamId: string, includeRelations = true): Promise<Stream | null> {
    try {
      return await this.prisma.stream.findUnique({
        where: { id: streamId },
        include: includeRelations ? {
          parentRelations: {
            include: { parent: true }
          },
          childRelations: {
            include: { child: true }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        } : undefined
      });
    } catch (error) {
      this.logger.error('Error getting stream by ID:', error);
      throw new StreamServiceError('Failed to get stream', 'GET_STREAM_ERROR');
    }
  }

  /**
   * Aktualizuje stream
   */
  async updateStream(streamId: string, updates: Partial<CreateStreamOptions>): Promise<Stream> {
    try {
      return await this.prisma.stream.update({
        where: { id: streamId },
        data: updates
      });
    } catch (error) {
      this.logger.error('Error updating stream:', error);
      throw new StreamServiceError('Failed to update stream', 'UPDATE_STREAM_ERROR');
    }
  }

  /**
   * Usuwa stream
   */
  async deleteStream(streamId: string): Promise<void> {
    try {
      // Sprawdź czy ma dzieci
      const children = await this.prisma.streamRelation.findMany({
        where: { parentId: streamId }
      });

      if (children.length > 0) {
        throw new StreamServiceError('Cannot delete stream with children', 'HAS_CHILDREN');
      }

      // Usuń relacje rodzica
      await this.prisma.streamRelation.deleteMany({
        where: { childId: streamId }
      });

      // Usuń stream
      await this.prisma.stream.delete({
        where: { id: streamId }
      });

      this.logger.info(`Stream deleted: ${streamId}`);
    } catch (error) {
      this.logger.error('Error deleting stream:', error);
      if (error instanceof StreamServiceError) {
        throw error;
      }
      throw new StreamServiceError('Failed to delete stream', 'DELETE_STREAM_ERROR');
    }
  }

  /**
   * Wyszukuje streamy z filtrowaniem
   */
  async searchStreams(
    organizationId: string,
    filters: StreamFilterOptions = {}
  ): Promise<StreamSearchResult> {
    try {
      const {
        search,
        status,
        gtdRole,
        streamType,
        hasGTDConfig,
        parentStreamId,
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortOrder = 'asc'
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        organizationId
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (gtdRole) {
        where.streamRole = gtdRole;
      }

      if (streamType) {
        where.streamType = streamType;
      }

      if (hasGTDConfig !== undefined) {
        if (hasGTDConfig) {
          where.streamRole = { not: null };
        } else {
          where.streamRole = null;
        }
      }

      if (parentStreamId) {
        where.parentRelations = {
          some: { parentId: parentStreamId }
        };
      }

      // Count total
      const total = await this.prisma.stream.count({ where });

      // Get streams
      const streams = await this.prisma.stream.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          parentRelations: {
            include: { parent: { select: { id: true, name: true } } }
          },
          childRelations: {
            include: { child: { select: { id: true, name: true } } }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      return {
        streams,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      this.logger.error('Error searching streams:', error);
      throw new StreamServiceError('Failed to search streams', 'SEARCH_STREAMS_ERROR');
    }
  }

  // ========================================
  // GTD ENHANCED OPERATIONS
  // ========================================

  /**
   * Tworzy nowy stream z funkcjonalnością GTD
   */
  async createGTDStream(
    organizationId: string,
    createdById: string,
    options: CreateGTDStreamOptions
  ): Promise<{ stream: Stream; config: ValidatedGTDConfig }> {
    return await this.streamConfigManager.createGTDStream(organizationId, createdById, options);
  }

  /**
   * Aktualizuje konfigurację GTD streama
   */
  async updateGTDConfig(
    streamId: string,
    config: Partial<ValidatedGTDConfig>,
    options: UpdateGTDConfigOptions = {}
  ): Promise<ValidatedGTDConfig> {
    return await this.streamConfigManager.setGTDConfig(streamId, config as any, options);
  }

  /**
   * Pobiera konfigurację GTD streama
   */
  async getGTDConfig(streamId: string): Promise<ValidatedGTDConfig | null> {
    return await this.streamConfigManager.getGTDConfig(streamId);
  }

  /**
   * Pobiera streamy według roli GTD
   */
  async getStreamsByStreamRole(organizationId: string, gtdRole: StreamRole): Promise<Stream[]> {
    return await this.streamConfigManager.getStreamsByStreamRole(organizationId, gtdRole);
  }

  /**
   * Przypisuje rolę GTD do streama
   */
  async assignStreamRole(streamId: string, gtdRole: StreamRole): Promise<Stream> {
    try {
      await this.streamConfigManager.assignStreamRole(streamId, gtdRole);

      return await this.prisma.stream.update({
        where: { id: streamId },
        data: { streamRole: gtdRole }
      });
    } catch (error) {
      this.logger.error('Error assigning GTD role:', error);
      throw new StreamServiceError('Failed to assign GTD role', 'ASSIGN_GTD_ROLE_ERROR');
    }
  }

  /**
   * Waliduje hierarchię GTD
   */
  async validateGTDHierarchy(streamId: string): Promise<{ valid: boolean; errors: string[] }> {
    return await this.streamConfigManager.validateGTDHierarchy(streamId);
  }

  /**
   * Migruje istniejący stream na GTD-aware
   */
  async migrateToGTDStream(
    streamId: string,
    gtdRole: StreamRole,
    streamType: StreamType = StreamType.CUSTOM
  ): Promise<{ stream: Stream; config: ValidatedGTDConfig }> {
    try {
      const config = await this.streamConfigManager.migrateToGTDStream(streamId, gtdRole, streamType);
      const stream = await this.getStreamById(streamId);

      if (!stream) {
        throw new StreamServiceError('Stream not found after migration', 'MIGRATION_ERROR');
      }

      return { stream, config };
    } catch (error) {
      this.logger.error('Error migrating stream to GTD:', error);
      throw new StreamServiceError('Failed to migrate stream to GTD', 'MIGRATE_GTD_ERROR');
    }
  }

  // ========================================
  // AI-ENHANCED GTD OPERATIONS
  // ========================================

  /**
   * Analizuje content i sugeruje rolę GTD oraz konfigurację
   */
  async analyzeForGTD(content: {
    name: string;
    description?: string;
    existingTasks?: number;
    relatedContacts?: number;
    messageVolume?: number;
  }): Promise<GTDAnalysisResult> {
    try {
      const { name, description, existingTasks = 0, relatedContacts = 0, messageVolume = 0 } = content;

      // Prosta analiza na podstawie keywords i metryki
      let recommendedRole: StreamRole = StreamRole.CUSTOM;
      let recommendedContext: GTDContext = GTDContext.COMPUTER;
      let recommendedEnergyLevel: EnergyLevel = EnergyLevel.MEDIUM;
      let confidence = 0.5;
      const reasoning: string[] = [];

      // Analiza nazwy i opisu
      const text = `${name} ${description || ''}`.toLowerCase();

      if (text.includes('inbox') || text.includes('input') || text.includes('capture')) {
        recommendedRole = StreamRole.INBOX;
        recommendedContext = GTDContext.ANYWHERE;
        confidence = 0.9;
        reasoning.push('Name suggests inbox functionality');
      } else if (text.includes('next') || text.includes('action') || text.includes('todo')) {
        recommendedRole = StreamRole.NEXT_ACTIONS;
        confidence = 0.85;
        reasoning.push('Name suggests next actions list');
      } else if (text.includes('wait') || text.includes('pending')) {
        recommendedRole = StreamRole.WAITING_FOR;
        recommendedContext = GTDContext.WAITING;
        confidence = 0.9;
        reasoning.push('Name suggests waiting for items');
      } else if (text.includes('someday') || text.includes('maybe') || text.includes('future')) {
        recommendedRole = StreamRole.SOMEDAY_MAYBE;
        recommendedContext = GTDContext.ANYWHERE;
        recommendedEnergyLevel = EnergyLevel.CREATIVE;
        confidence = 0.8;
        reasoning.push('Name suggests someday/maybe items');
      } else if (text.includes('project') || existingTasks > 5) {
        recommendedRole = StreamRole.PROJECTS;
        confidence = Math.min(0.9, 0.6 + (existingTasks * 0.05));
        reasoning.push(`Detected project characteristics (${existingTasks} tasks)`);
      } else if (text.includes('context') || text.includes('@')) {
        recommendedRole = StreamRole.CONTEXTS;
        confidence = 0.8;
        reasoning.push('Name suggests context organization');
      } else if (text.includes('area') || text.includes('responsibility')) {
        recommendedRole = StreamRole.AREAS;
        confidence = 0.8;
        reasoning.push('Name suggests area of responsibility');
      } else if (text.includes('reference') || text.includes('doc') || text.includes('knowledge')) {
        recommendedRole = StreamRole.REFERENCE;
        recommendedContext = GTDContext.READING;
        recommendedEnergyLevel = EnergyLevel.LOW;
        confidence = 0.85;
        reasoning.push('Name suggests reference material');
      }

      // Analiza kontekstu na podstawie keywords
      if (text.includes('computer') || text.includes('online') || text.includes('digital')) {
        recommendedContext = GTDContext.COMPUTER;
        reasoning.push('Digital/computer context detected');
      } else if (text.includes('phone') || text.includes('call')) {
        recommendedContext = GTDContext.PHONE;
        reasoning.push('Phone context detected');
      } else if (text.includes('office') || text.includes('meeting')) {
        recommendedContext = GTDContext.OFFICE;
        reasoning.push('Office context detected');
      } else if (text.includes('errands') || text.includes('shopping')) {
        recommendedContext = GTDContext.ERRANDS;
        reasoning.push('Errands context detected');
      }

      // Analiza poziomu energii
      if (text.includes('creative') || text.includes('design') || text.includes('innovation')) {
        recommendedEnergyLevel = EnergyLevel.CREATIVE;
        reasoning.push('Creative work detected');
      } else if (text.includes('admin') || text.includes('filing') || text.includes('routine')) {
        recommendedEnergyLevel = EnergyLevel.ADMINISTRATIVE;
        reasoning.push('Administrative work detected');
      } else if (text.includes('complex') || text.includes('difficult') || text.includes('strategic')) {
        recommendedEnergyLevel = EnergyLevel.HIGH;
        reasoning.push('High energy work detected');
      } else if (messageVolume > 50 || relatedContacts > 20) {
        recommendedEnergyLevel = EnergyLevel.HIGH;
        confidence = Math.min(confidence + 0.1, 0.95);
        reasoning.push('High volume suggests high energy requirement');
      }

      return {
        recommendedRole,
        recommendedContext,
        recommendedEnergyLevel,
        confidence,
        reasoning,
        suggestedActions: []
      };

    } catch (error) {
      this.logger.error('Error analyzing for GTD:', error);
      throw new StreamServiceError('Failed to analyze for GTD', 'ANALYZE_GTD_ERROR');
    }
  }

  // ========================================
  // FLOW / FROZEN OPERATIONS
  // ========================================

  /**
   * Freezes a stream and all its children
   */
  async freezeStream(streamId: string): Promise<void> {
    try {
      // 1. Freeze the stream itself
      await this.prisma.stream.update({
        where: { id: streamId },
        data: { status: StreamStatus.FROZEN }
      });

      // 2. Find all children
      const children = await this.prisma.streamRelation.findMany({
        where: { parentId: streamId },
        select: { childId: true }
      });

      // 3. Recursively freeze children
      for (const child of children) {
        await this.freezeStream(child.childId);
      }

      this.logger.info(`Stream frozen: ${streamId}`);
    } catch (error) {
      this.logger.error('Error freezing stream:', error);
      throw new StreamServiceError('Failed to freeze stream', 'FREEZE_STREAM_ERROR');
    }
  }

  /**
   * Unfreezes a stream and ensures parents are active
   */
  async unfreezeStream(streamId: string): Promise<void> {
    try {
      // 1. Unfreeze the stream itself
      await this.prisma.stream.update({
        where: { id: streamId },
        data: { status: StreamStatus.ACTIVE }
      });

      // 2. Find parents to ensure they are active (path to root)
      const parents = await this.prisma.streamRelation.findMany({
        where: { childId: streamId },
        select: { parentId: true }
      });

      // 3. Recursively unfreeze parents
      for (const parent of parents) {
        // Check if parent is frozen before updating to avoid unnecessary writes
        const parentStream = await this.prisma.stream.findUnique({
          where: { id: parent.parentId },
          select: { status: true }
        });

        if (parentStream?.status === StreamStatus.FROZEN) {
          await this.unfreezeStream(parent.parentId);
        }
      }

      this.logger.info(`Stream unfrozen: ${streamId}`);
    } catch (error) {
      this.logger.error('Error unfreezing stream:', error);
      throw new StreamServiceError('Failed to unfreeze stream', 'UNFREEZE_STREAM_ERROR');
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Tworzy relację rodzic-dziecko między streamami
   */
  private async createParentChildRelation(
    parentId: string,
    childId: string,
    organizationId: string,
    createdById: string
  ): Promise<void> {
    await this.prisma.streamRelation.create({
      data: {
        parentId,
        childId,
        relationType: 'OWNS',
        organizationId,
        createdById
      }
    });
  }

  /**
   * Pobiera statystyki streamów dla organizacji
   */
  async getStreamStats(organizationId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byStreamRole: Record<string, number>;
    byStreamType: Record<string, number>;
    withGTDConfig: number;
    withoutGTDConfig: number;
  }> {
    try {
      const streams = await this.prisma.stream.findMany({
        where: { organizationId },
        select: {
          status: true,
          streamRole: true,
          streamType: true,
          streamConfig: true
        }
      });

      const stats = {
        total: streams.length,
        byStatus: {} as Record<string, number>,
        byStreamRole: {} as Record<string, number>,
        byStreamType: {} as Record<string, number>,
        withGTDConfig: 0,
        withoutGTDConfig: 0
      };

      streams.forEach(stream => {
        // Count by status
        stats.byStatus[stream.status] = (stats.byStatus[stream.status] || 0) + 1;

        // Count by GTD role
        const role = stream.streamRole || 'NONE';
        stats.byStreamRole[role] = (stats.byStreamRole[role] || 0) + 1;

        // Count by stream type
        stats.byStreamType[stream.streamType] = (stats.byStreamType[stream.streamType] || 0) + 1;

        // Count GTD config
        if (stream.streamRole && stream.streamConfig) {
          stats.withGTDConfig++;
        } else {
          stats.withoutGTDConfig++;
        }
      });

      return stats;

    } catch (error) {
      this.logger.error('Error getting stream stats:', error);
      throw new StreamServiceError('Failed to get stream stats', 'GET_STATS_ERROR');
    }
  }

  /**
   * Eksportuje wszystkie streamy do JSON
   */
  async exportStreams(organizationId: string): Promise<string> {
    try {
      const streams = await this.prisma.stream.findMany({
        where: { organizationId },
        include: {
          parentRelations: {
            include: { parent: { select: { id: true, name: true } } }
          },
          childRelations: {
            include: { child: { select: { id: true, name: true } } }
          }
        }
      });

      return JSON.stringify(streams, null, 2);
    } catch (error) {
      this.logger.error('Error exporting streams:', error);
      throw new StreamServiceError('Failed to export streams', 'EXPORT_ERROR');
    }
  }
}

export default StreamService;