'use client';

/**
 * AI Suggestion Panel - Human-in-the-Loop
 * Komponent zgodny ze spec.md sekcja 7.1
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Bot,
  Check,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  Zap,
  Calendar,
  Users,
  FolderOpen,
  Archive,
  Trash2,
  Clock,
  Target
} from 'lucide-react';
import {
  SourceItemSuggestion,
  SuggestedAction,
  Priority,
  submitFeedback
} from '@/lib/api/aiAssistant';

interface AISuggestionPanelProps {
  suggestionId: string;
  suggestion: SourceItemSuggestion;
  onAccept?: (suggestionId: string) => void;
  onReject?: (suggestionId: string) => void;
  onModify?: (suggestionId: string, modifications: any) => void;
  onClose?: () => void;
  className?: string;
}

const actionLabels: Record<SuggestedAction, string> = {
  DO_NOW: 'Zrób teraz',
  SCHEDULE: 'Zaplanuj',
  DELEGATE: 'Deleguj',
  PROJECT: 'Utwórz strumień projektowy',
  REFERENCE: 'Strumień referencyjny',
  SOMEDAY: 'Zamroź',
  DELETE: 'Usuń'
};

const actionIcons: Record<SuggestedAction, React.ElementType> = {
  DO_NOW: Zap,
  SCHEDULE: Calendar,
  DELEGATE: Users,
  PROJECT: FolderOpen,
  REFERENCE: Archive,
  SOMEDAY: Clock,
  DELETE: Trash2
};

const priorityColors: Record<Priority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700'
};

const priorityLabels: Record<Priority, string> = {
  LOW: 'Niski',
  MEDIUM: 'Średni',
  HIGH: 'Wysoki',
  URGENT: 'Pilny'
};

export function AISuggestionPanel({
  suggestionId,
  suggestion,
  onAccept,
  onReject,
  onModify,
  onClose,
  className = ''
}: AISuggestionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [modifications, setModifications] = useState<Partial<SourceItemSuggestion>>({});

  const ActionIcon = actionIcons[suggestion.suggestedAction];

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await submitFeedback(suggestionId, true);
      onAccept?.(suggestionId);
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await submitFeedback(suggestionId, false);
      onReject?.(suggestionId);
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = async () => {
    if (Object.keys(modifications).length === 0) {
      setIsModifying(false);
      return;
    }

    setIsLoading(true);
    try {
      await submitFeedback(suggestionId, true, modifications);
      onModify?.(suggestionId, modifications);
    } catch (error) {
      console.error('Failed to modify suggestion:', error);
    } finally {
      setIsLoading(false);
      setIsModifying(false);
    }
  };

  // Confidence bar color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card className={`border-2 border-purple-200 bg-purple-50/30 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Bot className="h-4 w-4 text-purple-600" />
            Sugestia AI
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main suggestion */}
        <div className="space-y-3">
          {/* Action */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Proponuję:</span>
            <Badge className="flex items-center gap-1 bg-purple-100 text-purple-700">
              <ActionIcon className="h-3 w-3" />
              {actionLabels[suggestion.suggestedAction]}
            </Badge>
          </div>

          {/* Stream */}
          {suggestion.suggestedStream && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Strumień:</span>
              <Badge variant="outline">{suggestion.suggestedStream}</Badge>
            </div>
          )}

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Priorytet:</span>
            <Badge className={priorityColors[suggestion.suggestedPriority]}>
              {priorityLabels[suggestion.suggestedPriority]}
            </Badge>
          </div>

          {/* Due date */}
          {suggestion.suggestedDueDate && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Termin:</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(suggestion.suggestedDueDate).toLocaleDateString('pl-PL')}
              </Badge>
            </div>
          )}

          {/* Extracted tasks */}
          {suggestion.extractedTasks.length > 0 && (
            <div className="space-y-1">
              <span className="text-sm text-gray-600">Wykryte zadania:</span>
              <ul className="list-disc list-inside text-sm text-gray-700 pl-2">
                {suggestion.extractedTasks.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Assistant Message (V3) or Reasoning (V1) */}
        <div className="bg-white rounded-lg p-3 border border-purple-100">
          <p className="text-sm text-gray-700">
            <span className="font-medium">💡 </span>
            {suggestion.assistantMessage || suggestion.reasoning}
          </p>
        </div>

        {/* V3: First Steps */}
        {suggestion.firstSteps && suggestion.firstSteps.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-sm font-medium text-blue-800 mb-2">🚀 Pierwsze kroki:</p>
            <ul className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              {suggestion.firstSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* V3: Thinking Details (collapsible) */}
        {suggestion.thinking && (
          <details className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              🧠 Tok myślenia AI
            </summary>
            <div className="mt-2 space-y-2 text-xs text-gray-600">
              {suggestion.thinking.step1_understanding && (
                <div>
                  <strong>Zrozumienie:</strong> {suggestion.thinking.step1_understanding.whatIsIt}
                  <span className="ml-2 text-gray-500">({suggestion.thinking.step1_understanding.context})</span>
                </div>
              )}
              {suggestion.thinking.step3_methodology && (
                <div>
                  <strong>Metodologia:</strong> {suggestion.thinking.step3_methodology.bestFit} - {suggestion.thinking.step3_methodology.reasoning}
                </div>
              )}
            </div>
          </details>
        )}

        {/* Confidence bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Pewność:</span>
            <span>{suggestion.confidence}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getConfidenceColor(suggestion.confidence)} transition-all`}
              style={{ width: `${suggestion.confidence}%` }}
            />
          </div>
        </div>

        {/* Expand/collapse details */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-center text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Zwiń szczegóły
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Pokaż szczegóły
            </>
          )}
        </Button>

        {/* Expanded details - modification form */}
        {isExpanded && isModifying && (
          <div className="space-y-3 p-3 bg-white rounded-lg border">
            <p className="text-sm font-medium">Modyfikuj sugestię:</p>

            {/* Action selector */}
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Akcja:</label>
              <select
                className="w-full p-2 text-sm border rounded-md"
                value={modifications.suggestedAction || suggestion.suggestedAction}
                onChange={(e) => setModifications({
                  ...modifications,
                  suggestedAction: e.target.value as SuggestedAction
                })}
              >
                {Object.entries(actionLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Priority selector */}
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Priorytet:</label>
              <select
                className="w-full p-2 text-sm border rounded-md"
                value={modifications.suggestedPriority || suggestion.suggestedPriority}
                onChange={(e) => setModifications({
                  ...modifications,
                  suggestedPriority: e.target.value as Priority
                })}
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleModify} disabled={isLoading}>
                Zapisz zmiany
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsModifying(false);
                  setModifications({});
                }}
              >
                Anuluj
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-1" />
            Akceptuj
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsModifying(true);
              setIsExpanded(true);
            }}
            disabled={isLoading}
            className="flex-1"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Modyfikuj
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Odrzuć
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AISuggestionPanel;
