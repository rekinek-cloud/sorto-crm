-- ================================================================
-- VOICE INTEGRATION SEED DATA
-- Version: 1.0.0
-- Date: 2025-07-04
-- Description: Test data for voice interactions and Google Nest integration
-- ================================================================

-- Start transaction
BEGIN;

-- ================================================================
-- HELPER FUNCTIONS FOR SEED DATA
-- ================================================================

-- Function to get a random organization ID (for testing)
CREATE OR REPLACE FUNCTION get_random_org_id() 
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM "Organization" ORDER BY RANDOM() LIMIT 1;
    RETURN org_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get a random user ID (for testing)
CREATE OR REPLACE FUNCTION get_random_user_id() 
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM "User" ORDER BY RANDOM() LIMIT 1;
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 1. ASSISTANT PREFERENCES SEED DATA
-- ================================================================

-- Create assistant preferences for existing users
INSERT INTO "assistant_preferences" (
    "user_id", 
    "organization_id",
    "preferred_language",
    "voice_speed",
    "voice_pitch", 
    "voice_volume",
    "voice_personality",
    "response_length",
    "include_suggestions",
    "include_context",
    "pronunciation_corrections",
    "auto_confirm_actions",
    "request_confirmation_for",
    "default_task_priority",
    "default_task_context",
    "preferred_date_format",
    "preferred_time_format",
    "store_voice_history",
    "share_usage_analytics",
    "enable_personalization",
    "voice_notifications_enabled",
    "notification_times",
    "notification_types",
    "favorite_commands",
    "custom_phrases"
) VALUES 
-- Professional user profile
((SELECT id FROM "User" WHERE "firstName" = 'Michał' LIMIT 1),
 get_random_org_id(),
 'pl-PL',
 1.0,
 1.0,
 0.8,
 'professional',
 'medium',
 true,
 true,
 '{"Kowalski": "Ko-val-ski", "Krawczyk": "Krav-chik"}',
 false,
 '["delete", "important_changes", "schedule_meeting"]',
 'HIGH',
 '@computer',
 'DD.MM.YYYY',
 '24h',
 true,
 true,
 true,
 true,
 '{"morning": "09:00", "evening": "18:00"}',
 '["reminders", "deadlines", "suggestions", "daily_summary"]',
 '["pokaż zadania", "dodaj zadanie", "kalendarz dziś", "status projektów"]',
 '{"szybkie zadanie": "dodaj zadanie pilne", "spotkanie jutro": "dodaj spotkanie na jutro"}'
),

-- Casual user profile
((SELECT id FROM "User" WHERE "firstName" = 'Anna' LIMIT 1),
 get_random_org_id(),
 'pl-PL',
 1.2,
 1.1,
 0.7,
 'casual',
 'brief',
 true,
 false,
 '{"Nowak": "No-vak"}',
 true,
 '["delete"]',
 'MEDIUM',
 '@calls',
 'DD/MM/YYYY',
 '12h',
 true,
 false,
 true,
 true,
 '{"morning": "08:30", "evening": "17:30"}',
 '["reminders", "deadlines"]',
 '["co dziś", "nowe zadanie", "kto dzwonił"]',
 '{"szybkie info": "pokaż dziś zadania i spotkania"}'
),

-- Tech-savvy user profile
((SELECT id FROM "User" WHERE "firstName" = 'Piotr' LIMIT 1),
 get_random_org_id(),
 'en-US',
 0.9,
 0.9,
 0.9,
 'enthusiastic',
 'detailed',
 true,
 true,
 '{"Wiśniewski": "Vish-niev-ski"}',
 false,
 '["delete", "important_changes", "schedule_meeting", "create_deal"]',
 'HIGH',
 '@computer',
 'YYYY-MM-DD',
 '24h',
 true,
 true,
 true,
 true,
 '{"morning": "08:00", "afternoon": "14:00", "evening": "19:00"}',
 '["reminders", "deadlines", "suggestions", "daily_summary", "weekly_review"]',
 '["show tasks", "add task", "calendar today", "project status", "team updates"]',
 '{"daily standup": "show today tasks and meetings and team updates", "quick add": "add task high priority computer context"}'
);

