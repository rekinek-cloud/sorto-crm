import rateLimit from 'express-rate-limit';
import config from '../../config';
import logger from '../../config/logger';
import { AuthenticatedRequest } from './auth';

/**
 * In-memory rate limiting store (no Redis dependency)
 * Uses a simple Map with automatic cleanup
 */
class MemoryStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  public prefix: string;
  private windowMs: number;

  constructor(prefix: string = 'rl:', windowMs: number = 60000) {
    this.prefix = prefix;
    this.windowMs = windowMs;
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const storeKey = `${this.prefix}${key}`;
    const now = Date.now();

    try {
      let entry = this.store.get(storeKey);

      if (!entry || now > entry.resetTime) {
        // Create new entry or reset expired entry
        entry = { count: 1, resetTime: now + this.windowMs };
        this.store.set(storeKey, entry);
      } else {
        // Increment existing entry
        entry.count++;
      }

      return {
        totalHits: entry.count,
        resetTime: new Date(entry.resetTime),
      };
    } catch (error) {
      logger.error('Memory rate limit error:', error);
      return { totalHits: 1, resetTime: new Date(now + this.windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    const storeKey = `${this.prefix}${key}`;
    const entry = this.store.get(storeKey);
    if (entry && entry.count > 0) {
      entry.count--;
    }
  }

  async resetKey(key: string): Promise<void> {
    const storeKey = `${this.prefix}${key}`;
    this.store.delete(storeKey);
  }
}

/**
 * General rate limiter (by IP)
 */
export const generalRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For header for proxy scenarios
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.ip;
    return `ip:${ip}`;
  },
  store: new MemoryStore('rl:ip:', config.RATE_LIMIT.WINDOW_MS),
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: config.RATE_LIMIT.WINDOW_MS,
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Authenticated user rate limiter (higher limits)
 */
export const userRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS_PER_USER,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthenticatedRequest) => {
    // Use user ID if authenticated, fallback to IP
    if (req.user) {
      return `user:${req.user.id}`;
    }
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.ip;
    return `ip:${ip}`;
  },
  store: new MemoryStore('rl:user:', config.RATE_LIMIT.WINDOW_MS),
  message: {
    error: 'Too many requests from this user',
    code: 'USER_RATE_LIMIT_EXCEEDED',
    retryAfter: config.RATE_LIMIT.WINDOW_MS,
  },
  handler: (req: AuthenticatedRequest, res, next, options) => {
    const identifier = req.user ? req.user.id : req.ip;
    logger.warn(`User rate limit exceeded for: ${identifier}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * API endpoint rate limiter
 */
export const apiRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: (req: AuthenticatedRequest) => {
    // Higher limits for authenticated users
    return req.user ? config.RATE_LIMIT.MAX_REQUESTS_PER_USER : config.RATE_LIMIT.MAX_REQUESTS;
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthenticatedRequest) => {
    if (req.user) {
      return `api:user:${req.user.id}`;
    }
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.ip;
    return `api:ip:${ip}`;
  },
  store: new MemoryStore('rl:api:', config.RATE_LIMIT.WINDOW_MS),
  message: {
    error: 'API rate limit exceeded',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: config.RATE_LIMIT.WINDOW_MS,
  },
});

/**
 * Strict rate limiter for sensitive endpoints (auth, etc.)
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Very low limit
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.ip;
    return `strict:${ip}`;
  },
  store: new MemoryStore('rl:strict:', 15 * 60 * 1000),
  message: {
    error: 'Too many attempts. Please try again later.',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60 * 1000,
  },
  handler: (req, res, next, options) => {
    logger.warn(`Strict rate limit exceeded for IP: ${req.ip}, endpoint: ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Organization-based rate limiter
 */
export const organizationRateLimit = (maxRequests: number = 1000) => {
  return rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: AuthenticatedRequest) => {
      if (req.organization) {
        return `org:${req.organization.id}`;
      }
      // Fallback to user or IP if no organization
      if (req.user) {
        return `user:${req.user.id}`;
      }
      const forwarded = req.headers['x-forwarded-for'] as string;
      const ip = forwarded ? forwarded.split(',')[0] : req.ip;
      return `ip:${ip}`;
    },
    store: new MemoryStore('rl:org:', config.RATE_LIMIT.WINDOW_MS),
    message: {
      error: 'Organization rate limit exceeded',
      code: 'ORG_RATE_LIMIT_EXCEEDED',
      retryAfter: config.RATE_LIMIT.WINDOW_MS,
    },
  });
};
