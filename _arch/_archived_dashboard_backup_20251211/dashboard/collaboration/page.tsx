'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import EmailDraftDemo from '@/components/collaboration/EmailDraftDemo';
import MeetingIntelligenceDemo from '@/components/collaboration/MeetingIntelligenceDemo';
import AutomationSuggestionsDemo from '@/components/collaboration/AutomationSuggestionsDemo';
import TeamCollaborationDemo from '@/components/collaboration/TeamCollaborationDemo';

// =============================================================================
// COLLABORATION - Week 6 Features
// =============================================================================

type TabValue = 'email' | 'meetings' | 'automation' | 'team';

interface Tab {
  value: TabValue;
  label: string;
  icon: string;
  description: string;
}

const tabs: Tab[] = [
  {
    value: 'email',
    label: 'Email Drafts',
    icon: '📧',
    description: 'Automatyczne szkice emaili i inteligentne odpowiedzi'
  },
  {
    value: 'meetings',
    label: 'Meeting Intelligence',
    icon: '📅',
    description: 'Przygotowanie spotkań i wyciąganie akcji'
  },
  {
    value: 'automation',
    label: 'Automation Suggestions',
    icon: '💡',
    description: 'Sugestie automatyzacji i optymalizacji'
  },
  {
    value: 'team',
    label: 'Team Collaboration',
    icon: '👥',
    description: 'Analiza zespołu i dystrybucja zadań'
  }
];

export default function CollaborationPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('email');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤝 Collaboration & Advanced Actions
        </h1>
        <p className="text-gray-600 text-lg">
          Week 6: Email automation, meeting intelligence, workflow optimization, and team insights
        </p>
      </div>

      {/* Tabs Navigation */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`
                h-auto py-4 px-4 flex flex-col items-start gap-2 text-left transition-all
                ${activeTab === tab.value
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl">{tab.icon}</span>
                <span className="font-semibold text-sm flex-1">{tab.label}</span>
                {activeTab === tab.value && (
                  <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    Active
                  </span>
                )}
              </div>
              <p className={`text-xs ${activeTab === tab.value ? 'text-blue-100' : 'text-gray-500'}`}>
                {tab.description}
              </p>
            </Button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'email' && <EmailDraftDemo />}
        {activeTab === 'meetings' && <MeetingIntelligenceDemo />}
        {activeTab === 'automation' && <AutomationSuggestionsDemo />}
        {activeTab === 'team' && <TeamCollaborationDemo />}
      </div>

      {/* Footer Info */}
      <Card className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Week 6 - Collaboration Features</h3>
            <p className="text-sm text-blue-700">
              Te funkcje wykorzystują zaawansowane AI do automatyzacji codziennych zadań,
              optymalizacji workflow i usprawnienia pracy zespołowej. Wszystkie sugestie
              są generowane w czasie rzeczywistym na podstawie aktualnych danych.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
