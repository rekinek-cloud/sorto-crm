/**
 * GTDConfigManager - Service do zarządzania konfiguracją GTD dla streams
 * Obsługuje CRUD operacje, walidację, dziedziczenie i default settings
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  StreamConfig,
  StreamConfigSchema,
  DEFAULT_STREAM_CONFIGS,
  DEFAULT_INBOX_BEHAVIOR,
  DEFAULT_STREAM_CONTEXTS,
  DEFAULT_ENERGY_LEVELS,
  CreateStreamOptions,
  UpdateStreamConfigOptions,
  ValidatedStreamConfig,
  ReviewFrequency as GTDReviewFrequency
} from '../types/streams';
import { StreamRole, StreamType, ReviewFrequency } from '@prisma/client';

/**
 * Niestandardowe błędy GTDConfigManager
 */
export class GTDConfigError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GTDConfigError';
  }
}

export class GTDValidationError extends GTDConfigError {
  constructor(message: string, public validationErrors: z.ZodError) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class GTDInheritanceError extends GTDConfigError {
  constructor(message: string) {
    super(message, 'INHERITANCE_ERROR');
  }
}

/**
 * Główny manager konfiguracji GTD
 */
export class GTDConfigManager {
  private prisma: PrismaClient;
  private logger: any; // TODO: Replace with proper logger type

