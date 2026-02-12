'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, X, Sparkles } from 'lucide-react';
import { billingApi, SubscriptionDetails } from '@/lib/api/billing';

interface TrialBannerProps {
  onClose?: () => void;
  className?: string;
}

export default function TrialBanner({ onClose, className = '' }: TrialBannerProps) {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('trialBannerDismissed');
    if (dismissed) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await billingApi.getSubscription();
      setSubscription(data);
    } catch (error) {
      // Silent fail - user might not be authenticated
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('trialBannerDismissed', 'true');
    onClose?.();
  };

  if (loading || dismissed) return null;
  if (!subscription) return null;
  if (subscription.status !== 'TRIAL') return null;
  if (subscription.trialDaysRemaining <= 0) return null;

  const isUrgent = subscription.trialDaysRemaining <= 3;
  const isWarning = subscription.trialDaysRemaining <= 7 && !isUrgent;

  return (
    <div
      className={`relative px-4 py-3 ${
        isUrgent
          ? 'bg-red-600'
          : isWarning
          ? 'bg-yellow-500'
          : 'bg-indigo-600'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          {isUrgent ? (
            <Clock className="h-5 w-5 animate-pulse" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">
            {isUrgent ? (
              <>
                <strong>Uwaga!</strong> Twoj trial konczy sie za{' '}
                {subscription.trialDaysRemaining === 1 ? '1 dzien' : `${subscription.trialDaysRemaining} dni`}!
              </>
            ) : (
              <>
                Korzystasz z wersji probnej. Pozostalo{' '}
                <strong>{subscription.trialDaysRemaining} dni</strong>.
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/billing"
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isUrgent
                ? 'bg-white text-red-600 hover:bg-red-50'
                : isWarning
                ? 'bg-white text-yellow-700 hover:bg-yellow-50'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Wybierz plan
          </Link>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
