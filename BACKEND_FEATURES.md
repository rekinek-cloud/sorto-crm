# Backend Features - Sorto CRM

Kompletna lista zaimplementowanych funkcji w backendzie sorto-crm.
Wygenerowano: 2026-01-29

---

## 1. Moduł Auth (Authentication & Authorization)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | /api/v1/auth/register | Rejestracja nowego użytkownika |
| POST | /api/v1/auth/login | Logowanie użytkownika |
| POST | /api/v1/auth/refresh | Odświeżenie tokena JWT |
| POST | /api/v1/auth/accept-invitation | Zaakceptowanie zaproszenia do organizacji |
| POST | /api/v1/auth/verify-email | Weryfikacja adresu email |
| POST | /api/v1/auth/resend-verification | Ponowne wysłanie emaila weryfikacyjnego |
| POST | /api/v1/auth/password-reset/request | Żądanie resetowania hasła |
| POST | /api/v1/auth/password-reset/confirm | Potwierdzenie resetowania hasła |
| GET | /api/v1/auth/me | Pobranie profilu bieżącego użytkownika |
| POST | /api/v1/auth/logout | Wylogowanie użytkownika |
| POST | /api/v1/auth/change-password | Zmiana hasła |
| POST | /api/v1/auth/invite | Zaproszenie nowego użytkownika (wymaga ADMIN/OWNER) |

## 2. Moduł Organizations (Zarządzanie organizacją)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/organizations | Pobranie aktualnej organizacji |
| PUT | /api/v1/organizations | Aktualizacja danych organizacji (wymaga ADMIN/OWNER) |
| GET | /api/v1/organizations/statistics | Statystyki organizacji (wymaga MANAGER+) |
| GET | /api/v1/organizations/users | Lista użytkowników w organizacji (wymaga MANAGER+) |
| GET | /api/v1/organizations/users/:userId | Pobranie szczegółów użytkownika (wymaga MANAGER+) |
| PUT | /api/v1/organizations/users/:userId | Aktualizacja użytkownika (wymaga ADMIN/OWNER) |
| DELETE | /api/v1/organizations/users/:userId | Dezaktywacja użytkownika (wymaga ADMIN/OWNER) |
| POST | /api/v1/organizations/users/bulk | Operacje masowe na użytkownikach (wymaga ADMIN/OWNER) |
| PUT | /api/v1/organizations/subscription | Aktualizacja planu subskrypcji (wymaga OWNER) |
| GET | /api/v1/organizations/export | Export danych organizacji (wymaga ADMIN/OWNER) |
| GET | /api/v1/organizations/activity | Log aktywności organizacji (wymaga MANAGER+) |

## 3. Moduł Tasks (Zarządzanie zadaniami)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/tasks | Lista zadań z filtrowaniem i paginacją |
| GET | /api/v1/tasks/:id | Pobranie szczegółów zadania |
| POST | /api/v1/tasks | Utworzenie nowego zadania |
| PUT | /api/v1/tasks/:id | Aktualizacja zadania |
| DELETE | /api/v1/tasks/:id | Usunięcie zadania |
| GET | /api/v1/tasks/contexts/list | Lista dostępnych kontekstów |
| GET | /api/v1/tasks/stats | Statystyki zadań |

## 4. Moduł Projects (Zarządzanie projektami)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/projects | Lista projektów z filtrowaniem |
| GET | /api/v1/projects/:id | Pobranie szczegółów projektu z zadaniami |
| POST | /api/v1/projects | Utworzenie nowego projektu |
| PUT | /api/v1/projects/:id | Aktualizacja projektu |
| DELETE | /api/v1/projects/:id | Usunięcie projektu (jeśli brak zadań) |

## 5. Moduł Contacts (Zarządzanie kontaktami)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/contacts | Lista kontaktów z wyszukiwaniem i paginacją |
| GET | /api/v1/contacts/:id | Pobranie szczegółów kontaktu |
| POST | /api/v1/contacts | Utworzenie nowego kontaktu |
| PUT | /api/v1/contacts/:id | Aktualizacja kontaktu |
| DELETE | /api/v1/contacts/:id | Usunięcie kontaktu |

