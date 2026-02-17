import { Request, Response } from 'express';
import { billingService } from './billing.service';
import { stripeService } from './stripe.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import config from '../../config';
import logger from '../../config/logger';

export class BillingController {
  /**
   * GET /api/v1/billing/stripe/status
   * Check if Stripe is configured
   */
  getStripeStatus = async (req: Request, res: Response) => {
    return res.json({
      configured: stripeService.isAvailable(),
      publicKey: (config.STRIPE as any)?.PUBLIC_KEY || null,
    });
  };

  /**
   * GET /api/v1/billing/current
   * Get current subscription with modules
   */
  getCurrent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subscription = await billingService.getCurrentSubscription(
        req.user!.organizationId
      );

      if (!subscription) {
        return res.status(404).json({ error: 'No subscription found' });
      }

      return res.json({ message: 'Subscription retrieved', data: subscription });
    } catch (error: any) {
      logger.error('Error getting current subscription:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/v1/billing/modules
   * Get available modules with pricing
   */
  getAvailableModules = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const modules = await billingService.getAvailableModules(
        req.user!.organizationId
      );
      return res.json({ message: 'Available modules retrieved', data: modules });
    } catch (error: any) {
      logger.error('Error getting available modules:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/v1/billing/modules/active
   * Get organization's active modules
   */
  getActiveModules = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const modules = await billingService.getActiveModules(
        req.user!.organizationId
      );
      return res.json({ message: 'Active modules retrieved', data: modules });
    } catch (error: any) {
      logger.error('Error getting active modules:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/v1/billing/add-module
   * Add a module to the organization (free or trigger Stripe checkout)
   */
  addModule = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { moduleId } = req.body;

      if (!moduleId) {
        return res.status(400).json({ error: 'moduleId is required' });
      }

      const result = await billingService.addModule(
        req.user!.organizationId,
        moduleId,
        req.user!.id
      );

      return res.json({ message: 'Module added to organization', data: result });
    } catch (error: any) {
      logger.error('Error adding module:', error);
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * DELETE /api/v1/billing/remove-module/:moduleId
   * Remove a module from the organization
   */
  removeModule = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { moduleId } = req.params;

      const result = await billingService.removeModule(
        req.user!.organizationId,
        moduleId,
        req.user!.id
      );

      return res.json({ message: 'Module removed from organization', data: result });
    } catch (error: any) {
      logger.error('Error removing module:', error);
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/v1/billing/stripe/checkout
   * Create Stripe checkout session for module purchase
   */
  createCheckoutSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!stripeService.isAvailable()) {
        return res.status(503).json({ error: 'Payment processing is not available' });
      }

      const { moduleSlug, plan, successUrl, cancelUrl } = req.body;

      if (!moduleSlug || !plan || !successUrl || !cancelUrl) {
        return res.status(400).json({
          error: 'moduleSlug, plan, successUrl, and cancelUrl are required',
        });
      }

      if (plan !== 'monthly' && plan !== 'yearly') {
        return res.status(400).json({ error: 'plan must be "monthly" or "yearly"' });
      }

      const session = await stripeService.createCheckoutSession(
        req.user!.organizationId,
        moduleSlug,
        plan,
        successUrl,
        cancelUrl
      );

      return res.json({ message: 'Checkout session created', data: session });
    } catch (error: any) {
      logger.error('Error creating checkout session:', error);
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/v1/billing/stripe/portal
   * Create Stripe customer portal session
   */
  createPortalSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!stripeService.isAvailable()) {
        return res.status(503).json({ error: 'Payment processing is not available' });
      }

      const { returnUrl } = req.body;

      if (!returnUrl) {
        return res.status(400).json({ error: 'returnUrl is required' });
      }

      const session = await stripeService.createPortalSession(
        req.user!.organizationId,
        returnUrl
      );

      return res.json({ message: 'Portal session created', data: session });
    } catch (error: any) {
      logger.error('Error creating portal session:', error);
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/v1/billing/stripe/cancel
   * Cancel module subscription at period end
   */
  cancelModuleSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!stripeService.isAvailable()) {
        return res.status(503).json({ error: 'Payment processing is not available' });
      }

      const { moduleId } = req.body;

      if (!moduleId) {
        return res.status(400).json({ error: 'moduleId is required' });
      }

      await stripeService.cancelModuleSubscription(req.user!.organizationId, moduleId);

      return res.json({ message: 'Module subscription will be canceled at the end of the billing period' });
    } catch (error: any) {
      logger.error('Error canceling module subscription:', error);
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/v1/billing/stripe/webhook
   * Handle Stripe webhook
   */
  handleWebhook = async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      const result = await stripeService.handleWebhook(req.body, signature);

      return res.json({ received: result.received, event: result.event });
    } catch (error: any) {
      logger.error('Webhook error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  };
}
