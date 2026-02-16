/**
 * EnhancedStreamHierarchyManager - Rozszerzony manager hierarchii streams z zaawansowanymi operacjami na drzewie Streams
 * Rozszerza istniejący StreamHierarchyService o funkcjonalność Streams i optymalizacje wydajności
 */

import { PrismaClient, Stream, StreamRelation, StreamRole, StreamType } from '@prisma/client';
import { StreamHierarchyService } from './StreamHierarchyService';

/**
 * Wynik operacji na drzewie streamów
 */
export interface StreamTreeResult {
  root: StreamWithChildren;
  totalNodes: number;
  maxDepth: number;
  hasStreamStructure: boolean;
}

/**
 * Stream z dziećmi w strukturze drzewa
 */
export interface StreamWithChildren extends Stream {
  children: StreamWithChildren[];
  depth: number;
  path: string[];
  streamContext?: {
    isStreamCompliant: boolean;
    suggestedRole?: StreamRole;
    issues: string[];
  };
}

/**
 * Wynik wyszukiwania ścieżki
 */
export interface StreamPathResult {
  path: Stream[];
  breadcrumb: string;
  totalDepth: number;
  relationTypes: string[];
}

/**
 * Statystyki hierarchii Streams
 */
export interface StreamHierarchyStats {
  totalStreams: number;
  streamsByRole: Record<StreamRole, number>;
  hierarchyDepth: {
    average: number;
    maximum: number;
    minimum: number;
  };
  streamCompliance: {
    compliantStreams: number;
    nonCompliantStreams: number;
    issues: Array<{
      streamId: string;
      streamName: string;
      issue: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  };
  orphanedStreams: Array<{
    streamId: string;
    streamName: string;
    reason: string;
  }>;
}

/**
 * Enhanced Stream Hierarchy Manager z funkcjonalnością Streams
 */
export class EnhancedStreamHierarchyManager extends StreamHierarchyService {
  private prisma: PrismaClient;
  private logger: any;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minut

  constructor(prisma: PrismaClient, logger?: any) {
    super();
    this.prisma = prisma;
    this.logger = logger || console;
  }

  // ========================================
  // TREE OPERATIONS WITH CTE OPTIMIZATION
  // ========================================

  /**
   * Pobiera pełne drzewo streamów z recursive CTE queries dla wydajności
   */
  async getStreamTree(
    rootStreamId: string,
    options: {
      maxDepth?: number;
      includeStreamAnalysis?: boolean;
      includeInactive?: boolean;
    } = {}
  ): Promise<StreamTreeResult> {
    const { maxDepth = 10, includeStreamAnalysis = true, includeInactive = false } = options;
    
    try {
      const cacheKey = `tree_${rootStreamId}_${maxDepth}_${includeStreamAnalysis}_${includeInactive}`;
      
      // Sprawdź cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // PostgreSQL recursive CTE query dla wydajności
      const treeQuery = `
        WITH RECURSIVE stream_tree AS (
          -- Base case: root stream
          SELECT 
            s.id, s.name, s.description, s.color, s.icon, s.settings, s.status,
            s."streamRole", s."templateOrigin", s."streamConfig", s."streamType",
            s."organizationId", s."createdById", s."createdAt", s."updatedAt",
            0 as depth,
            ARRAY[s.id] as path,
            s.name as breadcrumb
          FROM streams s
          WHERE s.id = $1
          
          UNION ALL
          
          -- Recursive case: children
          SELECT 
            child.id, child.name, child.description, child.color, child.icon, 
            child.settings, child.status, child."streamRole", child."templateOrigin", 
            child."streamConfig", child."streamType", child."organizationId", 
            child."createdById", child."createdAt", child."updatedAt",
            st.depth + 1,
            st.path || child.id,
            st.breadcrumb || ' > ' || child.name
          FROM streams child
          INNER JOIN stream_relations sr ON sr."childId" = child.id
          INNER JOIN stream_tree st ON st.id = sr."parentId"
          WHERE st.depth < $2
            AND ($3 OR sr."isActive" = true)
            AND NOT child.id = ANY(st.path) -- Prevent cycles
        )
        SELECT * FROM stream_tree ORDER BY depth, name;
      `;

      const treeNodes = await this.prisma.$queryRawUnsafe(
        treeQuery,
        rootStreamId,
        maxDepth,
        includeInactive
      ) as any[];

      if (treeNodes.length === 0) {
        throw new Error(`Root stream ${rootStreamId} not found`);
      }

      // Buduj strukturę drzewa
      const root = await this.buildTreeStructure(treeNodes, includeStreamAnalysis);
      
      const result: StreamTreeResult = {
        root,
        totalNodes: treeNodes.length,
        maxDepth: Math.max(...treeNodes.map((n: any) => n.depth)),
        hasStreamStructure: this.analyzeStreamStructure(root)
      };

      // Cache wynik
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      this.logger.error('Error getting stream tree:', error);
      throw new Error('Failed to get stream tree');
    }
  }

