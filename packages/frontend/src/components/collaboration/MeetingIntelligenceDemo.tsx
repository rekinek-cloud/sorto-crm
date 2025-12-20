'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// =============================================================================
// MEETING INTELLIGENCE DEMO - Agenda & Action Items
// =============================================================================

interface AgendaItem {
  order: number;
  title: string;
  description: string;
  duration_minutes: number;
  item_type: string;
}

interface AgendaResult {
  title: string;
  total_duration: number;
  items: AgendaItem[];
  objectives: string[];
  success_criteria: string[];
}

interface ActionItem {
  title: string;
  description: string;
  assigned_to: string;
  priority: string;
  due_date: string | null;
}

const EXAMPLE_MEETINGS = [
  {
    id: 'quarterly_review',
    title: 'Quarterly Business Review',
    purpose: 'REVIEW',
    duration: 90,
    participants: [
      { name: 'Anna Kowalska', role: 'ORGANIZER' },
      { name: 'Piotr Nowak', role: 'REQUIRED' },
      { name: 'Katarzyna Wiśniak', role: 'REQUIRED' }
    ]
  },
  {
    id: 'sprint_planning',
    title: 'Sprint Planning',
    purpose: 'PLANNING',
    duration: 120,
    participants: [
      { name: 'Jan Kowalski', role: 'ORGANIZER' },
      { name: 'Maria Kowalczyk', role: 'REQUIRED' },
      { name: 'Tomasz Wójcik', role: 'REQUIRED' }
    ]
  },
  {
    id: 'brainstorm',
    title: 'Product Brainstorm Session',
    purpose: 'BRAINSTORM',
    duration: 60,
    participants: [
      { name: 'Anna Nowak', role: 'ORGANIZER' },
      { name: 'Piotr Kowalski', role: 'REQUIRED' }
    ]
  }
];

const EXAMPLE_NOTES = `
Meeting Notes - Sprint Planning

Attendees: Jan, Maria, Tomasz
Date: 2025-10-19

Decisions made:
- We will implement the new dashboard feature in this sprint
- Priority: HIGH for user authentication improvements
- Sprint goal: Complete 15 story points

Action items:
- Jan: Design new dashboard layout by Monday
- Maria: Implement authentication backend by Wednesday
- Tomasz: Setup testing environment by Tuesday
- Jan: Review pull requests daily

Next meeting: Sprint review on Friday 2PM
`;

