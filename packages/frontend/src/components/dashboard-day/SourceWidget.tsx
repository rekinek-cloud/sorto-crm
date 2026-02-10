'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { BentoCard } from '@/components/dashboard-v2/BentoCard';

interface SourceWidgetProps {
  unprocessedCount: number;
  awaitingDecisionCount: number;
  loading?: boolean;
}

export function SourceWidget({ unprocessedCount, awaitingDecisionCount, loading }: SourceWidgetProps) {
  const router = useRouter();

  return (
    <BentoCard
      title="Zrodlo"
      icon={Inbox}
      iconColor="text-slate-600"
      value={unprocessedCount}
      variant="glass"
      loading={loading}
      onClick={() => router.push('/dashboard/source')}
    >
      <div className="space-y-2">
        {awaitingDecisionCount > 0 && (
          <p className="text-xs text-amber-600 font-medium">
            {awaitingDecisionCount} czeka na decyzje
          </p>
        )}
        {unprocessedCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push('/dashboard/source');
            }}
            className="w-full py-1.5 text-xs font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Przetworz teraz (~{Math.max(1, Math.round(unprocessedCount * 1))} min)
          </button>
        )}
        {unprocessedCount === 0 && (
          <p className="text-xs text-emerald-600 font-medium">Zrodlo czyste!</p>
        )}
      </div>
    </BentoCard>
  );
}
