--
-- PostgreSQL database dump
--

\restrict CrQEY39NdjrE1kk44qdc784ShgcDQE4aXdRcwIMqTvRS41RodOplbUy53Q0GZgX

-- Dumped from database version 14.20 (Debian 14.20-1.pgdg12+1)
-- Dumped by pg_dump version 14.20 (Debian 14.20-1.pgdg12+1)

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
-- Name: AIDocumentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AIDocumentStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PROCESSING',
    'ERROR'
);


ALTER TYPE public."AIDocumentStatus" OWNER TO postgres;

--
-- Name: AIExecutionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AIExecutionStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'SUCCESS',
    'FAILED',
    'TIMEOUT',
    'CANCELLED'
);


ALTER TYPE public."AIExecutionStatus" OWNER TO postgres;

--
-- Name: AIKnowledgeStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AIKnowledgeStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'INDEXING',
    'ERROR'
);


ALTER TYPE public."AIKnowledgeStatus" OWNER TO postgres;

--
-- Name: AIModelStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AIModelStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'BETA',
    'DEPRECATED'
);


ALTER TYPE public."AIModelStatus" OWNER TO postgres;

--
-- Name: AIModelType; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."AIModelType" OWNER TO postgres;

--
-- Name: AIProviderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AIProviderStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE',
    'DEPRECATED'
);


ALTER TYPE public."AIProviderStatus" OWNER TO postgres;

--
-- Name: AIRuleStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AIRuleStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'TESTING',
    'ARCHIVED'
);


ALTER TYPE public."AIRuleStatus" OWNER TO postgres;

--
-- Name: AITemplateStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AITemplateStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DRAFT',
    'ARCHIVED'
);


ALTER TYPE public."AITemplateStatus" OWNER TO postgres;

--
-- Name: AITriggerType; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."AITriggerType" OWNER TO postgres;

--
-- Name: AccessLevel; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."AccessLevel" OWNER TO postgres;

--
-- Name: ActionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ActionStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."ActionStatus" OWNER TO postgres;

--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."ActivityType" OWNER TO postgres;

--
-- Name: AgentActionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgentActionType" AS ENUM (
    'CREATE_TASK',
    'UPDATE_TASK',
    'CREATE_PROJECT',
    'UPDATE_DEAL',
    'SEND_EMAIL',
    'SCHEDULE_MEETING',
    'CREATE_DOCUMENT',
    'ADD_CONTACT',
    'SEARCH_DATA',
    'GENERATE_REPORT',
    'CUSTOM'
);


ALTER TYPE public."AgentActionType" OWNER TO postgres;

--
-- Name: AgentTaskStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgentTaskStatus" AS ENUM (
    'PENDING',
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."AgentTaskStatus" OWNER TO postgres;

--
-- Name: AreaReviewFrequency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AreaReviewFrequency" AS ENUM (
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY'
);


ALTER TYPE public."AreaReviewFrequency" OWNER TO postgres;

--
-- Name: AutoReplyStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AutoReplyStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SCHEDULED'
);


ALTER TYPE public."AutoReplyStatus" OWNER TO postgres;

--
-- Name: BreakType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BreakType" AS ENUM (
    'COFFEE',
    'MEAL',
    'STRETCH',
    'WALK',
    'MEDITATION',
    'SOCIAL',
    'FREE',
    'TRANSITION'
);


ALTER TYPE public."BreakType" OWNER TO postgres;

--
-- Name: BugCategory; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."BugCategory" OWNER TO postgres;

--
-- Name: BugPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BugPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."BugPriority" OWNER TO postgres;

--
-- Name: BugStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BugStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'WONT_FIX'
);


ALTER TYPE public."BugStatus" OWNER TO postgres;

--
-- Name: ChannelType; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."ChannelType" OWNER TO postgres;

--
-- Name: ColumnType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ColumnType" AS ENUM (
    'STAGE',
    'PRIORITY',
    'CONTEXT',
    'SENTIMENT',
    'SIZE',
    'ASSIGNEE'
);


ALTER TYPE public."ColumnType" OWNER TO postgres;

--
-- Name: CompanySize; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CompanySize" AS ENUM (
    'STARTUP',
    'SMALL',
    'MEDIUM',
    'LARGE',
    'ENTERPRISE'
);


ALTER TYPE public."CompanySize" OWNER TO postgres;

--
-- Name: CompanyStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CompanyStatus" AS ENUM (
    'PROSPECT',
    'CUSTOMER',
    'PARTNER',
    'INACTIVE',
    'ARCHIVED'
);


ALTER TYPE public."CompanyStatus" OWNER TO postgres;

--
-- Name: ComplaintStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ComplaintStatus" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'ESCALATED'
);


ALTER TYPE public."ComplaintStatus" OWNER TO postgres;

--
-- Name: Complexity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Complexity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."Complexity" OWNER TO postgres;

--
-- Name: ContactStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ContactStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'LEAD',
    'CUSTOMER',
    'ARCHIVED'
);


ALTER TYPE public."ContactStatus" OWNER TO postgres;

--
-- Name: ConversationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ConversationStatus" AS ENUM (
    'ACTIVE',
    'PAUSED',
    'ARCHIVED',
    'COMPLETED'
);


ALTER TYPE public."ConversationStatus" OWNER TO postgres;

--
-- Name: DataScope; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."DataScope" OWNER TO postgres;

--
-- Name: DayOfWeek; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DayOfWeek" AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
);


ALTER TYPE public."DayOfWeek" OWNER TO postgres;

--
-- Name: DealStage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DealStage" AS ENUM (
    'PROSPECT',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST'
);


ALTER TYPE public."DealStage" OWNER TO postgres;

--
-- Name: DependencyType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DependencyType" AS ENUM (
    'FINISH_TO_START',
    'START_TO_START',
    'FINISH_TO_FINISH',
    'START_TO_FINISH'
);


ALTER TYPE public."DependencyType" OWNER TO postgres;

--
-- Name: DocumentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DocumentStatus" AS ENUM (
    'DRAFT',
    'REVIEW',
    'PUBLISHED',
    'ARCHIVED',
    'DEPRECATED'
);


ALTER TYPE public."DocumentStatus" OWNER TO postgres;

--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."DocumentType" OWNER TO postgres;

--
-- Name: Effort; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Effort" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."Effort" OWNER TO postgres;

--
-- Name: EmailAccountStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EmailAccountStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'ERROR',
    'DISABLED',
    'QUOTA_EXCEEDED'
);


ALTER TYPE public."EmailAccountStatus" OWNER TO postgres;

--
-- Name: EmailCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EmailCategory" AS ENUM (
    'VIP',
    'SPAM',
    'INVOICES',
    'ARCHIVE',
    'UNKNOWN'
);


ALTER TYPE public."EmailCategory" OWNER TO postgres;

--
-- Name: EmailProvider; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EmailProvider" AS ENUM (
    'SMTP',
    'SENDGRID',
    'AWS_SES',
    'MAILGUN',
    'POSTMARK',
    'GMAIL',
    'OUTLOOK',
    'EXCHANGE',
    'YAHOO',
    'CUSTOM'
);


ALTER TYPE public."EmailProvider" OWNER TO postgres;

--
-- Name: EnergyLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EnergyLevel" AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW',
    'CREATIVE',
    'ADMINISTRATIVE'
);


ALTER TYPE public."EnergyLevel" OWNER TO postgres;

--
-- Name: ErrorSeverity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ErrorSeverity" AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public."ErrorSeverity" OWNER TO postgres;

--
-- Name: ExecutionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ExecutionStatus" AS ENUM (
    'SUCCESS',
    'PARTIAL_SUCCESS',
    'FAILED',
    'TIMEOUT',
    'CANCELLED',
    'RETRYING'
);


ALTER TYPE public."ExecutionStatus" OWNER TO postgres;

--
-- Name: FeedbackType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FeedbackType" AS ENUM (
    'HELPFUL',
    'NOT_HELPFUL',
    'INCORRECT',
    'INCOMPLETE',
    'EXCELLENT'
);


ALTER TYPE public."FeedbackType" OWNER TO postgres;

--
-- Name: FlowAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FlowAction" AS ENUM (
    'ZROB_TERAZ',
    'ZAPLANUJ',
    'PROJEKT',
    'KIEDYS_MOZE',
    'REFERENCJA',
    'USUN'
);


ALTER TYPE public."FlowAction" OWNER TO postgres;

--
-- Name: FlowConversationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FlowConversationStatus" AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."FlowConversationStatus" OWNER TO postgres;

--
-- Name: FlowElementType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FlowElementType" AS ENUM (
    'EMAIL',
    'VOICE',
    'DOCUMENT_INVOICE',
    'DOCUMENT_CONTRACT',
    'IMAGE_BUSINESS_CARD',
    'IMAGE_RECEIPT',
    'IMAGE_WHITEBOARD',
    'LINK',
    'IDEA',
    'EVENT',
    'SMS',
    'OTHER'
);


ALTER TYPE public."FlowElementType" OWNER TO postgres;

--
-- Name: FlowProcessingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FlowProcessingStatus" AS ENUM (
    'PENDING',
    'ANALYZING',
    'AWAITING_DECISION',
    'PROCESSED',
    'SPLIT',
    'ERROR',
    'FROZEN',
    'REFERENCE',
    'DELETED'
);


ALTER TYPE public."FlowProcessingStatus" OWNER TO postgres;

--
-- Name: Frequency; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."Frequency" OWNER TO postgres;

--
-- Name: GTDRole; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."GTDRole" OWNER TO postgres;

--
-- Name: Impact; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Impact" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."Impact" OWNER TO postgres;

--
-- Name: Importance; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Importance" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."Importance" OWNER TO postgres;

--
-- Name: ImprovementStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ImprovementStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED'
);


ALTER TYPE public."ImprovementStatus" OWNER TO postgres;

--
-- Name: InboxSourceType; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."InboxSourceType" OWNER TO postgres;

--
-- Name: InheritanceRule; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InheritanceRule" AS ENUM (
    'NO_INHERITANCE',
    'INHERIT_DOWN',
    'INHERIT_UP',
    'BIDIRECTIONAL'
);


ALTER TYPE public."InheritanceRule" OWNER TO postgres;

--
-- Name: InvoiceItemType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoiceItemType" AS ENUM (
    'PRODUCT',
    'SERVICE',
    'CUSTOM'
);


ALTER TYPE public."InvoiceItemType" OWNER TO postgres;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'PENDING',
    'SENT',
    'PAID',
    'OVERDUE',
    'CANCELED'
);


ALTER TYPE public."InvoiceStatus" OWNER TO postgres;

--
-- Name: LeadStatus; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."LeadStatus" OWNER TO postgres;

--
-- Name: LearningType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LearningType" AS ENUM (
    'USER_PREFERENCE',
    'WORK_PATTERN',
    'COMMUNICATION_STYLE',
    'PRIORITY_PATTERN',
    'TIME_PATTERN',
    'QUERY_PATTERN'
);


ALTER TYPE public."LearningType" OWNER TO postgres;

--
-- Name: LinkType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LinkType" AS ENUM (
    'REFERENCE',
    'RELATED',
    'PREREQUISITE',
    'DEPENDENCY',
    'INSPIRATION',
    'CONTRADICTION'
);


ALTER TYPE public."LinkType" OWNER TO postgres;

--
-- Name: MeetingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MeetingStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED'
);


ALTER TYPE public."MeetingStatus" OWNER TO postgres;

--
-- Name: MessagePriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MessagePriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."MessagePriority" OWNER TO postgres;

--
-- Name: MessageRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MessageRole" AS ENUM (
    'USER',
    'ASSISTANT',
    'SYSTEM'
);


ALTER TYPE public."MessageRole" OWNER TO postgres;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MessageType" AS ENUM (
    'INBOX',
    'SENT',
    'DRAFT',
    'SPAM',
    'TRASH'
);


ALTER TYPE public."MessageType" OWNER TO postgres;

--
-- Name: OfferItemType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OfferItemType" AS ENUM (
    'PRODUCT',
    'SERVICE',
    'CUSTOM'
);


ALTER TYPE public."OfferItemType" OWNER TO postgres;

--
-- Name: OfferStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OfferStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'CANCELED'
);


ALTER TYPE public."OfferStatus" OWNER TO postgres;

--
-- Name: OrderItemType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderItemType" AS ENUM (
    'PRODUCT',
    'SERVICE',
    'CUSTOM'
);


ALTER TYPE public."OrderItemType" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'SHIPPED',
    'DELIVERED',
    'CANCELED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: Priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."Priority" OWNER TO postgres;

--
-- Name: ProactiveTaskType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProactiveTaskType" AS ENUM (
    'MORNING_BRIEFING',
    'DEADLINE_CHECK',
    'FOLLOW_UP_REMINDER',
    'RISK_DETECTION',
    'OPPORTUNITY_ALERT',
    'WEEKLY_SUMMARY',
    'DATA_SYNC',
    'CUSTOM'
);


ALTER TYPE public."ProactiveTaskType" OWNER TO postgres;

--
-- Name: ProcessingDecision; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."ProcessingDecision" OWNER TO postgres;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DISCONTINUED',
    'OUT_OF_STOCK'
);


ALTER TYPE public."ProductStatus" OWNER TO postgres;

--
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'PLANNING',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELED'
);


ALTER TYPE public."ProjectStatus" OWNER TO postgres;

--
-- Name: RecommendationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RecommendationStatus" AS ENUM (
    'OPEN',
    'ACCEPTED',
    'REJECTED',
    'IMPLEMENTED'
);


ALTER TYPE public."RecommendationStatus" OWNER TO postgres;

--
-- Name: RelationshipType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RelationshipType" AS ENUM (
    'FINISH_TO_START',
    'START_TO_START',
    'FINISH_TO_FINISH',
    'START_TO_FINISH'
);


ALTER TYPE public."RelationshipType" OWNER TO postgres;

--
-- Name: RescheduleReason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RescheduleReason" AS ENUM (
    'NO_TASKS_IN_CONTEXT',
    'INSUFFICIENT_ENERGY',
    'INTERRUPTION',
    'PRIORITY_CHANGE',
    'TECHNICAL_ISSUES',
    'MEETING_CONFLICT',
    'USER_PREFERENCE'
);


ALTER TYPE public."RescheduleReason" OWNER TO postgres;

--
-- Name: ReviewFrequency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReviewFrequency" AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'CUSTOM'
);


ALTER TYPE public."ReviewFrequency" OWNER TO postgres;

--
-- Name: ScheduledTaskStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ScheduledTaskStatus" AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'RESCHEDULED',
    'OVERDUE'
);


ALTER TYPE public."ScheduledTaskStatus" OWNER TO postgres;

--
-- Name: ServiceBillingType; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."ServiceBillingType" OWNER TO postgres;

--
-- Name: ServiceDeliveryMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ServiceDeliveryMethod" AS ENUM (
    'REMOTE',
    'ON_SITE',
    'HYBRID',
    'DIGITAL_DELIVERY',
    'PHYSICAL_DELIVERY'
);


ALTER TYPE public."ServiceDeliveryMethod" OWNER TO postgres;

--
-- Name: ServiceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ServiceStatus" AS ENUM (
    'AVAILABLE',
    'UNAVAILABLE',
    'TEMPORARILY_UNAVAILABLE',
    'DISCONTINUED'
);


ALTER TYPE public."ServiceStatus" OWNER TO postgres;

--
-- Name: SharePermission; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SharePermission" AS ENUM (
    'READ',
    'COMMENT',
    'EDIT',
    'ADMIN'
);


ALTER TYPE public."SharePermission" OWNER TO postgres;

--
-- Name: SomedayMaybeCategory; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."SomedayMaybeCategory" OWNER TO postgres;

--
-- Name: SomedayMaybeStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SomedayMaybeStatus" AS ENUM (
    'ACTIVE',
    'ACTIVATED',
    'ARCHIVED'
);


ALTER TYPE public."SomedayMaybeStatus" OWNER TO postgres;

--
-- Name: SprintStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SprintStatus" AS ENUM (
    'PLANNED',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."SprintStatus" OWNER TO postgres;

--
-- Name: StreamRelationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StreamRelationType" AS ENUM (
    'OWNS',
    'MANAGES',
    'BELONGS_TO',
    'RELATED_TO',
    'DEPENDS_ON',
    'SUPPORTS'
);


ALTER TYPE public."StreamRelationType" OWNER TO postgres;

--
-- Name: StreamStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StreamStatus" AS ENUM (
    'ACTIVE',
    'ARCHIVED',
    'TEMPLATE',
    'FLOWING',
    'FROZEN'
);


