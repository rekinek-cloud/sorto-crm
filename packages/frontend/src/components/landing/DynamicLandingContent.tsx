'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DomainBrandingLogo, DomainBrandingFooter, CopyrightWithBranding } from '@/components/branding/DomainBranding';

interface DomainBranding {
  name: string;
  primaryColor: string;
  logo: string | null;
  slug: string | null;
}

const defaultBranding: DomainBranding = {
  name: 'STREAMS',
  primaryColor: '#6366f1',
  logo: null,
  slug: null,
};

// Content configurations for each overlay
const OVERLAY_CONTENT = {
  'sorto-business': {
    heroTitle: 'Zarządzaj firmą',
    heroHighlight: 'inteligentnie',
    heroDescription: 'Kompleksowy system CRM dla firm. Zarządzaj klientami, sprzedażą, fakturami i projektami w jednym miejscu.',
    features: [
      { icon: '🏢', title: 'CRM dla firm', desc: 'Zarządzaj firmami, kontaktami i relacjami biznesowymi', color: 'blue' },
      { icon: '💰', title: 'Pipeline sprzedaży', desc: 'Śledź szanse sprzedażowe od leada do zamknięcia', color: 'green' },
      { icon: '📄', title: 'Faktury i oferty', desc: 'Generuj profesjonalne dokumenty sprzedażowe', color: 'purple' },
      { icon: '📊', title: 'Raporty i analizy', desc: 'Podejmuj decyzje na podstawie danych', color: 'orange' },
      { icon: '📧', title: 'Komunikacja', desc: 'Email, telefon i spotkania w jednym miejscu', color: 'pink' },
      { icon: '👥', title: 'Zarządzanie zespołem', desc: 'Przydzielaj zadania i monitoruj postępy', color: 'cyan' },
    ],
    pricing: [
      { name: 'Starter', price: '99', desc: 'Dla małych firm', features: ['5 użytkowników', 'CRM podstawowy', 'Faktury'] },
      { name: 'Professional', price: '299', desc: 'Dla rozwijających się firm', features: ['25 użytkowników', 'Pełny CRM', 'Pipeline', 'Raporty'], popular: true },
      { name: 'Enterprise', price: 'Indywidualnie', desc: 'Dla dużych organizacji', features: ['Bez limitu użytkowników', 'Dedykowane wsparcie', 'Integracje API'] },
    ],
    ctaTitle: 'Gotowy na wzrost sprzedaży?',
    ctaDescription: 'Dołącz do tysięcy firm, które już korzystają z Sorto Business.',
  },
  'focus-photo': {
    heroTitle: 'Studio fotograficzne',
    heroHighlight: 'pod kontrolą',
    heroDescription: 'System CRM stworzony dla fotografów. Zarządzaj klientami, sesjami, galerią i harmonogramem w jednym miejscu.',
    features: [
      { icon: '📸', title: 'Zarządzanie sesjami', desc: 'Planuj i organizuj sesje zdjęciowe', color: 'sky' },
      { icon: '👤', title: 'Baza klientów', desc: 'Historia sesji, preferencje i kontakty', color: 'blue' },
      { icon: '🖼️', title: 'Timeline projektu', desc: 'Śledź postęp od sesji do dostawy zdjęć', color: 'purple' },
      { icon: '📅', title: 'Kalendarz', desc: 'Zarządzaj terminami i dostępnością', color: 'green' },
      { icon: '☁️', title: 'Focus Cloud', desc: 'Backup i synchronizacja zdjęć RAW', color: 'cyan' },
      { icon: '🎯', title: 'Zadania', desc: 'Retusz, selekcja, wysyłka - wszystko pod kontrolą', color: 'orange' },
    ],
    pricing: [
      { name: 'Solo', price: '49', desc: 'Dla fotografa freelancera', features: ['1 użytkownik', 'Klienci i sesje', 'Kalendarz'] },
      { name: 'Studio', price: '99', desc: 'Dla małego studia', features: ['5 użytkowników', 'Timeline', 'Focus Cloud 100GB', 'Galerie online'], popular: true },
      { name: 'Agency', price: '199', desc: 'Dla agencji foto', features: ['15 użytkowników', 'Focus Cloud 1TB', 'Flyball', 'API'] },
    ],
    ctaTitle: 'Skup się na fotografii',
    ctaDescription: 'Pozwól Focus Photo zająć się organizacją Twojego studia.',
  },
};

const DEFAULT_CONTENT = OVERLAY_CONTENT['sorto-business'];

interface Props {
  locale: string;
  translations: {
    login: string;
    startFree: string;
    trialInfo: string;
    ctaLearnMore: string;
    choosePlan: string;
    mostPopular: string;
    terms: string;
    privacy: string;
    allRightsReserved: string;
  };
}

