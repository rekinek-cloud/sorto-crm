import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import logger from '../../config/logger';
import config from '../../config';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Prisma errors
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2000':
      return new AppError('Input value too long', 400, 'INPUT_TOO_LONG');
    case 'P2001':
      return new AppError('Record not found', 404, 'NOT_FOUND');
    case 'P2002':
      const field = error.meta?.target as string[];
      return new AppError(
        `${field?.join(', ') || 'Field'} already exists`,
        409,
        'DUPLICATE_ENTRY'
      );
    case 'P2003':
      return new AppError('Foreign key constraint failed', 400, 'FOREIGN_KEY_ERROR');
    case 'P2004':
      return new AppError('Database constraint failed', 400, 'CONSTRAINT_ERROR');
    case 'P2025':
      return new AppError('Record not found', 404, 'NOT_FOUND');
    default:
      logger.error('Unhandled Prisma error:', error);
      return new AppError('Database error occurred', 500, 'DATABASE_ERROR');
  }
};

/**
 * Handle Zod validation errors
 */
const handleZodError = (error: ZodError): AppError => {
  const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
  return new AppError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
};

/**
 * Send error response
 */
const sendErrorResponse = (error: AppError, req: Request, res: Response): void => {
  const response: any = {
    error: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Add stack trace in development
  if (config.IS_DEVELOPMENT) {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Handle different types of errors
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof ZodError) {
    appError = handleZodError(error);
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  } else {
    // Log unexpected errors
    logger.error('Unexpected error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    });

    appError = new AppError(
      config.IS_PRODUCTION ? 'Something went wrong' : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  sendErrorResponse(appError, req, res);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  
  sendErrorResponse(error, req, res);
};

/**
 * Async error handler wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error classes
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}