/**
 * API Keys Admin Controller
 * Endpointy zarządzania kluczami API (tylko admin)
 */

import { Request, Response } from 'express';
import { apiKeysService } from './api-keys.service';
import logger from '../../config/logger';

// Extend Request to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    firstName: string;
    lastName: string;
  };
}

export class ApiKeysController {
  /**
   * POST /admin/mcp/api-keys
   * Generuj nowy klucz API
   */
  async createKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { organizationId, name } = req.body;

      // Użyj organizationId z body lub z zalogowanego usera
      const targetOrgId = organizationId || req.user?.organizationId;

      if (!targetOrgId) {
        res.status(400).json({
          error: 'Brak organizationId',
          code: 'MISSING_ORG_ID',
        });
        return;
      }

      const result = await apiKeysService.createKey(
        targetOrgId,
        req.user!.id,
        name
      );

      logger.info(`[ApiKeysController] Created key for org: ${targetOrgId}`);

      res.status(201).json({
        message: 'Klucz API został utworzony. Zapisz go - nie będzie można go ponownie wyświetlić!',
        key: result.key,
        keyPrefix: result.keyPrefix,
        id: result.id,
      });
    } catch (error) {
      logger.error('[ApiKeysController] createKey error:', error);
      res.status(500).json({
        error: 'Błąd tworzenia klucza',
        code: 'CREATE_KEY_ERROR',
      });
    }
  }

  /**
   * GET /admin/mcp/api-keys
   * Lista kluczy organizacji
   */
  async listKeys(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = (req.query.organizationId as string) || req.user?.organizationId;

      if (!organizationId) {
        res.status(400).json({
          error: 'Brak organizationId',
          code: 'MISSING_ORG_ID',
        });
        return;
      }

      const keys = await apiKeysService.listKeys(organizationId);

      res.json({ keys });
    } catch (error) {
      logger.error('[ApiKeysController] listKeys error:', error);
      res.status(500).json({
        error: 'Błąd pobierania kluczy',
        code: 'LIST_KEYS_ERROR',
      });
    }
  }

  /**
   * GET /admin/mcp/api-keys/:id
   * Szczegóły klucza
   */
  async getKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const key = await apiKeysService.getKey(id);

      if (!key) {
        res.status(404).json({
          error: 'Klucz nie znaleziony',
          code: 'KEY_NOT_FOUND',
        });
        return;
      }

      const stats = await apiKeysService.getKeyUsageStats(id);

      res.json({ key, stats });
    } catch (error) {
      logger.error('[ApiKeysController] getKey error:', error);
      res.status(500).json({
        error: 'Błąd pobierania klucza',
        code: 'GET_KEY_ERROR',
      });
    }
  }

  /**
   * DELETE /admin/mcp/api-keys/:id
   * Usuń klucz
   */
  async deleteKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await apiKeysService.deleteKey(id);

      res.json({ message: 'Klucz został usunięty' });
    } catch (error) {
      logger.error('[ApiKeysController] deleteKey error:', error);
      res.status(500).json({
        error: 'Błąd usuwania klucza',
        code: 'DELETE_KEY_ERROR',
      });
    }
  }

  /**
   * POST /admin/mcp/api-keys/:id/revoke
   * Dezaktywuj klucz
   */
  async revokeKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await apiKeysService.revokeKey(id);

      res.json({ message: 'Klucz został dezaktywowany' });
    } catch (error) {
      logger.error('[ApiKeysController] revokeKey error:', error);
      res.status(500).json({
        error: 'Błąd dezaktywacji klucza',
        code: 'REVOKE_KEY_ERROR',
      });
    }
  }

  /**
   * PATCH /admin/mcp/api-keys/:id
   * Aktualizuj klucz
   */
  async updateKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (name) {
        await apiKeysService.updateKeyName(id, name);
      }

      const key = await apiKeysService.getKey(id);

      res.json({ key });
    } catch (error) {
      logger.error('[ApiKeysController] updateKey error:', error);
      res.status(500).json({
        error: 'Błąd aktualizacji klucza',
        code: 'UPDATE_KEY_ERROR',
      });
    }
  }

  /**
   * GET /admin/mcp/api-keys/:id/usage
   * Historia użycia klucza
   */
  async getKeyUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await apiKeysService.getKeyUsageHistory(id, limit);
      const stats = await apiKeysService.getKeyUsageStats(id);

      res.json({ stats, history });
    } catch (error) {
      logger.error('[ApiKeysController] getKeyUsage error:', error);
      res.status(500).json({
        error: 'Błąd pobierania historii',
        code: 'GET_USAGE_ERROR',
      });
    }
  }
}

export const apiKeysController = new ApiKeysController();
