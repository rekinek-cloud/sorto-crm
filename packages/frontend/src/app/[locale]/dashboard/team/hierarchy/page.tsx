'use client';

import { useState, useEffect, Fragment } from 'react';
import { toast } from 'react-hot-toast';
import {
  Users,
  UserPlus,
  RefreshCw,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Maximize2,
  BarChart3,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'USER':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getRelationTypeLabel = (type: string) => {
    const relation = RELATION_TYPES.find((r) => r.value === type);
    return relation?.label || type;
  };

  if (loading && users.length === 0) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Hierarchia użytkowników"
        subtitle="Zarządzaj relacjami i strukturą organizacyjną"
        icon={Users}
        iconColor="text-indigo-600"
        actions={
          <div className="flex gap-2">
            <button
              onClick={loadUsers}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nowa relacja
            </button>
          </div>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalUsers}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Użytkownicy</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <Maximize2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.activeRelations}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Aktywne relacje</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.topManagers}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Top managerowie</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.averageTeamSize?.toFixed(1) || '0'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Śr. wielkość zespołu</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Szukaj użytkowników..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Użytkownik</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Rola</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Managerowie</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Podwładni</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map((user) => {
              const managers = user.user_relations_user_relations_employeeIdTousers || [];
              const subordinates = user.user_relations_user_relations_managerIdTousers || [];
              const isExpanded = expandedUsers.has(user.id);

              return (
                <Fragment key={user.id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleExpanded(user.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          )}
                        </button>
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                              {user.firstName?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{getUserName(user)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {managers.length > 0 ? managers.length : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {subordinates.length > 0 ? subordinates.length : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
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
                        className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                        title="Dodaj relację"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                  {/* Expanded relations */}
                  {isExpanded && (managers.length > 0 || subordinates.length > 0) && (
                    <tr className="bg-slate-50 dark:bg-slate-800/30">
                      <td colSpan={6} className="px-8 py-3">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Managers */}
                          {managers.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Raportuje do:</p>
                              <div className="space-y-2">
                                {managers.map((rel) => (
                                  <div
                                    key={rel.id}
                                    className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-600"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-slate-900 dark:text-slate-100">
                                        {rel.users_user_relations_managerIdTousers
                                          ? getUserName(rel.users_user_relations_managerIdTousers)
                                          : '-'}
                                      </span>
                                      <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                                        {getRelationTypeLabel(rel.relationType)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => deleteRelation(rel.id)}
                                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Subordinates */}
                          {subordinates.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Zarządza:</p>
                              <div className="space-y-2">
                                {subordinates.map((rel) => (
                                  <div
                                    key={rel.id}
                                    className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-600"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-slate-900 dark:text-slate-100">
                                        {rel.users_user_relations_employeeIdTousers
                                          ? getUserName(rel.users_user_relations_employeeIdTousers)
                                          : '-'}
                                      </span>
                                      <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                        {getRelationTypeLabel(rel.relationType)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => deleteRelation(rel.id)}
                                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
                </Fragment>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p>Brak użytkowników</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Strona {pagination.page} z {pagination.totalPages} ({pagination.total} użytkowników)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Poprzednia
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Następna
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Relation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Nowa relacja hierarchiczna</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Manager (przełożony)</label>
                <select
                  value={newRelation.managerId}
                  onChange={(e) => setNewRelation({ ...newRelation, managerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Wybierz managera...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getUserName(u)} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Pracownik (podwładny)</label>
                <select
                  value={newRelation.employeeId}
                  onChange={(e) => setNewRelation({ ...newRelation, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Wybierz pracownika...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getUserName(u)} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Typ relacji</label>
                <select
                  value={newRelation.relationType}
                  onChange={(e) =>
                    setNewRelation({ ...newRelation, relationType: e.target.value as RelationType })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {RELATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Opis (opcjonalnie)</label>
                <textarea
                  value={newRelation.description}
                  onChange={(e) => setNewRelation({ ...newRelation, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Dodatkowy opis relacji..."
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRelation.canDelegate}
                    onChange={(e) => setNewRelation({ ...newRelation, canDelegate: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Może delegować</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRelation.canApprove}
                    onChange={(e) => setNewRelation({ ...newRelation, canApprove: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Może zatwierdzać</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={createRelation}
                disabled={creating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Tworzenie...' : 'Utwórz relację'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
