import { Response } from 'express';
import { bugReportsService } from './bug-reports.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import logger from '../../config/logger';

export class BugReportsController {
  /**
   * POST /api/v1/bug-reports
   * Create a new bug report
   */
  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bugReport = await bugReportsService.create(
        req.body,
        req.user!.id,
        req.user!.organizationId
      );

      res.status(201).json({
        message: 'Bug report created successfully',
        data: bugReport,
      });
    } catch (error: any) {
      logger.error('Error creating bug report:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/v1/bug-reports
   * List all bug reports (admin sees all, users see their org's)
   */
  list = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // For now, show all bug reports (for admin review)
      // In production, you might want to filter by organization
      const bugReports = await bugReportsService.findAll();

      res.json({
        message: 'Bug reports retrieved',
        data: bugReports,
      });
    } catch (error: any) {
      logger.error('Error listing bug reports:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/v1/bug-reports/:id
   * Get a specific bug report
   */
  getById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const bugReport = await bugReportsService.findById(id);

      if (!bugReport) {
        res.status(404).json({ error: 'Bug report not found' });
        return;
      }

      res.json({
        message: 'Bug report retrieved',
        data: bugReport,
      });
    } catch (error: any) {
      logger.error('Error getting bug report:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * PATCH /api/v1/bug-reports/:id/status
   * Update bug report status
   */
  updateStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const bugReport = await bugReportsService.updateStatus(
        id,
        status,
        req.user!.id
      );

      res.json({
        message: 'Bug report status updated',
        data: bugReport,
      });
    } catch (error: any) {
      logger.error('Error updating bug report status:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * DELETE /api/v1/bug-reports/:id
   * Delete a bug report
   */
  delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      await bugReportsService.delete(id);

      res.json({
        message: 'Bug report deleted',
      });
    } catch (error: any) {
      logger.error('Error deleting bug report:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/v1/bug-reports/stats/overview
   * Get bug reports statistics
   */
  getStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Show all stats (for admin review)
      const stats = await bugReportsService.getStats();

      res.json({
        message: 'Bug report stats retrieved',
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error getting bug report stats:', error);
      res.status(500).json({ error: error.message });
    }
  };
}
