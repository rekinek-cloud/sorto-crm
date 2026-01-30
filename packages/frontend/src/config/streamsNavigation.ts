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
  MagnifyingGlass,
  Microphone,
  Graph,
  EnvelopeSimple,
  FlowArrow,
  ChartLine,
  Key,
  Bug,
  Palette,
  Sliders,
  At,
  ShieldCheck,
  UserPlus,
  Package,
  Wrench,
  FileText,
  ShoppingCart,
  Receipt,
  WarningCircle,
  Brain,
  Sparkle,
  MagnifyingGlassMinus,
  Lightbulb,
  PencilSimple,
  FunnelSimple,
  ListChecks,
  VideoCamera,
  Files,
  UsersThree,
  Article,
  Timer,
  ChartPie,
  UserSwitch,
  Stack,
  Database,
  ClockCounterClockwise,
  GitBranch,
  HardDrives,
  Table,
  CreditCard,
  CalendarCheck,
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
    badge: 'count',
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
      { name: 'Leady', href: '/dashboard/leads', icon: UserPlus, iconWeight: 'duotone' },
      { name: 'Pipeline', href: '/dashboard/pipeline', icon: Funnel, iconWeight: 'duotone' },
      { name: 'Transakcje', href: '/dashboard/deals', icon: Handshake, iconWeight: 'duotone' },
      { name: 'Pipeline Analytics', href: '/dashboard/analytics/pipeline', icon: ChartLine, iconWeight: 'duotone' },
    ],
  },

  // === SPRZEDAŻ ===
  {
    name: 'Sprzedaż',
    icon: ShoppingCart,
    iconWeight: 'duotone',
    children: [
      { name: 'Produkty', href: '/dashboard/products', icon: Package, iconWeight: 'duotone' },
      { name: 'Usługi', href: '/dashboard/services', icon: Wrench, iconWeight: 'duotone' },
      { name: 'Oferty', href: '/dashboard/offers', icon: FileText, iconWeight: 'duotone' },
      { name: 'Zamówienia', href: '/dashboard/orders', icon: ShoppingCart, iconWeight: 'duotone' },
      { name: 'Faktury', href: '/dashboard/invoices', icon: Receipt, iconWeight: 'duotone' },
      { name: 'Reklamacje', href: '/dashboard/complaints', icon: WarningCircle, iconWeight: 'duotone' },
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
      { name: 'Napisz email', href: '/dashboard/modern-email', icon: PencilSimple, iconWeight: 'duotone' },
      { name: 'Filtry email', href: '/dashboard/communication/email-filters', icon: FunnelSimple, iconWeight: 'duotone' },
      { name: 'Reguły komunikacji', href: '/dashboard/communication/rules-manager', icon: ListChecks, iconWeight: 'duotone' },
      { name: 'Auto-odpowiedzi', href: '/dashboard/auto-replies', icon: EnvelopeSimple, iconWeight: 'duotone' },
      { name: 'Spotkania', href: '/dashboard/meetings', icon: VideoCamera, iconWeight: 'duotone' },
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
      { name: 'Kwartalny', href: '/dashboard/reviews/quarterly', icon: CalendarCheck, iconWeight: 'duotone' },
    ],
  },

  // === AI & NARZĘDZIA ===
  {
    name: 'AI & Narzędzia',
    icon: Robot,
    iconWeight: 'duotone',
    children: [
      { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: Robot, iconWeight: 'duotone' },
      { name: 'Zarządzanie AI', href: '/dashboard/ai-management', icon: Brain, iconWeight: 'duotone' },
      { name: 'Reguły AI', href: '/dashboard/ai-rules', icon: Sparkle, iconWeight: 'duotone' },
      { name: 'Wyszukiwanie AI', href: '/dashboard/search', icon: MagnifyingGlass, iconWeight: 'duotone' },
      { name: 'RAG Search', href: '/dashboard/rag-search', icon: MagnifyingGlassMinus, iconWeight: 'duotone' },
      { name: 'Rekomendacje', href: '/dashboard/recommendations', icon: Lightbulb, iconWeight: 'duotone' },
      { name: 'Voice TTS', href: '/dashboard/voice', icon: Microphone, iconWeight: 'duotone' },
      { name: 'Graf relacji', href: '/dashboard/graph', icon: Graph, iconWeight: 'duotone' },
      { name: 'Reguły uniwersalne', href: '/dashboard/universal-rules', icon: FlowArrow, iconWeight: 'duotone' },
    ],
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
      { name: 'Delegowane', href: '/dashboard/delegated', icon: UserSwitch, iconWeight: 'duotone' },
      { name: 'Obszary', href: '/dashboard/areas', icon: Stack, iconWeight: 'duotone' },
      { name: 'Szablony', href: '/dashboard/templates', icon: Article, iconWeight: 'duotone' },
    ],
  },

  // === WIEDZA ===
  {
    name: 'Wiedza',
    icon: BookOpen,
    iconWeight: 'duotone',
    children: [
      { name: 'Baza wiedzy', href: '/dashboard/knowledge-base', icon: BookOpen, iconWeight: 'duotone' },
      { name: 'Dokumenty', href: '/dashboard/knowledge', icon: Files, iconWeight: 'duotone' },
      { name: 'Status wiedzy', href: '/dashboard/knowledge-status', icon: Database, iconWeight: 'duotone' },
      { name: 'Pliki', href: '/dashboard/files', icon: Folder, iconWeight: 'duotone' },
    ],
  },

  // === ANALITYKA ===
  {
    name: 'Analityka',
    icon: ChartPie,
    iconWeight: 'duotone',
    children: [
      { name: 'Dashboard', href: '/dashboard/analytics', icon: ChartBar, iconWeight: 'duotone' },
      { name: 'Analiza', href: '/dashboard/analysis', icon: ChartLine, iconWeight: 'duotone' },
      { name: 'Raporty', href: '/dashboard/reports', icon: ClipboardText, iconWeight: 'duotone' },
      { name: 'Timeline', href: '/dashboard/timeline', icon: Timer, iconWeight: 'duotone' },
      { name: 'Historia zadań', href: '/dashboard/task-history', icon: ClockCounterClockwise, iconWeight: 'duotone' },
      { name: 'Relacje zadań', href: '/dashboard/task-relationships', icon: GitBranch, iconWeight: 'duotone' },
    ],
  },

  // === ZESPÓŁ ===
  {
    name: 'Zespół',
    icon: UsersThree,
    iconWeight: 'duotone',
    children: [
      { name: 'Członkowie', href: '/dashboard/team', icon: UsersThree, iconWeight: 'duotone' },
      { name: 'Użytkownicy', href: '/dashboard/users', icon: Users, iconWeight: 'duotone' },
    ],
  },

  // === USTAWIENIA ===
  {
    name: 'Ustawienia',
    icon: Gear,
    iconWeight: 'duotone',
    children: [
      { name: 'Profil', href: '/dashboard/settings/profile', icon: Users, iconWeight: 'duotone' },
      { name: 'Organizacja', href: '/dashboard/settings/organization', icon: Buildings, iconWeight: 'duotone' },
      { name: 'Branding', href: '/dashboard/settings/branding', icon: Palette, iconWeight: 'duotone' },
      { name: 'Pola niestandardowe', href: '/dashboard/settings/custom-fields', icon: Sliders, iconWeight: 'duotone' },
      { name: 'Konta email', href: '/dashboard/email-accounts', icon: At, iconWeight: 'duotone' },
      { name: 'Integracje', href: '/dashboard/settings/integrations', icon: Lightning, iconWeight: 'duotone' },
      { name: 'Płatności', href: '/dashboard/billing', icon: CreditCard, iconWeight: 'duotone' },
      { name: 'Metadane', href: '/dashboard/metadata', icon: Table, iconWeight: 'duotone' },
    ],
  },

  // === ADMINISTRACJA ===
  {
    name: 'Administracja',
    icon: ShieldCheck,
    iconWeight: 'duotone',
    children: [
      { name: 'Infrastruktura', href: '/dashboard/infrastructure', icon: HardDrives, iconWeight: 'duotone' },
      { name: 'Klucze MCP', href: '/dashboard/admin/mcp-keys', icon: Key, iconWeight: 'duotone' },
      { name: 'Zgłoszenia błędów', href: '/dashboard/admin/bug-reports', icon: Bug, iconWeight: 'duotone' },
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