  /**
   * Pobiera wszystkich przodków streama
   */
  async getStreamAncestors(streamId: string, maxDepth = 10): Promise<Stream[]> {
    try {
      const ancestorsQuery = `
        WITH RECURSIVE ancestors AS (
          -- Base case: target stream
          SELECT s.*, 0 as depth
          FROM streams s
          WHERE s.id = $1
          
          UNION ALL
          
          -- Recursive case: parents
          SELECT parent.*, a.depth + 1
          FROM streams parent
          INNER JOIN stream_relations sr ON sr."parentId" = parent.id
          INNER JOIN ancestors a ON a.id = sr."childId"
          WHERE a.depth < $2 AND sr."isActive" = true
        )
        SELECT * FROM ancestors WHERE depth > 0 ORDER BY depth;
      `;

      return await this.prisma.$queryRawUnsafe(ancestorsQuery, streamId, maxDepth) as Stream[];
    } catch (error) {
      this.logger.error('Error getting stream ancestors:', error);
      throw new Error('Failed to get stream ancestors');
    }
  }

  /**
   * Pobiera wszystkich potomków streama z ograniczeniem głębokości
   */
  async getStreamDescendants(streamId: string, maxDepth = 10): Promise<Stream[]> {
    try {
      const descendantsQuery = `
        WITH RECURSIVE descendants AS (
          -- Base case: target stream
          SELECT s.*, 0 as depth
          FROM streams s
          WHERE s.id = $1
          
          UNION ALL
          
          -- Recursive case: children
          SELECT child.*, d.depth + 1
          FROM streams child
          INNER JOIN stream_relations sr ON sr."childId" = child.id
          INNER JOIN descendants d ON d.id = sr."parentId"
          WHERE d.depth < $2 AND sr."isActive" = true
        )
        SELECT * FROM descendants WHERE depth > 0 ORDER BY depth;
      `;

      return await this.prisma.$queryRawUnsafe(descendantsQuery, streamId, maxDepth) as Stream[];
    } catch (error) {
      this.logger.error('Error getting stream descendants:', error);
      throw new Error('Failed to get stream descendants');
    }
  }

  /**
   * Pobiera siblings streama (na tym samym poziomie)
   */
  async getStreamSiblings(streamId: string): Promise<Stream[]> {
    try {
      const siblingsQuery = `
        SELECT DISTINCT s.*
        FROM streams s
        INNER JOIN stream_relations sr_sibling ON sr_sibling."childId" = s.id
        INNER JOIN stream_relations sr_target ON sr_target."parentId" = sr_sibling."parentId"
        WHERE sr_target."childId" = $1 
          AND s.id != $1
          AND sr_sibling."isActive" = true
          AND sr_target."isActive" = true
        ORDER BY s.name;
      `;

      return await this.prisma.$queryRawUnsafe(siblingsQuery, streamId) as Stream[];
    } catch (error) {
      this.logger.error('Error getting stream siblings:', error);
      throw new Error('Failed to get stream siblings');
    }
  }

  /**
   * Przenosi stream w hierarchii z walidacją cykli
   */
  async moveStreamInHierarchy(
    streamId: string,
    newParentId: string | null,
    organizationId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Sprawdź czy nie utworzy cyklu
      if (newParentId) {
        const wouldCreateCycle = await this.validateNoCycles(newParentId, streamId);
        if (wouldCreateCycle) {
          return { success: false, message: 'Moving would create a cycle in hierarchy' };
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        // Usuń istniejące relacje rodzic-dziecko
        await tx.streamRelation.updateMany({
          where: { childId: streamId },
          data: { isActive: false }
        });

        // Dodaj nową relację jeśli ma nowego rodzica
        if (newParentId) {
          await tx.streamRelation.create({
            data: {
              parentId: newParentId,
              childId: streamId,
              relationType: 'OWNS',
              organizationId,
              createdById: userId
            }
          });
        }

        return { success: true, message: 'Stream moved successfully' };
      });

    } catch (error) {
      this.logger.error('Error moving stream in hierarchy:', error);
      return { success: false, message: 'Failed to move stream' };
    }
  }

