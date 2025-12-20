import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { GoogleAuthService } from '../services/googleAuthService';
import { createLogger } from '../services/logger';

const logger = createLogger();
const googleAuth = new GoogleAuthService();

// Rozszerzenie typu Request o user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        googleAccountId?: string;
      };
    }
  }
}

/**
 * Middleware do weryfikacji autoryzacji JWT
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Sprawdzenie czy użytkownik ma aktywną autoryzację Google
      const isAuthorized = await googleAuth.isUserAuthorized(decoded.userId);
      
      if (!isAuthorized) {
        return res.status(401).json({
          error: 'Google authorization required',
          message: 'User needs to authorize Google Assistant integration'
        });
      }

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        googleAccountId: decoded.googleAccountId
      };

      next();

    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

  } catch (error) {
    logger.error('Error in auth middleware:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication check failed'
    });
  }
};

/**
 * Middleware do weryfikacji tokenów webhook Google Assistant
 */
export const webhookAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const webhookSecret = req.headers['x-webhook-secret'];
    
    // Sprawdzenie autoryzacji Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verification = googleAuth.verifyWebhookToken(token);
      
      if (verification.valid) {
        req.user = verification.payload;
        return next();
      }
    }
    
    // Sprawdzenie webhook secret
    if (webhookSecret === process.env.WEBHOOK_SECRET) {
      return next();
    }
    
    // Sprawdzenie Google Assistant signature (jeśli jest zaimplementowana)
    const googleSignature = req.headers['google-assistant-signature'];
    if (googleSignature && verifyGoogleSignature(req, googleSignature as string)) {
      return next();
    }

    logger.warn('Unauthorized webhook request', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      headers: req.headers
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid webhook authorization'
    });

  } catch (error) {
    logger.error('Error in webhook auth middleware:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Webhook authentication failed'
    });
  }
};

/**
 * Middleware opcjonalnej autoryzacji (nie wymaga logowania)
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        const isAuthorized = await googleAuth.isUserAuthorized(decoded.userId);
        
        if (isAuthorized) {
          req.user = {
            id: decoded.userId,
            email: decoded.email,
            googleAccountId: decoded.googleAccountId
          };
        }
      } catch (jwtError) {
        // Ignoruj błędy JWT w przypadku opcjonalnej autoryzacji
        logger.debug('Optional auth failed:', jwtError);
      }
    }

    next();

  } catch (error) {
    logger.error('Error in optional auth middleware:', error);
    next(); // Kontynuuj nawet w przypadku błędu
  }
};

/**
 * Middleware do sprawdzania uprawnień administratora
 */
export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Sprawdzenie uprawnień administratora w bazie danych
    // TODO: Implementacja sprawdzania ról użytkownika
    
    next();

  } catch (error) {
    logger.error('Error in admin auth middleware:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Admin authorization check failed'
    });
  }
};

/**
 * Middleware do ograniczania częstotliwości żądań per użytkownik
 */
export const userRateLimitMiddleware = (maxRequests: number = 60, windowMs: number = 60000) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    let userRequests = requestCounts.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      userRequests = {
        count: 1,
        resetTime: now + windowMs
      };
      requestCounts.set(userId, userRequests);
    } else {
      userRequests.count++;
    }

    if (userRequests.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }

    next();
  };
};

/**
 * Weryfikacja podpisu Google Assistant (placeholder)
 */
function verifyGoogleSignature(req: Request, signature: string): boolean {
  // TODO: Implementacja weryfikacji podpisu Google Assistant
  // Wymagana implementacja zgodnie z dokumentacją Google
  
  // Tymczasowo zwracamy false, aby wymusić użycie innych metod autoryzacji
  return false;
}

/**
 * Generowanie JWT token dla użytkownika
 */
export const generateUserToken = (user: { id: string; email?: string; googleAccountId?: string }): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      googleAccountId: user.googleAccountId
    },
    process.env.JWT_SECRET || 'fallback-secret',
    {
      expiresIn: '7d' // Token ważny przez 7 dni
    }
  );
};

/**
 * Middleware do logowania żądań autoryzowanych
 */
export const authLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    logger.info('Authorized request', {
      userId: req.user.id,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  
  next();
};