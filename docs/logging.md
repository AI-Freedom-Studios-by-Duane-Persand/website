# Logging Strategy for AI Freedom Studios

## Overview
This document describes the logging approach for the backend (NestJS) and, optionally, the frontend (Next.js) of AI Freedom Studios. It covers logger setup, request/response logging, error logging, and best practices for observability and security.

## Logger Setup
- Uses Winston (via nest-winston) for structured, production-grade logging.
- Logger is globally registered in the NestJS app (`main.ts`).
- All logs include timestamp, log level, context, and message.

## Request/Response Logging
- All incoming HTTP requests are logged via `RequestLoggerMiddleware`.
- Logs include method, URL, status code, duration, IP, and user agent.
- Middleware is applied globally in `AppModule`.

## Error Logging
- All unhandled exceptions are logged by `AllExceptionsFilter`.
- Logs include error message, stack trace, and request path.
- Filter is registered globally in `main.ts`.

## Service/Controller Logging
- For critical actions (auth, billing, external API calls, background jobs), use `winstonLogger.log()` or `winstonLogger.error()` directly in services/controllers.
- Example:
  ```ts
  winstonLogger.log('info', 'User signed up', { context: 'AuthService', meta: { userId } });
  winstonLogger.error('Stripe payment failed', error.stack, 'BillingService');
  ```

## Log Redaction & Security
- Never log sensitive data (passwords, secrets, PII).
- Redact or omit such fields in logs.

## Log Persistence
- By default, logs are output to the console.
- For production, configure Winston to also write to files or a log aggregation service (e.g., Datadog, Loggly, CloudWatch).

## Frontend Logging (Optional)
- For critical frontend errors, use a service like Sentry or log to the backend via an API endpoint.

## Further Enhancements
- Add correlation IDs for tracing requests across services.
- Integrate with error monitoring (Sentry, Rollbar).
- Add log rotation and retention policies.

---
For implementation details, see `api/src/logger.ts`, `api/src/common/request-logger.middleware.ts`, and `api/src/common/all-exceptions.filter.ts`.
