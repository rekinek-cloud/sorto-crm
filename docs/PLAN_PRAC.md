# PLAN PRAC - SORTO-CRM

**Data utworzenia**: 2026-02-02
**Status**: AKTYWNY
**Wersja**: 1.0

---

## PODSUMOWANIE

Plan naprawy i rozwoju aplikacji sorto-crm w 9 fazach. Najpierw stabilizacja backendu, potem frontend i nowe funkcjonalności.

**Szacowany czas**: ~85-100 godzin

---

## KOLEJNOSC REALIZACJI

```
[1] Analiza -> [2] Prisma -> [3] RAG -> [4] Seed -> [5] Baza -> [6] Produkcja -> [7] Frontend -> [8] Smart Planner -> [9] Dokumentacja
```

---

## FAZY PROJEKTU

### FAZA 0: Analiza aplikacji
| Parametr | Wartosc |
|----------|---------|
| Status | UKONCZONE |
| Czas | 1h |
| Pliki | ANALIZA_APLIKACJI.md |

**Zakres:**
- [x] Struktura projektu
- [x] Technologie i wersje
- [x] Architektura backend/frontend
- [x] Schema bazy danych
- [x] Integracje zewnetrzne

---

### FAZA 1: Prisma naprawy
| Parametr | Wartosc |
|----------|---------|
| Status | OCZEKUJE |
| Priorytet | KRYTYCZNY |
| Czas szacowany | 4-6h |
| Blokuje | Faza 2, 3, 4, 5 |

**Zadania:**
- [ ] Backup bazy danych przed zmianami
- [ ] Analiza bledow schema vs rzeczywista baza
- [ ] Dodanie brakujacych kolumn:
  - `deals.kanbanPosition`
  - inne zidentyfikowane
- [ ] Utworzenie brakujacych tabel:
  - `communication_channels`
  - inne zidentyfikowane
- [ ] Naprawa nazw pol w kodzie:
  - `context` -> `contextId`
  - `_count` relacje
- [ ] Uruchomienie migracji Prisma
- [ ] Weryfikacja zmian

**Pliki do modyfikacji:**
- `packages/backend/prisma/schema.prisma`
- `packages/backend/src/routes/*.ts` (gdzie bledy)
- `packages/backend/src/services/*.ts`

---

### FAZA 2: RAG System fix
| Parametr | Wartosc |
|----------|---------|
| Status | OCZEKUJE |
| Priorytet | WYSOKI |
| Czas szacowany | 7-10h |
| Zalezy od | Faza 1 |

**Zadania:**
- [ ] Sprawdzenie pgvector extension w PostgreSQL
- [ ] Naprawa/utworzenie tabeli `vectors`
- [ ] Implementacja embedding service (mock/OpenAI)
- [ ] Wektoryzacja istniejacych danych:
  - contacts (~100 rekordow)
  - companies (~50 rekordow)
  - messages (~150 rekordow)
- [ ] Test RAG search API
- [ ] Integracja z frontendem

**Pliki do modyfikacji:**
- `packages/backend/prisma/schema.prisma`
- `packages/backend/src/routes/testRagSearch.ts`
- `packages/backend/src/routes/vectorSearch.ts`
- `packages/backend/src/services/VectorService.ts`
- `packages/frontend/src/app/dashboard/rag-search/page.tsx`

---

### FAZA 3: Seed scripts naprawy
| Parametr | Wartosc |
|----------|---------|
| Status | OCZEKUJE |
| Priorytet | SREDNI |
| Czas szacowany | 2.5-4h |
| Zalezy od | Faza 2 |

**Zadania:**
- [ ] Naprawa OrderItem (`itemType` field)
- [ ] Naprawa Invoice podstawowe pola
- [ ] Naprawa MessageAttachment (fileName vs filename)
- [ ] Naprawa StreamPermission (accessLevel)
- [ ] Naprawa AIExecution (inputData vs input)
- [ ] Modularyzacja skryptow seed
- [ ] Test pelnej sekwencji

**Pliki do modyfikacji:**
- `packages/backend/prisma/seed.ts`
- `packages/backend/seed-*.ts`

---

### FAZA 4: Wypelnienie bazy danych
| Parametr | Wartosc |
|----------|---------|
| Status | OCZEKUJE |
| Priorytet | SREDNI |
| Czas szacowany | 8-12h |
| Zalezy od | Faza 3 |

**Zakres:** Wypelnienie 78 pustych tabel (obecnie 26/104 = 25%)