export default function DynamicLandingContent({ locale, translations: t }: Props) {
  const [branding, setBranding] = useState<DomainBranding>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/v1/overlays/branding');
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setBranding(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranding();
  }, []);

  const content = branding.slug && OVERLAY_CONTENT[branding.slug as keyof typeof OVERLAY_CONTENT]
    ? OVERLAY_CONTENT[branding.slug as keyof typeof OVERLAY_CONTENT]
    : DEFAULT_CONTENT;

  const getColorClass = (color: string, type: 'bg' | 'border' | 'from') => {
    const colors: Record<string, Record<string, string>> = {
      blue: { bg: 'bg-blue-100', border: 'border-blue-100', from: 'from-blue-50' },
      green: { bg: 'bg-green-100', border: 'border-green-100', from: 'from-green-50' },
      purple: { bg: 'bg-purple-100', border: 'border-purple-100', from: 'from-purple-50' },
      orange: { bg: 'bg-orange-100', border: 'border-orange-100', from: 'from-orange-50' },
      pink: { bg: 'bg-pink-100', border: 'border-pink-100', from: 'from-pink-50' },
      cyan: { bg: 'bg-cyan-100', border: 'border-cyan-100', from: 'from-cyan-50' },
      sky: { bg: 'bg-sky-100', border: 'border-sky-100', from: 'from-sky-50' },
    };
    return colors[color]?.[type] || colors.blue[type];
  };

  // Dynamic styles based on primaryColor
  const primaryStyle = { backgroundColor: branding.primaryColor };
  const primaryTextStyle = { color: branding.primaryColor };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <DomainBrandingLogo locale={locale} />
            <div className="flex items-center space-x-4">
              <Link
                href={`/${locale}/auth/login`}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                {t.login}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="text-white font-medium py-2 px-4 rounded-lg transition-colors hover:opacity-90"
                style={primaryStyle}
              >
                {t.startFree}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            {content.heroTitle}
            <span style={primaryTextStyle}> {content.heroHighlight}</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            {content.heroDescription}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={`/${locale}/auth/register`}
              className="text-white font-semibold text-lg px-8 py-4 rounded-lg transition-colors hover:opacity-90"
              style={primaryStyle}
            >
              Rozpocznij za darmo
            </Link>
            <Link
              href="#features"
              className="border-2 font-semibold text-lg px-8 py-4 rounded-lg transition-colors hover:bg-gray-50"
              style={{ borderColor: branding.primaryColor, color: branding.primaryColor }}
            >
              {t.ctaLearnMore}
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            {t.trialInfo}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Wszystko czego potrzebujesz
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Kompleksowe narzędzia w jednym miejscu
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.features.map((feature, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${getColorClass(feature.color, 'from')} to-white p-8 rounded-2xl border ${getColorClass(feature.color, 'border')}`}
              >
                <div className={`w-12 h-12 ${getColorClass(feature.color, 'bg')} rounded-xl flex items-center justify-center mb-6`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Prosty cennik
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Wybierz plan dopasowany do Twoich potrzeb
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {content.pricing.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 relative ${
                  plan.popular
                    ? 'text-white transform scale-105 shadow-xl'
                    : 'bg-white border border-gray-200 hover:shadow-lg transition-shadow'
                }`}
                style={plan.popular ? primaryStyle : undefined}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t.mostPopular}
                    </span>
                  </div>
                )}
                <h3 className={`text-xl font-semibold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-2 text-sm ${plan.popular ? 'text-white/80' : 'text-gray-600'}`}>
                  {plan.desc}
                </p>
                <div className="mt-6">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price === 'Indywidualnie' ? plan.price : `${plan.price} PLN`}
                  </span>
                  {plan.price !== 'Indywidualnie' && (
                    <span className={plan.popular ? 'text-white/70' : 'text-gray-600'}>/mies.</span>
                  )}
                </div>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className={`flex items-center ${plan.popular ? 'text-white' : 'text-gray-600'}`}>
                      <span className={`mr-3 ${plan.popular ? 'text-white' : 'text-green-500'}`}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/auth/register`}
                  className={`mt-8 block w-full font-medium py-3 px-4 rounded-lg text-center transition-colors ${
                    plan.popular
                      ? 'bg-white hover:bg-gray-100'
                      : 'border-2 hover:bg-gray-50'
                  }`}
                  style={plan.popular ? { color: branding.primaryColor } : { borderColor: branding.primaryColor, color: branding.primaryColor }}
                >
                  {t.choosePlan}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={primaryStyle}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            {content.ctaTitle}
          </h2>
          <p className="mt-4 text-xl text-white/80">
            {content.ctaDescription}
          </p>
          <Link
            href={`/${locale}/auth/register`}
            className="mt-8 inline-block bg-white font-semibold py-4 px-8 rounded-lg text-lg hover:bg-gray-100 transition-colors"
            style={{ color: branding.primaryColor }}
          >
            Zacznij teraz
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <DomainBrandingFooter locale={locale} className="mb-4 md:mb-0" />
            <div className="flex space-x-6">
              <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
                {t.terms}
              </Link>
              <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">
                {t.privacy}
              </Link>
              <Link href={`/${locale}/auth/login`} className="hover:text-white transition-colors">
                {t.login}
              </Link>
            </div>
          </div>
          <CopyrightWithBranding text={t.allRightsReserved} />
        </div>
      </footer>
    </div>
  );
}
