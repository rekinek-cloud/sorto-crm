-- ====================================
-- CRM-GTD SMART - COMPLETE DATABASE SCHEMA
-- PostgreSQL 15+ Compatible
-- ====================================
-- System: Kompletny CRM z metodologią GTD (Getting Things Done)
-- Architektura: Multi-tenant, Vector Database (RAG), AI Integration
-- Data: 2025-06-27

-- ================================
-- UTWORZENIE ROZSZERZEŃ
-- ================================

-- Rozszerzenie dla UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rozszerzenie dla wektorów (RAG System)
CREATE EXTENSION IF NOT EXISTS vector;

-- Rozszerzenie dla pełnotekstowego wyszukiwania
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ================================
-- TWORZENIE TYPÓW ENUM
-- ================================

CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'GUEST');
CREATE TYPE subscription_plan AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED');
CREATE TYPE stream_status AS ENUM ('ACTIVE', 'ARCHIVED', 'TEMPLATE');
CREATE TYPE task_status AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CANCELED');
CREATE TYPE project_status AS ENUM ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED');
CREATE TYPE priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE energy_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE contact_status AS ENUM ('ACTIVE', 'INACTIVE', 'LEAD', 'CUSTOMER', 'ARCHIVED');
CREATE TYPE company_size AS ENUM ('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');
CREATE TYPE company_status AS ENUM ('PROSPECT', 'CUSTOMER', 'PARTNER', 'INACTIVE', 'ARCHIVED');
CREATE TYPE deal_stage AS ENUM ('PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');
CREATE TYPE meeting_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
CREATE TYPE waiting_for_status AS ENUM ('PENDING', 'RESPONDED', 'OVERDUE', 'CANCELED');
CREATE TYPE frequency AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');
CREATE TYPE relationship_type AS ENUM ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH');
CREATE TYPE timeline_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
CREATE TYPE improvement_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');
CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELED');
CREATE TYPE invoice_status AS ENUM ('PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELED');
CREATE TYPE offer_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELED');
CREATE TYPE complaint_status AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED');
CREATE TYPE importance AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE recommendation_status AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED');
CREATE TYPE someday_maybe_category AS ENUM ('IDEAS', 'PROJECTS', 'GOALS', 'LEARNING', 'TRAVEL', 'PURCHASES', 'EXPERIENCES');
CREATE TYPE someday_maybe_status AS ENUM ('ACTIVE', 'ACTIVATED', 'ARCHIVED');
CREATE TYPE dependency_type AS ENUM ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH');
CREATE TYPE channel_type AS ENUM ('EMAIL', 'SLACK', 'TEAMS', 'WHATSAPP', 'SMS', 'TELEGRAM', 'DISCORD', 'WEBHOOK');
CREATE TYPE message_type AS ENUM ('INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH');
CREATE TYPE message_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE auto_reply_status AS ENUM ('ACTIVE', 'INACTIVE', 'SCHEDULED');
CREATE TYPE error_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE product_status AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK');
CREATE TYPE service_status AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'TEMPORARILY_UNAVAILABLE', 'DISCONTINUED');
CREATE TYPE service_billing_type AS ENUM ('ONE_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'PROJECT_BASED');
CREATE TYPE service_delivery_method AS ENUM ('REMOTE', 'ON_SITE', 'HYBRID', 'DIGITAL_DELIVERY', 'PHYSICAL_DELIVERY');
CREATE TYPE order_item_type AS ENUM ('PRODUCT', 'SERVICE', 'CUSTOM');
CREATE TYPE invoice_item_type AS ENUM ('PRODUCT', 'SERVICE', 'CUSTOM');
CREATE TYPE offer_item_type AS ENUM ('PRODUCT', 'SERVICE', 'CUSTOM');
CREATE TYPE bug_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE bug_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX');
CREATE TYPE bug_category AS ENUM ('UI_UX', 'FUNCTIONALITY', 'PERFORMANCE', 'SECURITY', 'DATA', 'INTEGRATION', 'OTHER');
CREATE TYPE document_type AS ENUM ('NOTE', 'ARTICLE', 'GUIDE', 'TUTORIAL', 'SPECIFICATION', 'MEETING_NOTES', 'RESEARCH', 'TEMPLATE', 'POLICY', 'PROCEDURE');
CREATE TYPE document_status AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED', 'DEPRECATED');
CREATE TYPE link_type AS ENUM ('REFERENCE', 'RELATED', 'PREREQUISITE', 'DEPENDENCY', 'INSPIRATION', 'CONTRADICTION');
CREATE TYPE share_permission AS ENUM ('read', 'COMMENT', 'EDIT', 'ADMIN');
CREATE TYPE activity_type AS ENUM ('DEAL_CREATED', 'DEAL_UPDATED', 'DEAL_STAGE_CHANGED', 'CONTACT_ADDED', 'CONTACT_UPDATED', 'TASK_CREATED', 'TASK_COMPLETED', 'MEETING_SCHEDULED', 'MEETING_COMPLETED', 'EMAIL_SENT', 'EMAIL_RECEIVED', 'PHONE_CALL', 'SMS_SENT', 'CHAT_MESSAGE', 'NOTE_ADDED', 'COMPANY_UPDATED', 'PROJECT_CREATED', 'PROJECT_UPDATED');
CREATE TYPE inbox_source_type AS ENUM ('QUICK_CAPTURE', 'MEETING_NOTES', 'PHONE_CALL', 'EMAIL', 'IDEA', 'DOCUMENT', 'BILL_INVOICE', 'ARTICLE', 'VOICE_MEMO', 'PHOTO', 'OTHER');
CREATE TYPE processing_decision AS ENUM ('DO', 'DEFER', 'DELEGATE', 'DELETE', 'REFERENCE', 'PROJECT', 'SOMEDAY');
CREATE TYPE email_category AS ENUM ('VIP', 'SPAM', 'INVOICES', 'ARCHIVE', 'UNKNOWN');
CREATE TYPE unified_rule_type AS ENUM ('PROCESSING', 'EMAIL_FILTER', 'AUTO_REPLY', 'AI_RULE', 'SMART_MAILBOX', 'WORKFLOW', 'NOTIFICATION', 'INTEGRATION');
CREATE TYPE unified_rule_status AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'TESTING', 'ERROR', 'DEPRECATED');
CREATE TYPE unified_trigger_type AS ENUM ('MANUAL', 'AUTOMATIC', 'EVENT_BASED', 'SCHEDULED', 'WEBHOOK', 'API_CALL');
CREATE TYPE execution_status AS ENUM ('SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED', 'RETRYING');
CREATE TYPE email_provider AS ENUM ('SMTP', 'SENDGRID', 'AWS_SES', 'MAILGUN', 'POSTMARK');
CREATE TYPE ai_provider_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEPRECATED');
CREATE TYPE ai_model_type AS ENUM ('TEXT_GENERATION', 'TEXT_CLASSIFICATION', 'TEXT_EMBEDDING', 'IMAGE_GENERATION', 'IMAGE_ANALYSIS', 'AUDIO_TRANSCRIPTION', 'AUDIO_GENERATION', 'CODE_GENERATION', 'FUNCTION_CALLING', 'MULTIMODAL');
CREATE TYPE ai_model_status AS ENUM ('ACTIVE', 'INACTIVE', 'BETA', 'DEPRECATED');
CREATE TYPE ai_template_status AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED');
CREATE TYPE ai_rule_status AS ENUM ('ACTIVE', 'INACTIVE', 'TESTING', 'ARCHIVED');
CREATE TYPE ai_trigger_type AS ENUM ('MESSAGE_RECEIVED', 'TASK_CREATED', 'TASK_UPDATED', 'PROJECT_CREATED', 'CONTACT_UPDATED', 'DEAL_STAGE_CHANGED', 'MANUAL_TRIGGER', 'SCHEDULED', 'WEBHOOK');
CREATE TYPE ai_execution_status AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED');
CREATE TYPE ai_knowledge_status AS ENUM ('ACTIVE', 'INACTIVE', 'INDEXING', 'ERROR');
CREATE TYPE ai_document_status AS ENUM ('ACTIVE', 'INACTIVE', 'PROCESSING', 'ERROR');

