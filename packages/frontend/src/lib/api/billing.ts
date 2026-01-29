/**
 * Billing API client
 */

import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getAuthHeaders(): Promise<Headers> {
  const token = Cookies.get('access_token');
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export interface PlanLimits {
  maxUsers: number;
  maxStreams: number;
  maxProjects: number;
  maxContacts: number;
  maxDeals: number;
  maxStorageGB: number;
  maxApiCallsPerDay: number;
  features: {
    aiAssistant: boolean;
    advancedReporting: boolean;
    customFields: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
    customIntegrations: boolean;
    sso: boolean;
  };
}

export interface SubscriptionDetails {
  id: string;
  organizationId: string;
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: PlanLimits;
  usage: {
    users: number;
    streams: number;
    projects: number;
    contacts: number;
    deals: number;
  };
  trialDaysRemaining: number;
  isActive: boolean;
}

export interface Plan {
  name: string;
  limits: PlanLimits;
  pricing: {
    monthly: number;
    yearly: number;
  };
}

export interface UsageDetails {
  plan: string;
  usage: {
    users: { current: number; limit: number; percentage: number };
    streams: { current: number; limit: number; percentage: number };
    projects: { current: number; limit: number; percentage: number };
    contacts: { current: number; limit: number; percentage: number };
    deals: { current: number; limit: number; percentage: number };
  };
  features: PlanLimits['features'];
}

export const billingApi = {
  async getSubscription(): Promise<SubscriptionDetails> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/billing/subscription`, { headers });
    if (!response.ok) throw new Error('Failed to fetch subscription');
    return response.json();
  },

  async getPlans(): Promise<{ plans: Plan[] }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/billing/plans`, { headers });
    if (!response.ok) throw new Error('Failed to fetch plans');
    return response.json();
  },

  async getUsage(): Promise<UsageDetails> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/billing/usage`, { headers });
    if (!response.ok) throw new Error('Failed to fetch usage');
    return response.json();
  },

  async createCheckout(plan: string, billingPeriod: 'monthly' | 'yearly'): Promise<{ sessionId: string; url: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/billing/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ plan, billingPeriod }),
    });
    if (!response.ok) throw new Error('Failed to create checkout session');
    return response.json();
  },

  async createPortalSession(): Promise<{ url: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/billing/portal`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error('Failed to create portal session');
    return response.json();
  },

  async checkLimit(resource: string): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/billing/check-limit/${resource}`, { headers });
    if (!response.ok) throw new Error('Failed to check limit');
    return response.json();
  },

  async checkFeature(feature: string): Promise<{ allowed: boolean; message?: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/billing/check-feature/${feature}`, { headers });
    if (!response.ok) throw new Error('Failed to check feature');
    return response.json();
  },
};
