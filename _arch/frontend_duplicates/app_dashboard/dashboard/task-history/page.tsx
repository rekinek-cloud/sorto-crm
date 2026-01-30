'use client';

import React, { useState } from 'react';
import { ClockIcon, FunnelIcon, MagnifyingGlassIcon, ArrowPathIcon, CheckCircleIcon, PencilIcon, TrashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface HistoryEntry {
  id: string;
  taskTitle: string;
  action: 'created' | 'updated' | 'completed' | 'deleted' | 'moved' | 'assigned';
  field?: string;
  oldValue?: string;
  newValue?: string;
  user: string;
  timestamp: string;
}

const mockHistory: HistoryEntry[] = [
  {
    id: '1',
    taskTitle: 'Przygotować prezentację Q4',
    action: 'completed',
    user: 'Jan Kowalski',
    timestamp: '2025-11-29 10:30'
  },
  {
    id: '2',
    taskTitle: 'Spotkanie z klientem ABC',
    action: 'moved',
    field: 'Strumień',
    oldValue: 'Inbox',
    newValue: 'W trakcie',
    user: 'Jan Kowalski',
    timestamp: '2025-11-29 09:15'
  },
  {
    id: '3',
    taskTitle: 'Review dokumentacji API',
    action: 'updated',
    field: 'Priorytet',
    oldValue: 'Średni',
    newValue: 'Wysoki',
    user: 'Anna Nowak',
    timestamp: '2025-11-28 16:45'
  },
  {
    id: '4',
    taskTitle: 'Wdrożenie nowego modułu',
    action: 'assigned',
    newValue: 'Piotr Wiśniewski',
    user: 'Jan Kowalski',
    timestamp: '2025-11-28 14:20'
  },
  {
    id: '5',
    taskTitle: 'Naprawa błędu #1234',
    action: 'created',
    user: 'Anna Nowak',
    timestamp: '2025-11-28 11:00'
  },
  {
    id: '6',
    taskTitle: 'Stare zadanie testowe',
    action: 'deleted',
    user: 'Jan Kowalski',
    timestamp: '2025-11-27 17:30'
  },
  {
    id: '7',
    taskTitle: 'Aktualizacja systemu',
    action: 'updated',
    field: 'Termin',
    oldValue: '2025-11-25',
    newValue: '2025-11-30',
    user: 'Piotr Wiśniewski',
    timestamp: '2025-11-27 10:15'
  }
];

const actionIcons = {
  created: PencilIcon,
  updated: ArrowPathIcon,
  completed: CheckCircleIcon,
  deleted: TrashIcon,
  moved: ArrowRightIcon,
  assigned: ArrowRightIcon
};

const actionColors = {
  created: 'bg-blue-100 text-blue-700',
  updated: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  deleted: 'bg-red-100 text-red-700',
  moved: 'bg-purple-100 text-purple-700',
  assigned: 'bg-cyan-100 text-cyan-700'
};

const actionLabels = {
  created: 'Utworzono',
  updated: 'Zaktualizowano',
  completed: 'Ukończono',
  deleted: 'Usunięto',
  moved: 'Przeniesiono',
  assigned: 'Przypisano'
};

export default function TaskHistoryPage() {
  const [history] = useState<HistoryEntry[]>(mockHistory);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.taskTitle.toLowerCase().includes(search.toLowerCase()) ||
      entry.user.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterAction === 'all' || entry.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <ClockIcon className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historia zadań</h1>
            <p className="text-sm text-gray-600">Śledzenie zmian i postępów w zadaniach</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj po zadaniu lub użytkowniku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        >
          <option value="all">Wszystkie akcje</option>
          <option value="created">Utworzone</option>
          <option value="updated">Zaktualizowane</option>
          <option value="completed">Ukończone</option>
          <option value="moved">Przeniesione</option>
          <option value="assigned">Przypisane</option>
          <option value="deleted">Usunięte</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <FunnelIcon className="h-4 w-4" />
          Więcej filtrów
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{history.length}</div>
          <div className="text-sm text-gray-600">Wszystkie</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{history.filter(h => h.action === 'completed').length}</div>
          <div className="text-sm text-gray-600">Ukończone</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{history.filter(h => h.action === 'created').length}</div>
          <div className="text-sm text-gray-600">Utworzone</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{history.filter(h => h.action === 'updated').length}</div>
          <div className="text-sm text-gray-600">Zmiany</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{history.filter(h => h.action === 'moved').length}</div>
          <div className="text-sm text-gray-600">Przeniesione</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{history.filter(h => h.action === 'deleted').length}</div>
          <div className="text-sm text-gray-600">Usunięte</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <ClockIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak historii</h3>
            <p className="text-gray-500">Nie znaleziono wpisów pasujących do kryteriów</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredHistory.map((entry) => {
              const Icon = actionIcons[entry.action];
              return (
                <div key={entry.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                  <div className={`p-2 rounded-lg ${actionColors[entry.action]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[entry.action]}`}>
                        {actionLabels[entry.action]}
                      </span>
                      <span className="font-medium text-gray-900">{entry.taskTitle}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.action === 'updated' && entry.field && (
                        <span>
                          {entry.field}: <span className="line-through text-gray-400">{entry.oldValue}</span>
                          {' → '}<span className="text-gray-900">{entry.newValue}</span>
                        </span>
                      )}
                      {entry.action === 'moved' && (
                        <span>
                          {entry.oldValue} → {entry.newValue}
                        </span>
                      )}
                      {entry.action === 'assigned' && (
                        <span>Przypisano do: {entry.newValue}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{entry.timestamp}</div>
                    <div className="text-xs text-gray-400">{entry.user}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
