# Sorto-CRM Bug Status Report
**Data**: 2026-02-09 | **OPEN**: 26 | **RESOLVED**: 34 | **CLOSED**: 4

---

## Grupa G - Decyzje projektowe (potrzebny Twój input)

| # | Tytuł | Pytanie / Opis | Twoja decyzja |
|---|-------|----------------|---------------|
| 1 | **Konta Email** | Do czego może nam się ta strona przydać? | |
| 2 | **AI Insights** | Jak definiować działanie tej zakładki? | |
| 3 | **Auto odpowiedzi** | Wciągnąć do Smart Automations? | |
| 4 | **Baza wiedzy** vs **Knowledge base** | Zdublowane moduły - który zostawić? | |
| 5 | **Obszary** | Potrzebne? Czy to po prostu Strumień? | |
| 6 | **Pliki** | Zastąpić aplikacją cloud? | |
| 7 | **Tagi i konteksty** | Uzupełniają się czy pokrywają? | |
| 8 | **Cele** | Jak przydadzą się w CRM? Dodać przykłady? | |

---

## Grupa H - Feature Requests (nowa funkcjonalność)

| # | Tytuł | Opis | Twoja decyzja |
|---|-------|------|---------------|
| 1 | **Strona źródło** | Sortowanie, filtrowanie, edycja, masowe przetwarzanie | |
| 2 | **Dodawanie firm** | KRS/REGON/NIP lookup + status VAT | |
| 3 | **Analiza e-mail** | Filtrowanie po kategorii, sentymencie | |
| 4 | **Maila w źródle** | Przetwarzanie maili → RAG | |
| 5 | **Przetwarzanie źródła** | Human-in-the-loop processing | |
| 6 | **Dokumenty w źródle** | Dodawanie dokumentów do źródła | |
| 7 | **Kalendarz** | Multi-filtrowanie typów wydarzeń | |
| 8 | **Zadania cykliczne** | Przypisanie do strumienia | |
| 9 | **Menu projekty** | Roadmap, szablony, zależności | |

---

## Grupa F - Wyniki analizy (config/infrastruktura)

| # | Moduł | Status | Problem | Twoja decyzja |
|---|-------|--------|---------|---------------|
| 1 | **AI Assistant** | Nie działa | RAG service down + brak konfiguracji providerów AI | |
| 2 | **Asystent głosowy** | Nie działa | Backend ma odwołania do nieistniejących funkcji, brak frontend pages | |
| 3 | **Flow Engine** | Prawie działa | Brak prompt template `SOURCE_ANALYZE` w bazie | |
| 4 | **Rekomendacje AI** | Prawdopodobnie działa | Wymaga weryfikacji AIInsightsEngine | |
| 5 | **Graf relacji** | Backend OK, brak frontendu | API zwraca dane, brak strony z wizualizacją | |
| 6 | **Statu wiedzy** | Działa | Pełna implementacja, OK | |

---

## Pozostałe OPEN (nie sklasyfikowane wyżej)

| # | Tytuł | Opis | Twoja decyzja |
|---|-------|------|---------------|
| 1 | **Zadania (podzadania)** | Brak możliwości dodawania podzadań - wymaga zmiany schematu Prisma | |
| 2 | **GTD rename** | Konsekwentnie usunąć z kodu wszelkie nazwy GTD → STREAMS | |
