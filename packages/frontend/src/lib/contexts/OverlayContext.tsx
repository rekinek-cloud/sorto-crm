'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  OverlayData,
  NavigationItem,
  getCurrentOverlay,
  getOverlayNavigation,
} from '@/lib/api/overlays';
import { PlatformModule, getPurchasedModules } from '@/lib/api/modules';

export interface PurchasedModule extends PlatformModule {}

interface OverlayContextType {
  overlay: OverlayData | null;
  navigation: NavigationItem[];
  purchasedModules: PurchasedModule[];
  branding: {
    primaryColor: string;
    logo: string | null;
    name: string;
  };
  isLoading: boolean;
  error: string | null;
  refreshOverlay: () => Promise<void>;
  refreshModules: () => Promise<void>;
  isModuleVisible: (moduleSlug: string) => boolean;
  isModuleIncluded: (moduleSlug: string) => boolean;
}

const defaultBranding: { primaryColor: string; logo: string | null; name: string } = {
  primaryColor: '#6366f1',
  logo: null,
  name: 'STREAMS',
};

const CACHE_KEY = 'overlay_cache';
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

interface CachedOverlay {
  overlay: OverlayData;
  navigation: NavigationItem[];
  branding: { primaryColor: string; logo: string | null; name: string };
  timestamp: number;
  domain: string;
}

function getCachedOverlay(): CachedOverlay | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached) as CachedOverlay;
    // Check if cache is expired or from different domain
    const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY;
    const isDifferentDomain = data.domain !== window.location.hostname;
    if (isExpired || isDifferentDomain) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedOverlay(overlay: OverlayData, navigation: NavigationItem[], branding: { primaryColor: string; logo: string | null; name: string }) {
  if (typeof window === 'undefined') return;
  try {
    const data: CachedOverlay = {
      overlay,
      navigation,
      branding,
      timestamp: Date.now(),
      domain: window.location.hostname,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  // Initialize from cache if available (lazy initialization - computed only once)
  const [overlay, setOverlay] = useState<OverlayData | null>(() => {
    const cached = getCachedOverlay();
    return cached?.overlay || null;
  });
  const [navigation, setNavigation] = useState<NavigationItem[]>(() => {
    const cached = getCachedOverlay();
    return cached?.navigation || [];
  });
  const [branding, setBranding] = useState(() => {
    const cached = getCachedOverlay();
    return cached?.branding || defaultBranding;
  });
  const [isLoading, setIsLoading] = useState(() => {
    const cached = getCachedOverlay();
    return !cached; // Not loading if we have cache
  });
  const [error, setError] = useState<string | null>(null);
  const [hasCacheOnMount] = useState(() => !!getCachedOverlay());
  const [purchasedModules, setPurchasedModules] = useState<PurchasedModule[]>([]);

  const fetchModules = useCallback(async () => {
    if (!isAuthenticated) {
      setPurchasedModules([]);
      return;
    }
    try {
      const modules = await getPurchasedModules();
      setPurchasedModules(modules);
    } catch (err) {
      console.error('Failed to fetch purchased modules:', err);
    }
  }, [isAuthenticated]);

  const fetchOverlay = useCallback(async () => {
    if (!isAuthenticated) {
      setOverlay(null);
      setNavigation([]);
      setBranding(defaultBranding);
      setIsLoading(false);
      localStorage.removeItem(CACHE_KEY);
      return;
    }

    try {
      // Only show loading if we didn't have cached data on mount
      if (!hasCacheOnMount) {
        setIsLoading(true);
      }
      setError(null);

      // Fetch overlay and navigation in parallel
      const [overlayData, navData] = await Promise.all([
        getCurrentOverlay(),
        getOverlayNavigation(),
      ]);

      setOverlay(overlayData);
      setNavigation(navData.navigation);
      setBranding(navData.branding);

      // Cache the fetched data
      setCachedOverlay(overlayData, navData.navigation, navData.branding);
    } catch (err: any) {
      console.error('Failed to fetch overlay:', err);
      setError(err.message || 'Failed to fetch overlay');
      // Keep cached or default branding on error
      if (!hasCacheOnMount) {
        setBranding(defaultBranding);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, hasCacheOnMount]);

  // Fetch overlay and modules when auth state changes
  useEffect(() => {
    fetchOverlay();
    fetchModules();
  }, [fetchOverlay, fetchModules]);

  // Check if a module is visible (included or purchased addon)
  const isModuleVisible = useCallback(
    (moduleSlug: string): boolean => {
      if (!overlay) return true; // Show all if no overlay loaded

      // Hidden modules are never visible
      if (overlay.hiddenModules.includes(moduleSlug)) {
        return false;
      }

      // Included modules are always visible
      if (overlay.includedModules.includes(moduleSlug)) {
        return true;
      }

      // For addons, we'd need to check if purchased
      // For now, show all addons (frontend doesn't know purchase status yet)
      if (overlay.availableAddons.includes(moduleSlug)) {
        return true; // TODO: Check if purchased
      }

      // Default: show if not explicitly hidden
      return true;
    },
    [overlay]
  );

  // Check if a module is included (free with overlay)
  const isModuleIncluded = useCallback(
    (moduleSlug: string): boolean => {
      if (!overlay) return false;
      return overlay.includedModules.includes(moduleSlug);
    },
    [overlay]
  );

  const value: OverlayContextType = {
    overlay,
    navigation,
    purchasedModules,
    branding,
    isLoading,
    error,
    refreshOverlay: fetchOverlay,
    refreshModules: fetchModules,
    isModuleVisible,
    isModuleIncluded,
  };

  return (
    <OverlayContext.Provider value={value}>
      {children}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (context === undefined) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
}

/**
 * Hook to check if user can access a specific module
 */
export function useModuleAccess(moduleSlug: string) {
  const { isModuleVisible, isModuleIncluded, overlay } = useOverlay();

  return {
    isVisible: isModuleVisible(moduleSlug),
    isIncluded: isModuleIncluded(moduleSlug),
    isAddon: overlay?.availableAddons.includes(moduleSlug) ?? false,
    isHidden: overlay?.hiddenModules.includes(moduleSlug) ?? false,
  };
}