## 6. Moduł Companies (Zarządzanie firmami)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/companies | Lista firm z filtrowaniem i statystykami |
| GET | /api/v1/companies/:id | Pobranie szczegółów firmy |
| POST | /api/v1/companies | Utworzenie nowej firmy |
| PUT | /api/v1/companies/:id | Aktualizacja firmy |
| DELETE | /api/v1/companies/:id | Usunięcie firmy |

## 7. Moduł Deals (Zarządzanie okazjami sprzedażowymi)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/deals | Lista okazji z filtrowaniem po etapie |
| GET | /api/v1/deals/pipeline | Podsumowanie pipeline'u sprzedażowego |
| GET | /api/v1/deals/:id | Pobranie szczegółów okazji |
| POST | /api/v1/deals | Utworzenie nowej okazji |
| PUT | /api/v1/deals/:id | Aktualizacja okazji z auto-ustawianiem dat |
| DELETE | /api/v1/deals/:id | Usunięcie okazji |

## 8. Moduł Streams (Strumienie pracy)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/streams | Lista strumieni z paginacją |
| POST | /api/v1/streams | Utworzenie nowego strumienia |
| POST | /api/v1/streams/ai/suggest | AI sugestia strumienia na podstawie opisu |
| GET | /api/v1/streams/stats | Statystyki strumieni |
| GET | /api/v1/streams/frozen | Lista zamrożonych/archiwalnych strumieni |
| GET | /api/v1/streams/:id | Pobranie szczegółów strumienia |
| PUT | /api/v1/streams/:id | Aktualizacja strumienia |
| DELETE | /api/v1/streams/:id | Usunięcie strumienia |
| POST | /api/v1/streams/:id/archive | Archiwizacja/przywrócenie strumienia |
| POST | /api/v1/streams/:id/duplicate | Duplikowanie strumienia |

## 9. Moduł Source Inbox (Inbox i przetwarzanie)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/source | Lista elementów w inboxie z filtrowaniem |
| GET | /api/v1/source/stats | Statystyki inbox'u |
| POST | /api/v1/source | Szybka rejestracja elementu (quick capture) |
| POST | /api/v1/source/:id/process | Przetworzenie elementu metodą GTD |
| POST | /api/v1/source/:id/quick-action | Szybkie akcje (DO, DEFER, DELETE) |

## 10. Moduł Contexts (Konteksty)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/contexts | Lista kontekstów |
| GET | /api/v1/contexts/:id | Pobranie szczegółów kontekstu |
| POST | /api/v1/contexts | Utworzenie nowego kontekstu |
| PUT | /api/v1/contexts/:id | Aktualizacja kontekstu |
| DELETE | /api/v1/contexts/:id | Usunięcie kontekstu |

## 11. Moduł Goals (Cele)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/goals | Lista celów |
| GET | /api/v1/goals/:id | Pobranie szczegółów celu |
| POST | /api/v1/goals | Utworzenie nowego celu |
| PUT | /api/v1/goals/:id | Aktualizacja celu |
| PUT | /api/v1/goals/:id/progress | Aktualizacja postępu celu |
| DELETE | /api/v1/goals/:id | Usunięcie celu |

## 12. Moduł Tags (Tagi)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/tags | Lista tagów |
| POST | /api/v1/tags | Utworzenie nowego tagu |
| PUT | /api/v1/tags/:id | Aktualizacja tagu |
| DELETE | /api/v1/tags/:id | Usunięcie tagu |

## 13. Moduł Areas (Obszary odpowiedzialności)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/areas | Lista obszarów |
| POST | /api/v1/areas | Utworzenie obszaru |
| PUT | /api/v1/areas/:id | Aktualizacja obszaru |
| DELETE | /api/v1/areas/:id | Usunięcie obszaru |

## 14. Moduł Habits (Nawyki)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/habits | Lista nawyków |
| POST | /api/v1/habits | Utworzenie nawyku |
| PUT | /api/v1/habits/:id | Aktualizacja nawyku |
| DELETE | /api/v1/habits/:id | Usunięcie nawyku |
| POST | /api/v1/habits/:id/complete | Oznaczenie nawyku jako wykonany |

