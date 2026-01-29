/**
 * Enrichment API Client
 * Wzbogacanie danych firm przez AI (Apify/Brave Search)
 */

import { apiClient } from './client';

export interface EnrichmentUsageStats {
  hasAccess: boolean;
  used: number;
  limit: number;
  remaining: number;
  renewsAt: string;
  plan: string;
}

export interface EnrichedCompanyData {
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  employees?: string;
  founded?: string;
  additionalInfo?: string[];
}

export interface EnrichmentResult {
  success: boolean;
  data?: EnrichedCompanyData;
  cacheHit: boolean;
  source: string;
  enrichedAt: string;
  error?: string;
}

export interface EnrichmentHistoryEntry {
  id: string;
  enrichmentType: string;
  targetId: string | null;
  targetDomain: string | null;
  success: boolean;
  cacheHit: boolean;
  costUnits: number;
  createdAt: string;
}

// === API Functions ===

/**
 * Pobierz statystyki użycia enrichmentu
 */
export async function getEnrichmentUsage(): Promise<EnrichmentUsageStats> {
  const response = await apiClient.get('/enrich/usage');
  return response.data;
}

/**
 * Wzbogać dane firmy na podstawie domeny
 */
export async function enrichCompany(domain: string, companyId?: string): Promise<EnrichmentResult> {
  const response = await apiClient.post('/enrich/company', {
    domain,
    companyId,
  });
  return response.data;
}

/**
 * Wzbogać dane kontaktu
 */
export async function enrichContact(
  email: string,
  contactId?: string,
  companyDomain?: string
): Promise<EnrichmentResult> {
  const response = await apiClient.post('/enrich/contact', {
    email,
    contactId,
    companyDomain,
  });
  return response.data;
}

/**
 * Pobierz historię wzbogacania
 */
export async function getEnrichmentHistory(options?: {
  limit?: number;
  offset?: number;
  type?: string;
}): Promise<EnrichmentHistoryEntry[]> {
  const response = await apiClient.get('/enrich/history', {
    params: options,
  });
  return response.data;
}
