'use client';

import React, { useState } from 'react';
import { BookOpenIcon, PlusIcon, MagnifyingGlassIcon, FolderIcon, DocumentTextIcon, TagIcon } from '@heroicons/react/24/outline';

interface Article {
  id: string;
  title: string;
  category: string;
  tags: string[];
  excerpt: string;
  updatedAt: string;
  views: number;
}

const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Wprowadzenie do metodologii SORTO STREAMS',
    category: 'Produktywność',
    tags: ['GTD', 'STREAMS', 'podstawy'],
    excerpt: 'Kompletny przewodnik po systemie zarządzania zadaniami i strumieniami pracy...',
    updatedAt: '2025-11-28',
    views: 156
  },
  {
    id: '2',
    title: 'Konfiguracja integracji z API',
    category: 'Techniczne',
    tags: ['API', 'integracja', 'REST'],
    excerpt: 'Jak skonfigurować połączenie z zewnętrznymi systemami przez REST API...',
    updatedAt: '2025-11-27',
    views: 89
  },
  {
    id: '3',
    title: 'Najlepsze praktyki zarządzania projektami',
    category: 'Projekty',
    tags: ['projekty', 'zarządzanie', 'tips'],
    excerpt: 'Sprawdzone metody organizacji i śledzenia postępów w projektach...',
    updatedAt: '2025-11-25',
    views: 234
  },
  {
    id: '4',
    title: 'Automatyzacja procesów email',
    category: 'Email',
    tags: ['email', 'automatyzacja', 'reguły'],
    excerpt: 'Jak skonfigurować automatyczne sortowanie i odpowiedzi na emaile...',
    updatedAt: '2025-11-24',
    views: 167
  },
  {
    id: '5',
    title: 'Raportowanie i analityka',
    category: 'Raporty',
    tags: ['raporty', 'analityka', 'KPI'],
    excerpt: 'Generowanie raportów i śledzenie kluczowych wskaźników wydajności...',
    updatedAt: '2025-11-22',
    views: 98
  }
];

const categories = [
  { name: 'Wszystkie', count: 5 },
  { name: 'Produktywność', count: 1 },
  { name: 'Techniczne', count: 1 },
  { name: 'Projekty', count: 1 },
  { name: 'Email', count: 1 },
  { name: 'Raporty', count: 1 }
];

export default function KnowledgeBasePage() {
  const [articles] = useState<Article[]>(mockArticles);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'Wszystkie' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BookOpenIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Baza wiedzy</h1>
            <p className="text-sm text-gray-600">Dokumentacja, artykuły i materiały referencyjne</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <PlusIcon className="h-4 w-4" />
          Nowy artykuł
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj artykułów..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderIcon className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Kategorie</h3>
            </div>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-sm text-gray-500">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Statystyki</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Artykuły</span>
                <span className="font-medium">{articles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wyświetlenia</span>
                <span className="font-medium">{articles.reduce((sum, a) => sum + a.views, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kategorie</span>
                <span className="font-medium">{categories.length - 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="flex-1">
          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Brak artykułów</h3>
              <p className="text-gray-500">Nie znaleziono artykułów pasujących do kryteriów</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                          {article.category}
                        </span>
                        <span className="text-sm text-gray-500">{article.updatedAt}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">{article.excerpt}</p>
                      <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-gray-400" />
                        {article.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-500">{article.views} wyświetleń</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
