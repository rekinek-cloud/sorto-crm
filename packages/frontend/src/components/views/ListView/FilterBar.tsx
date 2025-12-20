'use client';

import React from 'react';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  gtdContext: string;
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  deal?: {
    id: string;
    title: string;
    company: string;
  };
  project?: {
    id: string;
    title: string;
  };
  completed: boolean;
}

interface Filters {
  assignee: string;
  gtdContext: string;
  project: string;
  deal: string;
  priority: string;
  dueDate: string;
  completed: boolean;
}

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  tasks: Task[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  tasks
}) => {
  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      assignee: '',
      gtdContext: '',
      project: '',
      deal: '',
      priority: '',
      dueDate: '',
      completed: false
    });
  };

  // Get unique values for dropdowns
  const getUniqueAssignees = () => {
    const unique = tasks.reduce((acc, task) => {
      if (!acc.find(a => a.id === task.assignee.id)) {
        acc.push(task.assignee);
      }
      return acc;
    }, [] as Array<{id: string, name: string}>);
    return unique;
  };

  const getUniqueContexts = () => {
    return [...new Set(tasks.map(task => task.gtdContext))];
  };

  const getUniqueProjects = () => {
    const unique = tasks.reduce((acc, task) => {
      if (task.project && !acc.find(p => p.id === task.project!.id)) {
        acc.push(task.project);
      }
      return acc;
    }, [] as Array<{id: string, title: string}>);
    return unique;
  };

  const getUniqueDeals = () => {
    const unique = tasks.reduce((acc, task) => {
      if (task.deal && !acc.find(d => d.id === task.deal!.id)) {
        acc.push(task.deal);
      }
      return acc;
    }, [] as Array<{id: string, title: string, company: string}>);
    return unique;
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'completed') return false; // completed is not considered "active filter"
    return value !== '';
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtry</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assignee Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Osoba
          </label>
          <select
            value={filters.assignee}
            onChange={(e) => updateFilter('assignee', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="">Wszyscy</option>
            {getUniqueAssignees().map(assignee => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>

        {/* GTD Context Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kontekst GTD
          </label>
          <select
            value={filters.gtdContext}
            onChange={(e) => updateFilter('gtdContext', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="">Wszystkie konteksty</option>
            {getUniqueContexts().map(context => (
              <option key={context} value={context}>
                {context}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priorytet
          </label>
          <select
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="">Wszystkie</option>
            <option value="urgent">🔴 Pilne</option>
            <option value="high">🟡 Wysokie</option>
            <option value="medium">🟢 Średnie</option>
            <option value="low">🔵 Niskie</option>
          </select>
        </div>

        {/* Due Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Termin
          </label>
          <select
            value={filters.dueDate}
            onChange={(e) => updateFilter('dueDate', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="">Wszystkie</option>
            <option value="overdue">Spóźnione</option>
            <option value="today">Dziś</option>
            <option value="tomorrow">Jutro</option>
            <option value="week">Ten tydzień</option>
          </select>
        </div>

        {/* Project Filter */}
        {getUniqueProjects().length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projekt
            </label>
            <select
              value={filters.project}
              onChange={(e) => updateFilter('project', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="">Wszystkie projekty</option>
              {getUniqueProjects().map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Deal Filter */}
        {getUniqueDeals().length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal
            </label>
            <select
              value={filters.deal}
              onChange={(e) => updateFilter('deal', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="">Wszystkie deale</option>
              {getUniqueDeals().map(deal => (
                <option key={deal.id} value={deal.id}>
                  {deal.title} ({deal.company})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Show Completed Toggle */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.completed}
            onChange={(e) => updateFilter('completed', e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Pokaż ukończone zadania
          </span>
        </label>
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.assignee && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Osoba: {getUniqueAssignees().find(a => a.id === filters.assignee)?.name}
                <button
                  onClick={() => updateFilter('assignee', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.gtdContext && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Kontekst: {filters.gtdContext}
                <button
                  onClick={() => updateFilter('gtdContext', '')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.priority && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                Priorytet: {filters.priority}
                <button
                  onClick={() => updateFilter('priority', '')}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.dueDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Termin: {filters.dueDate}
                <button
                  onClick={() => updateFilter('dueDate', '')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};