## 15. Moduł Recurring Tasks (Zadania cykliczne)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/recurring-tasks | Lista zadań cyklicznych |
| POST | /api/v1/recurring-tasks | Utworzenie zadania cyklicznego |
| PUT | /api/v1/recurring-tasks/:id | Aktualizacja zadania cyklicznego |
| DELETE | /api/v1/recurring-tasks/:id | Usunięcie zadania cyklicznego |

## 16. Moduł Meetings (Spotkania)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/meetings | Lista spotkań |
| POST | /api/v1/meetings | Utworzenie spotkania |
| PUT | /api/v1/meetings/:id | Aktualizacja spotkania |
| DELETE | /api/v1/meetings/:id | Usunięcie spotkania |

## 17. Moduł Delegated (Zadania delegowane)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/delegated | Lista zadań delegowanych |
| POST | /api/v1/delegated | Utworzenie zadania delegowanego |
| PUT | /api/v1/delegated/:id | Aktualizacja zadania delegowanego |
| DELETE | /api/v1/delegated/:id | Usunięcie zadania delegowanego |

## 18. Moduł AI (Sztuczna inteligencja)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/ai/goal-recommendations | Rekomendacje celów z AI |
| POST | /api/v1/ai/analyze-productivity | Analiza produktywności użytkownika |
| POST | /api/v1/ai/predict-project-success | Prognoza sukcesu projektu |

## 19. Moduł AI Assistant (Human-in-the-Loop)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | /api/v1/ai-assistant/analyze | Analiza elementu z opcją zatwierdzenia AI |

Obsługiwane konteksty: SOURCE, STREAM, TASK, DAY_PLAN, REVIEW, DEAL

## 20. Moduł Flow Engine (Przetwarzanie elementów)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | /api/v1/flow/process/:id | Przetwarzanie pojedynczego elementu |
| POST | /api/v1/flow/process-batch | Przetwarzanie wielu elementów |
| POST | /api/v1/flow/confirm/:id | Potwierdzenie sugestii AI |
| GET | /api/v1/flow/pending | Lista elementów do przetworzenia |
| GET | /api/v1/flow/history | Historia przetwarzania |
| GET | /api/v1/flow/patterns | Nauczone wzorce |
| GET | /api/v1/flow/rules | Reguły automatyzacji |
| POST | /api/v1/flow/rules | Utworzenie reguły |
| PUT | /api/v1/flow/rules/:id | Aktualizacja reguły |
| DELETE | /api/v1/flow/rules/:id | Usunięcie reguły |

## 21. Moduł Flow Conversation (Dialog AI)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | /api/v1/flow/conversation | Dialogowe przetwarzanie z AI |

## 22. Moduł AI Knowledge (Wiedza AI)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/ai-knowledge | Pobieranie artykułów wiedzy |
| POST | /api/v1/ai-knowledge | Tworzenie artykułów wiedzy |
| POST | /api/v1/ai-knowledge/chat | Chat z bazą wiedzy |

## 23. Moduł AI Insights (Dashboard)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/ai-insights | Wglądy AI na pulpicie nawigacyjnym |

## 24. Moduł AI Config (Konfiguracja AI)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/admin/ai-config | Pobranie konfiguracji AI |
| PUT | /api/v1/admin/ai-config | Aktualizacja konfiguracji AI |

## 25. Moduł AI Prompts (Szablony promptów)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/ai/prompts | Lista promptów |
| POST | /api/v1/ai/prompts | Utworzenie promptu |
| PUT | /api/v1/ai/prompts/:id | Aktualizacja promptu |
| DELETE | /api/v1/ai/prompts/:id | Usunięcie promptu |

## 26. Moduł Knowledge Base (Baza wiedzy)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/knowledge/documents | Lista dokumentów |
| GET | /api/v1/knowledge/documents/:id | Pobranie dokumentu |
| POST | /api/v1/knowledge/documents | Utworzenie dokumentu |
| PUT | /api/v1/knowledge/documents/:id | Aktualizacja dokumentu |
| DELETE | /api/v1/knowledge/documents/:id | Usunięcie dokumentu |

## 27. Moduł Calendar (Kalendarz)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/calendar/events | Pobieranie zdarzeń z wszystkich źródeł |

Agregacja: Tasks, Projects, Meetings, Recurring Tasks, Deals, Invoices, Reviews, Habits

