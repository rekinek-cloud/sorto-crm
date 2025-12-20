-- Migracja: Dodanie tabel do logowania interakcji głosowych
-- Data: 2025-07-04
-- Opis: Rozszerzenie schematu bazy danych o funkcjonalności Google Assistant

-- Tabela do logowania interakcji głosowych
CREATE TABLE IF NOT EXISTS voice_interactions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    intent VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}',
    response TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    processing_time INTEGER, -- w milisekundach
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'GOOGLE_ASSISTANT', -- GOOGLE_ASSISTANT, NEST_HUB, MOBILE_APP
    locale VARCHAR(10) DEFAULT 'pl',
    device_info JSONB DEFAULT '{}',
    
    -- Indeksy dla wydajności
    INDEX idx_voice_interactions_session_id (session_id),
    INDEX idx_voice_interactions_user_id (user_id),
    INDEX idx_voice_interactions_intent (intent),
    INDEX idx_voice_interactions_timestamp (timestamp),
    INDEX idx_voice_interactions_source (source),
    INDEX idx_voice_interactions_success (success)
);

-- Tabela konfiguracji Google Assistant dla użytkowników
CREATE TABLE IF NOT EXISTS user_google_assistant_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    google_account_id VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'pl',
    voice_speed DECIMAL(3,2) DEFAULT 1.0, -- 0.5 - 2.0
    default_context VARCHAR(50) DEFAULT '@computer',
    auto_create_tasks BOOLEAN DEFAULT TRUE,
    voice_confirmations BOOLEAN DEFAULT TRUE,
    privacy_mode BOOLEAN DEFAULT FALSE,
    
    -- Preferencje dla różnych typów poleceń
    task_creation_preferences JSONB DEFAULT '{
        "default_priority": "MEDIUM",
        "default_context": "@computer",
        "require_confirmation": false
    }',
    
    project_creation_preferences JSONB DEFAULT '{
        "default_status": "PLANNING",
        "default_priority": "MEDIUM",
        "require_confirmation": true
    }',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_google_assistant_config_user_id (user_id),
    INDEX idx_user_google_assistant_config_google_account (google_account_id)
);

-- Tabela sesji Google Assistant
CREATE TABLE IF NOT EXISTS google_assistant_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    total_interactions INTEGER DEFAULT 0,
    successful_interactions INTEGER DEFAULT 0,
    failed_interactions INTEGER DEFAULT 0,
    
    -- Kontekst sesji
    conversation_state JSONB DEFAULT '{}',
    device_type VARCHAR(50), -- speaker, display, phone, etc.
    device_capabilities JSONB DEFAULT '[]',
    
    INDEX idx_google_assistant_sessions_session_id (session_id),
    INDEX idx_google_assistant_sessions_user_id (user_id),
    INDEX idx_google_assistant_sessions_started_at (started_at),
    INDEX idx_google_assistant_sessions_device_type (device_type)
);

-- Tabela konfiguracji Nest Hub widgets
CREATE TABLE IF NOT EXISTS nest_hub_widgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL, -- TASK_SUMMARY, CALENDAR, CONTACTS, PROJECTS, WEATHER, NEWS
    title VARCHAR(255) NOT NULL,
    configuration JSONB DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    refresh_interval INTEGER DEFAULT 300, -- w sekundach
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_nest_hub_widgets_user_id (user_id),
    INDEX idx_nest_hub_widgets_type (widget_type),
    INDEX idx_nest_hub_widgets_active (is_active)
);

-- Tabela logowania poleceń głosowych (dla analytics)
CREATE TABLE IF NOT EXISTS voice_command_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    intent VARCHAR(255) NOT NULL,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    avg_processing_time DECIMAL(10,2), -- w milisekundach
    unique_users INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    
    -- Agregacja per źródło
    source_breakdown JSONB DEFAULT '{}', -- {"GOOGLE_ASSISTANT": 10, "NEST_HUB": 5}
    
    UNIQUE(date, intent),
    INDEX idx_voice_command_analytics_date (date),
    INDEX idx_voice_command_analytics_intent (intent)
);

