'use client';

import React, { useState, useEffect } from 'react';
import { goalsApi } from '@/lib/api/goals';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Target, Plus, Pencil, Trash2, CheckCircle, X } from 'lucide-react';

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
      const data = await goalsApi.getGoals();
      const goalsList = data.data || data.goals || [];
      setGoals(goalsList);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Nie udalo sie pobrac celow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await goalsApi.updateGoal(editingGoal.id, formData);
        toast.success('Cel zaktualizowany');
      } else {
        await goalsApi.createGoal(formData);
        toast.success('Cel utworzony');
      }
      fetchGoals();
      closeModal();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Nie udalo sie zapisac celu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten cel?')) return;
    try {
      await goalsApi.deleteGoal(id);
      toast.success('Cel usuniety');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Nie udalo sie usunac celu');
    }
  };

  const handleUpdateProgress = async (id: string, currentValue: number) => {
    try {
      await goalsApi.updateProgress(id, currentValue);
      fetchGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Nie udalo sie zaktualizowac postepu');
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
      <PageShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Cele Precyzyjne"
          subtitle="Definiuj i sledz cele metoda RZUT"
          icon={Target}
          iconColor="text-purple-600"
          actions={
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nowy cel
            </button>
          }
        />

        {/* RZUT Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Metodologia RZUT</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-lg p-4 border border-purple-100 dark:border-purple-800/40">
              <span className="font-semibold text-purple-700 dark:text-purple-400">R - Rezultat</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Co chcesz osiagnac?</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-lg p-4 border border-blue-100 dark:border-blue-800/40">
              <span className="font-semibold text-blue-700 dark:text-blue-400">Z - Zmierzalnosc</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Jak zmierzysz sukces?</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-lg p-4 border border-green-100 dark:border-green-800/40">
              <span className="font-semibold text-green-700 dark:text-green-400">U - Ujscie</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Kiedy deadline?</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-lg p-4 border border-amber-100 dark:border-amber-800/40">
              <span className="font-semibold text-amber-700 dark:text-amber-400">T - Tlo</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Dlaczego to wazne?</p>
            </div>
          </div>

          <details className="mt-4">
            <summary className="text-sm font-medium text-purple-700 dark:text-purple-400 cursor-pointer hover:text-purple-900 dark:hover:text-purple-300">
              Przykladowe cele CRM
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-sm">
                <p className="font-medium text-slate-900 dark:text-slate-100">Wzrost sprzedazy premium</p>
                <p className="text-slate-500 dark:text-slate-400 mt-1"><span className="text-purple-600 dark:text-purple-400">R:</span> Podpisac 10 kontraktow B2B</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="text-blue-600 dark:text-blue-400">Z:</span> Liczba podpisanych umow</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="text-green-600 dark:text-green-400">U:</span> 31 marca 2026</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="text-amber-600 dark:text-amber-400">T:</span> Zwiekszenie ARR o 40k PLN</p>
              </div>
              <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-sm">
                <p className="font-medium text-slate-900 dark:text-slate-100">Automatyzacja procesow</p>
                <p className="text-slate-500 dark:text-slate-400 mt-1"><span className="text-purple-600 dark:text-purple-400">R:</span> Wdrozyc 5 automatyzacji email</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="text-blue-600 dark:text-blue-400">Z:</span> Liczba aktywnych kampanii</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="text-green-600 dark:text-green-400">U:</span> 28 lutego 2026</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="text-amber-600 dark:text-amber-400">T:</span> Oszczedzic 10h tygodniowo</p>
              </div>
              <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-sm">
                <p className="font-medium text-slate-900 dark:text-slate-100">Rozwoj zespolu</p>
                <p className="text-slate-500 dark:text-slate-400 mt-1"><span className="text-purple-600 dark:text-purple-400">R:</span> Przeszkolenie zespolu z STREAMS</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="text-blue-600 dark:text-blue-400">Z:</span> % przeszkolonych czlonkow</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="text-green-600 dark:text-green-400">U:</span> 30 kwietnia 2026</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="text-amber-600 dark:text-amber-400">T:</span> Zwiekszenie efektywnosci o 25%</p>
              </div>
            </div>
          </details>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Cele pomagaja sledzic kwartalne i roczne cele biznesowe, laczyc codzienne zadania z wiekszymi celami firmy i mierzyc wyniki zespolu.
          </p>
        </div>

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Brak zdefiniowanych celow</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Zacznij od zdefiniowania celow metoda RZUT</p>
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
                  className={`bg-white/80 backdrop-blur-xl border dark:bg-slate-800/80 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer ${
                    goal.status === 'achieved' ? 'border-green-300 dark:border-green-700 bg-green-50/80 dark:bg-green-900/20' :
                    isOverdue ? 'border-red-300 dark:border-red-700' :
                    isUrgent ? 'border-amber-300 dark:border-amber-700' : 'border-white/20 dark:border-slate-700/30'
                  }`}
                  onClick={() => openEditModal(goal)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{goal.result}</h3>
                        {goal.status === 'achieved' && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                            Osiagniety
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{goal.measurement}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(goal); }}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-400">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          goal.status === 'achieved' ? 'bg-green-500' :
                          goal.progress >= 75 ? 'bg-purple-600' :
                          goal.progress >= 50 ? 'bg-blue-500' :
                          goal.progress >= 25 ? 'bg-amber-500' : 'bg-slate-400 dark:bg-slate-500'
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
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/60"
                      >
                        +1
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateProgress(goal.id, goal.currentValue + 5); }}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/60"
                      >
                        +5
                      </button>
                      <input
                        type="number"
                        value={goal.currentValue}
                        onChange={(e) => handleUpdateProgress(goal.id, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-24 px-3 py-1 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        min="0"
                      />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : isUrgent ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                      {isOverdue ? `Przeterminowany o ${Math.abs(daysLeft)} dni` :
                       daysLeft === 0 ? 'Deadline dzis!' :
                       `${daysLeft} dni do deadline`}
                    </span>
                    {goal.background && (
                      <span className="text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{goal.background}</span>
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {editingGoal ? 'Edytuj cel' : 'Nowy Cel (RZUT)'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">
                    R - Rezultat
                  </label>
                  <input
                    type="text"
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    placeholder="Co chcesz osiagnac?"
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                    Z - Zmierzalnosc
                  </label>
                  <input
                    type="text"
                    value={formData.measurement}
                    onChange={(e) => setFormData({ ...formData, measurement: e.target.value })}
                    placeholder="Jak zmierzysz sukces?"
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400">Wartosc docelowa</label>
                      <input
                        type="number"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400">Jednostka</label>
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="np. szt., PLN, %"
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                    U - Ujscie (deadline)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                    T - Tlo (opcjonalne)
                  </label>
                  <textarea
                    value={formData.background}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    placeholder="Dlaczego ten cel jest wazny?"
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
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
    </PageShell>
  );
}
