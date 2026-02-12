/**
 * Default Industry Overlays Configuration
 *
 * These are hardcoded defaults that can be overridden by database entries.
 * Used for initial setup and fallback.
 */

export interface NavigationItem {
  name: string;
  href?: string;
  icon?: string;
  children?: NavigationItem[];
  badge?: string;
  external?: boolean;
}

export interface IndustryOverlayConfig {
  slug: string;
  name: string;
  description?: string;

  // Modules included in base price
  includedModules: string[];

  // Modules available as add-ons
  availableAddons: string[];

  // Modules hidden from this overlay
  hiddenModules: string[];

  // Navigation structure
  navigation: NavigationItem[];

  // Branding
  primaryColor: string;
  logo?: string;

  // Pricing
  basePrice: number; // PLN per month

  isDefault?: boolean;
}

/**
 * SORTO BUSINESS - Platform for companies
 * Full CRM, sales, invoicing, communication
 */
export const SORTO_BUSINESS: IndustryOverlayConfig = {
  slug: 'sorto-business',
  name: 'Sorto Business',
  description: 'Kompletna platforma dla firm - CRM, sprzedaz, faktury, komunikacja',

  includedModules: [
    'dashboard',
    'companies',
    'contacts',
    'deals',
    'pipeline',
    'offers',
    'orders',
    'invoices',
    'products',
    'services',
    'tasks',
    'projects',
    'calendar',
    'communication',
    'email',
    'analytics',
    'reports',
  ],

  availableAddons: [
    'slotify',      // Rezerwacje online
    'sites',        // Strony WWW
    'faktury-ksef', // Faktury KSeF
    'hr',           // Kadry i place
    'flota',        // Zarzadzanie flota
  ],

  hiddenModules: [
    'focus-photo',
    'focus-cloud',
    'flyball',
    'timeline',
    'gallery',
  ],

  navigation: [
    { name: 'Pulpit', href: '/dashboard', icon: 'Home' },
    {
      name: 'CRM',
      icon: 'Building2',
      children: [
        { name: 'Firmy', href: '/dashboard/companies' },
        { name: 'Kontakty', href: '/dashboard/contacts' },
        { name: 'Deals', href: '/dashboard/deals' },
        { name: 'Pipeline', href: '/dashboard/pipeline' },
      ]
    },
    {
      name: 'Sprzedaz',
      icon: 'ShoppingCart',
      children: [
        { name: 'Oferty', href: '/dashboard/offers' },
        { name: 'Zamowienia', href: '/dashboard/orders' },
        { name: 'Faktury', href: '/dashboard/invoices' },
        { name: 'Produkty', href: '/dashboard/products' },
        { name: 'Uslugi', href: '/dashboard/services' },
      ]
    },
    { name: 'Zadania', href: '/dashboard/tasks', icon: 'CheckSquare' },
    { name: 'Projekty', href: '/dashboard/projects', icon: 'FolderKanban' },
    { name: 'Kalendarz', href: '/dashboard/calendar', icon: 'Calendar' },
    { name: 'Komunikacja', href: '/dashboard/communication', icon: 'MessageSquare' },
    {
      name: 'Raporty',
      icon: 'BarChart3',
      children: [
        { name: 'Sprzedaz', href: '/dashboard/reports/sales' },
        { name: 'Pipeline', href: '/dashboard/reports/pipeline' },
        { name: 'Aktywnosc', href: '/dashboard/reports/activity' },
      ]
    },
    { name: 'Moduły', href: '/dashboard/modules', icon: 'Package', badge: 'Nowe' },
  ],

  primaryColor: '#6366f1', // Indigo
  basePrice: 299,
  isDefault: true,
};

/**
 * FOCUS PHOTO - Platform for photographers
 * Client management, sessions, timeline, galleries
 */
