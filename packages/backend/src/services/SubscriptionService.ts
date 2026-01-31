/**
 * SubscriptionService - Handles subscription management and Stripe integration
 */

import Stripe from 'stripe';
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PLAN_LIMITS, STRIPE_PRICE_IDS, TRIAL_DAYS, getPlanLimits, isWithinLimit, hasFeature, PlanLimits } from '../config/planLimits';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface PortalSessionResult {
  url: string;
}

export interface SubscriptionDetails {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  limits: PlanLimits;
  usage: {
    users: number;
    streams: number;
    projects: number;
    contacts: number;
    deals: number;
  };
}

export class SubscriptionService {
  /**
   * Initialize subscription for new organization (starts trial)
   */
  async initializeSubscription(organizationId: string): Promise<void> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    await prisma.subscription.upsert({
      where: { organizationId },
      update: {
        status: 'TRIAL',
        trialEndsAt,
        plan: 'STARTER',
      },
      create: {
        organizationId,
        status: 'TRIAL',
        plan: 'STARTER',
        trialEndsAt,
        trialDays: TRIAL_DAYS,
      },
    });

    logger.info(`Initialized trial subscription for organization ${organizationId}`);
  }

  /**
   * Get subscription details with current usage
   */
  async getSubscriptionDetails(organizationId: string): Promise<SubscriptionDetails | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                streams: true,
                projects: true,
                contacts: true,
                deals: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) return null;

    // Count users separately
    const userCount = await prisma.user.count({
      where: { organizationId },
    });

    return {
      id: subscription.id,
      organizationId: subscription.organizationId,
      plan: subscription.plan,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      limits: getPlanLimits(subscription.plan),
      usage: {
        users: userCount,
        streams: subscription.organization._count.streams,
        projects: subscription.organization._count.projects,
        contacts: subscription.organization._count.contacts,
        deals: subscription.organization._count.deals,
      },
    };
  }

  /**
   * Check if organization can perform action based on plan limits
   */
  async checkLimit(
    organizationId: string,
    resource: 'users' | 'streams' | 'projects' | 'contacts' | 'deals'
  ): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
    const details = await this.getSubscriptionDetails(organizationId);

    if (!details) {
      return { allowed: false, current: 0, limit: 0, message: 'Subscription not found' };
    }

    // Check if subscription is active
    if (!this.isSubscriptionActive(details)) {
      return { allowed: false, current: 0, limit: 0, message: 'Subscription is not active' };
    }

    const limitKey = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof PlanLimits;
    const limit = details.limits[limitKey] as number;
    const current = details.usage[resource];

    const allowed = isWithinLimit(current, limit);

    return {
      allowed,
      current,
      limit,
      message: allowed ? undefined : `${resource} limit reached (${current}/${limit === -1 ? 'unlimited' : limit})`,
    };
  }

  /**
   * Check if organization has feature access
   */
  async checkFeature(
    organizationId: string,
    feature: keyof PlanLimits['features']
  ): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) {
      return { allowed: false, message: 'Subscription not found' };
    }

    const allowed = hasFeature(subscription.plan, feature);

    return {
      allowed,
      message: allowed ? undefined : `Feature "${feature}" requires plan upgrade`,
    };
  }

  /**
   * Check if subscription is active (not expired, not canceled)
   */
  isSubscriptionActive(details: SubscriptionDetails): boolean {
    const { status, trialEndsAt } = details;

    if (status === 'CANCELED') return false;
    if (status === 'TRIAL' && trialEndsAt && new Date() > trialEndsAt) return false;
    if (status === 'PAST_DUE') return true; // grace period

    return true;
  }

  /**
   * Create Stripe checkout session for subscription
   */
  async createCheckoutSession(
    organizationId: string,
    plan: SubscriptionPlan,
    billingPeriod: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionResult> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { organization: true },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Get or create Stripe customer
    let customerId = subscription.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          organizationId,
          organizationName: subscription.organization.name,
        },
      });
      customerId = customer.id;

      await prisma.subscription.update({
        where: { organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Get price ID
    const priceId = STRIPE_PRICE_IDS[plan]?.[billingPeriod];

    if (!priceId) {
      throw new Error(`Price ID not configured for ${plan} ${billingPeriod}`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        plan,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          organizationId,
          plan,
        },
      },
    });

    logger.info(`Created checkout session ${session.id} for organization ${organizationId}`);

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Create Stripe billing portal session
   */
  async createPortalSession(organizationId: string, returnUrl: string): Promise<PortalSessionResult> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentSucceeded(invoice);
        break;
      }

      default:
        logger.debug(`Unhandled webhook event: ${event.type}`);
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    const plan = session.metadata?.plan as SubscriptionPlan;

    if (!organizationId || !plan) {
      logger.error('Missing metadata in checkout session', { sessionId: session.id });
      return;
    }

    await prisma.subscription.update({
      where: { organizationId },
      data: {
        stripeSubscriptionId: session.subscription as string,
        plan,
        status: 'ACTIVE',
        trialEndsAt: null,
      },
    });

    logger.info(`Checkout completed for organization ${organizationId}, plan: ${plan}`);
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;

    if (!organizationId) {
      logger.warn('Subscription update without organizationId', { subscriptionId: subscription.id });
      return;
    }

    const plan = subscription.metadata?.plan as SubscriptionPlan || 'STARTER';
    const status = this.mapStripeStatus(subscription.status);

    await prisma.subscription.update({
      where: { organizationId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        plan,
        status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    logger.info(`Subscription updated for organization ${organizationId}`, { status, plan });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;

    if (!organizationId) return;

    await prisma.subscription.update({
      where: { organizationId },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: false,
      },
    });

    logger.info(`Subscription canceled for organization ${organizationId}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' },
      });

      logger.warn(`Payment failed for organization ${subscription.organizationId}`);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (subscription && subscription.status === 'PAST_DUE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' },
      });

      logger.info(`Payment succeeded, subscription reactivated for organization ${subscription.organizationId}`);
    }
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'trialing':
        return 'TRIAL';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
      case 'unpaid':
        return 'CANCELED';
      case 'paused':
        return 'PAUSED';
      default:
        return 'ACTIVE';
    }
  }

  /**
   * Check and expire trials (run via cron job)
   */
  async expireTrials(): Promise<number> {
    const expiredTrials = await prisma.subscription.updateMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: { lt: new Date() },
      },
      data: {
        status: 'CANCELED',
      },
    });

    if (expiredTrials.count > 0) {
      logger.info(`Expired ${expiredTrials.count} trial subscriptions`);
    }

    return expiredTrials.count;
  }

  /**
   * Get trial days remaining
   */
  getTrialDaysRemaining(trialEndsAt: Date | null): number {
    if (!trialEndsAt) return 0;

    const now = new Date();
    const diff = trialEndsAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}

export const subscriptionService = new SubscriptionService();
