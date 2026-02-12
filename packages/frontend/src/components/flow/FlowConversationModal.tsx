'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { flowApi, FlowAction, FlowConversation, FlowPendingItem, FlowAIMetadata, FLOW_ACTION_LABELS } from '@/lib/api/flow';
import { toast } from 'react-hot-toast';

interface Stream {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  streamId?: string;
}

interface Goal {
  id: string;
  name: string;
  description?: string;
}

interface EditableTask {
  id: string;
  title: string;
  dueDate?: string;
  isNew?: boolean;
}

interface AIAnalysisData {
  summary?: string;
  entities?: Array<{ type: string; value: string; confidence: number }>;
  urgency?: string;
  estimatedTime?: string;
  confidence?: number;
  suggestedAction?: string;
  suggestedStreams?: Array<{ streamId: string; streamName: string; confidence: number }>;
}

interface FlowConversationModalProps {
  item: FlowPendingItem | { id: string; content: string; note?: string; sourceType?: string; title?: string };
  streams: Stream[];
  projects?: Project[];
  goals?: Goal[];
  onClose: () => void;
  onProcessed: () => void;
  correctionMode?: boolean;
  initialAction?: FlowAction;
  initialStreamId?: string;
  initialAnalysisData?: AIAnalysisData;
}

export default function FlowConversationModal({ item, streams, projects = [], goals = [], onClose, onProcessed, correctionMode, initialAction, initialStreamId, initialAnalysisData }: FlowConversationModalProps) {
  const [conversation, setConversation] = useState<FlowConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [aiMetadata, setAiMetadata] = useState<FlowAIMetadata | null>(null);

  // User choices - EDITABLE
  const [selectedAction, setSelectedAction] = useState<FlowAction | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');

  // New stream creation
  const [createNewStream, setCreateNewStream] = useState(false);
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamColor, setNewStreamColor] = useState('#3B82F6');

  // Project linkage (for ZAPLANUJ - link to existing project)
  const [linkedProjectId, setLinkedProjectId] = useState<string>('');

  // Goal linkage (for PROJEKT)
  const [linkedGoalId, setLinkedGoalId] = useState<string>('');
  const [createNewGoal, setCreateNewGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');

  // Editable tasks list
  const [tasks, setTasks] = useState<EditableTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Editable project name
  const [projectName, setProjectName] = useState('');

  // Editable tags
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Editable reminder/due date
  const [dueDate, setDueDate] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [reminder, setReminder] = useState('3m');

  useEffect(() => {
    if (correctionMode && initialAction) {
      // Correction mode: show form immediately with pre-populated values
      const syntheticMetadata: FlowAIMetadata = {
        actionOptions: (Object.entries(FLOW_ACTION_LABELS) as [FlowAction, typeof FLOW_ACTION_LABELS[FlowAction]][]).map(([action, label]) => ({
          action,
          label: `${label.emoji} ${label.label}`,
          isDefault: action === initialAction,
          suggestedTasks: [],
          suggestedTags: [],
        })),
        streamMatching: {
          matches: streams.map(s => ({
            streamId: s.id,
            streamName: s.name,
            confidence: s.id === initialStreamId ? 90 : 50,
          })),
          bestMatch: initialStreamId ? {
            streamId: initialStreamId,
            streamName: streams.find(s => s.id === initialStreamId)?.name || '',
            confidence: 90,
          } : undefined,
        },
      };
      setAiMetadata(syntheticMetadata);
      setSelectedAction(initialAction);
      if (initialStreamId) setSelectedStreamId(initialStreamId);
      setProjectName(getItemContent());
      setLoading(false);

      // Start conversation in background (needed for execute)
      startConversationBackground();
    } else {
      startConversation();
    }
  }, [item.id]);

  // AI enriched data from background conversation (for left panel in correction mode)
  const [aiEnrichedData, setAiEnrichedData] = useState<FlowAIMetadata | null>(null);

  // Background conversation start - doesn't block UI, doesn't change form state
  const startConversationBackground = async () => {
    try {
      const conv = await flowApi.conversation.start(item.id);
      setConversation(conv);

      // Store enriched AI metadata separately (for left panel display only)
      const aiMessage = (conv.messages || []).find(m => m.role === 'assistant');
      if (aiMessage?.metadata) {
        setAiEnrichedData(aiMessage.metadata);
      }
    } catch (error: any) {
      console.error('Failed to start background conversation:', error);
      toast.error('Błąd inicjalizacji - spróbuj ponownie');
    }
  };

  const startConversation = async () => {
    setLoading(true);
    try {
      const conv = await flowApi.conversation.start(item.id);
      setConversation(conv);

      // Extract metadata from first assistant message
      const aiMessage = (conv.messages || []).find(m => m.role === 'assistant');
      const metadata = aiMessage?.metadata;

      if (metadata) {
        setAiMetadata(metadata);

        // Set default action (the one marked as isDefault)
        const defaultOption = metadata.actionOptions?.find(opt => opt.isDefault);
        if (defaultOption) {
          setSelectedAction(defaultOption.action);

          // Initialize tasks from suggested tasks
          if (defaultOption.suggestedTasks) {
            setTasks(defaultOption.suggestedTasks.map((t, i) => ({
              id: `suggested-${i}`,
              title: t,
              isNew: false
            })));
          }

          // Initialize tags
          if (defaultOption.suggestedTags) {
            setTags(defaultOption.suggestedTags);
          }
        }

        // Set best match stream as default
        if (metadata.streamMatching?.bestMatch) {
          setSelectedStreamId(metadata.streamMatching.bestMatch.streamId);
        }

        // Initialize project name from item content
        setProjectName(getItemContent());
      }
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      toast.error(error.response?.data?.message || 'Nie udalo sie rozpoczac analizy');
    } finally {
      setLoading(false);
    }
  };

  const getItemContent = () => {
    return 'title' in item ? item.title : ('content' in item ? (item as any).content : '');
  };

  // Task management
  const updateTask = (id: string, newTitle: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  const updateTaskDate = (id: string, newDate: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, dueDate: newDate } : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTask = () => {
    if (newTaskTitle.trim()) {
      setTasks(prev => [...prev, {
        id: `new-${Date.now()}`,
        title: newTaskTitle.trim(),
        dueDate: '',
        isNew: true
      }]);
      setNewTaskTitle('');
    }
  };

  // Tag management
  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  // Handle action change - update tasks/tags based on new action's suggestions
  const handleActionChange = (action: FlowAction) => {
    setSelectedAction(action);

    const option = aiMetadata?.actionOptions?.find(opt => opt.action === action);
    if (option) {
      // Update tasks if action has suggested tasks and user hasn't added custom ones
      if (option.suggestedTasks && tasks.every(t => !t.isNew)) {
        setTasks(option.suggestedTasks.map((t, i) => ({
          id: `suggested-${i}`,
          title: t,
          isNew: false
        })));
      }

      // Update tags
      if (option.suggestedTags) {
        setTags(option.suggestedTags);
      }
    }
  };

  const handleExecute = async () => {
    if (!conversation || !selectedAction) {
      toast.error('Wybierz akcje');
      return;
    }

    // Validate new stream name if creating
    if (createNewStream && !newStreamName.trim()) {
      toast.error('Podaj nazwe nowego strumienia');
      return;
    }

    setExecuting(true);
    try {
      // First update the conversation with user's modifications - SEND ALL DATA
      const modifyResult = await flowApi.conversation.modify(conversation.id, {
        action: selectedAction,
        streamId: createNewStream ? undefined : (selectedStreamId || undefined),
        taskTitle: projectName || undefined,

        // New stream creation
        createNewStream: createNewStream,
        newStreamName: createNewStream ? newStreamName.trim() : undefined,
        newStreamColor: createNewStream ? newStreamColor : undefined,

        // Goal creation/linkage
        createNewGoal: createNewGoal,
        newGoalName: createNewGoal ? newGoalName.trim() : undefined,
        linkedGoalId: !createNewGoal && linkedGoalId ? linkedGoalId : undefined,

        // Project linkage (for ZAPLANUJ)
        linkedProjectId: linkedProjectId || undefined,

        // Tasks as first steps (for PROJEKT)
        tasks: tasks.length > 0 ? tasks.map(t => ({ title: t.title, dueDate: t.dueDate || undefined })) : undefined,

        // Tags
        tags: tags.length > 0 ? tags : undefined,

        // Dates
        dueDate: dueDate || undefined,
        projectDeadline: projectDeadline || undefined,

        // Reminder (for KIEDYS_MOZE)
        reminder: reminder !== 'none' ? reminder : undefined,
      });

      // If new stream was created, show info
      if (modifyResult.createdStream) {
        toast.success(`Utworzono strumien: ${modifyResult.createdStream.name}`);
      }

      // Then execute
      const result = await flowApi.conversation.execute(conversation.id);
      if (result.success) {
        const actionLabel = FLOW_ACTION_LABELS[result.data.finalAction as FlowAction];
        toast.success(`Wykonano: ${actionLabel?.label || result.data.finalAction}`);
        onProcessed();
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to execute:', error);
      toast.error(error.response?.data?.message || 'Blad wykonania');
    } finally {
      setExecuting(false);
    }
  };

  const getSelectedActionOption = () => {
    return aiMetadata?.actionOptions?.find(opt => opt.action === selectedAction);
  };

  const itemContent = getItemContent();

  // Complexity labels
  const complexityLabels: Record<string, string> = {
    LOW: 'Niska',
    MEDIUM: 'Srednia',
    HIGH: 'Wysoka (wymaga zespolu, infrastruktury)',
  };

  // Time horizon labels
  const timeHorizonLabels: Record<string, string> = {
    IMMEDIATE: 'Natychmiast',
    SHORT_TERM: 'Krotkoterminowy (dni-tygodnie)',
    LONG_TERM: 'Dlugoterminowy (miesiace)',
    SOMEDAY: 'Kiedys',
  };

  // Get what will be created based on action
  const getCreationSummary = () => {
    if (!selectedAction) return null;

    // Stream name - either existing or new
    const streamName = createNewStream
      ? `(NOWY) ${newStreamName || 'bez nazwy'}`
      : (streams.find(s => s.id === selectedStreamId)?.name ||
        aiMetadata?.streamMatching?.matches?.find(m => m.streamId === selectedStreamId)?.streamName ||
        'nie wybrano');

    // Goal name - either existing or new
    const goalName = createNewGoal
      ? `(NOWY) ${newGoalName || 'bez nazwy'}`
      : (goals.find(g => g.id === linkedGoalId)?.name || null);

    // Project name for ZAPLANUJ linkage
    const linkedProject = projects.find(p => p.id === linkedProjectId)?.name;

    switch (selectedAction) {
      case 'PROJEKT':
        return {
          main: `Projekt: "${projectName}"`,
          details: [
            tasks.length > 0 ? `${tasks.length} zadan jako pierwsze kroki` : null,
            `w strumieniu: ${streamName}`,
            projectDeadline ? `deadline: ${projectDeadline}` : null,
            goalName ? `realizuje cel: ${goalName}` : null,
            tags.length > 0 ? `tagi: ${tags.join(', ')}` : null,
          ].filter(Boolean)
        };
      case 'ZAPLANUJ':
        return {
          main: `Zadanie: "${projectName}"`,
          details: [
            `w strumieniu: ${streamName}`,
            dueDate ? `termin: ${dueDate}` : null,
            linkedProject ? `w projekcie: ${linkedProject}` : null,
            tags.length > 0 ? `tagi: ${tags.join(', ')}` : null,
          ].filter(Boolean)
        };
      case 'KIEDYS_MOZE':
        const reminderLabels: Record<string, string> = {
          '1m': 'za 1 miesiac',
          '3m': 'za 3 miesiace',
          '6m': 'za 6 miesiecy',
          '1y': 'za rok',
          'none': 'bez przypomnienia'
        };
        return {
          main: 'Element zamrozony',
          details: [
            'trafi do: Someday/Maybe (Kiedys/Moze)',
            `przypomnienie: ${reminderLabels[reminder] || reminder}`,
            tags.length > 0 ? `tagi: ${tags.join(', ')}` : null,
          ].filter(Boolean)
        };
      case 'REFERENCJA':
        return {
          main: 'Material referencyjny',
          details: [
            'trafi do: Materialy referencyjne',
            tags.length > 0 ? `tagi: ${tags.join(', ')}` : null,
          ].filter(Boolean)
        };
      case 'ZROB_TERAZ':
        return {
          main: 'Szybka akcja',
          details: ['wykonaj teraz (<2 min) i oznacz jako zrobione']
        };
      case 'USUN':
        return {
          main: 'Usuniecie',
          details: ['element zostanie usuniety ze zrodla']
        };
      default:
        return null;
    }
  };

  // =====================================================================
  // CORRECTION MODE: Split-panel layout (AI proposal left, user right)
  // =====================================================================
  if (correctionMode && !loading) {
    const ai = initialAnalysisData;
    const enriched = aiEnrichedData;
    const actionLabels: Record<string, string> = {
      'ZROB_TERAZ': 'Zrób teraz', 'ZAPLANUJ': 'Zaplanuj', 'PROJEKT': 'Projekt',
      'KIEDYS_MOZE': 'Kiedyś/Może', 'REFERENCJA': 'Referencja', 'USUN': 'Usuń',
    };
    const entityIcons: Record<string, string> = {
      person: '👤', company: '🏢', amount: '💰', date: '📅', deadline: '⏰', task: '✅', product: '📦',
    };
    const urgencyMap: Record<string, { label: string; color: string }> = {
      high: { label: 'Pilne', color: 'text-red-600' },
      medium: { label: 'Średnie', color: 'text-yellow-600' },
      low: { label: 'Niskie', color: 'text-green-600' },
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-3">
              <Pencil className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">Korygowanie sugestii AI</h2>
                <p className="text-sm text-amber-100">Twoje decyzje zawsze wygrywają</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Source item content */}
          <div className="bg-gray-50 border-b px-6 py-3">
            <p className="text-sm text-gray-500">Element:</p>
            <p className="font-medium text-gray-900 text-sm">"{itemContent}"</p>
          </div>

          {/* Split panel */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-5 min-h-[400px]">

              {/* LEFT: AI Proposal (read-only) */}
              <div className="col-span-2 border-r bg-indigo-50/50 p-5 space-y-4 overflow-auto">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wide">Propozycja AI</h3>
                </div>

                {/* Suggested action */}
                {ai?.suggestedAction && (
                  <div className="p-3 bg-white rounded-lg border border-indigo-200">
                    <p className="text-xs text-gray-500 mb-1">Sugerowana akcja</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-sm font-medium ${FLOW_ACTION_LABELS[ai.suggestedAction as FlowAction]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {FLOW_ACTION_LABELS[ai.suggestedAction as FlowAction]?.emoji} {actionLabels[ai.suggestedAction] || ai.suggestedAction}
                      </span>
                      {ai.confidence != null && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          ai.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                          ai.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{Math.round(ai.confidence * 100)}%</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Suggested stream */}
                {ai?.suggestedStreams && ai.suggestedStreams.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border border-indigo-200">
                    <p className="text-xs text-gray-500 mb-1">Sugerowany strumień</p>
                    <p className="text-sm font-medium text-indigo-700">→ {ai.suggestedStreams[0].streamName}</p>
                    {ai.suggestedStreams[0].confidence && (
                      <p className="text-xs text-gray-400 mt-0.5">{ai.suggestedStreams[0].confidence}% dopasowania</p>
                    )}
                  </div>
                )}

                {/* Summary */}
                {ai?.summary && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Podsumowanie</p>
                    <p className="text-sm text-gray-700">{ai.summary}</p>
                  </div>
                )}

                {/* Entities */}
                {ai?.entities && ai.entities.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Wykryte elementy</p>
                    <div className="space-y-1">
                      {ai.entities.slice(0, 8).map((e, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-sm">
                          <span>{entityIcons[e.type] || '📌'}</span>
                          <span className="text-gray-700">{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Urgency + time */}
                <div className="flex flex-wrap gap-2">
                  {ai?.urgency && urgencyMap[ai.urgency] && (
                    <span className={`text-xs font-medium ${urgencyMap[ai.urgency].color}`}>
                      {ai.urgency === 'high' ? '🔴' : ai.urgency === 'medium' ? '🟡' : '🟢'} {urgencyMap[ai.urgency].label}
                    </span>
                  )}
                  {ai?.estimatedTime && (
                    <span className="text-xs text-gray-500">⏱ {ai.estimatedTime}</span>
                  )}
                </div>

                {/* Enriched data from background AI (appears after conversation loads) */}
                {enriched?.analysis && (
                  <div className="pt-3 border-t border-indigo-100 space-y-2">
                    <p className="text-xs text-indigo-500 font-medium">Szczegóły analizy</p>
                    {enriched.analysis.ideaType && (
                      <p className="text-xs"><span className="text-gray-500">Typ:</span> <span className="text-gray-700">{enriched.analysis.ideaType}</span></p>
                    )}
                    {enriched.analysis.complexity && (
                      <p className="text-xs"><span className="text-gray-500">Złożoność:</span> <span className="text-gray-700">
                        {enriched.analysis.complexity === 'LOW' ? 'Niska' : enriched.analysis.complexity === 'MEDIUM' ? 'Średnia' : 'Wysoka'}
                      </span></p>
                    )}
                    {enriched.analysis.timeHorizon && (
                      <p className="text-xs"><span className="text-gray-500">Horyzont:</span> <span className="text-gray-700">
                        {enriched.analysis.timeHorizon === 'IMMEDIATE' ? 'Natychmiast' :
                         enriched.analysis.timeHorizon === 'SHORT_TERM' ? 'Krótkoterminowy' :
                         enriched.analysis.timeHorizon === 'LONG_TERM' ? 'Długoterminowy' : 'Kiedyś'}
                      </span></p>
                    )}
                    {enriched.analysis.missingInfo && enriched.analysis.missingInfo.length > 0 && (
                      <div className="p-2 bg-amber-50 rounded border border-amber-200 text-xs">
                        <p className="font-medium text-amber-800 mb-1">Brakujące informacje:</p>
                        {enriched.analysis.missingInfo.map((info, i) => (
                          <p key={i} className="text-amber-700">- {info}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Loading indicator for background conversation */}
                {!conversation && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 pt-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Ładowanie szczegółów...
                  </div>
                )}
              </div>

              {/* RIGHT: User's Decision (editable) */}
              <div className="col-span-3 p-5 space-y-4 overflow-auto">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Twoja decyzja</h3>
                </div>

                {/* Action selection - compact grid */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Akcja:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(FLOW_ACTION_LABELS) as [FlowAction, typeof FLOW_ACTION_LABELS[FlowAction]][]).map(([action, config]) => {
                      const isSelected = selectedAction === action;
                      const isAiSuggested = action === ai?.suggestedAction;
                      return (
                        <button
                          key={action}
                          onClick={() => handleActionChange(action)}
                          className={`p-2.5 rounded-lg border-2 text-left transition-all text-sm ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{config.emoji}</span>
                            <span className="font-medium text-xs">{config.label}</span>
                          </div>
                          {isAiSuggested && !isSelected && (
                            <span className="text-[10px] text-indigo-500">sugestia AI</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stream selection */}
                {selectedAction && selectedAction !== 'USUN' && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Strumień docelowy:</p>
                    {!createNewStream ? (
                      <>
                        <select
                          value={selectedStreamId}
                          onChange={(e) => {
                            if (e.target.value === '__NEW__') {
                              setCreateNewStream(true);
                              setSelectedStreamId('');
                            } else {
                              setSelectedStreamId(e.target.value);
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="">-- Wybierz strumień --</option>
                          {streams.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}{s.id === ai?.suggestedStreams?.[0]?.streamId ? ' (sugestia AI)' : ''}
                            </option>
                          ))}
                          <option value="__NEW__">+ Utwórz nowy strumień...</option>
                        </select>
                      </>
                    ) : (
                      <div className="space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-amber-800">Nowy strumień</span>
                          <button onClick={() => { setCreateNewStream(false); setNewStreamName(''); }} className="text-xs text-amber-600 hover:text-amber-800">Anuluj</button>
                        </div>
                        <input type="text" value={newStreamName} onChange={(e) => setNewStreamName(e.target.value)}
                          placeholder="Nazwa..." className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm" />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Kolor:</label>
                          <input type="color" value={newStreamColor} onChange={(e) => setNewStreamColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Task/Project name */}
                {(selectedAction === 'PROJEKT' || selectedAction === 'ZAPLANUJ') && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {selectedAction === 'PROJEKT' ? 'Nazwa projektu:' : 'Nazwa zadania:'}
                    </p>
                    <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
                  </div>
                )}

                {/* Due date / deadline */}
                {selectedAction === 'ZAPLANUJ' && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Termin:</p>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
                  </div>
                )}

                {selectedAction === 'PROJEKT' && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Deadline projektu:</p>
                    <input type="date" value={projectDeadline} onChange={(e) => setProjectDeadline(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
                  </div>
                )}

                {/* Tasks for PROJEKT */}
                {selectedAction === 'PROJEKT' && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Zadania (pierwsze kroki):</p>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <input type="text" value={task.title} onChange={(e) => updateTask(task.id, e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
                          <input type="date" value={task.dueDate || ''} onChange={(e) => updateTaskDate(task.id, e.target.value)}
                            className="w-36 border border-gray-300 rounded px-2 py-1.5 text-xs" />
                          <button onClick={() => removeTask(task.id)} className="p-1 text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addTask()}
                          className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Nowe zadanie..." />
                        <button onClick={addTask} disabled={!newTaskTitle.trim()}
                          className="p-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:bg-gray-300">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reminder for KIEDYS_MOZE */}
                {selectedAction === 'KIEDYS_MOZE' && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Przypomnienie:</p>
                    <select value={reminder} onChange={(e) => setReminder(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="1m">Za miesiąc</option>
                      <option value="3m">Za 3 miesiące</option>
                      <option value="6m">Za 6 miesięcy</option>
                      <option value="1y">Za rok</option>
                      <option value="none">Bez przypomnienia</option>
                    </select>
                  </div>
                )}

                {/* Tags */}
                {selectedAction && selectedAction !== 'USUN' && selectedAction !== 'ZROB_TERAZ' && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Tagi:</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                          #{tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Dodaj tag..." />
                      <button onClick={addTag} disabled={!newTag.trim()}
                        className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Creation summary */}
                {selectedAction && (() => {
                  const summary = getCreationSummary();
                  if (!summary) return null;
                  return (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mt-2">
                      <p className="text-xs font-medium text-amber-800 mb-1">Co zostanie utworzone:</p>
                      <p className="text-sm font-medium text-amber-900">{summary.main}</p>
                      {summary.details.map((d, i) => (
                        <p key={i} className="text-xs text-amber-700">- {d}</p>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <GraduationCap className="w-4 h-4" />
                AI się uczy z Twoich korekt
              </div>
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Anuluj
                </button>
                <button
                  onClick={handleExecute}
                  disabled={!selectedAction || executing || !conversation}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {executing ? (
                    <><RefreshCw className="w-5 h-5 animate-spin" /> Wykonywanie...</>
                  ) : !conversation ? (
                    <><RefreshCw className="w-5 h-5 animate-spin" /> Przygotowywanie...</>
                  ) : (
                    <><Check className="w-5 h-5" /> Zatwierdź korektę</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // NORMAL MODE: Single-column layout (existing behavior)
  // =====================================================================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Przetwarzanie elementu</h2>
              <p className="text-sm text-indigo-200">Zmodyfikuj i zatwierdz</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Analizuje element...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* Element content */}
            <div className="bg-gray-50 border-b px-6 py-4">
              <p className="text-sm text-gray-500 mb-1">Element zrodlowy:</p>
              <p className="font-medium text-gray-900">"{itemContent}"</p>
            </div>

            {/* AI Analysis Section */}
            {aiMetadata && (
              <div className="px-6 py-4 border-b bg-indigo-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Analiza AI
                  </h3>
                  {aiMetadata.confidence && (
                    <span className="text-sm text-indigo-700 font-medium">{aiMetadata.confidence}%</span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {aiMetadata.analysis?.ideaType && (
                    <p><span className="text-gray-600">Typ:</span> <span className="font-medium">{aiMetadata.analysis.ideaType}</span></p>
                  )}
                  {aiMetadata.analysis?.complexity && (
                    <p><span className="text-gray-600">Zlozonosc:</span> <span className="font-medium">{complexityLabels[aiMetadata.analysis.complexity] || aiMetadata.analysis.complexity}</span></p>
                  )}
                  {aiMetadata.analysis?.timeHorizon && (
                    <p><span className="text-gray-600">Horyzont:</span> <span className="font-medium">{timeHorizonLabels[aiMetadata.analysis.timeHorizon] || aiMetadata.analysis.timeHorizon}</span></p>
                  )}

                  {/* Missing info */}
                  {aiMetadata.analysis?.missingInfo && aiMetadata.analysis.missingInfo.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 text-xs mb-1">Brakujace informacje:</p>
                          <ul className="text-amber-700 text-xs space-y-0.5">
                            {aiMetadata.analysis.missingInfo.map((info, i) => (
                              <li key={i}>- {info}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTION SELECTION */}
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900 mb-3">Wybierz akcje:</h3>
              <div className="space-y-2">
                {aiMetadata?.actionOptions?.map((option) => {
                  const actionInfo = FLOW_ACTION_LABELS[option.action];
                  const isSelected = selectedAction === option.action;

                  return (
                    <label
                      key={option.action}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="action"
                        checked={isSelected}
                        onChange={() => handleActionChange(option.action)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.label}</span>
                          {option.isDefault && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">sugerowane</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{actionInfo?.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* EDITABLE SECTION - Based on selected action */}
            {selectedAction && (
              <div className="px-6 py-4 border-b space-y-4">
                <h3 className="font-semibold text-gray-900">Szczegoly (edytuj):</h3>

                {/* Project/Task name - editable */}
                {(selectedAction === 'PROJEKT' || selectedAction === 'ZAPLANUJ') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedAction === 'PROJEKT' ? 'Nazwa projektu:' : 'Nazwa zadania:'}
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={selectedAction === 'PROJEKT' ? 'Nazwa projektu...' : 'Nazwa zadania...'}
                    />
                  </div>
                )}

                {/* Editable tasks list - for PROJEKT */}
                {selectedAction === 'PROJEKT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zadania (pierwsze kroki):
                    </label>
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => updateTask(task.id, e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Nazwa zadania..."
                            />
                            <button
                              onClick={() => removeTask(task.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Usun zadanie"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 whitespace-nowrap">Termin:</label>
                            <input
                              type="date"
                              value={task.dueDate || ''}
                              onChange={(e) => updateTaskDate(task.id, e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Add new task */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addTask()}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Dodaj nowe zadanie..."
                        />
                        <button
                          onClick={addTask}
                          disabled={!newTaskTitle.trim()}
                          className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          title="Dodaj zadanie"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project deadline - for PROJEKT */}
                {selectedAction === 'PROJEKT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline projektu (opcjonalnie):
                    </label>
                    <input
                      type="date"
                      value={projectDeadline}
                      onChange={(e) => setProjectDeadline(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Planowana data zakonczenia projektu</p>
                  </div>
                )}

                {/* Due date - for ZAPLANUJ */}
                {selectedAction === 'ZAPLANUJ' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Termin wykonania:
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Reminder - for KIEDYS_MOZE */}
                {selectedAction === 'KIEDYS_MOZE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Przypomnienie:
                    </label>
                    <select
                      value={reminder}
                      onChange={(e) => setReminder(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="1m">Za miesiac</option>
                      <option value="3m">Za 3 miesiace</option>
                      <option value="6m">Za 6 miesiecy</option>
                      <option value="1y">Za rok</option>
                      <option value="none">Bez przypomnienia</option>
                    </select>
                  </div>
                )}

                {/* Editable tags - for all except USUN and ZROB_TERAZ */}
                {selectedAction !== 'USUN' && selectedAction !== 'ZROB_TERAZ' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tagi:
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Dodaj tag..."
                      />
                      <button
                        onClick={addTag}
                        disabled={!newTag.trim()}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Dodaj tag"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STREAM SELECTION */}
            {selectedAction && selectedAction !== 'USUN' && (
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Strumien docelowy:</h3>

                {!createNewStream ? (
                  <>
                    <select
                      value={selectedStreamId}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setCreateNewStream(true);
                          setSelectedStreamId('');
                        } else {
                          setSelectedStreamId(e.target.value);
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">-- Wybierz strumien --</option>
                      {aiMetadata?.streamMatching?.matches?.map((match) => (
                        <option key={match.streamId} value={match.streamId}>
                          {match.streamName} ({match.confidence}% dopasowania)
                        </option>
                      ))}
                      {/* Add streams not in matches */}
                      {streams
                        .filter(s => !aiMetadata?.streamMatching?.matches?.find(m => m.streamId === s.id))
                        .map(stream => (
                          <option key={stream.id} value={stream.id}>
                            {stream.name}
                          </option>
                        ))
                      }
                      <option value="__NEW__">+ Utworz nowy strumien...</option>
                    </select>

                    {aiMetadata?.streamMatching?.bestMatch && selectedStreamId === aiMetadata.streamMatching.bestMatch.streamId && (
                      <p className="text-xs text-green-600 mt-1">
                        Najlepsze dopasowanie: {aiMetadata.streamMatching.bestMatch.confidence}%
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-indigo-800">Nowy strumien</span>
                      <button
                        onClick={() => {
                          setCreateNewStream(false);
                          setNewStreamName('');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Anuluj
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newStreamName}
                      onChange={(e) => setNewStreamName(e.target.value)}
                      placeholder="Nazwa nowego strumienia..."
                      className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Kolor:</label>
                      <input
                        type="color"
                        value={newStreamColor}
                        onChange={(e) => setNewStreamColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                      />
                      <span className="text-xs text-gray-500">{newStreamColor}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PROJECT LINKAGE - for ZAPLANUJ */}
            {selectedAction === 'ZAPLANUJ' && projects.length > 0 && (
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Powiaz z projektem (opcjonalnie):</h3>
                <select
                  value={linkedProjectId}
                  onChange={(e) => setLinkedProjectId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Bez powiazania z projektem --</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Zadanie bedzie powiazane z wybranym projektem</p>
              </div>
            )}

            {/* GOAL LINKAGE - for PROJEKT */}
            {selectedAction === 'PROJEKT' && (
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Powiaz z celem (opcjonalnie):</h3>

                {!createNewGoal ? (
                  <>
                    <select
                      value={linkedGoalId}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setCreateNewGoal(true);
                          setLinkedGoalId('');
                        } else {
                          setLinkedGoalId(e.target.value);
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">-- Bez powiazania z celem --</option>
                      {goals.map(goal => (
                        <option key={goal.id} value={goal.id}>
                          {goal.name}
                        </option>
                      ))}
                      <option value="__NEW__">+ Utworz nowy cel...</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Projekt bedzie realizowac wybrany cel</p>
                  </>
                ) : (
                  <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Nowy cel</span>
                      <button
                        onClick={() => {
                          setCreateNewGoal(false);
                          setNewGoalName('');
                        }}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        Anuluj
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      placeholder="Nazwa nowego celu..."
                      className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* CREATION SUMMARY - What will be created */}
            {selectedAction && (
              <div className="px-6 py-4 bg-blue-50">
                <h3 className="font-semibold text-blue-900 mb-2">Co zostanie utworzone w STREAMS:</h3>
                {(() => {
                  const summary = getCreationSummary();
                  if (!summary) return null;
                  return (
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">{summary.main}</p>
                      {summary.details.map((detail, i) => (
                        <p key={i} className="text-blue-700 text-xs">- {detail}</p>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="border-t px-6 py-4 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleExecute}
                disabled={!selectedAction || executing || !conversation}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Wykonywanie...
                  </>
                ) : !conversation ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Przygotowywanie...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Zatwierdz
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
