# TODO PLAN - Smart Day Planner Implementation

## Status Obecny ✅
- **Demo Interface**: Gotowy i działający na `/crm/dashboard/smart-day-planner/`
- **Backend API**: Kod przygotowany, tymczasowo wyłączony
- **Menu Integration**: Dodany do desktop i mobile menu
- **Database Schema**: Zaprojektowany w `schema-smart-day-planner.prisma`

## Następne Działania 🚀

### Faza 1: Migracja Bazy Danych (Wysokí Priorytet)
- [ ] **Włączyć modele do głównego schema.prisma**
  - Przenieść z `schema-smart-day-planner.prisma` do `packages/backend/prisma/schema.prisma`
  - Dodać relacje z istniejącymi modelami (User, Task, Context)
- [ ] **Uruchomić migrację Prisma**
  - `npx prisma migrate dev --name smart-day-planner`
  - `npx prisma generate`
- [ ] **Zweryfikować tabele w bazie**
  - EnergyTimeBlock, ScheduledTask, EnergyPattern, EnergyAnalytics
  - BreakTemplate, ContextPriority

### Faza 2: Aktywacja Backend API (Średni Priorytet)
- [ ] **Odkomentować import w app.ts**
  - Linia 74: `import smartDayPlannerRoutes from './routes/smartDayPlanner';`
  - Linia 243: `apiRouter.use('/smart-day-planner', smartDayPlannerRoutes);`
- [ ] **Przetestować wszystkie endpoints**
  - `GET /api/v1/smart-day-planner/time-blocks`
  - `POST /api/v1/smart-day-planner/schedule-tasks`
  - `GET /api/v1/smart-day-planner/daily-schedule/:date`

### Faza 3: Rozbudowa Frontend (Średni Priorytet)
- [ ] **Utworzyć modały do zarządzania**
  - Time Block Creation Modal (godziny, energia, konteksty)
  - Energy Pattern Configuration Modal
  - Break Template Setup Modal
- [ ] **Zastąpić demo treścią rzeczywistą**
  - Połączyć z backend API
  - Wyświetlić prawdziwe bloki czasowe
  - Dodać drag & drop planning
- [ ] **Dodać funkcjonalności realtime**
  - Auto-scheduling button funkcjonalny
  - Live statistics update
  - Task assignment to time blocks

### Faza 4: Zaawansowane Funkcje (Niski Priorytet)
- [ ] **AI Learning System**
  - Analiza wzorców produktywności użytkownika
  - Automatyczne sugestie optymalnych czasów
  - Adaptacja kontekstów na podstawie historii
- [ ] **Energy Analytics Dashboard**
  - Wykresy wydajności w różnych porach dnia
  - Heatmapy produktywności
  - Rekomendacje optimalizacji
- [ ] **Advanced Scheduling**
  - Recurring time blocks
  - Team collaboration scheduling
  - Integration with calendar events

### Faza 5: Integracja z Systemem GTD (Opcjonalne)
- [ ] **GTD Streams Integration**
  - Automatyczne routing zadań do streamów na podstawie kontekstu
  - Sync z GTD Inbox processing
- [ ] **Smart Mailboxes Integration**
  - Planning emails as time blocks
  - Auto-scheduling email responses
- [ ] **Voice TTS Integration**
  - Read daily schedule aloud
  - Voice commands for time block management

## Pliki do Modyfikacji 📁

### Backend:
- `packages/backend/prisma/schema.prisma` - dodać modele
- `packages/backend/src/app.ts` - odkomentować import (linie 74, 243)
- `packages/backend/src/routes/smartDayPlanner.ts` - już gotowy

### Frontend:
- `packages/frontend/src/app/dashboard/smart-day-planner/page.tsx` - rozbudowa
- Nowe komponenty: `TimeBlockModal.tsx`, `EnergyConfigModal.tsx`

### Database:
- Nowa migracja Prisma z 8 tabelami Smart Day Planner

## Szacowany Czas Realizacji ⏱️
- **Faza 1**: 2-3 godziny (migracja bazy)
- **Faza 2**: 1-2 godziny (aktywacja API)
- **Faza 3**: 8-12 godzin (rozbudowa frontend)
- **Faza 4**: 20-30 godzin (AI features)
- **Faza 5**: 15-20 godzin (integracja)

**ŁĄCZNIE**: ~50 godzin dla pełnej implementacji

## Priorytety Wdrożenia 🎯
1. **Faza 1 + 2** - Podstawowa funkcjonalność (3-5h)
2. **Faza 3** - Użyteczny interface (12-17h)
3. **Faza 4 + 5** - Advanced features (35-50h)

## Uwagi Techniczne ⚠️
- Backend API jest w pełni gotowy z intelligent scheduling algorithm
- Frontend demo już pokazuje wszystkie koncepcje
- Fallback system kontekstów zaimplementowany
- Break management system zaprojektowany
- AI learning hooks przygotowane

**Status**: Gotowy do Fazy 1 - można rozpocząć migrację bazy danych! 🚀