-- ================================================================
-- 2. DISPLAY WIDGETS SEED DATA
-- ================================================================

-- Task Summary Widget
INSERT INTO "display_widgets" (
    "user_id",
    "organization_id", 
    "widget_type",
    "widget_name",
    "description",
    "position",
    "size",
    "display_duration",
    "refresh_interval",
    "settings",
    "data_filters",
    "visual_options",
    "is_enabled",
    "visibility_conditions",
    "device_types",
    "data_source_type",
    "data_source_config",
    "cache_duration",
    "is_interactive",
    "voice_commands",
    "touch_actions"
) VALUES 
-- Today's Tasks Widget
(get_random_user_id(), 
 get_random_org_id(),
 'task_summary',
 'Dzisiejsze Zadania',
 'Podsumowanie zadań zaplanowanych na dziś',
 1,
 'large',
 45,
 300,
 '{"show_completed": false, "max_items": 8, "group_by_priority": true, "show_context": true}',
 '{"status": ["NEW", "IN_PROGRESS"], "dueDate": "today", "voice_accessible": true}',
 '{"background_color": "#f8f9fa", "text_color": "#333", "highlight_color": "#007bff", "font_size": "medium"}',
 true,
 '{"time_range": {"start": "06:00", "end": "22:00"}, "days": ["MON", "TUE", "WED", "THU", "FRI"]}',
 '["nest_hub", "nest_mini"]',
 'tasks',
 '{"endpoint": "/api/v1/tasks", "filters": {"dueDate": "today", "voice_accessible": true}}',
 120,
 true,
 '["pokaż więcej zadań", "oznacz jako ukończone", "przenieś na jutro"]',
 '["tap_to_complete", "swipe_to_defer", "long_press_for_details"]'
),

-- Calendar Widget
(get_random_user_id(),
 get_random_org_id(), 
 'calendar_today',
 'Kalendarz Dziś',
 'Spotkania i wydarzenia na dziś',
 2,
 'medium',
 30,
 600,
 '{"show_past_events": false, "time_format": "24h", "show_location": true}',
 '{"date": "today", "voice_accessible": true}',
 '{"theme": "light", "accent_color": "#28a745", "show_time_blocks": true}',
 true,
 '{"time_range": {"start": "07:00", "end": "20:00"}}',
 '["nest_hub"]',
 'calendar',
 '{"endpoint": "/api/v1/meetings", "filters": {"date": "today"}}',
 300,
 true,
 '["następne spotkanie", "wolny czas dziś", "przenieś spotkanie"]',
 '["tap_for_details", "swipe_to_reschedule"]'
),

-- Deals Pipeline Widget
(get_random_user_id(),
 get_random_org_id(),
 'deals_pipeline',
 'Pipeline Sprzedaży',
 'Aktywne deale i ich statusy',
 3,
 'medium',
 40,
 900,
 '{"show_value": true, "currency": "PLN", "stages": ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION"]}',
 '{"status": ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION"], "assignedTo": "current_user"}',
 '{"chart_type": "horizontal_bar", "colors": ["#ffc107", "#17a2b8", "#fd7e14", "#28a745"]}',
 true,
 '{"days": ["MON", "TUE", "WED", "THU", "FRI"], "business_hours_only": true}',
 '["nest_hub"]',
 'deals',
 '{"endpoint": "/api/v1/deals", "filters": {"active": true}}',
 600,
 true,
 '["pokaż deale", "status sprzedaży", "wysokie wartości"]',
 '["tap_for_deal_details", "swipe_between_stages"]'
),

-- Quick Capture Widget
(get_random_user_id(),
 get_random_org_id(),
 'quick_capture',
 'Szybkie Notatki',
 'Widget do szybkiego dodawania zadań i notatek',
 4,
 'small',
 20,
 0,
 '{"auto_save": true, "voice_input": true, "default_priority": "MEDIUM"}',
 '{}',
 '{"minimal_design": true, "quick_buttons": ["zadanie", "spotkanie", "notatka"]}',
 true,
 '{"always_visible": true}',
 '["nest_hub", "nest_mini"]',
 'custom',
 '{"type": "form", "fields": ["title", "type", "priority"]}',
 0,
 true,
 '["nowe zadanie", "dodaj notatki", "szybkie zadanie"]',
 '["tap_to_add", "voice_input_button"]'
);