export const FOCUS_PHOTO: IndustryOverlayConfig = {
  slug: 'focus-photo',
  name: 'Focus Photo',
  description: 'Platforma dla fotografow - klienci, sesje, galerie, workflow',

  includedModules: [
    'dashboard',
    'contacts',     // Klienci
    'tasks',
    'projects',     // Sesje foto
    'calendar',
    'timeline',
    'files',
  ],

  availableAddons: [
    'focus-photo',  // Galerie online
    'focus-cloud',  // Backup RAW
    'flyball',      // Fotobudka
    'slotify',      // Rezerwacje
    'sites',        // Portfolio
    'faktury-ksef', // Faktury
  ],

  hiddenModules: [
    'companies',
    'deals',
    'pipeline',
    'offers',
    'orders',
    'products',
    'services',
    'hr',
    'flota',
    'communication',
  ],

  navigation: [
    { name: 'Pulpit', href: '/dashboard', icon: 'Home' },
    { name: 'Klienci', href: '/dashboard/contacts', icon: 'Users' },
    { name: 'Sesje', href: '/dashboard/projects', icon: 'Camera' },
    { name: 'Zadania', href: '/dashboard/tasks', icon: 'CheckSquare' },
    { name: 'Kalendarz', href: '/dashboard/calendar', icon: 'Calendar' },
    { name: 'Timeline', href: '/dashboard/timeline', icon: 'Clock' },
    { name: 'Pliki', href: '/dashboard/files', icon: 'FolderOpen' },
    { name: 'Moduły', href: '/dashboard/modules', icon: 'Package', badge: 'Nowe' },
  ],

  primaryColor: '#0EA5E9', // Sky blue
  basePrice: 99,
  isDefault: false,
};

/**
 * BIURO RACHUNKOWE - Platform for accounting offices
 */
export const BIURO_RACHUNKOWE: IndustryOverlayConfig = {
  slug: 'biuro-rachunkowe',
  name: 'Biuro Rachunkowe',
  description: 'Platforma dla biur rachunkowych - klienci, dokumenty, faktury',

  includedModules: [
    'dashboard',
    'companies',     // Firmy-klienci
    'contacts',      // Kontakty w firmach
    'invoices',      // Faktury
    'files',         // Dokumenty
    'tasks',
    'calendar',
  ],

  availableAddons: [
    'faktury-ksef',  // KSeF
    'slotify',       // Rezerwacje spotkań
    'sites',         // Strona WWW
  ],

  hiddenModules: [
    'deals', 'pipeline', 'offers', 'orders', 'products', 'services',
    'focus-photo', 'focus-cloud', 'flyball', 'timeline', 'hr', 'flota',
    'communication', 'gallery',
  ],

  navigation: [
    { name: 'Pulpit', href: '/dashboard', icon: 'Home' },
    { name: 'Klienci', href: '/dashboard/companies', icon: 'Building2' },
    { name: 'Kontakty', href: '/dashboard/contacts', icon: 'Users' },
    { name: 'Faktury', href: '/dashboard/invoices', icon: 'FileText' },
    { name: 'Dokumenty', href: '/dashboard/files', icon: 'FolderOpen' },
    { name: 'Zadania', href: '/dashboard/tasks', icon: 'CheckSquare' },
    { name: 'Kalendarz', href: '/dashboard/calendar', icon: 'Calendar' },
    { name: 'Moduły', href: '/dashboard/modules', icon: 'Package' },
  ],

  primaryColor: '#10b981', // Emerald green
  basePrice: 149,
};

/**
 * KANCELARIA PRAWNICZA - Platform for law offices
 */
