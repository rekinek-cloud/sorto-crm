import { Request, Response, NextFunction } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../auth';
import { generateAccessToken } from '../../utils/jwt';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../../config', () => ({
  JWT_SECRET: 'test-secret-key',
  JWT_EXPIRES_IN: '1h',
}));

jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 when no token provided', async () => {
      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access token required',
        code: 'MISSING_TOKEN',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token format is invalid', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is malformed', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authenticate valid token and call next', async () => {
      const mockPayload = {
        userId: 'user-123',
        organizationId: 'org-456',
        email: 'test@example.com',
        role: 'USER',
      };

      const token = generateAccessToken(mockPayload);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Mock database responses
      const { prisma } = require('../../../config/database');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        organizationId: 'org-456',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        organization: {
          id: 'org-456',
          name: 'Test Organization',
          slug: 'test-org',
          limits: { maxUsers: 10 },
          isActive: true,
        },
      });

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe('user-123');
      expect(mockRequest.organization).toBeDefined();
      expect(mockRequest.organization?.id).toBe('org-456');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      const mockPayload = {
        userId: 'user-123',
        organizationId: 'org-456',
        email: 'test@example.com',
        role: 'USER',
      };

      const token = generateAccessToken(mockPayload);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Mock user not found
      const { prisma } = require('../../../config/database');
      prisma.user.findUnique.mockResolvedValue(null);

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is inactive', async () => {
      const mockPayload = {
        userId: 'user-123',
        organizationId: 'org-456',
        email: 'test@example.com',
        role: 'USER',
      };

      const token = generateAccessToken(mockPayload);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Mock inactive user - middleware sprawdza isActive: true więc null jest zwracany 
      const { prisma } = require('../../../config/database');
      prisma.user.findUnique.mockResolvedValue(null);

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockPayload = {
        userId: 'user-123',
        organizationId: 'org-456',
        email: 'test@example.com',
        role: 'USER',
      };

      const token = generateAccessToken(mockPayload);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Mock database error
      const { prisma } = require('../../../config/database');
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});