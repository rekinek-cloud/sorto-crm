'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ReasoningDemo from '@/components/agent/ReasoningDemo';
import ComparisonDemo from '@/components/agent/ComparisonDemo';
import PlanningDemo from '@/components/agent/PlanningDemo';
import ReportsDemo from '@/components/agent/ReportsDemo';

// =============================================================================
// AGENT ADVANCED FEATURES - Week 5 Integration
// =============================================================================
// Interfejs do wszystkich zaawansowanych funkcjonalności AI Agent Week 5
// - Multi-step Reasoning
// - Comparative Analysis
// - Smart Day Planner Integration
// - Agent Reports
// Autor: Claude Code 2025-10-19

type TabValue = 'reasoning' | 'comparison' | 'planning' | 'reports';

interface Tab {
  value: TabValue;
  label: string;
  icon: string;
  description: string;
}

const tabs: Tab[] = [
  {
    value: 'reasoning',
    label: 'Multi-step Reasoning',
    icon: '🧠',
    description: 'Rozumowanie wieloetapowe dla złożonych zapytań'
  },
  {
    value: 'comparison',
    label: 'Comparative Analysis',
    icon: '📊',
    description: 'Porównania encji, okresów i wydajności'
  },
  {
    value: 'planning',
    label: 'Smart Planning',
    icon: '📅',
    description: 'Inteligentne planowanie i optymalizacja dnia'
  },
  {
    value: 'reports',
    label: 'Agent Reports',
    icon: '📈',
    description: 'Raporty wydajności i analityka'
  }
];

export default function AgentAdvancedPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('reasoning');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <span>🤖</span>
          <span>Agent Advanced Features</span>
          <span className="text-sm px-3 py-1 bg-purple-600 text-white rounded-full">Week 5</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Zaawansowane funkcjonalności AI Agent: rozumowanie wieloetapowe, analizy porównawcze, inteligentne planowanie i raporty
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <Card className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                variant={activeTab === tab.value ? 'default' : 'outline'}
                className={`h-auto py-4 px-4 flex flex-col items-start gap-2 transition-all ${
                  activeTab === tab.value
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-2xl">{tab.icon}</span>
                  <span className="font-semibold text-sm">{tab.label}</span>
                </div>
                <p className={`text-xs text-left ${
                  activeTab === tab.value ? 'text-purple-100' : 'text-gray-500'
                }`}>
                  {tab.description}
                </p>
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'reasoning' && <ReasoningDemo />}
        {activeTab === 'comparison' && <ComparisonDemo />}
        {activeTab === 'planning' && <PlanningDemo />}
        {activeTab === 'reports' && <ReportsDemo />}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          💡 <strong>Tip:</strong> Wszystkie funkcje korzystają z RAG service (port 8000) przez proxy nginx (/rag-api/)
        </p>
      </div>
    </div>
  );
}
