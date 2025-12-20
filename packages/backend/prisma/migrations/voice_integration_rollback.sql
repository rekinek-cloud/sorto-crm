-- ================================================================
-- VOICE INTEGRATION ROLLBACK SCRIPT
-- Version: 1.0.0
-- Date: 2025-07-04
-- Description: Rollback voice interactions and Google Nest integration
-- WARNING: This will permanently delete all voice-related data!
-- ================================================================

-- Start transaction
BEGIN;

-- ================================================================
-- CONFIRMATION AND BACKUP REMINDER
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: VOICE INTEGRATION ROLLBACK STARTING';
    RAISE NOTICE '📁 Ensure you have backed up voice-related data before proceeding!';
    RAISE NOTICE '🗂️  Tables to be dropped: voice_interactions, assistant_preferences, display_widgets, voice_shortcuts, notification_settings';
    RAISE NOTICE '📝 Columns to be removed from existing tables: Task, Contact, Meeting, User';
    RAISE NOTICE '⏰ Rollback started at: %', NOW();
END $$;

-- ================================================================
-- 1. DROP VIEWS FIRST (DEPENDENCIES)
-- ================================================================

-- Drop views that depend on the tables/columns we're removing
DROP VIEW IF EXISTS "active_voice_tasks";
DROP VIEW IF EXISTS "today_voice_meetings";
DROP VIEW IF EXISTS "voice_interactions_summary";

-- ================================================================
-- 2. DROP TRIGGERS
-- ================================================================

-- Drop update triggers for voice tables
DROP TRIGGER IF EXISTS "update_voice_interactions_updated_at" ON "voice_interactions";
DROP TRIGGER IF EXISTS "update_assistant_preferences_updated_at" ON "assistant_preferences";
DROP TRIGGER IF EXISTS "update_display_widgets_updated_at" ON "display_widgets";
DROP TRIGGER IF EXISTS "update_voice_shortcuts_updated_at" ON "voice_shortcuts";
DROP TRIGGER IF EXISTS "update_notification_settings_updated_at" ON "notification_settings";

-- ================================================================
-- 3. DROP FUNCTIONS
-- ================================================================

-- Drop voice-specific functions
DROP FUNCTION IF EXISTS reset_daily_voice_shortcut_usage();

-- ================================================================
-- 4. REMOVE INDEXES FROM EXISTING TABLES
-- ================================================================

-- Task voice indexes
DROP INDEX IF EXISTS "idx_task_voice_accessible";
DROP INDEX IF EXISTS "idx_task_assistant_priority";
DROP INDEX IF EXISTS "idx_task_last_voice_update";
DROP INDEX IF EXISTS "idx_task_voice_notes";

-- Contact voice indexes  
DROP INDEX IF EXISTS "idx_contact_voice_accessible";
DROP INDEX IF EXISTS "idx_contact_voice_language";

-- Meeting voice indexes
DROP INDEX IF EXISTS "idx_meeting_voice_accessible";
DROP INDEX IF EXISTS "idx_meeting_voice_reminders";

-- User voice indexes
DROP INDEX IF EXISTS "idx_user_voice_settings";
DROP INDEX IF EXISTS "idx_user_last_voice_interaction";

-- ================================================================
-- 5. REMOVE VOICE COLUMNS FROM EXISTING TABLES
-- ================================================================

-- Remove voice fields from Task table
ALTER TABLE "Task" 
    DROP COLUMN IF EXISTS "voice_accessible",
    DROP COLUMN IF EXISTS "assistant_priority",
    DROP COLUMN IF EXISTS "voice_notes",
    DROP COLUMN IF EXISTS "voice_instructions",
    DROP COLUMN IF EXISTS "last_voice_update",
    DROP COLUMN IF EXISTS "voice_metadata";

-- Remove voice fields from Contact table
ALTER TABLE "Contact"
    DROP COLUMN IF EXISTS "voice_notes",
    DROP COLUMN IF EXISTS "preferred_voice_language",
    DROP COLUMN IF EXISTS "voice_pronunciation",
    DROP COLUMN IF EXISTS "voice_accessible",
    DROP COLUMN IF EXISTS "voice_summary";

-- Remove voice fields from Meeting table
ALTER TABLE "Meeting"
    DROP COLUMN IF EXISTS "voice_reminders",
    DROP COLUMN IF EXISTS "voice_recording_url",
    DROP COLUMN IF EXISTS "voice_transcription",
    DROP COLUMN IF EXISTS "voice_notes",
    DROP COLUMN IF EXISTS "voice_accessible",
    DROP COLUMN IF EXISTS "reminder_settings";

-- Remove voice fields from User table
ALTER TABLE "User"
    DROP COLUMN IF EXISTS "voice_settings",
    DROP COLUMN IF EXISTS "voice_training_data",
    DROP COLUMN IF EXISTS "last_voice_interaction";

