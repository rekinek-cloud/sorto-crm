'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// =============================================================================
// AUTOMATION SUGGESTIONS DEMO - Workflow optimization
// =============================================================================

interface WorkflowPattern {
  pattern_type: string;
  description: string;
  frequency: number;
  time_spent_weekly: number;
}

interface WorkflowAnalysis {
  user_id: string;
  patterns_detected: WorkflowPattern[];
  total_tasks: number;
  total_emails: number;
  productivity_score: number;
  efficiency_gaps: string[];
}

interface OptimizationSuggestion {
  category: string;
  title: string;
  description: string;
  current_state: string;
  proposed_state: string;
  impact: string;
  effort: string;
  time_savings: number;
  implementation_steps: string[];
}

// Mock data for demo
const MOCK_TASKS = [
  { id: '1', title: 'Update client database', status: 'COMPLETED' },
  { id: '2', title: 'Send weekly report', status: 'COMPLETED' },
  { id: '3', title: 'Update client database', status: 'COMPLETED' },
  { id: '4', title: 'Review pull requests', status: 'IN_PROGRESS' },
  { id: '5', title: 'Send weekly report', status: 'COMPLETED' },
  { id: '6', title: 'Update client database', status: 'COMPLETED' },
  { id: '7', title: 'Team standup', status: 'COMPLETED' },
  { id: '8', title: 'Team standup', status: 'COMPLETED' },
];

const MOCK_EMAILS = [
  { id: '1', from: 'newsletter@company.com', subject: 'Weekly Newsletter' },
  { id: '2', from: 'newsletter@company.com', subject: 'Weekly Newsletter' },
  { id: '3', from: 'client@example.com', subject: 'Project Update' },
  { id: '4', from: 'newsletter@company.com', subject: 'Weekly Newsletter' },
  { id: '5', from: 'manager@company.com', subject: 'Status Report' },
];

const MOCK_MEETINGS = [
  { id: '1', title: 'Daily Standup', duration: 15 },
  { id: '2', title: 'Daily Standup', duration: 15 },
  { id: '3', title: 'Daily Standup', duration: 15 },
  { id: '4', title: 'Client Review', duration: 60 },
];