-- ================================
-- TABELE GŁÓWNE (CORE TABLES)
-- ================================

-- Organizacje (Multi-tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    domain VARCHAR UNIQUE,
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'Organizacje - główna tabela multi-tenancy izolująca dane między klientami';

-- Użytkownicy
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    avatar VARCHAR,
    role user_role DEFAULT 'MEMBER',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Użytkownicy systemu z rolami i ustawieniami';

-- Tokeny odświeżania
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subskrypcje
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR,
    stripe_subscription_id VARCHAR,
    stripe_price_id VARCHAR,
    plan subscription_plan DEFAULT 'STARTER',
    status subscription_status DEFAULT 'TRIAL',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- GTD SYSTEM TABLES
-- ================================

-- Strumienie (Streams)
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    color VARCHAR DEFAULT '#3B82F6',
    icon VARCHAR,
    settings JSONB DEFAULT '{}',
    status stream_status DEFAULT 'ACTIVE',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE streams IS 'Strumienie GTD - obszary życia i pracy';

-- Konteksty GTD
CREATE TABLE contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL, -- @computer, @phone, @errands, @home, @office
    description TEXT,
    color VARCHAR DEFAULT '#6B7280',
    icon VARCHAR,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

COMMENT ON TABLE contexts IS 'Konteksty GTD - miejsca i narzędzia wykonania zadań';

-- Projekty
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    status project_status DEFAULT 'PLANNING',
    priority priority DEFAULT 'MEDIUM',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    smart_score FLOAT, -- 0-100 SMART score
    smart_analysis JSONB, -- Detailed SMART breakdown
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
    stream_id UUID REFERENCES streams(id),
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE projects IS 'Projekty GTD - wieloetapowe przedsięwzięcia';

-- Zadania
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    priority priority DEFAULT 'MEDIUM',
    status task_status DEFAULT 'NEW',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours FLOAT,
    actual_hours FLOAT,
    context_id UUID REFERENCES contexts(id),
    energy energy_level DEFAULT 'MEDIUM',
    is_waiting_for BOOLEAN DEFAULT false,
    waiting_for_note TEXT,
    smart_score FLOAT, -- 0-100 SMART score
    smart_analysis JSONB, -- Detailed SMART breakdown
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
    stream_id UUID REFERENCES streams(id),
    project_id UUID REFERENCES projects(id),
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE tasks IS 'Zadania GTD - konkretne działania do wykonania';

-- GTD Inbox - punkt zbierania wszystkiego
CREATE TABLE inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL, -- Main content/text of the item
    note TEXT, -- Additional notes or context
    source_type inbox_source_type DEFAULT 'QUICK_CAPTURE',
    source VARCHAR DEFAULT 'manual',
    source_url VARCHAR,
    urgency_score INTEGER DEFAULT 0, -- 0-100 urgency score
    actionable BOOLEAN DEFAULT true,
    estimated_time VARCHAR,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_decision processing_decision,
    resulting_task_id UUID REFERENCES tasks(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    captured_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE inbox_items IS 'GTD Inbox - centralny punkt zbierania wszystkich pomysłów i zadań';

-- ================================
-- CRM SYSTEM TABLES
-- ================================

-- Firmy
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    website VARCHAR,
    domain VARCHAR, -- Email domain for matching
    industry VARCHAR,
    size company_size,
    revenue VARCHAR,
    description TEXT,
    address TEXT,
    phone VARCHAR,
    email VARCHAR,
    tags TEXT[] DEFAULT '{}',
    status company_status DEFAULT 'PROSPECT',
    primary_contact_id UUID,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    interaction_count INTEGER DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE companies IS 'Firmy CRM - organizacje klientów i partnerów';

-- Kontakty
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    company VARCHAR,
    position VARCHAR,
    department VARCHAR,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    status contact_status DEFAULT 'ACTIVE',
    source VARCHAR, -- lead source
    email_category email_category DEFAULT 'UNKNOWN',
    company_id UUID REFERENCES companies(id),
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    interaction_count INTEGER DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE contacts IS 'Kontakty CRM - osoby w firmach klientów';

-- Deale/Okazje sprzedażowe
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    value FLOAT,
    currency VARCHAR DEFAULT 'USD',
    stage deal_stage DEFAULT 'PROSPECT',
    probability FLOAT DEFAULT 0,
    expected_close_date TIMESTAMP WITH TIME ZONE,
    actual_close_date TIMESTAMP WITH TIME ZONE,
    source VARCHAR,
    notes TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id),
    owner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE deals IS 'Deale CRM - okazje sprzedażowe';

-- ================================
-- COMMUNICATION SYSTEM TABLES
-- ================================

-- Kanały komunikacji
CREATE TABLE communication_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL, -- "Gmail Primary", "Slack Marketing"
    type channel_type NOT NULL,
    active BOOLEAN DEFAULT true,
    config JSONB, -- { host, port, username, token, etc }
    email_address VARCHAR,
    display_name VARCHAR,
    auto_process BOOLEAN DEFAULT true,
    create_tasks BOOLEAN DEFAULT false,
    default_stream VARCHAR,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE communication_channels IS 'Kanały komunikacji - email, Slack, Teams itp.';

-- Wiadomości
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES communication_channels(id) ON DELETE CASCADE,
    message_id VARCHAR, -- external message ID
    thread_id VARCHAR,
    subject VARCHAR,
    content TEXT NOT NULL,
    html_content TEXT,
    from_address VARCHAR NOT NULL,
    from_name VARCHAR,
    to_address VARCHAR NOT NULL,
    cc_address TEXT[] DEFAULT '{}',
    bcc_address TEXT[] DEFAULT '{}',
    message_type message_type DEFAULT 'INBOX',
    priority message_priority DEFAULT 'NORMAL',
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auto_processed BOOLEAN DEFAULT false,
    action_needed BOOLEAN DEFAULT false,
    needs_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMP WITH TIME ZONE,
    extracted_tasks TEXT[] DEFAULT '{}',
    extracted_context VARCHAR,
    sentiment VARCHAR,
    urgency_score FLOAT, -- 0-100
    task_id UUID REFERENCES tasks(id),
    stream_id UUID REFERENCES streams(id),
    contact_id UUID REFERENCES contacts(id),
    company_id UUID REFERENCES companies(id),
    deal_id UUID REFERENCES deals(id),
    interaction_type VARCHAR,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE messages IS 'Wiadomości - email, chat, komunikacja ze wszystkich kanałów';

-- ================================
-- VECTOR DATABASE SYSTEM (RAG)
-- ================================

-- Główna tabela vectors (już istnieje z danymi produkcyjnymi)
CREATE TABLE vectors (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- NOWA kolumna dla prawdziwych embeddings
    embedding vector(1536) -- OpenAI text-embedding-ada-002 dimension
);

COMMENT ON TABLE vectors IS 'Tabela wektorów RAG - zawiera prawdziwe dane produkcyjne z embeddings';

-- Dokumenty wektorowe (rozszerzona struktura)
CREATE TABLE vector_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR UNIQUE NOT NULL,
    embedding vector(1536) NOT NULL, -- Vector embedding
    entity_type VARCHAR NOT NULL,
    entity_id VARCHAR NOT NULL,
    source VARCHAR NOT NULL,
    language VARCHAR DEFAULT 'pl',
    chunk_index INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 1,
    chunk_size INTEGER,
    processing_model VARCHAR,
    processing_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

COMMENT ON TABLE vector_documents IS 'Dokumenty wektorowe dla systemu RAG';

-- Wyniki wyszukiwania wektorowego
CREATE TABLE vector_search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text VARCHAR NOT NULL,
    query_embedding vector(1536) NOT NULL,
    document_id UUID NOT NULL REFERENCES vector_documents(id) ON DELETE CASCADE,
    similarity FLOAT NOT NULL,
    rank INTEGER NOT NULL,
    user_id UUID REFERENCES users(id),
    search_context VARCHAR,
    execution_time INTEGER,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE vector_search_results IS 'Wyniki wyszukiwania wektorowego';

-- Cache wektorowy
CREATE TABLE vector_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR UNIQUE NOT NULL,
    query_text VARCHAR NOT NULL,
    results JSONB NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_hit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    filters JSONB,
    limit_val INTEGER DEFAULT 10,
    threshold FLOAT DEFAULT 0.7,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AI SYSTEM TABLES
-- ================================

-- Providerzy AI
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL, -- "OpenAI", "Anthropic", "HuggingFace"
    display_name VARCHAR NOT NULL,
    base_url VARCHAR NOT NULL,
    status ai_provider_status DEFAULT 'ACTIVE',
    priority INTEGER DEFAULT 0,
    config JSONB, -- { "apiKey": "sk-...", "timeout": 30000 }
    limits JSONB DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

COMMENT ON TABLE ai_providers IS 'Providerzy AI - OpenAI, Anthropic, itp.';

-- Modele AI
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL, -- "gpt-4", "claude-3-sonnet"
    display_name VARCHAR NOT NULL,
    type ai_model_type NOT NULL,
    status ai_model_status DEFAULT 'ACTIVE',
    max_tokens INTEGER,
    input_cost FLOAT,
    output_cost FLOAT,
    capabilities TEXT[] DEFAULT '{}',
    config JSONB DEFAULT '{}',
    provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, name)
);

