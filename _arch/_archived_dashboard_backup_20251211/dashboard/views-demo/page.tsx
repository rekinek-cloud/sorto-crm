'use client';

import React, { useState } from 'react';
import { KanbanBoard } from '../../../components/views/KanbanBoard/KanbanBoard';
import { TaskList } from '../../../components/views/ListView/TaskList';
import { CalendarView } from '../../../components/views/Calendar/CalendarView';

type ViewType = 'kanban' | 'list' | 'calendar';
type KanbanType = 'sales_pipeline' | 'gtd_context' | 'priority' | 'deal_size';
type ListType = 'today' | 'gtd_contexts' | 'filtered';
type CalendarType = 'week' | 'month';

export default function ViewsDemo() {
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [kanbanType, setKanbanType] = useState<KanbanType>('sales_pipeline');
  const [listType, setListType] = useState<ListType>('today');
  const [calendarType, setCalendarType] = useState<CalendarType>('week');

  const organizationId = '1'; // Mock organization ID

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Demo Zaawansowanych Widoków CRM-GTD
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Demonstracja nowych funkcjonalności widoków zgodnie z dokumentacją Sorto.AI
          </p>
        </div>

        {/* View Selector */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Wybierz typ widoku
          </h2>
          
          {/* Main View Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setCurrentView('kanban')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                currentView === 'kanban'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">Kanban Board</div>
              <div className="text-sm text-gray-600 mt-1">
                Pipeline sprzedaży z drag & drop
              </div>
            </button>

            <button
              onClick={() => setCurrentView('list')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                currentView === 'list'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium">Lista Zadań</div>
              <div className="text-sm text-gray-600 mt-1">
                GTD konteksty i filtry
              </div>
            </button>

            <button
              onClick={() => setCurrentView('calendar')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                currentView === 'calendar'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📅</div>
              <div className="font-medium">Kalendarz</div>
              <div className="text-sm text-gray-600 mt-1">
                Wydarzenia i zadania w czasie
              </div>
            </button>
          </div>

          {/* Sub-view Options */}
          {currentView === 'kanban' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Typ Kanban Board:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setKanbanType('sales_pipeline')}
                  className={`p-3 rounded border text-sm ${
                    kanbanType === 'sales_pipeline'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  📈 Pipeline Sprzedaży
                </button>
                <button
                  onClick={() => setKanbanType('gtd_context')}
                  className={`p-3 rounded border text-sm ${
                    kanbanType === 'gtd_context'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  🎯 Konteksty GTD
                </button>
                <button
                  onClick={() => setKanbanType('priority')}
                  className={`p-3 rounded border text-sm ${
                    kanbanType === 'priority'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  🔥 Priorytety
                </button>
                <button
                  onClick={() => setKanbanType('deal_size')}
                  className={`p-3 rounded border text-sm ${
                    kanbanType === 'deal_size'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  💰 Wielkość Dealów
                </button>
              </div>
            </div>
          )}

          {currentView === 'list' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Typ Listy Zadań:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setListType('today')}
                  className={`p-3 rounded border text-sm ${
                    listType === 'today'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  📅 Zadania na Dziś
                </button>
                <button
                  onClick={() => setListType('gtd_contexts')}
                  className={`p-3 rounded border text-sm ${
                    listType === 'gtd_contexts'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  🎯 Konteksty GTD
                </button>
                <button
                  onClick={() => setListType('filtered')}
                  className={`p-3 rounded border text-sm ${
                    listType === 'filtered'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  🔍 Z Filtrami
                </button>
              </div>
            </div>
          )}

          {currentView === 'calendar' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Widok Kalendarza:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setCalendarType('week')}
                  className={`p-3 rounded border text-sm ${
                    calendarType === 'week'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  📅 Widok Tygodniowy
                </button>
                <button
                  onClick={() => setCalendarType('month')}
                  className={`p-3 rounded border text-sm ${
                    calendarType === 'month'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  📆 Widok Miesięczny
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features Info */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ✨ Dostępne Funkcjonalności:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {currentView === 'kanban' && (
              <>
                <div className="text-blue-800">
                  <div className="font-medium">🖱️ Drag & Drop</div>
                  <div>Przeciągnij karty między kolumnami</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">🎯 4 Typy Pipeline</div>
                  <div>Sprzedaż, GTD, Priorytety, Wielkość</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">📊 Auto-kalkulacje</div>
                  <div>Wartości i statystyki na żywo</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">🏷️ Konteksty GTD</div>
                  <div>@calls, @email, @meetings, @proposals</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">🤖 AI Insights</div>
                  <div>Predykcje i rekomendacje</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">⚡ Quick Actions</div>
                  <div>Szybkie akcje z kart</div>
                </div>
              </>
            )}
            
            {currentView === 'list' && (
              <>
                <div className="text-blue-800">
                  <div className="font-medium">🔍 Zaawansowane Filtry</div>
                  <div>Osoba, priorytet, termin, GTD</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">🎯 Konteksty GTD</div>
                  <div>Pogrupowanie według metodologii</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">📊 Statystyki</div>
                  <div>Efektywność i metryki</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">✅ Quick Complete</div>
                  <div>Szybkie oznaczanie jako wykonane</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">🔗 Powiązania</div>
                  <div>Links do dealów i projektów</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">⏱️ Estymacja czasu</div>
                  <div>Planowanie dziennego workload</div>
                </div>
              </>
            )}
            
            {currentView === 'calendar' && (
              <>
                <div className="text-blue-800">
                  <div className="font-medium">📅 Widok Tygodniowy</div>
                  <div>Szczegółowy harmonogram godzinowy</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">📆 Widok Miesięczny</div>
                  <div>Przegląd wydarzeń i terminów</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">🤝 Wydarzenia</div>
                  <div>Spotkania, calle, demo, bloki</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">📋 Zadania GTD</div>
                  <div>Integracja z zadaniami i deadlines</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">🔗 CRM Integration</div>
                  <div>Powiązania z dealami i firmami</div>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">📊 Statystyki</div>
                  <div>Podsumowania i metryki</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Current View Display */}
        <div className="bg-white rounded-lg shadow min-h-[600px]">
          {currentView === 'kanban' && (
            <div className="p-6">
              <KanbanBoard 
                boardType={kanbanType}
                organizationId={organizationId}
              />
            </div>
          )}

          {currentView === 'list' && (
            <div className="p-6">
              <TaskList 
                viewType={listType}
                organizationId={organizationId}
              />
            </div>
          )}

          {currentView === 'calendar' && (
            <div className="p-6">
              <CalendarView 
                viewType={calendarType}
                organizationId={organizationId}
              />
            </div>
          )}
        </div>

        {/* Implementation Status */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            ✅ Status Implementacji:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
            <div>
              <div className="font-medium mb-2">Ukończone:</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Struktura komponentów views</li>
                <li>KanbanBoard z 4 typami</li>
                <li>Drag & Drop functionality</li>
                <li>TaskList z filtrami GTD</li>
                <li>Calendar Week/Month View</li>
                <li>Shared components (Priority, GTD, User)</li>
                <li>Mock data i demo interface</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-2">Następne kroki:</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Backend API endpoints</li>
                <li>Database schema rozszerzenia</li>
                <li>Real-time collaboration</li>
                <li>AI predictions integration</li>
                <li>Gantt Chart implementation</li>
                <li>Scrum Board features</li>
                <li>Advanced filtering & search</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}