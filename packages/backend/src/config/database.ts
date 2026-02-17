import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import logger from './logger';

// Prisma Client with logging
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Enhanced Prisma client with multi-tenancy support
export class TenantPrismaClient {
  private client: PrismaClient;
  private organizationId: string;

  constructor(organizationId: string) {
    this.client = prisma;
    this.organizationId = organizationId;
  }

  async $executeRaw(query: any, ...values: any[]) {
    // Set organization context before executing raw queries
    await this.client.$executeRaw`SELECT set_config('app.current_org_id', ${this.organizationId}, true)`;
    return this.client.$executeRaw(query, ...values);
  }

  async $queryRaw(query: any, ...values: any[]) {
    // Set organization context before executing raw queries
    await this.client.$executeRaw`SELECT set_config('app.current_org_id', ${this.organizationId}, true)`;
    return this.client.$queryRaw(query, ...values);
  }

  // Proxy all other methods to the underlying client
  get organization() {
    return this.client.organization;
  }

  get user() {
    return this.client.user;
  }

  get task() {
    return this.client.task;
  }

  get project() {
    return this.client.project;
  }

  get stream() {
    return this.client.stream;
  }

  get contact() {
    return this.client.contact;
  }

  get company() {
    return this.client.company;
  }

  get deal() {
    return this.client.deal;
  }

  get context() {
    return this.client.context;
  }

  get meeting() {
    return this.client.meeting;
  }

  get subscription() {
    return this.client.subscription;
  }

  get refreshToken() {
    return this.client.refreshToken;
  }

  async $transaction(fn: any) {
    return this.client.$transaction(async (tx) => {
      // Set organization context in transaction
      await tx.$executeRaw`SELECT set_config('app.current_org_id', ${this.organizationId}, true)`;
      return fn(tx);
    });
  }

  async $disconnect() {
    return this.client.$disconnect();
  }
}

// Redis Client (optional - not required for basic operation)
export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Flag to track Redis connection status
let redisConnected = false;

export const isRedisConnected = (): boolean => redisConnected;

// Database connection handlers
export const connectDatabases = async (): Promise<void> => {
  try {
    // Connect to PostgreSQL
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

    // Try to connect to Redis (optional - app works without it)
    try {
      await redis.connect();
      redisConnected = true;
      logger.info('Connected to Redis');
    } catch (redisError) {
      redisConnected = false;
      logger.warn('Redis connection failed - running without Redis (rate limiting will use memory store):', redisError);
    }

    // Setup Prisma logging
    prisma.$on('query', (e) => {
      if (process.env.LOG_LEVEL === 'debug') {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Params: ${e.params}`);
        logger.debug(`Duration: ${e.duration}ms`);
      }
    });

    prisma.$on('error', (e) => {
      logger.error('Prisma error:', e);
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabases = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    if (redisConnected) {
      await redis.disconnect();
    }
    logger.info('Disconnected from databases');
  } catch (error) {
    logger.error('Error disconnecting from databases:', error);
  }
};

// Helper function to get tenant-specific Prisma client
export const getTenantPrisma = (organizationId: string): TenantPrismaClient => {
  return new TenantPrismaClient(organizationId);
};

// Row Level Security setup (run after Prisma migrations)
export const setupRowLevelSecurity = async (): Promise<void> => {
  try {
    logger.info('Setting up Row Level Security policies...');

    // Enable RLS on all tenant-specific tables
    const tables = [
      'users', 'tasks', 'projects', 'streams',
      'contacts', 'meetings', 'subscriptions',
      'companies', 'deals', 'contexts'
    ];

    for (const table of tables) {
      try {
        // Check if table exists and has organizationId column
        const columnCheck = await prisma.$queryRawUnsafe<Array<{ data_type: string }>>(`
          SELECT data_type FROM information_schema.columns
          WHERE table_name = '${table}' AND column_name = 'organizationId'
        `);

        if (columnCheck.length === 0) {
          logger.info(`Table ${table} does not have organizationId column, skipping RLS`);
          continue;
        }

        const columnType = columnCheck[0].data_type;
        const castExpression = columnType === 'uuid'
          ? `current_setting('app.current_org_id', true)::uuid`
          : `current_setting('app.current_org_id', true)`;

        // Enable RLS
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
        `);

        // Create organization isolation policy
        await prisma.$executeRawUnsafe(`
          DROP POLICY IF EXISTS ${table}_org_isolation ON "${table}";
        `);

        await prisma.$executeRawUnsafe(`
          CREATE POLICY ${table}_org_isolation ON "${table}"
          FOR ALL TO app_user
          USING ("organizationId" = ${castExpression});
        `);

        logger.info(`RLS enabled for table: ${table} (column type: ${columnType})`);
      } catch (error) {
        logger.warn(`Failed to setup RLS for ${table}:`, error);
      }
    }

    // Organizations table - users can only see their own organization
    try {
      // Check column type for organizations.id
      const orgColumnCheck = await prisma.$queryRawUnsafe<Array<{ data_type: string }>>(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'id'
      `);

      const orgIdType = orgColumnCheck.length > 0 ? orgColumnCheck[0].data_type : 'text';
      const orgCastExpression = orgIdType === 'uuid'
        ? `current_setting('app.current_org_id', true)::uuid`
        : `current_setting('app.current_org_id', true)`;

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
      `);

      await prisma.$executeRawUnsafe(`
        DROP POLICY IF EXISTS organizations_member_access ON "organizations";
      `);

      await prisma.$executeRawUnsafe(`
        CREATE POLICY organizations_member_access ON "organizations"
        FOR ALL TO app_user
        USING ("id" = ${orgCastExpression});
      `);

      logger.info(`RLS enabled for table: organizations (id type: ${orgIdType})`);
    } catch (error) {
      logger.warn('Failed to setup RLS for organizations:', error);
    }

    logger.info('Row Level Security setup completed');
  } catch (error) {
    logger.error('Failed to setup Row Level Security:', error);
    // Don't throw - RLS is optional, app can work without it
    logger.warn('RLS setup failed but continuing without it');
  }
};
