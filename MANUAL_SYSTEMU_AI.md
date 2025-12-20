# Manual Systemu AI - CRM-GTD Smart

## 📋 Spis Treści
1. [Przegląd Systemu](#przegląd-systemu)
2. [Konfiguracja Podstawowa](#konfiguracja-podstawowa)
3. [Tworzenie Reguł AI](#tworzenie-reguł-ai)
4. [Integracja z Modułami](#integracja-z-modułami)
5. [Przykłady Użycia](#przykłady-użycia)
6. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)

---

## 🤖 Przegląd Systemu

System AI w CRM-GTD Smart składa się z **dwóch głównych komponentów**:

### 1. **Infrastruktura AI** (Providerzy i Modele)
- **Lokalizacja**: Komunikacja → Reguły przetwarzania
- **URL**: http://91.99.50.80/crm/dashboard/communication/rules/
- **Cel**: Konfiguracja providerów AI i dostępnych modeli

### 2. **Automatyzacja AI** (Reguły)
- **Lokalizacja**: Narzędzia → Reguły AI
- **URL**: http://91.99.50.80/crm/dashboard/ai-rules/
- **Cel**: Tworzenie reguł kiedy i jak uruchamiać analizy AI

---

## 🔧 Konfiguracja Podstawowa

### Krok 1: Skonfiguruj Providerów AI

1. **Przejdź do**: Komunikacja → Reguły przetwarzania
2. **Kliknij**: "Dodaj Provider" 
3. **Wypełnij dane**:
   - **Nazwa**: OpenAI
   - **Typ**: openai
   - **API Key**: sk-your-openai-key
   - **Base URL**: https://api.openai.com/v1

### Krok 2: Dodaj Modele AI

1. **W tej samej sekcji kliknij**: "Dodaj Model"
2. **Wypełnij dane**:
   - **Nazwa**: GPT-4
   - **Provider**: OpenAI (wybierz z listy)
   - **Model ID**: gpt-4
   - **Max Tokens**: 4000
   - **Temperature**: 0.7

### Krok 3: Testuj Konfigurację

1. **Sprawdź**: czy provider i model się zapisały
2. **Test**: spróbuj użyć modelu w demo analizy

---

## 📝 Tworzenie Reguł AI

### Dostęp do Reguł
- **URL**: http://91.99.50.80/crm/dashboard/ai-rules/
- **Menu**: Narzędzia → Reguły AI

### Tworzenie Nowej Reguły

#### 1. **Podstawowe Informacje**
```
Nazwa: Analiza SMART nowych projektów
Opis: Automatycznie analizuje projekty pod kątem kryteriów SMART
Moduł: Projekty
Trigger: Automatyczny
Priorytet: 5 (Normalny)
Status: Aktywna ✓
```

#### 2. **Warunki Uruchomienia**
Dodaj warunki określające KIEDY reguła ma się uruchamiać:

**Przykład 1**: Nowe projekty
```
status równa się "PLANNING"
```

**Przykład 2**: Projekty wysokiej wartości
```
status równa się "PLANNING"
AND
budget większe niż "50000"
```

**Przykład 3**: Email z załącznikami
```
type równa się "email"
AND  
hasAttachments równa się "true"
```

#### 3. **Akcje do Wykonania**

##### Akcja: Analiza AI
```
Typ: Analiza AI
Model: GPT-4
Prompt: 
Oceń projekt "{{name}}" pod kątem kryteriów SMART:
- Specific (konkretny): Czy cel jest jasno określony?
- Measurable (mierzalny): Czy da się zmierzyć postęp?
- Achievable (osiągalny): Czy cel jest realistyczny?
- Relevant (istotny): Czy cel jest ważny dla biznesu?
- Time-bound (ograniczony w czasie): Czy jest deadline?

Projekt: {{description}}
Budżet: {{budget}} PLN
Deadline: {{endDate}}

Oceń każdy aspekt w skali 1-5 i podaj ogólną ocenę.
```

##### Akcja: Dodaj Tag
```
Typ: Dodaj tag
Nazwa tagu: smart-analyzed
```

##### Akcja: Wyślij Powiadomienie
```
Typ: Wyślij powiadomienie
Tytuł: Projekt wymaga uwagi
Treść: Projekt "{{name}}" został przeanalizowany pod kątem SMART i wymaga Twojej uwagi.
```

### 4. **Zapisz i Testuj**
1. **Kliknij**: "Utwórz regułę"
2. **Sprawdź**: czy reguła pojawiła się na liście
3. **Test**: uruchom ręcznie na przykładowym projekcie

---

## 🎯 Integracja z Modułami

System AI jest zintegrowany z wszystkimi głównymi modułami:

### 📁 **Projekty**
- **Lokalizacja**: Dashboard → Projekty
- **Przyciski AI**: W kartach projektów i widoku listy
- **Dostępne analizy**:
  - Analiza SMART
  - Ocena ryzyka projektu
  - Podział na zadania

### ✅ **Zadania**  
- **Przyciski AI**: W kartach zadań
- **Dostępne analizy**:
  - Podział złożonych zadań
  - Wskazówki produktywności
  - Optymalizacja czasu

### 💰 **Deale (CRM)**
- **Przyciski AI**: W kartach dealów
- **Dostępne analizy**:
  - Analiza ryzyka deala
  - Strategia negocjacji
  - Prognozowanie zamknięcia

### 👤 **Kontakty**
- **Przyciski AI**: W kartach kontaktów  
- **Dostępne analizy**:
  - Strategia zaangażowania
  - Analiza relacji biznesowych
  - Plan reaktywacji kontaktu

### 📧 **Komunikacja** ⚡ NOWE!
- **Centrum Komunikacji**: http://91.99.50.80/crm/dashboard/communication/
- **Analiza automatyczna**: Email, Slack, Teams, WhatsApp
- **GTD Integration**: Pełna integracja z metodologią David Allen'a
- **Dostępne analizy**:
  - Analiza sentymentu i pilności
  - Automatyczne przetwarzanie GTD (DO/DEFER/DELEGATE/PROJECT)
  - Sugestie odpowiedzi i kategoryzacja
  - Inteligentne przypisywanie priorytetów
  - Automatyczne tworzenie zadań z kontekstem CRM

---

## 💡 Przykłady Użycia

### Przykład 1: Automatyczna Analiza Projektów
```yaml
Nazwa: Auto-analiza nowych projektów
Warunki:
  - status = "PLANNING"
  - budget > 10000
Akcje:
  - Analiza AI (SMART)
  - Dodaj tag: "requires-review"
  - Powiadomienie do managera
Wynik: Każdy nowy projekt >10k PLN jest automatycznie analizowany
```

### Przykład 2: Monitoring Email VIP
```yaml  
Nazwa: Analiza email od VIP klientów
Warunki:
  - type = "email"
  - sender zawiera "@vip-company.com"
Akcje:
  - Analiza sentymentu
  - Priorytet: HIGH (jeśli negatywny)
  - Powiadomienie natychmiastowe
Wynik: VIP emaile są natychmiast analizowane i priorytetyzowane
```

### Przykład 3: Podział Złożonych Zadań
```yaml
Nazwa: Auto-podział dużych zadań
Warunki:
  - estimatedHours > 8
  - status = "TODO"
Akcje:
  - Analiza AI (podział na podzadania)
  - Utworz podzadania automatycznie
  - Dodaj tag: "auto-split"
Wynik: Duże zadania są automatycznie dzielone na mniejsze części
```

### Przykład 4: Reaktywacja Kontaktów
```yaml
Nazwa: Reaktywacja nieaktywnych kontaktów
Warunki:
  - lastContactDays > 90
  - status = "PROSPECT"
Akcje:
  - Analiza strategii reaktywacji
  - Sugestie personalizowanych wiadomości
  - Zaplanuj follow-up
Wynik: System automatycznie identyfikuje i planuje reaktywację kontaktów
```

### Przykład 5: Automatyczne Przetwarzanie GTD Email ⚡ NOWE!
```yaml
Nazwa: Smart GTD Processing dla pilnych email
Warunki:
  - type = "email"
  - urgencyScore > 80
  - actionNeeded = true
Akcje:
  - Analiza AI (sentiment + urgency)
  - Auto GTD Decision (DO dla urgent, DEFER dla normal)
  - Utworz zadanie z kontekstem @computer
  - Ustaw priorytet HIGH dla urgency > 90
  - Link do CRM (jeśli znany kontakt/firma)
  - Powiadomienie do właściciela
Wynik: Pilne emaile są automatycznie przekształcane w zadania GTD
```

### Przykład 6: Newsletter i Materiały Referencyjne
```yaml
Nazwa: Auto-kategoryzacja materiałów informacyjnych
Warunki:
  - type = "email"
  - subject zawiera ["newsletter", "update", "news", "info"]
  - urgencyScore < 30
Akcje:
  - GTD Decision: REFERENCE
  - Dodaj tag: "reference-material"
  - Kategoria: "Industry Updates"
  - Archive automatycznie
Wynik: Newslettery i materiały info są automatycznie archiwizowane jako reference
```

### Przykład 7: Delegacja Zespołowa
```yaml
Nazwa: Auto-delegacja zadań technicznych
Warunki:
  - type = "email"
  - content zawiera ["bug", "technical", "code", "development"]
  - actionNeeded = true
Akcje:
  - GTD Decision: DELEGATE
  - Przypisz do: "dev-team-lead"
  - Kontekst: @computer
  - Priorytet: na podstawie urgency
  - Deadline: +48h od otrzymania
  - Powiadomienie do dev team
Wynik: Sprawy techniczne są automatycznie delegowane do zespołu dev
```

### Przykład 8: VIP Klient - Natychmiastowa Akcja
```yaml
Nazwa: VIP klient wymaga natychmiastowej uwagi
Warunki:
  - type = "email"
  - sender zawiera "@vip-company.com"
  - urgencyScore > 70
Akcje:
  - GTD Decision: DO (natychmiast)
  - Priorytet: HIGH
  - Kontekst: @calls
  - Czas wykonania: 15 min
  - Powiadomienie PUSH do managera
  - Log do CRM timeline jako "URGENT_COMMUNICATION"
Wynik: VIP klienci otrzymują natychmiastową uwagę z pełnym kontekstem
```

---

## 🔍 Demo i Testowanie

### Demo Systemu
- **URL**: http://91.99.50.80/crm/dashboard/ai-demo/
- **Menu**: Narzędzia → Demo Analizy AI
- **Zawiera**: Interaktywny przykład analizy projektu

### Ręczne Testowanie
1. **Utwórz test projekt** w module Projekty
2. **Ustaw status** na "PLANNING"  
3. **Kliknij "Analiza AI"** w karcie projektu
4. **Sprawdź wyniki** w modalnym oknie

### Automatyczne Testowanie
1. **Utwórz regułę** z warunkiem `status = "PLANNING"`
2. **Utwórz nowy projekt** z tym statusem
3. **Sprawdź** czy reguła się uruchomiła automatycznie

### GTD-Communication Testing ⚡ NOWE!
1. **Przejdź do**: http://91.99.50.80/crm/dashboard/communication/
2. **Znajdź wiadomość** z badge "ACTION NEEDED"
3. **Test Quick Actions**:
   - Kliknij "📥 Inbox" - sprawdź czy dodało do GTD Inbox
   - Kliknij "✅ DO" - sprawdź czy utworzyło zadanie
   - Kliknij "⏳ DEFER" - sprawdź czy zaplanowało na jutro
4. **Test Full GTD Modal**:
   - Kliknij "🎯 GTD+" 
   - Wybierz decyzję (np. PROJECT)
   - Wypełnij formularz
   - Sprawdź czy utworzył projekt/zadanie
5. **Test AI Integration**:
   - Kliknij "🤖 AI Analysis"
   - Sprawdź urgency score i auto-suggestions
   - Sprawdź CRM linking

---

## 🛠️ Dostępne Pola Modułów

### Projekty
- `name`, `description`, `status`, `priority`
- `budget`, `teamSize`, `progress` 
- `endDate`, `createdAt`, `manager`

### Zadania  
- `title`, `description`, `status`, `priority`
- `estimatedHours`, `actualHours`, `dueDate`
- `context`, `assignedTo`, `createdAt`

### Deale
- `clientName`, `value`, `stage`, `probability`
- `daysInPipeline`, `lastContact`, `competition`
- `expectedCloseDate`, `source`

### Kontakty
- `firstName`, `lastName`, `email`, `company`
- `position`, `status`, `lastContactDate`
- `relationshipType`, `interests`, `notes`

### Komunikacja ⚡ ZAKTUALIZOWANE!
- `type`, `direction`, `subject`, `content`
- `sender`, `recipient`, `priority`
- `hasAttachments`, `sentimentScore`, `urgencyScore`
- `actionNeeded`, `isRead`, `processed`
- `taskId`, `contactId`, `companyId`, `dealId`
- `channel.name`, `channel.type`, `fromName`, `fromAddress`
- `receivedAt`, `gtdDecision`, `gtdContext`

---

## 🚨 Rozwiązywanie Problemów

### Problem: Reguła się nie uruchamia
**Rozwiązanie**:
1. Sprawdź czy reguła jest **aktywna** (toggle włączony)
2. Sprawdź **warunki** - czy dane spełniają kryteria
3. Sprawdź **logi** w konsoli przeglądarki (F12)
4. Sprawdź **konfigurację providera** AI

### Problem: Błąd "Provider not found"
**Rozwiązanie**:
1. Przejdź do **Communication → Rules**
2. Sprawdź czy **provider jest poprawnie skonfigurowany**
3. Sprawdź **API key** - czy jest aktualny
4. **Test connectivity** - spróbuj prostą analizę

### Problem: Analiza AI zwraca błędy
**Rozwiązanie**:
1. Sprawdź **format promptu** - czy używa poprawnych zmiennych
2. Sprawdź **limity modelu** (tokens, rate limits)
3. Sprawdź **uprawnienia API key**
4. Spróbuj **prostszy prompt** do testów

### Problem: Wolne odpowiedzi AI
**Rozwiązanie**:
1. Użyj **szybszego modelu** (GPT-3.5 zamiast GPT-4)
2. **Skróć prompt** - usuń niepotrzebne detale
3. **Zmniejsz max_tokens** w konfiguracji modelu
4. Sprawdź **obciążenie API** providera

### Problem: Reguły uruchamiają się za często
**Rozwiązanie**:
1. **Uściślij warunki** - dodaj dodatkowe filtry
2. Zmień trigger na **manual** dla testów
3. Dodaj **opóźnienia** między wykonaniami
4. **Grupuj podobne reguły** w jedną

### Problem: GTD Quick Actions nie działają ⚡ NOWE!
**Rozwiązanie**:
1. **Sprawdź console** - F12 → Console → szukaj błędów API
2. **Sprawdź status wiadomości** - czy ma `actionNeeded: true`
3. **Test ręczny** - spróbuj "🎯 GTD+" zamiast quick action
4. **Sprawdź backend** - czy endpoint `/process-gtd` odpowiada
5. **Refresh page** - czasem potrzeba odświeżenia stanu

### Problem: GTD Modal nie zapisuje zadań
**Rozwiązanie**:
1. **Sprawdź required fields** - tytuł zadania, kontekst dla DO/DEFER
2. **Sprawdź validation** - czerwone obramowania pokazują błędy
3. **Test z prostymi danymi** - minimalne wymagane pola
4. **Sprawdź GTD service** - czy `gtdInboxService` jest dostępny
5. **Check permissions** - uprawnienia do tworzenia zadań

### Problem: AI Analysis nie działa z GTD
**Rozwiązanie**:
1. **Sprawdź AI providers** - Communication → Rules → providerzy
2. **Test osobno** - najpierw AI, potem GTD
3. **Sprawdź API limits** - czy nie wyczerpano limitu OpenAI
4. **Validate message format** - czy wiadomość ma wymaganą strukturę
5. **Check integration flow** - AI → GTD → CRM pipeline

---

## 📚 Dalsze Możliwości

### Integracje Zewnętrzne
- **Webhooks**: Integracja z zewnętrznymi systemami
- **Slack/Teams**: Powiadomienia w zespołowych chatach  
- **Email**: Automatyczne wysyłanie raportów
- **Kalendarz**: Automatyczne planowanie zadań

### Zaawansowane Reguły
- **Chainowanie reguł**: Jedna reguła uruchamia następną
- **Warunki czasowe**: Reguły uruchamiane o określonych porach
- **Machine Learning**: Uczenie się wzorców użytkownika
- **A/B Testing**: Testowanie różnych promptów AI

### Monitoring i Analityka
- **Dashboard wykonań**: Statystyki uruchamiania reguł
- **Performance metrics**: Czas wykonania, success rate
- **Cost tracking**: Monitorowanie kosztów API AI
- **User analytics**: Analiza efektywności dla użytkowników

---

## 🎯 Najlepsze Praktyki

### 1. **Projektowanie Reguł**
- **Zacznij prosto** - jedna reguła, jeden cel
- **Testuj incremental** - dodawaj warunki stopniowo  
- **Dokumentuj** - opisuj cel każdej reguły
- **Monitoruj** - sprawdzaj czy reguły działają jak oczekujesz

### 2. **Optymalizacja Promptów**
- **Bądź konkretny** - jasno określ co chcesz uzyskać
- **Używaj przykładów** - podaj format oczekiwanej odpowiedzi
- **Testuj zmienne** - sprawdź czy {{variables}} działają
- **Iteruj** - ulepszaj prompty na podstawie wyników

### 3. **Zarządzanie Kosztami**
- **Wybieraj model** odpowiedni do zadania
- **Monitoruj usage** - sprawdzaj zużycie tokenów
- **Cachuj wyniki** - unikaj powtórnych analiz
- **Optymalizuj prompty** - krótsze = tańsze

### 4. **Bezpieczeństwo**
- **Chroń API keys** - używaj zmiennych środowiskowych
- **Waliduj input** - sprawdzaj dane przed wysłaniem do AI
- **Loguj działania** - śledź kto i kiedy uruchamiał reguły
- **Backup reguł** - eksportuj konfigurację regularnie

---

*Ostatnia aktualizacja: 2025-06-23*  
*Wersja systemu: CRM-GTD Smart V1*  
*🎯 Dodano: GTD-Communication Integration*