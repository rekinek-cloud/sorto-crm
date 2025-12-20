'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { planning } from '@/lib/api/ragClient';

// =============================================================================
// PLANNING DEMO - Smart Day Planner Integration
// =============================================================================

type PlanningTab = 'suggest' | 'conflicts' | 'optimize' | 'reschedule';

interface ScheduleSuggestion {
  success: boolean;
  task_id: string;
  task_name: string;
  proposed_block_id: string;
  proposed_time: string;
  reasoning: string;
  confidence: number;
  alternatives: string[];
}

interface ConflictResult {
  success: boolean;
  date: string;
  conflicts: Array<{
    type: string;
    severity: string;
    description: string;
    affected_tasks: string[];
    resolution: string;
  }>;
}

interface OptimizationResult {
  success: boolean;
  date: string;
  energy_utilization_score: number;
  suggestions: Array<{
    type: string;
    description: string;
    impact: string;
  }>;
  recommendations: string[];
}

export default function PlanningDemo() {
  const [activeTab, setActiveTab] = useState<PlanningTab>('suggest');
  const [loading, setLoading] = useState(false);

  // Suggest Schedule State
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [energyRequired, setEnergyRequired] = useState('MEDIUM');
  const [duration, setDuration] = useState(60);
  const [deadline, setDeadline] = useState('');
  const [suggestionResult, setSuggestionResult] = useState<ScheduleSuggestion | null>(null);

  // Conflicts State
  const [conflictDate, setConflictDate] = useState(new Date().toISOString().split('T')[0]);
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);

  // Optimize State
  const [optimizeDate, setOptimizeDate] = useState(new Date().toISOString().split('T')[0]);
  const [optimizeResult, setOptimizeResult] = useState<OptimizationResult | null>(null);

  // Reschedule State
  const [rescheduleTaskId, setRescheduleTaskId] = useState('task123');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleResult, setRescheduleResult] = useState<ScheduleSuggestion | null>(null);

  const handleSuggestSchedule = async () => {
    if (!taskName.trim()) {
      toast.error('Wprowadź nazwę zadania');
      return;
    }

    setLoading(true);
    try {
      const result = await planning.suggestSchedule(
        `task_${Date.now()}`,
        taskName,
        'user123',
        'org456',
        {
          taskDescription,
          estimatedDuration: duration,
          priority,
          deadline,
          energyLevelRequired: energyRequired
        }
      );
      setSuggestionResult(result);
      toast.success('Sugestia harmonogramu wygenerowana!');
    } catch (error: any) {
      console.error('Error suggesting schedule:', error);
      toast.error(error.response?.data?.detail || 'Błąd generowania sugestii');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectConflicts = async () => {
    setLoading(true);
    try {
      const result = await planning.detectConflicts('user123', 'org456', conflictDate);
      setConflictResult(result);
      toast.success('Analiza konfliktów ukończona!');
    } catch (error: any) {
      console.error('Error detecting conflicts:', error);
      toast.error(error.response?.data?.detail || 'Błąd wykrywania konfliktów');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeDay = async () => {
    setLoading(true);
    try {
      const result = await planning.optimizeDay('user123', 'org456', optimizeDate);
      setOptimizeResult(result);
      toast.success('Optymalizacja dnia ukończona!');
    } catch (error: any) {
      console.error('Error optimizing day:', error);
      toast.error(error.response?.data?.detail || 'Błąd optymalizacji dnia');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleTask = async () => {
    setLoading(true);
    try {
      const result = await planning.rescheduleTask(
        rescheduleTaskId,
        'user123',
        'org456',
        rescheduleReason
      );
      setRescheduleResult(result);
      toast.success('Zadanie przełożone!');
    } catch (error: any) {
      console.error('Error rescheduling task:', error);
      toast.error(error.response?.data?.detail || 'Błąd przekładania zadania');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-300 bg-red-50 text-red-700';
      case 'medium': return 'border-yellow-300 bg-yellow-50 text-yellow-700';
      case 'low': return 'border-blue-300 bg-blue-50 text-blue-700';
      default: return 'border-gray-300 bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>📅</span>
          <span>Smart Day Planner Integration</span>
        </h2>
        <p className="text-gray-700">
          Inteligentne planowanie zadań, wykrywanie konfliktów i optymalizacja dnia
        </p>
      </Card>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: 'suggest', label: 'Suggest Schedule', icon: '📋' },
            { value: 'conflicts', label: 'Detect Conflicts', icon: '⚠️' },
            { value: 'optimize', label: 'Optimize Day', icon: '⚡' },
            { value: 'reschedule', label: 'Reschedule Task', icon: '🔄' }
          ].map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as PlanningTab)}
              variant={activeTab === tab.value ? 'default' : 'outline'}
              className={`${activeTab === tab.value ? 'bg-green-600' : ''}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Suggest Schedule Tab */}
      {activeTab === 'suggest' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">📋 Suggest Task Schedule</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nazwa zadania *</label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="Prezentacja dla klienta"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priorytet</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Opis zadania</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Szczegółowy opis zadania..."
                  className="w-full p-3 border rounded-lg min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Wymagana energia</label>
                  <select
                    value={energyRequired}
                    onChange={(e) => setEnergyRequired(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Czas (minuty)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min="15"
                    max="480"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>
              <Button
                onClick={handleSuggestSchedule}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : '📋 Get Suggestion'}
              </Button>
            </div>
          </Card>

          {suggestionResult && (
            <Card className="p-6 border-2 border-green-200 bg-green-50">
              <h4 className="font-bold mb-4">✅ Sugerowany harmonogram:</h4>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold">🕐 Proponowany czas: {suggestionResult.proposed_time}</p>
                  <p className="text-sm text-gray-600">Block ID: {suggestionResult.proposed_block_id}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold mb-2">💡 Uzasadnienie:</p>
                  <p className="text-gray-700">{suggestionResult.reasoning}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold mb-2">🎯 Pewność: {(suggestionResult.confidence * 100).toFixed(0)}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{ width: `${suggestionResult.confidence * 100}%` }}
                    />
                  </div>
                </div>
                {suggestionResult.alternatives.length > 0 && (
                  <div className="bg-white p-4 rounded-lg">
                    <p className="font-semibold mb-2">🔄 Alternatywy:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestionResult.alternatives.map((alt, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Detect Conflicts Tab */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">⚠️ Detect Conflicts</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data do sprawdzenia</label>
                <input
                  type="date"
                  value={conflictDate}
                  onChange={(e) => setConflictDate(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <Button
                onClick={handleDetectConflicts}
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : '⚠️ Check Conflicts'}
              </Button>
            </div>
          </Card>

          {conflictResult && (
            <Card className="p-6 border-2 border-yellow-200 bg-yellow-50">
              <h4 className="font-bold mb-4">⚠️ Wykryte konflikty ({conflictResult.conflicts.length}):</h4>
              {conflictResult.conflicts.length === 0 ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                  <p className="text-green-700 font-semibold">✅ Brak konfliktów!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conflictResult.conflicts.map((conflict, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${getSeverityColor(conflict.severity)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold">{conflict.type}</p>
                        <span className="px-2 py-1 bg-white rounded text-xs">
                          {conflict.severity}
                        </span>
                      </div>
                      <p className="mb-2">{conflict.description}</p>
                      <p className="text-sm mb-2">
                        <strong>Zadania:</strong> {conflict.affected_tasks.join(', ')}
                      </p>
                      <p className="text-sm bg-white p-2 rounded">
                        <strong>Rozwiązanie:</strong> {conflict.resolution}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Optimize Day Tab */}
      {activeTab === 'optimize' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">⚡ Optimize Day</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data do optymalizacji</label>
                <input
                  type="date"
                  value={optimizeDate}
                  onChange={(e) => setOptimizeDate(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <Button
                onClick={handleOptimizeDay}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : '⚡ Optimize Day'}
              </Button>
            </div>
          </Card>

          {optimizeResult && (
            <Card className="p-6 border-2 border-purple-200 bg-purple-50">
              <h4 className="font-bold mb-4">⚡ Wyniki optymalizacji:</h4>
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">Energy Utilization Score</p>
                  <p className="text-4xl font-bold text-purple-600">
                    {(optimizeResult.energy_utilization_score * 100).toFixed(0)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-3">
                    <div
                      className="bg-purple-600 h-4 rounded-full transition-all"
                      style={{ width: `${optimizeResult.energy_utilization_score * 100}%` }}
                    />
                  </div>
                </div>
                {optimizeResult.suggestions.length > 0 && (
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-semibold mb-3">💡 Sugestie optymalizacji:</h5>
                    <div className="space-y-2">
                      {optimizeResult.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded border">
                          <p className="font-medium">{suggestion.type}</p>
                          <p className="text-sm text-gray-600">{suggestion.description}</p>
                          <p className="text-xs text-purple-600 mt-1">Impact: {suggestion.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {optimizeResult.recommendations.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                    <h5 className="font-semibold mb-3">✅ Rekomendacje:</h5>
                    <ul className="space-y-2">
                      {optimizeResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Reschedule Task Tab */}
      {activeTab === 'reschedule' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">🔄 Reschedule Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task ID</label>
                <input
                  type="text"
                  value={rescheduleTaskId}
                  onChange={(e) => setRescheduleTaskId(e.target.value)}
                  placeholder="task123"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Powód przekładania (opcjonalnie)</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Zbyt niski poziom energii..."
                  className="w-full p-3 border rounded-lg min-h-[80px]"
                />
              </div>
              <Button
                onClick={handleRescheduleTask}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : '🔄 Reschedule Task'}
              </Button>
            </div>
          </Card>

          {rescheduleResult && (
            <Card className="p-6 border-2 border-blue-200 bg-blue-50">
              <h4 className="font-bold mb-4">✅ Nowy harmonogram:</h4>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold">🕐 Nowy czas: {rescheduleResult.proposed_time}</p>
                  <p className="text-sm text-gray-600">Block ID: {rescheduleResult.proposed_block_id}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold mb-2">💡 Uzasadnienie:</p>
                  <p className="text-gray-700">{rescheduleResult.reasoning}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold mb-2">🎯 Pewność: {(rescheduleResult.confidence * 100).toFixed(0)}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${rescheduleResult.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
