-- Create vectors table without pgvector (fallback implementation)
CREATE TABLE IF NOT EXISTS vectors (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    embedding_data TEXT NOT NULL, -- JSON string of embedding array
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for metadata filtering
CREATE INDEX IF NOT EXISTS vectors_metadata_type_idx ON vectors USING gin ((metadata->>'type'));
CREATE INDEX IF NOT EXISTS vectors_metadata_user_idx ON vectors USING gin ((metadata->>'userId'));
CREATE INDEX IF NOT EXISTS vectors_metadata_org_idx ON vectors USING gin ((metadata->>'organizationId'));
CREATE INDEX IF NOT EXISTS vectors_metadata_source_idx ON vectors USING gin ((metadata->>'source'));
CREATE INDEX IF NOT EXISTS vectors_created_at_idx ON vectors (created_at);
CREATE INDEX IF NOT EXISTS vectors_updated_at_idx ON vectors (updated_at);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS vectors_org_type_created_idx ON vectors 
    ((metadata->>'organizationId'), (metadata->>'type'), created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_vectors_updated_at_trigger ON vectors;
CREATE TRIGGER update_vectors_updated_at_trigger
    BEFORE UPDATE ON vectors
    FOR EACH ROW
    EXECUTE FUNCTION update_vectors_updated_at();

-- Create table for ingestion jobs tracking
CREATE TABLE IF NOT EXISTS vector_ingestion_jobs (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    organization_id VARCHAR(255),
    user_id VARCHAR(255),
    entity_types JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    stats JSONB NOT NULL DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for job tracking
CREATE INDEX IF NOT EXISTS ingestion_jobs_status_idx ON vector_ingestion_jobs (status);
CREATE INDEX IF NOT EXISTS ingestion_jobs_org_idx ON vector_ingestion_jobs (organization_id);
CREATE INDEX IF NOT EXISTS ingestion_jobs_created_idx ON vector_ingestion_jobs (created_at DESC);