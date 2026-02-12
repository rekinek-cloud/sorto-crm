'use client';

import React, { useEffect } from 'react';
import { Settings, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CommunicationRulesManagerRedirect() {
  // Auto redirect to new Rules Manager location
  useEffect(() => {
    window.location.href = '/dashboard/rules-manager/';
  }, []);

  return (
    <PageShell>
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
        <Settings className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Rules Manager</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Strona zostala przeniesiona do nowej lokalizacji
        </p>
        <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
          <span>Przekierowanie...</span>
          <ArrowRight className="w-5 h-5" />
          <span>Rules Manager</span>
        </div>
      </div>
    </PageShell>
  );
}
