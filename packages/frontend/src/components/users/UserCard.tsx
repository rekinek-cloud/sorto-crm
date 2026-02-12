'use client';

import React from 'react';
import { UserWithHierarchy, userHierarchyApi } from '@/lib/api/userHierarchy';
import {
  User,
  Mail,
  ShieldCheck,
  Users,
  Calendar,
  Share2
} from 'lucide-react';

interface UserCardProps {
  user: UserWithHierarchy;
  onViewHierarchy?: (user: UserWithHierarchy) => void;
  onEditUser?: (user: UserWithHierarchy) => void;
  showHierarchyButton?: boolean;
}

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
    case 'OWNER': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
    case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'MEMBER': return 'bg-green-100 text-green-800 border-green-200';
    case 'GUEST': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function UserCard({
  user,
  onViewHierarchy,
  onEditUser,
  showHierarchyButton = true
}: UserCardProps) {
  const managedCount = user.managerRelations?.filter(r => r.isActive).length || 0;
  const reportsToCount = user.employeeRelations?.filter(r => r.isActive).length || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={userHierarchyApi.formatUserName(user)} 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : (
              <span className="text-lg">
                {userHierarchyApi.formatUserName(user).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {userHierarchyApi.formatUserName(user)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Status & Role */}
        <div className="flex items-center gap-2">
          {!user.isActive && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              Nieaktywny
            </span>
          )}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
            <span className="mr-1">{getRoleIcon(user.role)}</span>
            {userHierarchyApi.formatUserRole(user.role)}
          </span>
        </div>
      </div>

      {/* Hierarchy Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Users className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">Zarządza</p>
            <p className="text-lg font-semibold text-blue-600">{managedCount}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">Raportuje</p>
            <p className="text-lg font-semibold text-green-600">{reportsToCount}</p>
          </div>
        </div>
      </div>

      {/* Hierarchy Preview */}
      {(managedCount > 0 || reportsToCount > 0) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Relacje hierarchiczne</h4>
          <div className="space-y-1">
            {user.managerRelations?.slice(0, 3).map((relation) => (
              <div key={relation.id} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-blue-600">→</span>
                <span>{userHierarchyApi.formatRelationType(relation.relationType)}</span>
                <span className="font-medium">{userHierarchyApi.formatUserName(relation.employee)}</span>
              </div>
            ))}
            {user.employeeRelations?.slice(0, 2).map((relation) => (
              <div key={relation.id} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">←</span>
                <span>Raportuje do</span>
                <span className="font-medium">{userHierarchyApi.formatUserName(relation.manager)}</span>
              </div>
            ))}
            {managedCount > 3 && (
              <div className="text-xs text-gray-500">
                ...i {managedCount - 3} więcej
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last Login */}
      {user.lastLoginAt && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4" />
          <span>Ostatnie logowanie: {new Date(user.lastLoginAt).toLocaleDateString()}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {showHierarchyButton && (
          <button
            onClick={() => onViewHierarchy?.(user)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Zobacz hierarchię
          </button>
        )}
        
        <button
          onClick={() => onEditUser?.(user)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <User className="h-4 w-4" />
          Edytuj
        </button>
      </div>
    </div>
  );
}