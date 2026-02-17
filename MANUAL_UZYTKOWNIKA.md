# Sorto Streams — Manual Użytkownika

## Wersja 2.0 | Data: Luty 2026

---

## Spis Treści

1. [Wprowadzenie](#1-wprowadzenie)
2. [Pierwsze kroki](#2-pierwsze-kroki)
3. [Źródło](#3-źródło)
4. [Strumienie](#4-strumienie)
5. [Zadania](#5-zadania)
6. [Projekty](#6-projekty)
7. [Cele Precyzyjne (RZUT)](#7-cele-precyzyjne-rzut)
8. [CRM — Firmy, Kontakty, Transakcje](#8-crm--firmy-kontakty-transakcje)
9. [Smart Mailboxes](#9-smart-mailboxes)
10. [AI — Inteligentny asystent](#10-ai--inteligentny-asystent)
11. [Day Planner](#11-day-planner)
12. [Przeglądy](#12-przeglądy)
13. [Baza Wiedzy](#13-baza-wiedzy)
14. [Reguły i automatyzacje](#14-reguły-i-automatyzacje)
15. [Konfiguracja](#15-konfiguracja)
16. [FAQ](#16-faq)

---

## 1. Wprowadzenie

### Czym jest Sorto Streams?

Sorto Streams to platforma do zarządzania pracą i relacjami z klientami. Opiera się na dwóch prostych konceptach:

- **Źródło** — jeden punkt wejścia, gdzie trafia wszystko nowe
- **Strumienie** — kontenery, w których organizujesz pracę

System **sam się buduje** z twojej pracy. Nie musisz konfigurować pipeline'u ani definiować procesów na starcie. Podłączasz email, zaczynasz pracować, a AI analizuje, proponuje struktury i uczy się twoich wzorców.

### Główne zasady

1. **Złap wszystko, organizuj później** — wszystko nowe trafia do Źródła
2. **AI sugeruje, ty decydujesz** — system proponuje, ale nigdy nie działa bez twojej zgody
3. **Strumienie płyną lub zamarzają** — aktywne strumienie wymagają uwagi, zamrożone czekają
4. **CRM wyłania się z pracy** — kontakty, firmy i transakcje powstają automatycznie z emaili i notatek

### Co zyskujesz

- Centralizacja zadań, projektów i komunikacji w jednym miejscu
- Inteligentne przetwarzanie emaili z automatyczną ekstrakcją danych
- CRM który buduje się sam z twoich interakcji
- Mierzalne cele (system RZUT) zamiast mglistych postanowień
- Planowanie dnia dopasowane do twojego poziomu energii

---

## 2. Pierwsze kroki

### Logowanie

1. Otwórz aplikację w przeglądarce
2. Wprowadź email i hasło
3. Kliknij "Zaloguj się"

### Nawigacja

Menu boczne zawiera główne sekcje:

| Sekcja | Opis |
|--------|------|
| **Pulpit** | Przegląd dnia: widżety, statystyki, aktywne zadania |
| **Źródło** | Nowe elementy do przetworzenia |
| **Strumienie** | Twoje strumienie pracy |
| **Zadania** | Lista wszystkich zadań |
| **Projekty** | Większe przedsięwzięcia |
| **CRM** | Firmy, kontakty, transakcje, pipeline |
| **Smart Mailboxes** | Inteligentne skrzynki pocztowe |
| **Day Planner** | Planowanie dnia z AI |
| **Baza Wiedzy** | Dokumenty, wiki, materiały |
| **Narzędzia** | Reguły AI, konfiguracja, Rules Manager |

### Szybkie wyszukiwanie

Naciśnij **Cmd+K** (Mac) lub **Ctrl+K** (Windows) aby otworzyć globalne wyszukiwanie.

### Pierwszy dzień — co zrobić?

1. **Podłącz email** — Komunikacja → Kanały → Nowy kanał
2. **Przejrzyj Źródło** — przetwórz elementy które wpłynęły
3. **Utwórz 3-5 strumieni** — dla głównych obszarów pracy (klienci, projekty, administracja)
4. **Nie przesadzaj ze strukturą** — system sam zaproponuje rozbudowę

---

## 3. Źródło

### Czym jest Źródło?

Źródło to **jeden, centralny punkt wejścia** dla wszystkich nowych elementów. Emaile, notatki, pomysły, dokumenty — wszystko trafia tutaj.

> *"Złap wszystko, organizuj później. Źródło powinno być puste na koniec dnia."*

### Co wpływa do Źródła?

| Typ | Przykład |
|-----|---------|
| Email | Wiadomości wymagające akcji |
| Notatka | Szybka myśl, pomysł |
| Spotkanie | Notatki z rozmowy |
| Telefon | Ustalenia z rozmowy telefonicznej |
| Pomysł | Inspiracja, koncepcja |
| Dokument | Plik do przejrzenia |
| Faktura | Rachunek do opłacenia |
| Artykuł | Tekst do przeczytania |
| Notatka głosowa | Nagranie do przetworzenia |
| Zdjęcie | Wizytówka, tablica, dokument |
| Inne | Cokolwiek nowego |

### Przetwarzanie elementów

Dla każdego elementu w Źródle podejmij decyzję:

```
Element w Źródle
      │
      ▼
Czy wymaga działania?
├── TAK → Czy zajmie < 2 min?
│         ├── TAK → Zrób teraz
│         └── NIE → Zaplanuj / Deleguj / Utwórz projekt
└── NIE → Czy warto zachować?
          ├── TAK → Strumień referencyjny lub Baza wiedzy
          └── NIE → Usuń
```

### Szybkie akcje

| Akcja | Klawisz | Co robi |
|-------|---------|---------|
| **Zrób teraz** | DO | Tworzy pilne zadanie |
| **Zaplanuj** | DEFER | Planuje na jutro 9:00 |
| **Usuń** | DELETE | Usuwa element |
| **Przetwórz** | GTD+ | Otwiera pełne opcje |

### Pełne przetwarzanie (GTD+)

Modal przetwarzania oferuje 7 opcji:

| Opcja | Opis |
|-------|------|
| Zrób teraz | Zadanie natychmiastowe (< 2 min) |
| Zaplanuj | Zadanie z datą i kontekstem |
| Deleguj | Przypisz do innego użytkownika |
| Projekt | Utwórz nowy projekt wieloetapowy |
| Referencja | Zapisz w bazie wiedzy |
| Kiedyś/Może | Zamroź na przyszłość |
| Usuń | Wyrzuć bez śladu |

### AI w Źródle

Gdy element trafia do Źródła, AI automatycznie:
- Analizuje treść i kontekst
- Sugeruje do którego strumienia skierować
- Wyciąga potencjalne zadania, terminy, kwoty
- Proponuje powiązania z istniejącymi kontaktami i firmami

Sugestie AI pojawiają się jako podpowiedzi — **zawsze ty decydujesz**.

---

## 4. Strumienie

### Czym jest Strumień?

Strumień to **kontener organizacyjny** dla powiązanych elementów. Może zawierać zadania, projekty, notatki, kontakty. Może mieć dopływy (pod-strumienie) i należeć do strumienia nadrzędnego.

### Wzorce strumieni

Strumienie nie mają sztywnych typów — mają **wzorce użycia**:

| Wzorzec | Charakterystyka | Przykład |
|---------|----------------|---------|
| **Projektowy** | Ma deadline, cel końcowy, zamrozi się po zakończeniu | "Budma 2026", "Redesign strony" |
| **Ciągły** | Bez deadline'u, stała odpowiedzialność | "Zdrowie", "Finanse", "Zespół" |
| **Referencyjny** | Wiedza, dokumenty, materiały do odniesienia | "Baza wiedzy: Podatki" |
| **Zamrożony** | Dowolny strumień wstrzymany na później | "Może kiedyś: kurs React" |

### Stany strumienia

| Stan | Ikona | Opis |
|------|-------|------|
| **Płynie** | 🌊 | Aktywny, wymaga uwagi, widoczny w głównych widokach |
| **Zamrożony** | ❄️ | Wstrzymany, ukryty, czeka na odmrożenie |
| **Zarchiwizowany** | 📦 | Zakończony, tylko do odczytu |

### Hierarchia (dopływy)

Strumienie mogą tworzyć drzewa:

```
🌊 Klient: ABC Okna
   ├── 🌊 Budma 2026 (projekt)
   │   ├── 🌊 Projektowanie
   │   ├── 🌊 Produkcja
   │   └── 🌊 Logistyka
   ├── 🌊 ITM 2025 ❄️ (zamrożony — zakończony)
   └── 🌊 Dokumenty
       ├── 🌊 Umowy
       └── 🌊 Faktury
```

### Tworzenie strumienia

1. Kliknij "+ Nowy strumień"
2. Wprowadź nazwę i opcjonalny opis
3. Wybierz kolor i ikonę
4. Opcjonalnie: przypisz do strumienia nadrzędnego
5. Zapisz

### Zamrażanie i odmrażanie

- **Zamroź** — strumień i wszystkie jego dopływy stają się niewidoczne
- **Odmroź** — strumień wraca do aktywnych, dopływy do wyboru

### Mapa strumieni

Widok "Mapa strumieni" pokazuje hierarchię w formie interaktywnego drzewa.

---

## 5. Zadania

### Lista zadań

Główny widok pokazuje wszystkie twoje zadania z filtrami:

- **Status**: Nowe, W toku, Oczekujące, Ukończone
- **Priorytet**: Niski, Średni, Wysoki, Pilny
- **Strumień**: Filtruj po strumieniu
- **Kontekst**: @computer, @phone, @office, @home, @errands, @online
- **Energia**: Wysoka, Średnia, Niska

### Tworzenie zadania

1. Kliknij "+ Nowe zadanie"
2. Wypełnij tytuł (obowiązkowy)
3. Opcjonalnie: opis, strumień, priorytet, data, szacowany czas
4. Opcjonalnie: kontekst i poziom energii
5. Zapisz

### Konteksty

Kontekst mówi **gdzie/kiedy** możesz wykonać zadanie:

| Kontekst | Kiedy użyć |
|----------|------------|
| `@computer` | Przy komputerze |
| `@phone` | Mając telefon pod ręką |
| `@office` | W biurze |
| `@home` | W domu |
| `@errands` | Przy okazji spraw w mieście |
| `@online` | Online |
| `@waiting` | Czekam na kogoś/coś |
| `@reading` | Do przeczytania |

### Poziomy energii

| Poziom | Kiedy użyć |
|--------|------------|
| **Wysoka** | Wymaga pełnej koncentracji |
| **Średnia** | Standardowe zadania |
| **Niska** | Mogę zrobić będąc zmęczony |
| **Kreatywna** | Wymaga twórczego myślenia |
| **Administracyjna** | Rutynowa praca biurowa |

Day Planner wykorzystuje konteksty i energię do optymalnego planowania.

---

## 6. Projekty

### Czym jest Projekt?

Projekt to przedsięwzięcie wymagające wielu kroków. Ma określony cel i planowane zakończenie.

### Tworzenie projektu

1. Kliknij "+ Nowy projekt"
2. Wprowadź nazwę i opis
3. Ustaw daty: początek i planowane zakończenie
4. Przypisz do strumienia
5. Dodaj pierwsze zadania

### Śledzenie postępu

- Pasek postępu pokazuje % ukończonych zadań
- Status: Planowanie → W toku → Wstrzymany → Ukończony

### AI w projektach

Przycisk "Analiza AI" przy projekcie uruchamia:
- Analizę struktury projektu
- Propozycje rozbicia na podzadania
- Wykrywanie ryzyk i wąskich gardeł
- Rekomendacje priorytetów

---

## 7. Cele Precyzyjne (RZUT)

### Czym jest Cel Precyzyjny?

Cel Precyzyjny to cel zdefiniowany formułą **RZUT**:

| Litera | Element | Pytanie |
|--------|---------|---------|
| **R** | Rezultat | Co konkretnie powstanie? |
| **Z** | Zmierzalność | Po czym poznam, że osiągnąłem? |
| **U** | Ujście | Do kiedy? |
| **T** | Tło | Dlaczego ten cel, nie inny? |

### Przykład

```
❌ Cel mglisty: "Chcę mieć więcej klientów"

✅ Cel Precyzyjny (RZUT):
R: 15 nowych klientów B2B z sektora IT
Z: Zamknięte deale w pipeline CRM
U: Do 31.03.2026 (koniec Q1)
T: Osiągnięcie 200K przychodu w Q1
```

### Tworzenie celu

1. Przejdź do sekcji Cele
2. Kliknij "+ Nowy cel"
3. Wypełnij formularz RZUT:
   - Rezultat — co konkretnie chcesz osiągnąć
   - Zmierzalność — jak mierzyć postęp (wartość bieżąca / docelowa)
   - Ujście — deadline
   - Tło — kontekst i motywacja
4. Przypisz do strumienia
5. Zapisz

### Monitoring celów

Dashboard celów pokazuje:
- Pasek postępu (wartość bieżąca vs docelowa)
- Dni do deadline'u
- Status: Na dobrej drodze / Wymaga uwagi / Zagrożony

---

## 8. CRM — Firmy, Kontakty, Transakcje

### Jak CRM się buduje

W Sorto CRM encje (firmy, kontakty, transakcje) mogą powstawać na dwa sposoby:

1. **Ręcznie** — tworzysz sam przez formularze
2. **Z AI** — system wyciąga dane z emaili i proponuje utworzenie (zawsze z twoim zatwierdzeniem)

### 8.1 Firmy

#### Dodawanie firmy

1. CRM → Firmy → "+ Nowa firma"
2. Wypełnij: nazwa, branża, wielkość, dane kontaktowe
3. Zapisz

#### Statusy firm

| Status | Opis |
|--------|------|
| Prospect | Potencjalny klient |
| Klient | Aktywny klient |
| Partner | Partner biznesowy |
| Nieaktywny | Uśpiona relacja |

### 8.2 Kontakty

#### Dodawanie kontaktu

1. CRM → Kontakty → "+ Nowy kontakt"
2. Wypełnij dane osobowe
3. Przypisz do firmy (opcjonalnie)
4. Zapisz

### 8.3 Pipeline sprzedaży

Pipeline to wizualizacja procesu sprzedaży w kolumnach:

```
Lead → Kwalifikacja → Oferta → Negocjacje → Wygrany/Przegrany
```

Przeciągnij kartę transakcji między kolumnami.

### 8.4 Transakcje (Deals)

#### Tworzenie transakcji

1. CRM → Transakcje → "+ Nowa transakcja"
2. Wypełnij: nazwa, firma, wartość, prawdopodobieństwo, planowana data zamknięcia
3. Zapisz

### 8.5 Encje z AI

Gdy AI analizuje emaile biznesowe, może zaproponować:
- Nowy kontakt (wyciągnięty z podpisu emaila)
- Nową firmę (rozpoznana z domeny nadawcy)
- Nową transakcję (wykryty wątek sprzedażowy)
- Nowe zadanie (wyciągnięty deadline lub action item)

Propozycje trafiają do zakładki **Sugestie AI** w konfiguracji AI. Dla każdej propozycji możesz:
- **Zaakceptuj** — encja zostanie utworzona w CRM
- **Odrzuć** — propozycja znika

---

## 9. Smart Mailboxes

### Czym są Smart Mailboxes?

Smart Mailboxes to inteligentne skrzynki pocztowe z zaawansowanym filtrowaniem, AI analizą i integracją ze strumieniami.

### Główne funkcje

| Funkcja | Opis |
|---------|------|
| **Zakładki** | Przełączaj między skrzynkami (drag & drop kolejności) |
| **9 filtrów** | Szukaj, kanał, data, priorytet, status, nadawca, załączniki, przeczytane, pilność |
| **Podgląd** | Rozwiń wiadomość aby zobaczyć treść (HTML/TXT) |
| **Akcje strumieni** | Źródło, Zrób teraz, Zaplanuj, Przetwórz |
| **Voice TTS** | Czytanie wiadomości na głos |

### Akcje na wiadomościach

Po rozwinięciu wiadomości:

- **Odpowiedz** — formularz odpowiedzi
- **Przekaż** — prześlij do wielu odbiorców
- **Archiwizuj** — przenieś do archiwum
- **Usuń** — skasuj z potwierdzeniem
- **Uruchom reguły** — manualne przetworzenie regułami AI
- **Przeczytaj** — TTS czyta treść na głos

### AI w mailboxach

Emaile biznesowe przechodzą przez **dwuetapowy pipeline AI**:

1. **Triage** — szybka klasyfikacja (12 kategorii: zapytanie ofertowe, zlecenie, faktura, reklamacja...)
2. **Analiza specjalistyczna** — szczegółowa ekstrakcja danych per kategoria

Wynik: propozycje encji CRM (kontakty, firmy, transakcje, zadania) w zakładce Sugestie AI.

---

## 10. AI — Inteligentny asystent

### Filozofia AI w Sorto

```
AI SUGERUJE              CZŁOWIEK DECYDUJE
────────────             ──────────────────
Analizuje                Zatwierdza lub koryguje
Kategoryzuje             Podejmuje ostateczną decyzję
Proponuje                Zachowuje kontrolę
Przypomina              Buduje relacje
```

**AI to asystent, nie szef.** Każda akcja AI ma: [Zatwierdź] [Koryguj] [Odrzuć]

### 3 poziomy autonomii

| Poziom | AI robi | Ty robisz |
|--------|---------|-----------|
| **Sugestia** | Analizuje, proponuje | Zatwierdzasz każdą akcję |
| **Asystent** | Wykonuje po zatwierdzeniu | Zatwierdzasz zbiorczo |
| **Autopilot** | Wykonuje wg reguł | Monitorujesz, korygujesz |

Domyślnie system działa na poziomie 1-2. Autopilot wymaga świadomego włączenia.

### Co AI robi w Sorto

| Obszar | Co AI robi |
|--------|-----------|
| **Źródło** | Sugeruje strumień, wyciąga zadania i terminy |
| **Email** | Klasyfikuje, wyciąga firmy/kontakty/kwoty, proponuje encje CRM |
| **Projekty** | Analizuje strukturę, rozbija na podzadania |
| **Day Planner** | Sugeruje optymalny plan dnia wg energii |
| **Strumienie** | Proponuje routing nowych elementów |

### Konfiguracja AI

**Narzędzia → AI Config:**
- Dodawanie providerów AI (OpenAI, Anthropic, Qwen)
- Rejestracja modeli
- Przypisanie modeli do operacji (klasyfikacja emaili, analiza Flow, konwersacje)

**Narzędzia → Reguły AI:**
- Reguły automatyzacji (warunki + akcje + model)
- Szablony promptów
- Sugestie AI (accept/reject propozycji)
- Listy domen (whitelist/blacklist)

### Sugestie AI (Human-in-the-Loop)

Gdy AI pipeline przetworzy email biznesowy:
1. Wyniki trafiają do **Sugestie AI** (nie bezpośrednio do CRM)
2. Widzisz podgląd: jakie encje AI chce utworzyć
3. Dla każdej propozycji: **Akceptuj** lub **Odrzuć**
4. Zaakceptowane encje tworzą się w CRM

To gwarantuje że AI nigdy nie modyfikuje danych bez twojej zgody.

---

## 11. Day Planner

### Czym jest Day Planner?

Inteligentny planer dnia. Pomaga rozplanować czas z uwzględnieniem poziomu energii, kontekstów i priorytetów.

### Bloki czasowe

Dzień podzielony jest na bloki, każdy z poziomem energii:

| Poziom energii | Najlepsze dla |
|----------------|---------------|
| **Wysoka** | Złożone zadania, deep work |
| **Średnia** | Spotkania, standardowe zadania |
| **Niska** | Rutyna, administracja |
| **Kreatywna** | Burze mózgów, planowanie |
| **Administracyjna** | Emaile, dokumenty |

### Tryby Focus

| Tryb | Czas | Opis |
|------|------|------|
| Deep Work | 90-120 min | Głęboka koncentracja |
| Quick Tasks | 15-30 min | Szybkie zadania |
| Creative Flow | 60-90 min | Praca kreatywna |
| Admin Focus | 30-45 min | Administracja |

### Planowanie dnia

1. Otwórz Day Planner
2. Przejrzyj sugerowane bloki i zadania
3. AI przypisuje zadania do bloków wg energii i kontekstu
4. Koryguj jeśli potrzeba
5. Pracuj wg planu

### Szablony tygodniowe

Twórz szablony dla typowych dni i stosuj jednym kliknięciem.

---

## 12. Przeglądy

### Przegląd tygodniowy (30-60 min)

Raz w tygodniu (piątek lub niedziela) sprawdź:

1. **Źródło** — czy puste? Przetworz zaległości
2. **Płynące strumienie** — czy postępują? Co zablokowane?
3. **Zamrożone strumienie** — coś odmrozić? Coś usunąć?
4. **Struktura** — czy hierarchia strumieni ma sens?
5. **Cele** — czy zbliżasz się? Wymaga korekty?

AI przygotowuje raport tygodniowy: co ukończono, co wymaga uwagi, sugestie zamrożenia/odmrożenia.

### Przegląd miesięczny

Głębszy przegląd:
- Analiza osiągnięć vs cele RZUT
- Przegląd aktywnych strumieni
- Planowanie następnego miesiąca
- Optymalizacja reguł AI

---

## 13. Baza Wiedzy

### Dokumenty

1. Baza wiedzy → "+ Nowy dokument"
2. Wybierz typ (10 typów: notatka, artykuł, przewodnik, FAQ, szablon...)
3. Napisz treść (Markdown)
4. Dodaj tagi i przypisz do folderu
5. Zapisz

### Wiki

1. Baza wiedzy → "+ Nowa strona wiki"
2. Wybierz kategorię (8 kategorii)
3. Napisz treść
4. Opcja "publiczny dostęp" — strona bez logowania

### Wyszukiwanie semantyczne

Wyszukiwarka RAG pozwala znajdować dokumenty **po znaczeniu**, nie tylko po słowach kluczowych. Wpisz pytanie w naturalnym języku, np. "procedura obsługi reklamacji".

---

## 14. Reguły i automatyzacje

### Reguły AI

Narzędzia → Reguły AI → zakładka "Reguły"

Reguła = JEŚLI warunek → TO akcja

#### Tworzenie reguły

1. Kliknij "+ Nowa reguła"
2. Zdefiniuj wyzwalacz (nowy email, nowy kontakt, harmonogram)
3. Ustaw warunki (temat zawiera X, nadawca z domeny Y)
4. Określ akcje (utwórz zadanie, zmień priorytet, wyślij powiadomienie)
5. Wybierz model AI (jeśli reguła wymaga analizy)
6. Aktywuj

#### Przykłady reguł

- "Jeśli email od @vip-client.com → priorytet PILNY + powiadomienie"
- "Jeśli email biznesowy → uruchom pipeline AI → propozycje encji CRM"
- "Codziennie o 9:00 → poranny briefing"

### Rules Manager

Narzędzia → Rules Manager — zunifikowany interfejs dla wszystkich typów reguł:

| Typ | Opis |
|-----|------|
| Processing | Automatyczne przetwarzanie wiadomości |
| Email Filter | Sortowanie emaili |
| Auto-reply | Automatyczne odpowiedzi |
| AI Rule | Analiza AI i akcje |
| Smart Mailbox | Reguły dla skrzynek |
| Workflow | Złożone przepływy |

---

## 15. Konfiguracja

### Ustawienia użytkownika

Kliknij avatar → Ustawienia:
- Profil, hasło, powiadomienia, motyw

### Ustawienia organizacji (admin)

- Użytkownicy — zarządzanie zespołem
- Role — OWNER, ADMIN, MANAGER, MEMBER
- Integracje — połączenia z zewnętrznymi usługami

### Kanały komunikacji

Komunikacja → Kanały:
1. "+ Nowy kanał" → Email (IMAP/SMTP)
2. Wprowadź dane dostępowe
3. Przetestuj połączenie
4. Opcje: auto-processing, default stream
5. Zapisz

### Konfiguracja AI

Narzędzia → AI Config:
1. Dodaj providera (API key)
2. Zarejestruj modele
3. Przypisz modele do operacji (Akcje AI)

---

## 16. FAQ

### Ogólne

**P: Jak zacząć?**
O: Podłącz email, przetworz Źródło, utwórz 3-5 strumieni. Nie konfiguruj więcej — system sam zaproponuje rozbudowę.

**P: Muszę znać jakąś metodologię?**
O: Nie. System jest intuicyjny: Źródło → Strumienie → Cele. Reszta wyłania się z pracy.

**P: Czy AI ma dostęp do moich danych?**
O: AI działa na serwerze Sorto. Dane wysyłane są do providerów AI (OpenAI, Anthropic) w celu analizy, ale nie są przechowywane przez nich po przetworzeniu.

**P: Czy AI może zrobić coś bez mojej zgody?**
O: Nie. Domyślnie każda propozycja AI wymaga zatwierdzenia. Autopilot (automatyczne wykonywanie) wymaga świadomego włączenia dla konkretnych reguł.

### Strumienie

**P: Ile strumieni powinienem mieć?**
O: Na start 3-5. System sam zaproponuje więcej gdy zobaczy wzorce w twoich danych.

**P: Co się stanie gdy zamrożę strumień?**
O: Strumień i wszystkie jego dopływy stają się niewidoczne. Nic nie jest usuwane — odmrożenie przywraca wszystko.

**P: Czym różni się strumień od projektu?**
O: Strumień to kontener organizacyjny (np. "Klient ABC"). Projekt to konkretne przedsięwzięcie z końcem (np. "Budma 2026"). Projekt zwykle żyje wewnątrz strumienia.

### AI i automatyzacja

**P: Skąd AI wie do jakiego strumienia skierować email?**
O: AI analizuje treść, nadawcę, temat i porównuje z istniejącymi strumieniami (wyszukiwanie semantyczne). Uczy się z twoich korekt.

**P: Co to jest dwuetapowy triage?**
O: Szybka klasyfikacja emaila (12 kategorii) → szczegółowa analiza per kategoria. Dzięki temu AI lepiej wyciąga dane z różnych typów emaili (faktura vs zapytanie vs reklamacja).

**P: Jak wyłączyć AI?**
O: Narzędzia → AI Config → wyłącz poszczególne operacje lub usuń providerów.

### CRM

**P: Czy muszę ręcznie wpisywać kontakty?**
O: Nie. AI wyciąga kontakty i firmy z emaili i proponuje ich utworzenie. Ty tylko zatwierdzasz.

**P: Czym jest RZUT?**
O: System celów: **R**ezultat (co), **Z**mierzalność (jak mierzyć), **U**jście (do kiedy), **T**ło (dlaczego). Zamiast mglistych "chcę więcej klientów" → konkretne "15 klientów B2B do 31.03 bo 200K przychodu".

---

**Sorto Streams** — CRM który wyrasta z twojej pracy.

*Wersja manuala: 2.0*
*Ostatnia aktualizacja: Luty 2026*