-- ================================================================
-- 3. VOICE SHORTCUTS SEED DATA
-- ================================================================

INSERT INTO "voice_shortcuts" (
    "user_id",
    "organization_id",
    "name", 
    "description",
    "trigger_phrases",
    "action_type",
    "action_config",
    "parameters_template",
    "requires_confirmation",
    "confirmation_message",
    "success_message",
    "error_message",
    "execution_conditions",
    "usage_limit",
    "usage_count_today",
    "is_active",
    "is_public"
) VALUES 
-- Quick Task Addition
(get_random_user_id(),
 get_random_org_id(),
 'Szybkie Zadanie',
 'Dodaje zadanie z wysokim priorytetem na dziś',
 '["szybkie zadanie", "pilne zadanie", "ważne zadanie", "add urgent task"]',
 'create_task',
 '{"priority": "HIGH", "context": "@computer", "dueDate": "today", "voice_accessible": true}',
 '{"title": "{extracted_text}", "description": "{additional_context}"}',
 false,
 null,
 'Pilne zadanie "{task_title}" zostało dodane.',
 'Nie udało się dodać pilnego zadania. Spróbuj ponownie.',
 '{"business_hours": true, "max_title_length": 100}',
 20,
 0,
 true,
 true
),

-- Daily Summary
(get_random_user_id(),
 get_random_org_id(), 
 'Dzienna Stawka',
 'Pokazuje podsumowanie dnia: zadania, spotkania, deale',
 '["podsumowanie dnia", "co dziś", "daily summary", "dzisiejszy plan"]',
 'run_workflow',
 '{"workflow": "daily_summary", "include_tasks": true, "include_meetings": true, "include_deals": true}',
 '{"date": "today", "user_context": true}',
 false,
 null,
 'Oto twoje podsumowanie na dziś.',
 'Nie udało się pobrać podsumowania dnia.',
 '{"time_range": {"start": "06:00", "end": "23:00"}}',
 null,
 0,
 true,
 true
),

-- Meeting Scheduler
(get_random_user_id(),
 get_random_org_id(),
 'Zaplanuj Spotkanie',
 'Szybko planuje spotkanie z klientem',
 '["zaplanuj spotkanie", "umów spotkanie", "schedule meeting", "nowe spotkanie"]',
 'call_api',
 '{"endpoint": "/api/v1/meetings", "method": "POST", "auto_find_time": true}',
 '{"title": "{meeting_title}", "contact": "{contact_name}", "duration": "60", "type": "client_meeting"}',
 true,
 'Czy umówić spotkanie "{meeting_title}" z {contact_name}?',
 'Spotkanie zostało zaplanowane na {scheduled_time}.',
 'Nie udało się zaplanować spotkania.',
 '{"business_hours": true, "working_days": ["MON", "TUE", "WED", "THU", "FRI"]}',
 10,
 0,
 true,
 false
),

-- Contact Quick Note
(get_random_user_id(),
 get_random_org_id(),
 'Notatka o Kliencie',
 'Dodaje szybką notatkę o kontakcie/kliencie',
 '["notatka o kliencie", "dodaj notatki", "client note", "note about"]',
 'create_note',
 '{"type": "client_interaction", "category": "voice_note", "auto_timestamp": true}',
 '{"client_name": "{person_name}", "note_content": "{note_text}", "follow_up_needed": false}',
 false,
 null,
 'Notatka o {client_name} została zapisana.',
 'Nie udało się zapisać notatki.',
 '{"max_note_length": 500}',
 30,
 0,
 true,
 false
),

-- Project Status Check
(get_random_user_id(),
 get_random_org_id(),
 'Status Projektów',
 'Sprawdza status aktywnych projektów',
 '["status projektów", "jak projekty", "project status", "projects update"]',
 'run_workflow',
 '{"workflow": "project_status_check", "include_tasks": true, "include_progress": true}',
 '{"filter": "active", "include_team": true}',
 false,
 null,
 'Oto status twoich projektów.',
 'Nie udało się pobrać statusu projektów.',
 '{"business_hours": true}',
 15,
 0,
 true,
 true
),

