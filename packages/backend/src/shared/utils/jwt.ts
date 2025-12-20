import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import { prisma } from '../../config/database';
import logger from '../../config/logger';

export interface TokenPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
    issuer: 'crm-gtd-saas',
    audience: 'crm-gtd-app',
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (): string => {
  return uuidv4();
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = async (payload: TokenPayload): Promise<TokenPair> => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  try {
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.JWT_EXPIRES_IN,
    };
  } catch (error) {
    logger.error('Failed to store refresh token:', error);
    throw new Error('Token generation failed');
  }
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'crm-gtd-saas',
      audience: 'crm-gtd-app',
    }) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Verify and consume refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<TokenPayload> => {
  try {
    // Find refresh token in database
    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!refreshTokenRecord) {
      throw new Error('Invalid refresh token');
    }

    // Check if token is expired
    if (refreshTokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.delete({
        where: { id: refreshTokenRecord.id },
      });
      throw new Error('Refresh token expired');
    }

    // Check if user is still active
    if (!refreshTokenRecord.user.isActive) {
      throw new Error('User account is inactive');
    }

    // Return user payload for new token generation
    return {
      userId: refreshTokenRecord.user.id,
      organizationId: refreshTokenRecord.user.organizationId,
      email: refreshTokenRecord.user.email,
      role: refreshTokenRecord.user.role,
    };
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    throw error;
  }
};

/**
 * Invalidate refresh token
 */
export const invalidateRefreshToken = async (token: string): Promise<void> => {
  try {
    await prisma.refreshToken.delete({
      where: { token },
    });
  } catch (error) {
    logger.error('Failed to invalidate refresh token:', error);
    // Don't throw error if token doesn't exist
  }
};

/**
 * Invalidate all refresh tokens for a user
 */
export const invalidateAllRefreshTokens = async (userId: string): Promise<void> => {
  try {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
    logger.info(`Invalidated all refresh tokens for user: ${userId}`);
  } catch (error) {
    logger.error('Failed to invalidate all refresh tokens:', error);
    throw error;
  }
};

// Alias for better API
export const invalidateAllUserTokens = invalidateAllRefreshTokens;

/**
 * Clean up expired refresh tokens (run periodically)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    logger.info(`Cleaned up ${result.count} expired refresh tokens`);
    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup expired tokens:', error);
    return 0;
  }
};

/**
 * Get token expiration info
 */
export const getTokenInfo = (token: string): { 
  payload: TokenPayload; 
  expiresAt: Date; 
  isExpired: boolean;
} => {
  try {
    const decoded = jwt.decode(token, { complete: true }) as any;
    
    if (!decoded || !decoded.payload) {
      throw new Error('Invalid token format');
    }

    const expiresAt = new Date(decoded.payload.exp * 1000);
    const isExpired = expiresAt < new Date();

    return {
      payload: decoded.payload,
      expiresAt,
      isExpired,
    };
  } catch (error) {
    throw new Error('Failed to decode token');
  }
};