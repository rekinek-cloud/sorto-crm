/**
 * Admin API Keys Routes
 * Routing dla zarządzania kluczami API (tylko admin)
 */

import { Router } from 'express';
import { apiKeysController } from './api-keys.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

const router = Router();

// Wszystkie endpointy wymagają autentykacji i roli ADMIN/OWNER
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'OWNER']));

// CRUD kluczy
router.post('/', (req, res) => apiKeysController.createKey(req, res));
router.get('/', (req, res) => apiKeysController.listKeys(req, res));
router.get('/:id', (req, res) => apiKeysController.getKey(req, res));
router.patch('/:id', (req, res) => apiKeysController.updateKey(req, res));
router.delete('/:id', (req, res) => apiKeysController.deleteKey(req, res));

// Akcje
router.post('/:id/revoke', (req, res) => apiKeysController.revokeKey(req, res));

// Statystyki
router.get('/:id/usage', (req, res) => apiKeysController.getKeyUsage(req, res));

export default router;
