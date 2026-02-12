# FLOW ENGINE - TASK 5: Dashboard Dnia (Killer Feature)

## Cel
Zastąpić generyczny dashboard nowoczesnym **Dashboardem Dnia** - centrum dowodzenia które mówi userowi CO ROBIĆ DZIŚ, nie tylko pokazuje statystyki.

---

## Problem obecnego dashboardu

| Element | Problem |
|---------|---------|
| Lejek sprzedaży | Statyczny, nie actionable |
| Asystent AI | Pasywny - czeka na pytanie |
| "1 zadanie do zrobienia" | Zero kontekstu, zero priorytetu |
| Szybkie akcje | Generyczne, jak w każdym CRM |
| Brak Źródła | Nie widać co czeka na przetworzenie |
| Brak fokusa | Nie wiadomo od czego zacząć |

**Diagnoza:** Dashboard pokazuje STAN, a powinien pokazywać AKCJĘ.

---

## Filozofia nowego dashboardu

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Stary dashboard:  "Oto twoje dane"                       │
│   Nowy dashboard:   "Oto co powinieneś dziś zrobić"        │
│                                                             │
│   STAN → AKCJA                                              │
│   STATYSTYKI → PRIORYTETY                                   │
│   PASYWNY → PROAKTYWNY                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Wireframe: Dashboard Dnia

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ☀️ Dzień dobry, Waldek!                           Wtorek, 11 lutego 2025  │
│                                                           ● AI Online       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 🤖 PORANNY BRIEFING                                                   │ │
│  │                                                                       │ │
│  │  Dziś masz 3 pilne rzeczy:                                           │ │
│  │                                                                       │ │
│  │  🔴 Faktura ABC Okna (22 500 EUR) - deadline DZIŚ                    │ │
│  │  📞 Spotkanie z XYZ Logistics o 14:00                                │ │
│  │  ⚪ 5 nowych elementów w Źródle czeka na przetworzenie               │ │
│  │                                                                       │ │
│  │  💡 Tip: Zacznij od Źródła - zajmie 5 minut, potem będziesz mieć    │ │
│  │     czystą głowę na resztę dnia.                                     │ │
│  │                                                                       │ │
│  │  [🚀 Zacznij dzień]                              [Pokaż szczegóły ↓] │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │ ⚪ ŹRÓDŁO           │  │ 🎯 FOKUS DNIA       │  │ 📅 DZIŚ             │ │
│  │                     │  │                     │  │                     │ │
│  │  5                  │  │  ☐ Faktura ABC     │  │  09:00  ░░░░░░░░░  │ │
│  │  elementów          │  │     deadline: dziś  │  │  10:00  █████░░░░  │ │
│  │                     │  │                     │  │  11:00  ░░░░░░░░░  │ │
│  │  🔴 2 pilne         │  │  ☐ Oferta XYZ      │  │  12:00  ░░░░░░░░░  │ │
│  │  🟡 3 nowe          │  │     deadline: jutro │  │  13:00  🍽️ Lunch   │ │
│  │                     │  │                     │  │  14:00  📞 XYZ     │ │
│  │  ┌───────────────┐  │  │  ☐ Follow-up DEF  │  │  15:00  ░░░░░░░░░  │ │
│  │  │ Przetwórz    │  │  │     5 dni czeka    │  │  16:00  ░░░░░░░░░  │ │
│  │  │ teraz (5min) │  │  │                     │  │                     │ │
│  │  └───────────────┘  │  │  ─────────────────  │  │                     │ │
│  │                     │  │  0/3 ukończone     │  │                     │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🌊 AKTYWNE STRUMIENIE                                      [Zobacz all →] │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ABC Okna → Budma 2026                                             │   │
│  │  ████████████████░░░░ 80%                    2 zadania  │ 15 dni   │   │
│  │                                                                     │   │
│  │  XYZ Logistics → Projekt Q1                                        │   │
│  │  ████████████░░░░░░░░ 60%                    5 zadań    │ 28 dni   │   │
│  │                                                                     │   │
│  │  Marketing → Kampania Wiosna                                       │   │
│  │  ████████░░░░░░░░░░░░ 40%                    3 zadania  │ 45 dni   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ ⏰ CZEKA NA ODPOWIEDŹ       │  │ 📊 TWÓJ TYDZIEŃ                     │  │
│  │                             │  │                                     │  │
│  │  Jan Kowalski (ABC)  3 dni  │  │   Pon  Wto  Śro  Czw  Pią          │  │
│  │  Anna Nowak (XYZ)    5 dni  │  │    ██   ░░   ░░   ░░   ░░          │  │
│  │  Piotr Wiśniewski    7 dni  │  │    12    0    0    0    0          │  │
│  │                             │  │                                     │  │
│  │  [Wyślij follow-up →]       │  │   Ukończone zadania                │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Komponenty szczegółowo

