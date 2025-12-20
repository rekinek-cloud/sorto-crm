'use client';

import React, { useState, useEffect } from 'react';
import { PreciseGoal, GoalStatus, Stream } from '@/types/streams';
import { goalsApi } from '@/lib/api/goals';
import { streamsApi } from '@/lib/api/streams';
import GoalCard from '@/components/goals/GoalCard';
import GoalForm from '@/components/goals/GoalForm';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  FunnelIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PauseCircleIcon,
} from '@heroicons/react/24/outline';

export default function GoalsPage() {
  const [goals, setGoals] = useState<PreciseGoal[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PreciseGoal | undefined>();
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    achieved: number;
    failed: number;
    paused: number;
    averageProgress: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [goalsData, streamsData, statsData] = await Promise.all([
        goalsApi.getGoals({
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 100
        }),
        streamsApi.getStreams({ limit: 100 }),
        goalsApi.getGoalsStats(),
      ]);

      setGoals(goalsData.goals || []);
      setStreams((streamsData.streams || []) as Stream[]);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading goals:', error);
      toast.error('Nie udało się załadować celów');
      setGoals([]);
      setStreams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await goalsApi.createGoal(data);
      toast.success('Cel utworzony pomyślnie');
      setIsFormOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast.error('Nie udało się utworzyć celu');
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await goalsApi.updateGoal(id, data);
      toast.success('Cel zaktualizowany pomyślnie');
      setEditingGoal(undefined);
      setIsFormOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error updating goal:', error);
      toast.error('Nie udało się zaktualizować celu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten cel?')) return;

    try {
      await goalsApi.deleteGoal(id);
      toast.success('Cel usunięty pomyślnie');
      loadData();
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast.error('Nie udało się usunąć celu');
    }
  };

  const handleUpdateProgress = async (id: string, currentValue: number) => {
    try {
      await goalsApi.updateProgress(id, currentValue);
      toast.success('Postęp zaktualizowany');
      loadData();
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast.error('Nie udało się zaktualizować postępu');
    }
  };

  const handleAchieve = async (id: string) => {
    try {
      await goalsApi.achieveGoal(id);
      toast.success('Cel oznaczony jako osiągnięty!');
      loadData();
    } catch (error: any) {
      console.error('Error achieving goal:', error);
      toast.error('Nie udało się oznaczyć celu jako osiągnięty');
    }
  };

  const getStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case 'active':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'achieved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'paused':
        return <PauseCircleIcon className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cele Precyzyjne</h1>
          <p className="text-gray-600">
            Definiuj cele metodą RZUT: Rezultat, Zmierzalność, Ujście, Tło
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as GoalStatus | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="active">Aktywne</option>
              <option value="achieved">Osiągnięte</option>
              <option value="paused">Wstrzymane</option>
              <option value="failed">Nieosiągnięte</option>
            </select>
          </div>

          {/* New Goal Button */}
          <button
            onClick={() => {
              setEditingGoal(undefined);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nowy cel
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Wszystkie</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Aktywne</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Osiągnięte</p>
                <p className="text-2xl font-bold text-green-600">{stats.achieved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <PauseCircleIcon className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-sm text-gray-600">Wstrzymane</p>
                <p className="text-2xl font-bold text-amber-600">{stats.paused}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">%</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Śr. postęp</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(stats.averageProgress)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RZUT Legend */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Metodologia RZUT - Cele Precyzyjne
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-bold text-blue-600">R</span>
            <div>
              <p className="font-medium text-gray-900">Rezultat</p>
              <p className="text-gray-600">Co konkretnie powstanie?</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-cyan-600">Z</span>
            <div>
              <p className="font-medium text-gray-900">Zmierzalność</p>
              <p className="text-gray-600">Po czym poznam sukces?</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-teal-600">U</span>
            <div>
              <p className="font-medium text-gray-900">Ujście</p>
              <p className="text-gray-600">Do kiedy? (deadline)</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-emerald-600">T</span>
            <div>
              <p className="font-medium text-gray-900">Tło</p>
              <p className="text-gray-600">Dlaczego ten cel?</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Brak celów
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter !== 'all'
              ? 'Brak celów o wybranym statusie.'
              : 'Zacznij definiować swoje cele precyzyjne metodą RZUT.'}
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Utwórz pierwszy cel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(goal) => {
                setEditingGoal(goal);
                setIsFormOpen(true);
              }}
              onDelete={handleDelete}
              onUpdateProgress={handleUpdateProgress}
              onAchieve={handleAchieve}
            />
          ))}
        </div>
      )}

      {/* Goal Form Modal */}
      {isFormOpen && (
        <GoalForm
          goal={editingGoal}
          streams={streams}
          onSubmit={editingGoal
            ? (data) => handleEdit(editingGoal.id, data)
            : handleCreate
          }
          onCancel={() => {
            setIsFormOpen(false);
            setEditingGoal(undefined);
          }}
        />
      )}
    </div>
  );
}
