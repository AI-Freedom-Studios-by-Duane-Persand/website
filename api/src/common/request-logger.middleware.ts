import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { winstonConfig } from '../logger';
import { WinstonModule } from 'nest-winston';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Detailed logging for all requests
    const { method, originalUrl, ip } = req;
    const start = Date.now();
    console.log(`[RequestLoggerMiddleware] ${method} ${originalUrl} from ${ip}`);
    if (method === 'OPTIONS') {
      console.log('[RequestLoggerMiddleware] OPTIONS request detected, passing through.');
      return next();
    }
    res.on('finish', () => {
      const duration = Date.now() - start;
      const loggerInstance = WinstonModule.createLogger(winstonConfig);
      loggerInstance.log('info', `${method} ${originalUrl} ${res.statusCode} - ${duration}ms`, {
        context: 'RequestLogger',
        meta: {
          ip,
          userAgent: req.headers['user-agent'],
        },
      });
      console.log(`[RequestLoggerMiddleware] ${method} ${originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  }
}
