-- PostgreSQL initialization script for CRM-GTD SaaS
-- This script sets up Row Level Security and multi-tenancy features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application user for connection pooling
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'app_user') THEN
    CREATE USER app_user WITH PASSWORD 'app_password';
  END IF;
END
$$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE crm_gtd_dev TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;

-- Function to get current organization ID from session
CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_org_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set organization context
CREATE OR REPLACE FUNCTION set_org_context(org_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security by default for new tables
ALTER DATABASE crm_gtd_dev SET row_security = on;