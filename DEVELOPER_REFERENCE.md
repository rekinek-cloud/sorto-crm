# Sorto CRM - Developer Reference

> Auto-generated: 2026-02-10
> Stack: Next.js 14 + Node.js/Express + PostgreSQL (pgvector) + Redis
> URL: https://crm.dev.sorto.ai
> DB: `crm_gtd_prod` | Container: `crm-postgres`

---

## 1. Frontend Pages (94 routes)

All paths are relative to `/dashboard`. Icons from `@phosphor-icons/react`.

### MAIN
| Page | Path | Icon |
|------|------|------|
| Pulpit | `/dashboard` | House |

### STREAMS CORE
| Page | Path | Icon |
|------|------|------|
| Zrodlo | `/dashboard/source` | CircleDashed |
| Wszystkie strumienie | `/dashboard/streams` | Waves |
| Mapa strumieni | `/dashboard/streams-map` | TreeStructure |
| Zamrozone | `/dashboard/streams/frozen` | Snowflake |
| Zadania | `/dashboard/tasks` | CheckSquare |
| Wszystkie projekty | `/dashboard/projects` | Folder |
| Zaleznosci | `/dashboard/project-dependencies` | GitFork |
| Kalendarz | `/dashboard/calendar` | Calendar |
| Cele | `/dashboard/goals` | Target |
| Szablony SMART | `/dashboard/smart-templates` | ListPlus |
| Ulepszenia SMART | `/dashboard/smart-improvements` | TrendUp |
| Analiza SMART | `/dashboard/smart-analysis` | ChartLine |

### CRM
| Page | Path | Icon |
|------|------|------|
| Firmy | `/dashboard/companies` | Buildings |
| Kontakty | `/dashboard/contacts` | Users |
| Leady | `/dashboard/leads` | UserPlus |
| Pipeline | `/dashboard/pipeline` | Funnel |
| Transakcje | `/dashboard/deals` | Handshake |
| Pipeline Analytics | `/dashboard/analytics/pipeline` | ChartLine |

### SPRZEDAZ
| Page | Path | Icon |
|------|------|------|
| Produkty | `/dashboard/products` | Package |
| Uslugi | `/dashboard/services` | Wrench |
| Oferty | `/dashboard/offers` | FileText |
| Zamowienia | `/dashboard/orders` | ShoppingCart |
| Faktury | `/dashboard/invoices` | Receipt |
| Reklamacje | `/dashboard/complaints` | WarningCircle |

### KOMUNIKACJA
| Page | Path | Icon |
|------|------|------|
| Skrzynki | `/dashboard/smart-mailboxes` | Tray |
| Kanaly | `/dashboard/communication/channels` | ChatCircle |
| Napisz email | `/dashboard/modern-email` | PencilSimple |
| Filtry email | `/dashboard/communication/email-filters` | FunnelSimple |
| Reguly komunikacji | `/dashboard/communication/rules-manager` | ListChecks |
| Auto-odpowiedzi | `/dashboard/auto-replies` | EnvelopeSimple |
| Pipeline email | `/dashboard/email-pipeline` | Kanban |
| Analiza email | `/dashboard/email-analysis` | ChartBar |
| Spotkania | `/dashboard/meetings` | VideoCamera |

### PRZEGLADY
| Page | Path | Icon |
|------|------|------|
| Produktywnosc | `/dashboard/productivity` | ChartLine |
| Tygodniowy | `/dashboard/reviews/weekly` | CalendarBlank |
| Miesieczny | `/dashboard/reviews/monthly` | Calendar |
| Kwartalny | `/dashboard/reviews/quarterly` | CalendarCheck |

