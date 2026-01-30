'use client';

import React, { useState } from 'react';
import { ChartBarIcon, CpuChipIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Metadane systemu</h1>
            <p className="text-sm text-gray-600">Statystyki, analiza AI i dane przetwarzania</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-gray-600">Zadania</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalTasks}</div>
          <div className="text-sm text-green-600 mt-1">+{stats.processedToday} dzisiaj</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-cyan-600" />
            </div>
            <span className="text-gray-600">Strumienie</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalStreams}</div>
          <div className="text-sm text-gray-500 mt-1">aktywnych</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CpuChipIcon className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-gray-600">AI Confidence</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.avgConfidence}%</div>
          <div className="text-sm text-gray-500 mt-1">średnia pewność</div>
        </div>
      </div>

      {/* AI Processing */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CpuChipIcon className="h-6 w-6 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Przetwarzanie AI</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">{stats.aiAnalyzed}</div>
            <div className="text-sm text-gray-600">Przeanalizowane</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-sm text-gray-600">Sukces</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="text-2xl font-bold text-blue-600">1.2s</div>
            <div className="text-sm text-gray-600">Śr. czas</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="text-2xl font-bold text-amber-600">45</div>
            <div className="text-sm text-gray-600">Sugestie</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Ostatnia aktywność</h3>
        </div>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">{item.action}</div>
                  <div className="text-sm text-gray-500">{item.entity}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">{item.time}</div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  item.confidence >= 90 ? 'bg-green-100 text-green-700' :
                  item.confidence >= 80 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.confidence}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
