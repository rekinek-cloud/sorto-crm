-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE "AgentActionType" AS ENUM ('CREATE_TASK', 'UPDATE_TASK', 'CREATE_PROJECT', 'UPDATE_DEAL', 'SEND_EMAIL', 'SCHEDULE_MEETING', 'CREATE_DOCUMENT', 'ADD_CONTACT', 'SEARCH_DATA', 'GENERATE_REPORT', 'CUSTOM');
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "FeedbackType" AS ENUM ('HELPFUL', 'NOT_HELPFUL', 'INCORRECT', 'INCOMPLETE', 'EXCELLENT');
CREATE TYPE "LearningType" AS ENUM ('USER_PREFERENCE', 'WORK_PATTERN', 'COMMUNICATION_STYLE', 'PRIORITY_PATTERN', 'TIME_PATTERN', 'QUERY_PATTERN');
CREATE TYPE "SuggestionType" AS ENUM ('TASK_OPTIMIZATION', 'DEADLINE_WARNING', 'FOLLOW_UP_REMINDER', 'PROCESS_IMPROVEMENT', 'DATA_INSIGHT', 'RISK_ALERT', 'OPPORTUNITY');
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'VIEWED', 'ACCEPTED', 'DISMISSED', 'EXPIRED');
CREATE TYPE "ProactiveTaskType" AS ENUM ('MORNING_BRIEFING', 'DEADLINE_CHECK', 'FOLLOW_UP_REMINDER', 'RISK_DETECTION', 'OPPORTUNITY_ALERT', 'WEEKLY_SUMMARY', 'DATA_SYNC', 'CUSTOM');
CREATE TYPE "AgentTaskStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "agent_conversations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "intent" JSONB,
    "context" JSONB,
    "sources" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_actions" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" "AgentActionType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "result" JSONB,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_feedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_learning" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningType" "LearningType" NOT NULL,
    "pattern" JSONB NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_learning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_suggestions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "suggestionType" "SuggestionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionable" JSONB,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "dismissedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_analytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_context_cache" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "cacheData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_context_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_proactive_tasks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskType" "ProactiveTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "triggerCondition" JSONB NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "status" "AgentTaskStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_proactive_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_conversations_organizationId_userId_idx" ON "agent_conversations"("organizationId", "userId");
CREATE INDEX "agent_conversations_lastMessageAt_idx" ON "agent_conversations"("lastMessageAt");
CREATE INDEX "agent_messages_conversationId_createdAt_idx" ON "agent_messages"("conversationId", "createdAt");
CREATE INDEX "agent_actions_organizationId_userId_idx" ON "agent_actions"("organizationId", "userId");
CREATE INDEX "agent_actions_actionType_status_idx" ON "agent_actions"("actionType", "status");
CREATE UNIQUE INDEX "agent_feedback_messageId_key" ON "agent_feedback"("messageId");
CREATE INDEX "agent_feedback_userId_feedbackType_idx" ON "agent_feedback"("userId", "feedbackType");
CREATE INDEX "agent_learning_organizationId_userId_learningType_idx" ON "agent_learning"("organizationId", "userId", "learningType");
CREATE INDEX "agent_suggestions_organizationId_userId_status_idx" ON "agent_suggestions"("organizationId", "userId", "status");
CREATE INDEX "agent_analytics_date_idx" ON "agent_analytics"("date");
CREATE UNIQUE INDEX "agent_analytics_organizationId_userId_date_key" ON "agent_analytics"("organizationId", "userId", "date");
CREATE INDEX "agent_context_cache_expiresAt_idx" ON "agent_context_cache"("expiresAt");
CREATE UNIQUE INDEX "agent_context_cache_organizationId_userId_cacheKey_key" ON "agent_context_cache"("organizationId", "userId", "cacheKey");
CREATE INDEX "agent_proactive_tasks_organizationId_userId_status_idx" ON "agent_proactive_tasks"("organizationId", "userId", "status");
CREATE INDEX "agent_proactive_tasks_scheduledFor_idx" ON "agent_proactive_tasks"("scheduledFor");

-- AddForeignKey
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "agent_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "agent_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "agent_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_learning" ADD CONSTRAINT "agent_learning_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_learning" ADD CONSTRAINT "agent_learning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_suggestions" ADD CONSTRAINT "agent_suggestions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_suggestions" ADD CONSTRAINT "agent_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_analytics" ADD CONSTRAINT "agent_analytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_analytics" ADD CONSTRAINT "agent_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_context_cache" ADD CONSTRAINT "agent_context_cache_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_context_cache" ADD CONSTRAINT "agent_context_cache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_proactive_tasks" ADD CONSTRAINT "agent_proactive_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_proactive_tasks" ADD CONSTRAINT "agent_proactive_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
