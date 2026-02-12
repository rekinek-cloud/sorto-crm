'use client';

import { useState } from 'react';
import { Plus, Bot, CheckCircle2, TrendingUp, Activity } from 'lucide-react';
import { useAIAgents } from '@/hooks/useAIAgents';
import { aiAgentsApi } from '@/lib/api/aiAgents';
import AIAgentCard from './AIAgentCard';
import toast from 'react-hot-toast';

export default function AIAgentPanel() {
  const { agents, loading, error, refetch } = useAIAgents();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredAgents =
    statusFilter === 'ALL'
      ? agents
      : agents.filter((a) => a.status === statusFilter);

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.status === 'ACTIVE').length,
    totalTasks: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
    avgSuccess:
      agents.length > 0
        ? Math.round(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length)
        : 0,
  };

  const handleToggle = async (agentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await aiAgentsApi.updateAgent(agentId, { status: newStatus as any });
      toast.success(newStatus === 'ACTIVE' ? 'Agent aktywowany' : 'Agent wstrzymany');
      refetch();
    } catch (err) {
      toast.error('Nie udało się zmienić statusu agenta');
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={refetch}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Wszyscy agenci</p>
            <p className="text-lg font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Aktywni</p>
            <p className="text-lg font-bold text-gray-900">{stats.active}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Zadania</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalTasks}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Skuteczność</p>
            <p className="text-lg font-bold text-gray-900">{stats.avgSuccess}%</p>
          </div>
        </div>
      </div>

      {/* Filters + Add button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {[
            { key: 'ALL', label: 'Wszystkie' },
            { key: 'ACTIVE', label: 'Aktywne' },
            { key: 'PAUSED', label: 'Wstrzymane' },
            { key: 'DISABLED', label: 'Wyłączone' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                statusFilter === filter.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors duration-150 shadow-sm">
          <Plus className="w-4 h-4" />
          Dodaj agenta
        </button>
      </div>

      {/* Agent cards grid */}
      {filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AIAgentCard
              key={agent.id}
              agent={agent}
              onToggle={() => handleToggle(agent.id, agent.status)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Brak agentów AI</h3>
          <p className="text-xs text-gray-400 mb-4">
            {statusFilter !== 'ALL'
              ? 'Nie znaleziono agentów o wybranym statusie'
              : 'Dodaj pierwszego agenta AI do swojego zespołu'}
          </p>
          {statusFilter === 'ALL' && (
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
              Dodaj agenta
            </button>
          )}
        </div>
      )}
    </div>
  );
}
