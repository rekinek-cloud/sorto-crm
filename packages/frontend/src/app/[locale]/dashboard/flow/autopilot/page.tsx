'use client';

import React, { useState, useEffect } from 'react';
import {
  BoltIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { flowApi, AutopilotHistoryItem, FLOW_ACTION_LABELS } from '@/lib/api/flow';

export default function AutopilotHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AutopilotHistoryItem[]>([]);
  const [stats, setStats] = useState({ total: 0, undone: 0, accuracyPercent: 100 });
  const [undoingId, setUndoingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await flowApi.autopilot.getHistory({ limit: 100 });
      setHistory(data.history);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load autopilot history:', error);
      toast.error('Nie udało się załadować historii');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (historyId: string) => {
    setUndoingId(historyId);
    try {
      await flowApi.autopilot.undo(historyId);
      toast.success('Akcja cofnięta - element wrócił do Źródła');
      await loadHistory();
    } catch (error: any) {
      console.error('Undo failed:', error);
      toast.error(error?.response?.data?.error || 'Nie udało się cofnąć akcji');
    } finally {
      setUndoingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionInfo = (action: string) => {
    return FLOW_ACTION_LABELS[action as keyof typeof FLOW_ACTION_LABELS] || {
      label: action,
      emoji: '?',
      color: 'bg-gray-50 border-gray-200 text-gray-800',
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg">
          <BoltIcon className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historia Autopilota</h1>
          <p className="text-sm text-gray-600">Automatycznie wykonane akcje AI z możliwością cofnięcia</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BoltIcon className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-gray-500">Wykonane</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUturnLeftIcon className="h-4 w-4 text-red-500" />
            <span className="text-sm text-gray-500">Cofnięte</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.undone}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ChartBarIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-500">Trafność</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.accuracyPercent}%</div>
        </div>
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BoltIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Brak historii autopilota</p>
          <p className="text-sm text-gray-400 mt-1">
            Włącz autopilota w ustawieniach, aby AI automatycznie przetwarzał elementy
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {history.map((item) => {
              const actionInfo = getActionInfo(item.action);
              const confidence = Math.round((item.confidence || 0) * 100);

              return (
                <div
                  key={item.id}
                  className={`p-4 ${item.undone ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${actionInfo.color}`}>
                          {actionInfo.emoji} {actionInfo.label}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{confidence}%</span>
                        {item.sourceType && (
                          <span className="text-xs text-gray-400">{item.sourceType}</span>
                        )}
                        {item.undone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                            Cofnięto
                          </span>
                        )}
                      </div>
                      <p className={`text-sm text-gray-700 ${item.undone ? 'line-through' : ''}`}>
                        {item.content || '(brak treści)'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(item.completedAt)}</p>
                    </div>

                    {!item.undone && (
                      <button
                        onClick={() => handleUndo(item.id)}
                        disabled={undoingId === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {undoingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ArrowUturnLeftIcon className="h-4 w-4" />
                        )}
                        Cofnij
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
