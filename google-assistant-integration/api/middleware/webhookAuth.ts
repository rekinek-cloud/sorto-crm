import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createLogger } from '../services/logger';

const logger = createLogger();

/**
 * Middleware do weryfikacji podpisów webhook Google Assistant
 */
export const verifyWebhookSignature = (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['google-assistant-signature'] as string;
    const timestamp = req.headers['google-assistant-timestamp'] as string;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('WEBHOOK_SECRET not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Webhook verification not properly configured'
      });
    }

    // Sprawdzenie autoryzacji Bearer token jako alternatywa
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token === webhookSecret) {
        return next();
      }
    }

    // Sprawdzenie prostego webhook secret w nagłówku
    const simpleSecret = req.headers['x-webhook-secret'];
    if (simpleSecret === webhookSecret) {
      return next();
    }

    // Weryfikacja podpisu Google (jeśli dostępny)
    if (signature && timestamp) {
      const isValid = verifyGoogleWebhookSignature(
        JSON.stringify(req.body),
        signature,
        timestamp,
        webhookSecret
      );

      if (isValid) {
        return next();
      }
    }

    // Weryfikacja IP Google (dodatkowa warstwa bezpieczeństwa)
    if (isGoogleIP(req.ip)) {
      logger.info('Request from Google IP range, allowing with warning', { ip: req.ip });
      return next();
    }

    logger.warn('Webhook signature verification failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      hasAuth: !!authHeader,
      hasSecret: !!simpleSecret
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid webhook signature'
    });

  } catch (error) {
    logger.error('Error in webhook signature verification:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Webhook verification failed'
    });
  }
};

/**
 * Weryfikacja podpisu webhook Google Assistant
 */
function verifyGoogleWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  try {
    // Sprawdzenie czy timestamp nie jest zbyt stary (max 5 minut)
    const timestampNum = parseInt(timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime - timestampNum > 300) { // 5 minut
      logger.warn('Webhook timestamp too old', { timestamp, currentTime });
      return false;
    }

    // Utworzenie podpisu do porównania
    const signaturePayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signaturePayload, 'utf8')
      .digest('hex');

    const expectedSignatureWithPrefix = `sha256=${expectedSignature}`;

    // Bezpieczne porównanie podpisów
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignatureWithPrefix, 'utf8')
    );

  } catch (error) {
    logger.error('Error verifying Google webhook signature:', error);
    return false;
  }
}

/**
 * Sprawdzenie czy IP pochodzi z zakresu Google
 */
function isGoogleIP(ip: string): boolean {
  // Lista znanych zakresów IP Google
  const googleIPRanges = [
    '8.8.8.0/24',
    '8.8.4.0/24',
    '64.233.160.0/19',
    '66.102.0.0/20',
    '66.249.80.0/20',
    '72.14.192.0/18',
    '74.125.0.0/16',
    '108.177.8.0/21',
    '173.194.0.0/16',
    '209.85.128.0/17',
    '216.58.192.0/19',
    '216.239.32.0/19'
  ];

  // Prosty check - w produkcji należy użyć bardziej zaawansowanej biblioteki
  for (const range of googleIPRanges) {
    if (ip.startsWith(range.split('.')[0] + '.' + range.split('.')[1])) {
      return true;
    }
  }

  return false;
}

/**
 * Middleware do walidacji struktury webhook payload
 */
export const validateWebhookPayload = (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;

    // Podstawowa walidacja struktury
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Webhook payload must be a valid JSON object'
      });
    }

    // Walidacja wymaganych pól dla Google Assistant webhook
    if (payload.intent && payload.session) {
      // Walidacja pól intent
      if (!payload.intent.name) {
        return res.status(400).json({
          error: 'Invalid intent',
          message: 'Intent name is required'
        });
      }

      // Walidacja pól session
      if (!payload.session.id) {
        return res.status(400).json({
          error: 'Invalid session',
          message: 'Session ID is required'
        });
      }

      // Dodanie metadanych o webhook
      req.body._webhook_metadata = {
        receivedAt: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      return next();
    }

    // Dla innych typów webhook (np. testowe)
    if (payload.test || payload.type === 'test') {
      return next();
    }

    return res.status(400).json({
      error: 'Invalid webhook payload',
      message: 'Payload does not match expected webhook structure'
    });

  } catch (error) {
    logger.error('Error validating webhook payload:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Payload validation failed'
    });
  }
};

/**
 * Middleware do ograniczania częstotliwości webhook
 */
export const webhookRateLimit = (maxRequests: number = 120, windowMs: number = 60000) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip; // Można użyć session.id jeśli dostępny
    const now = Date.now();

    let requests = requestCounts.get(identifier);

    if (!requests || now > requests.resetTime) {
      requests = {
        count: 1,
        resetTime: now + windowMs
      };
      requestCounts.set(identifier, requests);
    } else {
      requests.count++;
    }

    if (requests.count > maxRequests) {
      logger.warn('Webhook rate limit exceeded', {
        ip: req.ip,
        count: requests.count,
        maxRequests
      });

      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many webhook requests. Max ${maxRequests} per ${windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((requests.resetTime - now) / 1000)
      });
    }

    next();
  };
};

/**
 * Middleware do logowania wszystkich webhook
 */
export const webhookLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log żądania
  logger.info('Webhook request received', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    intent: req.body?.intent?.name,
    sessionId: req.body?.session?.id
  });

  // Dodanie listenera do response
  res.on('finish', () => {
    const processingTime = Date.now() - startTime;
    
    logger.info('Webhook response sent', {
      statusCode: res.statusCode,
      processingTime,
      intent: req.body?.intent?.name,
      sessionId: req.body?.session?.id
    });
  });

  next();
};

/**
 * Generowanie bezpiecznego webhook secret
 */
export const generateWebhookSecret = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Walidacja konfiguracji webhook
 */
export const validateWebhookConfig = () => {
  const requiredEnvVars = [
    'WEBHOOK_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.WEBHOOK_SECRET && process.env.WEBHOOK_SECRET.length < 32) {
    logger.warn('WEBHOOK_SECRET is shorter than recommended 32 characters');
  }
};