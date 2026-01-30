# PRE-DEPLOY CHECKLIST - sorto-crm

## Przed deploy

- [ ] `git status` - brak niezacommitowanych zmian
- [ ] `git push` - wszystko wypushnięte do remote
- [ ] Frontend rebuild z `--no-cache` (jeśli zmieniono Dockerfile/env):
  ```bash
  docker compose build --no-cache frontend
  ```

## Po deploy - weryfikacja

- [ ] `curl https://crm.dev.sorto.ai/api/v1` → 200 OK
- [ ] `curl https://crm.dev.sorto.ai/crm/pl/auth/login` → 200 OK
- [ ] Test logowania w przeglądarce

## Krytyczne pliki (nie modyfikować bez commita!)

| Plik | Co zawiera |
|------|------------|
| `packages/frontend/src/middleware.ts` | BASE_PATH = '/crm' |
| `packages/frontend/next.config.js` | basePath: '/crm' |
| `packages/frontend/Dockerfile` | NEXT_PUBLIC_API_URL |
| `packages/backend/src/app.ts` | Wszystkie route imports |

## Znane problemy i rozwiązania

### CORS error (localhost:3001)
**Przyczyna:** Frontend zbudowany bez `NEXT_PUBLIC_API_URL`
**Fix:** `docker compose build --no-cache frontend`

### 404 na /pl/auth/login
**Przyczyna:** Middleware redirect bez `/crm` prefix
**Fix:** Sprawdź `BASE_PATH` w middleware.ts

### 404 na backend routes
**Przyczyna:** Route nie zarejestrowany w app.ts
**Fix:** Dodaj import i `apiRouter.use()` w app.ts

### Duplikaty katalogów
**Przyczyna:** `/app/dashboard/` bez `[locale]`
**Fix:** Przenieś do `_arch/` i commituj

---
Ostatnia aktualizacja: 2026-01-30
