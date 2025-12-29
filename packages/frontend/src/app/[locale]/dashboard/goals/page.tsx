'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface Goal {
  id: string;
  result: string;
  measurement: string;
  deadline: string;
  background?: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  progress: number;
  status: 'active' | 'achieved' | 'failed' | 'paused';
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    result: '',
    measurement: '',
    deadline: '',
    background: '',
    targetValue: 100,
    unit: 'szt.'
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await apiClient.get('/goals');
      const data = response.data.data || response.data.goals || [];
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await apiClient.put(`/goals/${editingGoal.id}`, formData);
      } else {
        await apiClient.post('/goals', formData);
      }
      fetchGoals();
      closeModal();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten cel?')) return;
    try {
      await apiClient.delete(`/goals/${id}`);
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleUpdateProgress = async (id: string, currentValue: number) => {
    try {
      await apiClient.put(`/goals/${id}/progress`, { currentValue });
      fetchGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormData({
      result: '',
      measurement: '',
      deadline: '',
      background: '',
      targetValue: 100,
      unit: 'szt.'
    });
    setShowModal(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      result: goal.result,
      measurement: goal.measurement,
      deadline: goal.deadline?.split('T')[0] || '',
      background: goal.background || '',
      targetValue: goal.targetValue,
      unit: goal.unit
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const getDaysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cele Precyzyjne</h1>
          <p className="text-sm text-gray-600">Definiuj i sledz cele metoda RZUT</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nowy cel
        </button>
      </div>

      {/* RZUT Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metodologia RZUT</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <span className="font-semibold text-purple-700">R - Rezultat</span>
            <p className="text-sm text-gray-600 mt-1">Co chcesz osiagnac?</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <span className="font-semibold text-blue-700">Z - Zmierzalnosc</span>
            <p className="text-sm text-gray-600 mt-1">Jak zmierzysz sukces?</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <span className="font-semibold text-green-700">U - Ujscie</span>
            <p className="text-sm text-gray-600 mt-1">Kiedy deadline?</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <span className="font-semibold text-amber-700">T - Tlo</span>
            <p className="text-sm text-gray-600 mt-1">Dlaczego to wazne?</p>
          </div>
        </div>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zdefiniowanych celow</h3>
          <p className="text-gray-600 mb-4">Zacznij od zdefiniowania celow metoda RZUT</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Utworz pierwszy cel
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => {
            const daysLeft = getDaysLeft(goal.deadline);
            const isOverdue = daysLeft < 0;
            const isUrgent = daysLeft >= 0 && daysLeft <= 7;

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer ${
                  goal.status === 'achieved' ? 'border-green-300 bg-green-50' :
                  isOverdue ? 'border-red-300' :
                  isUrgent ? 'border-amber-300' : 'border-gray-200'
                }`}
                onClick={() => openEditModal(goal)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{goal.result}</h3>
                      {goal.status === 'achieved' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Osiagniety
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{goal.measurement}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(goal); }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                    <span className="font-medium text-purple-600">{goal.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        goal.status === 'achieved' ? 'bg-green-500' :
                        goal.progress >= 75 ? 'bg-purple-600' :
                        goal.progress >= 50 ? 'bg-blue-500' :
                        goal.progress >= 25 ? 'bg-amber-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Quick Update */}
                {goal.status === 'active' && (
                  <div className="flex items-center gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateProgress(goal.id, goal.currentValue + 1); }}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                    >
                      +1
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateProgress(goal.id, goal.currentValue + 5); }}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                    >
                      +5
                    </button>
                    <input
                      type="number"
                      value={goal.currentValue}
                      onChange={(e) => handleUpdateProgress(goal.id, Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-24 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                      min="0"
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span className={isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-amber-600 font-medium' : ''}>
                    {isOverdue ? `Przeterminowany o ${Math.abs(daysLeft)} dni` :
                     daysLeft === 0 ? 'Deadline dzis!' :
                     `${daysLeft} dni do deadline`}
                  </span>
                  {goal.background && (
                    <span className="text-gray-400 truncate max-w-[200px]">{goal.background}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingGoal ? 'Edytuj cel' : 'Nowy Cel (RZUT)'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  R - Rezultat
                </label>
                <input
                  type="text"
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  placeholder="Co chcesz osiagnac?"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Z - Zmierzalnosc
                </label>
                <input
                  type="text"
                  value={formData.measurement}
                  onChange={(e) => setFormData({ ...formData, measurement: e.target.value })}
                  placeholder="Jak zmierzysz sukces?"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-xs text-gray-500">Wartosc docelowa</label>
                    <input
                      type="number"
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Jednostka</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="np. szt., PLN, %"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  U - Ujscie (deadline)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  T - Tlo (opcjonalne)
                </label>
                <textarea
                  value={formData.background}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  placeholder="Dlaczego ten cel jest wazny?"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingGoal ? 'Zapisz' : 'Utworz cel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
