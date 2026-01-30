'use client';

import React, { useState } from 'react';
import { DocumentDuplicateIcon, PlusIcon, MagnifyingGlassIcon, FolderIcon, StarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  tasksCount: number;
  usageCount: number;
  isFavorite: boolean;
  lastUsed: string;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Onboarding nowego klienta',
    category: 'CRM',
    description: 'Kompletny proces wprowadzenia nowego klienta do systemu',
    tasksCount: 12,
    usageCount: 45,
    isFavorite: true,
    lastUsed: '2025-11-28'
  },
  {
    id: '2',
    name: 'Sprint planning',
    category: 'Projekty',
    description: 'Szablon planowania sprintu z podziałem na etapy',
    tasksCount: 8,
    usageCount: 32,
    isFavorite: true,
    lastUsed: '2025-11-27'
  },
  {
    id: '3',
    name: 'Przegląd tygodniowy',
    category: 'Produktywność',
    description: 'Lista kontrolna do cotygodniowego przeglądu systemu',
    tasksCount: 15,
    usageCount: 156,
    isFavorite: false,
    lastUsed: '2025-11-25'
  },
  {
    id: '4',
    name: 'Raport miesięczny',
    category: 'Raporty',
    description: 'Szablon zbierania danych do raportu miesięcznego',
    tasksCount: 6,
    usageCount: 24,
    isFavorite: false,
    lastUsed: '2025-11-20'
  },
  {
    id: '5',
    name: 'Kampania marketingowa',
    category: 'Marketing',
    description: 'Pełny workflow kampanii od planowania do analizy',
    tasksCount: 18,
    usageCount: 12,
    isFavorite: true,
    lastUsed: '2025-11-15'
  }
];

const categories = ['Wszystkie', 'CRM', 'Projekty', 'Produktywność', 'Raporty', 'Marketing'];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [showFavorites, setShowFavorites] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Wszystkie' || template.category === selectedCategory;
    const matchesFavorite = !showFavorites || template.isFavorite;
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  const toggleFavorite = (id: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <DocumentDuplicateIcon className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Szablony</h1>
            <p className="text-sm text-gray-600">Gotowe wzorce zadań i projektów</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
          <PlusIcon className="h-4 w-4" />
          Nowy szablon
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj szablonów..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showFavorites
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {showFavorites ? <StarIconSolid className="h-4 w-4" /> : <StarIcon className="h-4 w-4" />}
          Ulubione
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
          <div className="text-sm text-gray-600">Wszystkich szablonów</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-amber-600">{templates.filter(t => t.isFavorite).length}</div>
          <div className="text-sm text-gray-600">Ulubionych</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-violet-600">{templates.reduce((sum, t) => sum + t.usageCount, 0)}</div>
          <div className="text-sm text-gray-600">Użyć łącznie</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{categories.length - 1}</div>
          <div className="text-sm text-gray-600">Kategorii</div>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <DocumentDuplicateIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Brak szablonów</h3>
          <p className="text-gray-500">Nie znaleziono szablonów pasujących do kryteriów</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <FolderIcon className="h-5 w-5 text-violet-600" />
                  </div>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {template.category}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(template.id); }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {template.isFavorite
                    ? <StarIconSolid className="h-5 w-5 text-amber-500" />
                    : <StarIcon className="h-5 w-5 text-gray-400" />
                  }
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{template.tasksCount} zadań</span>
                  <span className="text-gray-500">{template.usageCount} użyć</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  <span>{template.lastUsed}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="flex-1 px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm">
                  Użyj szablon
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  Edytuj
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
