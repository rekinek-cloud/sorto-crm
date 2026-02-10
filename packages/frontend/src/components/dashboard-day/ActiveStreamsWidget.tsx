'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { BentoCard, ProgressBar } from '@/components/dashboard-v2/BentoCard';

interface StreamProgress {
  id: string;
  name: string;
  color: string;
  activeTasks: number;
  completedTasks: number;
  totalTasks: number;
  completionPercent: number;
}

interface ActiveStreamsWidgetProps {
  streams: StreamProgress[];
  loading?: boolean;
}

export function ActiveStreamsWidget({ streams, loading }: ActiveStreamsWidgetProps) {
  const router = useRouter();

  return (
    <BentoCard
      title="Aktywne Strumienie"
      icon={Layers}
      iconColor="text-blue-600"
      variant="glass"
      loading={loading}
      headerAction={
        <button
          onClick={() => router.push('/dashboard/streams')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Zobacz &rarr;
        </button>
      }
    >
      {streams.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Brak aktywnych strumieni</p>
      ) : (
        <div className="space-y-3">
          {streams.map(s => (
            <div
              key={s.id}
              onClick={() => router.push('/dashboard/streams')}
              className="cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm font-medium text-slate-700 truncate">{s.name}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {s.completedTasks}/{s.totalTasks}
                </span>
              </div>
              <ProgressBar
                value={s.completionPercent}
                color={`bg-[${s.color}]`}
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
}
