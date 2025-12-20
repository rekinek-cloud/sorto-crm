import { apiClient } from './client';

// Types for user hierarchy
export interface UserRelation {
  id: string;
  managerId: string;
  employeeId: string;
  relationType: 'MANAGES' | 'LEADS' | 'SUPERVISES' | 'MENTORS' | 'COLLABORATES' | 'SUPPORTS' | 'REPORTS_TO';
  description?: string;
  isActive: boolean;
  inheritanceRule: 'NO_INHERITANCE' | 'INHERIT_DOWN' | 'INHERIT_UP' | 'INHERIT_BIDIRECTIONAL';
  canDelegate: boolean;
  canApprove: boolean;
  startsAt?: string;
  endsAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface UserPermission {
  id: string;
  relationId: string;
  dataScope: 'PROFILE' | 'TASKS' | 'PROJECTS' | 'SCHEDULE' | 'PERFORMANCE' | 'DOCUMENTS' | 'COMMUNICATION' | 'SETTINGS' | 'TEAM_DATA' | 'REPORTS' | 'ALL';
  action: 'VIEW' | 'EDIT' | 'CREATE' | 'DELETE' | 'ASSIGN' | 'APPROVE' | 'DELEGATE' | 'MANAGE' | 'AUDIT';
  granted: boolean;
  expiresAt?: string;
  grantedById?: string;
}

export interface UserWithHierarchy {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  managerRelations: (UserRelation & { employee: UserWithHierarchy; permissions: UserPermission[] })[];
  employeeRelations: (UserRelation & { manager: UserWithHierarchy; permissions: UserPermission[] })[];
}

export interface UserHierarchyTree {
  user: UserWithHierarchy;
  managers: UserWithHierarchy[];
  employees: UserWithHierarchy[];
  depth: number;
  totalRelations: number;
  hasCycles: boolean;
}

export interface UserAccessResult {
  hasAccess: boolean;
  accessLevel: 'NO_ACCESS' | 'VIEW_ONLY' | 'LIMITED' | 'STANDARD' | 'ELEVATED' | 'MANAGER' | 'ADMIN' | 'FULL_CONTROL';
  grantedScopes: UserPermission['dataScope'][];
  deniedScopes: UserPermission['dataScope'][];
  via: string | null;
  inheritanceChain: string[];
  directAccess: boolean;
  reason: string;
  expiresAt?: string;
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

export interface CreateUserRelationRequest {
  managerId: string;
  employeeId: string;
  relationType: UserRelation['relationType'];
  description?: string;
  inheritanceRule?: UserRelation['inheritanceRule'];
  canDelegate?: boolean;
  canApprove?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface HierarchyQueryParams {
  direction?: 'up' | 'down' | 'both';
  depth?: number;
  includePermissions?: boolean;
  includeInactive?: boolean;
}

export interface UserAccessCheckRequest {
  targetUserId: string;
  dataScope: UserPermission['dataScope'];
  action: UserPermission['action'];
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  includeInactive?: boolean;
}

export interface UsersListResponse {
  users: UserWithHierarchy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DelegationRequest {
  targetUserId: string;
  taskId?: string;
  projectId?: string;
  delegationType: 'TASK' | 'PROJECT' | 'AUTHORITY';
  instructions?: string;
}

export const userHierarchyApi = {
  // === HIERARCHY MANAGEMENT ===
  
  /**
   * Tworzy nową relację hierarchiczną między użytkownikami
   */
  async createRelation(data: CreateUserRelationRequest): Promise<UserRelation> {
    const response = await apiClient.post('/user-hierarchy/relations', data);
    return response.data.data;
  },

  /**
   * Pobiera hierarchię użytkownika
   */
  async getUserHierarchy(userId: string, params?: HierarchyQueryParams): Promise<UserHierarchyTree> {
    const queryParams = new URLSearchParams();
    if (params?.direction) queryParams.append('direction', params.direction);
    if (params?.depth) queryParams.append('depth', params.depth.toString());
    if (params?.includePermissions) queryParams.append('includePermissions', params.includePermissions.toString());
    if (params?.includeInactive) queryParams.append('includeInactive', params.includeInactive.toString());

    const url = `/user-hierarchy/${userId}/hierarchy${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    
    return response.data.data;
  },

  /**
   * Pobiera użytkowników zarządzanych przez użytkownika
   */
  async getManagedUsers(userId: string, params?: HierarchyQueryParams): Promise<UserWithHierarchy[]> {
    const queryParams = new URLSearchParams();
    if (params?.depth) queryParams.append('depth', params.depth.toString());
    if (params?.includePermissions) queryParams.append('includePermissions', params.includePermissions.toString());
    if (params?.includeInactive) queryParams.append('includeInactive', params.includeInactive.toString());

    const url = `/user-hierarchy/${userId}/managed-users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    return response.data.data;
  },

  /**
   * Pobiera managerów użytkownika
   */
  async getUserManagers(userId: string, params?: HierarchyQueryParams): Promise<UserWithHierarchy[]> {
    const queryParams = new URLSearchParams();
    if (params?.depth) queryParams.append('depth', params.depth.toString());
    if (params?.includePermissions) queryParams.append('includePermissions', params.includePermissions.toString());
    if (params?.includeInactive) queryParams.append('includeInactive', params.includeInactive.toString());

    const url = `/user-hierarchy/${userId}/managers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    return response.data.data;
  },

  /**
   * Usuwa relację hierarchiczną
   */
  async deleteRelation(relationId: string): Promise<void> {
    await apiClient.delete(`/user-hierarchy/relations/${relationId}`);
  },

  /**
   * Pobiera statystyki hierarchii dla organizacji
   */
  async getHierarchyStats(): Promise<HierarchyStats> {
    const response = await apiClient.get('/user-hierarchy/stats');
    return response.data.data;
  },

  // === ACCESS CONTROL ===

  /**
   * Sprawdza uprawnienia użytkownika do innego użytkownika
   */
  async checkUserAccess(request: UserAccessCheckRequest): Promise<UserAccessResult> {
    const response = await apiClient.post('/user-hierarchy/access-check', request);
    return response.data.data;
  },

  // === USER MANAGEMENT ===

  /**
   * Pobiera listę użytkowników w organizacji z informacjami o hierarchii
   */
  async getUsers(params?: UsersListParams): Promise<UsersListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.includeInactive) queryParams.append('includeInactive', params.includeInactive.toString());

    const url = `/user-hierarchy/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    return response.data.data;
  },

  /**
   * Pobiera szczegóły użytkownika z informacjami o hierarchii
   */
  async getUserDetails(userId: string): Promise<UserWithHierarchy> {
    const response = await apiClient.get(`/user-hierarchy/users/${userId}`);
    return response.data.data;
  },

  // === DELEGATION & APPROVAL ===

  /**
   * Deleguje zadanie do użytkownika w hierarchii
   */
  async delegate(request: DelegationRequest): Promise<void> {
    const response = await apiClient.post('/user-hierarchy/delegate', request);
    return response.data.data;
  },

  // === UTILITY FUNCTIONS ===

  /**
   * Formatuje nazwę użytkownika
   */
  formatUserName(user: Partial<UserWithHierarchy>): string {
    if (!user.firstName && !user.lastName) return user.email || 'Unknown User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  },

  /**
   * Formatuje nazwę typu relacji
   */
  formatRelationType(relationType: UserRelation['relationType']): string {
    const translations: Record<string, string> = {
      'MANAGES': 'Zarządza',
      'LEADS': 'Przewodzi',
      'SUPERVISES': 'Nadzoruje',
      'MENTORS': 'Mentoruje',
      'COLLABORATES': 'Współpracuje',
      'SUPPORTS': 'Wspiera',
      'REPORTS_TO': 'Raportuje do'
    };
    return translations[relationType] || relationType;
  },

  /**
   * Formatuje poziom dostępu
   */
  formatAccessLevel(accessLevel: UserAccessResult['accessLevel']): string {
    const translations: Record<string, string> = {
      'NO_ACCESS': 'Brak dostępu',
      'VIEW_ONLY': 'Tylko podgląd',
      'LIMITED': 'Ograniczony',
      'STANDARD': 'Standardowy',
      'ELEVATED': 'Podwyższony',
      'MANAGER': 'Menedżerski',
      'ADMIN': 'Administracyjny',
      'FULL_CONTROL': 'Pełna kontrola'
    };
    return translations[accessLevel] || accessLevel;
  },

  /**
   * Formatuje zakres danych
   */
  formatDataScope(dataScope: UserPermission['dataScope']): string {
    const translations: Record<string, string> = {
      'PROFILE': 'Profil',
      'TASKS': 'Zadania',
      'PROJECTS': 'Projekty',
      'SCHEDULE': 'Harmonogram',
      'PERFORMANCE': 'Wydajność',
      'DOCUMENTS': 'Dokumenty',
      'COMMUNICATION': 'Komunikacja',
      'SETTINGS': 'Ustawienia',
      'TEAM_DATA': 'Dane zespołu',
      'REPORTS': 'Raporty',
      'ALL': 'Wszystko'
    };
    return translations[dataScope] || dataScope;
  },

  /**
   * Formatuje akcję
   */
  formatAction(action: UserPermission['action']): string {
    const translations: Record<string, string> = {
      'VIEW': 'Podgląd',
      'EDIT': 'Edycja',
      'CREATE': 'Tworzenie',
      'DELETE': 'Usuwanie',
      'ASSIGN': 'Przypisywanie',
      'APPROVE': 'Zatwierdzanie',
      'DELEGATE': 'Delegowanie',
      'MANAGE': 'Zarządzanie',
      'AUDIT': 'Audyt'
    };
    return translations[action] || action;
  },

  /**
   * Formatuje rolę użytkownika
   */
  formatUserRole(role: UserWithHierarchy['role']): string {
    const translations: Record<string, string> = {
      'OWNER': 'Właściciel',
      'ADMIN': 'Administrator',
      'MANAGER': 'Menedżer',
      'MEMBER': 'Członek',
      'GUEST': 'Gość'
    };
    return translations[role] || role;
  },

  /**
   * Sprawdza czy użytkownik może zarządzać innym użytkownikiem
   */
  canManageUser(currentUser: UserWithHierarchy, targetUser: UserWithHierarchy): boolean {
    // Owner i Admin mogą zarządzać wszystkimi
    if (['OWNER', 'ADMIN'].includes(currentUser.role)) {
      return true;
    }

    // Manager może zarządzać swoimi podwładnymi
    if (currentUser.role === 'MANAGER') {
      return currentUser.managerRelations.some(rel => 
        rel.employee.id === targetUser.id && 
        rel.isActive &&
        ['MANAGES', 'LEADS', 'SUPERVISES'].includes(rel.relationType)
      );
    }

    return false;
  },

  /**
   * Pobiera wszystkich podwładnych użytkownika (rekurencyjnie)
   */
  getAllSubordinates(user: UserWithHierarchy): UserWithHierarchy[] {
    const subordinates: UserWithHierarchy[] = [];
    const visited = new Set<string>();

    const collectSubordinates = (currentUser: UserWithHierarchy) => {
      if (visited.has(currentUser.id)) return; // Unikaj cykli
      visited.add(currentUser.id);

      for (const relation of currentUser.managerRelations) {
        if (relation.isActive && relation.employee) {
          subordinates.push(relation.employee);
          collectSubordinates(relation.employee);
        }
      }
    };

    collectSubordinates(user);
    return subordinates;
  },

  /**
   * Pobiera ścieżkę hierarchii między użytkownikami
   */
  getHierarchyPath(fromUser: UserWithHierarchy, toUser: UserWithHierarchy): UserWithHierarchy[] {
    // TODO: Implementuj algorytm znajdowania ścieżki w hierarchii
    return [];
  }
};

export default userHierarchyApi;