export default function MeetingIntelligenceDemo() {
  const [selectedMeeting, setSelectedMeeting] = useState<string>('');
  const [agendaResult, setAgendaResult] = useState<AgendaResult | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);

  const handleGenerateAgenda = async () => {
    if (!selectedMeeting) {
      toast.error('Wybierz spotkanie!');
      return;
    }

    const meeting = EXAMPLE_MEETINGS.find(m => m.id === selectedMeeting);
    if (!meeting) return;

    setLoadingAgenda(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/collaboration/meetings/generate-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            title: meeting.title,
            purpose: meeting.purpose,
            duration_minutes: meeting.duration,
            participants: meeting.participants.map(p => ({
              user_id: p.name,
              name: p.name,
              email: `${p.name.toLowerCase().replace(' ', '.')}@company.com`,
              role: p.role
            }))
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setAgendaResult(data);
      toast.success('Agenda wygenerowana!');
    } catch (error: any) {
      console.error('Agenda generation error:', error);
      toast.error(error.message || 'Błąd generowania agendy');
    } finally {
      setLoadingAgenda(false);
    }
  };

  const handleExtractActions = async () => {
    setLoadingActions(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/collaboration/meetings/extract-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_notes: EXAMPLE_NOTES,
          participants: [
            {
              user_id: '1',
              name: 'Jan',
              email: 'jan@company.com',
              role: 'ORGANIZER'
            },
            {
              user_id: '2',
              name: 'Maria',
              email: 'maria@company.com',
              role: 'REQUIRED'
            },
            {
              user_id: '3',
              name: 'Tomasz',
              email: 'tomasz@company.com',
              role: 'REQUIRED'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setActionItems(data);
      toast.success(`Wyciągnięto ${data.length} action items!`);
    } catch (error: any) {
      console.error('Action extraction error:', error);
      toast.error(error.message || 'Błąd wyciągania action items');
    } finally {
      setLoadingActions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>📅</span>
          <span>Meeting Intelligence</span>
        </h2>
        <p className="text-gray-700">
          AI przygotowuje spotkania, generuje agendy i automatycznie wyciąga action items z notatek
        </p>
      </Card>

      {/* Agenda Generation Section */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <span>📋</span>
          <span>Generowanie agendy spotkania</span>
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wybierz spotkanie:
          </label>
          <div className="space-y-2">
            {EXAMPLE_MEETINGS.map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => setSelectedMeeting(meeting.id)}
                className={`
                  p-4 rounded-lg cursor-pointer transition-all border-2
                  ${selectedMeeting === meeting.id
                    ? 'bg-purple-50 border-purple-500'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{meeting.title}</h4>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {meeting.purpose}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>⏱️ {meeting.duration} min</span>
                  <span>👥 {meeting.participants.length} participants</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerateAgenda}
          disabled={loadingAgenda || !selectedMeeting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loadingAgenda ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Generuję agendę...</span>
            </>
          ) : (
            '📋 Wygeneruj agendę'
          )}
        </Button>

        {/* Agenda Result */}
        {agendaResult && (
          <div className="mt-6 space-y-4">
            <div className="bg-white p-6 rounded-lg border-2 border-purple-200">
              <h4 className="font-bold text-lg mb-4">{agendaResult.title}</h4>

              {/* Objectives */}
              {agendaResult.objectives && agendaResult.objectives.length > 0 && (
                <div className="mb-4 bg-blue-50 p-4 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-2">🎯 Cele spotkania:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {agendaResult.objectives.map((obj, idx) => (
                      <li key={idx}>• {obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agenda Items */}
              <div className="space-y-3">
                <p className="font-semibold text-gray-700">📋 Agenda ({agendaResult.total_duration} min):</p>
                {agendaResult.items.map((item) => (
                  <div key={item.order} className="bg-gray-50 p-4 rounded border-l-4 border-purple-500">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <span className="font-semibold text-purple-600">#{item.order}</span>
                        <span className="font-semibold ml-2">{item.title}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {item.item_type}
                        </span>
                        <span className="text-sm text-gray-600">⏱️ {item.duration_minutes} min</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>

              {/* Success Criteria */}
              {agendaResult.success_criteria && agendaResult.success_criteria.length > 0 && (
                <div className="mt-4 bg-green-50 p-4 rounded">
                  <p className="text-sm font-semibold text-green-900 mb-2">✅ Kryteria sukcesu:</p>
                  <ul className="text-sm text-green-800 space-y-1">
                    {agendaResult.success_criteria.map((criterion, idx) => (
                      <li key={idx}>• {criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Action Items Extraction Section */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <span>✅</span>
          <span>Wyciąganie action items z notatek</span>
        </h3>

        <div className="mb-4 bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">PRZYKŁADOWE NOTATKI:</p>
          <pre className="text-sm whitespace-pre-wrap text-gray-700">{EXAMPLE_NOTES}</pre>
        </div>

        <Button
          onClick={handleExtractActions}
          disabled={loadingActions}
          className="bg-green-600 hover:bg-green-700"
        >
          {loadingActions ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Wyciągam action items...</span>
            </>
          ) : (
            '✅ Wyciągnij action items'
          )}
        </Button>

        {/* Action Items Result */}
        {actionItems.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="font-semibold text-gray-700">
              📝 Znalezione action items ({actionItems.length}):
            </p>
            {actionItems.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border-2 border-green-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                    item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">👤 {item.assigned_to}</span>
                  {item.due_date && (
                    <span className="text-gray-600">📅 {new Date(item.due_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
