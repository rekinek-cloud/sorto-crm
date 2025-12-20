-- STREAMS MIGRATION SQL
-- Data: 2025-11-28
-- Opis: Migracja z GTD/SMART na STREAMS metodologię

-- =====================================================
-- FAZA 4.1-4.2: Zmiana enumów statusów
-- =====================================================

-- Sprawdź czy enum istnieje i zmień wartości
DO $$
BEGIN
    -- Zmiana ACTIVE na FLOWING (jeśli istnieje)
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StreamStatus') THEN
        -- Nie można bezpośrednio zmienić wartości enum w PostgreSQL
        -- Musimy użyć obejścia przez ALTER TYPE ... ADD VALUE i UPDATE

        -- Dodaj nowe wartości jeśli nie istnieją
        BEGIN
            ALTER TYPE "StreamStatus" ADD VALUE IF NOT EXISTS 'FLOWING';
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;

        BEGIN
            ALTER TYPE "StreamStatus" ADD VALUE IF NOT EXISTS 'FROZEN';
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END $$;

-- Aktualizacja istniejących rekordów ze starymi statusami
UPDATE streams SET status = 'FLOWING' WHERE status = 'ACTIVE';
UPDATE streams SET status = 'FROZEN' WHERE status = 'ARCHIVED';

-- =====================================================
-- FAZA 4.3: Dodanie kolumny pattern do streams
-- =====================================================

-- Dodaj kolumnę pattern jeśli nie istnieje
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'streams' AND column_name = 'pattern'
    ) THEN
        ALTER TABLE streams ADD COLUMN pattern VARCHAR(50) DEFAULT 'custom';
    END IF;
END $$;

-- Ustaw wzorce na podstawie istniejących danych
UPDATE streams SET pattern = 'project' WHERE type = 'PROJECT' OR name ILIKE '%projekt%';
UPDATE streams SET pattern = 'continuous' WHERE type = 'AREA' OR name ILIKE '%obszar%';
UPDATE streams SET pattern = 'reference' WHERE type = 'REFERENCE' OR name ILIKE '%baza%' OR name ILIKE '%wiedza%';
UPDATE streams SET pattern = 'client' WHERE name ILIKE '%klient%' OR name ILIKE '%firma%';
UPDATE streams SET pattern = 'pipeline' WHERE name ILIKE '%pipeline%' OR name ILIKE '%sprzedaż%' OR name ILIKE '%lead%';

-- =====================================================
-- FAZA 4.4-4.5: Rename smartScore na streamScore
-- =====================================================

-- Rename w tabeli tasks
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'smart_score'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'stream_score'
    ) THEN
        ALTER TABLE tasks RENAME COLUMN smart_score TO stream_score;
    END IF;

    -- Alternatywnie dla camelCase
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'smartScore'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'streamScore'
    ) THEN
        ALTER TABLE tasks RENAME COLUMN "smartScore" TO "streamScore";
    END IF;
END $$;

-- Rename w tabeli projects
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'smart_score'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'stream_score'
    ) THEN
        ALTER TABLE projects RENAME COLUMN smart_score TO stream_score;
    END IF;

    -- Alternatywnie dla camelCase
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'smartScore'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'streamScore'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "smartScore" TO "streamScore";
    END IF;
END $$;

-- =====================================================
-- FAZA 4.6: Usunięcie kolumny gtdRole (jeśli istnieje)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'gtd_role'
    ) THEN
        ALTER TABLE tasks DROP COLUMN gtd_role;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'gtdRole'
    ) THEN
        ALTER TABLE tasks DROP COLUMN "gtdRole";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'streams' AND column_name = 'gtd_role'
    ) THEN
        ALTER TABLE streams DROP COLUMN gtd_role;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'streams' AND column_name = 'gtdRole'
    ) THEN
        ALTER TABLE streams DROP COLUMN "gtdRole";
    END IF;
END $$;

-- =====================================================
-- DODATKOWE: Tabela celów precyzyjnych (RZUT)
-- =====================================================

CREATE TABLE IF NOT EXISTS precise_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- RZUT fields
    result TEXT NOT NULL,           -- R - Rezultat
    measurement TEXT NOT NULL,      -- Z - Zmierzalność
    deadline TIMESTAMP NOT NULL,    -- U - Ujście (termin)
    background TEXT,                -- T - Tło (dlaczego)

    -- Metrics
    current_value DECIMAL(10,2) DEFAULT 0,
    target_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'count',

    -- Relations
    stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL,
    created_by_id UUID NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'failed', 'paused')),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    achieved_at TIMESTAMP
);

-- Indeksy dla celów
CREATE INDEX IF NOT EXISTS idx_precise_goals_org ON precise_goals(organization_id);
CREATE INDEX IF NOT EXISTS idx_precise_goals_stream ON precise_goals(stream_id);
CREATE INDEX IF NOT EXISTS idx_precise_goals_status ON precise_goals(status);
CREATE INDEX IF NOT EXISTS idx_precise_goals_deadline ON precise_goals(deadline);

-- =====================================================
-- WERYFIKACJA
-- =====================================================

-- Sprawdź wyniki migracji
DO $$
DECLARE
    flowing_count INTEGER;
    frozen_count INTEGER;
    pattern_count INTEGER;
    goals_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO flowing_count FROM streams WHERE status = 'FLOWING';
    SELECT COUNT(*) INTO frozen_count FROM streams WHERE status = 'FROZEN';
    SELECT COUNT(*) INTO pattern_count FROM streams WHERE pattern IS NOT NULL;
    SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'precise_goals') INTO goals_exists;

    RAISE NOTICE 'STREAMS Migration Results:';
    RAISE NOTICE '  - Streams FLOWING: %', flowing_count;
    RAISE NOTICE '  - Streams FROZEN: %', frozen_count;
    RAISE NOTICE '  - Streams with pattern: %', pattern_count;
    RAISE NOTICE '  - precise_goals table exists: %', goals_exists;
END $$;
