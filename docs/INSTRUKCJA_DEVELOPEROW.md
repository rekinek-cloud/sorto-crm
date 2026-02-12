# INSTRUKCJA DLA DEVELOPEROW - SORTO-CRM

**Data utworzenia**: 2026-02-02
**Wersja**: 1.0

---

## 1. PIERWSZE KROKI

### 1.1 Wymagania systemowe

```
- Node.js >= 18.17.0
- npm >= 9.0.0
- Docker & Docker Compose
- Git
```

### 1.2 Klonowanie repozytorium

```bash
cd /home/dev/apps
git clone git@github.com:rekinek-cloud/sorto-crm.git
cd sorto-crm
```

### 1.3 Instalacja zaleznosci

```bash
# Root (turbo, eslint, prettier)
npm install

# Backend
cd packages/backend && npm install

# Frontend
cd packages/frontend && npm install
```

### 1.4 Konfiguracja srodowiska

```bash
# Skopiuj przykladowy .env
cp .env.example .env

# Edytuj zmienne srodowiskowe
nano .env
```

**Wymagane zmienne:**
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/crm_gtd_prod"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=crm_gtd_prod

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
BCRYPT_ROUNDS=12

# Redis
REDIS_URL=redis://localhost:6379

# AI (opcjonalne)
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 2. URUCHAMIANIE APLIKACJI

### 2.1 Development (lokalne)

```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev
```

**Dostep:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api-docs (jesli wlaczony)

### 2.2 Docker (produkcyjne)

```bash
# Uruchomienie wszystkich uslug
docker compose up -d

# Sprawdzenie statusu
docker compose ps

# Logi
docker compose logs -f backend
docker compose logs -f frontend
```

**Dostep:**
- Frontend: https://crm.dev.sorto.ai
- Backend API: https://crm.dev.sorto.ai/api/v1

### 2.3 Rebuild po zmianach

```bash
# Tylko backend
docker compose up -d --build backend

# Tylko frontend
docker compose up -d --build frontend

# Wszystko
docker compose up -d --build
```

---

## 3. STRUKTURA PROJEKTU

### 3.1 Backend (`packages/backend/`)

```
src/
├── app.ts                 # Entry point, Express setup
├── modules/               # Feature modules
│   ├── auth/             # Authentication (JWT, bcrypt)
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   └── routes.ts
│   ├── organizations/    # Multi-tenancy
│   └── developer-hub/    # Dev tools
├── routes/               # API routes (94 pliki)
│   ├── tasks.ts
│   ├── projects.ts
│   ├── contacts.ts
│   └── ...
├── services/             # Business logic
│   ├── ai/              # AI services
│   ├── voice/           # TTS services
│   ├── vector/          # Vector search
│   └── ...
├── middleware/           # Express middleware
│   ├── auth.ts          # JWT verification
│   ├── rateLimit.ts     # Rate limiting
│   └── ...
├── config/               # Configuration
├── types/                # TypeScript types
└── database/             # DB utilities
```

### 3.2 Frontend (`packages/frontend/`)

```
src/
├── app/                  # Next.js App Router
│   ├── [locale]/        # i18n routing
│   │   ├── auth/        # Auth pages
│   │   ├── dashboard/   # Main app
│   │   └── ...
│   ├── layout.tsx
│   └── page.tsx
├── components/           # React components
│   ├── ui/              # Reusable UI
│   ├── forms/           # Form components
│   ├── modals/          # Modal dialogs
│   └── ...
├── lib/                  # Utilities
│   ├── api/             # API client functions
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Helper functions
├── stores/               # Zustand stores
├── types/                # TypeScript types
└── styles/               # Global styles
```

### 3.3 Prisma (`packages/backend/prisma/`)

```
prisma/
├── schema.prisma         # Glowny schema (4432 linii)
├── seed.ts               # Glowny seed script
├── seed-*.ts             # Dodatkowe seed scripts
└── migrations/           # Migracje bazy
```

---

## 4. PRACA Z BAZA DANYCH

### 4.1 Prisma CLI

```bash
cd packages/backend

# Generowanie klienta po zmianie schema
npx prisma generate

# Migracja (ZALECANE)
npx prisma migrate dev --name nazwa_migracji

# Push bez migracji (tylko dev)
npx prisma db push

# Prisma Studio (GUI)
npx prisma studio

# Reset bazy (OSTROZNIE!)
# npx prisma migrate reset  # WYMAGA POTWIERDZENIA
```

### 4.2 Backup bazy

```bash
# ZAWSZE przed zmianami!
docker compose exec postgres pg_dump -U postgres crm_gtd_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker compose exec -T postgres psql -U postgres crm_gtd_prod < backup_file.sql
```

### 4.3 Seed danych

```bash
cd packages/backend

# Glowny seed
npm run db:seed

# Lub bezposrednio
npx prisma db seed
```

---

## 5. DODAWANIE NOWYCH FUNKCJONALNOSCI

### 5.1 Nowy endpoint API

