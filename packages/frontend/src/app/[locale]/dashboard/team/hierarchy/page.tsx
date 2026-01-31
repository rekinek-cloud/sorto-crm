'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  UsersIcon,
  UserGroupIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ArrowsPointingOutIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  user_relations_user_relations_managerIdTousers?: UserRelation[];
  user_relations_user_relations_employeeIdTousers?: UserRelation[];
}

interface UserRelation {
  id: string;
  relationType: string;
  users_user_relations_employeeIdTousers?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  users_user_relations_managerIdTousers?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface HierarchyStats {
  totalUsers: number;
  activeRelations: number;
  topManagers: number;
  averageTeamSize: number;
}

type RelationType = 'MANAGES' | 'LEADS' | 'SUPERVISES' | 'MENTORS' | 'COLLABORATES' | 'SUPPORTS' | 'REPORTS_TO';

const RELATION_TYPES: { value: RelationType; label: string; description: string }[] = [
  { value: 'MANAGES', label: 'Zarządza', description: 'Bezpośredni przełożony' },
  { value: 'LEADS', label: 'Lideruje', description: 'Lider zespołu/projektu' },
  { value: 'SUPERVISES', label: 'Nadzoruje', description: 'Nadzór merytoryczny' },
  { value: 'MENTORS', label: 'Mentoruje', description: 'Relacja mentoringowa' },
  { value: 'COLLABORATES', label: 'Współpracuje', description: 'Współpraca między zespołami' },
  { value: 'SUPPORTS', label: 'Wspiera', description: 'Wsparcie funkcjonalne' },
  { value: 'REPORTS_TO', label: 'Raportuje do', description: 'Linia raportowania' },
];

export default function UserHierarchyPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HierarchyStats | null>(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Create relation form
  const [newRelation, setNewRelation] = useState({
    managerId: '',
    employeeId: '',
    relationType: 'MANAGES' as RelationType,
    description: '',
    canDelegate: true,
    canApprove: false,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [pagination.page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/user-hierarchy/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search || undefined,
          includeInactive: false,
        },
      });
      setUsers(res.data?.data?.users || []);
      if (res.data?.data?.pagination) {
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Nie udało się załadować użytkowników');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiClient.get('/user-hierarchy/stats');
      setStats(res.data?.data || null);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const createRelation = async () => {
    if (!newRelation.managerId || !newRelation.employeeId) {
      toast.error('Wybierz obu użytkowników');
      return;
    }
    if (newRelation.managerId === newRelation.employeeId) {
      toast.error('Manager i pracownik muszą być różni');
      return;
    }

    setCreating(true);
    try {
      await apiClient.post('/user-hierarchy/relations', {
        ...newRelation,
        inheritanceRule: 'INHERIT_DOWN',
      });
      toast.success('Relacja utworzona');
      setShowCreateModal(false);
      setNewRelation({
        managerId: '',
        employeeId: '',
        relationType: 'MANAGES',
        description: '',
        canDelegate: true,
        canApprove: false,
      });
      loadUsers();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udało się utworzyć relacji');
    } finally {
      setCreating(false);
    }
  };

  const deleteRelation = async (relationId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę relację?')) return;

    try {
      await apiClient.delete(`/user-hierarchy/relations/${relationId}`);
      toast.success('Relacja usunięta');
      loadUsers();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udało się usunąć relacji');
    }
  };

  const toggleExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getUserName = (user: { firstName?: string; lastName?: string; email: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700';
      case 'USER':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRelationTypeLabel = (type: string) => {
    const relation = RELATION_TYPES.find((r) => r.value === type);
    return relation?.label || type;
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserGroupIcon className="w-8 h-8 text-indigo-600" />
          Hierarchia użytkowników
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Zarządzaj relacjami i strukturą organizacyjną
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                <p className="text-sm text-gray-500">Użytkownicy</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <ArrowsPointingOutIcon className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeRelations}</p>
                <p className="text-sm text-gray-500">Aktywne relacje</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <UserPlusIcon className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.topManagers}</p>
                <p className="text-sm text-gray-500">Top managerowie</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageTeamSize?.toFixed(1) || '0'}
                </p>
                <p className="text-sm text-gray-500">Śr. wielkość zespołu</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj użytkowników..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="w-5 h-5" />
            Nowa relacja
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użytkownik</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rola</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Managerowie</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Podwładni</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => {
              const managers = user.user_relations_user_relations_employeeIdTousers || [];
              const subordinates = user.user_relations_user_relations_managerIdTousers || [];
              const isExpanded = expandedUsers.has(user.id);

              return (
                <>
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleExpanded(user.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </button>
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {user.firstName?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{getUserName(user)}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {managers.length > 0 ? managers.length : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {subordinates.length > 0 ? subordinates.length : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRelation({ ...newRelation, managerId: user.id });
                          setShowCreateModal(true);
                        }}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Dodaj relację"
                      >
                        <UserPlusIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                  {/* Expanded relations */}
                  {isExpanded && (managers.length > 0 || subordinates.length > 0) && (
                    <tr className="bg-gray-50 dark:bg-gray-700/30">
                      <td colSpan={6} className="px-8 py-3">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Managers */}
                          {managers.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">Raportuje do:</p>
                              <div className="space-y-2">
                                {managers.map((rel) => (
                                  <div
                                    key={rel.id}
                                    className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">
                                        {rel.users_user_relations_managerIdTousers
                                          ? getUserName(rel.users_user_relations_managerIdTousers)
                                          : '-'}
                                      </span>
                                      <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                        {getRelationTypeLabel(rel.relationType)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => deleteRelation(rel.id)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Subordinates */}
                          {subordinates.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">Zarządza:</p>
                              <div className="space-y-2">
                                {subordinates.map((rel) => (
                                  <div
                                    key={rel.id}
                                    className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">
                                        {rel.users_user_relations_employeeIdTousers
                                          ? getUserName(rel.users_user_relations_employeeIdTousers)
                                          : '-'}
                                      </span>
                                      <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                        {getRelationTypeLabel(rel.relationType)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => deleteRelation(rel.id)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Brak użytkowników</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Strona {pagination.page} z {pagination.totalPages} ({pagination.total} użytkowników)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Poprzednia
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Następna
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Relation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Nowa relacja hierarchiczna</h2>

            <div className="space-y-4">
              {/* Manager */}
              <div>
                <label className="block text-sm font-medium mb-1">Manager (przełożony)</label>
                <select
                  value={newRelation.managerId}
                  onChange={(e) => setNewRelation({ ...newRelation, managerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="">Wybierz managera...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getUserName(u)} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee */}
              <div>
                <label className="block text-sm font-medium mb-1">Pracownik (podwładny)</label>
                <select
                  value={newRelation.employeeId}
                  onChange={(e) => setNewRelation({ ...newRelation, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="">Wybierz pracownika...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getUserName(u)} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Relation Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Typ relacji</label>
                <select
                  value={newRelation.relationType}
                  onChange={(e) =>
                    setNewRelation({ ...newRelation, relationType: e.target.value as RelationType })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  {RELATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Opis (opcjonalnie)</label>
                <textarea
                  value={newRelation.description}
                  onChange={(e) => setNewRelation({ ...newRelation, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  placeholder="Dodatkowy opis relacji..."
                />
              </div>

              {/* Permissions */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRelation.canDelegate}
                    onChange={(e) => setNewRelation({ ...newRelation, canDelegate: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Może delegować</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRelation.canApprove}
                    onChange={(e) => setNewRelation({ ...newRelation, canApprove: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Może zatwierdzać</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Anuluj
              </button>
              <button
                onClick={createRelation}
                disabled={creating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Tworzenie...' : 'Utwórz relację'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