### 1. Poranny Briefing AI 🤖

**Cel:** Spersonalizowane podsumowanie dnia generowane przez AI.

```typescript
interface MorningBriefing {
  greeting: string;           // "Dzień dobry, Waldek!"
  date: string;               // "Wtorek, 11 lutego 2025"
  
  urgentItems: BriefingItem[];  // Max 3 najważniejsze
  
  tip: string;                // Kontekstowa rada
  
  stats: {
    sourceItems: number;      // Ile w Źródle
    tasksToday: number;       // Zadania na dziś
    meetingsToday: number;    // Spotkania
    overdueItems: number;     // Przeterminowane
  };
}

interface BriefingItem {
  type: 'DEADLINE' | 'MEETING' | 'SOURCE' | 'FOLLOWUP' | 'OVERDUE';
  icon: string;
  title: string;
  subtitle: string;          // deadline, godzina, kwota
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actionUrl: string;
}
```

**Logika generowania:**

```typescript
async function generateMorningBriefing(userId: string): Promise<MorningBriefing> {
  
  // 1. Pobierz dane
  const [source, tasks, meetings, overdue, followups] = await Promise.all([
    getSourceItems(userId),
    getTasksForToday(userId),
    getMeetingsForToday(userId),
    getOverdueTasks(userId),
    getAwaitingFollowups(userId)
  ]);
  
  // 2. Priorytetyzuj (max 3 urgent items)
  const urgentItems: BriefingItem[] = [];
  
  // Deadline DZIŚ = zawsze pilne
  tasks
    .filter(t => isToday(t.deadline) && !t.completed)
    .slice(0, 2)
    .forEach(t => urgentItems.push({
      type: 'DEADLINE',
      icon: '🔴',
      title: t.title,
      subtitle: t.amount ? `${t.amount} - deadline DZIŚ` : 'deadline DZIŚ',
      priority: 'HIGH',
      actionUrl: `/tasks/${t.id}`
    }));
  
  // Spotkania dziś
  meetings.slice(0, 1).forEach(m => urgentItems.push({
    type: 'MEETING',
    icon: '📞',
    title: `Spotkanie z ${m.contact?.name || m.title}`,
    subtitle: `o ${formatTime(m.startTime)}`,
    priority: 'HIGH',
    actionUrl: `/calendar?event=${m.id}`
  }));
  
  // Źródło (jeśli są elementy)
  if (source.length > 0) {
    urgentItems.push({
      type: 'SOURCE',
      icon: '⚪',
      title: `${source.length} nowych elementów w Źródle`,
      subtitle: 'czeka na przetworzenie',
      priority: source.some(s => s.priority === 'HIGH') ? 'HIGH' : 'MEDIUM',
      actionUrl: '/source'
    });
  }
  
  // 3. Generuj tip (AI lub rule-based)
  const tip = generateTip(source, tasks, overdue);
  
  return {
    greeting: `Dzień dobry, ${user.firstName}!`,
    date: formatDate(new Date()),
    urgentItems: urgentItems.slice(0, 3),
    tip,
    stats: {
      sourceItems: source.length,
      tasksToday: tasks.filter(t => !t.completed).length,
      meetingsToday: meetings.length,
      overdueItems: overdue.length
    }
  };
}

function generateTip(source, tasks, overdue): string {
  if (source.length > 0 && source.length <= 5) {
    return 'Zacznij od Źródła - zajmie 5 minut, potem będziesz mieć czystą głowę.';
  }
  if (overdue.length > 3) {
    return 'Masz sporo zaległości. Może warto przejrzeć i zamrozić to, co nieaktualne?';
  }
  if (tasks.length === 0) {
    return 'Brak zadań na dziś! Może czas na planowanie następnego tygodnia?';
  }
  return 'Skup się na jednej rzeczy naraz. Multitasking to mit.';
}
```

**Przycisk "Zacznij dzień":**
- Jeśli Źródło ma elementy → otwiera Źródło
- Jeśli nie → otwiera pierwszy task z Fokusa

---

### 2. Widget Źródło ⚪

