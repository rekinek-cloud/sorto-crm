-- Rozszerzenia schematu bazy danych dla integracji Google Assistant
-- Plik zawiera wszystkie zmiany w istniejących tabelach

-- Dodanie kolumn do tabeli tasks dla wsparcia poleceń głosowych
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS voice_created BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS voice_session_id VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS voice_command_id VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_assistant_metadata JSONB DEFAULT '{}';

-- Dodanie indeksów dla nowych kolumn w tasks
CREATE INDEX IF NOT EXISTS idx_tasks_voice_created ON tasks(voice_created);
CREATE INDEX IF NOT EXISTS idx_tasks_voice_session_id ON tasks(voice_session_id);

-- Dodanie kolumn do tabeli projects dla wsparcia poleceń głosowych
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_created BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_session_id VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_command_id VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_assistant_metadata JSONB DEFAULT '{}';

-- Dodanie indeksów dla nowych kolumn w projects
CREATE INDEX IF NOT EXISTS idx_projects_voice_created ON projects(voice_created);
CREATE INDEX IF NOT EXISTS idx_projects_voice_session_id ON projects(voice_session_id);

-- Rozszerzenie tabeli gtd_inbox_items o wsparcie głosowe
ALTER TABLE gtd_inbox_items ADD COLUMN IF NOT EXISTS voice_created BOOLEAN DEFAULT FALSE;
ALTER TABLE gtd_inbox_items ADD COLUMN IF NOT EXISTS voice_session_id VARCHAR(255);
ALTER TABLE gtd_inbox_items ADD COLUMN IF NOT EXISTS voice_processing_suggestions JSONB DEFAULT '{}';

-- Dodanie kolumn do tabeli users dla integracji z Google
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_account_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_assistant_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS voice_preferences JSONB DEFAULT '{
    "language": "pl",
    "voice_speed": 1.0,
    "confirmations": true,
    "auto_create": true
}';

-- Indeksy dla nowych kolumn w users
CREATE INDEX IF NOT EXISTS idx_users_google_account_id ON users(google_account_id);
CREATE INDEX IF NOT EXISTS idx_users_google_assistant_enabled ON users(google_assistant_enabled);

-- Rozszerzenie tabeli organizations o ustawienia Google Assistant
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS google_assistant_settings JSONB DEFAULT '{
    "enabled": false,
    "default_voice_language": "pl",
    "allowed_intents": ["crm_gtd.add_task", "crm_gtd.show_tasks", "crm_gtd.create_project"],
    "security_level": "standard"
}';

-- Dodanie tabeli dla mapping kontekstów GTD z Google Assistant
CREATE TABLE IF NOT EXISTS gtd_context_voice_mappings (
    id SERIAL PRIMARY KEY,
    gtd_context VARCHAR(50) NOT NULL, -- @computer, @calls, @office, etc.
    voice_keywords TEXT[], -- ['komputer', 'biuro', 'komputerze']
    google_assistant_context VARCHAR(100),
    priority_boost INTEGER DEFAULT 0, -- boost priorytetu dla kontekstu
    auto_assign_rules JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(gtd_context),
    INDEX idx_gtd_context_voice_mappings_context (gtd_context)
);

-- Wstaw domyślne mapowania kontekstów
INSERT INTO gtd_context_voice_mappings (gtd_context, voice_keywords, google_assistant_context) VALUES
('@computer', ARRAY['komputer', 'komputerze', 'laptopie', 'biurku'], 'computer_work'),
('@calls', ARRAY['telefon', 'rozmowa', 'dzwonienie', 'kontakt'], 'phone_calls'),
('@office', ARRAY['biuro', 'biurze', 'praca', 'firma'], 'office_work'),
('@home', ARRAY['dom', 'domu', 'mieszkanie'], 'home_tasks'),
('@errands', ARRAY['sprawy', 'zakupy', 'miasto', 'zewnątrz'], 'errands'),
('@online', ARRAY['internet', 'online', 'sieć', 'strona'], 'online_tasks'),
('@waiting', ARRAY['czekanie', 'oczekiwanie', 'odpowiedź'], 'waiting_for'),
('@reading', ARRAY['czytanie', 'książka', 'artykuł', 'dokumenty'], 'reading_tasks')
ON CONFLICT (gtd_context) DO NOTHING;

-- Dodanie tabeli dla konfiguracji webhook Google Assistant
CREATE TABLE IF NOT EXISTS google_assistant_webhook_config (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    webhook_url VARCHAR(500) NOT NULL,
    webhook_secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    supported_intents TEXT[] DEFAULT ARRAY[
        'crm_gtd.add_task',
        'crm_gtd.show_tasks', 
        'crm_gtd.create_project',
        'crm_gtd.show_contacts',
        'crm_gtd.process_inbox'
    ],
    rate_limit_per_minute INTEGER DEFAULT 60,
    security_settings JSONB DEFAULT '{
        "require_auth": true,
        "allowed_sources": ["GOOGLE_ASSISTANT", "NEST_HUB"],
        "log_all_requests": true
    }',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_google_assistant_webhook_config_org_id (organization_id),
    INDEX idx_google_assistant_webhook_config_active (is_active)
);