**Podfazy:**
1. E-commerce (8 tabel): products, services, orders, invoices
2. GTD Advanced (6 tabel): next_actions, someday_maybe, weekly_reviews
3. CRM Extended (4 tabel): leads, meetings, timeline
4. Project Management (7 tabel): dependencies, sprints, kanban
5. Email & AI (12 tabel): templates, rules, executions

**Cel:** 95+ tabel wypelnionych (91%+)

---

### FAZA 5: Mock do produkcji
| Parametr | Wartosc |
|----------|---------|
| Status | OCZEKUJE |
| Priorytet | SREDNI |
| Czas szacowany | 1h |
| Zalezy od | Faza 4 |

**Zadania:**
- [ ] Wylaczenie test endpoints (bezpieczenstwo!):
  - `/api/v1/test-rag-search` - usunac z app.ts
- [ ] Zastapienie Mock TTS prawdziwym Coqui TTS
- [ ] Clean-up demo accounts (opcjonalnie)
- [ ] Weryfikacja security headers

**Pliki do modyfikacji:**
- `packages/backend/src/app.ts`
- `docker-compose.yml`

---

### FAZA 6: Frontend bledy UX
| Parametr | Wartosc |
|----------|---------|
| Status | OCZEKUJE |
| Priorytet | SREDNI |
| Czas szacowany | 10-12h |
| Zalezy od | Faza 5 |

**Bledy krytyczne (3):**
- [ ] Przyciski kalendarza bez funkcjonalnosci
  - Plik: `CalendarView.tsx` linie 235, 245
- [ ] Demo przyciski z console.log
  - Plik: `enhanced-cards-demo/page.tsx`
- [ ] Activity Timeline placeholder
  - Plik: `companies/[id]/page.tsx` linie 439-449

**Bledy srednie (3):**
- [ ] Brakujace toast notifications
- [ ] Wyłaczone przyciski bez uzasadnienia
- [ ] Google Nest mock funkcjonalnosc

---

### FAZA 7: Smart Day Planner
| Parametr | Wartosc |
|----------|---------|
| Status | OCZEKUJE |
| Priorytet | NISKI |
| Czas szacowany | 50h |
| Zalezy od | Faza 5 |

**Podfazy:**
1. Migracja bazy (2-3h)
   - Przeniesienie modeli do schema.prisma
   - Uruchomienie migracji
2. Aktywacja API (1-2h)
   - Odkomentowanie w app.ts
   - Test endpoints
3. Rozbudowa frontend (8-12h)
   - Modale do zarzadzania
   - Drag & drop planning
4. AI Learning System (20-30h)
   - Analiza wzorcow produktywnosci
   - Automatyczne sugestie
5. Integracja GTD (15-20h)
   - GTD Streams integration
   - Smart Mailboxes integration

---

### FAZA 8: Aktualizacja dokumentacji
| Parametr | Wartosc |
|----------|---------|
| Status | OCZEKUJE |
| Priorytet | NISKI |
| Czas szacowany | 2-3h |
| Zalezy od | Faza 6, 7 |

**Zadania:**
- [ ] Aktualizacja ANALIZA_APLIKACJI.md
- [ ] Aktualizacja PLAN_PRAC.md (ten plik)
- [ ] Aktualizacja INSTRUKCJA_DEVELOPEROW.md
- [ ] Aktualizacja INSTRUKCJA_UZYTKOWNIKOW.md
- [ ] Aktualizacja CLAUDE.md

---

## METRYKI SUKCESU

### Po Fazie 1-2:
- [ ] Prisma schema zsynchronizowane z baza
- [ ] RAG search zwraca wyniki
- [ ] Brak bledow 500 w API

### Po Fazie 3-5:
- [ ] 95+ tabel wypelnionych
- [ ] Wszystkie seed scripts dzialaja
- [ ] Aplikacja gotowa do produkcji

### Po Fazie 6-7:
- [ ] Brak bledow UX w frontend
- [ ] Smart Day Planner funkcjonalny
- [ ] Pelna integracja systemow

---

## KOMENDY POMOCNICZE

```bash
# Backup bazy przed zmianami
docker compose exec postgres pg_dump -U postgres crm_gtd_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Migracja Prisma (NIGDY --force-reset!)
cd packages/backend && npx prisma migrate dev --name nazwa_migracji

# Test API health
curl https://crm.dev.sorto.ai/api/v1/dev-hub/health

# Logi backend
docker logs crm-backend --tail 100 -f

# Restart po zmianach
docker compose up -d --build backend
```

---

## UWAGI

1. **ZAWSZE backup przed zmianami bazy!**
2. **NIGDY prisma db push --force-reset**
3. **Testuj kazda zmiane przed kolejna faza**
4. **Dokumentuj wszystkie zmiany**

---

*Ostatnia aktualizacja: 2026-02-02*
