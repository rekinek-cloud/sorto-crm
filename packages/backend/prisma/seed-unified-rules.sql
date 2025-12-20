-- Seed data dla UnifiedRule - kompletne przykłady wszystkich możliwości
-- Organizacja ID: 8e14a6f5-470f-415d-9efb-0a655dd7a1df

-- 1. PROCESSING - Auto-zadania z pilnych emaili (EVENT_BASED)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority, 
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '🔄 Auto-zadania z pilnych emaili',
    'Automatyczne tworzenie zadań o wysokim priorytecie dla emaili oznaczonych jako pilne',
    'PROCESSING',
    'MESSAGE_PROCESSING',
    'ACTIVE',
    95,
    'EVENT_BASED',
    ARRAY['message_received', 'email_analyzed'],
    '{"subjectContains": ["PILNE", "URGENT", "ASAP", "!!!", "EMERGENCY"], "keywords": ["pilne", "natychmiast", "срочно", "emergency"], "minUrgencyScore": 80}',
    '{"createTask": {"title": "PILNE: Odpowiedź na email od {sender}", "description": "Email wymagający natychmiastowej uwagi: {subject}", "priority": "HIGH", "context": "@calls", "estimatedTime": 30, "dueDate": "+2h"}, "notify": {"users": ["manager@firma.pl"], "channels": ["#urgent"], "message": "Nowe pilne zadanie utworzone z emaila"}}',
    50,
    200,
    300,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 2. EMAIL_FILTER - Inteligentny filtr newsletterów i spam (EVENT_BASED)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '📧 Inteligentny filtr newsletterów i spam',
    'Automatyczne kategoryzowanie newsletterów, marketingu i spam z optymalizacją AI',
    'EMAIL_FILTER',
    'FILTERING',
    'ACTIVE',
    10,
    'EVENT_BASED',
    ARRAY['message_received'],
    '{"subjectContains": ["newsletter", "unsubscribe", "marketing", "promotion", "discount", "sale"], "senderDomain": ["mailchimp.com", "constantcontact.com", "sendgrid.net"], "bodyContains": ["unsubscribe", "marketing", "promotional"], "maxUrgencyScore": 30}',
    '{"categorize": "ARCHIVE", "skipAIAnalysis": true, "autoArchive": true, "addTag": {"name": "Newsletter", "color": "blue"}, "moveToFolder": "Archived/Newsletters"}',
    1000,
    10000,
    0,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 3. AUTO_REPLY - Potwierdzenie zapytań ofertowych (EVENT_BASED + warunki czasowe)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '🤖 Potwierdzenie zapytań ofertowych',
    'Automatyczne wysyłanie profesjonalnych potwierdzeń dla zapytań ofertowych w godzinach pracy',
    'AUTO_REPLY',
    'CUSTOMER_SERVICE',
    'ACTIVE',
    80,
    'EVENT_BASED',
    ARRAY['message_received'],
    '{"subjectContains": ["oferta", "wycena", "zapytanie", "quote", "quotation", "proposal"], "timeRange": {"start": "08:00", "end": "18:00", "timezone": "Europe/Warsaw"}, "daysOfWeek": [1, 2, 3, 4, 5], "senderEmail": ["*@gmail.com", "*@outlook.com", "*@*.pl", "*@*.com"]}',
    '{"sendAutoReply": {"template": "Dziękujemy za zapytanie ofertowe! Nasz zespół przygotuje szczegółową odpowiedź w ciągu 24 godzin roboczych. W pilnych sprawach prosimy o kontakt pod numerem +48 123 456 789.", "subject": "Potwierdzenie otrzymania zapytania ofertowego - {company}", "delay": 5, "onlyBusinessHours": true}, "createTask": {"title": "Przygotować ofertę dla {sender}", "priority": "HIGH", "context": "@computer", "dueDate": "+24h"}}',
    20,
    100,
    600,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 4. AI_RULE - Analiza sentymentu reklamacji z GPT-4 (EVENT_BASED)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    '🧠 Analiza sentymentu reklamacji z GPT-4',
    'AI-powered analiza sentymentu reklamacji z automatyczną eskalacją negatywnych przypadków',
    'AI_RULE',
    'SENTIMENT_ANALYSIS',
    'ACTIVE',
    70,
    'EVENT_BASED',
    ARRAY['message_received', 'complaint_detected'],
    '{"subjectContains": ["reklamacja", "skarga", "problem", "complaint", "issue", "disappointed", "angry"], "keywords": ["zły", "rozczarowany", "problem", "nie działa", "awful", "terrible"], "minUrgencyScore": 60}',
    '{"runAIAnalysis": {"analysisType": "sentiment", "modelId": "gpt-4", "promptTemplate": "Przeanalizuj sentiment tej reklamacji w skali 1-10 (1=bardzo negatywny, 10=pozytywny) i oceń poziom frustracji klienta. Zwróć JSON: {score, frustration_level, key_issues, recommended_action}"}, "conditionalActions": [{"condition": "sentiment_score < 3", "actions": {"notify": {"users": ["manager@firma.pl"], "channels": ["#customer-complaints"], "message": "ESKALACJA: Bardzo negatywna reklamacja wymaga natychmiastowej uwagi"}, "createTask": {"title": "ESKALACJA: Negatywna reklamacja od {sender}", "priority": "HIGH", "context": "@calls", "dueDate": "+2h"}}}]}',
    30,
    150,
    900,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 5. SMART_MAILBOX - VIP Klienci z multi-channel powiadomieniami (EVENT_BASED)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    '📮 VIP Klienci - Smart Mailbox Premium',
    'Automatyczne kierowanie emaili od VIP klientów do dedykowanej skrzynki z natychmiastowymi powiadomieniami',
    'SMART_MAILBOX',
    'VIP_MANAGEMENT',
    'ACTIVE',
    90,
    'EVENT_BASED',
    ARRAY['message_received'],
    '{"senderDomain": ["microsoft.com", "google.com", "apple.com", "samsung.com"], "keywords": ["CEO", "Director", "Manager", "VIP", "President", "CTO", "CFO"], "priority": "HIGH", "smartMailboxFilters": [{"field": "sender_company_value", "operator": ">", "value": "100000", "logicOperator": "OR"}, {"field": "sender_title", "operator": "contains", "value": "C-level", "logicOperator": "OR"}]}',
    '{"categorize": "VIP", "moveToFolder": "VIP/Clients", "notify": {"users": ["manager@firma.pl", "sales@firma.pl"], "channels": ["#vip-clients", "#sales-alerts"], "message": "🌟 NOWY EMAIL OD VIP KLIENTA: {sender} - {subject}"}, "addTag": {"name": "VIP", "color": "gold"}, "createTask": {"title": "Odpowiedź do VIP klienta: {sender}", "priority": "HIGH", "context": "@calls", "dueDate": "+4h"}}',
    100,
    500,
    0,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 6. WORKFLOW - Kompleksowy onboarding nowego klienta (MANUAL)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    '🔄 Kompleksowy workflow onboardingu klienta',
    'Multi-step proces wdrożenia nowego klienta z automatycznymi zadaniami, emailami i followup',
    'WORKFLOW',
    'ONBOARDING',
    'ACTIVE',
    85,
    'MANUAL',
    ARRAY['client_signed', 'manual_trigger'],
    '{}',
    '{"multiStepActions": [{"step": 1, "name": "Powitanie", "actions": {"sendAutoReply": {"template": "Witamy w naszej firmie! Dziękujemy za zaufanie. W ciągu 24h skontaktuje się z Państwem nasz konsultant ds. wdrożeń.", "subject": "Witamy w {company_name}!"}, "createTask": {"title": "Onboarding - kontakt z nowym klientem", "description": "Skontaktować się z klientem i omówić proces wdrożenia", "priority": "HIGH", "context": "@calls", "dueDate": "+24h"}}}, {"step": 2, "name": "Dokumentacja", "delay": 3600, "actions": {"createTask": {"title": "Przygotować dokumentację onboardingu", "description": "Przygotować i wysłać dokumenty wdrożeniowe", "priority": "MEDIUM", "context": "@computer", "dueDate": "+48h"}}}, {"step": 3, "name": "Followup", "delay": 7200, "actions": {"notify": {"users": ["sales@firma.pl"], "message": "Sprawdź status onboardingu klienta"}, "createTask": {"title": "Followup onboarding - sprawdzenie statusu", "priority": "MEDIUM", "context": "@calls", "dueDate": "+72h"}}}]}',
    5,
    20,
    3600,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 7. WORKFLOW - Automatyczne raporty tygodniowe (SCHEDULED)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '77777777-7777-7777-7777-777777777777',
    '⏰ Automatyczne raporty tygodniowe',
    'Generowanie i wysyłanie szczegółowych raportów aktywności każdy piątek o 17:00',
    'WORKFLOW',
    'REPORTING',
    'ACTIVE',
    50,
    'SCHEDULED',
    ARRAY['weekly_schedule'],
    '{"timeRange": {"start": "17:00", "end": "17:30", "timezone": "Europe/Warsaw"}, "daysOfWeek": [5], "weeklyRecurrence": true}',
    '{"generateReport": {"type": "weekly_summary", "includeMetrics": ["emails_processed", "tasks_created", "rules_executed", "success_rate"], "format": "pdf"}, "sendAutoReply": {"template": "Raport tygodniowy z aktywności systemu CRM-GTD w załączeniu. Podsumowanie: {total_emails} emaili, {total_tasks} zadań, {success_rate}% skuteczności.", "subject": "Raport tygodniowy CRM-GTD - tydzień {week_number}", "recipients": ["manager@firma.pl", "admin@firma.pl"]}, "createTask": {"title": "Przegląd raportu tygodniowego", "description": "Przeanalizować raport i zaplanować optymalizacje", "priority": "MEDIUM", "context": "@computer", "dueDate": "+72h"}}',
    1,
    1,
    86400,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 8. NOTIFICATION - Alerty systemowe i monitoring (AUTOMATIC)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '88888888-8888-8888-8888-888888888888',
    '🔔 Monitoring systemu i alerty bezpieczeństwa',
    'Automatyczne monitorowanie systemu z alertami o problemach, anomaliach i wysokiej aktywności',
    'NOTIFICATION',
    'SYSTEM_MONITORING',
    'ACTIVE',
    95,
    'AUTOMATIC',
    ARRAY['system_check', 'anomaly_detected', 'high_activity'],
    '{"systemChecks": ["api_response_time", "database_health", "error_rate", "memory_usage"], "thresholds": {"api_response_time": 5000, "error_rate": 0.05, "memory_usage": 0.8}, "anomalyDetection": {"unusual_activity_multiplier": 3, "check_interval": 300}}',
    '{"conditionalAlerts": [{"condition": "api_response_time > 5000", "actions": {"notify": {"users": ["admin@firma.pl"], "channels": ["#system-alerts"], "message": "⚠️ ALERT: Wolny czas odpowiedzi API: {response_time}ms"}, "createTask": {"title": "Sprawdzić wydajność API", "priority": "HIGH", "context": "@computer", "dueDate": "+30m"}}}, {"condition": "error_rate > 0.05", "actions": {"notify": {"users": ["admin@firma.pl"], "channels": ["#system-alerts"], "message": "🚨 CRITICAL: Wysoki poziom błędów: {error_rate}%"}}}, {"condition": "unusual_activity", "actions": {"notify": {"users": ["security@firma.pl"], "channels": ["#security"], "message": "🔍 Wykryto nietypową aktywność w systemie"}}}]}',
    120,
    1000,
    60,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 9. INTEGRATION - Synchronizacja z zewnętrznym CRM (WEBHOOK)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '99999999-9999-9999-9999-999999999999',
    '🌐 Synchronizacja z zewnętrznym CRM',
    'Dwukierunkowa integracja z zewnętrznym systemem CRM przez webhook z automatyczną synchronizacją kontaktów',
    'INTEGRATION',
    'CRM_SYNC',
    'ACTIVE',
    75,
    'WEBHOOK',
    ARRAY['contact_created', 'deal_updated', 'external_webhook'],
    '{"webhook": {"source_systems": ["salesforce", "hubspot", "pipedrive"], "auth_required": true, "data_validation": true}, "subjectContains": ["business", "partnership", "collaboration", "contract"], "hasAttachment": true, "senderDomain": ["*.com", "*.org", "*.pl"]}',
    '{"webhook": {"url": "https://api.external-crm.com/sync", "method": "POST", "headers": {"Authorization": "Bearer {api_token}", "Content-Type": "application/json", "X-Source": "crm-gtd-smart"}, "data": {"contact_data": "{contact_info}", "deal_data": "{deal_info}", "sync_timestamp": "{timestamp}", "source_system": "crm-gtd"}}, "updateContact": {"status": "synced", "tags": ["external_crm"], "notes": "Zsynchronizowany z zewnętrznym CRM: {timestamp}"}, "createTask": {"title": "Sprawdzić synchronizację CRM dla {contact}", "description": "Zweryfikować czy dane zostały poprawnie zsynchronizowane", "priority": "MEDIUM", "context": "@computer", "dueDate": "+24h"}}',
    50,
    500,
    300,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 10. AI_RULE - Masowa analiza i klasyfikacja (API_CALL)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '10101010-1010-1010-1010-101010101010',
    '📊 Masowa analiza AI i klasyfikacja',
    'Batch processing emaili przez AI do klasyfikacji, analizy językowej i automatycznej kategoryzacji',
    'AI_RULE',
    'BATCH_PROCESSING',
    'ACTIVE',
    30,
    'API_CALL',
    ARRAY['batch_process_request', 'api_trigger'],
    '{"batchProcessing": true, "minUrgencyScore": 1, "maxBatchSize": 100, "analysisTypes": ["classification", "language_detection", "spam_detection", "sentiment_basic"]}',
    '{"runAIAnalysis": {"analysisType": "multi", "modelId": "gpt-3.5-turbo", "promptTemplate": "Przeanalizuj ten email i zwróć JSON z: 1) category (business/personal/newsletter/spam), 2) language (pl/en/de/fr), 3) urgency (1-10), 4) sentiment (-1 do 1), 5) key_topics (array). Email: {content}", "batchMode": true}, "categorizeResults": {"business": "BUSINESS", "personal": "PERSONAL", "newsletter": "ARCHIVE", "spam": "SPAM"}, "conditionalActions": [{"condition": "category == spam", "actions": {"autoDelete": true, "addTag": {"name": "Auto-deleted spam", "color": "red"}}}, {"condition": "urgency >= 8", "actions": {"notify": {"users": ["manager@firma.pl"], "message": "AI wykryło email o wysokiej pilności"}}}, {"condition": "sentiment < -0.5", "actions": {"addTag": {"name": "Negative sentiment", "color": "orange"}}}]}',
    1000,
    10000,
    0,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 11. PROCESSING - Smart task creation z GTD (EVENT_BASED + zaawansowane warunki)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '11111111-2222-3333-4444-555555555555',
    '✅ Smart GTD Task Creation',
    'Inteligentne tworzenie zadań GTD z automatycznym przypisywaniem kontekstów, priorytetów i terminów na podstawie analizy treści',
    'PROCESSING',
    'GTD_AUTOMATION',
    'ACTIVE',
    85,
    'EVENT_BASED',
    ARRAY['message_received', 'task_keyword_detected'],
    '{"subjectContains": ["TODO", "ACTION", "TASK", "DO:", "ZRÓB:", "ZADANIE"], "keywords": ["zrób", "wykonaj", "przygotuj", "skontaktuj", "sprawdź", "odpowiedz", "wyślij"], "hasAttachment": false, "contextKeywords": {"@calls": ["telefon", "dzwoń", "rozmowa", "call"], "@computer": ["email", "dokument", "raport", "analiza"], "@office": ["spotkanie", "meeting", "prezentacja"], "@errands": ["kupi", "załatw", "idź do"]}}',
    '{"createTask": {"title": "{extracted_action}", "description": "Automatycznie utworzone z emaila: {subject}\\n\\nOryginalny email od: {sender}\\nData: {date}\\n\\nTreść zadania:\\n{extracted_task_details}", "priority": "{auto_priority}", "context": "{auto_context}", "estimatedTime": "{estimated_minutes}", "dueDate": "{auto_due_date}"}, "smartExtraction": {"action_extraction": true, "priority_detection": {"keywords_high": ["pilne", "urgent", "asap"], "keywords_medium": ["ważne", "important"], "default": "MEDIUM"}, "context_detection": {"phone_keywords": "@calls", "computer_keywords": "@computer", "meeting_keywords": "@office", "default": "@inbox"}, "due_date_extraction": {"patterns": ["do (.+)", "until (.+)", "by (.+)", "deadline (.+)"], "default_offset": "+3d"}}, "addToInbox": true}',
    80,
    400,
    180,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);

