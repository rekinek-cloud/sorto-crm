'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard/billing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <PageShell>
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Platnosc zakonczona pomyslnie!</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Dziekujemy za zakup subskrypcji STREAMS. Twoje konto zostalo zaktualizowane.
          </p>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 mb-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Przekierowanie do strony rozliczen za {countdown} sekund...
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard/billing')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Przejdz teraz
            <ArrowRight className="h-4 w-4" />
          </button>

          {sessionId && (
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              ID sesji: {sessionId.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
