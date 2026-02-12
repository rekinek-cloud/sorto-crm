'use client';

import { Pause, Play, Settings, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { AIAgent } from '@/types/holding';

interface Props {
  agent: AIAgent;
  onEdit?: () => void;
  onToggle?: () => void;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ACTIVE: { label: 'Aktywny', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PAUSED: { label: 'Wstrzymany', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  DISABLED: { label: 'Wyłączony', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

export default function AIAgentCard({ agent, onEdit, onToggle }: Props) {
  const status = statusConfig[agent.status] || statusConfig.DISABLED;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-2xl">
              {agent.avatar || '\u{1F916}'}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{agent.name}</h3>
              <p className="text-xs text-gray-500">{agent.role}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {agent.description && (
          <p className="text-xs text-gray-500 mb-4 line-clamp-2">{agent.description}</p>
        )}

        {/* Autonomy Level */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 font-medium">Autonomia</span>
            <span className="text-xs text-gray-600 font-semibold">
              Poziom {agent.autonomyLevel}
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  level <= agent.autonomyLevel
                    ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                    : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Capabilities */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {agent.capabilities.slice(0, 4).map((cap) => (
              <span
                key={cap}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium"
              >
                <Zap className="w-2.5 h-2.5" />
                {cap}
              </span>
            ))}
            {agent.capabilities.length > 4 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 text-[10px] font-medium">
                +{agent.capabilities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-xs text-gray-400">Zadania</p>
              <p className="text-sm font-semibold text-gray-900">{agent.tasksCompleted}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-400">Skuteczność</p>
              <p className="text-sm font-semibold text-gray-900">{agent.successRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
            agent.status === 'ACTIVE'
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
        >
          {agent.status === 'ACTIVE' ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              Wstrzymaj
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Aktywuj
            </>
          )}
        </button>
        <button
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors duration-150"
        >
          <Settings className="w-3.5 h-3.5" />
          Edytuj
        </button>
      </div>
    </div>
  );
}
