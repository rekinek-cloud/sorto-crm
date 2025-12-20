import bcrypt from 'bcryptjs';
import { AuthService } from '../service';
import { ConflictError, UnauthorizedError } from '../../../shared/middleware/error';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('../../../shared/utils/jwt');
jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    authService = new AuthService();
    mockPrisma = require('../../../config/database').prisma;
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockRegisterData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      organizationName: 'Test Company',
      acceptTerms: true,
      subscriptionPlan: 'STARTER' as const,
    };

    it('should register new user and organization successfully', async () => {
      // Mock existing user check
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      // Mock password hashing
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      // Mock transaction
      const mockCreatedUser = {
        id: 'user-123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER',
        organizationId: 'org-123',
      };

      const mockCreatedOrg = {
        id: 'org-123',
        name: 'Test Company',
        slug: 'test-company',
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      mockPrisma.organization.create.mockResolvedValue(mockCreatedOrg);
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      // Mock token generation
      const { generateTokenPair } = require('../../../shared/utils/jwt');
      generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: '1h',
      });

      const result = await authService.register(mockRegisterData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('organization');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('john@example.com');
      expect(result.organization.name).toBe('Test Company');
    });

    it('should throw ConflictError when email already exists', async () => {
      // Mock existing user
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'john@example.com',
      });

      await expect(authService.register(mockRegisterData)).rejects.toThrow(ConflictError);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
    });

    it('should handle database transaction errors', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      // Mock transaction failure
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(authService.register(mockRegisterData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    const mockLoginData = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should login user successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        organizationId: 'org-123',
        isActive: true,
        organization: {
          id: 'org-123',
          name: 'Test Company',
          isActive: true,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock token generation
      const { generateTokenPair } = require('../../../shared/utils/jwt');
      generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: '1h',
      });

      const result = await authService.login({ ...mockLoginData, remember: false });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('john@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });

    it('should throw UnauthorizedError for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login({ ...mockLoginData, remember: false })).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        password: 'hashedPassword',
        isActive: true,
        organization: { isActive: true },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({ ...mockLoginData, remember: false })).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for inactive user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        password: 'hashedPassword',
        isActive: false, // Inactive user
        organization: { isActive: true },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.login({ ...mockLoginData, remember: false })).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for inactive organization', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        password: 'hashedPassword',
        isActive: true,
        organization: { isActive: false }, // Inactive organization
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.login({ ...mockLoginData, remember: false })).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('changePassword', () => {
    const mockChangePasswordData = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    };

    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'hashedOldPassword',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, password: 'hashedNewPassword' });

      await authService.changePassword('user-123', mockChangePasswordData);

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', 'hashedOldPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { password: 'hashedNewPassword' },
      });
    });

    it('should throw UnauthorizedError for incorrect current password', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'hashedOldPassword',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.changePassword('user-123', mockChangePasswordData)).rejects.toThrow(UnauthorizedError);
    });
  });

});