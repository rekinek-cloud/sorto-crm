# Sorto CRM - Szybka Karta Referencyjna

**Data:** 2026-02-02 | **Wersja:** 0.1.0

---

## URLs
| Zasób | URL |
|-------|-----|
| Frontend | https://crm.dev.sorto.ai/crm/pl |
| API | https://crm.dev.sorto.ai/api/v1 |
| Health | http://localhost:3005/health |

## Porty
| Serwis | Port zewnętrzny | Port wewnętrzny |
|--------|-----------------|-----------------|
| Backend | 3005 | 3001 |
| Frontend | 3008 | 3000 |
| PostgreSQL | - | 5432 |
| Redis | - | 6379 |

## Docker

```bash
# Status
docker compose ps

# Logi
docker logs crm-backend --tail 50
docker logs crm-frontend --tail 50

# Restart
docker compose restart backend
docker compose restart frontend

# Rebuild
docker compose build backend && docker compose up -d backend
```

## Baza danych

```bash
# Połączenie
docker exec -it crm-postgres psql -U postgres crm_gtd_prod

# Backup
docker exec crm-postgres pg_dump -U postgres crm_gtd_prod > backup_$(date +%Y%m%d).sql

# Statystyki
docker exec crm-postgres psql -U postgres crm_gtd_prod -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;"
```

## API - Szybkie testy

```bash
# Generuj token
cd /home/dev/apps/sorto-crm/packages/backend
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({userId:'66ef64df-053d-4caa-a6ce-f7a3ce783581',organizationId:'d3d91404-e75f-4bee-8f0c-0e1eaa25317f',role:'ADMIN'}, 'your_jwt_secret_min_32_chars_here', {expiresIn:'1h'}))")

# Test endpointów
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3005/api/v1/tasks | jq '.pagination'
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3005/api/v1/contacts | jq '.pagination'
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3005/api/v1/projects | jq '.total'
```

## Prisma

```bash
cd /home/dev/apps/sorto-crm/packages/backend

# Generate client
npx prisma generate

# Migracja (ZAWSZE Z BACKUPEM!)
npx prisma migrate dev --name nazwa_migracji

# Studio (GUI)
npx prisma studio
```

## Statystyki (2026-02-02)

| Metryka | Wartość |
|---------|---------|
| Tabele | 149 |
| Rekordy | 549 |
| Wypełnienie | 100% |
| Route files | 94 |
| AI Providers | 3 |
| AI Models | 8 |

## AI Providers

| Provider | Modele |
|----------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, o1 |
| Anthropic | claude-sonnet-4, claude-opus-4, claude-3.5-haiku |
| Google | gemini-2.0-flash-exp, gemini-1.5-pro |

## Ważne pliki

| Plik | Ścieżka |
|------|---------|
| Schema Prisma | `packages/backend/prisma/schema.prisma` |
| App Express | `packages/backend/src/app.ts` |
| Routes | `packages/backend/src/routes/*.ts` |
| Docker Compose | `docker-compose.yml` |
| Env | `.env` -> `.env.production` |

## Troubleshooting

### Backend nie startuje
```bash
docker logs crm-backend --tail 100
docker compose restart backend
```

### Błędy Prisma
```bash
npx prisma generate
docker compose restart backend
```

### Sprawdź połączenie z bazą
```bash
docker exec crm-postgres pg_isready -U postgres
```

---

*Quick Reference - 2026-02-02*
