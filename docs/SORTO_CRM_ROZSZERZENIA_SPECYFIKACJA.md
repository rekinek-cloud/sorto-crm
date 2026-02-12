# 🚀 SORTO CRM - Rozszerzenia Relacyjne
## Pełna Specyfikacja z Perspektywy Użytkownika
### Wersja 1.0 | Luty 2025

---

# WPROWADZENIE

## Filozofia

> **"Projektowanie zawsze zaczyna się od użytkownika"**
> 
> 1. Co user zobaczy?
> 2. Za co zapłaci?
> 3. Gdzie jest "wow"?
> 4. Dopiero potem architektura.

Ten dokument opisuje 9 rozszerzeń systemu SORTO CRM, które transformują go z prostej bazy kontaktów w **inteligentny system zarządzania relacjami**. Każde rozszerzenie jest opisane z perspektywy użytkownika - co widzi, co robi, jaką wartość otrzymuje.

---

## Podsumowanie rozszerzeń

| # | Rozszerzenie | Wartość dla usera | Priorytet |
|---|--------------|-------------------|-----------|
| 1 | **Uniwersalne powiązania** | Wszystko połączone, nic nie ginie | 🔴 KRYTYCZNY |
| 2 | **Mapa relacji kontaktów** | Wiem kto zna kogo | 🟡 WYSOKI |
| 3 | **Health Score relacji** | Wiem gdzie interweniować | 🔴 KRYTYCZNY |
| 4 | **Eventy/Targi** | Organizacja wokół wydarzeń | 🟡 WYSOKI |
| 5 | **Client Intelligence** | Personalizacja = wyższe zamknięcia | 🔴 KRYTYCZNY |
| 6 | **Decision Map** | Wiem KTO decyduje | 🔴 KRYTYCZNY |
| 7 | **Konkurencja w dealach** | Wiem jak wygrać | 🟡 WYSOKI |
| 8 | **Kamienie milowe** | Widok z lotu ptaka na projekt | 🟢 ŚREDNI |
| 9 | **Historia produktów/usług** | Upselling, personalizacja ofert | 🟡 WYSOKI |

---

# ROZSZERZENIE 1: Uniwersalne Powiązania

## Problem użytkownika

```
User: "Mam zadanie 'Zadzwoń do Jana'. Ale którego Jana?!"
User: "Chcę zobaczyć wszystkie zadania dla firmy ABC. Ale część jest 
       przypisana do streamu, część do projektu, część do kontaktu..."
User: "Klient napisał maila. Chcę to powiązać z dealem, projektem 
       I konkretną osobą. Nie mogę."
```

## Rozwiązanie

**Każdy element może być powiązany z dowolną kombinacją encji.**

## Co user widzi

### Tworzenie zadania

```
┌─────────────────────────────────────────────────────────────────┐
│ ✏️ NOWE ZADANIE                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tytuł:                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Zadzwoń do Jana w sprawie oferty Budma                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  POWIĄZANIA                               [+ Dodaj powiązanie]  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🌊 Stream      │ [ABC Okna → Budma 2026              ▼]       │
│                 │                                               │
│  🏢 Firma       │ [ABC Okna Sp. z o.o.                ▼]       │
│                 │ ✨ Auto-uzupełnione ze streamu                │
│                 │                                               │
│  👤 Kontakt     │ [Jan Kowalski                       ▼]       │
│                 │ 📧 jan@abcokna.pl  📞 +48 600 123 456         │
│                 │                                               │
│  💰 Deal        │ [Stoisko Budma 2026 (45K EUR)       ▼]       │
│                 │ Etap: Negocjacje │ Szansa: 70%                │
│                 │                                               │
│  📁 Projekt     │ [Budma 2026 - Realizacja            ▼]       │
│                 │                                               │
│  🎪 Event       │ [Targi Budma 2026, 15-18.02         ▼]       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  SZCZEGÓŁY                                                     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Deadline       │ [20.01.2025    ]   Priorytet │ [Wysoki  ▼]   │
│  Czas           │ [15 min        ]   Energia   │ [Niska   ▼]   │
│                                                                 │
│                                              [Anuluj] [Zapisz]  │
└─────────────────────────────────────────────────────────────────┘
```

### Karta kontaktu - widok zadań

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 Jan Kowalski                                                │
│    Dyrektor handlowy @ ABC Okna Sp. z o.o.                     │
│    📧 jan@abcokna.pl │ 📞 +48 600 123 456                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Przegląd] [Zadania] [Maile] [Notatki] [Deale] [Spotkania]    │
│             ═════════                                           │
│                                                                 │
│  📋 ZADANIA POWIĄZANE Z TYM KONTAKTEM                    (12)  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Filtr: [Wszystkie ▼]  [Aktywne ▼]  Sortuj: [Deadline ▼]       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔴 Zadzwoń w sprawie oferty                   DZIŚ     │   │
│  │    🌊 Budma 2026  │  💰 45K EUR  │  📁 Realizacja       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🟡 Wyślij specyfikację techniczną             22.01     │   │
│  │    🌊 Budma 2026  │  📁 Projektowanie                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🟡 Przygotować umowę                          25.01     │   │
│  │    🌊 Budma 2026  │  💰 45K EUR                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✅ Spotkanie discovery                        15.01     │   │
│  │    🌊 Budma 2026  │  📅 Spotkanie 2h                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📊 Podsumowanie: 3 aktywne │ 9 ukończonych │ 0 przetermin.    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Karta firmy - widok wszystkiego

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 ABC Okna Sp. z o.o.                                         │
│    Branża: Budownictwo │ Klient od: 2022 │ 💚 Health: 85%      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Przegląd] [Kontakty] [Zadania] [Projekty] [Deale] [Dokumenty] │
│            ══════════                                           │
│                                                                 │
│  👥 OSOBY W TEJ FIRMIE                                    (5)  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 👤 Jan Kowalski           │ Dyrektor handlowy         │    │
│  │    📧 jan@abcokna.pl      │ 📋 3 zadania │ 💬 15 maili │    │
│  │    🏷️ Decydent, VIP       │ ⏰ Kontakt: 3 dni temu     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 👤 Anna Nowak             │ Project Manager            │    │
│  │    📧 anna@abcokna.pl     │ 📋 5 zadań │ 💬 23 maile   │    │
│  │    🏷️ Operacyjny          │ ⏰ Kontakt: 1 dzień temu   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 👤 Piotr Wiśniewski       │ Kierownik techniczny       │    │
│  │    📧 piotr@abcokna.pl    │ 📋 2 zadania │ 💬 8 maili  │    │
│  │    🏷️ Techniczny          │ ⏰ Kontakt: tydzień temu   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│                                              [+ Dodaj kontakt]  │
└─────────────────────────────────────────────────────────────────┘
```

## Auto-uzupełnianie (Magia!)

```
SCENARIUSZ 1: User wybiera Stream
─────────────────────────────────────────────────────
User wybiera: 🌊 "ABC Okna → Budma 2026"
                    │
                    ▼
System auto-sugeruje:
   🏢 Firma: ABC Okna ← (stream należy do tego klienta)
   👤 Kontakt: [wybierz] ← (lista kontaktów z ABC Okna)
   💰 Deal: [wybierz] ← (aktywne deale ABC Okna)
   🎪 Event: Budma 2026 ← (wykryty z nazwy streamu)


SCENARIUSZ 2: User wpisuje email
─────────────────────────────────────────────────────
User wpisuje: jan@abcokna.pl
                    │
                    ▼
System rozpoznaje:
   👤 Kontakt: Jan Kowalski
   🏢 Firma: ABC Okna Sp. z o.o.
   
   
SCENARIUSZ 3: User tworzy notatkę ze spotkania
─────────────────────────────────────────────────────
User: "Notatka ze spotkania z Janem z ABC Okna"
                    │
                    ▼
AI sugeruje:
   👤 Kontakt: Jan Kowalski
   🏢 Firma: ABC Okna
   📅 Spotkanie: [dziś o 10:00 - jeśli było w kalendarzu]
```

## Model danych

```prisma
// ============================================
// ROZSZERZENIE 1: Uniwersalne powiązania
// ============================================