1. **Utworz route** (`src/routes/newFeature.ts`):
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    // logika
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
```

2. **Zarejestruj w app.ts**:
```typescript
import newFeatureRoutes from './routes/newFeature';
// ...
apiRouter.use('/new-feature', newFeatureRoutes);
```

### 5.2 Nowy model Prisma

1. **Dodaj do schema.prisma**:
```prisma
model NewModel {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacje
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  @@map("new_models")
}
```

2. **Uruchom migracje**:
```bash
npx prisma migrate dev --name add_new_model
npx prisma generate
```

### 5.3 Nowy komponent React

1. **Utworz komponent** (`src/components/NewComponent.tsx`):
```tsx
'use client';

import { useState } from 'react';

interface Props {
  title: string;
}

export function NewComponent({ title }: Props) {
  const [state, setState] = useState('');

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {/* ... */}
    </div>
  );
}
```

2. **Uzyj w stronie**:
```tsx
import { NewComponent } from '@/components/NewComponent';

export default function Page() {
  return <NewComponent title="Tytul" />;
}
```

---

## 6. TESTOWANIE

### 6.1 Backend tests

```bash
cd packages/backend

# Wszystkie testy
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### 6.2 Frontend tests

```bash
cd packages/frontend

# Unit tests
npm test

# E2E (Playwright)
npm run test:e2e
```

### 6.3 API testing (curl)

```bash
# Health check
curl https://crm.dev.sorto.ai/api/v1/dev-hub/health

# Login
curl -X POST https://crm.dev.sorto.ai/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"password"}'

# Authenticated request
curl https://crm.dev.sorto.ai/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 7. DEBUGGING

### 7.1 Logi kontenerow

```bash
# Backend
docker logs crm-backend --tail 100 -f

# Frontend
docker logs crm-frontend --tail 100 -f

# Postgres
docker logs crm-postgres --tail 100

# Szukanie bledow
docker logs crm-backend 2>&1 | grep -i error
```

### 7.2 Prisma debugging

```bash
# Debug mode
DEBUG="prisma:*" npx prisma migrate dev

# Query logging
# W .env: DATABASE_URL z ?log=query
```

### 7.3 VS Code debugging

Dodaj do `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Backend",
      "port": 9229,
      "restart": true
    }
  ]
}
```

---

## 8. KONWENCJE KODU

### 8.1 Nazewnictwo

| Typ | Konwencja | Przyklad |
|-----|-----------|----------|
| Pliki | camelCase | `userService.ts` |
| Komponenty | PascalCase | `UserCard.tsx` |
| Funkcje | camelCase | `getUserById()` |
| Klasy | PascalCase | `UserService` |
| Stale | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Typy/Interfaces | PascalCase | `UserResponse` |
| Tabele DB | snake_case | `user_permissions` |

### 8.2 Struktura pliku

```typescript
// 1. Imports (external, then internal)
import { Router } from 'express';
import { prisma } from '../database';

// 2. Types/Interfaces
interface UserData {
  name: string;
}

// 3. Constants
const MAX_ITEMS = 100;

// 4. Main code
export async function getUsers() {
  // ...
}

// 5. Export
export default router;
```

### 8.3 Git commits

Format: `type(scope): description`

```
feat(auth): add password reset functionality
fix(tasks): resolve date parsing issue
docs(readme): update installation steps
refactor(api): simplify error handling
```

---

## 9. BEZPIECZENSTWO

### 9.1 Zasady

- **NIGDY** nie commituj plikow .env
- **NIGDY** nie loguj haseł ani tokenow
- **ZAWSZE** waliduj input uzytkownika (zod)
- **ZAWSZE** uzywaj prepared statements (Prisma)
- **ZAWSZE** sprawdzaj uprawnienia

### 9.2 Checklist przed deployem

- [ ] Usuniete console.log z produkcji
- [ ] Wylaczone test endpoints
- [ ] Zaktualizowane dependencies
- [ ] Sprawdzone zmienne srodowiskowe
- [ ] Backup bazy danych

---

## 10. PRZYDATNE KOMENDY

```bash
# Turbo - build wszystko
npx turbo build

# Turbo - dev wszystko
npx turbo dev

# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check

# Clean node_modules
rm -rf node_modules packages/*/node_modules
npm install
```

---

## 11. ROZWIAZYWANIE PROBLEMOW

### Problem: Prisma client out of sync

```bash
npx prisma generate
# Restart serwera
```

### Problem: Port zajety

```bash
# Znajdz proces
lsof -i :3001
# Zabij
kill -9 PID
```

### Problem: Docker out of memory

```bash
docker system prune -a
docker volume prune
```

### Problem: Next.js cache

```bash
rm -rf .next
npm run build
```

---

## 12. KONTAKT I WSPARCIE

- **Issues**: GitHub Issues
- **Dokumentacja**: `/docs` w repozytorium
- **Logi**: Docker logs lub CloudWatch

---

*Ostatnia aktualizacja: 2026-02-02*
