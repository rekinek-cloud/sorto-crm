-- KNOWLEDGE BASE - FOLDERS
-- Hierarchiczna struktura folderów

INSERT INTO folders (id, name, description, color, "isSystem", "parentId", "organizationId", "createdAt", "updatedAt") VALUES
-- Root folders
('folder-docs', 'Dokumentacja', 'Główny folder dokumentacji systemowej', '#3B82F6', false, NULL, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-policies', 'Polityki i Procedury', 'Firmowe polityki i procedury', '#EF4444', false, NULL, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-projects', 'Projekty', 'Dokumentacja projektowa', '#10B981', false, NULL, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-training', 'Szkolenia', 'Materiały szkoleniowe', '#F59E0B', false, NULL, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),

-- Subfolders
('folder-tech-docs', 'Dokumentacja Techniczna', 'API, architektury, konfiguracje', '#6366F1', false, 'folder-docs', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-user-guides', 'Przewodniki Użytkownika', 'Instrukcje dla użytkowników końcowych', '#8B5CF6', false, 'folder-docs', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-hr-policies', 'Polityki HR', 'Zarządzanie zasobami ludzkimi', '#EC4899', false, 'folder-policies', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-security', 'Bezpieczeństwo', 'Polityki bezpieczeństwa IT', '#DC2626', false, 'folder-policies', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;