// MODYFIKACJA: Task
model Task {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Podstawowe
  title           String
  description     String?
  status          TaskStatus @default(NEW)
  priority        Priority   @default(MEDIUM)
  
  // Daty
  dueDate         DateTime?
  completedAt     DateTime?
  estimatedHours  Float?
  
  // POWIĄZANIA - wszystkie opcjonalne
  streamId        String?
  projectId       String?
  companyId       String?
  contactId       String?          // ← NOWE
  dealId          String?          // ← NOWE
  eventId         String?          // ← NOWE
  milestoneId     String?          // ← NOWE
  
  // Przypisanie
  assignedToId    String?
  createdById     String
  
  // Relacje
  stream          Stream?    @relation(fields: [streamId], references: [id])
  project         Project?   @relation(fields: [projectId], references: [id])
  company         Company?   @relation(fields: [companyId], references: [id])
  contact         Contact?   @relation(fields: [contactId], references: [id])
  deal            Deal?      @relation(fields: [dealId], references: [id])
  event           Event?     @relation(fields: [eventId], references: [id])
  milestone       Milestone? @relation(fields: [milestoneId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([organizationId, contactId])
  @@index([organizationId, companyId])
  @@index([organizationId, dealId])
  @@map("tasks")
}

// MODYFIKACJA: Project  
model Project {
  id              String   @id @default(uuid())
  organizationId  String
  
  name            String
  description     String?
  status          ProjectStatus @default(PLANNING)
  
  // POWIĄZANIA
  streamId        String?
  companyId       String?
  contactId       String?          // ← NOWE: główny kontakt
  dealId          String?          // ← NOWE: powiązany deal
  eventId         String?          // ← NOWE: powiązany event
  
  // Relacje
  stream          Stream?   @relation(fields: [streamId], references: [id])
  company         Company?  @relation(fields: [companyId], references: [id])
  contact         Contact?  @relation(fields: [contactId], references: [id])
  deal            Deal?     @relation(fields: [dealId], references: [id])
  event           Event?    @relation(fields: [eventId], references: [id])
  
  // Powiązane elementy
  tasks           Task[]
  milestones      Milestone[]
  notes           Note[]
  
  @@map("projects")
}

// MODYFIKACJA: Meeting
model Meeting {
  id              String   @id @default(uuid())
  organizationId  String
  
  title           String
  startTime       DateTime
  endTime         DateTime
  location        String?
  notes           String?
  
  // POWIĄZANIA - rozszerzone
  organizedById   String
  contactId       String?
  companyId       String?          // ← NOWE
  dealId          String?          // ← NOWE
  streamId        String?          // ← NOWE
  projectId       String?          // ← NOWE
  eventId         String?          // ← NOWE
  
  // Uczestnicy (wiele kontaktów)
  attendees       MeetingAttendee[]
  
  // Relacje
  organizedBy     User      @relation(fields: [organizedById], references: [id])
  contact         Contact?  @relation(fields: [contactId], references: [id])
  company         Company?  @relation(fields: [companyId], references: [id])
  deal            Deal?     @relation(fields: [dealId], references: [id])
  stream          Stream?   @relation(fields: [streamId], references: [id])
  project         Project?  @relation(fields: [projectId], references: [id])
  event           Event?    @relation(fields: [eventId], references: [id])
  
  @@map("meetings")
}

// NOWE: Uczestnicy spotkania
model MeetingAttendee {
  id              String   @id @default(uuid())
  meetingId       String
  contactId       String?
  userId          String?
  externalEmail   String?  // Dla uczestników spoza systemu
  status          AttendeeStatus @default(PENDING)
  
  meeting         Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  contact         Contact? @relation(fields: [contactId], references: [id])
  user            User?    @relation(fields: [userId], references: [id])
  
  @@map("meeting_attendees")
}

enum AttendeeStatus {
  PENDING
  ACCEPTED
  DECLINED
  TENTATIVE
}

// NOWE: Notatki jako osobny model
model Note {
  id              String   @id @default(uuid())
  organizationId  String
  
  content         String   @db.Text
  
  // POWIĄZANIA - wszystkie opcjonalne
  streamId        String?
  projectId       String?
  taskId          String?
  companyId       String?
  contactId       String?
  dealId          String?
  meetingId       String?
  eventId         String?
  
  // Metadane
  isPinned        Boolean  @default(false)
  createdById     String
  
  // Relacje
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  stream          Stream?      @relation(fields: [streamId], references: [id])
  project         Project?     @relation(fields: [projectId], references: [id])
  task            Task?        @relation(fields: [taskId], references: [id])
  company         Company?     @relation(fields: [companyId], references: [id])
  contact         Contact?     @relation(fields: [contactId], references: [id])
  deal            Deal?        @relation(fields: [dealId], references: [id])
  meeting         Meeting?     @relation(fields: [meetingId], references: [id])
  event           Event?       @relation(fields: [eventId], references: [id])
  createdBy       User         @relation(fields: [createdById], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([organizationId, companyId])
  @@index([organizationId, contactId])
  @@map("notes")
}
```

## Wartość dla użytkownika

| Przed | Po |
|-------|-----|
| "Którego Jana?" | Klikam → widzę firmę, telefon, historię |
| Szukam maili ręcznie | Wszystko w karcie kontaktu |
| Nie wiem ile zadań dla klienta | Dashboard firmy pokazuje wszystko |
| Duplikuję informacje | Jedno źródło prawdy |

---

# ROZSZERZENIE 2: Mapa Relacji Kontaktów

## Problem użytkownika

```
User: "Jan polecił mi kontakt do Marka. Ale nie pamiętam skąd się znają."
User: "Kto jest szefem Anny? Muszę eskalować sprawę."
User: "Z kim rozmawiał Tomek na konferencji? Może to być lead."
```

## Rozwiązanie

**Sieć powiązań między kontaktami z typami relacji i siłą więzi.**

## Co user widzi

### Karta kontaktu - sekcja Relacje

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 Jan Kowalski                                                │
│    Dyrektor handlowy @ ABC Okna                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Przegląd] [Zadania] [Maile] [Relacje] [Notatki]               │
│                              ═════════                          │
│                                                                 │
│  🔗 SIEĆ KONTAKTÓW JANA                                        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  W FIRMIE ABC OKNA                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 👔 Szef: Marek Dyrektor                                │    │
│  │    Prezes @ ABC Okna │ Siła: ●●●●○                     │    │
│  │    Notatka: "Bezpośredni przełożony, decydent"         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 👥 Współpracuje: Anna Nowak                            │    │
│  │    PM @ ABC Okna │ Siła: ●●●●●                         │    │
│  │    Notatka: "Blisko współpracują, Anna prowadzi proj." │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  POZA FIRMĄ                                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 🤝 Polecony przez: Tomek z XYZ                         │    │
│  │    Sales @ XYZ Windows │ Siła: ●●●○○                   │    │
│  │    Notatka: "Poznali się na Budma 2023"                │    │
│  │    Odkryto: 2023-02-20                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 🎓 Zna się z konferencji: Maria Ekspert                │    │
│  │    Konsultant @ Expo Advisory │ Siła: ●●○○○            │    │
│  │    Notatka: "Wymienili wizytówki, Budma 2024"          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│                                        [+ Dodaj relację]        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  📊 WIZUALIZACJA SIECI                        [Otwórz mapę →]  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│                    👔 Marek (szef)                              │
│                         │                                       │
│                         ▼                                       │
│     🤝 Tomek ───────► 👤 JAN ◄─────── 👥 Anna                  │
│                         │                                       │
│                         ▼                                       │
│                    🎓 Maria                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dodawanie relacji

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔗 NOWA RELACJA                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Od:    👤 Jan Kowalski                                        │
│                                                                 │
│  Typ relacji:                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ 👔 Raportuje do (szef/podwładny)                      │   │
│  │ ○ 👥 Współpracuje z                                     │   │
│  │ ● 🤝 Polecony przez / Polecił                           │   │
│  │ ○ 🎓 Zna z konferencji/eventu                           │   │
│  │ ○ 👨‍👩‍👧 Rodzina                                             │   │
│  │ ○ 🔧 Relacja techniczna                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Do:    [Wyszukaj kontakt...                              ▼]   │
│                                                                 │
│  Siła relacji:                                                 │
│         Słaba ○───○───●───○───○ Silna                          │
│                                                                 │
│  Notatka:                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Poznali się na Budma 2023, Tomek polecił Jana jako     │   │
│  │ dobrego partnera do współpracy.                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Odkryto podczas: [Spotkanie z Tomkiem, 2023-02-20      ▼]    │
│                                                                 │
│                                              [Anuluj] [Zapisz]  │
└─────────────────────────────────────────────────────────────────┘
```

### Mapa sieci (widok grafowy)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🗺️ MAPA SIECI: ABC Okna                           [Filtruj ▼]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│              🏢 XYZ Windows                                     │
│                   │                                             │
│                   │ polecił                                     │
│                   ▼                                             │
│   ┌─────────────────────────────────────────────┐              │
│   │                 🏢 ABC OKNA                  │              │
│   │                                             │              │
│   │      👔 Marek ◄──────────────┐              │              │
│   │         │                    │ raportuje   │              │
│   │         │ zarządza           │              │              │
│   │         ▼                    │              │              │
│   │      👤 JAN ─────────────► 👥 Anna         │              │
│   │         │    współpracuje                   │              │
│   │         │                                   │              │
│   │         │ technicznie                       │              │
│   │         ▼                                   │              │
│   │      🔧 Piotr                              │              │
│   │                                             │              │
│   └─────────────────────────────────────────────┘              │
│                   │                                             │
│                   │ zna z konferencji                          │
│                   ▼                                             │
│              🎓 Maria                                          │
│         (Expo Advisory)                                        │
│                                                                 │
│  Legenda: ●●●●● silna │ ───► kierunek │ --- słaba              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## AI wykorzystuje te dane

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI INSIGHT                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💡 "Chcesz dotrzeć do Marka Dyrektora (Prezes ABC Okna)?      │
│      Najlepsza ścieżka: przez Jana Kowalskiego, który          │
│      raportuje bezpośrednio do niego i ma silną relację."      │
│                                                                 │
│  💡 "Tomek z XYZ Windows polecił Ci 3 kontakty w ostatnim      │
│      roku. Może warto poprosić go o więcej rekomendacji?"      │
│                                                                 │
│  💡 "Maria z Expo Advisory zna się z 5 osobami z Twojej        │
│      bazy. Rozważ zaproszenie jej jako konsultanta."           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Model danych

```prisma
// ============================================
// ROZSZERZENIE 2: Mapa relacji kontaktów
// ============================================

model ContactRelation {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Kontakty w relacji
  fromContactId   String
  toContactId     String
  
  // Typ i siła relacji
  relationType    ContactRelationType
  strength        Int      @default(3)  // 1-5
  isBidirectional Boolean  @default(true)
  
  // Kontekst
  notes           String?
  discoveredAt    DateTime @default(now())
  discoveredVia   String?  // "Spotkanie", "Email", "Event"
  
  // Powiązane encje
  eventId         String?  // Gdzie się poznali
  meetingId       String?  // Kiedy odkryliśmy relację
  
  // Metadane
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacje
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  fromContact     Contact      @relation("ContactFrom", fields: [fromContactId], references: [id], onDelete: Cascade)
  toContact       Contact      @relation("ContactTo", fields: [toContactId], references: [id], onDelete: Cascade)
  event           Event?       @relation(fields: [eventId], references: [id])
  meeting         Meeting?     @relation(fields: [meetingId], references: [id])
  createdBy       User         @relation(fields: [createdById], references: [id])
  
  @@unique([fromContactId, toContactId, relationType])
  @@index([organizationId])
  @@map("contact_relations")
}

enum ContactRelationType {
  REPORTS_TO       // Szef/podwładny
  WORKS_WITH       // Współpracownik
  KNOWS            // Znajomy
  REFERRED_BY      // Polecony przez
  FAMILY           // Rodzina
  TECHNICAL        // Relacja techniczna
  FORMER_COLLEAGUE // Były współpracownik
  MENTOR           // Mentor/mentee
  PARTNER          // Partner biznesowy
}
```

## Wartość dla użytkownika

| Przed | Po |
|-------|-----|
| "Skąd się znają?" | Pełna historia relacji |
| "Kto jest szefem?" | Mapa hierarchii |
| "Kto może polecić?" | Widoczne ścieżki dotarcia |
| AI nie wie o relacjach | AI sugeruje najlepsze podejście |

---

# ROZSZERZENIE 3: Health Score Relacji

## Problem użytkownika

```
User: "Straciłem klienta bo zapomniałem o nim na 3 miesiące."
User: "Nie wiem którzy klienci wymagają uwagi."
User: "Dowiaduję się o problemach gdy jest już za późno."
```

## Rozwiązanie

**Automatyczny scoring zdrowia relacji z proaktywnym alertowaniem.**

## Co user widzi

### Dashboard - widget Health

```
┌─────────────────────────────────────────────────────────────────┐
│ 💓 ZDROWIE RELACJI                                  [Więcej →] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠️ WYMAGA UWAGI (3)                                           │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🏢 DEF Glass                                                  │
│     ├── 🔴 Health: 35/100 │ Trend: ↘️ spadający                │
│     ├── ⏰ Ostatni kontakt: 45 dni temu                        │
│     ├── ⚠️ Ryzyka: Brak odpowiedzi na 2 maile                  │
│     └── 💡 Sugestia: Zadzwoń do Jana (decydent)                │
│                                                    [Działaj →] │
│                                                                 │
│  🏢 GHI Steel                                                  │
│     ├── 🟡 Health: 52/100 │ Trend: ↘️ spadający                │
│     ├── ⏰ Ostatni kontakt: 21 dni temu                        │
│     ├── ⚠️ Ryzyka: Deal stoi w miejscu od 2 tyg.               │
│     └── 💡 Sugestia: Wyślij follow-up z nową ofertą            │
│                                                    [Działaj →] │
│                                                                 │
│  👤 Marek Dyrektor (ABC Okna)                                  │
│     ├── 🟡 Health: 58/100 │ Trend: ↔️ stabilny                 │
│     ├── ⏰ Ostatni kontakt: 30 dni temu                        │
│     ├── ⚠️ Ryzyka: VIP bez kontaktu > 3 tyg.                   │
│     └── 💡 Sugestia: Umów spotkanie statusowe                  │
│                                                    [Działaj →] │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  ✅ ZDROWE RELACJE (24)                                        │
│                                                                 │
│  💚 ABC Okna      85/100 ↗️  │  💚 XYZ Windows  78/100 ↔️      │
│  💚 IJK Doors     82/100 ↗️  │  💚 LMN Frames   75/100 ↔️      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Karta firmy - szczegóły Health

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 ABC Okna Sp. z o.o.                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💓 HEALTH SCORE: 85/100                           💚 Zdrowa   │
│  ═══════════════════════════════════════════                   │
│                                                                 │
│  📈 TREND: ↗️ Rosnący (+12 w tym miesiącu)                     │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  SKŁADNIKI HEALTH SCORE                                        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ⏰ Świeżość kontaktu                                          │
│     █████████░░░░ 90/100                                       │
│     Ostatni kontakt: 3 dni temu                                │
│                                                                 │
│  📊 Częstotliwość                                              │
│     ████████░░░░░ 80/100                                       │
│     Średnio: 2x w tygodniu (cel: 1x)                           │
│                                                                 │
│  💬 Responsywność                                              │
│     █████████░░░░ 85/100                                       │
│     Średni czas odpowiedzi: 4h                                 │
│                                                                 │
│  😊 Sentyment                                                  │
│     ████████░░░░░ 78/100                                       │
│     Ostatnie maile: pozytywne                                  │
│                                                                 │
│  🤝 Zaangażowanie                                              │
│     █████████░░░░ 88/100                                       │
│     Aktywny deal, 2 projekty w toku                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  📜 HISTORIA HEALTH                                            │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  100│     ╭─╮                                                  │
│   80│╭──╮╭╯ ╰──╮    ╭────────●                                │
│   60│╯  ╰╯     ╰────╯                                         │
│   40│                                                          │
│   20│                                                          │
│     └─────────────────────────────────────────────────         │
│      Sty    Lut    Mar    Kwi    Maj    Cze    Lip             │
│                                                                 │
│  💡 Spadek w Marcu: brak kontaktu przez 3 tygodnie             │
│     (chorobowe Jana K.)                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Alerty proaktywne (notyfikacje)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔 ALERTY ZDROWIA RELACJI                          Dziś, 09:00 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔴 KRYTYCZNY                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ DEF Glass - Health spadł do 35%                         │   │
│  │ Brak odpowiedzi na maile od 14 dni.                     │   │
│  │ Deal 80K EUR zagrożony.                                 │   │
│  │                                                         │   │
│  │ [📞 Zadzwoń]  [📧 Napisz]  [📅 Umów spotkanie]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🟡 OSTRZEŻENIE                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Marek Dyrektor (ABC Okna) - VIP bez kontaktu 30 dni     │   │
│  │ Utrzymanie relacji z decydentem wymaga uwagi.           │   │
│  │                                                         │   │
│  │ [📅 Umów lunch]  [📧 Wyślij update]  [⏰ Przypomnij]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🟢 INFO                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ABC Okna - Health wzrósł do 85% (+12)                   │   │
│  │ Pozytywny feedback po ostatnim spotkaniu.               │   │
│  │                                                         │   │
│  │ [👍 Super!]  [📝 Dodaj notatkę]                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Logika obliczania Health Score

```
HEALTH SCORE = 
   Recency     × 0.30  (jak dawno kontakt)
 + Frequency   × 0.20  (jak często)
 + Response    × 0.20  (czy odpowiadają)
 + Sentiment   × 0.15  (ton komunikacji)
 + Engagement  × 0.15  (aktywność: deale, projekty)

RECENCY (0-100):
- Dziś:           100
- 1-3 dni:        90
- 4-7 dni:        80
- 8-14 dni:       65
- 15-30 dni:      45
- 31-60 dni:      25
- 60+ dni:        10

ALERT TRIGGERS:
- Health < 40:    🔴 KRYTYCZNY
- Health < 60:    🟡 OSTRZEŻENIE
- Spadek > 20:    🔔 Alert o trendzie
- VIP + 21 dni:   ⚠️ VIP alert
```

## Model danych

```prisma
// ============================================
// ROZSZERZENIE 3: Health Score Relacji
// ============================================

model RelationshipHealth {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Encja której dotyczy
  entityType      HealthEntityType  // COMPANY, CONTACT, DEAL
  entityId        String
  
  // Główny score
  healthScore     Int      // 0-100
  trend           HealthTrend @default(STABLE)
  trendChange     Int      @default(0)  // zmiana vs poprzedni okres
  
  // Składniki (0-100 każdy)
  recencyScore    Int      // Świeżość kontaktu
  frequencyScore  Int      // Częstotliwość
  responseScore   Int      // Responsywność klienta
  sentimentScore  Int      // Sentyment komunikacji
  engagementScore Int      // Zaangażowanie (deale, projekty)
  
  // Ryzyko
  riskLevel       RiskLevel @default(LOW)
  riskFactors     Json      // ["Brak kontaktu 30 dni", ...]
  
  // Ostatnia aktywność
  lastContactAt   DateTime?
  lastContactType String?   // EMAIL, CALL, MEETING
  lastContactById String?
  
  // Metadane
  calculatedAt    DateTime @default(now())
  nextCheckAt     DateTime?
  
  // Relacje
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([entityType, entityId])
  @@index([organizationId, riskLevel])
  @@index([organizationId, healthScore])
  @@map("relationship_health")
}

model HealthHistory {
  id              String   @id @default(uuid())
  healthRecordId  String
  
  healthScore     Int
  recencyScore    Int
  frequencyScore  Int
  responseScore   Int
  sentimentScore  Int
  engagementScore Int
  
  note            String?  // Opcjonalna notatka (np. "spadek - urlop")
  
  recordedAt      DateTime @default(now())
  
  healthRecord    RelationshipHealth @relation(fields: [healthRecordId], references: [id], onDelete: Cascade)
  
  @@index([healthRecordId, recordedAt])
  @@map("health_history")
}

model HealthAlert {
  id              String   @id @default(uuid())
  organizationId  String
  
  entityType      HealthEntityType
  entityId        String
  
  alertType       HealthAlertType
  severity        AlertSeverity
  
  title           String
  message         String
  suggestion      String?
  
  isRead          Boolean  @default(false)
  isDismissed     Boolean  @default(false)
  isActioned      Boolean  @default(false)
  
  actionTaken     String?
  actionedAt      DateTime?
  actionedById    String?
  
  createdAt       DateTime @default(now())
  expiresAt       DateTime?
  
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId, isRead, severity])
  @@map("health_alerts")
}

enum HealthEntityType {
  COMPANY
  CONTACT
  DEAL
}

enum HealthTrend {
  RISING
  STABLE
  DECLINING
  CRITICAL
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum HealthAlertType {
  HEALTH_DROP
  NO_CONTACT
  VIP_NEGLECTED
  DEAL_STALLED
  NEGATIVE_SENTIMENT
  HEALTH_RECOVERED
}

enum AlertSeverity {
  INFO
  WARNING
  CRITICAL
}
```

## Wartość dla użytkownika

| Przed | Po |
|-------|-----|
| Tracę klientów nieświadomie | Alert ZANIM stracę |
| Nie wiem gdzie interweniować | Dashboard priorytetów |
| Reaguję po fakcie | Proaktywne działanie |
| "Zapomniałem zadzwonić" | System pilnuje za mnie |

---

# ROZSZERZENIE 4: Eventy / Targi

## Problem użytkownika

```
User: "Mamy 5 klientów na Budma 2026. Każdy ma osobny stream, 
       ale chcę widzieć wszystko razem - pod kątem targów."
User: "Ile zarobiliśmy na ostatnich targach? Kogo spotkaliśmy?"
User: "Kto z zespołu jedzie? Jaki mamy budżet?"
```

## Rozwiązanie

**Event jako centralna encja organizująca firmy, kontakty, zadania i budżet.**

## Co user widzi

### Lista eventów

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎪 EVENTY I TARGI                              [+ Nowy event]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NADCHODZĄCE                                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎪 BUDMA 2026                                           │   │
│  │    📅 15-18.02.2026 │ 📍 Poznań, MTP                    │   │
│  │    ─────────────────────────────────────────────────    │   │
│  │    🏢 Klienci: 5 firm │ 💰 Pipeline: 450K EUR           │   │
│  │    📋 Zadania: 12 otwartych │ 👥 Zespół: 4 osoby        │   │
│  │    💵 Budżet: 25K EUR (wykorzystano: 40%)               │   │
│  │    ─────────────────────────────────────────────────    │   │
│  │    ⏰ Za 45 dni │ Status: 🟡 Planowanie                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                   [Otwórz →]   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎪 ITM 2026                                             │   │
│  │    📅 01-03.06.2026 │ 📍 Poznań, MTP                    │   │
│  │    ─────────────────────────────────────────────────    │   │
│  │    🏢 Klienci: 2 firmy │ 💰 Pipeline: 120K EUR          │   │
│  │    📋 Zadania: 3 otwarte │ 👥 Zespół: TBD               │   │
│  │    ─────────────────────────────────────────────────    │   │
│  │    ⏰ Za 150 dni │ Status: ⚪ Wstępne                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ZAKOŃCZONE (2024)                                             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🎪 Budma 2024 │ 💰 Wynik: 320K EUR │ ⭐ 4.2/5              │
│  🎪 ITM 2024   │ 💰 Wynik: 85K EUR  │ ⭐ 3.8/5              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Karta eventu - Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎪 BUDMA 2026                                                  │
│    Międzynarodowe Targi Budownictwa                            │
│    📅 15-18.02.2026 │ 📍 Poznań, MTP, Hala 5                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Przegląd] [Firmy] [Zadania] [Zespół] [Budżet] [Dokumenty]     │
│ ══════════                                                      │
│                                                                 │
│  📊 PODSUMOWANIE                                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  💰 PIPELINE │  │  📋 ZADANIA  │  │  ⏰ DO EVENTU │          │
│  │   450K EUR   │  │   12 / 45    │  │   45 DNI     │          │
│  │   5 dealów   │  │   otwartych  │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  🏢 FIRMY NA TYM EVENCIE                                       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  │ Firma          │ Stoisko │ Deal      │ Status     │ Opiekun │
│  ├────────────────┼─────────┼───────────┼────────────┼─────────│
│  │ ABC Okna       │ A-15    │ 120K EUR  │ 🟢 Umowa   │ Jan     │
│  │ XYZ Windows    │ B-22    │ 95K EUR   │ 🟡 Negocj. │ Anna    │
│  │ DEF Glass      │ C-08    │ 80K EUR   │ 🟡 Oferta  │ Jan     │
│  │ GHI Steel      │ TBD     │ 85K EUR   │ 🔴 Lead    │ Piotr   │
│  │ JKL Doors      │ D-12    │ 70K EUR   │ 🟢 Umowa   │ Anna    │
│  │                │         │           │            │         │
│  │ SUMA           │ 4/5     │ 450K EUR  │            │         │
│                                                                 │
│  📋 ZADANIA KRYTYCZNE                                          │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🔴 Zamów materiały na stoisko ABC     │ Za 5 dni   │ Jan     │
│  🔴 Finalizacja umowy XYZ              │ Za 7 dni   │ Anna    │
│  🟡 Rezerwacja hotelu dla zespołu      │ Za 14 dni  │ Piotr   │
│  🟡 Transport eksponatów               │ Za 30 dni  │ Jan     │
│                                                                 │
│  🎯 CELE EVENTU                                                │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ☐ Zamknąć 3 deale (obecnie: 2 ✓)                              │
│  ☐ Pozyskać 10 nowych leadów                                   │
│  ☐ Pipeline > 400K EUR (obecnie: 450K ✓)                       │
│  ☐ Budżet < 30K EUR (obecnie: 25K ✓)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Karta eventu - Zespół

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎪 BUDMA 2026 › 👥 ZESPÓŁ                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NASZ ZESPÓŁ NA TARGACH                          [+ Dodaj]     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Jan Kowalski                    │ Kierownik projektu │   │
│  │    📅 15-18.02 (4 dni)             │ 🏨 Hotel MTP       │   │
│  │    🏢 Odpowiada za: ABC, DEF       │ 📱 +48 600...     │   │
│  │    ✈️ Transport: auto służbowe                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Anna Nowak                      │ Handlowiec         │   │
│  │    📅 15-17.02 (3 dni)             │ 🏨 Hotel MTP       │   │
│  │    🏢 Odpowiada za: XYZ, JKL       │ 📱 +48 601...     │   │
│  │    ✈️ Transport: pociąg                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Piotr Wiśniewski                │ Montażysta         │   │
│  │    📅 14-15.02 (montaż)            │ 🏨 Ibis Poznań     │   │
│  │    🏢 Odpowiada za: montaż stoisk  │ 📱 +48 602...     │   │
│  │    ✈️ Transport: bus z materiałami                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Marek Kierownik                 │ Nadzór             │   │
│  │    📅 16.02 (1 dzień)              │ 🏨 -               │   │
│  │    🏢 VIP meetings                 │ 📱 +48 603...     │   │
│  │    ✈️ Transport: samolot                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📊 PODSUMOWANIE                                               │
│  ─────────────────────────────────────────────────────────────  │
│  Osobodni: 11 │ Hotele: 3 rezerwacje │ Transport: 4 rodzaje    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Karta eventu - Budżet

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎪 BUDMA 2026 › 💰 BUDŻET                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BUDŻET: 30 000 EUR                                            │
│  ███████████░░░░░░░░░ 58% wykorzystane (17 400 EUR)            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  KATEGORIE                                                     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  │ Kategoria        │ Budżet   │ Wydane   │ %   │ Status      │
│  ├──────────────────┼──────────┼──────────┼─────┼─────────────│
│  │ 🎪 Stoiska       │ 15 000   │ 12 000   │ 80% │ 🟡 W toku   │
│  │ 🏨 Hotele        │ 4 000    │ 2 800    │ 70% │ 🟢 OK       │
│  │ ✈️ Transport     │ 3 000    │ 1 200    │ 40% │ 🟢 OK       │
│  │ 🍽️ Catering      │ 3 000    │ 400      │ 13% │ 🟢 OK       │
│  │ 📦 Materiały     │ 3 000    │ 800      │ 27% │ 🟢 OK       │
│  │ 🎁 Upominki      │ 2 000    │ 200      │ 10% │ 🟢 OK       │
│  ├──────────────────┼──────────┼──────────┼─────┼─────────────│
│  │ SUMA             │ 30 000   │ 17 400   │ 58% │             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  OSTATNIE WYDATKI                                              │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  10.01 │ Hotel MTP - rezerwacja 3 pokoje      │ 2 400 EUR     │
│  08.01 │ Materiały reklamowe - druk           │ 800 EUR       │
│  05.01 │ Stoisko ABC - zaliczka 50%           │ 6 000 EUR     │
│                                                                 │
│                                          [+ Dodaj wydatek]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Model danych

```prisma
// ============================================
// ROZSZERZENIE 4: Eventy / Targi
// ============================================

model Event {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Podstawowe info
  name            String
  description     String?
  eventType       EventType
  
  // Lokalizacja
  venue           String?
  city            String?
  country         String?
  address         String?
  
  // Daty
  startDate       DateTime
  endDate         DateTime
  setupDate       DateTime?  // Data montażu
  teardownDate    DateTime?  // Data demontażu
  
  // Status
  status          EventStatus @default(PLANNING)
  
  // Budżet
  budgetPlanned   Float?
  budgetActual    Float?
  currency        String   @default("EUR")
  
  // Cele
  goals           Json?     // [{goal, target, current, achieved}]
  
  // Wyniki (po evencie)
  results         Json?     // {leadsGenerated, dealsClosed, revenue, rating}
  rating          Float?    // 1-5
  retrospective   String?   // Notatki post-event
  
  // Metadane
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacje
  organization    Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy       User             @relation(fields: [createdById], references: [id])
  
  // Powiązane encje
  companies       EventCompany[]
  contacts        EventContact[]
  team            EventTeamMember[]
  tasks           Task[]
  deals           Deal[]
  projects        Project[]
  meetings        Meeting[]
  expenses        EventExpense[]
  notes           Note[]
  
  @@index([organizationId, startDate])
  @@map("events")
}

model EventCompany {
  id              String   @id @default(uuid())
  eventId         String
  companyId       String
  
  // Szczegóły udziału
  role            EventParticipantRole @default(CLIENT)
  boothNumber     String?
  boothSize       String?  // "30m2", "50m2"
  
  // Status
  status          EventParticipantStatus @default(CONFIRMED)
  
  // Finansowe
  dealValue       Float?
  dealId          String?
  
  // Notatki
  notes           String?
  specialRequests String?
  
  // Relacje
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  company         Company  @relation(fields: [companyId], references: [id])
  deal            Deal?    @relation(fields: [dealId], references: [id])
  
  @@unique([eventId, companyId])
  @@map("event_companies")
}

model EventContact {
  id              String   @id @default(uuid())
  eventId         String
  contactId       String
  
  // Planowane spotkanie
  plannedMeetingTime DateTime?
  meetingPriority Priority @default(MEDIUM)
  meetingNotes    String?
  
  // Status
  metDuringEvent  Boolean  @default(false)
  followUpNeeded  Boolean  @default(false)
  
  // Relacje
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  contact         Contact  @relation(fields: [contactId], references: [id])
  
  @@unique([eventId, contactId])
  @@map("event_contacts")
}

model EventTeamMember {
  id              String   @id @default(uuid())
  eventId         String
  userId          String
  
  // Rola
  role            String?  // "Kierownik", "Handlowiec", "Montażysta"
  responsibilities String?
  
  // Daty obecności
  arrivalDate     DateTime?
  departureDate   DateTime?
  
  // Logistyka
  hotelName       String?
  hotelConfirmation String?
  transportType   String?  // "auto", "pociąg", "samolot"
  transportDetails String?
  
  // Kontakt
  phoneNumber     String?
  
  // Przypisane firmy
  assignedCompanyIds String[]
  
  // Relacje
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id])
  
  @@unique([eventId, userId])
  @@map("event_team_members")
}

