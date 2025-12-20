import { PrismaClient, DataScope, StreamRelationType, InheritanceRule, Stream, StreamRelation, StreamPermission } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// DTOs for access control
export const AccessCheckDto = z.object({
  userId: z.string().uuid(),
  streamId: z.string().uuid(),
  dataScope: z.enum(['BASIC_INFO', 'TASKS', 'PROJECTS', 'FINANCIAL', 'METRICS', 'COMMUNICATION', 'PERMISSIONS', 'CONFIGURATION', 'AUDIT_LOGS']),
  action: z.enum(['read', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'APPROVE', 'AUDIT']),
  organizationId: z.string().uuid().optional()
});

export const AccessFiltersDto = z.object({
  dataScope: z.enum(['BASIC_INFO', 'TASKS', 'PROJECTS', 'FINANCIAL', 'METRICS', 'COMMUNICATION', 'PERMISSIONS', 'CONFIGURATION', 'AUDIT_LOGS']).optional(),
  relationType: z.enum(['OWNS', 'MANAGES', 'BELONGS_TO', 'RELATED_TO', 'DEPENDS_ON', 'SUPPORTS']).optional(),
  includeInherited: z.boolean().default(true),
  maxDepth: z.number().int().min(1).max(10).default(5)
});

export type AccessCheckInput = z.infer<typeof AccessCheckDto>;
export type AccessFilters = z.infer<typeof AccessFiltersDto>;

// Extended types for access control
export interface AccessResult {
  hasAccess: boolean;
  accessLevel: 'NO_ACCESS' | 'READ_ONLY' | 'LIMITED' | 'CONTRIBUTOR' | 'COLLABORATOR' | 'MANAGER' | 'ADMIN' | 'FULL_CONTROL';
  grantedScopes: DataScope[];
  deniedScopes: DataScope[];
  via: string | null; // ID relacji przez którą uzyskano dostęp
  inheritanceChain: string[]; // Łańcuch dziedziczenia uprawnień
  directAccess: boolean; // Czy ma bezpośredni dostęp
  reason: string;
  expiresAt?: Date; // Jeśli dostęp ma ograniczenie czasowe
}

export interface StreamWithAccessInfo extends Stream {
  accessLevel: AccessResult['accessLevel'];
  grantedScopes: DataScope[];
  accessVia: string | null;
  isDirectAccess: boolean;
}

export interface PermissionCache {
  userId: string;
  streamId: string;
  dataScope: DataScope;
  action: string;
  result: AccessResult;
  cachedAt: Date;
  expiresAt: Date;
}

export class StreamAccessControlService {
  private permissionCache = new Map<string, PermissionCache>();
  private cacheExpiryMinutes = 15; // Cache na 15 minut

  /**
   * Sprawdza bezpośredni dostęp użytkownika do strumienia
   */
  async checkDirectAccess(
    userId: string, 
    streamId: string, 
    dataScope: DataScope, 
    action: string
  ): Promise<AccessResult> {
    const input = AccessCheckDto.parse({ userId, streamId, dataScope, action });
    
    // Sprawdź cache
    const cacheKey = `${userId}-${streamId}-${dataScope}-${action}`;
    const cached = this.permissionCache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached.result;
    }

