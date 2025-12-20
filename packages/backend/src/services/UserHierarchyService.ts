import { PrismaClient, UserDataScope, UserRelationType, UserInheritanceRule, User, UserRelation, UserPermission, UserAction, UserAccessType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// DTOs for user hierarchy
export const CreateUserRelationDto = z.object({
  managerId: z.string().uuid(),
  employeeId: z.string().uuid(),
  relationType: z.enum(['MANAGES', 'LEADS', 'SUPERVISES', 'MENTORS', 'COLLABORATES', 'SUPPORTS', 'REPORTS_TO']),
  description: z.string().optional(),
  inheritanceRule: z.enum(['NO_INHERITANCE', 'INHERIT_DOWN', 'INHERIT_UP', 'INHERIT_BIDIRECTIONAL']).default('INHERIT_DOWN'),
  canDelegate: z.boolean().default(true),
  canApprove: z.boolean().default(false),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional()
});

export const UserAccessCheckDto = z.object({
  userId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  dataScope: z.enum(['PROFILE', 'TASKS', 'PROJECTS', 'SCHEDULE', 'PERFORMANCE', 'DOCUMENTS', 'COMMUNICATION', 'SETTINGS', 'TEAM_DATA', 'REPORTS', 'ALL']),
  action: z.enum(['VIEW', 'EDIT', 'CREATE', 'DELETE', 'ASSIGN', 'APPROVE', 'DELEGATE', 'MANAGE', 'AUDIT']),
  organizationId: z.string().uuid().optional()
});

export const HierarchyQueryDto = z.object({
  direction: z.enum(['up', 'down', 'both']).default('both'),
  depth: z.number().int().min(1).max(10).default(3),
  includePermissions: z.boolean().default(false),
  includeInactive: z.boolean().default(false)
});

export type CreateUserRelationInput = z.infer<typeof CreateUserRelationDto>;
export type UserAccessCheckInput = z.infer<typeof UserAccessCheckDto>;
export type HierarchyQuery = z.infer<typeof HierarchyQueryDto>;

// Extended types for user hierarchy
export interface UserAccessResult {
  hasAccess: boolean;
  accessLevel: 'NO_ACCESS' | 'VIEW_ONLY' | 'LIMITED' | 'STANDARD' | 'ELEVATED' | 'MANAGER' | 'ADMIN' | 'FULL_CONTROL';
  grantedScopes: UserDataScope[];
  deniedScopes: UserDataScope[];
  via: string | null; // ID relacji przez którą uzyskano dostęp
  inheritanceChain: string[]; // Łańcuch dziedziczenia uprawnień
  directAccess: boolean; // Czy ma bezpośredni dostęp
  reason: string;
  expiresAt?: Date; // Jeśli dostęp ma ograniczenie czasowe
}

export interface UserWithHierarchy extends User {
  managerRelations: (UserRelation & { manager: UserWithHierarchy; permissions: UserPermission[] })[];
  employeeRelations: (UserRelation & { employee: UserWithHierarchy; permissions: UserPermission[] })[];
}

export interface UserHierarchyTree {
  user: UserWithHierarchy;
  managers: UserWithHierarchy[];
  employees: UserWithHierarchy[];
  depth: number;
  totalRelations: number;
  hasCycles: boolean;
}

export interface HierarchyStats {
  totalRelations: number;
  activeRelations: number;
  inactiveRelations: number;
  relationsByType: Record<string, number>;
  usersWithHierarchy: number;
  hierarchyPenetration: number;
  averageTeamSize: number;
  maxDepth: number;
}

export class UserHierarchyService {
  private permissionCache = new Map<string, UserAccessResult & { cachedAt: Date; expiresAt: Date }>();
  private cacheExpiryMinutes = 15; // Cache na 15 minut

  /**
   * Tworzy nową relację hierarchiczną między użytkownikami
   */
  async createRelation(data: CreateUserRelationInput, createdById: string): Promise<UserRelation> {
    const input = CreateUserRelationDto.parse(data);
    
    // Sprawdź czy użytkownicy istnieją i są w tej samej organizacji
    const [manager, employee] = await Promise.all([
      prisma.user.findUnique({ where: { id: input.managerId }, select: { id: true, organizationId: true } }),
      prisma.user.findUnique({ where: { id: input.employeeId }, select: { id: true, organizationId: true } })
    ]);

    if (!manager || !employee) {
      throw new Error('Manager or employee not found');
    }

    if (manager.organizationId !== employee.organizationId) {
      throw new Error('Manager and employee must be in the same organization');
    }

    // Sprawdź czy relacja już istnieje
    const existingRelation = await prisma.userRelation.findFirst({
      where: {
        managerId: input.managerId,
        employeeId: input.employeeId,
        relationType: input.relationType,
        isActive: true
      }
    });

    if (existingRelation) {
      throw new Error('Relation already exists');
    }

    // Sprawdź czy nie powstanie cykl
    const wouldCreateCycle = await this.checkForCycle(input.managerId, input.employeeId);
    if (wouldCreateCycle) {
      throw new Error('Creating this relation would create a cycle');
    }

    // Utwórz relację
    const relation = await prisma.userRelation.create({
      data: {
        ...input,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        createdById,
        organizationId: manager.organizationId
      },
      include: {
        manager: true,
        employee: true,
        permissions: true
      }
    });

    // Wyczyść cache uprawnień
    this.clearUserCache(input.managerId);
    this.clearUserCache(input.employeeId);

    return relation;
  }

  /**
   * Pobiera hierarchię użytkownika
   */
  async getUserHierarchy(userId: string, params: HierarchyQuery = {}): Promise<UserHierarchyTree> {
    const query = HierarchyQueryDto.parse(params);
    
    // Pobierz użytkownika z relacjami
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        managerRelations: {
          where: { isActive: query.includeInactive ? undefined : true },
          include: {
            manager: true,
            permissions: query.includePermissions
          }
        },
        employeeRelations: {
          where: { isActive: query.includeInactive ? undefined : true },
          include: {
            employee: true,
            permissions: query.includePermissions
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Pobierz managerów (w górę hierarchii)
    const managers = query.direction !== 'down' 
      ? await this.getHierarchyUpwards(userId, query.depth, query.includeInactive)
      : [];

    // Pobierz employees (w dół hierarchii)
    const employees = query.direction !== 'up'
      ? await this.getHierarchyDownwards(userId, query.depth, query.includeInactive)
      : [];

    // Sprawdź cykle
    const hasCycles = await this.detectCycles(userId);

    return {
      user: user as UserWithHierarchy,
      managers,
      employees,
      depth: query.depth,
      totalRelations: user.managerRelations.length + user.employeeRelations.length,
      hasCycles
    };
  }

  /**
   * Sprawdza uprawnienia użytkownika do innego użytkownika
   */
  async checkUserAccess(input: UserAccessCheckInput): Promise<UserAccessResult> {
    const { userId, targetUserId, dataScope, action } = UserAccessCheckDto.parse(input);
    
    // Sprawdź cache
    const cacheKey = `${userId}-${targetUserId}-${dataScope}-${action}`;
    const cached = this.permissionCache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }

    // Sprawdź czy to ten sam użytkownik (samodostęp)
    if (userId === targetUserId) {
      const result: UserAccessResult = {
        hasAccess: true,
        accessLevel: 'FULL_CONTROL',
        grantedScopes: Object.values(UserDataScope),
        deniedScopes: [],
        via: null,
        inheritanceChain: [],
        directAccess: true,
        reason: 'Self-access'
      };
      this.cacheResult(cacheKey, result);
      return result;
    }

    // Sprawdź bezpośredni dostęp przez role
    const directAccess = await this.checkDirectAccess(userId, targetUserId, dataScope, action);
    if (directAccess.hasAccess) {
      this.cacheResult(cacheKey, directAccess);
      return directAccess;
    }

    // Sprawdź dostęp przez hierarchię
    const hierarchyAccess = await this.checkHierarchyAccess(userId, targetUserId, dataScope, action);
    this.cacheResult(cacheKey, hierarchyAccess);
    
    return hierarchyAccess;
  }

  /**
   * Pobiera użytkowników zarządzanych przez użytkownika
   */
  async getManagedUsers(managerId: string, params: HierarchyQuery = {}): Promise<UserWithHierarchy[]> {
    const query = HierarchyQueryDto.parse(params);
    
    return await this.getHierarchyDownwards(managerId, query.depth, query.includeInactive);
  }

  /**
   * Pobiera managerów użytkownika
   */
  async getUserManagers(employeeId: string, params: HierarchyQuery = {}): Promise<UserWithHierarchy[]> {
    const query = HierarchyQueryDto.parse(params);
    
    return await this.getHierarchyUpwards(employeeId, query.depth, query.includeInactive);
  }

  /**
   * Usuwa relację hierarchiczną
   */
  async deleteRelation(relationId: string, userId: string): Promise<void> {
    const relation = await prisma.userRelation.findUnique({
      where: { id: relationId },
      select: { managerId: true, employeeId: true, organizationId: true }
    });

    if (!relation) {
      throw new Error('Relation not found');
    }

    // Sprawdź uprawnienia
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true }
    });

    if (!user || user.organizationId !== relation.organizationId) {
      throw new Error('Access denied');
    }

    // Admin/Owner może usuwać wszystkie relacje, inni tylko swoje
    if (user.role !== 'ADMIN' && user.role !== 'OWNER' && 
        userId !== relation.managerId && userId !== relation.employeeId) {
      throw new Error('Access denied');
    }

    await prisma.userRelation.delete({
      where: { id: relationId }
    });

    // Wyczyść cache
    this.clearUserCache(relation.managerId);
    this.clearUserCache(relation.employeeId);
  }

  /**
   * Pobiera statystyki hierarchii dla organizacji
   */
  async getHierarchyStats(organizationId: string): Promise<HierarchyStats> {
    const [
      totalRelations,
      activeRelations,
      relationsByType,
      usersCount,
      usersWithHierarchy
    ] = await Promise.all([
      prisma.userRelation.count({ where: { organizationId } }),
      prisma.userRelation.count({ where: { organizationId, isActive: true } }),
      prisma.userRelation.groupBy({
        by: ['relationType'],
        where: { organizationId, isActive: true },
        _count: true
      }),
      prisma.user.count({ where: { organizationId } }),
      prisma.user.count({
        where: {
          organizationId,
          OR: [
            { managerRelations: { some: { isActive: true } } },
            { employeeRelations: { some: { isActive: true } } }
          ]
        }
      })
    ]);

    const relationsByTypeMap = relationsByType.reduce((acc, item) => {
      acc[item.relationType] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRelations,
      activeRelations,
      inactiveRelations: totalRelations - activeRelations,
      relationsByType: relationsByTypeMap,
      usersWithHierarchy,
      hierarchyPenetration: usersCount > 0 ? (usersWithHierarchy / usersCount) * 100 : 0,
      averageTeamSize: usersWithHierarchy > 0 ? activeRelations / usersWithHierarchy : 0,
      maxDepth: await this.calculateMaxDepth(organizationId)
    };
  }

  /**
   * Loguje dostęp użytkownika (dla audytu)
   */
  async logAccess(
    userId: string,
    targetUserId: string,
    action: string,
    dataScope: UserDataScope,
    success: boolean,
    accessType: UserAccessType = UserAccessType.DIRECT,
    relationId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestPath?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });

    if (!user) return;

    await prisma.userAccessLog.create({
      data: {
        userId,
        targetUserId,
        relationId,
        action,
        accessType,
        success,
        dataScope: [dataScope],
        ipAddress,
        userAgent,
        requestPath,
        organizationId: user.organizationId
      }
    });
  }

  // === PRIVATE METHODS ===

  /**
   * Sprawdza bezpośredni dostęp przez role użytkownika
   */
  private async checkDirectAccess(
    userId: string,
    targetUserId: string,
    dataScope: UserDataScope,
    action: UserAction
  ): Promise<UserAccessResult> {
    const [user, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, organizationId: true }
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { organizationId: true }
      })
    ]);

    if (!user || !targetUser) {
      return {
        hasAccess: false,
        accessLevel: 'NO_ACCESS',
        grantedScopes: [],
        deniedScopes: [dataScope],
        via: null,
        inheritanceChain: [],
        directAccess: false,
        reason: 'User not found'
      };
    }

    if (user.organizationId !== targetUser.organizationId) {
      return {
        hasAccess: false,
        accessLevel: 'NO_ACCESS',
        grantedScopes: [],
        deniedScopes: [dataScope],
        via: null,
        inheritanceChain: [],
        directAccess: false,
        reason: 'Different organizations'
      };
    }

    // Admin/Owner ma pełny dostęp
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      return {
        hasAccess: true,
        accessLevel: 'FULL_CONTROL',
        grantedScopes: Object.values(UserDataScope),
        deniedScopes: [],
        via: null,
        inheritanceChain: [],
        directAccess: true,
        reason: 'Administrative access'
      };
    }

    // Manager ma ograniczony dostęp
    if (user.role === 'MANAGER') {
      const managerScopes = [UserDataScope.PROFILE, UserDataScope.TASKS, UserDataScope.PROJECTS, UserDataScope.SCHEDULE];
      return {
        hasAccess: managerScopes.includes(dataScope),
        accessLevel: 'MANAGER',
        grantedScopes: managerScopes,
        deniedScopes: [UserDataScope.PERFORMANCE, UserDataScope.SETTINGS],
        via: null,
        inheritanceChain: [],
        directAccess: true,
        reason: 'Manager role access'
      };
    }

    // Member ma bardzo ograniczony dostęp
    return {
      hasAccess: dataScope === UserDataScope.PROFILE && action === UserAction.VIEW,
      accessLevel: 'VIEW_ONLY',
      grantedScopes: [UserDataScope.PROFILE],
      deniedScopes: [UserDataScope.TASKS, UserDataScope.PROJECTS, UserDataScope.PERFORMANCE],
      via: null,
      inheritanceChain: [],
      directAccess: true,
      reason: 'Member role access'
    };
  }

  /**
   * Sprawdza dostęp przez hierarchię użytkowników
   */
  private async checkHierarchyAccess(
    userId: string,
    targetUserId: string,
    dataScope: UserDataScope,
    action: UserAction
  ): Promise<UserAccessResult> {
    // Znajdź relacje między użytkownikami
    const relations = await prisma.userRelation.findMany({
      where: {
        OR: [
          { managerId: userId, employeeId: targetUserId },
          { managerId: targetUserId, employeeId: userId }
        ],
        isActive: true
      },
      include: { permissions: true }
    });

    for (const relation of relations) {
      const isManager = relation.managerId === userId;
      const accessResult = await this.evaluateRelationAccess(relation, isManager, dataScope, action);
      
      if (accessResult.hasAccess) {
        return {
          ...accessResult,
          via: relation.id,
          reason: `Access via ${relation.relationType} relation`
        };
      }
    }

    // Sprawdź pośredni dostęp przez łańcuch hierarchii
    const indirectAccess = await this.findHierarchyPath(userId, targetUserId, dataScope, action);
    return indirectAccess;
  }

  /**
   * Ocenia dostęp przez konkretną relację
   */
  private async evaluateRelationAccess(
    relation: UserRelation & { permissions: UserPermission[] },
    isManager: boolean,
    dataScope: UserDataScope,
    action: UserAction
  ): Promise<Omit<UserAccessResult, 'via' | 'reason'>> {
    // Sprawdź czy relacja pozwala na dziedziczenie uprawnień
    const canInherit = this.canInheritAccess(relation.inheritanceRule, isManager);
    
    if (!canInherit) {
      return {
        hasAccess: false,
        accessLevel: 'NO_ACCESS',
        grantedScopes: [],
        deniedScopes: [dataScope],
        inheritanceChain: [],
        directAccess: false
      };
    }

    // Sprawdź konkretne uprawnienia
    const relevantPermissions = relation.permissions.filter(
      p => (p.dataScope === dataScope || p.dataScope === UserDataScope.ALL) && p.action === action
    );

    // Jeśli są konkretne uprawnienia, użyj ich
    if (relevantPermissions.length > 0) {
      const denied = relevantPermissions.find(p => !p.granted);
      if (denied) {
        return {
          hasAccess: false,
          accessLevel: 'NO_ACCESS',
          grantedScopes: [],
          deniedScopes: [dataScope],
          inheritanceChain: [],
          directAccess: false
        };
      }

      const granted = relevantPermissions.find(p => p.granted);
      if (granted) {
        return {
          hasAccess: true,
          accessLevel: this.getAccessLevelForRelationType(relation.relationType),
          grantedScopes: [dataScope],
          deniedScopes: [],
          inheritanceChain: [],
          directAccess: false
        };
      }
    }

    // Użyj domyślnych uprawnień na podstawie typu relacji
    return this.getDefaultAccessForRelationType(relation.relationType, dataScope, action, isManager);
  }

  /**
   * Sprawdza czy można dziedziczyć dostęp w danym kierunku
   */
  private canInheritAccess(inheritanceRule: UserInheritanceRule, isManager: boolean): boolean {
    switch (inheritanceRule) {
      case UserInheritanceRule.NO_INHERITANCE:
        return false;
      case UserInheritanceRule.INHERIT_DOWN:
        return isManager; // Manager do employeeów
      case UserInheritanceRule.INHERIT_UP:
        return !isManager; // Employee do managera
      case UserInheritanceRule.INHERIT_BIDIRECTIONAL:
        return true; // W obie strony
      default:
        return false;
    }
  }

  /**
   * Zwraca domyślny dostęp dla typu relacji
   */
  private getDefaultAccessForRelationType(
    relationType: UserRelationType,
    dataScope: UserDataScope,
    action: UserAction,
    isManager: boolean
  ): Omit<UserAccessResult, 'via' | 'reason'> {
    const baseResult = {
      inheritanceChain: [],
      directAccess: false
    };

    switch (relationType) {
      case UserRelationType.MANAGES:
        if (isManager) {
          const managerScopes = [UserDataScope.PROFILE, UserDataScope.TASKS, UserDataScope.PROJECTS, UserDataScope.SCHEDULE, UserDataScope.PERFORMANCE];
          return {
            hasAccess: managerScopes.includes(dataScope),
            accessLevel: 'MANAGER',
            grantedScopes: managerScopes,
            deniedScopes: [UserDataScope.SETTINGS],
            ...baseResult
          };
        } else {
          return {
            hasAccess: dataScope === UserDataScope.PROFILE && action === UserAction.VIEW,
            accessLevel: 'VIEW_ONLY',
            grantedScopes: [UserDataScope.PROFILE],
            deniedScopes: [UserDataScope.TASKS, UserDataScope.PROJECTS],
            ...baseResult
          };
        }

      case UserRelationType.LEADS:
        const leadScopes = [UserDataScope.PROFILE, UserDataScope.TASKS, UserDataScope.PROJECTS];
        return {
          hasAccess: isManager && leadScopes.includes(dataScope),
          accessLevel: 'ELEVATED',
          grantedScopes: leadScopes,
          deniedScopes: [UserDataScope.PERFORMANCE, UserDataScope.SETTINGS],
          ...baseResult
        };

      case UserRelationType.COLLABORATES:
        const collabScopes = [UserDataScope.PROFILE, UserDataScope.TASKS, UserDataScope.PROJECTS];
        return {
          hasAccess: collabScopes.includes(dataScope) && [UserAction.VIEW, UserAction.EDIT].includes(action),
          accessLevel: 'STANDARD',
          grantedScopes: collabScopes,
          deniedScopes: [UserDataScope.PERFORMANCE, UserDataScope.SETTINGS],
          ...baseResult
        };

      default:
        return {
          hasAccess: dataScope === UserDataScope.PROFILE && action === UserAction.VIEW,
          accessLevel: 'VIEW_ONLY',
          grantedScopes: [UserDataScope.PROFILE],
          deniedScopes: Object.values(UserDataScope).filter(s => s !== UserDataScope.PROFILE),
          ...baseResult
        };
    }
  }

  /**
   * Mapuje typ relacji na poziom dostępu
   */
  private getAccessLevelForRelationType(relationType: UserRelationType): UserAccessResult['accessLevel'] {
    switch (relationType) {
      case UserRelationType.MANAGES:
        return 'MANAGER';
      case UserRelationType.LEADS:
        return 'ELEVATED';
      case UserRelationType.SUPERVISES:
        return 'ELEVATED';
      case UserRelationType.MENTORS:
        return 'STANDARD';
      case UserRelationType.COLLABORATES:
        return 'STANDARD';
      case UserRelationType.SUPPORTS:
        return 'LIMITED';
      default:
        return 'VIEW_ONLY';
    }
  }

  /**
   * Cache'uje wynik sprawdzenia uprawnień
   */
  private cacheResult(cacheKey: string, result: UserAccessResult): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.cacheExpiryMinutes * 60 * 1000);
    
    this.permissionCache.set(cacheKey, {
      ...result,
      cachedAt: now,
      expiresAt
    });
  }

  /**
   * Czyści cache dla konkretnego użytkownika
   */
  private clearUserCache(userId: string): void {
    for (const [key] of this.permissionCache.entries()) {
      if (key.includes(userId)) {
        this.permissionCache.delete(key);
      }
    }
  }

  /**
   * Pobiera hierarchię w górę (managerów) - rekurencyjnie
   */
  private async getHierarchyUpwards(
    userId: string,
    depth: number,
    includeInactive = false,
    visited = new Set<string>()
  ): Promise<UserWithHierarchy[]> {
    if (depth <= 0 || visited.has(userId)) {
      return [];
    }

    visited.add(userId);

    // Pobierz bezpośrednich managerów
    const managerRelations = await prisma.userRelation.findMany({
      where: {
        employeeId: userId,
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        manager: {
          include: {
            managerRelations: { where: { isActive: true } },
            employeeRelations: { where: { isActive: true } }
          }
        },
        permissions: true
      }
    });

    const managers: UserWithHierarchy[] = [];

    for (const relation of managerRelations) {
      const manager = relation.manager as UserWithHierarchy;
      manager.managerRelations = [];
      manager.employeeRelations = [];
      managers.push(manager);

      // Rekurencyjnie pobierz managerów managerów
      if (depth > 1) {
        const parentManagers = await this.getHierarchyUpwards(
          manager.id,
          depth - 1,
          includeInactive,
          visited
        );
        managers.push(...parentManagers);
      }
    }

    return managers;
  }

  /**
   * Pobiera hierarchię w dół (employees) - rekurencyjnie
   */
  private async getHierarchyDownwards(
    userId: string,
    depth: number,
    includeInactive = false,
    visited = new Set<string>()
  ): Promise<UserWithHierarchy[]> {
    if (depth <= 0 || visited.has(userId)) {
      return [];
    }

    visited.add(userId);

    // Pobierz bezpośrednich podwładnych
    const employeeRelations = await prisma.userRelation.findMany({
      where: {
        managerId: userId,
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        employee: {
          include: {
            managerRelations: { where: { isActive: true } },
            employeeRelations: { where: { isActive: true } }
          }
        },
        permissions: true
      }
    });

    const employees: UserWithHierarchy[] = [];

    for (const relation of employeeRelations) {
      const employee = relation.employee as UserWithHierarchy;
      employee.managerRelations = [];
      employee.employeeRelations = [];
      employees.push(employee);

      // Rekurencyjnie pobierz podwładnych podwładnych
      if (depth > 1) {
        const subordinates = await this.getHierarchyDownwards(
          employee.id,
          depth - 1,
          includeInactive,
          visited
        );
        employees.push(...subordinates);
      }
    }

    return employees;
  }

  /**
   * Sprawdza czy utworzenie relacji spowoduje cykl
   * Używa BFS do znalezienia ścieżki od employee do manager
   */
  private async checkForCycle(managerId: string, employeeId: string): Promise<boolean> {
    // Jeśli employee już jest managerem dla managera (bezpośrednio lub pośrednio),
    // to utworzenie relacji manager->employee utworzy cykl
    const visited = new Set<string>();
    const queue: string[] = [employeeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (currentId === managerId) {
        return true; // Znaleziono cykl
      }

      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      // Pobierz wszystkich podwładnych currentId
      const subordinates = await prisma.userRelation.findMany({
        where: {
          managerId: currentId,
          isActive: true
        },
        select: { employeeId: true }
      });

      for (const sub of subordinates) {
        if (!visited.has(sub.employeeId)) {
          queue.push(sub.employeeId);
        }
      }
    }

    return false;
  }

  /**
   * Wykrywa cykle w hierarchii użytkownika używając DFS
   */
  private async detectCycles(userId: string): Promise<boolean> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleFromNode = async (nodeId: string): Promise<boolean> => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      // Pobierz wszystkich podwładnych
      const subordinates = await prisma.userRelation.findMany({
        where: {
          managerId: nodeId,
          isActive: true
        },
        select: { employeeId: true }
      });

      for (const sub of subordinates) {
        if (!visited.has(sub.employeeId)) {
          if (await hasCycleFromNode(sub.employeeId)) {
            return true;
          }
        } else if (recursionStack.has(sub.employeeId)) {
          return true; // Znaleziono cykl
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    return await hasCycleFromNode(userId);
  }

  /**
   * Znajduje ścieżkę dostępu między użytkownikami przez hierarchię
   * Używa BFS do znalezienia najkrótszej ścieżki
   */
  private async findHierarchyPath(
    fromUserId: string,
    toUserId: string,
    dataScope: UserDataScope,
    action: UserAction
  ): Promise<UserAccessResult> {
    if (fromUserId === toUserId) {
      return {
        hasAccess: true,
        accessLevel: 'FULL_CONTROL',
        grantedScopes: Object.values(UserDataScope),
        deniedScopes: [],
        via: null,
        inheritanceChain: [],
        directAccess: true,
        reason: 'Self-access'
      };
    }

    // BFS do znalezienia ścieżki
    const visited = new Set<string>();
    const queue: { userId: string; path: string[]; viaRelationId: string | null }[] = [
      { userId: fromUserId, path: [fromUserId], viaRelationId: null }
    ];

    while (queue.length > 0) {
      const { userId, path, viaRelationId } = queue.shift()!;

      if (visited.has(userId)) continue;
      visited.add(userId);

      // Sprawdź relacje w dół (jako manager)
      const subordinateRelations = await prisma.userRelation.findMany({
        where: {
          managerId: userId,
          isActive: true,
          inheritanceRule: { not: UserInheritanceRule.NO_INHERITANCE }
        },
        include: { permissions: true }
      });

      for (const relation of subordinateRelations) {
        if (relation.employeeId === toUserId) {
          // Znaleziono ścieżkę!
          const accessResult = await this.evaluateRelationAccess(relation, true, dataScope, action);
          if (accessResult.hasAccess) {
            return {
              ...accessResult,
              via: viaRelationId || relation.id,
              inheritanceChain: [...path, toUserId],
              reason: `Hierarchical access via ${path.length} level(s)`
            };
          }
        }

        if (!visited.has(relation.employeeId)) {
          queue.push({
            userId: relation.employeeId,
            path: [...path, relation.employeeId],
            viaRelationId: viaRelationId || relation.id
          });
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
      reason: 'No hierarchy path found'
    };
  }

  /**
   * Oblicza maksymalną głębokość hierarchii w organizacji
   * Używa iteracyjnego BFS dla każdego root node
   */
  private async calculateMaxDepth(organizationId: string): Promise<number> {
    // Znajdź wszystkich userów bez managerów (root nodes)
    const allUsers = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true }
    });

    const usersWithManagers = await prisma.userRelation.findMany({
      where: {
        organizationId,
        isActive: true
      },
      select: { employeeId: true },
      distinct: ['employeeId']
    });

    const managedUserIds = new Set(usersWithManagers.map(r => r.employeeId));
    const rootUsers = allUsers.filter(u => !managedUserIds.has(u.id));

    let maxDepth = 0;

    for (const root of rootUsers) {
      const depth = await this.calculateDepthFromNode(root.id);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  /**
   * Oblicza głębokość hierarchii od danego node
   */
  private async calculateDepthFromNode(userId: string, visited = new Set<string>()): Promise<number> {
    if (visited.has(userId)) return 0;
    visited.add(userId);

    const subordinates = await prisma.userRelation.findMany({
      where: {
        managerId: userId,
        isActive: true
      },
      select: { employeeId: true }
    });

    if (subordinates.length === 0) {
      return 1;
    }

    let maxChildDepth = 0;
    for (const sub of subordinates) {
      const childDepth = await this.calculateDepthFromNode(sub.employeeId, visited);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return 1 + maxChildDepth;
  }
}

export default new UserHierarchyService();