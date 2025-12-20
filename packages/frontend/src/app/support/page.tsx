import Link from 'next/link';
import { ArrowLeftIcon, QuestionMarkCircleIcon, BookOpenIcon, ChatBubbleLeftRightIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: 'Jak rozpocząć pracę ze STREAMS?',
    answer: 'Po rejestracji zostaniesz przeprowadzony przez krótki onboarding. Zacznij od dodania elementów do Źródła, a następnie przetwórz je do odpowiednich strumieni.',
  },
  {
    question: 'Czym są strumienie w metodologii STREAMS?',
    answer: 'Strumienie to przepływy pracy podzielone na kategorie: Źródło (inbox), strumienie płynące (aktywne projekty i zadania) oraz strumienie zamrożone (wstrzymane na później).',
  },
  {
    question: 'Jak działa metodologia RZUT dla celów?',
    answer: 'RZUT to akronim: Rezultat (co chcesz osiągnąć), Zmierzalność (jak zmierzysz sukces), Ujście (deadline), Tło (kontekst i motywacja). Pomaga precyzyjnie definiować cele.',
  },
  {
    question: 'Czy mogę zintegrować STREAMS z innymi narzędziami?',
    answer: 'Tak! STREAMS oferuje integracje z popularnymi narzędziami jak Google Calendar, Slack, oraz API do własnych integracji w planach Professional i Enterprise.',
  },
  {
    question: 'Jak działa AI w STREAMS?',
    answer: 'AI analizuje Twoje zadania i sugeruje optymalne strumienie, priorytety i harmonogram. Działa w modelu Human-in-the-Loop - Ty zawsze podejmujesz ostateczną decyzję.',
  },
  {
    question: 'Czy moje dane są bezpieczne?',
    answer: 'Tak. Stosujemy szyfrowanie end-to-end, regularne backupy i przestrzegamy RODO. Twoje dane są przechowywane na serwerach w UE.',
  },
];

const supportChannels = [
  {
    title: 'Baza wiedzy',
    description: 'Przeszukaj nasze artykuły i poradniki',
    icon: BookOpenIcon,
    href: '/dashboard/knowledge-base',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Czat na żywo',
    description: 'Porozmawiaj z naszym zespołem (Pon-Pt 9-17)',
    icon: ChatBubbleLeftRightIcon,
    href: '#chat',
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Email',
    description: 'Napisz do nas: support@streams.pl',
    icon: EnvelopeIcon,
    href: 'mailto:support@streams.pl',
    color: 'bg-purple-100 text-purple-600',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary-600">🌊</div>
              <span className="text-xl font-bold text-gray-900">STREAMS</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Powrót
              </Link>
              <Link href="/auth/login" className="btn btn-primary btn-md">
                Zaloguj się
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
              <QuestionMarkCircleIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Centrum Wsparcia
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Jak możemy Ci pomóc? Znajdź odpowiedzi na pytania lub skontaktuj się z nami.
            </p>
          </div>

          {/* Support Channels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {supportChannels.map((channel, index) => (
              <Link
                key={index}
                href={channel.href}
                className="card hover:shadow-lg transition-shadow group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${channel.color}`}>
                  <channel.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {channel.title}
                </h3>
                <p className="text-gray-600">{channel.description}</p>
              </Link>
            ))}
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Często zadawane pytania
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((faq, index) => (
                <div key={index} className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-primary-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Nie znalazłeś odpowiedzi?
            </h2>
            <p className="text-gray-600 mb-6">
              Nasz zespół jest gotowy, aby Ci pomóc. Skontaktuj się z nami!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn btn-primary btn-lg">
                Skontaktuj się
              </Link>
              <Link href="/auth/register" className="btn btn-outline btn-lg">
                Rozpocznij za darmo
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">&copy; 2024 STREAMS. Wszelkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
}