ALTER TYPE public."StreamStatus" OWNER TO postgres;

--
-- Name: StreamType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StreamType" AS ENUM (
    'WORKSPACE',
    'PROJECT',
    'AREA',
    'CONTEXT',
    'CUSTOM'
);


ALTER TYPE public."StreamType" OWNER TO postgres;

--
-- Name: SubscriptionPlan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionPlan" AS ENUM (
    'STARTER',
    'PROFESSIONAL',
    'ENTERPRISE'
);


ALTER TYPE public."SubscriptionPlan" OWNER TO postgres;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'PAUSED'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO postgres;

--
-- Name: SuggestionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SuggestionStatus" AS ENUM (
    'PENDING',
    'VIEWED',
    'ACCEPTED',
    'DISMISSED',
    'EXPIRED'
);


ALTER TYPE public."SuggestionStatus" OWNER TO postgres;

--
-- Name: SuggestionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SuggestionType" AS ENUM (
    'TASK_OPTIMIZATION',
    'DEADLINE_WARNING',
    'FOLLOW_UP_REMINDER',
    'PROCESS_IMPROVEMENT',
    'DATA_INSIGHT',
    'RISK_ALERT',
    'OPPORTUNITY'
);


ALTER TYPE public."SuggestionType" OWNER TO postgres;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'WAITING',
    'COMPLETED',
    'CANCELED'
);


ALTER TYPE public."TaskStatus" OWNER TO postgres;

--
-- Name: TemplateFocusStyle; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TemplateFocusStyle" AS ENUM (
    'DEEP_WORK',
    'MEETINGS',
    'CREATIVE',
    'ADMIN',
    'MIXED'
);


ALTER TYPE public."TemplateFocusStyle" OWNER TO postgres;

--
-- Name: TemplateIntensity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TemplateIntensity" AS ENUM (
    'LIGHT',
    'MEDIUM',
    'HEAVY'
);


ALTER TYPE public."TemplateIntensity" OWNER TO postgres;

--
-- Name: TemplateSource; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TemplateSource" AS ENUM (
    'USER',
    'AI',
    'HYBRID',
    'IMPORTED'
);


ALTER TYPE public."TemplateSource" OWNER TO postgres;

--
-- Name: TemplateType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TemplateType" AS ENUM (
    'WORKDAY',
    'CREATIVE',
    'ADMIN',
    'MEETING',
    'MIXED',
    'CUSTOM'
);


ALTER TYPE public."TemplateType" OWNER TO postgres;

--
-- Name: TimelineStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TimelineStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED'
);


ALTER TYPE public."TimelineStatus" OWNER TO postgres;

--
-- Name: UnifiedRuleStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UnifiedRuleStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DRAFT',
    'TESTING',
    'ERROR',
    'DEPRECATED'
);


ALTER TYPE public."UnifiedRuleStatus" OWNER TO postgres;

--
-- Name: UnifiedRuleType; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."UnifiedRuleType" OWNER TO postgres;

--
-- Name: UnifiedTriggerType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UnifiedTriggerType" AS ENUM (
    'MANUAL',
    'AUTOMATIC',
    'EVENT_BASED',
    'SCHEDULED',
    'WEBHOOK',
    'API_CALL'
);


ALTER TYPE public."UnifiedTriggerType" OWNER TO postgres;

--
-- Name: UserAccessType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserAccessType" AS ENUM (
    'DIRECT',
    'RELATION_BASED',
    'ROLE_BASED',
    'TEMPORARY'
);


ALTER TYPE public."UserAccessType" OWNER TO postgres;

--
-- Name: UserAction; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."UserAction" OWNER TO postgres;

--
-- Name: UserDataScope; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."UserDataScope" OWNER TO postgres;

--
-- Name: UserInheritanceRule; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserInheritanceRule" AS ENUM (
    'NO_INHERITANCE',
    'INHERIT_DOWN',
    'INHERIT_UP',
    'INHERIT_BIDIRECTIONAL'
);


ALTER TYPE public."UserInheritanceRule" OWNER TO postgres;

--
-- Name: UserRelationType; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."UserRelationType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'MANAGER',
    'MEMBER',
    'GUEST'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: VerificationTokenType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VerificationTokenType" AS ENUM (
    'EMAIL_VERIFICATION',
    'PASSWORD_RESET',
    'INVITATION'
);


ALTER TYPE public."VerificationTokenType" OWNER TO postgres;

--
-- Name: ViewType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ViewType" AS ENUM (
    'KANBAN',
    'GANTT',
    'SCRUM',
    'CALENDAR',
    'LIST'
);


ALTER TYPE public."ViewType" OWNER TO postgres;

--
-- Name: WaitingForStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WaitingForStatus" AS ENUM (
    'PENDING',
    'RESPONDED',
    'OVERDUE',
    'CANCELED'
);


ALTER TYPE public."WaitingForStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.activities OWNER TO postgres;

