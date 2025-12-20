--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Debian 14.18-1.pgdg120+1)
-- Dumped by pg_dump version 14.18 (Debian 14.18-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AIDocumentStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AIDocumentStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PROCESSING',
    'ERROR'
);


ALTER TYPE public."AIDocumentStatus" OWNER TO "user";

--
-- Name: AIExecutionStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AIExecutionStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'SUCCESS',
    'FAILED',
    'TIMEOUT',
    'CANCELLED'
);


ALTER TYPE public."AIExecutionStatus" OWNER TO "user";

--
-- Name: AIKnowledgeStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AIKnowledgeStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'INDEXING',
    'ERROR'
);


ALTER TYPE public."AIKnowledgeStatus" OWNER TO "user";

--
-- Name: AIModelStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AIModelStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'BETA',
    'DEPRECATED'
);


ALTER TYPE public."AIModelStatus" OWNER TO "user";

--
-- Name: AIModelType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AIModelType" AS ENUM (
    'TEXT_GENERATION',
    'TEXT_CLASSIFICATION',
    'TEXT_EMBEDDING',
    'IMAGE_GENERATION',
    'IMAGE_ANALYSIS',
    'AUDIO_TRANSCRIPTION',
    'AUDIO_GENERATION',
    'CODE_GENERATION',
    'FUNCTION_CALLING',
    'MULTIMODAL'
);


ALTER TYPE public."AIModelType" OWNER TO "user";

--
-- Name: AIProviderStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AIProviderStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE',
    'DEPRECATED'
);


ALTER TYPE public."AIProviderStatus" OWNER TO "user";

--
-- Name: AIRuleStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AIRuleStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'TESTING',
    'ARCHIVED'
);


ALTER TYPE public."AIRuleStatus" OWNER TO "user";

--
-- Name: AITemplateStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AITemplateStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DRAFT',
    'ARCHIVED'
);


ALTER TYPE public."AITemplateStatus" OWNER TO "user";

--
-- Name: AITriggerType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AITriggerType" AS ENUM (
    'MESSAGE_RECEIVED',
    'TASK_CREATED',
    'TASK_UPDATED',
    'PROJECT_CREATED',
    'CONTACT_UPDATED',
    'DEAL_STAGE_CHANGED',
    'MANUAL_TRIGGER',
    'SCHEDULED',
    'WEBHOOK'
);


ALTER TYPE public."AITriggerType" OWNER TO "user";

--
-- Name: AccessLevel; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AccessLevel" AS ENUM (
    'NO_ACCESS',
    'READ_ONLY',
    'LIMITED',
    'CONTRIBUTOR',
    'COLLABORATOR',
    'MANAGER',
    'ADMIN',
    'FULL_CONTROL'
);


ALTER TYPE public."AccessLevel" OWNER TO "user";

--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ActivityType" AS ENUM (
    'DEAL_CREATED',
    'DEAL_UPDATED',
    'DEAL_STAGE_CHANGED',
    'CONTACT_ADDED',
    'CONTACT_UPDATED',
    'TASK_CREATED',
    'TASK_COMPLETED',
    'MEETING_SCHEDULED',
    'MEETING_COMPLETED',
    'EMAIL_SENT',
    'EMAIL_RECEIVED',
    'PHONE_CALL',
    'SMS_SENT',
    'CHAT_MESSAGE',
    'NOTE_ADDED',
    'COMPANY_UPDATED',
    'PROJECT_CREATED',
    'PROJECT_UPDATED'
);


ALTER TYPE public."ActivityType" OWNER TO "user";

--
-- Name: AutoReplyStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AutoReplyStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SCHEDULED'
);


ALTER TYPE public."AutoReplyStatus" OWNER TO "user";

--
-- Name: BugCategory; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."BugCategory" AS ENUM (
    'UI_UX',
    'FUNCTIONALITY',
    'PERFORMANCE',
    'SECURITY',
    'DATA',
    'INTEGRATION',
    'OTHER'
);


ALTER TYPE public."BugCategory" OWNER TO "user";

--
-- Name: BugPriority; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."BugPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."BugPriority" OWNER TO "user";

--
-- Name: BugStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."BugStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'WONT_FIX'
);


ALTER TYPE public."BugStatus" OWNER TO "user";

--
-- Name: ChannelType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ChannelType" AS ENUM (
    'EMAIL',
    'SLACK',
    'TEAMS',
    'WHATSAPP',
    'SMS',
    'TELEGRAM',
    'DISCORD',
    'WEBHOOK'
);


ALTER TYPE public."ChannelType" OWNER TO "user";

--
-- Name: ColumnType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ColumnType" AS ENUM (
    'STAGE',
    'PRIORITY',
    'CONTEXT',
    'SENTIMENT',
    'SIZE',
    'ASSIGNEE'
);


ALTER TYPE public."ColumnType" OWNER TO "user";

--
-- Name: CompanySize; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."CompanySize" AS ENUM (
    'STARTUP',
    'SMALL',
    'MEDIUM',
    'LARGE',
    'ENTERPRISE'
);


ALTER TYPE public."CompanySize" OWNER TO "user";

--
-- Name: CompanyStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."CompanyStatus" AS ENUM (
    'PROSPECT',
    'CUSTOMER',
    'PARTNER',
    'INACTIVE',
    'ARCHIVED'
);


ALTER TYPE public."CompanyStatus" OWNER TO "user";

--
-- Name: ComplaintStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ComplaintStatus" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'ESCALATED'
);


ALTER TYPE public."ComplaintStatus" OWNER TO "user";

--
-- Name: Complexity; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."Complexity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."Complexity" OWNER TO "user";

--
-- Name: ContactStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ContactStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'LEAD',
    'CUSTOMER',
    'ARCHIVED'
);


ALTER TYPE public."ContactStatus" OWNER TO "user";

--
-- Name: DataScope; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."DataScope" AS ENUM (
    'BASIC_INFO',
    'TASKS',
    'PROJECTS',
    'FINANCIAL',
    'METRICS',
    'COMMUNICATION',
    'PERMISSIONS',
    'CONFIGURATION',
    'AUDIT_LOGS'
);


ALTER TYPE public."DataScope" OWNER TO "user";

--
-- Name: DealStage; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."DealStage" AS ENUM (
    'PROSPECT',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST'
);


ALTER TYPE public."DealStage" OWNER TO "user";

--
-- Name: DependencyType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."DependencyType" AS ENUM (
    'FINISH_TO_START',
    'START_TO_START',
    'FINISH_TO_FINISH',
    'START_TO_FINISH'
);


ALTER TYPE public."DependencyType" OWNER TO "user";

--
-- Name: DocumentStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."DocumentStatus" AS ENUM (
    'DRAFT',
    'REVIEW',
    'PUBLISHED',
    'ARCHIVED',
    'DEPRECATED'
);


ALTER TYPE public."DocumentStatus" OWNER TO "user";

--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."DocumentType" AS ENUM (
    'NOTE',
    'ARTICLE',
    'GUIDE',
    'TUTORIAL',
    'SPECIFICATION',
    'MEETING_NOTES',
    'RESEARCH',
    'TEMPLATE',
    'POLICY',
    'PROCEDURE',
    'REFERENCE',
    'FAQ'
);


ALTER TYPE public."DocumentType" OWNER TO "user";

--
-- Name: Effort; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."Effort" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."Effort" OWNER TO "user";

--
-- Name: EmailCategory; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."EmailCategory" AS ENUM (
    'VIP',
    'SPAM',
    'INVOICES',
    'ARCHIVE',
    'UNKNOWN'
);


ALTER TYPE public."EmailCategory" OWNER TO "user";

--
-- Name: EmailProvider; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."EmailProvider" AS ENUM (
    'SMTP',
    'SENDGRID',
    'AWS_SES',
    'MAILGUN',
    'POSTMARK'
);


ALTER TYPE public."EmailProvider" OWNER TO "user";

--
-- Name: EnergyLevel; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."EnergyLevel" AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW',
    'CREATIVE',
    'ADMINISTRATIVE'
);


ALTER TYPE public."EnergyLevel" OWNER TO "user";

--
-- Name: ErrorSeverity; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ErrorSeverity" AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public."ErrorSeverity" OWNER TO "user";

--
-- Name: ExecutionStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ExecutionStatus" AS ENUM (
    'SUCCESS',
    'PARTIAL_SUCCESS',
    'FAILED',
    'TIMEOUT',
    'CANCELLED',
    'RETRYING'
);


ALTER TYPE public."ExecutionStatus" OWNER TO "user";

--
-- Name: Frequency; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."Frequency" AS ENUM (
    'DAILY',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'BIMONTHLY',
    'QUARTERLY',
    'YEARLY',
    'CUSTOM'
);


ALTER TYPE public."Frequency" OWNER TO "user";

--
-- Name: GTDRole; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."GTDRole" AS ENUM (
    'INBOX',
    'NEXT_ACTIONS',
    'WAITING_FOR',
    'SOMEDAY_MAYBE',
    'PROJECTS',
    'CONTEXTS',
    'AREAS',
    'REFERENCE',
    'CUSTOM'
);


ALTER TYPE public."GTDRole" OWNER TO "user";

--
-- Name: Impact; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."Impact" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."Impact" OWNER TO "user";

--
-- Name: Importance; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."Importance" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."Importance" OWNER TO "user";

--
-- Name: ImprovementStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ImprovementStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED'
);


ALTER TYPE public."ImprovementStatus" OWNER TO "user";

--
-- Name: InboxSourceType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."InboxSourceType" AS ENUM (
    'QUICK_CAPTURE',
    'MEETING_NOTES',
    'PHONE_CALL',
    'EMAIL',
    'IDEA',
    'DOCUMENT',
    'BILL_INVOICE',
    'ARTICLE',
    'VOICE_MEMO',
    'PHOTO',
    'OTHER'
);


ALTER TYPE public."InboxSourceType" OWNER TO "user";

--
-- Name: InheritanceRule; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."InheritanceRule" AS ENUM (
    'NO_INHERITANCE',
    'INHERIT_DOWN',
    'INHERIT_UP',
    'BIDIRECTIONAL'
);


ALTER TYPE public."InheritanceRule" OWNER TO "user";

--
-- Name: InvoiceItemType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."InvoiceItemType" AS ENUM (
    'PRODUCT',
    'SERVICE',
    'CUSTOM'
);


ALTER TYPE public."InvoiceItemType" OWNER TO "user";

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'PENDING',
    'SENT',
    'PAID',
    'OVERDUE',
    'CANCELED'
);


ALTER TYPE public."InvoiceStatus" OWNER TO "user";

--
-- Name: LeadStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."LeadStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'WON',
    'LOST'
);


ALTER TYPE public."LeadStatus" OWNER TO "user";

--
-- Name: LinkType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."LinkType" AS ENUM (
    'REFERENCE',
    'RELATED',
    'PREREQUISITE',
    'DEPENDENCY',
    'INSPIRATION',
    'CONTRADICTION'
);


ALTER TYPE public."LinkType" OWNER TO "user";

--
-- Name: MeetingStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."MeetingStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED'
);


ALTER TYPE public."MeetingStatus" OWNER TO "user";

--
-- Name: MessagePriority; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."MessagePriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."MessagePriority" OWNER TO "user";

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."MessageType" AS ENUM (
    'INBOX',
    'SENT',
    'DRAFT',
    'SPAM',
    'TRASH'
);


ALTER TYPE public."MessageType" OWNER TO "user";

--
-- Name: OfferItemType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."OfferItemType" AS ENUM (
    'PRODUCT',
    'SERVICE',
    'CUSTOM'
);


ALTER TYPE public."OfferItemType" OWNER TO "user";

--
-- Name: OfferStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."OfferStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'CANCELED'
);


ALTER TYPE public."OfferStatus" OWNER TO "user";