**Cel:** Mini-widok Źródła z szybkim dostępem.

```
┌─────────────────────┐
│ ⚪ ŹRÓDŁO           │
│                     │
│  5                  │
│  elementów          │
│                     │
│  🔴 2 pilne         │  ← AI oznaczyło jako pilne
│  🟡 3 nowe          │
│                     │
│  ┌───────────────┐  │
│  │ Przetwórz    │  │  ← CTA
│  │ teraz (5min) │  │  ← szacowany czas
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

**Dane:**

```typescript
interface SourceWidget {
  totalCount: number;
  urgentCount: number;      // AI confidence > 0.8 + deadline < 2 dni
  newCount: number;         // Dodane dziś
  estimatedMinutes: number; // ~1 min per element
  
  // Preview (opcjonalnie)
  topItems: {
    title: string;
    type: string;
    isUrgent: boolean;
  }[];
}
```

**Interakcje:**
- Klik na widget → otwiera pełną stronę Źródła
- Klik "Przetwórz teraz" → otwiera Źródło w trybie Flow

---

### 3. Widget Fokus Dnia 🎯

**Cel:** 3 najważniejsze zadania na dziś (user wybiera lub AI sugeruje).

```
┌─────────────────────┐
│ 🎯 FOKUS DNIA       │
│                     │
│  ☐ Faktura ABC     │  ← checkbox
│     deadline: dziś  │  ← metadata
│     💰 22 500 EUR   │
│                     │
│  ☐ Oferta XYZ      │
│     deadline: jutro │
│                     │
│  ☐ Follow-up DEF   │
│     5 dni czeka     │
│                     │
│  ─────────────────  │
│  0/3 ukończone     │  ← progress
│  [+ Dodaj fokus]    │
└─────────────────────┘
```

**Logika wyboru fokusów:**

```typescript
interface FocusItem {
  id: string;
  taskId: string;
  title: string;
  deadline?: Date;
  amount?: string;
  waitingDays?: number;
  completed: boolean;
  order: number;
}

// AI sugeruje fokus jeśli user nie wybrał
async function suggestDailyFocus(userId: string): Promise<FocusItem[]> {
  const candidates = await prisma.tasks.findMany({
    where: {
      userId,
      completed: false,
      OR: [
        { deadline: { lte: addDays(new Date(), 2) } },  // Deadline w 2 dni
        { priority: 'HIGH' },
        { waitingSince: { lte: addDays(new Date(), -5) } }  // Czeka > 5 dni
      ]
    },
    orderBy: [
      { deadline: 'asc' },
      { priority: 'desc' },
      { createdAt: 'asc' }
    ],
    take: 3
  });
  
  return candidates.map((t, i) => ({
    id: `focus-${t.id}`,
    taskId: t.id,
    title: t.title,
    deadline: t.deadline,
    amount: t.metadata?.amount,
    completed: false,
    order: i
  }));
}
```

**Interakcje:**
- Checkbox → oznacza zadanie jako ukończone
- Drag & drop → zmienia kolejność
- Klik na zadanie → otwiera szczegóły
- "+ Dodaj fokus" → modal wyboru z listy zadań

---

### 4. Widget Timeline Dnia 📅

**Cel:** Wizualizacja dnia godzina po godzinie.

```
┌─────────────────────┐
│ 📅 DZIŚ             │
│                     │
│  09:00  ░░░░░░░░░  │  ← wolne
│  10:00  █████░░░░  │  ← częściowo zajęte (task)
│  11:00  ░░░░░░░░░  │
│  12:00  ░░░░░░░░░  │
│  13:00  🍽️ Lunch   │  ← blok przerwy
│  14:00  📞 XYZ     │  ← spotkanie
│  15:00  ░░░░░░░░░  │
│  16:00  ░░░░░░░░░  │
│                     │
│  Teraz: 10:34      │  ← marker
└─────────────────────┘
```

**Dane:**

```typescript
interface TimelineWidget {
  currentTime: Date;
  slots: TimeSlot[];
}

