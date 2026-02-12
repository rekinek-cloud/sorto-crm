import { apiClient } from './client';

export interface PlatformModule {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  url: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  isPurchased?: boolean;
  purchasedAt?: string | null;
  expiresAt?: string | null;
}

export interface ModuleStatus {
  module: PlatformModule | null;
  isAvailable: boolean;
  isPurchased: boolean;
  isIncluded: boolean;
  purchasedAt: string | null;
  expiresAt: string | null;
}

/**
 * Get all modules (admin only)
 */
export async function getAllModules(): Promise<PlatformModule[]> {
  const response = await apiClient.get('/platform-modules');
  return response.data.data;
}

/**
 * Get available modules for purchase (based on organization's overlay)
 */
export async function getAvailableModules(): Promise<PlatformModule[]> {
  const response = await apiClient.get('/platform-modules/available');
  return response.data.data;
}

/**
 * Get purchased modules for organization
 */
export async function getPurchasedModules(): Promise<PlatformModule[]> {
  const response = await apiClient.get('/platform-modules/purchased');
  return response.data.data;
}

/**
 * Get module status
 */
export async function getModuleStatus(slug: string): Promise<ModuleStatus> {
  const response = await apiClient.get(`/platform-modules/${slug}/status`);
  return response.data.data;
}

/**
 * Purchase a module (activate trial or redirect to Stripe)
 */
export async function purchaseModule(slug: string): Promise<{
  message: string;
  module?: PlatformModule;
  stripeCheckoutUrl?: string;
}> {
  const response = await apiClient.post(`/platform-modules/${slug}/purchase`);
  return response.data;
}

/**
 * Cancel/deactivate a module
 */
export async function cancelModule(slug: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/platform-modules/${slug}/cancel`);
  return response.data;
}