export default function AutomationSuggestionsDemo() {
  const [analysis, setAnalysis] = useState<WorkflowAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingOptimizations, setLoadingOptimizations] = useState(false);

  const handleAnalyzeWorkflow = async () => {
    setLoadingAnalysis(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/collaboration/automation/analyze-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo_user',
          tasks_data: MOCK_TASKS,
          emails_data: MOCK_EMAILS,
          meetings_data: MOCK_MEETINGS,
          timeframe_days: 30
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
      toast.success('Analiza workflow ukończona!');
    } catch (error: any) {
      console.error('Workflow analysis error:', error);
      toast.error(error.message || 'Błąd analizy workflow');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleGetOptimizations = async () => {
    if (!analysis) {
      toast.error('Najpierw wykonaj analizę workflow!');
      return;
    }

    setLoadingOptimizations(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/collaboration/automation/suggest-optimizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_analysis: analysis
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data);
      toast.success(`Wygenerowano ${data.length} sugestii!`);
    } catch (error: any) {
      console.error('Optimization suggestions error:', error);
      toast.error(error.message || 'Błąd generowania sugestii');
    } finally {
      setLoadingOptimizations(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>Automation & Optimization Suggestions</span>
        </h2>
        <p className="text-gray-700">
          AI analizuje Twój workflow i sugeruje automatyzacje oraz optymalizacje procesów
        </p>
      </Card>

      {/* Workflow Analysis Section */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <span>🔍</span>
          <span>Analiza workflow</span>
        </h3>

        <div className="mb-4 bg-gray-50 p-4 rounded">
          <p className="text-sm font-semibold text-gray-700 mb-2">📊 Dane do analizy:</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">✅ Zadania:</span>
              <span className="ml-2">{MOCK_TASKS.length}</span>
            </div>
            <div>
              <span className="font-semibold">📧 Emaile:</span>
              <span className="ml-2">{MOCK_EMAILS.length}</span>
            </div>
            <div>
              <span className="font-semibold">📅 Spotkania:</span>
              <span className="ml-2">{MOCK_MEETINGS.length}</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleAnalyzeWorkflow}
          disabled={loadingAnalysis}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          {loadingAnalysis ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Analizuję...</span>
            </>
          ) : (
            '🔍 Analizuj workflow'
          )}
        </Button>

        {/* Analysis Result */}
        {analysis && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-yellow-200">
                <p className="text-xs text-gray-600 mb-1">Produktywność</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(analysis.productivity_score * 100).toFixed(0)}%
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Wykryte wzorce</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analysis.patterns_detected.length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-red-200">
                <p className="text-xs text-gray-600 mb-1">Luki w efektywności</p>
                <p className="text-2xl font-bold text-red-600">
                  {analysis.efficiency_gaps.length}
                </p>
              </div>
            </div>

            {/* Detected Patterns */}
            {analysis.patterns_detected.length > 0 && (
              <div className="bg-white p-4 rounded-lg border-2 border-yellow-200">
                <h4 className="font-semibold mb-3">🔄 Wykryte wzorce:</h4>
                <div className="space-y-2">
                  {analysis.patterns_detected.map((pattern, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded border-l-4 border-yellow-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            pattern.pattern_type === 'REPETITIVE' ? 'bg-orange-100 text-orange-700' :
                            pattern.pattern_type === 'MANUAL' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {pattern.pattern_type}
                          </span>
                          <p className="text-sm font-medium mt-1">{pattern.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Frequency</p>
                          <p className="font-semibold text-sm">{pattern.frequency}x/tydzień</p>
                          <p className="text-xs text-orange-600">{pattern.time_spent_weekly} min/tydzień</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Efficiency Gaps */}
            {analysis.efficiency_gaps.length > 0 && (
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">⚠️ Luki w efektywności:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {analysis.efficiency_gaps.map((gap, idx) => (
                    <li key={idx}>• {gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Get Optimizations Button */}
            <Button
              onClick={handleGetOptimizations}
              disabled={loadingOptimizations}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              {loadingOptimizations ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Generuję sugestie...</span>
                </>
              ) : (
                '💡 Wygeneruj sugestie optymalizacji'
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span>🚀</span>
            <span>Sugestie optymalizacji ({suggestions.length})</span>
          </h3>

          <div className="space-y-4">
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg border-2 border-green-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      suggestion.category === 'AUTOMATION' ? 'bg-purple-100 text-purple-700' :
                      suggestion.category === 'WORKFLOW' ? 'bg-blue-100 text-blue-700' :
                      suggestion.category === 'BATCHING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {suggestion.category}
                    </span>
                    <h4 className="font-bold text-lg mt-2">{suggestion.title}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Oszczędność czasu</p>
                    <p className="text-2xl font-bold text-green-600">
                      {suggestion.time_savings} min/tyg
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{suggestion.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-xs font-semibold text-red-900 mb-1">❌ Obecnie:</p>
                    <p className="text-sm text-red-800">{suggestion.current_state}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs font-semibold text-green-900 mb-1">✅ Propozycja:</p>
                    <p className="text-sm text-green-800">{suggestion.proposed_state}</p>
                  </div>
                </div>

                <div className="flex gap-4 mb-4 text-sm">
                  <span className={`px-3 py-1 rounded ${
                    suggestion.impact === 'HIGH' ? 'bg-red-100 text-red-700 font-semibold' :
                    suggestion.impact === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    Impact: {suggestion.impact}
                  </span>
                  <span className={`px-3 py-1 rounded ${
                    suggestion.effort === 'LOW' ? 'bg-green-100 text-green-700' :
                    suggestion.effort === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Effort: {suggestion.effort}
                  </span>
                </div>

                {suggestion.implementation_steps.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs font-semibold text-blue-900 mb-2">📋 Kroki implementacji:</p>
                    <ol className="text-sm text-blue-800 space-y-1">
                      {suggestion.implementation_steps.map((step, stepIdx) => (
                        <li key={stepIdx}>{stepIdx + 1}. {step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