interface TimeSlot {
  hour: number;           // 9, 10, 11...
  type: 'FREE' | 'TASK' | 'MEETING' | 'BREAK' | 'BLOCKED';
  fill: number;           // 0-100% wypełnienia
  event?: {
    title: string;
    icon: string;
    color: string;
  };
}
```

**Interakcje:**
- Klik na spotkanie → otwiera szczegóły
- Klik na wolny slot → "Zaplanuj coś"

---

### 5. Widget Aktywne Strumienie 🌊

**Cel:** Pokazać postęp w najważniejszych strumieniach.

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🌊 AKTYWNE STRUMIENIE                                  [Zobacz →]  │
│                                                                     │
│  ABC Okna → Budma 2026                                             │
│  ████████████████░░░░ 80%                    2 zadania  │ 15 dni   │
│                                                                     │
│  XYZ Logistics → Projekt Q1                                        │
│  ████████████░░░░░░░░ 60%                    5 zadań    │ 28 dni   │
│                                                                     │
│  Marketing → Kampania Wiosna                                       │
│  ████████░░░░░░░░░░░░ 40%                    3 zadania  │ 45 dni   │
└─────────────────────────────────────────────────────────────────────┘
```

**Dane:**

```typescript
interface StreamProgress {
  id: string;
  name: string;
  parentName?: string;      // "ABC Okna →"
  progress: number;         // 0-100
  tasksRemaining: number;
  daysToDeadline?: number;
  color: string;            // dla progress bar
}

async function getActiveStreamsProgress(userId: string): Promise<StreamProgress[]> {
  const streams = await prisma.streams.findMany({
    where: {
      organizationId: user.organizationId,
      status: 'ACTIVE',
      // Ma zadania lub deadline
      OR: [
        { tasks: { some: { completed: false } } },
        { deadline: { not: null } }
      ]
    },
    include: {
      parent: true,
      tasks: {
        select: { completed: true }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });
  
  return streams.map(s => {
    const total = s.tasks.length;
    const done = s.tasks.filter(t => t.completed).length;
    
    return {
      id: s.id,
      name: s.name,
      parentName: s.parent?.name,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      tasksRemaining: total - done,
      daysToDeadline: s.deadline ? differenceInDays(s.deadline, new Date()) : null,
      color: getStreamColor(s)
    };
  });
}
```

**Interakcje:**
- Klik na stream → otwiera szczegóły streamu
- "Zobacz →" → otwiera Mapę strumieni

---

### 6. Widget Czeka na odpowiedź ⏰

**Cel:** Follow-upy które trzeba wysłać.

```
┌─────────────────────────────┐
│ ⏰ CZEKA NA ODPOWIEDŹ       │
│                             │
│  Jan Kowalski (ABC)  3 dni  │
│  Anna Nowak (XYZ)    5 dni  │
│  Piotr Wiśniewski    7 dni  │
│                             │
│  [Wyślij follow-up →]       │
└─────────────────────────────┘
```

**Dane:**

```typescript
interface FollowupWidget {
  items: {
    contactName: string;
    companyName?: string;
    waitingDays: number;
    lastContactDate: Date;
    dealId?: string;
  }[];
}
```

---

### 7. Widget Twój Tydzień 📊

**Cel:** Mini heatmapa produktywności.

```
┌─────────────────────────────────────┐
│ 📊 TWÓJ TYDZIEŃ                     │
│                                     │
│   Pon  Wto  Śro  Czw  Pią          │
│    ██   ░░   ░░   ░░   ░░          │
│    12    0    0    0    0          │
│                                     │
│   Ukończone zadania                │
└─────────────────────────────────────┘
```

**Cel:** Motywacja przez wizualizację postępu.

---

## Responsywność

### Desktop (>1200px)
```
[Briefing - full width                    ]
[Źródło] [Fokus Dnia] [Timeline]
[Aktywne Strumienie - full width          ]
[Followups      ] [Twój Tydzień           ]
```

### Tablet (768-1200px)
```
[Briefing - full width     ]
[Źródło    ] [Fokus Dnia   ]
[Timeline - full width     ]
[Aktywne Strumienie        ]
```

### Mobile (<768px)
```
[Briefing - collapsed, expandable]
[Źródło - card                   ]
[Fokus Dnia - card               ]
[Timeline - horizontal scroll    ]
[Strumienie - list               ]
```

---

## Wymagania techniczne

### Nowy endpoint API

```typescript
// GET /api/v1/dashboard/day
// Zwraca wszystkie dane potrzebne do Dashboard Dnia

interface DashboardDayResponse {
  briefing: MorningBriefing;
  source: SourceWidget;
  focus: FocusItem[];
  timeline: TimelineWidget;
  streams: StreamProgress[];
  followups: FollowupWidget;
  weekProgress: WeekProgress;
}
```

### Komponenty React