model EventExpense {
  id              String   @id @default(uuid())
  eventId         String
  
  // Szczegóły
  category        ExpenseCategory
  description     String
  amount          Float
  currency        String   @default("EUR")
  
  // Status
  status          ExpenseStatus @default(PLANNED)
  paidAt          DateTime?
  
  // Dokumenty
  invoiceNumber   String?
  receiptUrl      String?
  
  // Metadane
  createdById     String
  createdAt       DateTime @default(now())
  
  // Relacje
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  createdBy       User     @relation(fields: [createdById], references: [id])
  
  @@map("event_expenses")
}

enum EventType {
  TRADE_SHOW     // Targi
  CONFERENCE     // Konferencja
  WEBINAR        // Webinar
  WORKSHOP       // Warsztaty
  NETWORKING     // Networking
  COMPANY_EVENT  // Event firmowy
  OTHER
}

enum EventStatus {
  DRAFT
  PLANNING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum EventParticipantRole {
  CLIENT         // Nasz klient
  PROSPECT       // Potencjalny klient
  PARTNER        // Partner
  SPONSOR        // Sponsor
  EXHIBITOR      // Wystawca
  VISITOR        // Odwiedzający
}

enum EventParticipantStatus {
  INVITED
  CONFIRMED
  TENTATIVE
  DECLINED
  ATTENDED
  NO_SHOW
}

enum ExpenseCategory {
  BOOTH          // Stoisko
  HOTEL          // Hotel
  TRANSPORT      // Transport
  CATERING       // Catering
  MATERIALS      // Materiały
  GIFTS          // Upominki
  MARKETING      // Marketing
  OTHER
}

enum ExpenseStatus {
  PLANNED
  APPROVED
  PAID
  REJECTED
}
```

## Wartość dla użytkownika

| Przed | Po |
|-------|-----|
| Rozproszone info po streamach | Wszystko pod jednym eventem |
| Nie wiem ile zarobiliśmy | ROI per event |
| Chaos z logistyką | Zespół, hotele, transport |
| Budżet w Excelu | Budżet w systemie |

---

# ROZSZERZENIE 5: Client Intelligence

## Problem użytkownika

```
User: "Jan lubi czarną kawę. Za każdym razem o tym zapominam."
User: "Jakie są preferencje tego klienta? Co lubią, czego nie?"
User: "ABC Okna ma specyficzny proces decyzyjny - 3 tygodnie. 
       Nowy handlowiec tego nie wie i naciska za mocno."
```

## Rozwiązanie

**Strukturalna baza wiedzy o preferencjach i faktach dotyczących klientów.**

## Co user widzi

### Karta firmy - Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 ABC Okna Sp. z o.o.                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Przegląd] [Kontakty] [Zadania] [Intelligence] [Dokumenty]     │
│                                   ══════════════                │
│                                                                 │
│  🧠 WIEDZA O KLIENCIE                            [+ Dodaj]     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ❤️ LUBIĄ                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ★★★ Minimalistyczny design                              │   │
│  │     Źródło: Spotkanie discovery, Jan K.                 │   │
│  │     "Zawsze wybierają proste, czyste linie"             │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ★★★ Szybkie decyzje                                     │   │
│  │     Źródło: Email od Marka D.                           │   │
│  │     "Nie lubią przeciągać - max 2 tygodnie"             │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ★★☆ Innowacyjne rozwiązania                             │   │
│  │     Źródło: Prezentacja produktowa                      │   │
│  │     "Chętnie testują nowości"                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🚫 NIE LUBIĄ                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Kolory pastelowe                                     │   │
│  │     Źródło: Feedback na wizualizację                    │   │
│  │     "Kategorycznie odrzucili pastelową wersję"          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ⚠️ Długie prezentacje                                   │   │
│  │     Źródło: Spotkanie z Markiem D.                      │   │
│  │     "Max 30 min, konkretnie"                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💼 PROCES DECYZYJNY                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Typowy czas decyzji: 2-3 tygodnie                       │   │
│  │ Wymagane akceptacje: Marek D. (prezes) + Anna (finanse) │   │
│  │ Preferowany format oferty: PDF + Excel z kosztorysem    │   │
│  │ Budżet: decyzje < 50K bez zarządu                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📅 WAŻNE DATY                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎂 Urodziny prezesa (Marek): 15 marca                   │   │
│  │ 🎉 Rocznica firmy: 1 czerwca (25 lat w 2025!)           │   │
│  │ 📆 Budżetowanie: wrzesień-październik                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ UNIKAĆ                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🚫 Tematów politycznych (Marek reaguje negatywnie)      │   │
│  │ 🚫 Porównań z konkurencją X (zła historia)              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🏆 OSTATNIE SUKCESY                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🥇 Wygrali przetarg MTP - styczeń 2025                  │   │
│  │ 📈 Wzrost sprzedaży 30% r/r                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Karta kontaktu - Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 Jan Kowalski                                                │
│    Dyrektor handlowy @ ABC Okna                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🧠 WIEDZA O JANIE                               [+ Dodaj]     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ☕ PREFERENCJE OSOBISTE                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☕ Pije tylko czarną kawę (bez cukru)                   │   │
│  │ 🍷 Nie pije alkoholu                                    │   │
│  │ 🥗 Wegetarianin                                         │   │
│  │ ⚽ Fan Lecha Poznań                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💬 STYL KOMUNIKACJI                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📧 Preferuje email nad telefon                          │   │
│  │ ⏰ Najlepiej kontaktować: 9-11 rano                     │   │
│  │ 📝 Lubi konkrety, nie lubi small-talku                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📅 WAŻNE DATY                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎂 Urodziny: 22 lipca                                   │   │
│  │ 👶 Rocznica w firmie: 5 lat (marzec 2025)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💡 WSKAZÓWKI                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✅ Zawsze przychodź przygotowany z danymi               │   │
│  │ ✅ Docenia punktualność                                 │   │
│  │ ⚠️ Nie lubi gdy go popędzają                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🔒 PRYWATNE (tylko Ty widzisz)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Ma problemy z przełożonym (Marek) - nie poruszać       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dodawanie intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│ 🧠 NOWA INFORMACJA                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dotyczy:  [👤 Jan Kowalski                              ▼]   │
│                                                                 │
│  Kategoria:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ ❤️ Lubi / Preferuje                                   │   │
│  │ ○ 🚫 Nie lubi / Unikać                                  │   │
│  │ ● ☕ Preferencja osobista                               │   │
│  │ ○ 💼 Fakt biznesowy                                     │   │
│  │ ○ ⚠️ Ostrzeżenie                                        │   │
│  │ ○ 💡 Wskazówka                                          │   │
│  │ ○ 📅 Ważna data                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Treść:                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Pije tylko czarną kawę, bez cukru                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Ważność:    ○ ★ Niska   ● ★★ Średnia   ○ ★★★ Wysoka          │
│                                                                 │
│  Źródło:    [Lunch biznesowy, 15.01.2025              ]       │
│                                                                 │
│  Widoczność:                                                   │
│  ● 👥 Cały zespół widzi                                       │
│  ○ 🔒 Tylko ja widzę                                          │
│                                                                 │
│                                              [Anuluj] [Zapisz]  │
└─────────────────────────────────────────────────────────────────┘
```

## AI wykorzystuje te dane

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI BRIEFING: Przed spotkaniem z Janem K. (ABC Okna)         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 PRZYGOTUJ:                                                 │
│  • Konkretne dane i liczby (Jan ceni przygotowanie)            │
│  • Prezentację max 30 min (firma nie lubi długich)             │
│  • Propozycję w minimalistycznym stylu (ich preferencja)       │
│                                                                 │
│  ☕ PAMIĘTAJ:                                                   │
│  • Czarna kawa, bez cukru                                      │
│  • Wegetarianin (jeśli lunch)                                  │
│  • Nie pije alkoholu                                           │
│                                                                 │
│  ⚠️ UNIKAJ:                                                    │
│  • Kolorów pastelowych w materiałach                           │
│  • Popędzania - Jan nie lubi presji                            │
│  • Tematów politycznych                                        │
│                                                                 │
│  💡 OKAZJA:                                                    │
│  • Za 2 miesiące 5-lecie Jana w firmie - przygotuj gratulacje  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Model danych

```prisma
// ============================================
// ROZSZERZENIE 5: Client Intelligence
// ============================================

model ClientIntelligence {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Dotyczy
  entityType      IntelEntityType  // COMPANY, CONTACT
  entityId        String
  
  // Treść
  category        IntelCategory
  content         String
  importance      Int      @default(2)  // 1-3
  
  // Kontekst
  source          String?  // "Spotkanie 2024-01-15", "Email", "Obserwacja"
  sourceDate      DateTime?
  sourceContactId String?  // Kto przekazał info
  
  // Widoczność
  isPrivate       Boolean  @default(false)  // Prywatne vs zespołowe
  
  // Dla dat
  eventDate       DateTime?  // Jeśli to ważna data (urodziny itp.)
  isRecurring     Boolean  @default(false)  // Czy corocznie
  
  // Metadane
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacje
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy       User         @relation(fields: [createdById], references: [id])
  sourceContact   Contact?     @relation(fields: [sourceContactId], references: [id])
  
  @@index([organizationId, entityType, entityId])
  @@index([category])
  @@map("client_intelligence")
}

enum IntelEntityType {
  COMPANY
  CONTACT
}

enum IntelCategory {
  LIKES            // Lubi
  DISLIKES         // Nie lubi
  PREFERENCE       // Preferencja osobista
  FACT             // Fakt biznesowy
  WARNING          // Ostrzeżenie
  TIP              // Wskazówka
  IMPORTANT_DATE   // Ważna data
  DECISION_PROCESS // Proces decyzyjny
  COMMUNICATION    // Styl komunikacji
  SUCCESS          // Sukces klienta
}
```

## Wartość dla użytkownika

| Przed | Po |
|-------|-----|
| "Zapomniałem że nie pije" | System przypomina |
| Nowy handlowiec nie wie nic | Briefing przed spotkaniem |
| Każdy zbiera po swojemu | Jedna baza wiedzy |
| Gubimy niuanse | Personalizacja = wyższe zamknięcia |

---

# ROZSZERZENIE 6: Decision Map (Mapa Decyzyjna)

## Problem użytkownika

```
User: "Kto tak naprawdę decyduje o tym dealu?"
User: "Anna blokuje - jak ją przekonać?"
User: "Mamy championa, ale nie wiemy kto jeszcze musi zatwierdzić."
```

## Rozwiązanie

**Mapowanie interesariuszy deala z ich rolami, wpływem i nastawieniem.**

## Co user widzi

### Karta deala - Decision Map

```
┌─────────────────────────────────────────────────────────────────┐
│ 💰 DEAL: Stoisko Budma 2026 (ABC Okna)                         │
│    Wartość: 45K EUR │ Etap: Negocjacje │ Szansa: 70%           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Przegląd] [Aktywności] [Decision Map] [Konkurencja]           │
│                          ══════════════                         │
│                                                                 │
│  🎯 MAPA DECYZYJNA                                             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│              👑 DECYDENT                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  👤 Marek Dyrektor                                      │   │
│  │     Prezes @ ABC Okna                                   │   │
│  │     ─────────────────────────────────────────────────   │   │
│  │     Wpływ: ████████████ 100%                            │   │
│  │     Nastawienie: 😐 Neutralny                           │   │
│  │     ─────────────────────────────────────────────────   │   │
│  │     💬 "Czeka na rekomendację od Jana"                  │   │
│  │     🎯 Motywacja: ROI, prestiż firmy                    │   │
│  │     ⏰ Ostatni kontakt: 14 dni                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│            ┌─────────────┴─────────────┐                       │
│            ▼                           ▼                        │
│       💡 INFLUENCER                🚫 BLOCKER                  │
│  ┌───────────────────────┐   ┌───────────────────────┐         │
│  │  👤 Jan Kowalski      │   │  👤 Anna Finanse      │         │
│  │     Dyr. handlowy     │   │     CFO               │         │
│  │     ───────────────   │   │     ───────────────   │         │
│  │     Wpływ: 70%        │   │     Wpływ: 60%        │         │
│  │     😊 Pozytywny      │   │     😟 Sceptyczny     │         │
│  │     ───────────────   │   │     ───────────────   │         │
│  │     ⭐ CHAMPION       │   │     ⚠️ Obiekcja:      │         │
│  │     Aktywnie nas      │   │     "Za drogo w      │         │
│  │     wspiera           │   │     stosunku do      │         │
│  │                       │   │     poprzedniego"    │         │
│  └───────────────────────┘   └───────────────────────┘         │
│                                         │                       │
│                                         ▼                       │
│                               🔧 TECHNICAL                      │
│                      ┌───────────────────────┐                 │
│                      │  👤 Piotr Tech        │                 │
│                      │     Kier. techniczny  │                 │
│                      │     ───────────────   │                 │
│                      │     Wpływ: 40%        │                 │
│                      │     😊 Pozytywny      │                 │
│                      │     ───────────────   │                 │
│                      │     ✅ Zatwierdził    │                 │
│                      │     specyfikację      │                 │
│                      └───────────────────────┘                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  📊 PODSUMOWANIE                                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Champions: 1 │ Neutralni: 1 │ Sceptyczni: 1 │ Blockerzy: 0   │
│                                                                 │
│  💡 AI INSIGHT:                                                │
│  "Anna (CFO) jest sceptyczna z powodu ceny. Rozważ:            │
│   1. Przygotowanie analizy ROI specjalnie dla niej             │
│   2. Pokazanie oszczędności vs. poprzedni dostawca             │
│   3. Opcję płatności w ratach"                                 │
│                                                                 │
│  🎯 NASTĘPNY KROK:                                             │
│  Spotkanie z Anną + przygotowana analiza ROI                   │
│                                                    [Zaplanuj]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dodawanie stakeholdera

```
┌─────────────────────────────────────────────────────────────────┐
│ 👥 DODAJ STAKEHOLDERA DO DEALA                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Kontakt:    [Wyszukaj...                                 ▼]   │
│              👤 Anna Finanse (CFO @ ABC Okna)                  │
│                                                                 │
│  Rola w decyzji:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ 👑 Decydent (Final decision maker)                    │   │
│  │ ○ 💡 Influencer (Wpływa na decyzję)                     │   │
│  │ ○ ⭐ Champion (Aktywnie wspiera)                        │   │
│  │ ● 🚫 Blocker (Może zablokować)                          │   │
│  │ ○ 👤 User (Będzie używać)                               │   │
│  │ ○ 🔧 Technical (Ocena techniczna)                       │   │
│  │ ○ 💰 Financial (Ocena finansowa)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Wpływ na decyzję:                                             │
│         Niski ○───○───○───●───○ Wysoki                         │
│                           60%                                   │
│                                                                 │
│  Nastawienie:                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ 😊 Pozytywny - wspiera nas                            │   │
│  │ ○ 😐 Neutralny - nie zajął stanowiska                   │   │
│  │ ● 😟 Sceptyczny - ma wątpliwości                        │   │
│  │ ○ 😠 Negatywny - aktywnie przeciw                       │   │
│  │ ○ ❓ Nieznany                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Obiekcje / Wątpliwości:                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Uważa że cena jest za wysoka w porównaniu do            │   │
│  │ poprzedniego dostawcy. Potrzebuje uzasadnienia ROI.     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Motywacje:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Kontrola kosztów, przewidywalność budżetu               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                              [Anuluj] [Zapisz]  │
└─────────────────────────────────────────────────────────────────┘
```

## Model danych

```prisma
// ============================================
// ROZSZERZENIE 6: Decision Map
// ============================================

model DealStakeholder {
  id              String   @id @default(uuid())
  dealId          String
  contactId       String
  
  // Rola
  role            StakeholderRole
  isChampion      Boolean  @default(false)
  
  // Wpływ i nastawienie
  influence       Int      // 0-100%
  sentiment       Sentiment
  
  // Szczegóły
  objections      String?  // Obiekcje/wątpliwości
  motivations     String?  // Co go motywuje
  winStrategy     String?  // Jak go przekonać
  
  // Status
  hasApproved     Boolean  @default(false)
  approvedAt      DateTime?
  
  // Ostatnia interakcja
  lastInteractionAt DateTime?
  lastInteractionNote String?
  
  // Metadane
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacje
  deal            Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)
  contact         Contact  @relation(fields: [contactId], references: [id])
  createdBy       User     @relation(fields: [createdById], references: [id])
  