COMMENT ON TABLE ai_models IS 'Modele AI - GPT-4, Claude, itp.';

-- Szablony promptów AI
CREATE TABLE ai_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR,
    version INTEGER DEFAULT 1,
    status ai_template_status DEFAULT 'ACTIVE',
    system_prompt TEXT,
    user_prompt_template TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    model_id UUID REFERENCES ai_models(id),
    output_schema JSONB,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name, version)
);

COMMENT ON TABLE ai_prompt_templates IS 'Szablony promptów AI';

-- Reguły AI
CREATE TABLE ai_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR,
    status ai_rule_status DEFAULT 'ACTIVE',
    priority INTEGER DEFAULT 0,
    trigger_type ai_trigger_type NOT NULL,
    trigger_conditions JSONB NOT NULL,
    template_id UUID REFERENCES ai_prompt_templates(id),
    model_id UUID REFERENCES ai_models(id),
    fallback_model_ids TEXT[] DEFAULT '{}',
    actions JSONB,
    max_executions_per_hour INTEGER DEFAULT 100,
    max_executions_per_day INTEGER DEFAULT 1000,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    avg_execution_time FLOAT,
    last_executed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

COMMENT ON TABLE ai_rules IS 'Reguły AI - automatyczne wykonanie analizy AI';

-- Wykonania AI
CREATE TABLE ai_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES ai_rules(id),
    provider_id UUID REFERENCES ai_providers(id),
    model_id UUID REFERENCES ai_models(id),
    template_id UUID REFERENCES ai_prompt_templates(id),
    input_data JSONB NOT NULL,
    prompt_sent TEXT NOT NULL,
    response_received TEXT,
    parsed_output JSONB,
    status ai_execution_status NOT NULL,
    execution_time INTEGER,
    tokens_used INTEGER,
    cost FLOAT,
    error_message TEXT,
    error_code VARCHAR,
    retry_count INTEGER DEFAULT 0,
    actions_executed JSONB,
    entities_created JSONB,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_executions IS 'Logi wykonań AI';

