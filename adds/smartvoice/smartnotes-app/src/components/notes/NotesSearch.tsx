import React from 'react';
import { Search, Filter } from 'lucide-react';
import { useNotesStore } from '../../store/notesStore';

const NotesSearch: React.FC = () => {
  const { 
    searchQuery, 
    selectedCategory, 
    setSearchQuery, 
    setSelectedCategory, 
    getCategories 
  } = useNotesStore();
  
  const categories = getCategories();

  return (
    <div className="space-y-4 mb-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Szukaj w notatkach..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
        />
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex items-center space-x-3">
          <Filter size={16} className="text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="all">Wszystkie kategorie</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSearchQuery('')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            searchQuery === '' 
              ? 'bg-indigo-100 text-indigo-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Wszystkie
        </button>
        <button
          onClick={() => setSearchQuery('nagranie')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            searchQuery === 'nagranie' 
              ? 'bg-indigo-100 text-indigo-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Z nagraniem
        </button>
        <button
          onClick={() => setSearchQuery('dzisiaj')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            searchQuery === 'dzisiaj' 
              ? 'bg-indigo-100 text-indigo-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Dzisiejsze
        </button>
      </div>
    </div>
  );
};

export default NotesSearch;