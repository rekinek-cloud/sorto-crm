import Link from 'next/link';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ContactPage() {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Skontaktuj się z nami
            </h1>
            <p className="text-xl text-gray-600">
              Masz pytania? Chętnie pomożemy!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <EnvelopeIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600">kontakt@streams.pl</p>
                    <p className="text-gray-600">support@streams.pl</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <PhoneIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Telefon</h3>
                    <p className="text-gray-600">+48 123 456 789</p>
                    <p className="text-sm text-gray-500">Pon-Pt: 9:00 - 17:00</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <MapPinIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Adres</h3>
                    <p className="text-gray-600">ul. Produktywności 42</p>
                    <p className="text-gray-600">00-001 Warszawa, Polska</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Wyślij wiadomość</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Imię i nazwisko
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input w-full"
                    placeholder="Jan Kowalski"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input w-full"
                    placeholder="jan@firma.pl"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Temat
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="input w-full"
                    placeholder="W czym możemy pomóc?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Wiadomość
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="input w-full"
                    placeholder="Opisz swoje pytanie lub problem..."
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  Wyślij wiadomość
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">&copy; 2024 STREAMS. Wszelkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
}