  constructor(prisma: PrismaClient, logger?: any) {
    this.prisma = prisma;
    this.logger = logger || console;
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Pobiera konfigurację GTD dla streama
   */
  async getGTDConfig(streamId: string): Promise<ValidatedStreamConfig | null> {
    try {
      const stream = await this.prisma.stream.findUnique({
        where: { id: streamId },
        select: {
          id: true,
          streamConfig: true,
          streamRole: true,
          streamType: true,
          stream_relations_stream_relations_childIdTostreams: {
            select: {
              streams_stream_relations_parentIdTostreams: {
                select: {
                  id: true,
                  streamConfig: true,
                  streamRole: true
                }
              }
            }
          }
        }
      });

      if (!stream) {
        return null;
      }

      // Pobierz konfigurację z dziedziczeniem od rodzica
      const config = await this.mergeConfigWithParent(stream);
      
      // Waliduj i zwróć
      return this.validateConfig(config);
    } catch (error) {
      this.logger.error('Error getting GTD config:', error);
      throw new GTDConfigError('Failed to get GTD config', 'GET_CONFIG_ERROR');
    }
  }

  /**
   * Ustawia konfigurację GTD dla streama
   */
  async setGTDConfig(
    streamId: string, 
    config: Partial<StreamConfig>, 
    options: UpdateStreamConfigOptions = {}
  ): Promise<ValidatedStreamConfig> {
    try {
      const { merge = true, inheritFromParent = true, validateOnly = false } = options;

      // Pobierz istniejącą konfigurację jeśli merge = true
      let finalConfig = config;
      
      if (merge) {
        const existingConfig = await this.getGTDConfig(streamId);
        if (existingConfig) {
          finalConfig = this.deepMerge(existingConfig, config);
        }
      }

      // Dziedzicz od rodzica jeśli włączone
      if (inheritFromParent) {
        finalConfig = await this.applyParentInheritance(streamId, finalConfig);
      }

      // Waliduj konfigurację
      const validatedConfig = this.validateConfig(finalConfig);

      // Jeśli tylko walidacja, nie zapisuj
      if (validateOnly) {
        return validatedConfig;
      }

      // Zapisz do bazy danych
      await this.prisma.stream.update({
        where: { id: streamId },
        data: {
          streamConfig: validatedConfig as any
        }
      });

      this.logger.info(`GTD config updated for stream ${streamId}`);
      return validatedConfig;

    } catch (error) {
      this.logger.error('Error setting GTD config:', error);
      if (error instanceof GTDConfigError) {
        throw error;
      }
      throw new GTDConfigError('Failed to set GTD config', 'SET_CONFIG_ERROR');
    }
  }

  /**
   * Resetuje konfigurację GTD do domyślnej dla danej roli
   */
  async resetToDefaultConfig(streamId: string, gtdRole: StreamRole): Promise<ValidatedStreamConfig> {
    try {
      const defaultConfig = this.getDefaultConfigForRole(gtdRole);
      return await this.setGTDConfig(streamId, defaultConfig, { merge: false, inheritFromParent: false });
    } catch (error) {
      this.logger.error('Error resetting GTD config to default:', error);
      throw new GTDConfigError('Failed to reset to default config', 'RESET_CONFIG_ERROR');
    }
  }

  /**
   * Eksportuje konfigurację GTD do JSON
   */
  async exportGTDConfig(streamId: string): Promise<string> {
    try {
      const config = await this.getGTDConfig(streamId);
      if (!config) {
        throw new GTDConfigError('Stream not found', 'STREAM_NOT_FOUND');
      }
      return JSON.stringify(config, null, 2);
    } catch (error) {
      this.logger.error('Error exporting GTD config:', error);
      throw new GTDConfigError('Failed to export GTD config', 'EXPORT_CONFIG_ERROR');
    }
  }

  /**
   * Importuje konfigurację GTD z JSON
   */
  async importGTDConfig(streamId: string, jsonConfig: string): Promise<ValidatedStreamConfig> {
    try {
      const config = JSON.parse(jsonConfig);
      return await this.setGTDConfig(streamId, config, { merge: false, inheritFromParent: false });
    } catch (error) {
      this.logger.error('Error importing GTD config:', error);
      if (error instanceof SyntaxError) {
        throw new GTDConfigError('Invalid JSON format', 'INVALID_JSON');
      }
      throw new GTDConfigError('Failed to import GTD config', 'IMPORT_CONFIG_ERROR');
    }
  }

  // ========================================
  // STREAM CREATION WITH GTD
  // ========================================

  /**
   * Tworzy nowy stream z konfiguracją GTD
   */
  async createGTDStream(
    organizationId: string,
    createdById: string,
    options: CreateStreamOptions
  ): Promise<{ stream: any; config: ValidatedStreamConfig }> {
    try {
      const {
        name,
        description,
        color = '#3B82F6',
        icon,
        streamRole: gtdRole,
        streamType,
        templateOrigin,
        parentStreamId,
        streamConfig: gtdConfig = {}
      } = options;

      // Pobierz domyślną konfigurację dla roli
      const defaultConfig = this.getDefaultConfigForRole(gtdRole);
      
      // Scalaj z przekazaną konfiguracją
      const finalConfig = this.deepMerge(defaultConfig, gtdConfig);

      // Waliduj konfigurację
      const validatedConfig = this.validateConfig(finalConfig);

      // Utwórz stream
      const stream = await this.prisma.stream.create({
        data: {
          name,
          description,
          color,
          icon,
          streamRole: gtdRole,
          streamType,
          templateOrigin,
          streamConfig: validatedConfig as any,
          organizationId,
          createdById
        },
        include: {
          stream_relations_stream_relations_parentIdTostreams: true,
          stream_relations_stream_relations_childIdTostreams: true
        }
      });

      // Jeśli ma rodzica, utwórz relację
      if (parentStreamId) {
        await this.createParentChildRelation(parentStreamId, stream.id, organizationId, createdById);
      }

      this.logger.info(`GTD stream created: ${stream.id} with role: ${gtdRole}`);
      
      return { stream, config: validatedConfig };

    } catch (error) {
      this.logger.error('Error creating GTD stream:', error);
      throw new GTDConfigError('Failed to create GTD stream', 'CREATE_STREAM_ERROR');
    }
  }

  /**
   * Migruje istniejący stream na GTD-aware
   */
  async migrateToGTDStream(
    streamId: string,
    gtdRole: StreamRole,
    streamType: StreamType = StreamType.CUSTOM
  ): Promise<ValidatedStreamConfig> {
    try {
      // Pobierz domyślną konfigurację
      const defaultConfig = this.getDefaultConfigForRole(gtdRole);
      const validatedConfig = this.validateConfig(defaultConfig);

      // Aktualizuj stream
      await this.prisma.stream.update({
        where: { id: streamId },
        data: {
          streamRole: gtdRole,
          streamType,
          streamConfig: validatedConfig as any
        }
      });

      this.logger.info(`Stream ${streamId} migrated to GTD with role: ${gtdRole}`);
      return validatedConfig;

    } catch (error) {
      this.logger.error('Error migrating stream to GTD:', error);
      throw new GTDConfigError('Failed to migrate stream to GTD', 'MIGRATE_STREAM_ERROR');
    }
  }

  // ========================================
  // VALIDATION AND INHERITANCE
  // ========================================

  /**
   * Waliduje konfigurację GTD
   */
  private validateConfig(config: any): ValidatedStreamConfig {
    try {
      return StreamConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GTDValidationError('GTD config validation failed', error);
      }
      throw new GTDConfigError('Unknown validation error', 'VALIDATION_ERROR');
    }
  }

