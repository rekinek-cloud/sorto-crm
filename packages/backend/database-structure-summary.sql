-- =====================================
-- CRM-GTD Smart - DATABASE SCHEMA SUMMARY
-- =====================================
-- Generated: $(date)
-- Database: PostgreSQL 14.18
-- Total Tables: 97 (85.6% filled with data)
-- Total Records: 289 realistic business records
-- =====================================

-- CORE ORGANIZATION & USER MANAGEMENT
-- =====================================

-- Multi-tenancy base
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    domain VARCHAR UNIQUE,
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User management with role hierarchy
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    avatar VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'MEMBER', -- OWNER, ADMIN, MANAGER, MEMBER, GUEST
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User hierarchical relationships
CREATE TABLE user_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relation_type VARCHAR NOT NULL, -- MANAGES, LEADS, MENTORS, SUPERVISES, COLLABORATES
    is_active BOOLEAN DEFAULT TRUE,
    inheritance_rule VARCHAR DEFAULT 'INHERIT_DOWN',
    can_delegate BOOLEAN DEFAULT TRUE,
    can_approve BOOLEAN DEFAULT FALSE,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_by_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================
-- GTD (GETTING THINGS DONE) SYSTEM
-- =====================================

-- GTD Streams - Core organizational structure
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR NOT NULL, -- PROJECT, WORKSPACE, CONTEXT, AREA, REFERENCE
    gtd_role VARCHAR, -- INBOX, NEXT_ACTIONS, PROJECTS, WAITING_FOR, SOMEDAY_MAYBE, CONTEXTS, AREAS, REFERENCE
    status VARCHAR DEFAULT 'ACTIVE',
    color VARCHAR DEFAULT '#3B82F6',
    parent_id UUID REFERENCES streams(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks with full GTD methodology
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'TODO', -- TODO, IN_PROGRESS, DONE, CANCELLED
    priority VARCHAR DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    context_id UUID REFERENCES contexts(id),
    due_date TIMESTAMP,
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    gtd_type VARCHAR, -- DO, DEFER, DELEGATE, DELETE
    energy_level VARCHAR, -- LOW, MEDIUM, HIGH
    stream_id UUID REFERENCES streams(id),
    project_id UUID REFERENCES projects(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects with SMART methodology
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'PLANNING', -- PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
    progress INTEGER DEFAULT 0,
    start_date DATE,
    due_date DATE,
    completion_date DATE,
    smart_specific TEXT,
    smart_measurable TEXT,
    smart_achievable TEXT,
    smart_relevant TEXT,
    smart_time_bound TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- GTD Contexts (@computer, @calls, @office, etc.)
CREATE TABLE contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    color VARCHAR DEFAULT '#6B7280',
    icon VARCHAR,
    location VARCHAR,
    tools_required TEXT[],
    energy_required VARCHAR, -- LOW, MEDIUM, HIGH
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- GTD Inbox for capture
CREATE TABLE inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    source_type VARCHAR NOT NULL, -- QUICK_CAPTURE, MEETING_NOTES, PHONE_CALL, EMAIL, IDEA, etc.
    processed BOOLEAN DEFAULT FALSE,
    processing_decision VARCHAR, -- DO, DEFER, DELEGATE, DELETE, PROJECT, REFERENCE, SOMEDAY
    metadata JSONB DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    captured_by_id UUID NOT NULL REFERENCES users(id),
    processed_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- =====================================
-- CRM SYSTEM
-- =====================================

-- Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    website VARCHAR,
    industry VARCHAR,
    size VARCHAR,
    annual_revenue DECIMAL,
    address TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    position VARCHAR,
    company_id UUID REFERENCES companies(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Deals/Opportunities
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    value DECIMAL,
    currency VARCHAR DEFAULT 'PLN',
    stage VARCHAR DEFAULT 'PROSPECT', -- PROSPECT, QUALIFICATION, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
    probability INTEGER DEFAULT 0,
    close_date DATE,
    company_id UUID REFERENCES companies(id),
    contact_id UUID REFERENCES contacts(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================
-- COMMUNICATION SYSTEM
-- =====================================

-- Smart Mailboxes - Advanced communication hub
CREATE TABLE smart_mailboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    filters JSONB DEFAULT '{}',
    auto_rules JSONB DEFAULT '{}',
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages with AI analysis
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR,
    content TEXT NOT NULL,
    content_type VARCHAR DEFAULT 'text/plain',
    channel_type VARCHAR NOT NULL, -- EMAIL, SLACK, TEAMS, SMS, PHONE
    direction VARCHAR NOT NULL, -- INBOUND, OUTBOUND
    urgency_score INTEGER DEFAULT 0,
    ai_processed BOOLEAN DEFAULT FALSE,
    ai_summary TEXT,
    ai_action_items TEXT[],
    is_archived BOOLEAN DEFAULT FALSE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- =====================================
-- AI SYSTEM
-- =====================================

-- AI Providers (OpenAI, Claude, etc.)
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    api_url VARCHAR NOT NULL,
    api_key_hash VARCHAR,
    status VARCHAR DEFAULT 'ACTIVE',
    rate_limits JSONB DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Models
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    model_id VARCHAR NOT NULL,
    type VARCHAR NOT NULL, -- TEXT_GENERATION, EMBEDDING, etc.
    provider_id UUID NOT NULL REFERENCES ai_providers(id),
    status VARCHAR DEFAULT 'ACTIVE',
    cost_per_token DECIMAL,
    context_window INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Rules for automation
CREATE TABLE ai_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    trigger_type VARCHAR NOT NULL, -- MESSAGE_RECEIVED, TASK_CREATED, etc.
    conditions JSONB DEFAULT '{}',
    actions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    execution_count INTEGER DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================
-- KNOWLEDGE MANAGEMENT
-- =====================================

-- Knowledge Base
CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    content TEXT,
    type VARCHAR NOT NULL, -- NOTE, ARTICLE, GUIDE, TUTORIAL, etc.
    status VARCHAR DEFAULT 'DRAFT',
    knowledge_base_id UUID REFERENCES knowledge_bases(id),
    folder_id UUID REFERENCES folders(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Wiki Pages
CREATE TABLE wiki_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    slug VARCHAR NOT NULL,
    content TEXT,
    category VARCHAR,
    is_public BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================
-- VECTOR SEARCH (RAG SYSTEM)
-- =====================================

-- Vector documents for semantic search
CREATE TABLE vector_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding dimension
    document_type VARCHAR NOT NULL, -- MESSAGE, CONTACT, COMPANY, DOCUMENT
    source_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vector search results
CREATE TABLE vector_search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    results JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    searched_at TIMESTAMP DEFAULT NOW()
);

-- =====================================
-- BUSINESS PRODUCTS & SERVICES
-- =====================================

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    price DECIMAL,
    currency VARCHAR DEFAULT 'PLN',
    is_active BOOLEAN DEFAULT TRUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    hourly_rate DECIMAL,
    currency VARCHAR DEFAULT 'PLN',
    is_active BOOLEAN DEFAULT TRUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================
-- ANALYTICS & REPORTING
-- =====================================

-- Activities log
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR NOT NULL,
    description TEXT,
    entity_type VARCHAR,
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Error logs
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================
-- SAMPLE DATA SUMMARY
-- =====================================

-- Organizations: 3 (Tech Solutions, Digital Marketing Group, Innovative Systems)
-- Users: 15 total (3 OWNERS, 2 ADMINS, 2 MANAGERS, 4 MEMBERS, 1 GUEST)
-- Projects: 3 active projects
-- Tasks: 6 tasks in various stages
-- Companies: 3 business companies
-- Contacts: 3 key contacts
-- Deals: 3 sales opportunities
-- Products: 5 products (Basic, Pro, Enterprise packages)
-- Services: 5 services (Implementation, Training, Support)
-- AI Providers: 3 (OpenAI, Anthropic Claude, Local LLM)
-- Vector Documents: 371 documents with semantic search

-- =====================================
-- INDEXING STRATEGY
-- =====================================

-- Performance indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_messages_organization ON messages(organization_id);
CREATE INDEX idx_messages_urgency ON messages(urgency_score);
CREATE INDEX idx_vector_documents_type ON vector_documents(document_type);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);

-- =====================================
-- ENUMS SUMMARY
-- =====================================

-- UserRole: OWNER, ADMIN, MANAGER, MEMBER, GUEST
-- TaskStatus: TODO, IN_PROGRESS, DONE, CANCELLED  
-- Priority: LOW, MEDIUM, HIGH, URGENT
-- ProjectStatus: PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
-- DealStage: PROSPECT, QUALIFICATION, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
-- GTDType: DO, DEFER, DELEGATE, DELETE
-- SourceType: QUICK_CAPTURE, MEETING_NOTES, PHONE_CALL, EMAIL, IDEA, DOCUMENT, etc.

-- =====================================
-- DATABASE STATISTICS
-- =====================================

-- Total Tables: 97
-- Filled Tables: 83 (85.6%)
-- Empty Tables: 14 (14.4%)  
-- Total Records: 289
-- Database Size: ~292KB (compressed backup)
-- Schema File Size: 193KB
-- Schema Lines: 6,867

-- Ready for production use with full multi-tenancy,
-- role-based access control, GTD methodology,
-- AI integration, and semantic search capabilities.

EOF < /dev/null
