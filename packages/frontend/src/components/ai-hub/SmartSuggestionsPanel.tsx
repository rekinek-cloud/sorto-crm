'use client';

/**
 * SmartSuggestionsPanel - Bottom panel with AI-suggested actions
 * Shows proactive recommendations for tasks, follow-ups, etc.
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Phone,
  Mail,
  CheckSquare,
  Calendar,
  TrendingUp,
  User,
  Building,
  Sparkles,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SmartSuggestion } from '@/lib/api/aiHub';

interface SmartSuggestionsPanelProps {
  suggestions: SmartSuggestion[];
  isLoading: boolean;
  onAccept: (suggestion: SmartSuggestion) => Promise<void>;
  onDismiss: (suggestion: SmartSuggestion) => Promise<void>;
}

const typeIcons: Record<string, React.ElementType> = {
  contact: Phone,
  task: CheckSquare,
  follow_up: Mail,
  schedule: Calendar,
  deal_action: TrendingUp
};

const actionIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  create_task: CheckSquare,
  update_deal: TrendingUp,
  schedule_meeting: Calendar
};

const priorityColors = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500'
};

export function SmartSuggestionsPanel({
  suggestions,
  isLoading,
  onAccept,
  onDismiss
}: SmartSuggestionsPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (suggestion: SmartSuggestion) => {
    setProcessingId(suggestion.id);
    try {
      await onAccept(suggestion);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (suggestion: SmartSuggestion) => {
    setProcessingId(suggestion.id);
    try {
      await onDismiss(suggestion);
    } finally {
      setProcessingId(null);
    }
  };

  const nextSuggestion = () => {
    setCurrentIndex((prev) => (prev + 1) % suggestions.length);
  };

  const prevSuggestion = () => {
    setCurrentIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
  };

  if (isLoading) {
    return (
      <Card className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
          <div className="flex-1">
            <div className="w-48 h-4 bg-purple-200/50 rounded animate-pulse" />
            <div className="w-32 h-3 bg-purple-200/50 rounded mt-1 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">Brak aktywnych sugestii</p>
            <p className="text-xs text-gray-400">Wszystko jest na bieżąco!</p>
          </div>
        </div>
      </Card>
    );
  }

  const currentSuggestion = suggestions[currentIndex];
  const TypeIcon = typeIcons[currentSuggestion.type] || Sparkles;
  const ActionIcon = actionIcons[currentSuggestion.suggestedAction?.type] || CheckSquare;
  const isProcessing = processingId === currentSuggestion.id;

  return (
    <Card className={`p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 ${priorityColors[currentSuggestion.priority]}`}>
      <div className="flex items-center gap-3">
        {/* Navigation (if multiple) */}
        {suggestions.length > 1 && (
          <button
            onClick={prevSuggestion}
            className="p-1 hover:bg-white/50 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <TypeIcon className="w-5 h-5 text-purple-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-800 truncate">
              {currentSuggestion.title}
            </h4>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              currentSuggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
              currentSuggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {currentSuggestion.priority === 'high' ? 'Pilne' :
               currentSuggestion.priority === 'medium' ? 'Średnie' : 'Niska'}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {currentSuggestion.reason}
          </p>

          {/* Entity info */}
          {currentSuggestion.entity && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              {currentSuggestion.entity.type === 'contact' && <User className="w-3 h-3" />}
              {currentSuggestion.entity.type === 'company' && <Building className="w-3 h-3" />}
              <span>{currentSuggestion.entity.name}</span>
            </div>
          )}

          {/* Due by */}
          {currentSuggestion.dueBy && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>Do: {new Date(currentSuggestion.dueBy).toLocaleDateString('pl-PL')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(currentSuggestion)}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => handleAccept(currentSuggestion)}
            disabled={isProcessing}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ActionIcon className="w-4 h-4 mr-1" />
                Wykonaj
              </>
            )}
          </Button>
        </div>

        {/* Navigation (if multiple) */}
        {suggestions.length > 1 && (
          <button
            onClick={nextSuggestion}
            className="p-1 hover:bg-white/50 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pagination dots */}
      {suggestions.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {suggestions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentIndex ? 'bg-purple-600' : 'bg-purple-200'
              }`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export default SmartSuggestionsPanel;
