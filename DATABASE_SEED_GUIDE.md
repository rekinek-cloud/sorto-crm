# 🌱 CRM-GTD Database Seed Guide

## 📋 Przegląd

Ten przewodnik opisuje kompletne wypełnienie bazy danych CRM-GTD Smart realistycznymi danymi biznesowymi. System zawiera **97+ tabel** z danymi dla wszystkich głównych funkcjonalności.

## 🚀 Szybkie Uruchomienie

### Sposób 1: Skrypt Quick Seed (Zalecany)

```bash
cd /opt/crm-gtd-smart/packages/backend
./quick-seed.sh
```

### Sposób 2: Bezpośrednie uruchomienie

```bash
cd /opt/crm-gtd-smart/packages/backend
npx ts-node prisma/seed-complete-data.ts
```

### Sposób 3: Deployment Script

```bash
cd /opt/crm-gtd-smart/packages/backend
npx ts-node deploy-seed.ts
```

## 📊 Wypełnione Dane

### ✅ Podstawowe Struktury (100% ukończone)

#### 🏢 **Organizacyjne**
- **Organizations** (1-3) - organizacje z pełną konfiguracją
- **Subscriptions** (1-3) - aktywne subskrypcje PROFESSIONAL
- **Users** (3-5) - użytkownicy z różnymi rolami

#### 🎯 **GTD System** (100% metodologii David Allen)
- **GTD Buckets** (4) - Next Actions, Waiting For, Projects, Someday/Maybe
- **GTD Horizons** (6) - 6 poziomów perspektywy (0-5)
- **Contexts** (8) - @computer, @calls, @office, @home, @errands, @online, @waiting, @reading
- **Areas of Responsibility** (6) - obszary odpowiedzialności
- **Waiting For** (2) - elementy oczekujące
- **Someday Maybe** (2) - przyszłe możliwości

#### 🏷️ **Organizacja & Zarządzanie**
- **Tags** (8) - kolorowe tagi z kategoriami
- **Streams** (4) - strumienie pracy z ikonami
- **Focus Modes** (2) - tryby skupienia na różne energie
- **Habits** (2) - nawyki DAILY i WEEKLY

### ✅ Business Data (100% realistyczne)

#### 🏢 **CRM Core**
- **Companies** (3) - firmy z różnymi statusami (CUSTOMER, PROSPECT)
- **Contacts** (4) - kontakty z pełnymi danymi
- **Deals** (3) - deale w różnych etapach (NEGOTIATION, PROPOSAL, QUALIFIED)

#### 📋 **Zarządzanie Projektami**
- **Projects** (3) - projekty z datami i statusami
- **Tasks** (4) - zadania z kontekstami i priorytetami
- **Meetings** (2) - spotkania zaplanowane z opisami

#### 📦 **Produkty & Usługi**
- **Products** (3) - licencje software z cenami
- **Services** (3) - usługi z cenami godzinowymi

### ✅ Zaawansowane Funkcjonalności (100% ukończone)

#### 🤖 **System AI**
- **AI Providers** (2) - OpenAI i Anthropic z konfiguracją
- **AI Models** (4) - GPT-4, GPT-3.5, Claude-3 Opus, Claude-3 Sonnet
- **AI Rules** - reguły automatycznej analizy
- **AI Executions** - przykłady wykonań z wynikami

#### 📬 **Smart Mailboxes**
- **Smart Mailboxes** (3) - Today, Important, Action Needed
- **Communication Channels** (3) - Email i Slack z konfiguracją
- **Email Templates** (2) - szablony Welcome i Meeting Reminder
- **Email Rules** (1) - reguła filtrowania pilnych emaili

#### 📚 **Knowledge Base**
- **Knowledge Base** (1) - centralna baza wiedzy
- **Folders** (3) - Documentation, Processes, Training
- **Wiki Categories** (3) - Getting Started, User Guide, API Documentation

## 🎯 Przykładowe Dane Biznesowe

### Firmy i Kontakty
```
TechCorp Solutions (CUSTOMER)
├── Jan Kowalski - CTO
└── Katarzyna Wójcik - Product Manager

Global Marketing Agency (CUSTOMER)  
└── Anna Nowak - Marketing Director

StartupHub Incubator (PROSPECT)
└── Piotr Wiśniewski - CEO
```

