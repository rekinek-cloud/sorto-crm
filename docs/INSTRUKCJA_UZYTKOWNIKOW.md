# INSTRUKCJA DLA UZYTKOWNIKOW - SORTO-CRM

**Data utworzenia**: 2026-02-02
**Wersja aplikacji**: 1.0

---

## 1. WPROWADZENIE

### 1.1 Czym jest Sorto-CRM?

Sorto-CRM to zaawansowana aplikacja laczaca:
- **CRM** - zarzadzanie kontaktami, firmami i transakcjami
- **GTD** - system produktywnosci Getting Things Done
- **AI** - inteligentne automatyzacje i asystent

### 1.2 Dostep do aplikacji

| Srodowisko | URL |
|------------|-----|
| Produkcja | https://crm.sorto.ai |
| Development | https://crm.dev.sorto.ai |

### 1.3 Wymagania

- Przegladarka: Chrome, Firefox, Safari, Edge (najnowsze wersje)
- Polaczenie internetowe
- Konto uzytkownika

---

## 2. PIERWSZE LOGOWANIE

### 2.1 Rejestracja

1. Wejdz na strone logowania
2. Kliknij "Zarejestruj sie"
3. Wypelnij formularz:
   - Email (sluzy jako login)
   - Haslo (min. 8 znakow)
   - Imie i nazwisko
4. Potwierdz email klikajac link w wiadomosci

### 2.2 Logowanie

1. Wpisz email i haslo
2. Kliknij "Zaloguj"
3. (Opcjonalnie) Zaznacz "Zapamietaj mnie"

### 2.3 Reset hasla

1. Kliknij "Zapomnialem hasla"
2. Wpisz email
3. Sprawdz skrzynke i kliknij link
4. Ustaw nowe haslo

---

## 3. INTERFEJS GLOWNY

### 3.1 Nawigacja

```
┌─────────────────────────────────────────────┐
│  [Logo]  Szukaj...          [User] [?]     │
├─────────────┬───────────────────────────────┤
│             │                               │
│  Dashboard  │     GLOWNY OBSZAR ROBOCZY    │
│  CRM        │                               │
│  GTD        │                               │
│  AI         │                               │
│  Kalendarz  │                               │
│  Raporty    │                               │
│             │                               │
└─────────────┴───────────────────────────────┘
```

### 3.2 Menu glowne

| Sekcja | Opis |
|--------|------|
| Dashboard | Przeglad aktywnosci i statystyk |
| CRM | Kontakty, firmy, transakcje |
| GTD | Zadania, projekty, skrzynka odbiorcza |
| AI | Asystent AI, automatyzacje |
| Kalendarz | Spotkania i planowanie |
| Raporty | Analizy i wykresy |

---

## 4. MODUL CRM

### 4.1 Kontakty

**Dodawanie kontaktu:**
1. Przejdz do CRM > Kontakty
2. Kliknij "+ Nowy kontakt"
3. Wypelnij dane:
   - Imie i nazwisko (wymagane)
   - Email
   - Telefon
   - Firma
   - Notatki
4. Kliknij "Zapisz"

**Zarzadzanie kontaktami:**
- Wyszukiwanie: Uzyj pola szukaj
- Filtrowanie: Kliknij ikone filtra
- Sortowanie: Kliknij naglowek kolumny
- Eksport: Kliknij "Eksportuj" (CSV/Excel)

### 4.2 Firmy

**Dodawanie firmy:**
1. CRM > Firmy > "+ Nowa firma"
2. Wypelnij dane:
   - Nazwa firmy (wymagana)
   - NIP
   - Adres
   - Branza
3. Zapisz

**Funkcje:**
- Przypisywanie kontaktow do firm
- Historia aktywnosci
- Dokumenty i notatki

### 4.3 Transakcje (Deals)

**Pipeline sprzedazowy:**
```
[Lead] -> [Kwalifikacja] -> [Propozycja] -> [Negocjacje] -> [Wygrana/Przegrana]
```

**Tworzenie transakcji:**
1. CRM > Transakcje > "+ Nowa"
2. Podaj:
   - Nazwe transakcji
   - Wartosc
   - Firme/Kontakt
   - Etap pipeline
   - Prawdopodobienstwo
