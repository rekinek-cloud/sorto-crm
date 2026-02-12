/**
 * Platform Event Types
 * Based on SORTO Platform Infrastructure Spec
 */

/**
 * Event metadata for tracing and debugging
 */
export interface EventMetadata {
  correlationId?: string;  // Tracks chain of related events
  causationId?: string;    // ID of event that caused this event
  [key: string]: any;
}

/**
 * Core PlatformEvent interface as per spec
 * This is the canonical format for all platform events
 */
export interface PlatformEvent {
  id: string;
  type: string;            // e.g., "deal.won", "booking.created", "contact.updated"
  source: string;          // e.g., "crm", "slotify", "focus-photo"
  timestamp: string;       // ISO 8601 format
  organizationId: string;
  userId?: string;
  data: Record<string, any>;
  metadata?: EventMetadata;
}

/**
 * Input for publishing a new event (without auto-generated fields)
 */
export interface PublishEventInput {
  type: string;
  source: string;
  organizationId: string;
  userId?: string;
  data: Record<string, any>;
  metadata?: EventMetadata;
}

/**
 * Filters for querying events
 */
export interface EventQueryFilters {
  type?: string;
  source?: string;
  organizationId?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

/**
 * Paginated response for event queries
 */
export interface EventQueryResult {
  events: PlatformEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Event handler function type
 */
export type EventHandler = (event: PlatformEvent) => void | Promise<void>;

/**
 * Known event types for the platform
 * Organized by module/source
 */
export const PLATFORM_EVENT_TYPES = {
  // CRM Events
  CRM: {
    DEAL_WON: 'deal.won',
    DEAL_LOST: 'deal.lost',
    DEAL_CREATED: 'deal.created',
    DEAL_UPDATED: 'deal.updated',
    CONTACT_CREATED: 'contact.created',
    CONTACT_UPDATED: 'contact.updated',
    COMPANY_CREATED: 'company.created',
    COMPANY_UPDATED: 'company.updated',
    LEAD_CREATED: 'lead.created',
    LEAD_QUALIFIED: 'lead.qualified',
  },
  // Project Events
  PROJECTS: {
    PROJECT_CREATED: 'project.created',
    PROJECT_COMPLETED: 'project.completed',
    TASK_CREATED: 'task.created',
    TASK_COMPLETED: 'task.completed',
    TASK_OVERDUE: 'task.overdue',
  },
  // Booking Events (Slotify)
  SLOTIFY: {
    BOOKING_CREATED: 'booking.created',
    BOOKING_CONFIRMED: 'booking.confirmed',
    BOOKING_CANCELLED: 'booking.cancelled',
    BOOKING_COMPLETED: 'booking.completed',
    REMINDER_SENT: 'booking.reminder_sent',
  },
  // Photo Events (Focus Photo)
  FOCUS_PHOTO: {
    SESSION_CREATED: 'photo.session.created',
    SESSION_COMPLETED: 'photo.session.completed',
    GALLERY_PUBLISHED: 'photo.gallery.published',
    SELECTION_COMPLETED: 'photo.selection.completed',
  },
  // Cloud Events (Focus Cloud)
  FOCUS_CLOUD: {
    BACKUP_STARTED: 'cloud.backup.started',
    BACKUP_COMPLETED: 'cloud.backup.completed',
    SYNC_COMPLETED: 'cloud.sync.completed',
  },
  // Invoice Events
  INVOICES: {
    INVOICE_CREATED: 'invoice.created',
    INVOICE_SENT: 'invoice.sent',
    INVOICE_PAID: 'invoice.paid',
    INVOICE_OVERDUE: 'invoice.overdue',
  },
  // Auth Events
  AUTH: {
    USER_LOGGED_IN: 'user.logged_in',
    USER_LOGGED_OUT: 'user.logged_out',
    USER_SSO_TOKEN_CREATED: 'sso.token.created',
    USER_SSO_TOKEN_USED: 'sso.token.used',
  },
  // Module Events
  MODULE: {
    HEALTH_CHANGED: 'module.health.changed',
    INSTALLED: 'module.installed',
    UNINSTALLED: 'module.uninstalled',
    PURCHASED: 'module.purchased',
    CANCELLED: 'module.cancelled',
  },
} as const;

/**
 * Event sources (modules that can emit events)
 */
export const EVENT_SOURCES = {
  CORE: 'core',
  CRM: 'crm',
  PROJECTS: 'projects',
  INVOICES: 'invoices',
  CALENDAR: 'calendar',
  SLOTIFY: 'slotify',
  FOCUS_PHOTO: 'focus-photo',
  FOCUS_CLOUD: 'focus-cloud',
  FLYBALL: 'flyball',
  SITES: 'sites',
} as const;

export type EventSource = typeof EVENT_SOURCES[keyof typeof EVENT_SOURCES];