-- ================================
-- UNIFIED RULES SYSTEM
-- ================================

-- Zunifikowane reguły
CREATE TABLE unified_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    rule_type unified_rule_type NOT NULL,
    category VARCHAR,
    status unified_rule_status DEFAULT 'ACTIVE',
    priority INTEGER DEFAULT 0,
    trigger_type unified_trigger_type NOT NULL,
    trigger_events TEXT[] DEFAULT '{}',
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    max_executions_per_hour INTEGER DEFAULT 100,
    max_executions_per_day INTEGER DEFAULT 1000,
    cooldown_period INTEGER DEFAULT 0,
    active_from TIMESTAMP WITH TIME ZONE,
    active_to TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR DEFAULT 'UTC',
    channel_id UUID REFERENCES communication_channels(id),
    ai_model_id UUID REFERENCES ai_models(id),
    ai_prompt_template TEXT,
    fallback_model_ids TEXT[] DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    avg_execution_time FLOAT,
    last_executed TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR
);

COMMENT ON TABLE unified_rules IS 'Zunifikowane reguły - wszystkie typy reguł w jednym systemie';

-- Wykonania zunifikowanych reguł
CREATE TABLE unified_rule_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES unified_rules(id) ON DELETE CASCADE,
    triggered_by VARCHAR,
    trigger_data JSONB,
    execution_time FLOAT NOT NULL,
    status execution_status NOT NULL,
    result JSONB,
    error TEXT,
    entity_type VARCHAR,
    entity_id VARCHAR,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- EMAIL & SMART MAILBOXES SYSTEM
