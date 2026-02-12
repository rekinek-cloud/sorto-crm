/**
 * Navigation Mapper
 * Maps overlay navigation (string icons) to layout navigation (Phosphor components)
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
  Terminal,
  Camera,
  Image,
  Cloud,
  FolderOpen,
} from 'phosphor-react';
import type { NavigationItem } from '@/lib/api/overlays';
import type { NavItem } from '@/config/streamsNavigation';

// Map string icon names to Phosphor components
const iconMap: Record<string, any> = {
  // Core icons
  House,
  Home: House,
  CircleDashed,
  Waves,
  Snowflake,
  TreeStructure,
  CheckSquare,
  Folder,
  FolderOpen,
  Calendar,
  Target,
  Buildings,
  Building2: Buildings,
  Users,
  Funnel,
  Handshake,
  Envelope,
  Tray,
  ChatCircle,
  MessageSquare: ChatCircle,
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
  Terminal,
  // Photo-related icons
  Camera,
  Image,
  Cloud,
  // Fallback
  FolderKanban: Folder,
};

/**
 * Get Phosphor icon component from string name
 */
function getIconComponent(iconName?: string): any {
  if (!iconName) return House;
  return iconMap[iconName] || House;
}

/**
 * Map overlay navigation item to layout NavItem format
 */
function mapNavigationItem(item: NavigationItem): NavItem {
  const mapped: NavItem = {
    name: item.name,
    href: item.href,
    icon: getIconComponent(item.icon),
    iconWeight: 'duotone',
  };

  if (item.badge) {
    mapped.badge = item.badge;
  }

  if (item.children && item.children.length > 0) {
    mapped.children = item.children.map(mapNavigationItem);
  }

  // Handle external links
  if (item.external) {
    (mapped as any).external = true;
  }

  return mapped;
}

/**
 * Map overlay navigation array to layout NavItem array
 */
export function mapOverlayNavigation(overlayNavigation: NavigationItem[]): NavItem[] {
  return overlayNavigation.map(mapNavigationItem);
}

/**
 * Filter navigation based on visible modules
 */
export function filterNavigationByModules(
  navigation: NavItem[],
  visibleModules: string[],
  hiddenModules: string[]
): NavItem[] {
  // For now, return all navigation
  // TODO: Implement module-based filtering
  return navigation;
}