--
-- Name: agent_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_actions (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "actionType" public."AgentActionType" NOT NULL,
    "entityType" text,
    "entityId" text,
    parameters jsonb DEFAULT '{}'::jsonb NOT NULL,
    result jsonb,
    status public."ActionStatus" DEFAULT 'PENDING'::public."ActionStatus" NOT NULL,
    error text,
    "executedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agent_actions OWNER TO postgres;

--
-- Name: agent_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_analytics (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    date date NOT NULL,
    metrics jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agent_analytics OWNER TO postgres;

--
-- Name: agent_context_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_context_cache (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "cacheKey" text NOT NULL,
    "cacheData" jsonb NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agent_context_cache OWNER TO postgres;

--
-- Name: agent_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_conversations (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    title text,
    status public."ConversationStatus" DEFAULT 'ACTIVE'::public."ConversationStatus" NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.agent_conversations OWNER TO postgres;

--
-- Name: agent_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_feedback (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    "feedbackType" public."FeedbackType" NOT NULL,
    rating integer,
    comment text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agent_feedback OWNER TO postgres;

--
-- Name: agent_learning; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_learning (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "learningType" public."LearningType" NOT NULL,
    pattern jsonb NOT NULL,
    frequency integer DEFAULT 1 NOT NULL,
    confidence double precision DEFAULT 0.0 NOT NULL,
    "lastObservedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.agent_learning OWNER TO postgres;

--
-- Name: agent_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_messages (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    role public."MessageRole" NOT NULL,
    content text NOT NULL,
    intent jsonb,
    context jsonb,
    sources jsonb,
    confidence double precision DEFAULT 0.0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agent_messages OWNER TO postgres;

--
-- Name: agent_proactive_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_proactive_tasks (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "taskType" public."ProactiveTaskType" NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "triggerCondition" jsonb NOT NULL,
    "scheduledFor" timestamp(3) without time zone,
    "executedAt" timestamp(3) without time zone,
    status public."AgentTaskStatus" DEFAULT 'PENDING'::public."AgentTaskStatus" NOT NULL,
    result jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agent_proactive_tasks OWNER TO postgres;

--
-- Name: agent_suggestions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_suggestions (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "suggestionType" public."SuggestionType" NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    actionable jsonb,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    status public."SuggestionStatus" DEFAULT 'PENDING'::public."SuggestionStatus" NOT NULL,
    "dismissedAt" timestamp(3) without time zone,
    "acceptedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agent_suggestions OWNER TO postgres;

--
-- Name: ai_executions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.ai_executions OWNER TO postgres;

--
-- Name: ai_knowledge_bases; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.ai_knowledge_bases OWNER TO postgres;

--
-- Name: ai_knowledge_documents; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.ai_knowledge_documents OWNER TO postgres;

--
-- Name: ai_models; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.ai_models OWNER TO postgres;

--
-- Name: ai_predictions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.ai_predictions OWNER TO postgres;

--
-- Name: ai_prompt_overrides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_prompt_overrides (
    id text NOT NULL,
    "promptId" text NOT NULL,
    "organizationId" text NOT NULL,
    "modelOverride" text,
    "temperatureOverride" double precision,
    "languageOverride" text DEFAULT 'pl'::text,
    "customInstructions" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_prompt_overrides OWNER TO postgres;

--
-- Name: ai_prompt_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_prompt_templates (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    description text,
    category text,
    version integer DEFAULT 1 NOT NULL,
    status public."AITemplateStatus" DEFAULT 'ACTIVE'::public."AITemplateStatus" NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    "systemPrompt" text,
    "userPromptTemplate" text NOT NULL,
    variables jsonb DEFAULT '{}'::jsonb NOT NULL,
    "modelId" text,
    "defaultModel" text DEFAULT 'gpt-4o-mini'::text,
    "defaultTemperature" double precision DEFAULT 0.3 NOT NULL,
    "maxTokens" integer DEFAULT 1000 NOT NULL,
    "outputSchema" jsonb,
    "organizationId" text NOT NULL,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_prompt_templates OWNER TO postgres;

--
-- Name: ai_prompt_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_prompt_versions (
    id text NOT NULL,
    "promptId" text NOT NULL,
    version integer NOT NULL,
    "systemPrompt" text,
    "userPromptTemplate" text NOT NULL,
    variables jsonb DEFAULT '{}'::jsonb NOT NULL,
    "changedById" text,
    "changeReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ai_prompt_versions OWNER TO postgres;

--
-- Name: ai_providers; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.ai_providers OWNER TO postgres;

--
-- Name: ai_rules; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.ai_rules OWNER TO postgres;

--
-- Name: ai_suggestions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_suggestions (
    id text NOT NULL,
    user_id text NOT NULL,
    organization_id text NOT NULL,
    context character varying(50) NOT NULL,
    input_data jsonb NOT NULL,
    suggestion jsonb NOT NULL,
    confidence integer,
    reasoning text,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    user_modifications jsonb,
    processing_time_ms integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at timestamp(3) without time zone
);


ALTER TABLE public.ai_suggestions OWNER TO postgres;

--
-- Name: ai_usage_stats; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.ai_usage_stats OWNER TO postgres;

--
-- Name: areas_of_responsibility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.areas_of_responsibility (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    "createdById" text,
    "currentFocus" text,
    icon text,
    "isActive" boolean DEFAULT true NOT NULL,
    outcomes text[] DEFAULT ARRAY[]::text[],
    purpose text,
    "reviewFrequency" public."AreaReviewFrequency" DEFAULT 'MONTHLY'::public."AreaReviewFrequency" NOT NULL
);


ALTER TABLE public.areas_of_responsibility OWNER TO postgres;

--
-- Name: auto_replies; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.auto_replies OWNER TO postgres;

--
-- Name: break_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.break_templates (
    id text NOT NULL,
    name text NOT NULL,
    duration integer NOT NULL,
    "breakType" public."BreakType" NOT NULL,
    description text,
    "energyBefore" public."EnergyLevel",
    "energyAfter" public."EnergyLevel",
    "bestTimeSlots" jsonb DEFAULT '[]'::jsonb NOT NULL,
    activities jsonb DEFAULT '[]'::jsonb NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.break_templates OWNER TO postgres;

--
-- Name: bug_reports; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.bug_reports OWNER TO postgres;

--
-- Name: communication_channels; Type: TABLE; Schema: public; Owner: postgres
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastSyncAt" timestamp(3) without time zone
);


ALTER TABLE public.communication_channels OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: complaints; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.complaints OWNER TO postgres;

--
-- Name: completeness; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.completeness OWNER TO postgres;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: context_priorities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.context_priorities (
    id text NOT NULL,
    "contextName" text NOT NULL,
    "timeSlot" text NOT NULL,
    "dayOfWeek" public."DayOfWeek",
    priority integer DEFAULT 1 NOT NULL,
    "requiredEnergy" public."EnergyLevel",
    "maxDuration" integer,
    "alternativeOrder" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.context_priorities OWNER TO postgres;

--
-- Name: contexts; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.contexts OWNER TO postgres;

--
-- Name: critical_path; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.critical_path OWNER TO postgres;

--
-- Name: day_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.day_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "templateType" public."TemplateType" DEFAULT 'CUSTOM'::public."TemplateType" NOT NULL,
    "dayIntensity" public."TemplateIntensity" DEFAULT 'MEDIUM'::public."TemplateIntensity" NOT NULL,
    "focusStyle" public."TemplateFocusStyle" DEFAULT 'MIXED'::public."TemplateFocusStyle" NOT NULL,
    "timeBlocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "totalWorkTime" integer DEFAULT 0 NOT NULL,
    "totalBreakTime" integer DEFAULT 0 NOT NULL,
    "blocksCount" integer DEFAULT 0 NOT NULL,
    "energyDistribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "contextBalance" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "avgRating" double precision,
    "lastUsed" timestamp(3) without time zone,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "generatedBy" public."TemplateSource" DEFAULT 'USER'::public."TemplateSource" NOT NULL,
    "aiConfidence" double precision,
    "basedOnPatterns" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "userProfileId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "weeklyTemplate" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.day_templates OWNER TO postgres;

--
-- Name: deals; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.deals OWNER TO postgres;

--
-- Name: delegated_tasks; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.delegated_tasks OWNER TO postgres;

--
-- Name: dependencies; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.dependencies OWNER TO postgres;

--
-- Name: document_comments; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.document_comments OWNER TO postgres;

--
-- Name: document_links; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.document_links OWNER TO postgres;

--
-- Name: document_shares; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.document_shares OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: email_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_accounts (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    provider public."EmailProvider" DEFAULT 'GMAIL'::public."EmailProvider" NOT NULL,
    "imapHost" text NOT NULL,
    "imapPort" integer DEFAULT 993 NOT NULL,
    "imapSecure" boolean DEFAULT true NOT NULL,
    "imapUsername" text NOT NULL,
    "imapPassword" text NOT NULL,
    "smtpHost" text NOT NULL,
    "smtpPort" integer DEFAULT 587 NOT NULL,
    "smtpSecure" boolean DEFAULT true NOT NULL,
    "smtpUsername" text NOT NULL,
    "smtpPassword" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastSyncAt" timestamp(3) without time zone,
    "syncIntervalMin" integer DEFAULT 5 NOT NULL,
    "maxMessages" integer DEFAULT 1000 NOT NULL,
    "syncFolders" text[] DEFAULT ARRAY['INBOX'::text, 'Sent'::text, 'Drafts'::text],
    status public."EmailAccountStatus" DEFAULT 'PENDING'::public."EmailAccountStatus" NOT NULL,
    "errorMessage" text,
    "syncCount" integer DEFAULT 0 NOT NULL,
    "lastErrorAt" timestamp(3) without time zone,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.email_accounts OWNER TO postgres;

--
-- Name: email_analysis; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.email_analysis OWNER TO postgres;

--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.email_logs OWNER TO postgres;

--
-- Name: email_rules; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.email_rules OWNER TO postgres;

--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.email_templates OWNER TO postgres;

--
-- Name: energy_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.energy_analytics (
    id text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "energyTimeBlockId" text NOT NULL,
    "plannedEnergy" public."EnergyLevel" NOT NULL,
    "actualEnergy" public."EnergyLevel",
    "energyScore" integer,
    "tasksPlanned" integer DEFAULT 0 NOT NULL,
    "tasksCompleted" integer DEFAULT 0 NOT NULL,
    "minutesPlanned" integer DEFAULT 0 NOT NULL,
    "minutesActual" integer DEFAULT 0 NOT NULL,
    "productivityScore" double precision,
    "contextsPlanned" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "contextsActual" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "contextSwitches" integer DEFAULT 0 NOT NULL,
    "satisfactionScore" integer,
    notes text,
    distractions jsonb DEFAULT '[]'::jsonb NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.energy_analytics OWNER TO postgres;

--
-- Name: energy_patterns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.energy_patterns (
    id text NOT NULL,
    "timeSlot" text NOT NULL,
    "dayOfWeek" public."DayOfWeek" NOT NULL,
    "energyLevel" public."EnergyLevel" NOT NULL,
    "averageEnergy" double precision NOT NULL,
    "productivityScore" double precision NOT NULL,
    "tasksCompleted" integer DEFAULT 0 NOT NULL,
    "totalMinutes" integer DEFAULT 0 NOT NULL,
    "successRate" double precision DEFAULT 0.0 NOT NULL,
    "preferredContexts" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "avoidedContexts" jsonb DEFAULT '[]'::jsonb NOT NULL,
    confidence double precision DEFAULT 0.5 NOT NULL,
    "sampleSize" integer DEFAULT 0 NOT NULL,
    "lastAnalyzed" timestamp(3) without time zone,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.energy_patterns OWNER TO postgres;

--
-- Name: energy_time_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.energy_time_blocks (
    id text NOT NULL,
    name text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "energyLevel" public."EnergyLevel" NOT NULL,
    "primaryContext" text NOT NULL,
    "alternativeContexts" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "isBreak" boolean DEFAULT false NOT NULL,
    "breakType" public."BreakType",
    "dayOfWeek" public."DayOfWeek",
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "focusModeId" text,
    holidays boolean DEFAULT false NOT NULL,
    "specificDays" jsonb DEFAULT '[]'::jsonb NOT NULL,
    weekends boolean DEFAULT false NOT NULL,
    workdays boolean DEFAULT true NOT NULL
);


ALTER TABLE public.energy_time_blocks OWNER TO postgres;

--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.error_logs OWNER TO postgres;

--
-- Name: files; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.files OWNER TO postgres;

--
-- Name: flow_automation_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flow_automation_rules (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    conditions jsonb NOT NULL,
    action public."FlowAction" NOT NULL,
    "targetStreamId" text,
    "targetProjectId" text,
    "autoExecute" boolean DEFAULT false NOT NULL,
    "notifyOnMatch" boolean DEFAULT true NOT NULL,
    "executionCount" integer DEFAULT 0 NOT NULL,
    "lastExecutedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.flow_automation_rules OWNER TO postgres;

--
-- Name: flow_conversation_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flow_conversation_messages (
    id text NOT NULL,
    conversation_id text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.flow_conversation_messages OWNER TO postgres;

--
-- Name: flow_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flow_conversations (
    id text NOT NULL,
    organization_id text NOT NULL,
    user_id text NOT NULL,
    inbox_item_id text NOT NULL,
    status public."FlowConversationStatus" DEFAULT 'ACTIVE'::public."FlowConversationStatus" NOT NULL,
    proposed_action public."FlowAction",
    proposed_stream_id text,
    proposed_task_title text,
    proposed_priority text,
    ai_confidence double precision,
    final_action public."FlowAction",
    final_stream_id text,
    final_task_title text,
    final_priority text,
    user_modifications jsonb,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.flow_conversations OWNER TO postgres;

--
-- Name: flow_learned_patterns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flow_learned_patterns (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "elementType" public."FlowElementType" NOT NULL,
    "contentPattern" text,
    "senderPattern" text,
    "subjectPattern" text,
    "learnedAction" public."FlowAction" NOT NULL,
    "learnedStreamId" text,
    occurrences integer DEFAULT 1 NOT NULL,
    confidence double precision DEFAULT 0.5 NOT NULL,
    "lastUsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.flow_learned_patterns OWNER TO postgres;

--
-- Name: flow_processing_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flow_processing_history (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "inboxItemId" text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "processingTimeMs" integer,
    "aiAnalysis" jsonb,
    "aiSuggestedAction" public."FlowAction",
    "aiConfidence" double precision,
    "finalAction" public."FlowAction",
    "finalStreamId" text,
    "wasUserOverride" boolean DEFAULT false NOT NULL,
    "userFeedback" text,
    "matchedPatternId" text,
    "matchedRuleId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.flow_processing_history OWNER TO postgres;

--
-- Name: focus_modes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.focus_modes OWNER TO postgres;

--
-- Name: folders; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.folders OWNER TO postgres;

--
-- Name: gtd_buckets; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.gtd_buckets OWNER TO postgres;

--
-- Name: gtd_horizons; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.gtd_horizons OWNER TO postgres;

--
-- Name: habit_entries; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.habit_entries OWNER TO postgres;

--
-- Name: habits; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.habits OWNER TO postgres;

--
-- Name: inbox_items; Type: TABLE; Schema: public; Owner: postgres
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dealId" text,
    "elementType" public."FlowElementType",
    "rawContent" text,
    "flowStatus" public."FlowProcessingStatus" DEFAULT 'PENDING'::public."FlowProcessingStatus" NOT NULL,
    "aiAnalysis" jsonb,
    "suggestedAction" public."FlowAction",
    "suggestedStreams" jsonb,
    "userDecision" public."FlowAction",
    "userDecisionReason" text,
    "splitFromId" text,
    "aiConfidence" double precision,
    "aiReasoning" text,
    "processingTimeMs" integer
);


ALTER TABLE public.inbox_items OWNER TO postgres;

--
-- Name: info; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.info OWNER TO postgres;

--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: kanban_columns; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.kanban_columns OWNER TO postgres;

--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.knowledge_base OWNER TO postgres;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: meetings; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.meetings OWNER TO postgres;

--
-- Name: message_attachments; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.message_attachments OWNER TO postgres;

--
-- Name: message_processing_results; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.message_processing_results OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "emailAccountId" text,
    "emailHeaders" jsonb,
    "imapFolder" text,
    "imapUid" text,
    "rawEmail" text
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: metadata; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.metadata OWNER TO postgres;

--
-- Name: next_actions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.next_actions OWNER TO postgres;

--
-- Name: offer_items; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.offer_items OWNER TO postgres;

--
-- Name: offers; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.offers OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_metrics (
    id text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "periodType" text NOT NULL,
    "focusModeId" text,
    "focusModeEfficiency" double precision,
    "focusModeProductivity" double precision,
    "primaryContext" text NOT NULL,
    "alternativeContexts" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "contextSwitchCount" integer DEFAULT 0 NOT NULL,
    "contextEfficiency" double precision NOT NULL,
    "energyLevel" public."EnergyLevel" NOT NULL,
    "energyConsistency" double precision NOT NULL,
    "energyOptimalTimes" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "totalTasks" integer DEFAULT 0 NOT NULL,
    "completedTasks" integer DEFAULT 0 NOT NULL,
    "overdueTasks" integer DEFAULT 0 NOT NULL,
    "completionRate" double precision NOT NULL,
    "avgTaskDuration" double precision,
    "timeBlockUtilization" double precision NOT NULL,
    "breakEffectiveness" double precision,
    "aiSuggestionAccuracy" double precision,
    "userBehaviorScore" double precision,
    "adaptationRate" double precision,
    "productiveStreakDays" integer DEFAULT 0 NOT NULL,
    "currentStreak" integer DEFAULT 0 NOT NULL,
    "longestStreak" integer DEFAULT 0 NOT NULL,
    "stressLevel" integer,
    "satisfactionTrend" double precision,
    "burnoutRisk" double precision,
    suggestions jsonb DEFAULT '[]'::jsonb NOT NULL,
    "implementedSuggestions" integer DEFAULT 0 NOT NULL,
    "suggestionEffectiveness" double precision,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.performance_metrics OWNER TO postgres;

--
-- Name: precise_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.precise_goals (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    result text NOT NULL,
    measurement text NOT NULL,
    deadline timestamp(6) without time zone NOT NULL,
    background text,
    current_value numeric(10,2) DEFAULT 0,
    target_value numeric(10,2) NOT NULL,
    unit character varying(50) DEFAULT 'count'::character varying,
    stream_id text,
    organization_id text NOT NULL,
    created_by_id text NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    achieved_at timestamp(6) without time zone,
    outlet text
);


ALTER TABLE public.precise_goals OWNER TO postgres;

--
-- Name: processing_rules; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.processing_rules OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: project_dependencies; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.project_dependencies OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
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
    "streamScore" double precision,
    "smartAnalysis" jsonb,
    "organizationId" text NOT NULL,
    "createdById" text NOT NULL,
    "assignedToId" text,
    "streamId" text,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "areaId" text,
    "smartScore" integer DEFAULT 0
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: recommendations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.recommendations OWNER TO postgres;

--
-- Name: recurring_tasks; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.recurring_tasks OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: scheduled_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scheduled_tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "estimatedMinutes" integer NOT NULL,
    "actualMinutes" integer,
    "taskId" text,
    "energyTimeBlockId" text NOT NULL,
    context text NOT NULL,
    "energyRequired" public."EnergyLevel" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    status public."ScheduledTaskStatus" DEFAULT 'PLANNED'::public."ScheduledTaskStatus" NOT NULL,
    "scheduledDate" timestamp(3) without time zone NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "wasRescheduled" boolean DEFAULT false NOT NULL,
    "rescheduledFrom" text,
    "rescheduledReason" public."RescheduleReason",
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.scheduled_tasks OWNER TO postgres;

--
-- Name: search_index; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.search_index OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: smart; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.smart OWNER TO postgres;

--
-- Name: smart_analysis_details; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.smart_analysis_details OWNER TO postgres;

--
-- Name: smart_improvements; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.smart_improvements OWNER TO postgres;

--
-- Name: smart_mailbox_rules; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.smart_mailbox_rules OWNER TO postgres;

--
-- Name: smart_mailboxes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.smart_mailboxes OWNER TO postgres;

--
-- Name: smart_templates; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.smart_templates OWNER TO postgres;

--
-- Name: someday_maybe; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.someday_maybe OWNER TO postgres;

--
-- Name: sprints; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.sprints OWNER TO postgres;

--
-- Name: stream_access_logs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.stream_access_logs OWNER TO postgres;

--
-- Name: stream_channels; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.stream_channels OWNER TO postgres;

--
-- Name: stream_permissions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.stream_permissions OWNER TO postgres;

--
-- Name: stream_relations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.stream_relations OWNER TO postgres;

--
-- Name: streams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.streams (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    icon text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    status public."StreamStatus" DEFAULT 'ACTIVE'::public."StreamStatus" NOT NULL,
    "templateOrigin" text,
    "gtdConfig" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "streamType" public."StreamType" DEFAULT 'CUSTOM'::public."StreamType" NOT NULL,
    "organizationId" text NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "horizonLevel" integer DEFAULT 0 NOT NULL,
    pattern character varying(50) DEFAULT 'custom'::character varying,
    "gtdRole" text
);


ALTER TABLE public.streams OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: task_dependencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_dependencies (
    id text NOT NULL,
    "predecessorId" text NOT NULL,
    "successorId" text NOT NULL,
    "dependencyType" text DEFAULT 'finish_to_start'::text NOT NULL,
    "lagDays" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.task_dependencies OWNER TO postgres;

--
-- Name: task_history; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.task_history OWNER TO postgres;

--
-- Name: task_relationships; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.task_relationships OWNER TO postgres;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
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
    "streamScore" double precision,
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
    "scrumStoryPoints" integer,
    "smartScore" double precision
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: template_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_applications (
    id text NOT NULL,
    "appliedDate" timestamp(3) without time zone NOT NULL,
    "templateSnapshot" jsonb NOT NULL,
    "actualCompletion" double precision,
    "userRating" integer,
    feedback text,
    modifications jsonb DEFAULT '[]'::jsonb NOT NULL,
    "totalTasksPlanned" integer DEFAULT 0 NOT NULL,
    "totalTasksCompleted" integer DEFAULT 0 NOT NULL,
    "totalTimeSpent" integer,
    "productivityScore" double precision,
    "templateId" text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.template_applications OWNER TO postgres;

--
-- Name: timeline; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.timeline OWNER TO postgres;

--
-- Name: unified_rule_executions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.unified_rule_executions OWNER TO postgres;

--
-- Name: unified_rules; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.unified_rules OWNER TO postgres;

--
-- Name: unimportant; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.unimportant OWNER TO postgres;

--
-- Name: user_access_logs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.user_access_logs OWNER TO postgres;

--
-- Name: user_ai_patterns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_ai_patterns (
    id text NOT NULL,
    user_id text NOT NULL,
    organization_id text NOT NULL,
    preferred_streams jsonb DEFAULT '[]'::jsonb NOT NULL,
    energy_patterns jsonb DEFAULT '{}'::jsonb NOT NULL,
    acceptance_rate numeric(5,2) DEFAULT 0 NOT NULL,
    common_modifications jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_suggestions integer DEFAULT 0 NOT NULL,
    total_accepted integer DEFAULT 0 NOT NULL,
    autonomy_level integer DEFAULT 1 NOT NULL,
    enabled_contexts jsonb DEFAULT '["SOURCE", "DAY_PLAN", "REVIEW"]'::jsonb NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_ai_patterns OWNER TO postgres;

--
-- Name: user_patterns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_patterns (
    id text NOT NULL,
    "patternType" text NOT NULL,
    "patternKey" text NOT NULL,
    confidence double precision NOT NULL,
    strength double precision NOT NULL,
    "sampleSize" integer DEFAULT 0 NOT NULL,
    "successRate" double precision NOT NULL,
    "patternData" jsonb NOT NULL,
    conditions jsonb DEFAULT '[]'::jsonb NOT NULL,
    outcomes jsonb DEFAULT '[]'::jsonb NOT NULL,
    "detectedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastConfirmed" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    "learningSource" text NOT NULL,
    "algorithmVersion" text DEFAULT 'v1.0'::text NOT NULL,
    correlations jsonb DEFAULT '{}'::jsonb NOT NULL,
    "adaptationCount" integer DEFAULT 0 NOT NULL,
    "lastAdaptation" timestamp(3) without time zone,
    "adaptationReason" text,
    "userAcceptance" double precision,
    "manualOverrides" integer DEFAULT 0 NOT NULL,
    "implementationRate" double precision,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_patterns OWNER TO postgres;

--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.user_permissions OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id text NOT NULL,
    "energyPeaks" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "energyValleys" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "energyPattern" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "preferredContexts" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "contextTimeSlots" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "contextAvoidance" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "focusModePrefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "optimalFocusLength" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "focusEnergyMap" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "breakFrequency" integer DEFAULT 90 NOT NULL,
    "breakDuration" integer DEFAULT 15 NOT NULL,
    "breakTypes" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "lunchTime" text DEFAULT '12:00'::text,
    "lunchDuration" integer DEFAULT 60 NOT NULL,
    "workStartTime" text DEFAULT '08:00'::text NOT NULL,
    "workEndTime" text DEFAULT '17:00'::text NOT NULL,
    workdays jsonb DEFAULT '["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]'::jsonb NOT NULL,
    "flexibleBlocks" boolean DEFAULT true NOT NULL,
    "learningEnabled" boolean DEFAULT true NOT NULL,
    "adaptationRate" double precision DEFAULT 0.1 NOT NULL,
    "feedbackWeight" double precision DEFAULT 0.3 NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: user_relations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.user_relations OWNER TO postgres;

--
-- Name: user_view_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_view_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "viewType" public."ViewType" NOT NULL,
    preferences jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_view_preferences OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vector_cache; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.vector_cache OWNER TO postgres;

--
-- Name: vector_documents; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.vector_documents OWNER TO postgres;

--
-- Name: vector_search_results; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.vector_search_results OWNER TO postgres;

--
-- Name: vectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vectors (
    id character varying(255) NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    embedding_data text NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vectors OWNER TO postgres;

--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_tokens (
    id text NOT NULL,
    token text NOT NULL,
    type public."VerificationTokenType" NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO postgres;

--
-- Name: view_analytics; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.view_analytics OWNER TO postgres;

--
-- Name: view_configurations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.view_configurations OWNER TO postgres;

--
-- Name: waiting_for; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.waiting_for OWNER TO postgres;

--
-- Name: weekly_reviews; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.weekly_reviews OWNER TO postgres;

--
-- Name: wiki_categories; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.wiki_categories OWNER TO postgres;

--
-- Name: wiki_page_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wiki_page_links (
    id text NOT NULL,
    "linkText" text,
    "sourcePageId" text NOT NULL,
    "targetPageId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wiki_page_links OWNER TO postgres;

--
-- Name: wiki_pages; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.wiki_pages OWNER TO postgres;

--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activities (id, type, title, description, metadata, "organizationId", "userId", "companyId", "contactId", "dealId", "taskId", "projectId", "meetingId", "communicationType", "communicationDirection", "communicationSubject", "communicationBody", "communicationDuration", "communicationStatus", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: agent_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_actions (id, "conversationId", "organizationId", "userId", "actionType", "entityType", "entityId", parameters, result, status, error, "executedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: agent_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_analytics (id, "organizationId", "userId", date, metrics, "createdAt") FROM stdin;
\.


--
-- Data for Name: agent_context_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_context_cache (id, "organizationId", "userId", "cacheKey", "cacheData", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: agent_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_conversations (id, "organizationId", "userId", title, status, metadata, "startedAt", "lastMessageAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: agent_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_feedback (id, "messageId", "userId", "feedbackType", rating, comment, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: agent_learning; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_learning (id, "organizationId", "userId", "learningType", pattern, frequency, confidence, "lastObservedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: agent_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_messages (id, "conversationId", role, content, intent, context, sources, confidence, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: agent_proactive_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_proactive_tasks (id, "organizationId", "userId", "taskType", title, description, "triggerCondition", "scheduledFor", "executedAt", status, result, "createdAt") FROM stdin;
\.


--
-- Data for Name: agent_suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_suggestions (id, "organizationId", "userId", "suggestionType", title, description, actionable, priority, status, "dismissedAt", "acceptedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: ai_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_executions (id, "ruleId", "providerId", "modelId", "templateId", "inputData", "promptSent", "responseReceived", "parsedOutput", status, "executionTime", "tokensUsed", cost, "errorMessage", "errorCode", "retryCount", "actionsExecuted", "entitiesCreated", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ai_knowledge_bases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_knowledge_bases (id, name, description, status, "embeddingModel", "chunkSize", "chunkOverlap", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ai_knowledge_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_knowledge_documents (id, title, content, metadata, embedding, "embeddingModel", status, "knowledgeBaseId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ai_models; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_models (id, name, "displayName", type, status, "maxTokens", "inputCost", "outputCost", capabilities, config, "providerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ai_predictions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_predictions (id, "itemId", "itemType", "predictionType", "predictedValue", "confidenceScore", factors, recommendations, "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: ai_prompt_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_prompt_overrides (id, "promptId", "organizationId", "modelOverride", "temperatureOverride", "languageOverride", "customInstructions", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ai_prompt_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_prompt_templates (id, code, name, description, category, version, status, "isSystem", "systemPrompt", "userPromptTemplate", variables, "modelId", "defaultModel", "defaultTemperature", "maxTokens", "outputSchema", "organizationId", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ai_prompt_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_prompt_versions (id, "promptId", version, "systemPrompt", "userPromptTemplate", variables, "changedById", "changeReason", "createdAt") FROM stdin;
\.


--
-- Data for Name: ai_providers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_providers (id, name, "displayName", "baseUrl", status, priority, config, limits, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ai_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_rules (id, name, description, category, status, priority, "triggerType", "triggerConditions", "templateId", "modelId", "fallbackModelIds", actions, "maxExecutionsPerHour", "maxExecutionsPerDay", "organizationId", "executionCount", "successCount", "errorCount", "avgExecutionTime", "lastExecuted", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ai_suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_suggestions (id, user_id, organization_id, context, input_data, suggestion, confidence, reasoning, status, user_modifications, processing_time_ms, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: ai_usage_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_usage_stats (id, date, "totalExecutions", "successfulExecutions", "failedExecutions", "totalTokensUsed", "totalCost", "providerStats", "modelStats", "organizationId", "createdAt") FROM stdin;
\.


--
-- Data for Name: areas_of_responsibility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.areas_of_responsibility (id, name, description, "organizationId", "createdAt", "updatedAt", color, "createdById", "currentFocus", icon, "isActive", outcomes, purpose, "reviewFrequency") FROM stdin;
\.


--
-- Data for Name: auto_replies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auto_replies (id, name, subject, content, "htmlContent", "triggerConditions", status, "sendOnce", delay, "activeFrom", "activeTo", "channelId", "organizationId", "sentCount", "lastSent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: break_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.break_templates (id, name, duration, "breakType", description, "energyBefore", "energyAfter", "bestTimeSlots", activities, "isDefault", "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bug_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bug_reports (id, title, description, priority, status, category, "userAgent", url, "browserInfo", "deviceInfo", screenshots, attachments, "stepsToReproduce", "expectedBehavior", "actualBehavior", "reporterId", "organizationId", "adminNotes", resolution, "resolvedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: communication_channels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communication_channels (id, name, type, active, config, "emailAddress", "displayName", "autoProcess", "createTasks", "defaultStream", "organizationId", "userId", "createdAt", "updatedAt", "lastSyncAt") FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, website, domain, industry, size, revenue, description, address, phone, email, tags, status, "organizationId", "primaryContactId", "createdAt", "updatedAt", "lastInteractionAt", "interactionCount") FROM stdin;
de7470aa-a8a0-43ac-bab4-5fd30f90abe4	Acme Corporation	https://acme.com	\N	Technology	MEDIUM	\N	Leading technology solutions provider	\N	\N	\N	{}	PROSPECT	3e8966d6-9c2d-4772-be77-9cfc24b5776f	b7895f50-d9e0-4c50-8384-18998d1f680d	2026-01-29 11:04:51.579	2026-01-29 11:04:51.594	\N	0
\.


--
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaints (id, title, description, customer, product, status, priority, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: completeness; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.completeness (id, "isComplete", "missingInfo", clarity, "taskId", "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, "firstName", "lastName", email, phone, company, "position", department, notes, tags, status, source, "emailCategory", "organizationId", "companyId", "createdAt", "updatedAt", "lastInteractionAt", "interactionCount") FROM stdin;
b7895f50-d9e0-4c50-8384-18998d1f680d	John	Smith	john.smith@acme.com	+1-555-0123	Acme Corporation	CTO	\N	\N	{}	ACTIVE	\N	UNKNOWN	3e8966d6-9c2d-4772-be77-9cfc24b5776f	\N	2026-01-29 11:04:51.586	2026-01-29 11:04:51.586	\N	0
\.


--
-- Data for Name: context_priorities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.context_priorities (id, "contextName", "timeSlot", "dayOfWeek", priority, "requiredEnergy", "maxDuration", "alternativeOrder", "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: contexts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contexts (id, name, description, color, icon, "isActive", "organizationId", "createdAt", "updatedAt") FROM stdin;
0fdbd100-484e-4389-b775-de4c27579dbd	@computer	Tasks requiring a computer	#3B82F6	💻	t	3e8966d6-9c2d-4772-be77-9cfc24b5776f	2026-01-29 11:04:51.474	2026-01-29 11:04:51.474
288c040c-f564-442d-b8fe-a9179c1f3182	@phone	Phone calls to make	#10B981	📞	t	3e8966d6-9c2d-4772-be77-9cfc24b5776f	2026-01-29 11:04:51.483	2026-01-29 11:04:51.483
5af4feea-914b-47d1-afae-8da173d27b15	@errands	Tasks to do while out	#F59E0B	🏃	t	3e8966d6-9c2d-4772-be77-9cfc24b5776f	2026-01-29 11:04:51.488	2026-01-29 11:04:51.488
b33eb399-8f5f-4f0b-9569-d4f245ad9573	@home	Tasks to do at home	#8B5CF6	🏠	t	3e8966d6-9c2d-4772-be77-9cfc24b5776f	2026-01-29 11:04:51.494	2026-01-29 11:04:51.494
1fae4a93-888c-473d-9f2e-9f53acc7c6de	@office	Tasks to do at the office	#EF4444	🏢	t	3e8966d6-9c2d-4772-be77-9cfc24b5776f	2026-01-29 11:04:51.499	2026-01-29 11:04:51.499
d1cd942f-5722-4a6c-9a5b-aaca53d03f4b	@agenda	Items for meetings/discussions	#6B7280	📋	t	3e8966d6-9c2d-4772-be77-9cfc24b5776f	2026-01-29 11:04:51.505	2026-01-29 11:04:51.505
6b6520bd-c5b8-4d75-a384-8641ad1eaeab	@waiting	Waiting for someone else	#F97316	⏳	t	3e8966d6-9c2d-4772-be77-9cfc24b5776f	2026-01-29 11:04:51.511	2026-01-29 11:04:51.511
6ab611c9-bee8-4844-8196-6abb9c58b9b7	@someday	Someday/maybe items	#84CC16	🌅	t	3e8966d6-9c2d-4772-be77-9cfc24b5776f	2026-01-29 11:04:51.517	2026-01-29 11:04:51.517
\.


--
-- Data for Name: critical_path; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.critical_path (id, tasks, "totalDuration", "earliestCompletion", slack, "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: day_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.day_templates (id, name, description, "templateType", "dayIntensity", "focusStyle", "timeBlocks", "totalWorkTime", "totalBreakTime", "blocksCount", "energyDistribution", "contextBalance", "usageCount", "avgRating", "lastUsed", "isDefault", "isPublic", "generatedBy", "aiConfidence", "basedOnPatterns", "organizationId", "userId", "userProfileId", "createdAt", "updatedAt", "weeklyTemplate") FROM stdin;
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deals (id, title, description, value, currency, stage, probability, "expectedCloseDate", "actualCloseDate", source, notes, "organizationId", "companyId", "ownerId", "createdAt", "updatedAt", "kanbanPosition") FROM stdin;
b228b40d-3427-40d4-89bb-f624369df4b6	Enterprise License Deal	Annual enterprise license for CRM-GTD platform	50000	USD	QUALIFIED	0.7	2026-02-28 11:04:51.601	\N	\N	\N	3e8966d6-9c2d-4772-be77-9cfc24b5776f	de7470aa-a8a0-43ac-bab4-5fd30f90abe4	4b117c25-c80a-428f-aa42-5118cf29fc04	2026-01-29 11:04:51.602	2026-01-29 11:04:51.602	0
\.


--
-- Data for Name: delegated_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delegated_tasks (id, description, "delegatedTo", "delegatedOn", "followUpDate", status, notes, "organizationId", "taskId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: dependencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dependencies (id, type, "isCriticalPath", "sourceId", "sourceType", "targetId", "targetType", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: document_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_comments (id, content, "isResolved", "documentId", "authorId", "parentId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: document_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_links (id, type, strength, "sourceDocumentId", "targetDocumentId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: document_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_shares (id, permission, "expiresAt", "documentId", "sharedWithId", "sharedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, content, summary, type, status, tags, "mimeType", "fileSize", "filePath", version, "isTemplate", "isPublic", "viewCount", "authorId", "folderId", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: email_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_accounts (id, name, email, provider, "imapHost", "imapPort", "imapSecure", "imapUsername", "imapPassword", "smtpHost", "smtpPort", "smtpSecure", "smtpUsername", "smtpPassword", "isActive", "lastSyncAt", "syncIntervalMin", "maxMessages", "syncFolders", status, "errorMessage", "syncCount", "lastErrorAt", "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: email_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_analysis (id, "timestamp", "emailFrom", "emailSubject", "emailReceived", categories, "confidenceScore", summary, "fullAnalysis", "rawText", "processingTime", "tokenCount", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_logs (id, provider, "messageId", "toAddresses", "ccAddresses", "bccAddresses", subject, success, error, "templateId", "templateData", delivered, opened, clicked, bounced, spam, "sentAt", "deliveredAt", "openedAt", "clickedAt", "bouncedAt", "organizationId", "sentByUserId") FROM stdin;
\.


--
-- Data for Name: email_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_rules (id, name, description, "senderEmail", "senderDomain", "subjectContains", "subjectPattern", "bodyContains", "assignCategory", "skipAIAnalysis", "autoArchive", "autoDelete", "createTask", priority, "isActive", "matchCount", "lastMatched", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_templates (id, name, description, subject, "htmlTemplate", "textTemplate", variables, category, tags, "isActive", version, "usageCount", "lastUsed", "organizationId", "createdAt", "updatedAt", "createdById") FROM stdin;
\.


--
-- Data for Name: energy_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.energy_analytics (id, date, "energyTimeBlockId", "plannedEnergy", "actualEnergy", "energyScore", "tasksPlanned", "tasksCompleted", "minutesPlanned", "minutesActual", "productivityScore", "contextsPlanned", "contextsActual", "contextSwitches", "satisfactionScore", notes, distractions, "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: energy_patterns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.energy_patterns (id, "timeSlot", "dayOfWeek", "energyLevel", "averageEnergy", "productivityScore", "tasksCompleted", "totalMinutes", "successRate", "preferredContexts", "avoidedContexts", confidence, "sampleSize", "lastAnalyzed", "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: energy_time_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.energy_time_blocks (id, name, "startTime", "endTime", "energyLevel", "primaryContext", "alternativeContexts", "isBreak", "breakType", "dayOfWeek", "isActive", "order", "organizationId", "userId", "createdAt", "updatedAt", "focusModeId", holidays, "specificDays", weekends, workdays) FROM stdin;
\.


--
-- Data for Name: error_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.error_logs (id, message, stack, url, "userAgent", severity, context, "componentStack", "sessionId", "timestamp", resolved, "userId", "organizationId", "createdAt") FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.files (id, "fileName", "fileType", "urlPath", "uploadDate", size, "parentId", "parentType", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: flow_automation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flow_automation_rules (id, "organizationId", "userId", name, description, "isActive", priority, conditions, action, "targetStreamId", "targetProjectId", "autoExecute", "notifyOnMatch", "executionCount", "lastExecutedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: flow_conversation_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flow_conversation_messages (id, conversation_id, role, content, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: flow_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flow_conversations (id, organization_id, user_id, inbox_item_id, status, proposed_action, proposed_stream_id, proposed_task_title, proposed_priority, ai_confidence, final_action, final_stream_id, final_task_title, final_priority, user_modifications, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_learned_patterns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flow_learned_patterns (id, "organizationId", "userId", "elementType", "contentPattern", "senderPattern", "subjectPattern", "learnedAction", "learnedStreamId", occurrences, confidence, "lastUsedAt", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: flow_processing_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flow_processing_history (id, "organizationId", "userId", "inboxItemId", "startedAt", "completedAt", "processingTimeMs", "aiAnalysis", "aiSuggestedAction", "aiConfidence", "finalAction", "finalStreamId", "wasUserOverride", "userFeedback", "matchedPatternId", "matchedRuleId", "createdAt") FROM stdin;
\.


--
-- Data for Name: focus_modes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.focus_modes (id, name, duration, "energyLevel", "contextName", "estimatedTimeMax", category, priority, tags, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.folders (id, name, description, color, "isSystem", "parentId", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: gtd_buckets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gtd_buckets (id, name, description, "viewOrder", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: gtd_horizons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gtd_horizons (id, level, name, description, "reviewFrequency", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: habit_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.habit_entries (id, date, completed, notes, "habitId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: habits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.habits (id, name, description, frequency, "currentStreak", "bestStreak", "startDate", "isActive", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inbox_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inbox_items (id, content, note, "sourceType", source, "sourceUrl", "urgencyScore", actionable, "estimatedTime", context, "capturedAt", processed, "processedAt", "processingDecision", "resultingTaskId", "contactId", "companyId", "projectId", "taskId", "streamId", "organizationId", "capturedById", "createdAt", "updatedAt", "dealId", "elementType", "rawContent", "flowStatus", "aiAnalysis", "suggestedAction", "suggestedStreams", "userDecision", "userDecisionReason", "splitFromId", "aiConfidence", "aiReasoning", "processingTimeMs") FROM stdin;
\.


--
-- Data for Name: info; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.info (id, title, content, topic, importance, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, "itemType", quantity, "unitPrice", discount, tax, "totalPrice", "productId", "serviceId", "customName", "customDescription", "invoiceId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, "invoiceNumber", title, description, amount, currency, status, priority, "dueDate", subtotal, "totalDiscount", "totalTax", "totalAmount", "customerEmail", "customerPhone", "customerAddress", "paymentDate", "paymentMethod", "paymentNotes", "fakturowniaId", "fakturowniaNumber", "fakturowniaStatus", "lastSyncedAt", "syncError", "autoSync", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: kanban_columns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kanban_columns (id, "viewId", title, "position", color, "wipLimit", "columnType", configuration, "createdAt") FROM stdin;
\.


--
-- Data for Name: knowledge_base; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_base (id, title, content, category, tags, "relatedItems", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, title, description, company, "contactPerson", status, priority, source, value, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meetings (id, title, description, "startTime", "endTime", location, "meetingUrl", agenda, notes, status, "organizationId", "organizedById", "contactId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: message_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message_attachments (id, "messageId", "fileName", "fileType", "fileSize", "contentType", "storagePath", "isInline", "contentId", "createdAt") FROM stdin;
\.


--
-- Data for Name: message_processing_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message_processing_results (id, "messageId", "ruleId", "actionTaken", success, "errorMessage", "taskCreated", "contextAssigned", "prioritySet", "processedAt") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, "channelId", "messageId", "threadId", subject, content, "htmlContent", "fromAddress", "fromName", "toAddress", "ccAddress", "bccAddress", "messageType", priority, "isRead", "isStarred", "isArchived", "sentAt", "receivedAt", "autoProcessed", "actionNeeded", "needsResponse", "responseDeadline", "extractedTasks", "extractedContext", sentiment, "urgencyScore", "taskId", "streamId", "contactId", "companyId", "dealId", "interactionType", "organizationId", "createdAt", "updatedAt", "emailAccountId", "emailHeaders", "imapFolder", "imapUid", "rawEmail") FROM stdin;
\.


--
-- Data for Name: metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metadata (id, confidence, ambiguity, "rawText", "referenceId", "referenceType", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: next_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.next_actions (id, title, description, context, priority, energy, "estimatedTime", status, "completedAt", "dueDate", "contactId", "companyId", "projectId", "taskId", "streamId", "organizationId", "createdById", "assignedToId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: offer_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offer_items (id, "itemType", quantity, "unitPrice", discount, tax, "totalPrice", "productId", "serviceId", "customName", "customDescription", "offerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offers (id, "offerNumber", title, description, status, priority, subtotal, "totalDiscount", "totalTax", "totalAmount", currency, "validUntil", "sentDate", "acceptedDate", "rejectedDate", "customerName", "customerEmail", "customerPhone", "customerAddress", "companyId", "contactId", "dealId", "paymentTerms", "deliveryTerms", notes, "organizationId", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, "itemType", quantity, "unitPrice", discount, tax, "totalPrice", "productId", "serviceId", "customName", "customDescription", "orderId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, "orderNumber", title, description, customer, status, priority, value, currency, subtotal, "totalDiscount", "totalTax", "totalAmount", "customerEmail", "customerPhone", "customerAddress", "deliveryDate", "deliveryAddress", "deliveryNotes", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, slug, domain, settings, limits, "createdAt", "updatedAt") FROM stdin;
3e8966d6-9c2d-4772-be77-9cfc24b5776f	Demo Organization	demo-org	demo.crm-gtd.com	{"timezone": "UTC", "dateFormat": "YYYY-MM-DD", "workingHours": {"end": "17:00", "start": "09:00"}}	{"tasks": 1000, "users": 50, "storage": "1GB", "projects": 100}	2026-01-29 11:04:51.305	2026-01-29 11:04:51.305
\.


--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.performance_metrics (id, "startDate", "endDate", "periodType", "focusModeId", "focusModeEfficiency", "focusModeProductivity", "primaryContext", "alternativeContexts", "contextSwitchCount", "contextEfficiency", "energyLevel", "energyConsistency", "energyOptimalTimes", "totalTasks", "completedTasks", "overdueTasks", "completionRate", "avgTaskDuration", "timeBlockUtilization", "breakEffectiveness", "aiSuggestionAccuracy", "userBehaviorScore", "adaptationRate", "productiveStreakDays", "currentStreak", "longestStreak", "stressLevel", "satisfactionTrend", "burnoutRisk", suggestions, "implementedSuggestions", "suggestionEffectiveness", "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: precise_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.precise_goals (id, result, measurement, deadline, background, current_value, target_value, unit, stream_id, organization_id, created_by_id, status, created_at, updated_at, achieved_at, outlet) FROM stdin;
\.


--
-- Data for Name: processing_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.processing_rules (id, name, description, active, conditions, actions, priority, "channelId", "organizationId", "executionCount", "lastExecuted", "createdAt", "updatedAt", "streamId") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, sku, category, subcategory, price, cost, currency, "stockQuantity", "minStockLevel", "trackInventory", unit, weight, dimensions, status, "isActive", "isFeatured", tags, images, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: project_dependencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_dependencies (id, type, "isCriticalPath", "sourceProjectId", "dependentProjectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, name, description, status, priority, "startDate", "endDate", "completedAt", "streamScore", "smartAnalysis", "organizationId", "createdById", "assignedToId", "streamId", "companyId", "createdAt", "updatedAt", "areaId", "smartScore") FROM stdin;
demo-project-1	MVP Launch	Launch the minimum viable product	PLANNING	MEDIUM	2026-01-29 11:04:51.536	2026-04-29 11:04:51.536	\N	\N	{"relevant": {"score": 90, "feedback": "Aligned with business objectives"}, "specific": {"score": 90, "feedback": "Clear and specific goal"}, "timeBound": {"score": 85, "feedback": "Clear deadline set"}, "achievable": {"score": 80, "feedback": "Realistic with current resources"}, "measurable": {"score": 85, "feedback": "Success criteria defined"}}	3e8966d6-9c2d-4772-be77-9cfc24b5776f	4b117c25-c80a-428f-aa42-5118cf29fc04	\N	demo-stream-1	\N	2026-01-29 11:04:51.538	2026-01-29 11:04:51.538	\N	85
\.


--
-- Data for Name: recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recommendations (id, content, status, priority, "referenceId", "referenceType", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: recurring_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recurring_tasks (id, title, description, frequency, pattern, "interval", "daysOfWeek", "dayOfMonth", "weekOfMonth", months, "time", "nextOccurrence", "lastExecuted", "executionCount", context, priority, "estimatedMinutes", "isActive", "organizationId", "assignedToId", "companyId", "contactId", "projectId", "streamId", "dealId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, token, "userId", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: scheduled_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scheduled_tasks (id, title, description, "estimatedMinutes", "actualMinutes", "taskId", "energyTimeBlockId", context, "energyRequired", priority, status, "scheduledDate", "startedAt", "completedAt", "wasRescheduled", "rescheduledFrom", "rescheduledReason", "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: search_index; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.search_index (id, "entityType", "entityId", title, content, "searchVector", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, description, category, subcategory, price, cost, currency, "billingType", duration, unit, "deliveryMethod", "estimatedDeliveryDays", status, "isActive", "isFeatured", requirements, resources, tags, images, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: smart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smart (id, specific, measurable, achievable, relevant, "timeBound", "taskId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: smart_analysis_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smart_analysis_details (id, "specificScore", "specificNotes", "measurableScore", "measurableCriteria", "achievableScore", "achievableResources", "relevantScore", "relevantAlignment", "timeBoundScore", "timeEstimationAccuracy", "taskId", "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: smart_improvements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smart_improvements (id, "smartDimension", "currentState", "suggestedImprovement", status, "taskId", "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: smart_mailbox_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smart_mailbox_rules (id, "mailboxId", field, operator, value, "logicOperator", "ruleOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: smart_mailboxes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smart_mailboxes (id, name, icon, color, description, "isBuiltIn", "isActive", "displayOrder", "userId", "organizationId", "lastAccessedAt", "accessCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: smart_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smart_templates (id, name, "taskTemplate", "measurableCriteria", "typicalResources", "estimatedDuration", "typicalDependencies", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: someday_maybe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.someday_maybe (id, title, description, category, priority, status, "whenToReview", tags, "activatedAt", "organizationId", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sprints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sprints (id, "organizationId", name, goal, "startDate", "endDate", velocity, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: stream_access_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stream_access_logs (id, "streamId", "userId", action, "accessType", "permissionId", "relationId", success, "accessLevel", "dataScope", "errorMessage", "ipAddress", "userAgent", "requestPath", "accessedAt", "organizationId") FROM stdin;
\.


--
-- Data for Name: stream_channels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stream_channels (id, "streamId", "channelId", "autoCreateTasks", "defaultContext", "defaultPriority", "createdAt") FROM stdin;
\.


--
-- Data for Name: stream_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stream_permissions (id, "streamId", "relationId", "userId", "accessLevel", "dataScope", conditions, "expiresAt", "isActive", "grantedById", "grantedAt", "updatedAt", "organizationId") FROM stdin;
\.


--
-- Data for Name: stream_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stream_relations (id, "parentId", "childId", "relationType", description, "isActive", "inheritanceRule", "createdById", "createdAt", "updatedAt", "organizationId") FROM stdin;
\.


--
-- Data for Name: streams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.streams (id, name, description, color, icon, settings, status, "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt", "horizonLevel", pattern, "gtdRole") FROM stdin;
demo-stream-1	Product Development	Main product development stream	#3B82F6	🚀	{"autoArchive": false, "defaultPriority": "MEDIUM"}	ACTIVE	\N	{}	CUSTOM	3e8966d6-9c2d-4772-be77-9cfc24b5776f	4b117c25-c80a-428f-aa42-5118cf29fc04	2026-01-29 11:04:51.522	2026-01-29 11:04:51.522	0	custom	\N
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, "organizationId", "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", plan, status, "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "createdAt", "updatedAt") FROM stdin;
3e8966d6-9c2d-4772-be77-9cfc24b5776f-sub	3e8966d6-9c2d-4772-be77-9cfc24b5776f	\N	\N	\N	PROFESSIONAL	TRIAL	2026-01-29 11:04:51.463	2026-02-12 11:04:51.463	f	2026-01-29 11:04:51.465	2026-01-29 11:04:51.465
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (id, name, color, category, "usageCount", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: task_dependencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_dependencies (id, "predecessorId", "successorId", "dependencyType", "lagDays", "createdAt") FROM stdin;
\.


--
-- Data for Name: task_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_history (id, "fieldName", "oldValue", "newValue", "changedBy", "changeDate", "taskId") FROM stdin;
\.


--
-- Data for Name: task_relationships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_relationships (id, type, lag, "isCriticalPath", notes, "fromTaskId", "toTaskId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, priority, status, "dueDate", "completedAt", "estimatedHours", "actualHours", "contextId", energy, "isWaitingFor", "waitingForNote", "streamScore", "smartAnalysis", "organizationId", "createdById", "assignedToId", "streamId", "projectId", "companyId", "createdAt", "updatedAt", "sprintId", "ganttDuration", "ganttEndDate", "ganttProgress", "ganttStartDate", "kanbanPosition", "scrumStoryPoints", "smartScore") FROM stdin;
18f45e5a-5378-4ce5-8a2d-a0e70b73fd2f	Set up development environment	Configure local development tools and dependencies	HIGH	NEW	\N	\N	4	\N	0fdbd100-484e-4389-b775-de4c27579dbd	MEDIUM	f	\N	\N	\N	3e8966d6-9c2d-4772-be77-9cfc24b5776f	4b117c25-c80a-428f-aa42-5118cf29fc04	\N	demo-stream-1	demo-project-1	\N	2026-01-29 11:04:51.554	2026-01-29 11:04:51.554	\N	\N	\N	0	\N	0	\N	\N
b53065d8-9ec0-4a4b-89ee-4b52940d0d5c	Design user interface mockups	Create wireframes and UI designs for main features	MEDIUM	NEW	\N	\N	8	\N	0fdbd100-484e-4389-b775-de4c27579dbd	MEDIUM	f	\N	\N	\N	3e8966d6-9c2d-4772-be77-9cfc24b5776f	4b117c25-c80a-428f-aa42-5118cf29fc04	\N	demo-stream-1	demo-project-1	\N	2026-01-29 11:04:51.564	2026-01-29 11:04:51.564	\N	\N	\N	0	\N	0	\N	\N
ae92f621-db7c-4f0d-a157-df8c50e61913	Implement authentication system	Build login, registration, and JWT handling	HIGH	NEW	\N	\N	12	\N	0fdbd100-484e-4389-b775-de4c27579dbd	MEDIUM	f	\N	\N	\N	3e8966d6-9c2d-4772-be77-9cfc24b5776f	4b117c25-c80a-428f-aa42-5118cf29fc04	\N	demo-stream-1	demo-project-1	\N	2026-01-29 11:04:51.571	2026-01-29 11:04:51.571	\N	\N	\N	0	\N	0	\N	\N
\.


--
-- Data for Name: template_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.template_applications (id, "appliedDate", "templateSnapshot", "actualCompletion", "userRating", feedback, modifications, "totalTasksPlanned", "totalTasksCompleted", "totalTimeSpent", "productivityScore", "templateId", "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: timeline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.timeline (id, "eventId", "eventType", title, "startDate", "endDate", status, "organizationId", "streamId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: unified_rule_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unified_rule_executions (id, "ruleId", "triggeredBy", "triggerData", "executionTime", status, result, error, "entityType", "entityId", "organizationId", "createdAt") FROM stdin;
\.


--
-- Data for Name: unified_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unified_rules (id, name, description, "ruleType", category, status, priority, "triggerType", "triggerEvents", conditions, actions, "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod", "activeFrom", "activeTo", timezone, "channelId", "aiModelId", "aiPromptTemplate", "fallbackModelIds", "organizationId", "executionCount", "successCount", "errorCount", "avgExecutionTime", "lastExecuted", "lastError", "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: unimportant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unimportant (id, content, type, source, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_access_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_access_logs (id, "userId", "targetUserId", "relationId", action, "accessType", success, "dataScope", "ipAddress", "userAgent", "requestPath", "organizationId", "accessedAt") FROM stdin;
\.


--
-- Data for Name: user_ai_patterns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_ai_patterns (id, user_id, organization_id, preferred_streams, energy_patterns, acceptance_rate, common_modifications, total_suggestions, total_accepted, autonomy_level, enabled_contexts, updated_at) FROM stdin;
\.


--
-- Data for Name: user_patterns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_patterns (id, "patternType", "patternKey", confidence, strength, "sampleSize", "successRate", "patternData", conditions, outcomes, "detectedAt", "lastConfirmed", "validUntil", "learningSource", "algorithmVersion", correlations, "adaptationCount", "lastAdaptation", "adaptationReason", "userAcceptance", "manualOverrides", "implementationRate", "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permissions (id, "relationId", "dataScope", action, granted, "expiresAt", "grantedById", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, "energyPeaks", "energyValleys", "energyPattern", "preferredContexts", "contextTimeSlots", "contextAvoidance", "focusModePrefs", "optimalFocusLength", "focusEnergyMap", "breakFrequency", "breakDuration", "breakTypes", "lunchTime", "lunchDuration", "workStartTime", "workEndTime", workdays, "flexibleBlocks", "learningEnabled", "adaptationRate", "feedbackWeight", "organizationId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_relations (id, "managerId", "employeeId", "relationType", description, "isActive", "inheritanceRule", "canDelegate", "canApprove", "startsAt", "endsAt", "createdById", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_view_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_view_preferences (id, "userId", "viewType", preferences, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, "passwordHash", "firstName", "lastName", avatar, role, settings, "isActive", "emailVerified", "lastLoginAt", "createdAt", "updatedAt", "organizationId") FROM stdin;
4b117c25-c80a-428f-aa42-5118cf29fc04	demo@example.com	$2a$10$UPWi9ouOvhwuxuiVpC7rAui.NIDPTLTBr/LFU6gNKkJ32RSvU0b7q	Demo	User	\N	OWNER	{"theme": "light", "defaultView": "dashboard", "notifications": true}	t	t	\N	2026-01-29 11:04:51.453	2026-01-29 11:04:51.453	3e8966d6-9c2d-4772-be77-9cfc24b5776f
\.


--
-- Data for Name: vector_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vector_cache (id, "cacheKey", "queryText", results, "hitCount", "lastHit", "expiresAt", filters, "limit", threshold, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: vector_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vector_documents (id, title, content, "contentHash", embedding, "entityType", "entityId", source, language, "chunkIndex", "totalChunks", "chunkSize", "processingModel", "processingDate", "lastUpdated", "organizationId") FROM stdin;
\.


--
-- Data for Name: vector_search_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vector_search_results (id, "queryText", "queryEmbedding", "documentId", similarity, rank, "userId", "searchContext", "executionTime", "createdAt", "organizationId") FROM stdin;
\.


--
-- Data for Name: vectors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vectors (id, content, metadata, embedding_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_tokens (id, token, type, "userId", "expiresAt", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: view_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.view_analytics (id, "userId", "viewType", action, metadata, "durationSeconds", "createdAt") FROM stdin;
\.


--
-- Data for Name: view_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.view_configurations (id, "userId", "viewType", "viewName", configuration, "isDefault", "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: waiting_for; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.waiting_for (id, description, "waitingForWho", "sinceDate", "expectedResponseDate", "followUpDate", status, notes, "organizationId", "taskId", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: weekly_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weekly_reviews (id, "reviewDate", "completedTasksCount", "newTasksCount", "stalledTasks", "nextActions", notes, "collectLoosePapers", "processNotes", "emptyInbox", "processVoicemails", "reviewActionLists", "reviewCalendar", "reviewProjects", "reviewWaitingFor", "reviewSomedayMaybe", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: wiki_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wiki_categories (id, name, description, color, icon, "sortOrder", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: wiki_page_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wiki_page_links (id, "linkText", "sourcePageId", "targetPageId", "createdAt") FROM stdin;
\.


--
-- Data for Name: wiki_pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wiki_pages (id, title, slug, content, summary, "isPublished", version, template, "authorId", "categoryId", "organizationId", "parentPageId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: agent_actions agent_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_actions
    ADD CONSTRAINT agent_actions_pkey PRIMARY KEY (id);


--
-- Name: agent_analytics agent_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_analytics
    ADD CONSTRAINT agent_analytics_pkey PRIMARY KEY (id);


--
-- Name: agent_context_cache agent_context_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_context_cache
    ADD CONSTRAINT agent_context_cache_pkey PRIMARY KEY (id);


--
-- Name: agent_conversations agent_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_conversations
    ADD CONSTRAINT agent_conversations_pkey PRIMARY KEY (id);


--
-- Name: agent_feedback agent_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_feedback
    ADD CONSTRAINT agent_feedback_pkey PRIMARY KEY (id);


--
-- Name: agent_learning agent_learning_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_learning
    ADD CONSTRAINT agent_learning_pkey PRIMARY KEY (id);


--
-- Name: agent_messages agent_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_pkey PRIMARY KEY (id);


--
-- Name: agent_proactive_tasks agent_proactive_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_proactive_tasks
    ADD CONSTRAINT agent_proactive_tasks_pkey PRIMARY KEY (id);


--
-- Name: agent_suggestions agent_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_suggestions
    ADD CONSTRAINT agent_suggestions_pkey PRIMARY KEY (id);


--
-- Name: ai_executions ai_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT ai_executions_pkey PRIMARY KEY (id);


--
-- Name: ai_knowledge_bases ai_knowledge_bases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_knowledge_bases
    ADD CONSTRAINT ai_knowledge_bases_pkey PRIMARY KEY (id);


--
-- Name: ai_knowledge_documents ai_knowledge_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_knowledge_documents
    ADD CONSTRAINT ai_knowledge_documents_pkey PRIMARY KEY (id);


--
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (id);


--
-- Name: ai_predictions ai_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_predictions
    ADD CONSTRAINT ai_predictions_pkey PRIMARY KEY (id);


--
-- Name: ai_prompt_overrides ai_prompt_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_overrides
    ADD CONSTRAINT ai_prompt_overrides_pkey PRIMARY KEY (id);


--
-- Name: ai_prompt_templates ai_prompt_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT ai_prompt_templates_pkey PRIMARY KEY (id);


--
-- Name: ai_prompt_versions ai_prompt_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_versions
    ADD CONSTRAINT ai_prompt_versions_pkey PRIMARY KEY (id);


--
-- Name: ai_providers ai_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_providers
    ADD CONSTRAINT ai_providers_pkey PRIMARY KEY (id);


--
-- Name: ai_rules ai_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_rules
    ADD CONSTRAINT ai_rules_pkey PRIMARY KEY (id);


--
-- Name: ai_suggestions ai_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_suggestions
    ADD CONSTRAINT ai_suggestions_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_stats ai_usage_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT ai_usage_stats_pkey PRIMARY KEY (id);


--
-- Name: areas_of_responsibility areas_of_responsibility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas_of_responsibility
    ADD CONSTRAINT areas_of_responsibility_pkey PRIMARY KEY (id);


--
-- Name: auto_replies auto_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auto_replies
    ADD CONSTRAINT auto_replies_pkey PRIMARY KEY (id);


--
-- Name: break_templates break_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.break_templates
    ADD CONSTRAINT break_templates_pkey PRIMARY KEY (id);


--
-- Name: bug_reports bug_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_pkey PRIMARY KEY (id);


--
-- Name: communication_channels communication_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_channels
    ADD CONSTRAINT communication_channels_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- Name: completeness completeness_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completeness
    ADD CONSTRAINT completeness_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: context_priorities context_priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.context_priorities
    ADD CONSTRAINT context_priorities_pkey PRIMARY KEY (id);


--
-- Name: contexts contexts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contexts
    ADD CONSTRAINT contexts_pkey PRIMARY KEY (id);


--
-- Name: critical_path critical_path_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.critical_path
    ADD CONSTRAINT critical_path_pkey PRIMARY KEY (id);


--
-- Name: day_templates day_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_templates
    ADD CONSTRAINT day_templates_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: delegated_tasks delegated_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegated_tasks
    ADD CONSTRAINT delegated_tasks_pkey PRIMARY KEY (id);


--
-- Name: dependencies dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dependencies
    ADD CONSTRAINT dependencies_pkey PRIMARY KEY (id);


--
-- Name: document_comments document_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_pkey PRIMARY KEY (id);


--
-- Name: document_links document_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_links
    ADD CONSTRAINT document_links_pkey PRIMARY KEY (id);


--
-- Name: document_shares document_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT document_shares_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: email_accounts email_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_accounts
    ADD CONSTRAINT email_accounts_pkey PRIMARY KEY (id);


--
-- Name: email_analysis email_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_analysis
    ADD CONSTRAINT email_analysis_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_rules email_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_rules
    ADD CONSTRAINT email_rules_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: energy_analytics energy_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_analytics
    ADD CONSTRAINT energy_analytics_pkey PRIMARY KEY (id);


--
-- Name: energy_patterns energy_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_patterns
    ADD CONSTRAINT energy_patterns_pkey PRIMARY KEY (id);


--
-- Name: energy_time_blocks energy_time_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_time_blocks
    ADD CONSTRAINT energy_time_blocks_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: flow_automation_rules flow_automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_automation_rules
    ADD CONSTRAINT flow_automation_rules_pkey PRIMARY KEY (id);


--
-- Name: flow_conversation_messages flow_conversation_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_conversation_messages
    ADD CONSTRAINT flow_conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: flow_conversations flow_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_conversations
    ADD CONSTRAINT flow_conversations_pkey PRIMARY KEY (id);


--
-- Name: flow_learned_patterns flow_learned_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_learned_patterns
    ADD CONSTRAINT flow_learned_patterns_pkey PRIMARY KEY (id);


--
-- Name: flow_processing_history flow_processing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_processing_history
    ADD CONSTRAINT flow_processing_history_pkey PRIMARY KEY (id);


--
-- Name: focus_modes focus_modes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.focus_modes
    ADD CONSTRAINT focus_modes_pkey PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: gtd_buckets gtd_buckets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gtd_buckets
    ADD CONSTRAINT gtd_buckets_pkey PRIMARY KEY (id);


--
-- Name: gtd_horizons gtd_horizons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gtd_horizons
    ADD CONSTRAINT gtd_horizons_pkey PRIMARY KEY (id);


--
-- Name: habit_entries habit_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habit_entries
    ADD CONSTRAINT habit_entries_pkey PRIMARY KEY (id);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: inbox_items inbox_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT inbox_items_pkey PRIMARY KEY (id);


--
-- Name: info info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info
    ADD CONSTRAINT info_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: kanban_columns kanban_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kanban_columns
    ADD CONSTRAINT kanban_columns_pkey PRIMARY KEY (id);


--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: message_attachments message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_pkey PRIMARY KEY (id);


--
-- Name: message_processing_results message_processing_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_processing_results
    ADD CONSTRAINT message_processing_results_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: metadata metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metadata
    ADD CONSTRAINT metadata_pkey PRIMARY KEY (id);


--
-- Name: next_actions next_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT next_actions_pkey PRIMARY KEY (id);


--
-- Name: offer_items offer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer_items
    ADD CONSTRAINT offer_items_pkey PRIMARY KEY (id);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: precise_goals precise_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.precise_goals
    ADD CONSTRAINT precise_goals_pkey PRIMARY KEY (id);


--
-- Name: processing_rules processing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processing_rules
    ADD CONSTRAINT processing_rules_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: project_dependencies project_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_dependencies
    ADD CONSTRAINT project_dependencies_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (id);


--
-- Name: recurring_tasks recurring_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: scheduled_tasks scheduled_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_tasks
    ADD CONSTRAINT scheduled_tasks_pkey PRIMARY KEY (id);


--
-- Name: search_index search_index_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_index
    ADD CONSTRAINT search_index_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: smart_analysis_details smart_analysis_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_analysis_details
    ADD CONSTRAINT smart_analysis_details_pkey PRIMARY KEY (id);


--
-- Name: smart_improvements smart_improvements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_improvements
    ADD CONSTRAINT smart_improvements_pkey PRIMARY KEY (id);


--
-- Name: smart_mailbox_rules smart_mailbox_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_mailbox_rules
    ADD CONSTRAINT smart_mailbox_rules_pkey PRIMARY KEY (id);


--
-- Name: smart_mailboxes smart_mailboxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_mailboxes
    ADD CONSTRAINT smart_mailboxes_pkey PRIMARY KEY (id);


--
-- Name: smart smart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart
    ADD CONSTRAINT smart_pkey PRIMARY KEY (id);


--
-- Name: smart_templates smart_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_templates
    ADD CONSTRAINT smart_templates_pkey PRIMARY KEY (id);


--
-- Name: someday_maybe someday_maybe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.someday_maybe
    ADD CONSTRAINT someday_maybe_pkey PRIMARY KEY (id);


--
-- Name: sprints sprints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT sprints_pkey PRIMARY KEY (id);


--
-- Name: stream_access_logs stream_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT stream_access_logs_pkey PRIMARY KEY (id);


--
-- Name: stream_channels stream_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_channels
    ADD CONSTRAINT stream_channels_pkey PRIMARY KEY (id);


--
-- Name: stream_permissions stream_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT stream_permissions_pkey PRIMARY KEY (id);


--
-- Name: stream_relations stream_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT stream_relations_pkey PRIMARY KEY (id);


--
-- Name: streams streams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: task_dependencies task_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT task_dependencies_pkey PRIMARY KEY (id);


--
-- Name: task_history task_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_pkey PRIMARY KEY (id);


--
-- Name: task_relationships task_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_relationships
    ADD CONSTRAINT task_relationships_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: template_applications template_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_applications
    ADD CONSTRAINT template_applications_pkey PRIMARY KEY (id);


--
-- Name: timeline timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline
    ADD CONSTRAINT timeline_pkey PRIMARY KEY (id);


--
-- Name: unified_rule_executions unified_rule_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unified_rule_executions
    ADD CONSTRAINT unified_rule_executions_pkey PRIMARY KEY (id);


--
-- Name: unified_rules unified_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unified_rules
    ADD CONSTRAINT unified_rules_pkey PRIMARY KEY (id);


--
-- Name: unimportant unimportant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unimportant
    ADD CONSTRAINT unimportant_pkey PRIMARY KEY (id);


--
-- Name: user_access_logs user_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT user_access_logs_pkey PRIMARY KEY (id);


--
-- Name: user_ai_patterns user_ai_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ai_patterns
    ADD CONSTRAINT user_ai_patterns_pkey PRIMARY KEY (id);


--
-- Name: user_patterns user_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_patterns
    ADD CONSTRAINT user_patterns_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_relations user_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT user_relations_pkey PRIMARY KEY (id);


--
-- Name: user_view_preferences user_view_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_view_preferences
    ADD CONSTRAINT user_view_preferences_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vector_cache vector_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vector_cache
    ADD CONSTRAINT vector_cache_pkey PRIMARY KEY (id);


--
-- Name: vector_documents vector_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vector_documents
    ADD CONSTRAINT vector_documents_pkey PRIMARY KEY (id);


--
-- Name: vector_search_results vector_search_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vector_search_results
    ADD CONSTRAINT vector_search_results_pkey PRIMARY KEY (id);


--
-- Name: vectors vectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vectors
    ADD CONSTRAINT vectors_pkey PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: view_analytics view_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_analytics
    ADD CONSTRAINT view_analytics_pkey PRIMARY KEY (id);


--
-- Name: view_configurations view_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_configurations
    ADD CONSTRAINT view_configurations_pkey PRIMARY KEY (id);


--
-- Name: waiting_for waiting_for_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waiting_for
    ADD CONSTRAINT waiting_for_pkey PRIMARY KEY (id);


--
-- Name: weekly_reviews weekly_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_reviews
    ADD CONSTRAINT weekly_reviews_pkey PRIMARY KEY (id);


--
-- Name: wiki_categories wiki_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_categories
    ADD CONSTRAINT wiki_categories_pkey PRIMARY KEY (id);


--
-- Name: wiki_page_links wiki_page_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_page_links
    ADD CONSTRAINT wiki_page_links_pkey PRIMARY KEY (id);


--
-- Name: wiki_pages wiki_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT wiki_pages_pkey PRIMARY KEY (id);


--
-- Name: agent_actions_actionType_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_actions_actionType_status_idx" ON public.agent_actions USING btree ("actionType", status);


--
-- Name: agent_actions_organizationId_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_actions_organizationId_userId_idx" ON public.agent_actions USING btree ("organizationId", "userId");


--
-- Name: agent_analytics_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX agent_analytics_date_idx ON public.agent_analytics USING btree (date);


--
-- Name: agent_analytics_organizationId_userId_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "agent_analytics_organizationId_userId_date_key" ON public.agent_analytics USING btree ("organizationId", "userId", date);


--
-- Name: agent_context_cache_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_context_cache_expiresAt_idx" ON public.agent_context_cache USING btree ("expiresAt");


--
-- Name: agent_context_cache_organizationId_userId_cacheKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "agent_context_cache_organizationId_userId_cacheKey_key" ON public.agent_context_cache USING btree ("organizationId", "userId", "cacheKey");


--
-- Name: agent_conversations_lastMessageAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_conversations_lastMessageAt_idx" ON public.agent_conversations USING btree ("lastMessageAt");


--
-- Name: agent_conversations_organizationId_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_conversations_organizationId_userId_idx" ON public.agent_conversations USING btree ("organizationId", "userId");


--
-- Name: agent_feedback_messageId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "agent_feedback_messageId_key" ON public.agent_feedback USING btree ("messageId");


--
-- Name: agent_feedback_userId_feedbackType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_feedback_userId_feedbackType_idx" ON public.agent_feedback USING btree ("userId", "feedbackType");


--
-- Name: agent_learning_organizationId_userId_learningType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_learning_organizationId_userId_learningType_idx" ON public.agent_learning USING btree ("organizationId", "userId", "learningType");


--
-- Name: agent_messages_conversationId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_messages_conversationId_createdAt_idx" ON public.agent_messages USING btree ("conversationId", "createdAt");


--
-- Name: agent_proactive_tasks_organizationId_userId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_proactive_tasks_organizationId_userId_status_idx" ON public.agent_proactive_tasks USING btree ("organizationId", "userId", status);


--
-- Name: agent_proactive_tasks_scheduledFor_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_proactive_tasks_scheduledFor_idx" ON public.agent_proactive_tasks USING btree ("scheduledFor");


--
-- Name: agent_suggestions_organizationId_userId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agent_suggestions_organizationId_userId_status_idx" ON public.agent_suggestions USING btree ("organizationId", "userId", status);


--
-- Name: ai_knowledge_bases_organizationId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ai_knowledge_bases_organizationId_name_key" ON public.ai_knowledge_bases USING btree ("organizationId", name);


--
-- Name: ai_models_providerId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ai_models_providerId_name_key" ON public.ai_models USING btree ("providerId", name);


--
-- Name: ai_prompt_overrides_promptId_organizationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ai_prompt_overrides_promptId_organizationId_key" ON public.ai_prompt_overrides USING btree ("promptId", "organizationId");


--
-- Name: ai_prompt_templates_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_prompt_templates_category_idx ON public.ai_prompt_templates USING btree (category);


--
-- Name: ai_prompt_templates_organizationId_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ai_prompt_templates_organizationId_code_idx" ON public.ai_prompt_templates USING btree ("organizationId", code);


--
-- Name: ai_prompt_templates_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_prompt_templates_status_idx ON public.ai_prompt_templates USING btree (status);


--
-- Name: ai_prompt_versions_promptId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ai_prompt_versions_promptId_idx" ON public.ai_prompt_versions USING btree ("promptId");


--
-- Name: ai_prompt_versions_promptId_version_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ai_prompt_versions_promptId_version_key" ON public.ai_prompt_versions USING btree ("promptId", version);


--
-- Name: ai_providers_organizationId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ai_providers_organizationId_name_key" ON public.ai_providers USING btree ("organizationId", name);


--
-- Name: ai_rules_organizationId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ai_rules_organizationId_name_key" ON public.ai_rules USING btree ("organizationId", name);


--
-- Name: ai_suggestions_context_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_suggestions_context_idx ON public.ai_suggestions USING btree (context);


--
-- Name: ai_suggestions_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_suggestions_created_at_idx ON public.ai_suggestions USING btree (created_at);


--
-- Name: ai_suggestions_organization_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_suggestions_organization_id_idx ON public.ai_suggestions USING btree (organization_id);


--
-- Name: ai_suggestions_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_suggestions_status_idx ON public.ai_suggestions USING btree (status);


--
-- Name: ai_suggestions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_suggestions_user_id_idx ON public.ai_suggestions USING btree (user_id);


--
-- Name: ai_usage_stats_organizationId_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ai_usage_stats_organizationId_date_key" ON public.ai_usage_stats USING btree ("organizationId", date);


--
-- Name: context_priorities_userId_contextName_timeSlot_dayOfWeek_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "context_priorities_userId_contextName_timeSlot_dayOfWeek_key" ON public.context_priorities USING btree ("userId", "contextName", "timeSlot", "dayOfWeek");


--
-- Name: contexts_organizationId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "contexts_organizationId_name_key" ON public.contexts USING btree ("organizationId", name);


--
-- Name: document_links_sourceDocumentId_targetDocumentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "document_links_sourceDocumentId_targetDocumentId_key" ON public.document_links USING btree ("sourceDocumentId", "targetDocumentId");


--
-- Name: document_shares_documentId_sharedWithId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "document_shares_documentId_sharedWithId_key" ON public.document_shares USING btree ("documentId", "sharedWithId");


--
-- Name: email_accounts_organizationId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "email_accounts_organizationId_email_key" ON public.email_accounts USING btree ("organizationId", email);


--
-- Name: energy_patterns_userId_timeSlot_dayOfWeek_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "energy_patterns_userId_timeSlot_dayOfWeek_key" ON public.energy_patterns USING btree ("userId", "timeSlot", "dayOfWeek");


--
-- Name: energy_time_blocks_userId_startTime_dayOfWeek_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "energy_time_blocks_userId_startTime_dayOfWeek_key" ON public.energy_time_blocks USING btree ("userId", "startTime", "dayOfWeek");


--
-- Name: flow_automation_rules_organizationId_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "flow_automation_rules_organizationId_isActive_idx" ON public.flow_automation_rules USING btree ("organizationId", "isActive");


--
-- Name: flow_automation_rules_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flow_automation_rules_priority_idx ON public.flow_automation_rules USING btree (priority);


--
-- Name: flow_conversation_messages_conversation_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flow_conversation_messages_conversation_id_created_at_idx ON public.flow_conversation_messages USING btree (conversation_id, created_at);


--
-- Name: flow_conversations_inbox_item_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flow_conversations_inbox_item_id_idx ON public.flow_conversations USING btree (inbox_item_id);


--
-- Name: flow_conversations_organization_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flow_conversations_organization_id_status_idx ON public.flow_conversations USING btree (organization_id, status);


--
-- Name: flow_learned_patterns_elementType_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "flow_learned_patterns_elementType_isActive_idx" ON public.flow_learned_patterns USING btree ("elementType", "isActive");


--
-- Name: flow_learned_patterns_organizationId_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "flow_learned_patterns_organizationId_userId_idx" ON public.flow_learned_patterns USING btree ("organizationId", "userId");


--
-- Name: flow_processing_history_inboxItemId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "flow_processing_history_inboxItemId_idx" ON public.flow_processing_history USING btree ("inboxItemId");


--
-- Name: flow_processing_history_organizationId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "flow_processing_history_organizationId_createdAt_idx" ON public.flow_processing_history USING btree ("organizationId", "createdAt");


--
-- Name: folders_organizationId_parentId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "folders_organizationId_parentId_name_key" ON public.folders USING btree ("organizationId", "parentId", name);


--
-- Name: gtd_buckets_organizationId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "gtd_buckets_organizationId_name_key" ON public.gtd_buckets USING btree ("organizationId", name);


--
-- Name: gtd_horizons_organizationId_level_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "gtd_horizons_organizationId_level_key" ON public.gtd_horizons USING btree ("organizationId", level);


--
-- Name: habit_entries_habitId_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "habit_entries_habitId_date_key" ON public.habit_entries USING btree ("habitId", date);


--
-- Name: inbox_items_capturedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "inbox_items_capturedAt_idx" ON public.inbox_items USING btree ("capturedAt");


--
-- Name: inbox_items_organizationId_flowStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "inbox_items_organizationId_flowStatus_idx" ON public.inbox_items USING btree ("organizationId", "flowStatus");


--
-- Name: inbox_items_organizationId_processed_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "inbox_items_organizationId_processed_idx" ON public.inbox_items USING btree ("organizationId", processed);


--
-- Name: inbox_items_splitFromId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "inbox_items_splitFromId_idx" ON public.inbox_items USING btree ("splitFromId");


--
-- Name: invoices_invoiceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON public.invoices USING btree ("invoiceNumber");


--
-- Name: offers_offerNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "offers_offerNumber_key" ON public.offers USING btree ("offerNumber");


--
-- Name: orders_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "orders_orderNumber_key" ON public.orders USING btree ("orderNumber");


--
-- Name: organizations_domain_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX organizations_domain_key ON public.organizations USING btree (domain);


--
-- Name: organizations_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);


--
-- Name: performance_metrics_userId_startDate_endDate_periodType_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "performance_metrics_userId_startDate_endDate_periodType_key" ON public.performance_metrics USING btree ("userId", "startDate", "endDate", "periodType");


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: search_index_entityType_entityId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "search_index_entityType_entityId_key" ON public.search_index USING btree ("entityType", "entityId");


--
-- Name: search_index_organizationId_entityType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "search_index_organizationId_entityType_idx" ON public.search_index USING btree ("organizationId", "entityType");


--
-- Name: smart_mailboxes_organizationId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "smart_mailboxes_organizationId_name_key" ON public.smart_mailboxes USING btree ("organizationId", name);


--
-- Name: stream_access_logs_organizationId_accessedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_access_logs_organizationId_accessedAt_idx" ON public.stream_access_logs USING btree ("organizationId", "accessedAt");


--
-- Name: stream_access_logs_streamId_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_access_logs_streamId_userId_idx" ON public.stream_access_logs USING btree ("streamId", "userId");


--
-- Name: stream_access_logs_userId_accessedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_access_logs_userId_accessedAt_idx" ON public.stream_access_logs USING btree ("userId", "accessedAt");


--
-- Name: stream_channels_streamId_channelId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "stream_channels_streamId_channelId_key" ON public.stream_channels USING btree ("streamId", "channelId");


--
-- Name: stream_permissions_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_permissions_organizationId_idx" ON public.stream_permissions USING btree ("organizationId");


--
-- Name: stream_permissions_relationId_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_permissions_relationId_userId_idx" ON public.stream_permissions USING btree ("relationId", "userId");


--
-- Name: stream_permissions_streamId_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_permissions_streamId_userId_idx" ON public.stream_permissions USING btree ("streamId", "userId");


--
-- Name: stream_permissions_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_permissions_userId_idx" ON public.stream_permissions USING btree ("userId");


--
-- Name: stream_relations_childId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_relations_childId_idx" ON public.stream_relations USING btree ("childId");


--
-- Name: stream_relations_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_relations_organizationId_idx" ON public.stream_relations USING btree ("organizationId");


--
-- Name: stream_relations_parentId_childId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "stream_relations_parentId_childId_key" ON public.stream_relations USING btree ("parentId", "childId");


--
-- Name: stream_relations_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stream_relations_parentId_idx" ON public.stream_relations USING btree ("parentId");


--
-- Name: streams_horizonLevel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "streams_horizonLevel_idx" ON public.streams USING btree ("horizonLevel");


--
-- Name: streams_streamType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "streams_streamType_idx" ON public.streams USING btree ("streamType");


--
-- Name: streams_templateOrigin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "streams_templateOrigin_idx" ON public.streams USING btree ("templateOrigin");


--
-- Name: tags_organizationId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "tags_organizationId_name_key" ON public.tags USING btree ("organizationId", name);


--
-- Name: task_dependencies_predecessorId_successorId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "task_dependencies_predecessorId_successorId_key" ON public.task_dependencies USING btree ("predecessorId", "successorId");


--
-- Name: user_access_logs_accessedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_access_logs_accessedAt_idx" ON public.user_access_logs USING btree ("accessedAt");


--
-- Name: user_access_logs_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_access_logs_organizationId_idx" ON public.user_access_logs USING btree ("organizationId");


--
-- Name: user_access_logs_targetUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_access_logs_targetUserId_idx" ON public.user_access_logs USING btree ("targetUserId");


--
-- Name: user_access_logs_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_access_logs_userId_idx" ON public.user_access_logs USING btree ("userId");


--
-- Name: user_ai_patterns_organization_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_ai_patterns_organization_id_idx ON public.user_ai_patterns USING btree (organization_id);


--
-- Name: user_ai_patterns_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_ai_patterns_user_id_key ON public.user_ai_patterns USING btree (user_id);


--
-- Name: user_patterns_userId_patternType_patternKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_patterns_userId_patternType_patternKey_key" ON public.user_patterns USING btree ("userId", "patternType", "patternKey");


--
-- Name: user_permissions_dataScope_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_permissions_dataScope_idx" ON public.user_permissions USING btree ("dataScope");


--
-- Name: user_permissions_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_permissions_organizationId_idx" ON public.user_permissions USING btree ("organizationId");


--
-- Name: user_permissions_relationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_permissions_relationId_idx" ON public.user_permissions USING btree ("relationId");


--
-- Name: user_profiles_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_profiles_userId_key" ON public.user_profiles USING btree ("userId");


--
-- Name: user_relations_employeeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_relations_employeeId_idx" ON public.user_relations USING btree ("employeeId");


--
-- Name: user_relations_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_relations_isActive_idx" ON public.user_relations USING btree ("isActive");


--
-- Name: user_relations_managerId_employeeId_relationType_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_relations_managerId_employeeId_relationType_key" ON public.user_relations USING btree ("managerId", "employeeId", "relationType");


--
-- Name: user_relations_managerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_relations_managerId_idx" ON public.user_relations USING btree ("managerId");


--
-- Name: user_relations_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_relations_organizationId_idx" ON public.user_relations USING btree ("organizationId");


--
-- Name: user_view_preferences_userId_viewType_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_view_preferences_userId_viewType_key" ON public.user_view_preferences USING btree ("userId", "viewType");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: vector_cache_cacheKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "vector_cache_cacheKey_key" ON public.vector_cache USING btree ("cacheKey");


--
-- Name: vector_cache_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "vector_cache_expiresAt_idx" ON public.vector_cache USING btree ("expiresAt");


--
-- Name: vector_cache_organizationId_cacheKey_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "vector_cache_organizationId_cacheKey_idx" ON public.vector_cache USING btree ("organizationId", "cacheKey");


--
-- Name: vector_documents_contentHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "vector_documents_contentHash_idx" ON public.vector_documents USING btree ("contentHash");


--
-- Name: vector_documents_contentHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "vector_documents_contentHash_key" ON public.vector_documents USING btree ("contentHash");


--
-- Name: vector_documents_organizationId_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "vector_documents_organizationId_entityId_idx" ON public.vector_documents USING btree ("organizationId", "entityId");


--
-- Name: vector_documents_organizationId_entityType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "vector_documents_organizationId_entityType_idx" ON public.vector_documents USING btree ("organizationId", "entityType");


--
-- Name: vector_search_results_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "vector_search_results_createdAt_idx" ON public.vector_search_results USING btree ("createdAt");


--
-- Name: vector_search_results_organizationId_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "vector_search_results_organizationId_userId_idx" ON public.vector_search_results USING btree ("organizationId", "userId");


--
-- Name: verification_tokens_token_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_tokens_token_idx ON public.verification_tokens USING btree (token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: verification_tokens_userId_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "verification_tokens_userId_type_idx" ON public.verification_tokens USING btree ("userId", type);


--
-- Name: weekly_reviews_organizationId_reviewDate_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "weekly_reviews_organizationId_reviewDate_key" ON public.weekly_reviews USING btree ("organizationId", "reviewDate");


--
-- Name: wiki_categories_organizationId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "wiki_categories_organizationId_name_key" ON public.wiki_categories USING btree ("organizationId", name);


--
-- Name: wiki_page_links_sourcePageId_targetPageId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "wiki_page_links_sourcePageId_targetPageId_key" ON public.wiki_page_links USING btree ("sourcePageId", "targetPageId");


--
-- Name: wiki_pages_organizationId_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "wiki_pages_organizationId_slug_key" ON public.wiki_pages USING btree ("organizationId", slug);


--
-- Name: activities activities_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public.meetings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activities activities_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agent_actions agent_actions_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_actions
    ADD CONSTRAINT "agent_actions_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.agent_conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_actions agent_actions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_actions
    ADD CONSTRAINT "agent_actions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_actions agent_actions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_actions
    ADD CONSTRAINT "agent_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_analytics agent_analytics_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_analytics
    ADD CONSTRAINT "agent_analytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_analytics agent_analytics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_analytics
    ADD CONSTRAINT "agent_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_context_cache agent_context_cache_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_context_cache
    ADD CONSTRAINT "agent_context_cache_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_context_cache agent_context_cache_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_context_cache
    ADD CONSTRAINT "agent_context_cache_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_conversations agent_conversations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_conversations
    ADD CONSTRAINT "agent_conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_conversations agent_conversations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_conversations
    ADD CONSTRAINT "agent_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_feedback agent_feedback_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_feedback
    ADD CONSTRAINT "agent_feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public.agent_messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_feedback agent_feedback_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_feedback
    ADD CONSTRAINT "agent_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_learning agent_learning_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_learning
    ADD CONSTRAINT "agent_learning_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_learning agent_learning_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_learning
    ADD CONSTRAINT "agent_learning_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_messages agent_messages_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT "agent_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.agent_conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_proactive_tasks agent_proactive_tasks_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_proactive_tasks
    ADD CONSTRAINT "agent_proactive_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_proactive_tasks agent_proactive_tasks_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_proactive_tasks
    ADD CONSTRAINT "agent_proactive_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_suggestions agent_suggestions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_suggestions
    ADD CONSTRAINT "agent_suggestions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agent_suggestions agent_suggestions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_suggestions
    ADD CONSTRAINT "agent_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_executions ai_executions_modelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES public.ai_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_executions ai_executions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_executions ai_executions_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public.ai_providers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_executions ai_executions_ruleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES public.ai_rules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_executions ai_executions_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_executions
    ADD CONSTRAINT "ai_executions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.ai_prompt_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_knowledge_bases ai_knowledge_bases_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_knowledge_bases
    ADD CONSTRAINT "ai_knowledge_bases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_knowledge_documents ai_knowledge_documents_knowledgeBaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_knowledge_documents
    ADD CONSTRAINT "ai_knowledge_documents_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES public.ai_knowledge_bases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_models ai_models_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT "ai_models_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public.ai_providers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_prompt_overrides ai_prompt_overrides_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_overrides
    ADD CONSTRAINT "ai_prompt_overrides_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_prompt_overrides ai_prompt_overrides_promptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_overrides
    ADD CONSTRAINT "ai_prompt_overrides_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES public.ai_prompt_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_prompt_templates ai_prompt_templates_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT "ai_prompt_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_prompt_templates ai_prompt_templates_modelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT "ai_prompt_templates_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES public.ai_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_prompt_templates ai_prompt_templates_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT "ai_prompt_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_prompt_versions ai_prompt_versions_changedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_versions
    ADD CONSTRAINT "ai_prompt_versions_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_prompt_versions ai_prompt_versions_promptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prompt_versions
    ADD CONSTRAINT "ai_prompt_versions_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES public.ai_prompt_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_providers ai_providers_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_providers
    ADD CONSTRAINT "ai_providers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_rules ai_rules_modelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_rules
    ADD CONSTRAINT "ai_rules_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES public.ai_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_rules ai_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_rules
    ADD CONSTRAINT "ai_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_rules ai_rules_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_rules
    ADD CONSTRAINT "ai_rules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.ai_prompt_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_suggestions ai_suggestions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_suggestions
    ADD CONSTRAINT ai_suggestions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_suggestions ai_suggestions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_suggestions
    ADD CONSTRAINT ai_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_usage_stats ai_usage_stats_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT "ai_usage_stats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: areas_of_responsibility areas_of_responsibility_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas_of_responsibility
    ADD CONSTRAINT "areas_of_responsibility_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: areas_of_responsibility areas_of_responsibility_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas_of_responsibility
    ADD CONSTRAINT "areas_of_responsibility_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auto_replies auto_replies_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auto_replies
    ADD CONSTRAINT "auto_replies_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: auto_replies auto_replies_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auto_replies
    ADD CONSTRAINT "auto_replies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: break_templates break_templates_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.break_templates
    ADD CONSTRAINT "break_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: break_templates break_templates_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.break_templates
    ADD CONSTRAINT "break_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bug_reports bug_reports_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT "bug_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bug_reports bug_reports_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT "bug_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: communication_channels communication_channels_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_channels
    ADD CONSTRAINT "communication_channels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: communication_channels communication_channels_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_channels
    ADD CONSTRAINT "communication_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: companies companies_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "companies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: companies companies_primaryContactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "companies_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: completeness completeness_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completeness
    ADD CONSTRAINT "completeness_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: completeness completeness_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completeness
    ADD CONSTRAINT "completeness_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contacts contacts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contacts contacts_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: context_priorities context_priorities_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.context_priorities
    ADD CONSTRAINT "context_priorities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: context_priorities context_priorities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.context_priorities
    ADD CONSTRAINT "context_priorities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contexts contexts_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contexts
    ADD CONSTRAINT "contexts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: critical_path critical_path_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.critical_path
    ADD CONSTRAINT "critical_path_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: day_templates day_templates_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_templates
    ADD CONSTRAINT "day_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: day_templates day_templates_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_templates
    ADD CONSTRAINT "day_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: day_templates day_templates_userProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_templates
    ADD CONSTRAINT "day_templates_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deals deals_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deals deals_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deals deals_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: delegated_tasks delegated_tasks_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegated_tasks
    ADD CONSTRAINT "delegated_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: delegated_tasks delegated_tasks_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegated_tasks
    ADD CONSTRAINT "delegated_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: document_comments document_comments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT "document_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_comments document_comments_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT "document_comments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_comments document_comments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT "document_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.document_comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_links document_links_sourceDocumentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_links
    ADD CONSTRAINT "document_links_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_links document_links_targetDocumentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_links
    ADD CONSTRAINT "document_links_targetDocumentId_fkey" FOREIGN KEY ("targetDocumentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_shares document_shares_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT "document_shares_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_shares document_shares_sharedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT "document_shares_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_shares document_shares_sharedWithId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT "document_shares_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_accounts email_accounts_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_accounts
    ADD CONSTRAINT "email_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_accounts email_accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_accounts
    ADD CONSTRAINT "email_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_analysis email_analysis_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_analysis
    ADD CONSTRAINT "email_analysis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_logs email_logs_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT "email_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_logs email_logs_sentByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT "email_logs_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: email_rules email_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_rules
    ADD CONSTRAINT "email_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_templates email_templates_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT "email_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: email_templates email_templates_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT "email_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: energy_analytics energy_analytics_energyTimeBlockId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_analytics
    ADD CONSTRAINT "energy_analytics_energyTimeBlockId_fkey" FOREIGN KEY ("energyTimeBlockId") REFERENCES public.energy_time_blocks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: energy_analytics energy_analytics_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_analytics
    ADD CONSTRAINT "energy_analytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: energy_analytics energy_analytics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_analytics
    ADD CONSTRAINT "energy_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: energy_patterns energy_patterns_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_patterns
    ADD CONSTRAINT "energy_patterns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: energy_patterns energy_patterns_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_patterns
    ADD CONSTRAINT "energy_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: energy_time_blocks energy_time_blocks_focusModeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_time_blocks
    ADD CONSTRAINT "energy_time_blocks_focusModeId_fkey" FOREIGN KEY ("focusModeId") REFERENCES public.focus_modes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: energy_time_blocks energy_time_blocks_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_time_blocks
    ADD CONSTRAINT "energy_time_blocks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: energy_time_blocks energy_time_blocks_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_time_blocks
    ADD CONSTRAINT "energy_time_blocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: error_logs error_logs_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT "error_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: error_logs error_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: files files_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_automation_rules flow_automation_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_automation_rules
    ADD CONSTRAINT "flow_automation_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_automation_rules flow_automation_rules_targetProjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_automation_rules
    ADD CONSTRAINT "flow_automation_rules_targetProjectId_fkey" FOREIGN KEY ("targetProjectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: flow_automation_rules flow_automation_rules_targetStreamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_automation_rules
    ADD CONSTRAINT "flow_automation_rules_targetStreamId_fkey" FOREIGN KEY ("targetStreamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: flow_automation_rules flow_automation_rules_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_automation_rules
    ADD CONSTRAINT "flow_automation_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_conversation_messages flow_conversation_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_conversation_messages
    ADD CONSTRAINT flow_conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.flow_conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_conversations flow_conversations_final_stream_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_conversations
    ADD CONSTRAINT flow_conversations_final_stream_id_fkey FOREIGN KEY (final_stream_id) REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: flow_conversations flow_conversations_inbox_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_conversations
    ADD CONSTRAINT flow_conversations_inbox_item_id_fkey FOREIGN KEY (inbox_item_id) REFERENCES public.inbox_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_conversations flow_conversations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_conversations
    ADD CONSTRAINT flow_conversations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_conversations flow_conversations_proposed_stream_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_conversations
    ADD CONSTRAINT flow_conversations_proposed_stream_id_fkey FOREIGN KEY (proposed_stream_id) REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: flow_conversations flow_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_conversations
    ADD CONSTRAINT flow_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_learned_patterns flow_learned_patterns_learnedStreamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_learned_patterns
    ADD CONSTRAINT "flow_learned_patterns_learnedStreamId_fkey" FOREIGN KEY ("learnedStreamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: flow_learned_patterns flow_learned_patterns_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_learned_patterns
    ADD CONSTRAINT "flow_learned_patterns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_learned_patterns flow_learned_patterns_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_learned_patterns
    ADD CONSTRAINT "flow_learned_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_processing_history flow_processing_history_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_processing_history
    ADD CONSTRAINT "flow_processing_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flow_processing_history flow_processing_history_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_processing_history
    ADD CONSTRAINT "flow_processing_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: focus_modes focus_modes_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.focus_modes
    ADD CONSTRAINT "focus_modes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gtd_buckets gtd_buckets_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gtd_buckets
    ADD CONSTRAINT "gtd_buckets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gtd_horizons gtd_horizons_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gtd_horizons
    ADD CONSTRAINT "gtd_horizons_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: habit_entries habit_entries_habitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habit_entries
    ADD CONSTRAINT "habit_entries_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES public.habits(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: habits habits_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT "habits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inbox_items inbox_items_capturedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inbox_items inbox_items_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inbox_items inbox_items_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_resultingTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_resultingTaskId_fkey" FOREIGN KEY ("resultingTaskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_splitFromId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_splitFromId_fkey" FOREIGN KEY ("splitFromId") REFERENCES public.inbox_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbox_items inbox_items_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT "inbox_items_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: info info_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info
    ADD CONSTRAINT "info_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice_items invoice_items_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "invoice_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kanban_columns kanban_columns_viewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kanban_columns
    ADD CONSTRAINT "kanban_columns_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES public.view_configurations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: knowledge_base knowledge_base_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT "knowledge_base_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leads leads_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meetings meetings_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT "meetings_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meetings meetings_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT "meetings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meetings meetings_organizedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT "meetings_organizedById_fkey" FOREIGN KEY ("organizedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: message_attachments message_attachments_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_processing_results message_processing_results_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_processing_results
    ADD CONSTRAINT "message_processing_results_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_processing_results message_processing_results_ruleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_processing_results
    ADD CONSTRAINT "message_processing_results_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES public.processing_rules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_emailAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES public.email_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: next_actions next_actions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: next_actions next_actions_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: next_actions next_actions_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.next_actions
    ADD CONSTRAINT "next_actions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offer_items offer_items_offerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer_items
    ADD CONSTRAINT "offer_items_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES public.offers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: offer_items offer_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer_items
    ADD CONSTRAINT "offer_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offer_items offer_items_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer_items
    ADD CONSTRAINT "offer_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offers offers_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offers offers_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offers offers_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: offers offers_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: offers offers_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "offers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_items order_items_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: performance_metrics performance_metrics_focusModeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT "performance_metrics_focusModeId_fkey" FOREIGN KEY ("focusModeId") REFERENCES public.focus_modes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: performance_metrics performance_metrics_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT "performance_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: performance_metrics performance_metrics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT "performance_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: precise_goals precise_goals_stream_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.precise_goals
    ADD CONSTRAINT precise_goals_stream_id_fkey FOREIGN KEY (stream_id) REFERENCES public.streams(id) ON DELETE SET NULL;


--
-- Name: processing_rules processing_rules_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processing_rules
    ADD CONSTRAINT "processing_rules_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: processing_rules processing_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processing_rules
    ADD CONSTRAINT "processing_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: processing_rules processing_rules_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processing_rules
    ADD CONSTRAINT "processing_rules_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_dependencies project_dependencies_dependentProjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_dependencies
    ADD CONSTRAINT "project_dependencies_dependentProjectId_fkey" FOREIGN KEY ("dependentProjectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_dependencies project_dependencies_sourceProjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_dependencies
    ADD CONSTRAINT "project_dependencies_sourceProjectId_fkey" FOREIGN KEY ("sourceProjectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_areaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES public.areas_of_responsibility(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: projects projects_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: projects projects_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: projects projects_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: projects projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recommendations recommendations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT "recommendations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recurring_tasks recurring_tasks_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recurring_tasks recurring_tasks_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT "recurring_tasks_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scheduled_tasks scheduled_tasks_energyTimeBlockId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_tasks
    ADD CONSTRAINT "scheduled_tasks_energyTimeBlockId_fkey" FOREIGN KEY ("energyTimeBlockId") REFERENCES public.energy_time_blocks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scheduled_tasks scheduled_tasks_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_tasks
    ADD CONSTRAINT "scheduled_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scheduled_tasks scheduled_tasks_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_tasks
    ADD CONSTRAINT "scheduled_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_tasks scheduled_tasks_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_tasks
    ADD CONSTRAINT "scheduled_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: search_index search_index_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_index
    ADD CONSTRAINT "search_index_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: services services_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: smart_analysis_details smart_analysis_details_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_analysis_details
    ADD CONSTRAINT "smart_analysis_details_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_analysis_details smart_analysis_details_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_analysis_details
    ADD CONSTRAINT "smart_analysis_details_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_improvements smart_improvements_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_improvements
    ADD CONSTRAINT "smart_improvements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_improvements smart_improvements_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_improvements
    ADD CONSTRAINT "smart_improvements_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_mailbox_rules smart_mailbox_rules_mailboxId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_mailbox_rules
    ADD CONSTRAINT "smart_mailbox_rules_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES public.smart_mailboxes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: smart_mailboxes smart_mailboxes_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_mailboxes
    ADD CONSTRAINT "smart_mailboxes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: smart_mailboxes smart_mailboxes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_mailboxes
    ADD CONSTRAINT "smart_mailboxes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart smart_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart
    ADD CONSTRAINT "smart_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: smart_templates smart_templates_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_templates
    ADD CONSTRAINT "smart_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: someday_maybe someday_maybe_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.someday_maybe
    ADD CONSTRAINT "someday_maybe_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: someday_maybe someday_maybe_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.someday_maybe
    ADD CONSTRAINT "someday_maybe_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sprints sprints_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT "sprints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_access_logs stream_access_logs_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_access_logs stream_access_logs_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.stream_permissions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stream_access_logs stream_access_logs_relationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES public.stream_relations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stream_access_logs stream_access_logs_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_access_logs stream_access_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_access_logs
    ADD CONSTRAINT "stream_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_channels stream_channels_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_channels
    ADD CONSTRAINT "stream_channels_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_channels stream_channels_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_channels
    ADD CONSTRAINT "stream_channels_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_permissions stream_permissions_grantedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stream_permissions stream_permissions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_permissions stream_permissions_relationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES public.stream_relations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_permissions stream_permissions_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_permissions stream_permissions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_permissions
    ADD CONSTRAINT "stream_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_relations stream_relations_childId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT "stream_relations_childId_fkey" FOREIGN KEY ("childId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_relations stream_relations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT "stream_relations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stream_relations stream_relations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT "stream_relations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stream_relations stream_relations_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream_relations
    ADD CONSTRAINT "stream_relations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: streams streams_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT "streams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: streams streams_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT "streams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tags tags_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "tags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_dependencies task_dependencies_predecessorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT "task_dependencies_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_dependencies task_dependencies_successorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT "task_dependencies_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_history task_history_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT "task_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_relationships task_relationships_fromTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_relationships
    ADD CONSTRAINT "task_relationships_fromTaskId_fkey" FOREIGN KEY ("fromTaskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_relationships task_relationships_toTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_relationships
    ADD CONSTRAINT "task_relationships_toTaskId_fkey" FOREIGN KEY ("toTaskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_contextId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES public.contexts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tasks tasks_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_sprintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES public.sprints(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: template_applications template_applications_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_applications
    ADD CONSTRAINT "template_applications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: template_applications template_applications_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_applications
    ADD CONSTRAINT "template_applications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.day_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: template_applications template_applications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_applications
    ADD CONSTRAINT "template_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: timeline timeline_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline
    ADD CONSTRAINT "timeline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: timeline timeline_streamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline
    ADD CONSTRAINT "timeline_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: unified_rule_executions unified_rule_executions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unified_rule_executions
    ADD CONSTRAINT "unified_rule_executions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unified_rule_executions unified_rule_executions_ruleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unified_rule_executions
    ADD CONSTRAINT "unified_rule_executions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES public.unified_rules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unified_rules unified_rules_aiModelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unified_rules
    ADD CONSTRAINT "unified_rules_aiModelId_fkey" FOREIGN KEY ("aiModelId") REFERENCES public.ai_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: unified_rules unified_rules_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unified_rules
    ADD CONSTRAINT "unified_rules_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.communication_channels(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: unified_rules unified_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unified_rules
    ADD CONSTRAINT "unified_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unimportant unimportant_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unimportant
    ADD CONSTRAINT "unimportant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_access_logs user_access_logs_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT "user_access_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_access_logs user_access_logs_relationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT "user_access_logs_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES public.user_relations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_access_logs user_access_logs_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT "user_access_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_access_logs user_access_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_access_logs
    ADD CONSTRAINT "user_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_ai_patterns user_ai_patterns_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ai_patterns
    ADD CONSTRAINT user_ai_patterns_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_ai_patterns user_ai_patterns_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ai_patterns
    ADD CONSTRAINT user_ai_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_patterns user_patterns_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_patterns
    ADD CONSTRAINT "user_patterns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_patterns user_patterns_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_patterns
    ADD CONSTRAINT "user_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_grantedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_permissions user_permissions_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_relationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES public.user_relations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "user_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_relations user_relations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT "user_relations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_relations user_relations_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT "user_relations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_relations user_relations_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT "user_relations_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_relations user_relations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_relations
    ADD CONSTRAINT "user_relations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_view_preferences user_view_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_view_preferences
    ADD CONSTRAINT "user_view_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_cache vector_cache_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vector_cache
    ADD CONSTRAINT "vector_cache_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_documents vector_documents_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vector_documents
    ADD CONSTRAINT "vector_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_search_results vector_search_results_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vector_search_results
    ADD CONSTRAINT "vector_search_results_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.vector_documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_search_results vector_search_results_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vector_search_results
    ADD CONSTRAINT "vector_search_results_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vector_search_results vector_search_results_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vector_search_results
    ADD CONSTRAINT "vector_search_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: verification_tokens verification_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: view_analytics view_analytics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_analytics
    ADD CONSTRAINT "view_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: view_configurations view_configurations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_configurations
    ADD CONSTRAINT "view_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: waiting_for waiting_for_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waiting_for
    ADD CONSTRAINT "waiting_for_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: waiting_for waiting_for_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waiting_for
    ADD CONSTRAINT "waiting_for_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: waiting_for waiting_for_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waiting_for
    ADD CONSTRAINT "waiting_for_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: weekly_reviews weekly_reviews_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_reviews
    ADD CONSTRAINT "weekly_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_categories wiki_categories_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_categories
    ADD CONSTRAINT "wiki_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_page_links wiki_page_links_sourcePageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_page_links
    ADD CONSTRAINT "wiki_page_links_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES public.wiki_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_page_links wiki_page_links_targetPageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_page_links
    ADD CONSTRAINT "wiki_page_links_targetPageId_fkey" FOREIGN KEY ("targetPageId") REFERENCES public.wiki_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_pages wiki_pages_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT "wiki_pages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_pages wiki_pages_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT "wiki_pages_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.wiki_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: wiki_pages wiki_pages_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT "wiki_pages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wiki_pages wiki_pages_parentPageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT "wiki_pages_parentPageId_fkey" FOREIGN KEY ("parentPageId") REFERENCES public.wiki_pages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: companies companies_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY companies_org_isolation ON public.companies TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts contacts_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY contacts_org_isolation ON public.contacts TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- Name: contexts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contexts ENABLE ROW LEVEL SECURITY;

--
-- Name: contexts contexts_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY contexts_org_isolation ON public.contexts TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- Name: deals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

--
-- Name: deals deals_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY deals_org_isolation ON public.deals TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- Name: meetings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

--
-- Name: meetings meetings_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY meetings_org_isolation ON public.meetings TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations organizations_member_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organizations_member_access ON public.organizations TO app_user USING ((id = current_setting('app.current_org_id'::text, true)));


--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: projects projects_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY projects_org_isolation ON public.projects TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- Name: streams; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

--
-- Name: streams streams_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY streams_org_isolation ON public.streams TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions subscriptions_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY subscriptions_org_isolation ON public.subscriptions TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks tasks_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tasks_org_isolation ON public.tasks TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_org_isolation ON public.users TO app_user USING (("organizationId" = current_setting('app.current_org_id'::text, true)));


--
-- PostgreSQL database dump complete
--

\unrestrict CrQEY39NdjrE1kk44qdc784ShgcDQE4aXdRcwIMqTvRS41RodOplbUy53Q0GZgX

