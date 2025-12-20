'use client';

import type { InboxStats } from '@/lib/api/gtdInbox';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface InboxStatsCardProps {
  stats: InboxStats;
}

export default function InboxStatsCard({ stats }: InboxStatsCardProps) {
  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      manual: 'Ręczne',
      email: 'Email',
      slack: 'Slack',
      'quick-capture': 'Szybkie dodawanie',
      voice: 'Głosowe',
      scan: 'Skan'
    };
    return labels[source] || source;
  };

  const getDecisionLabel = (decision: string) => {
    const labels: Record<string, string> = {
      DO: 'Zrobione',
      DEFER: 'Odłożone',
      DELEGATE: 'Delegowane',
      DELETE: 'Usunięte',
      REFERENCE: 'Referencja',
      PROJECT: 'Projekt',
      SOMEDAY: 'Kiedyś/Może'
    };
    return labels[decision] || decision;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Statystyki Inbox</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Wszystkie elementy</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-primary-600">{stats.unprocessed}</p>
          <p className="text-sm text-gray-600">Do przetworzenia</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-green-600">{stats.processed}</p>
          <p className="text-sm text-gray-600">Przetworzone</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-blue-600">{stats.processingRate.toFixed(0)}%</p>
          <p className="text-sm text-gray-600">Wskaźnik przetwarzania</p>
        </div>
      </div>

      {/* Sources breakdown */}
      {stats.bySource.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Według źródła:</h3>
          <div className="flex flex-wrap gap-2">
            {stats.bySource.map(({ source, count }) => (
              <span 
                key={source} 
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {getSourceLabel(source)}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Decisions breakdown */}
      {stats.byDecision.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Decyzje przetwarzania:</h3>
          <div className="flex flex-wrap gap-2">
            {stats.byDecision.map(({ decision, count }) => (
              <span 
                key={decision} 
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {getDecisionLabel(decision)}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Last processed */}
      {stats.lastProcessed && (
        <div className="text-sm text-gray-600">
          Ostatnie przetwarzanie:{' '}
          {formatDistanceToNow(new Date(stats.lastProcessed), { 
            addSuffix: true, 
            locale: pl 
          })}
        </div>
      )}
    </div>
  );
}