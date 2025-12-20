# Voice Integration Database Schema Documentation

## Przegląd

Ten dokument opisuje rozszerzenie bazy danych CRM-GTD Smart o funkcjonalności voice interactions i integrację z Google Nest Hub. Migracja dodaje 5 nowych tabel oraz rozszerza 4 istniejące tabele o pola związane z obsługą głosową.

---

## 📋 Spis Treści

1. [Nowe Tabele](#nowe-tabele)
2. [Rozszerzenia Istniejących Tabel](#rozszerzenia-istniejących-tabel)  
3. [Indeksy i Optymalizacje](#indeksy-i-optymalizacje)
4. [Widoki (Views)](#widoki-views)
5. [Triggery i Funkcje](#triggery-i-funkcje)
6. [Przykłady Użycia](#przykłady-użycia)
7. [Migracja i Rollback](#migracja-i-rollback)

---

## 🆕 Nowe Tabele

### 1. **voice_interactions**

**Opis**: Centralna tabela logująca wszystkie interakcje głosowe z systemem.

#### Struktura:

| Pole | Typ | Opis | Wymagane | Domyślna |
|------|-----|------|----------|----------|
| `id` | UUID | Unikalny identyfikator interakcji | ✅ | `gen_random_uuid()` |
| `session_id` | VARCHAR(255) | ID sesji głosowej | ❌ | - |
| `user_id` | UUID | ID użytkownika | ✅ | - |
| `organization_id` | UUID | ID organizacji | ✅ | - |
| `intent` | VARCHAR(255) | Rodzaj komendy (np. "crm_gtd.add_task") | ✅ | - |
| `original_phrase` | TEXT | Oryginalna fraza wypowiedziana przez użytkownika | ✅ | - |
| `processed_phrase` | TEXT | Przetworzona/znormalizowana fraza | ❌ | - |
| `confidence_score` | DECIMAL(3,2) | Pewność rozpoznania mowy (0.00-1.00) | ❌ | - |
| `language` | VARCHAR(10) | Język interakcji | ❌ | `'pl-PL'` |
| `parameters` | JSONB | Wyextraktowane parametry z głosu | ❌ | `'{}'` |
| `entities` | JSONB | Rozpoznane jednostki (osoby, miejsca, daty) | ❌ | `'{}'` |
| `context_data` | JSONB | Dodatkowe informacje kontekstowe | ❌ | `'{}'` |
| `response_type` | VARCHAR(50) | Typ odpowiedzi ("SUCCESS", "ERROR", "CLARIFICATION_NEEDED") | ✅ | - |
| `response_text` | TEXT | Tekst odpowiedzi asystenta | ❌ | - |
| `response_data` | JSONB | Strukturalne dane odpowiedzi | ❌ | `'{}'` |
| `display_data` | JSONB | Dane do wyświetlenia na Nest Hub | ❌ | `'{}'` |
| `processing_time_ms` | INTEGER | Czas przetwarzania w milisekundach | ❌ | - |
| `api_calls_made` | JSONB | Lista wywołanych API | ❌ | `'[]'` |
| `errors` | JSONB | Lista błędów podczas przetwarzania | ❌ | `'[]'` |
| `source_device` | VARCHAR(100) | Typ urządzenia ("google_home", "nest_hub") | ❌ | - |
| `device_id` | VARCHAR(255) | Identyfikator urządzenia | ❌ | - |
| `location` | VARCHAR(255) | Fizyczna lokalizacja urządzenia | ❌ | - |
| `ip_address` | INET | Adres IP żądania | ❌ | - |
| `user_agent` | TEXT | User Agent urządzenia | ❌ | - |
| `actions_performed` | JSONB | Lista wykonanych akcji | ❌ | `'[]'` |
| `created_entities` | JSONB | ID utworzonych encji (zadania, kontakty, itp.) | ❌ | `'{}'` |
| `modified_entities` | JSONB | ID zmodyfikowanych encji | ❌ | `'{}'` |
| `interaction_at` | TIMESTAMPTZ | Czas interakcji | ✅ | `NOW()` |
| `processed_at` | TIMESTAMPTZ | Czas zakończenia przetwarzania | ❌ | - |
| `created_at` | TIMESTAMPTZ | Czas utworzenia rekordu | ❌ | `NOW()` |
| `updated_at` | TIMESTAMPTZ | Czas ostatniej modyfikacji | ❌ | `NOW()` |

#### Przykład danych:

```json
{
  "intent": "crm_gtd.add_task",
  "original_phrase": "Dodaj zadanie przygotuj prezentację na jutro",
  "parameters": {
    "task_title": "przygotuj prezentację",
    "task_date": "jutro",
    "task_priority": "medium"
  },
  "entities": {
    "date": ["jutro"],
    "action": ["przygotuj"],
    "object": ["prezentacja"]
  },
  "response_type": "SUCCESS",
  "response_text": "Zadanie 'Przygotuj prezentację' zostało dodane na jutro.",
  "display_data": {
    "card": {
      "title": "✅ Zadanie dodane",
      "subtitle": "Przygotuj prezentację",
      "date": "jutro"
    }
  }
}
```

---

### 2. **assistant_preferences**

**Opis**: Preferencje użytkownika dla asystenta głosowego.

#### Struktura:

| Pole | Typ | Opis | Wymagane | Domyślna |
|------|-----|------|----------|----------|
| `id` | UUID | Unikalny identyfikator | ✅ | `gen_random_uuid()` |
| `user_id` | UUID | ID użytkownika (UNIQUE) | ✅ | - |
| `organization_id` | UUID | ID organizacji | ✅ | - |
| `preferred_language` | VARCHAR(10) | Preferowany język | ❌ | `'pl-PL'` |
| `voice_speed` | DECIMAL(3,2) | Prędkość mowy (0.5-2.0) | ❌ | `1.0` |
| `voice_pitch` | DECIMAL(3,2) | Wysokość głosu (0.5-2.0) | ❌ | `1.0` |
| `voice_volume` | DECIMAL(3,2) | Głośność (0.0-1.0) | ❌ | `0.8` |
| `voice_personality` | VARCHAR(50) | Personalność głosu | ❌ | `'professional'` |
| `response_length` | VARCHAR(20) | Długość odpowiedzi | ❌ | `'medium'` |
| `include_suggestions` | BOOLEAN | Czy dołączać sugestie | ❌ | `true` |
| `include_context` | BOOLEAN | Czy dołączać kontekst | ❌ | `true` |
| `pronunciation_corrections` | JSONB | Niestandardowe wymowy | ❌ | `'{}'` |
| `auto_confirm_actions` | BOOLEAN | Automatyczne potwierdzanie akcji | ❌ | `false` |
| `request_confirmation_for` | JSONB | Lista akcji wymagających potwierdzenia | ❌ | `'["delete", "important_changes"]'` |
| `default_task_priority` | VARCHAR(20) | Domyślny priorytet zadań | ❌ | `'MEDIUM'` |
| `default_task_context` | VARCHAR(50) | Domyślny kontekst zadań | ❌ | `'@computer'` |
| `preferred_date_format` | VARCHAR(20) | Format daty | ❌ | `'DD.MM.YYYY'` |
| `preferred_time_format` | VARCHAR(10) | Format czasu | ❌ | `'24h'` |
| `store_voice_history` | BOOLEAN | Czy przechowywać historię głosu | ❌ | `true` |
| `share_usage_analytics` | BOOLEAN | Czy udostępniać analityki | ❌ | `true` |
| `enable_personalization` | BOOLEAN | Czy włączyć personalizację | ❌ | `true` |
| `voice_notifications_enabled` | BOOLEAN | Czy włączyć notyfikacje głosowe | ❌ | `true` |
| `notification_times` | JSONB | Czasy notyfikacji | ❌ | `'{"morning": "09:00", "evening": "18:00"}'` |
| `notification_types` | JSONB | Typy notyfikacji | ❌ | `'["reminders", "deadlines", "suggestions"]'` |
| `favorite_commands` | JSONB | Ulubione komendy | ❌ | `'[]'` |
| `custom_phrases` | JSONB | Niestandardowe frazy | ❌ | `'{}'` |

#### Przykład danych:

```json
{
  "preferred_language": "pl-PL",
  "voice_personality": "professional",
  "pronunciation_corrections": {
    "Kowalski": "Ko-val-ski",
    "Wiśniewski": "Vish-niev-ski"
  },
  "custom_phrases": {
    "szybkie zadanie": "dodaj zadanie pilne",
    "spotkanie jutro": "dodaj spotkanie na jutro"
  },
  "favorite_commands": [
    "pokaż zadania",
    "dodaj zadanie", 
    "kalendarz dziś",
    "status projektów"
  ]
}
```

---

### 3. **display_widgets**

**Opis**: Konfiguracja widgetów do wyświetlania na Google Nest Hub.

#### Struktura:

| Pole | Typ | Opis | Wymagane | Domyślna |
|------|-----|------|----------|----------|
| `id` | UUID | Unikalny identyfikator | ✅ | `gen_random_uuid()` |
| `user_id` | UUID | ID użytkownika | ✅ | - |
| `organization_id` | UUID | ID organizacji | ✅ | - |
| `widget_type` | VARCHAR(100) | Typ widgetu | ✅ | - |
| `widget_name` | VARCHAR(255) | Nazwa widgetu | ✅ | - |
| `description` | TEXT | Opis widgetu | ❌ | - |
| `position` | INTEGER | Pozycja na ekranie | ❌ | `0` |
| `size` | VARCHAR(20) | Rozmiar widgetu | ❌ | `'medium'` |
| `display_duration` | INTEGER | Czas wyświetlania (sekundy) | ❌ | `30` |
| `refresh_interval` | INTEGER | Interwał odświeżania (sekundy) | ❌ | `300` |
| `settings` | JSONB | Ustawienia widgetu | ✅ | `'{}'` |
| `data_filters` | JSONB | Filtry danych | ❌ | `'{}'` |
| `visual_options` | JSONB | Opcje wizualne | ❌ | `'{}'` |
| `is_enabled` | BOOLEAN | Czy widget jest włączony | ❌ | `true` |
| `visibility_conditions` | JSONB | Warunki widoczności | ❌ | `'{}'` |
| `device_types` | JSONB | Typy urządzeń | ❌ | `'["nest_hub", "nest_mini"]'` |
| `data_source_type` | VARCHAR(50) | Typ źródła danych | ✅ | - |
| `data_source_config` | JSONB | Konfiguracja źródła danych | ❌ | `'{}'` |
| `cache_duration` | INTEGER | Czas cache'owania (sekundy) | ❌ | `60` |
| `is_interactive` | BOOLEAN | Czy widget jest interaktywny | ❌ | `false` |
| `voice_commands` | JSONB | Dostępne komendy głosowe | ❌ | `'[]'` |
| `touch_actions` | JSONB | Akcje dotykowe | ❌ | `'[]'` |

#### Dostępne typy widgetów:

- `task_summary` - Podsumowanie zadań
- `calendar_today` - Kalendarz na dziś  
- `deals_pipeline` - Pipeline dealów
- `quick_capture` - Szybkie dodawanie
- `weather_info` - Informacje o pogodzie
- `team_status` - Status zespołu
- `notifications` - Powiadomienia
- `analytics_chart` - Wykresy analityczne

#### Przykład konfiguracji:

```json
{
  "widget_type": "task_summary",
  "widget_name": "Dzisiejsze Zadania",
  "settings": {
    "show_completed": false,
    "max_items": 8,
    "group_by_priority": true,
    "show_context": true
  },
  "data_filters": {
    "status": ["NEW", "IN_PROGRESS"],
    "dueDate": "today",
    "voice_accessible": true
  },
  "visual_options": {
    "background_color": "#f8f9fa",
    "text_color": "#333",
    "highlight_color": "#007bff"
  },
  "voice_commands": [
    "pokaż więcej zadań",
    "oznacz jako ukończone",
    "przenieś na jutro"
  ]
}
```

---

### 4. **voice_shortcuts**

**Opis**: Niestandardowe skróty głosowe dla szybkich akcji.

#### Struktura:

| Pole | Typ | Opis | Wymagane | Domyślna |
|------|-----|------|----------|----------|
| `id` | UUID | Unikalny identyfikator | ✅ | `gen_random_uuid()` |
| `user_id` | UUID | ID użytkownika | ✅ | - |
| `organization_id` | UUID | ID organizacji | ✅ | - |
| `name` | VARCHAR(255) | Nazwa skrótu | ✅ | - |
| `description` | TEXT | Opis skrótu | ❌ | - |
| `trigger_phrases` | JSONB | Frazy wyzwalające | ✅ | - |
| `action_type` | VARCHAR(100) | Typ akcji | ✅ | - |
| `action_config` | JSONB | Konfiguracja akcji | ✅ | - |
| `parameters_template` | JSONB | Szablon parametrów | ❌ | `'{}'` |
| `requires_confirmation` | BOOLEAN | Czy wymaga potwierdzenia | ❌ | `false` |
| `confirmation_message` | TEXT | Wiadomość potwierdzenia | ❌ | - |
| `success_message` | TEXT | Wiadomość sukcesu | ❌ | - |
| `error_message` | TEXT | Wiadomość błędu | ❌ | - |
| `execution_conditions` | JSONB | Warunki wykonania | ❌ | `'{}'` |
| `usage_limit` | INTEGER | Limit użycia dziennie | ❌ | - |
| `usage_count_today` | INTEGER | Liczba użyć dziś | ❌ | `0` |
| `usage_reset_at` | TIMESTAMPTZ | Czas resetu licznika | ❌ | następny dzień |
| `total_usage_count` | INTEGER | Łączna liczba użyć | ❌ | `0` |
| `last_used_at` | TIMESTAMPTZ | Ostatnie użycie | ❌ | - |
| `average_execution_time` | DECIMAL(10,2) | Średni czas wykonania | ❌ | - |
| `is_active` | BOOLEAN | Czy skrót jest aktywny | ❌ | `true` |
| `is_public` | BOOLEAN | Czy dostępny dla innych w organizacji | ❌ | `false` |

#### Dostępne typy akcji:

- `create_task` - Tworzenie zadania
- `show_calendar` - Pokazanie kalendarza  
- `call_api` - Wywołanie API
- `run_workflow` - Uruchomienie workflow
- `send_notification` - Wysłanie powiadomienia
- `create_note` - Utworzenie notatki
- `schedule_meeting` - Planowanie spotkania

#### Przykład skrótu:

```json
{
  "name": "Szybkie Zadanie",
  "trigger_phrases": [
    "szybkie zadanie",
    "pilne zadanie", 
    "ważne zadanie"
  ],
  "action_type": "create_task",
  "action_config": {
    "priority": "HIGH",
    "context": "@computer",
    "dueDate": "today",
    "voice_accessible": true
  },
  "parameters_template": {
    "title": "{extracted_text}",
    "description": "{additional_context}"
  },
  "success_message": "Pilne zadanie '{task_title}' zostało dodane."
}
```

---

### 5. **notification_settings**

**Opis**: Ustawienia powiadomień głosowych i wizualnych.

#### Struktura:

| Pole | Typ | Opis | Wymagane | Domyślna |
|------|-----|------|----------|----------|
| `id` | UUID | Unikalny identyfikator | ✅ | `gen_random_uuid()` |
| `user_id` | UUID | ID użytkownika (UNIQUE) | ✅ | - |
| `organization_id` | UUID | ID organizacji | ✅ | - |
| `voice_notifications_enabled` | BOOLEAN | Czy włączyć powiadomienia głosowe | ❌ | `true` |
| `voice_notification_volume` | DECIMAL(3,2) | Głośność powiadomień (0.0-1.0) | ❌ | `0.7` |
| `voice_notification_speed` | DECIMAL(3,2) | Prędkość mowy powiadomień | ❌ | `1.0` |
| `voice_notification_language` | VARCHAR(10) | Język powiadomień | ❌ | `'pl-PL'` |
| `display_notifications_enabled` | BOOLEAN | Czy włączyć powiadomienia wizualne | ❌ | `true` |
| `display_notification_duration` | INTEGER | Czas wyświetlania (sekundy) | ❌ | `15` |
| `display_notification_position` | VARCHAR(20) | Pozycja na ekranie | ❌ | `'center'` |
| `display_theme` | VARCHAR(20) | Motyw wyświetlania | ❌ | `'auto'` |
| `notification_types` | JSONB | Typy powiadomień | ❌ | zobacz przykład |
| `quiet_hours` | JSONB | Godziny ciszy | ❌ | zobacz przykład |
| `notification_schedule` | JSONB | Harmonogram powiadomień | ❌ | zobacz przykład |
| `smart_delivery` | BOOLEAN | Inteligentne dostarczanie | ❌ | `true` |
| `priority_bypass` | BOOLEAN | Omijanie ciszy dla wysokiego priorytetu | ❌ | `true` |
| `location_based` | BOOLEAN | Powiadomienia na podstawie lokalizacji | ❌ | `false` |
| `device_preferences` | JSONB | Preferencje urządzeń | ❌ | zobacz przykład |
| `emergency_contact_enabled` | BOOLEAN | Czy włączyć kontakt awaryjny | ❌ | `false` |
| `emergency_phrases` | JSONB | Frazy awaryjne | ❌ | `'["emergency", "urgent help"]'` |
| `emergency_actions` | JSONB | Akcje awaryjne | ❌ | zobacz przykład |

#### Przykład konfiguracji:

```json
{
  "notification_types": {
    "task_reminders": true,
    "deadline_alerts": true,
    "meeting_reminders": true,
    "daily_summary": true,
    "weekly_review": true,
    "deal_updates": true,
    "priority_changes": true,
    "system_alerts": false
  },
  "quiet_hours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00",
    "timezone": "Europe/Warsaw"
  },
  "notification_schedule": {
    "daily_summary": "09:00",
    "weekly_review": "MON-09:00",
    "deadline_reminder": "1h_before",
    "meeting_reminder": "15m_before"
  },
  "device_preferences": {
    "google_home": {"enabled": true, "volume": 0.7},
    "nest_hub": {"enabled": true, "brightness": 0.8},
    "mobile": {"enabled": true, "vibrate": true},
    "desktop": {"enabled": true, "sound": true}
  },
  "emergency_actions": {
    "call_admin": true,
    "log_incident": true,
    "notify_team": false
  }
}
```

---

## 🔧 Rozszerzenia Istniejących Tabel

### 1. **Task** - Rozszerzenia

| Nowe Pole | Typ | Opis | Domyślna |
|-----------|-----|------|----------|
| `voice_accessible` | BOOLEAN | Czy zadanie jest dostępne przez głos | `true` |
| `assistant_priority` | INTEGER | Priorytet dla asystenta głosowego (1-10) | `5` |
| `voice_notes` | JSONB | Notatki głosowe dotyczące zadania | `'{}'` |
| `voice_instructions` | TEXT | Instrukcje głosowe dla zadania | - |
| `last_voice_update` | TIMESTAMPTZ | Ostatnia aktualizacja przez głos | - |
| `voice_metadata` | JSONB | Dodatkowe metadane głosowe | `'{}'` |

#### Przykład `voice_notes`:

```json
{
  "pronunciation": "pre-zen-ta-cja",
  "context": "work",
  "estimated_duration": "2h",
  "voice_reminders": ["30m_before", "10m_before"],
  "speaking_notes": "Przygotuj slajdy, dodaj wykresy, sprawdź dane"
}
```

---

### 2. **Contact** - Rozszerzenia

| Nowe Pole | Typ | Opis | Domyślna |
|-----------|-----|------|----------|
| `voice_notes` | JSONB | Notatki głosowe o kontakcie | `'{}'` |
| `preferred_voice_language` | VARCHAR(10) | Preferowany język dla TTS | `'pl-PL'` |
| `voice_pronunciation` | VARCHAR(255) | Jak wymawiać nazwę kontaktu | - |
| `voice_accessible` | BOOLEAN | Czy kontakt dostępny przez głos | `true` |
| `voice_summary` | TEXT | Krótkie podsumowanie głosowe | - |

#### Przykład `voice_notes`:

```json
{
  "speaking_style": "formal",
  "prefers_brief": true,
  "usual_topics": ["business", "projects"],
  "meeting_preferences": {
    "time": "morning",
    "duration": "30_minutes",
    "location": "office"
  },
  "voice_interactions_count": 15,
  "last_voice_contact": "2025-07-04T14:30:00Z"
}
```

---

### 3. **Meeting** - Rozszerzenia

| Nowe Pole | Typ | Opis | Domyślna |
|-----------|-----|------|----------|
| `voice_reminders` | JSONB | Ustawienia przypomnień głosowych | `'{}'` |
| `voice_recording_url` | TEXT | URL do nagrania głosowego | - |
| `voice_transcription` | TEXT | Transkrypcja nagrania | - |
| `voice_notes` | JSONB | Notatki głosowe ze spotkania | `'{}'` |
| `voice_accessible` | BOOLEAN | Czy spotkanie dostępne przez głos | `true` |
| `reminder_settings` | JSONB | Ustawienia przypomnień | zobacz przykład |

#### Przykład `reminder_settings`:

```json
{
  "voice_reminder": true,
  "display_reminder": true,
  "reminder_times": ["1h", "15m", "5m"],
  "reminder_sound": "gentle",
  "snooze_options": ["5m", "10m", "15m"],
  "auto_join_enabled": false
}
```

---

### 4. **User** - Rozszerzenia

| Nowe Pole | Typ | Opis | Domyślna |
|-----------|-----|------|----------|
| `voice_settings` | JSONB | Ustawienia głosowe użytkownika | zobacz przykład |
| `voice_training_data` | JSONB | Dane treningowe dla rozpoznawania | `'{}'` |
| `last_voice_interaction` | TIMESTAMPTZ | Ostatnia interakcja głosowa | - |

#### Przykład `voice_settings`:

```json
{
  "enabled": true,
  "language": "pl-PL",
  "personality": "professional",
  "response_style": "detailed",
  "preferred_voice": "male_polish",
  "wake_word_sensitivity": 0.8,
  "noise_cancellation": true,
  "echo_cancellation": true
}
```

---

## 🚀 Indeksy i Optymalizacje

### Indeksy główne:

```sql
-- Voice Interactions - optymalizacja dla częstych zapytań
CREATE INDEX "idx_voice_interactions_user_org" ON "voice_interactions" ("user_id", "organization_id");
CREATE INDEX "idx_voice_interactions_timestamp" ON "voice_interactions" ("interaction_at" DESC);
CREATE INDEX "idx_voice_interactions_intent" ON "voice_interactions" ("intent");
CREATE INDEX "idx_voice_interactions_response_type" ON "voice_interactions" ("response_type");

-- Partial index dla ostatnich 30 dni (najczęściej używane)
CREATE INDEX "idx_voice_interactions_recent" ON "voice_interactions" ("interaction_at") 
WHERE "interaction_at" > (NOW() - INTERVAL '30 days');

-- GIN indexes dla JSONB - szybkie wyszukiwanie w JSON
CREATE INDEX "idx_voice_interactions_parameters" ON "voice_interactions" USING GIN ("parameters");
CREATE INDEX "idx_voice_interactions_entities" ON "voice_interactions" USING GIN ("entities");

-- Task voice fields
CREATE INDEX "idx_task_voice_accessible" ON "Task" ("voice_accessible") WHERE "voice_accessible" = true;
CREATE INDEX "idx_task_assistant_priority" ON "Task" ("assistant_priority" DESC);
CREATE INDEX "idx_task_voice_notes" ON "Task" USING GIN ("voice_notes");

-- Display Widgets
CREATE INDEX "idx_display_widgets_user_enabled" ON "display_widgets" ("user_id", "is_enabled");
CREATE INDEX "idx_display_widgets_position" ON "display_widgets" ("user_id", "position");

-- Voice Shortcuts
CREATE INDEX "idx_voice_shortcuts_active" ON "voice_shortcuts" ("is_active") WHERE "is_active" = true;
CREATE INDEX "idx_voice_shortcuts_trigger_phrases" ON "voice_shortcuts" USING GIN ("trigger_phrases");
```

### Statystyki wydajności:

- **voice_interactions**: Optymalizacja dla zapytań po user_id, data, intent
- **Partial indexes**: Tylko aktywne/niedawne rekordy
- **GIN indexes**: Szybkie wyszukiwanie w polach JSON
- **Composite indexes**: Dla częstych kombinacji kolumn

---

## 📊 Widoki (Views)

### 1. **active_voice_tasks**

Widok pokazujący aktywne zadania dostępne przez głos:

```sql
CREATE VIEW "active_voice_tasks" AS
SELECT 
    t."id",
    t."title",
    t."description",
    t."priority",
    t."status",
    t."dueDate",
    t."assistant_priority",
    t."voice_notes",
    t."voice_instructions",
    u."firstName" || ' ' || u."lastName" AS "assignee_name",
    c."name" AS "context_name",
    org."name" AS "organization_name"
FROM "Task" t
LEFT JOIN "User" u ON t."assignedToId" = u."id"
LEFT JOIN "Context" c ON t."contextId" = c."id"
LEFT JOIN "Organization" org ON t."organizationId" = org."id"
WHERE t."voice_accessible" = true 
    AND t."status" NOT IN ('COMPLETED', 'CANCELLED');
```

### 2. **today_voice_meetings**

Widok spotkań na dziś dostępnych przez głos:

```sql
CREATE VIEW "today_voice_meetings" AS
SELECT 
    m."id",
    m."title",
    m."description",
    m."startTime",
    m."endTime",
    m."location",
    m."voice_reminders",
    m."reminder_settings",
    u."firstName" || ' ' || u."lastName" AS "organizer_name",
    c."firstName" || ' ' || c."lastName" AS "contact_name",
    org."name" AS "organization_name"
FROM "Meeting" m
LEFT JOIN "User" u ON m."organizedById" = u."id"
LEFT JOIN "Contact" c ON m."contactId" = c."id"
LEFT JOIN "Organization" org ON m."organizationId" = org."id"
WHERE m."voice_accessible" = true 
    AND DATE(m."startTime") = CURRENT_DATE;
```

### 3. **voice_interactions_summary**

Podsumowanie interakcji głosowych z ostatnich 7 dni:

```sql
CREATE VIEW "voice_interactions_summary" AS
SELECT 
    vi."user_id",
    vi."organization_id",
    COUNT(*) as "total_interactions",
    COUNT(*) FILTER (WHERE vi."response_type" = 'SUCCESS') as "successful_interactions",
    COUNT(*) FILTER (WHERE vi."response_type" = 'ERROR') as "failed_interactions",
    AVG(vi."confidence_score") as "avg_confidence",
    AVG(vi."processing_time_ms") as "avg_processing_time",
    MAX(vi."interaction_at") as "last_interaction"
FROM "voice_interactions" vi
WHERE vi."interaction_at" > (NOW() - INTERVAL '7 days')
GROUP BY vi."user_id", vi."organization_id";
```

---

## ⚙️ Triggery i Funkcje

### 1. **Automatyczne aktualizacje `updated_at`**

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Stosowanie do nowych tabel
CREATE TRIGGER "update_voice_interactions_updated_at" 
    BEFORE UPDATE ON "voice_interactions" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. **Reset dziennych limitów voice shortcuts**

```sql
CREATE OR REPLACE FUNCTION reset_daily_voice_shortcut_usage()
RETURNS void AS $$
BEGIN
    UPDATE "voice_shortcuts" 
    SET 
        "usage_count_today" = 0,
        "usage_reset_at" = DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
    WHERE "usage_reset_at" <= NOW();
END;
$$ LANGUAGE 'plpgsql';
```

---

## 💡 Przykłady Użycia

### 1. **Dodanie interakcji głosowej**

```sql
INSERT INTO "voice_interactions" (
    "user_id", "organization_id", "intent", "original_phrase",
    "parameters", "response_type", "response_text", "source_device"
) VALUES (
    'user-uuid', 'org-uuid', 'crm_gtd.add_task',
    'Dodaj zadanie przygotuj raport na jutro',
    '{"task_title": "przygotuj raport", "task_date": "jutro"}',
    'SUCCESS', 
    'Zadanie zostało dodane na jutro.',
    'google_home'
);
```

### 2. **Pobranie dzisiejszych zadań głosowych**

```sql
SELECT * FROM "active_voice_tasks" 
WHERE "dueDate"::date = CURRENT_DATE 
ORDER BY "assistant_priority" DESC, "priority" DESC;
```

### 3. **Konfiguracja widgetu Nest Hub**

```sql
INSERT INTO "display_widgets" (
    "user_id", "organization_id", "widget_type", "widget_name",
    "settings", "data_filters", "visual_options"
) VALUES (
    'user-uuid', 'org-uuid', 'task_summary', 'Moje zadania',
    '{"max_items": 5, "show_completed": false}',
    '{"status": ["NEW", "IN_PROGRESS"], "voice_accessible": true}',
    '{"theme": "dark", "accent_color": "#007bff"}'
);
```

### 4. **Utworzenie skrótu głosowego**

```sql
INSERT INTO "voice_shortcuts" (
    "user_id", "organization_id", "name", "trigger_phrases",
    "action_type", "action_config", "success_message"
) VALUES (
    'user-uuid', 'org-uuid', 'Szybkie zadanie',
    '["szybkie zadanie", "pilne zadanie"]',
    'create_task',
    '{"priority": "HIGH", "context": "@computer"}',
    'Pilne zadanie zostało dodane.'
);
```

### 5. **Analiza skuteczności interakcji**

```sql
SELECT 
    intent,
    COUNT(*) as total_uses,
    AVG(confidence_score) as avg_confidence,
    AVG(processing_time_ms) as avg_processing_time,
    COUNT(*) FILTER (WHERE response_type = 'SUCCESS') * 100.0 / COUNT(*) as success_rate
FROM voice_interactions 
WHERE interaction_at > NOW() - INTERVAL '30 days'
GROUP BY intent
ORDER BY total_uses DESC;
```

---

## 🔄 Migracja i Rollback

### Uruchomienie migracji:

```bash
# 1. Backup bazy danych
pg_dump -h localhost -U user -d crm_gtd_v1 > backup_before_voice.sql

# 2. Uruchomienie migracji
psql -h localhost -U user -d crm_gtd_v1 -f voice_integration_migration.sql

# 3. Uruchomienie seed data (opcjonalne)
psql -h localhost -U user -d crm_gtd_v1 -f voice_integration_seed.sql
```

### Rollback (cofnięcie):

```bash
# ⚠️ UWAGA: To usunie wszystkie dane voice!
psql -h localhost -U user -d crm_gtd_v1 -f voice_integration_rollback.sql
```

### Weryfikacja migracji:

```sql
-- Sprawdzenie czy tabele zostały utworzone
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%voice%' 
OR table_name IN ('assistant_preferences', 'display_widgets', 'notification_settings');

-- Sprawdzenie nowych kolumn
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE '%voice%';

-- Sprawdzenie indeksów
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%voice%';
```

---

## 🎯 Podsumowanie

### Nowe możliwości:

✅ **Pełne logowanie interakcji głosowych** - każda komenda zapisana  
✅ **Personalizacja asystenta** - indywidualne ustawienia użytkowników  
✅ **Widgety Nest Hub** - konfiguracja wyświetlania danych  
✅ **Skróty głosowe** - niestandardowe komendy użytkowników  
✅ **Zaawansowane powiadomienia** - głosowe i wizualne  
✅ **Optymalizacja wydajności** - indeksy dla szybkich zapytań  
✅ **Kompletna dokumentacja** - instrukcje i przykłady użycia  

### Korzyści dla użytkowników:

🎙️ **Naturalne interakcje głosowe** z systemem CRM-GTD  
📱 **Integracja z Google Nest Hub** - wizualizacja danych  
⚡ **Szybkie akcje** dzięki skrótom głosowym  
🔔 **Inteligentne powiadomienia** dopasowane do preferencji  
📊 **Analityka użycia** - optymalizacja workflow  

### Gotowość produkcyjna:

🛡️ **Bezpieczeństwo** - pełna kontrola dostępu i audyt  
⚡ **Wydajność** - optymalizowane indeksy i zapytania  
🔄 **Skalowalność** - struktura przygotowana na wzrost  
🛠️ **Łatwość wdrożenia** - kompletne skrypty migracji  

---

**Status**: ✅ Gotowe do wdrożenia  
**Wersja**: 1.0.0  
**Data**: 2025-07-04