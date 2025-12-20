-- ================================================================
-- VOICE INTEGRATION MIGRATION SCRIPT
-- Version: 1.0.0
-- Date: 2025-07-04
-- Description: Add voice interactions and Google Nest integration support
-- ================================================================

-- Start transaction
BEGIN;

-- ================================================================
-- 1. NEW TABLES FOR VOICE FUNCTIONALITY
-- ================================================================

-- Voice Interactions Log Table
CREATE TABLE "voice_interactions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Interaction context
    "session_id" VARCHAR(255),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    
    -- Voice command details
    "intent" VARCHAR(255) NOT NULL, -- e.g., "crm_gtd.add_task", "crm_gtd.show_tasks"
    "original_phrase" TEXT NOT NULL, -- What user actually said
    "processed_phrase" TEXT, -- Cleaned/normalized phrase
    "confidence_score" DECIMAL(3,2), -- 0.00-1.00 confidence from STT
    "language" VARCHAR(10) DEFAULT 'pl-PL',
    
    -- Parameters and entities
    "parameters" JSONB DEFAULT '{}', -- Extracted parameters from voice
    "entities" JSONB DEFAULT '{}', -- Named entities (person, place, date, etc.)
    "context_data" JSONB DEFAULT '{}', -- Additional context information
    
    -- Response details
    "response_type" VARCHAR(50) NOT NULL, -- "SUCCESS", "ERROR", "CLARIFICATION_NEEDED"
    "response_text" TEXT, -- What assistant said back
    "response_data" JSONB DEFAULT '{}', -- Structured response data
    "display_data" JSONB DEFAULT '{}', -- Data for visual display (Nest Hub)
    
    -- Processing metadata
    "processing_time_ms" INTEGER, -- Time to process request
    "api_calls_made" JSONB DEFAULT '[]', -- Which APIs were called
    "errors" JSONB DEFAULT '[]', -- Any errors during processing
    
    -- Source and device info
    "source_device" VARCHAR(100), -- "google_home", "nest_hub", "phone", etc.
    "device_id" VARCHAR(255),
    "location" VARCHAR(255), -- Physical location of device
    "ip_address" INET,
    "user_agent" TEXT,
    
    -- Results and actions
    "actions_performed" JSONB DEFAULT '[]', -- What actions were taken
    "created_entities" JSONB DEFAULT '{}', -- IDs of created tasks/contacts/etc.
    "modified_entities" JSONB DEFAULT '{}', -- IDs of modified entities
    
    -- Timestamps
    "interaction_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "processed_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT "fk_voice_interactions_user" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_voice_interactions_organization" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "check_confidence_score" CHECK ("confidence_score" >= 0.0 AND "confidence_score" <= 1.0)
);

