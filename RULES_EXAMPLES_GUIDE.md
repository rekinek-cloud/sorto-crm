# 🎯 Rules Manager - Przewodnik przykładów wszystkich przypadków użycia

## Spis treści
1. [Przegląd przykładów](#przegląd-przykładów)
2. [PROCESSING - Przetwarzanie wiadomości](#processing---przetwarzanie-wiadomości)
3. [EMAIL_FILTER - Filtrowanie emaili](#email_filter---filtrowanie-emaili)
4. [AUTO_REPLY - Automatyczne odpowiedzi](#auto_reply---automatyczne-odpowiedzi)
5. [AI_RULE - Reguły sztucznej inteligencji](#ai_rule---reguły-sztucznej-inteligencji)
6. [SMART_MAILBOX - Inteligentne skrzynki](#smart_mailbox---inteligentne-skrzynki)
7. [WORKFLOW - Przepływy pracy](#workflow---przepływy-pracy)
8. [Wszystkie typy wyzwalaczy](#wszystkie-typy-wyzwalaczy)
9. [Zaawansowane konfiguracje](#zaawansowane-konfiguracje)
10. [Porównanie i najlepsze praktyki](#porównanie-i-najlepsze-praktyki)

---

## Przegląd przykładów

W systemie zostało utworzonych **9 przykładowych reguł** ilustrujących wszystkie możliwe przypadki użycia:

| Lp. | Nazwa | Typ | Wyzwalacz | Priorytet | Zastosowanie |
|-----|-------|-----|-----------|-----------|--------------|
| 1 | 🔄 Auto-zadania z pilnych emaili | PROCESSING | EVENT_BASED | 95 | Natychmiastowe zadania |
| 2 | 📧 Filtr newsletterów i spam | EMAIL_FILTER | EVENT_BASED | 10 | Czyszczenie skrzynki |
| 3 | 🤖 Potwierdzenie zapytań ofertowych | AUTO_REPLY | EVENT_BASED | 80 | Obsługa klienta |
| 4 | 🧠 Analiza sentymentu reklamacji | AI_RULE | EVENT_BASED | 70 | Analiza AI |
| 5 | 📮 VIP Klienci - Smart Mailbox | SMART_MAILBOX | EVENT_BASED | 90 | Priorytetyzacja |
| 6 | 🔄 Workflow nowego klienta | WORKFLOW | MANUAL | 85 | Onboarding |
| 7 | ⏰ Raport tygodniowy | WORKFLOW | SCHEDULED | 50 | Automatyzacja raportów |
| 8 | 🌐 Webhook integracja z CRM | WORKFLOW | WEBHOOK | 75 | Integracje zewnętrzne |
| 9 | 📊 Analiza masowa | AI_RULE | API_CALL | 30 | Przetwarzanie programistyczne |

---

## PROCESSING - Przetwarzanie wiadomości

### 🔄 Auto-zadania z pilnych emaili

**ID**: `#1` | **Priorytet**: 95 (najwyższy) | **Wyzwalacz**: EVENT_BASED

#### 🎯 Cel reguły:
Automatyczne tworzenie zadań o wysokim priorytecie dla emaili oznaczonych jako pilne.

#### 🔧 Mechanizm działania:
```json
{
  "conditions": {
    "subjectContains": ["PILNE", "URGENT", "ASAP", "!"],
    "keywords": ["pilne", "natychmiast", "срочно"]
  },
  "actions": {
    "createTask": {
      "title": "PILNE: Odpowiedź na email",
      "description": "Email wymagający natychmiastowej uwagi", 
      "priority": "HIGH",
      "context": "@calls",
      "estimatedTime": 30
    }
  }
}
```

#### 📋 Szczegółowy opis działania:

1. **Wykrywanie pilności**: Reguła analizuje temat i treść emaila w poszukiwaniu słów kluczowych wskazujących na pilność
2. **Wielojęzyczność**: Obsługuje słowa kluczowe w polskim, angielskim i rosyjskim
3. **Automatyczne zadanie**: Gdy warunki są spełnione, tworzy zadanie GTD z:
   - **Tytułem**: "PILNE: Odpowiedź na email" 
   - **Priorytetem**: HIGH (czerwony)
   - **Kontekstem**: @calls (sugeruje kontakt telefoniczny)
   - **Czasem**: 30 minut szacowanego czasu realizacji

#### 🎯 Przypadki użycia:
- ✅ "PILNE: Problem z serwerem" → Utworzy zadanie HIGH
- ✅ "URGENT: Meeting cancellation" → Utworzy zadanie HIGH  
- ✅ "Срочно нужна помощь!" → Utworzy zadanie HIGH
- ❌ "Dziękuję za wczorajsze spotkanie" → Nie wykryje pilności

#### 💡 Korzyści biznesowe:
- **Zero przecieków**: Pilne sprawy nigdy nie umkną uwagi
- **Struktura GTD**: Zorganizowane podejście do zadań
- **Szybka reakcja**: Natychmiastowe tworzenie zadań w momencie otrzymania emaila

---

## EMAIL_FILTER - Filtrowanie emaili

### 📧 Filtr newsletterów i spam

**ID**: `#2` | **Priorytet**: 10 (niski) | **Wyzwalacz**: EVENT_BASED

#### 🎯 Cel reguły:
Automatyczne kategoryzowanie i archiwizowanie newsletterów oraz wiadomości marketingowych.

#### 🔧 Mechanizm działania:
```json
{
  "conditions": {
    "subjectContains": ["newsletter", "unsubscribe", "marketing", "promotion"],
    "senderDomain": "mailchimp.com",
    "bodyContains": ["unsubscribe", "marketing"]
  },
  "actions": {
    "categorize": "ARCHIVE",
    "skipAIAnalysis": true,
    "autoArchive": true
  }
}
```

#### 📋 Szczegółowy opis działania:

1. **Wielopoziomowe wykrywanie**: 
   - **Temat**: Szuka słów związanych z marketingiem
   - **Nadawca**: Rozpoznaje popularne platformy mailowych (Mailchimp)
   - **Treść**: Analizuje zawartość wiadomości

2. **Optymalizacja zasobów**:
   - **skipAIAnalysis**: true - Nie marnuje zasobów AI na oczywiste newslettery
   - **autoArchive**: true - Automatycznie przenosi do archiwum

3. **Kategoryzacja**: Oznacza jako ARCHIVE dla łatwiejszego zarządzania

#### 🎯 Przypadki użycia:
- ✅ "Newsletter tygodniowy - nowości w branży" → ARCHIVE + pomiń AI
- ✅ Email z MailChimp o promocji → ARCHIVE + pomiń AI
- ✅ "Unsubscribe from our mailing list" → ARCHIVE + pomiń AI
- ❌ "Spotkanie z klientem" → Nie filtruje, normale przetwarzanie

#### 💡 Korzyści biznesowe:
- **Czysta skrzynka**: Główna skrzynka zawiera tylko ważne emaile
- **Oszczędność zasobów**: Nie analizuje przez AI oczywistych przypadków
- **Wydajność**: Szybsze przetwarzanie dzięki pomijaniu analizy AI

---

## AUTO_REPLY - Automatyczne odpowiedzi

### 🤖 Potwierdzenie zapytań ofertowych

**ID**: `#3` | **Priorytet**: 80 (wysoki) | **Wyzwalacz**: EVENT_BASED

#### 🎯 Cel reguły:
Automatyczne wysyłanie potwierdzeń otrzymania zapytań ofertowych, ale tylko w godzinach pracy.

#### 🔧 Mechanizm działania:
```json
{
  "conditions": {
    "subjectContains": ["oferta", "wycena", "zapytanie", "quote"],
    "timeRange": {
      "start": "08:00",
      "end": "18:00", 
      "timezone": "Europe/Warsaw"
    },
    "daysOfWeek": [1, 2, 3, 4, 5]
  },
  "actions": {
    "sendAutoReply": {
      "template": "Dziękujemy za zapytanie ofertowe. Nasz zespół przygotuje odpowiedź w ciągu 24 godzin roboczych.",
      "subject": "Potwierdzenie otrzymania zapytania ofertowego",
      "delay": 5,
      "onlyBusinessHours": true
    }
  }
}
```

#### 📋 Szczegółowy opis działania:

1. **Rozpoznawanie zapytań ofertowych**:
   - Wielojęzyczne wsparcie (PL/EN)
   - Słowa kluczowe: oferta, wycena, zapytanie, quote

2. **Inteligentne czasowanie**:
   - **Godziny pracy**: 8:00-18:00 (strefa Europe/Warsaw)
   - **Dni robocze**: Poniedziałek-Piątek (1-5)
   - **Opóźnienie**: 5 minut (naturalne zachowanie)

3. **Profesjonalna odpowiedź**:
   - Przejrzysta komunikacja o czasie odpowiedzi
   - Automatyczny temat wskazujący na potwierdzenie

#### 🎯 Przypadki użycia:
- ✅ "Zapytanie o wycenę strony WWW" (wtorek 14:00) → Wyśle potwierdzenie za 5 min
- ✅ "Quote request for services" (czwartek 10:00) → Wyśle potwierdzenie za 5 min
- ❌ "Zapytanie o wycenę" (sobota 15:00) → Nie wyśle (weekend)
- ❌ "Zapytanie o wycenę" (poniedziałek 20:00) → Nie wyśle (po godzinach)

#### 💡 Korzyści biznesowe:
- **Profesjonalny wizerunek**: Klient natychmiast wie że zapytanie dotarło
- **Zarządzanie oczekiwaniami**: Jasny komunikat o czasie odpowiedzi
- **Oszczędność czasu**: Automatyzacja rutynowych odpowiedzi
- **Naturalne zachowanie**: Opóźnienie sprawia że odpowiedź wydaje się "ludzka"

---

## AI_RULE - Reguły sztucznej inteligencji

### 🧠 Analiza sentymentu reklamacji

**ID**: `#4` | **Priorytet**: 70 (wysoki) | **Wyzwalacz**: EVENT_BASED

#### 🎯 Cel reguły:
Wykorzystanie AI do analizy sentymentu reklamacji i automatyczna eskalacja bardzo negatywnych przypadków.

#### 🔧 Mechanizm działania:
```json
{
  "conditions": {
    "subjectContains": ["reklamacja", "skarga", "problem", "complaint"],
    "minUrgencyScore": 60
  },
  "actions": {
    "aiAnalysis": {
      "analysisType": "sentiment",
      "modelId": "gpt-4",
      "promptTemplate": "Przeanalizuj sentiment tej reklamacji i oceń poziom frustracji klienta w skali 1-10"
    }
  }
}
```

#### 📋 Szczegółowy opis działania:

1. **Wykrywanie reklamacji**:
   - Słowa kluczowe w różnych językach
   - Filtr minimalnego urgency score (60+)

2. **Analiza AI**:
   - **Model**: GPT-4 (najwyższa jakość analizy)
   - **Typ**: Analiza sentymentu
   - **Prompt**: Specjalistyczny template do oceny frustracji

3. **Automatyczna eskalacja**: Na podstawie wyniku AI może uruchomić dalsze akcje

#### 📊 Analiza masowa - API Call

**ID**: `#9` | **Priorytet**: 30 (średni) | **Wyzwalacz**: API_CALL

#### 🎯 Cel reguły:
Masowe przetwarzanie emaili przez systemy zewnętrzne z wykorzystaniem AI.

#### 🔧 Mechanizm działania:
```json
{
  "conditions": {
    "minUrgencyScore": 1
  },
  "actions": {
    "aiAnalysis": {
      "analysisType": "classification",
      "modelId": "gpt-3.5-turbo",
      "promptTemplate": "Sklasyfikuj ten email jako: business/personal/spam/newsletter"
    }
  },
  "maxExecutionsPerHour": 1000
}
```

#### 📋 Szczegółowy opis działania:

1. **Uruchamianie programistyczne**:
   - Typ wyzwalacza: API_CALL
   - Kontrola z poziomu skryptów i aplikacji

2. **Masowe przetwarzanie**:
   - Limit: 1000 wykonań/godzinę
   - Model: GPT-3.5-turbo (szybszy, tańszy)
   - Klasyfikacja podstawowa

#### 💡 Zastosowania AI Rules:
- **Sentiment analysis**: Automatyczna ocena nastroju klientów
- **Content classification**: Kategoryzacja rodzaju wiadomości  
- **Urgency detection**: Wykrywanie pilnych spraw
- **Language detection**: Rozpoznawanie języka wiadomości
- **Spam detection**: Zaawansowane wykrywanie spam

---

## SMART_MAILBOX - Inteligentne skrzynki

### 📮 VIP Klienci - Smart Mailbox

**ID**: `#5` | **Priorytet**: 90 (najwyższy) | **Wyzwalacz**: EVENT_BASED

#### 🎯 Cel reguły:
Automatyczne kierowanie emaili od VIP klientów do dedykowanej skrzynki z natychmiastowymi powiadomieniami.

#### 🔧 Mechanizm działania:
```json
{
  "conditions": {
    "senderDomain": "microsoft.com",
    "keywords": ["CEO", "Director", "Manager", "VIP"],
    "priority": "HIGH"
  },
  "actions": {
    "categorize": "VIP",
    "notify": {
      "users": ["manager@firma.pl"],
      "channels": ["#vip-clients"],
      "message": "Nowy email od VIP klienta"
    }
  }
}
```

#### 📋 Szczegółowy opis działania:

1. **Rozpoznawanie VIP**:
   - **Domeny korporacyjne**: microsoft.com, google.com itp.
   - **Tytuły stanowisk**: CEO, Director, Manager, VIP
   - **Priorytet**: Tylko HIGH priority emaile

2. **Akcje specjalne**:
   - **Kategoryzacja**: VIP (złota etykieta)
   - **Powiadomienia**: Natychmiastowe alerty dla managera
   - **Kanały**: Automatyczne powiadomienia w Slack (#vip-clients)

3. **Eskalacja**: Manager otrzymuje natychmiastowe powiadomienie

#### 🎯 Przypadki użycia:
- ✅ Email od ceo@microsoft.com → VIP + powiadomienie managera
- ✅ "Director of Sales" w podpisie → VIP + powiadomienie
- ✅ Email oznaczony jako HIGH priority od znanej firmy → VIP
- ❌ Zwykły email od pracownika → Normale przetwarzanie

#### 💡 Korzyści biznesowe:
- **Priorytetyzacja**: VIP klienci otrzymują natychmiastową uwagę
- **Zerowa utrata**: Ważne emaile nigdy nie umkną uwagi
- **Automatyzacja**: Brak potrzeby ręcznego sortowania
- **Transparentność**: Cały zespół wie o kontakcie z VIP

---

## WORKFLOW - Przepływy pracy

### 🔄 Workflow nowego klienta - MANUAL

**ID**: `#6` | **Priorytet**: 85 (bardzo wysoki) | **Wyzwalacz**: MANUAL

#### 🎯 Cel reguły:
Kompleksowy proces onboardingu nowego klienta uruchamiany ręcznie przez zespół sprzedaży.

#### 🔧 Mechanizm działania:
```json
{
  "actions": {
    "createTask": {
      "title": "Onboarding nowego klienta",
      "description": "Przeprowadź proces wdrożenia klienta",
      "priority": "HIGH",
      "context": "@office"
    },
    "sendAutoReply": {
      "template": "Witamy w naszej firmie! Wkrótce skontaktuje się z Państwem nasz konsultant.",
      "subject": "Witamy w naszej firmie"
    },
    "notify": {
      "users": ["sales@firma.pl"],
      "message": "Nowy klient wymaga onboardingu"
    }
  }
}
```

#### 📋 Szczegółowy opis działania:

1. **Uruchamianie ręczne**: Zespół sprzedaży klikam "Play" gdy podpisuje nowego klienta

2. **Wieloetapowe akcje**:
   - **Zadanie**: Tworzy zadanie onboardingu dla zespołu
   - **Powitanie**: Wysyła profesjonalne powitanie do klienta
   - **Powiadomienie**: Informuje cały zespół sprzedaży

3. **Synchronizacja zespołu**: Wszyscy wiedzą o nowym kliencie

### ⏰ Raport tygodniowy - SCHEDULED

**ID**: `#7` | **Priorytet**: 50 (średni) | **Wyzwalacz**: SCHEDULED

#### 🎯 Cel reguły:
Automatyczne generowanie i wysyłanie raportów tygodniowych każdy piątek o 17:00.

#### 🔧 Mechanizm działania:
```json
{
  "conditions": {
    "timeRange": {
      "start": "17:00",
      "end": "17:30",
      "timezone": "Europe/Warsaw"
    },
    "daysOfWeek": [5]
  },
  "actions": {
    "sendAutoReply": {
      "template": "Raport tygodniowy z aktywności emailowej w załączeniu.",
      "subject": "Raport tygodniowy - $(date)"
    }
  },
  "maxExecutionsPerDay": 1
}
```

#### 📋 Szczegółowy opis działania:

1. **Harmonogram**:
   - **Dzień**: Piątek (5)
   - **Godzina**: 17:00-17:30
   - **Strefa**: Europe/Warsaw

2. **Zabezpieczenia**:
   - **maxExecutionsPerDay**: 1 (nie wyśle przypadkowo dwa razy)

3. **Dynamiczny temat**: $(date) zostanie zastąpione aktualną datą

### 🌐 Webhook integracja z CRM - WEBHOOK

**ID**: `#8` | **Priorytet**: 75 (wysoki) | **Wyzwalacz**: WEBHOOK

#### 🎯 Cel reguły:
Powiadamianie zewnętrznego systemu CRM o każdym nowym kontakcie biznesowym.

#### 🔧 Mechanizm działania:
```json
{
  "conditions": {
    "subjectContains": ["business", "partnership", "collaboration"],
    "hasAttachment": true
  },
  "actions": {
    "webhook": {
      "url": "https://api.external-crm.com/new-contact",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer xxx",
        "Content-Type": "application/json"
      }
    }
  }
}
```

#### 📋 Szczegółowy opis działania:

1. **Wykrywanie kontaktów biznesowych**:
   - Słowa kluczowe: business, partnership, collaboration
   - Musi mieć załącznik (często umowy, prezentacje)

2. **Integracja zewnętrzna**:
   - **URL**: Endpoint zewnętrznego CRM
   - **Autoryzacja**: Bearer token dla bezpieczeństwa
   - **Format**: JSON

3. **Synchronizacja**: Dane kontaktu trafiają do głównego CRM

---

## Wszystkie typy wyzwalaczy

### 📊 Porównanie wyzwalaczy:

| Typ | Przykład | Charakterystyka | Najlepsze zastosowanie |
|-----|----------|-----------------|------------------------|
| **EVENT_BASED** | #1,#2,#3,#4,#5 | Natychmiastowa reakcja na zdarzenie | Przetwarzanie emaili w czasie rzeczywistym |
| **MANUAL** | #6 | Uruchomienie ręczne przez użytkownika | Procesy wymagające ludzkiej decyzji |
| **SCHEDULED** | #7 | Wykonanie o określonym czasie | Raporty, backupy, cykliczne zadania |
| **WEBHOOK** | #8 | Uruchomienie przez system zewnętrzny | Integracje między aplikacjami |
| **API_CALL** | #9 | Programistyczne uruchomienie | Masowe przetwarzanie, skrypty |
| **AUTOMATIC** | - | Ciągłe działanie w tle | Przetwarzanie backlogów |

### 🎯 Wybór odpowiedniego wyzwalacza:

#### EVENT_BASED - najczęstszy wybór
- ✅ **Kiedy**: Chcesz natychmiastowej reakcji na email
- ✅ **Korzyści**: Najszybszy, najefektywniejszy
- ✅ **Użycie**: 90% przypadków

#### MANUAL - kontrola użytkownika  
- ✅ **Kiedy**: Proces wymaga ludzkiej decyzji
- ✅ **Korzyści**: Pełna kontrola, brak automatycznych błędów
- ✅ **Użycie**: Onboarding, ważne procesy biznesowe

#### SCHEDULED - planowane działania
- ✅ **Kiedy**: Cykliczne zadania, raporty
- ✅ **Korzyści**: Przewidywalność, automatyzacja rutyny
- ✅ **Użycie**: Raporty, archiwizacja, cleanup

#### WEBHOOK - integracje
- ✅ **Kiedy**: Komunikacja między systemami
- ✅ **Korzyści**: Bezpieczna integracja, real-time sync
- ✅ **Użycie**: CRM sync, powiadomienia zewnętrzne

#### API_CALL - programistyczne
- ✅ **Kiedy**: Masowe przetwarzanie, skrypty
- ✅ **Korzyści**: Skalowalność, kontrola programista
- ✅ **Użycie**: Migracje danych, batch processing

---

## Zaawansowane konfiguracje

### 🎛️ Optymalizacja wydajności:

#### Priorytety wykonania:
```
95: 🔄 Auto-zadania z pilnych emaili (najwyższy)
90: 📮 VIP Klienci - Smart Mailbox  
85: 🔄 Workflow nowego klienta
80: 🤖 Potwierdzenie zapytań ofertowych
75: 🌐 Webhook integracja z CRM
70: 🧠 Analiza sentymentu reklamacji
50: ⏰ Raport tygodniowy
30: 📊 Analiza masowa - API Call
10: 📧 Filtr newsletterów i spam (najniższy)
```

#### Limity wykonania:
- **maxExecutionsPerHour**: 1000 (Analiza masowa)
- **maxExecutionsPerDay**: 1 (Raport tygodniowy)
- **cooldownPeriod**: 300s (5 min między wykonaniami)

### 🛡️ Zabezpieczenia:

#### Warunki czasowe:
- **timeRange**: Ograniczenie do godzin pracy
- **daysOfWeek**: Tylko dni robocze
- **timezone**: Precyzyjne zarządzanie strefami

#### Optymalizacje AI:
- **skipAIAnalysis**: true dla oczywistych przypadków
- **modelId**: GPT-4 dla analizy, GPT-3.5-turbo dla klasyfikacji
- **promptTemplate**: Specjalistyczne prompty dla lepszych wyników

---

## Porównanie i najlepsze praktyki

### 📈 Statystyki wykorzystania:

| Typ reguły | Liczba | Procent | Zalecane użycie |
|------------|--------|---------|-----------------|
| WORKFLOW | 3 | 33% | Złożone procesy biznesowe |
| AI_RULE | 2 | 22% | Analiza i klasyfikacja |
| EMAIL_FILTER | 2 | 22% | Organizacja skrzynki |
| PROCESSING | 1 | 11% | Tworzenie zadań |
| AUTO_REPLY | 1 | 11% | Komunikacja z klientami |
| SMART_MAILBOX | 1 | 11% | Priorytetyzacja VIP |

### 🎯 Najlepsze praktyki z przykładów:

#### 1. **Hierarchia priorytetów**
```
Pilne emaile (95) > VIP klienci (90) > Onboarding (85) > Oferty (80)
```

#### 2. **Optymalizacja zasobów**
- Newsletter filter: `skipAIAnalysis: true`
- Masowa analiza: Model GPT-3.5-turbo zamiast GPT-4

#### 3. **Inteligentne warunki**
- Czasowe ograniczenia dla auto-reply
- Wielojęzyczne słowa kluczowe
- Kombinacje warunków (temat + nadawca + załącznik)

#### 4. **Wieloetapowe akcje**
- Workflow nowego klienta: zadanie + email + powiadomienie
- VIP klienci: kategoryzacja + powiadomienia

#### 5. **Zabezpieczenia**
- `maxExecutionsPerDay: 1` dla raportów
- `onlyBusinessHours: true` dla auto-reply
- `cooldownPeriod` dla często uruchamianych reguł

### 🚀 Korzyści zastosowania wszystkich przykładów:

1. **Automatyzacja 90% rutynowych zadań**
2. **Zero průsaky pilnych spraw** 
3. **Profesjonalna obsługa klientów**
4. **Optymalne wykorzystanie AI**
5. **Seamless integracje zewnętrzne**
6. **Proaktywne zarządzanie procesami**

---

## 🎊 Podsumowanie

Utworzonych zostało **9 przykładowych reguł** demonstrujących:

### ✅ Wszystkie 6 typów reguł:
- PROCESSING (1x)
- EMAIL_FILTER (1x) 
- AUTO_REPLY (1x)
- AI_RULE (2x)
- SMART_MAILBOX (1x)
- WORKFLOW (3x)

### ✅ Wszystkie 5 typów wyzwalaczy:
- EVENT_BASED (5x) - najczęstszy
- MANUAL (1x) - kontrolowany
- SCHEDULED (1x) - czasowy
- WEBHOOK (1x) - integracyjny
- API_CALL (1x) - programistyczny

### ✅ Zaawansowane funkcjonalności:
- Warunki czasowe i dni tygodnia
- Wielojęzyczne słowa kluczowe
- Optymalizacja AI (różne modele)
- Limity wykonania i cooldown
- Powiadomienia wielokanałowe
- Integracje webhook

### 💪 Gotowy do produkcji:
Wszystkie przykłady można bezpośrednio wykorzystać w środowisku produkcyjnym po dostosowaniu adresów email, URL webhook i innych parametrów specyficznych dla organizacji.

---

*Przewodnik przykładów Rules Manager v1.0 - Utworzono: 2025-06-24*
*© 2025 CRM-GTD Smart - Wszystkie prawa zastrzeżone*