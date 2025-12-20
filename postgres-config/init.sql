-- PostgreSQL Initialization Script for CRM-GTD Smart
-- Performance optimizations and extensions

-- Create pg_stat_statements extension for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create btree_gin extension for better indexing performance
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Create pg_trgm extension for faster text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom indexes for performance (will be created after tables exist)
-- These are examples - actual indexes should be based on query patterns

-- Set default statistics target for better query planning
ALTER DATABASE crm_gtd_v1 SET default_statistics_target = 500;

-- Increase work_mem for this database
ALTER DATABASE crm_gtd_v1 SET work_mem = '32MB';

-- Enable JIT for complex queries
ALTER DATABASE crm_gtd_v1 SET jit = on;

-- Performance monitoring setup
-- Reset pg_stat_statements to start fresh
SELECT pg_stat_statements_reset();