-- Assistant Preferences Table
CREATE TABLE "assistant_preferences" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL UNIQUE,
    "organization_id" UUID NOT NULL,
    
    -- Voice settings
    "preferred_language" VARCHAR(10) DEFAULT 'pl-PL',
    "voice_speed" DECIMAL(3,2) DEFAULT 1.0, -- 0.5-2.0 speech rate
    "voice_pitch" DECIMAL(3,2) DEFAULT 1.0, -- 0.5-2.0 pitch
    "voice_volume" DECIMAL(3,2) DEFAULT 0.8, -- 0.0-1.0 volume
    "voice_personality" VARCHAR(50) DEFAULT 'professional', -- "professional", "casual", "enthusiastic"
    
    -- Response preferences
    "response_length" VARCHAR(20) DEFAULT 'medium', -- "brief", "medium", "detailed"
    "include_suggestions" BOOLEAN DEFAULT true,
    "include_context" BOOLEAN DEFAULT true,
    "pronunciation_corrections" JSONB DEFAULT '{}', -- Custom pronunciations
    
    -- Interaction preferences
    "auto_confirm_actions" BOOLEAN DEFAULT false, -- Auto-confirm simple actions
    "request_confirmation_for" JSONB DEFAULT '["delete", "important_changes"]',
    "default_task_priority" VARCHAR(20) DEFAULT 'MEDIUM',
    "default_task_context" VARCHAR(50) DEFAULT '@computer',
    "preferred_date_format" VARCHAR(20) DEFAULT 'DD.MM.YYYY',
    "preferred_time_format" VARCHAR(10) DEFAULT '24h',
    
    -- Privacy settings
    "store_voice_history" BOOLEAN DEFAULT true,
    "share_usage_analytics" BOOLEAN DEFAULT true,
    "enable_personalization" BOOLEAN DEFAULT true,
    
    -- Notification preferences
    "voice_notifications_enabled" BOOLEAN DEFAULT true,
    "notification_times" JSONB DEFAULT '{"morning": "09:00", "evening": "18:00"}',
    "notification_types" JSONB DEFAULT '["reminders", "deadlines", "suggestions"]',
    
    -- Quick shortcuts
    "favorite_commands" JSONB DEFAULT '[]', -- Most used commands for quick access
    "custom_phrases" JSONB DEFAULT '{}', -- Custom phrase mappings
    
    -- Timestamps
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT "fk_assistant_preferences_user" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_assistant_preferences_organization" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "check_voice_speed" CHECK ("voice_speed" >= 0.5 AND "voice_speed" <= 2.0),
    CONSTRAINT "check_voice_pitch" CHECK ("voice_pitch" >= 0.5 AND "voice_pitch" <= 2.0),
    CONSTRAINT "check_voice_volume" CHECK ("voice_volume" >= 0.0 AND "voice_volume" <= 1.0)
);

-- Display Widgets Configuration Table
CREATE TABLE "display_widgets" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    
    -- Widget identification
    "widget_type" VARCHAR(100) NOT NULL, -- "task_summary", "calendar_today", "deals_pipeline", etc.
    "widget_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    
    -- Display configuration
    "position" INTEGER DEFAULT 0, -- Order on screen
    "size" VARCHAR(20) DEFAULT 'medium', -- "small", "medium", "large", "full_width"
    "display_duration" INTEGER DEFAULT 30, -- Seconds to show widget
    "refresh_interval" INTEGER DEFAULT 300, -- Seconds between data refreshes
    
    -- Widget settings
    "settings" JSONB NOT NULL DEFAULT '{}', -- Widget-specific settings
    "data_filters" JSONB DEFAULT '{}', -- Filters for data display
    "visual_options" JSONB DEFAULT '{}', -- Colors, fonts, layout options
    
    -- Visibility and conditions
    "is_enabled" BOOLEAN DEFAULT true,
    "visibility_conditions" JSONB DEFAULT '{}', -- When to show widget
    "device_types" JSONB DEFAULT '["nest_hub", "nest_mini"]', -- Which devices can show this
    
    -- Data source
    "data_source_type" VARCHAR(50) NOT NULL, -- "tasks", "calendar", "contacts", "deals", "custom"
    "data_source_config" JSONB DEFAULT '{}', -- Configuration for data fetching
    "cache_duration" INTEGER DEFAULT 60, -- Cache data for N seconds
    
    -- Interaction
    "is_interactive" BOOLEAN DEFAULT false, -- Can user interact with widget
    "voice_commands" JSONB DEFAULT '[]', -- Voice commands available for this widget
    "touch_actions" JSONB DEFAULT '[]', -- Touch actions (for screens)
    
    -- Timestamps
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "last_displayed_at" TIMESTAMP WITH TIME ZONE,
    "last_refreshed_at" TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT "fk_display_widgets_user" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_display_widgets_organization" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "check_position" CHECK ("position" >= 0),
    CONSTRAINT "check_display_duration" CHECK ("display_duration" > 0),
    CONSTRAINT "check_refresh_interval" CHECK ("refresh_interval" > 0)
);

