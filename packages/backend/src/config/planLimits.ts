/**
 * Plan limits configuration for STREAMS CRM
 * Defines resource limits for each subscription plan
 */

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

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  STARTER: {
    maxUsers: 3,
    maxStreams: 5,
    maxProjects: 10,
    maxContacts: 500,
    maxDeals: 100,
    maxStorageGB: 1,
    maxApiCallsPerDay: 1000,
    features: {
      aiAssistant: false,
      advancedReporting: false,
      customFields: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
      customIntegrations: false,
      sso: false,
    },
  },
  PROFESSIONAL: {
    maxUsers: 10,
    maxStreams: 25,
    maxProjects: 50,
    maxContacts: 5000,
    maxDeals: 500,
    maxStorageGB: 10,
    maxApiCallsPerDay: 10000,
    features: {
      aiAssistant: true,
      advancedReporting: true,
      customFields: true,
      apiAccess: true,
      whiteLabel: false,
      prioritySupport: false,
      customIntegrations: false,
      sso: false,
    },
  },
  ENTERPRISE: {
    maxUsers: -1, // unlimited
    maxStreams: -1,
    maxProjects: -1,
    maxContacts: -1,
    maxDeals: -1,
    maxStorageGB: 100,
    maxApiCallsPerDay: -1,
    features: {
      aiAssistant: true,
      advancedReporting: true,
      customFields: true,
      apiAccess: true,
      whiteLabel: true,
      prioritySupport: true,
      customIntegrations: true,
      sso: true,
    },
  },
};

// Stripe Price IDs (to be configured in Stripe Dashboard)
export const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  STARTER: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
  },
  PROFESSIONAL: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || '',
  },
  ENTERPRISE: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
  },
};

// Plan pricing (display only, actual prices in Stripe)
export const PLAN_PRICING = {
  STARTER: { monthly: 29, yearly: 290 },
  PROFESSIONAL: { monthly: 79, yearly: 790 },
  ENTERPRISE: { monthly: 199, yearly: 1990 },
};

export const TRIAL_DAYS = 14;

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.STARTER;
}

export function isWithinLimit(currentCount: number, limit: number): boolean {
  if (limit === -1) return true; // unlimited
  return currentCount < limit;
}

export function hasFeature(plan: string, feature: keyof PlanLimits['features']): boolean {
  const limits = getPlanLimits(plan);
  return limits.features[feature] || false;
}
