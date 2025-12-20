// Mapa zawartości pomocy dla różnych stron
// W przyszłości można to zastąpić dynamicznym ładowaniem z plików .md

const helpContents: Record<string, string> = {
  'dashboard': `
# Dashboard - Strona główna

## Przegląd
Dashboard to centralne miejsce, z którego możesz szybko przejść do wszystkich funkcji systemu CRM-GTD Smart.

## Główne sekcje:
- **Statystyki** - Szybki przegląd najważniejszych wskaźników
- **Zadania na dziś** - Lista zadań zaplanowanych na dzisiejszy dzień
- **Ostatnie aktywności** - Historia ostatnich działań w systemie
- **Szybkie akcje** - Przyciski do najczęściej używanych funkcji

## Wskazówki:
- Użyj skrótów klawiszowych dla szybszej nawigacji
- Dashboard można personalizować w ustawieniach
- Widgety można przeciągać i zmieniać ich rozmiar
`,

  'smart-mailboxes': `
# Smart Mailboxes - Centrum Komunikacji

## Co to jest?
Smart Mailboxes to centralne miejsce zarządzania całą komunikacją - emailami, wiadomościami i zadaniami.

## Główne funkcje:
- **📧 Skrzynki** - Organizacja wiadomości w zakładkach (Today, Last 7 days, Important, etc.)
- **🔍 Filtry** - 9 typów filtrów do szybkiego wyszukiwania
- **🎯 GTD** - Przekształcanie wiadomości w zadania według metodologii Getting Things Done

## Jak używać:
1. **Wybierz zakładkę** - Kliknij na odpowiednią skrzynkę (np. "Today" dla dzisiejszych wiadomości)
2. **Kliknij wiadomość** - Rozwiń podgląd klikając na dowolną wiadomość
3. **Quick Actions** - Użyj przycisków szybkich akcji:
   - **📥 Inbox** - Dodaj do GTD Inbox do późniejszego przetworzenia
   - **✅ DO** - Utwórz natychmiastowe zadanie (< 2 min)
   - **⏳ DEFER** - Zaplanuj na jutro
   - **🎯 GTD+** - Otwórz pełny modal przetwarzania GTD

## Filtry zaawansowane:
- **Search** - Wyszukiwanie w temacie i treści
- **Channels** - Filtruj po kanałach komunikacji
- **Date Range** - Wybierz zakres dat
- **Priority** - Filtruj po priorytecie
- **Status** - Pokaż przeczytane/nieprzeczytane
- **Sender** - Filtruj po nadawcy
- **Attachments** - Tylko z załącznikami
- **Read Status** - Status przeczytania
- **Urgency** - Poziom pilności

## Skróty klawiszowe:
- \`J/K\` - Nawigacja góra/dół
- \`Enter\` - Otwórz wiadomość
- \`R\` - Odpowiedz
- \`F\` - Przekaż dalej
- \`A\` - Archiwizuj
- \`Delete\` - Usuń

## 💡 Wskazówki:
- Możesz przeciągać zakładki aby zmienić ich kolejność!
- Multi-select w filtrze kanałów pozwala wybrać kilka kanałów jednocześnie
- Użyj przycisku 🔊 aby odsłuchać wiadomość (Text-to-Speech)
`,

  'gtd-inbox': `
# GTD Inbox - Skrzynka odbiorczka

## Zasady GTD Inbox według David Allena:
1. **Jeden główny punkt zbierania** - wszystko trafia tutaj
2. **Nie analizujesz - tylko zbierasz** - inbox to kosz na wszystko
3. **Nic nie zostaje na stałe** - wszystko musi być regularnie przetwarzane
4. **Opróżniasz systematycznie** - processing jest kluczowy

## 11 Typów źródeł:
- 📝 **Quick Capture** - Szybkie notatki i myśli
- 📋 **Meeting Notes** - Notatki z rozmów i spotkań
- 📞 **Phone Call** - Notatki z rozmów telefonicznych
- 📧 **Email** - E-maile wymagające akcji
- 💡 **Idea** - Pomysły i inspiracje
- 📄 **Document** - Dokumenty do przejrzenia
- 💰 **Bill/Invoice** - Rachunki do opłacenia
- 📚 **Article** - Artykuły do przeczytania
- 🎤 **Voice Memo** - Notatki głosowe
- 📷 **Photo** - Zdjęcia wymagające akcji
- 📦 **Other** - Inne elementy

## Quick Actions:
- **DO** - Zrób natychmiast (< 2 min)
- **DEFER** - Zaplanuj na później z datą
- **DELETE** - Usuń bez śladu

## Workflow GTD:
\`\`\`
Capture → Inbox → Process (DO/DEFER/DELETE) → Organize → Done
\`\`\`

## 💡 Najlepsze praktyki:
- Przetwarzaj inbox minimum raz dziennie
- Nie zostawiaj elementów "na później" - podejmij decyzję
- Jeśli coś zajmie mniej niż 2 minuty - zrób to od razu (DO)
- Regularnie sprawdzaj statystyki przetwarzania
`,

  'projects': `
# Projekty - Zarządzanie projektami

## Przegląd
Sekcja Projekty pozwala na zarządzanie złożonymi przedsięwzięciami składającymi się z wielu zadań.

## Główne funkcje:
- **Lista projektów** - Przegląd wszystkich aktywnych projektów
- **Statusy projektów** - PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
- **Kamienie milowe** - Śledzenie postępów projektu
- **Zespół projektowy** - Przypisywanie członków zespołu
- **Analiza AI** - Automatyczna analiza i sugestie

## Jak utworzyć projekt:
1. Kliknij przycisk "Nowy Projekt"
2. Wypełnij formularz:
   - Nazwa projektu
   - Opis i cele
   - Daty rozpoczęcia i zakończenia
   - Przypisz zespół
3. Dodaj kamienie milowe
4. Utwórz zadania w projekcie

## Metodyka GTD w projektach:
- Projekty to "wielokrokowe rezultaty" według David Allena
- Każdy projekt powinien mieć jasno zdefiniowany rezultat
- Regularnie przeglądaj postępy podczas Weekly Review

## 💡 Wskazówki:
- Użyj szablonów projektów dla powtarzalnych procesów
- Korzystaj z analizy AI dla optymalizacji harmonogramu
- Monitoruj wykresy burndown dla śledzenia postępów
`,

  'tasks': `
# Zadania - Lista zadań

## Przegląd
Centralne miejsce do zarządzania wszystkimi zadaniami w systemie.

## Typy zadań:
- **Next Actions** - Następne konkretne kroki do wykonania
- **Waiting For** - Zadania oczekujące na kogoś/coś
- **Someday/Maybe** - Zadania do rozważenia w przyszłości
- **Delegated** - Zadania przekazane innym

## Konteksty GTD:
- **@computer** - Przy komputerze
- **@calls** - Telefony do wykonania
- **@office** - W biurze
- **@home** - W domu
- **@errands** - Sprawy poza biurem
- **@online** - Online/Internet
- **@waiting** - Oczekiwanie
- **@reading** - Do przeczytania

## Priorytety:
- 🔴 **Wysoki** - Pilne i ważne
- 🟡 **Średni** - Ważne ale nie pilne
- 🔵 **Niski** - Może poczekać

## Filtry i sortowanie:
- Filtruj po statusie, priorytecie, kontekście
- Sortuj po dacie, priorytecie, nazwie
- Zapisuj własne widoki filtrów

## 💡 Wskazówki:
- Regularnie przeglądaj listę podczas Daily Review
- Używaj kontekstów do grupowania podobnych zadań
- Szacuj czas realizacji dla lepszego planowania
`,

  'rules-manager': `
# Rules Manager - Zarządzanie regułami

## Przegląd
Rules Manager to centrum automatyzacji procesów w systemie CRM-GTD Smart.

## 9 Typów reguł:
1. **PROCESSING** - Przetwarzanie wiadomości na zadania
2. **EMAIL_FILTER** - Filtrowanie i kategoryzacja emaili
3. **AUTO_REPLY** - Automatyczne odpowiedzi
4. **AI_RULE** - Reguły z wykorzystaniem AI
5. **SMART_MAILBOX** - Reguły dla Smart Mailboxes
6. **WORKFLOW** - Automatyzacja przepływów pracy
7. **NOTIFICATION** - Powiadomienia i alerty
8. **INTEGRATION** - Integracje z zewnętrznymi systemami
9. **CUSTOM** - Własne reguły niestandardowe

## 6 Typów wyzwalaczy:
- **EVENT_BASED** - Na podstawie zdarzeń
- **MANUAL** - Uruchamiane ręcznie
- **SCHEDULED** - Według harmonogramu
- **WEBHOOK** - Przez webhook
- **API_CALL** - Przez wywołanie API
- **AUTOMATIC** - Automatyczne

## Jak utworzyć regułę:
1. Wybierz typ reguły z zakładek
2. Kliknij "Nowa Reguła"
3. Skonfiguruj:
   - Nazwę i opis
   - Typ wyzwalacza
   - Warunki (if/then)
   - Akcje do wykonania
4. Zapisz i przetestuj

## Przykład reguły:
**Nazwa**: Auto-zadania z pilnych emaili
**Typ**: PROCESSING
**Wyzwalacz**: EVENT_BASED
**Warunek**: Temat zawiera "PILNE"
**Akcja**: Utwórz zadanie z priorytetem HIGH

## 💡 Wskazówki:
- Testuj reguły przed aktywacją
- Monitoruj statystyki wykonań
- Używaj priorytetów dla kolejności wykonywania
- Łącz reguły w złożone workflow
`,

  'ai-config': `
# AI Config - Konfiguracja AI

## Przegląd
Konfiguracja dostawców AI i modeli wykorzystywanych w systemie.

## Obsługiwani dostawcy:
- **OpenAI** - GPT-4, GPT-3.5-turbo
- **Anthropic** - Claude 3
- **Local LLM** - Lokalne modele

## Jak skonfigurować:
1. **Dodaj Provider**:
   - Kliknij "Dodaj Provider"
   - Wybierz typ (OpenAI/Anthropic/Local)
   - Wprowadź API Key
   - Zapisz

2. **Dodaj Model**:
   - Kliknij "Dodaj Model"
   - Wybierz provider
   - Wybierz model z listy
   - Skonfiguruj parametry

## Parametry modeli:
- **Temperature** - Kreatywność odpowiedzi (0-1)
- **Max Tokens** - Maksymalna długość odpowiedzi
- **Top P** - Alternatywna kontrola kreatywności
- **Frequency Penalty** - Kara za powtórzenia
- **Presence Penalty** - Kara za nowe tematy

## Zastosowania AI w systemie:
- Analiza sentymentu wiadomości
- Automatyczna kategoryzacja
- Sugestie priorytetów
- Generowanie podsumowań
- Analiza projektów

## 💡 Wskazówki:
- Zacznij od mniejszych modeli dla prostych zadań
- GPT-4 dla złożonych analiz
- Monitoruj koszty API
- Testuj różne parametry dla optymalnych wyników
`
};

