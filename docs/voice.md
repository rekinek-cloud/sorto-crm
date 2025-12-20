# 🛠️ SORTO - Instrukcje dla Claude Code

## **Kompletny przewodnik implementacji systemu CRM-GTD-SMART**

---

## 🎯 **Przegląd projektu**

### **Nazwa**: SORTO (Smart Organization, Real-Time Operations)
### **Typ**: CRM z metodologią GTD, SMART Goals Engine, Streams Workflow + Voice AI
### **Stack techniczny**: 
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js  
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **AI**: OpenAI API, Custom NLP models
- **Voice**: Web Speech API, Google Assistant integration

---

## 🏗️ **Struktura projektu**

```
sorto/
├── apps/
│   ├── web/                 # Next.js frontend (port 9025)
│   ├── api/                 # Express.js backend (port 9029)
│   └── mobile/              # React Native (przyszłość)
├── packages/
│   ├── shared/              # Shared types, utils
│   ├── database/            # Prisma schema, migrations
│   └── ai-engine/           # AI processing modules
├── docs/
│   ├── api/                 # API documentation
│   ├── development/         # Development guides
│   └── deployment/          # Deployment instructions
└── scripts/
    ├── setup.sh             # Initial project setup
    └── deploy.sh            # Deployment automation
```

---

## 🚀 **Phase 1-3: Funkcje zrealizowane (735 funkcji)**

### **✅ Co już mamy:**
- Core GTD system (Inbox, Next Actions, Waiting For, Projects)
- Basic CRM (Companies, Contacts, Deals, Leads)
- Email integration (IMAP/SMTP)
- Slack integration
- AI sentiment analysis
- Task detection w tekście
- SMART Goals Engine (podstawowy)
- PostgreSQL + Redis setup
- JWT authentication
- Multi-tenant architecture

### **📁 Kluczowe pliki do poznania:**
```
apps/web/src/
├── components/gtd/          # GTD methodology components
├── components/crm/          # CRM modules
├── components/ai/           # AI features
└── lib/
    ├── auth.ts              # JWT authentication
    ├── db.ts                # Database connection
    └── ai-processor.ts      # AI analysis engine

apps/api/src/
├── routes/
│   ├── gtd/                 # GTD endpoints
│   ├── crm/                 # CRM endpoints
│   └── ai/                  # AI processing endpoints
├── middleware/
│   ├── auth.ts              # JWT middleware
│   └── rate-limit.ts        # Rate limiting
└── services/
    ├── email.ts             # Email integration
    ├── slack.ts             # Slack integration
    └── ai-analysis.ts       # AI services
```

---

## 🚧 **Phase 4: Voice AI + Enterprise (Priorytet KRYTYCZNY)**

### **🎤 Voice AI Assistant (15 funkcji) - GŁÓWNY FOCUS**

#### **Zadanie 1: Setup Speech Recognition**
```bash
# Lokalizacja: apps/web/src/lib/voice/
# Pliki do stworzenia:
- speech-recognition.ts
- voice-processor.ts
- conversation-context.ts
```

**Wymagania:**
- Web Speech API integration
- Real-time speech-to-text
- Multiple language support (PL/EN)
- Noise cancellation
- Confidence scoring

**Przykład implementacji:**
```typescript
export class SpeechRecognition {
  private recognition: webkitSpeechRecognition;
  private isListening: boolean = false;
  
  constructor(language: 'pl-PL' | 'en-US' = 'pl-PL') {
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = language;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
  }
  
  startListening(onResult: (text: string) => void) {
    // Implementation needed
  }
  
  stopListening() {
    // Implementation needed
  }
}
```

#### **Zadanie 2: Voice Command Processing**
```bash
# Lokalizacja: apps/api/src/services/voice/
# Pliki do stworzenia:
- command-parser.ts
- intent-classifier.ts
- entity-extractor.ts
```

**Wymagania:**
- Natural language understanding
- Intent classification (CREATE_PROJECT, GET_TASKS, etc.)
- Entity extraction (project names, dates, people)
- Context awareness
- Multi-turn conversations

#### **Zadanie 3: Voice Response Generation**
```bash
# Lokalizacja: apps/web/src/lib/voice/
# Pliki do stworzenia:
- text-to-speech.ts
- response-generator.ts
- personality-engine.ts
```

**Wymagania:**
- Natural sounding responses
- Personality control (1-10 sarcasm level)
- Context-appropriate tone
- SSML for voice modulation

#### **Zadanie 4: Vector Database Integration**
```bash
# Lokalizacja: packages/ai-engine/src/
# Pliki do stworzenia:
- vector-store.ts
- knowledge-retrieval.ts
- conversation-memory.ts
```