  /**
   * Pobiera ścieżkę streama (breadcrumb path)
   */
  async getStreamPath(streamId: string): Promise<StreamPathResult> {
    try {
      const pathQuery = `
        WITH RECURSIVE stream_path AS (
          -- Base case: target stream
          SELECT 
            s.*, 0 as depth, s.name as breadcrumb, 
            ARRAY[s.name] as path_names,
            ARRAY[]::text[] as relation_types
          FROM streams s
          WHERE s.id = $1
          
          UNION ALL
          
          -- Recursive case: parents
          SELECT 
            parent.*, sp.depth + 1,
            parent.name || ' > ' || sp.breadcrumb,
            parent.name || sp.path_names,
            sr."relationType"::text || sp.relation_types
          FROM streams parent
          INNER JOIN stream_relations sr ON sr."parentId" = parent.id
          INNER JOIN stream_path sp ON sp.id = sr."childId"
          WHERE sr."isActive" = true AND sp.depth < 20
        )
        SELECT * FROM stream_path ORDER BY depth DESC LIMIT 1;
      `;

      const result = await this.prisma.$queryRawUnsafe(pathQuery, streamId) as any[];
      
      if (result.length === 0) {
        throw new Error('Stream not found');
      }

      const pathData = result[0];
      const ancestors = await this.getStreamAncestors(streamId);

      return {
        path: [pathData, ...ancestors],
        breadcrumb: pathData.breadcrumb,
        totalDepth: pathData.depth,
        relationTypes: pathData.relation_types || []
      };

    } catch (error) {
      this.logger.error('Error getting stream path:', error);
      throw new Error('Failed to get stream path');
    }
  }

  /**
   * Oblicza głębokość streama w hierarchii
   */
  async calculateStreamDepth(streamId: string): Promise<number> {
    try {
      const depthQuery = `
        WITH RECURSIVE depth_calc AS (
          SELECT s.id, 0 as depth
          FROM streams s
          WHERE s.id = $1
          
          UNION ALL
          
          SELECT parent.id, dc.depth + 1
          FROM streams parent
          INNER JOIN stream_relations sr ON sr."parentId" = parent.id
          INNER JOIN depth_calc dc ON dc.id = sr."childId"
          WHERE sr."isActive" = true AND dc.depth < 50
        )
        SELECT MAX(depth) as max_depth FROM depth_calc;
      `;

      const result = await this.prisma.$queryRawUnsafe(depthQuery, streamId) as any[];
      return result[0]?.max_depth || 0;
    } catch (error) {
      this.logger.error('Error calculating stream depth:', error);
      return 0;
    }
  }