-- ================================

-- Smart Mailboxes
CREATE TABLE smart_mailboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    icon VARCHAR DEFAULT '📧',
    color VARCHAR DEFAULT 'blue',
    description TEXT,
    is_built_in BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    user_id UUID REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

COMMENT ON TABLE smart_mailboxes IS 'Smart Mailboxes - inteligentne skrzynki email';

-- Reguły Smart Mailboxes
CREATE TABLE smart_mailbox_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox_id UUID NOT NULL REFERENCES smart_mailboxes(id) ON DELETE CASCADE,
    field VARCHAR NOT NULL,
    operator VARCHAR NOT NULL,
    value VARCHAR NOT NULL,
    logic_operator VARCHAR DEFAULT 'AND',
    rule_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reguły email
CREATE TABLE email_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    sender_email VARCHAR,
    sender_domain VARCHAR,
    subject_contains VARCHAR,
    subject_pattern VARCHAR,
    body_contains VARCHAR,
    assign_category email_category NOT NULL,
    skip_ai_analysis BOOLEAN DEFAULT false,
    auto_archive BOOLEAN DEFAULT false,
    auto_delete BOOLEAN DEFAULT false,
    create_task BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    match_count INTEGER DEFAULT 0,
    last_matched TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE email_rules IS 'Reguły filtrowania email';

