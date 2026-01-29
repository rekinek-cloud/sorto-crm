'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Platnosc zakonczona pomyslnie!</h1>
        <p className="text-gray-600 mb-6">
          Dziekujemy za zakup subskrypcji STREAMS. Twoje konto zostalo zaktualizowane.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">
            Przekierowanie do strony rozliczen za {countdown} sekund...
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/billing')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Przejdz teraz
          <ArrowRightIcon className="h-4 w-4" />
        </button>

        {sessionId && (
          <p className="mt-4 text-xs text-gray-400">
            ID sesji: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
}