  @@unique([dealId, contactId])
  @@map("deal_stakeholders")
}

enum StakeholderRole {
  DECISION_MAKER   // Decydent
  INFLUENCER       // Wpływa na decyzję
  CHAMPION         // Aktywnie wspiera
  BLOCKER          // Może zablokować
  USER             // Będzie używać produktu
  TECHNICAL        // Ocena techniczna
  FINANCIAL        // Ocena finansowa
  LEGAL            // Ocena prawna
  PROCUREMENT      // Zakupy
}

enum Sentiment {
  POSITIVE        // 😊 Wspiera
  NEUTRAL         // 😐 Neutralny
  SKEPTICAL       // 😟 Sceptyczny
  NEGATIVE        // 😠 Przeciwny
  UNKNOWN         // ❓ Nieznany
}
```

## Wartość dla użytkownika

| Przed | Po |
|-------|-----|
| "Kto decyduje?" | Wizualna mapa ról |
| "Dlaczego deal stoi?" | Widać blokerów i obiekcje |
| Nie wiemy kogo przekonać | AI sugeruje strategię |
| Champion nie wykorzystany | Wiemy kto nas wspiera |

---

# ROZSZERZENIE 7: Konkurencja w Dealach

## Problem użytkownika

```
User: "Z kim konkurujemy w tym dealu?"
User: "Jaka jest ich oferta? Czym wygrywamy?"
User: "Przegraliśmy - ale nie wiem dlaczego."
```

## Rozwiązanie

**Śledzenie konkurentów per deal z analizą przewag.**

## Co user widzi

### Karta deala - Konkurencja

```
┌─────────────────────────────────────────────────────────────────┐
│ 💰 DEAL: Stoisko Budma 2026 (ABC Okna)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Przegląd] [Decision Map] [Konkurencja] [Historia]             │
│                            ═════════════                        │
│                                                                 │
│  ⚔️ ANALIZA KONKURENCJI                          [+ Dodaj]     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🏆 MY: Sorto Design                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💰 Nasza oferta: 45 000 EUR                            │   │
│  │  📊 Szansa na wygraną: 70%                              │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  ✅ Nasze przewagi:                                     │   │
│  │     • Historia współpracy (3 lata)                      │   │
│  │     • Jakość wykonania                                  │   │
│  │     • Lokalny serwis                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ⚔️ KONKURENT 1: StandPro                     🔴 ZAGROŻENIE   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💰 Ich oferta: ~40 000 EUR (szacunkowo)                │   │
│  │  📊 Zagrożenie: WYSOKIE                                 │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  ⚠️ Ich przewagi:                                       │   │
│  │     • Niższa cena (-11%)                                │   │
│  │     • Agresywna sprzedaż                                │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  ✅ Nasze przewagi vs nich:                             │   │
│  │     • Lepsza jakość materiałów                          │   │
│  │     • Terminowość (oni mają opóźnienia)                 │   │
│  │     • Bezpośredni kontakt (oni przez pośredników)       │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  📝 Intel: Słyszałem od Anny że rozmawiają z nimi       │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  Status: 🟡 AKTYWNY                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚔️ KONKURENT 2: ExpoMax                      🟢 NISKIE       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💰 Ich oferta: ~55 000 EUR                             │   │
│  │  📊 Zagrożenie: NISKIE                                  │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  ⚠️ Ich przewagi:                                       │   │
│  │     • Większe portfolio                                 │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  ❌ Ich słabości:                                       │   │
│  │     • Droższi od nas o 22%                              │   │
│  │     • Słabe opinie na rynku                             │   │
│  │     • Brak doświadczenia z tym klientem                 │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  Status: 🟢 WYELIMINOWANY (za drogi)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  📊 PODSUMOWANIE                                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Aktywni konkurenci: 1 │ Wyeliminowani: 1                      │
│  Nasza pozycja: #2 pod względem ceny, #1 pod względem jakości  │
│                                                                 │
│  💡 AI REKOMENDACJA:                                           │
│  "StandPro jest głównym zagrożeniem. Strategia:                │
│   1. Podkreślaj jakość i terminowość (ich słabe punkty)        │
│   2. Przygotuj case study z poprzednich realizacji             │
│   3. Rozważ rabat 5% żeby zmniejszyć różnicę cenową"           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Analiza post-mortem (przegrany deal)