### Projekty i Zadania
```
CRM System Enhancement (IN_PROGRESS, HIGH)
├── Design database schema (IN_PROGRESS, HIGH, @computer)
├── Implement user authentication (NEW, HIGH, @computer)
├── Create API documentation (NEW, MEDIUM, @computer)  
└── Setup testing environment (COMPLETED, MEDIUM)

Marketing Campaign Q1 (PLANNING, MEDIUM)
Team Training Program (PLANNING, MEDIUM)
```

### Deale
```
CRM Pro License - TechCorp ($12,000, NEGOTIATION, 75%)
Marketing Automation - GlobalMA ($25,000, PROPOSAL, 60%)  
Startup Package - StartupHub ($8,000, QUALIFIED, 40%)
```

## 🌐 Dostęp do Systemu

Po uruchomieniu seed systemu jest dostępny pod adresami:

- **Frontend**: http://91.99.50.80/crm/
- **API**: http://91.99.50.80/crm/api/v1/
- **Knowledge Base**: http://91.99.50.80/crm/dashboard/knowledge/
- **Smart Mailboxes**: http://91.99.50.80/crm/dashboard/smart-mailboxes/
- **GTD Inbox**: http://91.99.50.80/crm/dashboard/gtd/inbox/
- **AI Rules**: http://91.99.50.80/crm/dashboard/ai-rules/

## 🔧 Warunki Wstępne

### Wymagania:
1. **Docker containers uruchomione**:
   ```bash
   docker start crm-postgres-v1 crm-backend-v1 crm-frontend-v1
   ```

2. **Istniejące organizacje** (z podstawowego seed):
   ```bash
   npx prisma db seed  # Jeśli jeszcze nie uruchamiany
   ```

3. **TypeScript i Node.js** zainstalowane
4. **Prisma** skonfigurowane z bazą danych

## ⚠️ Rozwiązywanie Problemów

### Problem: "No existing organizations found"
```bash
# Rozwiązanie: Uruchom podstawowy seed
npx prisma db seed
# Następnie uruchom pełny seed
./quick-seed.sh
```

### Problem: "Database connection failed"  
```bash
# Sprawdź status kontenerów
docker ps | grep crm
# Uruchom kontenery
docker start crm-postgres-v1
```

### Problem: "TypeScript compilation errors"
```bash
# Sprawdź czy wszystkie dependencje są zainstalowane
npm install
# Sprawdź czy Prisma jest wygenerowane
npx prisma generate
```

## 📈 Statystyki Wypełnienia

Po pomyślnym uruchomieniu otrzymasz raport podobny do:

```
📈 DATABASE POPULATION SUMMARY:
===============================
Organizations: 1
Users: 3  
Tasks: 4
Projects: 3
Companies: 3
Contacts: 4
Deals: 3
GTD Contexts: 8
Tags: 8
Streams: 4
AI Providers: 2
Meetings: 2
Knowledge Bases: 1
Email Templates: 2
Smart Mailboxes: 3
Focus Modes: 2
Habits: 2
Waiting For: 2  
Someday Maybe: 2

🎉 Total Records: 50+
```

## 🎯 Następne Kroki

Po wypełnieniu bazy danych możesz:

1. **Testować funkcjonalności** w interfejsie webowym
2. **Dodawać własne dane** do istniejących struktur  
3. **Konfigurować AI** w panelu AI Config
4. **Tworzyć reguły** w Rules Manager
5. **Zarządzać wiedzą** w Knowledge Base

## 📚 Powiązana Dokumentacja

- `DATABASE_MANUAL.md` - Kompletny manual bazy danych
- `MANUAL_SYSTEMU_AI.md` - Przewodnik systemu AI
- `RULES_MANAGER_MANUAL.md` - Manual Rules Manager
- `GTD_COMMUNICATION_INTEGRATION.md` - Integracja GTD z komunikacją

---

**✅ System CRM-GTD Smart z pełnymi danymi przykładowymi jest gotowy do użytku!**