--
-- Name: OrderItemType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."OrderItemType" AS ENUM (
    'PRODUCT',
    'SERVICE',
    'CUSTOM'
);


ALTER TYPE public."OrderItemType" OWNER TO "user";

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'SHIPPED',
    'DELIVERED',
    'CANCELED'
);


ALTER TYPE public."OrderStatus" OWNER TO "user";

--
-- Name: Priority; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."Priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."Priority" OWNER TO "user";

--
-- Name: ProcessingDecision; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ProcessingDecision" AS ENUM (
    'DO',
    'DEFER',
    'DELEGATE',
    'DELETE',
    'REFERENCE',
    'PROJECT',
    'SOMEDAY'
);


ALTER TYPE public."ProcessingDecision" OWNER TO "user";

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DISCONTINUED',
    'OUT_OF_STOCK'
);


ALTER TYPE public."ProductStatus" OWNER TO "user";

--
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'PLANNING',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELED'
);


ALTER TYPE public."ProjectStatus" OWNER TO "user";

--
-- Name: RecommendationStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."RecommendationStatus" AS ENUM (
    'OPEN',
    'ACCEPTED',
    'REJECTED',
    'IMPLEMENTED'
);


ALTER TYPE public."RecommendationStatus" OWNER TO "user";

--
-- Name: RelationshipType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."RelationshipType" AS ENUM (
    'FINISH_TO_START',
    'START_TO_START',
    'FINISH_TO_FINISH',
    'START_TO_FINISH'
);


ALTER TYPE public."RelationshipType" OWNER TO "user";

--
-- Name: ReviewFrequency; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ReviewFrequency" AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'CUSTOM'
);


ALTER TYPE public."ReviewFrequency" OWNER TO "user";

--
-- Name: ServiceBillingType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ServiceBillingType" AS ENUM (
    'ONE_TIME',
    'HOURLY',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY',
    'PROJECT_BASED'
);


ALTER TYPE public."ServiceBillingType" OWNER TO "user";

--
-- Name: ServiceDeliveryMethod; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ServiceDeliveryMethod" AS ENUM (
    'REMOTE',
    'ON_SITE',
    'HYBRID',
    'DIGITAL_DELIVERY',
    'PHYSICAL_DELIVERY'
);


ALTER TYPE public."ServiceDeliveryMethod" OWNER TO "user";

--
-- Name: ServiceStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ServiceStatus" AS ENUM (
    'AVAILABLE',
    'UNAVAILABLE',
    'TEMPORARILY_UNAVAILABLE',
    'DISCONTINUED'
);


ALTER TYPE public."ServiceStatus" OWNER TO "user";

--
-- Name: SharePermission; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."SharePermission" AS ENUM (
    'READ',
    'COMMENT',
    'EDIT',
    'ADMIN'
);


ALTER TYPE public."SharePermission" OWNER TO "user";

--
-- Name: SomedayMaybeCategory; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."SomedayMaybeCategory" AS ENUM (
    'IDEAS',
    'PROJECTS',
    'GOALS',
    'LEARNING',
    'TRAVEL',
    'PURCHASES',
    'EXPERIENCES'
);


ALTER TYPE public."SomedayMaybeCategory" OWNER TO "user";

--
-- Name: SomedayMaybeStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."SomedayMaybeStatus" AS ENUM (
    'ACTIVE',
    'ACTIVATED',
    'ARCHIVED'
);


ALTER TYPE public."SomedayMaybeStatus" OWNER TO "user";

--
-- Name: SprintStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."SprintStatus" AS ENUM (
    'PLANNED',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."SprintStatus" OWNER TO "user";

--
-- Name: StreamRelationType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."StreamRelationType" AS ENUM (
    'OWNS',
    'MANAGES',
    'BELONGS_TO',
    'RELATED_TO',
    'DEPENDS_ON',
    'SUPPORTS'
);


ALTER TYPE public."StreamRelationType" OWNER TO "user";

--
-- Name: StreamStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."StreamStatus" AS ENUM (
    'ACTIVE',
    'ARCHIVED',
    'TEMPLATE'
);


ALTER TYPE public."StreamStatus" OWNER TO "user";

--
-- Name: StreamType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."StreamType" AS ENUM (
    'WORKSPACE',
    'PROJECT',
    'AREA',
    'CONTEXT',
    'CUSTOM'
);


ALTER TYPE public."StreamType" OWNER TO "user";

--
-- Name: SubscriptionPlan; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."SubscriptionPlan" AS ENUM (
    'STARTER',
    'PROFESSIONAL',
    'ENTERPRISE'
);


ALTER TYPE public."SubscriptionPlan" OWNER TO "user";

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'PAUSED'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO "user";

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'WAITING',
    'COMPLETED',
    'CANCELED'
);


ALTER TYPE public."TaskStatus" OWNER TO "user";

--
-- Name: TimelineStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."TimelineStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED'
);


ALTER TYPE public."TimelineStatus" OWNER TO "user";

--
-- Name: UnifiedRuleStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."UnifiedRuleStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DRAFT',
    'TESTING',
    'ERROR',
    'DEPRECATED'
);


ALTER TYPE public."UnifiedRuleStatus" OWNER TO "user";

--
-- Name: UnifiedRuleType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."UnifiedRuleType" AS ENUM (
    'PROCESSING',
    'EMAIL_FILTER',
    'AUTO_REPLY',
    'AI_RULE',
    'SMART_MAILBOX',
    'WORKFLOW',
    'NOTIFICATION',
    'INTEGRATION'
);


ALTER TYPE public."UnifiedRuleType" OWNER TO "user";

--
-- Name: UnifiedTriggerType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."UnifiedTriggerType" AS ENUM (
    'MANUAL',
    'AUTOMATIC',
    'EVENT_BASED',
    'SCHEDULED',
    'WEBHOOK',
    'API_CALL'
);


ALTER TYPE public."UnifiedTriggerType" OWNER TO "user";

--
-- Name: UserAccessType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."UserAccessType" AS ENUM (
    'DIRECT',
    'RELATION_BASED',
    'ROLE_BASED',
    'TEMPORARY'
);


ALTER TYPE public."UserAccessType" OWNER TO "user";

--
-- Name: UserAction; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."UserAction" AS ENUM (
    'VIEW',
    'EDIT',
    'CREATE',
    'DELETE',
    'ASSIGN',
    'APPROVE',
    'DELEGATE',
    'MANAGE',
    'AUDIT'
);


ALTER TYPE public."UserAction" OWNER TO "user";

--
-- Name: UserDataScope; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."UserDataScope" AS ENUM (
    'PROFILE',
    'TASKS',
    'PROJECTS',
    'SCHEDULE',
    'PERFORMANCE',
    'DOCUMENTS',
    'COMMUNICATION',
    'SETTINGS',
    'TEAM_DATA',
    'REPORTS',
    'ALL'
);


ALTER TYPE public."UserDataScope" OWNER TO "user";

--
-- Name: UserInheritanceRule; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."UserInheritanceRule" AS ENUM (
    'NO_INHERITANCE',
    'INHERIT_DOWN',
    'INHERIT_UP',
    'INHERIT_BIDIRECTIONAL'
);


ALTER TYPE public."UserInheritanceRule" OWNER TO "user";

--
-- Name: UserRelationType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."UserRelationType" AS ENUM (
    'MANAGES',
    'LEADS',
    'SUPERVISES',
    'MENTORS',
    'COLLABORATES',
    'SUPPORTS',
    'REPORTS_TO'
);


ALTER TYPE public."UserRelationType" OWNER TO "user";

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."UserRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'MANAGER',
    'MEMBER',
    'GUEST'
);


ALTER TYPE public."UserRole" OWNER TO "user";

--
-- Name: ViewType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ViewType" AS ENUM (
    'KANBAN',
    'GANTT',
    'SCRUM',
    'CALENDAR',
    'LIST'
);


ALTER TYPE public."ViewType" OWNER TO "user";

--
-- Name: WaitingForStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."WaitingForStatus" AS ENUM (
    'PENDING',
    'RESPONDED',
    'OVERDUE',
    'CANCELED'
);