```
┌─────────────────────────────────────────────────────────────────┐
│ 💰 DEAL: Stoisko Expo 2024 (XYZ Corp) - PRZEGRANY              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 ANALIZA POST-MORTEM                                        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ❌ Wygrał: StandPro                                           │
│  💰 Ich cena: 38 000 EUR (vs nasza: 42 000 EUR)                │
│                                                                 │
│  📋 POWODY PRZEGRANEJ                                          │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  1. 💰 Cena (główny powód)                                     │
│     Byliśmy drożsi o 10.5%                                     │
│                                                                 │
│  2. ⏰ Czas reakcji                                            │
│     Nasza oferta wyszła 3 dni po konkurencji                   │
│                                                                 │
│  3. 👤 Relacja                                                 │
│     StandPro miał istniejący kontakt z dyrektorem zakupów      │
│                                                                 │
│  📝 WNIOSKI NA PRZYSZŁOŚĆ                                      │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  • Szybsza reakcja na zapytania (cel: <24h)                    │
│  • Rozważyć elastyczność cenową dla nowych klientów            │
│  • Budować relacje z działem zakupów wcześniej                 │
│                                                                 │
│  📅 Follow-up: Za 6 miesięcy sprawdzić satysfakcję             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Model danych

```prisma
// ============================================
// ROZSZERZENIE 7: Konkurencja w Dealach
// ============================================