### AI & NARZEDZIA
| Page | Path | Icon |
|------|------|------|
| AI Assistant | `/dashboard/ai-assistant` | Robot |
| AI Insights | `/dashboard/ai-insights` | Sparkle |
| Prompty AI | `/dashboard/ai-prompts` | ChatCircle |
| Zarzadzanie AI | `/dashboard/ai-management` | Brain |
| Reguly AI | `/dashboard/ai-rules` | Sparkle |
| Wyszukiwanie AI | `/dashboard/search` | MagnifyingGlass |
| RAG Search | `/dashboard/rag-search` | MagnifyingGlassMinus |
| Rekomendacje | `/dashboard/recommendations` | Lightbulb |
| Voice TTS | `/dashboard/voice` | Microphone |
| Graf relacji | `/dashboard/graph` | Graph |
| Reguly uniwersalne | `/dashboard/universal-rules` | FlowArrow |
| AI Chat (Qwen) | `/dashboard/ai-chat` | ChatCircle |
| Gemini | `/dashboard/gemini` | Sparkle |
| RAG | `/dashboard/rag` | Database |
| Voice Assistant | `/dashboard/voice-assistant` | Microphone |
| Voice RAG | `/dashboard/voice-rag` | Microphone |
| Universal Search | `/dashboard/universal-search` | MagnifyingGlass |
| Flow Engine | `/dashboard/flow` | FlowArrow |
| Flow Conversation | `/dashboard/flow/conversation` | ChatCircle |

### ORGANIZACJA
| Page | Path | Icon |
|------|------|------|
| Tagi | `/dashboard/tags` | Tag |
| Konteksty GTD | `/dashboard/contexts` | At |
| Nawyki | `/dashboard/habits` | Lightning |
| Zadania cykliczne | `/dashboard/recurring-tasks` | ArrowsClockwise |
| Delegowane | `/dashboard/delegated` | UserSwitch |
| Obszary | `/dashboard/areas` | Stack |
| Szablony | `/dashboard/templates` | Article |

### WIEDZA
| Page | Path | Icon |
|------|------|------|
| Baza wiedzy | `/dashboard/knowledge-base` | BookOpen |
| Dokumenty | `/dashboard/knowledge` | Files |
| Status wiedzy | `/dashboard/knowledge-status` | Database |
| Pliki | `/dashboard/files` | Folder |

### ANALITYKA
| Page | Path | Icon |
|------|------|------|
| Dashboard | `/dashboard/analytics` | ChartBar |
| Analiza | `/dashboard/analysis` | ChartLine |
| Raporty | `/dashboard/reports` | ClipboardText |
| Timeline | `/dashboard/timeline` | Timer |
| Historia zadan | `/dashboard/task-history` | ClockCounterClockwise |
| Relacje zadan | `/dashboard/task-relationships` | GitBranch |

### ZESPOL
| Page | Path | Icon |
|------|------|------|
| Czlonkowie | `/dashboard/team` | UsersThree |
| Uzytkownicy | `/dashboard/users` | Users |
| Hierarchia | `/dashboard/team/hierarchy` | TreeStructure |

### USTAWIENIA
| Page | Path | Icon |
|------|------|------|
| Profil | `/dashboard/settings/profile` | Users |
| Organizacja | `/dashboard/settings/organization` | Buildings |
| Branding | `/dashboard/settings/branding` | Palette |
| Pola niestandardowe | `/dashboard/settings/custom-fields` | Sliders |
| Konta email | `/dashboard/email-accounts` | At |
| Integracje | `/dashboard/settings/integrations` | Lightning |
| Platnosci | `/dashboard/billing` | CreditCard |
| Moduly | `/dashboard/modules` | Cube |
| Metadane | `/dashboard/metadata` | Table |

### ADMINISTRACJA
| Page | Path | Icon |
|------|------|------|
| Infrastruktura | `/dashboard/infrastructure` | HardDrives |
| Klucze MCP | `/dashboard/admin/mcp-keys` | Key |
| Konfiguracja AI | `/dashboard/admin/ai-config` | Sliders |
| Zgloszenia bledow | `/dashboard/admin/bug-reports` | Bug |
| Informacje | `/dashboard/info` | Info |

### SORTO (Internal)
| Page | Path | Icon |
|------|------|------|
| Coding Center | `/dashboard/coding-center` | Terminal |
| AI Conversations | `/dashboard/ai-sync` | ChatCircle |
| Dev Hub | `/dashboard/admin/dev-hub` | HardDrives |

---

## 2. Backend API Routes

