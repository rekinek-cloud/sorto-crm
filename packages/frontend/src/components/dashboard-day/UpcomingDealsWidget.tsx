'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { BentoCard } from '@/components/dashboard-v2/BentoCard';

interface UpcomingDeal {
  id: string;
  title: string;
  value: number | null;
  currency: string;
  stage: string;
  expectedCloseDate: string | null;
  companyName: string;
  companyId: string;
}

interface UpcomingDealsWidgetProps {
  deals: UpcomingDeal[];
  loading?: boolean;
}

const stageLabels: Record<string, string> = {
  PROSPECT: 'Prospekt',
  QUALIFIED: 'Kwalif.',
  PROPOSAL: 'Oferta',
  NEGOTIATION: 'Negocjacje',
};

function formatValue(value: number | null, currency: string): string {
  if (!value) return '';
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k ${currency}`;
  return `${value} ${currency}`;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function UpcomingDealsWidget({ deals, loading }: UpcomingDealsWidgetProps) {
  const router = useRouter();

  return (
    <BentoCard
      title="Deale w Terminie"
      icon={Briefcase}
      iconColor="text-purple-600"
      variant="glass"
      loading={loading}
      onClick={() => router.push('/dashboard/deals')}
    >
      {deals.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Brak dealow w terminie</p>
      ) : (
        <div className="space-y-2">
          {deals.map(deal => {
            const days = daysUntil(deal.expectedCloseDate);
            return (
              <div key={deal.id} className="flex items-start justify-between gap-2 py-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{deal.title}</p>
                  <p className="text-xs text-slate-500 truncate">{deal.companyName}</p>
                </div>
                <div className="shrink-0 text-right">
                  {deal.value && (
                    <p className="text-xs font-semibold text-slate-800">{formatValue(deal.value, deal.currency)}</p>
                  )}
                  {days !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      days <= 1 ? 'bg-red-100 text-red-700' : days <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {days === 0 ? 'Dzis' : days === 1 ? 'Jutro' : `za ${days}d`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BentoCard>
  );
}