-- Voice Shortcuts Table
CREATE TABLE "voice_shortcuts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    
    -- Shortcut identification
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "trigger_phrases" JSONB NOT NULL, -- Array of phrases that trigger this shortcut
    
    -- Action configuration
    "action_type" VARCHAR(100) NOT NULL, -- "create_task", "show_calendar", "call_api", "run_workflow"
    "action_config" JSONB NOT NULL, -- Configuration for the action
    "parameters_template" JSONB DEFAULT '{}', -- Template for parameters
    
    -- Execution options
    "requires_confirmation" BOOLEAN DEFAULT false,
    "confirmation_message" TEXT,
    "success_message" TEXT,
    "error_message" TEXT,
    
    -- Conditions and constraints
    "execution_conditions" JSONB DEFAULT '{}', -- When shortcut can be executed
    "usage_limit" INTEGER, -- Max uses per day (null = unlimited)
    "usage_count_today" INTEGER DEFAULT 0,
    "usage_reset_at" TIMESTAMP WITH TIME ZONE DEFAULT (DATE_TRUNC('day', NOW()) + INTERVAL '1 day'),
    
    -- Analytics
    "total_usage_count" INTEGER DEFAULT 0,
    "last_used_at" TIMESTAMP WITH TIME ZONE,
    "average_execution_time" DECIMAL(10,2), -- Average time in seconds
    
    -- Status
    "is_active" BOOLEAN DEFAULT true,
    "is_public" BOOLEAN DEFAULT false, -- Can other users in org see/use this shortcut
    
    -- Timestamps
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT "fk_voice_shortcuts_user" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_voice_shortcuts_organization" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "check_usage_limit" CHECK ("usage_limit" IS NULL OR "usage_limit" > 0)
);

-- Notification Settings Table
CREATE TABLE "notification_settings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL UNIQUE,
    "organization_id" UUID NOT NULL,
    
    -- Voice notification settings
    "voice_notifications_enabled" BOOLEAN DEFAULT true,
    "voice_notification_volume" DECIMAL(3,2) DEFAULT 0.7,
    "voice_notification_speed" DECIMAL(3,2) DEFAULT 1.0,
    "voice_notification_language" VARCHAR(10) DEFAULT 'pl-PL',
    
    -- Display notification settings
    "display_notifications_enabled" BOOLEAN DEFAULT true,
    "display_notification_duration" INTEGER DEFAULT 15, -- Seconds
    "display_notification_position" VARCHAR(20) DEFAULT 'center', -- "top", "center", "bottom"
    "display_theme" VARCHAR(20) DEFAULT 'auto', -- "light", "dark", "auto"
    
    -- Notification types and timing
    "notification_types" JSONB DEFAULT '{
        "task_reminders": true,
        "deadline_alerts": true,
        "meeting_reminders": true,
        "daily_summary": true,
        "weekly_review": true,
        "deal_updates": true,
        "priority_changes": true,
        "system_alerts": true
    }',
    
    -- Timing preferences
    "quiet_hours" JSONB DEFAULT '{
        "enabled": true,
        "start": "22:00",
        "end": "08:00",
        "timezone": "Europe/Warsaw"
    }',
    
    "notification_schedule" JSONB DEFAULT '{
        "daily_summary": "09:00",
        "weekly_review": "MON-09:00",
        "deadline_reminder": "1h_before",
        "meeting_reminder": "15m_before"
    }',
    
    -- Smart notification settings
    "smart_delivery" BOOLEAN DEFAULT true, -- Adjust timing based on user activity
    "priority_bypass" BOOLEAN DEFAULT true, -- Allow HIGH priority to bypass quiet hours
    "location_based" BOOLEAN DEFAULT false, -- Use location to determine notification method
    
    -- Device-specific settings
    "device_preferences" JSONB DEFAULT '{
        "google_home": {"enabled": true, "volume": 0.7},
        "nest_hub": {"enabled": true, "brightness": 0.8},
        "mobile": {"enabled": true, "vibrate": true},
        "desktop": {"enabled": true, "sound": true}
    }',
    
    -- Emergency settings
    "emergency_contact_enabled" BOOLEAN DEFAULT false,
    "emergency_phrases" JSONB DEFAULT '["emergency", "urgent help", "call help"]',
    "emergency_actions" JSONB DEFAULT '{"call_admin": true, "log_incident": true}',
    
    -- Timestamps
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT "fk_notification_settings_user" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_notification_settings_organization" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "check_voice_notification_volume" CHECK ("voice_notification_volume" >= 0.0 AND "voice_notification_volume" <= 1.0),
    CONSTRAINT "check_voice_notification_speed" CHECK ("voice_notification_speed" >= 0.5 AND "voice_notification_speed" <= 2.0),
    CONSTRAINT "check_display_notification_duration" CHECK ("display_notification_duration" > 0)
);

