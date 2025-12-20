import Link from 'next/link';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function PrivacyPage() {
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Polityka Prywatności
            </h1>
            <p className="text-gray-600">
              Ostatnia aktualizacja: 1 stycznia 2024
            </p>
          </div>

          <div className="card prose prose-lg max-w-none">
            <h2>1. Wprowadzenie</h2>
            <p>
              STREAMS ("my", "nas", "nasza") szanuje Twoją prywatność i zobowiązuje się do ochrony
              Twoich danych osobowych. Niniejsza polityka prywatności wyjaśnia, w jaki sposób
              zbieramy, wykorzystujemy i chronimy Twoje informacje.
            </p>

            <h2>2. Jakie dane zbieramy</h2>
            <p>Możemy zbierać następujące rodzaje informacji:</p>
            <ul>
              <li><strong>Dane konta:</strong> imię, nazwisko, adres email, nazwa organizacji</li>
              <li><strong>Dane użytkowania:</strong> informacje o tym, jak korzystasz z naszej platformy</li>
              <li><strong>Dane techniczne:</strong> adres IP, typ przeglądarki, informacje o urządzeniu</li>
              <li><strong>Dane wprowadzane:</strong> zadania, projekty, notatki i inne treści tworzone w aplikacji</li>
            </ul>

            <h2>3. Jak wykorzystujemy Twoje dane</h2>
            <p>Twoje dane wykorzystujemy do:</p>
            <ul>
              <li>Świadczenia i utrzymania naszych usług</li>
              <li>Personalizacji Twojego doświadczenia</li>
              <li>Komunikacji z Tobą w sprawach dotyczących usług</li>
              <li>Analizy i ulepszania naszej platformy</li>
              <li>Zapewnienia bezpieczeństwa i zapobiegania nadużyciom</li>
            </ul>

            <h2>4. Udostępnianie danych</h2>
            <p>
              Nie sprzedajemy Twoich danych osobowych. Możemy udostępniać dane tylko w następujących przypadkach:
            </p>
            <ul>
              <li>Za Twoją zgodą</li>
              <li>Zaufanym dostawcom usług, którzy pomagają nam w prowadzeniu działalności</li>
              <li>Gdy jest to wymagane przez prawo</li>
            </ul>

            <h2>5. Bezpieczeństwo danych</h2>
            <p>
              Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych,
              w tym szyfrowanie, kontrolę dostępu i regularne audyty bezpieczeństwa.
            </p>

            <h2>6. Twoje prawa</h2>
            <p>Zgodnie z RODO masz prawo do:</p>
            <ul>
              <li>Dostępu do swoich danych</li>
              <li>Sprostowania nieprawidłowych danych</li>
              <li>Usunięcia danych ("prawo do bycia zapomnianym")</li>
              <li>Ograniczenia przetwarzania</li>
              <li>Przenoszenia danych</li>
              <li>Sprzeciwu wobec przetwarzania</li>
            </ul>

            <h2>7. Pliki cookies</h2>
            <p>
              Używamy plików cookies i podobnych technologii do zapewnienia prawidłowego
              działania platformy, analizy ruchu i personalizacji treści.
            </p>

            <h2>8. Kontakt</h2>
            <p>
              W sprawach dotyczących prywatności skontaktuj się z nami:
            </p>
            <ul>
              <li>Email: privacy@streams.pl</li>
              <li>Adres: ul. Produktywności 42, 00-001 Warszawa</li>
            </ul>

            <h2>9. Zmiany w polityce</h2>
            <p>
              Możemy aktualizować niniejszą politykę prywatności. O istotnych zmianach
              poinformujemy Cię drogą mailową lub poprzez powiadomienie w aplikacji.
            </p>
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
