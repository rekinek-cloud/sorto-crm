# 📝 SmartNotes AI - Instrukcja Użytkownika

## 📱 Wprowadzenie

SmartNotes AI to zaawansowana aplikacja do tworzenia inteligentnych notatek głosowych z wykorzystaniem sztucznej inteligencji. Aplikacja oferuje automatyczną transkrypcję, generowanie streszczeń oraz zarządzanie notatkami z funkcjami AI.

## 🚀 Uruchomienie Aplikacji

### Opcja 1: Lokalny serwer HTTP
```bash
cd smartnotes-app
python3 -m http.server 9999 --directory dist --bind 0.0.0.0
```
Adres: http://localhost:9999

### Opcja 2: Lokalny serwer HTTPS (zalecane dla Firefox)
```bash
cd smartnotes-app
python3 start-https.py
```
Adres: https://localhost:8443

### Opcja 3: Sieć lokalna
- HTTP: http://[TWOJE_IP]:9999
- HTTPS: https://[TWOJE_IP]:8443

## 🎯 Pierwsze kroki

### 1. Otwórz aplikację
- Wejdź na jeden z powyższych adresów
- Zobaczysz stronę porównania funkcji

### 2. "Zainstaluj" aplikację
- Kliknij przycisk **"Pobierz SmartNotes za darmo"**
- Poczekaj na symulację instalacji (2 sekundy)
- Kliknij **"Otwórz aplikację"**

### 3. Dostęp do pełnej aplikacji
- Po "instalacji" zobaczysz główny interfejs SmartNotes AI

## 🎙️ Tworzenie notatek głosowych

### Nagrywanie nowej notatki:

1. **Rozpocznij nagrywanie**
   - Kliknij przycisk **"Nowa notatka"**
   - Przyznaj uprawnienia do mikrofonu (ważne!)
   - Kliknij **"Rozpocznij nagrywanie"**

2. **Kontrola nagrywania**
   - ⏸️ **Pause** - wstrzymaj nagrywanie
   - ▶️ **Play** - wznów nagrywanie
   - ⏹️ **Stop** - zakończ nagrywanie

3. **Obserwuj wizualizację**
   - Podczas nagrywania widoczny jest wizualizer audio
   - Czerwona kropka oznacza aktywne nagrywanie
   - Timer pokazuje czas nagrywania

4. **Zakończ i zapisz**
   - Kliknij **"Zapisz nagranie"**
   - Automatycznie przejdziesz do transkrypcji

## 🧠 Transkrypcja AI

### Automatyczna transkrypcja:

1. **Rozpocznij transkrypcję**
   - Po zapisaniu nagrania kliknij **"Rozpocznij transkrypcję"**
   - Poczekaj na przetworzenie przez AI (2-5 sekund)

2. **Wyniki transkrypcji**
   - **Tekst** - automatyczna transkrypcja mowy
   - **Streszczenie AI** - inteligentne podsumowanie
   - **Kluczowe słowa** - automatyczne tagi
   - **Rozpoznani mówcy** - identyfikacja osób mówiących

3. **Ocena jakości**
   - Procent pewności transkrypcji
   - Im wyższa wartość, tym lepsza jakość

## 📋 Zarządzanie notatkami

### Lista notatek:

1. **Przeglądanie**
   - Wszystkie notatki wyświetlane chronologicznie
   - Podgląd tytułu, treści i metadanych
   - Ikona mikrofonu przy notatkach z nagraniami

2. **Wyszukiwanie**
   - Pole wyszukiwania u góry listy
   - Wyszukuje w tytułach, treści i tagach
   - Filtry szybkie: "Wszystkie", "Z nagraniem", "Dzisiejsze"

3. **Kategorie**
   - Automatyczne grupowanie notatek
   - Filtrowanie według kategorii
   - Przypisywanie własnych kategorii

### Edycja notatek:

1. **Otwórz notatkę**
   - Kliknij na dowolną notatkę z listy
   - Otwiera się szczegółowy widok

2. **Tryb edycji**
   - Kliknij ikonę ✏️ (Edytuj)
   - Możliwość zmiany tytułu, treści, kategorii i tagów
   - Kliknij 💾 (Zapisz) aby zachować zmiany

3. **Odtwarzanie nagrań**
   - Jeśli notatka ma nagranie, dostępny jest odtwarzacz audio
   - Standardowe kontrolki play/pause/seek

4. **Usuwanie**
   - Kliknij ikonę 🗑️ (Usuń)
   - Potwierdź usunięcie w oknie dialogowym

## 🔧 Ustawienia i funkcje

### Uprawnienia przeglądarki:
- **Mikrofon** - wymagane do nagrywania
- **LocalStorage** - do zapisywania notatek lokalnie

