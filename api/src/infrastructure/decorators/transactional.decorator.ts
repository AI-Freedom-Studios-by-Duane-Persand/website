/**
 * @Transactional Decorator
 * 
 * Automatically manages Mongoose sessions for database transactions.
 * Wraps service methods to:
 * - Start a session before execution
 * - Begin a transaction
 * - Auto-commit on success
 * - Auto-rollback on error
 * - Inject session as a parameter to the service method
 * 
 * Usage:
 * @Transactional()
 * async createCampaign(createDto: CreateCampaignDto, session?: ClientSession): Promise<Campaign> {
 *   // session is automatically injected
 * }
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Connection, ClientSession } from 'mongoose';

// Type-safe method decorator factory
export function Transactional() {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    // Wrap the original method
    descriptor.value = async function (this: any, ...args: any[]) {
      // Access the Connection from NestJS DI container
      // This assumes the service has a Connection instance injected
      const connection: Connection = this.connection;
      
      if (!connection) {
        throw new Error(
          `@Transactional decorator requires a 'connection' property on the service. ` +
          `Inject MongooseConnection via: @Inject(getConnectionToken()) private readonly connection: Connection`
        );
      }

      let session: ClientSession | undefined;
      try {
        // Create a session
        session = await connection.startSession();
        
        // Start a transaction on the session
        session.startTransaction();

        // Inject session as the last parameter if not already provided
        const hasSessionParam = args.length > 0 && args[args.length - 1]?.session;
        if (!hasSessionParam) {
          args.push({ session });
        } else {
          // Replace the session-containing parameter with proper session
          args[args.length - 1] = { ...args[args.length - 1], session };
        }

        // Execute the original method
        const result = await originalMethod.apply(this, args);

        // Commit the transaction
        await session.commitTransaction();

        return result;
      } catch (error) {
        // Rollback the transaction on any error
        if (session) {
          await session.abortTransaction();
        }
        throw error;
      } finally {
        // Always end the session
        if (session) {
          await session.endSession();
        }
      }
    };

    return descriptor;
  };
}

/**
 * Alternative: Transactional Method Decorator with explicit return type
 * Use this if you need better type safety and IDE support
 * 
 * Usage:
 * @Transactional<Campaign>()
 * async createCampaign(dto: CreateCampaignDto, context?: TransactionContext): Promise<Campaign>
 */
export interface TransactionContext {
  session?: ClientSession;
}

export function TransactionalMethod<T = any>() {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]): Promise<T> {
      const connection: Connection = this.connection;
      
      if (!connection) {
        throw new Error(
          `@TransactionalMethod decorator requires a 'connection' property on the service. ` +
          `Inject MongooseConnection via: @Inject(getConnectionToken()) private readonly connection: Connection`
        );
      }

      let session: ClientSession | undefined;
      try {
        session = await connection.startSession();
        session.startTransaction();

        // Inject session into the last parameter object
        if (args.length > 0 && typeof args[args.length - 1] === 'object') {
          args[args.length - 1] = { ...args[args.length - 1], session };
        } else {
          args.push({ session });
        }

        const result: T = await originalMethod.apply(this, args);
        await session.commitTransaction();
        return result;
      } catch (error) {
        if (session) {
          await session.abortTransaction();
        }
        throw error;
      } finally {
        if (session) {
          await session.endSession();
        }
      }
    };

    return descriptor;
  };
}

/**
 * Transactional Options for advanced control
 */
export interface TransactionalOptions {
  isolationLevel?: 'local' | 'available' | 'majority' | 'snapshot';
  timeout?: number;
  retryOnError?: boolean;
  maxRetries?: number;
}

/**
 * Advanced: Transactional decorator with options
 * 
 * Usage:
 * @TransactionalWithOptions({ isolationLevel: 'majority', maxRetries: 3 })
 * async criticalOperation(data: any, context?: TransactionContext): Promise<void>
 */
export function TransactionalWithOptions(options: TransactionalOptions = {}) {
  const {
    isolationLevel = 'snapshot',
    timeout = 30000,
    retryOnError = true,
    maxRetries = 3,
  } = options;

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const connection: Connection = this.connection;
      
      if (!connection) {
        throw new Error(
          `@TransactionalWithOptions decorator requires a 'connection' property on the service. ` +
          `Inject MongooseConnection via: @Inject(getConnectionToken()) private readonly connection: Connection`
        );
      }

      let retries = 0;
      let lastError: Error | undefined;

      while (retries < maxRetries) {
        let session: ClientSession | undefined;
        try {
          session = await connection.startSession();
          // Start transaction without isolationLevel parameter (use default)
          await session.startTransaction();

          // Inject session
          if (args.length > 0 && typeof args[args.length - 1] === 'object') {
            args[args.length - 1] = { ...args[args.length - 1], session };
          } else {
            args.push({ session });
          }

          const result = await originalMethod.apply(this, args);
          await session.commitTransaction();
          return result;
        } catch (error) {
          lastError = error as Error;
          if (session) {
            await session.abortTransaction();
          }

          // Check if error is retryable (e.g., WriteConflict)
          if (retryOnError && retries < maxRetries - 1) {
            const isRetryable =
              error instanceof Error &&
              (error.message.includes('WriteConflict') ||
               error.message.includes('TransientTransactionError'));
            
            if (isRetryable) {
              retries++;
              // Wait before retry (exponential backoff)
              await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 100));
              continue;
            }
          }

          throw error;
        } finally {
          if (session) {
            await session.endSession();
          }
        }
      }

      // If all retries exhausted
      throw new Error(
        `@TransactionalWithOptions: Transaction failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
      );
    };

    return descriptor;
  };
}

/**
 * Composite decorator for common patterns
 * Combines transaction management with error handling
 */
export function SafeTransactional(options: TransactionalOptions = {}) {
  return TransactionalWithOptions({
    retryOnError: true,
    maxRetries: 3,
    ...options,
  });
}
