# CRM-GTD SaaS Platform

A comprehensive SaaS platform combining CRM, GTD (Getting Things Done) methodology, and SMART goal management with AI-powered automation and multi-tenant architecture.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.17.0 or higher)
- **npm** (v9.0.0 or higher)
- **Docker** and **Docker Compose**
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd crm-gtd-smart
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd packages/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ../..
```

### 3. Environment Setup

```bash
# Copy environment files
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.local.example packages/frontend/.env.local

# Edit the .env files with your configuration
# The default values should work for development
```

### 4. Start Development Services

```bash
# Start PostgreSQL, Redis, and ClickHouse
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
```

### 5. Setup Database

```bash
# Navigate to backend
cd packages/backend

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed development data
npm run db:seed

cd ../..
```

### 6. Start Development Servers

```bash
# Start all services in development mode
npm run dev
```

This will start:
- **Backend API**: http://localhost:9027
- **Frontend App**: http://localhost:9025

### 🌐 Network Access

The application is configured to accept connections from your local network:

- **Frontend Network Access**: http://YOUR_LOCAL_IP:9025
- **Backend Network Access**: http://YOUR_LOCAL_IP:9027

Replace `YOUR_LOCAL_IP` with your machine's IP address (e.g., `192.168.1.17`).

To find your IP address:
```bash
# Linux/macOS
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr "IPv4"
```

## 🔑 Demo Credentials

Use these credentials to test the application:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@demo.com | Password123! |
| Admin | admin@demo.com | Password123! |
| Manager | manager@demo.com | Password123! |
| Member | member@demo.com | Password123! |

## 📱 Application URLs

- **Frontend (Main App)**: http://localhost:9025
- **Backend API**: http://localhost:9027
- **API Health Check**: http://localhost:9027/health
- **API Documentation**: http://localhost:9027/api/v1

### 🌐 Network URLs (replace with your IP)

- **Frontend Network**: http://192.168.1.17:9025
- **Backend Network**: http://192.168.1.17:9027
- **Health Check Network**: http://192.168.1.17:9027/health

## 🏗️ Project Structure

```
crm-gtd-smart/
├── packages/
│   ├── backend/                 # Node.js + Express + TypeScript API
│   │   ├── src/
│   │   │   ├── modules/         # Feature modules (auth, organizations, etc.)
│   │   │   ├── shared/          # Shared utilities and middleware
│   │   │   ├── config/          # Configuration and database setup
│   │   │   └── app.ts           # Main application entry point
│   │   ├── prisma/              # Database schema and migrations
│   │   └── package.json
│   │
│   └── frontend/                # Next.js 14 + TypeScript + Tailwind
│       ├── src/
│       │   ├── app/             # Next.js App Router pages
│       │   ├── components/      # Reusable React components
│       │   ├── lib/             # Utilities, API client, auth context
│       │   └── types/           # TypeScript type definitions
│       └── package.json
│
├── docker-compose.yml           # Development services
├── turbo.json                   # Turborepo configuration
└── package.json                 # Root package with workspaces
```

## 🛠️ Development Commands

### Root Commands (from project root)

```bash
# Start all services in development
npm run dev

# Build all packages
npm run build

# Run tests across all packages
npm run test

# Lint all packages
npm run lint

# Type check all packages
npm run type-check

# Clean all build artifacts
npm run clean
```

### Backend Commands (from packages/backend)

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Database commands
npm run db:generate     # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:seed        # Seed development data
npm run db:setup       # Full database setup

# Testing
npm run test           # Run tests
npm run test:watch     # Run tests in watch mode

# Code quality
npm run lint           # ESLint
npm run type-check     # TypeScript check
```

### Frontend Commands (from packages/frontend)

```bash
# Development server (port 9025)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Code quality
npm run lint           # Next.js lint
npm run type-check     # TypeScript check
```

### Docker Commands

```bash
# Start development services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild services
docker-compose build
```

#### Docker Services Configuration

The following services run on custom ports to avoid conflicts:

- **PostgreSQL**: Port 5434 (instead of default 5432)
- **Redis**: Port 6381 (instead of default 6379)  
- **ClickHouse HTTP**: Port 8124 (instead of default 8123)
- **ClickHouse TCP**: Port 9002 (instead of default 9000)

Connection strings are automatically configured in `.env` files.

## 🔧 Key Features Implemented

### ✅ Phase 0 (MVP Foundation) - COMPLETED

- **Multi-tenant SaaS Architecture**
  - Row Level Security (RLS) with PostgreSQL
  - Organization-based data isolation
  - Tenant-aware API endpoints

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (OWNER, ADMIN, MANAGER, MEMBER)
  - Secure password hashing with bcrypt

