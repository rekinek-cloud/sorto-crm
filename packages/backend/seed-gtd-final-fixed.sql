-- GTD Data Seeding Script (FINAL FIXED VERSION)
-- Poprawne nazwy kolumn i UUID z rzeczywistej bazy danych

-- Clean test data first
DELETE FROM gtd_buckets WHERE id LIKE 'gtd-bucket-%';
DELETE FROM gtd_horizons WHERE id LIKE 'gtd-horizon-%';
DELETE FROM inbox_items WHERE id LIKE 'inbox-%';
DELETE FROM areas_of_responsibility WHERE id LIKE 'area-%';

-- 1. GTD Buckets (4 standardowe buckety)
INSERT INTO gtd_buckets (id, name, description, "viewOrder", "organizationId", "createdAt", "updatedAt") VALUES
('gtd-bucket-1', 'Natychmiastowe', 'Zadania do wykonania natychmiast (< 2 minuty)', 1, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-bucket-2', 'Zaplanowane', 'Zadania zaplanowane na konkretną datę/czas', 2, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-bucket-3', 'Delegowane', 'Zadania przypisane innym osobom', 3, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-bucket-4', 'Może kiedyś', 'Pomysły i projekty na przyszłość (Someday/Maybe)', 4, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. GTD Horizons (6 poziomów perspektywy David Allen'a)
INSERT INTO gtd_horizons (id, level, name, description, "reviewFrequency", "organizationId", "createdAt", "updatedAt") VALUES
('gtd-horizon-0', 0, 'Bieżące działania', 'Kalendarz i lista następnych działań', 'DAILY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-1', 1, 'Bieżące projekty', 'Wszystkie projekty wymagające więcej niż jednego kroku', 'WEEKLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-2', 2, 'Obszary odpowiedzialności', 'Role i ciągłe obszary uwagi', 'MONTHLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-3', 3, 'Cele 1-2 letnie', 'Cele i wizje na najbliższe 1-2 lata', 'QUARTERLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-4', 4, 'Wizja 3-5 letnia', 'Długoterminowa wizja i strategia', 'QUARTERLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-5', 5, 'Życiowa misja', 'Cel życiowy i podstawowe wartości', 'YEARLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. GTD Inbox Items (8 przykładowych elementów) - POPRAWIONA KOLUMNA capturedById
INSERT INTO inbox_items (id, content, note, "sourceType", source, "urgencyScore", actionable, "organizationId", "capturedById", "createdAt", "updatedAt") VALUES
('inbox-1', 'Przygotować prezentację na Q4 planning', 'Deadline: koniec tygodnia, potrzebne dane finansowe', 'MEETING_NOTES', 'manual', 75, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '6a1ae76d-4fac-4502-8342-4740dce3f43d', NOW(), NOW()),
('inbox-2', 'Kupić prezent na urodziny Marty', 'Urodziny 15 grudnia, lubi książki i rośliny', 'QUICK_CAPTURE', 'manual', 60, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '6a1ae76d-4fac-4502-8342-4740dce3f43d', NOW(), NOW()),
('inbox-3', 'Pomysł: aplikacja do trackowania nawyków', 'Inspiracja z atomic habits, może warto rozwinąć?', 'IDEA', 'manual', 30, false, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '6a1ae76d-4fac-4502-8342-4740dce3f43d', NOW(), NOW()),
('inbox-4', 'Rozmowa z Janem Kowalskim - nowy projekt CRM', 'Zainteresowany rozszerzeniem funkcjonalności GTD, budżet 50k', 'PHONE_CALL', 'manual', 85, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '6a1ae76d-4fac-4502-8342-4740dce3f43d', NOW(), NOW()),
('inbox-5', 'Rachunek za hosting AWS - do zapłaty do 10.12', 'Kwota: $127.50, można zoptymalizować koszty?', 'BILL_INVOICE', 'manual', 70, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '6a1ae76d-4fac-4502-8342-4740dce3f43d', NOW(), NOW()),
('inbox-6', 'Artykuł: "The Future of AI in Productivity Apps"', 'Bardzo dobre insights o trendy 2025, warto przeanalizować', 'ARTICLE', 'manual', 40, false, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '6a1ae76d-4fac-4502-8342-4740dce3f43d', NOW(), NOW()),
('inbox-7', 'Umówić wizytę u dentysty', 'Profilaktyka, ostatnia wizyta 6 miesięcy temu', 'QUICK_CAPTURE', 'manual', 50, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '6a1ae76d-4fac-4502-8342-4740dce3f43d', NOW(), NOW()),
('inbox-8', 'Zdjęcie whiteboardu z brainstormu zespołowego', 'Notes z meeting o nowych feature, trzeba przenieść do systemu', 'PHOTO', 'manual', 65, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '6a1ae76d-4fac-4502-8342-4740dce3f43d', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Areas of Responsibility (przykładowe obszary)
INSERT INTO areas_of_responsibility (id, name, description, owner, "relatedProjects", "organizationId", "createdAt", "updatedAt") VALUES
('area-1', 'Rozwój Produktu', 'Zarządzanie rozwojem aplikacji CRM-GTD Smart', '6a1ae76d-4fac-4502-8342-4740dce3f43d', ARRAY['Nowe funkcje GTD', 'Integracje API', 'Mobile app'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('area-2', 'Customer Success', 'Utrzymanie zadowolenia klientów i support', '11f4ba11-edec-49eb-87c9-c7c8b26944c7', ARRAY['Onboarding process', 'Help center', 'Customer feedback'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('area-3', 'Marketing & Sprzedaż', 'Pozyskiwanie nowych klientów i budowanie marki', '423f6446-fc59-4131-8561-3f6f409d876a', ARRAY['Content marketing', 'SEO optimization', 'Partnership program'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('area-4', 'Infrastruktura & DevOps', 'Utrzymanie systemów i bezpieczeństwa', '6a1ae76d-4fac-4502-8342-4740dce3f43d', ARRAY['Cloud optimization', 'Security audit', 'Backup procedures'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;