-- Emergency Contact
(get_random_user_id(),
 get_random_org_id(),
 'Kontakt Awaryjny',
 'Łączy z numerem awaryjnym lub administratorem',
 '["emergency", "help", "urgent help", "pomoc", "awaria"]',
 'call_api',
 '{"endpoint": "/api/v1/emergency", "method": "POST", "priority": "urgent"}',
 '{"reason": "{emergency_reason}", "location": "{user_location}"}',
 false,
 null,
 'Kontakt awaryjny został nawiązany.',
 'Błąd kontaktu awaryjnego. Użyj alternatywnych środków.',
 '{"always_available": true}',
 5,
 0,
 true,
 true
);

-- ================================================================
-- 4. NOTIFICATION SETTINGS SEED DATA
-- ================================================================

INSERT INTO "notification_settings" (
    "user_id",
    "organization_id",
    "voice_notifications_enabled",
    "voice_notification_volume",
    "voice_notification_speed",
    "voice_notification_language",
    "display_notifications_enabled",
    "display_notification_duration",
    "display_notification_position",
    "display_theme",
    "notification_types",
    "quiet_hours",
    "notification_schedule",
    "smart_delivery",
    "priority_bypass",
    "location_based",
    "device_preferences",
    "emergency_contact_enabled",
    "emergency_phrases",
    "emergency_actions"
) VALUES 
-- Standard professional settings
((SELECT id FROM "User" WHERE "firstName" = 'Michał' LIMIT 1),
 get_random_org_id(),
 true,
 0.8,
 1.0,
 'pl-PL',
 true,
 20,
 'center',
 'auto',
 '{
   "task_reminders": true,
   "deadline_alerts": true,
   "meeting_reminders": true,
   "daily_summary": true,
   "weekly_review": true,
   "deal_updates": true,
   "priority_changes": true,
   "system_alerts": false
 }',
 '{
   "enabled": true,
   "start": "22:00",
   "end": "08:00",
   "timezone": "Europe/Warsaw"
 }',
 '{
   "daily_summary": "09:00",
   "weekly_review": "MON-09:00",
   "deadline_reminder": "1h_before",
   "meeting_reminder": "15m_before"
 }',
 true,
 true,
 false,
 '{
   "google_home": {"enabled": true, "volume": 0.8},
   "nest_hub": {"enabled": true, "brightness": 0.7},
   "mobile": {"enabled": true, "vibrate": true},
   "desktop": {"enabled": false, "sound": false}
 }',
 true,
 '["emergency", "urgent help", "call help", "pomoc", "awaria"]',
 '{"call_admin": true, "log_incident": true, "notify_team": false}'
),

-- Casual user settings
((SELECT id FROM "User" WHERE "firstName" = 'Anna' LIMIT 1),
 get_random_org_id(),
 true,
 0.6,
 1.1,
 'pl-PL',
 true,
 15,
 'top',
 'light',
 '{
   "task_reminders": true,
   "deadline_alerts": true,
   "meeting_reminders": true,
   "daily_summary": false,
   "weekly_review": false,
   "deal_updates": false,
   "priority_changes": true,
   "system_alerts": false
 }',
 '{
   "enabled": true,
   "start": "21:00", 
   "end": "08:30",
   "timezone": "Europe/Warsaw"
 }',
 '{
   "deadline_reminder": "30m_before",
   "meeting_reminder": "10m_before"
 }',
 false,
 false,
 false,
 '{
   "google_home": {"enabled": true, "volume": 0.6},
   "nest_hub": {"enabled": false, "brightness": 0.5},
   "mobile": {"enabled": true, "vibrate": true},
   "desktop": {"enabled": true, "sound": true}
 }',
 false,
 '["emergency", "help"]',
 '{"call_admin": false, "log_incident": true, "notify_team": false}'
);

-- ================================================================
-- 5. VOICE INTERACTIONS SAMPLE DATA (HISTORICAL)
-- ================================================================