**Wymagania:**
- Store conversation history
- Semantic search through company data
- Context retrieval for responses
- Memory persistence

### **🔐 Enterprise Security (30 funkcji)**

#### **Zadanie 5: Advanced RBAC**
```bash
# Lokalizacja: apps/api/src/middleware/
# Pliki do modyfikacji/stworzenia:
- rbac.ts
- permissions.ts
- role-hierarchy.ts
```

**Wymagania:**
- Granular permissions system
- Role inheritance
- Dynamic policy evaluation
- Resource-based access control

#### **Zadanie 6: SOC2/ISO27001 Compliance**
```bash
# Lokalizacja: apps/api/src/services/compliance/
# Pliki do stworzenia:
- audit-logger.ts
- gdpr-tools.ts
- compliance-monitor.ts
```

**Wymagania:**
- Comprehensive audit logging
- GDPR compliance tools
- Data retention policies
- Automated compliance reporting

### **🏪 E-commerce Platform (25 funkcji)**

#### **Zadanie 7: Online Store Builder**
```bash
# Lokalizacja: apps/web/src/components/ecommerce/
# Pliki do stworzenia:
- store-builder/
- product-catalog/
- shopping-cart/
- payment-processing/
```

**Wymagania:**
- Drag-and-drop store builder
- Product catalog management
- Shopping cart functionality
- Payment gateway integration (Stripe)

---

## 🛠️ **Development Guidelines**

### **📋 Coding Standards**

#### **TypeScript Configuration**
```json
// tsconfig.json standardy
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### **Naming Conventions**
```typescript
// Files: kebab-case
voice-processor.ts
smart-goals-engine.ts

// Functions: camelCase
createProject()
analyzeTaskUrgency()

