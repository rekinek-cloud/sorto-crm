/**
 * Billing Routes - Stripe integration for subscription management
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { subscriptionService } from '../services/SubscriptionService';
import { authMiddleware } from '../shared/middleware/auth';
import { logger } from '../config/logger';
import { PLAN_PRICING, PLAN_LIMITS } from '../config/planLimits';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Validation schemas
const checkoutSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  billingPeriod: z.enum(['monthly', 'yearly']),
});

/**
 * GET /api/v1/billing/subscription
 * Get current subscription details
 */
router.get('/subscription', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const details = await subscriptionService.getSubscriptionDetails(organizationId);

    if (!details) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Calculate trial days remaining
    const trialDaysRemaining = subscriptionService.getTrialDaysRemaining(details.trialEndsAt);

    res.json({
      ...details,
      trialDaysRemaining,
      isActive: subscriptionService.isSubscriptionActive(details),
    });
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * GET /api/v1/billing/plans
 * Get available plans with pricing
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = Object.entries(PLAN_LIMITS).map(([name, limits]) => ({
      name,
      limits,
      pricing: PLAN_PRICING[name as keyof typeof PLAN_PRICING],
    }));

    res.json({ plans });
  } catch (error) {
    logger.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

/**
 * POST /api/v1/billing/checkout
 * Create Stripe checkout session
 */
router.post('/checkout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = checkoutSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request', details: validation.error.errors });
    }

    const { plan, billingPeriod } = validation.data;
    const organizationId = req.user.organizationId;

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/billing/success`;
    const cancelUrl = `${baseUrl}/dashboard/billing`;

    const session = await subscriptionService.createCheckoutSession(
      organizationId,
      plan,
      billingPeriod,
      successUrl,
      cancelUrl
    );

    res.json(session);
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /api/v1/billing/portal
 * Create Stripe billing portal session
 */
router.post('/portal', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`;

    const session = await subscriptionService.createPortalSession(organizationId, returnUrl);

    res.json(session);
  } catch (error) {
    logger.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * GET /api/v1/billing/check-limit/:resource
 * Check if organization can create more of a resource
 */
router.get('/check-limit/:resource', authMiddleware, async (req: Request, res: Response) => {
  try {
    const resource = req.params.resource as 'users' | 'streams' | 'projects' | 'contacts' | 'deals';

    if (!['users', 'streams', 'projects', 'contacts', 'deals'].includes(resource)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const organizationId = req.user.organizationId;
    const result = await subscriptionService.checkLimit(organizationId, resource);

    res.json(result);
  } catch (error) {
    logger.error('Error checking limit:', error);
    res.status(500).json({ error: 'Failed to check limit' });
  }
});

/**
 * GET /api/v1/billing/check-feature/:feature
 * Check if organization has access to a feature
 */
router.get('/check-feature/:feature', authMiddleware, async (req: Request, res: Response) => {
  try {
    const feature = req.params.feature;
    const validFeatures = [
      'aiAssistant',
      'advancedReporting',
      'customFields',
      'apiAccess',
      'whiteLabel',
      'prioritySupport',
      'customIntegrations',
      'sso',
    ];

    if (!validFeatures.includes(feature)) {
      return res.status(400).json({ error: 'Invalid feature' });
    }

    const organizationId = req.user.organizationId;
    const result = await subscriptionService.checkFeature(
      organizationId,
      feature as any
    );

    res.json(result);
  } catch (error) {
    logger.error('Error checking feature:', error);
    res.status(500).json({ error: 'Failed to check feature' });
  }
});

/**
 * POST /api/v1/billing/webhook
 * Handle Stripe webhooks (no auth required)
 */
router.post(
  '/webhook',
  // Use raw body for Stripe signature verification
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, // raw body
        signature,
        webhookSecret
      );
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
      await subscriptionService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (error) {
      logger.error('Error handling webhook event:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

/**
 * GET /api/v1/billing/usage
 * Get detailed usage statistics
 */
router.get('/usage', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const details = await subscriptionService.getSubscriptionDetails(organizationId);

    if (!details) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const usage = {
      users: {
        current: details.usage.users,
        limit: details.limits.maxUsers,
        percentage: details.limits.maxUsers === -1 ? 0 : Math.round((details.usage.users / details.limits.maxUsers) * 100),
      },
      streams: {
        current: details.usage.streams,
        limit: details.limits.maxStreams,
        percentage: details.limits.maxStreams === -1 ? 0 : Math.round((details.usage.streams / details.limits.maxStreams) * 100),
      },
      projects: {
        current: details.usage.projects,
        limit: details.limits.maxProjects,
        percentage: details.limits.maxProjects === -1 ? 0 : Math.round((details.usage.projects / details.limits.maxProjects) * 100),
      },
      contacts: {
        current: details.usage.contacts,
        limit: details.limits.maxContacts,
        percentage: details.limits.maxContacts === -1 ? 0 : Math.round((details.usage.contacts / details.limits.maxContacts) * 100),
      },
      deals: {
        current: details.usage.deals,
        limit: details.limits.maxDeals,
        percentage: details.limits.maxDeals === -1 ? 0 : Math.round((details.usage.deals / details.limits.maxDeals) * 100),
      },
    };

    res.json({
      plan: details.plan,
      usage,
      features: details.limits.features,
    });
  } catch (error) {
    logger.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

export default router;
