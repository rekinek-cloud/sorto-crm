'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BriefingWidgetProps {
  greeting: string;
  date: string;
  summary: string[];
  tip: string;
  urgencyLevel: 'calm' | 'busy' | 'critical';
  hasSourceItems: boolean;
}

const urgencyColors = {
  calm: { dot: 'bg-emerald-500', bg: 'from-emerald-50 to-white', border: 'border-emerald-200' },
  busy: { dot: 'bg-amber-500', bg: 'from-amber-50 to-white', border: 'border-amber-200' },
  critical: { dot: 'bg-red-500', bg: 'from-red-50 to-white', border: 'border-red-200' },
};

export function BriefingWidget({ greeting, date, summary, tip, urgencyLevel, hasSourceItems }: BriefingWidgetProps) {
  const router = useRouter();
  const colors = urgencyColors[urgencyLevel];

  const handleStartDay = () => {
    router.push(hasSourceItems ? '/dashboard/source' : '/dashboard/tasks');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border bg-gradient-to-br ${colors.bg} ${colors.border} p-5 overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-800">{greeting}</h1>
            <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} animate-pulse`} />
          </div>
          <p className="text-sm text-slate-500 mb-4">{date}</p>

          {summary.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {summary.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/80 border border-slate-200 text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {tip && (
            <div className="flex items-start gap-2 text-sm text-slate-600 italic">
              <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>{tip}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleStartDay}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors"
        >
          Zacznij dzien
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
