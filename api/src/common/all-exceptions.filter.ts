import { ArgumentsHost, Catch, ExceptionFilter, HttpException, LoggerService } from '@nestjs/common';
import { Response } from 'express';
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
    const message = exception instanceof HttpException ? exception.getResponse() : exception;

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
      errorDetails,
    });
  }
}