ALTER TYPE public."WaitingForStatus" OWNER TO "user";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.activities (
    id text NOT NULL,
    type public."ActivityType" NOT NULL,
    title text NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text,
    "companyId" text,
    "contactId" text,
    "dealId" text,
    "taskId" text,
    "projectId" text,
    "meetingId" text,
    "communicationType" text,
    "communicationDirection" text,
    "communicationSubject" text,
    "communicationBody" text,
    "communicationDuration" integer,
    "communicationStatus" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.activities OWNER TO "user";

--
-- Name: ai_executions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ai_executions (
    id text NOT NULL,
    "ruleId" text,
    "providerId" text,
    "modelId" text,
    "templateId" text,
    "inputData" jsonb NOT NULL,
    "promptSent" text NOT NULL,
    "responseReceived" text,
    "parsedOutput" jsonb,
    status public."AIExecutionStatus" NOT NULL,
    "executionTime" integer,
    "tokensUsed" integer,
    cost double precision,
    "errorMessage" text,
    "errorCode" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "actionsExecuted" jsonb,
    "entitiesCreated" jsonb,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_executions OWNER TO "user";

--
-- Name: ai_knowledge_bases; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ai_knowledge_bases (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    status public."AIKnowledgeStatus" DEFAULT 'ACTIVE'::public."AIKnowledgeStatus" NOT NULL,
    "embeddingModel" text,
    "chunkSize" integer DEFAULT 1000 NOT NULL,
    "chunkOverlap" integer DEFAULT 200 NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_knowledge_bases OWNER TO "user";

--
-- Name: ai_knowledge_documents; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ai_knowledge_documents (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    embedding text,
    "embeddingModel" text,
    status public."AIDocumentStatus" DEFAULT 'ACTIVE'::public."AIDocumentStatus" NOT NULL,
    "knowledgeBaseId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_knowledge_documents OWNER TO "user";

--
-- Name: ai_models; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ai_models (
    id text NOT NULL,
    name text NOT NULL,
    "displayName" text NOT NULL,
    type public."AIModelType" NOT NULL,
    status public."AIModelStatus" DEFAULT 'ACTIVE'::public."AIModelStatus" NOT NULL,
    "maxTokens" integer,
    "inputCost" double precision,
    "outputCost" double precision,
    capabilities text[] DEFAULT ARRAY[]::text[],
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    "providerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_models OWNER TO "user";

--
-- Name: ai_predictions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ai_predictions (
    id text NOT NULL,
    "itemId" text NOT NULL,
    "itemType" text NOT NULL,
    "predictionType" text NOT NULL,
    "predictedValue" jsonb NOT NULL,
    "confidenceScore" double precision NOT NULL,
    factors jsonb DEFAULT '{}'::jsonb NOT NULL,
    recommendations jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public.ai_predictions OWNER TO "user";

--
-- Name: ai_prompt_templates; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ai_prompt_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    version integer DEFAULT 1 NOT NULL,
    status public."AITemplateStatus" DEFAULT 'ACTIVE'::public."AITemplateStatus" NOT NULL,
    "systemPrompt" text,
    "userPromptTemplate" text NOT NULL,
    variables jsonb DEFAULT '{}'::jsonb NOT NULL,
    "modelId" text,
    "outputSchema" jsonb,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_prompt_templates OWNER TO "user";

--
-- Name: ai_providers; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ai_providers (
    id text NOT NULL,
    name text NOT NULL,
    "displayName" text NOT NULL,
    "baseUrl" text NOT NULL,
    status public."AIProviderStatus" DEFAULT 'ACTIVE'::public."AIProviderStatus" NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    config jsonb NOT NULL,
    limits jsonb DEFAULT '{}'::jsonb NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_providers OWNER TO "user";

--
-- Name: ai_rules; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ai_rules (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    status public."AIRuleStatus" DEFAULT 'ACTIVE'::public."AIRuleStatus" NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "triggerType" public."AITriggerType" NOT NULL,
    "triggerConditions" jsonb NOT NULL,
    "templateId" text,
    "modelId" text,
    "fallbackModelIds" text[] DEFAULT ARRAY[]::text[],
    actions jsonb NOT NULL,
    "maxExecutionsPerHour" integer DEFAULT 100,
    "maxExecutionsPerDay" integer DEFAULT 1000,
    "organizationId" text NOT NULL,
    "executionCount" integer DEFAULT 0 NOT NULL,
    "successCount" integer DEFAULT 0 NOT NULL,
    "errorCount" integer DEFAULT 0 NOT NULL,
    "avgExecutionTime" double precision,
    "lastExecuted" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_rules OWNER TO "user";

--
-- Name: ai_usage_stats; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ai_usage_stats (
    id text NOT NULL,
    date date NOT NULL,
    "totalExecutions" integer DEFAULT 0 NOT NULL,
    "successfulExecutions" integer DEFAULT 0 NOT NULL,
    "failedExecutions" integer DEFAULT 0 NOT NULL,
    "totalTokensUsed" integer DEFAULT 0 NOT NULL,
    "totalCost" double precision DEFAULT 0 NOT NULL,
    "providerStats" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "modelStats" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ai_usage_stats OWNER TO "user";

--
-- Name: areas_of_responsibility; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.areas_of_responsibility (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    owner text,
    "relatedProjects" text[] DEFAULT ARRAY[]::text[],
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.areas_of_responsibility OWNER TO "user";

--
-- Name: auto_replies; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.auto_replies (
    id text NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    "htmlContent" text,
    "triggerConditions" jsonb NOT NULL,
    status public."AutoReplyStatus" DEFAULT 'ACTIVE'::public."AutoReplyStatus" NOT NULL,
    "sendOnce" boolean DEFAULT true NOT NULL,
    delay integer,
    "activeFrom" timestamp(3) without time zone,
    "activeTo" timestamp(3) without time zone,
    "channelId" text,
    "organizationId" text NOT NULL,
    "sentCount" integer DEFAULT 0 NOT NULL,
    "lastSent" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.auto_replies OWNER TO "user";

--
-- Name: bug_reports; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.bug_reports (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    priority public."BugPriority" DEFAULT 'MEDIUM'::public."BugPriority" NOT NULL,
    status public."BugStatus" DEFAULT 'OPEN'::public."BugStatus" NOT NULL,
    category public."BugCategory",
    "userAgent" text,
    url text,
    "browserInfo" text,
    "deviceInfo" text,
    screenshots text[] DEFAULT ARRAY[]::text[],
    attachments text[] DEFAULT ARRAY[]::text[],
    "stepsToReproduce" text,
    "expectedBehavior" text,
    "actualBehavior" text,
    "reporterId" text NOT NULL,
    "organizationId" text NOT NULL,
    "adminNotes" text,
    resolution text,
    "resolvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bug_reports OWNER TO "user";

--
-- Name: communication_channels; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.communication_channels (
    id text NOT NULL,
    name text NOT NULL,
    type public."ChannelType" NOT NULL,
    active boolean DEFAULT true NOT NULL,
    config jsonb NOT NULL,
    "emailAddress" text,
    "displayName" text,
    "autoProcess" boolean DEFAULT true NOT NULL,
    "createTasks" boolean DEFAULT false NOT NULL,
    "defaultStream" text,
    "organizationId" text NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.communication_channels OWNER TO "user";

--
-- Name: companies; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.companies (
    id text NOT NULL,
    name text NOT NULL,
    website text,
    domain text,
    industry text,
    size public."CompanySize",
    revenue text,
    description text,
    address text,
    phone text,
    email text,
    tags text[] DEFAULT ARRAY[]::text[],
    status public."CompanyStatus" DEFAULT 'PROSPECT'::public."CompanyStatus" NOT NULL,
    "organizationId" text NOT NULL,
    "primaryContactId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastInteractionAt" timestamp(3) without time zone,
    "interactionCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.companies OWNER TO "user";

--
-- Name: complaints; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.complaints (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    customer text NOT NULL,
    product text,
    status public."ComplaintStatus" DEFAULT 'NEW'::public."ComplaintStatus" NOT NULL,
    priority public."Priority" DEFAULT 'HIGH'::public."Priority" NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.complaints OWNER TO "user";

--
-- Name: completeness; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.completeness (
    id text NOT NULL,
    "isComplete" boolean DEFAULT false NOT NULL,
    "missingInfo" text,
    clarity text,
    "taskId" text,
    "projectId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.completeness OWNER TO "user";

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.contacts (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text,
    phone text,
    company text,
    "position" text,
    department text,
    notes text,
    tags text[] DEFAULT ARRAY[]::text[],
    status public."ContactStatus" DEFAULT 'ACTIVE'::public."ContactStatus" NOT NULL,
    source text,
    "emailCategory" public."EmailCategory" DEFAULT 'UNKNOWN'::public."EmailCategory" NOT NULL,
    "organizationId" text NOT NULL,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastInteractionAt" timestamp(3) without time zone,
    "interactionCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.contacts OWNER TO "user";

--
-- Name: contexts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.contexts (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#6B7280'::text NOT NULL,
    icon text,
    "isActive" boolean DEFAULT true NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.contexts OWNER TO "user";

--
-- Name: critical_path; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.critical_path (
    id text NOT NULL,
    tasks text[] DEFAULT ARRAY[]::text[],
    "totalDuration" text,
    "earliestCompletion" timestamp(3) without time zone,
    slack text,
    "projectId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.critical_path OWNER TO "user";

--
-- Name: deals; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.deals (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    value double precision,
    currency text DEFAULT 'USD'::text NOT NULL,
    stage public."DealStage" DEFAULT 'PROSPECT'::public."DealStage" NOT NULL,
    probability double precision DEFAULT 0 NOT NULL,
    "expectedCloseDate" timestamp(3) without time zone,
    "actualCloseDate" timestamp(3) without time zone,
    source text,
    notes text,
    "organizationId" text NOT NULL,
    "companyId" text NOT NULL,
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "kanbanPosition" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.deals OWNER TO "user";

--
-- Name: delegated_tasks; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.delegated_tasks (
    id text NOT NULL,
    description text NOT NULL,
    "delegatedTo" text NOT NULL,
    "delegatedOn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "followUpDate" timestamp(3) without time zone,
    status public."TaskStatus" DEFAULT 'NEW'::public."TaskStatus" NOT NULL,
    notes text,
    "organizationId" text NOT NULL,
    "taskId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.delegated_tasks OWNER TO "user";

--
-- Name: dependencies; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.dependencies (
    id text NOT NULL,
    type public."DependencyType" DEFAULT 'FINISH_TO_START'::public."DependencyType" NOT NULL,
    "isCriticalPath" boolean DEFAULT false NOT NULL,
    "sourceId" text NOT NULL,
    "sourceType" text NOT NULL,
    "targetId" text NOT NULL,
    "targetType" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.dependencies OWNER TO "user";

--
-- Name: document_comments; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.document_comments (
    id text NOT NULL,
    content text NOT NULL,
    "isResolved" boolean DEFAULT false NOT NULL,
    "documentId" text NOT NULL,
    "authorId" text NOT NULL,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.document_comments OWNER TO "user";

--
-- Name: document_links; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.document_links (
    id text NOT NULL,
    type public."LinkType" DEFAULT 'REFERENCE'::public."LinkType" NOT NULL,
    strength double precision DEFAULT 1.0 NOT NULL,
    "sourceDocumentId" text NOT NULL,
    "targetDocumentId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.document_links OWNER TO "user";

--
-- Name: document_shares; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.document_shares (
    id text NOT NULL,
    permission public."SharePermission" DEFAULT 'READ'::public."SharePermission" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "documentId" text NOT NULL,
    "sharedWithId" text NOT NULL,
    "sharedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.document_shares OWNER TO "user";

--
-- Name: documents; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.documents (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    summary text,
    type public."DocumentType" DEFAULT 'NOTE'::public."DocumentType" NOT NULL,
    status public."DocumentStatus" DEFAULT 'DRAFT'::public."DocumentStatus" NOT NULL,
    tags text[],
    "mimeType" text,
    "fileSize" integer,
    "filePath" text,
    version integer DEFAULT 1 NOT NULL,
    "isTemplate" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "authorId" text NOT NULL,
    "folderId" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.documents OWNER TO "user";

--
-- Name: email_analysis; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.email_analysis (
    id text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "emailFrom" text NOT NULL,
    "emailSubject" text NOT NULL,
    "emailReceived" timestamp(3) without time zone NOT NULL,
    categories text[] DEFAULT ARRAY[]::text[],
    "confidenceScore" double precision DEFAULT 0 NOT NULL,
    summary text,
    "fullAnalysis" text,
    "rawText" text,
    "processingTime" integer,
    "tokenCount" integer,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.email_analysis OWNER TO "user";

--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.email_logs (
    id text NOT NULL,
    provider public."EmailProvider" DEFAULT 'SMTP'::public."EmailProvider" NOT NULL,
    "messageId" text NOT NULL,
    "toAddresses" text[],
    "ccAddresses" text[] DEFAULT ARRAY[]::text[],
    "bccAddresses" text[] DEFAULT ARRAY[]::text[],
    subject text NOT NULL,
    success boolean NOT NULL,
    error text,
    "templateId" text,
    "templateData" jsonb,
    delivered boolean DEFAULT false,
    opened boolean DEFAULT false,
    clicked boolean DEFAULT false,
    bounced boolean DEFAULT false,
    spam boolean DEFAULT false,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deliveredAt" timestamp(3) without time zone,
    "openedAt" timestamp(3) without time zone,
    "clickedAt" timestamp(3) without time zone,
    "bouncedAt" timestamp(3) without time zone,
    "organizationId" text,
    "sentByUserId" text
);


ALTER TABLE public.email_logs OWNER TO "user";

--
-- Name: email_rules; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.email_rules (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "senderEmail" text,
    "senderDomain" text,
    "subjectContains" text,
    "subjectPattern" text,
    "bodyContains" text,
    "assignCategory" public."EmailCategory" NOT NULL,
    "skipAIAnalysis" boolean DEFAULT false NOT NULL,
    "autoArchive" boolean DEFAULT false NOT NULL,
    "autoDelete" boolean DEFAULT false NOT NULL,
    "createTask" boolean DEFAULT false NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "matchCount" integer DEFAULT 0 NOT NULL,
    "lastMatched" timestamp(3) without time zone,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.email_rules OWNER TO "user";

--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.email_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    subject text NOT NULL,
    "htmlTemplate" text NOT NULL,
    "textTemplate" text,
    variables text[] DEFAULT ARRAY[]::text[],
    category text,
    tags text[] DEFAULT ARRAY[]::text[],
    "isActive" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "lastUsed" timestamp(3) without time zone,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL
);


ALTER TABLE public.email_templates OWNER TO "user";

--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.error_logs (
    id text NOT NULL,
    message text NOT NULL,
    stack text,
    url text NOT NULL,
    "userAgent" text NOT NULL,
    severity public."ErrorSeverity" NOT NULL,
    context text,
    "componentStack" text,
    "sessionId" text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    "userId" text,
    "organizationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.error_logs OWNER TO "user";

--
-- Name: files; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.files (
    id text NOT NULL,
    "fileName" text NOT NULL,
    "fileType" text NOT NULL,
    "urlPath" text NOT NULL,
    "uploadDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    size integer,
    "parentId" text,
    "parentType" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.files OWNER TO "user";

--
-- Name: focus_modes; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.focus_modes (
    id text NOT NULL,
    name text NOT NULL,
    duration integer NOT NULL,
    "energyLevel" public."EnergyLevel" DEFAULT 'HIGH'::public."EnergyLevel" NOT NULL,
    "contextName" text,
    "estimatedTimeMax" integer,
    category text,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.focus_modes OWNER TO "user";

--
-- Name: folders; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.folders (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    color text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "parentId" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.folders OWNER TO "user";

--
-- Name: gtd_buckets; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.gtd_buckets (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "viewOrder" integer DEFAULT 1 NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.gtd_buckets OWNER TO "user";

--
-- Name: gtd_horizons; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.gtd_horizons (
    id text NOT NULL,
    level integer NOT NULL,
    name text NOT NULL,
    description text,
    "reviewFrequency" public."Frequency" DEFAULT 'QUARTERLY'::public."Frequency" NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.gtd_horizons OWNER TO "user";

--
-- Name: habit_entries; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.habit_entries (
    id text NOT NULL,
    date date NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    notes text,
    "habitId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.habit_entries OWNER TO "user";

--
-- Name: habits; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.habits (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    frequency public."Frequency" DEFAULT 'DAILY'::public."Frequency" NOT NULL,
    "currentStreak" integer DEFAULT 0 NOT NULL,
    "bestStreak" integer DEFAULT 0 NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.habits OWNER TO "user";

--
-- Name: inbox_items; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.inbox_items (
    id text NOT NULL,
    content text NOT NULL,
    note text,
    "sourceType" public."InboxSourceType" DEFAULT 'QUICK_CAPTURE'::public."InboxSourceType" NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    "sourceUrl" text,
    "urgencyScore" integer DEFAULT 0,
    actionable boolean DEFAULT true NOT NULL,
    "estimatedTime" text,
    context text,
    "capturedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    "processedAt" timestamp(3) without time zone,
    "processingDecision" public."ProcessingDecision",
    "resultingTaskId" text,
    "contactId" text,
    "companyId" text,
    "projectId" text,
    "taskId" text,
    "streamId" text,
    "organizationId" text NOT NULL,
    "capturedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inbox_items OWNER TO "user";

--
-- Name: info; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.info (
    id text NOT NULL,
    title text NOT NULL,
    content text,
    topic text,
    importance public."Importance" DEFAULT 'MEDIUM'::public."Importance" NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.info OWNER TO "user";

--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.invoice_items (
    id text NOT NULL,
    "itemType" public."InvoiceItemType" NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" double precision NOT NULL,
    discount double precision DEFAULT 0,
    tax double precision DEFAULT 0,
    "totalPrice" double precision NOT NULL,
    "productId" text,
    "serviceId" text,
    "customName" text,
    "customDescription" text,
    "invoiceId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO "user";

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    "invoiceNumber" text NOT NULL,
    title text NOT NULL,
    description text,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."InvoiceStatus" DEFAULT 'PENDING'::public."InvoiceStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "dueDate" timestamp(3) without time zone,
    subtotal double precision DEFAULT 0,
    "totalDiscount" double precision DEFAULT 0,
    "totalTax" double precision DEFAULT 0,
    "totalAmount" double precision DEFAULT 0,
    "customerEmail" text,
    "customerPhone" text,
    "customerAddress" text,
    "paymentDate" timestamp(3) without time zone,
    "paymentMethod" text,
    "paymentNotes" text,
    "fakturowniaId" integer,
    "fakturowniaNumber" text,
    "fakturowniaStatus" text,
    "lastSyncedAt" timestamp(3) without time zone,
    "syncError" text,
    "autoSync" boolean DEFAULT true NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.invoices OWNER TO "user";

--
-- Name: kanban_columns; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.kanban_columns (
    id text NOT NULL,
    "viewId" text NOT NULL,
    title text NOT NULL,
    "position" integer NOT NULL,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    "wipLimit" integer,
    "columnType" text,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.kanban_columns OWNER TO "user";

--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.knowledge_base (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text,
    tags text[] DEFAULT ARRAY[]::text[],
    "relatedItems" text[] DEFAULT ARRAY[]::text[],
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.knowledge_base OWNER TO "user";

--
-- Name: leads; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.leads (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    company text,
    "contactPerson" text,
    status public."LeadStatus" DEFAULT 'NEW'::public."LeadStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    source text,
    value double precision,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.leads OWNER TO "user";

--
-- Name: meetings; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.meetings (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    location text,
    "meetingUrl" text,
    agenda text,
    notes text,
    status public."MeetingStatus" DEFAULT 'SCHEDULED'::public."MeetingStatus" NOT NULL,
    "organizationId" text NOT NULL,
    "organizedById" text NOT NULL,
    "contactId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.meetings OWNER TO "user";

--
-- Name: message_attachments; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.message_attachments (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "fileName" text NOT NULL,
    "fileType" text NOT NULL,
    "fileSize" integer,
    "contentType" text,
    "storagePath" text,
    "isInline" boolean DEFAULT false NOT NULL,
    "contentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.message_attachments OWNER TO "user";

--
-- Name: message_processing_results; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.message_processing_results (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "ruleId" text,
    "actionTaken" text NOT NULL,
    success boolean DEFAULT true NOT NULL,
    "errorMessage" text,
    "taskCreated" text,
    "contextAssigned" text,
    "prioritySet" public."Priority",
    "processedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.message_processing_results OWNER TO "user";

--
-- Name: messages; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.messages (
    id text NOT NULL,
    "channelId" text NOT NULL,
    "messageId" text,
    "threadId" text,
    subject text,
    content text NOT NULL,
    "htmlContent" text,
    "fromAddress" text NOT NULL,
    "fromName" text,
    "toAddress" text NOT NULL,
    "ccAddress" text[] DEFAULT ARRAY[]::text[],
    "bccAddress" text[] DEFAULT ARRAY[]::text[],
    "messageType" public."MessageType" DEFAULT 'INBOX'::public."MessageType" NOT NULL,
    priority public."MessagePriority" DEFAULT 'NORMAL'::public."MessagePriority" NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "isStarred" boolean DEFAULT false NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "receivedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "autoProcessed" boolean DEFAULT false NOT NULL,
    "actionNeeded" boolean DEFAULT false NOT NULL,
    "needsResponse" boolean DEFAULT false NOT NULL,
    "responseDeadline" timestamp(3) without time zone,
    "extractedTasks" text[] DEFAULT ARRAY[]::text[],
    "extractedContext" text,
    sentiment text,
    "urgencyScore" double precision,
    "taskId" text,
    "streamId" text,
    "contactId" text,
    "companyId" text,
    "dealId" text,
    "interactionType" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.messages OWNER TO "user";

--
-- Name: metadata; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.metadata (
    id text NOT NULL,
    confidence double precision DEFAULT 0.0 NOT NULL,
    ambiguity text,
    "rawText" text,
    "referenceId" text,
    "referenceType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.metadata OWNER TO "user";

--
-- Name: next_actions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.next_actions (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    context text NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    energy public."EnergyLevel" DEFAULT 'MEDIUM'::public."EnergyLevel" NOT NULL,
    "estimatedTime" text,
    status public."TaskStatus" DEFAULT 'NEW'::public."TaskStatus" NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "contactId" text,
    "companyId" text,
    "projectId" text,
    "taskId" text,
    "streamId" text,
    "organizationId" text NOT NULL,
    "createdById" text NOT NULL,
    "assignedToId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.next_actions OWNER TO "user";

--
-- Name: offer_items; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.offer_items (
    id text NOT NULL,
    "itemType" public."OfferItemType" NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" double precision NOT NULL,
    discount double precision DEFAULT 0,
    tax double precision DEFAULT 0,
    "totalPrice" double precision NOT NULL,
    "productId" text,
    "serviceId" text,
    "customName" text,
    "customDescription" text,
    "offerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.offer_items OWNER TO "user";

--
-- Name: offers; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.offers (
    id text NOT NULL,
    "offerNumber" text NOT NULL,
    title text NOT NULL,
    description text,
    status public."OfferStatus" DEFAULT 'DRAFT'::public."OfferStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    subtotal double precision DEFAULT 0,
    "totalDiscount" double precision DEFAULT 0,
    "totalTax" double precision DEFAULT 0,
    "totalAmount" double precision DEFAULT 0,
    currency text DEFAULT 'USD'::text NOT NULL,
    "validUntil" timestamp(3) without time zone,
    "sentDate" timestamp(3) without time zone,
    "acceptedDate" timestamp(3) without time zone,
    "rejectedDate" timestamp(3) without time zone,
    "customerName" text NOT NULL,
    "customerEmail" text,
    "customerPhone" text,
    "customerAddress" text,
    "companyId" text,
    "contactId" text,
    "dealId" text,
    "paymentTerms" text,
    "deliveryTerms" text,
    notes text,
    "organizationId" text NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.offers OWNER TO "user";

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "itemType" public."OrderItemType" NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" double precision NOT NULL,
    discount double precision DEFAULT 0,
    tax double precision DEFAULT 0,
    "totalPrice" double precision NOT NULL,
    "productId" text,
    "serviceId" text,
    "customName" text,
    "customDescription" text,
    "orderId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.order_items OWNER TO "user";

--
-- Name: orders; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    title text NOT NULL,
    description text,
    customer text NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    value double precision,
    currency text DEFAULT 'USD'::text NOT NULL,
    subtotal double precision DEFAULT 0,
    "totalDiscount" double precision DEFAULT 0,
    "totalTax" double precision DEFAULT 0,
    "totalAmount" double precision DEFAULT 0,
    "customerEmail" text,
    "customerPhone" text,
    "customerAddress" text,
    "deliveryDate" timestamp(3) without time zone,
    "deliveryAddress" text,
    "deliveryNotes" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO "user";

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.organizations (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    domain text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    limits jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.organizations OWNER TO "user";

--
-- Name: processing_rules; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.processing_rules (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "channelId" text,
    "organizationId" text NOT NULL,
    "executionCount" integer DEFAULT 0 NOT NULL,
    "lastExecuted" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "streamId" text
);


ALTER TABLE public.processing_rules OWNER TO "user";

--
-- Name: products; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    sku text,
    category text,
    subcategory text,
    price double precision NOT NULL,
    cost double precision,
    currency text DEFAULT 'USD'::text NOT NULL,
    "stockQuantity" integer DEFAULT 0,
    "minStockLevel" integer DEFAULT 0,
    "trackInventory" boolean DEFAULT false NOT NULL,
    unit text,
    weight double precision,
    dimensions text,
    status public."ProductStatus" DEFAULT 'ACTIVE'::public."ProductStatus" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    images text[] DEFAULT ARRAY[]::text[],
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.products OWNER TO "user";

--
-- Name: project_dependencies; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.project_dependencies (
    id text NOT NULL,
    type public."DependencyType" DEFAULT 'FINISH_TO_START'::public."DependencyType" NOT NULL,
    "isCriticalPath" boolean DEFAULT false NOT NULL,
    "sourceProjectId" text NOT NULL,
    "dependentProjectId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.project_dependencies OWNER TO "user";

--
-- Name: projects; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.projects (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    status public."ProjectStatus" DEFAULT 'PLANNING'::public."ProjectStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "smartScore" double precision,
    "smartAnalysis" jsonb,
    "organizationId" text NOT NULL,
    "createdById" text NOT NULL,
    "assignedToId" text,
    "streamId" text,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.projects OWNER TO "user";

--
-- Name: recommendations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.recommendations (
    id text NOT NULL,
    content text NOT NULL,
    status public."RecommendationStatus" DEFAULT 'OPEN'::public."RecommendationStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "referenceId" text,
    "referenceType" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.recommendations OWNER TO "user";

--
-- Name: recurring_tasks; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.recurring_tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    frequency public."Frequency" DEFAULT 'WEEKLY'::public."Frequency" NOT NULL,
    pattern text,
    "interval" integer DEFAULT 1 NOT NULL,
    "daysOfWeek" integer[] DEFAULT ARRAY[]::integer[],
    "dayOfMonth" integer,
    "weekOfMonth" integer,
    months integer[] DEFAULT ARRAY[]::integer[],
    "time" text DEFAULT '09:00'::text NOT NULL,
    "nextOccurrence" timestamp(3) without time zone,
    "lastExecuted" timestamp(3) without time zone,
    "executionCount" integer DEFAULT 0 NOT NULL,
    context text,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "estimatedMinutes" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "organizationId" text NOT NULL,
    "assignedToId" text,
    "companyId" text,
    "contactId" text,
    "projectId" text,
    "streamId" text,
    "dealId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.recurring_tasks OWNER TO "user";

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO "user";

--
-- Name: search_index; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.search_index (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "searchVector" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.search_index OWNER TO "user";

--
-- Name: services; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.services (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    subcategory text,
    price double precision NOT NULL,
    cost double precision,
    currency text DEFAULT 'USD'::text NOT NULL,
    "billingType" public."ServiceBillingType" DEFAULT 'ONE_TIME'::public."ServiceBillingType" NOT NULL,
    duration integer,
    unit text,
    "deliveryMethod" public."ServiceDeliveryMethod" DEFAULT 'REMOTE'::public."ServiceDeliveryMethod" NOT NULL,
    "estimatedDeliveryDays" integer,
    status public."ServiceStatus" DEFAULT 'AVAILABLE'::public."ServiceStatus" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    requirements text,
    resources text,
    tags text[] DEFAULT ARRAY[]::text[],
    images text[] DEFAULT ARRAY[]::text[],
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.services OWNER TO "user";

--
-- Name: smart; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.smart (
    id text NOT NULL,
    specific boolean DEFAULT false NOT NULL,
    measurable boolean DEFAULT false NOT NULL,
    achievable boolean DEFAULT false NOT NULL,
    relevant boolean DEFAULT false NOT NULL,
    "timeBound" boolean DEFAULT false NOT NULL,
    "taskId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.smart OWNER TO "user";

--
-- Name: smart_analysis_details; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.smart_analysis_details (
    id text NOT NULL,
    "specificScore" integer DEFAULT 0 NOT NULL,
    "specificNotes" text,
    "measurableScore" integer DEFAULT 0 NOT NULL,
    "measurableCriteria" text,
    "achievableScore" integer DEFAULT 0 NOT NULL,
    "achievableResources" text,
    "relevantScore" integer DEFAULT 0 NOT NULL,
    "relevantAlignment" text,
    "timeBoundScore" integer DEFAULT 0 NOT NULL,
    "timeEstimationAccuracy" text,
    "taskId" text,
    "projectId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.smart_analysis_details OWNER TO "user";

--
-- Name: smart_improvements; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.smart_improvements (
    id text NOT NULL,
    "smartDimension" text NOT NULL,
    "currentState" text NOT NULL,
    "suggestedImprovement" text NOT NULL,
    status public."ImprovementStatus" DEFAULT 'OPEN'::public."ImprovementStatus" NOT NULL,
    "taskId" text,
    "projectId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.smart_improvements OWNER TO "user";

--
-- Name: smart_mailbox_rules; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.smart_mailbox_rules (
    id text NOT NULL,
    "mailboxId" text NOT NULL,
    field text NOT NULL,
    operator text NOT NULL,
    value text NOT NULL,
    "logicOperator" text DEFAULT 'AND'::text NOT NULL,
    "ruleOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.smart_mailbox_rules OWNER TO "user";

--
-- Name: smart_mailboxes; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.smart_mailboxes (
    id text NOT NULL,
    name text NOT NULL,
    icon text DEFAULT '📧'::text NOT NULL,
    color text DEFAULT 'blue'::text NOT NULL,
    description text,
    "isBuiltIn" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "userId" text,
    "organizationId" text NOT NULL,
    "lastAccessedAt" timestamp(3) without time zone,
    "accessCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.smart_mailboxes OWNER TO "user";

--
-- Name: smart_templates; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.smart_templates (
    id text NOT NULL,
    name text NOT NULL,
    "taskTemplate" text NOT NULL,
    "measurableCriteria" text,
    "typicalResources" text,
    "estimatedDuration" integer,
    "typicalDependencies" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.smart_templates OWNER TO "user";

--
-- Name: someday_maybe; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.someday_maybe (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    category public."SomedayMaybeCategory" DEFAULT 'IDEAS'::public."SomedayMaybeCategory" NOT NULL,
    priority public."Priority" DEFAULT 'LOW'::public."Priority" NOT NULL,
    status public."SomedayMaybeStatus" DEFAULT 'ACTIVE'::public."SomedayMaybeStatus" NOT NULL,
    "whenToReview" timestamp(3) without time zone,
    tags text[] DEFAULT ARRAY[]::text[],
    "activatedAt" timestamp(3) without time zone,
    "organizationId" text NOT NULL,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.someday_maybe OWNER TO "user";

--
-- Name: sprints; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.sprints (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    name text NOT NULL,
    goal text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    velocity integer DEFAULT 0 NOT NULL,
    status public."SprintStatus" DEFAULT 'PLANNED'::public."SprintStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sprints OWNER TO "user";

--
-- Name: stream_access_logs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.stream_access_logs (
    id text NOT NULL,
    "streamId" text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    "accessType" text NOT NULL,
    "permissionId" text,
    "relationId" text,
    success boolean NOT NULL,
    "accessLevel" public."AccessLevel",
    "dataScope" public."DataScope"[],
    "errorMessage" text,
    "ipAddress" text,
    "userAgent" text,
    "requestPath" text,
    "accessedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "organizationId" text NOT NULL
);


ALTER TABLE public.stream_access_logs OWNER TO "user";

--
-- Name: stream_channels; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.stream_channels (
    id text NOT NULL,
    "streamId" text NOT NULL,
    "channelId" text NOT NULL,
    "autoCreateTasks" boolean DEFAULT false NOT NULL,
    "defaultContext" text,
    "defaultPriority" public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.stream_channels OWNER TO "user";

--
-- Name: stream_permissions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.stream_permissions (
    id text NOT NULL,
    "streamId" text,
    "relationId" text,
    "userId" text NOT NULL,
    "accessLevel" public."AccessLevel" NOT NULL,
    "dataScope" public."DataScope"[],
    conditions jsonb,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "grantedById" text NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "organizationId" text NOT NULL
);


ALTER TABLE public.stream_permissions OWNER TO "user";

--
-- Name: stream_relations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.stream_relations (
    id text NOT NULL,
    "parentId" text NOT NULL,
    "childId" text NOT NULL,
    "relationType" public."StreamRelationType" NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "inheritanceRule" public."InheritanceRule" DEFAULT 'INHERIT_DOWN'::public."InheritanceRule" NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "organizationId" text NOT NULL
);


ALTER TABLE public.stream_relations OWNER TO "user";

--
-- Name: streams; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.streams (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    icon text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    status public."StreamStatus" DEFAULT 'ACTIVE'::public."StreamStatus" NOT NULL,
    "gtdRole" public."GTDRole",
    "templateOrigin" text,
    "gtdConfig" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "streamType" public."StreamType" DEFAULT 'CUSTOM'::public."StreamType" NOT NULL,
    "organizationId" text NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.streams OWNER TO "user";

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "stripeCustomerId" text,
    "stripeSubscriptionId" text,
    "stripePriceId" text,
    plan public."SubscriptionPlan" DEFAULT 'STARTER'::public."SubscriptionPlan" NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'TRIAL'::public."SubscriptionStatus" NOT NULL,
    "currentPeriodStart" timestamp(3) without time zone,
    "currentPeriodEnd" timestamp(3) without time zone,
    "cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO "user";

--
-- Name: tags; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.tags (
    id text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6B7280'::text NOT NULL,
    category text,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tags OWNER TO "user";

--
-- Name: task_dependencies; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.task_dependencies (
    id text NOT NULL,
    "predecessorId" text NOT NULL,
    "successorId" text NOT NULL,
    "dependencyType" text DEFAULT 'finish_to_start'::text NOT NULL,
    "lagDays" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.task_dependencies OWNER TO "user";

--
-- Name: task_history; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.task_history (
    id text NOT NULL,
    "fieldName" text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "changedBy" text NOT NULL,
    "changeDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "taskId" text NOT NULL
);


ALTER TABLE public.task_history OWNER TO "user";

--
-- Name: task_relationships; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.task_relationships (
    id text NOT NULL,
    type public."RelationshipType" DEFAULT 'FINISH_TO_START'::public."RelationshipType" NOT NULL,
    lag text,
    "isCriticalPath" boolean DEFAULT false NOT NULL,
    notes text,
    "fromTaskId" text NOT NULL,
    "toTaskId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.task_relationships OWNER TO "user";

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    status public."TaskStatus" DEFAULT 'NEW'::public."TaskStatus" NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "estimatedHours" double precision,
    "actualHours" double precision,
    "contextId" text,
    energy public."EnergyLevel" DEFAULT 'MEDIUM'::public."EnergyLevel",
    "isWaitingFor" boolean DEFAULT false NOT NULL,
    "waitingForNote" text,
    "smartScore" double precision,
    "smartAnalysis" jsonb,
    "organizationId" text NOT NULL,
    "createdById" text NOT NULL,
    "assignedToId" text,
    "streamId" text,
    "projectId" text,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "sprintId" text,
    "ganttDuration" integer,
    "ganttEndDate" timestamp(3) without time zone,
    "ganttProgress" double precision DEFAULT 0 NOT NULL,
    "ganttStartDate" timestamp(3) without time zone,
    "kanbanPosition" integer DEFAULT 0 NOT NULL,
    "scrumStoryPoints" integer
);


ALTER TABLE public.tasks OWNER TO "user";

--
-- Name: timeline; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.timeline (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "eventType" text NOT NULL,
    title text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    status public."TimelineStatus" DEFAULT 'SCHEDULED'::public."TimelineStatus" NOT NULL,
    "organizationId" text NOT NULL,
    "streamId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.timeline OWNER TO "user";

--
-- Name: unified_rule_executions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.unified_rule_executions (
    id text NOT NULL,
    "ruleId" text NOT NULL,
    "triggeredBy" text,
    "triggerData" jsonb,
    "executionTime" double precision NOT NULL,
    status public."ExecutionStatus" NOT NULL,
    result jsonb,
    error text,
    "entityType" text,
    "entityId" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.unified_rule_executions OWNER TO "user";

--
-- Name: unified_rules; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.unified_rules (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "ruleType" public."UnifiedRuleType" NOT NULL,
    category text,
    status public."UnifiedRuleStatus" DEFAULT 'ACTIVE'::public."UnifiedRuleStatus" NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "triggerType" public."UnifiedTriggerType" NOT NULL,
    "triggerEvents" text[] DEFAULT ARRAY[]::text[],
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    "maxExecutionsPerHour" integer DEFAULT 100,
    "maxExecutionsPerDay" integer DEFAULT 1000,
    "cooldownPeriod" integer DEFAULT 0,
    "activeFrom" timestamp(3) without time zone,
    "activeTo" timestamp(3) without time zone,
    timezone text DEFAULT 'UTC'::text,
    "channelId" text,
    "aiModelId" text,
    "aiPromptTemplate" text,
    "fallbackModelIds" text[] DEFAULT ARRAY[]::text[],
    "organizationId" text NOT NULL,
    "executionCount" integer DEFAULT 0 NOT NULL,
    "successCount" integer DEFAULT 0 NOT NULL,
    "errorCount" integer DEFAULT 0 NOT NULL,
    "avgExecutionTime" double precision,
    "lastExecuted" timestamp(3) without time zone,
    "lastError" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.unified_rules OWNER TO "user";

--
-- Name: unimportant; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.unimportant (
    id text NOT NULL,
    content text NOT NULL,
    type text,
    source text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.unimportant OWNER TO "user";

--
-- Name: user_access_logs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.user_access_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    "targetUserId" text,
    "relationId" text,
    action text NOT NULL,
    "accessType" public."UserAccessType" DEFAULT 'DIRECT'::public."UserAccessType" NOT NULL,
    success boolean NOT NULL,
    "dataScope" public."UserDataScope"[],
    "ipAddress" text,
    "userAgent" text,
    "requestPath" text,
    "organizationId" text NOT NULL,
    "accessedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_access_logs OWNER TO "user";

--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.user_permissions (
    id text NOT NULL,
    "relationId" text NOT NULL,
    "dataScope" public."UserDataScope" NOT NULL,
    action public."UserAction" NOT NULL,
    granted boolean NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "grantedById" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_permissions OWNER TO "user";

--
-- Name: user_relations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.user_relations (
    id text NOT NULL,
    "managerId" text NOT NULL,
    "employeeId" text NOT NULL,
    "relationType" public."UserRelationType" NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "inheritanceRule" public."UserInheritanceRule" DEFAULT 'INHERIT_DOWN'::public."UserInheritanceRule" NOT NULL,
    "canDelegate" boolean DEFAULT true NOT NULL,
    "canApprove" boolean DEFAULT false NOT NULL,
    "startsAt" timestamp(3) without time zone,
    "endsAt" timestamp(3) without time zone,
    "createdById" text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_relations OWNER TO "user";

--
-- Name: user_view_preferences; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.user_view_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "viewType" public."ViewType" NOT NULL,
    preferences jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_view_preferences OWNER TO "user";

--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    avatar text,
    role public."UserRole" DEFAULT 'MEMBER'::public."UserRole" NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "organizationId" text NOT NULL
);


ALTER TABLE public.users OWNER TO "user";

--
-- Name: vector_cache; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.vector_cache (
    id text NOT NULL,
    "cacheKey" text NOT NULL,
    "queryText" text NOT NULL,
    results jsonb NOT NULL,
    "hitCount" integer DEFAULT 0 NOT NULL,
    "lastHit" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    filters jsonb,
    "limit" integer DEFAULT 10 NOT NULL,
    threshold double precision DEFAULT 0.7 NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vector_cache OWNER TO "user";

--
-- Name: vector_documents; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.vector_documents (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "contentHash" text NOT NULL,
    embedding double precision[],
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    source text NOT NULL,
    language text DEFAULT 'pl'::text NOT NULL,
    "chunkIndex" integer DEFAULT 0 NOT NULL,
    "totalChunks" integer DEFAULT 1 NOT NULL,
    "chunkSize" integer,
    "processingModel" text,
    "processingDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastUpdated" timestamp(3) without time zone NOT NULL,
    "organizationId" text NOT NULL
);


ALTER TABLE public.vector_documents OWNER TO "user";

--
-- Name: vector_search_results; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.vector_search_results (
    id text NOT NULL,
    "queryText" text NOT NULL,
    "queryEmbedding" double precision[],
    "documentId" text NOT NULL,
    similarity double precision NOT NULL,
    rank integer NOT NULL,
    "userId" text,
    "searchContext" text,
    "executionTime" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "organizationId" text NOT NULL
);


ALTER TABLE public.vector_search_results OWNER TO "user";

--
-- Name: view_analytics; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.view_analytics (
    id text NOT NULL,
    "userId" text NOT NULL,
    "viewType" public."ViewType" NOT NULL,
    action text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "durationSeconds" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.view_analytics OWNER TO "user";

--
-- Name: view_configurations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.view_configurations (
    id text NOT NULL,
    "userId" text NOT NULL,
    "viewType" public."ViewType" NOT NULL,
    "viewName" text NOT NULL,
    configuration jsonb NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.view_configurations OWNER TO "user";

--
-- Name: waiting_for; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.waiting_for (
    id text NOT NULL,
    description text NOT NULL,
    "waitingForWho" text NOT NULL,
    "sinceDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expectedResponseDate" timestamp(3) without time zone,
    "followUpDate" timestamp(3) without time zone,
    status public."WaitingForStatus" DEFAULT 'PENDING'::public."WaitingForStatus" NOT NULL,
    notes text,
    "organizationId" text NOT NULL,
    "taskId" text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.waiting_for OWNER TO "user";

--
-- Name: weekly_reviews; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.weekly_reviews (
    id text NOT NULL,
    "reviewDate" date NOT NULL,
    "completedTasksCount" integer DEFAULT 0 NOT NULL,
    "newTasksCount" integer DEFAULT 0 NOT NULL,
    "stalledTasks" integer DEFAULT 0 NOT NULL,
    "nextActions" text,
    notes text,
    "collectLoosePapers" boolean DEFAULT false NOT NULL,
    "processNotes" boolean DEFAULT false NOT NULL,
    "emptyInbox" boolean DEFAULT false NOT NULL,
    "processVoicemails" boolean DEFAULT false NOT NULL,
    "reviewActionLists" boolean DEFAULT false NOT NULL,
    "reviewCalendar" boolean DEFAULT false NOT NULL,
    "reviewProjects" boolean DEFAULT false NOT NULL,
    "reviewWaitingFor" boolean DEFAULT false NOT NULL,
    "reviewSomedayMaybe" boolean DEFAULT false NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.weekly_reviews OWNER TO "user";

--
-- Name: wiki_categories; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.wiki_categories (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    color text,
    icon text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.wiki_categories OWNER TO "user";

--
-- Name: wiki_page_links; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.wiki_page_links (
    id text NOT NULL,
    "linkText" text,
    "sourcePageId" text NOT NULL,
    "targetPageId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wiki_page_links OWNER TO "user";

--
-- Name: wiki_pages; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.wiki_pages (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    summary text,
    "isPublished" boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    template text,
    "authorId" text NOT NULL,
    "categoryId" text,
    "organizationId" text NOT NULL,
    "parentPageId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.wiki_pages OWNER TO "user";

--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: ai_executions ai_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT ai_executions_pkey PRIMARY KEY (id);


--
-- Name: ai_knowledge_bases ai_knowledge_bases_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_knowledge_bases
    ADD CONSTRAINT ai_knowledge_bases_pkey PRIMARY KEY (id);


--
-- Name: ai_knowledge_documents ai_knowledge_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_knowledge_documents
    ADD CONSTRAINT ai_knowledge_documents_pkey PRIMARY KEY (id);


--
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (id);


--
-- Name: ai_predictions ai_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_predictions
    ADD CONSTRAINT ai_predictions_pkey PRIMARY KEY (id);


--
-- Name: ai_prompt_templates ai_prompt_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT ai_prompt_templates_pkey PRIMARY KEY (id);


--
-- Name: ai_providers ai_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_providers
    ADD CONSTRAINT ai_providers_pkey PRIMARY KEY (id);


--
-- Name: ai_rules ai_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_rules
    ADD CONSTRAINT ai_rules_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_stats ai_usage_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT ai_usage_stats_pkey PRIMARY KEY (id);


--
-- Name: areas_of_responsibility areas_of_responsibility_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.areas_of_responsibility
    ADD CONSTRAINT areas_of_responsibility_pkey PRIMARY KEY (id);


--
-- Name: auto_replies auto_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.auto_replies
    ADD CONSTRAINT auto_replies_pkey PRIMARY KEY (id);


--
-- Name: bug_reports bug_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_pkey PRIMARY KEY (id);


--
-- Name: communication_channels communication_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.communication_channels
    ADD CONSTRAINT communication_channels_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- Name: completeness completeness_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.completeness
    ADD CONSTRAINT completeness_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: contexts contexts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.contexts
    ADD CONSTRAINT contexts_pkey PRIMARY KEY (id);


--
-- Name: critical_path critical_path_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.critical_path
    ADD CONSTRAINT critical_path_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: delegated_tasks delegated_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.delegated_tasks
    ADD CONSTRAINT delegated_tasks_pkey PRIMARY KEY (id);


--
-- Name: dependencies dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.dependencies
    ADD CONSTRAINT dependencies_pkey PRIMARY KEY (id);


--
-- Name: document_comments document_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_pkey PRIMARY KEY (id);


--
-- Name: document_links document_links_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_links
    ADD CONSTRAINT document_links_pkey PRIMARY KEY (id);


--
-- Name: document_shares document_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT document_shares_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: email_analysis email_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_analysis
    ADD CONSTRAINT email_analysis_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_rules email_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_rules
    ADD CONSTRAINT email_rules_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: focus_modes focus_modes_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.focus_modes
    ADD CONSTRAINT focus_modes_pkey PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: gtd_buckets gtd_buckets_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.gtd_buckets
    ADD CONSTRAINT gtd_buckets_pkey PRIMARY KEY (id);


--
-- Name: gtd_horizons gtd_horizons_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.gtd_horizons
    ADD CONSTRAINT gtd_horizons_pkey PRIMARY KEY (id);


--
-- Name: habit_entries habit_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.habit_entries
    ADD CONSTRAINT habit_entries_pkey PRIMARY KEY (id);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: inbox_items inbox_items_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT inbox_items_pkey PRIMARY KEY (id);


--
-- Name: info info_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.info
    ADD CONSTRAINT info_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: kanban_columns kanban_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.kanban_columns
    ADD CONSTRAINT kanban_columns_pkey PRIMARY KEY (id);


--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: message_attachments message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_pkey PRIMARY KEY (id);


--
-- Name: message_processing_results message_processing_results_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.message_processing_results
    ADD CONSTRAINT message_processing_results_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: metadata metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.metadata
    ADD CONSTRAINT metadata_pkey PRIMARY KEY (id);


--
-- Name: next_actions next_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT next_actions_pkey PRIMARY KEY (id);


--
-- Name: offer_items offer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offer_items
    ADD CONSTRAINT offer_items_pkey PRIMARY KEY (id);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: processing_rules processing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.processing_rules
    ADD CONSTRAINT processing_rules_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: project_dependencies project_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.project_dependencies
    ADD CONSTRAINT project_dependencies_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (id);


--
-- Name: recurring_tasks recurring_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: search_index search_index_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.search_index
    ADD CONSTRAINT search_index_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: smart_analysis_details smart_analysis_details_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_analysis_details
    ADD CONSTRAINT smart_analysis_details_pkey PRIMARY KEY (id);


--
-- Name: smart_improvements smart_improvements_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_improvements
    ADD CONSTRAINT smart_improvements_pkey PRIMARY KEY (id);


--
-- Name: smart_mailbox_rules smart_mailbox_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_mailbox_rules
    ADD CONSTRAINT smart_mailbox_rules_pkey PRIMARY KEY (id);


--
-- Name: smart_mailboxes smart_mailboxes_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_mailboxes
    ADD CONSTRAINT smart_mailboxes_pkey PRIMARY KEY (id);


--
-- Name: smart smart_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart
    ADD CONSTRAINT smart_pkey PRIMARY KEY (id);


--
-- Name: smart_templates smart_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_templates
    ADD CONSTRAINT smart_templates_pkey PRIMARY KEY (id);


--
-- Name: someday_maybe someday_maybe_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.someday_maybe
    ADD CONSTRAINT someday_maybe_pkey PRIMARY KEY (id);


--
-- Name: sprints sprints_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT sprints_pkey PRIMARY KEY (id);


--
-- Name: stream_access_logs stream_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT stream_access_logs_pkey PRIMARY KEY (id);


--
-- Name: stream_channels stream_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_channels
    ADD CONSTRAINT stream_channels_pkey PRIMARY KEY (id);


--
-- Name: stream_permissions stream_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT stream_permissions_pkey PRIMARY KEY (id);


--
-- Name: stream_relations stream_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT stream_relations_pkey PRIMARY KEY (id);


--
-- Name: streams streams_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: task_dependencies task_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT task_dependencies_pkey PRIMARY KEY (id);


--
-- Name: task_history task_history_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_pkey PRIMARY KEY (id);


--
-- Name: task_relationships task_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.task_relationships
    ADD CONSTRAINT task_relationships_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: timeline timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.timeline
    ADD CONSTRAINT timeline_pkey PRIMARY KEY (id);


--
-- Name: unified_rule_executions unified_rule_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.unified_rule_executions
    ADD CONSTRAINT unified_rule_executions_pkey PRIMARY KEY (id);


--
-- Name: unified_rules unified_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.unified_rules
    ADD CONSTRAINT unified_rules_pkey PRIMARY KEY (id);


--
-- Name: unimportant unimportant_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.unimportant
    ADD CONSTRAINT unimportant_pkey PRIMARY KEY (id);


--
-- Name: user_access_logs user_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT user_access_logs_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_relations user_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT user_relations_pkey PRIMARY KEY (id);


--
-- Name: user_view_preferences user_view_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_view_preferences
    ADD CONSTRAINT user_view_preferences_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vector_cache vector_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.vector_cache
    ADD CONSTRAINT vector_cache_pkey PRIMARY KEY (id);


--
-- Name: vector_documents vector_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.vector_documents
    ADD CONSTRAINT vector_documents_pkey PRIMARY KEY (id);


--
-- Name: vector_search_results vector_search_results_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.vector_search_results
    ADD CONSTRAINT vector_search_results_pkey PRIMARY KEY (id);


--
-- Name: view_analytics view_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.view_analytics
    ADD CONSTRAINT view_analytics_pkey PRIMARY KEY (id);


--
-- Name: view_configurations view_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.view_configurations
    ADD CONSTRAINT view_configurations_pkey PRIMARY KEY (id);


--
-- Name: waiting_for waiting_for_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.waiting_for
    ADD CONSTRAINT waiting_for_pkey PRIMARY KEY (id);


--
-- Name: weekly_reviews weekly_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.weekly_reviews
    ADD CONSTRAINT weekly_reviews_pkey PRIMARY KEY (id);


--
-- Name: wiki_categories wiki_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_categories
    ADD CONSTRAINT wiki_categories_pkey PRIMARY KEY (id);


--
-- Name: wiki_page_links wiki_page_links_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_page_links
    ADD CONSTRAINT wiki_page_links_pkey PRIMARY KEY (id);


--
-- Name: wiki_pages wiki_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT wiki_pages_pkey PRIMARY KEY (id);


--
-- Name: ai_knowledge_bases_organizationId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ai_knowledge_bases_organizationId_name_key" ON public.ai_knowledge_bases USING btree ("organizationId", name);


--
-- Name: ai_models_providerId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ai_models_providerId_name_key" ON public.ai_models USING btree ("providerId", name);


--
-- Name: ai_prompt_templates_organizationId_name_version_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ai_prompt_templates_organizationId_name_version_key" ON public.ai_prompt_templates USING btree ("organizationId", name, version);


--
-- Name: ai_providers_organizationId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ai_providers_organizationId_name_key" ON public.ai_providers USING btree ("organizationId", name);


--
-- Name: ai_rules_organizationId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ai_rules_organizationId_name_key" ON public.ai_rules USING btree ("organizationId", name);


--
-- Name: ai_usage_stats_organizationId_date_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ai_usage_stats_organizationId_date_key" ON public.ai_usage_stats USING btree ("organizationId", date);


--
-- Name: contexts_organizationId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "contexts_organizationId_name_key" ON public.contexts USING btree ("organizationId", name);


--
-- Name: document_links_sourceDocumentId_targetDocumentId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "document_links_sourceDocumentId_targetDocumentId_key" ON public.document_links USING btree ("sourceDocumentId", "targetDocumentId");


--
-- Name: document_shares_documentId_sharedWithId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "document_shares_documentId_sharedWithId_key" ON public.document_shares USING btree ("documentId", "sharedWithId");


--
-- Name: folders_organizationId_parentId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "folders_organizationId_parentId_name_key" ON public.folders USING btree ("organizationId", "parentId", name);


--
-- Name: gtd_buckets_organizationId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "gtd_buckets_organizationId_name_key" ON public.gtd_buckets USING btree ("organizationId", name);


--
-- Name: gtd_horizons_organizationId_level_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "gtd_horizons_organizationId_level_key" ON public.gtd_horizons USING btree ("organizationId", level);


--
-- Name: habit_entries_habitId_date_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "habit_entries_habitId_date_key" ON public.habit_entries USING btree ("habitId", date);


--
-- Name: inbox_items_capturedAt_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "inbox_items_capturedAt_idx" ON public.inbox_items USING btree ("capturedAt");


--
-- Name: inbox_items_organizationId_processed_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "inbox_items_organizationId_processed_idx" ON public.inbox_items USING btree ("organizationId", processed);


--
-- Name: invoices_invoiceNumber_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON public.invoices USING btree ("invoiceNumber");


--
-- Name: offers_offerNumber_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "offers_offerNumber_key" ON public.offers USING btree ("offerNumber");


--
-- Name: orders_orderNumber_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "orders_orderNumber_key" ON public.orders USING btree ("orderNumber");


--
-- Name: organizations_domain_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX organizations_domain_key ON public.organizations USING btree (domain);


--
-- Name: organizations_slug_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: search_index_entityType_entityId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "search_index_entityType_entityId_key" ON public.search_index USING btree ("entityType", "entityId");


--
-- Name: search_index_organizationId_entityType_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "search_index_organizationId_entityType_idx" ON public.search_index USING btree ("organizationId", "entityType");


--
-- Name: smart_mailboxes_organizationId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "smart_mailboxes_organizationId_name_key" ON public.smart_mailboxes USING btree ("organizationId", name);


--
-- Name: stream_access_logs_organizationId_accessedAt_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_access_logs_organizationId_accessedAt_idx" ON public.stream_access_logs USING btree ("organizationId", "accessedAt");


--
-- Name: stream_access_logs_streamId_userId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_access_logs_streamId_userId_idx" ON public.stream_access_logs USING btree ("streamId", "userId");


--
-- Name: stream_access_logs_userId_accessedAt_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_access_logs_userId_accessedAt_idx" ON public.stream_access_logs USING btree ("userId", "accessedAt");


--
-- Name: stream_channels_streamId_channelId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "stream_channels_streamId_channelId_key" ON public.stream_channels USING btree ("streamId", "channelId");


--
-- Name: stream_permissions_organizationId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_permissions_organizationId_idx" ON public.stream_permissions USING btree ("organizationId");


--
-- Name: stream_permissions_relationId_userId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_permissions_relationId_userId_idx" ON public.stream_permissions USING btree ("relationId", "userId");


--
-- Name: stream_permissions_streamId_userId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_permissions_streamId_userId_idx" ON public.stream_permissions USING btree ("streamId", "userId");


--
-- Name: stream_permissions_userId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_permissions_userId_idx" ON public.stream_permissions USING btree ("userId");


--
-- Name: stream_relations_childId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_relations_childId_idx" ON public.stream_relations USING btree ("childId");


--
-- Name: stream_relations_organizationId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_relations_organizationId_idx" ON public.stream_relations USING btree ("organizationId");


--
-- Name: stream_relations_parentId_childId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "stream_relations_parentId_childId_key" ON public.stream_relations USING btree ("parentId", "childId");


--
-- Name: stream_relations_parentId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "stream_relations_parentId_idx" ON public.stream_relations USING btree ("parentId");


--
-- Name: streams_gtdRole_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "streams_gtdRole_idx" ON public.streams USING btree ("gtdRole");


--
-- Name: streams_streamType_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "streams_streamType_idx" ON public.streams USING btree ("streamType");


--
-- Name: streams_templateOrigin_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "streams_templateOrigin_idx" ON public.streams USING btree ("templateOrigin");


--
-- Name: tags_organizationId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "tags_organizationId_name_key" ON public.tags USING btree ("organizationId", name);


--
-- Name: task_dependencies_predecessorId_successorId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "task_dependencies_predecessorId_successorId_key" ON public.task_dependencies USING btree ("predecessorId", "successorId");


--
-- Name: user_access_logs_accessedAt_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_access_logs_accessedAt_idx" ON public.user_access_logs USING btree ("accessedAt");


--
-- Name: user_access_logs_organizationId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_access_logs_organizationId_idx" ON public.user_access_logs USING btree ("organizationId");


--
-- Name: user_access_logs_targetUserId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_access_logs_targetUserId_idx" ON public.user_access_logs USING btree ("targetUserId");


--
-- Name: user_access_logs_userId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_access_logs_userId_idx" ON public.user_access_logs USING btree ("userId");


--
-- Name: user_permissions_dataScope_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_permissions_dataScope_idx" ON public.user_permissions USING btree ("dataScope");


--
-- Name: user_permissions_organizationId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_permissions_organizationId_idx" ON public.user_permissions USING btree ("organizationId");


--
-- Name: user_permissions_relationId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_permissions_relationId_idx" ON public.user_permissions USING btree ("relationId");


--
-- Name: user_relations_employeeId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_relations_employeeId_idx" ON public.user_relations USING btree ("employeeId");


--
-- Name: user_relations_isActive_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_relations_isActive_idx" ON public.user_relations USING btree ("isActive");


--
-- Name: user_relations_managerId_employeeId_relationType_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "user_relations_managerId_employeeId_relationType_key" ON public.user_relations USING btree ("managerId", "employeeId", "relationType");


--
-- Name: user_relations_managerId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_relations_managerId_idx" ON public.user_relations USING btree ("managerId");


--
-- Name: user_relations_organizationId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "user_relations_organizationId_idx" ON public.user_relations USING btree ("organizationId");


--
-- Name: user_view_preferences_userId_viewType_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "user_view_preferences_userId_viewType_key" ON public.user_view_preferences USING btree ("userId", "viewType");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: vector_cache_cacheKey_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "vector_cache_cacheKey_key" ON public.vector_cache USING btree ("cacheKey");


--
-- Name: vector_cache_expiresAt_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "vector_cache_expiresAt_idx" ON public.vector_cache USING btree ("expiresAt");


--
-- Name: vector_cache_organizationId_cacheKey_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "vector_cache_organizationId_cacheKey_idx" ON public.vector_cache USING btree ("organizationId", "cacheKey");


--
-- Name: vector_documents_contentHash_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "vector_documents_contentHash_idx" ON public.vector_documents USING btree ("contentHash");


--
-- Name: vector_documents_contentHash_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "vector_documents_contentHash_key" ON public.vector_documents USING btree ("contentHash");


--
-- Name: vector_documents_organizationId_entityId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "vector_documents_organizationId_entityId_idx" ON public.vector_documents USING btree ("organizationId", "entityId");


--
-- Name: vector_documents_organizationId_entityType_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "vector_documents_organizationId_entityType_idx" ON public.vector_documents USING btree ("organizationId", "entityType");


--
-- Name: vector_search_results_createdAt_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "vector_search_results_createdAt_idx" ON public.vector_search_results USING btree ("createdAt");


--
-- Name: vector_search_results_organizationId_userId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "vector_search_results_organizationId_userId_idx" ON public.vector_search_results USING btree ("organizationId", "userId");


--
-- Name: weekly_reviews_organizationId_reviewDate_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "weekly_reviews_organizationId_reviewDate_key" ON public.weekly_reviews USING btree ("organizationId", "reviewDate");


--
-- Name: wiki_categories_organizationId_name_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "wiki_categories_organizationId_name_key" ON public.wiki_categories USING btree ("organizationId", name);


--
-- Name: wiki_page_links_sourcePageId_targetPageId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "wiki_page_links_sourcePageId_targetPageId_key" ON public.wiki_page_links USING btree ("sourcePageId", "targetPageId");


--
-- Name: wiki_pages_organizationId_slug_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "wiki_pages_organizationId_slug_key" ON public.wiki_pages USING btree ("organizationId", slug);


--
-- Name: activities activities_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public.meetings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activities activities_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_executions ai_executions_modelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES public.ai_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_executions ai_executions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_executions ai_executions_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public.ai_providers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_executions ai_executions_ruleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES public.ai_rules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_executions ai_executions_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.ai_prompt_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_knowledge_bases ai_knowledge_bases_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_knowledge_bases
    ADD CONSTRAINT "ai_knowledge_bases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_knowledge_documents ai_knowledge_documents_knowledgeBaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_knowledge_documents
    ADD CONSTRAINT "ai_knowledge_documents_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES public.ai_knowledge_bases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_models ai_models_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT "ai_models_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public.ai_providers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_prompt_templates ai_prompt_templates_modelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT "ai_prompt_templates_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES public.ai_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_prompt_templates ai_prompt_templates_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT "ai_prompt_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_providers ai_providers_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_providers
    ADD CONSTRAINT "ai_providers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_rules ai_rules_modelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_rules
    ADD CONSTRAINT "ai_rules_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES public.ai_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_rules ai_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_rules
    ADD CONSTRAINT "ai_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_rules ai_rules_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_rules
    ADD CONSTRAINT "ai_rules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.ai_prompt_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_usage_stats ai_usage_stats_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT "ai_usage_stats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: areas_of_responsibility areas_of_responsibility_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.areas_of_responsibility
    ADD CONSTRAINT "areas_of_responsibility_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auto_replies auto_replies_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.auto_replies
    ADD CONSTRAINT "auto_replies_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: auto_replies auto_replies_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.auto_replies
    ADD CONSTRAINT "auto_replies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bug_reports bug_reports_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT "bug_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bug_reports bug_reports_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT "bug_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: communication_channels communication_channels_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.communication_channels
    ADD CONSTRAINT "communication_channels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: communication_channels communication_channels_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.communication_channels
    ADD CONSTRAINT "communication_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: companies companies_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "companies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: companies companies_primaryContactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "companies_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: completeness completeness_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.completeness
    ADD CONSTRAINT "completeness_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: completeness completeness_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.completeness
    ADD CONSTRAINT "completeness_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contacts contacts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contacts contacts_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contexts contexts_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.contexts
    ADD CONSTRAINT "contexts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: critical_path critical_path_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.critical_path
    ADD CONSTRAINT "critical_path_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deals deals_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deals deals_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deals deals_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: delegated_tasks delegated_tasks_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.delegated_tasks
    ADD CONSTRAINT "delegated_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: delegated_tasks delegated_tasks_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.delegated_tasks
    ADD CONSTRAINT "delegated_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: document_comments document_comments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT "document_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_comments document_comments_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT "document_comments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_comments document_comments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT "document_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.document_comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_links document_links_sourceDocumentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_links
    ADD CONSTRAINT "document_links_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_links document_links_targetDocumentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_links
    ADD CONSTRAINT "document_links_targetDocumentId_fkey" FOREIGN KEY ("targetDocumentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_shares document_shares_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT "document_shares_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_shares document_shares_sharedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT "document_shares_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_shares document_shares_sharedWithId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT "document_shares_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_analysis email_analysis_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_analysis
    ADD CONSTRAINT "email_analysis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_logs email_logs_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT "email_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_logs email_logs_sentByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT "email_logs_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: email_rules email_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_rules
    ADD CONSTRAINT "email_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_templates email_templates_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT "email_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: email_templates email_templates_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT "email_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: error_logs error_logs_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT "error_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: error_logs error_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: files files_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: focus_modes focus_modes_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.focus_modes
    ADD CONSTRAINT "focus_modes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gtd_buckets gtd_buckets_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.gtd_buckets
    ADD CONSTRAINT "gtd_buckets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gtd_horizons gtd_horizons_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.gtd_horizons
    ADD CONSTRAINT "gtd_horizons_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: habit_entries habit_entries_habitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.habit_entries
    ADD CONSTRAINT "habit_entries_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES public.habits(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: habits habits_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT "habits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inbox_items inbox_items_capturedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inbox_items inbox_items_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inbox_items inbox_items_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_resultingTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_resultingTaskId_fkey" FOREIGN KEY ("resultingTaskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: info info_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.info
    ADD CONSTRAINT "info_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice_items invoice_items_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "invoice_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kanban_columns kanban_columns_viewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.kanban_columns
    ADD CONSTRAINT "kanban_columns_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES public.view_configurations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: knowledge_base knowledge_base_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT "knowledge_base_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leads leads_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meetings meetings_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT "meetings_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meetings meetings_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT "meetings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meetings meetings_organizedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT "meetings_organizedById_fkey" FOREIGN KEY ("organizedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: message_attachments message_attachments_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_processing_results message_processing_results_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.message_processing_results
    ADD CONSTRAINT "message_processing_results_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_processing_results message_processing_results_ruleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.message_processing_results
    ADD CONSTRAINT "message_processing_results_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES public.processing_rules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: next_actions next_actions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: next_actions next_actions_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offer_items offer_items_offerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offer_items
    ADD CONSTRAINT "offer_items_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES public.offers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: offer_items offer_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offer_items
    ADD CONSTRAINT "offer_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offer_items offer_items_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offer_items
    ADD CONSTRAINT "offer_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offers offers_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offers offers_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offers offers_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: offers offers_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offers offers_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_items order_items_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: processing_rules processing_rules_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.processing_rules
    ADD CONSTRAINT "processing_rules_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: processing_rules processing_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.processing_rules
    ADD CONSTRAINT "processing_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: processing_rules processing_rules_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.processing_rules
    ADD CONSTRAINT "processing_rules_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_dependencies project_dependencies_dependentProjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.project_dependencies
    ADD CONSTRAINT "project_dependencies_dependentProjectId_fkey" FOREIGN KEY ("dependentProjectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_dependencies project_dependencies_sourceProjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.project_dependencies
    ADD CONSTRAINT "project_dependencies_sourceProjectId_fkey" FOREIGN KEY ("sourceProjectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: projects projects_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: projects projects_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: projects projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recommendations recommendations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT "recommendations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recurring_tasks recurring_tasks_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recurring_tasks recurring_tasks_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: search_index search_index_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.search_index
    ADD CONSTRAINT "search_index_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: services services_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: smart_analysis_details smart_analysis_details_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_analysis_details
    ADD CONSTRAINT "smart_analysis_details_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_analysis_details smart_analysis_details_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_analysis_details
    ADD CONSTRAINT "smart_analysis_details_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_improvements smart_improvements_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_improvements
    ADD CONSTRAINT "smart_improvements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_improvements smart_improvements_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_improvements
    ADD CONSTRAINT "smart_improvements_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_mailbox_rules smart_mailbox_rules_mailboxId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_mailbox_rules
    ADD CONSTRAINT "smart_mailbox_rules_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES public.smart_mailboxes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: smart_mailboxes smart_mailboxes_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_mailboxes
    ADD CONSTRAINT "smart_mailboxes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: smart_mailboxes smart_mailboxes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_mailboxes
    ADD CONSTRAINT "smart_mailboxes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart smart_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart
    ADD CONSTRAINT "smart_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_templates smart_templates_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.smart_templates
    ADD CONSTRAINT "smart_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: someday_maybe someday_maybe_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.someday_maybe
    ADD CONSTRAINT "someday_maybe_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: someday_maybe someday_maybe_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.someday_maybe
    ADD CONSTRAINT "someday_maybe_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sprints sprints_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT "sprints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_access_logs stream_access_logs_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_access_logs stream_access_logs_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.stream_permissions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stream_access_logs stream_access_logs_relationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES public.stream_relations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stream_access_logs stream_access_logs_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_access_logs stream_access_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_channels stream_channels_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_channels
    ADD CONSTRAINT "stream_channels_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_channels stream_channels_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_channels
    ADD CONSTRAINT "stream_channels_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_permissions stream_permissions_grantedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stream_permissions stream_permissions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_permissions stream_permissions_relationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES public.stream_relations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_permissions stream_permissions_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_permissions stream_permissions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_relations stream_relations_childId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT "stream_relations_childId_fkey" FOREIGN KEY ("childId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_relations stream_relations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT "stream_relations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stream_relations stream_relations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT "stream_relations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_relations stream_relations_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT "stream_relations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: streams streams_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT "streams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: streams streams_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT "streams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tags tags_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "tags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_dependencies task_dependencies_predecessorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT "task_dependencies_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_dependencies task_dependencies_successorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT "task_dependencies_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_history task_history_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT "task_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_relationships task_relationships_fromTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.task_relationships
    ADD CONSTRAINT "task_relationships_fromTaskId_fkey" FOREIGN KEY ("fromTaskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_relationships task_relationships_toTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.task_relationships
    ADD CONSTRAINT "task_relationships_toTaskId_fkey" FOREIGN KEY ("toTaskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_contextId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES public.contexts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tasks tasks_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_sprintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES public.sprints(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: timeline timeline_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.timeline
    ADD CONSTRAINT "timeline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: timeline timeline_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.timeline
    ADD CONSTRAINT "timeline_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: unified_rule_executions unified_rule_executions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.unified_rule_executions
    ADD CONSTRAINT "unified_rule_executions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unified_rule_executions unified_rule_executions_ruleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.unified_rule_executions
    ADD CONSTRAINT "unified_rule_executions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES public.unified_rules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unified_rules unified_rules_aiModelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.unified_rules
    ADD CONSTRAINT "unified_rules_aiModelId_fkey" FOREIGN KEY ("aiModelId") REFERENCES public.ai_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: unified_rules unified_rules_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.unified_rules
    ADD CONSTRAINT "unified_rules_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: unified_rules unified_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.unified_rules
    ADD CONSTRAINT "unified_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unimportant unimportant_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.unimportant
    ADD CONSTRAINT "unimportant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_access_logs user_access_logs_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT "user_access_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_access_logs user_access_logs_relationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT "user_access_logs_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES public.user_relations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_access_logs user_access_logs_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT "user_access_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_access_logs user_access_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT "user_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_permissions user_permissions_grantedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_permissions user_permissions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_relationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES public.user_relations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_relations user_relations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT "user_relations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_relations user_relations_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT "user_relations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_relations user_relations_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT "user_relations_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_relations user_relations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT "user_relations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_view_preferences user_view_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_view_preferences
    ADD CONSTRAINT "user_view_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_cache vector_cache_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.vector_cache
    ADD CONSTRAINT "vector_cache_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_documents vector_documents_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.vector_documents
    ADD CONSTRAINT "vector_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_search_results vector_search_results_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.vector_search_results
    ADD CONSTRAINT "vector_search_results_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.vector_documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_search_results vector_search_results_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.vector_search_results
    ADD CONSTRAINT "vector_search_results_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_search_results vector_search_results_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.vector_search_results
    ADD CONSTRAINT "vector_search_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: view_analytics view_analytics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.view_analytics
    ADD CONSTRAINT "view_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: view_configurations view_configurations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.view_configurations
    ADD CONSTRAINT "view_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: waiting_for waiting_for_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.waiting_for
    ADD CONSTRAINT "waiting_for_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: waiting_for waiting_for_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.waiting_for
    ADD CONSTRAINT "waiting_for_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: waiting_for waiting_for_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.waiting_for
    ADD CONSTRAINT "waiting_for_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: weekly_reviews weekly_reviews_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.weekly_reviews
    ADD CONSTRAINT "weekly_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_categories wiki_categories_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_categories
    ADD CONSTRAINT "wiki_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_page_links wiki_page_links_sourcePageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_page_links
    ADD CONSTRAINT "wiki_page_links_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES public.wiki_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_page_links wiki_page_links_targetPageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_page_links
    ADD CONSTRAINT "wiki_page_links_targetPageId_fkey" FOREIGN KEY ("targetPageId") REFERENCES public.wiki_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_pages wiki_pages_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT "wiki_pages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_pages wiki_pages_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT "wiki_pages_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.wiki_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: wiki_pages wiki_pages_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT "wiki_pages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_pages wiki_pages_parentPageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT "wiki_pages_parentPageId_fkey" FOREIGN KEY ("parentPageId") REFERENCES public.wiki_pages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