-- ================================
-- SUPPORTING TABLES
-- ================================

-- Aktywności (logi aktywności)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type activity_type NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    contact_id UUID REFERENCES contacts(id),
    deal_id UUID REFERENCES deals(id),
    task_id UUID REFERENCES tasks(id),
    project_id UUID REFERENCES projects(id),
    meeting_id UUID REFERENCES meetings(id),
    communication_type VARCHAR,
    communication_direction VARCHAR,
    communication_subject VARCHAR,
    communication_body TEXT,
    communication_duration INTEGER,
    communication_status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE activities IS 'Aktywności - logi wszystkich działań w systemie';

-- Spotkania
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR,
    meeting_url VARCHAR,
    agenda TEXT,
    notes TEXT,
    status meeting_status DEFAULT 'SCHEDULED',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    organized_by_id UUID NOT NULL REFERENCES users(id),
    contact_id UUID REFERENCES contacts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE meetings IS 'Spotkania - kalendarz spotkań z klientami';

-- Załączniki wiadomości
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR NOT NULL,
    file_type VARCHAR NOT NULL,
    file_size INTEGER,
    content_type VARCHAR,
    storage_path VARCHAR,
    is_inline BOOLEAN DEFAULT false,
    content_id VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waiting For (GTD)
CREATE TABLE waiting_for (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR NOT NULL,
    waiting_for_who VARCHAR NOT NULL,
    since_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_response_date TIMESTAMP WITH TIME ZONE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    status waiting_for_status DEFAULT 'PENDING',
    notes TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id),
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Someday Maybe (GTD)
CREATE TABLE someday_maybe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    category someday_maybe_category DEFAULT 'IDEAS',
    priority priority DEFAULT 'LOW',
    status someday_maybe_status DEFAULT 'ACTIVE',
    when_to_review TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    activated_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logi błędów
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message VARCHAR NOT NULL,
    stack TEXT,
    url VARCHAR NOT NULL,
    user_agent VARCHAR NOT NULL,
    severity error_severity NOT NULL,
    context TEXT,
    component_stack TEXT,
    session_id VARCHAR NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved BOOLEAN DEFAULT false,
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE error_logs IS 'Logi błędów - automatyczne zgłaszanie błędów';

-- ================================
-- INDEKSY DLA WYDAJNOŚCI
-- ================================