model DealCompetitor {
  id              String   @id @default(uuid())
  dealId          String
  
  // Konkurent
  competitorName  String
  competitorWebsite String?
  
  // Ich oferta
  estimatedPrice  Float?
  priceSource     String?  // Skąd wiemy
  currency        String   @default("EUR")
  
  // Ocena zagrożenia
  threatLevel     ThreatLevel
  
  // Analiza
  theirStrengths  String?  // Ich przewagi
  theirWeaknesses String?  // Ich słabości
  ourAdvantages   String?  // Nasze przewagi vs nich
  
  // Status
  status          CompetitorStatus @default(ACTIVE)
  eliminatedReason String? // Jeśli wyeliminowany - dlaczego
  
  // Intel
  intelNotes      String?  // Dodatkowe informacje
  intelSource     String?  // Skąd wiemy
  intelDate       DateTime?
  
  // Metadane
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacje
  deal            Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)
  createdBy       User     @relation(fields: [createdById], references: [id])
  
  @@map("deal_competitors")
}

// Analiza przegranego deala
model DealLostAnalysis {
  id              String   @id @default(uuid())
  dealId          String   @unique
  
  // Kto wygrał
  winnerName      String
  winnerPrice     Float?
  
  // Powody przegranej
  lostReasons     Json     // [{reason, importance}]
  
  // Wnioski
  lessonsLearned  String?
  improvementAreas String?
  
  // Follow-up
  followUpDate    DateTime?
  followUpDone    Boolean  @default(false)
  followUpNotes   String?
  
  // Metadane
  analyzedById    String
  analyzedAt      DateTime @default(now())
  
  // Relacje
  deal            Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)
  analyzedBy      User     @relation(fields: [analyzedById], references: [id])
  
  @@map("deal_lost_analyses")
}

