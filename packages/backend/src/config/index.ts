import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  
  // Database
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  
  // Multi-tenancy
  DEFAULT_ORG_LIMITS: z.string().default('{"max_users": 10, "max_streams": 5}'),
  
  // External Services
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  
  // Fakturownia
  FAKTUROWNIA_DOMAIN: z.string().optional(),
  FAKTUROWNIA_API_TOKEN: z.string().optional(),
  FAKTUROWNIA_ENVIRONMENT: z.enum(['production', 'sandbox']).default('production'),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(Number),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Frontend
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:9025'),
});

// Validate and parse environment variables
const env = envSchema.parse(process.env);

// Configuration object
export const config = {
  // Environment
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  IS_PRODUCTION: env.NODE_ENV === 'production',
  IS_DEVELOPMENT: env.NODE_ENV === 'development',
  IS_TEST: env.NODE_ENV === 'test',
  
  // Database
  DATABASE_URL: env.DATABASE_URL,
  REDIS_URL: env.REDIS_URL,
  
  // JWT
  JWT_SECRET: env.JWT_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  BCRYPT_ROUNDS: env.BCRYPT_ROUNDS,
  
  // Multi-tenancy
  DEFAULT_ORG_LIMITS: JSON.parse(env.DEFAULT_ORG_LIMITS),
  
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 500, // per window per IP (increased)
    MAX_REQUESTS_PER_USER: 2000, // per window per user (increased)
  },
  
  // CORS - allow network access in development
  CORS_ORIGINS: env.NODE_ENV === 'production'
    ? [
        env.NEXT_PUBLIC_APP_URL,
        // Also allow base domain without path
        env.NEXT_PUBLIC_APP_URL?.replace(/\/crm$/, '') || 'http://localhost:3000'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:9025', 
        'http://localhost:9026', 
        'http://localhost:3001',
        'http://91.99.50.80',
        'http://91.99.50.80/crm',
        'http://91.99.50.80:3002',
        // Allow network access in development
        /^http:\/\/192\.168\.\d+\.\d+:3000$/,
        /^http:\/\/192\.168\.\d+\.\d+:902[5-7]$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:902[5-7]$/,
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:3000$/,
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:902[5-7]$/
      ],
  
  // External Services
  STRIPE: {
    SECRET_KEY: env.STRIPE_SECRET_KEY,
    WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
  },
  
  OPENAI: {
    API_KEY: env.OPENAI_API_KEY,
  },
  
  FAKTUROWNIA: {
    DOMAIN: env.FAKTUROWNIA_DOMAIN,
    API_TOKEN: env.FAKTUROWNIA_API_TOKEN,
    ENVIRONMENT: env.FAKTUROWNIA_ENVIRONMENT,
  },
  
  // Email
  EMAIL: {
    HOST: env.SMTP_HOST,
    PORT: env.SMTP_PORT,
    USER: env.SMTP_USER,
    PASS: env.SMTP_PASS,
  },
  
  // Storage
  AWS: {
    ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
    BUCKET_NAME: env.AWS_BUCKET_NAME,
    REGION: env.AWS_REGION,
  },
  
  // Monitoring
  SENTRY_DSN: env.SENTRY_DSN,
  LOG_LEVEL: env.LOG_LEVEL,
  
  // Frontend
  FRONTEND_URL: env.NEXT_PUBLIC_APP_URL,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File uploads
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // Task limits per tier
  TIER_LIMITS: {
    STARTER: {
      max_users: 5,
      max_streams: 3,
      max_tasks_per_user: 100,
      max_projects: 10,
      max_storage_mb: 100,
    },
    PROFESSIONAL: {
      max_users: 25,
      max_streams: 15,
      max_tasks_per_user: 1000,
      max_projects: 100,
      max_storage_mb: 1000,
    },
    ENTERPRISE: {
      max_users: -1, // unlimited
      max_streams: -1,
      max_tasks_per_user: -1,
      max_projects: -1,
      max_storage_mb: 10000,
    },
  },
} as const;

export default config;