3. Zapisz

**Widok Kanban:**
- Przeciagaj karty miedzy kolumnami
- Kliknij karte aby zobaczyc szczegoly

---

## 5. MODUL GTD

### 5.1 Filozofia GTD

GTD (Getting Things Done) to metodologia produktywnosci:

1. **Zbieraj** - wszystkie zadania do Inbox
2. **Przetwarzaj** - decyduj co z kazdym elementem
3. **Organizuj** - przypisuj do projektow/kontekstow
4. **Przeglądaj** - regularnie sprawdzaj liste
5. **Wykonuj** - rob zadania

### 5.2 Inbox (Skrzynka odbiorcza)

Miejsce na wszystkie nowe pomysly i zadania.

**Dodawanie do Inbox:**
1. GTD > Inbox > "+ Dodaj"
2. Wpisz tresc (np. "Zadzwonic do klienta X")
3. Enter lub kliknij "Dodaj"

**Szybkie dodawanie:**
- Skrot klawiszowy: `Ctrl+Shift+I`
- Quick capture z dowolnego miejsca

### 5.3 Przetwarzanie Inbox

Dla kazdego elementu zdecyduj:

| Pytanie | Akcja |
|---------|-------|
| Czy wymaga akcji? | Nie -> Usun lub Archiwum |
| Zajmie < 2 min? | Tak -> Zrob od razu |
| Czy to projekt? | Tak -> Utworz projekt |
| Kto powinien? | Inny -> Deleguj |
| Kiedy? | Pozniej -> Zaplanuj |

### 5.4 Zadania

**Tworzenie zadania:**
1. GTD > Zadania > "+ Nowe"
2. Wypelnij:
   - Tytul (wymagany)
   - Opis
   - Projekt
   - Kontekst (@telefon, @komputer, @biuro)
   - Termin
   - Priorytet
3. Zapisz

**Konteksty:**
- `@telefon` - do wykonania przez telefon
- `@komputer` - wymaga komputera
- `@biuro` - w biurze
- `@dom` - w domu
- `@zakupy` - podczas zakupow

### 5.5 Projekty

Projekt = kazde zadanie wymagajace wiecej niz 1 akcji.

**Tworzenie projektu:**
1. GTD > Projekty > "+ Nowy"
2. Podaj nazwe i opis
3. Dodaj zadania do projektu

### 5.6 Horyzonty

| Horyzont | Zakres | Przyklad |
|----------|--------|----------|
| 0 | Biezace akcje | Zadzwonic do X |
| 1 | Projekty | Wdrozenie CRM |
| 2 | Obszary odpowiedzialnosci | Sprzedaz, Marketing |
| 3 | Cele 1-2 lata | Zwiekszenie sprzedazy o 20% |
| 4 | Wizja 3-5 lat | Ekspansja na nowe rynki |
| 5 | Zyciowa misja | Byc najlepszym w branzy |

### 5.7 Przeglad tygodniowy

1. Oprozniij Inbox
2. Przejrzyj wszystkie projekty
3. Sprawdz kalendarz
4. Zaktualizuj listy
5. Zaplanuj nastepny tydzien

---

## 6. MODUL AI

### 6.1 Asystent AI

**Uzycie:**
1. Kliknij ikone AI (prawy dolny rog)
2. Wpisz pytanie lub polecenie
3. AI odpowie

**Przyklady polecen:**
- "Podsumuj moje zadania na dzis"
- "Znajdz kontakty z firmy X"
- "Napisz email do klienta Y"
- "Zaplanuj spotkanie na piatek"

### 6.2 Automatyzacje

Reguly automatyczne wykonuja akcje za Ciebie.

**Przyklady regul:**
- Nowy email od VIP -> Utworz zadanie
- Transakcja wygrana -> Wyslij email dziekujacy
- Termin zadania jutro -> Przypomnij

**Tworzenie reguly:**
1. AI > Automatyzacje > "+ Nowa"
2. Wybierz wyzwalacz (trigger)
3. Ustaw warunki
4. Wybierz akcje
5. Aktywuj

### 6.3 Smart Mailboxes

