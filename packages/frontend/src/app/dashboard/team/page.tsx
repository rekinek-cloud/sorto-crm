'use client';

import React, { useState, useEffect } from 'react';
import { UserWithHierarchy, userHierarchyApi, HierarchyStats } from '@/lib/api/userHierarchy';
import UserCard from '@/components/users/UserCard';
import UserHierarchyModal from '@/components/users/UserHierarchyModal';
import { toast } from 'react-hot-toast';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ShareIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

export default function TeamPage() {
  const [users, setUsers] = useState<UserWithHierarchy[]>([]);
  const [stats, setStats] = useState<HierarchyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hierarchyUser, setHierarchyUser] = useState<UserWithHierarchy | null>(null);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userHierarchyApi.getUsers({
        page: 1,
        limit: 50,
        search: searchTerm || undefined,
        includeInactive: false
      });
      setUsers(response.users);
    } catch (error: any) {
      console.error('Error loading team:', error);
      toast.error('Nie udalo sie zaladowac zespolu');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const hierarchyStats = await userHierarchyApi.getHierarchyStats();
      setStats(hierarchyStats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewHierarchy = (user: UserWithHierarchy) => {
    setHierarchyUser(user);
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Zespol</h1>
          <p className="text-gray-600">Przeglad czlonkow zespolu i hierarchii organizacyjnej</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Czlonkowie zespolu</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
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
                <p className="text-sm font-medium text-gray-500">Sredni rozmiar zespolu</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageTeamSize.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj czlonkow zespolu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="bg-white rounded-lg shadow border">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nie znaleziono czlonkow zespolu</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? 'Sprobuj dostosowac filtry wyszukiwania.'
                : 'Zespol jest pusty.'}
            </p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onViewHierarchy={handleViewHierarchy}
                showHierarchyButton={true}
              />
            ))}
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
