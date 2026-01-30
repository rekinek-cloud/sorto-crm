'use client';

import React, { useState } from 'react';
import { KanbanBoard } from '../../../components/views/KanbanBoard/KanbanBoard';
import { ListView } from '../../../components/views/ListView/ListView';
import { CalendarView } from '../../../components/views/CalendarView/CalendarView';
import { GanttView } from '../../../components/views/GanttView/GanttView';

type ViewCategory = 'kanban' | 'list' | 'calendar' | 'gantt';
type KanbanType = 'sales_pipeline' | 'gtd_context' | 'priority' | 'deal_size';
type ListType = 'today' | 'gtd_context' | 'filtered';
type CalendarType = 'week' | 'month';
type GanttType = 'project' | 'deals' | 'critical_path';

export default function ViewsPage() {
  const [activeCategory, setActiveCategory] = useState<ViewCategory>('kanban');
  const [activeKanban, setActiveKanban] = useState<KanbanType>('sales_pipeline');
  const [activeList, setActiveList] = useState<ListType>('today');
  const [activeCalendar, setActiveCalendar] = useState<CalendarType>('week');
  const [activeGantt, setActiveGantt] = useState<GanttType>('project');
  const [organizationId] = useState('current'); // In real app, get from auth context

  const viewCategories = [
    {
      id: 'kanban' as ViewCategory,
      title: 'Kanban Boards',
      description: 'Widoki tablicowe z przeciąganiem',
      icon: '📋',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      id: 'list' as ViewCategory,
      title: 'List Views',
      description: 'Listy zadań i kontekstów GTD',
      icon: '📝',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    {
      id: 'calendar' as ViewCategory,
      title: 'Calendar Views',
      description: 'Widoki kalendarzowe tygodniowe i miesięczne',
      icon: '📅',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      id: 'gantt' as ViewCategory,
      title: 'Gantt Charts',
      description: 'Wykresy Gantta dla projektów i timeline',
      icon: '📊',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    }
  ];

  const kanbanOptions = [
    {
      id: 'sales_pipeline' as KanbanType,
      title: 'Pipeline Sprzedaży',
      description: 'Klasyczny widok pipeline sprzedaży z etapami'
    },
    {
      id: 'gtd_context' as KanbanType,
      title: 'Konteksty GTD',
      description: 'Deale pogrupowane według kontekstów GTD'
    },
    {
      id: 'priority' as KanbanType,
      title: 'Priorytety',
      description: 'Widok priorytetów - pilne, wysokie, średnie, niskie'
    },
    {
      id: 'deal_size' as KanbanType,
      title: 'Wielkość Dealów',
      description: 'Pogrupowane według wartości'
    }
  ];

  const listOptions = [
    {
      id: 'today' as ListType,
      title: 'Dzisiejsze Zadania',
      description: 'Lista zadań na dziś z priorytetami'
    },
    {
      id: 'gtd_context' as ListType,
      title: 'Konteksty GTD',
      description: 'Zadania pogrupowane według kontekstu'
    },
    {
      id: 'filtered' as ListType,
      title: 'Przefiltrowane',
      description: 'Zadania z zaawansowanymi filtrami'
    }
  ];

  const calendarOptions = [
    {
      id: 'week' as CalendarType,
      title: 'Widok Tygodniowy',
      description: 'Kalendarz z wydarzeniami na tydzień'
    },
    {
      id: 'month' as CalendarType,
      title: 'Widok Miesięczny',
      description: 'Przegląd miesiąca z kluczowymi datami'
    }
  ];

  const ganttOptions = [
    {
      id: 'project' as GanttType,
      title: 'Projekty',
      description: 'Timeline projektów z zadaniami'
    },
    {
      id: 'deals' as GanttType,
      title: 'Deale',
      description: 'Timeline dealów i pipeline'
    },
    {
      id: 'critical_path' as GanttType,
      title: 'Ścieżka Krytyczna',
      description: 'Analiza krytycznej ścieżki projektów'
    }
  ];

  const getCurrentOptions = () => {
    switch (activeCategory) {
      case 'kanban': return kanbanOptions;
      case 'list': return listOptions;
      case 'calendar': return calendarOptions;
      case 'gantt': return ganttOptions;
      default: return [];
    }
  };

  const getCurrentActive = () => {
    switch (activeCategory) {
      case 'kanban': return activeKanban;
      case 'list': return activeList;
      case 'calendar': return activeCalendar;
      case 'gantt': return activeGantt;
      default: return '';
    }
  };

  const setCurrentActive = (value: string) => {
    switch (activeCategory) {
      case 'kanban': setActiveKanban(value as KanbanType); break;
      case 'list': setActiveList(value as ListType); break;
      case 'calendar': setActiveCalendar(value as CalendarType); break;
      case 'gantt': setActiveGantt(value as GanttType); break;
    }
  };

  const renderActiveView = () => {
    switch (activeCategory) {
      case 'kanban':
        return <KanbanBoard boardType={activeKanban} organizationId={organizationId} />;
      case 'list':
        return <ListView viewType={activeList} organizationId={organizationId} />;
      case 'calendar':
        return <CalendarView viewType={activeCalendar} organizationId={organizationId} />;
      case 'gantt':
        return <GanttView viewType={activeGantt} organizationId={organizationId} />;
      default:
        return <div>Wybierz widok</div>;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Widoki Systemowe
        </h1>
        <p className="text-gray-600">
          Zaawansowane widoki projektu zarządzania z integracją CRM i GTD
        </p>
      </div>

      {/* Category Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorie Widoków</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {viewCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg border-2 transition-all
                ${activeCategory === category.id 
                  ? category.color + ' shadow-md' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <span className="text-2xl">{category.icon}</span>
              <div className="text-left">
                <div className="font-semibold">{category.title}</div>
                <div className="text-xs opacity-75">{category.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-view Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {viewCategories.find(c => c.id === activeCategory)?.title} - Opcje
        </h3>
        <div className="flex flex-wrap gap-3">
          {getCurrentOptions().map(option => (
            <button
              key={option.id}
              onClick={() => setCurrentActive(option.id)}
              className={`
                px-4 py-2 rounded-md border transition-all text-sm
                ${getCurrentActive() === option.id 
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-medium">{option.title}</div>
              <div className="text-xs opacity-75">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active View */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {getCurrentOptions().find(o => o.id === getCurrentActive())?.title || 'Widok'}
          </h2>
          <p className="text-sm text-gray-600">
            {getCurrentOptions().find(o => o.id === getCurrentActive())?.description}
          </p>
        </div>

        {/* Render Active View Component */}
        {renderActiveView()}
      </div>

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">Kanban Boards</div>
          <div className="text-2xl font-bold text-blue-900">{kanbanOptions.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">List Views</div>
          <div className="text-2xl font-bold text-green-900">{listOptions.length}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-600 text-sm font-medium">Calendar Views</div>
          <div className="text-2xl font-bold text-purple-900">{calendarOptions.length}</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-orange-600 text-sm font-medium">Gantt Charts</div>
          <div className="text-2xl font-bold text-orange-900">{ganttOptions.length}</div>
        </div>
      </div>

      {/* Features Info */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          🚀 Funkcjonalności Systemu Widoków
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/50 p-3 rounded">
            <div className="font-medium text-blue-900">📋 Kanban Boards</div>
            <div className="text-gray-700">Drag & Drop, Real-time sync, GTD contexts</div>
          </div>
          <div className="bg-white/50 p-3 rounded">
            <div className="font-medium text-green-900">📝 List Views</div>
            <div className="text-gray-700">Smart prioritization, GTD filtering, Task management</div>
          </div>
          <div className="bg-white/50 p-3 rounded">
            <div className="font-medium text-purple-900">📅 Calendar Views</div>
            <div className="text-gray-700">Week/Month views, Event management, Timeline</div>
          </div>
          <div className="bg-white/50 p-3 rounded">
            <div className="font-medium text-orange-900">📊 Gantt Charts</div>
            <div className="text-gray-700">Project timelines, Dependencies, Critical path</div>
          </div>
        </div>
      </div>
    </div>
  );
}