'use client';

import { useState, useEffect } from 'react';
import {
  getAllTaskRelationships,
  addTaskDependency,
  removeTaskDependency
} from '@/lib/api/taskRelationships';
import { AllTaskRelationships, Task, CreateTaskRelationshipRequest } from '@/types/taskRelationships';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Link2, Plus, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface NewRelationshipData {
  fromTaskId: string;
  toTaskId: string;
  type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
  lag?: string;
  notes?: string;
}

export default function TaskRelationshipsPage() {
  const [data, setData] = useState<AllTaskRelationships>({ relationships: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRelationship, setNewRelationship] = useState<NewRelationshipData>({
    fromTaskId: '',
    toTaskId: '',
    type: 'FINISH_TO_START'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllTaskRelationships();
      setData(result);
    } catch (err) {
      setError('Błąd podczas ładowania danych task relationships');
      console.error('Error loading task relationships:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRelationship = async () => {
    if (!newRelationship.fromTaskId || !newRelationship.toTaskId) {
      alert('Proszę wybrać oba zadania');
      return;
    }

    if (newRelationship.fromTaskId === newRelationship.toTaskId) {
      alert('Zadanie nie może zależeć od siebie');
      return;
    }

    try {
      const requestData: CreateTaskRelationshipRequest = {
        toTaskId: newRelationship.toTaskId,
        type: newRelationship.type,
        lag: newRelationship.lag || undefined,
        notes: newRelationship.notes || undefined
      };

      await addTaskDependency(newRelationship.fromTaskId, requestData);
      setShowAddModal(false);
      setNewRelationship({
        fromTaskId: '',
        toTaskId: '',
        type: 'FINISH_TO_START'
      });
      await loadData(); // Refresh data
    } catch (err) {
      alert('Błąd podczas dodawania dependency');
      console.error('Error adding dependency:', err);
    }
  };

  const handleRemoveRelationship = async (relationshipId: string, taskId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę zależność?')) return;

    try {
      await removeTaskDependency(taskId, relationshipId);
      await loadData(); // Refresh data
    } catch (err) {
      alert('Błąd podczas usuwania dependency');
      console.error('Error removing dependency:', err);
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      'FINISH_TO_START': 'Finish → Start',
      'START_TO_START': 'Start → Start',
      'FINISH_TO_FINISH': 'Finish → Finish',
      'START_TO_FINISH': 'Start → Finish'
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'NEW': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'WAITING': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'CANCELED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300';
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'LOW': 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300',
      'MEDIUM': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'HIGH': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'URGENT': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[priority as keyof typeof colors] || 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300';
  };

  if (loading) {
    return (
      <PageShell>
        <PageHeader
          title="Task Relationships"
          subtitle="Zarządzaj zależnościami między zadaniami"
          icon={Link2}
          iconColor="text-indigo-600"
        />
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            <span className="ml-2 text-slate-700 dark:text-slate-300">Ładowanie danych...</span>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader
          title="Task Relationships"
          subtitle="Zarządzaj zależnościami między zadaniami"
          icon={Link2}
          iconColor="text-indigo-600"
        />
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 dark:text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Błąd</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
            >
              Sprobuj ponownie
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Task Relationships"
        subtitle="Zarządzaj zależnościami między zadaniami"
        icon={Link2}
        iconColor="text-indigo-600"
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
          >
            <Link2 className="w-5 h-5 mr-2" />
            Połącz zadania
          </button>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Link2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wszystkie zależności</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{data.relationships.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Zadania z zależnościami</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {new Set([...data.relationships.map(r => r.fromTask.id), ...data.relationships.map(r => r.toTask.id)]).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ścieżka krytyczna</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {data.relationships.filter(r => r.isCriticalPath).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Relationships Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Zależności między zadaniami</h3>
        </div>

        {data.relationships.length === 0 ? (
          <div className="text-center py-12">
            <Link2 className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Brak zależności</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Jeszcze nie utworzono żadnych zależności między zadaniami</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
            >
              Dodaj pierwszą zależność
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Zadanie źródłowe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Typ zależności
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Zadanie docelowe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Opóźnienie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Notatki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-slate-800/30 divide-y divide-slate-200 dark:divide-slate-700">
                {data.relationships.map((relationship) => (
                  <tr key={relationship.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{relationship.fromTask.title}</div>
                        <div className="flex space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(relationship.fromTask.status)}`}>
                            {relationship.fromTask.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(relationship.fromTask.priority)}`}>
                            {relationship.fromTask.priority}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-slate-900 dark:text-slate-100">{getTypeLabel(relationship.type)}</span>
                        {relationship.isCriticalPath && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Krytyczna
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{relationship.toTask.title}</div>
                        <div className="flex space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(relationship.toTask.status)}`}>
                            {relationship.toTask.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(relationship.toTask.priority)}`}>
                            {relationship.toTask.priority}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {relationship.lag || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {relationship.notes ? (
                        <div className="max-w-xs truncate" title={relationship.notes}>
                          {relationship.notes}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveRelationship(relationship.id, relationship.toTask.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Relationship Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-600/50 dark:bg-slate-900/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-slate-200 dark:border-slate-700 w-96 shadow-lg rounded-2xl bg-white dark:bg-slate-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Dodaj zależność między zadaniami</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Zadanie źródłowe</label>
                  <select
                    value={newRelationship.fromTaskId}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, fromTaskId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Wybierz zadanie</option>
                    {data.tasks.map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Typ zależności</label>
                  <select
                    value={newRelationship.type}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, type: e.target.value as any }))}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="FINISH_TO_START">Finish → Start</option>
                    <option value="START_TO_START">Start → Start</option>
                    <option value="FINISH_TO_FINISH">Finish → Finish</option>
                    <option value="START_TO_FINISH">Start → Finish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Zadanie docelowe</label>
                  <select
                    value={newRelationship.toTaskId}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, toTaskId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Wybierz zadanie</option>
                    {data.tasks.filter(task => task.id !== newRelationship.fromTaskId).map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Opóźnienie (opcjonalne)</label>
                  <input
                    type="text"
                    value={newRelationship.lag || ''}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, lag: e.target.value }))}
                    placeholder="np. 1d, 2h"
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notatki (opcjonalne)</label>
                  <textarea
                    value={newRelationship.notes || ''}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddRelationship}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
                >
                  Dodaj zależność
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