```
src/components/dashboard/
├── DashboardDay.tsx              // Main container
├── MorningBriefing.tsx           // AI briefing
├── SourceWidget.tsx              // Mini Źródło
├── FocusDayWidget.tsx            // Fokus dnia
├── TimelineWidget.tsx            // Timeline godzinowy
├── ActiveStreamsWidget.tsx       // Postęp strumieni
├── FollowupsWidget.tsx           // Czeka na odpowiedź
├── WeekProgressWidget.tsx        // Heatmapa tygodnia
└── widgets/
    ├── WidgetCard.tsx            // Shared card component
    ├── ProgressBar.tsx           // Shared progress bar
    └── TimeSlot.tsx              // Timeline slot
```

### Stan i cache

```typescript
// React Query dla cache
const { data: dashboard } = useQuery({
  queryKey: ['dashboard', 'day', userId],
  queryFn: () => fetchDashboardDay(),
  staleTime: 1000 * 60 * 5,  // 5 min cache
  refetchInterval: 1000 * 60 * 5  // Auto-refresh co 5 min
});

// Optimistic updates dla fokusa
const completeFocus = useMutation({
  mutationFn: (focusId) => markFocusComplete(focusId),
  onMutate: async (focusId) => {
    // Optimistic update
    queryClient.setQueryData(['dashboard', 'day'], old => ({
      ...old,
      focus: old.focus.map(f => 
        f.id === focusId ? { ...f, completed: true } : f
      )
    }));
  }
});
```

---

## Testy akceptacyjne

1. [ ] Rano → Briefing pokazuje pilne rzeczy z dzisiejszymi deadline'ami
2. [ ] Źródło ma 5 elementów → widget pokazuje "5 elementów"
3. [ ] Klik "Przetwórz teraz" → otwiera /source
4. [ ] Fokus Dnia → można odznaczyć checkbox, task się aktualizuje
5. [ ] Timeline → pokazuje spotkania z kalendarza
6. [ ] Strumienie → progress bar odpowiada % ukończonych zadań
7. [ ] Follow-upy → pokazuje kontakty czekające najdłużej
8. [ ] Responsive → na mobile wszystko czytelne
9. [ ] Refresh → dane odświeżają się co 5 minut
10. [ ] "Zacznij dzień" → kieruje do sensownego miejsca

---

## Killer Features (wyróżniki)

| Feature | Opis | Konkurencja |
|---------|------|-------------|
| **AI Briefing** | Spersonalizowane podsumowanie dnia | ❌ Brak |
| **Źródło na dashboardzie** | Widać co czeka, bez wchodzenia | ❌ Brak |
| **Fokus 3 rzeczy** | Nie 100 tasków, tylko 3 najważniejsze | ❌ Brak |
| **Timeline godzinowy** | Widzisz dzień, nie listę | ⚠️ Rzadko |
| **Postęp strumieni** | CRM jako projekty, nie tylko kontakty | ❌ Brak |
| **Tip dnia** | AI radzi od czego zacząć | ❌ Brak |

---

---

## CZĘŚĆ 2: Feed Organizacji (dla zespołów)

### Kontekst

Dashboard musi obsługiwać różne role:
- **Pracownik** → widzi swoje + zdarzenia wpływające na jego pracę
- **Manager** → widzi swoje + aktywność zespołu + ryzyka
- **Właściciel** → przegląd całej organizacji

---

### Źródło rozszerzone o Feed

