# KOMPLETNA LISTA WSZYSTKICH TABEL BAZY DANYCH CRM-GTD

**Data utworzenia**: 2025-07-04  
**Łączna liczba tabel**: 104  
**Tabele z danymi**: 18  
**Tabele puste**: 86  
**Procent wypełnienia**: 17.3%

---

## 📊 PODSUMOWANIE STATYSTYK

### Tabele z największą ilością danych:
1. **message_attachments** - 259 rekordów
2. **messages** - 195 rekordów  
3. **contacts** - 108 rekordów
4. **companies** - 95 rekordów
5. **refresh_tokens** - 35 rekordów

### Systemy z danymi:
- ✅ **CRM Core** (companies, contacts, deals, messages) - **WYPEŁNIONE**
- ✅ **GTD System** (buckets, horizons, inbox_items, areas) - **WYPEŁNIONE** 
- ✅ **AI System** (providers, models) - **WYPEŁNIONE**
- ✅ **Smart Mailboxes** (mailboxes, rules) - **WYPEŁNIONE**
- ❌ **Knowledge Base** - PUSTE
- ❌ **E-commerce** (products, services, orders) - PUSTE
- ❌ **Voice/TTS** - PUSTE
- ❌ **Analytics** - PUSTE

---

## 📋 KOMPLETNA LISTA TABEL (104)

### ✅ TABELE Z DANYMI (18 tabel)

#### **🏢 CRM Core System**
| Tabela | Rekordy | Inserty | Aktualizacje | Usuniecia | Status |
|--------|---------|---------|--------------|-----------|---------|
| **companies** | 95 | 94 | 190 | 0 | ✅ WYPEŁNIONA |
| **contacts** | 108 | 107 | 301 | 0 | ✅ WYPEŁNIONA |
| **deals** | 3 | 3 | 0 | 0 | ✅ WYPEŁNIONA |
| **messages** | 195 | 195 | 496 | 0 | ✅ WYPEŁNIONA |
| **message_attachments** | 259 | 244 | 0 | 0 | ✅ WYPEŁNIONA |

#### **🎯 GTD System**
| Tabela | Rekordy | Inserty | Aktualizacje | Usuniecia | Status |
|--------|---------|---------|--------------|-----------|---------|
| **gtd_buckets** | 5 | 5 | 0 | 0 | ✅ WYPEŁNIONA |
| **gtd_horizons** | 6 | 8 | 0 | 1 | ✅ WYPEŁNIONA |
| **inbox_items** | 8 | 8 | 0 | 0 | ✅ WYPEŁNIONA |
| **areas_of_responsibility** | 4 | 4 | 0 | 0 | ✅ WYPEŁNIONA |
| **contexts** | 8 | 8 | 0 | 0 | ✅ WYPEŁNIONA |
| **tasks** | 4 | 4 | 0 | 0 | ✅ WYPEŁNIONA |

#### **🤖 AI System**
| Tabela | Rekordy | Inserty | Aktualizacje | Usuniecia | Status |
|--------|---------|---------|--------------|-----------|---------|
| **ai_providers** | 3 | 3 | 0 | 0 | ✅ WYPEŁNIONA |
| **ai_models** | 8 | 8 | 0 | 0 | ✅ WYPEŁNIONA |

#### **📬 Smart Mailboxes**
| Tabela | Rekordy | Inserty | Aktualizacje | Usuniecia | Status |
|--------|---------|---------|--------------|-----------|---------|
| **smart_mailboxes** | 7 | 7 | 0 | 0 | ✅ WYPEŁNIONA |
| **smart_mailbox_rules** | 9 | 9 | 0 | 0 | ✅ WYPEŁNIONA |

#### **🏗️ Infrastruktura**
| Tabela | Rekordy | Inserty | Aktualizacje | Usuniecia | Status |
|--------|---------|---------|--------------|-----------|---------|
| **organizations** | 1 | 1 | 0 | 0 | ✅ WYPEŁNIONA |
| **users** | 4 | 4 | 37 | 0 | ✅ WYPEŁNIONA |
| **communication_channels** | 2 | 2 | 1 | 0 | ✅ WYPEŁNIONA |
| **projects** | 1 | 1 | 0 | 0 | ✅ WYPEŁNIONA |
| **streams** | 1 | 1 | 0 | 0 | ✅ WYPEŁNIONA |
| **subscriptions** | 1 | 1 | 0 | 0 | ✅ WYPEŁNIONA |
| **refresh_tokens** | 35 | 37 | 0 | 2 | ✅ WYPEŁNIONA |

---

