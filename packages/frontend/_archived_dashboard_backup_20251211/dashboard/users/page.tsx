'use client';

import React, { useState, useEffect } from 'react';
import { UserWithHierarchy, userHierarchyApi, HierarchyStats } from '@/lib/api/userHierarchy';
import UserCard from '@/components/users/UserCard';
import UserHierarchyModal from '@/components/users/UserHierarchyModal';
import { toast } from 'react-hot-toast';
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  PlusIcon,
  ShareIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

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
    // TODO: Implement user edit functionality
    console.log('Edit user:', user);
    toast('Funkcja edycji użytkownika będzie dostępna wkrótce');
  };

  const handleCreateUser = () => {
    // TODO: Implement user creation functionality
    console.log('Create user');
    toast('Funkcja tworzenia użytkownika będzie dostępna wkrótce');
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zarządzanie użytkownikami</h1>
          <p className="text-gray-600">Zarządzaj użytkownikami i hierarchią organizacyjną</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Dodaj użytkownika
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Użytkownicy z hierarchią</p>
                <p className="text-2xl font-bold text-gray-900">{stats.usersWithHierarchy}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <ShareIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Aktywne relacje</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRelations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Penetracja hierarchii</p>
                <p className="text-2xl font-bold text-gray-900">{stats.hierarchyPenetration.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Średni rozmiar zespołu</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageTeamSize.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and View Mode */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj użytkowników..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ALL">Wszystkie role</option>
                <option value="OWNER">Właściciel</option>
                <option value="ADMIN">Administrator</option>
                <option value="MANAGER">Menedżer</option>
                <option value="MEMBER">Członek</option>
                <option value="GUEST">Gość</option>
              </select>
            </div>

            {/* Include Inactive */}
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Nieaktywni</span>
            </label>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Karty
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'hierarchy' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hierarchia
            </button>
          </div>
        </div>
      </div>

      {/* Users Display */}
      <div className="bg-white rounded-lg shadow border">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nie znaleziono użytkowników</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || roleFilter !== 'ALL'
                ? 'Spróbuj dostosować filtry wyszukiwania.'
                : 'Rozpocznij dodawanie pierwszych użytkowników do organizacji.'}
            </p>
            {!searchTerm && roleFilter === 'ALL' && (
              <div className="mt-6">
                <button
                  onClick={handleCreateUser}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Użytkownik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rola
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hierarchia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ostatnie logowanie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold mr-3">
                              {userHierarchyApi.formatUserName(user).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {userHierarchyApi.formatUserName(user)}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {userHierarchyApi.formatUserRole(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-4">
                            <span>↓ {user.managerRelations?.filter(r => r.isActive).length || 0}</span>
                            <span>↑ {user.employeeRelations?.filter(r => r.isActive).length || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Nigdy'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewHierarchy(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Hierarchia
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-gray-600 hover:text-gray-900"
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
                <p className="text-center text-gray-500 mb-4">
                  Wybierz użytkownika z listy powyżej aby zobaczyć jego hierarchię
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.slice(0, 6).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleViewHierarchy(user)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {userHierarchyApi.formatUserName(user).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{userHierarchyApi.formatUserName(user)}</p>
                          <p className="text-sm text-gray-500">{userHierarchyApi.formatUserRole(user.role)}</p>
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
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Strona {currentPage} z {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Poprzednia
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
    </div>
  );
}