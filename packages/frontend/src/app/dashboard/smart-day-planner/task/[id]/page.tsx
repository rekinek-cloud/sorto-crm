'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { smartDayPlannerApi } from '@/lib/api/smartDayPlanner';

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
    PLANNED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800', 
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    RESCHEDULED: 'bg-purple-100 text-purple-800',
    OVERDUE: 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800'
  };

  const energyColors = {
    HIGH: 'bg-red-50 text-red-700',
    MEDIUM: 'bg-yellow-50 text-yellow-700',
    LOW: 'bg-blue-50 text-blue-700',
    CREATIVE: 'bg-purple-50 text-purple-700',
    ADMINISTRATIVE: 'bg-gray-50 text-gray-700'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Zadanie nie znalezione</h2>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
          >
            Wróć
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header z nawigacją */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Wróć do planu dnia
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <p className="text-gray-600 mt-2">
                Zaplanowane na {new Date(task.scheduledDate).toLocaleDateString('pl-PL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex space-x-3">
              {task.status === 'PLANNED' && (
                <button
                  onClick={startTask}
                  disabled={updating}
                  className="btn btn-primary"
                >
                  🚀 Rozpocznij
                </button>
              )}
              {task.status === 'IN_PROGRESS' && (
                <button
                  onClick={completeTask}
                  disabled={updating}
                  className="btn btn-success"
                >
                  ✅ Zakończ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Główna zawartość */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lewa kolumna - Szczegóły */}
          <div className="lg:col-span-2 space-y-6">
            {/* Opis */}
            {task.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Opis</h3>
                <p className="text-gray-700 leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Zadanie utworzone</p>
                    <p className="text-xs text-gray-500">
                      {new Date(task.createdAt).toLocaleString('pl-PL')}
                    </p>
                  </div>
                </div>
                
                {task.startedAt && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Rozpoczęte</p>
                      <p className="text-xs text-gray-500">
                        {new Date(task.startedAt).toLocaleString('pl-PL')}
                      </p>
                    </div>
                  </div>
                )}
                
                {task.completedAt && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Zakończone</p>
                      <p className="text-xs text-gray-500">
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
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Szczegóły</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Priorytet</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Energia wymagana</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${energyColors[task.energyRequired]}`}>
                      {task.energyRequired}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Kontekst</label>
                  <div className="mt-1">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {task.context}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Szacowany czas</label>
                  <p className="mt-1 text-sm text-gray-900">{task.estimatedMinutes} minut</p>
                </div>

                {task.actualMinutes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rzeczywisty czas</label>
                    <p className="mt-1 text-sm text-gray-900">{task.actualMinutes} minut</p>
                  </div>
                )}
              </div>
            </div>

            {/* Możliwości przeniesienia */}
            {task.wasRescheduled && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Przeniesione</h4>
                <p className="text-xs text-yellow-700">
                  {task.rescheduledReason && `Powód: ${task.rescheduledReason}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}