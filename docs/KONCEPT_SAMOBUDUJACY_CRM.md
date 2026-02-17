# CRM który wyrasta sam
## Koncepcja samo-wdrażającego się systemu Sorto Streams

---

## Zasada fundamentalna

> **CRM nie jest czymś co konfigurujesz. CRM jest tym co wyłania się z twojej pracy.**

Każda informacja która do ciebie dociera — email, notatka głosowa, zdjęcie wizytówki, spotkanie, faktura, pomysł pod prysznicem — to okruch wiedzy o twoim świecie biznesowym. System zbiera te okruchy i składa z nich obraz: kto jest twoim klientem, nad czym pracujesz, co jest pilne, jak wyglądają twoje procesy.

---

## Jak każde źródło buduje CRM

### Email
**Co AI wyciąga:** firmy, kontakty, kwoty, terminy, wątki sprzedażowe, wzorce komunikacji
**Co się buduje:** strumienie klientów, pipeline, historia relacji, zadania z deadlinami

### Notatka głosowa
**Co AI wyciąga:** action items, wspomniane osoby i firmy, decyzje, kontekst emocjonalny
**Co się buduje:** zadania, powiązania między kontaktami, inteligencja kliencka (co lubi, czego nie lubi)

**Przykład:**
```
Notatka: "Rozmawiałem z Kowalskim z ABC Okna, chcą większe
    stoisko na Budmie, budżet do 60 tysięcy, muszę wysłać
    wizualizacje do piątku"

AI wyciąga:
   → Kontakt: Kowalski → firma ABC Okna
   → Event: Budma (targi)
   → Deal: aktualizacja wartości → 60K
   → Zadanie: wysłać wizualizacje, deadline: piątek
   → Intel: klient chce większe stoisko (trend wzrostowy)
```

### Zdjęcie wizytówki
**Co AI wyciąga:** imię, nazwisko, stanowisko, firma, telefon, email, adres
**Co się buduje:** kontakt, powiązanie z firmą, jeśli firma nowa → propozycja utworzenia

**Kontekst jest królem:**
```
Wizytówka zeskanowana podczas Budma 2026

AI wie:
   → Wydarzenie: Budma 2026 (bo data + lokalizacja telefonu)
   → Kontakt: nowy, powiązany z eventem
   → Firma: sprawdza czy istnieje w CRM
   → Sugestia: "Spotkaliście się na Budma. Follow-up za 3 dni?"
```

### Spotkanie / Transkrypcja
**Co AI wyciąga:** uczestnicy, decyzje, action items, obiekcje, next steps, sentyment
**Co się buduje:** notatki ze spotkania, zadania, aktualizacja health score relacji, stakeholder map

```
Transkrypcja spotkania z ABC Okna (45 min)

AI wyciąga:
   → Uczestnicy: Jan Kowalski (decydent), Anna Nowak (PM)
   → Decyzja: akceptacja koncepcji stoiska wariant B
   → Action items:
     - Wysłać kosztorys (my, do środy)
     - Przesłać logo w wektorach (oni, do poniedziałku)
   → Obiekcja: "cena za transport była za wysoka ostatnio"
   → Intel: Anna to faktyczny decydent operacyjny
   → Sentyment: pozytywny, klient zadowolony

AI buduje:
   → DealStakeholder: Anna → rola INFLUENCER → upgrade?
   → WaitingFor: logo od ABC Okna, deadline poniedziałek
   → ClientIntelligence: wrażliwość cenowa na transport
   → HealthScore: +5 (pozytywne spotkanie)
```

### Faktura / Dokument
**Co AI wyciąga:** kwoty, kontrahent, przedmiot, daty, numery
**Co się buduje:** historia zamówień, ClientProduct, aktualizacja wartości klienta

### Pomysł / Notatka
**Co AI wyciąga:** temat, powiązania z istniejącymi strumieniami, potencjalne zadania
**Co się buduje:** element w Źródle z sugestią strumienia, ewentualnie nowy strumień

### Link / Artykuł
**Co AI wyciąga:** temat, tagi, powiązania semantyczne
**Co się buduje:** baza wiedzy, powiązania z projektami i klientami

### Wydarzenie (targi, konferencja)
**Co AI wyciąga:** daty, miejsce, lista wystawców/uczestników, budżet
**Co się buduje:** Event z powiązaniami → firmy → kontakty → deale → zadania

---

## Trzy fazy wyłaniania się

### Faza 1: Obserwacja (dzień 1-7)

System tylko słucha i proponuje. Zero konfiguracji od użytkownika.

