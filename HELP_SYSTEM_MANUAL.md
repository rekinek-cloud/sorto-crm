# System Pomocy Kontekstowej - Manual

## Przegląd
System pomocy kontekstowej został zaimplementowany w aplikacji CRM-GTD Smart, aby zapewnić użytkownikom łatwy dostęp do dokumentacji i instrukcji bezpośrednio z poziomu interfejsu.

## Główne komponenty

### 1. HelpButton (Przycisk pomocy)
- **Lokalizacja**: Prawy dolny róg każdej strony
- **Ikona**: Niebieski przycisk z symbolem "?"
- **Animacja**: Pulsująca kropka przyciąga uwagę
- **Tooltip**: "Pomoc (?)" pojawia się po najechaniu

### 2. HelpModal (Okno pomocy)
- **Typ**: Slideout panel z prawej strony
- **Szerokość**: 500px na desktop, pełna szerokość na mobile
- **Zawartość**: Renderowana z Markdown dla lepszego formatowania

### 3. HelpProvider (Kontekst)
- **Zarządzanie stanem**: Śledzenie otwartego/zamkniętego stanu
- **Historia**: Pamiętanie ostatnich 10 odwiedzonych stron pomocy
- **Kontekst strony**: Automatyczne wykrywanie aktualnej strony

## Jak używać

### Dla użytkowników:
1. **Otwieranie pomocy**: Kliknij niebieski przycisk "?" w prawym dolnym rogu
2. **Nawigacja**: Użyj strzałek w nagłówku do przechodzenia wstecz/dalej
3. **Wyszukiwanie**: Kliknij ikonę lupy aby wyszukać w treści pomocy
4. **Zamykanie**: Kliknij "X" lub kliknij poza oknem pomocy

### Dla developerów:

#### Dodawanie pomocy do nowej strony:
```typescript
// 1. Import komponentu
import { HelpButton } from '@/components/help/HelpButton';

// 2. Dodaj przed zamknięciem głównego kontenera strony
export default function MyPage() {
  return (
    <div>
      {/* Twoja zawartość strony */}
      
      {/* Help Button */}
      <HelpButton pageId="my-page-id" />
    </div>
  );
}
```

#### Dodawanie treści pomocy:
```typescript
// W pliku: /src/lib/help/helpContent.ts
// Dodaj nowy wpis do obiektu helpContents:

const helpContents: Record<string, string> = {
  'my-page-id': `
# Tytuł strony

## Przegląd
Opis funkcjonalności strony...

## Główne funkcje:
- **Funkcja 1** - Opis
- **Funkcja 2** - Opis

## Jak używać:
1. Krok pierwszy
2. Krok drugi
3. Krok trzeci

## 💡 Wskazówki:
- Przydatna wskazówka 1
- Przydatna wskazówka 2
`,
  // ... inne strony
};
```

## Zaimplementowane strony

Obecnie system pomocy jest dostępny na następujących stronach:
- **Dashboard** (`/crm/dashboard/`) - pageId: "dashboard"
- **Smart Mailboxes** (`/crm/dashboard/smart-mailboxes/`) - pageId: "smart-mailboxes"
- **GTD Inbox** (`/crm/dashboard/gtd/inbox/`) - pageId: "gtd-inbox"
- **Projects** - pageId: "projects"
- **Tasks** - pageId: "tasks"
- **Rules Manager** - pageId: "rules-manager"
- **AI Config** - pageId: "ai-config"

## Funkcje Markdown

System pomocy obsługuje pełne formatowanie Markdown:
- **Nagłówki** (# ## ###)
- **Pogrubienie** i *kursywa*
- **Listy** wypunktowane i numerowane
- **Kod** inline `code` i bloki kodu
- **Cytaty** (>)
- **Linki** [tekst](url)
- **Linie poziome** (---)

## Planowane rozszerzenia

1. **Wyszukiwanie globalne** - wyszukiwanie we wszystkich stronach pomocy
2. **Wersje językowe** - wsparcie dla wielu języków (PL/EN)
3. **Filmy instruktażowe** - osadzanie filmów YouTube/Vimeo
4. **Interaktywne tutoriale** - krok po kroku z podświetlaniem elementów
5. **FAQ sekcja** - najczęściej zadawane pytania
6. **Feedback system** - ocena przydatności artykułów

## Struktura plików

```
/src/
├── components/help/
│   ├── HelpButton.tsx      # Przycisk pomocy
│   └── HelpModal.tsx       # Okno pomocy
├── contexts/help/
│   └── HelpContext.tsx     # Kontekst zarządzania stanem
└── lib/help/
    └── helpContent.ts      # Treści pomocy dla wszystkich stron
```

## Best practices

1. **Krótkie i zwięzłe** - użytkownicy szukają szybkich odpowiedzi
2. **Przykłady** - pokazuj konkretne przykłady użycia
3. **Wizualne wskazówki** - używaj emoji dla lepszej czytelności
4. **Struktura** - zachowaj spójną strukturę między stronami
5. **Aktualizacja** - aktualizuj pomoc wraz ze zmianami w aplikacji

## Troubleshooting

### Problem: Przycisk pomocy nie pojawia się
- Sprawdź czy `HelpButton` jest zaimportowany
- Sprawdź czy `pageId` jest poprawnie ustawione
- Sprawdź konsolę przeglądarki czy nie ma błędów

### Problem: Treść pomocy nie ładuje się
- Sprawdź czy `pageId` istnieje w `helpContents`
- Sprawdź czy nie ma błędów składni w Markdown
- Sprawdź Network tab czy nie ma błędów sieciowych

### Problem: Modal pomocy nie otwiera się
- Sprawdź czy `HelpProvider` opakowuje aplikację w `layout.tsx`
- Sprawdź czy `HelpModal` jest renderowany w `layout.tsx`
- Sprawdź z-index czy modal nie jest zasłonięty