-- ================================================================
-- 2. EXISTING TABLE EXTENSIONS
-- ================================================================

-- Add voice-related fields to Task table
ALTER TABLE "Task" 
    ADD COLUMN "voice_accessible" BOOLEAN DEFAULT true,
    ADD COLUMN "assistant_priority" INTEGER DEFAULT 5, -- 1-10 scale for voice ordering
    ADD COLUMN "voice_notes" JSONB DEFAULT '{}', -- Voice notes and instructions
    ADD COLUMN "voice_instructions" TEXT, -- Spoken instructions for task
    ADD COLUMN "last_voice_update" TIMESTAMP WITH TIME ZONE,
    ADD COLUMN "voice_metadata" JSONB DEFAULT '{}'; -- Additional voice-related metadata

-- Add voice-related fields to Contact table  
ALTER TABLE "Contact"
    ADD COLUMN "voice_notes" JSONB DEFAULT '{}', -- Voice notes about contact
    ADD COLUMN "preferred_voice_language" VARCHAR(10) DEFAULT 'pl-PL',
    ADD COLUMN "voice_pronunciation" VARCHAR(255), -- How to pronounce contact name
    ADD COLUMN "voice_accessible" BOOLEAN DEFAULT true,
    ADD COLUMN "voice_summary" TEXT; -- Brief voice description of contact

-- Add voice-related fields to Meeting table
ALTER TABLE "Meeting"
    ADD COLUMN "voice_reminders" JSONB DEFAULT '{}', -- Voice reminder settings
    ADD COLUMN "voice_recording_url" TEXT, -- URL to voice recording
    ADD COLUMN "voice_transcription" TEXT, -- Transcription of voice recording
    ADD COLUMN "voice_notes" JSONB DEFAULT '{}', -- Voice notes from meeting
    ADD COLUMN "voice_accessible" BOOLEAN DEFAULT true,
    ADD COLUMN "reminder_settings" JSONB DEFAULT '{
        "voice_reminder": true,
        "display_reminder": true,
        "reminder_times": ["15m", "5m"]
    }';

-- Add voice settings to User table
ALTER TABLE "User"
    ADD COLUMN "voice_settings" JSONB DEFAULT '{
        "enabled": true,
        "language": "pl-PL",
        "personality": "professional",
        "response_style": "concise"
    }',
    ADD COLUMN "voice_training_data" JSONB DEFAULT '{}', -- For voice recognition training
    ADD COLUMN "last_voice_interaction" TIMESTAMP WITH TIME ZONE;

-- ================================================================
-- 3. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ================================================================

-- Voice Interactions indexes
CREATE INDEX "idx_voice_interactions_user_org" ON "voice_interactions" ("user_id", "organization_id");
CREATE INDEX "idx_voice_interactions_session" ON "voice_interactions" ("session_id");
CREATE INDEX "idx_voice_interactions_intent" ON "voice_interactions" ("intent");
CREATE INDEX "idx_voice_interactions_timestamp" ON "voice_interactions" ("interaction_at" DESC);
CREATE INDEX "idx_voice_interactions_response_type" ON "voice_interactions" ("response_type");
CREATE INDEX "idx_voice_interactions_device" ON "voice_interactions" ("source_device", "device_id");
CREATE INDEX "idx_voice_interactions_language" ON "voice_interactions" ("language");

-- Partial index for recent interactions (last 30 days)
CREATE INDEX "idx_voice_interactions_recent" ON "voice_interactions" ("interaction_at") 
WHERE "interaction_at" > (NOW() - INTERVAL '30 days');

