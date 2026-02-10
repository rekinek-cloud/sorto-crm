import { StreamRelationType, AccessLevel, DataScope, InheritanceRule, Stream, StreamRelation, StreamPermission } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/database';

// DTOs for type safety
export const CreateStreamRelationDto = z.object({
  parentId: z.string().min(1),
  childId: z.string().min(1),
  relationType: z.enum(['OWNS', 'MANAGES', 'BELONGS_TO', 'RELATED_TO', 'DEPENDS_ON', 'SUPPORTS']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  inheritanceRule: z.enum(['NO_INHERITANCE', 'INHERIT_DOWN', 'INHERIT_UP', 'INHERIT_BIDIRECTIONAL']).default('INHERIT_DOWN'),
  permissions: z.array(z.object({
    dataScope: z.enum(['BASIC_INFO', 'TASKS', 'PROJECTS', 'FINANCIAL', 'METRICS', 'COMMUNICATION', 'PERMISSIONS', 'CONFIGURATION', 'AUDIT_LOGS']),
    action: z.enum(['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'APPROVE', 'AUDIT']),
    granted: z.boolean().default(true)
  })).optional(),
  organizationId: z.string().uuid(),
  createdById: z.string().uuid()
});

export const UpdateStreamRelationDto = z.object({
  relationType: z.enum(['OWNS', 'MANAGES', 'BELONGS_TO', 'RELATED_TO', 'DEPENDS_ON', 'SUPPORTS']).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  inheritanceRule: z.enum(['NO_INHERITANCE', 'INHERIT_DOWN', 'INHERIT_UP', 'INHERIT_BIDIRECTIONAL']).optional()
});

export const StreamHierarchyQueryDto = z.object({
  streamId: z.string().min(1),
  depth: z.number().int().min(1).max(10).default(3),
  includePermissions: z.boolean().default(false),
  direction: z.enum(['up', 'down', 'both']).default('both')
});

export type CreateStreamRelationInput = z.infer<typeof CreateStreamRelationDto>;
export type UpdateStreamRelationInput = z.infer<typeof UpdateStreamRelationDto>;
export type StreamHierarchyQuery = z.infer<typeof StreamHierarchyQueryDto>;

// Extended types for responses
export interface StreamWithRelations extends Stream {
  parentRelations: (StreamRelation & { 
    parent: Stream;
    permissions: StreamPermission[];
  })[];
  childRelations: (StreamRelation & { 
    child: Stream;
    permissions: StreamPermission[];
  })[];
}

export interface StreamHierarchy {
  stream: Stream;
  parents: StreamWithRelations[];
  children: StreamWithRelations[];
  depth: number;
  totalRelations: number;
  hasCycles: boolean;
}

export interface AccessResult {
  hasAccess: boolean;
  accessLevel: AccessLevel | null;
  grantedScopes: DataScope[];
  deniedScopes: DataScope[];
  via: string | null; // ID relacji przez którą uzyskano dostęp
  reason: string;
}

export class StreamHierarchyService {
  
  /**
   * Tworzy nową relację między strumieniami
   */
  async createRelation(data: CreateStreamRelationInput): Promise<StreamRelation> {
    // Walidacja danych wejściowych
    const validatedData = CreateStreamRelationDto.parse(data);
    
    // Sprawdzenie czy strumienie istnieją
    const [parentStream, childStream] = await Promise.all([
      prisma.stream.findUnique({ 
        where: { id: validatedData.parentId, organizationId: validatedData.organizationId } 
      }),
      prisma.stream.findUnique({ 
        where: { id: validatedData.childId, organizationId: validatedData.organizationId } 
      })
    ]);

    if (!parentStream) {
      throw new Error(`Parent stream ${validatedData.parentId} not found`);
    }
    if (!childStream) {
      throw new Error(`Child stream ${validatedData.childId} not found`);
    }

    // Sprawdzenie czy relacja nie tworzy cyklu
    const wouldCreateCycle = await this.validateNoCycles(validatedData.parentId, validatedData.childId);
    if (wouldCreateCycle) {
      throw new Error('Creating this relation would create a cycle in the hierarchy');
    }

    // Sprawdzenie czy taka relacja już istnieje
    const existingRelation = await prisma.stream_relations.findFirst({
      where: {
        parentId: validatedData.parentId,
        childId: validatedData.childId,
        relationType: validatedData.relationType as StreamRelationType,
        organizationId: validatedData.organizationId
      }
    });

    if (existingRelation) {
      throw new Error(`Relation ${validatedData.relationType} between these streams already exists`);
    }

    // Utworzenie relacji w transakcji
    return await prisma.$transaction(async (tx) => {
      // Utworzenie relacji
      const relation = await tx.streamRelation.create({
        data: {
          parentId: validatedData.parentId,
          childId: validatedData.childId,
          relationType: validatedData.relationType as StreamRelationType,
          description: validatedData.description,
          isActive: validatedData.isActive,
          inheritanceRule: validatedData.inheritanceRule as InheritanceRule,
          organizationId: validatedData.organizationId,
          createdById: validatedData.createdById
        }
      });

      // Dodanie uprawnień jeśli zostały podane
      if (validatedData.permissions && validatedData.permissions.length > 0) {
        await tx.streamPermission.createMany({
          data: validatedData.permissions.map(perm => ({
            relationId: relation.id,
            dataScope: perm.dataScope as DataScope,
            action: perm.action as any, // TODO: Fix PermissionAction enum
            granted: perm.granted
          }))
        });
      }

      return relation;
    });
  }

  /**
   * Pobiera hierarchię strumienia
   */
  async getStreamHierarchy(query: StreamHierarchyQuery): Promise<StreamHierarchy> {
    const validatedQuery = StreamHierarchyQueryDto.parse(query);
    
    const stream = await prisma.stream.findUnique({
      where: { id: validatedQuery.streamId }
    });

    if (!stream) {
      throw new Error(`Stream ${validatedQuery.streamId} not found`);
    }

    const includePermissions = validatedQuery.includePermissions;

    // Pobranie rodziców (w górę hierarchii)
    let parents: StreamWithRelations[] = [];
    if (validatedQuery.direction === 'up' || validatedQuery.direction === 'both') {
      parents = await this.getStreamParents(validatedQuery.streamId, validatedQuery.depth, includePermissions);
    }

    // Pobranie dzieci (w dół hierarchii)
    let children: StreamWithRelations[] = [];
    if (validatedQuery.direction === 'down' || validatedQuery.direction === 'both') {
      children = await this.getStreamChildren(validatedQuery.streamId, validatedQuery.depth, includePermissions);
    }

    // Sprawdzenie cykli
    const hasCycles = await this.detectCycles(validatedQuery.streamId);
    
    return {
      stream,
      parents,
      children,
      depth: validatedQuery.depth,
      totalRelations: parents.length + children.length,
      hasCycles
    };
  }

  /**
   * Aktualizuje relację między strumieniami
   */
  async updateRelation(relationId: string, data: UpdateStreamRelationInput): Promise<StreamRelation> {
    const validatedData = UpdateStreamRelationDto.parse(data);
    
    const existingRelation = await prisma.stream_relations.findUnique({
      where: { id: relationId }
    });

    if (!existingRelation) {
      throw new Error(`Stream relation ${relationId} not found`);
    }

    return await prisma.stream_relations.update({
      where: { id: relationId },
      data: {
        relationType: validatedData.relationType as StreamRelationType,
        description: validatedData.description,
        isActive: validatedData.isActive,
        inheritanceRule: validatedData.inheritanceRule as InheritanceRule
      }
    });
  }

  /**
   * Usuwa relację między strumieniami
   */
  async deleteRelation(relationId: string): Promise<void> {
    const existingRelation = await prisma.stream_relations.findUnique({
      where: { id: relationId }
    });

    if (!existingRelation) {
      throw new Error(`Stream relation ${relationId} not found`);
    }

    await prisma.$transaction(async (tx) => {
      // Usunięcie uprawnień
      await tx.streamPermission.deleteMany({
        where: { relationId }
      });
      
      // Usunięcie relacji
      await tx.streamRelation.delete({
        where: { id: relationId }
      });
    });
  }

  /**
   * Pobiera powiązane strumienie
   */
  async getRelatedStreams(
    streamId: string, 
    relationType?: StreamRelationType,
    organizationId?: string
  ): Promise<Stream[]> {
    const where: any = {
      OR: [
        { parentId: streamId },
        { childId: streamId }
      ],
      isActive: true
    };

    if (relationType) {
      where.relationType = relationType;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const relations = await prisma.stream_relations.findMany({
      where,
      include: {
        parent: true,
        child: true
      }
    });

    // Zwróć strumienie które NIE są tym podanym
    const relatedStreams: Stream[] = [];
    relations.forEach(relation => {
      if (relation.parentId === streamId && relation.child) {
        relatedStreams.push(relation.child);
      } else if (relation.childId === streamId && relation.parent) {
        relatedStreams.push(relation.parent);
      }
    });

    return relatedStreams;
  }

  /**
   * Sprawdza czy dodanie relacji utworzyłoby cykl
   */
  async validateNoCycles(parentId: string, childId: string): Promise<boolean> {
    // Nie można stworzyć relacji ze sobą
    if (parentId === childId) {
      return true;
    }

    // Sprawdzenie czy child jest już rodzicem dla parent (bezpośrednie odwrócenie)
    const reverseRelation = await prisma.stream_relations.findFirst({
      where: {
        parentId: childId,
        childId: parentId,
        isActive: true
      }
    });

    if (reverseRelation) {
      return true;
    }

    // Sprawdzenie cykli przez rekurencyjne przeszukiwanie
    return await this.hasPathBetween(childId, parentId, new Set());
  }

  /**
   * Sprawdza czy istnieje ścieżka między dwoma strumieniami (dla wykrywania cykli)
   */
  private async hasPathBetween(fromId: string, toId: string, visited: Set<string>): Promise<boolean> {
    if (visited.has(fromId)) {
      return false; // Już odwiedzony, unikamy nieskończonej pętli
    }
    
    visited.add(fromId);

    // Pobierz wszystkich rodziców fromId
    const parentRelations = await prisma.stream_relations.findMany({
      where: {
        childId: fromId,
        isActive: true
      },
      select: { parentId: true }
    });

    for (const relation of parentRelations) {
      if (relation.parentId === toId) {
        return true; // Znaleziono bezpośrednią ścieżkę
      }
      
      // Rekurencyjne sprawdzenie
      const hasPath = await this.hasPathBetween(relation.parentId, toId, new Set(visited));
      if (hasPath) {
        return true;
      }
    }

    return false;
  }

  /**
   * Wykrywa wszystkie cykle w hierarchii dla danego strumienia
   */
  private async detectCycles(streamId: string): Promise<boolean> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    return await this.detectCyclesRecursive(streamId, visited, recursionStack);
  }

  private async detectCyclesRecursive(
    streamId: string, 
    visited: Set<string>, 
    recursionStack: Set<string>
  ): Promise<boolean> {
    visited.add(streamId);
    recursionStack.add(streamId);

    // Pobierz wszystkich rodziców
    const parentRelations = await prisma.stream_relations.findMany({
      where: {
        childId: streamId,
        isActive: true
      },
      select: { parentId: true }
    });

    for (const relation of parentRelations) {
      const parentId = relation.parentId;
      
      if (!visited.has(parentId)) {
        if (await this.detectCyclesRecursive(parentId, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(parentId)) {
        return true; // Cykl znaleziony!
      }
    }

    recursionStack.delete(streamId);
    return false;
  }

  /**
   * Pobiera rodziców strumienia (rekurencyjnie w górę)
   */
  private async getStreamParents(
    streamId: string, 
    maxDepth: number, 
    includePermissions: boolean,
    currentDepth: number = 0
  ): Promise<StreamWithRelations[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const parentRelations = await prisma.stream_relations.findMany({
      where: {
        childId: streamId,
        isActive: true
      },
      include: {
        parent: true,
        permissions: includePermissions
      }
    });

    const parents: StreamWithRelations[] = [];
    
    for (const relation of parentRelations) {
      const parentWithRelations: StreamWithRelations = {
        ...relation.parent,
        parentRelations: [],
        childRelations: [{
          ...relation,
          child: relation.parent, // Uwaga: to może być mylące, ale zachowujemy strukturę
          permissions: relation.permissions || []
        }]
      };

      // Rekurencyjnie pobierz rodziców rodziców
      const grandParents = await this.getStreamParents(
        relation.parent.id, 
        maxDepth, 
        includePermissions, 
        currentDepth + 1
      );
      
      parentWithRelations.parentRelations = grandParents.map(gp => ({
        ...gp.childRelations[0], // Pierwsza relacja z grandparent
        parent: gp,
        permissions: gp.childRelations[0]?.permissions || []
      }));

      parents.push(parentWithRelations);
    }

    return parents;
  }

  /**
   * Pobiera dzieci strumienia (rekurencyjnie w dół)
   */
  private async getStreamChildren(
    streamId: string, 
    maxDepth: number, 
    includePermissions: boolean,
    currentDepth: number = 0
  ): Promise<StreamWithRelations[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const childRelations = await prisma.stream_relations.findMany({
      where: {
        parentId: streamId,
        isActive: true
      },
      include: {
        child: true,
        permissions: includePermissions
      }
    });

    const children: StreamWithRelations[] = [];
    
    for (const relation of childRelations) {
      const childWithRelations: StreamWithRelations = {
        ...relation.child,
        parentRelations: [{
          ...relation,
          parent: relation.child, // Uwaga: struktura może być myląca
          permissions: relation.permissions || []
        }],
        childRelations: []
      };

      // Rekurencyjnie pobierz dzieci dzieci
      const grandChildren = await this.getStreamChildren(
        relation.child.id, 
        maxDepth, 
        includePermissions, 
        currentDepth + 1
      );
      
      childWithRelations.childRelations = grandChildren.map(gc => ({
        ...gc.parentRelations[0], // Pierwsza relacja z grandchild
        child: gc,
        permissions: gc.parentRelations[0]?.permissions || []
      }));

      children.push(childWithRelations);
    }

    return children;
  }

  /**
   * Pobiera statystyki hierarchii dla organizacji
   */
  async getHierarchyStats(organizationId: string) {
    const [
      totalRelations,
      activeRelations,
      relationsByType,
      streamsWithHierarchy
    ] = await Promise.all([
      prisma.stream_relations.count({
        where: { organizationId }
      }),
      prisma.stream_relations.count({
        where: { organizationId, isActive: true }
      }),
      prisma.stream_relations.groupBy({
        by: ['relationType'],
        where: { organizationId, isActive: true },
        _count: true
      }),
      prisma.stream.count({
        where: {
          organizationId,
          OR: [
            { stream_relations_stream_relations_parentIdTostreams: { some: { isActive: true } } },
            { stream_relations_stream_relations_childIdTostreams: { some: { isActive: true } } }
          ]
        }
      })
    ]);

    return {
      totalRelations,
      activeRelations,
      inactiveRelations: totalRelations - activeRelations,
      relationsByType: relationsByType.reduce((acc, item) => {
        acc[item.relationType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      streamsWithHierarchy,
      hierarchyPenetration: streamsWithHierarchy // można dodać więcej metryk
    };
  }
}

export default new StreamHierarchyService();