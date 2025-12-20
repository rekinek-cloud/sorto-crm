-- GTD Data Seeding Script (CORRECTED)
-- Wypełnienie pustych tabel danymi testowymi zgodnie z metodologią David Allen'a

-- 1. GTD Buckets (4 standardowe buckety) - poprawione kolumny
INSERT INTO gtd_buckets (id, name, description, "viewOrder", "organizationId", "createdAt", "updatedAt") VALUES
('gtd-bucket-1', 'Natychmiastowe', 'Zadania do wykonania natychmiast (< 2 minuty)', 1, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-bucket-2', 'Zaplanowane', 'Zadania zaplanowane na konkretną datę/czas', 2, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-bucket-3', 'Delegowane', 'Zadania przypisane innym osobom', 3, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-bucket-4', 'Może kiedyś', 'Pomysły i projekty na przyszłość (Someday/Maybe)', 4, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. GTD Horizons (6 poziomów perspektywy David Allen'a) - poprawione kolumny
INSERT INTO gtd_horizons (id, level, name, description, "reviewFrequency", "organizationId", "createdAt", "updatedAt") VALUES
('gtd-horizon-0', 0, 'Bieżące działania', 'Kalendarz i lista następnych działań', 'DAILY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-1', 1, 'Bieżące projekty', 'Wszystkie projekty wymagające więcej niż jednego kroku', 'WEEKLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-2', 2, 'Obszary odpowiedzialności', 'Role i ciągłe obszary uwagi', 'MONTHLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-3', 3, 'Cele 1-2 letnie', 'Cele i wizje na najbliższe 1-2 lata', 'QUARTERLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-4', 4, 'Wizja 3-5 letnia', 'Długoterminowa wizja i strategia', 'QUARTERLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-5', 5, 'Życiowa misja', 'Cel życiowy i podstawowe wartości', 'YEARLY', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. GTD Inbox Items (8 przykładowych elementów) - sprawdzę dokładne kolumny
INSERT INTO inbox_items (id, content, note, "sourceType", source, "urgencyScore", actionable, "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('inbox-1', 'Przygotować prezentację na Q4 planning', 'Deadline: koniec tygodnia, potrzebne dane finansowe', 'MEETING_NOTES', 'manual', 75, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-2', 'Kupić prezent na urodziny Marty', 'Urodziny 15 grudnia, lubi książki i rośliny', 'QUICK_CAPTURE', 'manual', 60, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-3', 'Pomysł: aplikacja do trackowania nawyków', 'Inspiracja z atomic habits, może warto rozwinąć?', 'IDEA', 'manual', 30, false, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-4', 'Rozmowa z Janem Kowalskim - nowy projekt CRM', 'Zainteresowany rozszerzeniem funkcjonalności GTD, budżet 50k', 'PHONE_CALL', 'manual', 85, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-5', 'Rachunek za hosting AWS - do zapłaty do 10.12', 'Kwota: $127.50, można zoptymalizować koszty?', 'BILL_INVOICE', 'manual', 70, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-6', 'Artykuł: "The Future of AI in Productivity Apps"', 'Bardzo dobre insights o trendy 2025, warto przeanalizować', 'ARTICLE', 'manual', 40, false, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-7', 'Umówić wizytę u dentysty', 'Profilaktyka, ostatnia wizyta 6 miesięcy temu', 'QUICK_CAPTURE', 'manual', 50, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-8', 'Zdjęcie whiteboardu z brainstormu zespołowego', 'Notes z meeting o nowych feature, trzeba przenieść do systemu', 'PHOTO', 'manual', 65, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Areas of Responsibility (przykładowe obszary)
INSERT INTO areas_of_responsibility (id, name, description, owner, "relatedProjects", "organizationId", "createdAt", "updatedAt") VALUES
('area-1', 'Rozwój Produktu', 'Zarządzanie rozwojem aplikacji CRM-GTD Smart', '30692326-88ed-4417-a41d-c9b4ebfdef08', ARRAY['Nowe funkcje GTD', 'Integracje API', 'Mobile app'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('area-2', 'Customer Success', 'Utrzymanie zadowolenia klientów i support', '30692326-88ed-4417-a41d-c9b4ebfdef08', ARRAY['Onboarding process', 'Help center', 'Customer feedback'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('area-3', 'Marketing & Sprzedaż', 'Pozyskiwanie nowych klientów i budowanie marki', '30692326-88ed-4417-a41d-c9b4ebfdef08', ARRAY['Content marketing', 'SEO optimization', 'Partnership program'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('area-4', 'Infrastruktura & DevOps', 'Utrzymanie systemów i bezpieczeństwa', '30692326-88ed-4417-a41d-c9b4ebfdef08', ARRAY['Cloud optimization', 'Security audit', 'Backup procedures'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Rozszerzenie kontekstów GTD (dodanie do istniejących 8)
INSERT INTO contexts (id, name, description, "organizationId", "createdAt", "updatedAt") VALUES
('context-low-energy', '@low-energy', 'Zadania wymagające niskiej energii', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('context-high-energy', '@high-energy', 'Zadania wymagające wysokiej energii', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('context-anywhere', '@anywhere', 'Zadania do wykonania wszędzie', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('context-agenda-boss', '@agenda-boss', 'Tematy do rozmowy z przełożonym', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;