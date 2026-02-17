'use client';

import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { InboxItem } from '@/lib/api/sourceInbox';

interface InboxItemCardProps {
  item: InboxItem;
  onProcess: () => void;
  onDelete: () => void;
  onClick?: () => void;
}

export default function InboxItemCard({ item, onProcess, onDelete, onClick }: InboxItemCardProps) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'email': return '📧';
      case 'slack': return '💬';
      case 'voice': return '🎤';
      case 'scan': return '📄';
      case 'quick-capture': return '⚡';
      default: return '📝';
    }
  };

  const getDecisionBadge = (decision?: string) => {
    if (!decision) return null;
    
    const badges: Record<string, { text: string; className: string }> = {
      DO: { text: 'Zrobione', className: 'bg-green-100 text-green-800' },
      DEFER: { text: 'Odłożone', className: 'bg-yellow-100 text-yellow-800' },
      DELEGATE: { text: 'Delegowane', className: 'bg-blue-100 text-blue-800' },
      DELETE: { text: 'Usunięte', className: 'bg-red-100 text-red-800' },
      REFERENCE: { text: 'Referencja', className: 'bg-purple-100 text-purple-800' },
      PROJECT: { text: 'Projekt', className: 'bg-indigo-100 text-indigo-800' },
      SOMEDAY: { text: 'Kiedyś/Może', className: 'bg-gray-100 text-gray-800' }
    };
    
    const badge = badges[decision];
    if (!badge) return null;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div 
      className={`p-6 hover:bg-gray-50 transition-colors ${item.processed ? 'opacity-60' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Source Icon */}
        <div className="text-2xl">{getSourceIcon(item.source)}</div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className={`text-gray-900 ${item.processed ? 'line-through' : ''}`}>
                {item.content}
              </p>
              {item.note && (
                <p className="mt-1 text-sm text-gray-600">{item.note}</p>
              )}
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Dodano {formatDistanceToNow(new Date(item.capturedAt), { 
                    addSuffix: true, 
                    locale: pl 
                  })}
                </span>
                <span>przez {item.capturedBy.firstName} {item.capturedBy.lastName}</span>
                {item.sourceUrl && (
                  <a 
                    href={item.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    Źródło →
                  </a>
                )}
              </div>
              {item.processed && item.processedAt && (
                <div className="mt-2 flex items-center gap-2">
                  {getDecisionBadge(item.processingDecision)}
                  <span className="text-xs text-gray-500">
                    Przetworzono {formatDistanceToNow(new Date(item.processedAt), { 
                      addSuffix: true, 
                      locale: pl 
                    })}
                  </span>
                  {item.resultingTask && (
                    <a 
                      href={`/dashboard/tasks/${item.resultingTask.id}`}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      → {item.resultingTask.title}
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions */}
            {!item.processed && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onProcess}
                  className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                >
                  Przetwórz
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Usuń"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}