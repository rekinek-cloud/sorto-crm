'use client';

import React, { useState } from 'react';
import { BarChart3, Cpu, Clock, FileText } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface MetadataStats {
  totalTasks: number;
  totalStreams: number;
  totalProjects: number;
  avgConfidence: number;
  processedToday: number;
  aiAnalyzed: number;
}

export default function MetadataPage() {
  const [stats] = useState<MetadataStats>({
    totalTasks: 156,
    totalStreams: 12,
    totalProjects: 8,
    avgConfidence: 87,
    processedToday: 23,
    aiAnalyzed: 142
  });

  const [recentActivity] = useState([
    { id: 1, action: 'Zadanie utworzone', entity: 'Przygotować prezentację', time: '5 min temu', confidence: 95 },
    { id: 2, action: 'Strumień zaktualizowany', entity: 'Marketing Q4', time: '12 min temu', confidence: 88 },
    { id: 3, action: 'AI analiza', entity: 'Email od klienta ABC', time: '23 min temu', confidence: 92 },
    { id: 4, action: 'Projekt ukończony', entity: 'Wdrożenie CRM', time: '1 godz. temu', confidence: 100 },
    { id: 5, action: 'Zadanie przeniesione', entity: 'Review dokumentacji', time: '2 godz. temu', confidence: 78 },
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Metadane systemu"
        subtitle="Statystyki, analiza AI i dane przetwarzania"
        icon={BarChart3}
        iconColor="text-purple-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Metadane systemu' },
        ]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-slate-600 dark:text-slate-400">Zadania</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.totalTasks}</div>
          <div className="text-sm text-green-600 mt-1">+{stats.processedToday} dzisiaj</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-slate-600 dark:text-slate-400">Strumienie</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.totalStreams}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">aktywnych</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Cpu className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-slate-600 dark:text-slate-400">AI Confidence</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.avgConfidence}%</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">średnia pewność</div>
        </div>
      </div>

      {/* AI Processing */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Przetwarzanie AI</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.aiAnalyzed}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Przeanalizowane</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Sukces</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">1.2s</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Śr. czas</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="text-2xl font-bold text-amber-600">45</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Sugestie</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ostatnia aktywność</h3>
        </div>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{item.action}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{item.entity}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">{item.time}</div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  item.confidence >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  item.confidence >= 80 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {item.confidence}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
