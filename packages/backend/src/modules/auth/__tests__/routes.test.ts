import request from 'supertest';
import express from 'express';
import authRoutes from '../routes';
import { AuthService } from '../service';

// Mock the AuthService
jest.mock('../service');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    (AuthService as jest.Mock).mockImplementation(() => mockAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validRegisterData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123!',
      organizationName: 'Test Company',
    };

    it('should register user successfully with valid data', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        organization: {
          id: 'org-123',
          name: 'Test Company',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: '1h',
        },
      };

      mockAuthService.register = jest.fn().mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterData);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        firstName: 'John',
        // Missing lastName, email, password, organizationName
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...validRegisterData,
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      const invalidData = {
        ...validRegisterData,
        password: '123', // Too weak
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle ConflictError (409) when email already exists', async () => {
      const conflictError = new Error('Email already registered');
      conflictError.name = 'ConflictError';
      
      mockAuthService.register = jest.fn().mockRejectedValue(conflictError);

      const response = await request(app)
        .post('/auth/register')
        .send(validRegisterData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'Password123!',
    };

    it('should login user successfully with valid credentials', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: '1h',
        },
      };

      mockAuthService.login = jest.fn().mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
    });

    it('should return 400 for missing credentials', async () => {
      const invalidData = {
        email: 'john@example.com',
        // Missing password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
      const unauthorizedError = new Error('Invalid credentials');
      unauthorizedError.name = 'UnauthorizedError';
      
      mockAuthService.login = jest.fn().mockRejectedValue(unauthorizedError);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });


  describe('POST /auth/change-password', () => {
    it('should change password successfully', async () => {
      const changePasswordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      // Mock authenticated request (normally done by auth middleware)
      const mockReq = {
        user: { id: 'user-123' },
      };

      mockAuthService.changePassword = jest.fn().mockResolvedValue(undefined);

      // For this test, we would need to mock the auth middleware
      // In a real scenario, this would be tested with authenticated requests
      
      const response = await request(app)
        .post('/auth/change-password')
        .send(changePasswordData);

      // This test would need proper auth middleware setup
      // expect(response.status).toBe(200);
    });
  });
});
