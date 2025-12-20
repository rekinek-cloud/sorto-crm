import { User, Organization } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        organizationId: string;
        firstName: string;
        lastName: string;
      };
      organization?: {
        id: string;
        name: string;
        slug: string;
        limits: any;
      };
    }
  }
}

export {};