Base URL: `https://crm.dev.sorto.ai/api/v1/`
Auth: Bearer token via `Authorization` header or `access_token` cookie.

### Active Routes (80)
| API Path | Route File | Description |
|----------|------------|-------------|
| `/auth` | `modules/auth/routes` | Login, register, SSO, token refresh |
| `/organizations` | `modules/organizations/routes` | Organization CRUD |
| `/tasks` | `routes/tasks` | Task management |
| `/projects` | `routes/projects` | Project management |
| `/contexts` | `routes/contexts` | GTD contexts |
| `/companies` | `routes/companies` | Company CRM |
| `/contacts` | `routes/contacts` | Contact CRM |
| `/deals` | `routes/deals` | Deal/transaction CRM |
| `/streams` | `routes/streams` | Stream management |
| `/smart` | `routes/smart` | SMART goal analysis |
| `/communication` | `routes/communication` | Communication hub |
| `/communications` | `routes/communications` | Communication channels |
| `/gtd` | `routes/gtd` | GTD methodology |
| `/gtd-streams` | `routes/gtdStreams` | GTD streams |
| `/analysis` | `routes/analysis` | Data analysis |
| `/dashboard` | `routes/dashboard` | Dashboard stats |
| `/ai` | `routes/ai` | AI features (v1) |
| `/ai-assistant` | `routes/aiAssistant` | AI assistant |
| `/knowledge` | `routes/knowledge` | Knowledge/documents |
| `/areas` | `routes/areas` | Areas of responsibility |
| `/habits` | `routes/habits` | Habit tracking |
| `/meetings` | `routes/meetings` | Meeting management |
| `/delegated` | `routes/delegated` | Delegated tasks |
| `/recurring-tasks` | `routes/recurring` | Recurring tasks |
| `/tags` | `routes/tags` | Tag system |
| `/timeline` | `routes/timeline` | Activity timeline |
| `/errors` | `routes/errors` | Frontend error logging |
| `/products` | `routes/products` | Product catalog |
| `/services` | `routes/services` | Service catalog |
| `/offers` | `routes/offers` | Sales offers |
| `/invoices` | `routes/invoices` | Invoice management |
| `/orders` | `routes/orders` | Order management |
| `/calendar` | `routes/calendar` | Calendar view |
| `/admin/ai-config` | `routes/aiConfig` | AI provider config |
| `/ai/prompts` | `routes/aiPrompts` | AI prompt templates |
| `/ai-knowledge` | `routes/aiKnowledge` | AI knowledge base |
| `/ai-insights` | `routes/aiInsights` | AI insights engine |
| `/vector-search` | `routes/vectorSearch` | Vector search |
| `/flow` | `routes/flow` | Flow engine |
| `/flow/conversation` | `routes/flowConversation` | Flow conversations |
| `/user-hierarchy` | `routes/userHierarchy` | User hierarchy |
| `/internal` | `routes/internal` | Internal endpoints |
| `/users` | `routes/users` | User management |
| `/industries` | `routes/industries` | Industry templates |
| `/dev-hub` | `routes/devHub` | Dev hub tools |
| `/infrastructure` | `routes/infrastructure` | Docker/infra status |
| `/ai-sync` | `routes/aiSync` | AI conversation sync |
| `/coding-center` | `routes/codingCenter` | Coding center |
| `/ai-chat` | `routes/aiChat` | AI chat (Qwen) |
| `/rag` | `routes/rag` | RAG pipeline |
| `/gemini` | `routes/gemini` | Gemini API |
| `/unified-rules` | `routes/unifiedRules` | Unified AI rules |
| `/search` | `routes/search` | Full-text search |
| `/leads` | `routes/leads` | Lead management |
| `/custom-fields` | `routes/customFields` | Custom field definitions |
| `/branding` | `routes/branding` | Org branding |
| `/billing` | `routes/billing` | Billing/subscription |
| `/email-accounts` | `routes/emailAccounts` | Email account config |
| `/auto-replies` | `routes/autoReplies` | Auto-reply rules |
| `/pipeline-analytics` | `routes/pipelineAnalytics` | Pipeline analytics |
| `/graph` | `routes/graph` | Relationship graph |
| `/real-vector-search` | `routes/realVectorSearch` | pgvector search |
| `/voice` | `routes/voice-simple` | Voice TTS |
| `/admin/bug-reports` | `routes/bugReports` | Bug report admin |
| `/ai-rules` | `routes/aiRules` | AI rules |
| `/weekly-review` | `routes/weeklyReview` | Weekly reviews |
| `/weekly-reviews` | `routes/weeklyReview` | Weekly reviews (alias) |
| `/stream-hierarchy` | `routes/streamHierarchy` | Stream hierarchy |
| `/stream-access` | `routes/streamAccess` | Stream permissions |
| `/source` | `routes/source` | Source/inbox |
| `/streams-map` | `routes/streamsMap` | Stream map view |
| `/horizons` | `routes/goals` | Goals (legacy alias) |
| `/goals` | `routes/preciseGoals` | Precise goals |
| `/precise-goals` | `routes/preciseGoals` | Precise goals (alias) |
| `/day-planner` | `routes/dayPlanner` | Day planner |
| `/mailboxes` | `routes/smartMailboxes` | Smart mailboxes (alias) |
| `/smart-mailboxes` | `routes/smartMailboxes` | Smart mailboxes |