```
DZIEŃ 1: Podłączasz email + instalujesz apkę (quick capture)
         System skanuje 30 dni wstecz

DZIEŃ 2: "Znalazłem 23 firmy w twoich emailach.
          Oto top 5 z którymi komunikujesz się najczęściej.
          Chcesz zobaczyć?"

          [Pokaż] [Nie teraz]

DZIEŃ 3: Nagrywasz pierwszą notatkę głosową po spotkaniu.
         System rozpoznaje wspomnianą firmę z emaili.
         Łączy kontekst.

DZIEŃ 5: "Widzę że ABC Okna to twój najaktywniejszy kontakt.
          Masz z nimi 3 otwarte wątki.
          Chcesz żebym utworzył strumień dla nich?"

          [Tak, utwórz] [Pokaż wątki] [Nie]
```

**Zasada:** w tej fazie AI NIE tworzy nic samo. Tylko obserwuje, analizuje, proponuje.

### Faza 2: Wzorce (tydzień 2-4)

System zaczyna rozpoznawać wzorce i proponować struktury.

```
"Widzę powtarzający się cykl w twoich projektach:
 zapytanie → wizualizacja → akceptacja → produkcja → montaż

 Czy tak wygląda twój typowy proces?"

 [Tak, dokładnie] [Prawie, chcę zmienić] [Nie]

 → Jeśli tak: "Utworzyłem pipeline z tymi etapami.
   Twoje 3 aktywne projekty umieściłem w odpowiednich etapach."
```

### Faza 3: Autopilot (miesiąc 2+)

System zna wzorce i obsługuje rutynę sam.

```
Nowy email od znanego klienta
   → Automatycznie w strumień ABC Okna → Budma 2026
   → Zadanie wyciągnięte: "kosztorys do środy"
   → Follow-up ustawiony
   → User widzi tylko potwierdzenie w briefingu porannym
```

---

## Kluczowe elementy techniczne (co już masz w schemacie)

| Element | Model w Prisma | Status |
|---------|---------------|--------|
| Wieloźródłowy inbox | `InboxItem` + `FlowElementType` (12 typów) | Gotowe |
| AI analiza i routing | `aiAnalysis`, `suggestedStreams`, `suggestedAction` | Gotowe |
| Uczenie się z decyzji | `flow_learned_patterns` | Gotowe |
| Reguły automatyzacji | `flow_automation_rules` | Gotowe |
| Historia przetwarzania | `flow_processing_history` | Gotowe |
| Konwersacje dialogowe | `flow_conversations` | Gotowe |
| CRM: firmy, kontakty, deale | `Company`, `Contact`, `Deal` | Gotowe |
| Health score relacji | `RelationshipHealth` | Gotowe |
| Inteligencja kliencka | `ClientIntelligence` | Gotowe |
| Stakeholder map | `DealStakeholder` | Gotowe |
| Eventy / targi | `Event`, `EventCompany`, `EventContact` | Gotowe |
| Uniwersalne powiązania | `EntityLink` | Gotowe |
| Szablony branżowe | `IndustryTemplate` | Gotowe |

### Czego brakuje

| Element | Opis | Priorytet |
|---------|------|-----------|
| **Retroaktywny skan** | Analiza historii emaila (30 dni wstecz) przy onboardingu | Krytyczny |
| **Silnik wyłaniania struktur** | Algorytm który z chmury danych proponuje: pipeline, strumienie, wzorce | Krytyczny |
| **Progresywny onboarding** | Sekwencja pytań kontekstowych zamiast formularzy | Krytyczny |
| **Multi-source fusion** | Łączenie informacji z różnych źródeł o tym samym temacie | Ważny |
| **Confidence scoring** | Skumulowana pewność: 3 źródła mówią o ABC Okna = wysoki confidence | Ważny |
| **Promptery per typ źródła** | Specjalizowane prompty ekstrakcji dla każdego FlowElementType | Ważny |

---

## Filozofia: progresywne odkrywanie

Tradycyjny CRM wymaga od ciebie opisu twojego biznesu ZANIM zaczniesz pracować. Sorto działa odwrotnie:

```
TRADYCYJNY CRM:
Konfiguruj → Opisz procesy → Zdefiniuj pipeline → Importuj dane → Pracuj
(2-6 tygodni zanim zobaczysz wartość)

SORTO STREAMS:
Pracuj normalnie → System obserwuje → System proponuje → Zatwierdzaj
(wartość od pierwszego dnia)
```

### Progresywne pytania zamiast formularzy

```
Dzień 1:  Nic nie pyta. Tylko zbiera dane.
Dzień 3:  "Widzę dużo emaili o targach. Budujesz stoiska?"
Dzień 7:  "Twoi klienci wracają co rok. Chcesz śledzić historię per targi?"
Dzień 14: "Mam gotowy pipeline pasujący do twoich procesów. Sprawdzisz?"
Dzień 30: "Twoje reguły routingu działają z 94% trafnością. Włączyć autopilot?"
```

---

## Mantra

> **Nie pytaj użytkownika kim jest. Obserwuj co robi i powiedz mu kim jest.**

---

*Sorto Streams — CRM który wyrasta z twojej pracy*
*Wersja koncepcyjna: 2026-02-17*