INSERT INTO "voice_interactions" (
    "session_id",
    "user_id",
    "organization_id",
    "intent",
    "original_phrase",
    "processed_phrase", 
    "confidence_score",
    "language",
    "parameters",
    "entities",
    "context_data",
    "response_type",
    "response_text",
    "response_data",
    "display_data",
    "processing_time_ms",
    "api_calls_made",
    "errors",
    "source_device",
    "device_id",
    "location",
    "ip_address",
    "user_agent",
    "actions_performed",
    "created_entities",
    "modified_entities",
    "interaction_at",
    "processed_at"
) VALUES 
-- Successful task creation
('sess_' || substr(md5(random()::text), 1, 8),
 get_random_user_id(),
 get_random_org_id(),
 'crm_gtd.add_task',
 'Dodaj zadanie przygotuj prezentację na jutro',
 'dodaj zadanie przygotuj prezentację na jutro',
 0.95,
 'pl-PL',
 '{"task_title": "przygotuj prezentację", "task_date": "jutro", "task_priority": "medium"}',
 '{"date": ["jutro"], "action": ["przygotuj"], "object": ["prezentacja"]}',
 '{"user_timezone": "Europe/Warsaw", "current_time": "14:30", "context": "work"}',
 'SUCCESS',
 'Zadanie "Przygotuj prezentację" zostało dodane na jutro z priorytetem średnim.',
 '{"task_id": "' || gen_random_uuid() || '", "due_date": "tomorrow", "priority": "MEDIUM"}',
 '{"card": {"title": "✅ Zadanie dodane", "subtitle": "Przygotuj prezentację", "date": "jutro"}}',
 450,
 '["/api/v1/tasks"]',
 '[]',
 'google_home',
 'GH_living_room_001',
 'Salon',
 '192.168.1.100',
 'Google-Assistant/1.0',
 '["create_task"]',
 '{"task_id": "' || gen_random_uuid() || '"}',
 '{}',
 NOW() - INTERVAL '2 hours',
 NOW() - INTERVAL '2 hours' + INTERVAL '450 milliseconds'
),

-- Successful tasks query
('sess_' || substr(md5(random()::text), 1, 8),
 get_random_user_id(),
 get_random_org_id(),
 'crm_gtd.show_tasks',
 'Co mam do zrobienia dziś',
 'pokaż zadania dziś',
 0.92,
 'pl-PL',
 '{"task_filter": "today", "task_status": "pending"}',
 '{"time": ["dziś"], "action": ["zrobienia"]}',
 '{"user_timezone": "Europe/Warsaw", "current_time": "09:15"}',
 'SUCCESS',
 'Masz 3 zadania na dziś: Przygotuj prezentację (priorytet wysoki), Sprawdź emaile (priorytet średni), Zadzwoń do klienta (priorytet wysoki).',
 '{"tasks_count": 3, "high_priority": 2, "medium_priority": 1}',
 '{"list": [{"title": "Przygotuj prezentację", "priority": "HIGH"}, {"title": "Sprawdź emaile", "priority": "MEDIUM"}, {"title": "Zadzwoń do klienta", "priority": "HIGH"}]}',
 320,
 '["/api/v1/tasks"]',
 '[]',
 'nest_hub',
 'NH_kitchen_001',
 'Kuchnia',
 '192.168.1.101',
 'Google-Nest/2.0',
 '["query_tasks"]',
 '{}',
 '{}',
 NOW() - INTERVAL '1 hour',
 NOW() - INTERVAL '1 hour' + INTERVAL '320 milliseconds'
),

-- Error case - ambiguous command
('sess_' || substr(md5(random()::text), 1, 8),
 get_random_user_id(),
 get_random_org_id(),
 'crm_gtd.clarification_needed',
 'Zmień to zadanie',
 'zmień to zadanie',
 0.78,
 'pl-PL',
 '{"task_reference": "to zadanie", "action": "zmień"}',
 '{"action": ["zmień"], "reference": ["to zadanie"]}',
 '{"ambiguous_reference": true}',
 'CLARIFICATION_NEEDED',
 'Które zadanie chcesz zmienić? Masz 3 aktywne zadania. Powiedz "pierwsze zadanie" lub podaj nazwę zadania.',
 '{"clarification_type": "task_reference", "options": ["pierwsze zadanie", "drugie zadanie", "trzecie zadanie"]}',
 '{"clarification": {"question": "Które zadanie?", "options": ["Przygotuj prezentację", "Sprawdź emaile", "Zadzwoń do klienta"]}}',
 280,
 '["/api/v1/tasks"]',
 '[]',
 'google_home',
 'GH_living_room_001',
 'Salon', 
 '192.168.1.100',
 'Google-Assistant/1.0',
 '["query_tasks"]',
 '{}',
 '{}',
 NOW() - INTERVAL '30 minutes',
 NOW() - INTERVAL '30 minutes' + INTERVAL '280 milliseconds'
),

