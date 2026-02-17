import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import { OrganizationService } from './service';
import { asyncHandler } from '../../shared/middleware/error';

export class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = new OrganizationService();
  }

  /**
   * Get current organization details
   */
  getOrganization = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const organization = await this.organizationService.getOrganization(req.user!.organizationId);
    
    return res.status(200).json({
      message: 'Organization retrieved successfully',
      data: organization,
    });
  });

  /**
   * Update organization
   */
  updateOrganization = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const organization = await this.organizationService.updateOrganization(
      req.user!.organizationId,
      req.body
    );
    
    return res.status(200).json({
      message: 'Organization updated successfully',
      data: organization,
    });
  });

  /**
   * Get organization users
   */
  getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.organizationService.getUsers(
      req.user!.organizationId,
      req.query as any
    );
    
    return res.status(200).json({
      message: 'Users retrieved successfully',
      data: result,
    });
  });

  /**
   * Get specific user
   */
  getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.organizationService.getUser(
      req.user!.organizationId,
      req.params.userId
    );
    
    return res.status(200).json({
      message: 'User retrieved successfully',
      data: user,
    });
  });

  /**
   * Update user
   */
  updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.organizationService.updateUser(
      req.user!.organizationId,
      req.params.userId,
      req.body,
      req.user!.id
    );
    
    return res.status(200).json({
      message: 'User updated successfully',
      data: user,
    });
  });

  /**
   * Deactivate user
   */
  deactivateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.organizationService.deactivateUser(
      req.user!.organizationId,
      req.params.userId,
      req.user!.id
    );
    
    return res.status(200).json({
      message: 'User deactivated successfully',
      data: user,
    });
  });

  /**
   * Get organization statistics
   */
  getStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await this.organizationService.getStatistics(
      req.user!.organizationId,
      req.query as any
    );
    
    return res.status(200).json({
      message: 'Statistics retrieved successfully',
      data: stats,
    });
  });

  /**
   * Update subscription
   */
  updateSubscription = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.organizationService.updateSubscription(
      req.user!.organizationId,
      req.body
    );
    
    return res.status(200).json({
      message: 'Subscription updated successfully',
      data: result,
    });
  });

  /**
   * Bulk user operations
   */
  bulkUserOperation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.organizationService.bulkUserOperation(
      req.user!.organizationId,
      req.body,
      req.user!.id
    );
    
    return res.status(200).json({
      message: 'Bulk operation completed successfully',
      data: result,
    });
  });

  /**
   * Export organization data (placeholder)
   */
  exportData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: Implement data export functionality
    return res.status(200).json({
      message: 'Data export not implemented yet',
    });
  });

  /**
   * Get organization activity log (placeholder)
   */
  getActivityLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: Implement activity logging
    return res.status(200).json({
      message: 'Activity log not implemented yet',
    });
  });
}