### Legacy Aliases (camelCase -> kebab-case)
| Legacy Path | Maps To |
|-------------|---------|
| `/gtdinbox` | `/source` |
| `/gtdmapviews` | `/streams-map` |
| `/gtdhorizons` | `/horizons` |
| `/smartdayplanner` | `/day-planner` |
| `/smartmailboxes` | `/smart-mailboxes` |

### Disabled Routes (commented out in app.ts)
| API Path | Route File | Reason |
|----------|------------|--------|
| `/ai-v2` | `routes/aiV2` | Not needed |
| `/universal-rules` | `routes/universalRules` | Not needed |
| `/modern-email` | `routes/modernEmail` | Requires `@sendgrid/mail` (not installed) |
| `/files` | `routes/files` | Frontend uses mock data |

---

## 3. Prisma Schema - All Models

Database: PostgreSQL with pgvector extension.
Schema file: `packages/backend/prisma/schema.prisma`

### Core Models
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| Organization | `organizations` | 23 | users, streams, tasks, projects, companies, contacts, deals |
| User | `users` | 35 | organization, tasks, projects, streams, meetings |
| RefreshToken | `refresh_tokens` | 4 | user |
| VerificationToken | `verification_tokens` | 4 | user |
| Subscription | `subscriptions` | 7 | organization |

### Streams & Tasks
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| Stream | `streams` | 26 | organization, createdBy, tasks, projects, inboxItems |
| Task | `tasks` | 32 | organization, assignedTo, createdBy, project, stream, context |
| Project | `projects` | 19 | organization, assignedTo, createdBy, stream, tasks |
| Context | `contexts` | 6 | organization, tasks |
| InboxItem | `inbox_items` | 22 | organization, capturedBy, stream, task, project |
| TaskRelationship | `task_relationships` | 7 | fromTask, toTask |
| TaskHistory | `task_history` | 7 | task |
| RecurringTask | `recurring_tasks` | 12 | organization, users, projects, streams |
| DelegatedTask | `delegated_tasks` | 9 | organization, task |
| WaitingFor | `waiting_for` | 9 | createdBy, organization, task |
| SomedayMaybe | `someday_maybe` | 8 | createdBy, organization |
| Timeline | `timeline` | 8 | organization, stream |

### Stream Relations & Permissions
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| stream_relations | `stream_relations` | 10 | parentStream, childStream, user, organization |
| stream_permissions | `stream_permissions` | 9 | user, grantedBy, stream, organization |
| stream_access_logs | `stream_access_logs` | 11 | user, stream, organization |
| StreamChannel | `stream_channels` | 5 | channel, stream |