-- Successful meeting scheduling
('sess_' || substr(md5(random()::text), 1, 8),
 get_random_user_id(),
 get_random_org_id(),
 'crm_gtd.schedule_meeting',
 'Umów spotkanie z Anną Kowalską na piątek o czternastej',
 'umów spotkanie z Anna Kowalska na piątek o 14:00',
 0.88,
 'pl-PL',
 '{"contact_name": "Anna Kowalska", "meeting_date": "piątek", "meeting_time": "14:00"}',
 '{"person": ["Anna Kowalska"], "date": ["piątek"], "time": ["czternastej"]}',
 '{"calendar_check": true, "contact_found": true}',
 'SUCCESS',
 'Spotkanie z Anną Kowalską zostało umówione na piątek o 14:00. Wysłałem zaproszenie.',
 '{"meeting_id": "' || gen_random_uuid() || '", "scheduled_time": "2025-07-11T14:00:00Z", "contact_id": "' || gen_random_uuid() || '"}',
 '{"calendar": {"event": "Spotkanie z Anna Kowalska", "time": "Piątek 14:00", "status": "confirmed"}}',
 680,
 '["/api/v1/contacts", "/api/v1/meetings", "/api/v1/calendar"]',
 '[]',
 'nest_hub',
 'NH_office_001',
 'Biuro',
 '192.168.1.102',
 'Google-Nest/2.0',
 '["find_contact", "check_calendar", "create_meeting", "send_invitation"]',
 '{"meeting_id": "' || gen_random_uuid() || '"}',
 '{}',
 NOW() - INTERVAL '15 minutes',
 NOW() - INTERVAL '15 minutes' + INTERVAL '680 milliseconds'
);

-- ================================================================
-- 6. UPDATE EXISTING TABLES WITH VOICE DATA
-- ================================================================

-- Update some existing tasks with voice accessibility and priorities
UPDATE "Task" 
SET 
    "voice_accessible" = true,
    "assistant_priority" = CASE 
        WHEN "priority" = 'HIGH' THEN 8
        WHEN "priority" = 'MEDIUM' THEN 5  
        WHEN "priority" = 'LOW' THEN 3
        ELSE 5
    END,
    "voice_notes" = CASE 
        WHEN "title" LIKE '%prezentacja%' THEN '{"pronunciation": "pre-zen-ta-cja", "context": "work", "estimated_duration": "2h"}'
        WHEN "title" LIKE '%email%' THEN '{"context": "quick_task", "estimated_duration": "30m"}'
        ELSE '{}'
    END,
    "voice_instructions" = CASE
        WHEN "title" LIKE '%prezentacja%' THEN 'Przygotuj slajdy, dodaj wykresy, sprawdź dane'
        WHEN "title" LIKE '%email%' THEN 'Przeczytaj wszystkie, odpowiedz na pilne'
        ELSE NULL
    END,
    "last_voice_update" = CASE 
        WHEN random() > 0.5 THEN NOW() - INTERVAL '2 hours'
        ELSE NULL
    END
WHERE "id" IN (SELECT "id" FROM "Task" LIMIT 5);

