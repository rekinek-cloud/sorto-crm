'use client';

import React, { useState } from 'react';
import { Archive, Trash2, Undo2, Filter, Search } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
  task: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  email: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  note: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  reminder: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
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
    <PageShell>
      <PageHeader
        title="Archiwum niskiego priorytetu"
        subtitle="Elementy oznaczone jako nieistotne lub rozpraszające"
        icon={Archive}
        iconColor="text-slate-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Archiwum' },
        ]}
        actions={
          <button
            onClick={handleClearAll}
            disabled={selectedItems.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              selectedItems.length > 0
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            Usuń zaznaczone ({selectedItems.length})
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Szukaj w archiwum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300">
          <Filter className="h-4 w-4" />
          Filtry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{items.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Wszystkie</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">{items.filter(i => i.type === 'task').length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Zadania</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">{items.filter(i => i.type === 'email').length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Emaile</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">{items.filter(i => i.type === 'note' || i.type === 'reminder').length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Inne</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Archive className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Archiwum jest puste</h3>
            <p className="text-slate-500 dark:text-slate-400">Brak elementów oznaczonych jako nieistotne</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-slate-600 focus:ring-slate-500"
                  />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[item.type]}`}>
                        {typeLabels[item.type]}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">z: {item.originalStream}</span>
                      <span className="text-sm text-slate-400 dark:text-slate-500">&#8226; {item.reason}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mr-4">{item.archivedAt}</span>
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                    title="Przywróć"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    title="Usuń na zawsze"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
