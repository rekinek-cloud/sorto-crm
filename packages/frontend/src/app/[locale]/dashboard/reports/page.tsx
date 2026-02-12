'use client';

import React, { useState } from 'react';
import { FileBarChart, Download, CalendarDays, BarChart3, Table, FileText, FileSpreadsheet, ClipboardList, LayoutGrid, List } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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

const typeColors: Record<string, string> = {
  tasks: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  projects: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  crm: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  productivity: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
};

const typeLabels: Record<string, string> = {
  tasks: 'Zadania',
  projects: 'Projekty',
  crm: 'CRM',
  productivity: 'Produktywność'
};

const FormatIcon = ({ format }: { format: string }) => {
  switch (format) {
    case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
    case 'excel': return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    case 'csv': return <ClipboardList className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
    default: return <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
  }
};

export default function ReportsPage() {
  const [reports] = useState<Report[]>(mockReports);
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredReports = reports.filter(report =>
    filterType === 'all' || report.type === filterType
  );

  return (
    <PageShell>
      <PageHeader
        title="Raporty"
        subtitle="Generowanie i zarządzanie raportami"
        icon={FileBarChart}
        iconColor="text-emerald-600"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <FileBarChart className="h-4 w-4" />
            Nowy raport
          </button>
        }
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-100">Raport tygodniowy</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Wygeneruj podsumowanie tygodnia</p>
        </button>
        <button className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 hover:border-green-300 dark:hover:border-green-600 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-100">Status projektów</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Aktualny stan wszystkich projektów</p>
        </button>
        <button className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Table className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-100">Export CRM</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Eksportuj dane klientów</p>
        </button>
        <button className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Download className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-100">Pełny backup</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pobierz wszystkie dane</p>
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
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {type === 'all' ? 'Wszystkie' : typeLabels[type as keyof typeof typeLabels]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <LayoutGrid className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <List className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <FileBarChart className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Brak raportów</h3>
          <p className="text-slate-500 dark:text-slate-400">Nie znaleziono raportów w tej kategorii</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[report.type]}`}>
                  {typeLabels[report.type]}
                </span>
                {report.scheduled && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs">
                    Zaplanowany
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{report.name}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{report.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Ostatnio: {report.lastGenerated}</span>
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <FormatIcon format={report.format} />
                  {report.format.toUpperCase()}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm transition-colors">
                  <Download className="h-4 w-4" />
                  Generuj
                </button>
                <button className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                  Zaplanuj
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Nazwa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Typ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Format</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ostatnio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{report.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{report.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[report.type]}`}>
                      {typeLabels[report.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{report.format.toUpperCase()}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{report.lastGenerated}</td>
                  <td className="px-6 py-4">
                    <button className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium text-sm">
                      Generuj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