export const KANCELARIA_PRAWNICZA: IndustryOverlayConfig = {
  slug: 'kancelaria-prawnicza',
  name: 'Kancelaria Prawnicza',
  description: 'Platforma dla kancelarii prawnych - sprawy, klienci, dokumenty',

  includedModules: [
    'dashboard',
    'contacts',      // Klienci
    'companies',     // Firmy-klienci
    'projects',      // Sprawy prawne
    'tasks',
    'calendar',      // Terminy rozpraw
    'files',         // Dokumenty
    'communication',
  ],

  availableAddons: [
    'faktury-ksef',
    'slotify',
    'sites',
  ],

  hiddenModules: [
    'deals', 'pipeline', 'offers', 'orders', 'products', 'services',
    'focus-photo', 'focus-cloud', 'flyball', 'timeline', 'hr', 'flota',
    'gallery', 'invoices',
  ],

  navigation: [
    { name: 'Pulpit', href: '/dashboard', icon: 'Home' },
    { name: 'Klienci', href: '/dashboard/contacts', icon: 'Users' },
    { name: 'Firmy', href: '/dashboard/companies', icon: 'Building2' },
    { name: 'Sprawy', href: '/dashboard/projects', icon: 'Scale' },
    { name: 'Zadania', href: '/dashboard/tasks', icon: 'CheckSquare' },
    { name: 'Kalendarz', href: '/dashboard/calendar', icon: 'Calendar' },
    { name: 'Dokumenty', href: '/dashboard/files', icon: 'FileText' },
    { name: 'Komunikacja', href: '/dashboard/communication', icon: 'MessageSquare' },
    { name: 'Moduły', href: '/dashboard/modules', icon: 'Package' },
  ],

  primaryColor: '#1e3a5f', // Navy blue
  basePrice: 199,
};

/**
 * AGENCJA NIERUCHOMOSCI - Platform for real estate agencies
 */
export const AGENCJA_NIERUCHOMOSCI: IndustryOverlayConfig = {
  slug: 'agencja-nieruchomosci',
  name: 'Agencja Nieruchomości',
  description: 'Platforma dla agencji nieruchomości - oferty, klienci, transakcje',

  includedModules: [
    'dashboard',
    'contacts',      // Klienci
    'deals',         // Transakcje
    'pipeline',      // Proces sprzedaży
    'offers',        // Oferty nieruchomości
    'tasks',
    'calendar',
    'files',         // Dokumenty, zdjęcia
    'communication',
  ],

  availableAddons: [
    'sites',         // Strona z ofertami
    'slotify',       // Rezerwacje pokazów
    'faktury-ksef',
  ],

  hiddenModules: [
    'orders', 'invoices', 'products', 'services',
    'focus-photo', 'focus-cloud', 'flyball', 'timeline', 'hr', 'flota',
    'gallery', 'companies',
  ],

  navigation: [
    { name: 'Pulpit', href: '/dashboard', icon: 'Home' },
    { name: 'Klienci', href: '/dashboard/contacts', icon: 'Users' },
    { name: 'Oferty', href: '/dashboard/offers', icon: 'Building' },
    { name: 'Transakcje', href: '/dashboard/deals', icon: 'Handshake' },
    { name: 'Pipeline', href: '/dashboard/pipeline', icon: 'GitBranch' },
    { name: 'Zadania', href: '/dashboard/tasks', icon: 'CheckSquare' },
    { name: 'Kalendarz', href: '/dashboard/calendar', icon: 'Calendar' },
    { name: 'Dokumenty', href: '/dashboard/files', icon: 'FolderOpen' },
    { name: 'Moduły', href: '/dashboard/modules', icon: 'Package' },
  ],

  primaryColor: '#8b5cf6', // Purple
  basePrice: 199,
};

/**
 * TARGI I EVENTY - Platform for trade shows and events
 */