### CRM
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| Contact | `contacts` | 13 | organization, assignedCompany, meetings, offers |
| Company | `companies` | 13 | organization, primaryContact, deals, contacts |
| Deal | `deals` | 10 | organization, company, owner, offers |
| Lead | `leads` | 9 | organization |
| Meeting | `meetings` | 9 | organization, contact, organizedBy |
| activities | `activities` | 11 | companies, contacts, deals, meetings, projects, tasks, users |

### Sales
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| Product | `products` | 15 | organization, offerItems, orderItems, invoiceItems |
| Service | `services` | 16 | organization, offerItems, orderItems, invoiceItems |
| Offer | `offers` | 13 | organization, company, contact, deal, items |
| OfferItem | `offer_items` | 10 | offer, product, service |
| Order | `orders` | 18 | organization, items |
| OrderItem | `order_items` | 9 | order, product, service |
| Invoice | `invoices` | 18 | organization, items |
| InvoiceItem | `invoice_items` | 9 | invoice, product, service |
| Complaint | `complaints` | 9 | organization |

### Communication
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| CommunicationChannel | `communication_channels` | 13 | organization, user, messages, autoReplies, unified_rules |
| Message | `messages` | 20 | channel, organization, stream, task, contact, company, deal |
| MessageAttachment | `message_attachments` | 8 | message |
| ProcessingRule | `processing_rules` | 8 | channel, organization |
| MessageProcessingResult | `message_processing_results` | 8 | message, rule |
| AutoReply | `auto_replies` | 10 | channel, organization |
| email_accounts | `email_accounts` | 14 | organization, user, messages |
| email_rules | `email_rules` | 12 | organization |
| email_templates | `email_templates` | 11 | user, organization |
| email_logs | `email_logs` | 11 | organization, user |
| EmailAnalysis | `email_analysis` | 11 | organization |
| smart_mailboxes | `smart_mailboxes` | 11 | organization, user, smart_mailbox_rules |
| smart_mailbox_rules | `smart_mailbox_rules` | 8 | mailbox |

### AI & Rules
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| ai_models | `ai_models` | 9 | ai_providers, ai_executions, ai_rules, unified_rules |
| ai_providers | `ai_providers` | 8 | organization, ai_models, ai_executions |
| ai_rules | `ai_rules` | 11 | organization, ai_models, ai_prompt_templates |
| ai_executions | `ai_executions` | 11 | organization, ai_models, ai_providers, ai_rules |
| ai_prompt_templates | `ai_prompt_templates` | 14 | organization, ai_models, createdBy, versions, overrides |
| ai_prompt_versions | `ai_prompt_versions` | 7 | prompt, changedBy |
| ai_prompt_overrides | `ai_prompt_overrides` | 6 | prompt, organization |
| ai_suggestions | `ai_suggestions` | 8 | organization, user |
| ai_usage_stats | `ai_usage_stats` | 8 | organization |
| ai_knowledge_bases | `ai_knowledge_bases` | 7 | organization, ai_knowledge_documents |
| ai_knowledge_documents | `ai_knowledge_documents` | 7 | ai_knowledge_bases |
| ai_predictions | `ai_predictions` | 7 | (standalone) |
| unified_rules | `unified_rules` | 14 | organization, ai_models, communication_channels |
| unified_rule_executions | `unified_rule_executions` | 7 | organization, unified_rules |

### AI Conversations & Sync
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| AiConversation | `ai_conversations` | 13 | organization, stream, messages, chunks |
| AiConversationMessage | `ai_conversation_messages` | 8 | conversation |
| AiConversationChunk | `ai_conversation_chunks` | 6 | conversation |
| AiSyncStatus | `ai_sync_status` | 9 | organization |
| AiAppMapping | `ai_app_mappings` | 8 | organization |

### Agent System
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| agent_conversations | `agent_conversations` | 8 | organization, user, agent_actions, agent_messages |
| agent_messages | `agent_messages` | 5 | agent_conversations, agent_feedback |
| agent_actions | `agent_actions` | 8 | agent_conversations, organization, user |
| agent_feedback | `agent_feedback` | 5 | agent_messages, user |
| agent_suggestions | `agent_suggestions` | 7 | organization, user |
| agent_analytics | `agent_analytics` | 5 | organization, user |
| agent_context_cache | `agent_context_cache` | 5 | organization, user |
| agent_learning | `agent_learning` | 6 | organization, user |
| agent_proactive_tasks | `agent_proactive_tasks` | 8 | organization, user |