```
┌─────────────────────────────────────────────────────────┐
│ ⚪ ŹRÓDŁO                                               │
│                                                         │
│  [Moje (3)]  [Zespół (12)]  [Organizacja]              │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📧 Email od VIP klienta                 👤 Moje       │
│  📝 Pomysł na kampanię                   👤 Moje       │
│  ─────────────────────────────────────────────────────  │
│  🔔 ZDARZENIA WPŁYWAJĄCE NA MOJĄ PRACĘ                 │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ✅ Piotr ukończył: Projekt stoiska ABC    10:34       │
│     💡 Możesz wysłać ofertę (czekałeś 3 dni)           │
│                                                         │
│  📝 Anna dodała notatkę: XYZ Logistics     09:15       │
│     "Klient chce rabat 10%"                            │
│                                                         │
│  ⚠️ Zmieniono deadline: Budma 2026         wczoraj     │
│     15.02 → 10.02 (przyspieszono o 5 dni)              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Briefing: Pracownik vs Manager

#### Pracownik

```
┌───────────────────────────────────────────────────────────────────────┐
│ 🤖 PORANNY BRIEFING                                                   │
│                                                                       │
│  Dzień dobry, Anna!                                                   │
│                                                                       │
│  Dziś masz 3 pilne rzeczy:                                           │
│  🔴 Wycena XYZ - deadline DZIŚ                                       │
│  📞 Spotkanie z klientem ABC o 14:00                                 │
│  ✅ Piotr ukończył projekt stoiska → możesz wysłać ofertę            │
│                                                                       │
│  💡 Zacznij od wyceny - masz na nią 2 godziny przed spotkaniem.      │
│                                                                       │
│  [🚀 Zacznij dzień]                                                   │
└───────────────────────────────────────────────────────────────────────┘
```

#### Manager

```
┌───────────────────────────────────────────────────────────────────────┐
│ 🤖 PORANNY BRIEFING                                                   │
│                                                                       │
│  Dzień dobry, Waldek!                                                 │
│                                                                       │
│  📊 TWÓJ ZESPÓŁ (wczoraj):                                           │
│  ✅ 8 zadań ukończonych (Anna: 3, Piotr: 3, Jan: 2)                  │
│  ⚠️ 2 deadline'y przesunięte                                         │
│  🆕 3 nowe leady w pipeline                                          │
│                                                                       │
│  🔴 WYMAGA TWOJEJ UWAGI:                                             │
│  • Oferta XYZ (50K EUR) - czeka na Twoją akceptację                  │
│  • Anna prosi o pomoc z trudnym klientem                             │
│  • Budma 2026 - zostało 15 dni, zrobione 40% ⚠️                      │
│                                                                       │
│  💡 Projekt Budma może się opóźnić. Rozważ spotkanie statusowe.      │
│                                                                       │
│  [🚀 Zacznij dzień]  [📊 Raport zespołu]                             │
└───────────────────────────────────────────────────────────────────────┘
```

---

### Widget: Aktywność Zespołu (tylko dla managerów)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 👥 AKTYWNOŚĆ ZESPOŁU                          [Dziś ▼]  [Filtruj]  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  10:34  ✅ Anna ukończyła: Wycena XYZ                       │   │
│  │  10:15  📝 Piotr dodał notatkę: ABC Okna                    │   │
│  │  09:45  ✅ Piotr ukończył: Projekt stoiska                  │   │
│  │  09:30  📞 Jan zalogował rozmowę: DEF Logistics             │   │
│  │  09:00  🆕 Anna utworzyła deal: GHI Corp (25K)              │   │
│  │  08:45  ⚠️ Marek przesunął deadline: Projekt MNO            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📊 PODSUMOWANIE DZIŚ                                              │
│  ───────────────────────────────────────────────────────────────── │
│  ✅ Ukończone: 5  │  🆕 Nowe: 3  │  ⚠️ Przesunięte: 1             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Widget: Produktywność Zespołu (tylko dla managerów)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📈 PRODUKTYWNOŚĆ ZESPOŁU                              Ten tydzień  │
│                                                                     │
│  Anna        ████████████████░░░░  16 zadań   🏆 Top performer     │
│  Piotr       ████████████░░░░░░░░  12 zadań                        │
│  Jan         ████████░░░░░░░░░░░░   8 zadań                        │
│  Marek       ██████░░░░░░░░░░░░░░   6 zadań   ⚠️ Poniżej średniej  │
│                                                                     │
│  Średnia zespołu: 10.5 zadań/os                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Widget: Ryzyka Projektów (AI-generated)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚠️ RYZYKA (wykryte przez AI)                                        │
│                                                                     │
│  🔴 WYSOKIE                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Budma 2026                                                   │   │
│  │ 15 dni do deadline'u │ 40% ukończone │ Tempo: za wolne      │   │
│  │ 💡 Przy obecnym tempie skończycie 5 dni po terminie         │   │
│  │ [Zobacz projekt] [Zaplanuj spotkanie]                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  🟡 ŚREDNIE                                                         │
│  • XYZ Logistics - brak aktywności 5 dni                           │
│  • Deal ABC (80K) - w negocjacjach od 3 tygodni                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Typy zdarzeń w Feed

| Typ | Ikona | Kto widzi |
|-----|-------|-----------|
| `TASK_COMPLETED` | ✅ | Manager + osoby czekające |
| `TASK_CREATED` | 🆕 | Manager |
| `NOTE_ADDED` | 📝 | Opiekun streamu/klienta |
| `DEADLINE_CHANGED` | ⚠️ | Wszyscy w projekcie |
| `DEAL_CREATED` | 💰 | Manager + pipeline team |
| `DEAL_WON` | 🎉 | Cała organizacja |
| `DEAL_LOST` | 😔 | Manager |
| `CALL_LOGGED` | 📞 | Opiekun klienta |
| `EMAIL_SENT` | 📧 | Opiekun klienta |
| `MEETING_SCHEDULED` | 📅 | Uczestnicy |
| `RISK_DETECTED` | 🚨 | Manager |

---

### Logika: "Co mnie dotyczy"

```typescript
interface ActivityRelevance {
  userId: string;
  activityId: string;
  reason: RelevanceReason;
}

