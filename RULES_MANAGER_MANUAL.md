# 🔧 Rules Manager - Manual Użytkownika

## Spis treści
1. [Wprowadzenie](#wprowadzenie)
2. [Dostęp do Rules Manager](#dostęp-do-rules-manager)
3. [Interfejs główny](#interfejs-główny)
4. [Tworzenie nowych reguł](#tworzenie-nowych-reguł)
5. [Zarządzanie regułami](#zarządzanie-regułami)
6. [Typy reguł](#typy-reguł)
7. [Wyzwalacze](#wyzwalacze)
8. [Warunki](#warunki)
9. [Akcje](#akcje)
10. [Przykłady użycia](#przykłady-użycia)
11. [Monitorowanie i statystyki](#monitorowanie-i-statystyki)
12. [Rozwiązywanie problemów](#rozwiązywanie-problemów)

---

## Wprowadzenie

**Rules Manager** to zunifikowany system zarządzania regułami, który łączy funkcjonalności z trzech obszarów:
- **Communication Rules** - reguły komunikacji
- **Email Filters** - filtry emailowe
- **Auto Replies** - automatyczne odpowiedzi

Dzięki Rules Manager możesz tworzyć i zarządzać wszystkimi typami reguł automatyzacji w jednym miejscu.

### 🎯 Główne korzyści:
- **Centralne zarządzanie** - wszystkie reguły w jednym miejscu
- **Zunifikowany interfejs** - spójne doświadczenie użytkownika
- **Elastyczność** - 6 typów reguł i 7 typów akcji
- **Monitoring** - statystyki i historia wykonań
- **Łatwość użycia** - intuicyjny formularz tworzenia i edycji
- **Pełne możliwości edycji** - modyfikacja wszystkich parametrów istniejących reguł ✅

---

## Dostęp do Rules Manager

### URL dostępu:
```
http://91.99.50.80/crm/dashboard/communication/rules-manager/
```

### Nawigacja w systemie:
1. Zaloguj się do systemu CRM-GTD
2. Przejdź do sekcji **Komunikacja**
3. Wybierz **Rules Manager**

---

## Interfejs główny

### 📊 Sekcja statystyk
Na górze strony znajdziesz 4 karty ze statystykami:

| Karta | Opis |
|-------|------|
| **Wszystkie Reguły** | Łączna liczba utworzonych reguł |
| **Aktywne** | Liczba obecnie aktywnych reguł |
| **Wykonania (24h)** | Ile razy reguły były wykonane w ciągu ostatnich 24 godzin |
| **Sukces Rate** | Procent pomyślnych wykonań |

### 🔍 Sekcja filtrów
Umożliwia wyszukiwanie i filtrowanie reguł:
- **Pole wyszukiwania** - szukaj po nazwie reguły
- **Filtr typu** - wybierz konkretny typ reguły
- **Filtr statusu** - wybierz status (aktywne/nieaktywne/draft/etc.)

### 📋 Lista reguł
Tabela ze wszystkimi regułami zawierająca:
- **Nazwa** - nazwa i opis reguły
- **Typ** - typ reguły z kolorową etykietą
- **Status** - obecny status reguły
- **Wykonania** - liczba wykonań
- **Sukces Rate** - procent pomyślnych wykonań
- **Ostatnie** - data ostatniego wykonania
- **Akcje** - przyciski akcji (uruchom, włącz/wyłącz, edytuj, usuń)

---

## Tworzenie nowych reguł

### 🚀 Krok 1: Otwórz modal tworzenia
1. Kliknij przycisk **"Nowa Reguła"** w prawym górnym rogu
2. Otworzy się modal "Nowa Zunifikowana Reguła"

### 📝 Krok 2: Wypełnij podstawowe informacje

#### Nazwa reguły (wymagane)
- Podaj opisową nazwę reguły
- Przykłady: "Auto-odpowiedź dla zapytań", "Filtrowanie newsletterów"

#### Opis (opcjonalne)
- Szczegółowy opis co robi reguła
- Pomaga w późniejszym zarządzaniu

#### Typ reguły (wymagane)
Wybierz jeden z 6 dostępnych typów:

| Typ | Opis | Zastosowanie |
|-----|------|--------------|
| **PROCESSING** | Przetwarzanie wiadomości | Automatyczne tworzenie zadań z emaili |
| **EMAIL_FILTER** | Filtrowanie emaili | Kategoryzacja, archiwizacja wiadomości |
| **AUTO_REPLY** | Automatyczne odpowiedzi | Wysyłanie automatycznych odpowiedzi |
| **AI_RULE** | Reguła AI | Analiza i insights przez AI |
| **SMART_MAILBOX** | Inteligentna skrzynka | Automatyczna organizacja wiadomości |
| **WORKFLOW** | Przepływ pracy | Złożone procesy biznesowe |

#### Priorytet (0-100)
- **0** = najniższy priorytet
- **100** = najwyższy priorytet
- Reguły o wyższym priorytecie wykonują się pierwsze

### ⚡ Krok 3: Skonfiguruj wyzwalacze

#### Typ wyzwalacza (wymagane)
Wybierz kiedy reguła ma się wykonać:

| Wyzwalacz | Opis | Przykład użycia |
|-----------|------|-----------------|
| **MANUAL** | Ręczne uruchomienie | Reguły uruchamiane na żądanie |
| **AUTOMATIC** | Automatyczne | Stałe przetwarzanie w tle |
| **EVENT_BASED** | Na podstawie zdarzeń | Reakcja na otrzymanie emaila |
| **SCHEDULED** | Harmonogram czasowy | Codziennie o 9:00 |
| **WEBHOOK** | Webhook zewnętrzny | Integracja z zewnętrznymi systemami |
| **API_CALL** | Wywołanie API | Programistyczne uruchamianie |

### 🎯 Krok 4: Ustaw warunki (opcjonalne)

#### Temat zawiera
- Reguła wykona się tylko jeśli temat emaila zawiera określone słowa
- Przykład: "Zapytanie", "Oferta", "Reklamacja"
- Wielokrotne słowa oddzielaj przecinkami

#### Nadawca zawiera
- Filtrowanie po adresie email nadawcy
- Przykłady: "@gmail.com", "jan.kowalski", "firma.pl"

### 🎬 Krok 5: Zdefiniuj akcje

#### Typ akcji (wymagane)
Wybierz co ma się stać gdy reguła zostanie uruchomiona:

| Akcja | Opis | Przykład |
|-------|------|----------|
| **CREATE_TASK** | Utwórz zadanie | Automatyczne zadanie z emaila |
| **SEND_EMAIL** | Wyślij email | Auto-odpowiedź |
| **UPDATE_CONTACT** | Zaktualizuj kontakt | Dodaj notatkę do kontaktu |
| **ADD_TAG** | Dodaj tag | Oznacz jako "Pilne" |
| **MOVE_TO_FOLDER** | Przenieś do folderu | Archiwizacja |
| **AI_ANALYSIS** | Analiza AI | Sentiment analysis |
| **WEBHOOK** | Webhook | Powiadamianie zewnętrznych systemów |

#### Szczegóły akcji
- Opisz szczegóły wykonania akcji
- Będzie używane przez system do realizacji

### ✅ Krok 6: Zapisz regułę
1. Sprawdź wszystkie wprowadzone dane
2. Kliknij **"Utwórz Regułę"**
3. Reguła zostanie utworzona i pojawi się na liście

---

## Zarządzanie regułami

### 🎮 Akcje dostępne dla każdej reguły:

#### ▶️ Uruchomienie reguły
- Kliknij ikonę "Play" aby ręcznie uruchomić regułę
- Przydatne do testowania

#### ⏸️ Włączanie/Wyłączanie
- Kliknij ikonę "Pause" aby wyłączyć aktywną regułę
- Kliknij ikonę "Play" aby włączyć nieaktywną regułę

#### ✏️ Edycja ✅
- Kliknij ikonę "Pencil" aby edytować regułę
- Otworzy się modal z formularzem wypełnionym aktualnymi danymi
- Zmień dowolne pola i kliknij "Zapisz Zmiany"
- Reguła zostanie zaktualizowana i lista odświeżona

#### 🗑️ Usuwanie
- Kliknij czerwoną ikonę "Trash" aby usunąć regułę
- System poprosi o potwierdzenie

### 📊 Filtrowanie i wyszukiwanie

#### Wyszukiwanie tekstowe
- Wpisz frazę w pole "Szukaj reguł..."
- System przeszuka nazwy i opisy reguł

#### Filtrowanie po typie
Wybierz z listy rozwijanej:
- **Wszystkie typy** - pokaż wszystkie
- **Processing** - tylko reguły przetwarzania
- **Email Filter** - tylko filtry email
- **Auto Reply** - tylko auto-odpowiedzi
- **AI Rule** - tylko reguły AI
- **Smart Mailbox** - tylko inteligentne skrzynki
- **Workflow** - tylko przepływy pracy

#### Filtrowanie po statusie
- **Wszystkie statusy** - pokaż wszystkie
- **Aktywne** - tylko aktywne reguły
- **Nieaktywne** - tylko wyłączone reguły
- **Drafty** - tylko wersje robocze
- **Testowane** - reguły w fazie testów
- **Błąd** - reguły z błędami
- **Przestarzałe** - nieaktualne reguły

---

## Typy reguł

### 1. 🔄 PROCESSING - Przetwarzanie wiadomości
**Zastosowanie:** Automatyczne przetwarzanie przychodzących wiadomości

**Przykłady użycia:**
- Tworzenie zadań z emaili zawierających "TODO"
- Przypisywanie kontaktów do odpowiednich sprzedawców
- Kategoryzacja wiadomości według tematu

**Najlepsze praktyki:**
- Używaj opisowych nazw zadań
- Ustaw odpowiedni priorytet zadania
- Dodawaj kontekst w opisie zadania

### 2. 📧 EMAIL_FILTER - Filtrowanie emaili
**Zastosowanie:** Automatyczna organizacja skrzynki pocztowej

**Przykłady użycia:**
- Przenoszenie newsletterów do osobnego folderu
- Oznaczanie emaili od VIP klientów
- Automatyczne archiwizowanie starych wiadomości

**Najlepsze praktyki:**
- Używaj precyzyjnych filtrów aby uniknąć false positive
- Testuj filtry przed włączeniem
- Regularnie przeglądaj przefiltrowane wiadomości

### 3. 🤖 AUTO_REPLY - Automatyczne odpowiedzi
**Zastosowanie:** Wysyłanie automatycznych odpowiedzi

**Przykłady użycia:**
- Potwierdzenia otrzymania zapytania
- Informacje o nieobecności
- Przekierowanie do odpowiedniego działu

**Najlepsze praktyki:**
- Używaj przyjaznego tonu
- Podawaj alternatywne sposoby kontaktu
- Unikaj tworzenia pętli odpowiedzi

### 4. 🧠 AI_RULE - Reguły AI
**Zastosowanie:** Wykorzystanie sztucznej inteligencji

**Przykłady użycia:**
- Analiza sentymentu wiadomości
- Automatyczne streszczenia długich emaili
- Wykrywanie pilnych spraw

**Najlepsze praktyki:**
- Sprawdź wyniki AI przed działaniem
- Ustaw odpowiednie progi pewności
- Regularnie trenuj model na nowych danych

### 5. 📮 SMART_MAILBOX - Inteligentne skrzynki
**Zastosowanie:** Automatyczna organizacja wiadomości

**Przykłady użycia:**
- Skrzynka "Pilne" dla ważnych wiadomości
- Skrzynka "Klienci" dla komunikacji z klientami
- Skrzynka "Newsletter" dla biuletynów

**Najlepsze praktyki:**
- Twórz logiczne kategorie
- Unikaj zbyt wielu skrzynek
- Regularnie sprawdzaj automatyczne kategoryzacje

### 6. 🔄 WORKFLOW - Przepływy pracy
**Zastosowanie:** Złożone procesy biznesowe

**Przykłady użycia:**
- Proces onboardingu nowego klienta
- Workflow zatwierdzania ofert
- Eskalacja nierozwiązanych zgłoszeń

**Najlepsze praktyki:**
- Dokumentuj każdy krok procesu
- Testuj cały workflow przed uruchomieniem
- Monitoruj efektywność procesu

---

## Wyzwalacze

### 1. 👆 MANUAL - Ręczne uruchomienie
**Kiedy używać:** Gdy chcesz kontrolować kiedy reguła się wykonuje

**Charakterystyka:**
- Wykonuje się tylko po kliknięciu przycisku
- Idealny do testowania reguł
- Brak automatyzacji

**Przykład:** Reguła do masowego wysyłania raportów

### 2. ⚙️ AUTOMATIC - Automatyczne
**Kiedy używać:** Dla stałego przetwarzania w tle

**Charakterystyka:**
- Działa ciągle w tle
- Sprawdza warunki co określony czas
- Wymaga ostrożności aby nie przeciążyć systemu

**Przykład:** Sprawdzanie nowych emaili co 5 minut

### 3. 📡 EVENT_BASED - Na podstawie zdarzeń
**Kiedy używać:** Gdy chcesz reagować na konkretne wydarzenia

**Charakterystyka:**
- Najwydajniejszy typ wyzwalacza
- Wykonuje się natychmiast po wystąpieniu zdarzenia
- Minimalne zużycie zasobów

**Przykład:** Natychmiastowa reakcja na otrzymanie emaila

### 4. ⏰ SCHEDULED - Harmonogram czasowy
**Kiedy używać:** Dla akcji wykonywanych o określonych godzinach

**Charakterystyka:**
- Precyzyjne zarządzanie czasem
- Możliwość ustawiania cyklicznych wykonań
- Idealny dla raportów i podsumowań

**Przykład:** Codziennie o 9:00 wyślij raport sprzedaży

### 5. 🌐 WEBHOOK - Webhook zewnętrzny
**Kiedy używać:** Do integracji z zewnętrznymi systemami

**Charakterystyka:**
- Umożliwia komunikację z innymi aplikacjami
- Wymaga konfiguracji URL webhook
- Bezpieczny sposób integracji

**Przykład:** Powiadomienie CRM o nowym zamówieniu ze sklepu

### 6. 🔌 API_CALL - Wywołanie API
**Kiedy używać:** Do programistycznego uruchamiania reguł

**Charakterystyka:**
- Kontrola z poziomu kodu
- Możliwość przekazywania parametrów
- Idealny dla integracji

**Przykład:** Uruchomienie reguły z innej aplikacji

---

## Warunki

### 🎯 Temat zawiera
**Opis:** Filtrowanie na podstawie tematu emaila

**Przykłady:**
- `"Zapytanie"` - emaile z zapytaniami
- `"Oferta"` - propozycje współpracy
- `"Reklamacja"` - skargi klientów
- `"Pilne"` - sprawy wymagające szybkiej reakcji

**Wskazówki:**
- Używaj powszechnych słów kluczowych
- Uwzględnij różne formy (np. "zapytanie", "pytanie")
- Testuj na rzeczywistych emailach

### 👤 Nadawca zawiera
**Opis:** Filtrowanie na podstawie adresu email nadawcy

**Przykłady:**
- `"@gmail.com"` - wszystkie emaile z Gmail
- `"jan.kowalski"` - konkretna osoba
- `"firma.pl"` - emaile z określonej domeny
- `"support"` - emaile od działów wsparcia

**Wskazówki:**
- Używaj części adresu dla większej elastyczności
- Domeny firmowe są bardziej stabilne od nazw użytkowników
- Uwzględnij różne formaty adresów

### 🔧 Zaawansowane warunki
*W przyszłych wersjach systemu będą dostępne dodatkowe warunki:*
- Data otrzymania wiadomości
- Rozmiar załączników
- Język wiadomości
- Priorytet wiadomości

---

## Akcje

### 1. ✅ CREATE_TASK - Utwórz zadanie
**Opis:** Automatyczne tworzenie zadań w systemie GTD

**Kiedy używać:**
- Email wymaga wykonania konkretnego działania
- Chcesz śledzić postępy w realizacji
- Potrzebujesz przypomnienia o sprawie

**Parametry konfiguracji:**
- Tytuł zadania (domyślnie: temat emaila)
- Opis zadania
- Priorytet (niski/średni/wysoki)
- Termin wykonania
- Przypisana osoba
- Kontekst GTD (@calls, @computer, @errands, etc.)

**Przykład szczegółów akcji:**
```
Tytuł: Odpowiedź na zapytanie ofertowe
Priorytet: Wysoki
Termin: +2 dni
Kontekst: @computer
Opis: Przygotowanie oferty na podstawie otrzymanego zapytania
```

### 2. 📧 SEND_EMAIL - Wyślij email
**Opis:** Automatyczne wysyłanie odpowiedzi email

**Kiedy używać:**
- Potwierdzenia otrzymania wiadomości
- Standardowe odpowiedzi na często zadawane pytania
- Przekierowanie do odpowiedniego działu

**Parametry konfiguracji:**
- Szablon wiadomości
- Adresat (nadawca/custom email)
- Temat odpowiedzi
- Załączniki
- Podpis

**Przykład szczegółów akcji:**
```
Szablon: Potwierdzenie otrzymania zapytania
Temat: Re: {ORIGINAL_SUBJECT}
Treść: Dziękujemy za zapytanie. Odpowiemy w ciągu 24h.
Podpis: Dział Obsługi Klienta
```

### 3. 👥 UPDATE_CONTACT - Zaktualizuj kontakt
**Opis:** Automatyczna aktualizacja danych kontaktu

**Kiedy używać:**
- Nowe informacje o kontakcie w emailu
- Zmiana statusu kontaktu
- Dodawanie notatek do historii kontaktu

**Parametry konfiguracji:**
- Pole do aktualizacji
- Nowa wartość
- Tryb aktualizacji (zastąp/dodaj)

**Przykład szczegółów akcji:**
```
Pole: Notatki
Akcja: Dodaj
Wartość: "Email otrzymany: {DATE} - {SUBJECT}"
```

### 4. 🏷️ ADD_TAG - Dodaj tag
**Opis:** Oznaczanie wiadomości lub kontaktów tagami

**Kiedy używać:**
- Kategoryzacja wiadomości
- Oznaczanie priorytetów
- Grupowanie podobnych spraw

**Parametry konfiguracji:**
- Nazwa tagu
- Kolor tagu
- Obiekt tagowania (email/kontakt/zadanie)

**Przykład szczegółów akcji:**
```
Tag: "VIP Klient"
Kolor: Złoty
Obiekt: Kontakt
```

### 5. 📁 MOVE_TO_FOLDER - Przenieś do folderu
**Opis:** Organizacja wiadomości w folderach

**Kiedy używać:**
- Automatyczne archiwizowanie
- Kategoryzacja według typu
- Czyszczenie głównej skrzynki

**Parametry konfiguracji:**
- Nazwa folderu docelowego
- Akcja jeśli folder nie istnieje
- Zachowanie oryginału

**Przykład szczegółów akcji:**
```
Folder: "Archiwum/Newslettery"
Jeśli brak folderu: Utwórz
Kopia: Nie, przenieś
```

### 6. 🤖 AI_ANALYSIS - Analiza AI
**Opis:** Wykorzystanie sztucznej inteligencji do analizy

**Kiedy używać:**
- Analiza sentymentu wiadomości
- Automatyczne streszczenia
- Wykrywanie intencji nadawcy
- Klasyfikacja priorytetów

**Parametry konfiguracji:**
- Typ analizy
- Model AI
- Progi pewności
- Akcje na podstawie wyników

**Przykład szczegółów akcji:**
```
Analiza: Sentiment + Intencja
Model: GPT-4
Jeśli negatywny: Oznacz jako pilny
Jeśli pytanie: Utwórz zadanie odpowiedzi
```

### 7. 🔗 WEBHOOK - Webhook
**Opis:** Powiadomienie zewnętrznych systemów

**Kiedy używać:**
- Integracja z CRM
- Powiadomienia w Slack/Teams
- Uruchamianie procesów w innych aplikacjach

**Parametry konfiguracji:**
- URL webhook
- Metoda HTTP (POST/PUT/GET)
- Dane do przesłania
- Nagłówki HTTP
- Autoryzacja

**Przykład szczegółów akcji:**
```
URL: https://hooks.slack.com/services/...
Metoda: POST
Dane: {"text": "Nowy email od {SENDER}: {SUBJECT}"}
Nagłówek: Content-Type: application/json
```

---

## Przykłady użycia

### 📝 Przykład 1: Auto-odpowiedź dla zapytań ofertowych

**Cel:** Automatyczne potwierdzanie otrzymania zapytań ofertowych

**Konfiguracja:**
- **Nazwa:** "Potwierdzenie zapytania ofertowego"
- **Typ:** AUTO_REPLY
- **Wyzwalacz:** EVENT_BASED
- **Warunki:** 
  - Temat zawiera: "oferta, wycena, zapytanie"
- **Akcje:** SEND_EMAIL
  - Treść: "Dziękujemy za zapytanie ofertowe. Nasz zespół przygotuje odpowiedź w ciągu 24 godzin."

**Rezultat:** Każdy email z zapytaniem ofertowym automatycznie otrzyma potwierdzenie

### 🏷️ Przykład 2: Filtrowanie newsletterów

**Cel:** Automatyczne przenoszenie newsletterów do osobnego folderu

**Konfiguracja:**
- **Nazwa:** "Filtr newsletterów"
- **Typ:** EMAIL_FILTER
- **Wyzwalacz:** EVENT_BASED
- **Warunki:**
  - Temat zawiera: "newsletter, biuletyn, unsubscribe"
- **Akcje:** MOVE_TO_FOLDER
  - Folder: "Newslettery"

**Rezultat:** Czytsza główna skrzynka, newslettery w osobnym folderze

### ✅ Przykład 3: Tworzenie zadań z pilnych emaili

**Cel:** Automatyczne zadania dla emaili oznaczonych jako pilne

**Konfiguracja:**
- **Nazwa:** "Pilne emaile → Zadania"
- **Typ:** PROCESSING
- **Wyzwalacz:** EVENT_BASED
- **Warunki:**
  - Temat zawiera: "PILNE, URGENT, ASAP"
- **Akcje:** CREATE_TASK
  - Priorytet: Wysoki
  - Termin: +4 godziny
  - Kontekst: @calls

**Rezultat:** Pilne sprawy nie umkną uwagi, będą śledzone jako zadania

### 🤖 Przykład 4: Analiza AI dla reklamacji

**Cel:** Automatyczna analiza i eskalacja reklamacji

**Konfiguracja:**
- **Nazwa:** "Analiza reklamacji AI"
- **Typ:** AI_RULE
- **Wyzwalacz:** EVENT_BASED
- **Warunki:**
  - Temat zawiera: "reklamacja, skarga, problem"
- **Akcje:** AI_ANALYSIS
  - Analiza: Sentiment + Priorytet
  - Jeśli bardzo negatywny: Utwórz zadanie dla managera

**Rezultat:** Reklamacje są automatycznie analizowane i eskalowane

### 📊 Przykład 5: Raport dzienny

**Cel:** Codzienne wysyłanie raportu o nowych emailach

**Konfiguracja:**
- **Nazwa:** "Raport dzienny emaili"
- **Typ:** WORKFLOW
- **Wyzwalacz:** SCHEDULED (codziennie 8:00)
- **Warunki:** brak
- **Akcje:** SEND_EMAIL
  - Odbiorca: manager@firma.pl
  - Treść: Raport z liczby emaili z ostatnich 24h

**Rezultat:** Manager otrzymuje codzienne podsumowanie aktywności

---

## Monitorowanie i statystyki

### 📊 Dashboard główny

**Karty statystyk:**
1. **Wszystkie reguły** - łączna liczba reguł w systemie
2. **Aktywne** - reguły obecnie włączone i działające
3. **Wykonania (24h)** - ile razy reguły zostały uruchomione w ostatnich 24 godzinach
4. **Sukces Rate** - procent pomyślnych wykonań vs błędów

### 📈 Rozkład typów reguł
Graficzna reprezentacja pokazująca:
- Ile reguł każdego typu masz
- Które typy są najczęściej używane
- Pomaga w analizie wykorzystania systemu

### 📋 Monitoring poszczególnych reguł

**Kolumna "Wykonania":**
- Pokazuje ile razy reguła została uruchomiona
- Pomaga identyfikować najczęściej używane reguły

**Kolumna "Sukces Rate":**
- Procent pomyślnych wykonań
- Wartości poniżej 90% mogą wskazywać na problemy

**Kolumna "Ostatnie":**
- Data ostatniego wykonania reguły
- Pomaga identyfikować nieużywane reguły

### 🔍 Historia wykonań *(w przygotowaniu)*
- Szczegółowe logi każdego wykonania
- Komunikaty błędów
- Czas wykonania
- Parametry przekazane do reguły

---

## Rozwiązywanie problemów

### ❌ Reguła się nie wykonuje

**Możliwe przyczyny:**
1. **Status nieaktywny** - sprawdź czy reguła jest włączona
2. **Błędne warunki** - warunki są zbyt restrykcyjne
3. **Błędny wyzwalacz** - niewłaściwy typ wyzwalacza dla scenariusza

**Rozwiązania:**
1. Sprawdź status reguły w kolumnie "Status"
2. Przetestuj warunki na przykładowych emailach
3. Uruchom regułę ręcznie przyciskiem "Play"
4. Sprawdź logi błędów w historii wykonań

### ⚠️ Niski sukces rate

**Możliwe przyczyny:**
1. **Błędy w akcjach** - nieprawidłowa konfiguracja akcji
2. **Błędy systemu** - problemy z połączeniem lub uprawnieniami
3. **Nieprawidłowe dane** - brakujące informacje wymagane przez akcję

**Rozwiązania:**
1. Sprawdź konfigurację akcji
2. Przetestuj akcję ręcznie
3. Sprawdź logi błędów
4. Skontaktuj się z administratorem systemu

### 🐛 Reguła wykonuje się zbyt często

**Możliwe przyczyny:**
1. **Zbyt ogólne warunki** - reguła pasuje do zbyt wielu emaili
2. **Błędny wyzwalacz** - AUTOMATIC zamiast EVENT_BASED
3. **Pętla wykonań** - reguła uruchamia sama siebie

**Rozwiązania:**
1. Doprecyzuj warunki filtrowania
2. Zmień typ wyzwalacza
3. Dodaj wyłączenia dla automatycznych emaili
4. Tymczasowo wyłącz regułę dla analizy

### 🔧 Problemy z wydajnością

**Objawy:**
- Wolne działanie systemu
- Długie czasy ładowania
- Błędy timeout

**Rozwiązania:**
1. Zmniejsz liczbę aktywnych reguł AUTOMATIC
2. Optymalizuj warunki filtrowania
3. Zwiększ interwały czasowe dla SCHEDULED
4. Skontaktuj się z administratorem

### 📞 Kontakt z pomocą techniczną

**Przed zgłoszeniem:**
1. Sprawdź ten manual
2. Przetestuj regułę ręcznie
3. Sprawdź logi błędów
4. Przygotuj szczegółowy opis problemu

**Informacje do zgłoszenia:**
- Nazwa problematycznej reguły
- Opis oczekiwanego vs rzeczywistego zachowania
- Kroki reprodukcji problemu
- Screenshoty błędów
- Data i godzina wystąpienia problemu

---

## 🎯 Najlepsze praktyki

### ✅ Do zrobienia
- **Testuj reguły** przed włączeniem na produkcji
- **Używaj opisowych nazw** - ułatwia późniejsze zarządzanie
- **Dokumentuj złożone reguły** w polu opisu
- **Regularnie sprawdzaj statystyki** wykonań
- **Optymalizuj warunki** aby uniknąć false positive
- **Używaj odpowiednich priorytetów** dla kolejności wykonania
- **Monitoruj sukces rate** i reaguj na błędy

### ❌ Czego unikać
- **Zbyt ogólnych warunków** - mogą powodować spam akcji
- **Tworzenia pętli** - reguła nie powinna uruchamiać sama siebie
- **Nadużywania AUTOMATIC** - może obciążyć system
- **Pozostawiania testowych reguł** - usuń po zakończeniu testów
- **Ignorowania błędów** - niska skuteczność rate wymaga uwagi
- **Duplikowania funkcjonalności** - sprawdź czy podobna reguła już istnieje

### 🚀 Optymalizacja wydajności
- **Używaj EVENT_BASED** zamiast AUTOMATIC gdy to możliwe
- **Precyzyjne warunki** redukują niepotrzebne wykonania
- **Grupuj podobne akcje** w jednej regule
- **Usuwaj nieużywane reguły** regularnie
- **Monitoruj zasoby systemu** podczas szczytów aktywności

---

## 📚 Dodatki

### 🔗 Powiązane dokumenty
- Manual główny CRM-GTD: `CLAUDE.md`
- Dokumentacja API: `docs/api/`
- Przewodnik integracji: `docs/integrations/`

### 🆕 Planowane funkcjonalności
- **Klonowanie reguł** - tworzenie kopii z modyfikacjami
- **Szablony reguł** - gotowe wzorce dla typowych scenariuszy
- **Zaawansowane warunki** - więcej opcji filtrowania
- **Grupowanie reguł** - organizacja w kategorie
- **Import/Export** - przenoszenie reguł między środowiskami
- **Historia wykonań** - szczegółowe logi i analityka

### 📞 Wsparcie
- **Email**: support@crm-gtd.pl
- **Telefon**: +48 123 456 789
- **Chat**: Dostępny w prawym dolnym rogu systemu
- **Dokumentacja online**: http://docs.crm-gtd.pl

---

*Manual Rules Manager v1.0 - Utworzono: 2025-06-24*
*© 2025 CRM-GTD Smart - Wszystkie prawa zastrzeżone*