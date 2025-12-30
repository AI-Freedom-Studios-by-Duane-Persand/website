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
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'We hit a temporary issue. Please try again shortly.',
    };

    let message: any = rawMessage;
    let userFriendlyMessage = friendlyByStatus[status] || defaultFriendly;

    if (typeof rawMessage === 'object' && rawMessage !== null) {
      // Nest HttpException can return { message: string | string[] }
      const extracted = (rawMessage as any).message;
      if (Array.isArray(extracted)) {
        message = extracted.join(', ');
      } else if (typeof extracted === 'string') {
        message = extracted;
      }
    }

    if (typeof message === 'string' && message.trim().length > 0) {
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

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: url,
      message,
      userFriendlyMessage,
      // Only include verbose details in non-production to avoid leaking internal information.
      ...(process.env.NODE_ENV === 'production' ? {} : { errorDetails }),
    });
  }
}
