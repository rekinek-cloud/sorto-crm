'use client';

import React, { useState } from 'react';
import { RefreshCw, ArrowLeft, CalendarDays, Clock, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
  { value: 'weekly', label: 'Co tydzien' },
  { value: 'biweekly', label: 'Co 2 tygodnie' },
  { value: 'monthly', label: 'Co miesiac' },
  { value: 'quarterly', label: 'Co kwartal' },
  { value: 'yearly', label: 'Co rok' },
  { value: 'custom', label: 'Niestandardowa' }
];

const streams = [
  'Inbox',
  'W trakcie',
  'Oczekujace',
  'Someday/Maybe'
];

const priorities = [
  { value: 'high', label: 'Wysoki', color: 'text-red-600' },
  { value: 'medium', label: 'Sredni', color: 'text-yellow-600' },
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
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <RefreshCw className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nowe zadanie cykliczne</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Utworz zadanie powtarzajace sie automatycznie</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Informacje podstawowe</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tytul zadania *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="np. Przeglad tygodniowy"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Opis
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Dodaj szczegoly zadania..."
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Strumien docelowy
                </label>
                <select
                  name="stream"
                  value={form.stream}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                >
                  {streams.map(stream => (
                    <option key={stream} value={stream}>{stream}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Priorytet
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
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
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Harmonogram
            </div>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Czestotliwosc *
              </label>
              <select
                name="frequency"
                value={form.frequency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
              >
                {frequencies.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>

            {form.frequency === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Co ile dni?
                </label>
                <input
                  type="number"
                  name="customDays"
                  value={form.customDays}
                  onChange={handleChange}
                  min="1"
                  max="365"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data rozpoczecia *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data zakonczenia (opcjonalnie)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Preferowana godzina
                </div>
              </label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tagi
            </div>
          </h2>
          <input
            type="text"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Wpisz tagi oddzielone przecinkami..."
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">np. przeglad, gtd, rutyna</p>
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800/30 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Podglad harmonogramu</h3>
          <div className="text-slate-700 dark:text-slate-300">
            {form.title || 'Nowe zadanie'} bedzie tworzone{' '}
            <span className="font-medium text-purple-700 dark:text-purple-400">
              {frequencies.find(f => f.value === form.frequency)?.label.toLowerCase()}
            </span>
            {form.frequency === 'custom' && ` (co ${form.customDays} dni)`}
            {form.time && ` o godzinie ${form.time}`}
            , poczawszy od <span className="font-medium">{form.startDate || 'dzisiaj'}</span>
            {form.endDate && ` do ${form.endDate}`}.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300"
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Utworz zadanie cykliczne
          </button>
        </div>
      </form>
    </PageShell>
  );
}
