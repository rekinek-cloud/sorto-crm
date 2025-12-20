'use client';

import React, { useState, useEffect } from 'react';
import { PreciseGoal, Stream, CreateGoalRequest, GoalStatus } from '@/types/streams';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface GoalFormProps {
  goal?: PreciseGoal;
  streams: Stream[];
  onSubmit: (data: CreateGoalRequest) => void;
  onCancel: () => void;
}

export default function GoalForm({ goal, streams, onSubmit, onCancel }: GoalFormProps) {
  const [formData, setFormData] = useState({
    result: '',
    measurement: '',
    deadline: '',
    background: '',
    targetValue: 100,
    currentValue: 0,
    unit: '%',
    streamId: '',
    status: 'active' as GoalStatus,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setFormData({
        result: goal.result,
        measurement: goal.measurement,
        deadline: goal.deadline.split('T')[0],
        background: goal.background || '',
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        unit: goal.unit,
        streamId: goal.streamId || '',
        status: goal.status,
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.result.trim()) {
      alert('Rezultat jest wymagany');
      return;
    }

    if (!formData.measurement.trim()) {
      alert('Zmierzalność jest wymagana');
      return;
    }

    if (!formData.deadline) {
      alert('Termin (Ujście) jest wymagany');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        result: formData.result,
        measurement: formData.measurement,
        deadline: formData.deadline,
        background: formData.background || undefined,
        targetValue: formData.targetValue,
        unit: formData.unit,
        streamId: formData.streamId || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Common units for goals
  const commonUnits = ['%', 'szt.', 'PLN', 'USD', 'EUR', 'h', 'dni', 'kg', 'km', 'pkt'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {goal ? 'Edytuj cel' : 'Nowy cel precyzyjny'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Zdefiniuj cel metodą RZUT
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* R - Rezultat */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-blue-600 bg-white px-2 py-0.5 rounded">R</span>
              <label className="text-sm font-semibold text-blue-900">
                Rezultat - Co konkretnie powstanie?
              </label>
              <span className="text-red-500">*</span>
            </div>
            <input
              type="text"
              value={formData.result}
              onChange={(e) => handleChange('result', e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="np. Ukończony kurs języka angielskiego na poziomie B2"
              required
            />
            <p className="mt-1 text-xs text-blue-700">
              Opisz konkretny, namacalny efekt końcowy
            </p>
          </div>

          {/* Z - Zmierzalność */}
          <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-cyan-600 bg-white px-2 py-0.5 rounded">Z</span>
              <label className="text-sm font-semibold text-cyan-900">
                Zmierzalność - Po czym poznam sukces?
              </label>
              <span className="text-red-500">*</span>
            </div>
            <input
              type="text"
              value={formData.measurement}
              onChange={(e) => handleChange('measurement', e.target.value)}
              className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="np. Zdany egzamin FCE z wynikiem min. 160 pkt"
              required
            />

            {/* Target Value & Unit */}
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs text-cyan-700 mb-1">Wartość docelowa</label>
                <input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => handleChange('targetValue', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-700 mb-1">Jednostka</label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                >
                  {commonUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {goal && (
              <div className="mt-3">
                <label className="block text-xs text-cyan-700 mb-1">Aktualna wartość</label>
                <input
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => handleChange('currentValue', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  min={0}
                  max={formData.targetValue}
                />
              </div>
            )}
          </div>

          {/* U - Ujście (deadline) */}
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-teal-600 bg-white px-2 py-0.5 rounded">U</span>
              <label className="text-sm font-semibold text-teal-900">
                Ujście - Do kiedy?
              </label>
              <span className="text-red-500">*</span>
            </div>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
              className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <p className="mt-1 text-xs text-teal-700">
              Ustal konkretny termin realizacji celu
            </p>
          </div>

          {/* T - Tło */}
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-emerald-600 bg-white px-2 py-0.5 rounded">T</span>
              <label className="text-sm font-semibold text-emerald-900">
                Tło - Dlaczego ten cel?
              </label>
            </div>
            <textarea
              value={formData.background}
              onChange={(e) => handleChange('background', e.target.value)}
              className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={2}
              placeholder="np. Awans w pracy wymaga certyfikatu językowego, otworzy mi to nowe możliwości zawodowe"
            />
            <p className="mt-1 text-xs text-emerald-700">
              Opisz motywację i kontekst - dlaczego ten cel jest dla Ciebie ważny
            </p>
          </div>

          {/* Stream Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Przypisz do strumienia (opcjonalne)
            </label>
            <select
              value={formData.streamId}
              onChange={(e) => handleChange('streamId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Wybierz strumień --</option>
              {streams
                .filter((s) => (s.status as string) === 'ACTIVE')
                .map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status (only for editing) */}
          {goal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status celu
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Aktywny</option>
                <option value="paused">Wstrzymany</option>
                <option value="achieved">Osiągnięty</option>
                <option value="failed">Nieosiągnięty</option>
              </select>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isLoading}
          >
            Anuluj
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Zapisywanie...' : goal ? 'Zapisz zmiany' : 'Utwórz cel'}
          </button>
        </div>
      </div>
    </div>
  );
}
