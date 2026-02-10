'use client';

import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { flowApi, FlowAction, FlowPendingItem, FLOW_ACTION_LABELS } from '@/lib/api/flow';
import { toast } from 'react-hot-toast';

interface Stream {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

interface FlowProcessModalProps {
  item: FlowPendingItem | { id: string; content: string; note?: string; sourceType?: string };
  streams: Stream[];
  onClose: () => void;
  onProcessed: () => void;
  initialSuggestion?: {
    action: FlowAction;
    streamId?: string;
    streamName?: string;
    confidence: number;
  };
}

export default function FlowProcessModal({ item, streams, onClose, onProcessed, initialSuggestion }: FlowProcessModalProps) {
  const [selectedAction, setSelectedAction] = useState<FlowAction | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState(('title' in item ? item.title : '') || ('content' in item ? (item as any).content : ''));
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  // AI Suggestion state (V3 with assistant/coach fields)
  const [aiSuggestion, setAiSuggestion] = useState<{
    action: FlowAction;
    streamId?: string;
    streamName?: string;
    confidence: number;
    reasoning: string[];
    // V3 AI Assistant/Coach fields
    thinking?: {
      step1_understanding?: {
        whatIsIt: string;
        userGoal: string;
        context: string;
        timeframe: string;
        complexity: string;
      };
      step2_support?: {
        keyQuestions: string[];
        typicalSteps: string[];
        risks: string[];
        tips: string[];
      };
      step3_methodology?: {
        bestFit: string;
        reasoning: string;
      };
      step4_context?: {
        matchingStream: string | null;
        matchingProject: string | null;
        needsNewStream: boolean;
        suggestedStreamName: string | null;
      };
    };
    assistantMessage?: string;
    firstSteps?: string[];
    priority?: string;
    dueDate?: string;
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  // Load AI suggestion on mount (or use pre-existing one in correction mode)
  useEffect(() => {
    if (initialSuggestion) {
      // Correction mode: use existing analysis, skip AI call
      setAiSuggestion({
        ...initialSuggestion,
        reasoning: [],
        alternatives: [],
      } as any);
      // Pre-select action and stream for editing
      setSelectedAction(initialSuggestion.action);
      if (initialSuggestion.streamId) {
        setSelectedStreamId(initialSuggestion.streamId);
      }
      return;
    }

    const loadAiSuggestion = async () => {
      setLoadingAi(true);
      try {
        const suggestion = await flowApi.getSuggestion(item.id);
        setAiSuggestion(suggestion);
      } catch (error) {
        console.error('Failed to load AI suggestion:', error);
      } finally {
        setLoadingAi(false);
      }
    };

    loadAiSuggestion();
  }, [item.id]);

  // Accept AI suggestion
  const handleAcceptSuggestion = () => {
    if (!aiSuggestion) return;

    setSelectedAction(aiSuggestion.action);
    if (aiSuggestion.streamId) {
      setSelectedStreamId(aiSuggestion.streamId);
    }
  };

  // Process item
  const handleProcess = async () => {
    if (!selectedAction) {
      toast.error('Wybierz akcję');
      return;
    }

    // Validate required fields based on action (STREAMS methodology)
    if ((selectedAction === 'ZAPLANUJ' || selectedAction === 'REFERENCJA') && !selectedStreamId) {
      toast.error('Wybierz strumień docelowy');
      return;
    }

    if (selectedAction === 'PROJEKT' && !projectName.trim()) {
      toast.error('Podaj nazwę projektu');
      return;
    }

    setProcessing(true);
    try {
      await flowApi.processItem(item.id, {
        action: selectedAction,
        targetStreamId: selectedStreamId || undefined,
        taskData: selectedAction === 'ZROB_TERAZ' || selectedAction === 'ZAPLANUJ' ? {
          title: taskTitle,
          description: taskDescription || undefined,
          priority,
          dueDate: dueDate || undefined,
        } : undefined,
        projectData: selectedAction === 'PROJEKT' ? {
          name: projectName,
          description: projectDescription || undefined,
          streamId: selectedStreamId || undefined,
        } : undefined,
      });

      // Record feedback if AI suggestion was used
      if (aiSuggestion) {
        await flowApi.recordFeedback(item.id, {
          suggestedAction: aiSuggestion.action,
          actualAction: selectedAction,
          wasHelpful: aiSuggestion.action === selectedAction,
        }).catch(() => {}); // Silent fail for feedback
      }

      const actionLabel = FLOW_ACTION_LABELS[selectedAction];
      toast.success(`${actionLabel.emoji} Element popłynął: ${actionLabel.label}`);
      onProcessed();
      onClose();
    } catch (error: any) {
      console.error('Failed to process item:', error);
      toast.error(error.response?.data?.message || 'Błąd podczas przetwarzania');
    } finally {
      setProcessing(false);
    }
  };

  const itemContent = 'content' in item ? (item as any).content : item.title;
  const itemNote = 'note' in item ? (item as any).note : item.content;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-indigo-600" />
            Flow Engine - Przetwórz Element
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Item Preview */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">{itemContent}</h3>
            {itemNote && itemContent !== itemNote && (
              <p className="text-sm text-gray-600 mt-2">{itemNote}</p>
            )}
          </div>

          {/* AI Suggestion Panel */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-indigo-900">Sugestia AI</h4>
              </div>
              {loadingAi && (
                <ArrowPathIcon className="w-5 h-5 text-indigo-500 animate-spin" />
              )}
            </div>

            {loadingAi ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
                <div className="h-3 bg-indigo-100 rounded w-1/2"></div>
              </div>
            ) : aiSuggestion ? (
              <div className="space-y-4">
                {/* Action badge and confidence */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${FLOW_ACTION_LABELS[aiSuggestion.action].color}`}>
                    {FLOW_ACTION_LABELS[aiSuggestion.action].emoji} {FLOW_ACTION_LABELS[aiSuggestion.action].label}
                  </span>
                  {aiSuggestion.streamName && (
                    <span className="text-sm text-gray-600">
                      → {aiSuggestion.streamName}
                    </span>
                  )}
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                    {aiSuggestion.confidence}% pewności
                  </span>
                </div>

                {/* V3: Assistant Message (main recommendation) */}
                {aiSuggestion.assistantMessage ? (
                  <div className="bg-white rounded-lg p-3 border border-indigo-200">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">💡 </span>
                      {aiSuggestion.assistantMessage}
                    </p>
                  </div>
                ) : aiSuggestion.reasoning && aiSuggestion.reasoning.length > 0 && (
                  <p className="text-sm text-indigo-700">
                    {aiSuggestion.reasoning[0]}
                  </p>
                )}

                {/* V3: First Steps */}
                {aiSuggestion.firstSteps && aiSuggestion.firstSteps.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-sm font-medium text-blue-800 mb-2">🚀 Pierwsze kroki:</p>
                    <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                      {aiSuggestion.firstSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* V3: Thinking details (collapsible) */}
                {aiSuggestion.thinking && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200">
                    <button
                      onClick={() => setShowThinking(!showThinking)}
                      className="w-full p-3 text-left text-sm font-medium text-gray-700 flex items-center justify-between"
                    >
                      <span>🧠 Tok myślenia AI</span>
                      <span className="text-gray-400">{showThinking ? '▲' : '▼'}</span>
                    </button>
                    {showThinking && (
                      <div className="px-3 pb-3 space-y-2 text-xs text-gray-600">
                        {aiSuggestion.thinking.step1_understanding && (
                          <div>
                            <strong>Zrozumienie:</strong> {aiSuggestion.thinking.step1_understanding.whatIsIt}
                            <span className="ml-2 text-gray-400">({aiSuggestion.thinking.step1_understanding.context})</span>
                          </div>
                        )}
                        {aiSuggestion.thinking.step2_support && aiSuggestion.thinking.step2_support.keyQuestions.length > 0 && (
                          <div>
                            <strong>Pytania kluczowe:</strong>
                            <ul className="list-disc list-inside ml-2">
                              {aiSuggestion.thinking.step2_support.keyQuestions.slice(0, 2).map((q, i) => (
                                <li key={i}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiSuggestion.thinking.step3_methodology && (
                          <div>
                            <strong>Metodologia:</strong> {aiSuggestion.thinking.step3_methodology.bestFit} - {aiSuggestion.thinking.step3_methodology.reasoning}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleAcceptSuggestion}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  Zaakceptuj sugestię
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Brak sugestii AI dla tego elementu
              </p>
            )}
          </div>

          {/* Action Selection - STREAMS Methodology */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Wybierz akcję (STREAMS)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.entries(FLOW_ACTION_LABELS) as [FlowAction, typeof FLOW_ACTION_LABELS[FlowAction]][]).map(([action, config]) => (
                <button
                  key={action}
                  onClick={() => setSelectedAction(action)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedAction === action
                      ? `${config.color} border-current shadow-md`
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{config.emoji}</span>
                    <span className="font-medium text-sm">{config.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{config.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Stream Selection (for ZAPLANUJ and REFERENCJA) */}
          {(selectedAction === 'ZAPLANUJ' || selectedAction === 'REFERENCJA') && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Wybierz Strumień docelowy</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {streams.map((stream) => (
                  <button
                    key={stream.id}
                    onClick={() => setSelectedStreamId(stream.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedStreamId === stream.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stream.color || '#6B7280' }}
                      />
                      <span className="font-medium text-sm truncate">{stream.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Task Details (for ZROB_TERAZ and ZAPLANUJ) */}
          {(selectedAction === 'ZROB_TERAZ' || selectedAction === 'ZAPLANUJ') && (
            <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-semibold text-green-900">
                {selectedAction === 'ZROB_TERAZ' ? 'Szybkie zadanie (<2 min)' : 'Szczegóły zadania'}
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł zadania</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis (opcjonalnie)</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorytet</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="LOW">Niski</option>
                    <option value="MEDIUM">Średni</option>
                    <option value="HIGH">Wysoki</option>
                    <option value="URGENT">Pilny</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Termin (opcjonalnie)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Project Details (for PROJEKT) */}
          {selectedAction === 'PROJEKT' && (
            <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-900">Szczegóły projektu</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa projektu *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="np. Nowy projekt marketingowy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis projektu (opcjonalnie)</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strumień projektu (opcjonalnie)</label>
                <select
                  value={selectedStreamId}
                  onChange={(e) => setSelectedStreamId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">-- Nowy strumień --</option>
                  {streams.map((stream) => (
                    <option key={stream.id} value={stream.id}>{stream.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleProcess}
            disabled={!selectedAction || processing}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {processing ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Przetwarzanie...
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                Przetwórz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
