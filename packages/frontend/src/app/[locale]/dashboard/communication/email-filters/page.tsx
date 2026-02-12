'use client';

import React, { useEffect } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

export default function EmailFiltersPage() {
  // Auto redirect to Rules Manager with EMAIL_FILTER tab
  useEffect(() => {
    window.location.href = '/dashboard/rules-manager/';
  }, []);

  return (
    <PageShell>
      <PageHeader
        title="Filtry Email"
        subtitle="Zarzadzanie filtrami email zostalo przeniesione do zunifikowanego Rules Manager"
        icon={Mail}
        iconColor="text-green-600"
      />

      {/* Redirect Info */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
        <Mail className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Filtry Email</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Filtry email zostaly zintegrowane z zunifikowanym systemem regul.<br/>
          Przekierowujemy Cie do Rules Manager - zakladka &quot;Filtry Email&quot;
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
