/**
 * Tenant Context Manager
 * 
 * Provides request-scoped tenant ID extraction and management.
 * Integrates with NestJS REQUEST scope to automatically extract tenant from JWT or headers.
 * 
 * Usage:
 * - Constructor injection: constructor(private tenantContext: TenantContextService) { }
 * - Access tenant: this.tenantContext.getTenantId() // returns current tenant ID
 * - In queries: { tenantId: this.tenantContext.getTenantId() }
 */

import {
  Injectable,
  Scope,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Represents the current request context with tenant information
 */
export interface RequestContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  isAdmin?: boolean;
  metadata?: Record<string, any>;
}

/**
 * TenantContextService - Request-scoped service
 * Automatically extracts tenant ID from JWT token in the request context
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private context: RequestContext | null = null;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.initializeContext();
  }

  /**
   * Initialize the tenant context from the request
   * Extracts tenant ID from JWT token attached to the request
   */
  private initializeContext(): void {
    try {
      // Get the JWT payload from the request (set by JwtAuthGuard)
      const user = (this.request as any).user as JwtPayload | undefined;

      if (!user || !user.tenantId) {
        throw new HttpException(
          'Tenant context not available. Ensure JwtAuthGuard is applied to the route.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      this.context = {
        tenantId: user.tenantId,
        userId: user.sub, // JWT standard 'sub' claim
        userRole: user.role,
        userEmail: user.email,
        isAdmin: user.isAdmin || false,
        metadata: user.metadata,
      };
    } catch (error) {
      // Context will be null if JWT is not available
      // This is handled explicitly in getTenantId()
    }
  }

  /**
   * Get the current tenant ID
   * Throws if tenant context is not available
   */
  getTenantId(): string {
    if (!this.context) {
      throw new HttpException(
        'Tenant ID not found in request context. Ensure the request is authenticated.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.context.tenantId;
  }

  /**
   * Get the current user ID
   * Returns undefined if not available
   */
  getUserId(): string | undefined {
    return this.context?.userId;
  }

  /**
   * Get the full request context
   */
  getContext(): RequestContext {
    if (!this.context) {
      throw new HttpException(
        'Request context not available. Ensure the request is authenticated.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.context;
  }

  /**
   * Get the full request context or null if unavailable
   * Useful for optional tenant operations
   */
  getContextOrNull(): RequestContext | null {
    return this.context;
  }

  /**
   * Check if tenant context is available
   */
  hasContext(): boolean {
    return this.context !== null;
  }

  /**
   * Check if the user is an admin
   */
  isAdmin(): boolean {
    return this.context?.isAdmin || false;
  }

  /**
   * Get user role
   */
  getUserRole(): string | undefined {
    return this.context?.userRole;
  }

  /**
   * Get user email
   */
  getUserEmail(): string | undefined {
    return this.context?.userEmail;
  }

  /**
   * Get custom metadata attached to the JWT
   */
  getMetadata<T = any>(key: string): T | undefined {
    return this.context?.metadata?.[key];
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string | string[]): boolean {
    if (!this.context?.userRole) {
      return false;
    }
    return Array.isArray(role)
      ? role.includes(this.context.userRole)
      : this.context.userRole === role;
  }

  /**
   * Create a scoped filter object for database queries
   * Usage: const filter = this.tenantContext.createScopedFilter({ name: 'Test' });
   * Result: { tenantId: 'xxx', name: 'Test' }
   */
  createScopedFilter<T extends Record<string, any>>(filter?: T): T & { tenantId: string } {
    return {
      ...filter,
      tenantId: this.getTenantId(),
    } as T & { tenantId: string };
  }

  /**
   * Ensure tenant ID matches between request context and provided tenant ID
   * Prevents users from accessing other tenants' data
   */
  ensureTenantMatch(providedTenantId: string): void {
    const contextTenantId = this.getTenantId();
    if (contextTenantId !== providedTenantId) {
      throw new HttpException(
        'Tenant ID mismatch. Access denied.',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}

/**
 * Factory for creating a scoped tenant filter
 * Usage in middleware or pipes:
 * const filter = createTenantFilter(tenantId, additionalFilter);
 */
export function createTenantFilter<T extends Record<string, any>>(
  tenantId: string,
  additionalFilter?: T,
): T & { tenantId: string } {
  return {
    ...additionalFilter,
    tenantId,
  } as T & { tenantId: string };
}

/**
 * Options for tenant context validation
 */
export interface TenantContextOptions {
  allowMissing?: boolean; // If true, allows getTenantId() to return null instead of throwing
  throwOnMissing?: boolean; // If true (default), throws error when tenant is missing
  scopeToTenantId?: string; // Force scope to specific tenant ID
}

/**
 * Advanced: TenantContextService with configurable behavior
 */
@Injectable({ scope: Scope.REQUEST })
export class ConfigurableTenantContextService extends TenantContextService {
  private options: TenantContextOptions;

  constructor(
    @Inject(REQUEST) request: Request,
    @Inject('TENANT_CONTEXT_OPTIONS') options: TenantContextOptions = {},
  ) {
    super(request);
    this.options = {
      allowMissing: false,
      throwOnMissing: true,
      ...options,
    };
  }

  /**
   * Override getTenantId to respect configuration options
   */
  override getTenantId(): string {
    if (this.options.scopeToTenantId) {
      return this.options.scopeToTenantId;
    }

    try {
      return super.getTenantId();
    } catch (error) {
      if (this.options.allowMissing) {
        return ''; // Return empty string instead of throwing
      }
      throw error;
    }
  }
}