-- GIN indexes for JSONB fields
CREATE INDEX "idx_voice_interactions_parameters" ON "voice_interactions" USING GIN ("parameters");
CREATE INDEX "idx_voice_interactions_entities" ON "voice_interactions" USING GIN ("entities");
CREATE INDEX "idx_voice_interactions_context_data" ON "voice_interactions" USING GIN ("context_data");

-- Assistant Preferences indexes
CREATE INDEX "idx_assistant_preferences_user" ON "assistant_preferences" ("user_id");
CREATE INDEX "idx_assistant_preferences_language" ON "assistant_preferences" ("preferred_language");

-- Display Widgets indexes
CREATE INDEX "idx_display_widgets_user_org" ON "display_widgets" ("user_id", "organization_id");
CREATE INDEX "idx_display_widgets_type" ON "display_widgets" ("widget_type");
CREATE INDEX "idx_display_widgets_enabled" ON "display_widgets" ("is_enabled") WHERE "is_enabled" = true;
CREATE INDEX "idx_display_widgets_position" ON "display_widgets" ("user_id", "position");

-- Voice Shortcuts indexes
CREATE INDEX "idx_voice_shortcuts_user_org" ON "voice_shortcuts" ("user_id", "organization_id");
CREATE INDEX "idx_voice_shortcuts_active" ON "voice_shortcuts" ("is_active") WHERE "is_active" = true;
CREATE INDEX "idx_voice_shortcuts_public" ON "voice_shortcuts" ("is_public", "organization_id") WHERE "is_public" = true;
CREATE INDEX "idx_voice_shortcuts_action_type" ON "voice_shortcuts" ("action_type");
CREATE INDEX "idx_voice_shortcuts_trigger_phrases" ON "voice_shortcuts" USING GIN ("trigger_phrases");

-- Notification Settings indexes
CREATE INDEX "idx_notification_settings_user" ON "notification_settings" ("user_id");

-- Task voice fields indexes
CREATE INDEX "idx_task_voice_accessible" ON "Task" ("voice_accessible") WHERE "voice_accessible" = true;
CREATE INDEX "idx_task_assistant_priority" ON "Task" ("assistant_priority" DESC);
CREATE INDEX "idx_task_last_voice_update" ON "Task" ("last_voice_update" DESC);
CREATE INDEX "idx_task_voice_notes" ON "Task" USING GIN ("voice_notes");

-- Contact voice fields indexes
CREATE INDEX "idx_contact_voice_accessible" ON "Contact" ("voice_accessible") WHERE "voice_accessible" = true;
CREATE INDEX "idx_contact_voice_language" ON "Contact" ("preferred_voice_language");

-- Meeting voice fields indexes
CREATE INDEX "idx_meeting_voice_accessible" ON "Meeting" ("voice_accessible") WHERE "voice_accessible" = true;
CREATE INDEX "idx_meeting_voice_reminders" ON "Meeting" USING GIN ("voice_reminders");

-- User voice settings indexes
CREATE INDEX "idx_user_voice_settings" ON "User" USING GIN ("voice_settings");
CREATE INDEX "idx_user_last_voice_interaction" ON "User" ("last_voice_interaction" DESC);

-- ================================================================
-- 4. TRIGGERS FOR AUTOMATIC UPDATES
-- ================================================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to new tables
CREATE TRIGGER "update_voice_interactions_updated_at" 
    BEFORE UPDATE ON "voice_interactions" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_assistant_preferences_updated_at" 
    BEFORE UPDATE ON "assistant_preferences" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_display_widgets_updated_at" 
    BEFORE UPDATE ON "display_widgets" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_voice_shortcuts_updated_at" 
    BEFORE UPDATE ON "voice_shortcuts" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_notification_settings_updated_at" 
    BEFORE UPDATE ON "notification_settings" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 5. VOICE SHORTCUT USAGE RESET FUNCTION
-- ================================================================

