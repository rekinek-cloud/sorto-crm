'use client';

import React, { useState } from 'react';
import { ArchiveBoxIcon, TrashIcon, ArrowUturnLeftIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ArchivedItem {
  id: string;
  title: string;
  type: 'task' | 'email' | 'note' | 'reminder';
  archivedAt: string;
  originalStream: string;
  reason: string;
}

const mockItems: ArchivedItem[] = [
  {
    id: '1',
    title: 'Newsletter z platformy XYZ',
    type: 'email',
    archivedAt: '2025-11-28',
    originalStream: 'Inbox',
    reason: 'Spam / nieistotne'
  },
  {
    id: '2',
    title: 'Pomysł na projekt - odłożony',
    type: 'note',
    archivedAt: '2025-11-27',
    originalStream: 'Someday/Maybe',
    reason: 'Nieaktualne'
  },
  {
    id: '3',
    title: 'Przejrzeć stare pliki',
    type: 'task',
    archivedAt: '2025-11-25',
    originalStream: 'Zadania',
    reason: 'Niski priorytet'
  },
  {
    id: '4',
    title: 'Przypomnienie o webinarze',
    type: 'reminder',
    archivedAt: '2025-11-24',
    originalStream: 'Kalendarz',
    reason: 'Wydarzenie minęło'
  },
  {
    id: '5',
    title: 'Oferta promocyjna - wygasła',
    type: 'email',
    archivedAt: '2025-11-23',
    originalStream: 'Inbox',
    reason: 'Nieaktualne'
  }
];

const typeLabels = {
  task: 'Zadanie',
  email: 'Email',
  note: 'Notatka',
  reminder: 'Przypomnienie'
};

const typeColors = {
  task: 'bg-blue-100 text-blue-700',
  email: 'bg-green-100 text-green-700',
  note: 'bg-yellow-100 text-yellow-700',
  reminder: 'bg-purple-100 text-purple-700'
};

export default function UnimportantPage() {
  const [items, setItems] = useState<ArchivedItem[]>(mockItems);
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.originalStream.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRestore = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    if (selectedItems.length > 0) {
      setItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <ArchiveBoxIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Archiwum niskiego priorytetu</h1>
            <p className="text-sm text-gray-600">Elementy oznaczone jako nieistotne lub rozpraszające</p>
          </div>
        </div>
        <button
          onClick={handleClearAll}
          disabled={selectedItems.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            selectedItems.length > 0
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <TrashIcon className="h-4 w-4" />
          Usuń zaznaczone ({selectedItems.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj w archiwum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <FunnelIcon className="h-4 w-4" />
          Filtry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{items.length}</div>
          <div className="text-sm text-gray-600">Wszystkie</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{items.filter(i => i.type === 'task').length}</div>
          <div className="text-sm text-gray-600">Zadania</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{items.filter(i => i.type === 'email').length}</div>
          <div className="text-sm text-gray-600">Emaile</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{items.filter(i => i.type === 'note' || i.type === 'reminder').length}</div>
          <div className="text-sm text-gray-600">Inne</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <ArchiveBoxIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Archiwum jest puste</h3>
            <p className="text-gray-500">Brak elementów oznaczonych jako nieistotne</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[item.type]}`}>
                        {typeLabels[item.type]}
                      </span>
                      <span className="text-sm text-gray-500">z: {item.originalStream}</span>
                      <span className="text-sm text-gray-400">• {item.reason}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 mr-4">{item.archivedAt}</span>
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Przywróć"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Usuń na zawsze"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
