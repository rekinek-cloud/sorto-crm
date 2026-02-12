/**
 * Module Integration Types
 *
 * Defines the interface between platform and embedded modules
 */

// Message types for postMessage communication
export type ModuleMessageType =
  | 'MODULE_READY'           // Module loaded and ready
  | 'MODULE_NAVIGATE'        // Module wants to navigate
  | 'MODULE_RESIZE'          // Module requests height change
  | 'MODULE_NOTIFICATION'    // Module sends notification
  | 'MODULE_ACTION'          // Module triggers action
  | 'PLATFORM_INIT'          // Platform sends init data
  | 'PLATFORM_THEME'         // Platform sends theme update
  | 'PLATFORM_USER'          // Platform sends user data
  | 'PLATFORM_NAVIGATE'      // Platform navigation event
  | 'PLATFORM_LOGOUT';       // Platform logout event

export interface ModuleMessage {
  type: ModuleMessageType;
  payload: any;
  moduleSlug?: string;
  timestamp: number;
}

// Init data sent from platform to module
export interface ModuleInitData {
  mode: 'embedded' | 'standalone';
  ssoToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    organizationName: string;
  };
  branding: {
    primaryColor: string;
    logo: string | null;
    name: string;
    theme: 'light' | 'dark';
  };
  locale: string;
  features: string[];  // Enabled features for this org
}

// Module manifest (describes module capabilities)
export interface ModuleManifest {
  slug: string;
  name: string;
  version: string;
  description: string;
  icon: string;

  // URLs
  standaloneUrl: string;    // Full app URL
  embeddedUrl: string;      // Embedded mode URL (without shell)

  // Capabilities
  capabilities: {
    notifications: boolean;
    fileUpload: boolean;
    camera: boolean;
    geolocation: boolean;
  };

  // Navigation items this module provides
  navigation?: {
    name: string;
    href: string;
    icon: string;
  }[];
}

// Helper to create module messages
export function createModuleMessage(
  type: ModuleMessageType,
  payload: any,
  moduleSlug?: string
): ModuleMessage {
  return {
    type,
    payload,
    moduleSlug,
    timestamp: Date.now(),
  };
}

// Helper to validate message origin
export function isValidModuleOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain) || origin.endsWith('.' + domain);
    }
    return origin === allowed || origin === `https://${allowed}`;
  });
}
