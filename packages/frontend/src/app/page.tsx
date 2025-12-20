import Link from 'next/link';
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';

const features = [
  {
    title: 'Metodologia STREAMS',
    description: 'Zarządzaj przepływem pracy przez strumienie - płynące lub zamrożone',
    icon: '🌊',
  },
  {
    title: 'Źródło',
    description: 'Centralne miejsce przechwytywania wszystkich wejść z AI sugestiami',
    icon: '⭕',
  },
  {
    title: 'Cele Precyzyjne (RZUT)',
    description: 'Rezultat, Zmierzalność, Ujście, Tło - precyzyjne definiowanie celów',
    icon: '🎯',
  },
  {
    title: 'Day Planner z AI',
    description: 'Inteligentne planowanie dnia z uwzględnieniem energii i kontekstu',
    icon: '📅',
  },
  {
    title: 'CRM B2B',
    description: 'Pełne zarządzanie relacjami z klientami i pipeline sprzedażowy',
    icon: '🏢',
  },
  {
    title: 'Human-in-the-Loop AI',
    description: 'AI sugeruje, Ty decydujesz - zatwierdź, skoryguj lub odrzuć',
    icon: '🤖',
  },
];

const plans = [
  {
    name: 'Starter',
    price: '39 zł',
    period: '/miesiąc',
    description: 'Dla osób indywidualnych',
    features: [
      '1 użytkownik',
      '5 strumieni',
      '100 zadań',
      '10 projektów',
      'Podstawowe cele RZUT',
      'Email support',
    ],
    cta: 'Rozpocznij za darmo',
    popular: false,
  },
  {
    name: 'Professional',
    price: '99 zł',
    period: '/miesiąc',
    description: 'Dla rozwijających się zespołów',
    features: [
      '10 użytkowników',
      '25 strumieni',
      '1,000 zadań',
      '100 projektów',
      'Zaawansowane cele RZUT',
      'AI Day Planner',
      'Priority support',
      'API access',
    ],
    cta: 'Rozpocznij za darmo',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '299 zł',
    period: '/miesiąc',
    description: 'Dla dużych organizacji',
    features: [
      'Bez limitów użytkowników',
      'Bez limitów strumieni',
      'Bez limitów zadań',
      'Bez limitów projektów',
      'Custom RZUT frameworks',
      'White-label',
      'Dedykowany support',
      'Custom integracje',
    ],
    cta: 'Kontakt',
    popular: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary-600">🌊</div>
              <span className="text-xl font-bold text-gray-900">STREAMS</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Funkcje
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Cennik
              </Link>
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Logowanie
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-md">
                Rozpocznij
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Produktywność
              <span className="text-primary-600"> w przepływie</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              STREAMS łączy zarządzanie strumieniami pracy, cele precyzyjne RZUT i AI
              w jednej platformie. Zbudowane dla zespołów, które wymagają doskonałości.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="btn btn-primary btn-lg">
                14 dni za darmo
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link href="#demo" className="btn btn-outline btn-lg">
                Zobacz demo
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Bez karty kredytowej • 14 dni za darmo • Anuluj kiedy chcesz
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Wszystko czego potrzebujesz do maksymalnej produktywności
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nasza platforma łączy sprawdzone metodologie z najnowszą technologią AI,
              aby pomóc Tobie i Twojemu zespołowi osiągać więcej.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Prosty, przejrzysty cennik
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Wybierz plan dopasowany do wielkości zespołu i potrzeb.
              Wszystkie plany zawierają podstawowe funkcje i 14 dni za darmo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`card relative ${
                  plan.popular
                    ? 'ring-2 ring-primary-500 shadow-lg scale-105'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Najpopularniejszy
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-1">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-success-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === 'Enterprise' ? '/contact' : '/auth/register'}
                  className={`btn w-full ${
                    plan.popular ? 'btn-primary' : 'btn-outline'
                  } btn-lg`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="text-2xl font-bold text-primary-400">🌊</div>
              <span className="text-xl font-bold">STREAMS</span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                Prywatność
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                Regulamin
              </Link>
              <Link href="/support" className="text-gray-300 hover:text-white transition-colors">
                Wsparcie
              </Link>
            </nav>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 STREAMS. Wszelkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