enum ThreatLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum CompetitorStatus {
  ACTIVE
  ELIMINATED
  WON
  UNKNOWN
}
```

## Wartość dla użytkownika

| Przed | Po |
|-------|-----|
| "Z kim konkurujemy?" | Pełna mapa konkurencji |
| Nie wiemy ich ceny | Szacunkowa oferta + źródło |
| Przegraliśmy i nie wiemy czemu | Analiza post-mortem |
| Te same błędy się powtarzają | Wnioski na przyszłość |

---

# ROZSZERZENIE 8: Kamienie Milowe Projektu

## Problem użytkownika

```
User: "Mamy 50 zadań w projekcie - co jest najważniejsze?"
User: "Kiedy kolejny kamień milowy? Co musi być gotowe?"
User: "Projekt się opóźnia - które zadania są na ścieżce krytycznej?"
```

## Rozwiązanie

**Kamienie milowe jako punkty kontrolne projektu z zadaniami pod spodem.**

## Co user widzi

### Widok projektu - Milestones

```
┌─────────────────────────────────────────────────────────────────┐
│ 📁 PROJEKT: Budma 2026 - ABC Okna                              │
│    Status: 🟡 W toku │ 45/65 zadań │ 69%                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Lista zadań] [Kamienie milowe] [Gantt] [Zespół]               │
│                ═════════════════                                │
│                                                                 │
│  🏔️ KAMIENIE MILOWE                                           │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ✅ 15.11 │ Podpisanie umowy                                   │
│     └── Ukończono 15.11 │ 5/5 zadań ✓                          │
│                                                                 │
│  ✅ 01.12 │ Zatwierdzenie wizualizacji                         │
│     └── Ukończono 28.11 (3 dni wcześniej!) │ 8/8 zadań ✓       │
│                                                                 │
│  🔄 15.12 │ Zamówienie materiałów          ← AKTUALNY          │
│     │                                                          │
│     ├── ███████████████░░░░░ 75% │ 6/8 zadań                   │
│     │                                                          │
│     ├── ✅ Specyfikacja techniczna                             │
│     ├── ✅ Wybór dostawców                                     │
│     ├── ✅ Negocjacje cenowe                                   │
│     ├── ✅ Akceptacja klienta                                  │
│     ├── ✅ Zamówienie profili aluminiowych                     │
│     ├── ✅ Zamówienie grafik                                   │
│     ├── 🔄 Zamówienie oświetlenia LED        ← W toku          │
│     └── ⏳ Potwierdzenie terminów dostaw                       │
│     │                                                          │
│     └── ⚠️ Opóźnienie: 2 dni (problem z dostawcą LED)         │
│                                                                 │
│  ⏳ 05.01 │ Start produkcji                                    │
│     └── 0/12 zadań │ Zależny od: Zamówienie materiałów         │
│                                                                 │
│  ⏳ 01.02 │ Montaż próbny                                      │
│     └── 0/6 zadań │ ⚠️ KRYTYCZNY                               │
│                                                                 │
│  ⏳ 14.02 │ Transport do Poznania                              │
│     └── 0/4 zadania                                            │
│                                                                 │
│  ⏳ 15.02 │ Montaż na targach                                  │
│     └── 0/8 zadań │ DEADLINE TWARDY                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  📊 TIMELINE                                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Lis    │    Gru    │    Sty    │    Lut                       │
│  ───────┼───────────┼───────────┼────────                      │
│  ✅─────●           │           │                              │
│       ✅────●       │           │                              │
│            🔄────●  │           │                              │
│                 ⏳──────●       │                              │
│                      ⏳─────────●                              │
│                               ⏳─●                             │
│                                ⏳●                             │
│                                  │                              │
│                                TARGI                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tworzenie kamienia milowego

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏔️ NOWY KAMIEŃ MILOWY                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Nazwa:                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Zamówienie materiałów                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Opis:                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Wszystkie materiały zamówione, terminy potwierdzone     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Data:         [15.12.2024    ]                                │
│                                                                 │
│  ⚠️ Krytyczny:  ☑️ Tak (opóźnienie wpływa na kolejne)          │
│                                                                 │
│  Zależności:                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑️ Zatwierdzenie wizualizacji (musi być ukończony)      │   │
│  │ ☐ Start produkcji (zależy od tego kamienia)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Odpowiedzialny:  [Jan Kowalski                         ▼]    │
│                                                                 │
│  Przypisane zadania:                      [+ Dodaj zadanie]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑️ Specyfikacja techniczna                              │   │
│  │ ☑️ Wybór dostawców                                      │   │
│  │ ☑️ Negocjacje cenowe                                    │   │
│  │ ☐ Zamówienie profili aluminiowych                       │   │
│  │ ☐ Zamówienie grafik                                     │   │
│  │ ☐ Zamówienie oświetlenia LED                            │   │
│  │ ☐ Potwierdzenie terminów dostaw                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                              [Anuluj] [Zapisz]  │
└─────────────────────────────────────────────────────────────────┘
```

## Model danych

```prisma
// ============================================
// ROZSZERZENIE 8: Kamienie Milowe
// ============================================

