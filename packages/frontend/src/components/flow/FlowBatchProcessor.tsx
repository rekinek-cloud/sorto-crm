'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { flowApi, FlowAction, FlowPendingItem, FLOW_ACTION_LABELS } from '@/lib/api/flow';
import { toast } from 'react-hot-toast';

interface Stream {
  id: string;
  name: string;
  color?: string;
}

interface FlowBatchProcessorProps {
  items: FlowPendingItem[];
  streams: Stream[];
  onClose: () => void;
  onProcessed: () => void;
}

interface BatchItem extends FlowPendingItem {
  selectedAction?: FlowAction;
  selectedStreamId?: string;
  isExpanded?: boolean;
}

export default function FlowBatchProcessor({ items, streams, onClose, onProcessed }: FlowBatchProcessorProps) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>(items.map(item => ({ ...item, isExpanded: false })));
  const [globalAction, setGlobalAction] = useState<FlowAction | ''>('');
  const [globalStreamId, setGlobalStreamId] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(items.map(i => i.id)));

  // Load AI suggestions for all items
  useEffect(() => {
    const loadSuggestions = async () => {
      setLoadingAi(true);
      try {
        const elementIds = items.map(i => i.id);
        const suggestions = await flowApi.getBatchSuggestions(elementIds);

        setBatchItems(prev => prev.map(item => ({
          ...item,
          selectedAction: suggestions[item.id]?.action || item.selectedAction,
          selectedStreamId: suggestions[item.id]?.streamId || item.selectedStreamId,
          aiSuggestion: suggestions[item.id] || item.aiSuggestion,
        })));
      } catch (error) {
        console.error('Failed to load AI suggestions:', error);
      } finally {
        setLoadingAi(false);
      }
    };

    if (items.length > 0) {
      loadSuggestions();
    }
  }, [items]);

  // Toggle item selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  // Apply global action to all selected items
  const applyGlobalAction = () => {
    if (!globalAction) return;

    setBatchItems(prev => prev.map(item => {
      if (selectedIds.has(item.id)) {
        return {
          ...item,
          selectedAction: globalAction,
          selectedStreamId: globalStreamId || item.selectedStreamId,
        };
      }
      return item;
    }));
  };

  // Accept all AI suggestions
  const acceptAllAiSuggestions = () => {
    setBatchItems(prev => prev.map(item => {
      if (selectedIds.has(item.id) && item.aiSuggestion) {
        return {
          ...item,
          selectedAction: item.aiSuggestion.action,
          selectedStreamId: item.aiSuggestion.streamId || item.selectedStreamId,
        };
      }
      return item;
    }));
    toast.success('Zaakceptowano sugestie AI dla wybranych elementów');
  };

  // Update single item
  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setBatchItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Process batch
  const handleProcessBatch = async () => {
    const itemsToProcess = batchItems.filter(
      item => selectedIds.has(item.id) && item.selectedAction
    );

    if (itemsToProcess.length === 0) {
      toast.error('Wybierz elementy i przypisz akcje');
      return;
    }

    // Validate (STREAMS methodology)
    const invalidItems = itemsToProcess.filter(item => {
      if ((item.selectedAction === 'ZAPLANUJ' || item.selectedAction === 'REFERENCJA') && !item.selectedStreamId) {
        return true;
      }
      return false;
    });

    if (invalidItems.length > 0) {
      toast.error(`${invalidItems.length} elementów wymaga wybrania strumienia`);
      return;
    }

    setProcessing(true);
    try {
      const result = await flowApi.batchProcess(
        itemsToProcess.map(item => ({
          elementId: item.id,
          action: item.selectedAction!,
          targetStreamId: item.selectedStreamId,
        }))
      );

      toast.success(`Przetworzono ${result.successCount} elementów`);
      if (result.failureCount > 0) {
        toast.error(`${result.failureCount} elementów nie udało się przetworzyć`);
      }

      onProcessed();
      onClose();
    } catch (error: any) {
      console.error('Batch processing failed:', error);
      toast.error(error.response?.data?.message || 'Błąd podczas przetwarzania');
    } finally {
      setProcessing(false);
    }
  };

  const selectedCount = selectedIds.size;
  const readyCount = batchItems.filter(item => selectedIds.has(item.id) && item.selectedAction).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Batch Flow Processing
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Przetwórz {selectedCount} elementów jednocześnie
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Actions Bar */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-4 border-b">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === items.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">Zaznacz wszystkie</span>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Akcja zbiorowa:</label>
              <select
                value={globalAction}
                onChange={(e) => setGlobalAction(e.target.value as FlowAction | '')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Wybierz --</option>
                {(Object.entries(FLOW_ACTION_LABELS) as [FlowAction, typeof FLOW_ACTION_LABELS[FlowAction]][]).map(([action, config]) => (
                  <option key={action} value={action}>{config.emoji} {config.label}</option>
                ))}
              </select>

              {(globalAction === 'ZAPLANUJ' || globalAction === 'REFERENCJA') && (
                <select
                  value={globalStreamId}
                  onChange={(e) => setGlobalStreamId(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Strumień --</option>
                  {streams.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}

              <button
                onClick={applyGlobalAction}
                disabled={!globalAction}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Zastosuj
              </button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            <button
              onClick={acceptAllAiSuggestions}
              disabled={loadingAi}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:bg-gray-300"
            >
              {loadingAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ładowanie AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Zaakceptuj sugestie AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {batchItems.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg transition-all ${
                  selectedIds.has(item.id) ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'
                }`}
              >
                {/* Item Header */}
                <div className="p-4 flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />

                  <button
                    onClick={() => updateItem(item.id, { isExpanded: !item.isExpanded })}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {item.isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{item.type}</span>
                      {item.aiSuggestion && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          AI: {FLOW_ACTION_LABELS[item.aiSuggestion.action]?.emoji} {(item.aiSuggestion.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action selector */}
                  <select
                    value={item.selectedAction || ''}
                    onChange={(e) => updateItem(item.id, { selectedAction: e.target.value as FlowAction })}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Akcja --</option>
                    {(Object.entries(FLOW_ACTION_LABELS) as [FlowAction, typeof FLOW_ACTION_LABELS[FlowAction]][]).map(([action, config]) => (
                      <option key={action} value={action}>{config.emoji} {config.label}</option>
                    ))}
                  </select>

                  {/* Stream selector (if needed for ZAPLANUJ and REFERENCJA) */}
                  {(item.selectedAction === 'ZAPLANUJ' || item.selectedAction === 'REFERENCJA') && (
                    <select
                      value={item.selectedStreamId || ''}
                      onChange={(e) => updateItem(item.id, { selectedStreamId: e.target.value })}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Strumień --</option>
                      {streams.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Status indicator */}
                  {item.selectedAction && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      (item.selectedAction === 'ZAPLANUJ' || item.selectedAction === 'REFERENCJA') && !item.selectedStreamId
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {item.isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 ml-12">
                    {item.content && (
                      <p className="text-sm text-gray-600 mt-2">{item.content}</p>
                    )}
                    {item.aiSuggestion && (
                      <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
                        <p className="text-purple-800">
                          <strong>AI sugeruje:</strong> {FLOW_ACTION_LABELS[item.aiSuggestion.action]?.label}
                          {item.aiSuggestion.streamName && ` → ${item.aiSuggestion.streamName}`}
                        </p>
                        {item.aiSuggestion.reasoning?.[0] && (
                          <p className="text-purple-600 text-xs mt-1">{item.aiSuggestion.reasoning[0]}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t px-6 py-4 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            Wybrano: <strong>{selectedCount}</strong> | Gotowe do przetworzenia: <strong>{readyCount}</strong>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={handleProcessBatch}
              disabled={readyCount === 0 || processing}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Przetwórz ({readyCount})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