### Flow Engine
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| flow_conversations | `flow_conversations` | 13 | organization, user, inboxItem, proposedStream, finalStream |
| flow_conversation_messages | `flow_conversation_messages` | 5 | conversation |
| flow_learned_patterns | `flow_learned_patterns` | 11 | organization, user, learnedStream |
| flow_automation_rules | `flow_automation_rules` | 13 | organization, user, targetStream, targetProject |
| flow_processing_history | `flow_processing_history` | 11 | organization, user |

### Knowledge & Documents
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| Document | `documents` | 13 | organization, author, folder, comments, shares |
| Folder | `folders` | 8 | organization, parent, children, documents |
| DocumentLink | `document_links` | 7 | sourceDocument, targetDocument |
| DocumentComment | `document_comments` | 8 | author, document, parent, replies |
| DocumentShare | `document_shares` | 7 | document, sharedBy, sharedWith |
| WikiPage | `wiki_pages` | 12 | organization, author, category, parentPage |
| WikiCategory | `wiki_categories` | 8 | organization, pages |
| WikiPageLink | `wiki_page_links` | 6 | sourcePage, targetPage |
| KnowledgeBase | `knowledge_base` | 7 | organization |
| File | `files` | 8 | organization |

### Search & Vectors
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| SearchIndex | `search_index` | 8 | organization |
| vector_documents | `vector_documents` | 11 | organization, vector_search_results |
| vector_search_results | `vector_search_results` | 9 | vector_documents, organization, user |
| vector_cache | `vector_cache` | 9 | organization |
| vectors | `vectors` | 5 | (standalone, pgvector) |

### User Management
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| user_profiles | `user_profiles` | 12 | organization, user, day_templates |
| user_relations | `user_relations` | 9 | employee, manager, createdBy, organization |
| user_permissions | `user_permissions` | 8 | user, organization, user_relations |
| user_access_logs | `user_access_logs` | 10 | user, targetUser, organization |
| user_ai_patterns | `user_ai_patterns` | 8 | organization, user |
| user_patterns | `user_patterns` | 11 | organization, user |
| user_view_preferences | `user_view_preferences` | 5 | user |
| view_configurations | `view_configurations` | 7 | user, kanban_columns |
| view_analytics | `view_analytics` | 6 | user |

### GTD & Productivity
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| GTDBucket | `gtd_buckets` | 6 | organization |
| GTDHorizon | `gtd_horizons` | 7 | organization |
| AreaOfResponsibility | `areas_of_responsibility` | 10 | organization, users, projects |
| Habit | `habits` | 7 | organization, entries |
| HabitEntry | `habit_entries` | 6 | habit |
| WeeklyReview | `weekly_reviews` | 12 | organization |
| FocusMode | `focus_modes` | 8 | organization, energy_time_blocks |
| Recommendation | `recommendations` | 7 | organization |
| SMARTTemplate | `smart_templates` | 9 | organization |
| SMARTAnalysisDetail | `smart_analysis_details` | 10 | project, task |
| SMARTImprovement | `smart_improvements` | 8 | project, task |
| precise_goals | `precise_goals` | 11 | stream |
| next_actions | `next_actions` | 15 | assignedTo, createdBy, organization, project, stream, task |

### Energy & Scheduling
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| energy_analytics | `energy_analytics` | 11 | organization, user, energy_time_blocks |
| energy_patterns | `energy_patterns` | 12 | organization, user |
| energy_time_blocks | `energy_time_blocks` | 14 | organization, user, energy_analytics, focus_modes |
| scheduled_tasks | `scheduled_tasks` | 13 | organization, task, user, energy_time_blocks |
| day_templates | `day_templates` | 14 | organization, user, user_profiles, template_applications |
| break_templates | `break_templates` | 9 | organization, user |
| template_applications | `template_applications` | 8 | organization, day_templates, user |
| context_priorities | `context_priorities` | 9 | organization, user |
| performance_metrics | `performance_metrics` | 23 | organization, user, focus_modes |
| sprints | `sprints` | 8 | organization, tasks |
| kanban_columns | `kanban_columns` | 8 | view_configurations |

