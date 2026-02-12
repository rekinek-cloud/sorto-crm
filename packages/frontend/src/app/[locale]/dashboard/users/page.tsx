'use client';

import React, { useState, useEffect } from 'react';
import { UserWithHierarchy, userHierarchyApi, HierarchyStats } from '@/lib/api/userHierarchy';
import UserCard from '@/components/users/UserCard';
import UserHierarchyModal from '@/components/users/UserHierarchyModal';
import UserFormModal from '@/components/users/UserFormModal';
import { toast } from 'react-hot-toast';
import { Users, Search, Filter, BarChart3, Plus, Share2 } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

type ViewMode = 'cards' | 'hierarchy' | 'list';

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithHierarchy[]>([]);
  const [stats, setStats] = useState<HierarchyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [hierarchyUser, setHierarchyUser] = useState<UserWithHierarchy | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithHierarchy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 20;

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [currentPage, searchTerm, roleFilter, includeInactive]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userHierarchyApi.getUsers({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        includeInactive
      });
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Nie udało się załadować użytkowników');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const hierarchyStats = await userHierarchyApi.getHierarchyStats();
      setStats(hierarchyStats);
    } catch (error: any) {
      console.error('Error loading hierarchy stats:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleViewHierarchy = (user: UserWithHierarchy) => {
    setHierarchyUser(user);
  };

  const handleEditUser = (user: UserWithHierarchy) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleUserFormSuccess = () => {
    loadUsers();
    loadStats();
  };

  if (loading && currentPage === 1) {
    return (
      <PageShell>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Zarządzanie użytkownikami"
        subtitle="Zarządzaj użytkownikami i hierarchią organizacyjną"
        icon={Users}
        iconColor="text-indigo-600"
        actions={
          <button
            onClick={handleCreateUser}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Dodaj użytkownika
          </button>
        }
      />

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Użytkownicy z hierarchią</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.usersWithHierarchy}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <Share2 className="h-8 w-8 text-green-500 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aktywne relacje</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.activeRelations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Penetracja hierarchii</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.hierarchyPenetration.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-500 dark:text-orange-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Średni rozmiar zespołu</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.averageTeamSize.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and View Mode */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Szukaj użytkowników..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Wszystkie role</option>
                <option value="OWNER">Właściciel</option>
                <option value="ADMIN">Administrator</option>
                <option value="MANAGER">Menedżer</option>
                <option value="MEMBER">Członek</option>
                <option value="GUEST">Gość</option>
              </select>
            </div>

            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Nieaktywni</span>
            </label>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Karty
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'hierarchy'
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Hierarchia
            </button>
          </div>
        </div>
      </div>

      {/* Users Display */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">Nie znaleziono użytkowników</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchTerm || roleFilter !== 'ALL'
                ? 'Spróbuj dostosować filtry wyszukiwania.'
                : 'Rozpocznij dodawanie pierwszych użytkowników do organizacji.'}
            </p>
            {!searchTerm && roleFilter === 'ALL' && (
              <div className="mt-6">
                <button
                  onClick={handleCreateUser}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Dodaj pierwszego użytkownika
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'cards' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onViewHierarchy={handleViewHierarchy}
                    onEditUser={handleEditUser}
                    showHierarchyButton={true}
                  />
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Użytkownik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Rola
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Hierarchia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ostatnie logowanie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold mr-3">
                              {userHierarchyApi.formatUserName(user).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {userHierarchyApi.formatUserName(user)}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                            {userHierarchyApi.formatUserRole(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-4">
                            <span>&#8595; {user.managerRelations?.filter(r => r.isActive).length || 0}</span>
                            <span>&#8593; {user.employeeRelations?.filter(r => r.isActive).length || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Nigdy'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewHierarchy(user)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Hierarchia
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            Edytuj
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'hierarchy' && users.length > 0 && (
              <div className="p-6">
                <p className="text-center text-slate-500 dark:text-slate-400 mb-4">
                  Wybierz użytkownika z listy powyżej aby zobaczyć jego hierarchię
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.slice(0, 6).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleViewHierarchy(user)}
                      className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {userHierarchyApi.formatUserName(user).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{userHierarchyApi.formatUserName(user)}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{userHierarchyApi.formatUserRole(user.role)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Strona {currentPage} z {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Poprzednia
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Następna
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Hierarchy Modal */}
      {hierarchyUser && (
        <UserHierarchyModal
          isOpen={hierarchyUser !== null}
          onClose={() => setHierarchyUser(null)}
          user={hierarchyUser}
        />
      )}

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showUserForm}
        onClose={() => {
          setShowUserForm(false);
          setEditingUser(null);
        }}
        onSuccess={handleUserFormSuccess}
        user={editingUser ? {
          id: editingUser.id,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          email: editingUser.email,
          role: editingUser.role,
          isActive: editingUser.isActive,
        } : undefined}
      />
    </PageShell>
  );
}
