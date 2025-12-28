'use client';

/**
 * ChatQuickActions - Renders action buttons in chat messages
 * Allows users to execute actions directly from AI responses
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  ExternalLink,
  Plus,
  Edit,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { QuickAction } from '@/lib/api/aiHub';

interface ChatQuickActionsProps {
  actions: QuickAction[];
  onExecute: (action: QuickAction) => Promise<{ success: boolean; message?: string }>;
}

export function ChatQuickActions({ actions, onExecute }: ChatQuickActionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; message?: string }>>({});

  const handleClick = async (action: QuickAction) => {
    // Handle navigation separately
    if (action.type === 'navigate' && action.data?.href) {
      window.location.href = action.data.href;
      return;
    }

    // Confirm if required
    if (action.confirmRequired) {
      const confirmed = window.confirm(`Czy na pewno chcesz wykonać: ${action.label}?`);
      if (!confirmed) return;
    }

    setLoadingId(action.id);
    try {
      const result = await onExecute(action);
      setResults(prev => ({ ...prev, [action.id]: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, [action.id]: { success: false, message: 'Wystąpił błąd' } }));
    } finally {
      setLoadingId(null);
    }
  };

  const getActionIcon = (type: QuickAction['type']) => {
    switch (type) {
      case 'navigate':
        return <ExternalLink className="w-3 h-3" />;
      case 'create':
        return <Plus className="w-3 h-3" />;
      case 'update':
        return <Edit className="w-3 h-3" />;
      case 'call':
        return <Phone className="w-3 h-3" />;
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'schedule':
        return <Calendar className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getActionStyle = (type: QuickAction['type']) => {
    switch (type) {
      case 'navigate':
        return 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200';
      case 'create':
        return 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200';
      case 'update':
        return 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'call':
        return 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200';
      case 'email':
        return 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'schedule':
        return 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const isLoading = loadingId === action.id;
        const result = results[action.id];

        // Show result state
        if (result) {
          return (
            <div
              key={action.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                result.success
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {result.message || (result.success ? 'Wykonano' : 'Błąd')}
            </div>
          );
        }

        return (
          <button
            key={action.id}
            onClick={() => handleClick(action)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${getActionStyle(action.type)} ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              getActionIcon(action.type)
            )}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

export default ChatQuickActions;