export async function getHelpContent(pageId: string): Promise<string> {
  // Symulacja asynchronicznego ładowania
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const content = helpContents[pageId];
  
  if (!content) {
    return `# Pomoc - ${pageId}

Treść pomocy dla tej strony jest w przygotowaniu.

## Szybkie wskazówki:
- Użyj menu nawigacji aby przejść do innych sekcji
- Skróty klawiszowe przyspieszają pracę
- Możesz dostosować ustawienia w profilu użytkownika

Jeśli potrzebujesz dodatkowej pomocy, skontaktuj się z administratorem systemu.`;
  }
  
  return content;
}

// Funkcja do wyszukiwania w treści pomocy
export function searchHelpContent(query: string): Array<{pageId: string, title: string, excerpt: string}> {
  const results: Array<{pageId: string, title: string, excerpt: string}> = [];
  const lowerQuery = query.toLowerCase();
  
  Object.entries(helpContents).forEach(([pageId, content]) => {
    if (content.toLowerCase().includes(lowerQuery)) {
      // Wyciągnij tytuł (pierwsza linia z #)
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : pageId;
      
      // Znajdź fragment z zapytaniem
      const index = content.toLowerCase().indexOf(lowerQuery);
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + query.length + 50);
      const excerpt = '...' + content.substring(start, end).replace(/\n/g, ' ') + '...';
      
      results.push({ pageId, title, excerpt });
    }
  });
  
  return results;
}