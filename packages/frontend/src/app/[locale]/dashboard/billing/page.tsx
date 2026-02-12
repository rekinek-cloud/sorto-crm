'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  ArrowUp,
  Sparkles,
  Users,
  Folder,
  Building2,
  BarChart3,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { billingApi, SubscriptionDetails, Plan, UsageDetails } from '@/lib/api/billing';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonPage';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subData, plansData, usageData] = await Promise.all([
        billingApi.getSubscription(),
        billingApi.getPlans(),
        billingApi.getUsage(),
      ]);
      setSubscription(subData);
      setPlans(plansData.plans);
      setUsage(usageData);
    } catch (error) {
      toast.error('Nie udalo sie zaladowac danych subskrypcji');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    setUpgrading(true);
    try {
      const { url } = await billingApi.createCheckout(planName, billingPeriod);
      window.location.href = url;
    } catch (error) {
      toast.error('Nie udalo sie utworzyc sesji platnosci');
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await billingApi.createPortalSession();
      window.location.href = url;
    } catch (error) {
      toast.error('Nie udalo sie otworzyc portalu rozliczen');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Aktywna</span>;
      case 'TRIAL':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Trial</span>;
      case 'PAST_DUE':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Zalegla platnosc</span>;
      case 'CANCELED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Anulowana</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">{status}</span>;
    }
  };

  const formatLimit = (limit: number) => (limit === -1 ? 'Bez limitu' : limit.toString());

  if (loading) {
    return (
      <PageShell>
        <SkeletonPage withStats={true} rows={3} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Subskrypcja i rozliczenia"
        subtitle="Zarzadzaj swoim planem i wykorzystaniem zasobow"
        icon={CreditCard}
        iconColor="text-indigo-600"
      />

      {/* Trial Banner */}
      {subscription?.status === 'TRIAL' && subscription.trialDaysRemaining > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-200">Okres probny</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Pozostalo {subscription.trialDaysRemaining} dni. Wybierz plan, aby kontynuowac korzystanie.
              </p>
            </div>
          </div>
          <button
            onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Wybierz plan
          </button>
        </div>
      )}

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Aktualny plan</h2>
            {getStatusBadge(subscription.status)}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{subscription.plan}</div>
            {subscription.status === 'ACTIVE' && subscription.currentPeriodEnd && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Odnawia sie: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
              </div>
            )}
          </div>

          {subscription.status === 'ACTIVE' && (
            <button
              onClick={handleManageBilling}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Zarzadzaj subskrypcja
            </button>
          )}
        </div>
      )}

      {/* Usage */}
      {usage && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Wykorzystanie zasobow</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(usage.usage).map(([key, data]) => {
              const icons: Record<string, React.ReactNode> = {
                users: <Users className="h-5 w-5" />,
                streams: <Folder className="h-5 w-5" />,
                projects: <Building2 className="h-5 w-5" />,
                contacts: <Users className="h-5 w-5" />,
                deals: <BarChart3 className="h-5 w-5" />,
              };
              const labels: Record<string, string> = {
                users: 'Uzytkownicy',
                streams: 'Strumienie',
                projects: 'Projekty',
                contacts: 'Kontakty',
                deals: 'Transakcje',
              };

              return (
                <div key={key} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400">
                    {icons[key]}
                    <span className="font-medium">{labels[key]}</span>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{data.current}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">/ {formatLimit(data.limit)}</span>
                  </div>
                  {data.limit !== -1 && (
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          data.percentage > 90 ? 'bg-red-500' : data.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(data.percentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Features */}
      {usage && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Funkcje w Twoim planie</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(usage.features).map(([feature, enabled]) => {
              const labels: Record<string, string> = {
                aiAssistant: 'Asystent AI',
                advancedReporting: 'Zaawansowane raporty',
                customFields: 'Pola niestandardowe',
                apiAccess: 'Dostep do API',
                whiteLabel: 'White Label',
                prioritySupport: 'Priorytetowe wsparcie',
                customIntegrations: 'Integracje',
                sso: 'SSO',
              };

              return (
                <div
                  key={feature}
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    enabled ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-slate-50 text-slate-400 dark:bg-slate-700/50 dark:text-slate-500'
                  }`}
                >
                  {enabled ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  <span className="text-sm font-medium">{labels[feature] || feature}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plans */}
      <div id="plans" className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Dostepne plany</h2>

          {/* Billing Period Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Miesiecznie
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'yearly' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Rocznie <span className="text-green-600 dark:text-green-400 text-xs">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.name;
            const price = billingPeriod === 'monthly' ? plan.pricing.monthly : Math.round(plan.pricing.yearly / 12);

            return (
              <div
                key={plan.name}
                className={`relative p-6 rounded-xl border-2 ${
                  isCurrentPlan ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600'
                }`}
              >
                {plan.name === 'PROFESSIONAL' && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded-full">
                      Najpopularniejszy
                    </span>
                  </div>
                )}

                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{plan.name}</div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{price} PLN</span>
                  <span className="text-slate-500 dark:text-slate-400">/mies.</span>
                </div>

                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                    Rozliczenie roczne: {plan.pricing.yearly} PLN
                  </p>
                )}

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {formatLimit(plan.limits.maxUsers)} uzytkownikow
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {formatLimit(plan.limits.maxStreams)} strumieni
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {formatLimit(plan.limits.maxContacts)} kontaktow
                  </li>
                  {plan.limits.features.aiAssistant && (
                    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                      Asystent AI
                    </li>
                  )}
                  {plan.limits.features.customFields && (
                    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Pola niestandardowe
                    </li>
                  )}
                  {plan.limits.features.whiteLabel && (
                    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      White Label
                    </li>
                  )}
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed"
                  >
                    Aktualny plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={upgrading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      plan.name === 'PROFESSIONAL'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {upgrading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <>
                        <ArrowUp className="h-4 w-4" />
                        Wybierz plan
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
