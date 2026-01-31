-- CreateEnum
CREATE TYPE "AiSource" AS ENUM ('CHATGPT', 'CLAUDE', 'DEEPSEEK');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'SYNCING', 'ERROR', 'COMPLETED');

-- Add REFERENCE to StreamType
ALTER TYPE "StreamType" ADD VALUE IF NOT EXISTS 'REFERENCE';

-- AlterTable: Add AI fields to streams
ALTER TABLE "streams" ADD COLUMN IF NOT EXISTS "aiSource" "AiSource";
ALTER TABLE "streams" ADD COLUMN IF NOT EXISTS "ai_conversations_count" INTEGER DEFAULT 0;
ALTER TABLE "streams" ADD COLUMN IF NOT EXISTS "ai_messages_count" INTEGER DEFAULT 0;
ALTER TABLE "streams" ADD COLUMN IF NOT EXISTS "ai_last_sync_at" TIMESTAMP(3);
ALTER TABLE "streams" ADD COLUMN IF NOT EXISTS "ai_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable: ai_conversations
CREATE TABLE IF NOT EXISTS "ai_conversations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stream_id" TEXT,
    "source" "AiSource" NOT NULL,
    "external_id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "app_name" TEXT,
    "classification_score" DOUBLE PRECISION,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "token_count" INTEGER,
    "source_created_at" TIMESTAMP(3),
    "source_updated_at" TIMESTAMP(3),
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_indexed" BOOLEAN NOT NULL DEFAULT false,
    "indexed_at" TIMESTAMP(3),

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ai_conversation_messages
CREATE TABLE IF NOT EXISTS "ai_conversation_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "message_index" INTEGER NOT NULL,
    "model" TEXT,
    "tokens" INTEGER,
    "timestamp" TIMESTAMP(3),

    CONSTRAINT "ai_conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ai_conversation_chunks
CREATE TABLE IF NOT EXISTS "ai_conversation_chunks" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "token_count" INTEGER NOT NULL,
    "embedding" vector(1536),

    CONSTRAINT "ai_conversation_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ai_sync_status
CREATE TABLE IF NOT EXISTS "ai_sync_status" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "source" "AiSource" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'IDLE',
    "last_sync_at" TIMESTAMP(3),
    "last_file_hash" TEXT,
    "last_error" TEXT,
    "conversations_count" INTEGER NOT NULL DEFAULT 0,
    "dropbox_path" TEXT,
    "dropbox_cursor" TEXT,

    CONSTRAINT "ai_sync_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ai_app_mappings
CREATE TABLE IF NOT EXISTS "ai_app_mappings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "app_name" TEXT NOT NULL,
    "app_status" TEXT,
    "keywords" TEXT[],
    "stream_id" TEXT,
    "conversations_count" INTEGER NOT NULL DEFAULT 0,
    "messages_count" INTEGER NOT NULL DEFAULT 0,
    "auto_create_stream" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ai_app_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ai_conversations_hash_key" ON "ai_conversations"("hash");
CREATE INDEX IF NOT EXISTS "ai_conversations_organization_id_source_idx" ON "ai_conversations"("organization_id", "source");
CREATE INDEX IF NOT EXISTS "ai_conversations_organization_id_app_name_idx" ON "ai_conversations"("organization_id", "app_name");
CREATE INDEX IF NOT EXISTS "ai_conversations_stream_id_idx" ON "ai_conversations"("stream_id");
CREATE INDEX IF NOT EXISTS "ai_conversations_hash_idx" ON "ai_conversations"("hash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_conversation_messages_conversation_id_idx" ON "ai_conversation_messages"("conversation_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_conversation_chunks_conversation_id_idx" ON "ai_conversation_chunks"("conversation_id");

-- CreateIndex HNSW for vector similarity search
CREATE INDEX IF NOT EXISTS "ai_conversation_chunks_embedding_idx" ON "ai_conversation_chunks"
USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ai_sync_status_organization_id_source_key" ON "ai_sync_status"("organization_id", "source");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ai_app_mappings_organization_id_app_name_key" ON "ai_app_mappings"("organization_id", "app_name");

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_stream_id_fkey"
FOREIGN KEY ("stream_id") REFERENCES "streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversation_messages" ADD CONSTRAINT "ai_conversation_messages_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversation_chunks" ADD CONSTRAINT "ai_conversation_chunks_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sync_status" ADD CONSTRAINT "ai_sync_status_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_app_mappings" ADD CONSTRAINT "ai_app_mappings_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- VECTOR SEARCH FUNCTION
-- ============================================

-- Function for semantic search in AI conversations
CREATE OR REPLACE FUNCTION search_ai_conversations(
    p_organization_id TEXT,
    p_query_embedding vector(1536),
    p_limit INTEGER DEFAULT 10,
    p_app_name TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL
)
RETURNS TABLE (
    conversation_id TEXT,
    chunk_id TEXT,
    chunk_content TEXT,
    similarity FLOAT,
    conversation_title TEXT,
    app_name TEXT,
    source TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS conversation_id,
        ch.id AS chunk_id,
        ch.content AS chunk_content,
        1 - (ch.embedding <=> p_query_embedding) AS similarity,
        c.title AS conversation_title,
        c.app_name,
        c.source::TEXT
    FROM ai_conversation_chunks ch
    JOIN ai_conversations c ON ch.conversation_id = c.id
    WHERE c.organization_id = p_organization_id
      AND ch.embedding IS NOT NULL
      AND (p_app_name IS NULL OR c.app_name = p_app_name)
      AND (p_source IS NULL OR c.source::TEXT = p_source)
    ORDER BY ch.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$;
