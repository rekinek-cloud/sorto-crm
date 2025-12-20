-- GTD Data Seeding Script
-- Wypełnienie pustych tabel danymi testowymi zgodnie z metodologią David Allen'a

-- 1. GTD Buckets (4 standardowe buckety)
INSERT INTO gtd_buckets (id, name, description, "viewOrder", "organizationId", "createdAt", "updatedAt") VALUES
('gtd-bucket-1', 'Natychmiastowe', 'Zadania do wykonania natychmiast (< 2 minuty)', '#10B981', 1, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-bucket-2', 'Zaplanowane', 'Zadania zaplanowane na konkretną datę/czas', '#3B82F6', 2, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-bucket-3', 'Delegowane', 'Zadania przypisane innym osobom', '#F59E0B', 3, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-bucket-4', 'Może kiedyś', 'Pomysły i projekty na przyszłość (Someday/Maybe)', '#8B5CF6', 4, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. GTD Horizons (6 poziomów perspektywy David Allen'a)
INSERT INTO gtd_horizons (id, level, name, description, "focusArea", color, "organizationId", "createdAt", "updatedAt") VALUES
('gtd-horizon-0', 0, 'Bieżące działania', 'Kalendarz i lista następnych działań', 'Current actions and calendar items', '#EF4444', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-1', 1, 'Bieżące projekty', 'Wszystkie projekty wymagające więcej niż jednego kroku', 'Current projects and commitments', '#F97316', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-2', 2, 'Obszary odpowiedzialności', 'Role i ciągłe obszary uwagi', 'Areas of responsibility and focus', '#EAB308', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-3', 3, 'Cele 1-2 letnie', 'Cele i wizje na najbliższe 1-2 lata', 'Goals and visions (1-2 years)', '#22C55E', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-4', 4, 'Wizja 3-5 letnia', 'Długoterminowa wizja i strategia', 'Long-term visions (3-5 years)', '#3B82F6', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('gtd-horizon-5', 5, 'Życiowa misja', 'Cel życiowy i podstawowe wartości', 'Life purpose and core values', '#8B5CF6', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. GTD Inbox Items (8 przykładowych elementów)
INSERT INTO inbox_items (id, content, note, "sourceType", "urgencyScore", actionable, "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('inbox-1', 'Przygotować prezentację na Q4 planning', 'Deadline: koniec tygodnia, potrzebne dane finansowe', 'MEETING_NOTES', 75, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-2', 'Kupić prezent na urodziny Marty', 'Urodziny 15 grudnia, lubi książki i roślin', 'QUICK_CAPTURE', 60, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-3', 'Pomysł: aplikacja do trackowania nawyków', 'Inspiracja z atomic habits, może warto rozwinąć?', 'IDEA', 30, false, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-4', 'Rozmowa z Janem Kowalskim - nowy projekt CRM', 'Interested w rozszerzeniu funkcjonalności GTD, budżet 50k', 'PHONE_CALL', 85, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-5', 'Rachunek za hosting AWS - do zapłaty do 10.12', 'Kwota: $127.50, można zoptymalizować koszty?', 'BILL_INVOICE', 70, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-6', 'Artykuł: "The Future of AI in Productivity Apps"', 'Bardzo dobre insights o trendy 2025, warto przeanalizować', 'ARTICLE', 40, false, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-7', 'Umówić wizytę u dentysty', 'Profilaktyka, ostatnia wizyta 6 miesięcy temu', 'QUICK_CAPTURE', 50, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW()),
('inbox-8', 'Zdjęcie whiteboardu z brainstormu zespołowego', 'Notes z meeting o nowych feature, trzeba przenieść do systemu', 'PHOTO', 65, true, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', '30692326-88ed-4417-a41d-c9b4ebfdef08', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Areas of Responsibility (przykładowe obszary)
INSERT INTO areas_of_responsibility (id, name, description, owner, "relatedProjects", "organizationId", "createdAt", "updatedAt") VALUES
('area-1', 'Rozwój Produktu', 'Zarządzanie rozwojem aplikacji CRM-GTD Smart', '30692326-88ed-4417-a41d-c9b4ebfdef08', ARRAY['Nowe funkcje GTD', 'Integracje API', 'Mobile app'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('area-2', 'Customer Success', 'Utrzymanie zadowolenia klientów i support', '30692326-88ed-4417-a41d-c9b4ebfdef08', ARRAY['Onboarding process', 'Help center', 'Customer feedback'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('area-3', 'Marketing & Sprzedaż', 'Pozyskiwanie nowych klientów i budowanie marki', '30692326-88ed-4417-a41d-c9b4ebfdef08', ARRAY['Content marketing', 'SEO optimization', 'Partnership program'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('area-4', 'Infrastruktura & DevOps', 'Utrzymanie systemów i bezpieczeństwa', '30692326-88ed-4417-a41d-c9b4ebfdef08', ARRAY['Cloud optimization', 'Security audit', 'Backup procedures'], 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Dodatkowe Communication Channels (rozszerzenie istniejących)
INSERT INTO communication_channels (id, name, type, "isActive", "settings", "organizationId", "createdAt", "updatedAt") VALUES
('channel-teams-general', 'Microsoft Teams - General', 'TEAMS', true, '{"webhook": "https://teams.example.com/webhook", "notifications": true}', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('channel-whatsapp-support', 'WhatsApp Business', 'WHATSAPP', true, '{"number": "+48123456789", "businessAccount": true}', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('channel-discord-dev', 'Discord - Dev Team', 'DISCORD', true, '{"serverId": "123456789", "channelId": "987654321"}', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Rozszerzenie kontekstów GTD (dodanie do istniejących 8)
INSERT INTO contexts (id, name, description, color, "organizationId", "createdAt", "updatedAt") VALUES
('context-low-energy', '@low-energy', 'Zadania wymagające niskiej energii', '#94A3B8', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('context-high-energy', '@high-energy', 'Zadania wymagające wysokiej energii', '#DC2626', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('context-anywhere', '@anywhere', 'Zadania do wykonania wszędzie', '#059669', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('context-agenda-boss', '@agenda-boss', 'Tematy do rozmowy z przełożonym', '#7C3AED', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;