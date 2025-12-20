# 🚀 AI Quick Guide - CRM-GTD Smart

## 📍 Główne Lokalizacje

| Funkcja | URL | Menu |
|---------|-----|------|
| **Konfiguracja AI** | `/crm/dashboard/communication/rules/` | Komunikacja → Reguły przetwarzania |
| **Reguły AI** | `/crm/dashboard/ai-rules/` | Narzędzia → Reguły AI |
| **Demo AI** | `/crm/dashboard/ai-demo/` | Narzędzia → Demo Analizy AI |
| **Projekty z AI** | `/crm/dashboard/projects/` | Dashboard → Projekty |

---

## ⚡ Quick Start (5 minut)

### 1. Skonfiguruj OpenAI (2 min)
```
→ Komunikacja → Reguły przetwarzania
→ Dodaj Provider: OpenAI + API Key  
→ Dodaj Model: GPT-4
```

### 2. Utwórz Pierwszą Regułę (2 min)
```
→ Narzędzia → Reguły AI → Nowa reguła
→ Nazwa: "Test analiza projektów"
→ Moduł: Projekty
→ Warunek: status równa się "PLANNING"  
→ Akcja: Analiza AI + custom prompt
→ Zapisz
```

### 3. Przetestuj (1 min)
```
→ Projekty → Utwórz projekt → Status: PLANNING
→ Kliknij "Analiza AI" w karcie projektu
→ Zobacz wyniki analizy
```

---

## 🎯 Dostępne Moduły AI

### 📁 **Projekty**
- **Lokalizacja**: Dashboard → Projekty  
- **Przyciski**: "Analiza AI" w kartach i liście
- **Analizy**: SMART, ryzyka, podział zadań

### ✅ **Zadania**
- **Lokalizacja**: Dashboard → Zadania
- **Analizy**: Podział złożonych, produktywność

### 💰 **Deale**
- **Lokalizacja**: Dashboard → CRM → Transakcje
- **Analizy**: Ryzyka, strategia negocjacji

### 👤 **Kontakty**  
- **Lokalizacja**: Dashboard → CRM → Kontakty
- **Analizy**: Strategia zaangażowania, reaktywacja

### 📧 **Komunikacja**
- **Analiza automatyczna**: Email, Slack, Teams
- **Analizy**: Sentiment, sugestie odpowiedzi

---

## 🔧 Typy Reguł - Przykłady

### Automatyczna Analiza Nowych Projektów
```yaml
Warunki: status = "PLANNING" AND budget > 10000
Akcje: 
  - Analiza AI (SMART)
  - Dodaj tag: "reviewed"
  - Powiadomienie managera
```

### Monitoring VIP Email
```yaml  
Warunki: type = "email" AND sender zawiera "@vip.com"
Akcje:
  - Analiza sentymentu
  - Priorytet HIGH (jeśli negatywny)
  - Natychmiastowe powiadomienie
```

### Podział Dużych Zadań
```yaml
Warunki: estimatedHours > 8 AND status = "TODO"
Akcje:
  - AI: podział na podzadania  
  - Automatyczne utworzenie subtasków
  - Tag: "auto-split"
```

---

## 🛠️ Zmienne w Promptach

### Projekty
`{{name}}`, `{{description}}`, `{{status}}`, `{{budget}}`, `{{endDate}}`, `{{teamSize}}`

### Zadania
`{{title}}`, `{{description}}`, `{{estimatedHours}}`, `{{priority}}`, `{{dueDate}}`

### Deale  
`{{clientName}}`, `{{value}}`, `{{stage}}`, `{{probability}}`, `{{lastContact}}`

### Kontakty
`{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{position}}`, `{{lastContactDate}}`

### Email
`{{subject}}`, `{{content}}`, `{{sender}}`, `{{recipient}}`, `{{type}}`

---

## 🎯 Przykłady Promptów

### Analiza SMART Projektu
```
Oceń projekt "{{name}}" pod kątem SMART:

Projekt: {{description}}
Budżet: {{budget}} PLN  
Deadline: {{endDate}}
Zespół: {{teamSize}} osób

Oceń każdy aspekt SMART (1-5) i podaj ogólną ocenę z rekomendacjami.
```

### Strategia Reaktywacji Kontaktu
```
Kontakt {{firstName}} {{lastName}} z {{company}} nie kontaktował się od {{lastContactDate}}.

Stanowisko: {{position}}
Ostatnia interakcja: {{lastContactDate}}

Zaproponuj strategię reaktywacji: timing, kanał komunikacji, treść wiadomości.
```

### Podział Złożonego Zadania
```
Zadanie: {{title}}
Opis: {{description}}  
Szacowany czas: {{estimatedHours}} godzin
Deadline: {{dueDate}}

Podziel na 3-5 mniejszych zadań (2-3h każde). Format: "- Zadanie: opis (czas)"
```

---

## ⚠️ Szybkie Rozwiązywanie Problemów

### Reguła się nie uruchamia
1. ✅ Sprawdź czy jest **aktywna** (toggle)
2. ✅ Sprawdź **warunki** - czy dane je spełniają  
3. ✅ Zobacz **logi** w konsoli (F12)

### Błąd AI Provider  
1. ✅ Sprawdź **API key** w Communication/Rules
2. ✅ **Test connectivity** - uruchom demo analizę
3. ✅ Sprawdź **uprawnienia** API key

### Wolne odpowiedzi
1. ✅ Użyj **GPT-3.5** zamiast GPT-4
2. ✅ **Skróć prompt** - usuń zbędne detale
3. ✅ **Zmniejsz max_tokens** w modelu

### Za dużo uruchomień
1. ✅ **Uściślij warunki** reguły
2. ✅ Zmień na **manual trigger** do testów  
3. ✅ **Grupuj podobne** reguły w jedną

---

## 📞 Wsparcie

### Dokumentacja
- **Pełny manual**: `MANUAL_SYSTEMU_AI.md`
- **System info**: `CLAUDE.md`

### Demo i Testy
- **Demo URL**: http://91.99.50.80/crm/dashboard/ai-demo/
- **Test projekt**: Utwórz projekt → status PLANNING → kliknij AI

### Logi
- **Frontend**: F12 → Console (błędy JavaScript)
- **Backend**: `docker logs crm-backend-v1 --tail 50`
- **API testy**: Postman/curl na `/api/v1/ai-rules/`

---

*Quick Guide - wersja 1.0 | 2025-06-20*