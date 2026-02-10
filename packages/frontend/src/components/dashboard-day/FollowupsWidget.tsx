'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PhoneCall } from 'lucide-react';
import { BentoCard } from '@/components/dashboard-v2/BentoCard';

interface Followup {
  companyId: string;
  companyName: string;
  daysSinceContact: number;
  activeDealsCount: number;
  topDeal: {
    id: string;
    title: string;
    value: number | null;
    stage: string;
  } | null;
}

interface FollowupsWidgetProps {
  followups: Followup[];
  loading?: boolean;
}

function daysBadgeColor(days: number): string {
  if (days > 14) return 'bg-red-100 text-red-700';
  if (days > 7) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export function FollowupsWidget({ followups, loading }: FollowupsWidgetProps) {
  const router = useRouter();

  return (
    <BentoCard
      title="Do Kontaktu"
      icon={PhoneCall}
      iconColor="text-emerald-600"
      variant="glass"
      loading={loading}
    >
      {followups.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Brak firm do kontaktu</p>
      ) : (
        <div className="space-y-2">
          {followups.map(f => (
            <div
              key={f.companyId}
              onClick={() => router.push(`/dashboard/companies`)}
              className="flex items-center justify-between gap-2 py-1 cursor-pointer hover:bg-slate-50 rounded-lg px-1 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 truncate">{f.companyName}</p>
                {f.topDeal && (
                  <p className="text-xs text-slate-500 truncate">{f.topDeal.title}</p>
                )}
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${daysBadgeColor(f.daysSinceContact)}`}>
                {f.daysSinceContact}d
              </span>
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
}