type RelevanceReason = 
  | 'MY_TASK_DEPENDENCY'      // Moje zadanie zależy od tego
  | 'MY_STREAM'               // Jestem w tym strumieniu
  | 'MY_CLIENT'               // Jestem opiekunem klienta
  | 'MY_TEAM_MEMBER'          // To mój podwładny (dla managera)
  | 'ORGANIZATION_MILESTONE'  // Ważne dla całej firmy
  | 'MENTIONED';              // Ktoś mnie wspomniał

async function calculateRelevance(
  activity: Activity,
  userId: string
): Promise<ActivityRelevance | null> {
  
  const user = await getUser(userId);
  
  // 1. Czy moje zadanie zależy od ukończonego?
  if (activity.type === 'TASK_COMPLETED') {
    const dependentTasks = await getTasksDependingOn(activity.entityId, userId);
    if (dependentTasks.length > 0) {
      return {
        userId,
        activityId: activity.id,
        reason: 'MY_TASK_DEPENDENCY'
      };
    }
  }
  
  // 2. Czy jestem w tym strumieniu?
  if (activity.streamId) {
    const isMember = await isStreamMember(activity.streamId, userId);
    if (isMember) {
      return { userId, activityId: activity.id, reason: 'MY_STREAM' };
    }
  }
  
  // 3. Czy jestem opiekunem klienta?
  if (activity.companyId) {
    const isOwner = await isCompanyOwner(activity.companyId, userId);
    if (isOwner) {
      return { userId, activityId: activity.id, reason: 'MY_CLIENT' };
    }
  }
  
  // 4. Czy to mój podwładny? (dla managera)
  if (user.role === 'MANAGER') {
    const isMyTeam = await isInMyTeam(activity.actorUserId, userId);
    if (isMyTeam) {
      return { userId, activityId: activity.id, reason: 'MY_TEAM_MEMBER' };
    }
  }
  
  // 5. Milestone organizacji (deal won, etc.)
  if (activity.type === 'DEAL_WON' || activity.type === 'BIG_MILESTONE') {
    return { userId, activityId: activity.id, reason: 'ORGANIZATION_MILESTONE' };
  }
  
  return null; // Nie dotyczy mnie
}
```

---

### Model danych

```prisma
// Feed aktywności organizacji
model activity_feed {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Kto wykonał akcję
  actorUserId     String
  actorUser       users    @relation(fields: [actorUserId], references: [id])
  
  // Typ akcji
  actionType      String   // TASK_COMPLETED, NOTE_ADDED, DEADLINE_CHANGED...
  
  // Na czym (polimorficzne)
  entityType      String   // TASK, STREAM, CONTACT, DEAL, COMPANY
  entityId        String
  entityTitle     String   // Cache: "Wycena XYZ"
  
  // Kontekst
  streamId        String?
  companyId       String?
  dealId          String?
  
  // Szczegóły zmiany
  metadata        Json?    // { oldValue: "15.02", newValue: "10.02" }
  
  // Widoczność bazowa
  visibility      String   @default("TEAM") // PRIVATE, TEAM, ORGANIZATION
  
  createdAt       DateTime @default(now())
  
  @@index([organizationId, createdAt(sort: Desc)])
  @@index([actorUserId])
  @@index([streamId])
  @@index([companyId])
}

// Dla kogo dana aktywność jest istotna (pre-calculated)
model activity_relevance {
  id            String   @id @default(uuid())
  activityId    String
  activity      activity_feed @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  userId        String
  reason        String   // MY_TASK_DEPENDENCY, MY_STREAM, MY_CLIENT...
  
  isRead        Boolean  @default(false)
  readAt        DateTime?
  
  @@unique([activityId, userId])
  @@index([userId, isRead])
}

