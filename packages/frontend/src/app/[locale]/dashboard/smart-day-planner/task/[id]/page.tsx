'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { smartDayPlannerApi } from '@/lib/api/smartDayPlanner';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClipboardList, ArrowLeft, Play, CheckCircle2, Clock, Zap, Tag } from 'lucide-react';

interface ScheduledTask {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  taskId?: string;
  energyTimeBlockId: string;
  context: string;
  energyRequired: 'HIGH' | 'MEDIUM' | 'LOW' | 'CREATIVE' | 'ADMINISTRATIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'OVERDUE';
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  wasRescheduled: boolean;
  rescheduledFrom?: string;
  rescheduledReason?: string;
  userId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export default function ScheduledTaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<ScheduledTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Kolory dla statusów
  const statusColors = {
    PLANNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CANCELLED: 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300',
    RESCHEDULED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };

  const priorityColors = {
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  };

  const energyColors = {
    HIGH: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    MEDIUM: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    LOW: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    CREATIVE: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    ADMINISTRATIVE: 'bg-slate-50 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300'
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      // TODO: Dodać endpoint dla szczegółów scheduled task
      // const response = await smartDayPlannerApi.getScheduledTask(taskId);

      // Mock data na razie
      const mockTask: ScheduledTask = {
        id: taskId,
        title: 'Przeprowadzić code review PR #123',
        description: 'Przegląd kodu dla nowej funkcjonalności autoryzacji. Sprawdzić security, performance i code quality.',
        estimatedMinutes: 45,
        actualMinutes: undefined,
        taskId: undefined,
        energyTimeBlockId: 'block-123',
        context: '@computer',
        energyRequired: 'HIGH',
        priority: 'HIGH',
        status: 'PLANNED',
        scheduledDate: new Date().toISOString(),
        wasRescheduled: false,
        userId: 'user-123',
        organizationId: 'org-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTask(mockTask);
    } catch (error: any) {
      console.error('Error fetching task details:', error);
      toast.error('Błąd podczas ładowania szczegółów zadania');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      // TODO: Dodać endpoint dla aktualizacji statusu
      // await smartDayPlannerApi.updateScheduledTaskStatus(taskId, newStatus);

      setTask(prev => prev ? { ...prev, status: newStatus as any } : null);
      toast.success('Status zadania zaktualizowany');
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast.error('Błąd podczas aktualizacji statusu');
    } finally {
      setUpdating(false);
    }
  };

  const startTask = () => {
    updateTaskStatus('IN_PROGRESS');
    setTask(prev => prev ? { ...prev, startedAt: new Date().toISOString() } : null);
  };

  const completeTask = () => {
    updateTaskStatus('COMPLETED');
    setTask(prev => prev ? {
      ...prev,
      completedAt: new Date().toISOString(),
      actualMinutes: task?.estimatedMinutes || 0
    } : null);
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </PageShell>
    );
  }

  if (!task) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Zadanie nie znalezione</h2>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              Wroc
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Back navigation */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Wroc do planu dnia
        </button>
      </div>

      <PageHeader
        title={task.title}
        subtitle={`Zaplanowane na ${new Date(task.scheduledDate).toLocaleDateString('pl-PL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`}
        icon={ClipboardList}
        iconColor="text-indigo-600"
        actions={
          <div className="flex space-x-3">
            {task.status === 'PLANNED' && (
              <button
                onClick={startTask}
                disabled={updating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <Play className="w-4 h-4" />
                Rozpocznij
              </button>
            )}
            {task.status === 'IN_PROGRESS' && (
              <button
                onClick={completeTask}
                disabled={updating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Zakoncz
              </button>
            )}
          </div>
        }
      />

      {/* Glowna zawartosc */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lewa kolumna - Szczegoly */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opis */}
          {task.description && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Opis</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Zadanie utworzone</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(task.createdAt).toLocaleString('pl-PL')}
                  </p>
                </div>
              </div>

              {task.startedAt && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Rozpoczete</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(task.startedAt).toLocaleString('pl-PL')}
                    </p>
                  </div>
                </div>
              )}

              {task.completedAt && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Zakonczone</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(task.completedAt).toLocaleString('pl-PL')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prawa kolumna - Metadane */}
        <div className="space-y-6">
          {/* Status i podstawowe info */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Szczegoly</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}>
                    {task.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Priorytet</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Energia wymagana</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${energyColors[task.energyRequired]}`}>
                    {task.energyRequired}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Kontekst</label>
                <div className="mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300">
                    {task.context}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Szacowany czas</label>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{task.estimatedMinutes} minut</p>
              </div>

              {task.actualMinutes && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Rzeczywisty czas</label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{task.actualMinutes} minut</p>
                </div>
              )}
            </div>
          </div>

          {/* Mozliwosci przeniesienia */}
          {task.wasRescheduled && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-2xl p-4">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">Przeniesione</h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                {task.rescheduledReason && `Powod: ${task.rescheduledReason}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
