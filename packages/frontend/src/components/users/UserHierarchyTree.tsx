'use client';

import React, { useState, useEffect } from 'react';
import { UserHierarchyTree, UserWithHierarchy, userHierarchyApi } from '@/lib/api/userHierarchy';
import { toast } from 'react-hot-toast';
import {
  ChevronDown,
  ChevronRight,
  Users,
  ShieldCheck,
  Eye,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  User
} from 'lucide-react';

interface UserHierarchyTreeProps {
  userId: string;
  onCreateRelation?: (userId: string) => void;
  onEditRelation?: (relationId: string) => void;
  showPermissions?: boolean;
}

interface TreeNodeProps {
  user: UserWithHierarchy;
  depth: number;
  isManager: boolean;
  onToggle: (userId: string) => void;
  expanded: Set<string>;
  onCreateRelation?: (userId: string) => void;
  onEditRelation?: (relationId: string) => void;
  showPermissions: boolean;
}

const getRelationTypeColor = (relationType: string) => {
  switch (relationType) {
    case 'MANAGES': return 'text-red-600 bg-red-50 border-red-200';
    case 'LEADS': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'SUPERVISES': return 'text-green-600 bg-green-50 border-green-200';
    case 'MENTORS': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'COLLABORATES': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'SUPPORTS': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
    case 'REPORTS_TO': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getRelationTypeIcon = (relationType: string) => {
  switch (relationType) {
    case 'MANAGES': return '👑';
    case 'LEADS': return '⚡';
    case 'SUPERVISES': return '👀';
    case 'MENTORS': return '🎓';
    case 'COLLABORATES': return '🤝';
    case 'SUPPORTS': return '🛠️';
    case 'REPORTS_TO': return '📊';
    default: return '🔗';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'OWNER': return '👑';
    case 'ADMIN': return '⚙️';
    case 'MANAGER': return '📋';
    case 'MEMBER': return '👤';
    case 'GUEST': return '👻';
    default: return '👤';
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'OWNER': return 'bg-purple-100 text-purple-800';
    case 'ADMIN': return 'bg-red-100 text-red-800';
    case 'MANAGER': return 'bg-blue-100 text-blue-800';
    case 'MEMBER': return 'bg-green-100 text-green-800';
    case 'GUEST': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const TreeNode: React.FC<TreeNodeProps> = ({ 
  user, 
  depth, 
  isManager, 
  onToggle, 
  expanded, 
  onCreateRelation,
  onEditRelation,
  showPermissions 
}) => {
  const isExpanded = expanded.has(user.id);
  const hasChildren = isManager ? user.managerRelations.length > 0 : user.employeeRelations.length > 0;
  const relations = isManager ? user.managerRelations : user.employeeRelations;

  const handleToggle = () => {
    if (hasChildren) {
      onToggle(user.id);
    }
  };

  return (
    <div className="select-none">
      {/* User Node */}
      <div 
        className={`flex items-center py-3 px-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer group ${
          depth === 0 
            ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
        style={{ marginLeft: `${depth * 24}px` }}
        onClick={handleToggle}
      >
        {/* Expand/Collapse Button */}
        <div className="w-6 h-6 flex items-center justify-center mr-3">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          )}
        </div>

        {/* User Avatar/Icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mr-3 flex-shrink-0 text-white font-semibold">
          {user.avatar ? (
            <img src={user.avatar} alt={userHierarchyApi.formatUserName(user)} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm">
              {userHierarchyApi.formatUserName(user).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {userHierarchyApi.formatUserName(user)}
            </h3>
            <span className="text-lg">{getRoleIcon(user.role)}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
              {userHierarchyApi.formatUserRole(user.role)}
            </span>
            {!user.isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Nieaktywny
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">
            {user.email}
          </p>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>Zarządza: {user.managerRelations.filter(r => r.isActive).length}</span>
            <span>Raportuje: {user.employeeRelations.filter(r => r.isActive).length}</span>
            {user.lastLoginAt && (
              <span>Ostatnie logowanie: {new Date(user.lastLoginAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateRelation?.(user.id);
            }}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
            title="Dodaj relację"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Navigate to user details
            }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Zobacz szczegóły"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Relations */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {relations.map((relation) => {
            const relatedUser = isManager ? (relation as any).employee : (relation as any).manager;
            return (
              <div key={relation.id} className="relative">
                {/* Relation Info */}
                <div 
                  className={`flex items-center py-2 px-3 ml-6 mr-2 rounded-lg border text-sm ${getRelationTypeColor(relation.relationType)}`}
                  style={{ marginLeft: `${(depth + 1) * 24}px` }}
                >
                  <span className="mr-2">{getRelationTypeIcon(relation.relationType)}</span>
                  <span className="font-medium">{userHierarchyApi.formatRelationType(relation.relationType)}</span>
                  {relation.description && (
                    <span className="text-gray-600 ml-2">- {relation.description}</span>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    {!relation.isActive && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" title="Nieaktywna relacja" />
                    )}
                    <span className="text-xs">
                      {relation.inheritanceRule.replace('_', ' ').toLowerCase()}
                    </span>
                    {relation.canDelegate && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded" title="Może delegować">
                        DEL
                      </span>
                    )}
                    {relation.canApprove && (
                      <span className="text-xs bg-green-100 text-green-800 px-1 rounded" title="Może zatwierdzać">
                        APP
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRelation?.(relation.id);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded"
                      title="Edytuj relację"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Permissions Display */}
                {showPermissions && relation.permissions && relation.permissions.length > 0 && (
                  <div className="mt-1 ml-8 space-y-1" style={{ marginLeft: `${(depth + 2) * 24}px` }}>
                    {relation.permissions.map((permission, idx) => (
                      <div key={idx} className={`flex items-center text-xs px-2 py-1 rounded ${
                        permission.granted ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <span className="mr-1">{permission.granted ? '✓' : '✗'}</span>
                        <span className="font-medium">{userHierarchyApi.formatAction(permission.action)}</span>
                        <span className="mx-1">na</span>
                        <span>{userHierarchyApi.formatDataScope(permission.dataScope)}</span>
                        {permission.expiresAt && (
                          <span className="ml-2 text-gray-500">
                            do {new Date(permission.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recursive TreeNode */}
                <div className="mt-2">
                  <TreeNode
                    user={relatedUser}
                    depth={depth + 1}
                    isManager={isManager}
                    onToggle={onToggle}
                    expanded={expanded}
                    onCreateRelation={onCreateRelation}
                    onEditRelation={onEditRelation}
                    showPermissions={showPermissions}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function UserHierarchyTreeComponent({ 
  userId, 
  onCreateRelation, 
  onEditRelation,
  showPermissions = false 
}: UserHierarchyTreeProps) {
  const [hierarchy, setHierarchy] = useState<UserHierarchyTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([userId]));
  const [direction, setDirection] = useState<'up' | 'down' | 'both'>('both');
  const [depth, setDepth] = useState(3);
  const [includePermissions, setIncludePermissions] = useState(showPermissions);

  useEffect(() => {
    loadHierarchy();
  }, [userId, direction, depth, includePermissions]);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const data = await userHierarchyApi.getUserHierarchy(userId, {
        direction,
        depth,
        includePermissions
      });
      setHierarchy(data);
    } catch (error: any) {
      console.error('Error loading user hierarchy:', error);
      toast.error('Failed to load user hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (toggleUserId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(toggleUserId)) {
      newExpanded.delete(toggleUserId);
    } else {
      newExpanded.add(toggleUserId);
    }
    setExpanded(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <div className="text-center py-12 text-gray-500">
        Brak danych hierarchii
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Hierarchia Użytkowników
          </h3>
          <div className="flex items-center gap-4">
            {hierarchy.hasCycles && (
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">
                <AlertTriangle className="h-4 w-4" />
                Wykryto cykle
              </div>
            )}
            <span className="text-sm text-gray-500">
              {hierarchy.totalRelations} relacji
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Direction Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Kierunek:</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="both">Oba kierunki</option>
              <option value="up">Tylko managerów</option>
              <option value="down">Tylko podwładnych</option>
            </select>
          </div>

          {/* Depth Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Głębokość:</label>
            <select
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={1}>1 poziom</option>
              <option value={2}>2 poziomy</option>
              <option value={3}>3 poziomy</option>
              <option value={5}>5 poziomów</option>
              <option value={10}>10 poziomów</option>
            </select>
          </div>

          {/* Permissions Toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includePermissions}
              onChange={(e) => setIncludePermissions(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Pokaż uprawnienia</span>
          </label>

          {/* Refresh Button */}
          <button
            onClick={loadHierarchy}
            className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
          >
            Odśwież
          </button>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Managers Section */}
          {direction !== 'down' && hierarchy.managers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ChevronDown className="h-4 w-4" />
                Managerowie ({hierarchy.managers.length})
              </h4>
              <div className="space-y-2">
                {hierarchy.managers.map((manager) => (
                  <TreeNode
                    key={manager.id}
                    user={manager}
                    depth={0}
                    isManager={false}
                    onToggle={handleToggle}
                    expanded={expanded}
                    onCreateRelation={onCreateRelation}
                    onEditRelation={onEditRelation}
                    showPermissions={includePermissions}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Current User */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Aktualny użytkownik
            </h4>
            <TreeNode
              user={hierarchy.user}
              depth={0}
              isManager={true}
              onToggle={handleToggle}
              expanded={expanded}
              onCreateRelation={onCreateRelation}
              onEditRelation={onEditRelation}
              showPermissions={includePermissions}
            />
          </div>

          {/* Employees Section */}
          {direction !== 'up' && hierarchy.employees.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ChevronDown className="h-4 w-4" />
                Podwładni ({hierarchy.employees.length})
              </h4>
              <div className="space-y-2">
                {hierarchy.employees.map((employee) => (
                  <TreeNode
                    key={employee.id}
                    user={employee}
                    depth={0}
                    isManager={true}
                    onToggle={handleToggle}
                    expanded={expanded}
                    onCreateRelation={onCreateRelation}
                    onEditRelation={onEditRelation}
                    showPermissions={includePermissions}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {hierarchy.totalRelations === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Brak relacji hierarchicznych</h4>
              <p className="text-gray-600 mb-4">Ten użytkownik nie ma żadnych relacji zarządczych.</p>
              <button
                onClick={() => onCreateRelation?.(userId)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Utwórz pierwszą relację
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}