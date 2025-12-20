-- Migration to add Views support to CRM-GTD Smart
-- Based on Sorto.AI Views Implementation documentation

-- Views Configuration table
CREATE TABLE view_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    view_type VARCHAR(50) NOT NULL CHECK (view_type IN ('kanban', 'gantt', 'scrum', 'calendar', 'list')),
    view_name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_user_default_per_type UNIQUE (user_id, view_type, is_default)
);

-- Kanban columns configuration
CREATE TABLE kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_id UUID REFERENCES view_configurations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    wip_limit INTEGER,
    column_type VARCHAR(50) DEFAULT 'stage' CHECK (column_type IN ('stage', 'priority', 'context', 'sentiment')),
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (view_id, position)
);

-- User view preferences
CREATE TABLE user_view_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    view_type VARCHAR(50) NOT NULL CHECK (view_type IN ('kanban', 'gantt', 'scrum', 'calendar', 'list')),
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, view_type)
);

-- Add view-specific fields to existing items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS kanban_position INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS kanban_column_id VARCHAR(50);
ALTER TABLE items ADD COLUMN IF NOT EXISTS gantt_start_date TIMESTAMP;
ALTER TABLE items ADD COLUMN IF NOT EXISTS gantt_end_date TIMESTAMP;
ALTER TABLE items ADD COLUMN IF NOT EXISTS gantt_duration INTEGER; -- days
ALTER TABLE items ADD COLUMN IF NOT EXISTS gantt_progress DECIMAL(5,2) DEFAULT 0; -- percentage
ALTER TABLE items ADD COLUMN IF NOT EXISTS scrum_story_points INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS scrum_sprint_id UUID;

-- Task dependencies for Gantt charts
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    predecessor_id UUID REFERENCES items(id) ON DELETE CASCADE,
    successor_id UUID REFERENCES items(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(predecessor_id, successor_id)
);

-- Sprint management
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    velocity INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI predictions and insights
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('win_probability', 'close_date', 'sentiment', 'complexity')),
    predicted_value JSONB NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    factors JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP -- When prediction becomes stale
);

-- User interactions with views for analytics
CREATE TABLE IF NOT EXISTS view_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    view_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'opened', 'filtered', 'drag_drop', 'created_task'
    metadata JSONB DEFAULT '{}',
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_view_configurations_user_type ON view_configurations(user_id, view_type);
CREATE INDEX IF NOT EXISTS idx_view_configurations_public ON view_configurations(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_kanban_columns_view_position ON kanban_columns(view_id, position);
CREATE INDEX IF NOT EXISTS idx_items_kanban_column ON items(kanban_column_id) WHERE kanban_column_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_sprint ON items(scrum_sprint_id) WHERE scrum_sprint_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_item ON ai_predictions(item_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_view_analytics_user_type ON view_analytics(user_id, view_type);
CREATE INDEX IF NOT EXISTS idx_view_analytics_created ON view_analytics(created_at);

-- Insert default view configurations for existing users
INSERT INTO view_configurations (user_id, view_type, view_name, configuration, is_default, is_public)
SELECT 
    u.id,
    'kanban',
    'Sales Pipeline',
    '{"columns": [
        {"id": "lead", "title": "Prospecting", "color": "#3B82F6", "order": 1},
        {"id": "qualified", "title": "Qualified", "color": "#10B981", "order": 2},
        {"id": "proposal", "title": "Proposal", "color": "#F59E0B", "order": 3},
        {"id": "negotiation", "title": "Negotiation", "color": "#EF4444", "order": 4},
        {"id": "closed", "title": "Closed Won", "color": "#8B5CF6", "order": 5}
    ]}',
    true,
    false
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM view_configurations vc 
    WHERE vc.user_id = u.id AND vc.view_type = 'kanban' AND vc.is_default = true
);

INSERT INTO view_configurations (user_id, view_type, view_name, configuration, is_default, is_public)
SELECT 
    u.id,
    'list',
    'Today''s Tasks',
    '{"filters": {"dueDate": "today"}, "groupBy": "priority", "sortBy": "dueDate"}',
    true,
    false
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM view_configurations vc 
    WHERE vc.user_id = u.id AND vc.view_type = 'list' AND vc.is_default = true
);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_view_configurations_updated_at 
    BEFORE UPDATE ON view_configurations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_view_preferences_updated_at 
    BEFORE UPDATE ON user_view_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at 
    BEFORE UPDATE ON sprints 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();