// Classes: PascalCase
class VoiceAssistant {}
class SMARTGoalsEngine {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_VOICE_RECORDING_TIME = 60000;
const DEFAULT_PERSONALITY_LEVEL = 5;
```

#### **Error Handling**
```typescript
// Use Result pattern dla better error handling
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

// Example usage
async function createProject(data: ProjectData): Promise<Result<Project>> {
  try {
    const project = await db.project.create({ data });
    return { success: true, data: project };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### **🔌 API Design Principles**

#### **RESTful Endpoints**
```typescript
// GTD Routes
GET    /api/gtd/inbox                 # Get inbox items
POST   /api/gtd/inbox                 # Add to inbox
GET    /api/gtd/next-actions          # Get next actions
POST   /api/gtd/tasks                 # Create task
PUT    /api/gtd/tasks/:id             # Update task
DELETE /api/gtd/tasks/:id             # Delete task

// Voice AI Routes  
POST   /api/voice/process-command     # Process voice command
POST   /api/voice/start-conversation  # Start new conversation
GET    /api/voice/conversation/:id    # Get conversation history
POST   /api/voice/speech-to-text      # Convert speech to text
POST   /api/voice/text-to-speech      # Convert text to speech

// CRM Routes
GET    /api/crm/companies             # List companies
POST   /api/crm/companies             # Create company
GET    /api/crm/deals/pipeline        # Get sales pipeline
POST   /api/crm/deals                 # Create deal
```

#### **Response Format Standards**
```typescript
// Standard API response format
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

// Example usage
{
  "success": true,
  "data": {
    "id": "proj_123",
    "name": "Konferencja Q4",
    "tasks": [...],
    "streams": [...]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_456"
  }
}
```

### **🗄️ Database Guidelines**

#### **Prisma Schema Conventions**
```prisma
// packages/database/prisma/schema.prisma

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  
  // GTD Integration
  gtdProjectId String?
  methodology  ProjectMethodology @default(KANBAN)
  
  // Streams Workflow
  streams     Stream[]
  tasks       Task[]
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  @@map("projects")
}
```

#### **Migration Naming**
```bash
# Format: YYYYMMDD_HHMMSS_description
20240115_143000_add_voice_ai_tables.sql
20240115_150000_add_personality_settings.sql
```

### **🧪 Testing Standards**

#### **Test Structure**
```typescript
// apps/api/src/__tests__/voice/voice-processor.test.ts
describe('VoiceProcessor', () => {
  describe('processCommand', () => {
    it('should create project from voice command', async () => {
      // Arrange
      const command = "Stwórz projekt konferencji Q4 dla zespołu sprzedaży";
      const mockUser = createMockUser();
      
      // Act
      const result = await voiceProcessor.processCommand(command, mockUser);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data.intent).toBe('CREATE_PROJECT');
      expect(result.data.entities.projectName).toBe('konferencji Q4');
    });
  });
});
```

#### **Test Coverage Requirements**
- **Unit tests**: 80%+ coverage dla core logic
- **Integration tests**: All API endpoints
- **E2E tests**: Critical user flows
- **Voice tests**: Speech recognition accuracy

---

## 🔧 **Development Environment Setup**

### **Environment Variables**
```bash
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/sorto_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
OPENAI_API_KEY="sk-your-openai-key"
GOOGLE_CLIENT_ID="your-google-client-id"
SLACK_BOT_TOKEN="xoxb-your-slack-token"

# Voice AI
SPEECH_API_KEY="your-speech-api-key"
VOICE_MODEL_ENDPOINT="https://api.voice-service.com"

# E-commerce
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### **Development Scripts**
```json
// package.json scripts
{
  "scripts": {
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:api\"",
    "dev:web": "cd apps/web && npm run dev",
    "dev:api": "cd apps/api && npm run dev",
    "build": "npm run build:web && npm run build:api",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "cd packages/database && npx prisma migrate dev",
    "db:generate": "cd packages/database && npx prisma generate",
    "db:seed": "cd packages/database && npx tsx seed.ts"
  }
}
```

---

## 📊 **Performance Requirements**

### **Response Time SLAs**
- **Voice command processing**: < 500ms
- **API responses**: < 200ms (95th percentile)
- **Database queries**: < 100ms (average)
- **AI analysis**: < 2s (sentiment, task detection)
- **Page load time**: < 3s (First Contentful Paint)

### **Scalability Targets**
- **Concurrent users**: 10,000+
- **API requests**: 100,000/minute
- **Voice commands**: 1,000/minute
- **Database**: Handle 100GB+ data
- **File storage**: Support TB-scale uploads

---

## 🔐 **Security Requirements**

### **Authentication & Authorization**
```typescript
// JWT payload structure
interface JWTPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  permissions: Permission[];
  sessionId: string;
  exp: number;
  iat: number;
}

// RBAC implementation
const checkPermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### **Data Protection**
- **Encryption**: AES-256 dla sensitive data
- **Hashing**: bcrypt dla passwords (12 rounds)
- **API Keys**: Rotate every 90 days
- **Sessions**: Redis z 24h TTL
- **Voice data**: Encrypted at rest, purged after 30 days

---

## 🚀 **Deployment Instructions**

### **Docker Configuration**
```dockerfile
# apps/web/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### **Production Environment**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
      - redis
      
  api:
    build: ./apps/api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - db
      - redis
      
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: sorto_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

---

## 🎯 **Immediate Next Steps**

### **Week 1-2: Voice AI Foundation**
1. Setup speech recognition infrastructure
2. Implement basic voice command parsing
3. Create voice response generation
4. Build conversation context management

### **Week 3-4: Advanced Voice Features**
1. Vector database integration
2. Personality engine implementation  
3. Context-aware responses
4. Voice tone modulation

### **Week 5-6: Enterprise Security**
1. Advanced RBAC system
2. Audit logging infrastructure
3. GDPR compliance tools
4. Security monitoring

### **Week 7-8: E-commerce Platform**
1. Store builder interface
2. Product catalog system
3. Shopping cart functionality
4. Payment processing integration

---

## 📝 **Documentation Standards**

### **Code Documentation**
```typescript
/**
 * Processes voice commands using natural language understanding
 * 
 * @param command - Raw voice command text
 * @param userId - User identifier for context
 * @param conversationId - Optional conversation context
 * @returns Promise resolving to processed command result
 * 
 * @example
 * ```typescript
 * const result = await processVoiceCommand(
 *   "Stwórz projekt konferencji Q4",
 *   "user_123",
 *   "conv_456"
 * );
 * ```
 */
export async function processVoiceCommand(
  command: string,
  userId: string,
  conversationId?: string
): Promise<VoiceCommandResult> {
  // Implementation...
}
```

### **API Documentation**
- **OpenAPI 3.0** specification
- **Interactive docs** via Swagger UI
- **Code examples** dla każdego endpoint
- **Error response** documentation
- **Rate limiting** information

---

## 🎯 **Success Metrics**

### **Development KPIs**
- **Code coverage**: >80%
- **Build time**: <5 minutes
- **Test suite**: <2 minutes
- **Deploy time**: <10 minutes
- **Bug resolution**: <24 hours

### **Feature Completion Tracking**
```typescript
// Track implementation progress
const phaseProgress = {
  phase4: {
    voiceAI: 0,        // 0/15 functions implemented
    security: 0,       // 0/30 functions implemented  
    ecommerce: 0,      // 0/25 functions implemented
    total: 0           // 0/80 functions implemented
  }
};
```

---

**🚀 Ready to build the future of business productivity! Let's make SORTO the most advanced CRM with Voice AI on the planet!**