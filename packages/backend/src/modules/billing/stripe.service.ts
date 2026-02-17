import Stripe from 'stripe';
import { prisma } from '../../config/database';
import { eventBusService } from '../events/event-bus.service';
import logger from '../../config/logger';
import config from '../../config';

// Initialize Stripe (only if key is configured)
const stripe = config.STRIPE?.SECRET_KEY
  ? new Stripe(config.STRIPE.SECRET_KEY, { apiVersion: '2023-08-16' as const })
  : null;

export class StripeService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!config.STRIPE?.SECRET_KEY;
    if (!this.isConfigured) {
      logger.warn('Stripe is not configured - payments will be disabled');
    }
  }

  /**
   * Check if Stripe is properly configured
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Create or get Stripe customer for organization
   */
  async getOrCreateCustomer(organizationId: string): Promise<string | null> {
    if (!this.isConfigured || !stripe) return null;

    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          subscriptions: true,
          users: {
            where: { role: 'OWNER' },
            take: 1,
          },
        },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      const subscription = organization.subscriptions[0];

      // Return existing customer if available
      if (subscription?.stripeCustomerId) {
        return subscription.stripeCustomerId;
      }

      // Create new customer in Stripe
      const owner = organization.users[0];
      const customer = await stripe.customers.create({
        name: organization.name,
        email: owner?.email,
        metadata: {
          organizationId,
          organizationName: organization.name,
        },
      });

      // Update subscription with customer ID
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId: customer.id },
        });
      }

      logger.info(`Created Stripe customer ${customer.id} for org ${organizationId}`);
      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer', { organizationId, error });
      return null;
    }
  }

  /**
   * Create Stripe Checkout session for module purchase
   */
  async createCheckoutSession(
    organizationId: string,
    moduleSlug: string,
    plan: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string; sessionId: string } | null> {
    if (!this.isConfigured || !stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const customerId = await this.getOrCreateCustomer(organizationId);
      if (!customerId) {
        throw new Error('Failed to get or create customer');
      }

      // Get module details
      const module = await prisma.platformModule.findUnique({
        where: { slug: moduleSlug },
      });

      if (!module) {
        throw new Error('Module not found');
      }

      const price = plan === 'monthly' ? module.monthlyPrice : module.yearlyPrice;

      // Create a price for this module (or use existing price ID if configured)
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'pln',
              product_data: {
                name: module.name,
                description: module.description || undefined,
              },
              unit_amount: Math.round(Number(price) * 100), // Convert to grosze
              recurring: {
                interval: plan === 'monthly' ? 'month' : 'year',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          organizationId,
          moduleId: module.id,
          moduleSlug: module.slug,
          plan,
        },
        subscription_data: {
          metadata: {
            organizationId,
            moduleId: module.id,
            moduleSlug: module.slug,
            plan,
          },
        },
      });

      logger.info(`Created checkout session ${session.id} for org ${organizationId}, module ${moduleSlug}`);

      return {
        url: session.url!,
        sessionId: session.id,
      };
    } catch (error) {
      logger.error('Failed to create checkout session', { organizationId, moduleSlug, error });
      throw error;
    }
  }

  /**
   * Create Stripe Customer Portal session
   */
  async createPortalSession(
    organizationId: string,
    returnUrl: string
  ): Promise<{ url: string } | null> {
    if (!this.isConfigured || !stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const subscription = await prisma.subscription.findFirst({
        where: { organizationId },
      });

      if (!subscription?.stripeCustomerId) {
        throw new Error('No Stripe customer found for organization');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      logger.error('Failed to create portal session', { organizationId, error });
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(
    payload: Buffer,
    signature: string
  ): Promise<{ received: boolean; event?: string }> {
    if (!this.isConfigured || !stripe) {
      return { received: false };
    }

    const webhookSecret = config.STRIPE?.WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return { received: false };
    }

    try {
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      logger.info(`Received Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.debug(`Unhandled Stripe event: ${event.type}`);
      }

      return { received: true, event: event.type };
    } catch (error: any) {
      logger.error('Stripe webhook error', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle successful checkout - activate module for organization
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { organizationId, moduleId, moduleSlug } = session.metadata || {};

    if (!organizationId || !moduleId) {
      logger.error('No organizationId or moduleId in checkout session metadata');
      return;
    }

    // Activate module for organization
    await prisma.organizationModule.upsert({
      where: {
        organizationId_moduleId: {
          organizationId,
          moduleId,
        },
      },
      create: {
        organizationId,
        moduleId,
        isActive: true,
        activatedAt: new Date(),
        stripeSubscriptionItemId: session.subscription as string,
      } as any,
      update: {
        isActive: true,
        activatedAt: new Date(),
        expiresAt: null,
        stripeSubscriptionItemId: session.subscription as string,
      },
    });

    // Update subscription status
    const subscription = await prisma.subscription.findFirst({
      where: { organizationId },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          stripeSubscriptionId: session.subscription as string,
          status: 'ACTIVE',
        },
      });
    }

    await eventBusService.publish({
      type: 'module.purchased',
      source: 'stripe',
      organizationId,
      data: {
        moduleId,
        moduleSlug,
        sessionId: session.id,
      },
    });

    logger.info(`Module ${moduleSlug} activated for org ${organizationId}`);
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const organizationId = stripeSubscription.metadata?.organizationId;
    if (!organizationId) {
      logger.warn('No organizationId in subscription metadata');
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { organizationId },
    });

    if (!subscription) {
      logger.warn(`No subscription found for org ${organizationId}`);
      return;
    }

    // Map Stripe status to our status
    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      unpaid: 'PAST_DUE',
      trialing: 'TRIAL',
      paused: 'PAUSED',
    };

    const status = statusMap[stripeSubscription.status] || 'ACTIVE';

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: status as any,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    await eventBusService.publish({
      type: 'billing.subscription.updated',
      source: 'stripe',
      organizationId,
      data: {
        status,
        periodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    logger.info(`Subscription updated for org ${organizationId}: ${status}`);
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const organizationId = stripeSubscription.metadata?.organizationId;
    if (!organizationId) return;

    const subscription = await prisma.subscription.findFirst({
      where: { organizationId },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          stripeSubscriptionId: null,
        },
      });

      // Deactivate all organization modules with this subscription
      await prisma.organizationModule.updateMany({
        where: {
          organizationId,
          stripeSubscriptionItemId: stripeSubscription.id,
        },
        data: {
          isActive: false,
          expiresAt: new Date(),
        },
      });
    }

    await eventBusService.publish({
      type: 'billing.subscription.canceled',
      source: 'stripe',
      organizationId,
      data: {},
    });

    logger.info(`Subscription canceled for org ${organizationId}`);
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!subscription) return;

    await eventBusService.publish({
      type: 'billing.invoice.paid',
      source: 'stripe',
      organizationId: subscription.organizationId,
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
      },
    });

    logger.info(`Invoice paid for org ${subscription.organizationId}: ${invoice.amount_paid / 100} ${invoice.currency}`);
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!subscription) return;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    });

    await eventBusService.publish({
      type: 'billing.invoice.failed',
      source: 'stripe',
      organizationId: subscription.organizationId,
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
      },
    });

    logger.warn(`Invoice payment failed for org ${subscription.organizationId}`);
  }

  /**
   * Cancel module subscription at period end
   */
  async cancelModuleSubscription(organizationId: string, moduleId: string): Promise<boolean> {
    if (!this.isConfigured || !stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const orgModule = await prisma.organizationModule.findUnique({
        where: {
          organizationId_moduleId: {
            organizationId,
            moduleId,
          },
        },
      });

      if (!orgModule?.stripeSubscriptionItemId) {
        throw new Error('No active Stripe subscription for this module');
      }

      // Cancel the subscription item
      await stripe.subscriptions.update(orgModule.stripeSubscriptionItemId, {
        cancel_at_period_end: true,
      });

      logger.info(`Module subscription cancellation scheduled for org ${organizationId}, module ${moduleId}`);
      return true;
    } catch (error) {
      logger.error('Failed to cancel module subscription', { organizationId, moduleId, error });
      throw error;
    }
  }
}

export const stripeService = new StripeService();