// Ustawienia feedu per user
model user_feed_settings {
  id                    String   @id @default(uuid())
  userId                String   @unique
  
  // Co chcę widzieć
  showTaskCompleted     Boolean  @default(true)
  showNotesAdded        Boolean  @default(true)
  showDeadlineChanges   Boolean  @default(true)
  showDeals             Boolean  @default(true)
  showTeamActivity      Boolean  @default(true)
  
  // Powiadomienia
  notifyHighPriority    Boolean  @default(true)
  notifyMentions        Boolean  @default(true)
  digestEmail           Boolean  @default(false)  // Podsumowanie dzienne
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// Zależności między zadaniami (do wykrywania "czekam na")
model task_dependencies {
  id              String @id @default(uuid())
  taskId          String // Zadanie które czeka
  dependsOnTaskId String // Zadanie na które czeka
  
  task            tasks  @relation("waiting", fields: [taskId], references: [id])
  dependsOn       tasks  @relation("blocking", fields: [dependsOnTaskId], references: [id])
  
  @@unique([taskId, dependsOnTaskId])
}
```

---

### API Endpoints

```typescript
// GET /api/v1/dashboard/day
// Rozszerzony o feed
interface DashboardDayResponse {
  briefing: MorningBriefing;      // Różny dla pracownika/managera
  source: SourceWidget;
  focus: FocusItem[];
  timeline: TimelineWidget;
  streams: StreamProgress[];
  followups: FollowupWidget;
  weekProgress: WeekProgress;
  
  // NOWE
  activityFeed: ActivityFeedWidget;     // Zdarzenia wpływające na mnie
  teamActivity?: TeamActivityWidget;     // Tylko dla managerów
  risks?: RiskWidget[];                  // Tylko dla managerów
  teamProductivity?: TeamProductivity;   // Tylko dla managerów
}

// GET /api/v1/activity-feed
// Paginowany feed
interface ActivityFeedParams {
  filter: 'all' | 'relevant' | 'team' | 'organization';
  since?: Date;
  limit?: number;
  cursor?: string;
}

// POST /api/v1/activity-feed/:id/read
// Oznacz jako przeczytane

// GET /api/v1/activity-feed/unread-count
// Licznik nieprzeczytanych
```

---

### Komponenty React (dodatkowe)

```
src/components/dashboard/
├── ... (istniejące) ...
│
├── ActivityFeedWidget.tsx        // Feed dla pracownika
├── ActivityFeedItem.tsx          // Pojedyncze zdarzenie
│
├── manager/
│   ├── TeamActivityWidget.tsx    // Aktywność zespołu
│   ├── TeamProductivityWidget.tsx // Wykres produktywności
│   ├── RisksWidget.tsx           // AI-wykryte ryzyka
│   └── ManagerBriefing.tsx       // Rozszerzony briefing
│
└── shared/
    ├── ActivityIcon.tsx          // Ikony per typ
    ├── RelativeTime.tsx          // "5 minut temu"
    └── RelevanceReason.tsx       // "Możesz wysłać ofertę"
```

---

### Testy akceptacyjne (dodatkowe)

11. [ ] Pracownik widzi zakładki: Moje / Zespół
12. [ ] Manager widzi zakładki: Moje / Zespół / Organizacja
13. [ ] Ukończenie zadania → pojawia się u osób czekających
14. [ ] Notatka do klienta → pojawia się u opiekuna
15. [ ] Zmiana deadline'u → pojawia się u wszystkich w projekcie
16. [ ] Manager widzi widget "Aktywność zespołu"
17. [ ] Manager widzi widget "Ryzyka"
18. [ ] AI wykrywa ryzyko opóźnienia projektu
19. [ ] Feed pokazuje "Możesz wysłać ofertę" po ukończeniu zależności
20. [ ] Filtr feedu działa (wszystko / tylko moje)

---

## Uwagi

- Dashboard ma być SZYBKI - lazy loading widgetów
- Briefing generuj raz dziennie lub przy pierwszym wejściu
- Fokus zapisuj per user per dzień (może wybrać inne niż AI)
- Dark mode - zaprojektuj od razu
- Animacje minimalne - fokus na treści
- Accessibility - wszystkie widgety keyboard-navigable
- **Feed**: pre-calculate relevance przy tworzeniu activity (nie przy odczycie)
- **Manager widgets**: lazy load, bo nie każdy je widzi
- **Ryzyka AI**: cache na 1h, bo to ciężkie obliczenia
