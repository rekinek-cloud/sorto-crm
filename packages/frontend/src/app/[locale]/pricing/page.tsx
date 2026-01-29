'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const plans = [
  {
    name: 'Starter',
    description: 'Dla malych zespolow i freelancerow',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: {
      users: '3 uzytkownikow',
      streams: '5 strumieni',
      projects: '10 projektow',
      contacts: '500 kontaktow',
      deals: '100 transakcji',
      storage: '1 GB',
      aiAssistant: false,
      advancedReporting: false,
      customFields: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
    },
    cta: 'Rozpocznij trial',
    ctaLink: '/register',
    highlighted: false,
  },
  {
    name: 'Professional',
    description: 'Dla rozwijajacych sie firm',
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: {
      users: '10 uzytkownikow',
      streams: '25 strumieni',
      projects: '50 projektow',
      contacts: '5000 kontaktow',
      deals: '500 transakcji',
      storage: '10 GB',
      aiAssistant: true,
      advancedReporting: true,
      customFields: true,
      apiAccess: true,
      whiteLabel: false,
      prioritySupport: false,
    },
    cta: 'Rozpocznij trial',
    ctaLink: '/register',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    description: 'Rozwiazania dla duzych organizacji',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: {
      users: 'Bez limitu',
      streams: 'Bez limitu',
      projects: 'Bez limitu',
      contacts: 'Bez limitu',
      deals: 'Bez limitu',
      storage: '100 GB',
      aiAssistant: true,
      advancedReporting: true,
      customFields: true,
      apiAccess: true,
      whiteLabel: true,
      prioritySupport: true,
    },
    cta: 'Skontaktuj sie',
    ctaLink: '/contact',
    highlighted: false,
  },
];

const featureLabels: Record<string, string> = {
  aiAssistant: 'Asystent AI',
  advancedReporting: 'Zaawansowane raporty',
  customFields: 'Pola niestandardowe',
  apiAccess: 'Dostep do API',
  whiteLabel: 'White Label',
  prioritySupport: 'Priorytetowe wsparcie',
};

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">STREAMS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Zaloguj sie
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Rozpocznij trial
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Proste i przejrzyste ceny
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Wybierz plan dopasowany do potrzeb Twojego zespolu. 14 dni bezplatnego trialu dla kazdego planu.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Miesiecznie
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Rocznie
              <span className="ml-2 text-green-600 text-xs font-semibold">-17%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12);

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl ${
                  plan.highlighted
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-600 ring-offset-2'
                    : 'bg-white border-2 border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 bg-indigo-500 text-white text-sm font-medium rounded-full">
                      Najpopularniejszy
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`mt-1 text-sm ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline">
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                      {price} PLN
                    </span>
                    <span className={`ml-2 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>
                      /mies.
                    </span>
                  </div>

                  {billingPeriod === 'yearly' && (
                    <p className={`mt-1 text-sm ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>
                      Rozliczenie roczne: {plan.yearlyPrice} PLN
                    </p>
                  )}

                  <Link
                    href={plan.ctaLink}
                    className={`mt-8 block w-full py-3 px-4 rounded-lg text-center font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRightIcon className="inline-block ml-2 h-4 w-4" />
                  </Link>

                  <div className="mt-8 space-y-4">
                    <div className={`text-sm font-medium ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                      Zawiera:
                    </div>

                    <ul className="space-y-3">
                      <li className={`flex items-center gap-3 text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>
                        <CheckIcon className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? 'text-indigo-300' : 'text-green-500'}`} />
                        {plan.features.users}
                      </li>
                      <li className={`flex items-center gap-3 text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>
                        <CheckIcon className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? 'text-indigo-300' : 'text-green-500'}`} />
                        {plan.features.streams}
                      </li>
                      <li className={`flex items-center gap-3 text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>
                        <CheckIcon className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? 'text-indigo-300' : 'text-green-500'}`} />
                        {plan.features.contacts}
                      </li>
                      <li className={`flex items-center gap-3 text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>
                        <CheckIcon className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? 'text-indigo-300' : 'text-green-500'}`} />
                        {plan.features.storage} przestrzeni
                      </li>

                      {Object.entries(featureLabels).map(([key, label]) => {
                        const enabled = plan.features[key as keyof typeof plan.features];
                        return (
                          <li
                            key={key}
                            className={`flex items-center gap-3 text-sm ${
                              plan.highlighted
                                ? enabled ? 'text-indigo-100' : 'text-indigo-300/50'
                                : enabled ? 'text-gray-600' : 'text-gray-400'
                            }`}
                          >
                            {enabled ? (
                              <CheckIcon className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? 'text-indigo-300' : 'text-green-500'}`} />
                            ) : (
                              <XMarkIcon className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? 'text-indigo-400' : 'text-gray-300'}`} />
                            )}
                            {label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Czesto zadawane pytania
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Czy moge zmienic plan w dowolnym momencie?
              </h3>
              <p className="text-gray-600">
                Tak, mozesz zaktualizowac lub obnizac swoj plan w dowolnym momencie. Zmiany zostana zastosowane natychmiast.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Co sie stanie po zakonczeniu trialu?
              </h3>
              <p className="text-gray-600">
                Po 14 dniach trialu bedziesz mial mozliwosc wyboru planu. Twoje dane pozostana bezpieczne.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Jakie metody platnosci akceptujecie?
              </h3>
              <p className="text-gray-600">
                Akceptujemy karty kredytowe/debetowe (Visa, Mastercard, American Express) przez bezpieczny system Stripe.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Czy moge anulowac subskrypcje?
              </h3>
              <p className="text-gray-600">
                Tak, mozesz anulowac subskrypcje w dowolnym momencie. Bedziesz miec dostep do konca oplaconego okresu.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center bg-indigo-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Gotowy na transformacje sprzedazy?
          </h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-2xl mx-auto">
            Dolacz do tysiecy firm, ktore juz korzystaja ze STREAMS. 14 dni bezplatnego trialu, bez zobowiazan.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Rozpocznij bezplatny trial
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 STREAMS CRM. Wszelkie prawa zastrzezone.</p>
        </div>
      </footer>
    </div>
  );
}