  /**
   * Sprawdza spójność hierarchii GTD
   */
  async validateGTDHierarchy(streamId: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const errors: string[] = [];

      // Pobierz stream z relacjami
      const stream = await this.prisma.stream.findUnique({
        where: { id: streamId },
        include: {
          stream_relations_stream_relations_parentIdTostreams: {
            include: { parent: true }
          },
          stream_relations_stream_relations_childIdTostreams: {
            include: { child: true }
          }
        }
      });

      if (!stream) {
        errors.push('Stream not found');
        return { valid: false, errors };
      }

      // Sprawdź czy INBOX nie ma dzieci typu INBOX
      if (stream.streamRole === StreamRole.INBOX) {
        const inboxChildren = stream.stream_relations_stream_relations_childIdTostreams.filter(
          rel => rel.child.streamRole === StreamRole.INBOX
        );
        if (inboxChildren.length > 0) {
          errors.push('INBOX stream cannot have INBOX children');
        }
      }

      // Sprawdź czy CONTEXTS ma odpowiednie dzieci
      if (stream.streamRole === StreamRole.CONTEXTS) {
        const invalidChildren = stream.stream_relations_stream_relations_childIdTostreams.filter(
          rel => rel.child.streamType !== StreamType.CONTEXT
        );
        if (invalidChildren.length > 0) {
          errors.push('CONTEXTS stream should only have CONTEXT type children');
        }
      }

      // Sprawdź czy PROJECT ma odpowiednią hierarchię
      if (stream.streamType === StreamType.PROJECT) {
        const projectParents = stream.stream_relations_stream_relations_childIdTostreams?.filter(
          rel => {
            const parent = rel.streams_stream_relations_parentIdTostreams;
            return parent?.streamRole === StreamRole.PROJECTS ||
                   parent?.streamType === StreamType.AREA;
          }
        ) || [];
        if (projectParents.length === 0) {
          errors.push('PROJECT should belong to PROJECTS or AREA stream');
        }
      }

      return { valid: errors.length === 0, errors };

    } catch (error) {
      this.logger.error('Error validating GTD hierarchy:', error);
      return { valid: false, errors: ['Validation failed due to error'] };
    }
  }

  /**
   * Scalanie konfiguracji z rodzicem
   */
  private async mergeConfigWithParent(stream: any): Promise<any> {
    let config = stream.streamConfig;

    // Jeśli ma rodzica, scalaj konfiguracje
    // Relacja childIdTostreams zawiera rodziców tego streama
    if (stream.stream_relations_stream_relations_childIdTostreams?.length > 0) {
      const parentStream = stream.stream_relations_stream_relations_childIdTostreams[0].streams_stream_relations_parentIdTostreams;
      const parentConfig = parentStream?.streamConfig;
      if (parentConfig) {
        config = this.deepMerge(parentConfig, config);
      }
    }

    return config;
  }

