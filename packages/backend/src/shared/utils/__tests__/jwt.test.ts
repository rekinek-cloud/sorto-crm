import jwt from 'jsonwebtoken';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken,
  getTokenInfo,
  TokenPayload 
} from '../jwt';

// Mock config
jest.mock('../../../config', () => ({
  JWT_SECRET: 'test-secret-key',
  JWT_EXPIRES_IN: '1h',
}));

// Mock logger
jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe('JWT Utils', () => {
  const mockPayload: TokenPayload = {
    userId: 'user-123',
    organizationId: 'org-456',
    email: 'test@example.com',
    role: 'USER',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(mockPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.verify(token, 'test-secret-key') as TokenPayload;
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.organizationId).toBe(mockPayload.organizationId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should set correct issuer and audience', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.verify(token, 'test-secret-key') as any;
      
      expect(decoded.iss).toBe('crm-gtd-saas');
      expect(decoded.aud).toBe('crm-gtd-app');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a UUID string', () => {
      const token = generateRefreshToken();
      
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token and return payload', () => {
      const token = generateAccessToken(mockPayload);
      const verified = verifyAccessToken(token);
      
      expect(verified.userId).toBe(mockPayload.userId);
      expect(verified.organizationId).toBe(mockPayload.organizationId);
      expect(verified.email).toBe(mockPayload.email);
      expect(verified.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.here');
      }).toThrow('Invalid token');
    });

    it('should throw error for expired token', (done) => {
      // Create a token with immediate expiration
      const expiredToken = jwt.sign(mockPayload, 'test-secret-key', { 
        expiresIn: '1ms',
        issuer: 'crm-gtd-saas',
        audience: 'crm-gtd-app',
      });
      
      // Wait a moment to ensure expiration
      setTimeout(() => {
        try {
          expect(() => {
            verifyAccessToken(expiredToken);
          }).toThrow('Token expired');
          done();
        } catch (error) {
          done(error);
        }
      }, 10);
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        verifyAccessToken('not.a.token');
      }).toThrow('Invalid token');
    });
  });

  describe('getTokenInfo', () => {
    it('should decode token and return info', () => {
      const token = generateAccessToken(mockPayload);
      const info = getTokenInfo(token);
      
      expect(info.payload.userId).toBe(mockPayload.userId);
      expect(info.expiresAt).toBeInstanceOf(Date);
      expect(typeof info.isExpired).toBe('boolean');
    });

    it('should correctly identify non-expired token', () => {
      const token = generateAccessToken(mockPayload);
      const info = getTokenInfo(token);
      
      expect(info.isExpired).toBe(false);
      expect(info.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should throw error for invalid token format', () => {
      expect(() => {
        getTokenInfo('invalid-token');
      }).toThrow('Failed to decode token');
    });
  });
});