### Platform & Modules
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| platformModule | `platform_modules` | 13 | organizationModules, ssoTokens, platformEvents |
| organizationModule | `organization_modules` | 6 | organization, module |
| ssoToken | `sso_tokens` | 10 | module |
| platformEvent | `platform_events` | 10 | module |
| IndustryTemplate | `industry_templates` | 10 | (standalone) |

### Other
| Model | Table | Fields | Key Relations |
|-------|-------|--------|---------------|
| ErrorLog | `error_logs` | 11 | organization, user |
| bug_reports | `bug_reports` | 13 | organization, user |
| Info | `info` | 7 | organization |
| Unimportant | `unimportant` | 7 | organization |
| Completeness | `completeness` | 7 | project, task |
| Smart | `smart` | 8 | task |
| Dependency | `dependencies` | 7 | (standalone) |
| Metadata | `metadata` | 7 | (standalone) |
| ProjectDependency | `project_dependencies` | 6 | dependentProject, sourceProject |
| CriticalPath | `critical_path` | 7 | project |
| task_dependencies | `task_dependencies` | 4 | predecessor, successor |

---

## 4. Key Enums

| Enum | Values |
|------|--------|
| Role | `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER` |
| TaskStatus | `INBOX`, `NEXT_ACTION`, `WAITING_FOR`, `SOMEDAY_MAYBE`, `SCHEDULED`, `IN_PROGRESS`, `DONE`, `CANCELLED` |
| Priority | `URGENT_IMPORTANT`, `IMPORTANT`, `URGENT`, `NORMAL`, `LOW`, `NONE` |
| DealStage | `PROSPECT`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST` |
| StreamStatus | `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`, `FROZEN` |
| ProjectStatus | `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED` |
| MeetingStatus | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`, `RESCHEDULED` |
| AutoReplyStatus | `ACTIVE`, `INACTIVE` |
| BugReportStatus | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `WONT_FIX` |
| BugSeverity | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| EmailProvider | `GMAIL`, `OUTLOOK`, `IMAP`, `SMTP` |
| EmailAccountStatus | `ACTIVE`, `INACTIVE`, `ERROR`, `SYNCING` |
| CustomFieldType | `TEXT`, `TEXTAREA`, `NUMBER`, `CURRENCY`, `DATE`, `DATETIME`, `BOOLEAN`, `SELECT`, `MULTISELECT`, `URL`, `EMAIL`, `PHONE`, `FILE`, `USER`, `CONTACT`, `COMPANY` |
| EntityType | `CONTACT`, `COMPANY`, `DEAL`, `TASK`, `PROJECT` |

---

## 5. Architecture Notes

### Database Connection
- Singleton PrismaClient: `packages/backend/src/config/database.ts`
- All route files import: `import { prisma } from '../config/database'`
- PostgreSQL max_connections: 100
- Redis: optional (app works without it)

### Authentication
- JWT tokens (15 min expiry)
- Refresh tokens stored in DB
- Middleware: `authenticateToken` from `shared/middleware/auth.ts`
- SSO support via platform modules

### Multi-tenancy
- All queries scoped by `organizationId`
- Row Level Security (RLS) available but optional
- TenantPrismaClient in `config/database.ts` for raw queries

### Deploy
```bash
# Via MCP dev-hub tool:
mcp__dev-hub__deploy_application(app: "sorto-crm")

# Manual:
cd /home/dev/apps/sorto-crm
git pull && docker compose up --build -d
```

### E2E Tests
```bash
cd packages/frontend
# Get token
TOKEN=$(curl -s -X POST https://crm.dev.sorto.ai/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.com","password":"demo123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

# Run all 94 page health checks
TEST_TOKEN="$TOKEN" npx playwright test e2e/all-pages-health.spec.ts --workers=8
```
