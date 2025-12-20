import Link from 'next/link';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function TermsPage() {
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
              <DocumentTextIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Regulamin
            </h1>
            <p className="text-gray-600">
              Ostatnia aktualizacja: 1 stycznia 2024
            </p>
          </div>

          <div className="card prose prose-lg max-w-none">
            <h2>1. Postanowienia ogólne</h2>
            <p>
              Niniejszy Regulamin określa zasady korzystania z platformy STREAMS,
              świadczonej przez STREAMS Sp. z o.o. z siedzibą w Warszawie.
            </p>

            <h2>2. Definicje</h2>
            <ul>
              <li><strong>Platforma</strong> - aplikacja webowa STREAMS dostępna pod adresem streams.pl</li>
              <li><strong>Użytkownik</strong> - osoba fizyczna lub prawna korzystająca z Platformy</li>
              <li><strong>Konto</strong> - indywidualne konto Użytkownika w Platformie</li>
              <li><strong>Usługi</strong> - funkcjonalności dostępne w ramach Platformy</li>
            </ul>

            <h2>3. Warunki korzystania</h2>
            <p>Aby korzystać z Platformy, Użytkownik musi:</p>
            <ul>
              <li>Być osobą pełnoletnią lub posiadać zgodę opiekuna prawnego</li>
              <li>Utworzyć konto podając prawdziwe dane</li>
              <li>Zaakceptować niniejszy Regulamin i Politykę Prywatności</li>
              <li>Posiadać dostęp do internetu i kompatybilną przeglądarkę</li>
            </ul>

            <h2>4. Konto użytkownika</h2>
            <p>
              Użytkownik jest odpowiedzialny za zachowanie poufności danych logowania
              i wszystkie działania wykonywane na swoim koncie. W przypadku podejrzenia
              nieuprawnionego dostępu należy niezwłocznie poinformować nas.
            </p>

            <h2>5. Plany i płatności</h2>
            <p>
              Platforma oferuje różne plany subskrypcyjne. Szczegóły cennika dostępne
              są na stronie głównej. Płatności są przetwarzane przez bezpiecznych
              partnerów płatniczych.
            </p>
            <ul>
              <li>Subskrypcje są automatycznie odnawiane</li>
              <li>Możesz anulować subskrypcję w dowolnym momencie</li>
              <li>Zwroty są możliwe w ciągu 14 dni od zakupu</li>
            </ul>

            <h2>6. Dozwolone użytkowanie</h2>
            <p>Użytkownik zobowiązuje się nie:</p>
            <ul>
              <li>Naruszać praw własności intelektualnej</li>
              <li>Przesyłać treści nielegalnych lub szkodliwych</li>
              <li>Próbować uzyskać nieautoryzowany dostęp do systemów</li>
              <li>Używać Platformy do spamu lub działań szkodliwych</li>
              <li>Odsprzedawać lub udostępniać konta bez zgody</li>
            </ul>

            <h2>7. Własność intelektualna</h2>
            <p>
              Wszystkie prawa do Platformy, w tym kod źródłowy, design, logo i treści,
              należą do STREAMS Sp. z o.o. Użytkownik zachowuje prawa do treści,
              które sam wprowadza do systemu.
            </p>

            <h2>8. Dostępność usług</h2>
            <p>
              Dokładamy wszelkich starań, aby Platforma była dostępna 24/7.
              Nie ponosimy odpowiedzialności za przerwy wynikające z konserwacji,
              awarii lub okoliczności od nas niezależnych.
            </p>

            <h2>9. Ograniczenie odpowiedzialności</h2>
            <p>
              W maksymalnym zakresie dozwolonym przez prawo, nie ponosimy odpowiedzialności
              za szkody pośrednie, utracone korzyści lub dane. Nasza odpowiedzialność
              jest ograniczona do kwoty zapłaconej za usługi w ostatnich 12 miesiącach.
            </p>

            <h2>10. Rozwiązanie umowy</h2>
            <p>
              Możemy zawiesić lub zamknąć konto Użytkownika w przypadku naruszenia
              Regulaminu. Użytkownik może zamknąć konto w dowolnym momencie
              poprzez ustawienia konta lub kontakt z supportem.
            </p>

            <h2>11. Zmiany Regulaminu</h2>
            <p>
              Możemy modyfikować niniejszy Regulamin. O istotnych zmianach
              poinformujemy z 30-dniowym wyprzedzeniem. Dalsze korzystanie
              z Platformy oznacza akceptację zmian.
            </p>

            <h2>12. Prawo właściwe</h2>
            <p>
              Niniejszy Regulamin podlega prawu polskiemu. Wszelkie spory będą
              rozstrzygane przez sądy właściwe dla siedziby STREAMS Sp. z o.o.
            </p>

            <h2>13. Kontakt</h2>
            <p>
              Pytania dotyczące Regulaminu prosimy kierować na adres: legal@streams.pl
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