### Kompatybilność przeglądarek:
- ✅ **Chrome** (zalecane) - pełne wsparcie
- ✅ **Firefox** - wymaga HTTPS dla mikrofonu
- ✅ **Safari** 14+ - pełne wsparcie
- ✅ **Edge** - pełne wsparcie

### Formaty audio:
- **Nagrywanie** - WebM z kodekiem Opus
- **Odtwarzanie** - natywne wsparcie przeglądarki

## 🏷️ Organizacja notatek

### Tagi i kategorie:

1. **Automatyczne tagi**
   - AI automatycznie generuje tagi z kluczowych słów
   - Bazowane na analizie treści transkrypcji

2. **Ręczne tagi**
   - Dodaj własne tagi podczas edycji
   - Oddziel przecinkami: "praca, spotkanie, projekt"

3. **Kategorie**
   - Grupowanie tematyczne notatek
   - Przykłady: "Praca", "Osobiste", "Projekty"

### Wyszukiwanie zaawansowane:
- Wyszukaj według tytułu
- Wyszukaj w treści transkrypcji
- Filtruj według tagów
- Filtruj według kategorii
- Filtruj według daty utworzenia

## 💡 Wskazówki i najlepsze praktyki

### Jakość nagrań:
1. **Środowisko**
   - Nagraj w cichym miejscu
   - Unikaj echa i hałasu tła
   - Trzymaj mikrofon blisko ust

2. **Mowa**
   - Mów wyraźnie i w umiarkowanym tempie
   - Rób krótkie pauzy między zdaniami
   - Unikaj mruczenia pod nosem

### Organizacja:
1. **Nazywanie**
   - Używaj opisowych tytułów
   - Dodawaj datę w tytule jeśli potrzeba
   - Przykład: "Spotkanie projektu ABC - 19.06.2025"

2. **Kategoryzacja**
   - Konsekwentnie używaj tych samych nazw kategorii
   - Nie twórz zbyt wielu kategorii
   - Przykłady: "Praca", "Nauka", "Osobiste", "Pomysły"

3. **Tagowanie**
   - Używaj krótkich, opisowych tagów
   - Standardowe tagi: "ważne", "todo", "pomysł"
   - Unikaj duplikowania informacji z kategorii

## 🔒 Prywatność i bezpieczeństwo

### Lokalne przechowywanie:
- Wszystkie notatki przechowywane lokalnie w przeglądarce
- Brak wysyłania danych na zewnętrzne serwery
- Dane pozostają na twoim urządzeniu

### Backup i eksport:
- Notatki automatycznie zapisywane w LocalStorage
- Możliwość eksportu danych (funkcja w rozwoju)
- Regularne backup zalecany

### Bezpieczeństwo:
- HTTPS zalecane dla funkcji mikrofonu
- Brak logowania danych audio na serwer
- Wszystkie operacje AI symulowane lokalnie

## 🆘 Rozwiązywanie problemów

### Mikrofon nie działa:

1. **Sprawdź uprawnienia**
   - Kliknij ikonę 🔒 obok adresu URL
   - Ustaw "Mikrofon" na "Zezwól"
   - Odśwież stronę (F5)

2. **Spróbuj HTTPS**
   - Firefox wymaga HTTPS: https://localhost:8443
   - Chrome działa z HTTP: http://localhost:9999

3. **Sprawdź mikrofon systemowy**
   - Upewnij się, że mikrofon działa w systemie
   - Sprawdź ustawienia prywatności systemu

### Aplikacja się nie ładuje:

1. **Sprawdź połączenie**
   - Upewnij się, że serwer jest uruchomiony
   - Sprawdź porty: 9999 (HTTP) lub 8443 (HTTPS)

2. **Wyczyść cache**
   - Ctrl+F5 lub Cmd+Shift+R
   - Wyczyść cache przeglądarki

3. **Spróbuj inną przeglądarkę**
   - Chrome jako pierwsza opcja
   - Firefox z HTTPS

### Notatki znikają:

1. **LocalStorage**
   - Dane przechowywane lokalnie w przeglądarce
   - Nie usuwaj danych przeglądarki
   - Nie używaj trybu incognito

2. **Backup**
   - Eksportuj ważne notatki
   - Skopiuj treść ważnych notatek

## 📞 Kontakt i wsparcie

### Zgłaszanie błędów:
- Opisz szczegółowo problem
- Podaj używaną przeglądarkę i wersję
- Dołącz kroki do odtworzenia błędu

### Sugestie funkcji:
- Nowe pomysły na funkcjonalność
- Ulepszenia interfejsu użytkownika
- Optymalizacje wydajności

---

**SmartNotes AI** - Twoje inteligentne notatki głosowe z mocą sztucznej inteligencji! 🎙️🧠✨