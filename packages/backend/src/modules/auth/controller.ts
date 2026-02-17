import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import { AuthService } from './service';
import { asyncHandler } from '../../shared/middleware/error';
import { verifyRefreshToken, generateTokenPair, invalidateRefreshToken } from '../../shared/utils/jwt';
import logger from '../../config/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register new organization and user
   */
  register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.authService.register(req.body);
    
    return res.status(201).json({
      message: 'Registration successful',
      data: result,
    });
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.authService.login(req.body);
    
    return res.status(200).json({
      message: 'Login successful',
      data: result,
    });
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = req.body;

    // Verify refresh token and get user payload
    const payload = await verifyRefreshToken(refreshToken);

    // Generate new token pair
    const tokens = await generateTokenPair(payload);

    // Invalidate old refresh token for security
    await invalidateRefreshToken(refreshToken);

    return res.status(200).json({
      message: 'Token refreshed successfully',
      data: { tokens },
    });
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await invalidateRefreshToken(refreshToken);
    }

    logger.info(`User logged out: ${req.user?.email}`);

    return res.status(200).json({
      message: 'Logout successful',
    });
  });

  /**
   * Get current user profile
   */
  me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.authService.getCurrentUser(req.user!.id);
    
    return res.status(200).json({
      message: 'User profile retrieved successfully',
      data: user,
    });
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.authService.changePassword(req.user!.id, req.body);
    
    return res.status(200).json(result);
  });

  /**
   * Invite user to organization
   */
  inviteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.authService.inviteUser(
      req.user!.organizationId,
      req.body,
      req.user!.id
    );
    
    return res.status(201).json({
      message: 'User invited successfully',
      data: result,
    });
  });

  /**
   * Accept invitation
   */
  acceptInvitation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.authService.acceptInvitation(req.body);
    
    return res.status(200).json({
      message: 'Invitation accepted successfully',
      data: result,
    });
  });

  /**
   * Verify email with token
   */
  verifyEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.authService.verifyEmail(req.body);

    return res.status(200).json({
      message: result.message,
    });
  });

  /**
   * Resend verification email
   */
  resendVerification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.authService.resendVerificationEmail(req.user!.id);

    return res.status(200).json({
      message: result.message,
    });
  });

  /**
   * Request password reset
   */
  requestPasswordReset = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.authService.requestPasswordReset(req.body);

    return res.status(200).json({
      message: result.message,
    });
  });

  /**
   * Confirm password reset with token
   */
  confirmPasswordReset = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.authService.confirmPasswordReset(req.body);

    return res.status(200).json({
      message: result.message,
    });
  });
}