  /**
   * Stosuje dziedziczenie od rodzica
   */
  private async applyParentInheritance(streamId: string, config: any): Promise<any> {
    const stream = await this.prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        stream_relations_stream_relations_childIdTostreams: {
          include: {
            streams_stream_relations_parentIdTostreams: {
              select: { streamConfig: true, streamRole: true }
            }
          }
        }
      }
    });

    if (!stream || stream.stream_relations_stream_relations_childIdTostreams.length === 0) {
      return config;
    }

    const parentConfig = stream.stream_relations_stream_relations_childIdTostreams[0].streams_stream_relations_parentIdTostreams?.streamConfig;
    if (!parentConfig) return config;
    return this.deepMerge(parentConfig, config);
  }

  /**
   * Głębokie scalanie obiektów
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Pobiera domyślną konfigurację dla roli GTD
   */
  private getDefaultConfigForRole(gtdRole: StreamRole): Partial<StreamConfig> {
    const baseConfig = DEFAULT_STREAM_CONFIGS[gtdRole] || DEFAULT_STREAM_CONFIGS[StreamRole.CUSTOM];
    
    return {
      inboxBehavior: DEFAULT_INBOX_BEHAVIOR,
      availableContexts: DEFAULT_STREAM_CONTEXTS,
      energyLevels: DEFAULT_ENERGY_LEVELS,
      reviewFrequency: GTDReviewFrequency.WEEKLY,
      processingRules: [],
      automations: [],
      advanced: {
        enableAI: true,
        autoAssignContext: true,
        autoSetEnergyLevel: true,
        enableBulkProcessing: false,
        maxInboxItems: 100
      },
      analytics: {
        trackProcessingTime: true,
        trackDecisionTypes: true,
        generateInsights: true,
        enableReporting: true
      },
      ...baseConfig
    };
  }

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
        relationType: 'OWNS', // Default relation type
        organizationId,
        createdById
      }
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Pobiera wszystkie streamy z daną rolą GTD
   */
  async getStreamsByStreamRole(organizationId: string, gtdRole: StreamRole): Promise<any[]> {
    return await this.prisma.stream.findMany({
      where: {
        organizationId,
        streamRole: gtdRole
      },
      include: {
        stream_relations_stream_relations_parentIdTostreams: {
          include: { parent: true }
        },
        stream_relations_stream_relations_childIdTostreams: {
          include: { child: true }
        }
      }
    });
  }

  /**
   * Przypisuje rolę GTD do streama
   */
  async assignStreamRole(streamId: string, gtdRole: StreamRole): Promise<void> {
    const defaultConfig = this.getDefaultConfigForRole(gtdRole);

    await this.prisma.stream.update({
      where: { id: streamId },
      data: {
        streamRole: gtdRole,
        streamConfig: defaultConfig as any
      }
    });
  }

  /**
   * Pobiera statystyki konfiguracji GTD dla organizacji
   */
  async getGTDStats(organizationId: string): Promise<{
    totalStreams: number;
    streamsByRole: Record<string, number>;
    streamsByType: Record<string, number>;
    configuredStreams: number;
    unconfiguredStreams: number;
  }> {
    const streams = await this.prisma.stream.findMany({
      where: { organizationId },
      select: {
        streamRole: true,
        streamType: true,
        streamConfig: true
      }
    });

    const stats = {
      totalStreams: streams.length,
      streamsByRole: {} as Record<string, number>,
      streamsByType: {} as Record<string, number>,
      configuredStreams: 0,
      unconfiguredStreams: 0
    };

    streams.forEach(stream => {
      // Count by role
      const role = stream.streamRole || 'NONE';
      stats.streamsByRole[role] = (stats.streamsByRole[role] || 0) + 1;

      // Count by type
      stats.streamsByType[stream.streamType] = (stats.streamsByType[stream.streamType] || 0) + 1;

      // Count configured vs unconfigured
      if (stream.streamConfig && Object.keys(stream.streamConfig).length > 0) {
        stats.configuredStreams++;
      } else {
        stats.unconfiguredStreams++;
      }
    });

    return stats;
  }
}

export default GTDConfigManager;