-- Tabela autoryzacji Google services
CREATE TABLE IF NOT EXISTS google_service_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    google_account_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT, -- przestrzeń nazw uprawnień
    
    -- Metadane
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_google_service_tokens_user_id (user_id),
    INDEX idx_google_service_tokens_google_account (google_account_id),
    INDEX idx_google_service_tokens_expires_at (expires_at)
);

-- Triggery do automatycznego update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_google_assistant_config_updated_at 
    BEFORE UPDATE ON user_google_assistant_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nest_hub_widgets_updated_at 
    BEFORE UPDATE ON nest_hub_widgets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_service_tokens_updated_at 
    BEFORE UPDATE ON google_service_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funkcja do tworzenia domyślnej konfiguracji Google Assistant dla nowego użytkownika
CREATE OR REPLACE FUNCTION create_default_google_assistant_config()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_google_assistant_config (user_id) 
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger do automatycznego tworzenia konfiguracji dla nowych użytkowników
CREATE TRIGGER create_google_assistant_config_for_new_user
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_google_assistant_config();

-- Procedura do czyszczenia starych logów (starszych niż 90 dni)
CREATE OR REPLACE FUNCTION cleanup_old_voice_interactions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM voice_interactions 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Czyścimy również stare sesje
    DELETE FROM google_assistant_sessions 
    WHERE started_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Widok do statystyk głosowych (ostatnie 30 dni)
CREATE OR REPLACE VIEW voice_interaction_stats AS
SELECT 
    DATE(timestamp) as date,
    intent,
    source,
    COUNT(*) as total_interactions,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_interactions,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_interactions,
    ROUND(AVG(processing_time), 2) as avg_processing_time,
    COUNT(DISTINCT user_id) as unique_users
FROM voice_interactions 
WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE(timestamp), intent, source
ORDER BY date DESC, total_interactions DESC;

-- Widok do top intents (ostatnie 7 dni)
CREATE OR REPLACE VIEW top_voice_intents AS
SELECT 
    intent,
    COUNT(*) as usage_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as usage_percentage,
    ROUND(AVG(processing_time), 2) as avg_processing_time,
    ROUND(COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM voice_interactions 
WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY intent
ORDER BY usage_count DESC
LIMIT 10;

-- Komentarze do tabel
COMMENT ON TABLE voice_interactions IS 'Logowanie wszystkich interakcji głosowych z Google Assistant';
COMMENT ON TABLE user_google_assistant_config IS 'Konfiguracja Google Assistant dla poszczególnych użytkowników';
COMMENT ON TABLE google_assistant_sessions IS 'Sesje rozmów z Google Assistant';
COMMENT ON TABLE nest_hub_widgets IS 'Konfiguracja widgetów na Nest Hub';
COMMENT ON TABLE voice_command_analytics IS 'Dzienne statystyki poleceń głosowych';
COMMENT ON TABLE google_service_tokens IS 'Tokeny autoryzacyjne dla Google services';

-- Przykładowe dane testowe
INSERT INTO voice_command_analytics (date, intent, success_count, failure_count, avg_processing_time, unique_users, total_interactions)
VALUES 
    (CURRENT_DATE, 'crm_gtd.add_task', 25, 2, 850.5, 5, 27),
    (CURRENT_DATE, 'crm_gtd.show_tasks', 18, 1, 450.2, 4, 19),
    (CURRENT_DATE, 'crm_gtd.create_project', 8, 0, 1200.3, 3, 8),
    (CURRENT_DATE, 'crm_gtd.show_contacts', 12, 1, 650.8, 3, 13),
    (CURRENT_DATE, 'crm_gtd.process_inbox', 6, 0, 300.1, 2, 6);

-- Komunikat o ukończeniu migracji
SELECT 'Migracja voice_interactions zakończona pomyślnie!' as status;