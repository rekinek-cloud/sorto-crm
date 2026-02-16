'use client';

import { InboxItem as InboxItemType } from '@/lib/api/workflow';

interface InboxItemProps {
  item: InboxItemType;
  onQuickAction: (action: 'QUICK_DO' | 'QUICK_DEFER' | 'QUICK_DELETE') => void;
  onProcess: () => void;
}

export default function InboxItem({ item, onQuickAction, onProcess }: InboxItemProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'email': return '📧';
      case 'slack': return '💬';
      case 'manual': return '✏️';
      default: return '📝';
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{getSourceIcon(item.source)}</span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(item.priority)}`}>
              {item.priority}
            </span>
            {item.urgencyScore && item.urgencyScore > 70 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                URGENT
              </span>
            )}
            {item.processed && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                PROCESSED
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {item.title}
          </h3>
          
          {item.description && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {item.description}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Source: {item.source}</span>
            {item.estimatedTime && (
              <span>Est. time: {item.estimatedTime}</span>
            )}
            {item.contextSuggested && (
              <span>Context: {item.contextSuggested}</span>
            )}
            <span>{new Date(item.receivedAt).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {!item.processed && (
            <>
              {/* Quick Actions */}
              <button
                onClick={() => onQuickAction('QUICK_DO')}
                className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                title="Quick Do"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              
              <button
                onClick={() => onQuickAction('QUICK_DEFER')}
                className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-md"
                title="Quick Defer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <button
                onClick={() => onQuickAction('QUICK_DELETE')}
                className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                title="Quick Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              
              {/* Full Processing */}
              <button
                onClick={onProcess}
                className="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-100 rounded-md"
              >
                Process
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}