-- Function to reset daily usage counts
CREATE OR REPLACE FUNCTION reset_daily_voice_shortcut_usage()
RETURNS void AS $$
BEGIN
    UPDATE "voice_shortcuts" 
    SET 
        "usage_count_today" = 0,
        "usage_reset_at" = DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
    WHERE "usage_reset_at" <= NOW();
END;
$$ LANGUAGE 'plpgsql';

-- ================================================================
-- 6. VIEWS FOR COMMON QUERIES
-- ================================================================

-- View for active voice-accessible tasks
CREATE VIEW "active_voice_tasks" AS
SELECT 
    t."id",
    t."title",
    t."description",
    t."priority",
    t."status",
    t."dueDate",
    t."assistant_priority",
    t."voice_notes",
    t."voice_instructions",
    u."firstName" || ' ' || u."lastName" AS "assignee_name",
    c."name" AS "context_name",
    org."name" AS "organization_name"
FROM "Task" t
LEFT JOIN "User" u ON t."assignedToId" = u."id"
LEFT JOIN "Context" c ON t."contextId" = c."id"
LEFT JOIN "Organization" org ON t."organizationId" = org."id"
WHERE t."voice_accessible" = true 
    AND t."status" NOT IN ('COMPLETED', 'CANCELLED');

-- View for today's voice-accessible meetings
CREATE VIEW "today_voice_meetings" AS
SELECT 
    m."id",
    m."title",
    m."description",
    m."startTime",
    m."endTime",
    m."location",
    m."voice_reminders",
    m."reminder_settings",
    u."firstName" || ' ' || u."lastName" AS "organizer_name",
    c."firstName" || ' ' || c."lastName" AS "contact_name",
    org."name" AS "organization_name"
FROM "Meeting" m
LEFT JOIN "User" u ON m."organizedById" = u."id"
LEFT JOIN "Contact" c ON m."contactId" = c."id"
LEFT JOIN "Organization" org ON m."organizationId" = org."id"
WHERE m."voice_accessible" = true 
    AND DATE(m."startTime") = CURRENT_DATE;

-- View for recent voice interactions summary
CREATE VIEW "voice_interactions_summary" AS
SELECT 
    vi."user_id",
    vi."organization_id",
    COUNT(*) as "total_interactions",
    COUNT(*) FILTER (WHERE vi."response_type" = 'SUCCESS') as "successful_interactions",
    COUNT(*) FILTER (WHERE vi."response_type" = 'ERROR') as "failed_interactions",
    AVG(vi."confidence_score") as "avg_confidence",
    AVG(vi."processing_time_ms") as "avg_processing_time",
    MAX(vi."interaction_at") as "last_interaction"
FROM "voice_interactions" vi
WHERE vi."interaction_at" > (NOW() - INTERVAL '7 days')
GROUP BY vi."user_id", vi."organization_id";

-- ================================================================
-- 7. SAMPLE DATA CONSTRAINTS VALIDATION
-- ================================================================

-- Add check constraints for data integrity
ALTER TABLE "voice_interactions" 
    ADD CONSTRAINT "check_intent_format" 
    CHECK ("intent" ~ '^[a-z_]+\.[a-z_]+$'); -- Format: "module.action"

ALTER TABLE "display_widgets" 
    ADD CONSTRAINT "check_widget_name_length" 
    CHECK (length("widget_name") >= 3 AND length("widget_name") <= 255);

ALTER TABLE "voice_shortcuts" 
    ADD CONSTRAINT "check_shortcut_name_length" 
    CHECK (length("name") >= 2 AND length("name") <= 255);

-- Commit transaction
COMMIT;

-- ================================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Voice Integration Migration completed successfully at %', NOW();
    RAISE NOTICE 'Created 5 new tables: voice_interactions, assistant_preferences, display_widgets, voice_shortcuts, notification_settings';
    RAISE NOTICE 'Extended 4 existing tables: Task, Contact, Meeting, User';
    RAISE NOTICE 'Created % indexes for optimal performance', 25;
    RAISE NOTICE 'Created 3 views for common voice queries';
END $$;