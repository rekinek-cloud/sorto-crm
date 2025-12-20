/**
 * STREAMS Navigation Configuration
 * Metodologia SORTO STREAMS - nawigacja dla streams.work (B2B)
 *
 * Użycie: import { navigation } from '@/config/streamsNavigation';
 */

import {
  House,
  CircleDashed,
  Waves,
  Snowflake,
  TreeStructure,
  CheckSquare,
  Folder,
  Calendar,
  Target,
  Buildings,
  Users,
  Funnel,
  Handshake,
  Envelope,
  Tray,
  ChatCircle,
  ChartBar,
  CalendarBlank,
  Robot,
  Gear,
  Lightning,
  ArrowsClockwise,
  Tag,
  BookOpen,
  Clock,
  ClipboardText,
  Info,
} from 'phosphor-react';

export interface NavItem {
  name: string;
  href?: string;
  icon: any;
  iconWeight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  badge?: string | number;
  children?: NavItem[];
}

/**
 * Główna nawigacja STREAMS
 * Bez emoji - tylko Phosphor Icons
 */
export const streamsNavigation: NavItem[] = [
  {
    name: 'Pulpit',
    href: '/dashboard',
    icon: House,
    iconWeight: 'duotone',
  },

  // === STREAMS CORE ===
  {
    name: 'Źródło',
    href: '/dashboard/source',
    icon: CircleDashed,
    iconWeight: 'duotone',
    badge: 'count', // dynamicznie liczba elementów
  },
  {
    name: 'Strumienie',
    icon: Waves,
    iconWeight: 'duotone',
    children: [
      { name: 'Wszystkie strumienie', href: '/dashboard/streams', icon: Waves, iconWeight: 'duotone' },
      { name: 'Mapa strumieni', href: '/dashboard/streams-map', icon: TreeStructure, iconWeight: 'duotone' },
      { name: 'Zamrożone', href: '/dashboard/streams/frozen', icon: Snowflake, iconWeight: 'duotone' },
    ],
  },
  {
    name: 'Zadania',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    iconWeight: 'duotone',
  },
  {
    name: 'Projekty',
    href: '/dashboard/projects',
    icon: Folder,
    iconWeight: 'duotone',
  },
  {
    name: 'Kalendarz',
    href: '/dashboard/calendar',
    icon: Calendar,
    iconWeight: 'duotone',
  },
  {
    name: 'Cele',
    href: '/dashboard/goals',
    icon: Target,
    iconWeight: 'duotone',
  },

  // === CRM ===
  {
    name: 'CRM',
    icon: Buildings,
    iconWeight: 'duotone',
    children: [
      { name: 'Firmy', href: '/dashboard/companies', icon: Buildings, iconWeight: 'duotone' },
      { name: 'Kontakty', href: '/dashboard/contacts', icon: Users, iconWeight: 'duotone' },
      { name: 'Pipeline', href: '/dashboard/pipeline', icon: Funnel, iconWeight: 'duotone' },
      { name: 'Transakcje', href: '/dashboard/deals', icon: Handshake, iconWeight: 'duotone' },
    ],
  },

  // === KOMUNIKACJA ===
  {
    name: 'Komunikacja',
    icon: Envelope,
    iconWeight: 'duotone',
    children: [
      { name: 'Skrzynki', href: '/dashboard/smart-mailboxes', icon: Tray, iconWeight: 'duotone' },
      { name: 'Kanały', href: '/dashboard/communication/channels', icon: ChatCircle, iconWeight: 'duotone' },
    ],
  },

  // === PRZEGLĄDY ===
  {
    name: 'Przeglądy',
    icon: ChartBar,
    iconWeight: 'duotone',
    children: [
      { name: 'Tygodniowy', href: '/dashboard/reviews/weekly', icon: CalendarBlank, iconWeight: 'duotone' },
      { name: 'Miesięczny', href: '/dashboard/reviews/monthly', icon: Calendar, iconWeight: 'duotone' },
    ],
  },

  // === PLANOWANIE === (ukryty - niedokończona funkcja)
  // {
  //   name: 'Day Planner',
  //   href: '/dashboard/day-planner',
  //   icon: Clock,
  //   iconWeight: 'duotone',
  // },

  // === AI ASSISTANT ===
  {
    name: 'AI Assistant',
    href: '/dashboard/ai-assistant',
    icon: Robot,
    iconWeight: 'duotone',
  },

  // === ORGANIZACJA ===
  {
    name: 'Organizacja',
    icon: Tag,
    iconWeight: 'duotone',
    children: [
      { name: 'Tagi', href: '/dashboard/tags', icon: Tag, iconWeight: 'duotone' },
      { name: 'Nawyki', href: '/dashboard/habits', icon: Lightning, iconWeight: 'duotone' },
      { name: 'Zadania cykliczne', href: '/dashboard/recurring-tasks', icon: ArrowsClockwise, iconWeight: 'duotone' },
      { name: 'Baza wiedzy', href: '/dashboard/knowledge-base', icon: BookOpen, iconWeight: 'duotone' },
    ],
  },

  // === USTAWIENIA ===
  {
    name: 'Ustawienia',
    icon: Gear,
    iconWeight: 'duotone',
    children: [
      { name: 'Użytkownicy', href: '/dashboard/users', icon: Users, iconWeight: 'duotone' },
      { name: 'Firmy', href: '/dashboard/companies', icon: Buildings, iconWeight: 'duotone' },
      { name: 'Informacje', href: '/dashboard/info', icon: Info, iconWeight: 'duotone' },
    ],
  },
];

/**
 * Skrócona nawigacja dla mobile bottom bar
 */
export const mobileNavigation: NavItem[] = [
  { name: 'Pulpit', href: '/dashboard', icon: House, iconWeight: 'duotone' },
  { name: 'Źródło', href: '/dashboard/source', icon: CircleDashed, iconWeight: 'duotone' },
  { name: 'Strumienie', href: '/dashboard/streams', icon: Waves, iconWeight: 'duotone' },
  { name: 'Zadania', href: '/dashboard/tasks', icon: CheckSquare, iconWeight: 'duotone' },
  { name: 'Więcej', href: '#', icon: Gear, iconWeight: 'duotone' },
];

/**
 * Przekierowania ze starych URL (GTD/SMART) na nowe (STREAMS)
 */
export const urlRedirects: Record<string, string> = {
  '/dashboard/gtd/inbox': '/dashboard/source',
  '/dashboard/gtd/next-actions': '/dashboard/tasks',
  '/dashboard/gtd/waiting-for': '/dashboard/tasks?status=waiting',
  '/dashboard/gtd/someday-maybe': '/dashboard/streams/frozen',
  '/dashboard/gtd/contexts': '/dashboard/tags',
  '/dashboard/gtd-streams': '/dashboard/streams',
  '/dashboard/gtd-map': '/dashboard/streams-map',
  '/dashboard/gtd-buckets': '/dashboard/streams',
  '/dashboard/gtd-horizons': '/dashboard/goals',
  '/dashboard/smart-day-planner': '/dashboard/day-planner',
  '/dashboard/smart-analysis': '/dashboard/analysis',
  '/dashboard/smart-templates': '/dashboard/templates',
};

export default streamsNavigation;
