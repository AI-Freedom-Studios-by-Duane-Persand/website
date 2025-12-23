import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(HttpStatus.BAD_REQUEST, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(HttpStatus.NOT_FOUND, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(HttpStatus.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(HttpStatus.FORBIDDEN, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message);
  }
}

export class ExternalServiceError extends AppError {
  constructor(serviceName: string, originalError?: Error) {
    const message = `External service '${serviceName}' error: ${originalError?.message || 'Unknown error'}`;
    super(HttpStatus.SERVICE_UNAVAILABLE, message);
  }
}

/**
 * Error handler utility for consistent error logging and response
 */
export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');

  static handle(error: Error, context?: string): never {
    this.logger.error(
      `Error in ${context || 'unknown context'}: ${error.message}`,
      error.stack,
    );

    if (error instanceof AppError) {
      throw new HttpException(
        {
          statusCode: error.statusCode,
          message: error.message,
          error: error.name,
        },
        error.statusCode,
      );
    }

    // Handle Mongoose errors
    if (error.name === 'ValidationError') {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (error.name === 'CastError') {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid ID format',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generic error
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static async handleAsync<T>(
    fn: () => Promise<T>,
    context?: string,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error as Error, context);
    }
  }
}

/**
 * Type guard for error objects
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }
  return 'Unknown error occurred';
}

/**
 * Create detailed error context for logging
 */
export interface ErrorContext {
  operation: string;
  userId?: string;
  tenantId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export function logError(error: Error, context: ErrorContext): void {
  const logger = new Logger(context.operation);
  logger.error(
    `Error: ${error.message}`,
    {
      ...context,
      errorName: error.name,
      errorStack: error.stack,
    },
  );
}
