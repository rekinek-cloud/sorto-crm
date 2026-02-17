import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { generateTokenPair, TokenPayload, invalidateAllUserTokens } from '../../shared/utils/jwt';
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from '../../shared/middleware/error';
import config from '../../config';
import logger from '../../config/logger';
import { emailService } from '../../services/EmailService';
import {
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  InviteUserRequest,
  AcceptInvitationRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerificationRequest,
} from './schemas';

export class AuthService {
  /**
   * Register new organization and owner user
   */
  async register(data: RegisterRequest) {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Generate organization slug
      const baseSlug = data.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (await prisma.organization.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, config.BCRYPT_ROUNDS);

      // Create organization and user in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: data.organizationName,
            slug,
            limits: config.TIER_LIMITS[data.subscriptionPlan || 'STARTER'],
          },
        });

        // Create subscription
        await tx.subscription.create({
          data: {
            organizationId: organization.id,
            plan: data.subscriptionPlan || 'STARTER',
            status: 'TRIAL',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          },
        });

        // Create owner user
        const user = await tx.user.create({
          data: {
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'OWNER',
            organizationId: organization.id,
            emailVerified: false, // Will be verified via email
          },
        });

        return { organization, user };
      });

      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: result.user.id,
        organizationId: result.organization.id,
        email: result.user.email,
        role: result.user.role,
      };

      const tokens = await generateTokenPair(tokenPayload);

      // Create email verification token
      const verificationToken = await this.createVerificationToken(
        result.user.id,
        'EMAIL_VERIFICATION',
        24 * 60 * 60 * 1000 // 24 hours
      );

      // Send welcome email with verification link
      const verificationUrl = `${config.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
      await emailService.sendWelcomeEmail(result.user.email, {
        userName: result.user.firstName,
        organizationName: result.organization.name,
        verificationUrl,
        expiresIn: '24 godziny',
      });

      logger.info(`New organization registered: ${result.organization.name} (${result.organization.slug})`);

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          emailVerified: result.user.emailVerified,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Registration failed:', error);
      throw new AppError('Registration failed', 500, 'REGISTRATION_ERROR');
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest) {
    try {
      // Find user with organization
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: {
          organization: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        role: user.role,
      };

      const tokens = await generateTokenPair(tokenPayload);

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Login failed:', error);
      throw new AppError('Login failed', 500, 'LOGIN_ERROR');
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, data: ChangePasswordRequest) {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(data.newPassword, config.BCRYPT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Invalidate all refresh tokens for security
      await invalidateAllUserTokens(userId);

      logger.info(`Password changed for user: ${user.email}`);

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Password change failed:', error);
      throw new AppError('Password change failed', 500, 'PASSWORD_CHANGE_ERROR');
    }
  }

  /**
   * Invite user to organization
   */
  async inviteUser(organizationId: string, data: InviteUserRequest, invitedBy: string) {
    try {
      // Check if user already exists in this organization
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          organizationId,
        },
      });

      if (existingUser) {
        throw new ConflictError('User already exists in this organization');
      }

      // Check organization user limits
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          users: { where: { isActive: true } },
        },
      });

      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      const limits = organization.limits as any;
      if (limits.max_users && organization.users.length >= limits.max_users) {
        throw new AppError('User limit reached for this organization', 403, 'USER_LIMIT_REACHED');
      }

      // Generate invitation token
      const invitationToken = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store invitation (using a simple approach - in production, consider a separate invitations table)
      // For now, create an inactive user with a special token
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: invitationToken, // Temporary storage for invitation token
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          organizationId,
          isActive: false, // Will be activated when invitation is accepted
          emailVerified: false,
        },
      });

      // Send invitation email
      const invitationUrl = `${config.FRONTEND_URL}/auth/accept-invitation?token=${invitationToken}`;
      await emailService.sendInvitation(data.email, {
        userName: data.firstName,
        organizationName: organization.name,
        invitationUrl,
        expiresIn: '7 dni',
      });

      logger.info(`User invited: ${data.email} to organization ${organizationId}`);

      return {
        message: 'Invitation sent successfully',
        invitationToken, // For development/testing - remove in production
        expiresAt,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('User invitation failed:', error);
      throw new AppError('User invitation failed', 500, 'INVITATION_ERROR');
    }
  }

  /**
   * Accept user invitation
   */
  async acceptInvitation(data: AcceptInvitationRequest) {
    try {
      // Find user by invitation token (stored in passwordHash temporarily)
      const user = await prisma.user.findFirst({
        where: {
          passwordHash: data.token,
          isActive: false,
        },
        include: {
          organization: true,
        },
      });

      if (!user) {
        throw new NotFoundError('Invalid or expired invitation');
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(data.password, config.BCRYPT_ROUNDS);

      // Activate user and set password
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          isActive: true,
          emailVerified: true, // Assuming email is verified through invitation
        },
      });

      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: updatedUser.id,
        organizationId: updatedUser.organizationId,
        email: updatedUser.email,
        role: updatedUser.role,
      };

      const tokens = await generateTokenPair(tokenPayload);

      logger.info(`Invitation accepted: ${updatedUser.email}`);

      return {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          emailVerified: updatedUser.emailVerified,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Invitation acceptance failed:', error);
      throw new AppError('Invitation acceptance failed', 500, 'INVITATION_ACCEPTANCE_ERROR');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          organization: {
            include: {
              subscriptions: {
                where: { status: 'ACTIVE' },
                take: 1,
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          limits: user.organization.limits,
          subscription: user.organization.subscriptions[0] || null,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Get current user failed:', error);
      throw new AppError('Failed to get user profile', 500, 'GET_USER_ERROR');
    }
  }

  // =========================================================================
  // Email Verification
  // =========================================================================

  /**
   * Verify email with token
   */
  async verifyEmail(data: EmailVerificationRequest) {
    try {
      // Find token
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token: data.token },
        include: { user: true },
      });

      if (!verificationToken) {
        throw new NotFoundError('Invalid or expired verification token');
      }

      if (verificationToken.usedAt) {
        throw new AppError('Token has already been used', 400, 'TOKEN_USED');
      }

      if (verificationToken.expiresAt < new Date()) {
        throw new AppError('Token has expired', 400, 'TOKEN_EXPIRED');
      }

      if (verificationToken.type !== 'EMAIL_VERIFICATION') {
        throw new AppError('Invalid token type', 400, 'INVALID_TOKEN_TYPE');
      }

      // Mark email as verified
      await prisma.$transaction([
        prisma.user.update({
          where: { id: verificationToken.userId },
          data: { emailVerified: true },
        }),
        prisma.verificationToken.update({
          where: { id: verificationToken.id },
          data: { usedAt: new Date() },
        }),
      ]);

      logger.info(`Email verified for user: ${verificationToken.user.email}`);

      return { message: 'Email verified successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Email verification failed:', error);
      throw new AppError('Email verification failed', 500, 'VERIFICATION_ERROR');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.emailVerified) {
        throw new AppError('Email is already verified', 400, 'ALREADY_VERIFIED');
      }

      // Invalidate old verification tokens
      await prisma.verificationToken.updateMany({
        where: {
          userId,
          type: 'EMAIL_VERIFICATION',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      // Create new verification token
      const token = await this.createVerificationToken(
        userId,
        'EMAIL_VERIFICATION',
        24 * 60 * 60 * 1000 // 24 hours
      );

      // Send verification email
      const verificationUrl = `${config.FRONTEND_URL}/auth/verify-email?token=${token}`;
      await emailService.sendEmailVerification(user.email, {
        userName: user.firstName,
        verificationUrl,
        expiresIn: '24 godziny',
      });

      logger.info(`Verification email resent to: ${user.email}`);

      return { message: 'Verification email sent' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Resend verification email failed:', error);
      throw new AppError('Failed to resend verification email', 500, 'RESEND_ERROR');
    }
  }

  // =========================================================================
  // Password Reset
  // =========================================================================

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      // Always return success to prevent email enumeration
      if (!user || !user.isActive) {
        logger.info(`Password reset requested for non-existent email: ${data.email}`);
        return { message: 'If the email exists, a reset link has been sent' };
      }

      // Invalidate old reset tokens
      await prisma.verificationToken.updateMany({
        where: {
          userId: user.id,
          type: 'PASSWORD_RESET',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      // Create new reset token
      const token = await this.createVerificationToken(
        user.id,
        'PASSWORD_RESET',
        60 * 60 * 1000 // 1 hour
      );

      // Send password reset email
      const resetUrl = `${config.FRONTEND_URL}/auth/reset-password?token=${token}`;
      await emailService.sendPasswordReset(user.email, {
        userName: user.firstName,
        resetUrl,
        expiresIn: '1 godzinę',
      });

      logger.info(`Password reset email sent to: ${user.email}`);

      return { message: 'If the email exists, a reset link has been sent' };
    } catch (error) {
      logger.error('Password reset request failed:', error);
      // Return success even on error to prevent enumeration
      return { message: 'If the email exists, a reset link has been sent' };
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm) {
    try {
      // Find token
      const resetToken = await prisma.verificationToken.findUnique({
        where: { token: data.token },
        include: { user: true },
      });

      if (!resetToken) {
        throw new NotFoundError('Invalid or expired reset token');
      }

      if (resetToken.usedAt) {
        throw new AppError('Token has already been used', 400, 'TOKEN_USED');
      }

      if (resetToken.expiresAt < new Date()) {
        throw new AppError('Token has expired', 400, 'TOKEN_EXPIRED');
      }

      if (resetToken.type !== 'PASSWORD_RESET') {
        throw new AppError('Invalid token type', 400, 'INVALID_TOKEN_TYPE');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(data.password, config.BCRYPT_ROUNDS);

      // Update password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash },
        }),
        prisma.verificationToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
      ]);

      // Invalidate all refresh tokens
      await invalidateAllUserTokens(resetToken.userId);

      logger.info(`Password reset completed for user: ${resetToken.user.email}`);

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Password reset confirmation failed:', error);
      throw new AppError('Password reset failed', 500, 'RESET_ERROR');
    }
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Create a verification token
   */
  private async createVerificationToken(
    userId: string,
    type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'INVITATION',
    expiresInMs: number
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInMs);

    await prisma.verificationToken.create({
      data: {
        token,
        type,
        userId,
        expiresAt,
      },
    });

    return token;
  }
}