model Milestone {
  id              String   @id @default(uuid())
  projectId       String
  
  // Podstawowe
  name            String
  description     String?
  
  // Data
  dueDate         DateTime
  completedAt     DateTime?
  
  // Status
  status          MilestoneStatus @default(PENDING)
  
  // Ważność
  isCritical      Boolean  @default(false)  // Czy na ścieżce krytycznej
  
  // Zależności
  dependsOnIds    String[] // IDs poprzednich milestones
  
  // Odpowiedzialność
  responsibleId   String?
  
  // Metadane
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacje
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  responsible     User?    @relation(fields: [responsibleId], references: [id])
  createdBy       User     @relation("MilestoneCreator", fields: [createdById], references: [id])
  tasks           Task[]
  
  @@index([projectId, dueDate])
  @@map("milestones")
}

enum MilestoneStatus {
  PENDING      // Oczekuje
  IN_PROGRESS  // W toku
  COMPLETED    // Ukończony
  DELAYED      // Opóźniony
  BLOCKED      // Zablokowany
}
```

## Wartość dla użytkownika

| Przed | Po |
|-------|-----|
| 50 zadań w jednej liście | Grupowanie w milestones |
| Nie wiem co krytyczne | Widoczna ścieżka krytyczna |
| Projekt się opóźnia ale nie wiem gdzie | Widać który milestone opóźniony |
| Brak punktów kontrolnych | Jasne checkpointy |

---

# ROZSZERZENIE 9: Historia Produktów/Usług per Klient

## Problem użytkownika

```
User: "Co już kupił ten klient?"
User: "Jaka jest średnia wartość zamówienia?"
User: "Czy możemy zaproponować upsell?"
```

## Rozwiązanie

**Pełna historia zamówień z analizą dla personalizacji ofert.**

## Co user widzi

### Karta firmy - Historia zamówień

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 ABC Okna Sp. z o.o.                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Przegląd] [Kontakty] [Historia zamówień] [Intelligence]       │
│                        ═══════════════════                      │
│                                                                 │
│  📦 HISTORIA WSPÓŁPRACY                                        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  💰 PODSUMOWANIE                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Całkowita wartość:   125 000 EUR                      │   │
│  │  Liczba zamówień:     5                                 │   │
│  │  Średnia wartość:     25 000 EUR                       │   │
│  │  Klient od:           2022 (3 lata)                     │   │
│  │  Trend:               📈 +18% r/r                       │   │
│  │                                                         │   │
│  │  ⭐ Średnia ocena:    4.6 / 5                           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📋 ZAMÓWIENIA                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  │ Data     │ Produkt/Usługa           │ Wartość  │ Ocena │   │
│  ├──────────┼──────────────────────────┼──────────┼───────│   │
│  │ 02.2025  │ 🔄 Stoisko Budma 2026    │ 45K EUR  │ -     │   │
│  │          │    (W TRAKCIE)           │          │       │   │
│  ├──────────┼──────────────────────────┼──────────┼───────│   │
│  │ 02.2024  │ Stoisko Budma 2025       │ 38K EUR  │ ⭐⭐⭐⭐⭐│   │
│  │          │    50m², minimalistyczne  │          │       │   │
│  │          │    💬 "Świetna jakość!"  │          │       │   │
│  ├──────────┼──────────────────────────┼──────────┼───────│   │
│  │ 06.2024  │ Stoisko ITM 2024         │ 28K EUR  │ ⭐⭐⭐⭐ │   │
│  │          │    30m², z zapleczem     │          │       │   │
│  │          │    💬 "Dobra robota,      │          │       │   │
│  │          │    drobne opóźnienie"    │          │       │   │
│  ├──────────┼──────────────────────────┼──────────┼───────│   │
│  │ 02.2023  │ Stoisko Budma 2024       │ 32K EUR  │ ⭐⭐⭐⭐⭐│   │
│  │          │    40m², podświetlane    │          │       │   │
│  ├──────────┼──────────────────────────┼──────────┼───────│   │
│  │ 02.2022  │ Rollup + materiały       │ 2K EUR   │ ⭐⭐⭐⭐⭐│   │
│  │          │    (pierwsza współpraca) │          │       │   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  📊 ANALIZA                                                    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Najczęściej kupowane:                                         │
│  • Stoiska targowe (80% wartości)                              │
│  • Materiały reklamowe (20% wartości)                          │
│                                                                 │
│  Sezonowość:                                                   │
│  • Głównie Q1 (targi lutowe)                                   │
│  • Dodatkowe zamówienia Q2 (ITM czerwiec)                      │
│                                                                 │
│  Trend cenowy:                                                 │
│  • 2022: 2K → 2023: 32K → 2024: 66K → 2025: 45K (w toku)      │
│  • Średni wzrost: 400% (bez pierwszego zamówienia: +18%)       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  💡 AI SUGESTIE UPSELL                                         │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  • 🎯 Usługa montażu premium (+15% do wartości)                │
│    Klient docenia jakość, może zainteresować                   │
│                                                                 │
│  • 🎯 Pakiet materiałów na cały rok                            │
│    Kupują materiały osobno - bundle może być atrakcyjny        │
│                                                                 │
│  • 🎯 Stoisko na ITM 2026                                      │
│    Historycznie zamawiają na oba targi                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Model danych

```prisma
// ============================================
// ROZSZERZENIE 9: Historia Produktów/Usług
// ============================================

model ClientProduct {
  id              String   @id @default(uuid())
  organizationId  String
  companyId       String
  
  // Co kupiono
  productId       String?
  serviceId       String?
  customName      String?  // Jeśli niestandardowe
  customDescription String?
  
  // Kiedy i za ile
  deliveredAt     DateTime
  value           Float
  currency        String   @default("EUR")
  
  // Feedback
  rating          Int?     // 1-5
  feedback        String?
  
  // Powiązania
  dealId          String?
  projectId       String?
  invoiceId       String?
  
  // Metadane
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacje
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  company         Company      @relation(fields: [companyId], references: [id])
  product         Product?     @relation(fields: [productId], references: [id])
  service         Service?     @relation(fields: [serviceId], references: [id])
  deal            Deal?        @relation(fields: [dealId], references: [id])
  project         Project?     @relation(fields: [projectId], references: [id])
  invoice         Invoice?     @relation(fields: [invoiceId], references: [id])
  createdBy       User         @relation(fields: [createdById], references: [id])
  
  @@index([organizationId, companyId])
  @@map("client_products")
}

model ClientProductStats {
  id              String   @id @default(uuid())
  organizationId  String
  companyId       String   @unique
  
  // Statystyki
  totalValue      Float    @default(0)
  orderCount      Int      @default(0)
  averageValue    Float    @default(0)
  averageRating   Float?
  
  // Trendy
  yearOverYearGrowth Float?
  lastOrderAt     DateTime?
  firstOrderAt    DateTime?
  
  // Segmentacja
  topProducts     Json?    // [{productId, count, value}]
  seasonality     Json?    // [{quarter, averageValue}]
  
  // Metadane
  calculatedAt    DateTime @default(now())
  
  // Relacje
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  company         Company      @relation(fields: [companyId], references: [id])
  
  @@map("client_product_stats")
}
```

## Wartość dla użytkownika

| Przed | Po |
|-------|-----|
| "Co kupił ten klient?" | Pełna historia z feedbackiem |
| Nie wiem co zaproponować | AI sugeruje upsell |
| Dane w Excelu | Zintegrowane z CRM |
| Brak analizy trendów | Automatyczne statystyki |

---

# PODSUMOWANIE

## Kolejność implementacji (rekomendowana)

| Faza | Rozszerzenia | Uzasadnienie |
|------|--------------|--------------|
| **Faza 1** | 1. Uniwersalne powiązania | Fundament dla pozostałych |
| **Faza 2** | 3. Health Score | Natychmiastowa wartość |
| | 5. Client Intelligence | Personalizacja |
| | 6. Decision Map | Wygrywanie deali |
| **Faza 3** | 2. Mapa relacji kontaktów | Rozbudowa sieci |
| | 7. Konkurencja | Analiza rynku |
| | 9. Historia produktów | Upselling |
| **Faza 4** | 4. Eventy/Targi | Dla branży targowej |
| | 8. Kamienie milowe | Dla projektów |

## Szacowany wpływ

| Metryka | Przed | Po | Zmiana |
|---------|-------|-----|--------|
| Czas na znalezienie info | 5 min | 30 sek | -90% |
| Straceni klienci (brak kontaktu) | 5/rok | 1/rok | -80% |
| Zamknięte deale | 30% | 45% | +50% |
| Czas onboardingu handlowca | 2 tyg | 3 dni | -75% |
| Personalizacja ofert | manualna | automatyczna | ∞ |

---

**Sorto CRM - System który rozumie relacje, nie tylko dane.**

*Specyfikacja v1.0 | Luty 2025*