-- Trigger dla updated_at w nowych tabelach
CREATE TRIGGER update_gtd_context_voice_mappings_updated_at 
    BEFORE UPDATE ON gtd_context_voice_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_assistant_webhook_config_updated_at 
    BEFORE UPDATE ON google_assistant_webhook_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funkcja do analizy poleceń głosowych i sugerowania kontekstu
CREATE OR REPLACE FUNCTION suggest_gtd_context_from_voice(
    voice_command TEXT,
    user_id INTEGER DEFAULT NULL
) RETURNS VARCHAR(50) AS $$
DECLARE
    suggested_context VARCHAR(50) := '@computer'; -- domyślny
    mapping_row gtd_context_voice_mappings%ROWTYPE;
    keyword TEXT;
BEGIN
    -- Normalizacja tekstu do małych liter
    voice_command := LOWER(voice_command);
    
    -- Przeszukaj mapowania kontekstów
    FOR mapping_row IN 
        SELECT * FROM gtd_context_voice_mappings 
        ORDER BY priority_boost DESC
    LOOP
        -- Sprawdź czy któreś słowo kluczowe występuje w poleceniu
        FOREACH keyword IN ARRAY mapping_row.voice_keywords
        LOOP
            IF voice_command LIKE '%' || keyword || '%' THEN
                suggested_context := mapping_row.gtd_context;
                EXIT; -- Wyjdź z obu pętli
            END IF;
        END LOOP;
        
        IF suggested_context != '@computer' THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN suggested_context;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do logowania sukcesu/porażki poleceń głosowych
CREATE OR REPLACE FUNCTION log_voice_command_result(
    p_intent VARCHAR(255),
    p_success BOOLEAN,
    p_processing_time INTEGER DEFAULT NULL,
    p_user_id INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Uaktualnij dzisiejsze statystyki
    INSERT INTO voice_command_analytics (date, intent, success_count, failure_count, total_interactions)
    VALUES (
        CURRENT_DATE, 
        p_intent,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        CASE WHEN p_success THEN 0 ELSE 1 END,
        1
    )
    ON CONFLICT (date, intent) 
    DO UPDATE SET
        success_count = voice_command_analytics.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
        failure_count = voice_command_analytics.failure_count + CASE WHEN p_success THEN 0 ELSE 1 END,
        total_interactions = voice_command_analytics.total_interactions + 1,
        avg_processing_time = CASE 
            WHEN p_processing_time IS NOT NULL THEN 
                (COALESCE(voice_command_analytics.avg_processing_time, 0) + p_processing_time) / 2
            ELSE voice_command_analytics.avg_processing_time
        END;
END;
$$ LANGUAGE plpgsql;

-- Widok dla dashboard Google Assistant
CREATE OR REPLACE VIEW google_assistant_dashboard AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.google_assistant_enabled,
    uac.preferred_language,
    uac.voice_speed,
    uac.auto_create_tasks,
    
    -- Statystyki ostatnich 7 dni
    COALESCE(recent_stats.total_interactions, 0) as interactions_last_7_days,
    COALESCE(recent_stats.successful_interactions, 0) as successful_interactions_last_7_days,
    COALESCE(recent_stats.avg_processing_time, 0) as avg_processing_time_last_7_days,
    
    -- Ostatnia aktywność
    last_interaction.timestamp as last_interaction_at,
    last_interaction.intent as last_intent,
    last_interaction.success as last_interaction_success,
    
    -- Preferencje
    uac.task_creation_preferences,
    uac.project_creation_preferences
    
FROM users u
LEFT JOIN user_google_assistant_config uac ON u.id = uac.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_interactions,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_interactions,
        ROUND(AVG(processing_time), 2) as avg_processing_time
    FROM voice_interactions 
    WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    GROUP BY user_id
) recent_stats ON u.id = recent_stats.user_id
LEFT JOIN (
    SELECT DISTINCT ON (user_id) 
        user_id, timestamp, intent, success
    FROM voice_interactions 
    ORDER BY user_id, timestamp DESC
) last_interaction ON u.id = last_interaction.user_id
WHERE u.google_assistant_enabled = true;

-- Indeks dla wydajności widoku dashboard
CREATE INDEX IF NOT EXISTS idx_voice_interactions_user_timestamp ON voice_interactions(user_id, timestamp DESC);

-- Komentarze do nowych kolumn
COMMENT ON COLUMN tasks.voice_created IS 'Czy zadanie zostało utworzone przez polecenie głosowe';
COMMENT ON COLUMN tasks.voice_session_id IS 'ID sesji Google Assistant w której utworzono zadanie';
COMMENT ON COLUMN tasks.google_assistant_metadata IS 'Metadane z Google Assistant (parametry, kontekst, etc.)';

COMMENT ON COLUMN projects.voice_created IS 'Czy projekt został utworzony przez polecenie głosowe';
COMMENT ON COLUMN projects.voice_session_id IS 'ID sesji Google Assistant w której utworzono projekt';

COMMENT ON COLUMN users.google_account_id IS 'ID konta Google powiązanego z użytkownikiem';
COMMENT ON COLUMN users.google_assistant_enabled IS 'Czy użytkownik ma włączoną integrację z Google Assistant';
COMMENT ON COLUMN users.voice_preferences IS 'Preferencje użytkownika dla poleceń głosowych';

-- Komunikat o ukończeniu
SELECT 'Rozszerzenia schematu bazy danych dla Google Assistant zostały pomyślnie zastosowane!' as status;