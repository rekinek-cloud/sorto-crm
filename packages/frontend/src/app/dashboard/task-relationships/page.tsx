'use client';

import { useState, useEffect } from 'react';
import { 
  getAllTaskRelationships,
  addTaskDependency,
  removeTaskDependency 
} from '@/lib/api/taskRelationships';
import { AllTaskRelationships, Task, CreateTaskRelationshipRequest } from '@/types/taskRelationships';

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
      'NEW': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'WAITING': 'bg-orange-100 text-orange-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELED': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'LOW': 'bg-gray-100 text-gray-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Task Relationships</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Ładowanie danych...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Task Relationships</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Błąd</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadData}
              className="btn btn-primary"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Relationships</h1>
          <p className="text-gray-600">Zarządzaj zależościami między zadaniami</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Połącz zadania
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wszystkie zależności</p>
              <p className="text-2xl font-semibold text-gray-900">{data.relationships.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Zadania z zależnościami</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set([...data.relationships.map(r => r.fromTask.id), ...data.relationships.map(r => r.toTask.id)]).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ścieżka krytyczna</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.relationships.filter(r => r.isCriticalPath).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Relationships Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Zależności między zadaniami</h3>
        </div>
        
        {data.relationships.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak zależności</h3>
            <p className="text-gray-600 mb-4">Jeszcze nie utworzono żadnych zależności między zadaniami</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              Dodaj pierwszą zależność
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zadanie źródłowe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ zależności
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zadanie docelowe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opóźnienie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notatki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.relationships.map((relationship) => (
                  <tr key={relationship.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{relationship.fromTask.title}</div>
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
                        <span className="text-sm text-gray-900">{getTypeLabel(relationship.type)}</span>
                        {relationship.isCriticalPath && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Krytyczna
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{relationship.toTask.title}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {relationship.lag || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {relationship.notes ? (
                        <div className="max-w-xs truncate" title={relationship.notes}>
                          {relationship.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveRelationship(relationship.id, relationship.toTask.id)}
                        className="text-red-600 hover:text-red-900"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dodaj zależność między zadaniami</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zadanie źródłowe</label>
                  <select
                    value={newRelationship.fromTaskId}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, fromTaskId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Wybierz zadanie</option>
                    {data.tasks.map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Typ zależności</label>
                  <select
                    value={newRelationship.type}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, type: e.target.value as any }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="FINISH_TO_START">Finish → Start</option>
                    <option value="START_TO_START">Start → Start</option>
                    <option value="FINISH_TO_FINISH">Finish → Finish</option>
                    <option value="START_TO_FINISH">Start → Finish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Zadanie docelowe</label>
                  <select
                    value={newRelationship.toTaskId}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, toTaskId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Wybierz zadanie</option>
                    {data.tasks.filter(task => task.id !== newRelationship.fromTaskId).map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Opóźnienie (opcjonalne)</label>
                  <input
                    type="text"
                    value={newRelationship.lag || ''}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, lag: e.target.value }))}
                    placeholder="np. 1d, 2h"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notatki (opcjonalne)</label>
                  <textarea
                    value={newRelationship.notes || ''}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddRelationship}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Dodaj zależność
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}