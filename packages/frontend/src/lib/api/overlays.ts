/**
 * Overlays API Client
 * Handles fetching industry overlay configuration from backend
 */

import apiClient, { ApiResponse } from './client';

export interface NavigationItem {
  name: string;
  href?: string;
  icon?: string;
  children?: NavigationItem[];
  badge?: string;
  external?: boolean;
}

export interface OverlayData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  includedModules: string[];
  availableAddons: string[];
  hiddenModules: string[];
  navigation: NavigationItem[];
  primaryColor: string;
  logo: string | null;
  basePrice: number | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface OverlayNavigation {
  navigation: NavigationItem[];
  branding: {
    primaryColor: string;
    logo: string | null;
    name: string;
  };
}

/**
 * Get all available overlays
 */
export async function getAllOverlays(): Promise<OverlayData[]> {
  const response = await apiClient.get<ApiResponse<OverlayData[]>>('/overlays');
  return response.data.data;
}

/**
 * Get specific overlay by slug
 */
export async function getOverlayBySlug(slug: string): Promise<OverlayData> {
  const response = await apiClient.get<ApiResponse<OverlayData>>(`/overlays/${slug}`);
  return response.data.data;
}

/**
 * Get current overlay for organization (requires auth)
 */
export async function getCurrentOverlay(): Promise<OverlayData> {
  const response = await apiClient.get<ApiResponse<OverlayData>>('/overlays/current');
  return response.data.data;
}

/**
 * Get navigation for organization (requires auth)
 */
export async function getOverlayNavigation(): Promise<OverlayNavigation> {
  const response = await apiClient.get<ApiResponse<OverlayNavigation>>('/overlays/navigation');
  return response.data.data;
}

/**
 * Set overlay for current organization (admin only)
 */
export async function setCurrentOverlay(overlaySlug: string): Promise<OverlayData> {
  const response = await apiClient.put<ApiResponse<OverlayData>>('/overlays/current', {
    overlaySlug,
  });
  return response.data.data;
}

/**
 * Check if module is visible for current organization
 */
export async function isModuleVisible(moduleSlug: string): Promise<boolean> {
  const response = await apiClient.get<ApiResponse<{ moduleSlug: string; visible: boolean }>>(
    `/overlays/module/${moduleSlug}/visible`
  );
  return response.data.data.visible;
}

/**
 * Seed default overlays (admin only)
 */
export async function seedOverlays(): Promise<void> {
  await apiClient.post('/overlays/seed');
}