-- 12. SMART_MAILBOX - Intelligent Project Categorization (EVENT_BASED)
INSERT INTO "UnifiedRule" (
    id, name, description, "ruleType", category, status, priority,
    "triggerType", "triggerEvents", conditions, actions,
    "maxExecutionsPerHour", "maxExecutionsPerDay", "cooldownPeriod",
    "organizationId", "createdBy", "createdAt", "updatedAt"
) VALUES (
    '12121212-1212-1212-1212-121212121212',
    '🗂️ Inteligentna kategoryzacja projektów',
    'Automatyczne przypisywanie emaili do projektów na podstawie analizy treści, nadawców i słów kluczowych',
    'SMART_MAILBOX',
    'PROJECT_MANAGEMENT',
    'ACTIVE',
    75,
    'EVENT_BASED',
    ARRAY['message_received'],
    '{"projectKeywords": {"Website Project": ["strona", "website", "www", "domain", "hosting"], "Mobile App": ["aplikacja", "app", "mobile", "android", "ios"], "Marketing Campaign": ["marketing", "campaign", "reklama", "social media", "facebook"], "Database Migration": ["baza danych", "database", "migration", "sql", "postgresql"]}, "smartMailboxFilters": [{"field": "subject", "operator": "contains_any", "value": ["projekt", "project"], "logicOperator": "AND"}, {"field": "sender_history", "operator": "project_related", "value": "any", "logicOperator": "OR"}]}',
    '{"autoAssignToProject": true, "moveToFolder": "Projects/{detected_project}", "addTag": {"name": "{detected_project}", "color": "purple"}, "createProjectTask": {"title": "Nowa wiadomość w projekcie {detected_project}", "description": "Email od {sender}: {subject}\\n\\nWiadomość wymaga sprawdzenia w kontekście projektu.", "priority": "MEDIUM", "context": "@computer", "dueDate": "+2d"}, "notify": {"users": ["project-manager@firma.pl"], "channels": ["#projects"], "message": "📧 Nowy email w projekcie {detected_project} od {sender}"}, "updateProjectStatus": {"last_activity": "{timestamp}", "status": "active"}}',
    200,
    1000,
    60,
    '8e14a6f5-470f-415d-9efb-0a655dd7a1df',
    null,
    NOW(),
    NOW()
);