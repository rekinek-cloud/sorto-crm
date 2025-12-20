'use client';

import React, { useState } from 'react';
import { ArrowPathIcon, ArrowLeftIcon, CalendarDaysIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface RecurringTaskForm {
  title: string;
  description: string;
  frequency: string;
  customDays: number;
  startDate: string;
  endDate: string;
  time: string;
  stream: string;
  priority: string;
  tags: string;
}

const frequencies = [
  { value: 'daily', label: 'Codziennie' },
  { value: 'weekly', label: 'Co tydzień' },
  { value: 'biweekly', label: 'Co 2 tygodnie' },
  { value: 'monthly', label: 'Co miesiąc' },
  { value: 'quarterly', label: 'Co kwartał' },
  { value: 'yearly', label: 'Co rok' },
  { value: 'custom', label: 'Niestandardowa' }
];

const streams = [
  'Inbox',
  'W trakcie',
  'Oczekujące',
  'Someday/Maybe'
];

const priorities = [
  { value: 'high', label: 'Wysoki', color: 'text-red-600' },
  { value: 'medium', label: 'Średni', color: 'text-yellow-600' },
  { value: 'low', label: 'Niski', color: 'text-blue-600' }
];

export default function NewRecurringTaskPage() {
  const router = useRouter();
  const [form, setForm] = useState<RecurringTaskForm>({
    title: '',
    description: '',
    frequency: 'weekly',
    customDays: 7,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    time: '09:00',
    stream: 'Inbox',
    priority: 'medium',
    tags: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save recurring task
    router.push('/dashboard/recurring-tasks');
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ArrowPathIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nowe zadanie cykliczne</h1>
            <p className="text-sm text-gray-600">Utwórz zadanie powtarzające się automatycznie</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacje podstawowe</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł zadania *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="np. Przegląd tygodniowy GTD"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Dodaj szczegóły zadania..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strumień docelowy
                </label>
                <select
                  name="stream"
                  value={form.stream}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {streams.map(stream => (
                    <option key={stream} value={stream}>{stream}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorytet
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5" />
              Harmonogram
            </div>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Częstotliwość *
              </label>
              <select
                name="frequency"
                value={form.frequency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {frequencies.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>

            {form.frequency === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Co ile dni?
                </label>
                <input
                  type="number"
                  name="customDays"
                  value={form.customDays}
                  onChange={handleChange}
                  min="1"
                  max="365"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data rozpoczęcia *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data zakończenia (opcjonalnie)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Preferowana godzina
                </div>
              </label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <div className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Tagi
            </div>
          </h2>
          <input
            type="text"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Wpisz tagi oddzielone przecinkami..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <p className="text-sm text-gray-500 mt-2">np. przegląd, gtd, rutyna</p>
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Podgląd harmonogramu</h3>
          <div className="text-gray-700">
            {form.title || 'Nowe zadanie'} będzie tworzone{' '}
            <span className="font-medium text-purple-700">
              {frequencies.find(f => f.value === form.frequency)?.label.toLowerCase()}
            </span>
            {form.frequency === 'custom' && ` (co ${form.customDays} dni)`}
            {form.time && ` o godzinie ${form.time}`}
            , począwszy od <span className="font-medium">{form.startDate || 'dzisiaj'}</span>
            {form.endDate && ` do ${form.endDate}`}.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Utwórz zadanie cykliczne
          </button>
        </div>
      </form>
    </div>
  );
}