### ❌ TABELE PUSTE (86 tabel)

#### **📚 Knowledge Base System**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **documents** | 0 | ❌ PUSTA | Dokumenty i pliki |
| **folders** | 0 | ❌ PUSTA | Foldery organizacyjne |
| **knowledge_base** | 0 | ❌ PUSTA | Baza wiedzy |
| **wiki_pages** | 0 | ❌ PUSTA | Strony wiki |
| **wiki_categories** | 0 | ❌ PUSTA | Kategorie wiki |
| **wiki_page_links** | 0 | ❌ PUSTA | Linki między stronami wiki |
| **document_comments** | 0 | ❌ PUSTA | Komentarze do dokumentów |
| **document_links** | 0 | ❌ PUSTA | Linki w dokumentach |
| **document_shares** | 0 | ❌ PUSTA | Udostępnienia dokumentów |
| **files** | 0 | ❌ PUSTA | System plików |

#### **🛒 E-commerce System**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **products** | 0 | ❌ PUSTA | Produkty |
| **services** | 0 | ❌ PUSTA | Usługi |
| **orders** | 0 | ❌ PUSTA | Zamówienia |
| **order_items** | 0 | ❌ PUSTA | Pozycje zamówień |
| **offers** | 0 | ❌ PUSTA | Oferty |
| **offer_items** | 0 | ❌ PUSTA | Pozycje ofert |
| **invoices** | 0 | ❌ PUSTA | Faktury |
| **invoice_items** | 0 | ❌ PUSTA | Pozycje faktur |

#### **🤖 AI Advanced Features**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **ai_rules** | 0 | ❌ PUSTA | Reguły AI |
| **ai_executions** | 0 | ❌ PUSTA | Wykonania AI |
| **ai_predictions** | 0 | ❌ PUSTA | Predykcje AI |
| **ai_usage_stats** | 0 | ❌ PUSTA | Statystyki użycia AI |
| **ai_prompt_templates** | 0 | ❌ PUSTA | Szablony promptów |
| **ai_knowledge_bases** | 0 | ❌ PUSTA | Bazy wiedzy AI |
| **ai_knowledge_documents** | 0 | ❌ PUSTA | Dokumenty wiedzy AI |

#### **📧 Email System**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **email_rules** | 0 | ❌ PUSTA | Reguły emaili |
| **email_templates** | 0 | ❌ PUSTA | Szablony emaili |
| **email_logs** | 0 | ❌ PUSTA | Logi emaili |
| **email_analysis** | 0 | ❌ PUSTA | Analiza emaili |
| **auto_replies** | 0 | ❌ PUSTA | Automatyczne odpowiedzi |

#### **📊 Analytics & Monitoring**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **view_analytics** | 0 | ❌ PUSTA | Analityka widoków |
| **view_configurations** | 0 | ❌ PUSTA | Konfiguracje widoków |
| **user_view_preferences** | 0 | ❌ PUSTA | Preferencje widoków |
| **user_access_logs** | 0 | ❌ PUSTA | Logi dostępu |
| **stream_access_logs** | 0 | ❌ PUSTA | Logi dostępu do streamów |
| **error_logs** | 0 | ❌ PUSTA | Logi błędów |

#### **🔍 Search & Vector System**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **search_index** | 0 | ❌ PUSTA | Indeks wyszukiwania |
| **vector_cache** | 0 | ❌ PUSTA | Cache wektorów |
| **vector_documents** | 0 | ❌ PUSTA | Dokumenty wektorowe |
| **vector_search_results** | 0 | ❌ PUSTA | Wyniki wyszukiwania wektorowego |

#### **🔧 Workflow & Rules**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **processing_rules** | 0 | ❌ PUSTA | Reguły przetwarzania |
| **unified_rules** | 0 | ❌ PUSTA | Zunifikowane reguły |
| **unified_rule_executions** | 0 | ❌ PUSTA | Wykonania reguł |
| **message_processing_results** | 0 | ❌ PUSTA | Wyniki przetwarzania wiadomości |

#### **🎯 GTD Advanced**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **next_actions** | 0 | ❌ PUSTA | Następne działania |
| **someday_maybe** | 0 | ❌ PUSTA | Może kiedyś |
| **waiting_for** | 0 | ❌ PUSTA | Oczekiwanie na |
| **delegated_tasks** | 0 | ❌ PUSTA | Zadania delegowane |
| **focus_modes** | 0 | ❌ PUSTA | Tryby skupienia |
| **weekly_reviews** | 0 | ❌ PUSTA | Przeglądy tygodniowe |