-- Update some contacts with voice data
UPDATE "Contact"
SET 
    "voice_accessible" = true,
    "preferred_voice_language" = CASE 
        WHEN "firstName" LIKE '%Anna%' OR "firstName" LIKE '%Katarzyna%' THEN 'pl-PL'
        WHEN "firstName" LIKE '%John%' OR "firstName" LIKE '%Mike%' THEN 'en-US'
        ELSE 'pl-PL'
    END,
    "voice_pronunciation" = CASE
        WHEN "lastName" = 'Kowalski' THEN 'Ko-val-ski'
        WHEN "lastName" = 'Wiśniewski' THEN 'Vish-niev-ski'
        WHEN "lastName" = 'Krawczyk' THEN 'Krav-chik'
        ELSE NULL
    END,
    "voice_notes" = CASE
        WHEN "position" LIKE '%Manager%' THEN '{"speaking_style": "formal", "prefers_brief": true, "usual_topics": ["business", "projects"]}'
        WHEN "position" LIKE '%Developer%' THEN '{"speaking_style": "technical", "prefers_details": true, "usual_topics": ["technology", "development"]}'
        ELSE '{"speaking_style": "neutral"}'
    END,
    "voice_summary" = CASE
        WHEN "company" IS NOT NULL THEN 'Kontakt biznesowy z firmy ' || "company"
        ELSE 'Kontakt osobisty'
    END
WHERE "id" IN (SELECT "id" FROM "Contact" LIMIT 3);

-- Update some meetings with voice reminders
UPDATE "Meeting"
SET 
    "voice_accessible" = true,
    "voice_reminders" = '{
        "enabled": true,
        "times": ["1h", "15m", "5m"],
        "voice_settings": {"volume": 0.8, "speed": 1.0}
    }',
    "reminder_settings" = '{
        "voice_reminder": true,
        "display_reminder": true,
        "reminder_times": ["1h", "15m", "5m"],
        "reminder_sound": "gentle"
    }',
    "voice_notes" = CASE
        WHEN "title" LIKE '%klient%' THEN '{"meeting_type": "client", "preparation_needed": true, "follow_up_required": true}'
        WHEN "title" LIKE '%team%' THEN '{"meeting_type": "internal", "recurring": false, "agenda_required": true}'
        ELSE '{"meeting_type": "general"}'
    END
WHERE "startTime" > NOW() AND "id" IN (SELECT "id" FROM "Meeting" LIMIT 3);

-- Update some users with voice settings
UPDATE "User"
SET 
    "voice_settings" = CASE
        WHEN "firstName" = 'Michał' THEN '{
            "enabled": true,
            "language": "pl-PL", 
            "personality": "professional",
            "response_style": "detailed",
            "preferred_voice": "male_polish",
            "wake_word_sensitivity": 0.8
        }'
        WHEN "firstName" = 'Anna' THEN '{
            "enabled": true,
            "language": "pl-PL",
            "personality": "casual", 
            "response_style": "concise",
            "preferred_voice": "female_polish",
            "wake_word_sensitivity": 0.7
        }'
        ELSE '{
            "enabled": true,
            "language": "pl-PL",
            "personality": "professional",
            "response_style": "medium"
        }'
    END,
    "voice_training_data" = '{"completed_introductions": true, "voice_samples_count": 0, "recognition_accuracy": 0.85}',
    "last_voice_interaction" = CASE 
        WHEN random() > 0.3 THEN NOW() - INTERVAL '1 hour'
        ELSE NULL
    END
WHERE "id" IN (SELECT "id" FROM "User" LIMIT 3);

-- ================================================================
-- 7. CLEANUP HELPER FUNCTIONS
-- ================================================================

-- Drop the helper functions used for seeding
DROP FUNCTION get_random_org_id();
DROP FUNCTION get_random_user_id();

-- Commit transaction
COMMIT;

-- ================================================================
-- SEED DATA COMPLETION
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🌱 Voice Integration Seed Data completed successfully at %', NOW();
    RAISE NOTICE '👥 Created assistant preferences for 3 users';
    RAISE NOTICE '📱 Created 4 display widgets with different configurations';
    RAISE NOTICE '🗣️  Created 6 voice shortcuts for common operations';
    RAISE NOTICE '🔔 Created notification settings for 2 users';
    RAISE NOTICE '📊 Created 4 sample voice interactions (historical data)';
    RAISE NOTICE '✏️  Updated existing tasks, contacts, meetings, and users with voice data';
    RAISE NOTICE '🎯 Database ready for voice interaction testing!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 You can now test voice commands like:';
    RAISE NOTICE '   - "Dodaj zadanie przygotuj raport"';
    RAISE NOTICE '   - "Co mam dziś do zrobienia"';
    RAISE NOTICE '   - "Umów spotkanie z klientem"';
    RAISE NOTICE '   - "Podsumowanie dnia"';
END $$;