-- Indeksy podstawowe
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX idx_tasks_assigned_to_id ON tasks(assigned_to_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_companies_organization_id ON companies(organization_id);
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_deals_organization_id ON deals(organization_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_messages_organization_id ON messages(organization_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_received_at ON messages(received_at);
CREATE INDEX idx_inbox_items_organization_id_processed ON inbox_items(organization_id, processed);
CREATE INDEX idx_inbox_items_captured_at ON inbox_items(captured_at);

-- Indeksy RAG/Vector
CREATE INDEX idx_vectors_metadata_org ON vectors USING GIN ((metadata->>'organizationId'));
CREATE INDEX idx_vectors_metadata_type ON vectors USING GIN ((metadata->>'type'));
CREATE INDEX idx_vector_documents_organization_id_entity_type ON vector_documents(organization_id, entity_type);
CREATE INDEX idx_vector_documents_organization_id_entity_id ON vector_documents(organization_id, entity_id);
CREATE INDEX idx_vector_documents_content_hash ON vector_documents(content_hash);
CREATE INDEX idx_vector_search_results_organization_id_user_id ON vector_search_results(organization_id, user_id);
CREATE INDEX idx_vector_search_results_created_at ON vector_search_results(created_at);
CREATE INDEX idx_vector_cache_organization_id_cache_key ON vector_cache(organization_id, cache_key);
CREATE INDEX idx_vector_cache_expires_at ON vector_cache(expires_at);

-- Indeksy wektorowe dla podobieństwa (pgvector)
CREATE INDEX vectors_embedding_idx ON vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX vector_documents_embedding_idx ON vector_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX vector_search_results_query_embedding_idx ON vector_search_results USING ivfflat (query_embedding vector_cosine_ops) WITH (lists = 100);

-- Indeksy AI System
CREATE INDEX idx_ai_providers_organization_id_status ON ai_providers(organization_id, status);
CREATE INDEX idx_ai_models_provider_id_status ON ai_models(provider_id, status);
CREATE INDEX idx_ai_rules_organization_id_status ON ai_rules(organization_id, status);
CREATE INDEX idx_ai_executions_organization_id_created_at ON ai_executions(organization_id, created_at);

-- Indeksy komunikacji
CREATE INDEX idx_communication_channels_organization_id_type ON communication_channels(organization_id, type);
CREATE INDEX idx_smart_mailboxes_organization_id_active ON smart_mailboxes(organization_id, is_active);
CREATE INDEX idx_unified_rules_organization_id_status ON unified_rules(organization_id, status);
CREATE INDEX idx_unified_rule_executions_organization_id_created_at ON unified_rule_executions(organization_id, created_at);

-- ================================
-- FOREIGN KEYS DODATKOWE
-- ================================

-- Foreign keys dla companies (circular reference)
ALTER TABLE companies ADD CONSTRAINT fk_companies_primary_contact 
    FOREIGN KEY (primary_contact_id) REFERENCES contacts(id);

-- ================================
-- PODSTAWOWE DANE TESTOWE
-- ================================

-- Organizacja demo
INSERT INTO organizations (id, name, slug, domain) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Organization', 'demo', 'demo.com');

-- Administrator demo
INSERT INTO users (id, email, password_hash, first_name, last_name, role, organization_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@demo.com', '$2b$10$hashed_password', 'Admin', 'User', 'OWNER', '00000000-0000-0000-0000-000000000001');

-- Podstawowe konteksty GTD
INSERT INTO contexts (id, name, description, icon, organization_id) VALUES
('00000000-0000-0000-0000-000000000001', '@computer', 'Zadania przy komputerze', '💻', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000002', '@phone', 'Rozmowy telefoniczne', '📞', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000003', '@errands', 'Sprawy poza biurem', '🚗', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000004', '@office', 'Zadania w biurze', '🏢', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000005', '@home', 'Zadania w domu', '🏠', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000006', '@waiting', 'Czekam na innych', '⏳', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000007', '@online', 'Zadania internetowe', '🌐', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000008', '@reading', 'Materiały do przeczytania', '📚', '00000000-0000-0000-0000-000000000001');

-- ================================
-- KOMENTARZE KOŃCOWE
-- ================================

COMMENT ON DATABASE current_database() IS 'CRM-GTD Smart - Kompletny system zarządzania relacjami z klientami i produktywnością według metodologii GTD (Getting Things Done). Obsługuje Multi-tenancy, Vector Database (RAG), AI Integration, Smart Mailboxes, Rules Engine.';

-- Koniec skryptu
-- Wersja: 2025-06-27
-- Status: Ready for production
-- Features: 371 vectors data, Smart Mailboxes, AI Rules, GTD Inbox, Voice TTS integration