#### **📅 Project Management**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **project_dependencies** | 0 | ❌ PUSTA | Zależności projektów |
| **task_dependencies** | 0 | ❌ PUSTA | Zależności zadań |
| **task_relationships** | 0 | ❌ PUSTA | Relacje zadań |
| **task_history** | 0 | ❌ PUSTA | Historia zadań |
| **dependencies** | 0 | ❌ PUSTA | Zależności ogólne |
| **critical_path** | 0 | ❌ PUSTA | Ścieżka krytyczna |
| **sprints** | 0 | ❌ PUSTA | Sprinty |
| **kanban_columns** | 0 | ❌ PUSTA | Kolumny Kanban |

#### **🏢 CRM Extended**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **leads** | 0 | ❌ PUSTA | Leady sprzedażowe |
| **meetings** | 0 | ❌ PUSTA | Spotkania |
| **timeline** | 0 | ❌ PUSTA | Oś czasu |
| **activities** | 0 | ❌ PUSTA | Aktywności |
| **recommendations** | 0 | ❌ PUSTA | Rekomendacje |
| **complaints** | 0 | ❌ PUSTA | Skargi |

#### **👥 User Management**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **user_permissions** | 0 | ❌ PUSTA | Uprawnienia użytkowników |
| **user_relations** | 0 | ❌ PUSTA | Relacje użytkowników |
| **stream_permissions** | 0 | ❌ PUSTA | Uprawnienia streamów |
| **stream_channels** | 0 | ❌ PUSTA | Kanały streamów |
| **stream_relations** | 0 | ❌ PUSTA | Relacje streamów |

#### **🔄 Recurring & Habits**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **recurring_tasks** | 0 | ❌ PUSTA | Zadania cykliczne |
| **habits** | 0 | ❌ PUSTA | Nawyki |
| **habit_entries** | 0 | ❌ PUSTA | Wpisy nawyków |

#### **📊 SMART Goals**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **smart** | 0 | ❌ PUSTA | Cele SMART |
| **smart_analysis_details** | 0 | ❌ PUSTA | Szczegóły analizy SMART |
| **smart_improvements** | 0 | ❌ PUSTA | Ulepszenia SMART |
| **smart_templates** | 0 | ❌ PUSTA | Szablony SMART |

#### **🏷️ Organization & Metadata**
| Tabela | Rekordy | Status | Opis |
|--------|---------|---------|------|
| **tags** | 0 | ❌ PUSTA | Tagi |
| **metadata** | 0 | ❌ PUSTA | Metadane |
| **info** | 0 | ❌ PUSTA | Informacje |
| **completeness** | 0 | ❌ PUSTA | Kompletność |
| **unimportant** | 0 | ❌ PUSTA | Nieważne |
| **bug_reports** | 0 | ❌ PUSTA | Raporty błędów |

---

## 📈 ANALIZA WYPEŁNIENIA

### Systemy z pełnym wypełnieniem:
1. **CRM Core** - 5/5 tabel wypełnionych (100%)
2. **GTD Basic** - 6/6 tabel wypełnionych (100%)  
3. **AI Basic** - 2/2 tabel wypełnionych (100%)
4. **Smart Mailboxes** - 2/2 tabel wypełnionych (100%)

### Systemy do wypełnienia (priorytet):
1. **Knowledge Base** - 0/10 tabel wypełnionych (0%)
2. **E-commerce** - 0/8 tabel wypełnionych (0%)
3. **Analytics** - 0/6 tabel wypełnionych (0%)
4. **GTD Advanced** - 0/6 tabel wypełnionych (0%)

### Łączne statystyki:
- **Całkowita liczba rekordów**: 769
- **Całkowita liczba insertów**: 827  
- **Całkowita liczba aktualizacji**: 1,025
- **Całkowita liczba usunięć**: 3

---

## 🎯 REKOMENDACJE

### Najbliższe kroki wypełnienia:
1. **Knowledge Base** - Dokumenty, Wiki Pages, Foldery
2. **GTD Advanced** - Next Actions, Someday/Maybe, Weekly Reviews  
3. **E-commerce** - Products, Services, Orders dla demo
4. **Analytics** - View Analytics, User Access Logs

### Tabele logów (można zostawić puste):
- Error Logs, Access Logs, Email Logs - dynamiczne dane
- Vector Cache, Search Index - cache systemowy
- Stream Access Logs - logi dostępu

**Status końcowy**: System ma solidną bazę danych z 769 rekordami w kluczowych obszarach CRM i GTD. Dodatkowe moduły można wypełniać stopniowo według potrzeb.