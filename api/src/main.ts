import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { winstonConfig } from './logger';
import { WinstonModule } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';

config(); // Load .env variables

async function bootstrap() {
  console.log('[main.ts] Bootstrapping NestJS API...');
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });
  // Add cookie-parser middleware before any auth logic
  app.use(cookieParser());
  // Add global fallback handler for OPTIONS requests FIRST
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 204,
  };
  // Explicitly handle OPTIONS for all /api/* routes before any other middleware
  // Enable CORS with default settings (allows all origins in development)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });
  // Set global prefix after CORS
  app.setGlobalPrefix('api');
  console.log('[main.ts] Setting global prefix to /api...');

  // Add global fallback handler for OPTIONS requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', corsOptions.origin);
      res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
      res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
      res.header('Access-Control-Allow-Credentials', String(corsOptions.credentials));
      return res.sendStatus(corsOptions.optionsSuccessStatus || 204);
    }
    next();
  });
  // Register global exception filter for error logging
  console.log('[main.ts] Registering AllExceptionsFilter...');
  const { AllExceptionsFilter } = await import('./common/all-exceptions.filter');
  const loggerInstance = WinstonModule.createLogger(winstonConfig);
  app.useGlobalFilters(new AllExceptionsFilter(loggerInstance));
  // Enable global validation pipe
  console.log('[main.ts] Enabling global ValidationPipe...');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
   // --- R2 config seeding now handled in R2ConfigSeedService.onApplicationBootstrap ---
  const port = process.env.PORT || 3001;
  await app.listen(port);
  loggerInstance.log('info', `API running on port ${port}`);
  console.log(`[main.ts] API running on port ${port}`);
}

bootstrap();