- **User Management**
  - User registration and login
  - Organization creation and management
  - User invitation system
  - Profile management

- **Core Infrastructure**
  - Express.js + TypeScript backend
  - Next.js 14 + TypeScript frontend
  - PostgreSQL with Prisma ORM
  - Redis for caching and sessions
  - Comprehensive error handling
  - Rate limiting and security middleware

- **Development Environment**
  - Docker Compose for local development
  - Hot reload for both frontend and backend
  - Database seeding with demo data
  - Environment configuration
  - TypeScript strict mode

## 🗄️ Database Schema

The application uses PostgreSQL with the following core entities:

- **Organizations**: Multi-tenant isolation
- **Users**: Team members with role-based access
- **Subscriptions**: SaaS billing and plan management
- **Streams**: GTD workflow organization
- **Tasks**: Individual action items with GTD contexts
- **Projects**: Collections of related tasks
- **Contacts**: CRM contact management
- **Meetings**: Scheduling and coordination

All tables include organization-level isolation using Row Level Security.

## 🔐 Security Features

- **Data Protection**
  - Row Level Security for multi-tenant isolation
  - JWT tokens with secure refresh mechanism
  - Password hashing with bcrypt (12 rounds)
  - CORS protection
  - Helmet.js security headers

- **API Security**
  - Rate limiting (Redis-based)
  - Input validation with Zod schemas
  - SQL injection prevention
  - XSS protection
  - Request/response logging

## 📊 Monitoring and Logging

- **Winston** for structured logging
- **Express Winston** for HTTP request logging
- **Sentry** integration ready (DSN configuration)
- **Health check** endpoint for monitoring
- **Performance** and error tracking

## 🚦 API Endpoints

### ✅ Tested & Working

#### Authentication
- `POST /api/v1/auth/register` - ✅ Register new organization
- `POST /api/v1/auth/login` - ✅ User login  
- `POST /api/v1/auth/refresh` - ✅ Refresh access token
- `GET /api/v1/auth/me` - ✅ Get current user profile
- `POST /api/v1/auth/logout` - User logout (requires token)

#### Organizations  
- `GET /api/v1/organizations` - ✅ Get organization details
- `PUT /api/v1/organizations` - Update organization (ADMIN/OWNER)
- `GET /api/v1/organizations/users` - List organization users (MANAGER+)
- `GET /api/v1/organizations/statistics` - Organization statistics (MANAGER+)

#### System
- `GET /health` - ✅ Health check endpoint
- `GET /api/v1` - ✅ API information and documentation

### 🔧 API Testing Examples

```bash
# Health check
curl http://localhost:9027/health

# User registration
curl -X POST http://localhost:9027/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "My Company",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@company.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "acceptTerms": true,
    "subscriptionPlan": "STARTER"
  }'

# User login
curl -X POST http://localhost:9027/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@company.com",
    "password": "SecurePass123"
  }'

# Get user profile (requires Bearer token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:9027/api/v1/auth/me

# Get organization details (requires Bearer token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:9027/api/v1/organizations
```

## 🔄 Next Development Phases

### Phase 1: Core GTD Features (Months 5-8)
- Task management with GTD contexts
- Project hierarchy and organization
- Stream management system
- Weekly review functionality

### Phase 2: SMART Analysis (Months 9-12)
- AI-powered SMART goal analysis
- Goal effectiveness scoring
- Improvement recommendations
- Progress tracking and analytics

### Phase 3: Advanced Features (Months 13-18)
- Advanced CRM capabilities
- Real-time collaboration
- Mobile application
- Advanced integrations

## 📝 Contributing

1. **Development Workflow**
   - Create feature branches from `main`
   - Use conventional commits
   - Write tests for new features
   - Update documentation

2. **Code Standards**
   - TypeScript strict mode
   - ESLint + Prettier formatting
   - Jest for testing
   - JSDoc for complex functions

3. **Testing**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests for critical user flows

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Restart Docker services
   docker-compose down
   docker-compose up -d
   
   # Wait 30 seconds, then try again
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :9027  # Backend
   lsof -i :9025  # Frontend
   
   # Kill the process or change ports in .env files
   ```

3. **Dependencies Issues**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Prisma Issues**
   ```bash
   # Reset and regenerate
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

### Getting Help

- Check the application logs in terminal
- Visit health check endpoints
- Review environment configuration
- Ensure all services are running

## 📄 License

This project is private and proprietary. All rights reserved.

---

**Built with ❤️ for maximum productivity and business growth.**