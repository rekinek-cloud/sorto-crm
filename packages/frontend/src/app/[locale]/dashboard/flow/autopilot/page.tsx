'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Undo2,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { flowApi, AutopilotHistoryItem, FLOW_ACTION_LABELS } from '@/lib/api/flow';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
      toast.error('Nie udalo sie zaladowac historii');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (historyId: string) => {
    setUndoingId(historyId);
    try {
      await flowApi.autopilot.undo(historyId);
      toast.success('Akcja cofnieta - element wrocil do Zrodla');
      await loadHistory();
    } catch (error: any) {
      console.error('Undo failed:', error);
      toast.error(error?.response?.data?.error || 'Nie udalo sie cofnac akcji');
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
      color: 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300',
    };
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Historia Autopilota"
        subtitle="Automatycznie wykonane akcje AI z mozliwoscia cofniecia"
        icon={Zap}
        iconColor="text-amber-600"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Wykonane</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Undo2 className="h-4 w-4 text-red-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Cofniete</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.undone}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Trafnosc</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.accuracyPercent}%</div>
        </div>
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <Zap className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Brak historii autopilota</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Wlacz autopilota w ustawieniach, aby AI automatycznie przetwarza elementy
          </p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {history.map((item) => {
              const actionInfo = getActionInfo(item.action);
              const confidence = Math.round((item.confidence || 0) * 100);

              return (
                <div
                  key={item.id}
                  className={`p-4 ${item.undone ? 'bg-slate-50 dark:bg-slate-800/50 opacity-60' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${actionInfo.color}`}>
                          {actionInfo.emoji} {actionInfo.label}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{confidence}%</span>
                        {item.sourceType && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">{item.sourceType}</span>
                        )}
                        {item.undone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30">
                            Cofnieto
                          </span>
                        )}
                      </div>
                      <p className={`text-sm text-slate-700 dark:text-slate-300 ${item.undone ? 'line-through' : ''}`}>
                        {item.content || '(brak tresci)'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(item.completedAt)}</p>
                    </div>

                    {!item.undone && (
                      <button
                        onClick={() => handleUndo(item.id)}
                        disabled={undoingId === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {undoingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Undo2 className="h-4 w-4" />
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
    </PageShell>
  );
}