    // Sprawdź czy użytkownik jest twórcą strumienia
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { createdById: true, organizationId: true }
    });

    if (!stream) {
      const result: AccessResult = {
        hasAccess: false,
        accessLevel: 'NO_ACCESS',
        grantedScopes: [],
        deniedScopes: [dataScope],
        via: null,
        inheritanceChain: [],
        directAccess: false,
        reason: 'Stream not found'
      };
      this.cacheResult(cacheKey, input.userId, input.streamId, input.dataScope, input.action, result);
      return result;
    }

    // Twórca strumienia ma pełny dostęp
    if (stream.createdById === userId) {
      const result: AccessResult = {
        hasAccess: true,
        accessLevel: 'FULL_CONTROL',
        grantedScopes: Object.values(DataScope),
        deniedScopes: [],
        via: null,
        inheritanceChain: [],
        directAccess: true,
        reason: 'Stream creator has full access'
      };
      this.cacheResult(cacheKey, input.userId, input.streamId, input.dataScope, input.action, result);
      return result;
    }

    // Sprawdź uprawnienia organizacyjne (placeholder - można rozwinąć)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true }
    });

    if (!user || user.organizationId !== stream.organizationId) {
      const result: AccessResult = {
        hasAccess: false,
        accessLevel: 'NO_ACCESS',
        grantedScopes: [],
        deniedScopes: [dataScope],
        via: null,
        inheritanceChain: [],
        directAccess: false,
        reason: 'User not in same organization'
      };
      this.cacheResult(cacheKey, input.userId, input.streamId, input.dataScope, input.action, result);
      return result;
    }

    // Admin organizacji ma pełny dostęp
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      const result: AccessResult = {
        hasAccess: true,
        accessLevel: 'FULL_CONTROL',
        grantedScopes: Object.values(DataScope),
        deniedScopes: [],
        via: null,
        inheritanceChain: [],
        directAccess: true,
        reason: 'Organization admin has full access'
      };
      this.cacheResult(cacheKey, input.userId, input.streamId, input.dataScope, input.action, result);
      return result;
    }

    // Brak bezpośredniego dostępu
    const result: AccessResult = {
      hasAccess: false,
      accessLevel: 'NO_ACCESS',
      grantedScopes: [],
      deniedScopes: [dataScope],
      via: null,
      inheritanceChain: [],
      directAccess: false,
      reason: 'No direct access found'
    };
    this.cacheResult(cacheKey, input.userId, input.streamId, input.dataScope, input.action, result);
    return result;
  }

  /**
   * Sprawdza dostęp przez relacje hierarchiczne
   */
  async checkRelationalAccess(
    userId: string, 
    targetStreamId: string, 
    dataScope: DataScope, 
    action: string
  ): Promise<AccessResult> {
    const input = AccessCheckDto.parse({ userId, streamId: targetStreamId, dataScope, action });
    
    // Sprawdź bezpośredni dostęp najpierw
    const directAccess = await this.checkDirectAccess(userId, targetStreamId, dataScope, action);
    if (directAccess.hasAccess) {
      return directAccess;
    }

    // Znajdź strumienie do których użytkownik ma bezpośredni dostęp
    const userAccessibleStreams = await this.getUserDirectStreams(userId);
    if (userAccessibleStreams.length === 0) {
      return directAccess; // Brak dostępu
    }

    // Sprawdź każdy dostępny strumień czy ma relację z target stream
    for (const accessibleStream of userAccessibleStreams) {
      const accessPath = await this.findAccessPath(
        accessibleStream.id, 
        targetStreamId, 
        dataScope, 
        action
      );
      
      if (accessPath.hasAccess) {
        return {
          ...accessPath,
          reason: `Access via stream ${accessibleStream.name}: ${accessPath.reason}`
        };
      }
    }

    return {
      hasAccess: false,
      accessLevel: 'NO_ACCESS',
      grantedScopes: [],
      deniedScopes: [dataScope],
      via: null,
      inheritanceChain: [],
      directAccess: false,
      reason: 'No relational access found'
    };
  }

  /**
   * Pobiera wszystkie strumienie dostępne dla użytkownika przez relacje
   */
  async getAccessibleRelatedStreams(
    userId: string, 
    streamId: string, 
    filters?: AccessFilters
  ): Promise<StreamWithAccessInfo[]> {
    const validatedFilters = AccessFiltersDto.parse(filters || {});
    
    // Sprawdź czy ma dostęp do bazowego strumienia
    const baseAccess = await this.checkDirectAccess(userId, streamId, DataScope.BASIC_INFO, 'read');
    if (!baseAccess.hasAccess) {
      return [];
    }

    // Pobierz wszystkie relacje z tego strumienia
    const relations = await prisma.streamRelation.findMany({
      where: {
        OR: [
          { parentId: streamId },
          { childId: streamId }
        ],
        isActive: true,
        ...(validatedFilters.relationType && { relationType: validatedFilters.relationType })
      },
      include: {
        parent: true,
        child: true,
        permissions: validatedFilters.dataScope ? {
          where: { dataScope: validatedFilters.dataScope }
        } : true
      }
    });

    const accessibleStreams: StreamWithAccessInfo[] = [];

    for (const relation of relations) {
      // Określ który strumień jest powiązany (nie base stream)
      const relatedStream = relation.parentId === streamId ? relation.child : relation.parent;
      const isParentRelation = relation.parentId === streamId;

      // Sprawdź dostęp do powiązanego strumienia
      const accessResult = await this.evaluateRelationAccess(
        relation, 
        isParentRelation, 
        validatedFilters.dataScope || DataScope.BASIC_INFO,
        'read'
      );

      if (accessResult.hasAccess) {
        accessibleStreams.push({
          ...relatedStream,
          accessLevel: accessResult.accessLevel,
          grantedScopes: accessResult.grantedScopes,
          accessVia: relation.id,
          isDirectAccess: false
        });
      }
    }

    return accessibleStreams;
  }

  /**
   * Pobiera wszystkie strumienie dostępne dla użytkownika
   */
  async getUserAccessibleStreams(userId: string, filters?: AccessFilters): Promise<Stream[]> {
    const validatedFilters = AccessFiltersDto.parse(filters || {});
    
    // Pobierz strumienie utworzone przez użytkownika
    const ownedStreams = await prisma.stream.findMany({
      where: { createdById: userId }
    });

    // Pobierz strumienie dostępne przez relacje
    const accessibleStreams: Stream[] = [...ownedStreams];
    
    for (const ownedStream of ownedStreams) {
      const relatedStreams = await this.getAccessibleRelatedStreams(
        userId, 
        ownedStream.id, 
        validatedFilters
      );
      
      accessibleStreams.push(...relatedStreams);
    }

    // Usuń duplikaty
    const uniqueStreams = accessibleStreams.filter(
      (stream, index, self) => index === self.findIndex(s => s.id === stream.id)
    );

    return uniqueStreams;
  }

  /**
   * Loguje dostęp do strumienia (dla audytu)
   */
  async logAccess(
    userId: string, 
    streamId: string, 
    action: string, 
    dataScope: DataScope, 
    granted: boolean,
    via?: string,
    relationId?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });

    if (!user) return;

    // Pobierz informacje o request (można rozszerzyć)
    const ipAddress = '127.0.0.1'; // TODO: Pobierz z req
    const userAgent = 'Unknown'; // TODO: Pobierz z req
    const endpoint = '/api/stream-access'; // TODO: Pobierz z req

    await prisma.streamAccessLog.create({
      data: {
        userId,
        streamId,
        action,
        accessType: via ? 'RELATION_BASED' : 'DIRECT',
        relationId,
        success: granted,
        dataScope: [dataScope],
        ipAddress,
        userAgent,
        requestPath: endpoint,
        organizationId: user.organizationId
      }
    });
  }

  /**
   * Pobiera logi dostępu dla strumienia
   */
  async getStreamAccessLogs(
    streamId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    return await prisma.streamAccessLog.findMany({
      where: { streamId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { accessedAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Czyści przestarzały cache
   */
  clearExpiredCache(): void {
    const now = new Date();
    for (const [key, cached] of this.permissionCache.entries()) {
      if (cached.expiresAt <= now) {
        this.permissionCache.delete(key);
      }
    }
  }

  /**
   * Czyści cały cache uprawnień
   */
  clearAllCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Czyści cache dla konkretnego użytkownika
   */
  clearUserCache(userId: string): void {
    for (const [key, cached] of this.permissionCache.entries()) {
      if (cached.userId === userId) {
        this.permissionCache.delete(key);
      }
    }
  }

  // === PRIVATE METHODS ===

  /**
   * Cache'uje wynik sprawdzenia uprawnień
   */
  private cacheResult(
    cacheKey: string,
    userId: string,
    streamId: string,
    dataScope: DataScope,
    action: string,
    result: AccessResult
  ): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.cacheExpiryMinutes * 60 * 1000);
    
    this.permissionCache.set(cacheKey, {
      userId,
      streamId,
      dataScope,
      action,
      result,
      cachedAt: now,
      expiresAt
    });
  }

  /**
   * Pobiera strumienie do których użytkownik ma bezpośredni dostęp
   */
  private async getUserDirectStreams(userId: string): Promise<Stream[]> {
    return await prisma.stream.findMany({
      where: {
        OR: [
          { createdById: userId },
          // TODO: Dodaj inne warunki bezpośredniego dostępu
        ]
      }
    });
  }

  /**
   * Znajdź ścieżkę dostępu między strumieniami
   */
  private async findAccessPath(
    fromStreamId: string,
    toStreamId: string,
    dataScope: DataScope,
    action: string,
    visited: Set<string> = new Set(),
    depth: number = 0,
    maxDepth: number = 5
  ): Promise<AccessResult> {
    if (depth >= maxDepth || visited.has(fromStreamId)) {
      return {
        hasAccess: false,
        accessLevel: 'NO_ACCESS',
        grantedScopes: [],
        deniedScopes: [dataScope],
        via: null,
        inheritanceChain: [],
        directAccess: false,
        reason: 'Max depth reached or cycle detected'
      };
    }

    visited.add(fromStreamId);

    // Sprawdź bezpośrednią relację
    const directRelation = await prisma.streamRelation.findFirst({
      where: {
        OR: [
          { parentId: fromStreamId, childId: toStreamId },
          { parentId: toStreamId, childId: fromStreamId }
        ],
        isActive: true
      },
      include: { permissions: true }
    });

    if (directRelation) {
      const isParentRelation = directRelation.parentId === fromStreamId;
      const accessResult = await this.evaluateRelationAccess(directRelation, isParentRelation, dataScope, action);
      
      if (accessResult.hasAccess) {
        return {
          ...accessResult,
          via: directRelation.id,
          inheritanceChain: [fromStreamId, toStreamId],
          reason: `Direct relation ${directRelation.relationType}`
        };
      }
    }

    // Sprawdź pośrednie relacje
    const intermediateRelations = await prisma.streamRelation.findMany({
      where: {
        OR: [
          { parentId: fromStreamId },
          { childId: fromStreamId }
        ],
        isActive: true
      },
      include: { permissions: true }
    });

    for (const relation of intermediateRelations) {
      const nextStreamId = relation.parentId === fromStreamId ? relation.childId : relation.parentId;
      
      if (nextStreamId === toStreamId) continue; // Unikaj bezpośrednich połączeń (już sprawdzone)
      
      const indirectAccess = await this.findAccessPath(
        nextStreamId,
        toStreamId,
        dataScope,
        action,
        new Set(visited),
        depth + 1,
        maxDepth
      );

      if (indirectAccess.hasAccess) {
        const isParentRelation = relation.parentId === fromStreamId;
        const relationAccess = await this.evaluateRelationAccess(relation, isParentRelation, dataScope, action);
        
        if (relationAccess.hasAccess) {
          return {
            ...indirectAccess,
            inheritanceChain: [fromStreamId, ...indirectAccess.inheritanceChain],
            reason: `Indirect access via ${relation.relationType}: ${indirectAccess.reason}`
          };
        }
      }
    }

    return {
      hasAccess: false,
      accessLevel: 'NO_ACCESS',
      grantedScopes: [],
      deniedScopes: [dataScope],
      via: null,
      inheritanceChain: [],
      directAccess: false,
      reason: 'No access path found'
    };
  }

  /**
   * Ocenia dostęp przez konkretną relację
   */
  private async evaluateRelationAccess(
    relation: StreamRelation & { permissions: StreamPermission[] },
    isParentRelation: boolean,
    dataScope: DataScope,
    action: string
  ): Promise<AccessResult> {
    // Sprawdź czy relacja daje dostęp w danym kierunku
    const inheritanceRule = relation.inheritanceRule;
    const canInherit = this.canInheritAccess(inheritanceRule, isParentRelation);
    
    if (!canInherit) {
      return {
        hasAccess: false,
        accessLevel: 'NO_ACCESS',
        grantedScopes: [],
        deniedScopes: [dataScope],
        via: relation.id,
        inheritanceChain: [],
        directAccess: false,
        reason: `Inheritance not allowed (${inheritanceRule})`
      };
    }

    // Sprawdź konkretne uprawnienia
    const relevantPermissions = relation.permissions.filter(
      p => p.dataScope === dataScope || p.dataScope === DataScope.ALL
    );

    if (relevantPermissions.length === 0) {
      // Brak konkretnych uprawnień - użyj domyślnych na podstawie typu relacji
      const defaultAccess = this.getDefaultAccessForRelationType(relation.relationType, dataScope, action);
      return {
        ...defaultAccess,
        via: relation.id,
        reason: `Default access for ${relation.relationType}`
      };
    }

    // Sprawdź konkretne uprawnienia
    const grantedPermissions = relevantPermissions.filter(p => p.granted && p.action === action);
    const deniedPermissions = relevantPermissions.filter(p => !p.granted && p.action === action);

    // Denied ma pierwszeństwo
    if (deniedPermissions.length > 0) {
      return {
        hasAccess: false,
        accessLevel: 'NO_ACCESS',
        grantedScopes: [],
        deniedScopes: [dataScope],
        via: relation.id,
        inheritanceChain: [],
        directAccess: false,
        reason: 'Explicitly denied permission'
      };
    }

    if (grantedPermissions.length > 0) {
      const accessLevel = this.getAccessLevelForRelationType(relation.relationType);
      return {
        hasAccess: true,
        accessLevel,
        grantedScopes: [dataScope],
        deniedScopes: [],
        via: relation.id,
        inheritanceChain: [],
        directAccess: false,
        reason: 'Explicitly granted permission'
      };
    }

    return {
      hasAccess: false,
      accessLevel: 'NO_ACCESS',
      grantedScopes: [],
      deniedScopes: [dataScope],
      via: relation.id,
      inheritanceChain: [],
      directAccess: false,
      reason: 'No matching permissions found'
    };
  }

  /**
   * Sprawdza czy można dziedziczyć dostęp w danym kierunku
   */
  private canInheritAccess(inheritanceRule: InheritanceRule, isParentRelation: boolean): boolean {
    switch (inheritanceRule) {
      case InheritanceRule.NO_INHERITANCE:
        return false;
      case InheritanceRule.INHERIT_DOWN:
        return isParentRelation; // Od rodzica do dziecka
      case InheritanceRule.INHERIT_UP:
        return !isParentRelation; // Od dziecka do rodzica
      case InheritanceRule.INHERIT_BIDIRECTIONAL:
        return true; // W obie strony
      default:
        return false;
    }
  }

  /**
   * Zwraca domyślny dostęp dla typu relacji
   */
  private getDefaultAccessForRelationType(
    relationType: StreamRelationType,
    dataScope: DataScope,
    action: string
  ): Omit<AccessResult, 'via' | 'reason'> {
    const baseResult = {
      inheritanceChain: [],
      directAccess: false
    };

    switch (relationType) {
      case StreamRelationType.OWNS:
        return {
          hasAccess: true,
          accessLevel: 'FULL_CONTROL',
          grantedScopes: Object.values(DataScope),
          deniedScopes: [],
          ...baseResult
        };
      
      case StreamRelationType.MANAGES:
        const managerScopes = [DataScope.BASIC_INFO, DataScope.TASKS, DataScope.PROJECTS, DataScope.COMMUNICATION];
        return {
          hasAccess: managerScopes.includes(dataScope),
          accessLevel: 'MANAGER',
          grantedScopes: managerScopes,
          deniedScopes: [DataScope.FINANCIAL, DataScope.PERMISSIONS],
          ...baseResult
        };
      
      case StreamRelationType.BELONGS_TO:
        const memberScopes = [DataScope.BASIC_INFO, DataScope.TASKS];
        return {
          hasAccess: memberScopes.includes(dataScope) && ['read', 'CREATE'].includes(action),
          accessLevel: 'CONTRIBUTOR',
          grantedScopes: memberScopes,
          deniedScopes: [DataScope.FINANCIAL, DataScope.PERMISSIONS, DataScope.CONFIGURATION],
          ...baseResult
        };
      
      case StreamRelationType.RELATED_TO:
        return {
          hasAccess: dataScope === DataScope.BASIC_INFO && action === 'read',
          accessLevel: 'READ_ONLY',
          grantedScopes: [DataScope.BASIC_INFO],
          deniedScopes: Object.values(DataScope).filter(s => s !== DataScope.BASIC_INFO),
          ...baseResult
        };
      
      case StreamRelationType.DEPENDS_ON:
        const dependencyScopes = [DataScope.BASIC_INFO, DataScope.TASKS, DataScope.PROJECTS];
        return {
          hasAccess: dependencyScopes.includes(dataScope) && action === 'read',
          accessLevel: 'READ_ONLY',
          grantedScopes: dependencyScopes,
          deniedScopes: [DataScope.FINANCIAL, DataScope.PERMISSIONS, DataScope.CONFIGURATION],
          ...baseResult
        };
      
      case StreamRelationType.SUPPORTS:
        const supportScopes = [DataScope.BASIC_INFO, DataScope.COMMUNICATION];
        return {
          hasAccess: supportScopes.includes(dataScope),
          accessLevel: 'LIMITED',
          grantedScopes: supportScopes,
          deniedScopes: [DataScope.FINANCIAL, DataScope.PERMISSIONS],
          ...baseResult
        };
      
      default:
        return {
          hasAccess: false,
          accessLevel: 'NO_ACCESS',
          grantedScopes: [],
          deniedScopes: Object.values(DataScope),
          ...baseResult
        };
    }
  }

  /**
   * Mapuje typ relacji na poziom dostępu
   */
  private getAccessLevelForRelationType(relationType: StreamRelationType): AccessResult['accessLevel'] {
    switch (relationType) {
      case StreamRelationType.OWNS:
        return 'FULL_CONTROL';
      case StreamRelationType.MANAGES:
        return 'MANAGER';
      case StreamRelationType.BELONGS_TO:
        return 'CONTRIBUTOR';
      case StreamRelationType.RELATED_TO:
        return 'READ_ONLY';
      case StreamRelationType.DEPENDS_ON:
        return 'READ_ONLY';
      case StreamRelationType.SUPPORTS:
        return 'LIMITED';
      default:
        return 'NO_ACCESS';
    }
  }
}

export default new StreamAccessControlService();