## 28. Moduł Communication (Komunikacja)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/communication/channels | Lista kanałów komunikacyjnych |
| POST | /api/v1/communication/channels | Utworzenie kanału |
| GET | /api/v1/communication/channels/:id | Pobranie szczegółów kanału |
| PUT | /api/v1/communication/channels/:id | Aktualizacja kanału |
| DELETE | /api/v1/communication/channels/:id | Usunięcie kanału |

Wsparcie dla: EMAIL, SLACK

## 29. Moduł Smart Mailboxes (Inteligentne skrzynki)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/mailboxes | Lista skrzynek |
| POST | /api/v1/mailboxes | Utworzenie skrzynki |
| PUT | /api/v1/mailboxes/:id | Aktualizacja skrzynki |
| DELETE | /api/v1/mailboxes/:id | Usunięcie skrzynki |

## 30. Moduł Invoices (Faktury)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/invoices | Lista faktur |
| GET | /api/v1/invoices/:id | Pobranie szczegółów faktury |
| POST | /api/v1/invoices | Utworzenie faktury |
| PUT | /api/v1/invoices/:id | Aktualizacja faktury |
| DELETE | /api/v1/invoices/:id | Usunięcie faktury |

Integracja z Fakturownia (polska platforma fakturowania)

## 31. Moduł Products (Produkty)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/products | Lista produktów |
| POST | /api/v1/products | Utworzenie produktu |
| PUT | /api/v1/products/:id | Aktualizacja produktu |
| DELETE | /api/v1/products/:id | Usunięcie produktu |

## 32. Moduł Services (Usługi)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/services | Lista usług |
| POST | /api/v1/services | Utworzenie usługi |
| PUT | /api/v1/services/:id | Aktualizacja usługi |
| DELETE | /api/v1/services/:id | Usunięcie usługi |

## 33. Moduł Offers (Oferty)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/offers | Lista ofert |
| POST | /api/v1/offers | Utworzenie oferty |
| PUT | /api/v1/offers/:id | Aktualizacja oferty |
| DELETE | /api/v1/offers/:id | Usunięcie oferty |

## 34. Moduł Billing (Rozliczenia/Stripe)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/billing/subscription | Pobranie szczegółów subskrypcji |
| GET | /api/v1/billing/plans | Lista dostępnych planów |
| POST | /api/v1/billing/checkout | Inicjacja procesu płatności Stripe |
| POST | /api/v1/billing/portal | Otwarcie portalu klienta Stripe |
| POST | /api/v1/billing/webhook | Webhook od Stripe |

## 35. Moduł Users (Zarządzanie użytkownikami)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/users | Lista użytkowników |
| GET | /api/v1/users/:id | Pobranie szczegółów użytkownika |
| PUT | /api/v1/users/:id | Aktualizacja profilu użytkownika |
| DELETE | /api/v1/users/:id | Usunięcie użytkownika |

## 36. Moduł User Hierarchy (Hierarchia użytkowników)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/user-hierarchy/users | Lista użytkowników z hierarchią |
| GET | /api/v1/user-hierarchy/stats | Statystyki użytkowników |
| POST | /api/v1/user-hierarchy/invite | Zaproszenie użytkownika |
| PUT | /api/v1/user-hierarchy/users/:id/role | Zmiana roli użytkownika |

## 37. Moduł Dashboard
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/dashboard/stats | Statystyki pulpitu nawigacyjnego |
| GET | /api/v1/dashboard/activity | Ostatnia aktywność |

## 38. Moduł Timeline (Oś czasu)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/timeline | Pobieranie zdarzeń osi czasu |

## 39. Moduł Analysis (Analiza)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/analysis/productivity | Analiza produktywności |
| GET | /api/v1/analysis/trends | Trendy i wzorce |

## 40. Moduł Vector Search (Wyszukiwanie semantyczne)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | /api/v1/vector-search | Wyszukiwanie semantyczne w bazie |

## 41. Moduł Errors/Bug Reports (Raporty błędów)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/errors | Lista błędów |
| POST | /api/v1/errors | Zgłoszenie błędu |
| PUT | /api/v1/errors/:id | Aktualizacja statusu błędu |

## 42. Moduł Internal API (RAG)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | /api/v1/internal/rag/query | Zapytanie RAG |
| POST | /api/v1/internal/rag/index | Indeksowanie dokumentów |

