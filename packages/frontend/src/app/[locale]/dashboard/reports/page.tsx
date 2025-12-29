'use client';

import React, { useState } from 'react';
import { DocumentChartBarIcon, ArrowDownTrayIcon, CalendarDaysIcon, FunnelIcon, ChartBarIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface Report {
  id: string;
  name: string;
  type: 'tasks' | 'projects' | 'crm' | 'productivity';
  lastGenerated: string;
  format: 'pdf' | 'excel' | 'csv';
  scheduled: boolean;
  description: string;
}

const mockReports: Report[] = [
  {
    id: '1',
    name: 'Raport zadań tygodniowy',
    type: 'tasks',
    lastGenerated: '2025-11-28',
    format: 'pdf',
    scheduled: true,
    description: 'Podsumowanie ukończonych i zaplanowanych zadań'
  },
  {
    id: '2',
    name: 'Status projektów',
    type: 'projects',
    lastGenerated: '2025-11-27',
    format: 'excel',
    scheduled: true,
    description: 'Przegląd postępów wszystkich aktywnych projektów'
  },
  {
    id: '3',
    name: 'Analiza sprzedaży CRM',
    type: 'crm',
    lastGenerated: '2025-11-25',
    format: 'pdf',
    scheduled: false,
    description: 'Raport pipeline i konwersji szans sprzedaży'
  },
  {
    id: '4',
    name: 'Produktywność zespołu',
    type: 'productivity',
    lastGenerated: '2025-11-20',
    format: 'excel',
    scheduled: true,
    description: 'Metryki wydajności i wykorzystania czasu'
  },
  {
    id: '5',
    name: 'Export kontaktów',
    type: 'crm',
    lastGenerated: '2025-11-15',
    format: 'csv',
    scheduled: false,
    description: 'Pełna lista kontaktów z danymi'
  }
];

const typeColors = {
  tasks: 'bg-blue-100 text-blue-700',
  projects: 'bg-green-100 text-green-700',
  crm: 'bg-purple-100 text-purple-700',
  productivity: 'bg-amber-100 text-amber-700'
};

const typeLabels = {
  tasks: 'Zadania',
  projects: 'Projekty',
  crm: 'CRM',
  productivity: 'Produktywność'
};

const formatIcons = {
  pdf: '📄',
  excel: '📊',
  csv: '📋'
};

export default function ReportsPage() {
  const [reports] = useState<Report[]>(mockReports);
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredReports = reports.filter(report =>
    filterType === 'all' || report.type === filterType
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <DocumentChartBarIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Raporty</h1>
            <p className="text-sm text-gray-600">Generowanie i zarządzanie raportami</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <DocumentChartBarIcon className="h-4 w-4" />
          Nowy raport
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-medium text-gray-900">Raport tygodniowy</span>
          </div>
          <p className="text-sm text-gray-500">Wygeneruj podsumowanie tygodnia</p>
        </button>
        <button className="bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-green-600" />
            </div>
            <span className="font-medium text-gray-900">Status projektów</span>
          </div>
          <p className="text-sm text-gray-500">Aktualny stan wszystkich projektów</p>
        </button>
        <button className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TableCellsIcon className="h-5 w-5 text-purple-600" />
            </div>
            <span className="font-medium text-gray-900">Export CRM</span>
          </div>
          <p className="text-sm text-gray-500">Eksportuj dane klientów</p>
        </button>
        <button className="bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-300 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ArrowDownTrayIcon className="h-5 w-5 text-amber-600" />
            </div>
            <span className="font-medium text-gray-900">Pełny backup</span>
          </div>
          <p className="text-sm text-gray-500">Pobierz wszystkie dane</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {['all', 'tasks', 'projects', 'crm', 'productivity'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? 'Wszystkie' : typeLabels[type as keyof typeof typeLabels]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <DocumentChartBarIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Brak raportów</h3>
          <p className="text-gray-500">Nie znaleziono raportów w tej kategorii</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[report.type]}`}>
                  {typeLabels[report.type]}
                </span>
                {report.scheduled && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                    Zaplanowany
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{report.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Ostatnio: {report.lastGenerated}</span>
                <span className="text-gray-500">{formatIcons[report.format]} {report.format.toUpperCase()}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Generuj
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  Zaplanuj
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ostatnio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{report.name}</div>
                    <div className="text-sm text-gray-500">{report.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[report.type]}`}>
                      {typeLabels[report.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{report.format.toUpperCase()}</td>
                  <td className="px-6 py-4 text-gray-600">{report.lastGenerated}</td>
                  <td className="px-6 py-4">
                    <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                      Generuj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