Inteligentne foldery email:
- Automatyczne kategoryzowanie
- Priorytetyzacja
- Sugestie odpowiedzi

---

## 7. KALENDARZ

### 7.1 Widoki

- **Dzien** - szczegolowy widok dnia
- **Tydzien** - przeglad tygodnia
- **Miesiac** - widok miesieczny

### 7.2 Tworzenie wydarzen

1. Kliknij w kalendarz lub "+ Nowe"
2. Wypelnij:
   - Tytul
   - Data i godzina
   - Uczestniczy
   - Lokalizacja
   - Opis
3. Zapisz

### 7.3 Integracje

- Google Calendar
- Outlook
- Apple Calendar

---

## 8. WYSZUKIWANIE

### 8.1 Globalne wyszukiwanie

1. Kliknij pole szukaj (lub `Ctrl+K`)
2. Wpisz fraze
3. Wyniki z wszystkich modulow

### 8.2 Filtry zaawansowane

- Typ: kontakt, firma, zadanie...
- Data: utworzenia, modyfikacji
- Status: aktywny, zakonczony
- Przypisany: do mnie, do zespolu

---

## 9. USTAWIENIA

### 9.1 Profil

- Zmiana danych osobowych
- Zmiana hasla
- Zdjecie profilowe
- Jezyk interfejsu

### 9.2 Powiadomienia

- Email: wlacz/wylacz typy powiadomien
- Push: powiadomienia przegladarki
- Dzwieki: alerty dzwiekowe

### 9.3 Integracje

- Polaczenie z email (IMAP/SMTP)
- Polaczenie z Slack
- API keys dla zewnetrznych aplikacji

---

## 10. SKROTY KLAWISZOWE

| Skrot | Akcja |
|-------|-------|
| `Ctrl+K` | Globalne wyszukiwanie |
| `Ctrl+Shift+I` | Quick capture do Inbox |
| `Ctrl+N` | Nowy element |
| `Ctrl+S` | Zapisz |
| `Esc` | Zamknij modal |
| `?` | Pomoc |

---

## 11. APLIKACJA MOBILNA

### 11.1 Dostep

- Otworz strone w przegladarce mobilnej
- "Dodaj do ekranu glownego" (PWA)

### 11.2 Funkcje mobilne

- Pelny dostep do CRM i GTD
- Quick capture
- Powiadomienia push
- Tryb offline (ograniczony)

---

## 12. FAQ - CZESTE PYTANIA

### Jak zmienic jezyk?

Ustawienia > Profil > Jezyk

### Jak eksportowac dane?

Kazdy modul ma przycisk "Eksportuj" (CSV/Excel)

### Jak usunac konto?

Ustawienia > Konto > Usun konto (nieodwracalne!)

### Nie moge sie zalogowac?

1. Sprawdz poprawnosc email
2. Zresetuj haslo
3. Sprawdz czy konto jest zweryfikowane
4. Skontaktuj sie z supportem

### Jak dziala AI?

AI analizuje Twoje dane i uczy sie Twoich nawykow aby dawac lepsze sugestie. Wszystkie dane sa bezpieczne i prywatne.

---

## 13. WSPARCIE

### Kontakt

- Email: support@sorto.ai
- Chat: Ikona pomocy w aplikacji
- Dokumentacja: https://docs.sorto.ai

### Zglaszanie bledow

1. Kliknij "?" > "Zglos problem"
2. Opisz problem
3. Dolacz zrzut ekranu (opcjonalnie)
4. Wyslij

---

## 14. SLOWNICZEK

| Termin | Definicja |
|--------|-----------|
| **CRM** | Customer Relationship Management - zarzadzanie relacjami z klientami |
| **GTD** | Getting Things Done - metodologia produktywnosci |
| **Inbox** | Skrzynka odbiorcza dla nowych zadan |
| **Pipeline** | Etapy procesu sprzedazy |
| **Kontekst** | Okolicznosci wykonania zadania (@telefon, @biuro) |
| **Horyzont** | Poziom planowania (od akcji do wizji zyciowej) |
| **Deal** | Transakcja sprzedazowa |
| **Lead** | Potencjalny klient |

---

*Ostatnia aktualizacja: 2026-02-02*
*Wersja dokumentu: 1.0*