  /**
   * Znajduje wspólnego przodka dla dwóch streamów
   */
  async findCommonAncestor(streamId1: string, streamId2: string): Promise<Stream | null> {
    try {
      const ancestors1 = await this.getStreamAncestors(streamId1);
      const ancestors2 = await this.getStreamAncestors(streamId2);

      const ancestorIds1 = new Set(ancestors1.map(a => a.id));
      
      // Znajdź pierwszego wspólnego przodka (najniższy w hierarchii)
      for (const ancestor of ancestors2) {
        if (ancestorIds1.has(ancestor.id)) {
          return ancestor;
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error finding common ancestor:', error);
      return null;
    }
  }

  /**
   * Waliduje integralność hierarchii
   */
  async validateHierarchyIntegrity(organizationId: string): Promise<{
    isValid: boolean;
    errors: Array<{
      type: 'CYCLE' | 'ORPHAN' | 'INVALID_RELATION' | 'STREAM_VIOLATION';
      streamId: string;
      message: string;
    }>;
  }> {
    try {
      const errors: Array<{
        type: 'CYCLE' | 'ORPHAN' | 'INVALID_RELATION' | 'STREAM_VIOLATION';
        streamId: string;
        message: string;
      }> = [];

      // Sprawdź cykle
      const cycles = await this.detectStreamCycles(organizationId);
      cycles.forEach(cycle => {
        errors.push({
          type: 'CYCLE',
          streamId: cycle.streamId,
          message: `Cycle detected involving streams: ${cycle.cycle.join(' -> ')}`
        });
      });

      // Sprawdź osierocone streams
      const orphans = await this.findOrphanedStreams(organizationId);
      orphans.forEach(orphan => {
        errors.push({
          type: 'ORPHAN',
          streamId: orphan.id,
          message: `Orphaned stream: ${orphan.name}`
        });
      });

      // Sprawdź naruszenia Streams
      const streamViolations = await this.validateStreamHierarchyRules(organizationId);
      streamViolations.forEach(violation => {
        errors.push({
          type: 'STREAM_VIOLATION',
          streamId: violation.streamId,
          message: violation.message
        });
      });

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      this.logger.error('Error validating hierarchy integrity:', error);
      throw new Error('Failed to validate hierarchy integrity');
    }
  }

  // ========================================
  // STREAM-SPECIFIC OPERATIONS
  // ========================================

  /**
   * Pobiera statystyki hierarchii Streams
   */
  async getStreamHierarchyStats(organizationId: string): Promise<StreamHierarchyStats> {
    try {
      const streams = await this.prisma.stream.findMany({
        where: { organizationId },
        include: {
          parentRelations: { include: { parent: true } },
          childRelations: { include: { child: true } }
        }
      });

      const stats: StreamHierarchyStats = {
        totalStreams: streams.length,
        streamsByRole: {} as Record<StreamRole, number>,
        hierarchyDepth: { average: 0, maximum: 0, minimum: 0 },
        streamCompliance: {
          compliantStreams: 0,
          nonCompliantStreams: 0,
          issues: []
        },
        orphanedStreams: []
      };

      // Analiza ról Streams
      for (const role of Object.values(StreamRole)) {
        stats.streamsByRole[role] = streams.filter(s => s.streamRole === role).length;
      }

      // Analiza głębokości
      const depths = await Promise.all(
        streams.map(s => this.calculateStreamDepth(s.id))
      );
      
      if (depths.length > 0) {
        stats.hierarchyDepth.maximum = Math.max(...depths);
        stats.hierarchyDepth.minimum = Math.min(...depths);
        stats.hierarchyDepth.average = depths.reduce((a, b) => a + b, 0) / depths.length;
      }

      // Analiza zgodności Streams
      for (const stream of streams) {
        const compliance = await this.analyzeStreamCompliance(stream);
        if (compliance.isCompliant) {
          stats.streamCompliance.compliantStreams++;
        } else {
          stats.streamCompliance.nonCompliantStreams++;
          stats.streamCompliance.issues.push(...compliance.issues.map(issue => ({
            streamId: stream.id,
            streamName: stream.name,
            issue: issue.message,
            severity: issue.severity
          })));
        }
      }

      // Znajdź sieroty
      const orphans = await this.findOrphanedStreams(organizationId);
      stats.orphanedStreams = orphans.map(orphan => ({
        streamId: orphan.id,
        streamName: orphan.name,
        reason: 'No parent relationship found'
      }));

      return stats;

    } catch (error) {
      this.logger.error('Error getting Stream hierarchy stats:', error);
      throw new Error('Failed to get Stream hierarchy stats');
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Buduje strukturę drzewa z flat danych
   */
  private async buildTreeStructure(
    treeNodes: any[],
    includeStreamAnalysis: boolean
  ): Promise<StreamWithChildren> {
    const nodeMap = new Map<string, StreamWithChildren>();

    // Utwórz wszystkie nodes
    for (const node of treeNodes) {
      const streamNode: StreamWithChildren = {
        ...node,
        children: [],
        depth: node.depth,
        path: node.path || [],
        streamContext: includeStreamAnalysis ? {
          isStreamCompliant: false,
          issues: []
        } : undefined
      };

      if (includeStreamAnalysis) {
        const compliance = await this.analyzeStreamCompliance(node);
        streamNode.streamContext = {
          isStreamCompliant: compliance.isCompliant,
          suggestedRole: compliance.suggestedRole,
          issues: compliance.issues.map(i => i.message)
        };
      }

      nodeMap.set(node.id, streamNode);
    }

    // Buduj hierarchię
    let root: StreamWithChildren | null = null;
    
    for (const node of treeNodes) {
      const currentNode = nodeMap.get(node.id)!;
      
      if (node.depth === 0) {
        root = currentNode;
      } else {
        // Znajdź rodzica i dodaj jako dziecko
        const parentPath = node.path.slice(0, -1);
        const parentId = parentPath[parentPath.length - 1];
        const parent = nodeMap.get(parentId);
        
        if (parent) {
          parent.children.push(currentNode);
        }
      }
    }

    if (!root) {
      throw new Error('Root node not found in tree structure');
    }

    return root;
  }

  /**
   * Analizuje czy drzewo ma strukturę Streams
   */
  private analyzeStreamStructure(root: StreamWithChildren): boolean {
    // Sprawdź czy root ma odpowiednią rolę
    if (!root.streamRole) {
      return false;
    }

    // Sprawdź czy ma przynajmniej podstawowe role Streams w hierarchii
    const hasInbox = this.findRoleInTree(root, StreamRole.INBOX);
    const hasNextActions = this.findRoleInTree(root, StreamRole.NEXT_ACTIONS);
    const hasProjects = this.findRoleInTree(root, StreamRole.PROJECTS);

    return hasInbox || hasNextActions || hasProjects;
  }

  /**
   * Znajduje rolę w drzewie
   */
  private findRoleInTree(node: StreamWithChildren, role: StreamRole): boolean {
    if (node.streamRole === role) {
      return true;
    }

    return node.children.some(child => this.findRoleInTree(child, role));
  }

  /**
   * Analizuje zgodność streama z regułami Streams
   */
  private async analyzeStreamCompliance(stream: any): Promise<{
    isCompliant: boolean;
    suggestedRole?: StreamRole;
    issues: Array<{
      message: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  }> {
    const issues: Array<{
      message: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }> = [];

    // Sprawdź czy ma przypisaną rolę Stream
    if (!stream.streamRole) {
      issues.push({
        message: 'No Stream role assigned',
        severity: 'MEDIUM'
      });
    }

    // Sprawdź zgodność stream type z Stream role
    if (stream.streamRole === StreamRole.CONTEXTS && stream.streamType !== StreamType.CONTEXT) {
      issues.push({
        message: 'CONTEXTS role should have CONTEXT stream type',
        severity: 'HIGH'
      });
    }

    if (stream.streamRole === StreamRole.PROJECTS && stream.streamType !== StreamType.PROJECT) {
      issues.push({
        message: 'PROJECTS role should have PROJECT stream type',
        severity: 'HIGH'
      });
    }

    // Sprawdź czy INBOX nie ma Stream config
    if (stream.streamRole === StreamRole.INBOX && (!stream.streamConfig || Object.keys(stream.streamConfig).length === 0)) {
      issues.push({
        message: 'INBOX should have Stream configuration',
        severity: 'HIGH'
      });
    }

    return {
      isCompliant: issues.length === 0,
      suggestedRole: this.suggestStreamRole(stream),
      issues
    };
  }

  /**
   * Sugeruje rolę Stream na podstawie nazwy i kontekstu
   */
  private suggestStreamRole(stream: any): StreamRole | undefined {
    const name = stream.name.toLowerCase();
    
    if (name.includes('inbox')) return StreamRole.INBOX;
    if (name.includes('next') || name.includes('action')) return StreamRole.NEXT_ACTIONS;
    if (name.includes('wait')) return StreamRole.WAITING_FOR;
    if (name.includes('someday') || name.includes('maybe')) return StreamRole.SOMEDAY_MAYBE;
    if (name.includes('project')) return StreamRole.PROJECTS;
    if (name.includes('context') || name.includes('@')) return StreamRole.CONTEXTS;
    if (name.includes('area') || name.includes('responsibility')) return StreamRole.AREAS;
    if (name.includes('reference') || name.includes('doc')) return StreamRole.REFERENCE;
    
    return undefined;
  }

  /**
   * Wykrywa cykle w hierarchii Streams
   */
  private async detectStreamCycles(organizationId: string): Promise<Array<{
    streamId: string;
    cycle: string[];
  }>> {
    // TODO: Implementacja wykrywania cykli
    return [];
  }

  /**
   * Znajduje osierocone streams
   */
  private async findOrphanedStreams(organizationId: string): Promise<Stream[]> {
    return await this.prisma.stream.findMany({
      where: {
        organizationId,
        parentRelations: { none: {} },
        streamRole: { not: null } // Only streams that should have parents
      }
    });
  }

  /**
   * Waliduje reguły hierarchii Streams
   */
  private async validateStreamHierarchyRules(organizationId: string): Promise<Array<{
    streamId: string;
    message: string;
  }>> {
    // TODO: Implementacja walidacji reguł Streams
    return [];
  }

  /**
   * Waliduje czy tworzenie relacji nie utworzy cyklu
   */
  async validateNoCycles(parentId: string, childId: string): Promise<boolean> {
    try {
      const ancestors = await this.getStreamAncestors(childId);
      return ancestors.some(ancestor => ancestor.id === parentId);
    } catch (error) {
      this.logger.error('Error validating cycles:', error);
      return true; // Err on safe side
    }
  }

  /**
   * Czyści cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default EnhancedStreamHierarchyManager;