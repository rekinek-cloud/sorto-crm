'use client';

import React, { useState, useEffect } from 'react';
import { UserWithHierarchy, userHierarchyApi, HierarchyStats } from '@/lib/api/userHierarchy';
import UserCard from '@/components/users/UserCard';
import UserHierarchyModal from '@/components/users/UserHierarchyModal';
import { toast } from 'react-hot-toast';
import { Users, Search, BarChart3, Share2 } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
      toast.error('Nie udało się załadować zespołu');
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
        title="Zespół"
        subtitle="Przegląd członków zespołu i hierarchii organizacyjnej"
        icon={Users}
        iconColor="text-indigo-600"
      />

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Członkowie zespołu</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{users.length}</p>
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

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Szukaj członków zespołu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">Nie znaleziono członków zespołu</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchTerm
                ? 'Spróbuj dostosować filtry wyszukiwania.'
                : 'Zespół jest pusty.'}
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
    </PageShell>
  );
}
