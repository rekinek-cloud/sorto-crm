import { z } from 'zod';

// Update organization schema
export const updateOrganizationSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Organization name contains invalid characters')
    .optional(),
  
  domain: z.string()
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/, 'Invalid domain format')
    .optional()
    .nullable(),
  
  settings: z.record(z.any())
    .optional(),
});

// Update user schema
export const updateUserSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/, 'First name contains invalid characters')
    .optional(),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/, 'Last name contains invalid characters')
    .optional(),
  
  role: z.enum(['MEMBER', 'MANAGER', 'ADMIN'])
    .optional(),
  
  settings: z.record(z.any())
    .optional(),
});

// User ID parameter schema
export const userIdParamSchema = z.object({
  userId: z.string()
    .uuid('Invalid user ID format'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .refine(val => val > 0, 'Page must be greater than 0'),
  
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  
  search: z.string()
    .optional(),
  
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'GUEST'])
    .optional(),
  
  isActive: z.string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
});

// Subscription update schema
export const updateSubscriptionSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
});

// Organization limits schema
export const updateLimitsSchema = z.object({
  max_users: z.number()
    .int()
    .min(-1, 'Max users must be -1 (unlimited) or positive')
    .optional(),
  
  max_streams: z.number()
    .int()
    .min(-1, 'Max streams must be -1 (unlimited) or positive')
    .optional(),
  
  max_tasks_per_user: z.number()
    .int()
    .min(-1, 'Max tasks per user must be -1 (unlimited) or positive')
    .optional(),
  
  max_projects: z.number()
    .int()
    .min(-1, 'Max projects must be -1 (unlimited) or positive')
    .optional(),
  
  max_storage_mb: z.number()
    .int()
    .min(0, 'Max storage must be positive')
    .optional(),
});

// Organization statistics query schema
export const statsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y'])
    .default('30d'),
  
  timezone: z.string()
    .optional()
    .default('UTC'),
});

// Bulk user operations schema
export const bulkUserOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete', 'change_role']),
  
  userIds: z.array(z.string().uuid())
    .min(1, 'At least one user ID is required')
    .max(50, 'Cannot operate on more than 50 users at once'),
  
  newRole: z.enum(['MEMBER', 'MANAGER', 'ADMIN'])
    .optional(),
});

// Export invitation schema
export const exportInvitationSchema = z.object({
  format: z.enum(['csv', 'xlsx'])
    .default('csv'),
  
  includeInactive: z.boolean()
    .default(false),
});

// TypeScript types
export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type UpdateSubscriptionRequest = z.infer<typeof updateSubscriptionSchema>;
export type UpdateLimitsRequest = z.infer<typeof updateLimitsSchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type BulkUserOperation = z.infer<typeof bulkUserOperationSchema>;
export type ExportInvitation = z.infer<typeof exportInvitationSchema>;