export const TARGI_EVENTY: IndustryOverlayConfig = {
  slug: 'targi-eventy',
  name: 'Targi i Eventy',
  description: 'Platforma dla organizatorów targów i eventów',

  includedModules: [
    'dashboard',
    'contacts',      // Wystawcy, goście
    'companies',     // Firmy wystawców
    'projects',      // Eventy
    'tasks',
    'calendar',
    'communication',
    'files',
  ],

  availableAddons: [
    'slotify',       // Rezerwacje stoisk
    'sites',         // Strona eventu
    'faktury-ksef',
  ],

  hiddenModules: [
    'deals', 'pipeline', 'offers', 'orders', 'invoices', 'products', 'services',
    'focus-photo', 'focus-cloud', 'flyball', 'timeline', 'hr', 'flota', 'gallery',
  ],

  navigation: [
    { name: 'Pulpit', href: '/dashboard', icon: 'Home' },
    { name: 'Eventy', href: '/dashboard/projects', icon: 'Calendar' },
    { name: 'Wystawcy', href: '/dashboard/companies', icon: 'Building2' },
    { name: 'Kontakty', href: '/dashboard/contacts', icon: 'Users' },
    { name: 'Zadania', href: '/dashboard/tasks', icon: 'CheckSquare' },
    { name: 'Harmonogram', href: '/dashboard/calendar', icon: 'Clock' },
    { name: 'Komunikacja', href: '/dashboard/communication', icon: 'MessageSquare' },
    { name: 'Moduły', href: '/dashboard/modules', icon: 'Package' },
  ],

  primaryColor: '#f59e0b', // Amber
  basePrice: 249,
};

/**
 * All available overlays
 */
export const DEFAULT_OVERLAYS: IndustryOverlayConfig[] = [
  SORTO_BUSINESS,
  FOCUS_PHOTO,
  BIURO_RACHUNKOWE,
  KANCELARIA_PRAWNICZA,
  AGENCJA_NIERUCHOMOSCI,
  TARGI_EVENTY,
];

/**
 * Get overlay by slug
 */
export function getDefaultOverlay(slug: string): IndustryOverlayConfig | undefined {
  return DEFAULT_OVERLAYS.find(o => o.slug === slug);
}

/**
 * Get default overlay (first one marked as default)
 */
export function getDefaultFallbackOverlay(): IndustryOverlayConfig {
  return DEFAULT_OVERLAYS.find(o => o.isDefault) || SORTO_BUSINESS;
}

/**
 * Check if module is available for overlay
 */
export function isModuleAvailable(overlaySlug: string, moduleSlug: string): boolean {
  const overlay = getDefaultOverlay(overlaySlug);
  if (!overlay) return false;

  // Hidden modules are never available
  if (overlay.hiddenModules.includes(moduleSlug)) return false;

  // Included or addon modules are available
  return overlay.includedModules.includes(moduleSlug) ||
         overlay.availableAddons.includes(moduleSlug);
}

/**
 * Check if module is included (free) for overlay
 */
export function isModuleIncluded(overlaySlug: string, moduleSlug: string): boolean {
  const overlay = getDefaultOverlay(overlaySlug);
  if (!overlay) return false;

  return overlay.includedModules.includes(moduleSlug);
}

/**
 * Domain to overlay mapping
 * Maps hostnames to overlay slugs
 */
export const DOMAIN_OVERLAY_MAP: Record<string, string> = {
  // Dev domains
  'business.dev.sorto.ai': 'sorto-business',
  'foto.dev.sorto.ai': 'focus-photo',
  // Production domains (for future use)
  'business.sorto.ai': 'sorto-business',
  'foto.sorto.ai': 'focus-photo',
  // Default/dev domains use organization's configured overlay
  'crm.dev.sorto.ai': '',
  'localhost': '',
};

/**
 * Get overlay slug for domain
 * Returns empty string if domain should use organization's configured overlay
 */
export function getOverlayForDomain(hostname: string): string | null {
  // Remove port if present
  const domain = hostname.split(':')[0];

  // Check exact match
  if (DOMAIN_OVERLAY_MAP.hasOwnProperty(domain)) {
    return DOMAIN_OVERLAY_MAP[domain] || null;
  }

  // No domain-specific overlay
  return null;
}
