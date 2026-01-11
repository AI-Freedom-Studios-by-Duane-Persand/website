import { ArgumentsHost, Catch, ExceptionFilter, HttpException, LoggerService } from '@nestjs/common';
import { Response, Request } from 'express';
import { winstonConfig } from '../logger';
import { WinstonModule } from 'nest-winston';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private static loggerInstance = WinstonModule.createLogger(winstonConfig);
  constructor(private readonly logger: LoggerService = AllExceptionsFilter.loggerInstance) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const rawMessage = exception instanceof HttpException ? exception.getResponse() : exception;

    // Build a user friendly message that is safe to surface to the UI.
    const defaultFriendly = 'Something went wrong. Please try again.';
    const friendlyByStatus: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Please sign in to continue.',
      402: 'Payment or quota limit reached. Please upgrade or add credits.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'We hit a temporary issue. Please try again shortly.',
    };

    let message: any = rawMessage;
    let userFriendlyMessage = friendlyByStatus[status] || defaultFriendly;
    let userFriendlyFromException = false;
    let validationErrors: any = undefined;

    if (typeof rawMessage === 'object' && rawMessage !== null) {
      // Extract validation errors from BadRequestException response
      if ((rawMessage as any).errors && Array.isArray((rawMessage as any).errors)) {
        validationErrors = (rawMessage as any).errors;
      }
      
      // Check if response has userFriendlyMessage - use it if available
      if ((rawMessage as any).userFriendlyMessage && typeof (rawMessage as any).userFriendlyMessage === 'string') {
        userFriendlyMessage = (rawMessage as any).userFriendlyMessage;
        userFriendlyFromException = true;
      }
      
      // Nest HttpException can return { message: string | string[] }
      const extracted = (rawMessage as any).message;
      if (Array.isArray(extracted)) {
        message = extracted.join(', ');
      } else if (typeof extracted === 'string') {
        message = extracted;
      }
    }

    // Also check exception object for preserved validation errors
    if (!validationErrors && (exception as any).validationErrors) {
      validationErrors = (exception as any).validationErrors;
    }

    if (!userFriendlyFromException && typeof message === 'string' && message.trim().length > 0) {
      userFriendlyMessage = friendlyByStatus[status] || message;
    }

    // Enhanced logging: log all error properties
    const method = request.method;
    const url = request.url;
    let errorDetails = {};
    if (exception instanceof Error) {
      errorDetails = {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      };
    } else {
      errorDetails = { exception };
    }
    console.error(`[AllExceptionsFilter] Exception for ${method} ${url} - status: ${status}`, errorDetails);
    if (method === 'OPTIONS') {
      console.error('[AllExceptionsFilter] OPTIONS request received. Exception:', errorDetails);
    }
    this.logger.error(
      `Exception: ${JSON.stringify(errorDetails)}`,
      exception instanceof Error ? exception.stack : '',
      'AllExceptionsFilter',
    );

    const responseBody: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: url,
      message,
      userFriendlyMessage,
    };

    // Include validation errors if present
    if (validationErrors) {
      responseBody.errors = validationErrors;
    }

    // Only include verbose details in non-production to avoid leaking internal information.
    if (process.env.NODE_ENV !== 'production') {
      responseBody.errorDetails = errorDetails;
    }

    response.status(status).json(responseBody);
  }
}