## 43. Moduł MCP Server (Model Context Protocol)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | /api/v1/mcp | Endpoint MCP dla Claude/ChatGPT |
| GET | /api/v1/admin/mcp-keys | Lista kluczy API MCP |
| POST | /api/v1/admin/mcp-keys | Utworzenie klucza API |
| DELETE | /api/v1/admin/mcp-keys/:id | Usunięcie klucza API |
| PUT | /api/v1/admin/mcp-keys/:id | Aktualizacja klucza API |

## 44. Moduł Industries (Szablony branżowe)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/industries | Lista szablonów branż |
| GET | /api/v1/industries/:id | Szczegóły szablonu |
| POST | /api/v1/industries/:id/apply | Zastosowanie szablonu branży |

## 45. Moduł Day Planner (Planowanie dnia)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/day-planner | Pobranie planu dnia |
| POST | /api/v1/day-planner | Utworzenie bloku czasowego |
| PUT | /api/v1/day-planner/:id | Aktualizacja bloku |
| DELETE | /api/v1/day-planner/:id | Usunięcie bloku |

## 46. Moduł Streams Map (Mapa strumieni)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/streams-map | Mapa strumieni (widok graficzny) |

## 47. Moduł GTD Horizons
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/v1/horizons | Lista horyzontów GTD |
| POST | /api/v1/horizons | Utworzenie horyzontu |
| PUT | /api/v1/horizons/:id | Aktualizacja horyzontu |
| DELETE | /api/v1/horizons/:id | Usunięcie horyzontu |

---

## Aliasy URL (kompatybilność wsteczna)

| Stary URL | Nowy URL |
|-----------|----------|
| /api/v1/gtd | /api/v1/workflow |
| /api/v1/gtd-streams | /api/v1/stream-management |
| /api/v1/gtdinbox | /api/v1/source |
| /api/v1/gtdmapviews | /api/v1/streams-map |
| /api/v1/gtdhorizons | /api/v1/horizons |
| /api/v1/smartdayplanner | /api/v1/day-planner |
| /api/v1/smartmailboxes | /api/v1/mailboxes |
| /api/v1/precise-goals | /api/v1/goals |

---

## Funkcje AI

- **Rekomendacje celów** - AI sugeruje cele na podstawie historii
- **Analiza produktywności** - Analiza wzorców pracy użytkownika
- **Prognozowanie sukcesu projektów** - ML-based prediction
- **Human-in-the-Loop** - Sugestie AI z możliwością zatwierdzenia
- **Flow Engine** - Automatyczne kategoryzowanie i przetwarzanie
- **Ekstrakcja jednostek** - Rozpoznawanie osób, firm, kwot, dat
- **Wyszukiwanie semantyczne** - pgvector + embeddings
- **Chat z bazą wiedzy** - RAG (Retrieval Augmented Generation)

---

## Integracje

| Integracja | Opis |
|------------|------|
| **Stripe** | Płatności, subskrypcje, portal klienta |
| **Fakturownia** | Polska platforma fakturowania |
| **Email (IMAP/SMTP)** | Integracja poczty elektronicznej |
| **Slack** | Powiadomienia i integracja |
| **PostgreSQL + pgvector** | Baza danych z wyszukiwaniem wektorowym |
| **Redis** | Cache i sesje |
| **OpenAI** | GPT-4 dla funkcji AI |

---

## Middleware i bezpieczeństwo

- **JWT Authentication** - Tokeny dostępu i odświeżania
- **RBAC** - Role-based Access Control (OWNER, ADMIN, MANAGER, MEMBER)
- **Multi-tenancy** - Izolacja danych organizacji
- **Row Level Security** - Bezpieczeństwo na poziomie bazy danych
- **Rate Limiting** - Limity zapytań (strict, user, organization)
- **Zod Validation** - Walidacja schematów requestów
- **CORS** - Ochrona przed cross-origin
- **Helmet.js** - Security headers
- **Compression** - Kompresja odpowiedzi

---

## Health Check

| Endpoint | Opis |
|----------|------|
| GET /health | Status zdrowia aplikacji |

---

*Dokument wygenerowany automatycznie na podstawie analizy kodu źródłowego.*