-- ================================================================
-- 6. DROP VOICE-SPECIFIC TABLES
-- ================================================================

-- Drop voice tables in reverse dependency order

-- Drop notification_settings table
DROP TABLE IF EXISTS "notification_settings";

-- Drop voice_shortcuts table
DROP TABLE IF EXISTS "voice_shortcuts";

-- Drop display_widgets table
DROP TABLE IF EXISTS "display_widgets";

-- Drop assistant_preferences table
DROP TABLE IF EXISTS "assistant_preferences";

-- Drop voice_interactions table (main log table)
DROP TABLE IF EXISTS "voice_interactions";

-- ================================================================
-- 7. CLEANUP CHECK CONSTRAINTS
-- ================================================================

-- Remove any orphaned check constraints that might reference dropped columns
-- (PostgreSQL should handle this automatically, but let's be explicit)

-- These constraints were on tables we dropped, so they're already gone
-- No additional cleanup needed for check constraints

-- ================================================================
-- 8. FINAL VERIFICATION
-- ================================================================

-- Verify that voice tables no longer exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('voice_interactions', 'assistant_preferences', 'display_widgets', 
                       'voice_shortcuts', 'notification_settings');
    
    IF table_count = 0 THEN
        RAISE NOTICE '✅ All voice tables successfully removed';
    ELSE
        RAISE WARNING '⚠️  Some voice tables may still exist. Count: %', table_count;
    END IF;
END $$;

-- Verify that voice columns no longer exist in main tables
DO $$
DECLARE
    task_voice_columns INTEGER;
    contact_voice_columns INTEGER;
    meeting_voice_columns INTEGER;
    user_voice_columns INTEGER;
BEGIN
    -- Check Task table
    SELECT COUNT(*) INTO task_voice_columns
    FROM information_schema.columns 
    WHERE table_name = 'Task' 
    AND column_name IN ('voice_accessible', 'assistant_priority', 'voice_notes', 
                        'voice_instructions', 'last_voice_update', 'voice_metadata');
    
    -- Check Contact table
    SELECT COUNT(*) INTO contact_voice_columns
    FROM information_schema.columns 
    WHERE table_name = 'Contact' 
    AND column_name IN ('voice_notes', 'preferred_voice_language', 'voice_pronunciation',
                        'voice_accessible', 'voice_summary');
    
    -- Check Meeting table
    SELECT COUNT(*) INTO meeting_voice_columns
    FROM information_schema.columns 
    WHERE table_name = 'Meeting' 
    AND column_name IN ('voice_reminders', 'voice_recording_url', 'voice_transcription',
                        'voice_notes', 'voice_accessible', 'reminder_settings');
    
    -- Check User table
    SELECT COUNT(*) INTO user_voice_columns
    FROM information_schema.columns 
    WHERE table_name = 'User' 
    AND column_name IN ('voice_settings', 'voice_training_data', 'last_voice_interaction');
    
    IF task_voice_columns = 0 AND contact_voice_columns = 0 AND 
       meeting_voice_columns = 0 AND user_voice_columns = 0 THEN
        RAISE NOTICE '✅ All voice columns successfully removed from existing tables';
    ELSE
        RAISE WARNING '⚠️  Some voice columns may still exist. Task: %, Contact: %, Meeting: %, User: %', 
                     task_voice_columns, contact_voice_columns, meeting_voice_columns, user_voice_columns;
    END IF;
END $$;

-- ================================================================
-- 9. FINAL CLEANUP AND STATISTICS
-- ================================================================

-- Clean up any remaining statistics for dropped tables
-- This helps PostgreSQL's query planner
ANALYZE;

-- Commit transaction
COMMIT;

-- ================================================================
-- ROLLBACK COMPLETED
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🎯 Voice Integration Rollback completed successfully at %', NOW();
    RAISE NOTICE '🗑️  Removed 5 voice tables';
    RAISE NOTICE '📝 Removed voice columns from 4 existing tables';
    RAISE NOTICE '🔍 Removed all voice-related indexes and constraints';
    RAISE NOTICE '📊 Removed 3 voice-related views';
    RAISE NOTICE '⚡ Database returned to pre-voice integration state';
    RAISE NOTICE '';
    RAISE NOTICE '💡 To re-enable voice features, run: voice_integration_migration.sql';
    RAISE NOTICE '📝 Remember to restore any backed up voice data if needed';
END $$;

-- ================================================================
-- POST-ROLLBACK VERIFICATION QUERIES
-- ================================================================

-- Uncomment these if you want to manually verify the rollback
/*
-- Check for any remaining voice-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%voice%' 
OR table_name IN ('assistant_preferences', 'display_widgets', 'notification_settings');

-- Check for any remaining voice-related columns
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (column_name LIKE '%voice%' OR column_name LIKE '%assistant%');

-- Check for any remaining voice-related indexes
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%voice%';
*/